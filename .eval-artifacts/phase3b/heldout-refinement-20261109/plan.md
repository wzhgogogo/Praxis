# 2026-11-09 CET — user-approved repair2/3 refinement

Status: draft / not integrated; exposed01/02 development evidence, no clean holdout.

Slice: preserve one entry retry slot shared by existing5s successful-static IDLE_ABORT and document NO_HEADERS timeout. First10s limits headers wait only; headers/body arriving within10s continue under total20s. Second attempt uses remaining total budget. Global initial prepareNavigation resource budget remains20s, never narrowed to10s by the document header timer. Abort old network plus navigation waiter before permitting the same exact URL again. Both attempts retain ENTRY_NAVIGATION and independent physical accounting. No header/body/Guard/provider/identity/G1 changes. Health diagnostics from prior slice retained;401 remains fictional, not a historical diagnosis.

Area candidates skip only pack candidatePath NAME_RESOLUTION unless SPECIFIC_OUTLET. No source-page-link collection in this slice. Skips are metadata.skippedSources only, not BUSINESS failures, sourceAttempts or providerAttempts. Intentional coverage reduction. Audit19 recorded candidate/run rows without interpreting UNKNOWN as unavailable. Savings denominator: avoided TableCheck provider time/models only.

Acceptance: local real Chromium NO_HEADERS, headers-only and partial no-retry,15s document body/large script, shared-slot competing failures,4xx/5xx/Guard/cancel controls; actual01/02 component routing+constructed recovery; D4 actual delivery and D8 actual B1 regressions. Diagnostic evaluator must retain skip without failure. Full type/arch/default/build/browser+G6/strictG2 on clean frozen SHA, hardcoded scan. No sourceGET/model/Live; old425 workspace/run/ledger unchanged. Publish main under user's existing authorization, stop for review; no held-out resume.
