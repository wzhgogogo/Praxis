# 浏览器严格输出Schema修复

2026-11-12 CET · draft / not integrated。源码fd5597fe净树完成门禁；后续新增文档/证据提交不改变src。

上次Live的6次browser_read_decide均PROVIDER_REJECTED；本地明确发现schema15在properties声明valueGroupRef、required却漏掉。网关strict:true；已有strict合同只检查语义schema，缺少浏览器覆盖。原服务端具体HTTP错误未保存，不倒填。

本轮schema16把valueGroupRef列入required，并说明非推进动作为空字符串。动作选择、目标值匹配、Guard、身份/HARD/G1、时限/预算及评价器均未改，没有站点或控件特判。新增合同测试从真实gateway序列化后的函数参数检查每个声明字段required，修前明确差valueGroupRef、修后转绿；语义合同不变。定向23项通过。初始测试内断言被gateway归为网络异常、首次沙箱本地listen受限、测试索引typecheck失败日志均保留，最终净树全绿。

| 门禁 | 结果 |
|---|---|
| typecheck / arch / build | PASS |
| 默认全量 | 1628 PASS / 0 FAIL |
| Chromium（含D4/D8/D02V/推进） | 284 PASS / 0 FAIL |
| G6 | 159 PASS / 0 FAIL |
| ead28945 / main32完整SHA扫描 | 0 / 0新增产品命中 |

此阶段0Live/0网站GET/0真实模型，主草稿/四账本不变。用户批准另加单次1Live/7评估GET/50模型/0环境重跑；使用独立新账本与冻结编排，原D02V请求/见证/60s体检和45s provider不变。只执行一次，旧失败及评价不覆盖。Live结果单独保存于验收证据分支；不合main。若提供方失败，新编排只被动保存现有隐私清洗后的typed错误摘要，无新增请求/重试。
