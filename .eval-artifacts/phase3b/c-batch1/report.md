# 3b对话C：批次1／停止点1

- 状态：**STOP_1_READY_FOR_REVIEW，工作分支未合main**；基线main/cc127320（phase3a-prime-signoff）。分支 `codex/fix-phase3b-identity-and-named-target`，只推本分支供复核。
- 四项离线工作完成。身份/检索只有方案、Gold只有待确认清单；具名目标只修Prompt指令并验证内部组合，**真实模型遵循率未评**。
- 五门禁 **全绿**：typecheck、arch、默认 **1101/1101**、build、本机Chromium **162/162**；每项前后git status为空。固定开发Fixture **15/15**，语义定向 **8/8**。
- 3b共享账本已保留可见A/B/C唯一条目并集，新增 **Live0、真实模型0、环境重跑0、评测GET0、Google0、网站0**。不读取/加载/暂存.env，不读私有Holdout。

## 1. 交付内容

| 项目 | 结果 | 证据 |
| --- | --- | --- |
| 店名解析基线 | 29家保存页使用当前纯parser/resolver复算：12正确、17未接纳、0错认；未冒充当前Agent整链重跑 | [逐家结果](../g4-name-resolution/report.md)、[原始复算](../g4-name-resolution/recomputed.json) |
| 失败分布 | 14明确空检索、1身份字段遗漏、1字段冲突、1检索未决；检索词因果未测，1例20候选但未证实截断导致失败，基准超时0 | 同上 |
| Dengana | 八份F5全查，六份Akabane/Dengana适用、两份其他请求。搜索、模型、提交、详情导航、父超时分别归因；没有把其他门店的正确拒绝解释为身份规则太严 | [八份分步计时](../g4-name-resolution/dengana.json) |
| 改进方案 | 模型提议原文片段检索、同店050/固定电话对应、完整地址与坐标佐证，逐项列对象、收益界限、误认风险与反例；身份规则未放宽或实施 | [方案](../g4-name-resolution/proposal.md) |
| 具名店修订 | 预先报告后Semantic Prompt25→26，保留既有query/SPECIFIC_OUTLET跨条件补充和目标切换；明确换店/撤销仍可替换。Schema4/State23/TaskDefinition21不变 | [红灯与证明边界](../named-target/report.md) |
| Gold清单 | 15项标签建议逐条待确认；query丢名、no smoking的否定文本和collection CONFIRM不通过改Gold掩盖。Gold4 SHA不变、旧Gold3保留 | [逐条清单](../semantic-gold-review/report.md)、[完整盘点](../semantic-gold-review/inventory.json) |

nr-002存在同店050原文而当前提取遗漏；nr-029真实号码差一位，只能另查完整地址/名称证据。两家恢复仅是有保存证据的潜力上界，**未把12/29报成14/29**。十五个未找到对象没有替代检索响应，不编造删词后的成功率。Dengana原槽2查到的是其他推荐店，拒绝是正确行为；不能以放宽身份规则弥补召回失败。

[ADR-0047](../../../docs/decisions/0047-phase3b-observed-actions-and-cited-answers.md)写入用户批准的两项3b验收原则：动作依赖当次可观察页面、问答逐字引用并核对同店/本次读取。G1/G2/G3按各对话单独验收，此ADR不宣称已实现；G5/G7未进入。身份准入任何放宽仍须先停下，经复核者及用户批准。

## 2. 红绿证据与四层评价

**红灯：** 0895a3b7冻结745项后，原SR03两份实际提议只替换模型传输，经过生产Interpreter→Compiler→TaskRuntime。第二轮在Compiler前已丢Sushi Dai；权威状态独立断言失败。合法保名提议的同链反事实控制通过。另有旧Prompt25缺跨目标保名指令的wire红灯；Prompt26指令接线后绿灯，符合提议的多轮补时/人数、换店、撤销点名均通过。固定坏响应不会随Prompt字符串变化而自动变好，未声称代码已阻断所有丢名结果。

1. **端到端：NOT_EVALUATED。** 本批没有新真实模型、来源、用户结果交付或预约；离线产物交付不等于餐厅任务完成。
2. **逐环节：** 原检索数据的parser/resolver局部12/29、0错认；当前Agent搜索策略与替代查询收益未测。SR03先在模型提议偏离，Compiler/Reducer忠实应用；新wire和合法fixture组合通过，真实遵循率留后续。
3. **严重程度：** 来源/交付S0–S4不作总体判定；本29份错认0有独立冻结URL-ID核对，但旧基准网络链缺证保持。没有新现实副作用；fixture保存转移无commands/goalBasis入State。
4. **归因：** 不把所有未找到归为检索词，不把所有Dengana超时归为电话，不把模型重复错误当Gold依据。给出原文支持的原因与未决项，Prompt增强效果不能凭本批零真实调用作因果断言。

## 3. 冻结、验证和归属

初始输入/脚本冻结0895a3b7（745项）；Dengana/Gold只读观察器先在6469210a冻结。WEBSITE辅助来源的观察器误删失在@2纠正，旧v1结果原样保留，数据和身份结论未改。最终候选 **d9b38cd21b958d27f91eb3402c73e4ec6e51c675**，[752项当前冻结](post-fix-input-sha256.json)已提交后才运行门禁，结束后逐项SHA仍匹配。

[门禁原始收据](gates.json)时段 **2026-10-26T22:52:30.471+01:00 — 2026-10-26T22:54:41.865+01:00**，CET UTC+1；全部首轮通过、未做门禁修复或追加真实调用。源码仅三个C所属文件改变：semantic-interpreter.ts、semantic-proposal.ts及同文件测试。A/B代码、src/eval、src/harness、身份/检索代码、Gold、Compiler/Reducer、State/TaskDefinition均与基线相同。[独立复核](independent-review.json)不使用生产HIGH自证总体S0。

## 4. 待复核决定与停止点

- 复核C的Prompt26指令范围及离线证明边界；真实模型验证留之后批次。
- 身份/检索方案只讨论，不实施或扩大采集来源/调用预算；先确认证据契约、收益试验和反例。
- 对Gold清单15项逐条确认后才建Gold5并保留4；本批没有改标。
- 按用户指令推工作分支并停在**停止点1**，不合main、不追加调用。
