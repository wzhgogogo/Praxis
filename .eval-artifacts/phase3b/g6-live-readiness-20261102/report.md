# G6 Live 启动准备交付（待复核）

- 时间：2026-11-02 Vienna CET（UTC+1）。状态：draft / not integrated，工作分支交复核，不合 main。
- 前一候选49e37c55已获用户传达的独立复核通过。本轮只落实六项启动准备；新真实模型、公开GET、Google、Live、环境重跑均0，没有读取或加载.env。
- 同步获批main549061e8（合并8380c017），两边历史文档正文保留，账本按id并集。C通知修复工作分支ec93c249，但尚未获批合入main，不取其产品代码、不提前付费回放。

## 1. W2 指针与同店边界

[witness-pointers.json](witness-pointers.json)冻结Tabelog 13186922（のどぐろ専門 銀座 中俣）和TableCheck nakamata-nodoguro-ginza。复核者给出的同店依据是銀座4-10-12 銀座サマリアビルB1 / 4-10-12 Ginza, Samaria Building B1；13219563“銀座中俣 はなれ”（銀座3-12-17 小森ビル1F）明确排除。该结论标为复核者提供的指针，电话、当前在线预约区块、当前库存均未新认证。

用户批准Live后才执行公开GET认证：两个见证各详情+四参数空位2次，共4次；另1次公开TableCheck guide用于电话对照（已保存材料的电话被脱敏）。只用tabelog.com/en，不用ssl，不取预约表单、不带Cookie或模型。每次请求先记账，串行至少间隔5秒，原始body/SHA/状态落盘。认证草稿默认未确认，须亲自核对名称、地址、电话、W1类别/半径和W2在线预约区块。若W2确无在线预约，经实际公开证据确认后只用DETAIL_ONLY证书，不称WITNESS_EXISTS，不用它判CAPABILITY_MISS；0时段不等于无在线预约。W1仍须有位。

## 2. 八槽计划和日期已冻结

[development-live-plan.md](development-live-plan.md)逐槽保存完整请求、后续回合、State触发条件、见证及录制配置；pack为[development-pack.json](development-pack.json)。拟11-03运行，11-04亦有效，访问日2026-11-11周三（后8天/7天）。11-05起拒绝启动，必须重新物化并提交日期及SHA。

- pack SHA256：84f4c1f98cf42fb323fda54537ddfc465e967718c9ba88e105186e371c9d5c8b。
- 仅请求/后续原文SHA256：4e883554d43a472ee2eb60bf8f56e04dd39bb3b0861e339c9bd02619aa5ddb71。
- D2/D8固定W2。D3/D6明确预订时由代码记录选择，然后读取条款或按既有规则省略；不再要求模型SELECT_CANDIDATE。D8同样遵守用户选店合同。
- 最多8次Live，每槽500秒/50模型/40Google，串行，录浏览器、决策、Google结构化响应，逐页合格比例和不合格原因随槽输出。不增加Recorder准入或脱敏例外。每槽后立即独立评价，S0或缺安全证据停批，不自动重试。

## 3. 四个受影响回合补回放：准备完成，未运行

[booking-replay-input.json](booking-replay-input.json)冻结P1三种原措辞和P2预订轮、原来源文件SHA与新期望：代码记录选择、条款读取发生、卡片如实采用条款结果；不强制模型SELECT。SHA256为6c14aacf8291c5cf4fe8dfab8be1f36314fc49796658810218269b04da4cbc4a。原57次输入、响应、原始分数和合同校正均保留。

入口src/eval/restaurant/agent-loop/g6/booking-replay.ts只替换受影响用户轮的Agent模型传输，其输出实际驱动生产组装；建立会话、语义、来源及条款模型均用同一已冻结开发fixture，不是重新评语义/条款生成质量。源页只说明包间，未说明取消/卡要求，因而条款调用后NOT_STATED/卡片省略是正确结果，不补造政策。物理传输前记账，全局20次封顶，不增加schema/传输重试。命令要求明确提供已批准且为HEAD祖先的C main合入SHA。

C尚未合main，fixture补回放和付费补回放均NOT_RUN（0/20），命令已在[commands.md](commands.md)。C获批合入后先同步main、完整门禁及严格G2，再先fixture、后付费。P2原缺schemaVersion是已有MAX_SCHEMA_ATTEMPTS=2覆盖的单次schema重试，不是产品缺口；Live输出各用户轮语义尝试/额外schema重试数。

## 4. 启动前配置、证据导入、空跑和停批

同一冻结八槽配置已由本地模型传输与来源I/O跑过真实runG6Batch/createLiveReadAssembly，用户原文SHA不变；结果见[dry-run-summary.json](dry-run-summary.json)、[正常八槽](dry-run-corrected/dry-run.json)、[S0控制](dry-run-s0/dry-run.json)。正常8/8 EVALUATED、串行、录制路径/临时账本齐全；10次GET都是本地模拟，未进共享真实账本。D3独立后验移除已展示时段产生S0，D3 STOPPED、D4–D8全部NOT_SENT。

空跑的来源和语义模型把这些公开开发请求映射到既有合成门店，脚本仍可选择SELECT_CANDIDATE以覆盖旧组装编排；它仅证明配置/记录/评价/停批，不证明真实地点搜索、当前见证或C的代码选择修复。第一轮D6 fixture错误地将SPECIFIC_OUTLET与requestedResultCount一起输出，触发既有一次schema重试；修正模型替身后八槽通过，原始失败保留dry-run-all。命令的错误SHA也在执行前拒绝，原日志保留。

启动命令分三步已备齐：用户批准后公开GET采集→核对原始资料并冻结独立执行证据SHA→带证据SHA的串行Live。新development-evidence.ts导入器绑定请求pack SHA、原始body/SHA、真实GET尝试数、目标分店/日期/人数/时刻、24小时、身份确认和独立资格oracle，不允许覆盖请求。启动器继承已有认证及其GET次数，不再重复消耗认证；缺证、过期、错分店、未reviewed均在真实模型前拒绝。证据核对是获批执行过程，不再修改请求/实现。仅未来获准的真实模型/Live进程由Node --env-file注入凭据；认证无凭据。

20GET含全部认证/后验，下一请求计账前检查硬上限。正常六个T交付槽+两个TC槽约11GET；所有八槽无交付时，5前置+16后验=21，故不能承诺极端情况下八槽跑完：20即停，不省核验、不截断产品输出、不挪用剩15。后验遇限额/失败仍保留已导出的权威执行输出供复核。

本轮离线控制新增：W2排除同名分店、11-05日期过期拒绝、DETAIL_ONLY不伪造库存/能力漏检、GET上限在记账/模型前拒绝、证据SHA/原始空位/身份/时效绑定。一次原本已有的生产有界无结果文案被旧Runner regex漏认，保留目标红灯detail-wording-red.log后补独立文本控制；只在明确有界且无匹配时通过，不能把无范围的全东京无店声明放行。历史评价未重写。

## 5. D8 用户核对链接模板

[user-link-checklist.md](user-link-checklist.md)已准备一条Tabelog和一条TableCheck的用户浏览器核对表：真实来源链接/对应槽与证据、同店名、日期、时间、人数逐项勾选。当前无真实交接链接，模板保持空白，不拼路径或伪称已带入。Live D3/D8取得真实链接后填入，由用户自行浏览器确认。文案只写filled in，不声称已选中来源页面或已预订。

## 6. 留出集 GET 估算

[holdout-get-estimate.md](holdout-get-estimate.md)只使用6例×3次=18槽结构。公式G=2B+I+Σ(交付时Tabelog店数k；无交付时2)，B为认证批数，I为额外身份对照。开发20用尽后剩15。若复核者确认每槽T店K≤3：24小时内六组复用、每组一次额外身份对照=72，需追加57；不复用并各留一次额外身份对照=108，需追加93。K≤2且可复用/无额外身份对照=48，需追加33。K未知时不宣称108是无条件上限；复核者持有原文，确认K后一次申请。没有读取或推测留出集原文，也未修改290GET上限。

## 验证及四层边界

待本冻结候选完成净树五门禁、原条款控制及严格G2；结果归档后在此补实际测试提交、计数和耗时。新增常设G6组应为51项（原46+就绪4+证据导入1），不是用数量替代实际链路。实现源SHA在final-inputs.json冻结，initial inputs-sha256.json作为早期冻结保留。

功能层：本地配置/编排/证据文件合同；质量层：独立S0注入与公开证据缺失诚实未知；效率层：真实额度0、开发GET硬20及后验保留；安全层：不加载.env、无Cookie/表单/提交、无产品/C/诊断修改。真实见证、实时来源可达性、C代码选择和Live能力仍未验证。能力签收清单及独立评价JSON合同沿用已获复核49e37c55，不调整历史评分口径或答案。
