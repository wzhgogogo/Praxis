# ADR-0030: Bounded unknown for restaurant category exclusions

- Status: Accepted
- Document revision: 1.0
- Last updated: 2026-09-20
- Source of truth for: eligibility treatment of an unresolved restaurant/cuisine/venue-type exclusion
- Partially supersedes: [ADR-0020](0020-goal-driven-restaurant-read-path.md), only its requirement that every negative HARD category exclusion needs verified-negative evidence. All non-category, identity, positive-evidence and availability rules remain in force.
- Relates to: [ADR-0019](0019-fact-grounded-read-only-recommendations.md), [ADR-0020](0020-goal-driven-restaurant-read-path.md), [ADR-0021](0021-cited-source-fact-investigation.md)

## Decision

The ordinary negative HARD rule remains fail closed: a cited source fact must record `verifiedNegativeCriteria`, and `violatedNegativeCriteria` always blocks presentation. An absence, a name, or a broad label is not a verified-negative fact.

There is one narrower eligibility-only exception. When the Fact Judgment boundary receives a cited, candidate-bound restaurant type fact and returns `UNKNOWN` with scope `RESTAURANT_CATEGORY_TYPE` for the exact negative HARD criterion, it may record `categoryUnknownNegativeCriteria`. That claim says only that the cited category evidence establishes no known violation. It may permit eligibility, but it never becomes `verifiedNegativeCriteria`, a user-facing factual assertion, or a general negative-condition taxonomy.

`OTHER` and `UNKNOWN_SCOPE` remain fail closed. In particular, allergy, contamination, medical, legal, accessibility, safety and similarly non-category conditions cannot use this exception. Cited raw type facts and an independently HIGH same-source identity association remain required; stable entity knowledge additionally requires a source-stated entity name, never an opaque source ID. A venue name alone is not category evidence. Current-source and supersession rules still apply.

The evaluator independently reconstructs candidate binding, cited raw source facts, HIGH identity/source association and currentness. It does not call production eligibility to certify this exception. A known `violatedNegativeCriteria`, cross-candidate citation, missing citation/identity, or superseded fact blocks acceptance before the category-unknown allowance is considered.

## Consequences

- The Fact Judgment schema adds an explicit scope enum and Prompt@7; no category, cuisine, or brand word list is introduced.
- Broad raw type facts are sent to the existing Fact Judgment call only when a negative HARD judgment needs them. They cannot be promoted into positive support or a verified-negative fact.
- A user message such as "no ramen" or "no conveyor belt" follows the ordinary semantic input path and changes authoritative State; it is not selection feedback.
- Broad type observations formerly filtered before invocation can now reach the existing single bounded fact-judgment call when a negative HARD criterion is present. No separate scope-classifier call is added. This does not permit booking, alter source read limits, or change frozen Gold/source fixtures.

## Alternatives considered

- Treat every negative HARD `UNKNOWN` as eligible: rejected because it would weaken safety and factual exclusions.
- Maintain a cuisine, brand, or category keyword list: rejected because it would become a hidden taxonomy and would not establish source facts.
- Reuse production eligibility in the evaluator: rejected because execution and independent acceptance would share the same defect surface.

## Related documents

- [Restaurant Booking Domain](../domains/RESTAURANT-BOOKING.md)
- [Current read-only acceptance contract](../../src/eval/restaurant/agent-loop/cases/README.md)
