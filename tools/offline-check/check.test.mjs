// Tests for the offline checker, on hand-written fixtures in temp dirs (never Head Hunter's files).
// Run: node --test tools/offline-check/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checkDiffs, checkWellFormed } from './check.mjs';

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
