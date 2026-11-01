# 评测与集成入口组装门禁：停止点 1

- 时间：2026-11-01 CET（维也纳，UTC+1）。
- 状态：`draft / not integrated`；分类和能力核心名单待独立复核，门禁尚未实施。
- 分支：`codex/chore-eval-assembly-gate`；盘点基线：`main@6db445ea9afdbe5debdc60efc1107f768434c555`。
- 已从远端取得最新 main，在独立工作树建分支；原工作区的未提交资料未移动、覆盖或暂存。
- 模式：仅离线静态盘点。模型、Google、网站、Live、见证 GET 均 0；未读取或暂存 `.env`。Git 同步和交付不计业务网络访问。

## 当前切片与判定方法

本切片交付可逐项复核的入口清单、实际调用路径、绕过步骤和现有架构检查机制结论；推送本报告后停止。停止点 2 的规则、白名单、红绿实验、Test Skill 改动及五门禁均未开始。没有修改产品、测试或评测源码，也没有替 A 补各能力的整组装测试。

读取路径为 INDEX → Repository Conventions → Arch Guard → STATUS，再按本切片读取 Planning、Test、Eval、Post-change。Evaluator 本身在本批不变：评分器需要独立于被评分的生产判断，不能为了“经过组装”而改为调用生产判断作为 oracle。

盘点覆盖 `src/eval/**` 的 142 个 TypeScript 文件（98 个非测试文件、44 个测试文件）及唯一的非 TS 执行模块 `post-body-audit.mjs`，逐一筛出可启动 Runner、程序化执行入口和评分入口。默认测试边界按 `package.json#scripts.test` 的实际 glob 展开，共 111 个文件；不把目录名 `integrations`、变量名 `composition`、fixture ID `integration:*`、输入文件名 `e2e-cases.yaml` 当作测试的集成声明。另检查测试标题、文件名和行为说明注释；混合文件按入口区分，不能因文件导入过 factory 就整文件判为组装通过。

“经过”指实际路径调用 `createLiveReadAssembly` 并使用其返回的能力；只导入 factory、调用 `createHybridReadComposition`，或先注入已经完成身份绑定的页面，都不算。静态调用核对不是本次重新执行的链路证据，以下“是”不意味着这些场景本次已跑绿。

分类用三个原始类别：**组件评测**、**应走组装但没走**、**其他**。经过组装的整单/阶段入口归为“其他：已走组装”，不强塞进前两类。组件仍可保留，但不能用于其绕过步骤的能力签收。

下表路径缩写均相对 `src/eval/restaurant/`：`AL/` = `agent-loop/`，`R/` = `agent-loop/runners/`，`S/` = `semantic/`，`Q/` = `fact-qa/`，`SF/` = `search-fixture/`，`D/` = `dom-change/`。行号均属于上述冻结 main。

## Runner 与 CLI 逐项清单

| 文件与入口 | 经过组装 | 直接能力/实际路径及被绕过的步骤 | 分类与不能证明的范围 |
| --- | --- | --- | --- |
| `R/run-hybrid-live-read.ts:212,346`：`runHybridLiveRead` / `runHybridReadDiagnostic` | 是 | `:474 createLiveReadAssembly` → `:486 createHybridReadComposition` → 实际 Interpreter/Runtime/Agent/Router；模型、Google、浏览器由边界注入 | 其他：已走组装。`:22` 的 `GooglePlacesRestaurantSearch` 仅用于类型，见下文导入清理事项 |
| `R/run-current-development-fixed-source-model.ts:71`：整单固定来源 CLI | 是（间接） | `executeFixedSourceCase` → `createCurrentDevelopmentFixedSources` → factory；后续真实 Hybrid 执行、Evaluator、acceptance | 其他：已走组装；不证明真实模型质量或当前网站 |
| `R/run-native-fixed-source-model.ts:169`：native 固定来源 CLI | 是 | factory → Hybrid；构造的是 Google transport 和固定 browser，而非替换业务读取 | 其他：已走组装。`:10–11` 有未使用核心值导入，不能因路径合规就忽略未来门禁的导入问题 |
| `R/run-paced-hybrid-read.ts:11`：`runPacedHybridBatch` / CLI | 是（子进程） | child → `runHybridLiveRead` → factory；这里只做节流、监督和退出后评价 | 其他：已走组装；父文件本身不是产品执行链 |
| `R/run-paced-hybrid-read-child.ts:8,17`：`withPacedEval` / CLI | 是（CLI 委托） | `:21` 动态导入正常 Hybrid Runner；导出的 `withPacedEval` 只是 I/O 包装 | 其他：CLI 已走组装；任意回调不能自动继承该结论 |
| `R/run-recorded-read.ts:25`：`runRecordedRead` / CLI | 是（间接） | `:42 runHybridReadDiagnostic` → factory；替换录制的模型传输、Google response、browser/HAR | 其他：已走组装的 Replay；缺录制即未覆盖，不证明 Live |
| `R/run-discovery-probe.ts:71`：发现阶段 CLI | 是（间接） | `runDiscoveryProbe` → `AL/discovery-probe.ts:170` factory → `assembly.search.search` | 其他：已走组装的发现阶段；不执行事实、查位、交付，不签收整单 |
| `R/run-source-stage-probe.ts`：命名地点、DISCOVERY、IDENTITY、AVAILABILITY、WEBSITE_FACTS、REPLAY 分支 | 否 | `:431,562,607` 直接 Google search；`:598` planner + `runSourceStageNativeDiscoveryProbe`；`:637` 直接 `LiveBrowserAvailability`；`:664` 直接 website facts + judgment + browser decision | 组件评测：按冻结阶段量测来源；绕过生产 factory 的组合选路/共享配置、完整 Agent、状态接纳与交付。`:660` 明确 WEBSITE_FACTS 有意跳过 Google-first 短路；不能签收 Google→官网整体路径、G1 取页或整单 |
| `R/run-browser-case-slice.ts:119,134,149`：H001 浏览器切片 CLI | 否 | 直接 `ModelBrowserReadActionDecision`、`BrowserTaskExecutor`、Tabelog/TableCheck availability；候选/请求由切片指定 | 组件评测：单候选浏览器/Adapter 切片；绕过候选发现、factory、Agent 选路与完整状态/展示链 |
| `R/run-browser-read-probe.ts`：只读单页探针 CLI | 否 | `runBrowserReadProbe` → browser navigate/wait/snapshot + parser/resolver | 组件评测：单页可观测性；候选可由操作者指定，未建立库存/完整同店链，不能签收发现或查位 |
| `R/run-decision-replay.ts:231,313`：`runDecisionReplay` / CLI | 否 | original/history/categories 模式直接重发冻结 ModelRequest，再用 Agent/Browser wire decoder；rebuild 模式直接 ModelBrowserReadActionDecision，另建 executor/control registry | 组件评测：单步决策与历史注入诊断；绕过上游观察生产、factory 和整单状态推进，不能以动作答对签收执行链 |
| `R/run-d1-fact-judgment-controls.ts:27,62`：plan / `--run` | 否 | `ModelRestaurantFactJudgment.judge`；另用手造 state 调 validator | 组件评测：固定 evidence 的 HARD 判断/接纳控制；绕过实际来源读取、factory 和证据生产，不签收真实来源→HARD→交付 |
| `R/run-locality-fact-judgment-matrix.ts:117`：locality / category-negative 矩阵 CLI | 否 | `ModelRestaurantFactJudgment.judge`，预设候选/intent/evidence，独立 matrix scorer | 组件评测：语义判断矩阵；不证明资料取得、来源身份或整单 |
| `R/run-hybrid-artifact-evaluation.ts:12,25`：`evaluateFrozenCalibrationArtifact` / CLI | 否（不适用） | 已有 result/中断包 → 独立 diagnostic evaluator；不构造生产能力 | 其他：事后评分入口，不能通过执行生产组装来充当独立 oracle |
| `R/run-recorded-stage-timings.ts:16,48`：`runRecordedStageTimings` / CLI | 否（不适用） | SHA 核对后的历史 artifact/trace/decisions → `restaurantRunStageTimings` | 其他：离线耗时分析，无产品执行，不签收来源能力 |
| `AL/run-stage-timings.ts:8`：`restaurantRunStageTimings` | 否（不适用） | 仅耗时派生函数；名字以 run 开头但不是 Runner/CLI | 其他：明确纳入排查以免漏文件，不把统计当运行 |
| `Q/run-bound-questions.ts:11,50`：`runBoundQuestions` / fixture CLI | 否 | `:35 invokeQuestionCore` → `Q/core-adapter.ts:31` 直接 QA core；保存页、run/candidate/time 由输入提供 | 组件评测：G1 已绑定页面答题质量；绕过 factory、真实取页、Google-first 路径、身份取得、缓存填充和刷新；不能用于 G1 生产取页/完整追问签收 |
| `Q/run-real-question.ts`：按题/轮次/attempt 执行 CLI | 否 | `:48 runBoundQuestions`，仅替换实际模型传输；本文件不直接 import QA core | 组件评测：与上一行同一证明边界；真实模型不补足取页链路 |
| `Q/run.ts:9,49`：`runQaEvaluation` / CLI | 否（不适用） | 保存的 question/reference/read/response → 独立 QA scorer | 其他：答案/引用评分入口，不执行 QA core，不证明网页取得 |
| `D/run.ts:77,142`：`runDomChange` / CLI | 否 | 真实本地 Chromium + 保存 DOM → parser / completion functions；直接引用站点解析和完成条件 | 组件评测：DOM 私有标记变化的观测保持；绕过 factory、Agent、请求填入和完整查位，不能签收网页操作或整单 |
| `SF/run.ts`：搜索 fixture CLI | 否 | `runLocalSearchFixtureEval` → `FixtureRestaurantSearchApplication` → fixture search/check 业务 Port、自建 Router/Agent/Runtime | **应走组装但没走**：命令以请求→候选→授权检查点验证纵向搜索，但替换了整个业务 Port；生产发现/事实/查位和共享配置不在链上。只作为旧本地应用控制时需复核收窄声明，暂不建议白名单 |
| `S/runners/run-fixture.ts:5`：语义 fixture CLI | 否 | `runRestaurantSemanticRegression`；fixture Interpreter → Compiler/Reducer | 组件评测：语义契约；不签收来源调查、factory 或交付 |
| `S/runners/run-deepseek-regression.ts:36`：语义开发回归 CLI | 否 | 直接 SemanticInterpreter → semantic regression | 组件评测：真实模型语义结果；同上 |
| `S/runners/run-holdout.ts:120`：Holdout baseline CLI | 否 | SemanticInterpreter → semantic regression，另有输入/开始记录约束 | 组件评测：冻结语义评测；不签收来源/整单，本批未读取私有输入 |
| `S/runners/run-exposed-holdout-regression.ts:370`：已暴露语义回归 CLI | 否 | SemanticInterpreter → regression → comparison | 组件评测：已暴露语义诊断；不签收来源/整单 |
| `S/runners/run-exposed-holdout-regression-analysis.ts:80`：离线对比 CLI | 否（不适用） | 历史报告 → `compareRestaurantSemanticExposedRegression`，不执行 Interpreter | 其他：事后比较；不是执行组装入口 |
| `S/runners/run-holdout-preflight.ts`：输入 preflight CLI | 否（不适用） | `loadRestaurantSemanticHoldout` / preflight；不构造产品能力 | 其他：数据准入，不是产品执行或能力评价 |

以上 27 个 `run*.ts` 文件全部列入，包括容易因文件名误算的纯统计模块。没有运行这些 CLI。

## 非 CLI 执行/评分入口与辅助模块

| 文件与入口 | 经过组装 | 直接核心/绕过步骤 | 分类/用途边界 |
| --- | --- | --- | --- |
| `AL/fixed-source-case-execution.ts:42 executeFixedSourceCase`；`current-development-fixed-sources.ts:133 createCurrentDevelopmentFixedSources` | 是（`:95` → sources `:300`） | 真实 factory 后接 Hybrid；前者整单执行，后者只替换来源 I/O | 其他：已走组装；不是合格 Evidence 注入 |
| `AL/hybrid-read-composition.ts:56 createHybridReadComposition` | 自身否；调用方决定 | 直接 Interpreter、Compiler、TaskDefinition、Runtime、AgentDecision、Coordinator、Router；接受业务 Port | 其他：应用层执行组合 helper；必须核对调用方的 ports 是否来自 factory，不能据 helper 名称作判断 |
| `AL/discovery-probe.ts:119 runDiscoveryProbe` | 是（`:170`） | 返回 factory 的 search；只驱动冻结发现阶段 | 其他：已走组装的阶段执行 |
| `AL/browser-read-probe.ts:33 inspectProbePage` / `:68 runBrowserReadProbe` | 否 | 站点 parser/resolver + 单页 browser 操作 | 组件评测：单页观察，不建立业务 Evidence/库存结论 |
| `AL/name-resolution-method-a.ts:24 runNameResolutionMethodA` | 否 | `:40` executor、`:54` 两站 availability；identity 到达后由边界主动终止 | 组件评测：按已给候选验证身份前缀；隐藏不可达日期/人数 placeholder，不评价实际查位或发现→身份接线 |
| `AL/source-stage-probe.ts:348,370,447,522`：四个 `runSourceStage*Probe` | 否 | native 分支 `:455` 直接 new NativeRestaurantSearch；其余接受 search/facts/availability Port；planner/query 另组合 | 组件评测：阶段级，不能用单阶段结果签收完整组装；不能因 helper 接口是 Port 就遗漏 Runner 的直接构造 |
| `SF/eval.ts:18 runLocalSearchFixtureEval` / `fixture-application.ts:70 FixtureRestaurantSearchApplication` | 否 | 直接 fixture business search/availability、自建运行链 | 应走组装但没走：与 SF CLI 同一缺口；非另一套豁免 |
| `SF/named-retrieval-simulation.ts:13 simulateNamedRetrieval` | 否 | named fragment、Tabelog parser、prioritize/inspect entity；自行模拟 4+1 搜索/详情步骤 | 组件评测：保存资料上的排序/身份规则模拟，明确 `EVAL_SIMULATION_NOT_PRODUCT_PATH_OR_LIVE`；不签收生产预算/调度/日文名接线 |
| `Q/core-adapter.ts:19 invokeQuestionCore` | 否 | 手造 `RestaurantFactPageObservation` 与 HIGH `LOCAL_CONSTRUCTED_REVIEWED_PAGE_BINDING`，直接 new ModelRestaurantPageQuestion，`readPages` 为空 | 组件评测；这是 G1 Runner **实际直接导入核心的文件**。今后白名单若只写 run-bound-questions 而漏掉此文件，规则不会正确落在导入边界 |
| `Q/scorer.ts:21 scoreQaAnswer` | 否（不适用） | 独立文字/引用 oracle | 其他：评分组件；不替代实际运行 |
| `AL/diagnostic-evaluator.ts`：`evaluateRestaurantHybridLiveArtifact` / `evaluateArtifactFile` / `evaluateArtifactAfterFinish`；其 `diagnostic-evaluator-*` 子模块 | 否（不适用） | 独立重建原始来源、请求、引用、状态、网络轨迹；现有 import rule 已防生产判断函数自证 | 其他：评分入口和评分分解；不应要求调用被评能力 |
| `AL/fixed-source-acceptance.ts:83 assessFixedSourceAcceptance` | 否（不适用） | 已运行 execution + evaluator + coverageGaps → 验收 | 其他：验收组件；不能手造评分代替真实运行 |
| `AL/name-resolution-benchmark.ts:55 evaluateNameResolution` | 否（不适用） | 观察与预设独立样本对比；不调用 Resolver 作为 oracle | 其他：身份评分入口，与 method A 的执行区别记录 |
| `AL/selection-replay-assessment.ts assessSelectionReplay`；`locality-fact-judgment-matrix-scoring.ts canonicalizeLocalityMatrixResponse/localityMatrixRunPassesExpected`；`category-negative-fact-judgment-matrix-scoring.ts scoreCategoryNegativeMatrixRun` | 否（不适用） | 冻结输入/输出比较，不启动能力核心 | 其他：决策/判断组件的离线评分 |
| `S/regression.ts:91 runRestaurantSemanticRegression` | 否 | Interpreter → Compiler → in-memory Runtime/Reducer；没有 source ports | 组件评测：语义到权威 draft 的局部链，不是搜索整单 |
| `S/scorer.ts scoreRestaurantSemanticTurn/evaluateRestaurantSemanticGoal`；`exposed-regression.ts diagnose*/compare*`；`holdout.ts preflightRestaurantSemanticHoldout` | 否（不适用） | 评分、对比、数据准入 | 其他：不执行来源能力；本批只看代码，未打开私有原文/标签 |
| `AL/discovery-probe.ts:207 runDiscoveryProbePreflight`；`live-preflight.ts:240 runLivePreflight`；`live-source-health.ts:104 runLiveSourceHealth`；`source-data-preflight.ts:77 runSourceDataPreflight` | 否（不适用） | 网络连通、来源健康、公开查询准入；source-data 直接 Google client / TableCheck public query，未形成业务结论 | 其他：环境检查，不等于发现/查位能力；本批未执行 |
| `R/eval-post-exit.ts:26,75 superviseEvalChild/runSupervisedEvalCli` | 委托入口决定 | 监督进程、寻找保存结果、调用独立补评 | 其他：编排 helper，不能因执行后有 evaluation 就认定上游组装合规 |
| `AL/post-body-audit.mjs`：`inspectReviewedPost` / `recordedPostMatches` / `recordedPreflightMatches` / `postBodyStop` / `dryRunReviewedPostAudit` / `installReviewedPostObserver` | 否（不适用） | 独立 frozen-rule 的请求体/预检审计与外层 observer；只导入 node:crypto，Guard 类作为参数传入；无 CLI | 其他：外层安全审计/记录模块，不启动业务能力；dry-run 本批也未运行。该扩展名目前不在 arch:check 的 TS 扫描内，见机制边界 |
| `R/replay-read-recording.ts`、`recorded-browser-decision.ts`、`browser-read-recording.ts`、`google-places-recording.ts`、`browser-case-slice-evidence.ts`、`eval-paced-transports.ts`、`eval-pacing.ts`、`native-fixed-source-runner-finalization.ts` | 不独立执行组装 | browser/Google/model I/O 的录制、回放、节流、脱敏、finalize；部分直接用 browser decoder、Google client、source-pack 元数据 | 其他：边界/记录 helper；不能笼统将整个 integrations 或 infrastructure 目录当能力核心禁止，否则连授权替换的 I/O 也被禁 |

其余非测试文件是 case/manifest 加载、输入与固定页面/模型样本、位置/时钟/deadline、artifact 投影、独立文本、DOM 变异/分类、共享诊断日志/真实模型准入 helper；没有独立启动餐厅能力的入口。`fixtures/recording-diagnostic.ts` 生成本地录制样本，不是生产执行 Runner。完整文件分母可用 `git ls-files 'src/eval/**/*.ts'` 复核，不把 JSON/Gold 和私有输入当执行入口。

## 默认测试中的组合/集成/端到端声明

以下覆盖标题、文件名或正向行为说明命中的 9 个文件，也补查同义的 assembly/组装声明。标题没有该词、但位于名为 composition 的文件内的入口也保守纳入。表内同组入口共用路径时合列，具体行号不省略；后续两个详单列出混合 composition 文件的每个标题入口。

| 文件与测试入口（相对 src） | 经过组装 | 直接构造/绕过步骤 | 分类 |
| --- | --- | --- | --- |
| `application/restaurant-message-handler.test.ts:48`：T1–T6 handler composition | 否 | handler + fixture Interpreter/SupplementResolver → Compiler；来源从未调用 | 组件评测：消息补人数的局部接线，不签收来源/整单 |
| `eval/restaurant/agent-loop/current-development-offline.test.ts:282,349,440`：二轮 HARD / H001–H005 / 第六注册场景 | 是 | `createCurrentDevelopmentFixedSources` → factory → Hybrid Interpreter/Runtime/Router；只替外部响应 | 其他：已走组装。`:471,503` 另经 execute/evaluator/acceptance；不把脚本模型当真实理解 |
| `eval/restaurant/agent-loop/hybrid-read-composition.test.ts` | 混合，见详单 | `harness/restaurant-read-test-fixtures.ts:34,45` → factory → Hybrid；末组复用 CLI 的 captureHybridLiveProgress builder，并未启动 CLI | 其他：主体已走组装；末尾统计单测单列，不整文件担保 |
| `eval/restaurant/agent-loop/native-discovery-composition.test.ts` | 混合，见详单 | runScenario `:276` factory；亦有手工 Native/Google/Router、单独 fixture、capture helper | 其他：主体已走组装；直接核心只用于相应组件入口，不因同文件有整单测试而省略 |
| `infrastructure/postgres/postgres-runtime.test.ts:825`：restores a Restaurant task（注释称 integration） | 否（不适用） | PGlite + PostgresRuntime；预设 price/continuation state 后保存恢复 | 其他：持久化集成，非餐厅来源组装；不证明价格/区域事实取得 |
| `integrations/restaurant-availability/live-browser-availability.test.ts:12,63,89,129` | 否 | 直接 new LiveBrowserAvailability；候选、日期、人数已给定，browser/model 替身 | 组件评测：来源链复用/session/入口提示生命周期；不证明 factory 接线、候选取得或整单。`:90` 明写起点就是该类 |
| `integrations/restaurant-facts/quoted-fact-read.test.ts:16`：shared Web/Hybrid fact composition | 否 | 直接 composeNativeRestaurantRead + fake Google facts port，读 native-bound 候选 | 组件评测：事实子组合的引用→判断→返回；绕过顶层 factory 的配置/入口、Google-first 分支和完整状态/展示。`:41` capture control 另直接 NativeSourceFactRead，不签收 G1 全来源取页 |
| `integrations/tabelog/tabelog-browser-availability.test.ts:834,963,988`：Adapter composition 控制 | 否 | 直接 TabelogBrowserAvailability；合成身份 envelope、预给 alternative/Japanese lookup 回调 | 组件评测：价格接纳/同店/五详情额度；不证明 Google 日文名 lookup 接线、factory 或原网站身份完整回放 |
| `server/local-web-server.test.ts:1292`：T1 Web shared assembly | 是（`:1326`） | factory → 持久化 HTTP；实际命名地点/空 Nearby 响应由 Google transport 提供；模型延迟与并发 list 受控 | 其他：已有实际 Web 组装控制；只证明该并发/空结果路径，不自动证明后加的 G1 取页 |
| `server/local-web-server.test.ts:1577,1625,1712,1736`：questionSessionFixture 的 full persistent HTTP composition（注释 `:1524`） | **否** | `:1559` 自建 PageQuestionReader → 直接 GoogleListedWebsiteFactRead；业务 search Port 内 `:1570` 主动预热页面缓存，startServer 注入业务 ports | **应走组装但没走**：HTTP/持久化/权限/问答局部断言有效，但“只替模型与 browser I/O”的声明不成立；绕过 SourceAware/GoogleThenWebsite 路径及生产“何时取页”，正是 capturePagesOnly 风险可能藏匿处。本批不修，由 A 评估覆盖、B 修产品 |
| `server/local-web-server.test.ts:1794`：B1 persistent HTTP composition | **否** | 手工 search/check Port，直接 groundTabelogAvailability/prepareBookingHandoff 生成 evidence/缓存，注入 server | **应走组装但没走**：只能证明 HTTP 投影/重核/owner 隔离；绕过来源响应读取、factory 的 handoff capture/cache 接线，不据此签收源链接生产 |
| `server/local-web-server.test.ts:1900`：B1 ordinary assembly（相关正常控制） | 是（`:1955`，restart `:2015`） | factory 原始 vacancy response → bookingHandoffs → persistent HTTP；startServer 使用 returned readAssembly | 其他：已有真正组装控制；本行补充对照，不把它的存在当作上一行所有负例已覆盖 |

`application/restaurant-agent-loop.test.ts:19`、`domains/restaurant/read-grounding.test.ts:272` 明确说 **不是** E2E，分别是保存状态终态回归和 Domain 接纳单测；归为其他，不误列成集成缺口。`integrations/restaurant-search/directory-region-selection.test.ts:397` 只是指向另一个 F5 组合测试的说明，本文件该入口是局部预算控制，归为组件；不把被引用的覆盖搬到本入口。其余关键词命中只是 import 路径、变量、数据文件名或错误文本，无正向组合声明。`src/harness/browser/**` 不在默认 npm test 内；本停止点不将其混入上述默认集合，也没有运行 Chromium。

### Hybrid composition 文件逐入口

共同路径 H = `createGoogleReadComposition` → production factory → Hybrid；C = `runScopedFailureComposition` → `:1256 createGoogleReadComposition` → 同一 factory/Hybrid，另复用 CLI 的 artifact builder；C 没有调用 CLI Runner。H/C 都保留真实业务组件，只替模型传输/Google HTTP/browser I/O。路径中的模型 double 不证明自由文本理解。

| 测试行号与标题识别段 | 路径 | 分类/实际边界 |
| --- | --- | --- |
| 313 independent source boundary controls | H | 其他：已走组装；零/一/批边界 |
| 327 user refresh after clock advances | H | 其他：已走组装；刷新 |
| 369 cancelling during in-flight fact read | H | 其他：已走组装；取消 |
| 413 request update after cancelling | H | 其他：已走组装；新请求 |
| 484 fixed-seed bounded exploration | H | 其他：已走组装；确定随机/缩减 |
| 532 binds explicit evaluation location | H | 其他：已走组装；显式测试位置 |
| 594 recommendation reaches actual presentation | H | 其他：已走组装；推荐 |
| 633 Google network failure | H | 其他：已走组装；失败终止 |
| 665 asks for location without context | H | 其他：已走组装；缺位置，不读来源 |
| 688 supported candidate / type conflict | H | 其他：已走组装；事实 |
| 737 category UNKNOWN | H | 其他：已走组装；未知 |
| 770 second user message adds exclusion | H | 其他：已走组装；多轮 |
| 821 reads across partitions/order（含 `:827` 参数化 subtest） | H | 其他：已走组装；跨批 |
| 862 fact exhaustion leaves browser reachable（含 `:863` 参数化） | H | 其他：已走组装；局部预算 |
| 903 source text → availability/presentation | H | 其他：已走组装；事实/查位交接 |
| 1006 website observation for another candidate | H | 其他：已走组装；归属 |
| 1066 failed compound refresh | H | 其他：已走组装；失效 |
| 1122 closed-hours refresh | H | 其他：已走组装；Context |
| 1297 observed-option browser wire | C | 其他：已走组装；控件 wire |
| 1311 A/B/C failures leave D reachable | C | 其他：已走组装；来源/候选局部失败 |
| 1331 shared budget / runtime outage | C | 其他：已走组装；两类终止 |
| 1345 deadline captures immutable partial evidence | C | 其他：已走组装；deadline artifact |
| 1372 sent Google request cancelled | C | 其他：已走组装；已发送但无 response |
| 1388 progress exports pending/wait count | 否 | 其他：captureHybridLiveProgress 的统计单测，预造 diagnostic，没有产品执行 |

### Native composition 文件逐入口

N = `runScenario` → `:276 createLiveReadAssembly` → Hybrid；P = `runDiscoveryProbe` → factory 的发现阶段；F = 直接 factory 后调用其 search/Router。未绕过的行不重复罗列核心；“否”的行列出具体构造和未证明范围。动态参数化标题保留模板标识，行号对应注册位置。

| 测试行号与标题识别段 | 经过/路径 | 分类/绕过与边界 |
| --- | --- | --- |
| 338 native first batch three results | 是/N | 其他：已走组装 |
| 357 cited-menu HARD follow-up | 是/N | 其他：已走组装 |
| 365 reserve-menu form prohibition | 是/N | 其他：已走组装 |
| 380 second native batch | 是/N | 其他：已走组装 |
| 390 shared browser loop reveals list | 是/N | 其他：已走组装 |
| 403 observed ordinary query submit | 是/N | 其他：已走组装 |
| 410 ready TableCheck query | 是/N | 其他：已走组装 |
| 418 rejects stale busy discovery | 是/N | 其他：已走组装 |
| 428 source session remaining window | 否 | 组件评测：直接 NativeRestaurantSearch + GoogleSearch；预设 continuation，只测单源保留入口，不证明 factory/整单 |
| 456 Router default three-pack cursor | 否 | 组件评测：直接 NativeRestaurantSearch + GoogleSearch + Router，手动 State；不证明 factory 共享配置/实际 Runtime |
| 503 wrong fill cannot reveal result | 否 | 其他：直接 sourcePages 的 session 自检，没有调用生产能力，不是组装证据 |
| 526 two bounded empty batches | 是/N | 其他：已走组装 |
| 536 outside radius | 是/N | 其他：已走组装 |
| 551 detail failure retains candidates | 是/N | 其他：已走组装 |
| 566 rejects early END_READ | 是/N | 其他：已走组装 |
| 574 Tabelog unavailable/unknown then result | 是/N | 其他：已走组装 |
| 587 TableCheck continues | 是/N | 其他：已走组装 |
| 596 open-ended target short result | 是/N | 其他：已走组装 |
| 605 investigated batches no result | 是/N | 其他：已走组装 |
| 614 raw link but no parsed outlet | 是/N | 其他：已走组装 |
| 631 named Shibuya directory | 是/N | 其他：已走组装 |
| 639 sparse keyword category | 是/N | 其他：已走组装 |
| 648 rejects foreign region root | 是/N | 其他：已走组装 |
| 655 category pagination/dedup | 是/N | 其他：已走组装 |
| 671 named entry avoids unrelated root | 是/N | 其他：已走组装 |
| 679 regional redirect | 是/N | 其他：已走组装 |
| 687 neutral locality through entrance | 是/N | 其他：已走组装 |
| 699 same-region canonicalization | 是/N | 其他：已走组装 |
| 707 unscoped national homepage | 是/N | 其他：已走组装 |
| 714 Tabelog current-batch result | 是/N | 其他：已走组装 |
| 727 TableCheck current-batch result | 是/N | 其他：已走组装 |
| 739 retained detail entrance | 是/N | 其他：已走组装 |
| 749 retained unstarted entries | 是/N | 其他：已走组装 |
| 757 deferred outlets across source | 是/N | 其他：已走组装 |
| 771 rejects early end/short presentation | 是/N | 其他：已走组装 |
| 784 WP-A offline capture | 是/N | 其他：真实组装产生调用/页面后再核对 recorder |
| 845 WP-A capture storage/deadline | 否 | 其他：createHybridDecisionCapture 单测，预造 ModelRequest，不执行搜索 |
| 884 coordinate-only address input | 否 | 组件评测：直接 GoogleSearch + NativeRestaurantSearch + decision port；不证明 factory/完整 Agent |
| 908 repeated checked availability `${scenario}` | 是/N | 其他：两个参数化场景均组装 |
| 926 unresolved location NO_PROGRESS | 是/N | 其他：已走组装 |
| 942 >12 availability model calls | 是/N | 其他：实际组装/共享预算 |
| 951 Runner/Web equal limits | 是（只建两份 factory） | 其他：factory 配置/预算隔离控制；未分别启动 Web 和 Runner，不单独证明两宿主接线 |
| 973 P21 first batch / no availability | 是/P | 其他：组装发现阶段 |
| 991 P21 failed calls shared ceiling | 是/P | 其他：组装发现阶段 |
| 1006 P21 rewrite bounds | 是/F | 其他：组装发现阶段 |
| 1032 P21 shared initial proposal | 是/P | 其他：组装发现阶段 |
| 1045 Google-only planned retrieval | 是/F | 其他：组装发现阶段 |
| 1075 H002 no positive HARD | 是/F | 其他：组装发现阶段 |
| 1099 F5c pending candidates correction | 是/N | 其他：已走组装 |
| 1135 capture DOM mismatch | 否 | 其他：capture/recording helper 单测，无产品搜索 |
| 1151 F5 provisional handoff | 是/N | 其他：五场景实际组装 |
| 1178 F3-034 rejected rewrites | 是/F | 其他：组装发现阶段 |
| 1206 invalid shared text（for/if 中注册） | 是/F | 其他：组装发现阶段 |
| 1219 F6 reserve search handoff | 是/F | 其他：factory ports → Router/Runtime；不将其局部控制叫完整 Interpreter 用户链 |

## 待复核的能力核心边界

不是把整个 `src/integrations/**` 禁掉。Google client、browser runtime、model gateway 是本指令允许替换/注入的 I/O；contracts、source-pack 配置和纯类型不是实际“调用能力”。下表是供复核确认的候选模块集合，**不是本批已经生效的规则**。同一格内不带目录的文件名继承该格前一个带目录项。

| 能力 | 候选核心模块（相对 src/integrations） | 直接绕过时漏掉的生产步骤 |
| --- | --- | --- |
| G1 问答/取页 | `restaurant-facts/model-page-question.ts`、`page-question-reader.ts`、`page-question-read-budget.ts`、`fact-page-binding.ts` | 源页面取得、身份绑定、缓存/当前请求、问答范围预算；G1 adapter 的直接 import 在 core-adapter，不在顶层 Runner |
| 来源事实与 HARD | `restaurant-facts/live-restaurant-facts.ts`、`google-then-website-facts.ts`、`google-listed-website-facts.ts`、`native-source-facts.ts`、`model-fact-judgment.ts`、`model-source-facts.ts` | 来源路由/短路、资料取得、引用、判断接线、状态接纳 |
| 候选发现与查询 | `google/google-places-restaurant-search.ts`、`restaurant-search/native-restaurant-search.ts`、`native-read-composition.ts`、`discovery-retrieval-planner.ts`、`named-source-query.ts` | 生产 planner/pack cursor、共享预算、地区/候选发现、来源 handoff；native-read 是 factory 的下层，直接调用仍绕过顶层 |
| 查位/来源链 | `restaurant-availability/live-browser-availability.ts`、`availability-source-resolver.ts`、`native-outlet-continuity.ts`、`tabelog/tabelog-browser-availability.ts`、`tablecheck/tablecheck-browser-availability.ts` | 来源调度、入口线索生命周期、同店再核验、源请求/查位和共享限额 |
| 身份解析 | `restaurant-availability/outlet-identity.ts`、`restaurant-identity/detail-identity-fields.ts`、`tabelog/tabelog-entity-resolver.ts`、`tablecheck/tablecheck-entity-resolver.ts` | 不能从孤立同店判断推导来源发现/详情/库存接线有效 |
| 预约链接取得 | `tabelog/tabelog-booking-handoff-reader.ts` | 真实 availability response → factory capture → task 隔离 cache → 展示链接，而非测试手放缓存 |
| 需确认的解析/完成子核心 | `tabelog/tabelog-page-parser.ts`、`tablecheck/tablecheck-page-parser.ts`、`tabelog/tabelog-query-controls.ts`、`tabelog/tabelog-vacancy-response.ts`、`tablecheck/tablecheck-availability-response.ts` | 单独解析/完成条件评测（DOM-change/probe）有真实价值，但不证明请求填入及来源取得；是否并入核心集合请复核决定 |
| 需确认的 Domain/执行核心范围 | `src/domains/restaurant/semantic-interpreter.ts`、`agent-decision.ts`；`src/infrastructure/browser/browser-action-decision.ts`、`browser-task-executor.ts` | semantic/decision/browser slice 有意局部评测；若此次禁入也覆盖这些，应逐文件登记组件用途，不能自动把所有旧 Runner 放行 |

独立 Evaluator 的正常策略是“不依赖生产判断”。已有独立规则 `src/eval/shared/evaluator-import-rule.ts` 继续保留；不会为了减少白名单把 source parser、eligibility 或生产 resolver 搬进评分器。表中模块大部分并不由 factory 公开返回独立核心；组装型调用方应使用返回的 `search/facts/questions/availability/bookingHandoffs`，不是新增生产导出来满足测试。

目前另有三类机械问题需在规则确定后核对，不把它们伪装成运行时绕过：

1. `R/run-hybrid-live-read.ts:22` 值形式导入 GoogleSearch，但仅类型使用；`R/run-native-fixed-source-model.ts:10–11` GoogleSearch/LiveBrowserAvailability 值导入未使用。若确认核心禁入覆盖这些 import，应由所属改动清理/改用合法类型契约；本批没有修改 A 的文件，也不把整单 Runner 填成组件白名单来放行。
2. `src/eval/**` 包含测试。`native-discovery-composition.test.ts` 混合了真正组装控制与 Native/Google/Router 组件控制；`locality-fact-judgment-matrix.test.ts`、`source-stage-probe.test.ts`、`phase2-discovery-plan.test.ts` 等还有直接核心类或常量导入。白名单必须逐“文件 + 核心”登记实际组件用途，不能豁免整个 eval 目录或整个 composition 文件的任意导入。精确哪些模块入禁用集合、纯类型/常量是否同样受禁，留本停止点复核确定；不静默增加类型豁免。
3. 本门禁按指令只约束 `src/eval/**` 的导入。上表的 server/integrations 测试声明缺口仍交复核者/A 安排，不能说有了 eval import gate 就自动防住它们；纯导入门禁也不能证明“使用 factory 后未替换返回的业务 Port”。

## arch:check 能否表达目录禁入 + 白名单

**可以沿用现有机制实现；当前尚没有这条规则和白名单。** 不需要新的检查框架。

| 已有机制位置 | 实际行为 | 如何承接本任务 |
| --- | --- | --- |
| `package.json#scripts.arch:check` | `node --import tsx scripts/arch-check.ts` | 保持同一个默认门禁入口 |
| `scripts/arch-check.ts:8–18,70–82` | 递归遍历全部 `src/**/*.ts`，含 eval 及测试 | 可用 `importer.startsWith("eval/")` 限定受管目录 |
| `scripts/arch-check.ts:21–31` | importer 相对 src 规范化；相对 import 解析为规范文件路径，`.js` 转 `.ts` | 用规范 importer/imported 文件对匹配核心集合和严格白名单 |
| `scripts/arch-check.ts:73–80` | 正则读取 import/export/字面量 import()/require()，调用 `evaluatorImportViolation(importer, imported, statement)` 与一般 `violation` | 已有按目录/文件/目标返回错误原因的扩展点；白名单可在这个既有检查流程内加载/校验后判定，无需另一 Runner |
| `src/eval/shared/evaluator-import-rule.ts:2–20` | 已有生产→eval witness 禁止、diagnostic evaluator→生产判断的目录/模块规则；现有规则有自己的纯类型例外 | 证明机制支持更细的目录规则；本次新规则的类型口径不能直接照搬例外 |
| `scripts/arch-check.ts:84–89` | 汇总 `importer -> imported: reason`，存在违规则 exitCode=1 | 可以准确指出新增绕过文件与核心模块；停止点 2 再实测三条红绿灯 |
| `diagnostic-evaluator.test.ts:455–468,560–563,2136` | 已有 import 形式/独立性规则回归 | 可沿用相同规则测试入口；此处只核查源码，未新增测试 |

现有 Arch Guard Skill 对自动检查写的是“只覆盖相对静态 import”，而实际脚本已识别**字面量**动态 import/require 及 export-from；本报告以实际脚本为准。它仍是正则检查：不做 AST/完整符号或可达调用分析，不覆盖计算路径 import、别名/包解析和任意传递依赖。G1 的一层 helper 因同在 src/eval 下也会扫描，能在真正的直接导入点拦截；不能因此宣称任意跨目录 helper/注入对象也被自动证明。

扫描器当前只取 `.ts`，唯一既有 eval `.mjs` 已单独盘点且没有生产核心导入。若要把“src/eval 下所有文件”作为门禁承诺，停止点 2 须在**同一个现有扫描流程**纳入可执行扩展名及相应路径规范化，不能只验新增 `.ts` 红灯后声称 `.mjs` 也受保护；这不需要另建框架。本次不修改扫描范围，供复核确认。

白名单严格解析、拒绝未知键/陈旧项，以及三条红绿实验，是停止点 2 的实现与运行验收，本次仅确认机制承载能力。未创建 `assembly-bypass-allowlist.json`，未改 `arch-check.ts` 或任何 Skill。

## 本停止点结论、检查与停止条件

明确待复核的“应走组装但没走”有三个入口族：SF 的纵向 fixture Runner/application、G1 questionSessionFixture 的完整 HTTP 声明、B1 手工业务 Port 的 HTTP composition。它们不进入组件白名单提案。G1 固定页问答、分阶段来源探针等按组件范围登记；复核者确认分类及核心名单后才能实施。

| 主要失败类型 | 本次证据 | 后续门禁能抓什么 / 未证明什么 |
| --- | --- | --- |
| Eval 直接构造能力、上游被预先设置正确 | G1 core-adapter 手造 HIGH/page；完整 HTTP helper 跳过 production fact 组合；SF 替业务 Port | 确认核心后由 import gate 拦新直接导入。页面取得能力的整组装覆盖由 A 补，本批不抢做 |
| “导入 factory”被误当“实际经过” | native 文件里的直接构造、仅 factory 参数对照；Hybrid helper 接受任意 Port | 此次逐入口静态核对；纯 import gate 仍不能证明所有调用/返回值使用 |
| 组件得分被拿来签收完整能力 | G1 bound runner 的 `LOCAL_CONSTRUCTED_OFFLINE_METADATA_NOT_PRODUCTION_IDENTITY_VERIFICATION` / `freshReads:0`；source-stage 的单阶段说明 | 版本化白名单应写不能用于哪项签收；不是给组件结果增加能力 |
| 新入口绕过规则而门禁仍绿 | 当前 arch:check 没有 assembly 规则，只有其他依赖规则 | 停止点 2 才用隔离工作树三条红绿灯证明；本报告不宣称已防住 |

本批只执行源码/调用关系/默认 glob 的静态核对、相对链接与引用检查、`git diff --check` 和提交范围检查。typecheck、arch:check、npm test、build、test:browser:fixture 未运行：停止点 1 无代码改动，按 Test Skill 纯文档矩阵检查，五门禁留到获准的停止点 2。没有将历史全绿当本次运行。

实际离线检查记录（2026-11-01 CET）：

| 命令/检查 | 结果 |
| --- | --- |
| `git fetch origin main`；`git rev-parse origin/main` | 成功，取得本报告基线；独立工作树创建指定分支，初始 `git status --porcelain=v1` 为空 |
| `git ls-files src/eval`；`rg --files src/eval`；按文件检查 imports、构造/调用点、exports/CLI guard | 167 个 tracked eval 文件中 142 TS + 1 mjs；27 个 run 命名 TS 全部列入。其余为数据/文档/HTML；未打开私有原文 |
| `rg` 检索组合/集成/端到端的测试声明，再核对多行标题、文件名、注释（实际命令见下） | 区分正向声明、明确非 E2E、指向他处覆盖和无关关键词；混合文件详单如上 |
| `python3` 内存核对：按 package.json glob 展开、逐 run 文件对照报告、核对缩写文件引用及 STATUS/历史链接 | PASS：142 TS / 44 测试 / 27 run 文件全部列入 / 111 默认测试文件；59 处明确源码路径存在，3 处交付链接指向本报告。不执行被盘点代码 |
| `git diff --check`；提交前 `git diff --cached --check` / `git diff --cached --name-only` | PASS，无空白错误；提交仅报告及 STATUS、DEVLOG、TEST-LOG 三处索引记录，无 `src/`、scripts、Skill 或输入改动 |

```bash
rg -n -i '(^|\W)(test|it|describe)\s*\(.*(compos|integrat|end.to.end|\be2e\b|组合|集成|端到端)' src --glob '*.test.ts' --glob '!src/harness/browser/**'
```

报告主证据入口：[生产 factory](../../../src/integrations/restaurant-search/live-read-assembly.ts)、[现有架构扫描](../../../scripts/arch-check.ts)、[既有独立性规则](../../../src/eval/shared/evaluator-import-rule.ts)、[G1 实际直接导入点](../../../src/eval/restaurant/fact-qa/core-adapter.ts)。

原指令提到的 `phase3/CODEX-3B-20261101-PM.md` 不在本次 main 的 tracked 文件中；本批按用户已提供的 A/B/C 分工控制范围，没有读取或修改另一对话的未合入文件。后续 A 的 G6 Runner/独立 Evaluator 随 main 同步后仍要过新门禁；不会提前给未见文件白名单。

**停止于盘点报告推送，等待独立复核。规则尚未实施，组装门禁未关闭。**
