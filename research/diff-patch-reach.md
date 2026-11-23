# Can a diff patch reach every change point? (2026-11-23)

Ticket: [#3](https://github.com/ecarlste/x4-headhunter-swi-patch/issues/3), on map [#1](https://github.com/ecarlste/x4-headhunter-swi-patch/issues/1). Change points are from [SEED.md](https://github.com/ecarlste/x4-headhunter-swi-patch/blob/main/SEED.md) "What the patch would have to change".

Tags: [read] = seen in the files; [checked] = selector counted against Head Hunter 2.0.8's files with a throwaway script (scratchpad, not kept); [inferred] = reasoning only; [open] = not settled. Nothing was run in game.

## Short answer

- **Every change point is reachable with small diff ops. No cue needs replacing whole.** Each selector below matches exactly one node in 2.0.8 [checked].
- **One more change point than SEED lists:** the DLC `do_if`s after the roster (`HUNT:61-70`) append `loanshark`, `split`, `terran` and `pioneers`, which are inactive in SWI. SWI keeps those MD scripts (it only empties their cues), so `md.Setup_DLC_Pirate?` and the rest are true. They must go with the Boron gate.
- **One extension can diff-patch another extension's `md/`, `aiscripts/` and `libraries/` files by path.** The path uses the target's **folder** name: `extensions/chillheadhunter/md/headhunterhunted.xml` inside the patch. SWI does this to the DLCs and `swibh` does it to SWI, and `swibh`'s T12 proved it in game. That the target is loose files rather than a `.cat` should not matter [inferred]. Confirm it with the first in-game run.
- **`content.xml` dependencies use content ids, not folder names.** These are `ws_2992233767` (Head Hunter), `SW Interworlds` (SWI) and `ws_2042901274` (SirNukes). SEED's `chillheadhunter` and `starwarsmod_m1` are folder names and would not match.
- **Load order:** make Head Hunter and SWI required and SirNukes optional. Without SirNukes the patch still loads. Head Hunter runs on its defaults with no options menu or board, as it does without the patch.
- **Radar mod:** the patch can't reorder Head Hunter relative to SWI. Instead it ships its own guarded `<add>` on the base `libraries/equipmentmods.xml`, which runs after SWI's replace.

## Sources

- `HH/` = Head Hunter 2.0.8, loose files (scratchpad `hh-2.0.8/chillheadhunter/`). `HUNT` = `md/headhunterhunted.xml`, `MD` = `md/headhuntermd.xml`, `AI` = `aiscripts/headhunter.assassinate.xml`.
- `V8` = vanilla 8.00 unpacked (`E:\x4-dev\reference\x4-8.00`).
- `SWI` = SWI 0.91 HF1 unpacked (`E:\x4-dev\reference\mods\swi-0.91hf1`). The installed copy is `extensions/starwarsmod_m1`.
- `swibh` = `ecarlste/x4-swi-bounty-hunter`. Prior notes are on branch `research/chill-headhunter-compat`: `chill-headhunter-md.md` (the line refs and bugs used here) and `chill-headhunter-swi.md` (factions). Also `sirnukes-on-8.md` on branch `research/sirnukes-on-8`. This note doesn't redo them.

## 1. How X4 diff patches work (8.00)

- **Ops.** `V8 base/libraries/diff.xsd` defines `<diff>` with `<add>`, `<replace>` and `<remove>` (`:98-131`).
  - `add` takes `sel`, `pos` (`before`/`after`/`prepend`; the default appends as the last child), `type` (`@attr` adds an attribute), `if` and `silent` (`:62-75`, `:48-54`).
  - `replace` and `remove` take `sel`, `if` and `silent` (`:77-94`).
  - `if` may be a path or `not(path)` (`:26`, `:42-46`). V8 uses `if="not(//faction[@id='terran'])"` in `ego_dlc_timelines/libraries/factions.xml`, and SWI uses `if="/wares/production/method[@id='closedloop']"` [read].
- **What `sel` can say.** Its pattern (`diff.xsd:3-25`) allows these steps:
  - name steps with `[@attr='literal']`, `[child='literal']` or `[n]` predicates, chained;
  - `/` and `//`, ending in an element, `text()` or `@attr`.

  It has no `and`/`or`, no `contains()` and no nested paths inside predicates. So every selector below uses only attribute literals and parent chains.
- **Attribute literals that hold `'`** need `"..."` inside the predicate, written `&quot;` in the file. V8 does this: `ego_dlc_timelines/md/placedobjects.xml:54` [read].
- **Attribute-level edits in MD are normal vanilla practice.**
  - `<replace sel="//cue[@name='Test_Recycling']//set_value[@name='$loadoutfaction']/@exact">` (`V8 ego_dlc_pirate/md/setup_gamestarts.xml:114`).
  - `<add sel="//cue[@name=&quot;DefaultComm&quot;]/conditions">` (`ego_dlc_timelines/md/conversations.xml:9`).
  - `<remove sel="/mdscript/cues//cue[...]/actions/add_tradeware[@ware='ware.scruffinfruits']">` (`ego_dlc_terran/md/scenario_advanced.xml:57`) [read].
- **One node per `sel`.** `swibh`'s offline check requires each `sel` to match exactly one node, and notes "X4 skips an operation whose sel matches nothing" (`swibh tools/offline-check/md-diffs.ts:2`) [read]. That tool could check this patch's selectors against the unpacked 2.0.8 too.

## 2. Change points: selectors and ops

All on 2.0.8. "1 match" means the selector was counted against the file [checked].

| # | Change point | File | `sel` (1 match) | Op |
|---|---|---|---|---|
| 1 | Hunter roster | HUNT:57 | `//cue[@name='SpawnHunters']/actions/set_value[@name='$HunterFactions']/@exact` | `<replace>` the attribute with a list of SWI factions (which ones is [open], SEED item 1) |
| 1a | DLC roster appends (new) | HUNT:61, :64, :67 | `//cue[@name='SpawnHunters']/actions/do_if[@value='md.Setup_DLC_Pirate?']`, the same with `'md.Setup_DLC_Split?'` and `'md.Setup_DLC_Terran?'` | `<remove>` each. They add `loanshark`, `split`, `terran` and `pioneers`, which are inactive in SWI. SWI's diffs only empty these scripts' `<cues>` (`SWI ext/extensions/ego_dlc_{pirate,split,terran}/md/setup_dlc_*.xml`: `<replace sel="//mdscript/cues">`), so the scripts still exist [read; that `md.X?` is then true is inferred]. The OTAS `do_if` (HUNT:71) can stay, since `md.Setup_otas_Mod?` is false. |
| 2 | Spawn point | HUNT:136, :150, :164 | `//cue[@name='CreateHuntersS']/param[@name='Sector']/@value`, and the same for `CreateHuntersM` and `CreateHuntersL` | `<replace>` each attribute with a variable the patch sets (e.g. `$HHSpawnSector`). Set it with one `<add sel="//cue[@name='SpawnHunters']/actions/set_value[@name='$SendingFaction']" pos="after">` holding a `do_if` on `$SendingFaction.headquarters`, with a fallback written here (a random faction station, then the target's sector, like Reloaded). The three params are separate nodes, so it takes three replaces (`//param[@name='Sector']` matches 3). The `ref` library cues already read `$SendingFaction` from the `SpawnHunters` instance, so a variable set there is visible to them [inferred from the existing code]. |
| 3 | Classic Baddies list | MD:247, :264 | `//cue[@name='WantedDestructionTracker']/actions/do_else/do_elseif/@value` (the board entry) and `//cue[@name='WantedDestructionTracker']/actions/do_elseif/@value` (the `$HHAllWanted` add) | Two attribute `<replace>`s with the same new condition, e.g. `global.$HeadHunterClassicBaddies and [<faction list>].indexof.{$killer.trueowner}`. Which factions is [open], SEED item 3. |
| 4 | Boron gate | HUNT:58 | `//cue[@name='SpawnHunters']/actions/do_if[@value='md.Setup_DLC_Boron? and md.Setup_DLC_Boron.Boron_Gates_Open_KingdomEnd.state == cuestate.complete']` | `<remove>`. SWI empties `setup_dlc_boron.xml`'s cues (`SWI ext/extensions/ego_dlc_boron/md/setup_dlc_boron.xml:3`) and `boron` is inactive in SWI, so nothing is lost. |
| 5 | Radar mod | HH `libraries/equipmentmods.xml:3` is a diff on the base file, not ours to edit | none in HH. The patch's own `libraries/equipmentmods.xml`: `<add sel="/equipmentmods/ship" if="not(//radarrange[@ware='mod_ship_radarrange_01_mk1_headhunter'])">` with a `<radarrange>` line written here | See §4. |
| 6a | Abandoned S/M pays nothing | MD:410-423 | `//cue[@name='SCapturedHandler']/actions/signal_cue_instantly[@cue='PayoutEffect']` | `<add pos="before">` a `transfer_money` of `$rewardCr`, which is already computed at MD:416. Who should get paid when the player didn't force the bail is a design point [open]. |
| 6b | Drone `typename` check, MD | MD:204, :285 | `//cue[@name='WantedDestructionTracker']/actions/do_if[@value=&quot;event.param.typename == 'Drone'&quot;]/@value` and the same under `WantedClaimTracker` | Attribute `<replace>`. A language-neutral candidate is `event.param.isunit` (`V8 libraries/scriptproperties.xml:269`, "true iff the object is a unit") [inferred; not tested]. |
| 6b | Drone check, AI | AI:173, :191 | `//do_if[@value='$searching == true and (player.age gt $searchingstart + $timetocamp)']/do_if/do_all[@counter='$rc']/do_if/@value` and `//do_if[@value='player.age - $lastrepaircheck ge 300s']/do_if/do_all[@counter='$rc']/do_if/@value` | Attribute `<replace>`. The two `do_if`s are identical, so each selector goes through its own parent. |
| 6c | Leader gets the Attack order | AI:51 | `//do_all[@counter='$i']/create_order/@object` | `<replace>` with `this.assignedcontrolled.subordinates.{$i}`, or `<remove>` the parent `create_order`, since AI:66 orders the leader anyway. `//create_order[@object='this.assignedcontrolled']` matches 3, so go through `do_all`. |
| 6d | General bounty pays any killer | MD:78 | `//cue[@name='DeathWatcher']/actions/do_if[@value='global.$HeadHunterBountyMultiplier != 0']/@value` | Attribute `<replace>` that adds a killer check, e.g. `... and @event.param.isplayerowned`. Guarding the pay `do_if` rather than `DeathWatcher`'s conditions keeps the `cancel_cue cue="Watcher"` (MD:103) running when someone else kills the ship. If rep should follow, `<replace>` the rep `do_if`'s `@value` (MD:59) the same way. |

The hunter-dependent features (fleet sizing, pay-off, capture option, the hunter AI) need no selectors of their own. They start working once 1, 1a, 2 and 4 let hunters spawn.

## 3. Patching another extension's files by path

- **SWI does it to the DLCs.** SWI's `ext_01.cat` holds 93 files under `extensions/ego_dlc_*/...`, e.g. `extensions/ego_dlc_boron/md/setup_dlc_boron.xml` (installed `starwarsmod_m1/ext_01.cat`) [read]. Each is a `<diff>` on that DLC's file. The DLCs' folder names equal their ids, so this alone doesn't show whether the path uses the folder or the id.
- **`swibh` settles the folder question.** Its diff sits at `extension/swibh/extensions/starwarsmod_m1/md/kuertee_emergent_missions.xml`, using SWI's folder `starwarsmod_m1`, while SWI's content id is `SW Interworlds` (`SWI starwarsmod_m1/content.xml:2`). T12 passed in game on a new game and on an existing save (2026-11-02), and again on 0.91 HF1 (2026-11-05). A same-named file in `swibh`'s own `md/` is ignored (`swibh test-plan.md` T12, `research/swi-0.91-diff.md:5`) [read]. So the patch's files go at `extensions/chillheadhunter/md/...`, `extensions/chillheadhunter/aiscripts/...` and so on.
- **It works on a file the extension itself defines, not just vanilla.** SWI's EM script exists only in SWI, the same case as Head Hunter's MD files [read].
- **Existing saves:** T12 showed a patched MD library runs after a save made without the patch is loaded [read]. Head Hunter is `save="0"` and its cues are read fresh on load, so the patch should apply to saves too [inferred].
- **Loose files vs `.cat`.** Every verified case targets a file inside a `.cat`: the DLCs' files and SWI's EM, which moved from `ext_01` to `ext_02` in 0.91 with no effect on T12. Head Hunter 2.0.8 is loose. X4 reads extension files through one virtual file system, loose or packed. Head Hunter's own loose `md/` scripts load, and its loose `libraries/` diffs apply to the base files. So a diff should find a loose target the same way [inferred]. Settle it in the first in-game run with a canary: an `<add>` of one `debug_text` into `HUNT` `Init/actions`, then grep the debuglog for it.
- **Folder name is load-bearing.** The patch only reaches Head Hunter if it is installed as `extensions/chillheadhunter`. That's the target environment, and `ch.txt` needs that name anyway (chill-headhunter-ui.md). A Steam Workshop install may use another folder name [open; not in the target environment].
- **Head Hunter 2.0.1** shipped as `ext_01.cat`. The same path would reach it, but the line numbers and some nodes differ. The patch targets 2.0.8 only.

## 4. `content.xml` and load order

Ids [read]:

| Extension | Folder | Content id |
|---|---|---|
| Head Hunter 2.0.8 | `chillheadhunter` | `ws_2992233767` (`HH content.xml:2`) |
| SWI 0.91 HF1 | `starwarsmod_m1` | `SW Interworlds` (`SWI starwarsmod_m1/content.xml:2`) |
| SirNukes Mod Support APIs 1.95 | `sn_mod_support_apis` | `ws_2042901274` (sirnukes-on-8.md; Head Hunter's own optional dependency uses it too, `HH content.xml:3`) |

How X4 uses dependencies, from the shipped files:
- `<dependency id=...>` names a content id. Every installed extension that depends on SWI uses `SW Interworlds`, never the folder: `swibh`, Reaper's Ship Pack (`version="091"`) and Mycu's tooltips [read].
- A dependency puts the extension after the one it names, required or optional. The DLCs use optional dependencies only for ordering: `ego_dlc_mini_02` lists every other DLC `optional="true"` [read]. `swibh`'s `content.xml` says "It depends on SWI so it loads after it", and its diff applies (T12) [read]. The engine's ordering rule isn't documented in the 8.00 files, so this rests on that practice [inferred].
- A missing **required** dependency should keep the extension from loading. SWI marks the DLCs it needs `optional="false"` [read]. What the engine does when one is missing isn't documented in the files [inferred].

Recommended `content.xml` dependencies:
```
<dependency version="800"/>
<dependency id="ws_2992233767" name="Head Hunter"/>                                      required
<dependency id="SW Interworlds" name="SW Interworlds"/>                                  required
<dependency id="ws_2042901274" optional="true" name="SirNukes Mod Support APIs"/>
```
- **The patch loads after all three** when all three are present.
- **Without Head Hunter** the patch shouldn't load. That's right, since its diffs would target files that don't exist.
- **Without SirNukes** the patch still loads. Nothing in it touches the SirNukes code paths (`CH` Simple Menu cues, `BOARD`). Head Hunter then runs as it does on its own without SirNukes: no options menu, no board, no map tab, core bounties on the defaults (`CH:29-41`, chill-headhunter-md.md §3) [read]. The optional dependency only matters if the patch later adds its own Simple Menu options.

**The radar mod and the order between Head Hunter and SWI.**
- Head Hunter has no dependency on SWI (`HH content.xml:3-4`), and the patch can't change Head Hunter's `content.xml`. So the order between them stays up to the engine [read].
- SWI's `<replace sel="/equipmentmods">` (`SWI ext02/libraries/equipmentmods.xml:8`) wipes Head Hunter's `<add sel="//equipmentmods/ship">` if Head Hunter goes first.
- The patch loads after both. A guarded `<add sel="/equipmentmods/ship" if="not(//radarrange[@ware='mod_ship_radarrange_01_mk1_headhunter'])">` restores the entry only when it is missing, so whichever order the engine picks, the entry is there exactly once [inferred].
- SWI's replacement still has a `<ship>` node (`SWI ext02/libraries/equipmentmods.xml:400` onwards) [read].
- The ware itself survives. Head Hunter adds it with `<add sel="//wares">`, and SWI's `wares.xml` only replaces a production method and removes named wares (`SWI ext02/libraries/wares.xml:9`, `:18056` onwards) [read].
- The radar line must be written here, not copied: `ware`, `quality` and the `min`/`max` factors.

## 5. What this leaves open

- **No change point needs a from-scratch cue.** "Cues that can't be diff-patched" on the map can close as empty.
- **1a (DLC appends) is a new change point.** It is decided by the same roster ticket.
- Design choices that are not about reach and stay with their tickets: roster factions; baddie factions; the spawn fallback order; who gets paid for an abandoned ship; whether rep also follows the killer check.
- **In-game confirmation still to do:**
  - the loose-file canary (§3);
  - the radar entry present once (chill-headhunter-md.md §8 check 5);
  - no "sel matches nothing" errors for the patch's files in debuglog.
