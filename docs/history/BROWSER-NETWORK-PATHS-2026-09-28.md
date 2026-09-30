# Browser network path comparison — 2026-09-28

- Status: diagnostic / not integrated; current observations, not H001 or inventory acceptance.
- User requested investigation of both sites' default paths versus the traced10808 failure. Explicit10808 remains the saved local Live preference; only these named default diagnostic cases bypassed it intentionally. No system/TUN/browser-security/production-source change.
- Three fresh temporary Chromium probes, one navigation each,25-second navigation and35-second total limit,0 model calls. Exact URLs reused from observed/user-provided pages; no URL grid, query retry or external write.

## Observed differences

| Case | Result | What it proves |
| --- | --- | --- |
| Tabelog regional search, default browser path | Document200 at1.992s; restaurant results read at5.697s; TLS1.3 completed | The previously failing regional page is reachable in this observation. Does not prove long-term stability or that earlier timeouts shared one cause. |
| TableCheck user-provided search, default browser path | Main document200 at0.777s; source observation ends11.330s; search API preflight403, `server: awselb/2.0`, missing Allow-Origin | The API request completed transport and was rejected withHTTP403; CORS is a subsequent browser symptom, not evidence of a TLS timeout. |
| TableCheck same search, explicitHTTP10808 | Main document403 at1.694s; observation ends5.759s; body `403 Forbidden / nginx`; TLS1.2 completed | This path received an HTTP rejection before the search app/API. It is not a transport timeout. |

The generic probe labels TableCheck as `CONTENT_WITHOUT_PARSED_RESULTS`; that label merely records document read and a non-Tabelog parser result. Independent evaluation explicitly classifies both TableCheck cases as access failures, never successful empty searches. Tabelog search results remain unqualified candidates, not inventory.

## Actual local routing facts

SystemHTTP/HTTPS/SOCKS/PAC flags are disabled. Xray has an enabled mixed listener at127.0.0.1:10808 and a TUN inbound `utun8`; configuration loglevel iswarning with no configured access/error log destination. Neither absence of a system proxy nor Chromium's default/direct proxy selection means bypassing TUN.

Read-only OS route lookup of endpoints actually observed in this run:

- TableCheck main35.75.237.13 → en0 via192.168.1.1.
- TableCheck API54.150.250.178 → utun8 via172.18.0.1.
- Tabelog172.66.1.98 → utun8 via172.18.0.1.

The default path therefore is not a single uniform route across these resources. This is a routing fact, not proof of public egress addresses or an explanation of the server's403 policy. The source response/route observations are nearby in time, not a simultaneous packet-level trace. Safe config summary excludes node addresses, IDs, passwords and keys.

## Relation to the earlier10808 TLS trace

The earlier focused Tabelog explicit-proxy trace proved localTCP and CONNECT200, then ClientHello without receive events until cancellation. This newer Tabelog default probe succeeds; no evidence supports treating every default-path failure as the same TLS fault. Earlier navigation failures without NetLog cannot be reconstructed from current successes.

Two distinct failure classes are established: intermittent transport/handshake failure in the traced Tabelog attempt, and HTTP access rejection in TableCheck. The more specific causes—server rejection rule, proxy exit behavior, intermediary/client-handshake handling—are not established by client evidence. No unsupported claims of geo-blocking, IP reputation, MTU defect or fingerprint blocking. Disabling CORS, weakening TLS or adding business-agent retries would not constitute a demonstrated fix.

## Evidence and verification

`.eval-artifacts/browser-network-compare-2026-09-28/` stores per-case start/result/source/NetLog and filtered connection summaries, `proxy-config-summary.json`, `route-summary.json`, and independent`evaluation.json`. The TLS-stall comparison remains separately preserved in `.eval-artifacts/tabelog-region-network-2026-09-28/`. All temporary browser sessions closed. No production code change or model calls; prior code gates reused and documentation diff checked. No commit/push.
