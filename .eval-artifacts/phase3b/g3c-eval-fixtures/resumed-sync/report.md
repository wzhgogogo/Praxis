# G3c 评测 fixture 同步：原 13 项已关闭，完整门禁仍 FAIL

2026-10-29，维也纳 CET（UTC+1）。**四文件同步完成 / 待复核 / NOT INTEGRATED**。

工作分支 `codex/chore-phase3b-g3c-eval-fixtures`。原始起点 `51b0d3de`；先前停止点 `cf20522e` 的报告、日志与评价原样保留在父目录。本轮已同步 B 的 `8c66921aa09f4c020732e3bea3d3241383e25689`，其产品等时戳修复为 `80797d48`；A 的最终可执行候选冻结于 **`7b602ce9`**。相对 B，源码差异严格限于用户指定的四文件。

原完整默认红灯 **1217/1230、13 个 Node 失败**（12 叶加一个父测试）现全部 PASS；正式默认测试 **1231/1231**（分母增加的 1 项是 B 的领域回归，A 没有增删测试）。严格 G2 **5/5、12/12 页面 PASS**。但是完整 Chromium **178/180**，剩余两个失败在授权范围外的第五个文件，故**不能交付五门禁全绿，也不合 main**。

## 红灯、产品前置修复与绿灯

1. 原始红灯在未修四文件上由 `c74845c5` 冻结，完整日志和 SHA 见父目录 [初次报告](../report.md)、[red-npm-test.log.gz](../red-npm-test.log.gz)。原始评价与失败没有覆盖或重新标注。
2. B 交接产品修复后，A 先只读核对 `read-assessment.ts` 差异与隔离红绿证据，再合入 B 工作提交。此时 A 只有初次 Source2 purpose 草稿，三文件实际组合仍 **65/77**，12 失败；先前新增的等时戳 Tabelog 引用失败已消失。[实际日志](after-b-fix.log.gz)。
3. native fixture 原本的 `text` 已写明 `Omakase course` 等公开课程，但 HTML 没有相应文字。只把这些**已有同页可见行**同步成 `<p>`，没有新增语句、改库存或填 State。native 文件全部 **60/60**。[日志](native-visible-course.log.gz)。
4. 共用来源/三个显式事实脚本同步后，三文件 **77/77**；未改的工厂控制 **9/9**，含错分店、错人数、404、缺页、时间与同店入口复用。[组合日志](fact-investigation.log.gz)、[工厂控制](factory-regressions.log.gz)。
5. 在 `7b602ce9` 冻结 703 项输入后跑完整矩阵；原始 12 个叶失败及父测试逐名核对均 PASS，见 [resolved-reds.json](resolved-reds.json)。全量默认结果覆盖原红灯与迟到、取消、预算等控制，未用删测、skip、todo 或翻转业务结论取得绿灯。

## purpose 合同与脚本序列

- `restaurant_source_facts` 严格使用 **Prompt 2 / Schema 2**。返回只含 `selections`；每项只有当前请求 statements 中的完整 `firstStatementId`、`lastStatementId`、`role`、`priceStatementId`。本地单行菜单按完整语句选取；当前无价格的课程返回空价格 ID，若有公开价格则只选原文行 ID。模型不输出金额、URL、身份或库存；评论角色不选，裸店名不作为课程。
- Source2 在所有四个 scripted model 的 Agent 分支之前返回；来源请求不 shift Agent 动作。现有 FactJudgment 仍独立核对 HARD，补充的 omakase 替身只从实际 `sourceDocuments` 选择完整课程行和其文档 ID，既不把店名当菜单，也不手填中间证据。
- deadline 正常控制现在还明确断言只有 `restaurant_agent_decide` 可以进入动作消费。WP-A 仍只记录一个故意超时，其他合法 Source2 调用不再记为异常；共享模型总数和原 50 次上限照旧累计。

S=SEARCH_RESTAURANTS，I=INVESTIGATE_CANDIDATE_FACTS，C=CHECK_AVAILABILITY，P=PRESENT_RESULTS。

| 脚本 | 原序列 | 新序列 | 原因 |
|---|---|---|---|
| FixedCurrentCaseModel 的 H001 | S→C→P | **S→I→C→P** | 退休私有菜单捷径后，通过真实事实端口读取同店公开菜单，取得原文及引用判断。 |
| EXPLICIT_TWO_OMAKASE_PLAN | S→C→P | **S→I→C→P** | 对原先选定的两家显式调查；权威请求数量 2、展示数量和独立验收不变。 |
| 固定来源正常 deadline 控制 | S→C→P | **S→I→C→P** | Source2/FactJudgment 单独分流，不再误消费下一动作；100 秒语义用时后首个 S 的余额仍严格断言 **400,000 ms**。 |
| H001NativeModel | 根据原 Context 选择原合法动作 | **不变** | 仅新增 Source2 分支及输入 HTML/text 一致性；全部原测试体/断言原字节不变。 |
| TwoTurnStrengthUpgradeModel | 原两轮正常/缺证序列 | **不变** | Source2 不消费下一轮动作；缺当前 HARD 证据时仍禁止复用旧展示。 |
| H002–H005、新素食午餐及注册控制 | 原脚本 | **不变** | 保留原语义、结果数、HARD/排除及非合格结论。 |

**唯一旧 assert 调整如实单列：** H001 的 fixture 私有 Google Details 记账由 0 改为 3，记录新 I 动作实际读取三家 Details。该变化不是业务输出、Gold、独立期望或生产预算的放宽。所有业务结果断言保持；源工厂库存读取仍为 3 次。其余原测试体（扣除这一记账行）、迟到/取消/预算反例保持原字节，验证见 [preservation.json](preservation.json)。不能把本轮描述为“所有 assert 调用零差异”。

## 来源 fixture 与原页依据

全部是**本地构造 fixture**，不是网站回放，也不是本次网站访问。只借用已保存页面的公开结构；合成店名、地址、电话、菜单和库存仍来自原 scenario 的独立来源字段，不复制真实参考店事实给合成店。

| 改动 | 已保存真实页与 SHA-256 | 具体边界 |
|---|---|---|
| native 同页 HTML 补已有课程行；共用预约页补公开 H1/地址/电话 | `src/harness/browser/fixtures/dom-change/tablecheck-detail-nakamata.html.gz`，压缩 `b4da6b830ee448fc5130034c4834d4e1ad8d66309448d160902c3df47d845f30`；HTML `6b7e758fb3135f057a3aec19cf844971b24fc8cb65a7b34cd72decf70dc7eba0` | 原页公开 H1、地址/电话、课程段落共存。native 只把原先 text 已有内容补到 HTML；共用预约页用 **TableCheck 自己的字段**，不从 Google 补匹配身份。 |
| 菜单/价格写为公开原文，去掉 featured-menu 作为事实前提 | `src/harness/browser/fixtures/restaurant-prices/tablecheck-recorded-menu.html`，`2a625d0641b5b2824170a4a263c9ac68aac3017057b14afac84cdefd327f1f68` | Alaska 保存菜单片段证明课程/金额公开可见；它不是完整身份页。原 `inventory.menuText` 未改，仅公开呈现，不以 class 产生事实。 |
| Tabelog 既有原文按 Source2 完整编号处理 | `src/harness/browser/fixtures/restaurant-prices/ginza-sushi-sendou.html`，`34e82a5f3a2e882f261bf6e42cb54e5e75d0318e6a02b32c8d6047e76074057d` | 公开课程/报价文字是结构参考；未复制该真实店报价或调整 Tabelog 库存、HARD 期望。 |

三个页面的采集来源、文件 SHA 和角色见 [source-provenance.json](source-provenance.json) 及各原页旁 provenance。

共用工厂另有两个明确输入同步：

1. 没有配置独立官网文档的 scenario，其**构造的 Google Details** 返回工厂早已存在的公开预约入口作为 `websiteUri`。该 URL 与原身份 guide 的 Book a table href 相同；不是模型编 URL，也不由店名拼 slug。Search 响应不改，其他已有官网材料仍走原路径。这个构造关系不证明现实 Google 当前返回该链接。
2. 同一预约入口没有日期/人数 query 时，只呈现已绑定身份和原菜单，不放时段或空位组件；有完整 query 后才沿原库存路径读取。缺一个参数或日期/人数不符仍 UNKNOWN/coverage gap。原日期、人数、时段、可用/不可用数据未改，也没有重置任何计数。

**身份 guide 的菜单原文没有新增。** 不能通过在 guide 上补造课程恢复旧三动作正例；事实调查实际打开上述独立的公开菜单页。所有 Source2 输出仍由代码做同店、同页、完整编号/引用和金额核对。

## 正式矩阵与第五文件阻断

| 检查 | 结果 | 整命令耗时 |
|---|---|---:|
| typecheck | PASS | 0.483 s |
| arch:check | PASS | 0.174 s |
| npm test | **1231/1231 PASS** | 29.968 s |
| build | PASS | 0.500 s |
| test:browser:fixture | **178/180 FAIL** | 129.715 s |
| PRAXIS_G2_REQUIRE_PASS=1 test:dom-change | **5/5 PASS；12/12 页面 PASS** | 24.960 s |

每项前后 git status 为空，703 项输入 SHA 均未变，无恢复已提交文件；完整脚本与逐项日志/原始日志 SHA 见 [run-gates.py](run-gates.py)、[gates/gates.json](gates/gates.json)、[inputs-sha256.json](inputs-sha256.json)。本轮不重试这两个已知失败，更不修改范围外文件。

两条失败均位于 **`src/harness/browser/browser-read-request-binding.test.ts:374`**：

- `native dynamic Tabelog AVAILABLE reaches formal H001 presentation with page-owned query evidence`
- `native dynamic Tabelog UNAVAILABLE reaches formal H001 TableCheck continuation and no verified result with page-owned query evidence`

实际断言是 `matchReasons.includes("Verified HARD criterion from source: omakase")`。Node 打印的 Date target 表达式与实际栈行错位，不能因此报告为日期控件失败；这两条中位于 374 行之后的断言未到达。

该文件 SHA **`e5fdcf5de861498b47c0984569cf3d82d300012ce3b9b5893cd3e91d0e1b035d`**，与 B 的基线对照和本分支相同。B 在原 `51b0d3de` 及仅换产品修复的隔离 clone 中已经得到相同 0/2；本轮复用其未变输入证据并在完整套件复现同两项。见 [extra-browser-failures.json](extra-browser-failures.json) 与 B 的 `15-equal-timestamp-evidence/browser-baseline/receipt.json`。这属于**额外 fixture/旧实现断言审查**，需要复核者安排第五文件范围；当前不删、不放宽，也不把 178/180 写成绿灯。

## 实际组合、独立评价和停止

另外在同一冻结候选保存两个实际 native 执行及独立评价：[native-proof/](native-proof/)。Tabelog 首批和 TableCheck 第二批控制均 **2/2 PASS**；两份独立 `REQUIRED_EVIDENCE=SATISFIED`、`taskProducedQualifiedResult=YES`。没有手填 State、Evidence 或评价。

固定来源五个业务控制的现结果见 [business-controls.json](business-controls.json)：H001–H004 保持独立合格 YES；H005 保持 NO、NO_VERIFIED_RESULT 与冻结旧验收 FAIL，没有把未知改成 PASS。迟到/取消/预算反例均在全量默认中通过。

这是 fixture 模型与本地构造来源的组合验证，只证明选定受控路径和引用接线，不证明真实模型选句质量或当前网站/库存。两份独立评价的 S0 仍 **NOT_EVALUATED**，不宣称真实 S0=0；网络/Live 边界没有运行。G2 的 TableCheck 日历仍是原本无可绑定时段的未知控制；本轮不冒充已验收 TableCheck 有时段日历/G3b，仍待首次 Live 保存材料。

A 相对 B 没有改生产、站点、Pack、Guard、Prompt/Schema/State、Gold、评分器、独立期望、来源 scenario 原文、库存值或生产预算/截止。全局 STATUS/历史与共享账本均保留 B 原字节，本次记录只在本报告目录，符合仅四文件限制。

新增真实模型、Google、网站、评测 GET、Live 均 **0**；未加载 `.env`。仅推工作分支供复核、通知 B，**不合 main**。原 13 项已关闭；整体交付仍因第五文件两项失败而停止，等待复核安排。
