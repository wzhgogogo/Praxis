# G3 报价适用条件修复及 A 基线同步

2026-10-29T12:20:39.405762+01:00，维也纳 CET（UTC+1）。状态：**IMPLEMENTED / OFFLINE VERIFIED / WORK BRANCH ONLY**。G3c 尚在继续，本组不合 main。

用户已批准停止反例 c8ff6bf7 的修复。主红灯是实际 Tabelog Adapter → fixture 模型选原文 → 数字/出处核对 → 生产预算判断：2 人请求被“至少 4 人”的 JPY8,000 报价误判 MET。补充字面条件红灯 d44900c6；实现 1ac55192/a650a8ca，最终对应回归 a3d35cd8 通过。State/TaskDefinition、Agent 和 G1 Prompt/Schema 均未改变；独立来源 Prompt/Schema 仍1。

## 规则与实现

沿已有 Intent 传日期、人数和餐别，代码从完整引用解析明确的人数范围、日期范围/单日期、星期及仅午/晚餐条件。已知不适用或条件不能核实的报价不参与比较；没有其他适用报价为 NOT_CHECKED，不能因一条不适用套餐推出 NOT_MET。支持的字面格式包括数字人数、ISO/斜线/年月日日期、英文星期及日文单曜日；会员、提前预约、节假日、限定期或座席等未核对条件不猜。正常无限制报价按原规则比较。原始金额、完整原文及事实来源均保留，列出套餐不进入 offer.price，也不证明套餐库存。

## 旧 HARD 全部状态变化

修复前在实际默认回归记录 9,827 次调用，冻结为367组不同输入/481个条件状态；默认1223项仅原人数反例失败。修复后重算相同输入，只有以下一项状态变化：

| 条件 | 旧 | 新 | 原文 | 原因 |
|---|---|---|---|---|
| 2人，2026-08-05晚餐，人均≤8,000 JPY | MET | NOT_CHECKED | Seasonal dinner course: JPY 8,000, tax included; dinner only. Available only for parties of 4 or more. | 原文至少4人，请求2人；没有其他适用报价 |

全部状态按强度为{'HARD': 370, 'SOFT': 59, 'UNSPECIFIED': 52}；唯一变化是HARD，其余480个状态不变，没有只挑通过项。另有17行比较来源列表变化、共8条不同报价（其中1条即上面反例）；7条历史报价因未核实的限定条件退出比较，但原始事实和全文未删。[完整状态和来源差异](legacy-state-and-source-changes.json)、[逐报价字面处置](literal-source-dispositions.json)、[冻结原调用](old-condition-calls.json.gz)。旧事实链路完整44,197字节仍同SHA `9a3298bc5e004b99e41d80713e8913b68c336cfa594f6eb60599e310ee3fb633`。

对应旧展示回归现在固定核对本用例实际存在的5条报价排除项，逐条证明原文仍在当前同店事实中，并保留所有状态、身份、时间和其他来源的完整比较。首轮门禁因旧来源列表断言失败；第一次调整误把另一用例2条排除项算入此用例，第二次修正后该回归和完整默认门禁通过。未跳过、降低业务断言或修改历史fixture。

## 五门禁与严格 G2

| 项 | 结果 |
|---|---|
| typecheck | PASS |
| arch:check | PASS |
| npm test | 1225/1225 PASS |
| build | PASS |
| test:browser:fixture | 180/180 PASS，128.958663秒；G2独占，其他文件并发4 |
| PRAXIS_G2_REQUIRE_PASS=1 test:dom-change | 5/5 PASS；12/12页PASS，其中Tabelog6/6 |

每项前后净树，无恢复、skip、todo。[正式门禁收据](gates/gates.json)、[逐页严格G2](strict-g2-cases.json)。前四项在a3d35cd8通过；Chromium首次180/180绿后，外层脚本仍匹配旧命令行而中断记录。修正为A的新阶段日志校验后，逐文件确认产品输入不变，复用前四项；在dc337a7b重新取得浏览器退出码并跑严格G2，均0。所有失败和外层错误日志原样压缩保留。709路径冻结SHA `2fd2a37632749dc15c42c88278293441d9bc230832c5fdbce3616fd788b37856`。

## main、保护范围与后续

已在报价红绿及差异核对后，将用户批准main50a08361合入本工作分支（97bfff03）。A的基线、G2观察/调度文件逐字相同；共享账本479个id并集合并，双方旧条目完整，实花累计不变。C保护文件与4个测试块/断言保留，tabelog-vacancy-response.ts格式/字节未改；0047/0048不变。

两站非测试TS3,970行、source-packs.ts482行，仅参考，统一脚本和SHA见[计数](adapter-lines.json)。新增真实模型、Google、网站、Live、公开GET、环境重跑均0；未读.env或QA答案。下一组继续G3c的公开套餐/价格/事实读取；TableCheck查位仍按用户决定留G3b。完整新来源模型质量和当前网站行为未由离线fixture证明。
