# Round 19 unresolved Case reconfirmation

Draft / not integrated. 2026-11-21. Worktree `/private/tmp/praxis-3c-unified`, branch `codex/feat-web-photos-unified`.

Baseline `6a54ff083372bbc61dbed27ce81bbf8ca4647a4e` (src identical to prior frozen source `77f5b9bc2e242f1fbcd6e8f508fff140c88d732c`). Unique tested source/config SHA **`9542dacca067849d00312ee5d346e95d759ebcf9`**. Evidence-only commit `8e3e1050dbf6100816e99056729888934ad63192`. Report/docs commits keep src unchanged.

[Interaction contract](interaction-contract.md) · [Acceptance data](acceptance.json)

## Single frontend P1 closed

RECONFIRM is unresolved intent for this tab's authenticated user and Case. One key, praxis:slot-reconfirm:[userId,caseId], now survives missed requirement revisions, passive navigation and reload. SELECTED keeps its existing user/Case/revision/restaurant key and exact date/time/party rebinding. There is no revision-key fallback, migration or compatibility branch.

Only three production modules change: slot-selection defines CaseScope and safely parses the lock's JSON, recognizing only kind RECONFIRM; selected-slot uses caseScope for all lock writes/deletes and synchronizes reconfirmSlot before its no-candidate early return; transport removes retainReconfirmation/reconfirmationRequired and creates the marker only on exitHandoff. Existing entry/position/navigation/views are unchanged. USER-FLOWS0.38 corrects the current Round18 scope and records the Round19 contract; frozen Round18 artifacts remain untouched.

Explicit time selection, deliberate paging/Saved change to another restaurant and a successful own Candidates edit advancing revision still consume the lock. Same-restaurant Saved, About/Back and passive plan restoration do not. Existing Find more, refresh/question Stop, MODEL_FAILURE,409, logout/login handlers and per-account boundaries are unchanged. User/Case isolation is asserted by the pure contract; this is not a claim that every combination of these retained paths received a new dedicated end-to-end test.

## Red → green evidence

Four restore entrances each run on1440×900 and390×844: Candidates misses remote3→4 edit then F5; About misses it then F5/Back; Saved misses it then F5/Back and chooses the same restaurant; another plan is open while the original changes, then sidebar return. Every unresolved journey asserts no aria-pressed slot, the exact slot-area confirmation hint, disabled Let's book, guarded programmatic click and SQL departures0. Only after explicit19:30 selection can POST booking-departures return201 and PGlite persist the candidate/offer whose current inventory is4 guests at19:30.

The two resolved-old-lock-after-away-revision controls first receive4-guest conditions, explicitly choose19:30, open Handoff and Back, assert zero remaining reconfirmation keys, switch plans, receive remote5 guests and return. The old lock stays absent; default19:00 is available and a normal201 persists the current5-guest offer. Scenario labels3/4/5 refer to guest counts, not literal requirementRevision counters; the frozen preflight contract/comment uses revision4/5 as shorthand for those guest-change scenarios. Authoritative revisions remain server-generated.

The baseline pure test had2 pass/1 fail on cross-revision intent. The initial browser run had0/10 pass: missing hints and old revision-key leftovers reproduced, with one mobile sidebar wait subsequently corrected. [Pure red](pure-red.log) · [Initial browser red](browser-red.log) · [Corrected mobile plan-return red](mobile-plan-red-corrected.log).

Early green had6/10 due new-test setup mistakes: reading candidate IDs from the initial asynchronous HTTP response, and waiting for the phone sidebar to remain visible after normal navigation had closed it. Corrected setup reads the settled server view and checks the active sidebar row attached plus the restored page. No booking, hint, selection or SQL assertion was removed. Typecheck also caught an excess-property test literal; the initial diagnostic is retained. [Early green diagnostics](browser-green.log) · [Type setup diagnostic](typecheck-preflight.log).

Final targeted Round17–19 browser26/26 (including all10 new journeys) and pure selection/architecture4/4 pass. [Browser green](browser-final-green.log) · [Pure green](pure-final-green.log). These are development diagnostics, separate from frozen acceptance. Backend code, backend tests and existing browser assertions are unchanged; only the obsolete pure assertion that a new revision drops RECONFIRM was replaced as requested.

## Clean frozen five gates

| Gate | Result | Seconds |
|---|---|---:|
| typecheck | PASS: backend + strict browser | 0.661 |
| arch-check | PASS: 0 forbidden dependencies | 0.211 |
| test | 1797/1797 | 71.246 |
| browser-fixture | G2 5/5; Chromium 485/485; G6 159/159 | 422.023 |
| build | PASS | 0.591 |

All rows use `9542dacca067849d00312ee5d346e95d759ebcf9`, cleanBefore/cleanAfter true, minimal environment and no dotenv. First frozen full-gate attempt. The browser gate has no outer sandbox; its recorded Replay children apply their own OS outbound denial. Other gates use OS outbound denial except loopback.490 is only the G2+Chromium aggregate5+485; G6 assembly159 runs afterwards. [Raw manifest/logs](gates/manifest.json).

strict:true,16 singleton static-import SCCs,0 cycles,0 any/suppression directives and no reverse entry import.17 source tsx/build assets match byte-for-byte; CSP and dependencies are unchanged. [Graph/hashes](browser-dependencies.json) · [DOT](browser-dependencies.dot) · [Asset check](build-assets.json).

## Offline visual acceptance

| Suite | Result | Seconds |
|---|---|---:|
| formal | 16/16; 41 images | 32.615 |
| style1 | 6/6; 6 images | 7.854 |
| states | 70/70; 48 images | 94.892 |

Formal16 covers390×844 (7),960×900 (2),1440×900 (7). Style1 retains390×844,768×1024,1440×900 available/unverified combinations. State70 includes all prior60 plus10 new desktop/mobile journeys. All suites use the same clean frozen source, actual loopback HTTP/SSE, PGlite and Chromium with OS nonloopback denial.

All95 images were inspected through twelve contact sheets; the10 new frames were also opened individually. No new layout regression observed. Existing error scrolling can put a heading partly above the viewport; long cards remain scrollable. State/Style1 photo placeholders are intentional; formal photo fixtures separately validate loaded images and Viewer. [Formal16](formal/manifest.json) · [Style6](style1-driver.log) · [States70](states-driver.log) · [Visual inspection](visual-inspection.json) · [Run provenance](visual-driver.json).

New screenshots:

- desktop: [candidates](states/round19-desktop-candidates.png), [About](states/round19-desktop-About.png), [Saved](states/round19-desktop-Saved.png), [other-plan](states/round19-desktop-other-plan.png), [resolved-old-lock-after-away-revision](states/round19-desktop-resolved-old-lock-after-away-revision.png)
- mobile: [candidates](states/round19-mobile-candidates.png), [About](states/round19-mobile-About.png), [Saved](states/round19-mobile-Saved.png), [other-plan](states/round19-mobile-other-plan.png), [resolved-old-lock-after-away-revision](states/round19-mobile-resolved-old-lock-after-away-revision.png)

Formal journeys retain login/SSE, inline edits/drafts, G1 candidate/citations, galleries, second-slot restore and B1 SQL identity. Expected session401, broken-image410, deliberate conflicts409, blocked nonlocal navigation and Chromium GPU warnings are separate from unexpected application errors. No booking-site GET is sent.

## Protection, hashes and remaining limits

All7706 opening Unified evidence files (including frozen round6–18 and independent review directories) and70 restaurant-web-read files keep their SHA256. Main HEAD/status/index/tracked bytes and main.env digest match the opening snapshot. Backend application/server/Core/Domain/AgentLoop/infrastructure/integrations/eval/scoring, Prompt15, fingerprints, blocking fields, protected ADRs and historical Mikkeller note/behavior are unchanged. No dependency, CSS, HTML or serving/CSP changes.

Closeout already lacked its.git file and had a prunable registration at task start. Exact registry and residual file/symlink inventory remain unchanged; closeout Git HEAD/index/status cannot independently be verified. No repair or write there. Commits disable automatic maintenance/GC. [Protection check](protection-check.log) · [Opening hashes](protection-baseline.json) · [Sparse-tree check](worktree-check.json).

[Artifact SHA256](artifact-sha256.json) covers149 files. The report has its own [SHA256](REPORT.sha256); these three manifest/report files are excluded from recursive artifact hashing. No src changes after freeze.

Evaluation layers: functional P1 and retained controls pass offline; stage evidence uses browser restore/revision journeys, local HTTP201 and PGlite SQL assertions; independent real-source severity/S0 and answer-quality evaluation remain NOT_EVALUATED; attribution is separated by missed-update lock loss, single-key consumption and scoped pure assertions. Existing recorded component regressions do not turn this into a new Live or complete real-source Replay claim.

No Live, real PostgreSQL,4312, external model/Google/restaurant calls, push or main merge. Real iPhone Safari/Android Chrome and real-source quality remain untested. Fixture finally blocks close Chromium, HTTP servers and PGlite; verification processes ended. Stop here pending confirmation.
