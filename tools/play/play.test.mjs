// Tests for tools/play/play.sh, the 90000401 play setup, run against temp dirs only:
// a fake install, a fake profile root and a stub in place of the game. Run: node --test tools/play/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const script = path.join(here, 'play.sh');

// A fake world: install with extensions, profile root with 90000401 and the other profiles
function world({ extensions = defaultExtensions(), profileConfig = defaultConfig() } = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hh-play-'));
    const x4 = path.join(root, 'X4 Foundations - 8.00');
    const profiles = path.join(root, 'Egosoft', 'X4');
    for (const [folder, contentTag] of Object.entries(extensions)) {
        const dir = path.join(x4, 'extensions', folder);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'content.xml'), `<?xml version="1.0" encoding="utf-8"?>\n${contentTag}\n</content>\n`);
    }
    const profile = path.join(profiles, '90000401');
    fs.mkdirSync(path.join(profile, 'extensions'), { recursive: true });
    if (profileConfig !== null) fs.writeFileSync(path.join(profile, 'config.xml'), profileConfig);
    for (const other of ['90000201', '90000301']) {
        fs.mkdirSync(path.join(profiles, other), { recursive: true });
        fs.writeFileSync(path.join(profiles, other, 'content.xml'), '<content/>\n');
    }
    fs.writeFileSync(path.join(profiles, 'content.xml'), '<content/>\n');
    fs.writeFileSync(path.join(profiles, 'config.xml'), '<root>\n  <uisafemode>true</uisafemode>\n</root>\n');
    // The stub game: records its args and whether the lock was held while it ran
    const stub = path.join(root, 'stub-game.sh');
    fs.writeFileSync(stub, `#!/usr/bin/env bash
printf '%s\\n' "$@" > "${root}/game-args"
[ -e "${x4}/game.lock" ] && cp "${x4}/game.lock" "${root}/lock-during-game"
pwd > "${root}/game-cwd"
exit \${STUB_EXIT:-0}
`, { mode: 0o755 });
    return { root, x4, profiles, profile, stub };
}

function defaultExtensions() {
    return {
        starwarsmod_m1: '<content id="SW Interworlds" name="SW Interworlds" enabled="0">',
        chillheadhunter: '<content id="ws_2992233767" name="Head Hunter" save="0" enabled="0" sync="false">',
        sn_mod_support_apis: '<content\n  id="ws_2042901274"\n  name="Mod Support APIs"\n  enabled="0">',
        apirateslife: '<content id="apirateslife" name="A Pirate\'s Life" version="100">',
        starwars_rsp: '<content id="Reaper\'s Ship Pack (SWI)" enabled="0">',
        mycu_equipment_tooltips: '<content id="EquipmentTooltips">',
        ego_dlc_boron: '<content id="ego_dlc_boron" version="800">',
    };
}

function defaultConfig() {
    return '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <fullscreen>false</fullscreen>\n  <uisafemode>true</uisafemode>\n  <gamespeed>0.5</gamespeed>\n</root>\n';
}

function run(w, args = [], env = {}) {
    const r = spawnSync('bash', [script, ...args], {
        encoding: 'utf8',
        env: {
            ...process.env,
            X4_PATH: w.x4,
            X4_PROFILE_ROOT: w.profiles,
            X4_LAUNCH: w.stub,
            X4_GAME_LOCK_WAIT: '0',
            ...env,
        },
    });
    return { code: r.status, out: r.stdout, err: r.stderr };
}

const read = (p) => fs.readFileSync(p, 'utf8');
const launched = (w) => fs.existsSync(path.join(w.root, 'game-args'));

test('refuses to launch while a leftover swibh_tests extension is in the install', () => {
    const w = world();
    fs.mkdirSync(path.join(w.x4, 'extensions', 'swibh_tests'));
    const r = run(w);
    assert.notEqual(r.code, 0);
    assert.match(r.err, /swibh_tests/);
    assert.equal(launched(w), false);
});

test("writes the profile's content.xml: the play mods on, the other mods off, by id", () => {
    const w = world();
    const r = run(w);
    assert.equal(r.code, 0, r.err);
    assert.equal(read(path.join(w.profile, 'content.xml')), `<?xml version="1.0" encoding="utf-8"?>
<content>
  <extension id="SW Interworlds" enabled="true" />
  <extension id="ws_2992233767" enabled="true" />
  <extension id="ws_2042901274" enabled="true" />
  <extension id="apirateslife" enabled="false" />
  <extension id="Reaper's Ship Pack (SWI)" enabled="false" />
  <extension id="EquipmentTooltips" enabled="false" />
</content>
`);
});

test('refuses when an installed mod is in neither list, so nothing loads just by its default', () => {
    const w = world({ extensions: { ...defaultExtensions(), newmod: '<content id="some_new_mod" enabled="1">' } });
    const r = run(w);
    assert.notEqual(r.code, 0);
    assert.match(r.err, /some_new_mod/);
    assert.equal(launched(w), false);
    assert.equal(fs.existsSync(path.join(w.profile, 'content.xml')), false);
});

test("turns Protected UI Mode off in the profile's config.xml before launch, keeping the other settings", () => {
    const w = world();
    const r = run(w);
    assert.equal(r.code, 0, r.err);
    assert.equal(read(path.join(w.profile, 'config.xml')),
        defaultConfig().replace('<uisafemode>true</uisafemode>', '<uisafemode>false</uisafemode>'));
});

test('adds uisafemode to a config.xml that has none', () => {
    const w = world({ profileConfig: '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <gamespeed>0.5</gamespeed>\n</root>\n' });
    const r = run(w);
    assert.equal(r.code, 0, r.err);
    assert.equal(read(path.join(w.profile, 'config.xml')),
        '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <gamespeed>0.5</gamespeed>\n  <uisafemode>false</uisafemode>\n</root>\n');
});

test('refuses while the profile has no config.xml yet', () => {
    const w = world({ profileConfig: null });
    const r = run(w);
    assert.notEqual(r.code, 0);
    assert.match(r.err, /config\.xml/);
    assert.equal(launched(w), false);
});

test("refuses while the profile's own extensions folder isn't empty (it would load Head Hunter twice)", () => {
    const w = world();
    fs.mkdirSync(path.join(w.profile, 'extensions', 'chillheadhunter'));
    const r = run(w);
    assert.notEqual(r.code, 0);
    assert.match(r.err, /90000401.extensions/);
    assert.equal(launched(w), false);
});

test('starts the game in profile 90000401 from the install folder, holding the game lock while it runs', () => {
    const w = world();
    const r = run(w);
    assert.equal(r.code, 0, r.err);
    assert.deepEqual(read(path.join(w.root, 'game-args')).trim().split('\n'),
        ['-skipintro', '-debug', 'all', '-logfile', 'debuglog.txt', '-scriptlogfiles', '-personalfolderid', '90000401']);
    assert.equal(read(path.join(w.root, 'game-cwd')).trim(), w.x4);
    const lock = read(path.join(w.root, 'lock-during-game'));
    assert.match(lock, /^token=./m);
    assert.match(lock, /^what=play 90000401$/m);
});

test('releases the game lock when the game ends, and passes on its exit code', () => {
    const w = world();
    const r = run(w, [], { STUB_EXIT: '3' });
    assert.equal(r.code, 3);
    assert.equal(launched(w), true);
    assert.equal(fs.existsSync(path.join(w.x4, 'game.lock')), false);
});

test('waits its turn: with the lock held elsewhere it neither launches nor touches the profile', () => {
    const w = world();
    const held = `token=someone-else\nwhat=game-test\nrepo=x4-swi-bounty-hunter\nbranch=main\npid=1\nhost=wsl\nstarted=2026-11-23T09:00:00Z\nheartbeat=0 2026-11-23T09:00:00Z\n`;
    fs.writeFileSync(path.join(w.x4, 'game.lock'), held);
    const r = run(w);
    assert.notEqual(r.code, 0);
    assert.match(r.err, /game lock/);
    assert.equal(launched(w), false);
    assert.equal(read(path.join(w.x4, 'game.lock')), held);
    assert.equal(fs.existsSync(path.join(w.profile, 'content.xml')), false);
    assert.equal(read(path.join(w.profile, 'config.xml')), defaultConfig());
});

test("leaves swibh's, A Pirate's Life's and the root profile alone", () => {
    const w = world();
    const r = run(w);
    assert.equal(r.code, 0, r.err);
    for (const other of ['90000201', '90000301']) {
        assert.deepEqual(fs.readdirSync(path.join(w.profiles, other)), ['content.xml']);
        assert.equal(read(path.join(w.profiles, other, 'content.xml')), '<content/>\n');
    }
    assert.equal(read(path.join(w.profiles, 'content.xml')), '<content/>\n');
    assert.equal(read(path.join(w.profiles, 'config.xml')), '<root>\n  <uisafemode>true</uisafemode>\n</root>\n');
});

for (const [folder, id] of [['chillheadhunter', 'ws_2992233767'], ['sn_mod_support_apis', 'ws_2042901274']]) {
    test(`refuses while ${folder}'s installed content.xml is on by default (a reinstall reset it)`, () => {
        const ext = defaultExtensions();
        ext[folder] = `<content id="${id}" name="x"${folder === 'chillheadhunter' ? ' enabled="1"' : ''}>`;
        const w = world({ extensions: ext });
        const r = run(w);
        assert.notEqual(r.code, 0);
        assert.match(r.err, new RegExp(`${folder}.*enabled="0"`));
        assert.equal(launched(w), false);
    });
}
