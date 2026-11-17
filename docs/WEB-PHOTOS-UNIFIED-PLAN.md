# Web photos unified slice

- Status: Draft
- Last updated: 2026-11-17
- Evidence: development / not a Clean Baseline

Baseline 727b8a812b805fb836612e077ba4f97a802506b9 retains backend, Guard, G1 and B1. Integrate only the visual delta from f134cb75057adaadc990cba2d6f9470fb94fbf1e and website photo delta from bf8046ae98fe64024c382c0a99ed274f872e2c93 (feature base 127d1aa14). No persisted photo field or search photo injection.

Promise: the current candidate has one authenticated photo renderer, Google IDs-only on-demand photos with complete attribution, existing bound-website fallback, isolated failures, responsive DM Sans interaction and complete address in About. Photos are temporary presentation material, never State facts or booking authority.

Acceptance: frozen clean source and harness commit; five offline gates without .env; deterministic 390×844 / 1440×900 / 960×900 screenshots and Google/website/failure scenarios. Stop before Live on any acceptance failure. Only after all pass: one controlled public Tokyo Case, one optional G1, local PostgreSQL praxis_smoke only, no refresh/retry or external booking GET. Search ceilings remain 50 model / 100 Google / 500s browser; separate photo ceilings 1 Details / 10 media / 2 source pages / 10 source images, redirects included. Preserve old trees, main files, .env and database cases.

Harness oracle: synthetic image bytes, explicit author strings, request ledger, HTTP auth isolation, actual Chromium layout and SQL departure record. Existing product evaluator unchanged; Live quality/S0 require independent evidence and will not be inferred from Fixture tests. externalSideEffectCount and uninstrumented backend total website requests remain NOT_MEASURED.


## Round 2 (2026-11-17)

User review confirmed the missing equivalent-draft projection fix. Copy workspace-read-projection.ts and its existing unit contracts exactly from872785522 (identical to f134cb750), preserving727 restaurant Domain/search/router and the existing four browser assertions. Only the corresponding projection rules in workspace architecture/User Flows are synchronized. Correct the three outer scripts to use round-2, real evaluator severity statuses, awaited page-owned photo responses, honest terminal reasons and separate list/HTTP200 image counts. Old gates/failures remain unchanged.

Acceptance sequence: pre-freeze projection/outer contracts and the four prior failures; new local frozen commit; all five clean-commit offline gates including G6/build; formal16-case three-size visual smoke; only then one already-authorized local-PG Live case. No rerun, extra demand or source substitution. Any formal offline failure stops Live. New results go only under .eval-artifacts/3c-unified-20261117/round-2; record runtime HEAD as the sole candidate SHA.


Round-2 completion evidence: sole frozen candidate `ea7b20c6eaf842a3d365784f529b543f23218ed2` passes all five gates includingG6/build and formal16 visual cases, followed by only one authorized public Live. Execution chain observed; independent qualification/S0 remain NOT_EVALUATED and CLI S1 PRESENT for missing independent support. See [round-2 report](../.eval-artifacts/3c-unified-20261117/round-2/REPORT.md). No additional Live, main merge or push.
