# ADR-0033: Delivery after a bounded native source batch

- Status: Accepted
- Document revision: 1.0
- Last updated: 2026-09-29
- Source of truth for: Default open-ended Restaurant result delivery on the source-native read path
- Supersedes in part: [ADR-0028](0028-open-ended-result-targets-for-availability.md) continue-until-no-read rule and [ADR-0031](0031-default-result-delivery-window.md) deadline-only short-batch condition, only for the native path
- Related documents: [ADR-0032](0032-source-native-restaurant-discovery.md), [Restaurant Booking Domain](../domains/RESTAURANT-BOOKING.md), [H001 downstream Playbook](../H001-NATIVE-DOWNSTREAM-PLAYBOOK.md)

## Context

The default target of three distinct qualified restaurants guides investigation. H001 native discovery uses a bounded Tabelog batch followed, when needed, by a bounded TableCheck batch. Requiring three results even after a complete native batch contains one or two qualified restaurants would force another source read before showing a supported result. The H001 downstream acceptance explicitly requires a grounded short batch to be presented, with the target shortfall recorded.

## Decision

For an initial, open-ended native Restaurant read with the product default result target, the Agent may present all currently eligible, unshown results after every candidate in the current bounded source batch has received its applicable fact and availability investigation. A qualified result in the completed Tabelog batch makes that batch ready to deliver without a TableCheck search. If the Tabelog batch has no qualified result, the Router continues to the bounded TableCheck batch. After that batch has been investigated, any qualified results may be delivered. The default target remains three and a shorter delivery records `met:false` in the durable result batch and remains continuable.

An explicit user-requested count retains the ordinary target rule. Every presented candidate still requires its own current source identity, HARD facts and request-bound availability evidence. A partial candidate investigation, an unresolved or stale result, or a source failure cannot be treated as a qualified result. The Agent proposes `PRESENT_RESULTS`; Domain validation decides whether it is legal. No model output changes Task State or executes a booking.

The bounded source search may visit several observed results under its existing per-source and global ceilings. The durable continuation cursor's `exhausted` describes the two-source chain; `TABELOG_DONE` describes completion of the current bounded Tabelog batch and does not assert that the Tabelog website has no more pages.

## Consequences

- Native reads can deliver one or two fully supported restaurants before the deadline reserve of ADR-0031, without calling the second source merely to chase the default target.
- Each source batch must expose its parsed, admitted, rejected and page counts and its actual progression reason. A bounded batch ending does not prove site-wide exhaustion or no inventory.
- The Google candidate path and explicit result counts retain their existing rules. Live source coverage, latency, controls and inventory require separate read-only evidence.

## Alternatives considered

- Preserve the three-result hard gate for native delivery: rejected because it would hide a supported result after the bounded source investigation.
- Treat one accepted candidate as source completion: rejected because later candidates in the same bounded batch may qualify.
- Add unbounded pagination or a cross-platform candidate merger: outside the current H001 slice and resource bounds.
