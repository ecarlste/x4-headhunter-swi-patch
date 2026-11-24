#!/usr/bin/env node
// The offline check of the patch and the check helper: every XML file is well-formed, every diff
// under extensions/chillheadhunter/ matches exactly one node in the installed Head Hunter (read
// from HH_PATH at run time, never copied into the repo; for the check helper, patched by the
// patch first, see loadsBefore), every base-game diff (libraries/) holds
// on vanilla (X4_PATH) patched by Head Hunter and SWI (SWI_PATH) in either order (see
// baseOrders), the extension's own MD scripts use only
// elements X4's schema knows (X4_XSD_PATH), and this repo's extensions' content.xml (by folder
// name, see REQUIRES) ship off and require what they load after.
// Run: node tools/offline-check/cli.mjs [extension folder ...]   (npm run check)
// With no folders it checks the patch and the check helper in this repo.
import fs from 'node:fs';
import path from 'node:path';
import { checkBaseDiffs, checkContent, checkDiffs, checkOwnMd, checkWellFormed, xsdElementNames } from './check.mjs';
import { baseOrders, DEFAULT_EXTENSIONS, DEFAULT_HH_PATH, DEFAULT_SWI_PATH, DEFAULT_X4_PATH, DEFAULT_XSD_PATH, REQUIRES } from './paths.mjs';

const hhPath = process.env.HH_PATH || DEFAULT_HH_PATH;
const xsdPath = process.env.X4_XSD_PATH || DEFAULT_XSD_PATH;
const orders = baseOrders({ x4: process.env.X4_PATH || DEFAULT_X4_PATH, swi: process.env.SWI_PATH || DEFAULT_SWI_PATH, hh: hhPath });
const extensions = process.argv.length > 2 ? process.argv.slice(2).map((p) => path.resolve(p)) : DEFAULT_EXTENSIONS;

let known;
function ownMd(ext) {
    if (!fs.existsSync(path.join(ext, 'md'))) return { notes: [], bad: [] };
    if (known === undefined) {
        try {
            known = xsdElementNames(xsdPath);
        } catch {
            known = null;
        }
    }
    if (!known) return { notes: [], bad: [`X4's md.xsd isn't at ${xsdPath}: set X4_XSD_PATH to the vanilla game's libraries/`] };
    return checkOwnMd(ext, known);
}

// The extensions that load before ext and diff Head Hunter too: those of this repo's it requires
// (by folder, see REQUIRES), taken from the folders given or else the repo's own. The check
// helper's sels are counted on Head Hunter with the patch applied, as the game loads them.
function loadsBefore(ext) {
    const requires = REQUIRES[path.basename(ext)] ?? [];
    return requires.flatMap((id) => {
        const found = [...extensions, ...DEFAULT_EXTENSIONS].find((e) => path.basename(e) === id);
        return found ? [found] : [];
    });
}

let bad = 0;
for (const ext of extensions) {
    const name = path.relative(process.cwd(), ext) || ext;
    if (!fs.existsSync(ext)) {
        console.log(`${name}: not there yet, skipped`);
        continue;
    }
    const requires = REQUIRES[path.basename(ext)];
    const results = [checkWellFormed(ext), checkDiffs(ext, { chillheadhunter: hhPath }, loadsBefore(ext)), checkBaseDiffs(ext, orders), ownMd(ext)];
    if (requires) results.push(checkContent(ext, requires));
    for (const result of results) {
        for (const line of result.notes) console.log(`ok  ${name}: ${line}`);
        for (const line of result.bad) console.log(`BAD ${name}: ${line}`);
        bad += result.bad.length;
    }
}
console.log(`${bad} bad`);
process.exit(bad ? 1 : 0);
