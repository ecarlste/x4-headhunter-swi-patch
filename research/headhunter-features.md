# Head Hunter 2.0.8: every advertised feature, and its state on 8.00 + SWI 0.91 HF1 (2026-11-23)

Answers [#2](https://github.com/ecarlste/x4-headhunter-swi-patch/issues/2). Builds on the `swibh` research and doesn't repeat it: where a row says "R:", the detail is in that note (branch `research/chill-headhunter-compat` of `ecarlste/x4-swi-bounty-hunter` unless named).

Nothing was run. Files were only read. Tags: **[read]** = seen in the file; **[inferred]** = follows from what was read; **[web]** = from a primary web page.

## Sources

- **Head Hunter 2.0.8**, Nexus zip `Head Hunter 1150 2.0.8 2026-10-31T01-33Z K8iPi4yGe.zip`, loose files. Short names: `HM` = `md/headhuntermd.xml`, `HUNT` = `md/headhunterhunted.xml`, `CH` = `md/chillheadhunter.xml`, `BOARD` = `md/headhunterboard.xml`, `AI` = `aiscripts/headhunter.assassinate.xml`, `LUA` = `ch.txt`, `T` = `t/0001-l044.xml`. The zip has **no changelog file** [read].
- **Changelog**: the Steam Workshop change notes for item 2992233767, `steamcommunity.com/sharedfiles/filedetails/changelog/2992233767`, pages 1-3, Jun 20 2023 to Oct 30 2026 [web]. The Nexus changelog tab returns 403 to scripts. The Nexus per-file notes (public GraphQL `modFiles`, mod 1150) match the Workshop notes where both exist [web].
- **Nexus overview**: the 2.0.8 description from the public Nexus GraphQL API (`legacyModsByDomain`, updated 2026-10-31). It matches the text the user supplied [web].
- **SWI 0.91 HF1**: `E:\x4-dev\reference\mods\swi-0.91hf1` (`ext02/libraries/factions.xml`, `subst02/ui/addons/ego_detailmonitor/menu_map.xpl` = `SWIMAP`).
- **Vanilla 8.00**: `E:\x4-dev\reference\x4-8.00\base` (`libraries/md.xsd`, `md/lib_create_ships.xml`, `t/0001-l044.xml`).
- **Earlier notes (R:)**: [chill-headhunter.md](https://github.com/ecarlste/x4-swi-bounty-hunter/blob/research/chill-headhunter-compat/research/chill-headhunter.md), [chill-headhunter-md.md](https://github.com/ecarlste/x4-swi-bounty-hunter/blob/research/chill-headhunter-compat/research/chill-headhunter-md.md) (`md`), [chill-headhunter-ui.md](https://github.com/ecarlste/x4-swi-bounty-hunter/blob/research/chill-headhunter-compat/research/chill-headhunter-ui.md) (`ui`), [chill-headhunter-swi.md](https://github.com/ecarlste/x4-swi-bounty-hunter/blob/research/chill-headhunter-compat/research/chill-headhunter-swi.md) (`swi`), [headhunter-original.md](https://github.com/ecarlste/x4-swi-bounty-hunter/blob/research/headhunter-original/research/headhunter-original.md) (`orig`), [sirnukes-on-8.md](https://github.com/ecarlste/x4-swi-bounty-hunter/blob/research/sirnukes-on-8/research/sirnukes-on-8.md) (`sn`).

## Short answer

- There are **28 advertised features**: the 3 headline features of the overview, the 2 map-tab features of 2.0, and the rest from the changelog. The table below lists them all. Three of them weren't in SEED.md's table: hunters that travel and search, hidden transponders, and sector-owner rep on general bounties.
- **Works on 8.00 + SWI as is (by reading): 16.** General bounty pay and the sector-owner rep, the multiplier and rep toggle, wanted claims (units still open, #6), map labels, proximity alerts, logbook, notification toggles, the payout voice (unchecked), the SirNukes board with its 3 sorts, Mycu's map tab, double-click-to-centre, and the translations (text only).
- **Works but wrong for the Star Wars setting: 3.** Who posts and gets wanted bounties, Classic Baddies (known), and the cover-faction exclusion. **New:** SWI's pirates aren't in the "never posts a bounty" list, so killing pirates makes the player's ships wanted (§3.1).
- **Dead because no hunter groups spawn: 8.** Everything under "Head Hunters". The roster and spawn point are already known (R: swi §1.2). Reading the hunter code shows that the travel-and-search and hidden-transponder features **would work on SWI** once hunters exist. Nothing else in them is SWI-specific.
- **Broken in every game: 1.** The S/M capture payout (known). Plus 3 new bugs (§4).
- **UI:** SirNukes 1.95 plus SWI's built-in kuertee hooks is enough for all three UI features. kuertee UIX (Nexus 552) isn't needed (§2).

Surprises:
1. **"No cheating" is only half true.** Hunters learn the target's new sector every time it changes sector, wherever they are (`AI:80-90`, "spotted passing gate sensors"). You can't hide in another sector. You hide by staying off their radar inside the sector until their 20-minute search ends (`AI:9-10`, `:167-183`). This matches "can be juked" but not a reading of "hidden from" as "lose them across the map".
2. **The "transponder" is the owner and the hostility, not the ID code.** Hunters fly as ordinary ships of the sending faction, with their normal names and not hostile. On their first radar contact with a wanted player ship, they rename to "<name> Head Hunter" and turn hostile (`AI:41-75`). The ID code never changes.
3. **The spawn-point fallback must not be the target's sector.** The overview's "no spawning on your face" rules out Reloaded's last fallback (the target's sector), which SEED change point 2 names as the model (affects #9).

## 1. The feature list

"Source" says where it is advertised: **O** = Nexus overview, **C** = changelog (version or date), **2.0** = the overview's "New in v2.0". "State" is on 8.00 + SWI 0.91 HF1 + SirNukes 1.95, before any patch.

### General bounties

| # | Feature | Source | Code | State | Why |
|---|---|---|---|---|---|
| 1 | Pay for killing a hostile that a player ship attacked | O; C 1.2 ("same as Roaming Fleet values") | `HM:5-36` `HHAttackTagger` (tag on first hit), `HM:37-121` `Watcher` / `DeathWatcher` (pay on death), `WatcherExpire` (10 min) | **Works** | Plain MD, all in 8.00 (R: md §2). Pay is (shield + hull at first hit) × 0.5-1.0 Cr (`HM:47`, `:79-82`). It pays for any death within 10 min, whoever made the kill (R: md §5) |
| 2 | **Small rep bonus with the sector owner for killing its enemy** | O | `DeathWatcher` `HM:59-70` | **Works** (2.0.8) | Goes to `$enemy.sector.trueowner` when the victim's relation to it is below 0, the owner isn't the player, and the player is below +1 with it (`HM:59-60`). Value `0.0064 / 2,000,000 × (shield + hull)` (`HM:33`), passed through the signal (`HM:34`, `:48`, `:63`). SWI's sectors have SWI owners, so the rep goes to SWI factions [inferred]. Only fires for victims hostile to the player (`HM:22`) |
| 3 | Bounty multiplier 0-10x | C 1.2 | `CH` slider (`$HeadHunterBountyMultiplier`), `HM:78-82` | **Works** | 0 turns the general bounty off (`HM:78`) |
| 4 | Logbook shows base pay and multiplier bonus apart, plus location | C 1.2, Jul 23 2023 | `HM:86-100` | **Works** | 2.0.8 caches the names, so a dead attacker no longer errors (R: md §1) |
| 5 | Toggle: gain reputation from kills | C 1.91 | `CH` option, `HM:59`, `:310` | **Works** | Plain global check |

### Wanted bounties

| # | Feature | Source | Code | State | Why |
|---|---|---|---|---|---|
| 6 | When a faction ship dies, its faction puts a bounty on the killer; it grows with each kill | O | `HM:183-274` `WantedDestructionTracker` | **Works, but wider than vanilla** | Watches `global.$HHAllShips`. In SWI that is every faction except civilian, criminal, the Vong (`khaak`) and Menace Inconnue (`xenon`), **pirates included** (§3.1). Value is about 9-10 % of the victim's value per kill (R: swi §2.2) |
| 7 | Claiming: larger rep with the faction that posted it, plus credits | O | `HM:275-322` `WantedClaimTracker` | **Works; units open** | Rep goes to the *last* victim's faction (`HM:311`). Pays `($value/100)Cr` (`HM:314`): board figure or 1/100 of it is #6's question (R: chill-headhunter.md open question 1) |
| 8 | Capture: S/M pays the bounty; L/XL clears it, no pay | C 1.2 | `HM:398-424` `LCapturedHandler`, `SCapturedHandler` | **S/M broken everywhere**; L/XL works | `$rewardCr` is never transferred (`HM:416-421`; R: md §5). **New:** S/M fires on `event_object_abandoned` with no check on who caused the bail, so any S/M wanted ship whose crew bails loses its bounty, even if no player was there (`HM:410-414`) [inferred] |
| 9 | "No Faction Wanted Bounties" / Classic Baddies (only Xenon, Kha'ak, Scale Plate, Buccaneers) | C Jun 28 2023; `T:15-16` | `HM:241-268` | **Wrong for SWI** (known), **and buggy** | Under SWI only the Vong and Menace Inconnue qualify (R: swi §1.3). New bug: §4.1 |
| 10 | Cover factions (Scale Plate, Yaki) never post bounties | C 1.8 | exclusion lists `HM:144`, `HM:429` | **Works for vanilla ids only** | `scaleplate` and `yaki` are inactive in SWI. SWI's pirates aren't in the list (§3.1) |
| 11 | Map labels with the live bounty next to wanted ships | C 1.4 | `HM:468-502` `MapTagger` | **Works** | `player.holomap.isopen` guard (2.0.8) exists in 8.00 (R: md §1) |
| 12 | Toggle: map labels on the player's own wanted ships | `CH` option 107 | `HM:476-494` | **Works** | |
| 13 | Proximity alerts when a player ship spots a wanted ship, with a minimum value | C Jun 21 and Jul 23 2023, 2.0 | `HM:360-397` `WantedPlayerProximity`, `ProximityThrottle` | **Works** [inferred] | Also refreshes the board's "last seen" (`HM:392-393`). Only ships in `$HHAllPlayerOwnedShips` scan: the ones that existed at universe generation plus ones the player builds (`HM:130`, `:351-359`). Captured or gifted ships never trigger alerts [inferred; true in vanilla too] |
| 14 | NPC claim notifications (off by default; also turns off their logbook lines) | C 1.6, Aug 2 2023 | `HM:299-305`, `CH` patch v6 | **Works** | |
| 15 | Verbal payout: computer line plus the faction representative's "thanks" | C 1.6, 1.4.x | `HM:323-350` `PayoutEffect`, `Speaky` | **Works, voice unchecked** | Uses `faction.representative` and voice lines 279, 2013/2111/5023. SWI factions without a representative would make `start_script` fail silently [inferred]. Belongs to the "SWI faction names in text and voice" item |
| 16 | Wanted board in SirNukes Extension Options, with "MOST WANTED", faction filter and sorts By Value, By Distance, By Latest Intel | O ("how are you going to view the Wanted board"); C Jun 23 2023 | `BOARD` (whole file), sorts `BOARD:169-178` | **Works with SirNukes 1.95** | §2. "By Distance" sorts on the ship's real position, not its last known one (`BOARD:174`). The "Last Spotted" column shows unknown sector names too (`BOARD:195`). Both are design, not bugs |
| 17 | Reset Wanted Board / Print to log | `CH` debug rows | `CH` buttons | **Works** | |
| 18 | Translations (ru, fr, es, de, zh) | C 1.6 | `t/*.xml` page 8008574 | **Text only** | Page free in SWI (R: swi §3.2). The board's MD column headers are hard-coded English (`BOARD:57-60`), and so is the " Head Hunter" suffix (`AI:46`, `:49`) |

### Head Hunters (all dead on SWI until hunters spawn)

| # | Feature | Source | Code | State | Why |
|---|---|---|---|---|---|
| 19 | Factions may put a bounty on the player's ships, sending hunter groups | O; C 1.5 (DLC factions), 1.8 (OTAS; Boron after the story) | `HUNT:22-47` `HunterTimer` (every 10 min, 25 %), `HUNT:48-170` `SpawnHunters` | **Dead** | Roster all inactive, spawn point is the faction HQ (R: swi §1.2). Toggle "Player Head Hunters" `CH` option 109 works |
| 20 | **Hunters travel and search instead of spawning on the player; can be juked or hidden from** | O | spawn at `$SendingFaction.headquarters.sector`, position 0,0,0 (`HUNT:136`, `:150`, `:164`); order `HeadHunter` with `destination = $playertarget.sector` (`HUNT:222-225`); AI travel `AI:109-118`, search camp `AI:121-165`, 20-min give-up `AI:9-10`, `:166-183`; 45-min lifetime `HUNT:38-41` | **Dead; works once hunters spawn** [inferred] | Travel uses `move_to` with `travel="true"` (`AI:110`). The search picks random zones, gates and non-hostile stations in the sector (`AI:129-135`). They attack only on their own radar contact with a wanted player ship (`AI:25-79`). After 20 min of searching they leave and despawn (`MoveDie`). **But** they always know the target's sector: the `event_object_changed_sector` handler moves their destination whenever the target changes sector (`AI:80-90`). Nothing here depends on SWI. SWI ships need a travel drive or the move is just slower [inferred] |
| 21 | **Hunters don't disclose their true transponder until they find you** | O; C 1.8 ("whole fleet goes hostile on engagement") | owner set to the sending faction, relation behaviour off (`HUNT:178-182`); reveal on contact: rename to "+ Head Hunter", `set_relation_boost -1` toward the player for leader and subordinates, then Attack (`AI:41-75`) | **Dead; works once hunters spawn** [inferred] | Before contact, a hunter is an ordinary, non-hostile ship of a normal faction. The ID code is never hidden or changed. **If the roster faction is already hostile to the player** (vanilla's own Scale Plate entry, or SWI pirates in a patched roster), the disguise does nothing: they show red from spawn and police may fight them on the way [inferred]. Relevant to #8 |
| 22 | Fleet sized to the player's offensive military ships near the target | O (implied); C 1.8 | `HUNT:80-121` | **Dead** | Counts only `purpose.fight` ships in the target's radar range. **New bug** §4.2 |
| 23 | Harder hunters for bigger bounties: equipment mods and a radar mod | C (1.x, no date) | `$Difficulty` `HUNT:115-120`, mods `HUNT:198-212`; radar ware `libraries/wares.xml`, `libraries/equipmentmods.xml` | **Dead**; radar mod may also be wiped | SWI's `<replace sel="/equipmentmods">` vs load order is #5 |
| 24 | Comms: pay hunters off at 10x the bounty; clears the bounty and they retreat | C 1.5 | `HUNT:241-301` `StartTalk`, `PayoffBounty` | **Dead** | Plain MD and conversation events, all vanilla. Pays the hunter's owner (`HUNT:265`) |
| 25 | Option to capture hunter ships | C 1.5 | `HUNT:181`, `:229-240` `HunterCapturedHandler` | **Dead** | |
| 26 | No rep hit for attacking or killing hunters and their drones | C 1.5, 1.6, Aug 2 2023 | `set_object_relation_behaviour disable` on hunters and launched defence drones (`HUNT:182-196`) | **Dead** | This is the drone rep fix. It's separate from the `typename == 'Drone'` claim checks (R: md §6.1). Under SWI the English `typename` is still "Drone": SWI doesn't override page 20221 (vanilla `t/0001-l044.xml` 58136) [read] |

Also part of the hunter feature, not separately advertised: hunters stand down and leave when their target dies, is captured or bails (`HUNT:302-332`, C 1.5 fix).

### UI (2.0)

| # | Feature | Source | Code | State | Why |
|---|---|---|---|---|---|
| 27 | Mycu's map sidebar tab with the bounty board, filters (known sectors only, faction) and sorts (value, distance, last intel) | 2.0 | `LUA` (whole file), loaded by `CH:4-21`; data from `HM:445-466` `BuildHunterLuaTable` | **Works with SirNukes 1.95** | §2 |
| 28 | Double-click a row to centre the map on the last known sector | 2.0 | `LUA:406-411` → `C.SetFocusMapComponent` | **Works** | §2. Unknown sectors are greyed and not clickable (`LUA:129-135`) |

### Changelog claims not found in the 2.0.8 code

- C 1.8: "Terran and Boron hunters should no longer select their light carriers". There is no carrier filter in `SpawnHunters` (`HUNT:127-168` only passes `tag.military` and the size class) [read]. Irrelevant on SWI, but a patched roster could pick carriers too.
- C 1.5: "turrets and stations attacking head hunters" can't be checked by reading.

## 2. UI: SirNukes 1.95 + SWI's built-in hooks are enough

Confirmed. Nothing new beyond the earlier notes:

- **Loading.** `LUA` is loaded only by SirNukes' `Lua_Loader` (`CH:4-21`) and needs `extensions.sn_mod_support_apis.lua_interface` (`LUA:3`). R: ui §1 and §3 checked these in SirNukes 1.94. 1.94 → 1.95 changes only the chat window API (R: sn §1), so the result holds for 1.95.
- **Map tab hooks.** `LUA:80-84` registers the 5 hooks on `MapMenu`. All 5 exist in SWI's own `menu_map.xpl` (rechecked for this note: `ic_onSelectElement` 27590, `ic_onRowChanged` 27375, `createRightBar_on_start` 20184, `createInfoFrame2_on_menu_infoModeRight` 19991, `refreshInfoFrame2_on_start` 7238) [read]. `LUA:6` swallows the missing standalone UIX module with `pcall`.
- **Double-click.** `LUA:406-411` checks `uitable == mapMenu.infoTableRight2`, which SWI sets (R: ui §3), then calls `C.SetFocusMapComponent`, declared in SWI's `menu_map.xpl` (R: ui §3 FFI table).
- **The `$lastseen` worry** (R: chill-headhunter.md open question 2) is mostly settled by the MD. `$lastseen` is set to the killer's sector when the entry is made (`HM:242`, `:248`), and on every later kill and sighting (`HM:224`, `:392`). It can only be null for an entry from an old save or a killer that was in no sector [inferred].
- **Folder name** must be `chillheadhunter` (R: ui §1). The patch can't change that.

## 3. SWI-specific findings

### 3.1 New: killing SWI pirates makes the player wanted

In vanilla, victims from `buccaneers`, `scaleplate` (the pirates), `khaak`, `xenon`, `yaki`, civilian, criminal, ownerless, player and visitor never put up a bounty (`HM:144` `PapaCue`, `HM:429` `AllShipsHandler`) [read]. So a vanilla player who kills pirates isn't wanted for it. The overview's "Maybe you like to kill faction ships too" is about lawful factions.

SWI's pirates are new ids with the `pirate` tag: `huttpirates` (`factions.xml:639`), `mandoraiders` (705), `valarian` (772), `blacksun` (845) [read]. None is in the list. So under SWI:

- killing a Black Sun ship puts a bounty on the killer, **including the player's ship** (`HM:255-257`);
- once hunters spawn (after the patch), a player who hunts pirates gets hunted for it.

The list needs SWI's pirates, the same way Classic Baddies does. This is a **new change point**: `HM:144` and `HM:429`, next to SEED's `HM:247` and `:264`. It affects #10 (which SWI factions are baddies) and #3 (can a diff patch reach it: both are a single `trueowner`/`owner` attribute on a `match` / `check_object`).

### 3.2 Everything else

- Rep and pay go to SWI factions as written (#2, #7). Locked-relation factions probably ignore it (R: swi §1.4).
- The hunter AI uses only vanilla orders and interrupts that SWI keeps (R: md §3).

## 4. New bugs (in every game, not SWI-specific)

1. **Classic Baddies still marks the player as hunted.** With the option on, a player ship that kills a watched ship gets no tracker entry (`HM:241-252`), but `HM:255-257` still adds it to `global.$HHAllPlayerWanted`, outside the option check. `HunterTimer` then sends hunters at it (`HUNT:25`, `:30`). `SpawnHunters` reads the missing entry's `$value` (`HUNT:115-118`, errors, difficulty 1). The payoff offers a null amount (`HUNT:252`). The hunters' AI only attacks ships in `global.$HHAllWanted` (`AI:41`), and under Classic Baddies the player ship isn't there (`HM:258-268`). So **hunters arrive, search and never attack**. [read code; behaviour inferred]
2. **A wanted ship that isn't a combat ship gets zero hunters, and the timer keeps erroring.** Fleet size counts only `purpose.fight` ships (`HUNT:96-113`), and the target itself counts only if it is one. A wanted trader or miner (its turrets killed something) gives S = M = L = 0. `LIB_Create_Ships` exits on `Ship_Amount` 0 (vanilla `lib_create_ships.xml:272-281`), `HuntersCreated` gives an order to a null leader (`HUNT:222`), and this repeats every 10 min [inferred]. `$countXL` is never used: XL ships add 3 to L (`HUNT:110`).
3. **S/M abandonment clears the bounty with no player check** (#8 above). Any bail, by NPC fire too, wipes the entry.
4. Small: `WantedDestructionTracker` and the other `PapaCue` children share `PapaCue`'s variables, since the default namespace is inherited from the parent (vanilla `md.xsd:1073-1077`). So where R: md §6.2 says the `<break/>` at `HM:211` leaves `$killer` unset, it actually leaves the **previous kill's** `$killer`. If `break` doesn't stop the actions, a drone kill from a station could credit an old killer [inferred]. The same rule means `HUNT`'s `$playertarget`, `$SendingFaction` and `$Difficulty` all live on `Init`, which is what makes `SpawnHunters` → `HuntersCreated` → `PayoffBounty` work. It also means `HunterTimer` changes `$playertarget` to the highest-value wanted ship every 10 min, even during a hunt (`HUNT:29-30`), so `TargetClaimed` can miss the ship the hunters are actually chasing [inferred].

Known bugs still present, for #11: the S/M capture payout, pay for any killer, value fixed at first hit, `typename == 'Drone'`, the leader getting the Attack order (`AI:51`), the orphan check destroying the whole group (R: chill-headhunter.md "Bugs still in 2.0.8", md §6).

## 5. What this changes for other tickets

- **#8 (which SWI factions hunt):** the hidden-transponder feature only works if the roster faction isn't already hostile to the player. That argues against pirate factions (`blacksun`, `valarian`) as hunters, or accepting that their disguise does nothing.
- **#9 (spawn without an HQ):** "no spawning on your face" rules out falling back to the target's sector. A fallback should be far from the target, e.g. another sector the faction owns or a station of it.
- **#10 (Classic Baddies):** add the always-excluded victim lists `HM:144` and `HM:429` as a third and fourth change point (§3.1).
- **#11 (bugs):** three new candidates (§4.1-4.3).
- **#13 (verification):** "can be juked or hidden from" should be tested as "leave their radar within the sector until they give up", not "jump away" (§1 #20).
- **#3 (diff patch):** the exclusion lists are single attributes. §4.1's fix would be a condition change at `HM:255`.

## 6. In-game checks added by this note

On top of R: chill-headhunter.md "In-game test":

1. Kill a Black Sun (or other SWI pirate) ship with a player ship. Is the player ship on the board? (§3.1)
2. Turn Classic Baddies on, kill a lawful faction ship with a player ship, and wait. Does a hunter group come and never attack? (needs a patched roster; §4.1)
3. After the patch: get hunted, then leave the sector. Do the hunters follow to the new sector? Stay out of their radar inside it for 20 minutes. Do they give up and leave? (#20)
4. Before contact, check a hunter on the map: normal faction name and not hostile. After contact: "… Head Hunter" and hostile, same ID code. (#21)
