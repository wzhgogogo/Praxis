# 2026-11-09 — held-out paused / offline reliability repair

Status: draft / not integrated; corrected source freeze/full gates pending. First freeze414c3831 passed type/arch/default1558/build; browser gate257/262 failed. The5 failures remain in gates/414c3831:3 old direct-widget fixtures lacked explicit named scope,2 cookie/redirect cases exposed an observer that started flowing too early. Corrected with parser-push observation (including unread buffered bytes), original redirect assertions retained; targeted80 controls pass and a buffered-byte/no-consumption control is added. No first failure overwritten. Base4256303d; no sourceGET/model/Live. Original held-out checkout,871 files and external ledger fingerprinted and preserved.01/02 are now exposed development regressions; old results remain baseline, no rescoring or resume.

| Repair | Evidence / red-green | Boundary |
|---|---|---|
| Health diagnostics | Five fictional scenarios + late-opening cleanup; local Chromium401 headers before stalled body; original missing-phase red retained | SESSION_OPEN/NAVIGATE/SCRIPT_WAIT, document/script status, sanitized navigationError and phaseElapsedMs;10s unchanged |
| Zero-body document retry | Original navigator fails1vs2 attempts; real local Chromium observes Node bytes, abort-before-second, same URL, both recorder events/physical request counts; actual01-r1/r2/02-r1 DOM components | Only observed zero-body GET document transport timeout;10s attempt/20s total;4xx/5xx/partial/Guard/cancel/non-timeout never retry. Existing partial-static whole-entry reload retired. Static/browser/provider/turn limits otherwise unchanged |
| Area TableCheck evidence | Actual01/02 candidate/evidence/provider lifecycle projections red→skip; current Google link/HIGH source-page link accepted, old/other/LOW/search/wrong-host denied; SPECIFIC_OUTLET unchanged | Source-pack origins/path metadata; TABLECHECK_NOT_EVIDENCED is a skip, not a failure. Source links are private-query filtered; identity/Guard/G1 unchanged |

Estimated avoided **original provider attempts**, not end-to-end improvement or new scores:

| Planned run | seconds | models |
|---|---:|---:|
|01-r1 (actual retry1)|90.003|22|
|01-r2|71.204|13|
|02-r1|74.582|18|
|02-r2|39.183|11|
|02-r3|46.217|14|

401 was a fictional proposal fixture. Explicit401 status occurrences in evidence05 JSON:0; original health omitted document status, so no real401 claim. Actual02-r1 trace936–939 is a Tabelog region directory, not a merchant detail.01-r1 trace961–964 and01-r2 trace1569–1572 show actual merchant timeouts. Historical Node body-byte count is UNKNOWN. Recovery fixtures construct the zero-body first attempt and second HTTP envelope, using unchanged recorded same-page DOM and stock JSON; component success does not prove historical retry success or live reliability. D4 delivery/D8 B1 regression remains in full gates.

Test migration preserves semantic/safety assertions. Named-source component inputs explicitly declare their named scope. Synthetic website responses publish the independently configured reservation entrance; the two-turn fixture independently models Google Search/Details pointers. Existing counter expectations distinguish direct identity/widget reads. Frozen real recordings/private manifests/model outputs are not edited.

Full gates, hardcoded scan and main remote receipt will be recorded after clean source freeze. Stop after publication, wait reviewer for next held-out composition/time; do not resume old batch.
