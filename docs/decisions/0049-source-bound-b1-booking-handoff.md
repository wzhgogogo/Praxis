# ADR-0049: Source-bound B1 booking handoff

## Status

**Accepted** — Document revision 0.8, 2026-11-03 (Vienna CET, UTC+1).

Presentation-only clauses in sections 4 and 5 are **partially superseded by [ADR-0050](0050-two-line-handoff-presentation.md)**, approved by the user on 2026-10-29: departure hints may use two lines, and the cancellation-conflict confirmation sits beside the card's cancellation terms. The original Decision text below is retained; link provenance, evidence checks, write boundaries and return feedback remain in force.

User approved on 2026-10-29. Renumbered from the reviewed C draft0048 because B owns0047/0048. The user also explicitly replaced the multilingual cancellation decision below on 2026-10-29. This grants no real reservation submission or shared Agent/State/TaskDefinition version changes.

## Context

The user starts booking through B1, based on reservation proposal 0.6 sections 1, 2, 4.3, 6, 7, 9 and 12. The instruction in this chat supplies the complete applicable requirements; no unavailable Claude project document is required. Praxis already distinguishes current, identity-bound availability from facts and recommendations. B1 hands that source channel to the user. It does not submit a booking or establish a verified outcome.

Synchronized main50a08361 (reviewed C base b2a3cbd3) does not yet contain B's G3 `tabelog-vacancy-response.ts`. Existing Tabelog observations retain slot times but lose the response's form_course URLs. That dependency must be integrated from B's reviewed result, without changing or duplicating its protected parser, query controls or browser adapter.

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

User decision, 2026-11-01 (Vienna CET, UTC+1): after the user selects an outlet with a current valid B1 handoff, Praxis proactively obtains that selected outlet's cancellation policy and credit-card requirement through the existing G1 identity-bound page acquisition, model sentence selection and verbatim citation checks. Do not read terms for all candidates. Reuse an already admitted current same-page, same-outlet, same-channel answer without another answer call; unrelated or ambiguous questions are not treated as a policy answer. Automatic reads spend the selecting run's existing model/browser budget and deadline, not the independent explicit-question allowance (normally two answer calls; an observed bilingual conflict can require separate per-page paraphrases within that same ceiling). Only an actually observed public same-outlet language link may be followed through the existing fact reader/Guard; no guessed translation or workflow URL. Keep both conflicting originals, individual English paraphrases and the existing conflict notice; never rank strictness. Card labels remain exactly the three supported labels above and require cited evidence of booking card requirements, not merely card payment acceptance. Missing, expired, wrong-identity/channel/run, budget-exhausted or cancelled optional terms are omitted while the qualified B1 link continues through the unchanged two server checks. This appends the selected-outlet acquisition decision; it does not change the earlier bilingual-conflict, fixed-fee, write or feedback decisions. Raw pages and their original G1 HIGH witnesses stay in the bounded transient cache, outside Task State and Outcome.

Implementation clarification, 2026-11-03 (Vienna CET, UTC+1): a short navigation sample marked PENDING is not an admissible G1 question document. Selected-outlet page capture reuses the existing browser executor's bounded text-stability observation, without a browser-model readiness decision or a network retry; persistent loading remains unknown. The G1 complete-page, HIGH identity, same-channel/run and verbatim checks remain mandatory. Every optional-terms early exit or unverified answer emits a task/run-bound diagnostic (including incomplete page, missing/filtered pages, budget, reserve and cancellation), exported outside Task State. Diagnostics use the existing bounded transient read-cache lifetime; they are not durable booking history. The selected run's existing model budget, deadline and 20-second conclusion reserve still cover every new observation, language navigation and answer call. This changes neither cancellation interpretation nor handoff validity.

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

## User choice from explicit booking wording — user decision, 2026-11-02 CET

When the accepted semantic interpretation of the current user message has a SPECIFIC_OUTLET target and BOOKING_WORDING basis, code records the uniquely resolved outlet as the user's choice through the existing CANDIDATE_SELECTED event. Do not depend on another Agent SELECT_CANDIDATE action, change the Agent Prompt or detect booking keywords in code. Use the existing viewing-context interpretation or full-name lookup against authoritative candidates; multiple, partial or missing matches do not select. A uniquely displayed outlet can retain its candidate ID across the normal semantic reset; a newly named outlet also needs the existing HIGH entity evidence. This is reference resolution, never a relaxation of source identity checks.

The compiled user-message event retains only a code-admitted pending-choice marker and, when uniquely bound, the displayed candidate ID. Original goalBasis, reason and quotations remain outside durable Draft/State and ordinary logs. A party-only supplement may carry that original authoritative event's choice request; a new target without a newly admitted booking choice, semantic failure or conflict clears it. The loop rechecks the current target and candidates before dispatching selection, with USER trace/causation to the accepted message event and a USER_MESSAGE trajectory that contains no fabricated Agent action. Candidate resets and all current identity/availability checks remain in force. No State or TaskDefinition change is required.

An Agent SELECT_CANDIDATE remains available. Repeating the same candidate/offer is a successful no-op, with no second selection event. Open-ended recommendations, an explicit G1 question, an Agent's internal choice and a Book-on departure never become code-recorded user choices. Selection authorizes no booking, emits no BOOKING_PROPOSED and skips no availability read. Missing guests are asked first; after fresh current availability produces a valid same-channel B1 handoff, the unchanged selected-outlet terms reader runs in the same turn under its original budget, cancellation and 20-second reserve. This appends the approved user-choice decision only.

## User decision appended 2026-11-02: outward eligibility

A prepared source handoff is projected only for a candidate in `presentedCandidateIds` while the Case is in `PRESENT_RESULTS`; in every other phase it must belong to `readyCandidateIds`. A missing presented set is empty. `selectedCandidateId` never bypasses this boundary. This matches the workspace's visible/ready candidate set and prevents a valid availability link for a HARD-unverified, unpresented outlet from being exposed as a booking handoff.

The prepared cache may remain for later eligible presentation. Departure validation uses the same outward projection and rejects a hidden outlet through the existing “No current verified source handoff” path; selected-outlet terms acquisition uses the same eligibility boundary before any reading. Both existing server link validations, source-link binding, terms evidence, fee configuration, and booking authority remain unchanged. No State, TaskDefinition or Prompt version changes. This appends the user's approved projection restriction only.

## User decision appended 2026-11-03: named outlet across corrections

A SPECIFIC_OUTLET request remains limited to the named physical outlet whether or not AREA is present. Area helps locate/check it and cannot authorize substitution with nearby venues. An explicit choice of a displayed outlet binds its existing Google Place ID and known source outlet IDs; party/date corrections do not turn that choice into a generic area search. Reconstruct this reference from the already persisted discovery, admitted identity and USER selection events. The reference is a transient read-port input and is not a new State/Event/SearchRequest field. Actor/causation remains USER and no booking authorization is created.

Re-read a known Google Place ID within the existing run budget; use the native source reference as a lookup seed when no Google ID exists. Cached discovery is labelled as a USER_SELECTION_REFERENCE with its original observation time and contains no reused identity, fact or slot success. Fresh source identity/availability, both B1 link checks and the terms budget/reserve still apply. The current source IDs must agree with the selected identity. Unresolved branches require clarification; failure identifies the requested outlet and visit. Other stores can be delivered only after an accepted new OPEN_ENDED request from the user.

The same name/identity gate applies to presented IDs, outward handoffs and the terms entry/context, including a prepared cache. Existing link provenance, cancellation/card rules, quote checks, reuse, model limits and twenty-second conclusion reserve are unchanged. State25 / TaskDefinition23 and all Prompt/Schema versions remain unchanged. The historical D6 presentation is S0=1 per user adjudication (five incorrect cards in that one presentation), preserved separately from offline repair controls.

Implementation clarification, 2026-11-08 (CET): B1 may tap a currently visible, enabled same-shop entrance even while unrelated page data is still loading. A tap alone is never admissible: the completed read must still produce the current HIGH identity and exact AVAILABLE slot, request/freshness/evidence binding, and both unchanged server URL checks. Each new snapshot invalidates the preceding control tap. This changes neither page settlement nor Guard permissions. A PENDING document remains inadmissible for G1 terms/questions; an entrance is not a complete document or a terms answer. The exposed D8 positive-slot recording demonstrates the distinction.
