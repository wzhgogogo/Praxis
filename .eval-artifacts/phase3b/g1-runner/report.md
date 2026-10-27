# Q28/Q30 reviewed dual outcomes and Runner main integration

Current slice 2026-10-27T17:17:32.536721+01:00 (Europe/Vienna CET). User reconciled the reference contract without changing ADR0046 or B core. Runner rebased to latest main/c98438f8; both histories and budget rows preserved. New scorer@4, public question schema@3 and reviewed dataset@2 replace old execution shapes, without product Prompt/Schema/State changes.

Q28/Q30 each allow NOT_STATED with no citations, or ANSWERED with related original source text and the explicit no-safety-guarantee/no-halal-certification limitation. Both require correct sensitivity and actual confirmationRequired=true. Related source evidence remains at its original position but is optional for NOT_STATED; the ANSWERED variant requires the related phrase. Q30 now uses RELIGIOUS_DIET everywhere in active inputs/loaders. All34 references remain confirmed by independent reviewer (Claude), 2026-10-27. Original candidate file remains byte-identical. The canonical reference is g1-qa/answers.reviewed.json; the former duplicate mirror is retired.

2220e1e9 typecheck passes; both new legitimate NOT_STATED assertions fail against old scorer (FAIL vs PASS), proving effective red. Corrected same controls and all8 scorer tests PASS. Existing Runner controls plus an added actual-core/saved-page fixture prove both topics and both outcomes through independent canonical references:4/4 question/outcome combinations PASS, raw core and normalized/scoring confirmation flags all true. Unsafe affirmative fragments, missing/false confirmation, wrong category, missing answer quotation/limitation and fabricated citations are rejected. Unseen paraphrases/additional claims remain NOT_EVALUATED for review, not silently accepted or counted as error0. This is not complete semantic assertion detection or real-model quality.

Formal frozen fixture diagnostic, five gates and authorized main merge pending. Product/core/site/Pack unchanged, all real calls0, no .env. Wait for B Agent integration before real-model evaluation. Historical conflict evidence and old scores below are superseded retrospective, not current failures under the new approved reference.

---

# Current delivery: native G1 Runner (draft / not integrated)

2026-10-27T16:38:55.260904+01:00. QA final review is merged/pushed main319cb9a5: all34 confirmed, Q24/Q25 no fresh read. Runner is separately rebased to delivered B/e4829a58; no Runner merge to main. After rebase, implementation code changes only core-adapter.ts; guide and frozen observation metadata updated separately. All370 B src product files match e4829a58, no product Prompt/Schema/State/site edits by A.

8cb02dbc five gates PASS: typecheck0.417s, arch0.202s, default1148/1148 28.060s, build0.483s, Chromium167/167 98.592s. Every gate starts/ends with empty status. Current24 frozen input/config files and product SHAs match. Receipts/raw compressed logs: verification/native-e4829a58. Original actual-core stale-run red remains at checkpoint/phase3b-g1-runner-0a466bcd; same assertion and all4 local controls PASS after both adapter stages.

Final frozen saved-page fixture8cb02dbc executes34/34 under enforced answer-read denial, then a separate scorer reads answers. It has29 FIXTURE invocations, source/fresh/real calls0, outputs29 NOT_STATED/5 UNVERIFIED. Canned diagnostic5 PASS/19 FAIL/10 NOT_EVALUATED, falseClaimCount=null: this is not real-model correctness, G1 acceptance or S0=0. No new true model/Google/website/GET/Live, no .env. Shared ledger16 rows union-preserves B/C and main A entries, all increments0.

## Contract review required before real-model acceptance

Q28 and Q30 are confirmed NOT_STATED references with sensitive category and supporting source quotes. The current scorer requires these quotations for sensitive NOT_STATED; delivered B core explicitly accepts NOT_STATED only with citations=[] and answer=null. These contracts cannot both pass. A local-constructed actual-core probe, routed solely through the adapter with a valid ALLERGY NOT_STATED fixture response, reproduces core NOT_STATED then scorer FAIL (MISSING_VERBATIM_QUOTE, REQUIRED_SUPPORT_NOT_QUOTED). It is not a real restaurant result or website replay. Frozen input/code/output: review-blocker/. No Gold, B code or pass threshold was changed to hide this issue.

Review must reconcile the sensitive NOT_STATED quotation contract (scorer/reference expectation versus core output) before real-model acceptance. Runner transport preparation is complete and pushed for review; further scoring/core changes stop here. General confirmation display remains a future presentation-layer check, not a core-only quality claim.

## Retained next steps

Parallel main advanced to c98438f8 during this run: it includes319cb9a5 and B core integration with Accepted ADR0046. That prerequisite is now satisfied. Runner still remains unmerged because the newly reproduced Q28/Q30 acceptance-contract issue requires review under the user stop condition; no automatic threshold change is allowed. G3 begins with Tabelog. At first approved3b Live, capture a bound TableCheck positive calendar and new replay; add it to G2 before TableCheck G3 acceptance. No Live or G3 implementation in this task.

The sections below preserve earlier phase evidence and superseded plans; they are not current baseline claims.

---

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

Final remote-main observation 2026-10-27T16:43:30.673148+01:00: c98438f8 includes this QA change. Latest main budget rows unioned without changing original entries (15 to 16); all cumulative real calls remain0. Native code/source/input SHA checks remain unchanged.
