# 经用户批准的范围外来源标记修正

- Status: draft / not integrated；基线20e3588c，工作分支codex/feat-phase3b-g4-japanese-name-wiring；维也纳CET（UTC+1）。
- 用户明确窄授权：只在availability-source-resolver.ts成功usable(check)接纳分支补一行sourceProvider: provider.provider；该生产改动单独提交。
- 承诺：TableCheck失败→Tabelog成功的既有普通HTTP用例，check来源TABELOG且原链接B1按钮出现；反向来源TABLECHECK。两者失败的完整业务结果/sourceAttempts逐字不变；单源成功只增加显式来源，有效来源和其他字段不变。
- 修改前范围：AvailabilitySourceResolver.check中usable(check)分支的availabilityChecks[candidateId]对象，原第104行spread后。其他产品行、查位/响应绑定/身份/时段/排序/两次链接校验/attempts均不改。
- 增强现有resolver测试：正反回退、两个单源和双失败；固定Date做红绿快照，独立比较除了这一字段外全部结果相同，不用生产返回值自证。既有UNAVAILABLE控制补来源断言。实际HTTP保留全部11子例，补来源TABELOG断言，按钮不削弱。
- 运行前提交测试/计划/输入SHA；旧代码取得来源标签红灯与原按钮红灯。生产一行单独提交后，复跑同输入转绿；snapshot完整比较、sourceAttempts/字段/URL不可发生其他变化。
- grep穷举所有Git跟踪源码中的标识符，区分运行时读取、写入、类型、测试和冻结外层证据；报告逐读取方影响。只允许实际来源的记录/透传/诊断和由正确来源通过既有B1校验带来的变化。
- 五门禁和严格G2按现有唯一矩阵运行，每项前后净树；不重复已通过且不受本行影响的37家模拟（身份/检索源码均不变），原23/23+3/3及独立错认0证据保留。
- 全部真实模型/Google/网站GET/Live0，不读取/加载.env，账本不变。Beef清单仍不可执行，不授权任何提案请求。推工作分支后停复核，不合main。
