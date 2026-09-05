# ADR-0016: Local eval browser profile lifecycle

- Status: Accepted
- Document revision: 1.0
- Last updated: 2026-09-05
- Source of truth for: 本地开发浏览器人工恢复的profile例外
- Related documents: [Data/Security](../architecture/DATA-CONTEXT-SECURITY.md)、[Capability Matrix](../integrations/CAPABILITY-MATRIX.md)、[ADR-0006](0006-web-first-agent-workspace.md)

## Context

安全设计要求每Task/Attempt隔离并销毁profile，现有本地恢复实验需要保留专用profile。用户要求执行整改、明确开发例外，不能隐式推广为产品策略。

## Decision

产品仍按用户、Task/Attempt隔离浏览器，在终态销毁临时profile。仅开发/eval适用以下例外：

- `PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM`且`PRAXIS_LOCAL_CHROMIUM_INTERACTIVE=1`与`PRAXIS_EVAL_ALLOW_TABELOG_MANUAL_INTERVENTION=1`同时开启，才复用`.eval-artifacts/local-chromium-profile`。由本机操作者持有，仅用于同一实验系列，不多用户共用或并发打开。
- 仅interactive开启时使用headed临时会话，不保留磁盘profile；默认headless临时会话。
- 持久profile保留到当前实验系列结束，由操作者关闭浏览器后显式清理。正常退出不自动删除，无自动跨实验复用承诺；本次政策整改不删除已有文件。
- 不读取/复制日常Chrome profile；Cookie、验证码、挑战token、登录信息和人工输入不写日志。gitignored不等于不含敏感数据。本模式不得输入预约PII、支付或提交业务写入。
- 人工恢复在同一session/page重新观察，仍核验门店、请求与证据，challenge未清除则失败；暂停不是扩权或通用CAPTCHA解法。

## Consequences

不建立生产Takeover UI、扩展或用户侧Runtime，不改变Web-first部署。产品需要跨Case持久会话或本地执行时，另立ADR明确隔离、存储与权限。

## Alternatives considered

- 所有headed会话自动持久化：超出需要，拒绝。
- 复用日常profile：扩大凭证和隐私范围，拒绝。
- 正常退出无条件删除：破坏明确进行中的实验，改为实验结束显式清理。
