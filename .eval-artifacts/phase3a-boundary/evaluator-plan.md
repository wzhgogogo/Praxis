# Semantic evaluator proposal and call estimate

- Status: draft / not integrated; no evaluator, Prompt, Schema or Gold modified.
- Inputs: case-inventory.json and its source SHA list; no private Clean Holdout.

## Proposed oracle

使用单独版本化的 `restaurant-goal-boundary-annotations@1`，以原始输入文件 SHA + session/case/turn 绑定人工类别；不解析订位关键词，也不改原始 Gold。sidecar 是新的评分配置，必须先审核、冻结与记录 SHA；不是运行时指令或兼容旧生产 Schema 的代码。

| 标注 | goal 期望 | goalBasis |
| --- | --- | --- |
| A / B 且有到访日期或时段 | AVAILABILITY | 类型为已定义枚举，reason 非空，quotes 至少 1，逐条匹配当前消息 |
| 无到访日期或时段 | RECOMMENDATION | 同上；有 table 等措辞但无时间也不覆盖此规则 |
| 灰区 | AVAILABILITY 或 RECOMMENDATION | 两种目标都可；依据引用失效则不能通过 |

代码和评分器都不审查“依据类型与目标是否合理”、不据 reason 的词汇判分、不做隐藏模型 Judge。理由/类型保留给复核者，不把引用存在当成语义推理正确的证明。A/B 选择 RECOMMENDATION 必须失败；两种有效灰区目标分别有正例；无效、空数组或空白引用必须失败。

## Representation and versions

- Semantic Proposal@3 → @4；Prompt@23 → @24（机器现字段使用 v23，按所属对象表达）。建议 goalBasis 在 TARGET value，仅目标新提议需要，未提 TARGET 时继承原目标；待停止点 1 确认。
- Semantic scorer@3 → @4、regression evaluator/report@3 → @4。目标维度与引用有效性单列；reason 不做全文 Gold 等值。Proposal/Compiler/Reducer 的其他字段、operation 和集合语义保持独立比较。
- exposed-regression-comparison@1 → @2 若被本回归复用，补 `goal`、`goalBasis` 维度；非目标字段继续检查原有 criteria/strength/date/time/party/area/budget 等。
- 当前 15-turn 开发回归的阶段 oracle 除 SR03 外未带 TARGET，13 个 Gold 未标目标。不能简单在原 @3 报告中过滤 target 差异后宣称全量通过。新 evaluator 必须显式绑定已批准的目标标注、分别评价 TARGET/依据与未改变字段；语义以外的 Proposal/Patch/Reducer 差异仍单列。
- 原 fixtures@3、H001–H005 Gold@6/@7、历史变体及旧 evaluation 不改。需要的 Gold 新版本与旧目标→新策略变更清单保留到停止点 3 逐条确认。sidecar 即使获批，也不能将其分数冒充旧 Gold 原口径分数。
- State/Draft/TaskDefinition 不因仅提议保存 goalBasis 而升版。若要求持久依据，再协调 F5 @21/@19，不自动占号。
- Hybrid evaluator 当前 @34 / rubric@30：批次 2 语义回归不修改真实来源/Live 外层。若复核要求端到端 artifact 也消费灰区策略，则须显式计划后继 evaluator@35 / rubric@31、原文依据记录与输入版本；仅静态检查无依据的旧 artifact 时应 NOT_EVALUATED，不能回填 goalBasis、覆盖历史评价或扩大本批实施。

## Multi-turn and proposed labels needing review

1. 无时间规则指完整请求没有到访日期/时段；SR01-T02、SR08-T02、SR09-T02 等修正保留已有时间与目标，不把本轮省略当成重置。
2. `goalBasis` 的 quotes 只核对当前消息；不得用之前消息的片段冒充本轮引用。没有新 TARGET 时原目标继续生效，不制造依据。新的目标修正仍走语义链。
3. “in about 30 minutes”不以编译后钟点冒充 B；G065 拟灰区。具体钟点和数字钟点区间的 B 界限由本次人工标注冻结，生产不做词表判断。
4. H003、H004 和现有 KF-H004 变体全部拟灰区；SR03-T02 是旧 RECOMMENDATION 与新 B 固定空位之间的明显待确认变化。指令 Wednesday KF-H004 只有指令示例，未当成 main 中现存 Gold。

## Planned real-model calls (authorization remains zero)

默认只建议公开开发输入；未申请或使用新的实际调用额度。

| 方案 | 用例 × 每例调用 | 无额外输出尝试时合计 | 现有最多两次输出尝试的调用上界 |
| --- | --- | ---: | ---: |
| 一次现行开发语义回归 | 15 turn × 1 | 15 | 30 |
| 另外灰区复测 | 14 不同灰区 turn × 3 | 42 | 84 |
| 默认申请候选合计 | 15 + 42 | 57 | 114 |
| 可选：再加两份公开已暴露 Holdout 的原生 ID 集合 | 12 case × 1，均 A/B，无新增灰区三次项 | +12，即 69 | +24，即 138 |
| 可选：另纳入指令中的 Wednesday KF-H004 示例 | 1 新候选 × 3，须先批准为输入 | +3，即默认 60 | +6，即 120 |

14 个灰区 turn：G017/G023/G024/G030/G053/G054（6 条非默认 SR 原话），以及 G063–G070（8 条 SR turn）。42 个额外 turn 组织为每轮 12 session：10 个单 turn，加 SR08/SR09 两个双 turn。双 turn 前缀本身也属灰区，一并跑一次，不能每个后续 turn 再额外重跑前缀。三轮共 42 次逻辑解释，无隐藏模型调用。历史字面相同的 Gold 副本按 G 去重，不把 22 条灰区记录的重复副本当 22 个独立样本。

默认 SR 中灰区已经在全量回归出现 1 次，指令批次 3 又要求“另外各跑 3 次”；一致率只使用新增的 3 次，不把全部 4 次混入 3 次分母。每例报告 AVAILABILITY/RECOMMENDATION/invalid/blocked 计数、主目标最大计数/3、有效数/3；无效或阻断不能伪装一致。多轮继承 turn 标明 CONTEXT_CARRY，不把继承值当独立目标重判。

已有 MAX_SCHEMA_ATTEMPTS=2 可能使一次逻辑解释产生两次真实调用；上界包括失败尝试，不再增加任何重试。用户可选择实际硬上限 57（输出重试会提前耗尽额度）或完整最坏上界 114，批准前均为 0。失败/上游阻断导致实跑少于估算必须如实保留，不能补跑填满。公开 Holdout 是否包含、采用哪份已物化日期的冻结输入，待复核决定；不运行未填 {DATE} 模板。

私有语义 Holdout 的 25 turn 仅有协议公开元数据，未读原文、未分类、不纳入 57/69；本指令明确禁止读取 `.eval-private/`，不能因 EXPOSED 字样自动解除禁止。

## Run report and stops

批次 3 按同一输入 SHA、可信参考时间/地点、模型配置、完整字段与旧新目标对照。依据只来自实际模型 Proposal，不补造。日期、时段、人数、地点、条件等非目标语义有变化，或 A/B 被判推荐：保存原结果后停下，只记录，不修改 Prompt/Gold。灰区出现两种目标仅报告，由用户/复核者决定指引；历史 evaluation 保留原样。

本次只交付方案：端到端结果 NOT_RUN、语义新规则 NOT_IMPLEMENTED、S0 NOT_EVALUATED、归因 NOT_EVALUATED；五门禁只证明未改源码的当前本地树仍满足既有检查，不证明新目标契约或真实模型理解。
