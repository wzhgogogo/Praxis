# Praxis 开发文档索引

- Status: Accepted
- Version: 0.6
- Last updated: 2026-08-10
- Source of truth for: 开发文档导航、阅读顺序和冲突处理
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

## 开发前阅读顺序

1. [项目定位](PROJECT-POSITIONING.md)
2. [MVP PRD](product/MVP-PRD.md)
3. [用户流程](product/USER-FLOWS.md)
4. [架构概览](architecture/OVERVIEW.md)
5. Web/Session/Case改动先读[Agent Gateway and Workspace](architecture/AGENT-GATEWAY-AND-WORKSPACE.md)，其余改动阅读对应架构和Domain文档
6. [ADR Index](decisions/README.md)
7. [Arch Guard](skills/arch-guard/SKILL.md)
8. [Planning Skill](skills/planning/SKILL.md)

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

## Harness 与工程记录

- [Harness Design](harness/HARNESS-DESIGN.md)
- [Golden Scenarios](harness/GOLDEN-SCENARIOS.md)
- [Restaurant Progressive Decision Eval v2](harness/RESTAURANT-DECISION-EVAL-V2.md)：低确定性餐厅需求、多轮偏好形成、推荐集合与评分规则。
- [Restaurant Decision Golden Seed Annotation Guide](harness/RESTAURANT-DECISION-GOLDEN-SEED-ANNOTATION.md)：首批7个Episode的批量人工审阅、机械编译边界和严格检查流程。
- [Roadmap](roadmap.md)
- [Dev Log](devlog.md)
- [Test Log](test-log.md)

## Research 与讨论记录

本节内容提供研究背景，不高于Accepted ADR和当前产品/架构Source of Truth。

- [Agent Harness生态项目调研与Praxis启示](brainstorming/2026-08-06-agent-harness-landscape-and-praxis-lessons.md)：外部Coding Agent、Runtime、安全、Evidence和Harness项目的可迁移机制与当前不采用项。

## 项目 Skills

- [Arch Guard](skills/arch-guard/SKILL.md)
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

- 产品行为变化：更新 PRD 与 User Flows。
- 架构边界变化：更新 Architecture、ADR 与 Arch Guard。
- 平台能力变化：更新 Capability Matrix。
- Prompt、模型或评测口径变化：更新 Eval Skill。
- 验证流程变化：更新 Test/Post-change Skill 与 Test Log。
- 非 trivial 实现：更新 Dev Log。
