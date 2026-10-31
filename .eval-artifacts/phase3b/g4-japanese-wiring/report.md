# G4 日文名产品接线：离线证据与两个阻断

- Evidence status: **draft / not integrated — STOPPED_PENDING_SCOPE_APPROVAL_AND_SOURCE_BINDING**。
- 时间按维也纳CET（UTC+1）。本轮全部真实模型、Google、评测网站GET、Live、真实Postgres调用0；未读取/加载.env，未读私有Holdout。
- 分支：`codex/feat-phase3b-g4-japanese-name-wiring`；基线为新main `74afd9566ec5fb247792e57adb31bbaf2649cff3`。

## 第一步已发布

用户复核的B1 `7e701207` 已在独立发布分支构造普通双亲merge，同步远端main仍7c83e02e后，47c6c5ef冻结728项复验：typecheck/arch/build PASS，默认1254/1254、Chromium186/186（129.171秒）、严格G2 5/5及12/12页PASS，8步前后净树。源码与复核候选逐字一致，ADR0050前端完整保留。

已推送main **74afd9566ec5fb247792e57adb31bbaf2649cff3**，`ls-remote`同SHA；未移动其他对话检出的本地main。Tabelog/TableCheck B1普通组合离线接通；缓存重启后等新查位的限制保留。[发布证据](../b1-g3-wiring/main-release/report.md)、[回执](main-publication.json)。本轮下面的新用例另发现跨来源交接缺口，不能据此前绿灯宣称所有路径都已覆盖。

## 第二步实现范围

合入已复核的86e1dd9d准备：源码冲突0，六文档双方记录保留。按事先[计划中的函数/行范围](plan.md)只接检索词与名额：原Google全文→一次逐字合法真子串→同Place ID返回的日文全文，NFKC/trim/大小写去重。Google名称不替换原候选，也不参与放宽身份。

前两词累计至多4个详情，给日文阶段保留第5个。日文阶段可使用剩余容量（因此Beef前两词空时最多5个详情）；重复/没有新候选/名称读取失败时，未用名额退回此前已观察候选。总额5不重置，排序不变。源名称读取失败有UNAVAILABLE原因码；取消仍向上传递，不重试。

Google的同ID、ja、最小id/displayName掩码入口来自已复核准备。适配器按现有readRunId+PlaceID共享成功/失败Promise，发请求前计入已有placeDetails和合计上限；两个消费者重复调用不增加请求。Router只把现有readRunId经内部可选参数传给availability，普通Web产物保留累计Google计数。HTTP实际产物为namedPlace1/discovery1/额外Details1=3次**构造传输**，本轮真实Google0、费用0。生产中每个未确认店每run最多增加1次名称Details请求，已确认时0次；本批没有查询价格或估算未经核对的单价。

只在Tabelog启用第三词；TableCheck检索路径未变。B的query-controls/vacancy-response、两站身份/页面解析、地址电话规则、排序、Browser执行器、Domain/Core、A既有eval/harness、前端、ADR、State/TaskDefinition与所有Prompt/共享Schema均原字节不变。准备分支获准新增的两个评测文件与86e1dd9d逐字相同；没有修改Gold、评分口径或G2。

## 红绿和实际检查

有效红灯e412eab7：普通HTTP真实Interpreter/Compiler/Router/Reducer/PGlite与生产来源组合，只有模型/Google/BrowserSession I/O为构造fixture；隐藏直链，原名和合法片段空，旧代码实际NO_VERIFIED_RESULT，与PRESENT_RESULTS目标断言不符。[红灯](red-http.log)。接线后实际PRESENT_RESULTS，原名→片段→日文的导航及一个ja Details请求可见。

Google预算/缓存/失败不重试/跨run隔离，Tabelog第5名额/未用退还/原已HIGH零额外请求，及同电话但地址冲突不接纳的行为控制均通过。HTTP新增B1按钮断言仍红，原10组按钮正反例保持，未删/skip/反转断言。

| 检查 | 结果 |
| --- | --- |
| typecheck / arch / build | PASS |
| npm test | **1263/1265，FAIL**；同一新增japanese-name子用例及父用例计2失败 |
| Chromium fixture | 186/186 PASS，130.599秒 |
| 严格G2 | 5/5测试、12/12页PASS |
| 37家模拟 + 4份独立复跑 | 原23/23及focus3/3保留；错认0 |
| 生产Tabelog身份前缀同语料 | 原23/23及focus3/3保留；错认0 |
| 输入完整性 | d17ee4bc 1571项、f9941f1e最终1674项首尾一致 |

[门禁原件](final-gates.json)：10步前后git status均空，无restore。默认套件失败原样保留；只继续了相互独立的build/Chromium/G2与只读清单检查，最终状态仍FAIL，不设绿灯例外。沙箱拒绝本地listen的开发尝试单列green-http-dev.log，不算有效红灯或绿灯；之后宿主fixture运行正常。

## 分母与独立核验

两种模式各37主视图为22正确接纳、15未评，另4个复跑全4正确；原23=19个主视图既有接纳+4复跑，focus3=nr010/022/026。没有把15未评当作未接纳、网络通过或改善率；未捕获输入、历史网络失败和缺页均保留原因。

模拟仅调用现有生产解析/排序/身份；补充生产TabelogBrowserAvailability真实检索循环回放以避免仅测模拟。生产前缀只评分身份，后续日历/库存未评，不是完整Live。两边接纳的26个视图均另用严格域名/路径、认证ID和实际读取原文SHA独立核对，不能只凭生产HIGH自证。Gold只在事后评分/文档核验进程读取，不入检索、排序或Prompt。[模拟评分](evaluation.json)、[生产前缀评分](product-evaluation.json)、[独立核验](product-independent-verification.json)、[逐家查询/首屏/详情表](per-store.md)。

生产观察脚本在缺页提前停止时，把无最终诊断的所有非原名查询粗标为FRAGMENT；原件未改。独立[来源原文补核](product-query-source-audit.json)用实际Google原件/原片段响应确认第三词的JAPANESE来源，身份成绩和检索行为未改。37家新的泛化、当前可达性和库存均未测试。

## 阻断1：既有来源标记使B1按钮拒绝

实际HTTP产物：先TableCheck失败、再Tabelog提供HIGH同店19:00空位，结果已PRESENT_RESULTS；但check.sourceProvider为AVAILABILITY_SOURCE_RESOLVER，和已核对Tabelog原链接的provider不符，B1按合同拒绝，按钮0。实际原始链路、原evidence provider及Google计数见[诊断](attribution-diagnostic.json)。

来源resolver、B1读取器和交接校验与已发布main逐字一致，Router只改内部runId传递，支持这是旧来源归属路径的缺口；未在独立原main副本重跑该场景，不夸大验证范围。[源码对照](attribution-source-comparison.json)。拟修仅在usable(check)分支给成功check补 `sourceProvider: provider.provider`，[一行提案](source-provider-proposal.patch)。

**尚未应用。** 本批用户明确“不动查位、响应绑定”，已通过异步问题请求这一行窄授权，尚未收到答复。没有因为已知改法而越过范围，也没有以局部G4绿灯代替该真实HTTP按钮链路。

## 阻断2：完整精确GET清单有来源依赖

已物化8个来源观察到的详情URL及其首屏SHA；网站GET上限14/共享260，当前实花244，16余额。8已知详情+Beef首屏1+Beef详情最多5=14，数量足够；T认证店在日文结果排6，剩余第5名额不会读到，仍保留为错认控制，不改排序。未捕获的T片段提议仍标未评。

**Beef的同ID Google日文原名尚无保存原件，日文首屏也未读取。** 因此不能离线给出它的精确搜索URL和后续详情URL，不能把Gold日文名倒灌检索，不能用null/模板冒充最终物化清单。用户同时要求“完整精确清单”和“复核前任何真实请求0”，这两项在现有材料下存在先后依赖。[清单状态](request-plan.json)明确NOT_EXECUTABLE。

最小收敛提案：先单独复核已精确物化的[1次Google请求](google-request-for-review.json)（网站0/模型0），获批后只读取该同ID名称并冻结原文SHA，再物化含Beef日文首屏的网站清单交复核；首屏产生的详情链接再冻结后续清单。现在没有执行任何一步。[8个已知URL及依赖说明](request-review.md)。

## 交付与停止

原承诺是第二步五门禁全绿并交最终精确GET清单；实际仅检索/身份离线证据闭环，默认门禁因未获授权的B1来源标记修复仍红，Beef清单未完整物化。**不得称第二步完成或已具备实测许可。** 先等用户决定一行窄授权和来源依赖的分阶段复核，才可继续；不追加真实调用、不推main。

共享账本原486条逐条原样保留，追加1条零调用记录，GET上限按既有批准由257调到260；累计仍模型171/Google11/GET244/Live0。STATUS、DEVLOG、TEST-LOG及月度摘要/索引已同步。仅推本工作分支并ls-remote核对，随后停止，不合main。
