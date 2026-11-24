# Round 27 — 3C 收口修复与离线验收

- 证据状态：**frozen offline regression / draft, not integrated**。本轮 SEM-1、UI-1–UI-7 及四条补充要求离线通过；历史原件整体签收仍为 **BLOCKED_BY_MISSING_HISTORICAL_ORIGINALS**。
- 工作树：`/private/tmp/praxis-3c-unified`；分支：`codex/feat-web-photos-unified`。
- 起点：`bb2a541ad36655d1ffcd8bfe72d2ddc95dcbb59b`，`src` tree `34b625c0810d5b0bb780bd8902da8d3c6ff889bb`（Round26 冻结 `6a5f782979054c3d04e01655b73e10cb1ef1c694`）。
- Slice A 独立提交：`93b929a3518a713c0e04630901cf1706f5c2f1c2`。
- **本轮唯一最终验收 SHA：`937d44be67fb8f5b735743bc1666040cc6c551b7`**；`src` tree：`69da89954e4c74c0d08b6956219c05d3fb1d0679`。以下完整门禁、C1、资产、截图和保护结果均绑定此 SHA。
- 验收前后各阶段均为净树，未加载 `.env`。归档提交只追加本目录证据与四份账本，`<freeze>..HEAD -- src/` 必须为空。最终归档 HEAD 见交付回执和 Git 日志，不将归档提交冒充运行过的 SHA。

## 1. SEM-1：由本轮原文绑定相对日期

[ADR-0052](../../../docs/decisions/0052-relative-day-offset-and-date-binding.md) 补充 ADR-0024。DATE 新增整数 `relativeOffsetDays: 2..365`；语义 Prompt 升为29，替换当前字节指纹及全部调用方。proposal@4、持久状态及 temporal policy@6 无兼容分支/迁移；确定性 basis 为 `RELATIVE_OFFSET_DAYS:N`。编译器和 scorer 显式区分 +2/+3，评分政策不变。

确定性边界核对当前消息及模型 raw；单一明确的相对日按信任东京自然日物化，模型错算或漏 DATE 均不再沿用错误旧日。多日歧义、越界/负数/小数、模型 raw 虚构相对日等进入既有 CONFLICT/澄清路径。只改时间仍继承原日期；未更改 `intent-state.ts`、`missingBlockingFields()` 或搜索指纹。

实际消息入口使用生产解释器、持久应用与 PGlite，模型及查位端口为本地假实现。已存在日期11月25日，信任东京日期11月24日，用户改为「后天晚上七点」：

| 假模型回包/对照 | 最终阶段 | 持久日期 | 实际查位日期 | 调用数 |
|---|---|---|---|---:|
| 正确 +2 | PRESENT_RESULTS | 2026-11-26 | 2026-11-26 | 3 |
| 错误 TOMORROW，raw后天 | PRESENT_RESULTS | 2026-11-26 | 2026-11-26 | 3 |
| 错误2026-11-25，raw后天 | PRESENT_RESULTS | 2026-11-26 | 2026-11-26 | 3 |
| 完全漏 DATE，仅 TIME_WINDOW | PRESENT_RESULTS | 2026-11-26 | 2026-11-26 | 3 |
| 真实多日歧义 | NEEDS_INPUT | 保留2026-11-25 | 无 | 0 |
| 只改晚上七点 | PRESENT_RESULTS | 2026-11-25 | 2026-11-25 | 3 |

逐例原始观测：[semantic-message-observations.json](semantic-message-observations.json)，来自正式 [gates/test.log](gates/test.log)，无真实来源调用。+2/+3 冲突、边界拒绝、跨月/跨年及 TODAY/TOMORROW 由正式默认测试覆盖。

基线红证据 [sem-1-baseline-loopback-red.log](sem-1-baseline-loopback-red.log)：6例中5失败、仅时间继承对照通过；早先 EPERM 启动诊断不作缺陷证据。Slice A 组合定向 **60/60** 见 [slice-a-combined.log](slice-a-combined.log)。

## 2. UI-1–UI-7 及补充要求

全部15条 `Round27 UI:` 在正式 Chromium 门禁实际运行。文件：`src/harness/browser/web-workspace-round27.test.ts`；实际用例名、文件SHA、截图和观测绑定分别见 [visual-inspection.json](visual-inspection.json)、[visual-inventory.json](visual-inventory.json)。

| 项目 | 实际离线结果与证据 |
|---|---|
| UI-1 | 390/1440 问答待回答状态与 Stop 同行、左右对齐；透明下划线、热区≥32px；实际 DELETE200、同handle、pageQuestion CANCELLED。`visual/round27-ui1-*-pending-stop.png`。 |
| UI-2 | Confirmed 精确 `rgb(54,75,138)` / weight500 / 无背景；About深墨、外链中灰；引文蓝线/已收藏蓝书签等保留。390/1440 卡片与详情计算样式通过。`round27-ui2-*-card.png` 及 UI7 图。 |
| UI-3 | 纯事实推荐隐藏 refresh；推荐但有位及 AVAILABILITY 保留 Refresh availability；实际刷新 POST200 并新增本地 provider 调用。`round27-ui3-*-pure-facts.png` / `availability-refreshed.png`。 |
| UI-4 | 390/1440 问答历史 `summary.top` 差均0；贴底弹层 `summary.top-sheet.top` 差均0，tap highlight透明。弹层自身增高向上移动114.28125px是保留行为。`round27-ui4-*-before/after.png`。 |
| UI-5 | 延迟 retry/more/capsule-save/capsule-remove 四条请求发出即隐藏旧空态；胶囊保存/删除明确验证 sending=false、researching=true。四条注入500后恢复原空态及可用操作；SSE先到 deferredView 时运行进度显示、旧空态隐藏。`round27-ui5-*` 共9帧。 |
| UI-6 | 390px 模拟 visualViewport.height=360，当前已暂停的活动读轮 Stop完整可见，高于composer；真实点击DELETE200，原handle，`view.case.stopped:true`、progress停止、草稿保留。双时段和可删文本编辑独占整行，输入与✓/×/删除不重叠；实际Save/Remove200及持久intent变化通过。`round27-ui6-390-*`。 |
| UI-7 | 实际渲染的CATEGORY引文同文则省略Categories；Google额外分类保留；CATEGORY已折成纯页脚时也保留Categories。390/1440三组对照通过。`round27-ui7-*`。 |

UI2/UI7 使用显式投影视图控制展示分支，属于 UI oracle，不冒充来源提取回归；UI4沿用生产问答行Fixture。15个旅程经实际回环HTTP/SSE、Chromium、PGlite运行并断言无未捕获pageerror；四次人工500是预期失败恢复，不宣称本轮另有覆盖全控制台/所有HTTP错误的独立采集器。

本轮34张PNG、34份JSON均为最终冻结SHA；4张联系表覆盖全部图，另逐张打开18张关键原图。图像路径与人工目检说明见 [contacts/index.json](contacts/index.json)、[visual-inspection.json](visual-inspection.json)。图中合成封面占位是Fixture输入。手机键盘图为视口模拟，滚动露出Stop时标题可暂时滑到固定页眉下方；不宣称真机软键盘已验收。

Source实测：390历史581.796875→581.796875；1440历史550.546875→550.546875；390弹层内部163.640625→163.640625；1440弹层内部140.390625→140.390625。手机Stop bottom262.375 < composer top282 < visualViewport height360。

基线选定6条UI探针6失败，见 [slice-b-baseline-red.log](slice-b-baseline-red.log)；新15条及受影响旧用例组合 **53/53** 见 [slice-b-compatible-browser.log](slice-b-compatible-browser.log)。这些开发定向计数不叠加到正式门禁分母。

## 3. 最终冻结全套门禁

按本轮要求顺序 **Typecheck → Arch → Build → 默认测试 → Browser Fixture**。额外C1 dist在Build之后运行。逐项完整命令、SHA、src tree、退出码、耗时和净树回执见 [gates/manifest.json](gates/manifest.json)；全程最小环境不加载dotenv。Browser Fixture外不套sandbox-exec，Replay子进程保留原OS断网断言；其余门禁及dist C1使用OS仅回环外连隔离，本轮新UI浏览器context拦截全部非本机目标，其余Fixture使用各自离线宿主/Replay隔离。

| 阶段 | 结果 | 退出码 | 外层秒数 |
|---|---|---:|---:|
| typecheck | PASS | 0 | 0.707620 |
| arch-check | PASS，0 forbidden dependencies | 0 | 0.194585 |
| build | PASS | 0 | 0.566433 |
| test | 1951/1951 | 0 | 73.688401 |
| browser-fixture | G2 5/5 + Chromium 593/593；G6 159/159 | 0 | 480.800673 |
| c1-built | 4/4（Build 后） | 0 | 12.869066 |
| assets | 19/19 JS + HTML/CSS 一致 | 0 | 0.197409 |
| graph | strict=true；18 模块；0 环 / any / 抑制指令 | 0 | 0.044790 |
| protection | 本轮无新增保护偏离；既有137缺件仍阻塞整体签收 | 0 | 2.756445 |

Browser明细：G2 5/5，24249.275375ms；Chromium 593/593，418421.327125ms；二者合计598/598，442724.373ms；G6 159/159，37806.513375ms。合计598不是额外一组测试。新增15条UI已包含在593内。

C1源码4/4包含在正式Chromium；构建版 [c1-built/test.log](c1-built/test.log) 4/4，12742.427709ms；[c1-built/manifest.json](c1-built/manifest.json) 记录同SHA新dist的6个生产/宿主模块哈希和唯一必要JSON输入。宿主使用createLocalWebServer + PGlite + 回环CDP驱动生产会话路径，无真实Cloudflare凭据或PG。

[build-assets.json](build-assets.json) 确认19/19同源JS逐字节相同；[html-build-comparison.json](html-build-comparison.json) 确认HTML含CSS一致。[browser-dependencies.json](browser-dependencies.json) / [.dot](browser-dependencies.dot) 含类型边，strict=true、18个单元素SCC、0环，0any/抑制，无模块反向导入entry。依赖及CSP策略未改。

## 4. 失败保留与重新冻结

- 第一候选 `aa3024862d77ff33bc0092b40c97e382e439057d`：type/arch/build通过；默认1951中1935通过、16失败（13个C6a子项及父项、2个H002）。合成模型raw带today/tomorrow而当前消息不带该相对日，正确被新绑定防线拒绝。只调整两处**编写型测试输入**：C6a明确today/right now；H002固定日raw改为同一个日历原文。原业务、请求数量、幂等与刷新断言保留。22/22定向通过后重新冻结。原件 [failures/aa3024862-first-gates/](failures/aa3024862-first-gates/)；Browser/G6/dist等在该候选未运行。
- 第二候选 `ee65065b80a082023ce4b1c6f78c2880618cbb83`：默认1951/1951，G2 5/5；Chromium591/593，新增15条全通过。旧手机胶囊固定占位断言与获准流式布局冲突；旧Stop断言在HTTP200后未等待JSON接受/render完成。保留完整桌面占位断言，手机验证独占行/邻居/可见控件；Stop补强活动读轮、同handle与stopped:true后等待进度消失，再保留原按钮断言。4/4定向通过后重新冻结。原始日志及34张图保存在 [failures/ee65065b8-browser-compatibility/](failures/ee65065b8-browser-compatibility/)；G6及后续未运行。
- 最终 `937d44be67fb8f5b735743bc1666040cc6c551b7` 从净树完整重跑，以上表为唯一当前验收结果。第一候选后**产品实现未再改变**；后两次冻结只调整上述测试和本轮输入/保护名单，未删除或放宽生产日期绑定与Stop安全边界。[REFREEZE.md](REFREEZE.md) 保留过程；历史失败目录的运行期绝对路径应按其归档位置解释，原始内容未改写。

## 5. 保护面与清理

[protection-verification.json](protection-verification.json)：开工时本树物化历史12380/12380匹配，新增缺失0、现存改动0；其中round25 708、round26 11均未改。主目录HEAD/状态/索引/差异、主.env哈希、稀疏规则不变；closeout950份现存材料不变，既有缺.git状态未修复；8份根配置/依赖清单不变，源改动均在授权白名单。

补充按原Round25历史总表复核：[original-history-verification.json](original-history-verification.json) 为 **12501/12638匹配，137既有未跟踪原件缺失，现存变更0**；原始缺失清单、失败日志、已授权14路径恢复原件均保留。本轮未新增恢复，也未伪造材料。因此本轮保护增量PASS不代表整体历史签收PASS。

[21份冻结输入核对](frozen-input-verification.json) 全匹配。[cleanup-verification.json](cleanup-verification.json) 确认验收进程exit0，未发现遗留Fixture Chromium/HTTP/CDP测试进程；各测试finally关闭浏览器、回环服务及PGlite连接。未操作其他服务。

[artifact-sha256.json](artifact-sha256.json) 覆盖本轮全部证据（排除清单自身）；[source-freeze-verification.json](source-freeze-verification.json) 记录源码差异为空及账本哈希。最终归档只做本地提交，不推送、不合main。

## 6. 四层评价与未测边界

1. **端到端**：此处签收对象是冻结离线合同。6个真实消息组合、15个浏览器旅程全部完成并通过，34个关键画面完成目检；没有用全门禁数量推导真实用户合格交付率。真实来源端到端结果、首个真实合格结果时刻、真实等待分解与见证漏斗NOT_EVALUATED。
2. **逐环节**：独立期望日期与实际查位参数核对；歧义查位0；DOM样式/几何/有效快照、真实本机HTTP与当前handle停止状态均有明确断言。未为真实发现、身份、事实、可预约性临时造Gold。
3. **严重程度**：离线断言未发现本轮日期错传或Stop错轮；没有独立真实来源证据，**不声明真实S0=0**，Live S0–S4均NOT_EVALUATED。
4. **归因**：基线日期错误/漏字段在语义编译到日期继承边界被复现并纠正；UI状态/布局偏差有基线红与最终DOM/HTTP反证。两次中间候选失败分别归于合成输入契约与旧测试布局/完成时序，失败原件独立保留，不用下游通过改写失败结果。

**NOT_EVALUATED / 未执行**：Live模型/Google/真实餐厅请求、真实PostgreSQL、远端Cloudflare CDP、真机iPhone/Android软键盘/缩放/手势、4312重启走查。本轮没有另跑独立正式16场景视觉脚本或历史用户十路径脚本；不沿用旧批次计数冒充新SHA结果。仅本次关键390/1440截图及正式Browser Fixture中的既有回归属于本轮证据。下一步需先独立复核本地提交；本轮不自动进入Live。
