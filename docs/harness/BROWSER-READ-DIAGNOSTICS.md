# Browser Read Diagnostics

- Status: Accepted
- Document revision: 0.1
- Last updated: 2026-09-05
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
| `src/harness/browser/browser-read-fixture.test.ts` | 真实Chromium + 本地Fixture | 异步更新后读取新slot；同页模拟接管后身份重验；缺少ready标记超时 |
| 原始H001 Hybrid | Live Read-only + 真实模型 | 尚待完整链路重验，不由本地Fixture替代 |

没有新增真实响应Replay；本地Fixture不证明Tabelog或TableCheck当前控件兼容性。人工Golden Set与既有artifact不在本次变更范围。
