# 评测组装门禁：停止点 2

- 时间：2026-11-01 CET（维也纳，UTC+1），09:04 开始。
- 状态：`draft / not integrated`，门禁机制及检错通过；五门禁4/5，默认套件含已在改动前main复现的既有失败，尚非全绿签收，未合main。
- 分支：`codex/chore-eval-assembly-gate`；停止点 1 `8743f56b` 已复核通过。
- main 已 fetch 核对，仍为 `6db445ea9afdbe5debdc60efc1107f768434c555`，已包含于当前分支，无需重放或覆盖 A/B/C 文件。
- 本切片：使用现有 arch:check 扫描/依赖判定，禁止 src/eval 的 TS/MJS 值导入复核确认的25个能力核心；精确组件白名单严格解析并检查陈旧项。保留既有独立 Evaluator 规则。
- 原结束条件为五门禁全绿。用户追加指令：不取C文件；同命令在干净main复现调度失败、单独运行并如实归档，列“既有失败，修复在C分支5683dcfb，待合入”。复核者安排C先合main，本分支再同步重跑；本批不绕过该依赖，不宣布全绿。
- 实际模型、Google、餐厅网站、Live及见证请求均0；不读取或暂存 .env。依赖仅从本机 npm 缓存恢复。

## 已批准范围与替代覆盖

复核附件确认核心名单、纯类型豁免、逐文件逐核心白名单；本次用户另批准 SF 四文件、npm命令及两处当前说明退役。保留 named-retrieval-simulation 及其测试，按真实直接导入点登记组件用途；其测试没有直接核心导入，不制造会被陈旧检查拒绝的虚假条目。

退役前执行（源码仍为8743f56b）：

```bash
node --import ./scripts/test-filesystem-guard.mjs --import tsx --test src/harness/restaurant-harness.test.ts src/application/restaurant-message-handler.test.ts src/server/local-web-server.test.ts
```

结果：77/77通过，退出0，耗时24016.809459ms。原始输出：[pre-retirement.tap.log](pre-retirement.tap.log)。首次默认沙箱拒绝创建日志，测试未启动；上面结果来自同一离线命令在获准工作树权限下的实际运行，环境失败不计业务红灯。

| 退役行为 | 仍存在并已通过的替代入口 | 证明边界 |
| --- | --- | --- |
| 完整请求→候选调查/选择→授权检查点 | `src/harness/restaurant-harness.test.ts:28,38,107`；`src/server/local-web-server.test.ts:880` W01及相邻W02 | 保留已有当前Runtime/Agent/授权前检查；不证明Live或新增来源能力 |
| 缺字段追问/补齐 | `src/application/restaurant-message-handler.test.ts:48,103`；`src/server/local-web-server.test.ts:542,605,1470` | 缺/未知人数保留NEEDS_INPUT、完整请求续行；不从无结果推导正确追问 |

## 实施与检错计划

| 主要失败类型 | 实际入口/断言 | 实际检错证据 | 未证明边界 |
| --- | --- | --- | --- |
| TS/MJS评测直接构造能力核心 | npm run arch:check的扫描及evaluatorImportViolation | 旧门禁均exit0；修复后分别exit1且指出对应文件/核心 | 任意计算路径/跨目录注入不是完整调用分析 |
| 文件白名单被当成任意模块豁免 | 精确file+core匹配，真实值导入识别 | 只允许登记对；真实纯类型文件和精确登记正常控制均exit0；其他模块由规则回归拒绝 | 白名单用途仍需人工复核 |
| 未知键/不完整说明/陈旧例外 | 严格JSON解析、实际值导入集合比对 | 实际arch未知键/陈旧项exit1，清单正常exit0；规则回归另覆盖必填/类别/路径/重复对 | 不以描述文本充当真实能力证据 |
| G1固定页绕过被误用于整能力签收 | core-adapter确切条目与Test Skill单条签收规则 | 只删除其例外，实际arch出现该文件/核心的目标红灯 | 页面取得整组装由A补，不修改其测试行为 |
| SF退役导致原合同覆盖丢失 | 既有harness/application/Web回归 | 退役前77/77；默认1273/1274，唯一失败在原有调度文件且main复现 | 不把旧Fixture当当前生产来源组装 |

## 实际修改

1. `scripts/arch-check.ts` 保留现有扫描/相对路径规范化/违规汇总流程，额外扫描 `src/eval/**/*.mjs`；`.js` specifier 归一到 TS，`.mjs` 保留。检查实际值导入对并拒绝清单中的陈旧项；无第二个 Runner 或检查框架。
2. `src/eval/shared/evaluator-import-rule.ts` 保留独立 Evaluator 的既有规则，加入复核确认的25个核心、纯类型识别和严格组件清单解析。`import {}`、未使用值、re-export、字面量动态 import/require 均受禁；MJS没有TypeScript类型声明，名为type的默认值绑定不能伪装纯类型。
3. [组件白名单](../../../src/eval/assembly-bypass-allowlist.json) revision1：24个精确文件/核心对，类别仅组件评测，每项都有proves/cannotSignOff。无“其他：已走组装”的整单Runner例外。混合native测试文件的两个例外只说明直接构造的三个组件控制，不替同文件的factory场景签收。
4. `run-hybrid-live-read.ts` / `run-native-fixed-source-model.ts` 按批准清理类型/未用值导入；扫描另发现 `source-stage-probe.ts` 的Google类也仅类型使用、native composition测试的LiveBrowserAvailability未使用，同样机械清理。两份Runner、该helper和两份测试去注释转译输出均与8743f56b逐字相同；未改任何原有断言、业务选路、Prompt、Schema、State、TaskDefinition、站点或source-pack。
5. 删除批准的SF四文件和npm命令；`npm test`原glob原样保留，named-retrieval-simulation及其测试原样保留。Eval Skill、eval README各只删除指定的一行。用户随后另行批准：删Conventions旧命令示例，将Restaurant Booking中失效Driver引用最小替换为harness替代覆盖，句中其他内容不改。历史原文/旧复核不改。
6. Web G1和B1夹具仅改注释，如实说明手工业务Port/取页器/evidence/cache；没有给它们增加生产组装证明。G1整组装归A；B1认既有ordinary assembly控制。
7. Test Skill仅新增一条：门禁/组件清单含义、能力签收必须来自src/eval中实际生产组装且通过门禁的入口、.eval-artifacts仅组件/诊断证据。历史脚本不扫描、不改写、不追溯改判既有结果；按新签收规则交复核者判断适用范围。

定向规则和既有Evaluator回归：141/141通过（含独立性原有回归），退出0；日志为[targeted-rules.log](targeted-rules.log)。旧门禁分别漏拦TS和MJS，退出均0；日志为[before-ts.log](red-green/before-ts.log)、[before-mjs.log](red-green/before-mjs.log)。这是“期待拒绝却没有拒绝”的修复前反例，不能当作成功拦截。

## 规则与清单位置

- [现有扫描流程](../../../scripts/arch-check.ts)：`sourceFiles`扩展eval MJS，`importedSourcePath`规范化，加载严格清单；匹配值导入集合后逐条拒绝陈旧对。
- [既有依赖规则模块](../../../src/eval/shared/evaluator-import-rule.ts)：确认的25核心、`parseAssemblyBypassAllowlist`、`assemblyCoreValueImport`、原`evaluatorImportViolation`；原独立性边界保留。
- [默认规则回归](../../../src/eval/shared/evaluator-import-rule.test.ts)：独立字面量核心名单、类型/值对照、精确例外、严格解析；沿既有shared测试glob进入npm test。
- [版本化清单全文](../../../src/eval/assembly-bypass-allowlist.json)：revision1，14个文件、24个精确对。各条的证明范围和禁止签收用途均在原JSON，不维护第二份例外配置。

清单目录简记：AL=`src/eval/restaurant/agent-loop/`；R=AL的`runners/`；其余均相对`src/eval/restaurant/`。核心列为完整JSON路径的文件名识别段。

| 组件文件 | 核心（每项分别登记） | 对数 |
| --- | --- | --- |
| AL/browser-read-probe.ts | tablecheck-entity-resolver、tabelog-entity-resolver | 2 |
| AL/locality-fact-judgment-matrix.test.ts | model-fact-judgment | 1 |
| AL/name-resolution-method-a.ts | tabelog-browser-availability、tablecheck-browser-availability | 2 |
| AL/native-discovery-composition.test.ts | google-places-restaurant-search、native-restaurant-search（仅直接构造的组件控制） | 2 |
| AL/phase2-discovery-plan.test.ts | google-places-restaurant-search（半径常量） | 1 |
| R/run-browser-case-slice.ts | tabelog-browser-availability、tablecheck-browser-availability | 2 |
| R/run-d1-fact-judgment-controls.ts | model-fact-judgment | 1 |
| R/run-locality-fact-judgment-matrix.ts | model-fact-judgment | 1 |
| R/run-source-stage-probe.ts | discovery-retrieval-planner、google-places-restaurant-search、live-browser-availability、google-listed-website-facts、model-fact-judgment | 5 |
| AL/source-stage-probe.test.ts | google-places-restaurant-search | 1 |
| AL/source-stage-probe.ts | native-restaurant-search | 1 |
| dom-change/run.ts | tabelog-browser-availability、tablecheck-browser-availability（仅完成条件函数） | 2 |
| fact-qa/core-adapter.ts | model-page-question | 1 |
| search-fixture/named-retrieval-simulation.ts | named-source-query、tabelog-entity-resolver | 2 |

## 隔离红绿灯

全部调用同一`npm run arch:check`，临时工作树先用8743f56b留修复前反例，再切到冻结实现`da92154c3fc9a37c97b016ec4025e46bba67445d`。各次receipt包含真实退出码、目标错误消息、工作树SHA、实际probe内容和清单SHA；没有运行违规评测文件，也没有改生产实现。

| 构造/正常控制 | 实际结果 | 原始日志/receipt |
| --- | --- | --- |
| 无变异正常清单 | exit0 | [after-normal](red-green/after-normal.json) |
| 新增TS直接值导入model-page-question | exit1，目标TS文件与核心的assembly gate错误 | [after-ts-rejected](red-green/after-ts-rejected.json) |
| 同一TS改为真正import type、不加例外 | exit0 | [after-type-only-accepted](red-green/after-type-only-accepted.json) |
| 新增同样MJS直接值导入 | exit1，目标MJS文件与规范化后的TS核心错误 | [after-mjs-rejected](red-green/after-mjs-rejected.json) |
| 两个文件分别加入精确组件对 | exit0，原有清单仍完整 | [after-exact-pairs-accepted](red-green/after-exact-pairs-accepted.json) |
| 仅删G1 core-adapter例外 | exit1，仅该文件/核心失去许可 | [after-g1-exception-removed](red-green/after-g1-exception-removed.json) |
| 文件仍存在，移除实际导入，但保留其登记对 | exit1，明确stale component exception | [after-stale-pair-rejected](red-green/after-stale-pair-rejected.json) |
| 实际清单根节点加入未知键 | exit1，明确invalid allowlist / unknown keys | [after-unknown-key-rejected](red-green/after-unknown-key-rejected.json) |
| 恢复原清单并删全部probe | exit0，两工作树状态均为空 | [after-final-normal](red-green/after-final-normal.json) |

每个JSON旁都有同名`.log`，包含完整stdout/stderr。判定要求明确的退出码及目标错误文本；模块加载、类型、环境或无关测试错误不算拦截。9个正常/反例控制全部符合预期。

干净main复现及单文件对照完成后，该一次性工作树已用`git worktree remove`清理（退出0）；所有probe先已删除、清单已恢复，没有在工作分支留下故意违规文件，也未清理其他对话的工作树。

## 五门禁与既有失败归属

五项全部实际执行，绑定同一个干净实现`da92154c`、719项冻结输入。每项前后`git status --porcelain=v1`都为空、HEAD和输入SHA都未变；完整机器记录见[gates.json](verification/gates.json)、[冻结输入](verification/source-inputs-sha256.json)。没有恢复已提交文件来隐藏写入。

| 命令 | 结果 | 外层耗时 | 原始日志 |
| --- | --- | --- | --- |
| npm run typecheck | PASS，exit0 | 0.475s | [typecheck.log.gz](verification/typecheck.log.gz) |
| npm run arch:check | PASS，exit0 | 0.249s | [arch-check.log](verification/arch-check.log) |
| npm test | 1273/1274，exit1；唯一既有调度失败 | 29.860s | [test.log](verification/test.log) |
| npm run build | PASS，exit0 | 0.521s | [build.log.gz](verification/build.log.gz) |
| npm run test:browser:fixture | 186/186，exit0，跳过0 | 130.371s | [test-browser-fixture.log](verification/test-browser-fixture.log) |

唯一红项是`src/harness/browser-fixture-scheduling.test.ts:109`：`browser outer guard identifies unfinished files and retains buffered output`没有在超时诊断中看到预期`a-held lifecycle step`。这不是组装规则断言，也不计入上述检错成绩。

按用户要求，在另一干净工作树上检出精确`main@6db445ea9afdbe5debdc60efc1107f768434c555`，使用相同`npm test`、Node v24.4.1和相同package-lock，未增加参数或修改样本/测试。最多3次的有界复现保留全部结果：

| main运行 | 实际结果 | 原始日志 |
| --- | --- | --- |
| 第1次 | 1272/1272，exit0 | [attempt-1](baseline-main/npm-test-attempt-1.log) |
| 第2次 | 1272/1272，exit0 | [attempt-2](baseline-main/npm-test-attempt-2.log) |
| 第3次 | 1271/1272，exit1；同一测试、同一109:12断言 | [attempt-3](baseline-main/npm-test-attempt-3.log) |

[复现机器记录](baseline-main/results.json)证实三次前后工作树均为空、HEAD不变；没有舍弃前两次通过来伪装稳定失败。[逐字比较](prior-code-comparison.json)确认该测试和两份调度脚本在main与本分支完全一致；新门禁及SF退役之前就能发生相同失败，不归为本批引入。

单文件对照也保留：本分支2/2通过（[日志](scheduler-diagnostic.log)）；干净main2/2通过、exit0（[日志](baseline-main/scheduler-alone.log)、[receipt](baseline-main/scheduler-alone.json)）。这说明单文件绿不能替代全套运行。

**归档分类：既有失败，修复在C分支`5683dcfb`，待合入。** 未复制、cherry-pick或改动C的文件；不跳过、不改断言、不改等待/并发/deadline，不通过反复重跑本分支取一个绿色结果。复核者安排C先合main，本分支随后同步再重跑；当前五门禁全绿签收未完成。

## SF引用与Test Skill交付核查

- [rg机器记录](retirement-reference-check.json)：当前README/AGENTS、docs、src、scripts及package.json中，无旧命令、旧class/function或四个退役模块引用。rg退出1表示无匹配，stderr为空；历史、Superseded、旧复核目录显式排除并保持原文，不能把这些审计材料当当前入口。
- [机械等价证据](mechanical-equivalence.json)：两份Runner、source-stage helper、native测试和Web测试的去注释转译JavaScript与8743f56b一致；原有断言没有改动。
- [Test Skill实际diff](test-skill.diff.gz)：只增加一条组装门禁及签收来源规则；其他章节不改。Eval Skill只删除批准的一行。额外两个当前文档引用按用户追加授权最小清理。
- 复核附件保存为[停止点1复核](stop1-independent-review.md)；[来源SHA记录](prior-code-comparison.json)注明Markdown副本仅比粘贴原件多一个EOF换行，正文完全保留。历史原件和停止点1报告未改。

最后归档仅新增证据/当前说明和批准的两处文档引用清理，执行代码相对冻结实现无变化，因此不重复整套检查。没有运行Live、真实模型、Google、餐厅网站或见证请求，未读取/暂存.env。

原始typecheck/build输出及Skill diff使用无损gzip保存，保留原始空行/patch上下文，不裁剪为通过空白检查；[证据SHA清单](evidence-sha256.json)同时记录压缩件与解压字节的SHA。

## 完成边界与交接

| 必交付 | 当前状态 |
| --- | --- |
| TS/MJS目录规则、25核心、类型豁免 | 已实现，正常控制与目标反例通过 |
| 精确组件清单、未知键/陈旧拒绝 | 24对已登记，真实arch链及默认回归验证 |
| SF退役、替代覆盖、当前引用清理 | 已完成；77/77退役前对照及rg记录 |
| Web夹具范围纠正、Test Skill单条规则 | 已完成；原有断言/业务行为不改 |
| 五门禁全绿 | **未完成**；4/5，唯一红项已在干净main独立复现，等待C合入后同步重跑 |

本分支仅交独立复核，不合main。新门禁不证明真实模型理解、自由文本质量、当前网站兼容性或所有传递调用/计算路径；G1/G4等整组装覆盖仍由A负责，G6新入口合入时必须过本门禁。这里没有以全仓数量替代这些证明，也没有改写既有能力评价结果。
