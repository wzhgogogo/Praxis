# ADR-0048：Tabelog 日期状态以站点数据响应为依据

- Status: Accepted
- Approval: independent reviewer (Claude), 2026-10-28，用户批准并直接指示A/B执行
- Document revision: 1.0
- Last updated: 2026-10-28（Vienna CET，UTC+1）
- Source of truth for: Tabelog日期级状态证据、无响应时的未知和G2日历基线修订
- Supersedes: ADR-0046清单OBS-14中要求从日历格子可见文字引用业务状态的执行前提；其余观察与核对原则不变
- Related ADRs: [0046](0046-observed-actions-and-source-quoted-answers.md)、[0047](0047-g3-observed-task-behavior-acceptance.md)

## Context

两份冻结Tabelog日历的状态仅由私有class区分，缺少对应可见文字、ARIA或视觉差异。真实网站的状态图标依赖样式表。旧G2把class推断作为已知事实，与当前观察/引用合同冲突；已用真实Chromium的文本、ARIA、样式、像素对照确认。

## Decision

1. 日期级满席、电话、休息和时段/人数事实，以站点自身已审核读取的数据响应为依据。精确绑定同店、请求、日期、人数、时段及同次读取，结构不符合已审核格式时发出SOURCE_STRUCTURE_CHANGED，结论未知。
2. 私有日历class可以作导航提示，不能证明业务状态。没有对应数据响应时为UNKNOWN；Agent需要时观察并打开相应日期/时段，获得受现有Guard/预算约束的数据响应。不得以模型结论或class补造数据。
3. A负责修订两份G2日历的冻结期望：同次材料有对应响应则绑定响应SHA，没有则UNKNOWN。改名后仍UNKNOWN为如实PASS；不改其他页面、变异规则或评分器。B实现产品读取，不自行改这些固定输入。
4. B无需等待A，先实施其它G3组及G3c。A基线合入后再严格验收日历。State/TaskDefinition、身份、Guard和授权不因本决策扩大；本批新增真实调用仍0。

## Consequences

日期状态和导航提示分离。数据响应验证与结构告警是可独立验证的当前切片；数据缺失保持未知，后续Agent可继续合法读取。G2历史基线与评价保留，新期望按用户批准的复核决定版本化记录。

## Alternatives considered

继续用class给出业务状态：用户否决。伪造可见状态引用或自行删除固定断言：不采用。仅因日历基线待A修订而停止所有其它G3组：本次用户明确要求继续。

## Related documents

- [公开观察证据](../../.eval-artifacts/phase3b/g3-longrun/calendar-observability.json)
- [G3长批次](../../.eval-artifacts/phase3b/g3-longrun/CODEX-3B-B-G3-LONGRUN.md)
