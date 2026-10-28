# G1 小修复核后合入 main

2026-10-28，Vienna CET（UTC+1）。Evidence status: reviewed production source + offline integration verification；不是新真实模型或Live评测。

用户接受 B dd87cfbb 的五项问答修复、Prompt/Schema3、ADR0046 revision0.4及单文件A fixture同步。Linux独立复核的两项时序失败由A的已接受main54b3dd2b修复，本批保持该修复原字节。工作分支 codex/fix-phase3b-g1-answer-quality 将最新main54b3dd2b整合后，无源码冲突；仅解决记录和预算并集。没有改写/读取QA参考答案。

受测整合提交 **2ccaab58f2cb9e915ad6f4a82adb226e0c1bd5bf**。已复核 G1 核心和core-adapter fixture与dd87cfbb一致；A时序测试修复随main保留，未自行改动A其他测试。原有效红绿证据沿用 [G1修复报告](../g1-answer-quality/report.md)，并由本次完整默认回归验证，无新产品实现需要另造红灯。

## 五门禁及G2

macOS26.6.2 arm64 / Node24.4.1，Chromium并发4。首轮完整验证全绿，无修复重试：

| 检查 | 结果 | 数量/耗时 |
|---|---|---|
| typecheck | PASS | 0.452秒 |
| arch-check | PASS | 0.187秒 |
| npm-test | PASS | 1196/1196；27.685秒 |
| build | PASS | 0.449秒 |
| browser-fixture | PASS | 175/175；106.836秒 |
| dom-change | PASS | 4/4；20.95秒 |

每项前后git status --porcelain为空，restorations=0，无skip/cancel/fail。额外G2为普通基线，不是G3严格PASS验收。[完整收据](verification/gates.json)。681份源码/配置/公开问题与保存页/外层脚本先冻结提交，运行后SHA再次核对一致；未读取或哈希answers*.json。[冻结清单](input-freeze/freeze.json)。

## 不变量与账本

旧HARD完整序列化结果44,197字节，SHA-256 9a3298bc5e004b99e41d80713e8913b68c336cfa594f6eb60599e310ee3fb633逐字节一致，包含文档、选择、模型请求和Native事实输出。[字节检查](hard-compatibility.json)。Agent29/Action5/Context17/State24/TaskDefinition22不变；两站非测试TS3878、source-packs.ts单列478，本批无增加。[逐文件计数](adapter-lines.json)。

预算B旧318条、main407条按id并集，所有原条目原值保留，同id差异0；追加本批0调用，共409唯一id。main的原真实调用累计不被本批0覆盖。[整合预检](preflight.json)。本批新增真实模型、Google、网站、Live、环境重跑、公开GET全0，不读取.env。

## 发布与后续

用户明确批准合入并推送main。验证提交后的收尾仅文档/产物，可执行树和681冻结输入不变。main工作树干净后快进到含本报告的提交，推送main及G1工作分支，并以ls-remote核对；实际SHA见delivery.json回执，不提前宣称推送。

发布完成后立即从新main开G3 Tabelog分支，不等A六题重跑。已在只读依赖梳理中发现日历Agent引用接线位于C正在修改的tabelog-browser-availability.ts；G3将按用户第3条先报告具体范围，未授权前不改两个受保护文件。G3行数/严格DOM门槛尚未完成，TableCheck仍等首次Live的阳性日历。

## 发布回执与后续口径

2026-10-28T14:58:58.758795+01:00：main及G1分支已原子推送eb1518f1ad3f4fa8da4469c993b02d1b9f15ccf8，ls-remote均匹配，main工作树干净。[回执](delivery.json) / [refs](main-published.refs)。已从此main开G3分支。用户随后明确行数仅供参考；G3当前验收按ADR0047，以严格G2与真实任务行为为准，旧历史数字不作门槛。
