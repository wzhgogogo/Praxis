# 同店候选合并与 D02V-r1 离线补评

2026-11-12 CET；工作分支候选，未合 main。基线 `105a8b0a825f4dd729674ffb26847d4b13f60771`；完整门禁源码 SHA `cff31e942efce715ac8361e2bfef10d066398ff1`。

**根因：** 原 `native-restaurant-search.ts:199–209` 的去重存在，但只比 candidateId、Google ID，或名称+完整地址+电话一致。r1 的 `sumika` 与 `Nakano Robata Sumika`、日文与英文地址无法通过该比较；Google 身份核对到共同来源店号发生在各自查位流程内，未回流合并。`RestaurantExecutionRouter` 随后逐 candidateId 派发；Reducer 也只按 candidateId 去重。对应 r1 两次 provider attempt，相隔约25秒，#15–17 多了一次名称搜索，两个交付候选和 B1 实为同店。详见先于修改写出的 root-cause.md。

**修复：** 在现有发现合并入口，复用本次已解析的详情及来源包现有身份核对器，两个来源包均接入；只有 HIGH、唯一、相同 provider/sourceEntityId 且无已核实身份冲突才合并。保留原生导航、Google sourceIds 与重绑定的佐证，并记录被合并 candidateId。移除仅凭联系人文本一致的旧合并路径。没有新增域名、URL规则、店名/菜系词表、模型动作覆盖或外部读取；未核实、LOW、不同身份及冲突均不合并。

**红绿与回归：** 修前5个目标断言失败，原日志保留；修后定向17项通过。r1真实候选/详情投影组件和生产发现接线证明：Google 别名在返回候选前合并，只派发一次库存读取、展示一个候选、一条来源 B1；不会再把该 Google 别名派给名称搜索。使用来源 I/O 替身和录制数据，不冒充完整网站JS回放或新Live。

| 补充的候选池组件 | 修前→修后候选数 | 原交付保持 |
| --- | --- | --- |
| 03-r1 / r2 | 40→40 / 40→40 | 各1家，原ID保留 |
| 07-r1 / r3 | 37→37 / 42→42 | 1家 / 2家，原ID保留 |

无误合并；上述四池均无需要合并的已证实重复项。完整净树门禁同 SHA：typecheck、arch、build、默认 **1610**、Chromium **281**、G6 **159** 全 PASS；D4/D8、D02-V组件回归保持。D02-V 44.508秒仍是历史组件计时投影，不是新Live成绩。双完整SHA基线 `ead289450092ccc30798b754d1e0771462bf08bd`、`105a8b0a825f4dd729674ffb26847d4b13f60771` 新增产品写死均 **0**。

**r1补评：** 两个B1逐字相同；原独立 sourceIdentity/Google原响应桥接为同一店铺；`captured-snapshot:16:response:2` 与原HAR HTTP200响应一致，覆盖店号、12-10、members=8和20:30原链接。独立 Categories 原文含 Robatayaki，Google原响应坐标到原解析中心约 **259.641m≤1000m**，两条资格注释用未修改的 evaluateG6 重评均 PASS。独立复核补评结论为 **qualified=true / QUALIFIED_DELIVERY / s0=0**，并注明：**“同一店铺重复展示，属于已在本分支修复的产品缺陷”。**

补评保存于 `review/evaluation.supplement.json`，标明是独立复核结论，不是假称自动评分器输出。`review/evaluation.qualification-supplement.json` 保留未改评价器仍将别名 B1_SOURCE_URL 记为 NOT_EVALUATED 的自动结果；三点人工复核证据单列于 independent-proof.json。原评价与53d65185证据逐字节一致，src/eval改动为0。DOM电话已遮盖，身份电话桥使用当次独立评测保存的 sourceIdentity 与Google原响应，不使用生产HIGH，不恢复遮盖内容。可离线重现：`node --import tsx .eval-artifacts/phase3b/seed-same-outlet-merge-20261112/review-recorded-r1.mjs`。

本轮 **0 Full-Live / 0 网站GET / 0 真实模型调用**。主工作区与三旧账本+r4账本前后哈希一致；r4仍余 **1 Live / 9 GET / 73模型**。仅推指定修复分支，停止待复核；不合 main、不跑 r2。
