# 前端第2段实现与复核

- Status: Draft
- Document revision: 0.2
- Last updated: 2026-10-30
- Source of truth for: 本段实现、验收原件、视觉自查和未验证边界
- Evidence status: draft / not integrated；本地Fixture产品验证，不是Live或模型质量证据
- Related documents: [计划](../WEB-WORKSPACE-SLICE2-PLAN.md), [视觉](../product/VISUAL-DIRECTION.md), [Flows](../product/USER-FLOWS.md), [Gateway](../architecture/AGENT-GATEWAY-AND-WORKSPACE.md)

## 交付状态

第1段已按用户批准将main从404a766e快进至4cbc521bb9e4fb177e247266561bd90eb5d34e3f，推送后远端核对一致；无新合并提交或附加内容，按指令没有为该快进重跑门禁。[回执](../../.eval-artifacts/web-workspace-slice2-20261030/main-fast-forward.json)。第2段分支codex/feat-web-workspace-slice2从该main创建，STATUS合入记录只在第2段更新。

五项界面已接通。原空结果动作阻断获用户追加批准后，已补上服务端canContinue及独立Try again；开发新增两尺寸10/10及领域/投影37/37通过。新代码的最终冻结五门禁与截图待运行，通过后只推本分支，不合main。此前cbe036f5的局部实现五门禁1213/197通过保留为历史检查点，不能替代追加状态机改动后的验收。

## 实现与合同

- 唯一主输入框由视图路由：DETAILS调用原questions，绑定当前候选；CANDIDATES/CONVERSATION调用messages。删除第二输入框和Ask链接。纯白底部面板显示店名、原答案/来源/敏感确认，外点、下滑或Escape收起，不清草稿、不移动卡片。
- 原State仅投影最近一问，持久PAGE_QUESTION事件保留完整结果。本段按requestId/readRunId/candidateId恢复按店历史，完成事件逆序，You asked最新在上；无新问答存储或G1执行/引文/20问限制改动。G1仍在原PRESENT_RESULTS阶段使用，搜索未结束时不绕过其准入。
- 条件持续显示胶囊，日期Mon, Nov 2，只有INFERRED_CLOSED_PARTY人数带问号。点击只聚焦预填Change <condition> to，并回到需求视图，避免误发G1；没有新增结构化修改事件。
- 服务端复用project已读取的事件/状态产生revisionDiff、历史备选店名和原因，无额外投影数据库往返。searchRevision仍是搜索计数；requirementRevision按有效需求事件分组。新批完成后比较最近两个需求版本的展示ID，浏览器不做缓存差分。原因只来自当前HARD价格/新时间NO_MATCHING_SLOT，其他为No longer matches；备选保留，重复保存不抹除版本关联。
- 最后一张之后为Any of these work?，Saved/Adjust文字动作，Find more唯一群青主动作，正常续批复用another-batch，返回仍是最后一张。模型失败保留原文；部分来源失败保留结果并在末尾提示；原生EventSource error/open控制Reconnecting；明确过期的交接走原refresh，不改B1链接/证据。
- 空结果的canContinue由服务端证明：必要条件齐全，且池内有未调查候选，或匹配条件的既有观察游标/计划仍有未查工作。无游标、耗尽、缺字段、全部来源失败时为false。前端只按该字段显示Find more，否则只保留Adjust。NEXT_BATCH_REPLENISHMENT_REQUESTED保留旧检查和游标，Context及Validator排除上一轮已调查对象，不重新读取失败/不合格的店；只清除旧收尾窗口，复用原有界预算、Stop和迟到丢弃。
- 全部来源失败须逐店有非空显式FAILED尝试且无成功检查，UNKNOWN/未查/无attempt不能冒充。Try again由canRetry准入，单独复用refresh和AVAILABILITY_REFRESH_REQUESTED重查失败候选，不调用语义、不转成续查。requestId重复不再触发读取，其他请求仍核对版本和归属。
- TaskDefinition22→23；State24持久形状、Prompt28、Proposal4、G1/B1证据与链接规则不变。只改餐厅Domain的显式用户只读转移/准入；Runtime通用层、A评测、B来源搜索/G3和C Google客户端未改，无数据库迁移或重置。

## 验收映射

真实Chromium→HTTP/SSE→生产Application/Interpreter/Compiler/Validator/Router/Runtime/PGlite，只替换模型/来源/问答传输。两尺寸为390×844、1280×900。最终结果待冻结门禁，以下是脚本中的合同映射，不以按钮点击或局部状态代替真实链路。

| 用户项 | 覆盖与独立预期 |
|---|---|
| 1 唯一输入框 | DETAILS的POST只有candidateId/question/requestId/taskVersion；其他视图走messages；可见输入只有一个 |
| 2 面板保持 | 打开前后同一卡片DOM及标题位置、草稿不变；外点/下滑后原卡片 |
| 3 按店历史 | A问→B问→回A再问，A最新在上，B不串入 |
| 4 条件 | 推测4 guests?、明确3 guests；日期格式；点击focus及精确预填 |
| 5 差异 | 固定旧3/新2，2 removed及1 added；价格/时段原因及无结构化依据的通用原因 |
| 6 备选 | 两条旧备选仍在，名称/原因一致，重复保存和刷新后保留 |
| 7 批末 | 最后卡→收尾→Saved/Adjust/返回；another-batch取得实际新候选 |
| 8 六种状态 | 正常空结果、部分失败、全部失败、模型失败、断线、过期分别经真实链路；文案无附近没店/没有座位结论 |
| 9 重连 | 主动断开真实HTTP SSE，原生重连条出现/消失，草稿/卡片不变 |
| 10 第1段十一项 | 原web-workspace脚本保留全部行为，单独G1旧UI测试改接唯一输入框 |

追加五项：池内未查和既有搜索游标两条正向续查均取得新结果；已全查/游标耗尽不显示Find more；续查Stop后迟到卡片不接纳，刷新也不复活；同一时刻双击只发一个续查POST，同requestId重交不再读取；失败与无位旧候选读取数仍各一次。另测旧版本409、异用户404、缺必要条件/已用游标/错误条件指纹拒绝，以及跨目的重查旧失败对象被Validator拒绝。

## 检错证据与历史检查点

旧详情主输入框placeholder仍为Adjust anything?的目标断言红；现有G1引用/敏感确认与按店历史在新入口通过。来源分类混合反例曾把“失败attempt加无attempt细节的AVAILABLE成功检查”误判全部失败，同一断言红→绿；现在逐店检查，另保留无attempt的UNKNOWN控制。[开发原件](../../.eval-artifacts/web-workspace-slice2-20261030/development/index.json)。

Fixture修正没有改变生产规则：固定模型遵守已展示排除集，更新刷新观察时间；20:00查询的错误19:00链接曾被原B1拒绝，修正仅在Fixture。过期正向控制使用来源明确60秒有效期，在原500秒预算内刷新；没有扩大产品预算。新增空结果Fixture由原500秒时限的收尾窗口留下未查对象，下一次显式用户读取复用原预算入口，不手填中间State。

首轮4a4b762c探针把既有登录201误写200，在业务检查前失败，五门禁未运行；[原件](../../.eval-artifacts/web-workspace-slice2-20261030/gates/gates.json)保留。仅修正探针后cbe036f5冻结741项，五门禁1213/197全绿，六步前后净树；[原件](../../.eval-artifacts/web-workspace-slice2-20261030/gates-final/gates.json)。当时empty/all-failed均400的[HTTP证据](../../.eval-artifacts/web-workspace-slice2-20261030/empty-continuation/result.json)属于扩展前历史，不作为当前动作失败结论。新增授权后的生产代码/输入另行冻结。

70447893追加转移后的冻结检查：诊断/typecheck/arch绿，默认1214/1215；唯一失败为restaurant-message-handler旧快照版本断言仍期望TaskDefinition22，实际为用户批准的23。[原件](../../.eval-artifacts/web-workspace-slice2-20261030/gates-continuation/gates.json)保留，build/Chromium尚未运行。只将所属版本断言更新23，未改任何语义输入/Gold/评分或生产行为，再冻结全量验证。

48374ef4随后五门禁1215/203全绿，742项SHA及逐步净树确认。首次截图61张（40新画面/21回归），人工复核发现候选截图取到180ms淡入中间帧，原件保留；仅将第2段capture改为Playwright animations=disabled，使截图取有限动画结束状态，不增加固定sleep或改产品动画/样式。重新冻结后补稳定截图与最终门禁。

## 评价边界与剩余范围

四层：端到端为固定输入的工作区产品行为，最终门禁待运行；逐环节只对已冻结Fixture、HTTP操作及字面量预期判定，真实语义/发现/身份/来源质量NOT_EVALUATED；严重程度不宣称真实模型S0=0，外部模型/Google/来源GET/Live/外写调用均0；归因只到已证实的接口准入、投影、UI和Fixture接线，不推断当前网站能力。固定本地测试不等于Replay、真实模型或Live验收。

结构化条件修改最小方案仍为draft / not integrated：显式用户Patch事件拟USER_CONDITIONS_UPDATED，仅白名单字段；校验归属、完整值域、跨字段约束、expectedVersion和requestId幂等；复用原需求失效/取消/迟到机制。实施时递增TaskDefinition；仅新增持久形状才递增State，Prompt/Proposal不因前端预填改版。本段不实现该事件。

无图片链路/比较/B2/截图语音输入/夜间模式/桌面精修/新增问答存储。生产来源读者/G3接线、TableCheck实际带入和真实模型质量仍未验证；本段真实调用0，未加载.env或运行Holdout。

## 最终门禁、截图与视觉自查

待最新代码与输入冻结后补入最终原件、两尺寸结果、主要新画面截图及视觉“不做”逐项自查。已通过的旧冻结门禁不代替本次追加状态转移的验证。
