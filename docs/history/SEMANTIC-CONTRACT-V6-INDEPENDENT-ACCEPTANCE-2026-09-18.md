# Semantic Contract @6 — Independent Acceptance, 2026-09-18

- Status: CLOSED for the authorized H002–H004 exposed fixed-source semantic slice.
- Mode: real model + fixed synthetic sources; not Live, Replay or a Clean Baseline.
- Baseline: `a66ef8a`; current candidate remains uncommitted.
- Implementation: [Terra report](SEMANTIC-CONTRACT-V6-IMPLEMENTATION-2026-09-18.md).
- Independent machine-readable review: [final-review.json](../../.eval-artifacts/semantic-contract-migration-independent-review-2026-09-18/final-review.json).

## What was accepted

Development@6 migrates only H002 first-date and H004 meeting-friend suitability to UNSPECIFIED. Prompt@21 keeps an expressed tradeable preference as SOFT while omitting bare absence-of-restriction meta-language. Evaluator/rubric@18 evaluates Gold-to-authoritative-intent semantic fidelity separately from authoritative-intent-to-source grounding. Different wording remains subject to independent review, never fuzzy automatic acceptance. Existing exact polarity, HARD-strength, request, identity and evidence checks remain.

The first pre-review rejected a text-only comparison Map and a purported multi-turn control that only assembled scorer input. Terra corrected both. The final integration enters the actual Hybrid Interpreter/Compiler/Runtime and source composition: first nonblocking turn presents, the second HARD turn clears old evidence and presentation, missing new HARD support causes PRESENTATION_EVIDENCE_MISSING, and a paired new cited-support path presents successfully.

## Independent checks

- Focused evaluator + actual fixed-source composition: **59/59 PASS**.
- Isolated restoration of the rejected text-Map comparer: identical opposite-polarity control fails at the intended semantic assertion; current control passes.
- Isolated Runtime mutation retaining old readEvidence: both two-turn controls fail at the intended old-evidence reset assertion; current controls pass.
- Initial identity mutation probe matched no named test and is excluded. `identity-final-*` is the valid detection evidence.
- Original H002 artifact SHA remains unchanged. Re-evaluation shows valid actual-label evidence SATISFIED while semantic fidelity stays NOT_EVALUATED; wrong party and stale weak-request observations still reject. Missing support cannot pass.
- Terra completed typecheck, architecture, build and full default **455/455** gates. Independent focused/mutation checks above supplement those logs; the full suite was not redundantly rerun by this reviewer.

Evidence: [independent directory](../../.eval-artifacts/semantic-contract-migration-independent-review-2026-09-18/).

## Three one-shot real-model results

| Case | Independent semantic and behavioral review | Calls / tokens / duration |
| --- | --- | --- |
| H002 | Accepted. Primary parser omitted party; one supplementary call obtained 2/INFERRED_CLOSED_PARTY. First-date UNSPECIFIED, approximate budget SOFT, both restaurant-type exclusions NEGATIVE/HARD. Three distinct Saturday 18:30/2-person results have cited same-candidate type judgments and slots. | 9 / 28,922 / 8,814 ms |
| H003 | Accepted. Team dinner/drinks UNSPECIFIED; approximate budget/private room SOFT; 10 people and Friday after-work 17:30–22:00 preserved. Three slots at 19:00/19:30/20:00. Preferences retained in retrieval without unsupported satisfaction claims. | 4 / 19,518 / 6,727 ms |
| H004 | Accepted. Cafe HARD, meeting-friend UNSPECIFIED, recommendation goal and same-day afternoon preserved. Main parser inferred 2; no supplement. Three cafe recommendations have cited type and applicable opening facts; no reservation availability claim. | 7 / 21,405 / 6,461 ms |

All three met the recorded three-distinct-restaurant batch target. Total: **20 model calls, 69,845 tokens, 22,002 ms**; no additional real-model reruns, real Google, website or browser calls.

### Why independent acceptance differs from raw automatic acceptance

All three original automatic acceptances remain **FAIL**, with AUTHORITATIVE_CONDITIONS / FINAL_CLAIM / COMPLETION_OUTCOME NOT_EVALUATED. REQUIRED_EVIDENCE, INVESTIGATION_BEHAVIOR and RESOURCES are SATISFIED. No original evaluation was rewritten.

Independent review accepts these specific wording differences after comparison with the user input:

- H002 `suitable for a first date` preserves first-date suitability; `hot-pot restaurants` preserves the excluded type; the longer Sichuan/Hunan spicy-main-focus wording faithfully retains the full original exclusion rather than banning every spicy dish.
- H003 `suitable for a team dinner` preserves team-dinner suitability.
- H004 `suitable for meeting up with a friend` preserves meeting-friend suitability.

The original input SHA was checked against the frozen/current unchanged user content. Full parsed Proposals, final state, actual actions and cited evidence were inspected. These are human-reviewed passes for this bounded slice, **not AUTO_PASS or automatic general semantic equivalence**.

## Final migration detail and limits

The two YAML `acceptance.review` sentences still used historical SOFT wording after the runs. They were corrected after preserving the exact run-time YAML at SHA `75bf64732a9148720bb3d448c3fd53326195e8d7517d8689f80cec63e34df12b`. The current documentation-only YAML SHA is `00b69476e6d07eec5dcd9a657555c4e3766629fce5f8e630512710252886ffb6`. User content, machine semantic expectations, production code, fixture responses and original artifacts did not change; no rerun was needed.

The runner did not retain complete provider response text/messages (`outputText: null`). This limits transport-level reconstruction, but the complete saved structured Proposals, authority state, unchanged input hashes and source lineage suffice for this semantic review. No missing raw response was invented. Flexibility wording was checked as a prompt contract; the three authorized cases do not constitute broad real-model flexibility/generalization testing.

H005 remains untested in this slice. Its dedicated fact semantics and immediate-time workflow are the next work item, not silently started here. H001/website Live reliability, full arbitrary-query semantic quality and preference ranking are not closed by this report. No commit, push, reservation or external write occurred.
