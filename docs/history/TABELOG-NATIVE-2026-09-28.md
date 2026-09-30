# Tabelog native diagnostic — 2026-09-28

- Status: diagnostic / not integrated; exposed development request variant, not H001 acceptance.
- Request: 2026-09-29 19:00 Asia/Tokyo, two guests, omakase within 1 km of the previously resolved Shibuya locality. No Google restaurant discovery or cross-provider matching.
- Limit: one 300-second run, maximum 50 model calls, five details and three availability reads; stop on access failure. Existing LocalPlaywrightChromium, Tabelog parsers/query hints and BrowserTaskExecutor reused; no production adapter added. Native composition remains separate from Router/Runtime integration.

## Outcome

Started 2026-09-28T14:10:23.941Z. Initial English search `/en/tokyo/rstLst/?sw=Shibuya%20omakase` issued its document request at301ms and failed at30,970ms with `net::ERR_TIMED_OUT`. No document response event or readable source snapshot. Total31,033ms, zero model calls, zero candidates/details/availability/Offers. Failure occurred before browser skill or fact-model execution, so this run cannot assess their quality. The run used the normal DOMContentLoaded navigation contract, but the observed browser network error occurred before the configured35-second navigation deadline; this is not evidence of a fully loaded page merely missing a readiness event.

One separate, credential-free HTTPS comparison of exactly the same URL, within the original five-minute diagnostic window, returnedHTTP200: DNS0.002704s, TCP0.003203s, TLS0.770532s, first byte1.717238s, total2.443359s, remote162.159.141.102. Response body was discarded; HTTP200 alone does not prove search results. This was one connection diagnostic, not another model/browser task run.

## Independent interpretation

User goal NOT_COMPLETED; search/navigation FAILED; all downstream acceptance dimensions NOT_REACHED. The curl result narrows investigation to a difference or transient behavior between browser and HTTPS paths, not universal inability to reach Tabelog. Exact DNS/TCP/TLS/protocol cause is unrecorded for Chromium and remains open. No Tabelog CORS/403/challenge was observed. Do not import TableCheck's separate preflight finding or blame TUN. The next useful evidence would be a focused browser network trace for this document request, not another full paid Live loop.

No production edits, network/security changes, booking action or commit/push. Source hashes remain unchanged. Script syntax check and documentation diff check passed; no unrelated offline suite repeated for this diagnostic. Temporary browser closed.

Ignored evidence: `.eval-artifacts/tabelog-native-2026-09-28/` contains `started.json`, `run.mjs`, `run.log`, `execution.result.json`, `https-comparison.json`, `https-comparison.error.txt` and independent `evaluation.json`.

## Follow-up: explicit localhost10808 proxy

User proposed an explicit10808 connection. Same headless Chromium, same search URL, fresh temporary profile and35-second navigation bound, with the only intended network change `proxy.server=http://127.0.0.1:10808`: documentHTTP200 at1,805ms, complete page observation5,094ms. No challenge; no parsed outlets. Original visible source says `No restaurants match "Tokyo Shibuya omakase".` This establishes usable page access through this explicit proxy at this time, not inventory or a definitive DNS/TLS/protocol root cause; observations are sequential rather than a simultaneous controlled A/B. No TableCheck proxy validation was performed.

Added one optional `proxyServer` runtime field and `PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER` environment setting, passed directly to both ordinary and persistent Playwright launches. Defaults unchanged; no retry/fallback/security bypass. The existing launch/profile test first failed because the proxy was absent, then passed with the setting; existing default/profile cases remain covered. Typecheck, architecture check and build passed. Default suite initially encountered sandbox localhost-listenEPERM; rerun in the authorized local-test environment passed536/536. No DOM/control change, so no new fixture matrix.

Actual production diagnostic entry then used Runtime Factory → fromEnvironment → LocalPlaywrightChromium with this environment setting, and returnedCONTENT_OBSERVED in5,815ms. Artifact: `.eval-artifacts/restaurant-browser-probe/2026-09-28T14-16-41-097Z-d21a3de8-d090-4b5c-9575-4f15ddfacc69.result.json`. Two bounded source observations total, zero model calls; neither is a full Live run or booking. System proxy/TUN settings and local `.env` were not changed; subsequent local diagnostics should explicitly supply the new environment variable (or constructor option when bypassing the factory).

Detailed proxy probe, saved public text, red test and verification logs: `.eval-artifacts/tabelog-proxy-10808-2026-09-28/`. Next native-search diagnostic should use observed area controls and keyword separately; the combined keyword query currently has no displayed matches. Do not claim no Shibuya omakase restaurants or no availability from that query.
