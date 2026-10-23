# F5 找店超时分析切片

- Evidence status: exposed development diagnostic; not a Clean Baseline
- Date: 2026-10-24 Europe/Vienna, CEST (UTC+2)
- Base: main `2ada8a69a3071740423745e581c3b6ae30d9a1bd`
- Branch: `codex/chore-phase3a-prime-f5-analysis`

按已冻结的 `../CODEX-3A-PRIME.md` 批次 1 对话 B，读取 `3ec38584` 的两次例 01 诊断及例 03 的所有已保存运行。交付六项问题的逐条证据、时间/调用明细及最多两个修复方案；不实施方案，不运行 Live 或真实模型，不改变历史结果、Gold、输入或 Guard。

验收是每个结论能回到原始提交、路径、trace 序号或决策行号；区分原始事实、代码机制和未做因果实验的估算。缺失的完整 trace 和页面保持缺口，不用决策间隔冒充执行耗时。报告和可复算的离线摘要位于本目录；仅同步本批文档记录。纯分析按 Test 的文档矩阵检查引用、数值、冻结 SHA、diff 与权威一致性，五门禁不重复运行；主线批次 0 结果只作复用基线。

停止于停止点 1：提交报告并等待独立复核选定方案。预算本批新增真实模型、Google、餐厅网站和 Live 均为 0；不进入 F5 实现或 F3 修复。

## 停止点 1b 切片（当前，2026-10-24 CEST）

用户复核通过停止点1并选择A、拒绝B。当前承诺是补齐Q7控件证据、条件实现范围、A-1至A-3、实现批离线红绿灯清单、历史预算算术、ADR-0043草稿和例03重新定义。完成证据为report第9节、43项固定输入SHA、Q7/预算/最终结果摘要及纯文档验证；没有产品改善或实现通过声明。

全部离线，不读或暂存.env，不改budget.json、产品/Runner/测试/Prompt/Schema/Gold/变体/Guard/适配器/source-packs.ts。历史只读固定Git blob，新输入追加SHA；报告显示时间用维也纳CEST，原始文件内UTC不改。唯一新增docs/decisions文件为提议草稿0043，既有ADR正文不变。

Q7任务匹配控件尚缺证，按证据不足写控件条件优先与A后备，等待复核裁定；不访问网站补洞。较深D1路径恢复后需5地区页，超过4页上限，不以时间余量替代预算验收。例03冻结地点Kudanshita；人工800m零结果不认证1000m环带，用时只记录；本批不改变体/Gold或重判历史。

提交并正常推送当前分支后停1b。F1b先合入main，之后再按复核重放并保留双方STATUS/DEVLOG/TEST-LOG/月度记录；本批不重放、不合并、不推main、不进入F5实现、Live准备、F2/F3或3b。
