# Live repair Playbook independent review

- Status: Accepted — bounded offline corrections; overall Playbook incomplete
- Document revision: 1.1
- Last updated: 2026-09-24
- Review baseline: `57017b6..f4bf46a`; A1 at `57017b6` inspected as context
- Evidence class: exposed development / synthetic offline counterexamples; not Live acceptance
- Scope: independent review of A–F implementation and evidence, followed by corrections in the original implementation task

## Initial verdict

The implementation follows small, separately recorded loops and preserves failed experiments. A2/A3 local identity wiring and B1 Tokyo discovery have bounded supporting evidence; their records correctly leave external and end-to-end gaps open. D1 was reproduced and its unsafe prompt candidate rolled back; D2/D3 are not accepted. E2 was not executed after an external-data approval rejection. These distinctions are appropriate, but the claimed C1 and E1 mechanisms and public resource evaluator need the corrections below before local acceptance.

Independent baseline run: TableCheck, Tabelog, Action Validator and diagnostic evaluator tests **142/142 pass**, no skips/todo. This existing green result does not cover the counterexamples below.

## Findings returned to the implementation task

| Finding | Independent evidence at review baseline | Required correction and proof |
|---|---|---|
| P1 — in-flight reads consume the delivery reserve | Coordinator opens the window only at the next loop iteration. A read started with 46 seconds remaining can consume the hard deadline, preventing any subsequent `PRESENT_RESULTS`. The existing test starts with ready State and exactly 45 seconds remaining. | Production composition must first produce eligible evidence, then encounter a slow read across the reserve boundary and actually present before the hard deadline. Align absolute deadline enforcement and window lifecycle; retain full-batch, explicit-count, cancellation and expired-evidence controls. |
| P1 — current form values can be combined with stale inventory | Direct parser counterexample: live form is 2026-09-25 / 10 people; complete slot section explicitly belongs to 2026-09-24 / 2 people. Request confirmation returns true and slot parser returns 19:00 with `queryComplete:true`; the Adapter then combines them. | Bind the completed result to the applicable request, reject stale/unbound/loading results, and retain a positive asynchronous update control through the Adapter. Synthetic result attributes do not prove current website support. |
| P1 — Japanese booking form bypasses live-control protection | Entrance resolver accepts `/ja/shops/.../reserve`, while the form guard only recognizes English or unprefixed paths. A stale HTML request can fall through to guide/link confirmation despite contradictory current controls. Original implementation task reproduced 10→9 false acceptance. | Apply the same current-control rule to all already accepted form paths, without expanding source trust. |
| P2 — total model-call ceiling omitted | Independent synthetic artifact declares `maxModelCalls:1`, contains two invocation records, and remains `RESOURCES=SATISFIED`. The evaluator checks browser calls and Agent steps but not total provider calls. | Check the current Runner's total sent-call accounting including failures/timeouts; missing evidence stays unverified, while an independently known overrun is not masked by another missing field. Preserve historical artifacts. |

## Review boundary

No paid model, live website, Google, private Holdout or booking operation was used for these corrections. Real Chromium runs used intercepted local fixtures and temporary profiles. Review does not authorize another attempt at the previously rejected E2 data transfer. Another task's uncommitted H003 native-discovery experiment is outside this implementation diff and remains intact. No commit or push was performed for this review.

## Correction review

- Delivery: the coordinator now rechecks the current State and absolute deadline after model decisions, bounds subsequent reads at the delivery reserve, and records the interruption reason in the trajectory. Expired windows may reopen; active windows cannot be reopened. A controlled production composition produces qualified evidence before encountering a slow source or a decision crossing the window; both variants actually execute `PRESENT_RESULTS`. It uses model/provider replacements and does not prove real-model choice or live source behavior.
- TableCheck: English, Japanese and unprefixed reservation forms share the current-control check. Form inventory uses the existing exact-request, same-outlet slot-link evidence; the proposed synthetic `data-date`/`data-pax` production format was rejected during review and removed. Stale, loading, unbound, empty-without-window-proof and out-of-window observations cannot create an Offer.
- Resources: Evaluator/rubric@21 checks total model starts against `maxModelCalls`, retains incomplete historical accounting as unverified, and lets a known overrun remain a failure even when another field is missing. The Runner captures its existing started-call counter on success and failure; historical artifacts are unchanged.
- Independent root rerun after these changes: **185/185** across TableCheck, Tabelog, Action Validator, diagnostic evaluator and Hybrid composition; zero failures/skips/todo. The real Chromium asynchronous control also passed independently: old inventory remains in the DOM, one bounded scripted WAIT allows a current same-outlet request link to appear, and the Adapter produces AVAILABLE. Its initial `assert.fail` on any browser decision was an invalid fixture constraint and was replaced without relaxing production acceptance. Root's initial Chromium launch was sandbox-blocked; the same local-only test passed after permission escalation.
- Implementation-task gates inspected: default suite **526/526**, typecheck, architecture check and build passed. `git diff --check` passed. These results close the four identified mechanisms within the tested offline scope; they are not an E2 or full Live verdict.

## Remaining product acceptance

A3 real-source entry, B2 broader discovery, actual C inventory success, D1 repair with D2/D3, E2 real-model routing and applicable full Live cases remain separate gates. This correction review does not close the whole Playbook or authorize new external calls.

## Follow-up D1–D3 review (offline)

The user subsequently requested continuation. Fact-judgment Prompt@10 distinguishes explicit excluded-category evidence, explicit source denial, and insufficient evidence; a different primary cuisine cannot by itself prove either conflict or satisfaction. The implementation preserves source-grounded entity knowledge and adds six predeclared real-model controls, including grounded and ungrounded McDonald's identities. Root required separate raw-output/citation/conversion checks for the explicit-denial control because the frozen category scorer supports only conflict and category-unknown outcomes. The frozen matrix and Gold remain unchanged. Real-model execution is pending explicit external-data authorization; mocked correct outputs do not prove that Prompt@10 fixes the model error.

D2 extends the existing production-composition regression to the observed plural/hyphenated exclusion, raw `hot_pot_restaurant` among Google types, and a different `primaryType`. The type conflict reaches State, excludes the candidate from legal availability reads, and avoids its downstream model fact work while a normal candidate is presented. Root independently reran that control: **1/1 passed**. This validates the already implemented general plural handling, not a new real Hyoki visit.

D3 adds a bounded preference in Agent Prompt@18 to complete still-readable facts for a candidate with current request-matching inventory. It does not add a ranking engine or override legal actions. A scripted-model source/Runtime composition takes that path and presents three supported results; real-model planning remains unverified. Root independently ran the fresh-inventory/source-conflict and failed-refresh subset: **6/6 passed**, including the existing source-specific invalidation controls. D1 judgment/conversion and category scoring tests separately passed **14/14**. These overlapping targeted subsets are reported separately, not summed as unique coverage.

The [E2 follow-up protocol](H001-DELIVERY-WINDOW-2026-09-24.md#follow-up-review-evidence-required-before-e2-acceptance) now explicitly requires the short-batch reserve precondition and an actual Runtime presentation; a model suggestion or ordinary full-batch success is insufficient. No new paid or external operation was performed during this follow-up review.
