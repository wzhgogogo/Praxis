# 3b A批次2：TableCheck阳性日历缺证停止

Evidence status：offline evidence inventory / exposed development material；不是网站回放、不是当前库存结论。时间2026-10-27T03:31:00+01:00（Europe/Vienna CET，UTC+1）。固定来源为main/daba2ef03451ed8e54f152b1c8387a6d329d9f20。

## 结论与停止

**没有找到可加入G2固定集的真实保存TableCheck阳性日历。** 按用户第3节“找不到合适的保存页就停下报告，说明缺什么”停止，未开始第4节Runner接线。没有把构造页、查询时间选项、空结果或未加载结果当作空位事实。

缺的是同一次已保存真实读取中，可绑定同店身份、具体日期、人数与至少一个可用时段的TableCheck原始DOM，并有对应请求/观察元数据及SHA。仅有预约入口或原页UNKNOWN不能满足。

## 范围与输入

检索脚本及输入在d8e8626e先提交；inputs.json.gz逐项冻结3408个Git blob和SHA。范围为.eval-artifacts、src/harness/browser/fixtures、src/integrations/tablecheck/fixtures中的保存HTML/HTML.gz及tar.gz；752个私有Holdout路径/变异副本排除、不读取。脚本无网络路径、不启动模型。

结果包括3388份保存HTML与20归档内968份HTML，计数包含重复捕获，不能当独立门店数。1132个实际Venue Availability容器，924个Unavailable标记，Timeslot Btn链接0。

为避免仅凭testid缺失作结论，另检查TableCheck页中含HH:mm文本的链接/按钮，排除select选项，得到171份候选、4个不同SHA。逐份原文复核如下。

| SHA前缀 | 捕获数 | 来源 | 裁定 |
| --- | ---: | --- | --- |
| 569077a1 | 1 | checkpoint-b-20261019 / p2-kagurazaka-kaiseki-20261029 / snapshot-0015 | Date Field的Thu, Oct 29 · 19:30是检索条件，不是库存 |
| 625b5b12 | 1 | 同目录p2-kf-h001-20261027 / attempt-1 / snapshot-0016 | Date Field的Tue, Oct 27 · 19:00是检索条件 |
| 530009f9 | 1 | 同运行attempt-2 / snapshot-0012 | 同样仅已选查询时间 |
| 887f12cc | 168 | F2a及后续默认回归录制，340字节Fixture restaurant页面 | 本地构造，来自src/harness/browser/fixtures/run-interruption.ts:33，不是网站捕获 |

完整路径、SHA、HTML字符偏移和判定见candidate-review.json；全部输入见inputs.json.gz，结果为inventory.json.gz和summary.json。这是有界缺证检查，**不声称TableCheck网站没有空位，或其他未保存页面都不可用**。

## G2原基线与Runner

固定集未改。tablecheck-calendar-nakamata与tablecheck-calendar-kinri仍是PASS：原页0可绑定事实、未知保持未知，不能覆盖可用时段被testid改名后丢失的场景。没有新增页面，也没有为缺失阳性页编造PASS或DEGRADED_HONEST。全12页既有基线仍8 PASS/4 DEGRADED_HONEST，本项为NOT_ADDED_MISSING_REAL_POSITIVE_CALENDAR。

Runner为NOT_STARTED。用户批准的独立集成安排保留：基于B/0a466bcd，B产品原字节，核心调用集中单适配文件；新输出映射status/answer/citations(URL、readAt)/sensitiveCategory/reason，当前纯引用输出只作临时转换，B新交付后只改适配再跑fixture，之前不合main。本停止点未建立Runner分支、未运行fixture，不报告第4节完成。

## 已完成部分与验证

- G2去重重放合入main 5f621be3：五门禁1101/166全绿及test:dom-change 4/4，逐项前后净树。
- 回放修复合入f465ada0：五门禁1104/167全绿，逐项净树。
- QA合入daba2ef0：五门禁1110/168全绿，逐项净树；8页56摘录及22输入SHA通过；25确认9候选，全34仍NOT_READY。

三个工作分支和main已推送并ls-remote核对。旧F5整包按用户决定结束；首次3b Live用当前代码新录制验收方案(c)，本批不实施。

本停止分支仅新增离线检索脚本/证据、文档与0调用记账，不改产品/站点/source-packs/Prompt/Schema/State/G2固定页。检索运行PASS只表示检查完成，不表示阳性日历验收通过。脚本/输入SHA一致；本停止分支五门禁NOT_RUN，引用上述已合main净树收据，不能冒充本停止分支重跑。git diff --check通过，提交后净树。

预算保留原6条并追加第7条，累计全部0；真实模型、Google、网站、Live和公开GET均0，不读取/暂存.env。
