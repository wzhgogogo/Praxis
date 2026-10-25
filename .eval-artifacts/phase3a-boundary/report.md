# Phase3a boundary — batch 1 / stop 1

- Status: draft / not integrated; awaiting review and explicit ADR acceptance.
- Updated: 2026-10-25T09:57:55+01:00，维也纳 CET（UTC+1）。
- Contamination: PUBLIC_INPUT_AND_RESULT_EXPOSED; baselineEligible:false. Private Holdout not read.

## 1 范围与提交

切片承诺：在不改生产代码/Prompt/Schema/Gold、无模型或来源调用的条件下，形成可逐项复核的目标边界 ADR、完整公开用例标注、读写影响、评分方案和调用预算，交付后停在停止点 1。

基线 main `7165f8a20fd86e105ea3219100061699c03197a1` 已与 origin/main 同步。分支 `codex/adr-0044-recommendation-availability-boundary`。原样指令已首先独立提交 `630839e4`，原文 SHA `9c61aec63fb34feeded7e270400c0861d0a1e6ef5c24e2f8f5affc9d0a107a35`。未合 main，未获本任务推送授权，不推送。

89 个本地/远端分支引用和逐分支 docs/decisions 路径见 [adr-number-inventory.json](adr-number-inventory.json)。已用 0001–0043；0041 在实验分支，0043 在 F5 分支；0036 有历史 supplement 同号文件，保留不改。0044 在快照中未占用。只新增 Proposed ADR 和索引，不改 ADR-0026 历史 Decision 或将方向批准冒充 ADR Accepted。

产物：[ADR](../../docs/decisions/0044-recommendation-availability-boundary.md)、[影响清单](impact-inventory.md)、[逐条用例](case-inventory.md)、[机器清单](case-inventory.json)、[评分与调用方案](evaluator-plan.md)。

## 2 每项改动的目标、红灯、绿灯与未覆盖范围

| 交付 | 本批事实检查 | 红/绿业务证据 | 未覆盖 |
| --- | --- | --- | --- |
| Proposed ADR | 完整纳入指令 0.1/0.3；仅拟部分取代 0026 第 1 条；四项备选均列理由 | 不适用：仅文档，不制造实现红绿 | 待批准、未实施 |
| 影响清单 | 逐处读/写/复制/评价路径及代码行；未发现 Agent/Router/展示后置重分类 | 静态审阅，不能代替批次 2 不变量测试 | 运行时篡改控制仍须批次 2 |
| 用例清单 | 121 条：108 条有目标、13 条 SR 未标目标；70 种原话；逐条拟分类 | 原 Gold 字节与冻结 SHA 核对，非新语义通过结论 | 私有 25 turn 未读；Wednesday 示例不是现有 Gold |
| 灰区标注 | 22 条记录、14 个不同 turn；H003、H004、KF-H004 变体拟灰区 | 原目标保持，未按新政策重评旧结果 | 多轮/相对偏移细化待复核 |
| 评分与调用方案 | 15 + 14×3 = 57 逻辑调用；现有双尝试上界 114；可选公开 Holdout 后 69/138 | 未执行模型 | 用户调用上限仍为 0 |

原 H004 的 this afternoon 已有到访时间，但没有 A 或 B，拟灰区；其旧 RECOMMENDATION 不变。SR03-T02 为 B，旧 RECOMMENDATION 明显须列待确认；另外 13 条开发 turn 没有旧目标，不能宣称原来目标分类正确。普通语义回归尚有阶段 TARGET oracle 缺口，方案显式处理，不以忽略差异冒充通过。

State 合同协调：main @20 / TaskDefinition@18；F5 实际 @21/@19。建议依据只保存在 Proposal 与已存在静态语义结果，不加入持久 State，不分配后续 State 号。若复核要求持久化，先由复核者安排合入顺序。

## 3 五门禁结果

待在本批文档冻结提交后的净工作树运行：typecheck、arch:check、npm test、build、test:browser:fixture。用户指令要求本批五门禁，虽无源码改动仍按要求执行。每项保存原始日志、退出码、CET 起止与实际 git status；不得靠恢复 tracked 文件隐藏测试写入。当前尚未报告通过，详见最终 verification.json。

新语义契约测试、Mock 新规则、真实模型、Replay 新契约、Live Read-only、Controlled Live-write 均未运行；当前五门禁也不构成这些模式的通过。

## 4 模型调用与来源访问

真实模型 0，Google 0，餐厅网站 0，完整 Live 0。未读取/暂存 .env，未读取 .eval-private。仅 GitHub 的分支 fetch 用于最新 main 与 ADR 编号盘点；依赖以 npm 离线缓存、禁 lifecycle script 安装。离线门禁只使用现有 Fixture/本机临时浏览器。

本地 [budget.json](budget.json) 硬上限为 0；3a′ 共享 budget.json 只新增本批 0 计数，不借用其 400 调用额度。

## 5 偏离本文件之处

无跨批实施或来源访问。为消除清单歧义，提出了多轮累计请求与 CONTEXT_CARRY、相对分钟偏移灰区、依据仅提议保存三个细化，均标明待复核，不作为已接受规则。公开私有协议只提供 25-turn 元数据，未擅读原文以填满清单。缺少 Wednesday KF-H004 的现存 Gold 已明确标注，不补造。

文档本身不改当前产品能力；按指令将 STATUS/DEVLOG/TEST-LOG/月度索引的全量同步留给停止点 3 确认后的独立提交。门禁实际日志保存于本批，不声称未运行模式通过。

## 6 需要复核者或用户决定的事项

1. 审核 Proposed ADR-0044 后由用户明确批准 Accepted；当前仅方向获批。
2. 确认 goalBasis 位于 TARGET value、仅保存提议；修正 turn 无 TARGET 时继承目标；相对约 30 分钟按灰区标注。
3. 确认目标标注 sidecar 的评分版本/旧 Gold 比较边界；SR03-T02 和 13 条缺目标不在本批改写。
4. 选择真实模型硬上限：默认计划 57、现有最多两次尝试的完整上界 114；批准前 0。是否加公开已暴露 12 case（69/138）和 Wednesday 新示例另行决定；私有集仍不读取。
5. 如果要求持久化依据，先协调 B 的 @21/@19 和合入顺序；当前最小方案不抢编号。

停止条件：批次 1 资料与适用检查提交后停止，等待复核、用户批准 ADR 和调用额度；不进入批次 2。
