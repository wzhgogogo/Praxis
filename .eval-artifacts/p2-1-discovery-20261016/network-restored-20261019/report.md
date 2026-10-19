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

Actual final source comparison PASS: unguarded20 outlets/goto2997ms, guarded20 outlets/goto3782ms; guarded four search GET200 and four browser-generated GET-bound preflights admitted, including the XHR form. Independent frozen S0 boundary audit ABSENT; source bodies/metadata hashes in diagnostic/network-verification.json. This is zero-model connectivity evidence only, not witness qualification or a formal discovery probe.

## Fresh witnesses and formal baseline preparation

Witness recertification completed with32 public GETs,0 model/Google calls. All16 original registrations retained;13 certified, with at least one in each of six cases (2/2,2/3,1/2,3/3,3/3,2/3). verification.json independently binds raw SHA, authoritative date/party and requested slot link merchant/date/party/time without opening links. Each case has a24-hour validity recorded in witnesses.certified.json. New outputs never overwrite the original certification.

All six offline Runner plans parse unchanged inputs with0 network/model/Live. The current outer review configuration and fresh baseline plan/source/witnesses are frozen in baseline-freeze.json; the old preparation and original baseline freezes are historical. The mutable new ledger is intentionally untracked until execution ends, so all formal probes can run at one clean frozen HEAD. No checkpoint A or full Live.


## Restored-network baseline progress (partial; ENV blocked)

Frozen baseline: `acfaaffa73db97413f6538f161c4e837ec64316e`; rebased P2-1a: `39fc15e` (direct parent is the common baseline). The P2-1a added/deleted source patch equals the original3094193 patch; proof: gates/rebased-final/source-delta.json. Final combined gates PASS: typecheck/arch/build,940/940 default,116/116 real local Chromium. No checkpoint A or full Live.

Planned10; formal-started/completed/scorable-for-discovery3; preflight-only ENV1 (excluded from formal count); remaining7 not started. No source/runtime/config edits occurred during these attempts.

| Case / repeat | Source preflight | Tabelog / TableCheck / Google witness in listing | Witness first batch | In-radius parsed (lower bound) | Formal ms | Models / decision rows | Google formal + preflight | Boundary |
|---|---|---|---|---:|---:|---|---|---|
| p2-kf-h001-20261027 #1 | READY | false / false / true | false | 39 | 42541 | 1 / 1 | 2 + 1 | ABSENT |
| p2-kf-h001-20261027 #2 | READY | false / false / true | false | 39 | 44102 | 1 / 1 | 2 + 1 | ABSENT |
| p2-kagurazaka-kaiseki-20261029 #1 | READY | false / false / false | false | 45 | 93505 | 11 / 11 | 2 + 1 | ABSENT |
| p2-kagurazaka-kaiseki-20261029 #2 | ENV_FAILURE (TableCheck count0) | — | — | — | NOT_STARTED | 0 / no stream | 0 + 1 | NOT_EVALUATED |

The failed preflight observed TableCheck count0/EMPTY_RESULT after26031ms; Tabelog20 and Google1 were nonempty. It did not save an API HTTP status or full request-level Guard trace, so this observation does not identify VPN, server, Guard or parser as its cause. No model, formal-probe or Live count charged for that attempt.

Google credit above is only an exact source ID parsed from googleWebsiteUri, per the approved metric; no name-only credit. Both h001 runs still lack registered witnesses in native listing metrics, so no changed-native-bottleneck stop was triggered. In-radius parsed counts are raw discovery metrics, include Google, and are not qualified deliveries or necessarily deduped real-world businesses.

### Per-run retrieval facts and raw outputs

- **p2-kf-h001-20261027 #1**: [summary](baseline/p2-kf-h001-20261027/attempt-1/probe-summary.json), [decisions](baseline/p2-kf-h001-20261027/attempt-1/probe.decisions.jsonl), [trace](baseline/p2-kf-h001-20261027/attempt-1/trace.jsonl), [recording](baseline/p2-kf-h001-20261027/attempt-1/recording/p2-kf-h001-20261027/recording.json), [source preflight](baseline/p2-kf-h001-20261027/attempt-1/source-data-preflight.json). Termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`; failure codes `[]`.
  - tabelog: KEYWORD, term `omakase`, category `None`, parsed `20` / displayed `36`, `OBSERVED_LISTING`, `PLANNER_AND_OBSERVED_REGION_AGENT`; URL `https://tabelog.com/en/tokyo/rstLst/?sw=omakase`.
  - tabelog: KEYWORD, term `omakase`, category `None`, parsed `3` / displayed `3`, `OBSERVED_LISTING`, `BROWSER_AGENT_OR_SOURCE_PAGINATION`; URL `https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase`.
  - tabelog: KEYWORD, term `omakase`, category `None`, parsed `3` / displayed `3`, `OBSERVED_LISTING`, `BROWSER_AGENT_OR_SOURCE_PAGINATION`; URL `https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase`.
  - tablecheck: KEYWORD, term `omakase`, category `None`, parsed `None` / displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`, `PLANNER_AND_OBSERVED_REGION_AGENT`; URL `https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase`.
  - google-places: KEYWORD, term `omakase`, category `None`, parsed `None` / displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`, `PLANNER_AND_OBSERVED_REGION_AGENT`; URL `google-places:text-search`.
- **p2-kf-h001-20261027 #2**: [summary](baseline/p2-kf-h001-20261027/attempt-2/probe-summary.json), [decisions](baseline/p2-kf-h001-20261027/attempt-2/probe.decisions.jsonl), [trace](baseline/p2-kf-h001-20261027/attempt-2/trace.jsonl), [recording](baseline/p2-kf-h001-20261027/attempt-2/recording/p2-kf-h001-20261027/recording.json), [source preflight](baseline/p2-kf-h001-20261027/attempt-2/source-data-preflight.json). Termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`; failure codes `[]`.
  - tabelog: KEYWORD, term `omakase`, category `None`, parsed `20` / displayed `36`, `OBSERVED_LISTING`, `PLANNER_AND_OBSERVED_REGION_AGENT`; URL `https://tabelog.com/en/tokyo/rstLst/?sw=omakase`.
  - tabelog: KEYWORD, term `omakase`, category `None`, parsed `3` / displayed `3`, `OBSERVED_LISTING`, `BROWSER_AGENT_OR_SOURCE_PAGINATION`; URL `https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase`.
  - tabelog: KEYWORD, term `omakase`, category `None`, parsed `3` / displayed `3`, `OBSERVED_LISTING`, `BROWSER_AGENT_OR_SOURCE_PAGINATION`; URL `https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase`.
  - tablecheck: KEYWORD, term `omakase`, category `None`, parsed `None` / displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`, `PLANNER_AND_OBSERVED_REGION_AGENT`; URL `https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase`.
  - google-places: KEYWORD, term `omakase`, category `None`, parsed `None` / displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`, `PLANNER_AND_OBSERVED_REGION_AGENT`; URL `google-places:text-search`.
- **p2-kagurazaka-kaiseki-20261029 #1**: [summary](baseline/p2-kagurazaka-kaiseki-20261029/attempt-1/probe-summary.json), [decisions](baseline/p2-kagurazaka-kaiseki-20261029/attempt-1/probe.decisions.jsonl), [trace](baseline/p2-kagurazaka-kaiseki-20261029/attempt-1/trace.jsonl), [recording](baseline/p2-kagurazaka-kaiseki-20261029/attempt-1/recording/p2-kagurazaka-kaiseki-20261029/recording.json), [source preflight](baseline/p2-kagurazaka-kaiseki-20261029/attempt-1/source-data-preflight.json). Termination `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED`; failure codes `["EXTRACTION_FAILED"]`.
  - tabelog: KEYWORD, term `kaiseki restaurant`, category `None`, parsed `0` / displayed `None`, `OBSERVED_LISTING`, `PLANNER_AND_OBSERVED_REGION_AGENT`; URL `https://tabelog.com/en/tokyo/rstLst/?sw=kaiseki+restaurant`.
  - tabelog: KEYWORD, term `kaiseki restaurant`, category `None`, parsed `0` / displayed `None`, `OBSERVED_LISTING`, `BROWSER_AGENT_OR_SOURCE_PAGINATION`; URL `https://tabelog.com/en/tokyo/C13104/rstLst/?sw=kaiseki%20restaurant`.
  - tabelog: KEYWORD, term `kaiseki restaurant`, category `None`, parsed `20` / displayed `10367`, `OBSERVED_LISTING`, `BROWSER_AGENT_OR_SOURCE_PAGINATION`; URL `https://tabelog.com/en/tokyo/C13104/rstLst/`.
  - tablecheck: KEYWORD, term `kaiseki restaurant`, category `None`, parsed `None` / displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`, `PLANNER_AND_OBSERVED_REGION_AGENT`; URL `https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.701459799999995&geo_longitude=139.7402946&geo_distance=1km&auto_geolocate=false&search_text=kaiseki+restaurant`.
  - google-places: KEYWORD, term `kaiseki restaurant`, category `None`, parsed `None` / displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`, `PLANNER_AND_OBSERVED_REGION_AGENT`; URL `google-places:text-search`.

Raw ENV evidence: [source check](baseline/p2-kagurazaka-kaiseki-20261029/attempt-2/source-data-preflight.json), [failure](baseline/p2-kagurazaka-kaiseki-20261029/attempt-2/preflight-failure.json), [outer log](baseline/p2-kagurazaka-kaiseki-20261029/attempt-2.outer.log). Current mutable ledger: baseline-ledger.json; pre-recovery snapshot: recovery/baseline-ledger.before-recovery.json.

### Four-layer evaluation scope

1. End-to-end goal: NOT_EVALUATED / not applicable to discovery-only probes;0 availability investigations and0 deliveries by design, not HONEST_NO_RESULT/CAPABILITY_MISS conclusions.
2. Stages: request is frozen actual semantics (not reinterpreted), fixed named-place centers and1km radius; discovery witness/listing/first-detail metrics retained per source. Raw source funnel counts and retrieval observations may have different binding scopes (e.g. TableCheck funnel parses20 while the retrieval observer marks an uncompleted/unbound listing); unknown observation is not promoted to a complete listing. Identity/HARD/inventory/Agent-decision Gold pass are not inferred from runtime reason codes.
3. Severity: independent frozen-rule S0_BOUNDARY ABSENT for each of the3 completed traces. S0 declaration andS1–S4 are NOT_EVALUATED for this limited probe; no full user claim or delivery. Unknown GET side effects remain outside what the network-shape audit proves.
4. Attribution: only the preflight failure stage/count is observed; underlying cause unconfirmed. Other potential bottlenecks are HYPOTHESIS pending independent review; no attribution-driven fix made.

### Budget and pending outer-only proposal

New model calls13 (all captured successful), cumulative99/450. Google: new formal6 plus4 readiness requests; cumulative25 including historical15. Formal probes: cumulative13/40 (historical10 + current3);0 full Live. Witness certification32 GETs and zero-model transport checks are separate from formal probe counts.

The frozen original outer script stops on ENV and refuses any second attempt for the same planned index. To finish the7 unstarted formal probes, a reviewable, offline-checked proposal is in recovery/outer-env-resume.proposed.patch; DRAFT / NOT INTEGRATED / NOT EXECUTED. It only allows one preflight-only retry per item with0 models and no formal start; S0, started model/formal attempt and completed-case retries remain refused. Awaiting explicit user approval to re-freeze outer orchestration (Eval Skill5.2); no runtime ledger reset or bypass performed.



## User-approved preflight-only outer recovery

User explicitly replied “批准外层补丁并续跑”. The external main-worktree controller recovery/resume-baseline.py is separately committed/frozen and runs with cwd in the unchanged clean acfaaffa worktree. It preserves every failed attempt and allows exactly one preflight-only retry per planned item, refusing S0/started-model/completed-formal attempts. The original controller, source/inputs, plan, witnesses and15-model/180s settings are unchanged. New output suffix -preflight-2 prevents overwriting original preflight files; the ledger records stopHistory. SHA/approval/parent-freeze checks and offline state predicates PASS,0 network/model. Current3 formal results remain untouched; continue index3 then remaining planned entries.
