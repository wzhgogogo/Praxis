# TableCheck network-restored baseline preparation (2026-10-19)

Evidence status: exposed development diagnosis / not a completed baseline.

## Push and scope

The three authorized commits 35c5dc2, 4315ab8, 3094193 were pushed successfully to origin/codex/feat-live-restaurant-read-path (50a79d9..3094193). No P2-1a checkpoint or full Live was started.

Work is isolated in the p21-tablecheck-baseline worktree on codex/fix-tablecheck-public-catalog, based on 4315ab8. Main user-owned INDEX/product drafts/presentations were not changed.

## Observed transport

- Exact prior h001 attempt-2 TableCheck search URL is in tablecheck-network-input.json. No date/semantic changes.
- Unguarded initial measurement ended too early after catalog metadata; retained as diagnostic/unguarded.json. Corrected bounded measurement is unguarded-complete.json.
- Unguarded goto completed in 1,989 ms; catalog GET returned200. Catalog contains locale/facet/price metadata, not venue rows. Actual /search/ GET responses returned200 (document arrays289 and19, among other grouped/widget responses); DOM parser found20 outlet links. These are connectivity observations, not witness or qualification results.
- Original Guard goto completed in2,594 ms, but rejected catalog; zero parsed outlets. Thus navigation completion alone was insufficient.
- Exact GET-only source rules were added for /catalog.json (no query) and /search/ (observed public query keys) at the single observed tablecheck.net origin. Local Chromium independent receiver red/green proves these GETs arrive while POST/HEAD, other paths and unknown fields do not.
- Guarded GET-only recheck goto completed in3,039 ms; catalog returned200. Actual search was still blocked by browser CORS OPTIONS preflight; no result JSON and zero parsed outlets. This is NOT a completed fix.
- Safe protocol observation: requested methodGET, requested header name x-api-key, Origin https://www.tablecheck.com. No header values, cookies or credentials saved. See guarded-cors.json.

## Current code and tests

- TableCheck preflight now requires positive document-hit count from the actual result JSON; DOM shells and catalog metadata cannot pass it. Grouped facet nodes do not count.
- Recorder consumes the same reviewed GET grammar through its existing reviewedReads option; its content safety/size limits remain. Local safe GET JSON recording is verified, not a claim that all real source JSON is replayable.
- Outer independent audit previously ignored frozen cross-origin GET declarations. Its red/green now verifies exact frozen origin/path/method/resource/query grammar, preserving wrong-field/method/origin negatives. This changes no qualification or Gold criteria.
- Evidence: diagnostic/catalog-guard-red.log -> catalog-guard-green.log; frozen-get-audit-red.log -> frozen-get-audit-green.log; preflight-green.log. Final offline gates will be added below.

## Explicit blocker and unstarted work

The user instructed GET-only network rules. Actual browser transport additionally requires OPTIONS. A concise authorization question is pending for a narrowly bound CORS handshake; OPTIONS remains blocked, with no permission silently added. Witness certification, history rearrangement/new baseline freeze and ten baseline probes have NOT started. Witness script is prepared only, not executed.

Existing budget remains10/40 probes,86/450 model calls,15 historical Google requests. This round adds0 model/Google/probe/Live; only explicitly requested zero-model TableCheck diagnostics and offline local tests ran. No witness recertification requests yet. The previously recorded pre-P2-1a baseline commit remains4315ab8 until the common transport fix is complete and committed.

## Offline gate result (GET-only branch, before P2-1a)

Typecheck/arch/build PASS; npm test935/935; real local Chromium114/114 (222.333 seconds). Logs: gates/get-only/. Effective red/green and original zero-model measurements retained verbatim. These green gates do not close the actual CORS blocker.


## Authorized CORS follow-up (2026-10-19)

The user explicitly approved the narrowly GET-bound browser CORS exception. Earlier blocked observations remain unchanged above. Scope: same exact search origin, `/search/`, same GET query grammar, browser-generated preflight only, requested method GET, request Origin www.tablecheck.com, observed header name x-api-key, body length zero; no standalone OPTIONS, POST or header injection.

Real Chromium red: diagnostic/cors/chromium-red.log (legal GET blocked). Independent S0 red: s0-red.log (unknown frozen handshake grammar). Intermediate green-1/2/3 logs retain fixture-oracle and sanitizer wiring failures; they are not final passes. Final targeted Chromium green-4 covers GET, POST preflight, unknown header, wrong path, absent GET rule and manual OPTIONS. Independent S0 verifies valid/missing/conflicting facts. Live trace and Recorder retain safe protocol fields; API-key values never retained.

Framework fact: existing Playwright route interception locally fulfills browser-generated CORS preflights. We do not implement an OPTIONS client or inject headers. The fixture asserts actual CDP initiator and independent GET receiver arrivals, not a fictitious upstream OPTIONS response. A captured handshake without faithful HAR transport remains NOT_REPLAYABLE.

Remaining sequence: five offline gates, one common transport commit before P2-1a, actual unguarded/guarded source check, witness recertification, fresh frozen ten-probe baseline, push and stop for review. No checkpoint A/full Live.

Final CORS offline gates: typecheck/arch/build PASS, npm test936/936, real local Chromium115/115 (222.114s), gates/cors/results.json. These are L0/L1 only; real current-site proof is the next step.


### Actual source comparison and XHR follow-up

At committed344bea7, unguarded-cors-approved navigated in2997ms and guarded-cors-approved in2309ms; both parsed20 outlets, with actual /search/ GET200. The guarded map-search handshake was still labeled xhr and rejected; this remaining false refusal is explicitly retained in diagnostic/cors/real-xhr-red.json. The browser-generated initiator/header/body/GET checks remain mandatory; preflight classification now accepts Chromium Other/Fetch/XHR without admitting other requests. The local XHR characterization still labeled its preflight Other; it is not claimed as a red reproduction. Independent S0 XHR counterexample is xhr-s0-red.log.

Final shared-code gates are gates/cors-final. The first default suite there crashed inside Node24.4.1/V8's PGlite test (native Check failed: end > addr), unrelated to an assertion in this change; original log retained, cause unproven. A serial full-suite rerun follows completed browser gates. No product/test bypass or runtime upgrade was made.

Final shared-code gates after type correction: typecheck/arch/build PASS, serial full npm test936/936, full local Chromium115/115 (222.451s). Native V8 crash and the subsequent full green run are separate logs.


### Protocol proof correction before the final freeze

The XHR type alone was not the remaining cause: guarded-final still had one missing Network marker. The independent Network observer in guarded-classification saw all four actual browser preflights, and the paused request had Origin, Access-Control-Request-Method GET, Access-Control-Request-Headers x-api-key, and zero body. Thus the extra Network-id/initiator lookup was a false-refusal dependency, not evidence of a script-originated OPTIONS.

Final admission uses the actual Chromium Fetch-paused request's browser-reserved Origin/Access-Control-Request-* plus Sec-Fetch-Mode cors, the exact frozen GET origin/path/query/header rules and empty body. Page JavaScript cannot set those browser-reserved headers; no code issues OPTIONS or injects API keys. Raw Network initiator timing is not authority. A real local Chromium counterexample with only the Guard's Network diagnostic stream absent is red (missing-marker-red.log), then green with an independent CDP preflight observer and real GET receiver (missing-marker-green.log). All prohibited modes remain denied, including an attempted manual OPTIONS with forged reserved headers. S0 independently requires the new protocol facts; missing facts remain NOT_EVALUATED.

Previous statements that the first XHR-label correction completed the map handshake are superseded by this section. The initial20-outlet list result remains true; final source/verification rows will follow below.

Final reserved-header implementation: all five gates PASS in gates/protocol-final/; full npm test936/936 and full real local Chromium115/115 (222.056s). Missing-marker real Chromium red/green and all forbidden modes passed. No production or test bypass.
