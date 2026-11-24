// The hunter roster is written twice: in the patch (its replace of Head Hunter's $HunterFactions,
// in extensions/chillheadhunter/md/headhunterhunted.xml) and in the check helper (its Roster
// cue's $factions, in md/hh_swi_checks.xml). compareRosters says where the two differ.
import fs from 'node:fs';
import path from 'node:path';
import xpath from 'xpath';
import { xmlRoot } from './check.mjs';

const PATCH_FILE = 'extensions/chillheadhunter/md/headhunterhunted.xml';
const HELPER_FILE = 'md/hh_swi_checks.xml';

// The factions an MD list literal names, e.g. "[faction.a, faction.b]" -> ['faction.a', 'faction.b']
const listItems = (text) => text.trim().replace(/^\[|\]$/g, '').split(',').map((s) => s.trim()).filter(Boolean);

// The text at expr in file, or null if the file or the node isn't there
function textAt(file, expr) {
    const root = fs.existsSync(file) ? xmlRoot(file) : null;
    if (!root) return null; // the well-formed check fails a file that doesn't parse
    const [node] = xpath.select(expr, root);
    return node ? (node.nodeType === 2 ? node.value : node.textContent) : null;
}

// { shared, patchOnly, helperOnly }: the factions both rosters name, and those only one names
// (each in its roster's order). Throws if either roster can't be found.
export function compareRosters(patchDir, helperDir) {
    const patchText = textAt(path.join(patchDir, PATCH_FILE), `/diff/replace[contains(@sel, "@name='$HunterFactions']/@exact")]`);
    if (patchText === null) throw new Error(`no $HunterFactions replace in the patch's ${PATCH_FILE}`);
    const helperText = textAt(path.join(helperDir, HELPER_FILE), `//cue[@name='Roster']/actions/set_value[@name='$factions']/@exact`);
    if (helperText === null) throw new Error(`no Roster cue $factions in the helper's ${HELPER_FILE}`);
    const patch = listItems(patchText);
    const helper = listItems(helperText);
    return {
        shared: patch.filter((f) => helper.includes(f)),
        patchOnly: patch.filter((f) => !helper.includes(f)),
        helperOnly: helper.filter((f) => !patch.includes(f)),
    };
}
