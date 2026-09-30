# Browser Case slices: bounded Live read-only result, 2026-09-29

- Status: exposed development evidence; **not** an integrated Case acceptance or Clean Baseline
- Inputs: `restaurant-read-development@6`; H001 uses the separately authorized Sep 30 19:00 diagnostic variant, leaving original Gold unchanged
- Mode: real local Chromium and DeepSeek against one historical source entrance per Case; no Google, source discovery, full Runtime/Presentation, booking write, retry, or platform switch
- Execution plan and limits: [slice plan](BROWSER-CASE-SLICE-PLAN-2026-09-29.md)

| Case | Source entrance and request | Actual read | Stop and evidence |
| --- | --- | --- | --- |
| H005 | TableCheck `0711-ginzabistro`; Sep 29 23:03 JST, exactly 4, one-minute validity | 20,117 ms; 0 model calls; 1 browser operation | `UNKNOWN/BROWSER_RUNTIME_FAILED`: `page.goto` timed out at 20,000 ms waiting for DOM content. No identity or inventory evidence. The immediate request was still current at return, but this is not an inventory result. |
| H002 | Same TableCheck guide as a two-person widget probe, **not** a case-qualified restaurant; Oct 3 18:30 | 24,037 ms; 5 model calls; 17 browser operations | `FAILED/BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED`; no Adapter result or inventory. First Oct 3 click encountered an asynchronously replaced DOM target. The date button then remained visible but became disabled; later attempted clicks were rejected. |
| H003 | Same H003 native TableCheck guide; Oct 2 17:30–22:00, 10 | 28,838 ms; 4 model calls; 24 browser operations | `UNKNOWN/BROWSER_TIMEOUT`, with one HIGH same-source identity evidence and zero Offer. Oct 2 and 10-person actions returned from browser clicks; the 24th operation was the wait after selecting 10. The next observation was blocked by the **operation-count** guard, before a selected-value readback or request-bound inventory result. This was below the 30-second provider cap; the generic reason code is not evidence of a connection timeout. |
| H001 | Tabelog `Sushi Teppen`, ID `13308491`; authorized Sep 30 19:00/2 variant | 4,056 ms; 0 model calls; 2 browser operations | `UNKNOWN/ENTITY_MATCH_UNCERTAIN`, zero evidence/Offer. The correct detail URL and `Sushi Teppen Reservation - Shinsen/Sushi` title loaded, but native continuity failed before controls or inventory. |

Aggregate: **77,048 ms, 9 model calls, 44 browser operations**, four invocations and zero retries. All are Live read-only observations. None proves a current slot, a full Case result, a no-inventory conclusion, or the overall benefit of native discovery. The 45-second candidate and 30-second provider caps were not increased. No side-effect action occurred.

## Offline trace attribution

H002: controls immediately before the first click showed `Saturday 3`/`2026-10-3` visible and enabled. The click failed with `Observed target changed or detached`. The next three observations showed the same date control visible but `disabled:true`. `toObservedTargets()` currently filters disabled non-option controls out of the model's target list, so the model lost a referencable observation of the changed state and spent the remaining budget proposing unavailable targets. This does **not** establish that Oct 3 has no tables. The smallest shared-path follow-up is to expose visible disabled controls as read-only targets while retaining disabled-action rejection; a local fixture should verify the model sees the state and cannot click it.

H003: the browser returned success for the `CHOOSE_OPTION` click on 10 and its `WAIT_FOR_CHANGE`. The operation counter then stood at 24/24. A further snapshot would trigger the `Browser operation budget exceeded` guard in `BrowserTaskExecutor`; the TableCheck Adapter maps that code to `BROWSER_TIMEOUT`. The trace therefore supports an operation ceiling, while the chosen value and stock remain unconfirmed. The minimum next check is an offline fixture/readback plus more precise operation-limit attribution, before any new Live budget.

H001: the new diagnostic runner incorrectly hand-entered `sourceIds.tabelog = "13308491"` with the correct detail URL. Production native discovery and the historical H001 Live candidate use the path ID `en/tokyo/A1303/A130301/13308491`. `inspectNativeOutletContinuity()` rejects the runner's bare numeric ID as `SOURCE_REF_INVALID` regardless of the page. This is a **runner input defect**, not evidence that the production same-source identity check or Google matching failed. The runner's ID has since been corrected to the historical path and a preflight ID/URL consistency check added; the Adapter's `onIdentityDiagnostic` is now connected for later runs. Identity acceptance itself was not relaxed. The existing Live artifact remains UNKNOWN and cannot retrospectively prove page-owned name/address or inventory.

Artifacts, in execution order (git-ignored):

- `.eval-artifacts/browser-case-slices/2026-09-29T14-03-43-123Z-e0b29fff-32ad-48ca-8a28-9565afa861e0.result.json`
- `.eval-artifacts/browser-case-slices/2026-09-29T14-04-44-344Z-6c7e6767-8ef2-477b-9e8e-9a89531fd007.result.json`
- `.eval-artifacts/browser-case-slices/2026-09-29T14-06-52-540Z-291345cf-306a-4238-9da7-ded2c1f9aa83.result.json`
- `.eval-artifacts/browser-case-slices/2026-09-29T14-07-47-994Z-28ad4446-3628-4bd4-a340-912af9593bd6.result.json`

The H002 artifact was sanitized after capture to remove one accidentally recorded raw HTML field; its redaction audit retains the original file hash and removal count. No raw HTML, cookies or secrets remain in these result artifacts. The execution traces have not been recast as independent Eval results.

## Offline repair after these Live runs

The shared Executor now projects visible disabled controls with `disabled:true`, no available actions and a `DISABLED` rejection reason. Every attempted action on one still fails before browser execution. After a completed action, it reuses the fresh post-action observation for the next decision only when a page change and the option selection were observed; otherwise it takes another observation. The 24-operation ceiling is unchanged and now emits an explicit `BUDGET_EXHAUSTED / OPERATION_BUDGET_EXHAUSTED` lifecycle diagnostic when the next operation is refused. These changes are local and do not turn any saved Live UNKNOWN into an Offer.

A real Chromium TableCheck Adapter Fixture exercises native identity, the four query actions, a final selected 10-person request and an explicit same-source slot within 24 operations. In an isolated source copy with the prior duplicate-observation behavior, the same test fails with `BROWSER_TIMEOUT` and `OPERATION_BUDGET_EXHAUSTED` after four model actions; the repaired worktree passes. This verifies the diagnosed operation-count failure locally, not current TableCheck inventory or timing. The H001 diagnostic runner now uses the historical full source ID with an ID/URL preflight and records later identity diagnostics; no H001 Live rerun occurred.
