# P2-1a DOM-corrected checkpoint A

Evidence: exposed development discovery only; no full Live, availability, qualification or delivery acceptance.

Status **PARTIAL**: 5/10 recorded; stop={'code': 'PREFLIGHT_EVIDENCE_GAP', 'index': 5, 'totalPreflightFailures': 0, 'sourceIds': []}. Production `ba20b8a7e0ae5d00d93838f7f19b0ae01364e2be`; baseline `acfaaffa73db97413f6538f161c4e837ec64316e` unchanged. Previous A209ac42 is retained separately. Correction ba20b8a; replay preparation4017981; outer freeze recorded in Git and freeze.json.

## Fixed controls and proof scope

The 14 single-decision offline model replays passed the predeclared gate: h001, Kichijoji and Nakameguro selected related supplied categories (3 distinct cases; required2). Only6 had exact recorded DOM;7 used later same-region DOM and1 had a DOM evidence gap. Those are counterfactual inputs, not faithful browser session replay. See ../p21a-dom-replay-20261019/report.md.

This new A uses the same ten ordered inputs, center/radius, source preflight and witness bytes as baseline. Existing certification remains valid through at least2026-10-20T03:12:46.141Z;0 recertification requests. Six plan-only runs and external stop/resume controls passed with0 network/models.318 source/config/script SHA hashes frozen before requests. No runtime mutation or formal retry. Each probe15 models/180s, source90s; plan and raw config are authoritative.

The source ancestry contains the prior separately committed Google-only nearby fix ea7113a; this ten-case plan uses the native three-source assembly. Original A raw trace already had Google text queries; URL placeholders in retrieval metrics are not transport evidence and do not establish the alleged nearby regression. See raw googleActualTransport in comparison.json.

Five source gates: typecheck/arch/build PASS,943/943 default tests,117/117 actual local Chromium. Effective changes are DOM category exposure (same Pack grammar and region), Prompt@3/attempt history and bounded duplicate rejection. Schema@1, Guard permissions and qualification remain unchanged. L0/L1 fixture proof, offline L3 decision feasibility, and live read-only discovery are separate.

## Paired source/list/radius facts

Cells show **baseline -> previous A -> new A**. Native cells are listing,first-batch booleans. Google listing requires an exact observed website source ID; similar names do not count. Listing includes broad region-navigation observations, so listing hits do not by themselves prove effective final retrieval. Radius counts are parsed coordinates, including Google candidates, not qualified/deduplicated restaurants.

| Case / repeat | Tabelog list,first | TableCheck list,first | Google exact listing | In-radius count |
| --- | --- | --- | --- | --- |
| p2-kf-h001-20261027 / 1 | 0,0 -> 1,0 -> 1,1 | 0,0 -> 0,0 -> 0,0 | 1 -> 0 -> 1 | 39 -> 39 -> 40 |
| p2-kf-h001-20261027 / 2 | 0,0 -> 1,0 -> 1,1 | 0,0 -> 0,0 -> 0,0 | 1 -> 0 -> 1 | 39 -> 39 -> 44 |
| p2-kagurazaka-kaiseki-20261029 / 1 | 0,0 -> 0,0 -> 0,0 | 0,0 -> 0,0 -> 0,0 | 0 -> 0 -> 0 | 45 -> 45 -> 44 |
| p2-kagurazaka-kaiseki-20261029 / 2 | 0,0 -> 0,0 -> 0,0 | 0,0 -> 0,0 -> 0,0 | 0 -> 0 -> 0 | 45 -> 45 -> 44 |
| p2-kf-h005-20261029 / 1 | 0,0 -> 1,0 -> 1,0 | 0,0 -> 0,0 -> 0,0 | 0 -> 0 -> 0 | 45 -> 45 -> 49 |
| p2-kf-h005-20261029 / 2 | NE | NE | NE | NE |
| p2-kichijoji-tempura-20261027 / 1 | NE | NE | NE | NE |
| p2-kichijoji-tempura-20261027 / 2 | NE | NE | NE | NE |
| p2-kf-h002-20261031 / 1 | NE | NE | NE | NE |
| p2-nakameguro-yakiniku-20261030 / 1 | NE | NE | NE | NE |

## Paired resource facts

Time is formal wall time; preflight is separate. Planning uses actual captured model latencies, including failures. Shared initial text planning is counted once.

| Case / repeat | Models B / old A / new A | Elapsed ms | Pages | Planning calls / ms | Planning timeouts |
| --- | --- | --- | --- | --- | --- |
| p2-kf-h001-20261027 / 1 | 1 / 4 / 4 | 42541 / 61801 / 79187 | 5 / 6 / 7 | 0/0 ; 3/7216 ; 3/6958 | 0 / 0 / 0 |
| p2-kf-h001-20261027 / 2 | 1 / 4 / 4 | 44102 / 95854 / 100591 | 5 / 6 / 7 | 0/0 ; 3/7605 ; 3/9659 | 0 / 0 / 0 |
| p2-kagurazaka-kaiseki-20261029 / 1 | 11 / 9 / 9 | 93505 / 93767 / 126650 | 6 / 8 / 8 | 0/0 ; 1/2214 ; 1/2135 | 0 / 0 / 0 |
| p2-kagurazaka-kaiseki-20261029 / 2 | 12 / 11 / 9 | 103353 / 170913 / 96753 | 6 / 8 / 8 | 0/0 ; 1/1995 ; 1/2306 | 0 / 0 / 0 |
| p2-kf-h005-20261029 / 1 | 3 / 5 / 3 | 51088 / 61145 / 82361 | 4 / 8 / 6 | 0/0 ; 4/6557 ; 2/4615 | 0 / 0 / 0 |

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

## Preflight, safety and usage

| Index | Start UTC | Status | Counted preflight failure | Preflight Google |
| --- | --- | --- | --- | --- |
| 0 | 2026-10-19T08:13:55.351056+00:00 | PROBE_RECORDED | False | 1 |
| 1 | 2026-10-19T08:16:05.982895+00:00 | PROBE_RECORDED | False | 1 |
| 2 | 2026-10-19T08:18:21.543560+00:00 | PROBE_RECORDED | False | 1 |
| 3 | 2026-10-19T08:20:56.288556+00:00 | PROBE_RECORDED | False | 1 |
| 4 | 2026-10-19T08:23:03.277827+00:00 | PROBE_RECORDED | False | 1 |
| 5 | 2026-10-19T08:24:57.100574+00:00 | ENV_FAILURE | False | 0 |

New A: **29 models**, 10 formal + 5 preflight Google; 5 discovery probes; 0 counted preflight failures. Captured outcomes {"SUCCEEDED": 29}. Cumulative **241/450 models, 36/42 probes, 94 Google,0 full Live**. Offline replay14 calls is already included in the212-model origin.

All recorded source/capture counters and frozen hashes verified; clean worktree verified; 1400 historical files byte-identical. Raw independent boundary assessment by run: {"0": "ABSENT", "1": "ABSENT", "2": "ABSENT", "3": "ABSENT", "4": "ABSENT"}. Unknown GET side effects are not inferred safe; missing independent evidence remains NOT_EVALUATED.

## Evaluation layers and next decision

1. End-to-end outcome: NOT_EVALUATED, because this is discovery-only. No availability/qualification/delivery claim.
2. Component: exact source witness funnel and raw region/retrieval/radius/performance records above. Broad navigation hits and final retrieval hits are distinct.
3. Severity: independent frozen network rule assessment retained per run. S0 declaration and task-level S1-S4 are not evaluated by the discovery probe.
4. Attribution: raw inputs/proposals/history/failure codes are supplied for independent review, not a causal success label. Single-step replay proves only supplied-category choice. Two repeats per TARGET and exposed fixtures do not establish generalization.

Stop here after reporting and authorized push; do not begin P2-1b, additional probes or full Live. If this A still has no improvement, the user decides the next scope under the existing stopping rule.

## Interruption before formal item 6 / approval pending

KF-H005 repeat2 failed the early public-endpoint readiness check at 2026-10-19T08:25:02.209Z: GET https://www.tablecheck.com/en/ returned HTTP503, TLS established. DeepSeek/models200, Google endpoint404(reachable), Tabelog200. This is an observed TableCheck endpoint response; no claim about VPN or server root cause.0 model calls and no formal probe started. Raw response [copy](recovery/network-preflight.raw.json), SHA256 `c1efb579abd2d18015a2038dcec68a7b76df8bace4d70f8313dcd23231351b4f`; original path is in recovery/proposal.json.

The frozen outer only classifies source-data-preflight.json, which was never reached. It therefore records PREFLIGHT_EVIDENCE_GAP and blocks further attempts. The underlying evidence is present in the earlier LIVE_NETWORK_PREFLIGHT result. Frozen ledger count remains0; the proposed recovery would classify this503 as one NO_RESPONSE and use the existing single preflight-only retry. Original failed bytes and ledger snapshot are preserved, and the five completed formal probes cannot be rerun.

A concrete outer-only patch and13 offline positive/negative checks are in recovery/outer-network-preflight-resume.proposed.patch and recovery/offline-controls.json. They were not applied or executed. Source ba20b8a, input bytes, budgets, one-retry bound and S0 stops remain unchanged. Approval is pending because Eval Skill §5 requires user approval and new SHA for changing frozen orchestration mid-batch.

Current formal5/10, new29 models,15 Google (10 formal+5 source preflight). Including offline replay14: cumulative241/450 models,36/42 probes,94 Google,0 full Live. Five remaining planned probes are NOT_STARTED, not failures or successes. Do not infer full A quality from the partial denominator.
