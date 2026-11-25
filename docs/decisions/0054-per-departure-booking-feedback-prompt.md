# ADR-0054 — Per-departure booking feedback

- Status: Accepted
- Document revision: 1.0
- Last updated: 2026-11-25
- Source of truth for: Durable prompt eligibility when the user returns from a booking handoff
- Related ADRs: [ADR-0049](0049-source-bound-b1-booking-handoff.md)
- Related documents: [User flows](../product/USER-FLOWS.md)

## Decision

An explicit Continue departure uses the existing validated handoff and writes a departure receipt. On return, Praxis can show “Did you get the booking?” once for that departure. The next explicit departure can earn another prompt in the same Case.

Only the latest departure in the conversation is eligible, ordered by departure timestamp and then ID. If the user leaves twice before returning, claim only the latest receipt. Refresh, reopening, concurrent claims and restart cannot reissue a claimed prompt or fall back to an older receipt. Claim the prompt durably before rendering it. Migration 0011 removes the per-Case unique prompt index. The store still locks the authenticated Case when claiming and sets the selected receipt's prompt timestamp only when it is unset.

This replaces the per-Case prompt limit in section 6 of ADR-0049. Yes, No and Skip are optional `USER_REPORTED` feedback. Each answer stays bound to its own authenticated departure receipt. The flow collects no personal data and has no effect on the reservation or its verification status.
