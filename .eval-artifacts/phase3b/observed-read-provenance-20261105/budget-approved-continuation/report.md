# Approved budget continuation — branch Live stop

Status: draft / not integrated. Exposed G6 development evidence; not Clean Holdout. Time: CET UTC+1. Frozen code and Live inputs: `7a73ba845d807ab31555e7507b03b92318c16179`. No main integration.

## What completed

The two approved offline budget assertions are synchronized; the real source probe default and all production/Live ceilings are unchanged. The remaining 23 Chromium failures were migrated without skip/todo. The 96 earlier default failures remain accounted for in `../adapter-live-closeout/review-resume/` (89 leaf failures and 7 parent summaries, not 96 independent behaviors). Current file/group migration, retained behavior, retirement/replacement and the one generic product diagnostic correction are in `migration.md`.

Clean-tree final gates at the frozen SHA: typecheck, arch, build PASS; default **1420/1420**; Chromium **227/227**; G6 assembly **66/66**; strict G2 **5/5**, all 12 pairs PASS. Each gate has empty before/after status in `gates/results.json`. The ordinary fixture and G6 constituent commands both ran successfully; no hidden short-circuit failure. This proves offline regression coverage, not the Live delivery promise.

`f8c99318..7a73ba84` hardcoded scan: 5 hits, no additional hits from this continuation. One shared whitespace normalization is an identity/result comparison; one allowedOrigins literal retains existing source security range; three site-branch hits report unsupported targets/search noncompletion. Details remain in the prior `hardcoded-audit.md`; raw current scan is `hardcoded-scan.txt`. No word lists, navigation templates, private selector interpretation or fixed action sequence was restored.

## Actual read-only calls and outcome

1. **TableCheck connectivity**: one already-approved page, HTTP 200, Map Search - Japan. 2026-11-06 02:30:44.193–02:30:46.845 CET. Ordinary Node Guard forwarding; no model, form action, redirect follow or retry. Connectivity is restored in this environment. Recording is diagnostic-only / NOT_REPLAYABLE because of an uncaptured static dependency.
2. **D4**: one frozen initial turn, 02:31:59–02:37:32 CET; 332.274 s execution (332.979 s outer boundary), 47 actual model calls, 3 Google requests. Final **NO_VERIFIED_RESULT**, 0 delivered, 0 B1 handoffs; G1 private-room follow-up NOT_SENT because DISPLAYED_RESULTS was never reached. No extra inventory verification GET was sent.
3. **D8**: NOT_STARTED. The D4 batch stopped for independent evidence review; the remaining Live allowance is unspent.

The batch receipt says `INDEPENDENT_EVIDENCE_REVIEW_REQUIRED`. Independent evaluation is **NOT_EVALUATED**, `s0Status=NOT_EVALUATED`, stopBatch=true. The integer s0=0 in that object is not a certified zero-S0 result. Three actual source POSTs (C-source:89/101/114) to the already-approved TableCheck read endpoint lack independently frozen read rules in the pack and lack outer-observed bodyFields/contentType/bodySHA256. The original receipt, input and evaluation are preserved unchanged. Guard admission cannot substitute for independent evidence; no retrospective PASS is manufactured.

## First deviation, grounded in the new recording

Real recording: `live/runs/D4/D4/recordings/g6-D4-1793928719238-0/recording.json`.

- Decisions #3–5: retrieval selected `kushikatsu`; the browser model received authoritative location Akabane but filled RETRIEVAL, then clicked Search. It did not select the station suggestion in these two actions. This is the actual model behavior, not the prior successful replay action sequence.
- Recording sequences **169–176**: observed Search click → implicit `/en/rstLst/` document navigation → 20,000 ms `elementHandle.click` timeout. Before this timeout, there is **no Guard transport start for that document**, and no completed native GET form provenance receipt. The document request is cancelled when the session closes. The same pattern repeats at sequences **1414–1421** and **2064–2071** for later named Tabelog searches.
- Therefore the earliest reproducible boundary is before Node source forwarding, not evidence of a 20s website response. Inspection shows native navigation admission waits for `forms.submission` evaluation on the old document, bounded by the same 20s interval. A stalled form-evidence read is a hypothesis requiring a focused offline reproduction; the recording does not prove which awaited evaluation is stuck. No Guard admission or timeout change is made on this hypothesis.
- TableCheck native discovery uses its existing 90s candidate scope and expires. Named TableCheck scopes consume 45s/43s/28s without accepted inventory. Search-page diagnostics were frequently omitted as UNSAFE_DOCUMENT, so a full faithful replay of those pages is not available. Missing pages are not fabricated.

## Source / candidate time and model costs

Exact scope endings are in `live/offline-diagnosis.json`; provider FINISHED means adapter returned, not verified inventory success.

| Scope | Provider | Seconds | Provider model calls | Runtime ops | Outcome |
|---|---|---:|---:|---:|---|
| Native discovery | DIRECTORY / Tabelog | 33.436 | 2 | 8 | RUNTIME_FAILURE, Search click |
| Native discovery | VENUE_SEARCH / TableCheck | 90.004 | 15 | 56 | DEADLINE_EXCEEDED |
| Kushiman Akabane | TableCheck | 45.003 | 8 | 31 | DEADLINE_EXCEEDED |
| Kushiman Akabane | Tabelog | 32.307 | 2 | 8 | RUNTIME_FAILURE, Search click |
| Yamasho | TableCheck | 43.243 | 8 | 32 | adapter returned UNKNOWN |
| Yamasho | Tabelog | 30.241 | 2 | 8 | RUNTIME_FAILURE, Search click |
| Japanese izakaya candidate | TableCheck | 28.301 | 4 | 21 | adapter returned UNKNOWN |
| Japanese izakaya candidate | Tabelog | 3.066 | 1 | 4 | adapter returned UNKNOWN |

Candidate totals: Kushiman 77.334s/10 calls; Yamasho 73.484s/10 calls; izakaya 31.367s/5 calls. Scope costs must not be added twice to candidate totals. The final view has three UNKNOWN checks (two BROWSER_TIMEOUT and one RESERVE_REACHED); no identity+availability completion was achieved. Source/terms reads started inside the 20s reserve: **0/0**. No budget or time value was changed.

## Recording and independent evidence limits

All 47 decision records are present. Browser recording has **8/47 qualified snapshots**, PARTIALLY_REPLAYABLE; 36 TableCheck snapshots are UNSAFE_DOCUMENT with diagnostic omitted; three TableCheck guide snapshots retain diagnostics but lack static dependencies. Source timelines have 773 request starts and 773 ends, 132 Guard transport starts/ends. The paired recording distinguishes browser-started requests from Node forwarding. It cannot reconstruct missing POST body metadata. Credential loading occurred only inside Node via the approved --env-file; no independent read/copy/output of .env. No real booking, review, account or payment action was requested.

## Budget and stop decision

Own ledger `live/budget-C-live.json`: cumulative Live **17/36**, models **507/1600**, eval GET **332/442**, Google87, source requests10463. This continuation used Live1, models47, evalGET1, Google3, source requests133 including connectivity. Held-out reserves Live18 / evalGET108 remain untouched. D8 slot and up to two post-delivery checks remain unspent. No additional real request is authorized by this report.

The conditional merge requirement is unmet: no completed identity+availability observation, plus independent S0 evidence gap. **Do not merge main or start D8 by ignoring the stop.** Shared STATUS/DEVLOG/TEST-LOG remain unchanged per the user’s merge-only rule.

## Minimal next work, with evidence gates

1. Independently audit/request-capture wiring: outer transport must retain actual non-GET method, origin/path/query names, content type, exact body hash and field/type schema before dispatch, with no raw body/headers/secrets persisted. Freeze previously approved read rules independently in the pack; test altered/extra body fields, wrong method/path, missing metadata and CORS preflight fail closed. Existing D4 remains NOT_EVALUATED because absent bytes cannot be recovered. This repairs evaluator evidence, not Guard admission.
2. Reproduce the Search admission stall against the admitted actual D4 document/script recording, with misses aborting and the exact recorded browser decisions. Instrument which form-evidence await completes. If recording gaps prevent reproduction, report that gap. Only a generic fix with unchanged exact value-origin checks is acceptable; no direct URL, field-name exception, sequence, longer timeout or Guard bypass.
3. Use focused offline tests for that defect before considering a new frozen candidate. D8 remains paused until the independent evidence stop is resolved and any product fix has red/green evidence. No D4 rerun, extra GET or changed limit is assumed.

Four layers: configuration=gated frozen SHA/inputs; execution=real connectivity+D4 above; independent evaluation=NOT_EVALUATED; product conclusion=D4 delivery not achieved, D8 untested. Offline green gates are not substituted for Live acceptance.

Evidence integrity: Git whitespace checks report source HTML/CSS whitespace and terminal-log blank EOF lines. These saved originals are preserved; handwritten report has no whitespace errors. All staged files for this evidence commit are under this batch artifact directory, with no src/.env/shared-ledger changes.
