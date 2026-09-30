# H001 Teppen query-state diagnosis from saved source evidence

- Status: exposed development evidence / earlier offline diagnosis; the subsequent diagnostic recording repair is [separately recorded](H001-TEPPEN-QUERY-CAPTURE-2026-09-30.md). No new Live read, model call, booking write or Case acceptance in this diagnosis.
- Scope: the H001 Tabelog query-control hypothesis raised after the Sep 30 read. The native outlet continuity result remains HIGH; the original H001 Gold and stock-grounding rules are unchanged.

## Evidence and conclusion

The Sep 30 H001 browser-slice artifact `a28db7af-18a2-4bc9-935e-29d96c99149f` preserves sanitized opening-tag state, complete observed controls and response metadata, **not the full HTML**. Its settled page has `No available seats for 2 guests.`, a selected but disabled `Guests 2` button, a hidden guest value of `2`, no `is-current` date marker among the preserved calendar tags, and no captured vacancy response. That evidence cannot bind the sentence to Sep 30 at 19:00.

The separately saved complete Teppen DOM from Sep 29 (`.eval-artifacts/tabelog-lead-teppen-20260929/03-teppen-later.html`) supplies the missing structural check for **that earlier observation**: it has no `.is-current` element. Its visible September day 29 is a telephone-status day cell and day 30 a closed-status day cell; neither has `js-calendar-day-target` or `data-year/month/day`. Selectable date targets in the same DOM belong to later months. Its active guest button is disabled, while the hidden guest value is `2`. This earlier DOM cannot reconstruct the exact Sep 30 page, but it disproves the proposed mechanism for that saved sample: there was no selected nonselectable date for the current hint's `.is-selectable` filter to hide.

The current `tabelogQueryControlHints` does filter to selectable date targets. A selected but nonselectable **dated** target would be omitted by that hint, while `hasTabelogSelectedQuery` independently checks `.is-current` in the snapshot HTML. That is a possible contract gap in a different page state, not an observed cause for Teppen here. Adding an action target or inferring selection from the displayed month/day would fabricate a requested-date binding. The present `UNKNOWN / TABELOG_VISIBLE_QUERY_CONTROLS_RESTRICTED`, with zero Offer, is the supported stop for this sample. The page sentence and disabled guest control do not warrant `UNAVAILABLE`.

## Existing behavior coverage and next evidence

The existing saved-DOM Chromium regression checks that hidden future dates and disabled guests do not become actionable and that the Adapter stops `UNKNOWN / TABELOG_VISIBLE_QUERY_CONTROLS_RESTRICTED` without model action or timeout. A separate normal Tabelog date/party Chromium regression confirms the legitimate query path. No new production change or duplicate test was justified by the current evidence.

To determine whether a **new** Teppen observation has a selected but nonselectable dated node, a future authorized read would need the complete same-snapshot calendar DOM, visibility and class state for the current month/date, guest selected/disabled/hidden-value state, and the source vacancy response metadata/body for that same request. Any request-bound `UNAVAILABLE` would still need the existing same-outlet, date, party and time evidence; generic no-seat prose alone cannot satisfy it. No further source access was performed in this diagnosis.
