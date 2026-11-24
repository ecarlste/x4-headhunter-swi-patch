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
