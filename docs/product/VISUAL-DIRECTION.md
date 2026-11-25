# Praxis visual direction

- Status: Accepted
- Document revision: 0.18
- Last updated: 2026-11-24
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

User-approved / implementation in Round 6, draft / not integrated. Round20 supersedes the availability row: left Availability is 13px #15172B; right date is 13px 600 #15172B, Not checked / Expired is 13px 500 #5F6275, without a dot. Time controls retain 8px gaps. Empty slots/recommendation occupy no space. Conditions have 10px top margin, 6px row gap, 13px/1.45 text. Each row aligns baselines with space-between and 12px gap: capitalized name (#15172B, min-width:0), nonshrinking status (Confirmed #364B8A; Not a match / Unverified #5F6275; weight500). Status words are Confirmed / Not a match / Unverified, without dash or internal enum terms; About uses the same words. Added-only change summaries are static and hide zero counts.

Round 7 places at least 12px between the bottom of the condition list and the booking button, including cards with an empty recommendation.


## 2026-11-21 — Round20 card and source presentation

User-approved / work-branch implementation, draft / not integrated. Availability and conditions use baseline-aligned space-between columns with 12px minimum gap, right-aligned with About. Let’s book has 16px top / 2px bottom margin; slots and conditions own 10px top margin, source categories 12px. Empty recommendation blocks reserve no height; text still clamps to two lines. A hidden progress counter keeps its layout width. Card addresses remove optional Japanese postal prefixes; About retains the complete source address. Batch-end Adjust and Find more are equal-width adjacent 48px-minimum buttons; Saved remains in the workspace header.

Source labels use Google Maps, Tabelog, TableCheck or the observed website hostname, with no raw provider enums. Short source categories compare normalized meaning (parenthetical glosses and generic modifiers removed); overlapping categories are not a conflict. Genuine disagreement uses light source/domain links. About retains original categories. Revision changes show added count first, followed by removed count and a disclosure arrow; added-only summaries are static “N new place(s)”. No-change hidden content is cleared.

Q&A, About and Handoff share citation grouping by exact (URL, readAt). Same-reading excerpts share a white bordered block with individual left rules and one site ↗ · Checked month/day footer (Asia/Tokyo; no weekday or clock). Different readings retain their exact internal ISO timestamps and separate groups; unknown time is not promoted to another reading. Handoff preserves each bilingual term’s label/original association and cancellation conflict notice. About layers source/time, full address divider, conditions, commercial terms, original categories and source footnotes, then quiet Refresh. Answer sheet retains its mobile drag handle, adds place/close header and the question above the answer, and reserves 28px plus safe-area inset at the bottom. Existing tokens, responsive widths, keyboard and touch controls remain.


## 2026-11-23 — Round23 nine UI refinements

Draft / not integrated. Home title is one centered physical line with nowrap and clamp(20px, 5.6vw, 28px), including 360px. Reconnecting uses a centered sticky compact pill: #F5F6F9 surface, #5F6275 text, 999px radius, 6px/14px padding, 13px/500/1.4 type and a subtle shadow; it waits five continuous disconnected seconds. About uses the current restaurant name in its composer hint; a focused Adjust hint persists until blur.

Source blockquotes use a 2px rgba(61,90,254,.38) left rule. Open Q&A Source disclosures have transparent backgrounds with no nested horizontal padding; at 390px the answer sheet and About source footers retain one physical line through JST. Commercial display prose is distinct from quoted originals and has an attached source/time row even when no original quotation is present. Categories avoid generic Google labels and synonymous duplication. Revision removal names use human-readable verified links and omit redundant generic reason sublines.

Mobile composer focus anchors the top bar and workspace to the visual viewport without resetting the internal About reading scroll. Image surfaces permit native vertical scrolling plus horizontal photo gestures; attribution links and the next normal tap remain usable. Landing WebGL and static gradients cover lower and side regions; focus=1 converged light geometry, edge fade and breathing remain unchanged. Real phone soft keyboards remain NOT_EVALUATED pending device verification.


### Round 24 source and photo presentation

Group quotations by exact source reading, de-duplicate equal text in that group and retain observed-price context. When an old quotation has ambiguous provenance, show its original and source link without a guessed Checked time. Keep unquoted structured terms as text with their source footer. Q&A-only smoking-field cleanup preserves parenthesized status qualifiers and answer prose. At1× photo surfaces use `pan-y pinch-zoom` with touch-only horizontal swipes; above1.02× they allow native horizontal/vertical panning and JS never changes the photo. Mouse dragging never flips or opens the viewer; arrows, keyboard and ordinary clicks remain available. Native phone validation remains separate from Chromium simulation.

## Round25 display and keyboard contract (current implementation)

On widths below960px composer and condition-editor text inputs use16px. The visualViewport and measured composer determine clearance; focus may reveal the clarification ending once, including the keyboard resize, without pulling back subsequent user scroll. About focus preserves reading position/draft. Reconnecting has equal vertical breathing space between topbar and title. Native mobile keyboard/zoom remain NOT_EVALUATED until device testing.

About condition quotes exactly equal to their normalized labels retain only a compact provenance footer. Longer originals retain white blocks. Citation links show Tabelog / TableCheck / Google Maps or a merchant domain without www, falling back to Open page. Display only Checked Nov21-style Tokyo dates; retain exact URL/ISO grouping and omit dates for ambiguous legacy evidence. Q&A joins header/value only with unique source-row proof from production extraction; crossed rows, repeated values and no-proof DTOs stay separate and answer prose is untouched. Round 27 used the following functional accents, superseded by Round 28 below: #3D5AFE remains on2px quote rules, main actions, active progress marks, saved bookmark fill/stroke, selected-slot pale backgrounds and Handoff Recommended. Confirmed is plain #364B8A text at500, with no badge/background; About is ink#15172B and source/merchant links are secondary#5F6275 with their underline and arrow. Base ink/gray/white/DM Sans remain.


## Round27 question, empty-state and mobile editing contract

Pending Q&A places Checking the page and its underlined transparent Stop on one baseline row with distinct clickable space. Source disclosures keep history summary absolute top fixed; a bottom sheet can grow upward while summary top relative to sheet top stays fixed. Open details add no top padding, and summary tap highlight is transparent.

Pure fact recommendations hide Refresh details; only slot-capable recommendations and availability results expose Refresh availability. About Categories summaries are omitted only when their entire normalized text already appears as an actually rendered CATEGORY blockquote. A same-text quote reduced to a source footer does not count; extra Google categories retain the summary.

Prior empty results disappear immediately on message/capsule save/remove, Find more or Try again requests, independently of the composer sending spinner; deferred running SSE snapshots use the same effective view as progress. Failures restore the original empty actions. Mobile focused progress is compact and its active Stop stays above measured composer clearance without locking user scroll. Below960px open condition editors take a full flow row with flexible16px inputs and fixed action buttons; desktop overlays keep their existing dimensions. Native device behavior remains NOT_EVALUATED until device testing.

## Round 28 final workspace treatment

Confirmed and Not checked use secondary gray #5F6275. About and handoff text use #15172B, with source links in #5F6275. Blue remains on the logo cursor, quote rule, progress mark, saved bookmark, primary action and the pale selected time surface and outline. Card times use a compact grid with 5px by 10px button padding and 8px corners. The booking feedback title shares a row with the upper-right close control. Yes and Not yet sit centered below.

Source disclosures keep their horizontal and vertical origin when opened, measured relative to the sheet for the bottom dialog. Quotation groups own the visible frame and padding. About starts with Source collapsed. Mobile capsule editors appear after the capsule buttons, with snap disabled while the editor is open.
