// Tests for the log reader (the checklist's failure rule), on hand-written fixture logs.
// The reader only reads: the logs here are fixtures in this folder.
// Run: node --test tools/log-reader/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const cli = path.join(here, 'cli.mjs');
const fixture = (name) => path.join(here, 'fixtures', name);

const run = (args, env = {}) => {
    const r = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', env: { ...process.env, ...env } });
    return { code: r.status, out: r.stdout, err: r.stderr };
};

test('a clean log passes and prints its [hh-swi-check] lines in order', () => {
    const r = run([fixture('clean.txt')]);
    assert.equal(r.code, 0, r.out + r.err);
    const checks = r.out.split('\n').filter((l) => l.includes('[hh-swi-check]'));
    assert.deepEqual(checks.map((l) => /\[hh-swi-check\] ([^:]+):/.exec(l)[1]), ['make wanted', 'wanted table', 'wanted']);
    assert.match(r.out, /^8: .*\[hh-swi-check\] make wanted: \[0x1a2b\]/m);
    assert.match(r.out, /^0 failing$/m);
});

test("with no path it reads profile 90000401's debuglog.txt under X4_PROFILE_ROOT, and writes nothing there", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hh-log-reader-'));
    const profile = path.join(root, '90000401');
    fs.mkdirSync(profile);
    fs.copyFileSync(fixture('errors.txt'), path.join(profile, 'debuglog.txt'));
    const before = fs.readdirSync(profile);
    const r = run([], { X4_PROFILE_ROOT: root });
    assert.equal(r.code, 1, r.out + r.err);
    assert.match(r.out, new RegExp(`^reading ${path.join(profile, 'debuglog.txt').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'));
    assert.match(r.out, /^4 failing$/m);
    assert.deepEqual(fs.readdirSync(profile), before);
    assert.equal(fs.readFileSync(path.join(profile, 'debuglog.txt'), 'utf8'), fs.readFileSync(fixture('errors.txt'), 'utf8'));
});

test("a log that isn't there is an error, not a pass", () => {
    const r = run([path.join(os.tmpdir(), 'hh-log-reader-no-such-dir', 'debuglog.txt')]);
    assert.equal(r.code, 2, r.out + r.err);
    assert.match(r.err, /no-such-dir.*debuglog\.txt not found/);
    assert.doesNotMatch(r.out, /failing/);
});

test('unlisted Head Hunter, patch and helper errors fail the run, each printed with its context lines', () => {
    const r = run([fixture('errors.txt')]);
    assert.equal(r.code, 1, r.out + r.err);
    assert.match(r.out, /^FAIL 2: .*No matching node .* in patch file 'extensions\\hh_swi_patch\\/m);
    assert.match(r.out, /^FAIL 5: .*Error in MD cue md\.HeadHunterHunted\.HuntersCreated: /m);
    assert.match(r.out, /^ {5}\* Action: <create_order>, line 212$/m);
    assert.match(r.out, /^FAIL 11: .*Error in MD cue md\.HH_SWI_Checks\.ForceBail: /m);
    assert.match(r.out, /^9: .*\[hh-swi-check\] send hunters: /m);
    // the same cue as the known-harmless line, but another error: not harmless
    assert.match(r.out, /^FAIL 14: .*md\.HeadHunterMD\.SCapturedHandler: Property lookup failed/m);
    assert.match(r.out, /^4 failing$/m);
});

test("the known-harmless text=\"null\" lines don't fail the run, and are listed with why they're harmless", () => {
    const r = run([fixture('harmless.txt')]);
    assert.equal(r.code, 0, r.out + r.err);
    assert.doesNotMatch(r.out, /^FAIL/m);
    assert.match(r.out, /^harmless 5: .*md\.HeadHunterMD\.SCapturedHandler<inst:1c038d>: Evaluated value 'null' is not a string$/m);
    assert.match(r.out, /^harmless 11: .*md\.HeadHunterMD\.LCapturedHandler: Evaluated value 'null' is not a string$/m);
    assert.match(r.out, /clears the ship's map label with a null text/);
    const checks = r.out.split('\n').filter((l) => l.includes('[hh-swi-check]'));
    assert.deepEqual(checks.map((l) => l.split(':')[0]), ['3', '9']);
    assert.match(r.out, /^0 failing$/m);
});
