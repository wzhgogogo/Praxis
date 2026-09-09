# ADR-0018: Availability display freshness and read-only recheck

- Status: Accepted
- Document revision: 1.0
- Last updated: 2026-09-09
- Source of truth for: Restaurant availability display freshness, read-only recheck, and future booking recheck boundary
- Related documents: [ADR-0014](0014-search-only-results-completion.md), [ADR-0015](0015-supported-source-search-evidence.md), [Restaurant Booking Domain](../domains/RESTAURANT-BOOKING.md), [Agent Orchestration](../architecture/AGENT-ORCHESTRATION.md)

## Context

The previous single `expiresAt` was used both to decide whether a read-only result could be shown and whether a future booking could proceed. A long investigation could also let an already-grounded observation age out before presentation, while the loop prohibited every repeat check and could repeatedly propose an invalid presentation.

## Decision

`restaurant-availability-display-freshness@1` defines a 10-minute initial display window from each actual observation. A source-declared expiry may shorten this window and can never be extended by local policy. `displayExpiresAt`, source expiry, policy version, observation time, and request binding are recorded with evidence and checks. Re-reading State, rendering an Offer, or re-presenting results never changes observation time.

`PRESENT_RESULTS` uses only current display evidence for the unchanged authoritative request. Once an eligible candidate exists, the Agent must present it rather than exhaust the candidate pool. Old observations remain historical candidate evidence but cannot substantiate a new availability claim.

A `CHECK_AVAILABILITY` can repeat only for code-derived reasons: expired display evidence or a user-requested refresh of previously presented candidates. The Router binds the recheck reason and prior evidence references; the Runtime preserves historical observations and links new evidence as superseding it. Rechecks are read-only, bounded by the existing shared budgets, cancellation, no-progress controls, and existing browser/source chain. There is no scheduler, provider-specific fallback, or whole-pool refresh.

The Agent Context contains current time plus code-derived display eligibility, missing evidence, and recheck eligibility. Repeating the same rejected action terminates with the actual rejection cause instead of silently consuming the budget.

Display freshness is not booking authority. A future booking must freshly verify the same outlet, date, party size, time, plan, price, and material terms. A definite first-choice no-slot result may lead to investigation of an authorized second choice; it cannot authorize second-choice submission. A verification failure is unknown, not no availability; any submit result that is unclear remains `OUTCOME_UNKNOWN`.

## Consequences

- The local Web workspace exposes a simple explicit refresh only while read-only results are presented; it does not add booking controls or recurring polling.
- Explicit unavailable evidence, expired evidence, and failed/unknown rechecks remain distinguishable in State and trace metadata.
- Historical presentations are evaluated at their immutable `presentedAt`; expiration today does not rewrite an earlier result.
- ADR-0014 retains its evidence and non-booking completion rules; this ADR refines its freshness and recheck semantics.

## Alternatives considered

- Increasing one shared TTL: rejected because it would conflate presentation with booking safety and hide slow execution.
- Never rechecking a candidate: rejected because an expired or user-refreshed displayed result needs a bounded read-only path.
- Periodically refreshing every candidate: rejected because it spends budget without a display, user, or future-action need.
- Treating failed rechecks as no availability: rejected because source failure is not negative slot evidence.
