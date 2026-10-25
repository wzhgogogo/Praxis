# F3-034：显式观察列表与有界UNKNOWN

- Evidence status: current implementation / exposed local fixtures；不是Clean Baseline或Live验证。
- 执行时间：2026-10-26T00:05:22.094927+01:00（Europe/Vienna，CET UTC+1）。
- 独立分支codex/fix-phase3a-prime-explicit-general-retrieval，从main 0bbc1094开始。
- 用户批准依据：停止点4自包含复核，批次4第3项；[窄补充ADR](../../../docs/decisions/0042-explicit-observed-general-list-supplement.md)。F6仍待批准，不实施；route留3f。

## 实际行为

非法提议、稀疏KEEP和重复表达式不再被代码转换成空关键词通用列表；来源有界UNKNOWN，保留原候选/预算。浏览器GENERAL只能选当前来源/地区流程实际观察页面/链接的引用，包含观察出处；Pack边界核对后才进集合，导航前再次解析引用。空集合不提供GENERAL；普通DOM仍绑定当前观察。合法CATEGORY移除类别入口上的旧关键词是模型明确选择，与非法提议自动清词分开。

同一失效在共享文本的Native及Google-only组装调用方一并关闭：拒绝提议不再请求通用Google查询。无正向条件时保留当前观察、共享文本仍按原ADR走通用检索，不增加模型调用。HARD、坐标、身份、库存、展示资格及原来源/整单预算不改。

## 版本与退役

retrieval Schema@3／Prompt@6，State@22／TaskDefinition@20。generalRef为新wire必填字段，旧五字段输出拒绝，无兼容路径；所有活动模型替身/调用方与State fixture同步。没有需保留的生产状态，本批不迁移、不重置数据库，不读取.env；冻结的旧artifact与评价原字节保留。语义、Browser动作、Guard、Gold/变体不变。

两个旧自定义Planner fixture把空选择当通用列表，另一个交付fixture依赖非法KEEP后隐式清词，已按新合同退役这部分行为：前者明确保留当前观察，后者走两次明确合法改写并保留之前候选。原HARD合格门店仍交付，未把断言反转成允许失败。

## 行为覆盖与检错

| 失败类型 | 实际测试入口 | 有效红灯 | 绿灯与边界 |
| --- | --- | --- | --- |
| 空列表后非法关键词／稀疏KEEP／重复关键词自动清词 | native-discovery-composition.test.ts的F3-034；真实生产assembly、Planner、Native、Guard，模型/来源为本地构造 | 未修生产21c5dd0d，red.log三项目标“不得导航通用列表”均true!=false | green.log同断言3/3通过，无修提议循环；UNKNOWN、HARD/预算保留 |
| 显式通用入口与观察权威 | browser-read-discovery.test.ts既有P21扩展，真实本地Chromium和生产来源Pack/Guard | 沿上述旧代码红灯，额外正常/反例控制不单独冒充旧网站证据 | 空检索→选择真实观察引用→通用列表→5家详情；href冒充、跨来源、没有通用观察都在导航前拒绝；browser-controls.log |
| 无效文本变成通用Google读取 | 同一F3-034组合控制，实际Google-only factory | 与第一项同一拒绝后空查询机制，未另声称独立历史网站红灯 | 生产组装返回DISCOVERY_SOURCE_INCOMPLETE，外部传输0次 |
| 候选保留/原交付链 | 既有category交付控制改用两个合法策略；原Router/Reducer与独立Evaluator | 旧fixture依赖已退役的非法KEEP，说明见上 | 63项相关回归全绿，原门店101合格交付、HARD不放宽；F5c同调用纠正及F5收尾回归保留 |

全部本地构造均非网站回放；真实Chromium仅证明浏览器/Guard语义。当前网站、真实模型策略与端到端Live未运行，历史F5例01 FAIL和已知限制不改变。五门禁在提交净树候选执行，逐项结果另附gates.json。

## 保护与预算

scope.json记录新main基线和受保护文件SHA：两个来源目录、page-parser/query-controls及source-packs.ts相对基线零差异，因此不增加站点行数；共享Native/Planner与调用方改变。budget.json原字节不变，新增模型/Google/餐厅网站/Live均0。git diff --check通过；外部网络只有授权Git推送，不计生产读取。
