# Browser Agent 餐厅只读调查收尾 — 2026-09-16

- Status: Completed for agreed read-only slice / current development evidence
- Document revision: 0.2
- Source of truth for: 本轮修复、真实运行复核和明确限制；当前能力摘要以 STATUS 为准
- Classification: 已暴露开发证据；不是 Clean Baseline、任意网站保证或预约提交验收
- Scope: [P0–P4 计划](../BROWSER-AGENT-RESTAURANT-IMPLEMENTATION-PLAN.md)

## 实现与审查

本轮继续使用现有 BrowserTaskExecutor、ModelBrowserReadActionDecision、Playwright 和来源 Adapter；未引入 Stagehand、browser-use 或 Midscene 生产依赖，也未新增第二个自治浏览器循环。

1. **库存与控件分离。** Tabelog 时间按钮进入预约流程，因此只观察、不点击。两个 Playwright Session 被动接收来源允许的 GET JSON，不读取凭证、不另发查询。当前 DOM 的日期/人数与响应中的日期/人数、每条库存的店铺 ID 和时刻必须一致。新请求立即废弃旧响应，迟到响应不能恢复旧库存；空响应没有独立店铺关联时仍为 UNKNOWN。
2. **商户与物理页面一致。** 搜索结果遍历其他分店后，必须重新回到已核实分店，再操作查询。Grounding 另外拒绝当前页面与已核实分店 URL 不一致的观察。曾把 Maru 另一分店库存关联过来的运行已作废，原始 artifact 保留，不能算成功。
3. **多语言发现。** 英文完整店名无结果时，读取 Google 指向的网站；独一公开电话相符后，可用唯一 H1 作为检索别名。别名不成为身份凭证，平台详情仍须独立核实。不包含人工填写店名映射。
4. **真实下拉框与停滞。** 共用 Registry 识别只读 ARIA combobox 和 option；禁用的已选日期仍作为当前状态证据，其等价日期触发器不再被反复推荐。只读焦点输入通过 ArrowDown 正常展开，不强制点击遮挡元素。动作 Prompt@4 / wire@3 区分 CLICK 展开和 CLICK_AUTHORITATIVE 选择准确值；Schema 拒绝反馈保留实际原因，不再一律误报引用不存在。展开状态进入观察，已打开触发器不再成为候选；TIME 只能选择已观察且在权威窗口内的时刻，普通 CLICK 也不能绕过。TableCheck 邻店和窗口外链接不再完成本店当前查询。
5. **复杂信息与跨页记忆。** Google 网站关联加精确公开电话可以关联英文店名与日文页面。按语义定义列表读取完整取消规则；Tabelog/OWST 公开套餐卡保留方案名、价格、税费、人数和午餐等适用限制。每页单独 Grounding、指纹与来源引用；跨页仅合并读取进度，不把所有事实挂到最后一页。部分来源失败不抹去此前已验证的事实。
6. **比较与修订。** 商业信息请求会实际触发网站事实调查。套餐是公开菜单说明，不自动成为特定日期/人数的可订价格。模型上下文保留带来源的当前套餐说明；Web 展示核实结果及调查缺口，引用各事实自己的来源。条件修订使旧库存失效，刷新后仍由数据库权威状态恢复。
7. **语义。** Semantic Prompt@14 区分“比较价格、读取取消政策、提供来源、不预订”等执行说明与餐厅筛选条件；真正的免费取消要求、金额上限仍保留。原始时间与允许的替代窗口分别保存。
8. **限定商户的调查收束。** 真实 Web 轨迹暴露出业务模型在两店调查后继续查其他店，不能补齐原店缺口。Agent Decision Prompt@14 明确限定目标及可调查列表；真实保存上下文的对照验证“必要事实仍读取 / 已尝试来源后展示并保留未知”。首轮诊断失败保留，最终两例通过；最终 Web 复验使用此代码，不将取消的扩展调查包装成成功。

## 真实证据与失败记录

本轮原始输入、登记、代码 hash、执行记录、截图和日志在本地 `.eval-artifacts/browser-final-2026-09-16/`；目录不提交。下面均为 Live Read-only，不代表长期成功率。

| 场景 | 结果与边界 |
|---|---|
| Tabelog 八芳，9/20、4 人、18:30–19:30 | 真实 Google → Adapter → 模型动作 → 库存核验；5 个时段，来源店铺 13292459；6 calls，52.9s。执行 `10-36-51-784Z-7522427b…` |
| TableCheck 一石三鳥，9/18、2 人、18:30–19:30 | 3 个时段，1 call，15.2s；执行 `10-52-38-164Z-7db52d2f…` |
| 八芳网站套餐与取消规则 | 真实共享事实组合，1 call，约 10s；首页规则与 /courses 三档套餐分别保留引用，含 11:30–16:00 限定。正确共享预算运行 `11-04-58-385Z-c01448f3…`；早一份诊断脚本预算字段拼错，不能用作预算验证 |
| 第一批新店：TableCheck Namikibashi Sushi Hajime | 搜索到的分店电话冲突，UNKNOWN；不证明平台没有此店 |
| 第一批新店：Tabelog Ginza Maru | 首次“5 时段”因跨分店错误作废（`10-23-01…7bf92c…`）。修复后 9/20 请求无法确认；随后真实 Web 的 9/19、4 人在正确店铺 13160854 取得库存。不是未见过商户的首次成功 |
| 第二批新店：TableCheck Ginza Yakiniku seigou | 名称匹配，但 Google 050 号码与平台 03 号码冲突，UNKNOWN；未放松身份防线 |
| 第二批新店：Tabelog Ginza Rangetsu | Google 英文全名无结果；网站 H1 只有图片而无文本，现有别名路径不能提取，UNKNOWN。属于发现能力限制，不是无位 |
| Budget Reset | 零模型真实来源验证：设置→Update→重开→Reset→URL 参数清除→再重开为 0–15；`filter-reset-result.json` 无错误 |
| 4 人 TableCheck 故障 | 先复现日期循环，再发现 ARIA 控件遗漏，再发现模型动作字段误用；各次失败分别保留。一次修复后复验因模型 TIMEOUT 尚未执行动作，不算控件失败或通过 |
| Web 比较及修订 | 当前最终运行见下方收尾结果；此前两次运行中一轮修订超时，一轮在复现动作错误后通过 UI 取消；均不得替换成成功 |

第一份 Maru 成功标签的作废原因：身份为 `/13160854/`，物理查询/库存为 `/13170856/`。这是产品错误，不是新店库存变化。原始执行没有重写；代码和真实浏览器/Adapter 回归已增加隔离防线。

## 验证口径

最终增量：TableCheck 当前唯一 ready widget 中，只有日期、人数、所选时间匹配且允许窗口内完整半小时时段卡全部明确禁用，才完成无位判定；缺项、loading、重复区域和旧条件仍为未知。八芳 9/19、4 人、18:30–19:30 的真实模型复验返回 UNAVAILABLE / NO_MATCHING_SLOT（7 calls、58.7s，`11-56-00-150Z-18055462…`）；范围外 20:00 没有被当作合格替代。保存页面的局部 Replay 为 `disabled-slots-replay.json`。

Web 新任务隔离：登录后的迟到列表/详情响应不能覆盖用户的新建或切换选择，旧 EventSource 消息不能重新绑定旧任务。真实 Chromium 回归先复现再通过。发生竞态的旧任务运行另存并取消，不作为新任务验收。最终四项门禁及 Chromium 日志为 `final-complete-{typecheck,arch-check,test,build,test-browser-fixture}.log`：368/368、23/23、类型/架构/构建通过。

Agent 调查收束 Prompt 修复后再次通过四项门禁（`final-focus2-*`，368/368），浏览器 DOM 未再变化，沿用上述 23/23；真实模型固定上下文 `agent-focus-final.json` 为 2/2，前次失败 `agent-focus-live.json` 保留。没有增加查询次数、fallback 或新的 Agent 框架。

- 离线：typecheck、arch:check、build；全套 368/368；真实本地 Chromium 23/23，最终日志如上。Cloudflare 的 Session 实现使用本地 Chromium Fixture 验证，不等于 Cloudflare 线上服务已验收。
- 新回归集中扩展已有测试：串分店、翻译名称发现、被动响应竞态、商业信息接线、跨页归属、ARIA 下拉框及动作拒绝反馈；不按模块新增重复测试文件。
- 修复前失败依据：`branch-before.log`、`discovery-before.log`、`pax-before.log`、`wire-feedback-before.log`、`pax-post-before.log`、`pax-keyboard-before.log`、`tablecheck-branch-before.log`。UTF-8 Fixture 和诊断脚本预算字段错误另记，不能算产品反例。
- Semantic@14 定向真实诊断通过本次“调查说明不变成硬条件 / 真正价格上限和免费取消仍是硬要求”对照。既有静态 regression@3 **仍未通过：15 turns、11 evaluated、1 pass、10 oracle mismatch、4 upstream blocked**，产物 `restaurant-semantic/2026-09-16T11-07-56-473Z-restaurant-semantic-regression-3.json`。其 stage oracle 仍要求旧式已物化日期、UNSPECIFIED 条件及缺少当前 TARGET；不能把当前结构合法当作这套回归通过，也没有修改 Gold 来追平结果。未读取或运行私有 Holdout。
- 原始执行与结果复核分开保存；未知不当作无位，已取消运行不当作完成。
- 除上述保存页面的局部 Replay 外，没有整条来源 Replay 验收；未运行 Controlled Live-write。未提交预约、支付、登录或代勾条款。

## 明确限制

- 新店身份冲突、多语言名称发现和无结构公开页面仍可能 UNKNOWN；没有承诺任意商户必能核实。
- 空 Tabelog 响应不能独立证明无位；不把下拉时间选项当库存。
- 套餐页价格不代表当前时段可订或价格锁定；缺失取消条款明确未知。
- 完整视觉地图、其他类别网站、真实预约提交与 Outcome 验证属于 P5；未加入本轮完成声明。
- 本地实验用了会话专属 PostgreSQL 55439 / Web 3033，未改 `.env` 或复用生产库；最终清理状态在下节记录。未 commit、未 push，保留原有工作区改动。

## B1–B14 复核范围

| 行为 | 结论与证据范围 |
|---|---|
| B1 活动层/遮罩 | PASS：真实 Chromium Fixture；背景不可执行，不强制点穿。 |
| B2 替代时段 | PASS：真实两站库存及 TableCheck 窗口无位；原 19:00 和许可窗口分别保留；窗口外 TIME 与普通 CLICK 都被拒绝。 |
| B3 日期/人数状态 | PASS：两 Session Fixture；真实 TableCheck 4 人和 Tabelog 4 人路径；options 不当作 selected。 |
| B4 Filters | PASS：Fixture 完整链；真实 Cuisine 勾选/撤销和 Budget Update/Reset 分别留证。Reset 为 scripted 零模型，不冒称自主模型。 |
| B5 滑条/容器滚动 | PASS（限定）：Fixture 双端金额与目标滚动；真实 Budget 显示/URL/重开/Reset；未推广为任意滑条。 |
| B6 新页 | PASS（Fixture）：同会话切换与旧引用失效；未把它称为所有 popup 兼容。 |
| B7 复杂信息 | PASS（限定）：真实八芳跨页取消规则/完整套餐限制、Maru 套餐；展开与包间/no-show 反例由离线链覆盖，未观察到的真实字段仍未知。 |
| B8 两店比较 | 最终 Web 结果见收尾；候选与页面来源隔离另有离线反例。 |
| B9 修订 | 最终 Web 结果见收尾；离线链验证旧动态证据失效，真实已有旧失败保留。 |
| B10 新条款替换 | PASS（离线）：Reducer 与真实 Chromium Web refresh；没有制造现实网站条款变化来验证。 |
| B11 权限/注入/旧引用 | PASS（离线反例）：无任意 JS/URL、条款勾选或预约提交权限；本轮 Live Read-only。 |
| B12 取消/预算/清理 | PASS（限定）：共享预算离线与真实事实读取；失败 Web 经 UI Stop 取消；整体授权不取消每任务保护。 |
| B13 新商户 | 执行完成、迁移存在失败：两批预登记结果逐个保留；不以调试后复验替换首次结果。 |
| B14 地图 | PARTIAL / 明确限制：已有非语义控件诊断不等于可靠地图标记与地理范围理解；完整地图能力仍属 P5。 |

这是实现者之外的原 Reviewer 对 Terra 交付的继续审查与修复记录。后续修复由同一 Reviewer 完成，因此最终自验不冒称另一位独立 Reviewer 的批准；原始执行、独立结果复核 sidecar 与代码测试分别保存。

## 收尾结果

**本轮 P0–P4 的餐厅只读目标已经完成验收；新商户失败和 P5 边界如上，不扩大为任意网站或全语义通过声明。**

最终实际 Web 为 `web-comparison-2026-09-16T12-14-36.307Z.json`，case `restaurant:51748c52d383c85d96ce9b0c`。两轮均由真实 Semantic → Agent → Router → Google/浏览器 → Evidence → Reducer → PostgreSQL → Web 执行，无人工指定按钮或注入成功状态。

| 请求 | 真实结果 |
|---|---|
| 9/18、2 人、偏好 19:00、允许 18:30–19:30 | 八芳 3 个时段；Maru REQUEST_SELECTION_UNCONFIRMED，保留其套餐和缺失取消条款说明；PRESENT_RESULTS。 |
| 改为 9/19、4 人，保留两店与许可范围 | Maru 在正确店铺 13160854 得到 5 个时段；八芳 NO_MATCHING_SLOT。旧日期/人数库存不作为当前结果；PRESENT_RESULTS。 |

两轮刷新后保留相同任务和正确条件，脚本无页面错误；合计 8 次业务决策，case 累计约 200s。第二轮资源字段是 case 累计值，不与首轮重复相加。Web 原始记录没有完整 browserModelCalls/tokens 统计，费用未估算。最新界面只显示两家实际调查商户，过期库存显示需要刷新及检查时间，按到期时刻自动重绘；不追加网络请求。复杂套餐适用人数、午餐限制、税费和各自来源仍保留。

原始执行：`restaurant-web-read/2026-09-16T12-16-27-185Z-1b941c06…result.json` 与 `12-17-56-972Z-83c0ccc3…result.json`。原 evaluator@14 因缺少替代许可、强制 `near` 前缀误判，原件保留。修复 exporter 从 SEMANTIC_PROPOSAL_COMPILED 事件保留许可，并升级 evaluator/rubric@15；新反例拒绝未授权/扩大许可、窗口外或未标记替代的 Offer、错误地区。`web-turn{0,1}.reexport.result.json` 通过实际 exporter 对保存记录做离线重新导出，events/trajectories/finalSnapshot 逐项相同、原 SHA 固定，不是新 Live。两个新 evaluation 的 AUTHORITATIVE_CONDITIONS、REQUIRED_EVIDENCE、INVESTIGATION_BEHAVIOR、FINAL_CLAIM、COMPLETION_OUTCOME 均 SATISFIED；RESOURCES 仍 NOT_EVALUATED，整体 systemBehavior 也不冒称完全通过。

最终默认测试 369/369、类型/架构/构建通过（`final-eval-*`）；Chromium 全量 23/23（`final-complete-test-browser-fixture.log`），其后展示范围/库存到期仅重跑受影响真实浏览器用例（`web-discovery-*`、`web-expiry-*`）。真实 Web 新版渲染复查单列 `web-final-view*`，不追加餐厅或模型调用。B8/B9 为本轮实际 Web PASS；B13 为已执行且保留迁移失败，不标成全部成功。

工作树包含此前改动，未 reset/stash/commit/push。完整源码清单与可恢复快照保存在本地 artifact 目录的 `delivery-source-manifest.json` / `delivery-source-snapshot.tar.gz`；历史失败、首次 Maru 作废复核及所有取消记录不删除。测试进程清理结果见同一 artifact 目录的 `cleanup.json`。

最终交付复跑已完成：`delivery-{typecheck,arch-check,test,build,test-browser-fixture}.log` 全通过，369/369 与 23/23，覆盖最后的库存自动过期展示。`web-comparison.review.json` 单独检查两轮请求/来源/替代标签/动态证据及重载；`web-final-view.json/png/txt` 记录最终实际页面，两个商户、无脚本错误、旧库存明确过期。`cleanup.json` 于 2026-09-16 13:44 UTC 确认本次专属 3033/55439 均无监听，数据库文件与全部证据保留。
