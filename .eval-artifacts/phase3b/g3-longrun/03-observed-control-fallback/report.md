# G3 Group03 — native control accelerator fallback

- Completed 2026-10-28T17:15:17.578185+01:00, Vienna CET (UTC+1).
- Branch `codex/feat-phase3b-tabelog-observed-availability`, base main `ba466eb3`.
- Frozen old-code red `551e6dd0`, implemented/tested `6bb5ba78`.
- Freeze `input-freeze.json`: 688 paths, SHA-256 `6c54ed5e2e10755a54d2a906a0f51c471674c01ba468d9ddc9ca56588f7a5609`; Python outer scripts included before execution.
- Group COMPLETE; no main merge, no claim that every private calendar/slot dependency has been removed.

## Change

Known native selectors remain an allowed acceleration path. A runtime selector failure, stale target or unconfirmed native value now falls back to the existing Agent observation loop on the current page. The requested date/party and remaining shared model/operation/elapsed budgets remain authoritative. The accelerator must report one exact selected value per field. Only BROWSER_RUNTIME_FAILED/BROWSER_STALE_TARGET are caught; policy, cancellation, deadline and operation/model budget failures are not swallowed or reset. No alternate provider, private scripted click sequence or new request is added.

## Effective red / green and actual workflow

The real local Chromium fixture has obsolete hidden native selectors and visible renamed Date/Guests controls. Its native selectOption fails through actual Playwright. Old Adapter returns UNKNOWN instead of the feasible AVAILABLE result (5.80s, target assertion; `red/`). New Adapter lets the scripted Agent fill the observed Date and choose the observed Guests option. The captured merchant/date/party/time response then produces the exact 19:00 offer. Native current values are independently read from Chromium after actions. A response for party3 remains UNKNOWN/no offer even when visible controls say party2. Same two-control test passes (13.24s, `green/`). No real model/website or claim of current inventory quality.

| Gate | Result | Seconds |
|---|---|---:|
| typecheck | PASS | 0.548 |
| arch-check | PASS | 0.257 |
| npm-test | PASS (1213/1213) | 30.784 |
| build | PASS | 0.627 |
| browser-fixture | PASS (178/178) | 119.580 |
| dom-change | PASS (4/4) | 22.217 |

Every final gate records clean git status before/after; restorations0, no skipped failures, inputs SHA-verified before/after. Existing abort, deadline, global model/operation budgets and Guard tests are included. This group needed no gate repair and deleted/relaxed no original test. Added one B-owned real Chromium behaviour regression. C source/four protected test blocks remain byte-identical (`preservation.json`).

Full old HARD fixture result is byte-identical, 44,197 bytes/SHA `9a3298bc5e004b99e41d80713e8913b68c336cfa594f6eb60599e310ee3fb633`. Sites4,028/Pack478 physical production TS lines, reference only. Ledger446 unique entries preserves all441 main entries; new real model/Google/site/Live/GET/environment calls0. No .env or QA-answer reads. Prompt/Action Schema/Context/State/TaskDefinition unchanged. macOS only here; independent Linux rerun not performed.

## Stop boundary

Next private-slot retirement requires replacing the inventory premise of C's protected fragment-positive fixture. The exact proposed input-only patch is in `../pending-c-fixture/fragment-response.patch`; it is NOT applied. All C logic and assertions would remain unchanged. User's specific protected-C instruction requires reporting before changing this portion; an asynchronous authorization request is pending. This is the present stop reason, not waiting for A's calendar merge. Calendar response/UNKNOWN implementation and G3c are unfinished; no full strict G2 or G3 completion claim.
