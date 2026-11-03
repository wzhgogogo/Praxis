# D4 复核、逐回合预算修正与 D6

状态：本轮已停批，工作分支待复核 / not integrated；已暴露开发集，不是留出集。时间均为维也纳 CET（UTC+1）。本分支不合 main。

## D6 结论（2026-11-03 CET）

**D6 未完成“预订首家 → B1”能力。三回合都已发送、各自预算生效，但用户选中的 Ito Akabane 未被交付，最终投影展示了另外五家店和五张 B1 卡片。自动评价因身份投影缺证为 NOT_EVALUATED 并正确停批；另将五项具名错配提交 S0 复核，不能声称 S0=0。** 原 `runs/D6/evaluation.json`、执行结果和录制不改，不重跑、不继续其他槽。

| 回合 | 耗时 | 模型 / Google | 实际行为 |
| --- | ---: | ---: | --- |
| INITIAL 推荐 | 94.032 秒 | 8 / 2 | 推荐 Ito Akabane、赤羽 焼肉うし志、Denny's Akabane；首家为 Ito，未承诺库存 |
| book-recommendation | 4.614 秒 | 3 / 0 | 正确解析 SPECIFIC_OUTLET=Ito Akabane、11-11 19:00，询问人数；事件带原首家 ID |
| supply-party | 164.602 秒 | 12 / 2 | 接纳两人，查位并展示五家其他店；selectedCandidateId 为空，无 CANDIDATE_SELECTED 事件、无条款问答 |

读取合计 **264.043 秒**；runId 创建至 batch 文件写完约 **285.887 秒**，包含后验 GET 与录制落盘，并非前端像素显示耗时。三次截止分别为 04:41:21.738、04:42:55.771、04:43:00.392；均有独立 500 秒。首轮服务端展示为 **04:34:35.712**，最终为 **04:37:24.586**。选中店的独立合格证据/展示时刻不存在；不把其他五家的展示时刻当合格结果。

### 具名错配与首个偏离点

首家 Ito 的原 Google 响应：`ChIJwUnGVR2TGGARNAEaZNumYhQ`，电话 **03-3598-2992**，地址 **1-chōme-2-4 Akabane**。04:34:38.768 的用户语义事件保留 `userBookingSelection.candidateId=d7e28bf950ed08d83c01d9d7`（完整 ID 见原件），目标始终是 Ito。随后 `resetForSemanticUpdate` 清空候选/证据，人数追问结束时候选为零；`userBookingCandidate` 要求在当前候选中重新找到同名且同 ID 的店，因此没有生成选店事件。补人数后原生地区候选的五家其他店被当作当前 SPECIFIC_OUTLET 请求的结果展示。

| 最终店名 | Tabelog ID | 同次页面可见地址 |
| --- | --- | --- |
| Teppan Sakaba Tetsuichi Akabane ten | 13109596 | 東京都北区赤羽1-15-1 新仲ビル 1F |
| Seafood Genshiyaki Robatanyo Akabane honten | 13206560 | 東京都北区赤羽1-38-2 |
| Satsuma Jidori × Sendai Gyutan Akaneya Akabane ten | 13297216 | 東京都北区赤羽1-3-8 ASビル 2F |
| Kyo no Rikyu Akabane ten | 13294534 | 東京都北区赤羽1-2-6 赤羽駅前丸澤ビル 2F |
| Izakaya Motenashiya Akabane ten | 13294533 | 東京都北区赤羽1-2-6 赤羽駅前丸澤ビル 2F |

这些页面的店名和完整地址均有保存，原文与各自候选一致，但它们不是用户选中的 Ito。服务端 `PRESENT_RESULTS`、`presentedCandidateIds` 及 B1 投影均含这五家，区别于 D1 的隐藏未展示交接；本轮没有采集实际前端像素，展示影响仍交独立复核裁定。按付费前冻结的“具名店必须是同一门店”规则列为 **5 项 S0 发现待复核**，不是把它们当成合格替代店。

证据与准确边界见 `named-outlet-review-input.json`、`first-deviation.json`、`user-turns.json`。定位于 b53ab1d9 的 `src/domains/restaurant/task-definition.ts:45`（重置、80 行清空候选）、`src/application/restaurant-user-booking-selection.ts:41–48`（重绑定）、`src/application/restaurant-agent-loop.ts:309–313`；建议归 C，跨域文件由复核者安排。C 通知 ca18d02b 仍是未合入分支，本槽没有接入，不能据此判断其是否覆盖此问题。本批不改产品。

### 原自动评价与独立核查分开

原自动评价：`NOT_EVALUATED / qualified=null / s0Status=NOT_EVALUATED / stopBatch=true`，停止原因 `INDEPENDENT_EVIDENCE_REVIEW_REQUIRED`；其中数字 `s0=0` 仅表示没有自动 FAIL，不能解读为零错误认证。

自动未评的五项均是 `QUALIFICATION_QUOTE` 身份绑定缺口：原生候选没有电话，JSON-LD 的 streetAddress 为空，地区/地址格式不同；页面实际上有上表完整可见地址，冻结评价器没有读取它们，**不是网站缺证**。离线逐页摘录和 SHA 保存在 `safety-and-capture-observations.json`。同时，D6 的首家事先未知，冻结 `request.named` 没有动态绑定首轮实际展示对象，自动评价未检测上述错配。这是另一项 A 的评价接线缺口，需在复核后安排；本轮不修改评分器、不调整原分数。含义待审并不豁免具名店身份约束。

逐环节：原推荐与日期/人数理解正确；随后身份锚点与具名范围丢失。五店各自的 19:00 库存、B1 参数和同源 URL 都通过，不能据此推出它们满足 Ito 请求。无条款模型调用，条款为空是未进入选店流程，不能说成“已按缺证/预留规则省略”。

### 时序、Guard 与 F6

按前批相同操作跨度口径：页面加载/导航 119.688 秒，读页面与控件 22.769 秒，等待 31.046 秒，模型 68.717 秒，其他 21.823 秒；并行重叠以模型优先分配，操作跨度不等于纯网络延迟。完整分解、所有操作起止及未捕获脚本见 `observations.json`。

| 模型用途 | 次数 | 耗时 |
| --- | ---: | ---: |
| 语义解释 | 3 | 7.980 秒 |
| Agent 决策 | 10 | 28.135 秒 |
| 浏览器决策 | 9 | 31.547 秒 |
| 人数补充 | 1 | 1.055 秒 |

语义额外 schema 尝试 **0**。独立源接收观察 **1426/1426 PASS**，全为 GET，越界/提交类到达 **0**；本槽没有覆盖 TableCheck POST/OPTIONS。各回合新读/条款在 20 秒保留区内开始均为 **0**，无超时，结尾分别还余约 405.968、495.386、335.398 秒；本槽未接近预留边界，不能单凭它签收 F6 临界收尾。无人工介入、无自动环境重跑。

### 后验、见证、录制与采集

五家实际展示的 Tabelog 店均立即执行严格四参 GET，**5/5 返回 200 且包含 19:00、11-11、两人**；原始响应和 SHA 均落盘。记账开始间隔为 5.005/5.007/5.008/5.008 秒，cookiesSent=false、retried=false；结束时刻间隔会随网络延迟变化，不能拿响应结束时刻判断节奏。B1_SOURCE_URL、B1_LINK、POST_DELIVERY_SLOT 均各 5 PASS，链接没有被打开，也没有预约提交。

W1 认证在有效期内复用，新认证 GET=0；Dengana 在三个回合 View 的候选/展示均未出现。原选择已变成 Ito，不能用 Dengana 的有位认证证明 Ito 可订。按冻结 Runner，最终有五项展示，所以只做五店后验，未执行 NO_DELIVERY_AFTER；原件与实际请求数如实保留。

三类录制均开启：**Recorder 准入 55/55 页（100%）**，逐页原因均为 `SANITIZED_NETWORK_AND_DOM_CAPTURE`，决策 23 条、Google 结构化响应 4/4；这是按页准入，不等于已执行整包决策回放。未捕获脚本清单只有被 Guard 阻止的 Adobe 脚本，origin+path 无 query 的完整清单在 `observations.json`。原始 197 文件、58,484,519 字节，哈希见 `raw-inputs-sha256.json`。

Tabelog 日历候选：快照 **30**，Kyo no Rikyu 13294534，原页和同次日期/人数/时段响应已冻结；原 JSON 对应 HAR entry **44**，SHA/绑定见 `calendar-capture-manifest.json`。诊断 SNAPSHOT 的响应是安全投影，原始请求参数和完整响应取 SOURCE_CAPTURE + HAR，不从店号拼造。尚未改 G2 固定基线，待复核安排集成。没有采到 TableCheck 有时段日历，G3b 仍待后续；D8 双渠道用户链接清单未产生，不用本槽错误对象的链接替代。

### 额度与停止

本槽新增 **Live 1、模型 23、公开 GET 5、Google 4、来源网站请求 1426**（加后验五次，共网站计数 1431），环境重跑 0。账本由 663 条追加 30 条为 **693 条**，此前所有条目原值保留。累计 **Live 4/26、模型 321/1600、GET 270/390、环境重跑 0/4**；开发批次 **4/8、80/400、15/25（GET 余 10）**。见 `budget-reconciliation.json`。

D7 取消，非失败；D1/D3 原运行不重跑。D3 新运行、D5、D2、D8 均 **NOT_RUN**，等 C 合入与复核通知；本批不认证 W2、不挪用留出集额度、不合 main。五门禁后冻结源和外层脚本 **780 项 SHA 零变化**，产品目录相对 main d4d8ea33 零差异。新增离线分析不调用模型或网站；原评价、原始 D4 与 D6 证据均保留。

## 用户复核与当前切片

用户 2026-11-03 批准：D4 的 B1 原始来源核对为 PASS；官网菜单“揚げ物メニュー：串カツ、アジフライなど”满足 kushikatsu place，卡片须保留原文依据，不称专门店；S0=0。原评价不改，人工裁定另存 `D4-reviewer-judgment.json`。HARD 投影不一致交 B，不在本批改产品。

本批只改 A 的 G6 Runner、评价器与对应测试。来源捕获读取允许实际已审核的 `exclude_unavailable_time=1`，四个主参数仍逐项绑定；独立后验 GET 始终恰好四参数。非见证店机械核实同店本次页面与逐字引用后，记 `QUOTE_VERIFIED_MEANING_PENDING_REVIEW`，安全 PASS 时继续，资格仍为 null；不由模型或生产 eligible 判断其含义。缺页为安全未评并停，引用不在已捕获页面、错店或跨运行引用为 S0；已有独立反证仍 FAIL。

Runner 每个实际发送的用户回合独立 500 秒、50 次模型、40 次 Google；至多三回合、150/120，开发批次模型 400 硬上限按 D1–D8 的原记账条目继续累计，失败尝试计入。普通生产 `RunBoundedModelGateway` 不再被评测侧 episode 截断；源计数按实际传输记入回合。保留逐回合 View 与预算，F6 以各自截止时间检查；原有状态触发条件不改。

## 红绿证据

- `red-source-turn.log`：原 D4 B1 从 NOT_EVALUATED 而非 PASS；其中首次时钟实验未实际驱动墙钟，仅缺少新输出字段，不能作为有效预算红灯。
- `red-turn-clock.log`：加入单纯单调时钟注入点后，旧共享截止在首轮 483 秒时跳过后续回合；同店 G1 模型调用 0，预期 1，属于有效红灯。
- `red-qualification.log`：D4 的同店菜单原文仍被旧预先 oracle 白名单拒绝，未产生待审状态。
- `red-development-model-cap.log`：本地账本 401 次未拒绝；修后拒绝前不计账、不传输。
- `red-safety-unknowns.log`：缺少独立身份或响应结构变化不能直接当作错误声明；已知时段与原链接相矛盾必须拒绝。修后同样输入转绿，缺证未评并停批，错店/缺原文/错参仍 S0。
- 最终定向 `green-safety-final.log` 44/44。`green-source-turn-qualification.log` 是早期未通过的复验：构造反例最初误改 12:30 行，19:00 原链接仍存在；反例改为实际 19:00 行后通过，未放宽断言。原件保留，不能把文件名当通过依据。D4 原输入、HAR、HTML 的 SHA 见 `historical-inputs-sha256.json`；本地构造的时钟与反例不是网站回放。
- `D4-final-recheck.input.json` / `D4-final-recheck.evaluation.json`：最终候选另存的新规则离线重核。B1 来源 PASS，资格待含义复核，S0 安全 PASS、stopBatch=false，qualified=null；原始 D4 文件 SHA 未变。身份独立绑定 Google 原响应的名称、电话/地址与官网指针，忽略生产 HIGH 和 eligible。此前 `D4-recheck.*` 为前一候选的派生结果，保留但不当最终基线。
- `gates-pre-safety-distinction/results.json` 是前一候选完整门禁通过的原件；补充安全缺证分类后，以最终重新冻结及净树门禁为准。
- `red-page-identity-valid-snapshot.log`：同一测试和有效本地构造页面，在 ff6ec126 的旧身份接线下未能拒绝另一门店。修后页面已独立确认的异店身份优先，官网指针不能覆盖；只有身份不明时记未知并停，不误报错店。`gates-pre-page-identity` 保留补这条控制前已通过的完整门禁；最终以 `gates/results.json` 为准。最终源与外层脚本 780 项 SHA 固定。

## JSON 合同

评价器为 `phase3b-g6-evaluation@2`。顶层仍有 `run`、`verdict`、四层 `layers`、`checks`、`coverage` 与诊断输入引用；检查新增 `QUOTE_VERIFIED_MEANING_PENDING_REVIEW`，覆盖字段 `meaningPendingReview` 单独计数。该状态使资格未评，但不构成安全缺证。`deadline.turns[]` 为各实际回合的 elapsedMs/modelCalls/googleRequests，500 秒按回合判断。历史文件只读，D1/D3 的评分和 S0 不改。

Runner 的 `user-turns.json` 为 `phase3b-g6-user-turns@1`，包含各实际消息、回合结束时 View 与逐回合预算。`boundary-observation.json` 保留槽合计耗时，同时输出 `turnBudgets`、明确的每回合/槽限制、每回合 F6 截止与实际开始记录。引用核对只保存已声明原文摘录及原始来源哈希，不另存未经 Recorder 脱敏的整页。

## 冻结与执行范围

`D6.pack.json` 只含原 D6，三句请求原字节不变。W1 原认证截至 2026-11-03 14:37:41 CET 有效，过期时先重新认证两 GET；开发 GET 继承 10/25。`frozen-inputs.json` 记录 pack、证据和额度；执行命令见 `commands.sh`。

D1、D3 原运行不重跑；D7 用户取消，非失败。D3 新运行、D5、D2、D8 等 C 合入与复核通知。门禁、D6 Live 及最终额度尚未完成时，不宣称已执行。

## 最终离线门禁与启动前核对

候选 b53ab1d9：五门禁全绿，默认 1363/1363，原 Chromium 188/188，G6 63/63；原条款整组装 1/1；严格 G2 5/5，12 页全部 PASS。每项前后 git status 为空，七份原始日志压缩保存于 `gates/`，未修改日志字节。定向与完整门禁所用都是本地固定来源，不计作 Live。

启动前 `prelive.json`：780 项源/配置/外层输入 SHA 不变，产品目录相对 d4d8ea33 零差异，原 662 条账目原值保留；加 D4 零调用复核旁注为 663 条。累计仍 Live 3/26、模型 298/1600、GET 265/390，开发 3/8、57/400、10/25。W1 认证有效，故新认证 GET 为 0。只准 D6，三个实际用户回合各自预算；不自动环境重跑。
