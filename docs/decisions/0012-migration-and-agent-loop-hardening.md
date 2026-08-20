# ADR-0012: Migration Integrity and Agent Loop Hardening

## Status

Accepted — 2026-08-20

## Context

ADR-0011 changed the Restaurant trajectory from evidence references to structured causal references, but its implementation rewrote the already-published `0006-restaurant-agent-trajectory` migration. Rewriting an applied migration makes database history non-reproducible. The same pre-Pilot period also contains local `restaurant-state@7` development data that cannot be safely replayed with the incompatible `restaurant-state@8` definition.

The Agent currently receives a full task state even though it needs only a smaller decision view. Read-only Provider operations also need a Router-enforced deadline, and a booking trajectory needs a direct join to the Proposal that later connects Authorization, Attempt, Evidence and Outcome. Finally, `DomainSearchStrategy.hasEnough` needs a precise meaning that does not turn a Discovery threshold into an Availability or Loop-completion claim.

## Decision

- `0006-restaurant-agent-trajectory` remains immutable with its original `evidence_refs` column. New `0007-restaurant-agent-trajectory-causal-refs` adds `causal_refs` and `proposal_id`, copies legacy evidence IDs into `causalRefs.evidenceIds`, and then removes the old column. It is tolerant of the short-lived development form of `0006` that already has `causal_refs`.
- `restaurant-state@7` is development-only incompatible data. It is never transformed or silently replayed as `restaurant-state@8`. A local developer may use the explicit reset command only with both a local `DATABASE_URL` and `PRAXIS_ALLOW_DEV_RESTAURANT_STATE_RESET=1`; it deletes only `restaurant.booking` tasks persisted with schema version `7`, relying on foreign-key cascades for their dependent development records. The command is prohibited for Pilot, staging and production data.
- `restaurant-agent-context@1` is a Restaurant-owned projection. It exposes only the current intent draft, derived missing fields, display-safe candidate/offer selection data, phase and stable failure code needed to choose a business action. It excludes Authorization, Proposal terms, raw Provider output, execution result, Evidence artifacts and Reservation data. The Agent Decision prompt advances to `restaurant-agent-decision-prompt@2`.
- The Execution Router applies an abortable deadline to each Provider read and passes an `AbortSignal` to the adapter. The Router also races the adapter operation against the deadline, so an adapter that ignores cancellation cannot hold the Agent loop indefinitely.
- `restaurant-agent-trajectory@3` stores an optional `proposalId` on the successful `BOOK_RESERVATION` step. The Harness artifact advances to `restaurant-harness-artifact@4`, so a booking trajectory can join its Proposal, Authorization, Command, Attempt, Evidence and Outcome without inferring identity from a free-text observation.
- `DomainSearchStrategy.hasEnough` is a deterministic Discovery-stage stopping threshold: it answers whether the current grounded Candidate set satisfies the Domain's retrieval budget. It does not assert Availability, authorize a booking, terminate the Agent loop, or prevent the Agent from choosing another retrieval step after seeing observations.

## Consequences

- Fresh and upgraded databases have reproducible migration histories; no applied migration is edited again.
- Local incompatible development tasks must be deliberately reset instead of being misinterpreted. There is no production-data migration because the project has not entered Pilot.
- Model context is smaller and has a clear ownership boundary, while validators and Router continue to read full authoritative state.
- Read failures retain Provider attribution, now including a bounded timeout path.
- Booking-to-outcome audit joins are explicit, without granting the Agent outcome authority.

## Alternatives considered

- Keep rewriting `0006`: rejected because a migration ID must always mean one immutable schema transition.
- Automatically delete `restaurant-state@7` rows at application startup: rejected because durable data removal must be explicit and locally gated.
- Give the Agent a generic full-state sanitizer: rejected because only Restaurant has a current real use case; a Domain-owned projection is smaller and auditable.
- Let `hasEnough` stop the Agent: rejected because retrieval strategy remains an Agent responsibility and Candidate sufficiency is not Availability.

## Related documents

- [ADR-0011](0011-restaurant-agent-loop-control-refinement.md)
- [Agent Orchestration](../architecture/AGENT-ORCHESTRATION.md)
- [Search Service](../architecture/SEARCH-SERVICE.md)
- [Policy, Execution and Verification](../architecture/POLICY-EXECUTION-VERIFICATION.md)
- [Repository Conventions](../REPOSITORY-CONVENTIONS.md)
