---
name: praxis-test
description: Praxis测试策略；覆盖纯函数、状态机、Connector Contract、Harness、Browser、API和受控真实执行。
---

# Praxis Test

当前仓库已建立TypeScript Mock垂直切片。以下命令已实现：

```bash
npm run typecheck
npm test
npm run build
npm run test:postgres:live    # 需要显式测试数据库配置与写入确认
npm run eval:decision:preflight
npm run eval:decision:model:fixture
npm run eval:search:fixture
```

`npm test`当前运行Core Unit/Contract、Restaurant Verifier、11个Restaurant Mock Harness场景、20个Runtime PGlite数据库集成场景（含G01/G02合成Harness）、3个Fixture Intent Eval Contract场景、17个Progressive Decision Seed Preflight场景、10个Eval-only Reducer/Scorer场景、5个Typed Patch Contract场景、18个Evaluator Verification Mutation场景、8个Eval-only Model Contract场景、5个Relative-time Resolver场景、5个Episode Runner场景、5个DeepSeek Gateway Connector Contract场景、4个Intent Parser场景、3个Real Model Eval Contract场景、1个Fixture Search Eval Contract和7个使用PGlite的Stage 2B Local HTTP/SSE场景；2026-08-13全量基线为138 tests / 5 suites。Decision Seed Preflight、Fixture Oracle、Mutation Set、Typed Contract、Model Contract、Relative-time Resolver和Fixture Episode Runner只证明Contract、Fixture引用、人工标注门禁和S1–S8评分管线；Fixture Search和Web Workspace只证明本地Fixture与Embedded-postgres路径；生产身份、Browser视觉、Replay、Live Read-only、Progressive Decision真实Model Baseline和Controlled Live-write仍未运行，不得混报。

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
| Task Runtime | Unit + State Contract + 3个合成Domain |
| Search Strategy/排序 | Unit + Search Harness + Replay |
| DeepSeek Prompt/Parser | Schema Unit +固定Eval集 |
| Policy/Authorization | Unit +所有Forbidden Action场景 |
| Adapter | Contract + Browser Fixture +Capability更新 |
| Verifier | Evidence Unit +提交不明确场景 |
| Scheduler | Fake Clock +重复Trigger +恢复 |
| Web流程 | 组件/交互 + API契约 +主要User Flow |
| Golden Seed纯数据/文案 | 定向Eval Contract + Draft Preflight |
| Golden Seed Contract/Preflight | Typecheck + 定向Eval Contract + Build + 全量稳定基线 |

`eval:decision:preflight:complete`只在全部人工Gold完成或准备进入Reducer/Scorer/Baseline门禁时运行；不在每个Episode后重复验证已知Pending。

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

分开报告Mock、Replay、Live Read-only和Controlled Live-write。说明通过、失败、跳过、原因、外部副作用和清理结果，并更新`docs/test-log.md`。
