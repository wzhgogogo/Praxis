# ADR-0011: Restaurant Agent Action Binding and Loop Termination

## Status

Accepted — 2026-08-20

## Context

ADR-0010 introduced a bounded Restaurant Agent Loop, but its first action contract repeated authoritative intent and scheduling fields in untrusted Agent output. It also exposed an unreachable `COMPLETE` action, reported provider or router failures as model failures, and did not persist a complete causal link from an Agent step to its emitted events, commands, attempts, and evidence. Finally, `SELECTION_REQUIRED` was incorrectly projected as a user-waiting lifecycle even though the Agent may safely recover from it.

## Decision

- `restaurant-agent-action@2` has five actions only: `ASK_USER`, `SEARCH_RESTAURANTS`, `CHECK_AVAILABILITY`, `SELECT_CANDIDATE`, and `BOOK_RESERVATION`. `COMPLETE` is removed because verifier-confirmed terminal state ends the loop without an Agent action.
- `SEARCH_RESTAURANTS` contains only an optional retrieval hint. `CHECK_AVAILABILITY` contains only candidate IDs. The validated Execution Router binds the complete authoritative intent, date, time window, and party size into the persisted read request immediately before calling a structured adapter.
- Read-provider failures are durable `SEARCH_FAILED` or `AVAILABILITY_FAILED` observations and remain available to the Agent as recovery information. A router execution failure is an `AGENT_EXECUTION_FAILED` terminal-safe condition, not a model failure. Model transport or output failures remain `AGENT_DECISION_FAILED`.
- Maximum elapsed time, step count, and consecutive rejected-action count each dispatch a distinct `AGENT_LOOP_TERMINATED` event with a clear `NEEDS_INPUT` state and append a termination trajectory step. The loop result distinguishes timeout, step limit, rejection limit, model failure, and execution failure.
- `SELECTION_REQUIRED` maps to Runtime `RUNNING`, not `WAITING_USER`; it carries no pending-user action. Only explicit `ASK_USER` and authorization checkpoints wait for a user.
- `restaurant-agent-trajectory@2` stores structured causal refs for emitted events, commands, attempts, and evidence. It does not store chain-of-thought.

## Consequences

- Agent output has a smaller attack surface and cannot repeat or alter authoritative constraints in search or availability arguments.
- Provider/adapter reliability is observable separately from model reliability, allowing the Agent to adapt to failed reads without false model attribution.
- Existing Fixture/Mock routes are still the only implementation. The Execution architecture documents future structured adapter, generic browser, and human-takeover routes without implementing them.
- This is incompatible with ADR-0010's action and trajectory contracts. There is no production Restaurant state or external consumer, so old action paths, fixtures, and migration shapes are replaced directly.

## Alternatives considered

- Keep repeated intent/schedule fields and compare them in the validator: rejected because untrusted duplication is unnecessary and makes harmless Agent formatting look like a constraint mutation.
- Keep `COMPLETE` as a no-op acknowledgement: rejected because terminal Runtime state is the single completion authority.
- Treat provider failures as model failures: rejected because it hides the recovery-relevant source of failure and incorrectly blames the model.
- Make all recovery failures wait for the user: rejected because a safe Agent recovery may still be possible from `SELECTION_REQUIRED` or a failed read.

## Related documents

- [ADR-0010](0010-restaurant-agent-loop-action-validation.md)
- [Agent Orchestration](../architecture/AGENT-ORCHESTRATION.md)
- [Search Service](../architecture/SEARCH-SERVICE.md)
- [Policy, Execution and Verification](../architecture/POLICY-EXECUTION-VERIFICATION.md)
