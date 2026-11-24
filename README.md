# Head Hunter on SWI patch

> **Personal testing only. This is not a release.**
>
> This repo is for my own personal testing of a patch that makes
> Chillmatica's **Head Hunter** mod work on **Star Wars Interworlds (SWI)**.
> Nothing here is published as a mod, and nothing will be published until I
> have had a courtesy talk with Chillmatica, Head Hunter's author. Please do
> not package, upload or redistribute anything from this repo.

## No Head Hunter files

This repo holds **no Head Hunter files or code**. It contains only XPath
selectors that point at Head Hunter's files and content written here. To use
the patch you need Head Hunter itself, installed from its own source.

## Target environment

The patch is written and checked against exactly these versions:

| Component | Version | Content id |
| --- | --- | --- |
| X4: Foundations | 8.00 (build 590967) | |
| Star Wars Interworlds (SWI) | 0.91 HF1 | `SW Interworlds` |
| Head Hunter (Chillmatica) | 2.0.8 | `ws_2992233767` |
| SirNukes Mod Support APIs | 1.95 | `ws_2042901274` |

Other versions may work, but they are not tested.

## More

- [SEED.md](SEED.md): the starting brief.
- [GLOSSARY.md](GLOSSARY.md): the terms used in this repo.
- [docs/verification.md](docs/verification.md): the checklist, and the offline check (`npm run check`).
- After cloning: `npm install`, then `git config core.hooksPath .githooks` to enable the pre-commit guardrail ([verification.md](docs/verification.md#the-pre-commit-guardrail)).
