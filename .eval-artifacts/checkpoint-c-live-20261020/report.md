> 本页是早期准备的 superseded retrospective；复核后的当前交付见 [review-followup/report.md](review-followup/report.md)。旧演练产物与冻结不覆盖。

# 检查点 C 离线准备交付

- Evidence status: current executable preparation；演练为 frozen regression，已暴露开发集，非 Clean Baseline。
- 工作分支：`codex/chore-checkpoint-c-prep`。开始前 fetch，起始集成提交 `3998076`；收尾把并发的五个探测证据提交同步至 `fe9b3fc`，生产代码、配置和批准输入与起始快照完全相同。未修改／推送集成分支。
- 本次运行：外站访问 **0**，真实模型 **0**，Live **0**，见证认证 **0**。同步的历史探测记录来自其他工作，本对话未执行它们。

## 已交付

[18 次计划](plan.md) / [机器顺序及预算](plan.json)：六例各三次、交错；500 秒／50 模型／40 Google；≥5 分钟间隔；403/503/429／繁忙页 15 分钟后单次重试；S0 立即停批；ENV_FAILURE / ORCHESTRATION_INTERRUPTED 唯一重跑范围，跨重复每例一次、全局至多十次。Live 前检查累计账本并预留剩余额度。

[完整 Runner 入口](runner-entry.ts) / [机械差异清单](runner-relocation.json)：复用生产完整 Runner，TableCheck 只做来源数据预检，增加 eval 输出／观察／传输边界。生产代码未改。批准变体 SHA `910ba0fd…e24e8b6` 完整值在 plan.json；[加载投影](runner-input.yaml) 只移除 role / derived_from 元数据，独立深比较所有业务字段。development-variant@3 的父数据 SHA 在外层显式校验，原变体／Gold／留出集未改。

[认证脚本](certify-witnesses.mjs) 和 [全部登记见证计划](witness-plan.json) 已准备，未执行。认证必须在 Live 前 24 小时内且先获用户批准；H001／吉祥寺的 11 月 3 日认证失败时，按原说明由复核者提议 11 月 10 日并再请用户批准，不静默改日期。认证／Live 授权 SHA 各自一次消费，换目录或重启不能重复启动。

[外层入口](outer.ts) → 原始 result → evaluator@30／rubric@26 → 独立 evaluation → 四层报告全部接通。条件保留 MET／NOT_MET／NOT_CHECKED 与展示对照；S0 声明／越界分别记录；P2-1、P2-2、P2-3 指标分别输出；缺失证据不计零次错误／成功。

## 验证

| 门禁 | 结果 |
| --- | --- |
| typecheck | PASS |
| arch:check | PASS，0 违规依赖 |
| npm test | PASS，978/978 |
| build | PASS |
| 本地 Chromium Fixture | PASS，122/122 |
| 外层控制 | PASS，8/8 |
| 外层 TypeScript（含完整入口）／认证脚本语法 | PASS |

[机器验证记录](verification.json) 和 gates/ 保留命令输出。首次默认测试和 Chromium 在沙箱内因本机监听／浏览器启动权限失败；随后仅放行本地 Fixture 测试后全绿，未以沙箱失败作为产品缺陷。浏览器测试刷新了一份既有 region-composition 输出，其新原始结果保存在本批 gates/，既有文件已还原，未覆盖历史证据。

最终 [离线演练报告](rehearsal-policy/report.md) / [逐次报告](rehearsal-policy/c-01-attempt-1/run-report.json) / [四层汇总](rehearsal-policy/batch-report.json)：1 次完整流水线，55ms，8 个脚本化模型响应，0 真实模型，0 网络，0 交付。脚本化空来源结果 HONEST_NO_RESULT；S0-声明 ABSENT，S0-越界 NOT_EVALUATED（无真实请求轨迹），绝不当作 Live 安全通过。运行前冻结提交 `d18c0aee69791fa162d1edee8ddcb97b0dc5a29e`，341 个文件；冻结包 SHA `961d5d62236c229ff4dc3762e93cc045588d9e51cb43b3e55d33bed02dc68157`。输出引用该 SHA；冻结后未改任何执行配置。

此前两次接线诊断失败（批准元数据／cohort 适配，脚本化地理输入不足）与中间成功演练保留，各自有独立 SHA；不是重跑 Live、不是能力分母。首轮 network-denied 记录实际是 tsx 的可选 Unix IPC 探测，被阻断且未建立 socket；最终 preload 对该可选 IPC 合成 ENOENT，外部网络仍全部拒绝。

## 四层评价及退出条件

1. **端到端：** 最终演练是脚本化 HONEST_NO_RESULT，证明流水线可产出原始 artifact、独立评价及报告；Live 0/18，不支持当前交付率或真实速度结论。
2. **逐环节：** P2-1 输出 native first-batch funnel／登记见证匹配；P2-2 输出 CHECK_AVAILABILITY 选店直接页路径／数量及耗时分解；P2-3 输出价格逐条件核对、展示一致性及交付店数。演练未认证见证、未选店交付，相关指标保持未评价，不能把合并 Live 用于三个包的独立因果归因。
3. **严重程度：** S0_DECLARATION／S0_BOUNDARY 独立；每次先核对已有原始 S0，再进行只读运行后复查。复查失败保留 result 和 evidence-gap sidecar，停批复核，不伪造见证或重分类。S1–S4 缺独立依据时保持未评价。
4. **归因：** 自动漏斗只输出 HYPOTHESIS；独立复核、既有探测和离线回放支撑具体归因。演练不证明当前网站、模型质量或泛化。

| Playbook §6 | 本次判断 | Live 汇总规则 |
| --- | --- | --- |
| 1 找得到 | NOT_EVALUATED，未跑 18 次 | 四个 TARGET 各 3 个有效样本且 ≥2 QUALIFIED_DELIVERY；保留排除／未评分母 |
| 3 安全 | NOT_EVALUATED | 每个新尝试 S0 声明／越界可评且零；全阶段历史声明要另附已冻结、独立复核的 ledger 及证据 SHA，本批零错误不替代历史检查 |
| 4 说得清 | NOT_EVALUATED，无交付 | 对每家交付店的每个原始条件核对状态／展示，缺行、未记录和误报不能通过 |
| 5 耗时 | NOT_EVALUATED，无交付 | 报告有交付运行的中位数／最长耗时及分母；180／300 秒仅目标，不是退出门槛 |

留出集条件 2 未运行。准备代码未改共享层或站点专用生产代码，条件 6 无新增产品变化。

## 停止点与复核项

本轮到推送准备分支后停止，等待复核，不执行见证认证或 Live。后续需用户批准认证、复核当前见证、全阶段安全／预算账本，再提交并生成 Live 冻结包和批准文件。

现有 evaluator 的运行后独立补充接口支持 Tabelog 四参数 GET。TableCheck 交付若缺独立运行后核验，脚本明确未评价并停批复核；本轮不增加预订表单读取权限或新来源适配。来源访问仍是未验证的能力限制，不据此改变产品目标。

Mock／Scripted Offline：本次 PASS；Replay、Live Read-only、Controlled Live-write：本次均未运行。

最终交付复核另确认：繁忙信号本身不能授予重跑资格，仍须 ENV_FAILURE 或 ORCHESTRATION_INTERRUPTED；该规则已纳入八项外层控制并在最终冻结后重跑完整离线链路。

Diff复核：源码／文档／结构化输入的行尾空白检查通过。原始门禁日志逐字保留测试渲染器的空白行和行尾空格，全分支默认whitespace检查会提示这些日志及EOF空行；不为消除提示改写审计原始输出。生产／批准输入diff为空。
