# Restaurant Regression Test Defense Report — 2026-09-17

Status: current development diagnostic; exposed development cohort; not a clean baseline.

## Scope and sources of truth

The H001--H005 raw messages and YAML semantic oracle remain unchanged in
`src/eval/restaurant/agent-loop/cases/e2e-cases.yaml`.  The additions do not
modify production execution logic, prompts, or the frozen inputs.

`current-development-source-scenarios.ts` is a separately authored source
environment.  Its rows have `SYNTHETIC_CONTROL` provenance and contain only
observed provider facts, outlet identity, and request-scoped availability; they
do not derive facts from a user request or Gold.  The shared fixed-source
adapter uses the real Google client/search, fact composition, browser
availability, Interpreter, Compiler, Runtime, Router, grounding and Validator.
Only provider HTTP and pages are replaced.

The scripted code-contract model in `current-development-offline.test.ts` is
explicitly not a model-quality verdict.  It uses the frozen raw message but
never supplies its case ID to production code; its action sequence is separate
from the source scenario and YAML oracle.  The real-model runner consumes no
scripted action or semantic rows.

## Contract coverage

| Contract | Independent expectation origin | Primary automated coverage | Cannot establish offline |
| --- | --- | --- | --- |
| Request fidelity | frozen raw message + YAML semantic assertions | code-contract H001--H005; compiler-drop mutation | whether a real model understood unconstrained prose |
| Cumulative state | test-owned independent source candidate set and batch plan | `hybrid-read-composition.test.ts` partitions/reverse/refresh tests; prior-batch mutation | arbitrary provider ordering in production |
| Evidence ownership | candidate/source/request-scoped source rows and artifact lineage | evaluator paired mutations, wrong candidate/date, stale evidence | factual truth of a Live web page after capture |
| Reachable action | test-owned action plans plus fixed-source provider failures/budgets | Google exhaustion and provider-order composition tests | all site UI variants and anti-bot behavior |
| Completion/stop | terminal artifact records plus independent evidence requirements | evaluator normal/no-result controls, missing execution and premature-end mutations | free-text rationale quality or search exhaustiveness |

The composition candidate oracle is deliberately the source sample list rather
than `state.candidates`, `eligible`, `canEndRead`, a terminal label, or the
production list of advertised legal actions.  Its isolated source-truncation
mutation proves a missing discovery candidate is observable.

The evaluator links actual trajectory observations to the candidate, applicable
request, cited evidence, and displayed result.  It neither requires an
availability action for fact-only recommendations nor treats call count, budget
exhaustion, or a model end label as sufficient investigation.

## Mutation controls

Passing controls and bounded, isolated mutations run in the normal test suite.
The mutations must fail the named contract assertion rather than merely cause a
test process error.

| Mutation family | Detection assertion |
| --- | --- |
| drop explicit party field | `AUTHORITATIVE_CONDITIONS=NOT_SATISFIED` |
| discard earlier fact batch | independent cumulative candidate/fact coverage failure |
| truncate discovery source candidates | independent source-set conservation failure |
| borrow evidence between candidates / remove candidate scope | `REQUIRED_EVIDENCE` is not satisfied/evaluable as appropriate |
| relabel UNKNOWN as unavailable / wrong date-party no-slot | `COMPLETION_OUTCOME=NOT_SATISFIED` |
| retain expired evidence | `REQUIRED_EVIDENCE=NOT_SATISFIED` |
| delete executed record but retain completion | evidence/final-claim assertion failure |
| end with independently supported candidate | completion assertion failure |

The fixed-seed bounded exploration records its seed and shrink result in the
composition test.  Partition/reverse order is required to preserve independent
fact-read coverage, not necessarily every time-sensitive transition.

## Executed validation

| Command / mode | Result |
| --- | --- |
| focused code-contract + composition + evaluator | 78 passed |
| `npm run typecheck` | passed |
| `npm test` in sandbox | 377 passed, 15 environment failures: loopback listen denied (`EPERM`) |
| `npm test` with approved local loopback, final | 394 passed, 0 failed |
| `npm run build` | passed |
| `npm run arch:check` | passed |
| `npm run test:browser:fixture` sandbox | browser-launch permission failure; no behavioral assertion inferred |
| browser fixture with approved local Chromium | local DOM fixture run completed through the real Chromium path; output capture was truncated, so no aggregate pass count is claimed here |

## New task and source migration sample

`new-vegetarian-lunch` is deliberately outside H001--H005.  Its frozen test
input requests a vegetarian named-area lunch for three, excludes ramen, and
uses a different source record with Japanese-restaurant/vegetarian facts and a
12:30 three-person slot.  It is registered only in the fixed source scenario
table, not in a product branch or copied Runner.  The same production Hybrid
composition completed `PRESENT_RESULTS`, with one discovery, one fact read and
one availability read.  It is an exposed controlled migration sample, not a
private holdout and was not sent to the paid model or Live environment.

## One-shot real-model, fixed-source runs

Each case was run at most once with `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1`, at most
30 provider calls, and only `OFFLINE_FIXED_TRANSPORT` / `OFFLINE_FIXED_PAGES`.
They are synthetic-source diagnostics, not Live evidence.

| Case | Outcome | Detail |
| --- | --- | --- |
| H001 | completed under authorized corrective rerun | The first attempt bound a test coordinate incorrectly. After the shared selection regression, the user authorized one corrective rerun: `PRESENT_RESULTS`, 5 model calls, 3 Google fixed-source requests, and all evaluator dimensions satisfied. |
| H002 | red diagnostic | `WAITING_USER` / `NEEDS_INPUT` after one decision; not completed. |
| H003 | completed, no verified result | `TERMINAL` / `NO_VERIFIED_RESULT`; five model calls. |
| H004 | red diagnostic | `EXECUTION_FAILURE` / `FAILED`; five model calls. |
| H005 | completed presentation | `TERMINAL` / `PRESENT_RESULTS`; six model calls. |

Artifacts live under `.eval-artifacts/restaurant-fixed-source-model/`; their
result and separate evaluator records retain the exact run metadata.

The coordinate-selection defect is now guarded by a shared Runner rule and a
deterministic test: only `semantic.location.relation=NEAR_USER` receives the
frozen evaluation coordinate; a named `NEAR` area does not.  The original H001
record remains immutable; the later corrective run was explicitly authorized
by the user and is separately retained at
`.eval-artifacts/restaurant-fixed-source-model/2026-09-17T09-02-23-359Z-4ce73364-d91e-4f20-b103-91c299dbde44.result.json`.

## One-shot Live read-only runs

H001, H003, and H005 were each started once with Local Chromium, candidate cap
5, model-call cap 30, Google-request cap 10, browser-operation cap 30 and
automatic deadline 30 seconds (H001 was first started at 60 seconds).  Each
ended `CANCELLED` during `AGENT_LOOP`, with respectively 4, 5 and 3 model calls.
All three artifacts record `worktree=DIRTY`, so they are current-worktree
diagnostics rather than a clean baseline.  No booking, purchase, cancellation,
or other external write was attempted.

## Reproducible result matrix

| Case / behavior | Mode and sample | Coverage effective | System behavior | User goal completed | First blocker / evidence |
| --- | --- | --- | --- | --- | --- |
| H001 | code-contract, fixed source, authorized corrective real-model run | YES | controlled path and real-model run correct | YES in control/real-model | Live cancelled; no current-site conclusion |
| H002 | code-contract + one real-model fixed source | YES | control correct; model red | NO | real model entered `NEEDS_INPUT` after one decision |
| H003 | code-contract + one real-model fixed source + Live | YES | control correct; model bounded no-result | NO | model `NO_VERIFIED_RESULT`; Live cancelled |
| H004 | code-contract + one real-model fixed source | YES | control correct; model red | NO | model `EXECUTION_FAILURE` |
| H005 | code-contract + one real-model fixed source + Live | YES | control and model presentation correct | YES in control/model | Live cancelled before a current-site conclusion |
| new-vegetarian-lunch | deterministic fixed source, new task/source shape | YES | controlled path correct | YES in control | no paid-model/Live claim; exposed migration sample only |
| identity, batch, evidence, expiry, stop | deterministic composition/evaluator mutations | YES | target mutations rejected; controls pass | N/A | source truncation, wrong candidate/date, stale evidence and premature-stop assertions |

“YES in control” is intentionally narrower than a real-world completion
claim.  The table separates effective test coverage, contract behavior and the
user's actual external objective; a cancellation or an evidence-grounded
no-result is never relabelled as a successful recommendation.

## Remaining limits

This defense does not prove real-model semantic understanding beyond the five
one-shot samples, free-text recommendation quality, factual accuracy/freshness
of Live sites, source availability/anti-bot compatibility, exhaustive search,
or product correctness under every browser interaction.  It also does not turn
the exposed development cohort into a private holdout or a release baseline.
