// The tests' fixture folders: hand-written files in a temp dir, never Head Hunter's.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// A temp folder with the given files (relative path -> text)
export function tree(files) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hh-offline-'));
    for (const [rel, text] of Object.entries(files)) {
        fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
        fs.writeFileSync(path.join(root, rel), text);
    }
    return root;
}
