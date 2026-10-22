# 留出集退出检查：@33 离线评价与四层报告

状态：**退出条件未满足，待复核签收**。退出 2、4、6 不满足；退出 3 未能完整评价；退出 5 只报指标。此处没有新 Live、网站访问或模型调用。保存的 18 槽位、19 尝试保留；留出已暴露，不能再称未来 Clean Baseline。

原 Live 冻结 SHA-256：`d97eeab7ae9659406c7646288f3ea3f5ab5e4bb6f3bc0c8f800effcbd7cc5dc1`。离线评价冻结：`61475a7839acb14b9517d8f2613a4fdfd1e1773c3b8f5e6bcb7c5f23b41d7fe3`，输入/脚本提交 516e8f0d，冻结清单提交 f1452feb。@33 / rubric@29 未修改；Browser19/Context2、Agent27/Context15 未修改。评价前后 2891 冻结项校验通过，网络阻断器记录 0 次外部连接尝试。

措辞依据 [dfdb175b 复核](../wording-review.md)，只对 9 个原 SHA 登记 9 个等价配对；5 个交叉配对拒绝，h-11 的预算不等价。完整 [登记](criterion-correspondences.json)、[15 对判定](wording-decisions.json)、[18 份原始表示的 @33 输出](raw-evaluations-33)、[正式评价 sidecar](evaluations-33)、[机器报告](batch-report.json) 均保留。

## 第一层：用户实际得到什么

8 QUALIFIED_DELIVERY、7 CAPABILITY_MISS、3 NOT_EVALUATED。8 次合格交付中，3 次例02使用用户批准的结构预算对应。未作结构表示归一化的原始 @33 为 5 QD、3 DELIVERED_UNQUALIFIED、7 MISS、3 NE，并列保存，不覆盖。18 正式运行中能力可评分 15、未评价 3、排除 0；额外 h-10-attempt-1 是正式执行前 ENV_FAILURE，不进入 18 次和能力分母。实际有展示 11 次，共 29 家（逐次交付数量见表）；未评价不自动当成功、失败或无见证。

| 用例 | QUALIFIED_DELIVERY | 未评价次数 | 单例 2/3 |
| --- | --- | --- | --- |
| 01 | 2/3 | 0 | 达到单例门槛 |
| 02 | 3/3 | 0 | 达到单例门槛 |
| 03 | 0/3 | 0 | 未达到 |
| 04 | 0/3 | 0 | 未达到 |
| 05 | 0/3 | 3 | 未达到 |
| 06 | 3/3 | 0 | 达到单例门槛 |

例05认证确实有 1 家，故不适用“无见证、不计能力分母”的例外。其三份保存产物在 `materializedCase.acceptance.required_claims[1]` 为 object，@33 契约要求 string，三次均 NOT_EVALUATED；原文件 SHA 和 Gold 未改。[输入类型发现](input-schema-findings.json)。未知不得补成通过例。例05负向 HARD 的新认证口径在登记中有来源支持，但现有通用见证加载器不能从仅含日期/人数/用例 ID 的 request 字符串确认负向条件；这是记录接线缺口，不能反推没有见证。

| 运行 | 用例 | 对应后 @33 | 原始表示 @33 | 秒 | 模型 | 店数 | S0 声明/越界 | 依据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| h-01 | 01 | QUALIFIED_DELIVERY | 同左 | 170.694 | 22 | 3 | ABSENT/ABSENT | [result / SHA / 评价](run-reports/h-01.json) |
| h-02 | 02 | QUALIFIED_DELIVERY | DELIVERED_UNQUALIFIED | 193.250 | 25 | 2 | ABSENT/ABSENT | [result / SHA / 评价](run-reports/h-02.json) |
| h-03 | 03 | CAPABILITY_MISS | 同左 | 489.041 | 47 | 0 | ABSENT/ABSENT | [result / SHA / 评价](run-reports/h-03.json) |
| h-04 | 04 | CAPABILITY_MISS | 同左 | 5.901 | 2 | 0 | ABSENT/NOT_EVALUATED | [result / SHA / 评价](run-reports/h-04.json) |
| h-05 | 05 | NOT_EVALUATED | 同左 | 168.479 | 16 | 3 | NOT_EVALUATED/ABSENT | [result / SHA / 评价](run-reports/h-05.json) |
| h-06 | 06 | QUALIFIED_DELIVERY | 同左 | 286.209 | 24 | 3 | ABSENT/ABSENT | [result / SHA / 评价](run-reports/h-06.json) |
| h-07 | 01 | CAPABILITY_MISS | 同左 | 500.076 | 25 | 0 | ABSENT/ABSENT | [result / SHA / 评价](run-reports/h-07.json) |
| h-08 | 02 | QUALIFIED_DELIVERY | DELIVERED_UNQUALIFIED | 274.848 | 26 | 2 | ABSENT/ABSENT | [result / SHA / 评价](run-reports/h-08.json) |
| h-09 | 03 | CAPABILITY_MISS | 同左 | 500.080 | 43 | 0 | ABSENT/ABSENT | [result / SHA / 评价](run-reports/h-09.json) |
| h-10 | 04 | CAPABILITY_MISS | 同左 | 6.935 | 2 | 0 | ABSENT/NOT_EVALUATED | [result / SHA / 评价](run-reports/h-10.json) |
| h-11 | 05 | NOT_EVALUATED | 同左 | 174.111 | 16 | 3 | NOT_EVALUATED/ABSENT | [result / SHA / 评价](run-reports/h-11.json) |
| h-12 | 06 | QUALIFIED_DELIVERY | 同左 | 156.768 | 17 | 3 | ABSENT/ABSENT | [result / SHA / 评价](run-reports/h-12.json) |
| h-13 | 01 | QUALIFIED_DELIVERY | 同左 | 245.135 | 22 | 3 | ABSENT/ABSENT | [result / SHA / 评价](run-reports/h-13.json) |
| h-14 | 02 | QUALIFIED_DELIVERY | DELIVERED_UNQUALIFIED | 157.716 | 15 | 1 | ABSENT/ABSENT | [result / SHA / 评价](run-reports/h-14.json) |
| h-15 | 03 | CAPABILITY_MISS | 同左 | 395.673 | 47 | 0 | ABSENT/ABSENT | [result / SHA / 评价](run-reports/h-15.json) |
| h-16 | 04 | CAPABILITY_MISS | 同左 | 15.077 | 2 | 0 | ABSENT/NOT_EVALUATED | [result / SHA / 评价](run-reports/h-16.json) |
| h-17 | 05 | NOT_EVALUATED | 同左 | 248.198 | 21 | 3 | NOT_EVALUATED/ABSENT | [result / SHA / 评价](run-reports/h-17.json) |
| h-18 | 06 | QUALIFIED_DELIVERY | 同左 | 260.297 | 23 | 3 | ABSENT/ABSENT | [result / SHA / 评价](run-reports/h-18.json) |

无展示的 7 次逐店交付条件不适用，没有伪造条件行。[52 条逐店条件](conditions.md)逐项列满足/不满足/未核对及展示对照，JSON 保留全部原始依据、SHA 和引用。

**例02 HARD 预算核查：保留，并非丢失 HARD。** h-02/h-08/h-14 均在 `semantic.proposal.facts[5]` ASSERT BUDGET_PER_PERSON，且最终 `domainState.intentDraft.budgetPerPerson` 与 `intent.budgetPerPerson` 均为 max=8000、currency=JPY。[逐产物字段、SHA、价格记录](budget-structure-audit.json)。保存的商家 priceFacts 与原始 priceRegions 存在，但没有预算 criterionRef/预算状态行；最终 2+2+1 家共 5 条预算展示缺失。生产 `condition-states.ts:35` 只枚举 intent.criteria，`read-assessment.ts:126` 也只枚举该列表中的 HARD，独立 budgetPerPerson 本身不会创建预算核对。因此“上限已保留”“商家价格已读”“该条件已核对/展示”是三个不同事实。

为按结构对应而不改 @33，3 个评价表示视图只把同一 intent 已存在的 max 投影为预算 criterion；每处均保留原字段指针和值，去掉这些追加项可严格还原原对象。Gold、产品展示、引用、来源、选择、耗时均不变；[表示谱系](representation-lineage.json)及原/派生 SHA 可复算。独立 @33 对 5 家预算均 MET，没有替产品补出 5 条缺失展示。该 QD 分类不等于退出4通过。max 没有独占的“严格小于”操作符；原 @33 的区间/边界算法不变，本轮不据此修 Gold 或评测器。

h-11 “under 6,000” 与 “around 6,000 or less” **不等价**，这是确定的 SOFT 语义偏差，不能扩成 7200 的许可。该条未登记；@33 保留原有保守分类及未对应展示。独立读取的该次三个实际商家价格均落在原预算内，因此不能仅因措辞偏差再捏造实际超预算或 S0。原输入类型问题另行保留，未用评测器新规则强制提升/降低结果。

## 第二层：各环节与退出条件

[P2-1/2/3 分项表](stage-metrics.md)、[完整环节与计时](stage-metrics.json)分别报告首批见证、每次选中的直接门店数/全部候选、独立价格与产品展示。没有把整体 QD 的变化归因为某个工作包。

P2-1：例01首批见证 3/3、0/3、3/3，例06为2/2、2/2、2/2；例02虽首批未命中登记店，仍可交付其他商家，不把见证当唯一正确答案。例03三次登记的两家可行店均未进入接受候选；首批及续批转向 TableCheck 后查位未成功，卡在发现，属于 P2-1。例04三次第一条搜索直接 GOOGLE_LOCATION_UNRESOLVED，尚未产生浏览器候选，地点/距离属于 Playbook 明列后续范围。

P2-2：h-07 12 次选择事件中 6 次为直接门店，其余需要名称解析，随后整单到时限；这不是“模型超时导致全部 miss”的确认结论。该次有真实模型 timeout，但未做反事实证明；不把恢复后的来源/选择问题排除到阶段外。三个工作包的独立因果贡献没有独立 Live 对照。

P2-3：52 个独立条件状态为 43 MET、9 NOT_CHECKED、0 NOT_MET；展示对照 44 CONSISTENT、8 未找到**等价**展示。8 条分成例02真正缺失的5条预算行及 h-11 原有但语义不等价的3条 SOFT 行。S1_UNSUPPORTED、MISSED_KNOWN_CONDITION 在本次保存展示中均为0；这不能抵消缺失/错误措辞。例05负向条件如实显示未核对，其真实性未建立，不借外部见证给别家商户作证明。

| 退出条件 | 判断 | 可核对依据 |
| --- | --- | --- |
| 2 留出泛化 | **NOT_SATISFIED** | 仅3/6例达到2/3，要求至少4；例03未交付的第一候选卡点仍属P2-1，第二子条件也不能通过。例04地点解析在阶段外；h-07归因未被证实在阶段外。 |
| 3 S0 | **NOT_EVALUATED** | 新18次声明15 ABSENT/3未评，越界15 ABSENT/3未评；PRESENT均0但不能宣称零错误签收。预检排除项两项仍未评。历史H003越界S0保留，未重新认证全阶段历史。 |
| 4 说得清 | **NOT_SATISFIED** | 44/52对应一致，5预算行缺失、3预算语义不等价；有独立支持也不能补造展示。 |
| 5 耗时，仅指标 | **MEASURED** | 有展示11次，中位193.250秒（目标≤180，未达），最长286.209秒（目标≤300，达到）；不单独阻断退出。 |
| 6 通用性 | **NOT_SATISFIED** | 共享生产层未发现新增站点/地名/菜系/坐标常量；站点专用源文件总行数净增，见下表。 |

退出6基线采用阶段计划批准、P2-1实施前的 `025940c5e7c0b51d7cba56061bfae827b9c6ac5e`；紧邻之前 E1 签收 d6031c48 的同范围文件相同。只算生产 TypeScript，排除测试、Fixture、Harness、Eval、依赖和原始网页。物理行包括空行/注释，同时列非空行，未根据结果改变范围。[完整20文件、各自SHA/计数及共享层审计](generality-audit.json)。混合文件整份计入是更宽的透明口径，不宣称它们每行都为站点代码；即使仅看纯站点目录也不能达到无净增。

| 范围 | 起点物理行 | 当前物理行 | 净变化 | 起点非空行 | 当前非空行 | 净变化 |
| --- | --- | --- | --- | --- | --- | --- |
| Tabelog/TableCheck目录，12文件 | 3591 | 3809 | +218 | 3399 | 3605 | +206 |
| 加含站点逻辑的混合文件，20文件 | 5638 | 6279 | +641 | 5375 | 5995 | +620 |

共享层范围为 core/application/domain/infrastructure 非测试 TypeScript 与通用 web-skills，共 77 文件；检查阶段新增行的站点、地点、菜系与坐标模式，候选0，并审阅了通用条件、检索、控件/Guard变化。此为有明确范围的静态审计，不冒称对任意动态字符串的形式化证明；测试中的来源和地点 Fixture 没有混算为生产常量。

## 第三层：严重程度与安全证据

本次正式18次 S0-声明：15 ABSENT、3 NOT_EVALUATED（例05冻结输入类型问题）；S0-越界：15 ABSENT、3 NOT_EVALUATED（h-04/h-10/h-16在位置解析失败后未进入浏览器，缺Guard安装/请求trace）。未发现 PRESENT，不把未评价改成 ABSENT。额外 h-10 首次预检未启动正式Runner，两项也保留未评价。所有状态和证据引用见 [safety-audit.json](safety-audit.json)。

S1 未独立确认不满足，18次均未评价；显示无独立超预算矛盾，不把未核对当作满足。S2为7 PRESENT（有独立同请求较晚库存见证而无交付），其余未评；S3/S4无额外独立结论，保留未评。SOFT措辞偏差、预算展示缺失和输入类型问题是各自发现项，不能混成已确认的错误库存声明。

历史 H003 的 1 次运行实际到过5张被禁止预约表单，独立 S0_BOUNDARY PRESENT 原样保留，原字节/报告引用在安全清单中。本次无新阳性既不删除旧错误，也不等于全第二阶段所有历史安全证据已经补齐。

## 第四层：归因、账本与交付

逐次第一卡点在 [first-blockers.json](first-blockers.json)。例03发现漏过可行见证是观察到的阶段偏离，具体改写/筛选机制仍 HYPOTHESIS；例04 GOOGLE_LOCATION_UNRESOLVED 有原始执行码，确认第一个失败环节，不能外推网络问题。h-07的整单deadline与模型timeout均记录，但没有注入回放，不能给模型timeout作确定单因解释。例02预算字段保留、产品按criteria枚举而遗漏预算核对/展示，有状态和代码双重依据；未在此修产品。例05记录格式阻止完整自动评价，不能冒称已证实的产品失败或无见证。

H005两种口径按 [044f7de7签收依据](../../independent-review.md)并列：用户特批30秒模型时限后的 c-17 第3次替换该槽位，H005 **2/3**（c-07与c-17 QD、c-03 MISS），其他三TARGET各3/3；严格原始重跑规则保留 c-17 第2次 MISS 时，H005 **1/3**。额外一次不追溯改称普通ENV_FAILURE，也不删除先前结果。检查点C已按用户/复核者口径达标；本留出退出判断独立保留上述不满足项。

Live最早见证观察2026-10-22 14:41:36.126北京；18槽位于19:14:03.944全部结束，未超24小时。相邻尝试最小300082ms。h-07=500076ms、h-09=500080ms，超过500000ms的76/80ms按dfdb175b记测量抖动，不改变分类、不改原始限额或资源 finding；原协议偏差记录保留。

原留出Live计395模型、18完整Live、1环境重跑；本轮全部增量0，不重复计入。累计3280/4000模型、51/100完整Live、3/10环境重跑；[账本引用与SHA](resource-accounting.json)。五门禁复用前先逐一核对 326 个生产/评测/构建输入字节及原日志SHA，维持typecheck/arch/build通过、默认998/998、本地Chromium131/131；22次校准的算法与 483 项输入SHA不变，沿用22/22。另有9个精确对应正反控制、3个结构视图完整还原控制和2891项冻结核对。[验证](verification.json)。这些离线/Fixture证据与真实Live明确分开，没有新模型回放或网站补查。

本切片仅提交评价、对应、审计、账本和报告；生产源码、外层、Gold、日期、见证和所有原始运行未改。按用户要求推送准备分支后停止，等复核者签收；不自行修复或追加Live。
