#!/usr/bin/env node
// The offline check of the patch and the check helper: every XML file is well-formed, and every
// diff under extensions/chillheadhunter/ matches exactly one node in the installed Head Hunter
// (read from HH_PATH at run time, never copied into the repo).
// Run: node tools/offline-check/cli.mjs [extension folder ...]   (npm run check)
// With no folders it checks the patch and the check helper in this repo.
import fs from 'node:fs';
import path from 'node:path';
import { checkDiffs, checkWellFormed } from './check.mjs';
import { DEFAULT_EXTENSIONS, DEFAULT_HH_PATH } from './paths.mjs';

const hhPath = process.env.HH_PATH || DEFAULT_HH_PATH;
const extensions = process.argv.length > 2 ? process.argv.slice(2).map((p) => path.resolve(p)) : DEFAULT_EXTENSIONS;

let bad = 0;
for (const ext of extensions) {
    const name = path.relative(process.cwd(), ext) || ext;
    if (!fs.existsSync(ext)) {
        console.log(`${name}: not there yet, skipped`);
        continue;
    }
    for (const result of [checkWellFormed(ext), checkDiffs(ext, { chillheadhunter: hhPath })]) {
        for (const line of result.notes) console.log(`ok  ${name}: ${line}`);
        for (const line of result.bad) console.log(`BAD ${name}: ${line}`);
        bad += result.bad.length;
    }
}
console.log(`${bad} bad`);
process.exit(bad ? 1 : 0);
