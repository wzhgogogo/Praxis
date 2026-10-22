# Phase 2c: baseline reconciliation required

Evidence status: draft / not integrated. This is a preparation blocker, not a product failure or completed repair.

The requested branch `codex/fix-phase2c-location-semantic` has been created from the fetched latest `origin/codex/feat-live-restaurant-read-path`, `06703ba10d03cf7f5d3b5f2cba41a4bf92ba4414`, in an isolated worktree. The user's main-worktree edits have not been changed.

## Blocker

The specified mainline does not contain the reviewed Checkpoint C / Phase2b implementation that produced the saved artifacts and the regression baseline this task must preserve. Commit `06287b6f` is not an ancestor of the specified mainline. The two trees differ in 98 source files, with 4,950 insertions and 527 deletions.

| Contract | Requested mainline | Reviewed Phase2b evidence tree |
| --- | --- | --- |
| Restaurant State | 16 | 20 |
| Restaurant Agent Prompt | 25 | 27 |
| Diagnostic Evaluator / rubric | 29 / 25 | 33 / 29 |

The Phase2b tree includes previously reviewed selection, condition display, calendar, group/window and evaluator changes that are absent from the requested mainline. The saved 69/69 calendar, 5/5 selection and 22/22 calibration records belong to the reviewed evidence tree. They cannot be silently presented as proof that a repair of the older mainline preserves that implementation.

Version literals, file hashes, the exact source-file difference list, and regression-record locations are in [baseline-evidence.json](baseline-evidence.json). No product files have been copied from another branch and no merge has been performed.

## Decision recorded and stop

The user explicitly required recording and stopping when a decision is needed. A silent merge of these 98 source-file differences would expand this batch beyond its three repairs. Conversely, proceeding against the older implementation would require changing what the requested regression-preservation promise refers to.

Recommended next step: integrate the already reviewed Phase2b implementation into the designated mainline, then select that integrated commit as the base of this repair branch. This report does not authorize or perform that merge.

## Current slice and pending verification

1. Location resolution: not implemented. The prior exposed Ningyocho diagnosis and current Google resolver/client were read; Ebisu evidence extraction, paired saved-response replay and the committed 30-place Google check have not started. No claim about the cause of Ebisu's empty response is made.
2. Semantic fidelity: not implemented. No semantic replay requests have been sent.
3. Goya availability: not diagnosed or modified. No website has been opened.
4. Gates, source-specific line-count audit, and final STATUS / DEVLOG / TEST-LOG synchronization: pending implementation. No source-code gate is claimed for this document-only preparation result. The quoted 69/5/22 numbers are historical records, not new executions.

For this preparation record, verification consists of Git ancestry, exact version/hash inspection, the source diff, JSON parsing, report-link checks and document diff checks. Evaluator execution is not applicable: no new restaurant task or model execution was performed. End-to-end outcome, current external behavior and new S0 evidence are NOT_EVALUATED.

New real model calls: 0. Google requests: 0. Restaurant website requests: 0. Complete Live: 0. The new private holdout was not read or searched for. Mainline and other worktrees remain untouched. This incomplete batch is recorded locally only; push authorization was conditioned on completing the work and self-checks, so no push is performed at this stop.
