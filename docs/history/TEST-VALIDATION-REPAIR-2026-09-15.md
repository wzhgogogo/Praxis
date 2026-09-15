# 2026-09-15 验证缺陷修复与红色业务回归

- Status: current executable development regression / local full-suite pass；不是Clean Baseline或Live验收。
- 范围：先修测试与Eval，捕捉当前执行错误；经用户随后授权，修复测试揭示的共享Restaurant执行路径。Prompt和H001–H005输入不变。
- 基线：HEAD fd0dfb0 加既有未提交工作区；保留其他窗口改动。本轮不提交、不推送、不运行真实模型或Live。
- 依据：[2026-09-14联合审查](../../.eval-artifacts/adr0025-review-2026-09-14/ARCHITECTURE-REVIEW.md)。本文件记录可执行测试的归属与本轮结果，不替代Test Skill的唯一矩阵。

## 初始捕获（后续已修复）

| 执行契约 | 正式测试位置 | 实际结果 |
|---|---|---|
| 独立候选的检查跨批累计，同范围不重复 | hybrid-read-composition.test.ts：independent candidate reads… | 4候选，3+1、逐个、倒序三种合法调查均复现重复读取/STEP_LIMIT；Reducer现合并先前`factChecks`，修复后对照与固定种子场景均通过 |
| 已明确请求更新不能被旧运行覆盖 | 同文件：a request update after cancelling… | 取消中的旧读取后提交第二份显式语义提案；固定semantic event id曾被Runtime去重；现以semantic revision构造唯一事件，revision、日期和人数已更新 |
| 同一批来源事实须区分满足和明确冲突 | 同文件：real source observations distinguish… | 两个真实Details样本分别为cafe和hot-pot；只有cafe展示，hot-pot保留candidate-bound冲突；正常对照通过 |
| Google额度只限制其自身来源，不提前挡住合法浏览器路径 | 同文件：Google fact exhaustion… | 额度100对照实际到达浏览器；额度1故障注入曾在外层`NO_PROGRESS`；现在逐候选验证fact和availability的合法动作，浏览器可达 |
| B的官网观察不能改变A的Google检查含义 | 同文件：a website observation… | 真实Google/官网证据生产与Reducer组合曾错误展示A；现按候选绑定的evidence来源决定fact scope，B有效而A保持UNKNOWN |
| slot未知不抹去独立取得的身份/事实 | read-grounding.test.ts：an unknown slot… | Domain曾丢失独立身份/事实；现在保留这些evidence且仍无Offer或空位结论 |
| 无结果必须与证据、执行和范围一致 | diagnostic-evaluator.test.ts | 旧错误预期已替换；Evaluator现以观察→候选/请求→引用→结论的lineage评估，正反例通过 |

前五项从真实Hybrid初始化、语义输入出发，经过真实内部Compiler/Runtime/Context/Validator/Router/Grounding；只替换模型传输、Google HTTP和浏览器页面。没有注入中途State或合格Evidence。slot未知项是局部Domain规则测试，不能当作网站读取E2E。脚本模型不证明真实模型会选好路径，合成网页不是Replay或Live。

默认`npm test`已包含这些回归，没有skip、todo或额外隔离入口。初始本机listener环境为320项、310通过、10失败，明确记录了共享执行缺陷；用户授权修复后，最终本机listener环境为325/325通过，0 failed、0 skip/todo。

## Eval修复

Evaluator和诊断Rubric分别升级到`@11`。不修改H001的期望来换取通过。

- 删除“保留合格Offer却断言无结果通过”的旧预期。
- 现有独立候选评估检查当前引用可支持的结果；能确认有合格候选时，无结果声明为NOT_SATISFIED，不调用生产read-assessment。
- 缺实际执行、缺范围、只有空对象或旧请求记录，保持NOT_EVALUATED。
- 发现范围矛盾、未完成Loop或范围外的当前检查/Offer，判NOT_SATISFIED。
- 只有本次适用的已执行空发现、零候选与END_READ范围一致时，可确认该限定空结果；仍不证明搜索穷尽。
- 一般候选调查仅有remainingGaps文案，无法独立证明调查充分或没有合格结果时，明确未评估，不伪造通过。
- Web取消artifact测试改用当前Evaluator版本常量校验接线；语义预期继续由独立样本断言，不由版本常量决定。

历史只做离线补评、不重跑来源：09-08成功artifact的展示证据仍充分，但缺旧artifact的target.goal记录，使整体评价仍未评估；对照本轮修改前`@9`得到相同结论。09-14失败artifact仍NOT_SUPPORTED，同样与`@9`一致。本轮没有把历史成功改成新的失败，也没有填补旧artifact来伪造通过。

## 实际验证与产物

本地目录：`.eval-artifacts/test-contract-repair-2026-09-15/`。

- `evaluator-before.log`：新正确预期在旧Evaluator上的失败记录；最终Evaluator与Hybrid定向命令为65/65。
- `focused-final.log`：执行红色回归及Evaluator验证；最终全量结果以`npm-test-final-complete.log`为准。
- `npm-test.log`含沙箱listen EPERM，不用于产品归因；在允许本机监听环境完成全量验证。
- `npm-test-listener.log`、`npm-test-final.log`是中途检查，另捕获尚未同步的Web版本字面量，已修正；不当作最终状态。
- `historical-evaluations.json`、`historical-comparison.json`：历史artifact新补评路径及修改前后对照，原artifact未改。
- `npm run typecheck`、`npm run arch:check`、`npm run build`和`git diff --check`通过。未操作浏览器控件实现，未重跑Chromium本地Fixture；未运行模型、真实网站、数据库部署或Web Live。

首次混合来源测试样本用HTTP404，实际触发整个批次异常，未到达官网证据生产者；此前`execution-regressions-before.log`的该项属于样本未命中目标，不作为来源串扰证据。最终改用合法HTTP响应中的不完整Place Details：实际经过A的UNKNOWN接纳及B的官网读取，再在错误展示A的断言失败。保留此记录，避免把测试自身失败冒充产品根因。

## 后续范围及尚未覆盖

经用户授权后的本切片已修复上述共享执行缺陷，保持原断言和正常对照；没有通过提高步数/额度、减少候选、固定行动顺序或放宽事实标准换绿。后续仅在出现新的独立失败行为时扩展现有入口，不为每层复制测试体系。

本轮没有完成：Prompt与当前开发Gold口径收敛、地名变体解析、完整事实/缺口Context、真实模型加固定来源诊断、一般无结果的完整证据及充分性评分、最终代码Live/Web Live。它们仍是后续验收范围；不能由本轮离线测试和本机套件通过推出“五个case已经通过”或“以后Live不会出新问题”。

执行回归先挡住已知确定性故障；通过后再在既有授权范围内安排适用时段的模型/Live验证。测试规则已在现有Test/Eval Skill中补充先失败后修复、正常对照、分批/顺序与来源隔离、明确未评估，不另建测试平台。

## 五类共同契约的组合防线补充

本节是同一 `current executable development regression / local full-suite pass` 切片的覆盖报告。初始防线阶段未修改业务执行；随后只修复该防线揭示的共享执行路径。Prompt和H001–H005输入不变；所有来源、模型和时钟都保持离线替身边界。

| 契约 | 独立预期来自哪里 | 主覆盖 | 无法由离线断言自动判断 |
|---|---|---|---|
| 需求保真 | 两份显式、不同的语义提案及其日期/人数；不读取最终 `eligible` 或终态 | `hybrid-read-composition.test.ts` 的 request update、时钟推进 refresh；`diagnostic-evaluator.test.ts` 的 `AUTHORITATIVE_CONDITIONS` | 自由文本改写是否语义等价、真实模型是否忠于开放表达 |
| 状态累计 | 独立 Google 来源行的候选集合、每行实际 Details 读取和独立批次计划 | 同文件的 zero/one/exact-batch 对照、跨批/顺序红色回归、固定种子探索 | 未被样本表示的 Provider 并发/持久化恢复组合 |
| 证据归属 | 候选、来源、请求、时效均在独立 artifact/HTTP 样本中明确；UNKNOWN 没有正向证据 | 真实Details的cafe成功/hot-pot明确冲突对照、混合 Google→官网回归及 Eval M03–M06 | 真实网页自由文本是否真的表达某一菜系/营业语义 |
| 行动可达 | Google 额度、浏览器访问和取消信号是独立的外部边界观察，不从生产 action 清单生成下一步 | Google 耗尽仍可到浏览器的红色回归、读取中取消、合法 refresh 对照 | 真实模型会否选择所有合法动作，真实网站会否接受操作 |
| 完成与停止 | 实际轨迹的 `stepOutcome: EXECUTED`、候选范围和来源记录；不信任完成标签、调用数或模型自述 | `diagnostic-evaluator.test.ts` 的 M07/M08、限定空发现对照、内部失败区分 | 一般调查是否已经充分、搜索是否穷尽、主观排序质量 |

组合生成固定种子为 `0x5eedc0de`，每轮固定生成八个候选数/批次/顺序场景。失败输出保留完整生成序列、实际 action/Details 轨迹，并按候选数、批次和顺序缩减；当前最短复现为两个候选、批次大小一、正序。它验证独立读取的顺序等价，不把 refresh、取消或冲突检查错误地当作可交换操作。

### 有限变异辨别力

实现变异在 `/tmp/praxis-contract-mutant-*` 的完整 `src` 副本中执行，正常副本先运行同一通过的 Hybrid 对照；副本随后删除，不触碰工作区。artifact 变异均从 `structuredClone` 的合成公开样本开始，既不覆写历史 execution artifact，也不读取生产 `eligible`/`canEndRead`。

| 变异 | 被拦截的位置 | 对照 |
|---|---|---|
| M01 删除已明确人数 | 隔离副本中 compiler 静默忽略 `PARTY_SIZE`；Hybrid 条件保真对照失败 | 正常 Hybrid 条件对照通过 |
| M02 丢弃上一批 fact-check | 隔离副本 reducer 删除对既有`state.factChecks`的继承；跨批/顺序完整对照命中具名的同范围重复读取断言 | 正常跨批对照通过 |
| M03 交换两家候选的引用 | Eval 拒绝把 A 的引用当 B 的支持 | 合格单候选 artifact 通过 |
| M04 候选范围的空位证据丢失候选ID | 删除候选范围的availability evidence候选ID；证据归属为 `NOT_EVALUATED`，不再可宣称支持 | 合格单候选 artifact 通过 |
| M05 UNKNOWN 改为无位 | 从无Offer、无负向evidence的UNKNOWN开始改为UNAVAILABLE；完成结论为`NOT_SATISFIED` | 原始UNKNOWN artifact按其范围通过 |
| M06 保留过期 evidence | presentation 时效冲突，`NOT_SATISFIED` | 新鲜 artifact 通过 |
| M07 只留完成标签而没有实际执行 | 删除所有实际轨迹后，展示引用没有可关联的`EXECUTED` observation；`REQUIRED_EVIDENCE`及`FINAL_CLAIM`均为`NOT_SATISFIED` | 有 `EXECUTED` 的 artifact 通过 |
| M08 仍有合格候选却提前 END_READ | completion outcome 为 `NOT_SATISFIED` | 限定零候选 END_READ 对照通过 |

Evaluator 不再把提议、拒绝或任意完成标签算作外部读取；实际 `stepOutcome: EXECUTED` 的观察必须关联到同一候选、当前请求范围和展示引用，search观察也可在确有事实证据时支持推荐。缺记录保持 `NOT_EVALUATED`，不会被伪装成“调查充分”，也不强制经过某种固定读取动作。

### 初始捕获的业务红色（均已修复）

- Reducer合并跨批`factChecks`，固定种子已缩减并验证两候选、批次大小一、正序的原最短复现。
- `NO_PROGRESS`判断逐候选校验fact及availability动作，Google额度耗尽不再挡住合法浏览器读取。
- Reducer从候选绑定的evidence决定来源范围，B的网站观察不再复活A的UNKNOWN Google事实。
- semantic和evaluation-location事件以revision构造唯一ID，读取中取消后的显式日期/人数更新不再被Runtime去重；第二次语义输入使用独立evaluation location绑定。这是需求保真修复，不涉及模型或样本放宽。
- UNKNOWN slot路径保留已经独立匹配的身份/事实evidence，却不产生Offer或空位结论。

这些回归现由默认`npm test`持续执行，没有`skip`、`todo`、反向断言或测试入口排除。真实模型理解、自由文本语义、当前网站 DOM/兼容性、实时库存、完整调查充分性与搜索穷尽均仍未由本轮离线测试证明。


## 后续口径对齐 — 2026-09-15

上文“未修改Prompt/H001–H005”描述本报告原测试防线切片。后续另按用户授权完成[当前只读验收契约](../../src/eval/restaurant/agent-loop/cases/README.md)的Gold/产品口径对齐，五条用户原文不变；新数据集为restaurant-read-development@2，旧输入/Rubric原样归档。此后续不重写本报告的历史测试或Live结果，剩余端到端缺口仍以STATUS为准。
