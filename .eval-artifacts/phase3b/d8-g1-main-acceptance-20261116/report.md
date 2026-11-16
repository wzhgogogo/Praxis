# 冻结 main 后 D8 单次验收：体检阶段停下

**main 已整合；D8 产品会话尚未启动。没有重试、没有现场修复。**

## 1. 结果与版本

`origin/main` 非强制快进到 **dbc2d9c55bb9dd759a17551cbe9c11af6b1073b0**，`ls-remote` 已独立核对一致。源码仍为同一净树；复用该 SHA 已通过的五门禁：typecheck / arch / build PASS，默认1658/1658、Chromium325/325、G6 159/159，0fail/skip；main 新增 `.eval-artifacts/` 为0。

独立证据分支 `codex/chore-seed-release-verification`；本次运行配置/脚本先冻结在 `c0809d2d76b5ff53e6c8f82f50b5158aa6235b27`。账本预先补齐 googleRequests / restaurantWebsiteRequests 两项，且已在新临时副本上通过 source-count 收尾预检；旧账本没有修补或重置。

本次结果：**CANCELLED_BEFORE_LIVE / NETWORK_HEALTH_FAILED**。未产生 D8 交付、B1、G1 回答或产品运行评价；不能给出 QUALIFIED_DELIVERY，也不能声称本次已核验产品 S0=0。

## 2. 实际来源轨迹

- Tabelog 无凭证见证 GET：HTTP200，`exists=true`，2026-11-18 **20:30 JST / 2人**仍有位；响应逐时段B1原样保留，未打开预约表单。
- TableCheck 体检第一轮：**NAVIGATE**，总耗时 **30.139s**；导航阶段 **30.006s**。实际错误是 `page.goto: Timeout 30000ms exceeded.`，并非观测到403。
- 未记录文档 HTTP 状态、脚本 HTTP 状态或主脚本到达证据，不能进一步归因 DNS/代理/403/脚本下载。Tabelog 体检及后续三次体检均未执行。

离线代码核对：体检外层为60s，prepareNavigation也为60s；但 `holdout-health.ts` 的 `navigate(url, {waitUntil:'domcontentloaded'})` 未显式传导航超时，实际被 Playwright 的30s默认先终止。本轮只记录这个内外窗口差异，**未修改任何代码/时限**，也未追加网络探查。

## 3. 独立边界与保护

产品 Live 未开始，因此产品请求边界/S0为未评价，不把“无产品输出”冒充验收通过。已保留见证 HTTP200清洗原响应、网络体检原始诊断、outer-failure、配置/输入/主线核对与账本。三类产品录制标志全开，但因产品会话没有启动而无产品录制，这是启动前取消，不是录制收尾失败。

`final-integrity.json`：主工作区 HEAD/草稿/索引/未跟踪文件、22份旧账本、分流配置前后完全相等；被测源码净树、SHA不变；本轮配置文件哈希无变化。自身凭据扫描0命中。

## 4. 首个偏离、额度与停止点

首个偏离为 TableCheck 首轮体检入口导航超时，发生于 runG6Batch 之前；无 decision/snapshot/HAR 序号可引用，不补造产品轨迹。核心证据：`d8/live/network-health.json`、`d8/live/certificate-1.json`、`d8/live/outer-failure.json`、`live.log`。

实际消耗：**0 Live / 2评估GET / 0模型 / 0环境重跑**。新账本剩余：**1 Live / 6 GET / 50模型 / 0环境重跑**。Live额度未消耗，停止待用户处理；不自动续跑或补跑。
