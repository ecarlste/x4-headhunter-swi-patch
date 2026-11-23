# Wanted bounty units: board figure or 1/100? (2026-11-23)

Answers issue #6 (open question 1 of `swibh`'s [chill-headhunter.md](https://github.com/ecarlste/x4-swi-bounty-hunter/blob/research/chill-headhunter-compat/research/chill-headhunter.md)). Nothing was run; everything below comes from reading.

Tags: **[read]** = seen in a file or doc. **[inferred]** = follows from what was read.

## Short answer

**The claim pays the board figure**, truncated to whole credits. There is no mismatch between the board and the payout. `($value/100)Cr` is a cents-to-credits round trip, not a second divide by 100. The board (MD menu and Lua map tab), the "HEAD CLAIMED!" notification, the map label and the payout all treat `$value` as a money value in cents and show or pay it in credits [read + inferred].

The only thing using the wrong scale is **claim reputation**: it multiplies the raw cents number, so it is 100x stronger per credit than its constants suggest. That's a side finding; it's not what the ticket asked about.

## Sources

- `HH/` = Head Hunter 2.0.8 (`chillheadhunter`), unpacked in the session scratchpad. `HM` = `md/headhuntermd.xml`, `BOARD` = `md/headhunterboard.xml`, `HUNT` = `md/headhunterhunted.xml`, `LUA` = `ch.txt`, `TXT` = `t/0001.xml`.
- `V8/` = vanilla 8.00 at `/mnt/e/x4-dev/reference/x4-8.00/base`.
- `SWI/` = SWI 0.91 HF1 at `/mnt/e/x4-dev/reference/mods/swi-0.91hf1`.
- **MDG** = Egosoft's [Mission Director Guide](https://wiki.egosoft.com/X%20Rebirth%20Wiki/Modding%20support/Mission%20Director%20Guide/), the first-party reference for MD expression semantics (written for X Rebirth; X4 uses the same MD engine).

## 1. The rules that decide it

1. **Money is an integer stored in cents.** MDG: "Money in Credits or cents, always stored in cents", and "All unit data types are floating point types, except for money, which is an integer data type". `V8/libraries/scriptproperties.xml:2323` declares `money` with suffix `ct` [read].
2. **Arithmetic with a plain number keeps the unit.** MDG: "Non-unit and unit: The result will be the unit type." So `money / 100` is money whose stored number is the cents count divided by 100 (integer division) [read].
3. **`(expr)unit` reinterprets the stored number in that unit.** MDG: "When converting to a non-default unit type, this means you interpret the number as in the given units", with the example `(1km + 500m)h`: 1500 m is read as 1500 hours. So `(X)Cr`, where X is money holding the number N (cents), gives N credits = 100·N cents [read].
4. **`.formatted.default` shows credits.** `V8 scriptproperties.xml:2325`: "Formatted money string in default format (%s), with full accuracy, without cents". MDG: "The formatted representation always shows the value in Credits" [read].

Vanilla uses the same round trip as a "truncate to whole credits" idiom: `($ware.averageprice / 1Cr)Cr` (`V8/aiscripts/order.trade.single.xml:24-27`, `order.trade.single.sell.xml:37-38`, `order.salvage.deliver.notrade.xml:65`). Its commented-out predecessor was `($ware.maxprice / 100)Cr` (`order.trade.single.buy.xml:36`), the exact form Head Hunter uses [read]. Under rule 3 both forms give the same result [inferred].

## 2. Tracing `$value`

| Step | Where | Expression | Unit |
|---|---|---|---|
| Created | `HM:242`, `:248` (new killer) | `$value = (($victim.value/10) - ($victim.seed % (($victim.value/10) / 10)))` | `value` is money (`V8 scriptproperties.xml:238`), so `$value` is money in cents: 9-10 % of the victim's value [read + inferred] |
| Grown | `HM:222` (repeat killer) | `$value + (same term)` | money, cents |
| MD board (SirNukes menu) | `BOARD:190`, `:218` | `$value.formatted.default + 'Cr'` | shown in credits (rule 4) |
| Lua map tab | `HM:458` copies `$value` into `player.entity.$headhunterWantedShips`; `LUA:108` reads it via `GetNPCBlackboard`; `LUA:308` shows `ConvertMoneyString(bounty, false, true, 0, true) .. 'Cr'` | Same path and call vanilla uses for the MD money `$HiringFee` (set as `(...)Cr` in `V8/md/npc_instantiation.xml:2297`, read with `GetNPCBlackboard` and shown with `ConvertMoneyString(fee, false, true, nil, true)` in `V8/ui/addons/ego_detailmonitor/menu_map.lua:23528-23539`) [read]. So the tab shows the same credit figure as the MD board [inferred] |
| Map label | `HM:497` | `$value.formatted.{'%1cs'}` | credits, abbreviated |
| Claim notification | `HM:313`, text `TXT` 8008574/134 "HEAD CLAIMED! ... Bounty value: %s credits" | `$value.formatted.default` | credits = board figure |
| **Claim payout** | `HM:314`, `:316` (`WantedClaimTracker`) | `$rewardCr = ($value/100)Cr`, then `transfer_money ... amount="$rewardCr"` | `$value/100` is money holding N/100 (rule 2); `(…)Cr` reads N/100 as credits (rule 3) = N cents, less any cent remainder. **Paid = board figure, rounded down to a whole credit** [inferred] |
| Abandoned S/M capture | `HM:416` | same `($value/100)Cr` | computed but never transferred (known bug, [chill-headhunter-md.md](https://github.com/ecarlste/x4-swi-bounty-hunter/blob/research/chill-headhunter-compat/research/chill-headhunter-md.md) §5) [read] |
| Proximity threshold | `HM:381`, `:386` | `$value/100 ge $HeadHunterProximityThreshold` | left side is money holding the credit count; the slider's plain integer becomes money of the same number (rule 2), so it compares credits with credits, as the slider's 'Cr' suffix promises (`chillheadhunter.xml:159`) [inferred] |
| Hunter size brackets | `HUNT:115`, `:118` | `$value/100 gt 1000000` | the same: thresholds of 1 M and 5 M credits [inferred] |
| Hunter payoff | `HUNT:252`, `:265` | `$value*10` | money: 10x the board figure, as advertised [inferred] |

So every reader of `$value` agrees: it's money in cents, displayed in credits, and paid out at the same credit figure.

## 3. Why the earlier reading was unsure

The SWI note ([chill-headhunter-swi.md](https://github.com/ecarlste/x4-swi-bounty-hunter/blob/research/chill-headhunter-compat/research/chill-headhunter-swi.md) §2.2) allowed for "the cast keeps the money amount", which would pay 1/100 of the board. MDG rule 3 rules that out: a unit cast reinterprets the stored number, it doesn't preserve the quantity. The hint it cited, Reloaded's patch 10 dividing stored values by 100, only shows that the older versions *stored* cents; it says nothing about the payout [read: `swibh` main, `research/headhunter.md` line 60].

## 4. SWI

SWI doesn't change MD expression semantics (that's the engine), and it doesn't redefine `ConvertMoneyString` (no assignment or definition of it under `SWI/`) [read: grep]. SWI changes ship *values*, so it changes bounty sizes, not units. "As advertised" pay sizes are out of scope (map #1).

## 5. Side finding: claim reputation uses the cents number

`HM:311`: `[0.00016LF + (0.00064LF / (8000000)LF * ($value)LF), 0.02].min`. By rule 3, `($value)LF` is the stored cents count. So the formula reaches its 0.02 cap at 2.5 M credits of bounty, not the 250 M credits the constants would mean if `$value` were credits [inferred]. This is Chillmatica's behaviour, probably unintended. Whether the patch keeps it is a separate decision; this ticket doesn't make it.

## 6. Confirming it in game

Head Hunter's own debug lines can't help as shipped: the `--PLAYERCLAIM--` line (`HM:307-309`) has `chance="0"`, and it prints `$value`, not `$rewardCr`. A player claim also writes **no logbook entry**: the `write_to_logbook` at `HM:301-304` sits inside `do_if ... (not $wantedclaimer.isplayerowned)` (`HM:299`), so its "if player-owned" branches never run [read].

Two checks, either is enough:

1. **No code:** note the board figure of a wanted ship, kill it with a player ship, and compare the "HEAD CLAIMED!" notification and the credit change in the player's transaction log (Player Information > Transaction Log). Expect the change to equal the board figure (plus any other payouts for the same kill: vanilla police bounty, general bounty, SWI's EM hunt, so pick a target that triggers none of them, or subtract them).
2. **Debuglog (test-only patch line):** add a `debug_text` right after the `transfer_money` in `WantedClaimTracker`, for example `'HHSWI claim: board=%s paid=%s'.[global.$HeadHunterWantedTracker.{$wantedship}.$value.formatted.default, $rewardCr.formatted.default]`, run with `-debug all -logfile debuglog.txt`, and grep for `HHSWI claim`. Expect the two figures to match (paid may be up to 1 Cr lower). The selector names only Head Hunter's cue and the `transfer_money` node, so it fits the no-Chillmatica-code rule.

## Impact on the patch

None needed for units. The patch doesn't have to touch `$value`, the board, the Lua tab or the claim payout. Section 5's reputation scale is the only open item, and it's Chillmatica's existing behaviour.
