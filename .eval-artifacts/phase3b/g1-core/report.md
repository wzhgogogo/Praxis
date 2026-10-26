# 3b 对话B／批次1／停止点1

- 报告时间：2026-10-26T23:13:06.300619+01:00（Vienna CET，UTC+1）
- 状态：**本批完成，停在停止点1，等独立复核与用户批准ADR。ADR仍Proposed；不合main；G3未开始。**
- 分支：`codex/feat-phase3b-g1-core`；起点main/tag签收提交`cc12732020256f22e1827bf62fb4b66ccc3cb0ba`。最终五门禁测试提交：`d4be4a7a71e0caac65b6979a397d5106dc0eecbf`。报告/账本/历史收尾提交仅改变文档和证据；交付分支tip以Git与推送回执为准。
- 模式：离线Fixture模型/BrowserSession控制；完整既有本地真实Chromium门禁。不是Live、真实模型质量评测或已接入Web的G1产品能力。

## 交付与切片核对

1. [ADR-0047草案](../../../docs/decisions/0047-observation-driven-sites-and-cited-questions.md)：同一ADR写观察驱动原则和G1合同，因为两者共用当前可观察证据/身份/原文核对边界。状态Proposed。并行A工作树已有0046草稿，因此B使用0047，不覆盖A文件，也不采用其Accepted标记；编号/两稿统一留复核。
2. [观察依赖清单](observation-inventory.md)：F3原38项全部保留映射，扩展52组、26文件；32组Agent接手、16组安全/证据保留、4组数据绑定+结构变化告警。原始搜索173处/16文件，另人工审阅HTML正则、响应和选中状态等遗漏。每组有当前锚点与文件SHA；不是52处已修，也不是grep命中等于违规。G2 DOM改版是验收方法，其正式规格/Gold归A。本批未实施G2/G3，也未实现结构变化告警。
3. 未接入口G1核心：`model-page-question.ts`收已展示店ID/入口URL、问题、run与已绑定页面；缓存优先，缺缓存可注入**原有**事实reader读取。Native/官网reader只加可选页面hook；同店仍经既有身份代码确认。原生原文分段原样提取，旧HARD判断复用同一个完整statement选择函数，Prompt14/output4行为不改。
4. 抽取式问答：模型仅选已有文档/完整原文，不能返回自由答案、URL、时间或状态写入。代码核对同店/HIGH身份、当前run/时间/来源、规范化空白后的整段原文，输出引用与其实际URL/读取时间。敏感问题只转述原文并加“请向餐厅确认”；本核心对全部问题采用这一形式，不另造敏感分类器。没写返回“页面未说明”+查过页面；截断内容不能推未说明，无法核实与未说明分开。接待方式从明确原文读取，三个接待方式与库存无关。
5. 新独立模型目的`restaurant_page_question`、局部提示/输出初始版本1只用于该未接入口核心；不递增或接入Agent Prompt、语义Prompt、State/TaskDefinition或Browser动作Schema。没有第二套抓取、身份解析或独立预算。没有改任一A/C归属源码、fixture、Runner、Guard、两站parser/query-controls、Pack。实际收集hook尚未安装生产工厂，因此不能声称主链已有G1快照缓存。
6. 新测试仅B模块内，使用最小内联构造及**原地只读**既有2026-10-19 Aloft商家片段与其provenance/SHA；未复制历史运行。保存片段的人工已绑定envelope明确标记，单独只证明原文字面核对。身份正反例另由真正的现有reader/身份逻辑驱动（BrowserSession是离线fixture）。

## 红灯与绿灯

| 检查 | 有效红灯 | 绿灯 |
|---|---|---|
| 非请求条件信用卡追问 | `0cbe826f`旧HARD-only链路返回[]；预期原文引用断言失败，1/1 fail；[原始日志](red.log)、[冻结](red-inputs/freeze.json) | 新核心经既有官网reader→身份→fixture选择→引用核对，原信用卡引用oracle保留；原criteria仍空 |
| 幻引/同名分店/未说明/敏感是非 | 冻结外层控制分别移除引用、HIGH身份与额外自由输出检查，三个控制都AssertionError/exit1；[最终控制](results/controls-final/controls.json) | 30个G1测试（含子测试）全绿，反例拒绝或有界页面未说明；[G1日志](results/phase3b-g1-core-final-green.log) |
| 引用与异步缓存元数据同次绑定 | `95a95b50`核心在模型等待中被调用方更新缓存，原引用错误配上other-branch URL；1/1 fail；[原始红灯](cache-binding-red.log)、[冻结](cache-binding-inputs/freeze.json) | 模型调用前复制本次所选页面，回包不能借用后来URL/时间；同一断言全绿。该核心尚无产品入口，未向用户展示错误信息 |
| 旧事实行为 | 原生reader原文分段导出/改名以外逐字相同；旧source selection拒绝条件保留 | 有/无hook的Native结果evidence/factChecks/documents完全一致；旧事实回归及G1合计64/64；[相关日志](results/phase3b-g1-facts-final.log) |

引用核对的独立依据是构造页面的原文/地址冲突和保存片段原字节SHA，不把模型或生产eligibility当独立oracle。相关性、跨段语义充分性和“页面未说明”的真实模型准确率未测，不从fixture推导质量通过。

## 五门禁（最终冻结提交）

测试对象`d4be4a7a71e0caac65b6979a397d5106dc0eecbf`，macOS-26.6.2-arm64-arm-64bit，Node v24.4.1，Chromium文件并发4；每项前后`git status --porcelain`均为空，restore=0，失败/跳过/取消均0。完整机器记录：[gates.json](results/gates-final/gates.json)。

| 门禁 | 结果 | 耗时／日志 |
|---|---|---|
| typecheck | PASS | 0.444秒；[typecheck-1.log](results/gates-final/typecheck-1.log) |
| arch:check | PASS | 0.188秒；[arch-check-1.log](results/gates-final/arch-check-1.log) |
| npm test | PASS，1130/1130 | 27.265秒；[npm-test-1.log](results/gates-final/npm-test-1.log) |
| build | PASS | 0.414秒；[build-1.log](results/gates-final/build-1.log) |
| test:browser:fixture | PASS，162/162 | 98.130秒；[browser-fixture-1.log](results/gates-final/browser-fixture-1.log) |

Chromium最终单次98.130秒；本批不要求三样本耗时评价，不把单次叫三次中位数。Linux本批NOT_RUN。此前a041f038完整1129/162全绿保存在[首次完整门禁](results/gates-before-cache-binding/gates.json)，不能代替最终1130/162结果。
外层脚本最初一次typecheck已PASS，但随后打印旧summary变量触发NameError，其余门禁未开始：[未完成记录](results/gates-aborted/gates.json)。脚本修复并另存冻结，未覆盖或算绿。缓存关联修复后再次完整重跑五门禁；无例外放行。

## 冻结与可复现

- 最终[输入清单](final-inputs/freeze.json)：614文件，SHA-256 `8db5be07848697ac3f560dc27bd124551842e920c12eef7b52c584705cf18014`；运行前随修复提交冻结，运行结束及mutation恢复后逐文件复核不变。此前红灯/初始绿灯清单原样保留。
- [外层五门禁脚本](run-gates.py)：SHA-256 `6e08a59053e812d2f5101eafe46c2b53e44712ff1c080745b3e14b93b478077c`；严格检查每门禁前后净树，日志写仓库外，完成后归档。
- [反事实控制脚本](verify-core-controls.py)：SHA-256 `de8bbee677152a6631c69f58b0e59e9c2b9c505bba5601e3c854e32e73639b54`；最终提交上三控制都有效红，源码原字节恢复、复核SHA与净树后重跑G1全绿。早期控制另存，不覆盖。
- 命令：`python3 .eval-artifacts/phase3b/g1-core/run-gates.py --freeze .eval-artifacts/phase3b/g1-core/final-inputs/freeze.json --output <仓库外新目录>`；用当前Node及已安装本地Chromium；不加载.env。

## 模式、评价边界与额度

| 层 | 本批结果／边界 |
|---|---|
| 端到端 | G1离线核心从reader到答案通过；完整Agent/Web产品流程NOT_RUN，真实模型/Live NOT_RUN，没有产品交付率分母 |
| 逐环节 | 实际既有身份代码拒绝同名异址；当前run/缓存/原文/URL时间关联、未说明与拒绝、接待方式等通过；模型仅fixture接线，相关性质量未评价 |
| 严重程度 | 构造的幻引、错店、敏感是非被拒；同次缓存错配在未接入口核心中由独立原文URL断言发现并关闭。没有新实际外部执行或用户展示，不宣称Live S0=0 |
| 归因 | 旧HARD门槛无法接收任意问题；三个移除核对的反事实控制有效；缓存错配先红后绿。没有把来源失败、未知或未测改为能力通过 |

- 新增真实模型 **0**；Google **0**；餐厅网站 **0**；完整Live **0**；环境重跑 **0**；评测公开GET **0**。本地fixture传输与门禁不计真实调用。未读取/暂存.env。
- [共享预算账本](../budget.json)总额度18 Live／1000模型／4环境重跑／40评测GET。A/C开始时快照条目按id原样并集、原字节副本SHA保留，B只追加自己的两个0增量条目；没有覆盖他人行。A的publicGET与C的evaluationPublicGET是同一40额度，汇总只计一次，不增设40+40。账本为本分支所见快照，后续合并按id并集，异内容同id须停，不覆盖其他对话进展。

## 行数、移交与停止

- [count-adapter-lines.py结果](adapter-lines.json)：两站非测试TS物理行仍 **3,847**，`source-packs.ts`单列 **473**；本批增量均0。≤3,591目标仍未达成，归G3；没有挪代码充数。
- 已同步STATUS、DEVLOG、TEST-LOG、月度摘要/索引及Capability Matrix的draft边界。
- 待复核：ADR0047及与A草稿编号/内容统一；用户批准后才接Agent合法动作/Prompt/Web并启动G3。G2规格和fixture/评测归A；身份/具名店G4归C；共享版本先安排顺序。
- G1未来接线仍需权威选店/current-run/cache、允许页面（不开放搜索或评论追读）、原有Guard/共享预算、时间元数据的实际展示，以及真实模型/真实来源独立验证。本批不以未接入口核心完成这些承诺。
- 停止原因：本批完成（停止点1）。按授权只推送`codex/feat-phase3b-g1-core`供复核；**不合入或推送main**。
