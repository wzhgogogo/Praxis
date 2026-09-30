# H001 native downstream offline closure and Live review handoff — 2026-09-29

- Status: current exposed-development offline integration; awaiting independent diff/artifact review before the newly authorized Live.
- Scope: frozen H001 semantic input, Tokyo 19:00 / 2 people / near Shibuya / omakase HARD. No H002–H005 change, no new Google restaurant matching, no new radius rule, no booking write.
- Starting dirty worktree preserved. The before-slice diff/status/hash record is `/private/tmp/praxis-h001-native-downstream-start-20260929/`; this slice has not been committed or pushed.

## Slice and actual behavior

The prior H001 Live admitted one Tabelog outlet but both same-source fact and availability reads stopped at legacy identity matching; TableCheck admitted zero without a raw/parse/admission funnel. The repair carries a native `provider/sourceEntityId/sourceUrl` reference into each read and confirms the observed detail remains the same source outlet. Tabelog locale variants and TableCheck language paths can retain the same stable ID. Wrong ID, changed full outlet path or page URL/canonical, unavailable page, challenge and missing page-owned identity remain fail closed. The initial offline draft accidentally accepted a same-URL challenge page as page-owned identity; independent review caught it, and the fixed fact read makes zero judgment calls and produces no HIGH evidence for that challenge or an explicit error page. The cross-source matcher remains for Google-origin candidates. A confirmed native detail enters the existing request-bound availability tail without reopening a whole-site name search. A candidate's recorded address spelling or absent phone cannot by itself reject its own source detail.

Each source discovery call investigates the observed bounded search batch, including later outlet links after an earlier detail error, then records raw links, parsed/new links, per-outlet rejection reasons, accepted count, listing pages, batch ceiling and whether actual site exhaustion was observed. The durable two-source cursor's `exhausted=false` after Tabelog means TableCheck remains available; it does not mean that the Tabelog search page itself will be paginated. TableCheck `raw>0/parsed=0` now remains visible with `TABLECHECK_DISCOVERY_INCOMPLETE` and `SOURCE_FAILURE`. These diagnostics cannot retroactively explain the previous Live's zero candidates because that run did not save its source page.

For default open-ended native reads, after every observed candidate in the current bounded source batch receives its applicable fact/availability investigation, one or two currently qualified results may be presented with target `met:false`. If Tabelog has none, the existing Router starts TableCheck; `TABLECHECK_DONE` discovery alone cannot allow END_READ or short presentation while its candidates still require facts/availability. After both batches are investigated, no qualified result ends with scoped `NO_VERIFIED_RESULT`. Explicit user counts retain the normal gate. [ADR-0033](../decisions/0033-native-source-batch-delivery.md) records this narrow change to ADR-0028/0031 rather than rewriting their history.

## Offline execution and independent evaluation

The [12 execution/evaluation pairs](../../.eval-artifacts/h001-native-downstream-20260929-review-final/) start from the frozen H001 raw request and retain production Interpreter, Compiler, Router, Runtime, Agent, source search, fact judgment, evidence admission and presentation. Only model transport, Google response and public pages are fixed offline. The scripted model chose actions from actual Agent context; the adversarial scenario deliberately proposes two illegal actions and observes Domain rejection. It did not insert a final State or evidence. Its semantic proposal now explicitly preserves frozen H001 `selectionScope=OPEN_ENDED`; earlier 11-pair offline artifacts omitted that field and are superseded development diagnostics. Each scenario used one fixed Google named-place resolution and zero Google restaurant discovery/detail calls. Execution artifact and independent Eval are separate files.

| Scenario | Actual outcome | Independent qualified result |
|---|---|---|
| `TABELOG_CONTINUES` | Tabelog A unavailable, B unknown, C available; present C, zero TableCheck navigation | YES |
| `TABLECHECK_CONTINUES` | Tabelog batch not deliverable; TableCheck A unavailable, B available; present B | YES |
| `NATIVE_PARTIAL` | Tabelog two candidates, one qualified; present one with default target unmet | YES |
| `NATIVE_TRUE_NO_RESULT` | Both sources admitted and investigated candidates; no qualified result | NO |
| `TABLECHECK_EARLY_ACTIONS` | Early END_READ after second-source discovery and early short PRESENT_RESULTS with another TableCheck candidate pending are both rejected; after investigation two results are presented | YES |
| `TABLECHECK_UNPARSED` | Tabelog empty; TableCheck one raw link, zero parsed, explicit incomplete failure | NO |
| Existing six stage-2 controls | Three supported presentations; empty/outside-radius/early-end controls do not invent a result | 3 YES / 3 NO |

The evaluator's `NO` on a no-result path is a user-goal outcome, not evidence that the full website was exhausted. Current real source coverage, page controls, omakase evidence and inventory remain unverified after this repair.

## Verification and stop point

- `npm run typecheck`, `npm run arch:check`, `npm run build`, `git diff --check`: pass.
- `npm test`: 556/556 pass when local HTTP Fixture binding is permitted; ordinary sandbox first produced only `listen EPERM: 127.0.0.1`. Final log: `/private/tmp/praxis-h001-native-downstream-review-final-npm-test-20260929.log`.
- `npm run test:browser:fixture`: 44/44 actual local Chromium Fixture tests pass, including Tabelog date/party and TableCheck request-bound controls. Log: `/private/tmp/praxis-h001-native-browser-fixture-20260929.log`.
- Two native availability adapter suites: 72/72 pass, including same-source identity diagnostics, changed-address positive controls and wrong-outlet negatives. Log: `/private/tmp/praxis-h001-native-downstream-review-adapters-20260929.log`.
- Fixed source composition: 12/12 pass. Log: `/private/tmp/praxis-h001-native-downstream-review-final-composition-20260929.log`.

No paid model or new Live call was made in this downstream slice. The user has authorized Live, but the prior handoff requires independent review of this diff and the saved offline artifacts first. Proposed one-run command after release, with existing `.env` credentials, temporary local Chromium profile and default network:

Independent review additionally requested one fixed-source real-model decision run for the newly changed behavior. The existing runner now accepts its already defined `TABLECHECK_CONTINUES` source scenario. This is a separate, still-unrun gate; use it only after the reviewer releases the offline correction:

```bash
PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 npm run eval:restaurant:agent-loop:native-fixed-source-model -- --case h001 --scenario TABLECHECK_CONTINUES --max-model-calls 50 --max-steps 30 --timeout-ms 300000
```

The fixed source has Tabelog candidates without a qualified result, then TableCheck A unavailable and B available; a correct model continuation should investigate B and deliver its single supported result with the default three-result target unmet. It uses fixed pages and a real DeepSeek model, so success would still not prove real source coverage, controls or stock. The user-approved Live remains behind the independent review and this fixed-source result.

### One released fixed-source real-model run

The reviewer released exactly one `TABLECHECK_CONTINUES` invocation. It completed in 16,461 ms from runner start with 13 total DeepSeek calls, 8 Agent decisions, 0 browser model actions, and 7 Agent steps; the ceilings were 300,000 ms / 50 calls / 30 steps. One fixed Google Shibuya named-place response was used; Google restaurant discovery/details were zero. The model preserved frozen H001 `OPEN_ENDED`, omakase HARD, 19:00 / 2 people, and the fixed reference date. Tabelog A was `UNAVAILABLE`, B `UNKNOWN`; the Agent then searched TableCheck. TableCheck A was `UNAVAILABLE`, B `AVAILABLE`, and the Agent presented B. The durable default result target is `candidateCount=3, met=false`. The independently generated Eval sidecar reports qualified `YES` and six `SATISFIED` dimensions for this fixed-source run. [Execution artifact](../../.eval-artifacts/h001-native-fixed-source-model/2026-09-29T08-07-48-555Z-67ccfb8f-0561-4012-bcc8-8ced17df7fec.result.json) and [evaluation sidecar](../../.eval-artifacts/h001-native-fixed-source-model/2026-09-29T08-07-48-555Z-67ccfb8f-0561-4012-bcc8-8ced17df7fec.result.evaluation.21-1790669285014.json) are separate. Command log: `/private/tmp/praxis-h001-native-tablecheck-continues-model-20260929.log`. No model rerun followed. This is exposed development evidence with fixed pages, not a real website read or inventory claim; the main review still controls Live release.

```bash
PRAXIS_ALLOW_LIVE_RESTAURANT_READ=1 PRAXIS_ALLOW_BROWSER_RUN=1 PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM npm run eval:restaurant:agent-loop:hybrid-live-read -- --case h001 --native-discovery --timeout-ms 300000 --max-model-calls 50
```

The Runner fixes 30 Agent steps and records a STARTED artifact before the first model call. The 300-second clock starts before semantic interpretation and named-place resolution. This command uses the frozen H001 and Tabelog→TableCheck order, no evaluation coordinate override, no booking submission and no manual challenge intervention. On completion it writes immutable execution and independent evaluation sidecars. One invocation is the stop point; a controls/extraction failure will be diagnosed from that artifact before any further Live retry.

## Independent review correction

The [review record](H001-NATIVE-DOWNSTREAM-INDEPENDENT-REVIEW-2026-09-29.md) reproduced two old failures before accepting this correction. At `TABLECHECK_DONE` with admitted candidates but missing facts/availability, the old assessment permitted END_READ; the new shared per-source investigation gate blocks END_READ and default short presentation until every candidate's applicable reads finish. The integrated `TABLECHECK_EARLY_ACTIONS` run intentionally proposes both actions early: both are rejected, then the same Router/Runtime/Agent chain presents two qualified TableCheck outlets. The old continuity check accepted a same-URL TableCheck challenge title as HIGH; the new adapter/fact negative control reports `BOT_CHALLENGE`, produces no identity evidence and makes zero fact-judgment calls. An explicit error document is also rejected. Tabelog identity now compares the full area/outlet path after stripping only language and trailing slash; the locale control still passes, and a repeated numeric suffix under another area path fails.

The initial 11-pair offline set and its tests lacked `selectionScope=OPEN_ENDED` in their scripted semantic proposal. That set remains as exposed development history only. The current 12-pair set explicitly preserves the frozen selection scope and contains the review counterexample. Actual source uncertainty and Live acceptance remain open.
