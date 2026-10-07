# Praxis 当前状态

- Status: Accepted
- Document revision: 4.150
- Last updated: 2026-10-07
- Source of truth for: 当前实现、证据与下一道门槛

## 当前门槛

- **本轮：H001→H001–H005 Playbook，Phase 0／1 已签收。** Terra 编码、root 验收；默认697/697、Chromium73/73及门禁通过，Generic真实初始日历读取9,537ms；[阶段证据](history/TEST-LOG.md#test-2026-10-07-playbook-phase1)。
- **基线 e90dc94：完整 H001 Live 仍 FAIL。** 已有受控交付与浏览器局部验证，不能替代真实库存交付；[既有证据](history/BROWSER-READ-RELIABILITY-REVIEW-2026-10-07.md)。
- **权限决策：[ADR-0036](decisions/0036-generic-public-read-network-policy.md) 已实现并获阶段验证。** 同源公开GET与审核查询共用Guard；敏感操作优先阻断，保留未知GET副作用风险。Record／Replay仍有格式与脱敏限制。
- **下一门槛：Phase 2 Source Pack／Planner。** Google保留，按请求选择来源；真实探针矩阵与完整交付尚待后续阶段。Semantic／Gold／HARD／身份／半径冻结。

完整旧 STATUS 已移入 [月度历史快照](history/monthly/2026-10-status-baseline.md)；[月度摘要与逐条索引](history/README.md) 保留原始 DEVLOG／TEST-LOG。
