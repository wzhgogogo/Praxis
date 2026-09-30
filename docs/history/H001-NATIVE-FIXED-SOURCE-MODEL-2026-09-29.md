# H001 native fixed-source real-model attempt — 2026-09-29

- Status: current fixed-source real-model evidence; both presentation scenarios independently evaluated
- Scope: initial sandbox failure followed by two authorized fixed-source scenarios, offline source pages, DeepSeek model only
- Related: [native Stage 2 preflight](H001-NATIVE-STAGE2-PREFLIGHT-2026-09-29.md)

## Invocation and outcome

The dedicated native Runner was invoked once with `--case h001 --scenario TABELOG_DELIVERS --max-model-calls 50 --max-steps 30 --timeout-ms 300000` and `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1`. Source transport was `OFFLINE_FIXED_TRANSPORT` / `OFFLINE_FIXED_PAGES`; no Google or browser source navigation occurred. The first `restaurant_semantic_interpret` invocation failed in 21 ms with `NETWORK`, provider transport cause `ENOTFOUND`. Total elapsed was 26 ms, one model call started, zero successful model responses and no token usage. Final phase remained `UNDERSTANDING`, no candidates, offers or presentation. Independent Eval returned `taskProducedQualifiedResult=UNKNOWN` and did not evaluate semantic, evidence or final claim. This is not an H001 path failure or success result.

The ordinary sandbox's no-key `curl -I` could not resolve `api.deepseek.com` (`curl` exit 6). The identical no-key check with approved unsandboxed execution reached the host and returned HTTP 401, establishing that the first attempt was blocked by sandbox DNS/network access, not by observed source pages. No API key value or response body was logged. The second planned scenario, `TABLECHECK_RECOVERS`, was not started. No automatic model rerun or Live was started.

Artifacts: `.eval-artifacts/h001-native-fixed-source-model/2026-09-29T04-05-48-982Z-f7a7387d-c196-4447-8199-8c2d7c9a2efc.result.json` and its sibling `result.evaluation.21-1790654749007.json`; command output `/private/tmp/praxis-h001-native-real-model-tabelog-20260929.log`. Before any additional model call, independent review should approve one unsandboxed rerun of the same first scenario under the unchanged 300-second/50-call/30-step ceilings. The second scenario follows only after that result is inspected.

## Authorized network recovery and fixed-source outcome

The first unsandboxed rerun was initially rejected by automatic approval review: sending the frozen H001 request and derived prompts to DeepSeek lacked explicit user authorization for that particular transfer. The user then explicitly authorized that data transfer for the bounded fixed-page validation. No command ran during the rejected attempt. Both subsequent runs kept the original 300,000 ms / 50 model-call / 30 Agent-step ceiling per invocation; source pages and Google location response were fixed offline, and no real restaurant site, Google API or booking endpoint was called.

| Scenario | Outcome and independent Eval | Total time from raw request | Model use | Source trace |
|---|---|---:|---:|---|
| `TABELOG_DELIVERS` | `SUCCEEDED/TERMINAL/PRESENT_RESULTS`, three Tabelog candidates; qualified `YES`, all six findings `SATISFIED` | 11,800 ms | 9 calls, 35,596 tokens | One fixed Shibuya location resolution; Tabelog native search/details/facts/availability; zero TableCheck or Google restaurant search |
| `TABLECHECK_RECOVERS` | `SUCCEEDED/TERMINAL/PRESENT_RESULTS`, three TableCheck candidates; qualified `YES`, all six findings `SATISFIED` | 17,076 ms | 14 calls, 54,431 tokens | One fixed Shibuya location resolution; Tabelog first, then TableCheck native search/details/facts/availability; zero Google restaurant search |

The execution/evaluation pairs are `.eval-artifacts/h001-native-fixed-source-model/2026-09-29T04-12-11-311Z-a5791cc6-4f6d-4804-b2d7-c0bed9c2d9d0.result.json` and `.result.evaluation.21-1790655143120.json`, then `.eval-artifacts/h001-native-fixed-source-model/2026-09-29T04-13-08-370Z-07e46c54-52b1-4068-872e-56d08e2a0335.result.json` and `.result.evaluation.21-1790655205456.json`. The earlier sandbox failure remains separate and is not counted as a successful model response. These runs establish model control of the production composition against scripted pages and independent evidence checking. Their 11.8/17.1-second durations cannot predict actual source latency, coverage or current inventory. `BOTH_BOUNDED_EMPTY` remains an offline scripted control, not a paid-model run. No H001 Live Read-only run, booking write, commit or push followed.

## Live preflight authorization boundary

After independent review of both fixed-source artifacts, the formal `run-hybrid-live-read.ts` path was checked for `--native-discovery`, the 300,000 ms / 50 model-call / 30-step ceiling, existing 60,000 ms candidate and 30,000 ms provider ceilings, local Chromium, default network, and no explicit evaluation-coordinate or proxy override. No native H001 Live artifact was present. The first proposed real-source Live Read-only command was **rejected by automatic approval review before process creation**: the earlier user authorization covered sending H001 to DeepSeek for fixed-page model validation, not sending it and derived prompts to DeepSeek plus making real Google/Tabelog/TableCheck requests. No Live request, model call, browser navigation or new started artifact resulted from this rejected command. A specific user authorization request for the Live data transfer is pending; no alternative execution path was attempted.

The user subsequently authorized the specific Live transfer. One formal Live Read-only invocation then ran; its bounded no-result outcome and independent evaluation are recorded in [H001 native Live](H001-NATIVE-LIVE-2026-09-29.md). The preceding paragraph describes the rejected preflight at that point in time, not the current authorization state.
