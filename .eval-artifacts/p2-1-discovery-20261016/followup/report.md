# P2-1 离线收尾与 P2-1a

- 日期：2026-10-17（用户本地时间）；exposed development diagnosis，非 Clean Baseline。
- 起点：git pull --ff-only 至 50a79d9，复核正文与 VPN 补充已通读。用户批准 ADR-0042 Accepted；探测 40 次、模型 450 次上限。
- 本轮不访问真实网站、不调用真实模型，不做网络恢复对照、见证认证、基线重跑、检查点 A、P2-1b 或 Live。仅固定传输及本地 Chromium Fixture；Git 拉取不计业务网络请求。

## 3b 基线准备修正

- 新增 source-data-preflight@1：本批发现探测和 hybrid-live-read 入口在创建模型、正式启动之前，对计划来源的已知区域各读一次。浏览器经现有 Guard 打开列表，不点击；Google 使用既有 Text Search 一次。非空且非忙碌才通过；空结果、超时或读取失败记 ENV_FAILURE 并列来源，单独保存预检产物。不新增重试、代理变更或放宽准入。Google 预检请求单列。
- 发现探测外层识别 preflight-failure.json，0 模型且未启动探测；hybrid 在正式 started 之前失败。下次运行冻结须包含新 Runner、预检代码和已知区域配置的 SHA；本轮不改历史 freeze。
- 指标按发现来源分列：Google 官网 origin 和完整门店路径与见证一致（仅忽略 en/ja 语言前缀）才计入。恶意域名、不同 ID、相似名称不计入。名称启发式和独立复核提出的未确认线索另列，不建立身份。
- 十次旧产物离线重算：原始 summary/trace/decisions/recording 不改；TableCheck 十次失败改记环境问题。h001 #1、吉祥寺 #1 的 Google 未到达记同一环境影响。原始终止码保留，不作为 TableCheck 能力缺失证据。
- Google 三次出现精确见证链接，共四个精确 ID 匹配：h001 #2、吉祥寺 #2、中目黑 #1。中目黑还发现另一 Google 候选指向 13241250；复核所列 Instagram 名称线索仍不计身份。详见 baseline-recomputed.json。
- 有效红绿：03b/metrics-red.log → metrics-green.log；03b/preflight-red.log（空结果误接纳）→ targeted-green.log（成功、空、超时，失败不启动）。初始化路径错误不是有效红灯，普通失败日志保留。
- 四门禁：03b/gates.json；npm test 933/933，typecheck/arch/build PASS。P2-1a 后完整跑五门禁。
- 新增真实模型、业务网络、探测、Live 均为 0。既有 86 模型、10 次探测仍计入 450 模型/40 次探测额度，不因环境归类退款。

## P2-1a

本轮已实现，五门禁全绿，等待独立复核。只改变检索表达式及其有界执行，不实施搜索级空位筛选，不运行检查点 A。

- Planner 保留来源顺序，传全部正向条件、强度和稳定 criterionRef，删除第一个 HARD 原文机械投影。新增独立 `restaurant_discovery_retrieval@1` / `restaurant-discovery-retrieval-prompt@1`，Agent 可选最多三词的关键词、当前可见同地区类别、组合或通用列表。拒绝非法关键词/条件引用及未观察或越地区类别后，记录原因并回到通用列表。
- 目录先观察并选择地区；稀疏（少于五家）或明确空状态在详情之前最多改写两次。已有匹配候选排在队列前，改写不清零调用、时间、详情或页数。地区最多四页、检索最多三页、实际列表文档总共七页；模型 OPEN_LINK、翻页及重复访问计数。来源90秒、全局500秒/50模型和原详情上限不提高。
- 无页面初始文本规划每请求最多一次，TableCheck/Google 共用并随 continuation 保留。目录中的后续改写另按来源有界计数。新增模型调用包括失败，仍受同一 run 和 browser budget 约束；不引入另一 Provider 或隐藏重试。
- 关键词引用仅用于检索，不能变成 HARD 支持、身份、半径或空位证据。空检索保持 sourceExhausted=UNKNOWN，不当作全来源无店或全店无位。推荐目标、来源排序及交付条件的既有组合回归保留。
- 神乐坂真实快照的空状态原文已能被现有 Pack 谓词识别，故没有添加空状态解析规则；问题在于旧执行链未在读详情前改写。截取实际空状态 DOM 存为 `src/integrations/tabelog/fixtures/empty-kaiseki.html`，动态 Chromium Fixture 在 loader 消失后解析该原文并转入可见类别。它是来源片段 Fixture，非整页重放或当前网站验证。
- 删除旧“首批调查后再允许一次类别扩展”及旧 cap/调用假设，分页和已观察候选保留仍由同一路径处理。Pack 将检索表达式读取提升为已有 browser 能力，删除重复目录空状态方法和无用配置；`source-packs.ts` 净减2行（+5/-7），没有新增站点查询规则或空位参数。
- Runner、Web、source-stage probe 和固定来源组合均更新实际接线；Google-only 组合保留原结构化读取，不增加地点观察请求。检索规划有页面观察时，decision capture 关联观察 revision 与已录 DOM；无页面的初始文本规划不伪造 DOM 关联。生产不依赖见证名单或 eval 指标。
- 持久 `restaurant-state@16` 取代 @15，新增检索选择和计数进度；语义、Agent 决策和 browser action Schema/Prompt 不改。无兼容路径或双写；旧开发 Task 应按既有开发重置流程重建，本轮未连接/重置数据库。Gold、变体、见证、种子和历史录制不修改。

### 检错证据与证明边界

| 机制 | 入口与红绿证据 | 证明范围与缺口 |
| --- | --- | --- |
| 机械 HARD 投影、先读详情后改写 | `p2-1a/retrieval-red.log` → `composition-green.log` / 最终默认测试 | 修复前目标断言实际失败；真实 production factory、固定传输，不证明真实模型会选好词 |
| 稀疏/空结果、两次上限、候选保留、分页 | `native-discovery-composition.test.ts`；最终默认测试 | 同一 Guard/网络策略与实际来源 Pack，0 家改写两次后如实 UNKNOWN；原生已有匹配结果保留在前 |
| 关键词格式、条件引用、已观察类别、调用预算 | `discovery-retrieval.test.ts` / `discovery-retrieval-planner.test.ts` | 数字、地点、日期/时间、负向及价格/人数拒绝；失败调用计数、耗尽/截止拒绝；不是资格判定 |
| 已用完地区额度的恢复进度 | `region-page-red.log` → `region-page-green-final.log` | 红灯实际打开第五个地区页；绿灯在导航前拒绝，复用 READ_BUDGET_EXCEEDED 业务原因；区域恢复和检索重施均计入实际页数 |
| 动态空状态与类别作用时机 | `chromium-targeted-initial.log`、最终完整 Chromium 日志 | 实际 Chromium + 离线 HAR 缺项 abort；正例五家、改写一次且早于详情，反例越地区/隐藏类别不可选；不访问外站 |
| 新协议影响既有组合 | `test-final.log`、`browser-final2.log` 保留失败；最终全量日志 | 旧脚本模型遗漏新增 purpose，以及旧空检索 sourceExhausted=true 断言迁移；不删除资格/身份/原始页面查询证据断言 |

L0：批准输入和旧原始 summary SHA 核对；非法提议/预算/指标/预检为离线测试。L1：生产组装的固定来源组合与真实本地 Chromium 完整门禁。旧快照片段只用于 Fixture，本轮没有运行完整 L2 回放或真实模型受控回放。L3：真实探测/Live 未运行，外站可达性、真实模型选词收益、S0 外部独立核验均未新增证据；不以代码绿灯宣称签收或网络恢复。

### 提交与对照点

| 提交 | 内容 |
| --- | --- |
| `35c5dc230843c49d13226cf668587fa083925353` | 来源数据预检、分来源指标、旧基线环境归类与 ADR 批准记录；四门禁933/933 |
| `4315ab88fbab14424968ccbf0833f980c597de51` | 仅评测外层的原生卡点停止谓词修正；**P2-1a 之前的最后提交** |
| 本报告随附的下一提交（父为 `4315ab8`） | P2-1a 实现、五门禁证据及文档；完整 SHA 由本地 Git 提交记录给出 |

网络修复后的基线必须使用 `4315ab88fbab14424968ccbf0833f980c597de51` 的单独干净 worktree，检查点 A 使用紧邻其后的 P2-1a 提交；共同使用已修正的预检、见证指标与外层卡点判断。记录见 `baseline-before-p21a.json`。本轮未新建/运行这两个 worktree，也未修改旧冻结树。

历史 `baseline-freeze.json` 继续保留为旧运行依据，不可拿来启动新版。`next-run-freeze-inputs.json` 仅记录下一冻结需要包含的源码/预检配置/外层 SHA，**不是已经获准运行或已认证的清单**；网络恢复及新见证认证后，须按届时授权重新冻结。

### 最终门禁与用量

最终日志以 `p2-1a/gates.json` 和 `*-final4.log` 为准。早先失败和有效红灯原样保留，不将类型/启动失败当作有效检错。

| 门禁 | 结果 | 日志 |
| --- | --- | --- |
| npm run typecheck | PASS | p2-1a/typecheck-final4.log |
| npm run arch:check | PASS | p2-1a/arch-final4.log |
| npm test | PASS，937/937 | p2-1a/test-final4.log |
| npm run build | PASS | p2-1a/build-final4.log |
| npm run test:browser:fixture | PASS，114/114，228.103秒 | p2-1a/browser-final4.log |

`source-sha256.json` 记录本次代码/Fixture SHA；`original-summary-audit.json` 重新核对十份旧 summary 均与原 SHA 相等。新增链接、diff 和受保护输入核对见 `offline-scope-check.json`；用户原有 INDEX、两份产品草案和三份演示文件保持未纳入本批。

本轮新增真实模型0、Google/餐厅业务网络0、发现探测0、完整Live0。既有基线仍为10/40次探测、86/450模型（含失败）、15次Google；历史环境失败不退款。没有执行检查点 A、P2-1b、见证认证或网络探测。不推送，完成后停止待独立复核。

### 基线外层停止谓词修正

指标重算后，已知的 Google 精确官网匹配会令旧聚合停止条件误停。外层改用原生来源分项判断卡点变化；Google 精确匹配仍记录，不再当作原生来源已改善。有效红灯直接执行 35c5dc2 的实际谓词，绿灯执行当前谓词；同时验证原生见证出现仍停止。没有运行外层 CLI 或任何探测。

此评测侧修正单独提交，随后记录的基线点将取代早先暂记的 35c5dc2。历史 baseline-freeze 保持原样，网络恢复后必须重新冻结，不可直接运行旧清单。

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


## 2026-10-19 transport-common rebase

The pre-P2-1a common baseline is now acfaaffa73db97413f6538f161c4e837ec64316e, replacing historical4315ab8 only for the restored-network comparison. It includes both reviewed search GETs and GET-bound browser CORS, outer/Recorder/independentS0 support, fresh witness certification and the new baseline freeze. P2-1a is rebased onto that direct parent; no new retrieval/qualification changes in this rebase. Exact source-delta comparison and final combined gates are recorded in network-restored-20261019/gates/rebased-final. CheckpointA/fullLive remain unstarted.
