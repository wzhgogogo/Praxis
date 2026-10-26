# 用户停止点 3 复核与收尾授权

2026-10-26，维也纳 CET UTC+1。来源：当前对话中的用户原始消息及后续澄清。复核文件位于 Claude 项目；用户确认消息本身就是完整指令，无需取得该文件。

1. 规则修正：“没有时间 → RECOMMENDATION”改为“既没有到访日期/时间、也没有订位措辞 → RECOMMENDATION”；有订位措辞但没有时间 → AVAILABILITY，后按 ADR-0026 补问时间，可先找店。同步 ADR-0044 修订版本、Prompt v25、sidecar：SR02-T01 A，SR02-T02 CONTEXT_CARRY。
2. 所有 NO_TIME 轮和 SR02 会话各 3 次；剩余 60 次，累计硬上限 144 不变；非目标差异只记录不停批。凭据窄授权沿用同一批受控 Runner。
3. SR03-T02 Gold 改 AVAILABILITY（B），数据集单独升版，旧版本保留。
4. 接受灰区全部 RECOMMENDATION、3/3 的结果；仍为灰区，不固定标签。
5. 本批不处理、列入 3b 前置：开发 Gold 非目标旧口径（菜系 HARD、evening 等，v23 同样复现）；SR03-T02 query 丢 Sushi Dai（v23 同样复现）；SR08-T02 CONFIRM 合同拒绝。

完成五门禁全绿后合 main 并推送，报告 ls-remote 核对的新 main SHA。既有基础设施/额度/S0 停止边界继续有效。新真实调用仅九个去重逻辑轮与现有 schema 尝试，不增加控制、来源或私有 Holdout 调用。
