# H001/H002/H003/H005 browser execution slice plan

- Status: historical preflight; four planned Live reads have since run, with results in [the Live report](BROWSER-CASE-SLICE-LIVE-2026-09-29.md); not integrated
- Input authority: `src/eval/restaurant/agent-loop/cases/e2e-cases.yaml` (`restaurant-read-development@6`) through `materializeLiveCase`
- Scope: one historical, traceable public outlet entrance per Case; existing source Adapter, shared Browser Executor and local Chromium only. This tests browser operation and request binding, not discovery, Google matching, source facts, Runtime presentation or a full Case result.

## Current evidence and actual gap

The 53/53 offline Chromium Fixture matrix already covers local and Cloudflare-session `BrowserSession` references, native date/party fill, combobox option ownership, observed links and popups, card-center obstruction at the first and a lower result, TableCheck widget interactions, Tabelog date/guest controls, loading-to-restriction classification and source response binding. Existing Adapter tests cover exact date/party/time parsing and H005's `EXACT_ONLY` negative path. Fixed-source model runs prove strict browser-decision wiring against fixed pages; they do not prove current live controls. A `NAVIGATE/SNAPSHOT/WAIT_FOR` probe is page observation only and is not a browser execution pass.

The remaining live question is whether the current source page exposes an actionable control and whether the existing Adapter plus model can apply the materialized request, confirm selected values, and bind a source result inside budget. A successful `BrowserSession` click or a model `COMPLETE` is weaker than an Adapter request-bound `AVAILABLE` or `UNAVAILABLE` result; `UNKNOWN` is a measured limit, never zero inventory. The runner records navigation, snapshot, model-call and model-action counts separately, plus Adapter status and request fingerprint. It does not perform source discovery, geocoding, fact evaluation or booking writes.

## Deduplicated slices

| Case | At 2026-09-29 22:45 JST | Browser entrance | Scope and limit |
|---|---|---|---|
| H001 | Original Sep 29, 19:00, 2; already elapsed. User authorized Sep 30, 19:00, 2 as an explicit diagnostic variant | Tabelog `Sushi Teppen`, native ID `13308491`, source detail `https://tabelog.com/en/tokyo/A1303/A130301/13308491/` from the Sep 29 H001 Live | `--h001-tomorrow` freezes Sep 30 and records the original wording, original materialized date, variant ID and authorized date. Frozen Gold is unchanged; omakase and nearby qualification are outside this browser slice. |
| H002 | Sat Oct 3, 18:30, inferred 2 | TableCheck `0711 GiNZA BiSTRO`, guide `https://www.tablecheck.com/en/0711-ginzabistro` from H003 native detail | Representative two-person TableCheck widget probe near the evaluation point, not a case-qualified first-date/negative-cuisine candidate. |
| H003 | Fri Oct 2, 17:30–22:00, 10 | Same TableCheck guide, historically 548m from `35.6697,139.7670` and within the exact 3km H003 evaluation radius | The historical Loop 2 reached this widget but timed out; measure current 10-person control and result binding. Budget/private-room/drinks suitability is outside this slice. |
| H005 | Start-time Tokyo minute, exact 4; validity one minute | Same TableCheck guide, reused only as a widget control probe near the evaluation point | Materialize at execution start, keep `EXACT_ONLY`, record expiry and request fingerprint. If the one-minute window passes, report `IMMEDIATE_REQUEST_EXPIRED`, never an old slot. Local-food/no-fast-food facts and Runtime reuse across a later user request are outside the browser slice; the existing Domain/Router validity guards remain the relevant offline control. |

This is **four candidate reads across two source paths**, not Case×platform. H002/H005 use a historically observed H003 outlet only to exercise their distinct parameter shapes; neither can produce a qualified H002/H005 recommendation. A source challenge, current URL/identity mismatch, disabled control, no explicit slot or exhausted budget stops that Case without replacing the venue or widening coverage.

## Prepared entry and proposed budget

Plan-only command (no keys, network or model):

```bash
node --import tsx src/eval/restaurant/agent-loop/runners/run-browser-case-slice.ts --plan --case h003
```

The same command accepts `h001`, `h002` and `h005`. The prepared **execution** form, to be used only after main-chat review of this plan and current date, is:

```bash
PRAXIS_ALLOW_LIVE_RESTAURANT_READ=1 PRAXIS_ALLOW_BROWSER_RUN=1 PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM node --env-file-if-exists=.env --import tsx src/eval/restaurant/agent-loop/runners/run-browser-case-slice.ts --execute --case h003
```

Replace only the Case ID; add `--h001-tomorrow` for the authorized H001 Sep 30 variant. The runner rejects a browser proxy, so Google-only `10808` configuration has no effect here; no Google client is constructed. One invocation permits one source candidate, at most 45 seconds total, 30 seconds per provider, 24 browser operations and 5 browser model calls. The 30-second provider cap is inside the 45-second candidate cap, not an additional allowance. Four independent invocations therefore have a declared **180-second / 20-model-call aggregate ceiling**, with no automatic retry or extra platform multiplication. H005 runs first because its authoritative minute is materialized at invocation start. Each invocation writes unique gitignored `.started.json` and `.result.json` artifacts under `.eval-artifacts/browser-case-slices/`, retaining ordered diagnostics, complete Executor-projected model observations/actions, BrowserSession calls and observed controls, page text/source state markers/HTML hash, and sanitized Adapter request/result/evidence. Raw HTML, credentials, cookies and URL query strings are not retained. The execution will not be described as full H001–H005 Live or independent Eval.

## Stop and review rule

Before each real invocation, re-run `--plan` and inspect the materialized date/time, source entrance, elapsed-window flag and remaining aggregate budget. Stop on an elapsed window, source access failure, bot challenge, identity mismatch, no actionable control, model-budget exhaustion or unknown source result. Do not adapt a source by inventing selectors or known-success venues. The main chat reviews this exact command, four-Case mapping and 180s/20-call aggregate before any external request or paid model call.
