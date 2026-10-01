# H001 A/B/C 审查后修复与固定来源模型验收（2026-10-01）

- 状态：完成；本记录是当前工作树的审查证据，不是 H001 Live 结果。
- 范围：H001 原生发现、共享浏览器执行和来源可用性读取。未修改 Semantic、Gold、地点语义、人数／时间解释、事实与身份接受规则，也没有访问真实 Tabelog／TableCheck、运行 H001 Live 或写入预约。
- 基线：`0d155e6`；无关的 `Praxis_Product_Blueprint.key` 与 `Praxis_Product_Blueprint.pptx` 保持未跟踪且未纳入本轮。

## A — 发现与推进

- 观察到的详情入口现在随来源进度保存为 `pendingSourceEntries`（来源 ID、URL、观察时间及来源元数据）。列表刷新、局部失败和下一详情块不会清空已检查 ID、页数、耗时或待处理入口；来源级失败不会把同一来源重新打开为零进度。
- Tabelog 的已观察区域链接若遗漏查询词，会保留原始区域路由并补回 `sw`；来源列表本身的真实顺序保持不变。未引入独立排序算法，也未把不可验证的地点展示文本提升为排序依据。
- 当原生列表尚无可解析门店、也未明确为空时，正式 `NativeRestaurantSearch` 经同一个共享 Browser Executor 以 `DISCOVERY` 阶段把观察到的非提交操作交给模型；该操作仍受同一会话、引用、调用和浏览器预算约束。

## B — 执行推进

- TableCheck 只在当前高身份来源页已观察到相同 source ID 的 `/shops/<id>/reserve` 入口时保留该入口；缺 JSON-LD 关系本身不再丢失已观察的同源关系。其它店的入口仍拒绝。
- Tabelog 的受限日历只有目标日期明确为 `CLOSED`、`FULL` 或 `PHONE_ONLY` 时才立即返回受限；未观察到的状态继续走既有受控执行链，不能把隐藏／加载中控件变成无位。
- 被拒绝的 `COMPLETE` 会在同一预算内等待变化、重新快照并重新观察全部控件，再决定是否完成；重复同一观察仍按既有无进展规则停止。

## C — 结果与证据

- TableCheck 在同店、同日期、同人数的实时 DOM 预约链接可直接形成一条 request-bound Offer；错误日期链接仍为 `UNKNOWN`，不会跨请求或跨店合并。
- 浏览器切片证据保留脱敏查询区域、控件、允许的被动响应和错误归因；来源读取未完成时不把部分页面内容送入最终结果解析。
- 新增或修改的路径仍只把确有请求绑定证据的库存读数称作 `AVAILABLE`／`UNAVAILABLE`；缺日期、人数、时段或同店绑定保持 `UNKNOWN`。

## 离线与本地 Chromium 验证

- 组合相关：`native-discovery-composition.test.ts` **16/16**。
- TableCheck 可用性、原生组合和 Browser Executor 组合：**91/91**。
- 浏览器切片证据：**3/3**。
- 完整默认测试：宿主环境 **575/575**；受限 sandbox 的 22 个失败均为 `127.0.0.1` 无监听权限，非产品断言失败。
- `npm run typecheck`、`npm run arch:check`、`npm run build`、`git diff --check` 通过；本地 Chromium fixture 在宿主环境通过。

## 固定来源真实模型整链

三个运行均使用 DeepSeek 真实模型、固定 Google 响应和固定来源页面；`DYNAMIC_TABELOG_DELIVERS` 的浏览器是本地 Chromium 拦截页。三者均无真实餐厅网页访问、无预约写。

| 场景 | 终态 | 模型调用／耗时 | 独立评估 |
| --- | --- | --- | --- |
| `TABLECHECK_DISCOVERY_RECOVERS` | `PRESENT_RESULTS`，展示 1 条 TableCheck Offer | 8／9,120ms | qualified `YES` |
| `DYNAMIC_TABELOG_DELIVERS` | `PRESENT_RESULTS`，模型实际选择日期与 2 人后展示 1 条 Tabelog Offer | 9／10,779ms | qualified `YES` |
| `BOTH_BOUNDED_EMPTY` | `NO_VERIFIED_RESULT` | 4／5,035ms | qualified `NO`，正常有界无结果 |

证据：

- [TableCheck 发现交互运行](../../.eval-artifacts/h001-native-fixed-source-model/2026-10-01T08-50-41-862Z-d077f89f-f634-450e-99c0-6868676e1052.result.json) 与 [独立评估](../../.eval-artifacts/h001-native-fixed-source-model/2026-10-01T08-50-41-862Z-d077f89f-f634-450e-99c0-6868676e1052.result.evaluation.22-1790844650989.json)
- [动态 Tabelog 运行](../../.eval-artifacts/h001-native-fixed-source-model/2026-10-01T08-51-06-999Z-32b97290-e26c-43e9-b515-99a87bd13b66.result.json) 与 [独立评估](../../.eval-artifacts/h001-native-fixed-source-model/2026-10-01T08-51-06-999Z-32b97290-e26c-43e9-b515-99a87bd13b66.result.evaluation.22-1790844677785.json)
- [两站有界空结果运行](../../.eval-artifacts/h001-native-fixed-source-model/2026-10-01T08-51-32-735Z-a947a732-40fa-45c6-a53a-70d069fcfea8.result.json) 与 [独立评估](../../.eval-artifacts/h001-native-fixed-source-model/2026-10-01T08-51-32-735Z-a947a732-40fa-45c6-a53a-70d069fcfea8.result.evaluation.22-1790844697773.json)

这些结果只验证固定来源下的模型、Runtime、Adapter、证据接纳和展示／收尾链。它们不代表当前真实库存，也不构成 H001 Live 成功。
