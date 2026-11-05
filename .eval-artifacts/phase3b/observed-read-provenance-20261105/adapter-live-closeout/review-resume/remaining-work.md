# Remaining offline failures

Status: draft / not integrated. No tests skipped. Main and Live untouched. This is a handoff list, not a claim that every failure is a fixture-only problem.

## Default suite: 3

- Two source-stage tests have an existing two-decision ceiling; the observed route needs three decisions (Tokyo, Shibuya, completion). No limit or assertion was changed.
- Source-text whole composition reaches the expected restaurant/HARD/availability/presentation behavior but uses 12 calls against the existing <=10 assertion. Its following independent evaluation assertion is not reached, so it is not reported as evaluated PASS.

## Browser: 23 across 8 files

| File | Failed tests | First observed gap / next bounded work |
|---|---:|---|
| `src/harness/browser/browser-read-category.test.ts` | 1 | Old planner assumes an observation at its initial call (null.categories); migrate initial planning and source startup fixtures, then re-check all radius/category behavior assertions. |
| `src/harness/browser/browser-read-discovery.test.ts` | 2 | Name prefix has no current startup/positive form binding; F5 fixture still expects retired region-correction action/context. Keep identity/no-reservation and out-of-radius outcomes while migrating the model. |
| `src/harness/browser/browser-read-option-controls.test.ts` | 2 | Two empty-input tests still infer native selected value from private container text. Generic option controls now pass; these original assertions remain pending a valid public-state replacement. Public-display-only attempt did not confirm the choice and was reverted. |
| `src/harness/browser/browser-read-request-binding.test.ts` | 2 | H001 native discovery fixture has not reached the current observed entry path; preserve real presentation/continuation and source response binding assertions. |
| `src/harness/browser/browser-read-tabelog-public-list.test.ts` | 1 | Fixture starts from a constructed search template instead of current observed startup/query model; keep renamed-result and other-branch rejection outcomes. |
| `src/harness/browser/browser-read-tabelog.test.ts` | 7 | Seven adapter/widget controls stop at identity/search before the intended calendar/response step. Do not call UNKNOWN a successful inventory read; migrate public entry and observation fixtures without restoring private selection routines. |
| `src/harness/browser/browser-read-tablecheck.test.ts` | 6 | Six controls lack configured observed search entry; several still expect generated guide URLs or forbidden reserve navigation. Migrate to observed public guide/component with the original ready/stale/party/provider-window outcomes. |
| `src/harness/browser/group-window.test.ts` | 2 | Two zero-model implementation assertions fail. A trial observation model advanced to the deeper result assertion but still covered only one time with OBSERVED_TIMES_EXHAUSTED. Trial reverted; investigate this gap before changing any coverage assertion. Four other controls pass, including forbidden navigation. |

Full names and the raw first failure lines are in remaining-failures.json; complete logs are under gates-final/. The group-window trial patch is unapplied evidence only, not an alternative executable path. No public source response, model response, Gold or held-out input was fabricated.
