# Head Hunter on SWI

A patch that makes Chillmatica's Head Hunter mod work on X4 8.00 with Star Wars Interworlds, for the user's personal testing.

## The patch

**Patch**:
A separate small extension that depends on both Head Hunter and SWI and changes Head Hunter so the two work together. It holds only selectors and content written here, never Head Hunter's own files.
_Avoid_: fork, compat mod, port

**Advertised feature**:
Behaviour that Head Hunter's changelog or mod page promises. "Works as advertised" means it behaves the way Chillmatica describes it, in the Star Wars setting. It does not mean rebalanced for SWI.
_Avoid_: feature parity, 100% working

## Head Hunter's world

**The player's ships**:
Every ship the player owns, whether or not the player is flying it, including fleet subordinates and their drones. Anything they do counts as the player's doing.
_Avoid_: your ship (when it means only the one being flown)

**General bounty**:
The pay (and reputation) for a hostile ship that the player's ships attacked and that then died.
_Avoid_: kill bounty, kill reward

**Wanted ship**:
A ship that has killed others and so carries a wanted bounty that grows over time, listed on the wanted board.
_Avoid_: target, criminal

**Wanted bounty**:
The credits (and reputation) paid for claiming a wanted ship by destroying or capturing it.
_Avoid_: claim reward

**Hunter group**:
A group of ships that a faction sends after the player's wanted ships.
_Avoid_: hunters, bounty hunter fleet, headhunters

**Hunter roster**:
The list of factions that may send hunter groups.

**Classic Baddies**:
The option that limits wanted bounties to outlaw factions only (in vanilla: Xenon, Kha'ak, Scale Plate, Buccaneers; on SWI: Unknown Threat, Yuuzhan Vong, the Sith and the four pirate factions). Killing an outlaw faction's ship never makes the killer wanted.
_Avoid_: pirates-only, no-faction-wanted

## Playing it

**Play setup**:
The game profile and mods used to play Head Hunter on SWI, kept apart from `swibh`'s test install so neither leaks into the other.
_Avoid_: test install, HH install

## Checking it

**Full pass**:
One run of every check on the checklist, covering all advertised features, not just the ones the patch changes. It is how "works as advertised" gets signed off, and it is run again after Head Hunter or SWI updates.
_Avoid_: regression run, test suite

**Focused check**:
A check on a feature the patch changes or that was dead before it: what to do, what to see on screen, and what the log shows.

**Smoke check**:
A short check on a feature the patch doesn't touch: one action with one stated expected result. It still runs in every full pass, so an upstream update that breaks the feature gets caught.
_Avoid_: sanity check, spot check

**Upstream bug**:
A feature that fails on vanilla X4 too, not only with SWI. It is Chillmatica's to fix, not the patch's, unless a decision says otherwise.

**Check helper**:
A test-only extension, separate from the patch and off in normal play, that adds log lines, shorter timings and shortcut buttons so checks are quick to run and their results can be seen.
_Avoid_: test harness, debug mode, test mod
