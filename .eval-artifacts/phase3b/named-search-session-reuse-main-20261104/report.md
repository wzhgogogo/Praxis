# 会话复用与 B 资源策略合入 main

2026-11-04，维也纳 CET（UTC+1）。用户已批准 C `cc42fd8e`，要求 B 先合入、同步 main、五门禁和严格 G2 全绿后合入推送并通知 A。真实模型/Google/公开 GET/网站/Live/环境重跑新增均 0，不读 .env。

## 合并边界

main 已含 B `d692366c`。将它普通合入 C 工作分支，`browser-task-executor.ts` 实际自动合并、没有源码冲突；六份文档及一份账本（共七个文件）的冲突保留双方。

唯一重叠源码为 Executor。`merge-proof.json` 将两边补丁移除 index/hunk 行号后逐字比较：相对 C 的变化恰好是 B 原补丁，相对 B 的变化恰好是 C 原补丁。没有另写合并实现。其余 22 个双方独占源码/配置文件与各自父提交逐字一致；C 原 32 份交付产物原字节保留。

B 的资源策略、精确本机图片 retainedResources 声明、导航前与准备后重核、3000ms 门槛、取消优先及 BROWSER_BUDGET_EXHAUSTED 诊断全部保留。C 的来源会话生命周期、当前观察控件、填写后重观察、缺控件走原导航、故障退休、不额外重试及 TableCheck 两出口诊断保留。State25、TaskDefinition23、Prompt、身份规则与额度不变。

## 验证

合并候选 `bc8f31b7` 冻结 850 项输入，九步各一次、全部前后净树、SHA 不变，全绿，无重试/跳过/取消：

| 检查 | 结果 | 秒 |
|---|---|---:|
| typecheck | PASS | 0.570 |
| arch:check | PASS | 0.233 |
| npm test | 1415/1415 | 49.323 |
| build | PASS | 0.559 |
| test:browser:fixture | 189/189 | 131.934 |
| 严格 G2 | 5/5，12页 PASS | 24.239 |
| 复用搜索的导航门槛交互 | 1/1 | 0.132 |
| 真实本机 Guard 表单 | PASS | 2.293 |
| C 会话/身份前缀/20秒保留专项 | 18/18 | 5.007 |

原始输出与逐项 HEAD/时刻/status 见 `gates.json` / 各 `.log`；冻结 SHA 见 `freeze.json`。增加的纯构造时钟探针证明：当前填写令剩余时间从 4000ms 降至 2500ms 时，复用表单不提交，并保留 NAVIGATION_BUDGET_EXHAUSTED。没有修改 B 或 C 获批测试/断言。默认数量1415=已合main1410+本次C5；Chromium仍189。独立核验不导入产品解析器，逐字核对双方源码/文档/原产物、所有850 SHA、九步净树、两家正确身份和错店/不唯一拒绝、本机接收器实际GET序列以及账本原行，回执 `verification.json`。

本地 Chromium 表单探针也在新目录重跑，原 C 产物不覆盖。只验证合并后实际 Guard/控件/Executor，不代表新 Live 成功率、网站请求数或等待时间改善；历史 W1 超时根因仍未知。

## 账本与发布

main 829 条和 C 830 条按 ID 并集，所有原行原值保留，当前 830 条。沿用最新 main 已批准 GET 上限 410，累计 GET 298、网站 8432、模型 401、Live 11，108 留出预留不变。本次无新增实支、不新增真实调用授权。

发布前再次 fetch/核对远端 main，以最新远端 main 为第一父提交正常合入，合并树必须与本分支完整交付树一致，再原子推送 main 与工作分支、ls-remote 核对并通知 A。最终 main SHA 以交付回执为准。门禁后仅新增报告和核验回执，已测 source/scripts/package/fixture 不改；不把发布记录当成新一轮测试。

当前工作树中本地 main 名称另被历史工作树登记占用，发布使用 origin/main 的分离 HEAD 构造标准双亲合并，不强制改写或清理他人的本地工作树。远端 main 是本次发布目标。
