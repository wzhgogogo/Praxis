# Web Workspace Slice 2 Plan

- Status: Draft
- Document revision: 0.1
- Last updated: 2026-10-30
- Source of truth for: 第2段切片范围、接线、停止点与验收；不替代产品和ADR
- Evidence status: draft / not integrated；真实调用0，未实现/未验收
- Related documents: [Visual](product/VISUAL-DIRECTION.md), [Flows](product/USER-FLOWS.md), [Gateway](architecture/AGENT-GATEWAY-AND-WORKSPACE.md), [ADR-0049](decisions/0049-source-bound-b1-booking-handoff.md), [ADR-0050](decisions/0050-two-line-handoff-presentation.md)

## 当前切片承诺

英文工作区只有一个按当前视图确定路由的输入框；可点条件胶囊、需求版本差异与备选状态、批末收尾卡、准确的空结果/错误状态。由真实HTTP/SSE/Application/Runtime/PGlite链路的两尺寸Playwright证明，不以局部UI或手造State代替。模型/Google/来源/Live/Holdout调用0；只推工作分支停复核，不合main。

## 起点与先行核对

第1段4cbc521b已于本轮按用户批准，从远端main404a766e快进推送main；无新合并提交、无代码/文档附加改动、无门禁重跑。推送后确认远端main等于4cbc521bb9e4fb177e247266561bd90eb5d34e3f。第2段分支codex/feat-web-workspace-slice2以该提交为起点，STATUS的合入记录只在本分支更新。

- G1 questions接口接受当前展示candidateId并核对归属/版本。只在原允许的PRESENT_RESULTS阶段使用，不改服务端G1路径、引文和敏感提示。投影只有全Case最近一次pageQuestion，本段只显示匹配当前店的这一条，不新增问答存储。
- 条件没有通用无模型修改接口；本段只聚焦并预填Change <condition> to，仍走原消息路径。只对partySizeSource=INFERRED_CLOSED_PARTY加问号，不把日期表达/strength当推测。
- 旧候选存在同Case的SEARCH_COMPLETED/RESULTS_PRESENTED事件中，project已读取这些事件；可复用原数据生成只读差异/历史备选名称投影。按有效需求更新/investigationRevision分组，不把searchRevision或another-batch当成新需求。原因只能来自当前适用的结构化判定，否则No longer matches；不能使用旧可用性作为当前事实。
- 语义失败、来源尝试和结束记录在内部有类型化事件；只读投影须保留区分，不能解析助手/Activity自由文本。若某分类仍无确定信号，按用户停止条件暂停该项并报告。
- **空结果续查待用户决定：** NO_VERIFIED_RESULT无法通过现有another-batch的应用和Reducer准入；已请求是否授权仅扩展同条件的只读续查。未获批准前不改该后端路径，不假造可用按钮或第二条查询执行路径。

## 接线与实施顺序

1. 主composer在DETAILS调用questions且绑定当前候选；CANDIDATES/CONVERSATION仍调用messages。删除第二输入框；回答白色底部面板显示店名、原答案和来源/确认提示，外点/下滑收起，卡片、草稿与定位保持。You asked只展示服务器最近一条且candidateId相同的问答。
2. 条件胶囊使用服务端Draft；点击仅聚焦预填。保留英文日期、字号/颜色/单层阴影等视觉规则。用户最新胶囊决定覆盖视觉旧稿“确认后收文字”的组件条款。
3. 服务端只读投影提供最近两个需求版本的removed/added与保存对象，不新增权威State。新批次完成后才展示变化；保存的ID继续保留，未知原因不编。若原日志不能恢复必要对象则停止。
4. 正常批次最后一张之后显示Any of these work?，Find more唯一群青主动作，Saved/Adjust文字按钮，返回能到最后候选。Find more复用another-batch。
5. 空结果/失败依类型化投影渲染指定短文案；SSE error/open显示/清除Reconnecting并保留输入；已有明确过期时间的B1入口改为原refresh。缺少信号/准入的状态只报告，不猜测。

## 验收与停止

Playwright在390×844、1280×900各覆盖用户第2段十项，包括路由唯一、面板与草稿/卡片保持、问答隔离、推测条件、版本差异、备选、收尾/续批、六种状态、断线恢复和第1段十一项。复用并更新被替换的旧问答UI测试；新增测试须抓住实际失效机制。Evaluator不适用：本轮是本地Fixture产品验收，不评价真实模型遵循率。

先记录旧界面/接线的有效反例，固定Fixture和代码，再在净树逐项跑typecheck、arch:check、npm test、build、完整test:browser:fixture。主要新画面390×844截图，核对视觉“不做”：字体字号、单层阴影、间距、唯一群青主动作，无额外动效/装饰。通过后同步STATUS、DEVLOG、TEST-LOG/月度索引，推工作分支，不合main。

不做图片、比较、B2、截图/语音输入、夜间/桌面精修、新结构化修改事件或问答存储。结构化修改只给方案：显式用户Patch事件（拟USER_CONDITIONS_UPDATED），归属/白名单/值域/版本/幂等校验，复用需求失效/取消边界，实施时升TaskDefinition；State若不新增字段保持，Prompt/Proposal不变。本段不实施该方案。

G1不能按当前对象绑定、拿不到上一需求候选、错误没有可区分信号、需改A评测/B搜索G3/C Google、范围扩大或只能用局部测试替代真实链路时，按用户停止条件报告具体缺口与最小方案。
