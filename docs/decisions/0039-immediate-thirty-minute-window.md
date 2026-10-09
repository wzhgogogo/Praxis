# ADR-0039: Immediate thirty-minute window

- Status: Accepted
- Document revision: 1.0
- Last updated: 2026-10-09
- Evidence status: current executable C6a, independently reviewed and user approved 2026-10-09; exposed development replay, not Live acceptance
- Supplements: ADR-0024

## User decision and implementation

The user explicitly decided on October 9 that zero-offset “right now” means the original reference instant through thirty minutes later in Tokyo. Code owns materialization@6 and the expiry; the model cannot renew or shift the window. Matching future offers are ordered earliest first and their concrete times are displayed. Past slots, wrong date/party, missing HARD or identity, and stale display evidence remain ineligible. Agent prompt@20/context@9 describes this contract. Explicit clock times and positive nonzero offsets retain their semantics.

When the whole immediate window has passed, no new discovery/fact/availability read is legal. END_READ may record the expired request without claiming every restaurant has no inventory, or ASK_USER may offer to search the nearest bookable time under a newly approved window. Internal execution failure remains a failure. The user approved this ADR and Gold@7 as the default on 2026-10-09 after independent review. Gold@7 changes only H005 time semantics and acceptance (plus dataset metadata); Gold@6 remains byte-identical as frozen historical evidence.

## Retained limits and review evidence

The current single-date HH:mm request cannot represent a window crossing Tokyo midnight. Fail closed rather than silently shorten or move it. A subsequent explicit-time clarification is required; multi-date source reads are outside this slice. Historical h005 #40–#50 occurred inside the new thirty-minute window. Their old IMMEDIATE_REQUEST_EXPIRED outcomes came from the superseded one-minute contract, so the frozen END_READ/ASK_USER annotation is not an independent oracle for expiry under the new contract. Independent review superseded those 21 now-related Agent labels in seeds.v2.json as SUPERSEDED_BY_CONTRACT; original labels and artifacts remain unchanged. Detecting an obviously out-of-business-hours local request before reading each outlet remains unimplemented and is outside this integration slice.
