# ADR-0028: Open-ended result targets for availability

- Status: Accepted
- Last updated: 2026-09-18
- Source of truth for: Open-ended Restaurant result-count targets across recommendation and availability goals
- Supersedes in part: [ADR-0027](0027-continuous-read-only-selection-sessions.md) first-batch target limited to `RECOMMENDATION`
- Related documents: [Restaurant Booking Domain](../domains/RESTAURANT-BOOKING.md), [MVP PRD](../product/MVP-PRD.md), [User Flows](../product/USER-FLOWS.md), [Interfaces and Schemas](../architecture/INTERFACES-AND-SCHEMAS.md)

## Context

ADR-0027 correctly made a result batch durable and user-continuable, but its first-batch target applied only to an open-ended `RECOMMENDATION`. A user seeking several bookable options for a concrete visit is also performing an open-ended restaurant search. Leaving that `AVAILABILITY` request at one result contradicts the current product requirement to investigate toward three qualified distinct options without weakening its per-outlet slot evidence.

## Decision

An explicitly classified `OPEN_ENDED` Restaurant target has a default first-batch target of three qualified distinct candidates regardless of `target.goal`. An explicit user-requested result count replaces that default for either `RECOMMENDATION` or `AVAILABILITY`. `SPECIFIC_OUTLET` and legacy unclassified targets remain unexpanded.

The existing delivery evidence rules do not change: a recommendation requires its applicable current fact evidence, and every availability candidate still requires its own current, outlet-bound date/time/party slot evidence. The Agent may investigate at most three candidates in one legal action; it must continue through ordinary bounded reads until the target is met or no legal read remains. A smaller result is still marked unmet, never padded with unverified candidates.

## Consequences

- `TARGET.requestedResultCount` is valid only with `OPEN_ENDED`, not only with a recommendation goal.
- The paused selection session, cursor reuse, shortlist, feedback, identity gate, Provider order, Authorization and all external-write boundaries remain unchanged.
- Current fixed-source diagnostics use three independently identified candidates per H001–H005 case. They prove the shared offline composition and artifact diagnostics, not real-model behavior or current website inventory.

## Alternatives considered

- Keep availability at one result: rejected because it leaves a concrete open-ended find-a-table request without the promised comparison set.
- Treat a batch of three as three slots at one restaurant: rejected because distinct outlets are the product unit and each must have its own evidence.
- Expand specific-outlet requests: rejected because it changes the user’s named-destination intent.
