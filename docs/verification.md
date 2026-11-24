# Verification

The checklist for the patch: one row per check, one dated column per run. "Works as advertised" is signed off by a **full pass** (every row, focused and smoke) with the check helper's timing overrides **off**. The decisions behind it are in #13 and the spec, #18 (Testing Decisions). Terms are in [GLOSSARY.md](../GLOSSARY.md).

Nothing here is marked passed unless a run in game saw it. An empty run cell means not run.

## The patch

- **Extension id and folder: `hh_swi_patch`.** In this repo it lives at `patch/hh_swi_patch/`; installed, at `extensions\hh_swi_patch\`. The id and the folder are the same string, so a dependency (by id) and a path (by folder) can't be confused. It pairs with the check helper `hh_swi_checks` (`checks/hh_swi_checks/`), and the `patch/` and `checks/` folders keep the two extensions side by side at the repo root.
- `content.xml`: `<dependency version="800"/>`; `ws_2992233767` (Head Hunter) and `SW Interworlds` (SWI) required; `ws_2042901274` (SirNukes) optional. Content ids, not folder names, so the patch loads after all three. It ships `enabled="0"`; `tools/play/play.sh` turns it on in `90000401`.
- Its diffs of Head Hunter go under `patch/hh_swi_patch/extensions/chillheadhunter/...`, Head Hunter's **folder** name. That this reaches Head Hunter's loose (non-`.cat`) files is what C1 settles.
- Its own cues, written here, are in `patch/hh_swi_patch/md/hh_swi_patch.xml` (mdscript `HH_SWI_Patch`), such as the player-hit stamp behind S/M capture pay (#28).

## Offline check

Before every install of the patch or the helper:

```
npm install        # once
npm run check      # or: node tools/offline-check/cli.mjs [extension folder ...]
npm test           # every test under tools/, including the same check as a test
```

It checks `patch/hh_swi_patch/` and `checks/hh_swi_checks/`:

- every XML file is well-formed (strict UTF-8, then a strict parser: X4 skips a file it can't parse);
- every file under `extensions/chillheadhunter/` is a `<diff>` of a file that exists in the installed Head Hunter, and each op's `sel` matches **exactly one** node there (X4 silently skips an op whose `sel` matches nothing);
- an op's `if`, when it has one, holds on the installed file: a path matches exactly one node, a `not(path)`'s path matches none;
- every base-game diff (`libraries/*.xml`, such as the patch's `libraries/equipmentmods.xml`, #25) on vanilla 8.00 (+ Timelines) patched by Head Hunter's and SWI's diffs, in **both** orders (they don't depend on each other, #5): each op that runs matches exactly one node, and a guarded add (`if="not(path)"`) leaves its path matching exactly one node whether it ran or was skipped, so the radar mod entry exists once either way. Vanilla and SWI are read from their unpacked copies (`X4_PATH`, default `/mnt/e/x4-dev/reference/x4-8.00`; `SWI_PATH`, default `/mnt/e/x4-dev/reference/mods/swi-0.91hf1/ext02`);
- the extension's own MD scripts (`md/*.xml`, such as the helper's cues): each is an `<mdscript>` named after its file, its cue names are unique, and every element is one X4's `md.xsd`/`common.xsd` declares (catches a misspelt action). The schema is read from the unpacked vanilla game (`X4_XSD_PATH`, default `/mnt/e/x4-dev/reference/x4-8.00/base/libraries`);
- `content.xml`: the id is the folder's name, it ships `enabled="0"`, and it requires (not optionally) what it loads after: the patch requires Head Hunter and SWI; the helper requires the patch, Head Hunter and SirNukes.

Head Hunter is read from the install at run time (`HH_PATH`, default `/mnt/e/SteamLibrary/steamapps/common/X4 Foundations - 8.00/extensions/chillheadhunter`), never copied into the repo. The test `tools/offline-check/repo.test.mjs` also requires that install to be version 2.0.8 (`version="208"`), and is skipped where Head Hunter isn't installed. The checker's own tests use hand-written fixtures only.

It can't tell whether an op does what it should. Only the rows below can.

## Setup

- **Install and profile:** the play setup in [play-setup.md](play-setup.md): profile `90000401` on the shared X4 8.00 install, the mods in the install's shared `extensions\` with their default off, launched with `tools/play/play.sh`. The log is `…\Egosoft\X4\90000401\debuglog.txt`.
- **Mods:** SWI 0.91 HF1, Head Hunter 2.0.8, SirNukes Mod Support APIs 1.95, and the patch at the commit under test (copy `patch/hh_swi_patch/` to `extensions\hh_swi_patch\`, replacing the old folder). Reaper's Ship Pack, A Pirate's Life and Mycu's tooltips stay off.
- **Start:** a fresh SWI new game on a standard SWI start (not a custom start) in `90000401`. Write the start's name in the run's column. `swibh`'s series saves are never used.
- **Saves:** save before each group of checks (general bounties, wanted bounties, hunter groups, UI), named after the group and the run, so a failed check can be retried from there.
- **The check helper:** `hh_swi_checks` is on only while checks run, never in play. See [The check helper](#the-check-helper) below. Its timing overrides are on for quick runs and **off** for the signing-off full pass. Fast timings are **on** in every new game the helper is in, so before the full pass, and before any check that needs Head Hunter's real timings, press "Fast timings on/off" once and check the log says `[hh-swi-check] fast timings off: …`, then save.

## The check helper

`hh_swi_checks` (`checks/hh_swi_checks/`, #22) is a test-only extension: `[hh-swi-check]` log lines and shortcut buttons, so checks are quick and their results visible. It holds only content written here. Its `content.xml` ships `enabled="0"` and requires the patch (`hh_swi_patch`), Head Hunter and SirNukes (its menu is a SirNukes Simple Menu API options menu).

- **Install:** copy `checks/hh_swi_checks/` to the install's `extensions\hh_swi_checks\`, replacing the whole folder each time it changes (run `npm run check` first). It stays installed between check runs; being installed doesn't load it.
- **Switch it on** for a check run: `tools/play/play.sh --checks`. That writes `hh_swi_checks` as on in `90000401`'s `content.xml` (and refuses if it isn't installed).
- **Switch it off** for play: `tools/play/play.sh` with no flag writes it as off. The script rewrites the profile's `content.xml` at every launch, so the last launch's flag decides; there's nothing to undo by hand. No other profile has an entry for it, and its default is off, so it loads nowhere else.
- **Its menu:** Options > Extension Options > **HH SWI checks**. Each line is one button ("Run"). Buttons that act on "the targeted ship" use your current target (`player.target`).
- **Its log lines** start with `[hh-swi-check]`. Read them with `grep -n '\[hh-swi-check\]' "$LOG"`.

| Button | What it does | Log line |
|---|---|---|
| Make the targeted ship wanted | Puts your target on Head Hunter's wanted table and board at a fixed 100,000 Cr, last victim faction `galempire`. Player-owned targets also join Head Hunter's player-wanted group. | `[hh-swi-check] make wanted: <id> <name> (<owner>) is now wanted, value 100,000 Cr, …` (or why not: no ship targeted, already wanted, no wanted table yet) |
| Print the wanted table | Writes a count line, then one line per entry in Head Hunter's wanted table | `[hh-swi-check] wanted table: N entries; …` then `[hh-swi-check] wanted: <id> <name> (<owner>) value … Cr, last seen …, last victim faction …, on the board true/false, exists …` |
| Send hunters now (#24) | Picks the player-owned wanted ship with the highest board value and signals Head Hunter's `SpawnHunters` at it, as `HunterTimer` would (the patch's pick filter applies). Only while no hunter group is out. | `[hh-swi-check] send hunters: at <id> <name>, board value … Cr …` (or why not: no player-owned wanted ship, a hunter group is already out), then the pick and hunt-target lines below |
| (dropdown) + Destroy HQ (#24) | The dropdown chooses one of the 13 roster factions; "Destroy HQ" destroys that faction's HQ station (`destroy_object`). X4 picks a new HQ within about 5 min (`CheckHQStatus`), so send hunters soon after. | `[hh-swi-check] destroy HQ: <faction> HQ <id> <name> in <sector> (sector owner …) destroyed; …` (or `… has no HQ right now`); choosing logs `destroy HQ: chosen faction <id>` |
| Fast timings on/off (#24) | Flips the helper's one timing switch and logs the new state (see [Timing overrides](#timing-overrides)) | `[hh-swi-check] fast timings on: …` / `fast timings off: …` |
| Force-bail the targeted ship (#28) | The crew of your target bail out now (`eject_npcs` with `force`), so Head Hunter's S/M capture handler runs if the ship is wanted. Refuses player-owned and XS ships. | `[hh-swi-check] force-bail: <id> <name> (<owner>), wanted true/false, value … Cr, last player hit at <time or null> (now <time>)` (or why not: no ship targeted, player-owned, XS) |

"Print the wanted table" also prints the last hunter pick (`last hunter pick, at player age …: …`, or `none yet`), one `roster: <faction> active …, HQ … in … (sector owner …)` line per roster faction (to find an HQ in a sector its faction lost), and `fast timings on/off`.

**Log lines from Head Hunter's cues** (#24): every time `SpawnHunters` picks (from `HunterTimer` or "Send hunters now"):

- `[hh-swi-check] hunter pick: <faction> (<name>), HQ <station> in <sector> (sector owner <id>); N of 13 roster factions eligible; skipped <faction> (inactive|no HQ) …`, or `hunter pick: none: no roster faction is active with an HQ, no hunter group this time; …`
- `[hh-swi-check] hunt target: <id> <name> (<owner>) in <sector>, board value … Cr, player-owned …`

Log lines the helper adds to Head Hunter's own cues (#28):

- after a wanted claim pays (destroy): `[hh-swi-check] claim: <id> <name> destroyed by <id> <name>, board <value> Cr, paid <reward> Cr, reputation to <faction id>`;
- after an S/M capture (bail) of a wanted ship: `[hh-swi-check] capture: <id> <name> bailed, board <value> Cr, reward <reward> Cr, last player hit at <time or null> (now <time>), paid true/false`.

### Timing overrides

One switch, `md.HH_SWI_Checks.Fast.$on`, **on** by default in a game the helper is in; the "Fast timings on/off" button flips it at run time. Each override chooses its short value when it's on and Head Hunter's own value when it's off (#24):

| What | Fast (on) | Head Hunter (off) | Takes effect |
|---|---|---|---|
| `HunterTimer` | every 1 min, 100% chance | every 10 min, 25% chance | at once |
| Hunter search give-up (`timetocamp`) | 3 min | 20 min | from the next hunt (read when the hunt's order starts) |
| Hunter lifetime (orphan clean-up in `HunterTimer`) | 10 min | 45 min | at once |

`HunterTimer`'s `checkinterval` can't switch (X4 wants it constant), so the helper sets it to 1 min, and with fast timings off a gate lets it through only once in the minute after each tick of the helper's own 10-minute clock: Head Hunter's 10-minute cadence, to within a minute. The cadence keeps the helper clock's phase, not Head Hunter's: `Slow_Clock` starts 30 s after the helper does, `HunterTimer` 30 s after Head Hunter's cue does, so with fast timings off a pick lands up to a minute after a `Slow_Clock` tick, and the first one after switching off can come anywhere from under a minute to about 11 minutes later (Head Hunter alone would also wait up to 10). Don't time a row from the button press. The signing-off full pass (#30) presses "Fast timings on/off" once, checks the log says `off`, and saves.

## Row format

Each row has: **#** (the id used in issues), **tier** (F = focused: a feature the patch changes or that was dead before it; S = smoke: a feature the patch doesn't touch, one action and one expected result), **action**, **expected result**, the **log line** to look for in `debuglog.txt` (or "none"), and one cell per run: `pass`, `fail` (with a note or issue link), or empty for not run. "Helper" means a `[hh-swi-check]` line or a helper button.

Rows are added by the build ticket that changes the feature they check; each ticket lists the rows it must pass.

## Runs

One column per run in the check tables, keyed by the run's letter.

| Run | Date | X4 | SWI | Head Hunter | SirNukes | Patch commit | Helper / timings | Start | Notes |
|---|---|---|---|---|---|---|---|---|---|
| A | | 8.00 (590967) | 0.91 HF1 | 2.0.8 | 1.95 | | | | |

## Failure rule

A check fails if its expected result doesn't happen, **or** if a new `Error in MD cue` line in `debuglog.txt` mentions `HeadHunter*`, `chillheadhunter`, the patch (`hh_swi_patch`) or the helper (`hh_swi_checks`) and isn't on the known-harmless list below. Patch errors count the same way: a parse error or a "sel matches nothing" style patch error naming one of those files fails the run.

### Known-harmless list

A line joins this list only with a note saying why it's harmless.

| Log line | Where | Why it's harmless |
|---|---|---|
| `Error in MD cue md.HeadHunterMD.SCapturedHandler: Evaluated value 'null' is not a string` (and the same from the full-capture handler) | `add_holomap_text` with `text="null"` in `SCapturedHandler` (`md/headhuntermd.xml:420`) and the full-capture handler (`:406`) | Head Hunter clears the ship's map label with a null text; the cue carries on. Seen on an unpatched run, 2026-11-23 (#13). |

## Checks

### Before the feature rows

| # | Tier | Action | Expected result | Log line | A |
|---|---|---|---|---|---|
| C1 | F | **Canary.** Install the patch with the canary op in place, launch with `tools/play/play.sh` and start a **new** SWI game (the canary is in Head Hunter's `Init` cue, which runs only when a new game's universe is generated; loading a save won't show it). | The canary line is in the log: the patch reaches Head Hunter's loose files at `extensions/chillheadhunter/...`. Then remove the canary (below). | `[hh-swi-patch] canary: the patch reached chillheadhunter/md/headhunterhunted.xml` | |
| C2 | F | **Load.** Same launch and new game as C1. | Head Hunter's papa cue starts, and there are no parse or patch errors from `chillheadhunter` or the patch (and, once it exists, the helper). | `HeadHunter PapaCue Activated`; and no `Error` lines naming `chillheadhunter`, `HeadHunter`, `hh_swi_patch` or `hh_swi_checks` other than the known-harmless list | |

To read C1 and C2 from WSL:

```
LOG=/mnt/c/Users/ecarl/OneDrive/Documents/Egosoft/X4/90000401/debuglog.txt
grep -n '\[hh-swi-patch\] canary' "$LOG"
grep -n 'HeadHunter PapaCue Activated' "$LOG"
grep -niE 'chillheadhunter|headhunter|hh_swi_patch|hh_swi_checks' "$LOG" | grep -i error
```

**Removing the canary, once C1 has passed** (by the user): delete the canary `<add>` and its comment from `patch/hh_swi_patch/extensions/chillheadhunter/md/headhunterhunted.xml`. If no other op is left in that file, delete the file. Run `npm run check`, commit (saying C1 passed and the canary is gone), then reinstall the patch by replacing the whole `extensions\hh_swi_patch\` folder so the removed op doesn't linger. From then on the helper's `[hh-swi-check]` lines prove the same thing. C1 stays in this table with its pass; it isn't rerun in later full passes, but C2 is.

### Check helper checks

From the check helper (#22). They need a real launch by the user.

| # | Tier | Action | Expected result | Log line | A |
|---|---|---|---|---|---|
| H1 | F | **Helper loads.** Install the helper, launch with `tools/play/play.sh --checks`, start a new SWI game (or load a `90000401` save) | No `Error` lines naming `hh_swi_checks` or `HH_SWI_Checks` (MD or patch errors), other than the known-harmless list | none (grep for errors, below) | |
| H2 | F | **Helper stays off.** Quit, launch with `tools/play/play.sh` (no flag), load the same game | The "HH SWI checks" menu is gone from Extension Options, and the new `debuglog.txt` doesn't mention `hh_swi_checks` or `HH_SWI_Checks` | none | |
| H3 | F | **Menu.** With the helper on: Options > Extension Options | An "HH SWI checks" entry opens a menu with "Make the targeted ship wanted", "Print the wanted table" and "Force-bail the targeted ship" (#28) | none | |
| H4 | F | **Make wanted.** Target an NPC ship that isn't wanted, press "Make the targeted ship wanted", then open Head Hunter's wanted board (Extension Options, and its map tab) | The ship is on the board at 100,000 Cr. Pressing it again logs "already wanted" and changes nothing. With no target it logs "no ship targeted". | `[hh-swi-check] make wanted: … is now wanted, value 100,000 Cr` | |
| H5 | F | **Print.** After H4, press "Print the wanted table" | A count line, then one line per wanted ship, including H4's ship at 100,000 Cr, on the board true | `[hh-swi-check] wanted table: …`, `[hh-swi-check] wanted: …` | |

```
grep -n '\[hh-swi-check\]' "$LOG"
grep -niE 'hh_swi_checks|HH_SWI_Checks' "$LOG" | grep -i error
```

### Play setup checks

From the play setup (#20, [play-setup.md](play-setup.md)). They need a real launch by the user.

| # | Tier | Action | Expected result | Log line | A |
|---|---|---|---|---|---|
| P1 | S | Start X4 with `tools/play/play.sh`, check `game.lock` in the install while it runs, then quit | While the game runs, `game.lock` names `what=play 90000401`; after you quit, it's gone. (If the lock is released while the game still runs, `X4_nonsteam.exe` didn't block from WSL, and the script needs another way to wait.) | none | |
| P2 | S | A new SWI game in `90000401` | Head Hunter's "Head Hunter Mod Installed" message appears, and so does its map tab (the Headhunter Wanted Board) | none | |
| P3 | S | Launch profile `90000201` (`swibh`'s) | No sign of Head Hunter: no message, no map tab, and no `chillheadhunter`, `hh_swi_patch` or page `8008574` in its `debuglog.txt` | none | |

### Wanted bounties: claims and captures

From S/M capture pays (#28, spec bug fixes 1 and 2). Save "wanted bounties A" first. "Board figure" is the ship's Wanted Reward on the board just before the action; payouts are rounded down to a whole credit (#6). For 8a-8c, the transaction log (Player Information > Transaction Log) should show the reward, or nothing, at the bail; the "Incoming fund transfer" voice may play even when unpaid (Head Hunter's own payout effect, not changed).

| # | Tier | Action | Expected result | Log line | A |
|---|---|---|---|---|---|
| 7 | F | Get a wanted NPC ship (helper "Make the targeted ship wanted", or one from the board) and note its board figure; destroy it with the player's ship | A "HEAD CLAIMED!" notification; the transaction log credit equals the board figure, rounded down (other pay for the same kill, such as a general or police bounty, is separate); the helper line's board and paid figures agree; reputation goes up with the ship's last victim faction (for a helper-made ship, `galempire`) | `[hh-swi-check] claim: … board X Cr, paid X Cr, reputation to <faction>` | |
| 8a | F | Make a wanted NPC **S or M** ship (helper button), note its board figure, hit it with a player-owned ship, then within 60 s target it and press "Force-bail the targeted ship" (or fight it until its crew bails) | The ship's crew bails, it leaves the board, and the player is paid the board figure, rounded down (transaction log); credits only, no extra reputation, notification or logbook line | `[hh-swi-check] capture: … board X Cr, reward X Cr, last player hit at T (now T+<60s), paid true` | |
| 8b | F | Make a wanted NPC S or M ship that **no player-owned ship has hit** (or wait over 60 s after the last hit), then force-bail it with the helper button | It leaves the board (bounty cleared), and the player is **not** paid: no credit in the transaction log | `[hh-swi-check] capture: … last player hit at null (or over 60 s before now), paid false` | |
| 8c | F | Make a wanted NPC **L** ship, then capture it (board it with marines, or force-bail it and claim it) | It leaves the board when it becomes the player's (bounty cleared), and the player is not paid | none from the helper (Head Hunter's L capture handler isn't patched); the board and transaction log show it | |

Also for 8a-8c: no new `Error in MD cue` lines from `SCapturedHandler`, `HH_SWI_Patch` or `HH_SWI_Checks` other than the known-harmless `text="null"` line.

### Wanted bounties: Classic Baddies and the victim lists (#27)

From #27 (spec #18 "Classic Baddies and the victim lists", bug fix 3, "Option text"; decisions in #10, #16, #17). The **baddies** are `xenon` (Unknown Threat), `khaak` (Yuuzhan Vong), `sith` (Sith Empire), `huttpirates` (Hutt Pirates), `mandoraiders` (Mandalorian Raiders), `valarian` (Pirate Syndicates) and `blacksun` (Black Sun): SWI's display names on page 999840 (`ext02/t/0001.xml`). Killing one of their ships never makes the killer wanted; with Classic Baddies on, only their ships get wanted bounties, and the player's ships are never hunted. Classic Baddies is "No Faction Wanted Bounties" in "HeadHunter Settings"; line 112 is its mouseover text. Save "wanted bounties A" first. Don't use the helper's "Make the targeted ship wanted" for these rows: it writes the board directly, past the checks under test.

| # | Tier | Action | Expected result | Log line | A |
|---|---|---|---|---|---|
| 6, 10 | F | Classic Baddies **off**. With one player ship that isn't wanted, kill a `galempire` ship, note the ship's board figure; then kill one ship each of `xenon`, `khaak`, `sith`, `huttpirates`, `mandoraiders`, `valarian`, `blacksun` with the same ship, checking the board after each. Separately, watch an NPC wanted ship on the board over some play (or "Print the wanted table" now and later) | After the first kill the player ship is on the board; its figure doesn't change with any of the seven baddie kills, and none of them makes another ship wanted. The NPC wanted ship's figure grows with each of its kills | helper "Print the wanted table": `[hh-swi-check] wanted: <player ship> … value …` the same before and after the baddie kills | |
| 9 | F | Hover "No Faction Wanted Bounties" in "HeadHunter Settings" and read the mouseover text; switch it **on**. From a save with no wanted player ship: kill a `galempire` ship with a player ship, then press "Send hunters now" and let `HunterTimer` run a few ticks (fast timings on). Then let NPC wars run and look at the board | The mouseover reads, word for word: "Only allow classic baddies on the wanted board (Unknown Threat/Yuuzhan Vong/Sith Empire/Pirates)", and "Unknown Threat", "Yuuzhan Vong" and "Sith Empire" match the board's "Wanted Ship"/faction-filter names for those factions. The player ship isn't on the board and no hunters come. Every new board entry is a ship of one of the seven baddie factions | `[hh-swi-check] send hunters: …` says no player-owned wanted ship; no `hunter pick:` line for the player | |

The five translated languages (`l007`, `l033`, `l034`, `l049`, `l086`) keep Head Hunter's "(Xenon/Khaak/Pirates)" text: a known gap (#16), not checked.

### Hunter groups: spawn (#24)

The roster is the 13 SWI factions with military S, M and L ships and an HQ: `galempire, ascendancy, newrepublic, rebelalliance, corporate, commerceguild, huttcartel, mandodw, anoat, hapes, kamino, valarian, blacksun`. Helper on, fast timings on (save "hunter groups A" first). Get a player-owned ship wanted first: target it and press "Make the targeted ship wanted".

| # | Tier | Action | Expected result | Log line | A |
|---|---|---|---|---|---|
| 19 | F | Press "Send hunters now" several times (waiting for each group to be gone, or let `HunterTimer` send them); choose a roster faction in the dropdown, press "Destroy HQ", then send hunters again within 5 min until that faction would have been picked; then use "Print the wanted table" to find an HQ in a sector its faction no longer owns (or `set_owner` one such sector) and send until that faction is picked | Every pick is one of the 13; never `boron`, `loanshark`, `split`, `terran`, `pioneers` or a vanilla faction. No `LIB_Create_Ships` error. After "Destroy HQ" the pick line lists that faction as `skipped … (no HQ)` and never picks it while it has no HQ. The faction whose HQ is in a lost sector is still picked and its hunters spawn. If every faction is skipped, no group spawns and the log says so | `[hh-swi-check] hunter pick: …`, `[hh-swi-check] hunt target: …`, `[hh-swi-check] destroy HQ: …`; no `Error` naming `LIB_Create_Ships`, `HeadHunterHunted` or `HH_SWI_Checks` | |
| 20 | F | Get hunted (as row 19) while you're far from the picked faction's HQ sector; watch the hunters on the map; change sector once they're close; then stay off their radar in a sector | The hunters appear at the centre of the HQ sector named in the pick line, not near you, and travel towards you. When you change sector they follow. Off their radar they give up when the search time runs out (3 min fast, 20 min off) and despawn; the group is cleared by the lifetime at the latest (10 min fast, 45 min off) | `[hh-swi-check] hunter pick: … HQ … in <sector> …` | |
| 21 | F | Watch one hunter from a lawful faction (not `blacksun` or `valarian`) before and after it has you on radar | Before contact it shows its faction's ordinary name and isn't hostile (not red). After contact its name is "… Head Hunter", it's hostile, and its ID code is the same. A `blacksun` or `valarian` hunter is hostile from spawn: expected, not a failure | none | |

### Hunter groups: scaling and equipment (#25)

From bug fix 4 (the hunt target always counts in its own size class) and the radar mod (spec "Radar mod", #5). Helper on, fast timings on, from save "hunter groups A". Head Hunter sizes the group from the player-owned ships within the target's radar range in its sector: one hunter per fight ship of each size (S, M, L; an XL counts as 3 L), and the target itself whatever its purpose. Difficulty is 1, or 2 above a board value of 1,000,000 Cr, or 3 above 5,000,000 Cr (Head Hunter compares the stored value / 100, #6).

| # | Tier | Action | Expected result | Log line | A |
|---|---|---|---|---|---|
| 22 | F | (a) Make a lone player-owned **M trader** wanted (no other player ship in its sector) and press "Send hunters now". (b) Then park two player S fighters and one M fighter next to a wanted player ship (fight or not) and send again; (c) move them out of its radar range and send again | (a) The fleet line reads S 0, M 1, L 0, with the trader marked `target`; one M hunter spawns and hunts it; no `create_order` error and no null leader in `HuntersCreated`. (b) S and M follow the fighters plus the target in its own size (e.g. a wanted M trader with them: S 2, M 2). (c) Only the target counts. The number of hunter lines matches the sizes (fewer only if `LIB_Create_Ships` found no ship of a size for that faction: note it) | `[hh-swi-check] fleet size: S … M … L …; difficulty …`, one `[hh-swi-check] hunter: …` per hunter; no `Error` naming `HuntersCreated`, `create_order` or `HeadHunterHunted` | |
| 23 | F | Get hunted at a board value under 1,000,000 Cr, then (from the save) at one over 1,000,000 Cr and one over 5,000,000 Cr (let the wanted ship's kills raise it; check "Print the wanted table") | The fleet line's difficulty is 1, 2, 3 in turn. Each hunter's mods line has more and higher-mark mods at the higher difficulty (weapon damage mk1 → mk2 → mk3, shield recharge → capacity mk2 → mk3), and always `mod_ship_radarrange_01_mk1_headhunter`, with `radar mod defined true, installed true`. No "no equipment mod definition" (or other equipment-mod) error. That the entry exists **once** in `equipmentmods` is checked offline (`npm run check`, both load orders); in game, no duplicate-entry error | `[hh-swi-check] fleet size: …; difficulty N …`, `[hh-swi-check] hunter mods: … radar mod defined true, installed true` | |
| carrier | F | Over rows 19, 22 and 23, read every `hunter:` line, in particular the L ones | Every hunter spawn has a line with its macro, class and type. Write the L hunters' macros in the run's Notes. A line marked `CARRIER` (type `shiptype.carrier`) is not a failure of this row: it opens a new issue for a carrier filter (changelog 1.8, spec "Left as Chillmatica's behaviour") | `[hh-swi-check] hunter: … macro …, class …, type …` | |

```
grep -nE '\[hh-swi-check\] (fleet size|hunter|hunter mods):' "$LOG"
grep -niE 'equipment ?mod|HuntersCreated|create_order' "$LOG" | grep -i error
```

### Hunter groups: hunt lifecycle (#26)

From #26 (spec bug fixes 5 and 6). The patch makes `HunterTimer` pick a new hunt target only while no hunter group is out, so the hunters, the payoff and the stand-down all stay on the ship the hunters set out for; and it tells drones apart with `isunit` instead of the English ship type name `'Drone'`, in the wanted trackers (a drone's kill or claim goes to its commander) and in the hunters' AI (drones aren't sent home or to resupply with the other subordinates). Helper on, fast timings on, from the "hunter groups A" save; get hunted as in row 19 ("Make the targeted ship wanted" on a player-owned ship, then "Send hunters now").

| # | Tier | Action | Expected result | Log line | A |
|---|---|---|---|---|---|
| 24 | F | With hunters on you, hail the hunter leader (the first ship of the group) and pick "Payoff Bounty for …"; once with less money than offered, once with enough | The choice names the hunted ship and offers **10x** its board figure. Without the money: a refusal line, nothing else changes. With it: the money leaves the player's account (transaction log), the ship leaves the board, and every hunter stops firing and flies off (and later despawns). The next pick, once the group is gone, is a new hunt | `[hh-swi-check] hunt target: …` names the ship on the choice; "Print the wanted table" no longer lists it after paying | |
| 25 | F | In "HeadHunter Settings" turn "Capturable Head Hunters" Enabled, get hunted, then board a hunter with marines (or fight one until its crew bails and claim it); then the same with the option Disabled | Enabled: the hunter can be boarded and becomes the player's; it leaves the hunter group (the rest keep hunting). Disabled: the board option is missing or refused | none; no new `Error in MD cue` naming `HeadHunterHunted` | |
| 26 en | F | Game language English. Get hunted by an L hunter that launches defence drones (send hunters at a wanted player ship worth enough for L hunters, or with L ships near it). Note the sending faction's relation (Factions menu), kill the hunter's drones and the hunter; then let a wanted NPC ship be killed by a player-owned ship's drones (an M/L ship with defence or fighting drones, under attack orders) | No relation loss with the sending faction from the hunter or its drones. The wanted claim by the player's drones pays, and its "HEAD CLAIMED!" names the drones' **commander** (the player's ship), not a drone. Hunters giving up or going to resupply send their ships, not their drones (no drone flies off on its own) | `[hh-swi-check] claim: … destroyed by <commander id> <commander name> …`; no new `Error` naming `isunit`, `HeadHunterMD` or `headhunter.assassinate` | |
| 26 de | F | The same as 26 en with the game language set to German (Deutsch, restart the game) | The same results as 26 en | the same as 26 en | |
| 19+ | F | Get hunted; then end the hunt three ways (one per hunt, from the save): the hunted ship is destroyed (self-destruct it, or let the hunters kill it); it's captured (an NPC boards it); its crew bails | Each time the hunters stop firing, the leader says a stand-down line, and every hunter flies off and despawns. No new hunter group comes at a ship that's gone, and the next pick is another wanted ship | `[hh-swi-check] hunt target: …` for the next hunt names a different ship; no new `Error in MD cue` naming `HeadHunterHunted` (`TargetClaimed`) | |
| fix | F | Make two player-owned ships wanted: A first ("Make the targeted ship wanted", 100,000 Cr), "Send hunters now" (it picks A). While the hunters chase A, raise B above A (B kills lawful ships until "Print the wanted table" shows B's value over A's) and let `HunterTimer` tick a few times (1 min fast). Hail the leader; then let A be destroyed | The hunters keep chasing A. The payoff choice names **A**. When A dies the hunters stand down (as 19+). Only once that group is gone does the next pick go to B | the first `[hh-swi-check] hunt target: …` names A; no new `hunt target` line while A's hunters are out; the next one names B | |

### Smoke checks

From #23: the features the patch doesn't touch, one action and one expected result each. Their first run is the **baseline** against the patch skeleton, before the feature changes land, so anything already broken on SWI shows up here and not in a later ticket. Numbers are the feature numbers from #2 (the [feature note](https://github.com/ecarlste/x4-headhunter-swi-patch/blob/research/headhunter-features/research/headhunter-features.md)). Options are in SirNukes Extension Options, menu "HeadHunter Settings"; the board is the "Headhunter Wanted Board" menu there. Faction ids are SWI's (`ext02/libraries/factions.xml`), with their English names.

**Getting a wanted ship for rows 11-14.** Until the helper's "make the targeted ship wanted" button exists, let NPC wars fill the board (check the board after some play), or have a player ship kill a lawful faction's ship (e.g. `galempire`, Galactic Empire). On the unpatched skeleton a player kill of an SWI pirate (`blacksun`, `huttpirates`, `mandoraiders`, `valarian`) also makes the player ship wanted (#2 §3.1); that is #27's change (rows 6/10), not a smoke failure.

**General bounties** (save "general bounties A" first)

| # | Tier | Action | Expected result | Log line | A |
|---|---|---|---|---|---|
| 1, 4 | S | With the multiplier at 1.0x, hit a hostile S ship (e.g. a `blacksun` Black Sun fighter) with the player's ship and kill it within 10 minutes of the first hit | An "Earned General Bounty" logbook entry naming the attacker, the victim, the sector and the payer; its money figure is added to the player's account (transaction log), with a bonus of 0 at 1.0x | none | |
| 2 | S | In a sector owned by an SWI faction (e.g. a `galempire` Galactic Empire sector), kill a ship that is hostile to that owner (e.g. Black Sun), with the player below +1 relation to the owner | A small rep gain with the sector owner (its relation in the Factions menu goes up slightly); the logbook entry's payer is that SWI faction, not "The Intergalactic Bounty Fund" | none | |
| 3 | S | Set "General Bounty Multiplier" to 2.0x, kill a hostile S ship as in row 1; then set it to 0 and kill another | At 2.0x the logbook's bonus equals its base pay (twice the pay in all); at 0 there is no "Earned General Bounty" entry and no money | none | |
| 5 | S | Turn "Gain reputation from kills" to Disabled, then repeat row 2 | No rep change with the sector owner from the kill; the general bounty is still paid | none | |

**Wanted bounties, board and language** (save "wanted bounties A" first)

| # | Tier | Action | Expected result | Log line | A |
|---|---|---|---|---|---|
| 11, 12 | S | Open the map with a wanted NPC ship and a wanted player-owned ship in a known sector; toggle "Player Wanted Ship Map Markers" off, then on | Each wanted ship has a label with its bounty in brackets, that grows with its kills; with the toggle off the player's own ship has no label, the NPC's still does; on, both show | none | |
| 13 | S | Set "Proximity Notify Value Threshold" above a wanted ship's value (Head Hunter compares the threshold with the stored value / 100, the units question of #6, so pick values well apart), fly a player ship into its sector within radar range; then set it well below and do the same | Above: no alert. Below: a purple "Wanted Ship Spotted in <sector>" (or, for the player's own ship's contact, "Wanted Ship Nearby!") notification, at most once a minute; the board's "Last Spotted" for that ship becomes this sector | none | |
| 14 | S | Turn "NPC Wanted Claim Notifications" Enabled and wait for an NPC to kill a wanted ship (the board's count drops); then Disabled and wait for another | Enabled: a "Bounty Claim" notification and a "Bounty Claimed: <ship>" logbook entry per NPC claim. Disabled: neither | none | |
| 16, 17 | S | Open "Headhunter Wanted Board": switch the "Wanted Faction:" filter to one SWI faction and back, use By Value, By Distance and By Latest Intel; then in "HeadHunter Settings" press "Print to log", then RESET | The board shows MOST WANTED and a row per wanted ship (Wanted Ship, Wanted Reward, Last Spotted, Wanted By, with SWI faction names); the filter shows only that faction's posts; each sort reorders the rows; Print writes one line per wanted ship to Head Hunter's own `wanted` debug file (`debug_to_file`, directory `HeadHunter` in the profile folder; not `debuglog.txt`); after RESET the board is empty | `(HeadHunter Table) Killer: … \|\| Running Total: …` in that file, not in `debuglog.txt` | |
| 18 | S | Set the game language to German (Deutsch), restart, open the options and the board | Head Hunter's text is in German, e.g. "Headhunter-Gesucht-Board", "MEISTGESUCHT", "Nach Wert". Hard-coded English (the board's column headers, the "HeadHunter Settings" title, the " Head Hunter" suffix) is noted, not failed | none | |

**UI** (save "UI A" first)

| # | Tier | Action | Expected result | Log line | A |
|---|---|---|---|---|---|
| 27 | S | Open the map and Head Hunter's tab in the right sidebar; use its location filter ("Show all locations" / "Only known sectors"), its faction filter ("Show all factions" / one SWI faction) and its three sorts | The tab has its icon and a table of wanted ships (Wanted ship, Reward, Last spotted, Wanted by) that follows each filter and sort | none; and no `attempt to index` or `Widget setup error` in the log | |
| 28 | S | In that tab, double-click the row of a wanted ship last seen in a known sector; then look at a row in an unknown sector | The map centres on the known sector; the unknown one reads "Unknown sector", is greyed out and can't be clicked | none | |

**Triage of a failed smoke row.** A smoke row tests a feature the patch doesn't change, so a failure is either Head Hunter's or SWI's:

1. Rerun it from the group's save with the patch off (`hh_swi_patch` disabled). If it still fails, try it on vanilla X4 with Head Hunter alone (no SWI) when that's quick to set up.
2. Fails on vanilla too: an **upstream bug**. Write `fail (upstream: <one line>)` in the run cell, note it in the run's Notes, and leave it.
3. Fails only on SWI, or only with the patch: open a new issue (`needs-triage`) with the row number, the run letter and the log lines, and link it in the run cell: `fail (#n)`.

### Payout voice

From #29 (bug fix 7 and the no-representative guard, #17). Row 15 is focused: the patch makes `Speaky` fire once per payout and skips the thanks when the victim's faction has no representative. "The computer line" is `player.computer`'s "Incoming fund transfer from" (line 279) followed by the faction name; "thanks" is the representative's "Good doing business." / "Thanks for your help." / "Here's a little something as thanks.". Claims speak only with "Verbal Payout Notifications" on in "HeadHunter Settings" (its default). The helper's "Make the targeted ship wanted" sets the last victim faction to `galempire` (Galactic Empire, which has a representative), so it suits 15a, not 15b.

| # | Tier | Action | Expected result | Log line | A |
|---|---|---|---|---|---|
| 15a | F | In one session, claim two wanted bounties (kill the wanted ship with the player's ship) whose last victims were from factions with a representative (e.g. two ships made wanted with the helper button, last victim `galempire`). Let the first payout's voice finish before the second claim | First claim: the computer line, then one thanks. Second claim: the computer line **once** and **exactly one** thanks (before the fix, the second claim brought two). A faction name that is silent after line 279 is recorded in the run's Notes, not failed (SWI ships no voice files for its faction names) | none; and no new `Error in MD cue` naming `HeadHunter*` or `hh_swi_patch` | |
| 15b | F | Claim a wanted bounty whose last victim was a trader faction (`twinsuns`, `baobab`, `tradefederation`, `tagge`, `bankingclan`) or `indibhg` (a ship that killed one of their ships; check "Wanted By" on the board) | The computer line plays, no thanks follows, and no new Head Hunter or patch MD error appears | none; and no new `Error in MD cue` naming `HeadHunter*` or `hh_swi_patch` (in particular none from `Speaky` or `start_script`: the guard is `@$FactionRep.exists`, so a null representative reads as false, not an error) | |

```
grep -niE 'Speaky|PayoutEffect' "$LOG" | grep -i error
```

## Update procedure

When Head Hunter or SWI updates:

1. Diff the new version against Head Hunter 2.0.8 (or SWI 0.91 HF1) and map the changed lines to the rows above, using the code locations in the [feature note](https://github.com/ecarlste/x4-headhunter-swi-patch/blob/research/headhunter-features/research/headhunter-features.md).
2. Run `npm run check` against the new install (update the version the repo test expects once the patch targets the new version). Then launch and check the log for patch selector errors (C2).
3. Run the full pass in a new run column with the new versions, flagging the rows step 1 found.

A feature that fails on vanilla X4 too is an **upstream bug**: note it and leave it. New features in a new version mean a new map, not this checklist.
