# G1复核确认与Runner后续切片

用户复核Q21–23、Q31–34确认；Q24/25先固定allowFreshRead=false、期望UNVERIFIED后同样确认，全部34题成为复核确认的已暴露离线验收集。原answers.candidate.json保留字节，问题/源页不改；在线重读后的回答留Agent接入后的评测。先用现有预检对旧数据取得allowFreshRead断言红灯，再修数据、冻结SHA、独立源页核对与五门禁，合main推送。

TableCheck阳性日历改为首次3b Live采集并用于新回放/G2，然后验收TC的G3；G3先Tabelog，本切片不实施G3、不运行Live。缺证停止已由用户后续安排解除，原停止记录留历史。

之后Runner独立集成分支基于B/0a466bcd，产品字节保持，新增A评测代码。Runner只读题目和页面，引用答案只供评分器。B核心调用集中一个适配文件，按新status/answer/citations(URL/readAt)/sensitiveCategory/reason映射，旧纯引用仅该文件临时转换。fixture先红绿，不调用真实模型；B新交付后只改适配文件复跑，ADR批准与B核心合main前Runner不合main。

全部新增真实调用0，不读.env。停止条件沿批次2规则，交付推工作分支供复核。
