# G3 已复核结果合入 main

2026-10-30，维也纳 CET（UTC+1）。current integration candidate / offline only。

用户批准 G3/G3c `02163d39`（原统一门禁候选 `d7131675`），复核者已在2核Linux独立复跑五门禁和严格G2全绿。本切片仅同步最新main `4cbc521b`、合并文档记录并在同一候选重跑五门禁及严格G2，绿灯后发布main。不改产品逻辑、Prompt、State、Schema、Guard、测试期望，不新增真实模型/网站/Google/Live/GET/环境重跑，不读.env或QA answers。

源码自动合并；实际6份文档冲突，双方历史正文保留，日志页头只保留单一新revision，ADR索引保留0047/0048和0050并合并0049的批准日期与0050提示展示的部分替代说明。输入及外层脚本先提交冻结，门禁每项前后净树。不全绿立即停止并保留原始失败，不修改测试、不发布main。旧367组/481状态及44,197字节固定回归补充核对仍只允许既有批准的一项状态变化。

STATUS记录后续清理：provider observation verifiedHardCriteria已无非空生产者；相关可选字段、透传、旧matchReasons文案投影和直接构造测试留待后续删除，保留Google与Source2 MODEL_JUDGMENT合法criterion claims。本批不实施。G3b等待首次Live有时段的TableCheck日历。

全绿后只归档报告/日志、按id追加0调用账本并确认被测输入不变。合main的树与已验证工作分支树完全一致；发布前再次核对远端main仍为批准基准，避免覆盖并行工作。推main后用ls-remote核对，通知C新main SHA，随后待命。
