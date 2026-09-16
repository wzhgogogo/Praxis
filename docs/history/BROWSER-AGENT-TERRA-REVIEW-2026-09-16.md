# Browser Agent Terra 交付独立 Review

- Status: R1–R4 repaired; P1/P2 re-review pending; full P0–P4 acceptance still pending
- Document revision: 0.3
- Last updated: 2026-09-16
- Source of truth for: Terra 浏览器增量的本次独立审查、复现与返修要求
- Related documents: [实施计划](../BROWSER-AGENT-RESTAURANT-IMPLEMENTATION-PLAN.md)、[Terra 交付](BROWSER-AGENT-RESTAURANT-P0-P4-DELIVERY-2026-09-16.md)

## 首次审查结论（修复前证据）

**不通过当前改动验收；退回修复。** 没有新增第二套生产循环、采用现有 Executor 的方向正确，但新动作缺少敏感作用校验，且关键观察状态不正确。四个本地 Chromium 反例复现。P0–P4 整体也没有完成，交付文档已如实标注部分实现，不应在后续转述中称“全部做完”。

审查基于 HEAD `a0937649be326ed813136be88a3c8da6b938da80` 加未提交工作树。重点为 Terra 列出的 Browser Runtime/Registry/Decision/Executor 增量；不把其他任务的 Router/Domain/Harness 改动归为本轮新增。未修改产品源码、未 commit/push、未运行付费模型或外部网站。

## 必须修复的问题

### R1 — P1：SET_CHECKED 没有区分查询筛选与条款同意

位置：`src/infrastructure/browser/browser-task-executor.ts:407`。

当前只检查 kind、当前 checked、目标变化和 session API 存在，就执行 setChecked。真实本地合成页面上，对标签为 `I agree to cancellation terms` 的 checkbox，模型替身提出 CHECKED，Executor 执行成功，页面状态变为 `TERMS_ACCEPTED`。测试目标明确禁止同意条款，但指令不是程序权限检查。

这是新动作引入的权限缺口；不能因为不是 submit 就认定只读。修复应依据受信任的页面阶段与来源操作契约区分已识别查询筛选和条款/隐私同意等作用；未知作用拒绝。不要仅靠要求 LLM “不要点击”或只列几种英文敏感词。

最小回归：相同动作下，普通查询 checkbox 可勾选/撤销，条款 checkbox 被拒绝且 checked 始终 false；模型的理由、页面文字声明不扩大授权。范围滑条等新增可触发事件的动作也要审查同一作用边界。

### R2 — P1：滑条重新观察仍读取初始 value 属性

位置：`src/infrastructure/browser/playwright-browser-controls.ts:53`。

取值优先级是 data-date/data-value/HTML value attribute/inputValue。原生 `<input type=range value=15>` 经 ArrowLeft 后实际 property 为 14，HTML attribute 仍为 15；Registry 返回 15。模型会继续拿旧值决策，后置观察也可能将有效动作误判为未变化，当前值靠近边界时还可能错误拒绝反向调整。

修复：按控件语义读取实时状态，原生表单控件优先 property/inputValue；日期按钮等元数据另行处理，不能以统一 attribute 优先级覆盖当前输入值。

最小回归：相同生产观察器连续“读15 → 改14 → 再读14 → 改回15 → 再读15”，无需点击 Update 或改变正文；不能只检查最终 output 文本证明 Registry 正确。

### R3 — P1：声明支持 role=slider，却不读取 ARIA 数值

位置：`src/infrastructure/browser/playwright-browser-controls.ts:40`、`:63`。

`[role=slider]` 被登记成 RANGE，但 inputValue 对 div 无效，min/max 只读原生属性，没有 aria-valuenow/min/max。可见、带 tabindex 的自定义滑条，Registry 只输出 kind/label/role，没有数值和边界；ADJUST_RANGE 的有限数值检查随即拒绝它。此前 TableCheck 的真实预算滑条正是这类控件，不是尚无使用者的假设场景。

修复：支持原生与 ARIA slider 的状态读取，保留 aria-valuetext/邻近实际金额的语义区别，内部档位不能当金额。覆盖双端标识及实际键盘变化，不假定所有 slider 水平方向一致或键盘动作必然生效；不支持的变体明确报告。

最小回归：与已观察 TableCheck 结构等价的自定义双端 slider，值及边界可观察、一次动作后能读到新状态；保持旧原生 slider 正常对照。

### R4 — P2：用 offsetParent 判 modal 可见会漏掉固定定位弹窗

位置：`src/infrastructure/browser/playwright-browser-controls.ts:27`。

对可见的 `<dialog open role=dialog aria-modal=true style=position:fixed>`，offsetParent 为 null，activeModalCount 为 0，背景按钮没有 blockedByActiveLayer 标记。这恰是常见弹窗布局；原生 dialog 的隐式 role 也不被当前 CSS selector 覆盖。现有 Fixture 用普通文档流 div，未捕获该问题。

修复：使用与实际可见性一致的判断，识别原生/显式 modal；多层弹窗按活动层处理，不能用“位于任意 dialog 内”代替“位于当前可操作层”。背景内容可作为状态观察，但不能获得可执行资格。

最小回归：fixed modal、原生 dialog、隐藏 dialog 和关闭后恢复背景操作；至少包含一个正常对照，避免把所有页面永久禁用。

## 范围与证据问题

1. 当前实现只覆盖 P1 的部分控件能力，不能视为整个 P1 退出条件通过。Search 输入、真实 Update submit、非标准日历、活动区域阅读、新标签页、长页证据及明确替代查询等完整链路没有闭合。
2. P2 比较、来源笔记、条件更新的本次目标仍有未实现/未验证部分；不需要 Live 授权才能继续它们的实现及离线集成。P3 未授权可以保持 NOT_RUN，但不能成为结束所有实施工作的理由。
3. Stagehand 不采用是可以接受的工程决定；但交付称其“需要独立环境/会话”没有本轮同一会话接线失败证据。此前 navigation-control 是 Stagehand 与 Playwright 连接同一个浏览器。应改为“同现有 Session 集成的收益/成本未验证或不合算”的准确理由，不能把实验使用独立环境推成库的必然限制。
4. 当前 Fixture 的 scripted decision 直接返回 canonical action，并未经过 strict wire decoder；交付“代表性支持链”把它描述为 strict wire → decoder 路径不准确。decoder 有独立测试，但不等于这个完整组合已覆盖。补一个真实 ModelGateway transport 替身到 Executor 的组合覆盖，或收窄报告，不能混报。
5. B11/P1 的 PASS 应在返修时对应本审查反例更新，不继续把既有测试全绿当安全不变量成立。

## 独立运行与证明范围

- `npm run typecheck`：通过。
- `node --import tsx --test src/infrastructure/browser/browser-action-decision.test.ts src/infrastructure/browser/browser-task-executor.test.ts`：15/15 通过。
- `.eval-artifacts/browser-terra-review-2026-09-16/review.ts`：本地真实 Chromium，无付费模型；terms 页面通过 route.fulfill 完全合成，其他页面 setContent。四个检查全部复现失败，结果见同目录 `results.json`。
- 首次 Chromium 沙箱启动被系统拒绝，授权启动后运行成功；首次 ARIA slider 没设尺寸的测试对象不可见，最终复核补上尺寸并仍复现缺值，最终 modal 明确包含 role 属性，排除了仅因隐式 role 的歧义。
- 所有测试浏览器在 finally 关闭。未重新运行全量 npm test/build/arch:check 或原 9 项 Chromium Fixture；Terra 报告的全量通过是其证据，不冒称本轮独立复跑。
- 这些是 Synthetic real-browser 反例，不是 Replay/Live，也不宣称证明真实预约副作用。

## 返修与再次 Review 的交付顺序

1. 将 R1–R4 并入既有行为测试，先保存当前实现上的失败，再修复。不要只把独立 review 脚本搬成永久重复 runner。
2. 更新交付状态、纠正 P0 和 strict wire 接线说明；继续完成 P1/P2 尚未完成的离线工作，不扩大框架或动作权限。
3. 按 Test Skill 运行受影响行为、完整门禁和 Chromium Fixture，保留具体日志与执行/评价分离。
4. 提交清晰 diff、B1–B14 状态和证据索引给原研究者复核。P3 仍需已有或新增明确 Live 授权；不要擅自消耗调用额度。

本记录不授权真实写入、不自动派发新任务或修改 Terra 的任务状态。


## 2026-09-16 用户授权后的修复复核

本节为 current development evidence；上文保留修复前反例，不代表当前代码仍有同样结果。本轮直接修复 Registry、Executor 和既有 Chromium Harness，未接管其他任务的 Router/Domain 工作。

- R1：新增来源代码持有的 `permitQueryControl` 契约；SET_CHECKED / ADJUST_RANGE 未获明确查询作用许可时默认拒绝。模型理由、页面文案不能赋予权限。正向 Fixture 明确许可查询控件；负向 Fixture 经真实 strict-wire Decision → Executor → Chromium，确认条款未被勾选。**当前生产来源尚未接入该许可，不能宣称真实网站筛选已可用。**
- R2：原生输入/选择控件读取实时 property，滑条变化前后不再被初始 HTML value 覆盖；稳定引用键不包含可变输入值。
- R3：自定义 slider 读取 aria-valuenow/min/max，真实 Chromium 检查原生及 ARIA 滑条左右调整后的回读。当前仍是键盘单步能力；双端金额解释、aria-valuetext、垂直/特殊键盘行为不在本次通过范围。
- R4：用 Playwright 可见性替代 offsetParent，纳入原生 dialog，过滤活动层外目标。覆盖 fixed 原生 dialog、嵌套及隐藏 dialog、关闭后恢复背景。任意 sibling z-index / 多个原生 top-layer 的打开顺序不在该 Fixture 证明范围。

验证：修复前正式 Harness 保存失败；修复后 typecheck、arch:check、build、全量 npm test 344/344 通过。完整 Chromium 结果见 TEST-LOG。本轮只有本地合成页面、模型 transport 替身，无付费调用，无新增 Replay、Live Read-only 或 Controlled Live-write，也未 commit/push。测试扩展的 check/uncheck/check 往返使用单独 36 次操作预算，生产默认 24 不变。

证据目录：`.eval-artifacts/browser-terra-review-2026-09-16/`；`before-fix.log`、`after-fix-tests-authorized.log`、`final-browser.log`。首次全量测试因沙箱禁止 localhost 监听失败，授权重跑通过。P1/P2 的完整产品链、来源许可接线、P0 采用理由修订与 P3 真实来源验证仍由主线推进，四个修复不构成 P0–P4 整体验收。
## 2026-09-16 原研究者复审请求（待执行）

Terra 已补交 P1/P2 的离线实现与证据，详见[交付记录](BROWSER-AGENT-RESTAURANT-P0-P4-DELIVERY-2026-09-16.md)。此节是交接清单，不是 Terra 对自身的复审结论，状态为 **PENDING**。

请在当前未提交工作树上优先复核：

1. `public-query-control-policy.ts` 与两个 source adapter：仅 TableCheck `/en/japan/search` 和 Tabelog `/en/rstLst` 的 GET 查询控件可获许可；是否仍能以标签、HTML、POST form、同意/账户/预订控件绕过。
2. `BrowserTaskExecutor` 与两种 BrowserSession：target-blank 后 active page identity 是否变化、旧 `dom:` ref 是否失效，且不产生第二 session 或跨源导航。
3. `permittedAlternativeTimeWindow` 从 Semantic Contract 到 Router/Grounding/Reducer 的完整传递：原时段、日期和人数必须保留，范围外原时段的slot必须标替代。
4. website facts：展开的公开 terms 控件是否仍是受限 non-submit action；HIGH candidate identity、candidateId/sourceUrl 和价格/税/低消/取消/no-show 字段是否不混淆，裸金额和缺字段是否保持UNKNOWN。
5. P1/P2 通过只指列出的离线组合/真实 Chromium Fixture。B13、B14及真实模型/来源仍未完成；不得因全量 `npm test` 通过而升级为 Live 或产品验收。

Terra 已运行 typecheck、arch check、build、`npm test` 352/352、browser fixture 13/13 与 `git diff --check`；复审者应独立确认，不需要也不应自动重跑付费或Live。复审结论和严重问题应追加在本文，不得把本节改写为“已通过”。


## 第二轮独立 Review：P1/P2 追加交付仍不通过

Status: current development evidence / changes requested。认可本轮确实增加来源许可接线、替代时段、商业条款和本地新标签页支持；下列独立反例说明不能把它们报告为完整 P1/P2 验收。此轮只审查与保存复现，未修改业务代码。

### R5 — P1：修订时间没有撤销旧替代范围

`semantic-compiler.ts:223–226` 仅在新 proposal 包含 alternative 字段时写入许可，否则不清除已有许可；`intent-state.ts` 保留旧字段。实际 Compiler → applyRestaurantIntentPatch 连续执行：先要求 19:00 并允许 18:30–19:30，再 CORRECT 为 only 20:00，最终 timeWindow=20:00，但 permittedAlternativeTimeWindow 仍为18:30–19:30。Router 优先使用该旧范围，用户修订后继续查错时段。修复必须绑定当前请求的许可生命周期，覆盖收紧条件、改时间、撤销替代的组合，而非仅初次设置。

### R6 — P1：公开 GET 搜索页上的未知控件被默认许可

`public-query-control-policy.ts:18–25` 只依据站点路径、GET form 与英文 blacklist 授权任意 checkbox/range。生产 policy 对同一允许页面下 `利用規約に同意する` 返回 true；英文测试只证明英文关键词命中，未证明查询作用。GET 不约束 onchange 的实际效果。来源策略需要正向识别已知查询控件及对应页面阶段；不能用补日文关键词代替未知作用默认拒绝。该反例为合成 policy 输入，不宣称真实站点存在此具体表单。

### R7 — P1：金额标签与金额没有绑定，会把押金当套餐价格

`google-listed-website-facts.ts:183–189` 在整行匹配 course price，再取该行第一个日元数。实际生产 reader → Grounding 输入 `Course price: deposit ¥3,000; full price ¥12,000 (tax included)`，输出 coursePriceYen=3000。该错误随后成为候选事实并可显示在 Web。必须将金额、税费和套餐上下文绑定，歧义保留未知；不能以行内出现关键词认定首个金额就是套餐总价。多套餐字段作用域亦尚无充分验证。

### R8 — P1：已有类型和营业时间时提前结束，不读取所需条款

`google-listed-website-facts.ts:219–223` 的完成判断只看是否存在任意类型和营业时间，无需所请求商业细则。用实际 reader/Executor、Synthetic BrowserSession 和模型决策替身：首页已有 Cafe 与营业时间，取消政策藏在已观察的 Show terms 按钮后；请求 criteria 包含 cancellation policy。结果 decisions=0、clicks=0、没有 cancellationTerms。交付中的展开测试把初始页类型/营业时间一起删掉，因而未覆盖普通首页。需将所需事实传入目标和完成判断，以已获取、未知或受阻状态完成调查；不能让任意类型事实代表所有 HARD 条件已读完。

### 独立验证与下一门槛

- `npm run typecheck` PASS。
- 本轮定向既有测试（policy、website facts、semantic compiler）24/24 PASS；四个反例均可复现，说明现有绿灯没有覆盖上述契约。
- 复现入口 `.eval-artifacts/browser-terra-review-followup-2026-09-16/repro.ts`，输出 `results.log`，既有测试日志 `existing-tests.log`。该目录为本地忽略开发证据；上面保留可审计输入和结果摘要。
- 模式：纯本地实际业务代码 + Synthetic browser/model 边界，不是 Chromium 实测或 Live。未调用付费模型、外部网站、未重复全量测试/build，未 commit/push。
- 必须先将上述反例并入所属行为回归并修复，再复核相关集成和 Live 就绪状态。B5 双端金额、B8 模型仅凭来源笔记比较、B10 精确刷新仍需按原计划核验；不能用候选卡并排显示替代模型比较验收。P3 仍未运行。


## 2026-09-16 Second review repair: R5-R8

Current development evidence. Time-window replacement now clears old alternative permission at Intent patch application; explicitly supplied new permission is applied afterwards. The unverified public GET search policy and adapter grants were removed: production checkbox/range actions default to deny pending positive source control contracts. The synthetic fixture alone grants its known query controls; Japanese consent is refused through the real Chromium strict-wire path.

Commercial scalar prices now require an unambiguous complete labelled line; deposits mixed with prices and multiple courses remain unknown. Supported commercial requests (course price, room minimum, cancellation, no-show) are included in the reader objective and completion check. Existing type/hours no longer cause early completion when requested terms are missing. Missing requested facts return UNKNOWN / WEBSITE_REQUESTED_FACTS_UNCONFIRMED while retaining observed evidence. This is narrow explicit-keyword support, not general multi-course or natural-language understanding.

Verification: typecheck, arch:check (0 forbidden), build, full npm test 353/353 and synthetic real-Chromium 13/13 PASS. Before-fix regressions saved. An initial Compiler-level null patch failed one old shape assertion; invalidation was moved to Intent patch application and the full suite rerun successfully. Logs: `.eval-artifacts/browser-terra-review-followup-2026-09-16/before-fix.log`, `final-tests.log`, `browser.log`. Old repro.ts records the pre-fix policy and is not a current runner after its deletion.

The unsafe policy test was retired with the implementation; existing semantic/website and Chromium tests were strengthened, with ambiguity and missing-fact regressions added. No paid model, Replay, Live, external writes, commit or push. R6 is safely closed but positive real-site filter wiring remains incomplete; full P1/P2/P3 acceptance is not claimed.

## 2026-09-16 current offline increment — original-researcher re-review requested

Status: **PENDING**. This is a handoff request, not a Terra self-review or approval.

Since the R5–R8 repair, the current uncommitted diff adds: (1) `aria-valuetext` observation for a synthetic two-ended budget slider while retaining default-deny production query controls; (2) `restaurant_agent_context@7` commercial notes that are current, candidate-bound and source-matched; and (3) a same-source website-fact refresh regression that removes stale no-show facts when only updated cancellation/price evidence is observed. The current delivery record lists the exact changes, B1–B14 statuses and minimum real-page observation proposal.

Please inspect the actual diff and independently verify the focused 28-test boundary, local Chromium fixture, and full gate evidence before any bounded Live proposal. In particular, reject any inferred production query-control grant, cross-candidate/stale commercial note, or claim that an unobserved term is known. The current author reports `npm test` 356/356, but this does not constitute independent review or real-source validation.


## 2026-09-16 Third independent review: offline addendum

Current development evidence. This delivery explicitly labels P1/P2 PARTIAL and P3 NOT_RUN; it does not claim full completion. Independent runs: Agent Context/Decision/Validator 28/28, real local Chromium 13/13 and typecheck PASS. No paid model or Live run. The full 356-test count remains the implementer's report, not an independent rerun here.

### R9 (P1): Web still presents superseded commercial evidence

`src/web/local-workspace-page.ts:83` selects commercialTerms with the first RESTAURANT_FACT in all candidate readEvidence. `persistent-restaurant-agent.ts:747` exports the full retained evidence history. The new current-fact filtering applies to Agent Context only, so it does not repair user-visible refresh behavior. Evaluating the actual Web selection expression with old price 7500/no-show 100%, followed by current price 8000/cancellation no fee, and factCheck evidenceIds=[new], supersededEvidenceIds=[old], selects old and displays 7500/no-show 100%. The source link is independently chosen from availability/first evidence and may not cite the terms being displayed. Fix the actual Web projection to use the shared current fact view and link the displayed terms to their own source; verify refresh through the user-facing path.

Overall acceptance remains incomplete: positive real source query-control contracts, complex source-page verification and P3 model/source/new-merchant runs remain outstanding. B14 map semantics belong to P5 under the original plan, and are not an added P0-P4 blocker. The proposed navigation-only observation can collect control metadata but cannot demonstrate the controls' effects by itself; any subsequent bounded effect test must be scoped explicitly, not inferred from labels or GET method.
