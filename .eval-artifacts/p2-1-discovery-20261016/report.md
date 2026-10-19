# P2-1 第一段（第0–3项）

- Evidence status: exposed development diagnosis；非 Clean Baseline。
- 范围：前置收尾 → 发现探测工具 → 当前策略基线10次 → Proposed ADR-0042。第3项后停止，等用户批准ADR（变体已批准）；不执行第4–7项，不推送。
- 起点：按用户要求 `git pull --ff-only` 从3f7027d快进到025940c；复核E1收尾通过（evaluator@29/rubric@25），其13条历史越界证据缺口不回填。
- 比较决定：收集当前发现卡点的可重复基线，供ADR取舍；不是改进后交付验收。未改生产检索策略、Prompt、Schema、Gold、资格、半径或语义目标。
- 用户未提交的INDEX、两份产品设计草稿和三个演示文件不纳入。

## 0 前置收尾

- 正式观察器迁至 `src/eval/restaurant/agent-loop/post-body-audit.mjs`，原文件退役；Chromium与Evaluator测试及当前外层调用方更新，无兼容副本。记录仅类型与请求体SHA，原始值不入日志，准入不变。
- Chromium测试不再读取产物脚本或reviewed-reads文件，使用显式独立fixture语法；增加首个本地响应3250ms延迟重现旧3秒上限。有效红灯 `00-prerequisites/red-receiver-latency.log`：Failed to fetch；修复仅测试请求/导航上限15秒。
- 迁移首轮默认测试暴露另一导入调用方遗漏，日志 `parallel-npm-test.log` 已保留，修复后完整复验。
- 持续两个本地CPU负载进程并行、同时运行npm test，目标用例连续5次绿：`parallel-load-green-1.log` 至 `5.log`。资源均在finally回收。
- 本批外层配置 `outer/`，以P2-0已审核只读规则与E1的0交付补见证逻辑原样复制，未新增任何放行形状；观察器、见证GET逻辑、审核清单、配置SHA记录于 `outer/freeze.json`。执行时另记实际提交SHA；本段不启动整单Live，后半段按其批准的变体/见证完成整单外层配置。
- 五门禁全绿：typecheck、arch:check、build；npm test926/926；test:browser:fixture113/113（221.794秒）。日志与连续负载结果见 `00-prerequisites/gates.json`。提交号由第1项冻结记录引用，避免提交自引用。

## 1 发现探测工具

- Runner：`src/eval/restaurant/agent-loop/runners/run-discovery-probe.ts`；指标与第一批驱动：`discovery-probe.ts`。只调用生产`createLiveReadAssembly`及每个计划来源的一次`search`，不构造查位/事实/交付动作，不恢复第二批详情。原生产检索策略未修改，Pack代码净变更0行。
- 精确输入：最近Live的actual intent/proposal与实际Google地点上下文，从已暴露22条校准包中按原始/gzip SHA校验提取；只将权威date移到批准变体日期。所有非date字段保留，包括原target query中的旧日期文字，不拿Gold替换`kaiseki restaurant`或`tempura restaurant`。日期值以结构字段为准；本段检索尚不使用日期筛选。
- 6份输入与10次计划见`inputs/index.json`、`baseline-plan.json`；独立字面量核对全部criteria，非date字段逐字段相等。正式变体SHA `94d1383d71e6b1e4f589a7ceaab99826ec7a2a0aaa8bf38de8dd52d84d4ad4e7`。本段地点解析不再调用模型，固定最近实际中心/1000m；不把历史估计中心替换成新的锚点。
- 指标由eval计算：source-funnel绑定列表URL中的来源ID、实际进入首批详情的ID、独立坐标距离；全国/启动页不记发现成功，跨来源同ID不合并身份。后续预算中断不能抹去已观察列表，未知坐标不能算半径内；部分失败的半径内计数注明下界。检索无完成列表时解析数/显示总数为null，不填0。
- 第一批、失败调用计入共享15次上限、未到达来源、无查位/事实调用/预约页导航均有同一生产组装+Guard受控来源测试。真实浏览器语义复用完整Chromium门禁，不把受控来源测试称为真实站点证明。
- `arch:check`新增生产→本项探测/见证模块与产物见证文件的依赖拒绝（含type/dynamic import）；保留现有Web产物端口，不扩大到所有eval引用。实际临时生产import挑战触发arch红灯并删除挑战，修复后绿；不会把新见证给生产或模型。
- 六个CLI离线空跑设置fetch禁止，全部PASS/0模型/0网络。有效红灯：`red-production-eval-boundary.log`、`red-arch-command.log`；定向4/4。五门禁：typecheck、arch、npm test930/930、build、Chromium113/113（222.107秒）。之后仅补eval指标保留，最终四条门禁复验930/930；一次沙箱localhost EPERM日志保留，改宿主权限后通过，无产品修复。
- 冻结配置及输入/工具/认证脚本SHA见`probe-freeze.json`，执行记录另留实际提交SHA；第0项提交`6924e0b`，审批合并`218e28d`。第1项提交将由基线开始记录引用。


## 2 基线探测

- 第1项工具提交 `260522e`，冻结见 `execution-freeze.json` / `baseline-freeze.json`。
- 认证UTC 2026-10-16T15:05:55.833Z—2026-10-16T15:06:42.990Z：32次公开GET（16详情＋16四参数库存），模型/Google/整单Live均0。每例认证后有效24小时。全部16原登记店保留，13家合格：h001 2、神乐坂2、KF-H005 1、吉祥寺3、H002 3、中目黑2。未通过的具体原因见登记文件，不把它们当无位。
- 原始库存、最小化店铺JSON-LD/原登记quote当前匹配与源字节SHA、逐店日期/人数回声校验见`witness-certification/`和`witnesses.certified.json`；全部原始库存的base_date与members独立符合请求，不以请求参数自证。未保留整页review/profile，不能静态重建完整页面。
- 批准和输入同步在真实基线请求前完成。10fd06f已同步：用户2026-10-16 22:44批准variants.yaml；除头注外逐字相同。六份输入未提交/未执行时仅更新批准来源与SHA，不改实际语义字段或日期。ff-only因本地第0项提交分叉而失败，正常合并保留6924e0b。

## 3 ADR-0042

草案已写为 [ADR-0042](../../docs/decisions/0042-agent-planned-discovery-and-search-availability-hints.md)，状态 Proposed / draft, not integrated。Planner仍决定来源顺序；Agent拟选择短词/已观察类别/组合/通用列表；代码核对格式、地区、权威日期人数。稀疏/明确空状态可在详情前每来源最多改写2次；提议地区4页、检索3页，总计最多7个列表文档，原来源90秒与全局500秒/50调用不提高。搜索级筛选选择Pack URL语法并核对页面应用状态，未应用或空时回退，不形成空位或交付证据。

ADR-0037只追加了有条件的Proposed部分替代说明，原文逐字保留；ADR索引、Capability Matrix（能力不升级）、既有Harness场景目录同步。根AGENTS.md是规则入口，没有场景清单，本段不新增重复清单。未经用户批准不实施第4–7项。

## 用量与边界

本段整单Live上限0；基线探测上限10次（TARGET各2、CONTROL各1），单次15模型／180秒，基线模型上限150；全批30探测／450模型上限不扩大。源页面与四参数GET见证认证不调用模型。不打开预订表单、不点时段、不支付或填个人信息；S0立即停止，产物压缩超过60MB停止报告。

### 启动前接线修正（0模型，基线尚未运行）

第一次预检在0ms即PREFLIGHT_DEEPSEEK_CONFIGURATION：Runner把artifactDirectory对象放进runLivePreflight的环境位置，既有密钥没有被传入；未发出HTTP或模型请求，未启动浏览器或来源读取。原日志、started和预检JSON保留在`baseline/p2-kf-h001-20261027/attempt-1/`。

源码冻结检查正确拒绝未提交CLI测试；该失败不算接线反例。曾尝试移除该重复检查，但自动审批以削弱防篡改边界拒绝，未执行；最终Runner和外层检查全部保留。改为测试CLI实际使用的有类型预检初始化函数，使用离线HTTP传输，红灯为DEEPSEEK配置失败（仅1个FAILED），绿灯为前三个REACHABLE、第四个受控停止，并核对fake鉴权和产物目录；不是生产网络探测。有效证据`red-preflight-environment.log` → `preflight-targeted-preflight-corrected.log`。

修正仅eval预检接线，未改变发现模型输入/策略/预算/圈域/资格。最终typecheck/arch/build和npm test931/931通过；浏览器/Guard/Source Pack/组装代码未变，复用113/113日志。原冻结清单逐字存`baseline-freeze.preflight-initial.json`，首次真实模型请求前重新冻结为`baseline-freeze.json`（@2），更改点明确登记。第1次预检配置中断保留为未启动，补跑不增加计划10次或150模型上限；替换输出另存，不覆盖旧目录。


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

## 第一段收尾

- 第0项 `6924e0b`；批准文件合并 `218e28d`（远端 `10fd06f`）；第1项 `260522e`；认证与启动前配置 `f9df634`；0模型预检接线修正 `0a25cae`。十次真实探测统一运行于完整SHA `0a25cae7d53cffc5ad71c07ce221f149aa2ce450`，active配置为 `baseline-freeze.json` @2。原始@1冻结保留，不覆盖。
- 第2项完成10/10：四个TARGET各2次，认证见证来源ID进列表0/8、进首批详情0/8；H002 CONTROL为true/false，中目黑CONTROL为false/false。这里仅是发现探测，不给出QUALIFIED_DELIVERY或CAPABILITY_MISS端到端分数。Google结构化候选不按名称自动合并成Tabelog见证。
- 中目黑限制：Tabelog模型选择Meguro & Shirogane & Gotanda → Meguro → Meguro Sta.，列表20→20→15→15，未读任何详情，第4次模型调用TIMEOUT（10008ms），来源EXTRACTION_FAILED；TableCheck后续BROWSER_TIMEOUT。以上是当前记录的路径和阻断，不确认因果、不修复，不宣称CONTROL通过或不退化；后续A/B应以此实际基线逐项比较。
- 本段模型86次（84成功＋2失败，失败已计入），86条decisions；Google业务请求15次。真实探测10次，另1次未发HTTP/模型的预检接线中断保留，不当作能力失败后重跑。能力失败均未重跑。
- 用量：当前基线86/150；本批探测额度86/450；本批总模型86/1650（阶段总额4000，本轮贡献86，不套用旧第一阶段1500分母）。见证认证32个GET另列。整单Live新增0，无查位、交付、预约或支付；第7项尚未运行。预检HTTP不混作Google业务请求或模型调用。
- 最终代码门禁：typecheck/arch:check/build PASS，npm test931/931；真实本地Chromium113/113（222.107秒）。见 `01-probe-tool/preflight-corrected-gates.json` 与同目录日志；最后接线修正仅eval环境转发，浏览器/Guard/来源/组装未变，复用既有完整Chromium绿灯。文档与离线报告后不重复付费/Live验证。
- 十次独立规则只读审计均ABSENT、gaps=0，未触发S0停止；保留ADR-0036未知GET副作用不完全可证明的边界，不宣称任意网站或写操作安全。S0声明未评（本段无展示）。
- 独立产物核对 `baseline-verification.json`：summary与decisions SHA、86条调用/决策相等、trace存在与SHA、recording文件存在；全部10次均DISCOVERY_PROBE_ONLY，输入及冻结文件SHA保持。`summarize-baseline.py`只离线生成表和核对，不访问网络或模型。
- 第3项ADR-0042为Proposed；ADR-0037原始字节前缀完整保留，只追加有条件提案说明。文档矩阵检查链接、命令、权威一致性与diff。原有INDEX、产品设计草稿和三个演示文件未纳入提交。本地提交后停止，等待用户批准ADR；不推送、不执行第4–7项。
- 收尾核对见 `first-segment-verification.json`；原始产物逐文件SHA见 `artifact-manifest.json`。全目录逐文件gzip压缩估算约10.7 MB，低于60 MB停止线；这是估算而非另造可回放压缩包。

## 2026-10-17 corrected source metrics (offline)

TableCheck: ENV_FAILURE in all ten probes (independent-review.md supplement). Google not reached in h001 #1 and Kichijoji #1 is the same environmental effect. Original JSON/trace/decisions remain unchanged. Google exact witness website IDs are credited separately; names are unconfirmed. The old aggregate 0/8 TARGET conclusion is superseded by this source-specific table, not a normal-network capability baseline.

| Probe | Tabelog witness | TableCheck | Google exact website ID | Unconfirmed names |
| --- | --- | --- | --- | --- |
| p2-kf-h001-20261027 #1 | false | ENV_FAILURE | NOT_REACHED (ENV) | 0 |
| p2-kf-h001-20261027 #2 | false | ENV_FAILURE | true | 35 |
| p2-kagurazaka-kaiseki-20261029 #1 | false | ENV_FAILURE | false | 13 |
| p2-kagurazaka-kaiseki-20261029 #2 | false | ENV_FAILURE | false | 13 |
| p2-kf-h005-20261029 #1 | false | ENV_FAILURE | false | 8 |
| p2-kf-h005-20261029 #2 | false | ENV_FAILURE | false | 8 |
| p2-kichijoji-tempura-20261027 #1 | false | ENV_FAILURE | NOT_REACHED (ENV) | 0 |
| p2-kichijoji-tempura-20261027 #2 | false | ENV_FAILURE | true | 9 |
| p2-kf-h002-20261031 #1 | true | ENV_FAILURE | false | 17 |
| p2-nakameguro-yakiniku-20261030 #1 | false | ENV_FAILURE | true | 13 |

Evidence: followup/baseline-recomputed.json; models=0, business network requests=0.


## 2026-10-19 TableCheck shared transport and restored baseline

Current exposed-development discovery baseline: [network-restored-20261019/report.md](network-restored-20261019/report.md), frozen source `acfaaffa73db97413f6538f161c4e837ec64316e`. All10 formal probes completed,55 models and30 Google (19 formal +11 source readiness),0 complete Live. One preflight-only ENV was preserved and safely resumed under explicit human approval, no formal retries. Six-case witnesses were re-certified first (32 public GETs,13/16 certified). Prior baseline/diagnostics remain historical, not overwritten. P2-1a rebased source `39fc15e` is source-delta equivalent to original3094193 atop the shared fix; five gates940/940 and Chromium116/116 passed. New baseline awaits independent review before checkpoint A. Cumulative discovery20/40 probes,141/450 model calls,45 Google. Metrics and scope limitations are explicit in the linked report and baseline-audit.json; no qualification/availability/complete-Live signoff inferred.


## 2026-10-19 Checkpoint A — stopped by preflight limit

[Checkpoint A report](checkpoint-a-20261019/report.md):1/10 formal probes completed on frozen39fc15e. H001 #2 had two TableCheck preflight EMPTY_RESULT failures with0 models/formal start; together with baseline1, total3 exceeded approved2 and stopped the batch. H001 #1 reported native listing true from broad navigation lists; final keyword3 and first details unchanged, no overall efficacy conclusion. New4 models/5 Google, cumulative145/450 models、21/40 probes、50 Google. Remaining9 A, after-A Google-only nearby fix and P2-1b are unstarted; no full Live. Push partial evidence and stop.


## Corrected checkpoint A (2026-10-19)

修正A10在干净209ac42全部完成，外层ee6ebd0／315冻结SHA通过；10次来源非空预检READY，0补试／0正式重跑／0计数失败，正式trace独立S0_BOUNDARY全ABSENT（不推断未知GET无副作用）。新增53模型／53成功决策、19正式Google＋10预检Google；累计198/450模型、31/42探测、79Google、0整单Live。

与acfaaffa同序输入的10次基线比较：Tabelog列表见证1→8／首批0→3；TableCheck列表与首批均0→0；Google精确官网ID5→3（名称线索不计）。列表含宽地区导航，不能当最终改写成功；页面内14次规划类别仍全0，本地提取7个原始锚点与Chromium机制绿灯不能证明真实页面类别扩展有效。总模型55→53，总时长788353→1062253ms；24规划调用52395ms、0超时。两项READ_BUDGET_EXCEEDED及CONTROL候选减少按原记录报告，不归因为某项修复。

逐例比较、来源序列、实际接受历史、页数、半径、规划时间、capture／trace／recording SHA及四层评价限制见checkpoint-a-corrected-20261019/report.md、comparison.json、audit.json。807份历史文件字节不变，旧A1缺陷版本不参与比较且用量保留；录制状态不冒称Replay。源码不变复用五门禁942/942、真实Chromium117/117，另验纯文档链接、JSON、diff与预算。A后只做独立Google-only nearby局部修复，不开始P2-1b／完整Live。

[Full paired report](checkpoint-a-corrected-20261019/report.md)

Google-only nearby correction was implemented separately after A, with no additional real calls: [evidence and final gates](checkpoint-a-corrected-20261019/nearby/report.md).

Final local source commit: `ea7113ada8ea26ccbbd40537fcd4b36e946c7a0e`; [commit roster / handoff](checkpoint-a-corrected-20261019/handoff.json).


## 2026-10-19 HARD 检索修正与 P2-1b / 检查点 B（停批）

用户批准38b058e复核建议及探测52上限（模型450不变）。HARD修正884c56b、P2-1b生产4975f9f、B配置冻结c20001a分别提交。两项先红后绿；最终五门禁 typecheck/arch/build PASS、948/948默认测试、119/119真实本地Chromium；资格不变。检索Prompt@4/Schema@1；新公开GET参数、Recorder、独立审计同步。来源专用生产代码净增54行，未认证阶段通用性退出条件。

B仅完成3/10发现探测：h001两次和神乐坂第1次；3条原始网络审计均ABSENT，17条决策=17模型。神乐坂第2次的首页预检与唯一预检重试均为TableCheck HTTP503、0模型/未正式启动；沿用A的1次预检失败后累计3次，触发冻结PREFLIGHT_FAILURE_LIMIT，剩余7次未跑。H002只获离线组合验证，B未到达；不能声明B10或完整交付通过。

新增17模型、3正式发现、6正式Google+3预检Google；累计278/450模型、44/52探测、117Google。0完整Live，见证仍有效未额外认证；无运行中修复，旧输入/见证/录制不改。[完整报告与逐例路径](checkpoint-b-20261019/report.md)、[原始审计](checkpoint-b-20261019/audit.json)、[冻结](checkpoint-b-20261019/freeze.json)。按用户授权推送后停下待独立复核。


## 检查点 B 三项修正与启动准备中断（2026-10-19；复核4592a1e）

修复提交a37e152：同地区首页筛选、稀疏有类别时禁止KEEP（Schema@2/Prompt@5）、TableCheck筛选SKIPPED/FILTER_TRANSPORT_NOT_REVIEWED。五门禁全绿：951/951默认测试、119/119本地Chromium，其余typecheck、arch、build通过。TableCheck三份原录制显示搜索错误并有未审核open_from/open_until预检被拒绝，离线诊断0网络/模型；不是正常无餐厅。

编排冻结3c4d241，322项SHA、17离线对照及6输入解析通过。第一次启动因漏部署同SHA审核文件，在预检前ENOENT退出；新B正式0/10，新增网络0、模型0。文件已补齐，原外层停止未清除。最小恢复补丁与10项离线准入正反例已准备，按Eval Skill§5等待用户批准重冻后继续。旧B三次标为B第一版，保留并排除比较；先前h001 #2跳过原因更正为QUERY_NOT_REPRESENTABLE。模型278/450、探测44/55、Google117，完整Live0；与A的新十对比较目前全部NOT_REACHED。

详见[修正报告](checkpoint-b-corrected-20261019/report.md)、[有效红绿和五门禁](checkpoint-b-corrected-20261019/fixes/verification.json)、[恢复补丁](checkpoint-b-corrected-20261019/recovery/outer-setup-restore.proposed.patch)、[启动0调用证据](checkpoint-b-corrected-20261019/recovery/setup-proof.json)。尚未推送本轮提交，待恢复完成后按用户授权推送。


## 修正检查点 B 按环境停止规则结束（2026-10-19 北京21:00）

三项代码修正a37e152已完成，五门禁951/951默认、119/119真实本地Chromium、typecheck/arch/build全绿；原红绿日志保留。初始冻结3c4d241因漏部署审核文件出现一次0调用启动准备失败，用户批准精确恢复补丁，17外层＋10恢复准入对照通过后于ae9288e重冻。生产、同六输入和预算不变；新329项SHA包含实际部署文件，旧冻结和原失败保留。

恢复后，北京20:49:03开始预检，TableCheck首页HTTP503；按规则等到20:59:43才用唯一一次预检重试，距首次结束627.529秒，仍HTTP503。外层记录TABLECHECK_503_PERSISTED_AFTER_RETRY，检查点失败数2、起点0，未跨A/B累计。DeepSeek200、Tabelog200、公共Google连通性404（不是Places搜索），TLS均建立；根因未证实，不猜VPN或限流。没有启动正式发现、没有生成调用或Google搜索；原始网络预检元数据和时间戳均保存。

新B0/10，全部NOT_REACHED，不作改进／退步或S0通过结论；没有正式Agent结果可交diagnostic evaluator。与A的十行数据和资源逐项保留，H002单列HARD修正组，其他九行P2-1b组合；旧B第一版三次仍排除新比较且计入总预算。新增模型0、正式探测0、正式/数据预检Google0；累计278/450模型、44/55探测、117Google、0新增完整Live。按预定规则停止，不再启动后续九项或额外补试。

[最终报告](checkpoint-b-corrected-20261019/report.md)、[十行对照](checkpoint-b-corrected-20261019/comparison.json)、[时间线和raw SHA](checkpoint-b-corrected-20261019/preflight-timeline.json)、[评价范围](checkpoint-b-corrected-20261019/evaluation-status.json)、[账本](checkpoint-b-corrected-20261019/ledger.json)。模型/浏览器录制均未创建，未伪造产物。源五门禁复用，最终只追加观察与文档并核验冻结/历史SHA、JSON、链接和diff。用户已授权完成后推送，结果以Git回执为准；随后停止待独立复核与环境恢复安排。


## 用户追加20分钟后网络预检（2026-10-19 北京21:30）

UTC13:30:16–13:30:27独立预检通过：TableCheck206、Tabelog200、DeepSeek200、Google公开根路径404（原冻结规则认可可达）。0模型、0Google搜索、0正式探测；只证明网络可达，不证明搜索非空或B功能。原两次503与停止账本保持，修正B仍0/10。累计278/450模型、44/55探测、117 Google、0完整Live。详情和原始result见[修正B追加预检结果](checkpoint-b-corrected-20261019/report.md)。


## User-requested B continuation: ENV_FAILURE (Beijing22:40)

After the successful21:30 network-only recheck, the user requested immediate continuation. The outer2f088b8 preserved both previous503 failures. AtUTC14:40:32 the unchanged Runner received another503 from TableCheck homepage; network preflight failed before source-nonempty search checks or formal discovery. Counter3 triggered PREFLIGHT_FAILURE_LIMIT; no retry. Corrected B0/10,0 new models/Google searches/probes; cumulative278/450 models,44/55 probes,117Google,0fullLive. [Report and raw paths](checkpoint-b-corrected-20261019/report.md).
