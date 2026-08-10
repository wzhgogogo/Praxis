---
name: praxis-planning
description: Praxis实现前规划流程；读取Source of Truth，界定Domain、架构、风险、验收和文档影响。
---

# Praxis Planning

## 适用范围

任何非trivial功能、重构、Provider接入、Schema、Prompt、状态或验证逻辑改动。

## 开始前

1. 阅读`docs/INDEX.md`和`arch-guard`。
2. 阅读相关PRD、User Flow、Architecture、Domain、Capability和ADR。
3. 检查当前实现和测试，不根据文档假设代码存在。
4. 明确用户目标、成功标准、In/Out of Scope和风险。
5. 找出最小可运行纵向切片；计划结束时必须有用户可触达或Harness可完整驱动的结果。

## 规划模板

```text
Goal
Current state
Affected layers
State/Event/Command changes
API/Schema changes
Policy/Authorization changes
Failure and recovery
Harness scenarios
Verification
Documentation updates
```

## 强制问题

- 这是通用Runtime能力还是Domain能力？
- 模型是否真的必要，普通代码能否可靠完成？
- 新Tool是只读、提议还是副作用？
- 副作用如何授权、幂等和验证？
- 提交前失败与提交后不明确如何区分？
- 是否影响父子任务、Scheduler或外部Event？
- 是否已有第二个真实使用者支持抽象？
- 现有未发布路径能否直接替换并删除，而不是保留兼容分支？
- 这个fallback、配置项、重试或间接层是否由当前验收条件要求？
- 低概率分支是低影响噪声，还是涉及金钱、授权、隐私或不可逆副作用的安全不变量？
- 这项扩展应当现在实现、只在Design中预留，还是等待真实触发条件？
- 如果是架构探针，Harness、范围上限、停止点和重新启动条件分别是什么？

## ADR触发

改变模型供应商、单/多Agent、候选授权、部署边界、Runtime/Domain依赖、Outcome权威或关键数据政策时，先新增ADR。局部实现选择无需ADR，但应在Design或Dev Log记录。

## 开发就绪标准

计划必须让实现者无需再决定：状态转换、接口、错误、权限、测试、数据处理和完成标准。无真实数据保留要求时不规划兼容迁移；存在真实持久化数据或外部消费者时才明确迁移。无法确定的平台能力标为Unknown并安排只读验证，不作为已具备能力编码。

计划默认只包含一个当前切片。后续能力进入Roadmap，不同时编码多个尚无端到端使用者的基础设施层。只有当前切片必需、安全上难以后补，或满足Roadmap架构探针门槛的Core变化可以同时进入计划。
