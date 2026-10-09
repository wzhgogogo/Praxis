# H001–H005 已知可行基线 Playbook

- Status: Draft
- Document revision: 0.4
- Last updated: 2026-10-09
- Evidence status: draft / not integrated；开发集已暴露，非 Clean Baseline
- Source of truth for: 已知可行变体、可行性见证、H001–H005 基线运行与第一卡点归因的实施计划；不替代 Accepted ADR、Gold@6 或当前能力记录
- Related ADRs: [ADR-0018](decisions/0018-availability-display-freshness-and-recheck.md)、[ADR-0025](decisions/0025-model-directed-read-investigation.md)、[ADR-0031](decisions/0031-default-result-delivery-window.md)、[ADR-0033](decisions/0033-native-source-batch-delivery.md)、[ADR-0036](decisions/0036-generic-public-read-network-policy.md)、[ADR-0037](decisions/0037-request-driven-discovery-source-packs.md)
- Related documents: [第一阶段 Playbook](AGENT-WEB-OPERATION-PHASE-1-PLAYBOOK.md)（本文是其中的 P1-A）、[INDEX](INDEX.md)、[STATUS](STATUS.md)、[H001–H005 验收契约](../src/eval/restaurant/agent-loop/cases/README.md)、[H001 可信结果交付 Playbook](H001-QUALIFIED-DELIVERY-PLAYBOOK.md)、[2026-10 月度摘要](history/monthly/2026-10.md)

本工作包只做**测量**，不做修复。目标是用当前代码对 H001–H005 取得一份可信的端到端基线：系统在"确实有位"的任务上能不能交付，在真实当天任务上能不能诚实处理，以及每次没交付时第一个卡住的环节是什么。基线的归因结果决定下一工作包的修复顺序；它本身不以"通过"为退出条件。

## 0 背景与本轮决定

截至 2026-10-08：Phase 3 仍 FAIL，诊断预算 145/150 已用，H001 整单 Live 尚未在最新代码上运行；H001–H005 最近一次全五例 Live 是 9/16，H001–H003 最近一次是 9/24。离线门禁多次全绿而 Live 仍失败，现有整单验收又把"当天真实有没有位"与"系统能力"绑在一起，导致 Live 结果既难以归因、也无法判断改动是否有效。

用户于 2026-10-08 决定：

1. **验收拆为两类。** 能力类使用"已知可行变体"（事先独立确认有位的任务）；诚实处理类使用原版实时任务（有位交付，没位如实说明）。两类分开统计，互不替代。
2. **Phase 3 剩余行转为诊断。** TableCheck 发现、官网事实、受限库存、真实日历回放不再作为整单运行的前置门槛；原 Phase 4／5 的整单门槛由本基线及其后的迭代替代。已有 Phase 3 结论和原始产物保持不变。
3. **Live 只在宿主机固定网络运行。** 沙箱不运行 Live 或 Chromium 相关测试；网络配置沿用 Phase 3 的 `--no-proxy` 有效环境副本，不改 `.env`、系统代理或 TUN。
4. **暂停：** TableCheck 发现矩阵修补、真实日历 HAR 完整回放、官网事实矩阵、第三来源选型。待下一阶段的观察回放与模型可见性改进完成后再评估。

保持不变：Semantic Prompt／Schema、Gold@6、HARD／身份／半径／新鲜度规则、整单 500 秒／50 次模型调用、只读路径、无任何预约／支付／个人信息写入。

## 1 交付物与退出条件

| 编号 | 交付物 | 退出证据 |
| --- | --- | --- |
| A | Runner 决策捕获（eval-only） | 一次离线组合运行写出与模型调用数一致的捕获记录，含一次失败调用；typecheck／arch:check／npm test／build 通过 |
| B | 5 个已知可行变体 YAML | 用户审核并确认 `content` 与 `semantic`；冻结文件 SHA 记录在案 |
| C | 可行性见证表 | 每个变体有分类结论及见证证据（§4） |
| D | 10 次基线运行产物 | 5 次已知可行 + 5 次原版实时，各一次；或按 §5 停止规则提前停止并记录原因 |
| E | 归因 sidecar 与汇总报告 | 每次运行一份 sidecar；一份汇总（§6），经独立复核 |
| F | 文档同步 | STATUS、DEVLOG、TEST-LOG、月度索引、INDEX 更新（§7） |

工作包完成的标准是"测量完整且可复核"，不是"H001 通过"。

## 2 WP-A：Runner 决策捕获

### 问题

下一阶段要做"真实观察回放"：把 Live 中模型实际收到的输入重新交给真实模型，离线复现并比较决策。当前产物无法重建这些输入：

- `ModelInvocationRecord` 只有 purpose、版本、耗时、usage 等元数据，没有消息内容和输出。
- Recording 的 `MODEL_WIRE` 刻意去掉了 reason，只保留目标指纹。
- 执行诊断里的观察只有 1,000 字文本摘录和前 40 个目标；而模型实际收到的是 4,000 字文本、全部可操作目标和 progress。

### 实施

只改 `src/eval/restaurant/agent-loop/runners/run-hybrid-live-read.ts` 中包裹 `providerModel.complete` 的 `model` 对象（所有模型调用的唯一出口），不改生产代码：

- 新增 `--record-decisions` 开关（或在 `--record-browser` 时一并开启，二选一，实施时定）。
- 每次调用追加一行到运行产物旁的 `*.decisions.jsonl`：序号、purpose、promptVersion、开始时间、耗时、timeoutMs、maxOutputTokens、temperature、thinking、输出 schema 名称、**完整 messages**、**outputText**、finishReason、outcome／errorCode、usage。失败和超时的调用同样记录。
- 浏览器决策（`browser_read_decide`）的记录另外附上：当时的观察序号（executor 的 observation revision）、URL，以及开启 `--record-browser` 时 Recording 中对应的 DOM 快照序号。第一阶段的重建回放要靠这些把"模型看到的内容"和"当时的页面"对应起来。
- 运行产物记录该文件路径和 SHA-256。

### 边界

- 只写模型实际收到和返回的内容；不写请求头、API Key、Cookie、整页 HTML。
- 文件只落在 Git 忽略的 `.eval-artifacts/` 下。开发用例不含个人信息，页面内容为公开页面。
- 不改变任何调用参数、预算、Prompt 或执行顺序；捕获失败不能影响运行结果（写入失败时记录错误并继续）。

### 验证

复用现有组合测试或固定来源离线入口（fixture model gateway）跑一次，断言捕获行数等于模型调用数，且包含一次刻意失败的调用。按 [Test Skill](skills/test/SKILL.md) 跑 typecheck、arch:check、npm test、build。不新增测试平台。

## 3 WP-B：已知可行变体

### 规则

- 只把原文里的相对日期／时间表达换成**明确的未来日期**，其余措辞一字不改。H005 的 "right now" 改为明确日期加时刻。
- 目标日期在 Batch A 运行日之后 7–14 天，保留原文的星期语义（H002 周六、H003 周五）。
- 变体使用现有 `restaurant-read-development-variant@1` 机制，`parent` 指向 `restaurant-read-development@6`（SHA `00b69476e6d07eec5dcd9a657555c4e3766629fce5f8e630512710252886ffb6`，已与本地及远端核对）。Gold@6 和 `e2e-cases.yaml` 不改。
- 变体文件放在 `.eval-artifacts/known-feasible-baseline-20261008/variants.yaml`（Runner 要求 `--case-source` 位于 `.eval-artifacts/` 下）。
- 按 AGENTS.md 的 Gold 规则，`content` 与 `semantic` 须用户审核确认后冻结。

### 建议变体（假设 Batch A 于 10 月 12–14 日运行）

| ID | 原例 | 变体原文 | 关键 Gold |
| --- | --- | --- | --- |
| `kf-h001-20261022` | H001 | Looking for an omakase spot near Shibuya for 2 people on Thursday, October 22 at 7 PM. | AVAILABILITY；Shibuya NEAR；2026-10-22 19:00；2 人；omakase HARD |
| `kf-h002-20261024` | H002 | Recommend a first-date restaurant near Higashi-Ginza for Saturday, October 24 at 6:30 PM. Around 10,000 yen per person. No hot-pot restaurants and no Sichuan/Hunan-style cuisine where spicy food is the main focus. | AVAILABILITY；Higashi-Ginza NEAR；2026-10-24 18:30；推断 2 人；两项排除 HARD；预算 SOFT；初次约会 UNSPECIFIED |
| `kf-h003-20261023` | H003 | Need a place for a team dinner nearby on Friday, October 23 after work. 10 people, around 3,000 yen per person, good for drinks, ideally with a private room. | AVAILABILITY；NEAR_USER；2026-10-23 17:30–22:00；10 人；预算／包间 SOFT；其余 UNSPECIFIED |
| `kf-h004-20261021` | H004 | Good cafes nearby to meet up with a friend on the afternoon of Wednesday, October 21. | RECOMMENDATION；NEAR_USER；2026-10-21 12:00–17:00；cafe HARD；见朋友 UNSPECIFIED |
| `kf-h005-20261021` | H005 | Any spots nearby with open tables on Wednesday, October 21 at 6 PM for 4 people? Local food only, no fast food. | AVAILABILITY；NEAR_USER；2026-10-21 18:00；4 人；local food HARD；排除 fast food HARD |

完整 YAML 草稿见附录 A。若 Batch A 推迟，日期按同一规则顺延，并在冻结前重新审核。

**状态（2026-10-08）：** 用户已审核附录 A，无修改。已冻结为 `.eval-artifacts/known-feasible-baseline-20261008/variants.yaml`（SHA-256 `fc0f26b2cd1a4a6b1da1e13da3656cff1ca59f26ef057ca79aa6c0c48e68f5fc`）。KF-H001 在 19:00 已有见证，不需要回退时刻。

**KF-H001 时间回退规则（须在冻结前决定，不在运行后调整）：** 若 19:00 找不到至少 2 个系统支持来源上的见证店，可在 {18:00, 18:30, 19:30, 20:00} 中选择见证最充分的时刻，同步修改原文与 Gold 并重新审核。不得在运行之后为凑结果修改时间。

## 4 WP-C：可行性见证

### 定义

见证店是在运行前独立确认、满足该变体全部权威条件的门店：

- 地点在半径内并留有余量。命名地点（Shibuya、Higashi-Ginza）半径 1,000 m，见证店须在 800 m 以内；NEAR_USER 以评测点 35.6697, 139.7670 为圆心、半径 3,000 m，见证店须在 2,800 m 以内。命名地点的圆心以运行前一次 Google 解析结果为准，并写入见证表。
- 所有 HARD 条件（正向和排除）有可引用的来源依据。
- AVAILABILITY 变体：在目标日期、人数、时刻（或时间窗）有在线可订时段。RECOMMENDATION 变体：营业时间覆盖 12:00–17:00 的相关部分，不要求时段。

### 由谁确认

- 见证不能由 Praxis 的生产 Adapter、Grounding 或 Evaluator 产出。
- 优先由用户手动浏览确认；也可由独立复核者用普通浏览器确认。来源不限（Tabelog、TableCheck、官网、Google、其他预约平台、电话），但要保存 URL、截图和东京时间戳。
- H001 可以从 10/7 预登记的 5 家涩谷寿司店入手（Sushi Teppen、Sushi Naoki、Shibuya Sushi Sen、Shibuya Sushi Matsumoto、Sushi Sho Issekisanchou）。但那次登记的是 17:30，且没有核实 omakase，须重新确认 19:00 时段和 omakase 依据。

### 分类与数量

| 分类 | 条件 | 运行后的意义 |
| --- | --- | --- |
| `KNOWN_FEASIBLE_SUPPORTED` | 至少 2 家见证店（H004 至少 3 家）可通过系统已支持的来源确认（AVAILABILITY 为 Tabelog／TableCheck 在线时段；RECOMMENDATION 为系统可读的营业时间来源） | 未交付即为能力缺口候选 |
| `KNOWN_FEASIBLE_UNSUPPORTED` | 有见证店，但只能通过系统不支持的方式预订（其他平台、电话等） | 照常运行；未交付计入覆盖缺口，不算能力失误 |
| `NOT_QUALIFIED` | 约 30 分钟内找不到见证店 | 不作为能力变体运行；记录为覆盖观察 |

- 见证在 Batch A 运行前 24 小时内完成。
- 任何未交付的运行，在运行结束后 2 小时内对见证店复查一次，区分"位已经没了"和"系统没找到"。
- 系统不支持来源上的见证同样记录，作为后续"跟随店家预约入口"决策的证据。

见证记录模板见附录 B。

### 预认证结果（2026-10-08 东京时间 21:43–21:49）

独立复核者用普通浏览器完成了预认证：只读取来源自己的公开搜索和空位接口，未使用 Praxis 代码或模型，未打开预订表单。结果在 `.eval-artifacts/known-feasible-baseline-20261008/witnesses.prequalified-20261008.json`。

| 变体 | 分类 | 见证店（距离） |
| --- | --- | --- |
| KF-H001 19:00 | SUPPORTED | Shibuya Sushi Matsumoto（633 m）、Shibuya Sushi Sen（260 m），均为 Tabelog 19:00 有位且有 omakase 原文；备用 Sushi Teppen 仅 17:30／20:00 |
| KF-H002 | SUPPORTED | Tabelog：Ginza Sushi Tempura Iwai、Ginza Wagyu Teppanyaki USHIGAMI、Ginza Sushi Den；TableCheck：0711 GiNZA BiSTRO、ahill ginza |
| KF-H003 | SUPPORTED | Tabelog：Izakaya Ginraku（另经页面日历人工复核）、Meibutsuya、Uotami Tsukiji；TableCheck：168 Tenshinyamucha Ginza、Aloft Tokyo Ginza |
| KF-H004 | SUPPORTED | Bunmeidou Cafe Higashi-ginza、Tiffany Blue Box Cafe、LE CAFE V（周三营业时间均覆盖 12:00–17:00） |
| KF-H005 | SUPPORTED | Ginza Sushi Tempura Iwai、Ginza no Miko Zushi、Kushiyaki Bistro Fukumimi Ginza koridō（均为 18:00、4 人有位） |

Batch A 预计在 24 小时之后运行，因此运行前 24 小时内须按见证文件中的同一接口复查空位。只复查空位，不重新找店；约 5 分钟。

### 见证过程中观察到的来源行为（供下一工作包参考，本包不处理）

1. **Tabelog 列表页自带按空位筛选。** `rstLst/?vac_net=1&svd=YYYYMMDD&svt=HHMM&svps=N` 一次返回该日期、时刻、人数下可在线预订的门店。Praxis 现在只用 `sw` 关键词发现候选，再逐家打开日历。（2026-10-09 更正：运行时 Guard 对来源会话处于 ADR-0036 的通用 GET 模式，这些参数不会被拦截；只允许 `sw` 的审核语法影响的是 Recorder 的忠实录制，以及发现代码对当前查询的判断。）（2026-10-09 补跑复核再更正：通用 GET 模式不覆盖预约路径。TableCheck `/en/shops/<slug>/reserve` 被 Guard 的敏感路径规则拒绝，11 次运行中 7 次出现，见第一阶段 Playbook §7 G1。）
2. **TableCheck 搜索同样支持空位。** `date`、`num_people`、`time`、`availability_mode=same_meal_time` 会让结果卡片直接带上可预订时段链接。现有 TableCheck `buildQuery` 没有使用这些参数。
3. **TableCheck 的 `geo_distance` 不是硬过滤。** 结果少时页面会提示 "No results found, expanding search area"，并自动从 1 km 扩到 2 km、从 3 km 扩到 4 km。涩谷 omakase 的 9 个结果全部在 1.4–2.2 km。这能解释 10/8 Live #3 中"TableCheck 4 家详情均超出原半径"：这是来源本身的行为，不是解析缺陷。
4. **典型的通用界面形态。**
   - Tabelog 日历的人数是轮播，默认显示 1–6，每点一次右箭头前进一格。
   - 点选日期后，时段区先显示约 1–2 秒的加载动画，之后才出现时段。
   - 中文浏览器首次访问会弹出语言选择框。
   这些都应该由执行器统一处理，而不是写成站点代码。
5. **两个来源的详情页都有 schema.org JSON-LD。** 包含名称、地址、坐标、菜系和价格区间，可以作为通用身份抽取的首选数据。
6. **营业时间文字和可订时段不一致。** 例如 Sushi Teppen 写的是两轮"7:30 PM–9:30 PM"，实际可订时段却是 17:30 和 20:00。空位只能以来源的预订数据为准。

## 5 WP-D：基线运行

### 环境与冻结

- WP-A 合入后冻结一个提交，运行期间不改代码。工作区须干净（Runner 会记录 commit 和 CLEAN／DIRTY）。
- 宿主机运行；`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM`，`PRAXIS_LOCAL_CHROMIUM_INTERACTIVE=0`，不开人工介入。
- 每次运行由 Runner 自带 preflight 把关。
- 预算使用共享默认值，不额外收紧：整单 500 s、每候选 60 s、每来源 45 s、每候选 80 次浏览器操作、Agent 30 步。显式传 `--max-model-calls 50`；`--max-google-requests 40` 用于限制付费调用。
- 注意：现行 Runner 已没有 `--native-discovery` 参数，H001 可信结果交付 Playbook 中的旧命令不能直接使用。

### Batch A：已知可行（5 次）

同一天内各运行一次，须在见证复查后 24 小时内：

```bash
PRAXIS_ALLOW_LIVE_RESTAURANT_READ=1 \
PRAXIS_ALLOW_BROWSER_RUN=1 \
PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 \
PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM \
PRAXIS_LOCAL_CHROMIUM_INTERACTIVE=0 \
npm run eval:restaurant:agent-loop:hybrid-live-read -- \
  --case-source .eval-artifacts/known-feasible-baseline-20261008/variants.yaml \
  --case kf-h001-20261022 \
  --record-browser --record-decisions --no-proxy \
  --timeout-ms 500000 --max-model-calls 50 --max-google-requests 40
```

其余四例只替换 `--case`。`--record-decisions` 以 WP-A 最终实现的开关为准。

### Batch B：原版实时（5 次）

在同一个工作日的东京时间 09:30–12:00 依次运行 `--case h001` … `--case h005`（不带 `--case-source`），其余参数同上。上午运行可以让 "tonight 7 PM" 和 "this afternoon" 仍然有效；"this Saturday／this Friday" 由 Materializer 按运行日解析；"right now" 即实际运行时刻。这一批只评诚实处理，不评能力。

### 总上限

- 10 次运行，模型调用合计不超过 500 次，Google 请求合计不超过 400 次。
- 墙钟时间每次最多约 500 s，总计约 85 分钟。

### 停止规则

- 不自动重跑。只有 `ENV_FAILURE`（§6）允许在 preflight 恢复通过后对该例重跑一次，两份产物都保留。
- 一旦出现 `FALSE_CLAIM`（展示了不合格的结果或虚假声明），立即停止剩余运行，该问题成为下一工作包的第一优先修复。
- 运行期间发现的问题只记录、不修复。修复属于下一工作包。
- 所有产物只追加、不覆盖。

## 6 WP-E：评价与第一卡点归因

### 第一步：现有自动评价

对每次运行使用现有 diagnostic evaluator 和 acceptance 注册，得到 qualified YES／NO 和六维结果。不修改 evaluator 和评分口径。

### 第二步：归因 sidecar（人工／独立复核）

每次运行写一份 `<run-id>.baseline-review.json`（模板见附录 C）。这是复核记录，不是新的评分平台。

**运行结论（按优先级取第一个成立的）：**

| 结论 | 定义 |
| --- | --- |
| `FALSE_CLAIM` | 展示的结果或对用户的声明与证据不符（门店、日期、人数、时段、HARD 任一不成立）。安全问题，最高优先级 |
| `ENV_FAILURE` | preflight 失败，或在实质来源工作开始前因 DNS／代理／传输失败终止。不计入能力分母 |
| `INTERNAL_FAILURE` | 崩溃、状态丢失、约束丢失、无效循环、预算接线错误 |
| `QUALIFIED_DELIVERY` | 运行内实际 PRESENT_RESULTS，且至少一个结果经自动评价和人工复核均合格 |
| `CAPABILITY_MISS` | `KNOWN_FEASIBLE_SUPPORTED` 变体未交付，且运行后复查时至少一家受支持的见证店仍然有位 |
| `HONEST_NO_RESULT` | 未交付但没有错误声明，且属于原版实时任务，或见证复查已失效，或见证店不受支持 |

**第一卡点（未交付时必填）：** 沿"最有希望的那条路径"（优先看见证店，没有见证时看走得最远的候选），记录它停在哪一阶段：

`ENV` → `SEMANTIC` → `LOCATION` → `DISCOVERY` → `IDENTITY` → `FACTS` → `AVAILABILITY` → `GROUNDING` → `AGENT_STRATEGY`（业务 Agent 选错动作或过早结束）→ `BUDGET`（仍在推进时被截断）→ `COVERAGE`（只有系统不支持的来源能订）

**子原因标签（可多选，用于决定下一步修什么）：**

| 标签 | 含义 | 对应改进项 |
| --- | --- | --- |
| `OBSERVATION_GAP` | 关键信息不在模型看到的内容里（文本截断、目标过多） | 模型可见性 |
| `MODEL_DECISION` | 信息可见，但模型选错动作 | 模型可见性／思考 |
| `NO_ACTION_MEMORY` | 重复已经做过或已被拒绝的动作 | 动作历史 |
| `ASYNC_SETTLE` | 页面未稳定就行动或判定 | 执行器统一等待 |
| `REPETITIVE_STEPS` | 同类操作需要多次模型决策（例如人数轮播逐格点击），耗尽局部预算 | 重复性操作合同 |
| `DELIVERY_POLICY` | 已有合格结果，但运行时或 Agent 的策略在非时间预算耗尽前没有展示（2026-10-09 新增） | 按调用预算交付 |
| `RETRIEVAL_TERMS` | 检索词导致列表稀疏或不相关 | 模型检索规划 |
| `REGION_BINDING` | 地点无法绑定来源地区入口 | 地区入口由 Agent 选择 |
| `OWN_PLATFORM_ONLY` | 候选只能在原平台查位，或外部预约入口被当作停止条件 | 跟随店家预约入口（需 ADR） |
| `GUARD_BLOCK` | 网络 Guard 拦截了合法公开读取 | 闸门收拢 |
| `SUB_BUDGET` | 局部预算（非整单预算）截断了有效推进 | 闸门收拢 |
| `STRICT_GATE_UNKNOWN` | 证据实际存在，但闸门判为 UNKNOWN | 闸门收拢 |
| `PARSER_EXTRACTION` | 确定性解析器漏掉了页面上存在的信息 | 通用抽取 |
| `SOURCE_LIMIT` | 来源确实受限（仅电话、休息日、无在线时段） | 不是缺陷 |
| `ENV_NETWORK` | 网络或运行环境问题 | 环境规则 |

每个标签都要给出证据指针（trace 序号、决策捕获行号、截图）。凡是 `OBSERVATION_GAP`、`MODEL_DECISION`、`NO_ACTION_MEMORY`、`ASYNC_SETTLE` 对应的决策，列入回放种子集。

**见证漏斗：** 每家见证店是否被发现、是否查了事实、是否查了空位，以及结果。

### 第三步：汇总报告

输出 `.eval-artifacts/known-feasible-baseline-20261008/baseline-summary.json` 和一份简短 Markdown 报告：

- 10 次运行逐行表：运行结论、第一卡点、子原因、耗时、模型调用数、Google 请求数、首个合格结果出现时刻、实际展示时刻。
- 能力指标：`KNOWN_FEASIBLE_SUPPORTED` 变体中 `QUALIFIED_DELIVERY` 的数量／总数。
- 诚实处理指标：原版实时 5 例中处理正确的数量（交付合格，或诚实无结果）。
- 安全指标：`FALSE_CLAIM` 数量，必须为 0。
- 第一卡点分布、子原因分布。
- 回放种子清单（决策捕获中的具体行）。
- 覆盖观察：系统不支持来源上的见证汇总。

报告由独立复核者核对后，才进入下一工作包的排序。

## 7 文档同步

- **STATUS：** "当前门槛"改为——Phase 3 剩余行转为诊断；当前门槛为本基线。保留原有 Phase 3 结论和资源记录的链接。
- **DEVLOG／TEST-LOG：** 各追加一条（WP-A 实现、变体冻结、见证、两批运行、归因结论），分别标注运行模式；同步月度逐条索引。
- **INDEX：** 在"仓库治理"下加入本 Playbook 链接。
- **验收契约 README：** 加一句说明——已知可行变体属于独立 cohort（`restaurant-read-development-variant@1`），不改变 Gold@6，结果不与原版混报。
- 不改写任何历史记录和 Accepted ADR。若后续"跟随店家预约入口"需要改变 ADR-0032 的边界，另起新 ADR。

## 8 本工作包不做

- 不修改生产代码（WP-A 仅改 eval Runner）。
- 不新增评分平台、测试矩阵或额外 Live 轮次。
- 不扩大半径、不放宽 HARD、不改时间解释、不指定门店。
- 不做 §0 中暂停的事项。
- 不在运行期间修复问题。

## 9 下一工作包（预告，不在本包范围内）

完整安排、退出条件和预算见 [第一阶段 Playbook](AGENT-WEB-OPERATION-PHASE-1-PLAYBOOK.md)，以下为摘要。

1. **真实观察回放：** 用 `decisions.jsonl` 中的回放种子，把模型实际收到的输入交给真实模型（temperature 0）离线重放，确认能复现 Live 中的错误决策。之后每项改进先在回放上验证，再上 Live。
2. **模型可见性与执行器：** 只给模型看相关区域、加入动作历史、卡住时开启思考、操作后统一等待页面稳定、UNKNOWN 附带原因和下一步可尝试的动作。
3. **覆盖面：** 先做地区入口由 Agent 选择、候选按坐标和半径校验；"跟随店家预约入口"需另起 ADR，由用户决定。
4. 具体顺序以本基线的第一卡点分布为准。

---

## 附录 A：变体 YAML 草稿

须用户审核后冻结。`reference_time` 填计划运行时间；实际运行时间由 Runner 记录。

```yaml
---
# Known-feasible capability variant of H001. Not canonical H001; Gold@6 unchanged.
id: kf-h001-20261022
dataset: restaurant-read-development-variant@1
parent:
  dataset: restaurant-read-development@6
  sha256: 00b69476e6d07eec5dcd9a657555c4e3766629fce5f8e630512710252886ffb6
reference_time: 2026-10-13T10:00:00+09:00
content: |
  Looking for an omakase spot near Shibuya for 2 people on Thursday, October 22 at 7 PM.
semantic:
  target:
    goal: AVAILABILITY
  location:
    value: Shibuya
    relation: NEAR
  date:
    expression: Thursday, October 22
    value: 2026-10-22
  time:
    value: "19:00"
  party_size: 2
  criteria:
    - value: omakase
      polarity: POSITIVE
      strength: HARD
acceptance:
  required_claims:
    - Correct outlet near Shibuya; source-supported omakase; and a matching current slot on 2026-10-22 at 19:00 for 2.
    - Preserve the explicit party size of 2; opening hours alone do not establish seating.
  optional_investigation: []
  review:
    - Known-feasible capability variant; witnesses are recorded separately before the run.
    - Original H001 and Gold@6 are unchanged; results are reported in the variant cohort only.

---
# Known-feasible capability variant of H002. Not canonical H002; Gold@6 unchanged.
id: kf-h002-20261024
dataset: restaurant-read-development-variant@1
parent:
  dataset: restaurant-read-development@6
  sha256: 00b69476e6d07eec5dcd9a657555c4e3766629fce5f8e630512710252886ffb6
reference_time: 2026-10-13T10:00:00+09:00
content: >
  Recommend a first-date restaurant near Higashi-Ginza for Saturday, October 24 at 6:30 PM. Around 10,000 yen per
  person. No hot-pot restaurants and no Sichuan/Hunan-style cuisine where spicy food is the main focus.
semantic:
  target:
    goal: AVAILABILITY
  location:
    value: Higashi-Ginza
    relation: NEAR
  date:
    expression: Saturday, October 24
    value: 2026-10-24
  time:
    value: "18:30"
  party_size: 2
  criteria:
    - value: good for a first date
      polarity: POSITIVE
      strength: UNSPECIFIED
    - value: around 10,000 yen per person
      polarity: POSITIVE
      strength: SOFT
    - value: Sichuan/Hunan cuisine
      polarity: NEGATIVE
      strength: HARD
    - value: hot pot restaurant
      polarity: NEGATIVE
      strength: HARD
acceptance:
  required_claims:
    - Correct outlet near Higashi-Ginza and a matching current slot on 2026-10-24 at 18:30.
    - Infer two diners only from the closed first-date party; retain that as an inference rather than user-quoted text.
    - Exclude hot-pot restaurants and Sichuan/Hunan-style cuisine where spicy food is the main focus; this is not a ban on every spicy dish.
  optional_investigation: []
  review:
    - Known-feasible capability variant; witnesses are recorded separately before the run.
    - First-date suitability is UNSPECIFIED and approximately JPY 10000 per person is SOFT.

---
# Known-feasible capability variant of H003. Not canonical H003; Gold@6 unchanged.
id: kf-h003-20261023
dataset: restaurant-read-development-variant@1
parent:
  dataset: restaurant-read-development@6
  sha256: 00b69476e6d07eec5dcd9a657555c4e3766629fce5f8e630512710252886ffb6
reference_time: 2026-10-13T10:00:00+09:00
content: >
  Need a place for a team dinner nearby on Friday, October 23 after work. 10 people, around 3,000 yen per person,
  good for drinks, ideally with a private room.
semantic:
  target:
    goal: AVAILABILITY
  location:
    value: nearby
    relation: NEAR_USER
  date:
    expression: Friday, October 23
    value: 2026-10-23
  time:
    expression: after work
    type: TIME_WINDOW
    start: "17:30"
    end: "22:00"
  party_size: 10
  criteria:
    - value: team dinner
      polarity: POSITIVE
      strength: UNSPECIFIED
    - value: around 3,000 yen per person
      polarity: POSITIVE
      strength: SOFT
    - value: good for drinks
      polarity: POSITIVE
      strength: UNSPECIFIED
    - value: private room
      polarity: POSITIVE
      strength: SOFT
acceptance:
  required_claims:
    - Correct outlet near the explicitly supplied evaluation location; preserve Friday 2026-10-23, 10 people and after-work intent, and obtain a matching current slot for the 17:30–22:00 window.
    - Do not claim that 10 people can be seated or booked without corresponding support.
  optional_investigation: []
  review:
    - Known-feasible capability variant; witnesses are recorded separately before the run.
    - Team-dinner/drinks remain UNSPECIFIED; budget and private room remain SOFT.

---
# Known-feasible capability variant of H004. Not canonical H004; Gold@6 unchanged.
id: kf-h004-20261021
dataset: restaurant-read-development-variant@1
parent:
  dataset: restaurant-read-development@6
  sha256: 00b69476e6d07eec5dcd9a657555c4e3766629fce5f8e630512710252886ffb6
reference_time: 2026-10-13T10:00:00+09:00
content: |
  Good cafes nearby to meet up with a friend on the afternoon of Wednesday, October 21.
semantic:
  target:
    goal: RECOMMENDATION
  location:
    value: nearby
    relation: NEAR_USER
  date:
    expression: Wednesday, October 21
    value: 2026-10-21
  time:
    expression: afternoon
    type: TIME_WINDOW
    start: "12:00"
    end: "17:00"
  criteria:
    - value: cafe
      polarity: POSITIVE
      strength: HARD
    - value: good for meeting a friend
      polarity: POSITIVE
      strength: UNSPECIFIED
acceptance:
  required_claims:
    - Correct cafe near the supplied location; opening hours support the relevant part of the 12:00–17:00 window on 2026-10-21.
  optional_investigation:
    - Availability is optional; missing reservation support does not block cafe recommendations.
  review:
    - Known-feasible capability variant; witnesses are recorded separately before the run.
    - Do not require a party size merely to recommend cafes.

---
# Known-feasible capability variant of H005. Not canonical H005; Gold@6 unchanged.
id: kf-h005-20261021
dataset: restaurant-read-development-variant@1
parent:
  dataset: restaurant-read-development@6
  sha256: 00b69476e6d07eec5dcd9a657555c4e3766629fce5f8e630512710252886ffb6
reference_time: 2026-10-13T10:00:00+09:00
content: |
  Any spots nearby with open tables on Wednesday, October 21 at 6 PM for 4 people? Local food only, no fast food.
semantic:
  target:
    goal: AVAILABILITY
  location:
    value: nearby
    relation: NEAR_USER
  date:
    expression: Wednesday, October 21
    value: 2026-10-21
  time:
    value: "18:00"
  party_size: 4
  criteria:
    - value: local food
      polarity: POSITIVE
      strength: HARD
    - value: fast food
      polarity: NEGATIVE
      strength: HARD
acceptance:
  required_claims:
    - Correct outlet near the supplied location, with source-supported local-food and no-fast-food conditions.
    - An explicitly observed matching slot for 4 on 2026-10-21 at 18:00; opening hours alone are insufficient.
  optional_investigation: []
  review:
    - Known-feasible capability variant; witnesses are recorded separately before the run.
    - Local food keeps the user meaning relative to the destination; do not broaden it to all food or equate missing fast-food keywords with compliance.
```

## 附录 B：见证记录模板

```json
{
  "variantId": "kf-h001-20261022",
  "qualifiedAt": "2026-10-13T09:00:00+09:00",
  "qualifiedBy": "USER_MANUAL",
  "center": { "latitude": 0, "longitude": 0, "radiusMeters": 1000, "basis": "Google named-place resolution at <time>" },
  "witnesses": [
    {
      "outletName": "",
      "sourceUrl": "",
      "bookingSource": "TABELOG | TABLECHECK | OTHER:<name> | PHONE_ONLY",
      "supportedBySystem": true,
      "distanceMeters": 0,
      "hardEvidence": [{ "criterion": "omakase", "url": "", "quote": "" }],
      "exclusionEvidence": [],
      "slot": { "date": "2026-10-22", "partySize": 2, "time": "19:00", "observedAt": "", "evidence": "<screenshot path>" },
      "openingHours": null,
      "notes": ""
    }
  ],
  "classification": "KNOWN_FEASIBLE_SUPPORTED | KNOWN_FEASIBLE_UNSUPPORTED | NOT_QUALIFIED",
  "postRunRecheck": null
}
```

## 附录 C：归因 sidecar 模板

```json
{
  "runArtifact": "",
  "decisionCapture": "",
  "recording": "",
  "cohort": "KNOWN_FEASIBLE | CANONICAL_REALTIME",
  "witnessClassification": "KNOWN_FEASIBLE_SUPPORTED | KNOWN_FEASIBLE_UNSUPPORTED | NOT_APPLICABLE",
  "automaticEvaluation": { "qualified": "YES | NO", "dimensions": {} },
  "outcome": "FALSE_CLAIM | ENV_FAILURE | INTERNAL_FAILURE | QUALIFIED_DELIVERY | CAPABILITY_MISS | HONEST_NO_RESULT",
  "firstBlocker": {
    "stage": "ENV | SEMANTIC | LOCATION | DISCOVERY | IDENTITY | FACTS | AVAILABILITY | GROUNDING | AGENT_STRATEGY | BUDGET | COVERAGE",
    "subCauses": [],
    "evidence": ["trace#", "decision#", "screenshot"],
    "summary": ""
  },
  "witnessFunnel": [
    { "outlet": "", "discovered": false, "factsInvestigated": false, "availabilityChecked": false, "result": "" }
  ],
  "postRunWitnessRecheck": null,
  "resources": { "elapsedMs": 0, "modelCalls": 0, "googleRequests": 0, "firstQualifiedAtMs": null, "presentedAtMs": null },
  "replaySeeds": []
}
```
