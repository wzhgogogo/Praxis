---
name: praxis-post-change-verify
description: Praxis改动后验证与归档；按范围运行检查并同步架构、能力、测试和开发记录。
---

# Praxis Post-change Verify

当前已实现以下基础命令：

```bash
npm run typecheck
npm test
npm run build
```

Runtime、Policy、Restaurant状态或Mock Adapter改动至少运行以上三项。PostgreSQL持久化改动在用户提供显式测试数据库写入授权后，另运行`npm run test:postgres:live`；PGlite结果不得替代该项。Stage 2B本地Fixture HTTP/SSE与Pilot Session Contract现包含在`npm test`，但不等同于生产身份、Browser视觉验证、Replay、真实PostgreSQL部署或真实平台验证；这些完成前不得报告通过。

## 标准流程

1. 识别改动文件和受影响层。
2. 重读Arch Guard及相关ADR。
3. 运行最小相关Unit/Contract/Harness。
4. 跨Runtime、Policy、Schema或P0流程时运行完整稳定基线。
5. Adapter改动运行Browser Fixture和Replay；需要时单独运行Live Read-only。
6. 只有用户明确授权时运行Controlled Live-write，并验证清理。
7. 检查Secret、PII、Mock生产防护和外部副作用。
8. 同步文档并更新Test/Dev Log。

Golden Seed按范围验证：纯Gold数据或文案更新只需定向Eval Contract和Draft Preflight；Contract、Schema、Preflight、Reducer或Scorer变化才运行Typecheck、Build和全量稳定基线。严格Complete Preflight只在全部Gold完成或准备进入Evaluator/Baseline门禁时运行。

## 文档同步矩阵

| 改动 | 同步文档 |
|---|---|
| 产品行为或确认点 | MVP PRD、User Flows、Dev Log |
| 架构边界 | Architecture、ADR、Arch Guard |
| API/Schema/State | Interfaces、Task Runtime、迁移说明 |
| Provider/Adapter | Capability Matrix、Domain、Harness |
| Prompt/模型 | Agent Orchestration、Eval、Dev Log |
| 测试命令/覆盖 | Test Skill、Test Log |
| 安全或保留策略 | Data/Security、ADR（如跨决策） |

## 报告格式

```text
Conclusion: pass / blocked
Scope:
Checks:
- typecheck:
- unit/contract:
- harness mock/replay:
- build/smoke:
- live-readonly/live-write:
Safety:
Docs updated:
Skipped and reason:
```

红灯必须定位并修复或明确阻断，不得为了完成流程而跳过。Mock、Replay和Real结果不得混报。
