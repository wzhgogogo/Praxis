# Phase2b 批准连续任务

Status: steps1–2 passed; resumed step3 READY_WITH_APPROVED_NO_WITNESS_EXCLUSION; steps4–5 authorized and pending execution. Previous HTTP400 stop retained as historical snapshot; current continuation: resume-20261023/plan.md. No production/Prompt tuning after new holdout opening.

批准依据：用户本轮连续任务；预算200e13cf、团体98cc7994、流水线47afd2d7；模型总额06703ba1批准5000（包括历史调用与回放），完整Live100、环境重跑10不变。

1. 依次合入准备分支，保留各方行为/测试/历史记录，统一版本。仅同步06703ba1批准文档，不合入无关主开发变更。当前生产State20/TaskDefinition18，Prompt及Evaluator33/rubric29不变。预算门禁与新账本采用5000，旧账本不改写。实际五门禁；生产观察重建69点>=68、选店5/5；严格相同模型内容可使用已保存真实响应，非新模型质量测量；独立22/22校准；旧例02的Router→Reducer预算5行须与@33一致。提交/冻结后才能下一步。
2. 三次完整Live，仅作检查：旧例03（6人、18:00–20:00）两次，中间穿插旧例01一次。现有见证最早截止2026-10-23T06:41:36.126Z，每次开始前检查500秒余量，不续期。30秒决策、500秒总限时、50模型/40Google，运行间隔>=5分钟，只读、禁/reserve、不点时段；按原重试/节奏和S0停批规则。报告Tabelog首次到达、首批见证与时间窗观察。机械门槛：S0 PRESENT0，例03至少1/2 QD，例01 QD；失败即停。
3. 仅前两步通过后核对Phase2b承诺并打开指定分支原文，不存在就停；严格字符串和SHA校验、填日期及Runner格式，0模型查找认证见证。30秒来源间隔，传输2分钟一次，403/429/503/繁忙15分钟一次，仍失败停。业务无见证按允许fallback查找，仍无则标无见证/不计能力分母，不停批；不得把传输失败当无见证换地。提交冻结。
4. 六例各3次共18，同例不相邻，全部在最早见证24小时内。原Runner、Guard和独立安全检查；预算及停止规则不改，能力评价延后。
5. 跑完仅抽未对应措辞对，无结果/条件/库存结论；推送后停，等待独立判词。本轮不调用能力Evaluator评价新18次。

各步完成或停下均提交账本、冻结和对应四层记录；不因授权连续步骤而越过机械门槛，不把Mock/Replay当Live，不改旧Gold/原运行/原评价。
