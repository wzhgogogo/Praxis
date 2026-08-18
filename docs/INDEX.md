# Praxis 开发文档索引

- Status: Accepted
- Version: 0.7
- Last updated: 2026-08-13
- Source of truth for: 开发文档导航、阅读路径、文档职责和冲突处理
- Related ADRs: [ADR Index](decisions/README.md)
- Related documents: [Project Positioning](PROJECT-POSITIONING.md)

## Source of Truth

本目录是 Praxis 进入 Build 阶段后的稳定开发依据。根目录按日期命名的讨论稿保留为研究背景，不删除、不覆盖。

文档中的 `Accepted` 表示设计决策已接受，不表示代码已经实现。除非接口、目录、命令或能力明确标记为 `implemented`，否则均按 `proposed` 处理，并在编码前检查真实仓库状态。

发生冲突时按以下优先级处理：

```text
Accepted ADR
→ 当前 product / architecture 文档
→ domain / integration 文档
→ roadmap
→ 根目录日期讨论稿
```

`STATUS.md`只汇总“当前已实现、已验证和下一道门槛”：它是能力判断的首个入口，但不覆盖 Accepted ADR、产品、架构或 Domain 的设计语义。发现摘要与权威设计冲突时，以摘要链接的当前权威文档为准并修复摘要。

## 阅读路径

1. [当前状态](STATUS.md)：已经实现、已经验证、明确未验证，以及下一道门槛。
2. [MVP PRD](product/MVP-PRD.md) 与 [User Flows](product/USER-FLOWS.md)：用户承诺与范围。
3. [Architecture Overview](architecture/OVERVIEW.md) 与 [ADR Index](decisions/README.md)：主结构与不可静默改变的决策。
4. 根据改动范围进入下方对应的 Domain、接口、Harness 或平台文档。
5. 编码前必须读 [Arch Guard](skills/arch-guard/SKILL.md) 与 [Planning](skills/planning/SKILL.md)；完成后读 [Post-change Verify](skills/post-change-verify/SKILL.md)。

历史过程不用于判断当前实现状态：需要追溯时才阅读 [Dev Log](history/DEVLOG.md) 与 [Test Log](history/TEST-LOG.md)。

### 修改前必读

1. [当前状态](STATUS.md) 与 [项目定位](PROJECT-POSITIONING.md)
2. [MVP PRD](product/MVP-PRD.md) 与 [用户流程](product/USER-FLOWS.md)
3. [架构概览](architecture/OVERVIEW.md) 与 [ADR Index](decisions/README.md)
4. Web/Session/Case 改动先读 [Agent Gateway and Workspace](architecture/AGENT-GATEWAY-AND-WORKSPACE.md)；其余改动读对应的架构、Domain、Harness 或 Capability 文档
5. [Arch Guard](skills/arch-guard/SKILL.md) 与 [Planning Skill](skills/planning/SKILL.md)

## 产品

- [MVP PRD](product/MVP-PRD.md)：东京英文 Web 餐厅预约 MVP 的目标、范围和验收。
- [User Flows](product/USER-FLOWS.md)：搜索、选择、执行、接管、验证、取消和变更流程。

## 架构

- [Overview](architecture/OVERVIEW.md)：Agent Workspace、Durable Case Runtime、Action Control Plane和Domain Packages总体分层。
- [Agent Gateway and Workspace](architecture/AGENT-GATEWAY-AND-WORKSPACE.md)：Web/Mobile Web入口、Conversation/Session/Case边界、Activity和Domain Workspace。
- [Task Runtime](architecture/TASK-RUNTIME.md)：Goal、Task、Event、Command、Trigger 和父子依赖。
- [Search Service](architecture/SEARCH-SERVICE.md)：通用搜索运行框架和 Domain Search Strategy。
- [Agent Orchestration](architecture/AGENT-ORCHESTRATION.md)：DeepSeek、有界 Tool Loop 和确定性 Workflow。
- [Policy, Execution & Verification](architecture/POLICY-EXECUTION-VERIFICATION.md)：授权、副作用执行和 Outcome 验证。
- [Interfaces & Schemas](architecture/INTERFACES-AND-SCHEMAS.md)：Proposed API、DTO、事件和 Tool Contract。
- [Data, Context & Security](architecture/DATA-CONTEXT-SECURITY.md)：数据归属、Context、PII、Secret 和合规。

## Domain 与平台

- [Restaurant Booking](domains/RESTAURANT-BOOKING.md)：首个生产 Domain。
- [Future Domains](domains/FUTURE-DOMAINS.md)：Shopping、旅行、订阅、长期 Case 和协调任务。
- [Capability Matrix](integrations/CAPABILITY-MATRIX.md)：DeepSeek、Google、Hot Pepper、TableCheck 和官网能力边界。

## 验证、阶段与历史

- [Harness Design](harness/HARNESS-DESIGN.md)
- [Golden Scenarios](harness/GOLDEN-SCENARIOS.md)
- [Restaurant Progressive Decision Eval v2](harness/RESTAURANT-DECISION-EVAL-V2.md)：v14 Harness-only历史设计；可执行代码已删除，只用于追溯，不是当前命令或Baseline门槛。
- [Restaurant Decision Golden Seed Annotation Guide](harness/RESTAURANT-DECISION-GOLDEN-SEED-ANNOTATION.md)：v14首批7个Episode历史标注记录；数据与执行入口已删除。
- [Restaurant v17 Semantic Holdout v2](harness/RESTAURANT-SEMANTIC-HOLDOUT-V2.md)：当前私有Clean Holdout的空模板、开放`criteria`标注格式、冻结清单、Preflight与一次性Baseline协议。
- [Roadmap](roadmap.md)：后续阶段及退出条件，不记录每次实施细节。
- [Dev Log](history/DEVLOG.md)：仅保留按时间的设计、实现与取舍追溯。
- [Test Log](history/TEST-LOG.md)：仅保留按时间的验证命令、模式、结果与未覆盖项。

## Research 与讨论记录

本节内容提供研究背景，不高于Accepted ADR和当前产品/架构Source of Truth。

- [Agent Harness生态项目调研与Praxis启示](brainstorming/2026-08-06-agent-harness-landscape-and-praxis-lessons.md)：外部Coding Agent、Runtime、安全、Evidence和Harness项目的可迁移机制与当前不采用项。

## 项目 Skills

- [Arch Guard](skills/arch-guard/SKILL.md)：长期依赖、状态权威、执行权限与Outcome边界；版本和Eval细节不在此重复。
- [Planning](skills/planning/SKILL.md)
- [Test](skills/test/SKILL.md)
- [Eval](skills/eval/SKILL.md)
- [Post-change Verify](skills/post-change-verify/SKILL.md)

## 文档治理

设计文档统一使用以下页头：

```text
Status: Draft | Accepted | Superseded
Version: 0.1
Last updated: YYYY-MM-DD
Source of truth for:
Related ADRs:
Related documents:
```

- `STATUS.md`是“现在是什么”的唯一摘要；不在 README、Roadmap、Harness 或日志中复制维护完整当前状态。
- `product/`记录用户承诺和流程；`architecture/`记录分层、接口和系统约束；`domains/`记录业务语义；`integrations/`记录外部能力事实；`harness/`记录评测和模拟设计；`skills/`记录执行规程。
- `history/`只追加历史，不是当前事实的 Source of Truth。历史与当前文档冲突时，按本页 Source of Truth 优先级处理。
- 产品行为变化：更新 PRD 与 User Flows，并同步 `STATUS.md`。
- 架构边界变化：更新 Architecture、ADR 与 Arch Guard，并同步 `STATUS.md`。
- 平台能力变化：更新 Capability Matrix 与 `STATUS.md`。
- Prompt、模型或评测口径变化：更新 Eval Skill、`STATUS.md`与 Test Log。
- 验证流程变化：更新 Test/Post-change Skill 与 Test Log。
- 非 trivial 实现：更新 Dev Log；若改变当前能力或门槛，同步 `STATUS.md`。
