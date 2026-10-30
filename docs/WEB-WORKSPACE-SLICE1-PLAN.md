# Web Workspace Slice 1 Plan

- Status: Draft
- Document revision: 0.4
- Last updated: 2026-10-30
- Source of truth for: 本切片范围、验收链路、前置检查与停止条件；不替代产品/视觉规则
- Related ADRs: [ADR-0006](decisions/0006-web-first-agent-workspace.md), [ADR-0049](decisions/0049-source-bound-b1-booking-handoff.md), [ADR-0050](decisions/0050-two-line-handoff-presentation.md)
- Related documents: [PRD](product/MVP-PRD.md), [User Flows](product/USER-FLOWS.md), [Gateway](architecture/AGENT-GATEWAY-AND-WORKSPACE.md), [Visual Direction](product/VISUAL-DIRECTION.md)
- Evidence status: draft / not integrated；工作分支本地Fixture验收与净树五门禁已通过，独立视觉/代码复核待用户，不是Clean Baseline

## 当前切片承诺

交付一个从真实Web入口驱动的英文工作区：需求输入、实际查找状态、逐家合格候选、保存/恢复与当前指代、选店后B1准备及用户自行出发。保留身份/证据/版本/取消边界；真实业务模型、Google、餐厅来源和外部写入均0。完成证据为本地真实Chromium经过生产HTTP/SSE/Application/Runtime/持久化链路的可重复脚本、五门禁和390×844主要画面截图。

分支从最新main00519783创建，再快进纳入已复核文档e3c48dbd；文档分支保持独立，不合main。视觉规则与英文文案留在视觉文档，本文件承接原视觉文档的第一段范围和验收，避免实现计划混入视觉规格。

## 前置核对

- 取消路径已存在：DELETE /api/cases/:id/run → cancelCase → active AbortController → 等待该轮completion。禁止把Stop当作现实预约取消。
- 进度链路已存在：Agent loop onStateUpdated → notifyCaseUpdate → CaseEventHub → SSE；Activity包含真实搜索、查位与结果事件，不能由定时器造数。
- 默认FIXTURE组合同步跑完查询；现有W06/W09通过LIVE_READ后台生命周期注入Fixture传输验证取消与SSE。本段复用这种既有离线组合，明确报告为本地Fixture，不能称为真实Live。
- 首家“就绪”须复用当前生产证据资格判断，不能把发现列表或调查中对象标成合格卡片；停止和新请求版本拒绝旧结果。
- 当前图片合同缺失，使用No photo；G3普通来源链接读者尚未启用，B1验收仅使用既有来源绑定Fixture。
- `Choose this`只进入当前候选的B1准备视图，不调用旧的写入选择/授权路径，不生成提交Attempt。
- 当前查看上下文由认证用户、Case和候选归属核验后装配，不写selectedCandidateId；记录到既有消息理解链路，不追加模型调用。
- B1呈现只按ADR-0050拆分选择/核对两行并移动取消冲突提醒；URL生成和证据接纳继续按ADR-0049。

## 实施范围

本段只使用已有Fixture和回放，业务模型、Google及餐厅来源真实调用为0。第0步及复核小修已推送为`e3c48dbd`；本轮在`codex/feat-web-workspace-slice1`实施。

- 外壳为首页、`My plans`抽屉/侧栏、安排工作区。顶部只有菜单、logo及`New plan`；个人资料入口位于抽屉底部，首页只有一句问题和输入框。
- 工作区内切换对话、查找中、候选、详情、备选及预约准备；比较是已定义的后续视图，第一段不做。查找中逐条显示三至四个实际阶段及`Stop`，不造计数或百分比。
- 第一家当前合格候选就绪后自动显示，其余逐家加入。单卡包含照片位置、店名、关键事实、至多一行有依据的来源/时间、一句推荐理由、书签和`Choose this`；可左右切换。当前合同没有图片，本段只显示店名首字及`No photo`，图片链路另做。
- 书签使用现有按Case隔离的备选接口，顶部显示实际备选数量。查看、保存和比较均不等于选定；查看上下文的归属校验见[Agent Gateway](architecture/AGENT-GATEWAY-AND-WORKSPACE.md#当前查看上下文设计已定未实现)。
- SSE按ID局部更新，保留当前卡片、未发送输入和展开状态；刷新恢复原视图及卡片。修改需求或停止后不接纳旧版本迟到结果。
- 选定后在原工作区展开有来源依据的B1准备卡：渠道、方案、价格与手续费、信用卡及取消规定。主动作由`Choose this`切换为来源出发按钮，同一视图不同时突出两个群青实心主按钮；发送按钮仍为深色圆形。
- 出发按钮只写经服务端核验的带入字段，下方最多两行提示：一行选择项、一行核对项，空行不占位；合法的“直接去来源网站”不等待比较。B1只用证实当前空位的渠道，缺证不拼造链接，不以普通公开来源页声称已带入或有位。
- 返回后非阻断地最多问一次；`Not yet`只是现有`NO`的展示文案，跳过沿用已有Skip，仍由服务端持久化claim保证不重问。用户自报不成为`BOOKED_VERIFIED`。

第一段不做B2、B2+、图片链路、比较页、问答浮层、夜间模式、桌面精修或额外动效；问答复用现有回复区域。视觉0.2允许的光标闪动保留，新增动效仅限进度和卡片出现。来源链接生成、证据规则和按钮措辞不改，沿用ADR-0049及预约草案6.2中与之相容的部分。

## 接线与覆盖设计

| 用户承诺 | 必要链路与主要检错点 | 既有覆盖/补强 |
| --- | --- | --- |
| 查找可停止，进度真实 | HTTP创建/更新 → 后台loop → 状态事件/SSE → 当前Case；Stop中止同轮，不接受迟到结果 | 先复用W06/W09，再用浏览器控制的Fixture阻塞/释放来源 |
| 首家出现与其余增量更新 | 当前请求的生产资格判断 → 服务端投影 → 按候选ID合并；首家出现时第二家仍阻塞 | 实际源Fixture逐步释放，独立核对候选身份/条件，不能预填合格State |
| 保存、恢复和输入不丢 | 按用户/Case持久化备选；UI只保存视图/当前候选等定位信息；刷新仍核对服务端归属 | 两份Case隔离，详情/备选来回、刷新与SSE更新的DOM断言 |
| this one | 请求携带当前视图/候选 → 服务端归属校验 → 原消息理解路径 | 捕获Fixture模型/解释器输入中的正确对象；对照Task选定状态不变，跨Case引用拒绝 |
| B1出发与返回 | 既有来源Fixture → 两次服务器校验 → 显式出发记录 → 用户来源页；返回最多一次claim | 选店无外部请求；按钮filled in；两行提示、取消冲突就近展示、Yes/Not yet/Skip与重载 |
| 安全与证据 | 不持有Secret、不新开来源读取、无外部写入、旧请求与陈旧链接不接纳 | 现有HTTP/Domain边界覆盖；只补本切片新增接线的失败依据 |

Evaluator不适用：本轮不是模型质量评测，使用受控模型/来源传输的产品集成验收，不声称模型理解准确率或当前网站兼容性。Mock、真实Chromium本地Fixture、Replay与Live分别报告；实际未使用的模式写未运行。

## 验收与停止点

以下为代码阶段的验收，不由第0步文档检查替代。可重复脚本为`src/harness/browser/web-workspace.test.ts`，真实Chromium在390×844和1280×900各验证：

1. 每份安排的备选互相隔离。
2. 切到详情、备选再返回时，仍是原来那张卡片。
3. 第一家就绪后自动出现。
4. 修改需求后旧版本的迟到结果被丢弃。
5. 刷新恢复原视图及卡片。
6. 选定不触发任何外部提交。
7. 停止后进度结束，不再出现新卡片。
8. `this one`指向正在看的候选，不改变明确选定状态。
9. 出发按钮和提示不出现`selected`或`booked`。
10. SSE更新后未发送输入与当前卡片不变。

另按[Test Skill](skills/test/SKILL.md#验证矩阵)运行五门禁，每个主要画面保留390×844截图并附报告供视觉复核。没有可用的后端取消路径或进度事件、需要改B1链接生成/证据规则、需要触碰A评测、B的Tabelog搜索/G3或C的Google客户端，均停下报告。范围明显扩大或只能用局部测试替代真实入口链路验收时，按[Planning](skills/planning/SKILL.md#切片收敛与偏离提醒)指出偏离并收敛；当前只执行已授权的第1步；完成后推工作分支停复核，不合main。

## 验证与交付顺序

1. 复用既有W06/W09核对取消与进度前置，发现不存在可用生产链路即停下报告。
2. 用现有Fixture完成实际Web入口的两尺寸可重复验收；先捕获目标断言失败，再修复新增接线，不修改A的评测、B的Tabelog/G3或C的Google客户端。
3. 代码与验收脚本完成后提交冻结；五门禁逐项运行并检查前后净树，输出放在Git忽略的证据目录或临时目录，不恢复已提交文件掩盖写入。
4. 每个主要画面390×844截图并目视复核；桌面只做基础响应式。按范围更新STATUS和开发/测试历史，报告未覆盖项。
5. 推送本工作分支，不合main，停止交复核。不运行真实模型、来源预检或任何Live。

## 实施记录（2026-10-30）

用户已复核c67c9276的功能、边界与十项验收，并签收仅SHORTLIST_UPDATED/同run重交一次的规则；指定小修及唯一一次真实语义回归见[本轮计划/报告](reviews/WEB-WORKSPACE-SLICE1-FOLLOWUP-20261030.md)。新增两尺寸长条款遮挡/两个出发入口实际点击验收；单店Ask输入框并入主输入框明确留下一段，本轮不改。模型最多15次、无API重试，先Fixture通过，遇新退化停下；Google/来源GET/Live为0。

已有W06/W09取消/进度前置2/2通过。新浏览器脚本两尺寸覆盖上述10项，另补Tabelog取消冲突就近展示/手续费；保留并改接原来源事实刷新、晚到列表、G1引用问答三项回归，共8/8通过。正式五门禁在冻结4255fcf85b94e39a5be3760203b54ab9d831dd9c的净树逐项运行，默认1210/1210、完整Chromium180/180全绿，各项前后净树。截图、检错与完整日志见[复核报告](reviews/WEB-WORKSPACE-SLICE1-20261030.md)。本切片完成后停用户复核、不合main。

实际链路保留生产HTTP、SSE、Interpreter、Compiler、Validator、Router、Reducer、PGlite；模型/来源只替换为既有Fixture输入的受控传输。TableCheck和Tabelog分别通过其现有Grounding函数接纳合成观察，B1缓存经过原两次校验；不把本地接收器当作网站带入验证。SSE在后台生命周期中推进，但Fixture注入不属于真实LIVE_READ。语义Prompt26→27仅加入查看上下文说明，Schema4、State24、TaskDefinition22、Agent29/Action5/Context17不变，未运行真实模型质量评测。

浏览器原反例暴露并关闭两个实际接线问题：停止事件未映射到stopped；查找中保存备选使在途读取写入发生版本冲突。后者只允许同run、全部中间事件为SHORTLIST_UPDATED的只读完成事件重新提交一次，不增加模型或来源调用，需求修改/停止仍拒旧结果。旧整页UI已替换，无兼容执行路径。图片、比较、B2/B2+、G3来源读者和现实提交均未加入。
