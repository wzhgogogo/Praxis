# 复用会话在控件失配后保留：main 回归修复

2026-11-04，维也纳 CET（UTC+1）。用户批准直接修复、全门禁后同步 main 合入并通知 A/B。真实模型、Google、公开 GET、网站、Live、环境重跑新增均 0；不读 .env。

## 首偏离与修复

main75ba1605 的 Executor 将“复用模式 + 任意 BROWSER_RUNTIME_FAILED/BROWSER_TIMEOUT”当作会话退休条件。这是 C 上轮引入的回归：隐藏旧模板的 selectOption 超时后主动关闭了仍可观察的同店页，阻断 G3 公开控件回退。先前 main189 个 Chromium 测试没有 A 尚未合入的这组场景；原复用合成故障也没有区分控件错误和上下文损坏。旧发布原件保留，不将旧全绿当作已覆盖此次能力。

现在保留原导航失败退休条件；复用模式下的非导航失败，只有运行时明确报告会话/页面已关闭或浏览器已断连才退休。可恢复的 select/click/fill 失败继续原观察与控件纠正路径。`BrowserSession.isClosed()` 是两种已有运行时（Local、Cloudflare）的同步生命周期事实，读取原有 page/browser 状态，没有网络、模型或新重试；所有普通代理透传该方法。非复用路径判断与行为保持原样。取消/截止的原清理路径不变。

产品只改 BrowserSession 瞬态合同、两个运行时与 Executor；State25、TaskDefinition23、Agent/Semantic Prompt、持久 Schema、身份、Guard、B 资源策略及3000ms导航下限不改。无需持久版本递增。

## 原样输入与有效红绿

A89e87665 的三项失败实际位于两个测试文件 `capabilities.test.ts`、`runner.test.ts`。原样导入它们及最小传递依赖（11份src文件），再原样带入 A 的 package.json 和 run-g6-fixtures.mjs，让 G6 串行接在原浏览器门禁后运行。13份文件的原字节 SHA 见 `a-imports.json`；未带入 A 其余测试或 Live CLI。当前两文件共18例，不冒充 A 全66例。

54805c31 冻结未修产品后：原 G6 15/18，恰三项用户所列失败；新增单操作控制在非复用时通过、复用时下一次 snapshot 报 session is closed。原件 `red-g6.log`、`red-operation.log` 与 red-captures。

a1363db7 修复后，同一原 G6 18/18。CONTROL_FALLBACK/RENAMED 从 NEEDS_INPUT 变为 PRESENT_RESULTS；公开模型操作为 FILL_AUTHORITATIVE DATE 与 CHOOSE_OPTION PARTY_SIZE，实际捕获的原响应含2026-11-11、2人、19:00，见 green-captures。Runner 原 named 断言转绿。所有 A 字节不变。

新增页内操作错误→snapshot→下一次合法select控制同时覆盖复用/非复用。原复用五项控制保留：入口6→2、错店/不唯一拒绝、故障退休且不额外重试、跨run隔离/取消、缺控件原导航；原合成故障现在额外标明上下文确实失效，原次数/结论断言不变。两个运行时原生命周期测试补 isClosed 前后断言。

局部结果：Executor/复用67/67、两个运行时13/13；受限环境的运行时测试曾因 Chromium 启动权限失败，日志保留，允许本机 Chromium 后通过；这不是有效产品红灯或完整门禁修复。最终候选 `e7963151` 冻结860项输入，七步各一次、每项前后净树，SHA全程不变，全绿：

| 检查 | 结果 | 秒 |
|---|---|---:|
| typecheck | PASS | 0.498 |
| arch:check | PASS | 0.233 |
| npm test | 1417/1417 | 48.816 |
| build | PASS | 0.561 |
| test:browser:fixture | 原套件189/189 + 原样G6 18/18 | 170.700 |
| 严格G2 | 5/5，12页PASS | 24.242 |
| 原复用控制（含身份） | 5/5 | 0.242 |

无完整门禁重试、跳过、取消或中途修改输入；逐项 HEAD/时刻/status/返回码见 gates.json，日志原样保存。默认数量1417=main1415+两项新控制；两个运行时只是原测试追加生命周期断言。独立核验脚本 verify-repair.py 不导入产品解析器，检查A13原件、未修产品字节、三项准确红灯、保存的Date/Guests动作及原被动响应、已展示时段、原复用控制、Guard/身份/版本未变及账本原行；回执 verification.json。

## 证据、账本与发布

四层：实际G6组装的预期交付与安全控制通过；逐环节有同店页、Date/Guests动作和被动响应；来源都是构造DOM和固定I/O，未验证当前网站；资源层只有本地门禁耗时，不声称W1网络根因关闭或Live提速。

账本保留main830和A831条原行，追加C零调用后832条；A authorization.json 明确记录已获用户批准 Live32/GET425（开发14/58），按原批准保留，未新增C真实调用授权。累计仍模型401、GET298、Live11、网站8432；留出预留不变，详情 ledger-union.json。

全绿后最后同步远端main，保留并行实现，以最新origin/main为第一父提交正常合入并推送，ls-remote核对后通知A/B。原C旧报告中的宽泛退休规则已被本次修正取代，旧原件不改。最终main SHA以交付回执为准。
