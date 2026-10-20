# P2-1 corrected checkpoint B — discovery only

Status **COMPLETE**: 10/10 recorded; stop=None. Exposed development inputs; no availability investigation, delivery or full Live.

## Changes, gates and freeze

- Review4592a1e read before work; approved scope is the three corrections and checkpoint-local outer recovery only. [B 第一版 exclusion](superseded-b-first.json) preserves its3 runs/17 calls and all historical bytes; none enter this comparison. Its h001 repeat2 was QUERY_NOT_REPRESENTABLE, correcting the old report sentence.
- Production freeze `a37e152b4283d8f407c9650d19200708314e3362`; comparison A `ba20b8a7e0ae5d00d93838f7f19b0ae01364e2be`. Prior HARD correction `884c56b`, original P2-1b `4975f9f` retained. Prompt restaurant-discovery-retrieval-prompt@5; Schema restaurant_discovery_retrieval@2. [Five gates/red-green](fixes/verification.json). [Offline TableCheck diagnosis](fixes/tablecheck-diagnosis.json) used0 network/models.
- Homepage filters use the already observed same-region list root; no guessed or foreign root. Sparse (<5) with categories and rewrites remaining excludes KEEP in Schema, Domain and executor. No categories or two rewrites exhausted still permit it. Invalid proposals retain the bounded general-list fallback, without additional model retries.
- TableCheck original3 filter pages displayed Search is unavailable right now, not a normal empty list. Filter OPTIONS contained unreviewed open_from/open_until; selected labels omit the year as a secondary gap. Search filtering is now SKIPPED/FILTER_TRANSPORT_NOT_REVIEWED; ordinary discovery remains. No network permission expansion.
- Original [code/input freeze](freeze.json)329 files and all historical bytes remain unchanged. Current continuation [freeze](user-resume-seventh-20261020/freeze.json)826 files, commit `7103f0f24cd78febaaa8cacd1b42078e3292fbb5`, [receipt](user-resume-seventh-20261020/freeze-commit.json), outer SHA `1abaac79ce1ba91d56cb53ca07d9845c0da3f8fc3ab82a283667d72c1a1caca4`. Production a37e152, same ten plan entries, six semantic input files, metrics, limits and reviewed rules. [20 exact admission controls](user-resume-seventh-20261020/offline-controls.json), [prior44 controls and5 plan checks](browser-ready-resume-20261020/pre-launch-verification.json), [pre-launch verification](user-resume-seventh-20261020/pre-launch-verification.json).
- Registered witness renewal was frozen before the first formal B at8f39756:16 registered identities/32 public GETs/0 models/Google; all6 active supported ID sets unchanged. Registry SHA `a43cfe1ba6626a4d4a692612879191f65aafe8d0302ad7633edaf6a4a6a9cf44`, earliest expiry `2026-10-21T02:47:04.643Z`. No further renewal during this continuation. [Registry](start-b-20261020/witnesses.certified.json), [independent raw binding verification](start-b-20261020/witness-certification/verification.json), [ID comparison](start-b-20261020/witness-comparison.json).
- The first B run(index0) used8f39756 and is preserved without rerun. Earlier two403 preflights and all503 failures remain in the ledger. The first launch manifest390's top-level outer/witness/expiry fields retained old metadata; its file map and receipt bound the actual values. Current826 manifest metadata is consistent. The previous report is retained in [report-before-resume](user-resume-seventh-20261020/report-before-resume.md).
- The latest human request resumes seventh formal probe Nakameguro/index9 after its zero-model429 preflight. Completed indices0-4+8 and historical failure count6 are retained. Following pending indices6,7,5 retain their previously approved order. Exact admission matches the saved429 proof, current ledger SHA and completed/model counters; it does not add automatic429 retries. TableCheck readiness uses only unchanged real-browser nonempty source search; other three network checks remain. Normal spacing is at least300s from previous attempt end. Confirmed403/503 or explicit busy page allows one retry after900s, persistent failure stops; other failures and safety stops end the batch. Host repair facts are retained in [previous capsule](network-fixed-resume-20261020/network-facts.json).
- Source-owned production delta from4592a1e: source-packs +10/-32, net-22 lines. No unrelated deletions to offset shared changes. Full source/net-zero phase exit is not certified.

## Evaluation and comparison scope

- End-to-end: only the promised discovery first-batch slice is measured. Full user delivery/slot inventory NOT_EVALUATED. Listing filters never produce an Offer or availability evidence.
- Stages: source-specific witness listing/first-batch IDs; Google requires exact website-derived source ID. Similar names separate. Radius counts are parsed coordinate candidates, not qualified/deduplicated restaurants; listing hits may come from region navigation.
- Severity: independent frozen network rules audit recorded requests, separately from production Guard. ABSENT in these traces does not prove all public GETs safe; ADR-0036 residual limitations remain.
- Attribution: H002 is the approved HARD-keyword correction group; the other nine rows are P2-1b including these approved homepage/sparse-KEEP/TableCheck corrections. Host routing repair, public-data and model-choice fluctuation prevent a statistical or single-factor causal claim. L0/L1 local evidence and real-model discovery probes are separate; no paid offline replay added.

- Recording flags: {"NOT_REPLAYABLE/UNSAFE_DOCUMENT": 10}. Original manifest/assets are retained; executable static replay is not claimed.

## Aggregate (complete/common rows separated)

| Metric | A all10 | A comparable rows | B recorded rows |
| --- | --- | --- | --- |
| runs | 10 | 10 | 10 |
| models | 49 | 49 | 49 |
| elapsedMs | 942173 | 942173 | 806489 |
| planningCalls | 22 | 22 | 18 |
| planningMs | 56097 | 56097 | 40607 |
| planningTimeouts | 0 | 0 | 0 |
| listing | {'tabelog': 8, 'tablecheck': 0, 'google-places': 5} | {'tabelog': 8, 'tablecheck': 0, 'google-places': 5} | {'tabelog': 7, 'tablecheck': 0, 'google-places': 4} |
| firstBatch | {'tabelog': 5, 'tablecheck': 0} | {'tabelog': 5, 'tablecheck': 0} | {'tabelog': 5, 'tablecheck': 0} |
| failures | {'READ_BUDGET_EXCEEDED': 2} | {'READ_BUDGET_EXCEEDED': 2} | {'READ_BUDGET_EXCEEDED': 3} |

## Source and radius comparison

| Case / repeat | Variable group | Tabelog list,first A→B | TableCheck list,first A→B | Google exact A→B | Radius A→B |
| --- | --- | --- | --- | --- | --- |
| p2-kf-h001-20261027 / 1 | P2_1B_SEARCH_AVAILABILITY_HINTS | 1,1 → 1,1 | 0,0 → 0,0 | 1 → 1 | 40 → 43 |
| p2-kf-h001-20261027 / 2 | P2_1B_SEARCH_AVAILABILITY_HINTS | 1,1 → 1,1 | 0,0 → 0,0 | 1 → 0 | 44 → 44 |
| p2-kagurazaka-kaiseki-20261029 / 1 | P2_1B_SEARCH_AVAILABILITY_HINTS | 0,0 → 0,0 | 0,0 → 0,0 | 0 → 0 | 44 → 45 |
| p2-kagurazaka-kaiseki-20261029 / 2 | P2_1B_SEARCH_AVAILABILITY_HINTS | 0,0 → 0,0 | 0,0 → 0,0 | 0 → 0 | 44 → 45 |
| p2-kf-h005-20261029 / 1 | P2_1B_SEARCH_AVAILABILITY_HINTS | 1,0 → 1,0 | 0,0 → 0,0 | 0 → 0 | 49 → 49 |
| p2-kf-h005-20261029 / 2 | P2_1B_SEARCH_AVAILABILITY_HINTS | 1,0 → 1,0 | 0,0 → 0,0 | 0 → 0 | 49 → 46 |
| p2-kichijoji-tempura-20261027 / 1 | P2_1B_SEARCH_AVAILABILITY_HINTS | 1,1 → 1,1 | 0,0 → 0,0 | 1 → 1 | 50 → 50 |
| p2-kichijoji-tempura-20261027 / 2 | P2_1B_SEARCH_AVAILABILITY_HINTS | 1,1 → 1,1 | 0,0 → 0,0 | 1 → 1 | 50 → 50 |
| p2-kf-h002-20261031 / 1 | HARD_KEYWORD_CORRECTION | 1,0 → 1,1 | 0,0 → 0,0 | 0 → 0 | 10 → 30 |
| p2-nakameguro-yakiniku-20261030 / 1 | P2_1B_SEARCH_AVAILABILITY_HINTS | 1,1 → 0,0 | 0,0 → 0,0 | 1 → 1 | 43 → 39 |

## Resources A → B

Elapsed excludes external preflight. Shared text planning counted once. Unrun B is NOT_REACHED, not zero.

| Case / repeat | Models | Elapsed ms | Pages | Planning calls/ms | Planning timeouts | B Google formal |
| --- | --- | --- | --- | --- | --- | --- |
| p2-kf-h001-20261027 / 1 | 4 → 4 | 79187 → 84990 | 7 → 8 | 3/6958 → 3/6516 | 0 → 0 | 2 |
| p2-kf-h001-20261027 / 2 | 4 → 4 | 100591 → 80539 | 7 → 8 | 3/9659 → 3/6373 | 0 → 0 | 2 |
| p2-kagurazaka-kaiseki-20261029 / 1 | 9 → 8 | 126650 → 85248 | 8 → 8 | 1/2135 → 1/2223 | 0 → 0 | 2 |
| p2-kagurazaka-kaiseki-20261029 / 2 | 9 → 8 | 96753 → 98900 | 8 → 8 | 1/2306 → 1/2349 | 0 → 0 | 2 |
| p2-kf-h005-20261029 / 1 | 3 → 3 | 82361 → 78966 | 6 → 7 | 2/4615 → 2/4547 | 0 → 0 | 2 |
| p2-kf-h005-20261029 / 2 | 3 → 3 | 86541 → 79170 | 6 → 7 | 2/5436 → 2/4435 | 0 → 0 | 2 |
| p2-kichijoji-tempura-20261027 / 1 | 3 → 3 | 100222 → 74501 | 6 → 7 | 2/5980 → 2/4971 | 0 → 0 | 2 |
| p2-kichijoji-tempura-20261027 / 2 | 3 → 3 | 84654 → 71563 | 6 → 7 | 2/5844 → 2/5063 | 0 → 0 | 2 |
| p2-kf-h002-20261031 / 1 | 7 → 4 | 101016 → 85872 | 9 → 8 | 4/8535 → 1/2597 | 0 → 0 | 1 |
| p2-nakameguro-yakiniku-20261030 / 1 | 4 → 9 | 84198 → 66740 | 7 → 8 | 2/4629 → 1/1533 | 0 → 0 | 2 |

## Search-filter observations and raw paths

APPLIED is an executor diagnostic, not an independent availability verdict. Inspect the linked recording for source-selected values. Empty or unconfirmed hints do not imply no tables.

### p2-kf-h001-20261027 / 1

Boundary **ABSENT**; failures `[]`; termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`.

- tabelog: `{"status": "APPLIED", "reason": "OBSERVED_QUERY_MATCH", "sourceUrl": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?vac_net=1&svd=20261027&svt=1900&svps=2", "unfilteredUrl": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/", "request": {"date": "2026-10-27", "partySize": 2, "time": "19:00"}, "observed": {"date": "2026-10-27", "partySize": 2, "time": "19:00"}, "parsedCount": 11}`
- tablecheck: `{"status": "SKIPPED", "reason": "FILTER_TRANSPORT_NOT_REVIEWED", "sourceUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase", "unfilteredUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase"}`
- google-places: no hint reached/applicable.

Source timing/planning: `{"tabelog": {"callCount": 2, "latencyMs": 3959, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 55072, "retrieval": {"rewrites": 1, "regionPages": 2, "retrievalPages": 2, "history": [{"selection": {"accepted": true, "reason": "Search directly for the hard criterion \"omakase\" in the Shibuya area.", "keyword": "omakase", "criterionRef": "criterion:0"}, "elapsedMs": 23143, "parsedCount": 3}, {"selection": {"accepted": true, "reason": "Only 3 results shown; expanding to the supplied Sushi category, the most relevant observed category for omakase.", "categoryUrl": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?sw=omakase"}, "elapsedMs": 24817, "parsedCount": 3}], "selection": {"accepted": true, "reason": "Only 3 results shown; expanding to the supplied Sushi category, the most relevant observed category for omakase.", "categoryUrl": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?sw=omakase"}}, "failureCode": null}, "tablecheck": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 27862, "retrieval": {"selection": {"accepted": true, "reason": "Retrieve restaurants matching the hard criterion \"omakase\" in Shibuya.", "keyword": "omakase", "criterionRef": "criterion:0"}, "rewrites": 0, "regionPages": 0, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Retrieve restaurants matching the hard criterion \"omakase\" in Shibuya.", "keyword": "omakase", "criterionRef": "criterion:0"}, "elapsedMs": 13257, "parsedCount": 20}]}, "failureCode": null}, "google-places": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": null, "sourceElapsedMs": null, "retrieval": null, "failureCode": null}}`

Google recorded request context: `[{"sequence": 256, "sourceId": "google-places", "sourceRequestContext": {"textQuery": "omakase Shibuya"}, "candidates": 34}]`

- [summary](runs/p2-kf-h001-20261027/attempt-1-start-b-20261020/probe-summary.json) — SHA-256 `9919e2fd7e3cf2629558fb184bd41c863e7a7fa2906f4278cd691ab228d3c54a`
- [decisions](runs/p2-kf-h001-20261027/attempt-1-start-b-20261020/probe.decisions.jsonl) — SHA-256 `77f156b1d410c5c1fa1d6eea8281c15f7e5068eea8cc10858e828190f6007760`
- [recording](runs/p2-kf-h001-20261027/attempt-1-start-b-20261020/recording/p2-kf-h001-20261027/recording.json) — SHA-256 `df155dd348b3ad491e64abc971093a914ce7664abeee659ecfc7074751928f3c`
- [trace](runs/p2-kf-h001-20261027/attempt-1-start-b-20261020/trace.jsonl) — SHA-256 `25d2f530bbb30e1486330b174411e9717280eb7b70753b727cd71798e4920375`

Retrieval attempts (original order; repeated observations retained):

| Source | Type | Keyword/category | Parsed/displayed | URL | Decision/reason |
| --- | --- | --- | --- | --- | --- |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/139465 | https://tabelog.com/en/tokyo/ | PLANNER_AND_OBSERVED_REGION_AGENT: PRE_DETAIL_RETRIEVAL_REWRITE |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/5613 | https://tabelog.com/en/tokyo/A1303/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: PRE_DETAIL_RETRIEVAL_REWRITE |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/5613 | https://tabelog.com/en/tokyo/A1303/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: PRE_DETAIL_RETRIEVAL_REWRITE |
| tabelog | KEYWORD | omakase | 3/3 | https://tabelog.com/en/tokyo/A1303/?sw=omakase | BROWSER_AGENT_OR_SOURCE_PAGINATION: PRE_DETAIL_RETRIEVAL_REWRITE |
| tabelog | CATEGORY_OR_GENERAL_LIST | English | 20/197 | https://tabelog.com/en/tokyo/A1303/rstLst/sushi/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: PRE_DETAIL_RETRIEVAL_REWRITE |
| tabelog | SEARCH_AVAILABILITY_HINT | None | 11/90 | https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?vac_net=1&svd=20261027&svt=1900&svps=2 | EXECUTOR_AUTHORITATIVE_REQUEST: OBSERVED_QUERY_MATCH |
| tabelog | SEARCH_AVAILABILITY_HINT | None | 11/90 | https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?vac_net=1&svd=20261027&svt=1900&svps=2 | EXECUTOR_AUTHORITATIVE_REQUEST: OBSERVED_QUERY_MATCH |
| tablecheck | KEYWORD | omakase | 20/None | https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |
| google-places | CATEGORY_OR_GENERAL_LIST | None | None/None | google-places:nearby-search | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |

### p2-kf-h001-20261027 / 2

Boundary **ABSENT**; failures `[]`; termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`.

- tabelog: `{"status": "APPLIED", "reason": "OBSERVED_QUERY_MATCH", "sourceUrl": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?vac_net=1&svd=20261027&svt=1900&svps=2", "unfilteredUrl": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/", "request": {"date": "2026-10-27", "partySize": 2, "time": "19:00"}, "observed": {"date": "2026-10-27", "partySize": 2, "time": "19:00"}, "parsedCount": 10}`
- tablecheck: `{"status": "SKIPPED", "reason": "FILTER_TRANSPORT_NOT_REVIEWED", "sourceUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase", "unfilteredUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase"}`
- google-places: no hint reached/applicable.

Source timing/planning: `{"tabelog": {"callCount": 2, "latencyMs": 4104, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 53076, "retrieval": {"rewrites": 1, "regionPages": 2, "retrievalPages": 2, "history": [{"selection": {"accepted": true, "reason": "Retrieve Shibuya restaurants matching the hard criterion \"omakase\" directly.", "keyword": "omakase", "criterionRef": "criterion:0"}, "elapsedMs": 20608, "parsedCount": 3}, {"selection": {"accepted": true, "reason": "Only 3 results shown; expand to the supplied Sushi category, the most relevant observed category for omakase.", "categoryUrl": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?sw=omakase"}, "elapsedMs": 22176, "parsedCount": 3}], "selection": {"accepted": true, "reason": "Only 3 results shown; expand to the supplied Sushi category, the most relevant observed category for omakase.", "categoryUrl": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?sw=omakase"}}, "failureCode": null}, "tablecheck": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 25548, "retrieval": {"selection": {"accepted": true, "reason": "Retrieve restaurants matching the hard criterion \"omakase\" in Shibuya.", "keyword": "omakase", "criterionRef": "criterion:0"}, "rewrites": 0, "regionPages": 0, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Retrieve restaurants matching the hard criterion \"omakase\" in Shibuya.", "keyword": "omakase", "criterionRef": "criterion:0"}, "elapsedMs": 7205, "parsedCount": 20}]}, "failureCode": null}, "google-places": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": null, "sourceElapsedMs": null, "retrieval": null, "failureCode": null}}`

Google recorded request context: `[{"sequence": 256, "sourceId": "google-places", "sourceRequestContext": {"textQuery": "omakase Shibuya"}, "candidates": 35}]`

- [summary](runs/p2-kf-h001-20261027/attempt-2-network-fixed-20261020/probe-summary.json) — SHA-256 `3f101ba5d45365f57af4f57cfe20664e72e0b3283ee4602e9f926a2170470379`
- [decisions](runs/p2-kf-h001-20261027/attempt-2-network-fixed-20261020/probe.decisions.jsonl) — SHA-256 `eb5540db72503c5dd33e57bb773c8c269f4fd2e0e16813ce074e79f58187dcf0`
- [recording](runs/p2-kf-h001-20261027/attempt-2-network-fixed-20261020/recording/p2-kf-h001-20261027/recording.json) — SHA-256 `033fd46ea7f63a3010c96e4d47d12847123fa464331ddf4b556566ed10d14485`
- [trace](runs/p2-kf-h001-20261027/attempt-2-network-fixed-20261020/trace.jsonl) — SHA-256 `8509a1158cf3ac83f509404db77ac03dd48ad15a31e8b06432c0c2204a68792e`

Retrieval attempts (original order; repeated observations retained):

| Source | Type | Keyword/category | Parsed/displayed | URL | Decision/reason |
| --- | --- | --- | --- | --- | --- |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/139462 | https://tabelog.com/en/tokyo/ | PLANNER_AND_OBSERVED_REGION_AGENT: PRE_DETAIL_RETRIEVAL_REWRITE |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/5613 | https://tabelog.com/en/tokyo/A1303/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: PRE_DETAIL_RETRIEVAL_REWRITE |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/5613 | https://tabelog.com/en/tokyo/A1303/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: PRE_DETAIL_RETRIEVAL_REWRITE |
| tabelog | KEYWORD | omakase | 3/3 | https://tabelog.com/en/tokyo/A1303/?sw=omakase | BROWSER_AGENT_OR_SOURCE_PAGINATION: PRE_DETAIL_RETRIEVAL_REWRITE |
| tabelog | CATEGORY_OR_GENERAL_LIST | English | 20/197 | https://tabelog.com/en/tokyo/A1303/rstLst/sushi/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: PRE_DETAIL_RETRIEVAL_REWRITE |
| tabelog | SEARCH_AVAILABILITY_HINT | None | 10/90 | https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?vac_net=1&svd=20261027&svt=1900&svps=2 | EXECUTOR_AUTHORITATIVE_REQUEST: OBSERVED_QUERY_MATCH |
| tabelog | SEARCH_AVAILABILITY_HINT | None | 10/90 | https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?vac_net=1&svd=20261027&svt=1900&svps=2 | EXECUTOR_AUTHORITATIVE_REQUEST: OBSERVED_QUERY_MATCH |
| tablecheck | KEYWORD | omakase | 20/None | https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |
| google-places | CATEGORY_OR_GENERAL_LIST | None | None/None | google-places:nearby-search | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |

### p2-kagurazaka-kaiseki-20261029 / 1

Boundary **ABSENT**; failures `['READ_BUDGET_EXCEEDED']`; termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`.

- tabelog: no hint reached/applicable.
- tablecheck: `{"status": "SKIPPED", "reason": "FILTER_TRANSPORT_NOT_REVIEWED", "sourceUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.701459799999995&geo_longitude=139.7402946&geo_distance=1km&auto_geolocate=false&search_text=kaiseki", "unfilteredUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.701459799999995&geo_longitude=139.7402946&geo_distance=1km&auto_geolocate=false&search_text=kaiseki"}`
- google-places: no hint reached/applicable.

Source timing/planning: `{"tabelog": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 58118, "retrieval": {"rewrites": 0, "regionPages": 5, "retrievalPages": 0, "history": []}, "failureCode": "READ_BUDGET_EXCEEDED"}, "tablecheck": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 25022, "retrieval": {"selection": {"accepted": true, "reason": "Retrieve kaiseki restaurants matching the hard criterion.", "keyword": "kaiseki", "criterionRef": "criterion:0"}, "rewrites": 0, "regionPages": 0, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Retrieve kaiseki restaurants matching the hard criterion.", "keyword": "kaiseki", "criterionRef": "criterion:0"}, "elapsedMs": 9274, "parsedCount": 20}]}, "failureCode": null}, "google-places": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": null, "sourceElapsedMs": null, "retrieval": null, "failureCode": null}}`

Google recorded request context: `[{"sequence": 304, "sourceId": "google-places", "sourceRequestContext": {"textQuery": "kaiseki Kagurazaka"}, "candidates": 40}]`

- [summary](runs/p2-kagurazaka-kaiseki-20261029/attempt-1/probe-summary.json) — SHA-256 `5f328831fda9a124137bac4ffccb652824f0080f007d8f1b81170d85e8298dbd`
- [decisions](runs/p2-kagurazaka-kaiseki-20261029/attempt-1/probe.decisions.jsonl) — SHA-256 `a19b48427e977acd6a7df27d032c191c1f6a3aa577cab8c600991d3ff9d62777`
- [recording](runs/p2-kagurazaka-kaiseki-20261029/attempt-1/recording/p2-kagurazaka-kaiseki-20261029/recording.json) — SHA-256 `c0e570f5b7361bcb7ebf2f5c4f70b113e8057b45303667538169a5abcabc6556`
- [trace](runs/p2-kagurazaka-kaiseki-20261029/attempt-1/trace.jsonl) — SHA-256 `0cffbc8444538af10169deb17a5aa5c0ac1176fab3911a10935ed5525871164c`

Retrieval attempts (original order; repeated observations retained):

| Source | Type | Keyword/category | Parsed/displayed | URL | Decision/reason |
| --- | --- | --- | --- | --- | --- |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/139462 | https://tabelog.com/en/tokyo/ | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/7124 | https://tabelog.com/en/tokyo/A1304/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/906566 | https://tabelog.com/en/rstLst/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 0/139462 | https://tabelog.com/en/tokyo/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/7124 | https://tabelog.com/en/tokyo/A1304/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tablecheck | KEYWORD | kaiseki | 20/None | https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.701459799999995&geo_longitude=139.7402946&geo_distance=1km&auto_geolocate=false&search_text=kaiseki | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |
| google-places | CATEGORY_OR_GENERAL_LIST | None | None/None | google-places:nearby-search | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |

### p2-kagurazaka-kaiseki-20261029 / 2

Boundary **ABSENT**; failures `['READ_BUDGET_EXCEEDED']`; termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`.

- tabelog: no hint reached/applicable.
- tablecheck: `{"status": "SKIPPED", "reason": "FILTER_TRANSPORT_NOT_REVIEWED", "sourceUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.701459799999995&geo_longitude=139.7402946&geo_distance=1km&auto_geolocate=false&search_text=kaiseki", "unfilteredUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.701459799999995&geo_longitude=139.7402946&geo_distance=1km&auto_geolocate=false&search_text=kaiseki"}`
- google-places: no hint reached/applicable.

Source timing/planning: `{"tabelog": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 62556, "retrieval": {"rewrites": 0, "regionPages": 5, "retrievalPages": 0, "history": []}, "failureCode": "READ_BUDGET_EXCEEDED"}, "tablecheck": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 34320, "retrieval": {"selection": {"accepted": true, "reason": "Direct keyword retrieval for the hard criterion \"kaiseki restaurant\" in Kagurazaka.", "keyword": "kaiseki", "criterionRef": "criterion:0"}, "rewrites": 0, "regionPages": 0, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Direct keyword retrieval for the hard criterion \"kaiseki restaurant\" in Kagurazaka.", "keyword": "kaiseki", "criterionRef": "criterion:0"}, "elapsedMs": 12119, "parsedCount": 20}]}, "failureCode": null}, "google-places": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": null, "sourceElapsedMs": null, "retrieval": null, "failureCode": null}}`

Google recorded request context: `[{"sequence": 304, "sourceId": "google-places", "sourceRequestContext": {"textQuery": "kaiseki Kagurazaka"}, "candidates": 40}]`

- [summary](runs/p2-kagurazaka-kaiseki-20261029/attempt-2/probe-summary.json) — SHA-256 `e2d542b02bf5b2e42d33cb7ab0f49b710014264a93f6d8b7bb454d950000d1fd`
- [decisions](runs/p2-kagurazaka-kaiseki-20261029/attempt-2/probe.decisions.jsonl) — SHA-256 `63db181b517dd396a56533b3734b77e89aae6af6588856dbfe153005eb4b293b`
- [recording](runs/p2-kagurazaka-kaiseki-20261029/attempt-2/recording/p2-kagurazaka-kaiseki-20261029/recording.json) — SHA-256 `e345a4805f2bf70c04f5763f5f697cc6e62d191799f00ad115b5e5aeb843c29d`
- [trace](runs/p2-kagurazaka-kaiseki-20261029/attempt-2/trace.jsonl) — SHA-256 `a23bc09b2ab0daee2e443b96a62dfb12e14a413e1b368044f04f5a332beac85c`

Retrieval attempts (original order; repeated observations retained):

| Source | Type | Keyword/category | Parsed/displayed | URL | Decision/reason |
| --- | --- | --- | --- | --- | --- |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/139462 | https://tabelog.com/en/tokyo/ | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/7124 | https://tabelog.com/en/tokyo/A1304/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/5594 | https://tabelog.com/en/tokyo/A1304/A130401/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 0/7124 | https://tabelog.com/en/tokyo/A1304/rstLst/?railroad=false | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/5594 | https://tabelog.com/en/tokyo/A1304/A130401/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tablecheck | KEYWORD | kaiseki | 20/None | https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.701459799999995&geo_longitude=139.7402946&geo_distance=1km&auto_geolocate=false&search_text=kaiseki | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |
| google-places | CATEGORY_OR_GENERAL_LIST | None | None/None | google-places:nearby-search | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |

### p2-kf-h005-20261029 / 1

Boundary **ABSENT**; failures `[]`; termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`.

- tabelog: `{"status": "APPLIED", "reason": "OBSERVED_QUERY_MATCH", "sourceUrl": "https://tabelog.com/en/tokyo/A1301/rstLst/washoku/?vac_net=1&svd=20261029&svt=1800&svps=4", "unfilteredUrl": "https://tabelog.com/en/tokyo/A1301/rstLst/washoku/", "request": {"date": "2026-10-29", "partySize": 4, "time": "18:00"}, "observed": {"date": "2026-10-29", "partySize": 4, "time": "18:00"}, "parsedCount": 18}`
- tablecheck: `{"status": "SKIPPED", "reason": "FILTER_TRANSPORT_NOT_REVIEWED", "sourceUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6697&geo_longitude=139.767&geo_distance=1km&auto_geolocate=false&search_text=local+food", "unfilteredUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6697&geo_longitude=139.767&geo_distance=1km&auto_geolocate=false&search_text=local+food"}`
- google-places: no hint reached/applicable.

Source timing/planning: `{"tabelog": {"callCount": 1, "latencyMs": 2393, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 50693, "retrieval": {"rewrites": 0, "regionPages": 2, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Local food (HARD) maps to the supplied Washoku (Japanese cuisine) category in this region; expanding to that category to surface relevant candidates.", "categoryUrl": "https://tabelog.com/en/tokyo/A1301/rstLst/washoku/"}, "elapsedMs": 22782, "parsedCount": 20}], "selection": {"accepted": true, "reason": "Local food (HARD) maps to the supplied Washoku (Japanese cuisine) category in this region; expanding to that category to surface relevant candidates.", "categoryUrl": "https://tabelog.com/en/tokyo/A1301/rstLst/washoku/"}}, "failureCode": null}, "tablecheck": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 24253, "retrieval": {"selection": {"accepted": true, "reason": "No observations or categories supplied yet; retrieve by the hard criterion keyword.", "keyword": "local food", "criterionRef": "criterion:0"}, "rewrites": 0, "regionPages": 0, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "No observations or categories supplied yet; retrieve by the hard criterion keyword.", "keyword": "local food", "criterionRef": "criterion:0"}, "elapsedMs": 6708, "parsedCount": 20}]}, "failureCode": null}, "google-places": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": null, "sourceElapsedMs": null, "retrieval": null, "failureCode": null}}`

Google recorded request context: `[{"sequence": 242, "sourceId": "google-places", "sourceRequestContext": {"textQuery": "local food nearby"}, "candidates": 40}]`

- [summary](runs/p2-kf-h005-20261029/attempt-1/probe-summary.json) — SHA-256 `683eaf35fd9e02ae07966a4060df47f708de12e1fe7e938bdd4ea7fe180cd391`
- [decisions](runs/p2-kf-h005-20261029/attempt-1/probe.decisions.jsonl) — SHA-256 `28880d3a91c48d95ee506ae0b6ce3fced3eabb1f9947a39af27332e6acf2dc85`
- [recording](runs/p2-kf-h005-20261029/attempt-1/recording/p2-kf-h005-20261029/recording.json) — SHA-256 `2b6bf41a58be2b628ae3c890f2c2e58f86342302f73a243f53fd6fc4ddcbbd67`
- [trace](runs/p2-kf-h005-20261029/attempt-1/trace.jsonl) — SHA-256 `af0dbab7d41ddae220520ae4a3b6d22e6fdaec2367ab76c1cc3467db0d4cc74b`

Retrieval attempts (original order; repeated observations retained):

| Source | Type | Keyword/category | Parsed/displayed | URL | Decision/reason |
| --- | --- | --- | --- | --- | --- |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/139462 | https://tabelog.com/en/tokyo/ | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/6249 | https://tabelog.com/en/tokyo/A1301/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/6249 | https://tabelog.com/en/tokyo/A1301/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | English | 20/2273 | https://tabelog.com/en/tokyo/A1301/rstLst/washoku/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | SEARCH_AVAILABILITY_HINT | None | 18/986 | https://tabelog.com/en/tokyo/A1301/rstLst/washoku/?vac_net=1&svd=20261029&svt=1800&svps=4 | EXECUTOR_AUTHORITATIVE_REQUEST: OBSERVED_QUERY_MATCH |
| tabelog | SEARCH_AVAILABILITY_HINT | None | 18/986 | https://tabelog.com/en/tokyo/A1301/rstLst/washoku/?vac_net=1&svd=20261029&svt=1800&svps=4 | EXECUTOR_AUTHORITATIVE_REQUEST: OBSERVED_QUERY_MATCH |
| tablecheck | KEYWORD | local food | 20/None | https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6697&geo_longitude=139.767&geo_distance=1km&auto_geolocate=false&search_text=local+food | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |
| google-places | CATEGORY_OR_GENERAL_LIST | None | None/None | google-places:nearby-search | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |

### p2-kf-h002-20261031 / 1

Boundary **ABSENT**; failures `[]`; termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`.

- tabelog: `{"status": "APPLIED", "reason": "OBSERVED_QUERY_MATCH", "sourceUrl": "https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/sushi/?vac_net=1&svd=20261031&svt=1830&svps=2", "unfilteredUrl": "https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/sushi/", "request": {"date": "2026-10-31", "partySize": 2, "time": "18:30"}, "observed": {"date": "2026-10-31", "partySize": 2, "time": "18:30"}, "parsedCount": 16}`
- tablecheck: `{"status": "SKIPPED", "reason": "FILTER_TRANSPORT_NOT_REVIEWED", "sourceUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.669700299999995&geo_longitude=139.7671399&geo_distance=1km&auto_geolocate=false", "unfilteredUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.669700299999995&geo_longitude=139.7671399&geo_distance=1km&auto_geolocate=false"}`
- google-places: no hint reached/applicable.

Source timing/planning: `{"tabelog": {"callCount": 1, "latencyMs": 2597, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 66231, "retrieval": {"rewrites": 0, "regionPages": 4, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Sushi counters are a classic first-date choice and the observed list shows several sushi spots near the 10,000 yen soft budget; expanding to the supplied Sushi category gives a focused, sufficient set.", "categoryUrl": "https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/sushi/"}, "elapsedMs": 39255, "parsedCount": 20}], "selection": {"accepted": true, "reason": "Sushi counters are a classic first-date choice and the observed list shows several sushi spots near the 10,000 yen soft budget; expanding to the supplied Sushi category gives a focused, sufficient set.", "categoryUrl": "https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/sushi/"}}, "failureCode": null}, "tablecheck": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 17674, "retrieval": {"selection": {"accepted": true, "reason": "General retrieval: no positive HARD criterion."}, "rewrites": 0, "regionPages": 0, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "General retrieval: no positive HARD criterion."}, "elapsedMs": 4141, "parsedCount": 20}]}, "failureCode": null}, "google-places": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": null, "sourceElapsedMs": null, "retrieval": null, "failureCode": null}}`

Google recorded request context: `[{"sequence": 288, "sourceId": "google-places", "sourceRequestContext": {"textQuery": "nearby:restaurant"}, "candidates": 20}]`

- [summary](runs/p2-kf-h002-20261031/attempt-1-browser-ready-20261020/probe-summary.json) — SHA-256 `ecff2fcb5bddb6afa95bbb227d09575b5dd31e8b497b082bb0c8be02e7665a0d`
- [decisions](runs/p2-kf-h002-20261031/attempt-1-browser-ready-20261020/probe.decisions.jsonl) — SHA-256 `980605c7279b37ab70d8ea53572296e8cd9702575a8126858fe2a0f2a28ec20d`
- [recording](runs/p2-kf-h002-20261031/attempt-1-browser-ready-20261020/recording/p2-kf-h002-20261031/recording.json) — SHA-256 `a39eb9ea7dd027ba402a0fe67fcbd4002aa54b61d411f6e3ec7b4df31f4e6e77`
- [trace](runs/p2-kf-h002-20261031/attempt-1-browser-ready-20261020/trace.jsonl) — SHA-256 `9351fb510a87330fdaf527232b23b7b373930d4706bbc282b0518e5e9fdd7c84`

Retrieval attempts (original order; repeated observations retained):

| Source | Type | Keyword/category | Parsed/displayed | URL | Decision/reason |
| --- | --- | --- | --- | --- | --- |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/139463 | https://tabelog.com/en/tokyo/ | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/6249 | https://tabelog.com/en/tokyo/A1301/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/2658 | https://tabelog.com/en/tokyo/A1301/A130101/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/5034 | https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/5034 | https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | English | 20/414 | https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/sushi/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | SEARCH_AVAILABILITY_HINT | 800m [ 158 Count ] | 16/158 | https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/sushi/?vac_net=1&svd=20261031&svt=1830&svps=2 | EXECUTOR_AUTHORITATIVE_REQUEST: OBSERVED_QUERY_MATCH |
| tabelog | SEARCH_AVAILABILITY_HINT | 800m [ 158 Count ] | 16/158 | https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/sushi/?vac_net=1&svd=20261031&svt=1830&svps=2 | EXECUTOR_AUTHORITATIVE_REQUEST: OBSERVED_QUERY_MATCH |
| tablecheck | CATEGORY_OR_GENERAL_LIST | None | 20/None | https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.669700299999995&geo_longitude=139.7671399&geo_distance=1km&auto_geolocate=false | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |
| google-places | CATEGORY_OR_GENERAL_LIST | None | None/None | google-places:nearby-search | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |

### p2-nakameguro-yakiniku-20261030 / 1

Boundary **ABSENT**; failures `['READ_BUDGET_EXCEEDED']`; termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`.

- tabelog: no hint reached/applicable.
- tablecheck: `{"status": "SKIPPED", "reason": "FILTER_TRANSPORT_NOT_REVIEWED", "sourceUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.638716099999996&geo_longitude=139.7026251&geo_distance=1km&auto_geolocate=false&search_text=yakiniku", "unfilteredUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.638716099999996&geo_longitude=139.7026251&geo_distance=1km&auto_geolocate=false&search_text=yakiniku"}`
- google-places: no hint reached/applicable.

Source timing/planning: `{"tabelog": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 43782, "retrieval": {"rewrites": 0, "regionPages": 5, "retrievalPages": 0, "history": []}, "failureCode": "READ_BUDGET_EXCEEDED"}, "tablecheck": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 21152, "retrieval": {"selection": {"accepted": true, "reason": "Retrieve yakiniku restaurants in Nakameguro using the hard criterion keyword.", "keyword": "yakiniku", "criterionRef": "criterion:0"}, "rewrites": 0, "regionPages": 0, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Retrieve yakiniku restaurants in Nakameguro using the hard criterion keyword.", "keyword": "yakiniku", "criterionRef": "criterion:0"}, "elapsedMs": 5955, "parsedCount": 20}]}, "failureCode": null}, "google-places": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": null, "sourceElapsedMs": null, "retrieval": null, "failureCode": null}}`

Google recorded request context: `[{"sequence": 324, "sourceId": "google-places", "sourceRequestContext": {"textQuery": "yakiniku Nakameguro"}, "candidates": 34}]`

- [summary](runs/p2-nakameguro-yakiniku-20261030/attempt-1-user-seventh-20261020/probe-summary.json) — SHA-256 `f4f10b75e6ba0be0853153d1b880da7ec865310bd6f5df89f3b08d6a45def01b`
- [decisions](runs/p2-nakameguro-yakiniku-20261030/attempt-1-user-seventh-20261020/probe.decisions.jsonl) — SHA-256 `5f0bc33058b10908a8d81d01a52522a6fb0322bd99822ccbedf18bbc135c8449`
- [recording](runs/p2-nakameguro-yakiniku-20261030/attempt-1-user-seventh-20261020/recording/p2-nakameguro-yakiniku-20261030/recording.json) — SHA-256 `be7ae25a0d0a93bef3862567ef5e96b00d7fb79179a8ea47706c73a28a22391a`
- [trace](runs/p2-nakameguro-yakiniku-20261030/attempt-1-user-seventh-20261020/trace.jsonl) — SHA-256 `c36b8523c2c09908818ecc953f94f3d0f4bbaed89dffe4cf745e3e97f1014e3c`

Retrieval attempts (original order; repeated observations retained):

| Source | Type | Keyword/category | Parsed/displayed | URL | Decision/reason |
| --- | --- | --- | --- | --- | --- |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/139465 | https://tabelog.com/en/tokyo/ | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/2106 | https://tabelog.com/en/tokyo/A1316/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | Yakiniku (Japanese BBQ) | 0/79 | https://tabelog.com/en/tokyo/A1316/rstLst/yakiniku/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | English | 19/19 | https://tabelog.com/en/tokyo/A1316/A131601/rstLst/yakiniku/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 0/20 | https://tabelog.com/en/tokyo/A1316/A131601/R9966/rstLst/yakiniku/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tablecheck | KEYWORD | yakiniku | 20/None | https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.638716099999996&geo_longitude=139.7026251&geo_distance=1km&auto_geolocate=false&search_text=yakiniku | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |
| google-places | CATEGORY_OR_GENERAL_LIST | None | None/None | google-places:nearby-search | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |

### p2-kichijoji-tempura-20261027 / 1

Boundary **ABSENT**; failures `[]`; termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`.

- tabelog: `{"status": "APPLIED", "reason": "OBSERVED_QUERY_MATCH", "sourceUrl": "https://tabelog.com/en/tokyo/A1320/rstLst/tempura/?vac_net=1&svd=20261027&svt=1800&svps=2", "unfilteredUrl": "https://tabelog.com/en/tokyo/A1320/rstLst/tempura/", "request": {"date": "2026-10-27", "partySize": 2, "time": "18:00"}, "observed": {"date": "2026-10-27", "partySize": 2, "time": "18:00"}, "parsedCount": 7}`
- tablecheck: `{"status": "SKIPPED", "reason": "FILTER_TRANSPORT_NOT_REVIEWED", "sourceUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.704096&geo_longitude=139.58020539999998&geo_distance=1km&auto_geolocate=false&search_text=tempura", "unfilteredUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.704096&geo_longitude=139.58020539999998&geo_distance=1km&auto_geolocate=false&search_text=tempura"}`
- google-places: no hint reached/applicable.

Source timing/planning: `{"tabelog": {"callCount": 1, "latencyMs": 2695, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 41790, "retrieval": {"rewrites": 0, "regionPages": 2, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Supplied category \"Tempura\" directly matches the hard criterion (tempura restaurant) in the same region.", "categoryUrl": "https://tabelog.com/en/tokyo/A1320/rstLst/tempura/"}, "elapsedMs": 21977, "parsedCount": 20}], "selection": {"accepted": true, "reason": "Supplied category \"Tempura\" directly matches the hard criterion (tempura restaurant) in the same region.", "categoryUrl": "https://tabelog.com/en/tokyo/A1320/rstLst/tempura/"}}, "failureCode": null}, "tablecheck": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 30824, "retrieval": {"selection": {"accepted": true, "reason": "Retrieve tempura restaurants matching the hard criterion in Kichijōji.", "keyword": "tempura", "criterionRef": "criterion:0"}, "rewrites": 0, "regionPages": 0, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Retrieve tempura restaurants matching the hard criterion in Kichijōji.", "keyword": "tempura", "criterionRef": "criterion:0"}, "elapsedMs": 10419, "parsedCount": 20}]}, "failureCode": null}, "google-places": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": null, "sourceElapsedMs": null, "retrieval": null, "failureCode": null}}`

Google recorded request context: `[{"sequence": 242, "sourceId": "google-places", "sourceRequestContext": {"textQuery": "tempura Kichijōji"}, "candidates": 40}]`

- [summary](runs/p2-kichijoji-tempura-20261027/attempt-1-user-seventh-20261020/probe-summary.json) — SHA-256 `ee85606d9825dcc196188754319016bab34507ebe04b2d051d2976d4ac3efac8`
- [decisions](runs/p2-kichijoji-tempura-20261027/attempt-1-user-seventh-20261020/probe.decisions.jsonl) — SHA-256 `1353ee152bd1dd5bcff4ab996d48aae1b4e49029373b99ff9bad4933fb82ff1d`
- [recording](runs/p2-kichijoji-tempura-20261027/attempt-1-user-seventh-20261020/recording/p2-kichijoji-tempura-20261027/recording.json) — SHA-256 `742d227a449fa729b0662e423ede18e3aede568b1eb9a110fa97529400da3a7e`
- [trace](runs/p2-kichijoji-tempura-20261027/attempt-1-user-seventh-20261020/trace.jsonl) — SHA-256 `9b58482dd319ef01f0b7f31d7ce50d56d24075d243f980028764213d2de740bb`

Retrieval attempts (original order; repeated observations retained):

| Source | Type | Keyword/category | Parsed/displayed | URL | Decision/reason |
| --- | --- | --- | --- | --- | --- |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/139465 | https://tabelog.com/en/tokyo/ | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/2819 | https://tabelog.com/en/tokyo/A1320/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/2819 | https://tabelog.com/en/tokyo/A1320/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | English | 20/22 | https://tabelog.com/en/tokyo/A1320/rstLst/tempura/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | SEARCH_AVAILABILITY_HINT | Tempura | 7/7 | https://tabelog.com/en/tokyo/A1320/rstLst/tempura/?vac_net=1&svd=20261027&svt=1800&svps=2 | EXECUTOR_AUTHORITATIVE_REQUEST: OBSERVED_QUERY_MATCH |
| tabelog | SEARCH_AVAILABILITY_HINT | Tempura | 7/7 | https://tabelog.com/en/tokyo/A1320/rstLst/tempura/?vac_net=1&svd=20261027&svt=1800&svps=2 | EXECUTOR_AUTHORITATIVE_REQUEST: OBSERVED_QUERY_MATCH |
| tablecheck | KEYWORD | tempura | 20/None | https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.704096&geo_longitude=139.58020539999998&geo_distance=1km&auto_geolocate=false&search_text=tempura | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |
| google-places | CATEGORY_OR_GENERAL_LIST | None | None/None | google-places:nearby-search | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |

### p2-kichijoji-tempura-20261027 / 2

Boundary **ABSENT**; failures `[]`; termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`.

- tabelog: `{"status": "APPLIED", "reason": "OBSERVED_QUERY_MATCH", "sourceUrl": "https://tabelog.com/en/tokyo/A1320/rstLst/tempura/?vac_net=1&svd=20261027&svt=1800&svps=2", "unfilteredUrl": "https://tabelog.com/en/tokyo/A1320/rstLst/tempura/", "request": {"date": "2026-10-27", "partySize": 2, "time": "18:00"}, "observed": {"date": "2026-10-27", "partySize": 2, "time": "18:00"}, "parsedCount": 7}`
- tablecheck: `{"status": "SKIPPED", "reason": "FILTER_TRANSPORT_NOT_REVIEWED", "sourceUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.704096&geo_longitude=139.58020539999998&geo_distance=1km&auto_geolocate=false&search_text=tempura", "unfilteredUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.704096&geo_longitude=139.58020539999998&geo_distance=1km&auto_geolocate=false&search_text=tempura"}`
- google-places: no hint reached/applicable.

Source timing/planning: `{"tabelog": {"callCount": 1, "latencyMs": 2737, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 47662, "retrieval": {"rewrites": 0, "regionPages": 2, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Supplied category \"Tempura\" directly matches the hard criterion (tempura restaurant) in the same region.", "categoryUrl": "https://tabelog.com/en/tokyo/A1320/rstLst/tempura/"}, "elapsedMs": 20678, "parsedCount": 20}], "selection": {"accepted": true, "reason": "Supplied category \"Tempura\" directly matches the hard criterion (tempura restaurant) in the same region.", "categoryUrl": "https://tabelog.com/en/tokyo/A1320/rstLst/tempura/"}}, "failureCode": null}, "tablecheck": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 21928, "retrieval": {"selection": {"accepted": true, "reason": "Searching the hard criterion \"tempura restaurant\" directly by keyword in Kichijōji.", "keyword": "tempura", "criterionRef": "criterion:0"}, "rewrites": 0, "regionPages": 0, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Searching the hard criterion \"tempura restaurant\" directly by keyword in Kichijōji.", "keyword": "tempura", "criterionRef": "criterion:0"}, "elapsedMs": 7646, "parsedCount": 20}]}, "failureCode": null}, "google-places": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": null, "sourceElapsedMs": null, "retrieval": null, "failureCode": null}}`

Google recorded request context: `[{"sequence": 242, "sourceId": "google-places", "sourceRequestContext": {"textQuery": "tempura Kichijōji"}, "candidates": 40}]`

- [summary](runs/p2-kichijoji-tempura-20261027/attempt-2-user-seventh-20261020/probe-summary.json) — SHA-256 `4ed103b3c353223342526a3a7704a36289ba24012563e898ec78e6ed9600cc7b`
- [decisions](runs/p2-kichijoji-tempura-20261027/attempt-2-user-seventh-20261020/probe.decisions.jsonl) — SHA-256 `560b299a620885c8fc37bb65211be968e16c62eb3251c4908234f75007b98dbe`
- [recording](runs/p2-kichijoji-tempura-20261027/attempt-2-user-seventh-20261020/recording/p2-kichijoji-tempura-20261027/recording.json) — SHA-256 `1c4a88809e87ab06e185d692bfa26c9b7f9151425b795713ab30178f670efa08`
- [trace](runs/p2-kichijoji-tempura-20261027/attempt-2-user-seventh-20261020/trace.jsonl) — SHA-256 `73306131c1c1d7c04264a942ea5d4821af01be4377c4d1bd2743d176dd69fedb`

Retrieval attempts (original order; repeated observations retained):

| Source | Type | Keyword/category | Parsed/displayed | URL | Decision/reason |
| --- | --- | --- | --- | --- | --- |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/139464 | https://tabelog.com/en/tokyo/ | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/2818 | https://tabelog.com/en/tokyo/A1320/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/2818 | https://tabelog.com/en/tokyo/A1320/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | English | 20/22 | https://tabelog.com/en/tokyo/A1320/rstLst/tempura/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | SEARCH_AVAILABILITY_HINT | Tempura | 7/7 | https://tabelog.com/en/tokyo/A1320/rstLst/tempura/?vac_net=1&svd=20261027&svt=1800&svps=2 | EXECUTOR_AUTHORITATIVE_REQUEST: OBSERVED_QUERY_MATCH |
| tabelog | SEARCH_AVAILABILITY_HINT | Tempura | 7/7 | https://tabelog.com/en/tokyo/A1320/rstLst/tempura/?vac_net=1&svd=20261027&svt=1800&svps=2 | EXECUTOR_AUTHORITATIVE_REQUEST: OBSERVED_QUERY_MATCH |
| tablecheck | KEYWORD | tempura | 20/None | https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.704096&geo_longitude=139.58020539999998&geo_distance=1km&auto_geolocate=false&search_text=tempura | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |
| google-places | CATEGORY_OR_GENERAL_LIST | None | None/None | google-places:nearby-search | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |

### p2-kf-h005-20261029 / 2

Boundary **ABSENT**; failures `[]`; termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`.

- tabelog: `{"status": "APPLIED", "reason": "OBSERVED_QUERY_MATCH", "sourceUrl": "https://tabelog.com/en/tokyo/A1301/rstLst/washoku/?vac_net=1&svd=20261029&svt=1800&svps=4", "unfilteredUrl": "https://tabelog.com/en/tokyo/A1301/rstLst/washoku/", "request": {"date": "2026-10-29", "partySize": 4, "time": "18:00"}, "observed": {"date": "2026-10-29", "partySize": 4, "time": "18:00"}, "parsedCount": 18}`
- tablecheck: `{"status": "SKIPPED", "reason": "FILTER_TRANSPORT_NOT_REVIEWED", "sourceUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6697&geo_longitude=139.767&geo_distance=1km&auto_geolocate=false&search_text=local+food", "unfilteredUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6697&geo_longitude=139.767&geo_distance=1km&auto_geolocate=false&search_text=local+food"}`
- google-places: no hint reached/applicable.

Source timing/planning: `{"tabelog": {"callCount": 1, "latencyMs": 2447, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 54420, "retrieval": {"rewrites": 0, "regionPages": 2, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Local food is a HARD criterion; expanding to the supplied Washoku (Japanese cuisine) category best matches it.", "categoryUrl": "https://tabelog.com/en/tokyo/A1301/rstLst/washoku/"}, "elapsedMs": 25039, "parsedCount": 20}], "selection": {"accepted": true, "reason": "Local food is a HARD criterion; expanding to the supplied Washoku (Japanese cuisine) category best matches it.", "categoryUrl": "https://tabelog.com/en/tokyo/A1301/rstLst/washoku/"}}, "failureCode": null}, "tablecheck": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 22403, "retrieval": {"selection": {"accepted": true, "reason": "Initial retrieval for the hard criterion \"local food\" using a short keyword.", "keyword": "local food", "criterionRef": "criterion:0"}, "rewrites": 0, "regionPages": 0, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Initial retrieval for the hard criterion \"local food\" using a short keyword.", "keyword": "local food", "criterionRef": "criterion:0"}, "elapsedMs": 8325, "parsedCount": 20}]}, "failureCode": null}, "google-places": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": null, "sourceElapsedMs": null, "retrieval": null, "failureCode": null}}`

Google recorded request context: `[{"sequence": 242, "sourceId": "google-places", "sourceRequestContext": {"textQuery": "local food nearby"}, "candidates": 37}]`

- [summary](runs/p2-kf-h005-20261029/attempt-2-user-seventh-20261020/probe-summary.json) — SHA-256 `79ce828d6631561441969d64bfe35a6837e476996b110175bfe525a850e14113`
- [decisions](runs/p2-kf-h005-20261029/attempt-2-user-seventh-20261020/probe.decisions.jsonl) — SHA-256 `e920fcc77a930c00ccb01d8c110a28b4a8b3e1055a607fdc11ed961dcca2e171`
- [recording](runs/p2-kf-h005-20261029/attempt-2-user-seventh-20261020/recording/p2-kf-h005-20261029/recording.json) — SHA-256 `11316e38bac6aaac17dc4a4ca50d77b99626716e5cab4293b3a9595b0447cd56`
- [trace](runs/p2-kf-h005-20261029/attempt-2-user-seventh-20261020/trace.jsonl) — SHA-256 `965d6277f01a5835ba5dece0c8ed5e3e25baafeb03f79363fab000c6adfdd8a2`

Retrieval attempts (original order; repeated observations retained):

| Source | Type | Keyword/category | Parsed/displayed | URL | Decision/reason |
| --- | --- | --- | --- | --- | --- |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/139466 | https://tabelog.com/en/tokyo/ | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/6249 | https://tabelog.com/en/tokyo/A1301/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/6249 | https://tabelog.com/en/tokyo/A1301/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | English | 20/2273 | https://tabelog.com/en/tokyo/A1301/rstLst/washoku/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | SEARCH_AVAILABILITY_HINT | None | 18/985 | https://tabelog.com/en/tokyo/A1301/rstLst/washoku/?vac_net=1&svd=20261029&svt=1800&svps=4 | EXECUTOR_AUTHORITATIVE_REQUEST: OBSERVED_QUERY_MATCH |
| tabelog | SEARCH_AVAILABILITY_HINT | None | 18/985 | https://tabelog.com/en/tokyo/A1301/rstLst/washoku/?vac_net=1&svd=20261029&svt=1800&svps=4 | EXECUTOR_AUTHORITATIVE_REQUEST: OBSERVED_QUERY_MATCH |
| tablecheck | KEYWORD | local food | 20/None | https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6697&geo_longitude=139.767&geo_distance=1km&auto_geolocate=false&search_text=local+food | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |
| google-places | CATEGORY_OR_GENERAL_LIST | None | None/None | google-places:nearby-search | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |

## Preflight, integrity and cumulative usage

| Index / repeat | Outer start UTC | Outcome | Models | Observation |
| --- | --- | --- | --- | --- |
| 0 / 1 | 2026-10-19T12:33:35.461341+00:00 | NO_PROBE_SUMMARY | 0 | Setup interrupted before preflight |
| 0 / 1 | 2026-10-19T12:49:03.411645+00:00 | ENV_FAILURE | 0 | TABLECHECK HTTP503 |
| 0 / 1 | 2026-10-19T12:59:43.645412+00:00 | ENV_FAILURE | 0 | TABLECHECK HTTP503 |
| 0 / 1 | 2026-10-19T14:40:31.516305+00:00 | ENV_FAILURE | 0 | TABLECHECK HTTP503 |
| 0 / 1 | 2026-10-19T14:54:30.243968+00:00 | ENV_FAILURE | 0 | TABLECHECK HTTP503 |
| 0 / 1 | 2026-10-20T02:07:09.618912+00:00 | ENV_FAILURE | 0 | ENV_FAILURE; tabelog:20/200/None, tablecheck:None/None/NO_RESPONSE, google-places:None/None/NO_RESPONSE |
| 0 / 1 | 2026-10-20T02:48:13.749379+00:00 | PROBE_RECORDED | 4 | READY; tabelog:20/200/None, tablecheck:122/200/None, google-places:1/None/None |
| 1 / 2 | 2026-10-20T02:50:30.050921+00:00 | ENV_FAILURE | 0 | TABLECHECK HTTP403 |
| 1 / 2 | 2026-10-20T03:07:10.201608+00:00 | ENV_FAILURE | 0 | TABLECHECK HTTP403 |
| 1 / 2 | 2026-10-20T04:06:53.039782+00:00 | PROBE_RECORDED | 4 | READY; tabelog:20/200/None, tablecheck:122/200/None, google-places:1/None/None |
| 2 / 1 | 2026-10-20T04:10:12.453192+00:00 | PROBE_RECORDED | 8 | READY; tabelog:20/200/None, tablecheck:122/200/None, google-places:1/None/None |
| 3 / 2 | 2026-10-20T04:13:20.135255+00:00 | PROBE_RECORDED | 8 | READY; tabelog:20/200/None, tablecheck:122/200/None, google-places:1/None/None |
| 4 / 1 | 2026-10-20T04:16:53.625895+00:00 | PROBE_RECORDED | 3 | READY; tabelog:20/200/None, tablecheck:122/200/None, google-places:1/None/None |
| 5 / 2 | 2026-10-20T04:19:40.940414+00:00 | ENV_FAILURE | 0 | TABLECHECK HTTP503 |
| 8 / 1 | 2026-10-20T04:56:20.156850+00:00 | PROBE_RECORDED | 4 | READY; tabelog:20/200/None, tablecheck:122/200/None, google-places:1/None/None |
| 9 / 1 | 2026-10-20T05:03:46.223562+00:00 | ENV_FAILURE | 0 | ENV_FAILURE; tabelog:None/429/NO_RESPONSE, tablecheck:122/200/None, google-places:1/None/None |
| 9 / 1 | 2026-10-20T05:32:31.425408+00:00 | PROBE_RECORDED | 9 | READY; tabelog:20/200/None, tablecheck:122/200/None, google-places:1/None/None |
| 6 / 1 | 2026-10-20T05:41:03.348687+00:00 | PROBE_RECORDED | 3 | READY; tabelog:20/200/None, tablecheck:122/200/None, google-places:1/None/None |
| 7 / 2 | 2026-10-20T05:49:07.276958+00:00 | PROBE_RECORDED | 3 | READY; tabelog:20/200/None, tablecheck:122/200/None, google-places:1/None/None |
| 5 / 2 | 2026-10-20T05:57:04.227233+00:00 | PROBE_RECORDED | 3 | READY; tabelog:20/200/None, tablecheck:122/200/None, google-places:1/None/None |

Historical checkpoint count starts0 and was6 before this continuation; latest counter 6. Counts/stops/history retained. Earlier403 proof remains PREFLIGHT_EVIDENCE_GAP in historical records. Current frozen policy omits TableCheck homepage GET, preserves the historical counter and uses the approved per-item15min single retry instead of the old cumulative threshold. [Full timeline/raw metadata](user-resume-seventh-20261020/preflight-timeline.json).

Recorded corrected-B formal probes **10/10**; remaining **0**. Corrected-B models **49**, Google formal/preflight **19/12**. Cumulative **327/450 models**, **54/55 probes**, **148 Google**, **0 full Live**. Latest continuation adds4 formal probes, 18 models, 8 formalGoogle+4 preflightGoogle. No completed formal probe rerun.

Decision outcomes `{'SUCCEEDED': 49}`; each saved probe's rows equal its model calls. Original329 frozen hashes and2893 historical hashes unchanged; current826 manifest and source262/gate-log hashes checked for reuse. Five gates remain PASS: typecheck, arch, build, default951/951, local Chromium119/119. No extra paid L3 replay. Artifact compressed estimate54638987 bytes /60000000.

## Seventh-probe recovery outcome

Status **COMPLETE**, stop `None`. The current human-authorized continuation only reused the original discovery slice: no per-candidate availability inventory, delivery, full Live, code repair, P2-2/P2-3 replay or witness search. A scoped host route was repaired before the earlier capsule; all current attempted items use the approved three-target network check and unchanged real-browser source-data readiness. User's host routes are an environment change and limit single-variable comparison claims.

H002 is reported under the HARD-keyword correction; other nine under P2-1b plus its approved corrections. Actual Google trace contexts are listed above, separately from planned URL labels. Native witness matching and Google website-derived exact IDs follow frozen rules; name-only matches do not count. Independent frozen network audit ABSENT, where observed, covers that recorded trajectory only; it is not a universal public-read safety certificate. Any unrun row remains NOT_REACHED. The discovery metric report does not substitute for full-task diagnostic evaluation.

[Current receipt](user-resume-seventh-20261020/freeze-commit.json), [continuation summary](user-resume-seventh-20261020/attempt-summary.json), [prefix synchronization proof](user-resume-seventh-20261020/ledger-sync-proof.json), [final verification](user-resume-seventh-20261020/post-change-verification.json). No automatic retry or further run scheduled. Push under existing authorization after evidence/docs checks, then stop for independent review.

## 第七次恢复后的实际完成记录

用户“继续第七次”恢复中目黑原0模型预检失败项；之后按此前批准顺序完成吉祥寺两次和KF-H005第二次。原已完成六项全部未重跑。修正B **10/10探测已记录**，不是完整任务交付验收。

| 顺序 | 用例 | 正式耗时ms | 模型调用 | Google正式/来源预检 | Tabelog见证列表/首批 | Google精确见证 | 来源失败码 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | p2-nakameguro-yakiniku-20261030 / 1 | 66740 | 9 | 2/1 | 0/0 | 1 | ['READ_BUDGET_EXCEEDED'] |
| 8 | p2-kichijoji-tempura-20261027 / 1 | 74501 | 3 | 2/1 | 1/1 | 1 | [] |
| 9 | p2-kichijoji-tempura-20261027 / 2 | 71563 | 3 | 2/1 | 1/1 | 1 | [] |
| 10 | p2-kf-h005-20261029 / 2 | 79170 | 3 | 2/1 | 1/0 | 0 | [] |

四次来源数据预检均READY：Tabelog20、TableCheck122、Google1；TableCheck状态200，Google来源预检未保留HTTP状态，不填造200。网络预检均只包含DeepSeek、Google、Tabelog。没有新的403/503/繁忙页信号，没有自动重试；旧六次计数、429原始响应和全部停止/恢复历史保留，未重新标注旧运行。

本轮增加4正式探测、18模型、8正式Google＋4来源预检Google。修正B共49模型、19正式Google＋12来源预检Google；累计 **327/450模型、54/55正式探测、148 Google、0完整Live**。压缩artifact估算54,638,987 bytes/60,000,000；原先注册见证认证仍覆盖全部运行，不新增认证或见证GET。

完整A/B十行均已比较，H002的HARD修正与其余9例P2-1b分组。整体Tabelog首批见证A5/10→B5/10；H002为0→1，其余9例为5→4。Tabelog列表A8→B7、Google精确A5→B4，TableCheck0→0。A/B模型均49，正式耗时942,173→806,489ms；规划22→18次、56,097→40,607ms，规划超时均0。READ_BUDGET_EXCEEDED从A2次到B3次（B神乐坂两次、中目黑一次）。这些是本批观察，不把耗时减少当成能力改善，也不作单变量因果结论；来源、模型、宿主路由与外层节奏差异均保留。

已停止新探测，完整Live未开始，自动化保持暂停；结果提交推送后等待独立复核。
[账本前缀证明](user-resume-seventh-20261020/ledger-sync-proof.json)、[实际间隔](user-resume-seventh-20261020/pacing-verification.json)、[四次来源就绪原始路径与SHA](user-resume-seventh-20261020/actual-readiness-verification.json)、[最终核验](user-resume-seventh-20261020/post-change-verification.json)。
