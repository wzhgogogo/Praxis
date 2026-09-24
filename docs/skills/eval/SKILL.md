---
name: praxis-eval
description: 为Praxis模型和端到端质量定义独立oracle、证据、评分口径、比较方法和预先固定的验收门槛。
---

# Praxis Eval

- Document revision: 1.1
- Last updated: 2026-09-24

Eval负责质量维度、证据/评分规格、比较方法和验收门槛；不替代[Test](../test/SKILL.md)的功能覆盖与故障关闭。产品语义和安全边界以Accepted ADR、Domain/Architecture为准；H001–H005当前执行输入、自动/人工边界和命令以[当前只读验收契约](../../../src/eval/restaurant/agent-loop/cases/README.md)为准。

## 评价对象与证据状态

每次评价先声明对象、代码/配置快照、数据集/Gold版本、Evaluator版本、输入/位置/参考时间、预算和执行模式。执行artifact、evaluation和acceptance是三个不可互相覆盖的记录：执行说明发生了什么，evaluation说明已核验的维度，acceptance按预先固定门槛作出结论。

材料只可标为`current executable`、`frozen regression`、`superseded retrospective`或`draft / not integrated`。每份报告还记录`cohort`、`contaminationStatus`、`baselineEligible`、dataset hash、git commit、prompt/schema/scorer版本、调用数、延迟、Token和成本状态。开发集、Fixture、Mock、Replay、Live Read-only、Controlled Live-write与Clean Holdout不能互相替代或混报。

历史阶段叙述、旧版本运行状态和已退出的规程见[迁移映射](../../superseded/skills/TEST-EVAL-SKILL-PRE-RESTRUCTURE-2026-09-24.md)及历史日志；它们不改变当前合同或能力判断。

## 质量维度与独立oracle

每个要声明为“已评”的维度都要有独立oracle、最小必要证据、评分单位与分母。缺证据、未启动、上游阻断和评价器故障不伪装成零分或成功；已知的超时、预算停止、取消或明确失败仍进入完成和资源分母，并按实际合同判定用户目标未完成或系统处理是否正确。生产端的`verified`、eligibility或模型自述不能作为其自身评价oracle。

| 维度 | 独立oracle | 必要证据 | 评分单位与分母 |
|---|---|---|---|
| 语义保真 | 冻结Gold或人工预先定义的语义审查 | 原始用户表达、权威最终intent/语义结果、版本化Gold或审查记录 | 可评价turn；另报计划、启动、完成、可评分、未到达数量 |
| 结论支持性 | 重建候选、来源、请求、时段、身份、当前性与引用链 | 原始观察、关联/替代关系、展示或最终claim | 每个展示claim/候选；不以case总数掩盖漏项 |
| 调查与终止行为 | 当前合同允许的动作、实际轨迹与停止原因 | action/attempt、接纳/拒绝、资源、取消和终态记录 | 每个run或可归因阶段；未能判定充分性时保持未评估 |
| 时序、恢复与安全 | 权威State、Authorization、Attempt/Outcome和独立Verifier证据 | 请求版本、时钟/期限、事件因果链、同Attempt验证结果 | 每个受影响转换或Attempt；非法写、重复提交、错误成功为零容忍门槛 |
| 资源与可操作性 | 运行清单与资源记录，而非成功样本筛选 | 计划/启动/完成/超时/取消、调用数、预算、延迟、成本 | 全部计划run；中止和超时同样进入延迟/资源报告 |
| 用户目标完成 | 用户承诺和被支持的结果 | 完整结果、完成类别及上述支持性结论 | 每个用户目标；安全处理正确不自动等于完成 |

对执行效率相关切片，除资源合规外，选择能够关联有效产出与投入的指标，例如首个合格结果耗时、取得可信结论的比例或重复无进展消耗。指标按当前能力选择，不要求全部实现；验收阈值在对应合同或本轮计划中预先约定，诊断指标不临时升级为通过门槛。

评价器可复用纯解析，但独立oracle的预期必须能与执行器独立变化。被测控制面、生产eligibility、Verifier verdict或成功标志都不是自身oracle：外写/Outcome评价还要将授权Proposal、Attempt与原始provider proof独立核对编号、候选/门店、时段、人数、确认状态以及冲突/缺字段。自动规则无法判断的同义、主观适用性、调查充分性或来源语义，明确标`NOT_EVALUATED`并给出人工审查输入；人工结论不得回写或伪装成自动分数。

## 评分规格、可比性与门槛

在运行前冻结每一维的评分单位、分母、状态定义、聚合方式和acceptance门槛，写入对应case/holdout/acceptance contract。评分至少区分`SATISFIED`、`NOT_SATISFIED`、`NOT_EVALUATED`、`BLOCKED_BY_UPSTREAM`、`NOT_REACHED`和评价器失败；只对规则允许的可评分单位计算比率，同时报告计划、启动、完成、明确失败/停止、可评分和未到达的全部分母，不能只报告完成或成功样本。

归因只到证据能支持的最深阶段：最终状态不能证明未记录的中间过程。首个失败与下游阻断分别记录，不把同一根因重复计为多个独立质量失败；端到端目标未完成仍保留在完成分母中。

比较两个结果前声明唯一或各个变化变量，并固定或分层报告其余数据集/Gold、用户输入、参考时钟/地点、模型配置、预算、执行模式和评分语义；代码/Prompt版本可以是被比较的自变量。版本、Gold、样本或预算变化时只报告限定比较，按共同未变单位、已变单位和上游阻断单位分组，不用均值掩盖回归。同一结果不可既作Clean Baseline又作开发诊断。样本很小时报告单位数、重复次数、选择/抽样方式与波动，不从单次成功推断长期能力。

安全不可由均值抵消：非法外写、未授权/重复提交、错Attempt/错候选成功、把`OUTCOME_UNKNOWN`当失败并重试等安全违反必须单列并满足零容忍门槛，即使其他质量平均值提高。任何未预先定义的门槛或缺失分母都不能宣布整体通过。任何本轮必过维度缺少评价证据，都不能宣布本轮整体通过；范围外维度记录限制即可。

Gold、产品语义或评分门槛的调整必须显式review并分别版本化；不能为让当前实现通过而放宽oracle。既有明确规则的实现修复不需要重新审批门槛，但仍按该冻结口径报告结果。

## Clean Holdout与污染控制

私有Holdout的标注、Preflight、一次性Baseline和暴露状态以[Restaurant Semantic Holdout](../../harness/RESTAURANT-SEMANTIC-HOLDOUT.md)及ADR-0009为准。开始首次真实模型请求前必须写入不可覆盖的开始记录；开始即使中断也使该数据集不再称为Clean。私有原文、Gold、输出和失败不得复制到Prompt、公开fixture、提交物或公开/开发日志；协议所需的私有安全运行记录仍按Holdout协议保存。一旦用于优化Prompt、Contract、实现或Scorer，按协议记录暴露，不能靠重跑恢复Clean资格。

当前详细命令和环境门槛只从该Holdout协议读取。已暴露数据只可按其声明的开发/回归口径使用，不能生成或宣称新的Clean Baseline。

## 执行结果与诊断的独立核验

共享执行契约变更在同一切片说明Evaluator影响为复用、修改、补充或不适用，并审查来源样本、Gold和门槛；Evaluator仍能运行不表示口径未变。先保存原始`.result.json`，再写不覆盖原记录的evaluation；评价失败写独立sidecar，已保存artifact可按现有入口补评：

```bash
npm run eval:restaurant:agent-loop:artifact -- <artifact.result.json>
```

核验结论支持性时，逐个重建实际展示引用：同一候选、来源/观察、HIGH身份、请求日期/人数/时段、适用HARD条件及新鲜度必须来自证据，而不是生产eligibility或终态。历史证据不自动支持当前展示；新冲突、UNKNOWN或刷新失败不得恢复旧成功。`NO_VERIFIED_RESULT`可证明记录范围内的处理，不能证明搜索穷尽或用户目标完成；内部失败、取消、预算停止和未到达必须保留实际根因。

模型选路允许多种合法顺序；固定来源未覆盖的合法调用是诊断环境缺口，不直接归因模型错误。重复无效动作、忽略已有证据、无支持最终断言、错时钟/请求或绕过安全边界，才按实际记录归因。公开合成样本或历史artifact的独立副本可检验反例，但不覆盖原artifact。

## 当前评价入口与运行边界

| 目的 | 当前入口 | 证明边界 |
|---|---|---|
| 语义开发回归 | `npm run eval:restaurant:semantic:fixture` / `...:deepseek` | 前者是离线契约，后者是已授权真实模型诊断；均非Clean Baseline |
| 私有Holdout准备 | `npm run eval:restaurant:semantic:holdout:preflight` | 标注/状态检查；私有内容不进入Prompt、日志或提交物 |
| 搜索本地纵向检查 | `npm run eval:restaurant:search:fixture` | 本地Fixture链，停在授权前 |
| 固定来源或Hybrid只读 | `npm run eval:restaurant:agent-loop:fixed-source-model` / `...:hybrid-live-read` | 前者受控来源，后者本次真实只读；都不证明预约成功 |

真实模型、私有Holdout、Live和Controlled Live-write遵循当前合同、开关、用户授权和预算；开关不是授权。任何实际运行保留开始记录和结束/失败/取消记录，不覆盖已有artifact，也不得记录Secret、Cookie、挑战token、接管输入或原始Provider错误。具体功能验证按[Test](../test/SKILL.md)。
