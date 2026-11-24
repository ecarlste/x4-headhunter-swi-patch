// Where the offline checker looks by default
import path from 'node:path';

export const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');

// The installed Head Hunter 2.0.8 (loose files), read at run time; HH_PATH overrides it
export const DEFAULT_HH_PATH =
    '/mnt/e/SteamLibrary/steamapps/common/X4 Foundations - 8.00/extensions/chillheadhunter';

// X4 8.00's MD schema (md.xsd, common.xsd) in the unpacked vanilla game, read at run time;
// X4_XSD_PATH overrides it
export const DEFAULT_XSD_PATH = '/mnt/e/x4-dev/reference/x4-8.00/base/libraries';

// The unpacked vanilla X4 8.00 (base/ and the DLC folders), read at run time; X4_PATH overrides it
export const DEFAULT_X4_PATH = '/mnt/e/x4-dev/reference/x4-8.00';

// SWI 0.91 HF1's unpacked ext_02.cat (its libraries/), read at run time; SWI_PATH overrides it
export const DEFAULT_SWI_PATH = '/mnt/e/x4-dev/reference/mods/swi-0.91hf1/ext02';

// The X4 profiles folder (the same default as tools/play/play.sh); X4_PROFILE_ROOT overrides it.
// The play setup's profile is 90000401, and a session's log is its debuglog.txt.
export const DEFAULT_PROFILE_ROOT = '/mnt/c/Users/ecarl/OneDrive/Documents/Egosoft/X4';
export const PLAY_PROFILE_ID = '90000401';
export const playLogPath = (profileRoot = DEFAULT_PROFILE_ROOT) => path.join(profileRoot, PLAY_PROFILE_ID, 'debuglog.txt');

// The load orders a base-game diff is checked on, keyed by its path in the extension: the
// vanilla file first, then each earlier diff in turn. Head Hunter and SWI don't depend on each
// other, so either may load first (#5); the patch loads after both, and SWI after Timelines.
export function baseOrders({ x4, swi, hh }) {
    const lib = 'libraries/equipmentmods.xml';
    const vanilla = [path.join(x4, 'base', lib), path.join(x4, 'ego_dlc_timelines', lib)];
    return {
        [lib]: [
            { label: 'Head Hunter before SWI', files: [...vanilla, path.join(hh, lib), path.join(swi, lib)] },
            { label: 'SWI before Head Hunter', files: [...vanilla, path.join(swi, lib), path.join(hh, lib)] },
        ],
    };
}

// The patch, and the check helper: both diff Head Hunter under extensions/chillheadhunter/
export const DEFAULT_EXTENSIONS = ['patch/hh_swi_patch', 'checks/hh_swi_checks'].map((p) => path.join(REPO, p));

// The content ids each of this repo's extensions must require, keyed by its folder (= its id).
// The patch loads after Head Hunter and SWI (SirNukes is optional for it); the helper after the
// patch, and it needs SirNukes for its menu.
export const REQUIRES = {
    hh_swi_patch: ['ws_2992233767', 'SW Interworlds'],
    hh_swi_checks: ['hh_swi_patch', 'ws_2992233767', 'ws_2042901274'],
};
