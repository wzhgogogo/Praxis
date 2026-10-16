## 基线逐次结果（发现探测）

列中的原生为列表后详情读取确认坐标的候选，Google为结构化搜索返回坐标后独立算距的候选；没有新增Google Place Details调用，后者不能声称完成了门店页面详情/身份读取。跨来源不合并身份，不把Google候选名称推断为Tabelog认证ID。

| 探测 | 见证进列表 / 进首批详情 | 半径内计数 | 页数 | 模型 / Google | 探测 / 含预检墙钟ms | 终止 / 来源失败 | 原始指标 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| p2-kf-h001-20261027 #1 | false / false | 1（原生1/Google0） 下界 | 3 | 10 / 0 | 180007 / 192024 | DISCOVERY_PROBE_TIMEOUT / BROWSER_ABORTED | [attempt-1-after-config-fix](baseline/p2-kf-h001-20261027/attempt-1-after-config-fix/probe-summary.json) |
| p2-kf-h001-20261027 #2 | false / false | 34（原生1/Google33） | 4 | 1 / 2 | 82650 / 94059 | ALL_PLANNED_FIRST_BATCHES_ATTEMPTED / BROWSER_TIMEOUT | [attempt-2](baseline/p2-kf-h001-20261027/attempt-2/probe-summary.json) |
| p2-kagurazaka-kaiseki-20261029 #1 | false / false | 40（原生0/Google40） | 5 | 12 / 2 | 128941 / 136990 | ALL_PLANNED_FIRST_BATCHES_ATTEMPTED / BROWSER_TIMEOUT,BROWSER_TIMEOUT | [attempt-1](baseline/p2-kagurazaka-kaiseki-20261029/attempt-1/probe-summary.json) |
| p2-kagurazaka-kaiseki-20261029 #2 | false / false | 40（原生0/Google40） | 4 | 10 / 2 | 126149 / 135367 | ALL_PLANNED_FIRST_BATCHES_ATTEMPTED / DISCOVERY_SOURCE_LOCATION_UNGROUNDED,BROWSER_TIMEOUT | [attempt-2](baseline/p2-kagurazaka-kaiseki-20261029/attempt-2/probe-summary.json) |
| p2-kf-h005-20261029 #1 | false / false | 40（原生0/Google40） | 4 | 5 / 2 | 81307 / 87606 | ALL_PLANNED_FIRST_BATCHES_ATTEMPTED / BROWSER_TIMEOUT | [attempt-1](baseline/p2-kf-h005-20261029/attempt-1/probe-summary.json) |
| p2-kf-h005-20261029 #2 | false / false | 40（原生0/Google40） | 4 | 5 / 2 | 66162 / 75305 | ALL_PLANNED_FIRST_BATCHES_ATTEMPTED / BROWSER_TIMEOUT | [attempt-2](baseline/p2-kf-h005-20261029/attempt-2/probe-summary.json) |
| p2-kichijoji-tempura-20261027 #1 | false / false | 0（原生0/Google0） 下界 | 6 | 14 / 0 | 180014 / 191254 | DISCOVERY_PROBE_TIMEOUT / BROWSER_TIMEOUT,BROWSER_ABORTED | [attempt-1](baseline/p2-kichijoji-tempura-20261027/attempt-1/probe-summary.json) |
| p2-kichijoji-tempura-20261027 #2 | false / false | 40（原生0/Google40） | 4 | 12 / 2 | 116450 / 123360 | ALL_PLANNED_FIRST_BATCHES_ATTEMPTED / DISCOVERY_SOURCE_LOCATION_UNGROUNDED,BROWSER_TIMEOUT | [attempt-2](baseline/p2-kichijoji-tempura-20261027/attempt-2/probe-summary.json) |
| p2-kf-h002-20261031 #1 | true / false | 22（原生2/Google20） | 5 | 3 / 1 | 127730 / 139106 | ALL_PLANNED_FIRST_BATCHES_ATTEMPTED / BROWSER_TIMEOUT | [attempt-1](baseline/p2-kf-h002-20261031/attempt-1/probe-summary.json) |
| p2-nakameguro-yakiniku-20261030 #1 | false / false | 34（原生0/Google34） | 7 | 14 / 2 | 151268 / 158600 | ALL_PLANNED_FIRST_BATCHES_ATTEMPTED / EXTRACTION_FAILED,BROWSER_TIMEOUT | [attempt-1](baseline/p2-nakameguro-yakiniku-20261030/attempt-1/probe-summary.json) |

### p2-kf-h001-20261027 #1

- 检索序列：tabelog: omakase [20/36] → tabelog: omakase [3/3] → tabelog: omakase [3/3] → tablecheck: omakase [未知/未知]。
- 未到达来源：google-places；独立只读审计：ABSENT，gaps=0；录制：NOT_REPLAYABLE。
- 原始指标完整保留于 [probe-summary.json](baseline/p2-kf-h001-20261027/attempt-1-after-config-fix/probe-summary.json)，决策 [probe.decisions.jsonl](baseline/p2-kf-h001-20261027/attempt-1-after-config-fix/probe.decisions.jsonl)；trace与recording同目录。

### p2-kf-h001-20261027 #2

- 检索序列：tabelog: omakase [20/36] → tabelog: omakase [3/3] → tabelog: omakase [3/3] → tablecheck: omakase [未知/未知] → google-places: omakase [未知/未知]。
- 未到达来源：无；独立只读审计：ABSENT，gaps=0；录制：REPLAYABLE。
- 原始指标完整保留于 [probe-summary.json](baseline/p2-kf-h001-20261027/attempt-2/probe-summary.json)，决策 [probe.decisions.jsonl](baseline/p2-kf-h001-20261027/attempt-2/probe.decisions.jsonl)；trace与recording同目录。

### p2-kagurazaka-kaiseki-20261029 #1

- 检索序列：tabelog: kaiseki restaurant [0/未知] → tabelog: kaiseki restaurant [0/未知] → tabelog: 无关键词（类别/通用列表，按URL） [20/10368] → tablecheck: kaiseki restaurant [未知/未知] → google-places: kaiseki restaurant [未知/未知]。
- 未到达来源：无；独立只读审计：ABSENT，gaps=0；录制：NOT_REPLAYABLE。
- 原始指标完整保留于 [probe-summary.json](baseline/p2-kagurazaka-kaiseki-20261029/attempt-1/probe-summary.json)，决策 [probe.decisions.jsonl](baseline/p2-kagurazaka-kaiseki-20261029/attempt-1/probe.decisions.jsonl)；trace与recording同目录。

### p2-kagurazaka-kaiseki-20261029 #2

- 检索序列：tabelog: kaiseki restaurant [0/未知] → tablecheck: kaiseki restaurant [未知/未知] → google-places: kaiseki restaurant [未知/未知]。
- 未到达来源：无；独立只读审计：ABSENT，gaps=0；录制：NOT_REPLAYABLE。
- 原始指标完整保留于 [probe-summary.json](baseline/p2-kagurazaka-kaiseki-20261029/attempt-2/probe-summary.json)，决策 [probe.decisions.jsonl](baseline/p2-kagurazaka-kaiseki-20261029/attempt-2/probe.decisions.jsonl)；trace与recording同目录。

### p2-kf-h005-20261029 #1

- 检索序列：tabelog: local food [2/2] → tabelog: local food [0/未知] → tabelog: local food [0/未知] → tablecheck: local food [未知/未知] → google-places: local food [未知/未知]。
- 未到达来源：无；独立只读审计：ABSENT，gaps=0；录制：REPLAYABLE。
- 原始指标完整保留于 [probe-summary.json](baseline/p2-kf-h005-20261029/attempt-1/probe-summary.json)，决策 [probe.decisions.jsonl](baseline/p2-kf-h005-20261029/attempt-1/probe.decisions.jsonl)；trace与recording同目录。

### p2-kf-h005-20261029 #2

- 检索序列：tabelog: local food [2/2] → tabelog: local food [0/未知] → tabelog: local food [0/未知] → tablecheck: local food [未知/未知] → google-places: local food [未知/未知]。
- 未到达来源：无；独立只读审计：ABSENT，gaps=0；录制：REPLAYABLE。
- 原始指标完整保留于 [probe-summary.json](baseline/p2-kf-h005-20261029/attempt-2/probe-summary.json)，决策 [probe.decisions.jsonl](baseline/p2-kf-h005-20261029/attempt-2/probe.decisions.jsonl)；trace与recording同目录。

### p2-kichijoji-tempura-20261027 #1

- 检索序列：tabelog: tempura restaurant [0/未知] → tabelog: tempura restaurant [0/42] → tabelog: restaurant [0/3] → tabelog: restaurant [1/1] → tabelog: 无关键词（类别/通用列表，按URL） [0/139442] → tablecheck: tempura restaurant [未知/未知]。
- 未到达来源：google-places；独立只读审计：ABSENT，gaps=0；录制：NOT_REPLAYABLE。
- 原始指标完整保留于 [probe-summary.json](baseline/p2-kichijoji-tempura-20261027/attempt-1/probe-summary.json)，决策 [probe.decisions.jsonl](baseline/p2-kichijoji-tempura-20261027/attempt-1/probe.decisions.jsonl)；trace与recording同目录。

### p2-kichijoji-tempura-20261027 #2

- 检索序列：tabelog: tempura restaurant [0/未知] → tablecheck: tempura restaurant [未知/未知] → google-places: tempura restaurant [未知/未知]。
- 未到达来源：无；独立只读审计：ABSENT，gaps=0；录制：NOT_REPLAYABLE。
- 原始指标完整保留于 [probe-summary.json](baseline/p2-kichijoji-tempura-20261027/attempt-2/probe-summary.json)，决策 [probe.decisions.jsonl](baseline/p2-kichijoji-tempura-20261027/attempt-2/probe.decisions.jsonl)；trace与recording同目录。

### p2-kf-h002-20261031 #1

- 检索序列：tabelog: 无关键词（类别/通用列表，按URL） [20/139442] → tabelog: 无关键词（类别/通用列表，按URL） [20/6251] → tabelog: 无关键词（类别/通用列表，按URL） [20/2658] → tabelog: 无关键词（类别/通用列表，按URL） [20/5031] → tabelog: 无关键词（类别/通用列表，按URL） [20/5031] → tablecheck: 无关键词（类别/通用列表，按URL） [未知/未知] → google-places: 通用 [未知/未知]。
- 未到达来源：无；独立只读审计：ABSENT，gaps=0；录制：NOT_REPLAYABLE。
- 原始指标完整保留于 [probe-summary.json](baseline/p2-kf-h002-20261031/attempt-1/probe-summary.json)，决策 [probe.decisions.jsonl](baseline/p2-kf-h002-20261031/attempt-1/probe.decisions.jsonl)；trace与recording同目录。

### p2-nakameguro-yakiniku-20261030 #1

- 检索序列：tabelog: yakiniku [20/2872] → tabelog: yakiniku [20/51] → tabelog: yakiniku [15/15] → tabelog: yakiniku [15/15] → tablecheck: yakiniku [未知/未知] → google-places: yakiniku [未知/未知]。
- 未到达来源：无；独立只读审计：ABSENT，gaps=0；录制：NOT_REPLAYABLE。
- 原始指标完整保留于 [probe-summary.json](baseline/p2-nakameguro-yakiniku-20261030/attempt-1/probe-summary.json)，决策 [probe.decisions.jsonl](baseline/p2-nakameguro-yakiniku-20261030/attempt-1/probe.decisions.jsonl)；trace与recording同目录。

### 指标与证据限制

- `retrievalAttempts.keyword` 在原关键词被移除时会回填计划关键词；表中检索序列另按原始URL参数解码明确写为无关键词，原JSON不覆盖。Google没有浏览器listingObservations，原JSON解析数量为null；来源返回候选数与独立半径计数另列，不能把null说成零。
- 原生结果页的解析数/页面总数完整保留；未知、超时或未到达不等于明确空状态或来源穷尽。受控Fixture证明组装和指标路径，不能替代本表当前网站证据。
- 页数沿用生产来源漏斗；Google按生产continuation页数记录，浏览器导航/快照原始trace另存，不把页数当完整网络请求数。
- 超时取消点配置180000ms；耗时包括取消与回收开销，超过的毫秒数按实际保留，不声称墙钟严格小于180秒。
- 录制按既有安全策略最小化，NOT_REPLAYABLE的具体原因保留；不能据此声称可静态重建。
- 四层口径：端到端交付NOT_APPLICABLE（未运行）；逐环节只评发现见证与坐标观测，语义/查位/事实/HARD/交付未评；S0声明NOT_APPLICABLE（无展示），S0越界按独立规则审计逐次报告，未知GET副作用仍为既有证明限制；归因仅记录可观察的检索与超时卡点，不把系统原因码升级为已确认根因。
