# Verification

The checklist for the patch: one row per check, one dated column per run. "Works as advertised" is signed off by a **full pass** (every row, focused and smoke) with the check helper's timing overrides **off**. The decisions behind it are in #13 and the spec, #18 (Testing Decisions). Terms are in [GLOSSARY.md](../GLOSSARY.md).

Nothing here is marked passed unless a run in game saw it. An empty run cell means not run.

## The patch

- **Extension id and folder: `hh_swi_patch`.** In this repo it lives at `patch/hh_swi_patch/`; installed, at `extensions\hh_swi_patch\`. The id and the folder are the same string, so a dependency (by id) and a path (by folder) can't be confused. It pairs with the check helper `hh_swi_checks` (`checks/hh_swi_checks/`), and the `patch/` and `checks/` folders keep the two extensions side by side at the repo root.
- `content.xml`: `<dependency version="800"/>`; `ws_2992233767` (Head Hunter) and `SW Interworlds` (SWI) required; `ws_2042901274` (SirNukes) optional. Content ids, not folder names, so the patch loads after all three. It ships `enabled="0"`; `tools/play/play.sh` turns it on in `90000401`.
- Its diffs of Head Hunter go under `patch/hh_swi_patch/extensions/chillheadhunter/...`, Head Hunter's **folder** name. That this reaches Head Hunter's loose (non-`.cat`) files is what C1 settles.

## Offline check

Before every install of the patch or the helper:

```
npm install        # once
npm run check      # or: node tools/offline-check/cli.mjs [extension folder ...]
npm test           # every test under tools/, including the same check as a test
```

It checks `patch/hh_swi_patch/` and `checks/hh_swi_checks/` (skipped until it exists):

- every XML file is well-formed (strict UTF-8, then a strict parser: X4 skips a file it can't parse);
- every file under `extensions/chillheadhunter/` is a `<diff>` of a file that exists in the installed Head Hunter, and each op's `sel` matches **exactly one** node there (X4 silently skips an op whose `sel` matches nothing);
- an op's `if`, when it has one, holds on the installed file: a path matches exactly one node, a `not(path)`'s path matches none.

Head Hunter is read from the install at run time (`HH_PATH`, default `/mnt/e/SteamLibrary/steamapps/common/X4 Foundations - 8.00/extensions/chillheadhunter`), never copied into the repo. The test `tools/offline-check/repo.test.mjs` also requires that install to be version 2.0.8 (`version="208"`), and is skipped where Head Hunter isn't installed. The checker's own tests use hand-written fixtures only.

It doesn't check the patch's diffs of base-game files (such as a later `libraries/equipmentmods.xml`), and it can't tell whether an op does what it should. Only the rows below can.

## Setup

- **Install and profile:** the play setup in [play-setup.md](play-setup.md): profile `90000401` on the shared X4 8.00 install, the mods in the install's shared `extensions\` with their default off, launched with `tools/play/play.sh`. The log is `…\Egosoft\X4\90000401\debuglog.txt`.
- **Mods:** SWI 0.91 HF1, Head Hunter 2.0.8, SirNukes Mod Support APIs 1.95, and the patch at the commit under test (copy `patch/hh_swi_patch/` to `extensions\hh_swi_patch\`, replacing the old folder). Reaper's Ship Pack, A Pirate's Life and Mycu's tooltips stay off.
- **Start:** a fresh SWI new game on a standard SWI start (not a custom start) in `90000401`. Write the start's name in the run's column. `swibh`'s series saves are never used.
- **Saves:** save before each group of checks (general bounties, wanted bounties, hunter groups, UI), named after the group and the run, so a failed check can be retried from there.
- **The check helper:** `hh_swi_checks` is on only while checks run, never in play. Copy `checks/hh_swi_checks/` to `extensions\hh_swi_checks\` and switch it on in `90000401` (the ticket that builds the helper adds that switch to `tools/play/play.sh`). Its timing overrides are on for quick runs and **off** for the signing-off full pass.

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

### Play setup checks

From the play setup (#20, [play-setup.md](play-setup.md)). They need a real launch by the user.

| # | Tier | Action | Expected result | Log line | A |
|---|---|---|---|---|---|
| P1 | S | Start X4 with `tools/play/play.sh`, check `game.lock` in the install while it runs, then quit | While the game runs, `game.lock` names `what=play 90000401`; after you quit, it's gone. (If the lock is released while the game still runs, `X4_nonsteam.exe` didn't block from WSL, and the script needs another way to wait.) | none | |
| P2 | S | A new SWI game in `90000401` | Head Hunter's "Head Hunter Mod Installed" message appears, and so does its map tab (the Headhunter Wanted Board) | none | |
| P3 | S | Launch profile `90000201` (`swibh`'s) | No sign of Head Hunter: no message, no map tab, and no `chillheadhunter`, `hh_swi_patch` or page `8008574` in its `debuglog.txt` | none | |

## Update procedure

When Head Hunter or SWI updates:

1. Diff the new version against Head Hunter 2.0.8 (or SWI 0.91 HF1) and map the changed lines to the rows above, using the code locations in the [feature note](https://github.com/ecarlste/x4-headhunter-swi-patch/blob/research/headhunter-features/research/headhunter-features.md).
2. Run `npm run check` against the new install (update the version the repo test expects once the patch targets the new version). Then launch and check the log for patch selector errors (C2).
3. Run the full pass in a new run column with the new versions, flagging the rows step 1 found.

A feature that fails on vanilla X4 too is an **upstream bug**: note it and leave it. New features in a new version mean a new map, not this checklist.
