# F5 找店超时分析与修复方案

- Evidence status: exposed development diagnostic；draft / not integrated；不是 Clean Baseline。
- 分析日期：2026-10-24，维也纳时间 CEST（UTC+2）。
- 工作分支：`codex/chore-phase3a-prime-f5-analysis`；从已批准停止点 0 的 `main / 2ada8a69a3071740423745e581c3b6ae30d9a1bd` 创建。
- 依据：[已批准指令批次 1 对话 B](../CODEX-3A-PRIME.md)、[停止点 0 批准补充](../main-check/report.md#7-停止点-0-复核补充2026-10-24-0020-北京)。
- 历史执行证据固定于 `3ec38584555b5271b72b79f954179769e92ff9f6`，不依赖其他工作区的未提交内容。

**当前审阅入口是第 10 节“停止点 1c 修订与 ADR 批准”。** 当前只做 A 的设计，LOCATION／车站改动未采纳；用户已批准修订后的 ADR-0043，本批仍不实现。第 9.2–9.6 节已依 1c 复核更新，原 1b 版本固定于 `29f6328f:本文件`，旧预算和验证记录保留为 superseded retrospective。第 1–8 节保留停止点 1 分析，其中优先评审 B、例 03 降时建议已收回。原始链接中的时间标题属于历史锚点；本文显示时间统一为维也纳时间，原始文件名、CSV 和 Git blob 内的 UTC 时间不改写。

两个例子有不同的首个卡点。例 01 的 Tabelog 地区选择未完成，详情读取为零；转入 Google 候选后，逐店跨来源解析继续消耗时限。例 03 的完整运行实际使用备用地点 Kudanshita，区域内五家全部在半径内；主要浪费发生在检索失败后读通用列表、查位，再花约 150 秒追查仍无 fugu 支持的五家店。

因此，“Tabelog 只有两家、在同一错误区域反复换菜系词，所以首五家规则未触发”不能作为这两次例 01 诊断的事实前提。两家结果与 `kushikatsu → 串カツ → 串揚げ` 改写属于 TableCheck。只放宽首五家的数量条件，触及不到例 01 的实际失败位置，也不能解释例 03。

## 1 范围、证据入口与计时口径

本批只做历史材料分析和方案，不改产品、Runner、测试、Prompt、Schema、Gold、变体、Guard 或网站适配器。新增的 `analyze.py` 只读固定 Git blob，生成本目录的计算摘要，不执行产品链路或调用 Provider。

为避免把不完整运行混进分母，使用以下短名。原始路径、原始字节 SHA 和读取版本逐项列在 [inputs-sha256.json](inputs-sha256.json)；本目录不复制历史原文。原始文件也可用 `git show 3ec38584:<path>` 读取。

| 短名 | 原始路径，相对仓库根 | 记录状态 |
| --- | --- | --- |
| D1 | `.eval-artifacts/phase2c-holdout/diagnostic-after-guard-fix-20261023/attempt-1/runner/2026-10-23T11-04-59-001Z-dbe4cbbb-c269-4d81-a8d9-ea62ad54164f.result.json` 及同名 `.decisions.jsonl` | 500111 ms，37 次模型，SEARCHING，零展示，RUN_DEADLINE_EXCEEDED |
| D2 | 同一诊断目录下 `attempt-2/runner/2026-10-23T11-21-38-118Z-2aea6483-3129-4c05-be53-019d50157e09.result.json` 及同名 `.decisions.jsonl` | 500075 ms，40 次模型，SEARCHING，零展示，RUN_DEADLINE_EXCEEDED |
| C03-1 | `.eval-artifacts/phase2c-holdout/exit-live-20261023/execution/A/h-03-attempt-1/` | 外层 SIGKILL；只有 29 行决策，无 result 和完整 trace |
| C03-2 | 同一 `execution/A/h-03-attempt-2/runner/2026-10-23T05-55-19-111Z-50ff3f8d-ecf7-4716-b5b6-808a7c232903.result.json` 及同名 `.decisions.jsonl` | 457907 ms，47 次模型，正常 END_READ，未交付 |
| C09 | 同一 `execution/A/h-09-attempt-1/runner/2026-10-23T06-40-08-617Z-1849354e-a865-4407-b25f-e90bcf8a9b21.result.json` 及同名 `.decisions.jsonl` | 457674 ms，47 次模型，正常 END_READ，未交付 |
| C15 | `exit-live-20261023/remaining-five-continuation-20261023/all-execution-manifest.json` 的 h-15 | 例 03 第三次为 NOT_REACHED，没有运行 |

**输入差异必须保留。** C03-1/C03-2/C09 的实际语义和决策写的是 **near Kudanshita**，不是原候选地点 Ichigaya。指令中例 03 写 Ichigaya、备用 Kudanshita。历史分析依据已执行的 Kudanshita；停止点 1 当时待明确的下一批地点，现由第 9.7 节冻结为 Kudanshita，不沿用耗时改善承诺。[case03-attempts.json](case03-attempts.json) 保留补跑、中断、未到达的原始分类。

可复算明细：

- [time-breakdown.csv](time-breakdown.csv)：每次业务动作的执行耗时、调用数和决策行号。
- [source-reads.csv](source-reads.csv)：75 个来源作用域，逐店、来源、trace 起止及模型行号；包括一个无结束记录的作用域。
- [page-intervals.csv](page-intervals.csv)：每次 NAVIGATE / OPEN_LINK 到下一页面操作或来源结束的区间，包括搜索、店名结果、详情和查位页。
- [operations.csv](operations.csv)：1020 个可配对的完成或失败浏览器操作区间，单列导航、页面读取、等待和控件操作。D2 另有一个未结束操作及一个无对应开始的失败事件（trace 155），在 runs 中单列，不补时长。
- [decisions.csv](decisions.csv)：四个完整结果的 171 行决策及中断运行的 29 行，逐用途和时刻。
- [runs.json](runs.json)：原始运行总数、资源和历史 `stageTimings`；[retrieval.json](retrieval.json) 保留来源漏斗与检索历史。

时间表中的秒数是 wall time。业务动作、来源、逐页和操作是嵌套口径，不能相加；模型调用数按调用开始时刻落入区间统计，包括事实判断和检索规划，区别于 Executor 只计 browser 的 lifecycle 计数。逐页区间包括在该页做下一步决定的时间；纯导航时间另见 operations。检索历史的 `elapsedMs` 是来源累计时刻，不能误读为每个词的独立耗时。Google 的后续 SEARCH 元数据为 0 ms 是复用早期读取，不表示此前未调用 Google。

## 2 问题一 各次运行的时间线

### 例 01 两次诊断

| 环节 | D1 秒 / 模型次数 | D2 秒 / 模型次数 | 原始依据 |
| --- | ---: | ---: | --- |
| Tabelog 地区发现 | 82.844 / 10 | 92.278 / 7 | 两份 result 的 trajectory 1；D1 决策 3–12，D2 决策 3–9 |
| TableCheck 搜索与两家详情 | 45.947 / 2 | 29.018 / 2 | trajectory 2；D1 14–15，D2 11–12 |
| 两家 TableCheck 查位 | 39.971 / 0 | 14.595 / 0 | trajectory 3；D1 trace 365–463，D2 281–379 |
| 两家 TableCheck 事实 | 60.034 / 6 | 52.177 / 5 | trajectory 4；D1 18–23，D2 15–19 |
| 取出早期 Google 候选 | 0 / 0（复用） | 0 / 0（复用） | trajectory 5；早期 Google 原始响应归在首次发现 |
| Google 候选解析与后续尝试 | 已结束来源作用域合计 231.131 / 11，另有无结束记录的 Nonki | 已结束作用域合计 270.762 / 17 | 下表及 source-reads；D1 含最后一段未形成完整 trajectory 的读取，D2 含最后一批的首家 |

D1 语义 1 次、业务 Agent 7 次、检索 3 次、browser 22 次、事实判断 4 次，总计 37。D2 对应为 1 / 8 / 3 / 25 / 3，总计 40。语义和业务 Agent 不包含在上表执行调用数内，不能把它们再次加到 source-reads 的嵌套时间上。D1 最后一个 Nonki 作用域仅 trace 1094 开始；缺结束记录时不补造耗时。

TableCheck 每个检索页的实际区间如下，初始共享词规划已记在首次发现中：

| 查询页 | D1 秒 / 模型次数 / trace | D2 秒 / 模型次数 / trace |
| --- | --- | --- |
| kushikatsu | 8.301 / 1 / 237–267 | 9.459 / 1 / 163–193 |
| 串カツ | 9.196 / 1 / 267–298 | 8.553 / 1 / 193–224 |
| 串揚げ | 10.011 / 0 / 298–339 | 4.961 / 0 / 224–255 |
| Kawaei 详情 | 8.711 / 0 / 339–350 | 2.952 / 0 / 255–266 |
| UNDERGROUND 详情 | 9.616 / 0 / 350–362 | 2.949 / 0 / 266–278 |

每个 Google 候选的来源链如下。这里的次数是全部模型调用；D1 全部停在解析阶段，没有进入 AVAILABILITY 操作。D2 只有新時代本店进入过约 12.871 秒的 AVAILABILITY 操作，不能因此认定产生了合格空位。

| 候选 | D1 TableCheck → Tabelog 秒 / 模型次数 | D2 TableCheck → Tabelog 秒 / 模型次数 |
| --- | --- | --- |
| Kushiman Akabane | 45.001 / 0 → 14.994 / 2；trace 615–739 | 20.766 / 0 → 39.235 / 4；505–705 |
| やきとん大王 赤羽店 | 40.000 / 0 → 20.004 / 0；743–818 | 未选中 |
| Dengana Akabane | 15.028 / 0 → 44.979 / 5；822–972 | 4.156 / 0 → 20.004 / 0；709–753 |
| 新時代 赤羽本店 | 未选中 | 4.885 / 0 → 23.537 / 4；756–911 |
| Shinjidai | 未选中 | 9.153 / 0 → 29.336 / 0；915–1008 |
| Tori Mero 赤羽 | 未选中 | 5.588 / 0 → 45.003 / 2；1012–1139 |
| Kaburaya Akabane 1 | 未选中 | 4.882 / 0 → 45.003 / 5；1142–1285 |
| Kaburaya Akabane 2 Goten | 15.407 / 0 → 35.718 / 4；977–1090 | 未到达 |
| 赤羽居酒屋 大衆酒場 れもん | 未选中 | 4.714 / 0 → 14.500 / 2；1290–1375 |

因此“逐家在 Tabelog 查找、再查位”仍不够精确：D1 先花 **115.436 秒**在 TableCheck 名称解析，再花 **115.695 秒**在 Tabelog 解析，实际查位未到达。D2 对应为 **54.144 秒**与 **216.618 秒**，后者约 **203.747 秒**发生在第一项 AVAILABILITY 操作之前。[source-reads.csv](source-reads.csv) 的逐店起止可直接复核。

### 例 03 的所有已保存尝试

C03-1 于 2026-10-23 07:34:31.982 CEST 起保存决策，最后一行开始于 07:39:00.127 CEST；外层 finish 为 `SIGKILL / PARALLEL_FALLBACK_ENV_FAILURE`，结束在 07:39:51.223 CEST。它的 29 次调用和约 268 秒的决策开始时刻跨度可确认；缺完整 trace/result，无法还原每个来源的实际执行耗时。不得用相邻决策间隔填成正常耗时，亦不将该次判为找店能力失败。原始 finish 和安全评价均保留。[case03-attempts.json](case03-attempts.json)、decisions 中 `case03-h03-interrupted` 行。

| 环节 | C03-2 秒 / 模型次数 | C09 秒 / 模型次数 | 原始依据 |
| --- | ---: | ---: | --- |
| Tabelog 首批发现 | 77.078 / 6 | 77.219 / 6 | trajectory 1，决策 3–8；两次 trace 2–172 |
| 五家 Tabelog 查位 | 39.455 + 44.936 = 84.391 / 6 | 37.596 + 54.280 = 91.876 / 6 | C03-2 trajectory 2、4；C09 2、3 |
| 五家 Tabelog 事实 | 90.039 + 60.030 = 150.069 / 19 | 90.048 + 57.815 = 147.863 / 19 | C03-2 trajectory 3、5，决策 14–24、30–37；C09 4、5，18–29、31–37 |
| TableCheck 首批发现 | 27.390 / 0 | 20.131 / 0 | trajectory 6；C03-2 trace 1020–1110，C09 1005–1095 |
| 五家 TableCheck 查位 | 17.781 + 9.668 = 27.449 / 0 | 18.371 + 10.115 = 28.486 / 0 | trajectory 7、8；source-reads 逐店列出 |
| 三家 TableCheck 事实 | 31.199 / 5 | 30.221 / 5 | trajectory 9，决策 42–46 |
| 正常结束 | 第 47 行 END_READ | 第 47 行 END_READ | 均没有合格交付；C15 第三次未到达 |

两次完整结果的用途调用数均为语义 1、Agent 10、检索 4、browser 23、事实判断 9，总计 47。

C03-2 的 Tabelog 词序列为 `fugu → fugu cuisine → 再次 fugu 被拒 → 通用列表`，并非找到五家 fugu 店。三个结果页区间分别为 5.744 / 4.760 / 5.090 秒（各含 1 / 1 / 0 次模型，trace 80–92 / 92–104 / 104–116）；C09 相应明细见 page-intervals。初始两次词查询均显式空，重复词触发 `REPEATED_RETRIEVAL_EXPRESSION` 后代码改用通用列表。此后五家被读的类型是烤肉、寿司、居酒屋/海鲜和刀削面，五家范围全部合格，却没有 fugu HARD 支持。时间大头是后续约 150 秒的事实追查，不是错误区域纠正。

本批未改变原始四层评价。C03 无已认证可行见证，不能据此认定 S2；中断的 C03-1 不能确认 S0=0；D1/D2 原始全面评价仍待独立复核。以上只定位环节和耗时，归因强度为记录与代码支持的机制，未进行干预式因果实验。

## 3 问题二 为什么换入口规则没有触发

[native-restaurant-search.ts](../../../src/integrations/restaurant-search/native-restaurant-search.ts) 第 25–27 行明确要求：存在 `directoryRegion`、未 replacement、`firstFive.length === 5`、至少四家 OUTSIDE_RADIUS。这与 Accepted ADR-0040 的“未读满五个时不推断 4/5”一致。

但 D1/D2 更早就失败了：

1. 地区完成谓词在第 764–767 行要求 `same && namedEntrance && (parsed list 非空或明确空)`。`namedEntrance` 当前依赖地区标签包含请求名称、权威 LOCATION 控件确认，或已观察同源店铺指针支持该入口。A1322/A132201 的标签不含 Akabane，当前 Google 候选也没有可用的 Tabelog 官网指针。
2. `directoryRegion = { first, firstFive: [] }` 直到第 777 行、地区流程 COMPLETED 后才建立；详情坐标记录发生在第 895–920 行。
3. D1 的 trajectory 1 是 `READ_BUDGET_EXCEEDED`，`regionPages=5 / retrievalPages=0 / inspectedOutlets=0`；D2 是 `BROWSER_TIMEOUT`，`regionPages=4 / retrievalPages=0 / inspectedOutlets=0`。两者漏斗均无 directoryRegion，未进入详情取样。
4. D1 决策 5、7 选 A1322 和 A132201，第 9 行 COMPLETE 未使代码完成，随后 10–12 又回全国/东京入口。D2 第 9 行已改选 Sugamo，但开始于运行后 89.608 秒，来源九十秒将尽，未完成。原 trace 分别 2–230、2–153。

**对复核者猜测的判定：否定其作为本次诊断根因。** `<5` 确实使旧规则不能处理未来的稀疏详情批次，但这两次实际为 **0 个详情且没有已完成地区对象**。单改 `length === 5` 没有可供判断的坐标。C03-2/C09 则已保存五家 493–866 米的详情，全部 WITHIN_RADIUS，按现有合同不应换入口。

已有 [directory-region-selection.test.ts](../../../src/integrations/restaurant-search/directory-region-selection.test.ts) 第 36、42、45、57 行分别覆盖五家越界、未知不算越界和继续进入具名子地区；第 185 行起的来源指针覆盖依赖 Google websiteUri 已是该来源店铺 URL。它们没有提供这次“菜单无请求名称、来源指针缺失、地区尚未完成”的正常成功控制。实际组合测试的脚本 Agent 也优先选标签直接等于 areaQuery 的入口（`native-discovery-composition.test.ts:94–96`）。本批不新增测试，保留为实现前必须取得的离线红灯。

## 4 问题三与四 区域距离和坐标从哪里取得

**错误区域循环时，代码知道权威圆心，不知道该区域餐厅离圆心多远。** D1/D2 Browser 决策上下文给出了 Akabane 的 Google 坐标、1000 米半径和 Kita City 等地址组成部分；地区选择 observation 没有区域距离字段，source funnel 也没有 firstFive。共享检索 Planner 的 observation 只含 URL、title、text、parsedCount、empty 和 categories，不含餐厅坐标/距离（`discovery-retrieval-planner.ts:12–17,73–79`）。TableCheck 的改写已使用正确坐标，不能拿其两家店的距离来判定 Tabelog 的 A1322。

候选距离在取得详情后才计算：同页 JSON-LD 中 `name` 与当前门店名相符的 `geo.latitude / longitude`，经数值范围校验，再算相对权威圆心的精确距离（`native-restaurant-search.ts:155–179,895–906`）。它不从行政区名、URL 代码或模型描述推断坐标。

| 已保存页面 | 可用位置材料 | 额外访问成本和限制 |
| --- | --- | --- |
| C03-2 snapshot 0008 通用列表 | JSON-LD 为 BreadcrumbList、ItemList；该保存页没有 geo 或地图坐标 | 已有列表自身不能提供精确候选坐标；每个采样候选仍需一个详情页 |
| C03-2 snapshot 0009–0013 五个详情 | 同店 Restaurant JSON-LD 有完整 geo；五条与原 firstFive 数值一致 | 不需打开地图或调用 Google；已经读过的详情零额外访问，未读候选一页一个 |
| 同五个详情的地图图片 URL | staticmap 的 center/markers 在已保存版本中被脱敏 | 只记录链接 origin/path/字段名，不复制 key、signature 或其他 query 值；不能恢复坐标，也不必请求图片 |
| D1 snapshot 0005、0007 地区页 | 已保存 HTML 只有约 2 KB 的 head，无 body、JSON-LD geo 或地图链接 | 这是页面/录制证据缺口；不能据此断言真实地区列表天生没有坐标。不能用它重建完整错误区域页面或测新路径收益 |

证据逐页列于 [location-evidence.json](location-evidence.json)。两条错误区域页面的完整 DOM 仍需要 F2 的页级录制或后续批准的最小来源确认；本批不访问网站补齐。若采用“稀疏列表取两家详情核对”，至多需要两个原预算内的详情访问；不能把它写成列表页免费已有全部坐标，也不能增加每来源十详情、九十秒或整单预算。

## 5 问题五 店名查找慢在哪里，与 3b 的关系

Google 候选若没有 Tabelog/TableCheck 直达 URL，两包都给 NEUTRAL 绑定。Resolver 按包 priority 排序后逐个候选顺序尝试，TableCheck priority 高于 Tabelog；只有得到可用结论才停止该候选的来源链（`availability-source-resolver.ts:19–35,83–126`，`source-packs.ts:244–252,296,394`）。因此一个 Tabelog 目标常先付一遍 TableCheck 搜索和多店身份比较的成本。

Tabelog 查询把 Google 店名原样放入 `sw`。无结果后先调用浏览器技能尝试 category/filter removal，再尝试从已观察官网找本地别名，最后逐个详情核对 HIGH 身份（`source-packs.ts:254–257`；`tabelog-browser-availability.ts:396–440`）。这种顺序会在别名路径前耗尽预算。D2 的 Kushiman 搜索零结果后第 22–25 行移除关键词，实际进入新桥的两家详情；泛称 Shinjidai 的三个详情也都在其他地区。身份规则没有被放宽，但没有迅速获得本店入口。

Dengana 两次均未成功进入实际查位：D1 在 TableCheck 15.028 秒后，Tabelog 再用 44.979 秒和 5 个模型；D2 为 4.156 + 20.004 秒且无 browser 模型。这两次不能概括成“已找到见证店，只是日历慢”。D2 新時代本店是不同情况：已由 exact phone 达到 HIGH，随后页面缺日历控件，决策 26–29 WAIT/CLICK/WAIT/REQUEST_HUMAN_HELP；不能把它的约 12.871 秒继续算作名称解析。

与 3b“店名解析改进”重叠在同一条 Resolver/Adapter 路径：来源顺序、别名的使用时机、空查询后泛化和详情身份比较。F5 应先改善原生发现，使候选带已有同源入口，减少触发这条慢路径的数量；**本批两个方案都不同时改名称解析和 Provider 排序**。否则同一轮同时改发现与解析，收益无法归因，且会越过网站适配器不得增加的边界。名称解析的具体重构交 3b。

## 6 问题六 TableCheck OPTIONS 分类，交 F3

[options-classification.json](options-classification.json) 在固定原始 trace 上复现 D1 **41**、D2 **95** 个 `BLOCKED_METHOD` 诊断出现次数。D1 是 other 40、xhr 1；D2 是 other 95。它们全部指向 `https://production.tablecheck.com/v2/hub/availability_calendar_v2`、OPTIONS、queryKeys 为空。第一处分别为 D1 trace 347、D2 trace 263 的 networkDiagnostics。快照反复携带诊断，**136 不是独立请求数**；同一批 networkRequests 又重复记录，不能再加一遍。

代码层分类明确：

- [tablecheck-public-query.ts](../../../src/integrations/tablecheck/tablecheck-public-query.ts) 第 68–74 行已有该精确端点的 POST/fetch 读取规则，body 限 locale/start_at/shop_id/num_people 四个字符串，**并非任意 POST 均可放行**。
- [playwright-read-network-guard.ts](../../../src/infrastructure/browser/playwright-read-network-guard.ts) 第 271–283 行的预检只接受 requestedMethod=GET，并要求对应 GET 规则声明 corsPreflight。该日历规则没有 corsPreflight，只有 POST；因此目前这类跨源日历预检没有可通过的规则。
- 这些被拦记录没有 access-control-request-method/headerNames、POST body 或与后续请求的配对事实。静态代码说明存在“已审核 POST 与 GET-only 预检不相容”的机制，但不能由此把每一条 OPTIONS 都认证成误拦，也不能认证其尚未派发的实际 POST 一定满足四字段规则。

结论是 **F3 的待核实传输缺口**。F3 可用真实本地 Chromium 构造四字符串合法 POST 的预检和独立接收端，并配非法方法/字段/headers、reserve 路径反例；还需冻结实际预检字段观察。F5 不修改规则，不把被阻请求计为已派发越界，不从放行或阻止推导库存。

## 7 最多两个修复方案

以下为停止点 1 的历史候选方案，尚未实施。停止点 1b 已选择 A、拒绝 B；A 的当前设计和 ADR 草稿以第 9 节为准，原 ADR-0040/0042 正文均不修改。

### 方案 A 先到达可取样的列表，再用详情坐标核对模糊入口

- **层与动作：** 仅改共享 `native-restaurant-search.ts` 的地区完成/详情交接。地区标签不含请求名且没有同源店铺指针时，模型选择该地区实际观察到的公开列表链接；代码把它记为临时调查入口，允许在原详情额度内取得坐标。不能因为标签不一致直接阻止所有详情，不能从模型 COMPLETE 建立成功。
- **代码核对：** 两个有效详情均明确越界时可提出一次替代入口；不足两个、缺坐标或样本混合保持未知。原五家 4/5 和只换一次的总约束保留。只改变发现路线，不接纳越界候选，不以取样推断地区穷尽。上述新阈值是待批准合同，不是从两次诊断推出来的既成规则。
- **离线验收：** 用 D1 第 5–10 行观察入口及 C03 已保存 JSON-LD 构造真实 composition：旧完成谓词不能进入采样为红灯；新路径走 observed list→详情→距离反馈→一次新入口为绿灯。错误区域完整 HTML 未保存，需明确标本地 fixture，不能称该次网站 Replay。加入真实 Chromium 操作，以及缺坐标/一内一外/无第二入口/预算已耗尽控制。
- **预期节省：** D1 在选入 A132201 后余约 47.2 秒、D2 约 34.4 秒花在回入口和超时上，是最多可回收的历史尾段；应扣除两详情与新入口成本，尚不能给出正的净收益保证。它**不会缩短 C03 已在半径内的约 150 秒事实读取**，也不直接解决 Google 名称解析。
- **已通过用例：** 具名地区或既有同源指针已核验、首批在范围内的路径不进入临时采样分支，复用现有详情，不增加页面访问或换入口。H001 涩谷、神乐坂、吉祥寺、H005 东银座必须各有同入口/访问数不增加的对照，不用模型精确复现原选择来证明。
- **Live：** 沿批准计划 01 三次 + 03 三次，最多两个环境重跑。方案 A 单独不能承诺例 03 的改善，需要复核接受其覆盖有限后才选择。

### 方案 B 模糊地区使用权威地名约束检索，保留 HARD 检索意图

- **层与动作：** 改共享检索组装、Domain 检索契约和地区交接；复用 Pack 已有 `withRetrievalExpression`/`sw` grammar，不增加站点文件或站点包代码。只在入口标签无法绑定地点时启用，从当前已观察公共列表根检索，模型仍只选择正向 HARD 词或已观察类别；代码单独拼入同次 Google 已解析的权威地名。模型不能提供自由地名或 URL，不能把整条用户原话塞入查询。
- **代码核对：** 地名和 HARD 词独立归属，原半径不变。空结果/重复词不再由代码静默改用通用列表并立即读取五家详情；模型可以在原两次改写内选不同合法词、类别或显式一般列表，代码保存这个选择和缺口。非法输出不加模型重试，交回下一次既有合法决策。当前实现本来也没有把通用候选认证成满足 HARD；选择一般列表仍保留这一证据门槛。ADR-0042 目前明确禁止地名进入关键词，所以应新增 ADR 区分受代码绑定的 location term 与模型 keyword 后才能实施。
- **离线验收：** D1/D2 保存的权威 Akabane、观察链接和旧校验器的地名拒绝提供红灯；新 composition 应在原预算内生成绑定地名的查询、跳过反复地区菜单。C03 的 fugu/fugu cuisine/重复 fugu 序列应产生清楚的检索停止或下一合法选择，不能误记为命中 fugu。保留原一般列表及五家详情作为负向控制，不能拿它们给新查询伪造成功响应。
- **外部缺口：** 历史材料没有 `Akabane + kushikatsu` 或新 C03 查询的响应；新分支到这里必须 fail closed，不能拼一份“能找到 Dengana”的假 Replay。离线能证明接线、约束、保留预算和不再走旧循环；真实命中与净时延只能由批准后的 Live 确认。
- **预期节省：** 01 的 80.9–90.0 秒来源地区作用域是可削减池，保守目标为从中回收 30–60 秒，需扣除新查询/详情成本，属于工程目标而非实测预测。03 的 147.9–150.1 秒 Tabelog 事实追查是另一可削减池；若新检索找到相关店或及时转下一合法来源，可目标减少 60–120 秒，但也可能零收益。更快的无结果只证明耗时下降，不证明交付改善；不得把这些池与名称解析 231/271 秒相加承诺总收益。
- **已通过用例：** 已绑定的具名地区保持原查询、来源顺序和访问数；稀疏空查询才出现新选择。四个具名基线分别验证不多换入口、不多页面，精确半径、身份/HARD 和库存负例保持。只替换当前路径，Pilot 前不保留双轨兼容。
- **Live：** 同为六次正式运行加最多两个环境重跑；先满足 F2①/F2④a 合入和停止点 2 复核，01 至少 2/3 合格且不超时，03 同输入用时降低。03 若仍无见证只作计时诊断，不能计能力。

**停止点 1 的历史建议：优先评审 B；停止点 1b 已明确不采纳。** 当时考虑其处理模糊地区检索及 C03 通用列表的可能收益；现按用户裁定，仅细化 A，地名进关键词与第二项检索行为改动均不进入 F5。名称解析交 3b，日历 Guard 和空查询后自动读通用列表交 F3。

## 8 验证、额度、偏离与停止点

### 本批检查

- [analyze.py](analyze.py) 完成固定 Git blob 的算术抽取；[verify.json](verify.json) 记录 4 份完整结果/171 行与 1 份中断/29 行、41/95 原计数及输入 SHA。本项不是产品回放，不产生新 pass/fail 业务评价。
- 产品与测试及两个站点目录相对基线零差异；相关生产文件相对 D1/D2 的 `4d953731` 亦无差异，分析机制仍在 main。
- 五门禁本批 **未新运行**。只读分析按 Test 文档矩阵核对证据、引用、命令和 diff；复用批次 0 的 typecheck/arch/build PASS、默认 1029、Chromium 138，原日志保留在 [main-check](../main-check/report.md#3-五门禁结果用例数耗时)。不把它们称本批新绿灯。
- 本批产品修复红灯/绿灯 **不适用**；历史真实失败为分析对象，不冒称已取得修复红灯。实现批需另取得真实调用链红灯与绿灯，不能以本报告的 CSV 代替。
- Mock、Replay、Live Read-only、Controlled Live-write 本批均未新运行；只有历史 Live 记录的离线分析。新真实模型/Google/网站/Live/环境重跑均 0，阶段账本无消耗事件，不修改公共 budget.json。

### 偏离提醒与收敛

| 原先前提或承诺 | 当前证据 | 影响与收敛 |
| --- | --- | --- |
| 错误 Tabelog 区域只有两家，首五家规则不触发 | 两家来自 TableCheck；Tabelog 为零详情、地区未完成 | 先修地区向列表交接；不能只改 helper 的样本数 |
| 例 03 是 Ichigaya | 已执行输入为备用 Kudanshita；第三次未到达 | 历史对比只用已执行输入；新日期/地点在下一批冻结前明确，不能换输入沿用改善结论 |
| 所有已保存页面可恢复错误区域路径 | 两个关键地区页只有 head；新查询响应也未录到 | 离线 fixture 与真实 Replay 分报，剩余外部问题才留给后续 Live |
| 41/95 次就是 136 次误拦 | 快照重复；被拒记录缺请求方法/headers 配对 | 只分类交 F3，不在 F5 扩权限或认证所有请求无害 |

同步仅本分支的 STATUS、DEVLOG、TEST-LOG、月度摘要/逐条索引。这五份文件也可能由并行 F1 修改，合入时应由复核安排顺序并保留双方记录；本批不合并 main、不推送。

**停在批次 1 停止点 1。** 六个分析问题和两个方案已形成可复核材料。等待独立复核选择方案，并明确例 03 的下一批地点/可比口径；未进入 F5 实现、Live 准备、F2 或 F3 修改。

## 9 停止点 1b 补充

- 日期：2026-10-24，维也纳时间 CEST（UTC+2）；本节为当前待复核设计，**draft / not integrated**，不是已实现能力或 Clean Baseline。
- 授权依据：本对话收到的《3a′ F5 对话 B：停止点 1b 指令》。用户明确停止点 1 分析通过，选 A、不选 B，本批只补设计、估算和 ADR。用户所引 `phase3/3A-PRIME-F5-ANALYSIS-REVIEW-20261024.md` 在本地已知 Git 材料中未找到，未读取该复核原件；不据其文件名补造内容，裁定依据是用户直接提供的指令。
- 切片承诺：把 Q7 的可证明事实、未证明路径、预算和实现验收写成可复核材料；不实现、不执行产品链路，不改变任何冻结评测输入。完成证据为本节、固定 blob 摘要、输入 SHA、窄 ADR 和纯文档检查；提交推送本分支后停在 1b。
- 历史执行仍固定 `3ec38584`，代码机制核对固定 `2ada8a69`；新读取登记到 [inputs-sha256.json](inputs-sha256.json)，保留原 29 项，现共 43 项。新增 [supplement.py](supplement.py) 仅离线读 Git，生成 [Q7 摘要](q7-evidence.json)、[预算算术](budget-estimate.json)、[例 03 最终结果](case03-final-outcomes.json)。它不是产品 Runner、评测器或环境重跑。

### 9.1 Q7：LOCATION、车站／距离与类别控件

**结论：普通车站链接和类别入口确实出现；任务匹配的 Akabane LOCATION／车站距离路径证据不足。** 不能把“Search by area”导航链接误报为可填 LOCATION 的搜索框，也不能把错误地区里的八个站当作 Akabane 的入口。

| 问题／记录 | 决策、snapshot、trace 定位 | 可证明事实与限制 |
| --- | --- | --- |
| (a) LOCATION 地区／车站输入 | D1 决策 4–12、snapshot 0003–0011、trace 2–230；D2 决策 4–9、snapshot 0003–0008、trace 2–153 | 15 个决策 observation 的 INPUT 和 `FILL_AUTHORITATIVE:LOCATION` target 都为 0；对应地区作用域 18 份原始 CONTROLS 的 INPUT 也为 0。已给权威 Akabane 名称、坐标、1000 m 和地址组成部分。**未观察到可绑定 LOCATION 的输入框**，不证明真实页面不存在或展开其他菜单后不会出现。 |
| (b) Search by area | D1 决策 5、snapshot 0004、SNAPSHOT trace 51 / CONTROLS 55，`observation:3:target:13` | 标签 `Search by area`，href 为当前东京页的 area fragment，合法动作 CLICK；旁有 Search by address。它们是菜单链接。模型第 5 行选了 Itabashi 大区，第 6 行又展开该区菜单。 |
| (b) 八个车站入口 | D1 决策 8–10、snapshot 0007–0009、trace 117/121、139/143、158/162；D2 决策 8、snapshot 0007、trace 117/121 | `Search by area` 分组中的 targets 15–22：Itabashi、Kita Ikebukuro、Koshinzuka、Nishi Sugamo、Nishigahara Yonchome、Shimo Itabashi、Shin Itabashi、Shin Koshinzuka，各标签含 Sta.，均有 OPEN_LINK。href 的站代码来自这些观察本身。没有 Akabane／赤羽 target。不能从这些站反推请求地的车站代码。 |
| (b) 车站＋距离 | 同上，Q7 摘要逐行 `distance800mInVisibleText` | 上述地区决策可见文本没有 `800 m`，未保存请求站＋距离选择或选中确认。只能证明普通车站链接存在，不能认证“Akabane Sta. 800m”控件存在或不存在。用户后来对 Kudanshita 的人工核对不属于 D1/D2 observation。 |
| (b) 类别 | D1 决策 8、snapshot 0007、trace 117/121；动作 trace 129–132；后续决策 9、snapshot 0008、trace 139/143。D2 决策 8 同样有文本 | 可见文本明确含 `Search by category All`。可操作 target 23 的标签为 **All**、group 为 **Unlabelled group**、合法动作 CLICK。D1 第 8 行理由是打开类别面板，实际 CLICK All 已完成，随后 target 数 227→285。它确实尝试了类别入口；不能说“两次都未用类别”。D2 则选择回东京。未证明选定 kushikatsu 类别或有效地区检索。 |

(c) 对“为什么没用”的原因逐项核对：

| 候选原因 | LOCATION | 车站 | 类别 |
| --- | --- | --- | --- |
| 上下文没给 | 权威地点已给；输入控件未进入 observation，原始 CONTROLS 也无 INPUT。不能据此认定是 context 丢失而非当页未提供。 | 八站分组、标签、href、动作均给了，排除“所有车站控件没给”；匹配 Akabane 的入口未观察到。 | 可见文本给了类别提示；All 被标为 Unlabelled，是可证明的语义呈现不足，但模型仍实际选择它，不能认定这是本次阻断根因。 |
| 合法动作没列出 | 无对应输入，所以未列 LOCATION 不能单独证明动作生成缺陷。 | 八个 OPEN_LINK 已列，排除这个解释。 | All 的 CLICK 已列且执行，排除这个解释。 |
| Schema 不允许 | 固定代码 `browser-action-decision.ts:289–293` 已允许 `FILL_AUTHORITATIVE + LOCATION`；**CHOOSE_OPTION 不允许 LOCATION**（285–288），本次未见这种地点选择控件，不能归因为它。 | OPEN_LINK 已允许，排除 Schema 阻止普通站链接。 | CLICK 已允许并执行，排除 Schema 阻止 All。 |
| Executor 拒绝 | 未提出 LOCATION 动作，没有可供归因的拒绝记录。静态 `browser-task-executor.ts:1011–1016,1034–1046` 要求 DISCOVERY、权威 name、绑定公开 INPUT 和既有读取许可；未证明其中哪项误拒。 | 没有提出站链接动作，无法证明 Executor 会成功，也没有其拒绝证据。D1 被拒的是 COMPLETE，非车站点击。 | D1 trace 129–132 CLICK 成功，排除“此动作被 Executor 拒绝”。 |
| 模型选择别的动作 | 无已观察 LOCATION 输入可选，不能指责其忽略该输入。 | **已证**：D1 第 8 行选 All、第 9 行 COMPLETE、第 10 行回全国；D2 第 8 行回东京、第 9 行选 Sugamo。模型理由把 Itabashi／Sugamo 当作可到 Akabane 的父区；理由只能说明其选择，不能证明真实地理覆盖。 | D1 已选；D2 选回东京。类别接线是否足以改善不在本批验证。 |

D1 第 9 行声称列表含 Akabane，代码未接受；第 10 行的 history 明记 `COMPLETE_PREDICATE_UNSATISFIED`，progress 明记 completion not accepted（snapshot 0009，trace 158/162；此前 trace 150 为 MODEL_STOP）。这支持“`namedEntrance` 阻止完成→未取详情”的原根因，不支持 LOCATION 执行器拒绝或 4/5 条件已评估。

(d) D1 首次站链接出现在来源开始后 **38.250 秒**的已完成观察（trace 2→122，snapshot 0007），理论余 51.750 秒。正确站／距离控件的揭示、选择从未发生，不能用错误站的 OPEN_LINK 代替。原 1b 的站控件条件估算保留在旧预算 JSON；1c 已不采纳该路线，不承诺 90 秒到列表。

(e) **保存缺口：** D1 这些决策对应的 HTML 仅 snapshot 0005/0007 有 blob，分别 2095/2093 bytes，均无 body；0003/0004/0006/0008–0011 的 HTML 未提交。D2 仅 0005/0007/0008 有 HTML，均为约 2 KB 的 head；0003/0004/0006 缺失。另查看了固定 blob 的 D1 screenshot 0003/0004/0007/0008 和 D2 screenshot 0007：文字已遮蔽，不能补全控件语义。18 份 CONTROLS 的 scope 为 `ALL_OBSERVED_REDACTED`，是观察到的控件清单，不是全站／隐藏 DOM 完整性承诺。未观察与不存在分开记录。

### 9.2 实现范围裁定（1c：只做 A）

**1c 复核裁定：只做方案 A。** 第 9.1 节的证据结论仍是任务匹配控件缺证；它不等于“共享层漏掉了可用控件”。现有 LOCATION 填充／普通站链接的合法动作已经支持，没有能证明控件可用性缺陷的有效红灯，故不实施这条改动。ADR-0043 第 8 项改为**“未采纳，暂缓至 F5 Live 有完整 DOM 证据后再议”**，本批不安排该 Live。

A 的唯一新增路线是：临时入口取样，两有效样本均越界后，由模型从**本来源流程已经实际观察到的地区入口集合**选择一次替代，代码核对后直接导航，不读恢复菜单页。这个选择与当前页 DOM 的 OPEN_LINK 是不同合同；当前 Executor 不允许旧 DOM targetRef，所需合同变化在第 10.2 节明确列出，不绕过原校验。

站码、类别码和 URL 只能来自实际观察，模型与代码均不得拼造；类别仍依 ADR-0042 的既有检索和归属规则。`R3470`、`RC011212` 等用户举例仅作为未观察代码的反例，不成为实现常量、映射或预设网站真值。店名解析、类别检索行为与 Guard 改动不并入 A。

### 9.3 方案 A 设计（A-1 至 A-3，未实施）

**A-1 方位反馈。** 对每个去重、身份可核对且详情页同店 JSON-LD 提供有效经纬度的样本，由代码用冻结的权威圆心计算距离与初始方位角（圆心指向店，北 0°、东 90°），并生成可读方位。沿用现有精确距离算法；半径判定使用未舍入值，显示可舍入。每条反馈附店／详情引用、坐标来源、距离、方位、半径内外结果；同方向时才可概括“2 家，均在西南约 3.4 km”。该数字是说明格式的例子，**不是 D1 已测距离**；D1/D2 均未读到 Tabelog 详情。

换入口的下一次既有模型决策同时收到代码生成的逐样本反馈、剩余预算、已用换入口次数，以及本来源流程已观察地区入口的只读候选集合。未知样本单列，不编距离或方位。模型只从该集合选择入口引用，不能提供自由 href 或覆写数值、圆心、半径、用户地点；代码也不按方位自动替模型选地区。不新增解释方向或重读菜单的模型调用，不额外请求地图／Google。

**A-2 临时入口与两样本。** 请求有权威地名、模型已选择观察到的地区入口，但标签不含请求地名且无同源店铺指针时，标记临时入口。已有权威 LOCATION 确认按原具名路径处理。代码核对入口归属、当前页与所选入口一致、已观察的可解析公共列表；满足后允许在原额度内取样，不能仅因标签不符永远拒绝，也不能仅因模型 COMPLETE 而完成。纯全国／东京菜单、加载页和解析失败不变成临时成功；明确空页没有样本，保持相应缺口，不认证地区或全站无店。

从原详情队列顺序读取、按同源门店去重，每次有效坐标后立即判定，不等五家批次结束：

- 前两个**有效坐标**都 OUTSIDE_RADIUS，且总换入口次数为 0：触发一次换入口；不再为凑五家读取旧入口详情。
- 任一有效样本 WITHIN_RADIUS：该入口已核实，继续既有发现／资格流程，一内一外也按此处理。入口核实不意味着所有候选合格。
- 缺坐标、坐标无效、身份未知或无法算距离的样本不计入两个有效坐标，仍消耗已经开始的详情／时间额度；不足两个不能假定两家越界，也不为补数突破上限。
- 具名／LOCATION 已确认／同源指针入口不进临时分支，保留 ADR-0040 原有首五家 4/5 规则；临时入口核实后也按既有规则继续。两规则共用**整个发现流程的一次**换入口额度，不按触发器、批次、来源重建或重入而清零；本需求中的目录流程不能出现第二次更换。

换入口只替换未核实的地区路线；`admitted`、去重记录和已接纳合格候选保留，不把地理范围内候选提前说成满足 HARD 或可订。保留首次／替换入口的原观察引用、样本、触发原因、共享次数。每来源 **10 详情、90 秒**，整单 **500 秒／50 模型**均保持；地区 4 页、检索 3 页及总列表 7 页也保持。替代入口直接导航只计一个实际地区页，**不读恢复菜单页**；其他实际导航仍照常计数，不重置截止时间或改写次数。入口集合与同一来源进度一起保留，不能从别的流程／来源拷贝入口或重建账本。

**A-3 失败立即收尾。** 只在本来源流程已观察集合中存在可用、不同的替代入口且原预算允许时换一次；集合为空直接按无替代入口收尾，不调用模型去全国／东京重新找。模型提出集合外引用／href、其他来源或其他流程入口时拒绝，并以非法入口选择原因保留 UNKNOWN，不能假装集合为空，也不自动多问一次模型。保留已接纳候选，移交下一既有来源；全局预算耗尽／取消仍按原全局停止合同，不凭交接启动超额读取。

| 情况 | 代码可观察的终止条件／拟用原因标签 | 后续 |
| --- | --- | --- |
| 1. 第二入口样本仍越界 | 同一两有效样本规则证实两家都越界，且换入口次数已为 1；`REPLACEMENT_SAMPLES_OUTSIDE_RADIUS` | UNKNOWN，零第三入口、零全国／东京菜单回找。若只见一个越界，缺另一个有效样本，不能冒称已判定；按剩余原额度或第 2／3 项收尾。 |
| 2. 没有观察到可用替代入口 | 本来源流程实际观察且通过 Pack `isRegionEntrance` 的集合中，没有预算内可执行的不同入口；`NO_OBSERVED_REPLACEMENT_ENTRANCE` | 立即 UNKNOWN，不读恢复／全国菜单。原 DOM 引用只保留为审计来源，流程集合引用通过明确的新选择合同处理；不能用猜 URL 或放开陈旧 DOM ref 恢复。 |
| 3. 来源 90 秒耗尽 | 原来源截止时间到达；沿用 `BROWSER_TIMEOUT`／`READ_BUDGET_EXCEEDED` 等已有原因，并指出来源时间／页数／详情额度 | 立即停止；下一来源只用整单剩余时间／调用额，本来源的进度不重置。 |
| 4. 正确区域被误判 | **不是可识别的运行时条件，不新增“识别误判”的逻辑或原因码。** 在运行中只会表现为第 1 或第 2 项（也可能最后预算停止） | 离线 oracle 标注正确区域且圆心在边缘、前两家恰好越界，证明误判代价上界：只换一次，已接纳候选保留，随后按可观察失败结束。 |

表中新增标签只是 ADR 草稿的诊断语义建议，当前代码／Schema 未新增。UNKNOWN 表示该来源未得到可靠结论，不等于无合格店、无位或来源穷尽。

### 9.4 实现批离线红绿灯清单（全部 NOT_RUN）

本批只列清单，不写测试／Fixture，不执行旧产品获取红灯。优先扩展既有 `directory-region-selection.test.ts`、`native-discovery-composition.test.ts` 和浏览器 fixture 对应覆盖；不另建 Runner。输入只用已暴露的历史 blob，或明确标注的**本地构造**，后者不得叫网站 Replay。验收必须经过生产发现组合／Router 交接，坐标判定、候选接纳和预算由真实代码产生，不能预填合格 Evidence 或 State。

| 编号／目标 | 输入来源 | 实现批应取得的断言 |
| --- | --- | --- |
| R1 旧完成谓词红灯 | 固定 `3ec38584` D1 决策 5–10、snapshot 0004–0009 的观察入口和 trace；缺失 body 以**本地构造**列表／控件补齐 | 目标断言“进入详情取样”在未修代码上失败，实际 namedEntrance 阻止、详情 0；启动／类型错误不算红灯。保留旧失败证据。 |
| G1 临时入口完整绿灯 | 同上观察链接＋**本地构造**可解析列表、两个同店 JSON-LD 越界详情、先前实际观察的同源替代入口及正常半径内详情；坐标距离 oracle 独立给定 | 临时入口→恰取两个有效样本→代码逐条距离／方位＋集合反馈→模型选引用→代码直接导航→新列表／关键词→范围内候选产生；原预算内完成，不读恢复页。该组合不称 D1 真实响应回放。 |
| G2 正确区域误判控制 | **本地构造**：oracle 指定正确区域、圆心位于区域边缘、首两个去重详情恰好在半径外；流程已有一个真实合格候选，经正常发现接纳 | 首二外触发一次换入口；不能以 fixture 的“正确区域”标签改变运行时判断。后续第二入口越界或无替代分别收尾；先前接纳候选仍在，最多一次更换、不额外补偿重试。 |
| G3 D1 实际路线四页绿灯 | 固定 `3ec38584` D1 决策 5 的东京菜单（snapshot 0004、trace 51/55）及决策 7 的第二层入口；**本地构造**缺失列表／两越界详情／替代列表，先让生产观察实际形成集合，不预填合格入口集合 | 未修路径若恢复菜单再选需第五页，应保留超页／旧 DOM ref 不可用的有效失败证据；修订合同后东京(1)→A1322(2)→A132201(3)→集合内替代(4)，恢复页访问为 0，替代只一次，原观察引用可追溯，候选和预算保留；后续关键词页按原检索额计，不能算作已取得真实网站响应。 |
| X3 集合边界反例 | G3 **本地构造**中分别给集合外但形状合法的 href／ref、另一来源或另一流程的真实观察入口、拼造 href；保留一个正常集合内对照 | 全部异常在导航前拒绝，禁止仅凭同 origin 或 `isRegionEntrance` 通过；模型不能传自由 href。原 DOM stale ref 仍拒绝，集合为空无需模型调用即 UNKNOWN；不重置或额外消耗新一轮换入口预算。 |
| F1 第二入口仍外 | G1 的第二入口改为**本地构造**两个有效越界样本 | UNKNOWN＋第二入口仍外原因，第三入口及回全国／东京读取为 0；已接纳候选不丢。 |
| F2 无替代 | D1 保存的入口集合，**本地构造**过滤后无可用不同入口／仅陈旧 ref | 第一次两外后直接 UNKNOWN＋无观察替代；不能拼路径或回全国继续找。 |
| F3 来源耗时 | D1 时间区间作参数来源，**本地构造**虚拟时钟在取样／换入口前达 90 s | 无后续来源读取，UNKNOWN＋来源超时；不额外 WAIT／模型决策延长本来源。 |
| F4 误判正确区域 | G2 **本地构造**独立区域 oracle；分别接 F1/F2 的可观察后果 | 不出现运行时“检测误判正确区域”分支／原因；代价只到一次换入口，候选保留。 |
| B1 F1–F4 交接预算 | 上四条共用**本地构造**时钟与调用账：整单已用 200 s／20 calls；本来源实际用量累加后移交 | 下一来源看到 `500−实际累计秒`、`50−实际累计调用`，不是重新 500/50；本来源 elapsed、详情、地区／检索页数及换入口次数不清零。500 s、50 calls 或 4 地区页已尽时拒绝新动作，不把原已超时来源复活。 |
| C1 一内一外 | **本地构造**两个不同门店、有效 JSON-LD，参数化内→外／外→内 | 任一在内即核实，不因两样本中一外触发临时更换；只接纳地理合格候选，其他资格另核对。 |
| C2 缺／未知坐标 | 历史 C03 详情 JSON-LD 格式＋**本地构造**缺 geo、非法经纬度、身份未知序列 `未知→外→缺失→外` | 未知／缺失均不占有效样本数、不接纳、不出假距离；只有第二个有效外出现才触发，已开始详情均照常记额度；十详情仍不足则有界 UNKNOWN。 |
| C3 两规则共用上限 | 既有 4/5 测试输入＋**本地构造**临时两外／4/5 两种先后次序 | 先由任一规则用掉一次后另一规则不可再换；重复批次和来源流程重入不刷新次数，已接纳候选保留。 |
| C4 COMPLETE 与数值权威 | D1 第 9 行 COMPLETE＋**本地构造**加载页、无列表页及模型理由伪造距离／改半径 | COMPLETE 不替代列表／入口核对；模型不能覆盖 JSON-LD 派生值、圆心、半径或用户地点，无隐式地点改写。 |
| N1 H001 涩谷 | **本地构造**；优先复用既有 `directory-region-selection.test.ts` 的 `fixture()` 及实际组合 `runScenario`／`sourcePages` 构造方式，填涩谷请求、权威圆心、具名入口和同店详情 | 不进入临时分支；与未修正常控制比较，实际页面访问、详情数和换入口次数均不增加，结果资格不变。 |
| N2 神乐坂 | **本地构造**；优先复用同一行为 fixture 构造方式，独立具名入口／圆心和正常详情 | 同 N1；单列该地点的正常结果，不能用涩谷代替。 |
| N3 吉祥寺 | **本地构造**；优先复用同一行为 fixture 构造方式，已有同源指针／入口和正常详情 | 同 N1，并独立验证指针路径；不让标签匹配替其通过。 |
| N4 H005 东银座 | **本地构造**；优先复用同一行为 fixture 构造方式，具名入口和正常详情，保留原请求资格门槛 | 同 N1，原人工评价口径不改。 |
| Q7-X 不可拼代码反例（保留约束） | **本地构造**未观察的 ref／URL、用户举例站／类别代码；正常对照来自本流程观察集合 | 未观察代码／href 不得拼造，不能把错误地区八站重命名为 Akabane；类别仍受原归属／Guard 约束。Q7-R／Q7-G 控件修复清单已撤回，本批只做 A。 |

N1–N4 设计为本地构造控制，优先扩展既有行为构造／实际组合，不另建 Harness；相关构造文件固定于 `2ada8a69` 并登记 SHA。实际 Fixture 是实现批输入准备事项，**本批没有新造 Fixture，更没有声称这些红绿灯已经通过**。实现前冻结输入／脚本 SHA；适用五门禁、实际调用链 artifact 与独立结果核验按 Test 唯一矩阵执行。本地控制能证明有界代价，不能证明当前外站列表能解析、存在正确替代入口或真实模型会选择它。

### 9.5 预算算术：90 秒内的条件估算（1c 修订）

本节改为 D1 实际的第二层入口取样，再从本来源流程已观察集合直接选择一次替代。旧“恢复菜单再换区”的五页路径弃用；[旧预算](budget-estimate.json) 与固定 `29f6328f` 的原报告保留为 **superseded retrospective**，不是当前设计。LOCATION／车站路线未采纳，不计入本批实现范围。

全部为历史区间拼接，**不是干预结果或承诺**。当前集合选择合同尚未实现；D1/D2 没有 Tabelog 详情或关键词阶段，使用固定 `3ec38584` 的 C03-2 同来源代理。绝对时间为 2026-10-23 CEST，算术见 [1c 预算](budget-estimate-1c.json)。

| 第二层取样后直接替代 | 历史依据 | 秒 | 累计秒 |
| --- | --- | ---: | ---: |
| 东京→A1322→A132201，完成第二层观察 | D1 trace 2→122，13:05:07.492→13:05:45.742；决策 3–7，snapshot 0007 | 38.250 | 38.250 |
| 两个详情 | C03-2 trace 116→138，07:56:21.743→07:56:28.615，snapshot 0009/0010；异例同来源代理，非错误区实测 | 6.872 | 45.122 |
| 一次模型选择，集合与 A-1 方位反馈一并提供 | D1 第 7 行 latency，snapshot 0006；历史为选择子区，只代理一次决策成本 | 2.095 | 47.217 |
| 代码直接导航替代并核对列表 | D1 trace 107→122，13:05:41.191→13:05:45.742；历史 OPEN_LINK＋观察代理，未访问真实新替代页 | 4.551 | 51.768 |
| 首次关键词检索 | C03-2 trace 80→92，07:56:06.149→07:56:11.893；含一次规划，fugu 空结果不是 kushikatsu 成功响应 | 5.744 | **57.512** |

**条件可行，余量 32.488 秒；列表能否解析仍未证。** 地区页为 **东京(1)→A1322(2)→A132201(3)→替代(4)**，恢复菜单页 **0**。读取已存观察集合不是读取旧页面；真正替代导航仍计一个地区页，导航前核对原页额、来源截止时间和共享调用账。关键词另计原检索页，详情照计原十个限额；没有包含后续 HARD／库存交付成本。

旧第二层方案 67.879 秒中，恢复及选择代理为 12.462 秒；本次去掉恢复过程，仍保留一次选择 2.095 秒，因此减少 10.367 秒为 57.512 秒，不能把模型选择也算免费。D1 trajectory 与 DIRECTORY Provider 差额 1.981 秒若保守全部计入，则 **59.493 秒、余 30.507 秒**。

敏感性：换用 D2 trace 2→122 的选区 **62.324 秒**和第 8 行一次决策 **8.010 秒**，其余代理不变，合计 **87.501 秒、余 2.499 秒，判断紧张**；取样稍慢即可超时。直接 NAVIGATE 与历史 OPEN_LINK 的响应差异、替代入口是否对应圆心，均未经运行验证。若第四地区页只有更深菜单而没有可解析列表，按 A-3 保留 UNKNOWN，不加第五页、不恢复菜单。关键历史 HTML 仍仅 head／缺失，本算术不能消除该证据缺口。

### 9.6 ADR-0043 批准状态（1c 修订）

[ADR-0043](../../../docs/decisions/0043-provisional-directory-entrance-coordinate-check.md) 修订为 document revision **1.1**。用户在本对话明确“我批准新的adr”，记录为 **Accepted（已批准，尚未实施）**。第 7 项纳入已观察集合、模型选择、代码直接导航、无恢复页和四页上限；第 8 项改为“未采纳，暂缓至 F5 Live 有完整 DOM 证据后再议”，保留不得拼造站码／类别码／URL；第 10 项明确所需受限选择合同。原 ADR-0040／0042 正文不改，不标记任何条款已替代。

批准设计与本次交付范围分开：用户同时要求本批仍不实现、停在 1c；本批只记录批准并修订文档。

### 9.7 例 03 重新定义与历史最终输出

用户已手工核对 Tabelog 英文站：**Kudanshita Sta. 800m＋Fugu (Pufferfish)，0 家**。此处证据来源是本次用户陈述，标为**人工核对，800 m**，不是本批新网站访问，也没有补造截图／响应 SHA。例 03 未来冻结地点为 **Kudanshita**，定义为“附近无合格店”用例；本批不改变体或 Gold，冻结动作交批次 2 的 Live 准备。

新通过条件：如实给出有证据范围的无匹配结论；不超时；**S0=0**；不把非 fugu 店说成满足 HARD。用时只记录，不再要求降低。产品半径仍 **1000 m**，**800–1000 m 环带未核对**；800 m 类别零结果不能认证整圆无见证，更不能推出全地区无 fugu／无位。仍有未调查范围或事实超时时，应表达“本次已查范围没有核实到满足全部条件的结果”，不能把证据不足改写为“附近确实不存在合格店”。

历史 C03-2／C09 的原评价、分母和标签不改；新增以下“未交付”与“诚实结束”的独立说明。最终模型决策摘要不是用户输出，判断以最终 Outcome、事件和固定代码的用户投影规则分层进行：

| 历史运行 | 最终记录及用户结果含义 | 是否构成如实的无匹配结论 |
| --- | --- | --- |
| C03-1 | 外层中断，29 行之后无完整 result／用户终态 | 不能确认；保持中断，不能记成正确无匹配。 |
| C03-2 | 第 47 行 END_READ；最终 `/finalSnapshot/outcome.status=NO_VERIFIED_RESULT`；事件 `READ_ENDED_NO_VERIFIED_RESULT` 在 **08:02:56.939 CEST**，保留十家未解候选及 HARD fugu 缺口、事实超时、未查来源等。耗时 457.907 秒，整单无 RUN_DEADLINE_EXCEEDED，存在局部事实超时 | **在“本次已查范围没有核实到可展示匹配”的意义上，是诚实的有界无结果；交付合格店数仍为 0。** 不构成“1000 m 内无 fugu／无可订店”的认证，不能反写为历史已经通过新用例所有条件。 |
| C09 | 同为第 47 行 END_READ 和 NO_VERIFIED_RESULT；结束 **08:47:46.211 CEST**，同样保留十家未知及 fugu 缺口，部分事实为 NATIVE_HARD_FACTS_UNCONFIRMED。耗时 457.674 秒，整单未超时，但局部事实读取超时 | **同为有界诚实无结果、零合格交付**，不是穷尽性无店结论；不因后来人工 800 m 核对而改历史评价。 |
| C15 | NOT_REACHED，无运行／终态 | 没有用户输出，不能计为诚实无结果。 |

两个完整 artifact 未保存最终 Web／聊天渲染文字。可证明的是最终持久 Outcome；固定 `3ec38584:src/application/persistent-restaurant-agent.ts:196–197` 的用户投影明确说本次有界调查没有足够证据可展示的结果，并说明不等于所有餐厅无位，后附 remainingGaps。因此上表对“用户输出”的判断有这一投影依据，**没有把第 47 行的模型理由冒充用户已看到的原文**；用户实际终端是否显示过，记录不能独立证明。S0 仍需独立于生产投影和自身原因码的证据审核，本批不重评或新认证 S0=0。[逐次最终摘要](case03-final-outcomes.json) 保留查证指针。

### 9.8 停止点 1b 验证、交付与停止（历史记录）

- 新模型、Google、餐厅网站、Live、环境重跑调用全部 **0**；未读／暂存 `.env`，`budget.json` 不动。Git push 仅传本分支文档，不是产品外部读取或 Live。
- 本批只改本目录分析文档／离线摘录工具及派生摘要、唯一新增 ADR 草稿和 STATUS／DEVLOG／TEST-LOG／月度导航。产品、Runner、测试、Prompt、Schema、Gold、变体、Guard、两个站点目录与 `source-packs.ts` 相对 `2ada8a69` **零差异**；原历史输入与原 29 项 SHA 保留。
- 纯文档矩阵检查：固定 blob SHA、Q7 决策／trace／snapshot 引用、预算加总、链接、月度行数和 `git diff --check`；结果记录在 [verification-1b.json](verification-1b.json) 与 [verification-1b.log](verification-1b.log)。抽取脚本首次假设所有 snapshot 有 HTML，遇未提交 blob 后停止；改为明确记录 MISSING，不回填页面。这是分析工具修正，不是产品红灯。
- 五门禁：`typecheck`、`arch:check`、`npm test`、`build`、`test:browser:fixture` 均 **NOT_RUN**，本批纯设计不需要运行；不把旧批次绿灯称为本批通过。实现红绿灯及 Mock／Replay／Live Read-only／Controlled Live-write 全部 **NOT_RUN**。本批不是新四层端到端评价；历史结果不改分，S0 新认证 NOT_RUN。
- OPTIONS 41/95 分类交 F3；店名解析交 3b；“检索为空后代码自动改读通用列表”记为 **F3 审计候选项**。不进入它们的实现、F2 或 Live 准备。
- 合入顺序保持 **F1b 先进入 main**。之后经复核安排，本分支再基于新 main 重放；STATUS、DEVLOG、TEST-LOG、月度摘要／索引冲突保留双方记录。本批不重放、不合并 main、不向 main 推送。

**交付目标：提交并正常推送 `codex/chore-phase3a-prime-f5-analysis`，停在停止点 1b 等复核。** Q7 待裁定，ADR 待批准，未开始 F5 实现。


## 10 停止点 1c 修订与 ADR 批准

- 日期：2026-10-24 CEST（维也纳，UTC+2）；当前设计已获用户批准，**approved / not implemented**，不是已验证能力或 Clean Baseline。
- 依据：用户直接提供的自包含停止点 1b 复核要点，以及同条消息的“我批准新的adr”。用户说明 `phase3/3A-PRIME-F5-STOP1B-REVIEW-20261024.md` 不在 Git；本批不声称读过该文件，不补造复核原件。
- 切片承诺：仅 A；用本来源流程已观察入口集合消除恢复菜单页，明确现有合同缺口，更新 G3／反例、预算和 ADR 批准。提交推送同一分支后停 1c，仍不实现。第 9.2–9.6 节为修订设计，9.8 为当时 1b 验证记录。

### 10.1 已观察入口集合与直接导航

集合只收录**同一 Task／run、同一来源流程**实际观察的 LINK href，须由当前来源 Pack 的 `isRegionEntrance` 核对，并保留来源标识、流程作用域、标签、精确已观察 href、原页面 URL、observation revision 和原 targetRef。按 href 去重，不从标签生成代码、相邻地名或 URL，不从其他来源／历史运行复制入口。保留到同一来源的后续批次时，继续绑定原请求／地点和累计预算；新任务、新来源或新调查不得继承。

D1 第 5 行东京菜单已含 31 个地区链接：snapshot 0004、observation revision 3、SNAPSHOT trace 51／CONTROLS trace 55。例如 `Sugamo` 的原引用为 `observation:3:target:42`，原 href 为 `https://tabelog.com/en/tokyo/A1323/`。这些不是现在访问所得，也不证明 Sugamo 包含 Akabane；它们证明不用重读东京页就有可供模型选择的已观察入口。[原观察摘录](entrance-history-d1.json) 只列固定 blob 中的事实，静态 URL 形状核对不冒称已执行生产 Pack／Guard 或新导航。

两有效样本越界后，代码将可用集合与 A-1 逐样本距离／方位、剩余预算、已用更换次数同时交模型。模型只选择一个不透明集合引用；href 和审计来源由代码解析。代码执行前重新核对同来源流程归属、成员资格、Pack `isRegionEntrance`、不同入口、原 Guard／允许 origin／公开只读边界、一次更换及四页预算，随后直接导航并核对新列表。不读原观察页或恢复菜单，不由代码按方位替模型选区。

集合为空按 A-3 的 `NO_OBSERVED_REPLACEMENT_ENTRANCE` 立即 UNKNOWN，不请求模型继续找菜单。集合外、跨来源／流程、伪造或修改 href 的选择在导航前拒绝，以非法选择原因保留 UNKNOWN，不能冒称集合为空或自动多问一次。已接纳候选、原详情／时间／调用／页数及共享换入口次数均保留。

### 10.2 现有合同确实不允许，实施必须明确修改

固定 `2ada8a69` 的 `browser-task-executor.ts:710–715` 从**当前** `observation.targets` 取 target，缺失即 `STALE_OR_UNKNOWN_TARGET_REF`；1091–1114 的普通 OPEN_LINK 需要当前 DOM target／controlId。`browser-action-decision.ts:107–127` 的输入只有当前 observation，现有 prompt 也要求选择当前目标。持有旧 href 并不使旧 DOM ref 合法，现有通用 `navigate()` 也不替代集合归属校验。**不能把原 ref 塞进 OPEN_LINK、伪装成当前 DOM target，或让模型返回任意 URL。**

实现批采用一个明确的集合选择合同，拟名 **SELECT_REGION_ENTRANCE**，模型仍只输出 `targetRef` 引用、NONE 占位和简短理由，不能输出 href。集合引用独立于旧 DOM ref；后者仅为审计证据。选择动作只允许 DISCOVERY 的一次地区纠正阶段，由来源拥有的代码核对／导航；普通 OPEN_LINK、CLICK、LOCATION 及其当前页限制保持。该动作现在**不存在**，本批没有修改 Schema／Prompt 或放开 Executor。

| 需改的合同／接线 | 实施要求 |
| --- | --- |
| `src/infrastructure/browser/browser-action-decision.ts`：`BrowserReadAction`、strict wire action enum／decoder、`BrowserReadDecisionInput`、模型 Prompt | 增加集合引用选择语义与独立候选集合／A-1 反馈；普通当前页 refs 不扩权。按实施时实际基线递增 context/action/prompt 版本，不预占新编号。 |
| `src/infrastructure/browser/browser-task-executor.ts`：`BrowserSkillReadInput`、`BrowserGenericReadResult`、动作分派 | 明确输入候选集合及输出所选集合引用；在普通当前目标分派之外识别新选择，不能绕过普通 stale-ref 拒绝。模型调用仍由原 Executor／整单账计费，选择本身不新增模型服务或重试。Browser 层不导入具体来源 Pack。 |
| `src/integrations/restaurant-search/native-restaurant-search.ts` 与 `src/domains/restaurant/contracts.ts:375–395` 的来源进度／诊断合同 | 由来源组合用既有 Pack 收集、校验并持久保留本流程观察集合；模型选择交回代码核对后调用受控 navigate。来源 read metadata 经既有 Event／Reducer 接纳，模型不写 State。来源进度字段与实际调用方／Fixture 同步，若影响持久 Schema 按其版本轴递增，不加旧路径兼容层。 |
| 地区页计数接线 | 现有 native 诊断在 368–375 行主要对 OPEN_LINK 计地区页；直接 NAVIGATE 必须显式在原额度内入账，禁止因事件名不同漏计，也不能与后续观察重复计数。第三页取样后的替代是第四页；原截止时间和页数不清零。 |

这是已观察集合选择所需的窄合同变化，不能冒称“现有动作已经支持”，也不扩展为 LOCATION／车站控件修复。来源 Pack、Guard 和站点文件仍不改；实际 caller／版本同步和真实本地 Chromium 验证属于后续实现切片。

### 10.3 离线验收增量与已批准范围

第 9.4 节新增 **G3**：用 D1 东京菜单→A1322→A132201 的实际观察次序，经生产观察形成集合，第二层取样后四页内直接换一次；恢复页访问为 0。**X3** 覆盖集合外、其他来源／流程、拼造 href 及普通 stale DOM ref 拒绝，并留合法集合内正常对照。缺失页面、坐标和新列表均明确为本地构造，不称网站 Replay；本批没有编写／运行这些测试。

N1–N4 优先复用固定 `2ada8a69` 的 `src/integrations/restaurant-search/directory-region-selection.test.ts` 中 `fixture()`，以及 `src/eval/restaurant/agent-loop/native-discovery-composition.test.ts` 的 `runScenario`／`sourcePages` 组合构造方式，扩展既有行为覆盖，不新建 Harness。控件修复 Q7-R／G 已撤回；不得拼造站码／类别码／URL 的反例约束保留。

ADR-0043 document revision 1.1 记录用户已批准、尚未实施；第 8 项未采纳待完整 DOM 后再议。ADR-0040／0042 正文及其历史状态不动。例 03 仍按第 9.7 节，原历史评价和人工 800 m 的证据边界不变。

### 10.4 本批核验与停止点

输入清单在原 43 项不变的基础上追加 5 项，现 **48 项**：固定来源进度合同、两个既有 fixture 构造文件、1b 报告和旧预算。新增 [stop1c.py](stop1c.py) 只读 Git blob 作摘录和算术，不执行产品、Pack、测试或外部服务。较慢 D2 时间戳首次按粗估差了 1 ms，已用实际 trace 更正为 87.501 秒，非产品失败。

纯文档核验见 [verification-1c.json](verification-1c.json) 与 [verification-1c.log](verification-1c.log)：SHA、原菜单引用、算术、合同位置、链接、月度索引、保护范围和 `git diff --check`。五门禁及产品红绿灯／Mock／Replay／Live Read-only／Controlled Live-write 全部 **NOT_RUN**。新增模型／Google／餐厅网站／Live／环境重跑全部 **0**；不读取或暂存 `.env`，`budget.json` 不变。产品／Runner／测试／Prompt／Schema／Gold／变体／Guard／站点／source-packs 与基线零差异；本次只修订文档、分析摘要及 ADR 批准记录，不声称运行通过或能力关闭。

仅提交推送 `codex/chore-phase3a-prime-f5-analysis`，**停在停止点 1c，不开始实现**。F1 合入 main 后，本分支再基于新 main 重放并保留双方 STATUS／DEVLOG／TEST-LOG／月度记录；本批不重放、不合并、不推送 main。
