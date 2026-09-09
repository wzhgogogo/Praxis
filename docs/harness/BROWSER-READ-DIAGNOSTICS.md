# Browser Read Diagnostics

- Status: Accepted
- Document revision: 0.5
- Last updated: 2026-09-07
- Source of truth for: 单页浏览器只读诊断操作与证据范围
- Related ADRs: [ADR-0015](../decisions/0015-supported-source-search-evidence.md)、[ADR-0016](../decisions/0016-local-eval-browser-profile-lifecycle.md)

## 当前切片

入口`probe:restaurant:browser:read`复用Runtime Factory，只接受TableCheck或Tabelog的HTTPS单URL。一次运行一个Session、一次导航、最多60秒；允许snapshot与有界ready-selector等待，不点击、不填写、不提交、不刷新挑战页。无需Semantic、Agent或Google调用。页面可读仅表示`CONTENT_OBSERVED`，不生成Task、Offer或预约成功结论。

```bash
PRAXIS_ALLOW_LIVE_RESTAURANT_READ=1 PRAXIS_ALLOW_BROWSER_RUN=1 \
PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM PRAXIS_LOCAL_CHROMIUM_INTERACTIVE=1 \
npm run probe:restaurant:browser:read -- --url 'https://www.tablecheck.com/实际公开入口' --network-path DIRECT --timeout-ms 20000
```

示例URL必须替换为实际公开入口。`--network-path DIRECT|PROXY|UNKNOWN`是操作者报告，工具不检测系统TUN。可按页面证据添加`--ready-selector`；不得猜测选择器后把超时认作网站不可用。可选`--outlet-name`、`--address`、`--phone`提供对照身份；`--date YYYY-MM-DD`与`--party-size`必须一起提供。工具观察已有页面参数，不操作日期人数控件。手工输入不充当Google Discovery证据。

## 实验顺序与停止点

1. 使用用户已能访问的准确URL。保持浏览器模式不变，分别记录网络条件；关闭VPS加无痕同时变化只能证明该组合可访问，不能归因单一变量。
2. 先观察入口/挑战/来源不可用，再核对门店身份、日期人数与slot。出现403或challenge保留失败记录，停止当前运行；不要通过无限重试扩大实验。
3. 必须依据真实页面观察才修改Adapter。诊断入口通过后再按原始H001要求验证完整链路，不注入手工成功结果或降低HIGH/HARD门槛。

本地interactive单开关使用临时profile。双开关启用持久eval profile及其保留政策见ADR-0016；单页探针本身没有终端人工恢复流程，现有Hybrid Tabelog路径才提供该流程。恢复后仍重验页面与业务证据。不要使用日常Chrome个人profile。

## 证据与验证映射

每次启动写独立`.started.json`，正常结束写独立`.result.json`，位于`.eval-artifacts/restaurant-browser-probe`；Hybrid使用自己的目录。异常保留稳定错误码；强杀可留下未完成start记录。URL日志移除凭证、query与hash，不保存原始HTML或Cookie。不要在公开URL路径中放入敏感信息。

`slotsDetected`只表示解析发现；`controlOperation=NOT_ATTEMPTED`、`availabilityConclusion=NOT_ESTABLISHED`明确未验证的范围。只读代码约束不冒充实际副作用计数，计数为`NOT_MEASURED`。Hybrid记录阶段与已执行事件；Semantic失败不能解释为下游Provider失败。

| 测试入口 | 模式 | 证明范围 |
|---|---|---|
| `src/eval/restaurant/agent-loop/browser-read-probe.test.ts` | Mock | URL限制、challenge优先、总deadline与晚到session清理 |
| `src/eval/shared/diagnostic-run.test.ts` | 本地文件测试 | 开始/结果记录独立、不覆盖、脱敏 |
| `src/harness/browser/browser-read-fixture.test.ts` | 真实Chromium + 本地Fixture | 异步更新后读取新slot；同页模拟接管后身份重验；缺少ready标记超时；不调用站点Adapter方法的受控观察→动作→重观察路径 |
| 原始H001 Hybrid | Live Read-only + 真实模型 | 尚待完整链路重验，不由本地Fixture替代 |

没有新增真实响应Replay；本地Fixture不证明Tabelog或TableCheck当前控件兼容性。人工Golden Set与既有artifact不在本次变更范围。

## Tabelog英文搜索路径回归

2026-09-06诊断明确旧`/rstLst/?sk=...`与英文`/en/rstLst/?sw=...`在本机当前网络的challenge差异。新的Adapter Contract在既有`src/integrations/tabelog/tabelog-browser-availability.test.ts`中验证实际导航英文URL与编码后的餐厅名、过滤评论/图片链接、同页challenge接管不重新导航、诊断URL保留`sw`并移除challenge token。未新增独立测试文件或自动化数量。

Live Read-only对照包括：用户提供的英文地区查询200；同query只加`/en/`200；英文关键词Ginza有餐厅、无匹配测试词零餐厅；修复后默认headless 200且5个解析结果均为餐厅详情链接。原始页面HTML未落盘，故不是Replay。没有改动控件操作，本轮未重跑真实浏览器本地控件Fixture；搜索页结果不替代门店identity、日期人数、slot或H001验证。临时诊断脚本当前通过`node --import tsx .eval-artifacts/tabelog-network-diagnostic/probe.mjs --fixed-smoke`复现最后一次搜索观察（运行真实网络需用户授权）。

## TableCheck公开发现回归

TableCheck Adapter不再从店名派生guide或reservation slug。`src/integrations/tablecheck/tablecheck-browser-availability.test.ts`覆盖名称加坐标的公开搜索URL、只收集渲染结果中的guide链接、同名分店中精确电话匹配的选择、没有HIGH时fail closed、真实reservation链接/嵌入Availability结构的解析，以及`TABLECHECK_DISCOVERY_NO_RESULT`、`TABLECHECK_PAGE_UNAVAILABLE`和`TABLECHECK_PARSE_FAILED`的分离。搜索结果排序不作为身份或空位证据。

2026-09-06本机Local Chromium只读观察确认带Google坐标的`Sushi Inase`搜索返回真实`/en/sushiinase`与同名Shinjuku分店，并出现真实`/reserve/landing`链接；Sushisho Issekisancho也在同一结果集合中。该观察未保存原始HTML，不是Replay，也没有读取slot。随后一次H001仍在动态搜索的既有25秒Browser deadline结束，未到详情或reservation页面；这不是HIGH identity或availability通过证据。

## 2026-09-07 受控浏览器与Live边界

`BrowserTaskExecutor`把TableCheck与Tabelog纳入同一来源链会话：父级Abort会阻止新动作并关闭会话，且Router等待该收束；每个候选限制24次浏览器操作、6次模型动作，整次H001限制12次模型动作和300秒自动阶段。模型只接收代码生成的观察引用；终止动作即使strict wire携带当前引用占位，转换回canonical action时也会丢弃它，伪造引用和权威字段仍拒绝。4/4真实本地Chromium Fixture只证明这些机制，不代表来源兼容。

当日单页TableCheck探针为`CONTENT_OBSERVED`、没有控件操作。最终H001 artifact为`.eval-artifacts/restaurant-hybrid-live-read/2026-09-07T03-07-31-815Z-e7b534bb-1e13-4e2a-aab2-befc6e8c1ea2.result.json`：Google与Tabelog详情已实际可读，Sushisho Isseki Sancho通过规范化`+81`号码取得HIGH；但Tabelog需要外部预约Provider，TableCheck动态搜索页为`TABLECHECK_PAGE_UNAVAILABLE`。没有日期/人数回读、slot或Offer，故不是H001成功。

后续修复把TableCheck的`PAGE_UNAVAILABLE`收紧为title或primary heading的明确错误文档，并记录精确命中信号；普通正文数字、结果文案或任意`not found`不再终止来源。若当前搜索页可读却没有抽取到guide链接，executor在同一session中记录`HANDOFF`（原因、title、脱敏可见文本、已观察目标），记录模型动作，并在每次动作后记录`POST_ACTION_VERIFIED`。本地Fixture证明该路径可点击只读“显示结果”并重观察；它不代表真实网站已发生接管。

2026-09-07随后一次原始H001 artifact为`.eval-artifacts/restaurant-hybrid-live-read/2026-09-07T07-25-17-542Z-8a9de9b6-9b94-4788-a1bf-21dc41d31953.result.json`：三个真实TableCheck搜索页直接出现可解析guide链接，故本次**没有**TableCheck模型接管；Sushisho Issekisancho与Sushi Inase均以exact phone达到HIGH，随后在嵌入Availability页面因`REQUEST_SELECTION_UNCONFIRMED`停止。没有slot、Offer或`PRESENT_RESULTS`，不是H001成功。
