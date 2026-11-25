# Praxis Roadmap

- Status: Accepted
- Document revision: 4.1
- Last updated: 2026-11-25
- Source of truth for: 产品纵向阶段、进入条件、范围和退出标准。
- Related documents: [STATUS](STATUS.md) · [MVP PRD](product/MVP-PRD.md) · [ADR 索引](decisions/README.md) · [历史路线图](superseded/ROADMAP-BEFORE-REPOSITORY-REVIEW.md)

## 已完成的阶段

| 阶段 | 收尾范围 |
| --- | --- |
| Phase 1 | Restaurant Domain 与最小执行控制面，Mock 验证权限、幂等、Outcome 和恢复。 |
| Phase 2 | 可恢复工作区、跨会话 Case 与用户隔离，以及单路径真实只读诊断。 |
| Phase 3a | 受审查的来源读取、网络边界、公开控件与页面观察。 |
| Phase 3b | 同店身份、条件和空位证据的只读调查，来源交接与诊断验证。 |
| Phase 3c | 响应式选店工作区、About 与相册、条件调整、来源问答和 B1 交接。 |

完成状态按各阶段已验证的范围签收。测试分母、人工走查与仍未验证的能力见 [STATUS](STATUS.md)。旧阶段的计划、取舍和验收背景见 [历史归档](superseded/README.md)。

## Phase 3d · Auth、部署和限流

下一步把现有工作区接到可部署、可控制的服务入口，核对认证、授权范围、用户隔离与来源限流。验证以部署路径和已批准的访问边界为准。

## Phase 3e · 运行与只读质量验证

方向是部署后的稳定性、可观察性和规模化 Live Read-only 验证。具体批次、预算、样本与签收门槛在开始前另行确定。Controlled Live-write 仍需独立授权、真实回执和清理验证。

后续预约提交、跟进和 Pilot 仍遵守现行权限、证据、隐私与 Outcome 合同。第二个真实 Domain 有明确需求后再提取共享业务抽象。
