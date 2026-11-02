# 运行诊断报告：停止点 2

- 状态：实现与定向对照已完成，待冻结后正式生成校准/多回合报告及五门禁；不合 main。
- 基线：停止点1 `c46b7583`，包含 main `efeab254`。执行依据为用户本轮复核决定，摘录保存在 [review-decisions.md](stop2/review-decisions.md)。停止点1原件/草案保留，不覆盖为新结论。
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
| 合格交付的推测误升首点、覆盖与因果混用 | 真实保存的h001/h004/神乐坂评价→buildRunDiagnosis | 三栏独立；合格无确认偏离保持无确认偏离；推测永远HYPOTHESIS；无可评信息首点未评 |
| 多回合空记录被自建规则判失败 | 主线已保存 C/A 正反产物→节点与引用 | 到达和判定分开；C核验只挂在相同原件SHA；缺A独立结论保持未评 |
| 测试 A 样例冒充 grader、错run/旧artifact接纳 | TEST_INTERFACE_SAMPLE 接口样例 | 必须显式测试开关且标识保留，生产文件入口不开放该开关；错误SHA/来源拒绝 |
| 用户已给日期仍追问 | 独立冻结体验Gold＋真实评价读取受控记录 | 多余1；不追问正常0；不动原severity/outcome |
| 缺日期却无问无来源出现日期 | 同上，完整before/after与requiredMissing Gold | 缺失1；正常提问且不擅自填值0；缺Gold未评 |
| 非最近被展示、无证据仍排通过 | 独立100m/500m来源记录与明确排序目标 | 错选/倒序偏离，最近正常通过；距离缺失未评；near my office不等于nearest |
| 缺时钟/脱敏URL编造耗时 | 成对session边界、模型区间、真实时间消息对照 | 区间并集，不双算；无完整URL/时刻未评；冻结业务钟不报回复0；四组历史时间逐一≤2秒 |
| 分母/首点重复、未知次数当0 | 同例重复、真实Evaluator中断分类、计划缺席对照 | 单run单首点，中断不进能力分母；未知追问总数为null；每格保留ID和版本 |
| 新目录直接值导入生产判断 | 原 arch:check 在临时隔离工作树 | [guard-control/results.json](stop2/guard-control/results.json)：旧规则漏拦exit0，修后目标文件/模块拒绝exit1，纯类型及正常控制exit0，副本已移除 |

定向对照目前12/12，typecheck/arch通过；这些是开发检查，不替代冻结后的五门禁。开发中汇总测试曾用不完整 TIMEOUT 中断样本被真实 Evaluator 判未评，已修正为有效 SIGTERM 记录；未改生产或评价规则，也不把该样本错误计作检错成功。

## 冻结和正式执行计划

先提交本实现及 [primary-inputs.json](stop2/primary-inputs.json)、[multiturn-inputs.json](stop2/multiturn-inputs.json)、[comparison-oracle.json](stop2/comparison-oracle.json)；请求原文引用与独立 C 核验的SHA适用关系见 [input-provenance.json](stop2/input-provenance.json)。输入或实现若有修正，另存新输出，不覆盖上一轮。

1. 只读5份原始result及带见证上下文的既有E1评价，生成每run的JSON/Markdown及跨run汇总。
2. 独立比较入口读取人工对照，列一致率、全部环节和确定性分歧及四组时间。神乐坂只把复核确认的匹配缺陷附在比较记录中，生成器没有店名/运行ID特例。
3. 读取8份主线已有多回合正反产物，输出节点到达/未评和证据。C独立核验的AArtifactSHA256须与原件完全相同，不能推广为G6逐环节grade。
4. 源码冻结、净树顺序执行 typecheck、arch:check、npm test、build、test:browser:fixture，保存各项前后status/HEAD/SHA与原始日志。没有相关改动时不重复已通过检查。

## 未完成对接与证明范围

A G6真实独立评测器尚未对接；B1/条款/取页红灯首点验收按用户决定延期，本批不得宣布该项已完成。接口样例只证明读取，正常/反例原产物只证明报告能观察到节点；没有独立判断一律未评。真实用户消息时钟、结构化提问和B1投影的G6 Runner记录由A负责；缺字段/Gold的历史记录保持未评。本批不修神乐坂别名，不升级/重跑评测器，不做主观推荐评分或新增体验门槛。
