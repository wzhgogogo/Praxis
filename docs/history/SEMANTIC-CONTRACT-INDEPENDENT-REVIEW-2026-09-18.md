# Semantic Contract — Independent Review, 2026-09-18

- Status: REVIEW COMPLETE — partial acceptance; H002 party-size subgoal and bounded H003 accepted, H002/H004 strength non-regression remains open.
- Evidence class: exposed development regression, not a Clean Baseline or Live result.
- Scope: user's H002/H003 semantic-contract plan; H004 non-regression; H005 deferred.
- Implementation report: [Terra's report](H002-H003-SEMANTIC-CONTRACT-CLOSURE-2026-09-18.md).

## Independent findings and disposition

| Finding | Disposition | Evidence |
|---|---|---|
| Handler tests omitted from default test command | Closed: application tests included | `package.json`; independent focused run below |
| Required strength transitions only partially tested | Closed: Proposal/Compiler/intent reducer covers UNSPECIFIED→HARD, UNSPECIFIED→SOFT, HARD→SOFT; preserves unrelated criteria and opposite polarity | Isolated old-identity mutation fails relevant assertions |
| Same-proposal conflicting strengths silently selected by order | Closed: Compiler rejects conflict in either order | Compiler regression and isolated mutation |
| Evaluator changes lacked version bump and paired counterexample | Closed: evaluator/rubric @17; HARD-only mandatory comparison | Restoring old comparison fails UNSPECIFIED↔SOFT review assertion |
| Resolver fail-closed and existing-party protection only checked as patches | Closed for the local persistent composition | Web/PGlite test reaches NEEDS_INPUT on UNKNOWN/failure; preserves existing party; recommendations invoke no supplement |
| Duplicate-request test did not exercise message deduplication; later guard placement had a race | Closed for one application instance: complete authenticated message handling is registered synchronously as one in-flight Promise | Simultaneous submit control passes; deleting guard produces SECOND_RESOLVER_CALL assertion failure |
| Failed model call counted as zero attempts | Closed: invocationCount and responseAttemptCount are separate | Handler failure regression |

Independent reviewer ran 68 focused tests successfully. Two persistent Web/PGlite controls also passed. Final independent `typecheck`, `arch:check`, `build`, `npm test` (449/449, no skips), and `git diff --check` all passed. Loopback execution required the test sandbox exception; no production service was accessed. Earlier test attempts that hit EPERM, hung, or failed fixture setup were not counted as passes. The first duplicate-message mutant survived and was rejected; the final mutant fails on the intended duplicate-call behavior.

Evidence directory: [independent artifacts](../../.eval-artifacts/semantic-contract-independent-review-2026-09-18/).

## Real semantic model gates

- H002: Terra's preserved resolver gate is 8/8. Semantic-arity Prompt v2 remains hash-frozen; only wire/provenance ownership changed.
- H003: original exact-text result is **13/18**, retained unchanged. Independent review accepts **18/18 criterion meanings, polarities, and strengths**. Two H003 outputs say `suitable for a team dinner`; three SOFT controls say `quiet place`. These are faithful paraphrases in those inputs, not strength failures.
- This manual acceptance is a separate [supplement](../../.eval-artifacts/semantic-contract-independent-review-2026-09-18/semantic-review.json), with original result SHA, not an edited automatic score.
- A provider response field `deepseek-flash` does not by itself establish a change from request configuration `deepseek-v4-flash`; record request configuration and returned label separately.

## Fixed-source real-model acceptance

All three ran exactly once after the offline gates. All reached PRESENT_RESULTS with three candidates, but all three original strict automatic acceptances are FAIL. Independent conclusions differ by cause:

| Case | Actual behavior | Independent conclusion | Calls / tokens / runtime |
|---|---|---|---|
| H002 | Primary parser omitted party; supplement invoked once and wrote 2 / INFERRED_CLOSED_PARTY. Three matching Saturday 18:30 slots presented. First-date strength became UNSPECIFIED instead of frozen SOFT. | Party-size subgoal CLOSED for this slice; full case OPEN due to strength regression. | 9 / 29,020 / 13.350 s |
| H003 | Team dinner/drinks UNSPECIFIED; budget/private room SOFT. Retrieval used preferences; three matching 10-person slots within 17:30–22:00 presented, without claiming unproved preference satisfaction. | Bounded fixed-source result ACCEPTED by independent review. Original AUTO remains NOT_EVALUATED/FAIL because of the faithful team-dinner paraphrase. | 4 / 19,411 / 8.095 s |
| H004 | RECOMMENDATION, cafe HARD, appropriate opening facts, no availability claim, supplement calls 0. Main parser independently inferred 2. Meeting-friend strength became UNSPECIFIED instead of frozen SOFT. | Recommendation execution works; required strength non-regression FAILED. Previous historical CLOSED record does not close this new run. | 7 / 21,375 / 8.711 s |

The [fixed-source review record](../../.eval-artifacts/semantic-contract-independent-review-2026-09-18/fixed-source-review.json) preserves original artifact paths and hashes, actual criteria, actions and resource counts. Original evaluations were not rewritten.

### H002 evaluator attribution

The original evaluator also reports missing negative HARD evidence and non-applicable observation lineage. Inspection found candidate-bound, cited negative judgments and matching inventory in the execution. Its actual HARD labels faithfully retain the user's original wording, while Gold abbreviates them (`hot-pot restaurants` versus `hot pot restaurant`, and the full Sichuan/Hunan exclusion versus its shorter label).

An [isolated in-memory diagnostic](../../.eval-artifacts/semantic-contract-independent-review-2026-09-18/h002-label-diagnostic.json) changes only those expected label strings after manual semantic review. REQUIRED_EVIDENCE then becomes SATISFIED and all four executed observations become applicable. This localizes the automatic evidence/lineage failure to label comparison. It does not change production Gold, the original artifact, its score, or the SOFT→UNSPECIFIED disagreement; it is not a new PASS.

## Resource and scope closure

- Three fixed-source runs: 20 actual model calls, 69,806 recorded tokens; no retries.
- Including the 8-call resolver and 18-call strength gates: 46 calls, 188,260 recorded tokens for this slice, excluding earlier historical experiments.
- Source provenance is SYNTHETIC_CONTROL with fixed transports/pages. Google/website/availability counters in these artifacts count fixture operations, not external website requests.
- No H001/H005 targeted run, Live website access, booking, commit or push. Existing offline H005 regression tests ran as part of the default suite; H005 semantic expectations and fact-judgment code were not changed.

## Remaining decision and stopping point

The new general policy says unmarked occasion preferences are UNSPECIFIED, while the requested frozen H002/H004 expectations still require SOFT. These runs expose that policy/expectation tension. Do not classify the strength changes as mere wording equivalents, add per-case prompt exceptions, or silently change Gold. Resolve the intended contract before further prompt/model iteration. The H002 automatic HARD-label/lineage comparison also remains a separately identified evaluator limitation.

This review stops at the authorized bounded experiment. Fixed synthetic sources establish the observed model/composition behavior; they do not establish current website access, inventory, or long-term reliability. No whole-suite semantic closure or Live improvement is claimed.
