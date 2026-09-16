# Stagehand、browser-use 与 Praxis Browser Agent

- Status: Draft
- Document revision: 0.1
- Last updated: 2026-09-15
- Classification: draft / not integrated；源码研究，不是运行基线或已实现能力
- Source of truth for: 本次外部仓库调研、适配判断与候选实验
- Related ADRs: [ADR-0002](../decisions/0002-deepseek-model-runtime.md)、[ADR-0017](../decisions/0017-controlled-browser-read-executor.md)、[ADR-0022](../decisions/0022-current-source-fact-lifecycle-and-identity.md)、[ADR-0025](../decisions/0025-model-directed-read-investigation.md)
- Related documents: [STATUS](../STATUS.md)、[Browser diagnostics](../harness/BROWSER-READ-DIAGNOSTICS.md)、[Test](../skills/test/SKILL.md)

## 1. 结论

后续修订：[TableCheck / Tabelog 实站走查](2026-09-15-tablecheck-tabelog-browser-walkthrough.md)发现活动弹层、条件生效、替代结果、跨标签页和商户流程差异等共同问题。下文“先修控件”的优先级属于已被后续讨论替代的初步建议；源码事实保留，下一切片改按完整预约前调查流程讨论，尚未实施。

补充研究：[Midscene 与三仓库统一比较](2026-09-15-midscene-and-praxis-browser-agent.md)。Midscene 增加了直接接 Playwright 的视觉定位候选；下述两仓库源码判断保留，尚无任何选型实验结果。

用户所说的 stagehead 本次按 Browserbase 的 **Stagehand** 研究。

**建议保留 Praxis 的任务、授权与证据链，先借鉴 browser-use 的控件建模来修当前阻断，再用一个有界实验判断是否把 Stagehand 作为浏览器底层依赖。** 不建议直接把完整 browser-use Agent 接在 Restaurant Agent 后面，也不建议同时维护两套生产浏览器智能层。

可复用的核心不是另一套业务规划 Prompt，而是：

1. DOM 与 Accessibility Tree（浏览器无障碍语义树）结合的观察，保留控件类型、关系、当前值和可见性。
2. 原生 select、自定义 combobox、弹出 listbox 的不同操作方法。
3. 每次动作后重新观察，验证条件真正生效，并把具体失败反馈给模型。
4. 局部页面上下文与确定性动作，减少模型重复找元素的开销。

这两套项目都不能替代 Praxis 对同一门店、日期、人数、HARD 条件和当前库存的 Grounding。浏览器变强后，上游条件丢失和下游证据接纳错误仍需分别修复。

## 2. 研究依据与范围

已浅克隆官方公开仓库，不安装依赖、不运行上游脚本、不读取其建议的凭证：

| 仓库 | 本地目录 | 固定源码 | manifest 版本 |
|---|---|---|---|
| Stagehand | `/Users/wangzhour/Desktop/Wang/Git/stagehand` | `f1c26a68d97004ef3091bbd6828d20cad2589fc3` | SDK `4.1.0` |
| browser-use | `/Users/wangzhour/Desktop/Wang/Git/browser-use` | `843819cb8131e1370948d381ede9be7f8366ddc4` | Python package `0.13.10` |

版本号来自检出的 manifest，不代表已验证 npm/PyPI 发布状态。本报告源码链接均固定 SHA，避免 main 变化后结论漂移。两仓库根许可证均为 MIT；若后续复制代码，应保留对应版权与许可证通知。托管服务不因开源许可证而免费或自动取得访问权。

本次检查了 Praxis 当前未提交工作树、STATUS 和相关 ADR；已有用户改动保留。未读取私有 Clean Holdout、未改变生产能力、未运行付费模型或餐厅 Live。研究建议尚无成功率、延迟或成本改善实测。

## 3. 我们现在缺什么

### 3.1 控件语义与执行不匹配：已定位的直接故障

[`playwright-browser-controls.ts`](../../src/infrastructure/browser/playwright-browser-controls.ts) 把 `select,[role=combobox]` 统一映射为 `kind: SELECT`；[`local-playwright-chromium.ts`](../../src/infrastructure/browser/local-playwright-chromium.ts) 的 `select()` 最终调用 Playwright `selectOption()`。自定义 div/input combobox 因此进入原生 select 的执行方法。

这与 STATUS 中 2026-09-15 第二轮 H003 的五个候选人数操作失败一致。只加一段 Prompt 或换模型，不能补上执行器不存在的能力。

观察里还没有明确的 native tag、combobox→listbox 关系和 OPTION 类型。现有通用 click 只接受 BUTTON，因此只把 combobox 从 SELECT 改名也不能形成完整可执行链。

### 3.2 观察与进展信号仍较粗

当前控件观察按多组 locator 逐元素读取属性；label 优先 aria-label/title/innerText，没有完整解析 `aria-labelledby`、关联 label 等无障碍命名关系。普通 Playwright CSS locator 能穿透部分 open shadow DOM，但当前代码没有显式遍历 frame，也不能据此声称完整 Shadow DOM 支持。

[`browser-task-executor.ts`](../../src/infrastructure/browser/browser-task-executor.ts) 给模型的正文是前 4,000 字符；模型目标列表直接从当前 actionTargets 生成，没有同样的元素数截断。诊断的前 40 个目标限制只是日志限制，不能当成模型上下文预算。长页面可能既遗漏后部正文，又发送大量无关目标。

[`waitForVisibleChange`](../../src/infrastructure/browser/playwright-browser-controls.ts) 比较 URL/title/body innerText。只有 input value、aria-expanded、aria-selected 改变时可能漏报；倒计时或无关横幅更新又可能报变化。页面有变化与人数已生效是两个不同判断。

### 3.3 官网身份失败需拆开归因

[`google-listed-website-facts.ts`](../../src/integrations/restaurant-facts/google-listed-website-facts.ts) 当前支持 JSON-LD 与窄范围可见事实接纳。H003 的官网身份失败可能涉及页面没有所需信息、没有走到联系/分店页、名称地址表现差异或规则不接纳；现有运行摘要不能证明各占多少。

更好的页面观察和同源链接探索能帮助找到证据，但不能自动把 Google websiteUri、模型判断或品牌首页升级成 HIGH 门店身份。应分别记录“未找到”“已找到但不匹配”“匹配规则无法表达”。

## 4. Stagehand：适合评估为底层依赖

### 已核对的能力

- **当前主线是 extension 驱动的 SDK。** SDK 通过浏览器 extension 执行页面操作；有 TypeScript/Python/Go SDK，当前 TS 要求 Node >=22.18，Praxis >=24 在版本声明上满足要求。`localBrowser.launch()` 可本地使用；`localBrowser.connect()` 可连接 CDP，但实现需要安装/发现兼容 extension，并非任意 CDP endpoint 都可直接使用。[SDK manifest](https://github.com/browserbase/stagehand/blob/f1c26a68d97004ef3091bbd6828d20cad2589fc3/packages/sdk-ts/package.json)、[browser factories](https://github.com/browserbase/stagehand/blob/f1c26a68d97004ef3091bbd6828d20cad2589fc3/packages/sdk-ts/src/browser/factories.ts)、[CDP 初始化](https://github.com/browserbase/stagehand/blob/f1c26a68d97004ef3091bbd6828d20cad2589fc3/packages/sdk-ts/src/cdpClient.ts)
- **结构化观察有明确实现。** Hybrid snapshot 合并 DOM/AX，按 CDP session 共享 DOM 索引，拼接 frame 内容，支持 locator 范围和 Shadow DOM。公开 `page.snapshot()` 是优先研究的无模型观察入口；`stagehand.observe()` 则会调用模型，返回 selector/method/arguments，二者不能混称零成本观察。[snapshot 实现](https://github.com/browserbase/stagehand/blob/f1c26a68d97004ef3091bbd6828d20cad2589fc3/packages/extension/understudy/a11y/snapshot/capture.ts)、[公开 Page API](https://github.com/browserbase/stagehand/blob/f1c26a68d97004ef3091bbd6828d20cad2589fc3/packages/sdk-ts/src/page.ts)、[observe](https://github.com/browserbase/stagehand/blob/f1c26a68d97004ef3091bbd6828d20cad2589fc3/packages/extension/services/observeService.ts)
- **观察与执行可分离。** 可以先取得候选动作，再由调用方用 locator 确定性执行。这比直接交给自然语言 `act()` 更适合 Praxis 每动作校验的边界。
- **支持自定义模型回调。** `model.generate` 可接自己的服务端 Gateway。DeepSeek 不是本次 v4 文档列出的五个内置 provider 之一，应走自定义回调；不能照搬旧版本 provider 配置。仍需验证 Stagehand 请求 Schema 与 Praxis DeepSeek strict transport 的兼容性，以及脱敏、累计预算、取消和 usage 接线。[模型配置](https://github.com/browserbase/stagehand/blob/f1c26a68d97004ef3091bbd6828d20cad2589fc3/packages/docs/v4/configuration/models.mdx)、[自定义模型示例](https://github.com/browserbase/stagehand/blob/f1c26a68d97004ef3091bbd6828d20cad2589fc3/packages/sdk-ts/examples/customLlm.ts)

### 不能直接照搬的部分

1. **`act()` 的自愈会重新推理并执行。** 当前实现可在动作异常后重新定位重试；缓存命中也可直接重放动作。若在 Praxis 外层只检查一次，就可能让后续内部动作跳过校验。首个实验只用 snapshot 与确定性 locator；若以后用 observe，必须将返回目标重新核验并映射为当前短期引用，所有内部动作都可截获前不启用自主 act。[actService](https://github.com/browserbase/stagehand/blob/f1c26a68d97004ef3091bbd6828d20cad2589fc3/packages/extension/services/actService.ts)
2. **Stagehand 原生 select 也不是自定义 combobox 的万能修复。** 底层 `selectElementOptions` 对非 HTMLSelectElement 返回空数组。可通过观察后 click 实现自定义操作，但在真实目标页是否成功仍未知。[select 实现](https://github.com/browserbase/stagehand/blob/f1c26a68d97004ef3091bbd6828d20cad2589fc3/packages/extension/dom/locatorScripts/scripts.ts)
3. **当前缓存是服务端能力。** cache context 需要 Browserbase key/session，默认关闭；启用后发送原始 AX tree 与请求参数到 Stagehand 服务。不能宣传成免费本地缓存，也不能直接用于实时库存证据。当前实验保持关闭。[cacheService](https://github.com/browserbase/stagehand/blob/f1c26a68d97004ef3091bbd6828d20cad2589fc3/packages/extension/services/cacheService.ts)
4. **`extract()` 的 JSON 合法不等于事实可信。** 模型抽取可作为候选字段，仍要用当前 source/node/原始支持片段确定性核对，再进入现有 Grounding；不能直接产出 Offer。[extractService](https://github.com/browserbase/stagehand/blob/f1c26a68d97004ef3091bbd6828d20cad2589fc3/packages/extension/services/extractService.ts)
5. **Cloudflare 兼容性未知。** 我们现在用远端 Playwright/CDP；Stagehand extension 是否能在 Cloudflare Browser Run 的指定引擎安装并工作需要单独验证。不能因都叫 CDP 就宣布兼容，也不应为此默认迁移云供应商。

## 5. browser-use：观察与动作机制值得借鉴

### 已核对的能力

- **DOM/AX/layout 联合观察。** DomService 汇集 DOM snapshot、AX 和几何信息；serializer 过滤无关/遮挡元素、为交互元素编号、保留部分选项和前次节点信息。cross-origin iframe 等能力有配置与范围限制，不能把代码存在当作所有页面默认支持。[DomService](https://github.com/browser-use/browser-use/blob/843819cb8131e1370948d381ede9be7f8366ddc4/browser_use/dom/service.py)、[serializer](https://github.com/browser-use/browser-use/blob/843819cb8131e1370948d381ede9be7f8366ddc4/browser_use/dom/serializer/serializer.py)
- **区分原生 select 和 ARIA/custom dropdown。** ARIA combobox 的 options 读取会通过 aria-controls 找关联 listbox，必要时展开、等待再读取。值得借鉴的是控件关系和动作阶段，而不是复制全部兼容分支。[default_action_watchdog](https://github.com/browser-use/browser-use/blob/843819cb8131e1370948d381ede9be7f8366ddc4/browser_use/browser/watchdogs/default_action_watchdog.py)
- **动作后失效与失败反馈。** multi_act 会在标记为终止序列的动作、URL/focus 切换、错误后停止后续操作；selector map 关联 backend node。这个实现不是任意同页 DOM 变化的完整保证，Praxis 已有的 observation revision 不能被削弱。[Agent multi_act](https://github.com/browser-use/browser-use/blob/843819cb8131e1370948d381ede9be7f8366ddc4/browser_use/agent/service.py)
- **可独立使用 BrowserSession/Actor。** 不必一定启动 Agent；但当前仓库的主要 Python 库接入 TS 服务需要进程边界或移植，维护成本高于同语言 SDK。README 提及的 Browser Harness JS/托管 agent 不是本次 Python 源码的等价能力证明，本次未审计这些独立实现。[Actor](https://github.com/browser-use/browser-use/blob/843819cb8131e1370948d381ede9be7f8366ddc4/browser_use/actor/README.md)、[package](https://github.com/browser-use/browser-use/blob/843819cb8131e1370948d381ede9be7f8366ddc4/pyproject.toml)

### 对我们的具体限制

1. `dropdown_options` 并非纯观察：可能 focus/click，再收起控件。必须拆成每次都受控的操作，不能给它一个“只读工具”的总许可。
2. 某些 ARIA/custom select 分支直接改 aria-selected、class 或展示文字，并触发 click/change。这可能只证明脚本改动成功。Praxis 不应复制主动改选中标记的做法；应实际点击已观察到的选项，由站点自己更新，再回读值和请求对应结果。
3. 源码有 ChatDeepSeek，但默认 Agent 路径会为 DeepSeek 关闭 vision；不能承诺不换模型就得到视觉定位能力。换供应商需按 ADR-0002 新决策，当前先补 DOM/AX。[DeepSeek wrapper](https://github.com/browser-use/browser-use/blob/843819cb8131e1370948d381ede9be7f8366ddc4/browser_use/llm/deepseek/chat.py)、[Agent 初始化](https://github.com/browser-use/browser-use/blob/843819cb8131e1370948d381ede9be7f8366ddc4/browser_use/agent/service.py)
4. 默认 telemetry 开启，cloud-sync 配置也关联该默认值；Agent 取状态时即使 use_vision=false 仍请求截图。这不等于所有环境都会上传，但若实跑必须明确关闭不需要的采集/同步并核对实际请求。不能直接复用个人登录 profile。[config](https://github.com/browser-use/browser-use/blob/843819cb8131e1370948d381ede9be7f8366ddc4/browser_use/config.py)
5. allowed_domains 防护覆盖导航、跳转完成和新 tab 等事件，不等价于预约授权、同源所有请求审计或无副作用保证；同域按钮也可能提交预约。[security watchdog](https://github.com/browser-use/browser-use/blob/843819cb8131e1370948d381ede9be7f8366ddc4/browser_use/browser/watchdogs/security_watchdog.py)

## 6. 如何接入我们的执行链

推荐职责位置：

```text
Restaurant Agent → Validator → Router（绑定门店、日期、人数、预算）
  → BrowserTaskExecutor（生命周期、每动作校验、短期引用、停止）
    → 页面观察/确定性操作（当前 Playwright；Stagehand 作为候选替换）
    → 需要时调用现有 BrowserReadActionDecision / ModelGateway
  ← 页面回读与来源解析
  → 现有 Grounding / 当前证据生命周期 → Runtime
```

Stagehand selector、browser-use nodeId 仅在 infrastructure 内部保存。模型仍使用 Praxis 当前观察的 opaque ref，不取得任意 selector、URL、JS 或网络调用能力。将来若调用 Stagehand observe，其输出也只是提议，必须在当下页面重新验证类型、目标、来源范围和权威值。

不要新增一个统一管理所有 browser frameworks 的平台。首个对比在 Harness 做显式实现选择；若选定新实现，就替换对应路径并退役旧实现，不把失败自动转给另一套 Agent。现有 Local/Cloudflare 的部署差异也需明确，不能因本地成功掩盖远端缺口。

### 取舍表

| 能力 | 建议 | 理由 |
|---|---|---|
| native select / combobox / option 建模 | 立即借鉴 browser-use，修现有共享执行器 | 已有真实失败，最短用户收益链 |
| DOM/AX 范围化 snapshot、frame 定位 | 用 Stagehand 做有界替换实验 | 成熟实现有机会减少自维护；需验证 extension/协议 |
| 完整 browser-use Agent | 暂不嵌入产品 | 增加规划循环、Python 生命周期与权限适配；不能替代业务状态 |
| Stagehand 自主 act / 自愈 | 暂不启用 | 内部重试需要逐动作校验；结果未知时不能重做 |
| 视觉定位 | 后续有明确 DOM 失败样本再评估 | 当前模型与数据边界变化更大 |
| 动作缓存 | 先测重复定位开销，再决定 | 只缓存可复验操作方法，不缓存 slot 或授权 |
| 云浏览器、CAPTCHA 能力 | 不纳入本切片 | 当前具体阻断是控件；托管能力与开源 SDK 分开验证 |
| 底层结构化结果抽取 | 可作提议，不直接形成事实 | 必须保留原始来源支持与当前请求关联 |

## 7. 首个纵向切片：选择人数并读取当前请求结果

**用户可观察结果：** 在受支持的自定义人数控件上，把 Router 已确认的人数设为目标值，随后读取同门店、同日期、同人数对应的库存；未生效就准确报告 UNKNOWN 与原因。

输入复用已有失败机制，不按 H003 ID、10 人或 TableCheck 文案写专用分支。先冻结本切片工作树；当前目录已有修改，旧 commit 本身不足以代表对照。

### 最小实现范围

1. `BrowserPageControl` 加入实际 tag/control 类型、必要的关联列表引用、展开/选中状态；只为当前控件增加所需字段。
2. 原生 select 保持确定性选择；custom combobox 通过观察到的关系执行“展开 → 重新观察选项 → 匹配 Router 值 → 点击 → 回读”。每步受既有 deadline、取消、来源和动作检查约束。
3. 观察引用不得跨 revision 使用。不能用修改 aria-selected 或页面文字来制造成功；不因选项中出现目标数字就认为已生效。歧义、禁用、未加载均保留明确失败。
4. 页变化检测纳入当前目标控件状态；完成依据仍是条件回读与当前库存观察。即使控制值为 10，旧的 2 人 slot 也不能交付。
5. 扩展当前共享 registry/executor 与 Local/Cloudflare session 调用方，复用既有 Browser fixture、实际 read composition、独立 evaluator，不建新的产品 Agent。

### 必需验收

| 场景 | 独立预期 |
|---|---|
| 原生 select 正常对照 | 权威人数被回读；原能力不退化 |
| 自定义 combobox，关联 listbox 异步出现 | 完成展开、观察、点击、条件及结果回读 |
| 同页另一个控件也有相同数字 | 只使用当前人数控件关联列表，不点其他目标 |
| 选项缺失/禁用、点击后值回退 | 稳定 UNKNOWN，不声明人数生效 |
| 仅 value/aria 状态变化、正文不变 | 不因 innerText 不变误判无进展 |
| 人数已变，旧 slot 暂留 | 等待有界；没有当前请求结果不得形成 Offer |
| 过期 ref、取消、提交按钮/跨域目标 | 操作拒绝；取消后不继续点击 |

先在修复前复现目标失败，再走 Test 矩阵：typecheck、arch:check、相关行为测试、共享路径 npm test、build、真实 Chromium 本地 Fixture；来源样本合法可用时加 Replay。真实入口集成保留 Router/Adapter/Grounding/Reducer，然后复用当前独立 evaluator 检查 artifact。补充范围优先并入已有测试，不按模块数加套件。

## 8. Stagehand 选型实验：可运行证据决定是否替换

本节是下一步实验提案，本次没有执行；可与上述修复按顺序推进，不因研究延迟首个产品切片。

**问题：** Stagehand 的公开 snapshot/locator 是否能在保留 Praxis 控制边界的情况下，减少现有控件观察维护量，并改善目标流程的耗时与观察质量？

- 对照：当前修复后的 Playwright 与固定 SHA/版本的 Stagehand，使用同一组本地 HTML Fixture、同一浏览器版本/模式、同一权威请求、同一解析和 Grounding。每种场景各运行 3 次记录分布，不将小样本当长期成功率。
- 首轮只用无模型 snapshot/locator、临时 profile、关闭缓存与无关采集；不引入 Python 服务、不更换模型，不动餐厅 Live。建议时间上限半个工作日，extension/公开接口无法满足就记录具体阻断并停止，不开始大规模 fork。
- 覆盖现有选择人数路径、弹出 listbox、一个 iframe/open-shadow 的诊断夹具。后两项是 Synthetic 能力探针，不是宣称真实来源需要它们。
- 指标：正确控件及关联选项被观察的比例、目标值/结果回读成功、snapshot 与全流程耗时、传给模型的序列化体积、错误和取消行为、需新增/删除的维护代码。零模型阶段不报告模型 token 节省。
- 若需要评估自然语言 observe，再单独安排“同一真实模型+固定来源”的有界实验，所有调用经过现有 Gateway；schema 不兼容即报告，不默默改供应商。没有模型实验便不报告模型选路更好。
- 采纳条件：满足本切片全部安全与行为验收；在相同任务上观察更完整，且维护量或关键路径耗时有明确收益。无法映射来源/元素引用、无法拦截动作、无法协同取消或运行环境不可用，均不进入产品。
- 清理：关闭探针启动的浏览器、删除其新建临时 profile，保留脱敏摘要和固定版本；不清理已有实验资料。

离线通过后的来源验证建议先选一个受既有来源范围允许、实际包含目标控件的页面，最多一次浏览器会话、12 个受控动作、3 分钟，不自动换站或增大预算；若依赖模型最多 4 次，事先取得对应 Live/付费预算。它只证明当次控件与请求回读。然后才用原始 H003 进行一次端到端确认，预算沿用当前契约，结果与诊断分别保存；无真实 slot 可正确返回无可靠结果，但不能把它当有位交付通过。

若最终改变模型供应商、部署/数据政策或受控动作边界，新增 ADR；ADR-0017 当前仍是 Draft / local-eval implementation authorized，不将本研究写成生产授权。新增/修改平台 Adapter 时再同步 Capability Matrix 与 Harness；本次不更新当前能力声明。

## 9. 实际验证与限制

- 完成：官方仓库与固定 SHA、manifest、实现和测试文件的静态核对；Praxis 文档与当前源码调用链核对；报告链接、命令名和 diff 检查。
- Mock / 真实浏览器本地 Fixture / Replay：本次未运行，纯调研没有修改执行路径。
- Live Read-only：只访问公开研究资料和 GitHub 仓库；没有运行餐厅来源验收。
- Controlled Live-write / 付费模型：未运行。
- 未验证：Stagehand extension 与本机/Cloudflare 的实际兼容性、DeepSeek Schema 接线、真实 TableCheck combobox 成功率、Token/延迟/成本收益、上游测试实际通过情况。
- 污染状态：引用当前已暴露开发问题；没有新增或读取 Clean Holdout，不构成 Clean Baseline。

**落地次序：先把“观察到控件 → 正确操作 → 证明条件和结果对应”做完整，再决定用 Stagehand 替换多少底层代码。** 把源码复用与真实结果验收绑在一起，才能避免换了框架却仍卡在同一个产品失败点。
