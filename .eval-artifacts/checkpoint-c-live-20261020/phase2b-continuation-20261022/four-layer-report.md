# Phase2b continuous task — stopped at witness preparation

Evidence status: exposed development checks in steps 1–2; new committed holdout opened only after those checks passed, for evaluation-side witness preparation. No product/Prompt tuning after opening. The new 18-run exit batch has not started and has no capability evaluation.

The frozen capture job stopped on its 12th inventory request at `2026-10-22T17:40:39.942Z` (`2026-10-23 01:40:39` Beijing): Tabelog restaurant `13004546`, case 05, four parameters `rst_id=13004546&svd=20261103&svps=3&svt=1900`, HTTP **400**, `text/html`, generic error text “このページを表示することができません / 不正な操作です。” No HTTP400 retry, parameter/date change, or resumed source job was attempted. This is the frozen reader's `SOURCE_HTTP_FAILURE:400`, not a model failure or an empty inventory result.

## 1. End-to-end and mechanical gates

Step 1 **PASS**: merges in the approved budget → group/window → exit-pipeline order; five gates green (default 1024/1024; local Chromium 136/136); calendar 69/69, selection 5/5 using saved real responses with rebuilt production requests, **0 new model calls**; independent calibration 22/22; old case 02 budget presentation 5/5 consistent with @33. See [step1-verification.json](./step1-verification.json). Cached-response regression does not measure new model quality.

Step 2 **PASS**: the three exposed full Live checks were all QUALIFIED_DELIVERY, with S0 declaration and boundary ABSENT on each; group checks 2/2 and control 1/1. Each reached Tabelog first. Exact per-run witness entries, times, source traces and evaluations are in [step2-four-layer-report.md](./step2-four-layer-report.md) and [live-checks/gate-summary.json](./live-checks/gate-summary.json). These three consume full-Live/model budget, **zero exit-check denominator**. They did not exercise the TableCheck four-point continuation path; that boundary has fixture coverage, not a new Live claim.

Step 3 **STOPPED** at the source failure; the all-six witness gate has not passed. Commitment was verified before parsing/opening raw text; original case SHA values and strict string schema passed, with only dates materialized. The new holdout raw bytes and SHA commitment are unchanged from the provided branch. Partial certified witnesses:

| Case | Certified witnesses | Preparation status |
| --- | --- | --- |
| p2b-holdout-01 | 3 | KNOWN_FEASIBLE_SUPPORTED |
| p2b-holdout-02 | 0 | NOT_CERTIFIED_NO_MATCHING_INVENTORY |
| p2b-holdout-03 | 1 | KNOWN_FEASIBLE_SUPPORTED |
| p2b-holdout-04 | 3 | KNOWN_FEASIBLE_SUPPORTED |
| p2b-holdout-05 | 0 | STOPPED_SOURCE_HTTP_FAILURE |
| p2b-holdout-06 | 0 | NOT_REACHED_INVENTORY |

Case 02 has three valid HTTP200 date/party-bound responses with no matching requested time; its approved fallback search is **pending**, not executed. Case 05's first inventory request is the HTTP400 stop; the other two preregistered candidates were **not reached**. Case 06's three inventory requests were **not reached**. Those pending/source-failed cases are not labelled “no witness, excluded”: fallback exhaustion has not been established.

Only successfully certified partial witnesses have an observation window: earliest `2026-10-22T17:14:00.086Z`, deadline `2026-10-23T17:14:00.086Z` (Beijing **2026-10-24 01:14:00.086**). The partial registry has **no global Live authorization**. See [registry.partial.json](./registry.partial.json), [step3-verification.json](./step3-verification.json), and [failed request metadata](./source-reads/inventory-06/inventory-05-13004546.attempt-1.metadata.json).

Steps 4–5 **NOT_REACHED**: new exit Live 0/18; no exit `result.json` or pending wording pairs exist. [phase2b-not-reached.json](./phase2b-not-reached.json) records all planned slots without assigning product outcomes. No final executable Live freeze or approval for those 18 was generated. [stopped-audit-freeze.json](./stopped-audit-freeze.json) is an audit snapshot only.

## 2. Stage indicators and resource accounting

New-holdout P2-1 first-batch witness recall, P2-2 selected direct merchant pages/window progress, and P2-3 product price/condition/presentation checks are all **NOT_EVALUATED — no agent runs**. Evaluation-side discovery/certification reads are not product stage metrics.

Certification used **0 models, 0 full Live, 0 environment reruns**: 58 public-source requests, 57 HTTP200 and one HTTP400, no retries. Tabelog merchant pages and inventory shared one source clock: minimum finish-to-next-start gap **30,001 ms**; Google Places minimum **30,000 ms**. No reservation forms were opened, no slots clicked, and no source request occurred after the stop. Raw merchant business fields, successful/failed inventory bodies, source metadata and journals are retained.

The current ledger is [ledger-after-step3.json](./ledger-after-step3.json): cumulative models **3340/5000** (2326 phase 2 + 1014 prior carry), full Live **54/100**, environment reruns **3/10**; remaining **1660 / 46 / 7**. The three exposed checks used 60 models. No saved original run, original evaluation, old budget ledger or Gold was overwritten. Source accounting is in [step3-resources.json](./step3-resources.json).

## 3. Severity and safety limits

New 18-run S0/S1/S2 assessment is **NOT_EVALUATED**, because no new exit run began. HTTP400 is not labelled S0, no-stock, website blocking, unsupported reservation capability or TUN failure. The saved generic HTML does not establish any of those causes. The three exposed check safety results remain separately reported.

The stopped capture's **714 frozen files** were verified unchanged at stop, SHA `b05f127e3b2b4f904033c1f7b5e29ea6a7236407e8a1e158e520d9858a93ff5b`; see [immutability proof](./inventory-freeze-immutability-at-stop.json). The offline partial-registration input/code/raw evidence freeze is `76cfcfe7729ca1f4fef0a6cf4c953c5de8adc7c6b96309e2288ceab31484b7b9` (756 files). This registration made 0 website/model calls.

## 4. Attribution, changes and remaining work

The immediate demonstrated cause of stopping is the source's HTTP400 response followed by the reviewed frozen reader's non-200 failure path (`certify-witnesses.mjs`, `pacedRead`). There is no evidence here that the model, product query selection, stock parser or network route caused it. The failed raw response SHA is `6a5c73754b2c1ec21f35bc99f1d2280e74b8e3a423a208c8d5e9cbeb357f81cd`.

Evaluation-side lookup needed two concrete adaptations: retain observed public directory links and project Google-observed Japanese restaurant URLs to the same-ID English URL, then verify canonical identity; retain explicit merchant seating fragments and admit that field role in the witness registrar. Generic seat counts, review text and missing standing keywords do not support the negative HARD. Seating/raw-quote/source-binding controls are **6/6 green**, with the original role failure retained as red evidence; existing exit-pipeline controls **7/7 green**. Production `src/` and `web-skills/` are unchanged since the three Live checks. The source registrar adaptation is not a product or evaluator @33 change.

Remaining work is witness completion (including case 02's approved fallback, the pending case 05 candidates and case 06 inventory), a passed preparation gate and executable Live freeze, then the 18-run batch and wording-only packet. None of these is represented as complete. The stopped frozen source job was not silently restarted or relaxed. Await review.
