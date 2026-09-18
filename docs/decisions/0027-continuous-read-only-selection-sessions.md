# ADR-0027: Continuous read-only selection sessions

- Status: Accepted; first-batch goal restriction superseded in part by ADR-0028
- Document revision: 1.1
- Last updated: 2026-09-18
- Source of truth for: Restaurant result-batch continuation, delivery history and discovery cursors
- Related documents: [ADR-0014](0014-search-only-results-completion.md), [Restaurant Booking Domain](../domains/RESTAURANT-BOOKING.md), [Interfaces and Schemas](../architecture/INTERFACES-AND-SCHEMAS.md)

## Context

ADR-0014 correctly required current evidence before exposing a read-only result, but treated `PRESENT_RESULTS` as a terminal Task outcome. That prevents ordinary user actions such as viewing the next result, retaining a shortlist, or asking for another same-condition batch from using the already investigated candidate pool. Repeating an exhausted discovery request under new wording also wastes quota and can hide the distinction between "not available" and "not investigated".

## Decision

`PRESENT_RESULTS` is a paused, user-continuable read-only selection session, not a Task terminal outcome. `RESULTS_PRESENTED` preserves a durable set of delivered and viewed candidate IDs and a user-managed shortlist. Local browsing and shortlisting are state-only events: they do not invoke a model, Google, a browser, or any booking path.

For an explicitly classified open-ended recommendation, the first batch has a default target of three qualified distinct candidates; an explicit user count replaces that default. A named/specific-outlet target and legacy unclassified target are not expanded mechanically. An explicit next-batch request likewise first presents three already grounded, unshown candidates without a new read. If either target is not yet met, it records a bounded replenishment target and re-enters the existing single Agent loop. The Agent may use only normal legal actions; the Router binds an intent-matching Google continuation cursor. A smaller batch is permitted only after discovery and eligible fact/availability reads are unavailable, and is durably marked unmet rather than silently treated as complete. An exhausted or mismatched cursor cannot be restarted by changing a retrieval hint.

Selection feedback such as "too expensive" is retained verbatim for a later Agent comparison. It is neither source evidence nor an inferred numeric budget or changed authoritative condition. Explicit condition edits remain the Semantic Interpreter → Compiler → Reducer path and conservatively invalidate request-bound discovery and availability evidence; shortlist IDs survive only as recheckable user memory.

## Consequences

- A result card is a current, evidence-grounded batch, not a claim that the whole Task or all candidate inventory is complete.
- An insufficient candidate pool is reported through bounded continued investigation or a scoped no-result, never by duplicating cards or silently resetting discovery.
- Persistent Web composition tests cover both the zero-read local path and the cursor-backed replenishment path with external model/source boundaries replaced. They do not prove real model selection or current website behavior.
- No new provider, browser loop, booking authorization, or external write capability is introduced.

## Alternatives considered

- Keep `PRESENT_RESULTS` terminal and create a second selection runtime: rejected because it duplicates state and bypasses the existing Router/Validator loop.
- Let a local ranker choose replacement restaurants: rejected because the single Agent retains selection responsibility and code only derives legal scope.
- Treat qualitative feedback as a budget: rejected because it fabricates an authoritative user constraint.
