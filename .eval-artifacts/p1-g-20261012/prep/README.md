# P1-G 冻结运行准备

Evidence status: exposed development evidence / current frozen execution preparation; not independent signoff.

生产：`9b342871c514f963be5386e889c1542b1e6ce020`。
宿主机干净工作树：`/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing`。
P1-F 冻结树保持 `73bfca588ad5007a4a9326c8c13a958718898f1c`，不得操作。

所有外层命令在 P1-G 工作树执行。真实时间仅东京 2026-10-13 09:00–12:00；每次须留够500秒。脚本冻结见 `scripts/freeze.json`，启动前核对全部 SHA、HEAD、工作树、账本和本线程最新指令，确认没有运行进程。

先执行：

```sh
node --import tsx /Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-g-20261012/prep/scripts/certify-witnesses.mjs
```

只读三个已批准的 Tabelog 四参数 GET。至少一家18:00才启动；无一家则停止整批。生成的 `witnesses.p1g.json` 有效24小时；原见证文件不修改。已认证不重复执行。

随后依次运行下列四个 case，命令格式：

```sh
node --env-file-if-exists=/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.env --import tsx /Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.eval-artifacts/p1-g-20261012/prep/scripts/run-p1g.mjs <case>
```

1. `p1f-novel-kichijoji-tempura-20261020`：原样rev2，重新认证见证。
2. `h001`：Gold@7，无见证要求。
3. `h003`：Gold@7，无见证要求。
4. `h004`：Gold@7，无见证要求。

每例500秒、50模型、40Google，record-browser、record-decisions、no-proxy；原生发现、nearby圆心35.6697/139.7670，默认1000米。每次外层先 GET DeepSeek `/user/balance`，只接受 `is_available === true`，保存原始响应，不保存密钥。失败不启动模型，不计正式Live或环境重跑；每例preflight最多3次，两次至少15分钟。3次均失败记ENV_FAILURE，不擅自无限重试。

启动后的环境重跑必须先记录明确证据到该case的 `environmentFailureEvidence`，再传 `--environment-retry`；每例最多一次、全批最多两次。能力失败不重跑，额度失败不作启动后环境重跑。正式Live起点32、四次上限36，加环境重跑总计最多38。账本 `formalRuns` 区分正式次数，`live` 包含启动后环境重跑；模型起点799/1500，Google已确认16，历史完整累计UNKNOWN。

每次运行后外层立即执行交付后四参数Tabelog GET；展示时段未出现或无法核验则停止、不归因。TableCheck仅保留原始trace。吉祥寺零交付在十分钟内抓三份见证原始GET，随后evaluator@27。每次核对finish与原始产物，更新report，不能用缺失结果伪称0调用。

Guard非预期放行、任何表单提交、预约/确认/支付点击或个人信息输入立即停止；G1入口GET及审核的只读日历POST正常。生产Guard/执行器与P1-F外层监测沿用；多跳重定向仍是已知边界缺口，未在本批修复，不能声称所有只读边界已验证。

外层差异仅为本批支持的case、冻结路径/预算/时窗/新见证、额度检查，以及直接阻断核验的零交付和preflight结果识别。`observe.mjs`、`post-delivery.mjs`、已审核规则原样复制。产品、Prompt、Schema、Gold、变体原文均不改。

离线检查：两类case空跑、展示绑定与selection正反例、额度true/false/类型错误/503反例通过，真实网络0。四门禁复用冻结生产B提交的本批最终绿灯853/853，外层没有新增生产代码路径。真实认证/Live仍未运行。

本线程续跑心跳：`p1-g-10-13-live`，北京时间10/13 08:00。完成或停止后暂停心跳，更新报告、DEVLOG、TEST-LOG、STATUS和月索引，仅本地提交，等待独立复核。

Latest user override: execute immediately on 10/12. Heartbeat PAUSED; approved outer window UTC2026-10-12T06:47:45Z-09:47:45Z, new hashes in freeze.json. All previous run/verification/budget/stop rules continue.
