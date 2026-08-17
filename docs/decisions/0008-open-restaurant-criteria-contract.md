# ADR-0008: Open Restaurant Criteria Semantic Contract

## Status

Accepted — 2026-08-17

## Context

The v15 Semantic Proposal asked the model to classify each user expression as `CUISINE`, `HARD_CONSTRAINT`, or `SOFT_PREFERENCE`. That ontology is not stable at the language boundary: expressions such as omakase, quiet, private room, allergy wording, or a stated exclusion can be reasonably framed more than one way. Requiring the model to choose a category made correct state accumulation depend on an unnecessary semantic classification.

ADR-0007's responsibility chain remains sound. This decision changes only the Restaurant-owned semantic payload and its incompatible state/eval version; it does not add another model step, runtime layer, policy, provider mapping, or search strategy.

## Decision

Restaurant v16 replaces the three classified collections with one open collection:

```ts
type RestaurantCriterion = {
  text: string;
  polarity: "POSITIVE" | "NEGATIVE";
  strength: "REQUIRED" | "PREFERRED" | "UNSPECIFIED";
};
```

- Stable slots remain `TARGET`, `DATE`, `TIME_WINDOW`, `PARTY_SIZE`, `AREA`, and `BUDGET_PER_PERSON`.
- Every other user-expressed restaurant selection requirement is a `CRITERION`; the Semantic Interpreter does not assign a cuisine, amenity, ambience, safety, or provider taxonomy.
- `text` preserves concise user wording. `polarity` records an explicit avoidance. `strength` is `REQUIRED` only for explicit must/need/no/don't-want language, `PREFERRED` only for explicit ideally/prefer/would-be-nice language, and otherwise `UNSPECIFIED`.
- `CRITERION` has deterministic collection behavior: `ASSERT` adds, `CORRECT` replaces the collection, and `NEGATE` removes the matching criterion. Equality is trim- and case-insensitive for text and exact for polarity and strength.
- The Contract, Compiler, Reducer, complete Intent, Regression, Holdout preflight, and deterministic scorer move directly to Schema `2`; Restaurant durable state moves to Schema `5`. There is no v15 compatibility path because there is no production state or external consumer.
- Search remains unchanged. A future deterministic Search Criteria Compiler may translate authoritative criteria for a particular provider, but it is not part of this decision or implementation.

## Consequences

- Evaluation measures whether the user expression is preserved with its explicit polarity and strength, not whether the model selected a disputed ontology bucket.
- The previous v15 Prompt/Proposal Schema and unrun holdout shape are historical development material. A new private v16 Holdout must be annotated against `expectedDraft.criteria` before any Clean Baseline.
- Later provider-specific handling of safety or availability requirements must be designed at that trusted boundary. It must not retroactively make the semantic interpreter a policy classifier.

## Alternatives considered

- Expand the cuisine/constraint/preference taxonomy: rejected because it increases unstable boundary classification without a current product consumer.
- Let the model emit provider search filters: rejected because there is no trusted provider mapping and it would widen model authority.
- Add an LLM judge for textual criterion equivalence: rejected because current Gold can use deterministic trim/case/order comparison.

## Related documents

- [ADR-0007](0007-semantic-proposal-compiler-and-decision-kernel.md)
- [Restaurant Booking](../domains/RESTAURANT-BOOKING.md)
- [Restaurant v16 Semantic Holdout](../harness/RESTAURANT-SEMANTIC-HOLDOUT-V2.md)
