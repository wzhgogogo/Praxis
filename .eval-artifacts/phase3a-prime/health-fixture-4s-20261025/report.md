# 健康 fixture 4秒复核调整

- 完成时间：2026-10-25T21:07:58.605305+01:00，维也纳CET UTC+1。已暴露离线fixture；不是Live或Clean Baseline。
- 分支：codex/fix-phase3a-prime-health-fixture-window。main基线0a254f05；冻结候选`2e184c2fb1d6b02d3cb49455d97cda30e3603b59`。最终合入SHA见本项`integration.local.json`与总报告。

## 改动、红绿与范围

healthy/busy-after-results/forbidden/challenge窗口从10000改4000ms；slow仍1000ms、800ms后延迟220ms，所有原断言保留。生产10秒实现SHA-256仍为`b8cd458d5c6540354861c7e709b32ac786890f1a3f1a2de0a0770e9807b310a1`，没有生产行为变化。

复用已获复核的[旧性能红灯](../stop3-health-fixture-stability-20261025/mac-gates/gates.json)：10秒窗口中位162.502505s，超过150s；这不是本轮重跑。slow的[正/反事实红绿](../stop3-health-fixture-stability-20261025/slow-control/summary.json)已由用户确认有效，精确时序和生产文件均未变，未额外重复该控制。

E1源文件和Guard保持原样，历史fetch+xhr草案**不采纳**，[复核处置](e1-review-disposition.json)。类型差异可能影响生产合法读取，交对话B/F3审计，已在TEST-LOG登记为已知偶发，未当作无害fixture问题关闭。本轮六次完整套件未实际触发例外。

## 两平台完整三次及五门禁

| 样本 | macOS完整四路Chromium | Linux完整四路Chromium |
| --- | --- | --- |
| 1 | 154/154；102.962288s | 154/154；102.699376s |
| 2 | 154/154；103.002452s | 154/154；102.429711s |
| 3 | 154/154；102.611106s | 154/154；102.636218s |

中位数：macOS **102.962288s**；Linux **102.636218s**，均≤150s。目标健康用例6/6、完整套件6/6；每轮154项，无skip/todo、无过滤、无其他失败。

两平台各跑typecheck、arch:check、默认测试1037/1037、build及上述完整Chromium，五类门禁全部绿。[macOS原始日志/收据](mac-gates/gates.json)、[Linux原始日志/收据](linux-gates/gates.json)。每道门禁前后git status --porcelain为空、恢复0；608项[冻结输入](freeze.json)和外层脚本SHA前后一致。只追加文档/证据后交付，已测源码不再改动。

## Linux方法与证据

原生Lima2.2.1/VZ，Debian12 ARM64、Linux6.1/glibc2.36，4核6GiB、普通UID501、Node24.4.1、Playwright1.62.1、真实Chromium151.0.7922.34。[环境及源映射](linux-vm/environment.json)、[归档SHA](linux-vm/archive-receipt.json)、[配置](linux-vm/linux.yaml)。Guest git-init快照与宿主提交不同，608项逐文件SHA与归档将其绑定。

仅在任务临时目录准备运行时；无宿主目录挂载、SSH agent/代理/Secret转发。官方镜像重定向和一个缓存分段失败日志保留，最终按官方SHA512校验，[镜像回执](linux-vm/download-receipt.json)。NTP仅在安装期启用，测试前对齐宿主并关闭，[时钟](linux-vm/clock-alignment.json)。旧默认静态DOM测试硬编码chrome路径，Guest中显式链接至真实Playwright Chromium Headless Shell，[实际版本/二进制SHA](linux-vm/praxis-followup-chrome-alias.json)，不冒称品牌Chrome验证。非特权[系统断网见证](linux-vm/praxis-followup-isolation.json)：父HTTP200，unshare -rn中curl7、源新增命中0。

临时VM留在本次已授权后续切片内复用，全部完成后统一清理；此处不预报清理完成。没有全局软件安装。

## 四层结论与下一项

端到端：六轮完整套件、两平台时间目标满足。逐环节：正常就绪、后来繁忙、403、挑战拒绝及精确slow均保留原行为检查。严重度：本批不产生用户空位/日期/人数/时段结论，无真实任务或外写；不以离线测试宣称Live能力。归因：只修fixture观察窗口与耗时；E1潜在生产误拒绝仍开放给F3。

产品层、Prompt、产品Schema、Guard、共享Browser、站点目录、source-packs.ts均未改；[统一统计](adapter-lines.json)为3864与473，均不增加。新增真实模型/Google/餐厅网站/Live/环境重跑调用全部0；localhost/HAR和依赖下载另列。

同步STATUS、DEVLOG、TEST-LOG及月度索引，按用户授权合main并推送；随后从新main进入回放URL资格映射，不在本项停等复核。
