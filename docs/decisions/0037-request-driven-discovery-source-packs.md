# ADR-0037: Request-driven discovery with source-owned packs

- Status: Accepted; implemented, Phase2 offline verified
- Document revision: 1.1
- Last updated: 2026-10-07
- Source of truth for: Discovery source selection, pack ownership and durable sequence continuation
- Supersedes in part: [ADR-0032](0032-source-native-restaurant-discovery.md) fixed source order and mutually exclusive Google/native discovery; [ADR-0033](0033-native-source-batch-delivery.md) fixed source-stage continuation
- Related documents: [ADR-0036](0036-generic-public-read-network-policy.md), [Restaurant Domain](../domains/RESTAURANT-BOOKING.md), [Capability Matrix](../integrations/CAPABILITY-MATRIX.md)

## Context

The authorized H001→H001–H005 Playbook requires request-driven source selection.
The existing fixed two-source sequence, binary discovery flag and source names
inside shared layers cannot represent cafe recommendation, coordinate-nearby
search and Google discovery in the same execution path. Two actual web sources
already own different query, parsing and grounding rules; these establish the
current need for a small source-pack contract.

## Decision

1. Source packs in integrations own source metadata, query/listing and next-page
   parsing, identity, deterministic request URLs and availability grounding,
   reviewed network reads and browser skill text. The registry supplies the
   current real packs. Only currently used capabilities need implementation;
   packs do not own UI permissions or Task State.
2. A deterministic Domain/application Planner consumes canonical intent,
   authoritative location and pack metadata. It returns an ordered sequence of
   opaque source IDs and queries. Source-specific name branches, URL construction,
   parser branches and Case IDs do not appear in shared application, Domain or
   browser infrastructure. Provenance data is not a source-selection branch.
3. Positive HARD conditions may form a search keyword/category. Negative-only
   or no-HARD requests use location and a general category; negative conditions
   stay in the fact/eligibility stage. Recommendation excludes reservation-only
   sources. Group/same-day priorities follow declared source capabilities.
4. Nearby uses supplied client/evaluation coordinates and the existing radius;
   it does not become a named area or inherit another request's location.
   Google named-place resolution remains shared by sources. Google Places
   discovery is a pack in the same plan, not a mutually exclusive mode.
   Source-specific region mappings belong to pack data and cannot replace
   final distance verification.
5. Durable continuation records the intent-bound source plan, sequence cursor
   and cumulative per-source progress. A chunk is not source exhaustion.
   Observed pending entrances and next pages remain reusable within the same
   budget. Current source-batch investigation and qualified short-delivery
   semantics remain separate from continuation; explicit counts and all
   evidence gates remain authoritative. Mixing discovery sources does not
   establish cross-platform identity or create an entity-merging system.
6. Source-native candidates retain observed same-source identity and entrances;
   Google candidates retain cross-source HIGH checks. Every result still needs
   current identity, geographic scope, HARD evidence and request-bound stock
   when applicable. Browser reads cannot issue an Offer or change Task State.

The fixed nativeStage and binary discovery flag are removed with all callers
and fixtures. Incompatible durable DTOs receive a new owned schema version.
This is pre-Pilot code: no production-data migration or compatibility path is
needed; old experimental development state is explicitly reset rather than
silently reinterpreted. Original artifacts and decisions remain historical.
Semantic, Gold, HARD, identity and radius thresholds and the 500s/50-call global
budget do not change.

## Consequences

Phase2 acceptance requires auditable frozen H001–H005 Planner outputs and
production Router→Provider composition, including negative-only, cafe and
nearby controls. Pure Planner output does not establish source discovery or
inventory. Real-source matrices and full delivery remain later Playbook gates.
Shared code has no source-name branches; a new pack still needs reviewed source
evidence, Capability Matrix and Harness coverage. No generic business framework,
fallback provider or speculative capability layer is introduced.

## Alternatives considered

- Keep two mutually exclusive discovery paths: rejected by the authorized
  Playbook; it hides valid complementary sources and request differences.
- Let the browser model invent source URLs and deterministic query parameters:
  rejected when the current pack can construct them from authoritative inputs.
- Merge candidate identities across platforms automatically: outside this slice;
  discovery origin never substitutes for verified same-store identity.
- Rewrite accepted historical decisions: rejected; only their specified details
  are superseded here.

## Implementation evidence

Phase2 frozen H001–H005 plans retain named-location defaults (H001/H0021km)
and supplied nearby coordinates (H003–H0053km). The actual three-pack
composition presents supported controlled results; source skill, timezone,
location reuse and provider bindings are covered. [Acceptance and limits](../../.eval-artifacts/h001-h005-playbook-20261007/root.phase2.acceptance.json).
No real-source matrix or stock is certified. Current audit provider labels and
source diagnostics remain; third-source zero-core-change acceptance is Phase6.
