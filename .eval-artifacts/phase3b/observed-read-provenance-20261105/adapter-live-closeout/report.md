# Adapter 续作停止报告

- 时间：2026-11-05 17:00 CET（UTC+1）后。
- 状态：draft / not integrated；未合 main，未开始 Live。
- 范围：公开开发输入、构造 Mock 与既有已暴露 Replay；未读私有留出。此轮网站 GET、Google、真实模型、Live 全部 0。

## 已完成及验证范围

原48红灯47项迁移、1项旧URL构造实现断言退役并替代，逐项见 adapter-migration-map.json。两 Adapter 111/111 + Executor 63/63通过；续作定向合计269/269通过，见 logs/closeout-related-final.log，包含原组、会话复用及G1。新的typecheck、arch均通过。Mock元数据是受控I/O替身，不证明Guard真实执行，也不证明网站能力。

冻结提交4e6c3e9f的首次净树全套门禁：typecheck、arch通过；npm test 1414项，1318通过、96失败。每项前后git status为空，原件在 gates/。门禁在此停止，build、Chromium/G6、严格G2未执行；此后只做有新修改依据的定向验证。没有用269项替代全套验收。

## 停下的合同问题

1. **部分名称口径。** 原反例 `User choice fails closed for PARTIAL` 输入G6、候选G6 Development Sushi，断言不选择且无交接。新双向包含和来源全名支持会判唯一并选择。用户答复：**维持双向包含，交复核决定测试口径**。名称规则、原断言均未改，红灯保留。
2. **TableCheck路径冲突。** 当前 `tableCheckPublicReadNetworkPolicy.prohibitedPaths` 禁止reserve路径；既有G6开发来源的页面却是 `/en/shops/g6-development-sushi/reserve`，旧普通条款组装要求从它读取库存并交接。策略核对为禁止；当前普通组装的Mock复现为 CHECK_AVAILABILITY / EXECUTION_FAILURE，无交接，见 tablecheck-policy-conflict.json。另一些旧构造源的 `/reserve/landing` 链接走 SOURCE_UNSUPPORTED，两种结果不混为同一错误码。没有放宽Guard，没有换URL搬运库存响应。需要复核明确这些验收在现有允许范围内应对应哪条有证据的公开读取链路；当前材料不能证明把库存移至另一个地址是保真的迁移。**不建议因此打开reserve路径。**
3. **D3旧定向夹具。** 两条 saved-booking-terms 仍停在初轮无法展示：一条NEEDS_INPUT，另一条没有presentedCandidateIds，无法进入选店。原始语义、决策、页面未改，不添加缺失的历史日历或source_facts输出。按夜间复核，旧录制缺口不是通过，也不是新产品缺陷的单独证明。建议复核将这两条G1条款行为测试拆为“构造来源前置条件 + 原样保存的G1页面”，与真实Replay的EVIDENCE_GAP分开；尚未实施，不据此跳过门禁。

最后相关条款/选择子集23项19通过4失败；名称/前缀子集12项11通过1失败。**这不等于全局只剩4或5个失败**：完整96项尚有其他组未迁移，不能从子集推算剩余数。完整首轮红灯保留在 gates/test.log。

## 改动、自查与版本

产品文件、夹具迁移/退役及替代测试见 adapter-migration.md。产品仅四个文件：browser-task-executor.ts、两站browser-availability.ts、google-listed-website-facts.ts。未改身份算法、Guard准入、时间或预算数值。名称双向包含未改，未新增版本升级。

按用户原样脚本扫描 f8c99318 至本次提交，逐条解释见 hardcoded-audit.md。扫描不能替代人工核对。未恢复词表、模板或固定序列。共享STATUS/DEVLOG/TEST-LOG按工作规则留到实际合入时更新。

## 额度及后续

用户已批准最多另2次交付后独立库存GET：全局GET上限442，完整保留108 GET及18 Live。自己的初始账本基线GET331、Live16、模型460，非留出累计GET硬上限334；尚未创建运行账本或发生真实调用。

Live仍须先完成回归和全套门禁：冻结分支，TC连通1次，D4/D8各一次，每回合50模型、原500秒及20秒保留。当前不运行。若Live无S0且至少一家完成身份+查位，再按已批准路线同步main合入推送；否则不合入。当前停止交复核，不合main，不动留出额度。
