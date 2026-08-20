---
name: praxis-test
description: Praxis测试策略；覆盖纯函数、状态机、Connector Contract、Harness、Browser、API和受控真实执行。
---

# Praxis Test

当前仓库已建立TypeScript Mock垂直切片。以下命令已实现：

```bash
npm run typecheck
npm run arch:check
npm test
npm run test:probes          # 冻结的Goal/Scheduler合成探针，不属于当前产品门禁
npm run build
npm run test:postgres:live    # 需要显式测试数据库配置与写入确认
npm run eval:restaurant:search:fixture
npm run eval:restaurant:semantic:fixture
npm run eval:restaurant:semantic:holdout:preflight
npm run eval:restaurant:semantic:deepseek # 需要显式真实模型开关；不是默认测试
```

`npm test`当前产品基线为 **98/98**（2026-08-20）：覆盖Core Unit/Contract、Restaurant Verifier、16个Mock Agent Loop Harness场景、3个Provider Router参数/Deadline场景、14个PGlite Runtime/Recovery/Migration场景、Fixture Web/API/SSE、语义 Proposal / Compiler / Reducer / Holdout Preflight与分层Scorer、Fixture Search及真实模型付费门禁/计量。新增断言证明Router绑定权威只读参数、Provider失败不归因为模型，且协作或忽略abort的Provider read都会被Router deadline有界截断；`SELECTION_REQUIRED`保持Agent可恢复，以及timeout/step/rejection限制均留下持久状态和trajectory；历史Decision Harness、旧Intent Parser和分类Criteria Contract不再混入当前基线。

`npm run test:probes`为独立的**8/8**冻结探针基线：Goal Graph、Trigger/Scheduler、Recurring Shopping与Long-running Case。它保护仍保留的有界架构探针，但不作为Restaurant当前Stage的产品门禁。Fixture与Embedded-postgres都不证明生产身份、真实PostgreSQL、Browser视觉、Replay、Live Read-only、真实模型Baseline或Controlled Live-write；完整历史见[Test Log](../../history/TEST-LOG.md)。

PGlite结果必须报告为`embedded-postgres integration`，不能报告为真实PostgreSQL。真实PostgreSQL smoke从Git忽略的本地`.env`（由`.env.example`建立）或进程环境读取`PRAXIS_TEST_DATABASE_URL`与`PRAXIS_ALLOW_TEST_DATABASE_WRITE=1`，且只能指向可写入、允许创建Praxis表的测试数据库。`npm test`不加载`.env`，不能因本地Secret或真实数据库配置改变测试结果。

## 测试层级

1. Unit：Reducer、Policy、排序、Schema、Verifier纯函数。
2. State Contract：Event→State+Command、幂等、父子依赖和迁移。
3. Connector Contract：正常、错误、限流、字段缺失和版本变化。
4. Harness Mock：Golden Scenarios稳定基线。
5. Replay：脱敏真实API/DOM轨迹。
6. Browser E2E：Fixture页面、Checkpoint、Takeover和提交保护。
7. Live Read-only：真实Discovery/Availability，不写入。
8. Controlled Live-write：人工授权的真实预约和清理。

## 测试投入原则

- 测试数量不是Stage完成标准；必须先有该Stage承诺的可运行纵向结果。
- 优先覆盖用户可观察行为、Domain状态转换、Provider Contract和不可逆副作用安全边界。
- 不为已删除的Pilot前Schema、兼容分支或私有实现细节保留测试。
- 同一风险已在更接近真实运行的层级稳定覆盖时，不机械复制等价分支；保留更快的Unit测试只应服务定位速度。
- 低概率低影响错误允许统一失败；授权、金钱、隐私、重复写入和False Success即使低概率也必须有明确断言。

## 改动矩阵

| 改动 | 最小验证 |
|---|---|
| Task Runtime当前产品路径 | Unit + State Contract + Restaurant PGlite |
| 冻结Goal/Scheduler探针 | `npm run test:probes` |
| Search Strategy/排序 | Unit + Search Harness + Replay |
| DeepSeek Prompt/Parser | Schema Unit +固定Eval集 |
| Policy/Authorization | Unit +所有Forbidden Action场景 |
| Adapter | Contract + Browser Fixture +Capability更新 |
| Verifier | Evidence Unit +提交不明确场景 |
| Scheduler | Fake Clock +重复Trigger +恢复 |
| Web流程 | 组件/交互 + API契约 +主要User Flow |
| 语义 Holdout纯数据 | Holdout Preflight；完成后严格Preflight |
| 语义 Holdout Contract/Preflight | Typecheck + 定向Eval Test + Build + 当前产品基线 |

`eval:restaurant:semantic:holdout:preflight:complete`只在全部Gold完成或准备进入Baseline门禁时运行；不在每个Session后重复验证已知空集合。

## 安全断言

- 未授权Commit为0。
- 单候选失败后第二候选Commit为0。
- 同一幂等键外部写入最多1次。
- 弱Evidence不产生Verified Outcome。
- OUTCOME_UNKNOWN不自动重试。
- 跨用户数据和Takeover访问被拒绝。

## Fixture规则

- 对齐真实Schema，不用`any`绕过。
- 时间通过Fake Clock，不依赖系统当前时间。
- 外部响应带Source、ObservedAt和版本。
- Record/Replay必须脱敏。
- 测试不得在CI创建真实预约。

## 汇报

分开报告Mock、Replay、Live Read-only和Controlled Live-write。说明通过、失败、跳过、原因、外部副作用和清理结果，并更新`docs/history/TEST-LOG.md`；若能力、证据或下一道门槛变化，同时更新`docs/STATUS.md`。
