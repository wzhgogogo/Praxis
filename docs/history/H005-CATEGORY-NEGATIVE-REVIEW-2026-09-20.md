# H005 eval contract and category-negative review — 2026-09-20

- Status: frozen regression / exposed development evidence; original Prompt@7 failure retained; Prompt@8 follow-up accepted
- Document revision: 1.1
- Contamination: PROMPT_AND_RESULT_EXPOSED; not a Clean Baseline
- Authority: [ADR-0030](../decisions/0030-restaurant-category-negative-eligibility.md), [acceptance@3](../../src/eval/restaurant/agent-loop/cases/README.md)

## Historical Prompt@7 outcome by phase

| Phase | Actual outcome |
| --- | --- |
| 1 — result count contract | Accepted offline. Default target 3 remains a Runtime search objective; 1–2 independently qualified results after legal reads exhaust may pass. User-explicit counts remain hard. Historical two-result H005 was re-evaluated without changing its execution artifact. |
| 2 — category exclusion | Offline wiring passed; real-model gate **FAILED 14/16**. F8 grounded McDonald's was wrongly UNKNOWN twice and was admitted as category-unknown. Cannot claim known fast-food venues are reliably excluded. |
| 3 — H005 fixed-source | **NOT RUN** because Phase 2 failed; no new H005 execution or success claim. |
| 4 — offline code gates | typecheck, architecture check, build and full npm test **483/483** passed; diff check passed. These checks do not override the model gate. |

## Implemented behavior and boundaries

Acceptance requires a nonempty distinct presentation, successful execution and independent required dimensions. Default batch target is separately reported as target/actual/met. A USER_EXPLICIT registration must agree with authoritative requestedResultCount and exact fulfilled count. The early-short-batch Validator gate, bounded investigation, right-now, party size and availability remain unchanged.

Prompt@7 / fact-judgment schema@2 adds model-reported scope. Only category/type UNKNOWN with cited raw type facts can produce categoryUnknownNegativeCriteria; it does not become verifiedNegativeCriteria or a confirmed non-fast-food claim. Runtime and independent evaluator@19 separately require current, same-candidate raw type evidence and source identity. Known conflicts still block; positive HARD and non-category negatives remain fail closed. No brand/cuisine map or H005 production branch was added.

Review caught and corrected the scorer accepting wrong scope/unsupported citations, an entity-conflict branch dropping broad raw facts, opaque source IDs masquerading as entity names, missing real composition coverage, and empty/blank raw type facts being accepted. The raw-type negative controls failed at the intended Validator/evaluator assertions before the blank-fact correction and pass after it. Earlier incomplete implementation reports are not completion evidence.

The local-food paragraph exactly matches the pre-task successful Prompt@6 artifact, including the final sentence; SHA256 `49c15a0186b7917a56d096ee1cc03c53f25018164f0779b8f2309b352db63193`. Gold, raw H005 user text, source scenario and availability fixtures were not changed. Production snapshot hashes remained unchanged throughout the paid matrix.

## Real-model matrix evidence

F1–F8 × 2: exactly 16 provider attempts, 16 unique invocation records, zero retries; 32 dispatched/settled journal records were independently compared with requests and raw outputs. All 16 requests used the frozen Prompt@7/schema@2; F7 was actually invoked. Model configured as deepseek-v4-flash, returned model deepseek-flash; 20,618 total tokens, 13,792 ms summed provider latency. This is real-model + synthetic fixed evidence, not Live or a clean holdout.

| Inputs | Expected | Observed |
| --- | --- | --- |
| F1 fast-food; F2 quick-service | CONFLICT | 4/4 CONFLICT, violation evidence accepted |
| F3 Japanese; F4 ramen; F5 sushi; F6 conveyor-belt sushi; F7 generic restaurant | UNKNOWN | 10/10 UNKNOWN, category-unknown accepted without verified-negative claims |
| F8 source-grounded McDonald's + generic restaurant type | CONFLICT | **0/2; both UNKNOWN**, category-unknown accepted |

F8's raw request contained `groundedEntity: "McDonald's"`, produced from the fixture's same-source HIGH identity, and `restaurantTypeFacts: ["restaurant"]`. No fast-food classification was prefilled. Both raw responses were valid and correctly cited the observation; this is a model interpretation failure, not transport, omitted entity context, parsing or scoring failure. Generic restaurant type + grounded entity must be handled distinctly from an ungrounded candidate name. The current prompt's name/inference restrictions competing with its grounded-entity allowance are a plausible cause, not a proven causal diagnosis.

- [Frozen manifest and budgets](../../.eval-artifacts/h005-2026-09-20-final-verification/frozen-manifest.json)
- [Raw matrix artifact](../../.eval-artifacts/restaurant-category-negative-fact-judgment-matrix-v1/2026-09-20T11-35-33-492Z-e1339d75-20e2-4331-8710-1d033e80a27c.result.json)
- [Independent per-run review](../../.eval-artifacts/h005-2026-09-20-final-verification/matrix-independent-review.json)

## Offline behavioral evidence

| Failure type | Entry and expected behavior | Evidence / limit |
| --- | --- | --- |
| Default target incorrectly treated as user count | fixed-source-acceptance.test.ts; current-development-offline.test.ts | E1–E6 and explicit-two control; true Interpreter/Compiler/Runtime/evaluator/acceptance path for explicit counts; old H005 artifact re-evaluated offline. |
| Early short batch while legal reads remain | action-validator.test.ts | Two qualified candidates rejected before read exhaustion, allowed afterward; original production gate unchanged. |
| Unknown category accidentally becomes a verified negative | model-fact-judgment.test.ts; hybrid-read-composition.test.ts | Real internal composition reaches PRESENT_RESULTS with category-unknown and no verifiedNegativeCriteria; independent evaluator accepts cited evidence. |
| Empty raw evidence certifies category eligibility | action-validator.test.ts; diagnostic-evaluator.test.ts; hybrid-read-composition.test.ts | Missing/empty/blank type controls rejected. Raw-type removal from an actual composition artifact prevents independent YES / REQUIRED_EVIDENCE SATISFIED. Red/green logs retained. |
| User's new exclusion lost after presentation | hybrid-read-composition.test.ts | Two parameterized real internal compositions: initial UNKNOWN → PRESENT_RESULTS; explicit No ramen / No conveyor-belt sushi with currentDraft → fresh source read → CONFLICT → NO_VERIFIED_RESULT. No hand-written intermediate State/fact-port stub. |
| Unsupported citation, scope, positive support or grounded entity | model-fact-judgment and category-matrix scoring tests | Independent scorer rejects wrong scope/support; positive fail-closed preserved; generic entity conflict needs same-source HIGH source-stated name, not an opaque ID. |

The multi-turn tests replace only model transport and Google HTTP. They prove explicit-message wiring, not real-model pronoun resolution for “这种也算快餐”, current websites or general dialogue quality. The weaker criteria-only test was replaced. Existing matrix, acceptance, source-composition and evidence tests were extended rather than introducing a new test framework.

Full npm test first ran inside the sandbox: 462 passed and 21 localhost-listen EPERM failures. After permission to use loopback, the unchanged suite passed **483/483**, no skip/todo. [Full passing log](../../.eval-artifacts/h005-2026-09-20-final-verification/npm-test-loopback.log). No .env or paid calls were used by offline tests. No live Google/browser restaurant source, booking, commit or push was performed.

## Bounded next step — not executed

Keep the failed run immutable. Propose only a general clarification that observation.groundedEntity is a source-stated entity bound to the cited raw fact and HIGH identity, unlike candidate.name, and may support stable category knowledge even when the type label is broad. Do not insert a brand table, prefill fast food in F8, change expected outcomes or edit local-food text. Freeze a new prompt candidate and explicitly authorize its next 16-call matrix budget before running again; only a passing matrix permits the still-unrun one-shot H005 stage. No additional model calls or production prompt edits were made after the failed matrix.


## Follow-up: why grounded McDonald's returned UNKNOWN

The failing layer is Fact Judgment's model output. Both F8 requests include observation.groundedEntity = McDonald's, attached by code only after same-candidate, same-provider/sourceEntityId, HIGH identity matching. Both provider responses finish with TOOL_CALLS and 86 output tokens under the 320-token limit, and directly return UNKNOWN; no timeout, truncation, parse failure or application fallback produced the label.

The prompt contains competing directions: “CONFLICT means the prohibited type is stated”; “UNKNOWN means the facts are broad or insufficient”; and an unqualified prohibition on inference from “a venue name”. Its final sentence permits stable knowledge about a grounded entity but does not define observation.groundedEntity as a verified source identity distinct from candidate.name, or explicitly permit its category inference when concreteTypeFacts is false. F8 combines restaurantTypeFacts = [restaurant], concreteTypeFacts = false and the verified entity name. This makes a literal-type-only UNKNOWN interpretation plausible even though it violates the intended entity-knowledge allowance. This is an identified instruction/interface ambiguity, not proof of the model's internal causal reasoning.

An offline six-control replay (two original F8 requests × original UNKNOWN, counterfactual CONFLICT, and CONFLICT without identity) reconstructs requests exactly. Original responses become categoryUnknownNegativeCriteria; changing only the saved raw outcome to CONFLICT produces violatedNegativeCriteria; removing HIGH identity prevents accepting that generic-type conflict. This isolates the model interpretation from the downstream acceptance code. Counterfactual responses are synthetic controls, not new real-model results. See [offline replay](../../.eval-artifacts/h005-mcdonalds-diagnosis-2026-09-20/offline-replay.json).

No production/prompt/Gold changes, new model calls or Live calls were made in this diagnosis. A controlled prompt comparison would still be needed to establish which instruction change corrects the real model behavior.


## Prompt@8 follow-up and commit integration

The user separately authorized a minimal groundedEntity permission clarification and the unchanged F1-F8 x2 matrix in Terra worktree 1135. The first Prompt@8 attempt (12:32 UTC) had network failures and remains an infrastructure failure record. After the user authorized network diagnosis and rerun, the 12:37 UTC run completed with **16/16 PASS**, exactly 16 provider attempts and zero retries. F1/F2/F8 were CONFLICT (6/6); F3-F7 were UNKNOWN (10/10). Both F8 inputs still contained only `["restaurant"]` as type facts, with same-source HIGH-grounded McDonald's identity. No brand table or fixture fast-food fact was introduced.

[Prompt@8 matrix](../../.eval-artifacts/restaurant-category-negative-fact-judgment-matrix-v1/2026-09-20T12-37-28-674Z-7b2f0b07-7892-4225-bfa1-93469789dfc8.result.json), SHA256 `e7ac796136faf6d98d1efc02a3ac766fe635f8706ad5eaa76e6c7178f11c5400`. Independent integration review checked all 16 raw judgments, cited observation IDs, category scope, expected outcomes, absence of verified-negative promotion and exact system-prompt equality with the integrated source. The local-food paragraph still has SHA256 `49c15a0186b7917a56d096ee1cc03c53f25018164f0779b8f2309b352db63193`.

After this passing gate, the user requested one H005 fixed-source run at 12:47 UTC: AUTO PASS, three candidates, eight model calls. The later user-requested H001-H005 batch at 12:50 UTC also produced three candidates each. H001/H005 passed automatically; H002-H004 passed bounded independent semantic review while keeping original automatic FAIL / NOT_EVALUATED. See [five-case comparison](FIXED-SOURCE-SEMANTIC-COMPARISON-2026-09-20.md). Phase 2 and Phase 3 are therefore complete for this fixed-source scope; the earlier unrun/failed statements above describe the immutable Prompt@7 checkpoint only.

Commit preparation integrated the four final source/test changes from worktree 1135, including stricter second-user-message transport and currentDraft assertions. All 138 tracked non-test src files match that worktree byte-for-byte. Its stale .env.example was not imported. Saved matrix and fixed-source artifacts were copied byte-for-byte into ignored local artifact storage with collision checks, leaving originals unchanged. [Integration manifest](../../.eval-artifacts/h005-commit-verification-2026-09-20/integration-manifest.json) records file hashes and checks.

Final integrated verification: typecheck, architecture check, build, full offline npm test **483/483**, no skipped/todo, and diff check PASS. The full suite used authorized loopback permission for local HTTP tests. Logs are in [.eval-artifacts/h005-commit-verification-2026-09-20](../../.eval-artifacts/h005-commit-verification-2026-09-20). No new paid-model, real-source, private-holdout or booking calls were made during integration. This is exposed fixed-source evidence, not Live, a Clean Baseline or a general model-success-rate claim.
