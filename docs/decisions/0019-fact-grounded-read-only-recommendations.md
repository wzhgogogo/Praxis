# ADR-0019: Fact-grounded read-only recommendations

- Status: Accepted
- Document revision: 1.0
- Last updated: 2026-09-10
- Source of truth for: Read-only Restaurant recommendation completion when the user did not request availability
- Related documents: [ADR-0014](0014-search-only-results-completion.md), [ADR-0015](0015-supported-source-search-evidence.md), [ADR-0018](0018-availability-display-freshness-and-recheck.md), [Restaurant Booking Domain](../domains/RESTAURANT-BOOKING.md), [User Flows](../product/USER-FLOWS.md)

## Context

ADR-0014 established evidence-bounded `PRESENT_RESULTS` for an availability search. The same Restaurant path also receives read-only requests such as a nearby cafe for an afternoon meeting. Requiring party size, a reservation source, or a slot for such a request either asks for irrelevant information or incorrectly treats opening hours as availability.

## Decision

One Restaurant read-only path supports two evidence profiles:

- An availability request has a party size and retains ADR-0014/0015's HIGH identity, requested-slot and display-freshness requirements.
- A fact-only recommendation has no party size. It may reach `PRESENT_RESULTS` only when the same candidate has HIGH identity, applicable area, each HARD type fact, and an applicable source opening-hours fact for the requested visit window. It makes no availability assertion.

The Agent continues to select only a business action from code-derived context. The Validator computes the applicable profile and eligibility; the Router binds the authoritative request; the Runtime remains the sole State writer. Google weekly opening-hours data is a source fact for the requested local date/window, not a claim that the venue is open now, a table is free, or a special-date schedule is known.

An explicitly clarified negative restaurant-type condition may carry its case-scoped source terms. A candidate is accepted only from explicit source-stated restaurant type/cuisine facts: a matching prohibited type is a conflict, no applicable type fact is unknown, and absence of a keyword never establishes satisfaction. The H002 terms are frozen in its eval policy and do not redefine ordinary user expressions globally.

Device coordinates are one-shot task input only for `nearby`; they are kept task-local and distinguished from the fixed Higashi-Ginza public evaluation coordinate. Location failure or denial falls back to a normal user message containing a place. There is no server-derived user location, tracking, scheduler, booking, payment, third-party login, or new browser framework.

## Consequences

- H004 can complete its core cafe recommendation without an availability read. Optional availability remains separate and must not block it.
- Existing availability displays and future booking recheck obligations are unchanged.
- H002/H005 negative HARD claims fail closed until an explicit, applicable source type fact is recorded.
- Eval evaluates fact-only completion separately from availability and preserves `UNKNOWN`, explicit conflict, and source failure as different outcomes.

## Alternatives considered

- Require availability for every Restaurant result: rejected because it changes a cafe recommendation into a reservation flow and conflates open hours with inventory.
- Trust a search query, restaurant name, or missing keyword for negative cuisine conditions: rejected because none is a source fact.
- Add a general cuisine ontology or provider-specific fallback: rejected because this slice has one clarified case and existing source paths suffice.
