# 浏览器执行优化与真实搜索体验实施计划

- Status: Draft
- Evidence status: draft / not integrated；本计划不代表已实现能力
- Document revision: 0.2
- Last updated: 2026-09-07
- Source of truth for: 本次浏览器执行优化、原始 H001 验证和本地真实搜索体验的实施顺序与验收
- Related ADRs: [ADR Index](decisions/README.md)，重点 0007、0010–0016
- Related documents: [STATUS](STATUS.md)、[Roadmap](roadmap.md)、[Planning](skills/planning/SKILL.md)、[Test](skills/test/SKILL.md)、[Post-change](skills/post-change-verify/SKILL.md)

## 1. 结论与交付范围

不重写整体架构。保留薄语义解析、Compiler/Reducer、业务 Agent、Task Runtime、Policy/Authorization 和 Verifier；集中优化浏览器执行层，再接入现有 Web。让模型依据文件化 Web Skill 持续负责页面理解与下一步提议，代码负责操作边界、权威参数、执行、证据验证和状态变化。已完成的 TableCheck 单候选 Live 证明真实模型操作、条件回读及显式不可用 slot 证据；这不是 H001 通过证据。

本轮依次交付三个可运行结果：

1. 两个现有来源共享一个有界浏览器执行机制：站点方法只是快捷操作，未完成时模型依据当前页面与当前来源 Skill 提出受控操作。
2. 原始 H001 实际执行到满足现有证据要求的 `PRESENT_RESULTS`；未达到则准确报告卡点，不降低标准。
3. 现有 Web 能在明确的 Live 模式下完成真实搜索，展示可信候选、可用时段、来源链接和失败原因，支持本地有人值守的体验。

第一版交付搜索体验。预约提交、支付、取消、无人值守远程验证码接管和公网部署不属于本轮完成标准。无 API 网站仍是核心能力建设方向，不能因为访问失败改成只返回搜索引擎摘要。

## 2. 开工基线与已知事实

执行者首先按 INDEX 阅读路径检查当前代码和 `git status`。本计划形成时工作区包含 Tabelog 修复与另一窗口的 TableCheck 修复；不得 reset、覆盖、清理或切换分支丢失这些改动。先确认并行窗口是否仍编辑同一文件，基于实际工作树继续；不为本任务自动提交或推送。

已知事实用于减少重复研究，开工时以最新 STATUS 与代码为准：

- Tabelog 原 `/rstLst/?sk=...` 在诊断环境触发 challenge；英文 `/en/rstLst/?sw=...` 已取得真实搜索页。修复了把评论数量链接当成餐厅的解析问题。页面 200 与餐厅链接不证明同店匹配或真实空位。
- TableCheck 正从猜测 slug 改为真实站内搜索、门店身份验证和跟随实际预约链接；最近 H001 仍遇到动态搜索耗尽约 25 秒 Browser deadline。不得回退到拼接猜测门店 URL。
- v2rayN 分流配置与浏览器实际出口是不同证据。用户的 VPS/TUN/Chrome 可访问，不能推定所有自动化运行环境相同，也不能把所有失败都归因代理。
- 当前浏览器方法由 Adapter 脚本调用；`GENERIC_BROWSER` 路由标签本身不代表已有模型观察/操作循环。
- Web 的默认组合仍使用 Fixture；只跑通独立 Live runner 不等于用户已能体验真实搜索。

外部研究采用其设计原则，不复制整套实现：[travel-agent](https://github.com/Prism-Shadow/travel-agent) 的共享浏览器会话、观察后操作和人工交接值得借鉴；浏览器附着/代理配置不等于验证码解决方案。微软材料的站点方法、条件生效检查和分阶段诊断思路作为研究启发，不作为已验证能力，也不复制私有材料到仓库。无需重新展开仓库调研。

## 3. 目标职责与权限

```text
现有 Web / 原始 H001 runner
  → 现有语义链与业务 Agent
  → Action Validator / Router（绑定权威搜索条件）
  → Restaurant availability resolver（保留来源策略）
  → 站点 Adapter
      → 共用浏览器执行器
          加载 browser-read + 当前来源 Skill → 观察 → 站点快捷操作或模型操作提议 → 校验 → 执行 → 重新观察
      → 现有/修正后的确定性身份、条件、空位证据验证
  → 现有 Runtime 决定结果与状态
```

| 部分 | 本轮职责 |
|---|---|
| Semantic Interpreter / Compiler / Reducer | 保留现有边界，不为了浏览器改写业务语义模型 |
| 业务 Agent | 保留单一业务决策权；选择已允许的业务 Action，不接收任意 DOM 指令 |
| Router | 从权威 State 绑定门店候选、日期、人数、时区、硬约束和截止时间 |
| 浏览器模型 | 仅在当前只读子任务内提出下一步；不能改目标、来源策略、Task State 或授权 |
| 共用执行器 | 管理会话、观察、目标引用、动作校验、预算、终止和恢复 |
| Web 方法 | 可信代码维护的常用站点操作捷径；声明适用条件和后置验证，受同一执行边界约束 |
| Domain 验证 | 判定 HIGH 同店匹配、权威请求条件、证据新鲜度及空位；模型解释不能代替证据 |

新增 ADR 明确浏览器模型的有限职责，以及对此前未开放浏览器模型观察/操作部分的替代范围；不改写历史 Accepted Decision。ADR 编号取执行时下一可用编号。本计划不自动把新 ADR 标为 Accepted；按现有决策规则记录用户授权的设计，真正超出授权或冲突的选择再提出，不把普通实施细节变成审批流程。

保留 ADR-0015 的 TableCheck → Tabelog 来源顺序。保留 ADR-0016 的临时 Profile 默认值，以及 LOCAL_CHROMIUM + interactive + manual-intervention 双开关才启用专用持久 eval Profile 的边界。若把 Tabelog 专属接管接口推广到两个来源，必须在新 ADR 明确范围、同步全部调用方；不留下旧配置兼容分支。不得接入日常 Chrome Profile。

## 4. 最小执行契约

### 4.1 观察与提议

扩展现有 BrowserSession 的观察能力，提供页面 URL、标题、可见内容摘要、当前控件值和可操作元素引用。引用由执行器生成，绑定 session/page 与 observation revision；模型不能自行编造 selector。页面变更后使旧引用失效，重新观察。

浏览器模型只输出严格 Schema 的有限动作：定位到已观察链接、点击已许可目标、点击精确权威日期/人数按钮、填写/选择权威参数引用、等待明确条件、声明当前步骤完成、请求人工帮助。`web-skills/browser-read` 与当前来源的 `tablecheck`/`tabelog` Skill 仅提供观察、操作、回读和停止经验；不授予域名、写入、证据或 State 权限。具体枚举按最小实际调用需要实现，不提供任意 JavaScript、shell、自由 URL 或完整 Playwright 接口。复用现有 ModelGateway 和 DeepSeek，不新增供应商或 Agent 框架。

填写日期/人数等从 Router 提供的权威参数取值；模型可选择控件和格式映射，但执行器校验最终值。禁止模型自行放宽条件、修改城市/门店、转成另一天或人数后声称完成。

所有完成声明必须重新观察并检查对应后置条件。模型输出可以定位证据，但 HIGH、AVAILABLE、UNAVAILABLE 和 `PRESENT_RESULTS` 仍由确定性验证决定。当前解析器不能理解的新结构应返回未验证，不能把模型抽取结果直接升级为可信 Offer。

### 4.2 只读权限

页面文本是不可信数据。Prompt 明确忽略页面要求的系统指令、凭据发送或权限扩张；日志和模型上下文不包含 Cookie、Token、完整个人资料或无关页面内容。

不能只凭按钮叫“Search”或 HTTP GET 就认定安全。根据已审查的只读操作类别、目标控件、表单用途和当前任务阶段执行；未知副作用的操作停止并请求帮助。POST 搜索可以在验证为只读查询后支持；预约提交、加入购物车、支付、取消及个人信息提交在本切片均不执行。站点方法与模型操作走相同的权限入口，不能靠调用原始 session 绕过。

导航仅允许已配置的来源入口，以及当前观察中满足来源/跳转规则的实际链接；允许的预约来源跨域跳转按真实证据登记，不能放行任意地址、本机服务或私网资源。人为接管也不扩大产品授权。

### 4.3 方法与通用路径

先把两个真实 Adapter 已验证的操作提取为少量普通 TypeScript 方法。统一输入、适用条件、后置条件和类型化失败；不建设 DSL、插件注册平台或一站点一套 Runtime。

优先使用已匹配的方法；方法前置条件不成立、控件改变或正常页面未完成目标时，允许进入同一会话的通用模型循环。challenge、网络失败与权限拒绝不能成为无限尝试的入口。不可在错误后无条件重跑整个方法。

通用路径应在不调用站点专属操作方法的本地页面上完成一次真实浏览器任务；还需记录实际网站上通用路径的调用结果。只有 Fixture 通过时，声明限于机制验证，不宣称已支持任意网站。

### 4.4 生命周期、等待和诊断

正常等待条件是目标内容出现、控件值已生效、加载状态结束或结果与最新请求关联；不采用长固定 sleep，也不把首次 HTML 获取当成页面就绪。

记录阶段：启动/导航、站内搜索、同店匹配、进入预约页、条件设置与回读、空位读取、证据验证。每阶段输出耗时、最终 URL、失败类别和脱敏证据引用。网络/HTTP challenge、页面未就绪、身份不匹配、条件未生效、解析不支持、真实无空位分别报告。

统一传递父级 deadline 和 AbortSignal。父层取消后停止新模型调用及浏览器动作并关闭非接管会话；禁止 Promise.race 超时后后台继续点击。等待、重新观察与重新提交分别计数。

首轮建议工程上限：每个候选最多 6 次浏览器模型调用，整次 H001 最多 12 次；每候选最多 24 次浏览器操作，自动阶段总计最多 300 秒。单次导航上限 20 秒、单次页面条件等待 10 秒，实际 timeout 取剩余父级预算与本地上限的较小值。模型调用沿用 Gateway 超时并受剩余预算约束；不为每个阶段独立刷新总预算。

这些是诊断上限，不是产品 SLA 或付费授权。首次 Live 前核对已有授权与费用范围，打印本次预算和运行模式；无授权时完成离线工作再集中说明缺口。保留当前来源/搜索次数上限，只有实测明确需要才调整并记录理由。产品自动耗时目标另按 Roadmap 测量，不能把 300 秒说成体验达标。

人工等待与自动耗时分开计量，保持有界人工等待；同一 session/page 暂停后重新观察、验证门店与条件才继续。过期/关闭/跨用户会话拒绝恢复，不把旧截图或旧 slot 当新结果。

## 5. 代码入口与改动落点

以下是阅读和修改候选，不要求逐个新建文件或修改所有文件：

| 入口 | 工作 |
|---|---|
| `src/infrastructure/browser/browser-runtime.ts` | 最小观察/目标引用/执行契约；不放餐厅业务类型 |
| `src/infrastructure/browser/local-playwright-chromium.ts` | 真实观察、受控操作、取消与会话生命周期 |
| `src/infrastructure/browser/cloudflare-browser-run.ts` | 对齐共享契约；未支持能力明确返回，不静默换环境 |
| `src/infrastructure/browser/browser-runtime-factory.ts` | 复用当前环境选择，不新增部署体系 |
| `src/core/model/contracts.ts`、`src/infrastructure/deepseek/deepseek-model-gateway.ts` | 复用现有 Gateway；浏览器决策端口留在合适的浏览器模块，不污染业务 Agent Contract |
| `src/integrations/tablecheck/`、`src/integrations/tabelog/` | 接入同一执行器，保留确定性证据解析；退役替代掉的重复操作路径 |
| `src/integrations/restaurant-availability/availability-source-resolver.ts` | 保留来源策略，准确汇总类型化失败和预算消耗 |
| `src/application/restaurant-execution-router.ts` | 权威参数和统一 deadline 传递；复核当前 20/25 秒整体读预算的实际覆盖范围 |
| `src/domains/restaurant/read-grounding.ts` | 复用并补必要证据检查；禁止放宽成功标准 |
| `src/eval/restaurant/agent-loop/runners/run-hybrid-live-read.ts` | 原始 H001 调用共享组合，输出阶段证据、预算和接管记录 |
| `src/harness/browser/browser-read-fixture.test.ts` | 扩展真实 Chromium 本地行为覆盖 |
| `src/server/local-web-server.ts`、`src/application/persistent-restaurant-agent.ts` | Fixture/Live 显式组合，真实 Provider 注入，修正写死的 Fixture 活动描述 |

若 H001 runner 与 Web 都需要同一 Provider 组合，可抽一个小组合函数；它们是两个真实调用方，不需要 DI 框架。不要新建通用 Domain、Browser 微服务或每次点击的持久化 Task/Event 表。

## 6. 分阶段执行与退出条件

### 切片 A：同一会话内的受控浏览器任务

1. 核对最新基线与并行修改，读取相关 ADR；写最小 ADR 和接口说明。
2. 完成观察引用、动作校验、预算/取消与受控模型决策端口；以本地真实 Chromium Harness 驱动，不先建设孤立基础设施。
3. 把两个来源接入共用执行器；保留已验证站点方法，消除重复会话和重复循环。
4. 扩展现有本地 Fixture，证明方法路径和无专属方法路径均能操作、回读、产出可验证结果；证明敏感动作与旧引用被拒绝。

退出：一个可运行 Harness 入口，两来源代码实际共用执行机制；离线门禁通过；不需要真实网站或付费模型才检查安全边界。不要以创建了接口/目录作为切片完成。

### 切片 B：真实来源和原始 H001

1. 先利用现有只读 Probe 对一个实际候选定位当前瓶颈，保持环境、入口、参数可复现；不把多候选并行加入本轮。
2. 在真实页面完成同店匹配、日期/人数等条件生效回读和空位验证，记录快捷操作及 Skill 驱动模型循环分别参与了哪些动作。2026-09-07 单候选已完成 HIGH 同店、`Book a table Sep 7th … 2 guests` 条件回读与显式 UNAVAILABLE 证据；仍未找到合格 AVAILABLE slot。
3. 执行冻结原始 H001：`npm run eval:restaurant:agent-loop:hybrid-live-read -- --case h001`。先核对 runner 参数与所需环境；不复制人工成功门店/slot 注入权威 State。
4. 输入来自现有 `src/eval/restaurant/agent-loop/drafts/e2e-cases.yaml`，使用现有相对日期 materialization；不修改 H001 约束来迎合现有库存，不读取或修改私有 Clean Holdout。

成功必须同时具备：真实 Google 候选、HIGH 同店证据、权威日期/人数/时段与区域及全部正向 HARD 条件的满足证据、新鲜且明确可用的 slot、Runtime 进入 `PRESENT_RESULTS`。按既有 Domain 规则执行，不另造较弱标准。

一次不成功先按阶段定位；只有新的可验证假设或代码修正才安排下一次有预算运行，不靠连续重跑碰运气。真实无库存、验证码未完成、预算耗尽均如实报告；H001 未完成则该门槛未过，不声称全部交付。可继续不依赖 Live 成功的 Web 接线，不能把它当 H001 的替代证明。

### 切片 C：现有 Web 的本地真实搜索体验

1. 增加明确的 Fixture/Live 服务端组合选择，默认行为及环境变量写清；Live 缺凭据直接报告配置失败，禁止偷偷回落 Fixture 或混入假卡片。
2. Web 与 H001 使用同一真实 Provider 组合和证据路径；密钥仅在服务端，沿用已有持久化和用户隔离，不重建 Case/Runtime。
3. 显示搜索进展、通过验证的最多三项结果、来源与查询时间；无结果、来源不可访问和需要帮助有可理解的不同文案。对原始链接如实说明跳转，不保证另一浏览器保留当前 Cookie/预填参数。
4. 修正硬编码 Fixture activity 文案；刷新/重连从服务端恢复，不能丢失任务或制造第二次并发搜索。用户变更条件后旧结果不能继续作为新条件的有效结果。
5. 本轮真实人工接管可先限于本地有人值守环境；远程 Web 不能控制该页面时明确呈现能力限制，不伪造“继续”按钮已能完成远程验证码接管。远程接管后续切片单独设计。
6. 演示使用现有本地入口；在开放外部体验前检查 session/token 和网络暴露边界。当前 Fixture 身份配置不能直接用于公网。不得擅自部署或宣称生产 Pilot 已就绪。

退出：用户从现有 Web 输入需求能触发真实搜索并看到真实结果或准确失败；至少一条成功 Live 路径关联到完整证据，桌面/移动窄屏关键交互验证通过。给出明确启动说明及当前演示限制。

## 7. 验证与报告

验证矩阵仅以 [Test Skill](skills/test/SKILL.md) 为准。复用现有测试；新增只针对缺失的独立失败机制，不按模块数扩充测试。

本轮重点补充/复用：真实页面动态加载和条件回读；无专属方法路径；陈旧引用或条件变化后的旧 slot 被拒绝；页面恶意指令不能扩权；未知副作用操作被阻断；父级超时后没有迟到操作；同页接管恢复重新验证；跨用户会话不可接管；Live 模式不混 Fixture。

完成共享执行路径后运行：

```sh
npm run typecheck
npm run arch:check
npm test
npm run build
npm run test:browser:fixture
```

Browser Fixture 属于真实本地浏览器，不属于 Live。Replay 仅使用合法、脱敏真实样本；没有则写缺口。Live 按已有授权和开关单独执行；不运行预约/支付，不自动运行真实数据库写入或私有 Holdout。模型 Schema 变化按 Eval Skill 做对应开发回归，不顺便改业务 Prompt 或扩建评分体系。

记录每次 Live 的输入标识、时间、环境/Profile 模式、来源、阶段耗时、模型调用与 token/费用可得值、实际观察证据、人工参与和最终业务状态。完整 DOM/截图留在适当的私有 artifact 范围，公开日志仅写脱敏摘要。当前 runner 的 draft scorer 不能报告为完整质量评分已集成。

H001 是首道成功门槛，不代表所有请求可用。之后按当前 Roadmap 对公开的 H002–H005 做相关行为验证并单列结果，先检查其现有定义和适用条件；不为此读取私有集、重写冻结场景或延迟已可展示的本地体验。

## 8. 文档、退役与交付

实现阶段按实际变化同步 ADR/Architecture、Capability Matrix、Browser Harness、Restaurant Domain 和 STATUS；Web 行为变化同步 PRD/User Flows，入口配置同步 README/环境示例。DEVLOG 和 TEST-LOG 只追加本次事实。历史证据保留，替代掉的可执行路径及重复测试删除，不保留双轨兼容。

交付必须分别说明：

- 实现了哪些用户行为、主要改动位置、旧路径是否退役。
- Unit/Mock、真实浏览器 Fixture、Replay、Live Read-only 分别通过、失败或未运行的内容；Controlled Live-write 本轮未运行。
- 原始 H001 是否真正通过，通用路径是否在真实来源使用，是否需要人工，自动耗时是否达到体验目标。
- 本地 Web 启动方式、配置要求、可体验范围及尚未支持的远程接管/部署能力。

若卡住，报告一个具体阻塞层、现有证据、已耗预算及下一项最小实验；不要新增第二套架构或连续重试。停止不是完成，不把安全失败等同于产品成功。

## 9. 给执行者的工作约束

按 A → B → C 做可运行纵向切片，持续更新短进展。不需要重做外部研究，不要求换模型，不调用多 Agent。先做已授权的实现和离线检查；缺少真实凭据、付费授权或需要突破 Accepted 边界时，集中说明具体缺口及依据。

不建设浏览器插件、Electron 客户端、远程桌面平台、任意 JS 工具、多模型路由、长期记忆、任务调度、通用技能市场或新 Domain。本轮通用性的目标是共享执行机制和受控页面适应能力，不是保证任意网站自动成功。
