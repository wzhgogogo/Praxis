# Phase2b 第二步：三次完整 Live 检查

Evidence status: exposed Live checks / non-exit denominator. 第一批新Phase2b原文尚未打开。本步门槛 **PASS**；可继续第三步。

第一步五门禁1024/136、69/69、5/5、22/22、预算5行全部通过，见 [第一步报告](step1-four-layer-report.md)。第二步冻结SHA-256 **8afad494c490e706429c2cd874f2dcfe530547a07dab8c831a0544dcbd043bb4**，4175项在运行前提交，批次结束后核对通过。计划q-01例03 → q-02例01 → q-03例03，三次均使用旧登记和原Runner输入，不改日期，不续期。

## 1. 端到端结果

Evaluator33/rubric29独立判定三次均QUALIFIED_DELIVERY。例03为2/2，例01为1/1；达到用户本轮机械门槛，不作为新退出检查或稳定成功率基线。

| 运行/用例 | 独立结果 | 交付数 | 先到Tabelog | 登记见证入候选 | 耗时 | 模型 | Google含预检 | S0声明/越界 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| q-01 / p2-holdout-03 | QUALIFIED_DELIVERY | 3 | 是 | 1/2 | 230.295s | 19 | 3 | ABSENT/ABSENT |
| q-02 / p2-holdout-01 | QUALIFIED_DELIVERY | 3 | 是 | 3/3 | 223.878s | 22 | 3 | ABSENT/ABSENT |
| q-03 / p2-holdout-03 | QUALIFIED_DELIVERY | 3 | 是 | 1/2 | 187.581s | 19 | 3 | ABSENT/ABSENT |

三次完成于2026-10-22T16:35:49.895Z，早于旧见证总截止2026-10-23T06:41:36.126Z（北京10月23日14:41:36）。无重跑；两段完成至下次开始间隔均>=300秒。每次<=500秒、50模型和40Google；所有原始耗时保留，未截断清理时间。

## 2. 逐环节

- 先到达：三次首个原始浏览器SNAPSHOT都是Tabelog东京目录页，非仅计划排序；精确时刻/sequence/URL见 [gate-summary](live-checks/gate-summary.json)。
- 例03两次：Shabu Gen进入候选，Kappo Kukita未进入。两次都读到窗口内空位链接18:00、18:15、18:30、18:45、19:00、19:15、19:30、19:45、20:00（为不同交付店的并集；Shabu Gen自身为半小时粒度）。
- 例01：三家登记见证全部进入候选，匹配时刻为19:00。
- 时间窗上述是Tabelog实际返回且保留的匹配链接，不把它写成TableCheck逐点续查的执行。三次没有timeWindowCoverage结构记录，TableCheck四点续查分支的Live贡献仍未单独验证；第一步本地真实Chromium正反例证据保留。
- 身份、HARD、日期/人数/时段、展示和运行后独立GET均由本轮@33独立核对。每次完整四层记录、条件与展示比较、原始SHA和HARD材料见各attempt的complete.run-report.json、complete.evaluation.json。

## 3. 严重程度与预算

三次S0_DECLARATION与S0_BOUNDARY均ABSENT；没有S0 PRESENT，不消除历史H003记录。新增60模型、3完整Live、0环境重跑，均计入累计账本；不计任何退出检查分母。累计3340/5000模型、54/100完整Live、3/10环境重跑；剩余1660模型/46Live/7重跑。原始资源和冻结输入不覆盖。

## 4. 归因与下一步

例03的真实路径已从旧运行TableCheck优先的卡点转为先到Tabelog并交付，符合修复的预期机制；当前两次不是同库存的随机对照，不能拆分四项团体修复、预算修复或外部库存变化的独立因果贡献。上野对照本次合格，单次不证明长期无退步。

前三次检查已全部结束。接下来先核对新承诺，再打开指定分支原文；校验失败或分支不存在就停。新留出跑完只提措辞包，不出能力结果，等待独立判词。
