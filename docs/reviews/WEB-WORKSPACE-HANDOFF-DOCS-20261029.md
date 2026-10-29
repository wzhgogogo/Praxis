# 前端第0步：工作区与来源交接文档复核

- Status: Draft
- Document revision: 0.1
- Last updated: 2026-10-29
- Source of truth for: 本轮文档切片的来源对照、补齐范围、验证结果与停止点；不替代产品、ADR或当前STATUS
- Related ADRs: [ADR-0006](../decisions/0006-web-first-agent-workspace.md), [ADR-0049](../decisions/0049-source-bound-b1-booking-handoff.md)
- Related documents: [PRD](../product/MVP-PRD.md), [User Flows](../product/USER-FLOWS.md), [Agent Gateway](../architecture/AGENT-GATEWAY-AND-WORKSPACE.md), [Visual Direction](../product/VISUAL-DIRECTION.md)
- Evidence status: 文档同步待独立复核；已暴露设计输入，不是Clean Baseline或代码/Live验收

## 切片承诺与来源

只做用户2026-10-29指令的第0步：让当前产品与工作区设计统一为“决定、准备、用户在来源网站自行提交”，形成可复核文档分支后推送并停止。不写第1步代码、不合main、不触碰A的评测、B的Tabelog搜索/G3或C的Google客户端。

- 分支：`codex/docs-web-workspace-and-handoff`。
- 已获取的main基线：`00519783b3f6a3e48a53a4a0a8b03c9621c8bcf7`，含Accepted ADR-0049的B1。
- 用户指定输入：`codex/docs-frontend-design-inputs`，提交`947e741b093eecd0035ebbe9401195db029920eb`；它直接以该main为父提交，只新增视觉原稿0.2与预约草案0.6两份文件，已快进纳入文档分支。
- 原任务中的`design/VISUAL-DIRECTION-20261029.md`、`roadmap/BOOKING-DESIGN-DRAFT.md`在输入分支已归入`docs/product/VISUAL-DIRECTION.md`与`docs/product/BOOKING-DESIGN-DRAFT.md`。
- 用户进一步确认以视觉0.2为准：Geist Mono只用于logo；数字用Geist等宽数字，信息用间距分隔。英文文案表相应去除中圆点和斜体，保留英文含义。
- 视觉画布是虚构参考，Web读取未取得正文；本轮采用已提交规格及用户明确决定，不把画布当真实数据或验收证据。

## ADR-0049已经同步的部分

main已经包含B1的来源交接、服务端两次校验、独立持久化返回自报，以及日英取消冲突并列原文/英文转述、来源手续费规则。PRD和User Flows已有“G5 B1 approved follow-up”小节；Data/Security、Domain、Capability Matrix也已在B1整合中同步。本轮不重复改这些实现或权威规则，不改ADR历史。

仍需补齐的是PRD主体与旧代订流程：原定义、用户、授权语义、写入Outcome与Pilot门槛仍把代订和回执验证列为第一版承诺。Gateway也未写当前查看上下文及新三位置工作区。

## 本轮补齐与取舍

| 文档 | 补齐内容 |
| --- | --- |
| PRD | 在日外国人、英文界面；决定和准备后交接用户；移除第一版代订/取消/接管后代提交承诺；BOOKED_VERIFIED与70%预约成功指标标为第一版不适用，原写入指标不换分母沿用 |
| User Flows | 首页、My plans、同一安排工作区；直接出发或后续先比较；真实查找进度与停止、逐家候选、局部SSE更新、恢复卡片及当前指代；用交接流程替换代订/取消/新订后取消图 |
| Gateway | 消息携带当前视图、正在看的候选ID、比较候选ID集合；服务端核对所有权、Case与候选/请求版本；只用于指代，不等于选定、授权或Task State |
| Visual Direction | 保留视觉0.2规则，文档修订0.3仅加来源、英文文案、第一段范围和待运行验收；白底、群青、柔和单层阴影，Mono仅logo；缺图只用No photo |
| Booking Draft | 保留0.6正文作为draft / not integrated输入；补来源与适用边界，标明取消严格程度旧规则已被ADR-0049取代，缺失探测/路线图仅标作未附原稿引用 |
| INDEX / STATUS / History | 增加唯一阅读入口与复核记录；新交互写明“设计已定、未实现”，不改变既有能力结论或污染历史证据 |

两处明确的合同衔接：

1. 新文案`Not yet`只映射已有`NO`回答；跳过及每Case至多一次的服务端持久化claim保持原规则，不新增反馈枚举或预约状态。
2. TableCheck的`Check date and guests`及取消冲突的`Confirm cancellation terms on the website`仍按ADR-0049适用，合并在至多一行提示中；不由视觉简化删掉，不因草案0.6旧表格改变B1规则。

直接去来源网站不等待比较。合法普通同店公开来源页供用户自行查看；带参B1仍必须有当前slot及合法源链接证据，缺证不能补造预约入口或声称有位。第一段不实现跨渠道比较或B2/B2+。

## 文档验证

文档静态核对通过：改动限定为12份文档，125个相对链接及相关新锚点可解析；视觉规则、英文文案、来源与授权边界、反馈标签映射均已核对。首轮发现4处日志文件末尾新增空行，修正后`git diff --check 00519783`通过；没有修改产品代码或放宽验收。

| 检查 | 结果与证据 |
| --- | --- |
| 分支与输入来源 | 工作分支名正确；947e741b的唯一父提交为main基线00519783，输入只有两份文档 |
| 范围 | 对基线的改动仅12份文档；src、scripts、package/lock、ADR、评测输入和共享Schema差异为0 |
| 链接与文案 | 125个本地链接/锚点通过；21项英文文案片段齐备，文案表未保留中圆点或斜体 |
| 原稿保留 | 视觉0.2从“原则”至“待验证”的规则逐字一致；预约0.6从首个版本变化节起的正文逐字一致 |
| 产品与Gateway | 第一版写入Outcome/70%指标已区分；上下文有用户/Case/候选归属校验要求，查看不写选定状态 |
| B1合同 | ADR-0049字节未改；现有BookingFeedbackAnswer为YES/NO/SKIP，Not yet映射NO；必要提示与最多一次持久化claim保留 |
| diff与历史 | diff检查通过；仅追加本轮日志并更新文档元数据，历史执行记录不改写 |

保留内容的SHA-256：视觉规则`ba6b37637285072925c81bc73bf8051092ab1c39470328b5ba518548b6c752f9`；预约0.6正文`082a729da669a3f1d8985338351ab7a9ce4d45aba5505c937d06eca8393032af`。它们用于输入保留核对，不是产品质量评分或来源能力证明。

按[Test矩阵](../skills/test/SKILL.md#验证矩阵)，本次只适用链接、引用、权威一致性和diff核对。代码五门禁及Playwright响应式/截图属于第1步，本轮未运行，也不拿B1历史绿灯替代新工作区验收。

| 模式 | 本轮状态 |
| --- | --- |
| Mock / 真实浏览器本地Fixture | 未运行；未改可执行代码 |
| Replay | 未运行；未改回放、Gold、Runner、评分器或输入 |
| Live Read-only | 未运行；业务模型、Google、餐厅来源调用均0 |
| Controlled Live-write | 未运行；没有预约、付款、取消或外部表单提交 |

本轮Git fetch/push属于文档交付操作，不计为餐厅业务Live。公开画布读取尝试不是产品链路测试。

## 交付与停止

本轮文档完成后仅推送工作分支，保持main不变，等待第0步独立复核。没有创建`codex/feat-web-workspace-slice1`或启动代码。第1步的十项浏览器验收、五门禁、390×844主要画面截图以及停止条件统一见[视觉方向](../product/VISUAL-DIRECTION.md#第一段验收与停止点)。

普通启动的B1来源链接读者/G3接线和首次TableCheck真实来源带入验证仍沿用main的已知缺口；本次文档工作不关闭它们。独立工作树保留供复核，原主工作区未提交的研究文档与演示稿保持原状。
