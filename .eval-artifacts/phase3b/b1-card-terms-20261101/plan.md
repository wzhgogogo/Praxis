# B1 卡片条款生产切片

- Status: current executable / user-approved offline implementation; exposed local construction, not a Clean or Live baseline。
- 时间：2026-11-01 CET（UTC+1）；基线 main 74dd2faf。
- 承诺：选店且有有效同店同渠道 B1 时，用 G1 读取取消与信用卡条款；原文、英文转述、页面和读取时间进入卡片；已接纳且当前同页答案复用。缺证、身份/run/渠道不符、过期、预算或取消只省略条款，链接继续走原两次校验。
- 不为全部候选读，不访问预约流程/确认/支付/账户，不改 B G3 或 A 原测试；模型/Google/GET/Live 全部真实调用 0，不读取/加载 .env，不读私有或 G1 独立答案文件。

原样导入 A31ba2a84 的测试、取消问题和唯一必需 helper 变化。先冻结提交，原 main 产品上运行并保存目标断言红灯；不把启动或类型失败当红灯。随后实现 G1→同店同渠道条款→B1 的纵向链，不以注入 terms/已接纳 evidence 代替实际生产取页。

主动读取复用现有 G1 的身份页面、模型选句与逐字核对，使用该选店轮原有模型预算/截止时间和事实读取共享计数；不进入显式追问的独立额度通道。条款和页面保留在可过期、按根任务/run隔离的临时缓存，State/Outcome 不存原文。先检查是否需 Agent Prompt/State/TaskDefinition 递增；若需要先报告。本轮预计无需改变这些版本。只追加 ADR0049 §5 的用户11-01决定。

验收从 createLiveReadAssembly+真实持久应用驱动，仅替换模型和来源传输：A原取消追问复用；主动读取取消/卡；已问复用不增模型；日英冲突并列；错渠道/店/旧run/过期/预算/取消/未写 fail closed 且 B1 不受影响。正常控制与主要反例都保留来源原始观察，产物先落地再独立核对字面、URL/时间/身份及资源；不把 fixture 模型质量当真实语义验收。已有手续费固定配置不变。

相关行为通过后冻结最终源码、输入、外层 runner 和 SHA，顺序执行 typecheck、arch、npm test、build、Chromium fixture、严格 G2，各项前后净树。门禁两次修复仍红、需要真实调用/受保护文件/版本抢占或 S0 时停止报告；完成推本分支、不合main，通知A等待复核。按 Test/Eval/Post-change 规程报告；STATUS/DEVLOG/TEST-LOG及月度索引同步。
