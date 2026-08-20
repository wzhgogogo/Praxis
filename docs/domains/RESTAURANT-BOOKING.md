# Restaurant Booking Domain

- Status: Accepted
- Document revision: 1.4
- Last updated: 2026-08-20
- Source of truth for: 餐厅预约Domain模型、状态、搜索和完成条件
- Related ADRs: [ADR-0004](../decisions/0004-single-candidate-authorization.md), [ADR-0009](../decisions/0009-semantic-strength-and-clean-holdout-baseline.md), [ADR-0010](../decisions/0010-restaurant-agent-loop-action-validation.md), [ADR-0011](../decisions/0011-restaurant-agent-loop-control-refinement.md), [ADR-0012](../decisions/0012-migration-and-agent-loop-hardening.md)
- Related documents: [MVP PRD](../product/MVP-PRD.md), [User Flows](../product/USER-FLOWS.md), [Policy & Execution](../architecture/POLICY-EXECUTION-VERIFICATION.md), [Data, Context & Security](../architecture/DATA-CONTEXT-SECURITY.md), [Search Service](../architecture/SEARCH-SERVICE.md)

## Implementation Status

ADR-0012收口的Restaurant Mock预约切片已实现：`Semantic Interpreter → Compiler → Reducer → Restaurant Agent Context → Decision → Action Validator → Fixture Discovery / Availability → Agent Selection → Authorization checkpoint → Policy → Mock Commit → Verifier`。当前State标识为`restaurant-state@8`；Pilot前没有真实Task数据，旧Schema迁移路径已经删除。

Discovery保存`RestaurantCandidate`，Availability按`candidateId → AvailabilityOffer[]`独立保存。单一Restaurant Agent决定何时搜索、开放式检索策略、检查哪些候选、选择哪个组合或何时再次搜索；Validator不再选择下一步。`SEARCH_RESTAURANTS`不重复Intent，`CHECK_AVAILABILITY`不重复日期/时段/人数；Router在调用Adapter前绑定这些权威参数。Fixture路径使用真正的`RestaurantAgentDecision` ModelGateway Contract，Harness可用Scripted Decision Port重复验证Trajectory。Policy、Authorization、Commit和Verifier仍是确定性权威边界。

ADR-0009继续定义开放`criteria`与`HARD` / `SOFT`强度；ADR-0010取代ADR-0007的确定性next-step部分，ADR-0011取代其中的Action Contract与Loop控制细节，ADR-0012定义不可变Migration、最小Agent Context和Proposal join。已冻结的Progressive Decision Harness `statePatch` Contract仍不接入产品Task State。

真实Search Source、Availability、Request Booking、Human Takeover、取消、变更与路线仍为`proposed`。当前产品应用见[`Persistent Restaurant Agent`](../../src/application/persistent-restaurant-agent.ts)，轻量Fixture Driver只位于[`src/eval/restaurant/search-fixture`](../../src/eval/restaurant/search-fixture/fixture-application.ts)。

## Semantic Proposal, Compiler, Agent and Action Validator

Restaurant是Semantic Proposal与Compiler的唯一当前真实使用者。Semantic Interpreter只描述用户本轮的稳定槽位和开放Restaurant Criterion；它不对cuisine、amenity、ambience或safety类别建模，也不输出`StatePatch`、Event、Readiness、Tool input或Outcome。

Restaurant Semantic Proposal Contract只验证这些表达的结构与Domain词表。通过校验不证明模型正确理解用户，也不是用户确认或可信外部事实。Restaurant Semantic Compiler是纯确定性Domain代码，负责将合法Proposal翻译成可由Task Runtime处理的Restaurant Event或State Patch。它不得调用模型、读取实时平台数据、决定Authorization或调用Adapter。

Reducer继续以`Old State + Event → New Authoritative State`维护权威事实。Restaurant Agent只能提出一个业务动作，Action Validator只允许、拒绝或要求Authorization；两者都不能写State或调用Provider。`NEED_REINTERPRETATION`继续是安全交互行为：不自动重新解释、覆盖State或触发Tool。

模型只接收`restaurant-agent-context@1`投影：当前Intent Draft、派生缺失字段、展示安全Candidate/Offer、选择、phase和failure code。完整Task State中的Authorization、Proposal、Attempt、Provider执行结果、Evidence和Reservation继续只由Runtime、Policy、Router和Verifier读取。`BOOK_RESERVATION`的trajectory持久化其确定性`proposalId`，用于和后续Authorization、Command、Attempt、Evidence与Outcome审计连接；它不使Agent拥有这些对象的写权或Outcome解释权。

`restaurant-state@7`的本地开发Task不迁移到当前`restaurant-state@8`。需要保留该类调试数据时先在外部备份；不再需要时只能用双重显式开关的本机开发重置命令删除，详见[Repository Conventions](../REPOSITORY-CONVENTIONS.md#migration与开发数据重置)。

任何LLM对结果的解释、澄清问题或条件调整建议都不是Semantic Proposal的替代品。建议必须由用户在新消息中明确确认或修改，才能再次进入正式的Interpreter → Contract → Compiler链。

## Current fixture Intent

```ts
type RestaurantBookingIntent = {
  timezone: "Asia/Tokyo";
  date: string;
  timeWindow: { earliest: string; latest: string };
  partySize: number;
  area: { query: string; placeId?: string; radiusMeters?: number };
  criteria: Array<{
    text: string;
    polarity: "POSITIVE" | "NEGATIVE";
    strength: "HARD" | "SOFT" | "UNSPECIFIED";
  }>;
  budgetPerPerson?: { max: number; currency: "JPY" };
};
```

Reducer维护可缺阻塞字段的`RestaurantIntentDraft`：`date`、`timeWindow`、`partySize`、`area`可以为空，但必须通过同一Domain Validator。`missingBlockingFields(draft)`从这四个权威值即时计算，不持久化第二份readiness。未知字段、无效日历日期、空字符串、错误JPY预算和嵌套未知字段一律拒绝；四项齐全时Runtime才可创建完整`RestaurantBookingIntent`并开始搜索。

Semantic Operation固定为：singleton `ASSERT/CORRECT=set`、`NEGATE=clear`、`CONFIRM=no state mutation`；同一turn对同一singleton同时`NEGATE`与`ASSERT/CORRECT`是`CONTRADICTORY_PROPOSAL`，绝不按facts数组顺序决定State。唯一collection `CRITERION`为`ASSERT=add`、`CORRECT=replace collection`、`NEGATE=remove matching criterion`，不允许collection `CONFIRM`。Criterion文本保留简洁用户措辞，身份按text trim/case与polarity/strength精确值决定。

阻塞字段是日期、时间、人数和区域。菜系与预算未提供时可搜索，但必须透明说明。

## Entity

```ts
type RestaurantOutlet = {
  id: string;
  brandName?: string;
  outletName: string;
  sourceIds: Record<string, string>;
  address: string;
  coordinates?: { lat: number; lng: number };
  provenance: Record<string, string>;
};
```

预约必须绑定Outlet。Source字段冲突时保留Provenance和当前预约页事实，不用模型覆盖真实字段。

## Offer与候选

```ts
type AvailabilityOffer = {
  id: string;
  restaurantId: string;
  source: string;
  dateTime: string;
  timezone: "Asia/Tokyo";
  partySize: number;
  seating?: string;
  plan?: string;
  price?: { amount: number; currency: "JPY"; basis: "PER_PERSON" | "TOTAL" };
  cancellationTerms?: string;
  bookingMode: "INSTANT" | "REQUEST";
  executionMode: "API" | "BROWSER" | "TAKEOVER" | "DEEPLINK";
  checkedAt: string;
  expiresAt: string;
};

type RestaurantCandidate = {
  restaurant: RestaurantOutlet;
  matchReasons: string[];
  warnings: string[];
  executionConfidence: "HIGH" | "MEDIUM" | "LOW";
};
```

`SEARCH_RESTAURANTS`只产生`RestaurantCandidate`。`CHECK_AVAILABILITY`才产生`AvailabilityOffer`并按`candidateId`保存；没有新鲜匹配Offer的Candidate不得进入Booking Proposal。

## Domain State

完整MVP目标状态如下；并非全部已经实现。`NEED_REINTERPRETATION`是交互安全行为而非Domain State，不加入此状态机：

```text
UNDERSTANDING
NEEDS_INPUT
SEARCHING
AWAITING_AUTHORIZATION
EXECUTING
HUMAN_TAKEOVER
VERIFYING
PENDING_PROVIDER_CONFIRMATION
BOOKED_VERIFIED
SELECTION_REQUIRED
OUTCOME_UNKNOWN
NEEDS_ATTENTION
FAILED
CANCELLED_VERIFIED
```

关键转换：

- Intent完整后由Agent选择`SEARCH_RESTAURANTS`→`SEARCHING`。
- Agent可在Discovery后独立调用`CHECK_AVAILABILITY`、`SELECT_CANDIDATE`和`BOOK_RESERVATION`。
- `SELECTION_REQUIRED`意味着Agent可继续检查或选择，不投影为等待用户，也不保留旧的`SELECT_CANDIDATE` pending-user action。
- `BOOK_RESERVATION`只创建Action Proposal并进入`AWAITING_AUTHORIZATION`。
- Offer失效或明确失败→`SELECTION_REQUIRED`，不自动换店。
- 提交后结果不明→`OUTCOME_UNKNOWN`，不允许新预约。

## 排序与显示

先应用硬约束，再结合实时空位、执行可靠性、菜系/预算匹配、距离和接管成本。候选卡显示：分店、时间、人数、价格依据、套餐/座位、取消条款、查询时间、来源和接管要求。

## 过敏与特殊要求

本节是Restaurant候选卡、特殊要求处理和预约前披露同意的详细Source of Truth。具体UI、State Schema、Adapter字段和外部写入流程仍为`proposed`，在真实Discovery/Availability与Booking Stage以本节为验收边界实现。

### 需求分类与追问

- 过敏、宗教限制、无障碍、儿童需求等属于`special requirement`；“不想吃辣”等普通口味取舍仍是偏好，不能自动升级为过敏。
- 特殊要求不是每次初步推荐都必须追问的普通核心字段。日期、时间/时段、人数和地点策略足以形成搜索上下文时，应允许先给有差异的推荐；页面应提供显眼但非阻塞的“过敏或饮食限制”入口。
- 用户明确给出严重过敏或其他安全关键限制后，它立即成为Hard Constraint：不得为了候选数量、菜系或距离多样性而静默放宽。
- 预约前若当前Case存在该Hard Constraint，披露同意成为阻塞条件；这与初步推荐的非阻塞入口不同。

### 候选卡的过敏信息

当来源提供与用户声明限制相关的信息时，候选卡必须显示清晰、面向用户的处理状态、来源和查询时间。不得把来源原话或内部证据等级包装成医疗保证。

| 来源状态 | 候选展示规则 | 必须表达的用户含义 |
|---|---|---|
| 未提供相关信息 | 可作为普通探索候选；若用户已声明严重过敏，不可作为满足该限制的候选 | “未提供过敏处理信息；需自行向餐厅确认。” |
| 可接受过敏请求 | 可作为带提示的备选 | “可向餐厅提交该过敏请求；餐厅确认前不能视为已满足。” |
| 来源说明有处理流程 | 可作为优先的待确认候选 | “来源说明该店有相关处理流程；仍需餐厅确认本次可否处理。” |
| 明确不支持该限制 | 当用户已声明该限制时直接排除 | 不作为可选餐厅展示。 |

“可接受请求”只表示Praxis可以把用户的要求交给餐厅，不表示不存在意外混入、该餐厅必能处理，或这次预约已获接受。外食中的过敏原信息提供并非统一强制要求，且厨房混入与菜单/原料变动是现实限制；来源信息必须随其`source`、`observedAt`和适用范围保存与展示。[农林水产省说明](https://www.maff.go.jp/j/syokuiku/wpaper/r6/r6_h/book/part2/chap7/b2_c7_2_00.html) [消费者厅外食指引](https://www.caa.go.jp/policies/policy/food_labeling/food_sanitation/allergy/efforts)

### 预约前的过敏披露 Consent Card

用户选择带有已声明过敏Hard Constraint的候选后，`Book this`不能直接创建可提交的预约Authorization。先显示一个单独的Consent Card；用户确认后才创建一次性Authorization并允许Adapter把信息发送到餐厅。

Consent Card至少应：

1. 再次展示Restaurant Outlet、日期/时间、人数和当前Booking Mode；
2. 显示将对外披露的最小过敏信息，允许用户补充或修正说明；
3. 明确说明餐厅尚未确认可处理该要求，且“已提交请求”不等于“该要求已满足”；
4. 取得用户对本次向该餐厅披露该信息及提交预约/请求的明确同意；
5. 用户拒绝披露时停止该候选的预约推进，不得隐去Hard Constraint后继续提交。

只有餐厅或平台回执明确接受特殊要求，Case才可把该要求标记为满足；仅提交、备注成功或预约平台已受理时仍为`已提交请求`，按需要进入`PENDING_PROVIDER_CONFIRMATION`，不能给出安全或可就餐保证。

## Adapter行为

- Partner API：有合法凭证和Consumer Booking权限时使用。
- TableCheck Web：按Verified Adapter操作；API不作为无条件依赖。
- Hot Pepper：公开API用于Discovery；Availability/Booking通过网页或合作接口。
- 官网：仅Capability Registry中健康的Adapter允许自动提交。
- Request Booking：进入等待状态，不宣称已确认。

## Outcome

成功必须由Domain Verifier同时匹配活动Attempt、餐厅、日期时间、人数及预约编号或等价平台引用。特殊要求只在餐厅明确接受时标记满足。

```ts
type BookingProofBundle = {
  evidenceId: string;
  attemptId: string;
  strength: "STRONG" | "WEAK";
  source: string;
  observedAt: string;
  artifactRef?: { kind: string; reference: string; sha256?: string };
  claims: {
    status?: "CONFIRMED" | "SUBMITTED" | "UNKNOWN";
    providerReference?: string;
    restaurantId?: string;
    dateTime?: string;
    partySize?: number;
  };
  matchedFields: string[];
  missingFields: string[];
  conflictingFields: string[];
};
```

Completion Conditions：

```text
End State: BOOKED_VERIFIED
Proof: Strong、Attempt匹配、预约编号/分店/时间/人数/状态匹配
Invariants: 只提交已授权候选、单Attempt单Commit、Weak不能成功、Unknown不重试
Bound: Search Deadline、Offer TTL、验证截止时间和后续Tool预算
```

当前代码已实现Proof与Invariants中的验证部分；Search Deadline和Tool预算仍属于后续Stage。
