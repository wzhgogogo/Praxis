# Browser Agent 餐厅只读调查实施与 Review 计划

- Status: Accepted；范围与验收计划，实际完成证据见最终复核，不代表 P5 或任意网站能力
- Document revision: 0.4
- Last updated: 2026-09-16
- Source of truth for: 本次 Browser Agent 改造范围、执行顺序、交付验收与独立 Review
- Related documents: [INDEX](INDEX.md)、[STATUS](STATUS.md)、[联合诊断](brainstorming/2026-09-16-browser-observation-action-memory-validation.md)、[此前实施计划](BROWSER-EXECUTION-AND-LIVE-SEARCH-PLAN.md)
- Governance: [Planning](skills/planning/SKILL.md)、[Test](skills/test/SKILL.md)、[Eval](skills/eval/SKILL.md)、[Post-change](skills/post-change-verify/SKILL.md)
- Executor: Terra；Reviewer: 本任务的原研究者，执行完成后独立审阅实际 diff 和证据

当前执行结果：原 Reviewer 已继续修复并完成约定餐厅只读切片的真实比较/修订验收，详见[最终复核](history/BROWSER-AGENT-FINAL-REVIEW-2026-09-16.md)。下面的早期交接记录保留作历史，不再作为当前状态；新商户迁移失败、未完成地图语义和其他限制均逐项列明。

> 2026-09-16 historical handoff note: P0 的 Stagehand 取舍已完成并决定不引入生产依赖。P1 的共享受控观察/动作切片、同会话新标签页、双端金额滑条与弹窗滚动均在真实 Chromium 本地 Fixture 通过；生产来源的 checkbox/range 仍为默认拒绝，等待真实页面观察后形成正向、来源持有的控件契约，绝不恢复宽泛 GET 许可。P2 已在当前 Router/Domain/Evidence/Web 组合验证原始条件、显式许可替代、候选隔离的商业条款、模型最小来源笔记比较与精确条款刷新；这些均是离线证据，不等于真实来源兼容。P3 没有本轮明确的模型/Live 授权，故未运行；P4 的更新交付包现交原研究者独立 Review。逐项 B1–B14 状态、命令与未完成项见 [P0–P4 delivery](history/BROWSER-AGENT-RESTAURANT-P0-P4-DELIVERY-2026-09-16.md)。

## 2026-09-16 continued execution authorization

The execution note above and the suggested batch limits in section 6 are historical handoff records, superseded by this authorization and the [final review](history/BROWSER-AGENT-FINAL-REVIEW-2026-09-16.md).

The user explicitly authorized completing all remaining P0-P4 browser work, including two-store comparison, revision, new merchants and real Web verification. Earlier batch cost/time ceilings no longer end the overall effort. Individual request deadlines, per-task loop safeguards, cancellation and no-booking boundaries remain. Work proceeds in verified slices: Tabelog inventory evidence, unseen merchants, live Web comparison/revision, then final review. Each run preserves inputs/code hashes and failures; no clean-baseline claim. No real booking submission or production database reuse is authorized or required.

## 1. 交付目标与边界

**最终方向：通用浏览器能力 + 少量站点知识 + 明确任务验收。当前交付：从现有用户入口完成日本餐厅预约前的只读调查。**

用户提出地点、日期、人数、时间和偏好后，系统能搜索候选、查看两站页面、处理筛选/日历/弹窗、读取套餐和限制，返回有来源的准确选项或明确的未完成原因；跨页后保留事实，修改条件后正确重查。不能依赖研究者中途接手、人工指定下一按钮或注入成功 Evidence。

本次完成范围为下面 P0–P4，必须逐个形成可运行纵向结果。不能只交付接口或独立演示。P5 是之后的扩展方向，不计本次完成承诺。

**本次包含：**

- 两个现有平台 TableCheck、Tabelog 的同一套受控执行机制。
- 观察、下一步选择、操作后验证和最小来源笔记，真实接入现有 Router/Adapter/Web/Harness。
- 搜索输入、勾选/取消、日历与人数/时间选择、弹窗/容器滚动、预算滑条、展开详情、公开查询和多标签页读取。
- 用户明确允许范围内的替代查询；比较与修改条件的完整用户流程。
- 现有模型、同一环境中的新商户泛化检查、独立结果评估。

**本次不包含：**预约提交、付款、取消预约、条款代确认、登录/验证码自动化；更换模型供应商；多 Agent/多框架路由；长期向量记忆；浏览器微服务或插件平台；任意 JS/任意 URL 工具；公网部署。

地图保留为明确的能力诊断：本次覆盖受控坐标/拖动/滚轮基础及可验证的地图控件行为；**不要求为完成餐厅调查先建成可靠的地图地理搜索**。遇到语义不明的 Canvas 标记应明确无法确认，使用同页可见列表继续任务；地图范围变化不自动满足用户地理条件。完整视觉地图能力列入 P5，不报告为已完成。

## 2. 开工基线：先确认，避免重建已有能力

按 INDEX 路径读取权威文档，重点 ADR-0013、0015、0016、0017（Draft/已授权局部实现，不冒称 Accepted）、0020、0021、0022、0024、0025；核对最新文档状态。当前 H001–H005 以[当前验收契约](../src/eval/restaurant/agent-loop/cases/README.md)为准，不能沿用旧推荐/库存口径或修改 Gold 迎合本次结果。

本计划编写时 HEAD 为 `a0937649be326ed813136be88a3c8da6b938da80`，工作树有大量既有未提交改动。Terra 开始时保存 `git status`、HEAD、实际 diff 和受影响文件清单；不 reset/stash/覆盖既有改动，不把它们都归为自己的实现。不要默认切分支、commit 或 push；如需分支按 Conventions 检查后操作，推送仍需明确授权。

已核实的入口及缺口：

| 当前入口 | 已有能力 / 此次关注点 |
|---|---|
| `src/infrastructure/browser/browser-runtime.ts` | 已有 Snapshot/Session/Control；control kind 当前仅 LINK/BUTTON/INPUT/SELECT，观察和操作契约需按行为扩展 |
| `playwright-browser-controls.ts` | 复用元素登记与引用解析；补区域、状态、非标准控件和滑条等必要信息 |
| `browser-action-decision.ts` | 已有 ModelGateway 决策；复用它作为下一步规划，不以 Stagehand observe 代替 |
| `browser-task-executor.ts` | 已有预算、引用、循环、等待和完成检查；当前模型文本截断、disabled 过滤、错误反馈及状态变化判定是重点 |
| `local-playwright-chromium.ts` / `cloudflare-browser-run.ts` | 同一 Session 契约、取消、生命周期；支持差异显式报告，禁止静默切换运行环境 |
| `browser-read-skills.ts` + `web-skills/{browser-read,tablecheck,tabelog}/SKILL.md` | 复用固定仓库来源知识，不建新技能框架 |
| `src/integrations/{tablecheck,tabelog}/` | 保留身份与来源证据解析，操作走共享执行器；避免重复循环和 merchant-specific 分支 |
| `src/integrations/restaurant-availability/live-browser-availability.ts`、`src/integrations/restaurant-facts/` | 当前事实/库存来源组合，不创建旁路 |
| `src/application/restaurant-execution-router.ts` | 绑定权威参数、预算、取消与证据，不向模型下放其职责 |
| `src/domains/restaurant/{contracts,read-grounding,read-assessment,agent-context}.ts` | 已有 evidenceId/sourceUrl/requestFingerprint/适用时间/引用与 supersedes；复用而非另造事实数据库 |
| `src/eval/restaurant/agent-loop/hybrid-read-composition.ts`、`src/server/local-web-server.ts` | Harness 与 Web 必须使用真实共享组合，不能只在独立 runner 内通过 |

先复用并补现有测试：BrowserTaskExecutor、ActionDecision、Local/Cloudflare runtime、两站 Adapter、read-grounding/read-assessment、真实 Chromium Fixture、hybrid-read-composition 和 Web 集成。按失败机制补测试，不逐文件新增测试。

## 3. 固定职责与最小信息契约

```text
用户请求 → Interpreter/Compiler → Runtime 权威请求
  → 业务 Agent 选择调查 → Router 绑定具体查询及许可
  → 现有 BrowserTaskExecutor
       观察（页面结构 + 可见状态 + 必要来源内容）
       → 现有 Browser Decision LLM 选择一步
       → 动作 Validator 校验 → Playwright 执行
       → 后置条件检查 → 重新观察 / 更新非权威工作笔记
  → 来源证据接纳 / Grounding → Reducer → Web 结果
```

### 3.1 观察至少保留哪些信息

- 会话/标签页/页面身份、观察 revision、来源 URL 和时间；旧引用不能跨 revision/page/session 使用。
- 活动弹层/区域、元素角色、可理解的名称、父级上下文。日历日期必须关联年月；滑条上下端必须区分。
- 可见、禁用、选中/勾选、当前值与可选项分开；不把选项列表第一项当当前值。**不可操作元素仍可作为状态证据，但不能成为可执行目标。**
- 内容按当前任务选择可追溯片段；提供受限的“读取其他区域/展开详情”路径。不能只把现有 4,000 字符上限调大，或把完整 DOM 无差别传给模型。
- 记录截断/遗漏范围；模型看不到不等于页面不存在。页面中的指令不成为系统指令。

### 3.2 动作契约

延续不透明 targetRef；模型不能输出供执行的任意 selector、URL、脚本。按当前用例增加必要动作语义，名称由实现与既有风格统一，不要求逐项建类：

- 读取区域、展开公开详情、打开已观察公开链接、切换已知新标签页。
- 设置查询值、选择日期/人数/时间、设置复选框为明确 true/false。
- 在指定观察容器内滚动；对观察到的滑条进行有限拖动/键盘调整并回读实际值。
- 点击明确的 Search/Update/Reset 查询控件；按实际作用和来源阶段判定许可，不能把所有 submit 一律当预约，也不能把所有 submit 一律放开。
- 坐标动作必须绑定已观察目标区域、范围与短期 revision；不开放任意页面坐标自由操作。地图图像无可核验语义时报告观察缺口。

优先使用已有高层原语；确需受控 pointer 原语时复用两个真实控件需求（预算滑条与地图），不创建动作插件体系。原生 checkbox 用幂等设置而非盲目 toggle。普通单选项不能任意“反选”。

### 3.3 请求与替代条件：必须先解决的契约点

原用户目标不允许 Browser LLM 改写。**每次具体来源查询仍绑定不可变的日期、人数、时间窗。**

- 用户没有许可替代：查原条件；其他时段最多作为明确的待确认建议，不能当作原目标合格结果或自行执行越界查询。
- 用户明确许可替代范围：业务层保留原条件与许可范围，Router 为每次探索绑定具体查询；模型只能提议范围内选择，不能自行创造日期/人数。原目标、当前探索条件、来源实际回读条件分开。
- 人数变化须来自用户新请求；测试中四人来自独立用户修订消息，不把“允许替代时间”扩展为“允许替代人数”。
- 在已有时间窗内探索可复用当前契约；涉及多日期或原目标之外的替代，先做最小 Domain 契约设计，沿既有 Compiler/Reducer/Router 更新全部调用方，不在浏览器里藏私有覆盖值。
- 若需要扩展既有架构决策，新增 ADR 并说明适用范围，不改写 Accepted 历史。本计划不授权模型修改 State，也不改变外部写入权限。单纯在既有边界内加只读能力不需额外发起无依据的审批。

### 3.4 动作后核验与停滞

返回的反馈要区分：目标失效、被遮挡、已选中、禁用、页面加载中、打开新标签页、值改变但查询未应用、查询已生效、未观察到变化。保留 `action attempted` 与 `effect verified` 两种事实。

等待用明确条件与剩余 deadline；不得固定长 sleep、无限重试或超时后后台继续操作。重复相同动作且无新证据时，反馈具体原因并由模型选择其他合法动作；无合法进展则有界停止。不要用 `force:true` 作为通用补救。URL 变化、页面文本变化都不是单独的业务成功判据。

### 3.5 最小工作笔记与证据

复用来源 Evidence 和 Agent Context，工作笔记不成为第二套权威 State。必要信息：唯一来源引用、商户/套餐/座位归属、原文上下文、观察时间、条件适用性、未知项及替代关系。

- 价格引用需涵盖方案与税费语义，不仅是数字；选中状态从控件事实读取，不从可选项推断。
- 引用存在、同店/同请求关联可确定性核验；开放文本是否支持推断不能仅凭 contains 宣称证明。不加 LLM Judge 来制造“自动验收”。
- 对产品承诺所需字段使用窄解析/状态事实；无法可靠验证的模型解释留作不确定说明，不可满足 HARD 条件或产生 AVAILABLE。
- 必须拦住本次反例：9 人以上电话 ≠ 四人在线可订；包间最低消费 ≠ 人均套餐价；未知 ≠ 否定；0/1/2/3 children ≠ 选中 0。
- 新请求使旧动态结果失效；稳定规则可按适用性引用，价格/条款也有来源时间，不能永久可信。新观察只替代它实际回答的未知项；读到取消截止时间不意味着已知押金和 no-show 费用。
- 输入内容有界、可选取；上限在契约/代码落实，不只在 Prompt 写“最多十条”。不添加向量库、跨用户记忆或全页历史回放。

## 4. 执行顺序与退出条件

### P0：基线、回归与 Stagehand 取舍

**做什么：**保存实际代码基线；梳理上一节真实调用链；在既有行为测试复现关键失败。可使用公开合成 Fixture，合法历史页面材料只作为 Replay 并注明来源；不把探针输出的成功标记当 oracle。

Stagehand 只做小型观察接线验证：固定已研究版本 4.1.0，尝试在受控同一页面/会话内取得快照/候选，所有执行仍由共享 Executor 管理。确认扩展依赖、Chromium 环境、取消与清理；不得偷偷启动第二个无人管理的浏览器或引入 Stagehand 自治循环。

选择依据：在相同 Fixture 与目标页面上比较信息覆盖、定位可用性、耗时/输入量、依赖与代码维护负担。若适配需要第二会话/另一个循环，或收益不明确，本次不引入生产依赖，直接补现有观察器；结论写入交付。Stagehand 不是预定必须采用的产品需求。

**退出：**失败依据已保存、契约差异和是否采用 Stagehand 已有明确决定；不新增长期运行时双轨或复杂可插拔框架。纯研究不得拖延 P1；只做一次本地接线与可复现对照，后续不展开新的仓库调研。

### P1：两站共享的完整浏览器读取流程

**做什么：**在既有接口中完成观察、动作、反馈、同页/新标签页、取消和引用生命周期；两站 Adapter 接入。站点 Skill 只描述页面阶段、控件含义、查询应用方式和停止点，不写具体店名、XPath 行号或库存答案。

**可运行结果：**真实 Chromium Fixture 经同一生产 Executor，在两种页面布局下，从商户/搜索入口到读到当前条件下的选项与规则。模型替身只替换选择，不 mock DOM Grounding；另安排真实模型固定来源验证其选路。

**退出：**勾选/撤销、搜索、日期与人数、允许的时段、滑条、正确容器滚动、遮罩、新标签页均有行为证据；禁止操作、陈旧引用、取消后迟到操作有反例；两平台不维护两套浏览器循环。Fixture 通过不算 Live 通过。

### P2：从用户入口调查、比较与条件修订

**做什么：**接入实际 Router/Domain 证据和现有 Web，完成来源笔记、两店比较、请求更新及范围内替代查询。必要契约变化同步所有调用方和 Fixture，不保留未发布旧版兼容路径。

**可运行结果：**用户请求 → 真实 Application/Router/Domain → 浏览器 → Evidence → Reducer → Web 展示；用户改变日期/人数后，旧结果不再作为当前库存，重新观察的替代方案有清晰标签及来源。

**退出：**同一集成入口覆盖正常结果、合格替代、来源未知和目标无匹配的区分；真实无库存可为正确结果，但“执行器不支持”不能冒充无位。返回调查缺口时说明哪个条件未核实，不能显示成功卡片。

### P3：有界真实验收与新商户迁移

先完成 P1/P2 对应离线门禁，再运行有授权的真实调用。首批固定场景，不边跑边改 Prompt/Gold 追求通过；修复后新增 run，旧失败保留。

1. 每个平台一个已研究商户：固定偏好、明确替代许可，实际模型自主完成只读路径。
2. 跨两店比较，再发送人数/日期修订；检查笔记与动态证据更新。
3. 每个平台一个未参与实现调试的新商户：运行前登记，禁止按该商户新增专属代码后仍称首次迁移成功。它只是未调试开发样本，不称 Clean Holdout。
4. 一次实际 Web 交互，使用同一共享组合；适用的当前 H001–H005 先做离线回归，真实复跑只有在剩余授权预算内进行，不能声称此四商户测试等价于 H001–H005 全通过。

**退出：**两站各至少一条模型自主读取路径有完整结果证据，且比较/修订在真实入口生效；新商户测试分别报告可迁移/失败/未覆盖。库存不匹配不强求成功，但本轮若所有场景都停在控件或观察错误，不能宣布调查能力验收通过。

若 Stagehand 被采用，必须记录它在真实执行中实际贡献哪一步；否则明确是改进后的现有观察器，不借 Stagehand 名义报告结果。

### P4：整理交付，交原研究者 Review

退役被替代的执行路径和重复测试，保留历史文档与 evidence。同步 STATUS、Capability Matrix、Harness、相应 Domain/Architecture/Schema/Prompt 版本、DEVLOG、TEST-LOG；按实际变化更新 Web 文案和启动说明。

完成第 7 节交付包。Terra 不自称“独立 review 通过”，原研究者在收到结果后按第 8 节复核。

### P5：后续扩展，不夹带到本次

另一类新网站（非餐厅平台）的迁移测试；有依据的视觉观察/地图语义；授权后的预约提交与 Outcome 验证。这些另定验收和预算。真实预约必须建立在稳定只读结果、有效授权及提交结果验证上。

## 5. 行为验收矩阵

| ID | 用户可观察行为 / 失败机制 | 必须保留的独立证据 |
|---|---|---|
| B1 | 语言弹窗遮挡背景日历 | 识别/处理活动层；没有强制点穿；日期在正确年月下生效 |
| B2 | 19:00 禁用，允许邻近时段 | 原条件保留、允许范围绑定、替代标签、目的页实际条件；不推断全日无位 |
| B3 | 日期/人数已选中 | 反馈已选中而不重复操作；选项与 selected/value 独立读取 |
| B4 | 搜索与 Filters | 查询输入、checkbox true/false、Update 生效、重开保留、Reset 清空 |
| B5 | 双端预算滑条和弹窗滚动 | 上下限显示金额而非档位；目标容器 scroll 改变；位置变化不冒充金额生效 |
| B6 | 点击公开链接打开新页 | 绑定新页身份和父会话；重新观察条件；无迟到/遗留标签页操作 |
| B7 | 长页面与套餐细则 | 能读取页尾/展开内容；金额、税费、套餐、包间最低消费、取消规则不串联 |
| B8 | 两店跨页比较 | 新决策仅获得最小笔记；每个事实有匹配来源；丢失事实按未知处理 |
| B9 | 用户将两人改四人/改日期 | 权威请求更新、旧库存失效、合法重查；不能仅改 UI 标题 |
| B10 | 新证据补充取消规则 | 精确替代旧未知；不扩写未观察到的押金/no-show/选中状态 |
| B11 | 敏感动作/页面注入/旧引用 | 被拒绝，不让模型、页面或站点 Skill 扩大权限；未提交预约 |
| B12 | 超时、取消与预算 | 跨候选/来源累计、跨任务隔离；取消后停止且清理；无隐式 provider fallback |
| B13 | 未调试的新商户 | 同一组合、无商户专属顺序；成功和失败均留完整 trace |
| B14 | 地图与非语义控件 | 操作与语义结果分别报告；无法验证标记/地理范围时不得编造来源或位置满足 |

矩阵规定行为，不规定唯一动作顺序或测试文件数。稳定规则解析、状态检查应走确定性检查；开放语义留下独立审查范围，不能为通过全部格子建立一个自证正确的评分器。

## 6. 验证顺序、调用预算与停止条件

验证唯一矩阵仍为 Test Skill，本文列本切片适用范围：

1. 改动前保存已有失败与代码基线，新增失败回归要在旧实现上证明失败原因。
2. 改动后相关测试 → 四项代码门禁 → 真实浏览器 Fixture；共享路径/Runtime/Schema 变化运行完整套件。
3. 使用真实组合产出的 artifact 独立评价；确定性测试不能伪造完成 State 或跳过 Grounding。
4. 再做真实模型 + 固定来源诊断与有界 Live；两种模式分别报告，绝不自动读取私有 Holdout。

```sh
npm run typecheck
npm run arch:check
npm test
npm run build
npm run test:browser:fixture
```

现有入口：`npm run probe:restaurant:browser:read`、`npm run eval:restaurant:agent-loop:hybrid-live-read`、`npm run eval:restaurant:agent-loop:artifact -- <artifact.result.json>`、`npm run dev`。实际参数/模型开关按当前代码确认；不要复制过期 CLI 参数。探针可辅助定位，但产品验收必须使用真实共享组合。扩展诊断应优先复用现有入口。

**本计划本身不启动或新增付费运行授权。** 用户将计划交给 Terra 后，先核对执行时授权范围；已有授权覆盖则继续，不重复请求。若缺 Live 额度，先完成实现与离线检查，集中列出可直接执行的具体场景和上限后再请求，不在每一步停下来。

建议执行批次预算（需在首次新增付费运行前明确采用）：

- 真实模型固定来源诊断累计最多 12 次调用。
- Live（含业务决策、浏览器决策及事实解释）累计最多 60 次模型调用，Google 请求累计最多 30 次。
- 每个 Live 任务最多 15 次模型调用、60 次浏览器操作、8 分钟；整批自动运行最多 40 分钟。
- 每个场景先跑一次。代码修复后允许同一额度内一次针对性复验；不得通过阶段/来源/重启重置批次额度。以现有更严格限制与本次额度的较小值为准。
- 列出 tokens、调用数、耗时；价格不可得则注明费用未估算。现有配置较大不构成额外授权。

额度不足以覆盖全部验收时，明确列“未运行”，不能增额或宣布完成。挑战/登录/不明副作用时停止该来源；可以在原目标与预算内继续其他合法读取。已有代码/来源失败与本次新引入失败分别报告；不可修复或未完成项阻止相应验收，不阻止交付已完成代码与真实状态。

## 7. Terra 必须提交的交付包

在本机 artifact 中保存详细内容，仓库文档只记录安全摘要。交付一个清晰索引，包含：

1. 开始/结束 HEAD、工作树范围、本次改动文件、既有改动如何保留；未 commit 时给可审阅 diff。
2. 真实调用链及 Web/Harness 共用点，Stagehand 采用/不采用的依据；退役代码/测试清单。
3. B1–B14 逐项：PASS / FAIL / NOT_RUN / PARTIAL；对应代码、测试、execution 和 evaluation 链接；注明 scripted/model/人工介入。
4. 所有命令、结果、失败原因；四项门禁及 Chromium Fixture 日志。既有失败不得被省略。
5. Live 原始用户输入、时间物化、实际查询、替代许可、revision、模型/Prompt/Schema 版本、环境/profile、调用与 token/耗时、终态和清理；不记录 Secret/Cookie/PII/隐藏思维链。
6. 代表性步骤的观察 → 提议 → 校验 → 执行 → 后置验证 → 来源事实 → 最终展示支持链。
7. 已知局限、未通过门槛、下一项最小修复；新商户是否调试后重跑，严禁包装成未见样本成功。
8. 本地 Web 可复现启动与体验步骤；任何需要真实调用的复现注明预算/授权，Reviewer 默认先离线审阅。

历史诊断材料在 `.eval-artifacts/browser-capability-suite-2026-09-16/`，不可用新的结果覆盖。若其他机器没有该目录，使用仓库[联合报告](brainstorming/2026-09-16-browser-observation-action-memory-validation.md)与合成反例开工，将缺少原始 artifact 标为证据缺口，不凭空重建成 Replay。

## 8. 原研究者 Review 清单

Terra 交付后，Reviewer 独立执行：

- 检查实际 diff 与调用图：能力是否进入现有产品链，是否存在测试专用成功旁路、第二循环或静默降级。
- 复核权限与事实权威：替代没有改写原目标，模型笔记没有变成无证据 State，敏感动作和 stale target 仍 fail closed。
- 按独立反例抽查 B1/B2/B7–B12；至少包含错误推断、options≠selected、旧请求晚到、同店/跨店引用混淆。
- 重跑相关离线测试和必要门禁，读取已经生成的 Live artifact；不自动重复付费测试。
- 检查 Web 实际结果与引用，不只看 runner `COMPLETED` 或模型文字；确认 map/视觉/预约等未实现项没有被宣称支持。
- 给出按严重程度排序的问题及代码位置；区分“代码可合入”“离线通过”“Live 达标”“产品承诺达成”。代码可合入不自动等于功能验收通过。

发现 P0/P1 安全或正确性问题、未接入实际调用方、结果无证据或用脚本替代模型验收时不通过，交 Terra 修复后针对变更复验。没有必要时不新增或扩大全仓测试。

## 9. 可直接转发给 Terra 的执行指令

> 请按 `docs/BROWSER-AGENT-RESTAURANT-IMPLEMENTATION-PLAN.md` 执行 P0–P4。目标是在现有链路完成餐厅只读调查、比较与条件修订，不是创建独立演示。先从 docs/INDEX.md 读取权威文档、核对工作树，保护既有改动。复用 BrowserTaskExecutor、ModelGateway、站点 Skills、Evidence 和 Web/Harness 组合。Stagehand 是有取舍门槛的观察组件候选，不是强制采用；不得把 observe 当完整规划器。按本计划逐切片完成实现和离线验证，有授权后按明确额度做 Live；无授权先完成不依赖它的工作。保留所有失败与独立评价，按 B1–B14 交付实际证据和未完成项。不修改 Gold，不运行私有 Holdout，不提交预约，不自动 commit/push，不开启多 Agent。完成后交原研究者 Review，不自行宣称独立 Review 已通过。
