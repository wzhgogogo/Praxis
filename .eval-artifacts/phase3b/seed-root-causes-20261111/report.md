# 07 / D02-V 根因修复（2026-11-11 CET）

状态：工作分支候选 / not integrated。基线 `ead28945`，包含 `bb55aa4d` 体检修补；最终产品源码与模型验证冻结 `6ca80a4c`。未合入 main。

| 项目 | 红→绿与限制 |
|---|---|
| 07-r2 批处理 | 原始三店组件：第三店 GOOGLE_NETWORK_FAILED 时，前两店从 UNKNOWN 恢复为 COMPLETED，保留各自 factChecks / evidence，可进入交付判定；第三店仍 UNKNOWN。取消与致命错误边界保持。 |
| 07-r1 决策 | 仅 Prompt。第一轮 Prompt31 仍选继续查位，失败原样保留；Prompt32 对原 #32 输入选择只核对已有 AVAILABLE 的 Arai-ya 的事实。没有代码覆盖模型动作。 |
| D02-V 观察复用 | 新增 confirmedFields 算已验证进展；复用同页已稳定初始观察与完成快照，原完成门槛/45秒不变。13287727 真实 DOM/HAR/决策组件旧版45秒超时→新版44.508秒，确认 2026-12-10 / 8人 / 20:30 AVAILABLE；新版5次控件扫描、5次快照，消除初始及已确认日期后的重复采集。Sumika 原响应仍为2人，不冒充8人完成。 |
| 地区发现说明 | 仅 Prompt：location 和 retrievalExpression 都是目标。原 D02 #8 观察的真实模型选择 More filters，理由为寻找菜系检索入口，没有过早 COMPLETE；**完整应用菜系未验证**，原严格 FILL/CHOOSE 检查仍为 false，不改写评分。 |

回放边界：真实录制已暴露开发材料，使用原 DOM、HAR 和动作；序列化 DOM 没有原网页监听器，以录制快照驱动转换，部分 `#` 链接只从原观察恢复。不是整页 JS/网络重放，也不是新 Live 或新的 Guard 验收。原最后控件扫描被取消，时间投影采用同店紧前一次实际541ms扫描；因此44.508秒是组件计时结果，不能当作新的真实网站耗时。

验证：typecheck、arch:check、build、默认1590/1590、Chromium281/281、G6 158/158全部通过；D4/D8回放保持。严格G2五项测试及12个真实录制变异场景全部PASS。新增事实批处理、确认进展、D02-V红绿日志均保留。相对ead28945产品scan-hardcoded新增命中0，未增加豁免。产品只改六文件，详见 changed-source-files.txt；必要的名称核对评测改用既有 identityOnly，退役依赖额外快照触发异常的旧停止钩子，原安全断言保留。

真实调用：0 Live、0 网站GET、3次纯模型（deepseek-flash；07两次，D02一次，≤10）。账本原有278条逐条不变，只追加3条；累计 Live36/36、GET185/220、模型2328/2800、环境2/4。余额0 Live /35 GET /472模型；旧R2账本哈希不变。凭据未进入产物，原录制和原失败结果未覆盖。

证据：accepted-gates/，batch-red/green.log、progress-red/green.log、d02v-replay-red/green.log；相邻 seed-root-prompts-20261111/ 与 seed-root-prompts-agent-refinement-20261111/ 保存两次冻结及全部模型结果；ledger-snapshot.json、budget-audit.json 保存记账核对。提交推送工作分支后停下，等复核。
