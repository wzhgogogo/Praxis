# Corrected P2-1 checkpoint A (2026-10-19)

Evidence status: exposed development comparison; not a clean holdout or full Live acceptance.

Status: **COMPLETE**, 10/10 formal discovery probes; stop=None. Baseline remains `acfaaffa73db97413f6538f161c4e837ec64316e`; corrected A frozen at `209ac4200a1330e0ed8e1bdcbd03dd30faac0a23`. Source correction commit `209ac42`, eval preflight `484f154`, outer freeze `ee6ebd0`.

## Scope and controls

Only discovery: no availability evaluation, qualification or delivery. Same ten ordered inputs, radius and certified witnesses; six input SHA checks and plan-only runs passed. Certification remains valid through at least 2026-10-20 03:12:46.141 UTC (Tokyo12:12). No recertification requests were needed. Baseline TARGET native listing hit0/4 did not trigger the pre-A stop.

Preflight now calls prepareNavigation with the formal first-navigation/request deadline35s, records HTTP and Guard diagnostics, and separates EMPTY_RESULT from NO_RESPONSE. Historical three failures are annotated as preflight defects (historical cause not fully established), excluded from stop counts. Old A1 is preserved as P2-1a defect version, excluded from comparison, still charged4 models/1 probe. See [reclassifications](review-reclassifications.json).

Preflight red/green: 6.5s delayed actual Chromium response, old count0/EMPTY_RESULT versus new count1/HTTP200. Category red/green uses seven original A1 homepage anchor tags; old Pack0 versus new>0, with actual production Chromium composition. Fragment has no original CSS: controlled visibility proves mechanics, not original-page visible categories. Prompt@2 clarifies retained candidates, category expansion and KEEP; schema@1 unchanged.

Five gates for corrected source: typecheck/arch/build PASS, npm test942/942, real local Chromium117/117. [Preflight evidence](preflight/report.md), [P2-1a evidence](retrieval/report.md), [gates](retrieval/gates/results.json), [freeze315 files](freeze.json), [outer controls](outer-dry-run.json), [six dry runs](runner-dry-run.json).

## Aggregate facts

```json
{
  "baseline": {
    "listingBySource": {
      "tabelog": 1,
      "tablecheck": 0,
      "google-places": 5
    },
    "firstBatchBySource": {
      "tabelog": 0,
      "tablecheck": 0
    },
    "modelCalls": 55,
    "elapsedMs": 788353,
    "planningCalls": 0,
    "planningLatencyMs": 0,
    "planningTimeouts": 0,
    "pagePlanningCalls": 0,
    "pagePlanningWithCategories": 0,
    "failures": {
      "EXTRACTION_FAILED": 2,
      "DISCOVERY_SOURCE_LOCATION_UNGROUNDED": 2,
      "AGENT_EXECUTION_FAILED": 1
    },
    "boundaries": {
      "ABSENT": 10
    }
  },
  "A": {
    "listingBySource": {
      "tabelog": 8,
      "tablecheck": 0,
      "google-places": 3
    },
    "firstBatchBySource": {
      "tabelog": 3,
      "tablecheck": 0
    },
    "modelCalls": 53,
    "elapsedMs": 1062253,
    "planningCalls": 24,
    "planningLatencyMs": 52395,
    "planningTimeouts": 0,
    "pagePlanningCalls": 14,
    "pagePlanningWithCategories": 0,
    "failures": {
      "READ_BUDGET_EXCEEDED": 2
    },
    "boundaries": {
      "ABSENT": 10
    }
  }
}
```

Page-bound planning inputs with categories are counted independently of Pack fixture extraction. These are observed outcomes, not an independent attribution or acceptance verdict.

## Paired listing and radius facts

Listing metric includes region navigation lists, not only final retrieval; broad-page hits do not establish keyword/category effectiveness. Native first batch uses exact source/entity IDs. Google listing credit requires exact website source ID; name-only remains uncredited and is retained in raw summary. Google native-first-batch is not applicable. Radius counts are parsed coordinates including Google candidates, not verified/deduplicated businesses.

| Case / repeat | Tabelog list,first B -> A | TableCheck list,first B -> A | Google exact B -> A | In-radius count B -> A |
| --- | --- | --- | --- | --- |
| p2-kf-h001-20261027 / 1 | 0,0 -> 1,0 | 0,0 -> 0,0 | 1 -> 0 | 39 -> 39 |
| p2-kf-h001-20261027 / 2 | 0,0 -> 1,0 | 0,0 -> 0,0 | 1 -> 0 | 39 -> 39 |
| p2-kagurazaka-kaiseki-20261029 / 1 | 0,0 -> 0,0 | 0,0 -> 0,0 | 0 -> 0 | 45 -> 45 |
| p2-kagurazaka-kaiseki-20261029 / 2 | 0,0 -> 0,0 | 0,0 -> 0,0 | 0 -> 0 | 45 -> 45 |
| p2-kf-h005-20261029 / 1 | 0,0 -> 1,0 | 0,0 -> 0,0 | 0 -> 0 | 45 -> 45 |
| p2-kf-h005-20261029 / 2 | 0,0 -> 1,0 | 0,0 -> 0,0 | 0 -> 0 | 45 -> 45 |
| p2-kichijoji-tempura-20261027 / 1 | 0,0 -> 1,1 | 0,0 -> 0,0 | 1 -> 1 | 50 -> 50 |
| p2-kichijoji-tempura-20261027 / 2 | 0,0 -> 1,1 | 0,0 -> 0,0 | 1 -> 1 | 50 -> 50 |
| p2-kf-h002-20261031 / 1 | 1,0 -> 1,0 | 0,0 -> 0,0 | 0 -> 0 | 30 -> 10 |
| p2-nakameguro-yakiniku-20261030 / 1 | 0,0 -> 1,1 | 0,0 -> 0,0 | 1 -> 1 | 39 -> 43 |

## Paired resource facts

Elapsed is formal probe wall time, excluding external preflight. Planning latency is measured per actual model capture, including failed calls. Shared text proposal is counted once, not duplicated into TableCheck and Google. Per-source cap remains90s; no planning-time gate is added here.

| Case / repeat | Model B -> A | Elapsed ms B -> A | Pages B -> A | Planning calls/ms B -> A | Planning timeouts B -> A |
| --- | --- | --- | --- | --- | --- |
| p2-kf-h001-20261027 / 1 | 1 -> 4 | 42541 -> 61801 | 5 -> 6 | 0/0 -> 3/7216 | 0 -> 0 |
| p2-kf-h001-20261027 / 2 | 1 -> 4 | 44102 -> 95854 | 5 -> 6 | 0/0 -> 3/7605 | 0 -> 0 |
| p2-kagurazaka-kaiseki-20261029 / 1 | 11 -> 9 | 93505 -> 93767 | 6 -> 8 | 0/0 -> 1/2214 | 0 -> 0 |
| p2-kagurazaka-kaiseki-20261029 / 2 | 12 -> 11 | 103353 -> 170913 | 6 -> 8 | 0/0 -> 1/1995 | 0 -> 0 |
| p2-kf-h005-20261029 / 1 | 3 -> 5 | 51088 -> 61145 | 4 -> 8 | 0/0 -> 4/6557 | 0 -> 0 |
| p2-kf-h005-20261029 / 2 | 3 -> 5 | 47689 -> 65801 | 4 -> 8 | 0/0 -> 4/7392 | 0 -> 0 |
| p2-kichijoji-tempura-20261027 / 1 | 6 -> 3 | 108903 -> 131767 | 9 -> 6 | 0/0 -> 2/4612 | 0 -> 0 |
| p2-kichijoji-tempura-20261027 / 2 | 6 -> 3 | 100411 -> 133786 | 9 -> 6 | 0/0 -> 2/4923 | 0 -> 0 |
| p2-kf-h002-20261031 / 1 | 3 -> 5 | 88656 -> 104749 | 6 -> 7 | 0/0 -> 2/5136 | 0 -> 0 |
| p2-nakameguro-yakiniku-20261030 / 1 | 9 -> 4 | 108105 -> 142670 | 10 -> 7 | 0/0 -> 2/4745 | 0 -> 0 |

## Per-run retrieval and artifacts

Raw [comparison.json](comparison.json) contains accepted history, per-source planning latency/timeouts, parsed/displayed counts, actual call inputs/proposals and hashes. Retrieval history elapsedMs is cumulative source time, not planning latency. Unbound TableCheck metric placeholders remain null; actual source funnel/history is supplied beside them, without rewriting the frozen metric.

### p2-kf-h001-20261027 / 1 (TARGET)


**Baseline** failures=[]; termination=ALL_PLANNED_FIRST_BATCHES_ATTEMPTED; unattempted=[]; radius by source={"tabelog": 1, "tablecheck": 5, "google-places": 33}.

- tabelog: planning 0 calls/0ms/0 timeouts; source elapsed=22328ms; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "omakase", "category": null, "url": "https://tabelog.com/en/tokyo/rstLst/?sw=omakase", "parsed": 20, "total": 36, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "omakase", "category": null, "url": "https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase", "parsed": 3, "total": 3, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "omakase", "category": null, "url": "https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase", "parsed": 3, "total": 3, "observationStatus": "OBSERVED_LISTING"}]
- tablecheck: planning 0 calls/0ms/0 timeouts; source elapsed=18142ms; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "omakase", "category": null, "url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- google-places: planning 0 calls/0ms/0 timeouts; source elapsed=Nonems; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "omakase", "category": null, "url": "google-places:text-search", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- Shared text planning (one charge): []
- summary: [probe-summary.json](../network-restored-20261019/baseline/p2-kf-h001-20261027/attempt-1/probe-summary.json); SHA-256 `79c5eda037cf0bb867f0aed6ced04315ebf0dedd3057c8ba29bf6502f6d90cc9`
- decisions: [probe.decisions.jsonl](../network-restored-20261019/baseline/p2-kf-h001-20261027/attempt-1/probe.decisions.jsonl); SHA-256 `4e0f954363fcda9a723b33aed6e87799eb0809a033f9845eeaf374afdecf4053`
- trace: [trace.jsonl](../network-restored-20261019/baseline/p2-kf-h001-20261027/attempt-1/trace.jsonl); SHA-256 `0224a2423386262e06abbefe0aac98972741a2ea5285c432a07773b0a2ebbf05`
- recording: [recording.json](../network-restored-20261019/baseline/p2-kf-h001-20261027/attempt-1/recording/p2-kf-h001-20261027/recording.json); SHA-256 `fc47a8dce7d8bba5c812effe0380869c6514139cd7bf7c59a202c107dc4879d4`

**A** failures=[]; termination=ALL_PLANNED_FIRST_BATCHES_ATTEMPTED; unattempted=[]; radius by source={"tabelog": 1, "tablecheck": 5, "google-places": 33}.

- tabelog: planning 2 calls/5133ms/0 timeouts; source elapsed=36651ms; selection/history={"rewrites": 0, "regionPages": 2, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Search Shibuya listings for the hard criterion \"omakase\".", "keyword": "omakase", "criterionRef": "criterion:0"}, "elapsedMs": 23766, "parsedCount": 3}, {"selection": {"accepted": true, "reason": "Current keyword search for \"omakase\" in Shibuya already returned a small, relevant list of 3 restaurants; no supplied categories exist to expand into, so retain this retrieval.", "keep": true}, "elapsedMs": 26726, "parsedCount": 3}], "selection": {"accepted": true, "reason": "Search Shibuya listings for the hard criterion \"omakase\".", "keyword": "omakase", "criterionRef": "criterion:0"}}
  Observed retrieval sequence: [{"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/", "parsed": 20, "total": 139480, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1303/", "parsed": 20, "total": 5618, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1303/", "parsed": 20, "total": 5618, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "omakase", "category": null, "url": "https://tabelog.com/en/tokyo/A1303/?sw=omakase", "parsed": 3, "total": 3, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "omakase", "category": null, "url": "https://tabelog.com/en/tokyo/A1303/?sw=omakase", "parsed": 3, "total": 3, "observationStatus": "OBSERVED_LISTING"}]
- tablecheck: planning 0 calls/0ms/0 timeouts; source elapsed=23306ms; selection/history={"selection": {"accepted": true, "reason": "Initial retrieval for the hard criterion \"omakase\" in Shibuya.", "keyword": "omakase", "criterionRef": "criterion:0"}, "rewrites": 0, "regionPages": 0, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Initial retrieval for the hard criterion \"omakase\" in Shibuya.", "keyword": "omakase", "criterionRef": "criterion:0"}, "elapsedMs": 6519, "parsedCount": 20}]}
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "omakase", "category": null, "url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase", "parsed": 20, "total": null, "observationStatus": "OBSERVED_LISTING"}]
- google-places: planning 0 calls/0ms/0 timeouts; source elapsed=Nonems; selection/history=null
  Observed retrieval sequence: [{"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "google-places:nearby-search", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- Shared text planning (one charge): [{"sequence": 4, "source": "SHARED_TEXT_RETRIEVAL", "latencyMs": 2083, "outcome": "SUCCEEDED", "errorCode": null, "timeout": false, "url": null, "parsedCount": null, "categoryCount": 0, "proposal": {"choice": "KEYWORD", "keyword": "omakase", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "Initial retrieval for the hard criterion \"omakase\" in Shibuya."}}]
- summary: [probe-summary.json](../checkpoint-a-corrected-20261019/runs/p2-kf-h001-20261027/attempt-1/probe-summary.json); SHA-256 `97821ce83c3413bf74c6742f9dc424b4c507387a9daad0b719872c53f5a407b7`
- decisions: [probe.decisions.jsonl](../checkpoint-a-corrected-20261019/runs/p2-kf-h001-20261027/attempt-1/probe.decisions.jsonl); SHA-256 `22eff28814e5f1ea4591da25b758043ea94abe9e1d3f3fd0e5217560b6473456`
- trace: [trace.jsonl](../checkpoint-a-corrected-20261019/runs/p2-kf-h001-20261027/attempt-1/trace.jsonl); SHA-256 `b1094c4646222cbd566ae75f3bed75c73b663b3aba093457b78fad3538e8eb66`
- recording: [recording.json](../checkpoint-a-corrected-20261019/runs/p2-kf-h001-20261027/attempt-1/recording/p2-kf-h001-20261027/recording.json); SHA-256 `61420d0d85d54ebd2412c62c51ec62ca0a73cb2bc8a72d3068d40fc6b21c7c32`

### p2-kf-h001-20261027 / 2 (TARGET)


**Baseline** failures=[]; termination=ALL_PLANNED_FIRST_BATCHES_ATTEMPTED; unattempted=[]; radius by source={"tabelog": 1, "tablecheck": 5, "google-places": 33}.

- tabelog: planning 0 calls/0ms/0 timeouts; source elapsed=23331ms; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "omakase", "category": null, "url": "https://tabelog.com/en/tokyo/rstLst/?sw=omakase", "parsed": 20, "total": 36, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "omakase", "category": null, "url": "https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase", "parsed": 3, "total": 3, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "omakase", "category": null, "url": "https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase", "parsed": 3, "total": 3, "observationStatus": "OBSERVED_LISTING"}]
- tablecheck: planning 0 calls/0ms/0 timeouts; source elapsed=18975ms; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "omakase", "category": null, "url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- google-places: planning 0 calls/0ms/0 timeouts; source elapsed=Nonems; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "omakase", "category": null, "url": "google-places:text-search", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- Shared text planning (one charge): []
- summary: [probe-summary.json](../network-restored-20261019/baseline/p2-kf-h001-20261027/attempt-2/probe-summary.json); SHA-256 `6697005ac6077358305b6adf6356de662fb4ba8fa35f86c1fc26e8d77c7dbee5`
- decisions: [probe.decisions.jsonl](../network-restored-20261019/baseline/p2-kf-h001-20261027/attempt-2/probe.decisions.jsonl); SHA-256 `c46ef9f6cf5ddb3b0275cba3a9effb497dc15ae0efc0e285b4d8dcfc1f25f810`
- trace: [trace.jsonl](../network-restored-20261019/baseline/p2-kf-h001-20261027/attempt-2/trace.jsonl); SHA-256 `c9cf6440e79233e4a1eced2699b7f890b4eed646fdc2a5444f143568335c56c6`
- recording: [recording.json](../network-restored-20261019/baseline/p2-kf-h001-20261027/attempt-2/recording/p2-kf-h001-20261027/recording.json); SHA-256 `0c7671ac8929fd87b1b50e24d25b8492dd3b25150191ea1e77ccfe174d60da1e`

**A** failures=[]; termination=ALL_PLANNED_FIRST_BATCHES_ATTEMPTED; unattempted=[]; radius by source={"tabelog": 1, "tablecheck": 5, "google-places": 33}.

- tabelog: planning 2 calls/5408ms/0 timeouts; source elapsed=40072ms; selection/history={"rewrites": 0, "regionPages": 2, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Search Shibuya listings for the hard criterion \"omakase\".", "keyword": "omakase", "criterionRef": "criterion:0"}, "elapsedMs": 24795, "parsedCount": 3}, {"selection": {"accepted": true, "reason": "Current Shibuya omakase search returned 3 relevant listings; no supplied categories to expand into, so retain retrieval.", "keep": true}, "elapsedMs": 27594, "parsedCount": 3}], "selection": {"accepted": true, "reason": "Search Shibuya listings for the hard criterion \"omakase\".", "keyword": "omakase", "criterionRef": "criterion:0"}}
  Observed retrieval sequence: [{"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/", "parsed": 20, "total": 139480, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1303/", "parsed": 20, "total": 5618, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1303/", "parsed": 20, "total": 5618, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "omakase", "category": null, "url": "https://tabelog.com/en/tokyo/A1303/?sw=omakase", "parsed": 3, "total": 3, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "omakase", "category": null, "url": "https://tabelog.com/en/tokyo/A1303/?sw=omakase", "parsed": 3, "total": 3, "observationStatus": "OBSERVED_LISTING"}]
- tablecheck: planning 0 calls/0ms/0 timeouts; source elapsed=53508ms; selection/history={"selection": {"accepted": true, "reason": "Initial retrieval for hard criterion \"omakase\" in Shibuya.", "keyword": "omakase", "criterionRef": "criterion:0"}, "rewrites": 0, "regionPages": 0, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Initial retrieval for hard criterion \"omakase\" in Shibuya.", "keyword": "omakase", "criterionRef": "criterion:0"}, "elapsedMs": 15746, "parsedCount": 20}]}
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "omakase", "category": null, "url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase", "parsed": 20, "total": null, "observationStatus": "OBSERVED_LISTING"}]
- google-places: planning 0 calls/0ms/0 timeouts; source elapsed=Nonems; selection/history=null
  Observed retrieval sequence: [{"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "google-places:nearby-search", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- Shared text planning (one charge): [{"sequence": 4, "source": "SHARED_TEXT_RETRIEVAL", "latencyMs": 2197, "outcome": "SUCCEEDED", "errorCode": null, "timeout": false, "url": null, "parsedCount": null, "categoryCount": 0, "proposal": {"choice": "KEYWORD", "keyword": "omakase", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "Initial retrieval for hard criterion \"omakase\" in Shibuya."}}]
- summary: [probe-summary.json](../checkpoint-a-corrected-20261019/runs/p2-kf-h001-20261027/attempt-2/probe-summary.json); SHA-256 `2fa5d19e73f0d675a23e85574c86e036c265151f67afc94af43323cae3cef947`
- decisions: [probe.decisions.jsonl](../checkpoint-a-corrected-20261019/runs/p2-kf-h001-20261027/attempt-2/probe.decisions.jsonl); SHA-256 `3acb9bf8bcec41356531a2c4dc74a9369e5259044f2096fdb9d49941921aed2b`
- trace: [trace.jsonl](../checkpoint-a-corrected-20261019/runs/p2-kf-h001-20261027/attempt-2/trace.jsonl); SHA-256 `dca7003de6ee3a5ad20cb03317a30108d77bf41353e84ea52cc42204b3d8e310`
- recording: [recording.json](../checkpoint-a-corrected-20261019/runs/p2-kf-h001-20261027/attempt-2/recording/p2-kf-h001-20261027/recording.json); SHA-256 `dce3bd53399762dae907a44e5f67a839ecec5c053749f756963028695c7bd06b`

### p2-kagurazaka-kaiseki-20261029 / 1 (TARGET)


**Baseline** failures=["EXTRACTION_FAILED"]; termination=ALL_PLANNED_FIRST_BATCHES_ATTEMPTED; unattempted=[]; radius by source={"tablecheck": 5, "google-places": 40}.

- tabelog: planning 0 calls/0ms/0 timeouts; source elapsed=70205ms; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "kaiseki restaurant", "category": null, "url": "https://tabelog.com/en/tokyo/rstLst/?sw=kaiseki+restaurant", "parsed": 0, "total": null, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "kaiseki restaurant", "category": null, "url": "https://tabelog.com/en/tokyo/C13104/rstLst/?sw=kaiseki%20restaurant", "parsed": 0, "total": null, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "kaiseki restaurant", "category": null, "url": "https://tabelog.com/en/tokyo/C13104/rstLst/", "parsed": 20, "total": 10367, "observationStatus": "OBSERVED_LISTING"}]
- tablecheck: planning 0 calls/0ms/0 timeouts; source elapsed=21393ms; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "kaiseki restaurant", "category": null, "url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.701459799999995&geo_longitude=139.7402946&geo_distance=1km&auto_geolocate=false&search_text=kaiseki+restaurant", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- google-places: planning 0 calls/0ms/0 timeouts; source elapsed=Nonems; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "kaiseki restaurant", "category": null, "url": "google-places:text-search", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- Shared text planning (one charge): []
- summary: [probe-summary.json](../network-restored-20261019/baseline/p2-kagurazaka-kaiseki-20261029/attempt-1/probe-summary.json); SHA-256 `25b836728708d56c4b1281af5c00e357ef858dc68b67119ac831222e65b72734`
- decisions: [probe.decisions.jsonl](../network-restored-20261019/baseline/p2-kagurazaka-kaiseki-20261029/attempt-1/probe.decisions.jsonl); SHA-256 `361f05fc88abe3313ff7a8e30a8f0bcea0f39a7c8751fb9ccfeb490efd5e38d5`
- trace: [trace.jsonl](../network-restored-20261019/baseline/p2-kagurazaka-kaiseki-20261029/attempt-1/trace.jsonl); SHA-256 `b754b4e751c4516b51beae0c513a6c23f778b53ccd891a468494947837e44196`
- recording: [recording.json](../network-restored-20261019/baseline/p2-kagurazaka-kaiseki-20261029/attempt-1/recording/p2-kagurazaka-kaiseki-20261029/recording.json); SHA-256 `2b10328e5b1d40d2981838f36d989f3e663f76a0642fd55a3538acd3d226a2dd`

**A** failures=["READ_BUDGET_EXCEEDED"]; termination=ALL_PLANNED_FIRST_BATCHES_ATTEMPTED; unattempted=[]; radius by source={"tablecheck": 5, "google-places": 40}.

- tabelog: planning 0 calls/0ms/0 timeouts; source elapsed=71395ms; selection/history={"rewrites": 0, "regionPages": 5, "retrievalPages": 0, "history": []}
  Observed retrieval sequence: [{"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/", "parsed": 20, "total": 139478, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1304/", "parsed": 20, "total": 7123, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1304/A130401/", "parsed": 0, "total": 5592, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1304/", "parsed": 0, "total": 7123, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/rstLst/", "parsed": 20, "total": 906597, "observationStatus": "OBSERVED_LISTING"}]
- tablecheck: planning 0 calls/0ms/0 timeouts; source elapsed=20049ms; selection/history={"selection": {"accepted": true, "reason": "Initial retrieval for the hard criterion \"kaiseki restaurant\" in Kagurazaka.", "keyword": "kaiseki", "criterionRef": "criterion:0"}, "rewrites": 0, "regionPages": 0, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Initial retrieval for the hard criterion \"kaiseki restaurant\" in Kagurazaka.", "keyword": "kaiseki", "criterionRef": "criterion:0"}, "elapsedMs": 6872, "parsedCount": 20}]}
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "kaiseki", "category": null, "url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.701459799999995&geo_longitude=139.7402946&geo_distance=1km&auto_geolocate=false&search_text=kaiseki", "parsed": 20, "total": null, "observationStatus": "OBSERVED_LISTING"}]
- google-places: planning 0 calls/0ms/0 timeouts; source elapsed=Nonems; selection/history=null
  Observed retrieval sequence: [{"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "google-places:nearby-search", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- Shared text planning (one charge): [{"sequence": 9, "source": "SHARED_TEXT_RETRIEVAL", "latencyMs": 2214, "outcome": "SUCCEEDED", "errorCode": null, "timeout": false, "url": null, "parsedCount": null, "categoryCount": 0, "proposal": {"choice": "KEYWORD", "keyword": "kaiseki", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "Initial retrieval for the hard criterion \"kaiseki restaurant\" in Kagurazaka."}}]
- summary: [probe-summary.json](../checkpoint-a-corrected-20261019/runs/p2-kagurazaka-kaiseki-20261029/attempt-1/probe-summary.json); SHA-256 `084dbb7498a070989596de1e300b9340ef279ccd87c5197bb878a9c087d015a8`
- decisions: [probe.decisions.jsonl](../checkpoint-a-corrected-20261019/runs/p2-kagurazaka-kaiseki-20261029/attempt-1/probe.decisions.jsonl); SHA-256 `ec85d79337d6f439ed8b2ee87fb4b3eebeb861dc11eb23f14a91cb0f32a420ee`
- trace: [trace.jsonl](../checkpoint-a-corrected-20261019/runs/p2-kagurazaka-kaiseki-20261029/attempt-1/trace.jsonl); SHA-256 `0e95f11b54844b1da81686f7c42bcf25fef20271650241ed2501f2a5ae783a9d`
- recording: [recording.json](../checkpoint-a-corrected-20261019/runs/p2-kagurazaka-kaiseki-20261029/attempt-1/recording/p2-kagurazaka-kaiseki-20261029/recording.json); SHA-256 `4b584ac4b7025785cef8d3bb77ad552819d86391d215a5517852767d8c24566d`

### p2-kagurazaka-kaiseki-20261029 / 2 (TARGET)


**Baseline** failures=["EXTRACTION_FAILED"]; termination=ALL_PLANNED_FIRST_BATCHES_ATTEMPTED; unattempted=[]; radius by source={"tablecheck": 5, "google-places": 40}.

- tabelog: planning 0 calls/0ms/0 timeouts; source elapsed=76617ms; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "kaiseki restaurant", "category": null, "url": "https://tabelog.com/en/tokyo/rstLst/?sw=kaiseki+restaurant", "parsed": 0, "total": null, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "kaiseki restaurant", "category": null, "url": "https://tabelog.com/en/tokyo/C13104/rstLst/?sw=kaiseki%20restaurant", "parsed": 0, "total": null, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "kaiseki restaurant", "category": null, "url": "https://tabelog.com/en/tokyo/C13104/rstLst/", "parsed": 20, "total": 10367, "observationStatus": "OBSERVED_LISTING"}]
- tablecheck: planning 0 calls/0ms/0 timeouts; source elapsed=24759ms; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "kaiseki restaurant", "category": null, "url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.701459799999995&geo_longitude=139.7402946&geo_distance=1km&auto_geolocate=false&search_text=kaiseki+restaurant", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- google-places: planning 0 calls/0ms/0 timeouts; source elapsed=Nonems; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "kaiseki restaurant", "category": null, "url": "google-places:text-search", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- Shared text planning (one charge): []
- summary: [probe-summary.json](../network-restored-20261019/baseline/p2-kagurazaka-kaiseki-20261029/attempt-2-preflight-2/probe-summary.json); SHA-256 `e3bc54db6b8ee1ca5b9a95252fa342a0f5f6dfc8bbc0f1df105d2849cce5b4aa`
- decisions: [probe.decisions.jsonl](../network-restored-20261019/baseline/p2-kagurazaka-kaiseki-20261029/attempt-2-preflight-2/probe.decisions.jsonl); SHA-256 `52d81e845b5bd044c3e655e6d5ca2bc920c3bc6c7b9dbb647a1f45042064dc06`
- trace: [trace.jsonl](../network-restored-20261019/baseline/p2-kagurazaka-kaiseki-20261029/attempt-2-preflight-2/trace.jsonl); SHA-256 `9b5eea28408d5a65381ed629fe9b4af406982d67a11eb1216450ca7f1666cdc2`
- recording: [recording.json](../network-restored-20261019/baseline/p2-kagurazaka-kaiseki-20261029/attempt-2-preflight-2/recording/p2-kagurazaka-kaiseki-20261029/recording.json); SHA-256 `49bde35a831c64492c1eea8adde1f90bf28c22f8b781301292c0f0f4e9753961`

**A** failures=["READ_BUDGET_EXCEEDED"]; termination=ALL_PLANNED_FIRST_BATCHES_ATTEMPTED; unattempted=[]; radius by source={"tablecheck": 5, "google-places": 40}.

- tabelog: planning 0 calls/0ms/0 timeouts; source elapsed=82858ms; selection/history={"rewrites": 0, "regionPages": 5, "retrievalPages": 0, "history": []}
  Observed retrieval sequence: [{"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/", "parsed": 20, "total": 139478, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1304/", "parsed": 20, "total": 7123, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1304/A130401/", "parsed": 0, "total": 5592, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1304/rstLst/?railroad=false", "parsed": 0, "total": 7123, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1304/A130401/", "parsed": 20, "total": 5592, "observationStatus": "OBSERVED_LISTING"}]
- tablecheck: planning 0 calls/0ms/0 timeouts; source elapsed=86246ms; selection/history={"selection": {"accepted": true, "reason": "Initial retrieval for the hard criterion \"kaiseki restaurant\" in Kagurazaka.", "keyword": "kaiseki", "criterionRef": "criterion:0"}, "rewrites": 0, "regionPages": 0, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Initial retrieval for the hard criterion \"kaiseki restaurant\" in Kagurazaka.", "keyword": "kaiseki", "criterionRef": "criterion:0"}, "elapsedMs": 20203, "parsedCount": 20}]}
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "kaiseki", "category": null, "url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.701459799999995&geo_longitude=139.7402946&geo_distance=1km&auto_geolocate=false&search_text=kaiseki", "parsed": 20, "total": null, "observationStatus": "OBSERVED_LISTING"}]
- google-places: planning 0 calls/0ms/0 timeouts; source elapsed=Nonems; selection/history=null
  Observed retrieval sequence: [{"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "google-places:nearby-search", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- Shared text planning (one charge): [{"sequence": 11, "source": "SHARED_TEXT_RETRIEVAL", "latencyMs": 1995, "outcome": "SUCCEEDED", "errorCode": null, "timeout": false, "url": null, "parsedCount": null, "categoryCount": 0, "proposal": {"choice": "KEYWORD", "keyword": "kaiseki", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "Initial retrieval for the hard criterion \"kaiseki restaurant\" in Kagurazaka."}}]
- summary: [probe-summary.json](../checkpoint-a-corrected-20261019/runs/p2-kagurazaka-kaiseki-20261029/attempt-2/probe-summary.json); SHA-256 `2868b93206a56d33ccb11c00d4251b30aadac3ba942f2d5c0a2972b024ce4307`
- decisions: [probe.decisions.jsonl](../checkpoint-a-corrected-20261019/runs/p2-kagurazaka-kaiseki-20261029/attempt-2/probe.decisions.jsonl); SHA-256 `67fb2316f9bec973dfdc642f2b77c31f2665521bdfa6581b65cf711ee1b2957a`
- trace: [trace.jsonl](../checkpoint-a-corrected-20261019/runs/p2-kagurazaka-kaiseki-20261029/attempt-2/trace.jsonl); SHA-256 `5406c12c5cd56929efb610d8de7892ce9f0751657c110d1cf0b0202a639b08f3`
- recording: [recording.json](../checkpoint-a-corrected-20261019/runs/p2-kagurazaka-kaiseki-20261029/attempt-2/recording/p2-kagurazaka-kaiseki-20261029/recording.json); SHA-256 `cd3efa8abc9ebb56b6e2425eb35bfea9c5cd49947c9cf5a84b0e236997b36535`

### p2-kf-h005-20261029 / 1 (TARGET)


**Baseline** failures=["DISCOVERY_SOURCE_LOCATION_UNGROUNDED"]; termination=ALL_PLANNED_FIRST_BATCHES_ATTEMPTED; unattempted=[]; radius by source={"tablecheck": 5, "google-places": 40}.

- tabelog: planning 0 calls/0ms/0 timeouts; source elapsed=17954ms; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "local food", "category": null, "url": "https://tabelog.com/en/tokyo/rstLst/?sw=local+food", "parsed": 2, "total": 2, "observationStatus": "OBSERVED_LISTING"}]
- tablecheck: planning 0 calls/0ms/0 timeouts; source elapsed=31039ms; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "local food", "category": null, "url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6697&geo_longitude=139.767&geo_distance=1km&auto_geolocate=false&search_text=local+food", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- google-places: planning 0 calls/0ms/0 timeouts; source elapsed=Nonems; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "local food", "category": null, "url": "google-places:text-search", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- Shared text planning (one charge): []
- summary: [probe-summary.json](../network-restored-20261019/baseline/p2-kf-h005-20261029/attempt-1/probe-summary.json); SHA-256 `bf53eff664b3b8d3a896c8e3bbf00a24a695b2f96dbb7409f435257358dbff7e`
- decisions: [probe.decisions.jsonl](../network-restored-20261019/baseline/p2-kf-h005-20261029/attempt-1/probe.decisions.jsonl); SHA-256 `dcd1a58bfab8f63aa88ef5d8ffa9f868a8d049f5ccbfbb98c1e9dae02337acab`
- trace: [trace.jsonl](../network-restored-20261019/baseline/p2-kf-h005-20261029/attempt-1/trace.jsonl); SHA-256 `109c10466611ced0f411c02cba6541acd70b9ee218fcece1db3b4270a4381a60`
- recording: [recording.json](../network-restored-20261019/baseline/p2-kf-h005-20261029/attempt-1/recording/p2-kf-h005-20261029/recording.json); SHA-256 `57f50407b375449334e5657ca6b439cdff83a92f931cf76321ab13cc00a86c2e`

**A** failures=[]; termination=ALL_PLANNED_FIRST_BATCHES_ATTEMPTED; unattempted=[]; radius by source={"tablecheck": 5, "google-places": 40}.

- tabelog: planning 3 calls/5131ms/0 timeouts; source elapsed=30867ms; selection/history={"rewrites": 2, "regionPages": 2, "retrievalPages": 3, "history": [{"selection": {"accepted": true, "reason": "Retrieve restaurants matching the hard criterion \"local food\" in the Ginza & Shimbashi & Yurakucho area.", "keyword": "local food", "criterionRef": "criterion:0"}, "elapsedMs": 21919, "parsedCount": 0}, {"selection": {"accepted": true, "reason": "The keyword search returned an explicit empty state; retry with a close variant keyword for the same hard criterion.", "keyword": "local cuisine", "criterionRef": "criterion:0"}, "elapsedMs": 23539, "parsedCount": 0}, {"selection": {"accepted": true, "reason": "Explicit empty state on the variant keyword; retry with the original hard-criterion keyword \"local food\" before broadening.", "keyword": "local food", "criterionRef": "criterion:0"}, "elapsedMs": 27844, "parsedCount": 0}], "selection": {"accepted": true, "reason": "Explicit empty state on the variant keyword; retry with the original hard-criterion keyword \"local food\" before broadening.", "keyword": "local food", "criterionRef": "criterion:0"}}
  Observed retrieval sequence: [{"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/", "parsed": 20, "total": 139478, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1301/", "parsed": 20, "total": 6250, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1301/", "parsed": 20, "total": 6250, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "local food", "category": null, "url": "https://tabelog.com/en/tokyo/A1301/?sw=local+food", "parsed": 0, "total": null, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "local cuisine", "category": null, "url": "https://tabelog.com/en/tokyo/A1301/?sw=local+cuisine", "parsed": 0, "total": null, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "local food", "category": null, "url": "https://tabelog.com/en/tokyo/A1301/?sw=local+food", "parsed": 0, "total": null, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "local food", "category": null, "url": "https://tabelog.com/en/tokyo/A1301/?sw=local+food", "parsed": 0, "total": null, "observationStatus": "OBSERVED_LISTING"}]
- tablecheck: planning 0 calls/0ms/0 timeouts; source elapsed=28238ms; selection/history={"selection": {"accepted": true, "reason": "Initial retrieval using the hard criterion keyword \"local food\" for nearby restaurants.", "keyword": "local food", "criterionRef": "criterion:0"}, "rewrites": 0, "regionPages": 0, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Initial retrieval using the hard criterion keyword \"local food\" for nearby restaurants.", "keyword": "local food", "criterionRef": "criterion:0"}, "elapsedMs": 13004, "parsedCount": 20}]}
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "local food", "category": null, "url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6697&geo_longitude=139.767&geo_distance=1km&auto_geolocate=false&search_text=local+food", "parsed": 20, "total": null, "observationStatus": "OBSERVED_LISTING"}]
- google-places: planning 0 calls/0ms/0 timeouts; source elapsed=Nonems; selection/history=null
  Observed retrieval sequence: [{"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "google-places:nearby-search", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- Shared text planning (one charge): [{"sequence": 5, "source": "SHARED_TEXT_RETRIEVAL", "latencyMs": 1426, "outcome": "SUCCEEDED", "errorCode": null, "timeout": false, "url": null, "parsedCount": null, "categoryCount": 0, "proposal": {"choice": "KEYWORD", "keyword": "local food", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "Initial retrieval using the hard criterion keyword \"local food\" for nearby restaurants."}}]
- summary: [probe-summary.json](../checkpoint-a-corrected-20261019/runs/p2-kf-h005-20261029/attempt-1/probe-summary.json); SHA-256 `e165b76382f241fe29b85168d50ba1fdc17f6eebb2948e39be7e8bbcd627cb6c`
- decisions: [probe.decisions.jsonl](../checkpoint-a-corrected-20261019/runs/p2-kf-h005-20261029/attempt-1/probe.decisions.jsonl); SHA-256 `92e9315fb28819754a20bf60318d606d93f6fe092b33c2ff68b2815d360c69da`
- trace: [trace.jsonl](../checkpoint-a-corrected-20261019/runs/p2-kf-h005-20261029/attempt-1/trace.jsonl); SHA-256 `6b1e9460e808f6f4387fda68aa42624f5646e6a89c005fabe2526f6c16a332db`
- recording: [recording.json](../checkpoint-a-corrected-20261019/runs/p2-kf-h005-20261029/attempt-1/recording/p2-kf-h005-20261029/recording.json); SHA-256 `324fae407be25e6b0f641af09b0e84103178d399e78e826766623d10c6536f02`

### p2-kf-h005-20261029 / 2 (TARGET)


**Baseline** failures=["DISCOVERY_SOURCE_LOCATION_UNGROUNDED"]; termination=ALL_PLANNED_FIRST_BATCHES_ATTEMPTED; unattempted=[]; radius by source={"tablecheck": 5, "google-places": 40}.

- tabelog: planning 0 calls/0ms/0 timeouts; source elapsed=23621ms; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "local food", "category": null, "url": "https://tabelog.com/en/tokyo/rstLst/?sw=local+food", "parsed": 2, "total": 2, "observationStatus": "OBSERVED_LISTING"}]
- tablecheck: planning 0 calls/0ms/0 timeouts; source elapsed=22099ms; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "local food", "category": null, "url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6697&geo_longitude=139.767&geo_distance=1km&auto_geolocate=false&search_text=local+food", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- google-places: planning 0 calls/0ms/0 timeouts; source elapsed=Nonems; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "local food", "category": null, "url": "google-places:text-search", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- Shared text planning (one charge): []
- summary: [probe-summary.json](../network-restored-20261019/baseline/p2-kf-h005-20261029/attempt-2/probe-summary.json); SHA-256 `0611ba281d64365c6780f839ace24ac092a850760cc8b6737a0f6ddecfe2b3f5`
- decisions: [probe.decisions.jsonl](../network-restored-20261019/baseline/p2-kf-h005-20261029/attempt-2/probe.decisions.jsonl); SHA-256 `2fece4894b344f2bdc3b45f0476edf35ed65c6eb64d6321724badcfe30334b30`
- trace: [trace.jsonl](../network-restored-20261019/baseline/p2-kf-h005-20261029/attempt-2/trace.jsonl); SHA-256 `4ffeed57f7929f139bf0e15fe0fe05641ba720854f1366bfece83aaa50ea2187`
- recording: [recording.json](../network-restored-20261019/baseline/p2-kf-h005-20261029/attempt-2/recording/p2-kf-h005-20261029/recording.json); SHA-256 `9067d21d679af3a0174a8a1ec32516fa8494d57b19ad44306d6eb0d37556702d`

**A** failures=[]; termination=ALL_PLANNED_FIRST_BATCHES_ATTEMPTED; unattempted=[]; radius by source={"tablecheck": 5, "google-places": 40}.

- tabelog: planning 3 calls/5184ms/0 timeouts; source elapsed=36680ms; selection/history={"rewrites": 2, "regionPages": 2, "retrievalPages": 3, "history": [{"selection": {"accepted": true, "reason": "Retrieve restaurants matching the hard criterion \"local food\" in the Ginza/Shimbashi/Yurakucho area.", "keyword": "local food", "criterionRef": "criterion:0"}, "elapsedMs": 26144, "parsedCount": 0}, {"selection": {"accepted": true, "reason": "The exact phrase \"local food\" returned zero results; retry with a close variant keyword for the same hard criterion.", "keyword": "local cuisine", "criterionRef": "criterion:0"}, "elapsedMs": 27726, "parsedCount": 0}, {"selection": {"accepted": true, "reason": "The variant \"local cuisine\" returned an explicit empty state; retry the original hard-criterion phrase \"local food\" as a keyword.", "keyword": "local food", "criterionRef": "criterion:0"}, "elapsedMs": 31881, "parsedCount": 0}], "selection": {"accepted": true, "reason": "The variant \"local cuisine\" returned an explicit empty state; retry the original hard-criterion phrase \"local food\" as a keyword.", "keyword": "local food", "criterionRef": "criterion:0"}}
  Observed retrieval sequence: [{"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/", "parsed": 20, "total": 139478, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1301/", "parsed": 20, "total": 6250, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1301/", "parsed": 20, "total": 6250, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "local food", "category": null, "url": "https://tabelog.com/en/tokyo/A1301/?sw=local+food", "parsed": 0, "total": null, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "local cuisine", "category": null, "url": "https://tabelog.com/en/tokyo/A1301/?sw=local+cuisine", "parsed": 0, "total": null, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "local food", "category": null, "url": "https://tabelog.com/en/tokyo/A1301/?sw=local+food", "parsed": 0, "total": null, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "local food", "category": null, "url": "https://tabelog.com/en/tokyo/A1301/?sw=local+food", "parsed": 0, "total": null, "observationStatus": "OBSERVED_LISTING"}]
- tablecheck: planning 0 calls/0ms/0 timeouts; source elapsed=26415ms; selection/history={"selection": {"accepted": true, "reason": "Initial retrieval using the hard criterion keyword \"local food\" to find nearby restaurants.", "keyword": "local food", "criterionRef": "criterion:0"}, "rewrites": 0, "regionPages": 0, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Initial retrieval using the hard criterion keyword \"local food\" to find nearby restaurants.", "keyword": "local food", "criterionRef": "criterion:0"}, "elapsedMs": 7215, "parsedCount": 20}]}
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "local food", "category": null, "url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6697&geo_longitude=139.767&geo_distance=1km&auto_geolocate=false&search_text=local+food", "parsed": 20, "total": null, "observationStatus": "OBSERVED_LISTING"}]
- google-places: planning 0 calls/0ms/0 timeouts; source elapsed=Nonems; selection/history=null
  Observed retrieval sequence: [{"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "google-places:nearby-search", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- Shared text planning (one charge): [{"sequence": 5, "source": "SHARED_TEXT_RETRIEVAL", "latencyMs": 2208, "outcome": "SUCCEEDED", "errorCode": null, "timeout": false, "url": null, "parsedCount": null, "categoryCount": 0, "proposal": {"choice": "KEYWORD", "keyword": "local food", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "Initial retrieval using the hard criterion keyword \"local food\" to find nearby restaurants."}}]
- summary: [probe-summary.json](../checkpoint-a-corrected-20261019/runs/p2-kf-h005-20261029/attempt-2/probe-summary.json); SHA-256 `a10866f1b90a22ebbe3fe725ab722989974a2c0303df3c5d58966ff965695375`
- decisions: [probe.decisions.jsonl](../checkpoint-a-corrected-20261019/runs/p2-kf-h005-20261029/attempt-2/probe.decisions.jsonl); SHA-256 `6fff00b9dedc832402ad2f126a9304d73f32d6ea8a0a53928272f5ccc217924c`
- trace: [trace.jsonl](../checkpoint-a-corrected-20261019/runs/p2-kf-h005-20261029/attempt-2/trace.jsonl); SHA-256 `d2aab1fbacc992afb064a136c894427a3be0332f0847691389d68b0da91a1ac2`
- recording: [recording.json](../checkpoint-a-corrected-20261019/runs/p2-kf-h005-20261029/attempt-2/recording/p2-kf-h005-20261029/recording.json); SHA-256 `ef80b7f459db707e71f4154c6418d62b02e5fb70e3c0b9525a23d67d22da381d`

### p2-kichijoji-tempura-20261027 / 1 (TARGET)


**Baseline** failures=[]; termination=ALL_PLANNED_FIRST_BATCHES_ATTEMPTED; unattempted=[]; radius by source={"tabelog": 5, "tablecheck": 5, "google-places": 40}.

- tabelog: planning 0 calls/0ms/0 timeouts; source elapsed=77904ms; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "tempura restaurant", "category": null, "url": "https://tabelog.com/en/tokyo/rstLst/?sw=tempura+restaurant", "parsed": 0, "total": null, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "tempura restaurant", "category": null, "url": "https://tabelog.com/en/rstLst/?sw=tempura+restaurant", "parsed": 0, "total": 42, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "restaurant", "category": null, "url": "https://tabelog.com/en/tokyo/rstLst/tempura/?sw=restaurant", "parsed": 0, "total": 3, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "restaurant", "category": "English", "url": "https://tabelog.com/en/tokyo/A1328/rstLst/tempura/?sw=restaurant", "parsed": 1, "total": 1, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "tempura restaurant", "category": null, "url": "https://tabelog.com/en/tokyo/", "parsed": 0, "total": 139480, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "tempura restaurant", "category": null, "url": "https://tabelog.com/en/tokyo/A1320/", "parsed": 20, "total": 2819, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "tempura restaurant", "category": null, "url": "https://tabelog.com/en/tokyo/A1320/", "parsed": 20, "total": 2819, "observationStatus": "OBSERVED_LISTING"}]
- tablecheck: planning 0 calls/0ms/0 timeouts; source elapsed=28499ms; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "tempura restaurant", "category": null, "url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.704096&geo_longitude=139.58020539999998&geo_distance=1km&auto_geolocate=false&search_text=tempura+restaurant", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- google-places: planning 0 calls/0ms/0 timeouts; source elapsed=Nonems; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "tempura restaurant", "category": null, "url": "google-places:text-search", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- Shared text planning (one charge): []
- summary: [probe-summary.json](../network-restored-20261019/baseline/p2-kichijoji-tempura-20261027/attempt-1/probe-summary.json); SHA-256 `96f83f651af7045f36831c27896a8e5795328f8e386c481f49dc464578c082a5`
- decisions: [probe.decisions.jsonl](../network-restored-20261019/baseline/p2-kichijoji-tempura-20261027/attempt-1/probe.decisions.jsonl); SHA-256 `4343626a9e6d3f97daa3dd2d20d291ca7e5c5de14bc76e2234b53e57ea7e7aca`
- trace: [trace.jsonl](../network-restored-20261019/baseline/p2-kichijoji-tempura-20261027/attempt-1/trace.jsonl); SHA-256 `682d3ddeae2fa6c9727d13e9f88c6bc005f71f5f89e67915e50a0ce58e942a8d`
- recording: [recording.json](../network-restored-20261019/baseline/p2-kichijoji-tempura-20261027/attempt-1/recording/p2-kichijoji-tempura-20261027/recording.json); SHA-256 `730d6ac4282e49ee52c73aeffa891e7fd9d037ea8db4071bae3031b205b356ba`

**A** failures=[]; termination=ALL_PLANNED_FIRST_BATCHES_ATTEMPTED; unattempted=[]; radius by source={"tabelog": 5, "tablecheck": 5, "google-places": 40}.

- tabelog: planning 1 calls/2228ms/0 timeouts; source elapsed=48413ms; selection/history={"rewrites": 0, "regionPages": 2, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Search for tempura restaurants in Kichijoji to satisfy the hard criterion.", "keyword": "tempura", "criterionRef": "criterion:0"}, "elapsedMs": 24596, "parsedCount": 6}], "selection": {"accepted": true, "reason": "Search for tempura restaurants in Kichijoji to satisfy the hard criterion.", "keyword": "tempura", "criterionRef": "criterion:0"}}
  Observed retrieval sequence: [{"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/", "parsed": 20, "total": 139478, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1320/", "parsed": 20, "total": 2819, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1320/", "parsed": 20, "total": 2819, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "tempura", "category": null, "url": "https://tabelog.com/en/tokyo/A1320/?sw=tempura", "parsed": 6, "total": 6, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "tempura", "category": null, "url": "https://tabelog.com/en/tokyo/A1320/?sw=tempura", "parsed": 6, "total": 6, "observationStatus": "OBSERVED_LISTING"}]
- tablecheck: planning 0 calls/0ms/0 timeouts; source elapsed=81519ms; selection/history={"selection": {"accepted": true, "reason": "Initial retrieval for tempura restaurant in Kichijōji.", "keyword": "tempura", "criterionRef": "criterion:0"}, "rewrites": 0, "regionPages": 0, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Initial retrieval for tempura restaurant in Kichijōji.", "keyword": "tempura", "criterionRef": "criterion:0"}, "elapsedMs": 21154, "parsedCount": 20}]}
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "tempura", "category": null, "url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.704096&geo_longitude=139.58020539999998&geo_distance=1km&auto_geolocate=false&search_text=tempura", "parsed": 20, "total": null, "observationStatus": "OBSERVED_LISTING"}]
- google-places: planning 0 calls/0ms/0 timeouts; source elapsed=Nonems; selection/history=null
  Observed retrieval sequence: [{"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "google-places:nearby-search", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- Shared text planning (one charge): [{"sequence": 3, "source": "SHARED_TEXT_RETRIEVAL", "latencyMs": 2384, "outcome": "SUCCEEDED", "errorCode": null, "timeout": false, "url": null, "parsedCount": null, "categoryCount": 0, "proposal": {"choice": "KEYWORD", "keyword": "tempura", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "Initial retrieval for tempura restaurant in Kichijōji."}}]
- summary: [probe-summary.json](../checkpoint-a-corrected-20261019/runs/p2-kichijoji-tempura-20261027/attempt-1/probe-summary.json); SHA-256 `08851d187d500eb2ef8ed3337749217fdae3c64a949ed67be30990ea56df4043`
- decisions: [probe.decisions.jsonl](../checkpoint-a-corrected-20261019/runs/p2-kichijoji-tempura-20261027/attempt-1/probe.decisions.jsonl); SHA-256 `4bf8a259236dfe2737d27bd4d9af2cd88be371d98642b75542ec7a718eec97a0`
- trace: [trace.jsonl](../checkpoint-a-corrected-20261019/runs/p2-kichijoji-tempura-20261027/attempt-1/trace.jsonl); SHA-256 `9f05e522f5dd3fb73cf2aed72ac60c9eb43c41e45c5c010d7f312061334b1454`
- recording: [recording.json](../checkpoint-a-corrected-20261019/runs/p2-kichijoji-tempura-20261027/attempt-1/recording/p2-kichijoji-tempura-20261027/recording.json); SHA-256 `5036e675b5839355267cc289081f91eefef1253383cf52991046a1a78b774ce1`

### p2-kichijoji-tempura-20261027 / 2 (TARGET)


**Baseline** failures=[]; termination=ALL_PLANNED_FIRST_BATCHES_ATTEMPTED; unattempted=[]; radius by source={"tabelog": 5, "tablecheck": 5, "google-places": 40}.

- tabelog: planning 0 calls/0ms/0 timeouts; source elapsed=68688ms; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "tempura restaurant", "category": null, "url": "https://tabelog.com/en/tokyo/rstLst/?sw=tempura+restaurant", "parsed": 0, "total": null, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "tempura restaurant", "category": null, "url": "https://tabelog.com/en/rstLst/?sw=tempura+restaurant", "parsed": 0, "total": 42, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "restaurant", "category": null, "url": "https://tabelog.com/en/tokyo/rstLst/tempura/?sw=restaurant", "parsed": 0, "total": 3, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "restaurant", "category": "English", "url": "https://tabelog.com/en/tokyo/A1328/rstLst/tempura/?sw=restaurant", "parsed": 1, "total": 1, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "tempura restaurant", "category": null, "url": "https://tabelog.com/en/tokyo/", "parsed": 0, "total": 139480, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "tempura restaurant", "category": null, "url": "https://tabelog.com/en/tokyo/A1320/", "parsed": 20, "total": 2819, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "tempura restaurant", "category": null, "url": "https://tabelog.com/en/tokyo/A1320/", "parsed": 20, "total": 2819, "observationStatus": "OBSERVED_LISTING"}]
- tablecheck: planning 0 calls/0ms/0 timeouts; source elapsed=29804ms; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "tempura restaurant", "category": null, "url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.704096&geo_longitude=139.58020539999998&geo_distance=1km&auto_geolocate=false&search_text=tempura+restaurant", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- google-places: planning 0 calls/0ms/0 timeouts; source elapsed=Nonems; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "tempura restaurant", "category": null, "url": "google-places:text-search", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- Shared text planning (one charge): []
- summary: [probe-summary.json](../network-restored-20261019/baseline/p2-kichijoji-tempura-20261027/attempt-2/probe-summary.json); SHA-256 `1dde5ed66481521bb98ee774f1fc8b2f42c2e957fadbc65b983ad2ad81db8269`
- decisions: [probe.decisions.jsonl](../network-restored-20261019/baseline/p2-kichijoji-tempura-20261027/attempt-2/probe.decisions.jsonl); SHA-256 `fb2d809b8821f714500a080e33be0fa00c7d94b47aca94e98eccaf4f2eb9bb95`
- trace: [trace.jsonl](../network-restored-20261019/baseline/p2-kichijoji-tempura-20261027/attempt-2/trace.jsonl); SHA-256 `ff0dfe5bc4fbaa66b5b4743f6800e27309f22c8987b16bbce4e3d58b2f666f7c`
- recording: [recording.json](../network-restored-20261019/baseline/p2-kichijoji-tempura-20261027/attempt-2/recording/p2-kichijoji-tempura-20261027/recording.json); SHA-256 `61bbb2cc549d9a492b3ca6cf1ab57d332e050736c4bd160c442e48f3c02507cf`

**A** failures=[]; termination=ALL_PLANNED_FIRST_BATCHES_ATTEMPTED; unattempted=[]; radius by source={"tabelog": 5, "tablecheck": 5, "google-places": 40}.

- tabelog: planning 1 calls/2470ms/0 timeouts; source elapsed=46088ms; selection/history={"rewrites": 0, "regionPages": 2, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Search for tempura restaurants in Kichijoji to satisfy the hard criterion.", "keyword": "tempura", "criterionRef": "criterion:0"}, "elapsedMs": 25160, "parsedCount": 6}], "selection": {"accepted": true, "reason": "Search for tempura restaurants in Kichijoji to satisfy the hard criterion.", "keyword": "tempura", "criterionRef": "criterion:0"}}
  Observed retrieval sequence: [{"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/", "parsed": 20, "total": 139478, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1320/", "parsed": 20, "total": 2819, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1320/", "parsed": 20, "total": 2819, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "tempura", "category": null, "url": "https://tabelog.com/en/tokyo/A1320/?sw=tempura", "parsed": 6, "total": 6, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "tempura", "category": null, "url": "https://tabelog.com/en/tokyo/A1320/?sw=tempura", "parsed": 6, "total": 6, "observationStatus": "OBSERVED_LISTING"}]
- tablecheck: planning 0 calls/0ms/0 timeouts; source elapsed=84304ms; selection/history={"selection": {"accepted": true, "reason": "Initial retrieval for tempura restaurant in Kichijōji.", "keyword": "tempura", "criterionRef": "criterion:0"}, "rewrites": 0, "regionPages": 0, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Initial retrieval for tempura restaurant in Kichijōji.", "keyword": "tempura", "criterionRef": "criterion:0"}, "elapsedMs": 21302, "parsedCount": 20}]}
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "tempura", "category": null, "url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.704096&geo_longitude=139.58020539999998&geo_distance=1km&auto_geolocate=false&search_text=tempura", "parsed": 20, "total": null, "observationStatus": "OBSERVED_LISTING"}]
- google-places: planning 0 calls/0ms/0 timeouts; source elapsed=Nonems; selection/history=null
  Observed retrieval sequence: [{"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "google-places:nearby-search", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- Shared text planning (one charge): [{"sequence": 3, "source": "SHARED_TEXT_RETRIEVAL", "latencyMs": 2453, "outcome": "SUCCEEDED", "errorCode": null, "timeout": false, "url": null, "parsedCount": null, "categoryCount": 0, "proposal": {"choice": "KEYWORD", "keyword": "tempura", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "Initial retrieval for tempura restaurant in Kichijōji."}}]
- summary: [probe-summary.json](../checkpoint-a-corrected-20261019/runs/p2-kichijoji-tempura-20261027/attempt-2/probe-summary.json); SHA-256 `7007a95d24b3fe9684abb8a277fa56969b8bdd61d10123ab9022a57ffb431e72`
- decisions: [probe.decisions.jsonl](../checkpoint-a-corrected-20261019/runs/p2-kichijoji-tempura-20261027/attempt-2/probe.decisions.jsonl); SHA-256 `8bc1bdcc0cc3a36f2156cb7bb8939673ccd1b1847e71dc8195d44ea0fbbe154a`
- trace: [trace.jsonl](../checkpoint-a-corrected-20261019/runs/p2-kichijoji-tempura-20261027/attempt-2/trace.jsonl); SHA-256 `f71d33713a9a9219eb4240e4f9ccaa999d085d98ab2d4b805108ebd155b6c4f0`
- recording: [recording.json](../checkpoint-a-corrected-20261019/runs/p2-kichijoji-tempura-20261027/attempt-2/recording/p2-kichijoji-tempura-20261027/recording.json); SHA-256 `e9dbab417f6b97134de8b01cad5e446472b52ade30f419b0eb9fd9d1ff3d4907`

### p2-kf-h002-20261031 / 1 (CONTROL)


**Baseline** failures=[]; termination=ALL_PLANNED_FIRST_BATCHES_ATTEMPTED; unattempted=[]; radius by source={"tabelog": 5, "tablecheck": 5, "google-places": 20}.

- tabelog: planning 0 calls/0ms/0 timeouts; source elapsed=60347ms; selection/history=null
  Observed retrieval sequence: [{"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/", "parsed": 20, "total": 139480, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1301/", "parsed": 20, "total": 6252, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1301/A130101/", "parsed": 20, "total": 2658, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/", "parsed": 20, "total": 5034, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/", "parsed": 20, "total": 5034, "observationStatus": "OBSERVED_LISTING"}]
- tablecheck: planning 0 calls/0ms/0 timeouts; source elapsed=27068ms; selection/history=null
  Observed retrieval sequence: [{"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.669700299999995&geo_longitude=139.7671399&geo_distance=1km&auto_geolocate=false", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- google-places: planning 0 calls/0ms/0 timeouts; source elapsed=Nonems; selection/history=null
  Observed retrieval sequence: [{"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "google-places:nearby-search", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- Shared text planning (one charge): []
- summary: [probe-summary.json](../network-restored-20261019/baseline/p2-kf-h002-20261031/attempt-1/probe-summary.json); SHA-256 `5db47e6fc9a1dc3d2c300e58435faa21569111b0b3b0432926a154bde5e41f9d`
- decisions: [probe.decisions.jsonl](../network-restored-20261019/baseline/p2-kf-h002-20261031/attempt-1/probe.decisions.jsonl); SHA-256 `4034c85ed1604521ec71b1c5e65e19a0c9e0514c05d6c3a7e90851303a661f5b`
- trace: [trace.jsonl](../network-restored-20261019/baseline/p2-kf-h002-20261031/attempt-1/trace.jsonl); SHA-256 `b3ef6695dd16cb8a5ff91481aa895358d13741a0f7593c53b27669a65eab676d`
- recording: [recording.json](../network-restored-20261019/baseline/p2-kf-h002-20261031/attempt-1/recording/p2-kf-h002-20261031/recording.json); SHA-256 `4cc2fc4cd575fae4b4419f51a0069eb875c81853cec710ed1a1ff3df43218baf`

**A** failures=[]; termination=ALL_PLANNED_FIRST_BATCHES_ATTEMPTED; unattempted=[]; radius by source={"tabelog": 5, "tablecheck": 5}.

- tabelog: planning 1 calls/2992ms/0 timeouts; source elapsed=78780ms; selection/history={"rewrites": 0, "regionPages": 4, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Search for restaurants suited to a first date near Higashi-ginza.", "keyword": "date", "criterionRef": "criterion:0"}, "elapsedMs": 50130, "parsedCount": 9}], "selection": {"accepted": true, "reason": "Search for restaurants suited to a first date near Higashi-ginza.", "keyword": "date", "criterionRef": "criterion:0"}}
  Observed retrieval sequence: [{"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/", "parsed": 20, "total": 139478, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1301/", "parsed": 20, "total": 6250, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1301/A130101/", "parsed": 20, "total": 2658, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/", "parsed": 20, "total": 5034, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/", "parsed": 20, "total": 5034, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "date", "category": null, "url": "https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/?sw=date", "parsed": 9, "total": 9, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "date", "category": null, "url": "https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/?sw=date", "parsed": 9, "total": 9, "observationStatus": "OBSERVED_LISTING"}]
- tablecheck: planning 0 calls/0ms/0 timeouts; source elapsed=24719ms; selection/history={"selection": {"accepted": true, "reason": "Initial retrieval for a first-date restaurant near Higashi-ginza.", "keyword": "first date", "criterionRef": "criterion:0"}, "rewrites": 0, "regionPages": 0, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Initial retrieval for a first-date restaurant near Higashi-ginza.", "keyword": "first date", "criterionRef": "criterion:0"}, "elapsedMs": 7827, "parsedCount": 20}]}
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "first date", "category": null, "url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.669700299999995&geo_longitude=139.7671399&geo_distance=1km&auto_geolocate=false&search_text=first+date", "parsed": 20, "total": null, "observationStatus": "OBSERVED_LISTING"}]
- google-places: planning 0 calls/0ms/0 timeouts; source elapsed=Nonems; selection/history=null
  Observed retrieval sequence: [{"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "google-places:nearby-search", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- Shared text planning (one charge): [{"sequence": 5, "source": "SHARED_TEXT_RETRIEVAL", "latencyMs": 2144, "outcome": "SUCCEEDED", "errorCode": null, "timeout": false, "url": null, "parsedCount": null, "categoryCount": 0, "proposal": {"choice": "KEYWORD", "keyword": "first date", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "Initial retrieval for a first-date restaurant near Higashi-ginza."}}]
- summary: [probe-summary.json](../checkpoint-a-corrected-20261019/runs/p2-kf-h002-20261031/attempt-1/probe-summary.json); SHA-256 `1caf2145d9c1793703ed4cc7e4d55c629bd2290d53ea79e30b6a5575b4d68cf4`
- decisions: [probe.decisions.jsonl](../checkpoint-a-corrected-20261019/runs/p2-kf-h002-20261031/attempt-1/probe.decisions.jsonl); SHA-256 `f03592db9a2fb00b2365e0811b7b99f80d3e8eb84c2f1e5dcb35c9c84f2a8153`
- trace: [trace.jsonl](../checkpoint-a-corrected-20261019/runs/p2-kf-h002-20261031/attempt-1/trace.jsonl); SHA-256 `ea2db1b82e4c8af294143bb5354d143e26c4ea6050ace26a9ad9a47577e3bbc2`
- recording: [recording.json](../checkpoint-a-corrected-20261019/runs/p2-kf-h002-20261031/attempt-1/recording/p2-kf-h002-20261031/recording.json); SHA-256 `9a1bb627a0d173b0461460b160e9c82cbf1b45e3834ee49c54fc7816dcab765c`

### p2-nakameguro-yakiniku-20261030 / 1 (CONTROL)


**Baseline** failures=["AGENT_EXECUTION_FAILED"]; termination=ALL_PLANNED_FIRST_BATCHES_ATTEMPTED; unattempted=[]; radius by source={"tablecheck": 5, "google-places": 34}.

- tabelog: planning 0 calls/0ms/0 timeouts; source elapsed=73984ms; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "yakiniku", "category": null, "url": "https://tabelog.com/en/tokyo/rstLst/?sw=yakiniku", "parsed": 20, "total": 2870, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "yakiniku", "category": null, "url": "https://tabelog.com/en/tokyo/A1316/rstLst/?sw=yakiniku", "parsed": 20, "total": 51, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "yakiniku", "category": null, "url": "https://tabelog.com/en/tokyo/A1316/A131601/rstLst/?sw=yakiniku", "parsed": 15, "total": 15, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "yakiniku", "category": null, "url": "https://tabelog.com/en/tokyo/A1316/A131601/R9966/rstLst/?sw=yakiniku", "parsed": 15, "total": 15, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "yakiniku", "category": null, "url": "https://tabelog.com/en/tokyo/A1316/A131601/", "parsed": 0, "total": 605, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "yakiniku", "category": null, "url": "https://tabelog.com/en/tokyo/A1316/A131601/R9966/rstLst/", "parsed": 0, "total": 628, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "yakiniku", "category": null, "url": "https://tabelog.com/en/tokyo/A1316/A131601/", "parsed": 0, "total": 605, "observationStatus": "OBSERVED_LISTING"}]
- tablecheck: planning 0 calls/0ms/0 timeouts; source elapsed=32104ms; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "yakiniku", "category": null, "url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.638716099999996&geo_longitude=139.7026251&geo_distance=1km&auto_geolocate=false&search_text=yakiniku", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- google-places: planning 0 calls/0ms/0 timeouts; source elapsed=Nonems; selection/history=null
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "yakiniku", "category": null, "url": "google-places:text-search", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- Shared text planning (one charge): []
- summary: [probe-summary.json](../network-restored-20261019/baseline/p2-nakameguro-yakiniku-20261030/attempt-1/probe-summary.json); SHA-256 `03ac49a90e67e4777b19725fa58e17c41271678bcb2081146e22753534ffc4cd`
- decisions: [probe.decisions.jsonl](../network-restored-20261019/baseline/p2-nakameguro-yakiniku-20261030/attempt-1/probe.decisions.jsonl); SHA-256 `53879c252d71306785f05d2e76aca2d26225087c3a380e1af569b5e8157d79c9`
- trace: [trace.jsonl](../network-restored-20261019/baseline/p2-nakameguro-yakiniku-20261030/attempt-1/trace.jsonl); SHA-256 `6f0da0d47f3de60bb682e97f698d6d10f3f19c1922ebf1a7e1257bb6a17047ee`
- recording: [recording.json](../network-restored-20261019/baseline/p2-nakameguro-yakiniku-20261030/attempt-1/recording/p2-nakameguro-yakiniku-20261030/recording.json); SHA-256 `8d5f3772e2eed7a880123b450ff826425e9c1ebd80d1a56c31a852ec64dcf1a4`

**A** failures=[]; termination=ALL_PLANNED_FIRST_BATCHES_ATTEMPTED; unattempted=[]; radius by source={"tabelog": 4, "tablecheck": 5, "google-places": 34}.

- tabelog: planning 1 calls/2366ms/0 timeouts; source elapsed=58139ms; selection/history={"rewrites": 0, "regionPages": 3, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Search the Nakameguro area listing for yakiniku restaurants matching the hard criterion.", "keyword": "yakiniku", "criterionRef": "criterion:0"}, "elapsedMs": 33787, "parsedCount": 20}], "selection": {"accepted": true, "reason": "Search the Nakameguro area listing for yakiniku restaurants matching the hard criterion.", "keyword": "yakiniku", "criterionRef": "criterion:0"}}
  Observed retrieval sequence: [{"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/", "parsed": 20, "total": 139478, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1317/", "parsed": 20, "total": 9309, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1317/A131701/", "parsed": 20, "total": 1080, "observationStatus": "OBSERVED_LISTING"}, {"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "https://tabelog.com/en/tokyo/A1317/A131701/", "parsed": 20, "total": 1080, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "yakiniku", "category": null, "url": "https://tabelog.com/en/tokyo/A1317/A131701/?sw=yakiniku", "parsed": 20, "total": 29, "observationStatus": "OBSERVED_LISTING"}, {"type": "KEYWORD", "keyword": "yakiniku", "category": null, "url": "https://tabelog.com/en/tokyo/A1317/A131701/?sw=yakiniku", "parsed": 20, "total": 29, "observationStatus": "OBSERVED_LISTING"}]
- tablecheck: planning 0 calls/0ms/0 timeouts; source elapsed=82419ms; selection/history={"selection": {"accepted": true, "reason": "Search yakiniku restaurants in Nakameguro matching the hard criterion.", "keyword": "yakiniku", "criterionRef": "criterion:0"}, "rewrites": 0, "regionPages": 0, "retrievalPages": 1, "history": [{"selection": {"accepted": true, "reason": "Search yakiniku restaurants in Nakameguro matching the hard criterion.", "keyword": "yakiniku", "criterionRef": "criterion:0"}, "elapsedMs": 20183, "parsedCount": 20}]}
  Observed retrieval sequence: [{"type": "KEYWORD", "keyword": "yakiniku", "category": null, "url": "https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.638716099999996&geo_longitude=139.7026251&geo_distance=1km&auto_geolocate=false&search_text=yakiniku", "parsed": 20, "total": null, "observationStatus": "OBSERVED_LISTING"}]
- google-places: planning 0 calls/0ms/0 timeouts; source elapsed=Nonems; selection/history=null
  Observed retrieval sequence: [{"type": "CATEGORY_OR_GENERAL_LIST", "keyword": null, "category": null, "url": "google-places:nearby-search", "parsed": null, "total": null, "observationStatus": "PLANNED_URL_WITHOUT_COMPLETED_LISTING"}]
- Shared text planning (one charge): [{"sequence": 4, "source": "SHARED_TEXT_RETRIEVAL", "latencyMs": 2379, "outcome": "SUCCEEDED", "errorCode": null, "timeout": false, "url": null, "parsedCount": null, "categoryCount": 0, "proposal": {"choice": "KEYWORD", "keyword": "yakiniku", "criterionRef": "criterion:0", "categoryUrl": "", "reason": "Search yakiniku restaurants in Nakameguro matching the hard criterion."}}]
- summary: [probe-summary.json](../checkpoint-a-corrected-20261019/runs/p2-nakameguro-yakiniku-20261030/attempt-1/probe-summary.json); SHA-256 `3f890279f3e6412a579130ab7ac8a0a47e04228d3db277c9aca09c139316e04b`
- decisions: [probe.decisions.jsonl](../checkpoint-a-corrected-20261019/runs/p2-nakameguro-yakiniku-20261030/attempt-1/probe.decisions.jsonl); SHA-256 `b89f9b36f362bb3bf7b40fc3a8e429f6962b06d0a730fd5334fe6226217a538d`
- trace: [trace.jsonl](../checkpoint-a-corrected-20261019/runs/p2-nakameguro-yakiniku-20261030/attempt-1/trace.jsonl); SHA-256 `a6621ce5994cd6b02851fb07d827f8cbdb7db3f050cefb58bf527ffa83a8de3c`
- recording: [recording.json](../checkpoint-a-corrected-20261019/runs/p2-nakameguro-yakiniku-20261030/attempt-1/recording/p2-nakameguro-yakiniku-20261030/recording.json); SHA-256 `7d53343548ad2f720cf48afb971a94958b5016afec0a4929c7945d5c9c3d09e6`

## Observed limitation / four evaluation layers

1. End-to-end outcome: NOT_EVALUATED (discovery-only; no claims of qualified delivery or availability).
2. Component: paired exact identity/list/detail/radius/retrieval and performance facts above. Offline positive/negative mechanics are distinct from actual model/source behavior.
3. Severity: formal traces checked by the frozen independent network rules; individual boundary statuses remain in comparison/audit. Unknown GET side effects and absent trace evidence cannot be inferred safe. S0-declaration and S1-S4 task claims are not evaluated by this discovery probe.
4. Attribution: failure codes, proposal text and observed category counts are evidence, not an independent causal label. Current-page visible category count can remain0 despite Pack HTML extraction succeeding; do not claim real-model improvement from the local fixture. Source changes and stochastic/current source rankings prevent causal attribution from a single listing hit.

Original recorder replay status is preserved in audit.json; this is real-source discovery, not faithful offline Replay. No P2-1b or full Live is started. Google-only nearby remains a separate after-A source commit.

## Preflight / usage

| Index | Start UTC | Status | Counted toward stop | Preflight Google |
| --- | --- | --- | --- | --- |
| 0 | 2026-10-19T04:38:28.115367+00:00 | PROBE_RECORDED | False | 1 |
| 1 | 2026-10-19T04:40:02.036665+00:00 | PROBE_RECORDED | False | 1 |
| 2 | 2026-10-19T04:42:18.588943+00:00 | PROBE_RECORDED | False | 1 |
| 3 | 2026-10-19T04:44:20.779298+00:00 | PROBE_RECORDED | False | 1 |
| 4 | 2026-10-19T04:47:43.569830+00:00 | PROBE_RECORDED | False | 1 |
| 5 | 2026-10-19T04:49:07.859456+00:00 | PROBE_RECORDED | False | 1 |
| 6 | 2026-10-19T04:50:35.983346+00:00 | PROBE_RECORDED | False | 1 |
| 7 | 2026-10-19T04:53:16.015774+00:00 | PROBE_RECORDED | False | 1 |
| 8 | 2026-10-19T04:55:59.089335+00:00 | PROBE_RECORDED | False | 1 |
| 9 | 2026-10-19T04:58:08.032133+00:00 | PROBE_RECORDED | False | 1 |

New: 53 model calls (outcomes={"SUCCEEDED": 53}), 19 formal Google + 10 preflight Google, 10 formal discovery probes; 0 counted preflight failures. Cumulative: **198/450 models, 31/42 probes, 79 Google,0 full Live**. No formal retries.

Freeze/hash/clean checks PASS; historical 807 files byte-identical. All decisions equal started model calls per probe, including failures. See [audit](audit.json) and [ledger](ledger.json).

## Source preflight artifacts

- Index0: [READY](../checkpoint-a-corrected-20261019/runs/p2-kf-h001-20261027/attempt-1/source-data-preflight.json), tabelog=20/HTTP200/9204ms; tablecheck=122/HTTP200/5384ms; google-places=1/HTTPNone/1257ms
- Index1: [READY](../checkpoint-a-corrected-20261019/runs/p2-kf-h001-20261027/attempt-2/source-data-preflight.json), tabelog=20/HTTP200/7990ms; tablecheck=122/HTTP200/15246ms; google-places=1/HTTPNone/1221ms
- Index2: [READY](../checkpoint-a-corrected-20261019/runs/p2-kagurazaka-kaiseki-20261029/attempt-1/source-data-preflight.json), tabelog=20/HTTP200/7800ms; tablecheck=122/HTTP200/3524ms; google-places=1/HTTPNone/1209ms
- Index3: [READY](../checkpoint-a-corrected-20261019/runs/p2-kagurazaka-kaiseki-20261029/attempt-2/source-data-preflight.json), tabelog=20/HTTP200/8130ms; tablecheck=122/HTTP200/14017ms; google-places=1/HTTPNone/1384ms
- Index4: [READY](../checkpoint-a-corrected-20261019/runs/p2-kf-h005-20261029/attempt-1/source-data-preflight.json), tabelog=20/HTTP200/8298ms; tablecheck=122/HTTP200/5324ms; google-places=1/HTTPNone/1487ms
- Index5: [READY](../checkpoint-a-corrected-20261019/runs/p2-kf-h005-20261029/attempt-2/source-data-preflight.json), tabelog=20/HTTP200/7737ms; tablecheck=122/HTTP200/5709ms; google-places=1/HTTPNone/1239ms
- Index6: [READY](../checkpoint-a-corrected-20261019/runs/p2-kichijoji-tempura-20261027/attempt-1/source-data-preflight.json), tabelog=20/HTTP200/7783ms; tablecheck=122/HTTP200/11014ms; google-places=1/HTTPNone/1915ms
- Index7: [READY](../checkpoint-a-corrected-20261019/runs/p2-kichijoji-tempura-20261027/attempt-2/source-data-preflight.json), tabelog=20/HTTP200/9512ms; tablecheck=122/HTTP200/9967ms; google-places=1/HTTPNone/1203ms
- Index8: [READY](../checkpoint-a-corrected-20261019/runs/p2-kf-h002-20261031/attempt-1/source-data-preflight.json), tabelog=20/HTTP200/8594ms; tablecheck=122/HTTP200/5369ms; google-places=1/HTTPNone/1210ms
- Index9: [READY](../checkpoint-a-corrected-20261019/runs/p2-nakameguro-yakiniku-20261030/attempt-1/source-data-preflight.json), tabelog=20/HTTP200/7186ms; tablecheck=122/HTTP200/4510ms; google-places=1/HTTPNone/1279ms

Whole P2-1 evidence gzip estimate: 31,077,820 bytes <60,000,000; [size check](artifact-size.json).

## After-A Google-only correction

A results were committed as52ff459 before this separate source correction. [Nearbyscope, red/green and gates](nearby/report.md): default943/943, real Chromium117/117, typecheck/arch/build PASS. No new model/Google/probe or full Live calls. A worktree remains209ac42.
