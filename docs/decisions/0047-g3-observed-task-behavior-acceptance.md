# ADR-0047：G3 以观察驱动的真实任务行为验收

- Status: Accepted
- Approval: 用户2026-10-28直接决定：网站适配器行数仅记录参考，不再作为验收条件
- Document revision: 1.0
- Last updated: 2026-10-28（Vienna CET，UTC+1）
- Source of truth for: G3 当前验收条件及适配器行数的参考用途
- Supersedes: ADR-0046 中“适配器≤3,591行作为G3门槛”的条款；其余观察原则、原文核对和G1合同保持Accepted
- Related documents: [ADR-0046](0046-observed-actions-and-source-quoted-answers.md)、[Test Skill](../skills/test/SKILL.md)

## Context

3a′曾把两站适配器非测试TypeScript物理行数≤3,591作为门槛。C身份改动合入后，参考基线为3,878行，source-packs.ts单列478行。用户明确撤销行数门槛，目标是让Agent从当前页面观察并选择动作。

## Decision

1. 网站适配器行数及source-packs.ts继续按原统计口径记录，但数值、增减或是否达到3,591均不决定G3通过与否。无需为缩减行数重排或搬迁代码。
2. G3以 `PRAXIS_G2_REQUIRE_PASS=1 npm run test:dom-change` 和真实任务行为验收。当前切片为Tabelog；TableCheck阳性日历在首次Live录到并纳入固定集后再实施、验收。
3. 动作来自Agent本次读到的可见文字、label、ARIA、链接和控件。站点知识作为Skill/提示/Guard指引；已知选择器可加速，失配后继续观察页面。任务验证包含日历操作、日期/时段/人数/状态的原文依据及代码核对，不以静态解析器在变异样本通过替代实际任务链路。
4. 同店、本次观察、原文真实性、日期/人数/时段绑定、Guard、授权和已有预算继续生效。来源结构变化必须可观察地报告SOURCE_STRUCTURE_CHANGED；缺证保持未知。行为和错误声明独立核验，离线fixture不冒充真实模型或Live质量。
5. 原ADR与历史报告保留原口径；本决策自用户指令起生效，后续计划/状态/报告明确区分历史门槛与当前验收。当前B新增真实模型/网站/Live调用仍为0。

## Consequences

实现和审查聚焦Agent实际可完成的任务及证据链。行数只辅助理解维护成本；不为达成数字而削减核验或搬迁站点逻辑。G3必须保留有效反例、五门禁和严格DOM变异检查，并明确当前切片尚未覆盖的真实来源表现。

## Alternatives considered

继续把≤3,591作为硬门槛：用户已撤销。仅以DOM静态解析通过宣布Agent任务完成：不能证明用户要求的观察、行动和核对链路。

## Related documents

- [G3 Tabelog切片](../../.eval-artifacts/phase3b/g3-tabelog/plan.md)
- [ADR Index](README.md)
