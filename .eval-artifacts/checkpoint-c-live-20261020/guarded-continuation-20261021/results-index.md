# Five formal Checkpoint C results

Original bytes and SHA-256 are indexed in [results-index.json](results-index.json). Prior files were not copied or rewritten.

| Run | Case | Outcome | Raw result | Decisions | Per-run evaluation |
| --- | --- | --- | --- | --- | --- |
| c-01 | p2l-kf-h001-20261103 | CAPABILITY_MISS | [result.json](../execution-20261020/results/c-01-attempt-1/runner/2026-10-20T16-00-10-755Z-efba4afb-4c0c-4a6f-a0a7-f2fe22f624f2.result.json) | [decisions.jsonl](../execution-20261020/results/c-01-attempt-1/runner/2026-10-20T16-00-10-755Z-efba4afb-4c0c-4a6f-a0a7-f2fe22f624f2.decisions.jsonl) | [run-report.json](../execution-20261020/results/c-01-attempt-1/run-report.json) |
| c-02 | p2l-kf-h002-20261107 | HONEST_NO_RESULT | [result.json](../execution-20261020/results/c-02-attempt-1/runner/2026-10-20T16-10-24-179Z-47d73c8c-22c4-439e-8563-7c48997c1059.result.json) | [decisions.jsonl](../execution-20261020/results/c-02-attempt-1/runner/2026-10-20T16-10-24-179Z-47d73c8c-22c4-439e-8563-7c48997c1059.decisions.jsonl) | [run-report.json](../execution-20261020/results/c-02-attempt-1/run-report.json) |
| c-03 | p2l-kf-h005-20261105 | CAPABILITY_MISS | [result.json](../resume-20261021/results/c-03-attempt-3/runner/2026-10-21T01-32-26-613Z-aee07dce-71f4-4fa7-9cc6-daadf3daf648.result.json) | [decisions.jsonl](../resume-20261021/results/c-03-attempt-3/runner/2026-10-21T01-32-26-613Z-aee07dce-71f4-4fa7-9cc6-daadf3daf648.decisions.jsonl) | [run-report.json](../resume-20261021/results/c-03-attempt-3/run-report.json) |
| c-04 | p2l-kf-h003-20261106 | HONEST_NO_RESULT | [result.json](../resume-20261021/results/c-04-attempt-1/runner/2026-10-21T01-42-26-520Z-efc920f9-59e6-4c20-b22c-702fc72233e3.result.json) | [decisions.jsonl](../resume-20261021/results/c-04-attempt-1/runner/2026-10-21T01-42-26-520Z-efc920f9-59e6-4c20-b22c-702fc72233e3.decisions.jsonl) | [run-report.json](../resume-20261021/results/c-04-attempt-1/run-report.json) |
| c-05 | p2l-kagurazaka-kaiseki-20261105 | CAPABILITY_MISS | [result.json](results/c-05-attempt-1/runner/2026-10-21T02-40-35-503Z-11d9ce68-adc1-4f43-93db-76ba7e3a414a.result.json) | [decisions.jsonl](results/c-05-attempt-1/runner/2026-10-21T02-40-35-503Z-11d9ce68-adc1-4f43-93db-76ba7e3a414a.decisions.jsonl) | [run-report.json](results/c-05-attempt-1/run-report.json) |

All five delivered zero restaurants, each with 47 model calls. Historical H003 S0_BOUNDARY PRESENT is retained. Two old H005 preflight failures have no result.json because formal execution never started. Thirteen remaining plan positions were not started.

[Four-layer consolidated report](report.md) - [Failure-pattern evidence](five-run-failure-summary.json) - [Cumulative budget](phase2-ledger-after.json)
