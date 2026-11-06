# Search stability and native listing completion: pre-Live review

Status: draft / not integrated. Timezone CET, UTC+1. Base c54808e5 (previous product freeze88ca2ded). Branch codex/fix-phase3b-d4-d8-real-page-diagnosis. No new model, website, Google or Live calls; no credentials or private holdout read. No main merge. No identity, Guard admission, budget, time or version changes.

## 1. Original-delay stability evidence

Original exposed D4 recording:
`.eval-artifacts/phase3b/observed-read-provenance-20261105/budget-approved-continuation/live/runs/D4/D4/recordings/g6-D4-1793928719238-0/`.
The component runner uses snapshot-0001.html, its original scripts/delays and real decisions4–5, replacing transport only with a closed local archive. Probe commit910bd839; outer classification/error-detail correction6b32ddba. Forty attempts, no retries or overwrites.

Twenty ordinary replays plus twenty concurrent-snapshot variants: **40/40 Search proofs** have click END, one form receipt and a forwarding attempt to the archive. No stalled Search. Ordinary click median81.895ms (66.686–90.926); concurrent median78.653ms (57.353–89.831). Full per-attempt data: stability-summary.json and original none-/snapshot-01..20.json/log.

The competitor starts one real session.snapshot at SUBMISSION_SNAPSHOT START, overlapping click/Guard evidence acquisition. All twenty competing snapshots themselves fail quickly: **they did not pass**. Attempts02–20 retain the nested execution-context-destroyed-by-navigation message; attempt01 did not capture its nested cause, so that cause remains unknown. Search proof still finishes. This demonstrates this overlap variant, not every possible evaluation ordering.

The first driver mistakenly required the competing snapshot to succeed. Original results.json therefore marks snapshot-01 false and stops, although it has click END89.831ms, receipt1 and forwarding. Correcting that extra outer predicate permits only the previously unexecuted02–20; no retry01 or product/timeout change. Original false judgement, error and correction are retained in outer-classification-correction.md, results.json and continuation-results.json.

**Scope:** original failed Live has no search-results response. After the archive receives the query it still reports RECORDED_RESPONSE_MISSING and aborts, never synthesizes a page. Forwarding here means invocation of the replacement archive transport, not successful website response or full delivery. Exact field multiset, per-value provenance, unique form, same-origin GET proof are unchanged. This is component real-recording Replay, separate from constructed fixture tests and Live.

## 2. Source-provided place names

The only product change is native-restaurant-search.ts. Location matching uses Google displayName (existing location.label) plus corresponding address-component longText/shortText. A component corresponds only when one of its names normalizes to the resolved display name; then its alternate is accepted. Parent city/country names are not aliases merely because they share the response.

NFKD removes combining marks before existing normalizedTextKey; contiguous complete page words are concatenated for exact equality with the compact source name. No station/location word list and no substring inside a longer word.

location-query-red.log retains four failing formatting positives and two homepage false-completion failures. Green29/29 covers Shimo-Kitazawa/Shimokitazawa and Shimo Kitazawa, Higashi-Ginza/Higashiginza, Kōenji/Koenji, a corresponding Japanese component alias; parent Tokyo alias and Akabanebashi/Akabane still fail. Incidental homepage/footer place text cannot complete discovery.

## 3. Query progress before native completion

Reuse submittedOwners plus a fresh admitted GET document form receipt from this read; alternatively require an observed model action actually to leave the initial document (fragment-only change excluded). A button callback alone is insufficient. A completed same-intent source pagination continuation retains completed progress; no State fields added.

Real local Chromium through createLiveReadAssembly: HOME_CARDS and INERT_SUBMIT are red then green. Homepage cards, typed suggestion/footer name and an inert click cannot finish. Existing LINK/SCRIPT, no-match, ambiguous, foreign location, merchant-only controls remain. Location/unit and assembly29/29; related native discovery/H00157/57.

Old TableCheck source-I/O fixtures exposed results immediately on the startup document. Migrated to an observed source-owned region entrance, chosen by the fixture model before results; the complete independently reviewed query grammar lets the existing Recorder preserve the new document. Five navigation-count expectations1→2, one spent pagesRead1→2 in native-discovery-composition.test.ts. No delivery/HARD/identity/refusal/candidate-retention/recording-link assertions removed. Intermediate55/57 failures (pages count and unrecorded incomplete query) remain in native-related-green.log; final57/57. No Recorder relaxation. These are constructed offline sources, not new website Replay evidence.

## 4. Independent request coverage and provenance

request-coverage.md / .json enumerate **196 HTTP origin/path/method tuples**,755 HTTP browser starts,132 Node transport starts; separately18 original [NON_HTTP] Image starts have no recoverable HTTP origin/path, total773. Cumulative NETWORK arrays contribute appearances, not invented request counts.

Coverage:21 independent endpoint rules;1 native form audit;101 existing GET checks;73 outside allowed read scope/deny. Historical Guard outcomes are inventory only, never classification authority. All73 deny tuples have no Node transport start. Sentry POSTs, OPTIONS and blocked assets are included.

Current reviewed-public-reads.json freezes the existing evaluation-owned11 contracts plus4 independently transcribed Tabelog calendar GET grammars from Accepted ADR-0035 (15 total), never production policy generation. keyword_suggest is covered by the existing same-source GET audit. autocomplete, public_shop_lists, shop_search/ai_search and initial_vacancy/find_vacancy* were **not observed** in this failed D4; approved contracts are still included for the next read.

Calendar provenance corrected: contract existed at e90dc94e (2026-10-07), independent G6 literal at ddffe9a0 (2026-11-04), Accepted ADR-0035. It is not a new 2026-11-06 authorization. New reviewed-read-rules.json and D4/D8-next-pack.json use these refs. Historical failed-run rules/packs and SHA remain unchanged; their old label is superseded by this correction. **Old D4 remains NOT_EVALUATED**; missing POST facts cannot be backfilled.

G6 boundary audit checks method/path, raw POST shape and preflight facts, but its ordinary GET check is broader. Diagnostic audit separately checks resource type, query multiplicity/sensitive fields and native-form provenance. Missing evidence stays EVIDENCE_GAP/NOT_EVALUATED. The coverage inventory is audit ownership, not196 certified passes; existing GET checks do not prove absence of arbitrary GET side effects. Next packs still need independent witness/qualification review before Live; empty pages do not certify delivery.

## Change/verification boundaries

- Product: native-restaurant-search.ts only, generic location normalization and query completion proof. No new site branches, word lists, URL construction, private selectors or fixed action sequence.
- Component diagnostic: run-d4-search-stall-replay.ts optional concurrent snapshot and nested-error capture. No fabricated original outputs.
- Tests: bound-result-completion, location-suggestion-discovery/assembly, native-fixed-source-pages and native-discovery-composition contract migration. No user-behavior tests retired.
- State25, TaskDefinition24, Browser Prompt21/Action13/Context4 and all existing versions unchanged.
- Final source freeze, complete gates and hardcoded-scan classification are recorded in checkpoint.md/final-gates. Under Nov5 working rules, shared STATUS/DEVLOG/TEST-LOG are updated at a future authorized main merge only. Current stop is review before Live.

Final checks completed 2026-11-06T05:31:08.269757+01:00 CET: source freeze `4a6097fd256ef7b714e78b2e6830c55272e83f11`; typecheck/arch/build PASS, default1428/1428, Chromium227/227, G6 75/75, strictG2 5/5 with12 pairs PASS. No retries, all tracked-tree before/after statuses empty. See checkpoint.md and raw final-gates.
