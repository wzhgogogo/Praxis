# Tabelog timeout diagnosis — stopped before implementation

Status: draft / not integrated. Vienna 2026-11-03T15:05:38.742834+01:00 (CET UTC+1). Branch codex/fix-tabelog-page-timeout; source commit ce6f94af. Product source unchanged from latest main a7abbc0f.

## Decision and stopping boundary

Resource volume is substantial, but the saved evidence cannot establish resource loading as the main timeout cause. Some failures have severely depleted navigation budgets, and a genuine busy page exists. Neither establishes site throttling or rules out resource contention. No performance patch is applied. Full request chronology/resource durations and exact-query repeat diagnosis require A-owned recorder/trace changes; per the user ownership stop condition, hand off before editing those files. This is NOT a claim that the main cause has been proved to be outside resource loading. Existing BLOCKED dependency handling already exists; ordinary image blocking does not inherently require changing the recorder.

## 1. Every recorded navigation error

Non-navigate call errors mentioning navigation/load state are separately retained as otherNavigationErrors (not counted again as navigate calls). All navigation calls, recording sequence, session, page type, configured timeout, actual TimeoutError threshold, event, trace duration and full error chain are in analysis.json.navigations. The table includes non-timeout errors so they are not mislabeled BROWSER_TIMEOUT. Trace wall duration is a navigation-operation proxy, not pure network time. D1 has no canonical browser-trace.json at the saved path, so its elapsed durations remain unknown.

| Run | sequence | type | URL | configured ms | TimeoutError ms | operation ms |
|---|---:|---|---|---:|---:|---:|
|D4 first|1182|region|https://takumiromantic.owst.jp/|20000|None|815.0|
|D4 first|1421|detail|https://tabelog.com/en/tokyo/A1323/A132305/13109579/|20000|None|7166.0|
|D1|49|region|https://tabelog.com/en/tokyo/A1322/A132201/|959|959|None|
|D1|71|search|https://www.tablecheck.com/en/japan/search|20000|20000|None|
|D1|184|detail|https://tabelog.com/en/tokyo/A1323/A132305/13173601/|20000|20000|None|
|D1|220|detail|https://tabelog.com/en/tokyo/A1323/A132305/13108466/|14814|14814|None|
|D1|281|search|https://tabelog.com/en/tokyo/rstLst/|648|648|None|
|D1|317|detail|https://tabelog.com/en/tokyo/A1323/A132305/13153533/|11973|11973|None|
|D1|339|search|https://tabelog.com/en/tokyo/rstLst/|20000|20000|None|
|D4 supplement|124|region|https://tabelog.com/en/tokyo/A1322/A132201/|11358|11358|11418.0|
|D4 supplement|133|search|https://www.tablecheck.com/en/japan/search|35000|None|1318.0|
|D4 supplement|142|search|https://www.tablecheck.com/en/japan/search|20000|None|1022.0|
|D4 supplement|170|search|https://tabelog.com/en/tokyo/rstLst/|20000|20000|20004.0|
|D4 supplement|179|search|https://www.tablecheck.com/en/japan/search|20000|None|1021.0|
|D4 supplement|192|search|https://tabelog.com/en/tokyo/rstLst/|20000|20000|20003.0|
|D4 supplement|201|search|https://www.tablecheck.com/en/japan/search|20000|None|1020.0|
|D4 supplement|315|search|https://www.tablecheck.com/en/japan/search|20000|None|1983.0|
|D4 supplement|358|detail|https://tabelog.com/en/tokyo/A1323/A132305/13226880/|9383|9383|9390.0|
|D4 supplement|367|search|https://www.tablecheck.com/en/japan/search|20000|None|1323.0|
|D4 supplement|511|search|https://tabelog.com/en/tokyo/rstLst/|20000|20000|20003.0|
|D4 supplement|701|search|https://tabelog.com/en/tokyo/rstLst/|20000|20000|20005.0|
|D4 supplement|768|search|https://tabelog.com/en/tokyo/rstLst/|20000|None|7017.0|
|D6 supplement|94|detail|https://tabelog.com/en/tokyo/A1323/A132305/13318921/|12739|12739|12797.0|
|D6 supplement|126|search|https://www.tablecheck.com/en/japan/search|20000|20000|20005.0|
|D6 supplement|184|detail|https://tabelog.com/en/tokyo/A1313/A131303/13059615/|1730|1730|1759.0|
|D8 supplement|110|search|https://tabelog.com/en/tokyo/rstLst/|1494|1494|1535.0|
|D8 supplement|267|detail|https://tabelog.com/en/tokyo/A1301/A130101/13219563/|41|41|60.0|
|D8 supplement|454|search|https://tabelog.com/en/tokyo/rstLst/|1447|1447|1490.0|
|D3 C saved|4|search|https://www.tablecheck.com/en/japan/search|20000|None|1261.0|
|D3 C saved|197|search|https://www.tablecheck.com/en/japan/search|20000|None|1022.0|

All these navigation calls wait for domcontentloaded (configured event retained per row). D1 W1 Dengana has a14814ms TimeoutError. D8 Tabelog has1494,41,1447ms limits; the saved thresholds themselves show little remaining time. Why that budget was consumed is not proved by the terminal code. HAR contains sanitized unique-URL responses and synthetic DOM documents, not a request waterfall: epoch/time0 entries cannot say which responses arrived before a particular timeout. Matching-path recorded document statuses are retained per error, explicitly without chronology. Failed navigation with no subsequent snapshot can also lose its final network events.

## 2. Page resource observations

Every snapshot has type counts in analysis.json.pages. NETWORK is cumulative per session; the analyzer removes exact repeated prefixes, resets on SESSION_OPENED, counts ADMITTED once, and reports BLOCKED/FAILED separately (a FAILED event is not an extra request). Counts are sampling-interval lower bounds, associated with the snapshot page, not exact per-document ownership: late previous-page traffic and navigation tails cannot be separated without request IDs/times. CDP NETWORK_RESOURCE_TYPES is a separate observation stream and is not added again.

| Run | Tabelog snapshots | admitted observations in those intervals | document | script | stylesheet | image | font | xhr | fetch |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
|D4 first|63|1725|41|237|315|1060|0|32|33|
|D1|25|598|15|77|103|357|0|12|23|
|D4 supplement|27|584|15|80|108|351|0|11|13|
|D6 supplement|10|192|6|25|35|122|0|4|0|
|D8 supplement|9|309|6|34|46|205|0|4|8|
|D3 C saved|24|532|12|76|100|324|0|10|10|

Per-resource durations are NOT_RECORDED; no zero-duration claim is made. HAR timing placeholders and URL deduplication cannot support an independent waterfall or byte/rate analysis. Ad/analytics host-pattern observations are separated per page, but a third-party host is not automatically an ad or unnecessary. Guard already blocks several analytics/map-telemetry endpoints. Documents, query controls and bound find_vacancy responses are necessary; scripts supporting those controls/data must be retained. CSS may affect visibility/interaction. The large image count makes ordinary images a candidate for an experiment, not proof that blocking them fixes DCL. Necessity of each script/font/image is not established by these recordings. No offline request/time reduction or before/after percentage is claimed.

## 3. Busy page and frequency

D3 snapshot24, Japanese W1 detail https://tabelog.com/tokyo/A1323/A132305/13108466/, contains “現在アクセスが集中しています” in its title and an explicit access-concentration message in body. Its preserved source is raw/runs/D3/D3/recordings/g6-D3-1793681527903-0/snapshot-0024.html. Recording metadata declares diagnostic files that are absent from C's retained copy; analyzer falls back to actual replay documents and records absent DOM as null, not false. For D3 only2 of24 DOMs are retained here:1 busy/2 inspected,22 unknown. Other selected runs have no matching busy text in their retained Tabelog DOM samples; this does not prove no busy HTTP response occurred. Full per-snapshot flags and actual source paths/SHA are in analysis.json and inputs.json.

There is no request-rate timestamp series, complete response chronology, or matched control. We therefore cannot state that our bursts caused the busy page, nor declare website throttling the primary cause. Counts and co-occurrence only.

## 4. Repeated navigation

| Run | navigate calls | excess visits to same recorded URL | notable groups (count / sessions) |
|---|---:|---:|---|
|D4 first|58|29|https://tabelog.com/en/tokyo/rstLst/ ×16/9; https://tabelog.com/en/tokyo/A1322/A132201/ ×2/1; https://www.tablecheck.com/en/japan/search ×9/9; https://tabelog.com/en/tokyo/A1323/A132305/13028728/ ×2/1; https://tabelog.com/en/tokyo/A1323/A132305/13173601/ ×2/1; https://tabelog.com/en/tokyo/A1323/A132305/13108466/ ×2/1; https://tabelog.com/en/tokyo/A1323/A132305/13153533/ ×2/1; https://tabelog.com/en/tokyo/A1323/A132305/13109579/ ×2/2|
|D1|35|17|https://tabelog.com/en/tokyo/rstLst/ ×11/7; https://www.tablecheck.com/en/japan/search ×7/7; https://tabelog.com/en/tokyo/A1323/A132305/13028728/ ×2/1|
|D4 supplement|41|25|https://tabelog.com/en/tokyo/rstLst/ ×16/10; https://tabelog.com/en/tokyo/A1322/A132201/ ×2/1; https://www.tablecheck.com/en/japan/search ×10/10|
|D6 supplement|9|3|https://tabelog.com/en/tokyo/rstLst/ ×3/2; https://tabelog.com/en/tokyo/A1323/A132305/13109596/ ×2/2|
|D8 supplement|17|10|https://www.tablecheck.com/en/japan/search ×5/3; https://tabelog.com/en/tokyo/rstLst/ ×7/3|
|D3 C saved|16|11|https://www.tablecheck.com/en/japan/search ×2/2; https://tabelog.com/en/tokyo/rstLst/ ×4/2; https://tabelog.com/en/tokyo/A1323/A132305/13108466/ ×6/4; https://tabelog.com/en/tokyo/A1311/A131102/13117471/ ×2/2; https://tabelog.com/tokyo/A1323/A132305/13108466/ ×2/2|

D1:35 calls,17 excess visits after grouping the recorded URLs. Crucially safeRecord strips URL queries (`src/eval/restaurant/agent-loop/runners/browser-case-slice-evidence.ts:11`), so these are same recorded origin/path counts, NOT proof of identical full queries. Search-name/date/party/service inputs may differ. Session IDs show many search entrances are reopened in fresh source sessions; repeated lookup and later availability/terms are also different reads. Within-session repeats exist and are listed, but their complete requested state/reason is not retained per call; automatic deduplication would be unsafe. No claim that17 navigations can simply be deleted.

## 5. TableCheck first observable deviation

D8 starts at TableCheck map search. Snapshot1 text is130 characters (navigation/menu shell: destination, cuisine, date, guests, Japan/login), no confirmed outlet identity. Stylesheet/logo failures and blocked Umami/Sentry/map tile reads are recorded; catalog/geolocation fetches are admitted. Later snapshots include more text, so do not label the whole session a blank page. Three candidate attempts ultimately report TABLECHECK_DISCOVERY_INCOMPLETE.

The production code has more than one exit for that code: matchesDiscoveryQuery rejection around tablecheck-browser-availability.ts:541, or no observed outlet links after the generic discovery step around:589. Requested/final query values are stripped in recordings, and candidate-level branch diagnostics are not retained here. Thus the first supportable deviation is DISCOVERY not producing a query-bound, extractable outlet entrance before its budget ends; exact query mismatch vs link extraction/model failure cannot be proved from the shared terminal code. HTTP200/HAR synthetic documents do not establish app-ready results. C owns related identity orchestration; do not alter that path to guess a fix.

## Evidence, validation and handoff

Inputs are Git-addressed with SHA-256 in inputs.json; analyze.py is deterministic and does not import product eligibility or evaluate a Live score. HTML and HAR are untrusted source data only. Safe URLs exclude secret query fields. No .env/answers/holdout read. Historical scores and Live outputs are untouched. Four-layer boundary: saved source/operation diagnosis only, not a new end-to-end Live result or S0 estimate. Root cause stays unresolved where data is missing.

No product/A/C code, Guard range, budget duration or G3 authority change. Fresh verification at 7b8d2bacfe4abd90960b63a0ea76f6d649c87eab: typecheck, arch, build PASS; default1404/1404; Chromium188/188; strict G2 5/5 and12 pages PASS. Every gate pre/post git status is empty. Raw gate logs and SHA receipts are in gates/. These are unchanged-product regressions, not evidence of a repair or speedup. No repair red/green or speed experiment is claimed, because implementation stops at the ownership/data boundary. Proposed minimal A/C handoff is in handoff.md. All new real model/Google/site/Live/GET calls0; approved6 W1 GET comparisons unused. Ledger unions ce6f94af past usage (67 rows), preserves all main rows and main limits, appends one B zero-call row; cumulative past usage is imported rather than reset. A's separately stated higher caps are not silently adopted in B. Push branch only, not main; notify A/C and stop.


## Final stop receipt

2026-11-03T15:10:53.077465+01:00 CET. Product/fixture/scripts/dependencies are byte-identical to main a7abbc0f; no A/C code edited. The five diagnostic questions are answered only to recorded evidence, with missing per-response chronology, durations, query values and TableCheck branch attribution explicitly unknown. No causal resource or throttling conclusion is asserted. No performance patch or before/after Live comparison has been performed. Stop for independent review and A/C ownership assignment, branch only, main untouched.
