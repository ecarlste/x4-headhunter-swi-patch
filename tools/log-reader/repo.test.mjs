// The known-harmless list has one copy, known-harmless.json, each entry with its note, and the
// checklist's failure rule runs the reader instead of holding its own list.
// Run: node --test tools/log-reader/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { REPO } from '../offline-check/paths.mjs';

const here = path.dirname(new URL(import.meta.url).pathname);
const list = JSON.parse(fs.readFileSync(path.join(here, 'known-harmless.json'), 'utf8'));
const checklist = fs.readFileSync(path.join(REPO, 'docs/verification.md'), 'utf8');
const failureRule = /^## Failure rule\n([\s\S]*?)^## /m.exec(checklist)?.[1] ?? '';

test('every known-harmless entry has a match, the line, where it comes from and why it is harmless', () => {
    assert.ok(list.length > 0);
    for (const entry of list) {
        for (const key of ['match', 'line', 'where', 'why']) {
            assert.equal(typeof entry[key], 'string', `${JSON.stringify(entry)}: ${key}`);
            assert.ok(entry[key].trim(), `${JSON.stringify(entry)}: empty ${key}`);
        }
        new RegExp(entry.match);
    }
});

test("the checklist's failure rule says to run the reader and points at the list, holding no copy of it", () => {
    assert.match(failureRule, /npm run log/);
    assert.match(failureRule, /tools\/log-reader\/known-harmless\.json/);
    for (const entry of list) assert.ok(!checklist.includes(entry.why), `docs/verification.md still holds: ${entry.why}`);
    assert.doesNotMatch(checklist, /Evaluated value 'null' is not a string/);
});

test('npm run log runs the reader', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8'));
    assert.equal(pkg.scripts.log, 'node tools/log-reader/cli.mjs');
});
