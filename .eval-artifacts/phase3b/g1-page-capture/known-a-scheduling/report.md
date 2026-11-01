# G1页面获取修复交付：A调度测试已知失败单列

2026-11-01T08:11:56.774193+01:00，维也纳CET（UTC+1）。**用户已明确批准按本报告交付工作分支、通知A，不合main；不授权B修改A调度测试。** 这是[此前归属停止报告](../report.md)之后的当前交付记录，原失败及原报告完整保留。

分支 `codex/fix-phase3b-g1-page-capture`，受测候选 **bf65a67a59978974fe9dd90757f6935fed216238**；G1产品仍是847359b3的唯一文件修改，和6162c128相比没有产品、测试或scripts变化。最终归档提交与推送SHA见本回合Git回执/对A通知；报告归档后再核对冻结与净树。

## main与B的独立对照（预先固定各5次）

| 来源 | Git SHA | 整个测试文件通过/失败 | 目标用例通过/失败 |
|---|---|---|---|
| main | 6db445ea9afdbe5debdc60efc1107f768434c555 | 5/5通过，0失败 | 5/5通过，0失败 |
| B | 6162c128ab2ffccfd7121ef8c63f21fc70384d8d | 5/5通过，0失败 | 5/5通过，0失败 |

交替执行main1、B1…main5、B5，独立Node进程；每次运行整个文件的两条原测试，合计20条测试，没有name/skip过滤、跳过、取消或todo。命令：

```text
node --import ./scripts/test-filesystem-guard.mjs --import tsx --test --test-reporter=spec src/harness/browser-fixture-scheduling.test.ts
```

测试、三份实际执行脚本、package/lock/tsconfig/.gitignore共9份输入，两引用逐字节相同，执行后再次校验；同Node **v24.4.1**，同一个物理node_modules。稀疏副本中 **src/integrations目录不存在**，G1产品代码没有被materialize或导入；只保留本测试和其执行闭包。B未修改该文件、同步控制、worker、外层脚本或任何原断言。[预冻结9文件SHA及引用](reference-freeze.json)、[逐次结果与日志SHA](standalone/results.json)。

**本轮单跑未复现此前完整套件中的失败。** 该结果不证明问题已经修复，也不能报告“main单跑失败”；代码闭包相同且不含G1读取逻辑，排除了该产品模块的直接参与。完整套件下的触发条件和同步根因仍交A调查。

## “A归属、与本次改动无关的已知失败”

按用户明确分类单列：`browser-fixture-scheduling.test.ts:109`，用例“browser outer guard identifies unfinished files and retains buffered output”。此前789bfc02完整默认门禁 **1287/1288**，唯一失败为未完成a-held记录的lastObservedTests未包含a-held lifecycle step。[原始完整失败日志](../gates-stopped/npm-test.log)、[原矩阵FAIL收据](../gates-stopped/gates.json)保留原字节，不能被单跑或本轮通过覆盖。

用户确认该测试归A（09ce7536随超时诊断加入），明确禁止B修改；A负责后续修复。本报告保留失败事实，既不删除/放宽断言，也不把该旧失败改成PASS。不把“触发条件未复现”称作已根治。

## 完整门禁与严格G2（没有排除A测试）

| 检查 | 本轮结果 | 秒 |
|---|---|---:|
| typecheck | PASS | 0.455 |
| arch:check | PASS | 0.187 |
| npm test | **1288/1288，本轮PASS** | 30.626 |
| build | PASS | 0.563 |
| test:browser:fixture | **187/187**，G2独占1，其余并发4 | 130.351 |
| PRAXIS_G2_REQUIRE_PASS=1 npm run test:dom-change | **5/5测试、12/12页面PASS** | 24.468 |
| 旧HARD回归 | **44,197字节逐字节相同** | 0.127 |

七项执行前后净树，冻结输入728项SHA一致；完整npm test包括A测试，不设任何过滤。外层只允许用户明确分类的同名唯一失败在原结果仍FAIL的前提下继续其它检查；任何新失败仍停止。本轮allGatesPassedThisRun=true，历史A已知失败继续开放。[完整原始矩阵/命令](verification/gates.json)、[逐页G2](strict-pages.json)。旧HARD SHA `9a3298bc5e004b99e41d80713e8913b68c336cfa594f6eb60599e310ee3fb633`。[字节检查](verification/hard-bytes.log)。

这次完整重验是按用户追加指令在诊断后预先安排的一轮，不是遇红反复重试到绿；原唯一失败不改写。

## G1修复范围与因果证据复用

唯一非测试产品变化仍是`google-then-website-facts.ts`：显式capturePagesOnly时经已有网站reader读页面，独立于原搜索HARD/营业/商业缺口；两处组合层HARD判断在捕获时不执行。无标志时行为不变，Native Tabelog/TC原捕获逻辑不改。同店、run、Guard、独立预算、取消与原State/TaskDefinition/Prompt/Schema全部保留。[唯一产品diff](../product.diff)、[保护SHA](../preservation.json)。

A27cf175c原P4，五个评测/fixture输入原字节不变，仅替换这个产品文件：红灯NO_BOUND_PAGE、问答模型0次 → 绿灯ANSWERED、问答模型1次，逐字引用“A private room is available for groups of four or more.”，URL和读取时间由原链路绑定，保留至少4人的适用条件，不补造HARD或预载手写bound page。[红灯](../red/receipt.json)、[绿灯](../green/receipt.json)。后续没有产品改动，复用已有因果绿灯，不重跑或消耗真实模型。

Google/Tabelog/TableCheck、新旧run、同名异店、NOT_STATED、预算/取消的原组件绿灯114/114；真实Chromium Guard正反2/2（checkout在独立HTTP接收器0请求，合法merchant可回答），旧测试和断言保持。[组件结果](../controls-green/receipt.json)。这些均是fixture传输或本地Chromium，不是当前网站验证。Live/真实模型质量和独立Live S0仍NOT_EVALUATED，不从门禁推导S0=0。

## 冻结、账本与交接

本轮冻结SHA **e4777e576c073bff789dada42495cdde4558549f215578851565e56750696b95**，外层脚本SHA **a923fe576e1b69d67bc52abd16c90f1f95560ab59a6ead23db2413cc37962159**，先提交后执行。[冻结](input-freeze-reviewed-gates.json)。原728输入/既有输出完整性也保持；先前停止报告按当时事实保留，不作为本次授权后的发布状态。

账本保留502条原值，新增本次0调用条目为503条；额度和累计值不变。真实模型/Google/餐厅网站/Live/公开GET/环境重跑新增**全0**，不读取.env或QA参考答案。[追加凭据](ledger-append.json)。

按用户明确要求推B工作分支、ls-remote核对并通知A分支/提交和已知调度失败；**不合main**。A修调度测试，B不再扩展范围。
