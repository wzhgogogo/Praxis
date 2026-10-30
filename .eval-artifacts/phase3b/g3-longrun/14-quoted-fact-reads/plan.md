# G3c 通用原文选句的套餐、价格和事实读取

2026-10-29 CET，draft / not integrated。真实模型/Google/网站/Live/GET/环境重跑0。

纵向切片：生产Web/Hybrid共同事实组合及已绑定来源快照 → 模型选择完整原文范围、其中价格行编号 → 代码逐字核对、解析金额/税/餐别/条件 → 既有事实判断/Reducer/展示。保留Native TableCheck公开服务分区；范围内报价不能重入全店事实。旧私有价格/HARD快捷函数及对应实现细节测试随调用方一起退役。历史输入不改，不放宽核验。

独立restaurant_source_facts Prompt/Schema1→2：增加商家类别原文选择，selections每行固定firstStatementId、lastStatementId、role、priceStatementId（无价格时空字符串）。不让模型给金额、URL、门店或库存；价格行必须在完整引用范围中。G1问答3、Agent、State/TaskDefinition不变，vacancy响应文件/输出不改。

Native/官网复用该同店快照选择，不新增抓取/重试；每个新快照至多一次，受原Executor/共享模型预算、deadline/取消约束。已有公开字段可作加速元数据，缺少时回到选原文；事实判断仍复用原ModelFactJudgment14/Schema4。保留原始完整报价及服务、餐别、人数/日期边界。

为保留G1独立3调用预算且不让卡片追问多做未请求的套餐/HARD解释，现有事实请求新增内部capturePagesOnly用途（不进State/事件）：G1页面获取保留身份、Guard、访问上限、原始快照和取消，跳过事实/套餐解释；问题仍由原G1核心回答。正常搜索调查不使用该标志；不改变G1可见合同或版本。

先冻结并取得有效红灯：多金额上下文只按被选价格行解析；无私有标记的Native商家原文能到真实共同组合与条件判断；改名OWST套餐仍读原文；捕获用途不调用事实/套餐模型。补充价格编号越界、评论/名字、受限报价、预算根因和跨范围反例。五门禁/严格G2全绿、净树、旧HARD逐条差异、引用与C保护证明后推工作分支；若触发既定停止条件则报告停下，不合main。
