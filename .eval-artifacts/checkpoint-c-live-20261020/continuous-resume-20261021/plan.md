# 检查点 C：复核通过后连续验收

Evidence status: current executable; exposed development, not Clean Baseline.

用户批准 a6fa26c，复用 planning/test/eval/post-change-verify 当前切片：合入已复核修复并冻结；原外层只用已批准的 --run-ids c-01,c-02,c-05 进行快速验证，单独目录、计入完整 Live 额度、不计 C18。代码、原18计划、Runner、评测器@30/rubric@26与运行规则保持冻结。

验收：复用同69点69/69、选店5/5、校准22/22的已审核离线输入/结果；合并后五门禁全绿。快速3次须0次S0且至少2次QUALIFIED_DELIVERY。旧见证须在2026-10-21 20:26北京前完成，超时先认证。快速报告逐家列选中确认、find_vacancy捕获、base_date/members、时段和运行后独立GET；未覆盖的比较显式NOT_COVERED，不补造。

快速验证通过后按原witness-plan重新认证6例（0模型），每例≥1家支持；同源≥30秒，传输无状态等2分钟重试1次，403/503/429/繁忙等15分钟重试1次，仍失败停，11月3日失败不改日期。提交登记和最终冻结后原计划完整18次；相邻≥5分钟、S0立即停、仅ENV_FAILURE/ORCHESTRATION_INTERRUPTED每例最多重跑1次且合计≤10、500秒/50模型/40Google，必须最早见证观察后24小时内完成。

只读、不打开预约表单、不点时段。任何门槛失败立即停止后续阶段，产出四层报告、如实账本并推送。每阶段提交推送，冻结期间不修改配置。禁止用旧页时段子集或事后GET回填历史运行时响应。
