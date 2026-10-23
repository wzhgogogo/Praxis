# 已复核 near 与条件展示修复：主线合并验证

Evidence status: current merged executable + exposed frozen regression；不是 Clean Baseline，也不代表新 Live 验收。

例01诊断已结束并停下后，已将复核提交 `9de09404612d103b87a85f2a767f61aafdca1725` 合入主线 `4d953731163e922741ea91ccc6c1c47b53f0b0e1`，合并提交 **`09b5d35361cca8f10b967b10cae6c478c6d34df2`**。五门禁及69/5/22全部通过，满足本次授权的主线推送门槛。完成最终证据提交后仅推送 `codex/feat-live-restaurant-read-path`，核对远端SHA后停下；最终推送提交号记录于交付消息。

[诊断完成依据及SHA](merge-prerequisites.json) 绑定诊断分支 `3ec38584555b5271b72b79f954179769e92ff9f6` 的最终报告；两次诊断均已结束，不因本次合并重跑、改分或覆盖。合并只发生5份历史文档冲突，双方记录及索引均保留；源码无冲突。

## 1. 端到端结果与证据边界

本轮没有启动端到端 Live，端到端交付、当前库存与新 S0 声明核验均 **NOT_RUN**，不能从离线全绿推出合格交付。原11份退出产物及例01诊断结果不变。本次可交付结果是经过回归的主线合并，未新增生产改动。

## 2. 逐环节验证

| 验证 | 模式与结果 | 证据 |
| --- | --- | --- |
| 合并内容 | 335份源码/Runner/包配置逐字节核对；修复的6份文件等于复核版本，其余等于原主线，差异0 | [逐文件SHA](merged-source-verification.json) |
| 具名地点与条件展示 | 默认门禁包含保存h-06的真实Native→Google-pack定位交接、near X / X，以及11份Router→Reducer展示回放：原4条菜系支持展示修正，其余9份展示不变；沿用原@33真值 | [默认测试日志](gates/default-tests.log)、[已复核红绿和展示证据](../near-and-condition-display-20261023/report.md) |
| 五门禁 | typecheck、arch:check、npm test **1029/1029**、build、本机Chromium Fixture **138/138**，全部PASS，无skip/todo | [命令与耗时](gates/results.json)、[本机浏览器日志](gates/browser-fixtures.log) |
| 翻月决策 | **69/69**，门槛≥68/69；当前生产解码器读取原缓存真实模型响应，非新模型采样 | [回放结果](regressions/regression-results.json) |
| 选店种子 | **5/5**，当前严格解码与既有独立可接受动作oracle | [同一回放结果](regressions/regression-results.json) |
| 评价校准 | **22/22**，正常声明20/20；两个历史中断声明仍NOT_EVALUATED，越界未知保持未知 | [自动输出先保存](regressions/calibration/summary.json)、[标签后比较](regressions/calibration/comparison.json) |

正式回放冻结提交 **`00ff1fa5e7b65f6fa7da2f3d3137d6a42ad11fee`**：4297项合并代码/既有输入/脚本，SHA-256 **`64139ca0e2d532f2d193e53111dc877f4540ecff492928a06b133671bda241fd`**；独立22校准另冻结815项，SHA **`f111f93ccb6beb5eb9ec4ed66f98822f61687739e8fcf5ec728633378ffa7696`**。两份先提交再运行，结束时逐文件复核未变。旧冻结清单不覆盖；[新冻结](replay-freeze.json) 逐项记录两条已复核分支的代码差异，Gold、缓存响应和评价oracle未变。

## 3. 严重程度与边界

无新生产网站/模型/Live操作，S0–S4不作新Live判定；Fixture和默认套件覆盖既有/新增只读边界。主线TableCheck Guard、source-health与 `/reserve` 拒绝实现逐字节保留，评测器@33/rubric@29、Prompt及Schema未改。校准未评价的维度不冒充ABSENT。

主工作区HEAD、完整dirty状态及9份用户文件字节均保留：[保护核对](primary-worktree-preserved.json)。浏览器套件产生的历史region指标另存并恢复原字节：[恢复证据](gates/side-effect-verification.json)。原始日志保留原样，不为排版删除运行输出。

## 4. 归因与后续边界

本次只合并已复核修复：具名地点不再依赖near字面词；已观察商家菜系字段可与通用food描述相接。原始红绿、来源投影、Router→Reducer及独立@33对照保留于修复证据目录。本轮未发现新的合并回归。已接受行为变化是具名地点进入现有Google半径解析，每次运行多一次Google请求（本轮没有执行）。复核指出的小描述词表仍列作第三阶段F3后续，未扩展本轮范围。

资源增量：[账本](resource-ledger.json)：新模型0、Google0、真实餐厅网站0、完整Live0、环境重跑0；69+5次为缓存响应回放，22次为离线产物校准。没有重启诊断、留出集或预约操作。

## 交付核对

[机器核对](final-verification.json) 汇总门禁、冻结与代码一致性。提交最终报告和原始日志后，以非强制方式推送授权主线，核对远端ref等于最终本地提交，再停下。
