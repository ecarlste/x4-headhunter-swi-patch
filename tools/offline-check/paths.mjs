// Where the offline checker looks by default
import path from 'node:path';

export const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');

// The installed Head Hunter 2.0.8 (loose files), read at run time; HH_PATH overrides it
export const DEFAULT_HH_PATH =
    '/mnt/e/SteamLibrary/steamapps/common/X4 Foundations - 8.00/extensions/chillheadhunter';

// The patch, and the check helper: both diff Head Hunter under extensions/chillheadhunter/
export const DEFAULT_EXTENSIONS = ['patch/hh_swi_patch', 'checks/hh_swi_checks'].map((p) => path.join(REPO, p));
