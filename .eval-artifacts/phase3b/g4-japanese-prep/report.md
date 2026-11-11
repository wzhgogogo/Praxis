# G4 方案一：Google 日文名入口与离线 4+1 准备

- Status: **draft / not integrated**。实现和模拟供复核，未接入产品检索，不是新的来源 Live 或37家真实端到端成绩。
- 时间：2026-10-29，维也纳 CET（UTC+1）。
- 分支：`codex/feat-phase3b-g4-japanese-name-prep`，从最新 main `00519783` 创建，继承已复核的 `da8d054b` 分析。
- 实现及执行输入冻结提交：`57bd09a5`，855 项 SHA；事后清单和独立核验另有49项冻结。本轮模型、Google、评测 GET、完整 Live、环境重跑新增全部 **0**，不读取或加载 `.env`。共享 GET **244/257，剩余13**，账本字节不变。

## 1. 已交付的 Google 入口

[GooglePlacesClient.japaneseNamesForRun](../../../src/integrations/google/google-places-client.ts) 创建一个运行内读者，两个来源应持有同一个读者。读者按规范化的原 Place ID 共享 Promise，包含正在进行的请求和失败；另一个来源不会偷偷重试。新运行创建新读者，互不共用缓存；运行取消后拒绝新读取。结果只存公开的名称和来源ID，内存对象冻结，不持久化。

请求固定为同ID的 `GET /v1/places/{id}?languageCode=ja`，掩码精确为 `id,displayName`。核对响应ID等于原ID、原文非空；错误ID、空文、错误语言字段类型都拒绝。保留原文，记录返回的实际语言码，缺失时为 `null`，不因请求了ja就编造响应语言为ja。它不修改原 Google 候选、身份规则或原 `placeDetails` 的其他使用者。

三份模块fixture由已保存的 Sancho/T/Sumi Google 原件投影而来，保留原路径和 SHA，预期名称逐字独立断言。客户端只使用注入的 fixture fetch，没有读取凭据或连接 Google。[fixture](../../../src/integrations/google/fixtures/japanese-place-names.json)、[合同测试](../../../src/integrations/google/google-places-client.test.ts)

有效红灯：旧 `placeDetails` 实际请求得到 `languageCode=null`，与期望ja不等；不是类型、导入或入口缺失错误。新入口用同样的外部请求断言转绿，同时核对最小掩码。三组新测试覆盖三原件、同运行并发共享/跨运行隔离、错误ID/空文/实际语言/取消/失败不重试。[红绿记录](red-green.json)、[原始红灯](google-red.log)、[绿灯](google-green.log)

现在没有生产调用方注入该读者，未增加真实请求。未来两个来源必须共用一次运行的读者并在真正发送请求前记账；本批没有新建计费或预算旁路。

## 2. 4+1 仅在评测层

[模拟器](../../../src/eval/restaurant/search-fixture/named-retrieval-simulation.ts) 只复用当前生产的列表解析、排序、片段逐字核对和身份比较，不调用或修改 `TabelogBrowserAvailability`。原名 → 一个合法片段 → 同ID日文全名，按NFKC/空白/大小写去重；原名与片段累计至多4个详情，给日文词保留第5个。日文词重复、没有新候选或没有用完剩余名额时，余量退给先前已观察且未打开的候选，总数不重置。

合法片段仍必须是 Google 原名的真子串；完整原名、地址片段、不在原文的词不放行。模型用旧已保存响应作显式Replay，不宣称验证了当前 Prompt@3 的真实选词质量。没有捕获模型响应、日文名、来源页面或列表结构核对失败，结果都为 **未评**，不当作“模型没有合法片段”或“日文名不存在”。可继续列出附带条件的候选前沿，但这些分支不能生成已核实接纳。

来源 GET 被替换为冻结原件，渲染使用本地禁JS Chromium、所有外部资源请求阻断；全局fetch拒绝网络。Google入口也只喂已有响应。认证ID仅在独立事后评分进程读取，不进入候选、检索、排序或模型输入。完整原文路径、SHA、请求顺序和未知原因在 [execution/](execution/) 下。

### 不退化结论与分母

- 原有 **23/23** 接纳保留，nr-010/022/026 **3/3** 保留，独立核验错认 **0**。
- 37家主视图：22正确接纳、15未评；额外4份独立复跑：4正确接纳。合计41个冻结尝试视图，26个接纳均核对来源域名/路径、认证ID和已读取详情原文SHA。
- “原有23”来自旧基准19个首次接纳加4个独立复跑，不能写成37家首次运行中已有23个。逐家表保留主视图及复跑分母；未评没有算入通过。
- 当前保存语料没有“认证店恰在原第5个详情”的案例（0例），本次实际挤占为0；不能据此泛化为4+1永不挤掉正确店。
- 独立控制测试证明：日文词重复时退回第5个名额，原第5个正确店可接纳；日文词占用第5个名额时，确实可能挤掉它并导致未接纳。这是合成机制控制，不计入37家成绩。缺页/缺提议控制不能伪装成功。[评测测试](../../../src/eval/restaurant/search-fixture/named-retrieval-simulation.test.ts)

[逐项评分](evaluation.json) 与 [独立严格URL/原文核验](independent-verification.json) 分开保存。身份比较、地址、电话、分店和楼层规则原字节不变，既有反例全部随默认门禁保留。

### 四个待改善样本

| 样本 | 本次冻结模拟的观察 | 当前结论 |
| --- | --- | --- |
| nr-007 Beef Kitchen | 原名和已捕获片段都为空；未读取日文名，因此没有日文首屏或其候选URL | 未评；不得用旧认证页上的日文名倒灌检索 |
| nr-008 Sancho | 日文首屏认证店排序第1；缺该详情1页 | 未评；缺页不是身份通过 |
| nr-019 T | 原名用掉4个名额；旧运行没有片段提议；日文首屏认证店排序第6，剩余1个名额选到另一候选；缺4页 | 未评；**现有4+1及排序没有把认证店纳入详情计划**，不能承诺补页后能找回T |
| nr-025 Sumi | 日文首屏认证店排序第1；原名/片段阶段缺2页、日文详情缺1页 | 未评；共缺3页 |

T 的“认证店已在日文首屏”仍然不等于能找到并接纳。现在不改变排序或名额、不把认证ID提到前面、不编造一个空模型响应跳过片段。该问题交复核决定下一步。

### 逐家主视图

下表“原23”只标记该主视图本身的旧接纳；另外4份复跑另列。具体查询、逐页原文及未知字段可从对应执行JSON复查。

| ID / name | Prior23 / focus3 | Queries in order | Details | Result / uncertainty |
| --- | --- | --- | --- | --- |
| nr-001 / Sushi Tatsu Shibuya | - | ORIGINAL: Sushi Tatsu Shibuya -> FRAGMENT: Sushi Tatsu | 5 | NOT_EVALUATED / DETAIL, UNRECORDED_JAPANESE_NAME |
| nr-002 / 焼肉おおにし 祐天寺店 | - | ORIGINAL: 焼肉おおにし 祐天寺店 | 1 | NOT_EVALUATED / DETAIL, UNRECORDED_FRAGMENT_PROPOSAL, UNRECORDED_JAPANESE_NAME |
| nr-003 / Washoku Dining Hana Kagura | - | ORIGINAL: Washoku Dining Hana Kagura -> FRAGMENT: Hana Kagura -> JAPANESE: 花かぐら | 0 | NOT_EVALUATED / FRAGMENT_SEARCH, JAPANESE_SEARCH |
| nr-004 / 鮨処 みこし | - | ORIGINAL: 鮨処 みこし | 3 | NOT_EVALUATED / DETAIL, UNRECORDED_FRAGMENT_PROPOSAL, UNRECORDED_JAPANESE_NAME |
| nr-005 / Ginhachi | prior23 | ORIGINAL: Ginhachi | 4 | CORRECT_ACCEPTED |
| nr-006 / Sugata | prior23 | ORIGINAL: Sugata | 4 | CORRECT_ACCEPTED |
| nr-007 / Wagyu beef Yakiniku Beef Kitchen Nakameguro | - | ORIGINAL: Wagyu beef Yakiniku Beef Kitchen Nakameguro -> FRAGMENT: Beef Kitchen Nakameguro | 0 | NOT_EVALUATED / UNRECORDED_JAPANESE_NAME |
| nr-008 / Shibuya Kappo Sancho | - | ORIGINAL: Shibuya Kappo Sancho -> FRAGMENT: Kappo Sancho -> JAPANESE: 割烹 三長 渋谷 | 1 | NOT_EVALUATED / DETAIL |
| nr-009 / Naminoue shibuya | - | ORIGINAL: Naminoue shibuya -> FRAGMENT: Naminoue | 5 | NOT_EVALUATED / DETAIL, UNRECORDED_JAPANESE_NAME |
| nr-010 / Yakitori & Obanzai SAKAMOTO | focus3 | ORIGINAL: Yakitori & Obanzai SAKAMOTO -> FRAGMENT: SAKAMOTO | 4 | CORRECT_ACCEPTED |
| nr-011 / 日本料理 ほそ川 神楽坂 | prior23 | ORIGINAL: 日本料理 ほそ川 神楽坂 -> FRAGMENT: ほそ川 | 4 | CORRECT_ACCEPTED |
| nr-012 / Sushi Rizaki | prior23 | ORIGINAL: Sushi Rizaki | 4 | CORRECT_ACCEPTED |
| nr-013 / Horumon Matsuda HANARE Yakiniku Nakameguro | - | ORIGINAL: Horumon Matsuda HANARE Yakiniku Nakameguro -> JAPANESE: 焼肉はなれ-よし-「旧ホルモン松田HANARE」 | 1 | NOT_EVALUATED / ORIGINAL_SEARCH, UNRECORDED_FRAGMENT_PROPOSAL, DETAIL |
| nr-014 / 炭火焼肉ホルモンまんてん高架下 | prior23 | ORIGINAL: 炭火焼肉ホルモンまんてん高架下 | 1 | CORRECT_ACCEPTED |
| nr-015 / Sushi Yamashiro Kichijoji | - | ORIGINAL: Sushi Yamashiro Kichijoji -> FRAGMENT: Yamashiro | 5 | NOT_EVALUATED / DETAIL, UNRECORDED_JAPANESE_NAME |
| nr-016 / 焼き鳥と蕎麦 灯 | prior23 | ORIGINAL: 焼き鳥と蕎麦 灯 | 3 | CORRECT_ACCEPTED |
| nr-017 / Sushi Matsumoto Shibuya | prior23 | ORIGINAL: Sushi Matsumoto Shibuya -> FRAGMENT: Sushi Matsumoto | 4 | CORRECT_ACCEPTED |
| nr-018 / Yakiniku Ushicoco Nakameguro | prior23 | ORIGINAL: Yakiniku Ushicoco Nakameguro -> FRAGMENT: Ushicoco | 4 | CORRECT_ACCEPTED |
| nr-019 / T nakameguro | - | ORIGINAL: T nakameguro -> JAPANESE: T 中目黒 | 5 | NOT_EVALUATED / DETAIL, UNRECORDED_FRAGMENT_PROPOSAL |
| nr-020 / Sushi kazumasa | - | ORIGINAL: Sushi kazumasa | 2 | NOT_EVALUATED / UNRECORDED_JAPANESE_NAME |
| nr-021 / 焼肉 牛目黒 | prior23 | ORIGINAL: 焼肉 牛目黒 | 1 | CORRECT_ACCEPTED |
| nr-022 / Sushi and Tempura Iwai Kichijoji | focus3 | ORIGINAL: Sushi and Tempura Iwai Kichijoji -> FRAGMENT: Iwai | 4 | CORRECT_ACCEPTED |
| nr-024 / Nakameguro Yakiniku Togyumon | prior23 | ORIGINAL: Nakameguro Yakiniku Togyumon | 1 | CORRECT_ACCEPTED |
| nr-025 / Sumi Sushi Shibuya | - | ORIGINAL: Sumi Sushi Shibuya -> FRAGMENT: Sumi Sushi -> JAPANESE: 渋谷 鮨墨 | 5 | NOT_EVALUATED / DETAIL |
| nr-026 / Kushiyaki Bistro Fukumimi Ginza 6 | focus3 | ORIGINAL: Kushiyaki Bistro Fukumimi Ginza 6 -> FRAGMENT: Fukumimi | 4 | CORRECT_ACCEPTED |
| nr-027 / Shibuya Sushi Jinnan | prior23 | ORIGINAL: Shibuya Sushi Jinnan | 1 | CORRECT_ACCEPTED |
| nr-028 / Ginza Bokujin | prior23 | ORIGINAL: Ginza Bokujin | 1 | CORRECT_ACCEPTED |
| nr-029 / 焼肉 うし幸 | - | ORIGINAL: 焼肉 うし幸 | 5 | NOT_EVALUATED / UNRECORDED_FRAGMENT_PROPOSAL, UNRECORDED_JAPANESE_NAME |
| nr-030 / Sushi Nasu | prior23 | ORIGINAL: Sushi Nasu | 4 | CORRECT_ACCEPTED |
| G4-ND-001 / Dengana Akabane | prior23 | ORIGINAL: Dengana Akabane -> FRAGMENT: Dengana | 4 | CORRECT_ACCEPTED |
| G4-ND-002 / Ushigoro Bambina Carbone Nakameguro | - | ORIGINAL: Ushigoro Bambina Carbone Nakameguro -> FRAGMENT: Ushigoro Bambina -> JAPANESE: 炭火焼肉ホルモンうしごろ 中目黒店 | 5 | NOT_EVALUATED / DETAIL |
| G4-ND-003 / 和泉鮨南口店 | prior23 | ORIGINAL: 和泉鮨南口店 | 3 | CORRECT_ACCEPTED |
| G4-ND-004 / Waragamo | prior23 | ORIGINAL: Waragamo | 4 | CORRECT_ACCEPTED |
| G4-ND-005 / Sen Kagurazaka | - | ORIGINAL: Sen Kagurazaka | 0 | NOT_EVALUATED / UNRECORDED_JAPANESE_NAME |
| G4-ND-006 / 吉祥じ 和こん | prior23 | ORIGINAL: 吉祥じ 和こん | 1 | CORRECT_ACCEPTED |
| G4-ND-007 / Washokubiyori Osaketo Kagrazaka | prior23 | ORIGINAL: Washokubiyori Osaketo Kagrazaka -> FRAGMENT: Washokubiyori | 4 | CORRECT_ACCEPTED |
| G4-ND-008 / Godaime Hanayama Udon Ginza | prior23 | ORIGINAL: Godaime Hanayama Udon Ginza -> FRAGMENT: Hanayama Udon | 3 | CORRECT_ACCEPTED |

### 四份额外冻结复跑

| ID / name | Prior23 / focus3 | Queries in order | Details | Result / uncertainty |
| --- | --- | --- | --- | --- |
| nr-001 / Sushi Tatsu Shibuya | prior23 | ORIGINAL: Sushi Tatsu Shibuya -> FRAGMENT: Sushi Tatsu | 4 | CORRECT_ACCEPTED |
| nr-002 / 焼肉おおにし 祐天寺店 | prior23 | ORIGINAL: 焼肉おおにし 祐天寺店 | 1 | CORRECT_ACCEPTED |
| nr-003 / Washoku Dining Hana Kagura | prior23 | ORIGINAL: Washoku Dining Hana Kagura -> FRAGMENT: Hana Kagura | 4 | CORRECT_ACCEPTED |
| nr-004 / 鮨処 みこし | prior23 | ORIGINAL: 鮨処 みこし | 3 | CORRECT_ACCEPTED |

## 3. 缺页清单：8个已知URL已物化，Beef仍需来源绑定

[request-plan.json](request-plan.json) 是**不可执行的条件前沿**，不是完整精确GET列表。清单生成器只读执行侧已观察链接，**不读取Gold**；8个已知详情URL、它们出现在哪份首屏原文、SHA、阶段和请求先决条件均已物化。Google的原Place ID请求也已写成精确URL。

| Request | Sample / phase | Exact observed URL | Source bytes |
| --- | --- | --- | --- |
| KNOWN-DETAIL-01 | nr-008 / JAPANESE | [https://tabelog.com/en/tokyo/A1303/A130301/13160273/](https://tabelog.com/en/tokyo/A1303/A130301/13160273/) | `059089e56d40` |
| KNOWN-DETAIL-02 | nr-019 / FIRST_FOUR | [https://tabelog.com/en/tokyo/A1317/A131701/13251507/](https://tabelog.com/en/tokyo/A1317/A131701/13251507/) | `9282078ecba2` |
| KNOWN-DETAIL-03 | nr-019 / FIRST_FOUR | [https://tabelog.com/en/tokyo/A1317/A131701/13312101/](https://tabelog.com/en/tokyo/A1317/A131701/13312101/) | `9282078ecba2` |
| KNOWN-DETAIL-04 | nr-019 / FIRST_FOUR | [https://tabelog.com/en/tokyo/A1317/A131701/13244534/](https://tabelog.com/en/tokyo/A1317/A131701/13244534/) | `9282078ecba2` |
| KNOWN-DETAIL-05 | nr-019 / JAPANESE | [https://tabelog.com/en/tokyo/A1317/A131701/13295672/](https://tabelog.com/en/tokyo/A1317/A131701/13295672/) | `9143d3c62166` |
| KNOWN-DETAIL-06 | nr-025 / FIRST_FOUR | [https://tabelog.com/en/tokyo/A1322/A132205/13070885/](https://tabelog.com/en/tokyo/A1322/A132205/13070885/) | `c3f4114efcd0` |
| KNOWN-DETAIL-07 | nr-025 / FIRST_FOUR | [https://tabelog.com/en/tokyo/A1312/A131205/13071787/](https://tabelog.com/en/tokyo/A1312/A131205/13071787/) | `c3f4114efcd0` |
| KNOWN-DETAIL-08 | nr-025 / JAPANESE | [https://tabelog.com/en/tokyo/A1303/A130301/13293469/](https://tabelog.com/en/tokyo/A1303/A130301/13293469/) | `92743b2bc9f9` |

Beef的三个尚未具备的来源输入必须如实保留：

1. 同ID Google ja名称尚未读取，所以Beef搜索URL的 `sw` 只能绑定未来返回的原文，当前URL为 `null`，没有写一个猜测的日文名或模板冒充已物化URL。
2. 首屏尚未读取，所以最多5个详情URL也为 `null`；只能来自未来首屏实际观察到并按原规则排序的链接，不能来自认证ID或旧认证详情。
3. T未捕获片段提议，当前日文分支是附带未知条件的前沿；需要单独认可的Replay输入，或继续保留未评，不能把缺失写成模型明确拒绝。

未来获得来源后须分阶段补齐原文SHA、Beef精确搜索URL和实际候选详情URL，并冻结一个符合预算的列表交复核。本轮没有获取这些输入，因此**不能宣称完整精确清单已经就绪**。

### 额度保持原上限

8个已知缺页，加上Beef最多5个详情，最坏为13次详情GET；再加Beef首屏1次，最坏14 GET。授权仍是 **Google≤1、网站GET≤13，其中详情≤12**，没有提高到14。若8个已知页全部需要，Beef仅有4个详情的余额；它若需要第5个，或其他路径提前改变，剩余项必须记未评并在请求前停下，不能追加额度，也不能删掉验收所需页面来冒充完整路径。

所有条目都是“此前尚未确认同店且名额/共享额度仍有余量”才可能请求，不能把8个已知页和5个未知页无条件全部执行。实际需要可能少于最坏数，当前没有来源证据能保证四家全部在13次内完成。计划明确标为 `NOT_EXECUTABLE_UNTIL_SOURCE_BINDING_AND_REVIEW`；不含可执行fetch Runner。

未来公开GET仍是20秒、间隔至少30秒、不带Cookie、不跟跳转、失败不重试；本轮没有发出任何此类请求。G3合main及另行批准前，不接产品、不加载凭据、不实测。

## 4. 门禁与交付边界

冻结提交57bd09a5：typecheck、arch:check、npm test **1216/1216**、build、Chromium **175/175** 全绿；额外 `test:dom-change` **5/5**。包含模拟和独立评分在内10步全部前后 `git status` 为空，855项SHA首尾一致，没有restore或重试门禁。[gates.json](gates.json)

B三个文件、整个产品Tabelog浏览器路径、两站page-parser、身份比较、站点Skill/Guard、现行两次检索合同、Agent/Semantic Prompt、Proposal Schema、State/TaskDefinition、迁移、共享预算均未改。评测层新增两个文件为本次用户明确授权的模拟范围，未改G2评分器、变异或Gold。新增的Google原始响应语言字段和名称结果为本地类型，不占用共享Schema版本。

报告、请求前沿及事后核验生成后，产品源码与测试冻结提交不再变化，故按Test矩阵不重复产品门禁。最后离线复核命令：

```sh
python3 -B .eval-artifacts/phase3b/g4-japanese-prep/verify.py
python3 -B .eval-artifacts/phase3b/g4-japanese-prep/materialize-missing.py --verify-only
python3 -B .eval-artifacts/phase3b/g4-japanese-prep/verify-results.py --verify-only
```

能力边界：本次证明Google客户端外部请求合同及冻结来源下的4+1模拟不退化，不能证明当前来源连接、真实模型选词、T被修复、四家身份通过或产品G3接线。以上缺口和预算边界随本分支交复核；推分支后停止，不合main。
