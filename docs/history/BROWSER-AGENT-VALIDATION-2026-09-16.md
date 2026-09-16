# Browser agent 修复与有界验证 — 2026-09-16

- Status: Partial / current development evidence
- 非 Clean Baseline；已暴露开发场景；不是 P0–P4 完工证明。

> 历史检查点：后续授权、修复与最终验收见[最终复核](BROWSER-AGENT-FINAL-REVIEW-2026-09-16.md)。本文的失败及原始运行不删除、不作为当前能力摘要。

## 本轮兑现

1. Web 使用 currentFactEvidence 展示当前条款，保留 readEvidence 历史；条款链接指向该事实自己的来源。真实 Chromium 的 localhost HTTP fixture 验证刷新后 7500/旧 no-show 消失，8000/新取消条款与引用同步更新。尚非生产持久化到真实来源的 Web Live。
2. TableCheck 英文公开搜索页 Budget/Cuisine 的正向结构契约已接到 discovery Executor：仅已实测 dialog、form、checkbox、双 slider 和 Update。其他路径/同意项仍拒绝；form class 改变会 fail closed，需要重新验证。
3. 模型 COMPLETE 仅表示交回核验；代码 completion 未通过时返回 MODEL_HANDOFF，不能标成 COMPLETED。Tabelog 实测触发了这个缺陷，本轮已修。
4. Hybrid runner 支持更低的模型/Google/浏览器/时间上限；全局模型调用计数和剩余时限限制包括语义调用。删除逐控件查找不存在 form 时的自动等待；尚无同场景速度对照，不宣称加速比例。

## Live Read-only

本批首次来源访问 08:37:31 UTC；到 40 分钟墙钟上限停止新增 Live。共 17 次模型调用、149093 tokens、5 次 Google 请求。未配置价格，不估算费用。没有预约、登录、支付、同意条款提交。

| 场景 | 实际结果 | 证明边界 |
|---|---|---|
| TableCheck Budget | 键盘调下限，显示 ¥1000，Update 后 URL budget_dinner_avg_min=1000，重开保留 | 零模型实测；Reset 后脚本对已关闭面板再次 Close 超时，不计完整 Reset 验收 |
| TableCheck Cuisine | Sushi 勾选→Update→重开仍选中→反选→Update 清除 URL 参数 | 零模型真实来源效果验证 |
| TableCheck 模型筛选 | 3 calls，63291 tokens，158203ms；模型 Cuisine→Sushi→Update，代码核验 URL 成功 | 项目 Executor/Registry/Decision 接线；不是 Domain Offer 或 Web 端到端 |
| H001 正式 Hybrid | 9 calls，38468 tokens，5 Google，100627ms；PRESENT_RESULTS，1 个 TableCheck offer | 独立 Evaluator@14 相关条目 SATISFIED；另两候选来源失败，不代表普遍可靠 |
| Tabelog Happo | 5 calls，47334 tokens，32520ms；模型提前 COMPLETE，日期/4人未确认 | 业务未通过。旧 artifact 的 COMPLETED 是旧 Executor 状态缺陷，不是验收通过 |

H001 execution：`.eval-artifacts/restaurant-hybrid-live-read/2026-09-16T08-59-43-570Z-504e53b9-9ec1-4784-bd45-76833ca5f33b.result.json`；独立 evaluation：同 stem 的 `.result.evaluation.14-1789549284168.json`。

其他诊断产物：`.eval-artifacts/browser-completion-2026-09-16/`。Tabelog 实测日期为 `p.js-calendar-day-target`，有 data-year/month/day，却无标准 button role；当前通用控件枚举漏掉日期。人数 BUTTON 仅数字，缺少语义上下文。原始日期观察见 `tabelog-calendar-ready.json`；不以裸数字猜日期。

## 首个剩余阻断与停止条件

- 为 Tabelog 的真实日历/人数提供来源拥有的观察归一化，保持模型仅选择 opaque ID；以已捕获 DOM 结构做 Chromium 回归，随后真实模型只读重验目标日期/人数和时间的代码核验。
- P3 两店比较、用户修订后条款/证据记忆、各站新商户、真实 Web Live 尚未通过。新商户仅预登记 Tabelog URL，未执行，不算 B13。
- 地图为 P5，不加入 P0–P4 阻断。
- 本轮不追加第二批 Live 绕过既定 40 分钟限额。离线检查结果见 TEST-LOG；原始 execution 与独立判断分别保存。

## Follow-up: Tabelog controls and the two TableCheck candidates

Status: current development evidence; partial product acceptance. User authorized continued repair. This batch stayed below 12 model calls / 20 minutes: 5 calls, 39116 tokens, zero Google requests. No booking, consent, login or payment submitted. Prices unconfigured; no cost estimate. Live evidence is under `.eval-artifacts/browser-tabelog-repair-2026-09-16/`; code-snapshot*.json preserves code hashes; independent-evaluation.json is separate from execution artifacts.

### Repairs

- Tabelog source-owned control hints expose paragraph date attributes as full dates and numeric guest buttons as Guests. Both Playwright sessions use the shared Registry; the model receives opaque targets, never selectors. The production Adapter waits for the calendar/guest container, then verifies selected date plus active/hidden guest values. Standard select controls remain supported.
- Ordinary external website/social links no longer falsely establish an external booking provider. An explicit booking link is required.
- Registry now excludes native disabled, aria-disabled and data-state=disabled controls from model targets.
- TableCheck waits for the Venue Availability skeleton to disappear. One scoped widget binds full selected date, pax, time and the explicit Venue Unavailable Msg. A single-mealtime empty result cannot establish that a wider alternative-time window is empty. Loading, duplicate widgets, mismatching requests and cross-region values are rejected.
- TableCheck may independently verify current DOM control evidence after MODEL_HANDOFF; the model's COMPLETE alone cannot establish an Offer. Matching and wrong-date handoffs have regression coverage.

### Real runs

1. Tabelog initial run: 1 call / 10462ms, REQUESTED_HUMAN_HELP because the model entered before controls rendered. Failure preserved.
2. Tabelog with readiness: **2 calls / 19832ms**, **2026-09-20 / 4 guests confirmed**. Artifact `2026-09-16T09-30-04-668Z-2170ee1a-45cf-4645-890d-f8358d614a76.result.json`. This proves real-model query selection only; inventory remains NOT_ESTABLISHED.
3. Sushi Inase after disabled-control repair: 2 calls / 16082ms, no disabled-date timeout, but UNKNOWN because the parser did not yet recognize the completed empty message. Model interpretation was not accepted as fact.
4. Sushi Inase after source-result repair: **8967ms / zero model calls**, real Adapter identity and availability evidence produce **UNAVAILABLE / NO_MATCHING_SLOT** for **2026-09-16 / 2 guests / 19:00**. Artifact `2026-09-16T09-36-22-085Z-ba1bdd6b-366d-4934-b3ef-0955c4f2e7c3.result.json`. No inference about other times, dates or channels.

### Why the other two H001 candidates did not return offers

- **Shibuya Sushi Jinnan**: TableCheck discovery returned Sushi Teppen, Gotoku, Kourin, Aizawa and Shishie. Identity signals did not match. This establishes a search/matching miss, not absence from the platform. Its historical Tabelog external-provider classification may have been affected by the overly broad external-link check; that candidate's Tabelog path was not rerun here.
- **Sushi Inase**: exact phone established HIGH identity. The old observer missed data-state=disabled, then clicked and timed out; loading and the empty-result structure were also not recognized. Latest Live now returns a verified exact-query no-match result.

### Verification and remaining gates

Final typecheck, arch:check, build and diff check PASS; npm test **361/361**, real local Chromium **18/18**. Browser fixtures start from actual source Adapters, replacing network/model boundaries and retaining Registry/Executor/grounding. A delayed fixture caught a non-unique readiness selector; corrected to the calendar container, then passed. No new Replay or Controlled Live-write.

Tabelog inventory verification, two-store comparison/revision, new merchants and real Web Live remain incomplete P0-P4 gates. Maps remain P5. The specific date/guest observation defect is repaired; this is not full browser completion.
