# 3b B 批次3：G1核心整合收据

时间：2026-10-27T15:59:14.915329+01:00（Vienna CET，UTC+1）。Evidence status: current executable core / Agent与Web尚未接入。

G1核心重放与ADR批准状态更新完成，五门禁通过，按本批授权合入main。工作分支`codex/feat-phase3b-g1-integration`；原已复核`codex/feat-phase3b-g1-core`保留e4829a58，不强推。实际main/远端SHA以Git交付回执核对。

## 批准与范围

用户批准revision0.2原文SHA-256为`96b0f371fbc2479fc80d86f51873884ebbf3e597efcc86806bf4cb8887af8e7c`，修改前已匹配。严格依指令只改[ADR0046](../../../docs/decisions/0046-observed-actions-and-source-quoted-answers.md)的Status一行，改为Accepted并在同一行写批准日期2026-10-27。旧Approval及正文中的“待批准”等历史措辞原字节保留；当前批准状态以Status和本条用户批准为准，不借机改正文。

13个既有核心/证据提交重放到main/daba2ef0，7份事实源码全部与已复核e4829a58逐字节相同，无源码冲突。只合并双方历史、ADR索引和共享账本。运行期间main推进319cb9a5（QA最终确认及TableCheck材料）；可执行src/scripts/web-skills、package/tsconfig字节不变，随后合并这些记录并验证654份冻结输入仍完全相同。[范围证明](replay-scope.json)／[合并后核对](core-closeout.json)。没有读取或哈希答案文件；Git保留其他对话提交的文件，不对答案内容作检查。

账本14个id并集，来自e4829a58与319cb9a5的每条原记录逐项相同；publicGET与evaluationPublicGET是同一个40次额度，保留原条目，累计不重复相加。新增真实模型/Google/餐厅网站/Live/公开GET/环境重跑均0。

## 红绿与门禁

本次是重放整合，沿用已复核批次2的有效红绿，不另造等价测试。信用卡简短答案、页后半事实/完整未说明、评论误引用与敏感前导引号红绿及三反事实控制见[批次2报告](../g1-revision/report.md)。Agent/Web追问主链红灯尚未编写，应在版本停止之后的接入切片取得；本报告不把核心测试当作接入完成。

测试提交`7be3b33a6f5df241f0577b60134d4572dc6fe050`，654项[冻结输入](core-inputs/freeze.json)先提交，外层[脚本](run-gates.py)运行中不改，五门禁逐项前后status为空、恢复0。宿主macOS26.6.2 ARM64/Node24.4.1：

| 门禁 | 结果 | 秒 |
|---|---|---:|
| typecheck | PASS | 0.505 |
| arch:check | PASS | 0.185 |
| npm test | 1152/1152，fail/skip/cancel 0 | 27.726 |
| build | PASS | 0.455 |
| test:browser:fixture，并发4 | 168/168，fail/skip/cancel 0 | 107.236 |

完整命令/起止时间/净树/日志SHA见[gates.json](gates/gates.json)及同目录原始日志。Chromium为本地保存页/fixture，单次107.236秒，不声称三次中位数或Live。用户已提供上批Linux独立复核通过，本次Linux NOT_RUN。

旧HARD分段、选择、完整Native事实结果、证据/检查/metadata及模型请求复跑仍44,197字节，SHA-256 `9a3298bc5e004b99e41d80713e8913b68c336cfa594f6eb60599e310ee3fb633`。沿用冻结的check-fact-compatibility.ts与facts-before.json，非只比较子字段。

## 下一步与停止范围

核心已获合入授权；接入必须增加Agent合法动作与持久追问事件，拟递增Agent Prompt、动作Schema、Context、State、TaskDefinition。按用户批次3第1节“先停下报告将要递增的版本，再改”，在版本预告后停止，不提前升版或声称停止点1全部完成。版本预告独立提交于后续工作分支。

G1真实模型评测尚未运行；等A Runner接入本核心后，在≤120调用/Live0额度内运行并交A独立评分，不自行评价语义质量。G3尚未开始；必须先完成G1，并确认C详情页身份改动合入最新main。TableCheck按用户决定暂缓。
