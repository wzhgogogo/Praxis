# Round 20 stopped questions, discovery intent and source presentation

Draft / not integrated. 2026-11-21. Worktree `/private/tmp/praxis-3c-unified`, branch `codex/feat-web-photos-unified`.

Baseline `b019f368221581497d91f54c5b20eb959e90b5b9`. Three functional slice commits: `da7bf5e4b3319e2f80aaf38bc2bdec7d73ed6dc8`, `13de7608891f5b817813c811b919a5f04d7f4463`, and unique source/config freeze **`5af7970180a92214b9eb210d95e0752b0ac7aa82`**. Evidence-only commit `15ded154b592697748ad3f4ea85a7f45b345a72b`. Report/docs commits do not change src. [Frozen inputs](freeze.json) · [Slice contract](PLAN.md) · [Acceptance data](acceptance.json).

## Slice 1: stopped About and truthful progress

One domain authority now admits only presented results or stopped/CANCELLED openable candidates to page questions. Reducer request/completion, action validation, application checks/cancellation, projection, frontend and the execution-router guard use that boundary; MODEL_FAILURE, NO_VERIFIED_RESULT, ordinary failure and OUTCOME_UNKNOWN remain excluded. Pending stopped questions run with active lifecycle/progress and immutable handle identity. About has an inline Stop for preparation and execution; completion returns to Stopped and retains answer/cancelled history across reload. Round8 Saved/Refresh restrictions remain.

Progress is tied to the exact semantic request event: not yet committed is UNDERSTANDING, committed discovery before SEARCH_COMPLETED is FINDING, and subsequent/source refresh work is CHECKING. A busy HTTP edit can show authoritative deferred SSE progress while its main Case projection stays frozen. The old409 control now asserts that unchanged Case version separately from progress completion, retaining conflict/draft recovery.

Targeted24/24 unit and35/35 related browser controls pass. Desktop/mobile journeys cover stopped question preparation Stop with0 question source calls, execution Stop, normal answer/modal/history/F5; semantic and search barriers, SSE reconnect, Stop, clarification and model failure. The missed execution-router guard was an actual same-chain obstruction found during targeted testing and closed in this slice. [Unit24](slice1-final-unit.log) · [Browser35](slice1-controls.log).

## Slice 2: inherited query, Google admission and revision comparison

Inherited OPEN_ENDED query maintenance removes withdrawn criteria and old area while preserving valid general intent and nonempty query. Explicit target (including clear), SPECIFIC_OUTLET, goal, scope and requested count remain protected. Google ordinary search, named search and detail recheck carry the same contextual intent; restricted dessert/snack/takeaway types cannot bypass admission through primary, suffix or missing-primary fallbacks. Generic evening Age.3-style mixed cafes reject, explicit cafe/dessert and named-outlet controls remain accepted, negative criteria remain binding. This changes admission, not source extraction, budgets, field masks or scoring.

Revision differences skip clarification-only revisions and compare with the last searched/presented/ended-empty revision. A genuine empty previous search is retained; its fixture now contains SEARCH_COMPLETED and READ_ENDED_NO_VERIFIED_RESULT, with the original business assertion intact.147/147 targeted domain/compiler/validator/Google adapter/projection regressions pass. [Unit147](slice2-final-unit.log).

**Authorized changed file:** `src/domains/restaurant/intent-state.ts` is not whole-file unchanged. User explicitly authorized one necessary import and one call inside applyRestaurantIntentPatch. Before SHA256 `79f7988b34c223366f7a0f82f5234022c22392e49166a1eca892e7caa1120f98`; after `7d14bd2fb2a7d576893d51a2bb9fe7a38e37448c4ba02c84b58edd15f7ed51ab`. Removing exactly those two additions reconstructs the baseline byte-for-byte: missingBlockingFields, its dependencies and every other function/text are unchanged. Round19 protection records remain original. [Authorization](intent-state-authorization.md) · [Exact diff](intent-state-authorized.diff) · [Hash/text proof](intent-state-authorized.json).

## Slice 3: cards, source reading groups and About

Clean source names/domains and normalized category overlap replace enum leakage and false conflicts. True conflicts retain light per-source links; About keeps full category wording. Availability/conditions align in two columns, requested spacing and compact recommendation are applied, postal prefixes are cleaned only on cards, and the searching counter hides without collapsing width. Batch end has equal Adjust/Find more actions and header Saved; revisions show new counts first, static added-only wording and cleared stale hidden content.

Two shared strict modules group and render citations by exact (URL, readAt). Same-reading excerpts share one source/Checked Tokyo-time footer; different readings and unknown timestamps remain distinct. Handoff preserves original excerpts, per-term bilingual/context labels and cancellation conflict notice. About layers source/time, full address, conditions, commercial text, categories and footnotes. The answer sheet repeats the question, adds the place/close header, retains drag dismissal and safe-area bottom space.

New dual-size UI8/8, pure contracts5/5, Style1/Round4 controls16/16, focused corrected controls4/4 and full affected workspace/slice2 controls56/56 pass. [New UI8](slice3-new-browser-green.log) · [Pure5](slice3-pure-final.log) · [Workspace56](slice3-workspace-controls-green.log) · [Focused4](slice3-controls-fixed.log). The broad development run initially passed153/164: failures were changed source/metadata/revision wording, hidden-counter semantics and the now-authoritative deferred progress. Corrected tests preserve business assertions. Initial setup/geometry diagnostics remain separate from frozen acceptance. Node24 assertion formatting left diagnostic children after gentle termination; six exact Round20 commands/cwds were verified and force-ended without touching the gate. [Initial diagnostics](slice3-affected-browser.log) · [Cleanup evidence](diagnostic-process-cleanup.json). Early gate timing includes that temporary CPU contention; no performance comparison is claimed.

## One clean frozen five-gate run

| Gate | Result | Seconds |
|---|---|---:|
| Typecheck | PASS: backend + strict browser | 1.094 |
| Arch check | PASS:0 forbidden dependencies | 0.372 |
| Default tests | 1820/1820 | 100.869 |
| Browser Fixture | G2 5/5; Chromium 493/493; G6 159/159 | 424.698 |
| Build | PASS | 0.573 |

All use `5af7970180a92214b9eb210d95e0752b0ac7aa82`, clean before/after and a minimal environment, no dotenv. This is the sole complete frozen gate run. Browser Fixture has no outer sandbox; Replay children retain their own OS denial assertions. Other gates deny nonloopback traffic at OS level. G2+Chromium aggregate 498 is distinct from G6 159. All10 Round19 restore/resolved-lock journeys and all8 new Round20 UI tests pass in the formal browser gate. [Raw manifest/logs](gates/manifest.json).

Strict:true,18 singleton import SCCs,0 cycles,0 any/suppression directives and no reverse entry import.19 source/build JS assets and the workspace HTML/CSS match byte-for-byte. No new dependencies or CSP relaxation. [Dependency graph](browser-dependencies.json) · [DOT](browser-dependencies.dot) · [Assets](build-assets.json).

## Visual acceptance and inspection

| Suite | Pass | Images | Seconds |
|---|---:|---:|---:|
| Formal390/960/1440 |16/16|41|31.996|
| Style1 |6/6|6|7.791|
| State regressions |78/78|74|99.554|

All suites use the same clean frozen SHA with loopback HTTP/SSE, Chromium, PGlite and OS nonloopback denial.121 images inspected through15 contact sheets; all26 new/changed Round20 key frames additionally opened individually. **One visual requirement remains open:** at390px the question-sheet source/time footer is one logical record but wraps to two physical lines. The literal single-physical-line requirement is not closed. Browser assertions verify grouping/count/timestamps, not physical line count. This is recorded as ONE_DISPLAY_DEVIATION_OPEN, separate from the100% automated suite results; frozen src is unchanged. Other image-specific findings/layout limits are recorded in [inspection](visual-inspection.json). [Formal16](formal/manifest.json) · [Style6](style1-driver.log) · [States78](states-driver.log) · [Provenance](visual-driver.json).

Key frames: [aligned card](states/round20-1440-aligned-card.png), [source domains](states/round20-390-source-domains.png), [About layers](states/round20-1440-about-layers.png), [equal batch actions](states/round20-390-batch-actions.png), [revision summary](states/round20-1440-revision-mixed.png), [one reading](states/round20-390-same-reading.png), [different readings](states/round20-1440-different-reading.png), [bilingual Handoff](states/round20-1440-handoff-reading-groups.png), [stopped question](states/round20-mobile-stopped-question-preparing.png), [reloaded answer](states/round20-desktop-stopped-question-reloaded.png), [understanding barrier](states/round20-mobile-semantic-progress.png), [finding after reconnect](states/round20-desktop-finding-reconnected.png).

Formal journeys retain login/SSE, inline edits/draft preservation, G1 candidate/citations, galleries, second-slot/B1 restore and SQL departure identity. Expected initial session401, broken-image410, deliberate409 and blocked nonlocal navigation are separate from unexpected app errors. No real booking-site GET.

## Protection and remaining boundaries

All 9208 opening Unified evidence files (including prior frozen rounds/review directories) and 110 restaurant-web-read files preserve SHA256. Main HEAD/status/index/tracked bytes and main.env digest match the opening snapshot. Prompt15, fingerprint/contracts, missingBlockingFields and all unauthorized intent-state text, fact judgment, Core/Runtime, server, infrastructure, eval/scoring, dependency manifests and protected ADRs remain unchanged. Only the explicitly requested application/domain/Google paths and frontend/tests/docs change. Historical Mikkeller note/behavior is retained. [Protection audit](protection-check.log) · [Baseline hashes](protection-baseline.json) · [Verifier](verify-protection.py) · [Sparse check](worktree-check.json).

Closeout already lacked .git and had a prunable registration. Exact registration and residual file/symlink inventory are unchanged; its Git HEAD/index/status cannot be independently checked. No repair or maintenance pruning. All local commits disable automatic maintenance/GC.

[Artifact SHA256](artifact-sha256.json) covers 229 files; the report has its own [SHA256](REPORT.sha256). Report/its digest/artifact manifest are excluded from recursive hashing. No src changes after freeze. Fixture finally blocks close browsers, local servers and PGlite; verified diagnostic orphans are gone. [Process completion](process-completion.json).

Evaluation layers remain separate: functional contracts/controls PASS offline; stage evidence comes from actual Fixture HTTP/SSE/PGlite paths plus explicitly identified controlled projection tests; independent real-source severity/S0 and answer-quality review remain NOT_EVALUATED; failure attribution separates stopped-question eligibility/execution, event-bound progress, inherited query, type admission, revision baseline and source presentation. Constructed projection/adapter tests and recorded component regressions do not prove current external sources or new Live capability.

No Live, real PostgreSQL,4312, external model/Google/restaurant calls, push or main merge. Real-device Safari/Android and current-source quality are untested. Stop pending confirmation.
