# ADR-0022: Current source-fact lifecycle and outlet identity

- Status: Accepted
- Document revision: 1.0
- Last updated: 2026-09-12
- Source of truth for: Current fact applicability, derived-fact attribution, and candidate-bound website identity
- Supersedes: the ordered-number-components identity acceptance in [ADR-0021](0021-cited-source-fact-investigation.md)

## Context

ADR-0021 correctly separated a Google-listed URL from source facts, but its ordered street-number rule could bind same-name outlets in different cities. It also did not distinguish retained historical facts from the newest fact observation used to support a refreshed result. As a result, an old positive fact could hide a new `UNKNOWN`, closed-hours observation, or conflict.

## Decision

Each candidate fact check identifies the evidence emitted by its **current** bounded observation. Historical evidence remains immutable for audit and may explain a prior presentation, but only the current check's fact evidence can satisfy a current recommendation condition. A completed refresh replaces the applicable fact set even if it yields `UNKNOWN`, a conflict, or no qualifying fact. The Router cites the same Validator-derived current set when it presents results.

Named locations require an exact coordinate-bearing source-name match. Search rank is never a substitute. Website candidate identity accepts normalized containment, or matching ordered numeric components together with available non-numeric locality components; a shared street number alone cannot bind an outlet. This permits ordinary punctuation/order variation while rejecting an explicit different city or district. It does not add aliases or place-specific exceptions.

`MODEL_JUDGMENT` is a derived evidence provider, not a source page. A judgment carries cited raw evidence IDs and no copied source entity identity. Evaluation checks that every cited raw fact exists in the displayed candidate chain and is itself bound to a HIGH identity; an uncited or cross-candidate judgment is rejected.

Website reading is gap-driven. Structured data is a fast path, not a terminal result merely because it establishes identity. The same observed page can supply complementary visible type or hours facts. A fact-only request omits reservation parameters that the user did not provide.

## Consequences

- Refresh preserves history without allowing stale facts to impersonate a new observation.
- Web and Hybrid use one browser-backed Google → website → cited-judgment composition, with a run-local shared browser model budget.
- Browser source text remains a bounded observation; logs retain source URL/fingerprint rather than raw DOM or hidden reasoning.
- This decision does not add an official-site assertion, source-specific fallback, background refresh, booking, login, payment, or write action.

## Alternatives considered

- Preserve all facts as equally current: rejected because a newly observed failure or conflict would be hidden.
- Accept matching house numbers: rejected because unrelated same-name branches commonly share them.
- Attribute a model conclusion to the first source provider: rejected because it disguises derived reasoning as a source observation.
