# ADR-0014: Search-only results completion

- Status: Accepted; provider identity scope superseded by ADR-0015
- Document revision: 1.0
- Last updated: 2026-09-03
- Source of truth for: read-only Restaurant search completion
- Related documents: [ADR-0013](0013-agent-loop-final-hardening.md), [Restaurant Booking Domain](../domains/RESTAURANT-BOOKING.md), [Agent Orchestration](../architecture/AGENT-ORCHESTRATION.md)

## Context

ADR-0013 correctly prohibits an Agent `COMPLETE` action for booking flow: only the Verifier may establish a booking outcome. A search-only task has no external write or booking verification, but it still needs an explicit terminal outcome after grounded results have been produced. Leaving the bounded loop after an availability read is ambiguous and permits an unverified result to look complete.

## Decision

Add `PRESENT_RESULTS` to `restaurant-agent-action@3` as a read-only, non-booking action. The Runtime, not the Agent, writes `RESULTS_PRESENTED` and transitions `restaurant-state@10` to terminal `PRESENT_RESULTS`.

The Action Validator permits it only when every named candidate has current authoritative evidence for all task-critical facts: exact requested area, each positive HARD criterion, HIGH-confidence Google-to-Tabelog outlet identity, and a fresh matching availability offer for the authoritative date, time window and party size. Missing or ambiguous evidence rejects the action; it never becomes a successful result by fallback.

`PRESENT_RESULTS` does not create a selection, ActionProposal, Authorization, Command, booking attempt, payment, cancellation, or external write. `PRESENT_RESULTS` is a successful search outcome only and does not supersede booking verification rules.

## Consequences

- H001 can terminate normally only after the complete evidence chain is preserved in State and trajectory.
- State adds `presentedResults`; old local development Tasks are not migrated and must be reset under the existing explicit development reset policy.
- The Agent decision prompt is `restaurant-agent-decision-prompt@4`; it may propose presentation but cannot supply or alter evidence.

## Alternatives considered

- Infer completion from loop exhaustion: rejected because it cannot distinguish safe results from an incomplete or failed read.
- Reintroduce generic `COMPLETE`: rejected because it would blur search completion with verifier-owned booking outcomes.
- Have the Adapter mark completion: rejected because Adapter observations are untrusted until Router/Validator/Reducer processing.
