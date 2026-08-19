# ADR-0009: Semantic Criterion Strength and Auditable Clean Holdout Baseline

## Status

Accepted — 2026-08-18

ADR-0010 supersedes this ADR's former assumption that the semantic evaluator's deterministic next-step label corresponds to a product Runtime decision. The open `criteria` and Clean Holdout controls remain accepted.

## Context

ADR-0008 correctly replaced unstable Restaurant criterion categories with an open collection, but its `REQUIRED` / `PREFERRED` strength labels and lexical trigger guidance do not express the product distinction needed by the v17 semantic specification. A criterion can be materially necessary without one of a short list of words, while approximate language is normally tradeable.

The first manually annotated Restaurant semantic dataset must also produce one auditable clean baseline. The existing runner already creates one non-overwritable artifact before evaluating a dataset, but the artifact did not explicitly record the dataset exposure state or the complete code/scorer configuration needed for later review.

## Decision

Restaurant v17 retains ADR-0008's open `CRITERION{text, polarity, strength}` collection, but replaces its strength vocabulary and interpretation with:

```ts
strength: "HARD" | "SOFT" | "UNSPECIFIED";
```

- `HARD` means violating the criterion would make the result materially wrong for the user.
- `SOFT` means an explicit preference or approximation that can be traded off.
- `UNSPECIFIED` is only for genuinely unexpressed or non-inferable strength.
- The Semantic Interpreter interprets strength from user intent rather than a lexical-only word list. It continues to return only an untrusted Proposal.
- Relative time is normalized against the frozen Tokyo reference time; relative locations remain relative AREA queries; a clear closed participant set may provide party size; and approximate budgets remain SOFT criteria unless the user clearly states a hard maximum.

This is an incompatible semantic contract change. Proposal and Draft Schema move to `3`, Restaurant State to `6`, Prompt to `v4`, and the deterministic scorer/evaluator protocol to `3`. There is no compatibility path because no production Restaurant State or external consumer exists. The delivery therefore uses `codex/restaurant-decision-v17` while preserving the v16 branch.

For the private Clean Holdout, immediately before a first real model request the existing exclusive baseline artifact is written with `datasetStatus: "EXPOSED"` and `exposedAt`. Any existing artifact for the frozen dataset version causes the runner to refuse another `CLEAN_HOLDOUT` attempt, whether the first run completed or failed. The artifact is Git-ignored and includes the dataset SHA-256, frozen provider manifest, git commit SHA, scorer version, and prompt/schema hashes. These fields establish auditability, not bit-for-bit Provider reproducibility.

## Consequences

- Existing source, fixtures, schemas, scorer expectations, and private Gold must use `HARD` / `SOFT` / `UNSPECIFIED`; old values are not accepted.
- The public development regression remains exposed and receives synthetic coverage for the new general semantics before any private baseline runs.
- The private dataset is never copied into a prompt, public fixture, development log, or committed artifact. Its first started real run irreversibly changes its evaluation status to `EXPOSED`.
- Compiler, Runtime, Reducer, Policy, Authorization, and Provider capabilities retain their existing responsibilities. In v18, semantic `expectedDecision` is historical evaluation metadata only; the Restaurant Agent and Action Validator are governed by ADR-0010. This ADR adds no model call, Tool, adapter, or external side effect.

## Alternatives considered

- Keep `REQUIRED` / `PREFERRED` and reinterpret them in documentation: rejected because persisted/evaluated values would still encode the old incompatible meaning.
- Derive strength with a deterministic lexical parser: rejected because semantic strength is an Interpreter responsibility and the word list is insufficient.
- Create a separate exposure database or service: rejected because the existing ignored, exclusive artifact provides the required single-dataset lock with less machinery.

## Related documents

- [ADR-0007](0007-semantic-proposal-compiler-and-decision-kernel.md)
- [ADR-0008](0008-open-restaurant-criteria-contract.md)
- [Restaurant Booking](../domains/RESTAURANT-BOOKING.md)
- [Restaurant Semantic Holdout](../harness/RESTAURANT-SEMANTIC-HOLDOUT-V2.md)
- [Eval Skill](../skills/eval/SKILL.md)
