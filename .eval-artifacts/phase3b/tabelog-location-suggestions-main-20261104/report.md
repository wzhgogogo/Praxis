# Approved location suggestions after D8 — main integration

- Current offline integration verification / exposed development. No new website, real-model or Live score.
- Verified 2026-11-04T10:41:33.802013+01:00 (Vienna CET UTC+1).
- User-approved branch `codex/feat-phase3b-tabelog-location-suggestions` @ `a96f4d4e3d712077a158bbc5afaa7551ea565e3d`.
- Synchronized main `3527936c42bf59f4223a597e60aeed1c854a8530` already contains the accepted D8 fix and full G6 group. Merge `7c523eae` uses main first parent and reviewed location branch second parent.
- Tested gate HEAD `c708493d067163d7e01bef9e427668fb7e1ef558`;900 source/input SHA entries (`freeze.json`). Final archival commits change only reports/history and retain all tested source/input hashes.

## Fidelity and scope

The reviewed shortcut remains unchanged: only where existing observed name/district/outlet-supported menu routes are absent, follow an actually observed public home destination, fill the user place text, select exactly one semantic matching place/station and keep the existing source coordinate/radius gate. Ambiguous/foreign/merchant or unsupported choices fall back with budgets already spent. Fresh option ownership/selection and same-group GET submit are retained. No hardcoded place URL, private selector, new model action, retry, identity or budget relaxation is added during integration.

D8 remains main-exact: a sole HIGH-bound exact full name can resolve with UNKNOWN differently named peers; unknown exact names and duplicate verified names remain ambiguous. All original A G6 files/helpers and source data remain byte-identical. The mandatory browser gate includes ordinary Chromium plus66 G6 cases.

`merge-proof.json` preserves170 original source/artifact rows across both sides; source merged without conflicts. Append-only documentation histories are retained. Shared budget is unioned by id, rejecting differing same-id rows; all previous entries from main and review are immutable, one zero-call integration row yields883 rows, caps/cumulative unchanged. C did not read/load .env or make model, Google, website or Live calls.

## Fresh clean-tree verification

| Gate | Result | Seconds | status before/after |
|---|---|---:|---|
| typecheck | PASS | 0.516 | empty/empty |
| architecture | PASS | 0.289 | empty/empty |
| default | 1439/1439 | 54.184 | empty/empty |
| build | PASS | 0.556 | empty/empty |
| chromium | 189/189 ordinary Chromium +66/66 G6 | 180.121 | empty/empty |
| strict-g2 | 5/5;12 valid pages PASS | 23.927 | empty/empty |

All six commands passed on the first combined integration attempt. No fixture, oracle, assertion or timeout changed and no gate retry/skip occurred. The8 additional default tests versus the reviewed1431 are the previously accepted D8 controls.

Independent audit253 checks pass: all900 frozen files, both reviewed/main source and original artifacts, ancestry, original A bytes/mandatory G6 entrypoint,7 literal D8 expectations,6 literal location scenarios, intact fallback/foreign/merchant rejection, source operation/region caps, all receipts and exact ledger row sums. Both D8 and location results are captured from this same current default run.

| Local source scenario | Candidates | ms | Operations | Region admissions | Result |
|---|---:|---:|---:|---:|---|
| LINK | 5 | 4965 | 23 | 3 | in-radius source candidates |
| OPTION | 5 | 4133 | 27 | 3 | in-radius source candidates |
| NONE | 0 | 3562 | 27 | 4 | READ_BUDGET_EXCEEDED |
| AMBIGUOUS | 0 | 3217 | 24 | 4 | READ_BUDGET_EXCEEDED |
| OUTSIDE | 0 | 4339 | 23 | 3 | DISCOVERY_SOURCE_LOCATION_UNGROUNDED |
| MERCHANT_ONLY | 0 | 3621 | 27 | 4 | READ_BUDGET_EXCEEDED |

These are unchanged constructed source/Model-I/O scenarios through ordinary production assembly and real local Chromium/HAR/Guard. They establish integration and safety behavior, not actual site DOM/network compatibility, new stock, or new Live delivery. The original review reports, initial red proofs, earlier corrected region regression and historical G6 scores remain immutable.

## Publication and handoff

User approved main publication after D8 and fresh green checks. Recheck origin/main remains the tested ancestor, publish without force, ls-remote verify, then notify A with the exact new main SHA. Relay the user's request that A follow its own existing A-section inputs, budget and stop rules for D4/D8. C performs no such real rerun. The final SHA/notification result is reported in the delivery message.

### Publication blocked — remote unchanged

Four standard push attempts from archival HEAD `7b8c3a40d0b83a18fc86013595e9d155706a9585` failed: three GitHub Internal Server Error responses and one commit_refs_rules fatal error. Final successful read-only ls-remote still shows main `3527936c42bf59f4223a597e60aeed1c854a8530`; the integration branch is absent. This is a publication failure, not a failed test or proof of a global outage/policy denial. No force push, repository-rule change or API write bypass was used. A has not been notified to start D4/D8. Local reviewed-source merge and all green checks are retained; main publication and A handoff remain outstanding. See `publication-failure.json` for transcribed request IDs and ref confirmation. This follow-up changes only archival evidence/history, not any frozen input or source.
