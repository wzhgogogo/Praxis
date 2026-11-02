# 运行诊断报告：停止点 2

- 状态：停止点2实现、离线报告与五门禁已完成，待独立复核；不合 main。五例首点原始一致率2/5，全部分歧保留并解释，不能宣称五例全一致。A独立评测器的实际红灯对接仍未完成，按本轮决定延期。
- 实施与正式验证时间：2026-11-02 CET（UTC+1）。最终执行源码：`5e490a6921120a2557b65ccec7e9132411ff8a33`；门禁07:29–07:32 CET。之后只整理证据和文档，不再修改源码。
- 基线：停止点1 `c46b7583`，包含 main `efeab254`。执行依据为用户本轮复核决定，摘录保存在 [review-decisions.md](stop2/review-decisions.md)。停止点1原件/草案保留，不覆盖为新结论。
- 证据模式：已暴露历史开发产物的只读离线诊断、受控测试及本地Chromium；不是Clean Baseline、真实来源兼容性或真实模型质量签收。
- 本批只定位和度量；真实模型/Google/网站/Live/见证请求为0，不读取 `.env` 或 labels.yaml，不重执行历史运行，不修改原始产物、Gold、见证、Prompt、State、产品或 A 文件。

## 已落实的链路

新代码仅 `src/eval/restaurant/diagnosis/`。读取原始记录和已经保存的评价，输出不可覆盖 JSON+Markdown；原 outcome、severity、execution 深拷贝原样保留。所有指标 gateEffect=NONE。三栏和合格交付首点特例严格按本轮复核规则；系统原因码只列原始观察。

`evaluateArtifactAfterFinish` 只加 import 和保存评价后的调用（成功与已保存评价异常各一处），不动任何判断。报告失败独立 sidecar，不污染已有评价；已有评价失败则报告未评，不编造结果类型。批量入口只读冻结文件并生成汇总，人工对照只由 `compare-recorded.ts` 读取，生成器不导入比较模块。

主线新增范围外仅两项获批配置：现有 productionJudgment 禁入范围扩到 diagnosis；npm test 原 glob 后追加新目录。无新检查框架或组件例外。

## 关键行为与检错

| 失效类型 | 实际入口 | 对照/证据 |
| --- | --- | --- |
| 评价后无自动诊断 | 真实 evaluateArtifactAfterFinish→实际 Evaluator→保存评价→报告 | 修复前目标断言失败：[before-hook.json](stop2/before-hook.json)，正常评价已保存，诊断数0；修后同一断言通过 |
| 保存报告改变原判定/原件或覆盖历史 | diagnosis.test.ts 自动钩子、不可覆盖/异常对照 | 实际评价/原件逐字不变；EEXIST 不覆盖，独立 diagnosis.failed；评价异常输出 null verdict与原异常码 |
| 合格交付的推测误升首点、覆盖与因果混用 | 真实保存的h001/h004/神乐坂评价→buildRunDiagnosis | 三栏独立；合格无确认偏离保持无确认偏离；推测永远HYPOTHESIS；无可评信息首点未评。另有blocker-only反例：全部环节已有观察，只保留blocker，修前误报2条确认覆盖缺口→修后0条，推测仍保留 |
| 多回合空记录被自建规则判失败 | 主线已保存 C/A 正反产物→节点与引用 | 到达和判定分开；C核验只挂在相同原件SHA；缺A独立结论保持未评 |
| 测试 A 样例冒充 grader、错run/旧artifact接纳 | TEST_INTERFACE_SAMPLE 接口样例 | 必须显式测试开关且标识保留，生产文件入口不开放该开关；错误SHA/来源拒绝 |
| 用户已给日期仍追问 | 独立冻结体验Gold＋真实评价读取受控记录 | 多余1；不追问正常0；不动原severity/outcome |
| 缺日期却无问无来源出现日期 | 同上，完整before/after与requiredMissing Gold | 缺失1；正常提问且不擅自填值0；缺Gold未评 |
| 非最近被展示、无证据仍排通过 | 独立100m/500m来源记录与明确排序目标 | 错选/倒序偏离，最近正常通过；距离缺失未评；near my office不等于nearest |
| 缺时钟/脱敏URL编造耗时 | 成对session边界、模型区间、真实时间消息对照 | 区间并集，不双算；无完整URL/时刻未评；冻结业务钟不报回复0；四组历史时间逐一≤2秒 |
| 分母/首点重复、未知次数当0 | 同例重复、真实Evaluator中断分类、计划缺席对照 | 单run单首点，中断不进能力分母；未知追问总数为null；每格保留ID和版本 |
| 新目录直接值导入生产判断 | 原 arch:check 在临时隔离工作树 | [guard-control/results.json](stop2/guard-control/results.json)：旧规则漏拦exit0，修后目标文件/模块拒绝exit1，纯类型及正常控制exit0，副本已移除 |

对应测试入口为 [diagnosis.test.ts](../../../src/eval/restaurant/diagnosis/diagnosis.test.ts)：自动钩子26行、三栏59行、多回合89行、四组时间104行、A接口114行、追问135行、排序151行、时钟161行、不可覆盖178行、评价异常199行、汇总211行、禁入225行。定向12/12，最终默认套件也包含这12项，没有skip/todo。正常与反例均调用实际报告构建；需要评价的受控记录调用真实离线Evaluator，A接口样例明确不充当grader。

两份额外检错记录：[blocker-only-red.json](stop2/blocker-only-red.json)／[green](stop2/blocker-only-green.json)。红灯是具体业务断言 `blocker hypotheses must not become confirmed coverage gaps` 的2≠0，不是模块加载或运行报错。覆盖栏修后仅引用已有 `NOT_FOUND`、`NOT_READ`、明确空读取列表或未展示字段，绝不从blocker推导；feasible须为SUPPORTED，因果确定性仍为HYPOTHESIS。历史评价没有被改写；测试内篡改是独立副本，保留测试专用来源标签。

开发中汇总测试曾用不完整 TIMEOUT 中断样本被真实 Evaluator 判未评，已修正为有效 SIGTERM 记录；未改生产或评价规则，也不把该样本错误计作检错成功。最后仅把新输出路径改为仓库相对路径，正常批次读写对照见 [portable-links-green.json](stop2/portable-links-green.json)，避免将本机工作区地址作为复核读取路径。

## 冻结、正式执行与输出

实现及 [primary-inputs.json](stop2/primary-inputs.json)、[multiturn-inputs.json](stop2/multiturn-inputs.json)、[comparison-oracle.json](stop2/comparison-oracle.json)均先提交后执行。请求原文引用与独立 C 核验的SHA适用关系见 [input-provenance.json](stop2/input-provenance.json)。生成器及自动钩子不读取比较oracle；只有 `compare-recorded.ts` 读取人工归类。labels.yaml不在输入清单内。

第一组已生成输出原件保留在stop2的primary-reports、multiturn-reports、calibration目录；执行源码09a1aacf，回执 [calibration-execution.json](stop2/calibration-execution.json)。之后收紧上述覆盖引用并改善汇总展示，最终输出另存attempt-2，没有覆盖第一组。`final-code-and-inputs-freeze.json`为已提交但未运行的中间冻结；最终使用 [verified-code-and-inputs-freeze.json](stop2/verified-code-and-inputs-freeze.json)，854项源码/配置/权威规则/输入，其中51份历史来源文件原SHA不变。没有重执行历史运行或历史Evaluator；受控测试使用实际离线Evaluator。

| 已完成输出 | 证据 |
| --- | --- |
| 5份历史单次JSON+Markdown及跨运行汇总 | [主汇总](stop2/attempt-2/primary-reports/summary.md)、[JSON](stop2/attempt-2/primary-reports/summary.json)，每格附运行ID，同例横排并保留评测器/Gold版本分层 |
| 逐次首点、确定性与时间比较 | [校准](stop2/attempt-2/calibration/comparison.md)、[完整JSON](stop2/attempt-2/calibration/comparison.json) |
| 8份主线多回合正反产物的节点报告 | [多回合汇总](stop2/attempt-2/multiturn-reports/summary.md)、[JSON](stop2/attempt-2/multiturn-reports/summary.json) |
| 原件与判定保持、引用定位 | [output-integrity.json](stop2/attempt-2/output-integrity.json)：13份、545个自产引用可定位；5份已有评价的outcome/severity/execution均深相等；51历史来源SHA不变 |
| 每条实际命令、开始/结束CET、净树与冻结检查 | [execution.json](stop2/attempt-2/execution.json)，三条生成/比对与五门禁均exit0 |

批量入口实跑命令（输出目录必须不存在；重复执行须另取目录）：

```bash
node --import tsx src/eval/restaurant/diagnosis/files.ts .eval-artifacts/phase3b/run-diagnosis-report-20261102/stop2/primary-inputs.json .eval-artifacts/phase3b/run-diagnosis-report-20261102/stop2/attempt-2/primary-reports
node --import tsx src/eval/restaurant/diagnosis/files.ts .eval-artifacts/phase3b/run-diagnosis-report-20261102/stop2/multiturn-inputs.json .eval-artifacts/phase3b/run-diagnosis-report-20261102/stop2/attempt-2/multiturn-reports
node --import tsx src/eval/restaurant/diagnosis/compare-recorded.ts .eval-artifacts/phase3b/run-diagnosis-report-20261102/stop2/attempt-2/primary-reports/summary.json .eval-artifacts/phase3b/run-diagnosis-report-20261102/stop2/comparison-oracle.json .eval-artifacts/phase3b/run-diagnosis-report-20261102/stop2/attempt-2/calibration
```

## 五例校准及全部分歧

原始环节一致率 **2/5（40%）**，没有将已解释分歧从分母删除，也没有按运行ID修改诊断规则。

| 运行 | 人工首点 | 最终报告首点 | 结果与依据 |
| --- | --- | --- | --- |
| kf-h001 | 无卡点、已交付 | 无确认偏离 | 一致。QUALIFIED_DELIVERY且无确认偏离，旧FACTS blocker仅在次要推测栏 |
| kf-h002 | 发现 | 无确认偏离 | 分歧，旧人工覆盖归类与新首点定义不同：现有评价为合格交付，无确认偏离；三家见证feasible均NOT_EVALUATED。按已批准规则不能将发现覆盖升为首点，原NOT_FOUND仍展示 |
| kf-h004 | 语义 | 理解请求／CONFIRMED | 环节一致；旧评测器保留R1合格结果与已确认条件偏离，两者照搬 |
| Kagurazaka | 查位读取 | 发现／CONFIRMED覆盖观察 | 分歧，已归因到评测器见证匹配；不归为诊断规则错误，不从分母扣除 |
| Nakameguro | 发现，其次查位 | 无确认偏离 | 与h002同类口径分歧：已有合格交付、无确认偏离，见证feasible均NOT_EVALUATED；保留旧覆盖观察和人工归类，不宣称该人工分类在新首点定义下成立 |

两条新旧口径分歧的依据是本轮明确的QUALIFIED_DELIVERY首点规则，并非“模型说完成”。神乐坂的归因来自复核确认且绑定原artifact SHA的证据：`tablecheck:konya` / Chiso Konya已在候选，库存UNKNOWN；评价漏斗却是Chisou Konya / NOT_FOUND。原件字段指针、字面值和SHA在 [比较oracle](stop2/comparison-oracle.json)与 [comparison.json](stop2/attempt-2/calibration/comparison.json)；比较器仅验证这份复核证据并附归因，诊断生成器不知道该运行ID或店名。本批不修名称/地址登记、不放宽匹配。

人工首点资料没有逐次给确定性标签，5条确定性比较均NOT_EVALUATED，单独列出，不伪造确定性一致率。神乐坂没有合格展示，证据齐全/展示时间保持未评，不拿别的阶段补值。

| 用例 | 自动证据观察齐全→服务端展示（秒） | 人工（秒） | 对照 |
| --- | --- | --- | --- |
| h001 | 99.285→127.987 | 99→128 | 两点均≤2秒 |
| h002 | 122.051→148.895 | 122→149 | 两点均≤2秒 |
| h004 | 292.402→304.149 | 292→304 | 两点均≤2秒 |
| Nakameguro | 208.105→247.079 | 208→247 | 两点均≤2秒 |

8个时间点全部满足2秒对照，无超差项。h001的权威接纳事件126.681秒另列，绝不冒充99.285秒的来源观察。当前边界只是run start代理到最终已引用且获既有评价支持的来源观察/服务端投影，不能证明实际用户发送、屏幕渲染，或所有未展示候选中的全局最早合格时刻。

## 多回合与体验证明范围

8份原件合起来覆盖选店、B1交接、条款、追问取页和作答，均带可定位引用；每份到哪一步见output-integrity。正/反原件的节点判断均为未评，不因空对象、NO_BOUND_PAGE或系统原因码自建失败规则。C已存的原文/绑定核验只挂在SHA完全匹配的terms-admitted原件，未提升为通用逐环节PASS。A接口样例必须显式TEST_INTERFACE_SAMPLE、同artifact SHA且测试开关开启，文件生产入口不会打开该开关；它仅证明接口读取。

多回合8份是受控产物投影，不是8次已评分能力运行。原件无startedAt/finishedAt，汇总started/finished为0条**有该字段的记录**，不代表没有发生执行；classification/scorable/capability均为0。主校准5例的计划/收到/启动/完成/可评分/能力纳入各5，中断0；中断排除能力分母另由真实Evaluator受控中断测试验证。完整历史22例仍只保留原冻结清单，不擅自扩增本轮校准范围。

追问Gold、真实消息时间缺失时未评；未知总数为null，部分可观察计数与完整总数分开。体验正反对照为：已给日期再问1／不再问0，缺日期却无来源填值1／正常提问0，最近展示100米通过／500米或倒序偏离，距离缺失未评，无排序要求（near my office）NOT_APPLICABLE。排序只在冻结比较集合及有来源的可比值上核对。所有体验结果只报告，gateEffect=NONE。

页面navigate时长明确是含浏览器处理的来源操作代理；模型、其他操作按已记录区间分别列且不保证可加，Google纯等待无边界时未评。重复加载时长占比须有完整URL范围和成对边界；只有计数不补时长。当前冻结业务时钟不用于每轮用户等待；测试中真实标记的wall-time消息对照300ms仅证明读取与关联。

## 五门禁与检错执行

| 实际命令 | 结果 | 日志 |
| --- | --- | --- |
| `npm run typecheck` | exit0，0.601秒 | [完整压缩日志](stop2/attempt-2/typecheck.log.gz) |
| `npm run arch:check` | exit0，0.275秒 | [完整压缩日志](stop2/attempt-2/arch-check.log.gz) |
| `npm test` | 1339通过、0失败/跳过/todo；34.709秒 | [完整压缩日志](stop2/attempt-2/npm-test.log.gz) |
| `npm run build` | exit0，0.565秒 | [完整压缩日志](stop2/attempt-2/build.log.gz) |
| `npm run test:browser:fixture` | 187通过、0失败/跳过/todo；外层142.201秒，Runner141.898秒 | [完整压缩日志](stop2/attempt-2/browser-fixture.log.gz) |

每项开始和结束status均为空、HEAD均为5e490a69、854项冻结SHA逐项不变，详见execution.json。五门禁各执行一次，没有通过过滤/重试/豁免取得绿色。门禁期间不修改实现或输入；之后只补文档与证据。gzip日志保存原始字节，回执同时记录压缩和解压SHA。

架构反例使用临时隔离工作树，实际 `npm run arch:check`：旧范围漏拦exit0；新增diagnosis值导入 `domains/restaurant/read-assessment.ts` 后拒绝exit1且精确匹配文件/模块；真正type-only导入及删除probe后的正常控制均exit0。原目标日志和规则SHA见guard-control/results.json，副本已清理。没有新增规则框架或白名单。

钩子修前红灯、blocker-only红灯、架构目标拒绝与各自绿色对照证明断言会区分错误；普通运行错误和不完整样本不计为检错成功。

## 未完成对接与证明范围

A G6真实独立评测器尚未对接；B1/条款/取页红灯首点验收按用户决定延期，本批不得宣布该项已完成。接口样例只证明读取，正常/反例原产物只证明报告能观察到节点；没有独立判断一律未评。真实用户消息时钟、结构化提问和B1投影的G6 Runner记录由A负责；缺字段/Gold的历史记录保持未评。本批不修神乐坂别名，不升级/重跑评测器，不做主观推荐评分或新增体验门槛。
