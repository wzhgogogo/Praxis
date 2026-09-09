# Praxis 开发文档索引

- Status: Accepted
- Document revision: 0.9
- Last updated: 2026-09-05
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

入口顺序：INDEX → Repository Conventions → Arch Guard → STATUS。根据下表进入本次范围；同一会话已读且未变化的文档可复用。历史日志只在追溯时读取。

| 本次工作 | 追加阅读 |
|---|---|
| 产品/交互 | Project Positioning、MVP PRD、User Flows；Web/Case再读Agent Gateway and Workspace |
| 架构/State/执行 | Overview、相关Accepted ADR、Task Runtime或Policy/Execution/Verification、相关Domain |
| Provider/Browser | Restaurant Domain、Capability Matrix、Agent Orchestration、Data/Security、相关ADR |
| 测试/评测 | Test Skill；模型质量读Eval；具体Harness协议按需读取，不自动读取标注或私有数据 |
| 文档/配置/入口整理 | 对应权威文档、package scripts、配置读取实现 |

非trivial实施按[Planning](skills/planning/SKILL.md)选择诊断/局部/架构计划，验证按[Test](skills/test/SKILL.md)，交付按[Post-change](skills/post-change-verify/SKILL.md)。纯链接和说明修正不需要完整产品/语义问卷。

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
- [Restaurant Semantic Holdout](harness/RESTAURANT-SEMANTIC-HOLDOUT.md)：`restaurant-semantic-holdout@2`的空模板、开放`criteria`标注格式、冻结清单、Preflight与一次性Baseline协议。
- [Roadmap](roadmap.md)：后续阶段及退出条件，不记录每次实施细节。
- [Dev Log](history/DEVLOG.md)：仅保留按时间的设计、实现与取舍追溯。
- [Test Log](history/TEST-LOG.md)：仅保留按时间的验证命令、模式、结果与未覆盖项。
- [2026-09-05全量测试审查](history/TEST-SUITE-REVIEW-2026-09-05.md)：2026-09-06完成的逐文件/逐测试历史快照，不是需随每次改动维护的门禁清单。

## Superseded Archive

- [Archive Index](superseded/README.md)：已退出当前主链、但仍用于Retro和Review的历史材料及使用边界。
- [Restaurant Progressive Decision Eval](superseded/harness/RESTAURANT-PROGRESSIVE-DECISION-EVAL.md)：已删除的Progressive Decision Harness历史设计。
- [Restaurant Progressive Decision Golden Seed](superseded/harness/RESTAURANT-PROGRESSIVE-DECISION-GOLDEN-SEED.md)：首批7个Episode的历史标注记录。
- [Restaurant Categorized Semantic Holdout](superseded/harness/RESTAURANT-CATEGORIZED-SEMANTIC-HOLDOUT.md)：开放`criteria`之前的历史Holdout格式。
- [Restaurant Semantic Clean Holdout Baseline Plan](superseded/harness/RESTAURANT-SEMANTIC-CLEAN-HOLDOUT-BASELINE-PLAN.md)：已完成的历史Clean Holdout执行计划；当前协议见[Restaurant Semantic Holdout](harness/RESTAURANT-SEMANTIC-HOLDOUT.md)。

## Research 与讨论记录

本节内容提供研究背景，不高于Accepted ADR和当前产品/架构Source of Truth。

- [Brainstorming Index](brainstorming/README.md)：历史思考、市场证据和讨论记录的完整索引与使用边界。
- [Agent Harness生态项目调研与Praxis启示](brainstorming/2026-08-06-agent-harness-landscape-and-praxis-lessons.md)：外部Coding Agent、Runtime、安全、Evidence和Harness项目的可迁移机制与当前不采用项。

## 项目 Skills

- [Arch Guard](skills/arch-guard/SKILL.md)：长期依赖、状态权威、执行权限与Outcome边界；版本和Eval细节不在此重复。
- [Planning](skills/planning/SKILL.md)
- [Test](skills/test/SKILL.md)
- [Eval](skills/eval/SKILL.md)
- [Post-change Verify](skills/post-change-verify/SKILL.md)

## 仓库治理

- [Browser Execution and Live Search Plan](BROWSER-EXECUTION-AND-LIVE-SEARCH-PLAN.md)：draft / not integrated；浏览器共用受控执行、原始 H001 和本地真实搜索体验的交接计划，不代表当前能力。
- [Repository Naming and Version Conventions](REPOSITORY-CONVENTIONS.md)：Git branch/tag、版本轴、源码、Eval、文档和命令命名的唯一Source of Truth。
- [Repository Improvement Plan](REPOSITORY-IMPROVEMENT-PLAN.md)：2026-09-05仓库Review的整改执行进度与延后项，不替代当前权威设计，不包含人工标注数据和已有测试artifact的修改。

## 文档治理

设计文档统一使用以下页头：

```text
Status: Draft | Accepted | Superseded
Document revision: 0.1
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
- branch、版本、文件、目录或命令命名变化：只更新 Repository Conventions，并在AGENTS保留必要强制摘要；不得写入Arch Guard。
- 非 trivial 实现：更新 Dev Log；若改变当前能力或门槛，同步 `STATUS.md`。

## 单页浏览器诊断

[Browser Read Diagnostics](harness/BROWSER-READ-DIAGNOSTICS.md)维护独立入口、证据字段与测试映射。LOCAL_CHROMIUM单独interactive使用临时profile；interactive与manual-intervention同时开启才使用ADR-0016专用持久eval profile。真实Chromium本地Fixture不等于真实来源验证；单页观察不写Task State、不产出Offer。
