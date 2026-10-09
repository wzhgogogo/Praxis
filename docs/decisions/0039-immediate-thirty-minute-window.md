# ADR-0039: Immediate thirty-minute window

- Status: Proposed
- Document revision: 0.1
- Last updated: 2026-10-09
- Evidence status: current executable C6a, review pending; exposed development replay, not Live acceptance
- Supplements: ADR-0024

## User decision and implementation

The user explicitly decided on October 9 that zero-offset “right now” means the original reference instant through thirty minutes later in Tokyo. Code owns materialization@6 and the expiry; the model cannot renew or shift the window. Matching future offers are ordered earliest first and their concrete times are displayed. Past slots, wrong date/party, missing HARD or identity, and stale display evidence remain ineligible. Agent prompt@20/context@9 describes this contract. Explicit clock times and positive nonzero offsets retain their semantics.

When the whole immediate window has passed, no new discovery/fact/availability read is legal. END_READ may record the expired request without claiming every restaurant has no inventory, or ASK_USER may offer to search the nearest bookable time under a newly approved window. Internal execution failure remains a failure. Gold@7 is a separate draft; default Gold@6 is preserved pending independent review. Accepted ADR bodies are unchanged.

## Limits requiring review

The current single-date HH:mm request cannot represent a window crossing Tokyo midnight. Fail closed rather than silently shorten or move it. A subsequent explicit-time clarification is required; multi-date source reads are outside this slice. Historical h005 #40–#50 occurred inside the new thirty-minute window. Their old IMMEDIATE_REQUEST_EXPIRED outcomes came from the superseded one-minute contract, so the frozen END_READ/ASK_USER annotation is not an independent oracle for expiry under the new contract. The report retains this disagreement; labels are not edited.
