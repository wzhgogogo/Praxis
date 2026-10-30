# G3收尾：已核验form_course原链接、A合入及main同步

2026-10-30 CET，draft / not integrated。用户已批准本切片及输出变化，真实调用0；只在G3工作分支整合，不合main。

纵向承诺：inspectTabelogVacancyResponse已核验的每条正常时段原链接不再丢弃，OBSERVED增加formCourseLinks[{time,url}]与sourceResponse{sequence,url,observedAt}，供C后续B1接线。url逐字来自selection行，保留相对/绝对形式、编码和参数顺序；不重建、不访问。现有availableSlots和hasExplicitSlotUi保留；所有资格、状态和核验规则不变。UNKNOWN/changed不携带链接，24+不支持时钟仍按原规则跳过。

先冻结红灯：最小构造响应中原链接/来源字段缺失，旧代码在完整输出断言失败；核对店号、人数、日期、时刻、origin/path不符和格式变化的原规则均保留。旧C-facing形状断言同步新显式格式，不改变库存调用者的原输出。绿灯后提交，合入A31398a77，再同步最新main（获取时404a766e）；按id并集保留共享账本。

同一合并候选五门禁+严格G2；每项前后净树，输入/外层脚本SHA冻结。旧HARD367输入/481状态对照，旧44,197字节事实回归复跑；核验A五文件及C唯一授权测试输入差异，审计verifiedHardCriteria→matchReasons旧路径调用者，只列后续清理不扩大实现。

完成报告覆盖全部G3/G3c组红绿、最终门禁、12页严格G2、私有依赖及延期、旧HARD、跨归属及新输出；同步STATUS/DEVLOG/TEST-LOG/月度索引。推工作分支并按用户授权通知C分支、SHA和格式，随后等复核。

若失败需改A/C文件，先停下报告；不改评分器、Gold或独立期望。不读取.env或问答answers*.json，不新增模型/Google/网站/Live/GET/环境调用。
