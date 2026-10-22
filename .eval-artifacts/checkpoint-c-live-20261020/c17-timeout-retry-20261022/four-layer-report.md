# H005 c-17 环境补跑与检查点 C 门槛

状态：第二步通过。此目录是新增只读Live；原18份执行和原评价保持。冻结SHA 282828a4c679af6a4de314c5a730076566714254b287a5327e3d97fdbdd76cbd。c17新运行独立@33/rubric29；其余17槽位沿用复核已认可@32，不冒称本轮新运行。

## 一、端到端结果

c17: QUALIFIED_DELIVERY；截止前完成 true。四TARGET: p2l-kf-h001-20261103 3/3 QD；p2l-kf-h005-20261105 2/3 QD；p2l-kagurazaka-kaiseki-20261105 3/3 QD；p2l-kichijoji-tempura-20261103 3/3 QD。用户指定C门槛：PASS；逐条件满足/不满足/未核对、原文与展示比对在conditions.json及独立sidecar中。

| 槽位 | 用例 | 结果 | 评测器 | 耗时ms | 模型 | 交付店数 |
| --- | --- | --- | --- | --- | --- | --- |
| c-01 | p2l-kf-h001-20261103 | QUALIFIED_DELIVERY | 32 | 224642 | 14 | 1 |
| c-02 | p2l-kf-h002-20261107 | NOT_EVALUATED | 32 | 500078 | 35 | 0 |
| c-03 | p2l-kf-h005-20261105 | CAPABILITY_MISS | 32 | 302909 | 22 | 0 |
| c-04 | p2l-kf-h003-20261106 | NOT_EVALUATED | 32 | 230789 | 19 | 0 |
| c-05 | p2l-kagurazaka-kaiseki-20261105 | QUALIFIED_DELIVERY | 32 | 324140 | 30 | 2 |
| c-06 | p2l-kichijoji-tempura-20261103 | QUALIFIED_DELIVERY | 32 | 234443 | 21 | 3 |
| c-07 | p2l-kf-h005-20261105 | QUALIFIED_DELIVERY | 32 | 260178 | 21 | 2 |
| c-08 | p2l-kf-h003-20261106 | NOT_EVALUATED | 32 | 218526 | 16 | 0 |
| c-09 | p2l-kagurazaka-kaiseki-20261105 | QUALIFIED_DELIVERY | 32 | 268609 | 31 | 2 |
| c-10 | p2l-kichijoji-tempura-20261103 | QUALIFIED_DELIVERY | 32 | 181852 | 21 | 3 |
| c-11 | p2l-kf-h001-20261103 | QUALIFIED_DELIVERY | 32 | 184688 | 19 | 3 |
| c-12 | p2l-kf-h002-20261107 | QUALIFIED_DELIVERY | 32 | 138821 | 13 | 1 |
| c-13 | p2l-kagurazaka-kaiseki-20261105 | QUALIFIED_DELIVERY | 32 | 341062 | 25 | 1 |
| c-14 | p2l-kichijoji-tempura-20261103 | QUALIFIED_DELIVERY | 32 | 268818 | 19 | 2 |
| c-15 | p2l-kf-h001-20261103 | QUALIFIED_DELIVERY | 32 | 218092 | 19 | 3 |
| c-16 | p2l-kf-h002-20261107 | QUALIFIED_DELIVERY | 32 | 177194 | 16 | 2 |
| c-17 | p2l-kf-h005-20261105 | QUALIFIED_DELIVERY | 33 | 214037 | 29 | 3 |
| c-18 | p2l-kf-h003-20261106 | HONEST_NO_RESULT | 32 | 466954 | 47 | 0 |

## 二、环节指标

每槽位P2-1首批见证、P2-2选中的直接门店/执行阶段耗时、P2-3价格与展示分别保存在result.json的slots[].report.layers.stages，来自原运行原始轨迹或本次c17。C18展示反事实回放40行：38 CONSISTENT、2产品未知外部支持；天妇罗4、Utou3全部一致，0 unsupported/missed。此回放不计为新Live。耗时仅指标：中位224642ms，最大341062ms，分母13。

## 三、严重度

当前最终18槽位的S0 PRESENT合计0；声明未知0，越界未知0。未知未改成ABSENT。原c17独立GET失败、旧C18全部评价及历史H003越界S0均保留；这不追溯宣称整个第二阶段旧安全证据已经补齐。用户当前C门槛与playbook全历史审计口径分别报告。

## 四、归因、预算与后续

原c17独立GET TypeError由fbb200ec复核认可为评测侧环境失败；本次由用户再次明确特批1次c17，Agent/Browser单次超时10→30秒。旧@33 CAPABILITY_MISS不改，不自动归类成ENV_FAILURE；保守再记1/10环境重跑，累计2/10，不再自动重跑本例。新增资源{"newFullLiveRuns":1,"newModelCallsCharged":29,"actualModelCallsKnown":true,"newEnvironmentReruns":1,"googleRequestsIncludingPreflight":3}；累计2885/4000模型、33/100完整Live、2/10环境重跑。500秒、50模型、40Google与只读禁表单/禁reserve/禁时段点击未放宽。当前结果PASS；按预先授权继续核对留出承诺与认证，尚未产生留出结果。

本次30秒上限的实测：29次模型调用全部成功；一次browser_read_decide耗时15.692秒并成功，超过旧10秒上限。交付3家，@33六条展示对照全部CONSISTENT；三家运行后独立四参数GET均200。本次214.037秒、29模型、含预检3 Google，请求/总限额不变。旧运行27成功+2次TIMEOUT及CAPABILITY_MISS原样保留，新旧完整Live的来源和模型选择分别采集，未把它们声称为同一模型请求的配对实验。用户明确特批额外一次，不修改原每例自动重跑上限。
