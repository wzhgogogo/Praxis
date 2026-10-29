# G5 B1 离线停止点报告

- Status: **OFFLINE_SUBSET_PASS_AWAITING_ADR_AND_G3_INTEGRATION**；工作分支交复核，未合main。
- Evidence: frozen exposed regression / synthetic local controls；不是来源Replay、Live或预约验收。
- Time: 2026-10-29T08:46:37.208569+01:00（Vienna CET，UTC+1）。
- Branch: `codex/feat-phase3b-b1-booking-handoff`；起点main `b2a3cbd30e6f0c78486cf8b8671e7820a227d550`。
- Verified source: `8f8cba13f3967dfc6bdee0ac5e2812dc722a3d35`；689项输入/源码SHA在运行前提交，前后核对一致。

## 本次交付与兑现范围

1. **ADR-0048保持Proposed。** 本报告末尾完整附文，待用户批准。没有通过草案改变Accepted授权、Outcome或网络Guard。
2. **TableCheck参数修正。** 已冻结9bfd0166反例在旧代码下实际产生pax，断言有效失败；修复改为num_people。只有确切时刻才加start_time，宽时段不猜时刻，并删除旧参数/旧时刻。原有嵌入式public query参数不变。针对性2/2、整份适配器64/64绿。
3. **暂态合同和服务端两次检查。** 新`restaurant-booking-handoff@1`只作暂态DTO；从代码拥有的来源记录生成，再于每次HTTP/SSE投影前对当前真实Case Snapshot重验。校验同店/渠道/offer/evidence、日期人数、精确时刻与窗口、HIGH身份和展示新鲜度、HTTPS域名/路径和无歧义参数。Tabelog只接受来源原链接，代码不拼form_course。没有fetch来“验证”链接。
4. **英文最小卡片。** 立即提供Book on来源网站，不等比较结束；Continue只描述参数已带入的日期/时刻/人数。一个提示行以原文课程名生成Pick；TableCheck始终Check date and guests。sourceSelection始终UNKNOWN。G1式引用核对同店、渠道、identity ID、URL、readAt及当前缓存逐字原文；缺证据不显示。未核实的平台费不显示。
5. **已有权限/版本不变。** 不登录/填写/提交/碰卡/存PII，不进入Tabelog禁止的/yoyaku/tabelog_booking/，不输出占位/确认页链接。Agent/Semantic/G1 Prompt与Schema、State/TaskDefinition均未递增。三个B保护文件未动（vacancy-response在本次base main不存在）。

## 仍未接通、不得宣称完成的部分

- **普通产品来源读者未启用。** 此次base main没有G3的tabelog-vacancy-response.ts，旧capturedSlots只留时刻、丢弃form_course URL。服务端有明确的cache-only组合入口，普通启动不注入；离线HTTP fixture注入该入口以验证合同。正式接G3只能消费B的审定结果，不能另写解析器或由店号/时刻倒拼。
- **取消规定的多语言严格语义未实现/未评价。** 单一已接纳G1答案带引用可显示；冲突未解决时暂不显示取消摘要。逐字检查不能证明哪份更严。需批准ADR及审定提取合同后接线，不把保守省略当成完整B1。
- **要卡分类、英文转述的真实G1质量未评价。** 当前为固定来源/固定G1结果的离线控制，不含新模型调用，不报告模型正确率。
- **平台费配置没有来源证据，未发布440日元为当前事实。** 后续配置必须带平台/渠道、原文、出处和日期。
- **返回反馈本轮仅在ADR定义。** 持久的最多一次Did you get the booking?及USER_REPORTED存储留ADR批准后实现；当前没有假的可用反馈按钮或BOOKED_VERIFIED跳转。

## 跨归属修改（均获用户明确批准，独立于功能提交）

| 文件/行 | 仅改变Praxis请求合同 | 提交 |
|---|---|---|
| src/harness/browser/browser-read-tablecheck.test.ts:147 | 请求URL期望pax→num_people，加start_time=19%3A00（编码后的19:00） | 547dadc0 |
| src/eval/restaurant/agent-loop/current-development-fixed-sources.ts:222 | 请求人数校验get(pax)→get(num_people) | 1fb34535 |
| src/eval/restaurant/agent-loop/current-development-fixed-sources.test.ts:54 | 错误人数请求记录期望pax=4→num_people=4 | 1fb34535 |

第148、191、228行等构造页里的来源链接、Gold、业务断言和评分规则不改。核验脚本将上述三行逆变换后与base main整文件比对，字节一致。A同时修G2超时，合并冲突时保留147行本次批准的请求URL；不要覆盖A的其他时序改动。完整授权记录：[cross-ownership.json](cross-ownership.json)。

首轮`cda313f0`净树验证typecheck/arch通过，npm test1191/1207，16项失败来自旧pax请求合同，随后门禁未继续；原始日志/冻结清单保留在[attempt-01](attempt-01/README.md)。批准后26/26针对性测试通过，原16个失败名称全部出现于绿灯；[逐项证明](request-contract-red-green.json)。最终全量1207/1207，未删除/跳过/反转断言。不是来源网站故障。

## 最终门禁

| 步骤 | 结果 | 秒 | git status前/后 |
|---|---|---:|---|
| integrity | PASS | 0.152 | empty / empty |
| typecheck | PASS | 0.494 | empty / empty |
| arch-check | PASS | 0.206 | empty / empty |
| test | PASS | 28.422 | empty / empty |
| build | PASS | 0.506 | empty / empty |
| browser-fixture | PASS | 106.8 | empty / empty |
| g2 | PASS | 21.617 | empty / empty |
| b1-web | PASS | 0.736 | empty / empty |
| b1-web-evaluation | PASS | 0.057 | empty / empty |
| integrity-after | PASS | 0.214 | empty / empty |

五门禁全部通过：npm test1207/1207；Chromium174/174。额外常规G2 4/4，不冒充G3严格查位验收。10步均前后净树、无恢复掩盖写入。[原始收据](gates.json) · [验证摘要](verification.json)。

## 四层解释、独立核对与边界

- **端到端：** 当前离线HTTP从真实创建Case入口经过Interpreter/Compiler/Agent/Validator/Router/Reducer/PGlite，再到B1服务端投影；仅模型传输和来源I/O替换。正常输出、篡改缓存拒绝、过期撤下、跨用户拒绝均通过。它不证明当前网站预选或订位成功。
- **环节：** 旧URL红→修复绿；领域同店/请求/新鲜度/URL与引文边界5/5；HTTP1/1；两站Web×桌面/手机4截图无横向溢出，早于比较结束提供按钮。旧页面已渲染同店候选但缺Book链接，控制红灯保存在red-web.log/web-baseline-red.png。
- **支持性/严重程度：** Web执行与评价分开：[execution](web.execution.json)、[evaluation](web.evaluation.json)。独立字面oracle核对两站源域名/路径/日期/时刻/人数及原文引文；Chromium路由记录意外外部请求0、page errors0，源码无来源导航。未把fixture的通过写为真实S0=0；实时库存、翻译/严格条款语义、外部选中、预约Outcome均NOT_EVALUATED。
- **归因：** 已有pax serializer缺陷及其固化在A请求合同中的旧假设；不是Google或网站网络失败。首轮红证据保留，修复只改请求方，不将网站给出的旧pax链接重写成新输入。

## 资源与停止点

本批实际模型0、评测公开GET0、Google0、Live0；.env未读取/加载。共享账本原字节SHA保持不变，新条目0（[资源回执](resources.json)）。日志/源码/输入模式不混报Replay或Live。按指令仅推本工作分支，停等复核及用户批准ADR；不合main，不自动接线或发起预约。

## 完整Proposed ADR（待用户批准）

原文件：[ADR-0048](../../../docs/decisions/0048-source-bound-b1-booking-handoff.md)。以下正文逐字附上；代码块中的相对链接以ADR文件目录为基准。

```markdown
# ADR-0048: Source-bound B1 booking handoff

## Status

**Proposed** — Document revision 0.1, 2026-10-29 (Vienna CET, UTC+1).

User approval is pending. Offline implementation of the explicitly authorized serializer, transient contract, copy and minimal Web presentation is allowed; this is not authorization for a real reservation, source navigation or shared version changes.

## Context

The user starts booking through B1, based on reservation proposal 0.6 sections 1, 2, 4.3, 6, 7, 9 and 12. The instruction in this chat supplies the complete applicable requirements; no unavailable Claude project document is required. Praxis already distinguishes current, identity-bound availability from facts and recommendations. B1 hands that source channel to the user. It does not submit a booking or establish a verified outcome.

Latest main b2a3cbd3 does not yet contain B's G3 `tabelog-vacancy-response.ts`. Existing Tabelog observations retain slot times but lose the response's form_course URLs. That dependency must be integrated from B's reviewed result, without changing or duplicating its protected parser, query controls or browser adapter.

## Decision (Proposed)

### 1. One current outlet, slot and source

A handoff references a current authoritative outlet/candidate, offer, date, Asia/Tokyo slot, party size, source entity ID, availability evidence ID and checked time/expiry. It uses only the channel that established availability; no automatic cross-channel comparison or alternate booking is part of B1. A recommendation without current availability cannot produce a booking handoff.

Provide **Book on Tabelog** or **Book on TableCheck** as soon as the qualified slot/link evidence is available; comparison completion is not a precondition. A user may explicitly choose a card's handoff. This is a departure to the source, not Praxis authorization to submit, reserve, pay or select a different restaurant.

### 2. Link provenance and two server checks

Tabelog English uses the exact source-returned `https://tabelog.com/en/booking/form_course/new?...` link admitted by B's vacancy-response binding. Do not reconstruct it from an ID or slot. It must retain merchant `rcd`, `visit_date`, `visit_time` and `member` matching the current offer and request. The original admitted response/evidence ID is retained for audit.

TableCheck uses a source-observed same-shop reservation entrance and verified parameters `start_date`, `start_time`, `num_people`. The deterministic source serializer replaces the obsolete `pax` query key; an exact observed slot supplies start_time. A broad request window alone must not invent a selected time. Existing embedded public availability-query parameters remain separate from reservation handoff parameters.

Links are code-owned records from the source cache/adapter, never model-supplied or client-supplied URL strings. No model constructs a URL or parameters. Both creation and just-before-display server validation check current candidate, source entity/channel, offer/evidence identity, date, guests, exact slot within the authoritative window, freshness, HTTPS origin and allowed pathname/query grammar. Missing/mismatched evidence hides the handoff. Changed conditions invalidate old prepared objects. Duplicate, ambiguous or unsupported query parameters, userinfo, ports, fragments, redirect/confirmation/payment tokens and wrong hosts/paths fail closed. This restriction does not authorize fetching a link to validate it.

### 3. No workflow-page access

Praxis never opens a reservation workflow page to verify a B1 link and never hands out a confirmation or hold-page URL. Tabelog `/yoyaku/tabelog_booking/` is forbidden and is neither fetched nor emitted. Only the whitelisted form_course entrance may be handed to the user. TableCheck accepts a same-shop reserve entrance, not confirmation, checkout, account, payment or session-specific paths. Existing network Guard rights are unchanged. The user may navigate in their own browser by explicitly activating a link; Praxis does not inspect or control that external session.

No login, form fill, submission, card operation or personal-data storage occurs. A correct URL is not a guarantee of remaining inventory or source UI state.

### 4. Three distinct assertions and deterministic copy

- **Praxis knows:** the current source observation supports this outlet, date, guests and available slot. Show its checked time/source as evidence, without asserting a selected plan.
- **The link carries:** its checked parameters encode particular fields. The departure button may say **Continue on Tabelog — date, time, 2 guests filled in**, or the analogous TableCheck wording, only for fields that passed the URL check.
- **The source actually selected:** unknown to Praxis after departure. Neither UI nor logs may describe a field, course or booking as selected/booked from query parameters alone.

The card has at most one instruction line, generated from grounded evidence. A source-quoted course label may become **Pick Omakase Nigiri ¥9,800**; this means the user must pick it. TableCheck always includes **Check date and guests**, because an existing site session can retain older conditions. If both apply, combine them in the same hint line. No unsupported course name or extra plan selection is inferred.

### 5. Cancellation, card and platform fee

On the recommendation card, show a short English cancellation sentence and the original verbatim G1 quotations, their URLs/read times and same-outlet identity binding. Card copy is exactly **Card required**, **No card needed** or **May require a card**, supported by the same-channel quoted page evidence. Do not copy another restaurant's or channel's terms. Missing evidence means the item is omitted, including fee rules.

If Japanese and English conflict, the stricter supported cancellation policy governs the English sentence and its source is identified. Selecting/deriving that stricter meaning needs validated G1 semantic output or explicit review; exact-quote matching alone cannot prove which policy is stricter. An unresolved conflict is not silently resolved by choosing the more lenient text. Until the reviewed extraction contract supplies a stricter resolution, the offline renderer suppresses that cancellation summary; this is an explicitly unfinished multilingual capability, not full B1 acceptance.

Platform-wide fees may be fixed configuration only with platform/channel scope, original quotation, source URL and effective/checked date. The instruction's example is Tabelog English ¥440 per person, nonrefundable on user cancellation; it is not published as a current fact without that evidence. No new public GET is authorized in this slice, so an unverified fee stays absent.

### 6. Return feedback, never verified booking state

On return after an explicit handoff departure, ask at most once **Did you get the booking?** Offer Yes / No / Skip, with no follow-up questions. Record only the enum, user/report time and outlet/handoff reference, with `USER_REPORTED` provenance; do not collect confirmation numbers, names, contact details, cards or free-text personal data. Yes must not transition to BOOKED_VERIFIED or become a provider-confirmed outcome. Non-response/Skip is not failure and is not re-prompted.

The durable once-only feedback receipt is scoped to that Case's B1 departure, owner authenticated, idempotent under reload/concurrent deliveries, and separate from authoritative booking state. Its storage/API and restart behavior will be implemented only after this ADR is approved. This pre-approval slice does not add a pretend functional feedback button or in-memory-only once guarantee.

### 7. Version and activation boundary

Transient handoff contracts and Web projections do not mutate Task State. No Agent Prompt, Semantic Prompt, State or TaskDefinition version changes in the offline slice. If production evidence persistence or a model extraction proposal needs one of these version changes, report the affected object/version before editing and coordinate with B. G3-owned files remain untouched. Passing fixtures does not establish live source compatibility, current inventory, semantic translation accuracy or a completed booking.

## Consequences

- A useful departure can be delivered without login, payment, PII or booking-side effects.
- Users see exactly what the source proved and what the link carries; no actual-site selection or booking guarantee is implied.
- Missing G3 link output, unsupported link grammar, unresolved terms or stale evidence stay visible as implementation/verification gaps in the report, without inventing evidence or navigating forbidden pages.
- Offline checks cover creation, second projection validation and minimal English Web behavior; B1 real-source activation and durable feedback await approval and reviewed dependency integration.

## Alternatives considered

- Let a model produce the URL: rejected; the origin, merchant and query must come from source data/verified code.
- Open the booking page to check prefill: rejected; B1 forbids this and Tabelog's forbidden hold workflow cannot be accessed.
- Reconstruct a missing Tabelog link from time and shop ID: rejected; it discards source provenance.
- Treat a returned user as booked: rejected; a self-report has no independent provider proof.
- Add a shared Task version before approval: rejected; no current offline need, and B owns ongoing G3.

## Related documents

- [ADR-0018 freshness](0018-availability-display-freshness-and-recheck.md)
- [ADR-0036 network boundary](0036-generic-public-read-network-policy.md)
- [ADR-0046 source-quoted answers](0046-observed-actions-and-source-quoted-answers.md)
- [Restaurant Domain](../domains/RESTAURANT-BOOKING.md)
- [B1 offline plan](../../.eval-artifacts/phase3b/g5-b1/plan.md)
```
