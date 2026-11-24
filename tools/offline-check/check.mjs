// The offline checks for the patch and the check helper. Adapted from swibh's
// tools/offline-check (well-formed.ts, md-diffs.ts). Each check returns { notes, bad }: notes are
// fine, bad lines fail the check.
import fs from 'node:fs';
import path from 'node:path';
import { DOMParser } from '@xmldom/xmldom';
import { SaxesParser } from 'saxes';
import xpath from 'xpath';

// Every *.xml under dir, at any depth, sorted, as paths relative to dir with / separators
export function xmlFiles(dir) {
    const found = [];
    const walk = (rel) => {
        for (const entry of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
            if (entry.name.startsWith('.')) continue;
            const child = rel ? `${rel}/${entry.name}` : entry.name;
            if (entry.isDirectory()) walk(child);
            else if (entry.name.endsWith('.xml')) found.push(child);
        }
    };
    walk('');
    return found.sort();
}

// Why the bytes aren't well-formed XML, or null if they are. Strict UTF-8, then saxes: X4 skips a
// file it can't parse, and xmldom alone is laxer.
export function wellFormedError(bytes) {
    let text;
    try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
        return 'not valid UTF-8';
    }
    const parser = new SaxesParser({ xmlns: true });
    parser.on('error', (e) => {
        throw e;
    });
    try {
        parser.write(text).close();
    } catch (e) {
        return e.message;
    }
    return null;
}

// Check 1: every XML file in the extension at extDir is well-formed
export function checkWellFormed(extDir) {
    const files = xmlFiles(extDir);
    const bad = [];
    for (const rel of files) {
        const error = wellFormedError(fs.readFileSync(path.join(extDir, rel)));
        if (error) bad.push(`${rel}: ${error}`);
    }
    return { notes: [`${files.length} XML files read`], bad };
}

// A DOM of text, throwing on any parse error or warning
export function parseXml(text) {
    const doc = new DOMParser({
        onError: (level, message) => {
            throw new Error(`${level}: ${message}`);
        },
    }).parseFromString(text, 'text/xml');
    if (!doc.documentElement) throw new Error('no root element');
    return doc;
}

// How many nodes an XPath selects in doc, or why it can't be counted. X4 reads sel as XPath, so
// a[@x='y'][2] is the 2nd match.
export function countPath(expr, doc) {
    let selected;
    try {
        selected = xpath.select(expr, doc);
    } catch {
        return 'not a valid XPath';
    }
    return Array.isArray(selected) ? selected.length : 'not a node set';
}

// Why an op's if (a path, or not(path), as diff.xsd allows) doesn't hold on doc, or null if it
// does: a path must match exactly one node, and a not(path)'s path none, so the op runs on the
// installed version
function ifProblem(cond, doc, label) {
    const negated = /^\s*not\((.*)\)\s*$/s.exec(cond);
    const count = countPath(negated ? negated[1] : cond, doc);
    if (typeof count === 'string') return `if: ${count}`;
    if (negated) return count === 0 ? null : `if's path matches ${plural(count)} in ${label} (the op would be skipped)`;
    if (count === 0) return `if matches 0 nodes in ${label} (the op would be skipped)`;
    return count === 1 ? null : `if matches ${plural(count)} in ${label} (want exactly 1)`;
}

const elementChildren =(el) => Array.from(el.childNodes).filter((n) => n.nodeType === 1);
const plural = (n) => `${n} node${n === 1 ? '' : 's'}`;

// Check 2: every diff under <extDir>/extensions/<folder>/ patches a file that exists in that
// folder's installed copy, targets[folder], and each op's sel matches exactly one node there
// (X4 silently skips an op whose sel matches nothing). X4 patches another extension by its folder
// name, not its id. The installed files are read at run time, never copied into the repo.
export function checkDiffs(extDir, targets) {
    const notes = [];
    const bad = [];
    const docs = new Map();
    for (const rel of xmlFiles(extDir)) {
        const parts = rel.split('/');
        if (parts[0] !== 'extensions' || parts.length < 3) continue;
        const folder = parts[1];
        const targetRel = parts.slice(2).join('/');
        const label = `${folder}/${targetRel}`;
        let diff;
        try {
            diff = parseXml(fs.readFileSync(path.join(extDir, rel), 'utf8')).documentElement;
        } catch {
            continue; // the well-formed check fails it
        }
        if (!targets[folder]) {
            bad.push(`${rel}: no installed copy of ${folder} is known to the checker`);
            continue;
        }
        if (!fs.existsSync(targets[folder])) {
            bad.push(`${rel}: ${folder} isn't installed at ${targets[folder]}`);
            continue;
        }
        if (diff.tagName !== 'diff') {
            bad.push(`${rel}: the root is <${diff.tagName}>, not <diff>: a file here only patches ${label}`);
            continue;
        }
        const targetFile = path.join(targets[folder], targetRel);
        if (!fs.existsSync(targetFile)) {
            bad.push(`${rel}: no ${label} to patch`);
            continue;
        }
        if (!docs.has(targetFile)) {
            try {
                docs.set(targetFile, parseXml(fs.readFileSync(targetFile, 'utf8')));
            } catch (e) {
                docs.set(targetFile, e.message);
            }
        }
        const doc = docs.get(targetFile);
        if (typeof doc === 'string') {
            bad.push(`${rel}: ${label} doesn't parse: ${doc}`);
            continue;
        }
        for (const op of elementChildren(diff)) {
            const sel = op.getAttribute('sel') ?? '';
            const cond = op.getAttribute('if');
            const head = `${rel}: <${op.tagName} sel="${sel}"${cond === null ? '' : ` if="${cond}"`}>`;
            if (cond !== null) {
                const problem = ifProblem(cond, doc, label);
                if (problem) {
                    bad.push(`${head}: ${problem}`);
                    continue;
                }
            }
            const count = countPath(sel, doc);
            if (typeof count === 'string') bad.push(`${head}: ${count}`);
            else (count === 1 ? notes : bad).push(`${head} matches ${plural(count)} in ${label}`);
        }
    }
    return { notes, bad };
}

// Check 3: the extension's content.xml names it by its folder (id = folder, so a dependency by id
// and a path by folder can't be confused), ships off (only profile 90000401 turns it on), and
// requires each id in requires (an optional dependency doesn't fix the load order it's there for)
export function checkContent(extDir, requires) {
    const file = path.join(extDir, 'content.xml');
    if (!fs.existsSync(file)) return { notes: [], bad: ['no content.xml'] };
    let content;
    try {
        content = parseXml(fs.readFileSync(file, 'utf8')).documentElement;
    } catch {
        return { notes: [], bad: [] }; // the well-formed check fails it
    }
    const bad = [];
    const id = content.getAttribute('id');
    const folder = path.basename(extDir);
    if (id !== folder) bad.push(`content.xml: id "${id}" is not the folder's name "${folder}"`);
    const enabled = content.getAttribute('enabled');
    if (enabled !== '0' && enabled !== 'false') bad.push(`content.xml: enabled="${enabled ?? ''}": it must ship off (enabled="0")`);
    const deps = elementChildren(content).filter((el) => el.tagName === 'dependency');
    for (const want of requires) {
        const dep = deps.find((el) => el.getAttribute('id') === want);
        if (!dep) bad.push(`content.xml: no dependency on ${want}`);
        else if (['true', '1'].includes(dep.getAttribute('optional'))) bad.push(`content.xml: the dependency on ${want} is optional; it must be required`);
    }
    const notes = bad.length ? [] : [`content.xml: id ${id}, off by default, requires ${requires.join(', ')}`];
    return { notes, bad };
}

// Every element name X4's MD schema declares: md.xsd and the common.xsd it includes, in xsdDir
// (the vanilla game's libraries/, read at run time)
export function xsdElementNames(xsdDir) {
    const names = new Set();
    for (const file of ['md.xsd', 'common.xsd']) {
        const text = fs.readFileSync(path.join(xsdDir, file), 'utf8');
        for (const m of text.matchAll(/<xs:element\s+name="([^"]+)"/g)) names.add(m[1]);
    }
    return names;
}

// Check 4: the extension's own MD scripts (md/*.xml, not its diffs of other extensions). X4 wants
// an mdscript's name to match its file's name; cue names must be unique in a script (a cue
// reference picks one); and every element must be one the MD schema knows, which catches a
// misspelt action or condition that X4 would only report at load.
export function checkOwnMd(extDir, knownElements) {
    const notes = [];
    const bad = [];
    for (const rel of xmlFiles(extDir).filter((r) => r.startsWith('md/'))) {
        let root;
        try {
            root = parseXml(fs.readFileSync(path.join(extDir, rel), 'utf8')).documentElement;
        } catch {
            continue; // the well-formed check fails it
        }
        if (root.tagName !== 'mdscript') {
            bad.push(`${rel}: the root is <${root.tagName}>, not <mdscript>`);
            continue;
        }
        const before = bad.length;
        const name = root.getAttribute('name') ?? '';
        const fileName = path.basename(rel, '.xml');
        if (name.toLowerCase() !== fileName.toLowerCase()) bad.push(`${rel}: mdscript name "${name}" is not the file's name "${fileName}"`);
        const all = Array.from(root.getElementsByTagName('*'));
        const counts = new Map();
        for (const cue of all.filter((el) => el.tagName === 'cue')) {
            const n = cue.getAttribute('name');
            counts.set(n, (counts.get(n) ?? 0) + 1);
        }
        for (const [n, c] of counts) if (c > 1) bad.push(`${rel}: cue name "${n}" is used ${c} times`);
        const unknown = new Set([root, ...all].map((el) => el.tagName).filter((t) => !knownElements.has(t)));
        for (const t of unknown) bad.push(`${rel}: <${t}> is not an element in X4's md.xsd or common.xsd`);
        if (bad.length === before) notes.push(`${rel}: mdscript ${name}, ${plural(counts.size).replace('node', 'cue')}`);
    }
    return { notes, bad };
}
