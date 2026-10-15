# 第一阶段签收后的加固批（P2-0）

第一阶段已于 2026-10-15 签收。签收记录 `.eval-artifacts/p1-g-20261012/phase-1-signoff-20261015.md`、P1-G 复核 `.eval-artifacts/p1-g-20261012/independent-review.md`、Playbook 1.8 均已由复核者提交到本分支（提交信息注明 "independent review artifacts"）。开始前先 `git pull --ff-only`；如果本机有未推送的提交导致无法快进，先 rebase 到远端，不要覆盖复核者的文件。

本批修四项通用缺陷，其中三项来自签收复核和 `b55e91c` 的代码复核。各项单独提交，每项都必须**先在离线复现为红灯，再修复**（测试方法复核的规则）。不改 Gold、变体、见证，不放宽任何交付资格条件，只读边界不变，不推送。

## 1 Guard 多跳重定向（最优先，任何预约相关工作之前必须完成）

**问题**（`reviews/P1-F-EVAL-TEST-P0-REVIEW-20261012` P0-2，10/12 在真实 Chromium 上复现）：

- `playwright-read-network-guard.ts` 第 195 行用 `route.fetch({ maxRedirects: 0 })` 取回 3xx 后原样 fulfill，浏览器随后自己跟随重定向。
- Playwright 不会为重定向产生的请求再调用 route handler，所以 Guard 只看到第一跳：
  - `A → A/hop2 → B` 能到达未放行的 B；
  - `A → /public-hop → /account/delete?action=confirm` 能到达敏感路径。
- `playwright-read-network-guard.test.ts` 第 154–170 行用假 route 模拟"重定向后会重新进入 handler"，与 Playwright 的真实行为不符。

**要求：**

- 重定向链中的每一跳在**发出请求之前**都要按现有的 ADR-0036 策略和已审核规则检查，任何一跳不允许就拦下。文档、XHR/fetch、静态资源同样处理。
- 实现方式由你调研决定。可选的路线包括：
  - Guard 自己逐跳取回并校验；
  - 遇到 3xx 时把重定向交给执行器，校验后重新发起导航；
  - 使用 CDP 层面的拦截。

  不管选哪种，都要说明页面 URL、相对链接和 Cookie 语义是否保持正确。
- 不修改放行策略本身，不新增放行规则。如果需要改变 ADR-0036 的应用方式，写补充说明，不改写原 ADR。
- **测试必须在真实 Chromium 上跑**（本地服务器提供多跳链），并删除或改写错误的假 route 测试。至少包括：
  - 两跳到未放行来源：拦下；
  - 经公开路径跳到敏感路径：拦下；
  - 全部在放行范围内的多跳链：正常到达，页面 URL 正确；
  - 子资源重定向到未放行来源：拦下；
  - 重定向循环或超过跳数上限：有界失败。
- 运行记录（Recording）要能看到每一跳。

## 2 找店阶段的模型额度接线（复核者读代码确认）

**问题：**

- 浏览器执行器每次请求模型前，检查整单共享计数 `budget.totalModelCalls` 是否达到 `min(options.maxModelCallsTotal ?? 12, budget.maxModelCalls)`（`browser-task-executor.ts` 第 495–503 行）。这个计数整单只清零一次（`restaurant-agent-loop.ts` 第 167 行）。
- 查位和事实读取拿到了 Runner 的 120，但找店的执行器（`native-restaurant-search.ts` 第 286 行）只收到 `maxOperationsPerCandidate`，于是落到默认值 12。
- 结果：整单浏览器调用累计到 12 次以后，所有新的搜索都在第一次请求模型时失败。P1-G 和 P1-G2 的 h001 都停在 12。
- 同类问题：每来源单次找店的上限也落到默认值 6（`maxModelCallsPerCandidate ?? 6`），而不是配置的 20。
- `runCeilings` 记录的是 120 和 20，与实际生效的 12 和 6 不一致。

**要求：**

- 所有组装入口（Live Runner、`local-web-server.ts`、其他 Runner）都把找店、查位、事实读取各自的限额显式传入。
- 删除 `BrowserTaskExecutor` 中限额的隐藏默认值（`?? 12`、`?? 6`、`?? 24` 等），改为必填，缺失时在类型检查或构造时报错。同时修改所有调用方，包括 `tabelog-browser-availability.ts` 第 162 行、`tablecheck-browser-availability.ts` 第 251 行无参构造的执行器。
- 运行记录写出各阶段实际生效的限额。
- **先红后绿：** 组合测试走与 Live 相同的组装入口，安装同样的 Guard 和网络策略。构造"查位等已累计超过 12 次浏览器调用后再找店"的情形，现在失败（红），修复后能继续找店（绿）。整单 50 次的总上限保持不变。

## 3 没有可执行路径或超时时，诚实结束

**问题**（P1-G2 h001 `d808d9f3`，以及 `b55e91c` 复核）：

- 找店额度耗尽后，Router 把 `BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED` 转成 `SEARCH_FAILED` 观察交回 Agent（`restaurant-execution-router.ts` 第 267–272 行），没有传到循环。`b55e91c` 在循环中新增的预算耗尽分支走不到。
- `END_READ` 又因还有未读的发现入口被拒（PRESENTATION_EVIDENCE_MISSING）。
- "已执行但失败"的搜索清零了拒绝计数。
- 三者叠加，形成"搜索立即失败 ↔ 结束被拒"24 步死循环。
- 循环超时（`TIMEOUT`）仍按系统错误结束为 FAILED（`read-loop-termination.ts`），用户得不到答复。

**要求：**

- 读取路径已经不可执行时，由系统直接诚实结束，不再让 Agent 继续提议。读取路径不可执行包括：浏览器模型额度或整单模型额度耗尽，以及已有的 Google 不可用、预算耗尽情形（扩展 `noExecutableDiscoveryPath`）。
- 已知额度耗尽时，搜索、查位、事实读取在校验阶段就被拒绝，避免先跑十几秒浏览器操作才失败。
- 连续若干步没有新的观察，即"已执行但失败"或被拒，也按无进展结束；"已执行但失败"不再算作进展。
- 有界读取到达整单时限（`TIMEOUT`）改为与 `STEP_LIMIT` 相同的业务结束：有合格候选就按现有规则交付，没有就记为 `NO_VERIFIED_RESULT`。真实的系统错误和取消仍为 FAILED 或 CANCELLED。
- **先红后绿：**
  - 用 P1-G2 h001 第 6 步之后的真实状态（result.json 在 `p1-g2-live` 冻结工作树，脱敏后存成 fixture）：修复前会继续提议搜索（红），修复后在 2 步以内诚实结束（绿）；
  - 超时：修复前为 FAILED，修复后为 `NO_VERIFIED_RESULT`；
  - 反例：服务商拒绝、未捕获异常、授权失败仍为 FAILED。

## 4 失败码分类与结构化结束原因

- 把 `state.failure.code` 和各类失败码改成有类型的集合。`restaurantReadStopIsSystem` 对每个码做穷尽分类，新增码不分类就编译失败。不再用"列表之外默认为业务"的写法。
- `noVerifiedResult` 增加结构化的结束原因字段（终止类型、原因码、是否系统原因），不只写在 `remainingGaps` 的文字里。Schema 版本号按仓库约定递增。
- evaluator 升级到 @28：系统终止产生的 `READ_ENDED`，带结构化结束原因时，按"有范围的无结果"评价 `COMPLETION_OUTCOME`。不把它当作来源已穷尽的证明。
  - 旧产物不重标；
  - 离线对 P1-G2 h001 重新评价，新旧结果并列写进报告。

## 门禁与 Live

- 每项四门禁全绿（typecheck、arch:check、npm test、build）；DEVLOG、TEST-LOG、STATUS 同步。
- 报告写明每项的证明范围：真实 Chromium、L1、真实状态离线复现、evaluator 离线重评。
- 全部完成后冻结新的生产提交，跑 2 次原版 Live 做回归，确认 Guard 修复没有破坏正常浏览：
  - **h001：** 东京时间 17:30 前启动；
  - **h002：** "本周六"成立的任一时间。
  - 配置、外层监测、交付后核验、停止条件与 P1-G2 相同。
  - 新预算：正式 Live 2 次，另加启动后环境重跑最多 1 次（用户批准）。模型调用从 1,014/1,500 开始。
- 汇报写入 `.eval-artifacts/p2-0-hardening-20261015/report.md`，内容包括：
  - 各提交号；
  - 红灯与绿灯日志；
  - 真实 Chromium 重定向测试结果；
  - 门禁结果；
  - 冻结 SHA；
  - 两次 Live 的逐行表与产物路径；
  - 用量。
- 本地提交，不推送，停下等待复核。
