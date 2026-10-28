# G1 停止点1修订：独立追问预算

2026-10-28（Vienna CET，UTC+1）。Evidence status：current offline integration regression；已暴露输入，真实模型问答质量未评。具体执行时间见[门禁收据](verification/gates.json)。

**本批完成，停下等复核。** 工作分支 `codex/feat-phase3b-g1-followup`；受测提交 `51c144002077a1af85c7ab79d830903588420d77`。完成后只推工作分支，不合main，不进入真实模型评测或G3。实施前已核对origin/main仍为90b464d8，无并行版本冲突。

## 配置与产品行为

配置在 `src/domains/restaurant/page-question-limits.ts`，由代码持有，客户端和模型不能修改：

| 上限 | 默认值 | 依据 |
|---|---|---|
| 每题时限 | 提交起60秒 | 覆盖既有45秒事实候选读取及回答/收尾；提交后的持久化、取消旧题和读取均在截止内 |
| 每题模型调用 | 3次，失败调用也计数 | 回答及最多两次必要观察/事实解释；唯一动作不再消耗一次Agent决策 |
| 每题新页面访问 | 2次，跨session累计 | 已绑定入口及一个观察到的相关页；文档navigate/OPEN_LINK计数，超额在传输前拒绝 |
| 每conversation问题数 | 20个不同的已接受问题 | 成本上界60次模型、40次新页面访问；包含取消/未核实，重复requestId不重复扣题 |

静态资源、同页快照不算新页面访问；重定向继续经过原Guard。节奏仍由既有F2评测传输装饰器执行，新reader包装保留传入runtime及其装饰，不另设调度器或改变来源规则。复杂页面可能在这些上限内无法完成，必须如实UNVERIFIED，不暗增额度或重试。

追问保留原结果的同店身份、readRunId和来源入口绑定，先复用本次缓存；缺缓存沿既有Native/官网reader读取。删除了原搜索readWindows、resume和已完成运行的浏览器预算快照依赖。每题独立计量，原500秒截止、49/50已用次数以及重启丢失内存都不阻止新问题；原结果和原搜索计量不变。失去缓存时仍须重新通过既有身份核对，不凭店名或模型URL补造页面。

20题上限从持久PAGE_QUESTION_REQUESTED事件统计。计数在取消旧题后的最新快照上检查，再用Runtime版本条件提交；未通过用户/店/版本检查的请求不接受。达到上限通过已有英文错误展示提示“Please start a new search.”。

只有显式卡片追问且唯一合法动作为ANSWER_PAGE_QUESTION时由代码选择，仍经Validator、Router、Reducer。轨迹写明代码选择，modelAttempt为空；普通开放式Agent决策仍由模型选择，不建立一般化的固定动作流程。回答本身仍经过模型和原引用核对。

## ADR、版本与不变边界

ADR-0046修订至 **Accepted revision0.3**，记录2026-10-28用户批准的独立预算和唯一动作限定例外。§3已替换“无新预算/继承原整单”的旧合同；其他批次证据描述保留历史范围，实施事实见STATUS。

State24、TaskDefinition22、Agent Prompt29、Action Schema5、Context17及独立问答Prompt/Schema2均不变。题数复用持久事件，截止使用已有问题字段；没有新增State字段、Reducer分支、数据库迁移或兼容路径，因此无需再递增State/TaskDefinition。上述版本文件与上次交付字节相同。

同店/run/引用、HARD、搜索和库存资格、授权、Guard均不放宽。共享Browser目录、两个站点目录、source-packs.ts、身份/语义及src/eval未改。两站非测试TS仍 **3,847行**，Pack单列 **473行**，G3行数目标留后续。[行数明细](adapter-lines.json)。

旧HARD完整事实结果仍 **44,197字节**，SHA-256 `9a3298bc5e004b99e41d80713e8913b68c336cfa594f6eb60599e310ee3fb633`，包括文档、语句选择、模型请求、Native evidence/checks和固定时钟元数据，逐字节一致。[检查](hard-compatibility.json)。

## 有效红灯、绿灯和检错范围

`4a8f0881`冻结后，旧生产路径的6项HTTP/PGlite控制全部在目标业务断言失败，非类型、启动或环境错误。[红灯日志](red.log)／[冻结输入](red-inputs/freeze.json)。最初无消息的assert.ok在Node24上出现昂贵失败诊断，补显式消息后完整红灯约4秒完成；没有把挂起或外层超时算红灯。

| 主要失效机制 | 红灯 → 绿灯证据 |
|---|---|
| 原搜索第520秒后追问 | 旧UNVERIFIED → ANSWERED；用注入时钟推进520,000ms，搜索结果/原计量不变 |
| 原搜索已用49/50模型 | 旧无法回答 → 使用独立题预算回答；原计量仍49，缓存命中只需回答模型1次 |
| 服务重启 | 旧RUN_BUDGET_UNAVAILABLE → 新Application、reader、model实例重连同一持久库，无旧缓存，真实身份reader重新读1页后回答 |
| 追问自身超过60秒 | 旧未按题截止 → 推进60,001ms后丢弃迟到结果，UNVERIFIED/BUDGET_EXHAUSTED；下一题正常回答 |
| 追问尝试第4次模型调用 | 旧超额可继续 → 只3次进入传输，第4次拒绝；下一题正常，原搜索计量不变 |
| 第21题与重放 | 旧HTTP200 → 重启后400并提示新搜索；重复requestId不多算，拒绝时0模型/0页面 |

上述及原有伪URL/未展示店/跨用户/旧版本/引用/敏感/取消/较新问题/迟到结果控制，修后HTTP **9/9** 通过，最终均包含在默认门禁。只替换模型传输及商户浏览器I/O，真实HTTP、持久应用、身份解析、核心、Validator、Router和Reducer参与，未手填问答成功State。

独立reader/gateway单元 **6/6** 通过；其中真实取消控制将题预算缩为20ms，reader只等待AbortSignal，无外部就绪观察窗口，证明到点主动取消；默认60秒和迟到拒绝另由注入时钟控制，未用真实60秒等待。

真实Chromium读取两页，观察到的链接用于第二次OPEN_LINK，第三次及另一session第四次访问均未到接收器；Guard仍阻止未审核POST。绕过上限的已提交反事实脚本使“应拒绝第三次”的断言失败，随后源码逐字节恢复、git status为空，再跑正式绿色门禁。[反事实收据](page-cap-control/control.json)／[脚本](verify-page-cap-control.py)。

## 最终五门禁

macOS26.6.2 arm64，Node24.4.1。受测51c14400，Chromium文件并行4；本批首轮正式门禁全部通过，修复次数0。每项前后git status为空，restorations=0，无fail/skip/cancel。此次Chromium为单次，不称三次中位数；本修订Linux未跑，留独立复核。

| 门禁 | 结果 | 用例/耗时 |
|---|---|---|
| typecheck | PASS | 0.419秒 |
| arch:check | PASS | 0.184秒 |
| npm test | PASS | 1168/1168，27.555秒 |
| build | PASS | 0.408秒 |
| test:browser:fixture | PASS | 175/175，106.350秒 |

[完整日志和门禁JSON](verification/gates.json)／[核验摘要](verification.json)。675份输入和外层脚本先提交再运行，运行后、交付前再次核对。冻结清单SHA-256 `0b6cae3c559e1a7a9ddb91f8c4a377eb1f186cdad89bfed81c4e801c1e3bca32`；外层run-gates.py SHA-256 `6e08a59053e812d2f5101eafe46c2b53e44712ff1c080745b3e14b93b478077c`。

## 证据归因、调用与停止

输入来自最小合成本地商户页、显式问题、独立身份原文和已提交配置；执行是HTTP/PGlite生产组合加真实本地Chromium，模型传输为fixture。接线与预算机制通过不等于答案忠实度、敏感分类或“未说明”语义达标。A独立评分仍为下一停止点，未读答案、未自行评分；合成HTML不称Replay或Live。

共享账本保留原条目，按id追加本批0调用，现22个唯一id；新增真实模型、Google、餐厅网站、Live、环境重跑、评测公开GET均 **0**。未读/复制/暂存.env，未读取或哈希answers*.json。既有敏感和未标记评论等质量边界不因离线全绿消失。

报告、STATUS、DEVLOG、TEST-LOG、月度摘要和索引同步后，只推工作分支。实际远端收据随后附加；受测提交之后的收尾只改文档/产物，冻结源码不变。完成本批，停止等待复核，不进入真实模型评测或G3。
