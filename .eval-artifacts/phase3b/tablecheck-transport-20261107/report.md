# TableCheck transport and third-probe stop — 2026-11-07 CET

Status: **draft / not integrated; STOP_NO_RESULT_ENTRY_NAVIGATION_TIMEOUT**. Times in this report use CET (UTC+1); raw trace timestamps retain their original UTC representation. Baseline `0e275216`; observations/script candidate `c48ef60c`; frozen external probe `4b68893f741635bceb6fdeb5678c1429737ab003`; final product candidate `5afe1d4a01f8f6df144d00ed1e448630aea945cd`. No main merge or D8 Live.

The offline work is delivered. The promised replayable real TableCheck result is **not obtained**: the third read exhausted the existing navigation deadline before Destination could be opened. This remains the first unresolved external blocker. Offline greens below do not close it or certify source compatibility.

## 1. Conditional-Origin transport comparison (local real Chromium)

The independent localhost receiver returns ACAO only when the received Origin equals the page origin. It records header **names**, method, and the boolean match; no header values are saved. The page itself reads the response, so the PASS assertion covers browser CORS reception, rather than just an HTTP200 from Node. Each mode uses a new browser/session.

| Mode | Receiver methods | Origin matched | Browser CORS | Header names |
| --- | --- | --- | --- | --- |
| Native browser, no Guard | OPTIONS, GET | true | PASS | `transport-comparison.json` contains both sets |
| Guard `NODE_FETCH` / `route.fetch` | GET | true | PASS | all names exposed by intercepted `request.allHeaders()` arrived |
| Guard `BROWSER_GET_HEAD` / `route.continue` | GET | true | PASS | all names exposed by intercepted `request.allHeaders()` arrived |

Native GET: `accept, accept-encoding, connection, host, origin, referer, sec-ch-ua, sec-ch-ua-mobile, sec-ch-ua-platform, sec-fetch-dest, sec-fetch-mode, sec-fetch-site, user-agent, x-api-key`.

Node GET: `accept, accept-encoding, connection, host, origin, referer, sec-ch-ua, sec-ch-ua-mobile, sec-ch-ua-platform, user-agent, x-api-key`.

Guard browser-continuation GET: `accept, accept-encoding, cache-control, connection, host, origin, pragma, referer, sec-ch-ua, sec-ch-ua-mobile, sec-ch-ua-platform, sec-fetch-dest, sec-fetch-mode, sec-fetch-site, user-agent, x-api-key`.

Native OPTIONS: `accept, accept-encoding, access-control-request-headers, access-control-request-method, connection, host, origin, referer, sec-fetch-dest, sec-fetch-mode, sec-fetch-site, user-agent`. In the guarded modes the already existing reviewed-preflight handling supplies the reserved preflight response, so no OPTIONS reaches this receiver. That contract was not changed.

**No Origin-loss/CORS failure reproduced.** Native wire headers include `sec-fetch-*` names that are not exposed at the route interception point; browser continuation also adds cache headers. This comparison does not establish equality of every wire header/value. No headers were synthesized, and production forwarding/Cookie/credential behavior is unchanged. `transport-header-red.log` is a retained attempted reproduction and actually passes; it is not presented as a red test.

Correction to the proposed explanation: the previous actual source probe `82ac67fb` explicitly used `BROWSER_GET_HEAD`, not Node forwarding. Its saved MissingAllowOriginHeader cannot be attributed to `route.fetch` alone. This third probe uses production-default `NODE_FETCH`; the different mode and run time prevent a causal performance comparison between the two source runs.

Evidence: [comparison](transport-comparison.json), [original run](transport-baseline.log), [observable-header run](transport-header-red.log), [local Chromium tests](local-browser-green.log). The fixture is `src/harness/browser/transport-fidelity.test.ts`.

## 2. Observation only: PAGE_OBSERVED_VALUE and coarse characters

Hash current snapshot text/lines, observed control labels/values, and option labels/values using the same normalized text key. Cache only hashes in memory. All values ever successfully filled on this page are excluded from the page-owned set, including values from an earlier read. Clear cached page observations at each read scope and main-document navigation; do not run page JS while request admission is paused.

Retain the existing precedence for sensitive formats, authoritative equality/prefix, numeric and short tokens. Refine the remaining OTHER values to PAGE_OBSERVED_VALUE only upon a cached hash match. OTHER and PAGE observations additionally carry a coarse length bucket plus booleans for letters, digits, whitespace, comma, period, colon, brackets, quotes and other punctuation. They contain no text or persisted value hashes. Denied and admitted request observations share this metadata; failed Node forwarding now preserves it too.

**No admission gain:** matching maps PAGE_OBSERVED_VALUE back to OTHER. The production TableCheck query contract and independently transcribed `reviewed-read-rules.json` remain byte-identical to baseline. A real local page's observed punctuated label emits PAGE and is still rejected as destination; after a new read it becomes OTHER. Existing arbitrary-name/PII/prefix/old-input and exact-shape rejections remain. Tests:50 class/Guard tests,6 local Chromium cases, including three-mode transport and page observation. No actual new TableCheck destination class was obtained in the third probe.

Evidence: [class tests](observation-tests.log), [Chromium tests](local-browser-green.log), [offline summary](offline-summary.json).

## 3. Source-script capture, bounded and masked

Only an admitted response with resourceType `script` and JavaScript MIME qualifies for12,000,000 bytes when its origin is an already admitted successful public document origin or its URL matches the reviewed static-script rules. Other types keep their earlier contract and2,500,000-byte static limit. The response callback still only receives Guard-admitted responses. Own-origin safe script references remain in the sanitized document so the captured response can be used by Replay; this grants no request permission.

Known literal credentials are replaced in script content with equal-byte-length placeholders while retaining quote/newline structure. Existing own-production-credential detection occurs before masking and still rejects the entire recording. Header/Cookie capture is not added; document/JSON/stylesheet and personal-information handling is unchanged. Replay serves the masked recorded response.

Controlled fixture evidence:10,284,255-byte public script records; Google/AWS/Bearer/sk-style and named opaque api-key literals disappear; output byte length matches input; masked code executes under `node:vm`.12,000,001 bytes, non-source script, oversized stylesheet, and a JavaScript-MIME **fetch** above the old limit refuse recording. A source's own3MB script records without a CDN exception. These are constructed fixtures, not the real TableCheck bundle.

Red/green: [old cap red](script-limit-red.log) → [22 green](script-final-green.log). During final review an extra type-boundary counterexample found that MIME alone also gave a fetch the larger cap: [real red](script-resource-type-red.log) → [22 green after correction](script-resource-type-green.log). Final candidate requires script type; non-script reviewed JavaScript retains its old small-response handling. This stricter Recorder-only correction followed the source probe; no external run was repeated. Initial misplaced test-edit assertions and their two failures remain in `script-tests.log`; they are not presented as product red evidence. The original missing-script and own-credential refusal assertions are preserved.

The actual large TableCheck response never arrived in this third run; real-bundle capture/execution remains unverified.

## 4. Third source read: frozen, charged, stopped once

Frozen actor/spec/ledger/source hashes were committed before access in `4b68893f`. Startup seed records the user-approved total462; entry was charged before opening the source. The conditional extra document read would only be charged after a uniquely observed full-name selection causes an actual new main-document GET, with >=5s spacing. It was not used or converted into another entry attempt. No model, booking/date-confirmation/login/POST action, or Live evaluation was performed.

At **2026-11-07 11:28:03.537 CET**, operation stopped in ENTRY:

| Evidence | Observation |
| --- | --- |
| Entry GET | HTTP200,99,091 bytes; Guard returned HTML in about2.077s |
| Stylesheets | HTTP200,27,321 and531,026 bytes |
| Main script | `/portal/assets/index-KCcaxOlR.js`, `GUARD_ROUTE_FETCH`, no status/body returned before caller deadline |
| Navigation | unchanged `page.goto`20,000ms deadline exceeded |
| Script termination | context closure cancelled the pending fetch after17,909.983ms; lifecycle cancellation, not a recorded wire finish |
| Destination/FILL/query/suggestion/result | not reached |
| New CORS or destination evidence | none |
| Recorder | no DOM/screenshot/HAR; `NOT_REPLAYABLE / NO_CAPTURED_PUBLIC_DOCUMENT`; trace and two CSS files saved |

The HTML response was observed in memory but no navigated DOM snapshot was reached; it is not fabricated into a replay page. All recording hooks were enabled; screenshot output remains unavailable without its sanitizer, and no operation reached a snapshot. No script response/status or source transport-completion evidence exists. Source/network/Node transport cause remains unknown; this is neither evidence of continued CORS failure nor of CORS recovery.

This is a diagnostic `.eval-artifacts` actor, not a whole-product acceptance run. Four layers: end-to-end D8 NOT_EVALUATED; step evidence only entry200 plus failed readiness; no identity/delivery/S0 success claim; attribution limited to recorded pending fetch and bounded caller cancellation. Dynamic/suggestion binding and region result verification are not reached and are not implemented on fabricated evidence.

Evidence: [frozen inputs](probe-input-sha256.json), [actor](probe.ts), [started](probe-runtime/started.json), [receipt](probe-runtime/receipt.json), [responses](probe-runtime/responses.json), [timeline](probe-runtime/events.json), [recording](probe-runtime/recording/recording.json), [separate evaluation](probe-independent-evaluation.json).

## 5. Offline gates and failure boundaries

Final candidate `5afe1d4a`: all six commands in `gates-script-type/results.json` finished successfully before this report was finalized. Each command records clean pre/post git status and the same SHA. The first all-green matrix on `bbb7f0db` remains separately under `gates/`; the second is required because of the subsequent script-type correction.

Final clean matrix: typecheck PASS; arch:check PASS; npm test **1458/1458**; build PASS; full local Chromium **235/235** plus complete G6 **75/75**; strict G2 **5/5** and all12 page pairs PASS. No failed, cancelled, skipped or todo tests in these final gates. [Machine receipts](gates-script-type/results.json); raw command logs in `gates-script-type/`.

| Failure type | Test/evidence | Remaining boundary |
| --- | --- | --- |
| Conditional Origin lost in forwarding | independent three-mode local Chromium receiver, all PASS; no red obtained | actual TableCheck headers/CORS failure not reproduced locally |
| Page observation grants authority or leaks across reads | local page emits PAGE yet request rejected; new scope clears it; existing contract controls | source destination not observed this run |
| Large public script rejected / credential literals persisted | old-cap red,10.28MB masking/execution green, own-credential refusal retained | actual large source response missing |
| Wrong response type uses12MB allowance | fetch-js assertion red then same assertion green | no source request permission changes |
| Actual entry readiness | frozen third run HTTP200 then20s timeout; no retry | unresolved; no Replay/binding/D8 result |

## 6. Budget, freeze and stop

New source page reads **1**, model **0**, full Live **0**. Current cumulative GET350/462, models653/1600 (947 remaining), Live23/42; held-out18Live/108GET untouched. Of112 total remaining page reads,108 remain held out; the other4 retain their conditional selected-shop document1 and D8 witness/posterior3 purposes. The remaining D8 Live1 is unused. Model-only allowance remains15/30 used; none consumed here.

Frozen source inputs remain unchanged through the actual probe. Final source differs from probe source only in the stricter Recorder script-type handling and its test; Guard/query policy/limits remain unchanged. Final delivery adds reports and evidence after the green source freeze, with source/config equality checked separately. Original failures and captures remain intact. Pre-push scan against0e275216:2 hits (generic character description and line-splitting regexes). Cumulative72b18bee:10 hits (those2 plus previous2 generic format regexes and6 user-approved exact-contract rows). The scanner excludes eval; manual review of the Recorder credential patterns/source-origin conditions found no source-specific names, aliases or selector shortcuts. No scan hit is claimed absent. See `scan-0e275216.log` and `scan-72b18bee.log`.

Stop for review now. No extra read, model call, timeout/budget increase, destination relaxation, alternate name/provider, new binding claim or D8 Live. A further source entry requires a new explicitly approved read; the conditional extra document allocation cannot authorize it.
