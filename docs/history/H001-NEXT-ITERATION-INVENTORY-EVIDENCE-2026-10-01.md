# H001 next-iteration inventory evidence boundary — 2026-10-01

- Status: current baseline evidence review
- Scope: H001 effective native discovery, current-batch delivery, and TableCheck inventory result compatibility
- Mode: saved artifact inspection and offline code/test work only
- Not evidence of: a current source read, current inventory, a qualified H001 result, or any booking write

## Result

The saved Dining&Bar LAVAROCK TableCheck materials establish a same-entity reservation entrance and successful readback of selected request controls. They do **not** contain a completed, request-bound availability result that can support an `AVAILABLE`, `UNAVAILABLE`, or Offer record.

The relevant saved observations are:

- `lavarock-c1b-2026-09-24T08-14-11-195Z.json`: selected date and adult state;
- `lavarock-c1c-2026-09-24T08-16-20-129Z.json`: request confirmation path;
- `lavarock-c1d-2026-09-24T08-17-29-240Z.json`: an enabled 17:30 selection and post-action readback;
- `2026-09-30T11-03-35-804Z-12f7f0e7-2fc5-4956-a906-2f2ac86145ff.result.json`: later public control diagnostic.

The saved records consistently stop before an enabled, source-owned query completion or an explicit result region. They contain no request-bound slot list, explicit empty-result signal, or paired response body that could be converted to inventory evidence. A visible or selected time is control state only; it is not an Offer.

## Decision for this iteration

`C2` remains **PENDING_SOURCE_EVIDENCE**. The existing fail-closed path continues to report `UNKNOWN` when request controls can be read but no current result is observed.

## 2026-10-01 bounded source-query follow-up

One new, no-model local Chromium diagnostic used the same public LAVAROCK reservation page for the diagnostic-only request `2026-10-03`, two adults, 19:00. It performed one navigation and selected only the already observed native adult and time controls. It did not open a link, fill a field, click `Next Step`, submit a form, or issue a POST. The resulting artifact is gitignored at `.eval-artifacts/tablecheck-availability-query-probe/2026-10-01T10-12-35-545Z-8323cbcb-2011-4f55-afc6-628d5516833d.result.json`.

The page read back the exact selected date, adult count and 19:00 epoch, but did not issue a same-shop `/available` GET and left the submission control disabled. Therefore this probe did **not** produce a source result and cannot establish either an available or unavailable inventory conclusion. It also supersedes neither the saved LAVAROCK materials nor any H001 result.

The TableCheck adapter now passively records the page-owned same-shop `/available` GET endpoint when it is actually requested by the browser. It accepts only an HTTP-success JSON `{ status: "failure", data: null }` whose URL itself binds the selected Tokyo date, exact adult count and one exact requested time. A different shop, date, party, success payload, missing response, or broader time window remains `UNKNOWN`. This is tested with a source-shaped adapter fixture; it is a compatibility path, not new Live inventory evidence.

The next justified work, if separately authorized, is a bounded read-only diagnostic of the source's actual query-completion mechanism or a new current request that exposes it. It must preserve the exact date, party, selected time and source response/result region, must not submit a reservation, and must not treat a missing captured response as no inventory.
