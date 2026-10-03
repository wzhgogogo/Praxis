# H001 unified discovery and execution review — 2026-10-03

- Status: current exposed-development repair and targeted stock slice accepted; full H001 Live delivery acceptance FAIL
- Document revision: 0.6
- Last updated: 2026-10-03
- Baseline: `47f0d5a` with the pre-existing dirty October 1 run records and the October 3 implementation diff
- Scope: independent implementation review and declared controlled/stock/Live acceptance; each mode is reported separately
- Related documents: [implementation record](H001-UNIFIED-DISCOVERY-EXECUTION-IMPLEMENTATION-2026-10-03.md), [previous Live](H001-TOMORROW-VARIANT-NATIVE-LIVE-2026-10-01.md)

## Promise and final acceptance

Build website-general discovery, lawful query actions, current-result readback and delivery. Tabelog and TableCheck are the current real consumers and validation samples. Use existing Web Skills for site usage knowledge and keep source code for necessary formats, meaning and permissions. Do not add a second executor, store-specific paths, a plugin framework or layered fallback.

The final authorized Live starts from ordinary native discovery and uses the runtime-materialized tomorrow-at-19:00 H001 variant. Canonical H001 and Gold remain unchanged. At least one actually presented candidate must have independently supported same-outlet identity, the unchanged Shibuya location check and HARD omakase, and fresh availability for the exact date, two people and 19:00. Total ceiling remains 300,000ms and 50 model calls; existing stage limits retain their declared scopes. No reservation or other external write is allowed.

Controlled known-feasible recovery must deliver within its declared budget. Correct rejection and bounded UNKNOWN are separate handling results. First qualified-result latency, investigated candidates and repeated work are diagnostic comparisons, not new pass thresholds. Every dimension declared mandatory for a scenario needs independent evidence; dimensions outside that scenario do not become gates.

## First packet review

The packet improves pending-first navigation, removes unproven `failure/data:null` inventory meaning, passes the operation ceiling to native discovery, records actual source elapsed time, and places final evaluation before the acceptance sidecar. Those changes do not complete A–E.

| Finding | Required correction and reused coverage |
| --- | --- |
| A: pending can still disappear after navigation and session-reopen failure | Derive source continuation from the remaining queue after actual attempts. A selected chunk is not a consumed chunk. Extend the existing native composition interruption case. |
| A: nonempty unsuitable lists still lack meaningful query progression and current-query confirmation | Implement observed search input/filter/page actions through the existing executor. Keep the old nonempty list during loading as a counterexample; the known-feasible refreshed result must reach actual presentation. |
| B: incomplete observation and definite source restriction are not yet closed as separate behaviors | Confirm the cause before changing projection. Reuse opening/scrolling and bounded observation, preserve disabled controls as evidence, and test recovery versus definite restriction. |
| C: disabled HTML slot links can override live-control rejection | Use one current-result assessment for completion and final acceptance. Existing request-bound links must also respect their current disabled/loading/conflict state. Keep the independent positive example. |
| C: response capture begins after reservation-page navigation | Install the permitted current-target capture before an actual lawful query trigger. A local Chromium page that sends its only response during navigation must expose late registration. |
| C: raw result chronology is not independently checked by Eval | Reconstruct the current source/request/result lineage from raw records. A later conflicting or unknown observation cannot be signed off from unchanged production claims. Missing proof remains unassessed. |
| D: Context, Validator and END_READ disagree on an open current batch | Reuse the current-batch assessment; insert SEARCH/END proposals in the existing production composition and preserve explicit-count/next-batch behavior. |
| D: timeout exceptions can retain time-limit=false | Update the actual elapsed/limit state on exceptional completion; keep pending and the real stop scope. |
| E: mandatory dimensions reject a normal empty case but omit resource compliance | Declare required dimensions per scenario and reuse existing fixed-source acceptance rules. A normal bounded empty case has no presented-claim evidence dimension; source failure is not normal empty. |
| E: forbidden-source checks can ignore failed navigation attempts | Require successful observation for required sources; reject any attempt to use a forbidden source. Test missing/failing final evaluation and resource failure offline. |

The earlier pending regression expected multiple list reads, so it did not catch the real October 1 list-reload failure. The original unclassified-response fixture defined its own inventory meaning. Those are coverage/oracle omissions; new fixture green results alone cannot close current source compatibility.

## Independent disabled-link counterexample

Source: `.eval-artifacts/tablecheck-lead-path-20260929/14.html`, SHA-256 `e5786e4501015a452e0440f90d3d691da6b114f6708074f944a05a8e34c3b328`. Historical request is Ginza Iwa, 2026-09-30, three people, 18:30. The original same-shop reservation link carries all three request parameters and supports the positive example. This is historical source compatibility, not current inventory.

The review variant adds only `aria-disabled="true"` to that exact-request anchor. Its independent expectation is that the disabled link cannot support AVAILABLE. The current parser still includes 18:30 and reports query complete. The failure was reproduced without modifying the original material or calling a model/site. Evidence: `.eval-artifacts/h001-unified-review-20261003/disabled-slot-anchor.red.result.json`. The adapter must also be challenged through its existing full behavior test after the parser correction.

An intermediate repair was independently rejected again: its broad disabled check also matched the original `data-is-disabled="false"`, removing the untouched positive slots. A separate full Adapter memory variant exposed the executor's early `completion(snapshot, [])` return: the snapshot supported a slot while actual controls would have reported it disabled, but no control observation occurred and an offer was emitted. Both must be closed without losing the original positive result. Slot agreement must be assessed within the current request window; unrelated alternative slots cannot make two independently sufficient observations conflict. These are offline source-compatibility and execution checks, not current Live inventory.

## Premature Live and prerequisite diagnosis

Terra ran before the planned final review gate. Preserve both raw artifacts:

- `4a168de9…`: 97ms, semantic model transport failure; sources not reached.
- `84487552…`: 3,490ms, two model calls, one Google named-place attempt, `GOOGLE_NETWORK_FAILED`; no source browser calls.

These are premature prerequisite failures and provide no browser acceptance evidence. They are not counted as the final post-review H001 run.

The reviewer subsequently checked the prerequisite without changing configuration: the configured Google-only localhost 10808 route returned ECONNREFUSED; DeepSeek's unauthenticated endpoint returned HTTP 401 in 359ms. Google default-route transport returned HTTP 403 without credentials, and one authenticated `Shibuya, Tokyo` query using the existing client succeeded with one parsed place in 293ms. The final runner can use an invocation-only empty `PRAXIS_GOOGLE_API_PROXY_SERVER`; `.env` and browser routing remain untouched. Connectivity is not proof of browser inventory or H001 completion.

## Final offline review and source freeze

The first packet and several intermediate repairs were returned to Terra. Final actual-path review closed the stale-empty and incomplete-skill paths on both sources: no detail navigation or candidate admission occurs, and source exhaustion remains UNKNOWN. The source session-opening deadline now returns in about 2ms for a 1ms remainder with a 20ms delayed session; the late session is closed and its pending entrance retained.

Hidden inventory review covered an actual nested same-tag ancestor, not only a simple container. The initial non-greedy removal leaked its later slot; the final local tag-stack implementation removes the entire hidden subtree. Actual Adapter results are UNKNOWN/zero offers for the hidden-only case and AVAILABLE/one offer for the visible sibling. Disabled and mixed-time variants retain the earlier positive historical slot without admitting the disabled one.

Independent raw evaluation also exposed two collector-path omissions after its unit tests were green: nested hidden markup leaked into scoring, and a suffix attribute match converted the real page's `data-is-disabled="false"` into native `disabled="false"`. Exact attribute collection and balanced hidden-region removal close both. The unmodified original 14.html now passes through the actual snapshot collector and evaluator with its independently bound 2026-09-30/three-person/18:30 request; hidden-only does not. Every presented offer time needs its own enabled raw slot. A two-offer presentation with only one supported time remains unassessed; both supported times pass. These checks are historical/offline source evidence, not today's inventory.

Current-development fixtures use the production Browser composition and existing snapshot tracer. Missing raw proof was repaired in the fixture/caller chain; there is no mode exemption or oracle synthesized from Domain claims. Final evaluator implementation is `restaurant-hybrid-diagnostic-evaluator@24`, with the existing rubric and product acceptance unchanged.

Verification: typecheck, architecture check, build, host-loopback full tests and host-local Chromium fixture passed. Final limited fixes additionally passed TableCheck 53/53, current-development/raw-eval/collector 88/88, fixed-source acceptance 10/10 and diff checks. Full-suite aggregate counts were truncated by the tool and are not reconstructed. Restricted-sandbox Chromium startup denial is separate from the successful host-local fixture. No site/model result is inferred from these gates.

Frozen executable files and their hashes are recorded in `.eval-artifacts/h001-unified-review-20261003/frozen-source.manifest.json`; code-tree hash is `d6431d6221a964d76ac5dea53ba9f56947b9b3d5dfb28bd3ab09ebfbb6e09f72`. HEAD remains 47f0d5a with the reviewed uncommitted diff. The predeclared paid gate is three runs of the same `TABLECHECK_DISCOVERY_RECOVERS` scenario, each at 300 seconds, 50 shared model calls and 30 agent steps. It must exercise the real model through lawful retrieval, fresh results and actual presentation before the final Live.

## Fixed-source real-model gate

Three consecutive runs of the frozen `TABLECHECK_DISCOVERY_RECOVERS` scenario passed their recorded evaluator/sidecar gate. Each went through the real DeepSeek decision chain with offline source transport, filled and clicked the public query control, investigated the current same-outlet candidate and actually executed PRESENT_RESULTS. One independently qualified result was presented in each run; default target three remains a diagnostic shortfall, not an explicit user count. All six declared dimensions were SATISFIED, source requirements were observed, and each immutable acceptance sidecar reported PASS.

| Run | Execution artifact ID | Elapsed time | Shared model calls |
| --- | --- | --- | --- |
| 1 | e861955e-1ae5-4377-8bc0-fdd0be3f8fcf | 13,389ms | 10 |
| 2 | 61f904b4-aaa6-447c-9d76-083c833fc416 | 14,229ms | 10 |
| 3 | 16e2e0d5-0e7b-4ff6-bfc2-26224f7c0e62 | 15,974ms | 11 |

Exact execution, evaluator and acceptance paths are retained in `.eval-artifacts/h001-unified-review-20261003/fixed-three-run-summary.json`. This is a known-feasible FIXED_SOURCE_REAL_MODEL result; it does not establish current live stock, general unmatched rates or complete H001 Live acceptance.

Final independent inspection additionally found that this fixture's fill callback ignored the supplied value and replaced it with a Boolean state; the ready page removed the search input. Those runs support the observed inventory/presentation chain, but do not close exact retrieval-value readback or real query semantics. The original artifacts remain unchanged. The fixture is returned for correction alongside the actual Live query regression.

## First post-review Live and causal query diagnostic

Artifact `65e6734b-c4f7-44ee-a48d-8544f8e7c1f9` executed the tomorrow variant at 2026-10-04, 19:00, two people. It ended NO_VERIFIED_RESULT in 40,758ms with seven shared model calls, one Google named-place resolution, zero admitted candidates and no fact/availability/presentation read. Evaluator@24 reports qualified result NO; REQUIRED_EVIDENCE and FINAL_CLAIM are NOT_EVALUATED. H001 acceptance is FAIL even though execution reports SUCCEEDED and the limited no-result scope is consistent.

The current patch changed Tabelog keyword construction from HARD-criterion-first to retrievalHint-first. Raw trace sequence 2 passes `omakase near Shibuya, party of 2, 2026-10-04 19:00` into `sw`. Region navigation keeps the same long keyword; a later fragment-only navigation repeats the same page with identical text and HTML hashes. No detail entrance is found. This is not a model/API failure or an availability failure.

Before changing code, one no-model, read-only diagnostic compared both expressions on the same observed Shibuya City source page and session, in 10,019ms of a declared 30-second budget. The long expression produces the visible message `No restaurants match` and zero parsed outlets; `omakase` produces five visible outlets, including Sushi Teppen. Raw public text and source hashes are preserved in `.eval-artifacts/h001-unified-review-20261003/tabelog-query-pair.live-read-only.json`. This supports the source-query regression for this request without asserting current seating or generic restaurant coverage. The repair must restore source-appropriate keyword construction, preserve booking parameters separately and avoid a store-specific exception. TableCheck's observed NLU query remains a separate source contract.

TableCheck's first five and next three saved entrances were all actually visited. All eight were recorded OUTSIDE_EXACT_RADIUS; the second chunk used zero listing reads and no timeout. Its source elapsed was 24,635ms. This closes the particular queue/reload failure seen on October 1, but eight outside-radius results do not prove there is no nearby restaurant. The immutable Live trace omits full detail JSON-LD, so the precise eight distances cannot be independently recomputed from this artifact.

Compared with October 1, TableCheck detail attempts rose from five to eight and the pending continuation completed; overall progress fell from one admitted Teppen availability read to zero admitted candidates. Neither run presented a result. Changed date/site state prevents a strict performance A/B. A faster safe stop is not an improvement in qualified delivery.

## Post-Live repair review

Terra restored the Tabelog keyword channel's positive HARD search term before the free-form hint and skipped fragment-only region navigation. TableCheck retains its separately observed natural-language query contract. Independent memory replay with a SOFT criterion before the HARD criterion and a long hint still sends `omakase` on both Tabelog region URLs; a fragment-only region has no second navigation. Request date, party, time, radius and HARD acceptance remain unchanged.

The controlled source now derives the expected current query from its public search URL, stores the actual filled value and reveals the result only after an exact current-query submission. The result retains its live input value. Independent full-phrase controls show a wrong Ginza phrase cannot reveal the same result; the correct Shibuya phrase can be submitted and read back. The production NativeSearch→Executor→fixture composition also preserves the complete phrase across URL, goal, fill and ready readback. These checks avoid a literal `omakase` fixture exception and do not synthesize evidence from Domain claims.

Affected native composition 25/25, typecheck, architecture check, build and diff checks passed. No unrelated full-suite rerun was added. Frozen post-repair code is recorded in `.eval-artifacts/h001-unified-review-20261003/post-live-repair-frozen-source.manifest.json`, code-tree hash `ca514ad98bbeb2ca2723825c40cc08e54342b54f2bfa70f6cef6ca6fdd30f17a`.

The corrected fixture was then tested in three fresh runs of the same real-model scenario: f810cfe0… (13,687ms/10 calls), e5a7d830… (12,967ms/10 calls), and 7299f4f3… (13,299ms/10 calls). All actually presented one qualified result and all six mandatory dimensions were SATISFIED. Root checked the raw source URL, actual fill argument, post-fill input readback and ready-page readback: the complete current phrase matches in every run. `.eval-artifacts/h001-unified-review-20261003/post-repair-fixed-three-run-summary.json` preserves those values and all execution/evaluation/acceptance paths. These three corrected-fixture results replace the first batch only for current retrieval-readback acceptance; originals remain immutable. Real source search semantics and seating remain separate Live requirements.

## Second post-review Live: farther execution, failed delivery acceptance

The corrected source/query gate was followed by one fresh complete H001 tomorrow variant. Immutable execution: `.eval-artifacts/restaurant-hybrid-live-read/2026-10-03T07-15-02-494Z-61053f42-5ba3-412f-94da-6aecbee10476.result.json`; independent evaluation: `.result.evaluation.24-1791011933633.json`. The request remains 2026-10-04, two people, 19:00, within the unchanged 1,000m location check and HARD omakase requirement. Semantic, canonical H001 and Gold were not edited.

| Observable | October 1 historical Live | October 3 corrected Live |
| --- | --- | --- |
| Admitted candidates / stock checks | 1 / 1 | 5 / 5 |
| TableCheck detail visits | 5, then pending continuation timed out rereading the list | 8, with saved continuation and zero second-chunk list reads |
| Elapsed / total model calls | 143,778ms / 13 | 231,118ms / 38 |
| Actually presented qualified results | 0 | 0 |

Different request dates and current website state make this a comparison of reached stages, not a controlled performance A/B. The corrected Live remained within 300,000ms and 50 model calls, used one Google named-place lookup and no Google restaurant discovery, and recorded 109 browser runtime calls. All five candidates received availability and fact investigation. Rejected repeated CHECK proposals did not execute a second stock read. This establishes farther actual execution and completion of the particular saved-entrance continuation; it does not establish successful delivery or exhaustive restaurant discovery.

Evaluator@24 reports AUTHORITATIVE_CONDITIONS, INVESTIGATION_BEHAVIOR and RESOURCES SATISFIED. REQUIRED_EVIDENCE, FINAL_CLAIM and COMPLETION_OUTCOME are NOT_EVALUATED because no supported result reached presentation. The manual predeclared H001 acceptance is **FAIL**, recorded with source/evaluator hashes in `.eval-artifacts/h001-unified-review-20261003/post-repair-live.acceptance.json`. Execution SUCCEEDED / NO_VERIFIED_RESULT cannot replace delivery acceptance.

### Independently located remaining causes

| Candidate | Actual observed cause / evidence limit |
| --- | --- |
| Sushi Teppen | The requested October 4 control was not confirmed; the observed options started at October 5. This does not prove October 4 is closed or sold out. |
| The Bellwood | Date, two guests and 19:00 were selected, but the same-shop response said `require_service_category`. Two service-category radio controls remained unselected; the executor lacks an authorized category-selection action. This is a control capability gap, not empty inventory. |
| Ajuuta | Controls marked October 4 disabled and retained October 3. The sanitized markup does not independently settle whether this is a genuine source restriction or an observation error. |
| Sushi and Wine Omotesandoria | Actual selected date/party/19:00 and enabled same-shop booking links were present, but the parser omitted the public `/<slug>/reserve/landing` path. Its HARD omakase fact was also not established, so stock recognition alone would not qualify it. |
| GENTLE | Date/party/19:00 were selected, but the 30-second provider deadline expired during the second model decision. Three control observations consumed about 19.7 seconds. This remains UNKNOWN, not no availability; HARD omakase evidence was absent. |

## Observed reservation-path repair and original-source replay

The `/shops/` requirement existed at baseline 47f0d5a. This was an old format-coverage omission exposed by a new real source shape, not a new restaurant whitelist or a changed identity threshold. Terra extended only the existing same-outlet reservation matcher to accept `/en|ja/[shops/]<same-slug>/reserve[/landing]`. Cross-outlet, wrong request, disabled, hidden and loading-result restrictions remain in force. Existing Adapter coverage passed 54/54, with typecheck, architecture, build and diff gates.

The first reproduction reconstructed the saved control/link fields. Root subsequently found the original full HTML in the historical trace's sequence 131 `waitForChange` argument, and verified its SHA equals Snapshot 129's recorded hash. Replay of that exact page through the final parser returns nine slots including 19:00 and `queryComplete=true`. Separate synthetic mutations replacing all relevant links with a foreign outlet, wrong date or wrong party each return zero slots and incomplete query. Evidence: `.eval-artifacts/h001-unified-review-20261003/omotesandoria-original-html-replay.result.json`. These are original-source offline compatibility plus labelled synthetic negative variants, not a new current stock or qualified H001 claim.

That historical full-HTML argument also exposed an audit-boundary omission: hybrid/native/current-development trace callbacks did not apply the existing `safeRecord` serializer. Terra corrected those callbacks and hashes nested `html` and `text`; the existing snapshot collector still retains allowlisted booking source/date/party/time, hidden/disabled structure and control readback for independent evaluation. Collector/current-development/raw-evaluation/acceptance regression passed 98/98; typecheck and diff passed after the import fix. Original artifacts remain immutable and are not relabelled as fully redacted. These ignored diagnostic artifacts are not committed.

## Targeted stock-only Live and DOM observation diagnosis

The one targeted production Adapter probe reused the actually discovered Omotesandoria candidate for October 4, two guests and 19:00. It predeclared 45 seconds overall, 30 seconds per provider, five model calls and 24 browser operations, with no Semantic, Google, fact qualification, presentation or booking write. Full H001 evaluation is outside this stock-only slice; acceptance requires independent current same-outlet request/slot evidence.

Artifact `.eval-artifacts/h001-unified-review-20261003/stock-only-live/2026-10-03T07-36-51-072Z-045fb39b-f0f6-4764-8785-f301ef8f32f9.result.json` stopped UNKNOWN / BROWSER_RUNTIME_FAILED in 8,432ms, zero model calls and five operations, after HIGH identity. Its raw CONTROLS_ERROR identifies `elementHandle.isDisabled: Element is not attached to the DOM` for an unrelated Login link replaced during page hydration. A vanished handle must not kill the whole control observation or be treated as enabled. This concrete failure was returned to Terra in the existing generic observation slice, with the same bounded stock probe as its final real-source check.

### Final generic observation and response-lifecycle review

The first repair was returned because deleting an earlier control still shifted the live `nth(index)` traversal and could skip an attached successor or wait for a missing last index. The final registry obtains the group's current ElementHandles in one Playwright call before reading them. Per-handle read errors discard a node only after the page positively confirms `isConnected=false`; an attached read error still propagates. Existing action-time signature, visibility and disabled revalidation remain unchanged. Real local Chromium controls verify that a removed first element does not lose the later enabled/disabled controls, and a genuinely attached `isDisabled` failure is not swallowed. This is a generic DOM observation correction, with no site/store exception or retry loop.

The full browser fixture then exposed two existing Local/Cloudflare passive-response lifecycle regressions. This packet had removed four navigation-time response resets; that allowed previous-page stock to cross navigation. Restoring reset before ordinary and covered-link navigation preserves installed capture rules/listeners, clears prior records and rejects late responses from the previous generation while accepting the destination's initial GET. The existing tests directly cover this behavior; the earlier reported all-green fixture gate lacked matching-code provenance and is superseded, rather than assigned an invented run chronology. The definitive sequence is 62/64 failing, the focused four affected controls passing, then full host-local Chromium fixture 64/64 passing. Typecheck, architecture, build and diff gates also passed. Independent read-only review accepted the final code and fixture packet.

Final executable freeze: `.eval-artifacts/h001-unified-review-20261003/post-dom-fix-frozen-source.manifest.json`, 222 files, code-tree SHA-256 `2efb2b612165abb272d2896840ef521b74ad3cd8d2f8a26d7ac3986380155551`. This records the uncommitted reviewed source, not a released or Clean Holdout baseline.

### Final current-source stock result

One repeat of the same declared stock-only probe on that freeze returned **AVAILABLE / one 19:00 Offer**, HIGH same-outlet identity, in **15,975ms, one model call and eleven browser operations**. Artifact: `.eval-artifacts/h001-unified-review-20261003/stock-only-live/2026-10-03T07-49-57-132Z-341dabbc-3f1a-453d-a6d5-d16c006fef3e.result.json`. It stayed within the unchanged 45-second/five-call slice budget and performed no booking write.

The trace starts with October 3 selected and its no-table message. Model action sequence 41 selects the independently observed October 4 control; final Snapshot 49 then carries an enabled `/en/omotesandoria/reserve/landing` link whose allowlisted fields bind 2026-10-04, two people and 19:00. Controls 53 retain the actual selected date, guest count, time and visible enabled slot. Acceptance is based on those current raw records, not merely the Adapter's AVAILABLE label. Full H001 evaluation is inapplicable to this standalone stock slice because it omits fact qualification and Runtime presentation.

Root and the independent raw-evidence reviewer both accepted this declared stock slice. Immutable acceptance sidecar: `.eval-artifacts/h001-unified-review-20261003/stock-only-live/2026-10-03T07-49-57-132Z-341dabbc-3f1a-453d-a6d5-d16c006fef3e.result.acceptance.json`. Same outlet, actual request selection, current enabled result, chronology, read-only actions and resources each have direct evidence; HARD omakase remains NOT_ASSESSED and complete H001 acceptance remains FAIL.

## Final disposition and next concrete gap

Terra implemented the changes; root and the independent reviewers returned incomplete packets until the declared affected behavior passed. The corrected fixed-source real-model gate is 3/3 with actual qualified presentation; the current single-store stock path is separately verified. **The complete H001 Live remains FAIL**, with its immutable execution/evaluation/manual-acceptance artifacts unchanged. The stock-positive Omotesandoria result does not establish its HARD omakase suitability or retrospectively change the failed full run.

The next execution gap is the observed service-category prerequisite, alongside remaining date observation/restriction and costly control reads under the existing provider budget. It requires source-observed meaning, permitted read-only selection and current-result readback; selecting an arbitrary category, increasing the budget or relaxing HARD/identity standards would not close H001. No whole-task rerun was added after the stock-only repair.
