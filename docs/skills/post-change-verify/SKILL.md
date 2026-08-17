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

## Git 版本交付检查

当交付包含新的已接受架构版本、主链路版本或不兼容的 State / Schema / Eval 口径版本时，先确认当前分支名是否仍代表旧版本。若是，必须从已验证 HEAD 创建`codex/<scope>-v<major>`新分支，保留旧版本分支；同一版本内的修复则继续使用该版本分支。

在用户要求本地保存或远端交付时：暂存范围必须只包含本次改动，`git diff --check`必须通过，并在最终交接中分别报告本地 commit、当前分支和远端 push 的实际结果。远端 push 需要用户明确授权；被拒绝、失败或未尝试都不得写成已推送。

## 标准流程

1. 识别改动文件和受影响层。
2. 重读Arch Guard及相关ADR。
3. 运行最小相关Unit/Contract/Harness。
4. 跨Runtime、Policy、Schema或P0流程时运行完整稳定基线。
5. Adapter改动运行Browser Fixture和Replay；需要时单独运行Live Read-only。
6. 只有用户明确授权时运行Controlled Live-write，并验证清理。
7. 检查Secret、PII、Mock生产防护和外部副作用。
8. 同步文档；追加`docs/history/DEVLOG.md`与`docs/history/TEST-LOG.md`，并在能力、证据或下一道门槛变化时更新`docs/STATUS.md`。

v15 Holdout按范围验证：纯私有Gold更新只运行Draft Preflight；Holdout Contract、Preflight或Scorer变化才运行Typecheck、Build、定向v15测试和当前产品基线。严格Complete Preflight只在全部Gold完成或准备进入Baseline门禁时运行。

涉及v15语义主链的改动，验证必须按层分别报告，不能用端到端通过掩盖上游错误：

```text
Semantic Interpreter → Semantic Proposal Contract → Compiler → Reducer → Decision Kernel
```

- Contract测试证明结构、版本和封闭词表；不代表模型语义正确。
- Compiler测试必须证明同一合法Proposal稳定产生同一Restaurant Event/State Patch，且不调用模型、Live Data、Policy或Tool。
- Reducer测试必须覆盖修正、否定、确认、Replay和重复Event。
- Kernel测试必须只使用Authoritative State与Trusted Evidence，并覆盖`NEED_REINTERPRETATION`只记录冲突、询问用户或安全降级的v15行为。
- Interpreter真实模型结果、Fixture Oracle、Replay、Live Read-only和Controlled Live-write必须分开报告；`LLM Response / Adjustment`不得被当成用户确认。

## 文档同步矩阵

| 改动 | 同步文档 |
|---|---|
| 产品行为或确认点 | MVP PRD、User Flows、STATUS、Dev Log |
| 架构边界 | Architecture、ADR、Arch Guard、STATUS |
| Semantic Interpreter / Contract / Compiler / Kernel | Agent Orchestration、Restaurant Domain、Interfaces、Planning/Eval/Post-change Verify、Harness、STATUS与Dev/Test Log |
| API/Schema/State | Interfaces、Task Runtime、迁移说明 |
| Provider/Adapter | Capability Matrix、Domain、Harness、STATUS |
| Prompt/模型 | Agent Orchestration、Eval、STATUS、Dev Log |
| 测试命令/覆盖 | Test Skill、Test Log；必要时 STATUS |
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
