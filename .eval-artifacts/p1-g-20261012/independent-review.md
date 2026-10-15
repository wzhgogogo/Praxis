# P1-G 收尾复核

- 复核时间：2026-10-12 17:00 北京
- 复核者：独立复核（Claude），非实现者
- 依据：
  - 远端分支 `codex/feat-live-restaurant-read-path`，HEAD `504b903`；
  - `.eval-artifacts/p1-g-20261012/` 下的报告、summary、evaluation 副本、trace、交付后核验，以及见证 GET 原始响应；
  - 修复提交 `b627511`（地点解析）、`9b34287`（诚实结束）。
- 限制：四次运行的 result.json 和 decisions 在本机冻结工作树中，没有提交。本次通过 summary、evaluation 副本和 trace 归因；h001 的根因只能给出假设，需要实施者用真实快照确认。
- 证据状态：开发集已暴露，非 Clean Baseline。

## 结论

**第一阶段仍不签收，唯一原因是 h001。**

- 修复 A（地点解析）在 Live 中生效。
- 修复 B（诚实结束）只在离线组合测试中生效。B h001 在 Live 中再次以 `REJECTION_LIMIT` 失败，用户没有得到任何答复。
- 其余三例按事先确定的口径都可以接受。

## 逐例归类

| 用例 | 结果 | 复核归类 | 依据 |
| --- | --- | --- | --- |
| 吉祥寺 天妇罗 10/20 18:00 ×2 | 0 交付，NO_VERIFIED_RESULT，循环 TERMINAL | **CAPABILITY_MISS，主卡点属第二阶段** | 见下文 |
| B h001 涩谷 omakase 今晚 19:00 ×2 | FAILED，`REJECTION_LIMIT`，0 交付 | **INTERNAL_FAILURE** | 见下文 |
| B h003 附近 本周五下班后 ×10 | 1 家：Aloft by Marriott Tokyo Ginza，150 m（TableCheck） | **QUALIFIED_DELIVERY** | 见下文 |
| B h004 附近 今天下午 咖啡馆 | 0 交付，NO_VERIFIED_RESULT，循环 TERMINAL | **HONEST_NO_RESULT（附说明）** | 见下文 |

**吉祥寺：**

- 地点解析成功（Kichijōji，`colloquial_area`，35.704096, 139.580205），Tabelog 进入了吉祥寺地区（A1320/A132001），修复 A 生效。
- Agent 只发现 6 家候选，查位后都没有 18:00 ×2。3 家见证店在认证时和运行后 10 分钟内的 GET 中都有 18:00 ×2，但没有一家进入候选（trace 中出现 0 次）。
- 第二批发现在 07:10:28 撞上整单浏览器时限：`DEADLINE_EXCEEDED`。时间主要花在对 5 家已确认无位的候选做事实读取上：
  - 页面链接 A→B→A 来回打开；
  - 3 次超时、2 次预算耗尽。
- 主卡点：见证店未进入候选，候选查位都无位。按附录 D，这属于"搜索级空位筛选（原 C7）"和"尽量 3 家"的发现覆盖，归第二阶段。
- 次因：对无位候选做事实读取，且读取中来回打开同一链接。前者属于"Agent 选店质量"（附录 D 第一组第 4 项）；后者属于第一阶段的 C1 动作历史遗留。
- 复核者判断：主卡点在第二阶段范围。即使事实读取完全正确，这 6 家也没有位。

**B h001：**

- 查位 5 家，Tabelog 发现阶段出现 2 次 `BROWSER_RUNTIME_FAILED`（点击被遮挡）。循环第 15 步因拒绝达到上限而终止，`loop.status = REJECTION_LIMIT`。
- 修复 B 的诚实结束路径没有走到，见下节。

**B h003：**

- Gold@7 的 h003 是"本周五下班后"，运行在 10/12，应查 10/16。
- trace 序号 1505–1539 显示 TableCheck 页面为 Oct 16、"10 guests, selected"、时间选择器 19:00 及多个时段按钮；evaluator 的原始 trace 核对为 AVAILABLE。
- 条件措辞等价："team dinner" = "suitable for a team dinner"，其余与 P1-F 核对一致。
- 距离 150 m ≤ 1 km。

**B h004：**

- 运行于东京 17:02，Gold 的下午窗口（12:00–17:00）已过。原因是 TableCheck preflight 503 和 15 分钟的重试间隔，把运行推迟到了窗口结束之后。
- 系统查了 10 家咖啡馆：
  - 9 家 `REQUEST_SELECTION_UNCONFIRMED`；
  - Noa Cafe 当天不可选，`DATE_NOT_SELECTABLE`。
- 最终如实以无结果结束，没有把时间挪到明天，没有错误展示，符合 Gold 中"已过的下午不得改到明天"的要求。
- 说明：
  - 系统仍把推荐类请求当成查位，这与 P1-F KF-H004 是同一偏差，属第二阶段；
  - 没有快速判断"下午已过"，用满了 47 次调用（C6a 遗留）；
  - 这个样本没有检验到交付路径。

## 修复 B 为什么在 Live 中没有生效

修复 B 只在同时满足以下四个条件时走诚实结束（`restaurant-agent-loop.ts` 的 `terminate`），任何一个不满足，就照旧以 `AGENT_LOOP_TERMINATED` 结束为 FAILED：

1. `phase` 是 UNDERSTANDING、SEARCHING 或 SELECTION_REQUIRED；
2. `state.failure` 为空，或者是 `GOOGLE_LOCATION_UNRESOLVED`、`GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED` 之一；
3. `END_READ` 或 `PRESENT_RESULTS` 通过 `validateRestaurantAction`；
4. Router 返回 `READ_ENDED_NO_VERIFIED_RESULT`（或交付事件）。

离线组合测试构造的状态是 `state.failure` 为空、候选少，四个条件都满足。Live 的状态不同：

- **条件 2 最可疑。** 查位或发现过程中的局部失败会留下 `state.failure`。例如 `AVAILABILITY_FAILED` 会把 `failure` 设为该码（`task-definition.ts` 第 441 行）。h001 有 2 次浏览器运行失败，只要最后一次失败事件之后没有新的成功事件清掉 `failure`，条件 2 就不成立。
- **条件 3 也可能不成立。** 被拒时还有 33 家可查候选（`rejection-context-inspection.json`），`END_READ` 可能因"仍有可查候选"被拒绝。

两种情况都说明，**这个兜底本身是"失败时关闭"的**：诚实结束依赖 Agent 动作的校验规则，而这些规则是为 Agent 自己选择的动作设计的。这正是测试方法复核所说的"离线组装与 Live 状态不一致"。

正确的做法：除非明确属于系统错误，否则循环终止一律给用户一个结果。

- 系统错误要逐项列明：服务商拒绝、异常、副作用不确定等。
- 单家候选的局部失败（`AVAILABILITY_FAILED`、单个页面的 `BROWSER_RUNTIME_FAILED`）属于业务情况，不是系统错误。
- 有合格候选就按现有规则交付；没有就直接记为无结果，附上原因和已查范围，不经过 Agent 动作校验。

## 签收条件（按 Playbook §12A 事先确定的口径）

| 条件 | 结果 |
| --- | --- |
| 1 能力 | ✓（沿用 P1-F） |
| 2 泛化 | **按口径转第二阶段**：中目黑合格；神乐坂、吉祥寺的主卡点都在第二阶段 |
| 3 安全 | ✓ P1-G 唯一交付（Aloft）经原始 trace 核对；全阶段 FALSE_CLAIM 0 |
| 4 诚实处理 | **✗** h002 ✓、h003 ✓、h004 如实无结果、h005 如实无结果、h001 ✗ |
| 5、6 | ✓（P1-G 的修复不涉及站点代码；地名只在测试中） |

如果 h001 修好并补跑后为合格或如实无结果，第一阶段可以签收为"第一阶段完成，泛化目标转入第二阶段"。

## 其他记录

- TableCheck preflight 503 共 3/7 次，宿主机线路的间歇问题仍在。
- 运行时间：用户批准提前运行后，东京 15:47–18:47 都允许启动，但 h004 被 503 推迟到下午窗口结束之后。以后时间相关的用例应以"请求在运行时仍然成立"为启动条件。
- 仓库是公开的。`.eval-artifacts` 中提交了 Tabelog 和 TableCheck 的整页快照与 HAR，可能涉及来源网站的使用条款，建议改为不提交或改为私有。未发现本项目自己的密钥；页面中的 Google 地图密钥是 Tabelog 自己的。
