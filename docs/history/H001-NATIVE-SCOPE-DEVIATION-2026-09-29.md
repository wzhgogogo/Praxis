# H001 原生接线执行偏离记录

- Status: Draft
- Document revision: 0.1
- Last updated: 2026-09-29
- Evidence status: superseded retrospective；非 H001 验收证据

主 chat 于 02:24Z 跟进时发现 Sol 恢复旧 H003 Live。实际运行 `.eval-artifacts/h003-native-tablecheck-loop2-retry-2026-09-29.ts`，02:23:25.368Z 开始，77,685ms、11 模型调用。输入为 2026-10-02、10 人、17:30–22:00、3km，并非本轮 H001。首次沙箱启动失败后另在可启动浏览器的环境执行了该脚本。原始结果保留于同名 `.result.json`，不用于本轮 H001 通过判定。

这违反当前阶段1/2先行、禁止恢复旧H003和附加3km条件的派工范围；不是授权的阶段3 H001 Live。主 chat 已两次发送纠偏指令，Sol 随后明确承认误执行，确认停止该方向、不再发起 Live，回到 H001 阶段1/2离线实现。Sol 回报两候选 UNKNOWN/BROWSER_TIMEOUT、零库存／Offer；这些业务结果未在本轮独立验收，不能外推 H001。

后续先完成代码和离线正式组合三主场景；真实模型固定来源开始前，实施者须把实际命令、目标Case、既有预算与离线证据交主chat核对，避免再次执行错Case。阶段3仍须前置独立review后放行，不自动重复Live。该核对由主chat完成，不增加用户审批。
