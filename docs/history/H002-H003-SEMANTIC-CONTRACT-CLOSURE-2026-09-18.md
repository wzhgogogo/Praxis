# H002/H003 Semantic Contract Closure — 2026-09-18

Status: **independently reviewed; partial acceptance. H002 party-size subgoal and bounded H003 fixed-source result accepted; H002/H004 strength non-regression remains OPEN. Original automatic scores are preserved.**

## Scope and preserved boundaries

Baseline was `01e073f6dbde651c14661d6b2a093a78ce0bf47b`; pre-existing dirty
diagnostic/report files were retained. H004's earlier manual equivalence record remains historical; its new regression is recorded below. H005 expectations, other-case Gold, private Holdout, source fixtures, fact judgment,
Live browser/Google/web reads, booking, commit, and push were not changed or run.

ADR-0029 formally supersedes only ADR-0009's `UNSPECIFIED` definition. It does
not rewrite historical annotations: `restaurant-read-development@5` changes only
H003's two exposed HARD annotations to UNSPECIFIED (the two SOFT annotations remain unchanged), while @4 artifacts remain historical.

## Implemented contract

- Party supplement wire is `restaurant-party-size-supplement@2` with exactly
  `{status, partySize}`. `UNKNOWN/0` is stripped to canonical UNKNOWN. The model
  no longer emits provenance; composition writes `INFERRED_CLOSED_PARTY` only
  after a RESOLVED supplement. Primary interpreter party values remain intact.
- The frozen semantic-arity prose remains Prompt@v2; SHA-256 is
  `c61661ca5c0c0819acff1ac5eaf19eb30498341c81e0b309ecf677601a54cd40`.
- Web persistent composition, Hybrid Live composition, and fixed-source
  composition receive the resolver. The persistent path has an event-id check
  plus a narrow in-flight `(taskId, requestId)` guard. After authenticated
  conversation lookup, `submitMessage` synchronously registers its *complete*
  remaining work before any version read, cancellation, interpreter, or
  resolver await; a duplicate joins that work rather than racing through a
  check-then-set window. Semantic events record the invocation count and the
  provider-response attempt count separately, so no-call and UNKNOWN/failure
  are distinct (including one invocation / zero provider attempts on transport
  failure).
- T1–T6 handler-composition coverage proves explicit primary no-call; resolved
  closed-party patch/provenance; UNKNOWN and model failure no invention; and
  Recommendation/H004 no-call. This is no source/browser/booking path.
- The PGlite persistent Runtime/Web-entry regression separately proves the
  resulting Draft and Reducer state: explicit `4` and inferred `3` persist;
  UNKNOWN and a supplement transport failure end in `NEEDS_INPUT` with
  `partySize` missing; an already stored party is neither overwritten nor
  re-supplemented; a recommendation does not invoke the resolver. It also
  blocks the first supplement call, submits the same existing conversation and
  request ID concurrently, and proves exactly one invocation, a completed
  replay without a second invocation, and a legal presented-result refresh
  without reinterpreting/supplementing the request.
- Semantic Prompt@v20 and Agent Decision Prompt@15 implement the new HARD/SOFT/
  UNSPECIFIED contract. Criterion identity is normalized text+polarity, making
  strength mutable; evaluator@17 evidence gates only HARD and records non-HARD
  rewrites for semantic review. Incremental strength changes are demonstrated
  only for `ASSERT`; existing `CORRECT` deliberately remains whole-collection
  replacement. A same-Proposal same-identity strength disagreement is an
  order-independent `CONTRADICTORY_PROPOSAL`.

## Real-model gates

| Gate | Result | Calls | Effective model | Tokens | Evidence |
|---|---|---:|---|---:|---|
| H002 resolver wire/arity | ACCEPTED | 8/8 | returned label `deepseek-flash` | 5,494 | Four fixed samples ×2 all correct; no retry/Google/browser/booking. |
| H003 strength | Original AUTO rejected (13/18 exact); independent semantic review accepted (18/18) | 18/18 | returned label `deepseek-flash` | 112,960 | Fixed six categories ×3; no retry/Google/browser/booking. |

The H003 plan configured `deepseek-v4-flash`, but every returned provider
response reports `deepseek-flash`. This is recorded as request-configuration/
provider-returned-label discrepancy; the label alone does not establish a
backend model switch and is not silently treated as one.

H003 automatic exact-text details: explicit HARD exclusion, HARD venue type,
ambiguous capability, and ambiguous occasion were each 3/3; the explicit SOFT
control was 0/3 only because all responses said `quiet place` rather than the
abbreviated scorer text `quiet`. The H003 main four-criterion case was 1/3:
two outputs changed `team dinner` to `suitable for a team dinner`. Across all
18 calls, polarity and strength matched the new contract. The original automatic
score remains rejected and unchanged; the separate supplemental record marks both
wording forms `SEMANTICALLY_EQUIVALENT`, now accepted by the separate independent review.

At the initial automatic gate, dependent fixed-source runs were paused. After independent semantic review accepted the faithful paraphrases, the pre-authorized continuation below ran once per case. There was no gate retry, Prompt iteration, model switch, H005 call, or Live run.

## Post-review fixed-source real-model runs (one each)

After original-researcher review accepted the supplemental H003 semantic review
for this narrow gate (without changing the original automatic result), exactly
one fixed-source real-model read was run for each of H002, H003, and H004.
Each started artifact records the same exposed dataset SHA-256
`ef57893638be2cbc295cb14295d24b6d2d7bdc2918da83de68c48ae839ca7699`,
`SYNTHETIC_CONTROL` / `OFFLINE_FIXED_TRANSPORT` / `OFFLINE_FIXED_PAGES`, and
the explicit 300,000 ms / 50-step / 50-model-call ceiling. The requested
configuration was `deepseek-v4-flash`; every response invocation reports the
provider-returned label `deepseek-flash`. This records an observable label
difference only, not an inferred provider backend change.

| Case | Actual model calls / tokens / elapsed | Execution | Independent evaluation / acceptance | Material observation |
|---|---:|---|---|---|
| H002 | 9 / 29,020 / 13,350 ms | `PRESENT_RESULTS`, three request-bound slots | strict evaluator qualified `NO`; acceptance `FAIL`; independent review: party sub-goal accepted | Primary Proposal omitted `PARTY_SIZE`; the one actual supplement call returned 2 and final Draft records `INFERRED_CLOSED_PARTY`. An independent in-memory label-only diagnostic maps the abbreviated Gold HARD labels to the recorded original user wording and makes all required-evidence observations applicable; it proves the strict evidence failure is label/lineage related, not absent negative-HARD evidence. It does not rewrite the artifact/Gold/evaluation or turn it into PASS. The remaining semantic difference is first-date `UNSPECIFIED` versus exposed SOFT. |
| H003 | 4 / 19,411 / 8,095 ms | `PRESENT_RESULTS`, three request-bound slots | strict evaluator qualified `UNKNOWN`; acceptance `FAIL`; independent bounded review accepted | `team dinner`/`good for drinks` were UNSPECIFIED; budget/private room SOFT. Retrieval considered drinks/private-room/budget without claiming unsupported satisfaction. Non-HARD automatic semantic/final-claim dimensions remain `NOT_EVALUATED`; no automatic result was rewritten. |
| H004 | 7 / 21,375 / 8,711 ms | `PRESENT_RESULTS`, three cafe recommendations | strict evaluator qualified `UNKNOWN`; acceptance `FAIL`; independent review rejects non-regression | `suitable for meeting up with a friend` was emitted UNSPECIFIED, not the historical SOFT. This is retained as a new semantic regression, not accepted as an equivalence. |

All three runs finished their bounded investigation and wrote a result plus
evaluator sidecar; none was retried. Total for this post-review batch is 20
actual model calls and 69,806 recorded tokens. It made no real Google/site/
browser request and no external write; its named Google/browser counters are
from the fixed offline source scenario. H001, H005, Live, Gold, Prompt and
fixture changes remain out of scope.

Original-researcher [independent review](SEMANTIC-CONTRACT-INDEPENDENT-REVIEW-2026-09-18.md)
is the authority for the limited manual conclusions above; it does not alter the
automatic evaluator artifacts. The resulting closeout is intentionally split:
H002 party-size supplementation is `CLOSED` but the full case remains `OPEN`;
H003's bounded fixed-source result is accepted for this contract; H004's
current non-regression is not accepted. The next work, if authorized, is a
design decision about a general UNSPECIFIED rule versus retaining the exposed
H002/H004 SOFT expectations—not another model retry.

- H002: [started](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-18T09-59-54-581Z-06987806-0b5b-4ef5-a272-8652f579b911.started.json), [result](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-18T09-59-54-581Z-06987806-0b5b-4ef5-a272-8652f579b911.result.json), [evaluation](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-18T09-59-54-581Z-06987806-0b5b-4ef5-a272-8652f579b911.result.evaluation.17-1789725607943.json).
- H003: [started](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-18T10-00-25-273Z-257f040f-6955-4455-8d81-65aa21f5675e.started.json), [result](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-18T10-00-25-273Z-257f040f-6955-4455-8d81-65aa21f5675e.result.json), [evaluation](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-18T10-00-25-273Z-257f040f-6955-4455-8d81-65aa21f5675e.result.evaluation.17-1789725633377.json).
- H004: [started](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-18T10-00-50-223Z-26367942-0011-4536-ac5d-84297fa0d077.started.json), [result](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-18T10-00-50-223Z-26367942-0011-4536-ac5d-84297fa0d077.result.json), [evaluation](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-18T10-00-50-223Z-26367942-0011-4536-ac5d-84297fa0d077.result.evaluation.17-1789725658944.json).

Artifacts:

- H002 [result](../../.eval-artifacts/party-size-supplement-wire-gate-2026-09-18/party-size-wire-gate-2026-09-18T09-30-33-232Z-6cf6153e-f23f-4432-a8d9-aa7a1e4cfb90/result.json), [plan](../../.eval-artifacts/party-size-supplement-wire-gate-2026-09-18/party-size-wire-gate-2026-09-18T09-30-33-232Z-6cf6153e-f23f-4432-a8d9-aa7a1e4cfb90/plan-reference.json), [ledger](../../.eval-artifacts/party-size-supplement-wire-gate-2026-09-18/party-size-wire-gate-2026-09-18T09-30-33-232Z-6cf6153e-f23f-4432-a8d9-aa7a1e4cfb90/ledger.json).
- H003 [result](../../.eval-artifacts/semantic-strength-contract-2026-09-18/semantic-strength-contract-v20-2026-09-18T09-30-51-464Z-febccc7a-3a33-4031-8916-ce1745e5626f/result.json), [plan](../../.eval-artifacts/semantic-strength-contract-2026-09-18/semantic-strength-contract-v20-2026-09-18T09-30-51-464Z-febccc7a-3a33-4031-8916-ce1745e5626f/plan.json), [ledger](../../.eval-artifacts/semantic-strength-contract-2026-09-18/semantic-strength-contract-v20-2026-09-18T09-30-51-464Z-febccc7a-3a33-4031-8916-ce1745e5626f/ledger.json), and [raw transport records](../../.eval-artifacts/semantic-strength-contract-2026-09-18/semantic-strength-contract-v20-2026-09-18T09-30-51-464Z-febccc7a-3a33-4031-8916-ce1745e5626f/transport-records.json).
- H003 [supplemental semantic review](../../.eval-artifacts/semantic-strength-contract-2026-09-18/semantic-strength-contract-v20-2026-09-18T09-30-51-464Z-febccc7a-3a33-4031-8916-ce1745e5626f/SUPPLEMENTAL-SEMANTIC-REVIEW.json).

## Offline verification

- Focused handler/resolver/compiler/evaluator/current-development composition:
  **74/74 PASS**.
- Focused authorized loopback persistent Web/Runtime regression, including the
  duplicate-message gate and result refresh: **24/24 PASS** (the two H002
  cases are included in that file; no model, browser, Google, source, or
  booking call was made).
- `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check`: PASS.
- Final authorized loopback `npm test`: **449/449 PASS**, 0 fail/skip/todo;
  `npm run typecheck`, `npm run arch:check`, `npm run build`, and
  `git diff --check` also passed on this worktree. The default suite includes
  existing static H005 tests but did not invoke H005 model/fixed-source/Live.

The original research task `01a0a537-ca6c-7981-9c1c-63aba1b61d8a` was notified
with the gate outcome and artifact paths. Independent review is complete with the partial acceptance above; see [the independent report](SEMANTIC-CONTRACT-INDEPENDENT-REVIEW-2026-09-18.md).
