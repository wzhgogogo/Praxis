# 3b对话C：批次1候选

Status: candidate / not integrated，待停止点1复核；基于main/cc127320，分支codex/fix-phase3b-identity-and-named-target，不合main。

四项已按本批范围完成离线候选：

1. [29家基线与八份F5/Dengana分析](../g4-name-resolution/report.md)：当前保存页复算12/29正确、0错认；并非当前Agent整链重跑。Dengana六份适用、两份其他请求，逐步耗时与删失均保留。
2. [店名解析方案](../g4-name-resolution/proposal.md)：只写方案；检索片段、同店电话对应、完整地址与坐标各列预期对象/证据界限、误认风险和反例，没有放宽或实施身份规则。
3. [具名目标](../named-target/report.md)：有效坏提议回放与Prompt wire红灯保留；预先报告后仅Semantic Prompt25→26，Schema4/State23/TaskDefinition21不变。定向fixture8/8；原坏提议仍不代表修复后模型成功，真实遵循率未评。
4. [开发Gold逐条清单](../semantic-gold-review/report.md)：15项标签建议等待逐条确认，query/CONFIRM/否定文本不通过改Gold掩盖；Gold4原SHA不变，私有Holdout未读。

[ADR0047](../../../docs/decisions/0047-phase3b-observed-actions-and-cited-answers.md)记录用户批准的3b两原则与实现分工，不把未来G1/G2/G3写成现有能力。共享账本保留A/B/C条目，新增Live/模型/环境重跑/评测GET/Google/网站均0。不加载.env。

五门禁将在干净冻结提交执行，结果保存gates.json。批次完成后推本分支供复核并停停止点1，不合main；身份准入放宽与Gold改版均等待后续明确批准。
