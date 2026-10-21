# HARD 条件 MET／S1_UNSUPPORTED：五条来源支持离线分析

- 状态：`ANALYSIS_COMPLETE / PENDING_INDEPENDENT_REVIEW`；建议为 **draft / not integrated**。
- 分支：`codex/chore-hard-criterion-support-analysis`，分析基点 `27b3884aad4f6dfff1b8d139d164b1c6fdf94352`。仅报告及文档记录，不改产品、Prompt、Schema、Evaluator、配置或评测输入。
- 切片承诺：五条展示逐条追到产品证据、原始页面字段、既有见证 HARD 原句和 @31 的实际接纳路径；给出修正建议后停止。网站／模型／Google／浏览器／Live 均新增 **0**。没有运行评测器或重新计分。
- 时间：文中带 Z 和省略日期的运行时刻均为 UTC；北京时间为 UTC+8，东京为 UTC+9。
- 材料：已暴露开发记录，非 Clean Baseline。原始 Live、@30 原评价、@31 参考评价及快速门槛保持不变；本报告不签收检查点 C。

## 结论与逐条归类

这五条不能统称为“模型凭空判 MET”。c-01 三条是 Tabelog 的确定性课程／菜单解析，不是餐厅类型模型判断；c-05 两条才来自模型。**四家有自家课程明文；Kaga 有含 Kaiseki 的业务名称、顾客评论和运行前认证的 HARD 原句，但没有明确的菜系字段／课程卡片。** 当前 @31 没有把课程原文或见证 HARD 解释接入条件状态 oracle；Kaga 还先触发原始展示缺引门槛。

| 运行／门店 ID | 产品 MET 的直接来源 | 当次页面可独立检查的明文 | 结论／建议方向 |
|---|---|---|---|
| c-01 Sen / 13275802 | TABELOG `verifiedHardCriteria=[omakase]`；非模型 | 自家 `Lunch Omakase Course` 等三张课程；认证另存 `Omakase Course` | 有既有来源，@31 未使用。**只证明店提供 omakase；当次主页面命中全为午餐，不能升级为 19:00 已订／可订某个 omakase 套餐。** 评测器补课程／已审核 HARD oracle；产品保留餐段限定。 |
| c-01 Matsumoto / 13261619 | 同上 | 自家 `Omakase Nigiri Course` 等；认证 `We offer only the "Omakase Course."` | 课程／认证证据明确，属于评测器没有使用已有独立材料；产品仍需展示实际原文。 |
| c-01 Issekisanchou / 13319616 | 同上 | 自家 `Lunch Omakase Nigiri 10 Pieces Course` 等；特色标题亦写 Omakase | 课程明文存在，@31 未使用；午餐卡片不能外推为当次晚餐套餐。没有此店的认证 Gold，不借用别店见证。 |
| c-05 Utou / 13300814 | seq17 模型 SUPPORTED＋所选源文档 | 自家 Katsura 课程标题明确含 `Kaiseki with Exquisite Ingredients of the Day` | 不只是店名或模型自述；已有课程明文没有被整句相等规则识别。应增加独立、范围受限的课程证据核验。 |
| c-05 Kaga / 13048623 | seq18 模型 SUPPORTED；所选为两条店名＋一条顾客评论标题 | Categories 仅 `Japanese Cuisine, Creative`；无课程卡片。认证 HARD 原句为 `Private rooms to Kaiseki Settai no Enkai Dokoro` | **两部分问题**：@31 未使用既有认证 HARD，且历史缺引先挡住全部条件证据；产品自己的模型引用又没有商家明确菜系／课程声明。建议评测侧使用经复核的具体见证解释；产品在仅店名／评论时保留未核对，除非另有适用的来源声明。不要通用化为“名字含 kaiseki 即 MET”。 |

“课程明文存在”与“这个日期／人数／时段的具体套餐可预订”是两个命题。本任务只分析原 HARD 类型／提供形式支持，不新增套餐绑定、库存或 S0 的判定。`S1_UNSUPPORTED` 是展示对照标签；`NOT_CHECKED` 是独立支持缺口，不是已经证明 HARD 不成立，也不是已证实 S0。

## 共同代码路径与 @31 为什么没有接纳

1. **c-01 产品来源**：`parseTabelogVerifiedHardCriteria` 只拼接 HTML 中 class/id 含 genre/category/course/menu/cuisine 的片段，命中 `omakase`／`おまかせ`／`お任せ` 即回传请求条件。Adapter 将它存入 TABELOG `RESTAURANT_FACT.claims.verifiedHardCriteria`；三条同时保留 `listedCourseDetails`。本次保留快照中复核到的命中均在本店课程卡片，不是旁边推荐店。函数没有保存“哪段命中”或餐段。三店课程命中集合见 evidence.json；不是声称某一标题被唯一记录为实际引用。c-01 的 18 条原始 decisions 中 `restaurant_fact_judgment` **0 条**，factChecks 为空。
2. **c-05 产品来源**：模型从候选绑定的 sourceDocuments 选择 statement IDs；执行器检查 ID 存在后保留逐字文本为 TABELOG `restaurantTypeFacts`，再保留 MODEL_JUDGMENT `verifiedHardCriteria=[kaiseki restaurant]` 和 supportingEvidenceIds。seq17/18 的原请求、响应都在 decisions；本轮没有发送它们。接纳时的 concreteTypeFacts 仅排除少数泛称，不识别“店名／商家类型字段／顾客评论”角色，因此本次名称和评论标题可以通过该结构门槛。引文存在并不自动证明语义满足。
3. **展示**：`assessRestaurantConditions` 根据 `verifiedHardCriteria`／逐字 `restaurantTypeFacts` 生成 MET。非价格条件的 `sources[].quote` 实际填入 **criterion.text**，不是来源摘录。于是 c-01 显示的 quote=`omakase` 不能当原文；c-05 MODEL_JUDGMENT 没有 sourceUrl，展示 `sources=[]`，真实引文须沿 supportingEvidenceIds 查。当前修复的 criterionRef 不改变这条语义判断；原条件显示逻辑与当前版本的差异仅为已审 criterionRef 字段及对应 Schema 版本，不把新回放冒充原 Live。
4. **独立评价入口**：@31 `assessUserConditions` 先要求该门店的 `assessPresentedCandidate.status===SATISFIED`，再要求同候选、实际执行观察、展示已引用的事实；排除 MODEL_JUDGMENT。c-01 三店及 Utou 可以进入后面的条件比较；Kaga 的原始结果因未引用较晚 `90f76d3a…` 事实而在入口被挡，得到空 sourceFacts。
5. **条件比较范围**：非价格的自动正例只接纳 `restaurantTypeFacts` 中与 Gold 条件**整句规范化后相等**的文字。它不读课程卡片或 listedCourseDetails 来解释 `omakase/kaiseki`；c-01 三条来源事实没有 restaurantTypeFacts。Utou 的长课程标题／店名也不等于 `kaiseki`。Kaga 即使消除历史缺引，长店名也仍不满足这条规则（这是代码路径分析，未运行反事实评价）。
6. **见证没有进入这一条件 oracle**：既有 run-offline.mjs 的确加载了冻结 registry 并传入 witnessOracle，但它用于 witnessFunnel；`assessUserConditions` 不接收该 oracle。另一个 external observation 分支仅处理 SOFT POSITIVE，本次五条都是 HARD。故“已加载见证”不等于“已经使用见证 HARD 评这五条”。历史 `kaiseki` ↔ `kaiseki restaurant` 对应只负责找到同一条件，不证明来源真值。

以上三个生产解析／Adapter／模型判断文件与原 quick-live-freeze.json 的 SHA 完全一致；condition-states 的旧字节另以冻结提交 `92ea65c…` 核对，当前文件已有已审 criterionRef 修复。完整文件路径、SHA、JSON 指针、原始模型 statement IDs 和保存快照序号见 evidence.json／source-manifest.json。

## 1. c-01 Shibuya Sushi Sen / 13275802

- 请求：2026-11-03 19:00、2 人，HARD `omakase`；权威 intent 与 Gold 同文。
- 产品证据：readEvidence[10]，`evidence:restaurant:tabelog-hard-criteria:f60c5761fc986b5d8cf0fb31`，TABELOG，`2026-10-21T11:02:03.371Z`；展示引用这条并显示 MET。它是解析结果，不存在“模型判断引用的句子”。
- 当次原页面：snapshot **26**（recording entry **357**），本店 `.rstdtl-course-list__course-title-text`：`Lunch Omakase Course`（两项）、`Lunch Special Omakase Course`。外层 `.rstdtl-course-list__data` 是实际匹配范围。Restaurant name 为本店；Categories 为 `Sushi, Seafood, Izakaya (Japanese style tavern)`，不能只靠这些类别推出 omakase。
- 见证：同 canonical ID 的 `/party/`，2026-10-20T12:27:52.108Z，保存原字节 `Omakase Course`；source-review 对 omakase 记 SUPPORTED。引用不含完整套餐上下文，不能从这四个词补出晚餐限定。原认证有效至 2026-10-21T12:26:41.866Z，本次运行结束 11:03:04.238Z，在原有效窗口内；本轮没有续期。
- 结论：不是“来源没写却凭空 MET”。@31 没有利用现成课程／认证材料；但本店当次主页面证明仅到提供午餐 omakase，产品若把 MET 解释为“19:00 omakase 套餐已核对”会超出依据。建议独立条件核验注明餐厅提供形式／课程适用餐段，产品显示真实限定；不足以证明所需餐段时保持未核对，不以库存表证明套餐类型。

## 2. c-01 Shibuya Sushi Matsumoto / 13261619

- 产品证据：readEvidence[16]，`evidence:restaurant:tabelog-hard-criteria:f09b157bc0214286741d6519`，TABELOG，11:02:45.421Z；解析器确认，非模型。
- 当次原页面：snapshot **40**（entry **557**），自家课程 `Omakase Nigiri Course`、`Premium Omakase Nigiri Course`、`Special Omakase Nigiri Course`；课程描述亦直接写 `through our Omakase course`。Categories 为 `Sushi, Seafood, Japanese Cuisine`，类型支持来自课程，不来自类别推断。
- 见证：2026-10-20T13:18:41.925Z 的同店业务页，rawQuotes 保存 `We offer only the &quot;Omakase Course.&quot;`；只解 HTML entities 即得到登记原句 `We offer only the "Omakase Course."`。当次 DOM 的同句位于 `.pr-comment__over.is-hidden` 的收起续文，不冒充已在视口展开；课程标题是另外可定位的独立依据。
- 结论：有本店明确课程和认证原文，属于独立条件规则未使用已有材料。建议 evaluator 用本店自家课程／审核过的 HARD 证据，展示层带实际课程引文；不要把 `sources.quote=omakase` 当原句。没有新增该课程在指定时段的销售保证。

## 3. c-01 Sushi Sho Issekisanchou / 13319616

- 产品证据：readEvidence[19]，`evidence:restaurant:tabelog-hard-criteria:e502da2077ba21f39e4ffe7f`，TABELOG，11:03:02.121Z；解析器确认，非模型。
- 当次原页面：snapshot **47**（entry **657**），自家 `Lunch Omakase Nigiri 10 Pieces Course`、`Lunch Omakase 13 Nigiri Course`；另一个 Lunch 8 Nigiri 描述写 `The Omakase Nigiri 8-Piece Course…`。这些就是 parser 的命中。
- 同页商家特色标题 `.rstdtl-top-kodawari__title`：`Omakase Course to Experience the Essence of Dashi with All Five Senses`。商家介绍收起续文还写 `The Omakase course is available for reservation at four time slots: 5 PM, 6 PM, 7:30 PM, and 8:30 PM.`；该段 `.pr-comment__over.is-hidden`，本报告不称当时已展开。它没有列 7 PM，不能用来证明 19:00 套餐；本轮也不据此新判库存冲突。
- 此 ID 不在本次认证清单，没有可借用的见证 HARD；Categories 仅 `Sushi`。
- 结论：有该店课程／商家特色原文，@31 没有读取这类独立材料。建议 evaluator 从当前门店课程／特色声明独立核对，保留餐段、时段和隐藏／可见范围；产品不能把仅午餐命中升级为当次晚餐套餐保证。

## 4. c-05 Kaiseki Utou / 13300814

- 请求：2026-11-05 19:30、3 人；Gold 为 `kaiseki`，产品为 `kaiseki restaurant`。@31 已对应此条件，本次不修改措辞或语义。
- 产品：原 decisions **seq17（第17行）**，purpose=`restaurant_fact_judgment`，Prompt14／Schema4，11:19:38.093Z 发起。选择 `…13300814:document:7d166c589eee3a6a` 的 statement **12、46、1**，依次是 `Kaiseki Utou (懐石 うとう)`、`Seasonal Omakase Course "Katsura" ◆ Kaiseki with Exquisite Ingredients of the Day8 items`、`Kaiseki Utou - Iidabashi(Japanese Cuisine)`；输出 SUPPORTED／RESTAURANT_CATEGORY_TYPE。
- 支持链：readEvidence[15] 是 TABELOG 原文文档；[16] 为 `fact-judgment:…:2026-10-21T11:19:40.462Z:…`，verifiedHardCriteria=`kaiseki restaurant`，supportingEvidenceIds 指向 [15]。展示引用 [16] 并显示 MET，sources 为空。readEvidence[7] 的较早课程事实还保存相同 Katsura 标题，但被后续 factChecks 列为 superseded，不把它再当当前独立有效引文。
- 当次原页面：snapshot **33**（entry **498**），`.rstdtl-course-list__course-title-text` 保留完整 Katsura 课程标题；`8 items` 是相邻字段，不改写成标题。Categories 只写 `Japanese Cuisine`，不足以单独推出怀石。此 ID 不是本次登记见证。
- 结论：这次存在直接的本店课程“kaiseki”明文，**不是仅从 Kaiseki Utou 店名猜测**。@31 虽可读到引用的 TABELOG 文档，却要求整句等于 `kaiseki`，未使用标题中明确的课程类型。建议独立按本店课程标题的结构化事实／人工冻结语义核对，保留整句和限制，不做整页子串匹配；产品展示应展开 [15] 的原文和来源，不只给 MODEL_JUDGMENT。

## 5. c-05 Kaga / 13048623

- 产品：decisions **seq18（第18行）**，同 Prompt14／Schema4，11:19:48.440Z；选择 `…13048623:document:f04acd335ed41dab` 的 statement **1、11、46**：
  1. `Kagurazaka Kappou Kaga Private rooms to Kaiseki Settai no Enkai Dokoro（カッポウ カガ） - Ushigome Kagurazaka(Japanese Cuisine)`；
  2. `Kagurazaka Kappou Kaga Private rooms to Kaiseki Settai no Enkai Dokoro (神楽坂 割烹 加賀 個室と会席接待の宴会処)`；
  3. `A Flaw in the Spring Kaiseki Experience`。
- 输出 SUPPORTED／RESTAURANT_CATEGORY_TYPE；readEvidence[18] 为 TABELOG 逐字文档，[19] 为 `fact-judgment:…:2026-10-21T11:19:50.896Z:…`，支持链指向 [18]。展示引用 [19] 并显示 MET，sources 为空。
- 当次原页面：事实读取 snapshot **34**（entry **521**），以及查位后的 snapshot **43**（entry **670**）均为同 canonical outlet。业务名称／h2／Restaurant name 含上述 Kaiseki 文字；Categories 为 `Japanese Cuisine, Creative`，**没有独立的 Kaiseki 菜系条目，没有本店课程卡片**。statement46 位于 `.rstdtl-rvw__title-target`，父节点 `.rstdtl-rvw` 的 `data-detail-url` 为该店 `/dtlrvwlst/B523754957/…`，是**顾客评论标题**。不能把它当商家课程名；它也没有证明本次晚餐可用怀石套餐。
- 运行前认证：2026-10-20T15:38:10.824Z，同店 rawQuotes 记录 `Private rooms to Kaiseki Settai no Enkai Dokoro`，偏移 **105**（页面标题／名称），不是菜系字段。JSON-LD 同样仅 `Japanese Cuisine,Creative`。source-review.json 的 CODEX_EVALUATION_SIDE 人工解释把该商家名称／说明理解为提供 Kaiseki，HARD=SUPPORTED；认证分类 KNOWN_FEASIBLE_SUPPORTED。该文件内部 externalReviewerApproval 保留 PENDING；**另有** witness-completion/independent-review.md 对包含该登记的冻结包批准，且本任务指定的 27b3884a 复核明确称 Kaga 为已认证见证。两种状态原样报告，不伪造新签名或把名称字面命中当成自动 Gold。
- 原始缺引：较晚 readEvidence[24] `evidence:restaurant:tabelog-hard-criteria:90f76d3a50b0f0b768e8fa1f` 的 verifiedHardCriteria **为空**，包含价格等事实，不能当它独立证明 kaiseki。原 @31 因展示漏引该事实而 REQUIRED_EVIDENCE=NOT_SATISFIED，条件 sourceFacts=[]。1bb92bca 的 product-replay 已修复引用链，但该反事实回放不是新的 Live，也没有给这条事实补出怀石明文。
- 结论：不能说“没有任何既有来源／见证依据”，但也不能说“商家菜系字段已明确证明”。**评测器缺的是被审核的见证 HARD 解释接线；产品暴露的是仅店名＋顾客评论仍能升为 MET 的边界。** 建议针对本 ID／原请求／原产物 SHA，由独立复核者确认已有认证解释是否足够后作为显式 HARD oracle，单独记录人工结论；未确认前保留 NOT_CHECKED。产品仅有这种引文时应显示未核对及依据，或取得明确商家菜系／课程文字后再 MET。不要放宽成名称或顾客评论关键词自动通过。

## 修正建议（本轮全部不实施）

| 层 | 最小建议 | 必须保留的拒绝／范围 |
|---|---|---|
| Evaluator：课程明文 | 在同候选、同源、已引用且有原始 HTML/响应对应的结构化商家课程／类别字段上独立核对；先覆盖本次四家实际课程，不读生产 verifiedHardCriteria 作为 oracle。无法无歧义解释时交独立标注。 | 不扫整页关键词；不借邻店推荐、用户评论、被替代事实；保留午餐／晚餐、否定、门店、日期等限定。 |
| Evaluator：见证 HARD | 把既有认证中的 HARD 原句、来源原件 SHA、门店 canonical ID、条件身份／polarity／strength、适用请求／时间及明确复核结论作为独立输入；至少可核验 Sen／Matsumoto；Kaga 必须保留“名称说明的人工解释”性质。 | 不能用“有见证”跳过来源真值；不把 CONDITION 对应表当来源 Gold，不把历史登记套给 Utou／Issekisanchou。 |
| Evaluator：层间关系 | 分别报告“条件原文存在但未接纳”“条件不能独立证明”“整份历史展示漏引”；让 Kaga 的旧引用缺陷和 HARD 语义问题可区分。 | 不直接给旧结果补证／改分，也不以新 Router 回放改写原 Live。 |
| 产品：可追溯显示 | 真实命中片段／statementId／来源字段沿支持链带到显示，禁止用 criterion.text 冒充 source quote；模型事实显示应展开原来源而非 sources=[]。 | 无明确商家类型／课程证据时显示未核对；不以名称、顾客评论或通用 Japanese Cuisine 显示 MET。 |
| 产品：作用范围 | 餐厅提供某类课程与本次时段该课程可订分别显示；Sen／Issekisanchou 的 lunch 限定不可丢失。 | 不新增或放宽 HARD、资格、半径、身份、新鲜度或空位要求。 |

若后续批准 evaluator 修改，先冻结新规则及独立 oracle，补正反例并跑原校准，再对旧产物写新的参考 sidecar、与 @31 并列。无须为了这次分析重跑模型或网站。建议不包括实现承诺；检查点 C 的运行与签收仍由其独立流程处理。

## 证据索引与验证范围

- evidence.json：五条原展示、完整 evidence ID 与数组位置、seq17/18 的逐字选句、原 HTML 路径／保存 SHA／快照序号／recording entry、认证原句与原始文件、@31 对照；没有复制整页或 HAR。
- source-manifest.json：本次实际引用输入的 SHA-256／大小；包含生产代码路径与原运行冻结 SHA 对照。五个主快照顺序为 26、40、47、33、34，Kaga 另核对 43；保存 HTML 经过 Recorder 脱敏，SHA **不等于** entry 中脱敏前 runtimeHtmlSha256。按 Recorder snapshot 序号和 URL 绑定，分别保留两者，绝不假称同一字节。
- 按仓库 Planning／Test／Eval／Post-change 规程，执行纯文档矩阵：五条计数、原始引文／选择 ID／路径、SHA、文档链接、月度索引与 diff；结果写 validation.json。所有原始输入、旧结果／录制／评价不变。
- 月度索引仅新增本批两条日志导航及计数增量；基线标题计数与表行数量已有差异，保留并在 validation.json 列明，不宣称全量历史索引一致或顺带整理旧记录。
- 本次未执行 typecheck、arch、npm test、build、Chromium Fixture、模型回放或 evaluator 重评：没有相应代码修改，纯文档不以旧门禁冒充本轮新测试。
- 本次没有新端到端结果；第二层仅做既有事实／HARD 支持的逐条审计，第三层不新增 S0/S1 自动判定，第四层只给上述有证据的归因与建议。原 Live／Mock／Replay 模式不混报，原累计用量不变。


## 可点击原始文件导航

- [五条机器可读证据／完整指针](evidence.json)、[输入 SHA 清单](source-manifest.json)、[本轮纯文档验证](validation.json)。
- [任务指定的复核原文](../checkpoint-c-live-20261020/criterion-presentation-20261021/independent-review.md)、[现有 c-01 @31](../checkpoint-c-live-20261020/criterion-presentation-20261021/quick-reevaluations/c-01.evaluation.31.json)、[现有 c-05 @31](../checkpoint-c-live-20261020/criterion-presentation-20261021/quick-reevaluations/c-05.evaluation.31.json)、[既有产品回放](../checkpoint-c-live-20261020/criterion-presentation-20261021/product-replay.json)。
- [见证登记](../checkpoint-c-live-20261020/witness-completion-20261020/registry.certified.json)、[认证 HARD 解释](../checkpoint-c-live-20261020/witness-completion-20261020/source-review.json)、[包含登记的冻结包独立复核](../checkpoint-c-live-20261020/witness-completion-20261020/independent-review.md)。

| 门店 | 原结果／决策 | 原始保存 HTML | 认证原句 |
|---|---|---|---|
| Shibuya Sushi Sen | [result](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021/quick-live-results/c-01-attempt-1/runner/2026-10-21T11-00-16-745Z-04d5a0a4-85d5-4fb6-9c46-f81494df90ee.result.json) / [decisions](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021/quick-live-results/c-01-attempt-1/runner/2026-10-21T11-00-16-745Z-04d5a0a4-85d5-4fb6-9c46-f81494df90ee.decisions.jsonl) | [snapshot 26](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021/quick-live-results/c-01-attempt-1/recordings/hybrid-1792580416669/snapshot-0026.html) | [HARD 原始观察](../../.eval-artifacts/checkpoint-c-live-20261020/witness-certification-20261020/capture/p2l-kf-h001-20261103/13275802-party.attempt-1.source.json) |
| Shibuya Sushi Matsumoto | [result](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021/quick-live-results/c-01-attempt-1/runner/2026-10-21T11-00-16-745Z-04d5a0a4-85d5-4fb6-9c46-f81494df90ee.result.json) / [decisions](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021/quick-live-results/c-01-attempt-1/runner/2026-10-21T11-00-16-745Z-04d5a0a4-85d5-4fb6-9c46-f81494df90ee.decisions.jsonl) | [snapshot 40](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021/quick-live-results/c-01-attempt-1/recordings/hybrid-1792580416669/snapshot-0040.html) | [HARD 原始观察](../../.eval-artifacts/checkpoint-c-live-20261020/witness-resume-20261020/capture/p2l-kf-h001-20261103/13261619.attempt-1.source.json) |
| Sushi Sho Issekisanchou | [result](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021/quick-live-results/c-01-attempt-1/runner/2026-10-21T11-00-16-745Z-04d5a0a4-85d5-4fb6-9c46-f81494df90ee.result.json) / [decisions](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021/quick-live-results/c-01-attempt-1/runner/2026-10-21T11-00-16-745Z-04d5a0a4-85d5-4fb6-9c46-f81494df90ee.decisions.jsonl) | [snapshot 47](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021/quick-live-results/c-01-attempt-1/recordings/hybrid-1792580416669/snapshot-0047.html) | 无该店登记 |
| Kaiseki Utou | [result](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021/quick-live-results/c-05-attempt-1/runner/2026-10-21T11-17-13-039Z-654604aa-9a39-4005-9962-00f1a79c827c.result.json) / [decisions](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021/quick-live-results/c-05-attempt-1/runner/2026-10-21T11-17-13-039Z-654604aa-9a39-4005-9962-00f1a79c827c.decisions.jsonl) | [snapshot 33](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021/quick-live-results/c-05-attempt-1/recordings/hybrid-1792581432961/snapshot-0033.html) | 无该店登记 |
| Kaga | [result](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021/quick-live-results/c-05-attempt-1/runner/2026-10-21T11-17-13-039Z-654604aa-9a39-4005-9962-00f1a79c827c.result.json) / [decisions](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021/quick-live-results/c-05-attempt-1/runner/2026-10-21T11-17-13-039Z-654604aa-9a39-4005-9962-00f1a79c827c.decisions.jsonl) | [snapshot 34](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021/quick-live-results/c-05-attempt-1/recordings/hybrid-1792581432961/snapshot-0034.html) | [HARD 原始观察](../../.eval-artifacts/checkpoint-c-live-20261020/witness-completion-20261020/capture/p2l-kagurazaka-kaiseki-20261105/13048623.attempt-1.source.json) |

源码仅定位阅读：[课程解析](../../src/integrations/tabelog/tabelog-page-parser.ts)、[查位组装](../../src/integrations/tabelog/tabelog-browser-availability.ts)、[事实模型引文接纳](../../src/integrations/restaurant-facts/model-fact-judgment.ts)、[产品条件显示](../../src/domains/restaurant/condition-states.ts)、[独立条件 oracle](../../src/eval/restaurant/agent-loop/diagnostic-evaluator-preferences.ts)、[条件入口门槛](../../src/eval/restaurant/agent-loop/diagnostic-evaluator.ts)、[见证 oracle](../../src/eval/restaurant/agent-loop/diagnostic-evaluator-witness.ts)。

待独立复核；报告推送后停止。
