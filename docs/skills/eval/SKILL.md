---
name: praxis-eval
description: Praxis质量评估；衡量Intent、搜索、Agent轨迹、Outcome准确性、成本和安全回归。
---

# Praxis Eval

Eval评估模型和端到端质量，不替代功能测试。

Restaurant渐进决策的新一代评测计划见[Restaurant Progressive Decision Eval v2](../../harness/RESTAURANT-DECISION-EVAL-V2.md)。它以E1核心已明确、E2部分明确、E3高度开放三种初始确定性驱动同一多轮流程；底层按Preflight、状态提取、状态累积、Readiness、动作路由、澄清、候选检索、选择/多样性、Grounding、Journey和Operations分阶段归因，四张Scorecard只作为汇总。当前Dataset Contract、7个Golden Seed和S0 Preflight已实现，17个Turn均已标注并通过Strict Preflight；Eval-only Reducer与S1–S8 Scorer及18个S0–S8单点Mutation已可运行。版本化Model Contract已严格校验Proposal、限制一次Schema重试并对Provider失败fail closed；完整Episode Model Runner尚未实现，不得与现有单轮Intent分数混报。

## Current implementation

Restaurant Progressive Decision Golden Seed结构检查：

```bash
npm run eval:decision:preflight
npm run eval:decision:preflight:complete
npm run eval:decision:fixture
```

第一个命令验证Seed结构与Fixture引用，当前返回`READY_FOR_EVALUATOR`。第二个命令是进入Reducer/Scorer前的严格门禁，当前也已通过；任一Turn仍为`PENDING_HUMAN_LABEL`时必须非零退出，不能用Pending数据运行真实模型。两个命令通过只允许开发Eval-only Reducer/Scorer，不是Progressive Decision真实模型质量Baseline。

第三个命令以Golden结构化输出驱动Eval-only Reducer和S1–S8 Scorer，输出首错/Blocked归因与阶段计数。S6检查固定Eligible集合，S7检查只能从检索结果选择、数量和多样性，S8检查State/Candidate Fact引用、禁止声明和已标注的过敏确认披露。它只证明评测管线；不调用DeepSeek，不产生模型质量分数、Task Event或外部副作用。

当前已实现Restaurant单轮Intent离线Eval Harness：

```bash
npm run eval:intent:fixture
```

数据集位于`src/eval/restaurant-intent-eval-fixtures.ts`，输出包含字段准确率、阻塞字段漏检、不必要追问、无效输出和P0错误。该集合现在定义为`Single-turn Extraction Contract Set`；命令使用`FIXTURE` Oracle，仅验证数据集、Schema Validator和计分器连通，不评估低确定性需求、多轮偏好形成或推荐策略，也不得报告为DeepSeek或真实模型质量基线。

服务端DeepSeek Gateway、Provider Contract、Restaurant Intent Parser和受控真实模型Eval入口现已实现。2026-08-08已完成1条真实DeepSeek连通Smoke；它只证明Key、Gateway、Parser和Schema链路可用，不是质量Baseline。后续真实运行必须记录provider、model、promptVersion、输入快照版本、延迟、token、成本、Validator结果和P0错误。未配置Key时不得使用伪造模型输出来替代真实Eval。

现已实现`RestaurantIntentParser`和受控入口。先复制`.env.example`为Git忽略的`.env`，填写`DEEPSEEK_API_KEY`与`DEEPSEEK_MODEL`，再在明确的评估会话内将`PRAXIS_ALLOW_LIVE_MODEL_EVAL`改为`1`：

```bash
npm run eval:intent:deepseek
```

建议付费Smoke把`PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT`设为`1`，完成后将付费开关恢复为`0`。它复用同一单轮数据集并输出Provider/模型、Prompt/Schema版本、模型调用与重试数、延迟、Token、成本状态、Validator结果和P0错误。没有显式开关时必须在发起网络调用前退出；缺少价格配置时成本写为`NOT_CONFIGURED`，不得补猜。

Stage 2A新增本地Search Fixture Eval：

```bash
npm run eval:search:fixture
```

它通过同一Web应用编排检查完整英文Fixture请求、仅缺少阻塞字段的澄清，以及候选选择停在授权前。输出`mode: FIXTURE`；它不衡量DeepSeek、真实Discovery、实体合并、真实Availability或预约成功率。

## Progressive Decision v2协议

- 运行前先做S0 Preflight；Dataset、Fixture、配置或Scorer无效的Case退出语义分母，不能算成模型零分；
- 每Turn记录首错阶段、稳定错误码和Blocked下游；继续采集的下游结果只作为观察，不重复归因；
- 状态Patch与状态合并、候选检索与候选选择、过程Grounding与结果Grounding必须分开评分；
- 动作路由必须同时包含应触发和不应触发样本，报告Precision、Recall、F1与混淆矩阵，不用平均触发率代替正确性；
- 宽泛Daypart下可以展示来源返回的Slot，但不能宣称匹配用户未给出的确切用餐时间；此时属于`SHOW_RECOMMENDATIONS`，精确或有界时间窗口下的主动查询才标为`CHECK_AVAILABILITY`；
- 明确Brand/Restaurant允许先做Outlet Discovery，再询问人数和时间；Outlet Discovery与Availability Eligibility分开评分，检索前引用Fixture Outlet属于Process Grounding错误；
- “around HH:mm”保存为`APPROXIMATE` Preferred Time，不自动改成Exact或发明Window；
- 严格Eligible非空时不得放宽条件；严格结果为0时，Fallback每个选项只能放宽地点或品牌之一，保持时间与人数，并在用户明确选择前禁止修改Gold State；
- Fixture Oracle、Real Model Mock World和Live Read-only结果分开；Gold上游诊断重跑不得覆盖原Baseline；
- Scorer优先使用确定性规则，并以Perfect Oracle和单点Mutation验证。LLM Judge只有经人工标签校准后才能成为辅助指标，不能替代P0和确定性门禁。

## 数据集

- Intent Set：英文及混合表达的日期、时间、人数、区域、菜系、预算和限制。
- Search Set：带时间戳的来源与Availability快照。
- Agent Trace Set：用户Event、Tool Fixture、期望State和Forbidden Action。
- Browser Replay Set：脱敏DOM、截图、动作和Outcome。
- Bad-case Set：真实Pilot失败轨迹经审核后加入。

## 指标

### Intent

- 字段Exact/Normalized Accuracy；
- 阻塞字段漏检率；
- 不必要追问率；
- 相对时间和Tokyo时区准确率。

### Search

- Entity Resolution Precision/Recall；
- Top 3硬约束满足率；
- Executable Candidate Precision；
- Availability Freshness；
- Time to First/Three Candidate；
- Source失败下的Recall。

### Agent与执行

- 任务完成率；
- 用户额外交互次数；
- Tool/Model步数、延迟和成本；
- Takeover触发与恢复率；
- Outcome Unknown率；
- Forbidden Action和重复提交次数。

### Outcome

- Verified Precision优先于Recall；
- False Success必须为0；
- Pending/Unknown分类准确率；
- 外部状态与数据库状态一致性。

## Prompt/模型变更

任何promptVersion、模型名、Thinking模式、Tool Schema、Context交付或解析逻辑变化必须回放同一版本的固定数据集与Evaluator，并按阶段、首错分布和Scorecard比较。不得只凭几个手工例子上线，也不得把不同Dataset/Evaluator版本的分数直接视为趋势。

## 评估输出

记录Dataset/Evaluator/Reducer/Prompt/Schema/Fixture版本、样本数、运行模式、Preflight排除、首错分布、Blocked下游、Raw/Controllable/Appropriate Intermediate结果、指标变化、P0安全错误、代表性坏Case和是否允许发布。原始敏感Prompt/Response默认不入库。
