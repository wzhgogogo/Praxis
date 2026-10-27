# Restaurant semantic development Gold

`restaurant-semantic-regression.gold5.json` is the current exposed development dataset, Gold@5. The user confirmed all 15 proposed labels on 2026-10-27 CET: eight criterion strengths and seven broad-time windows. Its 15 messages, frozen Tokyo reference time, target goals/queries and other fields are unchanged. Named Sushi Dai, smoking / NEGATIVE / HARD and the SR08-T02 removal state remain intact. No historical evaluation is rewritten; this is not a clean baseline.

`goal-boundary-annotations.json` is current sidecar@3, SHA-bound to Gold@5. All target categories are unchanged: SR02-T01 is A even without time; SR02-T02 is `CONTEXT_CARRY`; `NO_TIME` means neither visit date/time nor booking wording. Gray labels remain gray. Sidecars@1/@2 remain in their frozen versioned files; they are not loaded by the current runner.

Gold@4 remains byte-identical in `restaurant-semantic-regression.gold4.json`; it contains the prior sole SR03-T02 goal change. Gold@3 remains byte-identical in `../fixtures.ts`. Current stage oracles reflect only the approved labels. Model query loss, invalid collection CONFIRM and double-negative wording are defects to validate separately, not labels to copy into Gold.
