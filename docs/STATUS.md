# Praxis 当前状态

- Status: Accepted
- Document revision: 4.1
- Last updated: 2026-09-09
- Source of truth for: 已实现能力、已验证范围、明确未验证项与下一道门槛
- Related ADRs: [ADR Index](decisions/README.md)
- Related documents: [Documentation Index](INDEX.md), [Roadmap](roadmap.md), [Verification History](history/TEST-LOG.md)

## 一句话状态

ADR-0014定义了H001所需的只读终态：Semantic Interpreter继续经Compiler/Reducer写入权威State；单一Restaurant Agent只接收最小Decision Context，Action Validator守护不变量，Router绑定权威只读请求。`restaurant-state@10`保存Availability Check、最小Read Evidence和`PRESENT_RESULTS`。2026-09-08 的原始冻结 LOCAL_CHROMIUM H001 从 Google Discovery 调查 10 个去重候选，按 3/3/3/1 批次继续；其中 KINKA Sushi Bar Izakaya 渋谷以 Google 结构化地址组件支持 `near Shibuya`、TableCheck exact phone 达到 HIGH、来源页验证 `omakase` HARD criterion，并读取同一 2026-09-08、2 人、19:00 的公开 slot。Runtime 已进入 `PRESENT_RESULTS`；artifact 只保存脱敏 identity/provider/browser diagnostics 和 evidence 引用，不保存 HTML、凭证、Cookie 或挑战 token。该次 Live Read-only 不代表每个门店/日期均可用，也不代表 Web 页面上的真实交互已经验证。

## 2026-09-05整改与最新人工对照

用户报告普通Chrome可打开Tabelog；关闭VPS并使用无痕后可打开TableCheck。后者同时改变网络与会话条件，仅证明该组合可访问，不证明单一原因，也不构成Praxis Adapter的Live通过证据。用户还报告后续H001已越过Semantic/Agent、停在Tabelog挑战页；前述MODEL_FAILURE属于此前实验记录，不再作为当前稳定阻塞判断。

仓库规则、配置与路线已收敛。独立[单页诊断](harness/BROWSER-READ-DIAGNOSTICS.md)无需模型或Google，保留开始/结果记录并区分页面观察与业务验证。真实Chromium + 本地动态Fixture为3/3通过；普通基线159/159、typecheck、arch:check、build通过。未重跑付费模型、私有Holdout、真实来源或H001；TableCheck/Tabelog当前页面兼容性及完整只读搜索结果仍未验证。C类职责重构按[整改清单](REPOSITORY-IMPROVEMENT-PLAN.md)延后。

## 2026-09-06 Tabelog搜索入口修复

用户在TUN下普通Chrome成功访问的准确URL是英文`/en/rstLst/`。Live Read-only同一当前网络、fresh headed Chromium对照：旧`/rstLst/?sk=Ginza`及无query旧路径均307→403，响应头`cf-mitigated: challenge`；用户英文URL200，仅加`/en/`保留`sk=Ginza`也200。英文`sw=Ginza`返回名称匹配餐厅，无匹配测试词返回零餐厅链接，确认英文关键词参数应为`sw`。这是本次访问中路径敏感的challenge差异，不是站点内部WAF规则或实际出口的完整因果解释。

Adapter已改用`/en/rstLst/?sw=<encoded outlet name>`，同步诊断URL脱敏；搜索解析不再把`list-rst__rvw-count-target`评论数量链接当餐厅。修复后fresh headless Chromium一次Live只读搜索返回200，解析得到5个真实餐厅名称及详情链接，无评论页候选。未使用个人profile、持久Cookie、验证码自动化或routing变更。TableCheck仅首页`/en/japan`观察到200；H001、HIGH identity、日期人数和slot仍未在本轮验证，不将搜索页可读等同于availability完成。

## 2026-09-06 TableCheck公开发现修复

历史H001只把英文店名派生为两个guide slug，六次猜测路径都无法提供可靠门店结果。当前Adapter改用TableCheck公开`/en/japan/search`：名称与Google坐标只用于发现；渲染出的guide页逐一读取，仍仅由exact phone或name+full address授予HIGH。Sushi Inase的本机只读观察返回`/en/sushiinase`及Shinjuku同名分店，Sushisho Issekisancho返回`/en/sushisho-1seki3cho`；两家guide页公开电话都与Google精确相同。详情页的实际reservation链接或嵌入Availability结构才可成为下一页，不再构造reservation slug。artifact诊断现保留搜索页、发现URL、详情页和canonical URL、字段来源/规范化值/比较、reservation target及非HIGH原因；四种失败分为`TABLECHECK_DISCOVERY_NO_RESULT`、`TABLECHECK_ENTITY_MATCH_UNCERTAIN`、`TABLECHECK_PAGE_UNAVAILABLE`与`TABLECHECK_PARSE_FAILED`。

离线162/162、typecheck、architecture与build通过后，只运行一次新的LOCAL_CHROMIUM H001。Semantic、两次Agent decision和Google discovery均成功；第一个TableCheck动态搜索占满既有25秒Browser read deadline，Router安全地将三个候选记为`BROWSER_TIMEOUT`并以`EXECUTION_FAILURE / FAILED`结束。唯一已落盘的TableCheck诊断是搜索页级`TABLECHECK_PAGE_UNAVAILABLE`；没有到达详情或reservation页，也没有形成HIGH identity、slot、availability或`PRESENT_RESULTS`。这保留了来源约束，不能把超时解释为无空位或完成。

## 2026-09-07 受控浏览器执行、H001 与本地 Live Web

ADR-0017仍为`Draft / authorized local-eval implementation`，不改写既有Accepted授权或预约决策。两个来源现在经同一`BrowserTaskExecutor`复用一个会话；站点方法和受控模型动作均受来源、观察版本、权威日期/人数、只读控件、操作次数、模型次数、总自动时限与父级取消约束。模型只可提议由代码生成的当前元素引用，不能给出selector、自由URL、JavaScript、凭据或提交动作；网页文本不作为指令。Router超时会取消并等待来源收束后才返回，不会留下后台点击。LOCAL_CHROMIUM真实动态Fixture证明此机制及无站点专用方法的路径，但该Fixture不等同于真实来源成功。

本地Web新增明确`PRAXIS_RESTAURANT_PROVIDER_MODE=LIVE_READ`服务端组合；默认仍是`FIXTURE`，缺少Live gate、DeepSeek/Google或所选浏览器运行时配置会启动失败，绝不回落或混入Fixture候选。Web与H001共用同一Live availability组合，显示证据结果、来源链接或稳定失败原因；没有登录、授权、预约、支付、取消、PII提交、远程接管或公网部署。该接线已由本地HTTP/SSE Fixture及配置Contract验证，尚未把Web页面上的一次交互报告为真实来源成功。

本轮只读TableCheck单页探针为`CONTENT_OBSERVED`，没有控件操作或业务结论。随后H001在严格wire占位适配及日本`+81`/国内号码正规化修复后，Google Discovery成功，三个候选均有结构化`near Shibuya`证据；Sushisho Isseki Sancho与其Tabelog详情以`EXACT_PHONE`达到HIGH。其availability跳转到当前不支持的外部预约提供方；其他两个候选未能达到HIGH，TableCheck动态搜索页仍为`TABLECHECK_PAGE_UNAVAILABLE`。因此没有slot、Offer或read Evidence，Case保持`NEEDS_INPUT`，并未进入`PRESENT_RESULTS`。这次Live失败不表示无空位，也不构成H001通过。

## 2026-09-08 H001 完整 Live Read-only

本轮先通过当前工作区的全量离线门禁（`npm test` 195/195、typecheck、arch:check、build、`git diff --check`）及真实 Chromium 本地 Fixture 5/5。随后仅运行一次原始冻结 H001：`.eval-artifacts/restaurant-hybrid-live-read/2026-09-08T07-41-45-298Z-3bd0ad52-bdc3-4fe1-8bb1-e19fd41737bc.result.json`。DeepSeek Semantic、6 次 Restaurant Agent decision 和 9 次 browser read decision 均完成；总耗时 232,348 ms。业务 Agent 先搜索 10 家、连续检查四个至多三家的批次，前 9 家分别保留明确无位或来源级失败，未重复检查或要求用户替系统解决内部来源问题。第 10 家 KINKA Sushi Bar Izakaya 渋谷由 TableCheck exact phone 完成 HIGH outlet identity，来源页支持 `omakase`，且公开结果给出同一请求 `2026-09-08`、2 人、19:00 slot；确定性 Grounding 生成 Offer 后 Agent 执行 `PRESENT_RESULTS`。全程没有登录、个人资料、预约提交、支付、取消或其他外部写入。H001 已通过其原始 read-only 标准；Web Live 仍只完成服务端组合/HTTP-SSE Fixture，尚未单独报告一次 Web 页面真实来源交互。

## 2026-09-09 运行诊断与跨场景预检

Hybrid runner现会保留执行artifact后生成独立的`restaurant-hybrid-read-diagnostic-evaluator@2`报告；它逐个presented candidate检查实际引用的evidence/offer、HIGH identity/source关联、完整请求、当时有效期、真实轨迹Provider attempts、重复执行和完整资源记录，缺记录明确为`NOT_EVALUATED`，不把产品`PRESENT_RESULTS`或同类证据存在当作质量通过。正常成功、失败和取消收尾均在保存execution artifact后尝试评价；评价故障另存sidecar且不覆盖执行错误。已对2026-09-08成功artifact及一个历史失败artifact离线补评：成功记录独立得到`taskProducedQualifiedResult=YES`与`evidenceSufficiency=SUFFICIENT_FOR_PRESENTED_RESULT`；历史失败记录保留为`NOT_EVALUATED`，并定位其TableCheck/Tabelog provider failures与缺少resource accounting。完整E2E rubric仍未集成；否定HARD来源契约亦未评估。未来run会记录非敏感git/工作树、浏览器、Skill hash、预算与模型调用元数据；不落盘原始用户输入、Cookie、token或Secret。

H002–H005静态物化预检确认相对日期现同时替换结构化参数和人类可读eligibility文本。尚未获这些场景的独立Live预算：H002的负向HARD与价格/first-date事实、H003/H004/H005的`NEAR_USER`位置与来源支持均无可用Live evidence；H004还要求非预约的营业状态事实。它们因此均为`NOT_EVALUATED`，不是失败或通过。Local Web Live仍被本机PostgreSQL缺失阻塞：当前`.env`的`DATABASE_URL`不是PostgreSQL URL，且历史专用本机端口55432未监听；服务端现会在迁移前明确拒绝这类URL。

## 当前标识

| 对象 | 当前标识 |
|---|---|
| 产品Release | 尚未发布；package为`0.1.0` |
| 当前架构决策 | `ADR-0014` + `ADR-0015`来源证据范围 + `ADR-0016`本地eval profile |
| Restaurant State | `restaurant-state@10` |
| Semantic Proposal / Draft / Eval Schema | `restaurant-semantic-proposal@3` |
| Semantic Prompt | `restaurant-semantic-prompt@7`；Artifact字段仍记录`promptVersion: "v7"` |
| Agent Context / Decision Prompt / Action / Trajectory / Harness Artifact | `restaurant-agent-context@2` / `restaurant-agent-decision-prompt@6` / `restaurant-agent-action@3` / `restaurant-agent-trajectory@5` / `restaurant-harness-artifact@6` |
| Regression / Holdout / Scorer | `restaurant-semantic-regression@3` / `restaurant-semantic-holdout@2` / `restaurant-semantic-scorer@3` |

## 已实现

| 能力 | 当前范围 | 权威说明 |
|---|---|---|
| Web / Workspace | 本地 Fixture、持久 Conversation / Case、HTTP/SSE 恢复与Agent选择的Candidate/Offer投影；停在授权前 | [MVP PRD](product/MVP-PRD.md)、[Workspace](architecture/AGENT-GATEWAY-AND-WORKSPACE.md) |
| 语义主链 | `Semantic Interpreter → Proposal Contract → Compiler → Runtime/Reducer`；稳定槽位加开放`criteria`，完整Domain JSON Schema经strict transport发送，随后仍本地校验；模型不能直接改 State 或调用 Tool | [ADR-0009](decisions/0009-semantic-strength-and-clean-holdout-baseline.md)、[ADR-0010](decisions/0010-restaurant-agent-loop-action-validation.md)、[ADR-0011](decisions/0011-restaurant-agent-loop-control-refinement.md)、[Orchestration](architecture/AGENT-ORCHESTRATION.md) |
| Agent、搜索与轨迹 | 单一Agent的最小`Agent Context → Action Proposal → Action Validator → Execution Router`有界循环；Router绑定权威Search/Availability参数并中止超时read，Discovery Candidate与Availability Offer分离，三类Loop终止、BOOK proposal ID和Event/Command/Attempt/Evidence causal refs已持久化 | [Restaurant Domain](domains/RESTAURANT-BOOKING.md)、[Search Service](architecture/SEARCH-SERVICE.md) |
| 执行安全基础 | Runtime、Policy、Authorization、Verifier 与 `OUTCOME_UNKNOWN` 的 Mock / Embedded-postgres 闭环已存在 | [Policy & Verification](architecture/POLICY-EXECUTION-VERIFICATION.md)、[Task Runtime](architecture/TASK-RUNTIME.md) |
| Live Read implementation | Google Places hard deadline、Cloudflare CDP Browser Runtime（Kitesurf→一次Chromium fallback）、仅开发/eval的本地Playwright Chromium Runtime、TableCheck→Tabelog固定Availability Source Resolver，以及两个来源实际共用的有界`BrowserTaskExecutor`均已实现并以Fixture覆盖；受控浏览器模型只能操作当前已观察的只读元素，Domain仍独占HIGH identity、HARD、slot和`PRESENT_RESULTS`判定。TableCheck provider失败会透明进入受限Tabelog fallback，两个来源均失败时为候选级`AVAILABILITY_SOURCES_EXHAUSTED`；明确`LOCAL_CHROMIUM` interactive + Tabelog manual-intervention eval保持同一页面等待人手完成站点验证，恢复后仍用既有HIGH/slot检查；artifact保留脱敏的identity、provider-attempt、browser阶段和intervention诊断，challenge token不落盘；`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM`不触达Cloudflare。本地Web可显式组合相同Live Read-only路径，默认不变 | [Restaurant Domain](domains/RESTAURANT-BOOKING.md)、[Capability Matrix](integrations/CAPABILITY-MATRIX.md)、[ADR-0017](decisions/0017-controlled-browser-read-executor.md) |

## 已验证的证据

| 模式 | 结论 | 不代表什么 |
|---|---|---|
| 当前产品 Unit / Fixture / Mock / Embedded-postgres | 包含TableCheck公开发现/identity/reservation parsing、TableCheck→Tabelog source chain、受控浏览器wire/观察/取消/同会话Contract与显式Live Web组合的完整离线基线通过；typecheck、arch:check与build通过 | 真实PostgreSQL、真实Provider、Clean Holdout质量或浏览器视觉 |
| `REAL_MODEL_MOCK_WORLD` | 已暴露`restaurant-semantic-prompt@7` Regression为`15/15`：15 calls全成功、0 retry、28,817 ms、44,466 reported tokens；它只证明当前公开样本的transport与语义回归 | Clean Holdout、泛化质量、真实餐厅事实、预约质量或模型 Baseline |
| `HOLDOUT_BASELINE` | 首份私有Baseline严格Preflight为15 session / 25 turn / 0 issue后只运行一次：15次模型调用全成功、0 pass、15个`SEMANTIC_RESULT`失败、10个上游阻断；artifact标记为`EXPOSED / RESULT_EXPOSED` | 不能以已暴露结果继续调优后宣称其仍是Clean，也不证明真实餐厅事实、预约质量或浏览器视觉 |
| `EXPOSED_HOLDOUT_REGRESSION` | `restaurant-semantic-prompt@5`对同一已暴露数据只运行一次诊断：16 calls全成功、3 / 25 exact pass、9个上游阻断；`restaurant-semantic-prompt@4`可比15 turn为0 → 2 exact pass。版本化字段分析记录保留原始结果且不重跑模型 | Clean Holdout、Prompt `@5`泛化质量、真实餐厅事实、预约质量或模型 Baseline |
| `EXPOSED_GOLD_ACCEPTANCE_DIAGNOSTIC` | 当前canonical Gold上的`restaurant-semantic-prompt@6/@7`诊断均为16 calls全成功、4 / 25 exact pass、9个上游阻断；Prompt `@7`仅以24个`COMMON_UNCHANGED_TURNS`比较Prompt `@6`，exact pass为3 → 3，H007因没有Prompt `@6`快照继续排除 | Clean Holdout、与Prompt `@4`整集直接对比、Prompt `@7`泛化质量、真实餐厅事实、预约质量或模型 Baseline |
| 冻结架构探针 | 独立`test:probes`为`8/8` | Restaurant当前产品质量或Stage完成度 |
| `REAL_MODEL_MOCK_WORLD` | 历史Semantic Proposal Contract的Regression Smoke为`7/7`：7 calls全成功、0 retry、15,493 ms、18,955 tokens；因Prompt/Schema已替换，它现在只保留为历史transport证据 | 当前`restaurant-semantic-proposal@3` transport、泛化质量、真实餐厅事实、预约质量或模型 Baseline |
| 隔离本机 PostgreSQL Smoke | 曾验证 Runtime、迁移、Goal/Task Graph 与 Scheduler | 生产数据库部署或持续运行可靠性 |

真实模型 Regression 样本及结果已暴露，统一标记为 `DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。完整命令、失败口径和历史结果只在 [Test Log](history/TEST-LOG.md) 维护。

## ADR-0013 Agent Loop口径

- 当前产品主链为 `Semantic Interpreter → Proposal Contract → Compiler → Runtime/Reducer → Agent Decision → Action Validator → Execution Router`。Agent只产生不可信Action；Validator不选择下一步；Runtime仍是唯一State writer。
- 没有任何确定性代码决定“无Candidate则再搜”或“A不可用则查B”；Harness以Scripted Agent分别证明第二次搜索策略和A→B availability trajectory。
- `SEARCH_RESTAURANTS`不重复Intent，`CHECK_AVAILABILITY`不重复日期、时段和人数；Execution Router从权威State绑定这些参数。Provider read失败、Router执行失败与模型决策失败使用不同Event和trajectory outcome。
- Agent只得到`restaurant-agent-context@2`，没有Authorization、Proposal terms、Execution Result、Evidence Artifact或Reservation；Provider read收到可中止的结构化8秒或Browser 20秒deadline。Context只含业务Availability状态和稳定reason code，不含Provider、Browser或URL细节。`DomainSearchStrategy.hasEnough`只表示Discovery检索预算已满足，不表示Availability、Loop终止或Booking授权。
- `BOOK_RESERVATION`只创建确定性Action Proposal并等待Authorization；Commit后的Verify与`OUTCOME_UNKNOWN`保护仍由确定性Runtime负责。`COMMIT_FAILED`或`BOOKING_ABSENT`完成其mandatory chain后，Orchestrator只在`SELECTION_REQUIRED`重新进入Agent Loop；旧proposal/authorization/attempt已清除，新proposal必须配新Authorization，Reducer拒绝proposalId不匹配的旧Authorization。
- `SELECTION_REQUIRED`投影为`RUNNING`，供Agent恢复；它不再残留`SELECT_CANDIDATE` pending-user action。timeout、step limit和rejection limit都写入明确终止状态和trajectory。
- 每个Agent decision step保存state版本/hash、capability、模型实际收到的脱敏`restaurant-agent-context@2`与`contextSchemaVersion`、action、verdict、route、observation、执行metadata、after-state链接、BOOK `proposalId`及Event/Command/Attempt/Evidence causal refs；不保存raw prompt或Chain-of-Thought。完整链为`Context → Action → Validation → Execution → Observation → State/Outcome`。
- 长期Execution Route仅为`STRUCTURED_ADAPTER`、未来`GENERIC_BROWSER`或未来`HUMAN_TAKEOVER`；Fixture/Mock/Live是运行模式或Provider metadata，Runtime/Policy checkpoint不是外部execution route。
- Migration `0006`保持原始evidence refs形态，`0007`追加因果引用与Proposal ID，`0008`追加Decision Context字段，`0009`追加read execution metadata；不会再改写Migration。`restaurant-state@7`和`@8`开发Task不能被当前Runtime解释，必须先备份后用双重开关的本机重置命令删除，绝不自动迁移或用于真实数据。
- 当前标识固定为`restaurant-semantic-prompt@7`、`restaurant-semantic-proposal@3`与`restaurant-state@10`。`CRITERION{text, polarity, strength}`是唯一开放集合，strength固定为`HARD` / `SOFT` / `UNSPECIFIED`。Agent Context为`@2`、Decision Prompt为`@6`、Action为`@3`、Trajectory为`@5`；不建taxonomy、Provider mapping或动态Tool Registry。
- ADR-0007的`DECIDE_RESTAURANT_NEXT` / `RESTAURANT_DECISION_MADE`以及耦合Offer的`ExecutableCandidate`可执行路径已删除；历史next-step标注只保留为语义评测审计输入，不再代表产品Runtime。
- `restaurant-semantic-prompt@4` Baseline的结果不得用于改动后重跑；Prompt `@7`的任何质量结论均需要另一份未见Holdout。当前Gold更新后的诊断只能标记为`EXPOSED_GOLD_ACCEPTANCE_DIAGNOSTIC`，Prompt `@7`与`@6`只比较`COMMON_UNCHANGED_TURNS`。
- 旧分类Criteria Contract下未运行的私有标注不兼容`restaurant-semantic-proposal@3`，不能迁入或报告为当前Holdout。当前空模板、私有入口、结构适配Preflight、确定性Scorer和一次性真实Runner已实现；runner在首个模型请求前写入Git忽略的`EXPOSED` artifact，并记录Dataset SHA、git SHA、scorer与prompt/schema hash。

## 明确未验证 / 未实现

- `restaurant-semantic-prompt@7`已完成本地、已暴露Fixture和当前canonical Gold诊断；需要另建未见 `CLEAN_HOLDOUT` 才能形成新的质量评价；
- H001 已有一次完整 Live Read-only 成功，但它是时间敏感库存观察，不证明任意未来运行、门店或日期；仍需单列的 Web 页面真实来源交互与移动设备兼容性验证；
- eval-only Tabelog人工验证恢复路径已通过Fixture；一次headed persistent LOCAL_CHROMIUM H001实验已在Semantic Interpreter `MODEL_FAILURE`处停止，未建立浏览器/页面，故尚未证明真实站点同一Session解除challenge后可继续读取；
- 真实 Authorization、Booking、取消、支付或 Controlled Live-write；
- 真实浏览器兼容性、真实移动设备、生产身份与生产 PostgreSQL 部署；
- `NEED_REINTERPRETATION` 的自动重解释。当前只记录冲突并询问用户或安全降级。
- semantic conflict gating remains intentionally unchanged pending real Agent/E2E observation.

## 下一道门槛

```text
Agent Loop architecture freeze
↓
Browser compatibility probe
↓
Google Discovery smoke
↓
single candidate Google → Tabelog availability probe
↓
materialized h001 Hybrid diagnostic（已通过）
↓
Web Live 页面交互验证
↓
h002–h005 diagnostic
```

`restaurant-semantic-prompt@7`的新`CLEAN_HOLDOUT`保留为独立的parser/semantic质量工作，不能以已暴露数据冒充Baseline；它不再是启动Hybrid E2E preparation的blocking dependency。Hybrid E2E仍不触及真实Booking；Live runner强制`PRAXIS_ALLOW_LIVE_RESTAURANT_READ=1`、`PRAXIS_ALLOW_BROWSER_RUN=1`与真实模型付费门禁，且没有Authorization、提交、支付、取消或个人信息输入路径。现有E2E rubric仍是`draft / not integrated`，runner明确记录该Scorer缺口，未将其伪装为已评分结果。

## 按问题阅读

| 要回答的问题 | 先读 |
|---|---|
| 现在真正有什么、还缺什么？ | 本页 |
| 产品承诺与用户流程是什么？ | [MVP PRD](product/MVP-PRD.md)、[User Flows](product/USER-FLOWS.md) |
| 状态、模型、执行如何分层？ | [Architecture Overview](architecture/OVERVIEW.md)、[ADR Index](decisions/README.md) |
| Restaurant 的语义、状态与决策细节？ | [Restaurant Domain](domains/RESTAURANT-BOOKING.md)、[Interfaces](architecture/INTERFACES-AND-SCHEMAS.md) |
| 如何测试或跑 Eval？ | [Test Skill](skills/test/SKILL.md)、[Eval Skill](skills/eval/SKILL.md)、[Harness Design](harness/HARNESS-DESIGN.md) |
| 外部能力是否真实可用？ | [Capability Matrix](integrations/CAPABILITY-MATRIX.md) |
| 历史上为什么这么改、跑过什么？ | [Dev Log](history/DEVLOG.md)、[Test Log](history/TEST-LOG.md) |

## 测试维护

2026-09-05测试Review合并H02/H03/H04相同初始化流程，保留全部独立断言和场景ID；移除Web测试对固定CSS断点的源码匹配。默认离线基线162/162通过，不以数量下降宣称覆盖提升。测试增删与退役规则统一见[Test Skill](skills/test/SKILL.md#测试维护与退役)。

## 2026-09-06全量测试审查收尾

已全文审查35个测试文件的173项声明（当时默认162、冻结8、浏览器3）及独立PostgreSQL Live Smoke。默认当前159/159、冻结8/8、真实浏览器本地Fixture 3/3通过；typecheck、arch:check、build通过。删除或合并3项确定重复，并在既有测试补准独立安全断言；未新增独立测试。逐项结论见[全量审查快照](history/TEST-SUITE-REVIEW-2026-09-05.md)。Live Smoke清理失败不再吞掉或提前报告pass；以隔离VM假数据库进行3种故障注入通过，未运行真实PostgreSQL。未调用Live来源、付费模型或私有Holdout。
