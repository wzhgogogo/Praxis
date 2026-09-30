# Native source access diagnosis, September 28

- Status: diagnostic / not integrated; exposed development request variant, not H001 acceptance.
- User-selected request: September 29, 2026, 19:00 Tokyo, two people, omakase near Shibuya. The original September 28 19:00 request had expired and was not silently shifted.
- Preparation reused current production parsers, BrowserTaskExecutor, ModelBrowserReadActionDecision and ModelRestaurantFactJudgment. No production source changed. This is a diagnostic composition, not Router/Runtime/Web integration; no HIGH identity was fabricated from same-source phone comparison.

## TableCheck results and independent interpretation

The initial run began at 10:30:40.782 UTC. One Google request resolved Shibuya as a location, not a restaurant. The TableCheck keyword search loaded and returned a rendered empty-state page by 10,617 ms, with zero model calls, candidates or checks. The network record also contains failed requests to `search-api.ai.ingress.production.tablecheck.com/ai_search`.

Within the same original 300-second deadline, one geographic retrieval continuation removed the keyword without weakening the downstream omakase requirement. It reused the observed location, launched at elapsed 54,688 ms, and returned at elapsed 66,362 ms. The document returned HTTP 200; the page displayed `No venues found within your search area`. Eight search fetch failures were observed. This is **not evidence that no restaurants exist or that the keyword was too restrictive**. The continuation's elapsed time is cumulative and must not be added to the first run's elapsed time.

A single focused CDP diagnosis of the geographic search began at elapsed approximately 130 seconds and ended its page observation at 140,682 ms. Search API responses were **HTTP 403**. Chromium reported `PreflightMissingAllowOriginHeader`: the preflight response lacked `Access-Control-Allow-Origin`, preventing the page from reading search data. Repeated failures within each page load were the website's own requests, not an added application retry policy. Main-document access and search-data access are separate capabilities.

Independent verdict: **SOURCE SEARCH DATA ACCESS FAILED**. The execution files retain `NO_VERIFIED_RESULT`; their rendered empty state must not be promoted to a successful zero-result search or unavailable inventory. The HTTP 403 establishes rejection of this diagnostic client's requests; it does not establish whether the rejection came from origin configuration, edge policy, browser/session differences or network routing. It does not retrospectively explain the earlier 35-second DOMContentLoaded timeouts. No browser security setting, proxy, authentication or identity was changed.

Zero DeepSeek/model calls and tokens; no restaurant detail, fact interpretation, date/party control or availability stage reached. The diagnostic fact-model wiring therefore remains unvalidated. Source files were hashed before execution. Earlier offline tests were not rerun for this read-only diagnosis; the runner passed a syntax check.

## Tabelog boundary

The user also allowed Tabelog. An in-app browser UI check within the remaining overall window reached its English homepage and observed live Shibuya station autocomplete, date calendar and party/time controls. This was a separate computer-use entry check, not the production browser/model pipeline. In the narrow viewport, the calendar/help overlay interaction did not produce a confirmed September 29 selection; the date remained September 28. No valid target-date search or inventory result was obtained. The temporary tab was closed without sending a chat message, creating a reservation or changing external data. Computer-use calls are separate from the zero DeepSeek-call count above.

## Evidence and next step

Ignored evidence directory: `.eval-artifacts/native-tomorrow-2026-09-28/`:

- `execution.result.json`, `001-snapshot.html`, `001-snapshot.source.txt`: keyword search and network observations.
- `continuation/execution.result.json` and source snapshot: geographic retrieval under the original deadline.
- `api-diagnostic.result.json`: HTTP 403, preflight/CORS failure and rendered empty state.
- `run.mjs`, `continue.mjs`, `api-diagnostic.mjs`: exact diagnostic code; not a new supported production runner.

Earlier source-only navigation succeeded in 2.384 seconds; see `.eval-artifacts/h001-tablecheck-native-2026-09-28/NAVIGATION-DIAGNOSIS.md`. That success did not await search results.

The next meaningful step is compare a successful user browser search with the failing diagnostic's search-data request/session path, or separately validate Tabelog using the confirmed target controls. Do not infer no inventory, increase timeouts, disable CORS, spoof identity, or claim the prior browser fixes failed based on this result. Production acceptance, native discovery coverage and current inventory remain open.

## Follow-up: normal UI and local routing comparison

Following the user's request to locate any repeated failure, one geographic-search navigation in the Codex in-app browser also rendered an empty result. Its exposed developer-log list was empty; no additional HTTP403 claim is made for this browser. It is not a capture of the user's daily browser, and no inventory was checked. The tab was closed.

Read-only system inspection found HTTP/HTTPS/SOCKS system proxy and PAC flags disabled. Nevertheless TUN routing was present: all three currently resolved search API IPs (`54.150.250.178`, `13.196.44.185`, `35.73.67.154`) routed through `utun8` / `172.18.0.1`. The earlier observed main-document IP `35.75.237.13` currently routed through `en0` / `192.168.1.1`. This establishes a current route difference; it does not show that TUN was absent, identify its external egress, prove earlier routing was identical, or explain why the API rejected preflight. No proxy, browser security, DNS or routing settings were changed. `browser-route-comparison.json` records the observation. Asked the user whether manual success included actual search/date/party results and which browser was used; that comparison remains pending.

## User-described homepage search follow-up

User reports `omakase ginza` works from the homepage under v2rayN TUN/global with system proxy cleared. This does not establish an invalid network setup, and prior route inspection is not proof of the current setting. Bounded comparisons found different failure stages: a headed browser received200 and rendered homepage text while DOMContentLoaded timed out; another document request returned200 only after68.5 seconds; an ordinary HTTPS request received200 in0.66 seconds. Waiting only for the visible input caused ordinary form navigation back to the homepage rather than a successful search, so merely shortening the wait is not a verified fix. No proxy or production code changed. Browser name and the successful result URL were requested for an actual matching comparison. All successful and failed observations are preserved in `.eval-artifacts/native-tomorrow-2026-09-28/HOME-SEARCH-COMPARISON.md`; they do not establish headless mode or TUN as the root cause.

## Actual user Chrome comparison

The user supplied Chrome and the exact `/en/japan/search` URL with `search_text=omakase+ginza`. Read-only native UI inspection of that existing tab, without reloading or submitting a query, observed `No exact matches within your search area` and `Popular lists` below. Its DevTools Console contained search API errors for that exact keyword and coordinates: the preflight response lacked `Access-Control-Allow-Origin`, followed by `net::ERR_FAILED`. This is the same error class as the diagnostic browser. **No HTTP status was captured in the user's Chrome**; the earlier HTTP403 belongs only to the separate CDP diagnostic. Telemetry429 errors were not counted as search errors.

This completes the previously pending browser/URL comparison at a currently failing page; it does not establish a successful-manual versus failed-automated A/B. An automation-only explanation is insufficient for the observed search failure. Earlier manual success remains possible, and the existing console is not a timestamped fresh request capture. The origin/edge/egress cause and previous navigation timeouts remain unresolved. Main-page visibility and recommended lists do not establish successful search-data retrieval.

Only relevant observations were transcribed to `.eval-artifacts/native-tomorrow-2026-09-28/user-chrome-observation.json`; unrelated tabs/account information were excluded. DevTools was closed after inspection, with the user's tab retained. No additional model run, production edit, network/security setting change or booking action. The next diagnostic evidence, if pursued, should be the failed API preflight response details rather than another full Live run.
