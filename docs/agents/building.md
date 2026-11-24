# Building the patch and the check helper

What the repo can't tell you when you change `patch/hh_swi_patch/` or `checks/hh_swi_checks/`. Commands are in `package.json`; reference paths and their env overrides are in `tools/offline-check/paths.mjs`.

## Only our own work

The repo holds selectors and content written here, never Head Hunter's files, whole or in part. Read Head Hunter from the install at run time, and write test fixtures by hand. `CODING_STANDARDS.md` has the rule and the judgement a review applies; the copy check in `npm run check` flags exact copies unless an `hh-copy` marker gives the reason.

## The install and the profiles are read-only

The game install, the unpacked references and the X4 profile folders belong to the user. Read them; leave every byte as it is. A script that writes there (such as `tools/play/play.sh`) is tested against temp folders passed in through its env overrides, as `tools/play/play.test.mjs` does. Installing, launching and playing are the user's steps.

## In-game rows stay unrun

A row in `docs/verification.md` passes only when the user saw it in game. Leave its run cell empty, and hand the user the rows your change must pass. When they report a session, read its log with `npm run log` before the rows' own log lines, which applies the failure rule in `docs/verification.md`.

## Research notes

Earlier tickets' findings live on `research/<name>` branches, each as `research/<name>.md`, never merged. List them with `git branch --list 'research/*'` and read one with `git show research/<name>:research/<name>.md`.

## A new extension id goes in the play lists

When a change adds an extension or changes an id in a `content.xml`, update `ON` and `OFF` at the top of `tools/play/play.sh` in the same commit; the script checks the lists itself.

## The guardrail hook

`docs/verification.md`, "The pre-commit guardrail", says what `.githooks/pre-commit` does and how to enable it. Enable it in this repo's config only, never globally. A test that spawns a child passes it a cleaned environment:

- a child `git` drops every `GIT_*` variable, which the hook inherits from the commit and would point the child at this repo, as `tools/hooks/pre-commit.test.mjs` does;
- a child `node --test` drops `NODE_TEST_CONTEXT`, which would send its report to the outer runner, as `tools/play/skip.test.mjs` does.
