# ADR-0025: Model-directed read investigation and bounded completion

- Status: Accepted
- Document revision: 1.0
- Last updated: 2026-09-14
- Source of truth for: 拟调整的 Restaurant 调查权限、最小观察反馈与只读无结果终态
- Proposed partial supersession: [ADR-0012](0012-migration-and-agent-loop-hardening.md) 的极窄Context范围、[ADR-0014](0014-search-only-results-completion.md) 的只读终态范围、[ADR-0022](0022-current-source-fact-lifecycle-and-identity.md) 的候选级当前事实集合与精确地点名称规则
- Supplements: [ADR-0020](0020-goal-driven-restaurant-read-path.md)、[ADR-0024](0024-deterministic-time-and-diagnostic-read-completion.md)
- Related documents: [执行设计与验收](../RESTAURANT-READ-EXECUTION-DESIGN.md)

## Context

2026-09-14 的公开开发Live显示，单条路径的修复不等于不同合法调查顺序都可用：预约读取可以补事实，但业务模型不知道；空位目标被禁止独立事实补证；候选级旧事实集合屏蔽新来源事实；模型缺少带实际尝试依据的正常无结果结束方式。只读结果评分又混淆了执行终态与独立证据结论。

最近地点匹配补丁从全名称相等扩大到名称/地址包含，虽令东银座案例通过，却能把区域内商户错当区域地标。这不是可接受的替代规则。

这些问题不要求新Planner或通用执行框架。它们需要统一现有动作/观察/证据/结束契约，减少把调查路线写进Validator的规则。

## Decision

1. 交付目标决定最低证据要求，不决定唯一调查顺序。事实调查和空位调查可共同服务任一有适用参数的只读目标；只读动作资格根据输入、真实资源、来源范围与合法重查判断。模型不改变权威条件。
2. Domain提供一个无副作用的只读评估函数，供Context、Validator和Router复用。它报告证据支持/冲突/未知、适用性、操作资格，不选下一步，不写State，不调用模型。Evaluator独立核验原始引用，不以这一函数的结论自证成功。
3. 业务模型可以接收有界的来源事实摘要、来源类别、证据/观察引用和实际尝试失败摘要。详细Provider/DOM/浏览器实现、凭据、授权和任意URL仍不进入业务Context；网页文本不是指令。
4. 当前事实按来源、用途/事实作用域、请求适用性与显式替代关系判断，不能限定为单次候选factCheck的全部引用。刷新失败或新冲突不能恢复旧成功；独立来源后来产生的有效补充事实不能被旧检查过滤。历史记录保持不可变。
5. 增加窄的 `END_READ` 提议，只有经过Domain验证、Router绑定真实调查记录、Runtime/Reducer接受事件，才能成为 `NO_VERIFIED_RESULT`。它只说明本次已调查范围无可靠结果，不代表全局无位、调查最优或所有可能路径穷尽。模型不能提交任意成功Outcome。
6. 展示使用既有PRESENT_RESULTS；写操作授权、幂等和Booking Verifier-only Outcome不变。内部失败、取消、预算停止不自动映射为正常无结果，真正缺用户信息仍单独补问。
7. 地点确认基于来源实体与地点上下文，地址包含查询词不能证明实体就是该地标；不要求所有合法名称写法严格字符串相等，也不采用首项、猜坐标或固定地名别名表。
8. 增量轨迹、执行artifact和独立评价共享关联与脱敏协议；评价分别报告执行事实、结论支持性、调查质量。正常收尾不自动等于Eval通过。

## Consequences

- 删除目标禁令、重复资格逻辑和从英文日志推导进展的规则；保留正确性与副作用边界。
- 新只读终态需在Domain State/Outcome、Web/Hybrid结果和持久化调用者同一切片接通，不增加Core的餐厅专属生命周期。
- 模型可能选择不同合法顺序；测试验证共同契约和反例，真实模型诊断与实时来源Live分别报告。不能以穷举动作序列或测试数量替代验收。
- 主观适用性判断与尚未支持的网站能力仍有边界，不在本ADR自动宣布实现。真实HARD不能为通过Golden而降级。
- 本草案不授权Live、外部写入、数据重置或远端推送，不将当前未提交实现标为符合本决策。

## Alternatives considered

- 每个失败位置增加fallback：拒绝，持续扩大隐藏路线编排且无法解释合法顺序。
- 删除证据/身份/请求验证：拒绝，会把错门店、错时段和模型猜测当成事实。
- 将事实和空位改为一个万能浏览器工具：当前不采用，会增加参数和权限歧义，并要求重写已有可用链。
- 继续用STEP_LIMIT表示正常没结果：拒绝，不能区分调查质量、能力限制与内部故障。
- 增加完整规划图、Provider市场或通用证据平台：当前没有必要，不属于这个纵向切片。

## Status and acceptance

2026-09-14用户授权按本设计实施。本ADR替代上述历史ADR的限定部分：目标不再决定唯一调查动作顺序；只读正常收尾不再只依赖`PRESENT_RESULTS`或失败相位；地点名称/地址子串不再是实体确认。历史ADR和运行资料仍保留其原始语境。行为、版本和验证以实施后的真实结果为准；本决定不授权新的Live、外部写入、数据重置或远端推送。
