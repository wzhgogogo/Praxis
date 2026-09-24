# ADR-0031: Default result delivery window

- Status: Accepted
- Last updated: 2026-09-24
- Source of truth for: Bounded presentation of a supported partial first batch near a read deadline
- Supersedes in part: [ADR-0028](0028-open-ended-result-targets-for-availability.md) continue-until-no-read rule for the default first batch
- Related documents: [Restaurant Booking Domain](../domains/RESTAURANT-BOOKING.md), [H001 E1 experiment](../history/H001-DELIVERY-WINDOW-2026-09-24.md)

## Context

The H001 exposed read had two independently eligible restaurants about 45 seconds before its 300-second deadline. The default target of three required continued investigation while legal reads remained. The run ended without presenting either result. The target is a desired batch size; it must not erase already supported results when the remaining automatic budget cannot safely fund another source read and delivery.

## Decision

For the **first** open-ended Restaurant batch with the product default target of three, the read coordinator opens a durable delivery window when at most 45 seconds remain in a run of at least 90 seconds and one or two unshown candidates are currently presentation-eligible. The window is recorded in Task State before the Agent's next decision. While current eligible candidates remain, new discovery, fact investigation and availability checks are rejected; the Agent may present only those independently eligible candidates. A short batch is recorded with `resultBatchTarget.met:false` and stays a continuable selection session.

The exception never applies to a user-requested result count, a subsequent user-requested batch, an explicit refresh, an expired or unsupported result, a cancelled run or a booking action. It does not change the 300-second or 50-call ceilings, per-candidate eligibility, identity, request-bound slot evidence, authorization or external-write rules. If all eligible candidates expire before presentation, the ordinary read path resumes; the window does not turn stale evidence into a result.

The Agent still proposes `PRESENT_RESULTS`. The coordinator only records the budget condition and the Domain Validator determines which proposed actions are legal. A model proposal cannot open the window or mark evidence eligible.

## Consequences

- The first default batch may contain fewer than three supported restaurants before all reads are exhausted; the unmet target remains explicit.
- Run-start/deadline information is captured in a durable Task event so validation and the reducer use the same condition after restart or revalidation.
- The 45-second reserve is the predeclared H001 E1 controlled-experiment threshold. It requires a normal three-result control and an actual `PRESENT_RESULTS` transition before claiming effectiveness.

## Alternatives considered

- Extract results from the final artifact after cancellation: rejected because no user-facing result transition occurred.
- Raise the default deadline or model-call limit: rejected because it changes the accepted resource contract.
- Permit any short batch whenever the model asks: rejected because it can prematurely stop an otherwise feasible default investigation.
