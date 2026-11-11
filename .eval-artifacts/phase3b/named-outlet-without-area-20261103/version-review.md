# 具名店无单独地区：版本确认停止点

用户决定日期：2026-11-03。状态：draft / not integrated，尚未实施。分支 `codex/fix-phase3b-named-outlet-without-area`，基于最新 main `d4d8ea33a4cf32b01601474f02ad89c538bf3f69`。真实模型、Google、网站、Live 调用均为 0；未读取或加载 `.env`。

按本次用户指令第 5 项，在修改持久合同及版本之前停下，请复核者确认以下版本方案。产品代码、A 的评测/夹具、B 的 G3 文件均未修改。

## 为什么不是只移除一个 area 检查

1. `intent-state.ts:missingSearchFields` 无条件要求地区；`missingBlockingFields`、`completeRestaurantIntent` 和 `completeRestaurantSearchIntent` 也要求地区。只去掉第一个判断，后续仍无法构造合法搜索/查位请求。
2. `contracts.ts:RestaurantSearchIntent.area` 是必填字段；`RestaurantBookingIntent` 继承该合同。`RestaurantTaskState.intent` 保存的正是这个对象。
3. `task-definition.ts` 在 `RESTAURANTS_FOUND` 中把 `event.request.intent` 原样写入 State（当前第 437 行）。因此允许具名店的完整 intent 不含 area，会改变持久合同，不能只当作临时 Adapter 修改。
4. 现有地点证据和距离观察都围绕 `TASK_LOCATION_RADIUS`、`EVALUATION_LOCATION_RADIUS`、`NAMED_PLACE_RADIUS`。不能给无地区具名店伪造一个地区或圆心，也不能把解析出的地址冒充用户 AREA。
5. Google 查询/地点解析、Native 发现、展示资格、B1 投影和条款上下文均直接读取 `intent.area` 或 `draft.area`。它们需要明确的具名店分支，不能靠类型断言、空字符串或硬填 Tokyo 绕过。

## 待确认的最小版本方案

| 对象 | 当前 | 建议 | 原因 |
| --- | --- | --- | --- |
| Restaurant State | `restaurant-state@24` | `restaurant-state@25` | 持久 `intent` 在有效 SPECIFIC_OUTLET 请求中可没有 area；地点依据不再必然是用户地区/半径。 |
| Restaurant TaskDefinition | `22` | `23` | Reducer 接纳该完整 intent；搜索、唯一性/歧义、展示和下游合同随之改变。 |
| Semantic Proposal Schema | `4` | 不变 | 原语义合同本来允许省略 AREA，D3 原输出已正确。 |
| Semantic Prompt | `26` | 不变 | 不需要模型补地区或改写店名。 |
| Agent Prompt / Action Schema | 当前版本 | 预计不变 | 现有 SEARCH_RESTAURANTS / ASK_USER / CHECK_AVAILABILITY / PRESENT_RESULTS 足够；不新增动作。若实施时发现必须改变，另行报告。 |
| Intent Draft Schema | `3` | 不变 | Draft.area 本来就是可选；不回填来源地址为用户地区。 |

不新增持久 State 顶层字段。具名解析的请求名、唯一门店、来源地址与证据引用记录在既有候选及 DISCOVERY/readEvidence 中，明确标注地点依据为 `NAMED_OUTLET_RESOLUTION`（店名解析），不冒充半径或用户输入。具体 claim 只服务本次已明确的具名路径，不另造通用地理层。

本停止点不修改上述常量、类型或事件，也不操作任何数据库。后续如实际运行需要处理已有 State@24 任务，沿既有显式版本/数据保留协议处理，不自动迁移、删除或重置。

## 确认后实施的切片

- 只有非空店名的 SPECIFIC_OUTLET 可省略地区。OPEN_ENDED 的地区/nearby 坐标规则不变，日期/人数/时段的查位要求不变。
- 从权威店名在东京服务范围内检索，不构造地区圆心和半径，也不以这些半径排除具名店。东京范围依赖来源地址证据；不编造地理事实。
- Google 候选到来源继续使用现有 G4 原名→合法片段→同 Place ID 日文名及现有身份规则。用户目标不能唯一对应门店时，不查另一个分店替代，不自动选择；保留歧义并由 Agent ASK_USER。找不到时如实说明。
- 同店唯一确认后的来源地址可以用于本次页面/条款读取的地点依据，明确来自店名解析。用户没有地区/圆心时不显示虚构的距离，也不产生 HARD 地区“已满足”声明。
- 若用户后来提供地区，既有语义 patch/reset 以该用户地区为准，清除旧轮解析与资格；不得让派生地址覆盖用户条件。
- B1 继续受已展示/就绪集合、同店/日期/人数/时段、身份、新鲜度和两次校验约束；条款继续共用预算、同渠道、同页证据和 20 秒保留。
- 不改 A 的评测文件、原 G6/B1/条款/选店测试断言或 B 三个 G3 文件。若这些边界会被阻断，另行报告。

## 已冻结的 D3 输入

来源：A `cc9562cd00fd3f17ef08ceeeef5c536385f5e629`，`w1-runs/D3/execution.decisions.jsonl`。只读提取，无网站请求。

- 完整原件两行 SHA-256：`e411b975545e4e5d8b1f26afa146b1ba6caffb53bb227938ee6e49b6641cc942`。
- 决策 #1 原 JSONL 字节（含原换行）SHA-256：`420bcef8f2c7bd2f1360aa9b62f10d0dc6a536b064402b7361508c2c80de3ac4`。
- 同时保留 `outputText` 原文 UTF-8，不加换行、不改写。提取方式、长度与所有 SHA 见 `frozen-input.json`。
- 已核对：TARGET 为 `Kushi Katsu Dengana Akabane ten`、AVAILABILITY、SPECIFIC_OUTLET、BOOKING_WORDING；有 DATE/TIME_WINDOW/PARTY_SIZE，没有 AREA。

这些只是冻结输入与静态分析，**尚未取得本次 createLiveReadAssembly 红灯或绿灯，不宣称产品修复完成**。确认版本后，先提交 C 自有整组装回放配置，再在当前产品上取得 search=false/ASK_USER 的有效红灯；随后实现唯一店→查位→展示→B1，补齐歧义/OPEN_ENDED 缺地区/未找到/后续用户地区四类反例，最后运行五门禁与严格 G2。完成后只推工作分支，不合 main，通知 A 并交复核。

本停点仅保存原件和方案，不运行不相关的五门禁，也不把历史 main 的全绿报告成新代码的验证。等待复核者确认 State@25 / TaskDefinition@23 后继续。
