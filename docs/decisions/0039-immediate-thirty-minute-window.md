# ADR-0039: Immediate thirty-minute window

- Status: Accepted
- Document revision: 1.1
- Last updated: 2026-10-10
- Evidence status: current executable C6a, independently reviewed and user approved 2026-10-09; exposed development replay, not Live acceptance
- Supplements: ADR-0024

## User decision and implementation

The user explicitly decided on October 9 that zero-offset “right now” means the original reference instant through thirty minutes later in Tokyo. Code owns materialization@6 and the expiry; the model cannot renew or shift the window. Matching future offers are ordered earliest first and their concrete times are displayed. Past slots, wrong date/party, missing HARD or identity, and stale display evidence remain ineligible. Agent prompt@20/context@9 describes this contract. Explicit clock times and positive nonzero offsets retain their semantics.

When the whole immediate window has passed, no new discovery/fact/availability read is legal. END_READ may record the expired request without claiming every restaurant has no inventory, or ASK_USER may offer to search the nearest bookable time under a newly approved window. Internal execution failure remains a failure. The user approved this ADR and Gold@7 as the default on 2026-10-09 after independent review. Gold@7 changes only H005 time semantics and acceptance (plus dataset metadata); Gold@6 remains byte-identical as frozen historical evidence.

## Retained limits and review evidence

The current single-date HH:mm request cannot represent a window crossing Tokyo midnight. Fail closed rather than silently shorten or move it. A subsequent explicit-time clarification is required; multi-date source reads are outside this slice. Historical h005 #40–#50 occurred inside the new thirty-minute window. Their old IMMEDIATE_REQUEST_EXPIRED outcomes came from the superseded one-minute contract, so the frozen END_READ/ASK_USER annotation is not an independent oracle for expiry under the new contract. Independent review superseded those 21 now-related Agent labels in seeds.v2.json as SUPERSEDED_BY_CONTRACT; original labels and artifacts remain unchanged. At the original October 9 integration, detecting an out-of-business-hours local request from checked source pages was unimplemented. The October 10 supplement below closes that narrow offline gap; it does not add Live acceptance.


## C6a supplement — user requested 2026-10-10

For a zero-offset immediate request only, the Agent may END_READ early when every checked outlet has current HIGH-identity public-page business-hours evidence explicitly showing that the requested day is closed, or that no observed opening interval overlaps the original window. All checked public page identities must be covered by those observations. The completion states the checked-source scope, preserves unknown/unexamined outlets, and offers a nearest-bookable-time search under a new user-approved window. It does not invent that time, claim no inventory, move the original window, or relax any qualification rule. Agent prompt@22 / context@9 communicates this option through the existing read completion assessment.

Missing or malformed hours, a different weekday, partial overlap, an observed previous-day overnight interval, an open/conflicting source, API-only hours, or an explicit clock-time request cannot trigger this rule. No restaurant opening/closing hour is hardcoded. Native and official source pages reuse current structured/visible fact grounding; business-hours extraction adds no HARD or availability claim. Execution failure and cancellation retain their existing outcomes.

Offline verification: eleven production Hybrid composition modes (closed/outside positives and nine negative controls), two existing native-source controls, and four gates passed. Full tests: 796/796. Evidence: `.eval-artifacts/p1-c-batch-20261010/C6a/`; this is exposed development Fixture evidence, not a Live or current-store compatibility claim. Gold@7 remains the default; frozen Gold@6 and their files are unchanged.
