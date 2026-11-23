# Keeping Head Hunter play out of swibh's test install

Research for [#7](https://github.com/ecarlste/x4-headhunter-swi-patch/issues/7), 2026-11-23. Facts and trade-offs only, no recommendation. Nothing in the game install or user data was changed.

Tags: [read] = seen in files on this machine; [doc] = from a web source (named); [inferred] = follows from what was read; [unverified] = not checked.

## TL;DR

- The 8.00 install is a **NoSteam copy that Steam doesn't manage**. Steam's own X4 is the 9.00 beta in a different folder. So Steam updates and Steam launch options don't reach the 8.00 copy.
- The X4 **profile** (saves, `content.xml` extension switches, `config.xml`, `uidata.xml`, `debuglog.txt`) is chosen per launch with `-personalfolderid <number>`. The **extensions** a profile can see are the ones in the install's `extensions\` folder, plus possibly a "personal" `extensions\` folder inside the profile (the engine supports this; not tested on this copy).
- A profile's `content.xml` only switches extensions on or off. An extension with no entry follows its own `enabled` default, and Head Hunter 2.0.8 says `enabled="1"`. So if Head Hunter goes in the shared `extensions\` folder, **swibh's test profile (90000201) and A Pirate's Life's (90000301) would load it** unless their `content.xml` switches it off.
- swibh's runner takes `X4_PATH`, `X4_EXE`, `X4_PROFILE_ID` and `X4_PROFILE_ROOT` from params, env or `test.config`. It can be pointed at another install or profile without code changes. What it can't do: run while any `X4_nonsteam` process is up, test Head Hunter's own features, or report extensions that are on by default.

## 1. The install and where its data lives

### The 8.00 copy

- Folder: `E:\SteamLibrary\steamapps\common\X4 Foundations - 8.00`, `version.dat` = `800` [read]. Size on disk is about **50 GB**, of which `extensions\starwarsmod_m1` (SWI) is 18 GB, the DLCs about 8 GB and `videos\` 4.7 GB [read, `du`].
- Steam's manifest for X4 (`steamapps/appmanifest_392160.acf`) has `installdir "X4 Foundations"`, `BetaKey "9.00"` and `AutoUpdateBehavior "0"`. The `X4 Foundations` folder's `version.dat` is `900` [read]. No manifest names `X4 Foundations - 8.00`, so Steam doesn't update or verify it [inferred].
- The copy runs `X4_nonsteam.exe` (56,164,712 bytes, the same size as `E:\x4-dev\nosteam-8.00\X4_nonsteam.exe`). `X4.exe` (Steam) is also there [read]. A Pirate's Life's `docs/environment.md` describes it as the "X4 8.00 HF4 copy for SWI (NoSteam)", started by the `X4_8.00` desktop shortcut, with the NoSteam download kept in `E:\x4-dev\nosteam-8.00\` [read]. swibh's `mods.md` says the same [read].
- Extensions in the copy: the 7 DLCs, `starwarsmod_m1` (SWI 0.91 HF1), `starwars_rsp`, `mycu_equipment_tooltips` and `apirateslife` [read]. There is no SirNukes and no Head Hunter.
- `game.queue\` (empty) sits in the install folder. It is A Pirate's Life's **game lock** line, which lives at `<X4_PATH>\game.lock` and `<X4_PATH>\game.queue\` (`x4-pirates-life-mod/tools/README.md`, "The game lock") [read]. swibh's runner doesn't take that lock yet (no `game.lock` in swibh's `tools/`). That work is swibh issue #115, "Game runner takes the shared game lock and its line; apirateslife off in test profile" (open) [read].
- Free space: E: 488 GB, C: 57 GB [read, `df`].

### User data (profiles)

Documents is redirected to OneDrive. `C:\Users\ecarl\Documents\Egosoft\X4` doesn't exist. The data is in `C:\Users\ecarl\OneDrive\Documents\Egosoft\X4\` [read]. swibh's runner finds it through `[Environment]::GetFolderPath('MyDocuments')`, which follows the redirect [read].

| Folder | What it is | Contents [read] |
| --- | --- | --- |
| `X4\` (root) | NoSteam's default profile: the 8.00 playthrough (swibh's series) | `content.xml`, `config.xml`, `inputmap.xml`, `uidata.xml`, `userdata.xml`, `debuglog.txt`, `save\` (save_001-020, autosaves), an empty `extensions\` |
| `X4\28456535\` | Steam profile (Steam account ID), 9.00 | `steam_autocloud.vdf`, own `content.xml`, `save\`, an empty `extensions\` |
| `X4\90000001\`, `90000002\` | A Pirate's Life's 2026-10-28 NoSteam spike | debuglogs only |
| `X4\90000201\` | swibh's test profile (`X4_PROFILE_ID`) | `content.xml`, `config.xml`, `save\save_007.xml.gz`, `debuglog.previous.txt` |
| `X4\90000301\` | A Pirate's Life's test profile | `content.xml`, `save\apirateslife_release_*.xml.gz`, debuglogs |

What is per profile: saves (`save\`), extension on/off (`content.xml`), graphics (`config.xml`), UI state (`uidata.xml`), keybinds (`inputmap.xml`; 90000201 has none, so it runs on defaults), `debuglog.txt` and `logs\` [read; the per-file list is in swibh `test-plan.md` "Test environment"]. Egosoft's wiki confirms the numbered folder under `Documents\Egosoft\X4` and that `config.xml` lives there ([Resetting game configuration](https://wiki.egosoft.com/X4%20Foundations%20Wiki/Troubleshooting/Resetting%20game%20configuration)) [doc].

## 2. Launch options for a separate profile or extension folder

No official Egosoft page lists X4's command-line switches. A search found none on the wiki or forum, and a forum thread asking for the list has no answer (search results, 2026-11-23) [doc]. So the evidence is the binary's strings plus tests on this machine.

- **Switch names in the 8.00 `X4.exe`** (`strings`), in one table: `skipintro`, `scriptlogfiles`, `logfile`, `personalfolderid`, `prefersinglefiles`, `enablealldlc`, `noworkshopsync`, `nocputhrottle`, `nodefaultlog`, `nomods`, `nodlc`, `usedefaultconfig`, `dontsaveconfig`, `disableventures` and others [read]. None of them names an alternative **game** or **extensions** folder. `X4_nonsteam.exe` doesn't show these strings in plain text (it looks packed), but swibh's `test-plan.md` records that the `-logfile` name was found in its strings [read].
- **`-personalfolderid <number>`** uses `…\Egosoft\X4\<number>\` as the profile, created on first launch. Only a numeric ID works. A full path or a plain name falls back to the root profile. This was tested on 2026-10-17/18 and 2026-10-28 (A Pirate's Life `docs/environment.md`; swibh `test-plan.md`), and 90000001/201/301 exist [read]. The profile's location can't be moved: it is always under Documents\Egosoft\X4 [inferred from the fallback behaviour].
- **`-nomods`**: the name is in the binary. What it does isn't documented [unverified]. It is not a per-mod switch.
- **Personal extensions folder.** The 8.00 engine and UI know about extensions that live in the profile folder:
  - The Lua API takes a `personal` flag: `HasExtension(id, personal)`, `IsExtensionEnabled(id, personal)`, `GetExtensionVersion(id, personal)`, and `SetExtensionSettings(extension.id, extension.personal, "enable", …)` in `ui/addons/ego_gameoptions/gameoptions.lua` [read, unpacked 8.00].
  - The map editor offers "(Personal)" extensions and says the export goes to "'$extensionfolder/maps' sub-folder of your personal X4 folder" (`menu_mapeditor.lua:1025,1041`) [read].
  - `X4.exe` has `personalextension` and `isextensionpersonal` [read].
  - The root and Steam profiles each have an empty `extensions\` folder [read].
  - Forum users report in 2018 that mods placed in `Documents\Egosoft\X4\<id>\extensions\` load. No Egosoft staff member confirms it in those threads ([viewtopic p=4761621](https://forum.egosoft.com/viewtopic.php?p=4761621), [p=4765800](https://forum.egosoft.com/viewtopic.php?p=4765800)) [doc].
  - **Not tested on this copy:** that a personal extension loads under `X4_nonsteam.exe -personalfolderid <n>` on 8.00, that dependency ordering against SWI works, and that Head Hunter's Lua and SirNukes work from there.
- **Steam launch options.** These apply to Steam's X4 entry, which is the 9.00 beta in `X4 Foundations\` (appmanifest above). They don't reach the 8.00 copy, which is started by the desktop shortcut [read, inferred]. A non-Steam-game shortcut in Steam would just be another shortcut [inferred].
- **One game at a time.** `X4.exe` has an `EGOSOFT_X4_INSTANCE` string [read]. A Pirate's Life's tools README says "X4 runs one game per Windows login" [read]. So two installs or profiles can't run at the same time either [inferred; not tested].

### How a profile decides which extensions load

- Profile `content.xml` entries only switch extensions on or off. With no entry, an extension follows the `enabled` attribute in its own `content.xml` [read]. Evidence:
  - SWI says `enabled="0"`, so swibh's runner has to switch it on in a new profile (runner header, README).
  - RSP and Mycu say `enabled="1"`. They have **no** entry in 90000201's `content.xml`, yet that profile's last test log (`debuglog.previous.txt`, 2026-11-10) reads their files (1,207 lines naming `starwars_rsp` or `mycu_equipment_tooltips`). The root profile lists both as `enabled="false"`, and its log has none [read].
- **Head Hunter 2.0.8**: `id="ws_2992233767"`, `enabled="1"`, `save="0"`, folder `chillheadhunter`, optional dependencies on SirNukes (`ws_2042901274`) and kuertee UIX [read, zip in Downloads]. **SirNukes 1.95**: `id="ws_2042901274"`, no `enabled` attribute (default unverified) [read, zip]. Neither id appears in the root, 90000201 or 90000301 `content.xml` [read].
- So, if Head Hunter, SirNukes or the patch went into the shared `extensions\` folder, every 8.00 profile without an explicit `enabled="false"` entry would load them. That includes swibh's tests, A Pirate's Life's tests and the series playthrough [inferred from the above].

## 3. Options and their costs

| Option | Disk | Steam updates | Saves and settings | Effect on swibh's tests |
| --- | --- | --- | --- | --- |
| **A. Second copy of the game folder** (for example `X4 Foundations - 8.00 HH`), with its own `extensions\` | About 50 GB as a full copy (E: has 488 GB free). Could be less with NTFS hard links for `*.cat/*.dat` [unverified] | None: Steam doesn't manage either copy. Each copy must be patched by hand, and SWI has to be in both (18 GB) | Saves still follow the profile, not the folder. The copy needs its own `-personalfolderid`, or it shares the root profile's saves and `content.xml` with the playthrough | None to the extensions folder. Still one game at a time, and the runner refuses while any `X4_nonsteam` process runs (it checks by process name, so a copy with the same exe name counts) |
| **B. Separate profile, shared install**: Head Hunter, SirNukes and the patch in the shared `extensions\`, play with `-personalfolderid <new id>` | ~0 (the mods are small) | None | Separate saves, `config.xml`, `uidata.xml` and keybinds per profile. Settings need copying in (as `-PrepareProfile` does for `content.xml`/`config.xml`) | **They load in 90000201 and 90000301** unless each profile's `content.xml` gets `enabled="false"` entries for `ws_2992233767`, `ws_2042901274` and the patch. swibh's report wouldn't list them, because it reads only explicit entries (`Get-EnabledExtensions`) |
| **C. Separate profile + personal extensions**: the mods in `…\Egosoft\X4\<new id>\extensions\` | ~0 | None | As B | None, if personal extensions load only in their own profile. **Untested on 8.00 NoSteam** (§2) |
| **D. Swap folders in and out** of the shared `extensions\` before and after play | ~0 | None | Head Hunter saves depend on Head Hunter being present (`save="0"` means they don't, per SEED) | Correct only if every swap happens. A forgotten swap puts Head Hunter in the next test run unseen. The game lock (when swibh adopts it, #115) orders runs but doesn't swap anything |
| **E. Steam launch options** | n/a | n/a | n/a | Not applicable: Steam launches the 9.00 folder, not the 8.00 copy |

The runner also leaves risks of its own, whichever option is chosen:

- A killed run, or `-KeepExtension`, leaves `extensions\swibh_tests` in the game folder. While it is there, "the main menu of any profile with SWI on will start the test game" (tests/game/README.md) [read]. That includes a Head Hunter play profile on the same install (A, B, C or D).
- The runner moves `debuglog.txt` aside per profile, so play logs in another profile aren't touched [read].

## 4. What swibh's runner assumes

From `tools/run-game-tests.ps1`, the `Makefile`, `tests/game/README.md`, `test.config(.example)` and `CLAUDE.md` in `~/workspace/x4-swi-bounty-hunter` (main at `f8d00da`) [read]:

- **Settings:** params, else env vars, else `test.config`:
  - `X4_PATH`: default none. Currently the 8.00 copy.
  - `X4_EXE`: default `X4_nonsteam.exe`.
  - `X4_PROFILE_ID`: default `90000201`, must be numeric.
  - `X4_PROFILE_ROOT`: default `<MyDocuments>\Egosoft\X4`.
  - `/mnt/x/…` paths are converted to Windows paths.
- **Install:** `X4_PATH\extensions\starwarsmod_m1\content.xml` must exist. The test extension is copied into `X4_PATH\extensions\swibh_tests`, with `extension/swibh/md/*.xml` copied into its `md\`, and removed afterwards. It always uses the **game** extensions folder, never a personal one.
- **Profile:** `<X4_PROFILE_ROOT>\<id>\content.xml` must have `SW Interworlds` on and `swibh_tests` not off. `-PrepareProfile` creates the folder, copies the root profile's `content.xml` and `config.xml` into it if missing, and switches on **only** SWI and `swibh_tests`.
- **Launch:** `X4_PATH\X4_EXE -skipintro -debug all -logfile debuglog.txt -scriptlogfiles -personalfolderid <id>`, working directory `X4_PATH`.
- **Log:** `<profile>\debuglog.txt`, unless `-LogPath` is given. The previous log is moved to `debuglog.previous.txt`, and a copy goes to `tests/game/debuglog.txt` for `tools/log/game-check.ts`.
- **X4 running:** refuses if a process with the exe's base name (`X4_nonsteam`) is running. CLAUDE.md: "The game is shared: one `make game-test` or `make install` at a time." No game lock yet (#115).
- **What it tests:** the test extension `swibh_tests` (depends on SWI) autostarts the `swibh_test` gamestart via `ui/swibh_tests_autostart.lua`. Results are `[swibh-test]` lines. Log errors count only if the line mentions `swibh`.
- **Report:** "Extensions on in the test profile" lists only extensions with an explicit `enabled="true"` entry. Extensions that are on by default (RSP, Mycu today) aren't listed.

### What would need to change to drive a second setup

- **Pointing it at another install or profile:** no code change. Set `X4_PATH` and/or `X4_PROFILE_ID` (and `X4_PROFILE_ROOT`) per run through env or params. SWI must be in that install's `extensions\`.
- **Making it run Head Hunter checks** (it can't today):
  - a test extension with its own gamestart and `[...-test]` marker lines (the runner's names are hard-coded: `swibh_tests`, `[swibh-test]`, `swibh_test`, the `swibh` error filter, the T12 judgement);
  - `-PrepareProfile` (or a by-hand step) switching on `ws_2992233767`, `ws_2042901274` and the patch;
  - the swibh MD copy step skipped.

  That means either parameterising those names or a separate runner [inferred].
- **Personal extensions (option C):** the runner would still install its test extension into the game folder. It has no setting for a personal `extensions\` folder.
- **Keeping Head Hunter out of swibh's runs on a shared install (option B):** `Enable-Extensions` only ever switches entries on. Nothing switches Head Hunter off in 90000201 or 90000301. swibh #115 plans the same kind of change for `apirateslife` in the test profile.

## Sources

Local [read]:
- the 8.00 install folder, `steamapps/appmanifest_392160.acf`
- `C:\Users\ecarl\OneDrive\Documents\Egosoft\X4\` (root, 28456535, 90000201, 90000301)
- `X4.exe` strings
- unpacked 8.00 UI (`E:\x4-dev\reference\x4-8.00\base\ui`)
- Head Hunter 2.0.8 and SirNukes 1.95 zips in Downloads
- swibh: `tools/run-game-tests.ps1`, `tools/run-trials.ps1`, `Makefile`, `tests/game/README.md`, `test.config.example`, `CLAUDE.md`, `HANDOFF.md`, `mods.md`, `test-plan.md`, issue #115
- A Pirate's Life: `docs/environment.md`, `tools/README.md`

Web [doc]:
- [Egosoft wiki: Resetting game configuration](https://wiki.egosoft.com/X4%20Foundations%20Wiki/Troubleshooting/Resetting%20game%20configuration)
- [Egosoft wiki: Steam Workshop for X Rebirth and X4](https://wiki.egosoft.com/X%20Rebirth%20Wiki/Modding%20support/Steam%20Workshop%20for%20X%20Rebirth%20and%20X4/) (workshop extensions go in the game folder's `extensions`)
- Egosoft forum threads [p=4761621](https://forum.egosoft.com/viewtopic.php?p=4761621) and [p=4765800](https://forum.egosoft.com/viewtopic.php?p=4765800) (2018, user reports on `Documents\Egosoft\X4\<id>\extensions`)
