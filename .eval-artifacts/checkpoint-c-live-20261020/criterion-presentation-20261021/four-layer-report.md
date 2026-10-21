# 条件对应与展示证据：四层离线报告

状态：**OFFLINE_PASS_AWAITING_REVIEW**；draft / not integrated。已暴露开发材料，不是 Clean Baseline。本轮没有第三次快速验证、网站请求、模型 API、见证认证或 Live。

代码及输入提交：`1bb92bcadc826b9715b736bca796ebe3446de374`。离线冻结 SHA-256：`003c8b69db188ae4d5091d88e8729905fd3d845eb664d22d7423f01ea706aca8`，1345 项逐项核验不变。该冻结不表示 Live 已获准。

## 第一层：端到端结果

五门禁全绿：默认 982/982，真实本地 Chromium 131/131，typecheck／arch／build 通过。22 次独立校准 **22/22**。

相同 69 个翻月点 **69/69**，选店 **5/5**。当前生产 DOM／Prompt 及 Reducer／Context 重建请求与先前获准请求逐字相同，故以原始真实模型响应和当前解析／评分逻辑重评；新增模型调用 0。它们是缓存响应回归，不是新真实模型采样或 Live。

三次快速运行的原评价与新评测器离线参考评价如下，原始 result、@30/@26 评价及旧快速门槛均未覆盖。

| 运行 | 原 @30/@26 | 新 @31/@27（仅参考） | 原耗时 | 原模型调用 | 交付店数 |
|---|---|---|---:|---:|---:|
| c-01 | QUALIFIED_DELIVERY | QUALIFIED_DELIVERY | 167.421s | 18 | 3 |
| c-02 | NOT_EVALUATED | QUALIFIED_DELIVERY | 177.643s | 16 | 2 |
| c-05 | DELIVERED_UNQUALIFIED | DELIVERED_UNQUALIFIED | 259.302s | 31 | 2 |

**原快速门槛仍为 1/3、不通过；新评价不用于补足该门槛。** 产品修复的 c05 本地事件回放也不替代原 Live 结果。

## 第二层：逐环节判定

- 条件对应：文字只做 NFKC、大小写、连字符、空白及标点规范化；没有同义词表、词干化、翻译或按数组位置猜语义。明确 criterionRef／semanticId 优先；历史材料缺编号时，仅使用已复核、绑定原始产物 SHA 和两边原文哈希的条件索引对。13 份产物共20对，指向既有用户复核与 66269d74；登记不含结果标签，不建立来源事实。不同 SHA 或未复核表述仍未评价。
- 展示对照原来缺失的8条均有展示记录：c02 的 hot-pot 两条来自标点差异；首约和川湘菜各两条、c05 怀石两条来自不同表述和展示端直接逐字查找。现先对应 Gold 条件与权威条件，再按该条件引用／唯一规范化原文找展示记录。6 条为一致的 NOT_CHECKED；c05 两条显示 MET 而独立未核对，仍明确报告 S1_UNSUPPORTED。不是把“找到记录”当作“满足条件”。

| 运行／门店 | 条件 | 原展示对照 | 新展示状态／独立状态 | 新判定 |
|---|---|---|---|---|
| c-02／13292459 | good for a first date | 未匹配 | NOT_CHECKED / NOT_CHECKED | CONSISTENT |
| c-02／13292459 | Sichuan/Hunan cuisine | 未匹配 | NOT_CHECKED / NOT_CHECKED | CONSISTENT |
| c-02／13292459 | hot pot restaurant | 未匹配 | NOT_CHECKED / NOT_CHECKED | CONSISTENT |
| c-02／13295658 | good for a first date | 未匹配 | NOT_CHECKED / NOT_CHECKED | CONSISTENT |
| c-02／13295658 | Sichuan/Hunan cuisine | 未匹配 | NOT_CHECKED / NOT_CHECKED | CONSISTENT |
| c-02／13295658 | hot pot restaurant | 未匹配 | NOT_CHECKED / NOT_CHECKED | CONSISTENT |
| c-05／13300814 | kaiseki | 未匹配 | MET / NOT_CHECKED | S1_UNSUPPORTED |
| c-05／13048623 | kaiseki | 未匹配 | MET / NOT_CHECKED | S1_UNSUPPORTED |

所有13个条件的独立状态、展示对照、引用及新旧严重程度详见 quick-comparison.json 与 quick-reevaluations/；不省略 SOFT 或 UNSPECIFIED。

- **P2-1 发现：** 无新增发现执行；原 c01/c02/c05 首批见证2/2、0/3、2/3保留，不由离线评分推导新的发现率。
- **P2-2 选店：** 当前事件重建后的5个种子输入逐字一致、缓存响应重评5/5。原直接门店页数5、2、5和7/7库存 EXACT_MATCH 保留既有 Live 证据；本轮不新增库存观察。
- **P2-3 条件／价格／展示：** Kaga 的较早事实检查在11:19:40.516Z建立固定清单，查位在11:20:45.769Z新增的同源事实被旧清单过滤；11:21:32.252Z展示时已存在但未引用。该 evidence:restaurant:tabelog-hard-criteria:90f76d3a… 实际 verifiedHardCriteria=[]，含晚餐 JPY8,000–9,999／午餐价格；生产怀石 HARD 判断来自另一条带原始支持引用的 MODEL_JUDGMENT；它不是独立语义证明，该条件的独立状态仍为 NOT_CHECKED。名称含 hard-criteria 不意味着该条已证明怀石。
- 修复：共享当前事实视图接纳当前查位清单引用、且晚于既有事实检查的新事实；继续检查同店 HIGH 身份、显式 supersession、后续同源事实读取和模型原始支持链。Router 引用其证据，Reducer 拒绝缺失必需引用的展示。展示条件输出请求内 criterionRef（condition-states@2）。
- 从 c05 六条原始语义编译／来源事件经当前 Reducer 重建，再由 Router → Reducer 展示，Kaga 的该引用进入结果。红灯为旧实现三个针对性断言确实失败；绿灯同时验证漏引、跨店和已被后续读取替代的证据不能放行。product-replay.json 保存本地反事实产物，原 c05 缺引评价不被改写。
- 原三次运行的价格独立结果仍2条 MET，展示为 NOT_CHECKED，MISSED_KNOWN_CONDITION保留；未给历史展示回填价格或其他事实。

## 第三层：严重程度与安全

新旧 S0 声明／越界分列如下。没有新增 Live，不对当前来源库存或实时 S0 作新声明；历史 H003 的 S0 PRESENT 保留。

| 运行 | 原声明／越界 | 新参考声明／越界 |
|---|---|---|
| c-01 | ABSENT / ABSENT | ABSENT / ABSENT |
| c-02 | NOT_EVALUATED / ABSENT | ABSENT / ABSENT |
| c-05 | NOT_EVALUATED / ABSENT | NOT_EVALUATED / ABSENT |

校准正常 S0 声明20/20；两份缺result中断例外保留；越界历史证据缺口13份，未记为无错。错条件身份、polarity／HARD strength变化、模糊或缺失对应均不会自动通过。只读 Guard、/reserve 永久禁止及不点时段保持。

## 第四层：归因、资源与剩余边界

- 已确认评测缺陷：用表述直接匹配条件和展示，而没有先对应权威条件；通用标点规范化也不足。旧词语映射执行器已删除，历史 YAML 只作为已复核来源保留。当前登记按产物 SHA 和条件编号限定，不能应用到新运行的未复核同义表述。
- 已确认产品缺陷：当前事实筛选只允许较早 factChecks 中的同源 ID，遗漏较晚查位带回的新事实。固定事件回放证实修复后该引用贯通；新的 Live 交付质量仍待后续检查点 C。
- Evaluator递增到@31，rubric递增到@27；展示条件结构@2。Browser Prompt19/Context2、Restaurant Prompt27/Context15 的文本和模型请求未改，版本不虚增；V1/V2不采用。
- 本轮网站／Google／模型API／完整Live／环境重跑均0；74条缓存响应回放不重复计费。阶段累计2418/4000模型、13/100完整Live、0/10正式环境重跑，原35个账本来源逐项核验；新增零消耗账本。
- Gold、变体、留出集和原始运行／评价没有变更；Live外层和原plan未改。外层仍锁定旧@30/@26，本轮新评价走独立离线入口；后续获复核后须将批准的评测器版本与下一次冻结包一致绑定。
- 本轮到此停止，等复核。见证重新认证和 C18 均 NOT_REACHED，旧见证时间窗不顺延。
