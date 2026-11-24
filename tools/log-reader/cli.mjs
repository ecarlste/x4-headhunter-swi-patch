#!/usr/bin/env node
// The log reader: applies the checklist's failure rule (docs/verification.md, "Failure rule") to
// a play or check session's debuglog.txt. It prints the [hh-swi-check] lines in order, and every
// MD cue or patch error naming Head Hunter, the patch or the helper: known-harmless ones (see
// known-harmless.json) with their note, the rest as FAIL. Exits 1 when any FAIL remains, 2 when
// the log can't be read. Read-only: it never writes to the profile folder.
// Run: node tools/log-reader/cli.mjs [debuglog.txt]   (npm run log)
// With no path it reads profile 90000401's log under X4_PROFILE_ROOT (see paths.mjs).
import fs from 'node:fs';
import { DEFAULT_PROFILE_ROOT, playLogPath } from '../offline-check/paths.mjs';

// X4 writes MD cue errors and patch errors (parse errors, "No matching node for path ... in
// patch file ...") as [=ERROR=] lines; an MD error's "* Expression: ..." lines follow it. The
// "Failed to verify the file signature ... (error: 14)" lines are FileIO notes every loose-file
// extension gets, not errors.
const isError = (line) => line.startsWith('[=ERROR=]') || line.includes('Error in MD cue');
// Head Hunter (its HeadHunter* scripts, its chillheadhunter folder), the patch and the helper
// (hh_swi_checks, its script HH_SWI_Checks)
const ours = /headhunter|hh_swi_patch|hh_swi_checks/i;

// The known-harmless list: its one copy, each entry with its note. match is a regular expression
// tested against the error line.
const harmless = JSON.parse(fs.readFileSync(new URL('./known-harmless.json', import.meta.url), 'utf8'))
    .map((entry) => ({ ...entry, re: new RegExp(entry.match) }));

const log = process.argv[2] || playLogPath(process.env.X4_PROFILE_ROOT || DEFAULT_PROFILE_ROOT);
let text;
try {
    text = fs.readFileSync(log, 'utf8');
} catch (e) {
    console.error(`log-reader: ${log} ${e.code === 'ENOENT' ? 'not found' : `can't be read (${e.code})`}`);
    process.exit(2);
}
const lines = text.split(/\r?\n/);
console.log(`reading ${log}`);

let failing = 0;
const noted = new Set();
lines.forEach((line, i) => {
    const at = i + 1;
    if (line.includes('[hh-swi-check]')) {
        console.log(`${at}: ${line}`);
        return;
    }
    if (!isError(line) || !ours.test(line)) return;
    const entry = harmless.find((h) => h.re.test(line));
    if (entry) {
        console.log(`harmless ${at}: ${line}`);
        if (!noted.has(entry)) console.log(`     (known harmless: ${entry.why})`);
        noted.add(entry);
        return;
    }
    failing++;
    console.log(`FAIL ${at}: ${line}`);
    for (let j = i + 1; j < lines.length && lines[j].startsWith('* '); j++) console.log(`     ${lines[j]}`);
});
console.log(`${failing} failing`);
process.exit(failing ? 1 : 0);
