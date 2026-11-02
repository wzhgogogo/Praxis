# 开发基准 v0：停止点 1

- Status: draft / not integrated，等待复核；本批没有实现或运行基准。
- 日期与报告时区：2026-11-02，CET（UTC+1）。冻结输入中的原始业务时区和值保留原字节，展示时换算 CET。
- 分支：`codex/chore-dev-benchmark-v0`。
- 基线：`549061e8392bfb6224d1ac9ca78671714d330e2c`；本地 main、origin/main 与上一批已核对的发布提交一致。本批不 fetch、不访问业务网络；最后仅按用户指令推送本分支。
- 暴露状态：**开发基准（已暴露），非 Clean Baseline；只服务比较改动和定位损失，不用于签收或泛化声明。**
- 本批真实模型、Google、网站、Live、见证 GET：全部 **0**；不读取或暂存 `.env`，不读人工标签。

**建议 v0 先用 H001、H003、H005。** 它们可由现有注册入口启动完整生产组装；保留 H005 已知业务红项，不挑选全绿题。H004 的原始固定咖啡馆全部在测试位置的 1 公里范围之外；G6 缺 main 上可用的真实模型多回合 Runner/独立判定接线，均不挪用组件成绩补足。当前只证明输入和接线可盘点，不能声称这些题在当前提交上已经由真实模型跑通。

交付索引：[逐题盘点](case-inventory.json)、[原生来源附加场景](native-case-inventory.json)、[路径及完整 SHA](file-inventory.json)、[历史成本与账本观察](cost-evidence.json)、[成本档位与随机性参考](cost-and-comparison.draft.json)、[成绩单 JSON 草案](scorecard-shape.draft.json)、[静态核查](static-checks.json)。

## 1. 当前切片与停止条件

本轮承诺：把可复用的整单入口、实际固定资料、独立预期的适用范围、成绩单来源与预算列清，使复核者能选择首版题目、模型配置及采样档位。Evaluator 复用，不新增判定；诊断复用，不补判；本轮只交设计与成本估算。

停止点 2 才实施一条命令的轮次入口，并先用 fixture 模型证明 SHA 拒绝、中断保留、实际执行→Evaluator→诊断→成绩单有效。真实模型第一轮须另经用户明确批准额度。此时不运行五门禁，不新增测试、package script、白名单或评分规则，不改 A 的文件，不合 main。

## 2. 实际入口、输入版本和共同限制

现有链路是：`run-current-development-fixed-source-model.ts` → `loadRegisteredFixedSourceCase` → `executeFixedSourceCase`；后者调用 `createCurrentDevelopmentFixedSources`，**该来源工厂调用 `createLiveReadAssembly`**，再把生产 search/facts/availability 接到 `createHybridReadComposition` 的真实 Interpreter、Compiler、Runtime、Router、Context、Validator 和 Grounding。不能把只调用 G1 核心、准备好的页面或手填 Evidence 的运行混入。

实际默认是 `restaurant-read-development@7` / `e2e-cases.gold7.yaml`，不是用户列作入口提示的历史 `e2e-cases.yaml`（@6）。两份均不修改。加载器实读 @7；控制题 `new-vegetarian-lunch` 的数据集字符串仍是 @1，以注册文件本身及 SHA 说明，不把它冒充 @7。

| 权威输入 | SHA-256 | 用途 |
| --- | --- | --- |
| `cases/e2e-cases.gold7.yaml` | `b346150074493e5a82e3d0dfb5ea5d18b3dbef17bb06d5101dfb15dfeb3ea40e` | H001–H005 当前请求、semantic Gold、验收文字 |
| `cases/e2e-cases.yaml` | `00b69476e6d07eec5dcd9a657555c4e3766629fce5f8e630512710252886ffb6` | 历史 @6；不选入新基准 |
| `fixed-source-case-registry.ts` | `83e38119855ef789d9394ba5e1dc7b63a47d61dadbadd782849e88675dc5cb72` | 7 题注册、两个控制题的原文/Gold、既有 acceptance |
| `current-development-source-scenarios.ts` | `f601d683dbbcdc8ebf8a984e352c607c070e9864883593e2bf08b597b5e4bd9f` | 独立编写的 Google、TableCheck、资料和库存样本 |
| `current-development-fixed-sources.ts` | `c337f4d8ff73e9d29f962bc3cdef5c01f1908be72d2318b9b52f8c97e87deb4c` | 合成检索词、半径过滤、页面、时间和缺口行为 |

完整路径、定位配置、G6 四文件、评价输入与代码引用 SHA 在 `file-inventory.json`；7 题逐项还有注册行、加载后输入、来源场景 JSON 和用户原文的派生 SHA。它们是**设计时盘点快照**，尚不是获批运行 manifest。

共同限制：来源均为 `SYNTHETIC_CONTROL`；不是网站回放或当前库存。默认资料多为相同名称/地址/电话、短菜单及直接词汇，不能代表复杂身份、自由语义或网站兼容性。`sampleCapturedAt` 与受控观察时间不同；不得刷新历史采集时间来称 Live。NEAR_USER 仅在 Runner 注入固定东银座测试点，具名 Shibuya/Higashi-Ginza 按用户地点走现有解析，不使用产品默认地点。基准不修改用户请求或把 `near my location/office` 改成东银座。

合成检索也有明确边界：text search 只按 `searchTerms` 的 token 命中，nearby search 按已配置坐标/类型过滤；未命中的合法改写可能得到空集，不能据此宣称真实网站无店或模型请求错误。新运行保留实际 query、资料人口及原始空结果，成绩解释须区分这种受控环境范围与产品缺陷；现有未匹配词不会自动全部生成 coverageGap。本批不更改该来源行为，也不声称它覆盖任意模型查询。

## 3. 用例逐项盘点与建议清单

表中“可执行”指注册、来源和完整组装入口已存在，**不表示当前真实模型合格交付已验证**。本轮只读取数据；下一步 fixture 控制若暴露环境缺口必须阻断，产品失败则保留原成绩，不改输入或放宽资格。

| 候选题 | 固定来源整单可执行性、资料与限制 | Gold / 见证与可评分范围 | 暴露程度与 v0 建议 |
| --- | --- | --- | --- |
| H001 | 已注册；Shibuya 3 家均在 1 公里内；固定 2 人库存和 omakase 菜单，可走发现、身份、事实、查位、展示。资料简短且多为直述 omakase。 | 当前 @7；条件、执行/引用支持由现有 Evaluator 判；没有适用这些虚构店的见证 Gold。 | 原文、结果、控制输出长期反复使用，完全暴露。**纳入**，明确查位控制。 |
| H002 | 已注册；具名 Higashi-Ginza，3 家法/意/怀石店及周六时段；人数推断会调用真实补充判断。预算、约会适用性和否定条件的资料有限，不因未提禁忌词就判满足。 | @7；逐字段保真与可验证引用可评；预算/主观偏好、部分 HARD 可能 NOT_CHECKED/NOT_EVALUATED。历史真实店见证不适用。 | 完全暴露。**候补**，首版缩小题数；保留资料限制，不能称已解决。 |
| H003 | 已注册；10 人、下班后宽窗；3 家库存独立固定。原坐标约 573、575、1294 米，前两家在注入圆内，第三家在外；默认三结果不足仍原样报告，不能临时搬店。菜单逐字写 team dinner/drinks，没有独立预算或包间支持。 | @7；日期/人数/宽窗、执行和引用可评；软偏好及语义适用性只按现有输出，未核对保留。无适用见证。 | 完全暴露。**纳入**，人数、宽窗及 NEAR_USER 与 H001 不同。 |
| H004 | 已注册的 RECOMMENDATION；只有咖啡馆/周三营业时间，没有库存，这是合法推荐资料。**原始三家距离东银座为 1407、1561、1290 米，均超出 1000 米**；不能按正向可交付题宣称资料充分。 | @7；推荐无需专门查位，现有评测可消费支持营业时间的搜索/详情观察。原样运行发现不到合格近邻不证明推荐理解失败。无适用见证。 | 完全暴露。**暂不纳入**，列来源配置缺口；本批不修坐标或 Gold。 |
| H005 | 已注册；4 人、本地菜、排除快餐；前两家在圈内，第三家在外。@7 保留原始“现在”起 30 分钟窗口；库存只列窗口起点，真实读取会推进业务时间，不能向前滚动请求。既有脚本控制明确保留 NO_VERIFIED_RESULT、acceptance FAIL，不承诺新模型会通过。 | @7；真实窗口保真、观察/引用、停止原样评价；local food/否定条件无足够支持时保留未核对。没有适用已知可行见证，不能自称 CAPABILITY_MISS 已确认。 | 完全暴露。**纳入**，保留业务红项和诚实/错误收尾差异，不因红灯删题。 |
| `new-vegetarian-lunch` | 已注册第六题；Shibuya 单家、3 人午餐、素食/排除 ramen；事实为 plant-forward bistro，菜单另有 vegetarian。有非逐字判断接线控制；真实模型适用理解未由该替身证明。 | Gold 在注册 TS，原 dataset 字符串 @1；完整 SHA 同上。现有执行→Evaluator→acceptance 及缺证反例在 `current-development-offline.test.ts:472`。无独立见证。 | 原文、资料、fixture 答案和断言全部公开使用，完全暴露；**候补**，不得称新题/holdout。 |
| `explicit-two-omakase` | 已注册第七题，复用 H001 3 家来源，明确要 2 家；用户数量穿过真实状态到 acceptance。 | 注册 TS 中独立控制原文/Gold，dataset @7；既有用户明确数量规则可评，不能只按模型说“完成”通过。无独立见证。 | 完全暴露；**候补**，与 H001 同来源，后续扩版可检查明确结果数，本版不重复加权。 |
| `multi-candidate-control` | 仅来源场景；一无位、一有位。**没有注册输入或 Gold**，当前 CLI 不能以此 ID 整单启动。 | 只有组件/集成测试预期，不将其自动提升为新题 Gold。 | 已暴露；**不纳入**，本批不补注册。 |

距离来自盘点时独立球面距离计算，原坐标和圆心可复算，非生产 `eligible` 判断。H003 精确值以 `case-inventory.json` 为准。

**重要的控制差异：** `current-development-offline.test.ts:358` 的 H001–H005 正向链路测试，会把 NEAR_USER 候选坐标、名称、地址改到测试圆内；它证明那组改写后的合成控制，不能证明未改写固定来源的 H004。新基准必须使用注册原数据，不能沿用这个预处理来“跑通”。

**见证适用性：** 五题均没有绑定上述虚构门店的独立见证。历史文件 `witnesses.prequalified-20261008.json`、`witnesses.p1f-20261011.json`、`witnesses.p1g.json` 的完整 SHA 已登记；它们对应真实店、不同日期/变体，**只作盘点参考，不送入 v0**。空漏斗写“未评：无适用见证”，不填覆盖损失 0，不用固定来源候选自动生成见证或把它们标为已确认可行。软偏好历史观察和按原 artifact SHA 绑定的等价条目也不套用到新运行。

另有原生来源真实模型 Runner 注册的 **11 个附加场景**，逐项登记在 `native-case-inventory.json`。它们全部只支持 H001 原请求，不是 11 道独立用户题；从实际 CLI 经 `createLiveReadAssembly`，不属于绕过组装。其 Gold 仍是同一 @7 文件；场景来源/期望分别在 `native-fixed-source-pages.ts` 和 `run-native-fixed-source-model.ts`，完整 SHA 已登记；独立原始页面/请求被现有 grader 覆盖的部分可评，没有适用独立见证的覆盖和自由语义仍未评。

| 原生 Runner 注册项 | 资料/控制意图与限制 | v0 决定 |
| --- | --- | --- |
| TABELOG_DELIVERS | 本地 Tabelog 正常交付资料；禁止另走 TableCheck 的既有场景期望。 | 候补，不与本版 Google 固定环境混算。 |
| TABLECHECK_RECOVERS | Tabelog 后续转 TableCheck，必须实际观察两来源。 | 候补，不能靠导航 URL 自证来源使用。 |
| BOTH_BOUNDED_EMPTY | 两来源有界空结果，既有 VERIFIED_NO_RESULT 及无展示期望。 | 候补，可扩充未来诚实收尾题；无位/未知和调查充分性不能互推。 |
| TABLECHECK_CONTINUES | TableCheck 同来源续读资料，仍要求两来源实际记录。 | 候补，仅固定路径范围。 |
| DYNAMIC_TABELOG_DELIVERS | 本地 Chromium 动态页面和实际更新；其余为静态页面替身。 | 候补，需本地浏览器依赖，不是即时静态来源的同一环境。 |
| TABLECHECK_DISCOVERY_RECOVERS | TableCheck 发现恢复，单店资料。 | 候补，与 H001 重复原文，不当新语义题。 |
| TABELOG_NONEMPTY_REGION_RECOVERS | 非空列表后的区域恢复，保留原查询。 | 候补，检索路径控制。 |
| TABELOG_CURRENT_BATCH_DELIVERS | 6 家 Tabelog 资料跨当前批次。 | 候补，批次控制。 |
| TABLECHECK_CURRENT_BATCH_DELIVERS | 6 家 TableCheck 资料跨当前批次。 | 候补，批次控制。 |
| NATIVE_FACT_FOLLOWUP_DELIVERS | 原生详情资料不足后继续事实页，禁止 TableCheck。 | 候补，不将仅入口名称当 HARD 支持。 |
| TABLECHECK_SCOPED_MENU_DELIVERS | TableCheck 类别菜单范围与资料续读。 | 候补，受控类别/操作路径不能证明当前真实网站。 |

这些场景均已暴露。还存在类型中可供测试构造、但未在该 Runner 注册的场景，不能自动作为付费题。另一个不能隐去的配置差异：原生来源业务参考时刻是 CET 08:20，H001 Gold 参考时刻为 CET 09:20，固定圆心也不同；本批不修，未来选用须明确冻结/复核，不能无说明与本版合并计分。此轮没有执行任何上述原生场景或 Chromium。

## 4. G6 多回合：逐路径盘点

main 有 `g6-development-preflight.ts`，调用生产 `createLiveReadAssembly` 和持久应用，但模型是写在 helper 内的 `fixtureModel`，没有可传入真实模型的参数。7 题注册 CLI 和 `executeFixedSourceCase` 目前只驱动初始请求到终态/WAITING_USER，不能自动继续 G6 后续用户回合。本批不改 A 的 Runner/grader，也不以另一工作树未合入的实现作为 main 能力。

G6 来源是 **LOCAL_CONSTRUCTION_NOT_WEBSITE_REPLAY**；`source.json` 的请求、库存及入口，`outlet.html`、`tablecheck.html` 和 `cancellation-question.json` 四份已单独取 SHA。它们有结构参考，属于已暴露本地构造。`answer` 字段是 fixture 模型输出，`expectedHandoffUrl` 是测试断言输入，均不得交给真实模型或当独立 grader。没有本批可新增的独立多回合 Gold/见证。

| G6 路径 | 当前资料可支撑到哪里 | 当前入口/诊断的限制 |
| --- | --- | --- |
| P1：已查位→选店/预约意向→B1 | 两渠道本地页、精确请求库存、原始入口存在；3 个 followup 改写是同一题的变体，不是 3 个独立覆盖能力。 | 当前 helper 由脚本动作选路。诊断可到选店、交接、已有条款节点并附指针；没有 A 独立结论就未评。 |
| P2：推荐→预约意向→缺人数→补人数 | 来源足够进行推荐后查位，保存 `missingParty`、`after`、`afterArtifact`。 | 现有模型替身提前规定补问与答复；不能当真实理解证明。追问是否必要需冻结逐轮 Gold，现有自动诊断缺此上下文时未评。 |
| P3：日期未具体→补日期 | 来源只配置一个具体日期；原始 undatedRequest/dateReply 和最终库存可驱动现有控制。 | helper 有缺日期时零来源调用断言，但真实模型多轮入口未接到现有单回合 Runner。对未配置的其他合法日期是覆盖缺口，不能强判模型错误。 |
| P4：展示后问包间 | 页面有逐字 merchantQuote，真实取页/问答链在 fixture 控制中执行，可读 `requests`、`pageQuestion` 和引文。 | 诊断可到取页/作答，独立正确性缺 grader 时未评；不能把 fixtureAnswer 当评测答案。 |
| P4 取消条款问答/B1 条款控制 | `cancellation-question.json` 和替换后的本地页可产生已保存引文；main 的组合测试覆盖普通 B1 条款接线。 | C 的引用/渠道绑定只证明其实际核验范围；真实问答/条款准确率没有被诊断补判。 |

用户发言/Agent 提问部分可见于 `initial/after.conversation`、`activities`、`requests`、`trajectories`；现有 FakeClock 消息时间不是实际墙钟，缺 `clockDomain=WALL_TIME` 和明确应答关联时，每轮响应时长未评。A 的 `run-stage-assessments@1` 接口只预留读取；本版不实现其判断。本版不纳入 G6，后续合入真实整组装入口和独立评价再形成新基准版本。

## 5. 成绩单结构和字段来源

JSON 草案是 [scorecard-shape.draft.json](scorecard-shape.draft.json)。所有成绩为 null，表示尚未运行，不是预填 0 分或手填评分。真实成绩单每轮 Markdown 开头固定展示用途/暴露状态、代码与输入指纹、实际分母和以下表格，附 JSON/原产物指针：

| 题目 | 计划 k / 启动 / 完成 / 中断 / 可评分 / 能力分母 | 各结果类型次数 | S0 声明/越界：存在、未发现、未评 | 首点分布（含确定性和未评） |
| --- | --- | --- | --- | --- |
| 每个冻结 case ID | 实际计数，缺记录单列 | 沿用所有原枚举，不能只保留成功/失败 | 不把缺证写成 0；出现 S0 的 run 并集去重 | 附每格 attempt ID 与诊断指针 |

随后列：整体交付/诚实处理分子分母、用户目标完成原状态、首点×严重程度、见证覆盖观察、固定来源耗时、失败/未评/覆盖缺口及中断记录。同题 k 次并排展开，正文不倾倒严重程度原 JSON；原结论仍保留在引用附件。

| 成绩单内容 | 唯一数据源/聚合口径 |
| --- | --- |
| 结果类型、是否完成目标 | 原 `evaluation.outcome`，含 `type/capabilityDenominator/userGoalComplete`；原 `evaluation.execution.taskProducedQualifiedResult` 并列保留，二者不互相覆盖。包括已有 `NOT_A_VALID_SAMPLE`、`NOT_EVALUATED` 枚举。 |
| S0–S4 | 原 `evaluation.severity`；S0 另列 `S0_DECLARATION`、`S0_BOUNDARY` 的 PRESENT/ABSENT/NOT_EVALUATED。总 S0 次数按原 aggregate PRESENT 的运行数；分项不相加重复计数，保留原因和证据。 |
| 首点/耗时/覆盖 | 原 diagnosis 的三栏、`firstPoint`、`experience.timing` 及现有跨运行 summary；不读取生产原因码来确认偏离，不重建缺失时刻。 |
| 合格交付率 | outcome=QUALIFIED_DELIVERY 且原能力分母 INCLUDED 的次数 / 原能力分母 INCLUDED 总次数。数值只是已有结果的汇总，不是新资格判定。 |
| 诚实处理率 | **窄口径**：已有 HONEST_NO_RESULT 且 INCLUDED 的次数 / INCLUDED 总次数。另列原 `userGoalComplete=NO`，不把诚实收尾算完成目标；不把所有无结果、取消、失败或耗尽预算都算诚实。这个名称的分子分母须随复核冻结。 |
| 原 acceptance | 单独保存实际 `assessFixedSourceAcceptance` 收据及其 PASS/FAIL/BLOCKED、必要维度、原退出码。H005 可能既有 HONEST_NO_RESULT 又正向 acceptance FAIL，两个均保留。批次报告成功生成不等于 acceptance 通过。 |
| 环境和评价失败 | 来源 `coverageGaps`、原 acceptance BLOCKED、evaluation/diagnosis failed sidecar 独立计数。若原 outcome 仍 INCLUDED，不擅改分母；另列“环境缺口污染、不可据此归因代码”，不能把产品失败替换成 BLOCKED，或反过来。 |

计划、启动、result 保存、完成、中断、未启动、可评分、原能力 INCLUDED/EXCLUDED/NOT_EVALUATED 和评价失败分别列分母。“可评分”须有绑定正确 SHA 的成功 evaluator 输出，且 outcome 不是 NOT_EVALUATED；不能只因有 result 或系统 SUCCEEDED 就算可评分。必要维度仍未评的运行保留其原 outcome，同时附维度覆盖缺口。

外层中断排除能力分母；不足计划 k 的题只显示部分数据，不能和完整 k 轮次宣称改进。来源缺口与产品红项分开，不能通过运行后改为“可选”消除。原报告没有适用见证时，覆盖表整体 NOT_EVALUATED；有适用见证时复用现有 `witnessCoverageByStage`，SUPPORTED 与可行性未评分层，独立门店数和运行×店次数分别保留，已交付的运行也计入。首点×严重程度沿用现有聚合粒度及运行 ID，不能把一条下游阻断当多个独立根因。

**耗时的有效范围：**

- 可报告固定来源受控运行总时长、实际模型调用/用途、诊断的 `stageBreakdown.modelSteps[].latencyMs`、实际 Agent 步数及原资源上限。逐调用 latency 的和是服务调用计数，可能重叠，不能当墙钟；只有诊断有合法起止区间时才用 modelWallMs。
- 诊断的证据齐全、服务端展示、两者差按原 status/value/basis/refs 读取；缺值不从生产合格时间推造。固定 Runner 的 journal startedAt 是真实墙钟，状态/来源时间从冻结的八月业务 referenceTime 推进，两种绝对时钟不直接相减。因此这些三个时刻在当前产物很可能 NOT_EVALUATED，不能承诺全部可报。基准不修诊断或回写时间戳。
- 固定 Google 和页面即时响应，加载/重复加载仅为本地 fixture 操作的次数/耗时，不代表网站等待；实际 UI 渲染、Google/网站延迟均 NOT_APPLICABLE 或未评。没有 client 确认不能称首屏时间。每轮时间仍需真实消息关联；本版只有单回合。
- 评价器 S3/S4 等若未评照抄未评，不能把“模型快了”升级成新严重程度或通过门槛。所有体验指标只报告。

## 6. 冻结与两轮比较

运行前提交一份严格、版本化的 manifest，引用实际存在的输入字节、SHA 和配置。冻结对象包括：有序题目清单/原文/Gold、注册期望、固定场景和来源 I/O 检索/页面行为、固定地点/半径与注入规则、原 referenceTime、全部有效资源上限、模型显式名称/供应商版本信息、每用途采样参数、每题 k、执行模式/次序、轮次调用与墙钟上限。代码提交号单列为比较变量。

还须冻结独立 evaluator/rubric、评价输入及 diagnosis 实现指纹。只对代码变更比较时这些也应相同；否则不能把 grader/诊断变化误报为 agent 改进。不能只核对一个版本常量；完整相关文件依赖清单在停止点 2 fixture 验证时固定。当前等价表/对应表按 artifact SHA 适用；不能把历史人工索引匹配复制到新运行。`labels.yaml` 不进入入口/诊断/成绩单。

模型名从显式 manifest 取得，与实际请求配置/返回 model 逐次对照；不能只继承机器 `DEEPSEEK_MODEL`。本批不读 `.env` 或网络，因此拟用 DeepSeek、**具体模型名及可记录版本留待复核冻结**；历史 deepseek-flash 仅是成本依据。若供应商只暴露可变 alias，不伪造不可变版本：记录请求/返回名及 revision 未知，两轮标限定比较，不能声称代码是唯一实际变化。读取到不同模型/版本直接拆组，不混算。

题目、Gold、来源、配置（包括 k、模型、预算）任一变化即新基准版本；不直接比较旧总分。切换成本档位同样不是同一冻结轮次配置。只改变代码的两轮才逐题并排；同一模型 alias 未锁定仍须注明限制。没有更改的共同子集可以描述，不冒充整版可比。

**随机性参考，不设门槛：** 每题独立启动 k 次、保持原始结果和每类次数，不以一次“通过”定整题。按题配对的是代码版本下同一个问题，并非把第 i 次模型随机输出当统计上的匹配对；当前 gateway 不提供 seed，temperature=0 也不能保证确定性。不补跑直到成功，不挑最好一次。

| k | 次数变化的阅读建议 | 精确参考（两组独立 k 次；仅辅助看噪声） |
| --- | --- | --- |
| 3 | 1 次变化首先视为噪声候选；2 次值得查原产物，仍不足以确认改进。 | 1/3→3/3 的双侧条件概率检验 p=0.4；即 0/3→3/3 也 p=0.1。 |
| 5 | 1–2 次变化证据弱；3 次作为排查信号，不作显著或回归门槛。 | 1/5→4/5 p=0.206349；0/5→4/5 p=0.047619，说明相同差值不能脱离基数判断。 |
| 10 | 1–3 次通常仍很不稳定；4 次起值得查看分层，5 次也不一定能排除噪声。 | 3/10→8/10 p=0.069779；2/10→8/10 p=0.023014。 |

数值由组合数公式离线计算，公式和样例在 `cost-and-comparison.draft.json`；没有做多重比较校正，也不假定真实模型/供应商满足独立同分布。因此这里只给参考，**不以某个 p 或次数差决定通过/签收**。S0 单次出现仍按现有 Eval Skill 停批，不由平均成功率抵消；没有独立核验不得写“S0=0”。

## 7. 成本依据、共享额度与三个档位

找到另一现有工作副本 `.eval-artifacts/restaurant-fixed-source-model/` 中 **29 份**原始整单真实模型记录；未重跑或重评。逐份原相对路径、SHA、模型名、旧 Gold、调用计数、墙钟和状态在 `cost-evidence.json`；该目录未存于当前分支，原始本机根路径明确记录，仅为成本 provenance，不作为未来 Runner 的绝对路径依赖。

| 题目 | 历史记录数（含失败/短运行） | 调用数范围 / 中位数 | 原记录执行时长范围 / 中位数 |
| --- | --- | --- | --- |
| H001 | 5 | 1–5 / 4 | 2.117–10.722 秒 / 5.594 秒 |
| H002 | 6 | 2–9 / 9 | 3.621–13.350 秒 / 8.842 秒 |
| H003 | 6 | 4–5 / 4 | 5.231–8.840 秒 / 6.657 秒 |
| H004 | 6 | 5–7 / 7 | 5.912–8.711 秒 / 6.935 秒 |
| H005 | 6 | 6–8 / 8 | 7.822–10.877 秒 / 8.596 秒 |

这些记录使用旧 Gold @6、旧代码/Prompt/来源和 deepseek-flash，不具有本轮模型版本锁定；不能把系统 SUCCEEDED 当资格通过，也不能将该速度预测为当前 SLA。两条附加题/G6 在这批中没有可用的同入口真实模型成本。当前准备阶段不报价币值：现有记录不是最新价格/发票，本批也不查询价格。

共享额度观察：main 账本为已用 171；本机 A 后续账本已 228，C 副本包含其同一批调用。按 entry ID 并集去重后 **570 条、零内容冲突、模型调用已用 228/1600，剩余 1372**，不是三份 cumulative 相加。C 快照截至 `2026-11-02T09:59:45.081852+01:00`，SHA `fde2dfdb61436bfe2cb13f93f40895c8c96a9bce7d50241d42113d78979d590a`；其他两个快照 SHA、228 条非零收费条目摘要与校验在成本文件。A 在核查期间另加零调用记录，计数仍为 228；并集原始观察另存 [A gzip 原件](budget-observed-A.json.gz)和[C gzip 原件](budget-observed-C.json.gz)，便于离线复算，不成为第二本权威账本。本批不修改账本、不占用/预留额度；并行线继续运行会改变余额，获批运行前必须重读共享账本并保留一致的预留记录。

以下均为 3 题（H001/H003/H005），拟每次 **30 次模型调用、30 Agent 步、300 秒执行上限**，串行按重复轮次交替题目；preflight 每次最多 10 秒、整轮最后预留 30 秒收尾。现有 CLI 默认 30 调用/12 步/30 秒，这里显式配置，不能靠默认值。源码实际上接受 1–50 调用；本设计采用用户所述 30–50 范围中的 30，不扩额度。

| 档位 | 题数 × k / 计划运行 | 历史中位数相加的量级，非当前预测 | 本轮模型调用硬上限 | 整轮墙钟硬上限（含 preflight/收尾） | 占 1600 / 占当前剩余 1372 | 最坏执行后剩余 |
| --- | --- | --- | --- | --- | --- | --- |
| A | 3×3 / 9 | 约 48 调用、1.04 分钟执行时间 | **270** | **47 分钟** | 16.875% / 19.679% | 1102 |
| B | 3×5 / 15 | 约 80 调用、1.74 分钟执行时间 | **450** | **78 分钟** | 28.125% / 32.799% | 922 |
| C | 3×10 / 30 | 约 160 调用、3.47 分钟执行时间 | **900** | **155.5 分钟** | 56.250% / 65.598% | 472 |

历史量级为三题调用中位数之和 16、执行时长中位数之和 20.8465 秒再乘 k，未计 preflight/评分/报告，不是付费批准依据。授权应按右列硬上限和最新账本，而非历史均值。50 调用/题会使三个档位上限变为 450/750/1500；最后一档已超过这次观察的剩余 1372，不可执行，必须另成获批配置，不能运行中加码。本报告不替用户选择频率，不申请或消耗本轮真实调用。

preflight 是 DeepSeek `/models` GET，不是 completion，不占上述付费调用计数，但其请求/时间单列；不会访问 Google/餐厅网站。当前 DeepSeek gateway 的一次合法 complete 只有一次 POST，没有内部重试；语义修复等多次 complete 都必须逐次计入。旧记录的单调用 latency 和墙钟存在重叠/时钟差，估算使用原执行 elapsed，不把 latency 简单加成墙钟。

## 8. 一条命令的入口设计（未实现、当前不可执行）

拟命令：`npm run eval:restaurant:dev-benchmark -- --manifest <已提交且SHA冻结的manifest.json> --output <全新轮次目录>`。这个 script 本批**没有添加**。保留现有付费开关，但开关不是额度授权；fixture 模式须走同一注册/组装/评价/诊断流程，模型传输被 fixture 替换，不读取 Secret。

最小实现方案是在 eval 侧增加串行薄入口，复用已有单题 CLI/执行入口与 journal，不复制 Runner、评测器或平台，不导入能力核心，不申请组件白名单：

1. **先建轮次计划与外层 started 收据**，独占新目录，核对 clean code commit、manifest 自身 SHA、全部冻结文件/展开配置、模型和额度授权。未知/变更 SHA、模型名为空或预算不够时在任何模型请求前停止，保留 NOT_STARTED/配置阻断，不制造业务成绩。运行配置也要预先提交，而非运行后补记。
2. 按 `rep1:H001,H003,H005 → rep2:…` 串行调用现有真实模型固定来源入口；显式传 `--max-model-calls 30 --max-steps 30 --timeout-ms 300000`。分配剩余额度时预留当前 child 可能使用的全部额度，不并发超卖；失败调用和已发出但未返回的调用也计入，不能只数成功返回。当前包装计数发生于 provider.complete 之前，gateway 无隐式重试，可保守按已准入次数记账；计数缺失按已预留上界占用，不能退回成零。preflight 的 10 秒也计入墙钟。
3. 每次结束按现有顺序先保存原 result，再 `evaluateArtifactAfterFinish`，再取得自动 diagnosis；acceptance 实际调用并单独保存原收据，不填评分字段。成绩单只读取 SHA 绑定正确的三份产物，沿用原 outcome、severity、资格和首点。诊断失败不覆盖 evaluation；evaluation 失败不覆盖 result。普通业务 FAIL/子进程非零不会把整轮伪装成编排中断，仍记录后续计划题；仅预算、真实外层中断及现有 S0 停批规则停止新调用。
4. **轮次两种预算先到即停**：调用准入不超过轮次上限；独立真实墙钟在硬截止前 30 秒停止启动/执行付费工作，余下仅有界取消、存盘和汇总。业务时钟冻结也不能绕过。最后硬截止仍未结束时强制结束 child，外层 interruption/finish/trace 由父进程保留；禁止自动继续、重试或重跑缺样本。每次评价的耗时也占轮次时间，可能使剩余题无法启动，不能为了凑 k 延长轮次。
5. 外层强制中断按现有支持的原始中断输入交给真实 Evaluator，结果应为 ORCHESTRATION_INTERRUPTED，能力分母 EXCLUDED；缺 result 的维度未评。**单题自己的真实预算/失败/业务收尾不因此改成外层中断**，保留 evaluator 原分类。若已有 result 完整，则不回写/伪造；中断输入、评价和原 result 分开保存。
6. 父进程每完成一题先追加实际 artifact/evaluation/diagnosis 索引，再尝试汇总。使用唯一 round/attempt ID 和不可覆盖写入；没有当前文件时保留缺失状态及原因。中断轮次照样输出部分成绩、全部分母/停止原因和未启动清单；后续只能零调用地对已保存产物重新生成另名汇总，不能覆盖历史或悄悄续跑付费题。

**现有入口需要在停止点 2 特别核验的事实，不在本批修：** preflight 在单题 journal 之前，因此父级必须先留启动/中断记录；CLI 外层 maxModelCalls 默认 30，但目前未把该值传入 `executeFixedSourceCase.maxModelCalls`，内部 Runtime 仍按共享默认 50 计算可用额度。外层 30 的硬调用上限仍在，成绩单须如实记录声明/有效限额差异；不能报告它们已统一。是否仅在 eval 调用处传已有参数，由停止点 2 复核明确；不改产品策略，不用手填资源评价消除差异。

## 9. 主要失败机制与下一步检错证据

这里列实施验收对象，**不是已执行测试**；沿用 Test Skill，不另建规范或测试平台。

| 主要失败类型 | 停止点 2 所需实际链路与对照 | 本批证据/尚未覆盖 |
| --- | --- | --- |
| 输入/来源漂移却继续比较 | 完整 fixture 轮次正常产物；只改一个冻结输入字节，任何模型调用前拒绝。 | 已逐文件/逐题取 SHA；执行拒绝逻辑未实现。 |
| 绕过组装或先填资格 | fixture 从原始请求进入既有 CLI/execute→assembly，真实 Evaluator 和 acceptance 产物，再只读汇总；由 arch 门禁约束。 | 已读实际入口；没有运行整轮，不声称真实模型通过。 |
| 中断被当失败或完整样本、丢历史 | 实际受控外层中断→保存原始记录→现有 Evaluator→diagnosis→部分成绩；正常完整对照；同目录再次写入必须拒绝。 | 复用既有中断分类支持；轮次保存和计数待实现。 |
| 调用/墙钟预算越限 | 多用途模型都计数，失败/在途也计；冻结业务时钟仍按独立墙钟停；正常预算足够完成控制。 | 现有两层限额与 preflight 边界已盘点；轮次硬上限尚未实现。 |
| 缺评价/未评被当 0；业务红项被藏 | 缺评价、错 SHA、缺 witness/时间、fixture gap 的实际对照，保持未评/BLOCKED；原 outcome/severity 深相等；H005 红项不删除。 | JSON 草案独立列缺口/分母；汇总器尚不存在。 |
| 用相似题/随机一次输出宣布改进 | 同题 k 次原始次数；变更 k/模型/Gold 必须不同指纹；无排序需求不新增主观评分。 | 已给比较定义和噪声算例；没有实际成绩比较。 |

## 10. 本批执行与复核停止点

本批只进行了文件/代码读取、7 题注册输入的只读加载、独立距离与成本算术、JSON/路径/SHA/引用/diff 静态核查；命令及结果见 `static-checks.json`。没有执行来源观察、浏览器页面、Agent、Evaluator、真实模型或第一轮 benchmark。纯设计按 Test Skill 文档矩阵验证，**五门禁未运行，也不引用上批全绿当本轮实现通过**。

请复核：三题选择及明确不覆盖的推荐/G6范围、诚实处理率的窄口径、模型显式名称/版本记录策略、k 与硬预算档位、现有限额差异在停止点 2 的最小处理。此处仅列待决定项，不启动付费，也不为未来额度默认授权。

停止点 1 文档提交后仅推送 `codex/chore-dev-benchmark-v0`，不合 main，等待复核。停止点 2、fixture 整轮、真实模型基线、五门禁与运行频率均未实施。
