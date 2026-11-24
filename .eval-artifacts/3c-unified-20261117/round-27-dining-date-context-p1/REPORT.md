# Round 27 dining-date context P1 — frozen offline regression

2026-11-24 · draft / not integrated · current follow-up acceptance; no Live.

Worktree `/private/tmp/praxis-3c-unified`, branch `codex/feat-web-photos-unified`. Baseline `e5721c68fdffd60c14b32415f1d0099295b4574a` (src `2e6d4725953ba1107a2437dda269ecd891c6b4d0`). Unique final tested code freeze **`e68ed2a51baf19380dbca276e9b2651d6dc4e408`**, src tree **`71a58ad60ab47e73b94112121e82e8a92fa9ec58`**. The local archive commit appends only this batch and four ledgers; final HEAD is reported in the delivery reply. No src edits after this freeze.

Original Round27 freeze `937d44be67fb8f5b735743bc1666040cc6c551b7` and preceding date-selection P1 freeze `5d6d683f13ee1247910f08651ec1e1ec35b58a9c` remain historical frozen evidence. Their directories and every existing protected file remain unchanged; neither is relabelled as this run.

## Change and scope

Only production change: `src/domains/restaurant/relative-date-binding.ts`. Corresponding pure and persistent-message tests updated. Binding now respects the model DATE's literal current-message quote (case-insensitive correspondence, original quote preserved), chooses the dining-date span instead of unrelated background dates, recognizes the already-prompted `tonight` as TODAY, and honors explicit keep-date / DATE CONFIRM. Omitted DATE is repaired only for bounded date edits, imperative meal requests or standalone temporal/meal fragments. Descriptive other-event text cannot select the dining day; an unresolved day/clock purpose clarifies instead of silently querying the previous date. Commas remain within date-selection relations, preserving the same failure for linked alternatives with or without a comma. Common `make it` / `move it to` / `change it to` commands share the existing omission path.

One additional authored test-input correction is disclosed: in `native-discovery-composition.test.ts`, the F6 reserve-search constructed message adds `tonight`, already emitted by its fixed fake model raw. Reference day and actual date remain identical; all reserve, ownership and alternative-slot assertions are unchanged. This fourth source/test file changed; it is not claimed wholly protected. No production Agent Loop or evaluator/scoring logic changed. [Exact four-file scope, before/after SHA256 and one-line F6 diff](scope-verification.json).

No Prompt/schema/version, Reducer, State, source adapter, fingerprint, `missingBlockingFields()`, UI, dependency, CSP or backend orchestration changes. No flight/arrival-specific sentence mapping, extra model/provider call, compatibility path or general calendar parser.

## Actual message outcomes

Trusted reference is Tokyo 2026-11-24. Existing plans in new controls start 2026-11-26; the six original cases retain their prior 2026-11-25 seed.

- Travel tomorrow + dinner tonight at 7 pm, including omitted DATE: persisted and actually queried **2026-11-24 19:00**. The standalone tonight control also queries Nov24.
- Arrival tomorrow + keep the date / only change dinner time: retains **2026-11-26 19:00**. Descriptive other dinner tomorrow does not change this plan's date.
- Explicit 后天: correct proposal, wrong TOMORROW, wrong calendar DATE and completely omitted DATE all actually query **2026-11-26 19:00**.
- Omitted DATE for Make / Move / Change it to tomorrow: actually queries **2026-11-25 19:00**.
- Selected calendar / Saturday corrections remain **2026-11-28 19:00**, despite excluded/background relative mentions.
- Unresolved relative/calendar/weekday choices, reverse order, comma-linked alternatives, approximate day ranges and ambiguous clock purpose: **NEEDS_INPUT**, availability calls **0**.
- Time-only original control inherits Nov25; new time-only/keep-date controls inherit Nov26.

[31 actual persistent-message observations](semantic-message-observations.json): **22 positive date-query cases + 9 NEEDS_INPUT cases with zero availability calls**. These measure the actual availability port, not only the draft. [Default raw log](gates/test.log). Targeted pure+message suite **36/36**, affected prior compatibility cases **5/5**. These overlap the default denominator and are not added to it.

[User-independent frozen probes](reviewer-probe-results.json): **19/19 = 6 calendar/relative + 5 weekday + 4 contextual + 2 comma alternatives + 2 omitted edit**. Wrapper verifies every `pass` and exact group counts in addition to child exit codes. Three author-constructed same-scope cases (standalone dinner tonight omission, uncertain arrival/dinner clock purpose, descriptive other dinner) enter formal message/pure tests and are reported separately from these19. The unrelated restaurant-undecided P2 and old non-P1 CONFIRM probe are excluded from the independent denominator, not declared closed by this report.

## Same clean freeze acceptance

Every stage below ran against `e68ed2a51baf19380dbca276e9b2651d6dc4e408` / src `71a58ad60ab47e73b94112121e82e8a92fa9ec58`, with clean tree before/after, minimal inherited environment, no `.env` loading. Raw outputs, exact commands, SHA, exit code and outer elapsed seconds: [manifest](gates/manifest.json), [outer log](acceptance.log). Build intentionally precedes dist acceptance. No external services used.

| Stage | Exit | Seconds | Actual result |
| --- | ---: | ---: | --- |
| typecheck | 0 | 0.738391 | PASS |
| arch-check | 0 | 0.203931 | 0 forbidden |
| build | 0 | 0.597346 | PASS |
| test | 0 | 83.182267 | 1978/1978 |
| browser-fixture | 0 | 496.484491 | G2 5/5; Chromium 593/593; G6 159/159 |
| c1-built | 0 | 13.686858 | dist C1 4/4 |
| reviewer-probe | 0 | 14.667258 | 6+5+4+2+2 = 19/19 |
| assets | 0 | 0.206303 | 19 JS + HTML/CSS match |
| graph | 0 | 0.046423 | strict; 18 modules; 0 cycles/any/suppression |
| protection | 0 | 3.353442 | 13883/13883 existing; 137 known missing |

Browser raw [log](gates/browser-fixture.log): G2 24843.285917ms, Chromium 432045.251292ms; combined598 is the same 5+593, not an additional test group. G6 39272.529250ms. Default1978 internal duration83078.161334ms. Source C1 **4** are included in Chromium593; [same-build dist C1](c1-built/test.log) **4/4**, internal13555.923458ms (child outer13.5958755s; stage outer13.686858s). Full Browser Fixture has no outer sandbox; Replay children retain their own OS-deny sandbox. Other applicable steps use OS deny non-loopback outbound; dist C1 owns its single sandbox. Fixture transport/CDP is local only.

[18 frozen input hashes](frozen-input-verification.json) all match. [Browser graph](browser-dependencies.json) includes type-only edges, strict true, all SCCs singleton, no imports of entry from another module, zero `any`/suppression. [DOT graph](browser-dependencies.dot). [19 source/build assets](build-assets.json), [HTML/CSS comparison](html-build-comparison.json), [original Round27 UI byte identity](ui-retention-verification.json): all identical. `src/web/` diff is empty.

## Fresh UI retention verification

Existing **15/15 Round27 UI** tests ran under the final SHA, including capsule-save/remove pending states and Stop200 with `stopped: true` on a known paused active read. [Test-name, image and geometry inventory](visual-inspection.json). **34 PNG +34 JSON** were freshly captured in [visual/](visual/); each metadata SHA matches the final freeze. Four contact sheets covering all34 and six key original frames were visually inspected. [Inventory/hashes](visual-inventory.json), [contact index](contacts/index.json).

Source history `summary.top` delta0 at390/1440; sheet `summary.top - sheet.top` delta0 at390/1440 while sheet height may grow. Simulated keyboard Stop bottom262.375 remains above composer top282. Pending questions show checking+Stop; editors fit the mobile row; request-pending frames remove old empty state and four deliberately injected500 controls restore it. Tests assert pageerror conditions; this is not a claim of a universal console/HTTP inventory. Synthetic cover placeholders are expected Fixture material.

No separate formal16, Style1 six or historical manual-route script was rerun for this helper-only follow-up; old counts are not borrowed. Native iPhone/Android soft keyboard remains **NOT_EVALUATED**.

## Superseded checkpoints and red evidence

- Baselinee572 independent contextual probe **2/4**; targeted initial29 **23pass/6fail**, then29green. Exact logs retained. Comma intermediate helperblob `31de3eb5783406da43f5107bb6537795ff4cabe4` produced **1/2** independent comma cases; exact working patch and probe input preserved.
- Freeze `08c1840a027f771110e6d57ac8749a69f946b1fe`: user added omitted Move control after scheduling. Outer scheduler stopped at safe checkpoint; all22 child PIDs finished naturally unchanged before edits; no child received a signal. Default raw1972 has1967pass/5fail (F6 constructed quote mismatch and case-sensitive tomorrow/Tomorrow compatibility). Default outer exit was not captured and is not invented. Only earlier Type/Arch/Build exits0 are authoritative; later stages NOT_RUN. [Archive](failures/08c1840a0-omitted-edit-checkpoint/RESULT.md).
- Freeze `25db4b5e3b5043b1bab62b113e492140f52756b2`: all10stages and independent19 passed, but three author-constructed actual-message scope checks failed. The entire completed acceptance, screenshots, inputs and those failures are preserved [here](failures/25db4b5e3-scope-completeness/RESULT.md). That green run is not used as P1 signoff. After its processes finished, the three cases were incorporated, targeted36 and19independent passed, then code re-frozen and all10stages rerun from zero.

[112 superseded evidence blobs](superseded-evidence-verification.json) match their committed freeze blobs. Original raw timestamps/paths remain; archive relocation is documented rather than rewriting raw contents. Development probes/targeted logs are labelled by their own checkpoint and never substituted for final full acceptance.

## Protection, cleanup and limits

[Protection](protection-verification.json): **13883/13883 existing historical files** match, no new missing and no changed historical files. Includes originalRound27 **295** files and preceding date-binding-p1 **248** files. Main worktree HEAD/status/index/diff and main`.env` hash unchanged; closeout **950** materialized files unchanged; sparse rules and eight protected root configs unchanged. Historical **137** originals remain absent; whole-history signoff remains **BLOCKED_BY_MISSING_HISTORICAL_ORIGINALS**. No recovered/fabricated historical originals in this batch.

[Cleanup](cleanup-verification.json): no matching test/Chromium/CDP/HTTP child processes remain. Test finally blocks close local HTTP, browser and PGlite. No real PostgreSQL, port4312, Live, real Google/model/restaurant/remoteCDP requests, push or main merge. All commits local.

Four-layer interpretation: (1) offline contract outcomes above pass, with real availability-port observations; (2) pure/default/Chromium/local HTTP+CDP/dist layers are separately identified; (3) real-source S0/S0_DECLARATION/S0_BOUNDARY are **NOT_EVALUATED**, not inferred zero from a Fixture pass; (4) attribution is bounded dining-date quotation/selection versus incidental background, with fail-closed unresolved purpose. Broader language generalization, full real-source Replay and native device interaction remain unverified. Await independent review.
