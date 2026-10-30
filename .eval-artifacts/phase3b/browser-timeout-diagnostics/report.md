# Browser suite outer timeout diagnostics

结论：2核Linux连续5次完整套件均186/186；原600秒卡住**未复现**，原因仍未知。本批仅交付诊断改进，无具体浏览器测试修复；五门禁全绿，真实业务调用0，等待复核，不合main。

Report time: 2026-10-30T18:18:49.551516+01:00 (Vienna CET, UTC+1).

Evidence status: draft / not integrated; exposed offline fixtures. This report concerns the test entry and its diagnostics, not a new Live capability or a diagnosed browser-test root cause.

Base main: `7c83e02ee78ccb18c9ddf6670a64823bb18a2c95`. Work branch: `codex/fix-phase3b-browser-timeout-diagnostics`. Final executable sources first frozen at `09ce7536`; Mac verification at `c300d268`; Linux verification metadata at host `6c6df8476a09ab050cad63872d15f92817e29060`. The three executable source files are byte-identical across those freezes. Input manifest: 718 source, fixture, configuration and orchestration paths. All report timestamps are Vienna CET (UTC+1); task-directory identifiers use the client's 2026-10-31 task day. Original raw logs retain their original explicit timezone.

## What changed

The parent no longer blocks in `spawnSync` while the whole phase runs. It streams received stdout/stderr and consumes a separate lifecycle pipe, independent of Node's ordered spec output. Genuine `node:test` file dequeue/complete events identify file start/end. The 600-second phase guard snapshots every started-but-unfinished filename, elapsed time since observed start, and last observed test names. Files not yet started are reported separately. File-end records include duration and pass/fail status during ordinary runs too.

Test events can be buffered by Node: `lastObservedTests` is explicitly labelled as observed metadata, rather than proof of which test is currently blocked. A missing file/test event is not guessed. The native file lifecycle is tracked separately, so a completed later file is not mistaken for an unfinished file just because its spec output is waiting behind an earlier one.

On timeout the command fails even if a child later exits with code 0. The worker uses the public `node:test.run()` API with the same process-isolated files, imports, order and concurrency. It cancels through an AbortController and awaits the spec output pipeline. This was necessary because the native CLI termination path discarded buffered output in a local control. A further five-second bound permits forced process-group cleanup. Parent interruption uses the same bounded lifecycle. No force-exit shortcut was added to ordinary tests. Missing summaries, missing lifecycle completion and child failures still fail closed.

G2 remains exclusive with concurrency 1, followed by the remaining files with concurrency 4. Its original 180-second lifecycle assertion is unchanged, as is the 600-second phase limit. All 37 browser test files are byte-identical to the base. Only two scripts and the A-owned scheduling test change executable behavior; product code, B/C tests, site directories, source-packs, Gold/scorer, Prompt/Schema/State and package dependencies remain unchanged.

## Diagnostic red and green

The historical old entry was frozen before execution. A local construction has held, completed and queued files, with only the isolated copy's outer guard scaled 600,000→3,000 ms. It exits ETIMEDOUT, keeps some output, but fails the independent diagnostic predicate requiring UNFINISHED + held filename + elapsedMs. This is an effective diagnostic-contract red, **not reproduction of the reviewer's intermittent 600-second failure**. Original source SHA, scaled-copy SHA, raw log and receipt are retained under diagnostic-red/.

The existing scheduling regression retains its original G2 ordering, complete corpus count and deliberate child-failure assertions. The helper-copy list only gains the worker. One new default regression uses genuine process/file/test/output events and an injected outer clock. It advances to logical 600 seconds only after a held test has emitted output, another file has completed, and another held file has started. It checks both unfinished files and their elapsed time, excludes the completed file, separately lists the queued file, and proves that output buffered behind the held file survives cancellation. It does not shorten a browser test timeout or depend on a fast machine.

Default test count therefore changes 1242→1243; Chromium remains 186. All pre-existing scheduling assertions and all browser test contents are retained; preservation.json records the checks. Mock/local construction and actual ordinary Linux repetitions are separate evidence.

## Environment and boundaries

A task-only Lima 2.0.0 / VZ Debian 12 ARM64 VM has two vCPU, 6 GiB, Node 24.4.1 and real Chromium Headless Shell 151.0.7922.34. A guest-only channel=chrome alias supports the existing fixture; this is not a branded Chrome claim. CPU affinity is 0,1; all effective ancestor cpu.max quotas are max, without added pressure. Host mounts, personal profiles, SSH agent forwarding and .env are absent. The full tracked Git source archive and the two verification-metadata delta files were checksummed; no floating checkout or source change occurs during verification.

After public developer dependencies were installed, IPv4/IPv6 policy routing blackholes external destinations with only loopback and the task SSH peer exempt. TEST-NET route lookups verify the block without sending network probes. Rules remain effective if DHCP renews the main default route. Setup downloads are separately recorded developer tooling, not restaurant/evaluation GET or model traffic. Ordinary runs use no artificial CPU quota, reduced browser budget, automatic retry or parallel batch of full suites.

The public Node run API retains the same file engine/isolation and observed concurrency, but an entry change may affect timing. This VM is not the reviewer's physical machine; no universal speed or root-cause repair is inferred from a pass.

The first Mac orchestration attempt correctly ran typecheck, arch and npm test successfully, then its metadata assertion incorrectly expected zero suites. The frozen main receipt independently shows five suites. That wrapper assertion was corrected to five and all gates were run again; the earlier raw run is preserved as incomplete orchestration, not counted as a failed product test or an intermittent-hang reproduction. A Linux-only preflight was also corrected before Linux tests: an absent root cpu.max is unlimited, and every effective ancestor quota is checked. Executable scripts/tests did not change in either metadata correction.

## Ordinary two-CPU reproduction results

Five consecutive **complete** suites, all on the same frozen files and the same VM; no failed run was retried or excluded. The 600-second guard never fired. There is therefore no captured hanging filename or test, and no evidence permitting an attribution to a wait, browser process, port or timer. Only the diagnostic improvement is delivered under item 3 of the user instruction.

| Run | Result | Whole-command seconds | File starts/ends | Timeout |
|---|---|---:|---:|---:|
| 1 |186/186|142.532|37/37|0|
| 2 |186/186|140.923|37/37|0|
| 3 |186/186|141.117|37/37|0|
| 4 |186/186|140.353|37/37|0|
| 5 |186/186|141.897|37/37|0|

Minimum 140.353s, median 141.117s, mean 141.3644s, maximum 142.532s. Every round observed maximum file concurrency G2=1 / remaining=4, every file started and ended exactly once, and fail/cancelled/skipped/todo are all zero. Each phase is represented; no small cohort substitutes for the full corpus.

The reviewer's ordinary pass was279s and this VM is faster. Both expose two CPUs, but they are not the same hardware/load. This result is not a reproduction or closure of the original672s command/600s phase failure. The following slow files were observed; none is labelled the historical culprit.

| File | Min seconds | Median seconds | Max seconds |
|---|---:|---:|---:|
| `src/harness/browser/browser-read-discovery.test.ts` |48.704|48.950|49.265|
| `src/harness/browser/browser-read-stability.test.ts` |48.334|48.392|48.794|
| `src/harness/browser/browser-read-tablecheck.test.ts` |43.500|43.775|43.917|
| `src/harness/browser/browser-read-request-binding.test.ts` |32.943|33.137|33.318|
| `src/harness/browser/browser-read-category.test.ts` |26.457|26.498|26.836|
| `src/harness/browser/browser-read-search-controls.test.ts` |24.776|24.819|24.897|
| `src/harness/browser/dom-change.test.ts` |21.945|22.384|23.938|
| `src/harness/browser/browser-read-regions.test.ts` |20.450|20.644|20.959|

All 37 per-file distributions and the slowest individual test observations are retained in [reproduction-analysis.json](reproduction-analysis.json); all five lifecycle streams and raw compressed logs are under [linux/](linux/). After the five runs, the VM had no live or defunct Node/Chromium processes ([process receipt](linux-vm/post-runs-processes.json)). That is a completed-run observation, not a diagnosis of the reviewer's failure.

## Five gates and preservation

| Environment | Gate | Result | Seconds |
|---|---|---|---:|
|macOS|typecheck|PASS|0.496|
|macOS|arch-check|PASS|0.206|
|macOS|npm-test|PASS|28.685|
|macOS|build|PASS|0.473|
|macOS|browser-1|PASS|130.017|
|Linux 2CPU|typecheck|PASS|1.020|
|Linux 2CPU|arch-check|PASS|0.316|
|Linux 2CPU|npm-test|PASS|111.772|
|Linux 2CPU|build|PASS|0.722|
|Linux 2CPU|browser-1|PASS|142.532|

Default1243/1243 and browser186/186 pass on both environments. G2's five cases are included in every browser command; the ordinary G2 phase is complete and unchanged. Separate strict G3/G2 and Live checks are NOT_RUN for this test-entry-only slice. Full receipts: [macOS](macos/verification.json), [Linux](linux/verification.json). Every gate has clean Git status before/after and verifies its frozen input manifest; no file restoration is used. Mac's three executable hashes equal the final Linux/branch hashes even though the documented verification-only metadata correction follows the Mac freeze.

[Preservation](preservation.json) confirms all 37 browser test files, original scheduling assertions, product/site/source-packs/Gold/scorer/Prompt/Schema/State and dependencies are unchanged. The extra worker is copied by the original local-entry test. One distinct default diagnostic-contract test is added. All486 prior budget entries are preserved as the same objects, plus one id-unique zero-consumption entry (487 total); no limit or previous entry changes.

[Legacy red](diagnostic-red/red.json), [condition-driven green](diagnostic-green.json) and raw logs separate the diagnostic contract from real repetition. Earlier incomplete Mac orchestration is preserved under [macos-incomplete-orchestration/](macos-incomplete-orchestration/); it is not counted as one of the five Linux attempts. Test/environment setup probes are not silently relabelled as product regressions or successful full runs.

## Calls, cleanup and stop

Execution mode is Mock plus real local Chromium/fixed saved pages. New real model/Google/restaurant website/evaluation GET/Live calls are all0; no.env read, load, copy or staging. Replay of a Live recording and Controlled Live-write are NOT_RUN. Public developer runtime/dependency downloads are separately recorded in linux-vm/; their checksums and any resumed-download setup remain distinct from evaluation requests.

Results were transferred and all raw log SHAs verified before cleanup. The task VM was stopped/deleted; runtime, image/range downloads, source archives and ephemeral SSH state were removed, with no host-global install or personal profile attached. [Cleanup](linux-vm/cleanup.json), stop/delete logs, empty instance list, official download hashes and transfer receipt are retained. Six orphaned processes from early **local development probes** were explicitly cleaned before formal Mac verification; formal completed Linux runs leave none. This is not a claimed fix for the unknown original hang.

The user-visible promise delivered is diagnostic: a future outer-guard failure will identify started-but-unfinished files and their elapsed time and retain received/buffered output. Original intermittent root cause remains unknown. STATUS/DEVLOG/TEST-LOG/monthly index are synchronized; git diff --check and final clean status are required at delivery. Commit/push this work branch and verify remote SHA, then stop for review. Do not merge main.
