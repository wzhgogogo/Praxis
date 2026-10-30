# G5 B1 后续停止点报告

- Status: **OFFLINE_FOLLOWUP_PASS_G3_DEFERRED**；完成指令1–3，仅推工作分支，等待复核，不合main。
- Time: 2026-10-29T12:23:51.413035+01:00（Vienna CET UTC+1）。
- Branch: `codex/feat-phase3b-b1-booking-handoff`。
- 审定起点：`6b867b34`；同步main `50a0836148c5b026240a770de89c5d5357091355`，合并`4342c989`保留双方历史。A的G2串行前置调度、断言、180s限额原字节保留。
- 验证源码：`7542dde793dc83f37cfed082e59b63a45e5befa8`，运行前提交702项源码/输入SHA，前后相同。最后只追加文档/证据。

## 结果

**ADR已改为0049 / Accepted / revision0.2。** 0047/0048留B分支；当前产品文档和注册索引引用0049。旧0048草案及6b867b34报告保留历史语境，不按新规则重评分。

**持久返回反馈。** 新增独立`restaurant_booking_departures`表与迁移0010，旧9条迁移原字节不变。显式Book/Continue点击先重新取得服务端验证链接，记录Case/出发ID/候选/offer/渠道与时间，再由用户浏览器打开来源标签页；客户端不提交URL。返回focus/pageshow/重载从持久回执投影触发一次提示。领取提示先在数据库持久化，Case行锁与部分唯一索引确保每Case至多一次；三个Case的Yes/No/Skip正常保存为USER_REPORTED，重复提交保留原回答，冲突回答/额外个人资料字段/跨用户/跨Case回执拒绝。未回答、Skip或丢失回包也不重新问。无新模型调用，Task版本、Phase、Availability和Outcome不改变，不产生BOOKED_VERIFIED。前端内存仅避免重复请求，持久保证来自SQL。

**日英取消冲突。** 独立暂态合同`restaurant-booking-handoff@2`接收两份G1-admitted答案，逐字核验同店、同渠道、页面、readAt及身份。卡片并列Japanese page/English page的原文与各一句英文转述，显示精确文案`Cancellation terms differ between the Japanese and English pages`；单个提示段增加`Confirm cancellation terms on the website`，与Pick/Check date and guests合并。没有冲突保留一句转述；缺失/错页不补造。代码与模型不决定哪份更严；自动G1实际语义质量本轮未运行。

**固定手续费配置。** 只作用于Tabelog英文form_course交接，来源为本批第二次GET的[英文帮助页](https://tabelog.com/en/help)，检查日2026-10-29、正文SHA记录在配置与页面旁provenance。原文明示JPY440每人、用户原因取消不退、餐厅发起取消会退，均有逐字quote；卡片显示费用说明及可展开的出处/日期。TableCheck不推断费用；不是餐厅取消费或套餐价格。

## 两次公开GET及账本

1. `https://tabelog.com/robots.txt` →200，decoded SHA `126cafe6a1c8758c1d015f1a63921702074f922eadb2586cec34e69b0677947f`。
2. 保存页nr010原有href `https://tabelog.com/en/help` →200，decoded SHA `f8d3583945fb819636854582432a10109a0d782cc2314b7088ccfa9cc2fc4b51`。

实际请求UA `Praxis-B1-evidence/1.0`适用`User-agent: *`，七条Disallow均不匹配/en/help；其他命名爬虫组原文保留。先存[robots允许决定](robots-decision.json)，再读help。均直接HTTPS、不带Cookie、不跟随跳转、不重试，间隔≥30s、20s超时；没有限流、预约流程或额外页面请求。[资源/时间/头/SHA](resources.json) · [robots元数据](robots.meta.json) · [帮助元数据](help.meta.json)。原始响应体raw与decoded分开冻结，产品测试副本SHA独立核对。

共享账本按ID追加2条，原条目不变，评测GET242→244/257。模型0、Google0、Live0，不读取/加载.env。匿名Set-Cookie响应头未使用；首轮元数据中多存的该头在发布前移除，三个尚未推送的本批提交已脱敏重放，正文/URL/请求时间/raw/decoded SHA不变。[原捕获源码与安全发布提交对应](publication-sanitization.json)；无需强推，不改已批准6b867b34或main50a08361。

## 红绿与验证

- 有效红：持久出发API旧实现404≠201；双语冲突旧实现notice为undefined。原日志[反馈红](red-feedback.log)、[冲突红](red-conflict.log)。
- 绿：领域合同/固定原文政策7/7；真实创建Case → Interpreter/Compiler/Agent/Validator/Router/Reducer/PGlite → 服务端出发/返回反馈，保留生产链路，仅模型传输与来源I/O替换。4个并发HTTP领取仅1个返回提示，未回答/已回答均重启不重问，Yes/No/Skip及重复/跨Case/跨用户控制通过。实际Postgres多连接尚未运行。
- 本地真实Chromium两站、桌面/390px手机，源链接生成后不会自动访问；每站只在用户点击后产生1个被本地route替换的导航。返回问题、Yes/Skip提交及刷新不重问、到期撤下、双语/fee来源均通过，目视截图无横向溢出。UI stub不替代SQL保证。
- Web首次预检错误地等待折叠details中的隐藏链接，失败日志web-preflight.log保留；核验改为显式展开出处后检查，第二次及最终冻结运行通过。

### 最终五门禁和额外检查

| 步骤 | 结果 | 秒 | git status前/后 |
|---|---|---:|---|
| integrity | PASS | 0.19 | empty / empty |
| typecheck | PASS | 0.488 | empty / empty |
| arch-check | PASS | 0.201 | empty / empty |
| test | PASS | 28.113 | empty / empty |
| build | PASS | 0.442 | empty / empty |
| browser-fixture | PASS | 120.287 | empty / empty |
| g2 | PASS | 21.233 | empty / empty |
| b1-web | PASS | 1.183 | empty / empty |
| b1-web-evaluation | PASS | 0.054 | empty / empty |
| integrity-after | PASS | 0.203 | empty / empty |

npm test1210/1210；Chromium175/175（含A的G2独立调度），额外常规G2 5/5。10步均净树、未恢复文件掩盖写入。原件：[gates.json](gates.json) · [verification.json](verification.json)。

### 四层解释与独立性

端到端结果仅为获准的B1离线合同PASS；不声称当前库存或真实预约完成。逐环节通过来自冻结源URL/请求、真实生产组合、SQL回执和逐字引文。Web执行与独立字面核验分开保存：[execution](web.execution.json)、[evaluation](web.evaluation.json)；独立预期核对URL参数、日英原文、提示、fee来源及反馈枚举。未发现本地固定合同的错误声明/越界；不把模拟通过写成真实Live S0=0。归因分别为旧功能缺失、测试隐藏元素可见性假设、首轮元数据头部多收集；没有Google故障、费率猜测、身份规则放宽或评分口径变化。

## 明确留后

G3 Tabelog输出接线本批未做，B三个保护文件原字节不变，vacancy-response在所同步main50仍未出现；不另写解析器、不拼店号/时刻URL。普通产品启动仍未注入来源链接读者。Agent/Semantic/G1 Prompt与既有Schema、State/TaskDefinition均未递增。

第一次Live用户自有浏览器TableCheck参数带入核对已加入[Live清单](live-checklist.md)：num_people + start_time=19%3A00，用户确认实际日期、时间、人数。清单状态NOT RUN，本次不打开真实订位页、不登录/填写/提交/碰卡或存个人资料。

## Accepted ADR0049全文

[当前ADR](../../../docs/decisions/0049-source-bound-b1-booking-handoff.md)；相对链接以ADR文件位置为准。

```markdown
# ADR-0049: Source-bound B1 booking handoff

## Status

**Accepted** — Document revision 0.2, 2026-10-29 (Vienna CET, UTC+1).

User approved on 2026-10-29. Renumbered from the reviewed C draft0048 because B owns0047/0048. The user also explicitly replaced the multilingual cancellation decision below on 2026-10-29. This grants no real reservation submission or shared Agent/State/TaskDefinition version changes.

## Context

The user starts booking through B1, based on reservation proposal 0.6 sections 1, 2, 4.3, 6, 7, 9 and 12. The instruction in this chat supplies the complete applicable requirements; no unavailable Claude project document is required. Praxis already distinguishes current, identity-bound availability from facts and recommendations. B1 hands that source channel to the user. It does not submit a booking or establish a verified outcome.

Synchronized main50a08361 (reviewed C base b2a3cbd3) does not yet contain B's G3 `tabelog-vacancy-response.ts`. Existing Tabelog observations retain slot times but lose the response's form_course URLs. That dependency must be integrated from B's reviewed result, without changing or duplicating its protected parser, query controls or browser adapter.

## Decision (Accepted)

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

User decision, 2026-10-29: when Japanese and English cancellation terms differ, neither code nor a model decides which is stricter. Show both original texts, each with a one-sentence English paraphrase and its own verbatim citation. Label the card **Cancellation terms differ between the Japanese and English pages** and include **Confirm cancellation terms on the website** in the single instruction line. Without a conflict, retain the original single English sentence and citations. Missing or unverified text is not fabricated or silently substituted. The conflict input is a pair of G1-admitted source answers, not a ranking or a new permission to read more pages.

Platform-wide fees may be fixed configuration only with platform/channel scope, original quotation, source URL and effective/checked date. The instruction's example is Tabelog English ¥440 per person, nonrefundable on user cancellation; it is not published as a current fact without that evidence. The user authorized at most two public GETs in this follow-up, including a fresh robots.txt check and one public English help document. No retry on rate limiting, no workflow pages/login. Only facts explicitly present in that original text enter the fixed configuration; unspecified refund behavior remains absent.

### 6. Return feedback, never verified booking state

On return after an explicit handoff departure, ask at most once **Did you get the booking?** Offer Yes / No / Skip, with no follow-up questions. Record only the enum, user/report time and outlet/handoff reference, with `USER_REPORTED` provenance; do not collect confirmation numbers, names, contact details, cards or free-text personal data. Yes must not transition to BOOKED_VERIFIED or become a provider-confirmed outcome. Non-response/Skip is not failure and is not re-prompted.

The durable once-only feedback receipt is scoped to that Case's B1 departure, owner authenticated, idempotent under reload/concurrent deliveries, and separate from authoritative booking state. Store departures and the once-only prompt/response receipt separately from Task State and reservation Outcome. Use authenticated Case ownership, database transactions and per-Case uniqueness; repeated deliveries and restarts cannot ask again or change an already recorded answer. Claim the prompt durably before rendering it. A lost response can suppress a prompt (at most once), never cause an automatic re-ask. Do not rely on frontend memory for the guarantee.

### 7. Version and activation boundary

Transient handoff contracts and Web projections do not mutate Task State. No existing Agent/Semantic/G1 Prompt or Schema, State or TaskDefinition version changes. The independent transient handoff contract advances to restaurant-booking-handoff@2 for the conflict pair. If production evidence persistence or a model extraction proposal needs one of these version changes, report the affected object/version before editing and coordinate with B. G3-owned files remain untouched. Passing fixtures does not establish live source compatibility, current inventory, semantic translation accuracy or a completed booking.

## Consequences

- A useful departure can be delivered without login, payment, PII or booking-side effects.
- Users see exactly what the source proved and what the link carries; no actual-site selection or booking guarantee is implied.
- Missing G3 link output, unsupported link grammar, unresolved terms or stale evidence stay visible as implementation/verification gaps in the report, without inventing evidence or navigating forbidden pages.
- Offline checks cover creation, second projection validation and minimal English Web behavior; Durable self-report feedback and conflict presentation are implemented offline; B1 real-source activation waits for reviewed G3 dependency integration.

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
- [B1 follow-up plan](../../.eval-artifacts/phase3b/g5-b1-followup/plan.md)
```
