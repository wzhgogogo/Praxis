# 结构预算核对与展示修复

Status: draft / not integrated; exposed holdout used only as explicitly authorized saved regression. Branch codex/fix-budget-condition from preparation 17415d1c.

切片承诺：已有 budgetPerPerson.max 不再绕过 HARD 价格核对，也不从条件展示中消失。现有语义合同规定 BUDGET_PER_PERSON 只承载明确硬上限；around/ideally 等仍在带 SOFT strength 的 criteria，沿用现有价格政策，不改语义 Prompt/Proposal/Compiler，不从原始用户文本另建解析器。firm cap 与另行表达的 SOFT 目标分别保留，不根据金额猜测它们为同一条件。

实现范围：condition-states 将结构上限作为 POSITIVE HARD 条件追加在原 criteria 后，保留旧 criterionRef 序号；read-assessment 用相同条件行判定 HARD 价格。真实当前价格原文、来源、餐期/附加项/税和当前事实生命周期沿用原规则。硬预算 NOT_MET/NOT_CHECKED 均不得成为合格展示，未知不变成满足。无新网络/模型调用或站点常量；不修改 @33、Gold、变体、留出原文、旧运行或旧评价。

检错与验收：先记录未修生产的预算条件缺行和错误接纳红灯；再修复。默认回归用 h-02/h-08/h-14 原事件经当前 Router→Reducer，五家均有 HARD 预算行，状态和 @33 独立保存评价一致，价格引文绑定来源；合成超预算和缺价必须被 Validator/Reducer 拒绝，软偏好仍披露而不硬化。五门禁全部实际运行。另提交冻结，离线生成三份真实 Router→Reducer 派生报告并由 @33 独立评价；22项校准重跑22/22，标签仅在自动输出保存后读取。原18次正式结果不覆盖，反事实展示回放不计Live。

h-11 诊断：只读其语义调用及对照两次的保存消息/Proposal，定位 around 首次出现的环节，报告证据与建议，不修改语义Prompt或调用模型验证猜测。

版本：预算字段、条件行结构、Prompt 和现有 firm-cap 合同不变，本项为恢复原义的 bug fix；如实施发现确需不兼容契约再显式处理，不预建兼容路径。本地 Chromium Fixture 的 loopback 服务允许；所有来源网站、真实模型和Live均为0。完成并推送新分支后停止，待复核，不合入集成或准备分支。
