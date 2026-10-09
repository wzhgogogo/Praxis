# ADR-0038: Model-call default delivery window

- Status: Accepted
- Last updated: 2026-10-09
- Source of truth for: Default first-batch delivery when the shared model-call budget is nearly exhausted
- Supersedes in part: [ADR-0031](0031-default-result-delivery-window.md), delivery-window trigger only
- Related documents: [Restaurant Booking Domain](../domains/RESTAURANT-BOOKING.md), [Phase 1 C0](../AGENT-WEB-OPERATION-PHASE-1-PLAYBOOK.md#c0-按调用预算交付针对-delivery_policy2026-10-09-新增)

## Context

The exposed kf-h001 baseline already had a qualified candidate at model decision #38. Its 50-call ceiling was exhausted before the existing time reserve opened, so no result was presented. The user authorized P1-C C0: open the existing default delivery window when at most four model calls remain and a qualified candidate exists. This extends ADR-0031's time-only trigger without changing result qualification.

## Decision

The Restaurant read coordinator may also open `DEFAULT_BATCH_DELIVERY_WINDOW_OPENED` when the trusted caller reports an active shared whole-run budget with zero to four calls remaining and the existing `defaultBatchDeliveryCandidateIds` rule returns a candidate. Semantic, Agent, fact and browser calls, including failed calls, consume that same budget. An absent budget report retains the time trigger; completed scopes are not active budget reports.

The existing event, reducer, Validator and qualification rules remain authoritative. The event deadline is the earlier of the actual run deadline and 45 seconds after opening; the model-call trigger does not require a 90-second initial run. It does not extend the run or add calls. The coordinator checks before and after each Agent decision, so a newly opened window rejects an obsolete read proposal; a subsequent decision may propose `PRESENT_RESULTS` within the remaining budget.

The Agent still chooses the action. Only the first default open-ended batch qualifies; an explicit result count, a subsequent batch, a refresh, expired evidence or an unsupported candidate receives no exception. `resultBatchTarget.met:false` records a short batch. Identity, HARD constraints, request-bound slots, freshness, authorization and external-write boundaries do not change. No State, Event or Prompt schema changes are needed.

## Consequences

- Web Persistent, the Hybrid Runner and bounded fixed-source execution pass their actual remaining call count to the same coordinator.
- A call-budget reserve can make an already supported short batch deliverable before the time reserve; it cannot guarantee a model's choice or create a result when evidence is absent.
- Acceptance distinguishes production composition with fixture boundaries, recorded-event replay, and real-model recorded-context replay. C0 has no Live run before merge.

## Alternatives considered

- Raise the 50-call ceiling: rejected because the resource contract remains unchanged.
- Force presentation in deterministic code: rejected because the Agent must still propose the action and the Validator must accept it.
- Add a second delivery event or duplicate qualification path: rejected because the existing event and rules express the required behavior.
