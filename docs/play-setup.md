# Play setup

The **play setup** is profile `90000401` on the shared X4 8.00 install (`E:\SteamLibrary\steamapps\common\X4 Foundations - 8.00`). Head Hunter, SirNukes and the patch live once in the install's shared `extensions\` folder with their default set to off, and `90000401` turns them on. Every other profile leaves them off, so Head Hunter never leaks into `swibh`'s test profile (`90000201`), A Pirate's Life's (`90000301`) or the root profile. The decisions behind this are in #12 and #14.

## Once, and again after every reinstall or update of Head Hunter or SirNukes

Set each mod's default to off in its **installed** `content.xml`. These are local edits to the install. Never commit them: the repo holds no Head Hunter files.

- `extensions\chillheadhunter\content.xml`: on the `<content …>` element, change `enabled="1"` to `enabled="0"`.
- `extensions\sn_mod_support_apis\content.xml`: on the `<content …>` element, add `enabled="0"` (it ships with none, which means on).

A reinstall or update puts the shipped `content.xml` back. `tools/play/play.sh` refuses to launch until you redo the edit.

The profile must exist and have a `config.xml`: start the game once with `-personalfolderid 90000401` and quit.

## Starting a play session

From WSL, in this repo:

```
tools/play/play.sh
```

It does the following, in order, and stops with a message at the first problem:

1. **Refuses while `extensions\swibh_tests` exists in the install.** A killed `swibh` run leaves it behind, and it hijacks the main menu.
2. **Refuses while `…\Egosoft\X4\90000401\extensions\` isn't empty.** Profile extensions don't load Head Hunter's Lua or its loose text. With the mods also in the shared folder, they would load twice.
3. **Refuses while Head Hunter or SirNukes is on by default** in the install (see above).
4. **Refuses while an installed extension is missing from its on and off lists** (Egosoft's `ego_dlc_*` excepted). So a newly installed mod can't load in play just because its default is on. Add it to `ON` or `OFF` at the top of the script.
5. **Takes the shared game lock** (`<X4_PATH>\game.lock` and the line in `game.queue\`), waiting its turn behind any `swibh` or A Pirate's Life deploy or game run. It uses A Pirate's Life's `tools/game-lock.sh`, the implementation both repos share. Its rules are in that repo's `tools/README.md`, under "The game lock".
6. **Writes the profile's `content.xml`.** Extensions are keyed by id, not by folder name:
   - on: `SW Interworlds`, `ws_2992233767` (Head Hunter), `ws_2042901274` (SirNukes)
   - off: `apirateslife`, `Reaper's Ship Pack (SWI)` (RSP), `EquipmentTooltips` (Mycu)

   The patch and `hh_swi_checks` get added to these lists by the tickets that create them. The script owns this file, so switches you make in the in-game Extensions menu are overwritten at the next launch.
7. **Sets `<uisafemode>false</uisafemode>`** in the profile's `config.xml`, keeping every other setting. Protected UI Mode blocks Head Hunter's Lua. Don't switch it in a running game: that hung the UI.
8. **Starts `X4_nonsteam.exe`** from the install folder with `-skipintro -debug all -logfile debuglog.txt -scriptlogfiles -personalfolderid 90000401` and waits for it to exit. Then it releases the lock, whatever the game's exit code. If the script itself is killed, its lock stops getting heartbeats, and the next in line takes it over after 60 s. The log is `…\Egosoft\X4\90000401\debuglog.txt`.

It edits only `90000401`'s `content.xml` and `config.xml`, and the lock files. It never touches the install's extensions, `90000201`, `90000301` or the root profile.

### Settings (environment)

| Variable | Default |
|---|---|
| `X4_PATH` | `/mnt/e/SteamLibrary/steamapps/common/X4 Foundations - 8.00` |
| `X4_PROFILE_ROOT` | `/mnt/c/Users/ecarl/OneDrive/Documents/Egosoft/X4` |
| `X4_EXE` | `X4_nonsteam.exe` |
| `GAME_LOCK_SH` | `~/workspace/x4-pirates-life-mod/tools/game-lock.sh` |
| `X4_GAME_LOCK_WAIT` | unset: wait in line with no limit. `0` refuses at once if the lock is held |

`X4_LAUNCH` runs a different command in place of the game. The tests use it.

### By hand, if the script can't be used

Do the same steps yourself: check steps 1–4, then hold the lock for the whole session with `~/workspace/x4-pirates-life-mod/tools/game-lock.sh --what "play 90000401" -- <start the game and wait for it>`. Write `content.xml` and `uisafemode` as above before you start the game.

## Tests

```
node --test tools/play/
```

They run the script against temp folders: a fake install, a fake profile root and a stub in place of the game. They use the real `game-lock.sh` from A Pirate's Life's checkout. Never point the tests at the real install or profiles.

## Checks to run in game (not run yet)

These need a real launch by the user:

- `tools/play/play.sh` starts X4 in `90000401`. While the game runs, `game.lock` in the install names `what=play 90000401`. After you quit, it's gone. If the lock is released while the game is still running, `X4_nonsteam.exe` didn't block from WSL, and the script needs another way to wait.
- In a new SWI game in `90000401`: Head Hunter's "Head Hunter Mod Installed" message appears, and so does its tab on the map (the Headhunter Wanted Board).
- A launch of `90000201` shows no sign of Head Hunter: no message, no map tab, and no `chillheadhunter` or page `8008574` in its `debuglog.txt`.
