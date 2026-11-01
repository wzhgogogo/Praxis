# A归属调度测试：用户批准的只读对照与交付

2026-11-01，维也纳CET。用户明确不授权B修改browser-fixture-scheduling.test.ts，由A修复；批准B完成对照、记录该已知失败并推工作分支通知A，不合main。此前“等待归属/未推送”报告保留为当时状态，不再阻止本次已批准的交付。

预先固定各5次，不按结果追加：main6db445ea与B6162c128，交替独立进程，每次运行整个browser-fixture-scheduling.test.ts（两条原测试都执行，不设name/skip过滤）。分别报告文件与目标失败用例的通过/失败次数及原始日志。两个稀疏clone仅materialize该测试、三份脚本、依赖清单/tsconfig/.gitignore，G1产品源码不存在；相同Node和node_modules，无.env和QA答案。这用于对照归属，不能用单跑绿声称根因已关闭。

测试/断言/worker/外层产品脚本一字不改。随后照常运行完整npm test、其它四门禁和严格G2，不排除A测试；默认如只出现既知目标失败，结果仍记FAIL/A_OWNED_KNOWN_FAILURE，按用户决定继续其余检查，绝不称五门禁全绿。任何新失败不自动豁免。

复用此前A原P4因果红绿、组件114/114、真实Guard2/2和旧HARD字节证据；产品不变，不为重验付费模型/来源，不改State/TaskDefinition/Prompt。新增真实模型/Google/网站/Live/公开GET/环境重跑全0。冻结外层脚本/输入并先提交，执行前后净树，报告与STATUS/DEVLOG/TEST-LOG/月度索引更新后推B分支、通知A，停止。
