# H001 身份与入口定向修复后续记录（2026-09-17）

- Status: Development evidence / original-researcher review pending
- Scope: 仅 H001 门店身份匹配与 TableCheck/Tabelog 入口发现；不含 H002/H003/H005 策略或行为改动。
- Baseline: `3726c88717fa7ead6464b8d30da9335611c5b97b` 加原有 dirty worktree；未 reset、stash、commit 或 push。

## 原失败、修复和离线结果

独立复核脚本在修复前确认三项生产反例：`B1F` 与 `1F` 被同址、同电话的涩谷/六本木分店仍 HIGH、`〒150-0002 1F` 被视为完整地址。修复后共享地址比较显式输出 `MATCH`、`CONFLICT` 或 `INSUFFICIENT`；两个 Adapter 都在明确地址冲突时阻止 `EXACT_PHONE` 升为 HIGH。修复后的同一脚本输出为两项 `MEDIUM` 与短地址 `false`。

TableCheck 的 Router-owned `TableCheckEntryLedger` 仅保存本次 read run 已观察的同源入口。它不保存空位结论；后续候选仍逐页验身。自带 Google merchant URL 先走同一身份门槛，只有未通过时才搜索。当前候选的 discovery 结果排在 run entry 之前，且已有无关 entry 不会抑制当前候选的必要 `runSkill` discovery。Tabelog 同样先验已列 merchant URL，再回退搜索。

定向生产组合/Adapter 回归 **55/55 PASS**；包含 B1F/1F、同电话异址、短地址、已列入口绕过搜索挑战、无关缓存不跳过当前 discovery、Teppen 观察到 Hajime 入口后跨 Agent batch 复用并重新验身，以及 `endReadRun` 后新 run 不继承该入口。`npm run typecheck`、`npm run arch:check`、`npm run build`、`git diff --check` 均 PASS；授权 localhost 全量 `npm test` **392/392 PASS**。修复后追加的合成真实 Chromium fixture `npm run test:browser:fixture` **17/17 PASS**，覆盖 modal、日期/人数、公开新页、筛选、滑条及 Tabelog 控件。它只访问本地 fixture，仍仅是离线契约证据，不证明实时来源或库存。

## 固定快照与有界 Live Read-only

Live 前未再修改代码。快照为当前 dirty worktree；受影响源码 SHA-256：

- `outlet-identity.ts` `d9e31bfbba99a25b56e6bd6b230c125ac482779a263ca92b03f738634cd1b5b8`
- `tablecheck-browser-availability.ts` `d252b48f3ca06801b212023b2d87c8bcbcbf7d195ed27777f6e9f703ff803059`
- `tabelog-browser-availability.ts` `c7a02f36f9dbbf5914425cc2b535dce97ccdf34f1febe39c2096152ddc59ec79`
- `live-browser-availability.ts` `1e3cc7c1353c0816b38f9218d6a6a99f0f3ef7941d655824f228afecb06944ad`

用户授权额度为每条至多 5 分钟、50 浏览器动作、30 模型、10 Google。现有 probe Runner 对单页强制更严格的 60 秒上限；首次以 300 秒启动前被参数校验拒绝，未建立 artifact 或访问页面。随后仅各运行一次 `NAVIGATE` / `SNAPSHOT` / `WAIT_FOR` probe，不搜索、不猜 URL、不设置条件、不进入预约表单，模型和 Google 均为 0：

| 商户与已保存入口 | 结果 artifact | 实际结果 |
|---|---|---|
| Sushi Teppen (Shibuya), TableCheck `/en/shibuya-sushi-teppen` | [result](../../.eval-artifacts/restaurant-browser-probe/2026-09-17T07-11-37-378Z-68d40f29-c653-4a3c-aa52-f7fe319a6c8d.result.json) | `PAGE_OBSERVATION / BROWSER_RUNTIME_FAILED`；1ms，无 snapshot |
| Shibuya Namikibashi Sushi Hajime, TableCheck `/en/sushihajime-shibuya` | [result](../../.eval-artifacts/restaurant-browser-probe/2026-09-17T07-11-50-032Z-266e8d74-a116-422d-96f0-8b8c9500322a.result.json) | `PAGE_OBSERVATION / BROWSER_RUNTIME_FAILED`；1ms，无 snapshot |
| Sushi Nasu, Google 已列 Tabelog `/tokyo/A1303/A130301/13316574/` | [result](../../.eval-artifacts/restaurant-browser-probe/2026-09-17T07-12-01-600Z-266438a6-6b8e-4769-b94b-8cb5f34aca50.result.json) | `PAGE_OBSERVATION / BROWSER_RUNTIME_FAILED`；5ms，无 snapshot |

三条均使用 `AUTO` / remote temporary profile、网络路径 `UNKNOWN`。artifact 没有来源正文，不能归因站点 challenge、门店身份、无位或页面契约。也没有预约、购买、取消、支付、登录或其他外部写入。

在三条结束后，仅做了不访问网站的 runtime 定位：`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM` 成功启动并立即关闭一个 headless local session。因此已确认的首个阻断是默认 Cloudflare Browser Run 的 session 创建，而不是本机 Chromium 缺失。按本轮“一次固定 Live、不得自动重跑”边界，没有切换本地引擎重新访问任一商户；如要继续，需要新的明确 Live 授权。

现有独立 `restaurant_hybrid_diagnostic_evaluator` 仅评估 Hybrid 生产组合的执行 artifact。对三份 probe 作了**不落盘**内存兼容性检查，三者均为 `DRAFT_DIAGNOSTIC_ONLY`、`candidates=0`、`completion=NOT_EVALUATED`、`evidence=NOT_EVALUATED`。故没有生成误导性的 evaluator sidecar；这不是独立评价通过，完整生产组合 artifact 才是该 evaluator 的适用输入。

## B1–B14 当前分类

| ID | 当前证据 | 状态 / 未完成项 |
|---|---|---|
| B1 | 修复后真实本地 Chromium fixture 的 active-language-dialog / 日期选择回归通过。 | PASS（本地 fixture，17/17 suite） |
| B2 | 既有 Router 的用户许可替代范围与 H005 exact-only 离线链；本切片未改。 | PARTIAL，未有可用 Live slot |
| B3 | 修复后真实本地 Chromium fixture 的日期/人数与 selected/value 回归通过。 | PASS（本地 fixture，17/17 suite） |
| B4 | 宽泛 GET 许可仍撤销；合成 fixture 验证 permitted filters 的 apply/reopen/reset，未授予提交权限。 | PARTIAL（无真实来源） |
| B5 | 修复后真实本地 Chromium fixture 的 slider observation 和 dialog scroll 回归通过。 | PASS（本地 fixture，17/17 suite） |
| B6 | 已列 direct merchant URL 现在先验身份后才搜索；两 Adapter 回归通过。 | PASS（离线 Adapter）；Live 浏览器启动阻塞 |
| B7 | 既有复杂条款 reader 未改。 | PARTIAL，未读到真实复杂页 |
| B8 | 候选 scoped 比较笔记未改。 | PARTIAL，未完成真实两店比较 |
| B9 | 既有条件修订组合回归未改。 | PASS（离线） |
| B10 | 既有同源刷新/旧证据废弃回归未改。 | PASS（离线） |
| B11 | 无提交路径；所有 Live probe 只允许读取动作。 | PASS（安全边界） |
| B12 | 既有 deadline settlement；三条 probe 都有终态 artifact；独立 Hybrid evaluator 对其内存检查为 `NOT_EVALUATED`（无候选）。 | PARTIAL，未证明完整 Hybrid Live 收束或独立评价 |
| B13 | 三个指定既有商户各尝试一次，均未启动浏览器。 | ATTEMPTED / BLOCKED，不是 Live 来源验证 |
| B14 | 未改地图/地理语义。 | PARTIAL |

## 交回 Review

请原研究者审查当前 dirty diff、地址三态比较、明确地址冲突对电话 HIGH 的限制、run-scoped TableCheck entrance ledger、以及三条失败 artifact。本文不声称独立 Review 已通过；下一次 Live 应只在浏览器 runtime 可启动后另行授权，不自动重试。
