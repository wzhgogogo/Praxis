# DIAGNOSTIC_AFTER_GUARD_FIX — p2c-holdout-01

Status: diagnostic only, grading deferred pending independent wording review. Original18 exit results unchanged; contribution0.

Main merged/reviewed production freeze: **4d953731163e922741ea91ccc6c1c47b53f0b0e1** ([merge gates and69/5/22](../../tablecheck-guard-merge-20261023/report.md)). Diagnostic branch merges that main at6d8bbc8e; its five history-document conflicts preserve both sides, product differences0 ([resolution](merge-conflicts.json)). Runtime/config prepared aa31424d, first SHA freeze committed2bb32961; user-approved timeout-only second entry at5789225a, continuation freeze07e06a80 ([first freeze](freeze.json), [continuation freeze](freeze-continuation.json)). Gold, runner YAML, exit-dates and certification bytes unchanged; deadline UTC2026-10-24T04:15:40Z / Beijing12:15:40.

The relocated Runner retains actual production source-health, real providers and source behavior. Changes are deferred evaluation, passive observer hook and artifact directories; [exact replacements](runner-relocation.json). Eight offline controls and import jail pass0 calls. Health checks retry at most3 total, five-minute gaps, before formal timing/budget. Frozen outer allows that preflight time and a500s formal budget plus5s kill/record cleanup grace; no product deadline extension. No external retry beyond these checks.

| Diagnostic | Formal Live | Product phase | Delivery | Product ms | Model | Google incl. preflight | BLOCKED_METHOD all / TableCheck | Control decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | STARTED | SEARCHING | 0 (ungraded) | 500111 | 37 | 5 | 544 / 41 | STOP_UNRESOLVED_NOT_AUTO_RETRY |
| 2 | STARTED | SEARCHING | 0 (ungraded) | 500075 | 40 | 4 | 1070 / 95 | STOP_UNRESOLVED_NOT_AUTO_RETRY |

- Run 1, health attempt 1, 2026-10-23T10:59:21.126Z → 2026-10-23T10:59:31.128Z: tabelog: UNHEALTHY, HTTP 200, CHECK_TIMEOUT, 10002 ms; tablecheck: HEALTHY, HTTP 200, healthy, 9967 ms.
- Run 1, health attempt 2, 2026-10-23T11:04:31.131Z → 2026-10-23T11:04:41.147Z: tabelog: HEALTHY, HTTP 200, healthy, 10016 ms; tablecheck: HEALTHY, HTTP 200, healthy, 9950 ms.
- Run 2, health attempt 1, 2026-10-23T11:15:59.715Z → 2026-10-23T11:16:09.717Z: tabelog: UNHEALTHY, HTTP 301, CHECK_TIMEOUT, 10002 ms; tablecheck: HEALTHY, HTTP 200, healthy, 9956 ms.
- Run 2, health attempt 2, 2026-10-23T11:21:09.722Z → 2026-10-23T11:21:19.748Z: tabelog: HEALTHY, HTTP 200, healthy, 9980 ms; tablecheck: HEALTHY, HTTP 200, healthy, 10024 ms.

A delivered result stops further runs pending independent wording/qualification review; it is not pre-labelled QD. A second formal run is allowed only after clear no-delivery capability failure. The first attempt had500111ms/RUN_DEADLINE_EXCEEDED; its preserved original next=STOP_UNRESOLVED_NOT_AUTO_RETRY reflects the outer gate omission, not a new business verdict. User explicitly approved the isolated second-entry correction; original artifacts/entry stayed unchanged. [Approval](recovery/approval.json), [applied diff](recovery/outer-timeout-continuation.applied.patch). Known “observed coordinate context” failures stop and are excluded from capability failure. Environment/safety/internal-other failure stops; no extra diagnostic is silently added.

## BLOCKED_METHOD comparison

The previous reviewer reference867 is reproduced by recursively counting code=BLOCKED_METHOD in h07 diagnostics.browserTrace. That includes third parties: TableCheck contributes **76** occurrences; snapshots may duplicate the same request diagnosis. Current rows report both the same all-source count and TableCheck-only count; distinct shapes in run-report.final.json are not unique request counts. No formal artifact means N/A, not an observed zero. Source-health requests are outside this formal-artifact metric. Blocked requests are not admitted requests/S0.

## Evidence and budgets

[Run paths, decisions/recording, timing, health and boundary-only audit](run-report.final.json); each attempt retains stdout/stderr, start/finish summary, immutable result when produced, preflight and raw post-check evidence. Tabelog post-checks reuse approved four-parameter GET; TableCheck relies on saved trace. Missing stock support stops; no booking/slot/form/payment/PII action is authorized.

[Unmatched wording-only packet](wordings.final.json) contains no outcomes. Full evaluator and declaration/condition scoring are NOT_RUN pending reviewer wording decisions. Boundary-only oracle is separate and does not establish declaration correctness; incomplete evidence remains unknown. This is one/two diagnostic attempts, not a new clean holdout or evidence that the original exit passed; no causal improvement claim.

New fullLive **2**, models **77**, environment retries0. Cumulative models **4395/5000**, fullLive **91/100**, environment retries **5/10**; original18 unchanged. [Append-only derived ledger](ledger-after.final.json). No model or source calls during finalization. Stop after authorized push to codex/holdout-phase2c-exit; await independent wording review before evaluation.

## Final facts and review boundary

Both product runs ended FAILED / AGENT_LOOP / RUN_DEADLINE_EXCEEDED, phases SEARCHING, delivery0; elapsed500111ms and500075ms. Neither had the known observed-coordinate-context failure. Boundary-only trace audits are ABSENT for both; declaration/condition/outcome evaluation is still deferred, so this does not certify all S0 dimensions. Model calls37+40=77; Google including provider/source preflights5+4=9; two fullLive, no environment rerun. Cumulative4395/5000 models,91/100 fullLive,5/10 environment reruns.

The first health check of each diagnostic timed out on Tabelog (last document status200 and301 respectively); both second health checks passed200/200 after five-minute waits. Those checks consumed0 model,0 Google and0 formalLive. Neither run was killed by the outer controller; formal500s product deadlines produced saved results. No third run is authorized or started.

BLOCKED_METHOD all-source diagnostic occurrences544/1070; TableCheck-only41/95, all pointing to production.tablecheck.com /v2/hub/availability_calendar_v2 OPTIONS. These are repeated diagnostics, not independent request counts; requested-method/header facts are not in those diagnostic shapes, so they are not labelled false rejections. Historical h07=867 all-source /76 TableCheck is preserved as the comparable counting baseline. No causal delivery improvement or final capability score is claimed.

Both zero-delivery runs have immediate four-parameter witness GET raw responses under attempt-N/post-run. They are saved observations for independent review, not a relabeling of the certification or original exit runs. Provider readiness start/result raw files are indexed by [network manifest](network-raw-manifest.json). The first-attempt report.md/run-report.json/wordings.json/ledger-after.json remain immutable snapshots; *.final.* files are the combined final packet.

[Final integrity and per-file SHA record](final-integrity.json) verifies both frozen inputs, original Gold/date/registry bytes, two decision/model counters, post-response SHA, first-attempt immutability, history-index counts and protected primary-worktree files.
