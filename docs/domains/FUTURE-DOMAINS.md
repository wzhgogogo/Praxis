# Future Domains

- Status: Accepted
- Document revision: 0.3
- Last updated: 2026-08-07
- Source of truth for: 通用Runtime未来扩展边界与非目标
- Related ADRs: [ADR-0001](../decisions/0001-general-task-runtime.md), [ADR-0003](../decisions/0003-single-agent-orchestration.md)
- Related documents: [Task Runtime](../architecture/TASK-RUNTIME.md)

## 扩展原则

只复用Restaurant闭环已经证明需要的Task Runtime、Trigger、Authorization、Execution、Evidence和Harness能力；不因未来Domain继续扩建通用Runtime，也不建立万能Entity、Search或Workflow DSL。新的通用抽象必须等待第二个真实Domain。

## Recurring Shopping

```text
MONITORING → DUE → SEARCHING → AWAITING_SELECTION
→ REVALIDATING → PURCHASING → VERIFYING
→ ORDERED → DELIVERED → MONITORING
```

复用：Scheduler、Task State、Action/Authorization、Execution Attempt、Outcome Evidence、Harness Fake Clock。

自有：SKU/Variant、商家、价格、库存、配送、退货和消费周期。第一版预计使用每次确认，不自动购买；Standing Authorization只在Policy成熟后开放。

## Travel

复用父子任务：交通、住宿、餐厅、票务、日历和提醒。Domain需要价格变化、改签取消、时区、参与者与行程依赖。

## Subscription与家庭服务

以定时或外部账单Event唤醒；需要续费、取消、价格变化、服务中断和账单Evidence。不得将“提醒到期”误判为“已取消/已续费”。

## Long-running Case

适用于维修、申请、退换货、理赔和材料补充：

```text
PREPARING → SUBMITTED → WAITING_EXTERNAL
→ NEEDS_MATERIAL → RESUBMITTED → RESOLVED
```

重点是Unknown、外部事件、截止时间、文件和多次补充，不是连续运行模型。

## Coordination

父Goal聚合多个子任务及参与者状态。餐厅、日历、路线和通知可以独立重试，但关键依赖必须明确。未来多人协作不等于Multi-Agent。

## 合成参考Domain

Harness已实现最小Recurring Shopping与Long-running Case状态机：前者用持久化Trigger/Fake Clock验证每周期重新等待用户确认，后者验证外部事件、材料补齐与再次准备；两者不接真实API、不暴露产品入口、不产生外部写入。G03 Coordination目前只验证Goal/依赖聚合，独立Coordination状态机仍待实现。这些都不算第二个真实使用者。

## 暂不通用化

- Domain Entity和Candidate结构；
- 领域排序和完成规则；
- 具体页面Adapter；
- 文件、电话和人工运营平台；
- 跨Domain统一语义本体；
- Multi-Agent协作协议。
