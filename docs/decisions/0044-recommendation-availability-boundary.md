# ADR-0044: Recommendation and availability boundary

- Status: Accepted
- Document revision: 1.2
- Last updated: 2026-11-03
- Source of truth for: 推荐/查位目标边界与 goalBasis 当前消息引用核验；含用户停止点 3 确认的无时间订位规则修正
- Supersedes in part: 仅部分取代 [ADR-0026](0026-concrete-visit-goal-and-reception-semantics.md) Decision 第 1 条的目标分类；第 2–5 条继续有效
- Related ADRs: [ADR-0020](0020-goal-driven-restaurant-read-path.md)、[ADR-0009](0009-semantic-strength-and-clean-holdout-baseline.md)
- Related documents: [Restaurant Booking](../domains/RESTAURANT-BOOKING.md)、[批次报告](../../.eval-artifacts/phase3a-boundary/report.md)
- Direction approved: 用户 2026-10-25 停止点 1 接受 ADR；2026-10-26 停止点 3 明确批准本次文字修正、Prompt@25 与 Gold@4

## Context

当前 TARGET Prompt 把人数和 planned dining occasion/time or broad time period 组合为 AVAILABILITY，可能把宽下午见朋友的咖啡馆找店强制变成查位。目标应决定交付所需证据，不替代每次找店，也不使查位或预约成为默认副作用。H003 与 KF-H004 的旧目标不因本决策被回写或重新判分。

## Decision

### 概念与目标（指令 §0.1 原文）

| 概念 | 含义 |
| --- | --- |
| 找店 | 按地点、菜系、价格、营业时间等找合适的店。每个请求都做。 |
| 查位 | 在 Tabelog/TableCheck 上只读地查看某日、某时段、某人数有没有空位。不预约。 |
| 预约 | 真正订位。第一版 Praxis 不代订，只给预填链接，由用户在来源站点自己提交（3b）。 |

目标 `target.goal` **只决定交付前是否必须查到空位**：

- **AVAILABILITY**：只展示查到了同店、同请求当前空位的门店；查不到就如实说明。
- **RECOMMENDATION**：展示符合条件的门店，需要营业时间等事实支持；查位只是可选的附加证据。


### 已批准方向（指令 §0.3 原文）

用户的原则：**少加硬编码规则，尽量让模型自己判断**（包括推断人数）。

1. **两个明确的锚点**，应判为 AVAILABILITY：
   - **A 订位措辞：** 用户明确要订位或要空位，例如 book、reserve、“a table for X”、“open tables”、availability。即使没有到访日期或时间，也判为 AVAILABILITY；之后按 ADR-0026 补问缺失时间，可先发现候选，不虚构日期或时段。
   - **B 具体时间的正餐：** 具体钟点或数字时段（“at 7 PM”“between 6 and 8”），加上已知或可推断的人数（“with a friend”“date” 可推断为 2），且是坐下用餐。
2. **其余由语义模型判断**用户此刻是否期待确认的空位。例如“下班后 10 人团建晚餐”，模型可以判为 AVAILABILITY；“周三下午和朋友见面的咖啡馆”，模型可以判为 RECOMMENDATION。
   - 不设人数阈值。
   - 不在代码或 Prompt 里维护“哪些菜系或店型需要预约”“哪些是休闲店”的词表。
3. **模型必须给出依据 `goalBasis`：**
   - 依据类型：`BOOKING_WORDING`（A）、`SPECIFIC_TIME_MEAL`（B）或 `JUDGMENT`（其余）；
   - 一句简短理由；
   - 至少一个逐字引用的用户原话片段。
4. **代码只核对两件事：**
   - 每个引用片段确实出现在当前这条用户消息中（规范化空白和大小写后比较），不满足时拒绝该提议，按现有语义失败路径处理，不降级、不猜测、不改写；
   - 语义之后的环节（Agent、Router、展示）不修改目标。

   代码**不**判断依据类型与目标是否“合理”，不检测订位关键词。
5. **补救路径（只写进 ADR，本工作不实现）：**
   - 预约帮助由用户选店触发：选中后查位，缺人数就问，再给预填链接（3b）；
   - 推荐结果上提供“查空位”按钮（3c）；
   - 从页面读取“是否接受预约/仅到店”（3b）。目前只有查位成功时才记为可预约，从不读取“仅到店”。
6. **评测：**
   - 属于 A 或 B 的用例，目标固定为 AVAILABILITY；A 不以前置时间为条件，B 仍须具体钟点或数字钟点时段；
   - 既没有到访日期/时间、也没有订位措辞的新请求，目标固定为 RECOMMENDATION（NO_TIME）；
   - 其余为**灰区**：只要 `goalBasis` 的引用在原话中，两种目标都算通过；
   - 灰区用例每例跑 3 次，报告目标的一致率。


### 停止点 1 已批准的最小落地方案

- 新增 goalBasis 到 Semantic Proposal 的 TARGET value，包含 `type`、非空 `reason`、非空 `quotes[]`。每次 ASSERT/CORRECT 新目标都带依据；没有新 TARGET 的修正 turn 继续携带原权威目标，不重新生成引用，不把旧消息作为当前引用。
- 在 Interpreter 已有模型输出验证处以当前可信 `input.message` 核对引用。只折叠空白、trim、大小写归一后做连续子串包含；不做同义、标点、翻译、订位关键词或目标合理性判断。任一空/不存在引用拒绝整份提议，走现有 INVALID_MODEL_OUTPUT → SEMANTIC_INTERPRETATION_FAILED 路径。不得改写引用、猜目标或降级为推荐。
- 保留现有最多 2 次输出校验尝试；不新增重试、模型或来源调用。无效依据不得通过 Compiler/Reducer 写入 State。
- goalBasis 只作为提议中的语义依据及静态评测 Proposal 记录，不加入权威 Draft/State，不复制到普通产品日志。Compiler 只转译已验证 goal/query，不把理由当状态、许可或事实。停止点 1 时 State@20/TaskDefinition@18 保持不变，不占用 F5 的 @21/@19；本次整合主线已有 State@22/TaskDefinition@20，本工作仍不升版。后续若要持久化依据，须另列合同范围并协调合入顺序。
- 多轮类别按累计用户请求标注；新增或改目标的依据引用必须在当前消息中。既没有到访日期/时间、也没有订位措辞的新请求走 RECOMMENDATION。仅修正地区/条件或为已有订位请求补充时间的 turn 保持原目标（CONTEXT_CARRY）；当前消息没有时间不等于会话中的已知到访时间消失。
- 语义后 Agent、Router、展示均消费权威目标。后续用户明确表达的新目标仍必须重新经过正式语义链；这不属于 Agent 的目标改写。

## Consequences

目标、事实支持、营业时间、当前同店同请求库存、接待方式、授权和现实预约继续分离。灰区两种目标可通过语义目标评价，但不豁免非目标语义字段、引用有效性或实际交付证据。目标一致率不是产品成功率。

本决策已获批准；语义 Proposal@4 的引用核验保持不变，Prompt@25 采用修正规则。停止点 3 仅批准 SR03-T02 的目标从 RECOMMENDATION 改为 AVAILABILITY，形成 Gold@4，Gold@3 原样保留。Guard、来源、站点目录、source-packs.ts 和预约代码不在本切片。ADR-0026 仅在头部记录部分取代关系，其余决策原文保留。

## Alternatives considered

1. 保持现状（宽时段加人数即 AVAILABILITY）：拒绝，会把宽时段咖啡馆推荐强制转为库存承诺。
2. 只按订位措辞判定：拒绝，遗漏具体钟点、有已知/可推断人数的正餐，也剥夺模型处理其余语义的判断空间。
3. 固定人数阈值（例如 5 人以上一律 AVAILABILITY）：拒绝，人数不是用户目标，也不能替代具体上下文；不新增人数阈值。
4. 在代码维护店型或休闲词表：拒绝，造成不断扩张的语言/商家分类硬编码，违背已批准的模型职责。Prompt 也不维护同类词表。

## Acceptance and remaining decisions

停止点 1、2 已通过。停止点 3 用户已接受灰区每组 3/3 推荐的结果，仍保留灰区标注；批准修正无时间订位规则，并将 SR02-T01 标为 A、SR02-T02 标为 CONTEXT_CARRY。所有 NO_TIME 轮与 SR02 会话各重跑 3 次，独立额度累计上限 144 不变（修正前已用 84）；非目标差异只记录。五门禁全绿后可合入 main 并推送。

非目标旧 Gold、SR03-T02 丢失具名 query、SR08-T02 CONFIRM 合同拒绝仅列入 [3b 前置清单](../../.eval-artifacts/phase3a-boundary/review-correction/3b-prerequisites.md)，本批不处理。多轮 CONTEXT_CARRY、相对分钟偏移灰区和已暴露输入的污染状态不变。

## Revision 1.1 approval — 2026-10-26 CET

复核者原“无时间一律推荐”的评测文字与向用户解释的订位规则 A 冲突。用户明确批准以“既无到访日期/时间、也无订位措辞”取代，A 无时间仍查位；时间缺口属于后续补问，不取消目标。此次修订只澄清已确认边界，不增加代码关键词判断或自动预约。原指令、旧侧标注与全部上一批原始结果保留，不按新口径回写旧分数。以下停止点 1 批准记录为历史记录。

## Stop 1 approval — 2026-10-25 CET

用户已批准本 ADR、goalBasis 仅在提议/静态评测结果保存、CONTEXT_CARRY 和相对时间灰区三个细化。真实模型总上限 144，独立于 3a′ 的 400；批次 2 不调用真实模型，完成推送后停在停止点 2。审批原文及范围见 batch2/approval.md。SR03-T02 的旧 Gold 保持不变，停止点 3 再确认。

## User decision appended 2026-11-03: named outlet without a separate area

A nonempty SPECIFIC_OUTLET target may start a name lookup without a separate user AREA. OPEN_ENDED still requires an area; the existing date/time/party requirements for availability are unchanged. Lookup stays within the Tokyo service scope using observed source addresses, with no invented user area, center or radius. A uniquely confirmed outlet continues through the existing G4 source identity and availability path. Ambiguous or approximate names that cannot be uniquely established require clarification; an unrelated outlet is never a substitute. An explicit later user area overrides any derived location basis and the original outlet-name binding remains.

The provider-observed address is labeled NAMED_OUTLET_RESOLUTION in discovery evidence and public match reasons, never written to intentDraft.area. No distance from a nonexistent user center is displayed. Both B1 source readers, projection and terms contexts use the same complete authoritative intent; all identity, slot, freshness, presented/ready eligibility and two server checks remain. Selection grants no booking authority.

The user confirmed restaurant-state@25 and TaskDefinition@23 before implementation: persistent SearchIntent.area can be absent for the named-outlet contract. Intent Draft@3, semantic Proposal@4, semantic Prompt@26 and Agent Prompt/Action Schema stay unchanged. No automatic database migration or reset is performed. This appends the approved decision without rewriting the preceding classification rules.
