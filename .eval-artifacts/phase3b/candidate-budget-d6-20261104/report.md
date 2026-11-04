# D6 candidate budget diagnosis — stop for review

- Report time: 2026-11-04T08:31:31+01:00 (Vienna CET, UTC+1).
- Branch: `codex/fix-phase3b-candidate-budget-waste`; product baseline main `be84674e27fdaec22de1f41af9c39ffc230dcfe4`.
- Frozen analysis/gate input commit: `df27dc1dbb78a84ad4f4ffe4fe0d4c1a57f59ad2`.
- Saved evidence source: A `92bc103218f4b84ebe6e55a9b09e71c9515ba662`. Exposed development evidence; **not clean holdout, not a new Live, not a replay or quality regrade**.
- **Result: diagnosis complete; no product repair or speedup claimed. Stop under user item 3.** The observed identity-search sequence exhausts this candidate allowance before availability starts. No sufficiently justified, removable duplicate work has been demonstrated inside this window. No budget/time/identity/Guard/State/TaskDefinition/Prompt changes, no A/C file changes, no main merge.

## 1. Scope and authoritative endpoints

Candidate `praxis:restaurant:d7e28bf950ed08d83c01d9d7`, Ito Akabane, Google `ChIJwUnGVR2TGGARNAEaZNumYhQ`.
`browser-diagnostics.json` sequence164 starts the candidate at **06:09:54.184 CET**; sequence256 ends at **06:10:54.192 CET**, **60.008s**, scope **CANDIDATE**, source TABELOG, stage IDENTITY. TableCheck is 22.903s, Tabelog 37.105s; provider switching does not reset the candidate allowance. The 500s run budget and 90s provider budget were not the exhausted scopes. The third-turn executor starts 5.454s earlier; that preparation is outside these 60.008s.

D6's original result remains availability UNKNOWN/BROWSER_TIMEOUT, with no B1 handoff. This analysis does not change A's evaluation (RECORDED_NOT_EVALUATED / bounded conclusion check), S0 assessment, denominator or qualification. Navigation completion does not establish same-outlet identity or availability.

## 2. Where the 60.008s went

Exclusive browser method intervals from `browser-trace.json`, recorded model start+latency from `execution.decisions.jsonl`, and Google structured request start+duration from the HAR partition this window once. There are 90 disjoint rows in [timeline.md](timeline.md), with raw IDs/sequences and lifecycle in [analysis.json](analysis.json).

| Work | TableCheck seconds | Tabelog seconds | Total seconds |
|---|---:|---:|---:|
| Navigation to DCL (method wall time) | 15.080 | 28.666 | **43.746** |
| Post-navigation/readiness waits | 6.318 | 3.518 | **9.836** |
| Source-query model | 0 | 2.165 | **2.165** |
| Google same-place Japanese name | 0 | 1.527 | **1.527** |
| Snapshot | 0.208 | 0.270 | 0.478 |
| Controls | 0.880 | 0.520 | 1.400 |
| Recording layout screenshot | 0.193 | 0.214 | 0.407 |
| Session startup | 0.123 | 0.093 | 0.216 |
| Unattributed gaps/rounding | 0.101 | 0.132 | 0.233 |
| **Total** | **22.903** | **37.105** | **60.008** |

No session-close work lies inside the window before failure under the explicit precedence rule. Cleanup overlapping cancellation does not get added to navigation/snapshot spans. A provider boundary may have 1ms of lifecycle bookkeeping in addition to startup API time.

### Navigation order (all ten completed)

| CET start | Candidate offset | Navigation | DCL duration | Allowance |
|---|---:|---|---:|---:|
| 06:09:54.308 | 0.124s | TableCheck search: Ito Akabane | 3.375s | 20.000s |
| 06:10:02.976 | 8.792s | TableCheck Kawaei | 7.108s | 20.000s |
| 06:10:10.889 | 16.705s | TableCheck UNDERGROUND Akabane | 2.988s | 20.000s |
| 06:10:14.672 | 20.488s | TableCheck Azzurri Arte | 1.609s | 20.000s |
| 06:10:17.180 | 22.996s | Tabelog search: Ito Akabane | 3.651s | 20.000s |
| 06:10:23.672 | 29.488s | Tabelog search: Ito | 3.505s | 20.000s |
| 06:10:28.006 | 33.822s | Tabelog Ito / Machida (13278705) | 1.721s | 20.000s |
| 06:10:30.539 | 36.355s | Tabelog Ito / Toyocho (13059615) | 2.396s | 20.000s |
| 06:10:35.655 | 41.471s | Tabelog search: 自家製麺 伊藤 赤羽店 | 5.182s | 18.529s |
| 06:10:41.237 | 47.053s | Tabelog target Ito / Akabane (13090799) | 12.209s | 12.947s |


Query-to-recording mapping is by exact SHA-256 equality, not by origin/path or an assumed cross-layer order. The final target has no completed saved snapshot; its clear trace URL hashes exactly to the recorded URL hash (so the displayed plain detail URL is fully verified independently). `fullQueryKnown=false` on that row means no recording-page URL was available to match, not an invented query. The three Tabelog searches are different URLs, not repeat navigation of the same query.

### Waits, models and session startup in order

- 0.001–0.124s: TableCheck openSession 123ms.
- 3.499–4.213s: initial settlement 714ms; snapshots16/17 are the same 139-character loading shell. Then controls and **4.369–7.851s readiness wait, 3482ms**; snapshot18 now contains a real result list (19 results, 4800 visible characters in the saved sanitized document). This wait demonstrably produces content; it is not proven idle waste.
- After the three TableCheck guide navigations, settlement waits are **708/707/707ms**, followed by fresh snapshots. Guides show Kawaei, UNDERGROUND Akabane, Azzurri Arte; the provider returns TABLECHECK_ENTITY_MATCH_UNCERTAIN, not an Ito match.
- 22.903–22.996s: Tabelog openSession 93ms; after original English search, settlement **312ms**, snapshot22.
- **27.040–29.205s**, captured decision sequence15: one `restaurant_named_source_query` call, 2165ms; output exactly `{"field":"name","fragment":"Ito"}`. This is **one gateway model call** in the window, although generic browser `candidateModelCalls`/`providerModelCalls` are both zero. Those narrower counters are not total model usage.
- After the `Ito` search and the two wrong-outlet details, settlement waits **717/728/730ms**. The details are Machida (糸) and Toyocho (伊都), not Akabane. Snapshot27 rereads the current Toyocho page without another navigation for the next search's fresh-control observation.
- **39.570–41.097s**: one already-recorded Google Places Details `?languageCode=ja` read, 1527ms; the same Place ID yields `自家製麺 伊藤 赤羽店`. This is a data request, not a model call and not an unexplained 1.5s pause.
- After the Japanese search, settlement **311ms**, then snapshot28. It contains the observed link to the Akabane target. No form page is opened.
- **47.053–59.262s**: target detail DCL navigation completes in 12.209s against **12.947s remaining allowance**. Afterwards settlement takes **720ms** to 59.982s. The snapshot starts with **18ms** left; session retirement is recorded at 60.002s, and candidate failure at 60.008s. There is no completed target snapshot29, no accepted target identity, and no availability-stage operation. The saved trace does not contain the later work needed to complete availability, so its duration remains unknown.

## 3. Network contribution and repeated work

The final target navigation's slowest completed CDP request is `commons.js`, request `capture:8:page:1:request:228`: **10.969461s** browser duration, ending 06:10:53.405 CET; navigation ends 06:10:53.446. Independently the Guard transport reports 10.895733s for that URL. They are separate measurement layers, not extra requests or summed delay; neither is physical origin-wire TTFB. The timeline shows a long script overlapping the navigation, not proof that removing this script is safe or that all its time is avoidable. Required DOM/data behavior without it has not been demonstrated; no new script-block rule is justified here.

There are **23 explicit navigations and 5 source-entry navigations in the whole run**; **10 and 4 respectively inside this candidate window**. Five exact detail URLs are reopened once each, but all those pairs finish before 06:09:35. They belong to the initial recommendation/discovery→facts work, concern shops other than target13090799, and **do not consume this later candidate window**. The target is not among those earlier five details. Candidate authoritative source IDs include Google ID/phone/website (`http://www.niboshi-ito.com/`), not a previously verified Tabelog/TableCheck detail URL. Reusing an already-bound target detail cannot be justified from these inputs.

Only the broader second-turn/end-to-end performance question could use those five rereads as an optimization lead. It is outside this candidate-budget slice, and preserving run/identity/freshness would require separate evidence.

## 4. Waste assessment and stopping decision

| Suspected waste | Evidence / disposition |
|---|---|
| Repeated search entry | Three Tabelog queries have distinct full hashes and different terms; no exact duplicate in the ten candidate navigations. No navigation deduplication patch. |
| TableCheck readiness wait | Saved shell→loaded-result change proves useful work. Removing 3.482s would risk treating an unread result list as empty. |
| Automatic settlement samples | Eight hit roughly the 700ms bound, two return around311–312ms; the separate readiness wait lasts3482ms. They feed existing freshness/readiness behavior. No recorded control proves they can be removed without changing result safety. Even deleting only the last720ms would leave at most738ms for an unobserved identity+availability tail, not a demonstrated completion. |
| Back-to-back snapshots / recording overhead | They cost small measured intervals; snapshots refresh controls after model/Google calls or re-enter runSkill, while screenshots retain recording evidence. Equal earlier DOM is not a general proof of freshness. No speculative cache or recording change. |
| Identity retrieval order | **Actionable lead:** TableCheck reads three ultimately unmatched guides; Tabelog's `Ito` fragment leads to two wrong details before an already-budgeted Japanese-name fallback reaches the correct link. This is search/identity policy, not a duplicate request. Removing wrong-detail reads retrospectively is not an implementation or measured speedup. |

**Stop:** the observed legitimate identity search under the current ordering spends virtually all60s before availability. It is evidence that this *observed path* does not fit, not proof that every normal identity+availability flow requires a larger limit or a numerical estimate of how much extra is needed. All limits remain unchanged.

A concrete next review could assign C to examine ordering/ranking in the existing source identity retrieval (`tabelog-browser-availability.ts` original→fragment→Japanese phase, `tablecheck-page-parser.ts` discovery fallback, availability-source order). In particular, evaluate using the existing same-ID Japanese-name fallback earlier after an unproductive original English query, while preserving same-outlet tests, known fragment positives, caps, model/Google accounting and Agent observation. **Do not introduce a universal extra Google request or simply discard a listing because an English name differs.** This touches C's protected name retrieval/ranking behavior and needs coordination; B has not modified it. A budget decision also belongs to the user; this report proposes no new60s value.

## 5. Red control, gates and scope of proof

- **Saved red:** D6 sequence256 reports CANDIDATE deadline, UNKNOWN/BROWSER_TIMEOUT before availability. The frozen offline analyzer independently verifies 60.008s, 22.903/37.105 split, ten completed distinct-hash navigations, one2165ms model call, one1527ms Google request, and the final navigation completing below allowance. It does **not** claim to replay the incomplete recording or prove a product green.
- **Product green / timing improvement: NOT IMPLEMENTED, NOT CLAIMED**, due the above stopping condition. No fabricated local fixture success substitutes for this real path.
- Fresh regression candidate `df27dc1d` has byte-identical `src/`, `scripts/`, package and budget/config to baseline be84674e. A's saved run source and current baseline have no differences in product directories (core/domains/application/integrations/infrastructure/server). The diagnosis does not rely on a repair changing budgets.

| Gate | Result | Elapsed |
|---|---|---:|
| typecheck | PASS | 0.545s |
| arch | PASS | 0.186s |
| default | 1417/1417 | 48.979s |
| build | PASS | 0.517s |
| chromium-and-g6 | 189/189 Chromium + checked-in G6 18/18 | 170.301s |
| strict-g2 | 5/5 tests; all 12 pages PASS | 24.356s |


No failures, skips, cancellations, retries or assertion changes. Every command's statusBefore/statusAfter is empty (see [gates.json](gates.json)); no cleanup restores modified tracked files. Browser gate includes the **current main's18 G6 tests**, not a claimed new run of A's expanded66-test branch; A's extra eval/runner files were not imported or edited. Ordinary Chromium totals189 including ordinary G2; separate REQUIRE_PASS is5/5 and all12 pages PASS. Gate logs are retained as gzip with SHA-256 of original bytes in receipts. These gates show unchanged regressions, not that D6 now finishes.

## 6. Freeze, calls, delivery

[inputs.json](inputs.json) binds immutable Git paths and SHA-256. Analysis script SHA-256 `a9e748955b7cd2996c2aeca0347c316e773c006ed1b00525cfc548fc74b7a7c7`, gate script `728d1707c041da628754b8630ab47178f41a0b80bebfb79ee266e2dbc0fef76f`; execution was after freeze commit df27dc1d. Reproduce analysis with:

```sh
python3 .eval-artifacts/phase3b/candidate-budget-d6-20261104/analyze.py --out /private/tmp/praxis-d6-candidate-review
```

Source A commit must be present in Git; no old absolute source-machine path is read. Scripts use only explicit Git blobs and current repository paths, plus temporary output. No `.env`, `answers*.json`, private holdout or browser profile read.

**New calls: model0 / Google0 / website0 / Live0 / environment rerun0.** Shared ledger is byte-identical to main be84674e; no limits, historical rows or counters overwritten. This task performs offline analysis of already-recorded requests, not new real requests. Only this diagnostic/report branch is to be pushed. **Not merged to main; stop for independent review and user/C decision.** Final branch head and remote equality are reported in the delivery response.
