# Head Hunter's faction text and voice under SWI (2026-11-23)

Answers [#15](https://github.com/ecarlste/x4-headhunter-swi-patch/issues/15) (map [#1](https://github.com/ecarlste/x4-headhunter-swi-patch/issues/1)). It builds on the feature note (branch `research/headhunter-features`, rows 13-18, 21, 24) and the faction note (branch `research/swi-factions`), plus the resolutions of #8 (roster) and #10 (Classic Baddies). It doesn't repeat them.

Nothing was run. Files were only read. Tags: **[read]** = seen in the file; **[inferred]** = follows from what was read; **[open]** = can only be settled in game.

## Sources

- **Head Hunter 2.0.8** zip, loose files: `HM` = `md/headhuntermd.xml`, `HUNT` = `md/headhunterhunted.xml`, `AI` = `aiscripts/headhunter.assassinate.xml`, `BOARD` = `md/headhunterboard.xml`, `LUA` = `ch.txt`, `T` = `t/0001-l044.xml` (it also ships `0001.xml`, `-l007`, `-l033`, `-l034`, `-l049`, `-l086`). "t NNN" means text id NNN on page 8008574.
- **SWI 0.91 HF1** unpacked, `/mnt/e/x4-dev/reference/mods/swi-0.91hf1/ext02/`: `FX` = `libraries/factions.xml`, `CHARS` = `libraries/characters.xml`, `FL` = `md/factionlogic.xml`, `ST` = `t/0001.xml` (SWI has English only as the default `0001.xml`, plus L007, L033, L049, L086). `SWIUI` = `subst02/ui/addons/ego_detailmonitor/`.
- **SWI installed cats**, `extensions/starwarsmod_m1/*.cat` (the cat index lists every packed file).
- **Vanilla 8.00** unpacked, `/mnt/e/x4-dev/reference/x4-8.00/base/`: `VT` = `t/0001-l044.xml`, `VFL` = `md/factionlogic.xml`, `VPI` = `aiscripts/player.interaction.xml`, `SP` = `libraries/scriptproperties.xml`, `CX` = `libraries/common.xsd`. Vanilla voice files from the install's `03.cat` index.

## Short answer

- **Text: yes, it all resolves to SWI's names.** Every place that shows a faction reads it from the game's faction data at run time (`.knownname` in MD, `GetFactionData(…, "name"/"shortname")` in Lua). SWI defines its own `name` and `shortname` for all 35 factions on page 999840 (`FX` 111-1735), and all of them are `known="1"`. Nothing in Head Hunter hard-codes a vanilla faction **name**. The only hard-coded faction words are in the option text `{8008574,112}` "(Xenon/Khaak/Pirates)".
- **Representatives: most factions have one, eight don't.** A representative exists only for a faction with an HQ (vanilla faction logic). Every roster faction and every lawful faction that can post a bounty has one. `indibhg`, the five trader factions, `huttpirates` and `mandoraiders` never do, and a defeated faction loses its own. When one is missing, the computer's "Incoming fund transfer" still plays and the "thanks" line just doesn't happen: `start_script` on a null object, no player-visible error. Whether it writes a log error is [open].
- **Voice lines: all present.** Line 279 (computer, page 10002) and 2013/2111/5023 on pages 10101 and 10106 (the only pages SWI gives its representatives) are vanilla voiced lines. SWI doesn't override those pages or their audio. One gap: the faction **name** spoken after line 279 has no audio under SWI, because SWI ships no voice files for its faction names.
- **New text: none needed.** The patch works with zero new `t` lines. The only candidate is optional: rewording `{8008574,112}` to SWI's baddies. Without it, #16 has nothing to translate.
- **Patch changes for text and voice: none required.** One optional guard (skip the thanks when there's no representative) and one bug for #11 (every payout leaves a listener behind, so later payouts repeat old thanks).

## 1. Where Head Hunter puts a faction into text or speech

"Faction source" is the faction the text names. "Under SWI" is with SWI 0.91 HF1 and the #8/#10 decisions.

| # | Where | Code | Faction source | How it's rendered | Under SWI |
|---|---|---|---|---|---|
| 16 | SirNukes board, faction dropdown | `BOARD:91-100`, `:111-117` | wanted ships' `trueowner` (the **killers**, baddies included) | `'%s'.[$faction.knownname]` (`:116`), sorted by `knownname` (`:99`) | SWI names, e.g. "Black Sun", "Sith Empire", "Unknown Threat" [read: `ST` 2544-2953] |
| 16 | SirNukes board, "Wanted by" column | `BOARD:200`, `:228` | `$lastvictimfaction` (the faction that posted) | `.knownname`, else the English literal `'Unknown'` | SWI names [read] |
| 27 | Map tab, faction filter dropdown | `LUA:263-272`, `:46-48` | `GetLibrary("factions")` | `faction.name` | Same list as the vanilla and SWI Player Info relations menu, which also take `GetLibrary("factions")` unfiltered (`SWIUI/menu_playerinfo.xpl:2408`, `menu_diplomacy.xpl:1299`). So it lists whatever factions that menu lists, under SWI's names [inferred]. Whether SWI's 21 inactive `hidden` vanilla factions appear there is [open], and it's the same as in SWI's own menu |
| 27 | Map tab, "Wanted by" column | `LUA:137-151`, `:317` | `$victimfaction` = `$lastvictimfaction` (`HM:463`) | `GetFactionData(…, "shortname")`; `"---"` and `{8008574,300}` when not `IsKnownItem` | SWI short names ("IMP", "BLS", "HTP"…) [read: `ST`]. All SWI factions are `known="1"` (`FX`), so none are greyed [inferred] |
| 27 | Map tab, ship row colour | `LUA:102`, `:119-124`, `:303` | wanted ship's `owner` | `GetFactionData(…, "color")` only, no name shown | SWI colours [inferred] |
| 4 | Logbook "Earned General Bounty" | `HM:57`, `:69`, `:90-98`, t 129 | `$payer`: the English literal `'The Intergalactic Bounty Fund'`, or the faction `$enemy.sector.owner` when the rep branch runs | faction object passed straight into `%s` | SWI sector owners [inferred]. How a faction **object** formats in `%s` (name or id) isn't documented; it's the same mechanism in vanilla, so not an SWI difference [open] |
| 7, 14 | Logbook "Bounty Claimed" (player claim) | `HM:301-303`, t 131-132 | `$lastvictimfaction` | faction object in `%s`: "%s thanks you for your efforts" | Same as the row above [open: format] |
| 7, 13, 14 | Notifications (claims, "HEAD CLAIMED!", proximity) and NPC claim logbook | `HM:300`, `:313`, `:383`, `:388`, t 130, 133-136 | none: ship and sector `knownname` only | | SWI ship and sector names [read] |
| 21 | Hunter rename | `AI:46`, `:49` | none: `knownname + ' Head Hunter'` | English literal suffix | Ship name + " Head Hunter". No faction in it. The disguise shows the owner faction through the game's normal UI, under SWI names [inferred] |
| 24 | Comms payoff | `HUNT:251-253`, t 137 | none: target ship `idcode` / `knownname` | hunter pilot speaks line 10101 of **its own** voice page | No faction. Line 10101 exists on vanilla page 10101 ("Maybe we can work out a deal", `VT` 11784). The hunter pilot's voice page under SWI is unchecked; the feature is dead until hunters spawn [open] |
| 15 | Payout voice, computer | `HM:331-334` | `$lastvictimfaction` | `<speak>` line 279 + `<name value="faction"/>` | Line 279 plays; the spoken name has **no audio** (§3) |
| 15 | Payout voice, representative | `HM:330`, `:337-347` | `$lastvictimfaction.representative` | `player.interaction` with line 2013/2111/5023 on the rep's page | Plays for factions with a representative (§2) |

Notes:

- **Who is "the faction" in a payout.** It's always the *victim's* faction (`$lastvictimfaction`, `HM:223`, `:242`, `:315`, `:317`), never the wanted ship's owner. The victim lists (`HM:144`, `:429`, patched by #10) decide which factions can be victims. So the Classic Baddies never appear as payout factions once #10's victim-list change is in. Before it, `huttpirates`, `mandoraiders`, `valarian` and `blacksun` can [read].
- **The roster** (#8) only matters for text in one place: the hunters' owner, shown by the game's own UI. Head Hunter's code never names the hunter faction (`HUNT:179` comments out a `shortname` prefix) [read].
- **The two dropdowns filter different things.** The SirNukes board filters by the killer's faction (`BOARD:208`), the map tab by the victim's faction (`LUA:351`). That's Head Hunter's design, the same in vanilla.
- **Hard-coded English** (same in vanilla, not an SWI issue): `'The Intergalactic Bounty Fund'` (`HM:57`), `' Head Hunter'` (`AI:46`, `:49`), `'Unknown'` (`BOARD:195`, `:200`), and the board's column headers (feature note row 18).

## 2. Representatives

**How a faction gets one.** Vanilla `Find_Faction_Headquarters` signals `CreateNewFactionRepresentative` only after it finds an HQ (`VFL:609-611`; also `:386`, `:680-681`, `:698-701`). That runs `create_representative_actor` on the HQ station (`VFL:718`). A faction manager with no HQ parameters gets no HQ (`VFL:616-620`) and so no representative. SWI keeps this logic: its `FL` is a diff that only adds managers (`FL` 136-720) [read]. The actor is built from a `factionrepresentative` character for the faction. `CHARS` defines one for 32 SWI factions, all on voice page **10101** (male) or **10106** (female) (`CHARS` 889-2068) [read].

| Faction group | HQ params (`FL`) | Rep character (`CHARS`) | Representative |
|---|---|---|---|
| Roster (13): galempire, ascendancy, newrepublic, rebelalliance, corporate, commerceguild, huttcartel, mandodw, anoat, hapes, kamino, valarian, blacksun | yes | yes | **yes** [inferred] |
| Other lawful posters: bountyhunters, naboo, kuat, miningguild, corellia, sienar, hoersh, rendili, incom, transgalmeg, moncal | yes | yes | **yes** [inferred] |
| sith (a Classic Baddie, #10) | yes (`FL` 638) | yes | yes, but never a payout faction after #10 |
| huttpirates, mandoraiders (Classic Baddies) | **no** (`FL` 675, 691) | yes | **no**; never a payout faction after #10 |
| twinsuns, baobab, tradefederation, tagge, bankingclan (traders) | **no** (`FL` 540-604) | yes | **no**. Their traders can be killed, so they can post bounties and get payouts |
| indibhg (named bounty hunters) | **no** (`FL` 326) | **no** | **no**. Its ships can be killed, so it can post bounties |
| khaak, xenon | no | no | no; on the victim lists, never a payout faction |

Also: a faction that SWI defeats (`SW_factions_defeat`) loses its HQ and representative (`VFL:514-531`), and a killed representative stays null until the 3-minute check makes a new one (`VFL:685-701`) [read]. A faction that **has** an HQ but whose rep creation fails logs `'Failed to create representative…'` from vanilla, not from Head Hunter (`VFL:728`).

**What Head Hunter does when there is none.** `PayoutEffect` stores `event.param.{1}.representative` in `$FactionRep` with no check (`HM:330`), the computer speaks line 279 anyway (`HM:331-334`), and `Speaky` then runs `start_script object="$FactionRep"` (`HM:342`). `representative` is "Given faction representative or null" (`SP` faction datatype) [read]. So the player hears "Incoming fund transfer" and no thanks, sees nothing else, and the claim, money and rep are already done (`HM:311-317`) [inferred]. Whether `start_script` on null writes a script error to the debug log isn't stated in `CX` [open]. It's the same code path in vanilla (any vanilla faction without an HQ), so this isn't new under SWI; SWI just has more such factions.

## 3. Voice lines

| Line | Who speaks it | Page | Text (`VT`) | Vanilla audio (`03.cat`) | SWI |
|---|---|---|---|---|---|
| 279 | `player.computer` | 10002 "Ship Computer - Betty" | "Incoming fund transfer" (`VT` 9752) | `voice-l044/10002/normal/279.ogg` | not overridden |
| 2013 / 2111 / 5023 | the representative | 10101 or 10106 (from `CHARS`) | "Good doing business." / "Thanks for your help." / "Here's a little something as thanks." (`VT` 11526, 11539, 11636; 14883, 14896, 14993) | `voice-l044/10101/normal/{2013,2111,5023}.ogg`, same for 10106 | not overridden |
| 2021 + 511 / 513 | `player.computer` (proximity, hunter reveal) | 10002 | "Ship" + "(object name) within sensor range." / "on intercept course." (`VT` 9979, 9846, 9848) | vanilla | not overridden |
| faction name after 279 | `player.computer` via `<name value="faction"/>` | 999840 (SWI) | e.g. "Galactic Empire" (`ST` 2544) | — | **no audio file** |

[read] for all of it:

- SWI's `t` files redefine pages 10120-10124, 10197-10199, 10259, 10365-10369, 10461-10463 and 10570-10572 (diplomat pages) but not 10002, 10101 or 10106. None of the redefined pages has lines 279, 2013, 2111, 5023 or 10101 (`ST` 6305-6457).
- SWI's cats ship voice audio only for `voice/999840`, `999841`, `999843` (`ext_01.cat`) and `voice-l044/` for the diplomat pages above (`subst_01.cat`). Nothing for 10002, 10101 or 10106. So the vanilla audio plays.
- No SWI MD, aiscript or library refers to page 10002, and SWI doesn't patch `player.interaction` (it isn't in `ext02/aiscripts`).
- Page 999840 is marked `voice="yes"` (`ST` 28), but `ext_01.cat` has no `voice/999840/normal/5xxxxx.ogg` files, so none of the faction names (ids 500110-533110) have audio. Vanilla has them (`voice-l044/20203/normal/201.ogg` for "Argon Federation"). `<name>` "requires that a name has been defined in the correct format" (`CX` 11853+). What the engine does with a voiced page and a missing file (skip the name, short silence, log line) is [open]. The subtitle shows the SWI name either way [inferred].

So SWI neither replaces nor mutes Head Hunter's voice lines. The only voice difference is the faction name, and the patch can't fix that without recording audio.

## 4. New player-visible text (decides #16)

**None is required.** Every faction name already comes from SWI's own text, and the patch's other change points (#8, #9, #10, #11) only change ids, conditions and lists [inferred from the change points named in SEED and those tickets].

One optional candidate:

- `{8008574,112}` "Only allow classic baddies on the wanted board (Xenon/Khaak/Pirates)" (`T:16`). Under SWI, with #10, the baddies are Unknown Threat, Yuuzhan Vong, Sith and four pirate factions. The tooltip names two factions by vanilla names the player never sees in SWI. Rewording it means the patch ships its own `t` files overriding that one line, in English and ideally in the five languages Head Hunter translates (Head Hunter also ships a default `0001.xml`). That's new text written here, so #16 would have one line to translate per language. If the line is left alone, #16 has nothing to do.

`{8008574,110}` "Bounty hunters may occasionally hunt you" and the other option texts don't name factions and fit SWI as they are [read].

## 5. Recommended patch changes

No change is **required** for text or voice. Change points, all optional, each a single node or attribute:

1. **Skip the thanks when there's no representative** (`md/headhuntermd.xml`, cue `Speaky`). `<add sel="//cue[@name='Speaky']/conditions">` a `<check_value value="@$FactionRep.exists"/>` written here. Effect: no `start_script` on null for traders, `indibhg` and defeated factions; the computer line still plays. Only worth it if the in-game log shows an error (§2 [open]).
2. **For #11, a bug found here** (every game, not SWI-specific). `PayoutEffect` is `instantiate="true"` and its child `Speaky` is also `instantiate="true"` with an `event_speak_finished … line="279"` condition (`HM:323`, `:337-339`). An instantiating sub-cue never completes, so each payout's instance stays alive, and its `Speaky` fires on **every later** line-279 speech. The nth payout of a session then makes up to n representatives speak thanks, each queuing through `player.interaction`'s `MaxQueueDelay` of 10s (`HM:344`, `VPI:10`) [inferred]. A one-attribute fix would be `<replace sel="//cue[@name='Speaky']/@instantiate">false</replace>`. If both 1 and 2 are taken, a `Speaky` whose check fails keeps waiting for the next 279, so 1 should then go on `PayoutEffect`'s conditions instead (`@event.param.{1}.representative.exists`), at the cost of also skipping the computer line for those factions. Decide in #11.
3. **Option text 112** (§4). Only if the user wants it; it creates #16's only work.

Both 1 and 2 respect the standing rule: XPath selectors plus a condition or attribute value written here.

## 6. In-game checks (for #13 row 15)

1. Claim a wanted bounty whose last victim was a Galactic Empire ship: does the computer say "Incoming fund transfer", what does it do at the faction name (silence, skip), and does a representative say one of the three thanks lines?
2. Claim one whose last victim was a trader faction (Twin Suns, Baobab, Trade Federation, Tagge, Banking Clan) or an `indibhg` ship: computer line only? Any `start_script` error in `debuglog.txt`?
3. Logbook "Bounty Claimed": does the last line read "Galactic Empire thanks you…" or show an id? Same for "Earned General Bounty" when the sector-owner rep branch pays.
4. Claim two bounties in one session: does the second claim produce two thanks speeches (§5.2)?
5. Map tab faction filter: are SWI's hidden vanilla factions (Argon Federation and so on) in the list?
