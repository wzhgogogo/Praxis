# ADR-0010: Restaurant Agent Loop and Action Validation

## Status

Accepted — 2026-08-19

## Context

ADR-0007 correctly separated untrusted language interpretation from deterministic compilation and authoritative state. Its v17 Decision Kernel nevertheless selected the next Restaurant action from state. That made `SEARCH`, candidate presentation, and adjustment retries a deterministic workflow rather than a bounded Agent loop, and coupled discovery results to availability offers.

Restaurant is still the only real Domain user. The new path must preserve the Runtime as the sole State writer, Policy and Authorization as the only side-effect permission, and the Verifier as the only authority for booking outcomes. It must also retain the MVP's single logical Agent rather than introduce Planner, Search, Booking, or Critic agents.

## Decision

The v18 Restaurant main path is:

```text
User Message
→ Semantic Interpreter [LLM]
→ Semantic Proposal Contract
→ Restaurant Semantic Compiler
→ Task Runtime / Reducer / Authoritative State
→ Restaurant Agent Decision [LLM]
→ Restaurant Agent Action Proposal
→ Restaurant Action Validator
→ Restaurant Execution Router
→ Observation / Evidence
→ Verifier
→ Task Runtime / Reducer
↺ Restaurant Agent Decision
```

- ADR-0007's Semantic Interpreter, Proposal Contract, and deterministic Restaurant Compiler remain the only language-to-state path. The Agent Decision receives authoritative state and trusted evidence; it does not reinterpret user language or mutate State.
- The Restaurant Agent is one bounded, single logical Agent. It proposes one business action from a static Domain-owned capability catalog: `ASK_USER`, `SEARCH_RESTAURANTS`, `CHECK_AVAILABILITY`, `SELECT_CANDIDATE`, `BOOK_RESERVATION`, or `COMPLETE`.
- The deterministic Restaurant Action Validator replaces the v17 Decision Kernel's next-step selection. It only allows, rejects, or requires authorization for a proposed action. It protects complete intent, hard constraints, candidate and offer identity, time/party alignment, offer freshness, active attempts, terminal states, and `OUTCOME_UNKNOWN`.
- Search discovers `RestaurantCandidate` records. Availability is independently checked and stored as `candidateId → AvailabilityOffer[]`; only a selected candidate plus a fresh matching offer can form a booking proposal.
- Open-ended work—whether to search again, adjust retrieval hints, which candidates to check, and what to do after observations—is selected by the Restaurant Agent. Reducers may still emit only mandatory safety commands: Policy approval may issue one Commit, and Commit success or uncertainty must issue Verify.
- `BOOK_RESERVATION` never contains an Authorization, terms hash, risk classification, or Adapter detail. The reducer deterministically creates the Core ActionProposal from the selected candidate and offer; Policy and a valid one-time Authorization are still required before Commit.
- The Execution Router receives only a validated business action. v18 implements the Fixture/Mock structured route and explicit unsupported outcomes. Browser, Live Provider, dynamic tool registry, and fallback-provider frameworks remain design-only.
- Every Agent step is persisted as a Restaurant-specific structured trajectory record linking state versions/hashes, exposed capabilities, model metadata, action, validator verdict, execution route/observation, and final step outcome. It contains no chain-of-thought and does not treat model summaries as authority.
- A bounded loop enforces maximum steps, timeout, model failure handling, and repeated-rejection limits. `COMPLETE` is only valid after `BOOKED_VERIFIED`; no Agent response can declare a real-world success.

## Consequences

- The v18 vertical slice can show model-selected discovery, availability, candidate selection, authorization checkpoint, Mock Commit, and deterministic verification without a Browser or Live Provider.
- The prior `DECIDE_RESTAURANT_NEXT` / `RESTAURANT_DECISION_MADE` main chain and the coupled `ExecutableCandidate` contract are removed. There is no pilot data or external contract, so all fixtures and callers move directly to the v18 schema with no compatibility path.
- Agent behavior can be evaluated using outcomes, grounded observations, safety assertions, latency, and trajectories without encoding one required action order as the Golden.
- New Domain actions need explicit validator rules and trajectory coverage. Generalizing this into a cross-Domain planner, tool registry, or learning platform remains prohibited until a second real Domain demonstrates the need.

## Alternatives considered

- Keep the v17 deterministic decision kernel and add model-written explanations: rejected because it does not let the Agent select open-ended work.
- Let the Agent call Search or Booking adapters directly: rejected because it would bypass validation, Policy, Authorization, and Runtime auditability.
- Introduce separate planner, search, booking, and critic agents: rejected because the required behavior fits one bounded Restaurant Agent and multi-agent coordination is not a current product need.
- Build a generic Browser/Provider registry now: rejected because v18's Fixture/Mock route is the sole current implementation user.

## Related documents

- [ADR-0007](0007-semantic-proposal-compiler-and-decision-kernel.md)
- [Agent Orchestration](../architecture/AGENT-ORCHESTRATION.md)
- [Restaurant Booking](../domains/RESTAURANT-BOOKING.md)
- [Search Service](../architecture/SEARCH-SERVICE.md)
- [Policy, Execution and Verification](../architecture/POLICY-EXECUTION-VERIFICATION.md)
