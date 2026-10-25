# F3 对话 A：实施与停止报告

状态：**STOPPED FOR REVIEW，行数目标未完成**。2026-10-26T00:45:22.535185+01:00（维也纳 CET，UTC+1）。全部离线；没有新增真实模型、Google、餐厅网站、Live 或环境重跑调用。

测试卫生完成；11 个批准范围均逐项审查：L7、L10 完成原地等价去重，另九项因缺少已存在的等价观察延期。实际 **3864 → 3847，净减17**；目标≤3591，仍高 **256**。source-packs.ts **473** 未增，站点 Skill 不计。没有把代码迁到 Pack/通用层，没有删核验或降低断言。

原 line-plan.json 的实际 ID 为 L1–L8、L9a、L9b、L10 共11条，没有L11。本报告保留原编号。306行是输入中的估算，不能当作已实现减少；本次不修改目标、Gold 或合格口径来宣布完成。

## 分批结果

| 范围 | 处理 | 估算减行 | 实减 | 批前→批后站点行数 | Pack |
| --- | --- | ---: | ---: | --- | ---: |
| L1 | 替代证据不足，延期 | 38 | 0 | 3864→3864 | 473 |
| L2 | 替代证据不足，延期 | 52 | 0 | 3864→3864 | 473 |
| L3 | 替代证据不足，延期 | 8 | 0 | 3864→3864 | 473 |
| L4 | 替代证据不足，延期 | 23 | 0 | 3864→3864 | 473 |
| L5 | 替代证据不足，延期 | 55 | 0 | 3864→3864 | 473 |
| L6 | 替代证据不足，延期 | 24 | 0 | 3864→3864 | 473 |
| L7 | 原地等价去重 | 13 | 2 | 3864→3862 | 473 |
| L8 | 替代证据不足，延期 | 15 | 0 | 3862→3862 | 473 |
| L9a | 替代证据不足，延期 | 14 | 0 | 3862→3862 | 473 |
| L9b | 替代证据不足，延期 | 10 | 0 | 3862→3862 | 473 |
| L10 | 原地等价去重 | 54 | 15 | 3862→3847 | 473 |

逐项范围/原因/未运行状态见 [results.json](results.json)、[延期报告](line-eligibility/report.md) 和 [deferrals.json](line-eligibility/deferrals.json)。已冻结7组最小同页对照，证明退役区分信号会使不同契约状态失去区分；不把这些对照当成 Live 能力或新观察已存在的证据。L9a/b 仍有确定性 SELECT 调用，现有控件契约/shortcut 入参不足以零成本替代。L5 的 REGION 能力边界补充在 [clarifications](l10/deferral-clarifications.json)。

## 已完成切片与五门禁

| 切片 | 分支 | 红灯/源码 | 已核对并推送的 main 集成 SHA |
| --- | --- | --- | --- |
| H0 时序卫生 | codex/fix-phase3a-prime-f3-timing-hygiene | 2ce0eb6a 有效红灯；a84c0922 新main组合 | e92f1cfe397391b8906074e718a1012e08a1c865 |
| L7 日期/人数表单 | codex/chore-phase3a-prime-f3-l7 | c041b234 红灯；458c6cb6 实现 | f1879040daaa5c8832f2da0dde5bbdf1ff8abe96 |
| L10 菜单scope | codex/chore-phase3a-prime-f3-l10 | 1f3f881d 红灯；dbabf096 实现 | 9993a9a5f26216f0a6d0950f9e5316e683775fe9 |

| 切片 | typecheck | arch:check | 默认测试 | build | 真实本地Chromium，4路 |
| --- | --- | --- | --- | --- | --- |
| H0 合入并行main后 | PASS | PASS | 1060/1060 | PASS | 161/161，106.433秒 |
| L7 | PASS | PASS | 1060/1060 | PASS | 161/161，106.290秒 |
| L10 | PASS | PASS | 1060/1060 | PASS | 161/161，106.473秒 |

每个门禁前后 git status --porcelain 都为空，exit0，无skip、无E1例外，运行前后冻结输入相同。没有用局部测试替代五门禁。每批一轮；不同源码的样本不混算三次中位数。Linux 本批 NOT_RUN，不外推平台结果。冻结与脚本哈希、逐门耗时、完整日志分别见 [H0](timing-hygiene/rebased-main/report.md)、[L7](l7/report.md)、[L10](l10/report.md)。

L7 红灯去掉 option/value 一致性核验；L10 红灯把标题前缀误认成菜单容器，均真实 AssertionError。新最小字面反例各一条，原全部断言保留。same outlet/query/HARD/价格/餐期/日期人数绑定的既有整链路回归完整运行通过。没有新增历史整包 fixture。

## 测试卫生

清单覆盖113个测试文件中的58个时序声明/共享helper候选，逐条保留原因或处理措施：[逐项表](timing-disposition.md)、[SDK与外层时限补充](timing-sdk-supplement.json)。新main再扫描无增删、无机制变化：[inventory diff](l7/timing-inventory-diff.json)。

OPEN_LINK 正常控制保留6.5秒真实慢导航，给30秒正常预算；超时控制使用注入时钟并在实际openLink端口断言精确剩余5秒。BrowserTaskExecutor的15/10/40ms生命周期控制用虚拟时钟，source acquisition成本用逻辑时钟；仅观察/SDK等待拓宽余量。保留健康slow-last-snapshot精确时序、队列/节奏最小间隔和超时负例。五种故障均有有效红灯（原窗口、剩余导航预算、候选截止、来源获取成本、worker Guard），原无效准备尝试明确标记未计入证据。

E1用例主体相对并行main保持原样；B已批准的脚本类型/预检实现随main继承。A没有改Guard，也没有把E1的fetch+xhr fixture补丁重新带回。H0仅改9份测试，L7/L10仅改原TableCheck parser与其测试。四个B生产文件、Pack、Prompt、产品Schema都没有A源码变化；逐字边界见各批boundaries.json。

## 计数与输入证据

统一 count-adapter-lines.py 用非测试 TS 物理 splitlines，显式排除fixtures；新CLI只允许选择Git ref，公式未变。L7/L10各自保存逐文件数和SHA。L10运行逐字相同的计数脚本副本，避免覆盖原历史统计；根adapter-lines.json已还原保留原字节。站点文档不算代码减少。

原审核材料逐字副本与来源commit/SHA见inputs/provenance.json。评测式最小对照、变异脚本、测试输入与门禁外层脚本在运行前提交冻结，各批freeze.json和before-execution.json可追溯；这是暴露的开发回归，不是Clean Holdout或Live验收。

## 停止、延期与后续

九条依照用户“证据不足延期”处理。继续按原估算删除会丢失现有状态/归属或确定性字段路径；补建新的Browser观察、改变接口/Schema或删除当前正例会扩大范围。保持目标3591，报告未达并停下等复核；需要新的可执行替代证据/减行切片，不在本轮擅自补建通用层或放宽核验。

另外一处范围外静态发现：当前Live Runner的reviewedReadsPath位于src/.../cases/reviewed-public-reads.json，退出后评价器仍把该引用交给仅允许.eval-artifacts的insideArtifacts。按代码推导会fail closed为INVALID_ARTIFACT_REFERENCE/NOT_EVALUATED，未执行新Live或运行探针，未声称观测到S0。见out-of-scope-static-followup.json；另列接线跟进，本批未改eval非测试实现。

实现已分批推送并用ls-remote核对上表SHA。总报告本身是随后单独文档提交，最终交付main SHA见Git外的integration.local.json与本轮答复，避免自引用；该文档提交没有改变已验证源码。
