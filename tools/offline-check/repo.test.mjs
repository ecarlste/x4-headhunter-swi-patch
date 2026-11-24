// The real check: this repo's patch (and the check helper, once it exists) against the installed
// Head Hunter 2.0.8 at HH_PATH. Skipped where Head Hunter isn't installed.
// Run: node --test tools/offline-check/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_HH_PATH, REPO } from './paths.mjs';

const here = path.dirname(new URL(import.meta.url).pathname);
const hhPath = process.env.HH_PATH || DEFAULT_HH_PATH;
const installed = fs.existsSync(path.join(hhPath, 'content.xml'));

test("the patch and the helper are well-formed and every sel matches one node in Head Hunter 2.0.8", { skip: !installed && `Head Hunter not installed at ${hhPath}` }, () => {
    const version = /<content[^>]*\sversion="(\d+)"/.exec(fs.readFileSync(path.join(hhPath, 'content.xml'), 'utf8'))?.[1];
    assert.equal(version, '208', `the patch targets Head Hunter 2.0.8; ${hhPath} is version ${version}`);
    const r = spawnSync(process.execPath, [path.join(here, 'cli.mjs')], { cwd: REPO, encoding: 'utf8', env: { ...process.env, HH_PATH: hhPath } });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /^ok {2}patch\/hh_swi_patch: \d+ XML files read$/m);
    assert.match(r.stdout, /^ok {2}checks\/hh_swi_checks: content\.xml: id hh_swi_checks, off by default, requires hh_swi_patch/m);
    assert.match(r.stdout, /^ok {2}checks\/hh_swi_checks: md\/hh_swi_checks\.xml: mdscript HH_SWI_Checks, /m);
    // the radar mod's guarded re-add (#25): it runs when SWI's replace wiped Head Hunter's entry,
    // and is skipped when Head Hunter's survived; either way the entry exists once
    const radar = `//radarrange\\[@ware='mod_ship_radarrange_01_mk1_headhunter'\\]`;
    assert.match(r.stdout, new RegExp(`^ok {2}patch/hh_swi_patch: libraries/equipmentmods\\.xml: .* matches 1 node in Head Hunter before SWI; after it, ${radar} matches 1 node$`, 'm'));
    assert.match(r.stdout, new RegExp(`^ok {2}patch/hh_swi_patch: libraries/equipmentmods\\.xml: .*: skipped in SWI before Head Hunter \\(its if is false\\); ${radar} matches 1 node$`, 'm'));
    // the two intentional copies of Head Hunter's code (#33), each with its hh-copy reason
    assert.match(r.stdout, /^ok {2}patch\/hh_swi_patch: libraries\/equipmentmods\.xml: .*: copies <radarrange> from Head Hunter \(hh-copy: .+\)$/m);
    assert.match(r.stdout, /^ok {2}patch\/hh_swi_patch: extensions\/chillheadhunter\/md\/headhuntermd\.xml: <add sel="\/\/cue\[@name='Speaky'\]\/actions">: copies <start_script> from Head Hunter \(hh-copy: .+\)$/m);
});
