// The play tests need A Pirate's Life's game-lock script (#31): without that checkout they are
// skipped with a message naming it, not failed. Run: node --test tools/play/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);

test("without A Pirate's Life's checkout, the play tests are skipped with a message naming it", () => {
    const missing = path.join(here, 'no-such-checkout', 'tools', 'game-lock.sh');
    // NODE_TEST_CONTEXT, set for this file's own run, would send the child's report to the runner
    const { NODE_TEST_CONTEXT, ...env } = process.env;
    const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', path.join(here, 'play.test.mjs')], {
        encoding: 'utf8',
        env: { ...env, GAME_LOCK_SH: missing },
    });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /^# fail 0$/m);
    assert.doesNotMatch(r.stdout, /^# pass [1-9]/m);
    assert.match(r.stdout, new RegExp(`# SKIP A Pirate's Life's game-lock script not found at ${missing}`));
});
