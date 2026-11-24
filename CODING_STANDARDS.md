# Coding standards

Read when reviewing a change to `patch/` or `checks/`. These need judgement. `npm run check` covers the rest, so this file doesn't repeat it.

## The standing rule: only our own work

The repo holds XPath selectors and content written here, never Chillmatica's code (Head Hunter's terms don't allow uploading its files anywhere). The offline check catches exact copies. A reviewer catches the rest:

- **Near-copies.** A Head Hunter cue copied, lightly edited and put back with `<replace>` is still Head Hunter's code. When a change really needs a whole cue swapped, the new cue is written from scratch and the commit says so.
- **The one exception.** The radar mod's `<radarrange>` line in the patch's `libraries/equipmentmods.xml` re-creates Head Hunter's data entry with its values, because SWI's replace can wipe it (spec #18, "Standing rule"). No other copy is allowed for that reason.
- **Marker reasons.** An `hh-copy` reason names why no smaller op can do the job, e.g. "a diff can't wrap an existing node". "Simpler this way" isn't a reason.

## Small ops on exact selectors

Each op touches only the node or attribute that changes: `<replace sel=".../@value">` over replacing the element, an `<add>` beside a node over replacing its parent. Selectors name a node by what identifies it (a cue's `@name`, an action's own attributes), not by position. Small, exact ops keep working when Head Hunter changes nearby lines, and keep the patch to what we wrote.

## Domain language

Comments, log lines, cue names and commit messages use `GLOSSARY.md`'s terms, e.g. **hunter group** (not "hunters" or "bounty hunter fleet"), **wanted ship**, **check helper**. Each term's _Avoid_ line lists the words it replaces. A new concept that needs a name gets a glossary entry before it gets a second use.
