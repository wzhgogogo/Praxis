# Tabelog observable location suggestions — offline candidate

Status: exposed development / constructed fixture, draft / not integrated. New branch `codex/feat-phase3b-tabelog-location-suggestions`, originally based on main be84674e, synchronized to B-approved main de2b7ecc before final verification. No dependency on the unmerged D8 predicate repair. CET UTC+1 throughout. External model/Google/website/Live0; no .env loaded/read.

## Slice and current result

When the current directory has no observed entrance naming the explicit user location, ordinary native discovery can follow a currently observed source search-home link and use its public location suggestions. The D4 frozen menu has31 region entries and no Akabane, but3 public links to the same English search-home destination; those are deduplicated by their actually observed URL. The new path reaches5 in-radius constructed outlets via the Tokyo station; it does not claim new real availability, new Live delivery, or correction of Google's saved empty response.

## Rules and implementation

- `source-packs.ts`: one optional source-owned home-entrance grammar; Tabelog accepts only the public `/en/` home. Navigation always uses a URL read from current visible controls, never a constructed station or search URL. Other Packs unchanged.
- `location-suggestions.ts`: exact normalized full place-name matching, with explicit station suffix normalization (Sta./Station/駅), accessible Locations/Stations/Areas group or explicit public place label. Restaurant group/prefix is excluded. Bracket qualifiers must exactly occur in the existing authoritative location address components; unknown/foreign qualifiers remain unmatched. A name containing the requested word plus other words is not the same place. Class/testid/position/icon-font conventions supply no meaning. If an icon is not exposed with an accessible place name/group or explicit station label, it stays unknown and falls back.
- `browser-task-executor.ts`: internal deterministic shortcut, not a model action. Requires the existing installed Guard and exactly one current visible location input. Fills the literal user place text after removing only existing area-relation words; reobserves current controls after fill, waits within the existing bounded settlement once more if no matching choice. Exactly one place match is required, never first-of-many. A link must carry a currently observed safe source region/station href; a nonnative option must belong to the same observed location combobox and be non-submitting. After option click, the full displayed selection must be positively reobserved before one current same-group GET Search button can submit. An unconfirmed choice is no result.
- `native-restaurant-search.ts`: only the DIRECTORY missing-location branch uses this opportunity, after preserving the original nearby-source-outlet pointer and exact sublocality district/menu-group routes. No matching/ambiguous/unsupported result returns to the earlier observed menu URL and the original model/region path. Each home/result/fallback page spends the same region/listing budget. At least2 remaining region/listing admissions are required before trying the home; no ceilings reset or increase. Fallback may exhaust the remaining old path budget, and is honestly UNKNOWN. Coordinates and the original1000m radius still decide each detail admission, regardless of the selected suggestion name.
- Every snapshot, observation, fill, wait, option click, public GET submit or navigation uses existing Executor admission; parent cancellation/20-second reserve signals and operation caps remain active. No new model calls, retries or quota channel. Browser model schema/context/prompt, Restaurant State@25/TaskDefinition@23, identity, Guard policies, response binding and B's main90s candidate budget are unchanged.

## Frozen inputs and effective red

`input-provenance.json` records the exact prior D4 initial HTML SHA and31-link/goal/old-action projection from aba06e16. It is exposed saved evidence; homepage DOM and restaurant pages are explicitly constructed from the user's manual observation, not recaptured real pages. Real local Chromium uses a fixed HAR under the production Guard; missing HAR entries abort locally. Model output and Google are fixed I/O only.

`red-final.log/json`: same frozen completed fixtures in an isolated archive with exactly the3 old main product files (Executor, Native search, Pack) restored. It actually executes the old Itabashi link, applies the existing keyword, reads2 out-of-radius details and returns0, without fill or home visit. All6 expected new-path assertions fail. The temporary archive is removed and the workspace source never swapped.

Earlier `red.log`, `red-complete.log`, `red-business.log`, `red-valid.log` are retained setup/incomplete evidence, NOT effective red: initially the HAR missed the unfiltered source URL; the model substitute finishReason did not match TOOL_CALLS; the isolated archive initially omitted web-skills. These were corrected in frozen inputs/dependencies. The effective red is only red-final and its independent actual-action audit. Early unit admission preflight also lacked the native INPUT tag in the fake DOM, corrected before formal gates; no product admission was relaxed.

## Normal composition and safety controls

The new tests start at createLiveReadAssembly.search, with real native search, source parsing, detail grounding, ordinary control registry and Guard; only model/Google and source HAR I/O are substituted. They are a source-discovery composition, not a full user-turn booking completion or new model test.

| Constructed case | Expected |
|---|---|
| LINK: Tokyo Akabane station link alongside merchant/foreign entries |5 same-region in-radius candidates; zero browser-model calls |
| OPTION: current same-owner station option and positively reobserved full value |5 in-radius candidates; observed GET Search only |
| NONE |no suggestion selection; original observed menu route actually executes |
| AMBIGUOUS: two matching Tokyo place suggestions |no suggestion selection; original menu route |
| MERCHANT_ONLY: same-word and station-word restaurant suggestions |no merchant detail opened; original menu route |
| OUTSIDE: exact station name but actual detail coordinates outside radius |0 candidates; name does not override geography |
| NO_GUARD |no fill/wait/selection |
| RESERVE_AFTER_FILL |existing DELIVERY_RESERVE_REACHED signal prevents the next read/wait/click |
| OPERATION_CAP |same exhausted operation budget prevents fill/selection |

In the no-match controls the bounded home attempt spends2 extra region admissions; returning to the original Itabashi route consumes the4th and ends as READ_BUDGET_EXCEEDED, not source exhaustion or a pass for finding a restaurant. This is deliberate budget preservation, not a retried source or an increased allowance. Existing Kagurazaka/Nakameguro/other-region controls remain in the default suite. The A G6 tests and transitive helpers are byte-for-byte92bc1032 originals (manifests attached), including12 immutable historical exposed inputs; original historical S0 scores are not rewritten.

## Final verification

First formal candidate ae5b8b75 passed type/arch/default1431/build but ordinary Chromium was188/189: the new home path preempted a saved Kagurazaka known-feasible route. A fixture/expectations were not changed. The first priority correction preserved source-outlet-supported menus; a focused preflight then exposed Higashi-Ginza, whose authoritative district Ginza already literally appears in a visible menu group. Exact sublocality-level1/2 versus visible menu-group equality now also preserves that original route, without hardcoded place mapping or similarity. The original A six-region test passes unchanged (other-regions-green.log). First gate outputs/SHAs are preserved byte-for-byte in attempt-1; fresh second clean-tree five gates + strictG2 including full A66 are pending. Source/input freeze and per-step receipts will be attached. Independent audit will inspect raw HAR-derived actions, literal expected case results, old-source deviation, source/Guard/version diffs, original A bytes and immutable shared-ledger union. No claim that local fixtures establish current-site DOM compatibility or current-site latency.

## Four evaluation layers

1. Outcome: local source discovery for LINK/OPTION reaches5 in-radius candidates; unsafe/unknown cases deliver no new candidate. No new full booking/Live score.
2. Per-stage: D4 old missing menu remains literal evidence; observed home → literal fill → unique same-area station → source list → coordinate gate is the new controlled path. Fallback and reserve/admission outcomes are separately exposed.
3. Severity: local fixture safety assertions require no merchant/foreign selection or unsupported in-radius admission; original G6 S0 history remains unchanged. No new real S0 denominator.
4. Attribution: old menu-model misrouting reproduced; new shortcut validated on constructed DOM. Actual site's inaccessible icon semantics, changed widget structure, different destination grammar or autocomplete request admission remain unmeasured. Guard rules are not expanded based on a guessed endpoint. Missing semantics falls back rather than guessing.

Shared budget unions main/A/prior C rows by id and appends this slice's zero-call row; ceilings unchanged. Work branch only, stop for review, do not merge main. Final pushed SHA and ls-remote result appear in the delivery message.
