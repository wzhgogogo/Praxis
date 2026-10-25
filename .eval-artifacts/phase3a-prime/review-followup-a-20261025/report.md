# 对话 A：健康 fixture 复核后基础设施收尾

状态：completed / frozen regression；2026-10-25 CET（UTC+1）。全部本地 Fixture/Replay，新增真实模型、Google、餐厅网站、Live、环境重跑调用均为0。以下四项按独立分支顺序交付，最终 main SHA 以本报告提交后的 ls-remote 核对和最终消息为准。

| 项 | 结果 | 分支 | 验证源码 / 已核对 main |
| --- | --- | --- | --- |
| 健康4秒窗口、拒绝E1扩规则补丁 | 完成；健康六次全过、slow红灯有效，E1原样登记交F3 | codex/fix-phase3a-prime-health-fixture-window | 10c6ecc0 / 70db9152 |
| 录制请求URL与最终重定向资格 | 完成；F5槽1原录制系统断网实际越过两个快照，不补造页面 | codex/fix-phase3a-prime-replay-document-redirects | 278302bf / 5aa9394c |
| DECISION_SNAPSHOT_MISMATCH | 完成；三槽原始无DOM决策保留来源flow观察引用；正常DOM仍严格匹配 | codex/fix-phase3a-prime-decision-snapshot-binding | 5e073ae6 / f4d0c719 |
| 每槽退出即独立评价与S0核查 | 完成；单槽/并行父进程接线，真实子进程因果验证与失败边界通过 | codex/fix-phase3a-prime-post-exit-evaluation | ce82a545 / 本报告交付提交 |

健康项原六次154测试证据在 F5 合入前冻结，保留为历史回归；在合入新的 F5 源码后另冻结10c6ecc0，并重新完整运行两平台各3次，作为当前验收：macOS155/155三次101.996769、103.289713、103.933828秒，中位103.289713秒；Linux首轮154/155仅已登记E1，后两轮155/155，三次105.128263、102.399538、102.677879秒，中位102.677879秒。所有健康用例六次全过，slow-last-snapshot精确时序及有效红灯不变，生产10秒不变。见 [健康报告](../health-fixture-4s-20261025/post-f5-main/report.md)。

回放与决策关联两项各有有效红绿和两平台五门禁：默认分别1053、1054全过；macOS Chromium159/159，Linux各158/159，唯一失败均为用户批准暂存的E1 Failed to fetch，保留原始exit1，未扩大postRule或修改Guard。回放原始F5验证在macOS sandbox-exec与Linux非特权unshare -rn下消费2/94页；之后snapshot3 DECISION_SEQUENCE_DIVERGED，仍REPLAY_INCOMPLETE，不把未回放部分算通过或失败。见 [回放报告](../replay-url-qualification-20261025/report.md)、[决策关联报告](../decision-snapshot-binding-20261025/report.md)。

最终退出后评价项两平台五门禁全部绿色：默认1054/1054，Chromium161/161，macOS104.495244秒、Linux104.986921秒。每门禁后净树；被冻结输入/外层脚本各轮均核SHA，未恢复文件掩盖写入。父进程独立检出受控S0反例且不相信子评价，缺产物/核查失败明确未评价；实际Live即时性本回合未新增调用，待下一次获准Live实测。见 [退出后评价报告](../post-exit-evaluation-20261025/report.md)。

站点两目录非测试TypeScript保持3864行、source-packs保持473行。本轮A的修复未修改产品层、Prompt、产品Schema、Guard或站点文件；并行F5合入的既有main内容按健康项重基线报告保留。输入均为已暴露开发/合成回归，不是Clean Baseline；Fixture、Replay与历史Live结论分开。原F5现实目标0/3的局限不因这些基础设施绿灯改变。

专用Lima/Debian Linux VM已停止、删除，专属运行时/镜像/源归档已移除；未改变宿主全局安装或既有浏览器缓存，证据见 [cleanup.json](cleanup.json)。健康项、后续三项的原始红绿、门禁日志、来源SHA和证据清单位于各自目录，STATUS、DEVLOG、TEST-LOG与月度索引同步。

保留事项：E1类型识别偶发交对话B/F3审计；原始F5从snapshot3起的决策序列/后续不可回放页仍不完整；未来Live见证、交付后读和即时评价现实耗时须另获授权。按本轮要求完成后停止，等待复核。
