# 后验分组与离线补评 — 2026-11-10 CET

仅src/eval改动；产品8ca251f8不变。本步真实GET/模型/Live均0，账本仍12/26、86/126、1410/2500；原425工作区和账本不动。

后验按来源实体+日期+人数分组，第一交付时间作为svt，每组一次、最多两组；第三组NOT_EXECUTED/POST_DELIVERY_GET_LIMIT，不抛运行器失败、不扣GET，也不伪造库存判断。既有缺独立证据仍NOT_EVALUATED停批。AFTER四参数URL仍验证，响应本身核店/日期/人数，每个时段用原selection判断；认证及SOURCE_CAPTURE仍按原时段绑定。Evaluator@7。虚构同店5时段→1GET、两店→2、三店→2且第三未执行；缺时段为false，跨店/日/人数/非法svt拒绝；既有G6组装回归通过。

D01：提供的review SHA072ddab5…已核对，经现有reviewHoldoutAttempt得 **EVALUATED / qualified=true / QUALIFIED_DELIVERY / s0=0**。文件内attemptKey=D01-20261110，与旧目录D01不同，所以在逐字节相同的临时证据副本上按声明key调用，再把supplement输入/结果另存到原D01旁；未修改审核文件、原评价或原批次。审计绑定见evaluation-summary.json。

D02：原failure输入+已录18:00/18:30两份原响应（SHA/URL/JSON逐一核对），未改产品主张，另存 **evaluation.offline-recovery.json**。五个POST_DELIVERY_SLOT全部PASS、边界200/200 PASS；资格引用本身为待语义复核。但完整结果为 **NOT_EVALUATED / s0=9 / stopBatch=true**：原有B1多时段检查把每个同店链接配给第一个18:00，产生B1_LINK四项FAIL；B1_SOURCE_URL五项FAIL还受来源请求svt与该首时段严格绑定影响。未删除时段/链接、未改SOURCE_CAPTURE合同来消除这些项；不能把这次补评称为PENDING_REVIEW或合格。原failure保持，已停止该补评，不新增读取。

这是本轮授权的后验问题之外、离线评测暴露的B1多时段绑定阻断。现有评分器要求的逐时段来源请求绑定，不能从未发生的请求补造；后续由复核者决定如何处理完整日历响应与逐链接的独立核对。本轮不扩展修复，不重跑D02。

完整门禁与写死扫描待冻结。完成main发布后停止，不进入新held-out。
