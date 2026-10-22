# 团体人数与时间窗：六次无交付的离线诊断

Evidence status: **superseded retrospective / exposed diagnostic**。只读分析用户指定的六次已保存运行；不改产品、Prompt、Schema、Guard、评测输入或已有产物，不访问网站、不调用模型。本报告用于决定先修什么，不是新的 Live、回放或自动评分。

**共同的最早缺口是发现来源覆盖不足，不能统称为“≥5 人选择器坏了”。** 15 个“见证店 × 运行”对应全部未被确认进入候选，原始已录 HTML 中也没有这些店号。五次完全没有到达 Tabelog；c-18 到第 340 秒才第一次观察 Tabelog 页面、第 399 秒才返回四家候选。两次早期开发运行另被 10 秒 Agent 决策超时直接中断；其余三次进入结束保留窗口，一次耗尽 500 秒。

各机制可由原始轨迹和冻结代码确认；“修掉某机制便能交付”仍是 **HYPOTHESIS**：本轮按授权没有做修正输出注入或运行时反事实回放。

## 1 范围与证据索引

- 来源分支 `codex/chore-checkpoint-c-prep`，固定快照 `19941c4e8ce657a080130606a8cfbe031625558a`。本批在独立分支 `codex/chore-group-window-diagnosis` 写报告，不修改正在进行的其他工作树。
- c-04/c-08 采用 `checkpoint-c-rerun-20261021`，c-18 采用 `checkpoint-c-continuation-20261021`，均由后者的最终 [raw-results-manifest](../checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/raw-results-manifest.json) 引用。**不混入** `resume-20261021` 中同名但更早的 c-04。
- h-03/h-09/h-15 采用 `holdout-exit-20261022/continuation-20261022/live-results` 中各自 attempt-1。只使用该已暴露留出例的授权派生诊断，不复制完整留出原文、Gold 或其他留出例。
- [evidence.json](evidence.json)：六次候选、Agent 动作、浏览器决策序号、选中控件、原始响应、时间与资源。 [sources.json](sources.json)：487 个读取输入的路径、SHA-256 和字节数；共 227,860,062 字节。录制清单、运行 trace 的快照 URL 与运行时 HTML SHA 已对应。
- [selection-paths.md](selection-paths.md)：每次全部候选的名称、直接来源门店页、查位提议、实际查位记录和 Agent 调用序号，并提供原始 result/decisions 路径。

三批运行冻结提交分别为 `f8f4addc`、`f85d04a2`、`2b214155`。本次核对的八个相关实现文件在三者中各自 SHA 相同；模型决策时限不同，下面分别报告，不当作严格单变量比较。

## 2 见证：有位，但没有进入产品候选

按独立登记的 certifiedWitnesses 读取原始响应，逐条核验响应 SHA、`base_date`、`members`，以及每个 selection 链接的 `rcd/member/visit_date`；均与认证请求一致，六次都在认证有效期内。

| 组 | 认证门店 / 店号 | 日期、人数 | 窗口内原始可订时段 | 六次对应中的发现情况 |
| --- | --- | --- | --- | --- |
| H | Shabu Gen / 13015193 | 10/29，6 人 | 18:00、18:30、19:00、19:30、20:00 | h-03/h-09/h-15 均未发现 |
| H | Kappo Kukita / 13169764 | 10/29，6 人 | 18:00–20:00，每 15 分钟，共 9 个 | 同上 |
| C | Private rooms Izakaya Ginraku Yurakucho / 13266155 | 11/06，10 人 | 17:30–22:00，每 15 分钟，共 19 个 | c-04/c-08/c-18 均未发现 |
| C | Meibutsuya Yurakucho / 13281962 | 同上 | 同上 | 同上 |
| C | Uotami Tsukiji ekimae / 13318227 | 同上 | 同上 | 同上 |

H 的 [认证登记](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/registry.json) 及两份原始 [Shabu Gen](../checkpoint-c-live-20261020/holdout-exit-20261022/source-reads/inventory-job-01/p2-holdout-03-13015193.attempt-1.body.json)、[Kukita](../checkpoint-c-live-20261020/holdout-exit-20261022/source-reads/inventory-job-01/p2-holdout-03-13169764.attempt-1.body.json)；C 的 [认证登记](../checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/registry.certified.json) 及 [Ginraku](../checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/witness-capture/p2l-kf-h003-20261106/13266155.vacancy-attempt-1.body.txt)、[Meibutsuya](../checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/witness-capture/p2l-kf-h003-20261106/13281962.vacancy-attempt-1.body.txt)、[Uotami](../checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/witness-capture/p2l-kf-h003-20261106/13318227.vacancy-attempt-1.body.txt)。C 的原始 identityMatched=false 已由认证中的独立身份复核补正，不能丢掉 certifiedWitnesses、误用早期 observedWitnesses。

见证命中按同来源门店ID核对；跨来源没有发现与登记名称相符并有独立地址支持的同店候选，不按距离、菜系或猜测别名认定同店。已录HTML中的店号扫描只覆盖实际保存的HTML，不推断缺失页面。

这些原始数据证明**认证观察时**确有满足人数和窗口的空位；不证明库存逐秒恒定。六个运行目录没有逐店运行后见证 GET 包，本轮不补发请求。最早缺口发生在发现阶段，不能把未读的见证店说成“查后无位”。

## 3 逐次第一卡点与后续停止

“最早见证漏斗缺口”和“首个实际读取阻断／最终终止”分列，避免用 FAILED 终态倒推全部上游原因。下面的调用序号均为 decisions.jsonl 的 `sequence`；trace 序号为 result 的 browserTrace；快照号为录制的 `snapshot`。

| 运行 | 最早见证漏斗缺口 | 首个实际读取阻断与关键证据 | 最终停止 |
| --- | --- | --- | --- |
| h-03 | 0/2；只发现 TableCheck 10 家，Tabelog 和 Google 发现未到达 | 第一家 Hachimenroppi 在 trace98 的 AVAILABILITY/NAVIGATE 被既有工作流规则拒绝。随后第 7 次调用选 6 人，Obanzai 快照18/19 回读 `6 guests / 19:00`；得到该时刻 EMPTY，不是整个 18:00–20:00 无位 | 第46次 SEARCH 被拒；进入结束窗口后第47次 END_READ，489.041 秒，NO_VERIFIED_RESULT |
| h-09 | 0/2；同一批 TableCheck 10 家，Tabelog 未到达 | trace117 同样在第一家导航被拒。部分人数动作超时；Ryusaika 快照55/56 回读 `6 guests / 19:00` 后仅该时刻 EMPTY。其他店未形成完整选中／稳定结果 | 最后 Agent 第36次调用提出查 Ryusaika/Shirosaka/aniko 的事实；最后浏览器第43次调用被剩余期限截断。500.080 秒 RUN_DEADLINE_EXCEEDED，未形成结束答复 |
| h-15 | 0/2；同一批 TableCheck 10 家，Tabelog 未到达 | trace115 同样在第一家导航被拒。五家回读 6 人，本次选定时刻是 **20:00**，其余窗口未覆盖；不是沿用 h-03 的 19:00 结论 | 第47次 END_READ，395.673 秒，NO_VERIFIED_RESULT；仍有约104秒整单时间，不能归为500秒耗尽 |
| c-04 | 0/3；TableCheck 共发现10家，但仅第一批5家被提议查位；Tabelog 未到达 | 第一家 Nodoguro 已在快照17回读 `10 guests / 19:00`，随后 trace227 为 OBSERVE_CONTROLS 超时。Takahashiya 在快照26/27也回读10人并报告19:00 EMPTY；Tounai/M3 的预约工作流导航被拒 | 第19次调用是 Agent 的10秒 TIMEOUT（实测10.006秒），230.789秒 FAILED；不是47次调用或500秒耗尽 |
| c-08 | 0/3；仅 TableCheck 第一批5家；Tabelog 未到达 | 第5次浏览器调用即 TIMEOUT，Nodoguro 未确认人数。第9次虽提出选10人，但未留下成功回读；Takahashiya 最终 BROWSER_TIMEOUT，Kinri REQUEST_SELECTION_UNCONFIRMED | 第16次调用是 Agent 的10秒 TIMEOUT（实测10.002秒），218.526秒 FAILED；另有两次浏览器10秒超时 |
| c-18 | 0/3；先调查TableCheck10家，后才发现Tabelog4家，仍无见证店 | 先有四家TableCheck成功回读10人，仅19:00 EMPTY；另一家等稳定超时。Tabelog 的 MARUUSHI 人数栏翻页后10人已显示但禁用，未选中；实际捕获库存仍是2人 | 第47次 END_READ，466.954秒，NO_VERIFIED_RESULT。Vampire Café 和 Happo 查位记录为 RESERVE_REACHED；后者未启动实际查位 |

### 选店是不是走错店名搜索

不是这六次的共同卡点。全部被选中的候选都带原生直接门店 URL；TableCheck 使用同店 guide，c-18 的 Tabelog 使用同店详情页，没有跨来源按店名重找。

- C 的共同第一批依次是 Nodoguro Ginza Nakamata、Takahashiya、Tounai、M3 FELICE、Kinri。c-04 发现第二批但尚未查位就终止；c-08 没有发现第二批。c-18 又查 Magdalena、ZEN HOUSE、Fugu Nakamata、Ginza Masaki、Ginza Teki，然后才到 Tabelog。
- H 的顺序是 Hachimenroppi、Samjo、Obanzai Yoshiko、Ushinokura、Sushi Koshikawa、Ryusaika、Shirosaka、aniko、Takashonabe Akahane、Wakiya Ichiemi。三次都把同一来源的两批候选留到后续事实调查，而未覆盖见证所在来源。
- c-18 的 Tabelog 四家为 Happo、Fukumimi、MARUUSHI、Vampire Café；Agent 查位提议顺序为 MARUUSHI → Vampire Café → Happo，Fukumimi 未被选查。Tabelog 检查了五份详情，一家超1km被正确排除，接受四家；当前已录类别列表没有三家见证ID，此后详情队列/分页和Google发现尚未继续就进入结束窗口。不能据此扩大半径或断言平台找不到见证店。
- h-09 最后一批 FACTS 已实际开始，但整步未完成，所以没有第九条已返回 trajectory；[选店明细](selection-paths.md) 同时列出原始提议，未把这批遗漏为“未选择”。

## 4 人数、时间窗与库存响应

### 4.1 Tabelog：确有翻页，10人禁用，不能把2人库存接纳为10人

只有 c-18 真正走到了 Tabelog 查位；其他五次，特别是三次6人运行，**该控件未到达**，不能根据认证 GET 倒推 Agent 已成功操作6人控件。

c-18 / MARUUSHI 第38次翻月，第39次选11/06，第40–44次连续点 Guests 的 Next。观察序号4–8的可见人数分别为1–6、2–7、3–8、4–9、5–10；始终没有10人选中回读。第44次输入中 `Guests 10` 明确 `disabled: true / rejectionReason: DISABLED`，原始 [快照102](../checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-18-attempt-1/recordings/hybrid-1792599832794/snapshot-0102.html) 也有 `data-value="10" disabled=""`。这不是“10人目标一直没暴露”；至少最后一次应把不可选目标作为局部受限事实处理，不能继续把 Next 当可选10人的保证。

五次 Next 花掉5次模型调用，模型延迟合计21.126秒，尚不含操作/等待。当前店只观察到7–10按钮禁用；**不能**把它推及三家10人见证，更不能强点、改成其他人数或把禁用直接解释为整个窗口无位。

| c-18 捕获对象 | trace / 快照 | 原始 base_date | 原始 members | 可否用于10人 |
| --- | --- | --- | --- | --- |
| MARUUSHI 13138388 | 1461 / 98，随后多份快照复用同一响应 | 2026-11-06 | 2 | 否 |
| Vampire Café 13011570 | 1642 / 108 | 2026-11-06 | 2 | 否；选完日期后结束保留窗口已打开 |

只有这两份独立捕获的 find_vacancy 响应，不把同一响应在多次快照重复出现计为多个请求。日期一致，人数不一致；响应中即便有窗口内时段，也不能产生10人 Offer。没有10人的同请求响应。其余五次完全没有 Tabelog find_vacancy 观察，原因是来源／查位未到达，不是已证明接口不支持大桌。

### 4.2 TableCheck：菜单可选6/10人，实际店级上限未知

六次录制中的已展开人数菜单均包含1–10人及 `10+ guests`。6人与10人都有精确项；10人目标有时 `outsideViewport: true`，属于滚动选项，由现有选择动作处理，并非 Tabelog 的 Next 式人数轮播。成功HTML回读：h-03五家、h-09两家、h-15五家、c-04两家、c-18四家；c-08没有可确认的成功回读。

因此没有证据支持“TableCheck统一只支持4人／6人／8人”。`10+` 不是精确人数，也不能当作任意人数容量保证；本轮未打开预约表单认证各店实际上限。成功回读6/10人也只证明控件状态，不单独证明源接口库存、页面稳定或有位。

另一类局部失败和人数无关：H的Hachimenroppi/Samjo/Ushinokura/Shirosaka/Wakiya，以及C的Tounai/M3等，存在 AVAILABILITY/NAVIGATE 的 `Browser read prohibited source workflow`。冻结 [来源网络规则](../../src/integrations/tablecheck/tablecheck-public-query.ts) 撤销 `/reserve` 工作流；[Guard](../../src/infrastructure/browser/playwright-read-network-guard.ts) 按该规则拒绝预备导航。它们不是403、人数上限，也不是捕获 available 响应失败：例如h-03 trace95–96的 captureResponses 已返回，trace97–98才是导航被拒。**不能通过放宽Guard解决。**

### 4.3 时间窗：只读一个时刻，不等于窗口无位

TableCheck 的范围请求不会像精确时间请求那样在初始 URL 里完整绑定日期/人数/时间，而是在 guide UI 里选择。成功读到的当前时刻为 h-03/h-09/c-04/c-18 的19:00，h-15的20:00；没有证据显示对窗口内其他时刻做了完整遍历。

冻结的 [完成判定](../../src/integrations/tablecheck/tablecheck-browser-availability.ts) 在日期和人数选定、当前无服务类别且有 `emptyMealtime` 时允许结束本次读取；随后返回 `SELECTED_MEALTIME_EMPTY`，其余窗口保持 UNKNOWN。这种作用域保持是正确的，但调查能力不足：Agent转去其他店/补事实，没有在本店继续覆盖尚未知的时间段。

Tabelog 的现有读取能从同日 selection 过滤请求窗口；c-18在人数绑定之前就被挡住。本次没有证据证明它的窗口过滤错了。见证的6人/10人响应已包含窗口内多个时段，但这些**不同门店的认证结果**不得注入当前被查店的结论。

## 5 预算耗在哪里

总调用配置是50，**47不是硬上限**。c-18/h-03/h-15在结束保留窗口内以最后一次 Agent END_READ 收尾，最终各47次，未报告 MODEL_CALL_BUDGET_EXHAUSTED。h-09则是整单500秒截止；c-04/c-08是单调用10秒超时。

| 运行 | 实际耗时秒 | 调用构成：语义/Agent/浏览器/检索规划/事实判断 | 浏览器决策分区秒 | Agent分区秒 | 事实判断分区秒 | 操作后等待秒（占实际时长） |
| --- | --- | --- | --- | --- | --- | --- |
| c-04 | 230.789 | 1/8/10/0/0 = 19 | 47.618 | 45.648 | 0 | 62.987（27.3%） |
| c-08 | 218.526 | 1/6/9/0/0 = 16 | 66.271 | 33.539 | 0 | 47.710（21.8%） |
| c-18 | 466.954 | 1/14/31/1/0 = 47 | 112.970 | 43.485 | 0 | 138.650（29.7%） |
| h-03 | 489.041 | 1/12/19/1/14 = 47 | 99.143 | 45.912 | 40.578 | 126.387（25.8%） |
| h-09 | 500.080 | 1/9/21/1/11 = 43 | 161.445 | 76.112 | 49.588 | 113.551（22.7%） |
| h-15 | 395.673 | 1/10/23/1/12 = 47 | 89.234 | 43.728 | 20.785 | 132.821（33.6%） |

总时长取 Runner 的 latencyMs；startedAt→finishedAt 还包含少量收尾开销。模型时间取现有 stageTimings 的墙钟分区；等待取 resourceUsage 的累计计数，**两者可能重叠，不相加当作互斥时间分解**。h-09原始浏览器调用 latency 总和180.042秒，墙钟分区为161.445秒：第17↔18、23↔24、31↔32次调用的浏览器与后继Agent区间存在重叠（约8.236/3.188/7.174秒）。报告采用现有墙钟分区，未把并行/跨步等待重复加进500秒；不凭区间重叠进一步宣称执行器deadline失效。其500.080秒比声明上限多80毫秒，沿用已有协议偏差记录，不偷偷放宽阈值。

H组三次的事实判断合计14/11/12次，大量来自未能确认HARD、受限入口或重复打开同店的事实读取。H-15尤其说明只延长整单时间无效：还有104秒，却已用掉调查调用份额。c-18在第一次Tabelog快照时已过340.020秒；第一次返回Tabelog候选时已过399.193秒，最后约100秒还要翻月、翻人数、确认、等待和收尾。

c-04/c-08的10秒 Agent/Browser限制已在后来H运行变为30秒（H的事实判断仍8秒；接近deadline时按剩余预算缩短）。所以旧10秒超时是这两次的确定终止原因，但不是后续H仍失败的共同解释，也不应作为本轮“再把超时改30秒”的新建议。

## 6 共同根因与按预期收益排序的建议

下面按预计能恢复的调查机会排序，不声称已测得交付收益；不建议站点/地点常量、门店白名单、扩大半径、放宽HARD/身份/新鲜度/交付规则，也不把见证或留出答案喂给Agent。

| 顺序 | 通用修复方向 | 已有证据与预计收益 | 必须保留的边界／后续证明 |
| --- | --- | --- | --- |
| 1 | **让来源能力元数据与来源调度反映真实请求，并避免单来源占满调查。** 按实际可执行只读查询与观察到的人数能力决定排序；允许小批次后在未宣称当前来源穷尽的情况下切到其他来源，保留未查候选 | 六次都受影响。冻结 [planner](../../src/domains/restaurant/discovery-planner.ts) 对人数≥6且supportsGroups=true的来源加100；[Pack元数据](../../src/integrations/restaurant-search/source-packs.ts) 却把Tabelog标false、TableCheck标true，未来日实际排序120/30/10。[当前批次约束](../../src/domains/restaurant/read-assessment.ts) 又要求先补事实/查位。认证原始响应反证“false=不能接团体”的假设；5/6没到第二来源 | 不以见证ID做检索捷径；来源切换不等于允许展示未核验候选。最先做受控反事实：第一来源局部失败但第二来源有同请求解时，验证是否能在原预算下到达并交付 |
| 2 | **让动作规划、来源能力和当前Guard一致，局部受限尽早明确返回；复用已有同店观察，避免跨阶段重复尝试同一受限入口** | 六次都有受撤销工作流约束的店；所选TableCheck候选又被FACTS重复打开。可省掉明确不可走的路径与重复等待，把预算还给有效来源 | 不新增读取例外、不重新放行预约路径。当前允许的只读面若不能完成，应返回范围清楚的SOURCE_UNSUPPORTED/UNKNOWN；必须由新的来源观察或授权变化才能重试 |
| 3 | **把时间窗覆盖变成显式调查进度。** 当前时刻EMPTY只关闭该点，基于页面实际给出的合法时刻选择下一点或其他可覆盖窗口的只读面；返回已覆盖/未覆盖范围 | 五次至少有成功人数回读，但只形成19:00或20:00的局部无位。预计减少“有宽窗口却只查一个点”的漏失；目前不能证明这些TableCheck店其他时刻有位 | 不把局部EMPTY扩大为窗口EMPTY；不硬编码餐段或采样步长，选择来自实际观察且有原预算上界。后续正例须证明首点空、另一观察点有位能交付；反例缺请求绑定仍UNKNOWN |
| 4 | **可见不可选人数及时结束该店；人数翻页和选择按当前目标状态推进** | c-18实证：5次Next/21.126秒模型时间，目标10人最终disabled且未选中；库存members仍2。收益首先是节约无效调查，不是制造10人可订结论 | 绝不改人数、强点禁用项或接纳默认2人库存。不可选也不自动判全窗无位；允许合法换候选/来源。三家见证店的实际选择器还未被运行到，不能声称同病 |
| 5 | **按剩余墙钟与调用份额保护完整的发现→核验→交付路径，反馈明确区分单调用/候选/来源/整单超时** | c-04/c-08是旧10秒失败，H09是500秒，另三次是调查份额收尾，原因不同。先减少无效路径和重复等待；不要仅增加50次或500秒 | 旧10→30秒已生效，保留该历史差异。未来比较须在同预算下验证首个合格结果的证据齐全与实际展示，而不只验证更晚结束 |

来源排序和受限工作流/局部时刻短路是可以直接定位的实现机制；它们对“六次无交付”的因果贡献尚未通过反事实确认，统一标 HYPOTHESIS。六个样本来自两个意图的重复，不是六个独立新场景，不能据此给泛化成功率或宣称修复关闭。

## 7 验证、改动与停止点

本批仅新增此诊断、结构化证据、SHA清单及选店表，并按仓库要求同步 STATUS/DEVLOG/TEST-LOG/月索引。按纯文档矩阵核对链接、JSON、原始SHA、源代码无改动和diff；不运行typecheck/arch/test/build/Chromium，因为没有修改代码、Fixture或配置。没有重评历史结果，也没有新的S0认证。

新增真实模型、网站、Google、Live均为0。原始产物及冻结输入保持；推送 `codex/chore-group-window-diagnosis` 后停止，等待复核，不实施上述建议。


## 原始运行文件

| 运行 | result | decisions | 录制清单 |
| --- | --- | --- | --- |
| c-04 | [result](../checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/live-results/c-04-attempt-1/runner/2026-10-21T13-22-13-597Z-fe19189c-0a9c-4609-9ed5-18c8026a36bf.result.json) | [decisions](../checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/live-results/c-04-attempt-1/runner/2026-10-21T13-22-13-597Z-fe19189c-0a9c-4609-9ed5-18c8026a36bf.decisions.jsonl) | [recording](../checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/live-results/c-04-attempt-1/recordings/hybrid-1792588933535/recording.json) |
| c-08 | [result](../checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/live-results/c-08-attempt-1/runner/2026-10-21T14-08-00-597Z-3bea8ed5-8aa6-4539-9207-9cc9ba56fd4f.result.json) | [decisions](../checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/live-results/c-08-attempt-1/runner/2026-10-21T14-08-00-597Z-3bea8ed5-8aa6-4539-9207-9cc9ba56fd4f.decisions.jsonl) | [recording](../checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/live-results/c-08-attempt-1/recordings/hybrid-1792591680527/recording.json) |
| c-18 | [result](../checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-18-attempt-1/runner/2026-10-21T16-23-52-862Z-cb6b94a5-2e3c-4053-aa07-6973db7433e7.result.json) | [decisions](../checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-18-attempt-1/runner/2026-10-21T16-23-52-862Z-cb6b94a5-2e3c-4053-aa07-6973db7433e7.decisions.jsonl) | [recording](../checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/live-results/c-18-attempt-1/recordings/hybrid-1792599832794/recording.json) |
| h-03 | [result](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-03-attempt-1/runner/2026-10-22T08-42-01-645Z-8a1e9abe-a8ba-4eed-9d7d-4e9388d374c0.result.json) | [decisions](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-03-attempt-1/runner/2026-10-22T08-42-01-645Z-8a1e9abe-a8ba-4eed-9d7d-4e9388d374c0.decisions.jsonl) | [recording](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-03-attempt-1/recordings/hybrid-1792658521571/recording.json) |
| h-09 | [result](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-09-attempt-1/runner/2026-10-22T09-43-42-240Z-1fe7a835-0915-4fc1-9603-87143341155d.result.json) | [decisions](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-09-attempt-1/runner/2026-10-22T09-43-42-240Z-1fe7a835-0915-4fc1-9603-87143341155d.decisions.jsonl) | [recording](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-09-attempt-1/recordings/hybrid-1792662222175/recording.json) |
| h-15 | [result](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-15-attempt-1/runner/2026-10-22T10-42-02-863Z-88cea1d7-adf7-49ac-ba2d-480dd1f199fc.result.json) | [decisions](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-15-attempt-1/runner/2026-10-22T10-42-02-863Z-88cea1d7-adf7-49ac-ba2d-480dd1f199fc.decisions.jsonl) | [recording](../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/live-results/h-15-attempt-1/recordings/hybrid-1792665722792/recording.json) |


[纯文档验证及原始输入不变核验](verification.json)。原始六次共219模型调用仅作复用统计，不重复计入本批用量。
