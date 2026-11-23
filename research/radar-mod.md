# Does SWI wipe Head Hunter's radar mod?

Research for issue #5 (map #1), 2026-11-23. Tags: [read] = seen in files; [inferred] = follows from what was read; [community] = forum or third-party docs, not Egosoft-official; [open] = unknown until tested in game.

Path shorthands:
- `HH` = Head Hunter 2.0.8 (`chillheadhunter`), unpacked from the Nexus zip (not in this repo).
- `SWI` = SWI 0.91 HF1 unpacked, `E:\x4-dev\reference\mods\swi-0.91hf1\ext02` (from `starwarsmod_m1/ext_02.cat`).
- `V8` = vanilla 8.00 unpacked, `E:\x4-dev\reference\x4-8.00`.

## Answer

- **Without the patch, it depends on a load order that X4 doesn't pin down.** Neither mod declares a dependency on the other, so the engine falls back to its default order. If Head Hunter loads first, SWI's `<replace sel="/equipmentmods">` wipes the radar mod. If SWI loads first, the radar mod survives. Which one wins depends on whether the engine sorts by folder name or by extension id, and the two give opposite answers here (below). Nobody has checked in game [open].
- **The patch can make it certain either way.** The patch loads after both mods because it depends on both. It can re-add the radar mod's `equipmentmods` entry guarded by `if="not(...)"`, so the entry exists exactly once whatever order the other two loaded in. Egosoft's own DLC files use this same guarded `<add>` form.
- The radar mod's **ware** survives in every order. Only its `equipmentmods` entry is at risk.

## Where each side does it

**Head Hunter adds the radar mod in two places:**
- The ware: `HH libraries/wares.xml:3-4`, `<add sel="//wares">` with `<ware id="mod_ship_radarrange_01_mk1_headhunter" ... tags="crafting equipmentmod noplayerblueprint">` [read].
- The mod's effect: `HH libraries/equipmentmods.xml:3-4`, `<add sel="//equipmentmods/ship">` with `<radarrange ware="mod_ship_radarrange_01_mk1_headhunter" quality="2" min="1.45" max="1.45"/>` [read].
- It is used only when hunters spawn: `HH md/headhunterhunted.xml:198-212` gives each hunter `add_equipment_mods` with the radar mod plus three vanilla mods, picked by `$Difficulty` (1-3, hard-coded to 1 at `:55`, whose comment says "0 has no modified radar") [read].

**SWI replaces the whole file:**
- `SWI libraries/equipmentmods.xml:8`: `<replace sel="/equipmentmods">`, then a full new `<equipmentmods>` (10-535) with its own `<ship>` node (400-480) [read]. The installed `starwarsmod_m1/ext_02.cat` lists `libraries/equipmentmods.xml`, so this file is live [read].
- SWI does **not** replace `wares`. Its `libraries/wares.xml` holds only `add`, `remove` and attribute `replace` ops (e.g. `:3`, `:15`, `:18056`), so Head Hunter's ware is kept in every order [read].
- The three other mods Head Hunter gives hunters all still exist in SWI's replacement: `mod_weapon_damage_01_mk1` (13), `_04_mk2` (111), `_02_mk3` (205), `mod_engine_travelthrust_01_mk3` (388), `mod_shield_rechargedelay_01_mk1` (490), `mod_shield_capacity_01_mk2` (503), `mod_shield_capacity_02_mk3` (528) [read]. So only the radar mod is at risk.
- Side note: SWI's replace also wipes the Timelines DLC's `equipmentmods` additions (`V8 ego_dlc_timelines/libraries/equipmentmods.xml:3`, `:17`). SWI depends on Timelines, so SWI loads after it, so that wipe is certain. This looks deliberate and doesn't affect Head Hunter [inferred].

## Extension ids, which dependencies refer to

| Mod | Folder | `content.id` | Dependencies |
|---|---|---|---|
| Head Hunter 2.0.8 | `chillheadhunter` | `ws_2992233767` (`HH content.xml:2`) | SirNukes (`ws_2042901274`) and `kuerteeUIExtensionsAndHUD`, both optional (`:3-4`). **None on SWI.** |
| SWI 0.91 HF1 | `starwarsmod_m1` | `SW Interworlds` (with a space; installed `content.xml:2`) | Game 800 and the five DLCs (`:3-8`). **None on Head Hunter.** |
| Reaper's Ship Pack 2.8 | `starwars_rsp` | `Reaper's Ship Pack (SWI)` | `<dependency id="SW Interworlds" .../>` [read] |

A dependency refers to the **id**, not the folder: Reaper's Ship Pack depends on SWI with `id="SW Interworlds"`, and SWI's folder is `starwarsmod_m1` [read]. So the patch's `content.xml` needs `id="SW Interworlds"` and `id="ws_2992233767"`. It can't use the folder names.

## Load order: what is confirmed and what isn't

**Confirmed:**
- A `<dependency>` makes an extension load after the one it names, even when `optional="true"` and the named one is there. Forum answer, 2023 ([Optional dependancies](https://forum.egosoft.com/viewtopic.php?p=5178719)), and the standard advice for diffing another mod's files ([Question regarding creating a diff to a mod](https://forum.egosoft.com/viewtopic.php?p=5135841)) [community]. In this install it is also visible: SWI's replace runs after Timelines' add, which SWI's design relies on [inferred].
- So **the patch loads after both** Head Hunter and SWI once it lists both as dependencies [community, inferred].

**Not confirmed: the order between two mods that don't depend on each other.**
- "Load order is based on the folder name for all mods installed in the same location", unless a dependency tag is used. Forum regular user1679, 2021 ([thread](https://forum.egosoft.com/viewtopic.php?p=5071294)) [community].
- A third-party reference says the order is "dependency order, then alphabetical" but doesn't say alphabetical by what ([x4cat extension structure](https://meethune.github.io/x4cat/modding-reference/extension-structure.html)) [community].
- An Egosoft Script&Mod moderator (UniTrader, 2017, X Rebirth era) wrote: "it doesnt go by Mod Folder", and "Regarding Overlapping files consider the load Order random if not specified in the content.xml" ([thread](https://forum.egosoft.com/viewtopic.php?p=4653300)) [community].
- No Egosoft documentation was found that settles it.

**What each sort key would mean here:**

| If the engine sorts by | Order | Radar mod after both load |
|---|---|---|
| folder name | `chillheadhunter` < `starwarsmod_m1`: Head Hunter first, then SWI | **wiped**: SWI's replace drops Head Hunter's `<radarrange>` |
| extension id (case-sensitive or not) | `SW Interworlds` < `ws_2992233767` (`S`/`s` before `w`): SWI first | **kept**: Head Hunter's `//equipmentmods/ship` matches SWI's one `<ship>` node |
| undefined / anything else | either | either |

Both of the first two rows are plausible [inferred]. The prior note (`swibh` `research/chill-headhunter-md.md` §3) assumed the wiped case. This note doesn't settle it, and the patch shouldn't rely on it.

**What happens when it is wiped:** the ware exists, but there's no `equipmentmods` entry for it. Head Hunter's add ran without error before SWI's replace, so the debuglog likely says nothing about the patch [inferred]. What `add_equipment_mods` does with a ware that has no `equipmentmods` entry (skip it, log an error, or drop the whole list) is unknown [open]. While hunter groups never spawn on SWI (SEED feature table), none of this shows in game anyway.

## How to keep the radar mod: options

The patch depends on both mods, so it runs after both.

1. **Guarded re-add in the patch (recommended).** Patch file `libraries/equipmentmods.xml`:
   ```xml
   <add sel="/equipmentmods/ship"
        if="not(/equipmentmods/ship/radarrange[@ware='mod_ship_radarrange_01_mk1_headhunter'])">
     <radarrange ware="mod_ship_radarrange_01_mk1_headhunter" quality="2" min="1.45" max="1.45"/>
   </add>
   ```
   - Works in both orders: it adds the entry only when SWI wiped it, so it never doubles up.
   - Egosoft uses this form: `if="not(//faction[@id='terran'])"` on an `<add>` at `V8 ego_dlc_timelines/libraries/factions.xml:34`. They also use `if=` together with `silent="1"` at `V8 ego_dlc_mini_02/libraries/wares.xml:191` [read].
   - It copies one data line (ware id, quality 2, factor 1.45) from Head Hunter. That's the advertised number, but whether this fits the "no Chillmatica code" rule is the user's call [open]. It's one line of values, not a cue or a file.
   - It goes stale if Head Hunter changes the ware id or the 1.45 value. The `if` guard keeps that harmless: if Head Hunter's own add survives, the patch does nothing.
2. **Unguarded re-add.** The same `<add>` without `if`. In the "SWI first" order this gives two `<radarrange>` entries for the same ware, and what the engine does with that is unknown [open]. Option 1 is strictly safer.
3. **Make hunters use SWI's radar mod.** Swap `mod_ship_radarrange_01_mk1_headhunter` for SWI's `mod_ship_radarrange_01_mk1` (`SWI equipmentmods.xml:418`, 1.3x, with a hull penalty of 0.85x) in the three `add_equipment_mods` lists at `HH md/headhunterhunted.xml:200`, `:205`, `:210`. No copied data, but it changes the advertised feature (1.45x down to 1.3x, plus the hull penalty), and it touches three MD nodes instead of one library node. Not "as advertised".
4. **Edit Head Hunter's `content.xml` to add an optional dependency on `SW Interworlds`.** This forces the "kept" order without any patch file, but it changes the user's Head Hunter install outside the patch and is lost on every Head Hunter update. A patch can't change another extension's `content.xml` load order. Not recommended.
5. **Do nothing.** It works only if the engine happens to sort by id. Not safe.

## In-game check (for the spec's verification section)

- Without the patch: with hunters forced to spawn (or a debug cue), read the hunter's equipment mods, or check whether `ware.mod_ship_radarrange_01_mk1_headhunter` gets applied. That settles the load-order question [open].
- With the patch: the same check should show the radar mod on a hunter, once only. Search the debuglog for diff or patch errors from the patch's `libraries/equipmentmods.xml`.

## Sources

- HH 2.0.8: `content.xml:2-4`, `libraries/equipmentmods.xml:3-4`, `libraries/wares.xml:3-11`, `md/headhunterhunted.xml:55`, `:198-212` (not in this repo).
- SWI 0.91 HF1: `ext02/libraries/equipmentmods.xml:8-537`, `ext02/libraries/wares.xml`, `starwarsmod_m1/ext_02.cat` index. Installed `extensions/starwarsmod_m1/content.xml:2-8` and `extensions/starwars_rsp/content.xml`.
- V8: `base/libraries/equipmentmods.xml:7`, `:349`; `ego_dlc_timelines/libraries/equipmentmods.xml:3`; `ego_dlc_timelines/libraries/factions.xml:34`; `ego_dlc_mini_02/libraries/wares.xml:191`.
- Prior note: `ecarlste/x4-swi-bounty-hunter`, branch `research/chill-headhunter-compat`, `research/chill-headhunter-md.md` §3 (the `equipmentmods` row).
- Forum: [p=5178719](https://forum.egosoft.com/viewtopic.php?p=5178719), [p=5135841](https://forum.egosoft.com/viewtopic.php?p=5135841), [p=5071294](https://forum.egosoft.com/viewtopic.php?p=5071294), [p=4653300](https://forum.egosoft.com/viewtopic.php?p=4653300); [x4cat extension structure](https://meethune.github.io/x4cat/modding-reference/extension-structure.html).
