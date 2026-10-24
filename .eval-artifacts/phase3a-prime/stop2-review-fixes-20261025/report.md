# 停止点2复核补丁总报告

- 状态：两项补丁完成，按用户授权依次合入main并推送后停下。
- 日期：2026-10-25；时间口径为用户指定CET（UTC+01:00）。
- 依据：用户自包含复核指令；未补造项目中不在Git的复核原文。证据是已暴露fixture/frozen regression，不是Clean Baseline或Live结果。

## 合入顺序与提交

1. F2③：分支`codex/feat-phase3a-prime-f2c-pacing`，受测`d7a3170f42dbdc40b1a1975294e9355bbd76602d`；交付`1a736c880513f106631e3ba1e30db75d1d1c7ab2`。已快进main、原子推送并ls-remote核验，[回执](pacing/main-integration.json)。
2. F2④b：将上述main作为新祖先并保留原623d5587历史，合并`91f630dd60633ec683bbd76dc3587930a11c2b23`，在合并后代码上重放验收。Google补充受测`564ded2ed4a052b5005cedfb2c09f2f307929ba4`；最终main为本报告所属交付提交，精确SHA及最终ls-remote结果另写本地`push-receipt.local.json`并在交付消息报告。

同步基线采用合并以保留旧受测SHA和证据；没有force-push或丢弃旧提交。[历史接线](integration-history.json)。六处文档/账本冲突保留双方记录；本地未推送合并提交曾漏清月度文档及账本标记，已修正并amend。源码无合并冲突，正式验证均在修正后执行。

## 红绿与五门禁

| 补丁 | 有效红灯 → 绿灯 | 默认 | Chromium | 单次秒（默认／Chromium） |
| --- | --- | ---: | ---: | ---: |
| 静态资源豁免 | 两Chromium各20个同源CSS/JS，租约21→1，来源21次访问仍计数 | 1028/1028 | 148/148 | 20.615881／84.814083 |
| Google自动捕获 | 删除fixture手工追加后MISSING_STRUCTURED_RESPONSE → 正式自动捕获后OS断网完整回放同候选/交付 | 1032/1032 | 153/153 | 20.454177／92.368286 |

两项各自typecheck、arch:check、build也全部通过；共10个门禁前后Git status均为空、恢复0。输入和外层脚本先提交，冻结摘要前后匹配，均为单次结果。无端口或浏览器资源冲突。

[F2③报告与重算](pacing/report.md) · [Google捕获与安全控制](google/report.md) · [正式回放](google/validation/summary.json) · [交付摘要](delivery-manifest.json)。

## 结果与边界

- 静态资源不取租约，仍计入每origin请求总数；文档、Guard已准入动态及预检、Places/逆地址API继续共享节奏。统计字段、默认1000ms、两运行和预算不变。
- 正式Google请求URL/方法/原始body和原始JSON响应进入同一标准HAR；请求头、key类query剔除，写前及落盘回读扫描，命中不发布且记安全原因。fixture手工HAR追加已删除。
- 写后扫描拒绝真实磁盘污染，迟到响应不追加；无合格DOM也能留安全结构化响应，Replay仍在不合格页停止。旧recording@4、HAR1.2及Evaluator@34/rubric@30不变。
- 单一自动捕获种子完整5页/4决策回放同非空候选、交付和空位，独立声明及边界S0均ABSENT；删响应和部分录制明确REPLAY_INCOMPLETE，Replay分母仍与Live隔离。

## 额度、保存和待办

本回合新增真实模型、Google、餐厅网站、Live及环境重跑均 **0**。Fixture传输/本机HTTP/HAR与Git仓库操作单列。[账本](../budget.json)。

产品层、共享Browser/restaurant-search非测试文件、Prompt、Schema、Guard规则无改动；站点非测试TypeScript仍3864行，source-packs.ts 473行。[统计](adapter-lines.json)。原主工作区HEAD与9份用户文件保持，[保存核对](preservation.json)。STATUS、DEVLOG、TEST-LOG和月度索引同步。

重算工作情景：6次未来F5 Live＋15回放约22.0分钟；15次全新Live＋15回放约51.3分钟，后者超过当前8次Live额度，仅作规模参照。请求类型拆分是显式假设，均未实测。

严格扫描会拒绝任何匹配的HAR，包括旧缓存中已知的站点公开地图key模式；未新增白名单，[限制证据](strict-scan-limitation.json)。因此F5实际录制覆盖、真实页面是否触发拒绝和一轮耗时仍需后续验证。当前没有恢复旧录制缺失字节，没有把部分回放算成完成。

只合入本次获授权的F2③、F2④b与Google捕获。F3、F5实现/Live、每日监控或任何新增真实模型均未启动。完成推送核验后停止，等待后续指令。
