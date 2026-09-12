# ADR-0021: Cited source-fact investigation for Restaurant recommendations

- Status: Accepted; identity-number detail superseded by ADR-0022
- Document revision: 1.1
- Last updated: 2026-09-11
- Source of truth for: Named-place distance evidence and cited public-source fact investigation
- Supplements: [ADR-0020](0020-goal-driven-restaurant-read-path.md) and [ADR-0015](0015-supported-source-search-evidence.md)
- Related documents: [Restaurant Booking Domain](../domains/RESTAURANT-BOOKING.md), [Capability Matrix](../integrations/CAPABILITY-MATRIX.md), [Agent Orchestration](../architecture/AGENT-ORCHESTRATION.md)

## Context

ADR-0020 establishes when a fact recommendation may be displayed, but the prior implementation could substitute an administrative address label for a named place such as a station. It also treated Google-listed websites as a JSON-LD-only probe. That left ordinary recommendation requests unable to close a missing type or opening-hours fact without either weakening evidence or mistaking a source limitation for missing user input.

## Decision

For a named nearby place, the Google discovery capability first obtains an observed coordinate-bearing place result under the same run-scoped Google budget as discovery. Candidate eligibility uses calculated distance from that observed coordinate, records the resolution query, source place ID, observed time and radius, and never treats search bias as distance proof. Only multiple exact source name matches with distinct coordinate-bearing results cause a disambiguation question. An unavailable or malformed source result remains a source limitation, not a claim that the user's requirement is unclear.

Fact investigation is gap-driven. It first consumes existing Google Place Details facts and a Google-listed `websiteUri`; after Google exhaustion, an already observed website pointer remains a lawful bounded browser path. The pointer is a source lead, not proof of domain ownership or outlet identity.

A public website may produce candidate-bound type or opening-hours facts from matching JSON-LD or narrow visible source content. High identity requires the candidate name plus matching address evidence: normalized containment or the same ordered numbered address components. Name alone, a missing address, or a conflicting address remains `UNKNOWN`. Stored evidence preserves the source URL, candidate association, observation time and a stable DOM-excerpt fingerprint; raw page text is not promoted to normal logs.

Where a clarified negative restaurant-type criterion requires interpretation, the model may return only a cited judgment over already observed concrete type facts. The Router retains the judgment as ordinary evidence and records its bounded model-call/token metadata. The model cannot write State, create a URL, identify an outlet alone, or turn a broad label, an absent keyword, or a claim about individual spicy dishes into a negative-condition pass. Reducer and Evaluator retain source association and evaluate the resulting evidence independently.

This decision adds no website-specific fallback, recurring refresh, booking, payment, login, or external write. Persistent Task State records results; it does not by itself promise that an interrupted in-process Web investigation will resume after server restart.

## Consequences

- A nearby station, district, and device coordinate use distinct evidence paths.
- A fact-only recommendation can investigate its precise missing facts without forcing an availability request.
- A Google Maps URL, Google-listed URL, visible prose, and a model conclusion remain separately attributed rather than being presented as the same source.
- Browser source access or identity failure is an auditable `UNKNOWN`; it is never rewritten as no availability or a qualified recommendation.
- Local development data may be reset instead of supporting old execution shapes; no production consumer or pilot data exists.

## Alternatives considered

- Address-string equality or a station-to-district alias: rejected because it either rejects harmless formatting differences or asserts an unobserved geographic relation.
- Allow the model to write website facts directly: rejected because source, candidate and observation boundaries would no longer be independently auditable.
- Require JSON-LD for every website: rejected because public source facts can be visibly present without it.
- Treat persistence as a durable job queue: rejected for this slice because no restart-safe worker lifecycle or cancellation protocol has been implemented.
