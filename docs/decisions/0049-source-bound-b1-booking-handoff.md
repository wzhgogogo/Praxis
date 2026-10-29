# ADR-0049: Source-bound B1 booking handoff

## Status

**Accepted** — Document revision 0.2, 2026-10-29 (Vienna CET, UTC+1).

User approved on 2026-10-29. Renumbered from the reviewed C draft0048 because B owns0047/0048. The user also explicitly replaced the multilingual cancellation decision below on 2026-10-29. This grants no real reservation submission or shared Agent/State/TaskDefinition version changes.

## Context

The user starts booking through B1, based on reservation proposal 0.6 sections 1, 2, 4.3, 6, 7, 9 and 12. The instruction in this chat supplies the complete applicable requirements; no unavailable Claude project document is required. Praxis already distinguishes current, identity-bound availability from facts and recommendations. B1 hands that source channel to the user. It does not submit a booking or establish a verified outcome.

Latest main b2a3cbd3 does not yet contain B's G3 `tabelog-vacancy-response.ts`. Existing Tabelog observations retain slot times but lose the response's form_course URLs. That dependency must be integrated from B's reviewed result, without changing or duplicating its protected parser, query controls or browser adapter.

## Decision (Accepted)

### 1. One current outlet, slot and source

A handoff references a current authoritative outlet/candidate, offer, date, Asia/Tokyo slot, party size, source entity ID, availability evidence ID and checked time/expiry. It uses only the channel that established availability; no automatic cross-channel comparison or alternate booking is part of B1. A recommendation without current availability cannot produce a booking handoff.

Provide **Book on Tabelog** or **Book on TableCheck** as soon as the qualified slot/link evidence is available; comparison completion is not a precondition. A user may explicitly choose a card's handoff. This is a departure to the source, not Praxis authorization to submit, reserve, pay or select a different restaurant.

### 2. Link provenance and two server checks

Tabelog English uses the exact source-returned `https://tabelog.com/en/booking/form_course/new?...` link admitted by B's vacancy-response binding. Do not reconstruct it from an ID or slot. It must retain merchant `rcd`, `visit_date`, `visit_time` and `member` matching the current offer and request. The original admitted response/evidence ID is retained for audit.

TableCheck uses a source-observed same-shop reservation entrance and verified parameters `start_date`, `start_time`, `num_people`. The deterministic source serializer replaces the obsolete `pax` query key; an exact observed slot supplies start_time. A broad request window alone must not invent a selected time. Existing embedded public availability-query parameters remain separate from reservation handoff parameters.

Links are code-owned records from the source cache/adapter, never model-supplied or client-supplied URL strings. No model constructs a URL or parameters. Both creation and just-before-display server validation check current candidate, source entity/channel, offer/evidence identity, date, guests, exact slot within the authoritative window, freshness, HTTPS origin and allowed pathname/query grammar. Missing/mismatched evidence hides the handoff. Changed conditions invalidate old prepared objects. Duplicate, ambiguous or unsupported query parameters, userinfo, ports, fragments, redirect/confirmation/payment tokens and wrong hosts/paths fail closed. This restriction does not authorize fetching a link to validate it.

### 3. No workflow-page access

Praxis never opens a reservation workflow page to verify a B1 link and never hands out a confirmation or hold-page URL. Tabelog `/yoyaku/tabelog_booking/` is forbidden and is neither fetched nor emitted. Only the whitelisted form_course entrance may be handed to the user. TableCheck accepts a same-shop reserve entrance, not confirmation, checkout, account, payment or session-specific paths. Existing network Guard rights are unchanged. The user may navigate in their own browser by explicitly activating a link; Praxis does not inspect or control that external session.

No login, form fill, submission, card operation or personal-data storage occurs. A correct URL is not a guarantee of remaining inventory or source UI state.

### 4. Three distinct assertions and deterministic copy

- **Praxis knows:** the current source observation supports this outlet, date, guests and available slot. Show its checked time/source as evidence, without asserting a selected plan.
- **The link carries:** its checked parameters encode particular fields. The departure button may say **Continue on Tabelog — date, time, 2 guests filled in**, or the analogous TableCheck wording, only for fields that passed the URL check.
- **The source actually selected:** unknown to Praxis after departure. Neither UI nor logs may describe a field, course or booking as selected/booked from query parameters alone.

The card has at most one instruction line, generated from grounded evidence. A source-quoted course label may become **Pick Omakase Nigiri ¥9,800**; this means the user must pick it. TableCheck always includes **Check date and guests**, because an existing site session can retain older conditions. If both apply, combine them in the same hint line. No unsupported course name or extra plan selection is inferred.

### 5. Cancellation, card and platform fee

On the recommendation card, show a short English cancellation sentence and the original verbatim G1 quotations, their URLs/read times and same-outlet identity binding. Card copy is exactly **Card required**, **No card needed** or **May require a card**, supported by the same-channel quoted page evidence. Do not copy another restaurant's or channel's terms. Missing evidence means the item is omitted, including fee rules.

User decision, 2026-10-29: when Japanese and English cancellation terms differ, neither code nor a model decides which is stricter. Show both original texts, each with a one-sentence English paraphrase and its own verbatim citation. Label the card **Cancellation terms differ between the Japanese and English pages** and include **Confirm cancellation terms on the website** in the single instruction line. Without a conflict, retain the original single English sentence and citations. Missing or unverified text is not fabricated or silently substituted. The conflict input is a pair of G1-admitted source answers, not a ranking or a new permission to read more pages.

Platform-wide fees may be fixed configuration only with platform/channel scope, original quotation, source URL and effective/checked date. The instruction's example is Tabelog English ¥440 per person, nonrefundable on user cancellation; it is not published as a current fact without that evidence. The user authorized at most two public GETs in this follow-up, including a fresh robots.txt check and one public English help document. No retry on rate limiting, no workflow pages/login. Only facts explicitly present in that original text enter the fixed configuration; unspecified refund behavior remains absent.

### 6. Return feedback, never verified booking state

On return after an explicit handoff departure, ask at most once **Did you get the booking?** Offer Yes / No / Skip, with no follow-up questions. Record only the enum, user/report time and outlet/handoff reference, with `USER_REPORTED` provenance; do not collect confirmation numbers, names, contact details, cards or free-text personal data. Yes must not transition to BOOKED_VERIFIED or become a provider-confirmed outcome. Non-response/Skip is not failure and is not re-prompted.

The durable once-only feedback receipt is scoped to that Case's B1 departure, owner authenticated, idempotent under reload/concurrent deliveries, and separate from authoritative booking state. Store departures and the once-only prompt/response receipt separately from Task State and reservation Outcome. Use authenticated Case ownership, database transactions and per-Case uniqueness; repeated deliveries and restarts cannot ask again or change an already recorded answer. Claim the prompt durably before rendering it. A lost response can suppress a prompt (at most once), never cause an automatic re-ask. Do not rely on frontend memory for the guarantee.

### 7. Version and activation boundary

Transient handoff contracts and Web projections do not mutate Task State. No existing Agent/Semantic/G1 Prompt or Schema, State or TaskDefinition version changes. The independent transient handoff contract advances to restaurant-booking-handoff@2 for the conflict pair. If production evidence persistence or a model extraction proposal needs one of these version changes, report the affected object/version before editing and coordinate with B. G3-owned files remain untouched. Passing fixtures does not establish live source compatibility, current inventory, semantic translation accuracy or a completed booking.

## Consequences

- A useful departure can be delivered without login, payment, PII or booking-side effects.
- Users see exactly what the source proved and what the link carries; no actual-site selection or booking guarantee is implied.
- Missing G3 link output, unsupported link grammar, unresolved terms or stale evidence stay visible as implementation/verification gaps in the report, without inventing evidence or navigating forbidden pages.
- Offline checks cover creation, second projection validation and minimal English Web behavior; Durable self-report feedback and conflict presentation are implemented offline; B1 real-source activation waits for reviewed G3 dependency integration.

## Alternatives considered

- Let a model produce the URL: rejected; the origin, merchant and query must come from source data/verified code.
- Open the booking page to check prefill: rejected; B1 forbids this and Tabelog's forbidden hold workflow cannot be accessed.
- Reconstruct a missing Tabelog link from time and shop ID: rejected; it discards source provenance.
- Treat a returned user as booked: rejected; a self-report has no independent provider proof.
- Add a shared Task version before approval: rejected; no current offline need, and B owns ongoing G3.

## Related documents

- [ADR-0018 freshness](0018-availability-display-freshness-and-recheck.md)
- [ADR-0036 network boundary](0036-generic-public-read-network-policy.md)
- [ADR-0046 source-quoted answers](0046-observed-actions-and-source-quoted-answers.md)
- [Restaurant Domain](../domains/RESTAURANT-BOOKING.md)
- [B1 follow-up plan](../../.eval-artifacts/phase3b/g5-b1-followup/plan.md)
