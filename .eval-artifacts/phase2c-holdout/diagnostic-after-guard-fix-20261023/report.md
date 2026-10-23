# DIAGNOSTIC_AFTER_GUARD_FIX — p2c-holdout-01

Status: diagnostic only, grading deferred pending independent wording review. Original18 exit results unchanged; contribution0.

Main merged/reviewed production freeze: **4d953731163e922741ea91ccc6c1c47b53f0b0e1** ([merge gates and69/5/22](../../tablecheck-guard-merge-20261023/report.md)). Diagnostic branch merges that main at6d8bbc8e; its five history-document conflicts preserve both sides, product differences0 ([resolution](merge-conflicts.json)). Runtime/config prepared aa31424d, SHA freeze committed2bb32961 ([freeze](freeze.json)). Gold, runner YAML, exit-dates and certification bytes unchanged; deadline UTC2026-10-24T04:15:40Z / Beijing12:15:40.

The relocated Runner retains actual production source-health, real providers and source behavior. Changes are deferred evaluation, passive observer hook and artifact directories; [exact replacements](runner-relocation.json). Eight offline controls and import jail pass0 calls. Health checks retry at most3 total, five-minute gaps, before formal timing/budget. Frozen outer allows that preflight time and a500s formal budget plus5s kill/record cleanup grace; no product deadline extension. No external retry beyond these checks.

| Diagnostic | Formal Live | Product phase | Delivery | Product ms | Model | Google incl. preflight | BLOCKED_METHOD all / TableCheck | Control decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | STARTED | SEARCHING | 0 (ungraded) | 500111 | 37 | 5 | 544 / 41 | STOP_UNRESOLVED_NOT_AUTO_RETRY |

- Run 1, health attempt 1, 2026-10-23T10:59:21.126Z → 2026-10-23T10:59:31.128Z: tabelog: UNHEALTHY, HTTP 200, CHECK_TIMEOUT, 10002 ms; tablecheck: HEALTHY, HTTP 200, healthy, 9967 ms.
- Run 1, health attempt 2, 2026-10-23T11:04:31.131Z → 2026-10-23T11:04:41.147Z: tabelog: HEALTHY, HTTP 200, healthy, 10016 ms; tablecheck: HEALTHY, HTTP 200, healthy, 9950 ms.

A delivered result stops further runs pending independent wording/qualification review; it is not pre-labelled QD. A second formal run is allowed only after clear no-delivery capability failure. Known “observed coordinate context” failures stop and are excluded from capability failure. Environment/safety/internal-other failure stops; no extra diagnostic is silently added.

## BLOCKED_METHOD comparison

The previous reviewer reference867 is reproduced by recursively counting code=BLOCKED_METHOD in h07 diagnostics.browserTrace. That includes third parties: TableCheck contributes **76** occurrences; snapshots may duplicate the same request diagnosis. Current rows report both the same all-source count and TableCheck-only count; distinct shapes in run-report.json are not unique request counts. No formal artifact means N/A, not an observed zero. Source-health requests are outside this formal-artifact metric. Blocked requests are not admitted requests/S0.

## Evidence and budgets

[Run paths, decisions/recording, timing, health and boundary-only audit](run-report.json); each attempt retains stdout/stderr, start/finish summary, immutable result when produced, preflight and raw post-check evidence. Tabelog post-checks reuse approved four-parameter GET; TableCheck relies on saved trace. Missing stock support stops; no booking/slot/form/payment/PII action is authorized.

[Unmatched wording-only packet](wordings.json) contains no outcomes. Full evaluator and declaration/condition scoring are NOT_RUN pending reviewer wording decisions. Boundary-only oracle is separate and does not establish declaration correctness; incomplete evidence remains unknown. This is one/two diagnostic attempts, not a new clean holdout or evidence that the original exit passed; no causal improvement claim.

New fullLive **1**, models **37**, environment retries0. Cumulative models **4355/5000**, fullLive **90/100**, environment retries **5/10**; original18 unchanged. [Append-only derived ledger](ledger-after.json). No model or source calls during finalization. Stop after authorized push to codex/holdout-phase2c-exit; await independent wording review before evaluation.

## Continuation approval pending

The first attempt ended at500111ms with FAILED/AGENT_LOOP/RUN_DEADLINE_EXCEEDED and no delivery, no environment/near/safety signal. The frozen outer continuation gate omitted time-budget exhaustion, so it rejected automatic continuation. An isolated second-entry patch and8 offline rejection controls are prepared under recovery; original entry/first result stay unchanged. Second diagnostic has not started; explicit refreeze approval is pending under Eval Skill5. This report is the first-attempt snapshot.
