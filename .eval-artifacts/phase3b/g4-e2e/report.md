# G4端到端身份前缀基准

Evidence: frozen exposed regression / not clean holdout. Vienna CET UTC+1.

Production main b250bb17, after approved B then C integration. 29 original Google inputs +8 new, all Google Tabelog/website direct links hidden; original PlaceID/name/address/phone/coordinates only. Certified IDs isolated in gold.json and posthoc scorer child, never query/Prompt.

Use current TabelogBrowserAvailability→ModelNamedSourceQuery→details→existing identity. Public HTTP GET runtime renders captured HTML offline with JS disabled, all renderer network aborted; no actual source browser requests, Google0/Live0. Stop immediately at HIGH identity; never fetch booking/forms or query inventory. Static source HTML limitation is reported, not a full-browser Agent/availability benchmark. Five-detail cap/two queries unchanged. No adaptive strategies/Gold/identity edits after results.

Caps: GET115, model40 (at most1 per candidate), shared GET150 (previous30). Every GET incl failures charged before request, >=30s after previous completion,20s fetch timeout, manual redirects/no cookies, no retry after failure. Failed request aborts this candidate as ENVIRONMENT_FAILURE, excluded from identity misses;3 consecutive network errors stop entire batch. Wrong acceptance stops immediately after independent posthoc score. Budget exhaustion stops, unrun entries explicit. Model infrastructure failure stops. Worst-case37×7 GET exceeds115, so no promise to complete all37 within cap; never truncate detail cap to improve coverage.

Report old29 and new8 separately: searches/first-page certified presence/detail URLs/production identity/verdict/causes. Do not combine old12/29 saved-page replay or old first-page probes into this new denominator. Model credential only authorized Node --env-file process, never independently read/copy/print/stage.

## 额度停止：完整37家尚未完成

生产main b250bb175bbe080c8b29a298a5aa5a6090f0d461，执行配置0809fd49。生产、输入、Prompt、身份规则、评分器冻结SHA未变。实际GET115/115，真实模型14/40，Google0、Live0；共享累计GET145、模型54、Google11。逐份核对GET间隔≥30秒、失败不重试、原文SHA一致，见integrity.json。

| 队列 | 计划 | 正确接纳 | 错认 | 未接纳 | 环境失败 | 额度中断 | 未运行 |
|---|---:|---:|---:|---:|---:|---:|---:|
| 旧29 |29|10|0|8|7|1|3|
| 新8 |8|未评|未评|未评|0|0|8|

新8全部未运行，不能把它报告为0%成功或0错认验证通过。旧29只有18家可评身份结果，另7环境失败、1中断、3未运行；不把环境失败算作未接纳，也不单报10/18代表总体能力。没有完成用户要求的全部37家，停止原因是明确的GET115额度用尽。

8家未接纳的失败阶段：首屏未出现认证店4；认证店未进入当前实际打开详情上限3；片段被原文字面核验拒绝1。生产原因另列，例如并列最高匹配、电话号码冲突；正确/错认以独立认证ID事后核对，不能由生产原因码自证。旧12/29为保存响应复算；历史新8的7/8和旧样本11/12仅是首屏命中，三者不能拼接为本轮端到端数字。

TUN切换是用户报告的网络条件变化，观察时标见network-change-user-tun.json。其后有成功也有零星连接失败，未更改代理、UA、检索或身份规则。最初四家的环境失败原样保留。

## 用户追加复跑与续跑额度

用户要求完成当前轮后复跑前四家nr001～004，并说继续；已登记但尚未执行。原批GET115已用完，共享150中已用145，只余5；“继续”没有明确提高额度，因此没有越限调用。

待处理：nr027额度中断；nr028/029/030及新8共11家未运行；加前四家独立复跑，共16个完整尝试。保持每家最多2检索+5详情，最坏需追加GET112，共享上限至少提高到257。模型仍沿用本基准≤40；复跑已提议片段可固定复用，避免同一家新增第二次模型请求。复跑另存、不覆盖原轮、不混合分母。

## 逐家结果

完整搜索词、首屏认证店是否出现、所有打开详情URL及原因见results.csv。以下不省略失败、中断或未运行项；每份执行JSON有逐次请求/模型/原文绑定，评分JSON由独立进程生成。

| ID | Google名 | 结论 | 检索词 / 首屏认证店 | 原因 | 明细 |
|---|---|---|---|---|---|
|nr-001|Sushi Tatsu Shibuya|ENVIRONMENT_FAILURE|Sushi Tatsu Shibuya / MISS; Sushi Tatsu / HIT|SOURCE_TIMEOUT|[执行](execution/nr-001.json) / [评分](evaluation/nr-001.json)|
|nr-002|焼肉おおにし 祐天寺店|ENVIRONMENT_FAILURE|焼肉おおにし 祐天寺店 / HIT|SOURCE_TIMEOUT|[执行](execution/nr-002.json) / [评分](evaluation/nr-002.json)|
|nr-003|Washoku Dining Hana Kagura|ENVIRONMENT_FAILURE|Washoku Dining Hana Kagura / MISS; Hana Kagura / MISS|SOURCE_TIMEOUT|[执行](execution/nr-003.json) / [评分](evaluation/nr-003.json)|
|nr-004|鮨処 みこし|ENVIRONMENT_FAILURE|鮨処 みこし / HIT|SOURCE_TIMEOUT|[执行](execution/nr-004.json) / [评分](evaluation/nr-004.json)|
|nr-005|Ginhachi|CORRECT_ACCEPTED|Ginhachi / HIT|HIGH_EXACT_PHONE|[执行](execution/nr-005.json) / [评分](evaluation/nr-005.json)|
|nr-006|Sugata|CORRECT_ACCEPTED|Sugata / HIT|HIGH_EXACT_PHONE|[执行](execution/nr-006.json) / [评分](evaluation/nr-006.json)|
|nr-007|Wagyu beef Yakiniku Beef Kitchen Nakameguro|NOT_ACCEPTED|Wagyu beef Yakiniku Beef Kitchen Nakameguro / MISS; Beef Kitchen Nakameguro / MISS|NO_OUTLETS_PARSED|[执行](execution/nr-007.json) / [评分](evaluation/nr-007.json)|
|nr-008|Shibuya Kappo Sancho|NOT_ACCEPTED|Shibuya Kappo Sancho / MISS; Kappo Sancho / MISS|NO_OUTLETS_PARSED|[执行](execution/nr-008.json) / [评分](evaluation/nr-008.json)|
|nr-009|Naminoue shibuya|ENVIRONMENT_FAILURE|Naminoue shibuya / MISS; Naminoue / HIT|SOURCE_NETWORK_FAILED|[执行](execution/nr-009.json) / [评分](evaluation/nr-009.json)|
|nr-010|Yakitori & Obanzai SAKAMOTO|NOT_ACCEPTED|Yakitori & Obanzai SAKAMOTO / MISS; SAKAMOTO / HIT|AMBIGUOUS_TOP_MATCH|[执行](execution/nr-010.json) / [评分](evaluation/nr-010.json)|
|nr-011|日本料理 ほそ川 神楽坂|CORRECT_ACCEPTED|日本料理 ほそ川 神楽坂 / MISS; ほそ川 / HIT|HIGH_EXACT_PHONE|[执行](execution/nr-011.json) / [评分](evaluation/nr-011.json)|
|nr-012|Sushi Rizaki|CORRECT_ACCEPTED|Sushi Rizaki / HIT|HIGH_EXACT_PHONE|[执行](execution/nr-012.json) / [评分](evaluation/nr-012.json)|
|nr-013|Horumon Matsuda HANARE Yakiniku Nakameguro|ENVIRONMENT_FAILURE|Horumon Matsuda HANARE Yakiniku Nakameguro / MISS|SOURCE_NETWORK_FAILED|[执行](execution/nr-013.json) / [评分](evaluation/nr-013.json)|
|nr-014|炭火焼肉ホルモンまんてん高架下|CORRECT_ACCEPTED|炭火焼肉ホルモンまんてん高架下 / HIT|HIGH_EXACT_PHONE|[执行](execution/nr-014.json) / [评分](evaluation/nr-014.json)|
|nr-015|Sushi Yamashiro Kichijoji|ENVIRONMENT_FAILURE|Sushi Yamashiro Kichijoji / MISS; Yamashiro / HIT|SOURCE_NETWORK_FAILED|[执行](execution/nr-015.json) / [评分](evaluation/nr-015.json)|
|nr-016|焼き鳥と蕎麦 灯|CORRECT_ACCEPTED|焼き鳥と蕎麦 灯 / HIT|HIGH_EXACT_PHONE|[执行](execution/nr-016.json) / [评分](evaluation/nr-016.json)|
|nr-017|Sushi Matsumoto Shibuya|CORRECT_ACCEPTED|Sushi Matsumoto Shibuya / MISS; Sushi Matsumoto / HIT|HIGH_EXACT_PHONE|[执行](execution/nr-017.json) / [评分](evaluation/nr-017.json)|
|nr-018|Yakiniku Ushicoco Nakameguro|CORRECT_ACCEPTED|Yakiniku Ushicoco Nakameguro / MISS; Ushicoco / HIT|HIGH_EXACT_PHONE|[执行](execution/nr-018.json) / [评分](evaluation/nr-018.json)|
|nr-019|T nakameguro|NOT_ACCEPTED|T nakameguro / MISS|KNOWN_PHONE_CONFLICT|[执行](execution/nr-019.json) / [评分](evaluation/nr-019.json)|
|nr-020|Sushi kazumasa|NOT_ACCEPTED|Sushi kazumasa / HIT|KNOWN_PHONE_CONFLICT|[执行](execution/nr-020.json) / [评分](evaluation/nr-020.json)|
|nr-021|焼肉 牛目黒|CORRECT_ACCEPTED|焼肉 牛目黒 / HIT|HIGH_EXACT_PHONE|[执行](execution/nr-021.json) / [评分](evaluation/nr-021.json)|
|nr-022|Sushi and Tempura Iwai Kichijoji|NOT_ACCEPTED|Sushi and Tempura Iwai Kichijoji / MISS; Iwai / HIT|KNOWN_PHONE_CONFLICT|[执行](execution/nr-022.json) / [评分](evaluation/nr-022.json)|
|nr-024|Nakameguro Yakiniku Togyumon|CORRECT_ACCEPTED|Nakameguro Yakiniku Togyumon / HIT|HIGH_EXACT_PHONE|[执行](execution/nr-024.json) / [评分](evaluation/nr-024.json)|
|nr-025|Sumi Sushi Shibuya|NOT_ACCEPTED|Sumi Sushi Shibuya / MISS; Sumi Sushi / MISS|KNOWN_PHONE_CONFLICT|[执行](execution/nr-025.json) / [评分](evaluation/nr-025.json)|
|nr-026|Kushiyaki Bistro Fukumimi Ginza 6|NOT_ACCEPTED|Kushiyaki Bistro Fukumimi Ginza 6 / MISS; Fukumimi / HIT|KNOWN_PHONE_CONFLICT|[执行](execution/nr-026.json) / [评分](evaluation/nr-026.json)|
|nr-027|Shibuya Sushi Jinnan|INTERRUPTED|Shibuya Sushi Jinnan / HIT|BROWSER_RUNTIME_FAILED|[执行](execution/nr-027.json) / [评分](evaluation/nr-027.json)|
|nr-028|Ginza Bokujin|NOT_RUN|NOT_RUN|NOT_RUN|—|
|nr-029|焼肉 うし幸|NOT_RUN|NOT_RUN|NOT_RUN|—|
|nr-030|Sushi Nasu|NOT_RUN|NOT_RUN|NOT_RUN|—|
|G4-ND-001|Dengana Akabane|NOT_RUN|NOT_RUN|NOT_RUN|—|
|G4-ND-002|Ushigoro Bambina Carbone Nakameguro|NOT_RUN|NOT_RUN|NOT_RUN|—|
|G4-ND-003|和泉鮨南口店|NOT_RUN|NOT_RUN|NOT_RUN|—|
|G4-ND-004|Waragamo|NOT_RUN|NOT_RUN|NOT_RUN|—|
|G4-ND-005|Sen Kagurazaka|NOT_RUN|NOT_RUN|NOT_RUN|—|
|G4-ND-006|吉祥じ 和こん|NOT_RUN|NOT_RUN|NOT_RUN|—|
|G4-ND-007|Washokubiyori Osaketo Kagrazaka|NOT_RUN|NOT_RUN|NOT_RUN|—|
|G4-ND-008|Godaime Hanayama Udon Ginza|NOT_RUN|NOT_RUN|NOT_RUN|—|

## 四层评价与停止点

端到端范围仅G4身份前缀，不是Agent整单/库存，且37家覆盖不足；环节逐家保留查询、首屏、详情、HIGH核验和缺失项；独立ID核对未发现错认，未运行不计通过；归因只到有原文/轨迹支持的深度，不据结果调整规则。

本轮原始证据已提交推送，等待用户确认新增GET额度后执行未完成项和前四家独立复跑。main合入已完成，B的G3不受本评测停止影响。
