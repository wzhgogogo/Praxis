# ADR-0029: Criterion Strength and Nonblocking Preferences

## Status

Accepted — 2026-09-18. Supersedes ADR-0009's definition of `UNSPECIFIED`.

## Context

ADR-0009 correctly kept criterion strength semantic rather than lexical-only, but
defined `UNSPECIFIED` only as genuinely unexpressed or non-inferable. That makes
an expressed selection condition appear mandatory merely because the user did not
state either strictness or flexibility. The read path would then require evidence
for a preference before it could present an otherwise qualified restaurant.

## Decision

`CRITERION{text, polarity, strength}` remains the open Restaurant contract and
the production enum remains `HARD | SOFT | UNSPECIFIED`.

- `HARD` is a core requested object/type, explicit exclusion/restriction,
  explicit mandatory language, or existing firm numeric semantics.
- `SOFT` is explicitly tradeable, approximate, or optional.
- `UNSPECIFIED` is an expressed selection condition whose wording supplies
  neither non-negotiability nor flexibility.

Strength is semantic model output, not a keyword table. Criterion identity is
normalized text plus polarity; a later user semantic proposal updates the same
criterion's strength rather than creating a duplicate. Distinct polarities remain
distinct criteria.

Only `HARD` is mandatory in discovery, fact grounding, availability request
construction, read assessment, eligibility, and diagnostic evidence checks.
`SOFT` and `UNSPECIFIED` remain visible nonblocking preferences: they can guide
bounded retrieval and candidate choice, but missing evidence cannot disqualify a
candidate and no satisfaction claim may be made without candidate evidence.

## Consequences

- Semantic Prompt moves to v20 and Agent Decision Prompt to 15.
- The exposed development dataset changes from `restaurant-read-development@4`
  to `@5` only for H003's four strength annotations; historical @4 artifacts and
  conclusions remain unchanged.
- A `UNSPECIFIED`/`SOFT` wording or strength mismatch remains diagnostic semantic
  review, while any expected-or-actual `HARD` mismatch remains not satisfied.
- No new source provider, preference scorer, semantic judge, model call, or
  browser/Live capability is introduced by this decision.

## Alternatives considered

- Treat every unmarked condition as HARD: rejected because it turns ordinary
  stated preferences into evidence gates without an expressed user commitment.
- Treat every contextual/subjective condition as SOFT: rejected because it is a
  category mapping and discards genuine mandatory wording.
- Add a deterministic keyword classifier: rejected because modifiers and scope
  require the existing semantic interpreter boundary.

## Related documents

- [ADR-0009](0009-semantic-strength-and-clean-holdout-baseline.md)
- [ADR-0020](0020-goal-driven-restaurant-read-path.md)
- [Restaurant read development cases](../../src/eval/restaurant/agent-loop/cases/README.md)
