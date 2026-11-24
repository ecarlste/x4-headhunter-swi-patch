// The hunter roster is written twice: in the patch (its $HunterFactions replace) and in the check
// helper (its Roster cue). These tests keep the two from drifting. Fixtures are hand-written.
// Run: node --test tools/offline-check/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { compareRosters } from './roster.mjs';
import { REPO } from './paths.mjs';
import { tree } from './temp-tree.mjs';

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

test('the patch and helper rosters agree when they list the same factions, in any order', () => {
    assert.deepEqual(compareRosters(patchRoster('faction.a, faction.b'), helperRoster('faction.b, faction.a')), {
        shared: ['faction.a', 'faction.b'],
        patchOnly: [],
        helperOnly: [],
    });
});

test('the rosters differ: each faction only one side lists is named, by side', () => {
    assert.deepEqual(compareRosters(patchRoster('faction.a, faction.b, faction.c'), helperRoster('faction.a, faction.d')), {
        shared: ['faction.a'],
        patchOnly: ['faction.b', 'faction.c'],
        helperOnly: ['faction.d'],
    });
});

test('a roster that cannot be found throws, naming which', () => {
    assert.throws(() => compareRosters(tree({}), helperRoster('faction.a')), /no \$HunterFactions replace in the patch/);
    assert.throws(() => compareRosters(patchRoster('faction.a'), tree({})), /no Roster cue \$factions in the helper/);
});

test("this repo's patch and helper list the same 13 hunter factions", () => {
    const { shared, patchOnly, helperOnly } = compareRosters(path.join(REPO, 'patch/hh_swi_patch'), path.join(REPO, 'checks/hh_swi_checks'));
    assert.deepEqual({ patchOnly, helperOnly }, { patchOnly: [], helperOnly: [] });
    assert.equal(shared.length, 13);
});
