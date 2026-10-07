# Praxis 当前状态

- Status: Accepted
- Document revision: 4.149
- Last updated: 2026-10-07
- Source of truth for: 当前实现、证据与下一道门槛

## 当前门槛

- **本轮：H001→H001–H005 Playbook，Phase 0 已签收，Phase 1 实施中。** Terra 编码，root 阶段验收；676/676及四门禁通过，真实预检4,119ms；[阶段证据](history/TEST-LOG.md#test-2026-10-07-playbook-phase0)。
- **基线 e90dc94：完整 H001 Live 仍 FAIL。** 已有受控交付与浏览器局部验证，不能替代真实库存交付；[既有证据](history/BROWSER-READ-RELIABILITY-REVIEW-2026-10-07.md)。
- **权限决策：[ADR-0036](decisions/0036-generic-public-read-network-policy.md) 已接受、未实现。** 用户选择通用同源 GET；敏感请求、PII／凭据、非审核 POST 仍阻断，不宣称 GET 天然无副作用。
- **下一门槛：** 通用 Browser Read Core 的许可/阻断、控件正常完成与脱敏Record→Replay闭环；随后定向真实日历验证。Semantic／Gold／HARD／身份／半径冻结。

完整旧 STATUS 已移入 [月度历史快照](history/monthly/2026-10-status-baseline.md)；[月度摘要与逐条索引](history/README.md) 保留原始 DEVLOG／TEST-LOG。
