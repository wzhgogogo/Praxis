# V2 thinking 工具选择兼容补充

- Evidence status: draft / not integrated；用户已批准本次变更及续跑。
- 原冻结提交 ee9ac1a；SHA-256 967d63e2d8e06ccbdcbb0134d55fdf4588124c8f0fa7dc49a45ac178e4a8a283 原样保留。
- 首批 3 个 API 请求：c-01-d008 的 V0/V1 成功；V2 HTTP 400，供应商错误原文为 “Thinking mode does not support this tool_choice”。按原规则停批，0 网站请求。

用户批准仅对 V2 把请求线上的 tool_choice 从指定 browser_read_action 函数改为 auto；同一严格工具 schema、model、messages、temperature、thinking enabled、120000ms、8192输出上限均不变。这个兼容差异是额外变量，不再称为仅 thinking 的纯因果对照；auto 允许供应商不调用工具，这种结果如实记为响应形状失败，不自动补跑。

原脚本、输入、答案不改。新增评测侧传输包装器和补充冻结包，分别记录 Gateway 原始 payload 与实际发送 payload 的 SHA。已成功 V0/V1 不重跑；未生成模型结果的 V2 以新协议发一次，其余 273 项按原循环顺序继续。合计 274 个新请求＋原3＝277，不超过300；失败照扣，剩余23次不自动使用。各点各变体只保留一次生成的结果用于比较，不按评分挑选结果；旧400保留为单独传输失败分母。

恢复前把原3次调用加到账本和全批调用预算；外层继续仅允许 DeepSeek beta/chat/completions POST，拒绝重定向。HTTP 400/401/402/403 或连续3个供应商错误仍停批。结束时独立校验补充冻结和原冻结，合并报告保留 276 个决策试次／277 个API请求的区别，并同时报告 V2 全请求与成功生成两种耗时分母、缺失 usage 数量。0 来源访问、0 浏览器动作、0 Live；完成后停下等待复核。
