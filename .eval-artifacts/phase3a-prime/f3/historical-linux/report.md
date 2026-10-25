# 停止点3补充：健康 fixture 并发稳定性——停止报告

- 状态：**STOPPED / draft, not integrated；本批完成标准未满足**。已暴露离线 fixture，不是 Live 或 Clean Baseline。
- 报告时间：2026-10-25T11:27:53.454199+01:00（维也纳 CET，UTC+1）。原始宿主/Guest 日志时间保留，不改写。
- 分支：`codex/fix-phase3a-prime-health-fixture-window`。main 基线及本批未变的 main：`0a254f056e19e7207318360a3ec46439950c01a5`；**未合入或推送 main**。
- 实现提交：`23071a8b402d52553f1c1143f2ea046d215eabcb`；五门禁冻结候选：`1d8c7c962b03297278f80c8ebbd83e32b57814ab`；E1 有界诊断输入：`cab01559`。最终报告提交和远端核对 SHA 见最终回复 / `push-receipt.local.json`。

## 本批改动与健康检查验证

仅修改 [live-source-health.test.ts](../../../src/harness/browser/live-source-health.test.ts)：healthy、busy-after-results、forbidden、challenge 使用 10,000ms 窗口；slow-last-snapshot 仍是 1,000ms 窗口、800ms 后启动 220ms 延迟。期望分类、重试等待、403/挑战/繁忙拒绝、快照时间和真实 Guard 断言不减少；失败增加 mode 上下文。没有新增测试或复制历史运行作为新 fixture。

生产 [live-source-health.ts](../../../src/eval/restaurant/agent-loop/live-source-health.ts) 逐字不变，SHA-256 `b8cd458d5c6540354861c7e709b32ac786890f1a3f1a2de0a0770e9807b310a1`，生产 10 秒不改。源范围见 [source-scope.json](source-scope.json)。

原健康 fixture 红灯来自用户 Linux 复核：完整四路套件两次 153/154，期望 waits `[]`、实际 `[300000]`；本机未冒称重新取得旧版随机红灯，[基线](baseline.json) 保留其来源。修后目标健康用例在两平台全部六次完整套件中均通过，包含全部五种模式，但这不能代替整套三连绿。

精确 slow 控制仍有有效红绿：[原实现绿灯](slow-control/unchanged-health.log)、[丢弃截止时已完成快照的反事实红灯](slow-control/drop-completed-snapshot.log)、[摘要及输入 SHA](slow-control/summary.json)。只在一次性副本运行原 slow 场景；反事实确实出现 `CONTROL_DROP_COMPLETED_SNAPSHOT` 与 `ENV_FAILURE`。该定向变体不是完整套件，主工作树生产文件未变。

## 五门禁及完整 Chromium 三次样本

[macOS 原始门禁](mac-gates/gates.json)、[Linux 原始门禁](linux-gates/gates.json)。均使用原 package 命令，Chromium `--test-concurrency=4`，每轮完整 154 项，无 skip、无用例筛选。默认测试两平台最终均 1037/1037。

| 门禁 | macOS | Linux（环境就绪后） |
| --- | --- | --- |
| typecheck | PASS / 0.404158s | PASS / 0.418620s |
| arch:check | PASS / 0.183216s | PASS / 0.223789s |
| 默认测试 | PASS / 22.348283s | PASS / 34.918243s |
| build | PASS / 0.453922s | PASS / 0.366484s |

| 完整 Chromium 样本 | macOS | Linux |
| --- | --- | --- |
| 1 | 154/154 PASS；162.592849s | 154/154 PASS；162.383431s |
| 2 | 154/154 PASS；162.502505s | 154/154 PASS；162.145540s |
| 3 | 154/154 PASS；162.429266s | 153/154 FAIL；161.989294s |

macOS 三次中位数 **162.502505s**，五门禁全绿。Linux 三次观测中位数 162.145540s **包含失败样本，只是耗时统计，不是达标中位数**；第三轮 153/154，因此 Linux Chromium 门禁红、三连绿 **NOT_SATISFIED**。没有继续抽样直到凑齐通过。

全部已执行门禁前后 `git status --porcelain` 均为空，恢复次数 0。Linux 红灯立即结束外层脚本，未执行其最终成功标记；另行 [只读复核](linux-vm/source-check-after.json) 确认 604 项冻结输入和工作树仍未改变。最终文档/证据提交不改已测实现。

较宽真实观察窗口增加耗时：上一批 macOS 单次 94.521591s，本批三次中位 162.502505s，超过早期 F1b 的 150s 目标。本轮没有放宽该历史性能目标，也没有用缩小 slow 时序或筛选用例来降低数字；本批稳定性本身尚未验收通过。

## Linux 独立 E1 失败及有界诊断

第三轮失败是 [read-network-redirect.test.ts](../../../src/harness/browser/read-network-redirect.test.ts:94) 的 `E1 outer body observer captures real Chromium POST bytes independently of Guard admission`，[完整第三轮日志](linux-gates/browser-fixture-3.log)。`page.evaluate` 在约 100ms 内报 `TypeError: Failed to fetch`，没有进入用例 3.25 秒接收延迟；目标健康检查已通过。

按已提交的只读 [观察器](linux-diagnostic/observer.ts) 和 [脚本](linux-diagnostic/run.py)，固定两组、每组四个真实子进程，执行原 E1 文件与原断言。8 次中 6 绿、2 红，非“运行直到绿”；[摘要](linux-diagnostic/results/summary.json)、[红灯2](linux-diagnostic/results/probe-2.log)、[红灯7](linux-diagnostic/results/probe-7.log)。这些是诊断子集，不计入完整 154 项套件，不替代任一门禁。

两次红灯均记录：Playwright 请求 `resourceType=fetch`，浏览器 `net::ERR_BLOCKED_BY_CLIENT.Inspector`；Guard 诊断为 `BLOCKED_METHOD / resourceType=xhr`，本地 fixture 的 postRule 只列 `fetch`。此处同时记录浏览器失败事件和 Guard 既有诊断，未改变准入、请求、响应或断言。原第三轮没有这组逐请求诊断；相同错误在有界重现中具有上述差异，不能冒称已将该请求与原第三轮逐一绑定。结合 Guard 的 Network/Fetch 类型选择，**推断**可能与事件上报/到达先后有关，尚未单独追踪 CDP 事件顺序。

按用户长回合第2节第6条“**一项的范围或验收标准需要改变**”停止实现，保留 Linux 验收红灯。未修改 E1 文件或 Guard。[一行 fixture 修正草案](linux-diagnostic/proposed-e1-fixture.patch) 建议仅把测试 postRule 的 resourceTypes 改为 `fetch`、`xhr`，保留 POST 字段与所有 body 审计断言；**draft / not integrated，未应用、未测试，需先复核其请求类型语义与范围**，[状态](linux-diagnostic/proposal-status.json)。若批准后续修复，仍须重新取得两平台五门禁及完整三连绿；当前结果不能转记通过。

## Linux 环境、可复现性与清理

本机临时下载并校验 Lima2.2.1，原生 VZ 运行 Debian12 ARM64 / Linux6.1 / glibc2.36，4核、6GiB，Node24.4.1、Playwright1.62.1、真实 Chromium151.0.7922.34、普通 UID501。无宿主挂载、SSH agent、代理或 Secret 转发。仅复制完整已提交仓库归档；包含既有回归输入，不是新增产品 fixture。源归档来自 1d8c7c96；Guest 的 `git init` 快照 SHA 与宿主不同，归档 SHA 和 604 项逐文件 SHA 将两者绑定。[环境](linux-vm/environment.json)、[归档](linux-vm/archive-receipt.json)、[运行时来源](linux-vm/runtime-provenance.json)、[冻结](freeze.json)。

官方镜像长连接数次 EOF 后，有限分段拼接并核对官方 SHA512；实际配置只把同一镜像的 HTTPS 传输改为已校验本地文件，[镜像回执](linux-vm/image-download.json)、[冻结配置](linux-vm/linux.yaml)、[实际配置](linux-vm/actual-local-image.yaml)。安装阶段过早对齐时钟导致 apt 拒绝未来 Release，恢复 NTP 后完成安装，未放宽签名/日期校验；正式门禁前再次对齐宿主，关闭 Guest NTP 至所有验证结束，[时钟记录](linux-vm/clock-alignment-before-gates.json)。

首次 Linux 默认门禁因旧静态 DOM 测试硬编码 `channel: chrome`、临时机无此路径而 1036/1037，[保留的失败](linux-precondition-failure/gates.json)。随后只在 Guest 把 `/opt/google/chrome/chrome` 显式链接到已安装的真实 Chromium Headless Shell；版本、目标路径和二进制 SHA 见 [回执](linux-vm/chrome-channel-alias.json)。不是浏览器 mock，也不声称已验证品牌 Google Chrome；源码、断言不改，再从头执行全部门禁。此后默认 1037/1037，完整 Chromium 才开始上述三次采样。

[非特权系统断网见证](linux-vm/network-isolation.json)：父访问本地服务 HTTP200，`unshare -rn` 中 curl7、服务新增命中0。实际回放原四项包含在完整 Chromium 中。无 Live 网络请求。

[清理完成](linux-vm/cleanup.json)：Guest停止删除，临时运行时、4GB源归档、压缩包、镜像分段、SSH密钥及 URL 精确匹配的任务缓存项均已移除；取回日志 SHA 逐项核对，无全局软件安装。无其他工作树或缓存改动。

## 四层结论、边界与停止

端到端：macOS 完整三连绿，Linux 完整两绿一红，整体验收未满足。逐环节：目标健康五模式在六次完整运行通过；精确 slow 仍能检出反事实错误；独立 E1 的浏览器资源类型差异已在原断言下有界重现。严重程度：本批是测试/评测基础设施，未产生真实任务或用户空位、日期、人数、时段结论，不把离线通过报告为当前 Live 能力。归因：健康 fixture 的紧窗口已放宽；全套尚被另一个独立 E1 类型差异阻断，其最终根因/修复未完成。

新增真实模型、Google、餐厅网站、Live、环境重跑调用全部 **0**。fixture 模型、localhost、HAR 与依赖下载单列，不计真实调用。产品层、Prompt、产品 Schema、Guard、共享 Browser、restaurant-search 非测试源、两个站点目录与 source-packs.ts 均未改；src/ 下仅目标 harness 测试有差异；外层验证/诊断脚本与产物另存本批目录。适配器3864、pack473不增加，[统一统计](adapter-lines.json)。

同步 STATUS、DEVLOG、TEST-LOG 和月度索引；仅提交推送工作分支保存复核材料。**main 不合并、不推送；停止等复核**，不得将本批标记完成。
