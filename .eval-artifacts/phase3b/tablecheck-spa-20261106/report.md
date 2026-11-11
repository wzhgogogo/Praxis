# TableCheck SPA probe: upstream contract block

Status: draft / not integrated. Exposed diagnostic, not Clean Baseline. 2026-11-06T18:16:32.555278+01:00 CET UTC+1.

## Publication requested first

434d445b500b69c3de4f96b819efb9a15c076b0f was successfully pushed to origin/codex/chore-d8-recorded-model-validation. ls-remote returned the identical full SHA. Direct and no-proxy attempts timed out; the explicit existing localhost10808 Git proxy succeeded. No permanent network or Git proxy configuration changed. publication-receipt.json records the verified result. The prior12/12 model validation is now visible remotely.

## Actual probe

Frozen outer d6b5d523 (initial c34b472f had an import-name startup error before initialization,0 requests/charges; prelaunch-error.json preserves it). Automatic-review timeout also occurred before launch. Successful probe ran once, using existing isolated Local Chromium + Guard with source read declarations and generic public reads. No model/Live. Existing source origin/method/query rules were not changed. Before first navigation,1 evaluationGET was charged. Probe start and outcome retain CET timestamps.

The entry /en/japan/search returnedHTTP200. The probe observed the Destination button, opened it, found its textbox and filled the full user name Specializing in Nodoguro Ginza Nakamata with SPECIFIC_OUTLET authority. Final observed textbox value exactly matches it. No unique matching suggestion was available. No suggestion selected, no search submitted by the probe, no second page/read was charged. A site script issued dynamic searches while controls opened/changed; this is source behavior, not model calls or script-created requests. All source traffic passed the existing Guard. No admitted POST was observed; denied telemetry requests stayed blocked. No reservation/date confirmation/login or POST-form action was clicked.

## First blocker before receipt design

At the already reviewed search-v4 origin and /search/ path, these actual browser OPTIONS query shapes were blocked:

| Query keys | Evidence |
|---|---|
| country,hits,queryProfile | Guard BLOCKED; independent CDP outer request |
| country,hits,kind,queryProfile | Guard BLOCKED; independent CDP outer request |
| country,hits,q,queryProfile | Guard BLOCKED; independent CDP outer request |
| destination,hits,name,queryProfile | Guard BLOCKED; independent CDP outer request |

Current reviewed grammar does not include country/kind/q/destination/name. Browser outer requests show the associated GET Fetch attempts, but browser-start events do not prove dispatch to a remote receiver. No corresponding successful search response was captured. /catalog.json GET was ADMITTED then failed net::ERR_FAILED; its cause is unconfirmed and must not be rewritten as a policy rejection. No /v2/autocomplete response was observed in this probe. Old D8 and this new read therefore do not prove identical endpoint selection or current source health.

The outer outcome NO_UNIQUE_FULL_NAME_SUGGESTION is preserved, but independent-evaluation.json classifies BLOCKED_BY_UPSTREAM. This is NOT evidence the restaurant does not match or that the full name is wrong. One document navigation was observed; no query-specific successful SPA route/destination was reached, so the central SPA binding hypothesis remains unverified.

## Recording limits

All three recording mechanisms were enabled through the existing runtime/recorder. Actual retained evidence: full sanitized session/control/request timeline, Guard NETWORK shapes, admitted response metadata, two stylesheets, and3 masked layout screenshots. All3 DOM captures were rejected as UNSAFE_DOCUMENT by the current privacy sanitizer. The recorder therefore emitted no replayable document and no HAR file. This is a recording evidence gap, not a successful DOM/HAR capture, and cannot support the requested source-recording red/green. No raw unsafe DOM, header/cookie/key or invented response was saved. The frozen recorder and its outcome were not altered to force a replayable label.

## Design / remaining task

binding-design-draft.md records the generic boundaries for a reviewed dynamic receipt and suggestion-bound direct merchant handoff. It is a draft, not an implemented passing path. For area discovery, static inspection found full URL href comparison (including query), so front-end query routing may already count as model-driven departure; same-URL Fetch-only completion still requires actual evidence. Do not claim all area discovery is blocked solely because it lacks a document request.

No production source changes, Guard whitelist edits, budget/time increases, synthetic response/model output or new model provider. No positive binding implementation or wrong/stale/missing real-recording tests claimed. Full gate suite not rerun: the conditional implementation was not reached; prior full-green product evidence remains unchanged, not newly certified by this probe. Local checks cover unchanged source, record SHA integrity, exact observed textbox value, no admitted POST in Guard records, quota totals, references and diff whitespace.

Scope deviation: expected two-page query/result capture -> current source search grammar blocks prerequisites and safe recorder omits DOM/HAR -> cannot implement or certify receipt binding from this evidence. Converge on an explicit review of the exact four observed request shapes plus catalog/recording failures before any further source declaration change. User said admission must remain unchanged; source shape changes require a separate explicit decision. Do not spend remaining1 probe page as an unapproved automatic retry or consume the3 D8 witness/posterior GETs. No D8 Live or main merge.

## Budget and four-layer evaluation

New:model0,Google0,Live0,evaluationGET1. Cumulative:{"fullLive": 23, "realModelCalls": 653, "environmentReruns": 0, "evaluationPublicGET": 348, "googleRequests": 95, "restaurantWebsiteRequests": 11221}. ApprovedGET460/Live42/model1600; held-out18Live/108GET untouched. One of2 probe reads remains; D8's prior3 evaluationGET remain unspent. Model-only validation remains15/30 conservatively charged. Natural site subresource requests are recorded separately and are not silently counted as independent page allocations.

End-to-end NOT_EVALUATED; entry/open/fill observed, selection/results NOT_REACHED; full D8 declaration S0 NOT_EVALUATED; attribution limited to recorded query-shape refusal and separate catalog failure. The probe's blocked outgoing telemetry is not an admitted POST or a new write permission. Source admission residual risks remain as ADR0036 describes; no universal no-side-effect claim.

Shared STATUS/DEVLOG/TEST-LOG and monthly navigation are updated for this newly observed blocker, superseding only the current stop condition. Historical D4/D8/model results remain unchanged. Stop for review.
