# G3 Group05 — response-only slots and date states

2026-10-29T02:18:51.958613+01:00, Vienna CET (UTC+1). Work branch `codex/feat-phase3b-tabelog-observed-availability`; main8454fffa integrated. Group COMPLETE; overall G3/G3c continue.

User expressly authorizes only C's protected fragment fixture response input and requires complete diff: [authorized-c-fixture.diff](authorized-c-fixture.diff), [authorization](authorization.md). C logic, all assertions and other three protected tests unchanged; identity resolver/ranking/fragments unchanged. No longer waiting for that authorization.

## Behaviour

- Non-English DOM slot/class inference removed; either language needs a same-outlet/date/party/time audited response. An unscoped probe has no inventory authority and returns unknown. No old DOM fallback survives.
- Private calendar FULL/CLOSED/PHONE/SELECTABLE interpretation removed. The existing day API returns UNOBSERVED (=UNKNOWN) without a validated corresponding response; a positive response-observed day is not stock for another party/time. No negative response schema invented. The Adapter reports only publicly restricted controls, never a class-derived CLOSED/FULL/PHONE reason.
- Latest response, exact binding, unsupported clocks and Group01 structure alerts remain. Existing English selected-query safety still needs its later public-control work; this group does not claim that class dependency removed. No State/TaskDefinition/Prompt/Guard/identity change.

## Red / green / gates

Frozen red bcc122d3: native2/2 and real Chromium1/1 fail target assertions: class-only stock/date must be unknown. Same controlled inputs turn green at a84066c8 (native2/Chromium1). Final complete suites below include those exact controls. Valid response succeeds even with renamed/full-looking private classes, missing response never offers stock, wrong party stays unknown. Real Chromium keeps HIGH identity and uses actual passive response capture.

Targeted existing product controls47/47 passed after explicit responses were supplied; native composition unavailable controls2/2 passed while every original assertion remained. Old HARD full fixture result44,197 bytes/SHA `9a3298bc5e004b99e41d80713e8913b68c336cfa594f6eb60599e310ee3fb633` is byte-identical.

Final frozen candidate `2d29aead79ac574ab3b407503d28f2fb943f252e`,690 paths SHA `ab6e85012395f09c6a5e50fd85ded338187d0b7068114c9bd0a16cc424896d34`. Outer scripts frozen before runs.

| Gate | Result | Seconds |
|---|---|---:|
| typecheck | PASS | 0.494 |
| arch-check | PASS | 0.183 |
| npm-test | PASS (1215/1215) | 28.246 |
| build | PASS | 0.462 |
| browser-fixture | PASS (179/179) | 114.013 |
| dom-change | PASS (4/4) | 21.331 |

All gates clean before/after, freeze verified, restoration0. Ordinary G2 remains11 PASS/1 DEGRADED_HONEST (Sen requestConfirmed); not full strict G3 acceptance. First gate attempt typecheck found two unscoped calls; repaired with explicit unknown-without-authority semantics, scoped test uses its current request. Second attempt found two class-derived UNAVAILABLE composition fixtures; their inputs now contain independent bound23:00 stock outside the requested window. Both failed gate receipts retained; after two repairs the full matrix is green. No third repair/no exclusions.

## Corresponding test changes

- C protected fragment test: only exact approved fixed response addition; complete diff linked above.
- Tabelog Adapter unit tests: day/class-only assumptions rewritten to approved UNKNOWN; normal/native continuity/resume/branch controls receive explicit fixed Aug5/party2/19:00 responses. Immediate-slot negative receives fixed12:00/12:30, not the requested12:08. All workflow/safety assertions retained.
- Shared Live availability session fixture receives its fixed bound19:00 response; assertions unchanged.
- Browser Tabelog saved-date tests now assert unknown without responses and generic public-control restriction; date/party query-options test supplies its existing explicit request and remains no-inventory. No saved page changed.
- Exactly two corresponding native composition controls in `src/eval/restaurant/agent-loop/native-discovery-composition.test.ts` use an explicit bound23:00 response instead of class-only/unbound empty stock, preserving UNAVAILABLE + continuation/delivery assertions. [Complete diff](corresponding-eval-fixture.diff). This is B's user-assigned maintenance of tests for removed private logic; no A Runner, Gold, scorer, mutation, fixed baseline, questions or answers changed. Fixture does not derive stock from production parser, model, requested time or class.

Physical site TS3,950/Pack478 (reference only). No code moved into Pack/common to fake reduction. Ledger470 unique ids retains all469 prior rows and totals171model/242GET/11Google. This batch real model/Google/site/Live/GET/environment calls0; no.env/QA-answer reads. macOS validation only.

## Next

Commit/push group then examine Sen's remaining selected-query proof before replacing the shared class-selected path. G3c remains after the Tabelog group unless an explicit stop condition occurs; no main merge.
