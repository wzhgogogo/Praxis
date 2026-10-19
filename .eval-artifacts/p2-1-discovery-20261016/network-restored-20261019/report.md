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
