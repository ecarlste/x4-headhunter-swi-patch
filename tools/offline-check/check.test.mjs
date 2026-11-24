// Tests for the offline checker, on hand-written fixtures in temp dirs (never Head Hunter's files).
// Run: node --test tools/offline-check/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checkContent, checkDiffs, checkOwnMd, checkWellFormed, xsdElementNames } from './check.mjs';

// A temp folder with the given files (relative path -> text)
function tree(files) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hh-offline-'));
    for (const [rel, text] of Object.entries(files)) {
        fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
        fs.writeFileSync(path.join(root, rel), text);
    }
    return root;
}

test('every XML file in an extension must be well-formed', () => {
    const ext = tree({
        'content.xml': '<content id="x"/>',
        'extensions/target/md/good.xml': '<diff><add sel="/a"/></diff>',
        'extensions/target/md/broken.xml': '<diff><add sel="/a"></diff>',
        'libraries/latin1.xml': Buffer.from([0x3c, 0x61, 0x3e, 0xe9, 0x3c, 0x2f, 0x61, 0x3e]),
        'readme.txt': '<not xml',
    });
    const { notes, bad } = checkWellFormed(ext);
    assert.deepEqual(notes, ['4 XML files read']);
    assert.equal(bad.length, 2);
    assert.match(bad[0], /^extensions\/target\/md\/broken\.xml: /);
    assert.equal(bad[1], 'libraries/latin1.xml: not valid UTF-8');
});

// A stand-in for an installed target extension: hand-written, shaped like an MD script
const targetScript = `<?xml version="1.0" encoding="utf-8"?>
<mdscript name="Fake" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <cues>
    <cue name="Init">
      <actions>
        <set_value name="$a" exact="1"/>
      </actions>
    </cue>
    <cue name="Other">
      <actions>
        <set_value name="$a" exact="2"/>
        <do_if value="event.param.typename == 'Drone'"/>
      </actions>
    </cue>
  </cues>
</mdscript>
`;

test("each diff sel under extensions/<folder>/ must match exactly one node in that folder's installed file", () => {
    const target = tree({ 'md/fake.xml': targetScript });
    const ext = tree({
        'extensions/target/md/fake.xml': `<diff>
  <add sel="//cue[@name='Init']/actions"><debug_text text="'x'"/></add>
  <replace sel="//cue[@name='Other']/actions/set_value[@name='$a']/@exact">3</replace>
  <remove sel="//cue[@name=&quot;Other&quot;]/actions/do_if[@value=&quot;event.param.typename == 'Drone'&quot;]"/>
  <add sel="//set_value[@name='$a']" pos="after"/>
  <add sel="//cue[@name='Gone']"/>
  <add sel="//cue[@name='Init'"/>
</diff>
`,
    });
    const { notes, bad } = checkDiffs(ext, { target });
    assert.deepEqual(notes, [
        `extensions/target/md/fake.xml: <add sel="//cue[@name='Init']/actions"> matches 1 node in target/md/fake.xml`,
        `extensions/target/md/fake.xml: <replace sel="//cue[@name='Other']/actions/set_value[@name='$a']/@exact"> matches 1 node in target/md/fake.xml`,
        `extensions/target/md/fake.xml: <remove sel="//cue[@name="Other"]/actions/do_if[@value="event.param.typename == 'Drone'"]"> matches 1 node in target/md/fake.xml`,
    ]);
    assert.deepEqual(bad, [
        `extensions/target/md/fake.xml: <add sel="//set_value[@name='$a']"> matches 2 nodes in target/md/fake.xml`,
        `extensions/target/md/fake.xml: <add sel="//cue[@name='Gone']"> matches 0 nodes in target/md/fake.xml`,
        `extensions/target/md/fake.xml: <add sel="//cue[@name='Init'">: not a valid XPath`,
    ]);
});

test('a file under extensions/ must be a diff of a file that exists in a known, installed folder', () => {
    const target = tree({ 'md/fake.xml': targetScript });
    const op = `<diff><add sel="//cue[@name='Init']"/></diff>`;
    const ext = tree({
        'extensions/target/md/missing.xml': op,
        'extensions/target/md/fake.xml': `<mdscript name="NotADiff"/>`,
        'extensions/unknown/md/x.xml': op,
        'extensions/elsewhere/md/fake.xml': op,
        'md/own_script.xml': '<mdscript name="Own"/>',
        'libraries/equipmentmods.xml': op,
    });
    const { notes, bad } = checkDiffs(ext, { target, elsewhere: path.join(target, 'not-installed') });
    assert.deepEqual(notes, []);
    assert.deepEqual(bad, [
        `extensions/elsewhere/md/fake.xml: elsewhere isn't installed at ${path.join(target, 'not-installed')}`,
        'extensions/target/md/fake.xml: the root is <mdscript>, not <diff>: a file here only patches target/md/fake.xml',
        'extensions/target/md/missing.xml: no target/md/missing.xml to patch',
        'extensions/unknown/md/x.xml: no installed copy of unknown is known to the checker',
    ]);
});

test("an op's if must hold on the installed file: a path matches one node, a not(path) matches none", () => {
    const target = tree({ 'md/fake.xml': targetScript });
    const ext = tree({
        'extensions/target/md/fake.xml': `<diff>
  <add sel="//cue[@name='Init']/actions" if="//cue[@name='Other']"/>
  <add sel="//cue[@name='Init']/actions" if="not(//cue[@name='Gone'])"/>
  <add sel="//cue[@name='Init']/actions" if="//cue[@name='Gone']"/>
  <add sel="//cue[@name='Init']/actions" if="not(//cue[@name='Other'])"/>
  <add sel="//cue[@name='Init']/actions" if="//set_value"/>
</diff>
`,
    });
    const { bad } = checkDiffs(ext, { target });
    const head = `extensions/target/md/fake.xml: <add sel="//cue[@name='Init']/actions"`;
    assert.deepEqual(bad, [
        `${head} if="//cue[@name='Gone']">: if matches 0 nodes in target/md/fake.xml (the op would be skipped)`,
        `${head} if="not(//cue[@name='Other'])">: if's path matches 1 node in target/md/fake.xml (the op would be skipped)`,
        `${head} if="//set_value">: if matches 2 nodes in target/md/fake.xml (want exactly 1)`,
    ]);
});

test("content.xml: its id is the folder's name, it ships off, and it requires each given id (not optionally)", () => {
    const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'hh-offline-content-'));
    const write = (folder, xml) => {
        fs.mkdirSync(path.join(parent, folder));
        fs.writeFileSync(path.join(parent, folder, 'content.xml'), xml);
        return path.join(parent, folder);
    };
    const good = write('helper', `<content id="helper" name="x" enabled="0">
  <dependency version="800"/>
  <dependency id="the_patch" name="p"/>
</content>`);
    assert.deepEqual(checkContent(good, ['the_patch']), { notes: ['content.xml: id helper, off by default, requires the_patch'], bad: [] });

    const wrong = write('other', `<content id="helper" enabled="1">
  <dependency id="the_patch" optional="true"/>
</content>`);
    assert.deepEqual(checkContent(wrong, ['the_patch', 'sirnukes']).bad, [
        'content.xml: id "helper" is not the folder\'s name "other"',
        'content.xml: enabled="1": it must ship off (enabled="0")',
        'content.xml: the dependency on the_patch is optional; it must be required',
        'content.xml: no dependency on sirnukes',
    ]);

    const none = fs.mkdtempSync(path.join(os.tmpdir(), 'hh-offline-nocontent-'));
    assert.deepEqual(checkContent(none, []).bad, ['no content.xml']);
});

// A stand-in for X4's md.xsd and common.xsd: hand-written, declaring a few element names
const fakeXsd = () => tree({
    'md.xsd': `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"><xs:include schemaLocation="common.xsd"/>
  <xs:element name="mdscript"/><xs:element name="cues"/><xs:element name="cue"/><xs:element name="conditions"/>
  <xs:element name="actions"/><xs:element name="event_cue_signalled"/></xs:schema>`,
    'common.xsd': `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"><xs:element name="debug_text"/></xs:schema>`,
});

test('xsdElementNames reads every element name md.xsd and common.xsd declare', () => {
    assert.deepEqual([...xsdElementNames(fakeXsd())].sort(),
        ['actions', 'conditions', 'cue', 'cues', 'debug_text', 'event_cue_signalled', 'mdscript']);
});

test("the extension's own MD scripts: named after their file, unique cue names, only elements X4's schema knows", () => {
    const known = xsdElementNames(fakeXsd());
    const ext = tree({
        'md/my_checks.xml': `<mdscript name="My_Checks"><cues>
  <cue name="Log" instantiate="true"><conditions><event_cue_signalled/></conditions><actions><debug_text text="'x'"/></actions></cue>
</cues></mdscript>`,
        'extensions/target/md/x.xml': '<diff/>',
    });
    assert.deepEqual(checkOwnMd(ext, known), { notes: ['md/my_checks.xml: mdscript My_Checks, 1 cue'], bad: [] });

    const broken = tree({
        'md/my_checks.xml': `<mdscript name="Other"><cues>
  <cue name="A"><actions><debug_txt text="'x'"/></actions></cue>
  <cue name="A"><actions/></cue>
</cues></mdscript>`,
        'md/notmd.xml': '<diff/>',
    });
    assert.deepEqual(checkOwnMd(broken, known).bad, [
        'md/my_checks.xml: mdscript name "Other" is not the file\'s name "my_checks"',
        'md/my_checks.xml: cue name "A" is used 2 times',
        'md/my_checks.xml: <debug_txt> is not an element in X4\'s md.xsd or common.xsd',
        'md/notmd.xml: the root is <diff>, not <mdscript>',
    ]);
});
