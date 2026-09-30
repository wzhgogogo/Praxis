# H001 native downstream independent review — 2026-09-29

- Status: In progress; not accepted for Live
- Evidence status: exposed development evidence, not a clean baseline
- Scope: `docs/H001-NATIVE-DOWNSTREAM-PLAYBOOK.md`
- Baseline: `/private/tmp/praxis-h001-native-downstream-start-20260929/`

## First review

The reviewer independently ran the existing native composition and outlet-continuity tests: 12/12 passed. This proves those cases only. Two counterexamples remain and were returned to the implementation chat before any new paid-model or Live run.

1. **Premature second-source completion.** `assessRestaurantRead` blocks early completion at `TABELOG_DONE`, but not after `TABLECHECK_DONE` discovery when admitted candidates still require investigation. A diagnostic state derived from `TABLECHECK_CONTINUES.execution.json`, with fact/availability checks removed, returned `canEndRead: true` while four candidates remained fact-investigable. The short-delivery helper also returns true solely on the second-source discovery cursor when its open-ended preconditions hold. Verify through an existing actual-composition adversarial action, preserving cancellation and resource termination.
2. **Challenge accepted as native facts identity.** At `https://www.tablecheck.com/en/example-shop`, a snapshot with title `Just a moment`, text `Verify you are human`, and `<h1>Verify you are human</h1>` is recognized by the existing TableCheck challenge detector. Nevertheless, the identity parser produces a DOM-owned name and shared continuity returns `SAME_SOURCE_OUTLET`. The native facts caller currently omits the challenge detector before issuing HIGH identity evidence and calling fact judgment. Reuse the existing source challenge/unavailable checks and verify no identity evidence or judgment invocation on this input.

Implementation acknowledged the premature completion finding and is repairing it. These counterexamples are offline diagnostic inputs, not observations that the latest real source served these pages. Existing successful offline artifacts are retained; they do not close these findings. No new Live was released at this review checkpoint.

## Targeted re-review

The reviewer independently reran the existing composition and continuity test files after the fixes: **14/14 passed**. The actual composition now rejects an early `END_READ` and short `PRESENT_RESULTS` after TableCheck discovery, then investigates and presents two qualified candidates. Native fact reads reject both providers' challenge/error pages with zero fact-judgment calls and no identity evidence. Both sources reuse the same applicable-investigation check; full target delivery is unchanged.

The source path normalization also retains the outlet's area path while allowing locale changes. An unnecessary new Tokyo-only restriction was returned for removal: geography belongs to the existing location check. Final handoff and applicable verification remain pending. No paid model or Live has been released by this re-review checkpoint.

## Fixed-source model release

The final correction removes the extra Tokyo-only check. The reviewer checked the replacement `review-final` execution artifacts: `TABLECHECK_CONTINUES` investigates both sources and presents the second TableCheck candidate; `TABLECHECK_EARLY_ACTIONS` records both rejected actions followed by completed reads and actual presentation; `NATIVE_PARTIAL` presents one Tabelog candidate without a second-source search. These artifacts explicitly preserve `OPEN_ENDED`; the earlier set that omitted it is superseded.

With the existing runner and artifact history checked for duplicates, the implementation chat is released to run **once**: `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 npm run eval:restaurant:agent-loop:native-fixed-source-model -- --case h001 --scenario TABLECHECK_CONTINUES --max-model-calls 50 --max-steps 30 --timeout-ms 300000`. No automatic retry. This validates model continuation and short delivery with fixed sources. New Live remains pending independent inspection of its result.

## Real-model acceptance and Live release

Independently inspected fixed-source run `67ccfb8f-0561-4012-bcc8-8ced17df7fec` and its evaluator sidecar: **passed**, 16,448 ms / 13 model calls. H001 retained OPEN_ENDED, 2 people, 19:00, Shibuya and HARD omakase. Tabelog yielded UNAVAILABLE + UNKNOWN; TableCheck then investigated its own two candidates, yielding UNAVAILABLE + AVAILABLE. The actual final action presented only `tablecheck:native-omakase-2`, with default target 3 and `met:false`. Evaluator reports qualified result YES and no duplicate investigation. This is fixed-source evidence, not real inventory or browser-control evidence.

After checking the Live artifact directory (latest completed run still the prior 04:49 UTC run), released exactly one new H001 native Live under 300,000 ms / 50 model calls and existing 30-step/per-candidate/provider limits. Default network, normal current-date materialization, unchanged H001 inputs, read-only; no automatic retry. Live outcome remains pending.

## Live result — not accepted as H001 success

Independently inspected run `1f8a9087-b998-46ef-b543-7e58d35dde79`: CANCELLED at 300,019 ms, 27 model calls, 26 Google named-place requests, zero restaurant discovery/details and zero browser operations. The 25 completed trajectories all record `SEARCH_RESTAURANTS` → `DISCOVERY_FAILED` / `GOOGLE_NETWORK_FAILED`; the last request was cancelled. Neither native source, facts, inventory nor presentation was reached. Real source behavior remains **uncovered**, not failed inventory or proven repaired controls.

There are two separate findings: the external Google named-place request failed; the orchestration repeatedly attempted the unchanged failed discovery until deadline. The network's lower-level cause is not established by this artifact. Evaluator RESOURCES is NOT_SATISFIED specifically because elapsed time exceeds the declared cap by 19 ms; its finding must not be described as automatically detecting the repeated-action loop. The loop is evidenced directly by trajectories.

The implementation chat is continuing offline diagnosis of the failure-state/continuation wiring using the existing composition. No extra Live, paid model, network investigation or geography change is authorized by this continuation. The one released Live is consumed. Overall Playbook and real H001 acceptance remain open.

## User-authorized Google proxy rerun

The user subsequently instructed the implementation chat to use port 10808 only for Google API traffic, then explicitly requested one full Live rerun. The reviewer read both original user messages. Google-specific ProxyAgent wiring leaves browser and DeepSeek networking unchanged. The reviewer independently ran the added actual-composition network-failure test: one failed search now stops before another model decision, rather than repeating until deadline.

Independently inspected the newly authorized run `3f58236a-e190-4d52-a043-6400c3aa049c`: **69,930 ms / 8 model calls**, one successful Google named-place request. Tabelog admitted Teppen (~749 m); native continuity and HARD omakase fact evidence succeeded. Availability remained UNKNOWN (`REQUEST_SELECTION_UNCONFIRMED`): the browser model requested help because it observed no Date/Guests control; no model browser action executed. TableCheck then read one search page, recorded 21 raw links / 5 parsed outlets, and rejected all five on the existing location rule. Source exhaustion remained UNKNOWN. Final `NO_VERIFIED_RESULT` is a bounded completion, **not H001 qualified success** and not proof of no inventory.

This is progress beyond the earlier native identity/facts block. Exact availability remains unverified, and TableCheck availability was not reached. The latest one-run authorization is consumed. Per Playbook section 9, the implementation chat continues offline diagnosis of this control-entry failure using existing evidence. The 40 targets in diagnostics are a truncated log excerpt, not proof of the full model observation. Any missing original DOM must be reported rather than replaced with an invented source replay. Also review the final missing-identity wording, which does not clearly distinguish already confirmed native identity from absent accepted availability evidence.

## Offline diagnosis boundary

The implementation completed the available offline diagnosis. The original run retained neither raw DOM nor the complete control observation; diagnostic targets are capped at 40 and text at 1,000 characters, whereas the model receives more. The model's help request therefore cannot establish whether the real page lacked a booking entry, the entry remained unopened, or observation omitted controls. A truthful source replay/control repair is blocked on that missing evidence.

Reviewed the separate missing-evidence wording correction and independently reran the existing presentation fail-closed test (passed): absent fresh request-bound availability is reported before checking its provider-specific HIGH identity linkage; the identity gate remains enforced when availability exists. Historical Live artifacts are unchanged.

No further full Live is authorized at this checkpoint. Proposed next step for user approval: one targeted read-only Teppen detail/booking-entry capture, bounded to two minutes and at most opening its existing reservation widget; retain sanitized DOM and complete control observation, no model calls, no reservation submission, no H001 rerun. This capture would create new source evidence, not retroactively reconstruct the previous page. Playbook remains incomplete and real exact availability remains unverified.
