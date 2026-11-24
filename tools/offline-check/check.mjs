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
// ifProblem is strict (a path must match exactly one node), as the sel check against one fixed
// target file is; ifHolds reads if as X4 does when applying, to simulate load orders.
function ifProblem(cond, doc, label) {
    const negated = notPath(cond);
    const count = countPath(negated ?? cond, doc);
    if (typeof count === 'string') return `if: ${count}`;
    if (negated) return count === 0 ? null : `if's path matches ${plural(count)} in ${label} (the op would be skipped)`;
    if (count === 0) return `if matches 0 nodes in ${label} (the op would be skipped)`;
    return count === 1 ? null : `if matches ${plural(count)} in ${label} (want exactly 1)`;
}

const elementChildren = (el) => Array.from(el.childNodes).filter((n) => n.nodeType === 1);
const plural = (n) => `${n} node${n === 1 ? '' : 's'}`;

// The path inside an if of the form not(path), or null for any other if
const notPath = (cond) => /^\s*not\((.*)\)\s*$/s.exec(cond)?.[1] ?? null;

// How a report line names a diff op: its file, tag, sel and (if any) if
function opLabel(rel, op) {
    const cond = op.getAttribute('if');
    return `${rel}: <${op.tagName} sel="${op.getAttribute('sel') ?? ''}"${cond === null ? '' : ` if="${cond}"`}>`;
}

// Check 2: every diff under <extDir>/extensions/<folder>/ patches a file that exists in that
// folder's installed copy, targets[folder], and each op's sel matches exactly one node there
// (X4 silently skips an op whose sel matches nothing). X4 patches another extension by its folder
// name, not its id. The installed files are read at run time, never copied into the repo.
// earlier lists the extensions that load before this one and diff the same folder (the check
// helper loads after the patch): their diffs of each file are applied first, in order, and this
// extension's sels are counted on the result, as the game loads them.
export function checkDiffs(extDir, targets, earlier = []) {
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
                docs.set(targetFile, patchedDoc(targetFile, earlier.map((e) => path.join(e, rel))));
            } catch (e) {
                docs.set(targetFile, e.message);
            }
        }
        const doc = docs.get(targetFile);
        if (typeof doc === 'string') {
            bad.push(`${rel}: ${label} doesn't parse: ${doc}`);
            continue;
        }
        const by = earlier.filter((e) => fs.existsSync(path.join(e, rel))).map((e) => path.basename(e));
        const where = by.length ? `${label} patched by ${by.join(', ')}` : label;
        for (const op of elementChildren(diff)) {
            const sel = op.getAttribute('sel') ?? '';
            const cond = op.getAttribute('if');
            const head = opLabel(rel, op);
            if (cond !== null) {
                const problem = ifProblem(cond, doc, where);
                if (problem) {
                    bad.push(`${head}: ${problem}`);
                    continue;
                }
            }
            const count = countPath(sel, doc);
            if (typeof count === 'string') bad.push(`${head}: ${count}`);
            else (count === 1 ? notes : bad).push(`${head} matches ${plural(count)} in ${where}`);
        }
    }
    return { notes, bad };
}

// The installed file at targetFile with each diff in diffFiles applied in turn (a missing one,
// or one that doesn't parse, is passed over: its own extension's check reports it)
function patchedDoc(targetFile, diffFiles) {
    const doc = parseXml(fs.readFileSync(targetFile, 'utf8'));
    for (const f of diffFiles) {
        if (!fs.existsSync(f)) continue;
        let diff;
        try {
            diff = parseXml(fs.readFileSync(f, 'utf8')).documentElement;
        } catch {
            continue;
        }
        if (diff.tagName === 'diff') applyDiff(doc, diff);
    }
    return doc;
}

// Whether an op's if holds on doc, as X4 reads it: an XPath that is true, or selects something
function ifHolds(cond, doc) {
    const r = xpath.select(cond, doc);
    return Array.isArray(r) ? r.length > 0 : Boolean(r);
}

// Applies one diff op to the one node its sel matched
function applyOp(op, target, doc) {
    const content = elementChildren(op).map((el) => doc.importNode(el, true));
    if (op.tagName === 'add') {
        const type = op.getAttribute('type');
        if (type?.startsWith('@')) return target.setAttribute(type.slice(1), op.textContent);
        const pos = op.getAttribute('pos') ?? 'append';
        // a fixed reference node keeps the added nodes in their order
        const ref = pos === 'after' ? target.nextSibling : pos === 'prepend' ? target.firstChild : null;
        for (const node of content) {
            if (pos === 'before') target.parentNode.insertBefore(node, target);
            else if (pos === 'after') target.parentNode.insertBefore(node, ref);
            else if (pos === 'prepend') target.insertBefore(node, ref);
            else target.appendChild(node);
        }
    } else if (op.tagName === 'replace') {
        if (target.nodeType === 2) target.value = op.textContent;
        else if (content.length) target.parentNode.replaceChild(content[0], target);
        else target.textContent = op.textContent;
    } else if (op.tagName === 'remove') {
        if (target.nodeType === 2) target.ownerElement.removeAttribute(target.name);
        else target.parentNode.removeChild(target);
    }
}

// Applies a <diff>'s ops to doc in order, as X4 does: an op whose if fails is skipped, and one
// whose sel doesn't match exactly one node does nothing. Returns, per op, { op, ran, count }
// (count: how many nodes its sel matched, or why it couldn't be counted).
export function applyDiff(doc, diff) {
    return elementChildren(diff).map((op) => ({ op, ...applyOne(doc, op) }));
}

function applyOne(doc, op) {
    const cond = op.getAttribute('if');
    if (cond !== null && !ifHolds(cond, doc)) return { ran: false, count: null };
    const sel = op.getAttribute('sel') ?? '';
    const count = countPath(sel, doc);
    if (count === 1) applyOp(op, xpath.select(sel, doc)[0], doc);
    return { ran: true, count };
}

// Check 2b: the extension's diffs of base-game libraries (libraries/*.xml at its root). Such a
// file is patched by the game and by every mod before this extension, in an order that isn't
// always fixed, so orders[rel] lists each load order to check: { label, files } with the base
// game's file first, then each earlier diff in turn (all read at run time, never copied into the
// repo). In each order every op that runs must match exactly one node, and a guarded add
// (if="not(path)") must leave its path matching exactly one node, run or skipped: the entry
// exists exactly once whatever the order. An op skipped in every order never runs.
export function checkBaseDiffs(extDir, orders) {
    const notes = [];
    const bad = [];
    for (const rel of xmlFiles(extDir).filter((r) => r.startsWith('libraries/'))) {
        let diff;
        try {
            diff = parseXml(fs.readFileSync(path.join(extDir, rel), 'utf8')).documentElement;
        } catch {
            continue; // the well-formed check fails it
        }
        const scenarios = orders[rel];
        if (!scenarios) {
            bad.push(`${rel}: no base-game file and load orders are known to the checker`);
            continue;
        }
        const ops = elementChildren(diff);
        const ranSomewhere = ops.map(() => false);
        let checked = 0;
        for (const { label, files } of scenarios) {
            const gone = files.find((f) => !fs.existsSync(f));
            if (gone) {
                bad.push(`${rel}: ${label}: ${gone} isn't there`);
                continue;
            }
            const doc = parseXml(fs.readFileSync(files[0], 'utf8'));
            for (const f of files.slice(1)) applyDiff(doc, parseXml(fs.readFileSync(f, 'utf8')).documentElement);
            checked++;
            for (const [i, op] of ops.entries()) {
                const cond = op.getAttribute('if');
                const head = opLabel(rel, op);
                const guard = cond === null ? null : notPath(cond);
                const { ran, count } = applyOne(doc, op);
                const after = guard ? countPath(guard, doc) : null;
                if (!ran) {
                    if (guard && after !== 1) bad.push(`${head}: skipped in ${label}, but ${guard} matches ${plural(after)} (want exactly 1)`);
                    else notes.push(`${head}: skipped in ${label} (its if is false)${guard ? `; ${guard} matches ${plural(after)}` : ''}`);
                    continue;
                }
                ranSomewhere[i] = true;
                if (typeof count === 'string') bad.push(`${head}: ${count}`);
                else if (count !== 1) bad.push(`${head} matches ${plural(count)} in ${label}`);
                else if (guard && after !== 1) bad.push(`${head}: after it, ${guard} matches ${plural(after)} in ${label} (want exactly 1)`);
                else notes.push(`${head} matches 1 node in ${label}${guard ? `; after it, ${guard} matches 1 node` : ''}`);
            }
        }
        if (checked) for (const [i, op] of ops.entries()) {
            if (ranSomewhere[i]) continue;
            bad.push(`${opLabel(rel, op)}: its if is false in every load order, so it never runs`);
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

// Whether a node is text or CDATA that isn't blank: a value, not layout
const isValueText = (n) => (n.nodeType === 3 || n.nodeType === 4) && n.data.trim() !== '';

// An element as a comparable string: its tag, its attributes (in name order) and its children,
// elements and non-blank text in order; comments, layout, spacing next to punctuation inside a
// value ([2013, 2111] is [2013,2111]) and doubled spaces don't count, but a space between two
// words does ("a b" is not "ab")
const unspaced = (s) => s.trim().replace(/\s*([^\w\s])\s*/g, '$1').replace(/\s+/g, ' ');
function subtreeKey(el) {
    const attrs = Array.from(el.attributes).map((a) => `${a.name}=${JSON.stringify(unspaced(a.value))}`).sort();
    const children = Array.from(el.childNodes).flatMap((n) => {
        if (n.nodeType === 1) return [subtreeKey(n)];
        if (isValueText(n)) return [JSON.stringify(unspaced(n.data))];
        return [];
    });
    return `<${el.tagName} ${attrs.join(' ')}>${children.join('')}</>`;
}

// Whether an element or anything in it holds a value (an attribute or text): one that holds none,
// like <conditions><event_cue_signalled/></conditions>, is bare structure, not Head Hunter's code
const holdsValue = (el) => el.attributes.length > 0 || Array.from(el.childNodes).some((n) => (n.nodeType === 1 ? holdsValue(n) : isValueText(n)));

// The reason in an <!-- hh-copy: reason --> comment directly above op, or null if there's none
function copyMarker(op) {
    let prev = op.previousSibling;
    while (prev && prev.nodeType === 3 && !prev.data.trim()) prev = prev.previousSibling;
    if (prev?.nodeType !== 8) return null;
    return /^\s*hh-copy:\s*(\S.*?)\s*$/s.exec(prev.data)?.[1] ?? null;
}

// Check 5: the standing rule, no Head Hunter code in the repo. An element an add or replace op
// writes (or any element inside one that has element children of its own: a copied one-line
// param inside new code is fine, a copied block isn't) and holds a value must not equal, whole
// subtree, an element
// anywhere in the installed Head Hunter at hhDir (read at run time, never copied into the repo).
// An intentional copy needs an <!-- hh-copy: reason --> comment directly above its op.
export function checkCopies(extDir, hhDir) {
    const notes = [];
    const bad = [];
    const known = new Set();
    if (!fs.existsSync(hhDir)) return { notes, bad }; // checkDiffs reports the missing install
    for (const rel of xmlFiles(hhDir)) {
        let root;
        try {
            root = parseXml(fs.readFileSync(path.join(hhDir, rel), 'utf8')).documentElement;
        } catch {
            continue;
        }
        for (const el of [root, ...Array.from(root.getElementsByTagName('*'))]) known.add(subtreeKey(el));
    }
    for (const rel of xmlFiles(extDir)) {
        let diff;
        try {
            diff = parseXml(fs.readFileSync(path.join(extDir, rel), 'utf8')).documentElement;
        } catch {
            continue; // the well-formed check fails it
        }
        if (diff.tagName !== 'diff') continue;
        for (const op of elementChildren(diff).filter((el) => ['add', 'replace'].includes(el.tagName))) {
            const copies = [];
            const visit = (el, top) => {
                if ((top || elementChildren(el).length) && holdsValue(el) && known.has(subtreeKey(el))) copies.push(el);
                else elementChildren(el).forEach((child) => visit(child, false));
            };
            elementChildren(op).forEach((el) => visit(el, true));
            if (!copies.length) continue;
            const reason = copyMarker(op);
            const head = opLabel(rel, op);
            for (const el of copies) {
                if (reason) notes.push(`${head}: copies <${el.tagName}> from Head Hunter (hh-copy: ${reason})`);
                else bad.push(`${head}: <${el.tagName}> is a copy of one in Head Hunter: write it here, or give the reason in an <!-- hh-copy: reason --> comment directly above the op`);
            }
        }
    }
    return { notes, bad };
}
