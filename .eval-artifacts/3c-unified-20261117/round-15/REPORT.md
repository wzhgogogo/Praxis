# Round 15 client modules and offline verification

Draft / not integrated. 2026-11-20. Worktree /private/tmp/praxis-3c-unified, branch codex/feat-web-photos-unified.

Baseline `35d0523f83bd5fd34904eb1409cdf66ce1b0b77c`. Stop backend slice `a07113b800663b63570ea89880bb6b5ae59f687a`.
Frozen acceptance source `8af0ec2a5991f7462ab352261e6371b1c476aaaa`. Evidence commit `2d52949100139789a173d2f87b08c204d6dfaeb6`.

[Interaction contract and module responsibilities](INTERACTION-CONTRACT.md)

## Changes and acceptance

Preparation and execution share a cancellation handle. Stop in the persisted preparation gap returns stopped state before the append is released, with zero subsequent provider calls. Stop after a concurrent shortlist re-reads the same investigation's latest snapshot and persists CANCELLED. Existing replacement-read 409 and natural-completion controls pass.

Position contains only view/candidate/batch position in sessionStorage. Explicit slots use a separate localStorage key bound to user, Case, requirement revision and restaurant. Empty inventory retains the explicit choice. A replacement offer for the same time rebinds automatically. Missing chosen time locks booking until explicit selection. Another tab's Back cannot overwrite the choice, and a storage event changing the choice exits an open Handoff.

Both newly reported booking cases passed through PGlite and actual loopback HTTP/SSE with Chromium. The existing suite covers inline area/date/time/party editing, clarification, drafts across plans, About questions and citations, feedback, Saved, batches, expiry and source departure. These runs use fixed Fixture semantics. They establish the UI transitions and request bindings, with no new real-source Osaka or Shibuya outcome.

Browser code is served as same-origin ES modules. Direct tsx startup compiles the modules once with the installed TypeScript compiler. Build emits those same modules under dist/web/browser. CSP script-src is self. The previous workspace String.raw and photo script paths have been removed. No dependency or lockfile version changed. Explicit restaurant navigation clears the previous choice as before; Back and inventory projection retain it.

The migrated DOM glue retains permissive parameter inference and dynamic session projection access. The independent DOM tsconfig checks every browser module without suppression directives. New pure slot storage/projection contracts have explicit types and their two tests are part of npm test. Inherited DOM/session glue uses permissive checking in this extraction. This is the remaining type-safety limitation.

## Frozen offline gates

| Gate | Result | Seconds |
|---|---|---:|
| Typecheck, backend and browser | PASS | 0.629 |
| Arch Guard | PASS, zero forbidden dependencies | 0.205 |
| npm test | 1784/1784 | 68.841 |
| Browser fixture | G2 5/5, Chromium 455/455, G6 159/159 | 416.424 |
| Build | PASS | 0.564 |

Every gate used the same clean frozen SHA and a minimal environment without dotenv. Replay children retain their OS network isolation. Combined G2 and Chromium summary is 460/460. [Original gate manifest](gates/manifest.json) · [First attempt](gates-first-attempt/manifest.json) · [Second attempt](gates-second-attempt/manifest.json) · [Native crash](gates-third-attempt/test.log) · [Isolated recheck](v8-recheck.log)

## Visual acceptance

Formal three-size suite 16/16, with 41 screenshots. Style 1 6/6, with six screenshots. State suite 40/40, with 25 screenshots. All images reviewed in contact sheets and key selection/empty/feedback frames opened individually. [Formal manifest](formal/manifest.json) · [Style log](style1-driver.log) · [State log](states-driver.log)

[Explicit reselection](states/round14-about-slot-reselect.png) · [Exhausted revision](states/round14-exhausted-revision.png) · [Case feedback](states/round14-feedback-after-return.png)

Initial migration diagnostics preserve the observed sidebar initialization and module-access failures. The first gate attempt failed an HTML-only fixture text assertion after the script moved to a served module. The second failed the deliberate restaurant-switch reset control. It was invalidated when work resumed and its cleanAfter is false. Both attempts are retained as failed diagnostics. A subsequent default run on the final SHA hit the pre-existing Node 24.4.1 V8/Wasm native crash, Check failed: end > addr. The crash and the isolated handoff-visibility recheck are retained, followed by a full unchanged-SHA rerun. The final gates and visuals use the one clean acceptance SHA. The final freeze includes those corrections. Preflight browser closure passed 49/49 and backend/pure closure 13/13. [Initial integration](preflight/integration.log) · [Integration recheck](preflight/integration-recheck.log) · [Final browser preflight](preflight/final-preflight.log) · [Backend and pure tests](preflight/pure.log)

## Protection and limits

Protected material hashes match the initial inventory, including main, closeout, main .env, Prompt 15, search fingerprint, historical Mikkeller note and Round 6–14 evidence. External review outputs are retained. [Protection check](protection-check.log) · [Artifact hashes](artifact-sha256.json) · [Report hash](REPORT.sha256)

All work stayed local. The runs used loopback HTTP/SSE and PGlite, with no Live, real PostgreSQL or port 4312. Processes and local fixture connections ended after the suites. No push or main merge.
