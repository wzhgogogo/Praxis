# Praxis 当前状态

- Status: Accepted
- Document revision: 4.155
- Last updated: 2026-10-09
- Source of truth for: 当前实现、证据与下一道门槛

## 当前门槛

- **P1-A 基线与补跑已完成，属于已暴露开发诊断。** 冻结 `2656ce9` 上保留8次主运行及3次补跑；独立归因见 `.eval-artifacts/known-feasible-baseline-20261008/review/`。kf-h004重新归为语义目标错误，非错误展示；三次补跑累计123模型／2 Google，kf-h005实际展示，kf-h003与h005模型预算耗尽未展示，自动目标评价均UNKNOWN。补跑报告保留在冻结工作树 `.eval-artifacts/p1-a-baseline-supplement-20261009/report.md`；本轮C0不改旧结果、变体或见证。
- **P1-C C0 实现与两次真实模型回放通过。** 共享整单调用剩余≤4且已有合格默认首批时，复用交付事件与资格规则，Web／Hybrid Runner／固定来源均接入真实计数；调用跨阈值会拒绝旧调查提议。合格正例实际展示，错误人数、过期证据及明确数量不获得例外；本地Web持久化入口也实际展示短批。[ADR-0038](decisions/0038-model-call-default-delivery-window.md)仅扩展ADR-0031触发条件。四门禁通过；[证据与未覆盖边界](history/TEST-LOG.md#test-2026-10-09-p1-c-c0-call-budget-delivery)。
- **当前停止点：C0 到此停止，不运行 Live。** kf-h001 #38／#49分别一次真实DeepSeek回放均主动选择`PRESENT_RESULTS`，校验ALLOWED后实际展示Sushi Suga；共2次模型，模型耗时2,228／1,783ms，零Google／浏览器／餐厅来源读取。#38是4次临界预算对照（原13次剩余），#49沿用原始2次；不宣称原第38次自然触发。沿原State version 9／10继承冻结来源轨迹的既有诊断六维均SATISFIED，资源仅计本次新增决策；产物和独立核验在`.eval-artifacts/p1-c-c0-20261009/`。已暴露单步回放不证明完整Live改善。首次审批拒绝后用户已明确授权并完成；不进入C1以后或P1-B／P1-D，P1-D ADR仍须用户批准。

- **H001→H001–H005 Playbook：Phase 0／1／2 已签收，续行 Phase 3 仍 FAIL。** Google发现10/10、Tabelog发现9/10／身份10/10；TableCheck发现3/10／返回身份4/10、官网返回资料4/10（3份独立重建）未达门槛；[本轮证据](history/TEST-LOG.md#test-2026-10-08-playbook-phase3-renewal)。
- **已知可行库存：同五家 Tabelog 从0/5到5/5。** 有条件等待人数加载后，原请求10/22／2人／17:30的页面选中值、原始200响应与五个Offer逐项绑定，59,960ms／14模型；仅签收库存绑定切片，未证明完整HARD／H001交付。
- **交付代码：当前查询／地区绑定、公开GET查询grammar、真实空控件值与共享预算已补强。** Source Pack持有来源规则；Record保留公开资源与语义动作指纹，Replay零网络执行；一次列表回放通过，真实日历失败路径仍NO_COVERAGE。
- **历史 Phase 3 停止记录（保留诊断结论）：原始6＋续行139＝145/150模型调用，余5不足以完成剩余矩阵，不自动追加预算。** Tabelog发现同问题已到3轮；当时未进入Phase4／5／6；该前置门槛现由P1-A基线计划替代。Semantic／Gold／HARD／身份／半径与整单500s／50调用不变；诊断样本4调用不作为旧2调用的同预算改善。

完整旧 STATUS 已移入 [月度历史快照](history/monthly/2026-10-status-baseline.md)；[月度摘要与逐条索引](history/README.md) 保留原始 DEVLOG／TEST-LOG。
