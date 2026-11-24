// Where the offline checker looks by default
import path from 'node:path';

export const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');

// The installed Head Hunter 2.0.8 (loose files), read at run time; HH_PATH overrides it
export const DEFAULT_HH_PATH =
    '/mnt/e/SteamLibrary/steamapps/common/X4 Foundations - 8.00/extensions/chillheadhunter';

// X4 8.00's MD schema (md.xsd, common.xsd) in the unpacked vanilla game, read at run time;
// X4_XSD_PATH overrides it
export const DEFAULT_XSD_PATH = '/mnt/e/x4-dev/reference/x4-8.00/base/libraries';

// The patch, and the check helper: both diff Head Hunter under extensions/chillheadhunter/
export const DEFAULT_EXTENSIONS = ['patch/hh_swi_patch', 'checks/hh_swi_checks'].map((p) => path.join(REPO, p));

// The content ids each of this repo's extensions must require, keyed by its folder (= its id).
// The patch loads after Head Hunter and SWI (SirNukes is optional for it); the helper after the
// patch, and it needs SirNukes for its menu.
export const REQUIRES = {
    hh_swi_patch: ['ws_2992233767', 'SW Interworlds'],
    hh_swi_checks: ['hh_swi_patch', 'ws_2992233767', 'ws_2042901274'],
};
