// The hunter roster is written twice: in the patch (its $HunterFactions replace) and in the check
// helper (its Roster cue). These tests keep the two from drifting. Fixtures are hand-written.
// Run: node --test tools/offline-check/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checkRoster } from './roster.mjs';
import { REPO } from './paths.mjs';

function tree(files) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hh-roster-'));
    for (const [rel, text] of Object.entries(files)) {
        fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
        fs.writeFileSync(path.join(root, rel), text);
    }
    return root;
}

const patchRoster = (list) => tree({
    'extensions/chillheadhunter/md/headhunterhunted.xml': `<diff>
  <replace sel="//cue[@name='SpawnHunters']/actions/set_value[@name='$HunterFactions']/@exact">[${list}]</replace>
</diff>`,
});
const helperRoster = (list) => tree({
    'md/hh_swi_checks.xml': `<mdscript name="HH_SWI_Checks"><cues>
  <cue name="Roster" namespace="this"><actions>
    <set_value name="$factions" exact="[${list}]"/>
    <set_value name="$hqfaction" exact="$factions.{1}"/>
  </actions></cue>
</cues></mdscript>`,
});

test('the patch and helper rosters agree when they list the same factions', () => {
    const { notes, bad } = checkRoster(patchRoster('faction.a, faction.b'), helperRoster('faction.a, faction.b'));
    assert.deepEqual(bad, []);
    assert.deepEqual(notes, ['the patch and the helper both list the same 2 hunter factions']);
});

test('the rosters differ: each faction only one side lists is bad', () => {
    const { bad } = checkRoster(patchRoster('faction.a, faction.b, faction.c'), helperRoster('faction.a, faction.d'));
    assert.deepEqual(bad, [
        'faction.b is in the patch roster but not the helper roster',
        'faction.c is in the patch roster but not the helper roster',
        'faction.d is in the helper roster but not the patch roster',
    ]);
});

test('a roster that cannot be found is bad', () => {
    const { bad } = checkRoster(tree({}), tree({}));
    assert.equal(bad.length, 2);
    assert.match(bad[0], /no \$HunterFactions replace in the patch/);
    assert.match(bad[1], /no Roster cue \$factions in the helper/);
});

test("this repo's patch and helper list the same 13 hunter factions", () => {
    const { notes, bad } = checkRoster(path.join(REPO, 'patch/hh_swi_patch'), path.join(REPO, 'checks/hh_swi_checks'));
    assert.deepEqual(bad, []);
    assert.deepEqual(notes, ['the patch and the helper both list the same 13 hunter factions']);
});
