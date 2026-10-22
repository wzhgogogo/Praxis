# 团体人数与时间窗：离线修复

Evidence status: frozen regression / isolated repair branch，已暴露开发材料；不是 Clean Baseline，也不是新的 Live 验收。

四项修复已完成，五门禁及指定回归通过。分支为 codex/fix-group-window，起点为准备分支当时最新的 17415d1cc1fad5c5da7729de125f4581e0251cb1；复核依据为 b180f30d，原样副本见 [independent-review.md](independent-review.md)。未合入准备分支或主分支。

实现提交：bd268ee0bf45e838f70235be6e34d4ae76b72d17；最初实现与第一轮门禁为 22fef57b。c7d6a72c、f3d7afc5 只修正保存产物读取脚本的序号／信封定位。最终执行冻结与 SHA 见 [delivery-freeze-commit.json](delivery-freeze-commit.json) 和 [delivery-freeze.json](delivery-freeze.json)。最终报告提交见分支 HEAD，不重写已经冻结的提交。

## 1. 实现与红绿证据

| 项目 | 最终行为 | 有效红灯 | 最终绿灯 |
| --- | --- | --- | --- |
| 来源调度 | 删除 supportsGroups 的 +100；未结束的批次排到其他计划来源之后。活动与保留游标分别保存；已到上限的来源也保留预算、入口和分页记录，计划不因此重新开启已结束来源。候选池不删除 | [red.log](red.log) 的排序／队尾断言；[red-ended-checkpoint.log](red-ended-checkpoint.log) | 默认组合测试中的来源轮换、分页、去重、短批交付与游标保留；[最终门禁](gates-delivery/results.json) |
| 受限入口 | 读取计划复用当前 source policy 的明确禁令；遇到禁用工作流，在导航前返回 SOURCE_UNSUPPORTED。FACTS 仍可读 guide／合法菜单，不再重开禁用入口；不改 Guard 的许可 | [red-prohibited-valid.log](red-prohibited-valid.log)；[red-chromium.log](red-chromium.log) | 真实 Chromium 验证查位与连续两次 FACTS 只读 guide；保存产物 24 个“运行×门店”组合提前返回 |
| 时间窗 | 单点 EMPTY 后，仅从新观察中的合法、未查、窗口内时间选项继续；每店最多四个时间观察，并受原有操作和时间预算约束。保留已覆盖点及带开闭端点的未覆盖区间；不把点无位合成为整窗无位。正常部分观察为 UNKNOWN，而非服务商失败 | [red.log](red.log) 的续查正例；[red-chromium.log](red-chromium.log)；[red-partial-observation.log](red-partial-observation.log) | 经 Live Runner 共用 createLiveReadAssembly、来源 Resolver、实际 Guard／Chromium 的正反例；有位、四点 EMPTY、人数变化后旧结果拒绝均通过 |
| 人数不可选 | 请求日期确认后，精确人数可见、未选中且 disabled，立即 UNKNOWN／PARTY_SIZE_NOT_SELECTABLE，换候选；不强选、不改人数。旧日期、非目标人数、已选中、隐藏／视口外及时间控件不误触发 | [red.log](red.log)；[red-chromium.log](red-chromium.log) | 默认正反例及真实 Chromium；c-18 原始第 102 快照的 10 人禁用状态，在零后续决策、零操作下返回 |

初始受限入口 Mock 缺少 INSTALLED 标记的失败不算有效红灯，已另用正确安装标记和旧 Adapter 复现。默认门禁首轮仅持久化测试仍期待旧 state19，已同步为 state20。接入共用组装入口后，反例会使用一次脚本模型求助；把它错误期待为零的测试失败也保留，最终断言区分脚本模型请求与真实模型调用。没有以反转产品断言、跳过测试或放宽资格来通过。

版本：restaurant-state@19 → @20，task definition17 →18；无生产数据迁移或兼容读取分支。Browser Prompt19／动作11／Context2、Restaurant Agent Prompt27／Context15、事实 Prompt14／Schema4、Evaluator33／rubric29 均未改。ADR-0037 只追加已批准的来源调度修正说明，原文保留。产品、领域、能力矩阵、编排文档、STATUS 与历史导航已同步。

## 2. 六次保存产物回放

下表是“当前生产 Planner＋原来源批次边界”和“原 HTML／精确对应控件＋当前 Adapter／Executor”的组件回放。真实组合接线另由上述本地 Chromium 与默认组合测试证明。原运行、决策、录制及见证字节不改。

| Run / original result | Original search batches | New saved-boundary projection | Unsupported | Window component | Party component |
| --- | --- | --- | --- | --- | --- |
| [h-03](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-03-attempt-1/runner/2026-10-22T08-42-01-645Z-8a1e9abe-a8ba-4eed-9d7d-4e9388d374c0.result.json) | TABLECHECK -> TABLECHECK | tabelog#1 (recording gap) | 5 | UNKNOWN; EMPTY@19:00; rest unknown | NOT_REACHED |
| [h-09](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-09-attempt-1/runner/2026-10-22T09-43-42-240Z-1fe7a835-0915-4fc1-9603-87143341155d.result.json) | TABLECHECK -> TABLECHECK | tabelog#1 (recording gap) | 5 | UNKNOWN; EMPTY@19:00; rest unknown | NOT_REACHED |
| [h-15](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-15-attempt-1/runner/2026-10-22T10-42-02-863Z-88cea1d7-adf7-49ac-ba2d-480dd1f199fc.result.json) | TABLECHECK -> TABLECHECK | tabelog#1 (recording gap) | 5 | UNKNOWN; EMPTY@20:00; rest unknown | NOT_REACHED |
| [c-04](../checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/live-results/c-04-attempt-1/runner/2026-10-21T13-22-13-597Z-fe19189c-0a9c-4609-9ed5-18c8026a36bf.result.json) | TABLECHECK -> TABLECHECK | tabelog#1 (recording gap) | 2 | UNKNOWN; EMPTY@19:00; rest unknown | NOT_REACHED |
| [c-08](../checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/live-results/c-08-attempt-1/runner/2026-10-21T14-08-00-597Z-3bea8ed5-8aa6-4539-9207-9cc9ba56fd4f.result.json) | TABLECHECK | tabelog#1 (recording gap) | 2 | NOT_REACHED | NOT_REACHED |
| [c-18](../checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-18-attempt-1/runner/2026-10-21T16-23-52-862Z-cb6b94a5-2e3c-4053-aa07-6973db7433e7.result.json) | TABLECHECK -> TABLECHECK -> TABELOG | tabelog#1 -> tablecheck#1 -> google-places#1 (recording gap) | 5 | UNKNOWN; EMPTY@19:00; rest unknown | UNKNOWN; 0 decisions/actions |

全部六例的新计划都先安排 Tabelog：c-18 从原第三个 SEARCH 批次提前到第一批；其余五例原运行根本未进入 Tabelog。这里的“提前”只表示调度尝试提前。五例没有保存的 Tabelog 响应、c-18 没有保存的 Google 发现响应，都明确记为 BLOCKED_BY_RECORDING_GAP，不补空列表、不借用见证库存生成候选，不声称实际加载或见证入选率提高。

24 个原先遇到禁用工作流的“运行×门店”组合，均由当前 Adapter 在准备禁用导航之前返回 SOURCE_UNSUPPORTED。五例的已绑定单点 EMPTY 保留为部分覆盖；未来菜单／结果未录到的部分保持 UNKNOWN。c-08 因原读取未走到人数／库存确认，时间窗组件记 NOT_REACHED，不能从其他运行补证。

c-18 的人数回放绑定原第 102 快照、全局 trace1549 与对应 152 个控件，已选日期相同；精确 10 人 disabled 后没有新模型决策或点击。它不证明可以省去原来为显示 10 人而发生的五次 Next。原 members=2 的响应仍不能证明 10 人库存。

结构化逐例记录、原始路径与快照／控件 SHA 见 [saved-replay-delivery-results.json](saved-replay-delivery-results.json)；驱动为 [run-saved-replay.mjs](run-saved-replay.mjs)。来源调度的固定期望来自本次批准的顺序与复核，不从“当前实现返回通过”反推。回放没有重做 Agent 选店，也不评价新交付率或节省秒数。

保存产物读取脚本的两次失败分别保存在 [saved-replay.log](saved-replay.log) 和 [saved-replay-corrected.log](saved-replay-corrected.log)。前者混用了 recorder 与全局 trace 序号，后者取错 result 中的 trace 信封路径；均在本地断言停止、没有外部调用。修正后先按所有六次的 runtime HTML SHA 校验序号对应，再重新提交冻结；原始输入和生产规则不随之改变。

## 3. 指定回归与五门禁

| 检查 | 结果 | 证据与模式 |
| --- | --- | --- |
| typecheck / arch:check / npm test / build / test:browser:fixture | PASS; 1014/1014 default, 136/136 Chromium | [All five rerun on final implementation](gates-delivery/results.json); complete per-command logs retained |
| 69 个翻月点 | 69/69 | [缓存响应回归](delivery-regressions/regression-results.json)；当前观察／消息／Schema／oracle 相同，仅已批准基线的传输时限由旧记录10秒变30秒。重用保存的真实响应，非新模型采样 |
| 选店五种子 | 5/5 | 同一回归文件；当前 Reducer／Context 重建后的请求逐字相同，缓存响应经当前解码及独立标注规则计分 |
| 校准 | 结果类型22/22，正常样本 S0声明20/20 | [校准比较](delivery-regressions/calibration/comparison.json)；先保存22个独立自动评价与 SHA，后读取标签比较。两份中断样本继续保留未评价，不转成无错误 |

所有原始失败日志与最终绿灯均保留。Chromium 套件会改写已有的 region-composition-results.json；本工作树中已分别保存生成物与原始副本，并恢复历史文件字节，核对见 [side-effect-verification.json](gates-delivery/side-effect-verification.json)。没有改写旧录制、Gold、变体或见证。

## 4. 证明范围与退出

- 端到端结果：NOT_EVALUATED。本批没有新的完整真实任务、库存观察或 QUALIFIED_DELIVERY，不能由组件绿灯推导阶段签收。
- 逐环节：L0 为保存批次／页面／控件及缓存决策回归；L1 为生产组装与真实本地 Chromium 的受控读取。未保存的来源及新 Agent 选择仍未评；L3 新真实模型回放、Live、外写均未运行。
- 严重程度：本地测试验证具体拒绝和同请求库存绑定，不给新的现实 S0–S4 结论。历史 C／留出集失败与其 S0 不被本次离线结果覆盖。
- 归因：已证实这些离线机制可纠正相应错误路径；对六次整单无交付的实际贡献仍为 HYPOTHESIS。没有事实依据给出实时成功率或耗时改善。

本批新增真实模型、来源网站请求、Google 请求、完整 Live、预约／支付／个人信息操作均为0。源材料和执行文件的最后完整性核对见 [integrity-verification.json](integrity-verification.json)。完成推送本修复分支后停止，等待独立复核；不跑 Live。
