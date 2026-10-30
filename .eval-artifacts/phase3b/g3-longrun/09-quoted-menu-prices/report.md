# G3c quoted menus/prices — draft, stopped at HARD price scope

2026-10-29T09:52:53.665907+01:00, Vienna CET (UTC+1). **DRAFT / NOT INTEGRATED; STOPPED_S0_CLASS_HARD_PRICE_SCOPE**. Not a completed G3c or five-green-gate delivery. [Stop and independent counterexample](../10-hard-price-scope-stop/report.md).

## Implemented on the work branch

Both actual availability adapters can read current identity-bound source statements with the generic source model. G1 and source selection share the same outlet/run/URL/read-time predicate, segmentation limits and public-heading review rejection. A standalone `restaurant_source_facts` Prompt/Schema **1** selects contiguous complete statement ranges; the model cannot supply an amount, URL or outlet ID. G1 question Prompt/Schema stays **3**. Agent, State, TaskDefinition, Guard and C identity/ranking code are unchanged.

Code derives yen amounts, tax, meal and add-on flags from the validated original range, preserves intervening restrictions, excludes public del catalog amounts from calculation, and leaves ambiguous amounts or contradictory meal scope unknown. Quoted source metadata is frozen before the model awaits. Source facts retain their own source URL, read time and HIGH identity evidence; they are not copied into stock or an offer price.

Live composition passes only the generic model dependency through the Pack. Each source model call uses the same Executor candidate/source/run model and wall-time limits. The new internal candidate model-quota code is classified with the existing budget failures; production ceiling numbers are unchanged. No new source page visit. Without a source model, direct adapters return unknown prices rather than the private-selector fallback. Tabelog's now-unused private listed-course executable is removed. Other private HARD/Native fact paths remain unfinished.

`tabelog-vacancy-response.ts` and its C-facing output remain byte-identical. No G3 merge to main.

## Mechanism evidence

- `f5103dcc`: effective old-adapter reds for both class-renamed menus; missing price assertions, not import/type failures.
- `7df423fb`: both real adapter/fixture-model controls green, including four distinct TableCheck menu prices with meal/add-on scope. An earlier Schema bracket startup error is retained separately and is not red/green proof.
- `182cb113` / `cb752bea`: effective mutable-cache and detached-restriction reds. `91083d57`: G1 + source-core **49/49** green; model numeric/URL overrides, unknown IDs, duplicate ranges, customer reviews, missing budget meal context, ambiguous fees and cancellation reject appropriately.
- `38998920`: typecheck PASS, related native **163/163**, including source-model quota/cancellation and the existing menu amounts/source URL/no-inventory assertions. Same old full HARD result: **44,197 bytes**, SHA `9a3298bc5e004b99e41d80713e8913b68c336cfa594f6eb60599e310ee3fb633`.
- `650c7bfc`: related real Chromium **14/14**. The old generated course-display assertion becomes a complete literal quote containing all title/tax/meal/party clauses. The fixture allows three model calls (one source selection + the original two browser choices); production limits remain unchanged, and budget denial is separately tested.

Before acceptance, the source-to-HARD consumer counterexample at **`c8ff6bf7`** fails the newly added scope assertion. Normal unrestricted JPY 8,000 dinner quote → HARD MET. Same quote plus an explicit minimum party of four, requested party two → still MET, expected NOT_CHECKED. The original complete quote is retained, numeric extraction is correct, and stock remains correctly bound to party two. The deviation is the HARD consumer's applicability test, not a missing source qualifier.

## Corresponding test maintenance

Recorded Tabelog/TC price controls now provide the fixture source-selection model and readable public block text rather than one flattened private-parser input. Original values (JPY 9,800 and TC 7,000/7,500/9,800/3,000), guide URL, identity, no-inventory and no-offer-price assertions stay active. No historical page/oracle was changed. The same old price-only public fragments are reused; no whole historical run copied.

The min-party regression is in the default suite, with a normal positive control; no skip/todo/exclusion or reversed acceptance. Current default testing is therefore known red. Do not treat the earlier 163/49/14 checks as final all-green verification.

## Validation and next review

Final five gates are **NOT RUN AFTER S0 STOP**. Full production composition/new-prompt real-model quality and remaining Native/HARD metadata migration are not claimed complete. All modes here are offline fixture models/local Chromium; no current-site Replay or Live conclusion. New real model/Google/site/Live/GET/environment calls **0**, no .env/private QA answers.

A's Sen UNKNOWN baseline is now main **50a08361**, read-only checked during report preparation. It was not merged after reaching the S0 stop. Next authorized integration needs no repeat approval; HARD scope semantics need the prescribed independent review first.
