# target.goal impact inventory

- Status: draft / not integrated; static inspection of main `7165f8a20fd86e105ea3219100061699c03197a1`.
- 本批无实现、无红绿业务结论。行号引用被冻结 main；下一批代码变动后须重新定位。

## 语义入口、写入与复制

| 文件:行 | 用途与写权 | 本方案影响 |
| --- | --- | --- |
| src/domains/restaurant/contracts.ts:25 | RestaurantTarget.goal；Draft:76、SearchIntent:93、Patch:791 共用目标类型 | 建议不把依据持久化到该类型，目标/状态版本不因本项自动升版 |
| src/domains/restaurant/semantic-proposal.ts:8 | Prompt 标识 @23；Schema:9–12 为 @3；TARGET value:36；strict transport:125–127；本地结构验证:211–216 | Proposal@4、Prompt@24；TARGET value 新增必填 goalBasis |
| src/domains/restaurant/semantic-interpreter.ts:119 | currentDraft.target.goal 只读投影到语义上下文 | 保持权威原值；只由当前用户语义新提议改目标 |
| src/domains/restaurant/semantic-interpreter.ts:135 | validateModelOutput；:150 结构验证；:204 TARGET Prompt；:489 提议接纳 | 增加当前 input.message 的引用核验，改 TARGET 语义；失败走 :494 INVALID_MODEL_OUTPUT |
| src/domains/restaurant/semantic-interpreter.ts:20 | MAX_SCHEMA_ATTEMPTS=2；:441 有界尝试 | 不增加尝试；估算分别列逻辑 turn 和现有最多两次网关调用 |
| src/domains/restaurant/semantic-compiler.ts:21 | TARGET 的冲突 key 当前只含 query | 两个相同 query、不同 goal 的 TARGET 可能未被冲突集合区分；属于语义编译内风险，不是后续 Agent 重分类。本批只登记，复核决定是否纳入结构性拒绝覆盖 |
| src/domains/restaurant/semantic-compiler.ts:149 | TARGET NEGATE 清除；:178–186 ASSERT/CORRECT 将 value.goal 原值写到 patch.target | 唯一生产目标转译；不判断合理性，不从人数/词面推断，不把 basis 当依据事实 |
| src/domains/restaurant/intent-state.ts:80 | applyRestaurantIntentPatch；:87 克隆 current.target；:101–103 设置/清除 patch.target | Reducer-owned 正式语义更新，不属于 Agent/Router 自行改目标 |
| src/domains/restaurant/intent-state.ts:168 | 完整 booking intent 复制 draft.target；:191 search intent 同样复制 | 原样复制，不分类 |
| src/domains/restaurant/task-definition.ts:252–255 | SEMANTIC_PROPOSAL_COMPILED → apply patch → resetForSemanticUpdate | 权威语义状态更新；后续 action event 不应携带目标 patch |
| src/application/restaurant-message-handler.ts:22 | 只在 AVAILABILITY 且缺人数时触发现有人数补充 | 不改目标；RECOMMENDATION 缺人数不调用补充器 |
| src/application/restaurant-message-handler.ts:42–64 | Interpreter → Compiler → 现有人数补充 → SEMANTIC_PROPOSAL_COMPILED | 引用失败必须在此产生 SEMANTIC_INTERPRETATION_FAILED，不落到需用户化解语义冲突的分支 |
| src/domains/restaurant/party-size-supplement-resolver.ts:49,68 | 验证仅为空位目标补人数；向独立人数模型只读传目标 | 不修改；本语义回归 runner 不调用该模型 |
| src/application/persistent-restaurant-agent.ts:667 | 设备坐标借用语义事件，只 patch area | 当前没有 target/goal 写入；后续禁止顺带改目标 |
| src/application/persistent-restaurant-agent.ts:710–714 | 从语义事件重建输入 intent 并导出目标供独立评价 | 保留原目标；依据提议只在允许的静态评测记录，不新增用户原文日志 |
| src/domains/restaurant/intent-draft.ts:76–84 | 既有 Draft 验证只接受支持的 goal 和 query | 不负责语义合理性；不把 goalBasis 加进持久 Draft 的最小方案无需扩张此验证器 |

## Agent、Router、交付与下游读者

| 文件:行 | 用途 | 是否修改目标 |
| --- | --- | --- |
| src/domains/restaurant/agent-context.ts:180 | 按目标派生缺人数等阻塞信息 | 否 |
| src/domains/restaurant/agent-decision.ts:118 | 告知 Agent 权威目标控制交付标准 | 否；后续 Prompt 文案只对齐职责，不令 Agent 重判 |
| src/domains/restaurant/action-validator.ts:175 | 空位目标缺人数拒绝昂贵调查 | 否 |
| src/domains/restaurant/read-assessment.ts:45 | restaurantIntentRequiresAvailability；其调用者形成证据资格/展示/继续调查 | 否 |
| src/domains/restaurant/discovery-planner.ts:66 | 推荐目标过滤仅订位来源包 | 否；本批及后续本任务不改来源/Pack |
| src/application/restaurant-execution-router.ts:245 | authoritativeSearchRequest 绑定权威 intent；:361 空位参数绑定；:476–485 展示事件仅传候选/证据 | 否；结果不携带可改 goal 的 patch |
| src/application/persistent-restaurant-agent.ts:187,200 | 追问字段及推荐/空位展示文字 | 否 |
| src/web/local-workspace-page.ts:79,97 | Refresh 文案、事实型卡片/空位型呈现 | 否 |
| src/integrations/restaurant-search/native-restaurant-search.ts:430 | 非空位目标跳过搜索级库存线索 | 否；只读审查，不修改该来源代码 |
| src/integrations/restaurant-facts/google-then-website-facts.ts:60 | 有访问时段的推荐需营业事实 | 否 |
| src/integrations/restaurant-facts/google-listed-website-facts.ts:289 | 同样计算营业事实需要 | 否 |
| src/integrations/tablecheck/tablecheck-browser-availability.ts:911 | availabilityInput.goal 是浏览器执行目标对象，修改的是 timeWindow | 与 target.goal 枚举无关，不是目标改写；不修改 Adapter |

## 评价、输入与静态构造

| 文件:行 | 用途与计划 |
| --- | --- |
| src/eval/restaurant/semantic/fixtures.ts:107,117 | 唯一两条显式目标开发 Gold；其余 13 turn 未标目标。SR03-T02 新 B 分类与旧推荐冲突，先清单不改 Gold |
| src/eval/restaurant/semantic/stage-oracles.ts:54 | 静态 TARGET 提议 oracle；其余目标缺口不能伪装成现有覆盖 |
| src/eval/restaurant/semantic/scorer.ts:15,50,128–147,159–190 | @3 比较 Proposal/Patch/Draft；TARGET canonical key 只用 query；需要 @4 独立目标策略及依据验证，不能按固定 reason 字面量评分 |
| src/eval/restaurant/semantic/regression.ts:60,99,190–218,256,324 | @3 runner/报告、静态 oracle 与 Runtime dispatch；@4 接纳已批准标注 sidecar，保留各环节与非目标字段比较 |
| src/eval/restaurant/semantic/exposed-regression.ts:15,31–43,137–166 | comparison@1 的 field 维度目前无独立 goal/basis 列；若用于新回归则升 @2 并新增字段，不能只在 target.query 中折叠 |
| src/eval/restaurant/semantic/holdout.ts:21,601 | Holdout@2 私有协议；不读/不运行/不改标注或原产物 |
| src/eval/restaurant/agent-loop/live-case-materializer.ts:167–169 | 严格 Gold 读取 target.goal；若目标策略 sidecar 接入，另有显式版本，不能偷加 YAML 未知键 |
| src/eval/restaurant/agent-loop/diagnostic-evaluator-record.ts:66 | 诊断输入 target.goal 结构读取 |
| src/eval/restaurant/agent-loop/diagnostic-evaluator.ts:157–197 | 读取预期/最终目标，逐字段目标不一致；:205 人数适用性；:717 证据模式 |
| src/eval/restaurant/agent-loop/diagnostic-evaluator.ts:1133–1134 | R1 只影响结果分类：旧推荐被多查位时可仍为合格并记 S3；不是 State 改写，不能拿该例外跳过语义目标评价 |
| src/eval/restaurant/agent-loop/diagnostic-evaluator-outcome.ts:48 | 诊断目标冲突；不改产品 State |
| src/eval/restaurant/agent-loop/runners/run-hybrid-live-read.ts:247 | 按冻结 Gold 目标选来源预检；本任务不跑、不改变 Live 外层 |
| src/eval/restaurant/agent-loop/source-data-preflight.ts:20 | goal 参数选择预检来源；执行外层边界，不是语义分类器 |
| src/eval/restaurant/agent-loop/fixed-source-case-registry.ts:61,84 | 固定来源控制输入 target；不是用户语义后改目标 |
| src/eval/restaurant/agent-loop/d1-fact-judgment-controls.ts:14 | D1 合成事实控制 RECOMMENDATION |
| src/eval/restaurant/agent-loop/locality-fact-judgment-matrix.ts:61 | locality 控制 RECOMMENDATION |
| src/eval/restaurant/agent-loop/category-negative-fact-judgment-matrix.ts:38 | 类别负条件控制 RECOMMENDATION |
| src/eval/restaurant/agent-loop/runners/run-d1-fact-judgment-controls.ts:81 | 合成控制 State 初始化，不是生产改写 |
| src/eval/restaurant/agent-loop/runners/run-source-stage-probe.ts:439 | 探针意图构造，当前任务不运行 |
| src/harness/restaurant-fixtures.ts:9 | Fixture 初始化 AVAILABILITY，不是后置重判 |

## 静态结论与未证明范围

未发现 Agent、Router、展示把已接纳 RECOMMENDATION 改成 AVAILABILITY 或反向修改的执行路径。当前改变目标的生产入口是用户语义提议的 Compiler → SEMANTIC_PROPOSAL_COMPILED → Reducer；设备坐标事件仅改 area。没有后置改写代码需要在本批删除。

该结论来自静态读写清单，不是新不变量的红绿证明。批次 2 复用既有真实组合，取一次受控篡改目标 patch 的红灯，再证明 Agent/Router/展示事件不能改变它；用户后续新语义的合法改目标仍应允许。不为本批文档审查修改实现或补测试。

## 合同版本与对话 B

main 实际为 restaurant-state@20、TaskDefinition@18；已独立读取 F5 分支契约确认其为 @21/@19。本方案建议 goalBasis 仅进入 Proposal@4，状态仍 @20、TaskDefinition 仍 @18，不抢占 @21/@19。若复核要求把依据写进 State/Event/Draft，则应按 Accepted ADR 决定新增字段、数据生命周期和全部调用方，再由复核者安排 B 先后与实际编号；本批未预分配 @22/@20 或加入兼容层。
