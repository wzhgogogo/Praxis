# G1 real-model evaluation report

Status: completed execution; current exposed development evidence, awaiting independent reviewer and user decision. Not G1 acceptance and not Live. Vienna CET (UTC+1), 2026-10-28.

## Result and limits

All 34 reviewer-confirmed questions were executed three times (102/102 trials), serially, with unchanged main Runner/G1 core, questions, references and scorer. Evaluated code: `b9ee3d3e69ec5240229c91637c965241330f9ef7`, based on B-integrated main `6fa60cda8367f006260f3c16c0a7e4dbfd9dd00e` containing reviewed B dc486430. C integration arrived after this batch was frozen; no mid-batch rebase. The historical adapter `coreRef=e4829a58` is lineage metadata, NOT the evaluated checkout; actual codeRef and frozen current core bytes identify this run.

87/120 real provider attempts (deepseek-flash),85 responses,2 TIMEOUT transport failures; no schema retries or added transport attempts. Fifteen wrong-outlet/old-run trials were rejected before the provider. Every attempted provider request has its own shared-ledger id and start record; original concurrent ledger entries remain unchanged. Website/Google/public GET/Live/environment reruns all0. Only Node runner `--env-file` loaded the user-authorized credentials; no credential file inspection, copying, printing or staging. API POST transport is restricted to the existing DeepSeek endpoint; local Chromium scripts/service workers and all network are disabled.

Fixed scorer@4: **18 PASS /24 FAIL /60 NOT_EVALUATED**. This is not18/102 semantic correctness.76 outputs use wording outside the frozen exact answer/limitation expressions and require independent review; some also have an explicit failure. References and scoring rules were not expanded after seeing outputs. Automatic detected false claims0, but the complete automatic count is **NOT_EVALUATED** (76 unknown claim counts). Codex sequential source-grounding triage found0 false claims; that is provisional and does not replace the independent reviewer or establish final S0=0.

[Every trial, answer and scoring reasons](per-trial.md) · [full citations/metadata/timing/triage](per-trial.json) · [machine summary](summary.json) · [raw execution directories](results) · [raw-result SHAs](results-sha256.json).

## Requested measures

| Measure | Result and denominator |
|---|---|
| Core final statuses | ANSWERED50, NOT_STATED29, UNVERIFIED23, total102 |
| Explicit `页面未说明` question type | 23/24 correct NOT_STATED (95.83%); Q20-r2 transport failure remains in denominator |
| Frozen scorer not-stated dimension |29 PASS /4 FAIL /69 N/A;4 failures are Q20-r2 and Q27×3; related ANSWERED alternatives are N/A |
| Reference kind NOT_STATED, including reviewed alternatives |32/36 allowed outcome statuses (88.89%); Q28 related ANSWERED3 included; this status measure alone is not full-answer acceptance |
| Category on classified core outcomes |76/79 correct;3 false ALLERGY classifications on vegan Q14;23 UNVERIFIED outcomes have no category contract |
| Confirmation flag on classified outcomes |76/79 correct;same3 Q14 false positives |
| Sensitive questions Q28/Q29/Q30 |9/9 correct category and confirmationRequired=true;no positive allergy/halal/accessibility suitability guarantee found in delivered answers |
| Visible confirmation prompt |NOT_EVALUATED: approved Runner invokes the bound-page core, not Agent/Web display. Core flag and any actual answer text are recorded separately |
| UNVERIFIED reasons |NO_BOUND_PAGE15, INVALID_MODEL_OUTPUT6, MODEL_FAILED2 |

The null core NOT_STATED answer is rendered by the scorer into a canonical label; many historical Chinese reference sentences do not exactly match it. No new approved paraphrases were added. Q28 negative wording and Q26-r2 confirmation wording also miss fixed regexes; frozen FAIL labels remain.

## Four-layer assessment and failures

1. End result:102 core trials completed, including two bounded model transport failures.18 exact scorer passes,24 failures and60 pending wording judgments. This evaluation uses saved pages and locally constructed same-run/outlet binding; it does not certify production identity resolution, Agent/Web follow-up integration, fresh websites or booking availability. No real website/Live result is claimed.
2. Steps:Q21–Q25×3 all PASS and no model invocation: wrong branch, similar name, and old run pages refuse as NO_BOUND_PAGE. All evaluated citation literals are independently checked against same saved source bytes/read ids; no cross-page quote mismatch was detected. Content truth and full answer consistency remain separately pending where the scorer says unknown.
3. Severity:No false claim was detected automatically or in provisional per-trial source triage; final claim total remains unassessed pending independent reviewer. Missing required quotations/caveats, wrong category, wrong language and inability to answer are retained as quality failures/gaps, not converted to correct delivery. No site request occurred.
4. Attribution from actual request/response records:Q20-r2 and Q33-r2 are gateway TIMEOUT (one8-second request each).Q27×3 model cites a statement explicitly tagged USER_REVIEW; core rejects it. Q31×3 quotes only the43-character final sentence inside an186-character source statement; the complete-statement contract rejects it. These are direct recorded contract violations, not inferred from final code alone. Q14×3 misclassifies vegan as ALLERGY. No production or prompt repair was attempted.

Quality details:

- Q06-r2 omits the required Japanese10% service-fee quotation; Q09×3 omit hours-change notice; Q10×3 cite alternative observed preference wording instead of the required reference sentence. All seven required-quote failures stay FAIL.
- Q26×3 cite both conflicting English-all-lunch and Japanese-course-only statements. r1/r3 omit restaurant confirmation and add an explicitly Japanese-attributed non-course inference; reviewer should assess ambiguity. r2 quotes the original confirmation notice and says to check with the restaurant, but the frozen expression requires a different form. All remain FAIL.
- Q28×3 quote Allergy information available and explicitly say it does not state a severe-peanut safety guarantee; category/flag correct. The exact limitation expression misses that wording, all remain FAIL.
- Q07×3 and Q33-r1/r3 answer in Japanese despite English questions. Facts are source-supported; language defect separately retained.
- Q02-r3 adds truthful QR-payment nonacceptance found in the same merchant table but does not include that statement among its three citations. Citation-coverage gap retained.
- Q27×3 and Q31×3 fail closed rather than delivering; this does not satisfy the corresponding answer expectation.

## Verification and audit

Frozen59-file manifest verified unchanged, including34 single-question subsets that preserve original question/page metadata and all8 source pages. Original34 questions, reviewer answers and scorer have zero diff from evaluated main. Original `.candidate` history unchanged. [Freeze](inputs-sha256.json), [slice/stop rules](plan.md), [serial launcher](run-slot.py), [aggregation only](summarize.py). Raw started/finished UTC stamps are preserved as machine evidence; report times below are CET.

On frozen b9ee3d3e, five gates all PASS, each pre/post git status empty: typecheck0.766s, arch0.358s, npm test1168/1168 in32.544s, build0.604s, Chromium175/175 in108.975s. [Gate receipts/raw compressed logs](verification). Fixture wrapper control exercised execute→independent score with zero real calls; initial short-id filename failure was fixed before paid calls and retained. Canned Q01 NOT_STATED is intentionally a quality FAIL, not a model capability claim.

The first automatic approval retry failed because review-service usage was exhausted; the command was NOT executed. After user asked to continue, the same approved action passed review and resumed Q26-r2. No approval bypass or duplicate dispatch occurred.

## Test-suite review dependency

Separate task remains **NOT_STARTED**: the user's trigger is B beginning G3. Latest read-only B snapshot still ends after B main publication, waiting for C; no G3 turn is present. C main integration is now visible; the G3-start dependency is still pending. No tests have been removed or edited. Once B starts G3, inventory actual then-main default/Chromium cases and durations, exclude B-owned G3 private-logic tests, propose per-test retain/merge/delete reasons and exact replacements; submit that list before edits. The count/time reduction criterion has not been met or claimed by this evaluation batch.

Execution time window: **2026-10-28T06:18:21.327000+01:00 → 2026-10-28T08:22:04.408000+01:00**. Sum of102 core-process execution durations 344.651s (median 3.445s);85 successful model response latencies total 218.537s (median 2.554s). These exclude external per-trial triage gaps and scorer/browser processes; timestamps are saved per trial. First usable result/display timing is N/A for this single-page core Runner. No totals are relabelled as Agent task latency.
