# Web photos unified slice

- Status: Draft
- Last updated: 2026-11-17
- Evidence: development / not a Clean Baseline

Baseline 727b8a812b805fb836612e077ba4f97a802506b9 retains backend, Guard, G1 and B1. Integrate only the visual delta from f134cb75057adaadc990cba2d6f9470fb94fbf1e and website photo delta from bf8046ae98fe64024c382c0a99ed274f872e2c93 (feature base 127d1aa14). No persisted photo field or search photo injection.

Promise: the current candidate has one authenticated photo renderer, Google IDs-only on-demand photos with complete attribution, existing bound-website fallback, isolated failures, responsive DM Sans interaction and complete address in About. Photos are temporary presentation material, never State facts or booking authority.

Acceptance: frozen clean source and harness commit; five offline gates without .env; deterministic 390×844 / 1440×900 / 960×900 screenshots and Google/website/failure scenarios. Stop before Live on any acceptance failure. Only after all pass: one controlled public Tokyo Case, one optional G1, local PostgreSQL praxis_smoke only, no refresh/retry or external booking GET. Search ceilings remain 50 model / 100 Google / 500s browser; separate photo ceilings 1 Details / 10 media / 2 source pages / 10 source images, redirects included. Preserve old trees, main files, .env and database cases.

Harness oracle: synthetic image bytes, explicit author strings, request ledger, HTTP auth isolation, actual Chromium layout and SQL departure record. Existing product evaluator unchanged; Live quality/S0 require independent evidence and will not be inferred from Fixture tests. externalSideEffectCount and uninstrumented backend total website requests remain NOT_MEASURED.
