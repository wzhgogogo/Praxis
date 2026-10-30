# Praxis 开发文档索引

- Status: Accepted
- Document revision: 1.19
- Last updated: 2026-10-30
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

入口顺序：INDEX → Repository Conventions → Arch Guard → STATUS。STATUS先读最新结论和与本次切片直接相关的能力／门槛；其历史检查点按需定位，不默认通读。根据下表进入本次范围；同一会话已读且未变化的文档可复用。需要追溯历史时，先从[月度历史入口](history/README.md)读相关月份摘要，再按逐条索引定位同一失效机制的原始记录；不默认通读两份完整日志。当前月份有新记录时同步对应逐条索引，摘要只在工作方向或证据结论变化时更新。

| 本次工作 | 追加阅读 |
|---|---|
| 产品/交互 | Project Positioning、MVP PRD、User Flows；Web/Case再读Agent Gateway and Workspace |
| 架构/State/执行 | Overview、相关Accepted ADR、Task Runtime或Policy/Execution/Verification、相关Domain |
| Provider/Browser | Restaurant Domain、Capability Matrix、Agent Orchestration、Data/Security、相关ADR |
| 测试/评测 | Test Skill；任何评测的设计、运行或结论读Eval Skill；具体Harness协议按需读取，不自动读取标注或私有数据 |
| 文档/配置/入口整理 | 对应权威文档、package scripts、配置读取实现 |

非trivial实施按[Planning](skills/planning/SKILL.md)选择诊断/局部/架构计划，验证按[Test](skills/test/SKILL.md)，交付按[Post-change](skills/post-change-verify/SKILL.md)。纯链接和说明修正不需要完整产品/语义问卷。

## 产品

- [MVP PRD](product/MVP-PRD.md)：面向在日外国人的东京英文Web决策、准备与来源交接范围；第一版由用户在来源网站自行提交。
- [User Flows](product/USER-FLOWS.md)：首页、My plans、安排工作区及查找、选店、交接、返回自报流程；第1段已复核合main，第2段状态见切片计划。
- [Web Visual Direction](product/VISUAL-DIRECTION.md)：用户选定的合并版视觉规则及英文文案；Mono仅用于logo，信息靠间距分隔，实施范围/验收见切片计划。
- [Booking Design Draft 0.6](product/BOOKING-DESIGN-DRAFT.md)：draft / not integrated的历史方案输入；B1以Accepted ADR-0049为准，B2/B2+不属于前端第一段，原稿的取消严格程度与工作流读取不得覆盖ADR。

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

- [前端第2段实现与复核](reviews/WEB-WORKSPACE-SLICE2-20261030.md)：单输入框/完整问答历史、条件、服务端差异、批末与错误；已获准补上服务端未查工作续接及独立失败刷新，最终门禁待运行，不是Live能力。

- [SR04零API定位与合入复核](reviews/WEB-WORKSPACE-SR04-OFFLINE-20261030.md)：两条生产解析路径各10/10，SR04目标同v26；诊断透传修复及main404a766e同步；净树五门禁1211/181和两尺寸十一项通过，21张截图，工作分支待合入复核。

- [前端第1步复核小修](reviews/WEB-WORKSPACE-SLICE1-FOLLOWUP-20261030.md)：净树五门禁1211/181通过；单次真实10 API后SR04新增网关失败停止，四层/v26逐项/21截图；单店问答合并留下一段。

- [前端第1步复核](reviews/WEB-WORKSPACE-SLICE1-20261030.md)：工作区/B1完整Fixture链路、两尺寸十项验收、五门禁1210/180及主要画面截图；工作分支待复核，不是Live验收。

- [前端第0步文档同步复核](reviews/WEB-WORKSPACE-HANDOFF-DOCS-20261029.md)：来源对照、补齐范围与文档检查；第0步已复核并小修推送；后续代码状态见切片计划。

- [第二阶段签收原文（2026-10-23）](reviews/PHASE-2-SIGNOFF-20261023.md)：用户带缺口签收的不可改写快照；当前状态见STATUS。
- [第二阶段分支历史快照](reviews/PHASE-2-BRANCH-INVENTORY-20261023.md)：签收时的分支、合并/tag/退役状态；删除提案已关闭，按用户决定保留全部远端分支。

- [当前餐厅只读验收契约](../src/eval/restaurant/agent-loop/cases/README.md)：H001–H005的当前目标、Gold、Runner/诊断与人工审查边界；已暴露开发集，不是Clean Baseline。

- [Harness Design](harness/HARNESS-DESIGN.md)
- [Golden Scenarios](harness/GOLDEN-SCENARIOS.md)
- [Restaurant Semantic Holdout](harness/RESTAURANT-SEMANTIC-HOLDOUT.md)：`restaurant-semantic-holdout@2`的空模板、开放`criteria`标注格式、冻结清单、Preflight与一次性Baseline协议。
- [Roadmap](roadmap.md)：后续阶段及退出条件，不记录每次实施细节。
- [月度历史入口](history/README.md)：2026年8月起的月度摘要与逐条索引；按需追溯入口。
- [原始 Dev Log](history/DEVLOG.md)：完整保留设计、实现与取舍记录，由月度索引定位。
- [原始 Test Log](history/TEST-LOG.md)：完整保留验证命令、模式、结果与未覆盖项，由月度索引定位。
- [2026-09-05全量测试审查](history/TEST-SUITE-REVIEW-2026-09-05.md)：2026-09-06完成的逐文件/逐测试历史快照，不是需随每次改动维护的门禁清单。
- [2026-09-24 Test/Eval Skill纸面审查](history/TEST-EVAL-SKILL-REVIEW-2026-09-24.md)：覆盖与评价规程的draft / not integrated审查，不是运行或产品能力证据。

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

## 当前阶段计划

- [Web Workspace Slice 2 Plan](WEB-WORKSPACE-SLICE2-PLAN.md)：从已快进合main的第1段4cbc521b开始，单输入框/条件/差异/收尾/错误及用户批准的有未查工作才续接；真实调用0。

- [Web Workspace Slice 1 Plan](WEB-WORKSPACE-SLICE1-PLAN.md)：当前前端纵向切片范围、现有取消/进度链路、两尺寸浏览器验收与停止条件；业务真实调用0。

- [Agent 网站操作第一阶段 Playbook](AGENT-WEB-OPERATION-PHASE-1-PLAYBOOK.md)：第一阶段的目标、工作包、退出条件、预算与签收口径；当前进度见 STATUS。
- [H001–H005 已知可行基线 Playbook](H001-H005-KNOWN-FEASIBLE-BASELINE-PLAYBOOK.md)：P1-A 细则（已完成）；已暴露开发诊断，非 Clean Baseline。其结论分类只用于 P1-A 至 P1-F，此后按 Eval Skill 的四层结构评价。
- 独立复核文件随各批次原样提交在 `.eval-artifacts/<批次>/` 下，由对应报告和 STATUS 条目链接。

## 仓库治理

- [浏览器只读可靠性独立复核（2026-10-07）](history/BROWSER-READ-RELIABILITY-REVIEW-2026-10-07.md)：通用执行、来源网络规则、受控交付及三次Live的证据；代码局部通过，完整交付仍FAIL。
- [H001 可信结果交付 Playbook](H001-QUALIFIED-DELIVERY-PLAYBOOK.md)：已被第一阶段 Playbook 取代的历史计划；其中的命令和门槛不再使用。
- [H001 可信交付独立复核（2026-10-07）](history/H001-QUALIFIED-DELIVERY-REVIEW-2026-10-07.md)：固定来源模型通过，完整Live交付FAIL；后续仅发现Live证明TableCheck查询建议选择，Tabelog类别扩查仍FAIL，锚点修复仅获离线验证。
- [Browser Agent 通用操作与会话可靠性 Playbook](BROWSER-AGENT-GENERIC-OPERATIONS-PLAYBOOK.md)：2026-09-26 的历史实施切片，已被第一阶段 Playbook 取代；不代表已验收能力。
- [Browser Agent 餐厅实施与 Review 计划](BROWSER-AGENT-RESTAURANT-IMPLEMENTATION-PLAN.md)：当前 P0–P4 只读切片及 P5 边界；早期交接状态和额度属于历史记录，后续授权与最终结果单列。
- [Browser Agent 最终复核（2026-09-16）](history/BROWSER-AGENT-FINAL-REVIEW-2026-09-16.md)：本轮实现、真实两店比较/修订、新商户失败、独立结果复核、测试和未覆盖范围。
- [Browser Agent P0–P4 交付记录（2026-09-16）](history/BROWSER-AGENT-RESTAURANT-P0-P4-DELIVERY-2026-09-16.md)：本轮改动、B1–B14 实际证据、命令和未完成项；不是独立 Review 或 Live 验收。

- [Restaurant Read Execution Design](RESTAURANT-READ-EXECUTION-DESIGN.md)：已执行的只读调查工具语义、证据接纳、正常无结果收尾与验证设计，关联ADR-0025；真实模型/来源验收仍单独记录。
- [Browser Execution and Live Search Plan](BROWSER-EXECUTION-AND-LIVE-SEARCH-PLAN.md)：历史交接计划（draft / not integrated），已被第一阶段 Playbook 取代，不代表当前能力。
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
- 评测输入（Gold、变体、见证、回放种子）或 Live 外层编排变化：按 Eval Skill §5 冻结并记录 SHA，在对应报告和 Test Log 中写明。
- Skill 只写规则；某次运行或某个版本的结论写入 STATUS、DEVLOG、TEST-LOG 或批次报告，不追加到 Skill。
- 验证流程变化：更新 Test/Post-change Skill 与 Test Log。
- branch、版本、文件、目录或命令命名变化：只更新 Repository Conventions，并在AGENTS保留必要强制摘要；不得写入Arch Guard。
- 非 trivial 实现：更新 Dev Log；若改变当前能力或门槛，同步 `STATUS.md`。

## 单页浏览器诊断

[Browser Read Diagnostics](harness/BROWSER-READ-DIAGNOSTICS.md)维护独立入口、证据字段与测试映射。LOCAL_CHROMIUM单独interactive使用临时profile；interactive与manual-intervention同时开启才使用ADR-0016专用持久eval profile。真实Chromium本地Fixture不等于真实来源验证；单页观察不写Task State、不产出Offer。

- [2026-09-16 Browser 直接修复与有界验证](history/BROWSER-AGENT-VALIDATION-2026-09-16.md)：早期开发检查点；当时的失败保留，当前状态以最终复核及 STATUS 为准。
