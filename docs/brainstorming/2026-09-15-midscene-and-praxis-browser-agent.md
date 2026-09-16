# Midscene 与 Praxis Browser Agent：补充选型研究

- Status: Draft
- Document revision: 0.1
- Last updated: 2026-09-15
- Classification: draft / not integrated；静态源码研究，不是运行基线
- Source of truth for: Midscene 调研、与 Stagehand/browser-use 的比较及候选实验
- Related documents: [前两仓库研究](2026-09-15-stagehand-browser-use-and-praxis-browser-agent.md)、[STATUS](../STATUS.md)、[Test](../skills/test/SKILL.md)
- Related ADRs: [ADR-0002](../decisions/0002-deepseek-model-runtime.md)、[ADR-0017](../decisions/0017-controlled-browser-read-executor.md)、[ADR-0022](../decisions/0022-current-source-fact-lifecycle-and-identity.md)

## 1. 结论与推荐调整

后续修订：[TableCheck / Tabelog 实站走查](2026-09-15-tablecheck-tabelog-browser-walkthrough.md)将研究单位扩展为完整流程。下文“先修 combobox”的优先级已被后续讨论替代；视觉观察应与活动页面范围、条件生效和证据接纳一起评估，源码判断保留，尚未实施选型。

**Midscene 值得加入评估：它提供视觉定位与视觉测试能力，接现有 Playwright Page 的接口也很直接。推荐先作为受控视觉定位的实验候选，而不是把完整 aiAct 循环接入 Restaurant Agent。**

这补充了上一份研究的方向：Stagehand 偏 DOM/AX 观察与浏览器 SDK；browser-use 值得借鉴控件建模；Midscene 适合探索“人眼看得到，但 DOM/无障碍语义不足”的目标。这里是职责判断，不是三个项目成功率排名。

当前 combobox 的已知根因仍是我们把自定义控件当原生 select；先修这个确定性缺口。若正确区分控件后，仍有找不到选项、图标含义不明确或 Canvas 内容不可读的真实反例，再比较 Midscene 的视觉定位收益。不能为了使用视觉框架而默认每一步多调用一个模型。

## 2. 固定研究版本

- 官方仓库：`web-infra-dev/midscene`。
- 本地目录：`/Users/wangzhour/Desktop/Wang/Git/midscene`。
- 固定 SHA：`651afc2eab4c1428b7661068941e2c7f75a54626`。
- 检出 `@midscene/web` manifest 版本：`1.12.7`；不等于已核验发布渠道状态。
- 根许可证为 MIT，版权归 Bytedance 及其关联方；复制代码需保留对应通知。
- 仅浅克隆与阅读代码、官方文档和测试文件，未安装/运行依赖，未读取凭证或个人浏览器 profile。

来源：[manifest](https://github.com/web-infra-dev/midscene/blob/651afc2eab4c1428b7661068941e2c7f75a54626/packages/web-integration/package.json)、[LICENSE](https://github.com/web-infra-dev/midscene/blob/651afc2eab4c1428b7661068941e2c7f75a54626/LICENSE)。

## 3. 真正能复用的能力

### 3.1 视觉定位可以和点击分离

Midscene 当前模型策略以截图为定位输入，数据抽取/页面理解可以选择附带 DOM。相比必须识别具体标签与 role 的执行路径，视觉定位有机会覆盖图标按钮、自定义 UI 和 Canvas；实际准确率取决于模型、分辨率、布局和任务，官方展示不构成 Praxis 网站验收。[模型策略](https://github.com/web-infra-dev/midscene/blob/651afc2eab4c1428b7661068941e2c7f75a54626/apps/site/docs/en/model-strategy.mdx)

源码提供 `aiLocate()`，运行定位任务后返回 `center`、`rect`、`dpr`，不直接调用 aiTap。一个重要细节：模型没有给矩形时，它会生成近似 8×8 rect；因此 rect 不能当成准确元素边界。坐标必须核对截图缩放、DPR、viewport、滚动位置和 frame 归属，不能直接当 CSS 像素点击。[aiLocate 实现](https://github.com/web-infra-dev/midscene/blob/651afc2eab4c1428b7661068941e2c7f75a54626/packages/core/src/agent/agent.ts)

**对 Praxis 的价值：** 模型先指出位置，基础设施再用当前浏览器观察解析其对应的实际控件，经过来源/控件/权威值校验后生成已有 opaque ref。这样视觉定位只增加找元素的途径，不给模型直接鼠标权限。

限制是 Canvas 等目标可能根本没有可验证的 DOM 控件。第一阶段将这类结果记录为视觉探针结果，不能为了提升通过率直接允许坐标点击。若未来需要真实 Canvas 操作，须单独设计观察和授权契约。

### 3.2 可复用现有 Playwright 页面

`new PlaywrightAgent(page, opts)` 实际构造 `PlaywrightWebPage` 并接入共享 Agent，无需为了这种接法安装 Chrome Bridge extension 或更换为新的浏览器云。[PlaywrightPageAgent](https://github.com/web-infra-dev/midscene/blob/651afc2eab4c1428b7661068941e2c7f75a54626/packages/web-integration/src/playwright/page-agent.ts)

相对 Stagehand 当前 extension 初始化路径，这让本地接口试验更直接；但 Praxis 当前使用 `playwright-core` 并把 Page 封装在 BrowserSession 内。应由 infrastructure 持有 page 与 Midscene 实例，不能为接库而向 Router/Domain 暴露原始 Page。包解析、类型/版本和 Cloudflare 远端实际 Page 行为仍待验证，不能仅凭构造函数宣布零改造接入。

### 3.3 存在动作前后 Hook，但不等于现成权限系统

共享 action builder 在执行 `action.call` 前 await `beforeInvokeAction`，Hook 抛错会中止该动作；执行后调用 `afterInvokeAction`。这比只能看整段最终结果的工具更便于接入控制点。[action builder](https://github.com/web-infra-dev/midscene/blob/651afc2eab4c1428b7661068941e2c7f75a54626/packages/core/src/agent/task-builder.ts)

不过 before Hook 位于参数缩放/解析前，接收到的参数不能直接假定为最终坐标；它也不提供 Praxis 的权威人数、当前 observation revision、PolicyDecision 或 Authorization。Hook 被调用不证明所有初始化、导航、工具和重试路径都已受到同一控制。因此首轮仍优先只用 aiLocate，由已有执行器负责动作；完整 aiAct 不是首个接入目标。

### 3.4 视觉断言适合诊断和 UI 验证

`aiAssert` 可以检查选中态、错误提示等视觉结果；`aiQuery` 可抽取字段。其断言结果来自模型输出，代码将 output 转为 pass，不能替代来源 Grounding 或独立的库存核验。[Insight 实现](https://github.com/web-infra-dev/midscene/blob/651afc2eab4c1428b7661068941e2c7f75a54626/packages/core/src/agent/insight.ts)

适合的用途：对 Synthetic UI 或脱敏固定截图检查“选项是否可见、错误是否展示”。不适合的用途：让同一自动化模型点击后自行断言“已选对人数/有库存”，再把这个断言当独立成功证明。

`aiWaitFor` 是有界的模型判断等待，默认 15 秒、检查间隔 3 秒；不是免费的浏览器 DOM wait，不能默认替换每一步现有等待，否则会增加模型调用与延迟。源码还包含截图序列观察能力，但当前产品没有必须使用它的验收需求。[Agent 等待入口](https://github.com/web-infra-dev/midscene/blob/651afc2eab4c1428b7661068941e2c7f75a54626/packages/core/src/agent/agent.ts)

### 3.5 本地缓存和可视化报告

缓存可保存规划步骤及 Web XPath 定位，默认不配置即关闭；query/assert 结果不缓存。XPath 有效并不能证明命中的仍是同一业务目标；缓存动作或定位仍须重新验证，且不能用于当前 slot、授权或外部提交重放。[缓存文档](https://github.com/web-infra-dev/midscene/blob/651afc2eab4c1428b7661068941e2c7f75a54626/apps/site/docs/en/caching.mdx)

报告把截图、动作和模型判断放在同一时间线上，这种呈现方式对定位“看错、点错、没有生效、解析失败”很有价值。可以借鉴其诊断视图，但不把完整上游报告直接写入我们的普通 trajectory。

## 4. 接入时需要明确处理的差异

### 默认会改变部分浏览器行为

当前 Playwright PageAgent 默认启用同 tab 导航处理；`forceChromeSelectRendering` 未设 false 时调用注入函数，给 select 添加 `appearance: base-select !important`，改变原生下拉的渲染。受控对比应显式设置两者为 false，保留原始来源行为；它们不是业务提交，但会影响测量对象。[运行选项](https://github.com/web-infra-dev/midscene/blob/651afc2eab4c1428b7661068941e2c7f75a54626/packages/web-integration/src/common/browser-agent.ts)、[渲染开关](https://github.com/web-infra-dev/midscene/blob/651afc2eab4c1428b7661068941e2c7f75a54626/packages/web-integration/src/common/browser-agent-utils.ts)、[CSS 注入](https://github.com/web-infra-dev/midscene/blob/651afc2eab4c1428b7661068941e2c7f75a54626/packages/web-integration/src/puppeteer/base-page.ts)

### 模型与数据契约需要适配

Midscene 的 Default 模型承担视觉定位，可以另外配置 Planning/Insight。我们当前 DeepSeek Gateway 的已实现契约没有截图输入能力；兼容 OpenAI HTTP 格式不代表能够完成视觉定位。不能只改 base URL 就承诺接通。

如采用视觉模型，需要按 ADR-0002 新增明确的供应商/职责决策，并在服务端 ModelGateway 增加经过验证的最小图像输入、用途、版本、累计预算与取消边界。只读定位返回晚于取消时必须丢弃，不能执行动作；`aiAct` 有 abortSignal 不代表其他 API 和底层请求已全部接通取消。

公开 API 有 `createOpenAIClient` 和 `onLLMUsage`，可作为传输与计量适配入口，但并非已经接通 Praxis Gateway。需要确认每次内部调用都被计入，不让上游隐藏重试逃离预算。[API 文档](https://github.com/web-infra-dev/midscene/blob/651afc2eab4c1428b7661068941e2c7f75a54626/apps/site/docs/en/reference/index.mdx)

### 截图与报告扩大了数据输入

官方说明截图发送到所选择的模型服务。当前默认 `generateReport: true`，HTML 可嵌入截图；`persistExecutionDump` 默认 false，但关闭 JSON dump 不等于没有截图报告。实验应显式关闭 report、dump、cache，并核对 debug/log 输出；初次只使用 Synthetic 页面，截图不包含 Cookie、PII、支付或登录信息。`generateReport: false` 仅关闭报告，不能替代对所有日志与请求的检查。[数据说明](https://github.com/web-infra-dev/midscene/blob/651afc2eab4c1428b7661068941e2c7f75a54626/apps/site/docs/en/data-privacy.md)、[Agent 默认选项](https://github.com/web-infra-dev/midscene/blob/651afc2eab4c1428b7661068941e2c7f75a54626/packages/core/src/agent/agent.ts)

## 5. 三个仓库的统一取舍

| 维度 | Stagehand | browser-use | Midscene |
|---|---|---|---|
| 本次最相关能力 | DOM/AX snapshot 与浏览器 SDK | 控件关系、DOM 序列化、动作反馈 | 截图定位、视觉断言、可视化诊断 |
| 本次审计主要接法 | TypeScript SDK；当前需 extension | Python BrowserSession/Actor 或借鉴机制 | TypeScript 包直接接 Playwright Page |
| 不执行动作的候选入口 | page.snapshot / 模型 observe | DOM state 观察 | aiLocate |
| 当前确定性 combobox 缺陷 | 仍需区分原生与自定义路径 | 有直接可借鉴的控件阶段 | 可定位可见选项，仍需展开和操作权限 |
| 最大接入不确定性 | extension/Cloudflare 与 Gateway Schema | Python 运行边界和完整 Agent 控制 | 视觉模型、坐标校验、截图数据与取消 |
| 本次推荐 | 底层替换实验候选 | 先借鉴机制 | 受控视觉定位实验候选 |

不建议三个库一起常驻，再按失败依次重试。按真实失败类别选择实验，采纳时明确替换或补充范围；无收益的实验代码不进入产品主链。

## 6. 最小可验收实验

**问题：** 正确区分控件后，视觉定位能否找到当前 DOM/AX 路径仍遗漏的目标，并安全转回现有控制引用？

这是未来实验计划，本次未执行。沿用 Planning/Test/Post-change：先修现有已知 select 缺陷；再使用原报告同一组 Synthetic HTML，不改变用户目标或 source Grounding。

1. 输入包含正确标注的 combobox 正常对照、缺少语义但可见的选项、两个相同数字的不同控件、遮挡层，以及不同 DPR/滚动位置。Canvas 只测定位，不执行外部点击。
2. Midscene 只运行定位，不运行 aiAct/aiTap/aiAssert 作为成功裁判。关闭缓存、报告、select 样式注入和强制同 tab 行为。
3. 将截图 revision、viewport/缩放参数与返回坐标绑定，回到当下浏览器核对命中元素。只在可验证为当前请求允许的控件后，经已有 executor 操作。页面移动、覆盖、换页、过期或取消即拒绝。
4. 结果由固定页面状态与真实浏览器回读判断：是否命中正确控件、权威值是否生效、旧 slot 是否被拒绝；模型自报成功不计分。
5. 记录定位调用数、延迟、图像/文本 usage（服务未返回则标未知）、正确定位及安全转引用的分母、错误点击、请求条件回读、取消后的动作数。零实际动作的试验只证明定位，不报告执行安全已经通过。
6. 有视觉模型与相应付费授权后，建议首轮最多 12 次定位调用、15 分钟、一次批次，不自动重跑，不增加第二个规划模型。若模型接线尚未批准，只能验证固定输出替身的内部契约，不能报告视觉能力。
7. 关闭试验会话与其临时 profile，保留脱敏输入定义、固定版本及执行/独立评估摘要；不复制私有 Holdout 或真实用户截图。

验收以正确目标可定位且可安全映射、无错误操作、条件和结果回读正确为先；然后比较新增调用成本和维护量。无法映射的视觉目标保留为能力缺口。真实站点兼容性需要后续独立 Live Read-only，不能把本地夹具成功当 TableCheck 通过。

## 7. 实际交付与限制

- 完成官方仓库固定版本、关键实现、公开 API 和测试文件静态核对；补充三仓库选型与首个实验方案。
- 链接、diff、与现有控制边界的一致性按纯文档矩阵检查。
- 未修改产品代码或当前 Capability Matrix；未运行上游测试、Mock、浏览器 Fixture、Replay、餐厅 Live、付费模型或外部写入。
- 无本次成功率、速度、成本收益实测；无需因此修改 STATUS 中已实现能力。
- 输入为公开代码和已暴露开发问题，没有使用 Clean Holdout；本研究不是 Clean Baseline。

**推荐顺序保持为：修已知控件执行链 → 用真实反例选择 DOM/AX 或视觉实验 → 证明收益后接入一个最小能力。Midscene 使视觉路线更值得试，但不消除确定性控制与证据核验的必要性。**
