# Round 25：Phase 3C 离线质量收口

状态：**功能离线验收 PASS；历史保护签收 BLOCKED_BY_MISSING_HISTORICAL_ORIGINALS（151 份原件缺失）**。这是本地冻结回归，draft / not integrated，不代表 Live 或真机能力签收。所有验收结果均针对下面唯一最终冻结源码；先前失败运行仅作为诊断保留，不计入通过分母。

## 1. 基线与唯一冻结

- 工作树 `/private/tmp/praxis-3c-unified`，分支 `codex/feat-web-photos-unified`，保留原非 cone 稀疏配置。
- 起点 `287879cbe6d46b60e11909a145ffab1abfbd2ca8`。
- 最终源码/测试/输入冻结 **`6202c1164aab14bec1a7353eadc8e5a522a3d259`**。
- 冻结 `src` tree **`6453345249c5a2ebea1c6d5af3b2d2f14b283944`**。
- 冻结后没有再修改 `src/`、测试、采集器或断言脚本；本归档提交只追加本轮证据与四份账本。最终归档 HEAD 由提交后回执/交付消息记录，不能用归档 HEAD 冒充测试时的 HEAD。
- `frozen-inputs.json` 的 36 项输入均核对哈希。原任务及三个补充点见 `TASK.md`、`ADDENDA.md`。最终本机 check 通过：`worktree-check-final.log`。

## 2. 改动和定向复核

| 项目 | 实现与实际结果 | 主要证据 |
|---|---|---|
| C1 | 生产远程 Playwright 会话迁入每会话独立 worker，协议/退出/超时通过显式 RPC 失败收口；宿主没有宽泛 uncaughtException 吞错。真实已安装 Playwright 与本地回环 CDP 在初始化和读页阶段注入真正重复 Target 事件。故障会话失败、并行健康会话和下一次实际读页成功，无关宿主异常仍按默认机制退出。 | `c1-baseline-frozen.log`、`c1-session-binding-proof.log`、`gates/browser-fixture.log`、`c1-built/test.log` |
| R1 | 在语义事务提交边界发布新读轮所有权，早于消息落库和旧问答 worker 收尾。已提交准备句柄优先于旧 draining worker，迟到续体不抢回所有权；两窗口的 Stop/后继编辑及旧 Stop 保护均通过。 | `R-NOTES.md`、`r12-baseline-loopback.log`、`r12-full-ownership.log`、`observations/preparation.json` |
| R2 | 未提交语义账本与已提交导出所有权分离，409 等待期和退出后保留先前已完成 4 次用量；刷新、换批、定位仍发布自身用量和截止时间。 | `r-direct-entries.log`、`observations/budget.json`、正式默认测试 |
| R3 | 只移除独立 serves-beer 饮品项，修复首/中/末标点，保留 beer-battered fish / beer garden access。生产 Google 适配器假传输直接核对 textQuery，原 21 项矩阵通过。 | `r345-green.log`、`observations/search.json`、`observations/google21.json` |
| R4 | 否定分句覆盖 e.g. / not specifically，同时不吞掉后续明确正向需求；普通搜索与 inspectFacts 两入口一致。 | `observations/search.json`、默认 grounding 回归 |
| R5 | weak 条件实际展示的商家 evidenceId 与模型证据合并；390/1440 先核对完整 ISO（正确08:05而非旧08:04），再验证东京日期页脚；歧义旧快照不补日期。 | `observations/ui.json`、`final/states/round25-r5-390-indirect.png` |
| M1 | 移动输入/胶囊编辑 16px；仅澄清焦点与一次键盘 resize 调整可读末行，用户回滚后不强拉；长 About 焦点保持滚动/草稿。500/360 两种键盘视口及中文长标题、多行草稿通过。 | `final/states/round25-m1-390-keyboard-{500,360}.png`、对应 review-scroll 图及 JSON |
| M2 | 真实 Google 适配器区分502/404/格式错误；服务端永久失败410、可恢复失败503；网络/短暂故障不缓存为空相册。代理200只证明源字节已缓存，浏览器本地断传/坏传仍可重试。当前相册重连/重开最多2次自动重试，Google绝不预取，网站Lookahead1维持。鼠标拖动不翻图，触控1×翻图，>1.02×原生平移且不翻图。 | 正式 display-photos / restaurant-photos 回归；`m2-authoritative-boundaries.log`；`observations/screenshots/round25-m2-*.json` |
| M3 | 390宽 Reconnecting 胶囊在顶栏与标题之间，上下留白均22px；矮视口与标准视口通过。 | `final/states/round25-m3-390-reconnecting-{500,360}.png` |
| V1/V2 | 条件名与引文完全相同只显示紧凑来源页脚；长引文保留框。站名↗·Checked东京月日，内部精确URL/ISO分组保留，旧歧义数据省略日期；旧断言同步使用实际原件日期。 | `final/states/round25-v1-390-compact-steak.png`、来源分组/完整ISO回归 |
| V3 | 可选同行证明落在正确的 page-question.ts 类型。两行源表经过生产抽取、真实本地问答HTTP和PGlite进入弹层/历史；只合并唯一可定位同行的表头/状态。跨行、重复Available、无证明旧DTO不合并，答案正文不变。 | `src/harness/question-row-fixture.ts`、`v3-production-targeted.log`、`final/states/round25-v3-*` |
| V4 | 指定引文竖线/MET文字/已收藏图标/About与来源链接采用#3D5AFE；灰色未知状态、基础字体与色板保留。 | `final/states/round25-v4-{390,1440}-card-blue.png`、样式断言 |

### M2 的恢复能力边界

**完整恢复以已有 Google 照片清单和剩余媒体预算为前提**。Details 限额仍1，Google媒体20，网站页2/图片10。首次 Details 中断已耗掉唯一额度时，不重置、不偷偷补请求，不能承诺恢复8张 Google 图；允许的现有网站回退与清楚失败保留。502不会被伪装成永久404；404/410、禁止缓存、类型/尺寸/解码不合法仍永久隔离。

真实 Google 适配器 + 假传输的自动化结果：正常8/8非空图像精确16次media；短暂502恢复8/8为18次；404/类型错误隔离为7张；持续502到20次预算即止，第21次在发送前拒绝，成功图仍可读。实际本地代理 + Chromium分别验证列表中断、短暂502、持续502、源完成后浏览器abort、200响应体截断、一次本地坏传。除持续502负对照外，恢复后8/8可逐张加载；缓存字节的后三种本地故障不重复打来源，仍为16次media。持续502仅最多2次自动重试，保持可观察失败，不把“清单8项”写成“8张都加载成功”。

## 3. 冻结后五门禁

所有行运行前后 Git 净树，`envLoaded=false`，退出码均0。原始输出在 `gates/`，逐项真实命令/隔离方式/计数/耗时见 `gates/manifest.json`。

| 门禁 | 结果与精确计数 | 耗时秒 |
|---|---|---:|
| Typecheck | PASS（含浏览器严格TS） | 0.631805 |
| Arch check | PASS，0违规 | 0.194118 |
| npm test | **1932/1932** | 69.956852 |
| Browser Fixture | G2 **5/5**；Chromium **576/576**；G6 assembly **159/159** | 470.523975 |
| Build | PASS | 0.572899 |

Browser 输出的581是G2+Chromium汇总，不重复加到通过数。Browser Fixture外层不套sandbox-exec，Replay子进程自行实施OS隔离；其余门禁/后续探针OS拒绝非回环外连。未加载.env，无生产Secret调用。

C1双入口为可执行测试宿主：源码通过tsx加载、dist通过**本次同SHA Build之后**原生JS加载，均用createLocalWebServer+PGlite+生产CloudflareBrowserRun+真实本地Chromium/CDP。源码4/4属于576；dist独立4/4，测试12.730209秒（编排12.872526秒），见 `c1-built/manifest.json`。没有用先连真实PG且绕过Cloudflare的CLI FIXTURE冒充双入口。

## 4. 独立复核、架构与视觉

- 先采集新观察完整落盘，再独立断言：`observations/collection-complete.json`、`observations/assertions.json` **353/353 PASS**，不是重复生产判断作为oracle。采集45.243156秒、断言0.047791秒。真实Google假传输原矩阵 **21/21**。
- 历史用户顺序 **10/10**，两个脚本只从本轮目录执行；`PRAXIS_REVIEW_EXPECT_SOURCE`取冻结src tree SHA，不取提交SHA。桌面/手机大阪改条件、涩谷澄清、收藏/反馈/跨计划问答与交接保留。产物 `history/`，24PNG，脚本耗时4.552642+8.332807秒。
- 严格TS `true`，18浏览器模块，0 any/抑制指令，0反向entry导入，SCC全部大小1，**0环**：`browser-dependencies.json` / `.dot`。构建前后19JS资产逐字一致，HTML/CSS一致：`build-assets.json`、`html-build-comparison.json`。
- 正式三尺寸390×844 / 960×900 / 1440×900：**16/16**，41PNG，32.462487秒；Style1 **6/6**，6PNG，8.005150秒；状态回归 **157/157**，204PNG，150.794316秒。
- 状态命令实际加载10个测试文件（含相册、首页、Round25），正则包含Round25 UI；所有截图变量指向本轮目录。新18条Round25 UI的38PNG与测试名、输入文件逐项对应：`ui-screenshot-contract.json` / `ui-screenshot-verification.json`。本轮没有新增slice2测试需要额外加载；其已有回归已在完整Browser Fixture运行。
- 目检37张联系表覆盖313张实际PNG（formal41+style1 6+states204+历史24+独立观察38），另打开15张关键原图。`contacts/index.json` / `visual-inspection.json` 保存索引与原图哈希。图像可滚动、按钮/页脚/问答无新增阻塞遮挡；持续502故障占位是预期负对照。缩放截图的裁边是1.8×平移观察，不误记布局溢出。

### 四层评价与适用范围

1. 端到端：仅本地Fixture/PGlite/Chromium合同路径，自动化及历史十路径PASS；持续502、无引用清单和拒绝/Stop路径为预期保守失败。没有真实店/实时库存交付结论。
2. 逐环节：C1初始化/读页/并行/下一请求、读轮提交交接、预算所有权、查询/事实、相册清单/字节/重试、来源证明/渲染分别由新观察验证。
3. 严重程度：明确反例与正例的独立冻结输入断言通过；**真实来源S0声明/越界及真实完整需求合格性 NOT_EVALUATED**，不从Fixture全绿推导真实S0=0。历史保护151原件缺失独立列为交付阻塞。
4. 归因：产品故障、CDP注入靶会话错误、旧格式断言、外层目录检查失败和OS清理中断分别保留；不混为能力失败或掩盖失败重跑。

## 5. 失败与重新冻结记录（原件保留）

- `4658490514c6c47124e881462d8873d550b3628f`：前三门禁通过，Browser Chromium570/573，2条旧时间格式断言+1条真实Stopped卡片焦点滚动回归；G6/Build未执行。`failures/465849051-first-gates/`保留日志、截图/trace。聚焦滚动收窄为NEEDS_INPUT后重新冻结。
- M2额外真实本地断传红例见 `m2-local-interruption-red.log`。一次坏传初版oracle误当永久来源损坏，`m2-transfer-boundaries.log`保留；按实际源端200缓存与下一次有效字节改为恢复8/8，原永久坏图断言未放宽，6项通过见`m2-authoritative-boundaries.log`。
- `cc93d15dd6bcffbf969a1fc4781260b692a43316`：默认1932通过，G2 5通过，Chromium575/576。故障注入错误选中了另一CDP会话；按Runtime.callFunctionOn的sessionId精确绑定原Target事件，并增加目标ID及真实Duplicate target因果断言。`failures/cc93d15dd-cdp-target-binding/`、`c1-second-freeze-isolated-diagnostic.log`保留。另有空输出目录的编排预检失败单独保留，未计测试。
- 最终6202源码初次运行跨过本机00:00，发生临时目录自动清理，测试子进程被定向终止，部分282条/255pass/27cancelled是 **ORCHESTRATION_INTERRUPTED，不计能力分母/验收通过**；原件在`failures/6202c1164-midnight-cleanup/`。恢复核验后未改源码，从头完整重跑，§3–4是这次有效结果。

## 6. 保护面、恢复与未通过项

**保护检查退出1，不能报告整体保护通过。** `protection-verification.log`、`protection-verification.json`及`protection-summary.json`保留原检查结果，没有降低阈值或更改原历史哈希。

00:00清理造成718个已跟踪文件缺失，精确从当时当前HEAD6202恢复（逐blob、SHA256和模式核对；只写不存在路径，不覆盖本地文件，不改索引/稀疏配置）。`failures/6202c1164-midnight-cleanup/restoration-receipt.json`、`resume-check.json`保存过程。51个依赖元数据与lock一致，未重装/修改package或lock；完整五门禁重新验证实际运行闭包。

历史基线12638份：**12487份仍逐字匹配，151份未跟踪复核原件缺失，现存历史内容变更0**。这151份在当前HEAD中不存在，未回源、未伪造、未重生成同名证据，也未擅用其他chat副本。精确路径和原SHA256在 `failures/6202c1164-midnight-cleanup/untracked-evidence-gap.json`。已询问可用原件备份位置，归档时尚未获得。恢复同哈希原件并重跑保护核验前，不签收历史完整性。

其余检查通过：

- 主工作区HEAD/status/index/diff与主.env哈希不变；未加载.env。
- closeout950个已有材料逐字不变、登记不变；其.git原已缺失的状态保留，不修复/触碰。
- sparse配置未变；本轮所有改动在白名单内，Prompt15、搜索指纹、missingBlockingFields、历史Mikkeller行为、package/lock/config/schema/migration未改。
- 原保护848文件中845不变，**3份获准测试辅助文件确有修改**（C1共用会话组件与V3/M2测试宿主），前后哈希与用途在protection-verification.json；不声称848份全部不变。其他生产改动与4个最小C1辅助模块在显式白名单内。
- 进程finally收尾后只读盘点未见本轮CDP/Chromium/Web测试进程残留：`process-cleanup.json`。不停止其他任务已有服务，不连接4312或真实PG。

## 7. 交付与未测边界

`artifact-sha256.json`列本轮所有交付文件（排除清单自身以免递归），包含报告、原始日志、输入、截图、失败与恢复证据；`source-freeze-verification.json`证明冻结后src diff为0。最终本地归档提交后以Git净树停下，不推送，不合main。

**NOT_EVALUATED：远程真实CDP；真机iOS/Android软键盘与自动放大；真机双指缩放/平移；Live；真实PostgreSQL；4312走查。** 本轮新采集均为离线Fixture/假传输/回环HTTP与真实本地Chromium；没有重新跑Live、DeepSeek、Google真实API或餐厅站点。整体剩余事项是151份历史原件保护签收以及上述明确未测范围，不将功能PASS改写为无条件最终签收。


## 8. Latest recovery update - 2026-11-24

User-authorized recovery restored **14/14 original paths** from SHA-256-identical copies within this worktree: six Round 9 scripts/logs from `full-round-audit-6VU93V`, and eight Round 10 screenshot paths from six images in `round-10/states`. Twelve unique source files serve fourteen targets; `round10-handoff-reselect.png` matches three separate missing target paths. Before each write, the original missing-list baselineSHA256 was verified and the target was confirmed absent. O_EXCL prevented overwrites. Every restored target and every unchanged source was hashed again.

**Current protection status: BLOCKED_BY_MISSING_HISTORICAL_ORIGINALS; 137 remain missing.** Of 12638 baseline historical files, 12501 now match, 137 are missing, and zero existing historical contents changed. The original 151-item missing list and first failure logs remain unchanged. A fresh execution of the frozen protection checker, with only its output destination redirected, still exits 1; no assertion or baseline was relaxed. See [recovery report](recovery-14-20261124/REPORT.md), [source/target receipts](recovery-14-20261124/restoration-receipt.json), and [remaining list](recovery-14-20261124/remaining-missing.json). Sections 1-7 above describe the prior 3261ba6cc archive snapshot with 151 missing files; this section records the newer recovery status.

This update only restores historical bytes and appends evidence/ledgers. No historical script was executed or screenshot regenerated. Source, tests and frozen inputs are unchanged; gates were not rerun. Functional acceptance remains bound to frozen SHA `6202c1164aab14bec1a7353eadc8e5a522a3d259` and the actual results in sections 3-4, never to the new archive HEAD. Main workspace/env, closeout and sparse configuration remain unchanged. No Live, real PostgreSQL, port4312, push or main merge. Restored originals retain their prior ignored/untracked status; historical sparse rules were not expanded.
