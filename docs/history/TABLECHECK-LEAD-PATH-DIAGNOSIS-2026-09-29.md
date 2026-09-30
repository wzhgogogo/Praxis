# TableCheck 主任务独立路径诊断

- Status: Draft
- Document revision: 0.1
- Last updated: 2026-09-29
- Evidence status: current diagnostic sample / exposed development evidence; not Clean Baseline
- Scope: 用户要求沿主页、搜索、单店、查询控件亲自诊断。生产 LocalPlaywrightChromium 默认网络，无 DeepSeek、Google API、H001 整轮或预约提交；无生产代码修改。

## 本轮实证

1. `/en/` 重定向 `/en/japan`，主文档 200。主页 Search 进入搜索框架，随后来源自身异步搜索返回店铺。输入 `omakase ginza` 并搜索，出现三家店。该检索用于复现用户已展示的路径，不代替 H001 涩谷筛选。
2. 搜索框外层 DIV role=combobox 和内部 INPUT name=search_text 都被生产 observer 标记为 INPUT；前者没有可填写语义，fill 失败，后者实际填写成功。空输入 label 为空，placeholder 未用于 label。首轮未保存 fill 的底层 cause，因此只记录已观察的类型差异和操作结果，不推断其他原因。
3. Ginza iwa 列表链接 `openLink` 超时。另做一次有界定向复现，保存底层 cause：元素可见、enabled、stable，但卡片说明文本 DIV 拦截 pointer events，Playwright 默认点击重试至 30 秒。不是 DNS、导航或页面不可访问。直接 navigate 到同一个已观察 href 成功。本轮完整点击链因此不是全绿；直接导航是后续诊断路径，不伪报原点击通过。
4. 单店生产 observer 能看到日期日历、人数和时间 combobox。实际从 9月29日/2人/19:00 变为 9月30日/3人/18:30；每步使用新观察的 DOM 引用执行 session.click，折叠后回读分别为 3 guests、18:30。选项有 optionOwnerId，空 input 的独立选中显示可读。未调用模型，也未通过完整 Executor/Router 跑任务，因此不声明模型自主完成或旧站点已全部修好。
5. `availability_calendar_v2` 返回 200。查询变更后可见短暂加载态，再出现时段结果；现有生产解析器对保存的真实页面执行离线解析：30日/2人/19:00 可确认请求且明确该时刻不可用，另有其他时段；30日/3人/18:30 的稳定页面可确认请求且包含18:30。加载中样本13保持 queryComplete=false，稳定样本14为true。这里只验证查位组件/解析，不产出正式 Offer，也不证明条件事实/H001交付。

## 历史失败要分开

- 9月28日原生搜索 35秒 goto/domcontentloaded 超时：旧 artifact 未保存主文档请求及超时 DOM，根因仍不确定。今天默认网络可打开，不能反推当时一定是网络或一定是控件。
- 更早 H003 两店控件预算耗尽：有重复 guest 操作和被拒写操作的历史轨迹，不等于网站无控件。9月28日 Tokyo Ten 的 OPTION_VALUE_NOT_CONFIRMED 有独立选中显示、input.value为空的已知证据。本轮 Ginza iwa 相同类别控件可改变并回读，是当前能力正证据，不是旧页/旧请求原样重跑。
- 最近 H001 追加 Live `3f58236a-e190-4d52-a043-6400c3aa049c`：TableCheck raw21、仅检查前五家、五家均超当前地点范围，未进入单店查位。当前发现的链接遮挡不能作为该轮根因；原生发现代码本身解析 href 后导航，并不必然经过 openLink。

## 最小后续修复方向

共享 observer 应区别可填元素与组合框容器，不向模型提供虚假的填写能力；已观察的安全公用链接需要明确处理真实点击点与导航语义，保留目标/来源核验，不增加盲目force、多级重试或等待预算。就绪、查询选中、库存刷新仍应分开。本轮现有日期人数时间回读和稳定结果解析已经有真实正证据，不应为追求重构再次全部改写。

## 证据与运行边界

- [主路径文件](../../.eval-artifacts/tablecheck-lead-path-20260929/)：01主页；02/03默认搜索加载前后；04填入查询；05/06搜索加载前后；07链接点击失败；08同href直接导航；09日期变更；10人数菜单；11人数变更；12时间菜单；13时间变更加载态；14稳定结果。各阶段 JSON 全文/完整控件/关键请求状态、脱敏DOM、截图；actions.jsonl记录动作；parser-replay.json记录生产解析。
- [链接复现](../../.eval-artifacts/tablecheck-lead-link-20260929/)：error.json保留底层点击遮挡原因，shape.json记录链接DOM/几何，01/02观察失败前后。一次定向复现，未自动反复尝试到成功。
- 临时诊断脚本 `/private/tmp/praxis-tablecheck-lead.mts`、`praxis-tablecheck-link.mts`、`praxis-tablecheck-parse.mts`。主浏览器限10分钟、单导航30秒；补充链接诊断限90秒；手工分析间隔计入会话时间，不能当自主任务耗时。未运行模型、全量门禁或正式Live，不提交预约、不commit/push。
- 页面 snapshot、controls、DOM和截图顺序采集而非原子采集，变更中的相邻证据可能跨越刷新；成功结论采用稳定末态14，不能用瞬时文字绑定后来库存。脱敏DOM移除脚本及隐藏密码值；本次guide解析依赖可见日期选中、pax/time标识和时段链接。源站自己发起的搜索/分析请求与应用模型调用分开。
