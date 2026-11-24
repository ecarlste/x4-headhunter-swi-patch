// Tests for the offline checker's command line, on hand-written fixtures in temp dirs.
// Run: node --test tools/offline-check/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const cli = path.join(here, 'cli.mjs');

function tree(files) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hh-offline-cli-'));
    for (const [rel, text] of Object.entries(files)) {
        fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
        fs.writeFileSync(path.join(root, rel), text);
    }
    return root;
}

const run = (args, env = {}) => {
    const r = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', env: { ...process.env, ...env } });
    return { code: r.status, out: r.stdout, err: r.stderr };
};

const hh = () => tree({ 'md/hunted.xml': `<mdscript name="H"><cues><cue name="Init"><actions/></cue></cues></mdscript>` });

test('passes when every extension given is well-formed and its chillheadhunter diffs match one node each', () => {
    const ext = tree({
        'content.xml': '<content id="p"/>',
        'extensions/chillheadhunter/md/hunted.xml': `<diff><add sel="//cue[@name='Init']/actions"/></diff>`,
    });
    const r = run([ext], { HH_PATH: hh() });
    assert.equal(r.code, 0, r.out + r.err);
    assert.match(r.out, /matches 1 node in chillheadhunter\/md\/hunted\.xml/);
    assert.match(r.out, /0 bad/);
});

test('fails, listing each bad line, when a diff misses or a file is broken', () => {
    const ext = tree({
        'content.xml': '<content id="p">',
        'extensions/chillheadhunter/md/hunted.xml': `<diff><add sel="//cue[@name='Gone']"/></diff>`,
    });
    const r = run([ext], { HH_PATH: hh() });
    assert.equal(r.code, 1);
    assert.match(r.out, /BAD .*content\.xml: /);
    assert.match(r.out, /BAD .*matches 0 nodes in chillheadhunter\/md\/hunted\.xml/);
    assert.match(r.out, /2 bad/);
});

test('fails when Head Hunter is not installed where HH_PATH says', () => {
    const ext = tree({ 'extensions/chillheadhunter/md/hunted.xml': `<diff><add sel="/a"/></diff>` });
    const r = run([ext], { HH_PATH: path.join(os.tmpdir(), 'no-such-hh-install') });
    assert.equal(r.code, 1);
    assert.match(r.out, /chillheadhunter isn't installed at .*no-such-hh-install/);
});

test('skips an extension folder that does not exist yet, saying so', () => {
    const r = run([path.join(os.tmpdir(), 'no-such-ext')], { HH_PATH: hh() });
    assert.equal(r.code, 0, r.out + r.err);
    assert.match(r.out, /no-such-ext: not there yet, skipped/);
});

const xsd = () => tree({
    'md.xsd': '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"><xs:element name="mdscript"/><xs:element name="cues"/></xs:schema>',
    'common.xsd': '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"/>',
});

test("checks the helper's and the patch's content.xml by folder name: the helper must require the patch", () => {
    const parent = tree({
        'hh_swi_checks/content.xml': '<content id="hh_swi_checks" enabled="0"><dependency id="ws_2042901274"/></content>',
    });
    const r = run([path.join(parent, 'hh_swi_checks')], { HH_PATH: hh(), X4_XSD_PATH: xsd() });
    assert.equal(r.code, 1);
    assert.match(r.out, /BAD .*content\.xml: no dependency on hh_swi_patch/);
});

test("checks libraries/equipmentmods.xml on vanilla (X4_PATH) + Timelines, with Head Hunter's and SWI's (SWI_PATH) diffs in either order", () => {
    const x4 = tree({
        'base/libraries/equipmentmods.xml': '<equipmentmods><engine/><ship><hull ware="v"/></ship></equipmentmods>',
        'ego_dlc_timelines/libraries/equipmentmods.xml': '<diff><add sel="/equipmentmods/engine"><travel ware="t"/></add></diff>',
    });
    const swi = tree({ 'libraries/equipmentmods.xml': '<diff><replace sel="/equipmentmods"><equipmentmods><ship><hull ware="s"/></ship></equipmentmods></replace></diff>' });
    const hhWithMod = tree({ 'libraries/equipmentmods.xml': '<diff><add sel="//equipmentmods/ship"><radar ware="hh"/></add></diff>' });
    const ext = tree({ 'libraries/equipmentmods.xml': `<diff><add sel="/equipmentmods/ship" if="not(//radar[@ware='hh'])"><radar ware="hh"/></add></diff>` });
    const r = run([ext], { HH_PATH: hhWithMod, X4_PATH: x4, SWI_PATH: swi });
    assert.equal(r.code, 0, r.out + r.err);
    assert.match(r.out, /ok {2}.*matches 1 node in Head Hunter before SWI; after it, \/\/radar\[@ware='hh'\] matches 1 node/);
    assert.match(r.out, /ok {2}.*skipped in SWI before Head Hunter \(its if is false\); \/\/radar\[@ware='hh'\] matches 1 node/);
    const noSwi = run([ext], { HH_PATH: hhWithMod, X4_PATH: x4, SWI_PATH: path.join(os.tmpdir(), 'no-such-swi') });
    assert.equal(noSwi.code, 1);
    assert.match(noSwi.out, /BAD .*no-such-swi.* isn't there/);
});

test("checks an extension's own MD scripts against X4's schema at X4_XSD_PATH", () => {
    const ext = tree({ 'md/mine.xml': '<mdscript name="Mine"><cues><cue name="A"/></cues></mdscript>' });
    const r = run([ext], { HH_PATH: hh(), X4_XSD_PATH: xsd() });
    assert.equal(r.code, 1);
    assert.match(r.out, /BAD .*md\/mine\.xml: <cue> is not an element in X4's md\.xsd/);
    const missing = run([ext], { HH_PATH: hh(), X4_XSD_PATH: path.join(os.tmpdir(), 'no-such-xsd') });
    assert.equal(missing.code, 1);
    assert.match(missing.out, /BAD .*X4's md\.xsd isn't at .*no-such-xsd/);
});
