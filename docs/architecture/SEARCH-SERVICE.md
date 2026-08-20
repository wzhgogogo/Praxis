# Search Service

- Status: Accepted
- Document revision: 0.3
- Last updated: 2026-08-19
- Source of truth for: 搜索运行框架、Domain搜索责任和实时候选生成
- Related ADRs: [ADR-0001](../decisions/0001-general-task-runtime.md)
- Related documents: [Restaurant Domain](../domains/RESTAURANT-BOOKING.md), [Capability Matrix](../integrations/CAPABILITY-MATRIX.md)

## 目标

Discovery的产物是`RestaurantCandidate`，不是Availability结论。`CHECK_AVAILABILITY`独立产生按`candidateId → AvailabilityOffer[]`保存的实时Observation；只有经Agent选择、具有新鲜匹配Offer的组合才能形成Booking Proposal。Restaurant MVP仍优化“约30秒内找到最多3家真实可订候选”，不追求搜全。

## 分层

### Search Runtime

通用能力：

- 并行Source Connector；
- Deadline、并发和请求预算；
- Progressive Result；
- 分批Enrichment；
- 缓存、熔断、Trace和Replay；
- 来源健康度和部分失败隔离。

### Domain Search Strategy

Domain负责：

- Intent与Query；
- Entity结构和合并规则；
- 硬过滤；
- 预排序和最终排序；
- 实时Enrichment；
- “候选足够”的定义。

```ts
interface DomainSearchStrategy<Intent, SourceHit, Entity, Candidate> {
  buildQueries(intent: Intent): SearchQuery[];
  getSources(intent: Intent): SearchSource[];
  normalize(hit: SourceHit): Entity;
  resolveEntities(entities: Entity[]): Entity[];
  applyHardFilters(entities: Entity[], intent: Intent): Entity[];
  preRank(entities: Entity[], intent: Intent): Entity[];
  enrich(entity: Entity, intent: Intent): Promise<Candidate | null>;
  finalRank(candidates: Candidate[], intent: Intent): Candidate[];
  hasEnough(candidates: Candidate[]): boolean;
}
```

## Restaurant Pipeline

```text
SearchIntent
→ 日英查询词与地理范围
→ Google / Hot Pepper / approved sources并行Discovery
→ Source normalization
→ Brand与Outlet实体解析
→ 硬约束过滤
→ Top 10–15预排序
→ 返回RestaurantCandidate Discovery Observation
→ Restaurant Agent选择候选和时机进行Availability检查
→ 返回AvailabilityOffer Observation
→ Agent选择可订组合或调整Retrieval
```

目标时间预算：

- 0–3秒：Intent与Query。
- 3–8秒：Discovery、合并、预排序。
- 8–20秒：首批Availability。
- 20–30秒：必要时扩展。
- Deadline后返回已验证的实际数量，不以未验证候选凑数。

## Entity Resolution

预约对象是`RestaurantOutlet`，不是品牌。合并优先级：

1. 已验证Source ID映射；
2. 电话完全一致；
3. 标准化地址和邻近坐标；
4. 标准化名称；
5. 模型仅辅助低置信度判断。

不确定时保留为两个Outlet并标记冲突，不错误合并。

### Freshness-aware实体复用

Restaurant Discovery保存的是带Source和观察时间的Entity Observation，不是脱离来源的永久真值。一次查询先读取已有Praxis Entity ID、Source Entity ID映射和仍符合用途的新鲜Observation；缺失、过期或当前动作风险更高时，再调用Source刷新：

```text
Search Intent
→ Entity/Observation命中
→ 按字段与用途判断Freshness
→ 必要时结构化Source刷新
→ Domain代码完成归一化、合并和硬过滤
→ 只把少量Grounded Candidate交给模型解释
```

缓存命中用于减少重复Source请求、延迟和模型Context，不降低Grounding标准。回答品牌大致分店可以使用来源允许且仍新鲜的Observation；涉及当天营业、具体时间Availability、价格、条款或预约时必须按相应TTL重新验证。Source查询、实体合并和硬过滤由Connector与确定性代码完成，不应让模型反复阅读完整搜索结果来换取新鲜度。

Stage 2C只实现Restaurant Domain内部的最小Entity Observation和Source Mapping；在第二个真实Domain证明共性前，不创建跨Domain Knowledge Graph、万能Entity Store或通用Feature Platform。

## 排序

硬约束先过滤，模型不参与硬规则。预排序特征包括菜系、预算、距离、营业、网络预约能力、Adapter健康度和数据新鲜度。

最终排序优先：

```text
硬约束完整满足
→ 指定时间真实可订
→ 执行与验证可靠性
→ 菜系和预算匹配
→ 距离
→ 接管成本
```

分数由可审计代码计算；DeepSeek只生成基于结构化字段的说明。

## Freshness

- AvailabilityOffer必须有`checkedAt`和`expiresAt`，且不得被Discovery结果隐式携带。
- MVP默认Offer TTL目标为2分钟，具体来源可更短。
- 用户点击`Book this`后必须重新验证。
- Google及其他来源缓存遵守各自政策；Availability不做长期缓存。

## Future Shopping

Shopping复用Runtime并发、预算、批次和Replay，但拥有自己的SKU合并、规格过滤、价格/库存/配送Enrichment和排序。不得为复用餐厅代码而把Restaurant和Product塞进同一个通用Entity。
