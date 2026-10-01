# H001 browser convergence plan — 2026-09-30

Status: **current Stage 1/2 plan; not a Live result.**

The frozen request remains H001: Shibuya, materialized date, 19:00, two
people, and HARD `omakase`.  This plan changes neither the Semantic/Gold
contract nor the fixed Tabelog → TableCheck source order.

## Fixed execution development set

| Behavior group | Current classification | Independent success/failure oracle |
| --- | --- | --- |
| Native and custom controls, opaque values, and scrollable choices | `10+` exactness and native value readback are fixed offline; the old five-action fixture still revealed options according to its script and is being replaced. | The page-owned selected value and request URL must contain exactly `10`, never `10+`; scrolling an observed owner list must reveal a pre-existing option. |
| Async rebuild, temporary disablement, and stale references | Stale-target rejection and re-observation are fixed offline, but remain un-Live-tested. | A replaced old reference is rejected; a fresh observed equivalent completes without repeating the old action. |
| Waiting and progress | Confirmed root cause: the runtime waited only for URL/title/body text, missing pure form-state mutations. | A delayed `value`, `aria-selected`, or `disabled` mutation wakes the wait; unrelated prose alone does not prove the action effect. |
| Request/result consistency | Existing response binding is fixed offline; old DOM stock must remain rejected. | The accepted slot must bind the same outlet, date, party, and time from a page-owned response or exact result control. |
| Source restrictions and failure isolation | Tabelog closed-date reading and challenge/navigation failures are fixed offline only. | The restricted candidate is `UNKNOWN` with its source reason; it is never converted to unavailable inventory and later candidates continue. |
| Multi-candidate delivery | Existing native fixed-source composition covers the three required routes, but its page session is static. | Router/Runtime/Agent/facts/browser/acceptance/presentation reaches `PRESENT_RESULTS` only from source evidence, or reaches exact `NO_VERIFIED_RESULT` without an inventory claim. |

The current fixed-source page session deliberately throws on model-controlled
`click` and `fill` and preselects request values.  It remains useful for
formal downstream composition, but is **not** evidence that a real model can
operate dynamic controls.  Stage 2 therefore adds a local Chromium dynamic
control fixture; Stage 3 is the only real-model proof.

## Stage 1 and 2 boundary

Stage 1 records the behavior groups above and the baseline at
`/private/tmp/praxis-browser-convergence-stage12-20260930/`.  Stage 2 may
change shared browser execution, source parsing, formal offline composition,
and their Capability Matrix/Harness evidence.  It may use saved pages and
local Chromium only.  It has **zero** external source reads, zero paid model
calls, zero booking writes, and no automatic re-run.

The native funnel records separate raw links, parsed outlets, inspected
outlets, accepted and rejected outlets, and each observed entrance deferred
by the detail cap. A parser cap is not a source-exhaustion observation; batch
capacity remains bounded and the source order remains Tabelog then TableCheck.

The local Chromium fixture and the static native formal composition prove
different boundaries. The former proves the shared executor and Adapter can
operate a dynamically changing page; a second wholly intercepted native
Tabelog detail starts at a different date and party size and produces its
request-bound vacancy response only after both real DOM actions. The latter proves the production
Interpreter/Compiler/Router/Runtime/Agent/facts/acceptance/presentation chain
from native discovery. They must both pass, but they are not evidence that a
real model has operated a dynamic provider page. That is an explicit Stage 3
gap, not a claim hidden by the fixed-source model runner.

## Released later only after independent review

Stage 3 was later separately authorized and ran three sequential fixed-source
real-model H001 formal-composition runs with the wholly intercepted dynamic
native Tabelog detail page:

```sh
PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 npm run eval:restaurant:agent-loop:native-fixed-source-model -- --case h001 --scenario DYNAMIC_TABELOG_DELIVERS --max-model-calls 50 --max-steps 30 --timeout-ms 300000
```

Each run had a ceiling of 50 model calls, 30 agent steps, and 300 seconds;
the three-run ceiling was 150 calls and 900 seconds. The page begins with the
wrong date and party size, and only the captured same-outlet `19:00` response
after both observed actions is a dynamic success oracle. The executions used
9, 9 and 10 model calls in 11,816ms, 10,822ms and 14,223ms. All reached
`PRESENT_RESULTS`, but the independent evaluator rejected all three because a
later same-source fact read superseded a fact still cited by the presentation.
Those immutable failure artifacts were re-evaluated by Evaluator@22 and remain
qualified `NO`. The correction excludes superseded facts from presentation and
requires a later same-source read to omit the old ID before the evaluator
retires it; it also gives native fact judgment the controlled composition
clock. Three new sequential real-model rechecks then used 10, 10 and 9 calls
in 13,802ms, 13,677ms and 11,672ms. Each clicked the dynamic date and party
controls, received the same-outlet `19:00` response, reached `PRESENT_RESULTS`,
and independently evaluated qualified `YES` under Evaluator@22 while the
rubric remained @21. Static `TABLECHECK_RECOVERS` remains the offline
source-continuation and short-batch proof; the dynamic Tabelog triple does not
pretend to replace it. Its artifact records sanitized browser navigation,
control observations, model actions, page-owned booking-region state and the
narrowed passive vacancy response, including in a failure artifact; it is not
limited to the final production Offer claims.

Stage 4 is one separately approved H001 Live only, with its existing fixed
ceiling of 300 seconds and 50 total model calls. No Stage 4 command is run as
part of this work.

## Stage 2 acceptance

The affected tests must demonstrate normal completion, recoverable stale
state, a correct refusal, and source continuation.  The final offline formal
composition must keep the production interpreter/compiler/router/runtime/
agent/facts/browser/acceptance/presentation path and cannot inject HIGH,
Offer, or final State.  Typecheck, architecture check, relevant test groups,
and build then run before review.  Results will be reported as offline/local
Chromium evidence, separately from future real-model and Live evidence.
