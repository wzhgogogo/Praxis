# Tabelog name-resolution benchmark — results

本轮第4项（Tabelog方法A）已完成：30家Gold各认证一次，最终29 VERIFIED/1 DROPPED；29家评分中12 CORRECT（41.4%）、15 NOT_FOUND、2 UNCERTAIN、0 WRONG_ACCEPTED。5家对照2 REVIEW_REQUIRED/3 UNCERTAIN，不计正确率。方法A35模型；前置5条选店回放全ACCEPTABLE、13/13直接门店页，合计40模型。Google/完整Live/方法B新增均0，TableCheck未跑。当前独立网络审计保留64组会话/完整请求链缺证，不能宣称总体S0边界已验证。

Historical preparation status at2260cc8: READY_FOR_GOLD_VERIFICATION. User has conditionally approved samples89ce49a49e428e84c5a4caed8831bf8ca98d1c06566d384879f8ce42992d0f87 and the preceding integrated selection gate has passed5/5.

Only Tabelog:30 frozen Gold and5 assigned controls; TableCheck2 Gold/5 controls deferred. Gold URLs are opened exactly once, converted only to the same outlet English root and without tracking query; no replacement URL/store search is used during certification. Only independent exact public phone or full address equality with Google can produce VERIFIED. Otherwise DROPPED and excluded from method scoring. Accepted controls await reviewer labels.

The outer freezes30s between logical source attempts,10m pause after403/429/503/busy, and stops at3 source blocks on the same Asia/Shanghai calendar day. Every Gold and method attempt shares this ledger. No automatic sample retry. MethodA retains production search/identity and its existing3-call ceiling, max150 total; no methodB. Browser Runtime/Guard policies are unchanged. An additional GET-only outer prevents form/foreign-document/nonread attempts.

Eval-only corrections: source-specific live admission (no fabricated TableCheck status), and403/429 classified as environment failures. Both have target red/green logs. Current typecheck/arch/default972/972/build pass; browser execution/Guard/production prefix unchanged, previous integration local Chromium121/121 reused.11 zero-network outer controls pass. No production or Prompt/Schema/State change.

Planned evidence: source snapshots and protocol observations compressed in observations.json.gz; actual adapter artifact in artifact.json.gz; public model request/response and counts, independent returned-page/Gold IDs, raw contact quotes. Boundary claims are limited to recorded source traffic, not a full S0 certificate. This is an identity-only benchmark, not discovery/availability/Live delivery.

Website/benchmark model count before launch:0. Selection recheck uses a separate5 calls. Final results and usage will be appended after execution or the first stop.


## Gold certification and approved identity-stop correction (2026-10-20)

Gold phase at2260cc8 completed30/30 once-only public Tabelog outlet reads, allHTTP200,0 model/Google calls; minimum finish-to-next-start30.032s. Original automatic summary28VERIFIED/2DROPPED is preserved. Before any method outcome, manual comparison of the complete captured address fornr-029 confirms matching district/block/building/floor, although the phone differs by one digit: final certificate29VERIFIED/1DROPPED. nr-023 lacks independently confirmed matching phone/full unit address and remains DROPPED, excluded from scoring. See verify/manual-address-verification.json and verify/certified-summary.json; no second Gold visit.

The old eval prefix attempted to stop through a diagnostic exception, but production Executor intentionally catches diagnostics exceptions. Valid boundary-red.log records2 underlying SELECT calls; strengthened existing default test identity-stop-test-red.log also fails on a real underlying select. Approved identity-stop.proposed.patch is applied only to the eval-owned session proxy: after HIGH identity it refuses further runtime methods except close. Production adapters/executor/Prompt/Schema/State unchanged. Green retains HIGH and0 underlying controls; existing actual Chromium prefix test now includes date/party controls and passes. Earlier standalone Chromium wrapper diagnostics did not exercise the local fixture response map (Guard route.fetch bypass); these debugging runs are not accepted red/green or zero-network evidence. The authoritative local Chromium test uses the existing wholly intercepted localFixture and makes no external request.

Current five gates PASS: typecheck,arch:check,default972/972,build,browserFixture121/121 (279333.267ms). Logs identity-stop-{typecheck,arch,tests,build,browser-fixtures}.log. Both source-prefix test cases retained and strengthened. User approvals recorded in identity-stop-approval.json and model-approval.json. Method A uses29 verified Gold+5 Tabelog controls, ≤3 calls each/≤150 total, destination only existing DeepSeek, no Gold labels/expected outlet IDs in model input. MethodB and TableCheck remain disabled.390 source/input/config SHA frozen in method-a-freeze.json;13 additional offline controls and dry run pass. Prior Gold321-file freeze remains bound to2260cc8 and preserved bytes; the new eval source necessarily differs, which is the explicitly approved re-freeze.

Historical pre-launch status at1b4cfda: METHOD_A_FROZEN_PENDING_EXECUTION. No selection replay or Gold verification repeated. Parallel remote integration changes are deferred until source execution finishes, so this batch continues the reviewed8ecfcfc production baseline (Context15/Prompt27/State17).


## Method A final execution (2026-10-20)

- Status: **COMPLETED**, 34/34 planned methods finished. Stop: `null`.
- Frozen execution commit: `1b4cfda05b9ba88a2eeebcb16cd9beded82f7aa8`. MethodA outer SHA-256 `c5683f717e897c3789546a4a1bc9fb7aa9c1f265e063f1486fc9d50c5345448a`; freeze `761b57c60902d91bbb10e8848a75df9b2e7c5325f5bd990f433b00089d864a71` (390 files). Prior Gold commit2260cc8: 321 historical source/config SHAs verified separately. Latest parallel remote production commits were not loaded during this execution.
- Gold certification:30 once-only public reads; automatic28VERIFIED/2DROPPED retained, final29VERIFIED/1DROPPED with disclosed nr-029 manual full-address match before methods. nr-023 excluded and not visited by methodA.5 controls excluded from correctness denominator; accepted controls remain REVIEW_REQUIRED.7 TableCheck subjects deferred.
- Models: methodA **35/150**, ≤3/subject; selection5, batch **40**. Google0; full Live0; methodB0. Tabelog logical attempts30 certification +34 methods. Finish-to-next-start minimum **30.025s**; 0 source cooldown events. Every source attempt and paid request is in ledger.json. No completed attempt repeated.
- Gates: typecheck,arch:check,default972/972,build,Chromium121/121 PASS. Identity regression: boundary-red.log2 underlying selects and strengthened identity-stop-test-red.log fails onselect; same existing cases green, actual Chromium identity test retains HIGH without controls. Approved eval proxy stops actual execution after identity (production/Prompt/Schema/State unchanged).

### Four-layer evaluation

1. **Result (identity benchmark only):** verified Gold started29, evaluated29; CORRECT12, WRONG_ACCEPTED0, UNCERTAIN2, NOT_FOUND15, ENV_FAILURE0, NOT_EVALUATED0. Frozen metric correctRate=0.41379310344827586, wrongRate=0, uncertainRate=0.06896551724137931, notFoundRate=0.5172413793103449. Existing metric denominator includes evaluated environment failures and reports them separately; controls are excluded. Median32530.5ms/max61442ms are per-method source+model work, excluding mandatory gaps. No availability, qualification, delivery or booking claim.
2. **Stages:** per-case-details.json preserves search document URLs, observed outlet URLs, identity diagnostics/failure codes, returned and selected raw page. Correctness compares literal independent expected/returned/raw IDs, not production identity labels alone. KNOWN_PHONE_CONFLICT occurred17 times; failure histogram `{"KNOWN_PHONE_CONFLICT": 17, "NONE": 14, "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED": 1, "ENTITY_MATCH_UNCERTAIN": 1, "NO_COMPARABLE_IDENTITY_SIGNAL": 1}`. Raw certification and method observations are separate.
3. **Severity:** independent ID comparison finds0 wrong Gold acceptances. Controls lack labels, accepted controls require reviewer inspection. Independent response audit finds0 recorded violations but network S0 remains NOT_EVALUATED (64 response sets have incomplete session/request evidence); no full-Live S0 certificate. Guard ALLOWED labels are not the oracle. Raw GET side effects/multi-hop limitations remain.
4. **Attribution:** no intervention or methodB comparison; failure codes and search presence are observations, not causal proof. All scored Gold were independently verified on Tabelog, so bounded NOT_FOUND cannot establish absence from that platform. Search diagnostics record14 method cases whose rstLst request finished outside rstLst (including region-home redirects); these explain repeated irrelevant lists as an observed stage, not phone-rule quality. Known-phone conflicts must be interpreted against the actual returned outlet. No identity rule was relaxed.

### Each method / exclusion

| ID | Google name | Gold certification | Verdict | Returned page | ms | models | Failure |
| --- | --- | --- | --- | --- | ---: | ---: | --- |
| nr-001 | Sushi Tatsu Shibuya | VERIFIED | NOT_FOUND | — | 35259 | 2 | KNOWN_PHONE_CONFLICT |
| nr-002 | 焼肉おおにし 祐天寺店 | VERIFIED | UNCERTAIN | — | 11491 | 0 | KNOWN_PHONE_CONFLICT |
| nr-003 | Washoku Dining Hana Kagura | VERIFIED | NOT_FOUND | — | 47284 | 2 | KNOWN_PHONE_CONFLICT |
| nr-004 | 鮨処 みこし | VERIFIED | CORRECT | https://tabelog.com/en/tokyo/A1320/A132001/13034967/ | 15803 | 0 | — |
| nr-005 | Ginhachi | VERIFIED | CORRECT | https://tabelog.com/en/tokyo/A1301/A130101/13131872/ | 33997 | 0 | — |
| nr-006 | Sugata | VERIFIED | CORRECT | https://tabelog.com/en/tokyo/A1309/A130905/13053749/ | 31763 | 0 | — |
| nr-007 | Wagyu beef Yakiniku Beef Kitchen Nakameguro | VERIFIED | NOT_FOUND | — | 61442 | 2 | KNOWN_PHONE_CONFLICT |
| nr-008 | Shibuya Kappo Sancho | VERIFIED | NOT_FOUND | — | 48128 | 2 | KNOWN_PHONE_CONFLICT |
| nr-009 | Naminoue shibuya | VERIFIED | NOT_FOUND | — | 19485 | 3 | BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED |
| nr-010 | Yakitori & Obanzai SAKAMOTO | VERIFIED | NOT_FOUND | — | 32004 | 2 | KNOWN_PHONE_CONFLICT |
| nr-011 | 日本料理 ほそ川 神楽坂 | VERIFIED | NOT_FOUND | — | 45274 | 2 | KNOWN_PHONE_CONFLICT |
| nr-012 | Sushi Rizaki | VERIFIED | CORRECT | https://tabelog.com/en/tokyo/A1303/A130301/13235258/ | 33256 | 0 | — |
| nr-013 | Horumon Matsuda HANARE Yakiniku Nakameguro | VERIFIED | NOT_FOUND | — | 46170 | 2 | KNOWN_PHONE_CONFLICT |
| nr-014 | 炭火焼肉ホルモンまんてん高架下 | VERIFIED | CORRECT | https://tabelog.com/en/tokyo/A1317/A131701/13241250/ | 7568 | 0 | — |
| nr-015 | Sushi Yamashiro Kichijoji | VERIFIED | NOT_FOUND | — | 40041 | 2 | KNOWN_PHONE_CONFLICT |
| nr-016 | 焼き鳥と蕎麦 灯 | VERIFIED | CORRECT | https://tabelog.com/en/tokyo/A1320/A132001/13256151/ | 12262 | 0 | — |
| nr-017 | Sushi Matsumoto Shibuya | VERIFIED | NOT_FOUND | — | 34087 | 2 | KNOWN_PHONE_CONFLICT |
| nr-018 | Yakiniku Ushicoco Nakameguro | VERIFIED | NOT_FOUND | — | 32833 | 3 | KNOWN_PHONE_CONFLICT |
| nr-019 | T nakameguro | VERIFIED | NOT_FOUND | — | 30370 | 0 | KNOWN_PHONE_CONFLICT |
| nr-020 | Sushi kazumasa | VERIFIED | CORRECT | https://tabelog.com/en/tokyo/A1303/A130301/13275782/ | 15671 | 0 | — |
| nr-021 | 焼肉 牛目黒 | VERIFIED | CORRECT | https://tabelog.com/en/tokyo/A1317/A131701/13281273/ | 9160 | 0 | — |
| nr-022 | Sushi and Tempura Iwai Kichijoji | VERIFIED | NOT_FOUND | — | 38003 | 3 | ENTITY_MATCH_UNCERTAIN |
| nr-023 | WAGYU SUSHI and SANDWICH Tsukiji Wine Stand 88 | DROPPED | EXCLUDED | — | — | — | — |
| nr-024 | Nakameguro Yakiniku Togyumon | VERIFIED | CORRECT | https://tabelog.com/en/tokyo/A1317/A131701/13290371/ | 10302 | 0 | — |
| nr-025 | Sumi Sushi Shibuya | VERIFIED | NOT_FOUND | — | 47726 | 2 | KNOWN_PHONE_CONFLICT |
| nr-026 | Kushiyaki Bistro Fukumimi Ginza 6 | VERIFIED | NOT_FOUND | — | 46098 | 2 | KNOWN_PHONE_CONFLICT |
| nr-027 | Shibuya Sushi Jinnan | VERIFIED | CORRECT | https://tabelog.com/en/tokyo/A1303/A130301/13307953/ | 11077 | 0 | — |
| nr-028 | Ginza Bokujin | VERIFIED | CORRECT | https://tabelog.com/en/tokyo/A1301/A130101/13310287/ | 8826 | 0 | — |
| nr-029 | 焼肉 うし幸 | VERIFIED | UNCERTAIN | — | 35753 | 0 | KNOWN_PHONE_CONFLICT |
| nr-030 | Sushi Nasu | VERIFIED | CORRECT | https://tabelog.com/en/tokyo/A1303/A130301/13316574/ | 32228 | 0 | — |
| nr-033 | Age.3 GINZA | CONTROL | UNCERTAIN | — | 40596 | 2 | KNOWN_PHONE_CONFLICT |
| nr-035 | 白路 | CONTROL | UNCERTAIN | — | 13861 | 0 | NO_COMPARABLE_IDENTITY_SIGNAL |
| nr-037 | Shibuya Namikibashi Sushi Hajime | CONTROL | UNCERTAIN | — | 44385 | 2 | KNOWN_PHONE_CONFLICT |
| nr-039 | Fushikino | CONTROL | REVIEW_REQUIRED | https://tabelog.com/en/tokyo/A1309/A130905/13130697/ | 25812 | 0 | — |
| nr-041 | pololi食堂とpihakopi | CONTROL | REVIEW_REQUIRED | https://tabelog.com/en/tokyo/A1320/A132001/13252791/ | 8059 | 0 | — |

### Area groups

Groups can overlap; do not add their denominators.

| Area | Gold started | controls | correct | uncertain | notFound | ENV | notEval | models | median ms | max ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| near Shibuya | 9 | 1 | 4 | 0 | 5 | 0 | 0 | 13 | 33671.5 | 48128 |
| near Nakameguro | 9 | 0 | 3 | 2 | 4 | 0 | 0 | 7 | 30370 | 61442 |
| near Kagurazaka | 3 | 2 | 1 | 0 | 2 | 0 | 0 | 4 | 31763 | 47284 |
| near Kichijoji | 5 | 1 | 2 | 0 | 3 | 0 | 0 | 7 | 23903.5 | 40041 |
| nearby | 3 | 1 | 2 | 0 | 1 | 0 | 0 | 4 | 37296.5 | 46098 |
| near Higashi-Ginza | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 2 | 40596 | 40596 |

### Name-shape groups

| Shape | Gold started | controls | correct | uncertain | notFound | ENV | notEval | models | median ms | max ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ENGLISH | 22 | 3 | 8 | 0 | 14 | 0 | 0 | 33 | 33997 | 61442 |
| GENERIC_TERM | 9 | 1 | 4 | 0 | 5 | 0 | 0 | 13 | 34673 | 47726 |
| JAPANESE | 7 | 2 | 4 | 2 | 1 | 0 | 0 | 2 | 12262 | 45274 |
| BRANCH_SUFFIX | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 11491 | 11491 |

### Evidence and limits

- Selection: ../../checkpoint-c-integration-20261020/selection-recheck/report.md;5 requests/results, all ACCEPTABLE,13/13 direct. These exposed historical turns have no retained price fact; this is not proof for nonempty price contexts or long-run model performance.
- Gold: verify/<id>/result.json + observations.json.gz, original verify/summary.json, manual-address-verification.json and certified-summary.json.
- MethodA: method-a/<id>/result.json, artifact.json.gz, observations.json.gz; model-N.request.json/response.json only when a model was called. Aggregate method-a/summary.json, ledger.json, audit-summary.json and per-case-details.json; SHA inventory artifact-manifest.json.
- Approval and freeze: identity-stop-approval.json, model-approval.json, model-payload-boundary.json, method-a-plan.json, method-a-freeze.json. Freeze was committed before source/model work; optional shell process check falsely matched its own command and the single Node command continued. The outer independently verified390 SHA and recorded its committed configuration before the first attempt. The separate method-a-freeze-commit.json receipt is explicitly post-start; one Node process was confirmed and no restart occurred.
- Earlier standalone Chromium debug probes failed fixture interception and are not authoritative red/green or zero-network evidence. Current real Chromium acceptance uses the existing wholly intercepted fixture; all unrelated traffic is aborted.

### What this says about name resolution

This is a single exposed Tabelog-only run. Reported rates measure the existing bounded search/identity pipeline on independently verified Gold, not whether restaurants exist online. Exact-ID false acceptance is separately zero-tolerance; accepted unlabeled controls remain unscored. TableCheck difficulty is not measured here. The saved search/identity diagnostics identify where to inspect normalization, language/search strategy and contact extraction, but their relative benefit needs a separately approved intervention; no benefit is claimed and methodB was not enabled.


## Publication merge (after all source/model work ended)

Remote concurrent integration and its five discovery probes atfe9b3fc70138dd03cf01cee9624fcde9de087ee6 are preserved by ordinary merge, without rewriting either frozen history. Only5 state/history/index documents conflicted; both complete bodies and index entries retained (176Dev/183Test). Source auto-merged; relative to remote, this batch changes only3 eval files and the existing Chromium test. Current branch versions: `{"agentActionSchema": 4, "agentContext": 15, "agentPrompt": 27, "browserActionSchema": 11, "browserPrompt": 17, "evaluator": 30, "priceFacts": 1, "restaurantState": 18, "retrievalPrompt": 5, "retrievalSchema": 2, "rubric": 26, "taskDefinition": 16}`. No new product implementation in this task; remote State18/P2-1c is separately identified.

The benchmark above executed **before** this publication merge on1b4cfda/production8ecfcfc (State17); it is not a rerun on remote State18. Gold/selection/methodA were not repeated. Latest source versions are integration metadata, not a claim of new benchmark results.

Fresh publication gates: typecheck/arch/default978/978/build/Chromium122/122 PASS (browser duration296793.522458ms). Both parents' literal test declarations retained;236 original Gold/method files and18 selection files unchanged,11 independent evaluator files identical to remote22/22 outcome/20/20 S0-declaration calibration (reused, no new network/models). See publication-conflicts.json/publication-retention.json and publication-*.log. Common history bodies verified after regenerating an initially invalid, uncommitted document resolver output. No change to Gold, thresholds or captured source bytes.
