# A 评测 fixture 接线交接（draft / not applied）

2026-10-29T14:13:21.607399+01:00，CET。B 已按跨归属停止条件停下；本组（相对53754140）以下4个文件均未修改。原始叶断言与diff见 failed-gate-inventory.json。

| A文件 | 确认的缺口 | 建议的最小同步 |
|---|---|---|
| src/eval/restaurant/agent-loop/native-discovery-composition.test.ts | H001NativeModel没有restaurant_source_facts分支；新增合法请求成为异常。Native FactJudgment已有原文选句，但失去私有HARD元数据后无可接纳字段。 | 只给当前同店商家原文返回Source2的完整编号范围/role/priceStatementId（未定价为空），不让Source请求消费Agent动作，不改变库存或独立期望。保留WP-A只有1个故意超时的断言，确认新合法调用不被错记为额外错误。 |
| src/eval/restaurant/agent-loop/current-development-offline.test.ts | FixedCurrentCaseModel/TwoTurnStrengthUpgradeModel没有Source2分支；H001部分正常序列仍只SEARCH/CHECK/PRESENT，依赖已删除的私有HARD捷径。 | 同步合法原文选择响应；需要时显式安排既有INVESTIGATE_CANDIDATE_FACTS动作与引用响应，保留用户结果数、同店/请求绑定和独立评价期望，不手填State/Evidence。语义Gold和评分器不改。 |
| src/eval/restaurant/agent-loop/fixed-source-case-execution.test.ts | 正常控制把非语义/检索请求当Agent动作，Source2会消费下一动作并MODEL_FAILURE；不是计时器超时。 | 将Source2与事实判断fixture响应按purpose分流；如需事实调查，明确列入脚本，不重置semantic-started截止、不增生产预算，不改正常成功和迟到/取消/预算反例。 |


| src/eval/restaurant/agent-loop/current-development-fixed-sources.ts（非测试，共用评测来源工厂） | 实际只在预约页text/私有featured-menu容器中提供inventory.menuText；身份guide没有商家菜单原文，预约页又没有同店H1/地址等事实读取身份资料。旧3动作正例依赖私有HARD捷径。 | 由A决定如何在现有同店公开来源材料中为事实调查提供可绑定的原文；不能由B把私有容器恢复为权威、放宽身份、或私自在guide上补造证据。其余Reader/Gold/评分合同不改。 |

B对G3删除私有逻辑的“对应测试”有修改授权；但该新增缺口还涉及A的**非测试共用评测来源工厂与输入证据**，不属于仅改写对应断言/模型返回。这是本次跨归属停止的具体边界。即使只同步三个test文件的purpose分支，也不能预先保证旧H001正例恢复；必须保持真实调查链路和身份规则，由A/复核者协调来源fixture。

这是reviewable接线范围，不是已验证补丁，也未保证这4个文件足以解决所有问题。应用前冻结SHA，先保留当前完整门禁红灯；修后重跑对应实际composition及五门禁/严格G2。只让fixture模型理解当前独立Source2合同，不能恢复私有class的业务权威、不能降HARD/同店/库存断言。

Source2合同：purpose restaurant_source_facts；Prompt2、Schema2；顶层只selections，行固定firstStatementId、lastStatementId、role、priceStatementId；角色COURSE/DINNER_BUDGET/LUNCH_BUDGET/CATEGORY；无价格或CATEGORY用空priceStatementId。选择仅来自请求中的本页sourceDocument.statements，完整条件不得脱落；模型不可提供数字/URL/身份/库存。Source facts本身是原始证据，不直接宣布HARD满足；仍需既有引用判断/条件核对。

B自己的核心/Native/Router展示对应回归已有27+141绿，最终门禁仍1217/1230；请勿只修日志计数或把UNKNOWN改成PASS。B保留全部当前失败并等待协调；真实调用0。
