# Phase 2c witness certification

- Status: current executable / private held-out certification input; no product/model execution.
- Authorized branch: codex/holdout-phase2c-exit, published base941ca9c1, prior commitment398d2e12.
- Slice: verify literal hashes; resolve Google centers; certify same-outlet merchant HARD facts, <=1000m and matching current inventory for the immutable dates/party/window. SOFT/UNSPECIFIED are observed only. Aim at least one certified witness per case; stop search once sufficient evidence is obtained, not exhaustive restaurant coverage.
- Only listed fallback after a bounded primary search has no qualified witness; one no-witness case excluded, >=2 stop. Source failure is not business no-witness.
- Source method: evaluation-side standalone scripts copied from Phase2b public source fragment/booking-read methods; no src imports, product parser, model, browser, form navigation or slot click. Google Places read search POST is solely public place lookup; merchant/listing/course GET and source-exposed four-parameter calendar GET only. TableCheck reserve/subpaths and all forms prohibited. No personal data submission, cookies or redirects.
- Pace per origin >=30sec after last response; transport without status120sec then one identical retry;403/503/429/busy900sec then one identical retry; failure stops. Other non200 stops. Same rules as prior batch. All failures retained.
- Budgets: models0, Live0; Google<=24 total (including retries), website requests<=120 total; at most6 merchant candidates per primary or fallback place. No unrelated source diagnosis or exhaustive prechecks.
- Evidence: immutable request metadata/time/SHA, exact minimal merchant raw fragments and public business JSON-LD, raw inventory responses, selected Google place with coordinates and independent distance. Inventory response date/party/outlet ID/time must all match. No booking-link request is made to validate response links.
- Commit and SHA-freeze scripts + each explicit read job before execution. Dynamic next jobs may reference saved public links/source facts and are frozen separately; no ongoing job changes.
- Controls: offline simulated transport validates boundaries, pacing/retries and response binding; real request failures stop. No product five-gate rerun for this source-only data slice.
- Completion: independently recheck all raw hashes and supported facts, report Google counts/source cadence, earliest witness requestedAt +24h Live deadline; commit/push this branch and stop. Mainline/product/Live untouched.
