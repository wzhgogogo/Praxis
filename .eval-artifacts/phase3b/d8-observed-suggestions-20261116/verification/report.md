# 无主建议项修复：剩余验证与停止点
2026-11-16 CET。用户批准基于8896fae49949df064617e1ebfec289ea61363adc完成反例、Tabelog消息比对和4帧真实DeepSeek，再按全部PASS的条件合main并执行单次D8。

**Step 1为3/4通过，重复项反例失败，未满足合入条件。停止于main和Live之前。**

## 离线实现与反例
源码工作分支codex/fix-observed-outlet-suggestions冻结afaabecd2867e650c332b20cd5bf600a2a84ae88。相对8896只增加两个分店下游身份反例并准确表述交接，不新增生产判断。Kiwami、Hanare分店页带当前已审核GET 200回执时，真实TableCheckBrowserAvailability仍返回UNKNOWN，无目标offer、无AVAILABILITY阶段或预约导航；本地构造与真实网站回放分开。两个反例通过，相关本地Chromium交接及B1回归通过。CLICK_FAILED等既有反例保留。typecheck通过。完整五门禁及新增硬编码扫描属于Step 2，尚未执行，不能报告为全门禁通过。

同标签页路径变化、当前读取范围内点击边界之后完成的已审核动态GET 200、页面SETTLED，三项共同允许交接。pageId不单独证明同文档SPA。Adapter仍核对身份HIGH。保留无主建议项范围，未改有combobox owner的matchesRetrievalOption路径，未修改通用系统Prompt或通用Skill。

真实11-16录制DOM重建：13个DOM option，8个可见可用候选均进入模型输入。17个Tabelog原录制帧的模型messages经当前序列化逐字节比对相等，SHA列表见preflight.json。该证据是组件输入比对，不是完整网站Replay。

## 真实DeepSeek固定帧
| 帧 | 结果 | 实际动作 |
|---|---|---|
| nov16-6 | PASS | CLICK本店完整复合标签，包含Ginza及菜系副标题 |
| date-28 | PASS | CLICK_AUTHORITATIVE DATE，Wednesday 11 |
| suffix-only | PASS | CLICK Search，未点Kiwami或Hanare |
| duplicate | FAIL | 两个同标签、可点击目标均已发送，仍选择其中一个 |

duplicate实际收到的目标ref分别为observation:3:target:184与target:371。模型选择target:184，理由是“Unique suggestion exactly matches requested outlet name”。两项都存在于实际messages，排除了重复项未发送的情况。没有通过移动反例、删除重复项或改变判定消除失败。

旧通用“unique exact retrieval suggestion”句仍保留；本店副标题正例已通过，当前证据不能把重复项失败唯一归因于这句措辞，因此未据猜测扩大通用Prompt修改。没有花最后1次额度重复同一语义失败并以重跑通过替代原失败。

## 驱动、成本与保护
准备阶段两处驱动问题保留原日志。其一错误地给无字段CLICK保留NONE，已按真实解码省略；其二检查JSON Skill文本及日期帧传输元数据有缺口，均在发送前终止，未扣真实模型次数。日期帧只补required taskId，业务上下文不变，原始副本保留。模型实际请求messages另存，已核对其中objective与Skill为当前输入。

实际4/5模型调用，总99405tokens；0网站GET、0Live。提供的原model-budget.json与其他17份既有账本、主工作区HEAD/diff/status及分流配置保护哈希一致。源码保持净树，无main推进，无Live启动。剩余1次模型额度未用。

[四帧结果](model-final/results.json) · [本店实际消息](model-checked/nov16-6.messages.json) · [重复项实际消息](model-final/duplicate.messages.json) · [Tabelog字节对照](preflight.json) · [本地回归](offline/focused-handoff-final.log) · [保护记录](protected-after.json)。

本轮为公开录制上的真实模型组件验证与本地构造反例，未宣称端到端验收通过。证据归档在本地codex/chore-seed-release-verification分支，等待复核重复项失败的下一步。
