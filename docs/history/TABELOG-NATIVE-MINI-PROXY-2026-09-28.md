# Tabelog native mini-live through10808 — 2026-09-28

- Status: diagnostic / not integrated; exposed development request, not H001 acceptance or Clean Baseline.
- User request: continue native-first experiment, keep Google geographic capability, use explicit10808 for future local browser Live, defer default-network diagnosis.
- Frozen request: September29,2026,19:00 Asia/Tokyo, two guests, omakase within1km of the previously resolved Shibuya locality. No semantic/Gold edit.
- Budget: one300-second window, maximum50 model calls/five details/three availability checks; stop on source-access failure. No external booking or production-state update.

## Execution and independent interpretation

At14:20:41.597Z the production local runtime, configured through `PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER=http://127.0.0.1:10808`, opened Tabelog's Tokyo search with only the keyword `omakase`. It returned readable source in5,869ms. Existing Tabelog parser found five restaurant detail links (its built-in output cap), including Tsukiji Sushi Omakase and other Tokyo outlets. These are unqualified discovery candidates, not accepted Shibuya/omakase/availability results. The earlier combined keyword `Shibuya omakase` returned no matches; this separated search is a changed query, not a reliability A/B.

The first page exposed the exact regional link `/en/tokyo/A1303/rstLst/?sw=omakase`, labelled Shibuya & Ebisu & Daikanyama. The continuation used that observed link, a fresh temporary session, the same explicit proxy, and the original total deadline. It began at cumulative49,504ms; the document request failed with `net::ERR_TIMED_OUT` after approximately30seconds, with no response event or readable regional document. Cumulative elapsed79,654ms includes preparation between stages, not79seconds of continuous page wait. No retry, alternate source, model call, detail read or availability check followed. Both temporary sessions closed.

Independent result: native discovery OBSERVED; regional refinement FAILED; geography/HARD facts/request controls/inventory NOT_REACHED; user goal NOT_COMPLETED. Production source hashes are unchanged. Google/model calls0, no Offers. This was a diagnostic composition, not production Router/Runtime/Evaluator integration.

## What this says about Google-first

It demonstrates that Google restaurant discovery and cross-provider matching are unnecessary for obtaining native Tabelog candidates. It does not yet prove the complete same-source candidate → venue-bound facts → requested inventory chain. Therefore it supports continuing a native-first experiment and retaining Google for geographic needs; it does not justify declaring the production Google-first replacement accepted. The observed failure precedes identity comparison and does not establish that Google matching is required.

Explicit10808 enabled earlier and this initial search, but this regional request still failed. Do not claim all proxy navigation is reliable or infer that Japanese users cannot experience similar faults. Per user direction, no further default-path/network-root-cause investigation was performed in this run.

## Configuration and evidence

User-authorized local `.env` now stores `PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER=http://127.0.0.1:10808`; other settings preserved. This configures local browser Live through the runtime factory, not DeepSeek/Google HTTP transports or Cloudflare remote browsers. Direct constructor diagnostics must pass the setting explicitly; this continuation did. No system proxy/TUN changes. No further production code change; prior536/536 and code gates reused, documentation diff checked. No commit/push.

Ignored artifacts under `.eval-artifacts/tabelog-mini-proxy-2026-09-28/`: `started.json`, `discover.mjs`, `discovery.json`, `discovery.html`, `discovery.txt`, `run.mjs`, `continuation-started.json`, `execution.result.json`, `run.log`, and independent `evaluation.json`. The source search page—not chosen restaurant names—provided all candidate/region URLs.

## Follow-up: why10808 can still time out

After the user's request for a cause, one focused browser probe on the same observed regional URL recorded Chromium NetLog; one nearby curl request explicitly used the same HTTP proxy. No further full mini-live, default-network investigation or model call.

The new browser trace shows TCP connection to127.0.0.1:10808 and HTTP CONNECT200, followed by SSL_CONNECT and SSL_HANDSHAKE_MESSAGE_SENT type1 (ClientHello). After the tunnel response it sent1,727bytes and recorded no subsequent socket receive or server-handshake event before the configured25-second navigation deadline. Runtime cleanup then producedERR_ABORTED/net_error-3; those are cancellation effects, not evidence of a server rejection. Browser total25,134ms. This localizes **this traced failure to TLS negotiation after local proxy and tunnel establishment**, before the source HTTP request; it is not a DOMContentLoaded-only wait on an already loaded page.

The explicit-proxy curl comparison completedTCP in0.000742s, TLS in0.706429s, received first byte at1.634212s and finishedHTTP200 in2.137776s, withCONNECT200 andproxy_used1. It shows this proxy can complete TLS and fetch that URL with curl at that time. It does not isolate whether browser ClientHello handling, the proxy's outbound route, an intermediary or source edge caused the missing reply; there is no server-side packet trace. Do not claim a proven fingerprint/MTU/anti-bot cause, universal Chromium defect, or retroactively assign this mechanism to every prior untraced timeout.

Evidence: `.eval-artifacts/tabelog-region-network-2026-09-28/` contains source probe/result, NetLog, extracted `connection-events.json` and `tls-events.json`, curl timing and cookie-redacted trace, plus independent`evaluation.json`. Zero model calls; no production code/config change in this diagnosis. Browser closed; explicit10808 preference retained. The prior lsof inspection returned no visible listener but active TCP/CONNECT evidence establishes successful connection; absence of lsof output is not treated as a closed port.
