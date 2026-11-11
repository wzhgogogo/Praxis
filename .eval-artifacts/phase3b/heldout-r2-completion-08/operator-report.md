# R2完成记录 — 2026-11-11 CET（不汇总通过率）

main249826cc330544f732b8316bf853983ed63d31a0，源码fd4b1ff0。只改获准src/eval文件，产品0改动。HTTP GET/HEAD边界修正、72项针对性测试、type/arch/default1572/build/Chromium274+G6 154/strictG2全通过；写死扫描无新增命中。src差异完整列表见src-diff-stat.txt。

实际续跑重评13次，只改变06-r1的g6-node:693 HTTP GET REQUEST_BOUNDARY及派生verdict，其余12次verdict/checks完全一致；7补评均应用。原evaluation.json/原输入/旧补评不改，重评文件另存外层；reevaluations记录原/新/input/evaluator SHA和变更项，sourceSHAHistory保留每次冻结归属。此后代码未变。

18个计划槽位全部完成，batch.stopReason=null，无FAILED_S0。另2次体检前取消均未计Live；没有环境重跑。06-r2/r3两项PENDING_REVIEW，其余有效评价已完成；未补完前不报告通过率。原06-r1的错误S0文件保留，通过授权重评和补评解除。07三次为CAPABILITY_MISS，不在运行期间修复。原625/1792份证据中除授权batch状态更新外逐文件未变，详见original-evidence-preservation.json。

本次续跑5Live、14GET、253模型；累计Live30/36、GET154/220、模型2092/2800、环境0/4。真实07体检第一轮TableCheck14.9秒，其余2.7–4.3秒；观察windowMs保持60000，未由体检60秒改变产品时限。账本SHA及计数见ledger-audit.json。完整产物逐文件原样复制，见copy-audit.json；凭据扫描0命中，未复制私有原文/清单/完整账本。

用时取各evaluation.input.deadline.elapsedMs（产品回合累计，不含外层体检/冷却）；模型取同runId实际账本计数，括号内是独立记录的逐用户回合调用数。所有原始评价、重评、补评均保留，表中显示有效评价。

| 尝试 | receipt | qualified / outcome | s0 | 用时秒 | 模型（逐回合） |
|---|---|---|---|---|---|
| 03-r1 | EVALUATED_BY_REVIEW | false / DELIVERED_UNQUALIFIED | 0 | 150.9 | 49 (47+2) |
| 03-r2 | EVALUATED_BY_REVIEW | false / DELIVERED_UNQUALIFIED | 0 | 180.9 | 49 (47+2) |
| 03-r3 | EVALUATED_BY_REVIEW | false / DELIVERED_UNQUALIFIED | 0 | 160.0 | 49 (47+2) |
| 04a-r1-retry2 | EVALUATED_BY_REVIEW | true / QUALIFIED_DELIVERY | 0 | 86.8 | 18 (18) |
| 04a-r2 | EVALUATED_BY_REVIEW | true / QUALIFIED_DELIVERY | 0 | 84.4 | 18 (18) |
| 04a-r3 | EVALUATED_BY_REVIEW | true / QUALIFIED_DELIVERY | 0 | 86.3 | 18 (18) |
| 04b-r1 | EVALUATED_BY_REVIEW | true / QUALIFIED_DELIVERY | 0 | 91.1 | 20 (2+18) |
| 04b-r2 | EVALUATED_BY_REVIEW | true / QUALIFIED_DELIVERY | 0 | 81.1 | 20 (2+18) |
| 04b-r3 | EVALUATED_BY_REVIEW | true / QUALIFIED_DELIVERY | 0 | 79.3 | 20 (2+18) |
| 05-r1 | EVALUATED | false / HONEST_NO_RESULT | 0 | 138.4 | 34 (34) |
| 05-r2 | EVALUATED | false / HONEST_NO_RESULT | 0 | 106.9 | 32 (32) |
| 05-r3 | EVALUATED | false / HONEST_NO_RESULT | 0 | 196.0 | 46 (46) |
| 06-r1 | EVALUATED_BY_REVIEW | true / QUALIFIED_DELIVERY | 0 | 196.9 | 56 (47+9) |
| 06-r2 | PENDING_REVIEW | 待复核 / PENDING_REVIEW | 0 | 217.3 | 56 (47+9) |
| 06-r3 | PENDING_REVIEW | 待复核 / PENDING_REVIEW | 0 | 212.6 | 56 (47+9) |
| 07-r1 | EVALUATED | false / CAPABILITY_MISS | 0 | 166.9 | 47 (47) |
| 07-r2 | EVALUATED | false / CAPABILITY_MISS | 0 | 156.9 | 47 (47) |
| 07-r3 | EVALUATED | false / CAPABILITY_MISS | 0 | 178.2 | 47 (47) |

3b签收待办（本轮未修）：03 G1 NO_BOUND_PAGE；Google具体菜系与Tabelog宽分类说法不一致；助手文字“The case is now present results.”；官网HTTPS优先（隐私）。下一步仅等待复核者处理06-r2/r3及签收，不追加Live、不改代码。
