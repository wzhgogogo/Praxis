# B1 卡片条款生产组装：离线交付待复核

- Status: implementation candidate / not integrated; exposed local constructions, not Clean or Live。
- 时间：2026-11-01T15:53:12.314502+01:00，维也纳 CET（UTC+1）。
- 分支：codex/feat-phase3b-b1-card-terms；基线 main 74dd2faf6ac8ef99492c86eaf3d57d7244b1745c。
- 最终受测提交：b6e155bd7674e4c65fc07e6193b421db3eaa9680；748项冻结SHA，14个受保护文件不变。交付提交只追加本报告、输出与文档，不合main。
- 真实模型、Google、网站GET、Live均为0；未读取/加载.env、G1独立答案或私有Holdout。

## 结果与实际入口

用户选定门店，权威目标为SPECIFIC_OUTLET且已有有效B1时，普通createLiveReadAssembly→持久应用在该选择轮结束前，通过现有G1读取取消与订位卡要求。初始开放找店不读全部候选；Agent内部SELECT_CANDIDATE单独不代表用户选择。只有真实Reducer已接纳、当前run/店/页/渠道及缓存快照仍一致的问答才复用。投影只读缓存，不做I/O。

PersistentRestaurantAgentApplication在原ModelRunBudget hold释放前调用G1/B1能力，沿用本轮网关、事实浏览器计数、取消信号和剩余deadline，不进入显式追问的3次/60秒独立额度。普通选择轮实际7次固定模型传输，含2次条款回答；双语冲突轮9次，含4次条款回答。真实调用0。显式用户追问预算不改，完成后仅复用其结果，不再触发主动读取。

RestaurantBookingTerms是既有G1的编排与有界临时缓存，没有新浏览器读取器、HTML解析器、模型URL或额度通道。缓存缺失时用原事实reader/Guard，可读取一个实际观察到的同店语言链接，不猜地址。G1核对逐字引用；发现日英冲突时分别为两页取得英文转述，再由既有领域呈现双方引文、冲突标识与确认提示，不排序严格程度。

卡要求只接受三个精确G1英文标签；仅接受信用卡付款不等于订位需要卡，问题显式区分。原文、URL、readAt和原始HIGH身份凭据保留在服务端临时证据，不改写G1的RESTAURANT_WEBSITE命名空间。二次条款核验检查实际同店来源URL、候选、原凭据、当前run和时效；Tabelog路径ID与数字店号只是同一已绑定店铺的表记，不放宽来源身份阈值。

缺证、异店/渠道、旧run、过期、预算用尽、取消或迟到只省略条款，合格B1链接继续存在。RESULTS_PRESENTED的通知先于可选条款完成，Book on按钮不等待条款。固定手续费及来源/日期/SHA配置不改。两渠道原链接读取器和两次链接校验流程不改；条款编排只为原准备记录补充G1证据，再复用同一prepare/present合同。

## 红绿与产物

1. A31ba2a84的g6-booking-terms-composition.test.ts、cancellation-question.json及唯一必需helper变化原样导入，SHA见a-imports.json；其余A评测与Harness不改。ea7ac199在main产品取得目标红灯：G1 ANSWERED/1次、正确Tabelog链接，但terms为空。原断言及输出保存在red/。最终A原断言绿，原helper另一次观察也只有1次问答，答案与引用原样上卡片。
2. 新整组装测试仅替换模型和来源I/O，保留实际Semantic/Compiler/Router/Reducer/持久SQL及prepare/present。Tabelog用固定浏览器来源传输；TableCheck用真实本地Chromium与全拦截fixture；不是当前网站Replay。
3. focused-1的C TableCheck包装navigate递归，focused-2的精确读页URL期望与取消释放时序失败均原样保留。修正只涉及C测试传输/独立期望和按真实AbortSignal/最终Case更新等待；A断言与产品在这两次修正间不变。focused-3已11/11通过。
4. G1原凭据ID与同页URL矛盾的单位反例在e3f3d826取得有效红灯，收紧条款见证核验后绿。Agent内部选店的整组装反例在ee9d9dae取得有效红灯（2次应为0），加入权威SPECIFIC_OUTLET前置条件后绿。它们是本分支新能力的防线，未改来源身份规则、State或Agent行为。
5. 最终全量门禁捕获14份C实际观察及1份原A helper产物。独立evaluate.py不用生产接纳代码，以冻结字面量、原始页面、URL/时间、原始身份与run链核对12条C展示引文及原A答案/引用。下列是观察帧，不是14个独立Live或模型质量样本。

| 观察帧 | 条款数 | 累计fixture问答调用 | 结果 |
| --- | ---: | ---: | --- |
| agent-selection-only | 0 | 0 | HONEST_OPTIONAL_TERMS_OMITTED_LINK_PRESERVED |
| TABELOG-proactive | 2 | 2 | QUALIFIED_DELIVERY |
| TABLECHECK-proactive | 2 | 2 | QUALIFIED_DELIVERY |
| admitted-reuse | 1 | 1 | QUALIFIED_DELIVERY |
| selected-admitted-reuse | 2 | 4 | QUALIFIED_DELIVERY |
| conflict | 3 | 4 | QUALIFIED_DELIVERY |
| SHOP | 0 | 0 | HONEST_OPTIONAL_TERMS_OMITTED_LINK_PRESERVED |
| CHANNEL | 0 | 0 | HONEST_OPTIONAL_TERMS_OMITTED_LINK_PRESERVED |
| not-stated-new-run | 0 | 4 | HONEST_OPTIONAL_TERMS_OMITTED_LINK_PRESERVED |
| budget | 0 | 1 | HONEST_OPTIONAL_TERMS_OMITTED_LINK_PRESERVED |
| cancelled | 0 | 1 | HONEST_OPTIONAL_TERMS_OMITTED_LINK_PRESERVED |
| expired-pages | 0 | 2 | HONEST_OPTIONAL_TERMS_OMITTED_LINK_PRESERVED |
| fresh-explicit-reuse | 1 | 3 | QUALIFIED_DELIVERY |
| deadline | 0 | 1 | HONEST_OPTIONAL_TERMS_OMITTED_LINK_PRESERVED |

选店后复用控制的累计数包含初次追问、另一选择轮与后续显式问题；后续问题只增加自身1次，B1未重复调用。过期控制在500001毫秒省略旧条款，600000毫秒的链接仍有效；随后独立显式G1能读取新页并直接复用。预算控制通过同一个RunBoundedModelGateway消费20次固定传输后，不为第二条款再调用模型；未手填State、已接纳Evidence或terms产生整组装成功。只有独立领域防线单测使用局部合同fixture。

## 完整门禁

| 检查 | 结果 | 秒 |
| --- | --- | ---: |
| 冻结完整性（前） | PASS | 0.120 |
| 原A helper实际产物 | PASS | 1.326 |
| typecheck | PASS | 0.492 |
| arch:check | PASS | 0.217 |
| npm test：1319/1319 | PASS | 35.057 |
| 独立产物核验 | PASS | 0.167 |
| build | PASS | 0.463 |
| Chromium：187/187 | PASS | 130.264 |
| 严格G2：5/5；12/12页PASS | PASS | 24.574 |
| 冻结完整性（后） | PASS | 0.143 |

标准G2由Chromium首组独占运行5/5；严格G2另外运行。十步每项前后git status为空，最终748项SHA及受保护文件未变。完整门禁本轮一次通过，无过滤、跳过、失败豁免或重试；此前开发测试失败和预期红灯均未覆盖。CET、退出码与SHA在gates.json，test.log同时提供原始与无损gzip。

## 范围、版本、账本与限制

ADR0049 §5只追加用户11-01主动读取决定，Document revision0.4；10-29双语冲突、手续费与反馈决定保留。未改Agent/G1系统Prompt及Schema、Semantic Prompt/Proposal、State、TaskDefinition或迁移。sourceReadContext是权威Task快照的服务器投影，captureLinkedTranslation是原事实请求的非持久可选参数。原文和条款仅在有界临时缓存，不进Task State/Outcome，不收集个人资料。

B三个G3文件、两渠道原链接读取器、来源空位/响应绑定、身份规则和前端不改。既有前端读取已核对的terms，无需另一个UI路径。main507与A508条账目完整并集后追加C零调用一条，共509条；累计仍真实模型171、公开GET255/290、Google12、Live0。见budget-preservation.json。

本轮只证明离线接线、逐字/关联/时序与资源防线。G1答案是否全面忠实、任意语言/问题用途识别、NOT_STATED语义及真实站点取页/实际选中未做真实模型或Live验收。复用对取消/卡问题作保守用途识别，含混或不相关问答不冒充条款；补齐仍受原预算限制。临时缓存重启后不保留条款，不能伪造页面；原B1链接缓存重启语义不改。没有预约提交、确认页访问、现实预约状态或已订成功声明。

本批离线纵向结果已完成。只推工作分支，不合main；核对远端后按用户授权通知A，停复核，不开始后续真实调用。
