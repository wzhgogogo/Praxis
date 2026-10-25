# F5 例01批准重跑：停止点3b报告

- Document revision: 1.0
- 时间：2026-10-25 Europe/Vienna，CET（UTC+1）。原始机器时间保留UTC。
- 证据：已暴露开发控制，Live Read-only；draft / not integrated；不构成Clean Baseline。

## 1. 验收结论与四层评价

**未达标：例01合格交付0/3，三槽全部超时；要求的至少2/3且不超时未兑现。独立S0声明与边界核查三槽均ABSENT。** F5c纠正集成改动已在3/3真实槽的首次Tabelog来源调用执行，但没有带来合格交付。剩余首个阻断是选中替代地区仍越界，后续跨来源事实／查位耗尽整单时间。严格因果只证实下列轨迹，不承诺换入口选择或提速的反事实效果。

每槽保留独立Evaluator35／rubric30原评价、执行artifact、Codex四层复核和安全门；通用评价器的ORCHESTRATION_INTERRUPTED／EXCLUDED原样保留，**用户计划分母仍为3，全部计超时失败**。逐环节层见第3节；严重度层S0两项ABSENT、S2 PRESENT（独立可行见证未交付），S1/S3/S4未评分；归因层区分已证轨迹与候选解释。三槽均无正向餐厅交付声明，post-delivery GET计划都是空，不冒充实际逐店GET已通过。

| 槽 | 正式开始 CET | 正式耗时秒 | 合格交付／首个合格／展示 | 模型 | Google | 环境重跑 | S0两项 |
|---|---|---:|---|---:|---:|---:|---|
| 1 | 09:40:47 | 500.659 | 0／未发生／未发生 | 39 | 5 | 0 | ABSENT |
| 2 | 09:55:51 | 500.602 | 0／未发生／未发生 | 38 | 5 | 0 | ABSENT |
| 3 | 10:16:29 | 500.696 | 0／未发生／未发生 | 39 | 5 | 1 | ABSENT |

本批3个受控Runner均已执行，未启动例03或第四次正式任务。到停止点3b收齐证据后停止，等待复核；没有合并或推送main。

## 2. 重放、冻结、凭据与见证

31个提交重放到main `b5db5700fa4c868a5c94f245bc3ef9689eecb4e4`；源码冲突0，13次文档冲突保留双方记录。旧7d563335留annotated tag `checkpoint/phase3a-prime-f5c-reviewed-20261025`。原共享账本主线7条是本分支18条子集，并集合并保留全部18条；本批新增后23条。见[重放审计](rebase-audit.json)与[冲突记录](rebase-conflicts.json)。

`b195c176e314f6282e686a44b04c2076afde87f3`于09:24:22–09:26:21 CET重跑五门禁：typecheck、arch:check、默认1053、build、Chromium155全绿，每项前后git status均为空。之后只增加评测配置、执行证据和文档，源码／测试／Prompt／Schema／脚本／skills相对该门禁提交无新增改动；不是把旧F5c门禁冒称本批运行。[门禁收据](gates/receipt.json)。

采集器在`0c0b16ff`冻结提交后，公开串行2GET复查Dengana；首次详情09:36:27 CET，第二次四参数find_vacancy严格在前次完成≥5秒后开始。没有Cookie／登录状态、预约表单、模型或Google调用。服务端响应Set-Cookie仅随原始头留证，没有回传使用。09:36:37 CET认证WITNESS_EXISTS：2026-11-04（周三）19:00两人，距权威圆心约201.545m，kushi-age／kushikatsu，完整地址**東京都北区赤羽1-15-1 新仲ビル1F**。三槽在24小时有效期内开始，运行日后+10天，原文字除既有DATE替换外未改。[认证](certification/certificate.json)／[逐次请求](certification/requests.json)。

最终Live包于`e150f180`正式槽1前冻结，[freeze.json](freeze.json)含375项SHA、collector SHA及原始详情无损gzip映射。预Live唯一显式修订是分析器rawDirectory指向certification，采集器在GET期间未变；Live开始后冻结输入／编排不改。用户本轮单独授权的3次Runner凭据加载恰好用完，没有显示、复制或暂存.env或密钥。运行时worktree=DIRTY来自可变预算预记账，最终冻结SHA审计另证源码未变；不把最终净树写成运行时净树。

## 3. 同次来源纠正轨迹

三槽`trajectories[0]`均为首次Tabelog SEARCH，nativeDiscoveryFunnel已含原入口、两样本、替代入口及其样本，纠正无需后续根SEARCH。模型只输出集合targetRef，代码使用本来源已观察href；普通DOM合同没有改动。三个动作均选择集合索引`:34`，原观察引用如下。

| 槽 | regionCorrection／SELECT决策行 | 原观察ref | 地区／检索页 | 详情尝试 | 首次来源耗时秒 | 收尾 |
|---|---|---|---|---:|---:|---|
| 1 | 6／6，各1次 | observation:3:target:17 | 3/4；检索3 | 4/10 | 90.012 | SOURCE_BUDGET_EXHAUSTED |
| 2 | 7／7，各1次 | observation:4:target:17 | 3/4；检索3 | 4/10 | 90.017 | SOURCE_BUDGET_EXHAUSTED |
| 3 | 6／6，各1次 | observation:3:target:17 | 3/4；检索3 | 4/10 | 86.151 | REPLACEMENT_SAMPLES_OUTSIDE_RADIUS |

三次均从东京→A1322（Itabashi & Along Tobu Railway Line）临时入口，在两个有效样本13155817（5547.116m，南，197.238°）及13168736（3911.368m，西南，209.023°）越界后，给出代码坐标距离／方位反馈并选择`https://tabelog.com/en/tokyo/A1322/A132201/`（Kita-Ikebukuro & Itabashi St. Area）。该href此前在A1322页面观察到，直接导航，无恢复菜单读取。本次真实路径为**3地区页**，不是离线G3的4页路径；6个总列表/检索页也不能混写为6地区页。

替代入口样本13239336三次均为4040.597m南（173.757°），仍越界。第二个13157173：槽1／2坐标UNKNOWN，来源90秒截止；槽3有效坐标4035.609m南（172.509°），第二入口两个有效样本均越界，86.151秒即按REPLACEMENT_SAMPLES_OUTSIDE_RADIUS收尾。UNKNOWN不计作有效越界样本。槽1／2截止清理分别多12／17ms，不重置预算。一次换入口上限没有再打开。三槽Tabelog原生接纳均0，Dengana未作为原生候选出现。

原slot3手工复核模板的归因句错误地写成来源90秒耗尽；保留原件，追加[更正说明](slots/3/review-addendum.json)，以实际两样本越界收尾为准。其整单TIMEOUT／S0评价不变。每槽完整反馈／选择／样本／截止动作见[槽1](slots/1/metrics.json)、[槽2](slots/2/metrics.json)、[槽3](slots/3/metrics.json)，原始决策和trace在各槽[evidence-index](slots/3/evidence-index.json)对应gzip中。

## 4. 时间分解、截止动作与见证漏斗

以下采用运行后补充的保守墙钟分区：只归属实际配对的OP_STARTED/FINISHED/FAILED和已记录模型区间，模型优先，无法配对的开始保持缺口。冻结measure及原评价原样保留，未把未配对导航默认延续到总截止。补充脚本[retrospective-observation.py](retrospective-observation.py)只读离线，不是Live冻结配置，不改变评分；这是观测分区，不是依赖DAG关键路径证明。

| 墙钟项，秒 | 槽1 | 槽2 | 槽3 |
|---|---:|---:|---:|
| 加载／导航 | 211.462 | 191.262 | 240.193 |
| 读页面／控件 | 26.828 | 27.582 | 33.662 |
| 等待／稳定性 | 49.644 | 50.064 | 38.233 |
| 其他页面操作 | 1.282 | 0.557 | 0.589 |
| 模型：语义 | 3.944 | 3.774 | 3.173 |
| 模型：根决策 | 41.164 | 30.340 | 24.118 |
| 模型：检索 | 16.053 | 22.528 | 12.913 |
| 模型：浏览器决策 | 65.407 | 74.796 | 61.249 |
| 模型：事实 | 12.803 | 17.753 | 13.598 |
| 未归属／配对缺口 | 72.072 | 81.946 | 72.968 |

| 模型用途调用数 | 槽1 | 槽2 | 槽3 |
|---|---:|---:|---:|
| 语义 | 1 | 1 | 1 |
| 根决策 | 9 | 7 | 8 |
| 检索 | 5 | 5 | 5 |
| 浏览器决策 | 19 | 19 | 19 |
| 事实 | 5 | 6 | 6 |

每槽模型用途延迟和未配对trace号完整保存在observation-supplement／metrics，模型延迟合计不能再加到已包含它的墙钟总和。首个独立支持合格结果时刻与展示时刻均为null（未发生），不是0秒。

| 槽 | 超时前最后根决策 | 发出时剩余秒 | 至整单收尾秒 | 截止时模型／Google余额 |
|---|---|---:|---:|---|
| 1 | 行37 CHECK_AVAILABILITY | 92.961 | 93.620 | 11／35 |
| 2 | 行30 CHECK_AVAILABILITY | 120.484 | 121.086 | 12／35 |
| 3 | 行39 CHECK_AVAILABILITY | 26.596 | 27.292 | 11／35 |

未完成的根动作未持久化为成功轨迹，截止剩余时间均0。槽1 trace1272 Tabelog拒绝TIMEOUT，1273发起WEBSITE NAVIGATE（Dengana），随后关闭；槽2 trace1313–1318 Tabelog模型决策撞截止并关闭；槽3 trace1485–1490 TableCheck导航完成后截止关闭。用户边界500秒不变，额外0.602–0.696秒是产物收尾，不解释为增加执行额度。外层总时长分别533.514／530.333／843.461秒，包含健康检查、预检及收尾。

三槽见证漏斗一致：Dengana按冻结的**店名＋地址成对身份**匹配到Google候选`praxis:restaurant:07b0ba0daee00150d6d202e1`；FOUND→identity OBSERVED→最终状态无已完成facts／availability记录→未展示。独立原始见证AVAILABLE、feasible SUPPORTED；Tabelog原生候选列表中无Dengana。自动漏斗把FACTS阻断标为HYPOTHESIS，不是确定因果。原始trace包含Dengana查位／Tabelog识别尝试，所以“最终无完成记录”不能写成“从未尝试”。本批店名地址oracle正常工作，不能从0交付推出见证不存在。

第三槽健康检查首次Tabelog HTTP200但10秒内没有完成snapshot，CHECK_TIMEOUT；TableCheck有65次观察却RESULT_NOT_OBSERVED。按批准额度一次环境重跑，等待300秒；第二次两来源HEALTHY后才开始正式Live。Tabelog第一次snapshots=[]，与旧“已有完成快照但deadline未采用”的缺陷证据不同，不能仅凭HTTP200归因。全部健康检查／预检原文在各槽preflight-receipt指向的无损tar，网络根因仍未证。

## 5. 录制、回放与可用控件

| 槽 | 合格页面／总页面 | 比例 | 不合格原因 | F2④b ORIGINAL |
|---|---|---:|---|---|
| 1 | 19/94 | 20.21% | UNCAPTURED_STATIC_DEPENDENCY=75 | REPLAY_INCOMPLETE；0/94页，2决策 |
| 2 | 12/97 | 12.37% | UNCAPTURED_STATIC_DEPENDENCY=81；UNSAFE_DOCUMENT=4 | REPLAY_INCOMPLETE；0/97页，2决策 |
| 3 | 12/111 | 10.81% | UNCAPTURED_STATIC_DEPENDENCY=99 | REPLAY_INCOMPLETE；0/111页，2决策 |

三份录制均交给F2④b原样ORIGINAL回放，OS deny network-outbound，真实模型／网站新增0，没有生成补页或改输入以求通过。三次都停在snapshot1、`https://tabelog.com/en/tokyo/rstLst/`、DOCUMENT_NOT_QUALIFIED；录制的snapshot1/2最终URL是`/en/tokyo/`且页资格REPLAYABLE，因此“请求URL与最终URL的资格映射”只是待审计候选归因，不是已证修复方案。每份HAR实际都有3个Google运行期响应，不能再沿用旧批“Google整体未捕获”的结论。页面合格比例不等于整包能回放；三份回放均未完整复现。原输出／评价不改，见各槽replay-receipt与无损tar。

每槽stderr均保留1条DECISION_SNAPSHOT_MISMATCH，说明决策捕获关联存在缺口，不能忽略，也不能据此自动认定S0。未捕获脚本列表每槽相同，完整origin＋path（不含query）：

- `https://assets.adobedtm.com/3687940b53f7a560587a33c8bb748b9253ff5ea9/satelliteLib-15b13f3fd03e00e11fcd40b9f97c8b58a9ca6e66.js`
- `https://umami-next.post.tablecheck.com/script.js`
- `https://www.tablecheck.com/portal/assets/index-DUt7bgp8.js`

冻结自动控件分析沿用旧row.input字段，当前决策正文在messages，因此其空数组不能证明控件不存在。补充分析直接核对实际模型messages：槽1行38，槽3行26／27出现**Akabane Sta.**以及**Akabane Sta. Izakaya (Japanese style tavern)**两个合法OPEN_LINK，均未选用；模型当时目标是日期／人数的查位流程，选择其他动作。它们发生在后续候选识别／查位，不是首次原生地区纠正阶段。槽2未在模型上下文中观察到匹配控件；三槽均未观察到合法LOCATION目标，不能据此断言完整DOM无LOCATION输入。只记录观察，不拼造站码、类别码或URL。

实际观察到的站入口为`https://tabelog.com/en/tokyo/A1323/A132305/R134/`，类别入口为其`rstLst/izakaya/`。诊断DOM引用（压缩成员保留，完整映射见各槽observation-supplement）：

- 槽1录制`hybrid-1792917647123/diagnostic/snapshot-0083.html`、0086–0089；决策行38。
- 槽3录制`hybrid-1792919789577/diagnostic/snapshot-0065.html`、0068–0072；决策行26、27。

补充脚本按同页面URL列出候选DOM文件，DECISION_SNAPSHOT_MISMATCH下不把URL匹配冒称一一精确绑定。可核对的target label／href／availableActions及未使用选择来自决策messages原文。此发现单独交复核，不在本批扩张为LOCATION／车站修复。

## 6. 编排偏差、预算与停止

**“每槽结束后立即评价”未满足。** 外层结束后，由本对话触发离线评价，而非进程退出自动衔接；延迟如下。

| 槽 | 外层结束 CET | 独立评价产物时间 CET | 延迟秒 |
|---|---|---|---:|
| 1 | 09:49:08.627 | 09:49:47.872 | 39.245 |
| 2 | 10:04:12.292 | 10:05:52.929 | 100.636 |
| 3 | 10:24:50.839 | 10:29:35.385 | 284.545 |

没有交付，因此没有应当立即执行却遗漏或延迟的逐店GET。每次下一槽仍在独立四层／S0安全门和回放记录提交后启动，全部串行，安全门只准继续，不代表质量通过。偏差仍使“立即”编排验收不通过；不能因没有S0淡化。冻结外层脚本运行中未改；未来若批准再跑，应另批冻结退出即评价的编排。本批停止，不借此自行修改或追加Live。

| 资源 | 本批新增 | 3a′共享累计 | 上限／口径 |
|---|---:|---:|---|
| 正式Live | 3 | 8 | 8，已用完 |
| 真实模型 | 116 | 334 | 400；本批≤150，共享≤368批准估算内 |
| Google请求 | 15 | 45 | 每槽≤40，含预检实际计数 |
| 环境重跑 | 1 | 3 | 原2＋追加2，总4 |
| 评测侧公开GET | 2 | 7 | 本批只预Live见证2；交付后0 |

站点浏览响应1245／1345／1898（含健康与静态响应）另记，不把大量页面资源请求冒称网站调用0；预算websiteGET字段只计评测侧显式认证／交付核验GET。整单实际模型39／38／39、Google各5，均在单槽上限内。另有每槽1次模型服务/models元信息预检GET（共3次），在transport事件中单列NODE_READ，不计为生成调用。新2GET与3槽逐项记账，原18条保留。[共享账本](../budget.json)。

Mock／本地fixture：本次重放五门禁运行；Replay：3次ORIGINAL、全部INCOMPLETE；Live Read-only：3次；Controlled Live-write：未运行。没有人工介入、并行批量入口或自动S0重试。保护站点目录总3864行、source-packs.ts473行，字节不变。

最终静态审计见[final-audit.json](final-audit.json)：375项冻结SHA、原账本与计数、无损证据与录制成员、源代码保护、串行顺序和git diff --check。最终仅提交推送本分支，停在**停止点3b，等待复核**；F5达标验收FAIL，不开始新实现、Live、合main或例03补跑。
