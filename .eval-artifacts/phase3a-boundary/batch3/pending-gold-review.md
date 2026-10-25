# 停止点3：待逐条确认的Gold清单

状态：draft / not integrated；本批没有修改Gold。确认后另行升版，不覆盖历史输入或evaluation。

## 1. SR03-T02（已指定保留项）

旧目标RECOMMENDATION → 新规则B为AVAILABILITY。此次未运行到本例；依据是已Accepted的ADR及停止点1明确保留，不冒充实测结果。待用户单独确认。

## 2. 灰区标注候选

14个不同灰区输入对应22份历史Gold记录。候选是后继Gold的GRAY/允许双目标/当前消息依据规则，历史文件仅作来源引用；额外三次均未运行，不能按本次一致率决定固定目标。

| Group | Case | 旧目标 | 提议口径 | 实测 |
| --- | --- | --- | --- | --- |
| G017 | p2l-kf-h003-20261106 | AVAILABILITY | GRAY，两目标可 | 未运行 |
| G023 | p1f-kf-h003-20261023 | AVAILABILITY | GRAY，两目标可 | 未运行 |
| G024 | p1f-kf-h004-20261019 | RECOMMENDATION | GRAY，两目标可 | 未运行 |
| G030 | p1f-kf-h004-20261027 | RECOMMENDATION | GRAY，两目标可 | 未运行 |
| G053 | h003 | AVAILABILITY | GRAY，两目标可 | 未运行 |
| G054 | h004 | RECOMMENDATION | GRAY，两目标可 | 未运行 |
| G063 | SR05-T01 | UNANNOTATED | GRAY，两目标可 | 未运行 |
| G064 | SR06-T01 | UNANNOTATED | GRAY，两目标可 | 未运行 |
| G065 | SR07-T01 | UNANNOTATED | GRAY，两目标可 | 未运行 |
| G066 | SR08-T01 | UNANNOTATED | GRAY，两目标可 | 未运行 |
| G067 | SR08-T02 | UNANNOTATED | CONTEXT_CARRY，沿用前轮 | 未运行 |
| G068 | SR09-T01 | UNANNOTATED | GRAY，两目标可 | 未运行 |
| G069 | SR09-T02 | UNANNOTATED | CONTEXT_CARRY，沿用前轮 | 未运行 |
| G070 | SR10-T01 | UNANNOTATED | GRAY，两目标可 | 未运行 |

## 3. 原开发Gold未标TARGET的13轮

| 轮次 | 后继标注候选 | 实测 |
| --- | --- | --- |
| SR01-T01 | B | SR01-T01 actual proposal AVAILABILITY with valid basis |
| SR01-T02 | CONTEXT_CARRY | NOT_REACHED |
| SR02-T01 | NO_TIME | NOT_REACHED |
| SR02-T02 | B | NOT_REACHED |
| SR04-T01 | B | NOT_REACHED |
| SR05-T01 | GRAY | NOT_REACHED |
| SR06-T01 | GRAY | NOT_REACHED |
| SR07-T01 | GRAY | NOT_REACHED |
| SR08-T01 | GRAY | NOT_REACHED |
| SR08-T02 | CONTEXT_CARRY | NOT_REACHED |
| SR09-T01 | GRAY | NOT_REACHED |
| SR09-T02 | CONTEXT_CARRY | NOT_REACHED |
| SR10-T01 | GRAY | NOT_REACHED |

## 4. 不作Gold变更的记录

- Wednesday候选仍为新开发输入，未运行，不提议纳入Gold。
- SR01-T01 yakiniku强度漂移只记录，不提议将旧Gold改成HARD迁就输出。
- G030历史日期键异常保留原样，未运行，不在本批修复。

来源逐条指针、旧值与待确认状态见pending-gold-review.json。
