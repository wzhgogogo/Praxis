# P2-1 corrected checkpoint B — discovery only

Status **PARTIAL**: 6/10 recorded; stop={'code': 'PREFLIGHT_EVIDENCE_GAP', 'index': 9}. Exposed development inputs; no availability investigation, delivery or full Live.

## Changes, gates and freeze

- Review4592a1e read before work; approved scope is the three corrections and checkpoint-local outer recovery only. [B 第一版 exclusion](superseded-b-first.json) preserves its3 runs/17 calls and all historical bytes; none enter this comparison. Its h001 repeat2 was QUERY_NOT_REPRESENTABLE, correcting the old report sentence.
- Production freeze `a37e152b4283d8f407c9650d19200708314e3362`; comparison A `ba20b8a7e0ae5d00d93838f7f19b0ae01364e2be`. Prior HARD correction `884c56b`, original P2-1b `4975f9f` retained. Prompt restaurant-discovery-retrieval-prompt@5; Schema restaurant_discovery_retrieval@2. [Five gates/red-green](fixes/verification.json). [Offline TableCheck diagnosis](fixes/tablecheck-diagnosis.json) used0 network/models.
- Homepage filters use the already observed same-region list root; no guessed or foreign root. Sparse (<5) with categories and rewrites remaining excludes KEEP in Schema, Domain and executor. No categories or two rewrites exhausted still permit it. Invalid proposals retain the bounded general-list fallback, without additional model retries.
- TableCheck original3 filter pages displayed Search is unavailable right now, not a normal empty list. Filter OPTIONS contained unreviewed open_from/open_until; selected labels omit the year as a secondary gap. Search filtering is now SKIPPED/FILTER_TRANSPORT_NOT_REVIEWED; ordinary discovery remains. No network permission expansion.
- Original [code/input freeze](freeze.json)329 files and all historical bytes remain unchanged. Current continuation [freeze](browser-ready-resume-20261020/freeze.json)738 files, commit `31866be3fbe104ccf696361e8f4a50edc14aaf3f`, [receipt](browser-ready-resume-20261020/freeze-commit.json), outer SHA `52543ba3a0c9f4885e929ca7a74668ff46b9a00256cbc969ea7d43a22751041c`. Production a37e152, same ten plan entries, six semantic input files, metrics, limits and reviewed rules. [18 transport/observer controls](browser-ready-resume-20261020/offline-network-contrasts.json), [26 timing/retry controls](browser-ready-resume-20261020/offline-policy-controls.json), [5 unchanged-input plan checks](browser-ready-resume-20261020/offline-plan-verification.json), [pre-launch verification](browser-ready-resume-20261020/pre-launch-verification.json).
- Registered witness renewal was frozen before the first formal B at8f39756:16 registered identities/32 public GETs/0 models/Google; all6 active supported ID sets unchanged. Registry SHA `a43cfe1ba6626a4d4a692612879191f65aafe8d0302ad7633edaf6a4a6a9cf44`, earliest expiry `2026-10-21T02:47:04.643Z`. No further renewal during this continuation. [Registry](start-b-20261020/witnesses.certified.json), [independent raw binding verification](start-b-20261020/witness-certification/verification.json), [ID comparison](start-b-20261020/witness-comparison.json).
- The first B run(index0) used8f39756 and is preserved without rerun. Earlier two403 preflights and all503 failures remain in the ledger. The first launch manifest390's top-level outer/witness/expiry fields retained old metadata; its file map and receipt bound the actual values. Current738 manifest metadata is consistent. The previous report is retained in [report-before-resume](browser-ready-resume-20261020/report-before-resume.md).
- The latest human request authorizes pending indices8,9,6,7,5 in that order. Completed indices0-4 and historical failure count5 are retained. TableCheck readiness uses only unchanged real-browser nonempty source search; other three network checks remain. Normal spacing is at least300s from previous attempt end. Confirmed403/503 or explicit busy page allows one retry after900s, persistent failure stops; other failures and safety stops end the batch. Host repair facts are retained in [previous capsule](network-fixed-resume-20261020/network-facts.json).
- Source-owned production delta from4592a1e: source-packs +10/-32, net-22 lines. No unrelated deletions to offset shared changes. Full source/net-zero phase exit is not certified.

## Evaluation and comparison scope

- End-to-end: only the promised discovery first-batch slice is measured. Full user delivery/slot inventory NOT_EVALUATED. Listing filters never produce an Offer or availability evidence.
- Stages: source-specific witness listing/first-batch IDs; Google requires exact website-derived source ID. Similar names separate. Radius counts are parsed coordinate candidates, not qualified/deduplicated restaurants; listing hits may come from region navigation.
- Severity: independent frozen network rules audit recorded requests, separately from production Guard. ABSENT in these traces does not prove all public GETs safe; ADR-0036 residual limitations remain.
- Attribution: H002 is the approved HARD-keyword correction group; the other nine rows are P2-1b including these approved homepage/sparse-KEEP/TableCheck corrections. Host routing repair, public-data and model-choice fluctuation prevent a statistical or single-factor causal claim. L0/L1 local evidence and real-model discovery probes are separate; no paid offline replay added.

- Recording flags: {"NOT_REPLAYABLE/UNSAFE_DOCUMENT": 6}. Original manifest/assets are retained; executable static replay is not claimed.

## Aggregate (complete/common rows separated)

| Metric | A all10 | A comparable rows | B recorded rows |
| --- | --- | --- | --- |
| runs | 10 | 6 | 6 |
| models | 49 | 36 | 31 |
| elapsedMs | 942173 | 586558 | 514515 |
| planningCalls | 22 | 14 | 11 |
| planningMs | 56097 | 34208 | 24605 |
| planningTimeouts | 0 | 0 | 0 |
| listing | {'tabelog': 8, 'tablecheck': 0, 'google-places': 5} | {'tabelog': 4, 'tablecheck': 0, 'google-places': 2} | {'tabelog': 4, 'tablecheck': 0, 'google-places': 1} |
| firstBatch | {'tabelog': 5, 'tablecheck': 0} | {'tabelog': 2, 'tablecheck': 0} | {'tabelog': 3, 'tablecheck': 0} |
| failures | {'READ_BUDGET_EXCEEDED': 2} | {'READ_BUDGET_EXCEEDED': 2} | {'READ_BUDGET_EXCEEDED': 2} |

## Source and radius comparison

| Case / repeat | Variable group | Tabelog list,first A→B | TableCheck list,first A→B | Google exact A→B | Radius A→B |
| --- | --- | --- | --- | --- | --- |
| p2-kf-h001-20261027 / 1 | P2_1B_SEARCH_AVAILABILITY_HINTS | 1,1 → 1,1 | 0,0 → 0,0 | 1 → 1 | 40 → 43 |
| p2-kf-h001-20261027 / 2 | P2_1B_SEARCH_AVAILABILITY_HINTS | 1,1 → 1,1 | 0,0 → 0,0 | 1 → 0 | 44 → 44 |
| p2-kagurazaka-kaiseki-20261029 / 1 | P2_1B_SEARCH_AVAILABILITY_HINTS | 0,0 → 0,0 | 0,0 → 0,0 | 0 → 0 | 44 → 45 |
| p2-kagurazaka-kaiseki-20261029 / 2 | P2_1B_SEARCH_AVAILABILITY_HINTS | 0,0 → 0,0 | 0,0 → 0,0 | 0 → 0 | 44 → 45 |
| p2-kf-h005-20261029 / 1 | P2_1B_SEARCH_AVAILABILITY_HINTS | 1,0 → 1,0 | 0,0 → 0,0 | 0 → 0 | 49 → 49 |
| p2-kf-h005-20261029 / 2 | P2_1B_SEARCH_AVAILABILITY_HINTS | 1,0 → NOT_REACHED | 0,0 → NOT_REACHED | 0 → NOT_REACHED | 49 → NOT_REACHED |
| p2-kichijoji-tempura-20261027 / 1 | P2_1B_SEARCH_AVAILABILITY_HINTS | 1,1 → NOT_REACHED | 0,0 → NOT_REACHED | 1 → NOT_REACHED | 50 → NOT_REACHED |
| p2-kichijoji-tempura-20261027 / 2 | P2_1B_SEARCH_AVAILABILITY_HINTS | 1,1 → NOT_REACHED | 0,0 → NOT_REACHED | 1 → NOT_REACHED | 50 → NOT_REACHED |
| p2-kf-h002-20261031 / 1 | HARD_KEYWORD_CORRECTION | 1,0 → 1,1 | 0,0 → 0,0 | 0 → 0 | 10 → 30 |
| p2-nakameguro-yakiniku-20261030 / 1 | P2_1B_SEARCH_AVAILABILITY_HINTS | 1,1 → NOT_REACHED | 0,0 → NOT_REACHED | 1 → NOT_REACHED | 43 → NOT_REACHED |

## Resources A → B

Elapsed excludes external preflight. Shared text planning counted once. Unrun B is NOT_REACHED, not zero.

| Case / repeat | Models | Elapsed ms | Pages | Planning calls/ms | Planning timeouts | B Google formal |
| --- | --- | --- | --- | --- | --- | --- |
| p2-kf-h001-20261027 / 1 | 4 → 4 | 79187 → 84990 | 7 → 8 | 3/6958 → 3/6516 | 0 → 0 | 2 |
| p2-kf-h001-20261027 / 2 | 4 → 4 | 100591 → 80539 | 7 → 8 | 3/9659 → 3/6373 | 0 → 0 | 2 |
| p2-kagurazaka-kaiseki-20261029 / 1 | 9 → 8 | 126650 → 85248 | 8 → 8 | 1/2135 → 1/2223 | 0 → 0 | 2 |
| p2-kagurazaka-kaiseki-20261029 / 2 | 9 → 8 | 96753 → 98900 | 8 → 8 | 1/2306 → 1/2349 | 0 → 0 | 2 |
| p2-kf-h005-20261029 / 1 | 3 → 3 | 82361 → 78966 | 6 → 7 | 2/4615 → 2/4547 | 0 → 0 | 2 |
| p2-kf-h005-20261029 / 2 | 3 → NOT_REACHED | 86541 → NOT_REACHED | 6 → NOT_REACHED | 2/5436 → NOT_REACHED | 0 → NOT_REACHED | NOT_REACHED |
| p2-kichijoji-tempura-20261027 / 1 | 3 → NOT_REACHED | 100222 → NOT_REACHED | 6 → NOT_REACHED | 2/5980 → NOT_REACHED | 0 → NOT_REACHED | NOT_REACHED |
| p2-kichijoji-tempura-20261027 / 2 | 3 → NOT_REACHED | 84654 → NOT_REACHED | 6 → NOT_REACHED | 2/5844 → NOT_REACHED | 0 → NOT_REACHED | NOT_REACHED |
| p2-kf-h002-20261031 / 1 | 7 → 4 | 101016 → 85872 | 9 → 8 | 4/8535 → 1/2597 | 0 → 0 | 1 |
| p2-nakameguro-yakiniku-20261030 / 1 | 4 → NOT_REACHED | 84198 → NOT_REACHED | 7 → NOT_REACHED | 2/4629 → NOT_REACHED | 0 → NOT_REACHED | NOT_REACHED |

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

Historical checkpoint count starts0 and was5 before this continuation; latest counter 6. Counts/stops/history retained. Earlier403 proof remains PREFLIGHT_EVIDENCE_GAP in historical records. Current frozen policy omits TableCheck homepage GET, preserves the historical counter and uses the approved per-item15min single retry instead of the old cumulative threshold. [Full timeline/raw metadata](browser-ready-resume-20261020/preflight-timeline.json).

Recorded corrected-B formal probes **6/10**; remaining **4**. Corrected-B models **31**, Google formal/preflight **11/8**. Cumulative **309/450 models**, **50/55 probes**, **136 Google**, **0 full Live**. Latest continuation adds1 formal probes, 4 models, 1 formalGoogle+2 preflightGoogle. No completed formal probe rerun.

Decision outcomes `{'SUCCEEDED': 31}`; each saved probe's rows equal its model calls. Original329 frozen hashes and2893 historical hashes unchanged; current738 manifest and source262/gate-log hashes checked for reuse. Five gates remain PASS: typecheck, arch, build, default951/951, local Chromium119/119. No extra paid L3 replay. Artifact compressed estimate50634490 bytes /60000000.

## Browser source-readiness continuation outcome

Status **PARTIAL_STOPPED**, stop `{'code': 'PREFLIGHT_EVIDENCE_GAP', 'index': 9}`. The current human-authorized continuation only reused the original discovery slice: no per-candidate availability inventory, delivery, full Live, code repair, P2-2/P2-3 replay or witness search. A scoped host route was repaired before the earlier capsule; all current attempted items use the approved three-target network check and unchanged real-browser source-data readiness. User's host routes are an environment change and limit single-variable comparison claims.

H002 is reported under the HARD-keyword correction; other nine under P2-1b plus its approved corrections. Actual Google trace contexts are listed above, separately from planned URL labels. Native witness matching and Google website-derived exact IDs follow frozen rules; name-only matches do not count. Independent frozen network audit ABSENT, where observed, covers that recorded trajectory only; it is not a universal public-read safety certificate. Any unrun row remains NOT_REACHED. The discovery metric report does not substitute for full-task diagnostic evaluation.

[Current receipt](browser-ready-resume-20261020/freeze-commit.json), [continuation summary](browser-ready-resume-20261020/attempt-summary.json), [prefix synchronization proof](browser-ready-resume-20261020/ledger-sync-proof.json), [final verification](browser-ready-resume-20261020/post-change-verification.json). No automatic retry or further run scheduled. Push under existing authorization after evidence/docs checks, then stop for independent review.

## 本轮完成项、停止事实与剩余项

此前已完成5项均原样保留：H001 #1、H001 #2、神乐坂 #1、神乐坂 #2、KF-H005 #1。本轮新增 **H002 #1**，修正B共 **6/10**。H002正式发现85,872ms、4模型、1正式Google＋1来源预检Google；Tabelog见证进入列表和首批，TableCheck与Google未命中见证，半径内解析候选30个。共享文本规划0次，唯一的页面检索规划在Tabelog，Google记录上下文为 nearby:restaurant；H002仍在HARD修正组单列。

中目黑按至少5分钟间隔于UTC05:03:46.223启动预检：其他三项目标的网络检查通过；来源数据预检Tabelog列表返回 **HTTP429 / NO_RESPONSE / HTTP_STATUS**，TableCheck **HTTP200 / 122条**，Google **1条**。该次0模型、0正式探测，只产生1次来源预检Google。没有任何新的TableCheck首页网络GET。

本次没有403、503或已冻结忙碌原文匹配信号，因此外层走未匹配失败分支停批，未启动15分钟后重试。该分支的字面代码为 PREFLIGHT_EVIDENCE_GAP；本次实际已保存HTTP429状态证据，不能把该代码解释为“没有收到HTTP响应”。旧失败计数5→6只保留作历史记录，未触发旧累计阈值；停止原因是当前Tabelog来源就绪检查失败。HTTP429页面正文未保存，未获得繁忙页原文，不把原因归到VPN或站点防护。

剩余4项按已批准顺序为：**中目黑、吉祥寺 #1、吉祥寺 #2、KF-H005 #2**。均未在本轮正式启动；中目黑仅到达预检，其他3项NOT_REACHED。无额外重试或完整Live，自动化保持暂停，等待独立复核。

[停止事实及原始响应SHA](browser-ready-resume-20261020/stop-facts.json)、[中目黑来源预检](runs/p2-nakameguro-yakiniku-20261030/attempt-1-browser-ready-20261020/source-data-preflight.json)、[中目黑外层日志](browser-ready-resume-20261020/index-9.outer.log)、[H002实际就绪证据](browser-ready-resume-20261020/h002-readiness-proof.json)、[实际间隔核验](browser-ready-resume-20261020/pacing-verification.json)。
