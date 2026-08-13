# Project Praxis（知行）

> **Not just answers. Outcomes.**

**中文名：知行**  
**英文名：Praxis**

Praxis（知行）是一个面向个人生活事务的 Personal AI Agent 项目。它通过 Public Knowledge 理解现实世界中的事务和流程，通过 Private Knowledge 理解具体用户的情况、偏好与历史，并在获得授权后进行规划、执行和持续跟进，直到产生可以确认的结果。

项目关注的不是让 AI 提供更多建议，而是减少用户处理琐碎、繁杂、耗时事务时，在网站、App、邮件、电话、文件和不同机构之间反复拉扯的时间与精力。

- 中文核心定位：**懂你所需，替你成事。**
- 英文核心定位：**Not just answers. Outcomes.**
- 项目使命：**从理解需求出发，把生活事务推进到真实、可验证的完成结果。**

完整的中英文名称、介绍与定位见：[项目定位](./docs/PROJECT-POSITIONING.md)。

## 当前 Build 决策

截至 2026-08-04，Praxis（知行）确定从 **日本市场的 Local 场景**开始 Build。

第一阶段不是验证“日本 Local 查询占比高，所以产品一定成立”，而是用一个高频、跨平台、跨时间并具有明显碎片化特征的真实场景，验证 Praxis 的核心闭环：

```text
理解目标 → 建立有状态任务 → 整合信息与约束
→ 推进下一步 → 跨时间跟进 → 确认结果
```

当前 MVP 以 API 为优先执行路径；没有可用 API 时使用经过验证的 Browser Adapter，并在登录、验证码、银行卡或高风险条款处由用户临时接管。未知或未验证的网站降级为 Human Takeover 或 Deep Link，不把“万能 Browser Agent”作为启动前提。早期阶段决策背景见：[日本 Local 市场切入与 Build 决策](./docs/brainstorming/2026-08-04-日本Local市场切入与Build决策.md)。

## 开发文档

Praxis 已建立开发前 Source of Truth，后续 planning、coding 和 verification 从 [开发文档索引](./docs/INDEX.md) 开始。

推荐阅读顺序：

1. [Tokyo Restaurant Agent MVP PRD](./docs/product/MVP-PRD.md)
2. [MVP User Flows](./docs/product/USER-FLOWS.md)
3. [Architecture Overview](./docs/architecture/OVERVIEW.md)
4. [ADR Index](./docs/decisions/README.md)
5. [Roadmap](./docs/roadmap.md)

根目录按日期命名的文件继续保留为研究与决策背景；`docs/` 是进入 Build 阶段后的稳定实施依据。后续 Agent 修改代码前必须遵循 [`AGENTS.md`](./AGENTS.md) 和项目 skills。

## 当前实现

Stage 1已完成最小控制面和 Harness，Stage 2A完成本地 Fixture Search 闭环，Stage 2B完成 Persistent Agent Shell。当前 Restaurant v15 已将不可信模型输出收敛为明确的受控链路：`Semantic Interpreter → Semantic Proposal Contract → Compiler → Task Runtime / Reducer → Decision Kernel`；LLM 只能提出语义 Proposal，不能直接修改权威 State 或执行外部动作。完整边界与事件流见 [ADR-0007](./docs/decisions/0007-semantic-proposal-compiler-and-decision-kernel.md)。

当前全量自动化基线为 **147 个测试**，覆盖语义 Proposal Contract、Compiler、Reducer、Decision Kernel、Fixture Harness、嵌入式 PostgreSQL 集成及 Stage 2B Web/API/SSE。v15 另提供真实模型语义回归：`DeepSeek → Interpreter → Contract → Compiler → Runtime/Reducer → Kernel → Fixture Search`；它只验证理解和确定性状态链路，不创建持久任务，也不调用外部写工具。最近连续 10 次 DeepSeek Regression 均为 7/7（合计 70/70）通过，属于已暴露样本的 `DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`，不能作为模型质量趋势或 Clean Holdout Baseline。详细口径、结果与版本注意事项见 [Test Log](./docs/test-log.md) 和 [DevLog](./docs/devlog.md)。

Pilot 用户可在 Desktop/Mobile Web 恢复同一 Conversation 与 Restaurant Case，查看候选、下一步和由权威 Event 生成的 Activity，并通过可重连 SSE 接收最新 Case Snapshot。选择候选后仍停在授权前。真实平台、跨浏览器和真实移动设备验证仍未运行；下一步的真实模型质量结论必须来自冻结模型、Prompt 与 Schema 后的新建 `CLEAN_HOLDOUT`，而非本回归集。

生产数据库Adapter使用`pg`；PGlite用于快速嵌入式数据库集成验证，不能替代真实PostgreSQL。2026-08-07已在隔离本机PostgreSQL 17数据库上通过真实Smoke，覆盖Runtime、迁移、Goal/Task Graph和Scheduler；后续可对专用测试库显式运行：

```bash
PRAXIS_TEST_DATABASE_URL=postgres://... \
PRAXIS_ALLOW_TEST_DATABASE_WRITE=1 \
npm run test:postgres:live
```

该命令会创建Praxis表并写入后清理一条临时Task，只能指向允许写入的测试数据库。

环境要求：Node.js 24及以上。

需要连接本地数据库或反复运行真实模型 Eval 时，先建立仅本机可见的配置文件：

```bash
cp -n .env.example .env
```

`.env`被Git忽略，浏览器不会读取其中变量；只有`npm run dev`、真实模型 Eval（包括`npm run eval:semantic:deepseek`与`npm run eval:intent:deepseek`）和`npm run test:postgres:live`会以Node原生方式加载它。`npm test`、构建、Fixture Eval和Decision Seed Preflight不会加载`.env`，因此不会意外使用真实Key或触发付费模型请求。

```bash
npm install
npm run typecheck
npm test
npm run eval:intent:fixture
npm run eval:decision:preflight
npm run eval:search:fixture
npm run build
```

本地操作Stage 2B Web Fixture需要一个开发PostgreSQL数据库；在`.env`填写`DATABASE_URL`后，启动时会自动应用Migration：

```bash
npm run dev
```

然后在浏览器打开`http://127.0.0.1:3000`，使用本地Fixture Token `praxis-fixture-a`。可通过服务端`PRAXIS_PILOT_ACCESS_JSON`覆盖Pilot用户列表；不要把真实Secret放进前端。页面清楚标记为`Fixture mode`，它不是Live Search、生产身份或预约演示。

`eval:semantic:deepseek`是 v15 主链的真实语义 Regression：它验证 `Semantic Interpreter → Contract → Compiler → Runtime/Reducer → Kernel → Fixture Search`，不创建持久任务或外部副作用。`eval:intent:fixture`与`eval:intent:deepseek`保留为旧 Intent Parser 的 Eval/连通性工具，不代表 v15 产品路径。在`.env`配置服务端`DEEPSEEK_API_KEY`、`DEEPSEEK_MODEL`后，只有把`PRAXIS_ALLOW_LIVE_MODEL_EVAL`显式改为`1`才会发起付费网络请求。建议先将`PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT`设为`1`控制成本，然后运行：

```bash
npm run eval:semantic:deepseek
npm run eval:intent:deepseek
```

执行完一轮付费评估后，将开关恢复为`0`。可选的`PRAXIS_DEEPSEEK_INPUT_USD_PER_MILLION_TOKENS`和`PRAXIS_DEEPSEEK_OUTPUT_USD_PER_MILLION_TOKENS`必须一起提供；否则报告将透明标记成本为`NOT_CONFIGURED`，不会猜测价格。

`eval:decision:preflight`与`npm run eval:decision:preflight:complete`检查7个Progressive Decision Golden Seed Episode的结构、Outlet Discovery、Candidate Fixture、无锚点Flexible、过敏披露门禁、单约束Fallback和引用；当前均返回`READY_FOR_EVALUATOR`。这只允许运行Harness-only Evaluator，不代表已通过真实模型Baseline；标注按完整Episode批量审阅，流程见[Golden Seed Annotation Guide](./docs/harness/RESTAURANT-DECISION-GOLDEN-SEED-ANNOTATION.md)。

`npm run eval:decision:fixture`已可用：它以Golden结构化输出验证Eval-only State Reducer和S1–S8阶段评分，当前Fixture Oracle全部通过。`npm run eval:decision:model:fixture`再用本地Golden Fixture Gateway贯通完整Episode Runner；它严格Preflight、交付明确候选上下文、调用Model Contract、组装S6并评分，仍不是模型质量结果。Golden v0.9 / Prompt v11把命名目标解析、候选不足、Fact引用、相对时间、结构化地点策略、状态抽取边界和动作路由矩阵都限定在Harness/Fixture边界内；这不是接入真实Discovery或地图。`PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=3 npm run eval:decision:deepseek:smoke`固定运行E1/E2/E3各一个Episode；如需覆盖当前全部Regression，可显式运行`PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_DECISION_EVAL_SCOPE=FULL_REGRESSION PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=7 npm run eval:decision:deepseek:smoke`，它会运行7个Episode、17个Turn。两种范围都会标记为`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`，因为当前全部Golden Seed及其结果都已参与Prompt开发。2026-08-12的v11全量Regression在用户明确授权DeepSeek数据出境后完成17个Turn评分，17次调用、0次Schema retry、P0为0；12/17个Turn无首错，剩余首错为2个S3、2个S1和1个S7。仅在静态Golden Fixture诊断时可额外设`PRAXIS_EVAL_SHOW_COMPLETIONS=1`，把每次Completion和逐次校验错误打印到本次终端，不写入文件或普通遥测。

实现状态和后续边界见：[Task Runtime](./docs/architecture/TASK-RUNTIME.md)、[Restaurant Domain](./docs/domains/RESTAURANT-BOOKING.md)与[Roadmap](./docs/roadmap.md)。

## 记录方式

每次形成一份按日期命名的 Markdown 文件，统一回答四个问题：

1. 哪天讨论；
2. 讨论了什么；
3. 得出了什么结论；
4. 接下来怎么做。

讨论记录应区分：

- 已形成共识的判断；
- 仍需验证的假设；
- 暂不展开的议题；
- 明确的下一步行动。

## 当前记录

- [项目中英文名称、介绍与核心定位](./docs/PROJECT-POSITIONING.md)
- [2026-08-04：日本 Local 市场切入与 Build 决策](./docs/brainstorming/2026-08-04-日本Local市场切入与Build决策.md)
- [市场、切入场景与可行性分析](./docs/brainstorming/personal-agent-data-validation.md)
- [Proposal 工作稿：Project Praxis（知行）C端 Personal AI Agent 方向探索](./docs/brainstorming/2026-07-15-C端Personal-AI-Agent方向探索.md)
- [2026-08-01：Personal AI Agent 与 Public Knowledge 建设方法讨论](./docs/brainstorming/2026-08-01-Personal-AI-Agent与Public-Knowledge建设方法讨论.md)
- [讨论记录模板](./讨论记录模板.md)
- [开发文档索引](./docs/INDEX.md)

## 相关原始材料

- Proposal 最初从原始文件复制到本目录，目前已更新 Project Praxis（知行）的名称、介绍和定位；未经改写的原始版本仍保留在：`/Users/wangzhour/Desktop/Wang/简历/微软Project/JD-main/离职文件/Claude讨论/2026-07-15-C端Personal-AI-Agent方向探索.md`

当前目录作为 Project Praxis（知行）的独立研究和决策记录。待核心定义、数据方法和验证方案稳定后，再将阶段性结论整合回正式 Proposal；原有讨论内容保留在 Proposal 的 Appendix。
