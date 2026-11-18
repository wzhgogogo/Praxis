# Round-4 — DAYPART and workspace closure

Status: PASS for this frozen offline slice; draft / not integrated. No new Live or Clean Baseline claim.

- Worktree: `/private/tmp/praxis-3c-unified`
- Branch: `codex/feat-web-photos-unified`
- Starting SHA: `b46d0a0a181cd5aa5c792b461f8320d0a19af8df`
- Domain commit: `6933f4a20c841ca73a07b279a3b29ce1ac3e42eb`
- Web/Application commit and unique frozen SHA: `60a4e962e4804ee80f43a7b4b1f245061c6a5ca7`

Code, tests, recorded regression input, gate and visual orchestration were committed before acceptance. Raw gate output, tested SHA, exit codes, seconds and counts are in `gates/manifest.json`. Formal three-size16-scenario visual acceptance runs only after all five gates pass.

## Archive and operating boundaries

Four user Live groups (20 files,2 Cases) were redacted and archived under `../user-live-20261118/`. Its manifest records raw/sanitized SHA256 and byte counts. Sanitized files were re-read and verified; original source hashes were checked again before clearing the temporary directory. Main `.env` was read only as a literal-secret dictionary for archive redaction, never loaded into process configuration or printed. Offline validation does not load `.env`.

The confirmed own worktree preview PID36169 and related LAN forward PID36701 were stopped; port4312 released (`port-release.json`). No connection/write/cleanup of `praxis_smoke`, no new Live, model, Google or real website calls.

## Domain and independent diagnostic

Effective DAYPART basis survives date/party patches and reaches Google discovery/Details and website facts. EVENING/AFTERNOON/AFTER_WORK accept one positive source-interval intersection and record the actual supported subset. Explicit numeric windows retain full coverage with an exclusive close; split shifts are never fused and no duration threshold is introduced. RECOMMENDATION identity/area/HARD eligibility remains unchanged. New composition regression confirms sufficient Google facts avoid website fallback.

Recorded03:52:25 MIRAI input, source SHA and historical clock are in `src/harness/fixtures/daypart-mirai-recorded.json`. Original archive bytes are untouched. Offline counterfactual re-grounding of Google Friday11:00–22:00 against evening18:00–23:00 supports18:00–22:00 and passes production recommendation eligibility. The independent diagnostic parses recorded hours separately and reports no hours conflict; removing DAYPART is a negative control that triggers the conflict. This construction is not a new Live observation, qualified Live or independent S0 clearance.

## Web/Application

Saved uses the exact frontend-openable IDs; expired presented cards remain browsable and booking follows existing refresh checks. Interrupted/cancelled/failed/all-source-failed reads do not infer removal. Revised titles use current criteria/area/date/time/party instead of the stale retrieval query; initial titles remain. Current clarification is projected separately, main messages depend on state/view, and G1 remains in Details. Cards show condition conclusions; About keeps quotations/source/read times. Each answer uses one Source disclosure, retaining every quotation/read time and deduplicated source-page URLs. Busy pseudo-elements use border-box; Adjust retains drafts and adds temporary focus guidance.

## Acceptance results

All five gates ran on the same clean frozen SHA, with no `.env` configuration loading.

| Gate | Exit | Seconds | Raw summary counts |
|---|---:|---:|---|
| npm run typecheck | 0 | 0.518 | PASS |
| npm run arch:check | 0 | 0.200 | PASS |
| npm test | 0 | 61.312 | 1704/1704 (fail0) |
| npm run test:browser:fixture | 0 | 388.456 | 5/5 (fail0); 404/404 (fail0); 409/409 (fail0); 159/159 (fail0) |
| npm run build | 0 | 0.529 | PASS |

Browser summaries are G2 exclusive5/5, remaining Chromium404/404, combined409/409, followed by G6 assembly159/159. The combined409 is an aggregate, not an additional test denominator. Default1704/1704; zero failures/skips/cancellations in the final acceptance.

Formal visual HTTP/SSE Fixture matrix:16/16 (390x844:7;1440x900:7;960x900:2). Each scenario validates SSE, photo state, G1 as applicable, second-slot B1 restoration, local SQL departure persistence and context-wide external navigation interception. No unexpected local HTTP errors, application console errors or page errors; expected initial401, constructed broken-image410 and blocked external navigation are recorded separately in each JSON.

Ten new Round4 Chromium regressions pass (five each at390x844 and1280x900): expired Saved/refresh; interrupted revision/messages/title/reload; About timed sources and grouped3-citation Q&A; exhausted-empty Adjust; structured clarification/retry/history isolation. All original gallery/current-photo/draft/source-read invariants remain, with obsolete Details-progress synchronization changed to server active state and SSE-updated plan status plus explicit hidden-progress checks. Strict Google8/8 exact16-dispatch and website-only Lookahead1 regressions also pass.

Domain development59/59 and independent diagnostic2/2, projection19/19, and targeted About repair13/13/photo-SSE2/2 are retained as development evidence; frozen default/browser totals above are acceptance.

## Unverified

No new Live, PostgreSQL connectivity, physical Safari/Android Chrome, current real website data or credential probe. Prior Live/evaluation originals remain; the earlier numeric G1 capacity clause remains unsupported by its three citation snippets. No main merge or remote push.


## Preserved failed freezes

`d04b6b09604c8c12ea7c6fdc2af3f20e5a8b8f57` failed the existing About commercial-source test due to duplicated visible/quoted text. After the first observed failure, the browser worker was explicitly aborted:42 cancellations are recorded, not a natural fixture timeout. G6/build/visual were not run. Product rendering was repaired without changing that existing assertion.

`6387eb21cadad854668c71346033b83e56a56686` passed default1704 and G2 5; remaining Chromium402/404 failed only the two obsolete Details-visible-progress synchronization expectations. G6/build/visual were not run. These were adapted to the requested hidden-progress contract while retaining every photo/gallery/draft/source assertion. Both attempts retain raw logs, manifests, SHA256, source patch and exact incremental Git bundle under `failures/<SHA>/`; neither is called a passing baseline.

## Integrity and evidence

`integrity-after.json` confirms prior root gates/failures/round-2/round-3 file-set and byte hashes unchanged; main/closeout Git status, HEAD and diff hashes unchanged; main.env SHA unchanged;20 archive hashes verified; temporary directory empty;4312 has no listener. Worktree check confirms sparse checkout; no historical material was widened/restored this round. Database contents were not queried for comparison: no PostgreSQL connection or mutation occurred.

Raw gates: `gates/*.log`, `gates/manifest.json`; visual results/screenshots: `visual/manifest.json`, `visual/*.json`, `visual/*.png`; final SHA: `freeze.json`; full acceptance: `acceptance.json`. Key visual screenshots include `visual/mobile-google-about.png`, `visual/desktop-google-about.png`, `visual/breakpoint-google-short-credit-address.png`. Development screenshots of the exact final product rendering are in `regression-screenshots-final/`; source changes after that capture only adapted test synchronization and audit records.


Resource-closeout detail: initial TERM released4312, but the final process audit found the old preview36169 still alive without a listener. Its worktree cwd and exact server entry were rechecked, then it was force-closed; both original preview/forward PIDs and all own browser/Web processes are now absent. No database cleanup or new PostgreSQL command/query was performed. See process-closeout.json and port-release.json.
