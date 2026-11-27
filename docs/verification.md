# Verification

## Focused check: L hunter is not a carrier

With Head Hunter 2.0.8, SWI 0.91 HF1, and this patch enabled:

1. Create or find a lone wanted player L ship with a board value near 100,000 Cr.
2. Send the wanted ship several times so Head Hunter creates an L hunter group.
3. In the helper log, inspect each `hunter:` line.

Expected: every L hunter has an L military hull whose ship type is not `carrier`.
The helper marks a failure as `CARRIER`; no `hunter:` line should contain that marker.

This check does not require every roster faction to have an eligible L hull. If a
faction has no non-carrier L military hull, the existing `LIB_Create_Ships`
selection may create fewer hunters.
