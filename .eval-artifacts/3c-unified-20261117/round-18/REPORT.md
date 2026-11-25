# Round 18 persistent reconfirmation and exact read cancellation

Draft / not integrated. 2026-11-21. Worktree `/private/tmp/praxis-3c-unified`, branch `codex/feat-web-photos-unified`.

Baseline `7355ca0e54d478c40bbfb7eae71e80204c8b18c9`; baseline src matches preceding frozen source `256415a046ed948955b235bfe6b8805c607236bb`. Unique tested source/config SHA **`77f5b9bc2e242f1fbcd6e8f508fff140c88d732c`**. Evidence-only commit `abc9d268aab1de1dcf6a3694cd6cb6d19023858d`. Later report/docs commits do not change src.

[Interaction contract](interaction-contract.md) · [Acceptance data](acceptance.json)

## Implemented boundaries

**Persistent P1 reconfirmation.** sessionStorage holds undefined ordinary browsing, tagged SELECTED date/time/party scoped by user/Case/revision/restaurant, or RECONFIRM scoped by user/Case/new revision. A condition change exiting an open or restored old Handoff writes RECONFIRM before rendering the new view. It projects no offer, no default highlight and no Handoff; the slot area keeps “Plan conditions changed. Confirm the time again.” and Let's book remains disabled through SEARCHING/PRESENT_RESULTS, disconnected-SSE reload and another F5 after exit. Booking preparation, refresh-selected-slot and departure also refuse this state. A normal render/position save cannot delete the marker.

Only an explicit time click records SELECTED and removes that revision's marker; deliberate moveCard/Saved restaurant changes clear it too. A successful own Candidates condition edit starts ordinary browsing under its new revision. Same-revision B19:00 leaves A19:30 Handoff isolated. Same-time new offer-ID rebinding, unavailable-time locks and other Round16/17 controls remain. Tagged records replace the unreleased old selected-slot format without a compatibility branch. USER-FLOWS0.37 and the interaction contract explain the current boundary; historical Mikkeller wording stays unchanged.

**Immutable P2 cancellation identity.** prepareRead assigns createId("read-handle") once to readonly handleId. sourceReadContext includes it through preparation, semantic commit and activation; its runId format is unchanged. Browser Stop forwards optional handleId, which the server validates and passes to cancelCase. A supplied ID must match the current owner exactly, even if uncommitted requests share version0/readRunId. A match remains valid after mutable version/run metadata advance. Direct no-ID callers retain the prior version/run validation. A completed read with no owner still safely returns the latest view.

**Three preparation races.** (1) progress.active derives from a registered preparing handle, not only the preparingReads counter, so a persisted Case publication gap cannot advertise an unowned Stop. Counters still protect orphan recovery. (2) Immediately after successful nonduplicate, nonaborted semantic CAS, the winner updates metadata and regains preparation ahead of an uncommitted contender; a genuinely newer committed owner stays protected. The losing request still gets409. (3) A semantic CAS losing to Stop's cancellation returns quietly only for StaleTaskVersionError with that handle already aborted; no pending append/source work follows. Other failures remain visible.

## Red → green and retained controls

| Challenge | Controlled red | Green observation |
|---|---|---|
| Revised Handoff, normal SSE + SEARCHING/PRESENT_RESULTS | Initial Round17 behavior defaulted the new first time after exit | No highlight; slot hint visible; Let's book disabled; programmatic click cannot open Handoff |
| Disconnected SSE reload from old Handoff | Restored new-revision card allowed default booking | Exit + persisted lock; explicit19:30 click required |
| SSE exit then F5 | Transient notice/lock disappeared | Inline hint and disabled button survive F5; explicit click required |
| Confirm revised time | Above lock enforced | Each mobile/desktop journey explicitly selects then records exactly one HTTP201 current candidate/offer SQL receipt in PGlite; nonlocal navigation blocked |
| Version0 A, B held Stop, C replaces preparation | Old Stop returns200 and cancels C | B409 with A's old handleId; C's different handle survives preparation/activation and finishes; displaced A409 |
| Published Case, createConversation not yet returned | progress.active exposed without a handle | No unowned Stop; registered handle later becomes visible; cancel before sources yields0 calls |
| A DB winner, uncommitted B overwrites preparation during dispatch | A orphaned; no further source work | A launches sources, completes PRESENT_RESULTS/3 guests; B409 |
| Stop wins before semantic CAS | Cancelled input rejects with409 | Pending request resolves quietly; stopped state and0 source calls |
| Same handle metadata changes into active read | Additional positive identity control | Original captured handleId + old metadata Stop200; provider abort/stopped |

[Backend red](backend-red.log) · [Browser red](browser-red.log) · [Corrected mobile version0 red](version0-mobile-red-corrected.log) · [Preparation22/22](backend-final-green.log) · [Round17/18 browser16/16](browser-green.log) · [Round14–18 controls32/32](browser-controls.log) · [Selection/architecture4/4](pure-green.log).

Preflight logs are development diagnostics, separate from frozen acceptance. The initial mobile version0 red timed out because its sidebar was closed; after fixing only setup it reproduced the actual200-versus409 defect. An initial setup typecheck also caught a missing test helper and was corrected before freeze. Original product assertions were preserved/strengthened; only selected-slot test inputs moved to the explicit tagged contract. Retained tests include late Stop/new-read409, semantic handback, concurrent shortlist/CAS, About cancellation, empty→Try again, offer rebinding/invalidity, single-tab isolation, per-plan drafts/G1/feedback, exhausted batches and reload.

## Frozen five gates

| Gate | Result | Seconds |
|---|---|---:|
| typecheck | PASS: backend + strict browser | 0.631 |
| arch-check | PASS: 0 forbidden dependencies | 0.198 |
| test | 1797/1797 | 76.674 |
| browser-fixture | G2 5/5; Chromium 475/475; G6 159/159 | 418.416 |
| build | PASS | 0.589 |

All five rows use `77f5b9bc2e242f1fbcd6e8f508fff140c88d732c`, cleanBefore/cleanAfter true and a minimal environment with no dotenv. This is the first frozen full-gate attempt. The browser gate has no outer sandbox: Replay children apply their own OS outbound denial. Other gates use OS outbound denial except loopback. G2+Chromium480 is the aggregate of5+475, not another group. G6 assembly159/159 runs after that aggregate. [Raw logs/manifest](gates/manifest.json).

## Strict modules and compiled assets

strict:true;16 static-import SCCs of size1,0 cycles,0 any/suppression directives, no reverse entry import. entry remains the unique event/callback assembler; selected-slot owns DOM-backed selection state above pure slot-selection/runtime; transport accepts revision changes through the existing lower modules. No new dependency, lockfile, HTML/CSS, asset-serving or CSP change. Source tsx and build serve17 byte-identical same-origin assets. [Graph + hashes](browser-dependencies.json) · [DOT](browser-dependencies.dot) · [Asset comparison](build-assets.json).

## Visual acceptance

| Suite | Result | Seconds |
|---|---|---:|
| formal | 16/16; 41 screenshots | 32.669 |
| style1 | 6/6; 6 screenshots | 7.927 |
| states | 60/60; 38 screenshots | 76.420 |

Formal16 covers390×844 (7),960×900 (2),1440×900 (7). Style1 keeps its existing390×844,768×1024,1440×900 available/unverified combinations. New P1/version0 browser journeys cover390×844 and1440×900. All suites use the same clean frozen SHA, actual loopback HTTP/SSE, PGlite and local Chromium with OS loopback-only isolation.

All85 screenshots were inspected through eleven contact sheets; the six new reconfirmation frames were also opened individually. The inline prompt and disabled booking state remain visible after F5. Initial exit keeps the existing transient error notice as well as the durable slot hint, preserving the old interaction assertion; F5 relies on the durable hint. No new layout regression observed. Existing error-notice auto-scroll can leave the heading partly above the viewport; long cards remain scrollable. Style/state photo placeholders are intentional; formal photo fixtures separately validate loaded bytes and Viewer. [Formal16](formal/manifest.json) · [Style6](style1-driver.log) · [States60](states-driver.log) · [Visual review](visual-inspection.json) · [Run provenance](visual-driver.json).

New frames: [desktop SSE lock](states/round18-desktop-sse-reconfirm.png), [desktop after F5](states/round18-desktop-reconfirm-after-f5.png), [desktop old-Handoff reload](states/round18-desktop-reload-reconfirm.png), [mobile SSE lock](states/round18-mobile-sse-reconfirm.png), [mobile after F5](states/round18-mobile-reconfirm-after-f5.png), [mobile old-Handoff reload](states/round18-mobile-reload-reconfirm.png).

Formal journeys retain login/SSE, condition edits/draft retention, G1 candidate/citations, photos/Viewer, second-slot restoration and B1 SQL departure identity. Expected initial session401, broken image410, deliberate conflict409, blocked external navigation and Chromium GPU warnings are recorded separately from unexpected application failures. The frozen formal oracle reports no unexpected errors. No booking-site GET is sent.

## Protection and evidence limits

Main HEAD/status/index/tracked bytes and main.env digest match the opening snapshot. All6176 pre-existing Unified evidence files, including frozen round6–17 and independent review outputs, plus70 restaurant-web-read files preserve SHA256. Prompt15, fingerprint, missingBlockingFields, historical Mikkeller note/behavior, protected ADRs, Domain/Core/AgentLoop, integrations/extraction/eval/scoring and dependencies are unchanged.

**Pre-existing closeout limitation:** closeout already lacked its .git file at the opening audit and its worktree registration was prunable. Round18 preserves the exact registry entry, absent-.git condition and residual nondependency file/symlink inventory. It did not repair or write there; closeout Git HEAD/index/status cannot independently be verified. Commits disable automatic Git maintenance/GC to avoid incidental pruning. [Protection check](protection-check.log) · [Opening inventory](protection-baseline.json) · [Sparse-tree check](worktree-check.json).

[Artifact SHA256 manifest](artifact-sha256.json) covers143 files; the report has its own [SHA256](REPORT.sha256). Manifest excludes itself and the two report files to avoid recursive hashing. No src change after freeze. All generated output is local; no source/config mutation during gates or visuals.

Evaluation layers: functional requested P1/P2 and three sibling races pass offline; stage evidence uses controlled dispatch/semantic windows, actual local HTTP200/409/201, server plan/history and SQL receipts; severity/independent real-source S0 and answer-quality review remain NOT_EVALUATED; attribution is separated by red latches and passing identity/revision/ownership assertions. No Live claim or real-device Safari/Android claim is made.

No Live, real model/Google/restaurant call, real PostgreSQL connection or4312 use. Fixture finally blocks close browsers, HTTP services and PGlite, and verification processes ended. No remote push or main merge. Stop here pending confirmation.
