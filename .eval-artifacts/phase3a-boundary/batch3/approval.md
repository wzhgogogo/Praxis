# Stop 2 approval / batch 3 authorization

- Status: current executable authorization; not a model result.
- Reviewed branch tip: c014d4818817cc7c2ce3f9d9273788b0e3186afa.
- Times: Vienna CET, UTC+1.

用户原文：

> 停止点 2 复核：通过。复核环境独立复跑 1051/1051、git status 干净。进入批次 3：真实模型语义回归，按停止点 1 批准的范围与上限（144 次，单列账本）执行：开发语义回归 15 轮；14 个灰区各额外 3 次；两份已暴露留出集 12 例（已物化日期的冻结输入）；新增开发候选 “Good cafes nearby to meet up with a friend on the afternoon of Wednesday” ×3（不作为 Gold）。处理规则按指令第 4 节：目标以外字段变化或 A/B 被判 RECOMMENDATION，只记录并停下；灰区一致率只报告。待改 Gold 列清单（含 SR03-T02），停在停止点 3 等用户逐条确认。推送本分支，不合并 main。维也纳时间（CET，UTC+1）。

144 是整个边界工作的独立硬上限，失败的真实请求也计数，不占3a′的400次。原指令禁止读取 .env、私有 Holdout、访问 Google/餐厅网站；这些限制未被本次授权改变。模型调用已获批准，尚未有可用的凭据/模型环境配置。
