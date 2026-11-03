# 同品牌身份前缀与条款就绪读取

Status: implementation in progress / not integrated；已暴露开发材料，非 Clean Baseline。真实模型/Google/网站/Live0，不加载.env，CET UTC+1。

第一项已完成：获批a1cd798e在净树11步全绿后发布main db1f44a2238b44fa92cff58dae4e17e8903875a5，ls-remote核对并通知A；本分支从该main开出，不合main。

用户已澄清：5家也调查原顺序前3家；所有前三家核对后，恰好一个已绑定来源全名匹配才继续，零/多匹配反问。身份规则不放宽，后两家不偷偷调查。

## D3 原件与首个偏离

A ae7fd072的17份相关执行、语义、录制、DOM/HAR原件逐字冻结，见inputs.json。初次完整DOM本地复原，英文可见文字少8字符、日文完全一致；原失败另存。改用录制序号323保存的原始visibleHtml后，两页文字SHA均精确等于原录制：英文6471字元72c6e47e…、日文216字元8bd752b5…，没有补写文本，脚本关闭、请求只本地应答或拦截。

录制中的条款英文导航后700ms waitForSettled返回false（356），随后snapshot359。日文翻译页是“現在アクセスが集中しています”，没有同店身份资料。既有G1 ModelRestaurantPageQuestion对PENDING页面在模型前返回INCOMPLETE_PAGE，这是安全检查，不能直接跳过。

4e14562f整组装有效红灯：D3原语义与展示决策字节保留；同店查位、USER选择、PRESENT和B1成立，条款问答0/2。来源查位前缀和新增Google Place Details是明确的固定I/O；原浏览器CLICK引用没有强行套给构造控件。条款正文与HTML来自原件，完整三回合Live不在本轮证明范围。

先补诊断，不改变现有提前退出条件；导出字段bookingTermsDiagnostics不进入State，按根任务隔离，使用现有读取缓存保留时长。记录选择/阶段/绑定/页过滤/预算/20秒保留/取消及问答结果原因，不记录用户文本、凭据或原网页全文。State25/TaskDefinition23和Prompt/Schema不变。

准备的最小就绪修复范围：NativeSourceFactRead.inspectFacts原约109–121行的Executor选项及约297–320行的capturePagesOnly初始/翻译页读取，仅该模式复用既有BrowserTaskExecutor就绪观察/稳定性核对；普通事实读取不变。G1完整页检查、身份检查和20秒保留不放宽，不新增网络重试或独立预算。最终修改前仍以当前函数定位为准。

五门禁与严格G2尚待最终配置；只推工作分支，交复核并通知A，不合main。原历史D6 S0=1不重写。
