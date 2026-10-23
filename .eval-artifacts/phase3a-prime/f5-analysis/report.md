# F5 找店超时分析与修复方案

- Evidence status: exposed development diagnostic；draft / not integrated；不是 Clean Baseline。
- 分析日期：2026-10-24，北京时间。
- 工作分支：`codex/chore-phase3a-prime-f5-analysis`；从已批准停止点 0 的 `main / 2ada8a69a3071740423745e581c3b6ae30d9a1bd` 创建。
- 依据：[已批准指令批次 1 对话 B](../CODEX-3A-PRIME.md)、[停止点 0 批准补充](../main-check/report.md#7-停止点-0-复核补充2026-10-24-0020-北京)。
- 历史执行证据固定于 `3ec38584555b5271b72b79f954179769e92ff9f6`，不依赖其他工作区的未提交内容。

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

**输入差异必须保留。** C03-1/C03-2/C09 的实际语义和决策写的是 **near Kudanshita**，不是原候选地点 Ichigaya。指令中例 03 写 Ichigaya、备用 Kudanshita。历史分析依据已执行的 Kudanshita；下一批变体和 Live 是否仍采用 Ichigaya，要在冻结输入时由复核明确，不能沿用这两个耗时声称同输入改善。[case03-attempts.json](case03-attempts.json) 保留补跑、中断、未到达的原始分类。

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

C03-1 于 UTC 05:34:31.982 起保存决策，最后一行开始于 05:39:00.127；外层 finish 为 `SIGKILL / PARALLEL_FALLBACK_ENV_FAILURE`，结束在 05:39:51.223。它的 29 次调用和约 268 秒的决策开始时刻跨度可确认；缺完整 trace/result，无法还原每个来源的实际执行耗时。不得用相邻决策间隔填成正常耗时，亦不将该次判为找店能力失败。原始 finish 和安全评价均保留。[case03-attempts.json](case03-attempts.json)、decisions 中 `case03-h03-interrupted` 行。

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

两者都是供复核选择的设计，尚未实施。均保持模型选择观察到的入口/检索意图，代码核对观察归属、权威地点、真实坐标、既有预算和身份/HARD/库存；都需要新的窄 ADR 明确修改 ADR-0040/0042 的既有决策，不能静默改历史决策或只放宽测试。

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

**建议优先评审 B。** 它直接处理“没有具名地区标签就无法开始有效检索”，同时有机会减少 C03 的通用列表误投。A 对坐标恢复有价值，但眼下缺错误区域的详情材料且不触及 C03 主耗时。不同时实施两套路线，不在 F5 顺带修改名称解析或日历 Guard。

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
