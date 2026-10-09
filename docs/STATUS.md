# Praxis 当前状态

- Status: Accepted
- Document revision: 4.164
- Last updated: 2026-10-09
- Source of truth for: 当前实现、证据与下一道门槛

## 当前门槛

- **P1-E 本轮两例已结束，停止等待独立复核。** G1 `070dad6`、Gold7/ADR-0039 `5aac484` 已本地提交，四门禁分别 778/778 与 779/779；Live 冻结 `5aac484` 的宿主机干净工作树。kf-h001 首次 preflight 503 后唯一重跑，295s/50模型/6 Google，预算耗尽无展示；kf-h003 100s/32模型/0 Google，展示1家，证据充分但条件措辞待确认，evaluator@26 两例 qualified 均 UNKNOWN。两例计入授权 P1-E 计划，ENV_FAILURE 单列，不宣称能力改善或 Clean Baseline。[报告与全部路径](../.eval-artifacts/p1-e-early-20261009/report.md)；不推送、不追加运行或修复，归因由独立复核负责。

- ADR0036 supplement and ADR0039 accepted by user 10/9; default Gold7 active, Gold6 frozen unchanged. Night review passed implementation, 21 old immediate Agent seeds superseded by contract in independent seeds.v2. Static CSS replay gap and obvious closing-hours early response remain known, C1/P1-D not in this slice. After four gates/commit, run only kf-h001 then kf-h003 as authorized P1-E 2/5, stop on false display and record evaluator26 results.

- G1 user-approved integration verified by all four gates (778/778 default tests); accepted supplement permits narrow read only. Gold7/ADR0039 promotion next, then two explicitly authorized P1-E Live cases. Earlier night stop/no-Live directions are superseded only for this authorized slice; C1/P1-D not included.

- Night work stopped for independent review: C0b and E1 complete; C6a and C5a implementation pass but specified replay acceptance PARTIAL; P1-B original reproduction passes, static reconstruction blocked by missing captured CSS/snapshots; C1 dependency BLOCKED, no implementation. G1 is an isolated Proposed draft on its named branch; Q8 analysis complete. No Live, witness recheck, push, P1-D integration, or frozen input changes.

- C5a implementation and offline composition verified; replay acceptance PARTIAL due to missing captured CSS/geometry. C1 remains BLOCKED by the prerequisite that the first five items be complete; no C1 implementation. Independent review must resolve recording completeness before further replay or separately authorized Live.

- **P1-B Runner与原样回放完成，重建验收BLOCKED。** 全部106原样调用，错误复现95.65%、正向7/7。冻结DOM不足以恢复样式：83个浏览器种子全部单列（11缺快照、72缺样式），不计通过率；Agent层独立。不能据此签收C5a质量改善。C5a仅继续可独立验证的执行器机制，C1依赖门槛尚未满足。

- **C6a代码已完成、回放验收PARTIAL，继续P1-B。** 30分钟策略@6、Agent prompt@20/context@9和过期快速结束链路已有离线证据；历史#40–50在新窗口内，6/11询问新时间、5/11继续合法查位，标签的旧1分钟过期前提须独立复核。Gold@7草稿默认不启用，跨午夜仍须明确时间澄清。

- **E1已实现，继续C6a。** evaluator@26绑定候选查位阶段与证据时刻，rubric@21不变；11次旧产物仅kf-h005变为有证据支持的确定YES，其余10次结论不变。旧文件保留；开发集重评非新Live证据。今晚产物见`.eval-artifacts/p1-c-night-20261009/E1/`。

- **今晚 C0b 已完成，转入 E1。** 读取动作中的模型调用现按当前合格默认首批保护最后4次；耗尽可读份额以`BUDGET_RESERVED_FOR_DELIVERY`的UNKNOWN交回Agent，再复用C0窗口实际展示。Web／Hybrid Runner／固定来源共用同一scope guard；每次调用重核已有证据新鲜度，无合格候选不限保留。四门禁通过（770/770），kf-h001 #38历史上下文的6次边界组合通过、零真实模型。今晚不运行Live；详细证据见`.eval-artifacts/p1-c-night-20261009/`。

- **P1-A 基线与补跑已完成，属于已暴露开发诊断。** 冻结 `2656ce9` 上保留8次主运行及3次补跑；独立归因见 `.eval-artifacts/known-feasible-baseline-20261008/review/`。kf-h004重新归为语义目标错误，非错误展示；三次补跑累计123模型／2 Google，kf-h005实际展示，kf-h003与h005模型预算耗尽未展示，自动目标评价均UNKNOWN。补跑报告保留在冻结工作树 `.eval-artifacts/p1-a-baseline-supplement-20261009/report.md`；本轮C0不改旧结果、变体或见证。
- **P1-C C0 实现与两次真实模型回放通过。** 共享整单调用剩余≤4且已有合格默认首批时，复用交付事件与资格规则，Web／Hybrid Runner／固定来源均接入真实计数；调用跨阈值会拒绝旧调查提议。合格正例实际展示，错误人数、过期证据及明确数量不获得例外；本地Web持久化入口也实际展示短批。[ADR-0038](decisions/0038-model-call-default-delivery-window.md)仅扩展ADR-0031触发条件。四门禁通过；[证据与未覆盖边界](history/TEST-LOG.md#test-2026-10-09-p1-c-c0-call-budget-delivery)。
- **当前停止点：C0 到此停止，不运行 Live。** kf-h001 #38／#49分别一次真实DeepSeek回放均主动选择`PRESENT_RESULTS`，校验ALLOWED后实际展示Sushi Suga；共2次模型，模型耗时2,228／1,783ms，零Google／浏览器／餐厅来源读取。#38是4次临界预算对照（原13次剩余），#49沿用原始2次；不宣称原第38次自然触发。沿原State version 9／10继承冻结来源轨迹的既有诊断六维均SATISFIED，资源仅计本次新增决策；产物和独立核验在`.eval-artifacts/p1-c-c0-20261009/`。已暴露单步回放不证明完整Live改善。首次审批拒绝后用户已明确授权并完成；不进入C1以后或P1-B／P1-D，P1-D ADR仍须用户批准。

- **H001→H001–H005 Playbook：Phase 0／1／2 已签收，续行 Phase 3 仍 FAIL。** Google发现10/10、Tabelog发现9/10／身份10/10；TableCheck发现3/10／返回身份4/10、官网返回资料4/10（3份独立重建）未达门槛；[本轮证据](history/TEST-LOG.md#test-2026-10-08-playbook-phase3-renewal)。
- **已知可行库存：同五家 Tabelog 从0/5到5/5。** 有条件等待人数加载后，原请求10/22／2人／17:30的页面选中值、原始200响应与五个Offer逐项绑定，59,960ms／14模型；仅签收库存绑定切片，未证明完整HARD／H001交付。
- **交付代码：当前查询／地区绑定、公开GET查询grammar、真实空控件值与共享预算已补强。** Source Pack持有来源规则；Record保留公开资源与语义动作指纹，Replay零网络执行；一次列表回放通过，真实日历失败路径仍NO_COVERAGE。
- **历史 Phase 3 停止记录（保留诊断结论）：原始6＋续行139＝145/150模型调用，余5不足以完成剩余矩阵，不自动追加预算。** Tabelog发现同问题已到3轮；当时未进入Phase4／5／6；该前置门槛现由P1-A基线计划替代。Semantic／Gold／HARD／身份／半径与整单500s／50调用不变；诊断样本4调用不作为旧2调用的同预算改善。

完整旧 STATUS 已移入 [月度历史快照](history/monthly/2026-10-status-baseline.md)；[月度摘要与逐条索引](history/README.md) 保留原始 DEVLOG／TEST-LOG。
