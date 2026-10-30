# 前端第2段实现与复核

- Status: Draft
- Document revision: 0.3
- Last updated: 2026-10-30
- Source of truth for: 本段实现、验收原件、视觉自查和未验证边界
- Evidence status: frozen regression；工作分支本地Fixture验收通过、待复核未合main，不是Live或模型质量证据
- Related documents: [计划](../WEB-WORKSPACE-SLICE2-PLAN.md), [视觉](../product/VISUAL-DIRECTION.md), [Flows](../product/USER-FLOWS.md), [Gateway](../architecture/AGENT-GATEWAY-AND-WORKSPACE.md)

## 交付状态

第1段已按用户批准将main从404a766e快进至4cbc521bb9e4fb177e247266561bd90eb5d34e3f，推送后远端核对一致；无新合并提交或附加内容，按指令没有为该快进重跑门禁。[回执](../../.eval-artifacts/web-workspace-slice2-20261030/main-fast-forward.json)。第2段分支codex/feat-web-workspace-slice2从该main创建，STATUS合入记录只在第2段更新。

五项界面及用户追加批准的canContinue/独立Try again已完成。最终代码冻结cbcd667b67e1c9592cb7f737a907a93181139afc、742项输入SHA不变，五门禁全绿：默认1215/1215、Chromium203/203（含G2 5/5）。390×844和1280×900覆盖本段十项、追加五项及第1段十一项；关键工作区脚本31/31（本段22、复用旧工作区/G1脚本9）。40张主要新画面及21张第1段回归截图已保存。只推codex/feat-web-workspace-slice2停复核，不合main。

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

真实Chromium→HTTP/SSE→生产Application/Interpreter/Compiler/Validator/Router/Runtime/PGlite，只替换模型/来源/问答传输。两尺寸390×844、1280×900的下列项目全部PASS，原始测试名/断言在web-workspace-slice2、web-workspace和browser-read-workspace所属脚本中；不以按钮点击或局部状态代替真实链路。

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

48374ef4随后五门禁1215/203全绿，742项SHA及逐步净树确认。首次截图61张（40新画面/21回归），截图自查发现候选截图取到180ms淡入中间帧，原件保留；仅将第2段capture改为Playwright animations=disabled，使截图取有限动画结束状态，不增加固定sleep或改产品动画/样式。重新冻结后补稳定截图与最终门禁。

27769434的稳定截图与五门禁1215/203再次通过；截图自查又发现理解失败短提示在长卡片下面、首屏不可见。原测试的isVisible只能证明元素参与布局，不能证明用户能看到。补“完整位于固定输入框上方”的同一视口断言，两尺寸均红；将原提示节点移到条件下方，卡片/草稿内容保持，复跑目标断言后再冻结交付。该项是本轮发现并修复的UI可见性缺口，不以全仓全绿掩盖。

## 评价边界与剩余范围

四层：端到端为固定输入的工作区产品行为，22个本段场景及9个复用场景全部PASS；逐环节只对冻结Fixture、HTTP操作及字面量预期判定，真实语义/发现/身份/来源质量NOT_EVALUATED；严重程度不宣称真实模型S0=0，已发现的提示不可见体验缺口以两尺寸红→绿关闭，外部模型/Google/来源GET/Live/外写调用均0；归因只到已证实的接口准入、投影、UI和Fixture接线，不推断当前网站能力。固定本地测试不等于Replay、真实模型或Live验收。命令总耗时有原件，逐条首个合格证据/首卡延迟、页面/操作耗时分解未采集，均NOT_EVALUATED，不作效率结论。

结构化条件修改最小方案仍为draft / not integrated：显式用户Patch事件拟USER_CONDITIONS_UPDATED，仅白名单字段；校验归属、完整值域、跨字段约束、expectedVersion和requestId幂等；复用原需求失效/取消/迟到机制。实施时递增TaskDefinition；仅新增持久形状才递增State，Prompt/Proposal不因前端预填改版。本段不实现该事件。

无图片链路/比较/B2/截图语音输入/夜间模式/桌面精修/新增问答存储。生产来源读者/G3接线、TableCheck实际带入和真实模型质量仍未验证；本段真实调用0，未加载.env或运行Holdout。

## 最终门禁、截图与视觉自查

冻结清单[gate-freeze-delivery.json](../../.eval-artifacts/web-workspace-slice2-20261030/gate-freeze-delivery.json)，SHA256为0b805fdc781659afacc05eaf360cb032a0313528f9ae5e95f8daaf8fd3131e9b。[运行回执](../../.eval-artifacts/web-workspace-slice2-20261030/gates-delivery/gates.json)包含六步前后净树、HEAD一致、742文件不变及真实调用0；门禁后仅增加报告/附件，产品/测试/输入字节不再改变。

| 检查 | 结果 | 原件 |
|---|---|---|
| npm run typecheck | PASS | [日志](../../.eval-artifacts/web-workspace-slice2-20261030/gates-delivery/typecheck.log) |
| npm run arch:check | PASS，0禁止依赖 | [日志](../../.eval-artifacts/web-workspace-slice2-20261030/gates-delivery/arch-check.log) |
| npm test | 1215/1215，无skip/todo | [日志](../../.eval-artifacts/web-workspace-slice2-20261030/gates-delivery/test.log) |
| npm run build | PASS | [日志](../../.eval-artifacts/web-workspace-slice2-20261030/gates-delivery/build.log) |
| npm run test:browser:fixture | 203/203，无skip/todo，包含G2 5/5 | [日志](../../.eval-artifacts/web-workspace-slice2-20261030/gates-delivery/browser-fixture.log) |
| localhost准入诊断（门禁外） | 已全查及全部失败均不可续接；仅全部失败canRetry=true | [HTTP原件](../../.eval-artifacts/web-workspace-slice2-20261030/gates-delivery/admission/result.json) |

默认命令含净树校验28.401秒、Chromium140.106秒。所有PNG的尺寸、SHA和来源提交见[最终截图清单](../../.eval-artifacts/web-workspace-slice2-20261030/screenshots-delivery.json)。移动端20张全部目视核对（19张与上一轮已核对图字节相同，错误提示图重新核对）；桌面抽查回答/差异/续查/过期及新错误提示5张，另核对两尺寸长条款动作图。40张新画面中38张与前轮相同，仅模型失败的两尺寸图片因修复更新；61张全部核对尺寸/SHA。

视觉“不做”自查：无斜体、全大写眉标、章节编号、代码面包屑或Emoji；未引入禁用字体，Mono仅logo；字号24/17/15/13、最小13、字重400/600；单层柔和阴影，无边框叠阴影、半透明叠色、毛玻璃、渐变或彩色左线；并列信息用间距，无中圆点/竖线分隔或下拉箭头；首页24px，无超大标题；每个主要状态至多一个群青实心主动作，其他动作文字；无额外图表/解释块，无进度/卡片/光标以外的新动效。全部英文UI，来源原文按G1保留。长内容可滚到固定输入框上方，理解失败提示在两尺寸首屏可见；无图片、比较、B2、夜间、语音截图输入或桌面精修。

原始失败日志保留未改，git diff --check仅对归档日志的原空格行有提示；产品/文档/脚本diff检查干净。未读取生产凭据，未运行真实模型、Google、来源GET、Live、外部写入或Holdout。src/core、src/integrations、src/eval相对起点差异为0，G1/B1执行规则未改。

| Screen | 390 x 844 | 1280 x 900 |
|---|---|---|
| Conditions | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/mobile-slice2-conditions.png) | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/desktop-slice2-conditions.png) |
| Answer panel | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/mobile-slice2-answer.png) | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/desktop-slice2-answer.png) |
| You asked | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/mobile-slice2-you-asked.png) | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/desktop-slice2-you-asked.png) |
| Changes with evidence | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/mobile-slice2-revision-structured.png) | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/desktop-slice2-revision-structured.png) |
| Changes without specific evidence | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/mobile-slice2-revision-missing.png) | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/desktop-slice2-revision-missing.png) |
| Saved with reasons | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/mobile-slice2-saved-structured.png) | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/desktop-slice2-saved-structured.png) |
| Saved with fallback reasons | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/mobile-slice2-saved-missing.png) | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/desktop-slice2-saved-missing.png) |
| Batch end | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/mobile-slice2-batch-end.png) | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/desktop-slice2-batch-end.png) |
| No qualified result; exhausted | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/mobile-slice2-empty.png) | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/desktop-slice2-empty.png) |
| All sources failed | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/mobile-slice2-all-sources-failed.png) | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/desktop-slice2-all-sources-failed.png) |
| Try again recovered | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/mobile-slice2-retry-recovered.png) | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/desktop-slice2-retry-recovered.png) |
| Model failure; visible guidance | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/mobile-slice2-model-failure.png) | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/desktop-slice2-model-failure.png) |
| Partial source failure | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/mobile-slice2-partial-source.png) | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/desktop-slice2-partial-source.png) |
| Reconnecting | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/mobile-slice2-reconnecting.png) | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/desktop-slice2-reconnecting.png) |
| Expired handoff | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/mobile-slice2-expired-handoff.png) | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/desktop-slice2-expired-handoff.png) |
| Continue unread pool | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/mobile-slice2-continue-pool.png) | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/desktop-slice2-continue-pool.png) |
| Continue observed search | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/mobile-slice2-continue-search.png) | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/desktop-slice2-continue-search.png) |
| New pool results | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/mobile-slice2-continued-pool.png) | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/desktop-slice2-continued-pool.png) |
| New search results | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/mobile-slice2-continued-search.png) | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/desktop-slice2-continued-search.png) |
| Continuation stopped | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/mobile-slice2-continuation-stopped.png) | [PNG](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/desktop-slice2-continuation-stopped.png) |

[Long cancellation terms: mobile](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/mobile-cancellation-actions.png) / [desktop](../../.eval-artifacts/web-workspace-slice2-20261030/delivery/desktop-cancellation-actions.png).

[Visual self-review record](../../.eval-artifacts/web-workspace-slice2-20261030/visual-review.json).
