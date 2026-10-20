# P2-1 corrected checkpoint B — discovery only

Status **PARTIAL**: 5/10 recorded; stop={'code': 'PREFLIGHT_FAILURE_LIMIT', 'index': 5, 'checkpointPreflightFailures': 5, 'sourceIds': []}. Exposed development inputs; no availability investigation, delivery or full Live.

## Changes, gates and freeze

- Review4592a1e read before work; approved scope is the three corrections and checkpoint-local outer recovery only. [B 第一版 exclusion](superseded-b-first.json) preserves its3 runs/17 calls and all historical bytes; none enter this comparison. Its h001 repeat2 was QUERY_NOT_REPRESENTABLE, correcting the old report sentence.
- Production freeze `a37e152b4283d8f407c9650d19200708314e3362`; comparison A `ba20b8a7e0ae5d00d93838f7f19b0ae01364e2be`. Prior HARD correction `884c56b`, original P2-1b `4975f9f` retained. Prompt restaurant-discovery-retrieval-prompt@5; Schema restaurant_discovery_retrieval@2. [Five gates/red-green](fixes/verification.json). [Offline TableCheck diagnosis](fixes/tablecheck-diagnosis.json) used0 network/models.
- Homepage filters use the already observed same-region list root; no guessed or foreign root. Sparse (<5) with categories and rewrites remaining excludes KEEP in Schema, Domain and executor. No categories or two rewrites exhausted still permit it. Invalid proposals retain the bounded general-list fallback, without additional model retries.
- TableCheck original3 filter pages displayed Search is unavailable right now, not a normal empty list. Filter OPTIONS contained unreviewed open_from/open_until; selected labels omit the year as a secondary gap. Search filtering is now SKIPPED/FILTER_TRANSPORT_NOT_REVIEWED; ordinary discovery remains. No network permission expansion.
- Original [code/input freeze](freeze.json)329 files and all historical bytes remain unchanged. Current continuation [freeze](network-fixed-resume-20261020/freeze.json)408 files, commit `9b1e5f17fd604c98bca5d302a26f8cd82203f989`, [receipt](network-fixed-resume-20261020/freeze-commit.json), outer SHA `180d48674c1d923840685fd8494d6f2d8a23d3adafeebcf3815482628b27ec6c`. Production a37e152, same ten plan entries, six semantic input files, metrics, limits and reviewed rules. [28 offline controls](network-fixed-resume-20261020/offline-controls.json), [pre-launch verification](network-fixed-resume-20261020/pre-launch-verification.json).
- Registered witness renewal was frozen before the first formal B at8f39756:16 registered identities/32 public GETs/0 models/Google; all6 active supported ID sets unchanged. Registry SHA `a43cfe1ba6626a4d4a692612879191f65aafe8d0302ad7633edaf6a4a6a9cf44`, earliest expiry `2026-10-21T02:47:04.643Z`. No further renewal during this continuation. [Registry](start-b-20261020/witnesses.certified.json), [independent raw binding verification](start-b-20261020/witness-certification/verification.json), [ID comparison](start-b-20261020/witness-comparison.json).
- The first B run(index0) used8f39756 and is preserved without rerun. Earlier two403 preflights and all503 failures remain in the ledger. The first launch manifest390's top-level outer/witness/expiry fields retained old metadata; its file map and receipt bound the actual values. Current408 manifest metadata is consistent. The previous report is retained in [report-before-resume](network-fixed-resume-20261020/report-before-resume.md).
- The latest human request authorizes only pending indices1-9 after host network repair. Four historical countable failures, completed index0 and all Google/model accounting are retained; not reset. Every original network/source-data preflight must pass. Any newstop ends this launch, no automatic additional retry. Earlier recovery windows are historical, not new retry authority. Host repair observations and current domain routes are [recorded](network-fixed-resume-20261020/network-facts.json); they do not replace source preflight.
- Source-owned production delta from4592a1e: source-packs +10/-32, net-22 lines. No unrelated deletions to offset shared changes. Full source/net-zero phase exit is not certified.

## Evaluation and comparison scope

- End-to-end: only the promised discovery first-batch slice is measured. Full user delivery/slot inventory NOT_EVALUATED. Listing filters never produce an Offer or availability evidence.
- Stages: source-specific witness listing/first-batch IDs; Google requires exact website-derived source ID. Similar names separate. Radius counts are parsed coordinate candidates, not qualified/deduplicated restaurants; listing hits may come from region navigation.
- Severity: independent frozen network rules audit recorded requests, separately from production Guard. ABSENT in these traces does not prove all public GETs safe; ADR-0036 residual limitations remain.
- Attribution: H002 is the approved HARD-keyword correction group; the other nine rows are P2-1b including these approved homepage/sparse-KEEP/TableCheck corrections. Host routing repair, public-data and model-choice fluctuation prevent a statistical or single-factor causal claim. L0/L1 local evidence and real-model discovery probes are separate; no paid offline replay added.
- Recording evidence: manifests/assets are retained with their original SHA. Current replay flags {"NOT_REPLAYABLE/UNSAFE_DOCUMENT": 5}; these recordings are not claimed to support executable static replay. Independent request audit and frozen probe metrics do not require static reconstruction.

## Aggregate (complete/common rows separated)

| Metric | A all10 | A comparable rows | B recorded rows |
| --- | --- | --- | --- |
| runs | 10 | 5 | 5 |
| models | 49 | 29 | 27 |
| elapsedMs | 942173 | 485542 | 428643 |
| planningCalls | 22 | 10 | 10 |
| planningMs | 56097 | 25673 | 22008 |
| planningTimeouts | 0 | 0 | 0 |
| listing | {'tabelog': 8, 'tablecheck': 0, 'google-places': 5} | {'tabelog': 3, 'tablecheck': 0, 'google-places': 2} | {'tabelog': 3, 'tablecheck': 0, 'google-places': 1} |
| firstBatch | {'tabelog': 5, 'tablecheck': 0} | {'tabelog': 2, 'tablecheck': 0} | {'tabelog': 2, 'tablecheck': 0} |
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
| p2-kf-h002-20261031 / 1 | HARD_KEYWORD_CORRECTION | 1,0 → NOT_REACHED | 0,0 → NOT_REACHED | 0 → NOT_REACHED | 10 → NOT_REACHED |
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
| p2-kf-h002-20261031 / 1 | 7 → NOT_REACHED | 101016 → NOT_REACHED | 9 → NOT_REACHED | 4/8535 → NOT_REACHED | 0 → NOT_REACHED | NOT_REACHED |
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

Historical checkpoint count starts0 and was4 before this continuation; latest counter 5. Counts/stops/history retained. Frozen classifier recognizes TableCheck503 only; prior403 proof remains PREFLIGHT_EVIDENCE_GAP, not silently fixed or counter-adjusted. [Full timeline/raw metadata](network-fixed-resume-20261020/preflight-timeline.json).

Recorded corrected-B formal probes **5/10**; remaining **5**. Corrected-B models **27**, Google formal/preflight **10/6**. Cumulative **305/450 models**, **49/55 probes**, **133 Google**, **0 full Live**. Latest continuation adds4 formal probes, 23 models, 8 formalGoogle+4 preflightGoogle. No completed formal probe rerun.

Decision outcomes `{'SUCCEEDED': 27}`; each saved probe's rows equal its model calls. Original329 frozen hashes and2893 historical hashes unchanged; current408 manifest and source262/gate-log hashes checked for reuse. Five gates remain PASS: typecheck, arch, build, default951/951, local Chromium119/119. No extra paid L3 replay. Artifact compressed estimate49582625 bytes /60000000.

## Network-repaired continuation outcome

Status **PARTIAL_STOPPED**, stop `{'code': 'PREFLIGHT_FAILURE_LIMIT', 'index': 5, 'checkpointPreflightFailures': 5, 'sourceIds': []}`. The current human-authorized continuation only reused the original discovery slice: no per-candidate availability inventory, delivery, full Live, code repair, P2-2/P2-3 replay or witness search. User added a scoped physical-interface route before this capsule; source preflights ran for every attempted item. User's host routes are an environment change and limit single-variable comparison claims.

H002 is reported under the HARD-keyword correction; other nine under P2-1b plus its approved corrections. Actual Google trace contexts are listed above, separately from planned URL labels. Native witness matching and Google website-derived exact IDs follow frozen rules; name-only matches do not count. Independent frozen network audit ABSENT, where observed, covers that recorded trajectory only; it is not a universal public-read safety certificate. Any unrun row remains NOT_REACHED. The discovery metric report does not substitute for full-task diagnostic evaluation.

[Current receipt](network-fixed-resume-20261020/freeze-commit.json), [continuation summary](network-fixed-resume-20261020/attempt-summary.json), [prefix synchronization proof](network-fixed-resume-20261020/ledger-sync-proof.json), [final verification](network-fixed-resume-20261020/post-change-verification.json). No automatic retry or further run scheduled. Push under existing authorization after evidence/docs checks, then stop for independent review.
