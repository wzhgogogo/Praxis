# Praxis 当前状态

- Status: Accepted
- Document revision: 4.151
- Last updated: 2026-10-07
- Source of truth for: 当前实现、证据与下一道门槛

## 当前门槛

- **本轮：H001→H001–H005 Playbook，Phase 0／1／2 已签收。** Terra 编码、root 验收；最新默认712/712、Chromium73/73复用及门禁通过；五案Planner与受控展示验收通过；[阶段证据](history/TEST-LOG.md#test-2026-10-07-playbook-phase2)。
- **基线 e90dc94：完整 H001 Live 仍 FAIL。** 已有受控交付与浏览器局部验证，不能替代真实库存交付；[既有证据](history/BROWSER-READ-RELIABILITY-REVIEW-2026-10-07.md)。
- **权限决策：[ADR-0036](decisions/0036-generic-public-read-network-policy.md) 已实现并获阶段验证。** 同源公开GET与审核查询共用Guard；敏感操作优先阻断，保留未知GET副作用风险。Record／Replay仍有格式与脱敏限制。
- **下一门槛：Phase 3 分阶段真实探针。** Source Pack／Planner已离线接线，Google保留、位置复用；真实库存与完整交付尚待验收。Semantic／Gold／HARD／身份／半径冻结。

完整旧 STATUS 已移入 [月度历史快照](history/monthly/2026-10-status-baseline.md)；[月度摘要与逐条索引](history/README.md) 保留原始 DEVLOG／TEST-LOG。
