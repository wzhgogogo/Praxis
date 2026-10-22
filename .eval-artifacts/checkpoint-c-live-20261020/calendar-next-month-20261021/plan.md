# 日历翻月与预约页边界修复

- Evidence status: draft / not integrated；已暴露开发证据。
- 分支：codex/fix-calendar-next-month，基线 origin/codex/integration-checkpoint-c @ a3f6b84519d1bfdff271b5f87d88fa34450d40d1。
- 依据：第0步复核6d92882，采用V3；V1/V2不采用。原5次Live、历史S0、69点答案不改。

## 当前切片与验收

用户可观察改善：模型能区分日历、人数和时间的同名控件，读取真实月标题与空标签图标的公开替代文本；执行器对翻月操作独立核对显示月份，未变则反馈NO_CHANGE，不把无关页面变化计为翻月进展。TableCheck预约表单路径由生产网络边界在派发前永久拒绝。

实现只进入共享Browser Registry／观察投影／执行器及TableCheck来源策略；保留原Task State、授权、库存与交付的权威边界，不采用实验技能或thinking。公开DOM事实不得来自目标日期或评分答案；所属组无法唯一确定时为Unlabelled group。只递增实际改变的Browser Prompt／上下文版本，未变的Restaurant Agent Context不机械升级。

先补既有真实Chromium Fixture：Matsumoto式空标签日历链接＋人数／时间Next，旧版本应不能识别、修后能到11月并核对目标日期；另验证翻月点击只改无关文本时反馈月份未变。H003预约表单要由独立接收器证明零到达；合法公开门店页及四参数库存读取保持允许，普通平台的已审核公开query不被全局退役。

离线保存材料核查Tabelog日期／人数URL参数，仅报告已保存材料支持的事实，不增加URL捷径实现或网站探测。

## 验证、预算与冻结

采用Test Skill矩阵：原反例红灯→修复绿灯，生产Registry＋Executor真实本地Chromium链路，既有生产组合回归；typecheck、arch:check、npm test、build、test:browser:fixture五门禁全绿。22个既有artifact校准与独立比较器保持22/22、0模型／网络。P2-2五种子复用原独立标签。

模型调用只在离线门禁通过并提交冻结后执行：生产观察重建原69点一次（≥68/69），原P2-2选店5种子一次（5/5），最多74个API请求，失败计入，不自动补跑。只允许现有DeepSeek模型API，0网站／Google／Live，目标源材料全部本地履行、缺失资源拒绝；不使用预约表单、不执行时段点击。阶段账本基线1995/4000，最多2069，完整Live和正式环境重跑不增加。

模型回放必须从生产Registry／Executor产生观察和当前生产Prompt，不手工注入实验V3观察来冒充实现。独立答案从原保存DOM绑定；新ref按源节点／指纹独立核对，不用同名Next匹配。每点一条输出、耗时、usage与原始输入SHA，运行中不改冻结代码／输入／外层。若准入或阈值失败，保留原输出并报告，不调标签或静默补调用。

## 停止与交付

完成离线实现、全部验收、四层报告及账本后，只推本修复分支，等待复核。不推集成分支、不访问当前网站、不跑Live、不采用URL参数捷径；本地验证不宣称实时库存或完整交付已恢复。
