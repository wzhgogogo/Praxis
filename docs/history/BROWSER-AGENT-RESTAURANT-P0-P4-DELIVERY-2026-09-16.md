# Browser Agent 餐厅 P0–P4 交付记录（2026-09-16）

- Status: Draft / P1–P2 offline implementation awaiting original-researcher review
- Document revision: 0.4
- Last updated: 2026-09-17
- Source of truth for: 本轮 P0–P4 的实际改动、离线验证、B1–B14 状态与原研究者 Review 输入
- Related documents: [实施计划](../BROWSER-AGENT-RESTAURANT-IMPLEMENTATION-PLAN.md)、[当前状态](../STATUS.md)、[Browser Read Diagnostics](../harness/BROWSER-READ-DIAGNOSTICS.md)、[Test Log](TEST-LOG.md)

本记录不是独立 Review、Live 验收或产品承诺达成的声明。没有修改 Gold，没有运行私有 Holdout、真实模型、真实来源或任何预约/支付/取消写操作；没有 commit 或 push。

## 范围与工作树保护

开始 HEAD 为 `a0937649be326ed813136be88a3c8da6b938da80`。开始前工作树已有大量未提交的 Restaurant Router、Domain、Harness、Web、浏览器及文档改动；本轮未 reset、stash、checkout、暂存或覆盖它们。审阅应以未提交 diff 为准，并把这些既有改动与下列 P1 增量区分。

本轮生产路径的增量集中在：

- `src/infrastructure/browser/browser-runtime.ts`、`playwright-browser-controls.ts`、`local-playwright-chromium.ts`、`cloudflare-browser-run.ts`：在既有单一 session/registry 中观察并执行 checkbox、range 与 scroll region；不引入第二个浏览器循环。
- `src/infrastructure/browser/browser-action-decision.ts`、`browser-task-executor.ts`：`browser_read_action@2`严格 wire；只接受当前观察的 opaque ref、明确 checkbox 状态、一个 range 键盘步进或有界区域滚动。活动 modal 外的背景控制只作状态证据。每次操作重新观察 control state，不能只依赖 URL/文本变化。
- `src/harness/browser/browser-read-fixture.test.ts`、`browser-action-decision.test.ts`：真实 Chromium 的 modal、selected/options、checkbox、range、scroll 反例和严格 decoder 覆盖。
- `web-skills/browser-read/SKILL.md` 与对应架构/能力/Harness 文档：同步运行边界，不扩展 Domain 权威或外部写权限。

真实调用链仍是既有链，而非独立演示：Web/Harness → `RestaurantExecutionRouter` → `LiveBrowserAvailability` / restaurant facts → `BrowserTaskExecutor` → `ModelGateway` 决策 → 来源 Evidence / Grounding → Reducer → Web。离线 H001–H005 当前组合保留真实应用、Router、Domain、Google/website/availability composition 和独立 artifact evaluator，只替换模型传输、HTTP 与页面边界；本轮未伪造 State、Offer 或 Evidence。

## P0–P4 状态

| Slice | 状态 | 实际结果 |
|---|---|---|
| P0 | PASS（取舍） | 已复核固定 Stagehand 4.1.0 小探针。它需要独立环境/会话，未显示足以抵消维护负担的同一会话收益；不加入生产依赖，也不把 observe 当规划器。结论与失败保留在 [small probe](../brainstorming/2026-09-16-stagehand-small-probe.md)。 |
| P1 | PARTIAL（离线） | 共享 Executor 的 Local/Cloudflare session 契约、modal/new-tab、双端金额滑条与目标滚动已由真实 Chromium 本地 Fixture 覆盖。生产来源 checkbox/range 默认拒绝；没有猜测的正向站点控件契约或真实来源验证。 |
| P2 | PARTIAL（离线） | 实际 Router/Domain/Evidence/Web/Harness 组合保留原始时段、只在用户明确允许时查询邻近范围并标记替代 Offer；候选隔离的商业事实进入最小模型比较笔记，用户刷新精确废弃同来源旧条款。真实平台和真实模型仍未验证。 |
| P3 | PARTIAL | 已有一次固定当前来源的真实模型诊断，以及用户授权的 H001/H003/H005 单次 Live Read-only；H001/H005 未合格，H003 未生成终态 artifact，因此不构成 P3 验收。未读取私有 Holdout。 |
| P4 | PARTIAL | 文档、验证记录和 Review 输入已整理；原研究者尚未独立审阅，因此不宣称 Review 通过。 |

## 2026-09-17 current repair addendum — review handoff pending

This addendum is the current classification for the H001/H003/H005 repair slice. It preserves, rather than upgrades, all earlier fixture and Live records. The user-authorized single Live attempt for each case is recorded in [TEST-LOG](TEST-LOG.md#test-2026-09-17-h001-h003-h005-bounded-live-read); no rerun follows the later offline repair.

| ID | Current status | Actual evidence and remaining limit |
|---|---|---|
| B1 | PASS (synthetic Chromium) | Existing production-Executor modal fixture remains the evidence; this slice did not retest it against a live page. |
| B2 | PARTIAL | The existing Router composition preserves a user-authorized alternative range. H005 forwards an unexpired `right now` as its original exact time and requires a provider-observed exact slot; both adapters return UNKNOWN for nearby-but-not-exact cards, and State rejects presentation after immediate expiry even if normal display TTL remains. It does not prove a valid immediate-slot Live result. |
| B3 | PASS (synthetic Chromium) | Existing selected/value separation evidence remains unchanged. |
| B4 | PARTIAL | The revoked broad GET permission remains revoked. Local fixture and earlier narrow source contract evidence exist; this repair adds no broad source control grant or new live control observation. |
| B5 | PASS (synthetic Chromium) | Existing two-ended slider and visible applied-filter evidence remains unchanged. |
| B6 | PARTIAL | Google-listed same-origin merchant pages are now consumed only as candidate pointers and pass the normal identity gate; the current slice has no new live cross-page control proof. |
| B7 | PARTIAL | Existing cited website-term reader remains local evidence. The repair strengthens complete outlet address identity (including cross-script representation) but has no real complex-page expansion/read result. |
| B8 | PARTIAL | Candidate-scoped minimal comparison notes remain covered offline; no current two-store real-source/model comparison was completed. |
| B9 | PASS (offline composition) | Existing Router/Reducer request-revision regression remains current; no live condition revision was run in this slice. |
| B10 | PASS (offline Evidence/Reducer) | Existing same-source refresh/supersession regression remains current; no new real source term refresh was run. |
| B11 | PASS (offline safety) | Narrow action validation, stale-reference and no-booking boundaries remain; no write action was invoked. |
| B12 | PARTIAL | The runner now settles the outer deadline so future capped runs can emit a terminal artifact. H003 exposed the prior non-finalization and its existing attempt remains unfinished; the repair has no new capped Live verification. |
| B13 | NOT_RUN | No separately registered, previously untested merchant was run by this H001/H003/H005 repair slice. |
| B14 | PARTIAL | Map-marker/geographic semantics remain unimplemented; no control action is reported as location satisfaction. |

Current local evidence: initial targeted resolver/composition tests **51/51**, followed by the address-sufficiency regression set **75/75**, immediate-slot composition **100/100**, TableCheck adapter **28/28**, and State-to-presentation expiry **95/95**; `npm run typecheck`, `npm run arch:check`, `npm run build`, `git diff --check`, and authorized loopback `npm test` **385/385** pass. H003 has only its [started record](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-17T04-52-35-417Z-5336c9d4-8f09-48aa-b372-c05d912a2b55.started.json), not a result or evaluator. The next required action is original-researcher review of the current dirty diff and this classification; no independent review pass is claimed.

### 2026-09-17 H001 identity/entrance follow-up

The independent-review H001 counterexamples were repaired and the resulting targeted suite is **55/55**, with full offline **392/392**. This includes an actual production-composition proof that `endReadRun` clears prior TableCheck entrance hints. The three user-authorized saved-entrance Live probes each failed at browser-runtime startup before a snapshot or model/Google call, so B6 remains offline-only and B13 is `ATTEMPTED / BLOCKED`. The complete B1–B14 update, frozen source hashes and artifacts are in [H001 identity/entrance follow-up](H001-IDENTITY-ENTRANCE-FOLLOWUP-2026-09-17.md). This is a handoff to the original researcher, not an independent-review approval.

## B1–B14 实际证据

| ID | 状态 | 证据与边界 |
|---|---|---|
| B1 | PASS | `browser-read-fixture.test.ts` 的真实 Chromium modal 场景确认背景日历 target 不暴露给模型，关闭 dialog 后才选择正确日期。 |
| B2 | PASS（离线组合） | `hybrid-read-composition.test.ts` 从实际 Semantic → Compiler → Router → TableCheck Grounding → Reducer 跑通：原 19:00 保存，明确许可的 18:30–19:30 成为查询范围，18:30 Offer 标记替代，日期/人数不变。未验证真实来源的禁用 19:00 控件。 |
| B3 | PASS | 真实 fixture 分离读取 select `value` 与 options 的 `selected`，人数为 2 时不把 option 10 当当前值。 |
| B4 | PARTIAL（真实 Chromium 本地 Fixture） | 生产 Executor 在显式 fixture 查询控件契约下验证 checkbox true/false、Update、重开保留和 Reset 清空；生产来源没有正向许可，宽泛 GET 许可已撤销。 |
| B5 | PASS（真实 Chromium 本地 Fixture） | 同一 production Executor 观察两个带 `aria-valuetext` 的上下限金额滑条（JPY 5,000/20,000），仅调整获得明确许可的下限，回读 JPY 6,000、保持上限不变，并验证目标 dialog 的 `scrollTop` 与最终页面已应用金额。内部 position 不被当作金额或业务结果。 |
| B6 | PASS（真实 Chromium 本地 Fixture） | 公开 `target=_blank` link 在同一 BrowserSession 切换 active page，page identity 变化后读取子页条款；父页引用未复用。 |
| B7 | PARTIAL（离线 Fixture + Evidence） | 生产 website reader 通过已观察的公开“Show terms”控件展开后才 Grounding；同一离线链仅在 HIGH candidate identity 后接纳显式标注的套餐价/税费、包间低消、取消/no-show。B5 的真实 Chromium region scroll 另验证目标容器反馈；裸金额不接纳，字段不会互相推断。尚无真实长页面/复杂展开结构的来源验证。 |
| B8 | PASS（离线 Agent 边界） | 两候选 website facts 仍按 candidate-scoped Evidence 隔离；`restaurant_agent_context@7` 只向 Agent 给出当前商业事实的字段/显示值/匹配来源，且不含 URL、evidenceId 或 sourceEntityId。真正的 Agent transport regression 确认其只接收这些最小笔记。没有真实两店来源或付费模型调用。 |
| B9 | PASS（离线组合） | 当前 `current-development-offline.test.ts` 经实际 Router/Reducer/Web 组合覆盖请求修订与当前 evidence/availability 重新评估；不是 Live 浏览器验证。 |
| B10 | PASS（离线 Reducer/Evidence） | 用户触发的网站事实刷新仅 supersede 同来源旧事实；新取消规则与新的套餐价成为当前笔记，旧 no-show 不再进入 Agent Context，未观察到的押金/no-show/选中状态保持未知。没有真实来源新增条款复验。 |
| B11 | PASS（离线） | strict wire 只接受当前 opaque ref 和窄动作；现有安全/陈旧引用/预算测试加上 modal 背景不可执行反例。没有提交预约。 |
| B12 | PASS（离线） | 既有 Executor 的 abort、预算、无进展收束继续由定向测试与完整套件覆盖；新动作沿用同一 session 与预算，未增加 fallback。 |
| B13 | NOT_RUN | 无授权 Live，也未登记或访问未调试新商户。 |
| B14 | PARTIAL | range/region 操作与语义结果已分离；没有地图标记、坐标或地理范围的可靠语义实现，仍不得把控件操作报告成位置满足。 |

`PASS（离线）`只证明列出的可重复离线范围，不能推断为真实平台兼容、实时库存或产品验收通过。

## 运行命令与结果

| 命令 | 结果 |
|---|---|
| `npm run typecheck` | PASS |
| `node --import tsx --test src/infrastructure/browser/browser-action-decision.test.ts src/infrastructure/browser/browser-task-executor.test.ts` | PASS，15/15 |
| `npm run test:browser:fixture` | PASS，13/13；真实 Chromium、本地拦截 HTML，无外部网络 |
| `node --import tsx --test src/integrations/restaurant-facts/google-listed-website-facts.test.ts src/server/local-web-server.test.ts` | PASS，28/28；离线来源 Evidence 与本地 Web Workspace，localhost-only |
| `node --import tsx --test src/eval/restaurant/agent-loop/hybrid-read-composition.test.ts` | PASS，29/29；真实内部 Semantic/Router/Reducer/grounding 组合，外部模型/HTTP 为替身 |
| `npm test` | PASS，352/352，0 fail/skip/todo；包含当前 H001–H005 offline composition 与独立 evaluator |
| `npm run arch:check` | PASS，0 forbidden source dependencies |
| `npm run build` | PASS |
| `npm run eval:restaurant:semantic:fixture` | PASS，15/15；`DEVELOPMENT_DIAGNOSTIC`、`PROMPT_AND_RESULT_EXPOSED`、`baselineEligible:false` |
| `git diff --check` | PASS |

P3 未运行，因此没有模型调用数、token、Google 请求、Live URL、时间物化或来源副作用计数可报告；不得以历史 artifact 代替本轮 Live。

## 代表性支持链

真实 Chromium 的 B1/B3/B4/B5 fixture 使用生产 `BrowserTaskExecutor`：观察到 modal/control snapshot → scripted model 仅返回 strict wire 的当前 `dom:` ref → decoder/validator 复核 revision、动作和目标 → Local Playwright session 执行 → executor 重新 snapshot，确认 checkbox/range/scroll/select 的实际 state → 页面独立可见结果断言。该链证明浏览器控制的局部后置条件；它不把 fixture DOM 文本升级为 Restaurant Evidence，也不产生 Offer 或 Task State。

## 未完成项与交给原研究者的 Review

下一最小步骤不是扩大动作集合，而是由原研究者审阅实际 diff，重点抽查 B2、B6–B10、B13–B14 和下列问题：

- `browser_read_action@2` 是否只增加已观察的无副作用原语，且 modal/background、stale ref、取消和预算仍 fail closed；
- P2 是否确实使用现有 Router/Evidence/Reducer/Web，而非测试旁路；尤其检查 `permittedAlternativeTimeWindow` 只能来自用户明确语义，及条款字段不会跨候选或互相推断；
- selected/options、滚动位置、来源事实与用户可见比较结论是否保持分离；
- 现有离线 H001–H005 结果是否被错误包装为比较/修订或 Live 成功。

若原研究者认可继续 P3，仍需一次新的、明确的授权，采用计划第 6 节的固定场景和上限；先离线审阅，不自动触发付费或真实来源运行。


## Second independent review correction

The P1/P2 PASS labels above describe the earlier partial delivery, not full current acceptance. R5-R8 were reproduced and repaired; the unsafe GET permission was removed, leaving positive real-site query-control wiring incomplete. Final 353/353 offline and 13/13 Chromium results do not establish Live compatibility or general complex-page understanding. See [review repair](BROWSER-AGENT-TERRA-REVIEW-2026-09-16.md).

## Current offline addendum — 2026-09-16 (handoff pending independent review)

This addendum is the current baseline for the changed files above. It does not overwrite the earlier delivery or its retained failures.

- Browser observation now carries a slider's accessibility-facing `valueText` separately from its numeric control position. The Local Chromium fixture runs a two-ended currency slider and modal scroll using the production `BrowserTaskExecutor`; only the fixture's known lower-bound query control is explicitly permitted. Production source controls remain default-deny.
- `restaurant_agent_context@7` now projects only current, candidate-bound commercial notes (`COURSE_PRICE`, `PRIVATE_ROOM_MINIMUM`, `CANCELLATION`, `NO_SHOW`) with the provider that supplied each fact. It does not project URL, evidence ID, source entity ID, raw page or stale same-source fact. Agent prompt@13 explicitly treats missing notes as UNKNOWN.
- A user-requested website fact refresh supersedes only stale same-source fact evidence. The regression verifies a new cancellation rule and course price replace an older price/no-show record without inventing any omitted term.

Current commands and actual results:

| Command | Result |
|---|---|
| `npm run typecheck` | PASS |
| `node --import tsx --test src/domains/restaurant/agent-context.test.ts src/domains/restaurant/agent-decision.test.ts src/domains/restaurant/action-validator.test.ts` | PASS, 28/28 |
| `npm run test:browser:fixture` | PASS, 13/13; local synthetic Chromium only, no external network |
| `npm run arch:check` | PASS, 0 forbidden dependencies |
| `npm run build` | PASS |
| `npm test` | PASS, 356/356, 0 fail/skip/todo; loopback/local fixtures only |

The first full run after the Context schema upgrade reported two stale v6 assertions in the mock-harness and PGlite persistence tests. Both were updated to assert the produced v7 context; the second full run above passed. This is retained as a verification finding, not represented as a product failure.

### Remaining gate and minimum Live observation proposal

P1/P2 are not complete product acceptance. The missing positive source-control contracts cannot be guessed from code, labels, GET forms, or synthetic pages. Before enabling any source checkbox/range operation, the minimum requested observation scope is: one public TableCheck search page and one public Tabelog listing page; at most one navigation each; 30 seconds each; no login, form fill, click, checkbox/range/scroll mutation, model call, booking, raw DOM persistence, cookie capture, or page-content export. Record only sanitized control metadata sufficient to define a positive contract (source, origin/path, role, accessibility label, input type and observed query effect status). Any ambiguity remains deny.

P3 additionally requires separate explicit authorization for a bounded real model + source read. It has not been requested or used here. B13 remains NOT_RUN; B14 remains PARTIAL because reliable map-marker/geographic semantics are P5 work and no position claim is generated from a control action.

### Original-researcher review handoff (PENDING)

Please independently review the current uncommitted diff and these focused boundaries before any Live authorization:

1. `permitQueryControl` has no production positive grant: verify checkbox/range remain denied unless a future source-owned, positive contract is added.
2. Inspect the two-ended slider fixture and registry: `aria-valuetext` is display evidence only, while page re-observation establishes the applied filter effect.
3. Inspect the Context v7 projection and Agent transport regression: candidate commercial notes must be current, sourced and unable to borrow a fact from another candidate or a superseded same-source record.
4. Inspect the refresh transition: only actual same-source stale fact evidence is superseded; omitted fields are UNKNOWN rather than copied from the prior record.
5. Confirm the statuses above remain offline-only and that P3/B13/B14 are not promoted by the full test pass.
