# D4 复核、逐回合预算修正与 D6

状态：draft / not integrated；已暴露开发集，不是留出集。时间均为维也纳 CET（UTC+1）。本分支不合 main。

## 用户复核与当前切片

用户 2026-11-03 批准：D4 的 B1 原始来源核对为 PASS；官网菜单“揚げ物メニュー：串カツ、アジフライなど”满足 kushikatsu place，卡片须保留原文依据，不称专门店；S0=0。原评价不改，人工裁定另存 `D4-reviewer-judgment.json`。HARD 投影不一致交 B，不在本批改产品。

本批只改 A 的 G6 Runner、评价器与对应测试。来源捕获读取允许实际已审核的 `exclude_unavailable_time=1`，四个主参数仍逐项绑定；独立后验 GET 始终恰好四参数。非见证店机械核实同店本次页面与逐字引用后，记 `QUOTE_VERIFIED_MEANING_PENDING_REVIEW`，安全 PASS 时继续，资格仍为 null；不由模型或生产 eligible 判断其含义。缺页为安全未评并停，引用不在已捕获页面、错店或跨运行引用为 S0；已有独立反证仍 FAIL。

Runner 每个实际发送的用户回合独立 500 秒、50 次模型、40 次 Google；至多三回合、150/120，开发批次模型 400 硬上限按 D1–D8 的原记账条目继续累计，失败尝试计入。普通生产 `RunBoundedModelGateway` 不再被评测侧 episode 截断；源计数按实际传输记入回合。保留逐回合 View 与预算，F6 以各自截止时间检查；原有状态触发条件不改。

## 红绿证据

- `red-source-turn.log`：原 D4 B1 从 NOT_EVALUATED 而非 PASS；其中首次时钟实验未实际驱动墙钟，仅缺少新输出字段，不能作为有效预算红灯。
- `red-turn-clock.log`：加入单纯单调时钟注入点后，旧共享截止在首轮 483 秒时跳过后续回合；同店 G1 模型调用 0，预期 1，属于有效红灯。
- `red-qualification.log`：D4 的同店菜单原文仍被旧预先 oracle 白名单拒绝，未产生待审状态。
- `red-development-model-cap.log`：本地账本 401 次未拒绝；修后拒绝前不计账、不传输。
- 绿灯日志与最终门禁见本目录。D4 原输入、HAR、HTML 的 SHA 见 `historical-inputs-sha256.json`；本地构造的时钟与反例不是网站回放。
- `D4-recheck.input.json` / `D4-recheck.evaluation.json`：另存的新规则离线重核。B1 来源 PASS，资格待含义复核，S0 安全 PASS、stopBatch=false，qualified=null；原始 D4 文件 SHA 未变。身份独立绑定 Google 原响应的名称、电话/地址与官网指针，忽略生产 HIGH 和 eligible。

## JSON 合同

评价器为 `phase3b-g6-evaluation@2`。顶层仍有 `run`、`verdict`、四层 `layers`、`checks`、`coverage` 与诊断输入引用；检查新增 `QUOTE_VERIFIED_MEANING_PENDING_REVIEW`，覆盖字段 `meaningPendingReview` 单独计数。该状态使资格未评，但不构成安全缺证。`deadline.turns[]` 为各实际回合的 elapsedMs/modelCalls/googleRequests，500 秒按回合判断。历史文件只读，D1/D3 的评分和 S0 不改。

Runner 的 `user-turns.json` 为 `phase3b-g6-user-turns@1`，包含各实际消息、回合结束时 View 与逐回合预算。`boundary-observation.json` 保留槽合计耗时，同时输出 `turnBudgets`、明确的每回合/槽限制、每回合 F6 截止与实际开始记录。引用核对只保存已声明原文摘录及原始来源哈希，不另存未经 Recorder 脱敏的整页。

## 冻结与执行范围

`D6.pack.json` 只含原 D6，三句请求原字节不变。W1 原认证截至 2026-11-03 14:37:41 CET 有效，过期时先重新认证两 GET；开发 GET 继承 10/25。`frozen-inputs.json` 记录 pack、证据和额度；执行命令见 `commands.sh`。

D1、D3 原运行不重跑；D7 用户取消，非失败。D3 新运行、D5、D2、D8 等 C 合入与复核通知。门禁、D6 Live 及最终额度尚未完成时，不宣称已执行。
