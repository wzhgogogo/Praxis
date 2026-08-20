# ADR-0013: Agent Loop Final Hardening

## Status

Accepted — 2026-08-20

## Context

ADR-0010 moved open-ended Restaurant next-action choice from deterministic workflow code to one bounded logical Agent. ADR-0012 then made the Agent input and trajectory safer. A definitive `COMMIT_FAILED` or `BOOKING_ABSENT` already returns State to `SELECTION_REQUIRED`, but the mandatory Policy/Commit/Verify chain did not automatically hand that recovery state back to the Agent loop. The old Authorization must also be impossible to attach to a recovery proposal.

Trajectory evidence needs the exact sanitized Decision Context the model received, and the route taxonomy must describe stable execution mechanisms rather than whether a particular run used Fixture or Live data. Finally, the next Stage must distinguish the independent semantic-quality track from the Hybrid E2E preparation path.

## Decision

- After a mandatory Policy/Commit/Verify command chain completes, the Restaurant application orchestrator calls `resumeAfterMandatoryCommandChain`. It re-enters the bounded Agent loop only from `SELECTION_REQUIRED`; terminal states, `OUTCOME_UNKNOWN`, and authorization checkpoints do not resume automatically.
- `COMMIT_FAILED` and `BOOKING_ABSENT` clear the previous proposal, authorization, and active attempt before entering `SELECTION_REQUIRED`. A subsequent `BOOK_RESERVATION` deterministically creates a fresh proposal ID. The reducer accepts `AUTHORIZE` only when its `proposalId` equals that current proposal; an old authorization is rejected before Policy or Commit. The Agent may explore and select another grounded candidate, but every new proposal still waits for a new one-time user authorization.
- `restaurant-agent-trajectory@4` persists the exact `restaurant-agent-context@1` supplied to the Decision port and its `contextSchemaVersion`, together with Action, Validation, Execution Route, Observation and State/Outcome causal references. It never stores raw prompt text or chain-of-thought. `restaurant-harness-artifact@5` carries the upgraded trajectory.
- The long-lived `RestaurantExecutionRoute` taxonomy is `STRUCTURED_ADAPTER`, `GENERIC_BROWSER`, or `HUMAN_TAKEOVER`. Only `STRUCTURED_ADAPTER` is implemented. Fixture/Mock/Live remain run mode or provider metadata and do not become route kinds; Runtime transitions and Policy checkpoints are not external execution routes.
- ADR-0003 retains its single logical Agent decision. Its deterministic next-action orchestration detail was superseded by ADR-0010. ADR-0004 retains one-authorization-to-one-concrete-proposal binding; its requirement that a user manually select again after definitive failure is superseded by the bounded Agent recovery loop of ADR-0010 and this ADR.
- Semantic conflict gating remains intentionally unchanged pending real Agent/E2E observation. It is a known hypothesis, not a hidden bug or an implemented automatic recovery path.

## Consequences

- Definitive booking failures can recover to a fresh authorization checkpoint without reusing authority or blindly retrying a write. `OUTCOME_UNKNOWN` remains fail-closed.
- Audit data now forms `Context → Action → Validation → Execution → Observation → State/Outcome`, while retaining the prior Proposal/Authorization/Attempt/Evidence joins.
- Hybrid E2E preparation can proceed with real model Agent Decision, Live read-only Discovery and Availability, and Mock Booking/Verification. A new semantic Clean Holdout remains an independent parser-quality gate, not a blocker for that preparation.

## Alternatives considered

- Reuse the previous Authorization for the same or a replacement candidate: rejected because authorization scope is one concrete proposal, not a general retry permission.
- Resume every completed command chain: rejected because terminal states, authorization checkpoints, and uncertain outcomes have distinct safety rules.
- Store the raw Decision prompt or model reasoning in trajectory: rejected because it adds sensitive/unbounded content without improving action auditability.
- Keep `FIXTURE_STRUCTURED` as a route: rejected because test mode is not an execution mechanism and would create a misleading permanent taxonomy.

## Related documents

- [ADR-0003](0003-single-agent-orchestration.md)
- [ADR-0004](0004-single-candidate-authorization.md)
- [ADR-0010](0010-restaurant-agent-loop-action-validation.md)
- [ADR-0012](0012-migration-and-agent-loop-hardening.md)
- [Agent Orchestration](../architecture/AGENT-ORCHESTRATION.md)
- [Policy, Execution and Verification](../architecture/POLICY-EXECUTION-VERIFICATION.md)
- [Roadmap](../roadmap.md)
