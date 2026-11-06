# Model retry: connection timeout

Status: draft / not integrated. 2026-11-06T16:44:51.488909+01:00 CET UTC+1. User requested one retry, then continuation only on success. Frozen6faeb499; product runtime unchanged from the full-green ba5d5748 candidate.

Same saved D8 observation4, same requested deepseek-v4-flash, same existing provider and Node --env-file credential mechanism. Model call was charged before transmission. It failed after10529ms: NETWORK / TRANSPORT / TypeError / UND_ERR_CONNECT_TIMEOUT (nested ConnectTimeoutError). No HTTP status, model output, usage or billing was returned. This is connection failure, not evidence of an incorrect action, insufficient balance or provider rejection. No external health check, website/Google request or model fallback was sent.

Two automatic approval reviews were used because the first launch review timed out before execution; only one actual model request was transmitted in this turn. The original NETWORK failure remains unchanged. Current model-only use2/30, remaining28; global model use640/1600. EvaluationGET347/458 and Live23/42 unchanged; held-out18Live/108GET intact.

No successful probe, so no further planned sample, stronger-model comparison or D8 Live started. No merge. Product five gates/strictG2/G6 remain those on ba5d5748; only outer failure diagnostics gained existing sanitized provider error metadata and elapsed time (typecheck PASS). Do not classify the absent response as a model-choice FAIL or billing zero.
