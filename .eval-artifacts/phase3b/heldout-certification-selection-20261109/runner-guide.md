# Selective pre-certification and authorized next step

Status: verified integration candidate, source d8d413a2, full gates PASS; use published main SHA. Use published full main SHA. Private original and manifests never copied into repository or read directly by agent.

The existing certify-only command additionally accepts `--cases id,id,...`. It is forbidden without --certify-only, including formal --output/--resume/--validate-only. Full manifest still validates first; unknown, duplicate or empty IDs reject. Selection runs in manifest order. certification-hashes.json retains full input hashes and selectedCaseIds. Only selected cases precharge GET; same canonical ledger/cap12/total126/5s spacing and no retry. No automatic fallback changes.

Authorized second certification paths: same external holdout.yaml and active-budget.json, external proposed-manifest-v2.json SHA0967a9dc24242edd0fcec5f5022a1bf363c754bddefe19e0e99aaee36829d6e7. Output `.eval-artifacts/phase3b/heldout-certification-second`, selection `p3b-holdout-01,p3b-holdout-03,p3b-holdout-05`. No other cases re-certified.

All three true -> ordinary formal command (no --cases) using SAME frozen main SHA, full v2 manifest SHA and same external ledger, output `.eval-artifacts/phase3b/heldout-run-20261109`. Normal plan is six cases x3; no private files read, code changed or manual intervention while executing. Stop on environment/evidence/S0; health-failure recovery alone allows --resume max2, preserving source/manifest/ledger binding. At any other stop report batch.json and wait; no independent retry, supplementation or additional certification authorized.

Source vacancy time lists are verbatim JST. Operational timestamps use Europe/Vienna CET. Prior converted certification presentation remains historical and is corrected by the reviewer instruction, not used to alter requests or raw responses. No pass-rate aggregation by agent.
