# Brainstorming and Research Archive

- Status: Accepted
- Document revision: 1.0
- Last updated: 2026-08-20
- Source of truth for: 历史思考、市场证据与讨论记录的索引；不定义当前产品或架构
- Related documents: [Documentation Index](../INDEX.md), [Current Status](../STATUS.md), [ADR Index](../decisions/README.md)

本目录内容统一属于`retrospective evidence`。它保留问题形成、市场判断、未验证假设和早期方案，便于Retro与Review；不能覆盖Accepted ADR、当前产品/架构文档或`STATUS.md`。

## 记录

- [2026-09-16 Browser 观察、操作与记忆联合诊断](2026-09-16-browser-observation-action-memory-validation.md)：20 次模型调用；完整 Filters 与脚本替代路径通过，模型规划、地图和记忆证据仍有缺口，附优化建议。

- [2026-09-16 Stagehand 跨站流程复验](2026-09-16-stagehand-workflow-validation.md)：17 次模型调用，三商户流程均未完成；零模型 Playwright 对照进入公开表单，非自主流程通过。

- [2026-09-16 Stagehand 小探针](2026-09-16-stagehand-small-probe.md)：固定4.1.0；本地结构化观察/操作、DeepSeek接线通过；两站实测取得提议但未执行，非完整流程验收。
- [2026-09-16 Browser Loop 两站实测](2026-09-16-browser-loop-feasibility-validation.md)：真实 DeepSeek + 现有 Playwright/Executor；TableCheck 局部读取成功，Tabelog 动作解码失败；不是完整产品验收。
- [2026-09-15 TableCheck / Tabelog 实站走查](2026-09-15-tablecheck-tabelog-browser-walkthrough.md)：draft / not integrated；两站四家商户的 CUA 只读观察，将选型单位从控件修复调整为完整流程；不是 Praxis Live 验收。
- [2026-09-15 Midscene 与 Praxis Browser Agent](2026-09-15-midscene-and-praxis-browser-agent.md)：draft / not integrated；视觉定位、受控接入与三仓库比较，未运行模型或来源实验。
- [2026-09-15 Stagehand、browser-use 与 Praxis Browser Agent](2026-09-15-stagehand-browser-use-and-praxis-browser-agent.md)：draft / not integrated；固定源码调研、接入取舍与候选验证切片，不是当前能力或 Clean Baseline。
- [2026-07-15 C端Personal AI Agent方向探索](2026-07-15-C端Personal-AI-Agent方向探索.md)
- [2026-08-01 Personal AI Agent与Public Knowledge建设方法讨论](2026-08-01-Personal-AI-Agent与Public-Knowledge建设方法讨论.md)
- [2026-08-04 日本Local市场切入与Build决策](2026-08-04-日本Local市场切入与Build决策.md)
- [市场、切入场景与可行性分析](personal-agent-data-validation.md)
- [2026-08-06 Agent Harness生态项目调研与Praxis启示](2026-08-06-agent-harness-landscape-and-praxis-lessons.md)
- [2026-08-09 ToC模糊需求与生活推荐交互摩擦](2026-08-09-ToC模糊需求与生活推荐交互摩擦.md)

正式产品承诺进入`docs/product/`，架构决策进入ADR，当前能力进入`docs/STATUS.md`；不直接重写本目录的历史正文。
