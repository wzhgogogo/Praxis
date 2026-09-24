# Test/Eval Skill pre-restructure migration map

- Status: Superseded
- Document revision: 1.1
- Last updated: 2026-09-24
- Source of truth for: 2026-09-24前Test/Eval Skill中退出当前规程正文的历史位置与迁移去向
- Related documents: [Current Test Skill](../../skills/test/SKILL.md), [Current Eval Skill](../../skills/eval/SKILL.md), [Current Status](../../STATUS.md), [Test Log](../../history/TEST-LOG.md)

这是`superseded retrospective`归档映射，不是当前测试矩阵、Eval协议或能力判断。旧Eval全文已按Git提交`2b64388`和SHA-256归档为[原文快照](EVAL-SKILL-PRE-RESTRUCTURE-2026-09-24.md)；本映射说明为什么不再把阶段性结果留在当前Skill正文。

| 旧材料 | 迁移位置 | 当前使用方式 |
|---|---|---|
| Eval中Stage 2C、prompt@12/@14、旧semantic regression与browser completion叙述 | 原文快照；实际运行记录仍在STATUS与对应日期的DEVLOG/TEST-LOG、运行review | 仅审计当时运行和污染状态；不假称全部已迁入日志，不能推导当前质量或门槛 |
| H005 category-negative matrix、fixed-source自动/人工结果 | 原文快照；当前H001–H005验收契约及`history/H005-CATEGORY-NEGATIVE-REVIEW-2026-09-20.md` | 当前输入/命令从验收契约读取，已运行结果从review读取 |
| Semantic Holdout的运行命令、污染和Baseline限制 | [Restaurant Semantic Holdout](../../harness/RESTAURANT-SEMANTIC-HOLDOUT.md)与ADR-0009 | 仍是当前私有数据协议；不在Skill复制数据/运行史 |
| Hybrid evaluator实现细节、未覆盖维度和历史artifact再评 | 原文快照；当前H001–H005验收契约、对应Evaluator源码/测试和历史review | 当前Skill只规定独立oracle与报告责任 |
| Test中的验证矩阵、三步验证、维护规则 | [Current Test Skill](../../skills/test/SKILL.md) | 已重新组织，语义仍以当前合同为准 |

不复制旧可执行Runner、兼容路径、私有Holdout或原始artifact。需要精确追溯旧措辞时查上述Git快照；需要判断当前状态时从INDEX进入权威合同。
