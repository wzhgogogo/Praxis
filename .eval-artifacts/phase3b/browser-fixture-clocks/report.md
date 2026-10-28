# Browser fixture timing repair report

Status: verified offline candidate / not integrated; work branch `codex/fix-phase3b-browser-fixture-clocks`. Vienna CET2026-10-28.

## Outcome

Both reported timing-sensitive fixtures are repaired with no assertion weakening and no new/removed tests. Five gates pass on macOS and on a2vCPU Linux VM; **three consecutive full4-worker Linux Chromium suites pass175/175** with clean state before/after every gate.665 frozen source/input hashes match before and after. New model/Google/restaurant website/Live calls0; no.env load/read/stage.

G1 evidence/reference work was separately merged and pushed to main**cab27890caf8f2860be185711c11fe9106becfb7** (remote verified). Human102-trial judgments are84PASS/18qualityFAIL/**falseclaims0**. Old automated evaluations remain unchanged. Dataset@3 adds only confirmed PASS expressions;11 human-PASS trials still fail old quote/regex requirements, documented in the G1 follow-up. This timing branch changes only four A-owned eval/harness source files, not B G1 implementation.

## Effective red and diagnosis

Unmodified source archive7bd5d2a4 has the same original target source as maincab27890. Real Chromium,2vCPU/6GiB Debian12 ARM64, Node24.4.1, four workers, OS network disabled except loopback.

- Ordinary affinity0,1 full suite:175/175 PASS,142.508s. One-core affinity0 full suite:175/175 PASS,163.029s. These did not reproduce the reviewer's machine; they remain explicit passing controls.
- A final bounded pressure group used the two target files and two actual browser fixture load files, affinity0,1 and guest cgroup CPU quota`25000 100000`. It reproduces **G2 closure at33.603s**, while reading real control visibility: `elementHandle.isVisible: Target page, context or browser has been closed`. The mechanism is the same30s per-page AbortSignal closing valid work as the reviewer's page.evaluate error; the exact failing primitive differs and is not relabelled.
- The health test fails at34.899s with `Got unwanted rejection: slow-last-snapshot`, `ENV_FAILURE: source data unavailable: tabelog, tablecheck`. Browser startup/rendering consumed the wall1000ms fixture window before usable evidence could finish.
- Target failures precede the240s pressure limit. The auxiliary discovery load was cancelled at that limit: overall group15PASS/2FAIL/1cancelled, orchestration exit124. This is **not** a173/175 full-suite reproduction or a clean completed group. Both target failures are independently present in the raw log; the auxiliary cancellation is not counted as a target red.

[Red source freeze](red-source-freeze.json), [verified target failure summary](red-verification.json), raw logs under red-1/red-2/red-3 and commands under linux-vm/. CPU throttling evidence is retained. No test code changed before these failures.

## Implementation

1. G2 inherits the owning test's AbortSignal and awaits actual page/snapshot/control/mutation completion. The existing overall test180s bound and navigation10s bounds remain unchanged; no independent30s per-page lifetime can retire an otherwise valid read. CLI uses one total180s bound shared by all12 pages rather than up to12 separate30s timers. Cancellation still propagates through the real BrowserRuntime and cleanup. This changes lifetime ownership, not a simple timeout increase.
2. Health fixture uses a separate injected observation clock for each source/attempt, including late-snapshot mode. Factory receives sourceId, with production/default wall-clock behavior and10s health window unchanged. Actual startup and CPU work do not consume logical fixture time. Browser Clock still causes the actual300ms late busy DOM mutation after the first visible result.
3. Late-snapshot control first completes real ready observations, then lets a later real snapshot delivery cross the unchanged1000ms logical deadline by220ms. Added checks require prior complete evidence, last read still pending at cutoff, and elapsed1000–1100ms. All original healthy/busy/403/challenge/Guard/GET/no-reserve/backoff assertions remain.

Modified source: src/eval/restaurant/dom-change/run.ts; src/eval/restaurant/agent-loop/live-source-health.ts; src/harness/browser/dom-change.test.ts; src/harness/browser/live-source-health.test.ts. Product browser/Guard/adapters/Pack, G1 core, Prompt/Schema/State and production source paths have zero diff from maincab27890. No private site logic moved or removed.

## Verification

Frozen source commit61138c94 (implementation3970d4b3 plus committed verification scripts). [All input hashes](green-inputs-sha256.json), [machine verification](verification.json), [Linux source/network/cpu receipt](linux-green/environment.json), [cleanup](linux-vm/cleanup.json).

| Environment / gate | Result | Seconds |
|---|---|---|
| macOS / typecheck | PASS | 0.648 |
| macOS / arch:check | PASS | 0.230 |
| macOS / test | 1186/1186 | 49.397 |
| macOS / build | PASS | 0.693 |
| macOS / test:browser:fixture | 175/175 | 112.766 |
| Linux2CPU / typecheck | PASS | 3.309 |
| Linux2CPU / arch:check | PASS | 0.858 |
| Linux2CPU / test | 1186/1186 | 133.027 |
| Linux2CPU / build | PASS | 0.677 |
| Linux2CPU / test:browser:fixture round1 | 175/175 | 121.539 |
| Linux2CPU / test:browser:fixture round2 | 175/175 | 121.433 |
| Linux2CPU / test:browser:fixture round3 | 175/175 | 119.103 |

Linux three-suite median121.433s; no failed green attempts, retries, skips, todo or known-failure exemptions. Each gate before/after clean, all665 source hashes verified. G2 fixed pages retain8PASS/4DEGRADED_HONEST/0FAIL in every full run, preserving previous facts and the existing baseline. G3 strict-pass and positive TableCheck calendar acceptance remain separate.

[macOS raw compressed logs](macos-green), [Linux full logs](linux-green), [local two-target control](local-targets-green.log.gz). Default/Chromium counts remain1186/175: this repair adds0 and removes0 tests. It does not claim the count/time-reduction acceptance of the later test-suite audit.

The successful three full runs are ordinary2CPU affinity0,1, without the artificial25%-quota pressure. We do not claim a full-suite pass under that extreme quota. The pressure-group cancellation remains an environmental/orchestration diagnostic, not a test reduction or suppressed failure.

VM had no host mounts, SSH-agent/proxy inheritance, credentials or personal browser profile. Only public developer dependencies were downloaded during setup; formal tests ran with no external network route. Installed identical locked dependencies were reused by lock cmp; guest-only chrome alias is real Chromium151, not a branded Chrome claim. Guest clock aligned before testing, host clock unchanged. Logs/source hashes copied and verified, then VM, runtime, images, ephemeral keys and profiles removed; no task VM remains.

## Remaining work and delivery

No main merge of this timing candidate is performed before review. G1 review material is already maincab27890; timing candidate is pushed separately. User-authorized six-question real-model run Q07/Q14/Q26/Q27/Q31/Q33×3 (≤20 calls) remains NOT_RUN: B quality fixdd87cfbb is published but not in current main. Test-suite audit remains NOT_STARTED until B begins G3, and must first deliver per-test decisions/replacements for review. No broad test deletion is included here.
