# LAVAROCK request-control C1 bounded diagnostic

- Status: current diagnostic / exposed development data
- Document revision: 0.2
- Baseline: `93914d8`
- Scope: one TableCheck LAVAROCK request-control observation; no general Browser or Parser change yet

## Precommitted question and budget

The saved H003 browser trace has a `CLICK_AUTHORITATIVE` action on an observed `10 guests` option, followed by another click to open the party combobox. The action finished and the page changed, but the sanitized trace does not preserve the complete post-action control state or page HTML. A later page change is not proof that ten guests remained selected.

Hypothesis to test: TableCheck's current public reservation page can expose the selected request in source-owned page state, and the existing parser may be unable to recognize it after the option click. First inspect one source-observed LAVAROCK reservation entrance with the original `2026-09-25` / 10-person request; record only nonsecret widget markers, visible controls and the current parser verdict. Limit one temporary Chromium session to 25 seconds, zero model calls, no retry, no submit. This is a current-site diagnostic, not a replay of the historical action. A target selector is clicked only if the selected option and its before/after state can be identified safely within this bound.

Independent expectation: a selected request requires the actual selected date and party size from one source-owned widget or corresponding request-bound links; visible text and an action log alone are insufficient. If the page and controls do not expose both values, classify the C1 root cause as uncovered and preserve the UNKNOWN result. If a clear selected state exists but the parser rejects it, fix only that extraction rule in a later local red/green step. If the operation does not select the value, locate the action target or event mechanism before any parser change. Keep a normal asynchronous-change control and an open-only negative control for any later fix.

Evaluator: reuse the existing TableCheck selected-request and inventory diagnostics with independent manual comparison of observed values. Full H003 Evaluator is not applicable to this single-control observation. Success here means request confirmation, not inventory or final user delivery.

## Current-site result and stage verdict

The one bounded [read-only artifact](../../.eval-artifacts/restaurant-control-targeted/lavarock-2026-09-24T07-59-40-509Z.json) reached the same LAVAROCK reservation entrance with `start_date=2026-09-25&pax=10`. The visible adult `SELECT` reported value `10` and selected option `10`; the existing `hasTableCheckSelectedRequest` returned `false`. The saved observation has no source-owned selected date marker and no complete post-action HTML. The recorded query URL and selected adult control do not independently prove that both date and party were applied to the resulting inventory. No click or submit occurred in this diagnostic.

**C1 verdict: uncovered for the historical operation and full request.** The present page suggests a request-confirmation gap, but does not establish whether the original click failed, the date was unselected, or the parser missed a valid combined state. Do not relax the gate from an adult value alone. Next bounded step is to observe a source-owned date state and linked result before/after a controlled party selection on this page, then apply one extraction or action fix with a normal asynchronous control and open-only negative control. No production code, budget or evaluator changed.
