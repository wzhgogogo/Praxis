# C3b 批次独立复核

- 复核时间：2026-10-10 17:40 北京
- 复核者：独立复核（Claude），非实现者
- 范围：本地提交 `cdc74ac`（复核文件）、`6b3256c` C3b、`1d12843` E2、`b2035f3` C2a、`883e068` C8、`b5952f1` Recorder；报告 `.eval-artifacts/p1-c3b-20261010/report.md`
- 方法：逐提交读源码 diff；读探测、E2 重评、C8 回放与 seeds.v5
- 证据状态：开发集已暴露；离线 Fixture、冻结消息回放与只读页面加载探测，不是整单 Live

## 结论

| 项目 | 结论 | 说明 |
| --- | --- | --- |
| C3b | 通过，有一处要补 | 网络条件只计 3 秒内的 document/xhr/fetch；超时后由来源的完成判定在相隔 500 ms 的两次快照上给出相同 `resultKey` 才完成。探测等待中位数 1,266 ms，TableCheck 搜索页 16 个结果可完成。遗留见下 |
| E2 evaluator@27 | 通过 | kf-h005 的 COMPLETION_OUTCOME 从 NOT_SATISFIED 变为 NOT_EVALUATED（剩余缺口是文字，无法独立证明查得够不够），这是合理的保守结论；kf-h001、kf-h002 不变 |
| C2a 日历观察 | 通过 | 通用实现：按 `table`/`grid` 的月份标题和日期格识别日期，请求日期不可点时作为 `DATE_NOT_SELECTABLE` 目标暴露；查位阶段拒绝对其他日期的普通 CLICK。没有站点分支 |
| C8 选店看类别 | 通过，效果未证实 | 类别作为带来源的观察事实进入上下文。但原样回放本身已不再选意大利菜、印度菜和 Denny's，Live 中的错误在离线不复现，所以这两个种子测不出 C8 的作用，要看下次 Live |
| Recorder | 通过 | 通用规则放行的 CSS 也保存，探测中 53/53 |

批准事项（kf-h005 复测、ADR-0040、检索词提前）本批没有执行：Codex 理解为批准语句必须写在指令开头。下一份指令直接写入。

## 要补的一处：完成判定没有声明"结果是否忙"时会被整页忙碌标记拦下

`assess` 的规则是：完成判定没有给出 `resultBusy` 时，只要页面上有任何可见的 loader/skeleton，就保持 PENDING。

- 已给出 `resultBusy` 的：原生发现（`native-restaurant-search` 的列表）、TableCheck 查位。
- **没有给出的**：`tabelog-browser-availability` 的店名搜索、`tablecheck-browser-availability` 的店名搜索、Tabelog 查位。
- 探测显示 Tabelog 列表页始终有 `.list-rst__calendar-loader`（每家店的日历加载圈，挂着一个超过 5 秒的 xhr），TableCheck 搜索页始终有图片 skeleton。跨来源按店名找店（kf-h001 的 Teppen、kf-h005 的 Google 候选）走的正是那两个没给 `resultBusy` 的判定，很可能仍被拦下，只是这次探测没有覆盖这条路径。
- 改法：把 `resultKey` 与 `resultBusy` 设为完成判定的必填字段，由类型检查保证所有判定都显式给出；店名搜索的 `resultBusy` 只看结果列表本身是否在加载。

## 种子

已独立标注并写入 `seeds.v6.json`（132 条）：

- p1-seed-0129、0130（kf-h005 Agent #15、#28）：可接受为 CHECK_AVAILABILITY 或 INVESTIGATE，所选候选不含来源类型与"本地菜、非快餐"明显冲突的 10 家（意大利、印度、马来西亚、希腊、披萨、家庭餐厅连锁）。拉面、咖喱、烤肉、小酒馆等类型不强制也不排除。Live 原动作不通过；C8 两种回放模式都通过。
- 新增 p1-seed-0131、0132：Agent 正向对照（kf-h001 #38、kf-h002 #30 的展示决策，候选集合必须完全一致）。
- 新增匹配规则：`excludeCandidateIds`、`candidateIdsExact`，回放 Runner 需支持后才能给 Agent 种子计分。

## 下一步

1. C3b 补齐：`resultKey`、`resultBusy` 改为必填；补两条店名搜索路径的只读探测（Tabelog `rstLst/?sw=` 店名搜索、TableCheck 店名搜索）。
2. kf-h005 复测（已批准），见证有效到 2026-10-11 06:53 东京。
3. P1-D 实施与 6 次发现探测（ADR-0040 已批准）。
4. 检索词最小改法（已批准），窄 ADR + 隔离分支。
