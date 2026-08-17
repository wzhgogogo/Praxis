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

1. [当前状态](./docs/STATUS.md)
2. [开发文档索引](./docs/INDEX.md)
3. [MVP PRD](./docs/product/MVP-PRD.md) 与 [User Flows](./docs/product/USER-FLOWS.md)
4. [Architecture Overview](./docs/architecture/OVERVIEW.md) 与 [ADR Index](./docs/decisions/README.md)

根目录按日期命名的文件继续保留为研究与决策背景；`docs/` 是进入 Build 阶段后的稳定实施依据。后续 Agent 修改代码前必须遵循 [`AGENTS.md`](./AGENTS.md) 和项目 skills。

## 当前实现

Restaurant v16 已完成 Fixture 语义到搜索的受控链路：`Semantic Interpreter → Proposal Contract → Compiler → Task Runtime / Reducer → Decision Kernel`。稳定槽位以外的用户表达使用开放`CRITERION{text, polarity, strength}`，不让模型选择cuisine / constraint / preference taxonomy；模型不能直接修改权威 State 或执行外部动作。当前可用能力、验证证据、明确未验证项与下一道门槛统一维护在 [当前状态](./docs/STATUS.md)。

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

`.env`被Git忽略，浏览器不会读取其中变量；只有`npm run dev`、真实v16模型Eval和`npm run test:postgres:live`会以Node原生方式加载它。`npm test`、`npm run test:probes`、构建、Fixture Eval和Holdout Preflight不会加载`.env`，因此不会意外使用真实Key或触发付费模型请求。

```bash
npm install
npm run arch:check
npm run typecheck
npm test
npm run test:probes
npm run eval:semantic:fixture
npm run eval:semantic:holdout:preflight
npm run eval:search:fixture
npm run build
```

本地操作Stage 2B Web Fixture需要一个开发PostgreSQL数据库；在`.env`填写`DATABASE_URL`后，启动时会自动应用Migration：

```bash
npm run dev
```

然后在浏览器打开`http://127.0.0.1:3000`，使用本地Fixture Token `praxis-fixture-a`。可通过服务端`PRAXIS_PILOT_ACCESS_JSON`覆盖Pilot用户列表；不要把真实Secret放进前端。页面清楚标记为`Fixture mode`，它不是Live Search、生产身份或预约演示。

## Eval 与验证

默认只运行 Fixture / Mock / Embedded-postgres 命令。完整命令矩阵、每种模式的证明范围与历史结果见 [Test Skill](./docs/skills/test/SKILL.md)、[Eval Skill](./docs/skills/eval/SKILL.md) 和 [Test Log](./docs/history/TEST-LOG.md)。

`eval:semantic:deepseek`是 v16 主链的真实语义 Regression：`Interpreter → Contract → Compiler → Runtime/Reducer → Kernel → Fixture Search`。它不创建持久任务或外部副作用；运行前须在 `.env` 配置服务端 `DEEPSEEK_API_KEY` / `DEEPSEEK_MODEL`，并显式设置 `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1`。历史v14 Decision Harness、旧Intent Parser和v15分类Criteria Contract只从Git和日志追溯。

所有真实模型 Regression 都是已暴露样本，不能用于质量趋势或 Clean Holdout Baseline；当前进度与下一道门槛见 [当前状态](./docs/STATUS.md)。

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
