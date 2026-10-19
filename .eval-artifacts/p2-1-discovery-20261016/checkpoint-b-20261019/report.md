# P2-1 checkpoint B — HARD retrieval correction and search availability hints

Status **PARTIAL**: 3/10 recorded; stop={'code': 'PREFLIGHT_FAILURE_LIMIT', 'index': 3, 'totalPreflightFailures': 3, 'sourceIds': []}. Exposed development **discovery probes only**. No availability investigation, delivery or full Live.

## Commits, gates and freeze

- Independent review38b058e was read and fast-forwarded before work.
- HARD retrieval correction/ADR append: `884c56b1a9998d350f7af666d71a8da43697e247`; Prompt@4, Schema@1. Old H002 controlled transport sent first-date text with one shared planning call; new production assembly sends Nearby with zero shared planning calls. SOFT/UNSPECIFIED remain inputs for observed category selection.
- P2-1b production: `4975f9f26120b01996e9e5157022ef95a5fd2c70`; five gates PASS: typecheck, architecture,948/948 default tests, build,119/119 local Chromium. [Gate hashes/red/green](search-hints/verification.json); [HARD red/green](hard-only/verification.json). Intermediate failures remain saved; final green files are explicit.
- Outer freeze commit: `c20001ab13b7d123d63642955b8f615a3ace631d`. [Freeze](freeze.json) binds315 source/config/script files; source worktree clean. [13 offline controls](offline-controls.json), [six zero-network/model parses](plan-only.json). No mid-batch configuration edits.
- Outer SHA-256 `f833a0075455474ca2816ef3b83d83495abe06a484252993004839027532b280`; independent reviewed reads `86c2203cba578ec604d5b87745325ad0b4e4d2b65ea08e7d53e8cb746d275f62`; witness bytes `9f44b01a38bf4abc7fce90ee8b07f6b73f72a02fdf75f2d1dd63c5483b2a5f4f`. Earliest witness expiry `2026-10-20T03:12:46.141Z`; certification reused without extra requests.
- Same ten A inputs, dates, center/radius, model configuration, source preflight and15-model/180-second ceilings. New GET filter shapes are independently frozen in [reviewed-reads.json](reviewed-reads.json). Filter/fallback consume original source pages and90seconds; values come only from authoritative intent.
- Source-owned production lines from884c56b: source-packs +53/-1, Tabelog query +2/-1, TableCheck query +3/-2, net **+54**. They encode source syntax and selected-value observation. No unrelated deletion for offset; phase-wide net-zero source-code exit condition is not certified.

## Comparison scope and four-layer evaluation

- End-to-end: this is the promised discovery first-batch slice; full user delivery is NOT_EVALUATED. No inventory/Offer is created from listing slots.
- Stages: source-specific listing/first-batch hits use frozen witness IDs; Google credit requires exact website source ID. Similar names remain separate. Radius counts are parsed coordinate candidates, not qualified or deduplicated restaurants. Raw-listing hits include broad region-navigation observations.
- Severity: recorded requests are checked by the independent frozen network rules, not production Guard verdicts. A clean recorded boundary is not universal proof against unknown GET effects; ADR-0036 limitations remain.
- Attribution: H002 is grouped under the approved HARD-keyword correction; other cases under P2-1b. Live fluctuations are recorded, not treated as statistical causal proof. Local L0/L1 tests and these real-model discovery observations are separate; no new offline paid-model replay in this batch.

## Aggregate observations (partial B; common rows separated)

Only completed pairs are comparable. Seven unstarted rows are NOT_REACHED, not failures or zeros. H002 has offline proof only; its checkpoint B website/Google behavior is NOT_REACHED.

| Metric | A all10 | A comparable rows | B recorded rows |
| --- | --- | --- | --- |
| runs | 10 | 3 | 3 |
| models | 49 | 17 | 17 |
| elapsedMs | 942173 | 306428 | 271982 |
| planningCalls | 22 | 7 | 7 |
| planningMs | 56097 | 18752 | 17635 |
| planningTimeouts | 0 | 0 | 0 |
| listing | {'tabelog': 8, 'tablecheck': 0, 'google-places': 5} | {'tabelog': 2, 'tablecheck': 0, 'google-places': 2} | {'tabelog': 2, 'tablecheck': 0, 'google-places': 2} |
| firstBatch | {'tabelog': 5, 'tablecheck': 0} | {'tabelog': 2, 'tablecheck': 0} | {'tabelog': 1, 'tablecheck': 0} |
| failures | {'READ_BUDGET_EXCEEDED': 2} | {'READ_BUDGET_EXCEEDED': 1} | {'READ_BUDGET_EXCEEDED': 1} |

## Source and radius comparison

| Case / repeat | Variable group | Tabelog list,first A→B | TableCheck list,first A→B | Google exact A→B | Radius A→B |
| --- | --- | --- | --- | --- | --- |
| p2-kf-h001-20261027 / 1 | P2_1B_SEARCH_AVAILABILITY_HINTS | 1,1 → 1,1 | 0,0 → 0,0 | 1 → 1 | 40 → 42 |
| p2-kf-h001-20261027 / 2 | P2_1B_SEARCH_AVAILABILITY_HINTS | 1,1 → 1,0 | 0,0 → 0,0 | 1 → 1 | 44 → 39 |
| p2-kagurazaka-kaiseki-20261029 / 1 | P2_1B_SEARCH_AVAILABILITY_HINTS | 0,0 → 0,0 | 0,0 → 0,0 | 0 → 0 | 44 → 45 |
| p2-kagurazaka-kaiseki-20261029 / 2 | P2_1B_SEARCH_AVAILABILITY_HINTS | NOT_REACHED | NOT_REACHED | NOT_REACHED | NOT_REACHED |
| p2-kf-h005-20261029 / 1 | P2_1B_SEARCH_AVAILABILITY_HINTS | NOT_REACHED | NOT_REACHED | NOT_REACHED | NOT_REACHED |
| p2-kf-h005-20261029 / 2 | P2_1B_SEARCH_AVAILABILITY_HINTS | NOT_REACHED | NOT_REACHED | NOT_REACHED | NOT_REACHED |
| p2-kichijoji-tempura-20261027 / 1 | P2_1B_SEARCH_AVAILABILITY_HINTS | NOT_REACHED | NOT_REACHED | NOT_REACHED | NOT_REACHED |
| p2-kichijoji-tempura-20261027 / 2 | P2_1B_SEARCH_AVAILABILITY_HINTS | NOT_REACHED | NOT_REACHED | NOT_REACHED | NOT_REACHED |
| p2-kf-h002-20261031 / 1 | HARD_KEYWORD_CORRECTION | NOT_REACHED | NOT_REACHED | NOT_REACHED | NOT_REACHED |
| p2-nakameguro-yakiniku-20261030 / 1 | P2_1B_SEARCH_AVAILABILITY_HINTS | NOT_REACHED | NOT_REACHED | NOT_REACHED | NOT_REACHED |

## Resources A → B

Elapsed is formal probe wall time, excluding external preflight. Shared text planning is counted once.

| Case / repeat | Models | Elapsed ms | Pages | Planning calls/ms | Planning timeouts | B Google formal |
| --- | --- | --- | --- | --- | --- | --- |
| p2-kf-h001-20261027 / 1 | 4 → 4 | 79187 → 96993 | 7 → 10 | 3/6958 → 3/6880 | 0 → 0 | 2 |
| p2-kf-h001-20261027 / 2 | 4 → 4 | 100591 → 69872 | 7 → 8 | 3/9659 → 3/8077 | 0 → 0 | 2 |
| p2-kagurazaka-kaiseki-20261029 / 1 | 9 → 9 | 126650 → 105117 | 8 → 10 | 1/2135 → 1/2678 | 0 → 0 | 2 |

## Search-filter observations and raw paths

APPLIED is an executor diagnostic, not an independent availability verdict. Inspect the linked recording for source-selected values. Empty or unconfirmed hints do not imply no tables.

### p2-kf-h001-20261027 / 1

Boundary **ABSENT**; failures `[]`; termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`.

- tabelog: `{"status": "APPLIED", "reason": "OBSERVED_QUERY_MATCH", "sourceUrl": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?vac_net=1&svd=20261027&svt=1900&svps=2", "unfilteredUrl": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/", "request": {"date": "2026-10-27", "partySize": 2, "time": "19:00"}, "observed": {"date": "2026-10-27", "partySize": 2, "time": "19:00"}, "parsedCount": 11}`
- tablecheck: `{"status": "FALLBACK", "reason": "FILTER_NOT_CONFIRMED", "sourceUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase&date=2026-10-27&time=19%3A00&num_people=2&availability_mode=same_meal_time", "unfilteredUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase", "request": {"date": "2026-10-27", "partySize": 2, "time": "19:00"}, "observed": {"time": "19:00", "partySize": 2}, "parsedCount": 0}`
- google-places: no hint reached/applicable.

Source timing/planning: `{"tabelog": {"callCount": 2, "latencyMs": 4039, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 59203, "retrieval": {"rewrites": 1, "regionPages": 2, "retrievalPages": 2, "history": [{"selection": {"accepted": true, "reason": "Search directly for the hard criterion \"omakase\" in the Shibuya area.", "keyword": "omakase", "criterionRef": "criterion:0"}, "elapsedMs": 22048, "parsedCount": 3}, {"selection": {"accepted": true, "reason": "Only 3 results shown; expanding to the supplied Sushi category (most relevant to omakase) to surface more candidates.", "categoryUrl": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?sw=omakase"}, "elapsedMs": 23592, "parsedCount": 3}], "selection": {"accepted": true, "reason": "Only 3 results shown; expanding to the supplied Sushi category (most relevant to omakase) to surface more candidates.", "categoryUrl": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?sw=omakase"}}, "failureCode": null}, "tablecheck": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 35880, "retrieval": {"selection": {"accepted": true, "reason": "Initial retrieval for the hard criterion \"omakase\" in Shibuya.", "keyword": "omakase", "criterionRef": "criterion:0"}, "rewrites": 0, "regionPages": 0, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Initial retrieval for the hard criterion \"omakase\" in Shibuya.", "keyword": "omakase", "criterionRef": "criterion:0"}, "elapsedMs": 13276, "parsedCount": 20}]}, "failureCode": null}, "google-places": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": null, "sourceElapsedMs": null, "retrieval": null, "failureCode": null}}`

Google recorded request context: `[{"sequence": 279, "sourceId": "google-places", "sourceRequestContext": {"textQuery": "omakase Shibuya"}, "candidates": 33}]`

- [summary](runs/p2-kf-h001-20261027/attempt-1/probe-summary.json) — SHA-256 `89a92223397291f0ee613c1014dc1140f60489215f386936447eb7f2d29dd455`
- [decisions](runs/p2-kf-h001-20261027/attempt-1/probe.decisions.jsonl) — SHA-256 `9cef03b6414e49ed4e9b20424f3322d3cf901c495bb10095f0a5e0ca53184626`
- [recording](runs/p2-kf-h001-20261027/attempt-1/recording/p2-kf-h001-20261027/recording.json) — SHA-256 `276bf7689707f7959f55ce1d247c9d56cff7940a336b1512c06c493917da0456`
- [trace](runs/p2-kf-h001-20261027/attempt-1/trace.jsonl) — SHA-256 `08b8504deabd5c57e4d0b09989f4f38c2124f3f52d5585670a7119d0ea6c1b2b`

Retrieval attempts (original order; repeated observations retained):

| Source | Type | Keyword/category | Parsed/displayed | URL | Decision/reason |
| --- | --- | --- | --- | --- | --- |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/139474 | https://tabelog.com/en/tokyo/ | PLANNER_AND_OBSERVED_REGION_AGENT: PRE_DETAIL_RETRIEVAL_REWRITE |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/5616 | https://tabelog.com/en/tokyo/A1303/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: PRE_DETAIL_RETRIEVAL_REWRITE |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/5616 | https://tabelog.com/en/tokyo/A1303/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: PRE_DETAIL_RETRIEVAL_REWRITE |
| tabelog | KEYWORD | omakase | 3/3 | https://tabelog.com/en/tokyo/A1303/?sw=omakase | BROWSER_AGENT_OR_SOURCE_PAGINATION: PRE_DETAIL_RETRIEVAL_REWRITE |
| tabelog | CATEGORY_OR_GENERAL_LIST | English | 20/197 | https://tabelog.com/en/tokyo/A1303/rstLst/sushi/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: PRE_DETAIL_RETRIEVAL_REWRITE |
| tabelog | SEARCH_AVAILABILITY_HINT | None | 11/90 | https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?vac_net=1&svd=20261027&svt=1900&svps=2 | EXECUTOR_AUTHORITATIVE_REQUEST: OBSERVED_QUERY_MATCH |
| tabelog | SEARCH_AVAILABILITY_HINT | None | 11/90 | https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?vac_net=1&svd=20261027&svt=1900&svps=2 | EXECUTOR_AUTHORITATIVE_REQUEST: OBSERVED_QUERY_MATCH |
| tablecheck | SEARCH_AVAILABILITY_HINT | omakase | 0/None | https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase&date=2026-10-27&time=19%3A00&num_people=2&availability_mode=same_meal_time | EXECUTOR_AUTHORITATIVE_REQUEST: FILTER_NOT_CONFIRMED |
| tablecheck | KEYWORD | omakase | 0/None | https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tablecheck | KEYWORD | omakase | 0/None | https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| google-places | CATEGORY_OR_GENERAL_LIST | None | None/None | google-places:nearby-search | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |

### p2-kf-h001-20261027 / 2

Boundary **ABSENT**; failures `[]`; termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`.

- tabelog: `{"status": "SKIPPED", "reason": "QUERY_NOT_REPRESENTABLE", "sourceUrl": "https://tabelog.com/en/tokyo/A1303/?sw=omakase", "unfilteredUrl": "https://tabelog.com/en/tokyo/A1303/?sw=omakase"}`
- tablecheck: `{"status": "FALLBACK", "reason": "FILTER_NOT_CONFIRMED", "sourceUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase&date=2026-10-27&time=19%3A00&num_people=2&availability_mode=same_meal_time", "unfilteredUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase", "request": {"date": "2026-10-27", "partySize": 2, "time": "19:00"}, "observed": {"time": "19:00", "partySize": 2}, "parsedCount": 0}`
- google-places: no hint reached/applicable.

Source timing/planning: `{"tabelog": {"callCount": 2, "latencyMs": 5057, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 35181, "retrieval": {"rewrites": 0, "regionPages": 2, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Search directly for the hard criterion \"omakase\" in the Shibuya area.", "keyword": "omakase", "criterionRef": "criterion:0"}, "elapsedMs": 22803, "parsedCount": 3}, {"selection": {"accepted": true, "reason": "The current \"omakase\" search already returned 3 relevant Shibuya-area candidates (Japanese Cuisine/Seafood and Sushi counters), matching the hard criterion. Keeping this retrieval.", "keep": true}, "elapsedMs": 25124, "parsedCount": 3}], "selection": {"accepted": true, "reason": "Search directly for the hard criterion \"omakase\" in the Shibuya area.", "keyword": "omakase", "criterionRef": "criterion:0"}}, "failureCode": null}, "tablecheck": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 32458, "retrieval": {"selection": {"accepted": true, "reason": "Initial retrieval for the hard criterion \"omakase\" in Shibuya.", "keyword": "omakase", "criterionRef": "criterion:0"}, "rewrites": 0, "regionPages": 0, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Initial retrieval for the hard criterion \"omakase\" in Shibuya.", "keyword": "omakase", "criterionRef": "criterion:0"}, "elapsedMs": 8155, "parsedCount": 20}]}, "failureCode": null}, "google-places": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": null, "sourceElapsedMs": null, "retrieval": null, "failureCode": null}}`

Google recorded request context: `[{"sequence": 233, "sourceId": "google-places", "sourceRequestContext": {"textQuery": "omakase Shibuya"}, "candidates": 33}]`

- [summary](runs/p2-kf-h001-20261027/attempt-2/probe-summary.json) — SHA-256 `959f44a6bc15b37a7e9d5b5934f5a63dca7bf6388c7c209380d1a9c3f1c968d0`
- [decisions](runs/p2-kf-h001-20261027/attempt-2/probe.decisions.jsonl) — SHA-256 `4b9180d9f9e67a76b2969acb102af48b17adfd142c69fcde3517bb0d01fd03bf`
- [recording](runs/p2-kf-h001-20261027/attempt-2/recording/p2-kf-h001-20261027/recording.json) — SHA-256 `76eabcb0f658dbbcf50bd38acb2b5792263e86b994017789b8ed9d75ce3b35af`
- [trace](runs/p2-kf-h001-20261027/attempt-2/trace.jsonl) — SHA-256 `5db6da147436a3e3fa4e06282218236b73a496ffc08d33b73f0241c4e41155bb`

Retrieval attempts (original order; repeated observations retained):

| Source | Type | Keyword/category | Parsed/displayed | URL | Decision/reason |
| --- | --- | --- | --- | --- | --- |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/139474 | https://tabelog.com/en/tokyo/ | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/5616 | https://tabelog.com/en/tokyo/A1303/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/5616 | https://tabelog.com/en/tokyo/A1303/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | KEYWORD | omakase | 3/3 | https://tabelog.com/en/tokyo/A1303/?sw=omakase | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | KEYWORD | omakase | 3/3 | https://tabelog.com/en/tokyo/A1303/?sw=omakase | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tablecheck | SEARCH_AVAILABILITY_HINT | omakase | 0/None | https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase&date=2026-10-27&time=19%3A00&num_people=2&availability_mode=same_meal_time | EXECUTOR_AUTHORITATIVE_REQUEST: FILTER_NOT_CONFIRMED |
| tablecheck | KEYWORD | omakase | 0/None | https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tablecheck | KEYWORD | omakase | 0/None | https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| google-places | CATEGORY_OR_GENERAL_LIST | None | None/None | google-places:nearby-search | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |

### p2-kagurazaka-kaiseki-20261029 / 1

Boundary **ABSENT**; failures `['READ_BUDGET_EXCEEDED']`; termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`.

- tabelog: no hint reached/applicable.
- tablecheck: `{"status": "FALLBACK", "reason": "FILTER_NOT_CONFIRMED", "sourceUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.701459799999995&geo_longitude=139.7402946&geo_distance=1km&auto_geolocate=false&search_text=kaiseki&date=2026-10-29&time=19%3A30&num_people=3&availability_mode=same_meal_time", "unfilteredUrl": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.701459799999995&geo_longitude=139.7402946&geo_distance=1km&auto_geolocate=false&search_text=kaiseki", "request": {"date": "2026-10-29", "partySize": 3, "time": "19:30"}, "observed": {"time": "19:30", "partySize": 3}, "parsedCount": 0}`
- google-places: no hint reached/applicable.

Source timing/planning: `{"tabelog": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 72976, "retrieval": {"rewrites": 0, "regionPages": 5, "retrievalPages": 0, "history": []}, "failureCode": "READ_BUDGET_EXCEEDED"}, "tablecheck": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": 90000, "sourceElapsedMs": 30147, "retrieval": {"selection": {"accepted": true, "reason": "Retrieve kaiseki restaurants matching the hard criterion.", "keyword": "kaiseki", "criterionRef": "criterion:0"}, "rewrites": 0, "regionPages": 0, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Retrieve kaiseki restaurants matching the hard criterion.", "keyword": "kaiseki", "criterionRef": "criterion:0"}, "elapsedMs": 7346, "parsedCount": 20}]}, "failureCode": null}, "google-places": {"callCount": 0, "latencyMs": 0, "timeouts": 0, "sourceBudgetMs": null, "sourceElapsedMs": null, "retrieval": null, "failureCode": null}}`

Google recorded request context: `[{"sequence": 355, "sourceId": "google-places", "sourceRequestContext": {"textQuery": "kaiseki Kagurazaka"}, "candidates": 40}]`

- [summary](runs/p2-kagurazaka-kaiseki-20261029/attempt-1/probe-summary.json) — SHA-256 `0a79b784ae6aaf96025e78207cfa1134847e4c4d2a39b45e5b88972ab71f3efa`
- [decisions](runs/p2-kagurazaka-kaiseki-20261029/attempt-1/probe.decisions.jsonl) — SHA-256 `3c477095da026541920673d64d43a2f05584b42916d08ecd82567fd218cad0a4`
- [recording](runs/p2-kagurazaka-kaiseki-20261029/attempt-1/recording/p2-kagurazaka-kaiseki-20261029/recording.json) — SHA-256 `9018ce71fbb78958822f973cf233bd750ce951940b062055d760d655cecffb98`
- [trace](runs/p2-kagurazaka-kaiseki-20261029/attempt-1/trace.jsonl) — SHA-256 `86082ecf846281d3f935b0f4fb8e54b2b8e2c13c828ca76faef5a8a697cbb56d`

Retrieval attempts (original order; repeated observations retained):

| Source | Type | Keyword/category | Parsed/displayed | URL | Decision/reason |
| --- | --- | --- | --- | --- | --- |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/139474 | https://tabelog.com/en/tokyo/ | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/7124 | https://tabelog.com/en/tokyo/A1304/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/5593 | https://tabelog.com/en/tokyo/A1304/A130401/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 0/7124 | https://tabelog.com/en/tokyo/A1304/rstLst/?railroad=false | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tabelog | CATEGORY_OR_GENERAL_LIST | None | 20/5593 | https://tabelog.com/en/tokyo/A1304/A130401/ | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tablecheck | SEARCH_AVAILABILITY_HINT | kaiseki | 0/None | https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.701459799999995&geo_longitude=139.7402946&geo_distance=1km&auto_geolocate=false&search_text=kaiseki&date=2026-10-29&time=19%3A30&num_people=3&availability_mode=same_meal_time | EXECUTOR_AUTHORITATIVE_REQUEST: FILTER_NOT_CONFIRMED |
| tablecheck | KEYWORD | kaiseki | 0/None | https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.701459799999995&geo_longitude=139.7402946&geo_distance=1km&auto_geolocate=false&search_text=kaiseki | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| tablecheck | KEYWORD | kaiseki | 0/None | https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.701459799999995&geo_longitude=139.7402946&geo_distance=1km&auto_geolocate=false&search_text=kaiseki | BROWSER_AGENT_OR_SOURCE_PAGINATION: OBSERVED_LISTING_CONTINUATION |
| google-places | CATEGORY_OR_GENERAL_LIST | None | None/None | google-places:nearby-search | PLANNER_AND_OBSERVED_REGION_AGENT: CURRENT_FIRST_BATCH |

## Preflight, integrity and cumulative usage

| Index | Status | Formal started | Models | Preflight evidence |
| --- | --- | --- | --- | --- |
| 0 | PROBE_RECORDED | True | 4 | SOURCE_DATA_NONEMPTY; see per-attempt source-data-preflight.json |
| 1 | PROBE_RECORDED | True | 4 | SOURCE_DATA_NONEMPTY; see per-attempt source-data-preflight.json |
| 2 | PROBE_RECORDED | True | 9 | SOURCE_DATA_NONEMPTY; see per-attempt source-data-preflight.json |
| 3 | ENV_FAILURE | False | 0 | [{'reason': 'NO_RESPONSE', 'responseStatus': 503, 'sourceId': 'tablecheck', 'outcome': 'FAILED', 'countsTowardStop': True, 'phase': 'NETWORK_READINESS'}] |
| 3 | ENV_FAILURE | False | 0 | [{'reason': 'NO_RESPONSE', 'responseStatus': 503, 'sourceId': 'tablecheck', 'outcome': 'FAILED', 'countsTowardStop': True, 'phase': 'NETWORK_READINESS'}] |

New formal probes **3**, models **17**, Google formal/preflight **6/3**. Cumulative **44/52 probes**, **278/450 models**, **117 Google**. Full Live added **0**.
New countable preflight failures 2; origin1 retained; stop={'code': 'PREFLIGHT_FAILURE_LIMIT', 'index': 3, 'totalPreflightFailures': 3, 'sourceIds': []}. No completed formal probe rerun. Decision outcomes `{'SUCCEEDED': 17}`; rows equal calls for every saved probe. 315 frozen hashes and 2660 historical hashes verified; worktree clean. Compressed artifact estimate 44425780 bytes, limit60000000.

H002 before/after actual request contexts and observed counts are separate from P2-1b effects on the other nine rows. All product/source limitations, including missing selected-date observations and region-navigation budget failures, remain in the raw record. No repair, full Live or witness refresh during this batch. Stop for independent review.


## B stop facts and implementation limits

- Completed formal rows: h001 ×2 and Kagurazaka #1. Kagurazaka #2 was never formally started: homepage GET returned503 at2026-10-19T10:19:11Z and again on its one preflight-only retry at10:21:45Z. These attempts add0 model/probe work. The frozen plan carries1 prior A failure; new2 + origin1 =3, exceeding2, so the remaining7 rows were not started. No additional recovery or health probe was made.
- All3 saved formal traces have independent boundary ABSENT; this is limited recorded evidence, not universal read-only proof.17 captures equal17 started model calls.
- Tabelog filter diagnostics: h001 #1 APPLIED; h001 #2 and other cases retain their raw status below. TableCheck's h001 filtered date button reads `Date Tue, Oct 27 · 19:00` without a year. This parser did not establish a full date, so it fell back despite observing time/party; no filtered-empty result was promoted to no availability. Raw source visibility/meaning remains for independent review.
- Resource accounting: filtered/fallback documents are counted in pagesRead and bounded by existing total source ceilings. The existing retrievalPages counter continues to describe expression-planning pages; filter status and URLs are separate diagnostics. Actual per-source fields and raw page chronology are retained, without relabeling them as a qualification result.
- H002: implementation tests pass, but its B probe is NOT_REACHED. No real B claim is made about its Nearby result count. Other unstarted TARGET/CONTROL rows remain NOT_REACHED; the required B10 comparison and control acceptance are incomplete.

- Evidence bookkeeping correction: hard-only/verification.json lists typecheck.log under earlier failures, but that filename contains a later successful check after being reused before the implementation commit. It is not evidence of the initial type error. The valid behavioral red is hard-only/red.log; final green gate logs remain hashed. No frozen evidence file was rewritten for this clarification.
- h001 #2 Tabelog diagnostic is SKIPPED/SOURCE_PAGE_BUDGET (see its full JSON), so its missing first-batch witness is not claimed as proof that an applied availability filter removed that witness.
