# 检查点 C 复核收尾：离线交付

- Evidence status: current executable preparation；脚本化演练 frozen regression，已暴露开发证据，非 Clean Baseline。
- 复核基准：[independent-review.md](../independent-review.md)（4ac68fa）；已合入最新指定集成 a3f6b84。五份文档冲突保留双方记录，见 [合并保留检查](merge-retention.json)。相对 a3f6b84 的生产代码、配置和批准变体 diff 均为空。
- 本轮外站 0、真实模型 0、见证认证 0、Live 0；本地测试仅访问 localhost Fixture。

## 完成项

1. **合并与门禁：** typecheck／arch:check／build PASS，默认测试978/978，本地 Chromium122/122。集成双方改动都保留，未推送集成分支。
2. **TableCheck：** 已审核且实际由 Guard 派发的同店库存请求，外层保留原 URL／方法／请求体做一次独立复查；评测侧自己的解析器读取原始响应，不调用生产 parser。未审核、无法绑定或无法独立解析时，保存运行时库存响应路径／SHA，S0-声明明确 NOT_EVALUATED 并继续；不把较弱的运行中证据称为独立运行后复查。S0 PRESENT 仍优先立即停批。原 evaluator@30/rubric@26 sidecar 保留，外层补充用 checkpoint-c-tablecheck-review@1 标记，不覆盖原始 result。
3. **累计账本：** [phase2-ledger.json](../phase2-ledger.json) 已提交，并与所有来源 SHA 一起冻结。第二阶段含 P2-0：2次整单Live、469模型（包括回放）、0正式整单环境重跑。P2-0前1014模型另列保守扣账，共1483/4000，剩余2517；第二阶段 Live剩余98、环境重跑剩余10。P2-1的14次决策回放包含在347中；另计P2-2的15次选店回放及35次名称基准。所有失败付费调用计数；预检失败计数与整单环境重跑分开。
4. **冻结和演练：** 当前冻结后1次完整外层→完整Runner→@30评价→四层报告通过，54ms，8个脚本响应，0真实模型／网络／交付；结果 HONEST_NO_RESULT。没有用脚本结果认证真实库存或 Live 成功。较早演练在来源 ID 形状控制前完成，作为 superseded retrospective 保留，未冒充最终冻结结果。

## 红灯／绿灯与证明范围

- [旧未知即停批红灯](tablecheck-policy-red.txt) 在目标断言处失败；[14项外层绿灯](outer-controls-source-binding-green.txt) 通过，覆盖未知继续、S0优先、已审核原样重放、未审核0请求＋原始SHA、独立解析正负例、账本漏回放／不足拒绝。
- 生产当前 sourceEntityId 可为 slug 或 shops/slug；把已有复查控制换成真实 shops/slug 形状得到 [绑定红灯](tablecheck-source-binding-red.txt)，修正评测侧绑定后恢复同一控制。
- [真实Chromium／Guard控制](tablecheck-capture-browser-verified.txt) 1/1：本地接收端收到的原请求字节不变，外层保存的响应字节／SHA一致，不保留响应Cookie头。复用 Guard 既有真实浏览器语义，新增捕获不是靠假 Route 自证。
- 外层 TypeScript 检查 PASS；[机器验证](verification.json) 汇总全部路径与SHA。5个代码门禁证明离线代码；没有外站、真实模型、当前库存或认证结论。

## 待批准的冻结标识

- 冻结代码提交：`1d40f62bfdb20564a80e7601035dc5dfbfad0d96`。
- 冻结包：[live-freeze-reviewed.json](live-freeze-reviewed.json)，364个文件。
- **SHA-256：`4141d17db6601e404a6c3e23a8adae04e2f2bfa1833de8875091d4e40487ce4c`**。
- 本包绑定代码、输入、外层、独立审核规则、累计账本及其来源、Playbook 和复核原文。演练后执行配置不变。见证认证尚未运行；实际 Live 之前仍须在24h内经批准认证，并提交和绑定该批 registry／原始见证证据 SHA，再按批准的冻结范围启动。

## 四层报告与阶段退出

1. **端到端：** [最终演练报告](rehearsal-reviewed/report.md) 及 [逐次结果](rehearsal-reviewed/c-01-attempt-1/run-report.json) 完整产出；Live分母0/18，不给真实交付率。
2. **逐环节：** P2-1首批见证、P2-2直接页选择／耗时、P2-3价格／展示分别保留。TableCheck输出独立复查和运行中原始证据两种强度；未知语法保持未评，不从status=success、日历日期标志、failure/data:null或无链接推导有位／无位。
3. **严重程度：** S0-声明与越界分别记录。NOT_EVALUATED继续运行只改变停批规则，不变成0错误或最终安全通过；任何PRESENT不被补充评价抹掉。历史全阶段S0独立签收仍单列未评价，预算对账不是安全认证。
4. **归因：** 无新网站／模型／当前见证，不作合并Live的独立因果归因。Playbook退出条件1、3、4、5在本轮均无Live验收，5仍仅为耗时指标。

## 预计用时与停止点

- **见证认证：30–60分钟，0模型。** 16家登记店约32个基础GET，登记party页最多另1个；纯传输按每GET20秒上限约11分钟，人工身份／HARD复核包含在30–60分钟建议窗口内。
- **18次：通常3–4小时。** 满额500秒×18＋17个5分钟间隔＝235分钟（3小时55分），另预留独立运行后复查，建议为满预算情况安排4–4.5小时。403/503/429冷却及环境重跑另加。
- 推送准备分支后停止等待批准。未运行认证／Live；未改Gold、批准变体或留出集。当前审核配置和执行边界见 [plan.md](plan.md)。
