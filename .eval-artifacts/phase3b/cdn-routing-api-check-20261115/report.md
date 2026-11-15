# cdn0 规则更新后的只读检查
2026-11-15 15:15 CET。产品保持 a66a2edc，配置与脚本预先冻结635750325a48f7e651afa7428102decb33b77540。用户授权先检查403，恢复才再跑一次D8。

沿原 createG6LiveBrowser、原发现网络策略与 Guard 读取 TableCheck 入口，真实 catalog GET 在15:15:39 CET返回403，响应520字节，只保存SHA与状态，没有保存响应正文或请求头。条件不满足，D8未启动。实际0Live/1评估页面GET/0模型。

当前运行的xray进程使用v2rayN/binConfigs/config.json。更新后的运行规则5将full:www.tablecheck.com、full:tablecheck.com、full:cdn0.tablecheck.com送direct；规则9为其余端口默认proxy。search-v4.production.ap-northeast-1.aws.tablecheck.net未命中直连，仍进proxy。店铺API production.tablecheck.com也未被上述full规则覆盖。静态资源cdn0直连不会改变这两个API的路由。

只读核对持久化数据库还发现：
- V4-绕过大陆(Whitelist)未启用，里面保存着原有domain:tabelog.com、domain:tablecheck.com、domain:tablecheck.net的完整餐厅直连规则。
- 当前启用的是V4-全局(Global)，餐厅直连仅限上面三个full主机。

历史2026-11-09成功D8的Guard原录制中，catalog5次与search28次均返回200；同一类读取当前403。浏览器工厂/本地代理配置代码在签收提交与a66a2edc之间没有改动。本轮与此前两单的env-file哈希也完全一致。当前分流缺口已核实，历史最终出口IP没有录下，因此不能仅凭这些记录认定具体是哪一个远端节点或源站规则返回403。

下一步应在当前启用的路由配置中补齐原有餐厅API直连范围，至少覆盖已观察到的search-v4 API，并考虑店铺API；现有未启用配置里的规则不会影响当前Global。配置修改后先单次检查catalog，200后才进入授权D8。此次未修改代理规则、产品代码或旧账本。

[原始状态与请求元数据](result.json) · [更新后路由摘要](routing-before.json) · [账本](active-budget.json)。
