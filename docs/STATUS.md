# Praxis 当前状态

- Status: Accepted
- Document revision: 4.154
- Last updated: 2026-10-09
- Source of truth for: 当前实现、证据与下一道门槛

## 当前门槛

- **第一阶段：P1-A 已知可行基线；本轮仅完成 WP-A 决策捕获。** `--record-decisions` 在 eval Runner 保存完整模型输入／返回／失败及实际参数，浏览器决策分别关联 executor observation revision、URL 和 Recording snapshot 序号；产物附路径及 SHA-256。[实施与离线证据](history/TEST-LOG.md#test-2026-10-09-p1-a-wp-a-decision-capture)。
- **停止点：WP-A 离线签收后停止，尚未取得新的整单基线。** Phase 3 剩余行转为诊断，后续按[第一阶段总纲](AGENT-WEB-OPERATION-PHASE-1-PLAYBOOK.md)和[P1-A 细则](H001-H005-KNOWN-FEASIBLE-BASELINE-PLAYBOOK.md)推进；本轮不运行 Live、不修改冻结变体／见证、不进入 P1-B 及之后，P1-D ADR 须用户批准后才能合入。

- **H001→H001–H005 Playbook：Phase 0／1／2 已签收，续行 Phase 3 仍 FAIL。** Google发现10/10、Tabelog发现9/10／身份10/10；TableCheck发现3/10／返回身份4/10、官网返回资料4/10（3份独立重建）未达门槛；[本轮证据](history/TEST-LOG.md#test-2026-10-08-playbook-phase3-renewal)。
- **已知可行库存：同五家 Tabelog 从0/5到5/5。** 有条件等待人数加载后，原请求10/22／2人／17:30的页面选中值、原始200响应与五个Offer逐项绑定，59,960ms／14模型；仅签收库存绑定切片，未证明完整HARD／H001交付。
- **交付代码：当前查询／地区绑定、公开GET查询grammar、真实空控件值与共享预算已补强。** Source Pack持有来源规则；Record保留公开资源与语义动作指纹，Replay零网络执行；一次列表回放通过，真实日历失败路径仍NO_COVERAGE。
- **历史 Phase 3 停止记录（保留诊断结论）：原始6＋续行139＝145/150模型调用，余5不足以完成剩余矩阵，不自动追加预算。** Tabelog发现同问题已到3轮；当时未进入Phase4／5／6；该前置门槛现由P1-A基线计划替代。Semantic／Gold／HARD／身份／半径与整单500s／50调用不变；诊断样本4调用不作为旧2调用的同预算改善。

完整旧 STATUS 已移入 [月度历史快照](history/monthly/2026-10-status-baseline.md)；[月度摘要与逐条索引](history/README.md) 保留原始 DEVLOG／TEST-LOG。
