# Fixed-source test mechanism closure — 2026-09-17

- Status: current offline test-defense evidence
- Baseline: `987c77e`
- Scope: fixed transport/pages and local Chromium fixture only. No paid model,
  Google, Cloudflare, restaurant site, Live/Replay, Gold, Prompt, or product
  request change.

| 补修项 | 修复前反例 | 实际修改 | 正常对照／反例结果 | 剩余问题 | 完成 |
| --- | --- | --- | --- | --- | --- |
| 来源独立与资料判断场景 | 同一 fixture 对象把 Google／TableCheck 的姓名、地址、电话绑死，无法发现跨来源串店 | Google 与 TableCheck 观察拆分；Google-listed URL 仅进入 run-scoped entrance ledger，后续候选仍逐个身份复核 | 地址格式不同且电话不同仍可高置信关联；同电话、不同楼层为 UNKNOWN 且无 offer；A 发现 B 入口时 B 只有高身份复核后可读库存；Plant-forward bistro 经明确标记的 cited model stub 进入真实 fact/read/state 链 | stub 不证明真实模型理解；不覆盖真实网站实体质量 | 是 |
| 覆盖缺口与等待目标 | 未配置 Google details 的错误会被包装，coverageGaps 为空；任意 href/time-slot 会让 wait 成功 | 统一结构化 FixedSourceCoverageGap（source/stage/request/candidate/reason）；Runner acceptance 接收 gaps；waitFor 只接受已配置 selector | 未配置 details、TableCheck 页面与缺失 selector 均记录；配置 404 不记录；必要 gap=BLOCKED/nonzero；可选 gap 只有独立 qualified 结果时可通过 | 真正 provider 网络故障仍由生产 Adapter 归类，不被伪装成 fixture gap | 是 |
| 来源观察时钟 | factory 只接收一次 observedAt，所有随后读取看起来同时发生 | factory 接收 clock.now()；Google、website、TableCheck observations 各自取时；样本采集时间单列 | t1 search、t2 facts、t3 availability 有各自 observedAt；availability display expiry 从 t3 推导，sampleCapturedAt 仍是历史值；冻结业务钟仍不能冻结外层 deadline | 未离线证明真实站点时钟或库存新鲜度 | 是 |
| 正确停止的统一验收 | acceptance 仅能把所有非正例压为 SUCCEEDED/TERMINAL no-result | expectation 声明 execution status/loop/phase/reason、必要 evaluator dimensions 和 coverage；completion 从实际 evaluator result 导出 | qualified、verified no-result、needs-input、cancelled、budget/deadline 各有正负配对；另以真实受控 abort 与模型调用上限产生 artifact、保存 evaluator sidecar 后验收，正确停止为 PASS/NOT_COMPLETE，互换停止期望必失败 | 真实模型何时提出恰当问题仍需模型质量评估；离线预算不证明真实模型成本 | 是 |

## Commands and evidence

- Focused: node --test --import tsx fixed-source source/offline/execution/acceptance tests — **23/23 PASS**.
- npm run typecheck, npm run arch:check, npm run build — PASS.
- Sandboxed npm test — 395 pass / 15 failures, all local 127.0.0.1 listen EPERM; authorized local rerun — **410/410 PASS**.
- npm run test:browser:fixture: sandboxed run failed before test setup because macOS denied Chromium Mach-port registration. The authorized local run streamed 18 passing synthetic Chromium cases, including the real requested-update wait and missing-ready-marker timeout controls, but this host wrapper did not emit the runner's final aggregate line. The targeted fixed-source waitFor assertions are deterministic offline adapter tests; local browser fixture remains a separate runtime gate.

## Deliberate limits

These controls do not establish real-model free-text interpretation, factual
freshness, website compatibility, anti-bot behavior, provider reliability,
search exhaustiveness, or any Live inventory claim. Historical red Live/model
artifacts are unchanged.
