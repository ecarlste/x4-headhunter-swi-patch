#!/usr/bin/env bash
# Starts the Head Hunter play setup: profile 90000401 on the shared X4 8.00 install.
# How and why: docs/play-setup.md.
set -euo pipefail

X4_PATH=${X4_PATH:-'/mnt/e/SteamLibrary/steamapps/common/X4 Foundations - 8.00'}
X4_PROFILE_ROOT=${X4_PROFILE_ROOT:-'/mnt/c/Users/ecarl/OneDrive/Documents/Egosoft/X4'}
PROFILE_ID=90000401
PROFILE="$X4_PROFILE_ROOT/$PROFILE_ID"

# Extension ids (content.xml keys on ids, not folder names). The patch and hh_swi_checks are
# added here by the tickets that create them.
ON=('SW Interworlds' 'ws_2992233767' 'ws_2042901274')
OFF=('apirateslife' "Reaper's Ship Pack (SWI)" 'EquipmentTooltips')

die() { echo "play: $*" >&2; exit 1; }

[ ! -e "$X4_PATH/extensions/swibh_tests" ] \
    || die "$X4_PATH/extensions/swibh_tests is left over from a killed swibh run; it hijacks the main menu. Remove it (or finish the swibh run) first"

[ -d "$PROFILE" ] || die "$PROFILE not found"
# Profile extensions don't load Head Hunter's Lua or loose text, and with the mods in the shared
# extensions folder they would load twice
[ -z "$(ls -A "$PROFILE/extensions" 2>/dev/null)" ] \
    || die "$PROFILE/extensions isn't empty: the play mods live in the install's shared extensions folder only. Empty it first"
[ -f "$PROFILE/config.xml" ] \
    || die "$PROFILE/config.xml not found: start the game once with -personalfolderid $PROFILE_ID and quit, then run this again"

# One attribute of an installed extension's <content> element (it may span lines)
content_attr() {
    tr '\n\r\t' '   ' < "$1/content.xml" | grep -o '<content[[:space:]][^>]*' | head -n 1 \
        | grep -o "[[:space:]]$2=\"[^\"]*\"" | head -n 1 | sed 's/^[^"]*"//; s/"$//'
}

# Head Hunter and SirNukes must be off by default in the install, or they load in every profile
# with no entry for them (swibh's, A Pirate's Life's)
for folder in chillheadhunter sn_mod_support_apis; do
    dir="$X4_PATH/extensions/$folder"
    [ -f "$dir/content.xml" ] || die "$dir/content.xml not found: install it in the shared extensions folder"
    case $(content_attr "$dir" enabled) in
        0|false) ;;
        *) die "$dir/content.xml is on by default (a reinstall or update resets it): set enabled=\"0\" on its <content> element (docs/play-setup.md)" ;;
    esac
done

# Every installed extension other than Egosoft's DLCs must be listed, so none loads by its default
for dir in "$X4_PATH"/extensions/*/; do
    dir=${dir%/}
    [ -f "$dir/content.xml" ] || continue
    case ${dir##*/} in ego_dlc_*) continue ;; esac
    id=$(content_attr "$dir" id)
    listed=''
    for known in "${ON[@]}" "${OFF[@]}"; do [ "$known" = "$id" ] && listed=1; done
    [ -n "$listed" ] || die "extensions/${dir##*/} (id \"$id\") is in neither the on nor the off list in $0: add it to one"
done

write_content_xml() {
    local id
    {
        echo '<?xml version="1.0" encoding="utf-8"?>'
        echo '<content>'
        for id in "${ON[@]}"; do echo "  <extension id=\"$id\" enabled=\"true\" />"; done
        for id in "${OFF[@]}"; do echo "  <extension id=\"$id\" enabled=\"false\" />"; done
        echo '</content>'
    } > "$PROFILE/content.xml"
}

# Protected UI Mode blocks Head Hunter's Lua; it must be off before launch (switching it in a
# running game hung the UI)
write_uisafemode_off() {
    local config="$PROFILE/config.xml"
    if grep -q '<uisafemode>' "$config"; then
        sed -i 's|<uisafemode>[^<]*</uisafemode>|<uisafemode>false</uisafemode>|' "$config"
    else
        sed -i 's|^\([[:space:]]*\)</root>|  <uisafemode>false</uisafemode>\n\1</root>|' "$config"
    fi
    grep -q '<uisafemode>false</uisafemode>' "$config" || die "couldn't set <uisafemode>false</uisafemode> in $config"
}

# The shared game lock (<X4_PATH>/game.lock, game.queue/): A Pirate's Life's implementation, which
# swibh adopts too; its rules are in that repo's tools/README.md ("The game lock")
GAME_LOCK_SH=${GAME_LOCK_SH:-"$HOME/workspace/x4-pirates-life-mod/tools/game-lock.sh"}
[ -f "$GAME_LOCK_SH" ] || die "the game lock script $GAME_LOCK_SH not found: set GAME_LOCK_SH to A Pirate's Life's tools/game-lock.sh"
# shellcheck source=/dev/null
. "$GAME_LOCK_SH"
trap game_lock_release EXIT
game_lock_acquire "$X4_PATH/game.lock" "play $PROFILE_ID" || exit 1

write_content_xml
write_uisafemode_off

ARGS=(-skipintro -debug all -logfile debuglog.txt -scriptlogfiles -personalfolderid "$PROFILE_ID")
cd "$X4_PATH"
echo "play: starting X4 in profile $PROFILE_ID; the game lock is held until it exits" >&2
status=0
if [ -n "${X4_LAUNCH:-}" ]; then
    "$X4_LAUNCH" "${ARGS[@]}" || status=$?
else
    "./${X4_EXE:-X4_nonsteam.exe}" "${ARGS[@]}" || status=$?
fi
exit "$status"
