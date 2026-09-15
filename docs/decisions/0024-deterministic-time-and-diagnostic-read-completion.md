# ADR-0024: Deterministic time and diagnostic read completion

- Status: Accepted
- Document revision: 1.1
- Last updated: 2026-09-15
- Source of truth for: Tokyo-relative time materialization, current no-slot applicability, and read-only completion classification
- Supplements: [ADR-0018](0018-availability-display-freshness-and-recheck.md), [ADR-0020](0020-goal-driven-restaurant-read-path.md), [ADR-0022](0022-current-source-fact-lifecycle-and-identity.md)
- Related documents: [Restaurant Booking Domain](../domains/RESTAURANT-BOOKING.md), [User Flows](../product/USER-FLOWS.md), [Eval Skill](../skills/eval/SKILL.md)

## Context

The semantic prompt previously asked the model to turn relative language into a calendar date and local time, even though the application already owns the reference instant and the Tokyo-only restaurant timezone. The Agent prompt also forced an immediate presentation whenever recommendation facts were currently eligible, preventing a lawful bounded observation from informing the full user goal. Finally, diagnostic output treated every non-presentation as merely not evaluated, obscuring a normal evidence-bounded no-result from an internal execution failure.

## Decision

The semantic model proposes only a small temporal meaning contract: explicit user calendar/clock values, `TODAY`/`TOMORROW`, a weekday, `AFTERNOON`, or a non-negative relative-minute offset. Domain code materializes those directives from an explicit reference instant in `Asia/Tokyo`; it records the raw expression, reference instant, timezone, materialized result and policy basis in the authoritative draft. `AFTERNOON` is 12:00–17:00. This does not introduce a general natural-language date parser, IP location inference, or model-generated code execution.

The delivery goal still determines the minimum evidence profile. A recommendation with complete date, time and party parameters may perform a bounded, ordinary availability read when the Agent judges it useful; it is not mandatory merely because party size exists. A current, request-bound `UNAVAILABLE` observation excludes that candidate for that request and cannot be hidden behind an earlier opening-hours fact. `UNKNOWN`, inaccessible pages, missing reservation controls and unapplied conditions remain unknown: none is converted to no slot, no reservations, walk-in availability, or a qualified recommendation. A specific no-slot observation never expands to another date, party size or time window.

Execution artifacts and the existing independent evaluator classify a terminal record as a qualified result, no confirmable result, required user input, internal execution failure, or not evaluable. A bounded no-result can have supported investigation behavior without a `PRESENT_RESULTS` claim. Internal model/Router/semantic failures remain non-supported and must not be presented as ordinary search exhaustion. Execution remains saved before evaluation; failed evaluation remains a sidecar.

## Consequences

- The current prompt versions are `restaurant-semantic-prompt@10` and `restaurant-agent-decision-prompt@12`; historical artifacts retain their recorded versions.
- Browser and provider observations retain their source and request bindings. The model may select a valid next action or issue a cited derived type judgment, but never writes State or promotes its own statement into source fact.
- Negative restaurant-type conditions retain the ADR-0020 contract: explicit source-linked support, conflict, or unknown. This does not globalize the clarified H002 interpretation or claim subjective suitability quality.
- No booking, login, payment, cancellation, scheduler, provider marketplace, general planner, site-specific fallback, Live call, or external write is added.

## Alternatives considered

- Let the model normalize all relative dates: rejected because the result depends on trusted current time and target timezone.
- Present immediately after opening-hours facts: rejected because it can prevent a lawful current observation from changing the applicable conclusion.
- Call every non-presentation “no results”: rejected because internal execution and source uncertainty require different user and operational handling.
