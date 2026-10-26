# ADR-0045：有界只读调查的收尾时间预留

- Status: Accepted（用户停止点5于2026-10-26 CET批准修订稿；已实施共享层，离线五门禁全绿；Live未重跑）
- Document revision: 1.1
- Last updated: 2026-10-26（Europe/Vienna CET；复核编号20261026）
- Source of truth for: F6动作耗时中位数准入、固定收尾预留与取消时完整子结果保留
- Related ADRs: [ADR-0034](0034-qualified-read-scope-and-investigation-budget.md)、[ADR-0038](0038-model-call-default-delivery-window.md)、[ADR-0043](0043-provisional-directory-entrance-coordinate-check.md)

## Context

F5机制已在Live验证，例01未达成，转3b与F6。重跑槽3决策行39在剩26.596秒时仍开始CHECK_AVAILABILITY，尾段27.292秒没有持久化完成结果；这段受截止删失，不能作为完成查位样本。另两条删失尾段93.620/121.086秒也排除。原始评价不改，F5不重开。

停止点4用户决定改用**20秒加该动作完成耗时中位数**，不采纳前稿最大值加根决策再取整的125/125/190秒门槛。前稿在固定Git `afd9c4e1`保留，仅属历史提议，不构成当前准入。无新增真实调用或额度授权。

## Decision

1. **整单固定预留20秒**，包含在原500秒内，供取消/收口、END_READ或已有合格PRESENT_RESULTS和有界可读结论；不增加模型50次、Google或来源额度，不重置累计计数。按本决策在共享层接线，验证范围见实施记录。
2. 每次从权威deadline算剩余时间。读取动作的门槛为`20秒 + 该动作类型已完成执行耗时的中位数`。模型决策前计算合法集合，模型思考后执行前再用同一时钟核验；门槛包含等号，不再加最大值、根模型耗时或190秒常量。未满足某类门槛就移除该类读取，不能经隐式重试、换来源或新导航绕过。进入收尾时只保留END_READ和已符合原展示规则的PRESENT_RESULTS；无合格候选只保留END_READ。
3. 初始估时由8次已有F5 Live的**62个完成动作**按类型分组，排序取中位数，偶数样本取中间两个的算术平均。保留返回的失败/快速拒绝样本（包括0ms），不筛成成功集；三条删失尾段不参与。固定输入及中间样本见[计算收据](../../.eval-artifacts/phase3a-prime/f6-draft-revision/thresholds.json)，脚本先提交，输入来自固定Git blob，未重跑环境。

   | 动作 | 完成样本 | 中位数ms（秒） | 准入门槛ms（秒） |
   | --- | ---: | ---: | ---: |
   | SEARCH_RESTAURANTS | 23 | 45,154（45.154） | 65,154（65.154） |
   | INVESTIGATE_CANDIDATE_FACTS | 16 | 30,383.5（30.3835） | 50,383.5（50.3835） |
   | CHECK_AVAILABILITY | 23 | 46,453（46.453） | 66,453（66.453） |

   合计23+16+23=62。实现以ms比较；权威时钟若只有整数ms，50,383.5对应最小可准入50,384ms，不额外向5秒取整。样本从动作执行开始到已完成轨迹返回，根模型思考不再另计入门槛；思考造成的时间侵蚀由执行前重核反映。它是估计，不是动作必能完成的保证；中位数以上的读取仍由取消截止兜住。
4. 固定20秒依据保持：74次既有根决策p95=6.388秒、最大12.212秒；两次END_READ模型3.785/3.400秒、模型后产物收口0.346/0.364秒；三次重跑截止后产物代理最大0.696秒。12.212+0.364+0.696=13.272秒，取20秒留6.728秒余量。0.696不是取消实测，两次结束样本也不能认证任意展示成本；实现必须验证慢取消/慢模型/投影，不足则交复核，不扩总预算。
5. 获准读取继承不晚于`整单deadline−20秒`的取消，进入收尾即停止新请求并关闭会话；所有来源90秒、地区4页、详情10次、一次纠正上限继续累计。保留取消前**完整完成并已进入checkpoint的子结果**，正读到一半、未完成身份/请求核对或取消后才返回的子项均UNKNOWN。迟到结果不得复活流程、补调用或改写较新证据。
6. 部分结果不获得额外资格：继续走同店身份、日期、人数、时段、HARD及新鲜度核对；原始source evidence和request关联不省略。现有已接纳候选不因取消被删除；取消中的刷新仍遵守原失效规则，不能为了保留结果复活旧库存。已完成A、未完成B在同一个正常事件中分别记录原检查与UNKNOWN，不能把整批伪装为完成，也不能把UNKNOWN说成无店。
7. 结论只由既有证据支持：有合格结果展示短批，否则说明本轮未核实符合全部条件的门店、已查范围及剩余缺口，不说附近已无店或非HARD店满足条件。原ADR-0038调用预留与更早的合格交付条件仍适用；无模型余额/最后模型失败复用可信状态形成有界结束，不加模型或备用Provider。
8. 实现范围限共享根Agent合法动作、执行前复核、读取取消与完成子结果交接。Web/Runner共用；不改站点parser、Guard或增加预算。实际受影响Prompt/Schema在实现批递增并更新全部调用方，不提前为草案加运行常量或兼容路径。

## 草案期事件模型核对（frozen regression，固定main afd9c4e1）

**表示层能做到，查位和事实已有逐店checkpoint；搜索取消交接尚有缺口。** 此结论来自当前代码，不把草案当实现。各源码SHA见计算收据。

| 链路 | 当前证据位置 | 能力与限制 |
| --- | --- | --- |
| 逐店完成边界 | `restaurant-execution-router.ts:79–88`的candidateCheckpoints | 事实/查位共用；每店promise完整返回且signal仍有效后才进入completed。A已入checkpoint、B取消时可分开；只完成页面/半个provider调用不算完整子结果。 |
| 合并与保留 | 同文件mergedFacts `:107`、mergedAvailability `:120`、取消catch `:338` / `:414` | MODEL_CALL或DELIVERY_TIME reserve保留完成店的checks/evidence/offers，剩余店记UNKNOWN/RESERVE_REACHED，metadata.reserveReached含completedCandidateIds。已有facts-call、availability-call/time控制见`restaurant-execution-router.test.ts:770`。当前时间接线是条件式45秒窗口，尚非本提议固定20秒。 |
| 事件与接纳 | `contracts.ts:867`、`:891`及`:900`；`task-definition.ts:388`、`:461`、`:554` | SEARCH_COMPLETED、CANDIDATE_FACTS_CHECKED、AVAILABILITY_CHECKED本就能带部分候选/逐店checks和原证据。Reducer按请求关联后接纳；展示仍经原身份/日期/人数/时段/新鲜度与HARD门控。不需要为“完成A、未知B”新造一套State事件。 |
| 搜索取消缺口 | Router SEARCH `:245–278`、withProviderReadDeadline `:508–566`；Native `:1323` | SEARCH未像facts/availability保存Router逐店completed；Native已有nativeAccepted错误载荷可收集已接纳候选，但父signal取消时deadline包装仍可抛弃返回值，SEARCH catch会产SEARCH_FAILED。**当前不能保证搜索动作内部每个已完成候选跨父取消持久化**。 |
| 关闭与持久化边界 | withProviderReadDeadline及Agent dispatch | generic browser会等待自身取消关闭，尚无普遍20秒关闭上界。checkpoint在Router内存中，事件返回后才经既有dispatch持久化，不能承诺进程崩溃前的增量持久化。 |

实施代价：优先复用facts/availability现有checkpoint、reserve元数据和事件，不加重复事件或把未完成provider内部片段猜成成功。搜索需要最小的完成结果交接：将来源组合已完整接纳的候选/证据通过既有SEARCH_COMPLETED返回，父reserve取消路径保留这份完成快照，未读完的来源/续页仍UNKNOWN、不标exhausted；必须补真实composition取消控制后才能声称实现。若现有搜索promise无法在有界关闭内交出完成快照，代价是丢失当次未提交的内部候选；该缺口必须在实施前闭合或明确回报，不能声称已有结果都已保留。本批只指出合同/接线工作，不实现它；普通用户取消和500秒硬中止仍保持各自真实分类，不包装成正常无结果。

## Offline red/green design（设计原文；执行结果见实施记录）

- **槽3有效红灯**：固定F5重跑槽3决策39行前状态，标“本地构造，非网站回放”；通过真实合法动作计算，将时钟置于deadline前26.596秒并保留原预算。模型提出CHECK_AVAILABILITY，断言不合法且来源执行0次。旧时间准入应在这个目标断言失败，不手填legalActions。
- **同断言绿灯**：实施后只可END_READ／已有合格展示；原composition产出有界诚实结论及artifact，再独立核验声明。未知不转无店，无证据不展示；计数和截止不重置。
- **中位数正常控制（新增）**：剩100秒（66.453 < 100 < 190），在同样合法候选/预算下CHECK_AVAILABILITY仍可开始，来源独立返回正常绑定证据，按剩余预算交付。不能沿用前稿190秒限制。三类动作各核验中位数门槛的等号/两侧；模型思考后跌破门槛则执行0次，不增加模型调用。
- **取消保留完整店（新增）**：A完整返回并checkpoint，B读取中触发deadline−20秒取消；现有Router→事件→Reducer→展示链保留A的原始证据及查位，B未知，无B库存。A的错身份/日期/人数/时段或过期控制仍拒绝展示；A正确时短批可展示。控制沿既有Router逐店fixture方式扩展，不预填合格Evidence。
- **搜索完成子结果控制**：实际Native/Google替身产生已完成A和进行中B，再以父reserve取消；验证A经原SEARCH_COMPLETED保留、B未核实、来源未穷尽、原计数不回零。这个控制专门捕获上表缺口；不以facts/availability已经通过替代搜索接线验收。
- **取消/迟到与结论**：有界慢读取/慢关闭/最后模型慢或失败/余额0，在500秒内给可读结论，无后台请求、迟到覆写或新调用；普通用户取消及硬截止分类保留，不用正确TIMEOUT替代诚实收尾。
- **不退化**：原≤4模型调用预留、已有合格短批、原身份/HARD/日期/人数/时段/新鲜度、S0与来源90秒/4地区页/10详情/一次纠正全部保留。局部合法集合通过不等于完整Web/Runner收尾链通过。

## Consequences

中位数门槛比前稿更晚收敛，允许100秒时的正常查位；它不保证剩余时间足够完成任何读取，固定取消与部分结果交接必须共同实现。20秒是有证据的初值，尚无慢关闭/投影保证。本决策已按用户批准实施共享层，离线红绿灯及五门禁在实施报告记录；真实来源和真实模型未重跑，现有F5能力评价仍FAIL。

## Alternatives considered

- 前稿最大值＋根模型最大值再取整：已按用户复核撤回，不能把较高门槛继续留在代码或控制用例。
- 只靠模型≤4调用或等500秒硬超时：无法解决槽3时间已不足的查位及可读收尾。
- 取消丢整批或采用半个provider结果：前者丢已完成店，后者缺绑定；复用完整逐店checkpoint并修搜索交接。
- 提高总预算、写死最后27秒特判、放松资格或恢复旧库存：均不采纳。

## 2026-10-26 CET实施记录

Native/Google已完成子结果先补既有SEARCH_COMPLETED交接，再实施根动作准入、重核和全读取取消。Web从语义开始的ModelRunUsage原截止映射到Runtime时钟；Runner原截止继续累计。State23/TaskDefinition21、Context16/Agent Prompt28；Action Schema4不变，旧活动构造更新，历史artifact不改，无生产迁移。

实现给来源2秒交出完整快照并关闭，包含于20秒；不settle时READ_CANCELLATION_UNSETTLED技术失败，不冒称已保留。根决策最晚deadline−2秒停止等待并用原资格形成可信投影；2秒是本批关闭/投影的实现上界控制，不是改准入中位数或新增整单时间。真实任意来源的关闭上界尚未Live认证。完整子结果仍通过原关联/资格链，无兼容事件路径。

[实施与四层报告](../../.eval-artifacts/phase3a-prime/f6/report.md)记录槽3、搜索交接、100秒正常、取消完整店、慢取消/慢模型/零余额和Web/PGlite红绿灯，以及五门禁与未验证外部边界。

## Related documents

[冻结计算脚本](../../.eval-artifacts/phase3a-prime/f6-draft-revision/calculate-thresholds.py) · [历史计时](../../.eval-artifacts/phase3a-prime/f3/timing-evidence.json) · [修订报告](../../.eval-artifacts/phase3a-prime/f6-draft-revision/report.md) · [Test Skill](../skills/test/SKILL.md) · [Eval Skill](../skills/eval/SKILL.md)
