// Tests for .githooks/pre-commit, the pre-commit guardrail (#31), run through real `git commit`s in
// a temp repo whose npm test and npm run check are stubs that pass or fail on demand.
// Run: node --test tools/hooks/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { REPO } from '../offline-check/paths.mjs';

const hooks = path.join(REPO, '.githooks');

// git's own variables are dropped: when this test runs inside the hook, they point at this repo
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));

function git(dir, args, extra = {}) {
    const r = spawnSync('git', args, {
        cwd: dir,
        encoding: 'utf8',
        env: {
            ...env,
            GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.invalid',
            GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.invalid',
            ...extra,
        },
    });
    return { code: r.status, out: r.stdout + r.stderr };
}

// A temp repo with the hook enabled the documented way, and stub test and check scripts
function repo({ nodeModules = true } = {}) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hh-hook-'));
    git(dir, ['init', '-q']);
    git(dir, ['config', 'core.hooksPath', hooks]);
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
        private: true,
        scripts: {
            test: `node -e "if (process.env.STUB_TEST_FAIL) { console.log('not ok 1 - stub test'); process.exit(1) }"`,
            check: `node -e "const bad = +(process.env.STUB_CHECK_BAD || 0); console.log(bad + ' bad'); process.exit(bad ? 1 : 0)"`,
        },
    }));
    if (nodeModules) fs.mkdirSync(path.join(dir, 'node_modules'));
    fs.writeFileSync(path.join(dir, 'file.txt'), 'x\n');
    git(dir, ['add', 'file.txt', 'package.json']);
    return dir;
}

const commit = (dir, extra) => git(dir, ['commit', '-q', '-m', 'test commit'], extra);
const commits = (dir) => git(dir, ['rev-list', '--count', '--all']).out.trim();

test('a clean commit goes through', () => {
    const dir = repo();
    const r = commit(dir);
    assert.equal(r.code, 0, r.out);
    assert.equal(commits(dir), '1');
});

test('a commit is refused while a test fails, and the failure is shown', () => {
    const dir = repo();
    const r = commit(dir, { STUB_TEST_FAIL: '1' });
    assert.notEqual(r.code, 0);
    assert.match(r.out, /not ok 1 - stub test/);
    assert.match(r.out, /npm test failed/);
    assert.equal(commits(dir), '0');
});

test('a commit is refused while the offline check reports bad', () => {
    const dir = repo();
    const r = commit(dir, { STUB_CHECK_BAD: '2' });
    assert.notEqual(r.code, 0);
    assert.match(r.out, /^2 bad$/m);
    assert.match(r.out, /npm run check failed/);
    assert.equal(commits(dir), '0');
});

test('without node_modules, the commit is refused with "run npm install"', () => {
    const dir = repo({ nodeModules: false });
    const r = commit(dir);
    assert.notEqual(r.code, 0);
    assert.match(r.out, /run npm install/);
    assert.equal(commits(dir), '0');
});
