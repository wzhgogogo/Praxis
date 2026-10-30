# 等时戳查位事实：事件顺序修复交付

2026-10-29T15:54:38.890731+01:00，维也纳 CET（UTC+1）。**产品反例已关闭；G3整体仍待A的fixture同步与剩余测试审查。不合main。** 分支 `codex/feat-phase3b-tabelog-observed-availability`。

产品修复 `80797d48`；对应负向回归维护 `50319f85`；完整矩阵候选 `33ec8dd4`，补充冻结/对照 `eee5d73c`。用户批准的范围是当前事实及展示引用顺序，不改变来源/库存/身份/Guard或State。

## 顺序依据与实现

现有State已有可用因果记录，无需新增字段。`CANDIDATE_FACTS_CHECKED` Reducer处理事件时，把**此前已在State中的同来源原始事实**记入累计 `supersededEvidenceIds`，包括后续UNKNOWN/失败观察；其后 `AVAILABILITY_CHECKED`只追加并引用本次事实。显式替代集优先于所有查位引用，派生判断仍须引用当前原始事实。

`restaurantCurrentFactEvidence`保留当前查位check引用且未被因果替代的原始事实，移除对 `observedAt > checkedAt` 的依赖。没有改为 `>=`，没有按证据ID字典序或Map首次插入位置猜顺序。仅改此一个非测试产品文件；身份、候选、来源、范围、过期及HARD核对保持。

反向调查发生在查位之后时，原Reducer已经记录该查位事实被替代，照旧排除；只是改时间戳不构成事件。State **24**、TaskDefinition **22**、contracts及Reducer源码逐字节不变。A的四个评测文件、评分器、Gold、独立期望、迟到/取消/预算反例均未修改。[保护SHA](preservation.json)。

## 先红后绿

- 冻结红灯 `24e3e8e8`：领域1/1在“等时戳后发生的availability-fact必须当前”处失败，反向事件顺序已先执行；A的原 H001 首批断言同样失败，三家缺失的事实ID与A诊断完全相同。独立评价 `REQUIRED_EVIDENCE=NOT_SATISFIED`、合格交付 `NO`。[红灯收据](red/receipt.json)。
- 领域修复绿：等时戳“调查→查位”保留事实并展示引用；“查位→调查”排除旧事实；显式superseded优先；后续UNKNOWN不复活旧事实。另保留来源时间更早但事件更后的控制，防止用`>=`代替因果顺序。
- A单例在隔离的稀疏临时clone中运行固定 **cf20522e**；红绿之间只把 `read-assessment.ts`换为冻结产品文件。A四文件SHA完全一致，来源页面、模型/Prompt、请求、时钟、动作序列、评价器和所有断言不变。未materialize .env或QA答案目录。
- 原流程仍为 `SEARCH → INVESTIGATE_CANDIDATE_FACTS → CHECK_AVAILABILITY → PRESENT`。三家 100/101/102 的相同事实ID、URL、原文、时戳均保留；展示引用 **0/3→3/3**。原单例 **1/1通过**，独立 `REQUIRED_EVIDENCE=SATISFIED`、合格交付 **YES**。[绿灯收据](green/receipt.json)。未手填State/Evidence/evaluation，实际执行及独立评价的原始字节压缩留存，见[完整性清单](output-integrity.json)。
- 相关领域/Agent Context/实际Router→Reducer展示回归 **49/49通过**。测试模式为构造来源+fixture模型+真实产品组合；这个H001单例不是Live或当前网站Replay。S0仍是独立评价的 **NOT_EVALUATED**，不冒称S0=0。

初次隔离脚本因本地node_modules符号链接被Git当作未跟踪文件，在A测试启动前被净树校验拦下；仅补本地exclude后执行正式红灯。该外层失败不算产品红灯，日志另存 `outer-precondition-failure/`。

## 对应测试维护

新增 `src/domains/restaurant/read-assessment.test.ts`，通过真实Reducer事件构造顺序，而不是手填superseded结论。

完整回归发现旧c05负向控制只改大checkedAt来模拟后续调查。本次批准规则下，该设置没有发生事件，不能证明替代。故在B自己的 `restaurant-presentation-evidence.test.ts` 中：保留原“后续同来源调查不得复活旧事实”断言，改经真实 `CANDIDATE_FACTS_CHECKED`；增加只改时钟不改变顺序、Reducer确实记录替代的断言。未放宽业务/引用/身份/价格断言、未修改保存页。首次完整默认因此14失败的日志保留，维护后恢复为原13失败。

## 五门禁与严格G2

| 检查 | 本候选结果 |
|---|---|
| typecheck | PASS |
| arch:check | PASS |
| npm test | **1218/1231，原A待同步13失败，没有新增叶失败** |
| build | PASS |
| test:browser:fixture | **178/180，2失败**；下述修复前后对照确认在51b0d3de已存在 |
| PRAXIS_G2_REQUIRE_PASS=1 test:dom-change | **5/5；12/12页面PASS，Tabelog6/6** |

每项前后git status为空；所有冻结输入前后相同；无restore、skip、todo或改评分口径。完整原始门禁保持FAIL，不被局部通过覆盖。[完整矩阵](verification/verification.json)、[补充对照与严格G2](browser-baseline/receipt.json)。

两项Chromium失败位于未改的 `browser-read-request-binding.test.ts` 的AVAILABLE/UNAVAILABLE正式H001组合；实际未满足的是第374行候选matchReasons包含旧字符串 `Verified HARD criterion from source: omakase`，Node错误表达式显示错位，不是新的日期控件断言。该fixture模型也尚未处理Source2用途。用**修复前51b0d3de**稀疏clone，及其中**仅更换read-assessment.ts**的同一clone，各自运行同两条原断言：都为0/2、同名同失败。故不是本次等时戳修复引入。未修改该第五个fixture/断言，需A与复核者另行归类接线/旧实现断言范围，不能自行删断言求绿。

默认13失败依然属于A尚未完成的原四文件同步。A的cf20522e仍是诊断草稿，本批不合入或宣称它全绿。整体G3验收继续等待A完成。

## 冻结与交付

最终冻结 **707** 个输入/脚本，SHA `807b72b0ca6c36e4bd67c7d1eea4680a2d79e10c8a4ed3c4e17bcdf2dd18c8af`；更早红绿冻结及提交保留。State/TaskDefinition/所有Prompt/Schema/Guard/站点目录/source-packs与本修复前一致；站点TS3,890、Pack482仅参考。

共享账本按id保留原483条，加本组0调用条目为484条。新增真实模型/Google/网站/Live/公开GET/环境重跑均 **0**。只提交并推送G3工作分支；按用户授权通知对话A分支及提交，然后等A完成fixture同步，不合main。
