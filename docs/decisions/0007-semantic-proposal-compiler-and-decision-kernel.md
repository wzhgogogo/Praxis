# ADR-0007: Semantic Proposal, Domain Compiler, and Deterministic Decision Kernel

## Status

Accepted — 2026-08-13

## Context

Real DeepSeek diagnostics show two separate failure modes at the language-to-state boundary: a completion may not satisfy the required structured contract, or it may be structurally valid while expressing the user's new, corrected, negated, or confirmed meaning incorrectly. The existing Harness-only v14 contract asks the model to express internal `statePatch` operations directly. This conflates semantic interpretation with the system protocol used to mutate authoritative state.

Praxis must keep a single authoritative state writer and must not let model output obtain execution authority. The product needs a stable main path that attributes failures separately to interpretation, contract validation, deterministic compilation, state reduction, decision, execution, and verification. Only Restaurant is a real current Domain, so this boundary cannot be introduced as a cross-Domain compiler framework.

## Decision

The v15 Restaurant main path is fixed as:

```text
User Message
→ Web / Workspace
→ Application Orchestrator (minimum conversation / state / context)
→ Semantic Interpreter [LLM]
→ Restaurant Semantic Proposal
→ Semantic Proposal Contract
→ Restaurant Semantic Compiler
→ Task Runtime
→ Reducer
→ Restaurant Decision Kernel
→ Runtime Command or Execution Action Proposal
→ Policy / Authorization when required
→ Execution Router
→ Tool / Adapter
→ Observation / Evidence
→ Verifier
→ Outcome Event
→ Task Runtime / Reducer / Decision Kernel
```

- The **Semantic Interpreter** only proposes what the user expressed in this turn: target, time, party, location, preference, constraint, correction, negation, confirmation, and optional soft semantic context. It does not emit `StatePatch`, Event, readiness, action routing, authorization, Tool Call, or Outcome.
- The **Semantic Proposal Contract** validates the untrusted Proposal's permitted shape and Domain vocabulary. Passing it proves only structural legality, not that the model understood the user correctly.
- The **Restaurant Semantic Compiler** is deterministic Restaurant Domain code. It maps a valid Proposal to Restaurant Domain Event(s) or State Patch(es); it does not call a model, read live data, determine policy, or execute an action.
- The **Task Runtime and Reducer** remain the only authority for durable state: `Old State + Event → New Authoritative State + Commands`.
- The **Restaurant Decision Kernel** is deterministic Domain code. It reads only authoritative State and Trusted Evidence and decides `ASK_USER`, `SEARCH`, `PRESENT_CANDIDATES`, `PROPOSE_RESERVATION`, `COMPLETE`, `NEED_ADJUSTMENT`, or `NEED_REINTERPRETATION`. It neither interprets free text nor directly invokes a Tool.
- Read-only Tool work still proceeds through a Runtime Command and Policy. A side-effecting action additionally requires an Execution Action Proposal, current Policy Decision, and valid Authorization before the Execution Router may call an Adapter.
- The **Verifier** alone turns Observation/Evidence into an Outcome Event. Its result re-enters the Runtime and Decision Kernel; it never creates a `Verifier → LLM → Tool` execution loop.
- The **LLM Response / Adjustment Proposal** path is non-authoritative. It may explain facts, formulate a clarification question, or suggest a condition adjustment. A suggestion cannot be compiled as user intent until the user explicitly confirms or changes it in a new message that traverses the normal Semantic Interpreter path.
- v15 reserves `NEED_REINTERPRETATION` but does not automatically re-run interpretation or alter State. The initial behavior records a structured conflict for log/eval and asks the user or takes a safe fallback. Any later automatic re-interpretation is separately designed, is limited to one attempt, and must re-enter the complete Proposal → Contract → Compiler → Runtime → Reducer path.

The Restaurant Compiler and Decision Kernel are Domain-owned. This ADR does not introduce a generic semantic ontology, cross-Domain compiler, workflow DSL, direct LLM Tool loop, or multi-Agent system.

## Consequences

- Semantic correctness, output-contract validity, compilation, state accumulation, decision, execution, and reality verification can be independently tested and reported.
- Existing fixture Intent and Eval-only `statePatch` paths are not misrepresented as the v15 product path. Since there is no production data or external consumer, v15 implementation will directly replace the obsolete product semantic path and its fixtures rather than maintain compatibility.
- Every future semantic feature must specify which facts originate in the Interpreter, which are deterministically produced by the Compiler or Reducer, and which decisions belong to the Kernel.
- `NEED_REINTERPRETATION` is fail-safe by default; the model cannot silently correct or erase authoritative facts.
- A new Restaurant Domain boundary is justified by the observed real-model problem. Generalization remains prohibited until a second real Domain requires it.

## Alternatives considered

- Continue to expand prompts so the model emits correct internal `statePatch` operations: rejected because semantic understanding and protocol syntax remain inseparable and failures are hard to attribute.
- Let the Semantic Interpreter write Task State or invoke Tools: rejected because it violates Runtime, Policy, Authorization, and Verifier boundaries.
- Move semantic compilation into Core: rejected because there is only one real Domain user.
- Introduce a Planner/Executor/Critic multi-Agent loop: rejected because the Restaurant main path remains a single-agent, deterministic orchestration problem.

## Related documents

- [Architecture Overview](../architecture/OVERVIEW.md)
- [Agent Orchestration](../architecture/AGENT-ORCHESTRATION.md)
- [Restaurant Booking](../domains/RESTAURANT-BOOKING.md)
- [Planning Skill](../skills/planning/SKILL.md)
