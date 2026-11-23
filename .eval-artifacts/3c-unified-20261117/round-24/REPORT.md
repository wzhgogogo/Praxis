# Round 24 — Phase 3C 离线收口

Evidence status: frozen offline regression / draft, not integrated. 本轮 B1–B5 与六项 UI/投影机制全部通过离线验收；不声明真实来源或真机签收。

- 原树 `/private/tmp/praxis-3c-unified`；分支 `codex/feat-web-photos-unified`。
- 起点 `5bca135c88da8b3ea62dd100aed3d401dfa036a4`。
- 唯一签收冻结 SHA **`f036b7a0ea569ec41518837c4806b7b01f50578f`**；`src` tree **`e9e1f96a31928af04fbc0db00dad14902c905ba6`**。
- 冻结后源码零修改；全部正式运行绑定该 SHA，运行前后净树。最终本地归档 HEAD 由包含本报告的 Git 提交标识，交付回复列出其完整 SHA。
- 仅本地提交，无 push/main merge；不加载 `.env`，0 Live/真实模型/Google/餐厅网站/真实 PostgreSQL/4312。

## 修复与实际结果

| 项目 | 实际验证 | 结果与证据 |
|---|---|---|
| B1 待答编辑选店与条款 | P1-0-8 回放组件，普通/待答两路点名选择；390/1440 经真实HTTP编辑19:00–19:30、重载、显式选19:00打开交接，选店与取消费100%/Card required均保留。旧问答只有一条取消终态；原409原子回滚/FAILED对照保留 | PASS；`observations/backend.json` choices、`ui-handoff-shortlist.json`；正式B1四图 |
| B2 预算与并发隔离 | 默认两路均6次传输=账本6；建案后限额6，两路均3次=账本3，未超限。重叠成功轮6次/冲突轮1次，各自剩余额度和deadline独立；较晚StaleTaskVersionError（服务端409路径）未覆盖成功轮usage或resourceUsage导出 | PASS；`observations/backend.json` choices/overlap；默认门禁含应用入口与网关测试 |
| B3 收藏竞争 | 生成ANSWERED写库前0/1/2次收藏变动；唯一结果始终ANSWERED，最终收藏0/1/0。390/1440真实HTTP两标签、重载持久化四路通过。Stop/改条件/第二问的过期完成事件拒绝写入 | PASS；`backend.json` answerSave/negative、`ui-handoff-shortlist.json`；检查/身份/重试派发在同一任务行锁事务 |
| B4 开放query清理 | 三项/双项英文删除beer仍保留outdoor/wine/地区；日文にある/周辺/付近清理，銀座の/東銀座駅对照保留。390/1440共12次胶囊操作；将服务器实际后继SearchRequest交给生产Google适配器假传输核对wire | PASS；`observations/search.json` query、`ui-target-edits.json`；正式默认Google回归 |
| B5 否定分句 | 固定Age.3晚餐，无标点/.!?, 普通搜索均0、inspectFacts UNKNOWN/GOOGLE_PLACE_TYPE_UNUSABLE；四标点点名控制保留，五条肯定需求搜索/inspectFacts均保留 | PASS；`search.json` filters；原Google21矩阵全绿、普通/点名/详情各入口原始证据在`google21.json` |
| U1 报价时间与旧数据 | 生产报价来源输出evidenceId；同店同URL 17:04 ¥7000与17:05 ¥8000准确分组。PGlite持久化快照去掉quote ID后真实GET/reload/About，歧义报价保留原文与链接、不猜Checked时间 | PASS；390/1440四路，`ui-provenance.json`，`round24-u1-u2-*`四图 |
| U2 同读取去重 | 报价一处Observed price标签；套餐原文不再同时出现在p与blockquote。真实归档Tabelog及原复核WEBSITE菜单×无/有预算×双尺寸8路，结构化价格/类别及无引文条款旧控制保留 | PASS；`ui-provenance.json`；`src/harness/browser/fixtures/round24-provenance/*-menu.json`记录原件路径和哈希 |
| U3 淘汰店外链 | HIGH、LOW、同域别店、同店菜单、显式LOW库存、双方缺sourceEntityId及provider/MEDIUM/HIGH库存/Google fallback；缺ID不借用身份，humanUrl过滤保留 | PASS；`observations/links.json`10行；正式默认测试保留原Round23安全URL对照 |
| U4a 原生缩放/多指 | 390从2 of 8执行原生CDP pinch，实测scale=1.8000，前后计数均2 of 8；恢复scale=1.0000后双向单指翻页、About纵向滚动、下一轻点开Viewer正常。补充第二指先抬起的PointerEvent状态机对照 | PASS；`observations/photo-390.json`，正式中间张缩放/纵滚图 |
| U4b 桌面鼠标 | 1440无触屏真实鼠标拖95px：About1→2、Viewer2→3，原生图片拖放不接管；等待当前图解码后取图。轻点/箭头/键盘/署名新标签保留 | PASS；`observations/photo-1440.json`，正式About/Viewer鼠标图 |
| U5 吸烟限定语 | 录制页面原字段Designated smoking area (heated tobacco only)，双尺寸答复弹层与历史只留状态引文，正文逐字保留；About原字段仍保留，390来源页脚一行不溢出。原支付/分组/未知值/Handoff对照保留 | PASS；`ui-provenance.json`；`round24-u5-*`四图 |

## 正式五门禁

| 门禁 | 退出码 | 耗时 | 计数 |
|---|---:|---:|---|
| typecheck | 0 | 0.746s | PASS |
| arch-check | 0 | 0.208s | PASS |
| test | 0 | 82.006s | 1881/1881 |
| browser-fixture | 0 | 476.346s | G2 5/5；Chromium 554/554；G6 159/159（559为G2+Chromium汇总，不另加计） |
| build | 0 | 0.610s | PASS |

原始输出与逐项清洁状态：[gates/manifest.json](/private/tmp/praxis-3c-unified/.eval-artifacts/3c-unified-20261117/round-24/gates/manifest.json)，同目录五份`.log`。浏览器Fixture入口无外层sandbox-exec，Replay子进程沿用原OS隔离；其他门禁OS禁止外连，仅允许回环。没有删弱sandbox断言。

严格架构：`strict: true`，18个浏览器模块/18个单元素SCC，0 any/抑制指令，0环/反向entry导入；19份tsx/dist JS资产逐字一致，HTML/CSS相同。见 [browser-dependencies.json](/private/tmp/praxis-3c-unified/.eval-artifacts/3c-unified-20261117/round-24/browser-dependencies.json)、[browser-dependencies.dot](/private/tmp/praxis-3c-unified/.eval-artifacts/3c-unified-20261117/round-24/browser-dependencies.dot)、[build-assets.json](/private/tmp/praxis-3c-unified/.eval-artifacts/3c-unified-20261117/round-24/build-assets.json)、[html-build-comparison.json](/private/tmp/praxis-3c-unified/.eval-artifacts/3c-unified-20261117/round-24/html-build-comparison.json)。

## 新观测、独立断言与视觉

先在全新空`observations/`运行8个采集入口，10个必需JSON全部存在后写`collection-complete.json`，随后独立进程运行`assert-observations.mjs`。输入36项哈希绑定[input-manifest.json](/private/tmp/praxis-3c-unified/.eval-artifacts/3c-unified-20261117/round-24/input-manifest.json)，每次执行身份/耗时/退出码见[observations/manifest.json](/private/tmp/praxis-3c-unified/.eval-artifacts/3c-unified-20261117/round-24/observations/manifest.json)；全部通过见[observations/assertion-results.json](/private/tmp/praxis-3c-unified/.eval-artifacts/3c-unified-20261117/round-24/observations/assertion-results.json)。

后端独立探针4选店预算+3收藏+3拒绝过期写入+1重叠作用域；搜索16行、原Google矩阵21行、身份投影10行。UI独立执行36条旅程，采集314条原始断言操作数及DOM/截图后另行判定。**UI采集复用冻结的正式Fixture旅程，不宣称第二套独立黄金或模型质量评审**；后端/搜索/身份探针为独立入口。旧复核脚本只读引用/移植到本批，未在原目录执行。只有新观测被断言读取。

历史10条用户路径（两条原人工顺序+八条其余路径）全通过，`PRAXIS_REVIEW_EXPECT_SOURCE`明确绑定冻结`src tree`而非commit SHA。见[history/manual-user-routes.json](/private/tmp/praxis-3c-unified/.eval-artifacts/3c-unified-20261117/round-24/history/manual-user-routes.json)、[history/reported-front-end-paths.json](/private/tmp/praxis-3c-unified/.eval-artifacts/3c-unified-20261117/round-24/history/reported-front-end-paths.json)。

正式390×844/960×900/1440×900：16/16；Style1：6/6；状态回归：139/139（含36项Round24及103项旧状态）。PNG数量：formal 41、style1 6、states 166。Round23/24每项的测试名、实际输入文件和92张对应PNG逐一核对，见[ui-screenshot-contract.json](/private/tmp/praxis-3c-unified/.eval-artifacts/3c-unified-20261117/round-24/ui-screenshot-contract.json)、[ui-screenshot-verification.json](/private/tmp/praxis-3c-unified/.eval-artifacts/3c-unified-20261117/round-24/ui-screenshot-verification.json)。全部联系表与关键原图目检记录见[contact-sheet-index.json](/private/tmp/praxis-3c-unified/.eval-artifacts/3c-unified-20261117/round-24/contact-sheet-index.json)、[visual-inspection.json](/private/tmp/praxis-3c-unified/.eval-artifacts/3c-unified-20261117/round-24/visual-inspection.json)。

关键原图目录：`final/states/`。包括双尺寸双读取报价/legacy未知时间、真实Tabelog菜单、390吸烟弹层/历史、中间张1.8缩放与1440双入口鼠标拖图。采集器另存40张图于`observations/screenshots/`，与正式状态图分开。

## 证据边界与诊断保留

- `baseline-b1-b3.log`、`baseline-slice2.log`保留修复前红灯；初始预算核对漏计自动商业条款调用，后修正为**所有**传输，初始此类oracle失败不计作产品缺陷证明。
- `slice1-targeted.log`的测试编排等待/恢复页面假设错误保留；纠正后36/36通过。`u1-u2-targeted.log`的假模型finishReason、`u4-targeted.log`等待gallery时机、元数据精确断言输入修正均留原日志。
- `pre-freeze-default.log`1878/1881：三项旧对象期望缺evidenceId。新字段独立验证来源身份后保留全部历史文本/状态比较，31项受影响回归通过；最终默认1881/1881。
- 首冻结`173f517a4d8785b6699f4a6f31b76d1a292d72c3`五门禁全绿，但预检拖图截图过早取到加载帧。仅暂停等待中的外层编排，活动门禁完整完成后结束编排；全部结果保存在[attempt-173f517a/NOTE.md](/private/tmp/praxis-3c-unified/.eval-artifacts/3c-unified-20261117/round-24/attempt-173f517a/NOTE.md)及其gates。补齐当前图加载等待并保留Google21原始证据后重新冻结为本报告SHA，**从头重跑全部正式验收**；13个生产文件相对首冻结差异为0。两次结果不混作同一待验提交。
- 同一最终冻结SHA首次默认门禁1880/1881，未修改的location-suggestion SCRIPT场景21.596秒返回0而非5；后续门禁立即停止。`attempt-f036b7a0-default/`保存原失败，原断言/原超时的隔离诊断3.884秒返回5家并通过1/1，见`location-script-diagnostic.log`。未修改代码、输入、断言、超时或并发度，随后从空目录重跑同SHA全部五门禁与后续验收。本轮不把原因未确认的间歇波动改写为已证实的环境缺陷，也不删除失败记录；持续稳定性仍需关注。
- U3探针还原样记录`domainCurrentFactIds`：人工构造双方sourceEntityId缺失时，受保护的`read-assessment.ts:69–70`现有helper仍可能返回该fact。本轮外链投影已拒绝借用并通过指定对照；未修改该Domain文件，也未证明生产来源可构造此状态。此范围外观测留待后续复核，不声称整个Domain的非空校验已修复。
- 旧复核称Tabelog的归档片段实际为WEBSITE/gorp.jp。本轮保留该对照，并额外使用真实Tabelog归档字段：Shibuya Excel Hotel Tokyu页面的原文`Menu / Food / Breakfast available`，在原记录中同时属于listedCourseDetails与COURSE_DESCRIPTION。它证明该字段按原来源/读取时间只展示一次，不证明完整套餐提取质量；较长日文菜单仍由原WEBSITE记录覆盖。两个Fixture各记来源哈希，未改历史原件。
- U1/U2为真实本地服务+PGlite持久化投影Fixture；U5用真实录制字段和受控答复DTO，只证明UI保持正文/引用/布局。P1-0-8为模型回放组件；均不宣称新的真实模型、完整网站Replay或Live成功。

## 保护、收尾与未测项

11413份原历史证据与853个受保护文件哈希零变化；13个获准生产文件之外无变更，包/lock/schema/迁移/Prompt/搜索指纹/missingBlockingFields保护。主工作区HEAD/status/index/diff、主.env与本树稀疏配置相同；closeout的950份现存材料和原登记状态与Round23一致（其.git原已缺失，本轮未修复或触碰）。见[protection-verification.json](/private/tmp/praxis-3c-unified/.eval-artifacts/3c-unified-20261117/round-24/protection-verification.json)、[closeout-protection.json](/private/tmp/praxis-3c-unified/.eval-artifacts/3c-unified-20261117/round-24/closeout-protection.json)。未读写私有Holdout、未改评分口径。

全部自启Chromium、回环HTTP/SSE及PGlite在finally收尾，进程核验见`process-cleanup.json`。保护复核和本地归档后保持净树，冻结后`src` diff0。产物SHA256见`artifact-sha256.json`（清单自身排除，避免自引用）。

| 尚未覆盖 | 状态 |
|---|---|
| 真实手机软键盘 | NOT_EVALUATED |
| 真机双指缩放 | NOT_EVALUATED（Chromium模拟单列通过） |
| 真实Live来源/Google/模型 | NOT_EVALUATED |
| 真实PostgreSQL/praxis_smoke | NOT_EVALUATED；本轮未连接/写入 |
| 4312桌面+真机走查 | NOT_EVALUATED；本轮未启动/触碰 |

剩余观察：location-suggestion SCRIPT间歇失败根因未确认；U3纯构造的Domain helper空ID观测尚未证明生产可达。本轮未扩展到这两处保护范围外实现。停在离线签收，等待随后本地4312桌面与真机走查确认。
