# 用户点名门店时不再强制另给地区

2026-11-03，维也纳 CET（UTC+1）。状态：**离线实现与验证完成，draft / not integrated，待复核；只推工作分支，不合 main**。

工作分支：`codex/fix-phase3b-named-outlet-without-area`，基于 main `d4d8ea33a4cf32b01601474f02ad89c538bf3f69`。最终门禁冻结提交：`d793fccfa2cc915e76f72b327a195558ffa0f508`；交付提交以 Git / 远端核对回执为准。真实模型、Google、来源网站、Live 新增调用全部 **0**，未读取或加载 `.env`。

## 交付行为

非空 `SPECIFIC_OUTLET` 店名可在没有 AREA 时开始查找。默认生产组装按完整店名在 Tokyo 服务范围内查 Google 候选，不创建用户地区、地区圆心或半径限制。来源地址必须支持 Tokyo；没有依据、非 Tokyo 或不相干店名不会成为替代结果。

完整名称经既有 NFKC、大小写和空白规范化后必须唯一。近似结果只作为澄清选项，不能据相似度接纳。歧义/未确认时禁止代码或 Agent 自选、读取空位、生成合格交接；Agent 可以 ASK_USER 问分店或地区。一个恶意模型确实尝试了 SELECT_CANDIDATE，实际被拒绝，未产生选择事件或来源读取。

确认后继续使用原 G4 来源链路与身份规则（原名→合法片段→同 Place ID 日文名；电话、完整地址及来源身份不放宽），正常查位、展示、B1 与同渠道条款。`NAMED_OUTLET_RESOLUTION` 记录在既有 DISCOVERY 证据和公开 matchReasons，地址来自来源；不回填 `intentDraft.area`，不显示到虚构用户圆心的距离，也不制造 HARD 地区达标声明。其它 HARD、日期/时段/人数、预算、20秒保留、当前空位和两次 B1 校验仍适用。

OPEN_ENDED 仍必须有地区；空店名不获得例外。用户后补 AREA 后，以用户给的地区为准，旧轮证据被 reset；查询仍绑定原店名，不能因为补地区而展示另一家店。

版本经用户事先确认：**restaurant-state@25 / TaskDefinition@23**。Draft Schema@3、Semantic Proposal@4、Semantic Prompt@26、Agent Prompt/Action Schema 不变。ADR-0044 revision1.2 只追加本次决定。SQL schema/migration 不变，没有自动迁移、删除或重置旧 State@24 任务。

## 输入、红灯与修复证据

A `cc9562cd00fd3f17ef08ceeeef5c536385f5e629` 的 D3 决策 #1 原 JSONL（含原换行）及 `outputText` 原文均保留，见 `frozen-input.json`。

- 完整两行决策原件 SHA-256：`e411b975545e4e5d8b1f26afa146b1ba6caffb53bb227938ee6e49b6641cc942`。
- 决策 #1 原行 SHA-256：`420bcef8f2c7bd2f1360aa9b62f10d0dc6a536b064402b7361508c2c80de3ac4`。
- outputText UTF-8 SHA-256：`4b7265bc825c1c7a0991773ddc6a1935e0ba922f26e2c0f09acd95953335764c`。

整组装运行实际 `createLiveReadAssembly` 默认组合、持久应用、Interpreter/Compiler/Reducer/Router、身份和空位接纳；只替换模型传输及来源 I/O。不是手填合格 State/Evidence。只回放原 #1 语义输出；后续 Agent 动作为受控 I/O，不冒充真实模型复测。

来源页为明确标为构造的 G6 控制世界：参考时钟仍为原 fixture 的 2026-11-01，URL/店号沿用 G6 占位 `13123456`，不当成真实 Dengana `13108466` 的身份或库存认证。D3 的真实原语义字节与构造来源测试分开报告，不把这些测试当成新的 G4/37家通过率或 Live 交付率。

| 检查点 | 结果与保留位置 |
| --- | --- |
| ead356c0 有效初始红灯 | search=false、NEEDS_INPUT/ASK_USER、来源访问0；六项1绿5红，`red/` |
| 9e07e889 首轮实现 | 已展示但B1为空；两个来源缓存读者仍要求AREA，`green-before-reader-context-fix/` |
| 897cafdb / f16d7c50 | 修复后六项绿；增加边界后八项绿，`green-six-controls/`、`green/` |
| ea1289c3 运行预检 | 默认1363/1363；尚未包括后补地区目标绑定修复，`runtime-preflight/`，不替代最终门禁 |
| 0db94123 后补地区红灯 | UNRELATED 后补 Akabane 错误到达 PRESENT_RESULTS，`area-red/` |
| 9a0c07ea 新规则候选 | 新八项控制绿；默认1361/1363，旧两例交接合同冲突，`runtime-contract-check/` |
| 3d632a49 / 28c45602 | 用户分别批准A机械同步和两例C交接预期同步，单独提交；原红灯不覆盖 |
| d793fccf 最终冻结 | 五门禁、严格G2、独立核验全部通过，`gates.json` |

另保留首次类型预检 `typecheck-preflight/`，不把当时的 A 待授权输入与 C 类型问题隐藏或称作已通过。冻结前的补丁比较器只规范化 Git `@@` 行附带的函数名；实际批准补丁未变。

## 验收与独立四层核验

本次八项测试为七个整组装控制加一个组件条件控制；同一流程的多个观察时刻不当独立 Live 样本。当前 `gates/independent.log` 对九帧逐字核验原始 D3 输出、固定 Google 请求/响应、来源 JSON-LD 姓名/电话/地址、原 slot 及 form_course URL、条款引用、实际拒绝行为，不导入生产名称/身份/资格判定函数。

1. **端到端：** 唯一全名无AREA→查找→现有身份核对→空位→展示→B1/两项条款；后补用户地区继续可用。歧义、近似分店先询问；无结果、不相干店、非Tokyo均不替店；OPEN_ENDED缺地区不查找。新八项控制8/8，独立九帧PASS。
2. **逐环节：** 理解是原 D3 输出；地区例外来自代码。发现与身份用固定来源原文交叉核对，查位用原始日期/人数/时刻/链接对照；展示只允许已核实候选。后续 Agent 决策为 fixture，不评价真实模型选择 ASK_USER/SEARCH 的概率。
3. **安全：** 当前控制世界中没有错店交接、预约流程导航、BOOKING_PROPOSED 或提交请求。受控红灯显示的是合同缺陷，不重新判分原 D3 Live，也不将本批声明为真实网站的 S0 签收。
4. **归因：** 原始首点为 missingSearchFields/complete intent 无条件要求地区；两个 B1 读者和条款上下文有同类残留。后补地区必须同时保留目标名约束。两项旧交接预期的差异先报告、经用户批准后同步，未放宽新规则或身份门槛。

公开来源访问与真实模型质量、实际 Google 返回的名称、真实库存和 Live 等待时间仍未评。**缩写、跨语言别名或仅近似的名称不自动认作同店**；相似度只让它进入澄清选项。服务范围与唯一性结论基于本次有界来源结果，不声称穷尽整个 Tokyo。该保守限制需在复核与之后的真实开发运行中继续观察。

## 最终净树门禁

`freeze.json` 固定784项源码、配置、批准补丁、原始输入/历史证据。2026-11-03 **03:20:43 CET** 完成；九步每项前后 git status 为空、HEAD与SHA不变。无过滤、跳过、失败豁免、自动重试或加长时限。

| 检查 | 结果 | 秒 |
| --- | --- | --- |
| 冻结/原字节/批准补丁/账本 | PASS | 0.178 |
| `npm run typecheck` | PASS | 0.522 |
| `npm run arch:check` | PASS，0 forbidden dependencies | 0.216 |
| `npm test` | **1363/1363** | 45.692 |
| 独立九帧核验 | PASS | 0.079 |
| `npm run build` | PASS | 0.537 |
| `npm run test:browser:fixture` | **188/188**，真实本地Chromium | 131.842 |
| `PRAXIS_G2_REQUIRE_PASS=1 npm run test:dom-change` | **5/5；12页全部PASS** | 24.404 |
| 再次冻结核对 | PASS | 0.203 |

门禁后只归档结果和更新说明，没有修改被测源码、配置或冻结输入。完整原输出和SHA在 `gates.json`、`gates/`；原语义、Google固定传输、页面、事件、Trajectory、按用途模型计数与生命周期测时均随原日志保留。那些模型调用是 fixture 调用，测时不是 Live 性能。

## 逐处授权与文件归属

精确差异由 `verify.py` 对照未应用时保存的两个补丁；不是只检查改动文件名。

| A归属获批同步（3d632a49） | 仅有改动 |
| --- | --- |
| `src/harness/restaurant-execution-router.test.ts:21` | State字面量24→25 |
| `src/eval/restaurant/agent-loop/native-discovery-components.test.ts:68` | State字面量24→25 |
| `src/eval/restaurant/agent-loop/runners/run-d1-fact-judgment-controls.ts:80` | State24→25；81/83行已有AREA样本的非空类型标注 |
| `src/harness/restaurant-harness.ts:150` | 用户没有AREA时不构造AREA patch，其余输入不变 |
| `src/eval/restaurant/agent-loop/runners/run-source-stage-probe.ts:554` | 554–558行仅已有地区探针的非空类型标注，运行/评分策略不变 |

C另获批同步（28c45602）：只将 `restaurant-user-booking-selection.test.ts` 的 AMBIGUOUS/PARTIAL 交接预期改为 `[]`；OPEN_ENDED/NON_BOOKING交接、输入、原模型字节、selected/无BOOKING_PROPOSED/无额外条款调用等断言保留。

其它C版本/类型同步包括 agent-loop/message-handler、Domain context/read-assessment/action-validator、Postgres restore、fact-judgment 的当前版本字面量，以及 Google fixture、Postgres fixture、HTTP fixture 的已有AREA非空类型标注。没有改它们的 Gold、业务输入或其它断言语义。A的原 G6/`g6-booking-*` 文件、A其余 eval/harness、B三个 G3 文件、前端均原字节不动。

产品改动覆盖 intent-state、命名绑定与 Validator/readiness、普通组装/Google查询、B1投影/两读者/条款上下文。源身份、G4检索排序/名额、G3查位/响应解析、模型 Prompt/Schema 均不改。区域 Native 入口保留地区前置，仅同步可选字段类型；新的具名路径在普通组装先分流到Google。Google游标请求绑定及穷尽判断已统一放在具名与普通路径分流之前，仍按既有run配额逐次记账，最多既有两页初次Text Search。

## 共享账本与交付

保留 main619条及 A cc9562cd 全部原记录：新增A7条与C一条零调用记录，并集627条。累计为 Live2、真实模型266、评测GET264、Google19、来源请求1394，均为历史/A记录；本轮C每项0。main限额不提高，原A账本快照和所有共有行不变。独立完整性检查确认计数之和及批准范围。

按本次授权推送工作分支并用远端回执核对，**不合 main**；通知对话A等待复核安排，后续真实运行仍按A对话中用户已有授权执行。旧State@24任务不自动迁移/重置。
