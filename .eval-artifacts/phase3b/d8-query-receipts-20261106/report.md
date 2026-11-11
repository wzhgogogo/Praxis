# D8 query receipts / D4 follow-up: offline candidate

Status: draft / not integrated. 2026-11-06 CET UTC+1. Review baseline985f456e; initial product/model-input freeze8458522f. No merge or new Live.

## Delivered offline change

Named source search binds only the current read's admitted same-origin GET document receipt to the current document: origin/path, full field-value-hash multiset and normalized authoritative query all match. It no longer depends on the visible input name. Conflicting parsed-result query values remain rejected. Landing on an individual parsed result cannot complete the list query. No Guard admission, source identity, timeouts, detail caps or global prompt/State/schema versions changed. Per-read objective ends at the result LIST; adapters inspect identities.

The actual D8 source scripts generate the hidden-field receipt in real Chromium. The recorded result observation contains W2 as the first relevant link. Original executor fails OBSERVED_QUERY_UNBOUND; repaired executor completes the recorded list-observation component. Important scope: snapshot9 is UNSAFE_DOCUMENT and absent from HAR. The test does not manufacture its HTML/response: it uses recorded text/links with the parser replaced for that component. It does not claim a full candidate-identity replay. Initial setup failures caused by the missing result HAR are retained separately from the valid original-code red.

TableCheck original plan: Google name Nakamata; one existing fragment callback; no Japanese phase for this source; full authoritative target was not propagated. On this Live the first45s provider window expired before the fragment callback. The Destination label includes restaurant, so the original choice was not proven to be a wrong control (correcting the earlier D8 report). Tabelog's original/fragment/Japanese sequence stopped at the ORIGINAL query-binding failure, before any adapter identity check. Three COMPLETE rejections were query-binding failures, not identity refusals.

TableCheck now gets the accepted SPECIFIC_OUTLET full name through the identity-only runtime context, as its original term. Its one existing proper Google-name fragment remains the only alternative; no extra Japanese request/phase is added. An incomplete method may end and advance to that planned term before extra unrelated detail exploration. A model transport failure does not trigger an alternative. Original candidate identity data,2-search/5-detail caps and45s scope unchanged. Mock red/green controls preserve no-inventory output. Tabelog retains its existing Google-original/fragment/same-ID-Japanese plan.

## D4 tails

D4-source-snapshot7-identity-sidecar.json independently pins the saved diagnostic document, its recorder ordinal/manifest and old run artifact. Source JSON-LD name plus visible Japanese full address and source postal code exactly equal the delivered name/address. The two original merchant excerpts are independently present. Same-snapshot phone is redacted; no phone is invented. Sanitized bytes cannot recreate the old raw runtime hashes, so that mapping limitation is explicit. D4-identity-supplement.evaluation.json verifies the supplemental literal bindings but remains NOT_EVALUATED (complete meaning still requires review); original D4 input/evaluation unchanged.

G1 diagnosis: the question model rejected before any model call. The recording preserves the same5418-character Dengana text hash as PENDING then SETTLED; no null-body exception. The reader reused any same-run cached page without requiring settlement before deciding whether fresh acquisition was needed. A production-composition Mock reproduces PENDING-cache→INCOMPLETE_PAGE/zero model calls. It now refreshes within the existing question budget; persistent loading remains unverified/zero question-model calls. Exact historical cache state was not serialized: this is a reproduced supported mechanism, not proof of the unrecorded cached value. D4-g1-diagnosis.json preserves that causal limit; completeness rules are not weakened.

## Real-model validation

Frozen12-call first phase (6 original observations ×2; common user maximum30) started on8458522f. The first transmission failed NETWORK with no output; charged and preserved, no retry. Actual model attempts1, unattempted11 in first phase, remaining29 of the overall approval. This is ENV_FAILURE, not a wrong browser choice. No stronger-model comparison: the user permits that only after an actual wrong choice. No unsupported model name or price is guessed. Current decisions could not yet be validated with the real model. Browser/Google/website/Live calls0.

## Regression boundaries

D3 directed replay uses original semantic/Agent outputs and actual recorded search entry. It stops at a missing qualified TableCheck start document and later missing original Agent output; the captured Agent still selected Dengana for CHECK_AVAILABILITY/PRESENT_RESULTS. D4 original replay stops on missing keyword_suggest response, then missing Agent output. Neither is a completed regression pass. Missing responses/output were not synthesized. The replay runner now distinguishes the original G1 endpoint from a semantic message using the captured question request ID; original question bytes unchanged.

Adapter unit pages historically start with a supplied source result and have no native receipts. Those source-I/O fixtures are explicitly separated from receipt admission; all identity/inventory assertions remain. A prior literal SKILL_STARTED reason assertion is updated to the new binding failure reason; no availability assertion deleted. G6 Japanese-source Mock emits receipt data only for its own actual fixture GET submission; this is not a real-site safety claim. Related unit tests198/198 at the first source checkpoint; final matrix recorded below. An early direct G6 invocation failed EPERM binding127.0.0.1 under the sandbox; it is environment failure, not a product red.

## Verification / remaining work

Final clean-tree five gates + strictG2/G6 and scan pending in this checkpoint. No promotion to main or Live. Model validation and complete recorded chain remain unverified; source gaps and NETWORK failure are explicit. Shared STATUS/DEVLOG/TEST-LOG updates deferred to merge per Nov5 working rules; capability matrix marks this draft only.


### First full gate and fixture migration

Candidate40108165: typecheck and architecture PASS with clean statuses; default1397/1429,32fail. Build/browser/G2 not started after that failure. All32 concerned mock transports lacking current GET receipts, rather than an exemption to grant. A test-only helper now emits Mock receipt data only after a currently observed GET-form click, from the next same-origin document's actual URL multiset; it grants no boundary metadata, URL or identity. It is used only by constructed fake sessions. Real Chromium in the booking fixture remains untouched. The fixture model submits a query when it has no current receipt; the shared sequence fixture no longer advances to a different payload merely because the seeded page URL already contains a keyword. Business/safety assertions preserved. Targeted143 tests initially139/143; focused remaining fixture corrections green in the affected source files; the second full matrix follows. No product rule relaxed. TableCheck early next-term switching is limited to REQUESTED_HUMAN_HELP; NO_SAFE_ACTION can still hand current source material to its unchanged parser/identity path.

Hardcoded scan985f456e..40108165: one hit on the existing TableCheck allowedOrigins line now carrying querySource. The same previously approved origin string is unchanged; this is a safety-scope check, no new destination/action rule or platform configuration. Scanner script and exact output retained. Shared STATUS/DEVLOG/TEST-LOG are still untouched under the user Nov5 merge rule.


## Final verification and stop (2026-11-06T16:05:55.324801+01:00, CET UTC+1)

Source candidate `ba5d5748ac4ee7a4755a1e96fca1e5673b8c3dbe`; src tree `7a8ac07cb734a0a96bf7463e4c23dbb5922f5f24`. Second full matrix: typecheck PASS, architecture PASS, default1429/1429, build PASS, Chromium229/229, G6 75/75, strictG2 5/5 with all12 pairs PASS. Every before/after git status empty. First1397/1429 and environment-only local-server failure preserved; no skipped tests or manufactured success. No full-suite third run. Scan985f456e..ba5d5748 retains the one unchanged source-origin safety-line hit already explained; no new platform start URL or source private selector/word list/action sequence.

### Test migrations / retired implementation assertions

| Prior coverage | Current replacement / retained boundary |
|---|---|
| `named search checks only parsed result links against observed form field names, independent of source spelling` | Current receipt matrix uses an arbitrary field key; parsed-result conflicts still reject. The unchanged result-link filter and actual D8 observed links are exercised in the recorded-observation component. |
| `named search needs a positively bound result, accepts harmless source normalization, and rejects an unsubmitted start page` | BOUND/NORMALIZED require current complete receipts. MISSING/STALE reject; merely opening a keyword URL is intentionally no longer a sufficient positive fixture. |
| `named search binds a submitted same-origin result form, not an unrelated form with the same field` | Receipt ORIGIN/PATH/EXTRA_FIELD/REPEATED_FIELD and stale cases reject; unique native-form ownership remains enforced by unchanged Guard/Chromium tests. DETAIL cannot complete a list. Three overlapping visible-field implementation tests consolidated into one10-case receipt contract matrix. |
| Tabelog QUERY_CONFLICT and TableCheck hydrated-old-query adapter tests | Source-I/O doubles explicitly return boundary conflict; original adapter rejection/diagnostic assertions retained. Executor/Chromium prove the conflict boundary itself. |
| Literal `SKILL_STARTED` old search reason | Now asserts initial positive-binding absence; same one-session/actual Show-results action/AVAILABLE and post-action verification assertions retained. |
| Supplied adapter result pages and shared application/eval/server fake sessions | Only their source-I/O evidence migrated. Fake GET receipts originate from an actually observed Mock form click and same-origin next document; no real browser receives this helper. All original identity, branch, inventory, B1, no-booking and reuse/cap assertions preserved. |

### Product file scope (all generic)

- `browser-task-executor.ts`: current GET receipt/URL full-multiset/query binding, parsed-detail rejection and runtime list objective; no Guard or admission modification.
- `tablecheck-browser-availability.ts`: accepted full target first; its source label SPECIFIC_OUTLET; next existing fragment after method help, no model-failure retry; other safe material remains parsed normally. Same2-search/5-detail45s bounds.
- `live-read-assembly.ts`, `live-browser-availability.ts`, `source-packs.ts`: carry accepted target wording only into identity-only source context and the existing TableCheck provider. Runtime-only, not persisted State; Tabelog plan unchanged.
- `page-question-reader.ts`: a pending cache triggers existing bounded acquisition. `ModelRestaurantPageQuestion` strict completeness and citation checks unchanged.
- G1 `native-source-facts.ts` and B's G3 files untouched in this slice; no global prompt/State/TaskDefinition/Schema/Dataset/Evaluator/Rubric version change. The replay runner only recognizes captured G1 question turns without inventing semantic/model responses.

### Budget and limits

Actual new external work: model attempts1 (NETWORK, no output), websiteGET0, Google0, Live0. Cumulative `{"fullLive": 23, "realModelCalls": 639, "environmentReruns": 0, "evaluationPublicGET": 347, "googleRequests": 95, "restaurantWebsiteRequests": 11220}`. Approved totals GET458/Live42/models1600; held-out18Live/108GET preserved. The remaining three nonreserved GET and one nonreserved Live are not consumed. Failed request usage/cost was not returned; do not call its billing zero. No stronger model or price claim without an actual wrong current-model step.

All code/fixture gates pass, but requested real-model selection validation and complete recorded D3/D4 regression are NOT completed. Stop for review with those gaps; no next Live, main merge or held-out. Further model validation must use a new immutable result directory/input freeze and append to this same union ledger, preserving the first failure and remaining29 maximum; no automatic retry was added.
