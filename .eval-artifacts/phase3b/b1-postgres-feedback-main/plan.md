# B1 real PostgreSQL evidence: reviewed main integration

- Evidence status: draft / not integrated; reviewed database results remain frozen regression.
- Date: 2026-10-30 Vienna CET (UTC+1).
- Reviewed commit: d50f3e77e2b1ce6ea82ea0d0dbf16a0d4c04d3c2.
- Synchronized origin/main: 00519783b3f6a3e48a53a4a0a8b03c9621c8bcf7 (already an ancestor).

Slice: publish the approved real PostgreSQL verification evidence and its documentation on main. Preserve every original probe, migration, result and raw log byte. No product changes, new database run, source access, Google/model/Live call, credential loading, G3/B1 wiring or Japanese-name retrieval work.

Freeze the current product/test/config inputs and all reviewed PostgreSQL artifacts in a commit. Run input integrity, the five existing gates (typecheck, arch:check, npm test, build, test:browser:fixture), then integrity again. Each command must start and end with empty git status; logs are separate ignored outputs until delivery. No file restoration or test/expectation changes. Existing Chromium gate includes its ordinary G2 group; no additional G3 or real-source acceptance is claimed. Stop on a gate failure or a changed input. Evaluator/Gold are unchanged and no new quality evaluation is applicable.

After all checks pass, append the actual results to STATUS, DEVLOG, TEST-LOG and the monthly summary/index. Recheck origin/main immediately before merge; if it advanced, integrate it and rerun the applicable checks. Merge the evidence branch into main, push the approved branch and main without force, verify remote main with ls-remote, then wait for a separate user instruction.
