# D8 recorded-observation model validation continuation

Status: draft / not integrated; exposed development observations, not Clean Baseline.
Time: 2026-11-06T17:13:51.933152+01:00 CET (UTC+1).

Input freeze: 20496850543390c3ec7cff30955879490c21b6cf, continued from af0b2ab7 in an isolated worktree. The current chat explicitly requested this pending validation. No production code, runtime prompt, model timeout, provider45s limit, Guard, identity rule or shared budget limit changed.

## Result

Requested deepseek-v4-flash, provider returned deepseek-flash. Twelve successful model requests, two repetitions for each of six D8 observations. Independent literal action/target/authority-field checks: 12/12. Original recorded observation and history are equal to the original decision contexts. Full requests, actual outputs, usage and latency are in model-resume-20261106-runtime/results; independent checks are in model-resume-evaluation.json.

| Original decision | Actual choice in both repeats | Result |
|---|---|---|
| TableCheck4 | CLICK Destination button, observation2 target178 | 2/2 |
| TableCheck5 | FILL_AUTHORITATIVE RETRIEVAL into Destination input, observation3 target260 | 2/2 |
| TableCheck6 | REQUEST_HUMAN_HELP, no target, after recorded Nakamata no-match | 2/2 |
| Tabelog7 | FILL_AUTHORITATIVE RETRIEVAL into unnamed query input, observation5 target178 | 2/2 |
| Tabelog8 | CLICK Search, observation6 target137 | 2/2 |
| Tabelog9 | COMPLETE at the recorded result list, no target | 2/2 |

The planned full authoritative name is used for decisions4/5 on the original unfilled controls. Decision6 still uses the original Nakamata no-match observation; it checks ending that search method so the caller can advance, not the website response to the full name. Decision9 uses the pre-frozen receipt-supported completion progress; this is an isolated context substitution, not a natural execution of the receipt code or sequential replay. No website response or model output was manufactured. No model picked a wrong step, so the user condition for stronger-model comparison was not triggered; stronger calls0, no model-price claim.

Token usage: input 299584, output 1517, total 301101. Individual model latency 1158–1877ms, total 17450ms. These are model timings only, not proof of completion under the45s provider deadline. Actual billing and cache-specific pricing were not returned by the existing gateway.

## Budget / preserved failures

The prior two NETWORK/connection-timeout attempts remain unchanged. This validation adds12 requests. The earlier chat connectivity completion (HTTP200 OK,10tokens) is conservatively included as one extra charge:15/30 consumed,15 remaining; global model ledger653/1600. The earlier health GET to /models was a separate provider API diagnostic, not a witness/restaurant website GET; it is documented and does not alter evaluationGET347. Current cumulative ledger: {"fullLive": 23, "realModelCalls": 653, "environmentReruns": 0, "evaluationPublicGET": 347, "googleRequests": 95, "restaurantWebsiteRequests": 11220}. Live23/42 and evaluationGET347/458 unchanged, held-out18Live/108GET reserved unchanged. No requests to websites or Google, no Live in this continuation. A launch with a nonexistent env-file path failed before initialization/transmission; it made0 requests. Successful launch used the existing main-worktree .env through Node --env-file, the same mechanism used in the preceding successful chat probe; no key copied or printed.

## Existing verification and remaining limits

Product source is byte-identical to the previously verified ba5d5748 candidate (exclude eval diagnostics and tests); no source changed from af0b2ab7. Reuse final-gates-2/results.json: typecheck, architecture, default1429/1429, build, Chromium229/229, G675/75, strictG25/5 with12 page pairs passed and clean statuses. No redundant full-suite rerun for an artifact-only continuation.

Root1 real-recording component red/green, root2 list objective, root3 query-plan/next-method changes and D4 tails remain as reported in report.md. D3/D4 whole-chain regression remains blocked by qualified-start/keyword-suggest/original-output recording gaps. D4 original and supplemental evaluations remain NOT_EVALUATED; this model validation cannot change them. No historical recording/evaluation was replaced. Shared STATUS/DEVLOG/TEST-LOG remain deferred to integration under the prior Nov5 working rule, as in report.md.

Four layers: end-to-end NOT_EVALUATED; single-step decisions12/12; no actions dispatched and full D8 S0 NOT_EVALUATED; attribution limited to current model choices under the repaired frozen objective. Full Live identity, W2 adapter inspection, actual website responses to alternate terms and45s feasibility remain unverified.

Stop for reviewer confirmation. No D8 Live, main merge, held-out run, remote push or message to another chat. Local evidence commit follows this report.

Hardcoded scan985f456e..20496850: the same one pre-existing TableCheck allowedOrigins safety-line hit documented in report.md; no new hits. All src bytes equal af0b2ab7. Credential leak and diff-whitespace checks PASS.
