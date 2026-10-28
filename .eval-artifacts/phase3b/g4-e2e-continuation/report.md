# G4 端到端身份基准续跑

Evidence: frozen exposed regression; not Clean Holdout. Vienna CET, UTC+1.

16次计划尝试已全部完成，错认0。结果分母保持运行前口径：

|视图|正确接纳|未接纳|环境失败|合计|
|---|---:|---:|---:|---:|
|旧29（原批＋12家续跑中的旧4，保留首次前四家）|13|9|7|29|
|新8|6|1|1|8|
|前四家独立复跑|4|0|0|4|

新增73/112 GET、5真实模型，另2份冻结响应Replay；本基准累计188 GET/19模型，共享GET218/257。完整性PASS，凭据仅由Node runner加载。逐家检索词/详情/原因见[CSV](results.csv)，复核可运行文末只读命令。

## 运行前冻结计划与授权

用户批准追加至多112次GET，3b共享GET上限由150增至257。原批115 GET、14模型、Google/Live0的原件与评分全部原样保留。本切片仅补齐额度中断的nr-027及11个未运行输入，然后单独复跑nr-001至004；16次完整尝试的顺序预先冻结。原批nr-027部分尝试不纳入37家完成视图但仍独立保留；原前四家环境失败仍保留在首次视图，复跑单列，禁止挑最好结果拼分母。

生产代码固定main b250bb175bbe080c8b29a298a5aa5a6090f0d461，与原批相同；不因评测结果更改身份、检索、Gold或评分。调用原Tabelog生产检索、片段提议、详情与身份代码；HTTP原文投影到禁止JavaScript和网络的本地Chromium，只测身份前缀，不测完整浏览器Agent任务或库存。认证ID只在事后独立评分子进程读取，从不进入查询或Prompt。原Google字段逐字复用且隐藏直链。

新增GET<=112且共享<=257；所有失败也计数，上一请求结束后至少30秒才发下一个GET，20秒超时、不跟随跳转、不带Cookie、失败不重试。每家两次检索、五个详情上限不变。错认立即停；连续三次网络失败停；模型基础设施失败或额度耗尽停。Google/Live均0。本基准真实模型原14+新增累计<=40，同一家累计最多一次真实片段调用。复跑如需nr-001/003的片段，使用冻结的原次同输入模型响应，明确标为Replay，不重复付费，不冒充新真实模型结果。

以下为运行前计划记录：先提交并冻结输入、编排、复用评分器、重放响应与生产SHA，通过离线边界控制后净树启动。复用此前ccf7aa5d六项全绿；本次不改src/scripts/package与产品版本，不用重复产品门禁代替本次真实数据评测。最终按四层报告逐家查询/首屏/详情/接纳与失败阶段，旧29、新8、复跑4各自报告；资源含所有尝试。只推证据分支供复核，不在本切片合main。

离线验证：原账本全部条目与累计保留，新增授权条目计数0；676个冻结SHA核对通过，输入仅加尝试类型；node语法、复用评分器正负/环境控制、112/257/40额度、同店调用与同输入Replay、三超时停批/不重试/身份边界均通过。未加载凭据，真实调用0。详细见offline-verification.json。

## 执行结果（2026-10-28T09:12:39.073982+01:00）

冻结提交 `3a7770e7fa247012be1c59701cfe63b304ce4f52`。停止原因 `PLANNED_ATTEMPTS_COMPLETE`。新增73/112 GET、5真实模型、2份同输入模型响应Replay；本基准累计188 GET、19/40真实模型，Google/Live0。3b共享GET 218/257、真实模型59/1000。资源包含所有原始、额度中断与复跑尝试，不因环境失败扣除。

37家主视图：旧29 ENVIRONMENT_FAILURE 7；CORRECT_ACCEPTED 13；NOT_ACCEPTED 9；新8 CORRECT_ACCEPTED 6；ENVIRONMENT_FAILURE 1；NOT_ACCEPTED 1。首次前四家环境失败原样保留；只用获批续跑补齐nr027的额度中断和11家原未运行输入。原nr027部分尝试另存不删除。前四家复跑独立分母4：CORRECT_ACCEPTED 4，不得混为37家首次结果或挑最好一次。

这是Tabelog生产身份前缀的HTTP评测，页面由JS禁用、网络全阻断的本地Chromium读取；不代表完整浏览器Agent/查位任务，也没有Google新检索、TableCheck或库存结论。旧保存页12/29、新8首屏7/8与旧样本11/12不参与本次端到端计分。环境失败不算身份未接纳，未运行与中断各自保留。所有输入已暴露，不能推断Clean Holdout或长期成功率。

## 逐家结果

完整检索词、认证店首屏是否出现、每个打开的详情URL、身份结论和失败阶段见[CSV](results.csv)及[汇总JSON](combined-evaluation-summary.json)。每行独立评分均重新用原冻结score函数核对；查询与详情绑定原响应SHA。

|视图|ID|Google名|结论|查询 / 首屏认证店|原因/阶段|执行与评分|
|---|---|---|---|---|---|---|
|37家|nr-001|Sushi Tatsu Shibuya|ENVIRONMENT_FAILURE|Sushi Tatsu Shibuya / MISS; Sushi Tatsu / HIT|SOURCE_TIMEOUT|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-001.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-001.json)|
|37家|nr-002|焼肉おおにし 祐天寺店|ENVIRONMENT_FAILURE|焼肉おおにし 祐天寺店 / HIT|SOURCE_TIMEOUT|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-002.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-002.json)|
|37家|nr-003|Washoku Dining Hana Kagura|ENVIRONMENT_FAILURE|Washoku Dining Hana Kagura / MISS; Hana Kagura / MISS|SOURCE_TIMEOUT|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-003.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-003.json)|
|37家|nr-004|鮨処 みこし|ENVIRONMENT_FAILURE|鮨処 みこし / HIT|SOURCE_TIMEOUT|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-004.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-004.json)|
|37家|nr-005|Ginhachi|CORRECT_ACCEPTED|Ginhachi / HIT|HIGH_EXACT_PHONE|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-005.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-005.json)|
|37家|nr-006|Sugata|CORRECT_ACCEPTED|Sugata / HIT|HIGH_EXACT_PHONE|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-006.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-006.json)|
|37家|nr-007|Wagyu beef Yakiniku Beef Kitchen Nakameguro|NOT_ACCEPTED|Wagyu beef Yakiniku Beef Kitchen Nakameguro / MISS; Beef Kitchen Nakameguro / MISS|EMPTY_OR_TARGET_ABSENT_FIRST_PAGE|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-007.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-007.json)|
|37家|nr-008|Shibuya Kappo Sancho|NOT_ACCEPTED|Shibuya Kappo Sancho / MISS; Kappo Sancho / MISS|EMPTY_OR_TARGET_ABSENT_FIRST_PAGE|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-008.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-008.json)|
|37家|nr-009|Naminoue shibuya|ENVIRONMENT_FAILURE|Naminoue shibuya / MISS; Naminoue / HIT|SOURCE_NETWORK_FAILED|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-009.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-009.json)|
|37家|nr-010|Yakitori & Obanzai SAKAMOTO|NOT_ACCEPTED|Yakitori & Obanzai SAKAMOTO / MISS; SAKAMOTO / HIT|TARGET_OUTSIDE_DETAIL_CAP|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-010.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-010.json)|
|37家|nr-011|日本料理 ほそ川 神楽坂|CORRECT_ACCEPTED|日本料理 ほそ川 神楽坂 / MISS; ほそ川 / HIT|HIGH_EXACT_PHONE|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-011.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-011.json)|
|37家|nr-012|Sushi Rizaki|CORRECT_ACCEPTED|Sushi Rizaki / HIT|HIGH_EXACT_PHONE|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-012.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-012.json)|
|37家|nr-013|Horumon Matsuda HANARE Yakiniku Nakameguro|ENVIRONMENT_FAILURE|Horumon Matsuda HANARE Yakiniku Nakameguro / MISS|SOURCE_NETWORK_FAILED|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-013.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-013.json)|
|37家|nr-014|炭火焼肉ホルモンまんてん高架下|CORRECT_ACCEPTED|炭火焼肉ホルモンまんてん高架下 / HIT|HIGH_EXACT_PHONE|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-014.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-014.json)|
|37家|nr-015|Sushi Yamashiro Kichijoji|ENVIRONMENT_FAILURE|Sushi Yamashiro Kichijoji / MISS; Yamashiro / HIT|SOURCE_NETWORK_FAILED|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-015.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-015.json)|
|37家|nr-016|焼き鳥と蕎麦 灯|CORRECT_ACCEPTED|焼き鳥と蕎麦 灯 / HIT|HIGH_EXACT_PHONE|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-016.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-016.json)|
|37家|nr-017|Sushi Matsumoto Shibuya|CORRECT_ACCEPTED|Sushi Matsumoto Shibuya / MISS; Sushi Matsumoto / HIT|HIGH_EXACT_PHONE|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-017.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-017.json)|
|37家|nr-018|Yakiniku Ushicoco Nakameguro|CORRECT_ACCEPTED|Yakiniku Ushicoco Nakameguro / MISS; Ushicoco / HIT|HIGH_EXACT_PHONE|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-018.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-018.json)|
|37家|nr-019|T nakameguro|NOT_ACCEPTED|T nakameguro / MISS|EMPTY_OR_TARGET_ABSENT_FIRST_PAGE|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-019.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-019.json)|
|37家|nr-020|Sushi kazumasa|NOT_ACCEPTED|Sushi kazumasa / HIT|MODEL_FRAGMENT_REJECTED|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-020.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-020.json)|
|37家|nr-021|焼肉 牛目黒|CORRECT_ACCEPTED|焼肉 牛目黒 / HIT|HIGH_EXACT_PHONE|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-021.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-021.json)|
|37家|nr-022|Sushi and Tempura Iwai Kichijoji|NOT_ACCEPTED|Sushi and Tempura Iwai Kichijoji / MISS; Iwai / HIT|TARGET_OUTSIDE_DETAIL_CAP|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-022.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-022.json)|
|37家|nr-024|Nakameguro Yakiniku Togyumon|CORRECT_ACCEPTED|Nakameguro Yakiniku Togyumon / HIT|HIGH_EXACT_PHONE|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-024.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-024.json)|
|37家|nr-025|Sumi Sushi Shibuya|NOT_ACCEPTED|Sumi Sushi Shibuya / MISS; Sumi Sushi / MISS|EMPTY_OR_TARGET_ABSENT_FIRST_PAGE|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-025.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-025.json)|
|37家|nr-026|Kushiyaki Bistro Fukumimi Ginza 6|NOT_ACCEPTED|Kushiyaki Bistro Fukumimi Ginza 6 / MISS; Fukumimi / HIT|TARGET_OUTSIDE_DETAIL_CAP|[执行](../../../.eval-artifacts/phase3b/g4-e2e/execution/nr-026.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e/evaluation/nr-026.json)|
|37家|nr-027|Shibuya Sushi Jinnan|CORRECT_ACCEPTED|Shibuya Sushi Jinnan / HIT|HIGH_EXACT_PHONE|[执行](../../../.eval-artifacts/phase3b/g4-e2e-continuation/execution/nr-027.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e-continuation/evaluation/nr-027.json)|
|37家|nr-028|Ginza Bokujin|CORRECT_ACCEPTED|Ginza Bokujin / HIT|HIGH_EXACT_PHONE|[执行](../../../.eval-artifacts/phase3b/g4-e2e-continuation/execution/nr-028.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e-continuation/evaluation/nr-028.json)|
|37家|nr-029|焼肉 うし幸|NOT_ACCEPTED|焼肉 うし幸 / HIT|IDENTITY_FIELDS_CONFLICT|[执行](../../../.eval-artifacts/phase3b/g4-e2e-continuation/execution/nr-029.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e-continuation/evaluation/nr-029.json)|
|37家|nr-030|Sushi Nasu|CORRECT_ACCEPTED|Sushi Nasu / HIT|HIGH_EXACT_PHONE|[执行](../../../.eval-artifacts/phase3b/g4-e2e-continuation/execution/nr-030.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e-continuation/evaluation/nr-030.json)|
|37家|G4-ND-001|Dengana Akabane|CORRECT_ACCEPTED|Dengana Akabane / MISS; Dengana / HIT|HIGH_EXACT_PHONE|[执行](../../../.eval-artifacts/phase3b/g4-e2e-continuation/execution/G4-ND-001.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e-continuation/evaluation/G4-ND-001.json)|
|37家|G4-ND-002|Ushigoro Bambina Carbone Nakameguro|ENVIRONMENT_FAILURE|Ushigoro Bambina Carbone Nakameguro / MISS; Ushigoro Bambina / MISS|SOURCE_NETWORK_FAILED|[执行](../../../.eval-artifacts/phase3b/g4-e2e-continuation/execution/G4-ND-002.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e-continuation/evaluation/G4-ND-002.json)|
|37家|G4-ND-003|和泉鮨南口店|CORRECT_ACCEPTED|和泉鮨南口店 / HIT|HIGH_EXACT_PHONE|[执行](../../../.eval-artifacts/phase3b/g4-e2e-continuation/execution/G4-ND-003.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e-continuation/evaluation/G4-ND-003.json)|
|37家|G4-ND-004|Waragamo|CORRECT_ACCEPTED|Waragamo / HIT|HIGH_EXACT_PHONE|[执行](../../../.eval-artifacts/phase3b/g4-e2e-continuation/execution/G4-ND-004.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e-continuation/evaluation/G4-ND-004.json)|
|37家|G4-ND-005|Sen Kagurazaka|NOT_ACCEPTED|Sen Kagurazaka / MISS|MODEL_FRAGMENT_REJECTED|[执行](../../../.eval-artifacts/phase3b/g4-e2e-continuation/execution/G4-ND-005.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e-continuation/evaluation/G4-ND-005.json)|
|37家|G4-ND-006|吉祥じ 和こん|CORRECT_ACCEPTED|吉祥じ 和こん / HIT|HIGH_EXACT_PHONE|[执行](../../../.eval-artifacts/phase3b/g4-e2e-continuation/execution/G4-ND-006.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e-continuation/evaluation/G4-ND-006.json)|
|37家|G4-ND-007|Washokubiyori Osaketo Kagrazaka|CORRECT_ACCEPTED|Washokubiyori Osaketo Kagrazaka / MISS; Washokubiyori / HIT|HIGH_EXACT_PHONE|[执行](../../../.eval-artifacts/phase3b/g4-e2e-continuation/execution/G4-ND-007.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e-continuation/evaluation/G4-ND-007.json)|
|37家|G4-ND-008|Godaime Hanayama Udon Ginza|CORRECT_ACCEPTED|Godaime Hanayama Udon Ginza / MISS; Hanayama Udon / HIT|HIGH_EXACT_PHONE|[执行](../../../.eval-artifacts/phase3b/g4-e2e-continuation/execution/G4-ND-008.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e-continuation/evaluation/G4-ND-008.json)|
|前四复跑|nr-001|Sushi Tatsu Shibuya|CORRECT_ACCEPTED|Sushi Tatsu Shibuya / MISS; Sushi Tatsu / HIT|HIGH_EXACT_PHONE|[执行](../../../.eval-artifacts/phase3b/g4-e2e-continuation/execution/nr-001.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e-continuation/evaluation/nr-001.json)|
|前四复跑|nr-002|焼肉おおにし 祐天寺店|CORRECT_ACCEPTED|焼肉おおにし 祐天寺店 / HIT|HIGH_EXACT_PHONE|[执行](../../../.eval-artifacts/phase3b/g4-e2e-continuation/execution/nr-002.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e-continuation/evaluation/nr-002.json)|
|前四复跑|nr-003|Washoku Dining Hana Kagura|CORRECT_ACCEPTED|Washoku Dining Hana Kagura / MISS; Hana Kagura / HIT|HIGH_EXACT_PHONE|[执行](../../../.eval-artifacts/phase3b/g4-e2e-continuation/execution/nr-003.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e-continuation/evaluation/nr-003.json)|
|前四复跑|nr-004|鮨処 みこし|CORRECT_ACCEPTED|鮨処 みこし / HIT|HIGH_EXACT_PHONE|[执行](../../../.eval-artifacts/phase3b/g4-e2e-continuation/execution/nr-004.json) / [评分](../../../.eval-artifacts/phase3b/g4-e2e-continuation/evaluation/nr-004.json)|

## 四层评价与边界

端到端：只评价同店身份前缀，按旧29/新8/复跑4分母分别报告；完整用户预约目标未评。环节：查询、独立首屏命中、实际详情、生产比较器与拒绝理由逐家可复查。独立核验：认证rst_id只在事后评分进程使用，接纳必须对上认证ID，原文SHA与请求节奏全部核对。归因：未接纳按原冻结阶段口径统计，生产原因与独立到达阶段分开，不把环境连接失败算模型或身份错误。

未接纳阶段：{"OLD29": {"EMPTY_OR_TARGET_ABSENT_FIRST_PAGE": 4, "TARGET_OUTSIDE_DETAIL_CAP": 3, "MODEL_FRAGMENT_REJECTED": 1, "IDENTITY_FIELDS_CONFLICT": 1}, "NEW8": {"MODEL_FRAGMENT_REJECTED": 1}}。

阶段说明：EMPTY_OR_TARGET_ABSENT_FIRST_PAGE＝本轮首屏未核实到认证店（空结果或未出现）；TARGET_OUTSIDE_DETAIL_CAP＝首屏有认证店，但它未进入实际打开的至多五个详情；MODEL_FRAGMENT_REJECTED＝模型未给出通过既有片段校验的不同检索词（可能返回原名、空片段或非逐字片段），未发起替代请求；IDENTITY_FIELDS_CONFLICT＝认证店详情已读，但同字段身份信息明确冲突；IDENTITY_NOT_ACCEPTED＝已到认证店详情，身份仍未达到接纳门槛。生产原因码如KNOWN_PHONE_CONFLICT或AMBIGUOUS_TOP_MATCH描述当前已比较候选，不必然说明认证店详情已到达，必须与独立阶段一起读。

Sen本次模型原文输出：["{\"field\": \"name\", \"fragment\": \"Sen Kagurazaka\"}"]。返回的片段等于原Google全名，生产代码拒绝重复查询；这不是片段不在原文，也没有为了命中改成其他词。

完整性：676个冻结SHA一致、原证据原账本保留、188次GET回执齐全，有响应的原文SHA均通过；连接失败没有响应原文。最短间隔30.024秒、每店两查询/五详情及全局额度通过。产品/src/scripts/package不变，复用此前六项门禁证据，不冒称本次重跑产品门禁。停止在证据复核，后续身份/策略取舍由用户和复核者决定。

## 只读复核入口

`python3 -B .eval-artifacts/phase3b/g4-e2e-continuation/aggregate.py --verify-only`

从仓库根目录运行，不加载凭据、不访问网络、不写文件。复用原冻结评分函数，重新核对全部42份尝试（含原额度中断、前四复跑）、认证ID、188次GET回执与响应SHA、账本计数和节奏，并比较已保存汇总。aggregate.py只作事后机械汇总，未改变运行编排或评分规则；来源SHA见posthoc-aggregation.json。
