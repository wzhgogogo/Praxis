---
name: praxis-post-change-verify
description: 核对 Praxis 仓库改动的验收证据、遗留问题和交付状态。
---

# Praxis Post-change Verify

- Document revision: 1.2
- Last updated: 2026-11-16

实际修改仓库文件后使用本清单。只读评审直接给出判断、依据和仍待核实的问题。

1. 对照用户约定的范围和验收条件检查本次 diff，区分工作树中原有的改动。涉及架构或执行权限时，复核相关 Accepted ADR 和 [Arch Guard](../arch-guard/SKILL.md)。
2. 按改动类型运行适用检查。设计、执行评测或引用评测结论时，再核对评测输入、执行记录和独立评价。[Test 验证矩阵](../test/SKILL.md#验证矩阵) · [Eval](../eval/SKILL.md)
3. 逐项说明验收结果和对应证据。涉及 Mock、Replay、Live Read-only 或 Controlled Live-write 时，分别报告实际结果。对仍失败或未验证的条件，说明原因及其对交付的影响。
4. 按文档归属更新本次影响的记录。涉及 Git 交付时，说明实际提交、合入或推送状态。远端推送须有用户明确授权。[文档治理](../../INDEX.md#文档治理) · [仓库交付约定](../../REPOSITORY-CONVENTIONS.md#交付检查)
