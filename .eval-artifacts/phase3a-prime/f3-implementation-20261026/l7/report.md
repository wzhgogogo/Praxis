# L7：表单选中字段重复计算

状态：implemented / frozen regression；2026-10-26T00:36:46.593370+01:00（维也纳 CET，UTC+1）。分支 `codex/chore-phase3a-prime-f3-l7`，基于 main `e92f1cfe397391b8906074e718a1012e08a1c865`；实现及五门禁源码 `458c6cb6bab3fad3f25d525182d072743d87f633`。新增真实模型、Google、网站、Live、环境重跑调用均为 0。

只把日期与人数的重复字段扫描合成同一个描述驱动循环，代码留在原 TableCheck parser。保留：一个 form 同时唯一拥有 input/start_date 与闭合 select/adult；唯一、可见、启用、类型与 name 正确的 live 控件；日期、人数精确相等；唯一 selected option 与 live 人数相同。没有弱化核验、删断言、引入 Pack 或通用层迁移。

## 红绿与门禁

在 c041b234 冻结一个最小新增反例：live 人数 10、已选 option 9，必须拒绝绑定。隔离复制原函数并仅去掉 option/value 一致性核验，真实 AssertionError 红灯；原文件未被变异。red/summary.json 和逐项日志保存代码、脚本、生成文件 SHA。修后同测试绿；原日期/人数、旧 HTML、跨 form、加载、无库存、同店链接与时段断言全部保留。

输入与外层脚本在 red-inputs/freeze.json、green-inputs/freeze.json 冻结；冻结脚本、计数脚本、门禁脚本 SHA 随 manifest 保存。未修改 Evaluator、Gold、Prompt、Schema 或 Guard；本批是离线等价重构，不产生 Live 质量分数。

| 门禁 | 结果 |
| --- | --- |
| typecheck | PASS，0.438 秒 |
| arch-check | PASS，0.200 秒 |
| npm-test | PASS，19.847 秒，1060/1060 |
| build | PASS，0.412 秒 |
| browser-fixture | PASS，106.290 秒，161/161 |

完整日志在 gates/。默认套件 1060/1060、真实本地 Chromium 161/161（4 路并行），无 skip、无已知失败豁免。每门禁前后 git status 均为空；冻结输入运行前后匹配。Linux 本批 NOT_RUN，不借用旧平台结论。既有整链路 same outlet/query/HARD/价格/餐期/日期人数绑定回归未删除。

## 实际行数

统一 count-adapter-lines.py（物理 splitlines，两个站点非测试 TS，排除 fixtures）统计：3864 → **3862（净减 2）**。source-packs.ts **473 → 473**；站点 Skill 不计。旧计划 L7 净减 13 是估算，不以压行、删核验或搬迁补足。当前仍比 3591 高 271 行，目标未达。

L1–L6 的替代观察不足，先保留原代码，逐项减行 0；证据和延期条件在 ../line-eligibility/report.md、deferrals.json。该延期不冒充实现通过。重新扫描当前 main 的113个测试文件，58处时序候选与已处理清单无增删或机制变化，见 timing-inventory-diff.json；时序卫生已在前一独立分支完成。

边界逐字哈希见 boundaries.json：四个对话 B 文件和 source-packs 与上游 main 相同；本批源码仅 TableCheck parser 及其原测试增加一条断言。五门禁完成后按授权合入并推送；集成 SHA/ls-remote 收据见总报告，避免以自引用提交写入本报告。
