# ADR-0026: Concrete-visit goal and reception semantics

- Status: Accepted
- Document revision: 1.0
- Last updated: 2026-09-15
- Source of truth for: 具体到访请求的交付目标、读动作参数边界、接待方式与库存的独立事实
- Supersedes in part: [ADR-0020](0020-goal-driven-restaurant-read-path.md) 中“只有显式 book/reserve 才是 AVAILABILITY”的目标分类细节
- Supplements: [ADR-0024](0024-deterministic-time-and-diagnostic-read-completion.md), [ADR-0025](0025-model-directed-read-investigation.md)
- Related documents: [Restaurant Booking Domain](../domains/RESTAURANT-BOOKING.md), [MVP PRD](../product/MVP-PRD.md), [Current read contract](../../src/eval/restaurant/agent-loop/cases/README.md)

## Context

当前只读链已经以 `target.goal` 区分事实推荐和当前空位，但旧口径把分类过度绑定于显式的 “book/reserve” 词。真实用户会用 “recommend”, “looking for” 或 “need” 表达一个已有日期、时间和人数的具体到访；把这类请求降为推荐会回避其实际交付承诺。反过来，开放探索不应因为出现人数或场景而被强制要求空位。

同时，预约库存和接待方式被混在“有无预约入口”的推断中。页面没有订位入口不能证明可 walk-in；当前无 slot 也不能证明 walk-in 可接待。该混淆会把来源失败或不完整页面包装成业务结论。

## Decision

1. `AVAILABILITY` 表示用户要求一个具体到访的可用性结论：已知或有明确封闭推断依据的人数、日期/时间意图与地点共同表明该交付。措辞本身不是唯一分类依据；开放找店/比较仍为 `RECOMMENDATION`。原始用户消息不可为该推断而改写，推断依据单独记录。
2. 目标、完成所需信息和单个读动作参数分开。候选发现只需可执行的地点/附近输入；空位读取才绑定日期、时段和人数。`AVAILABILITY` 缺人数必须先问，缺精确时间可先做发现；宽时间表达保留原词与代码物化依据。`after work` 当前仅物化为 17:30–22:00 的宽查询窗，不是用户承诺的精确时间。
3. 库存状态为 `AVAILABLE` / `UNAVAILABLE` / `UNKNOWN` / `SOURCE_UNSUPPORTED`；接待方式为 `RESERVATION_SUPPORTED` / `WALK_IN_SUPPORTED` / `RESERVATION_AND_WALK_IN_SUPPORTED` / `UNKNOWN`。二者独立保存和展示。walk-in/both 只能来自明确页面证据；缺少订位入口不产生 walk-in 结论。walk-in 从不替代请求的可订 slot。
4. 当前明确无 slot 必须有同候选、同日期、同人数、标记为负库存的来源证据。来源失败、未生效条件、`UNKNOWN` 或接待方式未知均不是无位。刷新一个已展示 slot 必须重新读取该 slot；失败不得恢复旧成功。
5. Agent 继续选择合法的只读调查顺序，Context 提供有界事实、缺口、来源尝试、库存/接待摘要与代码派生的合法动作。Validator 只验证动作自身的参数和当前状态；模型、Context 或来源均不能写入 Task State、执行预约或绕过 Authorization。

## Consequences

- H001/H002/H003/H005 的当前开发语义为 `AVAILABILITY`；H004 保持事实型 `RECOMMENDATION`。该公开开发集是 exposed diagnostic，不是 Clean Baseline，也不授权 Live 或外部写入。
- 现有来源链和通用浏览器模型回退保留；本决定不引入新的 Provider、重试、Planner、预约写路径或兼容层。
- 诊断器独立检查 `END_READ` 的实际执行轨迹与无 slot 负证据；它不复用生产端的展示/结束判定来证明自己。

## Alternatives considered

- 只凭 “book/reserve” 分类：拒绝，不能匹配具体到访的用户交付要求。
- 任何具体场景一律强制查位：拒绝，会把开放探索和事实推荐不必要地变成补问或来源调用。
- 把无预约入口解释为 walk-in：拒绝，缺少页面能力不是正向接待证据。
- 以旧 slot 作为刷新失败后的回退：拒绝，会把过期库存伪装为当前结果。

## Status and acceptance

本 ADR 取代 ADR-0020 的上述目标分类细节，其余关于负向条件、耗尽来源和不注入案例语义的决定继续有效。实现和离线验证见当前验收契约与 TEST-LOG；真实模型、网站、实时库存及 Live 能力仍须单独授权和报告。
