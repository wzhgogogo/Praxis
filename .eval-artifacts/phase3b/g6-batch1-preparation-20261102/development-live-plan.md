# G6 开发 Live 计划（提请复核，尚未执行）

- 2026-11-02，维也纳 CET（UTC+1）。`draft / not integrated`；公开开发请求，不是留出集。没有接触或推测留出集原文。
- 8 槽串行；每槽500秒、50模型、40 Google；最多400模型，仍受3b总1600上限约束。Live本批0，以下不是运行批准或当前空位认证。
- 日期文字按拟运行日2026-11-02示例冻结为2026-11-11（周三，9天后）。仅11-02至11-04运行满足7–14天；更晚先重新物化日期/原星期、提交请求与见证、记录SHA，不能运行时改字。D1沿用已暴露3a′ Dengana开发地点与店名；其他均为本批新写的公开开发请求。
- 每槽同时开启 `--record-browser --record-decisions`，Google结构化响应固定开启。预期根目录 `.eval-artifacts/phase3b/g6-development-live/<frozen-pack-sha>/<slot>/`，下有 `recordings/<runId>/recording.json`、`replay.har`（合格时）、`diagnostic/`、`execution.decisions.jsonl`、`evaluation.input.json`、`evaluation.json`、`recording-observation.json`、`boundary-observation.json`、`witness/`。比例按REPLAYABLE页/全部快照页报告；零页的比例为null，逐页给出Recorder原原因。

| 槽 | 请求原文与代码触发后续回合 | 见证计划/当前缺口 | 预期/观察点 |
|---|---|---|---|
| D1 | “Can you find a table for two at Kushi Katsu Dengana Akabane ten on November 11, 2026 at 7 PM?” | W1；同名+1-15-1 新仲ビル1F、电话/坐标/类别从新公开详情核对；历史认证不代表当前有位 | 具名同店、Google日文名解析、可用则交付；不能把其他分店当作该店 |
| D2 | “Check whether Specializing in Nodoguro Ginza Nakamata has a table for two on November 11, 2026 at 7 PM.” | W2；已保存TableCheck入口 `https://www.tablecheck.com/en/nakamata-nodoguro-ginza`；**尚缺已观察且同店的Tabelog详情URL/rst_id及新日期见证**，冻结前不可执行，禁止猜代码 | 有时段TableCheck日历+同次读取录制；无位可如实无结果，不以没有采到材料伪称G3b验收 |
| D3 | D1原文。State已展示AVAILABLE后发 “Please book the first restaurant for me.” | W1同一日期/人数/时段，可复用24h内认证 | 同店选择→B1；本次回放已暴露模型可能再次PRESENT而未SELECT，作为已知偏离交复核；没有预约执行端口/提交 |
| D4 | D1原文。State已展示AVAILABLE后用PAGE_QUESTION发 “Does the first restaurant have a private room?” | W1；答案按运行中同店公开页独立核对，当前不预设有包间 | G1真正取得本页、逐字引文+URL/读取时间，或NOT_STATED；新转述需独立复核，不能只凭引用判正确 |
| D5 | “I'd like to book Kushi Katsu Dengana Akabane ten at 7 PM sometime next week, for two people.” ASK_USER且权威缺date后发 “November 11, 2026.” | W1；见证日期明确，但在用户日期答复前不将其注入产品 | 先问具体日期，再正常查位；不得凭见证日期替用户选择 |
| D6 | “Recommend a restaurant near Akabane Station.” 展示后发 “I'd like to book the first restaurant on November 11, 2026 at 7 PM.” 权威缺party后发 “Two people.” | W1只能支持距离/类别相符的已核实门店；其他店不冒充W1 | 推荐不等于查位；缺人数先问，查位后才有B1。回放P2亦暴露未SELECT偏离 |
| D7 | D1原文 | W1 | Guard实际请求与F6时间线重点观察。无读超过20秒保留区；不人为延迟生产网站，不为了“触发”而增加真实调用 |
| D8 | D2原文。AVAILABLE展示后发 “I'd like to reserve the first restaurant.” | W2，同D2冻结阻挡 | 第二渠道B1、卡片取消/卡要求或省略、手续费、反馈。生成一个Tabelog和一个TableCheck可由用户自己浏览器打开的链接清单，随后等用户确认带入日期/时间/人数；不在Runner打开链接 |

## 见证与额度

W1的历史公开指针仅来自 `.eval-artifacts/phase3a-prime/f5-live-rerun/witness-input.json`：`https://tabelog.com/en/tokyo/A1323/A132305/13108466/`，历史距离约201.5m；重新认证前它只是一条已观察入口。W2只知道上述已保存TableCheck入口，不能拼出Tabelog路径。若复核改选另一家已保存双渠道见证，先修改计划、冻结与审批，再运行。

每个见证组用公开详情1 GET+四参数find_vacancy1 GET认证，统一 `https://tabelog.com/en/...`，无Cookie/登录/表单/模型；所有请求先记共享账本，串行且起始间隔≥5秒。相同店/日期/人数/时段的认证可在24小时内复用；每槽结束**每家交付的Tabelog店立即另1 GET核验**，无交付则立即详情+四参数再2 GET。TableCheck的有位事实还须同店、同日期人数时段的原始公开观察，不拿Tabelog响应充作TableCheck库存。

当前评测GET剩35。两组认证4，8槽无交付最坏16，合计20；每槽若Tabelog交付超过2家，须先重新核算，额度不足则停止，不能省核验或事后追记。该20是此开发计划在“每槽至多2家Tabelog交付”条件下的上界；产品不会为评测而截断交付，超出时使用剩余额度并停止后续槽。留出集18槽GET需求尚不能核算，原文不可见；本计划不声称剩余额度足够全部G6。无自动环境重跑；发现S0即停批，不重试。

## Live 顺带采集

1. Tabelog日历原页+同次绑定日期/人数的空位原始响应，加入G2前记录SHA和公开证据状态。
2. TableCheck真正有时段的日历（日期、人数、时段可绑定），交B做G3b；没有则如实记未采到。
3. 全部槽开三类录制，运行后逐页比例/不合格原因；从新录制选一份做当前版本回放验收，旧F5整包不续修。
4. B1两渠道链接清单给用户自己浏览器核对；取消/卡条件缺证、过期、预算或取消时应省略，链接继续有效。用户自报反馈不算已验证预约Outcome。
5. 每槽先评价/S0及独立证据完整性检查，再开始下一槽。NOT_EVALUATED的安全项停批待复核；没有独立证据不能宣称S0认证为0。
