# P2-1a DOM-corrected checkpoint A

Evidence: exposed development discovery only; no full Live, availability, qualification or delivery acceptance.

Status **COMPLETE**: 10/10 recorded; stop=None. Production `ba20b8a7e0ae5d00d93838f7f19b0ae01364e2be`; baseline `acfaaffa73db97413f6538f161c4e837ec64316e` unchanged. Previous A209ac42 is retained separately. Correction ba20b8a; replay preparation4017981; outer freeze recorded in Git and freeze.json.

## Fixed controls and proof scope

The 14 single-decision offline model replays passed the predeclared gate: h001, Kichijoji and Nakameguro selected related supplied categories (3 distinct cases; required2). Only6 had exact recorded DOM;7 used later same-region DOM and1 had a DOM evidence gap. Those are counterfactual inputs, not faithful browser session replay. See ../p21a-dom-replay-20261019/report.md.

This new A uses the same ten ordered inputs, center/radius, source preflight and witness bytes as baseline. Existing certification remains valid through at least2026-10-20T03:12:46.141Z;0 recertification requests. Six plan-only runs and external stop/resume controls passed with0 network/models. Initial318 source/config/script SHA hashes were frozen before requests. The approved outer-only recovery below is the sole mid-batch configuration change; production is unchanged and no formal probe was retried. Each probe15 models/180s, source90s; plan and raw config are authoritative.

The source ancestry contains the prior separately committed Google-only nearby fix ea7113a; this ten-case plan uses the native three-source assembly. Original A raw trace already had Google text queries; URL placeholders in retrieval metrics are not transport evidence and do not establish the alleged nearby regression. See raw googleActualTransport in comparison.json.

Five source gates: typecheck/arch/build PASS,943/943 default tests,117/117 actual local Chromium. Effective changes are DOM category exposure (same Pack grammar and region), Prompt@3/attempt history and bounded duplicate rejection. Schema@1, Guard permissions and qualification remain unchanged. L0/L1 fixture proof, offline L3 decision feasibility, and live read-only discovery are separate.

## Aggregate observations

| Metric | Baseline | Previous A | New A |
| --- | --- | --- | --- |
| models | 55 | 53 | 49 |
| elapsedMs | 788353 | 1062253 | 942173 |
| planningCalls | 0 | 24 | 22 |
| planningMs | 0 | 52395 | 56097 |
| planningTimeouts | 0 | 0 | 0 |
| tabelogListing | 1 | 8 | 8 |
| tabelogFirstBatch | 0 | 3 | 5 |
| tablecheckListing | 0 | 0 | 0 |
| tablecheckFirstBatch | 0 | 0 | 0 |
| googleExactListing | 5 | 3 | 5 |

These are exposed paired development observations, not causal labels or delivery rates. Tabelog first-batch witness hits increase from3 to5 against the previous A; TableCheck remains0. KF-H005 still has no native first-batch witness, and both Kagurazaka runs retain READ_BUDGET_EXCEEDED. H002 has fewer in-radius parsed candidates (baseline30 -> new10). New A formal wall time is below the previous A but above baseline; preflight and approval pause are excluded. All deficits remain visible for independent review.

## Paired source/list/radius facts

Cells show **baseline -> previous A -> new A**. Native cells are listing,first-batch booleans. Google listing requires an exact observed website source ID; similar names do not count. Listing includes broad region-navigation observations, so listing hits do not by themselves prove effective final retrieval. Radius counts are parsed coordinates, including Google candidates, not qualified/deduplicated restaurants.

| Case / repeat | Tabelog list,first | TableCheck list,first | Google exact listing | In-radius count |
| --- | --- | --- | --- | --- |
| p2-kf-h001-20261027 / 1 | 0,0 -> 1,0 -> 1,1 | 0,0 -> 0,0 -> 0,0 | 1 -> 0 -> 1 | 39 -> 39 -> 40 |
| p2-kf-h001-20261027 / 2 | 0,0 -> 1,0 -> 1,1 | 0,0 -> 0,0 -> 0,0 | 1 -> 0 -> 1 | 39 -> 39 -> 44 |
| p2-kagurazaka-kaiseki-20261029 / 1 | 0,0 -> 0,0 -> 0,0 | 0,0 -> 0,0 -> 0,0 | 0 -> 0 -> 0 | 45 -> 45 -> 44 |
| p2-kagurazaka-kaiseki-20261029 / 2 | 0,0 -> 0,0 -> 0,0 | 0,0 -> 0,0 -> 0,0 | 0 -> 0 -> 0 | 45 -> 45 -> 44 |
| p2-kf-h005-20261029 / 1 | 0,0 -> 1,0 -> 1,0 | 0,0 -> 0,0 -> 0,0 | 0 -> 0 -> 0 | 45 -> 45 -> 49 |
| p2-kf-h005-20261029 / 2 | 0,0 -> 1,0 -> 1,0 | 0,0 -> 0,0 -> 0,0 | 0 -> 0 -> 0 | 45 -> 45 -> 49 |
| p2-kichijoji-tempura-20261027 / 1 | 0,0 -> 1,1 -> 1,1 | 0,0 -> 0,0 -> 0,0 | 1 -> 1 -> 1 | 50 -> 50 -> 50 |
| p2-kichijoji-tempura-20261027 / 2 | 0,0 -> 1,1 -> 1,1 | 0,0 -> 0,0 -> 0,0 | 1 -> 1 -> 1 | 50 -> 50 -> 50 |
| p2-kf-h002-20261031 / 1 | 1,0 -> 1,0 -> 1,0 | 0,0 -> 0,0 -> 0,0 | 0 -> 0 -> 0 | 30 -> 10 -> 10 |
| p2-nakameguro-yakiniku-20261030 / 1 | 0,0 -> 1,1 -> 1,1 | 0,0 -> 0,0 -> 0,0 | 1 -> 1 -> 1 | 39 -> 43 -> 43 |

## Paired resource facts

Time is formal wall time; preflight is separate. Planning uses actual captured model latencies, including failures. Shared initial text planning is counted once.

| Case / repeat | Models B / old A / new A | Elapsed ms | Pages | Planning calls / ms | Planning timeouts |
| --- | --- | --- | --- | --- | --- |
| p2-kf-h001-20261027 / 1 | 1 / 4 / 4 | 42541 / 61801 / 79187 | 5 / 6 / 7 | 0/0 ; 3/7216 ; 3/6958 | 0 / 0 / 0 |
| p2-kf-h001-20261027 / 2 | 1 / 4 / 4 | 44102 / 95854 / 100591 | 5 / 6 / 7 | 0/0 ; 3/7605 ; 3/9659 | 0 / 0 / 0 |
| p2-kagurazaka-kaiseki-20261029 / 1 | 11 / 9 / 9 | 93505 / 93767 / 126650 | 6 / 8 / 8 | 0/0 ; 1/2214 ; 1/2135 | 0 / 0 / 0 |
| p2-kagurazaka-kaiseki-20261029 / 2 | 12 / 11 / 9 | 103353 / 170913 / 96753 | 6 / 8 / 8 | 0/0 ; 1/1995 ; 1/2306 | 0 / 0 / 0 |
| p2-kf-h005-20261029 / 1 | 3 / 5 / 3 | 51088 / 61145 / 82361 | 4 / 8 / 6 | 0/0 ; 4/6557 ; 2/4615 | 0 / 0 / 0 |
| p2-kf-h005-20261029 / 2 | 3 / 5 / 3 | 47689 / 65801 / 86541 | 4 / 8 / 6 | 0/0 ; 4/7392 ; 2/5436 | 0 / 0 / 0 |
| p2-kichijoji-tempura-20261027 / 1 | 6 / 3 / 3 | 108903 / 131767 / 100222 | 9 / 6 / 6 | 0/0 ; 2/4612 ; 2/5980 | 0 / 0 / 0 |
| p2-kichijoji-tempura-20261027 / 2 | 6 / 3 / 3 | 100411 / 133786 / 84654 | 9 / 6 / 6 | 0/0 ; 2/4923 ; 2/5844 | 0 / 0 / 0 |
| p2-kf-h002-20261031 / 1 | 3 / 5 / 7 | 88656 / 104749 / 101016 | 6 / 7 / 9 | 0/0 ; 2/5136 ; 4/8535 | 0 / 0 / 0 |
| p2-nakameguro-yakiniku-20261030 / 1 | 9 / 4 / 4 | 108105 / 142670 / 84198 | 10 / 7 / 7 | 0/0 ; 2/4745 ; 2/4629 | 0 / 0 / 0 |

## Per-run retrieval and raw artifacts

Full accepted/rejected selection history, all source sequences (keyword/category/count), planning input category counts and reasons, actual Google continuation transport and precise hashes are in comparison.json. Old parser metric nulls are retained beside actual source funnel records. No old artifact is overwritten.

### 0: p2-kf-h001-20261027

Failures []; termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`; unattempted []; per-source parsed radius counts {"tabelog": 2, "tablecheck": 5, "google-places": 33}.

- tabelog: planning 2 calls / 4630ms / 0 timeouts; source elapsed 49707ms; accepted/rejected history [{"selection": {"accepted": true, "reason": "Retrieve restaurants matching the hard criterion \"omakase\" in Shibuya.", "keyword": "omakase", "criterionRef": "criterion:0"}, "elapsedMs": 24538, "parsedCount": 3}, {"selection": {"accepted": true, "reason": "Only 3 results shown; expanding to the supplied Sushi category, the most relevant category for omakase, to surface more candidates.", "categoryUrl": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?sw=omakase"}, "elapsedMs": 26897, "parsedCount": 3}]
  Retrieval observations: [{"url": "https://tabelog.com/en/tokyo/", "keyword": null, "category": null, "parsed": 20, "total": 139473}, {"url": "https://tabelog.com/en/tokyo/A1303/", "keyword": null, "category": null, "parsed": 20, "total": 5616}, {"url": "https://tabelog.com/en/tokyo/A1303/", "keyword": null, "category": null, "parsed": 20, "total": 5616}, {"url": "https://tabelog.com/en/tokyo/A1303/?sw=omakase", "keyword": "omakase", "category": null, "parsed": 3, "total": 3}, {"url": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/", "keyword": null, "category": "English", "parsed": 20, "total": 197}, {"url": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/", "keyword": null, "category": "English", "parsed": 20, "total": 197}]
- tablecheck: planning 0 calls / 0ms / 0 timeouts; source elapsed 27540ms; accepted/rejected history [{"selection": {"accepted": true, "reason": "Initial retrieval for the hard criterion \"omakase\" in Shibuya.", "keyword": "omakase", "criterionRef": "criterion:0"}, "elapsedMs": 7283, "parsedCount": 20}]
  Retrieval observations: [{"url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase", "keyword": "omakase", "category": null, "parsed": 20, "total": null}]
- google-places: planning 0 calls / 0ms / 0 timeouts; source elapsed Nonems; accepted/rejected history []
  Retrieval observations: [{"url": "google-places:nearby-search", "keyword": null, "category": null, "parsed": null, "total": null}]
- Decision#2 tabelog: parsed=20, categories=54; {"choice": "KEYWORD", "keyword": "omakase", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "Retrieve restaurants matching the hard criterion \"omakase\" in Shibuya."}
- Decision#3 tabelog: parsed=3, categories=5; {"choice": "CATEGORY", "keyword": "", "criterionRef": "criterion:0", "categoryUrl": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?sw=omakase", "reason": "Only 3 results shown; expanding to the supplied Sushi category, the most relevant category for omakase, to surface more candidates."}
- Decision#4 SHARED_TEXT_RETRIEVAL: parsed=None, categories=0; {"choice": "KEYWORD", "keyword": "omakase", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "Initial retrieval for the hard criterion \"omakase\" in Shibuya."}
- summary: [probe-summary.json](runs/p2-kf-h001-20261027/attempt-1/probe-summary.json), SHA-256 `b96d2d18d88b7c4870d2c54367f54f5e93d833a92754e392cbe95186f7a28388`
- decisions: [probe.decisions.jsonl](runs/p2-kf-h001-20261027/attempt-1/probe.decisions.jsonl), SHA-256 `d9939f3e5aefec53d15fe80c321d36eb09a83ea602c15abb0c7cac059bd91dea`
- trace: [trace.jsonl](runs/p2-kf-h001-20261027/attempt-1/trace.jsonl), SHA-256 `828d358f0f99f02ea5cb1abf2ae960cb15f71731a23a28af6baeac65fc9f96e0`
- recording: [recording.json](runs/p2-kf-h001-20261027/attempt-1/recording/p2-kf-h001-20261027/recording.json), SHA-256 `1728e930e0e99d8118debe0610ce1ba98094ecc454925ecaa837a538555bf0cf`

### 1: p2-kf-h001-20261027

Failures []; termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`; unattempted []; per-source parsed radius counts {"tabelog": 2, "tablecheck": 5, "google-places": 37}.

- tabelog: planning 2 calls / 7522ms / 0 timeouts; source elapsed 69721ms; accepted/rejected history [{"selection": {"accepted": true, "reason": "Search directly for the hard criterion \"omakase\" in Shibuya.", "keyword": "omakase", "criterionRef": "criterion:0"}, "elapsedMs": 31542, "parsedCount": 3}, {"selection": {"accepted": true, "reason": "Only 3 results shown; expanding to the supplied Sushi category, the most relevant category for omakase, to surface more candidates.", "categoryUrl": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?sw=omakase"}, "elapsedMs": 33609, "parsedCount": 3}]
  Retrieval observations: [{"url": "https://tabelog.com/en/tokyo/", "keyword": null, "category": null, "parsed": 20, "total": 139473}, {"url": "https://tabelog.com/en/tokyo/A1303/", "keyword": null, "category": null, "parsed": 20, "total": 5616}, {"url": "https://tabelog.com/en/tokyo/A1303/", "keyword": null, "category": null, "parsed": 20, "total": 5616}, {"url": "https://tabelog.com/en/tokyo/A1303/?sw=omakase", "keyword": "omakase", "category": null, "parsed": 3, "total": 3}, {"url": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/", "keyword": null, "category": "English", "parsed": 20, "total": 197}, {"url": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/", "keyword": null, "category": "English", "parsed": 20, "total": 197}]
- tablecheck: planning 0 calls / 0ms / 0 timeouts; source elapsed 28568ms; accepted/rejected history [{"selection": {"accepted": true, "reason": "Initial retrieval for the hard criterion \"omakase\" in Shibuya.", "keyword": "omakase", "criterionRef": "criterion:0"}, "elapsedMs": 7906, "parsedCount": 20}]
  Retrieval observations: [{"url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase", "keyword": "omakase", "category": null, "parsed": 20, "total": null}]
- google-places: planning 0 calls / 0ms / 0 timeouts; source elapsed Nonems; accepted/rejected history []
  Retrieval observations: [{"url": "google-places:nearby-search", "keyword": null, "category": null, "parsed": null, "total": null}]
- Decision#2 tabelog: parsed=20, categories=54; {"choice": "KEYWORD", "keyword": "omakase", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "Search directly for the hard criterion \"omakase\" in Shibuya."}
- Decision#3 tabelog: parsed=3, categories=5; {"choice": "CATEGORY", "keyword": "", "criterionRef": "criterion:0", "categoryUrl": "https://tabelog.com/en/tokyo/A1303/rstLst/sushi/?sw=omakase", "reason": "Only 3 results shown; expanding to the supplied Sushi category, the most relevant category for omakase, to surface more candidates."}
- Decision#4 SHARED_TEXT_RETRIEVAL: parsed=None, categories=0; {"choice": "KEYWORD", "keyword": "omakase", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "Initial retrieval for the hard criterion \"omakase\" in Shibuya."}
- summary: [probe-summary.json](runs/p2-kf-h001-20261027/attempt-2/probe-summary.json), SHA-256 `ca85bcc4b92f56dd4ed80f7e68c2c123197c485c3cef58bb7210800b194e8b2c`
- decisions: [probe.decisions.jsonl](runs/p2-kf-h001-20261027/attempt-2/probe.decisions.jsonl), SHA-256 `3b4f2d02f80b703548c17e3e00267edc1b1724da35f377de62c9f94958836bab`
- trace: [trace.jsonl](runs/p2-kf-h001-20261027/attempt-2/trace.jsonl), SHA-256 `b047bd4b30c224946b3eacc0cdb29dd799a6d28a9351cea5bd2ebba04431dd9b`
- recording: [recording.json](runs/p2-kf-h001-20261027/attempt-2/recording/p2-kf-h001-20261027/recording.json), SHA-256 `fb1dd7077a897ae79db7dc256bd8382b48dde69b44a89e6e800e9729e4f36179`

### 2: p2-kagurazaka-kaiseki-20261029

Failures ["READ_BUDGET_EXCEEDED"]; termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`; unattempted []; per-source parsed radius counts {"tablecheck": 5, "google-places": 39}.

- tabelog: planning 0 calls / 0ms / 0 timeouts; source elapsed 68809ms; accepted/rejected history []
  Retrieval observations: [{"url": "https://tabelog.com/en/tokyo/", "keyword": null, "category": null, "parsed": 20, "total": 139473}, {"url": "https://tabelog.com/en/tokyo/A1304/", "keyword": null, "category": null, "parsed": 20, "total": 7124}, {"url": "https://tabelog.com/en/tokyo/A1304/A130401/", "keyword": null, "category": null, "parsed": 20, "total": 5593}, {"url": "https://tabelog.com/en/tokyo/A1304/rstLst/?railroad=false", "keyword": null, "category": null, "parsed": 0, "total": 7124}, {"url": "https://tabelog.com/en/tokyo/A1304/A130401/", "keyword": null, "category": null, "parsed": 20, "total": 5593}]
- tablecheck: planning 0 calls / 0ms / 0 timeouts; source elapsed 55721ms; accepted/rejected history [{"selection": {"accepted": true, "reason": "Initial retrieval for the hard criterion \"kaiseki restaurant\" in Kagurazaka.", "keyword": "kaiseki", "criterionRef": "criterion:0"}, "elapsedMs": 24443, "parsedCount": 20}]
  Retrieval observations: [{"url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.701459799999995&geo_longitude=139.7402946&geo_distance=1km&auto_geolocate=false&search_text=kaiseki", "keyword": "kaiseki", "category": null, "parsed": 20, "total": null}]
- google-places: planning 0 calls / 0ms / 0 timeouts; source elapsed Nonems; accepted/rejected history []
  Retrieval observations: [{"url": "google-places:nearby-search", "keyword": null, "category": null, "parsed": null, "total": null}]
- Decision#9 SHARED_TEXT_RETRIEVAL: parsed=None, categories=0; {"choice": "KEYWORD", "keyword": "kaiseki", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "Initial retrieval for the hard criterion \"kaiseki restaurant\" in Kagurazaka."}
- summary: [probe-summary.json](runs/p2-kagurazaka-kaiseki-20261029/attempt-1/probe-summary.json), SHA-256 `0e1be550565253ac8dc6b15460f34507c52a7fd42facc24c0917c3125f1993ac`
- decisions: [probe.decisions.jsonl](runs/p2-kagurazaka-kaiseki-20261029/attempt-1/probe.decisions.jsonl), SHA-256 `8841b2d83354265e0005dacf17b0626868aeec1c212706d4d4142d9fe70317b6`
- trace: [trace.jsonl](runs/p2-kagurazaka-kaiseki-20261029/attempt-1/trace.jsonl), SHA-256 `b64b62278a911420df762f4d953c2bd682bc5c9a49fff55aeb7ebdf40a8286ae`
- recording: [recording.json](runs/p2-kagurazaka-kaiseki-20261029/attempt-1/recording/p2-kagurazaka-kaiseki-20261029/recording.json), SHA-256 `65e232ccc1682e02ec831d77b5dce0e8a5eda4b0315ebbb1dcf939b6fbe78f2d`

### 3: p2-kagurazaka-kaiseki-20261029

Failures ["READ_BUDGET_EXCEEDED"]; termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`; unattempted []; per-source parsed radius counts {"tablecheck": 5, "google-places": 39}.

- tabelog: planning 0 calls / 0ms / 0 timeouts; source elapsed 65630ms; accepted/rejected history []
  Retrieval observations: [{"url": "https://tabelog.com/en/tokyo/", "keyword": null, "category": null, "parsed": 20, "total": 139473}, {"url": "https://tabelog.com/en/tokyo/A1304/", "keyword": null, "category": null, "parsed": 20, "total": 7124}, {"url": "https://tabelog.com/en/tokyo/A1304/A130401/", "keyword": null, "category": null, "parsed": 20, "total": 5593}, {"url": "https://tabelog.com/en/tokyo/A1304/rstLst/?railroad=false", "keyword": null, "category": null, "parsed": 0, "total": 7124}, {"url": "https://tabelog.com/en/tokyo/A1304/A130401/", "keyword": null, "category": null, "parsed": 20, "total": 5593}]
- tablecheck: planning 0 calls / 0ms / 0 timeouts; source elapsed 29166ms; accepted/rejected history [{"selection": {"accepted": true, "reason": "Initial retrieval for the hard criterion \"kaiseki restaurant\" in Kagurazaka.", "keyword": "kaiseki", "criterionRef": "criterion:0"}, "elapsedMs": 8095, "parsedCount": 20}]
  Retrieval observations: [{"url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.701459799999995&geo_longitude=139.7402946&geo_distance=1km&auto_geolocate=false&search_text=kaiseki", "keyword": "kaiseki", "category": null, "parsed": 20, "total": null}]
- google-places: planning 0 calls / 0ms / 0 timeouts; source elapsed Nonems; accepted/rejected history []
  Retrieval observations: [{"url": "google-places:nearby-search", "keyword": null, "category": null, "parsed": null, "total": null}]
- Decision#9 SHARED_TEXT_RETRIEVAL: parsed=None, categories=0; {"choice": "KEYWORD", "keyword": "kaiseki", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "Initial retrieval for the hard criterion \"kaiseki restaurant\" in Kagurazaka."}
- summary: [probe-summary.json](runs/p2-kagurazaka-kaiseki-20261029/attempt-2/probe-summary.json), SHA-256 `19de8becaa753f14dd17be5d71c37de9daf70a7a37db103a44f17c7195ae2d70`
- decisions: [probe.decisions.jsonl](runs/p2-kagurazaka-kaiseki-20261029/attempt-2/probe.decisions.jsonl), SHA-256 `1df4db460a2d9dcefe27c959d88163024a48bcd49a038112eaa6ec74bb281b75`
- trace: [trace.jsonl](runs/p2-kagurazaka-kaiseki-20261029/attempt-2/trace.jsonl), SHA-256 `450a1efff8ef83d48459f2607fff629e473d490f0b93368b1b8a482510fd9354`
- recording: [recording.json](runs/p2-kagurazaka-kaiseki-20261029/attempt-2/recording/p2-kagurazaka-kaiseki-20261029/recording.json), SHA-256 `d4299c0081900b2f52b57e62100c6a3d328b31c96b9ef7ca3d5fcb6352394420`

### 4: p2-kf-h005-20261029

Failures []; termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`; unattempted []; per-source parsed radius counts {"tabelog": 4, "tablecheck": 5, "google-places": 40}.

- tabelog: planning 1 calls / 2504ms / 0 timeouts; source elapsed 52936ms; accepted/rejected history [{"selection": {"accepted": true, "reason": "Expand to the supplied Washoku (Japanese cuisine) category to surface local Japanese food options near Ginza.", "categoryUrl": "https://tabelog.com/en/tokyo/A1301/rstLst/washoku/"}, "elapsedMs": 24029, "parsedCount": 20}]
  Retrieval observations: [{"url": "https://tabelog.com/en/tokyo/", "keyword": null, "category": null, "parsed": 20, "total": 139472}, {"url": "https://tabelog.com/en/tokyo/A1301/", "keyword": null, "category": null, "parsed": 20, "total": 6250}, {"url": "https://tabelog.com/en/tokyo/A1301/", "keyword": null, "category": null, "parsed": 20, "total": 6250}, {"url": "https://tabelog.com/en/tokyo/A1301/rstLst/washoku/", "keyword": null, "category": "English", "parsed": 20, "total": 2273}, {"url": "https://tabelog.com/en/tokyo/A1301/rstLst/washoku/", "keyword": null, "category": "English", "parsed": 20, "total": 2273}]
- tablecheck: planning 0 calls / 0ms / 0 timeouts; source elapsed 27506ms; accepted/rejected history [{"selection": {"accepted": true, "reason": "Initial retrieval for the hard criterion \"local food\" with no prior attempts.", "keyword": "local food", "criterionRef": "criterion:0"}, "elapsedMs": 7819, "parsedCount": 20}]
  Retrieval observations: [{"url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6697&geo_longitude=139.767&geo_distance=1km&auto_geolocate=false&search_text=local+food", "keyword": "local food", "category": null, "parsed": 20, "total": null}]
- google-places: planning 0 calls / 0ms / 0 timeouts; source elapsed Nonems; accepted/rejected history []
  Retrieval observations: [{"url": "google-places:nearby-search", "keyword": null, "category": null, "parsed": null, "total": null}]
- Decision#2 tabelog: parsed=20, categories=57; {"choice": "CATEGORY", "keyword": "", "criterionRef": "criterion:0", "categoryUrl": "https://tabelog.com/en/tokyo/A1301/rstLst/washoku/", "reason": "Expand to the supplied Washoku (Japanese cuisine) category to surface local Japanese food options near Ginza."}
- Decision#3 SHARED_TEXT_RETRIEVAL: parsed=None, categories=0; {"choice": "KEYWORD", "keyword": "local food", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "Initial retrieval for the hard criterion \"local food\" with no prior attempts."}
- summary: [probe-summary.json](runs/p2-kf-h005-20261029/attempt-1/probe-summary.json), SHA-256 `3864b99eb6f9c4e14070dc2b3a1076285441500f5395912e6ca20826f2f62bcb`
- decisions: [probe.decisions.jsonl](runs/p2-kf-h005-20261029/attempt-1/probe.decisions.jsonl), SHA-256 `fe3a75ef1108d70e5e14274174c6df0106ee238d3a1b74f9e8692be675766be3`
- trace: [trace.jsonl](runs/p2-kf-h005-20261029/attempt-1/trace.jsonl), SHA-256 `39050ee6b8932be67a1ce5de1f87773d101971a585bd2ab50a99fcce12759ffa`
- recording: [recording.json](runs/p2-kf-h005-20261029/attempt-1/recording/p2-kf-h005-20261029/recording.json), SHA-256 `a51a62d1ad3762ad051954277dac72401b93edf66d9c379a78d9f67b065b8b61`

### 5: p2-kf-h005-20261029

Failures []; termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`; unattempted []; per-source parsed radius counts {"tabelog": 4, "tablecheck": 5, "google-places": 40}.

- tabelog: planning 1 calls / 2903ms / 0 timeouts; source elapsed 46093ms; accepted/rejected history [{"selection": {"accepted": true, "reason": "Local food maps to Washoku (Japanese cuisine); expand to that supplied category for a fuller list.", "categoryUrl": "https://tabelog.com/en/tokyo/A1301/rstLst/washoku/"}, "elapsedMs": 23826, "parsedCount": 20}]
  Retrieval observations: [{"url": "https://tabelog.com/en/tokyo/", "keyword": null, "category": null, "parsed": 20, "total": 139472}, {"url": "https://tabelog.com/en/tokyo/A1301/", "keyword": null, "category": null, "parsed": 20, "total": 6250}, {"url": "https://tabelog.com/en/tokyo/A1301/", "keyword": null, "category": null, "parsed": 20, "total": 6250}, {"url": "https://tabelog.com/en/tokyo/A1301/rstLst/washoku/", "keyword": null, "category": "English", "parsed": 20, "total": 2273}, {"url": "https://tabelog.com/en/tokyo/A1301/rstLst/washoku/", "keyword": null, "category": "English", "parsed": 20, "total": 2273}]
- tablecheck: planning 0 calls / 0ms / 0 timeouts; source elapsed 37340ms; accepted/rejected history [{"selection": {"accepted": true, "reason": "Initial retrieval for the hard criterion \"local food\" with no prior attempts.", "keyword": "local food", "criterionRef": "criterion:0"}, "elapsedMs": 13134, "parsedCount": 20}]
  Retrieval observations: [{"url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6697&geo_longitude=139.767&geo_distance=1km&auto_geolocate=false&search_text=local+food", "keyword": "local food", "category": null, "parsed": 20, "total": null}]
- google-places: planning 0 calls / 0ms / 0 timeouts; source elapsed Nonems; accepted/rejected history []
  Retrieval observations: [{"url": "google-places:nearby-search", "keyword": null, "category": null, "parsed": null, "total": null}]
- Decision#2 tabelog: parsed=20, categories=57; {"choice": "CATEGORY", "keyword": "", "criterionRef": "criterion:0", "categoryUrl": "https://tabelog.com/en/tokyo/A1301/rstLst/washoku/", "reason": "Local food maps to Washoku (Japanese cuisine); expand to that supplied category for a fuller list."}
- Decision#3 SHARED_TEXT_RETRIEVAL: parsed=None, categories=0; {"choice": "KEYWORD", "keyword": "local food", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "Initial retrieval for the hard criterion \"local food\" with no prior attempts."}
- summary: [probe-summary.json](runs/p2-kf-h005-20261029/attempt-2-preflight-2/probe-summary.json), SHA-256 `9f0295e6c7d995c4a14b9ee7cd3e9d7518c61c04d6ca03a4fd7acb77ca2670db`
- decisions: [probe.decisions.jsonl](runs/p2-kf-h005-20261029/attempt-2-preflight-2/probe.decisions.jsonl), SHA-256 `6c750cfb79611a8153ae0d760c0f7184270f5ac9902231e0cece459f33df2b9b`
- trace: [trace.jsonl](runs/p2-kf-h005-20261029/attempt-2-preflight-2/trace.jsonl), SHA-256 `197df7c277513e1913abd3dc98771aabba3b6a011ebc4699bc84c99111a212c1`
- recording: [recording.json](runs/p2-kf-h005-20261029/attempt-2-preflight-2/recording/p2-kf-h005-20261029/recording.json), SHA-256 `2c1c328f7e7368792e241d47a8b85437620efefbfc6e599d16bd6adf9873ef6c`

### 6: p2-kichijoji-tempura-20261027

Failures []; termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`; unattempted []; per-source parsed radius counts {"tabelog": 5, "tablecheck": 5, "google-places": 40}.

- tabelog: planning 1 calls / 2787ms / 0 timeouts; source elapsed 48830ms; accepted/rejected history [{"selection": {"accepted": true, "reason": "Supplied category \"Tempura\" directly matches the hard criterion; browsing it in the Kichijoji area.", "categoryUrl": "https://tabelog.com/en/tokyo/A1320/rstLst/tempura/"}, "elapsedMs": 27516, "parsedCount": 20}]
  Retrieval observations: [{"url": "https://tabelog.com/en/tokyo/", "keyword": null, "category": null, "parsed": 20, "total": 139471}, {"url": "https://tabelog.com/en/tokyo/A1320/", "keyword": null, "category": null, "parsed": 20, "total": 2819}, {"url": "https://tabelog.com/en/tokyo/A1320/", "keyword": null, "category": null, "parsed": 20, "total": 2819}, {"url": "https://tabelog.com/en/tokyo/A1320/rstLst/tempura/", "keyword": null, "category": "English", "parsed": 20, "total": 22}, {"url": "https://tabelog.com/en/tokyo/A1320/rstLst/tempura/", "keyword": null, "category": "English", "parsed": 20, "total": 22}]
- tablecheck: planning 0 calls / 0ms / 0 timeouts; source elapsed 49356ms; accepted/rejected history [{"selection": {"accepted": true, "reason": "Initial retrieval for the hard criterion \"tempura restaurant\" in Kichijōji.", "keyword": "tempura", "criterionRef": "criterion:0"}, "elapsedMs": 11777, "parsedCount": 20}]
  Retrieval observations: [{"url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.704096&geo_longitude=139.58020539999998&geo_distance=1km&auto_geolocate=false&search_text=tempura", "keyword": "tempura", "category": null, "parsed": 20, "total": null}]
- google-places: planning 0 calls / 0ms / 0 timeouts; source elapsed Nonems; accepted/rejected history []
  Retrieval observations: [{"url": "google-places:nearby-search", "keyword": null, "category": null, "parsed": null, "total": null}]
- Decision#2 tabelog: parsed=20, categories=53; {"choice": "CATEGORY", "keyword": "", "criterionRef": "criterion:0", "categoryUrl": "https://tabelog.com/en/tokyo/A1320/rstLst/tempura/", "reason": "Supplied category \"Tempura\" directly matches the hard criterion; browsing it in the Kichijoji area."}
- Decision#3 SHARED_TEXT_RETRIEVAL: parsed=None, categories=0; {"choice": "KEYWORD", "keyword": "tempura", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "Initial retrieval for the hard criterion \"tempura restaurant\" in Kichijōji."}
- summary: [probe-summary.json](runs/p2-kichijoji-tempura-20261027/attempt-1/probe-summary.json), SHA-256 `397eb595d092990be82fabde1c708c387486c910acd3019fd86a188d1be29816`
- decisions: [probe.decisions.jsonl](runs/p2-kichijoji-tempura-20261027/attempt-1/probe.decisions.jsonl), SHA-256 `a4095db5b1e74e2ed9d37a528f8c33e192aed523ed4ab14c951ee184dd1fc82a`
- trace: [trace.jsonl](runs/p2-kichijoji-tempura-20261027/attempt-1/trace.jsonl), SHA-256 `b74ca13c61b46024a872392c6a9b17fb20cf6d9d4ab807f570f683581d4b22e6`
- recording: [recording.json](runs/p2-kichijoji-tempura-20261027/attempt-1/recording/p2-kichijoji-tempura-20261027/recording.json), SHA-256 `a92648b5bf7e53af6a9f86e6a2516795df2c8a523bd7cc822acddc5680ba27b6`

### 7: p2-kichijoji-tempura-20261027

Failures []; termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`; unattempted []; per-source parsed radius counts {"tabelog": 5, "tablecheck": 5, "google-places": 40}.

- tabelog: planning 1 calls / 2687ms / 0 timeouts; source elapsed 53533ms; accepted/rejected history [{"selection": {"accepted": true, "reason": "Supplied category \"Tempura\" directly matches the hard criterion (tempura restaurant) in the same region.", "categoryUrl": "https://tabelog.com/en/tokyo/A1320/rstLst/tempura/"}, "elapsedMs": 22855, "parsedCount": 20}]
  Retrieval observations: [{"url": "https://tabelog.com/en/tokyo/", "keyword": null, "category": null, "parsed": 20, "total": 139471}, {"url": "https://tabelog.com/en/tokyo/A1320/", "keyword": null, "category": null, "parsed": 20, "total": 2819}, {"url": "https://tabelog.com/en/tokyo/A1320/", "keyword": null, "category": null, "parsed": 20, "total": 2819}, {"url": "https://tabelog.com/en/tokyo/A1320/rstLst/tempura/", "keyword": null, "category": "English", "parsed": 20, "total": 22}, {"url": "https://tabelog.com/en/tokyo/A1320/rstLst/tempura/", "keyword": null, "category": "English", "parsed": 20, "total": 22}]
- tablecheck: planning 0 calls / 0ms / 0 timeouts; source elapsed 29013ms; accepted/rejected history [{"selection": {"accepted": true, "reason": "Initial retrieval for the hard criterion \"tempura restaurant\" in Kichijōji.", "keyword": "tempura", "criterionRef": "criterion:0"}, "elapsedMs": 9531, "parsedCount": 20}]
  Retrieval observations: [{"url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.704096&geo_longitude=139.58020539999998&geo_distance=1km&auto_geolocate=false&search_text=tempura", "keyword": "tempura", "category": null, "parsed": 20, "total": null}]
- google-places: planning 0 calls / 0ms / 0 timeouts; source elapsed Nonems; accepted/rejected history []
  Retrieval observations: [{"url": "google-places:nearby-search", "keyword": null, "category": null, "parsed": null, "total": null}]
- Decision#2 tabelog: parsed=20, categories=53; {"choice": "CATEGORY", "keyword": "", "criterionRef": "criterion:0", "categoryUrl": "https://tabelog.com/en/tokyo/A1320/rstLst/tempura/", "reason": "Supplied category \"Tempura\" directly matches the hard criterion (tempura restaurant) in the same region."}
- Decision#3 SHARED_TEXT_RETRIEVAL: parsed=None, categories=0; {"choice": "KEYWORD", "keyword": "tempura", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "Initial retrieval for the hard criterion \"tempura restaurant\" in Kichijōji."}
- summary: [probe-summary.json](runs/p2-kichijoji-tempura-20261027/attempt-2/probe-summary.json), SHA-256 `a51c1f138978594d2e6ef5171505a5b68deaee86445888a5e8842ac99945e459`
- decisions: [probe.decisions.jsonl](runs/p2-kichijoji-tempura-20261027/attempt-2/probe.decisions.jsonl), SHA-256 `41d282b46a2ce4054b8a892391ce8d1064e489db8cba5854404f204dbd3a92e6`
- trace: [trace.jsonl](runs/p2-kichijoji-tempura-20261027/attempt-2/trace.jsonl), SHA-256 `c77e4ec2c64abc82c923fb523d5eba449a4c398debd080e4d041e86def7aa938`
- recording: [recording.json](runs/p2-kichijoji-tempura-20261027/attempt-2/recording/p2-kichijoji-tempura-20261027/recording.json), SHA-256 `5ca2956ffeedf897bb29d18f0dd3336e662b93d003568336128adf8ba0e74992`

### 8: p2-kf-h002-20261031

Failures []; termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`; unattempted []; per-source parsed radius counts {"tabelog": 5, "tablecheck": 5}.

- tabelog: planning 3 calls / 6608ms / 0 timeouts; source elapsed 78391ms; accepted/rejected history [{"selection": {"accepted": true, "reason": "Initial retrieval targeting first-date-friendly restaurants near Higashi-ginza.", "keyword": "date night", "criterionRef": "criterion:0"}, "elapsedMs": 45749, "parsedCount": 0}, {"selection": {"accepted": true, "reason": "The \"date night\" retrieval returned an explicit empty state with no categories supplied, so I'm trying a materially different keyword tied to the first-date criterion.", "keyword": "first date", "criterionRef": "criterion:0"}, "elapsedMs": 48215, "parsedCount": 0}, {"selection": {"accepted": false, "reason": "Use a general list after rejected retrieval proposal.", "rejectionReason": "INVALID_KEYWORD"}, "elapsedMs": 52706, "parsedCount": 0}]
  Retrieval observations: [{"url": "https://tabelog.com/en/tokyo/", "keyword": null, "category": null, "parsed": 20, "total": 139471}, {"url": "https://tabelog.com/en/tokyo/A1301/", "keyword": null, "category": null, "parsed": 20, "total": 6250}, {"url": "https://tabelog.com/en/tokyo/A1301/A130101/", "keyword": null, "category": null, "parsed": 20, "total": 2658}, {"url": "https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/", "keyword": null, "category": null, "parsed": 20, "total": 5034}, {"url": "https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/", "keyword": null, "category": null, "parsed": 20, "total": 5034}, {"url": "https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/?sw=date+night", "keyword": "date night", "category": null, "parsed": 0, "total": null}, {"url": "https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/?sw=first+date", "keyword": "first date", "category": null, "parsed": 0, "total": null}, {"url": "https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/", "keyword": null, "category": null, "parsed": 20, "total": 5034}, {"url": "https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/", "keyword": null, "category": null, "parsed": 20, "total": 5034}]
- tablecheck: planning 0 calls / 0ms / 0 timeouts; source elapsed 21263ms; accepted/rejected history [{"selection": {"accepted": true, "reason": "Initial retrieval for a first-date restaurant near Higashi-ginza.", "keyword": "first date", "criterionRef": "criterion:0"}, "elapsedMs": 6763, "parsedCount": 20}]
  Retrieval observations: [{"url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.669700299999995&geo_longitude=139.7671399&geo_distance=1km&auto_geolocate=false&search_text=first+date", "keyword": "first date", "category": null, "parsed": 20, "total": null}]
- google-places: planning 0 calls / 0ms / 0 timeouts; source elapsed Nonems; accepted/rejected history []
  Retrieval observations: [{"url": "google-places:nearby-search", "keyword": null, "category": null, "parsed": null, "total": null}]
- Decision#4 tabelog: parsed=20, categories=57; {"choice": "KEYWORD", "keyword": "date night", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "Initial retrieval targeting first-date-friendly restaurants near Higashi-ginza."}
- Decision#5 tabelog: parsed=0, categories=0; {"choice": "KEYWORD", "keyword": "first date", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "The \"date night\" retrieval returned an explicit empty state with no categories supplied, so I'm trying a materially different keyword tied to the first-date criterion."}
- Decision#6 tabelog: parsed=0, categories=0; {"choice": "KEYWORD", "keyword": "Ginza", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "Both prior keyword attempts returned explicit empty states and no categories were supplied, so I'm switching to a materially different, broader keyword tied to the location area rather than alternating synonyms of \"first date\"."}
- Decision#7 SHARED_TEXT_RETRIEVAL: parsed=None, categories=0; {"choice": "KEYWORD", "keyword": "first date", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "Initial retrieval for a first-date restaurant near Higashi-ginza."}
- summary: [probe-summary.json](runs/p2-kf-h002-20261031/attempt-1/probe-summary.json), SHA-256 `e01b797e59c811ee159ec8165dae734336959b66f4d9c87395cc87bfc675c7ec`
- decisions: [probe.decisions.jsonl](runs/p2-kf-h002-20261031/attempt-1/probe.decisions.jsonl), SHA-256 `b893ca9a838a5e7fa18d8b15a8b17011670d6c50502345c5511c62efb79c24e8`
- trace: [trace.jsonl](runs/p2-kf-h002-20261031/attempt-1/trace.jsonl), SHA-256 `a06449023fec9ea5f0637130d88fe7cd4d2b96a3746b03d147420aa9bf3162dd`
- recording: [recording.json](runs/p2-kf-h002-20261031/attempt-1/recording/p2-kf-h002-20261031/recording.json), SHA-256 `95a30113e560513b401502084f619303ec5742a30d850e884eebb48a2777bd3c`

### 9: p2-nakameguro-yakiniku-20261030

Failures []; termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`; unattempted []; per-source parsed radius counts {"tabelog": 4, "tablecheck": 5, "google-places": 34}.

- tabelog: planning 1 calls / 2530ms / 0 timeouts; source elapsed 57623ms; accepted/rejected history [{"selection": {"accepted": true, "reason": "Supplied category \"Yakiniku (Japanese BBQ)\" directly matches the hard criterion; the general list shows no yakiniku entries.", "categoryUrl": "https://tabelog.com/en/tokyo/A1317/A131701/rstLst/yakiniku/"}, "elapsedMs": 31727, "parsedCount": 20}]
  Retrieval observations: [{"url": "https://tabelog.com/en/tokyo/", "keyword": null, "category": null, "parsed": 20, "total": 139471}, {"url": "https://tabelog.com/en/tokyo/A1317/", "keyword": null, "category": null, "parsed": 20, "total": 9309}, {"url": "https://tabelog.com/en/tokyo/A1317/A131701/", "keyword": null, "category": null, "parsed": 20, "total": 1080}, {"url": "https://tabelog.com/en/tokyo/A1317/A131701/", "keyword": null, "category": null, "parsed": 20, "total": 1080}, {"url": "https://tabelog.com/en/tokyo/A1317/A131701/rstLst/yakiniku/", "keyword": null, "category": "English", "parsed": 20, "total": 53}, {"url": "https://tabelog.com/en/tokyo/A1317/A131701/rstLst/yakiniku/", "keyword": null, "category": "English", "parsed": 20, "total": 53}]
- tablecheck: planning 0 calls / 0ms / 0 timeouts; source elapsed 24654ms; accepted/rejected history [{"selection": {"accepted": true, "reason": "Initial retrieval for the hard criterion \"yakiniku\" in Nakameguro.", "keyword": "yakiniku", "criterionRef": "criterion:0"}, "elapsedMs": 8020, "parsedCount": 20}]
  Retrieval observations: [{"url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.638716099999996&geo_longitude=139.7026251&geo_distance=1km&auto_geolocate=false&search_text=yakiniku", "keyword": "yakiniku", "category": null, "parsed": 20, "total": null}]
- google-places: planning 0 calls / 0ms / 0 timeouts; source elapsed Nonems; accepted/rejected history []
  Retrieval observations: [{"url": "google-places:nearby-search", "keyword": null, "category": null, "parsed": null, "total": null}]
- Decision#3 tabelog: parsed=20, categories=52; {"choice": "CATEGORY", "keyword": "", "criterionRef": "criterion:0", "categoryUrl": "https://tabelog.com/en/tokyo/A1317/A131701/rstLst/yakiniku/", "reason": "Supplied category \"Yakiniku (Japanese BBQ)\" directly matches the hard criterion; the general list shows no yakiniku entries."}
- Decision#4 SHARED_TEXT_RETRIEVAL: parsed=None, categories=0; {"choice": "KEYWORD", "keyword": "yakiniku", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "Initial retrieval for the hard criterion \"yakiniku\" in Nakameguro."}
- summary: [probe-summary.json](runs/p2-nakameguro-yakiniku-20261030/attempt-1/probe-summary.json), SHA-256 `997bf3a8d1e061188b55c3ef8e3f93760d66534168c9b635b556204071c40423`
- decisions: [probe.decisions.jsonl](runs/p2-nakameguro-yakiniku-20261030/attempt-1/probe.decisions.jsonl), SHA-256 `ceef5f4f19f437b8dbaa8c1e1a2e1f78c01f8549c6d687aac6aae87e8e1a9d00`
- trace: [trace.jsonl](runs/p2-nakameguro-yakiniku-20261030/attempt-1/trace.jsonl), SHA-256 `5fe12c95ceb60666f54ba6f69a51bb7a00f90a74c9e2455a9a1c3d86a9eed51c`
- recording: [recording.json](runs/p2-nakameguro-yakiniku-20261030/attempt-1/recording/p2-nakameguro-yakiniku-20261030/recording.json), SHA-256 `8394393cbc557e4c5ec91d977ff5cb6efcf0e2eeb97aa28820146eb56ad98e27`

## Preflight, safety and usage

| Index | Start UTC | Status | Counted preflight failure | Preflight Google |
| --- | --- | --- | --- | --- |
| 0 | 2026-10-19T08:13:55.351056+00:00 | PROBE_RECORDED | False | 1 |
| 1 | 2026-10-19T08:16:05.982895+00:00 | PROBE_RECORDED | False | 1 |
| 2 | 2026-10-19T08:18:21.543560+00:00 | PROBE_RECORDED | False | 1 |
| 3 | 2026-10-19T08:20:56.288556+00:00 | PROBE_RECORDED | False | 1 |
| 4 | 2026-10-19T08:23:03.277827+00:00 | PROBE_RECORDED | False | 1 |
| 5 | 2026-10-19T08:24:57.100574+00:00 | ENV_FAILURE | True (approved NO_RESPONSE/503) | 0 |
| 5 | 2026-10-19T09:00:25.219079+00:00 | PROBE_RECORDED | False | 1 |
| 6 | 2026-10-19T09:02:51.908809+00:00 | PROBE_RECORDED | False | 1 |
| 7 | 2026-10-19T09:05:09.453877+00:00 | PROBE_RECORDED | False | 1 |
| 8 | 2026-10-19T09:07:21.982816+00:00 | PROBE_RECORDED | False | 1 |
| 9 | 2026-10-19T09:09:53.116284+00:00 | PROBE_RECORDED | False | 1 |

New A: **49 models**, 19 formal + 10 preflight Google; 10 discovery probes; 1 counted preflight failures. Captured outcomes {"SUCCEEDED": 49}. Cumulative **261/450 models, 41/42 probes, 108 Google,0 full Live**. Offline replay14 calls is already included in the212-model origin.

All recorded source/capture counters and frozen hashes verified; clean worktree verified; 1400 historical files byte-identical. Raw independent boundary assessment by run: {"0": "ABSENT", "1": "ABSENT", "2": "ABSENT", "3": "ABSENT", "4": "ABSENT", "5": "ABSENT", "6": "ABSENT", "7": "ABSENT", "8": "ABSENT", "9": "ABSENT"}. Unknown GET side effects are not inferred safe; missing independent evidence remains NOT_EVALUATED.

## Approved outer recovery and unchanged completed probes

The first attempt for index5 (KF-H005 repeat2) failed before any model/formal probe: the early network-readiness GET to the TableCheck homepage returned HTTP503/TLS established. The source-result preflight had not run. The original outer looked only for the later source preflight and stopped as PREFLIGHT_EVIDENCE_GAP. The original response and ledger are preserved. This is not a claim that a restaurant search returned an empty result, or a VPN root-cause diagnosis.

The human approved the exact outer-only patch.13/13 offline controls reran PASS,0 model/network calls. Recovery freeze commit `b0d15d3`; outer SHA256 `60546a05fbba4d5c4434f129730a5011666025e64cbbd8acb6158ef68b11775c`; freeze SHA256 `5444b8d68333bbf41e252aad81ae2ea08ac0e6221140882f20e0ed6657c4b933`. 595 frozen files verified, including all 262 original files of completed indices0-4. Those five formal probes were not rerun.

The recorded503 is appended as1 countable NO_RESPONSE with original SHA, and the existing one preflight-only retry is used. Remaining completed indices: [5, 6, 7, 8, 9]. New resource use since approval: 20 model calls and 14 Google requests. Source ba20b8a, plan/input/witness bytes, budgets, network policy and S0/stop thresholds are unchanged.

Evidence: [approved application](recovery/approval-and-application.json), [13 controls](recovery/offline-controls.approved.json), [new freeze](recovery/freeze.json), [old ledger snapshot](recovery/ledger.before.json), [raw503](recovery/network-preflight.raw.json). The earlier partial report is preserved byte-for-byte in recovery/partial-report.before-resume.md. Its relative links retain their original report context.

## Evaluation layers and next decision

1. End-to-end outcome: NOT_EVALUATED, because this is discovery-only. No availability/qualification/delivery claim.
2. Component: exact source witness funnel and raw region/retrieval/radius/performance records above. Broad navigation hits and final retrieval hits are distinct.
3. Severity: independent frozen network rule assessment retained per run. S0 declaration and task-level S1-S4 are not evaluated by the discovery probe.
4. Attribution: raw inputs/proposals/history/failure codes are supplied for independent review, not a causal success label. Single-step replay proves only supplied-category choice. Two repeats per TARGET and exposed fixtures do not establish generalization.

Stop here after reporting and authorized push; do not begin P2-1b, additional probes or full Live. If this A still has no improvement, the user decides the next scope under the existing stopping rule.
