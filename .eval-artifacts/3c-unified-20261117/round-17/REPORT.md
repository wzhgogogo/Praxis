# Round 17 precise offline closeout

Draft / not integrated. 2026-11-20. Worktree `/private/tmp/praxis-3c-unified`, branch `codex/feat-web-photos-unified`.

Baseline `138d35d3b8b915e3279220036066b96d7acf292c`, with src identical to previous frozen source `1e8fbfb7051204a77b14c273f120bf41f7d8e5e2`. Unique tested source/config SHA `256415a046ed948955b235bfe6b8805c607236bb`. Evidence-only commit `969554d5f01a8a0e6e971cd99c00e29ba69d9b2e`. Later report/docs commits keep src unchanged.

[Interaction contract](interaction-contract.md) · [Acceptance data](acceptance.json)

## Three fixes and the locked interaction boundary

**P1 — changed plan conditions exit old Handoff.** accept captures the previous requirementRevision before accepting the new server view. A revision change cancels pending client booking preparation and clears the old slot projection. If Handoff was open it returns immediately to Candidates, resets the Handoff render key, saves the new position and reports “Plan conditions changed. Confirm the time again.” Position records also carry revision, so a hard reload with an old-revision Handoff returns to Candidates. No old-format position compatibility path is added.

This does not make slot choice shared. selected-slot still uses sessionStorage under user / plan / requirement revision / restaurant. B merely selecting 19:00 under the same revision leaves A on its own 19:30 Handoff, including after A reload. Existing missing-slot reselection locks and same-time offer-ID rebinding remain. The accepted product explanation is appended to USER-FLOWS.md (document revision0.36); historical Mikkeller wording stays unchanged.

**P2-1 — current Stop during semantic identity handback.** Preparation validates its exact handle, startedVersion ≤ observed version ≤ persisted version, and either its stored read ID or the just-persisted current read ID. Cancellation retries use the same predicate. Immediately after semantic dispatch, an aborted handle returns before appendMessage and source work. If that same object becomes active during the initial identity re-read, it is cancelled through its active completion; a replacement handle is never adopted. Active-read and late-Stop version protections remain.

**P2-2 — displaced input is a conflict.** Explicitly aborted work stops quietly. A nonaborted preparation that loses ownership checks whether its own event was already persisted: an existing event remains idempotent; an uncommitted loser throws StaleTaskVersionError with the latest snapshot version. This guard covers both semantic checks and the shared activation entry. The existing frontend409 path reconciles the latest plan, keeps the rejected tab's composer text and displays the server conflict. It does not silently acknowledge or automatically resend the losing input.

## Red → green evidence

| Regression | Baseline / controlled red | Passing observation |
|---|---|---|
| First/edit semantic dispatch persisted before handle ID update | Both current-ID Stop calls return409, including expected1/actual1 | HTTP200; stopped state; zero new discovery/availability calls; pending message append count0 |
| Desktop/mobile A19:30/2 in Handoff, B changes to3 with both19:00 and19:30 still offered | Old Handoff stays open in both SSE and reload paths | Immediate exit before replacement read completes; reload exits too; visible confirmation hint; no departure before explicit reconfirmation |
| Reconfirm revised time | Protected by the P1 path above | After A explicitly chooses19:30/3 and opens Handoff, exactly one201 receipt persists the current candidate and new offer in PGlite SQL; nonlocal source navigation is blocked |
| Same-revision B merely chooses19:00 | Passes already | A stays in19:30 Handoff and restores it after reload, on desktop and mobile |
| Concurrent A→3 and B→4, same expectedVersion | Losing A returns200 and its input disappears from accepted history | B200 persists4; A409 carries latest actualVersion, reconciles to4, retains its original3 text and shows conflict |
| Same handle activates while Stop re-reads identity | Additional pre-freeze guard challenge returns expected1/actual1 conflict | Same object cancels successfully; provider abort observed; no replacement owner can be claimed |

[Baseline backend red](backend-red.log) · [Baseline browser red](browser-red.log) · [Activation-boundary red](activation-boundary-red.log) · [Final preparation18/18](backend-final-green.log) · [New browser8/8](browser-green.log) · [Retained and new browser controls24/24](browser-controls.log) · [Web contracts3/3](web-unit-final.log).

Preflight logs are unfrozen development diagnostics, not the frozen gate run. The additional activation challenge was run against the work-in-progress initial fix, then closed before freeze. Original assertions were retained; no Domain, Reducer, Agent Loop, provider extraction or scoring code changed. Retained tests cover old Stop/new-read409, semantic-preparation Stop, About cancellation, unavailable-slot locks, empty→Try again, offer replacement, per-plan drafts/questions/feedback and exhausted batches/reload.

## One clean frozen five-gate run

| Gate | Result | Seconds |
|---|---|---:|
| typecheck | PASS, backend + strict browser | 0.630 |
| arch-check | PASS, 0 forbidden dependencies | 0.198 |
| test | 1792/1792 | 69.137 |
| browser-fixture | G2 5/5 · Chromium 467/467 · G6 159/159 | 412.455 |
| build | PASS | 0.654 |

All rows use `256415a046ed948955b235bfe6b8805c607236bb` with cleanBefore and cleanAfter true and a minimal environment without dotenv. This was the first frozen full gate attempt. Browser Replay children keep their own OS outbound denial; the browser gate is not nested inside an outer sandbox. G2 + Chromium472 is only the aggregate of5 and467, not another test group. [Exact manifest and raw logs](gates/manifest.json).

## Strict browser DAG and identical assets

browserStrict:true; all16 static-import strongly connected components have size1, with0 cycles and no reverse import of entry. Browser sources contain0 any and0 suppression directives. The default architecture regression and strict typecheck run on the actual frozen modules. No dependency or lockfile change; independent DOM tsconfig and same-origin CSP remain unchanged. Source tsx and build serve17 byte-identical same-origin assets. [Exact graph/SCC/source hashes](browser-dependencies.json) · [DOT](browser-dependencies.dot) · [Asset comparison](build-assets.json).

The existing module layers remain: entry assembles callbacks/events; views, navigation and transport consume lower queries/format/composer/position/selection/photo/session helpers. Only transport→position is added for saving the revision-invalidated Handoff position; it points down the existing DAG. Public server DTO alignment stays checked by typecheck.

## Offline visual acceptance

| Suite | Result | Seconds |
|---|---|---:|
| formal | 16/16, 41 screenshots | 32.784 |
| style1 | 6/6, 6 screenshots | 7.993 |
| states | 52/52, 32 screenshots | 65.399 |

Formal16 uses390×844 (7),960×900 (2),1440×900 (7). Style1 retains its existing390×844,768×1024,1440×900 available/unverified combinations. New revision and concurrency paths each cover desktop1440×900 and mobile390×844. All three suites use the same clean frozen SHA, actual loopback HTTP/SSE + PGlite + local Chromium and OS loopback-only isolation.

All79 screenshots were inspected in ten contact sheets; the six new frames were also opened individually. The hint/conflict text and composer remain readable; no new layout regression observed. Scrolling to the existing error area can move the heading partly above the viewport. Style/state photo placeholders are intentional; formal photo fixtures separately validate loaded photos and Viewer behavior. [Formal16](formal/manifest.json) · [Style log](style1-driver.log) · [States52](states-driver.log) · [Inspection](visual-inspection.json) · [Run provenance](visual-driver.json).

Key frames: [desktop SSE revision exit](states/round17-desktop-sse-revision-exit.png), [desktop reload exit](states/round17-desktop-reload-revision-exit.png), [mobile SSE exit](states/round17-mobile-sse-revision-exit.png), [mobile reload exit](states/round17-mobile-reload-revision-exit.png), [desktop retained conflict draft](states/round17-desktop-concurrent-edit-conflict.png), [mobile retained conflict draft](states/round17-mobile-concurrent-edit-conflict.png).

Formal journeys retain login/SSE, inline edits preserving drafts, G1 identity/citations, gallery/Viewer, second-slot restoration and B1 SQL departure identity. Expected initial session401, damaged-image410, deliberate concurrent-edit409, blocked nonlocal navigation and Chromium GPU warnings are separate from unexpected application failures. The frozen formal oracle reports no unexpected errors. No real booking-site GET is issued.

## Protection, hashes and evidence limits

Main and closeout HEAD/status/index/tracked content and the main.env digest match the opening snapshot. All4694 pre-existing Unified files (including147 Round16 files and independent review outputs), plus70 restaurant-web-read files preserve SHA256. Prompt15, fingerprint, missingBlockingFields, historical Mikkeller behavior/wording and protected ADRs remain unchanged. Core/Domain/Agent Loop/integrations/eval/scoring, dependencies, HTML/CSS, server asset handling and CSP have no changes against baseline. USER-FLOWS changes only its header revision/date and appended current contract. [Protection check](protection-check.log) · [Opening inventory](protection-baseline.json) · [Sparse worktree check](worktree-check.json).

[Artifact SHA256 manifest](artifact-sha256.json) covers137 files. The report has its own [SHA256](REPORT.sha256); the manifest excludes itself and these two report files to avoid recursive hashes. No src edits after freeze.

Functional result: all three specified issues and retained controls pass offline. Stage evidence: controlled semantic/dispatch timing, actual local HTTP409/200/201, server plan/history, visible tab-local controls/drafts and SQL receipts. Severity: independent real-source S0/answer-quality evaluation NOT_EVALUATED; these tests are not a Live accuracy score. Attribution: red latches and green assertions separate requirement-revision invalidation, handle identity handback and lost preparation ownership.

No Live, real model/Google/restaurant call, real PostgreSQL connection or4312 use. Actual iPhone Safari/Android Chrome and real-source data quality remain untested. Fixture finally blocks close browsers, HTTP services and PGlite; verification processes ended. No push, no main merge; stop here.
