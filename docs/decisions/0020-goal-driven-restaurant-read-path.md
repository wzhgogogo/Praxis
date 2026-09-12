# ADR-0020: Goal-driven Restaurant read path

- Status: Accepted
- Document revision: 1.0
- Last updated: 2026-09-10
- Source of truth for: Restaurant recommendation versus availability evidence profile, generic negative-condition evidence, and bounded read exhaustion behavior
- Supersedes: the party-size evidence-profile and H002 case-policy portions of [ADR-0019](0019-fact-grounded-read-only-recommendations.md)
- Related documents: [Restaurant Booking Domain](../domains/RESTAURANT-BOOKING.md), [Agent Orchestration](../architecture/AGENT-ORCHESTRATION.md), [Eval Skill](../skills/eval/SKILL.md)

## Context

ADR-0019 made fact-grounded recommendations possible, but selected its profile by whether `partySize` was present and allowed H002 evaluation policy to add case-specific source terms. That made an ordinary two-person cafe recommendation look like an availability request, and made evaluation alter the semantics that production execution was meant to preserve. The H002 and H004 Live diagnostics also showed that a depleted Google read could be retried with new wording even though no new call was permitted.

## Decision

Restaurant semantic state records a `target.goal` for every new request:

- `RECOMMENDATION` requires eligible place facts: applicable area, HIGH entity identity, every HARD condition supported by source facts, and applicable opening hours for the requested visit time. It never claims a table is available. `partySize` may be present but does not alter this profile.
- `AVAILABILITY` additionally requires party size and fresh, same-source, same-candidate slot evidence. Missing party size requires user input; it cannot silently become a recommendation.

The Interpreter proposes the goal, the Compiler/Reducer persist it, the Validator derives eligibility, and the Router binds only authoritative request values. The Agent selects a next action but neither sets the goal nor treats a successful retrieval as a condition fact.

Negative HARD conditions use the ordinary criterion contract. A candidate may be accepted only when a source-linked fact records `verifiedNegativeCriteria`; `violatedNegativeCriteria` is a conflict; neither an absent keyword nor a broad type label is proof. For an explicitly type-scoped criterion, a concrete source primary type may support an auditable judgment; broad `restaurant`, `cafe`, or `food` type labels remain unknown. This is not a cuisine ontology and does not globally reinterpret phrases such as “not spicy.” The H002 clarification is supplied as ordinary clarified user content and uses the same semantic and runtime path as Web.

Discovery terms remain retrieval hints, not a serialized copy of every condition. The Google adapter receives normal negative criteria only for post-discovery source-fact grounding; it does not append exclusions to a text query.

When Google reports its run-level search budget exhausted, that stable failure is retained in task state and Agent Context. Validator rejects later discovery actions regardless of a rewritten retrieval hint. The system records the exhaustion as an execution limitation rather than asking the user to resolve an internal budget or pretending no restaurants exist. Other lawful evidence paths remain separately selectable.

The diagnostic evaluator reads target goal and generic positive/negative fact claims from the saved artifact. It does not use `caseId` to amend execution state or source criteria. Pre-existing execution artifacts and their evaluations remain historical records; they are not retroactively replaced.

This is an incompatible development-pilot semantic shape for persisted drafts containing the old query-only target. Local development Restaurant cases must be reset before reusing them; no compatibility reader or dual write is added. No production pilot data or external consumer exists.

## Consequences

- Two requests with the same party size can have different delivery standards according to the requested outcome.
- A fact recommendation can complete without an availability read; optional availability is omitted unless it can be bounded without delaying core delivery.
- H002 no longer has an Eval-only behavior branch, and H004 no longer relies on a party-size heuristic.
- `restaurant-semantic-prompt@8`, `restaurant-agent-context@4`, `restaurant-agent-decision-prompt@9`, and `restaurant-hybrid-read-diagnostic-evaluator@6` are distinct versioned artifacts for this decision.
- This ADR adds no booking, payment, login, recurring refresh, provider fallback, or generic planning framework.

## Alternatives considered

- Increase Google or Agent budgets: rejected because it conceals exhausted-source loops without making another call legal.
- Infer a recommendation/availability profile from party size: rejected because party size is an input parameter, not the user’s requested outcome.
- Retain H002 evaluator mutation: rejected because scoring must never enrich or modify production execution state.
- Treat a missing negative keyword as evidence: rejected because it cannot support a source-grounded exclusion claim.
