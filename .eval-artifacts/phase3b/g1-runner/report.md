# Current native-core migration (2026-10-27 CET)

2026-10-27T16:26:12.182132+01:00: B batch2 delivered e4829a58. Runner rebased there, both document histories and all budget rows preserved. Only src/eval/restaurant/fact-qa/core-adapter.ts changed after rebase; Runner engine, loader, scorer and fixtures retain identical source bytes. The adapter now keeps native brief answers/category/URL/readAt and UNVERIFIED reason. Core NOT_STATED answer=null becomes an empty normalized answer; the scorer receives a canonical NOT_STATED text label only, not customer-facing prose. Raw core output remains intact. All four original fixture composition controls pass without changing tests. No legacy wire fallback remains in current adapter.

Native input SHA/outer observation labels re-frozen; legacy execution inputs, results and clean gates remain historical under the annotated checkpoint tag and history/ manifests. The retired legacy outer runner is removed from current executable paths. Native e3af40a1 fixture completed34/34,29 FIXTURE calls,29 NOT_STATED/5 UNVERIFIED; diagnostic5 PASS/19 FAIL/10 NOT_EVALUATED, falseClaimCount=null. Same4 local controls PASS. The guide now reflects the native contract, so its metadata SHA is re-frozen for the final receipt; no Runner/scorer/test code changes. Final five gates pending. Runner remains draft/unmerged; ADR0046 text still pending. No real calls.

---

# Historical 0a466bcd evidence

# G1 evaluation Runner: fixture integration

Draft / not integrated, exposed offline evidence. Core pinned to B/0a466bcd; final 34-question review merged/pushed main319cb9a5. Branch codex/feat-phase3b-g1-eval-runner is deliberately based on B, not merged to main. B product files remain byte-identical. Time 2026-10-27T16:09:08.100528+01:00.

Execution reads only public questions and saved pages, verifies SHA, renders without script/network and calls actual ModelRestaurantPageQuestion. Binding metadata is local-constructed/offline; this does not test production identity matching or a fresh website read. Raw core output/normalized output, URL/readAt and retained read IDs are saved before an independent scorer reads evaluator-only answers. There is no fresh reader. A real-model gateway can be injected later; executable CLI only permits fixture transport.

All B I/O and fixture wire assumptions live in core-adapter.ts. Current pure-quotation result is temporarily projected into status/answer/citations/sensitiveCategory/reason. Old core does not classify categories: NONE is explicitly unsupported, never taken from the question to fake a classification. Scorer@3 checks new category output; general sensitive confirmation prose moved to future presentation-layer validation per user contract. Q26 still requires its reviewed conflict/confirmation. No product Prompt/Schema/State changes.

36dc5005 with successful typecheck fails at the previous-run integration assertion (actual ANSWERED, expected UNVERIFIED). The adapter wrongly relabelled a prior-run page as current; this was an A Runner setup defect, not a B core failure. Correct given.readRunId fixes the same assertion. Four Chromium composition controls pass, including answer/absence/unverified, URL/readAt rejection, source SHA/unknown-key rejection with zero model calls, enforced reference-read denial and a working independent canary. The six original scoring controls pass. Fixtures are local constructions, not website replay or restaurant Gold.

ee5c835c frozen 34-question execution/scoring diagnostic completed: 34/34, 29 FIXTURE invocations, source/fresh reads0. Core outputs0 ANSWERED/5 NOT_STATED/29 UNVERIFIED; the independent canned-response diagnostic is5 PASS/27 FAIL/2 NOT_EVALUATED, falseClaimCount=null. This is intentionally not real-model quality, not a G1 pass, and not S0=0. Attribution and the four-layer scope are in fixture-diagnostic.json. Five gates are pending. Real-model quality and user-visible Agent delivery are NOT_EVALUATED. No real model/Google/restaurant/GET/Live calls, no .env reads. B's new delivered core will require rebase and only adapter update, then fixture rerun; no main merge until its ADR/core is approved. TableCheck positive calendar/new replay deferred to first 3b Live by user.

## Product and input verification

369 B src product files (including its existing tests) match0a466bcd byte-for-byte; full path/SHA manifest retained. The 24 green configuration/source/reference files retain frozen SHAs. Shared budget unions B/C base rows with main319cb9a5 by id:12 original/added rows, no conflicting overwrite, all increments0. The source-driven fixture does not read the reviewer answer file; that read is confined to the later evaluator process.

## Legacy pinned-core checkpoint

cfcde8c7 five gates PASS:1136 default/167 Chromium, typecheck0.446s, arch0.210s, default28.024s, build0.449s, browser98.476s; every gate starts/ends clean. Receipts retained under verification/legacy-0a466bcd. B batch2 delivered e4829a58; per user arrangement the Runner now rebases there with adapter-only code changes and a newly frozen fixture run. This section remains historical, not the new core result.

Native product manifest verifies 370 B src files unchanged against e4829a58. Source migration remains only core-adapter.ts; the extra README change is documentation. Legacy input/source checklists are frozen historical evidence, current input authority is native-inputs-sha256.json.
