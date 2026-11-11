# G4 日文名四家定向实测：Runner 启动中断

- 状态：STOPPED / ORCHESTRATION_INTERRUPTED，交复核；不是完成报告。
- 时间：2026-10-31，维也纳 CET（UTC+1）。
- 污染状态：已暴露开发材料；本次是 4 家定向公开 GET，不是新一轮 37 家通过率或 Clean Baseline。
- 产品候选：`da452626874c4740954431ee26116b257dd67b9b`；工作分支 `codex/feat-phase3b-g4-japanese-name-wiring`。
- 产品、身份规则、排序、4+1 名额、查位、响应绑定、Prompt、State 均未改。本批未合 main。

## 结果与首个阻断

已完成 robots、Google 同 ID 日文名、Beef 日文首屏和一个产品排序选中的详情，共 4 次 GET，全部 HTTP 200、正文完成，没有网络失败。随后离线身份前缀 Runner 在构造产品执行器时抛出：

```text
TypeError: Explicit positive browser limit required: maxModelCallsPerCandidate
src/infrastructure/browser/browser-task-executor.ts:292
```

错误发生在 `evaluate-case.mjs:47–49`，身份读取之前。外层 Runner 把“真实模型 0 次”错误地写成了内部构造参数 0；该产品接口要求正整数。这是我编写 Runner 时的配置错误，不是 Google、Tabelog 或网络故障。传输 self-test 没有覆盖产品执行器的实际启动，因而漏检。

按用户“任何一步偏离上述规则就停下报告，不补救性追加请求”，已经停止，没有读取 KNOWN-DETAIL-01 至 08，没有重试四次已有请求，没有改冻结 Runner 或解除 STOPPED。下一步只提出[外层 Runner 修正方案](repair-proposal.md)，未实施、未运行。

`evaluation-runner-error.json` 保留退出码 1、消息、产品位置、Runner SHA 和中断边界。原 stderr 出现在工具输出中，没有重定向成原始日志；JSON 明确注明消息从当时 stderr 转录，未为了补日志重跑。没有生产身份结果文件；不能把这次启动失败当作有效业务红灯或错误接纳反例。

## 已执行请求与冻结顺序

每次先写账本与 started 记录，再发请求；manifest 及其依据先提交。响应原文另外冻结，原件未覆盖。以下均为 CET：

| 请求 | 请求前冻结提交 | 开始 | 收到响应头 | 正文完成 | 状态 / 字节 | 前次结束至开始 |
|---|---|---|---|---|---|---|
| robots | `7760a868` | 05:42:40.326 | 05:42:42.621 | 05:42:42.624 | 200 / 2,810 | — |
| Google 日文名 | `bac7e06a` | 05:43:12.722 | 05:43:13.792 | 05:43:13.793 | 200 / 144 | 30.098 秒 |
| Beef 日文首屏 | `a0894468` | 05:43:43.900 | 05:43:46.514 | 05:43:47.050 | 200 / 134,680 | 30.107 秒 |
| Beef 详情 1 | `28c34bb8` | 05:44:17.162 | 05:44:19.036 | 05:44:19.666 | 200 / 163,190 | 30.112 秒 |

robots 原文保存于 `requests/robots.body.txt`，以本批如实标识的 User-Agent 核对默认组；批准范围的英文搜索与详情允许。`robots-policy.json` 保存核对结果。只读取这一次 robots；不计 14 次网站额度，**计入共享公开 GET 账本 1 次**。

Google 只发送用户批准的 URL，字段掩码 `id,displayName`。返回 ID 与输入 `ChIJAQDkh0mLGGARbfy8WZ_dfIw` 相同，原文非空：**ビーフキッチン 中目黒本店**，实际语言码 `ja`。产品 Google 客户端对这份已收到的原文做本地注入校验，没有第二次 Google 请求。

Beef 首屏 URL 来自产品 `tabelogDiscoveryPack.availability.buildRequestUrl`，逐字使用上述名称，完整 URL、生成依据与原文 SHA 在 `02-beef-search.manifest.json`。本次首屏只观察到一个门店链接，按现有产品排序选择：

```text
https://tabelog.com/en/tokyo/A1317/A131701/13054178/
Beef Kitchen Nakameguro honten
```

选择前未读取 Gold，没有按认证 ID 直达；`beef-selection.json` 与 `03-beef-details.manifest.json` 保存来源页面、顺序及名额依据。原前缀没有详情占用，剩余上限 5；实际只取来源观察到的 1 页，未补造其他候选。`04245362` 冻结该详情原件后，身份 Runner 才启动并失败。

四份正文 SHA-256：

| 原文 | SHA-256 |
|---|---|
| robots.body.txt | `126cafe6a1c8758c1d015f1a63921702074f922eadb2586cec34e69b0677947f` |
| google-name.body.json | `8833792d9143bc5b0145fe511aee0a2b4d2f997b97b3652f808e426c4788bc36` |
| beef-search.body.html | `c0884d502236cf32b43ee7811df7fff6080c7b61f52695d43b6be5d8e4cdbe01` |
| beef-detail-1.body.html | `78c241f8f3be1d9350b1cc3fa78c408ea40c748d0c7ff24606ef90913e96c95a` |

`requests/*.result.json` 保存完整 URL、开始/响应头/正文完成时间、20 秒期限、状态、字节数、SHA、响应头和失败字段。正文按 fetch 得到的字节原样保存，表示方式明确标为 `FETCH_DECODED_HTTP_BODY_UNMODIFIED_BYTES`；本次响应均未带 Content-Encoding。四次均无失败原因或底层错误码，不归类为超时、连接错误、限流或慢导航。

## 四家逐项范围

下表原名来自保存的 Google 原始候选；片段来自旧模型原始输出，仅计划回放、没有新增模型调用；日文名来自同一 Place ID 的 Google 原文。**原名与片段的产品身份前缀本批尚未执行**，不能以旧材料冒充本次路径已经走完。

| 样本 | 原名 → 片段 → 日文全名（来源） | 本批首屏 / 详情与名额 | 身份结论 |
|---|---|---|---|
| nr-007 Beef | `Wagyu beef Yakiniku Beef Kitchen Nakameguro` → `Beef Kitchen Nakameguro` → `ビーフキッチン 中目黒本店`（新 Google 原文，ja） | 新日文首屏 1 页，包含认证店；新详情为上列 13054178，采集 1/5；产品身份读取 0 | **未评**：身份前缀启动前中断 |
| nr-008 Kappo Sancho | `Shibuya Kappo Sancho` → `Kappo Sancho` → `割烹 三長 渋谷`（保存的同 ID Google 原文，ja） | 新首屏与详情均 0；KNOWN-DETAIL-01 未请求；本批累计身份详情 0/5 | **未评**：停止后未开始 |
| nr-019 T | `T nakameguro` → **历史片段输出未保存，不编造** → `T 中目黒`（保存的同 ID Google 原文，ja） | 新首屏与详情均 0；KNOWN-DETAIL-02 至 05 未请求；本批累计身份详情 0/5 | **未评**：停止后未开始；既有第 6 位缺口保留 |
| nr-025 Sumi Sushi | `Sumi Sushi Shibuya` → `Sumi Sushi` → `渋谷 鮨墨`（保存的同 ID Google 原文，ja） | 新首屏与详情均 0；KNOWN-DETAIL-06 至 08 未请求；本批累计身份详情 0/5 | **未评**：停止后未开始 |

Beef“首屏包含认证店”只在停止后将已冻结的观察 ID 与旧 Gold 事后比对得到，Gold 没有回流到查询或详情选择。其余三家的旧日文首屏属于此前保存材料，本批没有产生新的首屏评分。

第三词实际贡献接纳：**未评**。实际生产身份接纳输出为 0 份；正确数、未接纳数及错认指标均未评，不声称 0/4 失败、0 错认达标或任何新的 37 家通过率。网络失败为 0，编排错误导致 4 家未评，不能列为环境失败。

## 调用与等待

| 项目 | 本次实际 / 授权 | 共享累计 |
|---|---|---|
| 网站 GET（不含 robots） | 2/14 | — |
| robots GET | 1，14 次之外、共享计 1 | — |
| 评测公开 GET | 新增 3 | **247/260**，剩余 13 |
| Google | **1/1** | 12 |
| 真实模型 | 0 | 171/1,000 |
| Full Live / 环境重跑 | 0 / 0 | 0 / 0 |

相邻请求结束到下一次开始分别为 30.098、30.107、30.112 秒，合计 **90.317 秒**（含本地编排，不冒充纯 sleep 的精确计时）。四次请求传输耗时合计 **9.023 秒**；从首次开始到最后结束为 **99.341 秒**。报告整理与中断诊断不计入请求耗时。

四次请求均 GET、无 Cookie、redirect=manual、不重试、20 秒期限。没有 3xx、429 或连续网络失败，没有请求跳转目标、预约、登录或确认页。取得页面的本地渲染禁止脚本和外网资源；本次未启动预约流程或运行 Live。

凭据只在单次 Google Runner 子进程由 Node `--env-file` 加载，未独立读取文件，未打印、复制或暂存文件或密钥；`credential-authorization.json` 仅记录路径、范围与“已加载”。其余请求和离线整理未加载凭据。

## 四层评价与验证边界

1. **用户目标**：四家完整生产身份路径与第三词收益未完成，NOT_EVALUATED；首个阻断是外层 Runner 构造参数错误。
2. **完成/结果**：没有生产身份 result；仅完成来源采集。保留启动失败证据，不把缺结果解释为“未接纳”。
3. **过程与声明安全**：所捕获四次请求的域名/路径/方法、额度、时距、冻结依据和原件 SHA 经独立文件/Git 审计通过。产品身份声明与错认指标未评，未用“保守停止”替代 S0 声明证据。
4. **资源**：逐次先记账；487 条旧账目逐条保持，新增 4 条唯一记录，当前 491 条。Google 1、网站 2+robots 1、模型/Live 0；未超限，无中断后追加请求。

本次[审计结果](audit-stop.json)确认 740 项冻结 SHA、170 份既有接线 artifact 原字节未变；产品源码、scripts、web-skills 与配置相对 `da452626` 无变化。审计只读取本地文件/Git，没有执行评测或发出网络请求。审计脚本初次运行读取 oracle metadata 的键名错误，修正本地审计代码后通过；这不是产品运行或修复绿灯，不涉及冻结 Runner 改动。

`self-test-final.log` 的本地 HTTP/纯规则检查通过：不跟 302、无 Cookie、响应头前/正文中两种截止、白名单规则；来源请求 0。它不证明身份 Runner 能启动，本次失败正是该覆盖缺口。五门禁与严格 G2 **本次未重跑**：无产品变动，复用已复核 `da452626` 的 1271/1271、Chromium 186/186、严格 G2 12 页记录；不把该历史绿灯当作本次定向实测通过。

## 交付与下一步

本次证据与 STOPPED 状态推送工作分支，暂不合 main。修正提案已具体列出构造参数、真实模型 0 次约束、try/finally 清理、离线完整前缀预检和恢复范围：复用 Beef 已保存原件，额外 Google 0、模型 0，最多继续已批准的 8 个详情 GET。尚未修正或请求这些页面，待用户/复核者决定恢复。
