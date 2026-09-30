# Browser Generic Operations — Independent Review

- Status: Accepted — independent review record; overall Live acceptance NOT CLOSED
- Document revision: 1.2
- Last updated: 2026-09-26
- Evidence status: current executable development checkpoint; not a clean baseline
- Cohort: exposed-development; contaminationStatus: EXPOSED; baselineEligible: false
- Source of truth for: 本轮独立发现、真实验证结果与剩余阻断
- Related documents: [Playbook](../BROWSER-AGENT-GENERIC-OPERATIONS-PLAYBOOK.md), [Current Status](../STATUS.md), [Earlier authorized validation](AUTHORIZED-MODEL-VALIDATION-2026-09-26.md)

## 当前结论

本轮已经得到机制层进展，但不能签收真实来源操作或 H001 整单。A 导航失败隔离的本地真实浏览器对照通过；B 原生选项、button combobox、input property 与缺少合法选项的四个真实模型受控场景通过。三个真实来源探针均未完成目标。最后的 Tokyo Ten 探针暴露“模型选19:00，页面实际选17:30”，独立本地控制随后证明共享 Registry 的动态位置引用会点错节点，已退回同一实施任务修复并通过最终独立本地复核；修复后的真实来源未再验证。

H001 未启动：Playbook 要求先取得有效的来源机制证据，当前条件未满足。不得用安全退出、离线全绿或控件选择替代真实查位与最终展示。

## 改动边界与独立 Review

开工 HEAD `f4bf46ae2c929480b6e35f36cc13ce47f1f38268`，原工作树已 dirty。开工差异保存在 `/private/tmp/praxis-browser-start-diff-20260926.patch`；十四个冻结源文件以“HEAD加开工patch”重建基线，不将前轮 Agent Prompt@18、fact Prompt@10 等旧改动计为本轮成果。[冻结对照](../../.eval-artifacts/browser-generic-review-2026-09-26/frozen-source-comparison.json)在 property 修复后全部相同。上游 semantic、Gold、业务模型、identity、库存接纳和交付窗口未改。

本轮 Browser wire@4 / Prompt@5、共享 Executor/Registry 和 webskills 对齐；统一 `CHOOSE_OPTION`，没有网站名称分支、第二套业务规划或多级重试。模型仍负责根据当前观察选择动作。

| 失效机制 | 独立反例与修复复核 | 证据边界 |
|---|---|---|
| Runtime 自身导航异常未退役会话 | 底层 `page.goto` 先超时，旧响应在新页面成功读取后才释放；两个本地 runtime 均隔离，正常复用、旧abort、慢close、预算连续性通过 | 没有连接 Cloudflare 远端；不能反推此前全部 Live interruption 的原因 |
| 选项未确认仍从下一循环 COMPLETE | 未变化的时间选择与其他页面结果同时出现，原路径错误完成；修复保留 pending confirmation | 异步正确确认仍能恢复；库存结果独立接纳 |
| 后一控件覆盖前一控件未确认状态 | TIME 未确认后成功选择 PARTY，原 pending 丢失；修复在前一选项确认前拒绝下一选择 | 不增加任务队列或重试 |
| button combobox 被两次采集 | 独立标准 button/listbox DOM 形成两个owner，合法选项被拒；修复分类后实际完成 | 仍拒绝错父控件与真实歧义 |
| input 当前值只更新 DOM property | 静态 aria-label、真实 value=7:15 PM，旧观察仍无法确认；同一红例修后两次模型替身调用完成 | 真实模型相同机制通过；不代表焦点proxy具有这个property |
| 观察到执行期间 DOM 位置漂移 | 插入三个无关button，已观察19:00的 `nth(index)` 实际解析为17:30；修复后实际点击正确节点，权限变化拒绝 | 修前后置确认虽阻止错误成功，却没有阻止错误点击本身；真实来源修后未复验 |

详细审查轨迹：[A](../../.eval-artifacts/browser-generic-review-2026-09-26/SLICE-A-REVIEW.md)、[B](../../.eval-artifacts/browser-generic-review-2026-09-26/SLICE-B-REVIEW.md)。动态目标的[独立脚本](../../.eval-artifacts/browser-generic-review-2026-09-26/independent-shifted-options.mts)和[不可覆盖红例](../../.eval-artifacts/browser-generic-review-2026-09-26/independent-shifted-options.red.json)保留实际17:30，而非仅检查实现字段。

生产组合覆盖从 Interpreter/Compiler 的权威请求，经 Runtime/Router、LiveBrowserAvailability、TableCheck Adapter、真实 Browser Decision 解码和 Executor，到 HIGH 同店、日期人数时段绑定的来源证据并实际 `PRESENT_RESULTS`。仅替换模型传输与浏览器来源，没有预填合格 State。这证明接线与选定路径，不能代替真实模型或当前来源。

## 已完成门禁

Property 修复阶段、动态目标返修前：typecheck、arch（0违例）、build、diff检查通过；默认测试 **532/532**；真实本地 Chromium **37/37**。日志在 `.eval-artifacts/browser-generic-review-2026-09-26/property-*.log`。首次早期默认测试受沙箱 localhost EPERM 影响，获准运行后全部通过；不能把环境错误当产品红例。

动态目标最终修复候选：typecheck、arch（0违例）、build、diff检查通过；默认 **532/532**；真实本地 Chromium **41/41**（82506.589833 ms）。证据为 `identity-*.log`；[最终源码hash](../../.eval-artifacts/browser-generic-review-2026-09-26/final-candidate-source-hashes.json)冻结13个相关文件，上游14个冻结文件仍一致。新增主覆盖为两个runtime动态插入控件正常路径，以及同节点权限变化/替换节点拒绝；原生主覆盖补强插入无关select后的正确回读，未新增重复runner。

第四个真实模型控制和第三个来源探针使用 property 候选；其 tracked diff hash 为 `612bf13b2086f1f8111867549a75e61fe07f801e39b6a30585db1ed58cd6f536`。原生/button/缺项三个较早模型控制有各自开始记录和代码hash；不伪称所有结果来自最终尚在修订的目标绑定实现。

## 真实模型与本地 Chromium

四个已登记 run 全部启动、完成并可评分，**4/4通过**；每例上限30秒/4调用，零重试。原始请求、原始响应、usage、结果和独立evaluation分开保存于[模型产物目录](../../.eval-artifacts/browser-generic-real-model-2026-09-26/)。Oracle读取原始DOM当前值，独立于Executor完成标志。

| 场景 | 结果 | 调用 | 耗时 | Token |
|---|---|---:|---:|---:|
| 原生select、7:00 PM与不透明value | 实际value=`opaque-19`，COMPLETED | 1 | 1179 ms | 2224 |
| 标准button combobox | 打开后选7:15 PM并回读 | 2 | 2036 ms | 3817 |
| 缺少合法时间 | 请求人工帮助，未改成其他时间 | 1 | 1038 ms | 2095 |
| 静态标签input property | 实际value=7:15 PM，COMPLETED | 2 | 2107 ms | 3717 |

模型为 `DEEPSEEK / deepseek-flash`。合计6次调用、11853 token；具体货币成本未估算。没有真实网站访问、fixture写操作或额外模型重试。这是已暴露开发控制，不推断长期成功率。

## Live Read-only：全部保留失败

三个已登记来源探针均启动；**0/3完成目标**。每例上限60秒/6调用，额度已用完，没有扩额或自动重跑。所有结果和独立evaluation在[来源产物目录](../../.eval-artifacts/browser-generic-live-2026-09-26/)。

| Run ID | 页面/机制 | 结果 | 调用 / 耗时 |
|---|---|---|---|
| `85536081-59dd-43a4-9438-7b0eeba5e39e` | Tokyo Ten guide，初始custom Time | 提出并执行19:00选择，后置未确认，模型调用额度耗尽 | 6 / 27410 ms |
| `83971e0d-a28d-4beb-8cbe-ee8a66637d3e` | OpenTable公开首页，跨域迁移观察 | `page.goto` 返回 `ERR_HTTP2_PROTOCOL_ERROR`；未到控件阶段 | 0 / 2951 ms |
| `bfad6862-ee63-4140-b28b-7d01d32bde9b` | Tokyo Ten guide，property修复后的已登记控制 | 模型选19:00，下一页面宣布17:30 selected；input.value为空，父级可见17:30，未确认并耗尽调用额度 | 6 / 32881 ms |

合计12次模型调用、87549 token；均在调用/时间上限内，但资源合规不等于目标成功。两次Tokyo各有一次非法WAIT（缺targetRef），后续未确认状态还引发重复选择拒绝；这是额外无效消耗，不是最早的选项生效失败。OpenTable未访问成功，不评判其控件兼容性。

Tokyo 本次是 guide 页的custom control；此前H001原生select来自另一预约页面，不能把两者当同页前后对照。当前原始DOM说明readonly input可能只是焦点代理，当前可见值在兄弟节点；不能盲取祖先文本为已选值。`nth(index)` 漂移已经在本地真实浏览器证实，且与Live“选19:00后出现17:30”的现象一致；缺少动作时节点身份记录，**尚不能证明本次Live就是此因**。

三个探针只评价公开时间控件，不评价门店identity、日期/人数、库存或完整用户结果。轨迹无Agent提交预约、登录、付款或同意条款动作；网站自身有后台POST请求，不能将“零Agent外写动作”写成“全程没有POST”或完整网络副作用审计。未调用任何预约写入接口，也未提交/推送代码。

## 动态目标返修最终复验

ElementHandle身份绑定初稿已让原“插入三个button”反例实际选19:00并完成；同一选项在模型等待期变为submit时拒绝，fixture写计数为零。初稿曾比较整段outerHTML，Review要求收敛为影响动作语义/权限的字段，避免样式变化造成误拒；独立仅改变文字颜色的正常对照已能完成。

又发现原生select后置确认依赖带index的ownerStableKey：插入无关select后，实际value已正确变为opaque-19，Executor却请求人工帮助。[独立红例](../../.eval-artifacts/browser-generic-review-2026-09-26/independent-native-shift.red.json)已退回。最终实现将SELECT实际节点身份用于既有stableKey，删除初稿额外nodeIdentity公共字段及fallback；同一原生红例已在1次模型替身调用后COMPLETED，实际value=opaque-19。

最终独立五项真实本地浏览器检查均符合预期：动态插入button后选19:00（2调用）；原生select前插入无关select后正确选择并确认（1调用）；观察到的同节点变submit时拒绝且零fixture写；仅改变颜色仍正常完成（2调用）；旧option被新的合法节点替换后，拒绝旧引用、重新观察、模型选择新引用并完成（3调用）。这些调用均为模型传输替身，不消耗外部额度。运行时释放持有的ElementHandle；没有新增重试机制、网站特判或跨业务框架。

上述外部模型4/4与Live0/3是目标绑定返修前的实测，**不是最终修复候选的新真实模型/Live证明**。额度已耗尽，不能跨代码版本冒领通过。

## 为什么此前修过、测试也通过，真实页面仍失败

这些失败不是同一个unknown根因反复出现。先前覆盖验证了动作格式、静态控件归属和执行后页面变化，却没有把模型调用耗时中的DOM变化作为独立输入。`targetRef`带有正确观察revision，不代表其底层动态`nth`仍指向当初那个节点；模型可作出正确选择，执行层仍点错对象。后置确认在本次阻止了错误成功，因此返回unknown是保护结果，不是最初的故障。

另外，旧custom正常fixture点击后同步改变aria-label，掩盖了“标签固定、只改input.value”的来源变体；修复这个已证实缺口后，Tokyo又提供了不同结构：input是焦点代理，已选文本在旁边。不能用本地某个结构通过来替代当前来源采证，也不能把旁边任意文字直接升级成权威值。

本轮的变化是把正常DOM变动、实际节点身份、选中后的当前值分别用独立反例检验，并保留真实失败反驳先前归因。尚没有证据表明扩大时间预算、改semantic或放宽identity能解决这些执行缺陷。

## 总纲落实与正式回归核对

用户追问后再次核对：总纲早已要求从失效机制推导覆盖、正常恢复和误拒绝，核对来源样本与预期能独立变化，并说明同类旧回归为何漏过。实施时把“变化与恢复”主要落实到了导航、取消和异步结果，没有完整推导“观察—模型思考—执行”之间的页面变化；review也没有在首轮关闭这个遗漏。总纲优化没有自动完成历史测试迁移；这次具体覆盖推导与交付检查未充分落实，应由实施和独立review负责。

| 行为 | 正式回归归属 | 当前边界 |
|---|---|---|
| 失败导航、迟到响应、新会话隔离与预算连续 | `browser-task-executor.test.ts` 与 `browser-read-fixture.test.ts` 导航组 | 本地双runtime已验证，非历史Live因果证明 |
| 原生select不透明值、插入无关select后的回读 | `browser-read-fixture.test.ts` 原生时间主覆盖 | 已纳入正式真实浏览器Fixture |
| 模型等待期插入button、无关样式变化 | 同文件动态目标主覆盖，两个runtime | 已纳入正式回归 |
| 旧节点变submit或被非法节点替换 | 同文件 `changed observed option` 参数组 | 拒绝与零控件执行通过 |
| 旧节点被合法节点替换后重新观察并完成 | 同一参数组新增 `legal-replacement` | 此前只在临时独立脚本，本次已补入正式回归 |
| 固定标签而input property变化、未确认不能完成、异步恢复、跨字段不覆盖 | 同文件custom Adapter及pending-selection主覆盖 | 已纳入正式回归；不等价于焦点proxy旁边的选中值 |
| 真实生产组合消费CHOOSE_OPTION并展示 | `hybrid-read-composition.test.ts` 既有组合入口 | 替身传输/来源，不能证明Live质量 |
| Tokyo焦点proxy的当前值绑定、OpenTable访问错误 | 本轮Live artifact与未完成项 | 尚未关闭，不能用合成页面通过代替 |

本次只补测试与审计记录，没有改生产代码、总纲、模型或Gold，也没有追加模型/Live。新增恢复对照使用真实Chromium、生产Decision解码/Executor/Runtime，页面在模型返回前替换option，旧引用被拒后第三次模型替身决策依据新观察完成19:00选择；上限固定3调用。三个变化/恢复用例定向3/3、typecheck及diff检查通过。隔离副本仅把stale分支改回立即NO_SAFE_ACTION，新恢复测试因预期COMPLETED未满足而失败；[检错证据](../../.eval-artifacts/browser-generic-review-2026-09-26/recovery-mutation-evaluation.json)证明它能检出恢复缺失。生产工作树未为变异改动。

之前默认532/532和完整Chromium41/41是补入这一个参数变体前的记录，仍保留原口径；本次未重复全量套件，不将定向3/3伪称新的完整42/42。后续覆盖审查直接使用总纲已要求的“失效机制—正式入口—检错证据—未覆盖边界”映射，不复制新规则或另建测试框架。

## 剩余工作与停止条件

动态DOM目标绑定返修与独立本地复核已完成；后置确认和权威条件没有放宽。源页面焦点代理的当前值绑定、当前跨网站可访问性和真实H001交付仍未解决。现有源码、历史轨迹及本地控制可继续分析；本轮真实模型与来源探针额度已耗尽，H001前置机制条件不成立，不能再把整单当诊断循环。

后续外部验证需要围绕“动作实际落在哪个节点、该控件如何提供当前已选值”预先确定最小采证与预算；无需改上游semantic或identity。此报告与本地机制通过不能宣称本轮整体通过。
