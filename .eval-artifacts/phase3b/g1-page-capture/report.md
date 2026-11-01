# G1追问页面获取：产品反例已修，等待A调度测试归属安排

2026-11-01T07:39:00.145945+01:00，维也纳CET（UTC+1）。**PRODUCT_FIX_VERIFIED / DEFAULT_GATE_FAILED_A_OWNED / NOT_PUSHED / NOT_INTEGRATED**。按文件归属边界停下，不宣称五门禁全绿。

分支`codex/fix-phase3b-g1-page-capture`，起点main **6db445ea9afdbe5debdc60efc1107f768434c555**；产品提交 **847359b3f92647e36f73f1c8d47aa8da40d8b532**；完整验收候选 **789bfc024042c774243cd36b6771be9c30894ae9**。后续a2a5829a仅增加剩余诊断脚本，全部728项原冻结输入与产品/测试字节仍同789bfc02，不以该诊断绕过已失败的默认门禁。

## 修复和范围

唯一非测试产品文件是`google-then-website-facts.ts`，实际差异5行添加/3行替换：[完整diff](product.diff)。

- 选取官网候选改为已有URI且（capturePagesOnly 或 原有needsWebsiteFactEvidence）。显式追问取页不再受原HARD/营业时间/商业字段缺口控制，也不编造HARD条件。
- 网站/无网站两个返回分支，capturePagesOnly时均不进入组合层HARD判断；页面仍由原GoogleListedWebsiteFactRead产生身份和观察hook。
- SourceAwareFactRead的标志透传、NativeSourceFactRead的Tabelog/TC捕获分支本已生效，未重写；三来源真实组合控制证明其读页和同店/本run原文。
- 没有标志时条件与判断路径完全相同。没有第二套G1读取器、手填bound page、宽松身份或Guard、UNKNOWN→PASS补丁、State/TaskDefinition/Prompt/Schema变更。独立60秒、3模型、2页和会话20题配置及取消全部原样。

## A原P4红灯→绿灯

A冻结输入 **27cf175c341da74e4a55b7698fbe9187afadb7ff**，其5个新增评测/fixture文件SHA全部不变。本分支未合入或修改A的未签收预检文件；复现只在稀疏临时clone中运行A命令：

```text
node --import tsx src/eval/restaurant/agent-loop/g6-development-preflight.ts --out <fresh-directory> --path P4
```

- 红灯B0c11c96e：临时clone的产品与A原样相同，初始正常交付成功，既有ANSWER_PAGE_QUESTION路径返回 **UNVERIFIED / NO_BOUND_PAGE、checkedPages=[]，问答模型0次**，原断言失败。[原始执行](red/execution/preflight.json)、[冻结收据](red/receipt.json)。
- 绿灯B847359b3：同一A命令，临时clone仅覆盖这一个产品文件并独立提交至净树；不改A页面、问题、模型传输、场景、期望或断言。结果 **ANSWERED、问答模型1次**，同一已展示candidate，逐字引用：
  > A private room is available for groups of four or more.

  页面 `https://tabelog.com/en/tokyo/A1301/A130101/13123456/`，readAt `2026-11-01T06:00:00.000Z`。答案保留“至少4人”的条件，不据此宣称原2人请求可使用包间。[原始执行](green/execution/preflight.json)、[收据](green/receipt.json)。后续只修本批新增fixture的null契约和增加门禁脚本，产品SHA与该因果绿灯完全一致，未无故重复P4。

A的生产组合保留Persistent application、Interpreter/Compiler、PGlite Runtime/Reducer、Agent/Validator/Router、createLiveReadAssembly；只替换模型、Google和页面来源传输，是**本地构造来源**，不是当前网站Replay或Live。临时clone未materialize .env或QA答案目录，没有预载手工identity/PageObservation来凑绿。A五文件SHA在各冻结清单的AInputs，执行前后核对，原分支文件未动。

## 组件红绿和安全控制

修复前612711ed：16项中9通过/7失败（含父测试），Google无HARD缺口无法回答、未说明无法到模型、取消不触及读取、组合层两HARD分支等预期断言失败；Tabelog/TC正控制及旧run/异店/期限控制本已通过。真实Chromium旧两页/Guard控制通过，新捕获Guard控制因尚未进入网站reader而失败；不是启动/类型错误。[红灯收据](controls-red/receipt.json)。

修复后的事实/问答全部组件 **114/114**，真实Chromium Guard **2/2**。[绿灯收据](controls-green/receipt.json)。首轮绿灯为113/114，原因是本批新fixture对NOT_STATED给了空字符串，现有Schema要求null；26562d9f只改fixture，不改产品Schema/断言，首次失败保留于[原始日志](controls-first-green-failure/unit.log)。

| 机制 | 行为证据 |
|---|---|
| Google、Tabelog、TableCheck，无HARD缺口 | 实际SourceAware/官网/Native reader→question core，逐字引用、同店URL/readAt、仅1次问答；无HARD/menu模型 |
| 页面确实没写 | 读完绑定页、调用问答后返回NOT_STATED及checkedPages；不把没有页面当未说明 |
| 同名其他分店 | 三路不同canonical/来源ID或地址，UNVERIFIED、checkedPages空、问答模型0 |
| 不同run | 旧页先经真正Native reader生成缓存；新run读取失败时拒用旧缓存，UNVERIFIED、问答模型0 |
| Guard | 真实Chromium安装Guard后拒绝未审核/checkout；独立HTTP接收器0请求、没有可问页面/模型。相同reader合法/merchant正控制回答，并只收到GET /merchant |
| 独立预算/取消 | 已耗尽截止在任何Google/浏览器/模型前UNVERIFIED；读取中取消保留AbortError、不调用问答，下一题照常回答；既有3模型/60秒/2页/持久取消回归均保留 |

所有既有事实测试文件不变；原page-question-budget浏览器测试全文是当前文件的字节前缀，仅追加一个生产组合Guard正反控制。State、TaskDefinition、Prompt、身份、Guard等保护SHA见[保留清单](preservation.json)。

## 门禁与唯一阻断

| 检查 | 当前结果 |
|---|---|
| typecheck | PASS |
| arch:check | PASS |
| npm test | **1287/1288，1失败**，不可宣称五门禁全绿 |
| build | PASS |
| test:browser:fixture | **187/187 PASS**，129.629秒 |
| PRAXIS_G2_REQUIRE_PASS=1 test:dom-change | **5/5测试、12/12页面PASS** |
| 旧HARD完整回归 | **44,197字节逐字节相同**；SHA `9a3298bc5e004b99e41d80713e8913b68c336cfa594f6eb60599e310ee3fb633` |

原失败矩阵[收据](gates-stopped/gates.json)与[完整默认日志](gates-stopped/npm-test.log)保持FAIL。剩余检查是明确标记的诊断继续，不重新运行默认以碰运气、不跳过失败或伪装SATISFIED：[其余收据](remaining-checks/gates.json)、[严格逐页](strict-pages.json)。每项执行前后净树，728项冻结SHA相同，无restore/skip/todo。

唯一失败：`src/harness/browser-fixture-scheduling.test.ts:109` 的“browser outer guard identifies unfinished files and retains buffered output”，期望a-held未完成记录的lastObservedTests包含“a-held lifecycle step”，实际未观察到。FILE/测试事件经独立进程管道到达，测试驱动在已收到partial output、b结束、c开始后推进外层时钟。当前源码说明测试事件可能缓冲；本次只记录失配，不擅自认定应删除或降低断言。

该文件来自A的09ce7536，文件及两个外层scripts与main6db445ea字节相同，也没有G1产品依赖；这是本轮发现的调度/观察控制失败，**未对未改main整套重复测量，未声称main也已实测失败或缺陷已关闭**。按既有“A负责harness、改对方文件先报告”的归属边界，未改该文件。已向用户请求：交A修复后同步，或明确授权B只修该测试的同步控制并保留原断言。没有安排未经授权的新调用或改评分口径。

## 评价和交付状态

受控端到端：A原P4从安全未知变为逐字引用的ANSWERED；逐环节：明确问题动作、原事实链产页、HIGH同店/run核对、代码引用验证均到达。原故障是CAPABILITY_MISS，修复不引入猜测；本轮真实模型质量、当前库存/页面与独立Live S0仍NOT_EVALUATED。不能从组件绿或无真实调用推导S0=0。输入是已暴露的开发构造回归，不是Clean Holdout。

真实模型/Google/餐厅网站/Live/公开GET/环境重跑新增**全部0**。共享账本保留main500条并并入A已知1条0调用，再追加本批0调用，共502条，累计仍171模型/255公开GET/12 Google；main现有额度保留，不借用A分支另外调整的G6限额。[并集凭据](ledger-append.json)。未读取.env或QA参考答案。

最终源输入冻结SHA **7aeadfefe999f4a79489fcf79b2d0afd1e51314ac80cb7305965f3ac0691931d**，首轮P4红灯/组件红灯/绿灯冻结分别见input-freeze-red、input-freeze-controls-red、input-freeze-green及attempt-1文件；外层脚本均先提交再执行。源代码保持789bfc02，报告归档后再核对SHA和净树。

**尚不满足“全绿后推送”的交付条件；本工作分支尚未推送，不合main。等待调度测试归属安排后再完成全量门禁与通知A。**
