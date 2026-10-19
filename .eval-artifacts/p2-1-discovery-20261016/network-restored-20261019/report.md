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


## Completed restored-network baseline (2026-10-19)

Status: **current baseline / exposed development evidence, not Clean Baseline**. All10 planned formal discovery probes completed at clean `acfaaffa73db97413f6538f161c4e837ec64316e`, with the same six input hashes and original plan. The approved outer recovery was committed before use in `1b610a8`; only index3 had a preflight-only retry. Original failed files and all completed formal results remain byte-identical;0 formal retries,0 checkpoint A,0 full Live. [Audit](baseline-audit.json), [ledger](baseline-ledger.json), [outer freeze](recovery/outer-resume-freeze.json), [approval](recovery/approval.json).

The P2-1a source commit is `39fc15e`, directly above common baseline `acfaaffa`. Source-delta evidence in [gates/rebased-final/source-delta.json](gates/rebased-final/source-delta.json) confirms the same added/deleted production/eval patch as original `3094193`, after the shared GET/CORS fix and certified-input freeze. The baseline and P2-1a differ by P2-1a source only; this result does not measure P2-1a.

### All10 formal probes

| Case / repeat | Role | Tabelog / TableCheck / Google witness listing | First detail batch | inRadiusParsed* | Pages | Formal ms | Models = rows | Google formal + preflight | Failure codes |
|---|---|---|---|---:|---:|---:|---:|---|---|
| p2-kf-h001-20261027 #1 | TARGET | false / false / true | false | 39 | 5 | 42541 | 1 | 2 + 1 | none |
| p2-kf-h001-20261027 #2 | TARGET | false / false / true | false | 39 | 5 | 44102 | 1 | 2 + 1 | none |
| p2-kagurazaka-kaiseki-20261029 #1 | TARGET | false / false / false | false | 45 | 6 | 93505 | 11 | 2 + 1 | EXTRACTION_FAILED |
| p2-kagurazaka-kaiseki-20261029 #2 | TARGET | false / false / false | false | 45 | 6 | 103353 | 12 | 2 + 1 | EXTRACTION_FAILED |
| p2-kf-h005-20261029 #1 | TARGET | false / false / false | false | 45 | 4 | 51088 | 3 | 2 + 1 | DISCOVERY_SOURCE_LOCATION_UNGROUNDED |
| p2-kf-h005-20261029 #2 | TARGET | false / false / false | false | 45 | 4 | 47689 | 3 | 2 + 1 | DISCOVERY_SOURCE_LOCATION_UNGROUNDED |
| p2-kichijoji-tempura-20261027 #1 | TARGET | false / false / true | false | 50 | 9 | 108903 | 6 | 2 + 1 | none |
| p2-kichijoji-tempura-20261027 #2 | TARGET | false / false / true | false | 50 | 9 | 100411 | 6 | 2 + 1 | none |
| p2-kf-h002-20261031 #1 | CONTROL | true / false / false | false | 30 | 6 | 88656 | 3 | 1 + 1 | none |
| p2-nakameguro-yakiniku-20261030 #1 | CONTROL | false / false / true | false | 39 | 10 | 108105 | 9 | 2 + 1 | AGENT_EXECUTION_FAILED |

All10 formal runs had READY source checks, `ALL_PLANNED_FIRST_BATCHES_ATTEMPTED` termination and independent frozen-rule S0_BOUNDARY `ABSENT`. READY requires a nonempty actual TableCheck search API response; catalog metadata or an empty page shell is insufficient. Each stayed below15 models/180000ms/40 Google requests. Elapsed time above is formal Runner time, excluding source preflight and outer overhead. Median formal time: 91080.5ms.

*`inRadiusParsed` is the frozen Runner field, including Google coordinate candidates and no guaranteed cross-source business deduplication. It is not a count of qualified restaurants, verified inventory or identity-complete native details. The original `inRadiusParsedIsLowerBound` marker is preserved; no unique-business lower-bound claim is inferred from that marker. `pages` is likewise the unmodified total Runner metric; source page counts are in the audit and per-source sections below.

Native witness listing: Tabelog1/10 (H002 CONTROL), TableCheck0/10; Google exact website-source-ID matches5/10 (both H001, both Kichijoji, Nakameguro). First detail batch witness0/10. All8 TARGET probes have no certified native-source witness in listing. Name-only matches receive0 credit; raw name-only hints and exact website matches are preserved in the audit. No changed-native-bottleneck stop occurred.

### Preflight-only ENV and approved continuation

The original index3 preflight failed at2026-10-19T03:28:51.230775Z: TableCheck `EMPTY_RESULT`, count0 after26031ms; Tabelog20 and Google1 were nonempty. Formal start=false, models0. No API HTTP status or full request-level Guard trace was saved for that preflight, so underlying cause remains unconfirmed. It is excluded from the10 formal probes but its1 Google readiness request is included in usage. The human-approved retry began03:39:07.511841Z and passed (TableCheck nonempty), then completed exactly one formal probe. All other items have one attempt. See preserved [first source check](baseline/p2-kagurazaka-kaiseki-20261029/attempt-2/source-data-preflight.json), [failure](baseline/p2-kagurazaka-kaiseki-20261029/attempt-2/preflight-failure.json), and [retry](baseline/p2-kagurazaka-kaiseki-20261029/attempt-2-preflight-2/source-data-preflight.json). `stopHistory` retains the ENV stop and its explicit approved resolution; no S0/formal/started-model stop was cleared.

### Per-run source observations and artifacts

- **p2-kf-h001-20261027 #1**: [summary](baseline/p2-kf-h001-20261027/attempt-1/probe-summary.json), [decisions](baseline/p2-kf-h001-20261027/attempt-1/probe.decisions.jsonl), [trace](baseline/p2-kf-h001-20261027/attempt-1/trace.jsonl), [recording](baseline/p2-kf-h001-20261027/attempt-1/recording/p2-kf-h001-20261027/recording.json), [source preflight](baseline/p2-kf-h001-20261027/attempt-1/source-data-preflight.json). Recording: `NOT_REPLAYABLE/UNCAPTURED_DYNAMIC_RESPONSE`.
  - Source funnel (parsed / detail attempts / accepted / pages / elapsed ms): tabelog 3 / 3 / 1 / 2 / 22328; tablecheck 20 / 5 / 5 / 1 / 18142; google-places NOT_RECORDED_FUNNEL (candidates 33).
  - tabelog: KEYWORD; term `omakase`, category `None`; parsed `20`, displayed `36`, `OBSERVED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `https://tabelog.com/en/tokyo/rstLst/?sw=omakase`.
  - tabelog: KEYWORD; term `omakase`, category `None`; parsed `3`, displayed `3`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase`.
  - tabelog: KEYWORD; term `omakase`, category `None`; parsed `3`, displayed `3`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase`.
  - tablecheck: KEYWORD; term `omakase`, category `None`; parsed `None`, displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase`.
  - google-places: KEYWORD; term `omakase`, category `None`; parsed `None`, displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `google-places:text-search`.
  - Exact Google website witnesses: tabelog:en/tokyo/A1303/A130301/13261619 <- `https://tabelog.com/tokyo/A1303/A130301/13261619/?utm_source=google&utm_medium=google_map&utm_campaign=tech_18`. Name-only hints: 37 (not credited).
- **p2-kf-h001-20261027 #2**: [summary](baseline/p2-kf-h001-20261027/attempt-2/probe-summary.json), [decisions](baseline/p2-kf-h001-20261027/attempt-2/probe.decisions.jsonl), [trace](baseline/p2-kf-h001-20261027/attempt-2/trace.jsonl), [recording](baseline/p2-kf-h001-20261027/attempt-2/recording/p2-kf-h001-20261027/recording.json), [source preflight](baseline/p2-kf-h001-20261027/attempt-2/source-data-preflight.json). Recording: `NOT_REPLAYABLE/UNCAPTURED_DYNAMIC_RESPONSE`.
  - Source funnel (parsed / detail attempts / accepted / pages / elapsed ms): tabelog 3 / 3 / 1 / 2 / 23331; tablecheck 20 / 5 / 5 / 1 / 18975; google-places NOT_RECORDED_FUNNEL (candidates 33).
  - tabelog: KEYWORD; term `omakase`, category `None`; parsed `20`, displayed `36`, `OBSERVED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `https://tabelog.com/en/tokyo/rstLst/?sw=omakase`.
  - tabelog: KEYWORD; term `omakase`, category `None`; parsed `3`, displayed `3`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase`.
  - tabelog: KEYWORD; term `omakase`, category `None`; parsed `3`, displayed `3`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase`.
  - tablecheck: KEYWORD; term `omakase`, category `None`; parsed `None`, displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6619707&geo_longitude=139.70379499999999&geo_distance=1km&auto_geolocate=false&search_text=omakase`.
  - google-places: KEYWORD; term `omakase`, category `None`; parsed `None`, displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `google-places:text-search`.
  - Exact Google website witnesses: tabelog:en/tokyo/A1303/A130301/13261619 <- `https://tabelog.com/tokyo/A1303/A130301/13261619/?utm_source=google&utm_medium=google_map&utm_campaign=tech_18`. Name-only hints: 37 (not credited).
- **p2-kagurazaka-kaiseki-20261029 #1**: [summary](baseline/p2-kagurazaka-kaiseki-20261029/attempt-1/probe-summary.json), [decisions](baseline/p2-kagurazaka-kaiseki-20261029/attempt-1/probe.decisions.jsonl), [trace](baseline/p2-kagurazaka-kaiseki-20261029/attempt-1/trace.jsonl), [recording](baseline/p2-kagurazaka-kaiseki-20261029/attempt-1/recording/p2-kagurazaka-kaiseki-20261029/recording.json), [source preflight](baseline/p2-kagurazaka-kaiseki-20261029/attempt-1/source-data-preflight.json). Recording: `NOT_REPLAYABLE/UNSAFE_DOCUMENT`.
  - Source funnel (parsed / detail attempts / accepted / pages / elapsed ms): tabelog 0 / 0 / 0 / 3 / 70205; tablecheck 20 / 5 / 5 / 1 / 21393; google-places NOT_RECORDED_FUNNEL (candidates 40).
  - tabelog: KEYWORD; term `kaiseki restaurant`, category `None`; parsed `0`, displayed `None`, `OBSERVED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `https://tabelog.com/en/tokyo/rstLst/?sw=kaiseki+restaurant`.
  - tabelog: KEYWORD; term `kaiseki restaurant`, category `None`; parsed `0`, displayed `None`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/C13104/rstLst/?sw=kaiseki%20restaurant`.
  - tabelog: KEYWORD; term `kaiseki restaurant`, category `None`; parsed `20`, displayed `10367`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/C13104/rstLst/`.
  - tablecheck: KEYWORD; term `kaiseki restaurant`, category `None`; parsed `None`, displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.701459799999995&geo_longitude=139.7402946&geo_distance=1km&auto_geolocate=false&search_text=kaiseki+restaurant`.
  - google-places: KEYWORD; term `kaiseki restaurant`, category `None`; parsed `None`, displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `google-places:text-search`.
  - Exact Google website witnesses: none. Name-only hints: 10 (not credited).
- **p2-kagurazaka-kaiseki-20261029 #2**: [summary](baseline/p2-kagurazaka-kaiseki-20261029/attempt-2-preflight-2/probe-summary.json), [decisions](baseline/p2-kagurazaka-kaiseki-20261029/attempt-2-preflight-2/probe.decisions.jsonl), [trace](baseline/p2-kagurazaka-kaiseki-20261029/attempt-2-preflight-2/trace.jsonl), [recording](baseline/p2-kagurazaka-kaiseki-20261029/attempt-2-preflight-2/recording/p2-kagurazaka-kaiseki-20261029/recording.json), [source preflight](baseline/p2-kagurazaka-kaiseki-20261029/attempt-2-preflight-2/source-data-preflight.json). Recording: `NOT_REPLAYABLE/UNSAFE_DOCUMENT`.
  - Source funnel (parsed / detail attempts / accepted / pages / elapsed ms): tabelog 0 / 0 / 0 / 3 / 76617; tablecheck 20 / 5 / 5 / 1 / 24759; google-places NOT_RECORDED_FUNNEL (candidates 40).
  - tabelog: KEYWORD; term `kaiseki restaurant`, category `None`; parsed `0`, displayed `None`, `OBSERVED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `https://tabelog.com/en/tokyo/rstLst/?sw=kaiseki+restaurant`.
  - tabelog: KEYWORD; term `kaiseki restaurant`, category `None`; parsed `0`, displayed `None`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/C13104/rstLst/?sw=kaiseki%20restaurant`.
  - tabelog: KEYWORD; term `kaiseki restaurant`, category `None`; parsed `20`, displayed `10367`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/C13104/rstLst/`.
  - tablecheck: KEYWORD; term `kaiseki restaurant`, category `None`; parsed `None`, displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.701459799999995&geo_longitude=139.7402946&geo_distance=1km&auto_geolocate=false&search_text=kaiseki+restaurant`.
  - google-places: KEYWORD; term `kaiseki restaurant`, category `None`; parsed `None`, displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `google-places:text-search`.
  - Exact Google website witnesses: none. Name-only hints: 10 (not credited).
- **p2-kf-h005-20261029 #1**: [summary](baseline/p2-kf-h005-20261029/attempt-1/probe-summary.json), [decisions](baseline/p2-kf-h005-20261029/attempt-1/probe.decisions.jsonl), [trace](baseline/p2-kf-h005-20261029/attempt-1/trace.jsonl), [recording](baseline/p2-kf-h005-20261029/attempt-1/recording/p2-kf-h005-20261029/recording.json), [source preflight](baseline/p2-kf-h005-20261029/attempt-1/source-data-preflight.json). Recording: `NOT_REPLAYABLE/UNCAPTURED_DYNAMIC_RESPONSE`.
  - Source funnel (parsed / detail attempts / accepted / pages / elapsed ms): tabelog 0 / 0 / 0 / 1 / 17954; tablecheck 20 / 5 / 5 / 1 / 31039; google-places NOT_RECORDED_FUNNEL (candidates 40).
  - tabelog: KEYWORD; term `local food`, category `None`; parsed `2`, displayed `2`, `OBSERVED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `https://tabelog.com/en/tokyo/rstLst/?sw=local+food`.
  - tablecheck: KEYWORD; term `local food`, category `None`; parsed `None`, displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6697&geo_longitude=139.767&geo_distance=1km&auto_geolocate=false&search_text=local+food`.
  - google-places: KEYWORD; term `local food`, category `None`; parsed `None`, displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `google-places:text-search`.
  - Exact Google website witnesses: none. Name-only hints: 7 (not credited).
- **p2-kf-h005-20261029 #2**: [summary](baseline/p2-kf-h005-20261029/attempt-2/probe-summary.json), [decisions](baseline/p2-kf-h005-20261029/attempt-2/probe.decisions.jsonl), [trace](baseline/p2-kf-h005-20261029/attempt-2/trace.jsonl), [recording](baseline/p2-kf-h005-20261029/attempt-2/recording/p2-kf-h005-20261029/recording.json), [source preflight](baseline/p2-kf-h005-20261029/attempt-2/source-data-preflight.json). Recording: `NOT_REPLAYABLE/UNCAPTURED_DYNAMIC_RESPONSE`.
  - Source funnel (parsed / detail attempts / accepted / pages / elapsed ms): tabelog 0 / 0 / 0 / 1 / 23621; tablecheck 20 / 5 / 5 / 1 / 22099; google-places NOT_RECORDED_FUNNEL (candidates 40).
  - tabelog: KEYWORD; term `local food`, category `None`; parsed `2`, displayed `2`, `OBSERVED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `https://tabelog.com/en/tokyo/rstLst/?sw=local+food`.
  - tablecheck: KEYWORD; term `local food`, category `None`; parsed `None`, displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.6697&geo_longitude=139.767&geo_distance=1km&auto_geolocate=false&search_text=local+food`.
  - google-places: KEYWORD; term `local food`, category `None`; parsed `None`, displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `google-places:text-search`.
  - Exact Google website witnesses: none. Name-only hints: 7 (not credited).
- **p2-kichijoji-tempura-20261027 #1**: [summary](baseline/p2-kichijoji-tempura-20261027/attempt-1/probe-summary.json), [decisions](baseline/p2-kichijoji-tempura-20261027/attempt-1/probe.decisions.jsonl), [trace](baseline/p2-kichijoji-tempura-20261027/attempt-1/trace.jsonl), [recording](baseline/p2-kichijoji-tempura-20261027/attempt-1/recording/p2-kichijoji-tempura-20261027/recording.json), [source preflight](baseline/p2-kichijoji-tempura-20261027/attempt-1/source-data-preflight.json). Recording: `NOT_REPLAYABLE/UNSAFE_DOCUMENT`.
  - Source funnel (parsed / detail attempts / accepted / pages / elapsed ms): tabelog 20 / 5 / 5 / 6 / 77904; tablecheck 20 / 5 / 5 / 1 / 28499; google-places NOT_RECORDED_FUNNEL (candidates 40).
  - tabelog: KEYWORD; term `tempura restaurant`, category `None`; parsed `0`, displayed `None`, `OBSERVED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `https://tabelog.com/en/tokyo/rstLst/?sw=tempura+restaurant`.
  - tabelog: KEYWORD; term `tempura restaurant`, category `None`; parsed `0`, displayed `42`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/rstLst/?sw=tempura+restaurant`.
  - tabelog: KEYWORD; term `restaurant`, category `None`; parsed `0`, displayed `3`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/rstLst/tempura/?sw=restaurant`.
  - tabelog: KEYWORD; term `restaurant`, category `English`; parsed `1`, displayed `1`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/A1328/rstLst/tempura/?sw=restaurant`.
  - tabelog: KEYWORD; term `tempura restaurant`, category `None`; parsed `0`, displayed `139480`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/`.
  - tabelog: KEYWORD; term `tempura restaurant`, category `None`; parsed `20`, displayed `2819`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/A1320/`.
  - tabelog: KEYWORD; term `tempura restaurant`, category `None`; parsed `20`, displayed `2819`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/A1320/`.
  - tablecheck: KEYWORD; term `tempura restaurant`, category `None`; parsed `None`, displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.704096&geo_longitude=139.58020539999998&geo_distance=1km&auto_geolocate=false&search_text=tempura+restaurant`.
  - google-places: KEYWORD; term `tempura restaurant`, category `None`; parsed `None`, displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `google-places:text-search`.
  - Exact Google website witnesses: tabelog:en/tokyo/A1320/A132001/13282321 <- `https://tabelog.com/tokyo/A1320/A132001/13282321/`. Name-only hints: 7 (not credited).
- **p2-kichijoji-tempura-20261027 #2**: [summary](baseline/p2-kichijoji-tempura-20261027/attempt-2/probe-summary.json), [decisions](baseline/p2-kichijoji-tempura-20261027/attempt-2/probe.decisions.jsonl), [trace](baseline/p2-kichijoji-tempura-20261027/attempt-2/trace.jsonl), [recording](baseline/p2-kichijoji-tempura-20261027/attempt-2/recording/p2-kichijoji-tempura-20261027/recording.json), [source preflight](baseline/p2-kichijoji-tempura-20261027/attempt-2/source-data-preflight.json). Recording: `NOT_REPLAYABLE/UNSAFE_DOCUMENT`.
  - Source funnel (parsed / detail attempts / accepted / pages / elapsed ms): tabelog 20 / 5 / 5 / 6 / 68688; tablecheck 20 / 5 / 5 / 1 / 29804; google-places NOT_RECORDED_FUNNEL (candidates 40).
  - tabelog: KEYWORD; term `tempura restaurant`, category `None`; parsed `0`, displayed `None`, `OBSERVED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `https://tabelog.com/en/tokyo/rstLst/?sw=tempura+restaurant`.
  - tabelog: KEYWORD; term `tempura restaurant`, category `None`; parsed `0`, displayed `42`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/rstLst/?sw=tempura+restaurant`.
  - tabelog: KEYWORD; term `restaurant`, category `None`; parsed `0`, displayed `3`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/rstLst/tempura/?sw=restaurant`.
  - tabelog: KEYWORD; term `restaurant`, category `English`; parsed `1`, displayed `1`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/A1328/rstLst/tempura/?sw=restaurant`.
  - tabelog: KEYWORD; term `tempura restaurant`, category `None`; parsed `0`, displayed `139480`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/`.
  - tabelog: KEYWORD; term `tempura restaurant`, category `None`; parsed `20`, displayed `2819`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/A1320/`.
  - tabelog: KEYWORD; term `tempura restaurant`, category `None`; parsed `20`, displayed `2819`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/A1320/`.
  - tablecheck: KEYWORD; term `tempura restaurant`, category `None`; parsed `None`, displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.704096&geo_longitude=139.58020539999998&geo_distance=1km&auto_geolocate=false&search_text=tempura+restaurant`.
  - google-places: KEYWORD; term `tempura restaurant`, category `None`; parsed `None`, displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `google-places:text-search`.
  - Exact Google website witnesses: tabelog:en/tokyo/A1320/A132001/13282321 <- `https://tabelog.com/tokyo/A1320/A132001/13282321/`. Name-only hints: 7 (not credited).
- **p2-kf-h002-20261031 #1**: [summary](baseline/p2-kf-h002-20261031/attempt-1/probe-summary.json), [decisions](baseline/p2-kf-h002-20261031/attempt-1/probe.decisions.jsonl), [trace](baseline/p2-kf-h002-20261031/attempt-1/trace.jsonl), [recording](baseline/p2-kf-h002-20261031/attempt-1/recording/p2-kf-h002-20261031/recording.json), [source preflight](baseline/p2-kf-h002-20261031/attempt-1/source-data-preflight.json). Recording: `NOT_REPLAYABLE/UNSAFE_DOCUMENT`.
  - Source funnel (parsed / detail attempts / accepted / pages / elapsed ms): tabelog 20 / 5 / 5 / 4 / 60347; tablecheck 20 / 5 / 5 / 1 / 27068; google-places NOT_RECORDED_FUNNEL (candidates 20).
  - tabelog: CATEGORY_OR_GENERAL_LIST; term `None`, category `None`; parsed `20`, displayed `139480`, `OBSERVED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `https://tabelog.com/en/tokyo/`.
  - tabelog: CATEGORY_OR_GENERAL_LIST; term `None`, category `None`; parsed `20`, displayed `6252`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/A1301/`.
  - tabelog: CATEGORY_OR_GENERAL_LIST; term `None`, category `None`; parsed `20`, displayed `2658`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/A1301/A130101/`.
  - tabelog: CATEGORY_OR_GENERAL_LIST; term `None`, category `None`; parsed `20`, displayed `5034`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/`.
  - tabelog: CATEGORY_OR_GENERAL_LIST; term `None`, category `None`; parsed `20`, displayed `5034`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/A1301/A130101/R8188/rstLst/`.
  - tablecheck: CATEGORY_OR_GENERAL_LIST; term `None`, category `None`; parsed `None`, displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.669700299999995&geo_longitude=139.7671399&geo_distance=1km&auto_geolocate=false`.
  - google-places: CATEGORY_OR_GENERAL_LIST; term `None`, category `None`; parsed `None`, displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `google-places:nearby-search`.
  - Exact Google website witnesses: none. Name-only hints: 17 (not credited).
- **p2-nakameguro-yakiniku-20261030 #1**: [summary](baseline/p2-nakameguro-yakiniku-20261030/attempt-1/probe-summary.json), [decisions](baseline/p2-nakameguro-yakiniku-20261030/attempt-1/probe.decisions.jsonl), [trace](baseline/p2-nakameguro-yakiniku-20261030/attempt-1/trace.jsonl), [recording](baseline/p2-nakameguro-yakiniku-20261030/attempt-1/recording/p2-nakameguro-yakiniku-20261030/recording.json), [source preflight](baseline/p2-nakameguro-yakiniku-20261030/attempt-1/source-data-preflight.json). Recording: `NOT_REPLAYABLE/UNSAFE_DOCUMENT`.
  - Source funnel (parsed / detail attempts / accepted / pages / elapsed ms): tabelog 0 / 0 / 0 / 7 / 73984; tablecheck 20 / 5 / 5 / 1 / 32104; google-places NOT_RECORDED_FUNNEL (candidates 34).
  - tabelog: KEYWORD; term `yakiniku`, category `None`; parsed `20`, displayed `2870`, `OBSERVED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `https://tabelog.com/en/tokyo/rstLst/?sw=yakiniku`.
  - tabelog: KEYWORD; term `yakiniku`, category `None`; parsed `20`, displayed `51`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/A1316/rstLst/?sw=yakiniku`.
  - tabelog: KEYWORD; term `yakiniku`, category `None`; parsed `15`, displayed `15`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/A1316/A131601/rstLst/?sw=yakiniku`.
  - tabelog: KEYWORD; term `yakiniku`, category `None`; parsed `15`, displayed `15`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/A1316/A131601/R9966/rstLst/?sw=yakiniku`.
  - tabelog: KEYWORD; term `yakiniku`, category `None`; parsed `0`, displayed `605`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/A1316/A131601/`.
  - tabelog: KEYWORD; term `yakiniku`, category `None`; parsed `0`, displayed `628`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/A1316/A131601/R9966/rstLst/`.
  - tabelog: KEYWORD; term `yakiniku`, category `None`; parsed `0`, displayed `605`, `OBSERVED_LISTING`; decidedBy `BROWSER_AGENT_OR_SOURCE_PAGINATION`; reason OBSERVED_LISTING_CONTINUATION; URL `https://tabelog.com/en/tokyo/A1316/A131601/`.
  - tablecheck: KEYWORD; term `yakiniku`, category `None`; parsed `None`, displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.638716099999996&geo_longitude=139.7026251&geo_distance=1km&auto_geolocate=false&search_text=yakiniku`.
  - google-places: KEYWORD; term `yakiniku`, category `None`; parsed `None`, displayed `None`, `PLANNED_URL_WITHOUT_COMPLETED_LISTING`; decidedBy `PLANNER_AND_OBSERVED_REGION_AGENT`; reason CURRENT_FIRST_BATCH; URL `google-places:text-search`.
  - Exact Google website witnesses: tabelog:en/tokyo/A1317/A131701/13290371 <- `https://tabelog.com/tokyo/A1317/A131701/13290371/`; tabelog:en/tokyo/A1317/A131701/13241250 <- `https://tabelog.com/tokyo/A1317/A131701/13241250/`. Name-only hints: 12 (not credited).

### Evaluation scope and unresolved measurement limits

1. **End-to-end:** NOT_EVALUATED / not applicable to this discovery-only stage. No availability checks or deliveries; these are not complete Live result types or a product signoff.
2. **Stages:** frozen semantics, requested centers/radius and discovery metrics only. Per-source funnels and retrieval observations have different binding scopes: TableCheck funnels parse results while retrieval attempts may still be `PLANNED_URL_WITHOUT_COMPLETED_LISTING`. Those null observations remain null, and unbound results are not relabeled as observed complete listings. Google exact website-source-ID credit is independent of name similarity. Identity/HARD/inventory and Agent-decision Gold correctness remain NOT_EVALUATED here. The native detail and Google-coordinate scope difference in `inRadiusParsed` is recorded above; no scoring change was made midbatch.
3. **Severity:** independent network-shape S0_BOUNDARY ABSENT10/10, without claiming that unknown GET side effects are proven harmless. S0 declaration andS1–S4 remain NOT_EVALUATED for this limited probe. All recordings remain NOT_REPLAYABLE with their original reasons; this is real read-only observation, not a faithful Replay pass.
4. **Attribution:** reported source failures are observed runtime codes, not independent causal conclusions. Source preflight ENV is confirmed as a stopped stage; its underlying cause is unconfirmed. No attribution-driven product/Prompt/Schema/eligibility change was made; independent review remains next.

### Verification, commits and usage

- Common reviewed GET draft `cac4b4f`, final shared CORS fix `a60d27b`, preparation `68df8fd`, certified baseline freeze `acfaaffa`, rebased P2-1a `39fc15e`, approved outer recovery/evidence `1b610a8`. Original red/green and final five gates are retained under diagnostic/cors and gates/protocol-final: typecheck/arch/build PASS, default936/936, real Chromium115/115. Combined rebased P2-1a five gates: PASS,940/940 and Chromium116/116 in gates/rebased-final. Source unchanged during probes; final artifact/doc changes reuse these gates plus syntax, state predicates, hashes, links and authority/diff checks.
- Reviewer commit `0f7d43f` appeared remotely during final checks; its6 document/log blobs were cherry-picked unchanged as `bdafd2e`, preserving independent review of original3094193. That review is code evidence, not review of these new10 probes. Its nonblocking Google-only/readability notes are deferred to a later authorized slice. No extra source change here.
- This rerun:10 formal probes,55 model calls/55 captured rows (55 SUCCEEDED,0 failed),19 formal Google +11 readiness Google=30,0 full Live,1 preflight-only ENV followed by1 approved recovery,0 formal retries. Historical baseline remains10 probes/86 models/15 Google. **Cumulative20/40 probes,141/450 models,45 Google,0 full Live** for P2-1 discovery. Witness certification32 public GETs and zero-model network diagnosis are separately recorded, not model/Google/formal probes. No remaining probe was started after the10th.
- Byte identity, budgets, input/freeze hashes, decision stream hash/count, all10 trace/recording paths, clean baseline HEAD and all pre-existing immutable artifacts checked in baseline-audit.json. Entire P2-1 evidence directory compressed estimate 21076882 bytes before this final report/manifest, below60000000. Original old baseline, intermediate failures and pre-recovery snapshot retained.
- Delivery boundary: no checkpoint A/B, P2-1b or full Live. Push these results and the rebased code for independent review, then stop.
