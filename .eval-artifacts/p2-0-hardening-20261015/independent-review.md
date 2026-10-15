# P2-0 独立复核

- 复核时间：2026-10-15 21:00–22:00 东京
- 复核者：独立复核（Claude），非实现者
- 范围：
  - 四个代码提交：`976baaa`、`60e78b9`、`f759c34`、`35b6bf0`；
  - 两次 Live：h002 原版，h001 按用户指令改为明天（10/16）；
  - 报告 `report.md` 及其日志；
  - 用户提供的 h001 原始 result.json（SHA-256 `b5a1f0c3…dfefc`）。
- 依据：`codex-instruction.md`（P2-0）、Eval Skill 2.0、Test Skill 1.3。
- 证据状态：已暴露开发证据，非 Clean Baseline。
- **复核者没能独立运行测试**：本会话无法访问 npm 仓库（代理拒绝 registry.npmjs.org），仓库要求 Node 24，这里是 22。所有测试结论来自实施者日志与代码阅读，下文按此口径书写。

## 结论

**P2-0 通过。** 四项都按要求先红后绿；关键结论有代码和原始产物支持。有三处遗留，都不阻断，已并入 T1：

1. 第 2 项只处理了模型与操作限额。循环、Router 和执行器时限仍有隐藏默认值，报告也没有按要求逐项说明保留理由。
2. 真实浏览器套件中有 2 个用例一直失败，至少从 `b55e91c` 起就是红的。它们正是 h001 真实浏览器路径的测试，因为默认门禁不包含浏览器套件，所以一直没被发现。
3. Guard 的 CDP 层对"认不出是重定向"的请求直接放行。目前没有可复现的绕过，但失败方向是开放的，应改为按策略复核。

两次 Live：

- **h002：合格交付，无错误声明。** 交付后 GET 独立核验。
- **h001（明天日期）：如实无结果。** 是否可行还不知道。额度接线缺陷在 Live 中确认已修复；h001 的卡点已经转为效率问题：找店慢、查位超时、整单 50 次模型调用用尽。这属于第二阶段，不是 P2-0 缺陷。

## 逐项复核

### 1 Guard 逐跳重定向（`976baaa`）：通过

- **做法：** 普通 `context.route` 仍负责首个请求。另在页面首个请求之前安装 CDP `Fetch` 拦截；之后每一跳在发出之前，都按原 ADR-0036 规则核对 origin、方法、资源类型和 query/body。
  - 上限 10 跳，并有时限；
  - popup、iframe、dedicated worker 都覆盖；
  - service worker 在两种运行时都是 `serviceWorkers: "block"`；
  - 安装失败时关闭 context。
- **证明：**
  - 旧 Guard 在真实 Chromium 上 13 项中 12 项失败（`red-corrected-receiver.log`），以接收端实际收到请求为准；
  - 新 Guard 14/14 通过（`chromium-green.log`）；
  - 错误的假 route 测试已删除。
- **ADR：** 0036 只追加了执行说明，没有改动原决定。

**遗留（中低）：** 在 `attachRedirectProtection` 中，暂停的请求既没有 `redirectedRequestId`，也不在 `expectedRedirectTargets` 中时，被当作首个请求直接 `continueRequest`，依赖普通 route 再检查。但 Playwright 对重定向产生的请求不调用 route。所以一旦某一跳没被识别出来（例如 Location 与实际请求的 URL 规范化不一致），这一跳就没有任何检查。

- 现有测试覆盖的情形都能识别，目前没有可复现的绕过。
- 修法很小：CDP 层对所有暂停的请求都做一次 origin、方法和资源类型的策略核对（首个请求重复检查也无害），让识别失败时按策略拒绝，而不是放行。

**Live 范围：**

- 两次 Live 的 trace 中重定向次数都是 0。所以 Live 只证明"正常浏览没有被破坏"，没有在真实网站上触发过多跳。
- 远程 Cloudflare 引擎未实测，报告已如实说明。

### 2 显式限额接线（`60e78b9`）：通过，有遗留

- 执行器的模型和操作三项限额改为必填，缺失或非正整数在构造时拒绝。
- Live Runner 和 Web 都给找店传入 20/120/80。
- 每条执行器诊断都写出 `effectiveLimits`。
- **Live 确认：** h001 浏览器模型调用 34 次；第 6 步 TableCheck 找店时，整单浏览器计数已到 18，找店仍在执行。原缺陷不再出现。

**遗留：** 指令要求对生产代码中其他数字默认值"逐项判断，显式传入或说明理由"，实际没有做。仍存在的有：

- `restaurant-agent-loop.ts` 第 160–162 行：`maxSteps ?? 12`、`maxRejectedActions ?? 3`、`timeoutMs ?? 30_000`；
- `restaurant-execution-router.ts` 第 217–218 行：`?? 8_000` / `?? 20_000`；
- `browser-task-executor.ts` 第 1255、1277–1278 行：`maxAutomaticElapsedMs ?? 300_000`；
- 事实读取的 4/24 直接写在 `native-read-composition.ts` 中，不在共享配置里。

目前 Runner 和 Web 都显式传入了前三类，所以对 Live 和 Web 的影响是零。但组合测试仍依赖这些默认值（例如拒绝上限落到 3，而 Live 是 5），这正是 T1 要消除的漂移，已并入 T1 第 1 项。

### 3 无可执行路径与时限的诚实结束（`f759c34`）：通过

- 循环在模型提议之前检查额度：整单剩余模型调用为 0，或共享浏览器额度耗尽，就由系统以 `NO_PROGRESS` 业务结束。
- 校验器对搜索、查位和事实读取返回 `READ_BUDGET_EXHAUSTED`。
- "已执行但失败"不再清零无进展计数，与被拒共用上限（Live 中为 5）。
- `TIMEOUT` 改为业务结束。
- 业务结束仍先交付已合格的候选（`terminate` 第 542–560 行）。
- **证明：** 用 P1-G2 h001 第 6 步之后的真实状态重建（状态哈希与原轨迹相等）。修复前新增 12 次提议，修复后 0 次，直接 `NO_VERIFIED_RESULT`。系统类反例 15/15 通过。
- **Live 范围：** 两次 Live 都没有走到系统结束分支（h001 是 Agent 自己 `END_READ`）。这一项的证明仍是离线真实状态和 L1。

### 4 失败码类型与 evaluator@28（`35b6bf0`）：通过

- 失败码改为类型联合。分类表用 `satisfies Record<RestaurantFailureCode, "SYSTEM" | "BUSINESS">` 穷尽；新增码不分类就编译失败，有日志证明。
- 外部未知码在边界规范为 `AGENT_EXECUTION_FAILED`，按系统处理。
- `noVerifiedResult.termination` 结构化，State@15。
- evaluator@28 能识别系统发起的 `READ_ENDED`。旧产物没有补字段冒充通过，新旧评价并列。

**说明（不是缺陷）：** Agent 自己结束的无结果，@28 的 `COMPLETION_OUTCOME` 仍是 NOT_EVALUATED。原因是没有见证，评测器无法独立判断"确实没有"。这是 E1 要用见证和校准集解决的问题。

## Live 复核

| 用例 | 运行结果 | 独立核验 | 复核归类 |
| --- | --- | --- | --- |
| h002 东银座 周六 18:30 ×2（原版） | Ginza Sushi Sendou，390 m，Tabelog；25 次模型调用，208 秒 | 交付后约 0.1 秒 GET：10/17、2 人，selection 中有 18:30（本人读原始响应确认） | **QUALIFIED_DELIVERY，无 S0** |
| h001 涩谷 omakase 10/16 19:00 ×2（用户指令改明天，不是 Gold 原版） | 0 交付，Agent 第 11 步 `END_READ`；47/50 次模型调用，474 秒 | 无见证 | **HONEST_NO_RESULT，可行性未知** |

h002 自动评价仍是 UNKNOWN，原因与 P1-F 相同：条件措辞不同（"first-date restaurant"对"good for a first date"）。这要靠 E1 的等价表解决，不是这次的问题。

### h001 发生了什么（读原始 result.json）

| 步 | 动作 | 结果 | 用时 |
| --- | --- | --- | --- |
| 1 | Tabelog 找店 | 只找到 1 家：Sushi Teppen | 36 秒 |
| 2–3 | Teppen 查位、读事实 | 10/16 不可选（`DATE_NOT_SELECTABLE`） | 27 秒 |
| 4 | Tabelog 找店 | 执行失败（`AGENT_EXECUTION_FAILED`） | 57 秒 |
| 5 | Tabelog 找店 | 0 家 | 2 秒 |
| 6 | TableCheck 找店 | 超过 90 秒的单来源时限（`BROWSER_TIMEOUT`） | 92 秒 |
| 7 | Google 找店 | 37 家，其中包括 Sushi Matsumoto Shibuya | 5 秒 |
| 8 | 3 家 Google 候选查位（经来源解析） | 3 家都超时 | 3 分钟 |
| 9 | 重复查位 | 被拒（已查过） | — |
| 10 | 再查 3 家 | 整单剩余额度留给交付，未执行 | — |
| 11 | `END_READ` | 如实无结果，列出已查和未查 | — |

要点：

- **额度接线缺陷确实修好了**，找店在浏览器计数超过 12 之后继续执行。
- **新的卡点在效率：**
  - Tabelog 对 "omakase" 只找到 1 家，而 KF-H001 当时找到 3 家。这是检索词问题，属于第二阶段第一项。
  - TableCheck 找店和 Google 候选查位都在超时上浪费了大量时间。
  - 一次请求用掉约 8 分钟和 47 次模型调用，仍没查到 KF-H001 中已知有位的店。即使交付成功，这个时长作为产品体验也不可接受（S3）。
- **只有见证能判断是 CAPABILITY_MISS 还是 HONEST_NO_RESULT。** 现在补见证还来得及：10/16 19:00 还没到，GET 只读、不调用模型。有位一般只会随时间减少，所以稍后的 GET 显示有位，基本说明运行时也有位。建议立即对下面几家做一次四参数 GET（10/16、2 人、19:00）：
  - Shibuya Sushi Sen 13275802；
  - Shibuya Sushi Matsumoto 13261619；
  - Sushi Tokyo Ten 13225919；
  - Sushi Teppen 13308491。

## 用量

- 本批新增模型 72、Google 业务 4、正式 Live 2，环境重跑 0。
- 累计 1086/1500 模型调用、正式 Live 39。

## 并入 T1 的事项

已写入 `.eval-artifacts/t1-assembly-20261015/codex-instruction.md`：

1. 第 1 项（统一组装）加入上文列出的剩余隐藏默认值，以及事实读取的 4/24。
2. 第 2 项（浏览器门禁）：2 个一直失败的 native dynamic Tabelog 用例要修好，或者按测试退役标准删除并说明理由。不能以"既有失败"长期留在必跑门禁里。
3. 新增一小项：Guard 的 CDP 层对所有暂停请求做策略核对，识别失败按策略拒绝；用真实 Chromium 测试证明。
