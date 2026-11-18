# Praxis visual direction

- Status: Accepted
- Document revision: 0.16
- Last updated: 2026-11-17
- Source of truth for: current English Web presentation; product behavior and safety remain governed by accepted PRD and ADRs
- Related ADRs: [ADR-0049](../decisions/0049-source-bound-b1-booking-handoff.md), [ADR-0050](../decisions/0050-two-line-handoff-presentation.md)
- Related documents: [User flows](USER-FLOWS.md), [Workspace](../architecture/AGENT-GATEWAY-AND-WORKSPACE.md), [integration plan](../WEB-PHOTOS-UNIFIED-PLAN.md)
- Evidence status: work branch implementation; acceptance results are recorded in STATUS and TEST-LOG, not inferred from this specification.

## Typography and navigation

Use locally served DM Sans throughout, including logo and numbers. White surfaces, ink #15172B, secondary #5F6275 and brand #3D5AFE; use spacing for information hierarchy. New plan, Saved and About › are transparent, borderless actions. Main action is Let's book. Sidebar changes at 960px and can collapse; keyboard arrows browse candidates outside inputs and dialogs.

## Progress and editing

The orb has three beats (understanding, finding, presenting), with the logo cursor breathing in sync. Reduced-motion preference is respected. One composer routes plan changes to messages and current-restaurant questions to questions. Native date/time/number editors operate in place; saving a condition preserves the unsent composer draft. An expired card can refresh into Handoff, governed by the server's existing qualification and B1 checks.

## Times and photos

Time options are 8px corner tiles; the chosen tile uses 16% brand blue. Card photo boxes are 16:9 on desktop and a compact 2.2:1 treatment on mobile, with a frosted bookmark control. The single cover renderer uses authenticated Case/candidate photo endpoints; About offers up to eight distinct photos and a full-screen photo-viewer. An unobtrusive line icon is the no-photo placeholder. Photo failure must not change search results, G1 or B1.

## Image source and attribution

Google images always display the complete label Google Maps and every applicable returned author attribution alongside each image, including cover, About and full-screen viewer. Author links use returned author URIs; the Maps link reuses the candidate's existing Google Maps URI. Website images display their explicit credit, or Source: <domain>. Do not invent a copyright template or truncate attribution.

Short credits sit at the lower corner on a small translucent background. If actual rendered content would overflow the image, place the full credit directly below the image in compact type; allow wrapping when needed to retain all names. No character-count threshold, ellipsis or large white capsule.

## Addresses

The backend address and About text remain complete. Only the address item in key-facts clamps to two lines; distance and price stay separate and visible. Card display may remove a leading Japan, and a leading Japanese postal code. Text after ※ or 【 remains part of the address, with no length-based removal.

[Previous visual specification](../history/VISUAL-DIRECTION-BEFORE-DM-SANS-20261117.md) is archived as one historical document and does not define current typography, copy, placeholder or CSS.


## 2026-11-18 — Style 1 condition rows

User-approved / implementation in Round 6, draft / not integrated. Availability not checked / Availability expired uses 13px 500 #5F6275 without a dot. Available <Date> remains 15px 600 #15172B with 8px time controls. Empty slots/recommendation occupy no space. Conditions have 8px top margin, 6px row gap, 13px/1.45 text. Each row aligns baselines with space-between and 12px gap: capitalized name (#15172B, min-width:0), nonshrinking status (#5F6275,500). Status words are Confirmed / Not a match / Unverified, without dash or internal enum terms; About uses the same words. Added-only change summaries are static and hide zero counts.
