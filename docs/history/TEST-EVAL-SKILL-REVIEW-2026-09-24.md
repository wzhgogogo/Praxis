# Test/Eval Skill paper review — 2026-09-24

- Status: Accepted — paper review only
- Document revision: 1.0
- Last updated: 2026-09-24
- Source of truth for: Test/Eval规程重整的纸面覆盖与评分审查；不证明运行、产品能力或未来预约实现
- Related documents: [Test Skill](../skills/test/SKILL.md), [Eval Skill](../skills/eval/SKILL.md), [Current H001–H005 contract](../../src/eval/restaurant/agent-loop/cases/README.md), [ADR-0024](../decisions/0024-deterministic-time-and-diagnostic-read-completion.md), [ADR-0030](../decisions/0030-restaurant-category-negative-eligibility.md)

本审查不运行模型、来源、浏览器、预约或写操作；不修改Gold、fixture、ADR或产品合同。以下从当前总纲的合同→失效机制→Test覆盖→Eval规格推导三项审查，并把未来实现缺口保持为缺口。

## 统一审查规格

Test对每项适用覆盖保留正常、误接纳、误拒绝、未知/冲突、变化/恢复、资源/批次/隔离六类候选，再按真实风险选择；不机械组合。Eval的独立oracle不能复用生产eligibility或模型标签；报告计划、启动、完成、可评分、`NOT_REACHED`/`BLOCKED_BY_UPSTREAM`、超时和评价失败的分母。安全违反（未授权或重复写、错Attempt/候选成功、把`OUTCOME_UNKNOWN`当失败而重试）为零容忍，不被平均质量抵消。

| 审查项 | 当前权威合同 | 本纸面Test覆盖 | Eval规格与停止点 |
|---|---|---|---|
| 多候选查位 | H001–H005的默认三家是调查目标；显式数量才是完成条件；每店独立请求绑定证据 | 单批/跨批、候选和来源隔离、顺序变化、局部来源失败后继续合法候选、预算累计和真停止 | 每个候选/claim独立评分；报告目标/实际/`met`及所有run分母；不把资源停止改写为正常无结果 |
| H005时间变化 | 当前只按记录reference instant和Asia/Tokyo物化；展示新鲜度与read deadline不同 | 等于`expiresAt`、跨午夜、迟到旧响应、刷新失败、请求版本变化 | 逐时钟和观察评分；不从一次固定时钟推断实时库存或可预约性 |
| 未来预约异常 | 现有控制面定义同Attempt验证和`OUTCOME_UNKNOWN`禁止重提；真实provider恢复未实施 | Mock授权/Verifier/Runtime恢复链的正常、结果未知、重复提交阻断、确认缺席后新授权 | 每个Attempt的安全oracle；未来真实Adapter必须另立契约与Controlled Live-write验收 |

## 当前多候选查位

**合同。** [ADR-0028](../decisions/0028-open-ended-result-targets-for-availability.md)把开放式目标的默认首批设为三家，但当前验收契约明确它不是未声明的用户完成条件：至少一位独立合格候选可构成`QUALIFIED_RESULT`，显式用户数量才要求精确满足。Availability仍要求每个候选具同店、同请求、当前slot证据；来源未知或失败不等同无位。只读结束也不证明搜索穷尽。

**测试推导。** 正常控制涵盖一位和多位独立合格候选。误接纳涵盖重复候选、跨店/跨请求slot、未满足显式数量和预算停止后伪造`NO_VERIFIED_RESULT`。误拒绝涵盖默认短批在无合法read后被错误拒绝、局部来源失败却尚有可行动候选、以及合法不同调查顺序。资源/批次覆盖必须至少有跨批和不同候选/来源隔离，不能只用恰好三家的成功样本；无需穷举所有排列。

**评价规格。** 每个展示候选/claim重建身份、请求、slot和当前性，分母同时报告计划case、已启动run、已完成run、可评分候选与未到达候选。`defaultBatchTarget`的`target/actual/met`报告调查进度，不改变用户目标完成；真预算/deadline/取消依实际根因评估，不能因为没有合格结果而标作正常收尾。现有固定来源证据是已暴露开发诊断，不是Live库存或长期模型质量。

| 总纲锚点 → 覆盖 | 安排／独立期望 | 方法／故意错误检错 | Eval证据／结论 |
|---|---|---|---|
| [资源/批次](../skills/test/SKILL.md#覆盖推导与检错有效性) 正常 | 多店可查，任意合法顺序后每个展示店有同请求slot | 真composition；串店slot或重复候选时目标断言失败 | 每个claim重建身份/请求/当前性；可评分候选分母 |
| 同锚点 误拒绝/恢复 | 一来源失败，但另一候选仍合法可查，继续而非提前结束 | 注入单来源失败；故意把失败当全局停止应失败 | 轨迹、局部失败与仍可行动候选；不把正确继续当模型错误 |
| 同锚点 跨批/顺序 | 第一批不足，后批或不同顺序可合法补查；默认短批与显式数量分开 | 跨批fixture；故意复用前批请求/候选ID应失败 | `target/actual/met`、显式完成与claim分母分别报告 |
| [变化/恢复](../skills/test/SKILL.md#覆盖推导与检错有效性) 时序 | A先查slot在展示前过期、B后查仍新鲜；旧请求晚到不得污染整批 | 双候选/双请求时钟fixture；故意接纳A或让旧响应覆盖整批应失败 | 候选级`observedAt/presentedAt/expiresAt`和请求版本；B仍可评分，A不展示 |
| 同锚点 资源停止 | 真总预算/deadline耗尽时不伪造`NO_VERIFIED_RESULT`或完成 | 累计预算fixture；故意把停止重标为正常结束应失败 | 计划/启动/停止/未到达及资源分母；用户目标未完成 |

## H005时间变化

**合同与实现现状。** 当前H005以记录的reference instant和`Asia/Tokyo`物化`right now`；已过去的请求窗口不移动到另一时段寻找库存。展示证据仅在`observedAt ≤ presentedAt < expiresAt`时当前；Domain采用本地十分钟展示窗口，来源期限只能进一步缩短有效窗口，既不延长证据，也不把展示新鲜度变成预约资格。Router的read deadline是第三个不同的运行时边界。现有[temporal materialization](../../src/domains/restaurant/temporal-materialization.ts)还实现`temporal-materialization@5`的`validityMinutes=1`、`validUntil=reference+60s`和`EXACT_ONLY`；[read assessment](../../src/domains/restaurant/read-assessment.ts)在`now > validUntil`时拒绝展示，[Action Validator测试](../../src/domains/restaurant/action-validator.test.ts)覆盖该即时过期保护。

**测试推导。** 对适用实现使用确定性Fake Clock验证物化和现有一分钟即时过期保护；独立验证展示的等于`expiresAt`边界、跨午夜、请求变更后旧响应迟到、刷新失败不复活旧成功，并对deadline使用有界异步控制。每个样本明确自己只改变参考时间、展示时钟或执行deadline之一，防止三个时钟互相替代。`right now`滚动推进和过期后用户恢复策略仍未定义；这些不应被测试样本、Evaluator或本文擅自赋义。

**评价规格。** 评价记录reference instant、timezone、materialized request、`validUntil`、`observedAt`、`presentedAt`、`expiresAt`及deadline状态，并分别判定。实现当前对`validUntil`使用`now > validUntil`、展示对`expiresAt`使用严格`<`；等号的产品评价口径必须由权威合同冻结，不能从实现自动生成Gold。缺字段为`NOT_EVALUATED`，过期、逆序或未来观察为`NOT_SATISFIED`。不能从开放营业、一次显示或deadline未触发推导当前库存、预约成功或对未来“right now”语义的结论。

已知安全要求是：记录时钟物化、现有一分钟即时过期保护、窗口不得为找库存而挪动、过期证据不得展示、旧响应/刷新失败不得复活旧成功。待决的仅是未来`right now`滚动和已过到访时刻的产品恢复策略。

| 总纲锚点 → 覆盖 | 安排／独立期望 | 方法／故意错误检错 | Eval证据／结论 |
|---|---|---|---|
| [变化/恢复](../skills/test/SKILL.md#覆盖推导与检错有效性) 正常 | recorded reference + Tokyo物化，`EXACT_ONLY`且在现有一分钟`validUntil`内 | Fake Clock；故意改时区/移动窗口应失败 | reference/timezone/materialized request/validUntil可审；仅评价本次请求 |
| 同锚点 边界 | `presentedAt < expiresAt`通过，等于`expiresAt`不展示 | 固定观察；将`≤`错用于展示断言失败 | `observedAt/presentedAt/expiresAt`逐字段判定 |
| 同锚点 跨午夜/迟到 | 请求跨午夜仍按原materialized request；旧响应不覆写新请求 | request revision与Fake Clock；晚到旧响应故意接纳应失败 | 版本、时钟和claim分开记录，旧响应不计当前支持 |
| 同锚点 刷新/资源 | 刷新失败不复活旧成功；read deadline停止不改写展示时钟语义 | 有界异步deadline；故意恢复旧slot或混用deadline应失败 | 刷新根因、deadline和未到达分别报告 |

## 尚未实施的预约结果未知与恢复

**合同。** [Arch Guard](../skills/arch-guard/SKILL.md)、[Task Runtime](../architecture/TASK-RUNTIME.md)和[Restaurant Domain](../domains/RESTAURANT-BOOKING.md)规定：外部提交结果不明确进入`OUTCOME_UNKNOWN`；Recovery只形成`VERIFY_BOOKING`，不再次Commit。旧Proposal/Authorization/Attempt在确认`BOOKING_ABSENT`或`COMMIT_FAILED`后清除；新的`BOOK_RESERVATION`必须产生新Proposal并取得新的one-time Authorization。真实Adapter提交及provider恢复尚未实施。

**未来实现的验收设计。** 以“Adapter已Commit但响应丢失，进程重启后收到迟到确认”为异常模型。Mock层应证明有效Authorization进入一次Attempt、断网/超时不推断失败、恢复只核实同一`attemptId`且不重提或换店；迟到确认仅能关闭同Attempt。独立Verifier确认`BOOKING_ABSENT`后，才允许生成新Proposal并要求新Authorization；任何复用旧Authorization、重复Commit或错Attempt成功都应触发安全失败。此设计不代表真实Provider已有查询、幂等键或恢复能力。

**未来评价规格。** 分母按计划、已创建Attempt、已提交、结果未知、已验证、确认成功、确认缺席、未到达及评价失败分别报告；延迟/成本包括超时和中止Attempt。oracle以权威State和不可变Attempt因果链为索引，但独立核对授权Proposal、Attempt与原始provider proof的编号、候选/门店、时段、人数、`CONFIRMED`和冲突/缺字段；不把Verifier verdict、Adapter timeout或模型说明当作自证。未来真实Adapter必须另冻结provider契约、恢复证据和Controlled Live-write清理/验证计划；在其前不得把Mock恢复通过称为真实预约恢复通过。

| 总纲锚点 → 覆盖 | 安排／独立期望 | 方法／故意错误检错 | Eval证据／结论 |
|---|---|---|---|
| [安全覆盖](../skills/test/SKILL.md#覆盖推导与检错有效性) 正常 | 有效授权只创建一次Attempt；同Attempt有可核对的确认 | Mock Commit+Verifier；故意替换attemptId应失败 | State/Authorization/Attempt与原始provider proof逐项比对；成功只计同Attempt |
| 同锚点 无授权拒绝 | 无Authorization或已用Authorization不产生Commit | Policy/Runtime组合；故意绕过Policy应失败 | 非法写为零容忍，计入全部Attempt分母 |
| 同锚点 UNKNOWN/预算 | Commit后断网、重启或验证预算耗尽保持`OUTCOME_UNKNOWN`，不重提/换店 | 模拟响应丢失；故意把timeout标ABSENT或再Commit应失败 | 已提交/未知/未到达/停止分母，用户目标未完成 |
| 同锚点 迟到/错确认 | 迟到确认只关闭相同Attempt；相同确认重复到达只接受一次状态/效果，错Attempt/候选确认不得成功 | 注入重复及两Attempt确认；故意按候选名匹配或二次完成应失败 | attemptId、候选、时段、人数、`CONFIRMED`、冲突/缺字段与provider proof逐项核验 |
| 同锚点 确认缺席后恢复 | 独立确认`BOOKING_ABSENT`后才可新Proposal+新Authorization | 旧授权复用负例；故意复用应失败 | 旧/新对象关联和Authorization分开报告 |

## 审查结论

Root独立审查并退回修订后，接受本次规程与纸面覆盖设计：三项均可由Test总纲结合其引用的权威合同推导正常、失败、恢复、时序和资源覆盖，由Eval总纲确定独立证据、评分单位、分母与门槛。场景用例是推导示范，不是另一套规则，也不代表测试执行通过。

修订已纠正超时分母、Holdout暴露与私密材料边界、故障关闭、独立provider proof核验，以及H005既有一分钟保护的事实。独立检查通过：13份改动文档的342处本地链接/锚点、11个package脚本引用、旧Eval快照与`2b64388`原文逐字节一致、`git diff --check`。未运行代码测试、模型、Live或未来写操作。

未来“right now”推进与过期后恢复策略仍待产品合同决定；真实预约Provider恢复仍未实施。实际切片须先明确这些合同与平台能力，再按总纲验证。本次文档验收不关闭既有Live P0阻断。
