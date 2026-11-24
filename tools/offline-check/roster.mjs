// The hunter roster is written twice: in the patch (its replace of Head Hunter's $HunterFactions,
// in extensions/chillheadhunter/md/headhunterhunted.xml) and in the check helper (its Roster
// cue's $factions, in md/hh_swi_checks.xml). checkRoster reports where the two differ.
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

// { notes, bad }: bad lists each faction only one of the two rosters names
export function checkRoster(patchDir, helperDir) {
    const bad = [];
    const patchText = textAt(path.join(patchDir, PATCH_FILE), `/diff/replace[contains(@sel, "@name='$HunterFactions']/@exact")]`);
    const helperText = textAt(path.join(helperDir, HELPER_FILE), `//cue[@name='Roster']/actions/set_value[@name='$factions']/@exact`);
    if (patchText === null) bad.push(`no $HunterFactions replace in the patch's ${PATCH_FILE}`);
    if (helperText === null) bad.push(`no Roster cue $factions in the helper's ${HELPER_FILE}`);
    if (bad.length) return { notes: [], bad };
    const patch = listItems(patchText);
    const helper = listItems(helperText);
    for (const f of patch) if (!helper.includes(f)) bad.push(`${f} is in the patch roster but not the helper roster`);
    for (const f of helper) if (!patch.includes(f)) bad.push(`${f} is in the helper roster but not the patch roster`);
    return bad.length ? { notes: [], bad } : { notes: [`the patch and the helper both list the same ${patch.length} hunter factions`], bad };
}
