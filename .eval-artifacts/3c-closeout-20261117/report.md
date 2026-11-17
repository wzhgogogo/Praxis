# 3C 第一步：主线同步与双尺寸离线联调

- Status: draft / not integrated；本轮剩余离线执行与定位完成，Replay完整性仍未通过，非Clean Baseline。
- Date: 2026-11-17（Asia/Shanghai）
- 本轮边界：仅外层编排/本地证据/报告；产品代码、测试断言、原录制、评分口径均未改。不加载.env，不连接/写入本地PostgreSQL，无真实模型/Google/网站/Live，不合main/推送。

## 工作树与冻结

复用 `/private/tmp/praxis-3c-closeout`，分支 `codex/feat-web-workspace-3c-closeout`，起点 `ecba80c0d53957e1dff9a1655f7af58d1a032764`。稀疏check持续通过，原33个浏览器材料与83个Replay材料保持可用；没有清理、全选历史或复制其他树。

| 对象 | 完整 SHA |
| --- | --- |
| 已整合 slice2 | `738c2c1ea582c8d535a9cd2d67f6e00e29c2c707` |
| 已整合 origin/main | `dbc2d9c55bb9dd759a17551cbe9c11af6b1073b0` |
| 本轮首次编排冻结 | `13551319f49ba9c4870e1d2af3b8a98724015bbf` |
| **最终五门禁、双尺寸Smoke、D01/D02实际测试** | **`bd9fa5c8cda3787b3928eafc2d86f137c390f08b`** |
| 原Replay输入清单冻结 | `8dd1d4de31fa05742d1e3b55b71ca3c50b208afe` |

本轮不另同步浮动main，保持用户指定组合版本。两项read-assessment行为沿用前轮已核对结果：同日期/人数/时段等请求指纹的PARTY_SIZE_NOT_SELECTABLE过滤，以及显式续查同时排除已交付与noVerifiedResult已调查候选。src/scripts/package/lock/web-skills相对起点diff为0；所有生产/测试字节不变。

主目录HEAD、status、index哈希与本轮preflight完全一致，保护记录见 `post-verification-protection.json`。现有原始文档、账本、.env和分流配置没有写入主目录。

## 编排修复与首轮材料问题

`run-gates.py` 对 browser-fixture 直接执行npm，不再外套sandbox-exec；runner-replay.test.ts自身OS隔离及其断言原字节保留。type/arch/default/build仍可各自使用单层OS隔离。所有进程只继承PATH/HOME/TMPDIR，不加载.env。原20261116失败日志保持；本轮首次日志移入 `gates-attempt1/` 后本地提交，未覆盖。

13551319f首轮：type/arch/default1663通过，G2 5/5、Chromium346/346，runner-replay自隔离通过；G6 **151/159**，8失败均ENOENT。首缺路径：

`.eval-artifacts/phase3b/category-discovery-cost-20261110/runtime/D01/D01/evaluation.supplement.input.json`

按4份失败测试的实际直接读取闭包，从本树HEAD精确恢复 **21文件**，21/21 SHA256一致；没有放宽断言、跳过测试、修改评分或恢复整目录。详见 `g6-material-closure.json` / `g6-material-restore.log`。连同原33+83，本轮结束137文件全部与HEAD一致。恢复后再次冻结干净提交，完整重跑五门禁，而非只跑G6或用局部通过替代。

## 最终五门禁：同一净树提交全部通过

入口：`python3 .eval-artifacts/3c-closeout-20261116/run-gates.py`。原始输出、逐项真实退出码/耗时/前后净树/调用方式在 `gates/manifest.json`，计数汇总在 `verification-summary.json`。每项SHA均为bd9fa5c8c，每项前后Git干净。

| 门禁 | 退出码 | 计数 | 墙钟耗时 |
| --- | --- | --- | --- |
| npm run typecheck | 0 | 非测试计数 | 0.547s |
| npm run arch:check | 0 | 非测试计数 | 0.196s |
| npm test | 0 | **1663/1663** | 58.825s |
| npm run test:browser:fixture | 0 | Chromium合计351/351，另G6 159/159 | 355.222s |
| npm run build | 0 | 非测试计数 | 0.530s |

browser分列：G2 **5/5 / 24.618s**；其余Chromium **346/346 / 292.952s**；Chromium合计 **351/351 / 317.623s**；G6 assembly **159/159 / 37.362s**。各组0失败/跳过。没有单独追加strict G2声明。这些计数不能替代下列独立HTTP/SSE冒烟。

## 本地 Chromium 双尺寸 Fixture 联调

使用既有 `smoke.mjs`，仅改输出目录，不改其任何断言。`startWorkspaceFixture({multiSlot:true,questions:true})` 使用PGlite迁移、createLocalWebServer、应用/Interpreter/Compiler/Router/Runtime及原HTTP/SSE，只有模型/来源/问题传输为Fixture。浏览器Date对齐host.clock；固定Fixture时钟为2026-10-29T10:00:00Z、示例需求日期2026-11-02，**不是当前库存**。

执行入口为单层sandbox-exec（禁止非回环外连）+ `node --import tsx .eval-artifacts/3c-closeout-20261116/smoke.mjs`，context在首个page创建前拦截全部非本地URL，覆盖popup。总耗时 **3.461s**，退出0，前后干净，测试SHA与最终五门禁相同。

| 观察 | 390×844 | 1280×900 |
| --- | --- | --- |
| 登录→页面输入Dinner for two→进展与结果 | PASS | PASS |
| 实际SSE收到 | 10条 | 10条 |
| 2→3 guests原位编辑走/messages，未发草稿保留 | PASS | PASS |
| 详情单输入框走/questions；ANSWERED、当前candidate及引用身份一致 | PASS | PASS |
| 第二可用时段19:30的B1，刷新后恢复 | PASS | PASS |
| POST /booking-departures返回201，SQL行对应第二offer | PASS | PASS |
| 新标签页外站导航拦截，真实来源GET=0 | 1条预期拦截 | 1条预期拦截 |
| pageerror / 非预期HTTP / 应用console异常 | 0 / 0 / 0 | 0 / 0 / 0 |

两端同一Fixture绑定：

- candidateId：`fixture:outlet`
- offerId：`offer:tablecheck:fixture:outlet:2026-11-02:19:30:3`
- 服务端B1与被拦截导航URL：`https://www.tablecheck.com/en/shops/fixture-sushi/reserve?start_date=2026-11-02&start_time=19%3A30&num_people=3`
- 独立SQL `restaurant_booking_departures` 返回candidate_id、offer_id均与上两项完全一致，provider TABLECHECK。仅PGlite内存数据库有本地测试写入，无本机PostgreSQL或真实预约写入。
- G1引用identityEvidenceId独立回查artifact.readEvidence，候选/provider均一致；引用URL与该B1的商户基础URL一致。详见 `smoke-analysis.json`。

**预期错误单列：** 每尺寸登录前GET /api/session有1次401，并出现对应浏览器资源console error；这是未认证启动检查，随后登录成功。它们没有被报告成“console记录零条”。预期外站GET导航每尺寸1条被context.abort拦截，没有外站响应/真实网络GET；其URL留在各尺寸JSON中。

共 **10张完整流程截图**（每尺寸progress/results/inline-edit/g1-answer/second-slot-restored）及 **2张移动端滚动补证图**，12张均目视检查并记录尺寸/SHA256，见 `screenshots.json`。长卡片不要求全部文字同屏：390px初始卡片底部处于固定composer后方，原生动作滚动后Choose按钮完全可见；补证elementFromPoint命中Choose/出发/核对提示，且均在composer上方。未改CSS或测试断言；补证不是另一条完整Smoke，也不是第二时段截图。入口以仓库cwd运行 `node --import tsx --input-type=module - < .eval-artifacts/3c-closeout-20261117/layout-probe-command.mjs`，元数据见 `layout-probe-run.json`。

关键截图：[手机第二时段](smoke/mobile-second-slot-restored.png)、[桌面第二时段](smoke/desktop-second-slot-restored.png)、[手机滚动后Choose](smoke/mobile-choose-actionable.png)、[手机核对提示](smoke/mobile-handoff-footer.png)。原始JSON/HTTP/SSE/console/SQL分别在 `smoke/mobile.json`、`smoke/desktop.json`，并保留两份artifact。iPhone Safari / Android Chrome真机仍未验收。

## D01 / D02 原样Replay：具体匹配缺口

271项原冻结文件再次逐Git blob核对全部一致；原83文件及所有录制原件不改。使用原 `run-observed-source-replay.ts`，不使用targeted entry，不注入Fixture响应，不补模型输出。`observe-replay.mjs`仅旁听浏览器request与Google requestJson实参，原样委托；不改URL/方法/正文/返回/资格/模型决策。每例是单层OS禁止**全部**外连执行，既没有门禁外层嵌套，也没有外部fallback。

| Case | 耗时 / 进程退出 | 实际终态 | 独立分类 |
| --- | --- | --- | --- |
| D01 | 9.749s / 0 | FAILED | REPLAY_INCOMPLETE |
| D02 | 14.492s / 0 | FAILED | REPLAY_INCOMPLETE |

退出0仅说明原runner完成并保存产物，**不表示Replay成功**。两份最终State均保存 `NETWORK / Model decision failed: NETWORK`；原runner另记restaurant_agent_decide offset7没有剩余录制输出。该下游标签不是本轮真实网络服务失败。具体请求和raw HAR逐字段比较在 `replay-analysis.json`，原始result/observed-requests各自保留。

### D01

首缺当前GET：

`https://tabelog.com/en/suggest/keyword_suggest?keyword=Spanish&no_display_area_suggest_flg=true&station_id=5779`

原HAR同路径唯一响应为GET `...?keyword=Takadanobaba`，**HTTP200、application/json、响应体存在**；该Takadanobaba请求本次也被观察到并可精确匹配。缺口是 `keyword: Takadanobaba → Spanish`，以及当前新增 `no_display_area_suggest_flg=true`、`station_id=5779`；方法/空请求体一致。不是“原HAR没有keyword_suggest响应体”。

后续 `/en/rstLst/` 请求含utf8及9个空表单字段；raw HAR没有同路径响应，manifest没有该请求URL可接纳页，记DOCUMENT_NOT_QUALIFIED。之后原模型输出耗尽、INITIAL与原PRESENT_RESULTS分歧；最终FAILED，不冒充诚实无结果。

### D02

首个结果页：

`https://tabelog.com/en/rstLst/?utf8=%E2%9C%93&pal=&LstPrf=&LstAre=&station_id=&area_datatype=&area_id=&genre_name=&sw=Nakano+City&search_mode=`

后续还有相同字段但sw为空的结果页。两者在原HAR都没有同路径响应，manifest也没有对应合格页，**仍无当前请求可接纳的结果记录**。没有把缺记录替换为零结果响应。

两份Google详情分别核对：

| 当前GET路径 | query / body | raw HAR同路径记录 | 结论 |
| --- | --- | --- | --- |
| `/v1/places/ChIJ0ZqAJnfzGGARU5isJ5bYrhY` | 无 / 无 | 0 | MISSING_GOOGLE_RESPONSE |
| `/v1/places/ChIJx8njvZbyGGARg-JtPMy7c4Q` | 无 / 无 | 0 | MISSING_GOOGLE_RESPONSE |

这两项不是已有同ID响应的参数顺序或POST正文差异；对应place路径本身未录入HAR。fieldMask仅作旁听记录，不是原recordedResponse匹配键，不能把缺口归因到header变化。

另一个当前缺口是 `keyword_suggest?keyword=Dai%20Ni%20Chikara%20Shu%20Zo`。原同路径三个200 JSON分别对应Nakano City、Nakano Robata Sumika、Guttsu；不是该keyword的响应。所有原件保持，没有回源或伪造响应。

### 四层评价边界

端到端：两例FAILED，无本次合格交付/诚实无结果声明。逐环节：请求URL/方法/query/body与原响应资格的具体差异可证明，后续整链路未闭合。严重程度：没有完整来源/声明独立oracle，不声称整体S0=0，整体Replay保持NOT_EVALUATED。归因：上述覆盖/匹配缺口由raw HAR与旁听请求直接支持；是否来源录制/隐藏表单状态与当前执行的更深分歧，未做因果确认，不借本轮改产品或原录制。Fixture通过不消除Replay缺口。

## 最终边界与下一步

本轮零PostgreSQL连接/写入；G6和Smoke的本地持久化均为PGlite。未加载.env、没有凭据探针、没有Live开关或真实网站请求。仅本地提交，src/测试断言/评分/原录制不变，主目录保护核验通过。

当前新增证据是“五门禁全绿 + 本地Chromium双尺寸完整Fixture链路 + D01/D02当前不完整Replay的精确定位”。它不构成真实来源可用性/当前库存或真机签收。**停在第2步真实LIVE_READ冒烟之前，等待用户确认；不自动执行。**
