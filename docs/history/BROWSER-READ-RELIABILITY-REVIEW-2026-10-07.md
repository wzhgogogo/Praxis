# 浏览器只读可靠性：独立复核（2026-10-07）

- Status: Accepted
- Document revision: 1.0
- Last updated: 2026-10-07
- Evidence status: exposed development evidence；不是Clean Baseline
- Scope: 通用执行契约、来源查询接线、观察开销、网络边界及真实交付复核；Semantic／Gold／HARD／身份／半径保持原口径

## 结论

Terra 实现，root 按预先固定的反例、正常控制和原始运行证据复核。通用执行修复与受控交付有支持；**完整 H001 Live 仍未通过**。最后一次 Live 为独立日期变体：东京2026-10-08 19:00／2人／涩谷 omakase，80,341ms／18次模型调用，零合格展示。后续来源规则修复只有本地验收，不追认该 Live 为通过。

## 修复及独立预期

| 机制／历史失败 | 实现与复用覆盖 | 独立预期、预算和证据 |
| --- | --- | --- |
| 10月7日 WAIT 空目标被拒；点击遮挡消耗30秒 | 严格 wire schema 对齐 page-level WAIT；交互调用使用短超时；实际遮挡后最多一次 Escape／失焦、重新观察并重新决策 | root 用旧 decoder 固定正常／非法输入：旧路径错3/4，新路径4/4符合预期；实际 Chromium 遮挡触发700ms截止、约710ms返回，恢复后1,056ms内完成已知可行查询，未 force-click／重放旧ref |
| 模型动作与执行提示不一致；类型／额外字段缺诊断 | 同步 availableActions 与执行合同，脱敏失败字段路径／类型／原因；安装边界后放行普通查询按钮 | 原 Browser Executor 回归补强；非法动作零执行。普通查询实际到达本地 receiver，Reserve与同时触发的未许可请求零到达；0模型／650ms |
| 观察逐属性往返慢；控件签名受展示类名影响 | 每元素一次属性投影，选项一次批量读取；保留选中值／owner／真实状态的 stale 检查 | root固定100控件及独立 truth，再做同输入旧／新各3次测量：中位耗时降低84.475%；这是受控页面结果，不是全站速度承诺；测量的是CDP消息数，不称串行往返数 |
| 页面、popup、worker、socket及redirect可越过UI边界 | 两个真实 Runtime 创建独立 context，预装来源自有规则，阻断SW／WS及未许可读写；route.fetch禁止自动follow redirect | root实际双receiver：合法GET／公开查询POST有有效结果；未知字段、写端点、redirect目标、popup／worker请求和socket零到达；592ms／0模型。假INSTALLED fixture不能替代这一证据 |
| 已知查询重复依赖模型；哈希class权限易失效 | TableCheck已核实的公开参数确定性绑定日期／人数／精确时间，去掉哈希class权限依赖；来源公开查询规则留在integration | 当前官方公开客户端及实际来源请求确定 grammar；公开calendar POST仅接纳4个string字段，200不等于库存；已选控件、入口URL和failure/data:null均不能单独产生Offer |
| Live错误阻断公开cuisines[]；加载区误用外部预约链接 | 接纳公开多选查询键、保留既有预算参数；有明确库存widget时，只读唯一、已完成加载区域内的有效时段 | 原TableCheck Adapter／生产组合补正向及反向控制：加载中／区外入口／重复widget为UNKNOWN；已完成同请求结果可交付；无关区域loading不误拒 |
| 新边界遗漏Tabelog已有日历读取 | 对照9月29日真实控制记录与当前官方客户端，补初始／日期／人数／时段4个精确公开GET查询grammar | 仅准入请求，不改变库存语义；缺失／额外／重复字段在receiver前拒绝。新Guard额外5秒网络cap与交互cap分离，沿用调用方导航窗口及Executor剩余预算 |

不新增独立测试平台、店铺名单、任意GET放行、Provider兜底或整体评分降门槛。来源拥有少量已核实的请求契约，基础设施没有站点分支。Google官网来源仍用原窄UI路径；Cloudflare新隔离边界未获真实运行验证。

## 实际运行与评价

| 模式 | 实际结果 | 签收 |
| --- | --- | --- |
| 固定来源＋真实DeepSeek | 首次沙箱DNS失败保留；宿主追加13,794ms／10次调用，执行WAIT及类别选择，展示1个同店、同请求、HARD有出处的合格结果 | root17/17检查通过；Evaluator@25／rubric@21六维SAT。固定开发页不是当前库存 |
| 完整Live #1 AUTO | 6,104ms／4次调用，Cloudflare默认方法丢失receiver，在CDP连接前失败 | FAIL；修正默认方法绑定并补回归，不声称Cloudflare真实边界通过 |
| 完整Live #2 LOCAL | 121,864ms／25次调用，发现3家、曾展示Nasu；原始库存widget仍为skeleton，引用的是区外预约入口 | FAIL，自动评价也未确认合格。先修cuisines[]与错误库存接纳，原artifact保留 |
| 完整Live #3 LOCAL | 80,341ms／18次调用，Tabelog接纳Teppen并取得omakase事实；查位10秒超时。TableCheck stale后已重新观察恢复，4家详情均因原半径排除 | FAIL，零Offer／NO_VERIFIED_RESULT。Guard阻断initial_vacancy是具体新遗漏；commons.js超时并存，不能断言单一因果。未走到TableCheck查位，故其加载修复本次没有覆盖 |

所有完整Live保持500秒／50次模型调用；Google进程内代理为空、Browser proxy=false，未改.env或系统网络。初始两次上限之后，root在第3次启动前保存必要复验额度修订；总240模型调用上限未变。没有第4次整单重跑。公开JS读取为另列的零模型静态契约调查：首GET15秒部分下载失败保留，随后Range补齐；不调用库存。

首次完整Chromium69/73发现fixture被新Guard误接及精确预填URL遗漏；两个probe可能尝试真实 `/en/fixture` GET，不能称全程零网络fixture证据。修正完全拦截的fixture facade和准确请求路由后73/73通过。原始失败保留；受控fixture不证明生产Guard。

最终默认664/664、typecheck／architecture／build通过；完全拦截Chromium73/73复用。最后的Tabelog来源规则与读取期限还经root实际Chromium接收端核验：6,878ms，四个合法读取各一次到达、12个非法字段反例零到达、6.141秒加载在8秒窗口内成功、100ms短窗口正确超时；Guard单元34/34使用fakeRoute，不能代替该实际接线证据。

## 本轮验收边界与下一步

- 原有离线覆盖缺少真实公开查询grammar、加载区与区外入口组合；这是覆盖遗漏，不能用此前全绿消除新Live反例。
- 真实有位与系统能力分别评价。已知可行受控链在预算内展示；当前日期Live没有交付，不声称餐厅无位、来源穷尽或整体通过。
- 最后一轮Tabelog被拒CLICK未保存targetRef，无法复原具体目标；后续成功点击不能反推原目标。不得把合成反例称原动作回放。
- 后续公开日历规则及网络超时修正需要定向真实来源验收；当前TableCheck搜索结果范围／当前查询绑定仍是发现策略限制，不通过扩大半径、变更HARD或把旧结果接纳为新结果解决。
- Evaluator复用@25／rubric@21；root机制sidecar补网络、观察和原始来源审查，不改通过门槛。Live自动评价后再按本轮acceptance核对，必过维度缺证据即整体不能通过。

## 原始证据入口

本地忽略目录 `.eval-artifacts/browser-reliability-20261007/` 保留预声明、source hashes、失败、receiver结果与root签收；原文件不覆盖。关键证据：

- [初始计划](../../.eval-artifacts/browser-reliability-20261007/98550c0b-6b42-4a6b-8f34-e9102e46de30.root.initial-acceptance.json)、[第3次预算修订](../../.eval-artifacts/browser-reliability-20261007/root.budget-amendment-20261007-live3.json)
- [固定来源独立签收](../../.eval-artifacts/browser-reliability-20261007/root.fixed-source-df0304a1.acceptance.json)
- [Live #2独立签收](../../.eval-artifacts/browser-reliability-20261007/root.local-live-01c9ff8f.acceptance.json)、[Live #3独立签收](../../.eval-artifacts/browser-reliability-20261007/root.local-live-4b6e0d3f.acceptance.json)
- [最终Tabelog实际Chromium接线](../../.eval-artifacts/browser-reliability-20261007/root.tabelog-guard-runtime-fb3d12f4-8db2-4ceb-9cfe-65ff8f4c38fb.json)
- [Tabelog公开客户端独立oracle](../../.eval-artifacts/browser-reliability-20261007/root.tabelog-calendar-source-oracle.json)、[历史真实控件记录](TABELOG-LEAD-PATH-DIAGNOSIS-2026-09-29.md)

当前检查结果见[本轮Test Log](TEST-LOG.md#test-2026-10-07-browser-read-reliability)。历史已验证事实不自动构成当前完整能力，当前门槛见[STATUS](../STATUS.md)。
