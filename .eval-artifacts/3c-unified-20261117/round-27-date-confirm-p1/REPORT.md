# Round27 DATE CONFIRM P1 — offline closure

2026-11-24 · frozen offline regression / draft, not integrated.

Worktree `/private/tmp/praxis-3c-unified`, branch `codex/feat-web-photos-unified`; clean start **678a177391ce3b3b65a620e2521428f36c683274**, source tree71a58ad60ab47e73b94112121e82e8a92fa9ec58. Local-main sparse worktree check passed. Unique final acceptance SHA **ffafb73cb8e277e86fe0537aaf508c8c304b50e4**, source tree **7f893aa7aa514010e51033524fd18776053c4ee5**. Source first frozen at cd7b4ae51a801e5454a497a59310f6a4d984db79 and never changed afterwards; final freeze changes only batch orchestration/evidence. Final archive HEAD appears in delivery reply; its source tree stays identical.

## Scope and implementation

Close only schema-valid pure DATE CONFIRM bypass of an explicit relative dining-date correction. ADR-0052 already requires contradictory CONFIRM to fail closed. The previous date-context change treated any all-CONFIRM DATE set as sufficient for early BOUND; it bypassed the existing conflict guard below. Remove that unconditional `dateFacts.length` shortcut. Early return now requires the existing explicit keep-date wording. True time-only and incidental background cases proceed through existing binding and remain unchanged. A clear relative-date correction with CONFIRM reaches existing CONFLICT/NEEDS_INPUT, not an invented replacement date.

Only production file `src/domains/restaurant/relative-date-binding.ts` changes (one condition, two changed lines). Corresponding pure and persistent-message test files add controls and contradiction coverage. [Exact three-file diff scope and hashes](scope-verification.json). No additional date grammar, model calls, semantic Prompt/schema, compiler policies, Agent Loop, Reducer, Runtime, source adapter, scoring, fingerprint, missing-field rules, dependencies, UI or CSP changes. No F6 test-input change in this follow-up. Prior fixes are preserved.

## Paired independent outcomes and default regressions

Trusted Tokyo reference2026-11-24; authoritative initial plan2026-11-28 at18:00; user edits19:00.

| User / model DATE | Before on678a | Final frozen result | Actual availability after edit |
| --- | --- | --- | --- |
| 日期不变，只改晚上7点 / CONFIRM | PASS | PRESENT_RESULTS, date11/28 | 3 calls,11/28 19:00 |
| 改成后天晚上7点 / CORRECT offset2 | PASS | PRESENT_RESULTS, date11/26 | 3 calls,11/26 19:00 |
| 改成后天晚上7点 / CONFIRM | FAIL: PRESENT_RESULTS,11/28,3 wrong-date calls | **NEEDS_INPUT**, compilerCONFLICT | **0 searches,0 availability calls** |

The contradictory case retains old persisted date11/28 while asking for clarification; it never queries that inherited date. Direct compiler output is not the sole oracle: the production persistent message composition runs with PGlite, fake semantic model and actual local availability port observations.

[Baseline3 raw observations](baseline-confirm-probe.json), [raw log](baseline-confirm-probe.log):2/3 with child exit0; per-row pass is independently checked. Original supplied script was copied byte-for-byte and runs **--confirm-only**; [input provenance](probe-provenance.json). Other Gemini script issues are not run or repaired in this slice. The previous19 independent date probes are reused unchanged to preserve background/keep-date/time-only, selected calendar/weekday, linked alternatives/comma, offsets and omittedDATE behavior. [Final22 independent observations](reviewer-probe-results.json) all PASS; wrapper checks exact counts and each row, not only process exit.

[New formal regressions on unmodified production](targeted-red.log):39tests,37pass/2fail (pure guard and actual persistent contradictory-message case). [Targeted green](targeted-green.log):39/39,19702.560625ms. Same behavior is included in default `npm test`; old assertions are retained, not weakened. [34 final actual-message observations](semantic-message-observations.json):24 expected-date query cases and10 NEEDS_INPUT/zero-availability cases. Targeted tests and these rows overlap the default denominator and are not added to it.

## Final same-clean-SHA acceptance

All stages below run on ffafb73cb8e277e86fe0537aaf508c8c304b50e4 / src7f893aa7aa514010e51033524fd18776053c4ee5, clean before/after, minimal environment, no.env loading. [Manifest with exact commands/SHA/exits/outer durations](gates/manifest.json), [outer raw log](acceptance.log). Source and18frozen input hashes unchanged during run. Build precedes dist C1.

| Stage | Exit | Seconds | Actual result |
| --- | ---: | ---: | --- |
| typecheck | 0 | 0.727271 | PASS |
| arch-check | 0 | 0.207577 | 0 forbidden |
| build | 0 | 0.617824 | PASS |
| test | 0 | 88.833340 | 1981/1981 |
| browser-fixture | 0 | 505.393083 | G2 5/5; Chromium 593/593; G6 159/159 |
| c1-built | 0 | 13.357277 | dist C1 4/4 |
| reviewer-probe | 0 | 17.147573 | 19 prior +3 CONFIRM =22/22 |
| assets | 0 | 0.205763 | 19JS + HTML/CSS match |
| graph | 0 | 0.046048 | strict18 modules;0 cycles/any/suppression |
| protection | 0 | 3.472221 | 14144 existing match;137 known missing |

[Default log](gates/test.log):1981/1981,88724.105625ms. [Browser raw log](gates/browser-fixture.log):G2 25041.024167ms,Chromium440745.349125ms; combined598 is exactly5+593, not an additional group. G6 39279.957958ms. Source C1 four are included inChromium593; [new dist C1](c1-built/test.log)4/4,13228.330083ms. Full Browser Fixture has no outer sandbox, preserving Replay children OS isolation. Other applicable steps use OS deny non-loopback outbound; dist C1 owns one sandbox. No real Cloudflare, model, Google or restaurant request.

[Strict browser graph](browser-dependencies.json):18modules,stricttrue,0cycles/any/suppression,all SCCs singleton, no reverse import ofentry. [DOT](browser-dependencies.dot). [19JS source/build](build-assets.json), [HTML/CSS](html-build-comparison.json), [UI retention](ui-retention-verification.json): all match; assets andHTML/CSS also match originalRound27 bytes. `src/web/` diff0. [18frozen inputs](frozen-input-verification.json) all match.

ExistingRound27 UI15/15 pass in full browser gate. [34fresh PNG+34JSON](visual-inventory.json) bind finalSHA; [inspection](visual-inspection.json) and [byte comparison](visual-retention-verification.json):29current PNG bytes match previously inspected originals in initial-attempt contact sheets; remaining5current frames individually inspected. No claim that initial-attempt metadata is finalSHA. Source coordinates have0delta for history absolute top and sheet internal relative top at390/1440. Simulated-keyboard Stop remains above composer. Four injected500 recovery frames are expected; universal console/HTTP audit is not claimed. No independent formal16/Style1/historical-route script rerun for this one guard; real device soft keyboard remainsNOT_EVALUATED.

## First run orchestration failure — retained and corrected

[cd7b4ae51 first attempt](failures/cd7b4ae51-asset-output-path/RESULT.md): all5codegates,distC1 and22probes passed. Assets comparison exit0 but `cleanAfter:false`; copied script still hardcoded previous `round-27-dining-date-context-p1/build-assets.json`. It transiently changed only that old artifact's SHA field, not its19asset values. Outer scheduler immediately stopped before graph/protection. This is not final acceptance and is not hidden as a product failure or a fully green run.

Saved misplaced artifact and exactdiff. Old file was restored byte-for-byte from its frozen Git blob; baselineSHA256 verified in [restoration receipt](failures/cd7b4ae51-asset-output-path/historical-restoration-receipt.json). It is not claimed neverwritten. New script now writes its sibling file via `import.meta.url`; HTML was already relative. Corrected script/plan and first-run evidence were committed, then **all10steps rerun from scratch on final ffafb73**, same src tree. [100superseded evidence files](superseded-evidence-verification.json) match frozen Git blobs. Original raw content/paths are preserved; archive relocation is documented rather than rewriting logs.

## Protection, cleanup and limits

[Final protection](protection-verification.json):**14144/14144 existing historical files match**,0changed/0newmissing. Includes originalRound27 295files, prior date-binding-p1 248 and dining-date-context-p1 261. Main worktree HEAD/status/index/diff and main.env hash unchanged, closeout950materialized files unchanged, sparse rules and eight root configs unchanged. Previous asset artifact is restored and hash-matching, with transient write disclosed above. Historical137originals remain missing: **BLOCKED_BY_MISSING_HISTORICAL_ORIGINALS** remains the whole-history signoff. No historical originals fabricated or restored from unapproved sources.

[Cleanup](cleanup-verification.json): no matching test/Chromium/CDP/HTTP child processes remain; finally blocks close local HTTP/browser/PGlite. No Live, realPostgreSQL,4312, remote write/push or main merge. Only local commits.

Four-layer reading: (1) three specified offline outcomes now satisfy independent literal date/call expectations; (2) compiler,persistent message/availability,default and local HTTP/CDP/Chromium/dist layers are separately evidenced; (3) this Fixture correction is not a real-source S0 assessment—real-source S0/S0_DECLARATION/S0_BOUNDARY and model language generalization areNOT_EVALUATED; (4) confirmed attribution is the unconditional CONFIRM early return, closed by the existing contradictory-date guard. No broader Gemini issue or Live capability is declared resolved. Await independent review.
