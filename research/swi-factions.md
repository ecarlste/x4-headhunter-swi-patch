# SWI faction facts for hunters and baddies (2026-11-23)

Research for [#4](https://github.com/ecarlste/x4-headhunter-swi-patch/issues/4) (map [#1](https://github.com/ecarlste/x4-headhunter-swi-patch/issues/1)). It's a fact sheet for every faction Star Wars Interworlds 0.91 HF1 defines. It feeds the **hunter roster**, spawn fallback and **Classic Baddies** decisions (#8, #9, #10) but makes none of them. Reaper's Ship Pack 2.8 (RSP) additions are listed separately, because the patch must work without RSP.

Tags: **[read]** = seen in the files. **[inferred]** = follows from what was read; nothing was run in game.

## Sources

- `SWI/` = SWI 0.91 HF1 unpacked, `/mnt/e/x4-dev/reference/mods/swi-0.91hf1/ext02/`. `FX` = `libraries/factions.xml`, `SHIPS` = `libraries/ships.xml`, `JOBS` = `libraries/jobs.xml`, `GOD` = `libraries/god.xml`, `GS` = `libraries/gamestarts.xml`, `FL` = `md/factionlogic.xml`.
- `RSP/` = Reaper's Ship Pack 2.8 (`content.xml` version 208), installed `extensions/starwars_rsp/ext_01.cat`. Its `libraries/ships.xml` and `libraries/jobs.xml` were extracted to read them.
- `HH/` = Head Hunter 2.0.8 (`chillheadhunter`). `HUNT` = `md/headhunterhunted.xml`, `HM` = `md/headhuntermd.xml`, `AI` = `aiscripts/headhunter.assassinate.xml`.
- `V8/` = vanilla X4 8.00, `/mnt/e/x4-dev/reference/x4-8.00/base/`.
- English names come from `SWI/t/0001.xml`, page 999840, ids `5xx110`.
- Prior research, cited and not redone: `swibh` [chill-headhunter-swi.md](https://github.com/ecarlste/x4-swi-bounty-hunter/blob/research/chill-headhunter-compat/research/chill-headhunter-swi.md) §1 (the vanilla roster is dead under SWI) and [swi-bounty.md](https://github.com/ecarlste/x4-swi-bounty-hunter/blob/main/research/swi-bounty.md) §6 and §11 (the `indibhg` and `bountyhunters` details).

The counts were made with small throwaway parsers over the XML, with comments stripped. A "military entry" is a `<ship>` in SHIPS whose `<category>` tags include `military` and whose faction list includes the faction. A "military job" is a JOBS `<job>` whose `<category>` tags include `military`. Wing and subordinate jobs count too, and so do jobs with `startactive="false"`.

## 1. How Head Hunter picks ships for a hunter group

These are the facts the roster decision depends on [read]:

1. **Faction.** `SpawnHunters` picks one faction at random from a fixed list (`HUNT` 57-74). There's no relation check, no check that the faction is active, and no check that it has ships.
2. **Size.** It counts the player's ships with `primarypurpose == purpose.fight` near the wanted ship (S, M, L; each XL counts as **3 L**) (`HUNT` 80-113). It then asks for the same number of S, M and L hunters. **It never spawns XL hunters.**
3. **Ships.** It makes three `md.LIB_Create_Ships.Start` calls with `Ship_CategoryFaction = $SendingFaction`, `Ship_Category_Size` = `class.ship_s`/`_m`/`_l`, and `Ship_CategoryTags = tag.military` (`HUNT` 127-168). The vanilla library resolves them with `<select faction=… size=… tags=… required="false"/>` (`V8/md/lib_create_ships.xml` 323, 400, 406). So a candidate needs **`<ship>` entries in `ships.xml`** whose category has that faction, `size="ship_s|m|l"` and the `military` tag. Jobs don't matter to this call, and neither does the ship's purpose.
   - If a faction has no entry for a size, nothing is made for that size. There's no fallback to another size or faction [inferred].
   - Entries with no `size=` (all of `indibhg`'s) never match.
   - Equipment comes from the `select` (default loadout), with no loadout parameter. Head Hunter then adds its own mods (`HUNT` 198-212).
4. **Spawn point.** `Sector = $SendingFaction.headquarters.sector`, at `position.[0,0,0]` (`HUNT` 136, 150, 164). A faction **with no HQ** gives a null sector [inferred, see chill-headhunter-swi.md §1.2].
5. **Owner and hostility.** The hunters are owned by `$SendingFaction` (`HUNT` 178) with `set_object_relation_behaviour disable` (`HUNT` 182). The AI gives them a `set_relation_boost … faction.player value="-1"` (`AI` 50, 65). So the faction's standing with the player doesn't decide whether hunters attack [inferred].

So the facts that matter for a roster faction are: military `ships.xml` entries per size (S, M, L), whether it has an HQ, whether it's active, and (for flavour) its relations.

## 2. How SWI sets factions up

- **Vanilla factions.** SWI sets 21 vanilla and DLC factions (argon, teladi, paranid, split, terran, boron, scaleplate, buccaneers, loanshark, yaki and the rest) to `active="0"` with tags `hidden police` (`FX` 37-105). `court` and `trinity` only get the `hidden police` tags (`FX` 94-96); vanilla already has `trinity` inactive. `khaak` and `xenon` are **replaced in place** with SWI's Yuuzhan Vong and "Unknown Threat" (`FX` 1684, 1734). The vanilla roster is dead: see chill-headhunter-swi.md §1.1.
- **Active at game start.** `active` defaults to true (`V8/libraries/factions.xsd` 593-597). No SWI faction sets `active="0"`; `sith` and `hapes` set `active="1"` explicitly. No game start changes activity (`GS` has no `active=`), and no MD activates factions. **All 35 SWI factions are active at game start** [read].
- **Factions can drop out mid-game.** `SW_factions_defeat` (`SWI/md/sw_factions_defeat.xml` 9, 30) runs `set_faction_active … false` on galempire, newrepublic, corporate, commerceguild, huttcartel, ascendancy, anoat, mandodw, hapes and sith once they own no sectors. Only in the main galaxy [read]. Head Hunter doesn't check `isactive`, so a defeated roster faction would still be picked [inferred].
- **Main starts.** Every group 1 and group 6 start uses `swi_galaxy_macro` (`GS`). The showcase and battle starts (group 8) use `sws_galaxy_macro`, and SWI's faction logic only runs in `swi_galaxy_macro` (`FL` 4).
- **Headquarters.** SWI's faction-logic managers (`FL` 135-720) pass a `PreferredHQSpaceMacro` and a `PreferredHQTypes` list. Vanilla's `Find_Faction_Headquarters` (`V8/md/factionlogic.xml` 546-615) then picks an owned station of those types in that sector, or anywhere in the galaxy on a second pass. A manager with **no** HQ params gets no HQ (`V8/md/factionlogic.xml` 616-620) [read]. The "HQ sector" column below is the preferred sector plus the faction's GOD station there [read]. The HQ that actually gets picked is [inferred].
  - SWI writes `'defensestation'`, but vanilla checks `'defencestation'` (`V8/md/factionlogic.xml` 586). That entry never matches. It's harmless, because the other types (and `'any'`) come after it [read].
- **Flags.** `police` = tag `police` (and `policefaction=`). `pirate`/`plunder` = those tags. `peaceful` and `hidden` are tags too. SWI has **no "outlaw" tag**. Vanilla's Classic Baddies list (xenon, khaak, scaleplate, buccaneers) is hard-coded by id in `HM` 247 and 264 [read].

## 3. Every SWI faction at a glance

Ship columns are **military entries in SWI's `ships.xml`** as S / M / L (XL in brackets, which Head Hunter never uses). Jobs are military jobs as S / M / L (XL). "HQ" is the preferred HQ sector and SWI's station there.

| id | Name | Flags | Ships S/M/L (XL) | Mil. jobs S/M/L (XL) | HQ (FL line → GOD station) |
| --- | --- | --- | --- | --- | --- |
| galempire | Galactic Empire | police | 12/6/9 (2) | 8/5/12 (4) | Bastion (`FL` 142) → `shipyard_galempire_01` (`GOD` 337) |
| ascendancy | Imperial Ascendancy | police | 10/5/9 (3) | 9/4/10 (4) | Eriadu (161) → `shipyard_ascendancy_01` (700) |
| newrepublic | New Republic | police | 10/3/7 (6) | 9/3/10 (8) | Coruscant (179) → `shipyard_newrepublic_01` (896) |
| rebelalliance | Rebel Alliance | – (police faction = newrepublic) | 5/1/2 (5) | 4/1/3 (2) | Alderaan (201) → `wharf_rebelalliance_01` (2553) |
| corporate | Corporate Sector Authority | police | 8/2/9 (2) | 7/2/9 (4) | Cantonica (222, no `'any'`) → `shipyard_corporate_01` (1578) |
| commerceguild | Independent Commerce Guild | police | 7/2/5 (5) | 6/3/7 (8) | Hypori (240) → `shipyard_commerceguild_01` (2065) |
| huttcartel | Hutt Cartel | police | 6/1/3 (1) | 4/2/4 (1) | Nar Shaddaa (258) → `shipyard_huttcartel_01` (1895) |
| mandodw | Mandalorian Death Watch | police | 5/3/4 (3) | 6/4/5 (5) | Mandalore (277) → `shipyard_mandodw_01` (1447) |
| anoat | Anoat Federation | police | 6/2/5 (0) | 5/3/7 | Anpath (295) → `wharf_anoat_01` (2382) |
| sith | Sith Empire | police; hostile to all | 3/**0**/3 (2) | 3/0/5 (9) | Ziost, shipbuilding only (643) → `shipyard_sith_01` (190) |
| hapes | Hapes Consortium | police, **plunder** | 6/1/3 | 5/4/7 | Hapes (365) → `shipyard_hapes_01` (2583) |
| kamino | Kamino | police | 7/1/3 (1) | 6/2/6 (4) | Kamino (383) → `shipyard_kamino_01` (2721) |
| naboo | Naboo Royal Authority | peaceful | 4/0/0 | 3/0/0 | Naboo (347) → `wharf_naboo_01` (2651) |
| kuat | Kuat Drive Yards | peaceful | 3/0/1 | 3/0/1 | Kuat (401) → `shipyard_kuat_01` (2678) |
| miningguild | Mining Guild | – | 1/0/0 | 1/0/0 | Kessel (625) → `wharf_miningguild_02` (3057) |
| huttpirates | Hutt Pirates | **pirate, plunder**; relations locked | 1/1/**0** | 1/2/0 | **none** (no HQ params, `FL` 676) |
| mandoraiders | Mandalorian Raiders | **pirate, plunder**; relations locked | 1/2/**0** | 1/1/0 | **none** (`FL` 692) |
| valarian | Pirate Syndicates | **pirate, plunder**; relations locked | 2/2/2 | 5/8/8 | Stenos (662) → `wharf_valarian_01` (3201) |
| blacksun | Black Sun | **pirate, plunder** | 4/1/1 (1) | 8/4/5 (2) | Fusai (712) → `wharf_blacksun_02` (3148) |
| bountyhunters | Bounty Hunters Guild | – | **0/0/0** | 0 (its wharf garrisons use `indibhg` ships) | Millagro (313) → `wharf_bountyhunters_01` (2974) |
| indibhg | Bounty Hunter (independents) | **hidden**; relations locked | 0/0/0 (17 entries, all without `size=`) | 0 (20 named-hunter jobs) | **none** (`FL` 327, no HQ params) |
| corellia, sienar, hoersh, rendili, incom, transgalmeg, moncal | Shipbuilders | peaceful | 0/0/0 (sienar has 1 non-military L) | 0 | Own wharf or shipyard (`FL` 419-527) |
| twinsuns, baobab, tradefederation, tagge, bankingclan | Traders | peaceful; relations locked | 0 military (3 M, 4 L traders each) | 0 | **none** (`FL` 541-605) |
| khaak | Yuuzhan Vong | aggressive; relations locked | 2/1/0 | — | none; 2 nests (`GOD` 128, 142) |
| xenon | Unknown Threat | relations locked | 1/0/0 (1) | 3/0/0 (2) | none; its GOD stations are commented out (`GOD` 157-185) |
| dummypirate | (hidden helper) | hidden | — | — | — |

Source lines: faction definitions at `FX` 111 (galempire), 155, 199, 255, 311, 365, 418, 466, 522, 569 (sith), 639 (huttpirates), 705 (mandoraiders), 772 (valarian), 845 (blacksun), 925 (naboo), 961 (hapes), 1017, 1066, 1100-1316, 1362-1525, 1571 (bountyhunters), 1619 (indibhg), 1639, 1676, 1684, 1734. The first military `SHIPS` entries are at: huttcartel 2775, mandodw 3171, blacksun 3327, valarian 3447, huttpirates 3503, mandoraiders 3522, hapes 2989, kamino 3700, anoat 1720, galempire 260, ascendancy 768, newrepublic 1128, corporate 2022, commerceguild 2406, sith 57. Counts [read]. These match chill-headhunter-swi.md §1.2 for the four factions it lists.

### Notes on single factions

- **bountyhunters**: none of SWI's 475 `ships.xml` entries names it, so it has no ships of its own. Its job `bountyhunters_garrison_m` (`JOBS` 21488) builds `indibhg` `[bhg_random_med_gar]` ships and sets their **owner** to bountyhunters. Its named-hunter jobs (`bountyhunters_ig` 21508 and the rest, activated in `SWI/md/setup_swmod.xml` 251-269) are owned by `indibhg`. See swi-bounty.md §6 and §11.
- **indibhg**: its ship categories are named tags such as `[bhg_porax]` and `[bhg_random_small]` with no `size=` (`SHIPS` 3810-3936). `tag.military` plus a size never matches [read].
- **sith**: it has `-1` to everyone, including the player (`FX` 590-592). Diplomacy is turned off for it (`SWI/md/setup_swmod.xml` 230-231). It has no military M entry, so an M request yields nothing.
- **hapes**: it carries the `plunder` tag (raider and plunderer jobs, `SWI/md/setup_swmod_hapes.xml`), yet it's also a police faction.
- **Pirate HQs.** `valarian` and `blacksun` have HQ params and own pirate stations, so they should get an HQ [inferred]. `huttpirates` and `mandoraiders` have no HQ params, so they never get one, though `huttpirates` owns two pirate bases (`GOD` 3176, 3189) [read].

## 4. Default relations (factions.xml; game starts can change some, see §5)

Relation scale: −0.32 = "kill" (they shoot on sight), −0.1 = "killmilitary", −0.01 to 0.01 = neutral (`FX` 4-34). A blank cell means no entry, which is 0.

| id | player | galempire | newrepublic | ascendancy | huttcartel | mandodw | the 4 pirates | bountyhunters |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| galempire | 0 | — | −1 | −1 | | −1 | −0.32 | +0.32 |
| ascendancy | 0 | −1 | −1 | — | | −1 | −0.32 | +0.32 |
| newrepublic | 0 | −1 | — | −1 | −0.032 | −1 | −0.32 | +0.32 |
| rebelalliance | 0 | −1 | +1 | −1 | | −1 | −0.32 | +0.1 |
| corporate | 0 | | | | −0.01 | +0.01 | −0.32 | +0.32 |
| commerceguild | 0 | | | | | | −0.32 | +0.32 |
| huttcartel | 0 | | −0.032 | | — | | blacksun −0.32, huttpirates 0, mandoraiders −0.32, valarian −0.005 | +0.32 |
| mandodw | 0 | −1 | −1 | −1 | | — | mandoraiders +0.01, others −0.32 | +0.32 |
| anoat | 0 | −1 | −0.01 | +0.6 | | | blacksun +0.01, others −0.32 | +0.32 |
| hapes | 0 | −0.032 | −0.032 | −0.032 | −0.032 | −0.032 | −0.1 | +0.32 |
| kamino | 0 | | | | | +0.01 | −0.1 | +0.32 |
| sith | **−1** | −1 | −1 | −1 | −1 | −1 | −1 | −1 |
| huttpirates | −0.0032 | −0.32 | −0.32 | −0.32 | 0 | −0.32 | — | −0.1 |
| mandoraiders | −0.0032 | −0.32 | −0.32 | −0.32 | −0.32 | +0.01 | — | −0.1 |
| valarian | −0.01 | −0.32 | −0.32 | −0.32 | −0.005 | −0.32 | — | −0.1 |
| blacksun | −0.0032 | −0.32 | −0.32 | −0.32 | −0.32 | −0.32 | — | −0.1 |
| bountyhunters | 0 | +0.32 | +0.32 | +0.32 | +0.32 | +0.32 | −0.1 | — (indibhg +1) |
| indibhg | 0 | | | | | | | +1 |
| khaak, xenon | −1 | −1 | −1 | −1 | −1 | −1 | −1 | −1 |

Player values come from `FX` 1801-1806 (sith −1, valarian −0.01, the other three pirates −0.0032) and from khaak's and xenon's own lists. The rest come from each faction's `<relations>` [read]. The shipbuilders and traders are at −0.1 to the pirates and +0.32 to their patron (for example incom → newrepublic and corporate).

**Locked relations** (`<relations locked="1">`): huttpirates (`FX` 660), mandoraiders (726), valarian (799), twinsuns, baobab, tradefederation, tagge, bankingclan (1389-1551), indibhg (1628), dummypirate, khaak, xenon (1679-1738). Only the Hutt yacht start unlocks one, `huttpirates` (`SWI/md/setup_gamestarts_sw.xml` 1683-1684) [read]. Rep changes from Head Hunter (`add_faction_relation`) probably do nothing for locked factions [inferred, as in chill-headhunter-swi.md §1.4].

## 5. Player relations by main game start

Only what each start overrides (`GS`; the start's `<factions><relations>` block). Everything else keeps the §4 defaults.

| Start (`GS` line) | Overrides (faction = relation to player) |
| --- | --- |
| Imperial navy pilot (44) | galempire 0.001, sienar 0.005, ascendancy −0.32, mandodw −0.32, newrepublic −1, rebelalliance −1 |
| NR cadet (141), NR trader (240) | newrepublic 0.005, rebelalliance 0.005, galempire −1, ascendancy −1, mandodw −0.32 |
| Imperial trader (338) | galempire 0.005, sienar 0.005, ascendancy −0.32, mandodw −0.32, newrepublic −1, rebelalliance −1 |
| Kuat (432) | kuat 0.1, rebelalliance 0, newrepublic −0.009, galempire −0.1, ascendancy −0.32, mandodw −0.32 |
| Mando fighter (551) | mandodw 0.005, mandoraiders 0.005, galempire, newrepublic, rebelalliance, ascendancy −0.32 |
| CIS trader (652) | corporate −0.32, ascendancy −0.005 |
| CIS prisoner (746) | corporate −0.32, ascendancy −0.005, huttcartel −0.11 |
| CSA (846) | commerceguild −0.32, ascendancy −0.005, huttcartel −0.01 |
| Anoat (947) | anoat 0.005, newrepublic −0.032, galempire −0.32 |
| Bounty Hunters Guild (1055) | huttcartel −0.001, ascendancy −0.005, corporate 0.001, commerceguild −0.01 |
| Ascendancy (1149) | ascendancy 0.005, anoat 0.005, galempire −0.32, mandodw −0.32, newrepublic −1, rebelalliance −1 |
| Hutt yacht (1249) | huttcartel 0.01, galempire, ascendancy, mandodw, corporate −0.05, newrepublic, rebelalliance −0.1, commerceguild, anoat −0.01; plus huttpirates unlocked at 0.01 (MD) |
| Hapes noble (1354) | hapes 0.005, the five major militaries −0.05, commerceguild −0.01 |
| Group 6: rogue captain (1454), MC80R (1613), Venator (1720), Mando outcast (1829), Sith (1933) | Mostly −0.03 to −1 against the majors. Sith start: sith 0.7, newrepublic/rebelalliance −0.8, and so on. Mando outcast also sets one random enemy to −1 (`SWI/md/setup_gamestarts_sw.xml` 348-349) |

## 6. Reaper's Ship Pack 2.8 additions (optional; the patch must not need them)

RSP only adds `ships.xml` entries (`RSP/libraries/ships.xml` 3, `add sel="//ships"`) and jobs (`RSP/libraries/jobs.xml` 4). It has no `factions.xml`, `god.xml` or relation changes (its catalogue has none) [read]. So it adds no HQs and no factions.

| Faction | RSP military ship entries S/M/L (XL) | RSP military jobs |
| --- | --- | --- |
| galempire | 3/0/3 (6) (`RSP ships` 6-111) | 15 |
| newrepublic | 4/0/0 (3) (122-186) | 16 |
| corporate | 0/0/2 (2) (196-221) | 4 |
| mandodw | 0/0/1 (3) (233-267) | 7 |
| ascendancy | 0/0/0 (4) (279-316) | 5 |
| anoat | 0/0/3 (326-342) | 3 |
| huttcartel | 0/0/1 (1) (353-362) | 2 |
| kamino | 0/0/2 (1) (373-390) | 3 |
| indibhg | 1 named entry `[indibhg_ohil]`, no size (400) | 1 |

RSP adds **nothing for the four pirate factions, `bountyhunters`, `hapes` or `sith`**. It adds no M ships to anyone. It doesn't give `huttpirates` or `mandoraiders` an L.

## 7. What this means for the open tickets (facts, not choices)

- **Factions with military S, M and L entries and an HQ, without RSP:** galempire, ascendancy, newrepublic, rebelalliance, corporate, commerceguild, huttcartel, mandodw, anoat, hapes, kamino, valarian, blacksun. The obvious candidates already named in SEED (`huttcartel`, `mandodw`, `blacksun`, `valarian`) are all in this set and all should have an HQ [inferred].
- **Factions that can't fill every size:** sith (no M), kuat (no M), naboo and miningguild (S only), huttpirates and mandoraiders (no L, and **no HQ**).
- **Factions that can't spawn at all through Head Hunter's call:** bountyhunters (no ships), indibhg (no sized entries, no HQ), and the shipbuilders and traders (no military entries).
- **The "bounty hunter" flavour** factions (`bountyhunters`, `indibhg`) are the ones that don't fit Head Hunter's `faction + size + tag.military` select. Using them needs another selection method (for example their named tags or macros). That's a roster or spawn decision [inferred].
- **Spawn fallback (#9).** HQ sectors are spread across the galaxy (Nar Shaddaa, Mandalore, Fusai, Stenos and so on), and hunters start at `[0,0,0]` there. huttpirates, mandoraiders and indibhg have no HQ. Any faction in `SW_factions_defeat` loses its HQ when it's deactivated (`V8/md/factionlogic.xml` 536-544) [read + inferred].
- **Classic Baddies (#10).** SWI's pirate-tagged factions are `huttpirates`, `mandoraiders`, `valarian` and `blacksun`. Every faction hostile to the player and everyone else is `sith` (−1, not tagged pirate), `khaak` = Yuuzhan Vong and `xenon` = Unknown Threat. `hapes` carries `plunder` but is a police faction. Head Hunter's list is hard-coded by id (`HM` 247, 264) and its victim exclusion list is too (`HM` 144, 429). Under SWI only khaak and xenon of those ids still mean anything (chill-headhunter-swi.md §1.3). SWI's own EM tracker excludes `indibhg, sith, xenon, khaak, huttpirates, mandoraiders, valarian, blacksun, hapes` from bounty missions (`SWI/md/kuertee_emergent_missions.xml` 63), which is a ready-made SWI notion of "not a lawful faction" [read].
