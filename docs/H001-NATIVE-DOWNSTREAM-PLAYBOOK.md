# Praxis H001 Native Live 下一阶段 Playbook

## 1. 本轮目标

继续以 **H001** 为唯一基准，不扩展 H002–H005。

目标不是单独修 Teppen，而是把整个 native-first H001 跑通到：

```text
用户 H001
→ Tabelog 原生找店
→ 连续调查多个候选
→ facts + 精确查位
→ Tabelog 本批不足时继续 TableCheck
→ facts + 精确查位
→ 有合格结果则 PRESENT_RESULTS
→ 没有则准确停止
```

本轮需要同时解决三个已经由 Live 暴露的问题：

1. **候选供给和续查有问题**
   - Tabelog 只进入了 1 家；
   - 但 artifact 同时记录 `exhausted=false`；
   - 系统却已经进入 `TABELOG_DONE` 并切到 TableCheck。

2. **native candidate 仍被旧 identity 逻辑挡住**
   - Teppen native discovery 成功；
   - 同一个 Tabelog URL 后续查位却返回 `ENTITY_MATCH_UNCERTAIN`；
   - fact read 又返回 `NATIVE_SOURCE_IDENTITY_UNCONFIRMED`。

3. **完整后段没有被 Live 验证**
   - 没有真正运行日期、人数、时间控件；
   - 没有真正形成 request-bound availability；
   - 没有证明首店失败以后能够继续下一店；
   - 没有证明 Tabelog 不够以后 TableCheck 能找到候选并完成；
   - 没有跑到 PRESENT_RESULTS。

---

# 2. 本轮保持冻结

不修改：

```text
Semantic Prompt / Schema / Compiler
H001 Gold
target.goal
selectionScope
party size
date/time
omakase HARD
现有 H001 地点含义
现有 Google named-place resolution
```

当前 H001 的权威要求仍是：

```text
near Shibuya
具体日期
19:00
2 people
omakase HARD
AVAILABILITY
OPEN_ENDED
```

本次 Live 中这些字段保持正确，不是当前 blocker。

同时不新增：

```text
智能 provider routing
两站并行
新的 geo/radius 系统
多来源实体合并系统
无限分页
browser control 大重构
```

---

# 3. 固定来源策略仍然不变

本阶段固定：

```text
Tabelog
   ↓
本来源的有界调查
   ↓
如果当前交付条件仍未满足
   ↓
TableCheck
   ↓
本来源的有界调查
   ↓
展示或准确停止
```

不是：

```text
Tabelog 查一家
→ TableCheck 查一下
→ END
```

而是：

> **Tabelog 一个完整的 bounded batch → TableCheck 一个完整的 bounded batch。**

---

# 4. 问题一：修复 Tabelog 只查一家就切站

当前 Live：

```text
Tabelog:
1 candidate discovered
1 newly accepted

continuation:
nativeStage = TABELOG_DONE
pagesRead = 1
exhausted = false
```



这里明显需要查清：

> 为什么 `exhausted=false`，却已经认为 Tabelog 本阶段完成？

## 正确行为

一个 Tabelog batch 应继续，直到以下任意条件成立：

```text
A. 达到现有 per-source / candidate batch ceiling
B. 当前来源 bounded search 确实 exhausted
C. 已取得足够的 qualified result，可以进入展示
D. 全局预算 / deadline / cancellation 触发
```

**不能因为“已经接受了第一个 candidate”就认为 Tabelog 完成。**

实现上尽量复用当前 continuation：

```text
如果 Tabelog exhausted = false
且当前 Tabelog batch 仍有预算
且还需要更多结果
→ 下一次 SEARCH_RESTAURANTS 仍然继续 Tabelog
```

只有 Tabelog batch 真正结束以后，Router 才切 TableCheck。

不要求一次搜索必须返回三家。

可以继续保持：

```text
search
→ 调查 candidate A
→ search continuation
→ candidate B
→ ...
```

这样对现有 Agent/Runtime 改动最小。

## 同时增加 discovery funnel

两个来源统一记录：

```text
raw/source results
parsed outlets
new outlets
geo/admission rejected
duplicate rejected
accepted
pages read
batch limit reached?
source exhausted?
```

这样以后不能再出现：

```text
Tabelog = 1
TableCheck = 0
```

却不知道为什么。

---

# 5. 问题二：native path 移除 cross-source matcher

Matcher 保留，但职责重新收窄：

```text
Google A ?= Tabelog B
Google A ?= TableCheck B
Tabelog A ?= TableCheck B
```

这种**跨平台实体关系**才使用 matcher。

---

## Native 同平台路径

例如：

```text
Tabelog search
→ sourceEntityId=A
→ Tabelog detail A
→ Tabelog availability A
```

不再重新要求：

```text
name + phone + address
→ HIGH identity
```

来证明 `A = A`。

本次 Teppen discovery 已经保存：

```text
candidateId
sourceEntityId
sourceUrl
provider
provenance
```



而 availability 又实际导航到了同一个 Tabelog URL，却直接结束于 `ENTITY_MATCH_UNCERTAIN`。

这是本次必须修掉的旧架构假设。

---

## Native 路径只保留 continuity protection

不是 matcher，而是：

```text
ProviderOutletRef
provider
sourceEntityId
sourceUrl
```

一路传递到：

```text
FACT_READ
AVAILABILITY_READ
```

只有出现明确异常时 fail closed：

```text
challenge / captcha
404 / error page
页面明确变成另一个 outlet ID
导航离开当前 provider 且无法确认关系
库存目标无法绑定当前 source entity
```

不要再因为：

```text
地址格式变化
缺电话
postal code 差异
英文/日文名字差异
```

在同 provider native path 中重新做实体 matching。

同时必须有 negative controls，确保真正跑错店仍会被挡住。

---

# 6. 问题三：TableCheck 的 0 candidate 必须查清

本次 TableCheck **确实执行了 discovery**：

```text
provider = TABLECHECK
pagesRead = 2
exhausted = true
candidates = []
```



所以不是“完全没查”。

但目前不知道 0 是怎么形成的。

必须通过前面的 funnel 区分：

```text
页面本身没有结果
OR
页面有结果但 parser=0
OR
parser 有结果但 admission 全拒绝
OR
候选被 dedupe 掉
OR
页面状态异常
```

然后只修真实原因。

### 明确边界

如果：

```text
raw > 0
parsed = 0
```

修 parser。

如果：

```text
parsed > 0
accepted = 0
```

看 rejection reason，只修错误 admission。

如果：

```text
raw = 0
source exhausted = true
```

接受该来源本轮没有候选。

不为了 H001 通过而：

```text
放宽涩谷条件
换时间
偷偷扩大来源范围
```

---

# 7. 最重要的一条：完整验证后段

这才是下一阶段真正的完成标准。

不能再接受：

```text
native discovery works
+
isolated availability fixture works
```

然后就认为链路没问题。

必须验证：

```text
真实 native discovery output
        ↓
Runtime
        ↓
facts
        ↓
request-bound availability
        ↓
evidence admission
        ↓
continue / switch provider / present
```

---

## 7.1 同一来源首店失败，要继续下一店

受控场景至少：

```text
Tabelog A
→ omakase 满足
→ 19:00 / 2p UNAVAILABLE

Tabelog B
→ omakase 满足
→ availability UNKNOWN

Tabelog C
→ omakase 满足
→ 19:00 / 2p AVAILABLE
```

预期：

```text
A 不结束任务
B 不结束任务
继续 C
→ PRESENT_RESULTS(C)
```

不能：

```text
第一家 UNAVAILABLE
→ source done
```

也不能：

```text
第一家 UNKNOWN
→ task done
```

---

## 7.2 Tabelog 本批没有结果，要继续 TableCheck

受控场景：

```text
Tabelog batch
A unavailable
B unavailable
C unknown / criteria fail
       ↓
Tabelog bounded batch finished
       ↓
TableCheck search
       ↓
D available + omakase
       ↓
PRESENT_RESULTS(D)
```

这一条必须经过：

```text
真实 Router
真实 Runtime
真实 Agent decision
正式 evidence admission
```

不能直接在测试里把 D 塞进最终 State。

---

## 7.3 第二来源也要能连续调查多家

TableCheck 也不是：

```text
search 一次
→ 第一家失败
→ END
```

而是同样遵守：

```text
当前 bounded batch
→ candidate 1
→ candidate 2
→ candidate 3...
```

直到：

```text
qualified result
或 batch/source bounded end
或全局预算结束
```

---

# 8. PRESENT_RESULTS 也必须在本轮一起验证

这是我们之前 H001 已经暴露过的另一个问题，不能再漏掉。

当前 runtime 仍记录：

```text
resultBatchTarget.candidateCount = 3
```



但 H001 acceptance 本身并没有要求“必须有三家才能展示”；它要求的是正确门店、omakase 证据以及准确请求的当前 slot。

因此：

> `target=3` 应该是搜索目标，不应该成为“少于3家禁止 PRESENT_RESULTS”的硬 completion gate。

必须有测试：

```text
Tabelog + TableCheck bounded investigation 完成
仅找到 1 或 2 家 qualified candidates
```

预期：

```text
PRESENT_RESULTS(qualified candidates)
```

不能：

```text
因为不到 3
→ NO_VERIFIED_RESULT
```

也不能在 deadline 已接近时无限追第三家。

---

# 9. Browser execution 这一轮怎么验

当前 Live 不能证明 browser availability 已 OK。

实际只发生：

```text
NAVIGATE
SNAPSHOT
```

然后 identity gate 就退出。

所以本轮修复后，必须第一次真正观察：

```text
native candidate
→ detail page
→ availability UI
→ date
→ 2 guests
→ 19:00
→ inventory state
```

只有到了这里，才能评价：

```text
browser controls 是否 OK
request confirmation 是否 OK
availability extraction 是否 OK
```

### 如果这时出现新的 browser failure

再开下一个小循环：

```text
具体 control / extraction failure
→ fixed page red/green
→ integrated regression
→ 下一次 Live
```

不要现在预先重写 browser executor。

---

# 10. 测试矩阵

## A. Native continuity

```text
Tabelog native A → Tabelog A fact
Tabelog native A → Tabelog A availability
TableCheck native B → TableCheck B fact
TableCheck native B → TableCheck B availability
```

全部：

```text
cross-source matcher calls = 0
```

错误 outlet / challenge 仍 fail closed。

---

## B. Tabelog continuation

```text
page/batch contains >1 usable candidate
first candidate fails
exhausted = false
```

必须继续 Tabelog。

不能提前切 TableCheck。

---

## C. TableCheck continuation

同理验证：

```text
first TableCheck candidate fails
还有 batch capacity / source result
→ continue TableCheck
```

---

## D. Provider handoff

```text
Tabelog bounded batch 无 qualified result
→ TableCheck automatically starts
```

且：

```text
date
time
party size
hard criteria
```

全部保持原请求。

---

## E. End-to-end controlled success

至少两个正式组合测试：

### Scenario 1

```text
Tabelog:
A fail
B available

→ PRESENT_RESULTS(B)
→ TableCheck calls = 0
```

### Scenario 2

```text
Tabelog:
A unavailable
B fail
Tabelog bounded end

TableCheck:
C unavailable
D available

→ PRESENT_RESULTS(D)
```

---

## F. Partial result delivery

```text
bounded investigation completed
qualified = 1 or 2
target = 3
```

预期：

```text
PRESENT_RESULTS
```

不是强制继续，也不是 `NO_VERIFIED_RESULT`。

---

## G. True no-result

```text
两个来源 bounded batch 都完成
所有 candidate 都：
unavailable / criteria fail / unresolved
```

才允许：

```text
END_READ
NO_VERIFIED_RESULT
```

并准确记录 scoped reason。

---

# 11. Artifact / diagnostic 本轮需要补什么

不要再加一套 Eval 框架。

只补这次真正缺失的信息：

```text
Provider discovery funnel
- raw
- parsed
- admitted
- rejected + reason
- pages
- exhausted
- batch limit

Provider progression
- current provider
- continue same provider reason
- provider switch reason

Native continuity
- expected sourceEntityId
- observed sourceEntityId / page state
- continuity pass/fail reason

Downstream stage
- FACT
- AVAILABILITY
- PRESENTATION

Availability
- requested date
- party size
- time
- final status / reason
```

这样下一次 Live 失败时，我们能直接回答：

> 卡在发现、续查、facts、browser controls、库存提取，还是 delivery。

---

# 12. 实施顺序

### Slice 1 — 修 native continuity

目标：

```text
Teppen 不再被旧 cross-source matcher 挡住
```

并保证负例仍 fail closed。

---

### Slice 2 — 修 source continuation + candidate funnel

重点同时解决：

```text
Tabelog exhausted=false 却 DONE
TableCheck 0 candidate 无法解释
```

目标：

```text
一批可以调查多家
来源切换有明确原因
```

---

### Slice 3 — 完整 downstream controlled integration

从真实 native discovery output 开始：

```text
native discovery
→ Runtime
→ facts
→ availability
→ continue same source
→ switch source
→ PRESENT_RESULTS
```

跑前面的 Scenario 1 / Scenario 2 / Partial Result / No Result。

**这一步不通过，不允许再把 isolated fixed-page 通过解释成 H001 ready。**

---

### Slice 4 — 下一次 H001 Live

保持：

```text
同一个 H001
同一个来源顺序
Tabelog → TableCheck
现有预算
默认 browser 网络
```

不要临时调输入来制造成功。

---

# 13. 下一次 H001 Live 的签收标准

下一次报告必须分别回答：

### Discovery

```text
Tabelog 找到多少？
为什么是这个数量？
是否继续到 batch end？

TableCheck 是否触发？
找到多少？
为什么是这个数量？
```

### Facts

```text
多少真实 native candidate
完成了 omakase 事实判断？
```

### Availability

```text
多少真实 candidate
真正进入 date / 2p / 19:00 availability UI？

AVAILABLE
UNAVAILABLE
UNKNOWN
分别多少？
```

### Continuation

```text
首店失败后是否继续同 source？
Tabelog 不够后是否继续 TableCheck？
```

### Delivery

```text
有 qualified result 时是否 PRESENT_RESULTS？
不到 target=3 时是否仍能交付已有 qualified result？
```

### Browser

只有真正执行日期／人数／时间后，才评价 browser execution。

---

# Done Definition

这一阶段完成，不是要求当天网站一定有位，而是要求系统已经具备：

```text
1. 两站 native candidate 不经过 cross-source matcher。

2. Tabelog / TableCheck 都能连续调查一批候选，
   不因第一家失败提前结束。

3. Tabelog bounded batch 不足时能正确切 TableCheck。

4. 候选数量和 rejection 都可解释。

5. 真实 native output 能穿过 Runtime →
   facts → exact availability。

6. 首店 unavailable / unknown 时能够继续。

7. 两个来源都能真正执行到查位层。

8. 一旦存在符合 H001 的真实 qualified candidate，
   能进入 PRESENT_RESULTS。

9. target=3 不阻止已有 qualified result 的正常交付。

10. 两站 bounded investigation 真无可交付结果时，
    才正确 END_READ。
```

**这次不是修一个 Teppen bug，而是把 `native discovery → 多候选调查 → 第二来源 → exact availability → delivery` 这整个 H001 vertical slice 真正闭环。**