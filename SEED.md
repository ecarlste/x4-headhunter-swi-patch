# Head Hunter on SWI: seed for a wayfinder map (2026-11-23)

The starting brief for this project, `x4-headhunter-swi`, to be charted with `/wayfinder`. It collects what the `x4-swi-bounty-hunter` repo (`swibh`) already knows. Charting should grill the destination and open questions from here, not re-research them.

Tags: [read] = seen in files; [inferred] = follows from what was read; [user] = the user said so; [open] = not settled.

Links marked **R:** point at research notes in the `swibh` repo. The `swibh` repo keeps research on `research/<name>` branches that are pushed but never merged. These notes are on branch `research/chill-headhunter-compat`: https://github.com/ecarlste/x4-swi-bounty-hunter/tree/research/chill-headhunter-compat/research (read one with `git show origin/research/chill-headhunter-compat:research/<file>` in the `swibh` checkout). Older notes they build on (`headhunter.md`, `headhunter-wings.md`) are on main. Related branches: `research/headhunter-original` (what the original has that Reloaded dropped, written before the zip was read) and `research/sirnukes-on-8` (SirNukes on 8.00 + SWI).

## The idea

Play Chillmatica's **Head Hunter** (Nexus 1150, Steam Workshop 2992233767, folder `chillheadhunter`) on **X4 8.00 + Star Wars Interworlds 0.91 HF1** with **100% of its advertised features working**. The point is to find out what's fun about it, which may feed into `swibh` (the SWI Bounty Hunter series mod) [user]. The SWI wiki lists Head Hunter as a compatible mod [user; not checked here]. Reading it says the core works but the hunter half doesn't (below).

The thing we build is a **patch**: a separate small extension that needs both Head Hunter and SWI and makes them work together. That's the community's term for it, e.g. "Battlestar Galactica - SWI Patch" (R: compat-patch-terminology.md) [read].

## Decided: private play, nothing published

On 2026-11-23 the user decided not to publish anything to Nexus or Steam [user]. So the destination is a patch for the user's own install only.

What still applies:
- Nexus 1150's permissions ask for the author's permission before modifying the files, and before modifying them with generative AI (R: chill-headhunter.md, "Permissions") [read]. Nexus's AI policy (updated 2026-11-05) made "Ask Me" the default for AI use and forks on every hosted mod, so the author probably didn't pick these lines themselves. The policy is written only for content hosted on Nexus and says nothing about private use [read, help.nexusmods.com/article/180-ai-policy-changes-2026]. Whether to ask Chillmatica anyway is the user's call [open].
- "Upload permission: not allowed to upload this file to other sites under any circumstances" [read]. So this repo must not hold Head Hunter's files (see the standing rule below).

## Environment

- X4 **8.00, build 590967** (main menu "Version: 8.00 (590967)"; `version.dat` `800`). Install: `E:\SteamLibrary\steamapps\common\X4 Foundations - 8.00` (WSL: `/mnt/e/SteamLibrary/steamapps/common/X4 Foundations - 8.00`). All five story DLCs plus Timelines and the minis [read].
- **SWI 0.91 HF1** (`content.xml` version `091`, dated 2025-12-24) in `extensions/starwarsmod_m1`. Unpacked reference: `E:\x4-dev\reference\mods\swi-0.91hf1` (`ext/`; `ext02/` holds md, aiscripts, libraries and t; `subst02/` holds the UI) [read].
- Vanilla references: 8.00 at `E:\x4-dev\reference\x4-8.00` (unpacked from the same install), 9.00 at `E:\x4-dev\reference\x4-9.00` [read].
- Other mods in the shared install: Reaper's Ship Pack 2.8 (`starwars_rsp`, adds SWI-faction ships and jobs), Mycu's Equipment tooltips, and `swibh` when its tests run. `apirateslife` is the user's own WIP mod: ignore it [read, user].
- **Head Hunter 2.0.8** zip in Downloads: `C:\Users\ecarl\Downloads\Head Hunter 1150 2.0.8 2026-10-31T01-33Z K8iPi4yGe.zip` (loose files). 2.0.1 is there too (`Head Hunter-1150-2-0-1-1693843416.zip`, packed in `ext_01.cat`). 2.0.8 is the version to target: it loads on 8.00 and fixes 2.0.1's bugs [read].
- **SirNukes Mod Support APIs**: not installed, and Head Hunter needs it in practice (below). Downloads has 1.94, but **1.95** (2025-12-08) is the last release and the end of the 8.0 line. It declares no upper game version and should run on 8.00 + SWI; its own in-game check (`swibh` test T14) hasn't run (R: `research/sirnukes-on-8` branch) [read]. Use 1.95.
- Don't install Head Hunter next to **Head Hunter - Reloaded** (`ice_headhunter`, Nexus 2289). Both use the same text page and mdscript names [read].

## What Head Hunter advertises, and its state on 8.00 + SWI 0.91 (2.0.8)

From the changelog (1.0-2.0.8) and the three research notes. "Works" means by reading only; nothing has run in game.

| Feature | State | Source (R:) |
|---|---|---|
| General bounty: pay (and rep) for hostiles the player's ships attacked and that died | Works. Pay is far above SWI's (TIE ~2-3k Cr, ISD 1-2M+). Pays whoever made the kill. Valued at first hit, not death | chill-headhunter-md.md §5, chill-headhunter-swi.md §2 |
| Bounty multiplier 0-10x, reputation-gain toggle | Works [inferred] | chill-headhunter-md.md |
| Wanted bounties: ships that kill get a bounty that grows | Works. Far wider than SWI's tracker: pirates, Vong, Menace Inconnue, the player's own ships | chill-headhunter-swi.md §1.4 |
| Claiming a wanted bounty (credits + rep) | Works. **Units unsure:** pays the board figure or 1/100 of it | chill-headhunter.md, open question 1 |
| "No faction wanted bounties" / Classic Baddies (only Xenon, Kha'ak, Scale Plate, Buccaneers) | **Broken in meaning.** Under SWI only Menace Inconnue and Yuuzhan Vong qualify. SWI's pirates (`huttpirates`, `mandoraiders`, `blacksun`, `valarian`) never do | chill-headhunter-swi.md §1.3 |
| Capturing a wanted S/M ship pays the bounty; L/XL clears it | Abandoned S/M ships **pay nothing** (bug in every version) | chill-headhunter-md.md §5 |
| Wanted board: SirNukes menu, and the map sidebar tab (2.0, by Mycu) with sorts (incl. "By Latest Intel") | Works **with SirNukes**. SWI's own `menu_map` has all 5 hooks, so kuertee UIX isn't needed. Folder name must be `chillheadhunter` | chill-headhunter-ui.md |
| Wanted labels on the holomap, proximity notifications with value thresholds | Works [inferred] | chill-headhunter-md.md |
| Logbook entries, NPC claim notifications toggle, faction "thanks" voice toggle | Works. Voice lines unchecked | chill-headhunter-md.md §8 |
| Translations (ru, fr, es, de, zh) | Text only. Page 8008574 is free in SWI and `swibh` | chill-headhunter-swi.md §3 |
| **Head hunter groups** sent after the player's wanted ships | **Never spawn.** All 12 roster factions are inactive in SWI with no ships. The spawn point is the faction HQ with no fallback. Retries every 10 min with log errors | chill-headhunter-swi.md §1.2 |
| Hunter fleet sized to the player's offensive ships | Dead (no hunters) | chill-headhunter-md.md |
| Hunter equipment and the radar mod | Dead. The radar mod may also be wiped by SWI's `<replace sel="/equipmentmods">`, depending on load order | chill-headhunter-md.md §3 |
| Pay off hunters over comms (10x bounty) | Dead (no hunters) | chill-headhunter-md.md |
| Option to capture hunter ships; no rep hit for killing hunters or their drones | Dead (no hunters). The drone check compares `typename == 'Drone'`, probably English only | chill-headhunter-md.md §6 |
| Boron only after the story; OTAS from XRe | Boron gate cue doesn't exist under SWI (log error). OTAS skips cleanly | chill-headhunter-swi.md §1.2 |
| Hunter AI | Subordinate loop gives the Attack order to the leader | chill-headhunter-md.md §6.7 |

## What the patch would have to change (known so far)

All MD or library XML. X4 lets one extension diff-patch another extension's files by path, the way `swibh` patches SWI with `extensions/starwarsmod_m1/md/kuertee_emergent_missions.xml` [read]. The Lua (`ch.txt`) needs no change as far as we've read.

1. **Hunter roster** (`md/headhunterhunted.xml:57-73`): swap in SWI factions that have `military` S, M and L ship categories: `huttcartel`, `mandodw`, `blacksun`, `valarian`. `huttpirates` and `mandoraiders` lack L. `indibhg` has only named tags, `bountyhunters` has none [read]. Which factions fit Head Hunter's fantasy is a design choice [open].
2. **Spawn point** (`:136`): add a fallback when the faction has no headquarters, like Reloaded's (a random station, then the target's sector) [read].
3. **Classic Baddies list** (`md/headhuntermd.xml:247`, `:264`): add SWI's pirate and outlaw factions [open which].
4. **Boron gate** (`md/headhunterhunted.xml:58`): guard or drop it, since SWI empties the DLC setup scripts.
5. **Radar mod**: make sure it survives SWI's `equipmentmods` replace (load-order dependency on SWI) [inferred].
6. **Bugs, if "as advertised" includes them:**
   - abandoned S/M ships pay nothing;
   - the drone `typename` check;
   - the leader gets the Attack order;
   - the general bounty pays any killer.
7. **Patch `content.xml`**: depend on `chillheadhunter`, `starwarsmod_m1` and SirNukes, so it loads after all of them.

Whether a diff patch can target every one of these XPath locations cleanly, or whether some cues need whole replacement, isn't checked [open].

**Standing rule: no Chillmatica code in the repo.** Patches hold only XPath selectors and content we wrote [user, 2026-11-23]. Naming their cue names and file paths in a selector is fine. Don't copy a whole cue or file out of Head Hunter, edit it and `<replace>` it in. Patch the specific nodes or attributes that change, with small `<add>`, `<replace>` and `<remove>` operations on exact selectors. This also keeps the patch from breaking on unrelated Head Hunter updates. If a change really needs a whole cue swapped, write the new cue from scratch and say so in the commit.

## Things it does to a game that aren't bugs, but matter for play

- **Pay stacks.** One kill can pay four times: the vanilla police bounty, SWI's EM hunt, Head Hunter's general bounty and its wanted claim. Reputation gains stack too [read].
- `save="0"`: saves don't need it. Removing it leaves dead globals (the wanted table, a group of nearly every ship) [read].

## Testing

- The 7 in-game checks and the debuglog strings to search for are in R: chill-headhunter.md ("In-game test, if we run one") and in each detailed note.
- Setup: X4 closed; SirNukes into `extensions/sn_mod_support_apis`; Head Hunter into `extensions/chillheadhunter`; run with `-debug all -logfile debuglog.txt`; UI safe mode off [read].
- `swibh` has an automated in-game test runner (`make game-test`, `tools/run-game-tests.ps1`, `tests/game/`). It may be reusable, but it installs into the same shared game, so only one project can use the game at a time [read].
- A separate play profile or install may be worth it so Head Hunter doesn't touch the `swibh` test install [open].

## Fog (for "Not yet specified")

- Which SWI factions should hunt, and which count as "baddies", for the Star Wars fantasy.
- Whether hunter pay and general bounty pay should be rebalanced for SWI's economy, or left alone as "as advertised".
- Where the play install lives relative to the `swibh` test install.
- How to verify each feature: by hand, or with an automated runner like `swibh`'s.
- What findings flow back into `swibh`, and how they're recorded there.
- This repo's own setup: issue tracker for the wayfinder map, public or private.

## Sources (R:)

All in `ecarlste/x4-swi-bounty-hunter`, under `research/`, on branch `research/chill-headhunter-compat` unless noted:

- chill-headhunter.md: the summary, verdict and permissions.
- chill-headhunter-md.md: MD, aiscript and library patches, the 2.0.1 → 2.0.8 diff, bugs.
- chill-headhunter-ui.md: the Lua map tab, SirNukes, SWI's menu hooks.
- chill-headhunter-swi.md: factions, pay, clashes, save safety.
- compat-patch-terminology.md: what to call it.
- headhunter.md, headhunter-wings.md (main): the Reloaded rebuild, whose fixes (spawn fallback, pirate list) are a reference.
- headhunter-original.md (branch `research/headhunter-original`): features the original has that Reloaded dropped, e.g. the SirNukes-only board, Roaming Fleet integration, "disguised" hunters that hide their transponder until contact.
- sirnukes-on-8.md (branch `research/sirnukes-on-8`): SirNukes 1.95 on 8.00 + SWI.
- headhunter-swi-patch-seed.md: the source of this file.
