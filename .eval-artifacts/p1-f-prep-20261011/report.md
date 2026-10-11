# P1-F preparation report — 2026-10-11

Status: implementation and offline verification complete for the authorized slices; model replay evidence incomplete. Evidence: exposed development, not Clean Baseline. No push. No complete-task Live. Stop here for independent review and pending model destination authorization.

主分支 `codex/feat-live-restaurant-read-path`。实到起点为 `4bc8f63`，它是 `87aeffe` 后的上批报告文档提交；保留该审计提交，未重置。隔离分支 `codex/exp-retrieval-terms` 的原起点 `76213a4` 保留。

## 提交、门禁及红绿证据

门禁顺序统一为 typecheck、arch:check、npm test、build；各目录有四份原始日志和 gates.json，代码提交均在四门禁通过后作出。

| 项目 | 本地提交 | 状态 | 红灯与最终绿灯 |
|---|---|---|---|
| 0 复核文件原样提交 | c87115a；b4611f0 | 最初读到 revision 1.0，期间复核者写入 1.1，另作原样补充提交；实现者未改正文 | review-artifacts/gates.json；sandbox-test-red.log 是环境 EPERM，明确不是功能检错。初始哈希及 late-review-update.json 保留 |
| 1 半径 | f16daa3 | 默认 1000 m，显式参数保留；ADR-0037 仅追加，基线 Playbook/Gold 不改 | radius/red.log、first-full-red.log → green-target.log、四门禁 |
| 2 距离上下文及展示 | e220b24 | Context 11、Agent prompt 25；代码不排序、不改变资格。真实回放阻断，不能宣称正向对照不下降 | distance/red.log、schema-caller-red.log → green-target.log、四门禁；replay-blocked.json |
| 3 地点解析 | b89e22f | 上下文偏好、地理类型、100 km 歧义阈值；无城市/国家/地名白名单；Google-only 观察完成 | location-resolver/red.log → green-target.log、四门禁；google-probes.json |
| 4 坐标地址观察 | 63ac2a0 | 每 run 最多一次，计 Google 预算；坐标保持圆心，失败有原因。两次发现探测均未达标，预算用尽不追加 | coordinate-address/red.log、continuation-test-red.log → green-target.log、browser-input-green.log、四门禁 |
| 5 隔离检索词 | a51a59c（实验分支） | merge 纳入 63ac2a0；结果区引用约束已验证。ADR-0041 Proposed，未合回主分支；真实回放阻断 | retrieval-terms/red.log、test-first-red.log、saved-region-first-red.json → green-target.log、chromium-green.log、saved-region-observation.json、四门禁 |
| 6 只读审计和本报告 | 本报告提交 | 不改代码；严格共享层字面清单非零 | audit/audit.json、audit.md、raw-candidates.txt；功能红灯不适用于只读清单，不伪造；最终四门禁见 audit/gates.json |

所有实现项均追加 DEVLOG/TEST-LOG，并同步月度索引、STATUS。日志中的原始空白保留；src/docs 的 diff whitespace 检查通过。三份未跟踪演示文稿未动。实验分支合并父节点为 `76213a4` 与 `63ac2a0`，文档双方记录保留；旧摘要冲突的实验副本保存在 retrieval-terms/prior-experiment-summary.json。

## 1 历史交付按 1 km 离线重算

只依据原产物的已绑定圆心及已观察坐标，沿现有距离算法重算。未覆盖或修改任何旧评价。每条原产物路径、圆心、坐标详 radius/historical-radius.json。

| 运行 | 已展示门店 | 距离 m | 1 km 内 |
|---|---|---:|---|
| kf-h001-20261022 / 5b4aa8a0 | Shibuya Sushi Matsumoto | 632.66 | 是 |
| kf-h002-20261024 / 4c15055e | Ginza Sushi Sendou | 389.95 | 是 |
| kf-h002-20261024 / 4c15055e | Rare Ten-don Ginza Mitsuyoshi Ginza honten | 598.13 | 是 |
| kf-h005-20261021 / f91b4338 | Akasaka Sushi Ito | 2685.42 | 否 |

kf-h005 原预跑没有已展示门店；复测展示的门店按新半径越界。这是新半径的追溯计算，不撤改旧 3 km 下的结果或评价。

默认常量为 `src/core/location/nearby.ts` 的 DEFAULT_NEARBY_RADIUS_METERS。替换五处默认位置，并复用该常量作为指名地点默认半径。999 m 接纳、1001 m 拒绝、显式 2000 m 两者接纳；默认当前离线正常交付对照同步为受控 1 km 来源坐标，不修改 Gold 或真实录制。Evaluator 没有独立 3 km 常量，消费运行时 grounded areaMatch/basis；未添加一套评分器距离计算。

## 2 距离回放 — 未完成

4 条请求准备完毕：p1-seed-0129–0132，原样 messages 只注入 context.candidates[].distanceObservation，其他字段保持。原始任务消息仍含日期、人数和约束，自动审批两次拒绝向具体 DeepSeek API 外发，要求可信用户明确批准目的地。payload-audit.json 与 replay-blocked.json 保存检查和阻断事实。已通过异步问题请求该具体授权，未收到答复，真实调用 **0/8**。不得据此声称 0131/0132 不下降或距离偏好有效。

Context 仅接收已 grounded 的距离事实，取整米、圆心 TASK/EVAL/NAMED、来源；没有距离时不猜测。Prompt 要求同样合适时更近优先、指名地点弱偏好、不能抵消 HARD。Domain 组合测试核对 legalActions/交付资格不变。持久工作区候选视图及 Web 卡片带距离字段；模型交付文本也受 Prompt 要求。

## 3 Google-only 解析观察

每个地点：1 次海外同名观察 + 旧解析一次 + 新解析一次；共 **15 Google、0 模型、0 浏览器**。旧解析冻结于 87aeffe，临时导出模块只供本次对比；不保留生产旧路径。候选、类型、坐标、选中结果和错误全文在 location-resolver/google-probes.json。距离是地点到本次已知上下文圆心，不是资格半径。

| 查询 | 海外同名店观察 | 旧解析 | 新解析 | 新选点距上下文 m |
|---|---|---|---|---:|
| Azabu | 是 | GOOGLE_LOCATION_AMBIGUOUS | Azabu (35.657101, 139.733643) | 3326.78 |
| Kanda | 是 | Kanda (-27.714741, 153.199864); 7159767.59 m | GOOGLE_LOCATION_AMBIGUOUS | — |
| Ueno | 本次未观察到海外店 | Ueno (35.708730, 139.774154); 4392.68 m | Ueno (35.708730, 139.774154) | 4392.68 |
| Akasaka | 是 | Akasaka (35.671040, 139.734547); 2938.70 m | Akasaka (35.671040, 139.734547) | 2938.70 |
| Asakusa | 是 | Asakusa (35.718586, 139.795885); 6036.45 m | Asakusa (35.718586, 139.795885) | 6036.45 |

4/5 地点观察到海外同名店，满足至少 3 个；Ueno 本次未观察到。新解析 Kanda 的多个地理匹配保持歧义，不自动挑一个。其余 4 个选中有地理类型的地点。类型全文在候选记录中，new 4 点分别 neighborhood 或 sublocality；old Kanda 是外地餐厅类型。

原失败探测没有保存完整 Google HTTP 原响应；可复用的是公开规范化观察。Fixture 保留真实坐标与类型、匿名化名称/id 并去地址，未把禁止再用的暴露地点写入新 Fixture、查询或主动调试数据。不能把它称为字节级原响应回放，来源哈希及限制见 fixture-provenance.json。真实来源返回中偶然出现的原词不改写。

## 4 两次坐标发现探测 — 均未达标，不追加

冻结 63ac2a0，每例上限 6 模型/90 秒、1 km、只到发现，不查位。reverse address 为公开只读 Google Geocoding GET，带来源/时间/失败原因；每 run 缓存含失败并计入 Google 40。地址观察不替换坐标，不产生地区标签或地区代码。未调用模型也未发请求的离线测试验证重复/续跑只一次、失败保持圆心、绑定浏览器输入、预算不足正常停止。

**输入偏离已明确记录：** 变体文件中的 kf-h001/h002 没有坐标字段，也不是“nearby”原文。使用该变体上次原始运行已绑定的圆心，构造独立 nearby 发现请求；变体未改。这验证只有坐标入口能力，不能报告为原样变体任务通过。manifest.json 给出原样说明。

| 探测 | 列表状态 | 前十家分母内已接纳 | 用时 ms | 模型 | Google | 地址观察 | 标准 |
|---|---|---:|---:|---:|---:|---|---|
| kf-h002-20261024 | SOURCE_FAILED DISCOVERY_SOURCE_LOCATION_UNGROUNDED | 0/10 | 21173 | 1 | 1 | OBSERVED | 未达到 ≥5/10 |
| kf-h001-20261022 | LIST_OBSERVED  | 1/10 | 24974 | 1 | 1 | OBSERVED | 未达到 ≥5/10 |

入口路径：kf-h002 当前 Tabelog 页 → 已观察 Ginza / Shimbashi / Yurakucho 的地区 GET `/en/tokyo/A1301/`，未得到可接纳列表，故没有可报告的前五家坐标；kf-h001 → 已观察 Shibuya 地区列表 GET `/en/tokyo/A1303/rstLst/?sw=omakase`。完整原始标签、targetRef、地址组件和实际请求路径在 decisions.jsonl 与录制，不改写来源文字。

kf-h001 前五检查实际上只得到三条记录，不能补造第四/第五家或拿未读取候选充作成功：

| 顺序 | sourceEntityId | 纬度 | 经度 | 距离 m | 观察结果 |
|---|---|---:|---:|---:|---|
| 1 | en/tokyo/A1303/A130301/13203305 | 35.65769537870779 | 139.69365747419772 | 1033.04 | OUTSIDE_RADIUS |
| 2 | en/tokyo/A1303/A130301/13308491 | 35.66294870391731 | 139.69560491885105 | 748.70 | WITHIN_RADIUS |
| 3 | en/tokyo/A1303/A130302/13244783 | 35.64791152872159 | 139.71750155408216 | 1996.56 | OUTSIDE_RADIUS |

两例的原始 result、decisions、diagnostics、snapshots 与 recording 均在 `coordinate-address/discovery/`。没有出现意外放行/现实写入/进入预约、支付或个人信息步骤；不做独立归因。不追加探测，也不完整 Live。

## 5 隔离实验及回放 — 代码验证完成，模型证据缺口

来源包提供 resultText 回调；公共 Executor 只校验字符串，不识别站点。至少 8 个 Unicode 字符、包含文字、不是 NFKC/大小写/标点规整后的当前词；引用还须同时在 Runtime 可见全文与来源结果/计数区。隐藏/导航/表单/图片/推荐子树不能提供原文。完整样式标记匹配避免页面外层 inbound_rstlist 被错当结果区；保存的 C3b 快照从误纳导航到仅结果区的红绿观察可复核。

本地 Chromium 使用生产 Runtime/Guard + HAR（无外访）验证一次 GET 换词、解析出的门店、有效原文及三个拒绝反例；执行器现有反例继续验证二次换词、未观察词、引用存在但有结果、忙碌与不稳定。旧 TableCheck 正例改为明确结果区域，旧裸 main 不再提供证据。Browser schema 12 / prompt 18；Agent schema 5 / prompt 26；实验 State 15 / TaskDefinition 14；主分支未合入检索实验。

| 原始组 | 指定决策 | 原动作分布 | 已准备 | 新动作分布 | 模型调用 |
|---|---|---|---:|---|---:|
| kf-h001 P1-E | #24–28 | CLICK 5 | 5 | 未运行 | 0 |
| kf-h005 P1-E | #3–8 | CLICK 6 | 6 | 未运行 | 0 |
| kf-h005 复测 | #3–7 | CLICK 5 | 5 | 未运行 | 0 |

这些 16 条均是 browser_read_decide，Agent retrievalHint 不适用；仅追加 observation.pageActions 的 REFINE_RETRIEVAL/REPORT_NO_RESULTS。系统 messages、goal、targets、history 等都不改，准备器逆向移除新增字段后验证原样对象一致。wire metadata 仅升级为支持新动作的实验 schema。prepared-requests.json 保存请求和原产物哈希；replay-summary.json 保存逐条 DOM 缺口。**0/20** 次真实调用，外发授权与第 2 项相同阻断；不自行标种子、不计分。

16 条决策的原 recording DOM 快照文件均未找到；静态重建不能证明来源结果区域、当前 query 绑定与双快照稳定。因此即使未来模型给出新动作，不能仅凭消息文本宣称执行器会接纳。旧 C3b 快照的区域观察只验证解析边界，不替代原决策 DOM。当前模型新动作分布及 executorAcceptance 保持未验证，不能报告实验质量已改善。

## 6 退出条件 6 审计

按字面清单严格报告非零：共享生产 26 处，其中 22 个含 Asia/Tokyo 的时区/Prompt 字面片段、3 个 Tokyo 错误提示、1 个 Cloudflare Runtime 端点。后者是已有 Browser Provider，非餐厅来源域名；时区是已有业务时间语义。**餐厅站点域名 0、站点专用样式/地区代码 0、评测坐标字面常量 0**。按用户要求本项只审计，未移除保留项或自行豁免退出条件。

每处路径/行号/文字在 audit/audit.md 与 audit.json；同范围历史测试/Fixture 340 个字面候选独立逐条列出，不伪称全目录零。审计采用 quoted/template 字面清单 + 坐标属性检索并人工复核生产结果，raw-candidates.txt 补充注释/函数名检索；不是新的测试平台或自动架构豁免。

| 统计口径 41205e8..63ac2a0 | 增行 | 删行 | 净变化 |
|---|---:|---:|---:|
| src/integrations 全部（含测试/Fixture） | 712 | 347 | +365 |
| 生产 integrations | 387 | 273 | +114 |
| Tabelog/TableCheck 生产文件 | 88 | 91 | -3 |

逐文件增删及 scope 在 audit/audit.md；Google、跨来源组合文件单列，不伪称全是站点专用。Tabelog 两个 QUERY_READY/SETTLED selector waits、selectedQueryIsPending 解析/等待循环已删；TableCheck Venue Availability skeleton wait 已删。当前两 Adapter 无 executor.waitFor、sleep 或 waitForSettled 调用。来源拥有的忙碌/身份判定仍保留，作用是结果资格而非新增等待。

## 预算、保护及剩余阻断

- 本批真实模型 **2**（两次公开发现探测各 1）；距离 0/8、检索词 0/20。以上批 389/1500 为基准，当前 **391/1500**。P1-D 发现探测从 **8/10 → 10/10**，本批新增 2 模型；上批该探测已用 10 模型，本批后该子项累计 12，另列不重复加入总数。
- 本批 Google **17**：同名观察/新旧解析 15、反向地址 2。每次发现 run Google 均 1/40。未给出更早所有批次 Google 总数，不编造历史累计。
- 受保护 278 个历史文件 SHA-256 全部一致（protected-final-check.json）；Gold@6/@7、变体、见证、种子、旧录制均未改。Playbook 1.1 的复核原文哈希由 b4611f0 保存；Accepted ADR 只有第 1 项对 ADR-0037 的追加。
- 两次发现标准失败、两组真实模型回放缺口、原失败 Google 完整 HTTP 响应缺失、原决策 DOM 缺失均如实保留；四门禁不替代它们。
- 自动审批明确要求具体 DeepSeek 目的地授权，因此没有发送原样任务 messages。用户答复前不重试被拒命令；未新增 Live、探测、第三方模型或替代外发路径。

停止并等待独立复核；真实模型回放另待明确目的地授权。
