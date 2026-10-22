# Phase2b 第一步：合并验收

Evidence status: frozen exposed regression; merged in codex/chore-checkpoint-c-prep. No new Live, no new Clean-holdout result.

预算200e13cf → 团体98cc7994 → 退出流水线47afd2d7按序合入；仅摘取06703ba1预算批准，不合入其他开发代码。State20 / TaskDefinition18，Browser Prompt19 / Restaurant Agent Prompt27 / Semantic Prompt21，Evaluator33 / rubric29；文档修订号统一递增，所有历史记录及双方行为/测试保留。

冻结代码提交 1a715325f121db137c8e509ce8a2440e55cad968，SHA-256 **f648d2df299b6f4462969e1980048f4354acb400e0679acb9f03b63b892a369b**，运行前提交4173项，离线验收后逐项通过。团体最终包使用delivery-freeze032c73a2，批准复核按98cc7994逐字核对；准备时误取中间包的核对失败发生在运行前，未改任何历史输入。

## 1. 端到端结果

第一步门槛PASS；这仅证明合并后离线回归，不是新的整单或Live交付。三份旧例02保存事件经过当前生产Router→Reducer，实际新State20单独保存，只将其真实展示投影进旧观察的评价视图，旧原始结果不覆盖。

| 旧运行 | 预算行数 | 与@33独立核对 |
| --- | --- | --- |
| h-02 | 2 | CONSISTENT, CONSISTENT |
| h-08 | 2 | CONSISTENT, CONSISTENT |
| h-14 | 1 | CONSISTENT |

## 2. 逐环节判定

- 五门禁实际运行：typecheck/arch/build PASS，默认1024/1024、本地Chromium136/136；原历史浏览器生成报告已恢复，新结果另存。加入三槽检查入口后默认套件再次1024/1024，外层当前16项控制PASS。
- 69点用当前生产观察重建，与冻结的批准模型内容、Schema、oracle逐点一致，仅保留此前10秒→30秒超时变化；复用原真实模型响应，69/69。选店请求逐字相同，5/5。此为缓存响应回归，非新模型质量样本。
- 校准Evaluator33/rubric29：先保存22份自动输出，再比较标签，22/22；常规声明20/20，2中断仍未评，越界9 ABSENT/13 NOT_EVALUATED。
- 预算5行MET/CONSISTENT；全部10条条件一致；原Gold、Proposal、priceFacts、来源响应和旧评价保留。

## 3. 严重程度与资源

离线预算展示0 S1_UNSUPPORTED/0 MISSED_KNOWN_CONDITION；不把历史S0或未知改为零。新真实模型/外站/Google/Live/重跑全部0；原累计3280模型、51完整Live、3环境重跑。用户批准后上限5000，剩1720模型/49Live/7环境重跑。预算门禁与流水线账本更新使用同一常量，旧账本不改写。

## 4. 归因与下一门槛

合并没有改变各方生产行为；首个待证明项仍是团体与时间窗修复的真实因果贡献。三次检查复用同一Runner/Guard/独立post/S0执行器，仅增加独立SHA绑定的三槽计划，原18槽行为保留。先例03、再例01、再例03；不计任何退出分母。门槛为0 S0 PRESENT、例03至少1/2 QD且例01 QD；现有见证须在北京时间2026-10-23 14:41:36前全部跑完，过期停，不续期。

新Phase2b原文仍未打开，第三至第五步尚未开始。检查失败就提交停止报告，不绕过，不以离线回归代替Live。
