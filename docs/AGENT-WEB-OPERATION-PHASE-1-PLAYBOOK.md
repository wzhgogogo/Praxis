# Agent 网站操作第一阶段 Playbook

- Status: Draft
- Document revision: 0.6
- Last updated: 2026-10-10
- Evidence status: draft / not integrated；开发集已暴露，非 Clean Baseline
- Source of truth for: 第一阶段（通用网站操作能力）的目标、工作包、退出条件、预算与护栏；不替代 Accepted ADR、Gold@6 或当前能力记录
- Related ADRs: [ADR-0017](decisions/0017-controlled-browser-read-executor.md)、[ADR-0025](decisions/0025-model-directed-read-investigation.md)、[ADR-0032](decisions/0032-source-native-restaurant-discovery.md)、[ADR-0036](decisions/0036-generic-public-read-network-policy.md)、[ADR-0037](decisions/0037-request-driven-discovery-source-packs.md)
- Related documents: [H001–H005 已知可行基线 Playbook](H001-H005-KNOWN-FEASIBLE-BASELINE-PLAYBOOK.md)（本阶段的 P1-A）、[STATUS](STATUS.md)、[H001–H005 验收契约](../src/eval/restaurant/agent-loop/cases/README.md)、[Capability Matrix](integrations/CAPABILITY-MATRIX.md)

## 0 一句话目标

让 Agent 在真实预约网站上，**用通用能力**可靠完成"找到候选 → 读到事实 → 设好日期和人数 → 读到有效时段"这条操作链。以 H001 为牵引，H001–H005 共同验收；不靠站点硬编码、评测坐标或店名分支来过关。

## 1 为什么是这个阶段

截至 2026-10-08 的诊断（详见基线 Playbook §0）：

- **离线测试与真实网站脱节。** 合成页面基本是一行 HTML，测试里的模型是按标签返回正确动作的剧本，离线全绿不能预测 Live。
- **浏览器 Agent 被削弱。** 页面文字只取前 4,000 字、可操作目标全量发送；没有动作历史；所有调用关闭思考；单次输出上限 320 token。真实页面上的异步加载、轮播、弹窗于是只能逐站补代码，例如 Tabelog 加载动画的专用 HTML 解析。
- **地点到来源地区靠一张手写表。** 只覆盖 Shibuya、Shinjuku 和一个等于评测点的东银座坐标，换个地点就走不通。
- **验收流程串行卡死。** 组件矩阵消耗了 145 次诊断调用，整单运行一直排在最后。

本阶段只解决"网站操作"这一层。检索词规划、跟随店家预约入口、通用信息抽取、第三来源放到第二阶段。

## 2 已确定的决定（2026-10-08，用户确认）

1. 验收拆成两类，分开统计、互不替代：
   - 能力类：已知可行变体（事先独立确认有位）。
   - 诚实处理类：原版实时任务（有位交付，没位如实说明）。
2. Phase 3 剩余行（TableCheck 发现、官网事实、受限库存、真实日历完整回放）转为诊断，不再卡整单运行。
3. Live 和浏览器相关测试只在宿主机固定网络运行；沙箱不跑。
4. 暂停：TableCheck 发现矩阵修补、真实日历 HAR 完整回放、官网事实矩阵、第三来源选型。
5. 已知可行变体允许在冻结前改到相邻时刻；KF-H001 的 19:00 已有见证，不需要改。
6. 变体原文与 Gold（基线 Playbook 附录 A）已审核冻结。
7. （2026-10-09）条件措辞等价暂时由人工确认：归因复核时逐对确认"系统理解的条件与 Gold 是否同义"，结果记在 sidecar 中；暂不改评估器。
8. （2026-10-09）"现在／right now"属于用户的正常说法，系统不得要求用户改说法。改为理解成"从现在起 30 分钟内最早可订的时段"：展示时说出实际时段；附近没有就如实说明，可以把"最近可订的时间"作为选项提出，但不得替用户改时间；明显不在营业时段时快速作答，不逐家查位。这需要修改 H005 的 Gold 与验收说明，按数据集版本规则升级（@6 → @7），旧产物不重标。

保持不变：Semantic Prompt／Schema、Gold@6、HARD／身份／半径／新鲜度规则、整单 500 秒／50 次模型调用、只读、无任何预约／支付／个人信息写入。

## 3 实施原则

1. **Agent 提议，代码校验。** 进哪个地区入口、点哪个控件、何时等待、怎么翻轮播，交给模型。门店身份、半径、HARD、日期／人数／时段绑定、新鲜度、只读边界，由代码确定性校验。
2. **修复必须通用。** 每项改动要写明它针对的失败标签，以及受益的至少 2 个用例；否则必须证明它是安全不变量。共享层（`src/infrastructure/browser`、`src/domains`、`src/application`）不得出现站点域名、站点样式类名、地名或评测坐标。
3. **先回放，后 Live。** 改动先在"真实观察回放"上证明有效，再上真实网站。
4. **被替代的站点代码要删除。** 遵守 AGENTS.md：Pilot 前不保留兼容路径。通用机制覆盖之后，删掉对应的站点专用实现。
5. **流程从简。** 不新增阶段矩阵、评分平台或测试平台。原始产物只追加、不覆盖。离线门禁沿用 Test Skill，只重跑受影响范围。

## 4 工作包总览

| 编号 | 内容 | 依赖 | 主要产出 |
| --- | --- | --- | --- |
| P1-A | 已知可行基线（即基线 Playbook WP-A–F） | — | 10 次运行、第一卡点分布、回放种子、决策捕获 |
| P1-B | 真实观察回放 | P1-A | 可重复的离线回放评测和带标注的种子集 |
| P1-C | 通用网站操作改进 C1–C7 | P1-B | 执行器、观察、决策合同的通用改动，以及删除的站点代码 |
| P1-D | 地区入口改由 Agent 选择 | P1-A（可与 P1-C 并行） | 删除地区表；新地点也能发现候选 |
| P1-E | 中期复测 | P1-C 的 C1–C4 | 已知可行 5 例复测和改进对比 |
| P1-F | 最终复测与签收 | P1-C、P1-D | 已知可行、新地点、原版实时三批运行和阶段结论 |

P1-C 的默认顺序是 C1 → C2 → C3 → C4 → C5，C6、C7 为条件项。**P1-A 完成后，按基线的子原因分布重新排序**（映射见 §11），优先做占比最高的项。

**2026-10-09 按 P1-A 归因调整后的顺序：** C0（新增）→ C1 + C5 → C3 + C4 → C6 → C2 → C7；P1-D 并行。依据见 `.eval-artifacts/known-feasible-baseline-20261008/review/p1-a-baseline-summary.md`。

**2026-10-09 补跑后再调整：** C0（已完成，`43b52b5`）→ C0b（保留量对读取生效）+ C5a（新增）→ C6a → E1（评估器快照绑定）→ C1 + C5b → C3 + C4 → C2 → C7；P1-D 并行。G1（TableCheck 预约入口页读取）等用户决定。

**2026-10-09 夜间批次复核（独立复核，21:55 东京）：** 本地提交 `a466874` C0b、`59d0c5e` E1、`ef0ff24` C6a、`a84ed8e` P1-B、`cd82a7e` C5a、`6b216c0` 检索词分析；G1 在隔离分支 `79afc57`。均未推送，四门禁通过（最终 777/777，G1 分支 778/778）。复核结论：
- C0b、E1、C5a 代码通过；C5a 尚无真实页面证据，由下一次 Live 验证。
- C6a 代码通过；ADR-0039 与 Gold@7 草稿内容正确，等用户确认。遗留：未实现"当地明显不在营业时段时快速结束"。
- P1-B 原样回放通过（冻结错误复现 88/92 = 95.65%）；静态重建受阻，Recording 没有保存 CSS，裁切、滚动几何无法还原，0 个可评价。改进效果暂以 Live 为准，Recorder 补存样式列为后续项。
- 回放种子更新为 `seeds.v2.json`：21 个"现在"类 Agent 种子标为 SUPERSEDED_BY_CONTRACT（标签基于已退役的 1 分钟有效期）。
- 下一步：用户确认 G1、ADR-0039/Gold@7 后，跑 kf-h001、kf-h003 两次 Live（计入 P1-E 的 5 次），见证店已于 21:48 东京复查仍有位。

**2026-10-10 P1-E 预跑（`5aac484`，独立归因见 `.eval-artifacts/p1-e-early-20261009/independent-review.md`）：** kf-h003 首次合格交付（人工，附说明：100 Spoons TOYOSU，距评测点 2,976 m）；kf-h001 仍为能力缺口，没有出现合格候选，C0/C0b 未经检验。C5a 在真实网站上有效（10 人两步选中）。G1 只通一半：预约页的公共脚本和样式被 Guard 拦截，页面空白。新发现：TableCheck 明确无位提示未被识别。下一批：G1b 静态资源规则、TableCheck 明确无位、C1、C3；随后用 P1-E 剩余 3 次跑 kf-h001、kf-h002、kf-h005。

**2026-10-10 第二批复核（独立复核，06:00 北京；详见 `.eval-artifacts/p1-c-batch-20261010/independent-review.md`）：** 本地提交 `c19043c` G1b、`28185ba` TableCheck 明确无位、`d0cc85f` C1、`70c14d1` C3、`4b9621c` Recorder、`9bd2e8f` C0c、`aab7485` C6a 补充、`cd61ed9` ADR-0040 草稿，均未推送，四门禁通过（最终 796/796）。
- G1b、TableCheck 明确无位、Recorder、ADR-0040 草稿通过；C1、C3、C0c 通过但各有遗留；C6a 补充需修。
- C1 回放（22 个新种子已独立标注，`seeds.v4.json`）：TableCheck 提交搜索后改为等待 2/7 → 5/7；Tabelog 分类面板已打开时进入分类 0/3 → 2/3；页面已写明"0 results"的店名搜索循环 0/4 不变；正向对照 #31（无在线日历时请求帮助）退步。效果有限。
- Live 前要修：C3 在持续变化的页面上可能永远判为"仍在加载"；保留量触发时同批已完成门店的结果被丢弃。P1-F 前要修：C6a 补充一家店关门就结束整个读取；ADR-0039 原文被改写一句，需恢复。
- 更正：P1-E 预跑复核中 kf-h001 #31 应为 SOURCE_LIMIT（无在线日历），不是 ASYNC_SETTLE。
- 见证店 10/10 06:53 东京复查，kf-h001、kf-h002、kf-h005 的 8 家 Tabelog 见证店全部有位，有效到 10/11 06:53 东京。

## 5 P1-A 已知可行基线

完全按 [基线 Playbook](H001-H005-KNOWN-FEASIBLE-BASELINE-PLAYBOOK.md) 执行，本文不重复。和第一阶段直接相关的要求：

- WP-A 的决策捕获必须同时记录：每次浏览器决策对应的观察序号、URL，以及（开启 `--record-browser` 时）Recording 中对应的 DOM 快照序号。P1-B 要靠这些把"模型看到的内容"和"当时的页面"对上。
- 归因 sidecar 的子原因标签是 P1-C 排序的唯一依据。新增标签 `REPETITIVE_STEPS`（同类操作需要多次模型决策，例如人数轮播逐格点击，因而耗尽局部预算）。
- 已完成：变体冻结、见证预认证（5/5 SUPPORTED）。运行前 24 小时内需复查空位。

**状态（2026-10-09）：** 8 次主运行已完成并经独立归因。kf-h003（环境失败）、kf-h005（停止规则误触发）、h005（凌晨运行，样本无效）待补跑，共 3 次，使用环境失败重跑的预留次数。

**状态（2026-10-09 17:52 东京）：** 3 次补跑完成并归因，P1-A 收口。已知可行 5 例中合格或可接受 3 例（kf-h002、kf-h004、kf-h005），能力缺口 2 例（kf-h001、kf-h003）；原版实时 5 例中合格 2 例；错误展示 0；合计 442 次模型调用。补跑的新发现见 §7 C5a、C6a、E1、G1。

**决策点：** 基线汇总完成后，用 1 页说明给出：P1-C 的实际顺序；被跳过的条件项；是否有 P1-C／P1-D 之外的主导卡点（例如 `OWN_PLATFORM_ONLY` 占多数）。若有，由用户决定是否提前进入第二阶段的对应工作。

## 6 P1-B 真实观察回放

### 目的

让"Live 中做错的那一步"能离线复现、离线验证修复。这是离线结果能预测 Live 的前提。

### 两种回放模式

| 模式 | 输入 | 回答的问题 |
| --- | --- | --- |
| 原样回放 | `decisions.jsonl` 中的完整 messages，原样发给真实模型 | 同样的输入，模型是否稳定地做出同样的决定（基线保真度） |
| 重建回放 | 用 Recording 中的 DOM 快照，在本地 Chromium 中以静态页面加载（禁用脚本和网络），交由**当前代码**的控件识别、观察构建和决策合同重新生成输入，再发给真实模型 | 改了观察、历史、Prompt 或思考模式之后，模型在同一页面上是否做对 |

重建回放只针对"决定下一步动作"这一层，不追求复现异步网络和完整页面行为。需要验证异步行为的改动（C3），用本地 Chromium Fixture 加上 P1-E 的真实运行来验证。

### 种子与标注

- 种子来源：基线 sidecar 中标为 `OBSERVATION_GAP`、`MODEL_DECISION`、`NO_ACTION_MEMORY`、`ASYNC_SETTLE`、`REPETITIVE_STEPS`、`REGION_BINDING` 的决策；也收录 Live 中做对的关键决策，作为反向对照，防止改坏。
- 每个种子由独立复核者标注"可接受动作集合"，例如 `WAIT`、`CLICK 标签为 "›" 的人数箭头`、`CHOOSE_OPTION 10 guests`。标注依据当时页面和之后的真实结果，不依据生产代码的判定。
- 文件：`.eval-artifacts/phase1-replay/seeds.json`（格式见附录 A）。种子一经冻结，只追加不改；标注错误以新版本更正，并保留旧版本。

### 实现入口（建议）

- 新增 Runner `src/eval/restaurant/agent-loop/runners/run-decision-replay.ts`，复用现有 `ModelBrowserReadActionDecision`、控件识别和 Executor 的观察构建，不另写一套。
- 输出每个种子的模型动作、是否落在可接受集合、耗时和 token，以及按标签汇总的通过率。

### 退出条件

- 原样回放：标注为错误的种子中，至少 80% 能复现原错误动作（证明回放保真）。复现不了的种子单独列出，不计入改进评估。
- 重建回放：对当前代码跑一次，得到改进前的通过率，作为 P1-C 的对照。
- 回放评测纳入 P1-C 每项改动的必过检查：目标标签的通过率上升，反向对照不下降。

### 预算

每轮回放的真实模型调用 ≤ 种子数 × 2（原样回放加重建回放各一次）。整个阶段回放调用合计 ≤ 1,500 次。不做多次采样投票。

## 7 P1-C 通用网站操作改进

每一项都写明：要改什么、主要入口、需要的证据、要删除的站点代码。入口行号以 41205e8 为准，实施时以实际代码为准。

### C0 按调用预算交付（针对 `DELIVERY_POLICY`，2026-10-09 新增）

- **问题：** 默认批次交付窗口只在剩余时间 ≤45 秒时打开（`src/application/restaurant-agent-loop.ts` 中的 `openDeliveryWindow`）。模型调用预算先耗尽时，即使已有合格候选，也不会展示。kf-h001 从第 38 次调用起就有合格结果，最终因 50 次耗尽而没有交付。
- **改什么：** 当剩余模型调用 ≤ N（建议 4 次，足够一次 Agent 决策加展示）且已有合格候选时，同样打开交付窗口，复用现有的 `DEFAULT_BATCH_DELIVERY_WINDOW_OPENED` 事件和资格规则。展示资格、证据和新鲜度规则不变。
- **证据：**
  - 离线组合测试正反例：正例是调用将尽且有合格候选时实际展示；反例是没有合格候选时不展示，且不放宽任何条件。
  - 用 kf-h001 第 38 和 49 次决策的上下文做回放，确认展示动作合法并被选中。
- **范围说明：** 这是运行时交付策略，不属于浏览器操作，但它直接阻断 H001 交付，而且对五个用例都通用，因此放在第一阶段的最前面。
- **状态（2026-10-09 复核）：** 已在本地提交 `43b52b5` 实现（未推送），新增 ADR-0038。离线 766/766 通过；组合测试覆盖合格、决策中跨阈值、错人数、过期证据、明确数量 5 种情形；kf-h001 #38（人为设为剩余 4 次的边界对照）和 #49（原始剩余 2 次）各 1 次真实模型回放，均选择展示并通过校验。
- **遗留 C0b：保留量要对查位和事实读取生效。** 现在只在 Agent 决策前后检查剩余次数。一次查位动作里的浏览器决策（单店上限 20 次）和事实判断仍可把最后 4 次用光，预算在读取途中耗尽，已有的合格结果照样展示不出来。kf-h001 那次是查位恰好剩下 2 次才赶上。改法：已有合格默认首批时，读取动作可用的模型调用不超过"剩余次数 − 4"，用到上限就以带原因的 UNKNOWN 结束读取、交回 Agent。补正反例：合格候选已存在、剩余 6 次时 Agent 选择查位，读取在剩余 4 次时停下，随后窗口打开并展示；无合格候选时读取不受此限制。

### C1 动作历史（针对 `NO_ACTION_MEMORY`、`MODEL_DECISION`）

- **改什么：** `BrowserReadDecisionInput` 增加 `history`，即最近约 6 步。每步记录动作类型、目标标签／种类、字段、执行结果（已执行／被拒及原因／无变化／页面已变化），以及 URL 是否变化。现有一句话的 `progress` 保留为当前状态提示。Prompt 写明：不要重复已被拒绝或无效果的动作。
- **入口：** `src/infrastructure/browser/browser-action-decision.ts`（输入类型和 Prompt）、`src/infrastructure/browser/browser-task-executor.ts`（约 414–560 行的决策循环）。
- **证据：** 重建回放中 `NO_ACTION_MEMORY` 种子的通过率上升，反向对照不下降。Prompt 和 Schema 版本号递增，不保留旧版本。

### C2 聚焦观察（针对 `OBSERVATION_GAP`）

- **改什么：** 取消"整页 `innerText` 取前 4,000 字"的截断方式（executor 约 534 行），改为按与目标的相关性组织：
  1. 当前弹窗、对话框或遮挡层的文字优先；
  2. 与目标相关的控件（日期、人数、时间、搜索框、结果列表、分页）周围的局部文字；
  3. 可见的忙碌或加载提示；
  4. 剩余预算内的页面概要。

  可操作目标按相关性排序并设上限（例如 80 个），超出部分给出"还有 N 个未列出"的提示，引用编号仍以执行器为准。
- **入口：** executor 的观察构建（约 514–560 行）、`src/infrastructure/browser/playwright-browser-controls.ts`。
- **证据：** `OBSERVATION_GAP` 种子的重建回放通过率上升；同时报告真实页面上单次决策输入 token 的中位数变化。

### C3 操作后统一等待页面稳定（针对 `ASYNC_SETTLE`）

- **改什么：** 每个动作执行后、下一次观察前，执行器统一做一次有界等待，满足以下全部条件或超时即停：
  1. 由该动作触发的网络请求已结束（Guard 已能看到请求）；
  2. DOM 在一个短窗口内（例如 300 ms）不再变化；
  3. 页面上没有可见的通用忙碌标记（`aria-busy=true`、`role=progressbar`，以及可见的 spinner、loader、skeleton 类元素）。

  上限 3–5 秒，并受剩余预算约束。超时不报错，而是在下一次观察中注明"页面可能仍在加载"，交给模型决定是 `WAIT` 还是换路。
- **入口：** executor 的动作执行和观察之间；现有 `waitFor`（约 387 行）和 `waitForChange`（约 1,003 行）合并进同一机制。
- **要删除的站点代码：** 通用等待在回放和 Fixture 上证明覆盖相同场景后，删除：
  - `tabelogSelectedQueryIsPending`、`TABELOG_QUERY_SETTLED_SELECTOR` 及其在 `tabelog-browser-availability.ts` 中的调用（约 570–590 行）；
  - TableCheck 中以 `[data-testid="Venue Availability"]:not(:has(.skeleton))` 为选择器的专用等待（约 830 行）。

  库存的最终绑定校验（日期／人数／时段／所属门店）保持不变。
- **证据：**
  - 本地 Chromium Fixture 正反例：正例是"点日期 → 加载动画 → 人数按钮重新出现"；反例是加载超时不得接纳旧结果。
  - 若 10/8 Tabelog 已知可行库存第一轮（0/5，点完日期后又重复点日期）留有对应的 DOM 快照，则纳入种子，并在重建回放中不再重复点日期。
  - P1-E 复测中 `ASYNC_SETTLE` 下降。

### C4 卡住时开启思考（针对 `MODEL_DECISION`）

- **改什么：** 浏览器决策默认保持快速模式。出现以下任一情况时，下一次决策启用 `thinking: "enabled"`，并相应放宽输出上限和超时：动作被拒、动作执行后页面无变化、模型提出与上一步相同的动作、完成判定被拒。业务 Agent 在有 `lastRejection` 时同样处理。所有调用照常计入 50 次整单预算。
- **入口：** `browser-action-decision.ts`（约 347 行）、`src/domains/restaurant/agent-decision.ts`（约 180 行），由 executor 和 Agent loop 传入"是否卡住"。
- **证据：** 在同一批 `MODEL_DECISION` 种子上，对比快速模式和思考模式的通过率与耗时。若思考模式没有明显提升，就不启用，并记录这一结论。
- **2026-10-10 补充：** 同一页面状态（URL、可见文字、可交互状态相同）下再次提出与上次相同的动作和目标，执行器不执行，记为拒绝，并作为"卡住"信号。评测种子扩大到 `seeds.v4.json` 中有历史的种子和全部正向对照（含 #31 无在线日历时请求帮助）。

### C5a 滚动列表里的选项直接可选（针对 `OBSERVATION_GAP`、`REPETITIVE_STEPS`，2026-10-09 补跑新增）

- **问题：** 已展开的列表（`role=listbox`）里，只因列表自身滚动而被裁掉的选项，执行器有意不列为可选目标（`src/infrastructure/browser/playwright-browser-controls.ts` 的 `visibleWithinScrollableOwner`），只在列表上提供 `SCROLL_REGION`。TableCheck 10 人下拉只露出 1–8 人。h003 和 kf-h003 共 54 次这样的观察，模型一次都没滚动，每次都重新点开下拉；选项一露出来，模型 2/2 立刻选中。两次运行 100 次调用里占 54 次。
- **改什么：** 已展开列表中的选项，只要在 DOM 中、属于当前展开的列表、未禁用，就照常列为可选目标，并标注"不在可视区"。`CHOOSE_OPTION` 执行时先在所属列表内把它滚到可见，再核对标签、所属控件和可见性，然后点击。滚动由执行器完成，不消耗模型调用。时段列表同样适用。
- **入口：** `playwright-browser-controls.ts`（目标观察和 `CHOOSE_OPTION` 执行）。
- **证据：**
  - Fixture 正反例：正例是选项被列表滚动裁掉，仍可一次选中；反例是不属于当前展开列表的选项、被遮挡层盖住的选项不暴露。
  - 重建回放：kf-h003 #8–#49 和 h003 #7–#50 中的同类种子，1–2 次决策内选中 10 人。
- **与 C5b 的关系：** 原 C5（"重复点击直到出现"，针对轮播箭头）改称 C5b，范围缩到真正需要逐格点击的控件。

### C5b 重复性界面操作（针对 `REPETITIVE_STEPS`）

- **改什么：** 允许模型对同一控件提出"重复点击直到目标值可见"，例如人数轮播的右箭头点到出现 10。动作只能绑定权威字段（DATE／PARTY_SIZE／TIME），最多重复 10 次。每次点击后由执行器重新观察并检查目标值是否已出现，中途不调用模型；目标出现即停，越界或无变化即停。
- **入口：** 动作合同（`browser-action-decision.ts` 的 Schema 和解码）、executor 的执行分支。
- **证据：** Fixture 中 1–6 可见、需要前进到 10 的轮播。在基线 Live 记录或见证复核到的真实页面（Tabelog 人数轮播）上的重建回放中，模型决策次数从约 5 次降到 1–2 次。

### C6 "未知"带原因和下一步，以及"现在"的处理（条件已满足，2026-10-09 确认要做）

**C6a 过期请求与"现在"（依据 §2 第 8 条）：**

- 把 "right now／现在" 物化为 `[当前时刻, 当前时刻 + 30 分钟]`，取窗口内最早可订的时段。精确时段如实展示，不说成"此刻有位"。
- 请求的有效期同步改为覆盖到窗口结束。现状是 `validUntil = 参考时刻 + 60 秒`、`EXACT_ONLY`；h005 16:47 的有效样本中，发现阶段用了 58 秒，第一次查位时请求已过期约 0.4 秒，42 家全部 `IMMEDIATE_REQUEST_EXPIRED`。
- 请求的时间窗已整体过期，或在当地明显不在营业时段时，允许直接 `END_READ`，或提出"最近可订时间"这一选项；不再对每家候选逐一查位。
- TableCheck 搜索页上观察到的 "Available now" 筛选，可作为发现阶段的合法查询控件使用，必须通过通用执行器，不写站点代码。
- 同步修改 H005 的 Gold 与验收说明，数据集升级为 @7，并补离线正反例：
  - 正例：30 分钟内有时段时展示；
  - 反例：窗口已过期时快速结束，不循环查位。

**C6b "未知"带原因和下一步：** 以下为原条项内容。

- **改什么：** 查位和事实读取返回 UNKNOWN 时，进入业务 Agent 上下文的内容包括：原因码、看到了什么、还缺什么、建议的下一步（等待后重查／换候选／属于来源限制）。代码不会因此放宽任何接纳条件。
- **入口：** `src/domains/restaurant/agent-context.ts`、各 Adapter 的 ground 结果。

### C7 搜索级空位筛选（条件项：基线中见证店未被发现，或大量候选查位无位、耗尽时间时做）

- **背景：** 见证预认证时观察到，两个来源的公开搜索都能按日期、时间、人数直接筛选，结果卡片带有可预订时段：
  - Tabelog：`rstLst/?vac_net=1&svd=&svt=&svps=`
  - TableCheck：`date`、`num_people`、`time`、`availability_mode`

  现有发现流程只用关键词，然后逐家打开日历。
- **改什么：** 发现阶段允许 Agent 操作页面上观察到的日期、人数、时间筛选控件，使用现有权威字段，不允许改值。Recorder 的文档语法补齐这些参数，以便忠实录制。运行时 Guard 已处于 ADR-0036 的通用 GET 模式，不需要放宽。搜索结果中的时段只作为线索；最终空位仍要到门店自己的日历或查位入口，按现有规则绑定后才接纳。
- **证据：** 在已知可行变体上，见证店进入候选的比例上升，查位次数和耗时下降。

### E1 评估器快照绑定（评测基础设施，2026-10-09 补跑新增）

- **问题：** evaluator@25 用该门店"最后一张"TableCheck 快照核对空位结论。kf-h005 先查位（快照 #471：Oct 21st、4 guests、18:00）、后读事实（快照 #497：重新打开、默认日期 Oct 9th），于是必需证据被判为未评估。之后凡是先查位、后读事实的 TableCheck 交付都会这样。
- **改什么：** 空位结论绑定到产生该证据的查位阶段快照（同一门店、阶段为 AVAILABILITY、`observedAt` 最接近）。不放宽任何判定。
- **证据：** 用 kf-h005 的原始产物重新评价，必需证据得出确定结论；构造一个"查位快照无该时段、后续快照有"的反例，仍判不满足。

### G1 TableCheck 预约入口页读取（Guard，等用户决定）

- **问题：** 部分 TableCheck 门店的空位只在 `/en/shops/<slug>/reserve` 上。Adapter 会去这里（`tablecheck-page-parser.ts` 的 `resolveTableCheckReservationTarget`），但 `playwright-read-network-guard.ts` 对所有 `/reserve` 路径默认拒绝，`tablecheck-public-query.ts` 没有对应的复核规则。11 次运行中 7 次出现，被拦的有 KF-H001 备用见证店 Sushi Teppen、KF-H003 见证店 168 Tenshin、kf-h005 中最合适的候选 Omotenashi。离线组合测试（`native-discovery-composition.test.ts`）断言会打开这条路径并交付，Live 却被拦。
- **建议：** 以 ADR-0036 补充说明的形式加一条窄规则：只允许 GET 文档、固定查询参数，只读到日期、人数、时段列表为止，不允许任何"下一步"或提交；Guard 测试同时覆盖放行形态和仍被拒的形态。
- **不放行时：** 这类门店记为 `SOURCE_LIMIT`，不计入见证店；离线测试改为断言"被 Guard 拒绝并返回带原因的 UNKNOWN"，与 Live 一致。

### 每项改动的完成标准

- 对应标签的回放通过率上升，反向对照不下降。
- 受影响的 Fixture 测试有正反例，并保留修复前失败的记录。
- 通过 typecheck、arch:check、npm test、build。
- 写明删除了哪些站点代码。
- DEVLOG 和 TEST-LOG 各一条。

## 8 P1-D 地区入口改由 Agent 选择

### 问题

`src/integrations/restaurant-search/source-packs.ts` 中的 `tabelogRegions` 只有 3 条，其中一条的锚点就是评测坐标（35.6697003, 139.7671399，容差 100 m）。不在表里的地点会报 `DISCOVERY_SOURCE_LOCATION_UNGROUNDED`。

### 改什么

1. 删除 `tabelogRegions` 和基于它的 `tabelogRegion()`。
2. 目录型来源（`flow: DIRECTORY`）在没有可直接使用的地区入口时，由 Agent 在来源页面上自选入口，可以：
   - 沿着页面上观察到的地区／车站链接逐级进入；
   - 把权威地点名称填进页面上观察到的地区／车站搜索框。动作合同增加权威字段 `LOCATION`，只允许填入权威地点名称，不允许改写。
3. 给模型的地点信息：权威地点名称，以及已解析的 Google 地址组成部分（区、町名、最近车站）。不提供任何站点地区代码。
4. **代码校验不变：** 每个候选仍按详情页坐标做精确半径接纳。另加一条早期判定：同一入口下首批详情读取中，若绝大多数候选（例如 4/5 以上）在半径之外，就判定入口错误，允许 Agent 换一次入口（限 1 次），并记录原因。

### 决策要求

需要新增一份窄 ADR：来源地区入口可由 Agent 选择，以坐标半径校验兜底；修订 ADR-0037 中"地区入口为 Pack 数据"的部分。在用户批准之前不合入。

### 证据

- 新地点发现探测：Ebisu、Roppongi、Nihonbashi、Ikebukuro、Asakusa 各 1 次，只跑发现阶段，每次 ≤ 6 次模型调用、≤ 90 秒。通过标准：至少 4/5 能到达一个列表，且其前 10 个候选中至少一半在 1,000 m 半径内。
- Shibuya、东银座、Shinjuku 的原有用例不退化（用已有 Fixture 和一次真实探测确认）。

## 9 P1-E 中期复测

**时机：** C1–C4 合入后。

**内容：** 已知可行 5 例各跑一次，方法与 P1-A 完全相同。若原变体日期距运行日已不足 3 天，按同一规则另建新日期变体，并重新做见证认证。

**对比：** 逐例比较第一卡点和子原因的变化，以及交付数量、耗时、模型调用数。

**判断：**

- 本阶段负责的标签（§11 中映射到 P1-C／P1-D 的标签）作为第一卡点的次数没有下降：停止继续打补丁，带着证据和用户重新规划。
- 有下降但仍有剩余：按新的分布继续 C5–C7 和 P1-D。

## 10 P1-F 最终复测与阶段签收

### 三批运行（各一次，运行前冻结提交和配置）

| 批次 | 内容 | 次数 |
| --- | --- | --- |
| 已知可行 | H001–H005 的新日期变体（运行日后 7–14 天），重新做见证认证 | 5 |
| 新地点 | 不在开发集中出现过的地点和菜系，同样经见证认证（草稿见附录 B） | 3 |
| 原版实时 | `h001`–`h005` 原文，东京时间工作日上午运行 | 5 |

### 阶段退出条件（全部满足）

1. **能力：** 已知可行 5 例中至少 3 例 `QUALIFIED_DELIVERY`，且必须包括 KF-H001。没有交付的，第一卡点不得是本阶段负责的标签。
2. **泛化：** 新地点 3 例中至少 2 例 `QUALIFIED_DELIVERY`。
3. **安全：** 本阶段全部运行 `FALSE_CLAIM` 为 0。
4. **诚实处理：** 原版实时 5 例全部归为 `QUALIFIED_DELIVERY` 或 `HONEST_NO_RESULT`，没有 `INTERNAL_FAILURE`。
5. **回放：** 回放评测纳入常规离线检查；本阶段种子的重建回放通过率至少 80%。
6. **通用性：** 共享层没有新增站点、地名或评测坐标常量；`tabelogRegions`、Tabelog 加载等待等站点专用实现已删除；站点专用代码总行数没有净增加。

若条件 1 或 2 未满足，但剩余卡点都属于第二阶段范围（检索词、跟随预约入口、抽取、来源覆盖），则记为"第一阶段完成，能力目标转入第二阶段"，并在 STATUS 中如实记录。

## 11 失败标签与工作包映射

| 子原因标签 | 归属 |
| --- | --- |
| `DELIVERY_POLICY` | P1-C C0 |
| `NO_ACTION_MEMORY` | P1-C C1 |
| `OBSERVATION_GAP` | P1-C C2；滚动列表里被裁掉的选项见 C5a |
| `ASYNC_SETTLE` | P1-C C3 |
| `MODEL_DECISION` | P1-C C4（C1、C2 也有影响） |
| `REPETITIVE_STEPS` | P1-C C5a、C5b |
| `GUARD_BLOCK` | G1（等用户决定） |
| `STRICT_GATE_UNKNOWN`、`SUB_BUDGET` | P1-C C6；涉及预算层级收拢的部分转入第二阶段 |
| `REGION_BINDING` | P1-D |
| 见证店未被发现、候选大量无位 | P1-C C7 |
| `GUARD_BLOCK` | 逐例评估；属于通用 GET 被误拦的随本阶段修复，其余转入第二阶段 |
| `RETRIEVAL_TERMS` | 第二阶段（模型检索规划） |
| `OWN_PLATFORM_ONLY` | 第二阶段（跟随店家预约入口，需要 ADR） |
| `PARSER_EXTRACTION` | 第二阶段（通用抽取，优先使用 schema.org JSON-LD） |
| `SOURCE_LIMIT` | 不是缺陷 |
| `ENV_NETWORK` | 环境规则（只在宿主机运行） |

## 12 预算与停止规则

| 项目 | 上限 |
| --- | --- |
| 整单真实运行 | P1-A 10 次 + P1-E 5 次 + P1-F 13 次 + 环境失败重跑预留 5 次，共 ≤ 33 次；每次 500 秒／50 次模型调用；每次 Google 请求 ≤ 40 |
| 回放 | 真实模型调用合计 ≤ 1,500 次 |
| P1-D 发现探测 | ≤ 10 次，每次 ≤ 6 次模型调用、≤ 90 秒 |
| 见证认证与复查 | 不调用模型；只读取来源公开页面和接口，不打开预订表单 |

停止规则：

- 任何运行出现 `FALSE_CLAIM`：立即停止该批剩余运行，先修复。
- 同一项改进在回放上连续 2 轮没有提升：停止该项，带证据请用户决定。
- P1-E 判断"无下降"：停止补丁，重新规划（§9）。
- 只有 `ENV_FAILURE` 可以重跑，每例最多 1 次。
- 不自动扩大任何预算，不放宽任何门槛。

## 12A 剩余工作与关键路径（2026-10-10 06:00 北京）

**已完成：** P1-A；P1-C 的 C0、C0b、C0c、C1、C3、C5a（Live 有效）、C6a、E1、G1、G1b、TableCheck 明确无位、Recorder 补存样式表；P1-B 原样回放与注入式回放；ADR-0040 草稿。已知可行交付过 H002–H005，KF-H001 从未交付；错误展示 0。

**还差：**

1. **Live 前小批（Codex 下一批）：** C3 稳定判定补"可见内容稳定"；保留量触发时保留同批已完成门店的结果；恢复 ADR-0039 被改写的一句；执行器提示语；C4（卡住时开启思考 + 同状态重复动作拦截，先回放评测）。
2. **P1-E 收尾：** kf-h001 → kf-h002 → kf-h005 三次 Live，见证有效到 10/11 06:53 东京，按 §9 判断。
3. **P1-F 前：** C6a 补充的触发范围；视 P1-E 结果决定 C2、C5b、C7。
4. **P1-D（关键路径）：** 用户批准 ADR-0040 → 实施 → 5 个新地点发现探测 + 1 次原地点不退化探测。是退出条件 2 的前提。
5. **检索词最小改法（待用户决定是否提前）：** 跨来源找同一家店时由 Agent 给搜索词（代码只校验由已观察店名中的词组成）；关键词结果 0–1 家时换一次词或改用类别入口；浏览器助手可引用原文报告"本页明确无结果"。直接对应 KF-H001 #24–28 和 Sen 未被发现、H005 的 Tabelog 见证店 0 结果。
6. **P1-F 签收：** 13 次 Live（新日期已知可行 5、新地点 3、原版实时 5），见证认证 8 家变体，按 §10 签收。
7. **清理：** 删除 `tabelogRegions`（P1-D）。C3 已删除 Tabelog 选中查询等待和 TableCheck skeleton 等待（约 −80 行），目前站点代码净减少（退出条件 6）。

**待用户决定：**
- ADR-0040（建议批准）。
- 检索词最小改法是否提前到第一阶段（建议提前）。
- 退出条件 5 改为"原样回放与注入式回放纳入常规离线检查；静态重建通过率转入第二阶段"（建议同意；注入式回放已能离线比较 C1，不依赖 CSS）。

**预算：** 整单 Live 已用 13/33（剩 P1-E 3、P1-F 13、环境重跑预留 4）；回放真实模型调用 215/1,500。

## 13 角色

| 角色 | 职责 |
| --- | --- |
| 实施者（Codex） | P1-A 的 WP-A、P1-B、P1-C、P1-D 的实现和离线验证；按本 Playbook 运行 |
| 独立复核者 | 归因 sidecar、回放种子标注、签收核对；不依赖生产代码的判定 |
| 见证认证 | 用户，或独立复核者用普通浏览器（Claude 可协助）；运行前 24 小时内复查 |
| 用户 | 批准 ADR（P1-D 的窄 ADR；C7 如需改动 Recorder 语法）、批准新变体原文、在停止规则触发时决定方向 |

## 14 文档同步

- **STATUS：** 当前门槛改为"第一阶段：P1-A 基线"，之后随工作包推进更新。
- **INDEX：** 在"仓库治理"下加入本 Playbook 和基线 Playbook。
- **DEVLOG／TEST-LOG：** 每个工作包各一条，并标注运行模式。
- **Capability Matrix：** P1-D 和 C7 改变来源能力描述时同步更新。
- **ADR：** P1-D 的窄 ADR；C7 若需要修订 ADR-0036 的应用方式，另行记录。不原地改写 Accepted ADR。

---

## 附录 A：回放种子格式

```json
{
  "seedId": "p1-seed-0001",
  "frozenAt": "",
  "origin": { "runArtifact": "", "decisionIndex": 0, "observationRevision": 0, "recordingSnapshot": 0, "url": "" },
  "stage": "DISCOVERY | IDENTITY | FACTS | AVAILABILITY",
  "subCause": "OBSERVATION_GAP | MODEL_DECISION | NO_ACTION_MEMORY | ASYNC_SETTLE | REPETITIVE_STEPS | REGION_BINDING | POSITIVE_CONTROL",
  "recordedAction": { "type": "", "targetLabel": "", "field": "" },
  "acceptableActions": [ { "type": "WAIT" }, { "type": "CLICK", "targetLabelPattern": "" } ],
  "labelBasis": "What the page showed and what eventually worked; not the production verdict",
  "labeledBy": ""
}
```

## 附录 B：新地点变体草稿（P1-F 使用，日期在冻结时填写）

用于检验泛化，不得在开发中拿来调参。首次运行后即视为已暴露。

```yaml
---
id: p1-novel-ebisu-kaiseki
content: |
  Looking for a kaiseki restaurant near Ebisu for 3 people on <Weekday, Month D> at 7:30 PM.
semantic: { target: { goal: AVAILABILITY }, location: { value: Ebisu, relation: NEAR }, party_size: 3, time: { value: "19:30" },
  criteria: [ { value: kaiseki, polarity: POSITIVE, strength: HARD } ] }
---
id: p1-novel-roppongi-yakiniku
content: |
  Find a yakiniku place near Roppongi for 4 people on <Weekday, Month D> at 7 PM.
semantic: { target: { goal: AVAILABILITY }, location: { value: Roppongi, relation: NEAR }, party_size: 4, time: { value: "19:00" },
  criteria: [ { value: yakiniku, polarity: POSITIVE, strength: HARD } ] }
---
id: p1-novel-nihonbashi-tempura
content: |
  Any tempura restaurants near Nihonbashi with a table for 2 on <Weekday, Month D> at 6 PM?
semantic: { target: { goal: AVAILABILITY }, location: { value: Nihonbashi, relation: NEAR }, party_size: 2, time: { value: "18:00" },
  criteria: [ { value: tempura, polarity: POSITIVE, strength: HARD } ] }
```

冻结时按基线 Playbook 的变体规则补全 `dataset`、`parent`、`date` 和 `acceptance`，并经用户审核。
