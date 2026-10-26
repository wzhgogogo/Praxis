# Restaurant semantic development Gold

`restaurant-semantic-regression.gold4.json` is the current exposed development dataset, Gold@4. Its 15 messages and frozen Tokyo reference time are unchanged. User stop-3 review on 2026-10-26 CET approved exactly one Gold change: SR03-T02 `target.goal` becomes `AVAILABILITY` under rule B. Frozen Gold@3 remains byte-identical in `../fixtures.ts`; its other labels remain development debt, not a clean baseline.

`goal-boundary-annotations.json` is current sidecar@2, SHA-bound to Gold@4. SR02-T01 is A even without a time; SR02-T02 carries that goal (`CONTEXT_CARRY`). `NO_TIME` means neither visit date/time nor booking wording. Other gray labels stay gray despite the accepted 3/3 recommendation observations. Sidecar@1 is retained in `goal-boundary-annotations.v1.json` as frozen regression / superseded annotation, not loaded by the current runner.

All non-goal labels remain unchanged, including outdated criterion strength/window labels and the named query. The separately tracked 3b prerequisites do not authorize relabeling or contract fixes in this batch.
