# Per-file and per-case review

Status: proposed review list, no test edits; current baseline main ba466eb3. Source and each exact assertion are frozen in static-cards.json; 1,378 runtime test cases + 5 suites map with zero gaps. Reasons below use the individual input/contract and falsifiable assertions, with 128 separately reviewed file notes. A retained test has no proven same-input/path/consequence replacement in this proposal; it does not assert that no future consolidation is possible.

The source declaration list includes 8 frozen PostgreSQL probes which were not run and are not counted in either current gate. Parser extraction is mechanical; ownership, protection and the five change proposals are review judgments, not a test-coverage or model-generated Gold score.

## src/application/restaurant-agent-loop.test.ts

P1-G/P2-0 是真实失败到用户收尾的分类，不等同于浏览器局部 UNKNOWN；F6 槽3原反例以及授权/副作用系统错误须保护。表驱动不同原因逐个保留，不因都进入 NO_VERIFIED_RESULT 合并。

### 72 — `P1-G2 actual ${fixture.name} stop returns a user-facing outcome`

**KEEP_DISTINCT_CONTRACT**

- default / P1-G2 actual P1-F-B-h001 stop returns a user-facing outcome / 18.476 ms / pass
- default / P1-G2 actual P1-G-h001 stop returns a user-facing outcome / 13.171 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.current.domainState.phase, "NO_VERIFIED_RESULT")`
- `assert.equal(result.current.outcome?.status, "NO_VERIFIED_RESULT")`
- `assert.ok(result.current.domainState.noVerifiedResult?.remainingGaps.some(gap => gap.includes("REJECTION_LIMIT")))`

### 85 — `P1-G2 ${termination} retains ${code} as a scoped reason`

**KEEP_DISTINCT_CONTRACT**

- default / P1-G2 REJECTION_LIMIT retains BROWSER_RUNTIME_FAILED as a scoped reason / 10.178 ms / pass
- default / P1-G2 NO_PROGRESS retains GOOGLE_LOCATION_UNRESOLVED as a scoped reason / 5.593 ms / pass
- default / P1-G2 STEP_LIMIT retains AVAILABILITY_FAILED as a scoped reason / 7.752 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(current.domainState.phase, "NO_VERIFIED_RESULT")`
- `assert.ok(summary.remainingGaps.some(gap => gap.includes(termination) && gap.includes(code)))`
- `assert.equal(current.domainState.failure, undefined)`

### 99 — `P1-G2 actual ${failure} stays FAILED`

**KEEP_DISTINCT_CONTRACT**

- default / P1-G2 actual PROVIDER_REJECTED stays FAILED / 11.852 ms / pass
- default / P1-G2 actual UNCAUGHT_EXCEPTION stays FAILED / 88.039 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.current.domainState.phase, "FAILED")`
- `assert.equal(result.current.domainState.failure?.code, failure === "PROVIDER_REJECTED" ? "PROVIDER_REJECTED" : "AGENT_EXECUTION_FAILED")`
- `assert.equal(result.current.domainState.noVerifiedResult, undefined)`

### 106 — `P1-G2 ${code} cannot become a business completion`

**KEEP_DISTINCT_CONTRACT**

- default / P1-G2 AUTHORIZATION_INVALID cannot become a business completion / 1.691 ms / pass
- default / P1-G2 SIDE_EFFECT_UNCERTAIN cannot become a business completion / 6.821 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.current.domainState.phase, "FAILED")`
- `assert.equal(result.current.domainState.noVerifiedResult, undefined)`

### 115 — P2-0 actual h001 step-six exhausted state stops before another model proposal

**KEEP_DISTINCT_CONTRACT**

- default / P2-0 actual h001 step-six exhausted state stops before another model proposal / 1.366 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(result.decisionCalls <= 2, "known budget failure must not cause more agent proposals")`
- `assert.equal(result.current.domainState.phase,"NO_VERIFIED_RESULT")`

### 121 — P2-0 bounded timeout returns a truthful user result

**KEEP_DISTINCT_CONTRACT**

- default / P2-0 bounded timeout returns a truthful user result / 3.522 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.current.domainState.phase,"NO_VERIFIED_RESULT")`

### 126 — `P2-0 ${type} rejects a known exhausted budget before source work`

**KEEP_DISTINCT_CONTRACT**

- default / P2-0 SEARCH_RESTAURANTS rejects a known exhausted budget before source work / 0.544 ms / pass
- default / P2-0 INVESTIGATE_CANDIDATE_FACTS rejects a known exhausted budget before source work / 0.461 ms / pass
- default / P2-0 CHECK_AVAILABILITY rejects a known exhausted budget before source work / 0.453 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(validateRestaurantAction(exhaustedFixture.state,action,exhaustedFixture.now).status,"REJECTED")`
- `assert.equal(validateRestaurantAction(fresh,action,exhaustedFixture.now,{remainingModelCalls:0}).status,"REJECTED")`
- `assert.equal(validateRestaurantAction(fresh,action,exhaustedFixture.now,{browserModelBudgetExhausted:true}).status,"REJECTED")`

### 134 — P2-0 failed executions do not reset consecutive no-progress accounting

**KEEP_DISTINCT_CONTRACT**

- default / P2-0 failed executions do not reset consecutive no-progress accounting / 5.148 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.decisionCalls,3)`
- `assert.equal(result.current.domainState.phase,"NO_VERIFIED_RESULT")`
- `assert.ok(result.current.domainState.noVerifiedResult?.remainingGaps.some(g=>g.includes("NO_PROGRESS")))`

### 142 — P2-0 system-ended no-result records structured business termination

**KEEP_DISTINCT_CONTRACT**

- default / P2-0 system-ended no-result records structured business termination / 4.325 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(reason && {type:reason.type,reasonCode:reason.reasonCode,isSystemReason:reason.isSystemReason}, {type:"NO_PROGRESS",reasonCode:"BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED",isSystemReason:false})`

### 149 — P2-0 failure classification is exhaustive across typed model/browser/Google contracts

**KEEP_DISTINCT_CONTRACT**

- default / P2-0 failure classification is exhaustive across typed model/browser/Google contracts / 6.009 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(checked.PROVIDER_REJECTED,"SYSTEM")`
- `assert.equal(restaurantFailureCode("arbitrary provider code","SEARCH_FAILED"),"AGENT_EXECUTION_FAILED")`
- `assert.equal(checked.BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED,"BUSINESS")`

### 162 — P2-0 an unrecognized persisted failure cannot default to business

**KEEP_DISTINCT_CONTRACT**

- default / P2-0 an unrecognized persisted failure cannot default to business / 0.639 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(restaurantReadStopIsSystem("NO_PROGRESS","unclassified persisted code" as import("../domains/restaurant/failure-codes.js").RestaurantFailureCode),true)`

### 169 — F6 slot3 26.596 seconds blocks the original availability action and ends honestly

**KEEP_PROTECTED**

- default / F6 slot3 26.596 seconds blocks the original availability action and ends honestly / 19.841 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(sourceCalls,0,'the original slot3 CHECK_AVAILABILITY must never start with only 26.596 seconds')`
- `assert.deepEqual(observedContexts[0]?.legalActions.checkAvailability,[],'real code-derived context removes the unaffordable action')`
- `assert.equal(current.domainState.phase,'NO_VERIFIED_RESULT')`

保护：EXPLICIT_HISTORICAL_REGRESSION

## src/application/restaurant-message-handler.test.ts

从原始用户消息经过 Interpreter/Compiler 写 State；人数补充只用于查位，ADR-0044 的引文与目标保留不能由 Compiler 单元测试代替。

### 48 — T1-T6 handler composition patches only an eligible missing availability party

**KEEP_DISTINCT_CONTRACT**

- default / T1-T6 handler composition patches only an eligible missing availability party / 15.319 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(explicit.calls(), 0, "T1 primary explicit party never calls the resolver")`
- `assert.deepEqual({ partySize: explicitEvent.patch.partySize, source: explicitEvent.patch.partySizeSource, audit: explicitEvent.partySizeSupplement }, { partySize: 4, source: "EXPLICIT", audit: undefined })`
- `assert.equal(relational.calls(), 1, "T2 calls once after primary omission")`

### 82 — ADR-0044 handler rejects missing, empty or fabricated citations before any semantic State write

**KEEP_DISTINCT_CONTRACT**

- default / ADR-0044 handler rejects missing, empty or fabricated citations before any semantic State write / 1.690 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.snapshot.domainState.phase, "FAILED")`
- `assert.equal(calls, 2)`
- `assert.equal(event.type, "SEMANTIC_INTERPRETATION_FAILED")`

### 103 — ADR-0044 real semantic handler and Reducer retain either goal and only availability supplements a missing party

**KEEP_DISTINCT_CONTRACT**

- default / ADR-0044 real semantic handler and Reducer retain either goal and only availability supplements a missing party / 1.366 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(party.calls(), goal === "AVAILABILITY" ? 1 : 0)`
- `assert.equal(event.type, "SEMANTIC_PROPOSAL_COMPILED")`
- `assert.equal(result.snapshot.domainState.intentDraft?.target?.goal, goal)`

## src/application/restaurant-presentation-evidence.test.ts

历史源片段经过 Judgment→Router→Reducer 才判断 HARD/价格；同源事实的归属、服务范围和刷新各有独立反例，历史 Live 展示失败不删。

### 19 — saved holdout case02 events expose five structured HARD budgets through Router to Reducer with independent price agreement

**KEEP_DISTINCT_CONTRACT**

- default / saved holdout case02 events expose five structured HARD budgets through Router to Reducer with independent price agreement / 377.307 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(expected.status,"MET")`
- `assert.equal(budget.status,expected.status)`
- `assert.ok(budget.sources.length)`

### 49 — c05 Kaga Router to Reducer retains the later availability-read source fact

**KEEP_DISTINCT_CONTRACT**

- default / c05 Kaga Router to Reducer retains the later availability-read source fact / 98.520 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(!original.presentedResults!.evidenceIds.includes(laterFact), "preserve the historical red-light observation")`
- `assert.equal(state.phase, "SEARCHING")`
- `assert.ok(state.availabilityChecks[candidateId]!.evidenceIds.includes(laterFact))`

### 94 — C18 H002 current fact document carries same-page prices through judgment and Router to Reducer

**KEEP_G3_COORDINATION**

- default / C18 H002 current fact document carries same-page prices through judgment and Router to Reducer / 543.064 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(freshPrices?.dinnerBudgetRangeYen, prices!.dinnerBudgetRangeYen, "native source producer retains same-page prices")`
- `assert.equal(wire.sourceDocuments[0].priceFacts, undefined, "structured prices stay private, preserving the model contract")`
- `assert.ok(check.supersededEvidenceIds?.some(old => state.readEvidence.find(e => e.evidenceId === old)?.priceFacts), "older priced fact remains superseded")`

### 180 — C18 four split tempura statements inherit their containing merchant field through judgment and presentation

**KEEP_G3_COORDINATION**

- default / C18 four split tempura statements inherit their containing merchant field through judgment and presentation / 386.727 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(fresh.sourceFieldQuotes?.some(q => q.field === "CATEGORY" && q.quote === "Tempura"), \`${runId}:${id}: selected line must inherit CATEGORY from containing field\`)`
- `assert.ok(fresh.sourceFieldQuotes!.every(q => statements.some(s => s.text === q.quote)), "do not expand a selected line into unselected field text")`
- `assert.equal(shown.conditionStates[candidateId]![0]!.status, "MET", \`${runId}:${id}: split tempura must reach actual presentation\`)`

### 241 — C18 selected Utou course titles remain known when the selected statement also contains the item count

**KEEP_G3_COORDINATION**

- default / C18 selected Utou course titles remain known when the selected statement also contains the item count / 267.441 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(fresh.sourceFieldQuotes?.some(q => q.field === "COURSE_TITLE" && q.quote === title.quote))`
- `assert.ok(fresh.sourceFieldQuotes!.filter(q => q.field === "COURSE_TITLE").every(q => !q.quote.includes("8 items")), "adjacent item counts cannot inherit COURSE_TITLE")`
- `assert.ok(shown.conditionStates[candidateId]![0]!.sources.some(q => q.field === "COURSE_TITLE" && q.quote.includes("Kaiseki with Exquisite Ingredients") && !q.quote.includes("8 items")))`

### 306 — Phase2c four observed cuisine conditions reach Router to Reducer and other saved displays stay identical

**KEEP_DISTINCT_CONTRACT**

- default / Phase2c four observed cuisine conditions reach Router to Reducer and other saved displays stay identical / 122.876 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(before.status,"NOT_CHECKED")`
- `assert.equal(after.status,"MET",\`${row.runId}:${id}: already observed cuisine must be displayed\`)`
- `assert.equal(independent.status,"MET")`

## src/application/run-bounded-model-gateway.test.ts

计数含语义和失败请求，Run 间隔离与关闭后迟到工作是不同边界；独立问题不能借用已耗尽的搜索账户。

### 9 — whole-read model budget starts before semantic work, counts failed calls, and isolates concurrent runs

**KEEP_DISTINCT_CONTRACT**

- default / whole-read model budget starts before semantic work, counts failed calls, and isolates concurrent runs / 1.903 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(budget.remainingCalls("case-a"), undefined)`
- `assert.rejects(() => budget.run("case-a", async () => { await assert.rejects(() => budget.complete(request), /provider failure/); assert.equal(budget.remainingCalls("case-a"), 1, "failed calls consume the reported reserve"); await budget.complete(request); assert.equal(budget.remainingCalls("case-a"), 0); await budget.complete(request); }), (error: unknown) => !!error && typeof error === "object" && (error as { code?: string }).code === "MODEL_CALL_BUDGET_EXHAUSTED")`
- `assert.equal(budget.remainingCalls("case-a"), 1, "failed calls consume the reported reserve")`

### 54 — retained live work observes the original deadline even without another model call

**KEEP_DISTINCT_CONTRACT**

- default / retained live work observes the original deadline even without another model call / 22.680 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(budget.usage("case")?.calls, 0)`
- `assert.equal(signal.aborted, true)`

### 68 — independent question scopes isolate their own calls and deadline from a depleted search

**KEEP_DISTINCT_CONTRACT**

- default / independent question scopes isolate their own calls and deadline from a depleted search / 1.278 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(()=>questions.complete(request),{code:"MODEL_CALL_BUDGET_EXHAUSTED"})`
- `assert.equal(calls,55,"each question has three provider calls independently of 49 original calls")`
- `assert.deepEqual(search.usage("case"),original,"question calls never resume or restart the original search")`

### 91 — late async work cannot start another model call after its original run closes

**KEEP_DISTINCT_CONTRACT**

- default / late async work cannot start another model call after its original run closes / 0.275 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(late,{code:"RUN_DEADLINE_EXCEEDED"})`
- `assert.equal(calls,0)`

## src/core/execution/side-effect-ledger.test.ts

同键并发提交只发生一次现实副作用；幂等核心不进入缩减候选。

### 6 — SideEffectLedger coalesces concurrent writes with one idempotency key

**KEEP_PROTECTED**

- default / SideEffectLedger coalesces concurrent writes with one idempotency key / 1.036 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(first.result, "submitted")`
- `assert.equal(second.result, "submitted")`
- `assert.equal(first.replayed, false)`

保护：IDEMPOTENCY, AUTHORIZATION_IDEMPOTENCY_OR_OUTCOME

## src/core/policy/policy-engine.test.ts

有效授权正常对照、缺失、过期、坏时间戳及 OUTCOME_UNKNOWN 优先级分别防不同越权入口；整组保护。

### 40 — PolicyEngine

**GROUP_NOT_A_TEST**

- default / PolicyEngine / 1.727 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(decision, { allowed: true, decidedAt: now })`
- `assert.equal(decision.allowed, false)`
- `assert.equal(decision.code, "AUTHORIZATION_MISSING")`

保护：AUTHORIZATION

### 41 — allows a healthy one-time authorized action

**KEEP_PROTECTED**

- default / allows a healthy one-time authorized action / 0.830 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(decision, { allowed: true, decidedAt: now })`

保护：AUTHORIZATION, AUTHORIZATION_IDEMPOTENCY_OR_OUTCOME

### 46 — rejects a missing authorization

**KEEP_PROTECTED**

- default / rejects a missing authorization / 0.096 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(decision.allowed, false)`
- `assert.equal(decision.code, "AUTHORIZATION_MISSING")`

保护：AUTHORIZATION, AUTHORIZATION_IDEMPOTENCY_OR_OUTCOME

### 56 — rejects an expired authorization

**KEEP_PROTECTED**

- default / rejects an expired authorization / 0.071 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(decision.allowed, false)`
- `assert.equal(decision.code, "AUTHORIZATION_EXPIRED")`

保护：AUTHORIZATION, AUTHORIZATION_IDEMPOTENCY_OR_OUTCOME

### 68 — rejects malformed authorization timestamps

**KEEP_PROTECTED**

- default / rejects malformed authorization timestamps / 0.065 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(decision.allowed, false)`
- `assert.equal(decision.code, "AUTHORIZATION_INVALID")`

保护：AUTHORIZATION, AUTHORIZATION_IDEMPOTENCY_OR_OUTCOME

### 80 — OUTCOME_UNKNOWN takes precedence over a new authorization

**KEEP_PROTECTED**

- default / OUTCOME_UNKNOWN takes precedence over a new authorization / 0.053 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(decision.allowed, false)`
- `assert.equal(decision.code, "OUTCOME_UNKNOWN")`

保护：AUTHORIZATION, AUTHORIZATION_IDEMPOTENCY_OR_OUTCOME

## src/core/task-runtime/in-memory-task-runtime.test.ts

事件去重、乐观版本和跨 Run 因果归属都发生在状态写入前；内存层与 SQL 事务故障不同，不把两种 Runtime 当重复。

### 49 — InMemoryTaskRuntime

**GROUP_NOT_A_TEST**

- default / InMemoryTaskRuntime / 6.250 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(first.snapshot.domainState.count, 1)`
- `assert.equal(first.commands.length, 1)`
- `assert.equal(replay.duplicateEvent, true)`

### 50 — deduplicates an event before applying the transition again

**KEEP_DISTINCT_CONTRACT**

- default / deduplicates an event before applying the transition again / 3.952 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(first.snapshot.domainState.count, 1)`
- `assert.equal(first.commands.length, 1)`
- `assert.equal(replay.duplicateEvent, true)`

### 76 — rejects a new event carrying a stale task version

**KEEP_DISTINCT_CONTRACT**

- default / rejects a new event carrying a stale task version / 0.505 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.throws( () => runtime.dispatch( { id: "event-2", taskId: "task-1", event: { type: "INCREMENT" }, occurredAt: "2026-08-05T09:00:01.000Z", trace: { schemaVersion: "1", runId: "run:task-1", correlationId: "event-2", actor: "USER", }, }, 0, ), StaleTaskVersionError, )`

### 113 — records causal metadata and propagates it to emitted commands

**KEEP_DISTINCT_CONTRACT**

- default / records causal metadata and propagates it to emitted commands / 0.849 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(runtime.eventLog[0]?.trace, { schemaVersion: "1", runId: "run-1", correlationId: "correlation-1", actor: "USER", })`
- `assert.deepEqual(result.commands[0]?.trace, { schemaVersion: "1", runId: "run-1", correlationId: "correlation-1", causationId: "event-1", actor: "RUNTIME", })`

### 145 — rejects an event whose trace belongs to another run

**KEEP_DISTINCT_CONTRACT**

- default / rejects an event whose trace belongs to another run / 0.191 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.throws( () => runtime.dispatch({ id: "event-wrong-run", taskId: "task-1", event: { type: "INCREMENT" }, occurredAt: "2026-08-05T09:00:00.000Z", trace: { schemaVersion: "1", runId: "run:other-task", correlationId: "event-wrong-run", actor: "USER", }, }), /Event run mismatch/, )`

## src/domains/restaurant/action-validator.test.ts

合法动作是 Agent 实际准入门，需与 Context 展示相互校验；候选、刷新、证据期限、批次及 F6 收尾的正常/拒绝对照保留，授权相关项保护。

### 37 — Reducer derives missing fields and accumulates a criterion correction deterministically

**KEEP_DISTINCT_CONTRACT**

- default / Reducer derives missing fields and accumulates a criterion correction deterministically / 1.755 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(missingBlockingFields(first), ["timeWindow", "area"])`
- `assert.deepEqual(missingBlockingFields(corrected), [])`
- `assert.equal(corrected.partySize, 3)`

### 46 — availability selection keeps three unchecked in-radius direct entrances and preserves fact/refresh scope

**KEEP_DISTINCT_CONTRACT**

- default / availability selection keeps three unchecked in-radius direct entrances and preserves fact/refresh scope / 6.493 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: ["name-near"] }, now).status, "REJECTED")`
- `assert.equal(validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: ["direct-c", "direct-b"] }, now).status, "ALLOWED")`
- `assert.equal(validateRestaurantAction(state, { type: "INVESTIGATE_CANDIDATE_FACTS", candidateIds: ["name-near"] }, now).status, "ALLOWED")`

### 69 — Action validator binds search to complete authoritative intent

**KEEP_DISTINCT_CONTRACT**

- default / Action validator binds search to complete authoritative intent / 0.141 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual( validateRestaurantAction(incompleteState, { type: "SEARCH_RESTAURANTS" }, now), { status: "REJECTED", code: "INTENT_INCOMPLETE", reason: "Restaurant search intent is missing required fields" }, )`
- `assert.equal(validateRestaurantAction(state, { type: "SEARCH_RESTAURANTS", retrievalHint: "broaden omakase search" }, now).status, "ALLOWED")`

### 79 — A native second-source search waits for the first batch candidates to be processed

**KEEP_DISTINCT_CONTRACT**

- default / A native second-source search waits for the first batch candidates to be processed / 0.494 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(validateRestaurantAction(firstBatch, { type: "SEARCH_RESTAURANTS" }, now).status, "REJECTED")`
- `assert.equal(validateRestaurantAction({ ...firstBatch, factChecks: { [candidateId]: { status: "COMPLETED", checkedAt: now, evidenceIds: [] } } }, { type: "SEARCH_RESTAURANTS" }, now).status, "ALLOWED", "unsupported HARD fact ends this candidate's read without a slot check")`
- `assert.equal(validateRestaurantAction(supported, { type: "SEARCH_RESTAURANTS" }, now).status, "REJECTED", "a HARD-qualified first-batch outlet still needs its availability read")`

### 105 — An empty first native batch cannot end the read while the second bounded source remains

**KEEP_DISTINCT_CONTRACT**

- default / An empty first native batch cannot end the read while the second bounded source remains / 0.117 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(validateRestaurantAction(state, { type: "SEARCH_RESTAURANTS" }, now).status, "ALLOWED")`
- `assert.equal(validateRestaurantAction(state, { type: "END_READ" }, now).status, "REJECTED")`

### 115 — A populated current native batch blocks both a new search and END until every candidate is investigated

**KEEP_DISTINCT_CONTRACT**

- default / A populated current native batch blocks both a new search and END until every candidate is investigated / 0.147 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(validateRestaurantAction(state, { type: "SEARCH_RESTAURANTS" }, now).status, "REJECTED")`
- `assert.equal(validateRestaurantAction(state, { type: "END_READ" }, now).status, "REJECTED")`

### 139 — Two native source records with unresolved same-outlet signals cannot fill two result positions

**KEEP_DISTINCT_CONTRACT**

- default / Two native source records with unresolved same-outlet signals cannot fill two result positions / 0.461 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(verdict.status, "REJECTED")`
- `assert.match("reason" in verdict ? verdict.reason : "", /distinct|duplicate|same outlet/i)`

### 153 — Availability keeps its delivery goal while candidate discovery waits only for discovery inputs

**KEEP_DISTINCT_CONTRACT**

- default / Availability keeps its delivery goal while candidate discovery waits only for discovery inputs / 0.112 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal( validateRestaurantAction(state, { type: "SEARCH_RESTAURANTS" }, now).status, "ALLOWED", "candidate discovery has no current time-window parameter to bind", )`
- `assert.deepEqual( validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: ["unknown"] }, now), { status: "REJECTED", code: "INTENT_INCOMPLETE", reason: "Restaurant intent is missing required fields" }, "a slot read still fails closed until it has its own complete parameters", )`

### 178 — A fact-only cafe request can present opening-hours-grounded results and may optionally investigate availability when parameters are complete

**KEEP_DISTINCT_CONTRACT**

- default / A fact-only cafe request can present opening-hours-grounded results and may optionally investigate availability when parameters are complete / 1.071 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: [candidateId] }, now).status, "ALLOWED")`
- `assert.deepEqual(validateRestaurantAction(state, { type: "PRESENT_RESULTS", candidateIds: [candidateId] }, now), { status: "ALLOWED" })`

### 197 — an open-ended result target rejects an early partial batch but records a source-limited shortfall

**KEEP_DISTINCT_CONTRACT**

- default / an open-ended result target rejects an early partial batch but records a source-limited shortfall / 2.271 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(early, { status: "REJECTED", code: "PRESENTATION_EVIDENCE_MISSING", reason: "The requested next batch requires 3 distinct qualified restaurants before it can be presented", })`
- `assert.equal(validateRestaurantAction(windowState, { type: "PRESENT_RESULTS", candidateIds: [candidateIds[0]!] }, now).status, "REJECTED", "a window cannot hide the second eligible restaurant")`
- `assert.equal(validateRestaurantAction(windowState, { type: "PRESENT_RESULTS", candidateIds }, now).status, "ALLOWED")`

### 244 — a cited category UNKNOWN can be eligible without creating a verified-negative claim, while violations and safety UNKNOWN remain blocked

**KEEP_DISTINCT_CONTRACT**

- default / a cited category UNKNOWN can be eligible without creating a verified-negative claim, while violations and safety UNKNOWN remain blocked / 2.361 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(validateRestaurantAction(base, { type: "PRESENT_RESULTS", candidateIds: [candidateId] }, now).status, "ALLOWED")`
- `assert.equal(validateRestaurantAction(unsupported, { type: "PRESENT_RESULTS", candidateIds: [candidateId] }, now).status, "REJECTED", \`invalid raw type facts: ${JSON.stringify(restaurantTypeFacts)}\`)`
- `assert.equal(validateRestaurantAction(violated, { type: "PRESENT_RESULTS", candidateIds: [candidateId] }, now).status, "REJECTED")`

### 277 — an unscheduled recommendation can present place facts without inventing opening hours

**KEEP_DISTINCT_CONTRACT**

- default / an unscheduled recommendation can present place facts without inventing opening hours / 0.361 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(validateRestaurantAction(state, { type: "SEARCH_RESTAURANTS" }, now).status, "ALLOWED")`
- `assert.deepEqual(validateRestaurantAction(state, { type: "PRESENT_RESULTS", candidateIds: [candidateId] }, now), { status: "ALLOWED" })`

### 296 — The requested goal, not party size, determines whether availability evidence is required

**KEEP_DISTINCT_CONTRACT**

- default / The requested goal, not party size, determines whether availability evidence is required / 0.670 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(validateRestaurantAction(recommendation, { type: "PRESENT_RESULTS", candidateIds: [candidateId] }, now).status, "ALLOWED")`
- `assert.equal(validateRestaurantAction(availability, { type: "INVESTIGATE_CANDIDATE_FACTS", candidateIds: [candidateId] }, now).status, "ALLOWED")`
- `assert.deepEqual(validateRestaurantAction(availability, { type: "PRESENT_RESULTS", candidateIds: [candidateId] }, now), { status: "REJECTED", code: "PRESENTATION_EVIDENCE_MISSING", reason: \`Candidate ${candidateId} lacks fresh evidenced availability for the authoritative request\`, })`

### 320 — An availability goal missing party size asks for input rather than searching as a recommendation

**KEEP_DISTINCT_CONTRACT**

- default / An availability goal missing party size asks for input rather than searching as a recommendation / 0.235 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(validateRestaurantAction({ ...incompleteState, intentDraft: draft }, { type: "SEARCH_RESTAURANTS" }, now), { status: "REJECTED", code: "INTENT_INCOMPLETE", reason: "Availability requested but party size is missing", })`

### 330 — A depleted Google discovery budget cannot be bypassed by a new retrieval hint

**KEEP_DISTINCT_CONTRACT**

- default / A depleted Google discovery budget cannot be bypassed by a new retrieval hint / 0.217 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(validateRestaurantAction({ ...incompleteState, intentDraft: draft, failure: { code: "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED", message: "budget exhausted" }, sourceReadState: { googlePlacesSearchBudget: "EXHAUSTED" } }, { type: "SEARCH_RESTAURANTS", retrievalHint: "different wording" }, now), { status: "REJECTED", code: "DISCOVERY_UNAVAILABLE", reason: "The local per-run Google request budget is exhausted; changing retrieval wording cannot restore it", })`

### 340 — only a source-confirmed named-place ambiguity asks the user to disambiguate

**KEEP_DISTINCT_CONTRACT**

- default / only a source-confirmed named-place ambiguity asks the user to disambiguate / 0.167 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.state.phase, "NEEDS_INPUT")`
- `assert.equal(result.state.failure?.code, "GOOGLE_LOCATION_AMBIGUOUS")`
- `assert.match(result.state.pendingUserQuestion?.question ?? "", /multiple matching locations/)`

### 354 — candidate fact investigation is bound to known candidates and cannot repeat the same request

**KEEP_DISTINCT_CONTRACT**

- default / candidate fact investigation is bound to known candidates and cannot repeat the same request / 0.280 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(validateRestaurantAction(state, { type: "INVESTIGATE_CANDIDATE_FACTS", candidateIds: ["cafe-a"] }, now).status, "ALLOWED")`
- `assert.equal(validateRestaurantAction(state, { type: "INVESTIGATE_CANDIDATE_FACTS", candidateIds: ["missing"] }, now).status, "REJECTED")`
- `assert.deepEqual( validateRestaurantAction({ ...state, factChecks: { "cafe-a": { status: "UNKNOWN", checkedAt: now, evidenceIds: [], reasonCode: "GOOGLE_TIMEOUT" } } }, { type: "INVESTIGATE_CANDIDATE_FACTS", candidateIds: ["cafe-a"] }, now), { status: "REJECTED", code: "FACTS_ALREADY_CHECKED", reason: "Facts were already checked for cafe-a in this request" }, )`

### 373 — Action validator blocks unknown candidates, stale offers, and booking schedule mismatches

**KEEP_DISTINCT_CONTRACT**

- default / Action validator blocks unknown candidates, stale offers, and booking schedule mismatches / 0.424 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(validateRestaurantAction(state, { type: "SELECT_CANDIDATE", candidateId: "missing" }, now).status, "REJECTED")`
- `assert.equal(validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: ["missing"] }, now).status, "REJECTED")`
- `assert.equal(validateRestaurantAction(state, { type: "SELECT_CANDIDATE", candidateId: "a", offerId: "stale" }, now).status, "REJECTED")`

### 402 — Action validator rejects availability reads that would repeat a candidate already checked for the current search

**KEEP_DISTINCT_CONTRACT**

- default / Action validator rejects availability reads that would repeat a candidate already checked for the current search / 0.452 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual( validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: ["a"] }, now), { status: "REJECTED", code: "AVAILABILITY_ALREADY_CHECKED", reason: "Availability was already checked for a and no expiry or user refresh permits a recheck" }, )`
- `assert.equal(validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: ["b"] }, now).status, "ALLOWED")`
- `assert.equal(validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: ["a", "b"] }, now).status, "REJECTED")`

### 422 — Action validator keeps investigation batches bounded without truncating the candidate pool

**KEEP_DISTINCT_CONTRACT**

- default / Action validator keeps investigation batches bounded without truncating the candidate pool / 0.540 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: state.candidates.slice(0, MAX_AVAILABILITY_CHECK_BATCH).map((item) => item.restaurant.id) }, now).status, "ALLOWED")`
- `assert.deepEqual( validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: state.candidates.map((item) => item.restaurant.id) }, now), { status: "REJECTED", code: "AVAILABILITY_BATCH_LIMIT", reason: \`Availability checks are limited to ${MAX_AVAILABILITY_CHECK_BATCH} candidates per batch\` }, )`

### 437 — PRESENT_RESULTS fails closed until area, HARD criterion, identity, and availability are evidenced

**KEEP_DISTINCT_CONTRACT**

- default / PRESENT_RESULTS fails closed until area, HARD criterion, identity, and availability are evidenced / 46.036 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(validateRestaurantAction(base, { type: "PRESENT_RESULTS", candidateIds: ["a"] }, now).status, "REJECTED")`
- `assert.deepEqual(validateRestaurantAction(grounded, { type: "PRESENT_RESULTS", candidateIds: ["a"] }, now), { status: "ALLOWED" })`
- `assert.equal(validateRestaurantAction(scopedMismatchedFact, { type: "PRESENT_RESULTS", candidateIds: ["a"] }, now).status, "REJECTED")`

### 573 — an immediate availability result cannot be presented after its own validity window

**KEEP_DISTINCT_CONTRACT**

- default / an immediate availability result cannot be presented after its own validity window / 0.240 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(validateRestaurantAction(state, { type: "PRESENT_RESULTS", candidateIds: [candidateId] }, validNow).status, "ALLOWED")`
- `assert.equal(expired.status, "REJECTED")`
- `assert.match(expired.reason, /immediate availability observation has expired/)`

### 602 — Expired display evidence permits a bounded recheck without extending the prior observation

**KEEP_DISTINCT_CONTRACT**

- default / Expired display evidence permits a bounded recheck without extending the prior observation / 0.138 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: ["a"] }, now), { status: "ALLOWED" })`
- `assert.equal(state.availability.a![0]!.displayExpiresAt, "2026-08-05T08:59:00.000Z")`

### 616 — User refresh reopens only displayed candidates and preserves prior evidence

**KEEP_DISTINCT_CONTRACT**

- default / User refresh reopens only displayed candidates and preserves prior evidence / 0.250 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(next.phase, "SEARCHING")`
- `assert.deepEqual(next.readEvidence.map((item) => item.evidenceId), ["old-evidence"])`
- `assert.equal(verdict.status, "REJECTED")`

### 645 — Recommendation refresh reopens displayed facts without routing through availability

**KEEP_DISTINCT_CONTRACT**

- default / Recommendation refresh reopens displayed facts without routing through availability / 0.259 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(refreshed.phase, "SEARCHING")`
- `assert.equal(validateRestaurantAction(refreshed, { type: "CHECK_AVAILABILITY", candidateIds: ["a"] }, now).status, "REJECTED")`
- `assert.equal(validateRestaurantAction(refreshed, { type: "INVESTIGATE_CANDIDATE_FACTS", candidateIds: ["a"] }, now).status, "ALLOWED")`

### 668 — a requested website-fact refresh replaces only stale same-source commercial terms

**KEEP_DISTINCT_CONTRACT**

- default / a requested website-fact refresh replaces only stale same-source commercial terms / 0.153 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(completed.factChecks?.a?.supersededEvidenceIds, ["old-facts"])`
- `assert.deepEqual(restaurantCurrentFactEvidence(completed, "a").map((evidence) => evidence.evidenceId), ["new-facts"])`
- `assert.deepEqual(restaurantCurrentFactEvidence(completed, "a")[0]?.claims, { coursePriceYen: 8000, cancellationTerms: "Cancellation: no fee until 17:00." })`

### 700 — a fresh UNKNOWN fact observation cannot be masked by a historical qualifying fact

**KEEP_DISTINCT_CONTRACT**

- default / a fresh UNKNOWN fact observation cannot be masked by a historical qualifying fact / 0.128 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(validateRestaurantAction(state, { type: "PRESENT_RESULTS", candidateIds: [candidateId] }, now).status, "REJECTED")`
- `assert.equal(validateRestaurantAction(current, { type: "PRESENT_RESULTS", candidateIds: [candidateId] }, now).status, "ALLOWED")`

### 722 — A completed refresh target does not block another target or permit partial presentation

**KEEP_DISTINCT_CONTRACT**

- default / A completed refresh target does not block another target or permit partial presentation / 0.517 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: ["b"] }, now).status, "ALLOWED")`
- `assert.equal(partial.status, "REJECTED")`
- `assert.equal(partial.code, "PRESENTATION_EVIDENCE_MISSING")`

### 737 — a grounded current no-slot observation excludes a recommendation instead of reviving an older opening-hours fact

**KEEP_DISTINCT_CONTRACT**

- default / a grounded current no-slot observation excludes a recommendation instead of reviving an older opening-hours fact / 0.165 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(verdict.status, "REJECTED")`
- `assert.match(verdict.reason, /no-matching-slot/)`
- `assert.equal( reduced.availabilityChecks[candidateId]?.requestFingerprint, restaurantAvailabilityRequestFingerprint({ date: "2026-08-05", timeWindow: { earliest: "12:00", latest: "17:00" }, partySize: 2 }), )`

### 773 — a provider fact from the current availability observation supplements rather than erases the current fact read

**KEEP_DISTINCT_CONTRACT**

- default / a provider fact from the current availability observation supplements rather than erases the current fact read / 0.137 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(validateRestaurantAction(state, { type: "PRESENT_RESULTS", candidateIds: [candidateId] }, now).status, "ALLOWED")`
- `assert.ok(restaurantPresentationEvidenceIds(state, candidateId, now)?.includes("provider-fact"))`

### 798 — C6a expired immediate window ends without investigating another candidate

**KEEP_DISTINCT_CONTRACT**

- default / C6a expired immediate window ends without investigating another candidate / 0.244 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(validateRestaurantAction(expired, { type: "END_READ" }, later).status, "ALLOWED")`
- `assert.equal(validateRestaurantAction(expired, action, later).status, "REJECTED")`
- `assert.equal(ended.state.phase, "NO_VERIFIED_RESULT")`

### 823 — source price statuses disclose soft shortfalls but gate hard budgets before presentation

**KEEP_DISTINCT_CONTRACT**

- default / source price statuses disclose soft shortfalls but gate hard budgets before presentation / 1.213 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(validateRestaurantAction(make("HARD", 3300), present, now).status, "ALLOWED")`
- `assert.equal(validateRestaurantAction(make("HARD", 4000), present, now).status, "REJECTED")`
- `assert.equal(validateRestaurantAction(make("HARD"), present, now).status, "REJECTED")`

### 851 — ADR0045 median admission uses the same inclusive thresholds in context and execution validation

**KEEP_DISTINCT_CONTRACT**

- default / ADR0045 median admission uses the same inclusive thresholds in context and execution validation / 0.659 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(validateRestaurantAction(state, action, now).status, "ALLOWED", type + " ordinary lawful control")`
- `assert.equal(verdict.status, remainingAutomaticMs >= minimum ? "ALLOWED" : "REJECTED", type)`
- `assert.equal(verdict.code, "READ_TIME_RESERVED")`

## src/domains/restaurant/agent-action.test.ts

输出动作的严格形状与执行许可不同；不让模型携带未授权字段或虚构的终止原因越过 Decoder。

### 20 — strict Agent wire output normalizes back into canonical restaurant_agent_action@5

**KEEP_DISTINCT_CONTRACT**

- default / strict Agent wire output normalizes back into canonical restaurant_agent_action@5 / 1.014 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(normalized.valid, true)`
- `assert.deepEqual(validateRestaurantAgentAction(normalized.value), { valid: true, value: { action: { type: "SEARCH_RESTAURANTS", retrievalHint: "omakase near Shibuya" }, decisionSummary: "Search for matching outlets.", }, })`

### 33 — strict Agent wire output rejects meaningful fields outside its selected action

**KEEP_DISTINCT_CONTRACT**

- default / strict Agent wire output rejects meaningful fields outside its selected action / 0.137 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(normalized, { valid: false, errors: ["SEARCH_RESTAURANTS contains non-placeholder fields: $.candidateIds"] })`

### 38 — strict Agent wire permits END_READ only with placeholders and never accepts a model supplied outcome

**KEEP_DISTINCT_CONTRACT**

- default / strict Agent wire permits END_READ only with placeholders and never accepts a model supplied outcome / 0.121 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(normalized.valid, true)`
- `assert.deepEqual(validateRestaurantAgentAction(normalized.value), { valid: true, value: { action: { type: "END_READ" }, decisionSummary: "No grounded candidate remains." }, })`
- `assert.deepEqual( normalizeRestaurantAgentActionStrictWire({ ...endWire, candidateIds: ["candidate-1"] }), { valid: false, errors: ["END_READ contains non-placeholder fields: $.candidateIds"] }, )`

### 54 — page question action has no model-owned venue, URL or question arguments

**KEEP_DISTINCT_CONTRACT**

- default / page question action has no model-owned venue, URL or question arguments / 0.094 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(validateRestaurantAgentAction({type:"ANSWER_PAGE_QUESTION"}).valid,true)`
- `assert.equal(validateRestaurantAgentAction({type:"ANSWER_PAGE_QUESTION",...fields}).valid,false)`

## src/domains/restaurant/agent-context.test.ts

模型看到的候选、事实与预算必须与 Validator 同源；仅 Validator 拒绝并不能防止给模型不可执行选项导致空转。

### 9 — Restaurant Agent context retains bounded observations and action scope while excluding execution authority and raw provider artifacts

**KEEP_DISTINCT_CONTRACT**

- default / Restaurant Agent context retains bounded observations and action scope while excluding execution authority and raw provider artifacts / 3.554 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(context.failure, { code: "SEARCH_FAILED" })`
- `assert.deepEqual(context.availabilityChecks, { [fixtureCandidates[0]!.restaurant.id]: { status: "AVAILABLE", receptionMode: "UNKNOWN" }, })`
- `assert.deepEqual(context.candidates[0], { id: fixtureCandidates[0]!.restaurant.id, outletName: fixtureCandidates[0]!.restaurant.outletName, address: fixtureCandidates[0]!.restaurant.address, sourceCategories: [], availabilityPath: "NONE", matchReasons: fixtureCandidates[0]!.matchReasons, warnings: fixtureCandidates[0]!.warnings, executionConfidence: fixtureCandidates[0]!.executionConfidence, observedFacts: { verifiedHardCriteria: [], verifiedNegativeCriteria: [], violatedNegativeCriteria: [], openingHoursMatch: false, commercialNotes: [], }, sourceAttempts: [], })`

### 104 — availability path uses the latest observed claim without reusing stale or future direct hints

**KEEP_DISTINCT_CONTRACT**

- default / availability path uses the latest observed claim without reusing stale or future direct hints / 0.090 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(observedCandidateAvailabilityPath(evidence, "a", "2026-10-10T10:02:00Z"), "NAME_RESOLUTION")`
- `assert.equal(observedCandidateAvailabilityPath(evidence, "a", "2026-10-10T09:59:00Z"), "NONE")`
- `assert.equal(observedCandidateAvailabilityPath(evidence, "b", "2026-10-10T10:02:00Z"), "NONE")`

### 115 — Restaurant Agent context exposes a stable exhausted-discovery state without provider internals

**KEEP_DISTINCT_CONTRACT**

- default / Restaurant Agent context exposes a stable exhausted-discovery state without provider internals / 0.083 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(context.searchAvailability, { available: false, reason: "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED" })`
- `assert.equal(context.legalActions.search, false)`
- `assert.equal(JSON.stringify(context).includes("provider-specific private detail"), false)`

### 126 — current identity-bound negative HARD conflict removes an outlet from costly fact and availability reads

**KEEP_DISTINCT_CONTRACT**

- default / current identity-bound negative HARD conflict removes an outlet from costly fact and availability reads / 0.337 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(context.candidates[0]?.observedFacts.violatedNegativeCriteria.includes("hot pot restaurant"), true)`
- `assert.equal(context.legalActions.checkAvailability.includes(candidateId), false)`
- `assert.equal(context.legalActions.investigateCandidateFacts.includes(candidateId), false)`

### 142 — missing negative HARD evidence stays UNKNOWN and leaves a legal read path

**KEEP_DISTINCT_CONTRACT**

- default / missing negative HARD evidence stays UNKNOWN and leaves a legal read path / 0.115 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(context.candidates[0]?.observedFacts.violatedNegativeCriteria.length, 0)`
- `assert.equal(context.legalActions.checkAvailability.includes(candidateId), true)`

### 153 — Restaurant Agent context exposes bounded candidate facts, provider attempts, reception and code-derived next actions

**KEEP_DISTINCT_CONTRACT**

- default / Restaurant Agent context exposes bounded candidate facts, provider attempts, reception and code-derived next actions / 0.228 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(context.candidates[0]?.observedFacts, { verifiedHardCriteria: ["yakiniku"], verifiedNegativeCriteria: ["not all-you-can-eat"], violatedNegativeCriteria: [], openingHoursMatch: true, commercialNotes: [], })`
- `assert.deepEqual(context.candidates[0]?.sourceAttempts, [ { source: "RESTAURANT_WEBSITE", outcome: "COMPLETED" }, { source: "TABLECHECK", outcome: "FAILED", reasonCode: "NO_MATCHING_SLOT" }, ])`
- `assert.deepEqual(context.availabilityChecks[candidateId], { status: "UNAVAILABLE", receptionMode: "WALK_IN_SUPPORTED" })`

### 185 — Restaurant Agent context exposes only current candidate-bound commercial notes with their evidence source

**KEEP_DISTINCT_CONTRACT**

- default / Restaurant Agent context exposes only current candidate-bound commercial notes with their evidence source / 0.258 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(context.candidates[0]?.observedFacts.commercialNotes, [ { field: "COURSE_DETAILS", value: "Lunch course: JPY 6000, tax included; lunch only.", source: "RESTAURANT_WEBSITE" }, { field: "COURSE_PRICE", value: "8000 JPY (tax included)", source: "RESTAURANT_WEBSITE" }, { field: "PRIVATE_ROOM_MINIMUM", value: "20000 JPY", source: "RESTAURANT_WEBSITE" }, { field: "CANCELLATION", value: "Cancellation: no fee until 17:00.", source: "RESTAURANT_WEBSITE" }, ])`
- `assert.equal(JSON.stringify(context).includes("official-a"), false, "source entity ids are evidence internals, not model context")`
- `assert.equal(JSON.stringify(context).includes("No-show: 100% fee."), false, "superseded website facts must not reach the Agent")`

### 219 — C8 source categories remain advisory and source-attributed without changing legal candidates

**KEEP_DISTINCT_CONTRACT**

- default / C8 source categories remain advisory and source-attributed without changing legal candidates / 0.227 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(after.candidates[0]!.sourceCategories,[{source:'GOOGLE_PLACES',values:['italian_restaurant','restaurant']},{source:'TABELOG',values:['Italian cuisine']}])`
- `assert.deepEqual(after.candidates[0]!.observedFacts.verifiedHardCriteria,[])`
- `assert.deepEqual(after.legalActions.checkAvailability,before.legalActions.checkAvailability)`

### 233 — candidate distance is a bounded source observation without changing legal presentation

**KEEP_DISTINCT_CONTRACT**

- default / candidate distance is a bounded source observation without changing legal presentation / 0.148 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual((after.candidates[0] as unknown as { distanceObservation?: unknown }).distanceObservation, { meters: 999, centerBasis: "TASK_LOCATION_RADIUS", source: "GOOGLE_PLACES" })`
- `assert.deepEqual(after.legalActions, before.legalActions)`
- `assert.deepEqual(after.presentation, before.presentation)`

### 244 — approved price tolerance compares meals, keeps unknown and distinguishes soft from hard

**KEEP_DISTINCT_CONTRACT**

- default / approved price tolerance compares meals, keeps unknown and distinguishes soft from hard / 8.043 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(assessRestaurantConditions(request, [make(amount)])[0]?.status, expected)`
- `assert.equal(assessRestaurantConditions(request, [make(3300, "ADD_ON")])[0]?.status, "NOT_CHECKED")`
- `assert.equal(assessRestaurantConditions(request, [make(3300, "MEAL", "LUNCH")])[0]?.status, "NOT_CHECKED")`

## src/domains/restaurant/agent-decision.test.ts

严格模型 wire、无隐式重试和受控上下文转换；版本数字有调用合同意义，不能把整个 Decoder 测试归为纯字符串测试。

### 21 — Restaurant Agent sends a DeepSeek-strict compatible wire schema and restores the canonical action

**KEEP_DISTINCT_CONTRACT**

- default / Restaurant Agent sends a DeepSeek-strict compatible wire schema and restores the canonical action / 23.064 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "PROPOSED")`
- `assert.equal(requestedTimeoutMs, 30_000, "Agent decision latency allowance; Runner retains its total deadline")`
- `assert.equal(endpoint, "https://api.deepseek.com/beta/chat/completions")`

### 63 — Restaurant Agent retries one synthetic non-placeholder format error within the same budgeted gateway

**KEEP_DISTINCT_CONTRACT**

- default / Restaurant Agent retries one synthetic non-placeholder format error within the same budgeted gateway / 2.146 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(calls.length, 2)`
- `assert.match(calls[1]!, /\$\.retrievalHint/)`
- `assert.equal(result.status, "PROPOSED")`

### 78 — Restaurant Agent stops after a repeated synthetic format error and exposes only rejected field paths

**KEEP_DISTINCT_CONTRACT**

- default / Restaurant Agent stops after a repeated synthetic format error and exposes only rejected field paths / 0.137 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(calls, 2)`
- `assert.deepEqual(result.status === "INVALID_MODEL_OUTPUT" ? result.errors : [], ["INVESTIGATE_CANDIDATE_FACTS contains non-placeholder fields: $.retrievalHint"])`

### 90 — Restaurant Agent supplies candidate commercial comparisons only as source-backed notes

**KEEP_DISTINCT_CONTRACT**

- default / Restaurant Agent supplies candidate commercial comparisons only as source-backed notes / 0.400 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual((suppliedContext?.candidates as Array<Record<string, unknown>>)[0]?.observedFacts, commercialContext.candidates[0]!.observedFacts)`
- `assert.equal(JSON.stringify(suppliedContext).includes("sourceUrl"), false)`
- `assert.equal(JSON.stringify(suppliedContext).includes("evidenceId"), false)`

### 132 — ADR-0044 Agent output cannot introduce a goal or a semantic patch

**KEEP_DISTINCT_CONTRACT**

- default / ADR-0044 Agent output cannot introduce a goal or a semantic patch / 0.212 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "INVALID_MODEL_OUTPUT")`
- `assert.deepEqual(goalContext, before)`

## src/domains/restaurant/booking-verifier.test.ts

Verifier 必须独立匹配店/时段/人数/Attempt，弱证据只能未知；错误成功与不确定提交全保护。

### 39 — verifyBookingCompletion

**GROUP_NOT_A_TEST**

- default / verifyBookingCompletion / 1.255 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "CONFIRMED")`
- `assert.deepEqual(result.evidence.matchedFields, [ "attemptId", "providerReference", "restaurantId", "dateTime", "partySize", "status", ])`
- `assert.deepEqual(result.evidence.missingFields, [])`

保护：WRONG_SUCCESS_OUTCOME

### 40 — confirms strong evidence only when every completion field matches

**KEEP_PROTECTED**

- default / confirms strong evidence only when every completion field matches / 0.660 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "CONFIRMED")`
- `assert.deepEqual(result.evidence.matchedFields, [ "attemptId", "providerReference", "restaurantId", "dateTime", "partySize", "status", ])`
- `assert.deepEqual(result.evidence.missingFields, [])`

保护：WRONG_SUCCESS_OUTCOME

### 66 — keeps weak evidence inconclusive even when its claims match

**KEEP_PROTECTED**

- default / keeps weak evidence inconclusive even when its claims match / 0.074 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "INCONCLUSIVE")`

保护：WRONG_SUCCESS_OUTCOME

### 80 — rejects evidence produced for a different execution attempt

**KEEP_PROTECTED**

- default / rejects evidence produced for a different execution attempt / 0.060 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "INCONCLUSIVE")`
- `assert.deepEqual(result.evidence.conflictingFields, ["attemptId"])`

保护：WRONG_SUCCESS_OUTCOME

### 97 — reports mismatched restaurant, time and party size as conflicts

**KEEP_PROTECTED**

- default / reports mismatched restaurant, time and party size as conflicts / 0.060 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "INCONCLUSIVE")`
- `assert.deepEqual(result.evidence.conflictingFields, [ "restaurantId", "dateTime", "partySize", ])`

保护：WRONG_SUCCESS_OUTCOME

## src/domains/restaurant/condition-states.test.ts

展示条件必须区分 MET/UNKNOWN/NOT_MET 与服务范围；不可用宽泛事实或另一次读取把未知抹成已知。

### 12 — condition display shows actual source field/quote and preserves lunch offering scope

**KEEP_DISTINCT_CONTRACT**

- default / condition display shows actual source field/quote and preserves lunch offering scope / 1.399 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status,"MET")`
- `assert.equal(result.sources[0]?.quote,"Lunch Omakase Course")`
- `assert.equal((result.sources[0] as any).field,"COURSE_TITLE")`

### 19 — condition display does not let names or customer reviews discharge HARD even with model labels

**KEEP_DISTINCT_CONTRACT**

- default / condition display does not let names or customer reviews discharge HARD even with model labels / 0.154 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status,"NOT_CHECKED")`
- `assert.ok(result.explanation.length>10)`

### 26 — condition display requires current same-source field quotes and does not invent quotes from criterion text

**KEEP_DISTINCT_CONTRACT**

- default / condition display requires current same-source field quotes and does not invent quotes from criterion text / 0.135 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status,"MET")`
- `assert.equal(result.sources[0]?.quote,"Omakase, Sushi")`
- `assert.equal(assessRestaurantConditions(intent,[wrong])[0]!.status,"NOT_CHECKED")`

### 33 — structured per-person cap has a HARD condition row with current quoted price, conflict and unknown states

**KEEP_DISTINCT_CONTRACT**

- default / structured per-person cap has a HARD condition row with current quoted price, conflict and unknown states / 0.668 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(budget.status,"MET")`
- `assert.deepEqual(budget.sources,[{field:"PRICE",quote:"Dinner course JPY 7000 including tax",sourceUrl:url}])`
- `assert.equal(assessRestaurantConditions(capped,[priced(9000)])[1]?.status,"NOT_MET")`

### 45 — soft budget strength and its upper-bound versus around meaning stay separate

**KEEP_DISTINCT_CONTRACT**

- default / soft budget strength and its upper-bound versus around meaning stay separate / 0.146 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(row("around 6000 yen per person","SOFT").status,"MET")`
- `assert.equal(ideally.status,"NOT_MET")`
- `assert.equal(row(text,"HARD").status,"NOT_MET",text)`

### 55 — a generic food descriptor uses the same explicit merchant category without broadening cuisine qualifiers

**KEEP_DISTINCT_CONTRACT**

- default / a generic food descriptor uses the same explicit merchant category without broadening cuisine qualifiers / 0.107 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(shown.status,"MET")`
- `assert.deepEqual(shown.sources,[source("CATEGORY","Regional, Noodles")],"display the actual merchant field, never a quote assembled from the request")`
- `assert.equal(assessRestaurantConditions({...intent,criteria},[fact([source(field,"Regional")],"regional food")])[0]?.status,"NOT_CHECKED")`

## src/domains/restaurant/discovery-planner.test.ts

计划把权威目标与检索提示分开；问候、约束缺失、推荐与查位触发不同合法入口。

### 17 — planner passes positive criteria without mechanically choosing a retrieval keyword and retains supplied nearby coordinates

**KEEP_DISTINCT_CONTRACT**

- default / planner passes positive criteria without mechanically choosing a retrieval keyword and retains supplied nearby coordinates / 1.554 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(plan.entries[0]!.query.keyword, undefined)`
- `assert.equal(plan.entries[0]!.query.category, "restaurant")`
- `assert.deepEqual(plan.entries[0]!.query.location, location)`

### 24 — planner keeps negative-only criteria out of discovery text and routes recommendations away from reservation-only packs

**KEEP_DISTINCT_CONTRACT**

- default / planner keeps negative-only criteria out of discovery text and routes recommendations away from reservation-only packs / 2.279 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(recommendation.entries.map((entry) => entry.sourceId), ["source-directory-b", "source-places-c"])`
- `assert.deepEqual(negativeOnly.entries.map((entry) => entry.query), packs.map(() => ({ category: "restaurant", positiveCriteria:[], location })))`
- `assert.ok(recommendation.entries.every((entry) => entry.query.category === "cafe"))`

### 32 — planner retains base source priority for a group request

**KEEP_DISTINCT_CONTRACT**

- default / planner retains base source priority for a group request / 0.146 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(plan.entries[0]!.sourceId, "source-reservation-a")`

### 37 — planner evaluates same-day capability in the intent timezone

**KEEP_DISTINCT_CONTRACT**

- default / planner evaluates same-day capability in the intent timezone / 28.579 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(plan.entries[0]!.sourceId, "same-day")`
- `assert.equal(later.entries[0]!.sourceId, "general")`

### 51 — group-window: inaccurate group flag cannot outrank source priority

**KEEP_DISTINCT_CONTRACT**

- default / group-window: inaccurate group flag cannot outrank source priority / 5.337 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(planDiscoverySources(intent({partySize:10}), location, sources).entries[0]!.sourceId,"source-directory-b")`

### 55 — group-window: unfinished source chunk rotates behind every other first batch

**KEEP_DISTINCT_CONTRACT**

- default / group-window: unfinished source chunk rotates behind every other first batch / 0.156 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(plan.entries[plan.cursor]!.sourceId,"source-directory-b")`
- `assert.equal(plan.entries.at(-1)!.sourceId,first)`

## src/domains/restaurant/discovery-retrieval.test.ts

只提取正向 HARD 的检索用途，否定条件不能被当成查找对象；与事实核验仍是两个职责。

### 7 — Agent retrieval validates format and observed category scope without deciding qualification

**KEEP_DISTINCT_CONTRACT**

- default / Agent retrieval validates format and observed category scope without deciding qualification / 2.583 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(validateDiscoveryRetrieval(category,intent,'Fixture District',[]).rejectionReason,'UNOBSERVED_OR_OUTSIDE_REGION_CATEGORY')`
- `assert.equal(validateDiscoveryRetrieval({...general,generalRef},intent,'Fixture District',[],observed).rejectionReason,'UNOBSERVED_GENERAL_LIST')`
- `assert.equal(validateDiscoveryRetrieval({...general,href:category.categoryUrl},intent,'Fixture District',[],observed).rejectionReason,'INVALID_PROPOSAL')`

### 24 — only positive HARD criteria can supply KEYWORD/COMBINED; other strengths can select observed categories

**KEEP_DISTINCT_CONTRACT**

- default / only positive HARD criteria can supply KEYWORD/COMBINED; other strengths can select observed categories / 0.087 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(validateDiscoveryRetrieval({...wire,choice,keyword:'first date',generalRef:'',categoryUrl:choice==='COMBINED'?'https://directory.test/region/category/':''},request,'Fixture District',['https://directory.test/region/category/']).rejectionReason,'NON_RETRIEVABLE_CRITERION')`
- `assert.equal(validateDiscoveryRetrieval({choice:'CATEGORY',keyword:'',criterionRef:'criterion:0',generalRef:'',categoryUrl:'https://directory.test/region/category/',reason:'Observed category suits preference'},request,'Fixture District',['https://directory.test/region/category/']).accepted,true)`

## src/domains/restaurant/intent-draft.test.ts

唯一反例拒绝 eval-only exclusion payload 进入产品 Draft，防评测标签污染权威条件，保留。

### 6 — negative criteria do not accept eval-only exclusion payloads

**KEEP_DISTINCT_CONTRACT**

- default / negative criteria do not accept eval-only exclusion payloads / 8.293 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(invalid, { valid: false, errors: ["criteria must be a valid criterion array"] })`

## src/domains/restaurant/party-size-supplement-resolver.test.ts

人数补充需要来源引文且仅补缺失值，不得覆盖明确人数或用于推荐；与 handler 的端到端入口互补。

### 13 — party supplement uses a non-empty object-root strict DeepSeek wire schema and accepts no extra fields

**KEEP_DISTINCT_CONTRACT**

- default / party supplement uses a non-empty object-root strict DeepSeek wire schema and accepts no extra fields / 11.701 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.status === "RESOLVED" ? { status: result.status, partySize: result.partySize } : result, { status: "RESOLVED", partySize: 2 })`
- `assert.deepEqual(parameters, RESTAURANT_PARTY_SIZE_SUPPLEMENT_JSON_SCHEMA)`
- `assert.equal(parameters.type, "object")`

### 33 — party supplement preserves UNKNOWN and fails closed on extra output

**KEEP_DISTINCT_CONTRACT**

- default / party supplement preserves UNKNOWN and fails closed on extra output / 0.124 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal((await new RestaurantPartySizeSupplementResolver(new Queue('{"status":"UNKNOWN","partySize":0}')).resolve(input())).status, "UNKNOWN")`
- `assert.equal((await new RestaurantPartySizeSupplementResolver(new Queue('{"status":"RESOLVED","partySize":2,"extra":true}')).resolve(input())).status, "INVALID_MODEL_OUTPUT")`

### 42 — party supplement is bounded to one availability request with a missing party and retains v2's generic arity rule

**KEEP_DISTINCT_CONTRACT**

- default / party supplement is bounded to one availability request with a missing party and retains v2's generic arity rule / 0.195 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(recommendation.status, "INPUT_INVALID")`
- `assert.equal(prefilled.status, "INPUT_INVALID")`
- `assert.equal(gateway.calls, 0, "H004/recommendation and primary party sizes do not invoke the supplement")`

### 67 — party supplement freezes Prompt@v2 semantic-arity reasoning separately from the transport wire

**KEEP_DISTINCT_CONTRACT**

- default / party supplement freezes Prompt@v2 semantic-arity reasoning separately from the transport wire / 0.159 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal( createHash("sha256").update(RESTAURANT_PARTY_SIZE_SUPPLEMENT_SEMANTIC_ARITY_RULES).digest("hex"), "c61661ca5c0c0819acff1ac5eaf19eb30498341c81e0b309ecf677601a54cd40", )`

## src/domains/restaurant/read-grounding.test.ts

来源身份、当前请求和新鲜度决定证据能否接纳；错误店/日期/人数/跨服务的接纳风险保护，单字段反例不随 happy path 删除。

### 14 — Google discovery accepts structurally valid restaurant places without claiming retrieval criteria as facts

**KEEP_DISTINCT_CONTRACT**

- default / Google discovery accepts structurally valid restaurant places without claiming retrieval criteria as facts / 1.107 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.candidate.matchReasons.includes("omakase"), false)`
- `assert.equal(result.evidence.provider, "GOOGLE_PLACES")`
- `assert.equal(result.accepted, true)`

### 26 — Google discovery grounds near Shibuya through an explicit address component, not text query relevance

**KEEP_DISTINCT_CONTRACT**

- default / Google discovery grounds near Shibuya through an explicit address component, not text query relevance / 0.394 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.evidence.claims, { placeId: "google-shibuya", outletName: "Example Omakase", address: "5-11 Maruyamacho, Shibuya, Tokyo, Japan", types: ["restaurant", "food"], areaQuery: "near Shibuya", areaMatch: true, areaMatchBasis: "GOOGLE_ADDRESS_COMPONENT", matchedAddressComponent: "Shibuya", matchedAddressComponentTypes: ["sublocality_level_1", "sublocality", "political"], })`
- `assert.deepEqual(result.candidate.matchReasons, ["Address explicitly matches requested area: near Shibuya"])`
- `assert.equal(result.accepted, true)`

### 51 — Google discovery does not turn a formatted-address keyword into area evidence when the component is absent

**KEEP_DISTINCT_CONTRACT**

- default / Google discovery does not turn a formatted-address keyword into area evidence when the component is absent / 0.091 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.evidence.claims.areaMatch, false)`
- `assert.equal(result.evidence.claims.areaMatchBasis, undefined)`
- `assert.equal(result.accepted, true)`

### 63 — an explicit evaluation location can establish NEAR_USER by bounded distance without changing text-area rules

**KEEP_DISTINCT_CONTRACT**

- default / an explicit evaluation location can establish NEAR_USER by bounded distance without changing text-area rules / 0.097 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.evidence.claims.areaMatch, true)`
- `assert.equal(result.evidence.claims.areaMatchBasis, "EVALUATION_LOCATION_RADIUS")`
- `assert.equal(result.accepted, true)`

### 77 — a task-bound device coordinate is distinguished from an eval-only location radius

**KEEP_DISTINCT_CONTRACT**

- default / a task-bound device coordinate is distinguished from an eval-only location radius / 0.071 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.evidence.claims.areaMatchBasis, "TASK_LOCATION_RADIUS")`
- `assert.equal(result.accepted, true)`

### 88 — coordinate-backed nearby discovery fails closed for out-of-radius and coordinate-less candidates

**KEEP_DISTINCT_CONTRACT**

- default / coordinate-backed nearby discovery fails closed for out-of-radius and coordinate-less candidates / 0.059 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(outside, { accepted: false, reasonCode: "GOOGLE_OUTSIDE_REQUESTED_RADIUS" })`
- `assert.deepEqual(missing, { accepted: false, reasonCode: "GOOGLE_LOCATION_REQUIRED_FOR_RADIUS" })`

### 100 — Google cafe facts require a matching source opening-hours interval for a fact-only afternoon recommendation

**KEEP_DISTINCT_CONTRACT**

- default / Google cafe facts require a matching source opening-hours interval for a fact-only afternoon recommendation / 44.164 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.accepted, true)`
- `assert.deepEqual(facts?.claims.verifiedHardCriteria, ["cafe"])`
- `assert.equal(facts?.claims.openingHoursMatch, true)`

### 118 — opening-hours grounding preserves minutes, rejects the closing boundary, and does not fuse split hours

**KEEP_DISTINCT_CONTRACT**

- default / opening-hours grounding preserves minutes, rejects the closing boundary, and does not fuse split hours / 0.593 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(minutesPreserved.additionalEvidence.find((item) => item.kind === "RESTAURANT_FACT")?.claims.openingHoursMatch, false)`
- `assert.equal(closingBoundary.additionalEvidence.find((item) => item.kind === "RESTAURANT_FACT")?.claims.openingHoursMatch, false)`
- `assert.equal(splitGap.additionalEvidence.find((item) => item.kind === "RESTAURANT_FACT")?.claims.openingHoursMatch, false)`

### 136 — Google primary-type facts report explicit exclusion conflicts but never infer a negative-condition pass

**KEEP_DISTINCT_CONTRACT**

- default / Google primary-type facts report explicit exclusion conflicts but never infer a negative-condition pass / 0.772 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(conflict.additionalEvidence.find((item) => item.kind === "RESTAURANT_FACT")?.claims.violatedNegativeCriteria, ["Sichuan/Hunan cuisine"])`
- `assert.equal(unknown.additionalEvidence.find((item) => item.kind === "RESTAURANT_FACT")?.claims.verifiedNegativeCriteria, undefined)`
- `assert.equal(broad.additionalEvidence.find((item) => item.kind === "RESTAURANT_FACT")?.claims.verifiedNegativeCriteria, undefined)`

### 186 — availability grounding accepts only high-confidence matching outlet, schedule and visible slot

**KEEP_G3_COORDINATION**

- default / availability grounding accepts only high-confidence matching outlet, schedule and visible slot / 2.118 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.check.status, "AVAILABLE")`
- `assert.equal(result.offers.length, 1)`
- `assert.equal(result.offers[0]?.dateTime, "2026-08-05T19:00:00+09:00")`

### 200 — ambiguous, stale, wrong request, browser failure and unsupported observations never become unavailable

**KEEP_G3_COORDINATION**

- default / ambiguous, stale, wrong request, browser failure and unsupported observations never become unavailable / 0.179 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual([ambiguous, wrongParty, stale, challenge].map((result) => result.check.status), ["UNKNOWN", "UNKNOWN", "UNKNOWN", "UNKNOWN"])`
- `assert.equal(unsupported.check.status, "SOURCE_UNSUPPORTED")`
- `assert.equal([ambiguous, wrongParty, stale, challenge, unsupported].every((result) => result.offers.length === 0), true)`

### 216 — browser startup failures are preserved rather than misclassified as uncertain entity matches

**KEEP_G3_COORDINATION**

- default / browser startup failures are preserved rather than misclassified as uncertain entity matches / 0.045 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.check.status, "UNKNOWN")`
- `assert.equal(result.check.reasonCode, "BROWSER_RUNTIME_FAILED")`
- `assert.equal(result.offers.length, 0)`

### 229 — a completed slot extraction with no qualifying slot becomes UNAVAILABLE

**KEEP_G3_COORDINATION**

- default / a completed slot extraction with no qualifying slot becomes UNAVAILABLE / 0.097 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.check.status, "UNAVAILABLE")`
- `assert.deepEqual(inventory?.claims.inventoryStatus, "UNAVAILABLE")`
- `assert.equal(result.offers.length, 0)`

### 243 — a no-slot result scoped to one observed service category remains UNKNOWN for the outlet

**KEEP_G3_COORDINATION**

- default / a no-slot result scoped to one observed service category remains UNKNOWN for the outlet / 0.083 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.check.status, "UNKNOWN")`
- `assert.equal(result.check.reasonCode, "NO_MATCHING_SLOT_SCOPED")`
- `assert.equal(result.evidence.find((evidence) => evidence.kind === "AVAILABILITY")?.claims.serviceScopeValue, "sushi")`

### 256 — walk-in reception is admitted only from explicit page evidence and never turns a no-slot result into availability

**KEEP_G3_COORDINATION**

- default / walk-in reception is admitted only from explicit page evidence and never turns a no-slot result into availability / 0.092 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(unsupported.check.status, "UNAVAILABLE")`
- `assert.equal(explicit.check.status, "UNAVAILABLE")`
- `assert.equal(explicit.offers.length, 0)`

### 271 — an unknown slot does not discard independently matched identity and observed restaurant facts

**KEEP_G3_COORDINATION**

- default / an unknown slot does not discard independently matched identity and observed restaurant facts / 0.234 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(available.check.status, "AVAILABLE", "Control must be a usable observation")`
- `assert.equal(unknown.check.status, "UNKNOWN")`
- `assert.equal(unknown.offers.length, 0)`

### 290 — opening-hours weekdays use the supplied timezone for the current and previous day

**KEEP_DISTINCT_CONTRACT**

- default / opening-hours weekdays use the supplied timezone for the current and previous day / 0.443 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(timezones, ["UTC", "UTC"])`
- `assert.deepEqual(result, { matches: false, noWindow: false })`

## src/domains/restaurant/semantic-compiler.test.ts

确定性翻译/补丁累积与模型提案分开归因；目标、否定、HARD、指名门店和日期均影响后续权威状态，C 的新增店名控制不动。

### 14 — Restaurant Semantic Compiler translates independent corrections and criterion negations

**KEEP_DISTINCT_CONTRACT**

- default / Restaurant Semantic Compiler translates independent corrections and criterion negations / 1.904 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(compileRestaurantSemanticProposal(proposal), { status: "COMPILED", patch: { schemaVersion: "3", partySize: 3, partySizeSource: "EXPLICIT", area: { query: "Shibuya" }, removeCriteria: [{ text: "yakiniku", polarity: "POSITIVE", strength: "UNSPECIFIED" }], }, })`

### 36 — Restaurant Semantic Compiler retains party provenance only as diagnostic state and clears it with the count

**KEEP_DISTINCT_CONTRACT**

- default / Restaurant Semantic Compiler retains party provenance only as diagnostic state and clears it with the count / 0.499 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(inferred, { status: "COMPILED", patch: { schemaVersion: "3", partySize: 2, partySizeSource: "INFERRED_CLOSED_PARTY" }, })`
- `assert.equal(draft.partySizeSource, "INFERRED_CLOSED_PARTY")`
- `assert.equal(cleared.status, "COMPILED")`

### 69 — Restaurant Semantic Compiler preserves the user delivery goal independently of party size

**KEEP_DISTINCT_CONTRACT**

- default / Restaurant Semantic Compiler preserves the user delivery goal independently of party size / 0.158 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result, { status: "COMPILED", patch: { schemaVersion: "3", target: { goal: "RECOMMENDATION", query: "afternoon cafe for two" } }, })`

### 80 — ADR-0044 conflicting goals for the same target query are a semantic conflict in either fact order

**KEEP_DISTINCT_CONTRACT**

- default / ADR-0044 conflicting goals for the same target query are a semantic conflict in either fact order / 0.154 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(compileRestaurantSemanticProposal({ schemaVersion: "4", facts: ordered }).status, "CONFLICT")`

### 90 — Restaurant Semantic Compiler preserves explicit recommendation scope and count without inventing either

**KEEP_DISTINCT_CONTRACT**

- default / Restaurant Semantic Compiler preserves explicit recommendation scope and count without inventing either / 0.157 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result, { status: "COMPILED", patch: { schemaVersion: "3", target: { goal: "RECOMMENDATION", query: "restaurants in Shibuya", selectionScope: "OPEN_ENDED", requestedResultCount: 5 } }, })`
- `assert.deepEqual(legacy, { status: "COMPILED", patch: { schemaVersion: "3", target: { goal: "RECOMMENDATION", query: "restaurants" } }, })`

### 113 — Restaurant Semantic Compiler rejects singleton clear-and-set combinations independent of fact order

**KEEP_DISTINCT_CONTRACT**

- default / Restaurant Semantic Compiler rejects singleton clear-and-set combinations independent of fact order / 0.168 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(compileRestaurantSemanticProposal({ schemaVersion: "4", facts }), { status: "CONFLICT", conflict: { code: "CONTRADICTORY_PROPOSAL", affectedFields: ["AREA"], message: "The proposal both clears and sets AREA in one user turn", }, })`

### 133 — criterion ASSERT adds, CORRECT replaces, and NEGATE removes deterministically

**KEEP_DISTINCT_CONTRACT**

- default / criterion ASSERT adds, CORRECT replaces, and NEGATE removes deterministically / 0.347 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(omakase.status, "COMPILED")`
- `assert.equal(quietPrivateRoom.status, "COMPILED")`
- `assert.equal(removeQuiet.status, "COMPILED")`

### 168 — Restaurant Semantic Compiler reports contradictory criterion additions and negations

**KEEP_DISTINCT_CONTRACT**

- default / Restaurant Semantic Compiler reports contradictory criterion additions and negations / 0.125 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result, { status: "CONFLICT", conflict: { code: "CONTRADICTORY_PROPOSAL", affectedFields: ["CRITERION"], message: "The proposal both adds and negates the same CRITERION value", }, })`

### 187 — Restaurant Semantic Compiler materializes Tokyo relative time in code and records its basis

**KEEP_DISTINCT_CONTRACT**

- default / Restaurant Semantic Compiler materializes Tokyo relative time in code and records its basis / 47.942 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result, { status: "COMPILED", patch: { schemaVersion: "3", date: "2026-09-14", timeWindow: { earliest: "12:00", latest: "17:00" }, temporalResolution: { policyVersion: "restaurant-temporal-materialization@6", referenceTime: "2026-09-14T00:30:00-07:00", timezone: "Asia/Tokyo", date: { expression: "today", resolvedDate: "2026-09-14", basis: "TODAY" }, timeWindow: { expression: "this afternoon", resolvedTimeWindow: { earliest: "12:00", latest: "17:00" }, basis: "DAYPART:AFTERNOON" }, }, }, })`

### 209 — explicitly permitted time alternatives retain the original target and cannot widen party or date

**KEEP_DISTINCT_CONTRACT**

- default / explicitly permitted time alternatives retain the original target and cannot widen party or date / 0.216 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result, { status: "COMPILED", patch: { schemaVersion: "3", timeWindow: { earliest: "19:00", latest: "19:00" }, permittedAlternativeTimeWindow: { earliest: "18:30", latest: "19:30" }, }, })`
- `assert.equal(correction.status, "COMPILED")`
- `assert.deepEqual(draft.timeWindow, { earliest: "19:00", latest: "19:00" })`

### 246 — Restaurant Semantic Compiler carries a relative offset across Tokyo midnight without model date arithmetic

**KEEP_DISTINCT_CONTRACT**

- default / Restaurant Semantic Compiler carries a relative offset across Tokyo midnight without model date arithmetic / 0.171 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPILED")`
- `assert.equal(result.patch.date, "2026-09-15")`
- `assert.deepEqual(result.patch.timeWindow, { earliest: "08:30", latest: "08:30" })`

### 259 — C6a right now materializes a thirty-minute window without moving its start

**KEEP_DISTINCT_CONTRACT**

- default / C6a right now materializes a thirty-minute window without moving its start / 0.160 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPILED")`
- `assert.deepEqual(result.patch.temporalResolution?.immediateAvailability, { validUntil: "2026-09-14T03:38:20.000Z", sourceSlotPolicy: "EARLIEST_IN_WINDOW", })`
- `assert.deepEqual(result.patch.timeWindow, { earliest: "12:08", latest: "12:38" })`

### 272 — C6a right now retains the Tokyo start and makes the earliest source slot eligible

**KEEP_DISTINCT_CONTRACT**

- default / C6a right now retains the Tokyo start and makes the earliest source slot eligible / 0.130 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPILED")`
- `assert.deepEqual(result.patch.temporalResolution?.immediateAvailability, { validUntil: "2026-09-14T03:30:20.000Z", sourceSlotPolicy: "EARLIEST_IN_WINDOW", })`
- `assert.deepEqual(result.patch.timeWindow, { earliest: "12:00", latest: "12:30" })`

### 285 — an explicit calendar date wins over a relative clock date while retaining the relative clock

**KEEP_DISTINCT_CONTRACT**

- default / an explicit calendar date wins over a relative clock date while retaining the relative clock / 0.170 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPILED")`
- `assert.equal(result.patch.date, "2026-09-18")`
- `assert.deepEqual(result.patch.timeWindow, { earliest: "17:20", latest: "17:50" })`

### 300 — after work remains an original broad query rather than an invented 18:00-20:00 promise

**KEEP_DISTINCT_CONTRACT**

- default / after work remains an original broad query rather than an invented 18:00-20:00 promise / 0.096 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPILED")`
- `assert.equal(result.patch.date, "2026-09-18")`
- `assert.deepEqual(result.patch.timeWindow, { earliest: "17:30", latest: "22:00" })`

### 318 — this afternoon carries its Tokyo date so a timed recommendation cannot bypass opening-hours evidence

**KEEP_DISTINCT_CONTRACT**

- default / this afternoon carries its Tokyo date so a timed recommendation cannot bypass opening-hours evidence / 0.087 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPILED")`
- `assert.equal(result.patch.date, "2026-09-14")`
- `assert.deepEqual(result.patch.timeWindow, { earliest: "12:00", latest: "17:00" })`

### 332 — evening and night retain tomorrow through validation, compilation and state

**KEEP_DISTINCT_CONTRACT**

- default / evening and night retain tomorrow through validation, compilation and state / 0.427 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPILED")`
- `assert.equal(parsed.valid, true)`
- `assert.equal(result.patch.date, "2026-09-17")`

### 353 — criterion identity updates strength by text and polarity without merging opposite polarity

**KEEP_DISTINCT_CONTRACT**

- default / criterion identity updates strength by text and polarity without merging opposite polarity / 0.086 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(updated.criteria, [ { text: "Quiet", polarity: "POSITIVE", strength: "SOFT" }, { text: "quiet", polarity: "NEGATIVE", strength: "HARD" }, ], "M1/M2: later user semantics replace the same positive criterion but retain opposite polarity")`
- `assert.deepEqual(removed.criteria, [{ text: "quiet", polarity: "NEGATIVE", strength: "HARD" }], "M3: removal uses stable identity, not stale strength")`
- `assert.deepEqual(untouched.criteria, removed.criteria, "M4: empty/non-semantic patches do not manufacture criterion changes")`

### 379 — same-proposal criterion strength conflicts are rejected independent of fact order

**KEEP_DISTINCT_CONTRACT**

- default / same-proposal criterion strength conflicts are rejected independent of fact order / 0.069 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result, { status: "CONFLICT", conflict: { code: "CONTRADICTORY_PROPOSAL", affectedFields: ["CRITERION"], message: "The proposal assigns conflicting strengths to the same CRITERION" } })`

### 389 — ASSERT strength revisions flow Proposal to Compiler to Reducer without replacing unrelated criteria

**KEEP_DISTINCT_CONTRACT**

- default / ASSERT strength revisions flow Proposal to Compiler to Reducer without replacing unrelated criteria / 0.114 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(compiled.status, "COMPILED")`
- `assert.deepEqual(applyRestaurantIntentPatch(current, compiled.patch).criteria, [ { text: "quiet", polarity: "POSITIVE", strength: to }, { text: "cafe", polarity: "POSITIVE", strength: "HARD" }, { text: "quiet", polarity: "NEGATIVE", strength: "HARD" }, ])`

## src/domains/restaurant/semantic-interpreter.test.ts

使用当前 Proposal Schema 的受控模型传输，验证有界失败、历史轮次及引用进入 Compiler 前的合同。

### 34 — Semantic Interpreter sends the proposal schema and separates user data from system context

**KEEP_DISTINCT_CONTRACT**

- default / Semantic Interpreter sends the proposal schema and separates user data from system context / 1.794 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "PROPOSED")`
- `assert.equal(gateway.calls.length, 1)`
- `assert.match(request.messages[0]!.content, /code, not you, materializes relative dates and times/)`

### 101 — Semantic Interpreter preserves an existing target scope in its bounded model context

**KEEP_DISTINCT_CONTRACT**

- default / Semantic Interpreter preserves an existing target scope in its bounded model context / 0.428 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "PROPOSED")`
- `assert.ok(gateway.calls[0]?.messages[0]?.content.includes(JSON.stringify({ target: { goal: "RECOMMENDATION", query: "restaurants in Shibuya", selectionScope: "OPEN_ENDED", requestedResultCount: 5 }, })))`

### 119 — named outlet survives supplemental visit inputs and goal changes while explicit replacement remains possible

**KEEP_DISTINCT_CONTRACT**

- default / named outlet survives supplemental visit inputs and goal changes while explicit replacement remains possible / 17.740 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "PROPOSED")`
- `assert.equal(compiled.status, "COMPILED")`
- `assert.ok(gateway.calls[1]?.messages[0]?.content.includes('"query":"Sushi Dai"'))`

### 169 — Semantic Interpreter rejects a structurally valid-looking state patch

**KEEP_DISTINCT_CONTRACT**

- default / Semantic Interpreter rejects a structurally valid-looking state patch / 0.109 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "INVALID_MODEL_OUTPUT")`
- `assert.equal(result.attempts.length, 2)`
- `assert.match(result.errors.join(" "), /unsupported fields/)`

### 190 — closed-party and open-group proposals stay distinct through the semantic boundary and compiler

**KEEP_DISTINCT_CONTRACT**

- default / closed-party and open-group proposals stay distinct through the semantic boundary and compiler / 0.357 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(closed.status, "PROPOSED")`
- `assert.deepEqual(compileRestaurantSemanticProposal(closed.proposal), { status: "COMPILED", patch: { schemaVersion: "3", partySize: 2, partySizeSource: "INFERRED_CLOSED_PARTY" } })`
- `assert.equal(open.status, "PROPOSED")`

### 224 — party-size transport preserves an enumerated or explicit count and never supplies one for an open or generic request

**KEEP_DISTINCT_CONTRACT**

- default / party-size transport preserves an enumerated or explicit count and never supplies one for an open or generic request / 0.202 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "PROPOSED", item.id)`
- `assert.equal(compiled.status, "COMPILED", item.id)`
- `assert.equal(draft.partySizeSource, item.source, item.id)`

### 260 — ADR-0044 current-message quotes admit both goals without persisting their basis

**KEEP_DISTINCT_CONTRACT**

- default / ADR-0044 current-message quotes admit both goals without persisting their basis / 0.139 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "PROPOSED")`
- `assert.equal(compiled.status, "COMPILED")`
- `assert.equal(draft.target?.goal, goal)`

### 285 — ADR-0044 fabricated or prior-turn quotes fail through the existing semantic failure path

**KEEP_DISTINCT_CONTRACT**

- default / ADR-0044 fabricated or prior-turn quotes fail through the existing semantic failure path / 0.199 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "INVALID_MODEL_OUTPUT")`
- `assert.equal(gateway.calls.length, 2, "no attempt beyond the existing bound")`
- `assert.match(result.errors.join(" "), /goalBasis.*current (?:user )?message/)`

## src/domains/restaurant/semantic-proposal.test.ts

模型仅提供提案，不得自赋地理坐标或决定下一动作；严查不可识别字段和伪造目标依据，防语义状态误写。

### 10 — Semantic Proposal Contract accepts stable slots and open criteria without a taxonomy

**KEEP_DISTINCT_CONTRACT**

- default / Semantic Proposal Contract accepts stable slots and open criteria without a taxonomy / 0.548 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(valid.valid, true)`

### 33 — Semantic Proposal Contract accepts only an explicit or closed-party source for a party count

**KEEP_DISTINCT_CONTRACT**

- default / Semantic Proposal Contract accepts only an explicit or closed-party source for a party count / 0.101 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(inferred.valid, true)`
- `assert.equal(invalid.valid, false)`
- `assert.match(invalid.errors.join(" "), /must match PARTY_SIZE/)`

### 48 — Semantic Proposal Contract carries an explicit open-ended result count for either delivery goal but rejects it for a named outlet

**KEEP_DISTINCT_CONTRACT**

- default / Semantic Proposal Contract carries an explicit open-ended result count for either delivery goal but rejects it for a named outlet / 0.102 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(openEnded.valid, true)`
- `assert.equal(availability.valid, true)`
- `assert.equal(invalidNamedCount.valid, false)`

### 78 — Semantic Proposal Contract rejects internal protocols and invalid operation/value combinations

**KEEP_DISTINCT_CONTRACT**

- default / Semantic Proposal Contract rejects internal protocols and invalid operation/value combinations / 0.049 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.match(invalid.errors.join(" "), /not allowed when negating a singleton/)`
- `assert.equal(invalid.valid, false)`
- `assert.match(invalid.errors.join(" "), /unsupported fields/)`

### 98 — Semantic Proposal Contract rejects collection CONFIRM because it has no deterministic effect

**KEEP_DISTINCT_CONTRACT**

- default / Semantic Proposal Contract rejects collection CONFIRM because it has no deterministic effect / 0.043 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.valid, false)`
- `assert.match(result.errors.join(" "), /CONFIRM is unsupported/)`

### 107 — DeepSeek transport schema uses only supported string constraints while local validation rejects blanks

**KEEP_DISTINCT_CONTRACT**

- default / DeepSeek transport schema uses only supported string constraints while local validation rejects blanks / 0.079 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(serializedSchema.includes("minLength"), false)`
- `assert.equal(serializedSchema.includes("maxLength"), false)`
- `assert.equal(result.valid, false)`

### 126 — explicit date and clock values require the raw user expression promised by the strict transport contract

**KEEP_DISTINCT_CONTRACT**

- default / explicit date and clock values require the raw user expression promised by the strict transport contract / 0.998 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(missingRaw.valid, false)`
- `assert.deepEqual(missingRaw.errors, [ "facts[0].value must match DATE", "facts[1].value must match TIME_WINDOW", ])`

### 144 — ADR-0044 TARGET requires a nonempty structural basis without judging goal rationale

**KEEP_DISTINCT_CONTRACT**

- default / ADR-0044 TARGET requires a nonempty structural basis without judging goal rationale / 0.160 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(validateRestaurantSemanticProposal(proposal({ type: "JUDGMENT", reason: "User seeks places.", quotes })).valid, false)`
- `assert.equal(validateRestaurantSemanticProposal(proposal({ type: "JUDGMENT", reason: "User seeks places.", quotes: ["cafes"] })).valid, true)`
- `assert.equal(validateRestaurantSemanticProposal(proposal({ type: "BOOKING_WORDING", reason: "A fixture need not justify the goal to code.", quotes: ["cafes"] })).valid, true)`

## src/eval/restaurant/agent-loop/browser-case-slice-evidence.test.ts

诊断记录必须保留可解释查询区域且去除页面私密数据；Tabelog/TableCheck 分别走各自区域投影，G3 改区域结构时需协调，不能把脱敏检查删掉。

### 12 — browser case slice journal retains the saved Teppen query region without page secrets

**KEEP_DISTINCT_CONTRACT**

- default / browser case slice journal retains the saved Teppen query region without page secrets / 40.313 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.doesNotMatch(JSON.stringify(waitCall.detail), /Jane Doe|private source text|csrf_token=secret/)`
- `assert.match(JSON.stringify(waitCall.detail), /sha256/)`
- `assert.doesNotMatch(JSON.stringify(fillCall.detail), /guest@example\.test/)`

### 78 — browser case slice journal distinguishes loading and absent booking regions

**KEEP_DISTINCT_CONTRACT**

- default / browser case slice journal distinguishes loading and absent booking regions / 0.563 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.match((selected.queryRegions as Array<{ markup: string }>)[0]!.markup, /js-calendar-day-target is-current" data-year="2026" data-month="9" data-day="30"/)`
- `assert.match((selected.queryRegions as Array<{ markup: string }>)[0]!.markup, /js-people-hidden-value" value="2"/)`
- `assert.deepEqual(loading.queryRegions, [{ markup: '<div class="p-booking-calendar"><div>Loading calendar</div></div>', truncated: false, ancestorMarkupHidden: false, computedVisibility: "UNKNOWN" }])`

### 91 — browser case slice trace retains the installed read boundary and safe Guard diagnostics

**KEEP_DISTINCT_CONTRACT**

- default / browser case slice trace retains the installed read boundary and safe Guard diagnostics / 0.248 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(snapshot.networkDiagnostics, [{ code: "BLOCKED_FIELDS", origin: "https://example.invalid", pathname: "/query", method: "POST", resourceType: "fetch", queryKeys: ["unexpected"] }])`
- `assert.equal(traced.readNetworkBoundaryCapability, "ISOLATED_CONTEXT")`
- `assert.equal(receivedPolicy, true)`

### 114 — optional browser trace recording receives only sanitized snapshots and sanitizer-approved pixels

**KEEP_DISTINCT_CONTRACT**

- default / optional browser trace recording receives only sanitized snapshots and sanitizer-approved pixels / 0.199 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.fail("raw screenshot must not be captured")`
- `assert.equal(disposition, "LAYOUT_ONLY_CONTENT_MASKED")`
- `assert.equal(recorded.some(entry => entry.kind === "SNAPSHOT"), true)`

### 134 — browser case slice journal retains a TableCheck availability region without retaining the page profile

**KEEP_DISTINCT_CONTRACT**

- default / browser case slice journal retains a TableCheck availability region without retaining the page profile / 0.366 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.match(regions[0]!.markup, /data-reservation-source="\/en\/shops\/example\/reserve" data-reservation-date="2026-10-02" data-reservation-party="2" data-reservation-time="19:00"/)`
- `assert.equal(regions.length, 1)`
- `assert.match(regions[0]!.markup, /data-testid="Venue Availability"/)`

## src/eval/restaurant/agent-loop/browser-read-probe.test.ts

单页 probe 的地址准入、challenge 顺序和会话创建也受总截止约束；它不生产 Offer，不能用产品完成测试替代探针边界。

### 13 — source probe refuses credentials, lookalike hosts and unsupported schemes before navigation

**KEEP_DISTINCT_CONTRACT**

- default / source probe refuses credentials, lookalike hosts and unsupported schemes before navigation / 0.430 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.throws(() => probeProvider(url))`
- `assert.equal(probeProvider("https://www.tablecheck.com/en/shop"), "TABLECHECK")`

### 20 — challenge precedes content and a cross-source redirect cannot yield identity or slots

**KEEP_DISTINCT_CONTRACT**

- default / challenge precedes content and a cross-source redirect cannot yield identity or slots / 4.608 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.notEqual(mismatch.identity.confidence, "HIGH")`
- `assert.equal(control.identity.confidence, "HIGH")`
- `assert.equal(inspectProbePage(input, page).pageState, "BOT_CHALLENGE")`

### 47 — deadline includes session creation and late browser sessions are closed without navigation

**KEEP_DISTINCT_CONTRACT**

- default / deadline includes session creation and late browser sessions are closed without navigation / 17.445 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(run, { code: "BROWSER_TIMEOUT" })`
- `assert.equal(closed, true)`
- `assert.equal(navigated, false)`

### 65 — Tabelog read probe journals loading and settled saved Teppen query without an active inventory request

**KEEP_DISTINCT_CONTRACT**

- default / Tabelog read probe journals loading and settled saved Teppen query without an active inventory request / 132.787 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.fail("read probe must not click")`
- `assert.fail("read probe must not fill")`
- `assert.fail("read probe must not select")`

### 104 — browser read probe can passively retain a sanitized public control projection without an action

**KEEP_DISTINCT_CONTRACT**

- default / browser read probe can passively retain a sanitized public control projection without an action / 0.634 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.fail("passive capture must not click")`
- `assert.fail("passive capture must not fill")`
- `assert.fail("passive capture must not select")`

## src/eval/restaurant/agent-loop/browser-read-recording.test.ts

Recorder 的文档、响应、CSS、脚本、截图各自有脱敏/合格条件；缺依赖、HTTP 失败及凭据残留的负例保护，不因新录制方案而删。

### 14 — browser recording writes only an in-memory sanitized public document HAR

**KEEP_DISTINCT_CONTRACT**

- default / browser recording writes only an in-memory sanitized public document HAR / 84.436 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.replay.status, "REPLAYABLE")`
- `assert.equal(result.screenshot, "NOT_CAPTURED_NO_SANITIZER")`
- `assert.equal(har.includes("secret-marker-do-not-log"), false)`

### 36 — browser recording retains a Pack-reviewed public query document within the measured bounded size

**KEEP_DISTINCT_CONTRACT**

- default / browser recording retains a Pack-reviewed public query document within the measured bounded size / 64.518 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.replay.status, "REPLAYABLE")`
- `assert.ok(html.length > 300_000 && html.length < 400_000)`

### 51 — browser recording preserves valid JSON-LD geo numbers while redacting its telephone

**KEEP_DISTINCT_CONTRACT**

- default / browser recording preserves valid JSON-LD geo numbers while redacting its telephone / 14.741 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.replay.status, "REPLAYABLE")`
- `assert.ok(json, "JSON-LD remains available to the production exact-radius parser")`
- `assert.equal(structured.geo.latitude, 35.6697003123)`

### 75 — browser recording keeps reviewed GET form actions and removes unreviewed destinations

**KEEP_DISTINCT_CONTRACT**

- default / browser recording keeps reviewed GET form actions and removes unreviewed destinations / 32.229 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(recorded.replay.status, "REPLAYABLE")`
- `assert.equal(stripped.replay.status, "REPLAYABLE")`
- `assert.match(reviewedHar.log.entries[0]!.response.content.text, /action="https:\/\/directory\.public\.example\/en\/tokyo\/A1303\/A130301\/rstLst\/\?sw=omakase"/)`

### 105 — browser recording refuses replay when a dynamic response was admitted without a safe captured body

**KEEP_DISTINCT_CONTRACT**

- default / browser recording refuses replay when a dynamic response was admitted without a safe captured body / 7.888 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.replay, { status: "NOT_REPLAYABLE", reason: "UNCAPTURED_DYNAMIC_RESPONSE" })`

### 115 — browser recording refuses a snapshot-only replay when an admitted external script was not captured

**KEEP_DISTINCT_CONTRACT**

- default / browser recording refuses a snapshot-only replay when an admitted external script was not captured / 6.137 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual((await recording.finish()).replay, { status: "NOT_REPLAYABLE", reason: "UNCAPTURED_STATIC_DEPENDENCY" })`

### 127 — browser recording keeps a captured safe external script in the replay HAR

**KEEP_DISTINCT_CONTRACT**

- default / browser recording keeps a captured safe external script in the replay HAR / 16.073 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.replay.status, "REPLAYABLE")`
- `assert.match(await readFile(result.replay.harPath, "utf8"), /calendar\.js/)`
- `assert.match(await readFile(result.replay.harPath, "utf8"), /rst-v1-202610071750-public/, "a reviewed public release key survives the general text scrub unchanged")`

### 144 — browser recording refuses a reviewed script response containing a literal credential

**KEEP_DISTINCT_CONTRACT**

- default / browser recording refuses a reviewed script response containing a literal credential / 4.805 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual((await recording.finish()).replay, { status: "NOT_REPLAYABLE", reason: "UNCAPTURED_STATIC_DEPENDENCY" })`

### 155 — browser recording persists each runtime-masked screenshot with its snapshot

**KEEP_DISTINCT_CONTRACT**

- default / browser recording persists each runtime-masked screenshot with its snapshot / 7.687 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(metadata.screenshots, [ { snapshot: 1, status: "LAYOUT_ONLY_CONTENT_MASKED", file: "screenshot-0001.png" }, { snapshot: 2, status: "LAYOUT_ONLY_CONTENT_MASKED", file: "screenshot-0002.png" }, ])`
- `assert.equal(result.screenshot, "LAYOUT_ONLY_CONTENT_MASKED")`
- `assert.deepEqual([...await readFile(join(root, "run-2", "screenshot-0001.png"))], [137, 80, 78, 71])`

### 175 — browser recording adds a sanitized admitted public dynamic response to replay only in memory

**KEEP_DISTINCT_CONTRACT**

- default / browser recording adds a sanitized admitted public dynamic response to replay only in memory / 6.619 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.replay.status, "REPLAYABLE")`
- `assert.match(await readFile(result.replay.harPath, "utf8"), /\\"available\\":true/)`

### 188 — browser recording rejects HTTP failures and preserves safe CSS visibility in replay documents

**KEEP_DISTINCT_CONTRACT**

- default / browser recording rejects HTTP failures and preserves safe CSS visibility in replay documents / 13.555 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.replay.status, "REPLAYABLE")`
- `assert.match(await readFile(result.replay.harPath, "utf8"), /"status": 503/)`
- `assert.equal(replay.replay.status, "REPLAYABLE")`

### 205 — browser recording preserves form methods while deleting unsafe destinations

**KEEP_DISTINCT_CONTRACT**

- default / browser recording preserves form methods while deleting unsafe destinations / 9.984 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(recorded.replay.status, "REPLAYABLE")`
- `assert.equal(stripped.replay.status, "REPLAYABLE")`
- `assert.match(html, /id="public-search"/)`

### 229 — browser recording preserves an admitted public document redirect for replay

**KEEP_DISTINCT_CONTRACT**

- default / browser recording preserves an admitted public document redirect for replay / 10.244 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.replay.status, "REPLAYABLE")`
- `assert.equal(first.response.status, 302)`
- `assert.equal(first.response.redirectURL, "https://public.example/directory/current")`

### 255 — recorder retains loaded Guard-admitted public stylesheets, including generic GET, byte-for-byte

**KEEP_DISTINCT_CONTRACT**

- default / recorder retains loaded Guard-admitted public stylesheets, including generic GET, byte-for-byte / 22.719 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.replay.status, "REPLAYABLE")`
- `assert.equal(manifest.stylesheets.length, 2)`
- `assert.equal(manifest.stylesheets[0].url, cssUrl)`

## src/eval/restaurant/agent-loop/category-negative-fact-judgment-matrix-scoring.test.ts

独立 oracle 要求引用与 UNKNOWN 不生成 verified-negative，属于错误声明评分防线。

### 6 — category matrix scoring independently requires cited conflict or unknown-without-verified-negative

**KEEP_DISTINCT_CONTRACT**

- default / category matrix scoring independently requires cited conflict or unknown-without-verified-negative / 0.521 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(scoreCategoryNegativeMatrixRun({ expected: "BLOCKED", response: response("CONFLICT"), criterion: "fast food", sourceEvidenceIds: ["raw"], verifiedNegativeCriteria: [], violatedNegativeCriteria: ["fast food"], categoryUnknownNegativeCriteria: [], supportingEvidenceIds: ["raw"] }).passed, true)`
- `assert.equal(scoreCategoryNegativeMatrixRun({ expected: "ELIGIBLE_UNKNOWN", response: response("UNKNOWN"), criterion: "fast food", sourceEvidenceIds: ["raw"], verifiedNegativeCriteria: [], violatedNegativeCriteria: [], categoryUnknownNegativeCriteria: ["fast food"], supportingEvidenceIds: ["raw"] }).passed, true)`
- `assert.equal(scoreCategoryNegativeMatrixRun({ expected: "ELIGIBLE_UNKNOWN", response: response("UNKNOWN"), criterion: "fast food", sourceEvidenceIds: ["raw"], verifiedNegativeCriteria: ["fast food"], violatedNegativeCriteria: [], categoryUnknownNegativeCriteria: ["fast food"], supportingEvidenceIds: ["raw"] }).passed, false)`

## src/eval/restaurant/agent-loop/category-negative-fact-judgment-matrix.test.ts

冻结矩阵的16次零重试和来源自己陈述的身份是输入防污染检查；不把固定行数理解为产品调用次数。

### 10 — the exposed F1-F8 category-negative matrix is fixed at sixteen zero-retry provider attempts

**KEEP_DISTINCT_CONTRACT**

- default / the exposed F1-F8 category-negative matrix is fixed at sixteen zero-retry provider attempts / 0.577 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX.map((item) => item.id), ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8"])`
- `assert.equal(RESTAURANT_CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX_REPETITIONS, 2)`
- `assert.equal(CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX.length * RESTAURANT_CATEGORY_NEGATIVE_FACT_JUDGMENT_MATRIX_REPETITIONS, 16)`

### 18 — F8 binds a source-stated McDonald's HIGH identity to a generic same-source type without pre-seeding fast food

**KEEP_DISTINCT_CONTRACT**

- default / F8 binds a source-stated McDonald's HIGH identity to a generic same-source type without pre-seeding fast food / 0.121 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(f8.evidence[0]?.kind, "ENTITY_MATCH")`
- `assert.equal(f8.evidence[0]?.entityMatch?.confidence, "HIGH")`
- `assert.equal(f8.evidence[0]?.sourceEntityId, f8.evidence[1]?.sourceEntityId)`

## src/eval/restaurant/agent-loop/current-development-fixed-sources.test.ts

Fixture 自身不得给错误查询/候选/人数偷渡成功，404 与缺 fixture 必须分开；这些检查验证替身不替产品做关键判断。

### 19 — H005 fixed controls preserve the original regional-cuisine evidence without adding local-food wording

**KEEP_DISTINCT_CONTRACT**

- default / H005 fixed controls preserve the original regional-cuisine evidence without adding local-food wording / 0.517 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(scenario.observations.length, 3)`
- `assert.ok(observation.websiteFacts?.types.some((fact) => /Tokyo regional cuisine/i.test(fact)), observation.google.displayName)`
- `assert.ok(observation.websiteFacts?.types.every((fact) => !/local food/i.test(fact)), observation.google.displayName)`

### 28 — fixed source discovery is candidate-scoped and accepts equivalent retrieval wording

**KEEP_DISTINCT_CONTRACT**

- default / fixed source discovery is candidate-scoped and accepts equivalent retrieval wording / 25.496 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(equivalent.candidates.map((candidate) => candidate.restaurant.sourceIds.googlePlaces), ["offline-multi-unavailable", "offline-multi-available"])`
- `assert.deepEqual(wrong.candidates, [], "an unrelated legal query must not inherit the scenario's successful outlets")`

### 36 — fixed source keeps inventory with its own candidate and request scope

**KEEP_DISTINCT_CONTRACT**

- default / fixed source keeps inventory with its own candidate and request scope / 75.542 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.availabilityChecks[first.restaurant.id]?.status, "UNAVAILABLE")`
- `assert.equal(read.availabilityChecks[second.restaurant.id]?.status, "AVAILABLE")`
- `assert.deepEqual(read.offers.map((offer) => offer.restaurantId), [second.restaurant.id], "an available slot cannot be copied to the first candidate")`

### 63 — fixed-source coverage gaps preserve provider, request and candidate context

**KEEP_DISTINCT_CONTRACT**

- default / fixed-source coverage gaps preserve provider, request and candidate context / 1.104 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( () => sources.google.inspectFacts({ intent, candidateIds: [missing.restaurant.id], candidates: [missing], readRunId: "coverage-google-details" }, new AbortController().signal), // GooglePlacesClient deliberately wraps a fixture transport failure, so // the side-channel record (not its public provider error code) is the // runner-visible proof that this was an environment gap. (error: unknown) => error instanceof Error && (error as Error & { code?: string }).code === "GOOGLE_NETWORK_FAILED", )`
- `assert.deepEqual(sources.calls.coverageGaps[0], { source: "GOOGLE_DETAILS", stage: "DETAILS", request: "placeId=not-configured", candidateId: "not-configured", reason: "Google details are not configured for this legal candidate", })`
- `assert.rejects( () => session.navigate("https://www.tablecheck.com/en/not-configured"), (error: unknown) => error instanceof Error && (error as Error & { code?: string }).code === "FIXTURE_COVERAGE_GAP", )`

### 88 — configured provider 404 is observed behavior, not a fixture gap

**KEEP_DISTINCT_CONTRACT**

- default / configured provider 404 is observed behavior, not a fixture gap / 0.647 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( () => sources.google.inspectFacts({ intent, candidateIds: [candidate.restaurant.id], candidates: [candidate], readRunId: "configured-404-detail" }, new AbortController().signal), (error: unknown) => error instanceof Error && (error as Error & { code?: string }).code === "GOOGLE_SERVICE_REJECTED", )`
- `assert.deepEqual(sources.calls.coverageGaps, [])`

### 99 — waitFor requires the requested configured target rather than arbitrary page markup

**KEEP_DISTINCT_CONTRACT**

- default / waitFor requires the requested configured target rather than arbitrary page markup / 0.308 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( () => session.waitFor("#does-not-exist"), (error: unknown) => error instanceof Error && (error as Error & { code?: string }).code === "FIXTURE_COVERAGE_GAP", )`
- `assert.equal(sources.calls.coverageGaps.at(-1)?.stage, "WAIT_FOR")`

### 111 — independent source identities accept a normalized same outlet and reject a same-phone different branch

**KEEP_DISTINCT_CONTRACT**

- default / independent source identities accept a normalized same outlet and reject a same-phone different branch / 3.749 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(sameRead.availabilityChecks[same.candidate.restaurant.id]?.status, "AVAILABLE")`
- `assert.equal(differentRead.availabilityChecks[different.candidate.restaurant.id]?.status, "UNKNOWN")`
- `assert.deepEqual(differentRead.offers, [], "a same phone must not transfer inventory from another floor or branch")`

### 134 — source observation time advances with the controlled business clock while sample capture stays historical

**KEEP_DISTINCT_CONTRACT**

- default / source observation time advances with the controlled business clock while sample capture stays historical / 5.284 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(availability.availabilityChecks[discovery.candidates[0]!.restaurant.id]?.checkedAt, "2026-08-19T08:10:00.000Z")`
- `assert.equal(availability.availabilityChecks[discovery.candidates[0]!.restaurant.id]?.displayExpiresAt, "2026-08-19T08:20:00.000Z", "the display window is derived from the actual availability observation, not the historical fixture capture time")`
- `assert.deepEqual( sources.calls.observations.filter((event) => ["SEARCH", "DETAILS", "AVAILABILITY"].includes(event.stage)).map((event) => [event.stage, event.observedAt]), [["SEARCH", "2026-08-19T08:00:00.000Z"], ["DETAILS", "2026-08-19T08:05:00.000Z"], ["AVAILABILITY", "2026-08-19T08:10:00.000Z"]], )`

### 154 — a lead found while investigating A may help B only after B's own identity check

**KEEP_DISTINCT_CONTRACT**

- default / a lead found while investigating A may help B only after B's own identity check / 3.630 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.notEqual(result.availabilityChecks[first.restaurant.id]?.status, "AVAILABLE", "A must not inherit B's observed availability through the misleading entrance")`
- `assert.equal(result.availabilityChecks[second.restaurant.id]?.status, "AVAILABLE", "B remains eligible even though its own discovery page omitted it: " + JSON.stringify({ checks: result.availabilityChecks, calls: sources.calls }))`
- `assert.ok(sources.calls.browserNavigations.filter((url) => url === bEntry).length >= 2, "A's observed B entrance must be reused for B")`

## src/eval/restaurant/agent-loop/current-development-offline.test.ts

原始请求通过真实 Hybrid 组合与独立评价，保护第二轮 HARD 升级失效和不同新任务控制；手填中间状态的局部测试无法替代。

### 279 — a second-turn HARD upgrade resets the real Runtime (maxAgentSteps=3/4, timeoutMs=500000) and cannot reuse an old nonblocking presentation

**KEEP_DISTINCT_CONTRACT**

- default / a second-turn HARD upgrade resets the real Runtime (maxAgentSteps=3/4, timeoutMs=500000) and cannot reuse an old nonblocking presentation / 198.152 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(first.status, "PROPOSED")`
- `assert.equal(firstLoop.status, "TERMINAL")`
- `assert.equal(firstState.phase, "PRESENT_RESULTS", "the normal UNSPECIFIED first turn can display an independently available candidate")`

### 282 — control

**KEEP_DISTINCT_CONTRACT**

- default / missing-current-hard-evidence / 149.872 ms / pass
- default / current-hard-evidence / 45.973 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(first.status, "PROPOSED")`
- `assert.equal(firstLoop.status, "TERMINAL")`
- `assert.equal(firstState.phase, "PRESENT_RESULTS", "the normal UNSPECIFIED first turn can display an independently available candidate")`

### 346 — current H001-H005 raw requests complete through the real offline Hybrid composition (maxAgentSteps=6, timeoutMs=500000) with a scripted code-contract model

**KEEP_DISTINCT_CONTRACT**

- default / current H001-H005 raw requests complete through the real offline Hybrid composition (maxAgentSteps=6, timeoutMs=500000) with a scripted code-contract model / 291.050 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(frozen.map((item) => item.id), PLANS.map((plan) => plan.id))`

### 349 — plan.id

**KEEP_DISTINCT_CONTRACT**

- default / h001 / 54.373 ms / pass
- default / h002 / 70.048 ms / pass
- default / h003 / 65.633 ms / pass
- default / h004 / 15.127 ms / pass
- default / h005 / 54.241 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(semantic.status, "PROPOSED")`
- `assert.equal(evaluation.findings.find(finding => finding.dimension === "AUTHORITATIVE_CONDITIONS")?.status, "SATISFIED", JSON.stringify(evaluation))`
- `assert.equal(evaluation.findings.find(finding => finding.dimension === "COMPLETION_OUTCOME")?.status, "SATISFIED", JSON.stringify(evaluation))`

### 437 — a new task and new source scenario reuse the fixed Hybrid composition (maxAgentSteps=6, timeoutMs=500000) without a case-specific Runner

**KEEP_DISTINCT_CONTRACT**

- default / a new task and new source scenario reuse the fixed Hybrid composition (maxAgentSteps=6, timeoutMs=500000) without a case-specific Runner / 13.538 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(semantic.status, "PROPOSED")`
- `assert.equal(loop.status, "TERMINAL")`
- `assert.equal(state.phase, "PRESENT_RESULTS")`

### 468 — registered control cases use the shared execution, evaluator, and acceptance path

**KEEP_DISTINCT_CONTRACT**

- default / registered control cases use the shared execution, evaluator, and acceptance path / 21.350 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.execution.status, "SUCCEEDED")`
- `assert.equal(result.execution.phase, "PRESENT_RESULTS")`
- `assert.equal(accepted.acceptance, "PASS", accepted.reasons.join("\n"))`

### 500 — an explicit result count travels from control input through authoritative State into fixed-source acceptance

**KEEP_DISTINCT_CONTRACT**

- default / an explicit result count travels from control input through authoritative State into fixed-source acceptance / 11.779 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.execution, { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "PRESENT_RESULTS" })`
- `assert.deepEqual(acceptance, { acceptance: "PASS", userGoalCompletion: "COMPLETE", reasons: [], exitCode: 0 })`
- `assert.ok(finalSnapshot)`

### 531 — fixed-source registration refuses unknown IDs and missing bindings

**KEEP_DISTINCT_CONTRACT**

- default / fixed-source registration refuses unknown IDs and missing bindings / 0.245 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.throws(() => fixedSourceCaseRegistration("not-registered"), { code: "FIXED_SOURCE_CASE_UNREGISTERED" })`
- `assert.throws(() => validateFixedSourceCaseRegistration({ id: "bad", input: "CONTROL", sourceScenarioId: "" as any, expectation: {} as any }), { code: "FIXED_SOURCE_CASE_INVALID" })`

### 536 — frozen H001-H005 registrations do not convert the product default batch target into a user requirement

**KEEP_DISTINCT_CONTRACT**

- default / frozen H001-H005 registrations do not convert the product default batch target into a user requirement / 0.055 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(frozen.map((registration) => registration.id), ["h001", "h002", "h003", "h004", "h005"])`
- `assert.equal(registration.expectation.requiredResultBatch, undefined, \`${registration.id} has no user-stated result count\`)`

## src/eval/restaurant/agent-loop/decision-replay.test.ts

回放匹配的 set/排除条件、全部 alternatives 校验以及原始消息不变分别防错误复现；真实 DOM 静态模式仍有当前诊断用途。

### 11 — P2-2 conditional selection oracle checks every target and leaves uncompiled reviewer conditions unassessed

**KEEP_DISTINCT_CONTRACT**

- default / P2-2 conditional selection oracle checks every target and leaves uncompiled reviewer conditions unassessed / 63.593 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(before.metrics.directSelected,1)`
- `assert.equal(before.verdict,"NOT_ACCEPTABLE","one direct among three does not satisfy the independent all-selected condition")`
- `assert.equal(after.checkableCandidateIds.length,8,"production structural scope uses pre-decision circle evidence, not annotation IDs")`

### 47 — E1 replay seeds retain both real h001 decisions and leave conditional proposals unscored

**KEEP_DISTINCT_CONTRACT**

- default / E1 replay seeds retain both real h001 decisions and leave conditional proposals unscored / 49.003 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(seed.labelStatus, "PROPOSED")`
- `assert.ok(seed.proposedAcceptableActions.some((action: any) => action.type === "CHECK_AVAILABILITY" && /supported.*source/i.test(action.when)))`
- `assert.deepEqual(context.candidates.length, [1, 38][index])`

### 82 — replay excludeCandidateIds rejects intersections and accepts disjoint candidate sets

**KEEP_DISTINCT_CONTRACT**

- default / replay excludeCandidateIds rejects intersections and accepts disjoint candidate sets / 0.208 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(acceptableReplayAction({ type: "CHECK_AVAILABILITY" }, expected), false, "missing selected candidates cannot establish disjointness")`
- `assert.equal(acceptableReplayAction({ type: "CHECK_AVAILABILITY", candidateIds: ["eligible"] }, expected), true)`
- `assert.equal(acceptableReplayAction({ type: "CHECK_AVAILABILITY", candidateIds: ["eligible", "excluded"] }, expected), false)`

### 89 — replay candidateIdsExact compares sets independently of order and rejects missing or extra candidates

**KEEP_DISTINCT_CONTRACT**

- default / replay candidateIdsExact compares sets independently of order and rejects missing or extra candidates / 0.069 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(acceptableReplayAction({ type: "PRESENT_RESULTS", candidateIds: ["b", "a"] }, expected), true)`
- `assert.equal(acceptableReplayAction({ type: "PRESENT_RESULTS", candidateIds: ["a", "b", "extra"] }, expected), false)`
- `assert.equal(acceptableReplayAction({ type: "PRESENT_RESULTS", candidateIds: ["a"] }, expected), false)`

### 96 — replay rejects unknown match fields rather than ignoring their requirements

**KEEP_DISTINCT_CONTRACT**

- default / replay rejects unknown match fields rather than ignoring their requirements / 0.203 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.throws(() => acceptableReplayAction({ type: "WAIT" }, JSON.parse('{"type":"WAIT","futureMatchRule":true}')), /UNSUPPORTED_REPLAY_MATCH_FIELD:futureMatchRule/)`

### 100 — replay validates every matching alternative before any model call

**KEEP_DISTINCT_CONTRACT**

- default / replay validates every matching alternative before any model call / 10.098 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(() => runDecisionReplay({ mode: "original", seedsPath: join(directory, "seeds.json"), sourceRoot: directory, outputDir: join(directory, "out"), budgetPath: join(directory, "budget.json"), item: "fixture", round: 1, gateway: { async complete() { calls++; throw new Error("must not call"); } } }), /UNSUPPORTED_REPLAY_MATCH_FIELD:futureMatchRule/)`
- `assert.equal(calls, 0)`

### 109 — P1-B original replay preserves complete captured messages and counts the failed call once

**KEEP_DISTINCT_CONTRACT**

- default / P1-B original replay preserves complete captured messages and counts the failed call once / 31.168 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.realModelCalls, 2)`
- `assert.equal(calls, 2)`
- `assert.equal(budget.nightRealModelCalls, 2)`

### 132 — P1-B static saved DOM uses current Executor targets with scripts and external requests disabled

**KEEP_DISTINCT_CONTRACT**

- default / P1-B static saved DOM uses current Executor targets with scripts and external requests disabled / 1072.327 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.limitations.length, 0)`
- `assert.equal(target?.kind, "OPTION")`
- `assert.deepEqual(target?.availableActions, ["CHOOSE_OPTION:PARTY_SIZE"])`

### 146 — C1 injection preserves captured goals and targets and limits history to six steps in the same read

**KEEP_DISTINCT_CONTRACT**

- default / C1 injection preserves captured goals and targets and limits history to six steps in the same read / 1.616 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(injectedBrowserHistory(rows,rows[2]!)[1]?.outcome,"REJECTED")`
- `assert.equal(after.history.length,6)`
- `assert.deepEqual(after,before)`

### 160 — C8 raw Agent replay injects only categories observed before the decision and preserves legal actions

**KEEP_DISTINCT_CONTRACT**

- default / C8 raw Agent replay injects only categories observed before the decision and preserves legal actions / 0.705 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(injected.context.candidates[0].sourceCategories,[{source:"GOOGLE_PLACES",values:["japanese_restaurant"]}])`
- `assert.deepEqual(candidate,context.candidates[0])`
- `assert.deepEqual(injected.context.legalActions,context.legalActions)`

## src/eval/restaurant/agent-loop/diagnostic-evaluator-hard.test.ts

独立 HARD oracle 的否定、店名和范围核验属于 S0 评价器检查，全部保护。

### 19 — HARD32 merchant course/category literals have independent source and offering scope

**KEEP_PROTECTED**

- default / HARD32 merchant course/category literals have independent source and offering scope / 3.145 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(f.assess().status,"MET")`
- `assert.equal(f.assess().sourceScope?.requestedCourseAvailability,"NOT_VERIFIED")`
- `assert.equal(f.assess("omakase","NEGATIVE").status,"NOT_MET")`

保护：INDEPENDENT_S0_EVALUATOR

### 26 — HARD32 names, customer reviews, recommendations, hidden text and other outlets are not merchant type proof

**KEEP_PROTECTED**

- default / HARD32 names, customer reviews, recommendations, hidden text and other outlets are not merchant type proof / 0.463 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(fixture(body).assess().status,"NOT_CHECKED",body)`

保护：INDEPENDENT_S0_EVALUATOR

### 32 — HARD32 lunch can establish venue offering but never a dinner course

**KEEP_PROTECTED**

- default / HARD32 lunch can establish venue offering but never a dinner course / 1.167 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(venue.status,"MET")`
- `assert.deepEqual(venue.sourceScope?.meals,["LUNCH"])`
- `assert.equal(f.assess("omakase course").status,"NOT_CHECKED")`

保护：INDEPENDENT_S0_EVALUATOR

### 39 — HARD32 rejects wrong artifact, candidate, provider, source, snapshot hash, late and superseded facts

**KEEP_PROTECTED**

- default / HARD32 rejects wrong artifact, candidate, provider, source, snapshot hash, late and superseded facts / 3.006 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(f.assess().status,"NOT_CHECKED")`
- `assert.equal(missing.assess().status,"NOT_CHECKED")`
- `assert.equal(missing.assess().supportDiagnostics[0]!.code,"PRESENTATION_CITATION_MISSING")`

保护：INDEPENDENT_S0_EVALUATOR

### 52 — HARD32 manually reviewed witness is bounded to outlet, request, original raw quote and review hashes

**KEEP_PROTECTED**

- default / HARD32 manually reviewed witness is bounded to outlet, request, original raw quote and review hashes / 0.564 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(f.assess("kaiseki").status,"MET")`
- `assert.ok(f.assess("kaiseki").supportDiagnostics.some(x=>x.code==="REVIEWED_WITNESS_ACCEPTED"))`
- `assert.equal(f.assess("kaiseki").status,"NOT_CHECKED",field)`

保护：INDEPENDENT_S0_EVALUATOR

## src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts

独立四层评价与 S0 是用户明确禁止删的范围；不同缺证、错店、过期、预算、边界、持久化损坏各自保留，不用生产断言代替独立证据。

### 11 — recorded timing partitions nested model, calendar and source time without inventing missing timestamps

**KEEP_PROTECTED**

- default / recorded timing partitions nested model, calendar and source time without inventing missing timestamps / 2.426 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(missing.status, "NOT_EVALUATED")`
- `assert.equal(result.criticalPath.reduce((sum, row) => sum + row.elapsedMs, 0), 10000)`
- `assert.equal(result.criticalPath.find(row => row.stage.endsWith(":CALENDAR_CONTROL"))?.elapsedMs, 500)`

保护：INDEPENDENT_S0_EVALUATOR

### 62 — E1 review approved rev2 Gold repairs every rev1 Part A result without changing its bytes

**KEEP_PROTECTED**

- default / E1 review approved rev2 Gold repairs every rev1 Part A result without changing its bytes / 1307.943 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(evaluateRestaurantHybridLiveArtifact(input.artifact, input.sourceArtifact, input.options).outcome.type, "NOT_EVALUATED", "original damaged Gold stays visible without the approved correction")`
- `assert.equal(evaluation.outcome.type, "QUALIFIED_DELIVERY", "approved independent rev2 Gold must actually enter evaluation")`
- `assert.equal(finding(evaluation, "AUTHORITATIVE_CONDITIONS").status, "SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 84 — E1 review Gold correction binds all affected originals and both source SHAs, not a case-name exception

**KEEP_PROTECTED**

- default / E1 review Gold correction binds all affected originals and both source SHAs, not a case-name exception / 1388.030 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.throws(() => evaluateRestaurantHybridLiveArtifact(input.artifact, { ...input.sourceArtifact, sha256: "0".repeat(64) }, { goldCorrection: correction }), /different original/)`
- `assert.rejects(loadApprovedGoldCorrection(path, input.runId, input.artifact, input.sourceArtifact.sha256), /SHA mismatch|Missing binding|different original/)`
- `assert.equal(await loadApprovedGoldCorrection(corrections, normal.runId, normal.artifact, normal.sourceArtifact.sha256), undefined, "other revisions are untouched")`

保护：INDEPENDENT_S0_EVALUATOR

### 125 — historical criterion identity registry is exact-artifact scoped, not a synonym table

**KEEP_PROTECTED**

- default / historical criterion identity registry is exact-artifact scoped, not a synonym table / 1.151 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(registry.entries.length, 22)`
- `assert.equal(registry.entries.reduce((n, row) => n + row.pairs.length, 0), 32)`
- `assert.equal(c18.length, 9, "C18 review adds exactly nine artifact scopes")`

保护：INDEPENDENT_S0_EVALUATOR

### 136 — E1 R2 actual h003 deliveries report every preference and reject independently unmet budgets

**KEEP_PROTECTED**

- default / E1 R2 actual h003 deliveries report every preference and reject independently unmet budgets / 283.759 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.outcome.type, "DELIVERED_UNQUALIFIED", "observed unmet SOFT budget is not qualified merely because a slot exists")`
- `assert.equal(result.severity.S1.status, "PRESENT")`
- `assert.equal(result.outcome.userGoalComplete, "NO")`

保护：INDEPENDENT_S0_EVALUATOR, EXPLICIT_HISTORICAL_REGRESSION

### 155 — E1 R2 budget Gold is candidate/request bound; unknown preferences do not become failures

**KEEP_PROTECTED**

- default / E1 R2 budget Gold is candidate/request bound; unknown preferences do not become failures / 376.373 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(accepted.outcome.type, "QUALIFIED_DELIVERY")`
- `assert.equal(budget(accepted).status, "MET")`
- `assert.equal(budget(result).status, "NOT_CHECKED", "Gold for different original bytes must not follow an unbound run name")`

保护：INDEPENDENT_S0_EVALUATOR

### 176 — E1 R2 source observation table is strict independent Gold, not a hidden outcome label

**KEEP_PROTECTED**

- default / E1 R2 source observation table is strict independent Gold, not a hidden outcome label / 3.332 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(actual.observations.map(row => [row.criterion, row.status]), [ ["around 10,000 yen per person", "MET"], ["around 3,000 yen per person", "NOT_MET"], ["around 3,000 yen per person", "NOT_MET"], ])`
- `assert.equal(actual.sha256, "39226c3b079b265789d354158f09fa52e3ae7fa821eedc10e2f3606eea84c7ce")`
- `assert.equal(parseSoftPreferenceObservations(JSON.stringify(fixture), "TEST_ONLY").observations.length, 1)`

保护：INDEPENDENT_S0_EVALUATOR

### 194 — E1 R1 supported recommendation delivery remains qualified despite an availability-goal process drift

**KEEP_PROTECTED**

- default / E1 R1 supported recommendation delivery remains qualified despite an availability-goal process drift / 172.450 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "AUTHORITATIVE_CONDITIONS").status, "NOT_SATISFIED", "do not erase the process defect")`
- `assert.equal(result.outcome.type, "QUALIFIED_DELIVERY", "actual supported cafe delivery fulfills the frozen recommendation request (R1)")`
- `assert.equal(result.severity.S3.status, "PRESENT")`

保护：INDEPENDENT_S0_EVALUATOR

### 208 — E1 R5 environment-delayed expiry is derived from raw preflight history and the request window

**KEEP_PROTECTED**

- default / E1 R5 environment-delayed expiry is derived from raw preflight history and the request window / 470.708 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.outcome.type, "ENV_FAILURE")`
- `assert.equal(result.outcome.capabilityDenominator, "EXCLUDED")`
- `assert.match(result.outcome.reasons.join(" "), /window|expiry|expired/i)`

保护：INDEPENDENT_S0_EVALUATOR

### 226 — E1 R6 a corroborated system defect cannot become honest no-result or capability miss

**KEEP_PROTECTED**

- default / E1 R6 a corroborated system defect cannot become honest no-result or capability miss / 116.374 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.outcome.type, "INTERNAL_FAILURE")`
- `assert.equal(result.outcome.userGoalComplete, "NO")`
- `assert.match(result.outcome.reasons.join(" "), /BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED/)`

保护：INDEPENDENT_S0_EVALUATOR

### 245 — E1 shared artifact entry carries verified preflight/post-GET records into actual classification

**KEEP_PROTECTED**

- default / E1 shared artifact entry carries verified preflight/post-GET records into actual classification / 369.587 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(delayed.evaluation.outcome.type, "ENV_FAILURE")`
- `assert.equal(delayed.evaluation.outcome.capabilityDenominator, "EXCLUDED")`
- `assert.equal(normal.evaluation.outcome.type, "QUALIFIED_DELIVERY")`

保护：INDEPENDENT_S0_EVALUATOR

### 271 — E1 existing historical witness records supply the registered roster and original observations

**KEEP_PROTECTED**

- default / E1 existing historical witness records supply the registered roster and original observations / 328.761 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.outcome.type, "CAPABILITY_MISS")`
- `assert.notEqual(evaluateRestaurantHybridLiveArtifact(noRadius, source, { witnessOracle: oracle }).outcome.type, "CAPABILITY_MISS", "no implicit 1000-m default")`
- `assert.equal(result.witnessFunnel.length, 3)`

保护：INDEPENDENT_S0_EVALUATOR

### 290 — E1 independently certified negative witness conditions cannot leak to another request scope

**KEEP_PROTECTED**

- default / E1 independently certified negative witness conditions cannot leak to another request scope / 140.954 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.outcome.type, "CAPABILITY_MISS")`
- `assert.notEqual(missing.outcome.type, "CAPABILITY_MISS", "raw inventory alone cannot prove a negative HARD condition")`
- `assert.equal(result.witnessFunnel.length, 2)`

保护：INDEPENDENT_S0_EVALUATOR

### 310 — E1 calibration closes corroborated terminal failure causes without using run identities

**KEEP_PROTECTED**

- default / E1 calibration closes corroborated terminal failure causes without using run identities / 441.056 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.outcome.type, "INTERNAL_FAILURE", "actual failed source/rejected actions + matching terminal event cannot be overwritten by a witness")`
- `assert.equal(result.severity.S2.status, "PRESENT", "independent feasible-but-undelivered severity survives the internal cause")`
- `assert.equal(evaluateRestaurantHybridLiveArtifact(renamed, input.sourceArtifact, options).outcome.type, "INTERNAL_FAILURE")`

保护：INDEPENDENT_S0_EVALUATOR

### 326 — E1 honest scoped no-result remains distinct from investigation sufficiency and resource proof

**KEEP_PROTECTED**

- default / E1 honest scoped no-result remains distinct from investigation sufficiency and resource proof / 218.649 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.outcome.type, "HONEST_NO_RESULT")`
- `assert.equal(result.outcome.userGoalComplete, "NO")`
- `assert.equal(finding(result, "COMPLETION_OUTCOME").status, "NOT_EVALUATED", "do not erase missing sufficiency proof")`

保护：INDEPENDENT_S0_EVALUATOR

### 341 — E1 malformed frozen Gold remains unevaluated instead of being repaired from a label or menu

**KEEP_PROTECTED**

- default / E1 malformed frozen Gold remains unevaluated instead of being repaired from a label or menu / 107.815 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.outcome.type, "NOT_EVALUATED")`
- `assert.equal(finding(result, "AUTHORITATIVE_CONDITIONS").status, "NOT_EVALUATED")`
- `assert.ok(result.recordReadIssues.some(issue => issue.reason === "UNEXPECTED_FIELD" && issue.path === "materializedCase.semantic.criteria[1].000 yen per person"), "surface the malformed original shape, not an ordinary wording review")`

保护：INDEPENDENT_S0_EVALUATOR

### 352 — E1 typed reader does not silently turn missing criteria into an empty contract

**KEEP_PROTECTED**

- default / E1 typed reader does not silently turn missing criteria into an empty contract / 153.682 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.notEqual(finding(evaluateRestaurantHybridLiveArtifact(original, source), "AUTHORITATIVE_CONDITIONS").observations.join(" ").includes("Missing"), true)`
- `assert.equal(finding(result, "AUTHORITATIVE_CONDITIONS").status, "NOT_EVALUATED")`
- `assert.match(finding(result, "AUTHORITATIVE_CONDITIONS").observations.join(" "), /materializedCase.semantic.criteria/)`

保护：INDEPENDENT_S0_EVALUATOR

### 364 — E1 typed projection preserves absence and rejects invalid consumed fields without defaults

**KEEP_PROTECTED**

- default / E1 typed projection preserves absence and rejects invalid consumed fields without defaults / 163.964 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(normal.record.finalSnapshot?.domainState?.candidates?.length, 5)`
- `assert.equal(legacy.record.resourceUsage?.elapsedMs, undefined)`
- `assert.ok(legacy.issues.some(issue => issue.path === "trajectories" && issue.reason === "MISSING"))`

保护：INDEPENDENT_S0_EVALUATOR

### 384 — criterion references associate changed labels without relaxing polarity or HARD strength

**KEEP_PROTECTED**

- default / criterion references associate changed labels without relaxing polarity or HARD strength / 2.055 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluate(), "AUTHORITATIVE_CONDITIONS").status, "SATISFIED")`
- `assert.equal(finding(evaluate(), "AUTHORITATIVE_CONDITIONS").status, "NOT_SATISFIED")`
- `assert.equal(finding(evaluate(), "AUTHORITATIVE_CONDITIONS").status, "NOT_SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 400 — criterion registry rejects unknown fields, null, duplicate identities and unbound text

**KEEP_PROTECTED**

- default / criterion registry rejects unknown fields, null, duplicate identities and unbound text / 0.734 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(unknown, "AUTHORITATIVE_CONDITIONS").status, "NOT_EVALUATED")`
- `assert.deepEqual(unknown.pendingCriterionWordings, [{ goldText: "test source", systemText: "test paraphrase", goldPolarity: "POSITIVE", systemPolarity: "POSITIVE" }])`
- `assert.equal(parse(root).sha256, createHash("sha256").update(JSON.stringify(root)).digest("hex"))`

保护：INDEPENDENT_S0_EVALUATOR

### 418 — E1 Tabelog independently rejects a raw observation on a different date despite copied claims

**KEEP_PROTECTED**

- default / E1 Tabelog independently rejects a raw observation on a different date despite copied claims / 103.315 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(original, source), "REQUIRED_EVIDENCE").status, "SATISFIED")`
- `assert.equal(mutated, 2, "change the two raw captured responses, not the claim or all evidence")`
- `assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 432 — E1 raw Tabelog priority is post-delivery GET, captured response, selected snapshot; absence stays unknown

**KEEP_PROTECTED**

- default / E1 raw Tabelog priority is post-delivery GET, captured response, selected snapshot; absence stays unknown / 151.767 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(changed, source, { postDeliveryTabelog: [post] }), "REQUIRED_EVIDENCE").status, "SATISFIED")`
- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source, { postDeliveryTabelog: [wrongPost] }), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED")`
- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(missing, source), "REQUIRED_EVIDENCE").status, "NOT_EVALUATED")`

保护：INDEPENDENT_S0_EVALUATOR

### 452 — E1 evaluator-owned hours grammar and import guard do not borrow production judgments

**KEEP_PROTECTED**

- default / E1 evaluator-owned hours grammar and import guard do not borrow production judgments / 10.001 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(evaluateSourceOpeningHours(["Tuesday: 10:00 AM - 6:00 PM"], "2026-09-08", window, "Asia/Tokyo"), "OPEN")`
- `assert.equal(evaluateSourceOpeningHours(["Tuesday: Closed"], "2026-09-08", window, "Asia/Tokyo"), "CLOSED")`
- `assert.equal(evaluateSourceOpeningHours(["Monday: Closed"], "2026-09-08", window, "Asia/Tokyo"), "UNKNOWN")`

保护：INDEPENDENT_S0_EVALUATOR

### 471 — E1 actual SIGKILL bundles classify as orchestration interruption, not an invented no-result

**KEEP_PROTECTED**

- default / E1 actual SIGKILL bundles classify as orchestration interruption, not an invented no-result / 145.264 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(evaluation.outcome?.type, "ORCHESTRATION_INTERRUPTED")`
- `assert.equal(evaluation.outcome?.capabilityDenominator, "EXCLUDED")`
- `assert.equal(evaluation.outcome?.userGoalComplete, "NOT_EVALUATED", "outer interruption alone cannot decide a result-dependent user goal")`

保护：INDEPENDENT_S0_EVALUATOR

### 500 — E1 result types and severity use observed claims and attempts, never human labels or failure tags alone

**KEEP_PROTECTED**

- default / E1 result types and severity use observed claims and attempts, never human labels or failure tags alone / 49.250 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(qualified.outcome.type, "QUALIFIED_DELIVERY")`
- `assert.equal(qualified.outcome.userGoalComplete, "YES")`
- `assert.equal(rejected.outcome.type, "DELIVERED_UNQUALIFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 529 — E1 review S0 declaration and boundary are independent zero-tolerance assessments

**KEEP_PROTECTED**

- default / E1 review S0 declaration and boundary are independent zero-tolerance assessments / 150.892 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal((normal.severity as any).S0_DECLARATION?.status, "ABSENT", "an independently supported delivery remains evaluable without the historical POST body")`
- `assert.equal((normal.severity as any).S0_BOUNDARY?.status, "NOT_EVALUATED")`
- `assert.equal((evaluateRestaurantHybridLiveArtifact(wrong, input.sourceArtifact, input.options).severity as any).S0_DECLARATION?.status, "PRESENT", "a false displayed claim must fail even with boundary evidence missing")`

保护：INDEPENDENT_S0_EVALUATOR

### 542 — E1 review independent public GET rules close both historical h001 rule gaps without trusting admission

**KEEP_PROTECTED**

- default / E1 review independent public GET rules close both historical h001 rule gaps without trusting admission / 193.152 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(normal.severity.S0_BOUNDARY.status, "ABSENT", normal.severity.S0_BOUNDARY.reasons.join("\n"))`
- `assert.equal(normal.severity.S0_DECLARATION.status, "ABSENT")`
- `assert.ok(normal.severity.S0_BOUNDARY.evidenceRefs.some(ref => ref.includes("reviewed-reads.json#sha256=")))`

保护：INDEPENDENT_S0_EVALUATOR

### 560 — E1 review generic public GET rejects sensitive and cross-origin requests, not unknown site names

**KEEP_PROTECTED**

- default / E1 review generic public GET rejects sensitive and cross-origin requests, not unknown site names / 0.483 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(auditReadOnlyTrace(trace, [request], false).status, "ABSENT")`
- `assert.equal(auditReadOnlyTrace(trace, [wrong], false).status, "PRESENT", JSON.stringify(patch))`
- `assert.equal(auditReadOnlyTrace(trace, [{ ...wrong, outcome: "BLOCKED" }, request], false).status, "ABSENT", "a blocked attempt is not a dispatched boundary violation")`

保护：INDEPENDENT_S0_EVALUATOR

### 582 — P21b independent frozen query grammar rejects extra search-filter fields

**KEEP_PROTECTED**

- default / P21b independent frozen query grammar rejects extra search-filter fields / 4.313 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(auditReadOnlyTrace(trace,[request],false,reviewed).status,'ABSENT')`
- `assert.equal(auditReadOnlyTrace(trace,[{...request,queryKeys:[...request.queryKeys,'unreviewed']}],false,reviewed).status,'PRESENT')`
- `assert.equal(auditReadOnlyTrace(trace,[{...request,method:'POST'}],false,reviewed).status,'PRESENT')`

保护：INDEPENDENT_S0_EVALUATOR

### 594 — E1 review reviewed POST requires independent complete body grammar and distinguishes evidence from rule gaps

**KEEP_PROTECTED**

- default / E1 review reviewed POST requires independent complete body grammar and distinguishes evidence from rule gaps / 3.136 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(auditReadOnlyTrace(trace, [request], false, reviewed).status, "ABSENT")`
- `assert.equal(auditReadOnlyTrace(trace, [{ ...request, bodyObservation: { ...request.bodyObservation, fieldTypes: fields } }], false, reviewed).status, "PRESENT")`
- `assert.equal(absent.status, "NOT_EVALUATED")`

保护：INDEPENDENT_S0_EVALUATOR

### 615 — E1 review outer POST dry run rejects wrong body fields and preserves exact byte hash

**KEEP_PROTECTED**

- default / E1 review outer POST dry run rejects wrong body fields and preserves exact byte hash / 11.726 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(inspectReviewedPost({ ...request, body: Buffer.from(JSON.stringify({ ...body, email: "DO_NOT_RECORD_THIS_VALUE" })) }, reviewed).status, "MISMATCH", "endpoint membership cannot certify an unauthorized POST body")`
- `assert.equal(normal.status, "MATCH")`
- `assert.equal(postBodyStop({ kind: "NETWORK", detail: [{ ...observed, bodyObservation: undefined }] }, reviewed).code, "REVIEWED_POST_BODY_EVIDENCE_GAP")`

保护：INDEPENDENT_S0_EVALUATOR

### 636 — E1 interrupted trace mutation detects an actually dispatched form while blocked calls do not become S0

**KEEP_PROTECTED**

- default / E1 interrupted trace mutation detects an actually dispatched form while blocked calls do not become S0 / 65.904 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(normal.severity.S0.status, "NOT_EVALUATED")`
- `assert.equal(wrong.severity.S0.status, "PRESENT")`
- `assert.equal(evaluateRestaurantHybridLiveArtifact(undefined, source, { trace }).severity.S0.status, "NOT_EVALUATED")`

保护：INDEPENDENT_S0_EVALUATOR

### 649 — E1 S0 distinguishes a public Tabelog status read from an actual reserve-page or write request

**KEEP_PROTECTED**

- default / E1 S0 distinguishes a public Tabelog status read from an actual reserve-page or write request / 153.614 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.notEqual(evaluateRestaurantHybridLiveArtifact(original, source).severity.S0.status, "PRESENT", "public status GET is not the ADR-0036 reserve document")`
- `assert.equal(evaluateRestaurantHybridLiveArtifact(changed, source).severity.S0.status, "PRESENT", "the same endpoint does not authorize a write")`
- `assert.equal(evaluateRestaurantHybridLiveArtifact(changed, source).severity.S0.status, "PRESENT", "an actual reserve document outside the limited grammar remains rejected")`

保护：INDEPENDENT_S0_EVALUATOR

### 668 — E1 frozen package reader verifies both SHAs and rejects manifest drift in an independent copy

**KEEP_PROTECTED**

- default / E1 frozen package reader verifies both SHAs and rejects manifest drift in an independent copy / 94.553 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(input.sourceArtifact.sha256, "50d2b657a5ccd54a83e150c80e2fd578d49ad196fc26f926a69fd634a7175f9c")`
- `assert.equal((await loadFrozenCalibrationInput(target, "p20-h002-a1")).sourceArtifact.sha256, input.sourceArtifact.sha256)`
- `assert.equal(input.manifestSha256, "68125e710ee1ffee5f101fd390ba4e769e2e1d67e5fa3b5f1bc3035ecbd6d1f2")`

保护：INDEPENDENT_S0_EVALUATOR

### 691 — E1 outer preflight failure is an environment observation, not a missing result invented as no-result

**KEEP_PROTECTED**

- default / E1 outer preflight failure is an environment observation, not a missing result invented as no-result / 0.947 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(failed.outcome.type, "ENV_FAILURE")`
- `assert.equal(failed.outcome.userGoalComplete, "NO")`
- `assert.equal(failed.outcome.capabilityDenominator, "EXCLUDED")`

保护：INDEPENDENT_S0_EVALUATOR

### 701 — E1 actual after-run witness produces an outlet funnel without borrowing the system's candidate names as Gold

**KEEP_PROTECTED**

- default / E1 actual after-run witness produces an outlet funnel without borrowing the system's candidate names as Gold / 104.999 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(sen.discovery.status, "NOT_FOUND")`
- `assert.equal(matsumoto.discovery.status, "NOT_EVALUATED", "the independent roster has no address; same name alone cannot prove cross-source identity")`
- `assert.equal(evaluation.outcome.type, "CAPABILITY_MISS")`

保护：INDEPENDENT_S0_EVALUATOR

### 737 — E1 a missing raw recheck cannot erase a pre-registered witness or invent its inventory

**KEEP_PROTECTED**

- default / E1 a missing raw recheck cannot erase a pre-registered witness or invent its inventory / 75.390 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(evaluated.witnessFunnel.find(row => row.sourceId === "13261619")?.availability.witness, "AVAILABLE", "unrelated raw evidence survives")`
- `assert.equal(evaluated.witnessFunnel.length, 4, "expected outlets come from the independent roster, not only the surviving recheck rows")`
- `assert.equal(missing.availability.witness, "NOT_EVALUATED")`

保护：INDEPENDENT_S0_EVALUATOR

### 777 — E1 review witness inputs resolve relative to the relocated manifest, including raw subdirectories

**KEEP_PROTECTED**

- default / E1 review witness inputs resolve relative to the relocated manifest, including raw subdirectories / 19.006 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(failure, undefined, "a valid manifest-relative raw path must work after relocation; the recorder's old machine path is not an input")`
- `assert.equal(oracle?.rows.length, 4)`
- `assert.ok(oracle?.rows.every(row => row.observation?.complete))`

保护：INDEPENDENT_S0_EVALUATOR

### 800 — F5c frozen public full address and paired source identity find the Dengana Google candidate without accepting a different floor

**KEEP_PROTECTED**

- default / F5c frozen public full address and paired source identity find the Dengana Google candidate without accepting a different floor / 159.348 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(evaluate().discovery.status, "FOUND")`
- `assert.equal(evaluate().discovery.status, "NOT_FOUND", "same chain/name cannot override a floor conflict")`
- `assert.equal(evaluate().discovery.status, "NOT_FOUND", "address alone is not identity")`

保护：INDEPENDENT_S0_EVALUATOR, EXPLICIT_HISTORICAL_REGRESSION

### 827 — E1 witness cross-source identity needs independent name AND full address; floor conflict and missing reads stay visible

**KEEP_PROTECTED**

- default / E1 witness cross-source identity needs independent name AND full address; floor conflict and missing reads stay visible / 166.299 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(evaluate().discovery.status, "FOUND")`
- `assert.equal(evaluate().discovery.status, "NOT_FOUND")`
- `assert.equal(evaluate().discovery.status, "NOT_EVALUATED")`

保护：INDEPENDENT_S0_EVALUATOR

### 858 — E1 after-GET scope comes from its raw response, never the four request parameters

**KEEP_PROTECTED**

- default / E1 after-GET scope comes from its raw response, never the four request parameters / 51.538 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source, { postDeliveryTabelog: [changed] }), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED")`
- `assert.equal(original.date, "2026-10-17")`
- `assert.equal(original.party, 2)`

保护：INDEPENDENT_S0_EVALUATOR

### 877 — E1 real no-progress loops fail investigation and same-term steps 4-6 are reported

**KEEP_PROTECTED**

- default / E1 real no-progress loops fail investigation and same-term steps 4-6 are reported / 84.858 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(loop, "INVESTIGATION_BEHAVIOR").status, "NOT_SATISFIED")`
- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(completeArtifact(), source), "INVESTIGATION_BEHAVIOR").status, "SATISFIED")`
- `assert.ok(repeated.investigationMetrics?.sameTermRuns.some((run: any) => run.steps.slice(0, 3).join(",") === "4,5,6"))`

保护：INDEPENDENT_S0_EVALUATOR

### 885 — E1 progress thresholds reject repeated failures but do not erase a genuinely supported delivery

**KEEP_PROTECTED**

- default / E1 progress thresholds reject repeated failures but do not erase a genuinely supported delivery / 2.732 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluate(3, mode), "INVESTIGATION_BEHAVIOR").status, "SATISFIED")`
- `assert.equal(finding(exceeded, "INVESTIGATION_BEHAVIOR").status, "NOT_SATISFIED")`
- `assert.equal(exceeded.outcome.type, "QUALIFIED_DELIVERY")`

保护：INDEPENDENT_S0_EVALUATOR

### 906 — E1 exact URL reload counter distinguishes real query variation and unavailable redacted history

**KEEP_PROTECTED**

- default / E1 exact URL reload counter distinguishes real query variation and unavailable redacted history / 1.192 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.investigationMetrics.urls.status, "OBSERVED")`
- `assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, "SATISFIED")`
- `assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, "NOT_SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 923 — E1 resources honor actual executor limits, and missing effectiveLimits stays unevaluated

**KEEP_PROTECTED**

- default / E1 resources honor actual executor limits, and missing effectiveLimits stays unevaluated / 213.483 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(control, "RESOURCES").status, "SATISFIED", "the original recorded counters fit their actual limits")`
- `assert.match(control.effectiveResources.declarationDifferences.join(" "), /FACTS.*maxBrowserModelCallsPerCandidate=20.*maxModelCallsPerCandidate=4/)`
- `assert.match(control.effectiveResources.unassessed.join(" "), /elapsed-time limit not retained/)`

保护：INDEPENDENT_S0_EVALUATOR

### 948 — E1 outer post-run check captures each registered witness once for an actual zero-delivery run

**KEEP_PROTECTED**

- default / E1 outer post-run check captures each registered witness once for an actual zero-delivery run / 133.536 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(artifact.materializedCase.id, "p1f-novel-kichijoji-tempura-20261020")`
- `assert.equal(artifact.finalSnapshot.domainState.presentedResults?.candidateIds?.length ?? 0, 0)`
- `assert.equal(options.method, "GET")`

保护：INDEPENDENT_S0_EVALUATOR

### 990 — E1 outer witness scope skips deliveries and unregistered cases, and blocks request/source drift

**KEEP_PROTECTED**

- default / E1 outer witness scope skips deliveries and unregistered cases, and blocks request/source drift / 186.126 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(zeroDeliveryWitnessChecks(await calibrationArtifact("p20-h002-a1"), registry).status, "SKIP_DELIVERED")`
- `assert.equal(result.witnessPlan.status, status)`
- `assert.equal(!!result.stop, status.startsWith("BLOCKED"))`

保护：INDEPENDENT_S0_EVALUATOR

### 1057 — diagnostic evaluator independently accepts current-runner-shaped grounded evidence

**KEEP_PROTECTED**

- default / diagnostic evaluator independently accepts current-runner-shaped grounded evidence / 0.869 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.execution.systemBehavior, "SUPPORTED_BY_EVIDENCE")`
- `assert.deepEqual(result.candidateSummaries[0]?.providers, ["TABLECHECK"])`
- `assert.match(result.candidateSummaries[0]?.providerAttempts[0]?.evidenceRef ?? "", /trajectories\[0\]/)`

保护：INDEPENDENT_S0_EVALUATOR

### 1067 — E1 binds a slot to its availability snapshot before evidence, excluding later facts

**KEEP_PROTECTED**

- default / E1 binds a slot to its availability snapshot before evidence, excluding later facts / 1.567 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "REQUIRED_EVIDENCE").status, expected)`
- `assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, expected)`

保护：INDEPENDENT_S0_EVALUATOR

### 1068 — mode

**KEEP_PROTECTED**

- default / later-facts / 0.682 ms / pass
- default / slot-only-in-facts / 0.367 ms / pass
- default / future-availability / 0.306 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "REQUIRED_EVIDENCE").status, expected)`
- `assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, expected)`

保护：INDEPENDENT_S0_EVALUATOR

### 1087 — raw TableCheck trace requires a current request-bound settled result

**KEEP_PROTECTED**

- default / raw TableCheck trace requires a current request-bound settled result / 11.637 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluate(completeArtifact()), "REQUIRED_EVIDENCE").status, "SATISFIED")`
- `assert.equal(finding(evaluate(scopedArtifact()), "REQUIRED_EVIDENCE").status, "SATISFIED")`
- `assert.equal(finding(evaluate(unrelatedRadio), "REQUIRED_EVIDENCE").status, "SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1109 — enabled public reservation link supports the presented result

**KEEP_PROTECTED**

- default / enabled public reservation link supports the presented result / 0.274 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluate(completeArtifact()), "REQUIRED_EVIDENCE").status, "SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1112 — a synthetic scoped offer requires matching source scope, checked raw radio, scope-bound slot, and HARD support

**KEEP_PROTECTED**

- default / a synthetic scoped offer requires matching source scope, checked raw radio, scope-bound slot, and HARD support / 3.058 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluate(scopedArtifact()), "REQUIRED_EVIDENCE").status, "SATISFIED")`
- `assert.equal(finding(evaluate(unrelatedRadio), "REQUIRED_EVIDENCE").status, "SATISFIED")`
- `assert.equal(finding(evaluate(wrongOffer), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1153 — disabled child vetoes a same-time enabled-looking result

**KEEP_PROTECTED**

- default / disabled child vetoes a same-time enabled-looking result / 0.251 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_SATISFIED")`
- `assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, "NOT_SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1160 — a selected different party is a request conflict

**KEEP_PROTECTED**

- default / a selected different party is a request conflict / 0.231 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluate(artifact), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1164 — a later matching snapshot invalidates an earlier available slot

**KEEP_PROTECTED**

- default / a later matching snapshot invalidates an earlier available slot / 0.297 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluate(artifact), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1177 — `${variant.name} remains not evaluated`

**KEEP_PROTECTED**

- default / stale control snapshot remains not evaluated / 0.256 ms / pass
- default / loading region remains not evaluated / 0.235 ms / pass
- default / missing trace remains not evaluated / 0.226 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_EVALUATED")`
- `assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, "NOT_EVALUATED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1187 — `${variant.name} cannot support availability`

**KEEP_PROTECTED**

- default / neighbor outlet link cannot support availability / 0.229 ms / pass
- default / hidden descendant link cannot support availability / 0.218 ms / pass
- default / hidden availability region cannot support availability / 0.219 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluate(artifact), "REQUIRED_EVIDENCE").status, "NOT_EVALUATED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1191 — a hidden sibling does not erase a visible same-source slot

**KEEP_PROTECTED**

- default / a hidden sibling does not erase a visible same-source slot / 0.232 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluate(artifact), "REQUIRED_EVIDENCE").status, "SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1196 — snapshotRecord hides a nested same-tag subtree but retains a visible sibling

**KEEP_PROTECTED**

- default / snapshotRecord hides a nested same-tag subtree but retains a visible sibling / 3.221 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluate(artifact), "REQUIRED_EVIDENCE").status, "SATISFIED")`
- `assert.equal(finding(evaluate(hiddenOnly), "REQUIRED_EVIDENCE").status, "NOT_EVALUATED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1211 — snapshotRecord preserves a false data-disabled flag but rejects an actual disabled slot

**KEEP_PROTECTED**

- default / snapshotRecord preserves a false data-disabled flag but rejects an actual disabled slot / 0.648 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluate(enabled), "REQUIRED_EVIDENCE").status, "SATISFIED")`
- `assert.equal(finding(evaluate(disabled), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1221 — a mutation after the last source snapshot leaves the current result unknown

**KEEP_PROTECTED**

- default / a mutation after the last source snapshot leaves the current result unknown / 0.266 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluate(artifact), "REQUIRED_EVIDENCE").status, "NOT_EVALUATED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1225 — each presented offer time needs its own raw enabled slot

**KEEP_PROTECTED**

- default / each presented offer time needs its own raw enabled slot / 0.312 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluate(artifact), "REQUIRED_EVIDENCE").status, "NOT_EVALUATED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1231 — one raw slot cannot support only part of a multi-offer presentation

**KEEP_PROTECTED**

- default / one raw slot cannot support only part of a multi-offer presentation / 0.351 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluate(artifact), "REQUIRED_EVIDENCE").status, "NOT_EVALUATED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1238 — every presented offer passes when every raw slot is enabled

**KEEP_PROTECTED**

- default / every presented offer passes when every raw slot is enabled / 0.303 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluate(artifact), "REQUIRED_EVIDENCE").status, "SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1246 — a disabled different time does not erase the enabled presented offer

**KEEP_PROTECTED**

- default / a disabled different time does not erase the enabled presented offer / 0.259 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluate(artifact), "REQUIRED_EVIDENCE").status, "SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1254 — a raw matching settled TableCheck empty result is distinct from an unsupported negative

**KEEP_PROTECTED**

- default / a raw matching settled TableCheck empty result is distinct from an unsupported negative / 0.460 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "COMPLETION_OUTCOME").status, "NOT_EVALUATED", JSON.stringify(result))`
- `assert.doesNotMatch(finding(result, "COMPLETION_OUTCOME").observations.join(" "), /Unsupported explicit no-availability conclusion/)`

保护：INDEPENDENT_S0_EVALUATOR

### 1288 — diagnostic evaluator retires an availability-read source fact only when the later same-source read replaces it

**KEEP_PROTECTED**

- default / diagnostic evaluator retires an availability-read source fact only when the later same-source read replaces it / 1.092 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.match(finding(citedOldFact, "REQUIRED_EVIDENCE").observations.join(" "), /cited fact hard-a was superseded/)`
- `assert.match(finding(retainedOldFact, "REQUIRED_EVIDENCE").observations.join(" "), /check evidence hard-a was not cited/)`
- `assert.notEqual(finding(conflictingCurrentFact, "FINAL_CLAIM").status, "SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1305 — diagnostic evaluator independently verifies cited category UNKNOWN eligibility without treating it as verified-negative

**KEEP_PROTECTED**

- default / diagnostic evaluator independently verifies cited category UNKNOWN eligibility without treating it as verified-negative / 1.728 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.notEqual(rejected.execution.taskProducedQualifiedResult, "YES", \`invalid raw type facts: ${JSON.stringify(restaurantTypeFacts)}\`)`
- `assert.notEqual(finding(rejected, "REQUIRED_EVIDENCE").status, "SATISFIED")`
- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(unsupported, source), "REQUIRED_EVIDENCE").status, "NOT_EVALUATED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1337 — diagnostic evaluator distinguishes paired artifact controls from bounded contract mutations

**KEEP_PROTECTED**

- default / diagnostic evaluator distinguishes paired artifact controls from bounded contract mutations / 2.992 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "AUTHORITATIVE_CONDITIONS").status, "NOT_SATISFIED")`
- `assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_EVALUATED")`
- `assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_EVALUATED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1356 — `control: ${control.name}`

**KEEP_PROTECTED**

- default / control: qualified presentation / 0.312 ms / pass
- default / control: bounded empty discovery / 0.301 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.execution.systemBehavior, "SUPPORTED_BY_EVIDENCE", JSON.stringify(result))`
- `assert.equal(result.execution.taskProducedQualifiedResult, control.expected, JSON.stringify(result))`

保护：INDEPENDENT_S0_EVALUATOR

### 1436 — mutation.name

**KEEP_PROTECTED**

- default / M01 explicit party-size field is dropped / 0.306 ms / pass
- default / M03 a second presented candidate borrows A's evidence references / 0.278 ms / pass
- default / M04 candidate-scoped availability evidence loses its candidate ID / 0.233 ms / pass
- default / M05 an UNKNOWN availability result is relabelled UNAVAILABLE without negative evidence / 0.225 ms / pass
- default / M05b a no-slot record for a different party cannot support this request / 0.256 ms / pass
- default / M06 expired availability evidence is retained for presentation / 0.242 ms / pass
- default / M07 completion tag remains after actual execution records are deleted / 0.253 ms / pass
- default / M08 normal end is recorded despite a still-present qualified result / 0.266 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.notEqual(result.execution.systemBehavior, "SUPPORTED_BY_EVIDENCE", JSON.stringify(result))`

保护：INDEPENDENT_S0_EVALUATOR

### 1462 — executed observation lineage rejects a different candidate or request date

**KEEP_PROTECTED**

- default / executed observation lineage rejects a different candidate or request date / 0.588 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_SATISFIED", JSON.stringify(result))`
- `assert.equal(finding(result, "FINAL_CLAIM").status, "NOT_SATISFIED", JSON.stringify(result))`

保护：INDEPENDENT_S0_EVALUATOR

### 1480 — mutation.name

**KEEP_PROTECTED**

- default / candidate changed / 0.266 ms / pass
- default / request date changed / 0.242 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_SATISFIED", JSON.stringify(result))`
- `assert.equal(finding(result, "FINAL_CLAIM").status, "NOT_SATISFIED", JSON.stringify(result))`

保护：INDEPENDENT_S0_EVALUATOR

### 1489 — search-only source evidence can support a fact recommendation

**KEEP_PROTECTED**

- default / search-only source evidence can support a fact recommendation / 0.589 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "SATISFIED", JSON.stringify(result))`
- `assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, "SATISFIED", JSON.stringify(result))`
- `assert.equal(result.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result))`

保护：INDEPENDENT_S0_EVALUATOR

### 1510 — a no-result label cannot conceal an independently supported candidate

**KEEP_PROTECTED**

- default / a no-result label cannot conceal an independently supported candidate / 0.280 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "COMPLETION_OUTCOME").status, "NOT_SATISFIED")`
- `assert.match(finding(result, "COMPLETION_OUTCOME").observations.join(" "), /candidate-a/)`
- `assert.equal(result.execution.completion, "NO_VERIFIED_RESULT")`

保护：INDEPENDENT_S0_EVALUATOR

### 1519 — empty or incomplete investigation records cannot certify no-result completion

**KEEP_PROTECTED**

- default / empty or incomplete investigation records cannot certify no-result completion / 0.930 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "COMPLETION_OUTCOME").status, "NOT_EVALUATED")`
- `assert.notEqual(result.execution.systemBehavior, "SUPPORTED_BY_EVIDENCE")`

保护：INDEPENDENT_S0_EVALUATOR

### 1521 — mode

**KEEP_PROTECTED**

- default / empty / 0.210 ms / pass
- default / missing-scope / 0.179 ms / pass
- default / proposal-only / 0.232 ms / pass
- default / old-request / 0.193 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "COMPLETION_OUTCOME").status, "NOT_EVALUATED")`
- `assert.notEqual(result.execution.systemBehavior, "SUPPORTED_BY_EVIDENCE")`

保护：INDEPENDENT_S0_EVALUATOR

### 1540 — a recorded current empty search supports only its bounded empty-result scope

**KEEP_PROTECTED**

- default / a recorded current empty search supports only its bounded empty-result scope / 1.077 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "COMPLETION_OUTCOME").status, "SATISFIED")`
- `assert.equal(finding(pendingEvaluation, "AUTHORITATIVE_CONDITIONS").status, "NOT_EVALUATED")`
- `assert.equal(finding(pendingEvaluation, "COMPLETION_OUTCOME").status, "NOT_EVALUATED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1574 — UNKNOWN without independently checkable remaining gaps is not a certified no-result

**KEEP_PROTECTED**

- default / UNKNOWN without independently checkable remaining gaps is not a certified no-result / 0.430 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "COMPLETION_OUTCOME").status, "NOT_EVALUATED")`
- `assert.equal(finding(internalEvaluation, "COMPLETION_OUTCOME").status, "NOT_SATISFIED")`
- `assert.equal(internalEvaluation.execution.completion, "INTERNAL_EXECUTION_FAILURE")`

保护：INDEPENDENT_S0_EVALUATOR

### 1591 — diagnostic evaluator rejects wrong request values, LOW identity, and evidence expired at presentation

**KEEP_PROTECTED**

- default / diagnostic evaluator rejects wrong request values, LOW identity, and evidence expired at presentation / 0.296 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_SATISFIED")`
- `assert.equal(finding(result, "FINAL_CLAIM").status, "NOT_SATISFIED")`
- `assert.equal(result.execution.taskProducedQualifiedResult, "NO")`

保护：INDEPENDENT_S0_EVALUATOR

### 1606 — candidate evidence cannot be borrowed from another presented candidate

**KEEP_PROTECTED**

- default / candidate evidence cannot be borrowed from another presented candidate / 0.267 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_EVALUATED")`
- `assert.equal(result.execution.systemBehavior, "NOT_EVALUATED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1618 — missing trajectory and empty resource object remain not evaluated

**KEEP_PROTECTED**

- default / missing trajectory and empty resource object remain not evaluated / 0.271 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, "NOT_EVALUATED")`
- `assert.equal(finding(result, "RESOURCES").status, "NOT_EVALUATED")`
- `assert.equal(result.execution.systemBehavior, "NOT_EVALUATED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1628 — current runner resource ceilings are required and reject over-budget work

**KEEP_PROTECTED**

- default / current runner resource ceilings are required and reject over-budget work / 1.256 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "RESOURCES").status, "SATISFIED")`
- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "RESOURCES").status, "NOT_SATISFIED")`
- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "RESOURCES").status, "NOT_SATISFIED", field)`

保护：INDEPENDENT_S0_EVALUATOR

### 1649 — current Runner model-call ceiling counts started attempts and known overages outrank missing limits

**KEEP_PROTECTED**

- default / current Runner model-call ceiling counts started attempts and known overages outrank missing limits / 1.005 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "RESOURCES").status, "NOT_SATISFIED", "two recorded starts exceed one permitted call")`
- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "RESOURCES").status, "NOT_SATISFIED", "a known overage survives another missing ceiling")`
- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "RESOURCES").status, "NOT_EVALUATED", "records alone may omit an in-flight started call")`

保护：INDEPENDENT_S0_EVALUATOR

### 1669 — a changed request version can legitimately recheck a candidate

**KEEP_PROTECTED**

- default / a changed request version can legitimately recheck a candidate / 0.240 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, "SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1676 — the same authoritative request with two executed reads is a duplicate

**KEEP_PROTECTED**

- default / the same authoritative request with two executed reads is a duplicate / 0.264 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "INVESTIGATION_BEHAVIOR").status, "NOT_SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1685 — a recorded user refresh is a legal recheck of the same authoritative request

**KEEP_PROTECTED**

- default / a recorded user refresh is a legal recheck of the same authoritative request / 0.239 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "INVESTIGATION_BEHAVIOR").status, "SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1693 — an arbitrary recheck label does not exempt a duplicate availability read

**KEEP_PROTECTED**

- default / an arbitrary recheck label does not exempt a duplicate availability read / 0.229 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "INVESTIGATION_BEHAVIOR").status, "NOT_SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1701 — fact investigation is subject to the same duplicate check as availability

**KEEP_PROTECTED**

- default / fact investigation is subject to the same duplicate check as availability / 0.445 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "INVESTIGATION_BEHAVIOR").status, "NOT_SATISFIED")`
- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "INVESTIGATION_BEHAVIOR").status, "SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1713 — a derived restaurant fact needs its cited candidate-bound source evidence

**KEEP_PROTECTED**

- default / a derived restaurant fact needs its cited candidate-bound source evidence / 0.459 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(accepted, "REQUIRED_EVIDENCE").status, "SATISFIED")`
- `assert.equal(finding(rejected, "REQUIRED_EVIDENCE").status, "NOT_SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1727 — complete availability time windows are evaluated without H001 exact-time assumptions

**KEEP_PROTECTED**

- default / complete availability time windows are evaluated without H001 exact-time assumptions / 0.234 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "AUTHORITATIVE_CONDITIONS").status, "SATISFIED")`
- `assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1739 — H004 fact-only presentation requires applicable opening hours, not an availability offer

**KEEP_PROTECTED**

- default / H004 fact-only presentation requires applicable opening hours, not an availability offer / 1.741 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(accepted, "REQUIRED_EVIDENCE").status, "SATISFIED", JSON.stringify(finding(accepted, "REQUIRED_EVIDENCE").observations))`
- `assert.equal(finding(accepted, "FINAL_CLAIM").status, "SATISFIED")`
- `assert.equal(finding(softRewrite, "AUTHORITATIVE_CONDITIONS").status, "NOT_EVALUATED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1792 — UNSPECIFIED is nonblocking while a HARD strength mismatch remains material

**KEEP_PROTECTED**

- default / UNSPECIFIED is nonblocking while a HARD strength mismatch remains material / 0.689 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(unspecified, "REQUIRED_EVIDENCE").status, "SATISFIED", "UNSPECIFIED does not demand fact evidence")`
- `assert.equal(finding(semanticReview, "AUTHORITATIVE_CONDITIONS").status, "NOT_EVALUATED", "UNSPECIFIED↔SOFT remains semantic review")`
- `assert.equal(finding(hardMismatch, "AUTHORITATIVE_CONDITIONS").status, "NOT_SATISFIED", "UNSPECIFIED→HARD is not a nonblocking rewrite")`

保护：INDEPENDENT_S0_EVALUATOR

### 1807 — criterion comparison preserves text-plus-polarity identities as a multiset

**KEEP_PROTECTED**

- default / criterion comparison preserves text-plus-polarity identities as a multiset / 0.519 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(identical, "AUTHORITATIVE_CONDITIONS").status, "SATISFIED", JSON.stringify(finding(identical, "AUTHORITATIVE_CONDITIONS")))`
- `assert.equal(finding(polarityChanged, "AUTHORITATIVE_CONDITIONS").status, "NOT_SATISFIED")`
- `assert.match(finding(polarityChanged, "AUTHORITATIVE_CONDITIONS").observations.join(" "), /criteria polarity=quiet/)`

保护：INDEPENDENT_S0_EVALUATOR

### 1835 — grounding follows the actual authoritative criterion while textual Gold differences remain independently unresolved

**KEEP_PROTECTED**

- default / grounding follows the actual authoritative criterion while textual Gold differences remain independently unresolved / 0.480 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "AUTHORITATIVE_CONDITIONS").status, "NOT_EVALUATED")`
- `assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "SATISFIED")`
- `assert.equal(finding(result, "FINAL_CLAIM").status, "NOT_EVALUATED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1858 — a later HARD criterion cannot reuse an old UNSPECIFIED observation

**KEEP_PROTECTED**

- default / a later HARD criterion cannot reuse an old UNSPECIFIED observation / 1.098 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(compiled.status, "COMPILED")`
- `assert.equal(finding(control, "AUTHORITATIVE_CONDITIONS").status, "SATISFIED")`
- `assert.equal(finding(control, "REQUIRED_EVIDENCE").status, "SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1916 — generic negative HARD criteria require a cited source judgment and preserve a conflict

**KEEP_PROTECTED**

- default / generic negative HARD criteria require a cited source judgment and preserve a conflict / 0.639 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "REQUIRED_EVIDENCE").status, "SATISFIED")`
- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED")`
- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "REQUIRED_EVIDENCE").status, "NOT_EVALUATED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1929 — fact-only evaluation rejects a derived opening claim contradicted by raw hours

**KEEP_PROTECTED**

- default / fact-only evaluation rejects a derived opening claim contradicted by raw hours / 0.313 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(artifact, source), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1943 — an offer inside a time window must be one of the cited availability slots

**KEEP_PROTECTED**

- default / an offer inside a time window must be one of the cited availability slots / 0.237 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "REQUIRED_EVIDENCE").status, "NOT_SATISFIED")`
- `assert.match(finding(result, "REQUIRED_EVIDENCE").observations.join("\n"), /offer time is not present/)`

保护：INDEPENDENT_S0_EVALUATOR

### 1954 — evidence observed after presentation is a conflict while a missing observation is not evaluated

**KEEP_PROTECTED**

- default / evidence observed after presentation is a conflict while a missing observation is not evaluated / 0.416 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(future, source), "REQUIRED_EVIDENCE").status, "NOT_SATISFIED")`
- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(missing, source), "REQUIRED_EVIDENCE").status, "NOT_EVALUATED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1963 — a missing final authoritative intentDraft is not evidence of a condition conflict

**KEEP_PROTECTED**

- default / a missing final authoritative intentDraft is not evidence of a condition conflict / 0.228 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "AUTHORITATIVE_CONDITIONS").status, "NOT_EVALUATED")`
- `assert.equal(finding(result, "FINAL_CLAIM").status, "NOT_EVALUATED")`
- `assert.match(finding(result, "AUTHORITATIVE_CONDITIONS").directCause, /lacks a required authority record/)`

保护：INDEPENDENT_S0_EVALUATOR

### 1972 — evaluation failure creates a separate immutable failure sidecar

**KEEP_PROTECTED**

- default / evaluation failure creates a separate immutable failure sidecar / 10.881 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(outcome.evaluationFailure, "EVAL_BAD")`
- `assert.ok(outcome.failurePath)`
- `assert.equal(JSON.parse(await readFile(outcome.failurePath!, "utf8")).status, "EVALUATION_FAILED")`

保护：INDEPENDENT_S0_EVALUATOR

### 1981 — a saved exception artifact remains intact when post-finish evaluation fails

**KEEP_PROTECTED**

- default / a saved exception artifact remains intact when post-finish evaluation fails / 1.967 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(outcome.evaluationFailure, "EVALUATION_FAILED")`
- `assert.equal(await readFile(journal.resultPath, "utf8"), before)`

保护：INDEPENDENT_S0_EVALUATOR

### 1991 — explicit alternative permission and equivalent area labels are independently checked

**KEEP_PROTECTED**

- default / explicit alternative permission and equivalent area labels are independently checked / 1.932 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(evaluateRestaurantHybridLiveArtifact(artifact,source).execution.taskProducedQualifiedResult,'YES')`
- `assert.equal(evaluateRestaurantHybridLiveArtifact(changed,source).execution.taskProducedQualifiedResult,'NO')`

保护：INDEPENDENT_S0_EVALUATOR

### 2016 — E2 checks actual reads separately from discovered unresolved and unread scope

**KEEP_PROTECTED**

- default / E2 checks actual reads separately from discovered unresolved and unread scope / 1.096 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.notEqual(finding(evaluateRestaurantHybridLiveArtifact(artifact,source),"COMPLETION_OUTCOME").status,"NOT_SATISFIED")`
- `assert.notEqual(finding(evaluateRestaurantHybridLiveArtifact(factsOnly,source),"COMPLETION_OUTCOME").status,"NOT_SATISFIED","production fact reading observation is an investigated record")`
- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(fabricated,source),"COMPLETION_OUTCOME").status,"NOT_SATISFIED","a declared read without executed reading remains false")`

保护：INDEPENDENT_S0_EVALUATOR

### 2046 — P2-0 evaluator audits structured system READ_ENDED as a bounded outcome

**KEEP_PROTECTED**

- default / P2-0 evaluator audits structured system READ_ENDED as a bounded outcome / 0.313 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result,"COMPLETION_OUTCOME").status,"SATISFIED")`
- `assert.equal(result.execution.taskProducedQualifiedResult,"NO")`

保护：INDEPENDENT_S0_EVALUATOR

### 2052 — `P2-0 structured ending rejects ${mode}`

**KEEP_PROTECTED**

- default / P2-0 structured ending rejects system-cause / 0.206 ms / pass
- default / P2-0 structured ending rejects forged-provider-cause / 0.171 ms / pass
- default / P2-0 structured ending rejects different-observation / 0.169 ms / pass
- default / P2-0 structured ending rejects missing-event / 0.166 ms / pass
- default / P2-0 structured ending rejects invented-investigation / 0.175 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(evaluateRestaurantHybridLiveArtifact(a,source),"COMPLETION_OUTCOME").status,"NOT_SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 2062 — frozen public GET review is checked independently including its query grammar

**KEEP_PROTECTED**

- default / frozen public GET review is checked independently including its query grammar / 0.192 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(audit().status,'ABSENT','explicit frozen public GET declaration must be honored')`
- `assert.equal(audit({resourceType:'xhr'}).status,'ABSENT','script read class is independent of the browser API')`
- `assert.equal(audit(patch).status,'PRESENT',JSON.stringify(patch))`

保护：INDEPENDENT_S0_EVALUATOR

### 2074 — S0 independently binds GET and POST preflight to frozen read review and still audits the actual body

**KEEP_PROTECTED**

- default / S0 independently binds GET and POST preflight to frozen read review and still audits the actual body / 0.519 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(audit().status, "ABSENT")`
- `assert.equal(audit({ resourceType: "xhr" }).status, "ABSENT", "Chromium also labels actual browser preflight XHR")`
- `assert.equal(auditReadOnlyTrace(decoded.record.diagnostics!.browserTrace!, [], false, reviewed).status, "ABSENT", "actual evaluator decoder must preserve handshake evidence")`

保护：INDEPENDENT_S0_EVALUATOR

### 2105 — independent price oracle reads raw menus, detects false MET, and does not mistake missing raw evidence for S0

**KEEP_PROTECTED**

- default / independent price oracle reads raw menus, detects false MET, and does not mistake missing raw evidence for S0 / 7.007 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(aloftPrices.some(item => item.low === 3300), false, "fresh source cannot stand in for the missing historical add-on capture")`
- `assert.equal(wrong.conditionStates[0]?.criteria.find(row => row.text === condition.value)?.status, "NOT_MET", "lunch3300 must not qualify a dinner budget")`
- `assert.equal(wrong.severity.S0_DECLARATION.status, "PRESENT")`

保护：INDEPENDENT_S0_EVALUATOR

### 2139 — current quick3 matches all eight recorded display rows by condition correspondence

**KEEP_PROTECTED**

- default / current quick3 matches all eight recorded display rows by condition correspondence / 84.895 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(finding(result, "AUTHORITATIVE_CONDITIONS").status, "SATISFIED")`
- `assert.ok(result.conditionStateComparisons.every(row => row.displayed !== "NOT_RECORDED"), \`${path}: existing display rows must not be reported missing\`)`

保护：INDEPENDENT_S0_EVALUATOR

### 2153 — criterion punctuation normalization cannot erase polarity or HARD-strength conflicts

**KEEP_PROTECTED**

- default / criterion punctuation normalization cannot erase polarity or HARD-strength conflicts / 1.239 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(evaluate(), "SATISFIED")`
- `assert.equal(evaluate(), "NOT_SATISFIED")`
- `assert.equal(evaluate(), "NOT_SATISFIED")`

保护：INDEPENDENT_S0_EVALUATOR

### 2167 — HARD32 retained merchant course title independently establishes omakase

**KEEP_PROTECTED**

- default / HARD32 retained merchant course title independently establishes omakase / 62.635 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.findings.find(f => f.dimension === "REQUIRED_EVIDENCE")?.status, "SATISFIED", "independent inventory and existing source lineage must be complete before testing HARD32")`
- `assert.equal(result.conditionStates.find(c => c.candidateId === candidateId)?.criteria[0]?.status, "MET", "original merchant course card, not normalized verifiedHardCriteria, supports omakase")`

保护：INDEPENDENT_S0_EVALUATOR

### 2184 — C18 Kaga external witness support is separate from product-known display evidence

**KEEP_PROTECTED**

- default / C18 Kaga external witness support is separate from product-known display evidence / 505.469 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(createHash("sha256").update(bytes).digest("hex"), row.derivedArtifactSha256)`
- `assert.notEqual(marker, -1, "post-delivery input must identify a repository artifact")`
- `assert.equal(comparison.independent, "MET", "reviewed external truth remains supported")`

保护：INDEPENDENT_S0_EVALUATOR

### 2219 — current independent frozen review accepts the seven-key facet GET handshake and rejects unrelated permission

**KEEP_PROTECTED**

- default / current independent frozen review accepts the seven-key facet GET handshake and rejects unrelated permission / 1.029 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(audit().status,'ABSENT')`
- `assert.equal(audit({method:'GET',resourceType:'fetch'}).status,'ABSENT')`
- `assert.equal(audit(patch).status,'PRESENT',JSON.stringify(patch))`

保护：INDEPENDENT_S0_EVALUATOR

## src/eval/restaurant/agent-loop/discovery-probe.test.ts

发现探针的身份、见证漏斗与半径彼此独立，且不得被产品 import；保留污染和权限边界。

### 11 — P21 Google website exact source identity counts by discovery source; names never establish identity

**KEEP_DISTINCT_CONTRACT**

- default / P21 Google website exact source identity counts by discovery source; names never establish identity / 1.437 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(metrics.witnessInListingBySource['google-places'],true)`
- `assert.equal(metrics.witnessInListingBySource.tabelog,false)`
- `assert.equal(metrics.witnessInListing,true)`

### 27 — P21 production cannot import witness/probe evaluation modules through any import form

**KEEP_DISTINCT_CONTRACT**

- default / P21 production cannot import witness/probe evaluation modules through any import form / 0.401 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.match(evaluatorImportViolation(owner,"eval/restaurant/agent-loop/discovery-probe.ts",statement)!,/production.*eval/i)`
- `assert.match(evaluatorImportViolation("application/read.ts","../../../.eval-artifacts/batch/witnesses.json",'import input from "x"')!,/production.*eval/i)`
- `assert.equal(evaluatorImportViolation("server/local-web-server.ts","eval/restaurant/agent-loop/web-read-artifact.ts",'import { artifact } from "x"'),undefined)`

### 36 — P21 listing witness, first-batch witness and radius are independent observations

**KEEP_DISTINCT_CONTRACT**

- default / P21 listing witness, first-batch witness and radius are independent observations / 0.246 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(otherSource.witnessInListing,false,"same opaque ID on another source is not witness identity")`
- `assert.equal(failed.witnessInListing,true,"later budget failure must not erase an already bound listing observation")`
- `assert.equal(failed.inRadiusParsedIsLowerBound,true)`

### 54 — P21 probe preflight forwards provider environment and keeps the journal in the probe directory

**KEEP_DISTINCT_CONTRACT**

- default / P21 probe preflight forwards provider environment and keeps the journal in the probe directory / 98.645 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(runDiscoveryProbePreflight({environment:{DEEPSEEK_API_KEY:'fixture-offline-key'},network:{proxyMode:'DISABLED_BY_CLI'},artifactDirectory:temp},{fetchImplementation:async(_url,init)=>{ requests++;assert.equal(requests>1||new Headers(init?.headers).get('authorization')==='Bearer fixture-offline-key',true,'provider environment reaches the real preflight transport'); if(requests===4)throw Error('OFFLINE_STOP_BEFORE_BROWSER');return new Response('{}',{status:200}); }}))`
- `assert.deepEqual(saved.attempts.map((a:{target:string;outcome:string})=>[a.target,a.outcome]),[['DEEPSEEK','REACHABLE'],['GOOGLE','REACHABLE'],['TABELOG','REACHABLE'],['TABLECHECK','FAILED']])`
- `assert.equal(saved.generationModelCalls,0)`

## src/eval/restaurant/agent-loop/dom-change-classification.test.ts

PASS/诚实退化/矛盾/无效变异是 G2 的独立结果合同，不能让被测观察器给自身判分。

### 5 — G2 classification retains honest unknown and catches contradictory/new claims independently

**KEEP_DISTINCT_CONTRACT**

- default / G2 classification retains honest unknown and catches contradictory/new claims independently / 0.351 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(classifyDomChange({ day: "FULL", slot: null }, { day: "FULL", slot: null }, true).verdict, "PASS")`
- `assert.equal(classifyDomChange({ day: "FULL", slot: null }, { day: null, slot: null }, true).verdict, "DEGRADED_HONEST")`
- `assert.equal(classifyDomChange({ day: "FULL" }, { day: "SELECTABLE" }, true).verdict, "FAIL")`

## src/eval/restaurant/agent-loop/eval-recording-repair.test.ts

Gold 原义、逐页遗漏隔离和 UTF-8 字节上限是不同输入缺陷；历史430KB/743KB页面红灯不能由更小合成页替代。

### 11 — Gold fidelity allows additional UNSPECIFIED context and retains original requirements

**KEEP_DISTINCT_CONTRACT**

- default / Gold fidelity allows additional UNSPECIFIED context and retains original requirements / 16.796 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(assess([actualGold, extra]), "SATISFIED")`
- `assert.equal(assess([actualGold, { ...extra, strength }]), "NOT_SATISFIED", strength)`
- `assert.equal(assess([extra]), "NOT_SATISFIED", "extra context cannot replace missing Gold")`

### 25 — page qualification isolates omitted DOM and missing dependencies

**KEEP_DISTINCT_CONTRACT**

- default / page qualification isolates omitted DOM and missing dependencies / 39.889 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.replay.status, "PARTIALLY_REPLAYABLE")`
- `assert.deepEqual(manifest.pages.map((row: any) => [row.snapshot, row.status, row.reason]), [[1, "REPLAYABLE", "SANITIZED_NETWORK_AND_DOM_CAPTURE"], [2, "NOT_REPLAYABLE", "UNSAFE_DOCUMENT"], [3, "NOT_REPLAYABLE", "UNCAPTURED_DYNAMIC_RESPONSE"], [4, "REPLAYABLE", "SANITIZED_NETWORK_AND_DOM_CAPTURE"], [5, "NOT_REPLAYABLE", "CHALLENGE_DOCUMENT"]])`
- `assert.deepEqual(har.log.entries.map((row: any) => row.request.url), ["https://public.example/good", "https://public.example/another"])`

### 44 — page cap admits observed 430KB and 743KB documents and checks UTF-8 byte size

**KEEP_DISTINCT_CONTRACT**

- default / page cap admits observed 430KB and 743KB documents and checks UTF-8 byte size / 85.817 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.replay.status, "PARTIALLY_REPLAYABLE")`
- `assert.deepEqual(manifest.pages.map((row: any) => row.reason), ["SANITIZED_NETWORK_AND_DOM_CAPTURE", "SANITIZED_NETWORK_AND_DOM_CAPTURE", "DOCUMENT_SIZE_LIMIT"])`

## src/eval/restaurant/agent-loop/evaluation-location-selection.test.ts

冻结坐标仅用于 NEAR_USER，命名地点不被评测侧坐标覆盖；三种 relation 对照有权威输入意义。

### 6 — a frozen evaluation coordinate is selected only for NEAR_USER, never a named area

**KEEP_DISTINCT_CONTRACT**

- default / a frozen evaluation coordinate is selected only for NEAR_USER, never a named area / 0.301 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(requiresEvaluationLocation({ semantic: { location: { value: "Shibuya", relation: "NEAR" } } }), false)`
- `assert.equal(requiresEvaluationLocation({ semantic: { location: { value: "nearby", relation: "NEAR_USER" } } }), true)`
- `assert.equal(requiresEvaluationLocation({ semantic: { location: { value: "nearby" } } }), false)`

## src/eval/restaurant/agent-loop/fact-qa-scoring.test.ts

同字错店、候选答案混入 Gold、未确认措辞、冲突双方及敏感保证属于独立错误声明评分；全保护。

### 14 — G1 scorer rejects the same words cited from another outlet page/read

**KEEP_PROTECTED**

- default / G1 scorer rejects the same words cited from another outlet page/read / 0.559 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(scoreQaAnswer(reference, read, answer).status, "FAIL")`
- `assert.equal(scoreQaAnswer(reference, read, current).status, "PASS")`
- `assert.equal(scoreQaAnswer(reference, read, { ...current, citations: [{ ...current.citations[0]!, ...patch }] }).status, "FAIL")`

保护：INDEPENDENT_FALSE_CLAIM_SCORING

### 25 — G1 refuses candidate Gold and leaves unseen paraphrase consistency unknown

**KEEP_PROTECTED**

- default / G1 refuses candidate Gold and leaves unseen paraphrase consistency unknown / 0.068 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(unreviewed.status, "NOT_READY")`
- `assert.equal(paraphrase.status, "NOT_EVALUATED")`
- `assert.equal(unreviewed.falseClaimCount, null)`

保护：INDEPENDENT_FALSE_CLAIM_SCORING

### 33 — G1 distinguishes honest absence, unsupported claims, bilingual conflict and sensitive confirmation

**KEEP_PROTECTED**

- default / G1 distinguishes honest absence, unsupported claims, bilingual conflict and sensitive confirmation / 0.199 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(scoreQaAnswer(absent, read, { kind: "NOT_STATED", sensitiveCategory: "NONE", confirmationRequired: false, text: "页面未说明。", citations: [] }).status, "PASS")`
- `assert.equal(scoreQaAnswer({ ...reference, kind: "CONFLICT" }, read, current).status, "FAIL")`
- `assert.equal(scoreQaAnswer(reference, read, { ...current, citations: [] }).status, "FAIL")`

保护：INDEPENDENT_FALSE_CLAIM_SCORING

### 48 — G1 evaluator cannot turn candidate answers into a scored acceptance set

**KEEP_PROTECTED**

- default / G1 evaluator cannot turn candidate answers into a scored acceptance set / 15.075 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "NOT_READY")`
- `assert.equal(result.falseClaimCount, null)`

保护：INDEPENDENT_FALSE_CLAIM_SCORING

### 60 — G1 maps an outlet/run mismatch reference to UNVERIFIED without quoting the rejected page

**KEEP_PROTECTED**

- default / G1 maps an outlet/run mismatch reference to UNVERIFIED without quoting the rejected page / 0.624 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "PASS")`
- `assert.equal(scoreQaAnswer(mismatch, read, { kind: "UNVERIFIED", sensitiveCategory: "NONE", confirmationRequired: false, text: "", citations: [] }).status, "PASS")`
- `assert.equal(scoreQaAnswer(reference, { ...read, runId: "previous-run" }, { kind: "ANSWERED", sensitiveCategory: "NONE", confirmationRequired: false, text: reference.approvedAnswers[0]!, citations: [{ pageId: read.pageId, pageSha256: read.pageSha256, readId: read.readId, quote: read.text }] }).falseClaimCount, 1)`

保护：INDEPENDENT_FALSE_CLAIM_SCORING

### 73 — G1 maps bilingual conflict to ANSWERED with both originals and restaurant confirmation

**KEEP_PROTECTED**

- default / G1 maps bilingual conflict to ANSWERED with both originals and restaurant confirmation / 0.218 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "PASS")`
- `assert.equal(scoreQaAnswer(conflict, { ...read, text: read.text + " " + quoteB }, { kind: "ANSWERED", sensitiveCategory: "NONE", confirmationRequired: false, text, citations: citations.slice(0, 1) }).status, "FAIL")`
- `assert.equal(scoreQaAnswer(conflict, { ...read, text: read.text + " " + quoteB }, { kind: "ANSWERED", sensitiveCategory: "NONE", confirmationRequired: false, text: "Please confirm with the restaurant.", citations }).status, "FAIL")`

保护：INDEPENDENT_FALSE_CLAIM_SCORING

### 90 — "G1 reviewed sensitive absence accepts both outcomes: " + topic.id

**KEEP_PROTECTED**

- default / G1 reviewed sensitive absence accepts both outcomes: allergy / 0.269 ms / pass
- default / G1 reviewed sensitive absence accepts both outcomes: diet / 0.137 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(scoreQaAnswer(ref, source, absent).status, "PASS")`
- `assert.equal(scoreQaAnswer(ref, source, related).status, "PASS")`
- `assert.equal(scoreQaAnswer(ref, source, { ...valid, confirmationRequired: false } as QaResponse).status, "FAIL")`

保护：INDEPENDENT_FALSE_CLAIM_SCORING

## src/eval/restaurant/agent-loop/fixed-source-acceptance.test.ts

Acceptance 消费独立评价与终态证据，默认3家不是用户硬要求；未知、取消、输入暂停与真实无结果不能互换。

### 37 — qualified result requires its own terminal record and independent support

**KEEP_DISTINCT_CONTRACT**

- default / qualified result requires its own terminal record and independent support / 0.609 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(wrong.acceptance, "FAIL")`
- `assert.equal(normal.acceptance, "PASS")`

### 49 — a default open-ended target is reported but does not turn a qualified short batch into failure

**KEEP_DISTINCT_CONTRACT**

- default / a default open-ended target is reported but does not turn a qualified short batch into failure / 0.331 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(fullBatch, { acceptance: "PASS", userGoalCompletion: "COMPLETE", reasons: [], defaultBatchTarget: { target: 3, actual: 3, met: true }, exitCode: 0, })`
- `assert.deepEqual(sourceLimitedShortBatch, { acceptance: "PASS", userGoalCompletion: "COMPLETE", reasons: [], defaultBatchTarget: { target: 3, actual: 2, met: false }, exitCode: 0, })`

### 73 — an explicit requested result count remains a completion requirement

**KEEP_DISTINCT_CONTRACT**

- default / an explicit requested result count remains a completion requirement / 0.126 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.match(insufficient.reasons.join("\n"), /3 distinct/)`
- `assert.equal(insufficient.acceptance, "FAIL")`
- `assert.equal(fulfilled.acceptance, "PASS")`

### 109 — an authoritative requested result count cannot be silently treated as a default batch

**KEEP_DISTINCT_CONTRACT**

- default / an authoritative requested result count cannot be silently treated as a default batch / 0.093 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.match(missingRegistration.reasons.join("\n"), /no USER_EXPLICIT result-count expectation/)`
- `assert.match(mismatchedRegistration.reasons.join("\n"), /disagrees with authoritative State/)`
- `assert.equal(missingRegistration.acceptance, "FAIL")`

### 136 — a qualified result cannot pass with an empty presentation

**KEEP_DISTINCT_CONTRACT**

- default / a qualified result cannot pass with an empty presentation / 0.068 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.match(empty.reasons.join("\n"), /one or more distinct/)`
- `assert.equal(empty.acceptance, "FAIL")`

### 147 — verified no-result passes only with matching no-result evidence

**KEEP_DISTINCT_CONTRACT**

- default / verified no-result passes only with matching no-result evidence / 0.062 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(wrongReason.acceptance, "FAIL")`
- `assert.equal(normal.acceptance, "PASS")`
- `assert.equal(normal.userGoalCompletion, "NOT_COMPLETE")`

### 155 — input pause, cancellation, and budget stops are distinct accepted behaviors

**KEEP_DISTINCT_CONTRACT**

- default / input pause, cancellation, and budget stops are distinct accepted behaviors / 0.075 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(wrongBudgetReason.acceptance, "FAIL")`
- `assert.equal(input.acceptance, "PASS")`
- `assert.equal(cancelledOk.acceptance, "PASS")`

### 168 — coverage gaps and unassessed evaluator dimensions are nonzero outcomes

**KEEP_DISTINCT_CONTRACT**

- default / coverage gaps and unassessed evaluator dimensions are nonzero outcomes / 2.261 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(blocked.exitCode, 1)`
- `assert.equal(blocked.acceptance, "BLOCKED")`
- `assert.equal(unassessed.acceptance, "FAIL")`

### 189 — source-required acceptance treats failed navigation as an attempt and keeps normal empty on its applicable dimensions

**KEEP_DISTINCT_CONTRACT**

- default / source-required acceptance treats failed navigation as an attempt and keeps normal empty on its applicable dimensions / 0.931 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.match(forbiddenAttempt.reasons.join("\n"), /Forbidden source TABLECHECK was attempted/)`
- `assert.match(unobservedRequired.reasons.join("\n"), /attempted but not successfully observed/)`
- `assert.equal(resourceViolation.acceptance, "FAIL")`

### 256 — native source usage reads attempted navigation and observed snapshot URLs independently

**KEEP_DISTINCT_CONTRACT**

- default / native source usage reads attempted navigation and observed snapshot URLs independently / 0.181 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(fixedNativeSourceUsage([], [ { kind: "SESSION_CALL", detail: { method: "navigate", args: ["https://www.tablecheck.com/en/japan/search"] } }, { kind: "SESSION_CALL", detail: { method: "openLink", args: ["native:control:1", "https://tabelog.com/tokyo/A1304/A130401/100/"] } }, { kind: "SNAPSHOT", detail: { url: "https://tabelog.com/tokyo/A1304/A130401/100/?private=value" } }, ]), { TABELOG: { attempted: true, observed: true }, TABLECHECK: { attempted: true, observed: false }, })`

## src/eval/restaurant/agent-loop/fixed-source-case-execution.test.ts

冻结业务时钟不应冻结真实外层截止；正常提前完成、外部取消和模型余额结束为不同归因。

### 85 — a frozen business clock cannot freeze the real outer deadline or admit a late model result

**KEEP_DISTINCT_CONTRACT**

- default / a frozen business clock cannot freeze the real outer deadline or admit a late model result / 48.863 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.execution.status, "FAILED")`
- `assert.equal(result.execution.failureCode, RUN_DEADLINE_EXCEEDED)`
- `assert.equal(calls, 1, "the deadline must stop later model/agent work from starting")`

### 107 — a result that completes before the deadline retains its normal terminal outcome

**KEEP_DISTINCT_CONTRACT**

- default / a result that completes before the deadline retains its normal terminal outcome / 71.103 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(payload.context?.readBudget?.remainingMs, 400_000, "fixed-source Runner inherits semantic time rather than restarting its read clock")`
- `assert.deepEqual(result.execution, { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "PRESENT_RESULTS" })`

### 134 — controlled cancellation stays distinct from an honest model-budget completion

**KEEP_DISTINCT_CONTRACT**

- default / controlled cancellation stays distinct from an honest model-budget completion / 35.015 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(cancelled.execution, { status: "CANCELLED", phase: "UNDERSTANDING", failureCode: "CANCELLED" })`
- `assert.equal(cancelled.sourceCalls.search, 0, "cancellation must prevent new source reads after the controlled stop")`
- `assert.deepEqual(cancelledAcceptance, { acceptance: "PASS", userGoalCompletion: "NOT_COMPLETE", reasons: [], exitCode: 0 })`

## src/eval/restaurant/agent-loop/google-places-recording.test.ts

保留 Google 原始安全响应、失败尝试及迟到拒写，Secret 只在传输头；模型/浏览器 Recorder 测试没有这一传输入口。

### 11 — Google raw bytes survive capture without key headers/query, even with no replayable DOM

**KEEP_DISTINCT_CONTRACT**

- default / Google raw bytes survive capture without key headers/query, even with no replayable DOM / 76.503 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(calls,1)`
- `assert.equal(result.replay.status,"NOT_REPLAYABLE")`
- `assert.equal(entry.request.url,"https://places.googleapis.com/v1/places:searchText?languageCode=en")`

### 33 — Runner Google factory keeps fixture transport and validates proxy configuration

**KEEP_DISTINCT_CONTRACT**

- default / Runner Google factory keeps fixture transport and validates proxy configuration / 10.311 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(calls,2)`
- `assert.equal(reverse.request.url,"https://geocode.googleapis.com/v4/geocode/location?location.latitude=35&location.longitude=139")`
- `assert.throws(()=>createEvalGooglePlacesClient({apiKey:"synthetic",proxyServer:"ftp://localhost"},source=>capture.wrap(source)),(e:any)=>e.code==="GOOGLE_CONFIGURATION_ERROR")`

### 43 — strict key scans isolate foreign entries before/after writing and reject owned credentials globally

**KEEP_DISTINCT_CONTRACT**

- default / strict key scans isolate foreign entries before/after writing and reject owned credentials globally / 34.536 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(errors[0].reason,"KEY_PATTERN_RESPONSE")`
- `assert.ok(!JSON.stringify(errors).includes(key),'diagnostics must never echo rejected credentials')`
- `assert.equal(await (await transport("https://places.googleapis.com/v1/places:searchText",{method:"POST",body:'{"textQuery":"fixture"}'})).text(),raw)`

### 67 — late Google responses cannot append after recorder finalization

**KEEP_DISTINCT_CONTRACT**

- default / late Google responses cannot append after recorder finalization / 1.294 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(capture.entries.length,0)`
- `assert.deepEqual(errors,[])`

## src/eval/restaurant/agent-loop/hybrid-read-composition.test.ts

真实 Coordinator/Runtime/Router 的跨来源交接是主链覆盖；不同顺序若影响预算/刷新/服务范围不能当随机排列删除，历史 H005/H003 失败控制保护。

### 313 — independent source boundary controls cover zero, one, and exactly one fact-read batch (packs=Google; maxAgentSteps=12, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / independent source boundary controls cover zero, one, and exactly one fact-read batch (packs=Google; maxAgentSteps=12, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000) / 77.235 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(sequenceFailure(result), undefined, JSON.stringify({ sequence, actions: result.model.actionSequence, details: result.detailIds, loop: result.loop, phase: result.state.phase }))`

### 321 — JSON.stringify(sequence)

**KEEP_DISTINCT_CONTRACT**

- default / {"candidateCount":0,"batchSize":3,"reverse":false} / 37.308 ms / pass
- default / {"candidateCount":1,"batchSize":3,"reverse":false} / 27.266 ms / pass
- default / {"candidateCount":3,"batchSize":3,"reverse":false} / 11.737 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(sequenceFailure(result), undefined, JSON.stringify({ sequence, actions: result.model.actionSequence, details: result.detailIds, loop: result.loop, phase: result.state.phase }))`

### 327 — a user refresh after the clock advances replaces the current fact observation without losing request fidelity (packs=Google; maxAgentSteps=8, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / a user refresh after the clock advances replaces the current fact observation without losing request fidelity (packs=Google; maxAgentSteps=8, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000) / 4.919 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal((await composition.coordinator.run(taskId)).status, "TERMINAL")`
- `assert.equal((await composition.coordinator.run(taskId)).status, "TERMINAL")`
- `assert.equal(refreshed.phase, "PRESENT_RESULTS")`

### 369 — cancelling during a real in-flight fact read cannot become a normal no-result (packs=Google; maxAgentSteps=8, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / cancelling during a real in-flight fact read cannot become a normal no-result (packs=Google; maxAgentSteps=8, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000) / 1.776 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "CANCELLED")`
- `assert.equal(state.phase, "FAILED")`
- `assert.equal(state.failure?.code, "AGENT_LOOP_CANCELLED")`

### 413 — a request update after cancelling an in-flight read starts a new authoritative investigation (packs=Google; maxAgentSteps=8, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / a request update after cancelling an in-flight read starts a new authoritative investigation (packs=Google; maxAgentSteps=8, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000) / 19.982 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal((await oldRun).status, "CANCELLED")`
- `assert.equal(cancelled.domainState.phase, "FAILED")`
- `assert.deepEqual(revisedBeforeRead.candidates, [])`

### 484 — fixed-seed bounded exploration records and shrinks an independent Hybrid contract failure (packs=Google; maxAgentSteps=12, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / fixed-seed bounded exploration records and shrinks an independent Hybrid contract failure (packs=Google; maxAgentSteps=12, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000) / 262.962 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.fail(JSON.stringify({ contract: "state accumulation / independent read order", seed: \`0x${seed.toString(16)}\`, actualSequence, firstFailure: first, minimizedFailure: minimized ?? first, }, null, 2))`

### 532 — Hybrid production composition binds an explicit evaluation location before Agent investigation and independently evaluates its actual result (packs=Google; maxAgentSteps=8, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=1000)

**KEEP_DISTINCT_CONTRACT**

- default / Hybrid production composition binds an explicit evaluation location before Agent investigation and independently evaluates its actual result (packs=Google; maxAgentSteps=8, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=1000) / 13.765 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(semantic.status, "PROPOSED")`
- `assert.equal(loop.status, "TERMINAL")`
- `assert.equal(snapshot.domainState.phase, "PRESENT_RESULTS")`

### 594 — ADR-0044 recommendation reaches actual presentation without party or slot evidence and retains its semantic goal

**KEEP_DISTINCT_CONTRACT**

- default / ADR-0044 recommendation reaches actual presentation without party or slot evidence and retains its semantic goal / 140.217 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(interpreted.status, "PROPOSED")`
- `assert.equal(loop.status, "TERMINAL")`
- `assert.equal(state.phase, "PRESENT_RESULTS")`

### 633 — a Google network failure before candidate discovery stops the Agent after one failed search (packs=Google; maxAgentSteps=8, maxRejectedActions=3, maxAutomaticBrowserMs=500000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / a Google network failure before candidate discovery stops the Agent after one failed search (packs=Google; maxAgentSteps=8, maxRejectedActions=3, maxAutomaticBrowserMs=500000, maxStructuredReadMs=8000) / 5.849 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(loop.status, "TERMINAL")`
- `assert.equal(snapshot.domainState.phase, "NO_VERIFIED_RESULT")`
- `assert.equal(snapshot.domainState.candidates.length, 0)`

### 665 — Hybrid production composition asks for location without an evaluation context and never calls a source (packs=Google; maxAgentSteps=3, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / Hybrid production composition asks for location without an evaluation context and never calls a source (packs=Google; maxAgentSteps=3, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000) / 0.617 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(loop.status, "WAITING_USER")`
- `assert.equal(snapshot.domainState.phase, "NEEDS_INPUT")`
- `assert.equal(snapshot.domainState.intentDraft?.area?.coordinates, undefined)`

### 688 — real source observations distinguish a supported candidate from an explicit type conflict (packs=Google; maxAgentSteps=5, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / real source observations distinguish a supported candidate from an explicit type conflict (packs=Google; maxAgentSteps=5, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000) / 86.547 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(loop.status, "TERMINAL")`
- `assert.equal(state.factChecks?.[cafeId]?.status, "COMPLETED")`
- `assert.equal(state.factChecks?.[hotPotId]?.status, "COMPLETED")`

### 737 — a real Hybrid category UNKNOWN reaches presentation without verified-negative promotion (packs=Google; maxAgentSteps=5, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / a real Hybrid category UNKNOWN reaches presentation without verified-negative promotion (packs=Google; maxAgentSteps=5, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000) / 6.189 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal((await composition.coordinator.run(taskId)).status, "TERMINAL")`
- `assert.equal(state.phase, "PRESENT_RESULTS")`
- `assert.ok(state.readEvidence.some((item) => item.provider === "MODEL_JUDGMENT" && Array.isArray(item.claims.categoryUnknownNegativeCriteria)))`

### 770 — a second user message adds an exclusion through real source facts and removes the conflicting candidate (packs=Google; maxAgentSteps=5, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / a second user message adds an exclusion through real source facts and removes the conflicting candidate (packs=Google; maxAgentSteps=5, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000) / 13.537 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal((await composition.coordinator.run(taskId)).status, "TERMINAL")`
- `assert.equal(firstState.phase, "PRESENT_RESULTS")`
- `assert.equal((await composition.coordinator.run(taskId)).status, "TERMINAL")`

### 774 — control.outletName

**KEEP_DISTINCT_CONTRACT**

- default / Ramen Restaurant / 4.799 ms / pass
- default / Conveyor-belt Sushi Restaurant / 8.530 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal((await composition.coordinator.run(taskId)).status, "TERMINAL")`
- `assert.equal(firstState.phase, "PRESENT_RESULTS")`
- `assert.equal((await composition.coordinator.run(taskId)).status, "TERMINAL")`

### 821 — independent candidate reads preserve coverage and results across batch partitions and order (packs=Google; maxAgentSteps=10, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / independent candidate reads preserve coverage and results across batch partitions and order (packs=Google; maxAgentSteps=10, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000) / 77.551 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(semantic.status, "PROPOSED")`
- `assert.equal(new Set(details).size, details.length, \`Same-scope reads repeated: ${details.join(", ")}; loop=${loop.status}\`)`
- `assert.equal(loop.status, "TERMINAL")`

### 827 — `batch=${batchSize}, reverse=${reverse}`

**KEEP_DISTINCT_CONTRACT**

- default / batch=3, reverse=false / 30.745 ms / pass
- default / batch=1, reverse=false / 8.591 ms / pass
- default / batch=3, reverse=true / 37.941 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(semantic.status, "PROPOSED")`
- `assert.equal(new Set(details).size, details.length, \`Same-scope reads repeated: ${details.join(", ")}; loop=${loop.status}\`)`
- `assert.equal(loop.status, "TERMINAL")`

### 862 — Google fact exhaustion must leave a separately executable browser investigation reachable (packs=Google; maxAgentSteps=7, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / Google fact exhaustion must leave a separately executable browser investigation reachable (packs=Google; maxAgentSteps=7, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000) / 41.554 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(state.sourceReadState?.googlePlacesSearchBudget, "EXHAUSTED")`
- `assert.ok(visited.some(url => new URL(url).hostname.endsWith("tablecheck.com")), \`Browser source never received a request; loop=${loop.status}, failure=${state.failure?.code}\`)`
- `assert.ok(Object.values(state.availabilityChecks).every(check => check.status === "UNKNOWN"))`

### 863 — `Google limit=${maxRequests}`

**KEEP_DISTINCT_CONTRACT**

- default / Google limit=100 / 35.475 ms / pass
- default / Google limit=1 / 5.845 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(state.sourceReadState?.googlePlacesSearchBudget, "EXHAUSTED")`
- `assert.ok(visited.some(url => new URL(url).hostname.endsWith("tablecheck.com")), \`Browser source never received a request; loop=${loop.status}, failure=${state.failure?.code}\`)`
- `assert.ok(Object.values(state.availabilityChecks).every(check => check.status === "UNKNOWN"))`

### 903 — source text handoff reaches request-bound availability and presentation through the production composition (packs=Google; maxAgentSteps=6, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / source text handoff reaches request-bound availability and presentation through the production composition (packs=Google; maxAgentSteps=6, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000) / 46.388 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(document, "actual website reader must supply the source sentence to the judgment")`
- `assert.equal(state.phase, "PRESENT_RESULTS", JSON.stringify({ actions, failure: state.failure, factChecks: state.factChecks, availability: state.availabilityChecks }))`
- `assert.equal(raw.sourceUrl, place.websiteUri)`

### 1006 — a website observation for another candidate cannot revive an unknown Google fact (packs=Google; maxAgentSteps=5, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / a website observation for another candidate cannot revive an unknown Google fact (packs=Google; maxAgentSteps=5, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000) / 54.266 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(state.factChecks?.[aId]?.status, "UNKNOWN", "Fixture must reach A's real failed Details read")`
- `assert.ok(state.readEvidence.some(e => e.candidateId === bId && e.provider === "RESTAURANT_WEBSITE" && e.kind === "RESTAURANT_FACT"), "Fixture must reach the real website evidence producer")`
- `assert.ok(browserDiagnostics.some(item => item.source === "WEBSITE" && item.event === "OPERATION_STARTED"), "the real website executor must expose runtime cost to the shared diagnostic sink")`

### 1066 — a failed compound refresh invalidates prior facts and independent evaluation rejects their reuse (packs=Google; maxAgentSteps=5, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / a failed compound refresh invalidates prior facts and independent evaluation rejects their reuse (packs=Google; maxAgentSteps=5, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000) / 62.282 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(initial.domainState.phase, "PRESENT_RESULTS", "positive control reaches genuine source-backed presentation")`
- `assert.equal(websiteAttempts, failure === "WEBSITE" ? 2 : 1, "source boundary reached the intended failure")`
- `assert.ok(oldWebsiteIds.every(id => state.readEvidence.some(evidence => evidence.evidenceId === id)), "raw historical evidence remains immutable")`

### 1067 — failure

**KEEP_DISTINCT_CONTRACT**

- default / WEBSITE / 44.845 ms / pass
- default / GOOGLE / 16.953 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(initial.domainState.phase, "PRESENT_RESULTS", "positive control reaches genuine source-backed presentation")`
- `assert.equal(websiteAttempts, failure === "WEBSITE" ? 2 : 1, "source boundary reached the intended failure")`
- `assert.ok(oldWebsiteIds.every(id => state.readEvidence.some(evidence => evidence.evidenceId === id)), "raw historical evidence remains immutable")`

### 1122 — a closed-hours refresh removes historical support from the Agent context (packs=Google; maxAgentSteps=5, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / a closed-hours refresh removes historical support from the Agent context (packs=Google; maxAgentSteps=5, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000) / 3.768 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(initial.domainState.phase, "PRESENT_RESULTS")`
- `assert.ok(currentHours.includes(false), "source really produced closed-hours evidence")`
- `assert.equal(context.candidates[0]?.observedFacts.openingHoursMatch, false, "Context must not summarize superseded opening hours as true")`

### 1297 — Hybrid production composition uses the observed-option browser wire before accepting source evidence (packs=Google; maxAgentSteps=8, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / Hybrid production composition uses the observed-option browser wire before accepting source evidence (packs=Google; maxAgentSteps=8, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000) / 37.824 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok((result.observedOptionActions ?? 0) > 0, JSON.stringify({ checks: state.availabilityChecks, browser: result.partial.diagnostics?.browserExecution?.filter(item => ["MODEL_DECISION_STARTED", "METHOD_INCOMPLETE", "REJECTED"].includes(item.event)).map(item => ({ source: item.source, stage: item.stage, detail: item.detail })) }))`
- `assert.equal(state.phase, "PRESENT_RESULTS", JSON.stringify({ browser: result.partial.diagnostics?.browserExecution, checks: state.availabilityChecks, evidence: state.readEvidence.map(evidence => ({ kind: evidence.kind, candidateId: evidence.candidateId, claims: evidence.claims })) }))`
- `assert.ok(accepted.every(candidateId => state.availabilityChecks[candidateId]?.status === "AVAILABLE"))`

### 1311 — Hybrid source failures in A/B/C leave D reachable and outside candidates out of every Agent pool (packs=Google; maxAgentSteps=8, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / Hybrid source failures in A/B/C leave D reachable and outside candidates out of every Agent pool (packs=Google; maxAgentSteps=8, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000) / 19.109 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.loop?.status, "TERMINAL", \`local failure batch must not terminate viable candidate work: ${JSON.stringify(state.failure)}\`)`
- `assert.equal(state.phase, "PRESENT_RESULTS")`
- `assert.deepEqual(state.candidates.map(item => item.restaurant.outletName), ["Fixture a", "Fixture b", "Fixture c", "Fixture d"])`

### 1331 — Hybrid shared model budget ends honestly while browser launch outage remains a system failure (packs=Google; maxAgentSteps=8, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / Hybrid shared model budget ends honestly while browser launch outage remains a system failure (packs=Google; maxAgentSteps=8, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000) / 101.190 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.loop?.status, mode === "runtime-outage" ? "EXECUTION_FAILURE" : "TERMINAL")`
- `assert.equal(result.partial.finalSnapshot?.domainState.phase, mode === "runtime-outage" ? "FAILED" : "NO_VERIFIED_RESULT")`
- `assert.ok(result.partial.finalSnapshot?.domainState.noVerifiedResult?.remainingGaps.some(gap => gap.includes("MODEL_CALL_BUDGET_EXHAUSTED")))`

### 1332 — mode

**KEEP_DISTINCT_CONTRACT**

- default / model-budget / 86.933 ms / pass
- default / agent-budget / 5.133 ms / pass
- default / runtime-outage / 8.785 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.loop?.status, mode === "runtime-outage" ? "EXECUTION_FAILURE" : "TERMINAL")`
- `assert.equal(result.partial.finalSnapshot?.domainState.phase, mode === "runtime-outage" ? "FAILED" : "NO_VERIFIED_RESULT")`
- `assert.ok(result.partial.finalSnapshot?.domainState.noVerifiedResult?.remainingGaps.some(gap => gap.includes("MODEL_CALL_BUDGET_EXHAUSTED")))`

### 1345 — Hybrid deadline captures immutable partial browser, Google and search evidence through the CLI artifact builder (packs=Google; maxAgentSteps=8, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / Hybrid deadline captures immutable partial browser, Google and search evidence through the CLI artifact builder (packs=Google; maxAgentSteps=8, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000) / 23.688 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.partial.resourceUsage.discoveryCandidates, 4)`
- `assert.ok(result.partial.resourceUsage.googleRequests!.total > 0)`
- `assert.equal(result.partial.resourceUsage.modelCallsStarted, result.startedModelCalls, "started calls remain in a partial artifact before provider records settle")`

### 1372 — Hybrid capture counts a sent Google request cancelled before any discovery trajectory (packs=Google; maxAgentSteps=8, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / Hybrid capture counts a sent Google request cancelled before any discovery trajectory (packs=Google; maxAgentSteps=8, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000) / 1.159 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.partial.resourceUsage.googleRequests, { limit: result.composition.runCeilings.maxGoogleRequests, total: 1, namedPlaceResolution: 0, discovery: 1, placeDetails: 0, reverseAddressObservation: 0, })`
- `assert.equal(result.partial.resourceUsage.discoveryCandidates, 0)`
- `assert.equal(result.googleRequestAborted, true, "the real Google client relay must abort the in-flight HTTP request")`

### 1388 — Hybrid progress exports pending-page count and total bounded post-action wait

**KEEP_DISTINCT_CONTRACT**

- default / Hybrid progress exports pending-page count and total bounded post-action wait / 0.114 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(progress.resourceUsage.pageStillLoadingWithinBound,2)`
- `assert.equal(progress.resourceUsage.postActionWaitTotalMs,5300)`

## src/eval/restaurant/agent-loop/live-case-materializer.test.ts

日期物化只改允许的相对字段，Gold修订/新样本cohort与原文保持分别有独立字面oracle；不读取未授权私有输入。

### 12 — live materialization resolves tonight and updates every dependent date without mutating source

**KEEP_DISTINCT_CONTRACT**

- default / live materialization resolves tonight and updates every dependent date without mutating source / 10.408 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(source.semantic.date.value, "2026-08-19")`
- `assert.equal(result.semantic?.date?.value, "2026-08-20")`
- `assert.deepEqual((result.tool_requirements as { task_critical_arguments: { date: string } }).task_critical_arguments.date, "2026-08-20")`

### 26 — live materialization handles this Friday and this afternoon in Asia/Tokyo

**KEEP_DISTINCT_CONTRACT**

- default / live materialization handles this Friday and this afternoon in Asia/Tokyo / 0.683 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(friday.semantic?.date?.value, "2026-08-21")`
- `assert.equal(afternoon.semantic?.date?.value, "2026-08-20")`

### 33 — live materialization independently resolves a right-now clock in Tokyo instead of retaining frozen case time

**KEEP_DISTINCT_CONTRACT**

- default / live materialization independently resolves a right-now clock in Tokyo instead of retaining frozen case time / 0.419 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(source.semantic.time.value, "16:00")`
- `assert.equal(result.semantic?.date?.value, "2026-09-14")`
- `assert.equal(result.semantic?.time?.value, "09:27")`

### 47 — current development inputs preserve the archived user messages and have one parameter oracle

**KEEP_DISTINCT_CONTRACT**

- default / current development inputs preserve the archived user messages and have one parameter oracle / 30.125 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(createHash("sha256").update(await readFile(archivePath)).digest("hex"), "2e32c2c3642a9d480f81c6ba06641925be98981b16d6f8235e461b4d9adac98b")`
- `assert.deepEqual(current.map(item => item.id), ["h001", "h002", "h003", "h004", "h005"])`
- `assert.deepEqual(current.map(({ id, content }) => ({ id, content })), historical.map(({ id, content }) => ({ id, content })))`

### 61 — real case loader through materialization and evaluator agrees with independent current request expectations

**KEEP_DISTINCT_CONTRACT**

- default / real case loader through materialization and evaluator agrees with independent current request expectations / 22.104 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(evaluate().status, "SATISFIED", \`${item.id}: ${JSON.stringify(evaluate())}\`)`
- `assert.equal(evaluate().status, "NOT_SATISFIED", \`${item.id}: changing delivery goal must conflict\`)`
- `assert.equal((materializedCase.semantic as Record<string, unknown>).party_size, 2)`

### 90 — relative expectation updates never rewrite literal dates or times in the actual user message

**KEEP_DISTINCT_CONTRACT**

- default / relative expectation updates never rewrite literal dates or times in the actual user message / 0.539 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.semantic?.date?.value, "2026-09-16")`
- `assert.equal(result.semantic?.time?.value, "12:00")`
- `assert.equal(result.content, content)`

### 101 — approved Gold7 is the default and right-now window materializes both bounds without changing Gold6

**KEEP_DISTINCT_CONTRACT**

- default / approved Gold7 is the default and right-now window materializes both bounds without changing Gold6 / 10.947 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(RESTAURANT_READ_DEVELOPMENT_DATASET_VERSION, "restaurant-read-development@7")`
- `assert.ok(frozen.every(item => item.dataset === "restaurant-read-development@7"))`
- `assert.deepEqual(result.semantic?.time, { expression: "right now", type: "TIME_WINDOW", start: "16:47", end: "17:17" })`

### 123 — custom live case loading keeps novel inputs parentless and in their own cohort

**KEEP_DISTINCT_CONTRACT**

- default / custom live case loading keeps novel inputs parentless and in their own cohort / 2.765 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(await customLiveCaseCohort(source), "NOVEL_LOCATION_DIAGNOSTIC")`
- `assert.deepEqual(source, before)`
- `assert.equal(await customLiveCaseCohort({ ...source, dataset: "restaurant-read-development-variant@1", parent }), "DEVELOPMENT_DIAGNOSTIC")`

### 137 — approved P1-F rev2 loads all eight independent literal request expectations

**KEEP_DISTINCT_CONTRACT**

- default / approved P1-F rev2 loads all eight independent literal request expectations / 8.530 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(cases.length, 8)`
- `assert.equal(item.content, content + "\n", id)`
- `assert.equal(semantic.date.expression, expression, id)`

### 191 — case loader rejects the original comma-truncated P1-F revision

**KEEP_DISTINCT_CONTRACT**

- default / case loader rejects the original comma-truncated P1-F revision / 10.270 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(loadFrozenLiveCases(".eval-artifacts/p1-f-20261011/variants.yaml"), /Frozen E2E case source is invalid/)`

### 195 — case loader rejects null values and unknown keys instead of silently accepting them

**KEEP_DISTINCT_CONTRACT**

- default / case loader rejects null values and unknown keys instead of silently accepting them / 10.895 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(loadFrozenLiveCases(path), /Frozen E2E case source is invalid/, name)`

## src/eval/restaurant/agent-loop/live-preflight.test.ts

冻结输入先验、代理选择、HTTP/TLS与缺凭据的分层要在真实 Runner 启动前阻断；无生产网络的 fake fetch 不等于实际 preflight 成功。

### 32 — live preflight records only public endpoint shape and permits the actual hybrid dependencies

**KEEP_DISTINCT_CONTRACT**

- default / live preflight records only public endpoint shape and permits the actual hybrid dependencies / 12.880 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(artifact.generationModelCalls, 0)`
- `assert.equal(result.attempts.length, 4)`
- `assert.deepEqual(requests.map(request => request.url), [ "https://api.deepseek.com/models", "https://places.googleapis.com/", "https://tabelog.com/", "https://www.tablecheck.com/en/", ])`

### 61 — configured proxy refusal finishes a preflight artifact before any endpoint request

**KEEP_DISTINCT_CONTRACT**

- default / configured proxy refusal finishes a preflight artifact before any endpoint request / 4.266 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( runLivePreflight({ runner: "HYBRID_LIVE_READ", targets: ["GOOGLE", "DEEPSEEK"], network: { proxyMode: "ENVIRONMENT", googleProxyServer: "http://user:secret@127.0.0.1:10808" }, timeoutMs: 1_000, }, environment, { artifactDirectory: directory, fetchImplementation: async () => { fetchCalls += 1; return new Response("", { status: 200 }); }, connectProxy: async () => { throw Object.assign(new Error("refused"), { code: "ECONNREFUSED" }); }, }), (error: unknown) => error instanceof LivePreflightError && error.code === "PREFLIGHT_PROXY_CONNECTION_REFUSED", )`
- `assert.equal(fetchCalls, 0)`
- `assert.equal(artifact.includes("secret"), false)`

### 86 — no-proxy resolves a copied environment and never probes an inherited 10808 proxy

**KEEP_DISTINCT_CONTRACT**

- default / no-proxy resolves a copied environment and never probes an inherited 10808 proxy / 6.910 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(configuration, { proxyMode: "DISABLED_BY_CLI" })`
- `assert.equal(effective.PRAXIS_GOOGLE_API_PROXY_SERVER, "")`
- `assert.equal(effective.PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER, "")`

### 107 — a fixed-source model run ignores browser and Google proxies it does not use

**KEEP_DISTINCT_CONTRACT**

- default / a fixed-source model run ignores browser and Google proxies it does not use / 11.894 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(proxyConnections, 0)`

### 122 — a failed preflight keeps downstream startup at zero

**KEEP_DISTINCT_CONTRACT**

- default / a failed preflight keeps downstream startup at zero / 5.770 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(startAfterPreflight, (error: unknown) => error instanceof LivePreflightError && error.code === "PREFLIGHT_DNS_UNREACHABLE")`
- `assert.equal(downstreamStarts, 0)`

### 137 — a nested transport cause is classified without recording its provider error

**KEEP_DISTINCT_CONTRACT**

- default / a nested transport cause is classified without recording its provider error / 5.942 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( runLivePreflight({ runner: "FIXED_SOURCE_MODEL", targets: ["DEEPSEEK"], network: { proxyMode: "ENVIRONMENT" }, timeoutMs: 1_000 }, environment, { artifactDirectory: directory, fetchImplementation: async () => { throw new TypeError("fetch failed", { cause }); }, }), (error: unknown) => error instanceof LivePreflightError && error.code === "PREFLIGHT_DNS_UNREACHABLE", )`

### 150 — an aborted endpoint probe is a timeout even when fetch reports DOM AbortError

**KEEP_DISTINCT_CONTRACT**

- default / an aborted endpoint probe is a timeout even when fetch reports DOM AbortError / 105.322 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( runLivePreflight({ runner: "FIXED_SOURCE_MODEL", targets: ["DEEPSEEK"], network: { proxyMode: "ENVIRONMENT" }, timeoutMs: 100 }, environment, { artifactDirectory: directory, fetchImplementation: async (_url, init) => new Promise<Response>((_resolve, reject) => { const signal = init?.signal as AbortSignal; signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true }); }), }), (error: unknown) => error instanceof LivePreflightError && error.code === "PREFLIGHT_TIMEOUT", )`

### 165 — a missing DeepSeek key is a configuration error before any fetch

**KEEP_DISTINCT_CONTRACT**

- default / a missing DeepSeek key is a configuration error before any fetch / 4.960 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( runLivePreflight({ runner: "FIXED_SOURCE_MODEL", targets: ["DEEPSEEK"], network: { proxyMode: "ENVIRONMENT" }, timeoutMs: 1_000 }, {}, { artifactDirectory: directory, fetchImplementation: async () => { fetchCalls += 1; return new Response("", { status: 200 }); }, }), (error: unknown) => error instanceof LivePreflightError && error.code === "PREFLIGHT_DEEPSEEK_CONFIGURATION", )`
- `assert.equal(fetchCalls, 0)`

### 179 — public source endpoints require a readable HTTP success response

**KEEP_DISTINCT_CONTRACT**

- default / public source endpoints require a readable HTTP success response / 4.319 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( runLivePreflight({ runner: "BROWSER_READ_PROBE", targets: [target], network: { proxyMode: "ENVIRONMENT" }, timeoutMs: 1_000 }, environment, { artifactDirectory: directory, fetchImplementation: async () => new Response("unavailable", { status }), }), (error: unknown) => error instanceof LivePreflightError && error.code === "PREFLIGHT_PUBLIC_ENDPOINT_REJECTED", )`

### 193 — Google's unauthenticated root response proves only TLS transport while DeepSeek access still requires HTTP success

**KEEP_PROTECTED**

- default / Google's unauthenticated root response proves only TLS transport while DeepSeek access still requires HTTP success / 3.336 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(google.attempts[0] && { outcome: google.attempts[0].outcome, status: google.attempts[0].status, tls: google.attempts[0].tls }, { outcome: "REACHABLE", status: 404, tls: "ESTABLISHED", })`
- `assert.rejects( runLivePreflight({ runner: "FIXED_SOURCE_MODEL", targets: ["DEEPSEEK"], network: { proxyMode: "ENVIRONMENT" }, timeoutMs: 1_000 }, environment, { artifactDirectory: directory, fetchImplementation: async () => new Response("denied", { status: 403 }), }), (error: unknown) => error instanceof LivePreflightError && error.code === "PREFLIGHT_DEEPSEEK_ACCESS_FAILED", )`

保护：AUTHORIZATION_IDEMPOTENCY_OR_OUTCOME

### 212 — preflight cancels an unread response body after observing headers

**KEEP_DISTINCT_CONTRACT**

- default / preflight cancels an unread response body after observing headers / 2.278 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(cancelled, true)`

### 225 — the actual hybrid runner validates frozen input before source/provider preflight or a Live task

**KEEP_DISTINCT_CONTRACT**

- default / the actual hybrid runner validates frozen input before source/provider preflight or a Live task / 1733.454 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(readdir(join(directory, ".eval-artifacts", "live-source-health")), /ENOENT/)`
- `assert.rejects( execFileAsync(process.execPath, ["--import", loader, runner], { cwd: directory, env: { PATH: process.env.PATH, PRAXIS_ALLOW_LIVE_RESTAURANT_READ: "1", PRAXIS_ALLOW_BROWSER_RUN: "1", PRAXIS_ALLOW_LIVE_MODEL_EVAL: "1", PRAXIS_BROWSER_ENGINE: "LOCAL_CHROMIUM", DEEPSEEK_API_KEY: "test-only-key", GOOGLE_MAPS_API_KEY: "test-only-key", PRAXIS_GOOGLE_API_PROXY_SERVER: "http://127.0.0.1:0", }, }), (error: unknown) => { const output = error as { stderr?: unknown }; return typeof output.stderr === "string" && output.stderr.includes("ENOENT") && output.stderr.includes("e2e-cases.gold7.yaml"); }, )`
- `assert.rejects(readdir(preflightDirectory), /ENOENT/)`

## src/eval/restaurant/agent-loop/live-run-deadline.test.ts

不听 AbortSignal 的子 Promise、调用方取消和正常早到各有可观察结局，不能因为都通过 Promise.race 合并成一个结果。

### 6 — outer live-run deadline settles a child promise that ignores abort

**KEEP_DISTINCT_CONTRACT**

- default / outer live-run deadline settles a child promise that ignores abort / 1.132 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(settled, (error: unknown) => error instanceof Error && error.message === "Read-only run was cancelled" && (error as Error & { code?: string }).code === "CANCELLED", )`

### 15 — owned deadline is distinguishable from a caller cancellation

**KEEP_DISTINCT_CONTRACT**

- default / owned deadline is distinguishable from a caller cancellation / 4.054 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(settled, (error: unknown) => !!error && typeof error === "object" && (error as { code?: string }).code === RUN_DEADLINE_EXCEEDED)`

### 22 — outer live-run deadline preserves a child result that arrives before abort

**KEEP_DISTINCT_CONTRACT**

- default / outer live-run deadline preserves a child result that arrives before abort / 0.144 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(await settled, "terminal")`

## src/eval/restaurant/agent-loop/live-source-health.test.ts

历史健康检查末次快照、可见后 busy 和未完成 ready 的红灯保留；逻辑时钟与真实 Chromium 竞态分别证明不同层。

### 11 — health deadline accepts the last completed ready snapshot when the final snapshot is 220ms late

**KEEP_DISTINCT_CONTRACT**

- default / health deadline accepts the last completed ready snapshot when the final snapshot is 220ms late / 1036.678 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(calls.some(call=>call.source.includes('tabelog')&&call.startedMs>=800),'the delayed final-snapshot construction was exercised')`
- `assert.equal(observation.outcome,'HEALTHY')`
- `assert.equal(observation.reason,null)`

### 48 — health deadline keeps its hard bound and never infers readiness without a completed ready snapshot

**KEEP_DISTINCT_CONTRACT**

- default / health deadline keeps its hard bound and never infers readiness without a completed ready snapshot / 1818.611 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(runLiveSourceHealth({environment:{},artifactDirectory:directory},{runtime,timeoutMs:300,sleep:async()=>{}}),SourceDataPreflightError)`
- `assert.equal(observation.outcome,'UNHEALTHY')`
- `assert.equal(observation.reason,mode==='NO_SNAPSHOT'?'CHECK_TIMEOUT':'RESULT_NOT_OBSERVED')`

### 71 — Live source health checks both sources and waits five minutes before each of at most three attempts

**KEEP_DISTINCT_CONTRACT**

- default / Live source health checks both sources and waits five minutes before each of at most three attempts / 15.282 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(start(),e=>e instanceof SourceDataPreflightError&&e.code==='ENV_FAILURE'&&e.sourceIds.join()==='tablecheck')`
- `assert.equal(sourceCalls,expected*2)`
- `assert.equal(result.modelCalls,0)`

### 87 — Live source health rejects saved busy/challenge/403 pages and does not mistake numeric restaurant copy for an HTTP error

**KEEP_DISTINCT_CONTRACT**

- default / Live source health rejects saved busy/challenge/403 pages and does not mistake numeric restaurant copy for an HTTP error / 0.316 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(liveSourcePageIssue('tablecheck',page,403),'HTTP_403')`
- `assert.equal(liveSourcePageIssue('tablecheck',{...page,text:'Search is unavailable right now. Please try again.'},200),'BUSY_PAGE')`
- `assert.equal(liveSourcePageIssue('tablecheck',{...page,text:'Verify you are human'},200),'VERIFICATION_PAGE')`

### 96 — actual Hybrid Live Runner stops before provider calls or a formal run after three unhealthy source checks

**KEEP_DISTINCT_CONTRACT**

- default / actual Hybrid Live Runner stops before provider calls or a formal run after three unhealthy source checks / 155.013 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(runHybridLiveRead({observe:async check=>{reads++;return {sourceId:check.sourceId,url:check.url,outcome:'UNHEALTHY',reason:'HTTP_403',httpStatus:403};},sleep:async ms=>{waits.push(ms);}}),(e:unknown)=>{if(e instanceof SourceDataPreflightError){artifactPath=e.artifactPath;return e.code==='ENV_FAILURE';}return false;})`
- `assert.equal(result.modelCalls,0)`
- `assert.equal(external,0)`

## src/eval/restaurant/agent-loop/locality-fact-judgment-matrix-scoring.test.ts

地域菜系的独立原始模型判定与生产拒收不能混记；零调用/缺引文不可算成功，评分安全边界保护。

### 14 — NOT_SUPPORTED rejects a raw SUPPORTED result even when production code declines its uncited assertion

**KEEP_DISTINCT_CONTRACT**

- default / NOT_SUPPORTED rejects a raw SUPPORTED result even when production code declines its uncited assertion / 0.437 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.citationStatus, "NONE")`
- `assert.equal(localityMatrixRunPassesExpected({ expected: "NOT_SUPPORTED", inputStatus: "INVOKED", canonical: result }), false)`

### 20 — UNKNOWN permits an empty citation list but rejects an invented nonempty citation

**KEEP_DISTINCT_CONTRACT**

- default / UNKNOWN permits an empty citation list but rejects an invented nonempty citation / 0.079 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(unknown.citationStatus, "NONE")`
- `assert.equal(localityMatrixRunPassesExpected({ expected: "UNKNOWN", inputStatus: "INVOKED", canonical: unknown }), true)`
- `assert.equal(invented.citationStatus, "UNGROUNDED")`

### 29 — SUPPORTED requires one legal, cited target judgment and actual production acceptance

**KEEP_DISTINCT_CONTRACT**

- default / SUPPORTED requires one legal, cited target judgment and actual production acceptance / 0.067 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(localityMatrixRunPassesExpected({ expected: "SUPPORTED", inputStatus: "INVOKED", canonical: supported }), true)`
- `assert.equal(duplicate.responseStatus, "DUPLICATE_TARGET_JUDGMENT")`
- `assert.equal(localityMatrixRunPassesExpected({ expected: "SUPPORTED", inputStatus: "INVOKED", canonical: duplicate }), false)`

### 40 — the scorer parameterizes the actual narrow criterion instead of retaining local food

**KEEP_DISTINCT_CONTRACT**

- default / the scorer parameterizes the actual narrow criterion instead of retaining local food / 0.055 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(localityMatrixRunPassesExpected({ expected: "UNKNOWN", inputStatus: "INVOKED", canonical: narrow }), true)`
- `assert.equal(wrongLabel.responseStatus, "MISSING_TARGET_JUDGMENT")`
- `assert.equal(localityMatrixRunPassesExpected({ expected: "UNKNOWN", inputStatus: "INVOKED", canonical: wrongLabel }), false)`

### 49 — no response or a filtered zero-call input cannot pass a matrix expectation

**KEEP_DISTINCT_CONTRACT**

- default / no response or a filtered zero-call input cannot pass a matrix expectation / 0.052 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(noResponse.responseStatus, "NO_SUCCESSFUL_RESPONSE")`
- `assert.equal(localityMatrixRunPassesExpected({ expected: "UNKNOWN", inputStatus: "INVOKED", canonical: noResponse }), false)`
- `assert.equal(localityMatrixRunPassesExpected({ expected: "UNKNOWN", inputStatus: "FILTERED_NOT_INVOKED", canonical: otherwiseValid }), false)`

## src/eval/restaurant/agent-loop/locality-fact-judgment-matrix.test.ts

已暴露12格输入与真实 judgment 口绑定，fixture 不能绕过引文；这仍是当前窄口评测入口。

### 12 — the locality matrix is frozen to V2-L1 through V2-L10 plus N1/N2 and uses the actual fact-judgment boundary

**KEEP_DISTINCT_CONTRACT**

- default / the locality matrix is frozen to V2-L1 through V2-L10 plus N1/N2 and uses the actual fact-judgment boundary / 2.331 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.evidence, [], \`${matrixCase.id} fixture UNKNOWN must remain unverified\`)`
- `assert.deepEqual(LOCALITY_FACT_JUDGMENT_MATRIX.map((item) => item.id), ["V2-L1", "V2-L2", "V2-L3", "V2-L4", "V2-L5", "V2-L6", "V2-L7", "V2-L8", "V2-L9", "V2-L10", "N1", "N2"])`
- `assert.equal(RESTAURANT_LOCALITY_FACT_JUDGMENT_MATRIX_REPETITIONS, 3)`

### 40 — the locality matrix does not let a fixture answer bypass cited evidence

**KEEP_DISTINCT_CONTRACT**

- default / the locality matrix does not let a fixture answer bypass cited evidence / 0.098 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.evidence, [])`

## src/eval/restaurant/agent-loop/name-resolution-benchmark.test.ts

独立字面店ID、无Gold进入模型、错店即停与只做身份前缀是G4验收边界；保护，不与G1问答错店测试混为同路径。

### 11 — name benchmark uses independent literal IDs, requires raw selected evidence and stops on wrong acceptance

**KEEP_DISTINCT_CONTRACT**

- default / name benchmark uses independent literal IDs, requires raw selected evidence and stops on wrong acceptance / 2.686 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(evaluateNameResolution(sample,{...result,rawSelectedPageUrl:'https://tabelog.com/tokyo/A1303/A130301/99999/'}).stopBatch,true)`
- `assert.equal(evaluateNameResolution(sample,{...result,returnedUrl:'https://tabelog.com/tokyo/A1303/A130301/99999/',rawSelectedPageUrl:'https://tabelog.com/tokyo/A1303/A130301/99999/'}).severity,'S0')`
- `assert.equal(evaluateNameResolution(sample,{...result,accepted:false,failure:'SOURCE_BUSY'}).verdict,'ENV_FAILURE')`

### 27 — frozen name samples have exact declared counts and no URL/Gold can reach method input

**KEEP_DISTINCT_CONTRACT**

- default / frozen name samples have exact declared counts and no URL/Gold can reach method input / 1.596 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(createHash('sha256').update(bytes).digest('hex'),'89ce49a49e428e84c5a4caed8831bf8ca98d1c06566d384879f8ce42992d0f87')`
- `assert.equal(frozen.sha256,'89ce49a49e428e84c5a4caed8831bf8ca98d1c06566d384879f8ce42992d0f87')`
- `assert.equal(dataset.samples.length,42)`

### 37 — name benchmark cannot admit live before sample approval and healthy source evidence

**KEEP_DISTINCT_CONTRACT**

- default / name benchmark cannot admit live before sample approval and healthy source evidence / 0.172 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.doesNotThrow(()=>assertNameResolutionLiveAdmission({...ready,preflight:{tabelogStatus:200,tabelogBusy:false}},'TABELOG'))`
- `assert.throws(()=>assertNameResolutionLiveAdmission({...ready,preflight:{tabelogStatus:200,tabelogBusy:false}},'TABLECHECK'),/not ready/)`
- `assert.throws(()=>assertNameResolutionLiveAdmission({...ready,preflight:{tablecheckStatus:200}},'TABELOG'),/not ready/)`

### 48 — production name prefix succeeds for both sources without using a known URL or operating availability

**KEEP_DISTINCT_CONTRACT**

- default / production name prefix succeeds for both sources without using a known URL or operating availability / 17.503 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(artifact.observation.modelCalls,0)`
- `assert.equal(artifact.observation.accepted,true,JSON.stringify(artifact.observation))`
- `assert.ok(navigated[0]!.includes('Fixture%20Restaurant')||navigated[0]!.includes('Fixture+Restaurant'))`

### 63 — scripted browser decisions cannot see placeholder dates or fill request controls in a name-only task

**KEEP_DISTINCT_CONTRACT**

- default / scripted browser decisions cannot see placeholder dates or fill request controls in a name-only task / 18.864 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(calls>0&&calls<=3)`
- `assert.equal(artifact.observation.modelCalls,calls)`
- `assert.equal('date' in input.goal,false)`

## src/eval/restaurant/agent-loop/native-discovery-composition.test.ts

Native→Router→Reducer 主链含 F5c 排队2+26纠正、F3-034显式选择、F6搜索取消交接等真实红灯；候选队列不能由地区函数单元测试替代。

### 305 — H001 native first batch presents three source-bound Tabelog results without TableCheck

**KEEP_DISTINCT_CONTRACT**

- default / H001 native first batch presents three source-bound Tabelog results without TableCheck / 121.136 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.semantic.status, "PROPOSED")`
- `assert.equal(result.state.presentedResults?.candidateIds.length, 3, JSON.stringify({ phase: result.state.phase, failure: result.state.failure, candidates: result.state.candidates.map((item) => item.restaurant.id), checks: result.state.availabilityChecks, factChecks: result.state.factChecks, continuation: result.state.searchContinuation, navigations: result.navigations, purposes: result.model.purposes }))`
- `assert.deepEqual(result.state.searchContinuation?.discoveryPlan?.entries.map((entry) => entry.sourceId), ["tabelog", "tablecheck", "google-places"], "the production composition retains the full three-pack plan while the first pack delivers")`

### 324 — H001 native cited-menu follow-up carries source-bound HARD evidence to a current Tabelog result

**KEEP_DISTINCT_CONTRACT**

- default / H001 native cited-menu follow-up carries source-bound HARD evidence to a current Tabelog result / 32.377 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.state.presentedResults?.candidateIds, ["tabelog:tokyo/A1304/A130401/100"], JSON.stringify({ phase: result.state.phase, failure: result.state.failure, facts: result.state.factChecks, availability: result.state.availabilityChecks, purposes: result.model.purposes, navigations: result.navigations }))`
- `assert.equal(result.navigations.some((url) => url.endsWith("/100/menu/")), true, "the native fact reader follows the observed same-source menu link before citing HARD evidence")`
- `assert.equal(result.model.purposes.filter((purpose) => purpose === "restaurant_fact_judgment").length, 2, "the cited judgment runs once per retained source document set")`

### 332 — H001 TableCheck reserve-menu facts cannot bypass the permanent form prohibition

**KEEP_DISTINCT_CONTRACT**

- default / H001 TableCheck reserve-menu facts cannot bypass the permanent form prohibition / 80.514 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.state.phase, "NO_VERIFIED_RESULT")`
- `assert.equal(result.state.factChecks?.["tablecheck:native-omakase-1"]?.status, "UNKNOWN")`
- `assert.equal(result.networkRequests.some(request => request.outcome === "ADMITTED" && request.pathname.includes("/reserve")), false)`

### 347 — H001 second native batch introduces its own TableCheck results after Tabelog cannot deliver

**KEEP_DISTINCT_CONTRACT**

- default / H001 second native batch introduces its own TableCheck results after Tabelog cannot deliver / 124.533 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.googleCalls.map((item) => item.query), ["Shibuya"])`
- `assert.equal(result.state.presentedResults?.candidateIds.length, 3)`
- `assert.equal(result.state.presentedResults?.candidateIds.every((id) => id.startsWith("tablecheck:")), true)`

### 357 — H001 native discovery uses the shared browser model loop to reveal an observed TableCheck result list

**KEEP_DISTINCT_CONTRACT**

- default / H001 native discovery uses the shared browser model loop to reveal an observed TableCheck result list / 36.359 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(result.state.readEvidence.some(item => item.kind === "DISCOVERY" && item.provider === "TABLECHECK" && Array.isArray(item.claims.sourceCategories) && item.claims.sourceCategories.includes("Japanese")))`
- `assert.deepEqual(result.state.presentedResults?.candidateIds, ["tablecheck:native-omakase-1"], JSON.stringify({ phase: result.state.phase, availability: result.state.availabilityChecks, browserInputs: result.model.browserDecisionInputs, purposes: result.model.purposes, navigations: result.navigations }))`
- `assert.equal(result.model.browserDecisionInputs.some((input) => input.objective.includes("public source search") && input.skillSource?.includes("# TableCheck Public Read")), true, "the production VENUE_SEARCH decision receives its Pack-owned TableCheck skill")`

### 370 — H001 native discovery uses an observed ordinary query submit only in its installed read boundary

**KEEP_DISTINCT_CONTRACT**

- default / H001 native discovery uses an observed ordinary query submit only in its installed read boundary / 34.246 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.state.presentedResults?.candidateIds, ["tablecheck:native-omakase-1"])`
- `assert.deepEqual(result.model.discoveryActions, ["FILL_AUTHORITATIVE", "CLICK"])`
- `assert.equal(result.evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(result.evaluation.findings))`

### 377 — H001 confirms a ready TableCheck query through live controls without mistaking hidden or script loading text for a pending search

**KEEP_DISTINCT_CONTRACT**

- default / H001 confirms a ready TableCheck query through live controls without mistaking hidden or script loading text for a pending search / 30.935 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.state.presentedResults?.candidateIds, ["tablecheck:native-omakase-1"])`
- `assert.equal(result.model.retrievalFillUsed, false, "the current observed input already equals the authoritative expression")`
- `assert.deepEqual(result.model.discoveryActions, [], "the executor completes after its live control read without a model browser action")`

### 385 — H001 never admits stale busy discovery cards or an old explicit empty state after the browser declines a current-query action

**KEEP_DISTINCT_CONTRACT**

- default / H001 never admits stale busy discovery cards or an old explicit empty state after the browser declines a current-query action / 33.401 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.state.candidates.length, 0, scenario)`
- `assert.equal(result.state.presentedResults, undefined, scenario)`
- `assert.equal(result.navigations.some((url) => /native-omakase-1|A130401\/100\/$/.test(url)), false, \`${scenario} must retain the incomplete discovery diagnostic rather than inspect its stale card\`)`

### 395 — native source session acquisition consumes the remaining source window and retains an unstarted detail entrance

**KEEP_DISTINCT_CONTRACT**

- default / native source session acquisition consumes the remaining source window and retains an unstarted detail entrance / 1.336 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(navigations.length, 0, "a session that misses the remaining source window cannot begin detail navigation")`
- `assert.equal(result.metadata.nativeDiscoveryFunnel?.sourceTimeLimitReached, true)`
- `assert.deepEqual(result.continuation?.sourceProgress?.pendingSourceIds, ["tokyo/A1304/A130401/100"])`

### 423 — the production Router advances the default three-pack cursor and reaches Google Nearby Search after bounded source batches

**KEEP_DISTINCT_CONTRACT**

- default / the production Router advances the default three-pack cursor and reaches Google Nearby Search after bounded source batches / 5.183 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(first.event.continuation?.discoveryPlan?.entries[first.event.continuation.discoveryPlan.cursor]?.sourceId, "tablecheck")`
- `assert.equal(second.event.continuation?.discoveryPlan?.entries[second.event.continuation.discoveryPlan.cursor]?.sourceId, "google-places")`
- `assert.equal(third.event.candidates.length, 1, "Nearby pack should return its grounded candidate")`

### 470 — fixed TableCheck discovery stores the actual filled value and cannot reveal the current result after a wrong fill

**KEEP_DISTINCT_CONTRACT**

- default / fixed TableCheck discovery stores the actual filled value and cannot reveal the current result after a wrong fill / 0.230 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(wrongInput.value, "stale query")`
- `assert.equal((await wrong.observeControls!()).find((control) => control.kind === "INPUT")?.value, "omakase near Ginza, Tokyo")`
- `assert.equal((await wrong.snapshot()).html.includes("/en/native-omakase-1"), false)`

### 493 — H001 two bounded empty source batches cannot claim inventory or results

**KEEP_DISTINCT_CONTRACT**

- default / H001 two bounded empty source batches cannot claim inventory or results / 21.746 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.state.searchContinuation?.exhausted, true)`
- `assert.deepEqual(result.googleCalls.map((item) => item.query), ["Shibuya"])`
- `assert.equal(result.state.presentedResults, undefined)`

### 503 — H001 both source lists reject page-owned coordinates outside the existing area radius

**KEEP_DISTINCT_CONTRACT**

- default / H001 both source lists reject page-owned coordinates outside the existing area radius / 9.667 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.state.candidates.length, 0)`
- `assert.equal(result.state.searchContinuation?.exhausted, true)`
- `assert.deepEqual(funnels.map((item) => ({ source: item.source, parsed: item.parsedOutlets, accepted: item.accepted, reasons: item.rejected.map((rejection) => rejection.reasonCode) })), [ { source: "TABELOG", parsed: 1, accepted: 0, reasons: ["OUTSIDE_EXACT_RADIUS"] }, { source: "TABLECHECK", parsed: 1, accepted: 0, reasons: ["OUTSIDE_EXACT_RADIUS"] }, ])`

### 518 — H001 one Tabelog detail failure retains earlier candidates and continues to the next detail

**KEEP_DISTINCT_CONTRACT**

- default / H001 one Tabelog detail failure retains earlier candidates and continues to the next detail / 24.459 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.state.candidates.map((item) => item.restaurant.id), [ "tabelog:tokyo/A1304/A130401/100", "tabelog:tokyo/A1304/A130401/102", ])`
- `assert.equal(result.trajectories.some((step) => step.executionMetadata?.candidateFailures?.some((failure) => failure.sourceUrl.endsWith("/101/") && failure.reasonCode === "BROWSER_TIMEOUT")), true, "the isolated candidate failure remains attributable in the read metadata")`
- `assert.equal(result.navigations.some((url) => url.endsWith("/102/")), true)`

### 533 — H001 rejects an early END_READ after an empty Tabelog batch and continues to TableCheck

**KEEP_DISTINCT_CONTRACT**

- default / H001 rejects an early END_READ after an empty Tabelog batch and continues to TableCheck / 32.280 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.trajectories.some((step) => step.agentAction?.type === "END_READ" && step.actionValidation?.status === "REJECTED"), true)`
- `assert.equal(result.state.searchContinuation?.exhausted, true)`
- `assert.equal(result.state.phase, "NO_VERIFIED_RESULT")`

### 541 — H001 native Tabelog batch continues past unavailable and unknown outlets, then presents its qualified outlet

**KEEP_DISTINCT_CONTRACT**

- default / H001 native Tabelog batch continues past unavailable and unknown outlets, then presents its qualified outlet / 38.001 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.state.availabilityChecks["tabelog:tokyo/A1304/A130401/100"]?.status, "UNAVAILABLE")`
- `assert.equal(result.state.availabilityChecks["tabelog:tokyo/A1304/A130401/101"]?.status, "SOURCE_UNSUPPORTED")`
- `assert.equal(result.state.availabilityChecks["tabelog:tokyo/A1304/A130401/102"]?.status, "AVAILABLE")`

### 554 — H001 native TableCheck batch continues after one nonqualifying outlet and presents the next

**KEEP_DISTINCT_CONTRACT**

- default / H001 native TableCheck batch continues after one nonqualifying outlet and presents the next / 39.851 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.state.availabilityChecks["tablecheck:native-omakase-1"]?.status, "UNAVAILABLE")`
- `assert.equal(result.state.availabilityChecks["tablecheck:native-omakase-2"]?.status, "AVAILABLE")`
- `assert.deepEqual(result.state.presentedResults?.candidateIds, ["tablecheck:native-omakase-2"])`

### 563 — H001 open-ended native target three delivers one qualified outlet when the first batch is complete

**KEEP_DISTINCT_CONTRACT**

- default / H001 open-ended native target three delivers one qualified outlet when the first batch is complete / 23.980 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.state.presentedResults?.candidateIds, ["tabelog:tokyo/A1304/A130401/101"], JSON.stringify({ phase: result.state.phase, failure: result.state.failure, navigations: result.navigations, candidates: result.state.candidates.map((candidate) => candidate.restaurant.id) }))`
- `assert.equal(result.state.intentDraft?.target?.selectionScope, "OPEN_ENDED")`
- `assert.equal(result.state.pendingResultBatchTarget, undefined)`

### 572 — H001 two investigated native batches with no qualified outlet stop without an inventory claim

**KEEP_DISTINCT_CONTRACT**

- default / H001 two investigated native batches with no qualified outlet stop without an inventory claim / 49.927 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.state.phase, "NO_VERIFIED_RESULT")`
- `assert.equal(result.state.searchContinuation?.exhausted, true)`
- `assert.equal(result.state.presentedResults, undefined)`

### 581 — H001 TableCheck search with a raw link but no parsed outlet retains the observed funnel and fails incomplete

**KEEP_DISTINCT_CONTRACT**

- default / H001 TableCheck search with a raw link but no parsed outlet retains the observed funnel and fails incomplete / 11.398 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(step?.executionMetadata?.failureCode, "DISCOVERY_SOURCE_INCOMPLETE")`
- `assert.deepEqual({ raw: step?.executionMetadata?.nativeDiscoveryFunnel?.rawSourceLinks, parsed: step?.executionMetadata?.nativeDiscoveryFunnel?.parsedOutlets, accepted: step?.executionMetadata?.nativeDiscoveryFunnel?.accepted, reason: step?.executionMetadata?.nativeDiscoveryFunnel?.progressionReason }, { raw: 1, parsed: 0, accepted: 0, reason: "SOURCE_FAILURE" })`
- `assert.deepEqual({ source: result.state.searchContinuation?.sourceProgress?.sourceId, pagesRead: result.state.searchContinuation?.sourceProgress?.pagesRead, inspected: result.state.searchContinuation?.sourceProgress?.inspectedSourceIds }, { source: "tablecheck", pagesRead: 1, inspected: [] }, "a failed source keeps its spent cursor instead of reopening with zero progress")`

### 598 — H001 enters the observed named Shibuya directory with the authoritative keyword

**KEEP_DISTINCT_CONTRACT**

- default / H001 enters the observed named Shibuya directory with the authoritative keyword / 62.212 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(region)`
- `assert.equal(new URL(region!).searchParams.get("sw"), "omakase")`
- `assert.equal(result.navigations.some((url) => url.endsWith("/100/")), true)`

### 606 — native discovery adjusts a sparse keyword through an observed category without relaxing HARD facts

**KEEP_DISTINCT_CONTRACT**

- default / native discovery adjusts a sparse keyword through an observed category without relaxing HARD facts / 23.635 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.state.presentedResults?.candidateIds, ["tabelog:tokyo/A1304/A130401/101"])`
- `assert.equal(result.navigations.includes("https://tabelog.com/en/tokyo/A1303/A130301/rstLst/sushi/"), true)`
- `assert.equal(result.navigations.some((url) => url.includes("tablecheck.com")), false)`

### 615 — native discovery rejects a category result that leaves the observed regional listing root

**KEEP_DISTINCT_CONTRACT**

- default / native discovery rejects a category result that leaves the observed regional listing root / 14.180 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.trajectories.some((step) => step.executionMetadata?.failureCode === "DISCOVERY_SOURCE_LOCATION_UNGROUNDED"), true)`
- `assert.equal(result.navigations.some((url) => url.endsWith("/199/")), false, "a category redirect cannot retain the earlier area proof")`
- `assert.equal(result.state.presentedResults, undefined)`

### 622 — native discovery retains category pagination including links revealed by a query action and deduplicates outlets

**KEEP_DISTINCT_CONTRACT**

- default / native discovery retains category pagination including links revealed by a query action and deduplicates outlets / 203.281 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(result.navigations.findIndex(url => url.includes("tablecheck.com")) < result.navigations.findIndex(url => url.endsWith("/105/")), "another source first batch precedes directory second chunk")`
- `assert.ok(result.state.searchContinuation?.deferredSources?.some(item => item.progress.sourceId === "tablecheck" && item.progress.pagesRead > 0), "a finished source checkpoint is retained across handoff too; spent budgets and unread entrances are not discarded")`
- `assert.deepEqual(result.state.presentedResults?.candidateIds, ["tabelog:tokyo/A1304/A130401/106"], JSON.stringify({navigations:result.navigations,search:result.state.searchContinuation,metadata:result.trajectories.filter(x=>x.agentAction?.type==="SEARCH_RESTAURANTS").map(x=>x.executionMetadata)}))`

### 638 — H001's named Shibuya entry avoids an unrelated root-list candidate before investigation

**KEEP_DISTINCT_CONTRACT**

- default / H001's named Shibuya entry avoids an unrelated root-list candidate before investigation / 37.566 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.navigations.some((url) => url.endsWith("/199/")), false, "the observed source refinement precedes unsuitable detail investigation")`
- `assert.deepEqual(result.state.presentedResults?.candidateIds, ["tabelog:tokyo/A1304/A130401/100"])`
- `assert.equal(result.navigations.some((url) => url.includes("/en/tokyo/A1303/A130301/rstLst/")), true)`

### 646 — native discovery refuses a broad listing when an observed regional entrance redirects away

**KEEP_DISTINCT_CONTRACT**

- default / native discovery refuses a broad listing when an observed regional entrance redirects away / 24.829 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(failed, "a redirected national list is not a current Shibuya discovery result")`
- `assert.equal(result.navigations.some((url) => url.endsWith("/199/")), false, "no broad-list candidate may reach detail investigation")`
- `assert.equal(result.state.presentedResults, undefined)`

### 654 — native discovery reaches a neutral locality only through its observed source-region entrance

**KEEP_DISTINCT_CONTRACT**

- default / native discovery reaches a neutral locality only through its observed source-region entrance / 20.664 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.state.candidates.map((candidate) => candidate.restaurant.id), ["tabelog:tokyo/A1304/A130401/100"], JSON.stringify({ phase: result.state.phase, failure: result.state.failure, navigations: result.navigations, candidates: result.state.candidates, facts: result.state.factChecks, availability: result.state.availabilityChecks, trajectories: result.trajectories, }))`
- `assert.equal(result.navigations.some((url) => url === "https://tabelog.com/en/tokyo/A1302/A130201/rstLst/?sw=omakase"), true, "the shared executor follows the public source control instead of borrowing Shibuya's Pack mapping")`
- `assert.equal(result.state.availabilityChecks["tabelog:tokyo/A1304/A130401/100"]?.status, "UNAVAILABLE", "the controlled discovery regression does not manufacture a slot; existing delivery controls cover PRESENT_RESULTS separately")`

### 666 — native discovery restores an observed regional listing after same-region homepage canonicalization

**KEEP_DISTINCT_CONTRACT**

- default / native discovery restores an observed regional listing after same-region homepage canonicalization / 30.330 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.state.candidates.map((candidate) => candidate.restaurant.id), ["tabelog:tokyo/A1304/A130401/100"])`
- `assert.equal(result.navigations[0], "https://tabelog.com/en/tokyo/rstLst/")`
- `assert.equal(result.navigations[1], "https://tabelog.com/en/tokyo/A1303/A130301/rstLst/?sw=omakase", "the Pack-owned homepage link restores the same observed listing rather than treating a homepage as a result list")`

### 674 — native discovery does not treat an unscoped national homepage as the observed regional homepage

**KEEP_DISTINCT_CONTRACT**

- default / native discovery does not treat an unscoped national homepage as the observed regional homepage / 17.360 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.trajectories.some((step) => step.executionMetadata?.failureCode === "DISCOVERY_SOURCE_LOCATION_UNGROUNDED"), true)`
- `assert.equal(result.navigations.some((url) => url.endsWith("/199/")), false, "a page with no regional boundary cannot inherit the earlier source area")`
- `assert.equal(result.state.presentedResults, undefined)`

### 681 — H001 presents one investigated Tabelog current-batch result without exhausting the source or starting TableCheck

**KEEP_DISTINCT_CONTRACT**

- default / H001 presents one investigated Tabelog current-batch result without exhausting the source or starting TableCheck / 43.948 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.state.searchContinuation?.exhausted, false, "the source remains open after the current bounded batch")`
- `assert.deepEqual(result.state.searchContinuation?.currentDiscoveryBatch, { sourceId: "tabelog", candidateIds: ["tabelog:tokyo/A1304/A130401/100", "tabelog:tokyo/A1304/A130401/101", "tabelog:tokyo/A1304/A130401/102", "tabelog:tokyo/A1304/A130401/103", "tabelog:tokyo/A1304/A130401/104"], })`
- `assert.deepEqual(result.state.searchContinuation?.sourceProgress?.pendingSourceIds, ["tokyo/A1304/A130401/105"])`

### 694 — H001 presents one investigated TableCheck current-batch result without reading a second TableCheck chunk

**KEEP_DISTINCT_CONTRACT**

- default / H001 presents one investigated TableCheck current-batch result without reading a second TableCheck chunk / 59.084 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.state.searchContinuation?.currentDiscoveryBatch, { sourceId: "tablecheck", candidateIds: ["tablecheck:native-omakase-1", "tablecheck:native-omakase-2", "tablecheck:native-omakase-3", "tablecheck:native-omakase-4", "tablecheck:native-omakase-5"], })`
- `assert.deepEqual(result.state.searchContinuation?.sourceProgress?.pendingSourceIds, ["native-omakase-6"])`
- `assert.deepEqual(result.state.presentedResults?.candidateIds, ["tablecheck:native-omakase-1"])`

### 706 — H001 consumes a retained Tabelog detail entrance without reopening a volatile listing

**KEEP_DISTINCT_CONTRACT**

- default / H001 consumes a retained Tabelog detail entrance without reopening a volatile listing / 84.377 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.navigations.filter((url) => url.includes("/rstLst/")).length, 4, "only the initial listing, keyword, hint and single fallback occur; retained entries do not reopen the list")`
- `assert.equal(result.navigations.some((url) => url.endsWith("/105/")), true, "the sixth observed entrance must survive the changed second listing")`
- `assert.equal(new Set(result.navigations.filter((url) => /\/tokyo\/A1304\/A130401\/\d+\/$/.test(url))).size, 6, "already inspected entries are not re-read while the retained one is consumed")`

### 716 — H001 retains unstarted Tabelog entries when a failed detail cannot reopen its session

**KEEP_DISTINCT_CONTRACT**

- default / H001 retains unstarted Tabelog entries when a failed detail cannot reopen its session / 38.409 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.state.phase, "PRESENT_RESULTS")`
- `assert.equal(result.navigations.filter((url) => url.endsWith("/100/")).length, 1, "the failed detail navigation is attempted once")`
- `assert.equal(result.navigations.some((url) => url.endsWith("/101/")), true, "the first unstarted entry is retained and later consumed")`

### 724 — native detail chunk retains deferred outlets while another source gets its first batch

**KEEP_DISTINCT_CONTRACT**

- default / native detail chunk retains deferred outlets while another source gets its first batch / 98.399 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual({ raw: funnel?.rawSourceLinks, parsed: funnel?.parsedOutlets, inspected: funnel?.inspectedOutlets, cap: funnel?.batchCap, limited: funnel?.batchLimitReached, exhausted: funnel?.sourceExhausted }, { raw: 6, parsed: 6, inspected: 5, cap: 5, limited: true, exhausted: false })`
- `assert.deepEqual(funnel?.deferredByBatchCap, [{ sourceUrl: "https://tabelog.com/tokyo/A1304/A130401/105/", reasonCode: "DETAIL_BATCH_CAP", }], "the observed sixth entrance is deferred, not rejected or represented as source exhaustion")`
- `assert.equal(new Set(result.navigations.filter((url) => /tabelog\.com\/tokyo\/A1304\/A130401\/\d+\/$/.test(url))).size, 6, "the sixth observed entrance survives source handoff and is inspected in a later Tabelog chunk")`

### 738 — H001 rejects early end and short presentation after TableCheck discovery until its batch is investigated

**KEEP_DISTINCT_CONTRACT**

- default / H001 rejects early end and short presentation after TableCheck discovery until its batch is investigated / 131.410 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.trajectories.some((item) => item.agentAction?.type === "END_READ" && item.actionValidation?.status === "REJECTED"), true)`
- `assert.equal(result.trajectories.some((item) => item.agentAction?.type === "PRESENT_RESULTS" && item.actionValidation?.status === "REJECTED"), true, JSON.stringify(result.trajectories.map((item) => ({ action: item.agentAction?.type, validation: item.actionValidation?.status, candidates: item.agentAction && "candidateIds" in item.agentAction ? item.agentAction.candidateIds : undefined, provider: item.executionMetadata?.provider }))))`
- `assert.equal(result.state.intentDraft?.target?.selectionScope, "OPEN_ENDED")`

### 751 — WP-A offline composition captures every model call including a timeout and links browser observations to DOM snapshots

**KEEP_DISTINCT_CONTRACT**

- default / WP-A offline composition captures every model call including a timeout and links browser observations to DOM snapshots / 189.777 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(metadata.callsStarted, rows.length)`
- `assert.equal(failed[0].errorCode, "TIMEOUT")`
- `assert.equal(row.finishReason, "TOOL_CALLS")`

### 812 — WP-A capture keeps model results and errors when storage fails, and finalizes an outstanding deadline call once

**KEEP_DISTINCT_CONTRACT**

- default / WP-A capture keeps model results and errors when storage fails, and finalizes an outstanding deadline call once / 3.772 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(unavailableResult.callsStarted, 2)`
- `assert.equal(row.outcome, "FAILED")`
- `assert.equal(row.errorCode, "RUN_DEADLINE_EXCEEDED")`

### 851 — coordinate-only discovery passes source-attributed address observations, including failure, to browser input

**KEEP_DISTINCT_CONTRACT**

- default / coordinate-only discovery passes source-attributed address observations, including failure, to browser input / 1.642 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(modelInputs[0], { latitude: 1, longitude: 2, radiusMeters: 1000, ...(!failure ? { addressComponents: [{ longText: "Observed district", types: ["sublocality"] }] } : {}), addressObservation: { source: "GOOGLE_GEOCODING", observedAt: reference.toISOString(), status: failure ? "UNAVAILABLE" : "OBSERVED", ...(failure ? { reasonCode: "GOOGLE_SERVICE_QUOTA_OR_PERMISSION" } : {}) } })`
- `assert.equal(modelInputs.length, 1)`
- `assert.equal(locality.googleRequestUsage(\`coordinate-input-${failure}\`).total, 1)`

### 875 — `P1-G repeated already-checked availability ends honestly: ${scenario}`

**KEEP_DISTINCT_CONTRACT**

- default / P1-G repeated already-checked availability ends honestly: NATIVE_TRUE_NO_RESULT / 21.938 ms / pass
- default / P1-G repeated already-checked availability ends honestly: TABELOG_CURRENT_BATCH_DELIVERS / 78.906 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(result.networkRequests.some(request => request.outcome === "ADMITTED"))`
- `assert.ok(result.trajectories.some(step => step.actionValidation?.status === "REJECTED" && step.actionValidation.code === "AVAILABILITY_ALREADY_CHECKED"))`
- `assert.equal(result.state.phase, expectedPhase, JSON.stringify(result.state.failure))`

### 893 — P1-G unresolved location NO_PROGRESS gives an honest user outcome

**KEEP_DISTINCT_CONTRACT**

- default / P1-G unresolved location NO_PROGRESS gives an honest user outcome / 10.283 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.state.phase, "NO_VERIFIED_RESULT")`
- `assert.equal(result.evaluation.findings.find(dimension => dimension.dimension === "RESOURCES")?.status, "NOT_EVALUATED")`
- `assert.equal(result.evaluation.findings.find(dimension => dimension.dimension === "COMPLETION_OUTCOME")?.status, "NOT_EVALUATED")`

### 909 — T1 production assembly shares Live limits after more than twelve actual availability model calls (discoveryPacks=tabelog,tablecheck)

**KEEP_DISTINCT_CONTRACT**

- default / T1 production assembly shares Live limits after more than twelve actual availability model calls (discoveryPacks=tabelog,tablecheck) / 60.918 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(result.callsBeforeDiscovery > 12, JSON.stringify({ calls: result.callsBeforeDiscovery, checks: result.state.availabilityChecks }))`
- `assert.ok(result.postAvailabilityDiscovery, "follow-up source search must run")`
- `assert.ok(result.networkRequests.some(request => request.outcome === "ADMITTED"), "production Guard admitted fixed source requests")`

### 918 — T1 Runner and Web assemblies expose equal effective limits and independent run budgets

**KEEP_DISTINCT_CONTRACT**

- default / T1 Runner and Web assemblies expose equal effective limits and independent run budgets / 0.193 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(runner.browserBudget.maxModelCalls, web.browserBudget.maxModelCalls)`
- `assert.equal(runner.loop.maxRejectedActions, 5, "neither host may fall back to the retired test default of three")`
- `assert.deepEqual(runner.runCeilings, web.runCeilings)`

### 940 — P21 discovery probe uses production assembly/Guard for one first batch and never availability

**KEEP_DISTINCT_CONTRACT**

- default / P21 discovery probe uses production assembly/Guard for one first batch and never availability / 6.540 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.attemptedSourceIds,["tabelog"])`
- `assert.ok(result.resources.modelCalls<=15)`
- `assert.ok(networkRequests.some(r=>r.method==="GET"&&r.outcome==="ADMITTED"))`

### 958 — P21 failed model calls count toward the shared probe ceiling; later source is not started

**KEEP_DISTINCT_CONTRACT**

- default / P21 failed model calls count toward the shared probe ceiling; later source is not started / 0.910 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.resources.modelCalls,1)`
- `assert.equal(calls,1)`
- `assert.equal(result.terminationReason,"MODEL_CALL_BUDGET_EXHAUSTED")`

### 973 — P21 pre-detail rewrites stay bounded and reject repeated or unobserved general expressions

**KEEP_DISTINCT_CONTRACT**

- default / P21 pre-detail rewrites stay bounded and reject repeated or unobserved general expressions / 2.296 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(proposals,mode==='unobserved-general'?2:3,'no model repair after a rejected proposal')`
- `assert.equal(read.candidates.length,0)`
- `assert.equal(read.metadata.nativeDiscoveryFunnel?.retrieval?.history.at(-1)?.selection.rejectionReason,mode==='repeat'?'REPEATED_RETRIEVAL_EXPRESSION':'UNOBSERVED_GENERAL_LIST')`

### 999 — P21 native venue and Google entries reuse one initial text retrieval proposal in a probe request

**KEEP_DISTINCT_CONTRACT**

- default / P21 native venue and Google entries reuse one initial text retrieval proposal in a probe request / 1.340 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.attemptedSourceIds,['tabelog','tablecheck','google-places'])`
- `assert.ok(result.resources.modelCalls<=15)`
- `assert.equal(googleRequests.length,1)`

### 1012 — Google-only planned retrieval omits nearby from place context and query while preserving its circle

**KEEP_DISTINCT_CONTRACT**

- default / Google-only planned retrieval omits nearby from place context and query while preserving its circle / 0.398 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(request.purpose, 'restaurant_discovery_retrieval')`
- `assert.deepEqual({location:modelInputs[0]?.location,textQuery:bodies[0]?.textQuery}, {location:place,textQuery:\`local food ${place}\`.trim()})`
- `assert.equal(modelInputs.length,1)`

### 1042 — H002 without positive HARD uses general shared retrieval and Google nearby without a planning model call

**KEEP_DISTINCT_CONTRACT**

- default / H002 without positive HARD uses general shared retrieval and Google nearby without a planning model call / 1.661 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(googleRequests.length,1)`
- `assert.ok(googleRequests[0]!.url.endsWith('/places:searchNearby'))`
- `assert.equal(googleRequests[0]!.body.textQuery,undefined)`

### 1066 — F5c Agent loop corrects within its Tabelog call despite TableCheck 2 and Google 26 pending candidates

**KEEP_PROTECTED**

- default / F5c Agent loop corrects within its Tabelog call despite TableCheck 2 and Google 26 pending candidates / 154.934 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(pending, "the real Agent must observe all 2 TableCheck + 26 Google candidates")`
- `assert.equal(result.state.candidates.filter(candidate => candidate.restaurant.id.startsWith("tablecheck:")).length, 2)`
- `assert.equal(result.state.candidates.filter(candidate => candidate.restaurant.sourceIds.googlePlaces).length, 26)`

保护：EXPLICIT_HISTORICAL_REGRESSION

### 1102 — decision capture still diagnoses a mismatching DOM and an unbound empty observation

**KEEP_DISTINCT_CONTRACT**

- default / decision capture still diagnoses a mismatching DOM and an unbound empty observation / 58.151 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual((await capture.finish()).errors,[{operation:'SNAPSHOT_LINK',errorCode:'DECISION_SNAPSHOT_MISMATCH'}])`

### 1118 — F5 provisional discovery crosses real Router/Reducer and retains bounded handoff to the next source

**KEEP_PROTECTED**

- default / F5 provisional discovery crosses real Router/Reducer and retains bounded handoff to the next source / 224.664 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.state.presentedResults?.candidateIds.length??0,scenario==="F5_SECOND_OUTSIDE"||prior?0:3,JSON.stringify({scenario,state:result.state.phase,continuation:result.state.searchContinuation,nav:result.navigations}))`
- `assert.equal(finished?.directoryRegion?.stopReason,(scenario==="F5_NO_ALTERNATE"||scenario==="F5_EDGE_NO_ALTERNATE")?"NO_OBSERVED_REPLACEMENT_ENTRANCE":"REPLACEMENT_SAMPLES_OUTSIDE_RADIUS")`
- `assert.ok(result.navigations.some(url=>url.includes("tablecheck.com")),"source UNKNOWN permits the next existing source")`

保护：EXPLICIT_HISTORICAL_REGRESSION

### 1145 — F3-034 rejected empty-list rewrites never navigate an implicit general list

**KEEP_PROTECTED**

- default / F3-034 rejected empty-list rewrites never navigate an implicit general list / 3.411 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(navigations.some(url=>new URL(url).pathname==='/en/tokyo/A1303/A130301/rstLst/'&&!new URL(url).searchParams.get('sw')),false,\`${mode}: rejected retrieval must not clear the keyword and navigate a general list\`)`
- `assert.equal(proposals,2,'one initial and one rejected rewrite; no model repair loop')`
- `assert.equal(read.metadata.nativeDiscoveryFunnel?.sourceExhausted,'UNKNOWN')`

保护：EXPLICIT_HISTORICAL_REGRESSION

### 1146 — mode

**KEEP_DISTINCT_CONTRACT**

- default / invalid-keyword / 1.219 ms / pass
- default / sparse-keep / 0.854 ms / pass
- default / repeated-keyword / 0.922 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(navigations.some(url=>new URL(url).pathname==='/en/tokyo/A1303/A130301/rstLst/'&&!new URL(url).searchParams.get('sw')),false,\`${mode}: rejected retrieval must not clear the keyword and navigate a general list\`)`
- `assert.equal(proposals,2,'one initial and one rejected rewrite; no model repair loop')`
- `assert.equal(read.metadata.nativeDiscoveryFunnel?.sourceExhausted,'UNKNOWN')`

### 1173 — invalid shared text does not silently issue a general Google query

**KEEP_DISTINCT_CONTRACT**

- default / invalid shared text does not silently issue a general Google query / 0.126 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(calls,0,'a rejected proposal must not become an unfiltered API query')`
- `assert.equal(read.metadata.failureCode,'DISCOVERY_SOURCE_INCOMPLETE')`
- `assert.equal(read.candidates.length,0)`

### 1186 — F6 reserve search hands completed Native and Google children through SEARCH_COMPLETED

**KEEP_PROTECTED**

- default / F6 reserve search hands completed Native and Google children through SEARCH_COMPLETED / 7.264 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.event.candidates.length,1,'only fully accepted A survives, never partial B')`
- `assert.equal(result.event.continuation?.exhausted,false,'cancelled source remains unknown, not exhausted')`
- `assert.deepEqual(result.event.metadata.reserveReached?.completedCandidateIds,result.event.candidates.map(c=>c.restaurant.id))`

保护：EXPLICIT_HISTORICAL_REGRESSION

### 1187 — source

**KEEP_DISTINCT_CONTRACT**

- default / native / 5.733 ms / pass
- default / google / 1.354 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.event.candidates.length,1,'only fully accepted A survives, never partial B')`
- `assert.equal(result.event.continuation?.exhausted,false,'cancelled source remains unknown, not exhausted')`
- `assert.deepEqual(result.event.metadata.reserveReached?.completedCandidateIds,result.event.candidates.map(c=>c.restaurant.id))`

## src/eval/restaurant/agent-loop/native-fixed-source-runner-finalization.test.ts

先单写执行再独立评价，sidecar失败不覆盖已有记录；保护证据持久化与幂等。

### 9 — native fixed-source finalization persists execution before independent evaluation and acceptance

**KEEP_DISTINCT_CONTRACT**

- default / native fixed-source finalization persists execution before independent evaluation and acceptance / 22.306 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(JSON.parse(await readFile(path, "utf8")), { persisted: true, status: "SUCCEEDED", stage: "AGENT_LOOP" })`
- `assert.deepEqual(JSON.parse(await readFile(resultPath, "utf8")), { persisted: true, status: "SUCCEEDED", stage: "AGENT_LOOP" })`
- `assert.deepEqual(JSON.parse(await readFile(finalized.acceptancePath, "utf8")), { sourceArtifact: { path: resultPath }, acceptance: { acceptance: "BLOCKED", exitCode: 1 }, })`

### 47 — a post-persistence acceptance-sidecar error leaves the execution record single-write

**KEEP_DISTINCT_CONTRACT**

- default / a post-persistence acceptance-sidecar error leaves the execution record single-write / 12.423 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(finalizeNativeFixedSourceRun({ journal: { resultPath, async finish(result) { finishCount += 1; await writeFile(resultPath, JSON.stringify(result), { flag: "wx" }); }, }, result: { status: "SUCCEEDED" }, progress, async evaluate() { return {}; }, buildAcceptanceSidecar() { throw new Error("sidecar unavailable"); }, }), /sidecar unavailable/)`
- `assert.deepEqual(JSON.parse(await readFile(resultPath, "utf8")), { status: "SUCCEEDED" })`
- `assert.equal(finishCount, 1)`

## src/eval/restaurant/agent-loop/phase2-discovery-plan.test.ts

五个冻结语义目标映射到当前 Pack 计划，推荐不走预约来源、负 HARD 不进关键词；虽有阶段名，调用的是当前接口。

### 61 — frozen H001-H005 authoritative semantics materialize into auditable source-pack plans

**KEEP_DISTINCT_CONTRACT**

- default / frozen H001-H005 authoritative semantics materialize into auditable source-pack plans / 88.437 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(cases.length, 5)`
- `assert.deepEqual(rendered.map((item) => item.id), ["h001", "h002", "h003", "h004", "h005"])`
- `assert.deepEqual(rendered[0]!.plan.map((item) => item.pack), ["tabelog", "tablecheck", "google-places"])`

## src/eval/restaurant/agent-loop/phase2b-exit-pipeline.test.ts

历史整包脚本仍可执行；输入SHA、人工复核、S0止损和写入阻断全保护。停止继续旧Live不等于授权移除旧独立评价边界，暂不以阶段名删测。

### 7 — Phase2b input gate stops on the actual exposed non-string required_claims, before date conversion

**KEEP_DISTINCT_CONTRACT**

- default / Phase2b input gate stops on the actual exposed non-string required_claims, before date conversion / 20.123 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.throws(()=>loadCommittedCases(bytes,commitment),/required_claims\[1\].*string/)`

### 22 — Phase2b commitment gate precedes parsing, detects file and per-document tampering, rejects unknown/null/condition objects

**KEEP_DISTINCT_CONTRACT**

- default / Phase2b commitment gate precedes parsing, detects file and per-document tampering, rejects unknown/null/condition objects / 6.518 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(commit.fileSha256,'cb0efa949f21fc0c19c7a6fd48e6a51c1848bb722c795b0ccd51213c43ecb98e','independent literal oracle')`
- `assert.throws(()=>loadCommittedCases(Buffer.from('not: [valid YAML\n'),commit),/FILE_SHA_MISMATCH_BEFORE_YAML_PARSE/)`
- `assert.throws(()=>loadCommittedCases(raw,bad),/CASE_SHA_MISMATCH_BEFORE_YAML_PARSE/)`

### 32 — Phase2b first weekday 7–14 Tokyo days, approved fallback only, and Runner-compatible dates are independently fixed

**KEEP_DISTINCT_CONTRACT**

- default / Phase2b first weekday 7–14 Tokyo days, approved fallback only, and Runner-compatible dates are independently fixed / 62.406 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(searches.sourceRules.radiusMeters,800)`
- `assert.deepEqual(out.changes.map((r:any)=>r.date),['2026-11-04','2026-10-30','2026-10-29','2026-11-03','2026-10-31','2026-10-30'])`
- `assert.equal(out.cases[0].semantic.date.expression,'Wednesday, November 4')`

### 42 — Phase2b saved merchant/inventory certification enforces radius, raw HARD quote and independently reviewed negative evidence

**KEEP_DISTINCT_CONTRACT**

- default / Phase2b saved merchant/inventory certification enforces radius, raw HARD quote and independently reviewed negative evidence / 79.340 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status,'ALL_SIX_WITNESSES_CERTIFIED')`
- `assert.deepEqual(result.variants.map((v:any)=>v.witnesses.length),[3,3,2,3,1,2])`
- `assert.throws(()=>witnesses.certifySavedWitnesses(far,inventory),/WITNESS_OUTSIDE_800M/)`

### 50 — Phase2b source reads share origin clock; 403/busy wait 15 minutes once, transport failure waits 2 minutes, writes are blocked

**KEEP_DISTINCT_CONTRACT**

- default / Phase2b source reads share origin clock; 403/busy wait 15 minutes once, transport failure waits 2 minutes, writes are blocked / 9.558 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(()=>read('https://tabelog.com/en/booking/confirm',{method:'POST'}),/READ_ONLY_SOURCE_REQUIRED/)`
- `assert.equal(calls,3)`
- `assert.rejects(()=>fail(page),/SOURCE_COOLDOWN_RETRY_EXHAUSTED/)`

### 58 — Phase2b 18 slots preserve order/budgets; S0 and witness expiry stop the remaining batch

**KEEP_DISTINCT_CONTRACT**

- default / Phase2b 18 slots preserve order/budgets; S0 and witness expiry stop the remaining batch / 4.509 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(calls,1)`
- `assert.equal(stop.stop.reason,'S0')`
- `assert.equal(calls,1)`

### 68 — Phase2b wording pack contains no results; budgets correspond by numeric fields and independent review blocks evaluation

**KEEP_DISTINCT_CONTRACT**

- default / Phase2b wording pack contains no results; budgets correspond by numeric fields and independent review blocks evaluation / 1931.499 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(pack.structuredBindings.every((b:any)=>b.status==='STRUCTURED_FIELDS_MATCH'))`
- `assert.ok(mismatch.structuredBindings.every((b:any)=>b.status==='STRUCTURED_FIELDS_MISSING_OR_DIFFERENT'))`
- `assert.equal(pack.structuredBindings.length,3)`

## src/eval/restaurant/agent-loop/recorded-browser-decision.test.ts

opaque handle可重绑但观察语义、来源集合和流必须相同；歧义/改动/旧合同不能静默升级，保护回放身份边界。

### 17 — recorded DOM reference changes only the opaque handle and refuses ambiguous or altered observations

**KEEP_DISTINCT_CONTRACT**

- default / recorded DOM reference changes only the opaque handle and refuses ambiguous or altered observations / 28.851 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.throws(() => rebindRecordedBrowserDecision(record, request(record, ambiguous)), { code: "REPLAY_DOM_TARGET_MISSING_OR_AMBIGUOUS" })`
- `assert.throws(() => rebindRecordedBrowserDecision(record, request(record, changed)), { code: "REPLAY_DOM_TARGET_MISSING_OR_AMBIGUOUS" })`
- `assert.throws(() => rebindRecordedBrowserDecision(record, request(record, { ...current, ...patch })), { code: "REPLAY_BROWSER_CONTEXT_DIVERGED" })`

### 40 — recorded region reference uses this flow's observed collection and rejects foreign/invented entries

**KEEP_DISTINCT_CONTRACT**

- default / recorded region reference uses this flow's observed collection and rejects foreign/invented entries / 2.551 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.throws(() => rebindRecordedBrowserDecision(record, request(record, changed)), { code: "REPLAY_REGION_TARGET_MISSING_OR_AMBIGUOUS" })`
- `assert.throws(() => rebindRecordedBrowserDecision(record, request(record, empty)), { code: "REPLAY_REGION_TARGET_MISSING_OR_AMBIGUOUS" })`
- `assert.deepEqual(JSON.parse(result.outputText), { ...wire, targetRef: "fresh:" + wire.targetRef })`

### 56 — an intentional old-contract Replay stop returns a bounded incomplete receipt without upgrading its output

**KEEP_DISTINCT_CONTRACT**

- default / an intentional old-contract Replay stop returns a bounded incomplete receipt without upgrading its output / 333.713 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.doesNotReject(async () => { summary = await runRecordedRead(config, directory); }, "An intentional incomplete Replay must retain its reason instead of losing the receipt in the Runner exception")`
- `assert.equal(summary!.status, "REPLAY_INCOMPLETE")`
- `assert.equal(summary!.modelTransportCalls, 0)`

## src/eval/restaurant/agent-loop/recording-diagnostic.test.ts

诊断DOM可保留安全但不可回放的页，不得借诊断改变原HAR；独立于静态资源捕获成功路径。

### 9 — diagnostic DOM preserves safe rejected pages without changing replay bytes

**KEEP_DISTINCT_CONTRACT**

- default / diagnostic DOM preserves safe rejected pages without changing replay bytes / 59.699 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(manifest.pages.map((page: any) => page.diagnostic), [ ...[1, 2, 3].map(snapshot => ({ status: "SAVED", file: \`diagnostic/snapshot-${String(snapshot).padStart(4, "0")}.html\` })), { status: "OMITTED", reason: "CHALLENGE_DOCUMENT" }, { status: "OMITTED", reason: "UNSAFE_DOCUMENT" }, { status: "OMITTED", reason: "DOCUMENT_SIZE_LIMIT" }, ])`
- `assert.deepEqual(manifest.pages.map(({ diagnostic: _diagnostic, ...page }: any) => page), baseline.pages)`
- `assert.equal(createHash("sha256").update(await readFile(join(result.path, file))).digest("hex"), hash, file)`

## src/eval/restaurant/agent-loop/recording-keys.test.ts

公开外来 key 局部脱敏与自有凭据整包拒绝不能合并；所有落盘文件扫描，Secret 保护范围。

### 21 — slot1 public map URL is redacted while residual key patterns omit only their page or response

**KEEP_PROTECTED**

- default / slot1 public map URL is redacted while residual key patterns omit only their page or response / 46.762 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.replay.status,'PARTIALLY_REPLAYABLE','the safe map page and Google response must survive; old writer rejected the whole HAR')`
- `assert.equal(result.pages[0]!.status,'REPLAYABLE')`
- `assert.equal(result.pages[1]!.reason,'UNSAFE_DOCUMENT')`

保护：CREDENTIAL_SAFETY

### 52 — an owned credential in a document rejects the whole recording before any content file is published

**KEEP_PROTECTED**

- default / an owned credential in a document rejects the whole recording before any content file is published / 18.172 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.replay.status,'NOT_REPLAYABLE')`
- `assert.ok(result.pages.every(page=>page.status==='NOT_REPLAYABLE'&&page.diagnostic.status==='OMITTED'))`
- `assert.rejects(access(join(result.path,'replay.har')))`

保护：CREDENTIAL_SAFETY

### 66 — pre-registered model credentials and owned Google response/trace leaks all reject the complete recording

**KEEP_PROTECTED**

- default / pre-registered model credentials and owned Google response/trace leaks all reject the complete recording / 23.733 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.replay.status,'NOT_REPLAYABLE',location)`
- `assert.deepEqual(await readdir(result.path),['recording.json'],location)`
- `assert.ok(!(await persisted(result.path)).includes(owned),location)`

保护：CREDENTIAL_SAFETY

## src/eval/restaurant/agent-loop/source-data-preflight.test.ts

合法非空、明确空200、无响应与目录元数据要区分；不能把 catalog/facet 当查位或搜索就绪。

### 8 — source data preflight: nonempty controls pass once; empty and timeout prevent run start

**KEEP_DISTINCT_CONTRACT**

- default / source data preflight: nonempty controls pass once; empty and timeout prevent run start / 54.379 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(work(),(e:unknown)=>e instanceof SourceDataPreflightError&&e.code==='ENV_FAILURE'&&e.sourceIds.join()==='tablecheck')`
- `assert.equal(started,outcome==='NONEMPTY')`
- `assert.equal(calls,3)`

### 25 — source preflight distinguishes an explicit empty200 from no valid response and missing diagnostics

**KEEP_DISTINCT_CONTRACT**

- default / source preflight distinguishes an explicit empty200 from no valid response and missing diagnostics / 4.997 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(runSourceDataPreflight({sourceIds:['tablecheck'],environment:{},artifactDirectory:dir},{read:async()=>observed}),SourceDataPreflightError)`
- `assert.equal(result.attempts[0].reason,observed.reason)`
- `assert.equal(result.attempts[0].responseStatus,observed.responseStatus)`

### 41 — TableCheck readiness counts result documents, never catalog metadata or grouped facets

**KEEP_DISTINCT_CONTRACT**

- default / TableCheck readiness counts result documents, never catalog metadata or grouped facets / 2.039 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(observeTableCheckSearchCount(response),2)`
- `assert.equal(observeTableCheckSearchCount({...response,body:Buffer.from('{"root":{"children":[]}}')}),0)`
- `assert.equal(observeTableCheckSearchCount({...response,body:Buffer.from('{"root":{"children":[{"id":"facet","children":[]}]}}')}),0)`

## src/eval/restaurant/agent-loop/source-stage-probe-runner.test.ts

只读来源窄口仍有 Runner 用户入口，模式、地点冻结和 journal 计数是调用前边界；旧 REPLAY 也不得联网兜底。

### 22 — source-stage plan runner freezes a no-proxy plan without external or downstream execution

**KEEP_DISTINCT_CONTRACT**

- default / source-stage plan runner freezes a no-proxy plan without external or downstream execution / 640.772 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(output.status, "PLAN_FROZEN")`
- `assert.equal(result.status, "SUCCEEDED")`
- `assert.equal(result.actualModelCalls, 0)`

### 44 — source-stage outer failure keeps a started preflight measurable instead of writing zero external work

**KEEP_DISTINCT_CONTRACT**

- default / source-stage outer failure keeps a started preflight measurable instead of writing zero external work / 718.517 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.actualModelCalls, 0)`
- `assert.equal((result.externalRequests as { status?: string }).status, "NOT_MEASURED")`
- `assert.equal(result.stage, "PREFLIGHT")`

### 107 — `source-stage execute rejects ${mode}${mode === "REPLAY" ? " outside the REPLAY stage" : ""} before preflight or downstream work and retains zero-attempt journal`

**KEEP_DISTINCT_CONTRACT**

- default / source-stage execute rejects REPLAY outside the REPLAY stage before preflight or downstream work and retains zero-attempt journal / 650.703 ms / pass
- default / source-stage execute rejects PLAN_ONLY before preflight or downstream work and retains zero-attempt journal / 780.019 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "FAILED")`
- `assert.equal(result.failureCode, "SOURCE_STAGE_MODE_NOT_EXECUTABLE")`
- `assert.equal(result.actualModelCalls, 0)`

### 125 — source-stage execute rejects LIVE_READ_ONLY paired with REPLAY before preflight or downstream work

**KEEP_DISTINCT_CONTRACT**

- default / source-stage execute rejects LIVE_READ_ONLY paired with REPLAY before preflight or downstream work / 712.277 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.failureCode, "SOURCE_STAGE_MODE_NOT_EXECUTABLE")`
- `assert.equal(result.externalRequests, 0)`
- `assert.equal(result.downstreamTaskStarts, 0)`

### 140 — source-stage offline Replay uses a frozen HAR contract and aborts without a frozen action trace or network fallback

**KEEP_DISTINCT_CONTRACT**

- default / source-stage offline Replay uses a frozen HAR contract and aborts without a frozen action trace or network fallback / 627.864 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(attempts.map(({ status, failureCode }) => ({ status, failureCode })), [ { status: "NO_COVERAGE", failureCode: "REPLAY_ACTION_NO_COVERAGE" }, ])`
- `assert.equal(result.stage, "REPLAY_MATRIX")`
- `assert.equal(result.replayTransport, "OFFLINE_HAR_NO_PREFLIGHT")`

### 169 — source-stage Replay rejects a changed frozen location context before any browser or model work

**KEEP_DISTINCT_CONTRACT**

- default / source-stage Replay rejects a changed frozen location context before any browser or model work / 461.318 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(attempts.map(({ status, failureCode, modelCallsStarted }) => ({ status, failureCode, modelCallsStarted })), [ { status: "NO_COVERAGE", failureCode: "REPLAY_ACTION_NO_COVERAGE", modelCallsStarted: 0 }, ])`
- `assert.equal(result.replayTransport, "OFFLINE_HAR_NO_PREFLIGHT")`

### 211 — source-stage named-location label must match the frozen sample input before preflight

**KEEP_DISTINCT_CONTRACT**

- default / source-stage named-location label must match the frozen sample input before preflight / 555.650 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.failureCode, "LOCATION_LABEL_NOT_FROZEN")`
- `assert.equal(result.externalRequests, 0)`
- `assert.equal(result.downstreamTaskStarts, 0)`

### 229 — source-stage named-location rejects an ambiguous frozen label before preflight

**KEEP_DISTINCT_CONTRACT**

- default / source-stage named-location rejects an ambiguous frozen label before preflight / 517.986 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.failureCode, "LOCATION_LABEL_NOT_FROZEN")`
- `assert.equal(result.externalRequests, 0)`

### 249 — source-stage named-location rejects a sample with no frozen label before preflight

**KEEP_DISTINCT_CONTRACT**

- default / source-stage named-location rejects a sample with no frozen label before preflight / 484.987 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.failureCode, "LOCATION_LABEL_NOT_FROZEN")`
- `assert.equal(result.externalRequests, 0)`

### 266 — source-stage named-location rejects an invalid frozen radius before preflight

**KEEP_DISTINCT_CONTRACT**

- default / source-stage named-location rejects an invalid frozen radius before preflight / 464.236 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.failureCode, "LOCATION_RADIUS_NOT_FROZEN")`
- `assert.equal(result.externalRequests, 0)`
- `assert.equal(result.downstreamTaskStarts, 0)`

## src/eval/restaurant/agent-loop/source-stage-probe.test.ts

总额度、失败样本分母、实际生产端口与 Replay 模型计数不同；冻结配额是评测配置合同，非无意义调用次数。

### 45 — source-stage manifest freezes the Phase3 budgets, full denominator and evaluator boundary

**KEEP_DISTINCT_CONTRACT**

- default / source-stage manifest freezes the Phase3 budgets, full denominator and evaluator boundary / 0.951 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(manifest.status, "PLANNED")`
- `assert.equal(createSourceStageProbeManifest({...input,budget:{...budget,sampleMaxElapsedMs:90000,sampleMaxModelCalls:6}}).budget.sampleMaxModelCalls,6)`
- `assert.throws(()=>createSourceStageProbeManifest({...input,budget:{...budget,sampleMaxElapsedMs:90001}}))`

### 62 — source-stage Replay reports no real model request while retaining replay decision accounting

**KEEP_DISTINCT_CONTRACT**

- default / source-stage Replay reports no real model request while retaining replay decision accounting / 0.057 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(reportedSourceStageModelCalls("REPLAY", 4), 0)`
- `assert.equal(reportedSourceStageModelCalls("DISCOVERY", 4), 4)`

### 67 — source-stage matrix cap limits the next sample before model dispatch

**KEEP_DISTINCT_CONTRACT**

- default / source-stage matrix cap limits the next sample before model dispatch / 0.098 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(remainingSourceStageSampleModelCalls(manifest, [{ modelCallsStarted: 4 }]), 4)`
- `assert.equal(remainingSourceStageSampleModelCalls(manifest, [{ modelCallsStarted: 4 }, { modelCallsStarted: 2 }]), 2)`
- `assert.equal(remainingSourceStageSampleModelCalls(manifest, [{ modelCallsStarted: 8 }]), 0)`

### 74 — source-stage attempt accounting retains failed samples and cannot convert a partial matrix into a pass

**KEEP_DISTINCT_CONTRACT**

- default / source-stage attempt accounting retains failed samples and cannot convert a partial matrix into a pass / 0.533 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(partial.statuses["tabelog-shibuya-omakase"], "FAILED")`
- `assert.deepEqual(overspent.budgetViolations.sampleModelCalls, [{ sampleId: "tabelog-shibuya-omakase", actual: 3, limit: 2 }])`
- `assert.throws(() => summarizeSourceStageAttempts(manifest, [{ sampleId: "tabelog-shibuya-omakase", status: "SUCCEEDED", elapsedMs: -1, modelCallsStarted: 0, replay: "NOT_APPLICABLE" }]))`

### 92 — direct source stages retain production-port reads without inventing a Hybrid evaluator verdict

**KEEP_DISTINCT_CONTRACT**

- default / direct source stages retain production-port reads without inventing a Hybrid evaluator verdict / 0.326 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(availabilityResult.modelCallsStarted, 3)`
- `assert.rejects( () => runSourceStageAvailabilityProbe({ availability: failedAvailability, request: { candidateIds: [], candidates: [], date, partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] }, signal: new AbortController().signal, browserBudget: failedBudget, }), (error: unknown) => typeof error === "object" && error !== null && (error as { sourceStageModelCalls?: unknown }).sourceStageModelCalls === 3, )`
- `assert.equal(failedBudget.totalModelCalls, 0, "the provider may retire the counter only after the failing read was measured")`

### 147 — source-stage facts and browser decisions share one bounded model counter

**KEEP_DISTINCT_CONTRACT**

- default / source-stage facts and browser decisions share one bounded model counter / 0.149 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(browserBudget.totalModelCalls, 2)`
- `assert.rejects(() => model.complete({ taskId: "fact-2", purpose: "restaurant_fact_judgment", promptVersion: "1", messages: [], responseFormat: "JSON_SCHEMA", outputSchema: { name: "fact", version: "1" }, timeoutMs: 1, fallback: "FAIL_CLOSED" }), { code: "MODEL_CALL_BUDGET_EXHAUSTED" })`
- `assert.equal(browserBudget2.totalModelCalls, 1)`

### 169 — frozen Replay wires use the production decoder and require a fresh opaque target rebind

**KEEP_DISTINCT_CONTRACT**

- default / frozen Replay wires use the production decoder and require a fresh opaque target rebind / 0.389 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(await replay.decide(input), { type: "CLICK", targetRef: "observation:1:target:1", reason: "REPLAYED_FROZEN_WIRE" })`
- `assert.deepEqual(replay.takeLastWireRecord?.(), { action: "CLICK", targetRef: "observation:1:target:1", authoritativeField: "NONE", requestedState: "NONE", reason: "REDACTED", extras: [], })`
- `assert.deepEqual(await stale.decide(input), { type: "CLICK", targetRef: "observation:1:target:1", reason: "REPLAYED_FROZEN_WIRE" }, "fresh semantic target can rebind after opaque refs change")`

### 206 — live source-stage discovery delegates to the production NativeRestaurantSearch flow instead of a direct Pack snapshot

**KEEP_DISTINCT_CONTRACT**

- default / live source-stage discovery delegates to the production NativeRestaurantSearch flow instead of a direct Pack snapshot / 41.330 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "LIST_OBSERVED", JSON.stringify({ failureCode: result.failureCode, metadata: result.read.metadata, navigations }))`
- `assert.equal(result.discoveryCoverage, "REGION_FILTERED_LIST_ONLY")`
- `assert.ok((result.read.metadata.nativeDiscoveryFunnel?.parsedOutlets ?? 0) > 0)`

### 239 — source-stage discovery keeps a parsed list without any frozen-radius candidate as NO_COVERAGE

**KEEP_DISTINCT_CONTRACT**

- default / source-stage discovery keeps a parsed list without any frozen-radius candidate as NO_COVERAGE / 1.895 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "NO_COVERAGE")`
- `assert.equal(result.read.candidates.length, 0)`
- `assert.equal(result.discoveryCoverage, "NO_COVERAGE")`

### 265 — browserless Google Pack runs through its production search port with the frozen pack query

**KEEP_DISTINCT_CONTRACT**

- default / browserless Google Pack runs through its production search port with the frozen pack query / 0.281 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "NO_COVERAGE")`
- `assert.equal(result.packId, "google-places")`
- `assert.deepEqual(requests, [{ discoveryQuery: { positiveCriteria:[], category: "restaurant", location: { latitude: center.latitude, longitude: center.longitude, radiusMeters: 3_000, label: "evaluation location", areaMatchBasis: "EVALUATION_LOCATION_RADIUS" } }, readRunId: "google-pack-control" }])`

## src/eval/restaurant/search-fixture/eval.test.ts

一个整合控制同时覆盖完整条件、追问和选择，检查当前 Search Eval 接线；不因断言少而删唯一入口。

### 6 — local fixture Search Eval covers full intent, clarification, and selection

**KEEP_DISTINCT_CONTRACT**

- default / local fixture Search Eval covers full intent, clarification, and selection / 20.009 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.mode, "FIXTURE")`
- `assert.equal(result.cases, 3)`
- `assert.equal(result.passed, 3)`

## src/eval/restaurant/semantic/exposed-regression.test.ts

字段归因、旧Prompt子集和Gold改变时不可比较防伪回归结论；历史 expectedDecision 仅诊断的限制由协议决定，不能静默改数据。

### 88 — field diagnostics count criteria and singleton mismatches once per turn

**KEEP_DISTINCT_CONTRACT**

- default / field diagnostics count criteria and singleton mismatches once per turn / 0.949 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.fieldMismatches, { criteriaText: 0, polarity: 0, strength: 1, date: 0, timeWindow: 1, partySize: 1, area: 0, decision: 1, })`
- `assert.equal(result.strength.expectedHardOrSoftActualUnspecifiedSlots, 1)`
- `assert.deepEqual(result.timeWindow, { expectedExactTurns: 1, exactMatchedTurns: 0, expectedMissingActualPresentTurns: 0, })`

### 129 — a criterion text mismatch is not also misclassified as polarity or strength

**KEEP_DISTINCT_CONTRACT**

- default / a criterion text mismatch is not also misclassified as polarity or strength / 0.105 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.fieldMismatches.criteriaText, 1)`
- `assert.equal(result.fieldMismatches.polarity, 0)`
- `assert.equal(result.fieldMismatches.strength, 0)`

### 156 — baseline comparison keeps the prompt @4 subset separate and reports newly continued turns

**KEEP_DISTINCT_CONTRACT**

- default / baseline comparison keeps the prompt @4 subset separate and reports newly continued turns / 0.279 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(comparison.comparableTurnIds.length, 1)`
- `assert.equal(comparison.baselineToPromptV5FieldMismatchDelta.strength, 1)`
- `assert.equal(comparison.baselineToPromptV5FieldMismatchDelta.timeWindow, 1)`

### 205 — common-unchanged comparison excludes a changed Gold turn instead of comparing it

**KEEP_DISTINCT_CONTRACT**

- default / common-unchanged comparison excludes a changed Gold turn instead of comparing it / 0.268 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(comparison.commonTurnIds, ["S1\u0000T1"])`
- `assert.deepEqual(comparison.annotationChangedTurnIds, ["S1\u0000T2"])`
- `assert.equal(comparison.current.totalTurnsInScope, 1)`

## src/eval/restaurant/semantic/holdout.test.ts

空模板、承诺SHA、简化标注与错误Draft归因是评测输入治理；未开私有Gold，本地构造负例仍需保留。

### 52 — semantic Holdout template contains no exposed sample and complete preflight rejects it

**KEEP_DISTINCT_CONTRACT**

- default / semantic Holdout template contains no exposed sample and complete preflight rejects it / 2.676 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(draft.status, "READY_FOR_ANNOTATION")`
- `assert.equal(complete.status, "NOT_READY")`
- `assert.deepEqual(complete.issues.map((item) => item.code), ["EMPTY_HOLDOUT"])`

### 71 — semantic Holdout preflight accepts a complete labelled dataset with the frozen manifest

**KEEP_DISTINCT_CONTRACT**

- default / semantic Holdout preflight accepts a complete labelled dataset with the frozen manifest / 1.652 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(report.status, "READY_FOR_BASELINE")`
- `assert.equal(report.preflightVersion, "3")`
- `assert.deepEqual(report.stats, { sessions: 1, turns: 1 })`

### 84 — semantic Holdout preflight rejects duplicates, manifest drift, and inconsistent Gold

**KEEP_DISTINCT_CONTRACT**

- default / semantic Holdout preflight rejects duplicates, manifest drift, and inconsistent Gold / 0.462 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(report.status, "NOT_READY")`
- `assert.ok(report.issues.some((item) => item.code === "INVALID_DATASET_SHAPE"))`
- `assert.ok(report.issues.some((item) => item.code === "FROZEN_MANIFEST_MISMATCH"))`

### 105 — semantic Holdout adapts the simplified private annotation shape without changing its meaning

**KEEP_DISTINCT_CONTRACT**

- default / semantic Holdout adapts the simplified private annotation shape without changing its meaning / 0.403 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(report.status, "READY_FOR_BASELINE")`
- `assert.deepEqual(draft?.timeWindow, { earliest: "19:00", latest: "19:00" })`
- `assert.deepEqual(draft?.area, { query: "near me" })`

### 143 — semantic Holdout gives a standalone simplified case its own structural session id

**KEEP_DISTINCT_CONTRACT**

- default / semantic Holdout gives a standalone simplified case its own structural session id / 0.190 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(report.status, "READY_FOR_BASELINE")`
- `assert.equal(report.dataset?.sessions[0]?.id, "source-session-1")`
- `assert.equal(report.dataset?.sessions[0]?.turns[0]?.id, "SH-STANDALONE")`

### 174 — semantic Holdout manifest audit identifies scorer, schema, and prompt configuration

**KEEP_DISTINCT_CONTRACT**

- default / semantic Holdout manifest audit identifies scorer, schema, and prompt configuration / 0.879 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(audit.scorerVersion, "4")`
- `assert.match(audit.proposalSchemaSha256, /^[a-f0-9]{64}$/)`
- `assert.match(audit.promptTemplateSha256, /^[a-f0-9]{64}$/)`

### 181 — semantic Holdout parser accepts a stream of structural annotation documents

**KEEP_DISTINCT_CONTRACT**

- default / semantic Holdout parser accepts a stream of structural annotation documents / 0.579 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(report.status, "READY_FOR_BASELINE")`
- `assert.deepEqual(report.stats, { sessions: 2, turns: 2 })`

### 213 — semantic scorer fails on Draft mismatch and ignores deprecated Decision metadata

**KEEP_DISTINCT_CONTRACT**

- default / semantic scorer fails on Draft mismatch and ignores deprecated Decision metadata / 0.284 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result, { status: "FAIL", firstFailureStage: "SEMANTIC_RESULT", error: "Compiled authoritative draft does not match the labelled semantic result", })`

## src/eval/restaurant/semantic/regression.test.ts

Proposal→Compiler→Reducer顺序与Gold@5逐项批准有独立原文oracle；错误层定位不能由只比终态的测试替代。

### 13 — semantic regression runs Proposal, Compiler, and Runtime/Reducer in order

**KEEP_DISTINCT_CONTRACT**

- default / semantic regression runs Proposal, Compiler, and Runtime/Reducer in order / 25.774 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(report.status, "COMPLETED")`
- `assert.deepEqual(report.turns.map((turn) => turn.status), Array(15).fill("PASS"))`
- `assert.equal(report.turns.every(turn => turn.goalBoundary?.status === "SATISFIED"), true)`

### 54 — Gold@5 applies the 15 approved labels while Gold@3 and Gold@4 remain frozen

**KEEP_DISTINCT_CONTRACT**

- default / Gold@5 applies the 15 approved labels while Gold@3 and Gold@4 remain frozen / 1.585 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(createHash("sha256").update(oldSource).digest("hex"), "fa4a8e52a82806af6d507a06f4ba16426e6c28376936363c777c4e981cf3ca72")`
- `assert.equal(restaurantSemanticRegressionV3.sessions[2]?.turns[1]?.expectedDraft.target?.goal, "RECOMMENDATION")`
- `assert.equal(createHash("sha256").update(readFileSync("src/eval/restaurant/semantic/cases/restaurant-semantic-regression.gold4.json")).digest("hex"), "96a3dbd7c406805e31586a0a6fb472b5bb2dd7458bd3187a3413c6ed2e5f8b66")`

### 82 — development attribution stops at Compiler before Reducer

**KEEP_DISTINCT_CONTRACT**

- default / development attribution stops at Compiler before Reducer / 0.772 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(report.turns[0]?.firstFailureStage, "COMPILER")`

### 105 — invalid model JSON is attributed to Proposal Contract and blocks downstream turns

**KEEP_DISTINCT_CONTRACT**

- default / invalid model JSON is attributed to Proposal Contract and blocks downstream turns / 0.157 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(report.turns[1]?.status, "BLOCKED_BY_UPSTREAM")`
- `assert.equal(report.turns[0]?.firstFailureStage, "SEMANTIC_PROPOSAL_CONTRACT")`
- `assert.deepEqual(report.summary.firstFailureStages, { SEMANTIC_PROPOSAL_CONTRACT: 1 })`

### 132 — development attribution accepts a semantically equivalent Proposal with reordered facts

**KEEP_DISTINCT_CONTRACT**

- default / development attribution accepts a semantically equivalent Proposal with reordered facts / 0.399 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(report.turns[0]?.status, "PASS")`

## src/eval/restaurant/semantic/scorer.test.ts

按语义、翻译、Reducer分层评分；ADR-0044灰区目标并不放过其他漂移。旧next-step忽略由当前Holdout协议要求，保留其误评分控制。

### 31 — stage scorer assigns valid but wrong meaning to Semantic Interpreter

**KEEP_DISTINCT_CONTRACT**

- default / stage scorer assigns valid but wrong meaning to Semantic Interpreter / 1.872 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(score.status === "FAIL" ? score.firstFailureStage : undefined, "SEMANTIC_INTERPRETER")`
- `assert.equal(validateRestaurantSemanticProposal(wrongMeaning).valid, true)`

### 50 — stage scorer assigns a wrong deterministic translation to Compiler

**KEEP_DISTINCT_CONTRACT**

- default / stage scorer assigns a wrong deterministic translation to Compiler / 0.133 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(score.status === "FAIL" ? score.firstFailureStage : undefined, "COMPILER")`

### 64 — stage scorer assigns wrong accumulated state after correct compilation to Reducer

**KEEP_DISTINCT_CONTRACT**

- default / stage scorer assigns wrong accumulated state after correct compilation to Reducer / 0.098 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(score.status === "FAIL" ? score.firstFailureStage : undefined, "REDUCER")`

### 78 — semantic scorer ignores the retired ADR-0007 next-step annotation

**KEEP_DISTINCT_CONTRACT**

- default / semantic scorer ignores the retired ADR-0007 next-step annotation / 0.064 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(score.status, "PASS")`

### 92 — stage scorer treats unordered criteria and facts with case/whitespace-only text changes as equal

**KEEP_DISTINCT_CONTRACT**

- default / stage scorer treats unordered criteria and facts with case/whitespace-only text changes as equal / 0.185 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(score, { status: "PASS" })`

### 160 — ADR-0044 scoring permits either grounded gray goal but rejects fabricated basis and wrong anchors

**KEEP_DISTINCT_CONTRACT**

- default / ADR-0044 scoring permits either grounded gray goal but rejects fabricated basis and wrong anchors / 0.333 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(scoreRestaurantSemanticTurn(input).status, sample.pass ? "PASS" : "FAIL", JSON.stringify(sample))`

### 183 — ADR-0044 gray goal flexibility does not hide other semantic drift or a changed carried goal

**KEEP_DISTINCT_CONTRACT**

- default / ADR-0044 gray goal flexibility does not hide other semantic drift or a changed carried goal / 0.642 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(scoreRestaurantSemanticTurn({ actualProposal, actualDraft: before, expectedDraft: before, goalBoundary: carry }).status, "PASS")`
- `assert.equal(scoreRestaurantSemanticTurn({ actualProposal, actualDraft: { ...before, target: { ...before.target!, goal: "AVAILABILITY" } }, expectedDraft: before, goalBoundary: carry }).status, "FAIL")`
- `assert.equal(scoreRestaurantSemanticTurn({ actualProposal, actualDraft: { ...before, partySize: 3 }, expectedDraft: before, goalBoundary: carry }).status, "FAIL")`

### 194 — `ADR-0044 independently rejects ${category === "GRAY" ? "ungrounded gray basis" : `${category} recommendation`}`

**KEEP_DISTINCT_CONTRACT**

- default / ADR-0044 independently rejects ungrounded gray basis / 0.071 ms / pass
- default / ADR-0044 independently rejects A recommendation / 0.046 ms / pass
- default / ADR-0044 independently rejects B recommendation / 0.067 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(scoreRestaurantSemanticTurn(input).status, "FAIL")`

## src/eval/shared/diagnostic-run.test.ts

started/dispatch/settled/results 单写以及错误脱敏，是失败时保留可审计证据的基础，幂等与秘密检查保护。

### 8 — diagnostic start survives early failure and results cannot overwrite prior evidence

**KEEP_PROTECTED**

- default / diagnostic start survives early failure and results cannot overwrite prior evidence / 25.506 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(JSON.parse(await readFile(run.startPath, "utf8")).status, "STARTED")`
- `assert.rejects(readFile(run.resultPath), { code: "ENOENT" })`
- `assert.rejects(run.finish({ status: "SUCCEEDED" }), { code: "EEXIST" })`

保护：IMMUTABLE_EVIDENCE_AND_SECRET

### 22 — diagnostic attempt dispatch and settlement records are immutable

**KEEP_PROTECTED**

- default / diagnostic attempt dispatch and settlement records are immutable / 13.696 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(run.recordAttempt(1, "DISPATCHED", { request: "replacement" }), { code: "EEXIST" })`
- `assert.equal(JSON.parse(await readFile(dispatched, "utf8")).stage, "DISPATCHED")`
- `assert.equal(JSON.parse(await readFile(settled, "utf8")).rawOutput, "{}")`

保护：IMMUTABLE_EVIDENCE_AND_SECRET

### 34 — diagnostics remove URL credentials, query and fragments and never return raw errors

**KEEP_PROTECTED**

- default / diagnostics remove URL credentials, query and fragments and never return raw errors / 0.635 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(diagnosticFailureCode(new Error("sk-secret")), "DIAGNOSTIC_FAILED")`
- `assert.equal(diagnosticFailureCode(Object.assign(new Error("private"), { code: "BROWSER_TIMEOUT" })), "BROWSER_TIMEOUT")`
- `assert.equal(diagnosticFailureCode(Object.assign(new Error("private"), { code: "https://secret" })), "DIAGNOSTIC_FAILED")`

保护：IMMUTABLE_EVIDENCE_AND_SECRET

## src/eval/shared/real-model.test.ts

显式付费门与费用未配置/估算标志不能误报免费；重试和失败计数属于预算真实合同。

### 9 — real model Eval requires an explicit paid-network gate and validates optional price inputs

**KEEP_DISTINCT_CONTRACT**

- default / real model Eval requires an explicit paid-network gate and validates optional price inputs / 3.509 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.throws( () => requireRealModelEvalConfiguration({}, 8), /PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 is required/, )`
- `assert.throws( () => requireRealModelEvalConfiguration( { PRAXIS_ALLOW_LIVE_MODEL_EVAL: "1", PRAXIS_DEEPSEEK_INPUT_USD_PER_MILLION_TOKENS: "0.2", }, 8, ), /Set both PRAXIS_DEEPSEEK_INPUT_USD_PER_MILLION_TOKENS/, )`
- `assert.deepEqual( requireRealModelEvalConfiguration( { PRAXIS_ALLOW_LIVE_MODEL_EVAL: "1", PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT: "1", PRAXIS_DEEPSEEK_INPUT_USD_PER_MILLION_TOKENS: "0.2", PRAXIS_DEEPSEEK_OUTPUT_USD_PER_MILLION_TOKENS: "0.8", }, 8, ), { caseLimit: 1, pricing: { inputUsdPerMillionTokens: 0.2, outputUsdPerMillionTokens: 0.8 }, }, )`

### 42 — real model Eval metrics retain provider metadata, retries, usage and explicitly estimated cost

**KEEP_DISTINCT_CONTRACT**

- default / real model Eval metrics retain provider metadata, retries, usage and explicitly estimated cost / 0.264 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(metrics, { modelCalls: 2, successfulCalls: 2, failedCalls: 0, retryCalls: 1, totalLatencyMs: 100, providerModels: ["DEEPSEEK:deepseek-v4-flash"], usage: { reportedByCalls: 2, inputTokens: 180, outputTokens: 70, totalTokens: 250, }, cost: { status: "ESTIMATED_FROM_ENV", currency: "USD", amount: 0.00032, inputUsdPerMillionTokens: 1, outputUsdPerMillionTokens: 2, }, })`
- `assert.equal( summarizeRealModelEval( [ { invocationId: "turn-one", taskId: "eval:restaurant:semantic:SH01:T01", purpose: "restaurant_semantic_interpret", promptVersion: "v2", fallback: "FAIL_CLOSED", provider: "DEEPSEEK", model: "deepseek-v4-flash", responseFormat: "JSON_OBJECT", outputSchema: { name: "restaurant-semantic-proposal", version: "1" }, outcome: "SUCCEEDED", latencyMs: 1, }, { invocationId: "turn-two", taskId: "eval:restaurant:semantic:SH01:T02", purpose: "restaurant_semantic_interpret", promptVersion: "v2", fallback: "FAIL_CLOSED", provider: "DEEPSEEK", model: "deepseek-v4-flash", responseFormat: "JSON_OBJECT", outputSchema: { name: "restaurant-semantic-proposal", version: "1" }, outcome: "SUCCEEDED", latencyMs: 1, }, ], 2, undefined, ).retryCalls, 0, )`

## src/harness/browser/browser-read-calendar-controls.test.ts

真实控件的选中/所属组/月份后置条件与句柄断开异常各自独立；selected-party循环和禁选日等历史红灯保留，class状态属于G3协调项。

### 10 — `Matsumoto selected-party ${initialParty} escapes the guest Next loop through production observation`

**KEEP_DISTINCT_CONTRACT**

- chromium / Matsumoto selected-party 1 escapes the guest Next loop through production observation / 1832.698 ms / pass
- chromium / Matsumoto selected-party 2 escapes the guest Next loop through production observation / 1207.121 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(selectedParty?.selected, true, "keep the selected button as observation evidence")`
- `assert.deepEqual(selectedParty.availableActions, [], "confirmed party cannot be clicked again")`
- `assert.deepEqual(input.observation.displayedCalendarMonth, { year: 2026, month: 10, caption: "Oct 2026", source: "DOM caption" })`

### 66 — generic selected state comes from ARIA and exact state classes, with independent same-label groups

**KEEP_DISTINCT_CONTRACT**

- chromium / generic selected state comes from ARIA and exact state classes, with independent same-label groups / 484.895 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(states.filter(t => t.selected).length, 12)`
- `assert.equal(states.find(t => t.label === "Unknown")?.selected, undefined)`
- `assert.deepEqual(guests.map(group => group.selectedValues), [["2"], ["4"]])`

### 101 — party click does not confirm from unrelated page changes or an unchanged group value

**KEEP_DISTINCT_CONTRACT**

- chromium / party click does not confirm from unrelated page changes or an unchanged group value / 762.283 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(input.history.at(-1)?.outcome, "NO_CHANGE")`
- `assert.equal(input.history.at(-1)?.reason, "PARTY_SIZE_NOT_CONFIRMED")`
- `assert.deepEqual(input.observation.controlGroups!.find(group => group.label === "Guests")?.selectedValues, ["1"])`

### 126 — Chromium labels public icon alternatives and leaves ambiguous calendar ownership unlabelled

**KEEP_DISTINCT_CONTRACT**

- chromium / Chromium labels public icon alternatives and leaves ambiguous calendar ownership unlabelled / 136.962 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(control, label)`
- `assert.equal(control.controlGroupLabel, "Public navigation")`
- `assert.equal(ambiguous.controlGroupLabel, "Unlabelled group")`

### 151 — calendar month postcondition ignores unrelated page changes and feeds NO_CHANGE back

**KEEP_DISTINCT_CONTRACT**

- chromium / calendar month postcondition ignores unrelated page changes and feeds NO_CHANGE back / 795.204 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(input.history.at(-1)?.outcome, "NO_CHANGE")`
- `assert.equal(input.history.at(-1)?.reason, "CALENDAR_MONTH_UNCHANGED")`
- `assert.equal(result.status, "REQUESTED_HUMAN_HELP")`

### 176 — Chromium control observation discards only a handle confirmed disconnected between reads

**KEEP_DISTINCT_CONTRACT**

- chromium / Chromium control observation discards only a handle confirmed disconnected between reads / 142.682 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(removed, true)`
- `assert.deepEqual(controls.map(control => [control.label, control.disabled]), [["Attached", false], ["Disabled", true]])`

### 217 — Chromium control observation preserves an attached control-read failure

**KEEP_DISTINCT_CONTRACT**

- chromium / Chromium control observation preserves an attached control-read failure / 114.100 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(registry.observe(observedPage), /CONTROL_READ_FAILURE/)`

### 244 — Chromium control signatures ignore presentation-only classes but reject value and owner changes

**KEEP_DISTINCT_CONTRACT**

- chromium / Chromium control signatures ignore presentation-only classes but reject value and owner changes / 142.912 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(first)`
- `assert.equal(initial.find(control => control.label === "Open public query")?.value, "public-query", "a non-native public value attribute remains observable")`
- `assert.ok(await registry.target(first.id), "presentational control and form class changes leave the observed semantic target actionable")`

### 272 — Chromium projects an owned default-method submit as GET without classifying bare or POST submits as public GET

**KEEP_DISTINCT_CONTRACT**

- chromium / Chromium projects an owned default-method submit as GET without classifying bare or POST submits as public GET / 133.699 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(controls.find(control => control.label === "Search")?.formMethod, "GET")`
- `assert.equal(controls.find(control => control.label === "Post search")?.formMethod, "POST")`
- `assert.equal(controls.find(control => control.label === "Bare submit")?.formMethod, undefined)`

### 289 — C2a recorded unavailable calendar dates are observed and cannot drift to other days

**KEEP_DISTINCT_CONTRACT**

- chromium / C2a recorded unavailable calendar dates are observed and cannot drift to other days / 1944.876 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(requested.rejectionReason,"DATE_NOT_SELECTABLE")`
- `assert.equal(read.status,'NO_SAFE_ACTION')`
- `assert.equal(read.reasonCode,'DATE_NOT_SELECTABLE')`

### 311 — C2a selectable requested date retains authoritative click and blocks an ordinary other-date click

**KEEP_DISTINCT_CONTRACT**

- chromium / C2a selectable requested date retains authoritative click and blocks an ordinary other-date click / 773.783 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.status,'COMPLETED')`
- `assert.ok(requested.availableActions?.includes('CLICK_AUTHORITATIVE:DATE'))`
- `assert.deepEqual(other.availableActions,[])`

## src/harness/browser/browser-read-discovery.test.ts

真实Chromium生产组合包含显式通用列表、地区四页、权威LOCATION、检索提示与取消子结果；这是F3/F5/F6主链红灯，不删整组慢用例。

### 13 — P1-D Chromium observes LOCATION binding and fills exactly the resolved name, excluding personal address and nameless requests

**KEEP_DISTINCT_CONTRACT**

- chromium / P1-D Chromium observes LOCATION binding and fills exactly the resolved name, excluding personal address and nameless requests / 1402.571 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status,name?'COMPLETED':'REQUESTED_HUMAN_HELP')`
- `assert.equal(calls,1)`
- `assert.ok(!address.availableActions?.includes('FILL_AUTHORITATIVE:LOCATION'))`

### 27 — P21 discovery uses DOM category links despite CSS and rejects foreign regions

**KEEP_DISTINCT_CONTRACT**

- chromium / P21 discovery uses DOM category links despite CSS and rejects foreign regions / 24654.895 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.candidates.length,['reject','forged-general','cross-source-general','no-general'].includes(mode)?0:mode==='cancel-partial'?1:5,JSON.stringify({metadata:result.metadata,navigations}))`
- `assert.equal(result.continuation?.exhausted,false)`
- `assert.equal(result.metadata.nativeDiscoveryFunnel?.sourceExhausted,'UNKNOWN')`

### 109 — P21b production discovery checks search filters, falls back once, and records only read hints

**KEEP_DISTINCT_CONTRACT**

- chromium / P21b production discovery checks search filters, falls back once, and records only read hints / 38864.008 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.metadata.nativeDiscoveryFunnel?.searchAvailabilityHint?.status,!isDirectory?'SKIPPED':applied?'APPLIED':['mismatch','empty'].includes(mode)?'FALLBACK':'SKIPPED')`
- `assert.equal(read.metadata.nativeDiscoveryFunnel?.searchAvailabilityHint?.reason,mode==='recommendation'?'NOT_AVAILABILITY':'FILTER_TRANSPORT_NOT_REVIEWED')`
- `assert.equal(selectedIds.length,5)`

### 162 — P21b guarded search filters reject unaudited parameters under the production generic-read policy

**KEEP_DISTINCT_CONTRACT**

- chromium / P21b guarded search filters reject unaudited parameters under the production generic-read policy / 254.368 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(async()=>{await session.prepareNavigation?.(bad,{timeoutMs:10_000});await session.navigate(bad,{timeoutMs:10_000});},/admitted|blocked|failed/i)`

### 176 — name-resolution benchmark uses the production prefix on Chromium and stops before any reservation navigation

**KEEP_DISTINCT_CONTRACT**

- chromium / name-resolution benchmark uses the production prefix on Chromium and stops before any reservation navigation / 1544.007 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(artifact.observation.rawSelectedPageUrl,detail)`
- `assert.equal(artifact.observation.modelCalls,0)`
- `assert.equal(artifact.observation.accepted,true,JSON.stringify(artifact.observation))`

### 200 — P21c recorded regional links reach six controlled development results through the production assembly

**KEEP_DISTINCT_CONTRACT**

- chromium / P21c recorded regional links reach six controlled development results through the production assembly / 19925.000 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.candidates.length,1,JSON.stringify({caseId,metadata:read.metadata,navigations,modelInputs}))`
- `assert.ok(read.metadata.nativeDiscoveryFunnel!.sourceElapsedMs!<90000)`
- `assert.ok(modelCalls<=6)`

### 267 — F5 G3 Chromium follows four observed region pages and directly selects the retained entrance without restoring a menu

**KEEP_PROTECTED**

- chromium / F5 G3 Chromium follows four observed region pages and directly selects the retained entrance without restoring a menu / 4785.763 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(second.candidates.length,2,JSON.stringify(second.metadata))`
- `assert.equal(second.metadata.nativeDiscoveryFunnel!.sourceDetailAttempts,4)`
- `assert.equal(request.purpose,'browser_read_decide')`

保护：EXPLICIT_HISTORICAL_REGRESSION

## src/harness/browser/browser-read-option-controls.test.ts

opaque值、owner、禁选/回滚/迟到选中/跨字段覆盖会产生不同错误请求；两Runtime实现各自执行真实DOM，不能只留LOCAL。

### 8 — button name metadata does not replace visible time or Reserve safety label

**KEEP_DISTINCT_CONTRACT**

- chromium / button name metadata does not replace visible time or Reserve safety label / 566.046 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(reserve?.rejectionReason, "WRITE_PROHIBITED")`
- `assert.ok(time?.availableActions?.includes("CLICK"))`
- `assert.equal(reserve?.availableActions?.includes("CLICK"), false)`

### 29 — `${runtimeKind} chooses a visible time option with an opaque native value and reads it back`

**KEEP_DISTINCT_CONTRACT**

- chromium / LOCAL chooses a visible time option with an opaque native value and reads it back / 839.908 ms / pass
- chromium / CLOUDFLARE_SESSION chooses a visible time option with an opaque native value and reads it back / 794.318 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED")`
- `assert.match(actual.html, /<output id="selected">7:00 PM<\/output>/)`
- `assert.ok(owner)`

### 68 — `${runtimeKind} binds a button combobox to its own listbox option through the strict browser wire`

**KEEP_DISTINCT_CONTRACT**

- chromium / LOCAL binds a button combobox to its own listbox option through the strict browser wire / 1145.812 ms / pass
- chromium / CLOUDFLARE_SESSION binds a button combobox to its own listbox option through the strict browser wire / 1159.049 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(target.availableActions?.includes(calls === 1 ? "CLICK" : "CHOOSE_OPTION:TIME"))`
- `assert.equal(result.status, "COMPLETED")`
- `assert.equal(calls, 2)`

### 99 — `empty input reads its own selected display and ${initialTime === "17:30" ? "confirms a changed option" : "avoids a duplicate choice"}`

**KEEP_DISTINCT_CONTRACT**

- chromium / empty input reads its own selected display and confirms a changed option / 1191.167 ms / pass
- chromium / empty input reads its own selected display and avoids a duplicate choice / 452.772 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED", JSON.stringify({ seenValues, controls: result.controls.filter(control => control.role === "combobox") }))`
- `assert.equal(calls, 2)`
- `assert.equal(calls, 0, "the already selected page needs no redundant model action")`

### 146 — `${runtimeKind} keeps the observed option node when unrelated buttons arrive during model decision`

**KEEP_DISTINCT_CONTRACT**

- chromium / LOCAL keeps the observed option node when unrelated buttons arrive during model decision / 1286.592 ms / pass
- chromium / CLOUDFLARE_SESSION keeps the observed option node when unrelated buttons arrive during model decision / 1264.981 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED")`
- `assert.equal(calls, 2)`
- `assert.ok(target)`

### 181 — `changed observed option ${mutation} is rejected before execution`

**KEEP_DISTINCT_CONTRACT**

- chromium / changed observed option role-change is rejected before execution / 887.810 ms / pass
- chromium / changed observed option replacement is rejected before execution / 881.226 ms / pass
- chromium / changed observed option legal-replacement is rejected before execution / 1183.683 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, canRecover ? "COMPLETED" : "REQUESTED_HUMAN_HELP")`
- `assert.equal(calls, 3)`
- `assert.ok(rejections.some(detail => detail.includes("Observed target changed or detached")), "the old observed node is rejected before a fresh decision")`

### 219 — a visible option from another listbox cannot be claimed by the expanded combobox

**KEEP_DISTINCT_CONTRACT**

- chromium / a visible option from another listbox cannot be claimed by the expanded combobox / 444.025 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "NO_SAFE_ACTION")`
- `assert.equal(foreign, undefined, "noncurrent list options are excluded from the action inventory")`
- `assert.ok(diagnostics.some(detail => detail === "STALE_OR_UNKNOWN_TARGET_REF"))`

### 247 — `native option ${variant} cannot be signed off as a selected time`

**KEEP_DISTINCT_CONTRACT**

- chromium / native option disabled cannot be signed off as a selected time / 421.231 ms / pass
- chromium / native option unchanged cannot be signed off as a selected time / 766.407 ms / pass
- chromium / native option complete cannot be signed off as a selected time / 790.114 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, variant === "complete" || variant === "disabled" ? "NO_SAFE_ACTION" : "REQUESTED_HUMAN_HELP")`
- `assert.equal(option, undefined, "disabled native options are excluded from the action inventory")`
- `assert.ok(option)`

### 277 — an asynchronously applied option can complete after a later selected-value observation

**KEEP_DISTINCT_CONTRACT**

- chromium / an asynchronously applied option can complete after a later selected-value observation / 1156.456 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(input.observation.targets.find(target => target.kind === "SELECT")?.options?.find(option => option.selected)?.value, "", "inventory readiness does not confirm the selected time")`
- `assert.ok((await session.snapshot()).html.includes('data-settled="yes"'), "completion requires actual selected-value settlement")`
- `assert.equal(result.status, "COMPLETED")`

### 307 — an unconfirmed time choice cannot be replaced by a successful party choice

**KEEP_DISTINCT_CONTRACT**

- chromium / an unconfirmed time choice cannot be replaced by a successful party choice / 831.087 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "NO_SAFE_ACTION")`
- `assert.ok(option)`
- `assert.ok(diagnostics.some(detail => detail.includes("previous option is still unconfirmed")))`

## src/harness/browser/browser-read-page-controls.test.ts

popup、modal、公开筛选Guard前后和clipped option各有具体浏览器语义；通用按钮小烟测虽弱，独立data-read-only路径尚有用途，暂保留不凑数。

### 10 — real browser waits for the requested page update instead of reporting stale slots

**KEEP_DISTINCT_CONTRACT**

- chromium / real browser waits for the requested page update instead of reporting stale slots / 457.968 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.pageState, "CONTENT_OBSERVED")`
- `assert.ok("slotsDetected" in result)`
- `assert.deepEqual(result.slotsDetected, ["20:00"])`

### 23 — a requested ready marker that never appears fails within the probe deadline

**KEEP_DISTINCT_CONTRACT**

- chromium / a requested ready marker that never appears fails within the probe deadline / 1610.311 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(runBrowserReadProbe({ openSession: async () => session }, { url, readySelector: "#never-ready", timeoutMs: 1_500 }), { code: "BROWSER_TIMEOUT" })`

### 30 — generic controlled browser path completes a local read-only page task without a site-specific adapter method

**KEEP_DISTINCT_CONTRACT**

- chromium / generic controlled browser path completes a local read-only page task without a site-specific adapter method / 811.321 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED")`
- `assert.ok(target, "model only receives observed target references")`
- `assert.equal(result.snapshot.title, "Results")`

### 68 — an observed public target-blank link switches the same session to a new page before reading its terms

**KEEP_DISTINCT_CONTRACT**

- chromium / an observed public target-blank link switches the same session to a new page before reading its terms / 844.068 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED")`
- `assert.equal(decisions, 1, "completion runs after the post-link snapshot; no stale parent decision is allowed")`
- `assert.ok(link)`

### 105 — real DOM observation exposes an unlabelled-id role button and calendar navigation without permitting submission

**KEEP_DISTINCT_CONTRACT**

- chromium / real DOM observation exposes an unlabelled-id role button and calendar navigation without permitting submission / 1140.233 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED")`
- `assert.ok(next)`
- `assert.ok(day)`

### 139 — an active language dialog blocks background calendar actions until the dialog is closed

**KEEP_DISTINCT_CONTRACT**

- chromium / an active language dialog blocks background calendar actions until the dialog is closed / 1142.867 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED")`
- `assert.equal(input.observation.targets.some((target) => target.value === "2026-09-07"), false, "background calendar remains observed state but is not an operable target under a modal")`
- `assert.ok(dialog)`

### 177 — shared executor keeps unguarded public filters unavailable

**KEEP_DISTINCT_CONTRACT**

- chromium / shared executor keeps unguarded public filters unavailable / 471.439 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "REQUESTED_HUMAN_HELP", JSON.stringify(result))`
- `assert.ok(target, \`expected observed ${label}\`)`
- `assert.deepEqual(sushi.availableActions, [], "a local fixture without an installed boundary must retain the narrow action policy")`

### 232 — slider observations follow native properties and ARIA state in both directions

**KEEP_DISTINCT_CONTRACT**

- chromium / slider observations follow native properties and ARIA state in both directions / 264.929 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual([control.min, control.max], ["0", "15"])`
- `assert.equal(after.value, String(expected))`

### 254 — a model cannot consent by setting an unclassified checkbox

**KEEP_DISTINCT_CONTRACT**

- chromium / a model cannot consent by setting an unclassified checkbox / 468.742 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(calls, 2, "strict-wire model proposal actually reached the executor")`
- `assert.equal((await session.snapshot()).title, "Not accepted")`
- `assert.equal((await session.observeControls!()).find(c => c.kind === "CHECKBOX")?.checked, false)`

### 282 — nested and hidden dialogs preserve only the active layer's targets

**KEEP_DISTINCT_CONTRACT**

- chromium / nested and hidden dialogs preserve only the active layer's targets / 274.086 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(observed.find(c => c.label === "Background")?.blockedByActiveLayer, true)`
- `assert.equal(observed.find(c => c.label === "Outer close" && c.kind === "BUTTON")?.blockedByActiveLayer, true)`
- `assert.equal(observed.find(c => c.label === "Background")?.blockedByActiveLayer, true)`

### 311 — `C5a one choice reveals a clipped ${field} option inside its current list`

**KEEP_DISTINCT_CONTRACT**

- chromium / C5a one choice reveals a clipped PARTY_SIZE option inside its current list / 879.505 ms / pass
- chromium / C5a one choice reveals a clipped TIME option inside its current list / 844.646 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED")`
- `assert.equal(calls, 1)`
- `assert.ok(choice, "clipped requested option must be offered")`

### 338 — C5a excludes disabled, occluded and noncurrent list options

**KEEP_DISTINCT_CONTRACT**

- chromium / C5a excludes disabled, occluded and noncurrent list options / 458.136 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "REQUESTED_HUMAN_HELP", JSON.stringify(observed))`
- `assert.equal(calls, 1)`
- `assert.equal(input.observation.targets.some(target => target.kind === "OPTION" && target.label === label), false, label)`

## src/harness/browser/browser-read-replay.test.ts

第一条保留HAR miss零联网；第三条真实Guard→Recorder→脚本/CSS/动态响应→Adapter回放更强。第二条手工Snapshot静态正常控制是唯一拟退役项，具体断言迁移见proposal。

### 15 — guarded HAR replay drives the production executor offline and keeps missing requests off the network

**KEEP_DISTINCT_CONTRACT**

- chromium / guarded HAR replay drives the production executor offline and keeps missing requests off the network / 2670.254 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED", JSON.stringify(result))`
- `assert.equal(step, 6)`
- `assert.rejects(session.navigate("https://replay.example/missing", { timeoutMs: 5_000 }), /blocked|failed|route/i, "a Guard-admitted HAR miss must not use the network")`

### 56 — recorded public documents replay through the production TableCheck availability Adapter without a network escape

**RETIRE_OR_MERGE_PROPOSED** · A-C01

第二条手工recordSnapshot构造同一Fixture restaurant两份静态文档，再走Recorder.finish→HAR→TableCheck Adapter，只断言REPLAYABLE、AVAILABLE和19:00。第三条使用同一店/日期2026-10-08/两人/19:00，实际Guard回调捕获脚本、CSS和/slots后原样回放，并独立核对receiver零新增流量，覆盖更强的录制交接。静态HTML解析仍由TableCheck多链接同店正向控制覆盖。

- chromium / recorded public documents replay through the production TableCheck availability Adapter without a network escape / 796.575 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(captured.replay.status, "REPLAYABLE")`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE", JSON.stringify(result))`
- `assert.deepEqual(result.offers.map(offer => offer.dateTime.slice(11, 16)), ["19:00"])`

### 100 — guarded dynamic TableCheck recording replays through the same production Adapter without receiver traffic

**KEEP_DISTINCT_CONTRACT**

- chromium / guarded dynamic TableCheck recording replays through the same production Adapter without receiver traffic / 2947.640 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(source.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE", JSON.stringify(source))`
- `assert.ok(arrivals >= 1, "the guarded source task must consume its public dynamic response")`
- `assert.equal(captured.replay.status, "REPLAYABLE")`

## src/harness/browser/browser-read-request-binding.test.ts

H003 dom引用当CSS、24操作上限、guest顺序以及H001请求绑定各有历史Live红灯；双后端不是同一路径，全部保护。

### 10 — `${runtimeKind} applies authoritative date and party through observed DOM references`

**KEEP_PROTECTED**

- chromium / LOCAL applies authoritative date and party through observed DOM references / 1176.384 ms / pass
- chromium / CLOUDFLARE_SESSION applies authoritative date and party through observed DOM references / 1104.453 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(target.options, [ { value: "2", label: "2", selected: true, disabled: false }, { value: "10", label: "10", selected: false, disabled: false }, ])`
- `assert.equal(result.status, "COMPLETED", JSON.stringify(result))`
- `assert.ok(target)`

保护：H003_DOM_REF_AND_OPERATION_CEILING_LIVE_FAILURE

### 55 — `${runtimeKind} settles delayed visible query state`

**KEEP_PROTECTED**

- chromium / LOCAL settles delayed visible query state / 908.617 ms / pass
- chromium / CLOUDFLARE_SESSION settles delayed visible query state / 899.705 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(await session.waitForSettled!(beforeApply, 700), true, "a delayed selected value or disabled state wakes the bounded wait")`
- `assert.notEqual(beforeNoise.interactiveState, undefined)`
- `assert.equal(await session.waitForSettled!(beforeNoise, 700), true, "visible text wakes a fresh read but cannot itself accept a result")`

保护：H003_DOM_REF_AND_OPERATION_CEILING_LIVE_FAILURE

### 84 — `${runtimeKind} settles hidden and property-only control mutations without treating either as inventory`

**KEEP_PROTECTED**

- chromium / LOCAL settles hidden and property-only control mutations without treating either as inventory / 543.322 ms / pass
- chromium / CLOUDFLARE_SESSION settles hidden and property-only control mutations without treating either as inventory / 542.660 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(await session.waitForSettled!(beforeHidden, 80), false, "hidden analytics and visibility:hidden inputs are not query-state progress")`
- `assert.match(beforeChecked.interactiveState ?? "", /"checked":false/)`
- `assert.equal(await session.waitForSettled!(beforeChecked, 700), true, "a visible checked property mutation wakes a fresh read")`

保护：H003_DOM_REF_AND_OPERATION_CEILING_LIVE_FAILURE

### 106 — `${runtimeKind} recovers once from a visible header obstruction and re-observes before the next click`

**KEEP_PROTECTED**

- chromium / LOCAL recovers once from a visible header obstruction and re-observes before the next click / 5844.877 ms / pass
- chromium / CLOUDFLARE_SESSION recovers once from a visible header obstruction and re-observes before the next click / 5868.251 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED", JSON.stringify(result))`
- `assert.ok(action)`
- `assert.equal(decisions, 2, "the recovery must re-observe and obtain a fresh proposal")`

保护：H003_DOM_REF_AND_OPERATION_CEILING_LIVE_FAILURE

### 141 — `TableCheck real Chromium Adapter completes a dynamic scrollable guest query (${order}) within 24 operations`

**KEEP_PROTECTED**

- chromium / TableCheck real Chromium Adapter completes a dynamic scrollable guest query (party-first) within 24 operations / 2142.317 ms / pass
- chromium / TableCheck real Chromium Adapter completes a dynamic scrollable guest query (date-first) within 24 operations / 2104.704 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(date && !date.selected, "the exact date remains actionable after the selected party is confirmed")`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE", JSON.stringify({ result, actions, events }))`
- `assert.equal(result.offers.length, 1)`

保护：H003_DOM_REF_AND_OPERATION_CEILING_LIVE_FAILURE

### 230 — native Tabelog detail uses real local Chromium controls before accepting its bound vacancy response

**KEEP_PROTECTED**

- chromium / native Tabelog detail uses real local Chromium controls before accepting its bound vacancy response / 1294.798 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(guestsTarget && !guestsTarget.selected, "the unselected exact party control is exposed after the date selection")`
- `assert.equal(read.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE", JSON.stringify(read))`
- `assert.equal(read.offers.length, 1)`

保护：H003_DOM_REF_AND_OPERATION_CEILING_LIVE_FAILURE

### 279 — `native dynamic Tabelog ${outcome} reaches formal H001 ${outcome === "AVAILABLE" ? "presentation" : "TableCheck continuation and no verified result"} with page-owned query evidence`

**KEEP_PROTECTED**

- chromium / native dynamic Tabelog AVAILABLE reaches formal H001 presentation with page-owned query evidence / 4623.532 ms / pass
- chromium / native dynamic Tabelog UNAVAILABLE reaches formal H001 TableCheck continuation and no verified result with page-owned query evidence / 5041.750 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(++modelCalls <= 50, "the formal local composition retains its total model-call ceiling")`
- `assert.equal(semantic.status, "PROPOSED")`
- `assert.equal(state.availabilityChecks[candidateId]?.status, outcome, JSON.stringify(state))`

保护：H003_DOM_REF_AND_OPERATION_CEILING_LIVE_FAILURE

## src/harness/browser/browser-read-search-controls.test.ts

输入代理、被listbox覆盖的背景按钮、视口内/外链接命中有已记录缺陷；offset0与1400不删，后者不能单独证明前者路径。

### 8 — `${runtimeKind} projects TableCheck search wrapper as combobox and only its native input as fillable`

**KEEP_PROTECTED**

- chromium / LOCAL projects TableCheck search wrapper as combobox and only its native input as fillable / 221.639 ms / pass
- chromium / CLOUDFLARE_SESSION projects TableCheck search wrapper as combobox and only its native input as fillable / 173.831 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(wrapper?.availableActions?.includes("CLICK"))`
- `assert.equal(wrapper!.availableActions?.some(action => action.startsWith("FILL")), false)`
- `assert.equal(field?.availableActions?.some(action => action.startsWith("FILL")), false, "no unbound free-text model fill")`

保护：COVERED_LINK_AND_SEARCH_LAYER_REGRESSIONS

### 43 — `${runtimeKind} completes an exact bound search suggestion without clicking its covered background control`

**KEEP_PROTECTED**

- chromium / LOCAL completes an exact bound search suggestion without clicking its covered background control / 1205.842 ms / pass
- chromium / CLOUDFLARE_SESSION completes an exact bound search suggestion without clicking its covered background control / 1287.873 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED")`
- `assert.ok(wrapper?.availableActions?.includes("CLICK"))`
- `assert.ok(option.availableActions?.includes("CHOOSE_OPTION:RETRIEVAL"), "the exact bound retrieval option must be actionable")`

保护：COVERED_LINK_AND_SEARCH_LAYER_REGRESSIONS

### 96 — `${runtimeKind} opens an observed covered public result at offset ${offset}`

**KEEP_PROTECTED**

- chromium / LOCAL opens an observed covered public result at offset 0 / 5307.706 ms / pass
- chromium / LOCAL opens an observed covered public result at offset 1400 / 5268.510 ms / pass
- chromium / CLOUDFLARE_SESSION opens an observed covered public result at offset 0 / 5318.106 ms / pass
- chromium / CLOUDFLARE_SESSION opens an observed covered public result at offset 1400 / 5286.053 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED")`
- `assert.ok(link?.availableActions?.includes("OPEN_LINK"))`
- `assert.equal(result.snapshot.url, detail)`

保护：COVERED_LINK_AND_SEARCH_LAYER_REGRESSIONS

## src/harness/browser/browser-read-stability.test.ts

query pending、旋转噪声与真正结果改变、重复toggle及慢DOMContentLoaded属于不同停止/恢复机制；慢正常控制保留，不缩短源延迟使红灯失效。

### 13 — C3 settles delayed date results before asking the model and never completes from stale loading stock

**KEEP_DISTINCT_CONTRACT**

- chromium / C3 settles delayed date results before asking the model and never completes from stale loading stock / 6448.127 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status,timeout?"REQUESTED_HUMAN_HELP":"COMPLETED")`
- `assert.equal(calls,2)`
- `assert.equal(pendingHint,true)`

### 36 — C3 visible-state fallback settles attribute-only carousel and rejects changing text or skeleton

**KEEP_DISTINCT_CONTRACT**

- chromium / C3 visible-state fallback settles attribute-only carousel and rejects changing text or skeleton / 11715.083 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.status, mode === "carousel" ? "COMPLETED" : "REQUESTED_HUMAN_HELP", mode)`
- `assert.equal(read.snapshot.settlement, mode === "carousel" ? "SETTLED" : "PENDING", mode)`
- `assert.ok(waits.length > 0)`

### 58 — C4 blocks repeated toggle state but allows the same Next control on changed pages

**KEEP_DISTINCT_CONTRACT**

- chromium / C4 blocks repeated toggle state but allows the same Next control on changed pages / 2665.598 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.status,mode==='toggle'?"NO_SAFE_ACTION":"COMPLETED")`
- `assert.equal(calls,mode==='toggle'?4:3)`
- `assert.equal(history[3]!.at(-1)?.reason,'REPEATED_FROM_SAME_STATE')`

### 81 — C3b rotating suggestions accept identical bound results but changing results and skeleton remain pending

**KEEP_DISTINCT_CONTRACT**

- chromium / C3b rotating suggestions accept identical bound results but changing results and skeleton remain pending / 13919.683 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.status,(mode==='suggestions'||mode==='unrelated-skeleton')?"COMPLETED":"REQUESTED_HUMAN_HELP",mode)`
- `assert.equal(read.snapshot.settlement,(mode==='suggestions'||mode==='unrelated-skeleton')?"SETTLED":"PENDING",mode)`
- `assert.ok(diagnostics.filter(d=>d.event==='ASYNC_WAIT').every(d=>d.url===url),"navigation wait uses actual URL")`

### 98 — C3b Chromium ignores an outstanding image once data has completed

**KEEP_DISTINCT_CONTRACT**

- chromium / C3b Chromium ignores an outstanding image once data has completed / 433.548 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(address&&typeof address!=='string')`
- `assert.equal(snapshot.settlement,'SETTLED')`
- `assert.ok(Date.now()-started<5000)`

### 122 — model full-page OPEN_LINK allows slow DOMContentLoaded and times out only within the remaining navigation budget

**KEEP_DISTINCT_CONTRACT**

- chromium / model full-page OPEN_LINK allows slow DOMContentLoaded and times out only within the remaining navigation budget / 12719.487 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.status,'COMPLETED')`
- `assert.rejects(reading,{code:'BROWSER_TIMEOUT'})`
- `assert.ok(diagnostics.some(d=>d.event==='OPERATION_FAILED'&&d.lifecycle.failureCode==='BROWSER_TIMEOUT'))`

## src/harness/browser/browser-read-tabelog.test.ts

真实限制日、busy恢复、失效会话及被动响应失效不可删；私有calendar marker/parse相关条目待B的G3逐项替换，不算A已缩减。

### 9 — Tabelog category discovery expands observed links and removes the keyword within the same area

**KEEP_DISTINCT_CONTRACT**

- chromium / Tabelog category discovery expands observed links and removes the keyword within the same area / 3573.711 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED")`
- `assert.deepEqual(input.goal.hardCriteria, ["omakase"], "retrieval navigation does not rewrite the HARD criterion")`
- `assert.equal(input.observation.targets.some(target => target.label === "Sushi"), false, "a hidden category is not an observed target")`

### 71 — saved Tabelog calendar keeps hidden future dates and disabled guests out of ready state

**KEEP_G3_COORDINATION**

- chromium / saved Tabelog calendar keeps hidden future dates and disabled guests out of ready state / 660.965 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(controls.some(control => control.label.startsWith("Date ")), false)`
- `assert.equal(controls.filter(control => /^Guests \d+$/.test(control.label)).every(control => control.disabled), true)`
- `assert.equal(tabelogQueryControlsRestricted(snapshot, controls, 2), true)`

### 108 — real Chromium recovers a Tabelog busy page once and still grounds the exact request

**KEEP_DISTINCT_CONTRACT**

- chromium / real Chromium recovers a Tabelog busy page once and still grounds the exact request / 2764.838 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status,"AVAILABLE",JSON.stringify(result))`
- `assert.equal(result.offers[0]?.partySize,2)`
- `assert.equal(result.offers[0]?.dateTime.slice(0,16),"2026-08-05T19:00")`

### 136 — Tabelog Adapter consumes loading-to-restricted calendar without model action or timeout

**KEEP_DISTINCT_CONTRACT**

- chromium / Tabelog Adapter consumes loading-to-restricted calendar without model action or timeout / 1194.663 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN")`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "TABELOG_REQUEST_DATE_CLOSED_ON_CALENDAR")`
- `assert.equal(result.offers.length, 0)`

### 163 — `${runtimeKind} retires a real Chromium session after a delayed failed navigation`

**KEEP_DISTINCT_CONTRACT**

- chromium / LOCAL retires a real Chromium session after a delayed failed navigation / 526.802 ms / pass
- chromium / CLOUDFLARE_SESSION retires a real Chromium session after a delayed failed navigation / 549.916 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( executor.navigate({ source: "TABLECHECK", stage: "IDENTITY", session: failedSession, signal, allowedOrigins: ["https://www.tablecheck.com"], url: failedUrl, timeoutMs: 30 }), { code: "BROWSER_TIMEOUT" }, )`
- `assert.match((await executor.snapshot({ source: "TABLECHECK", stage: "IDENTITY", session: freshSession, signal })).text, /New candidate/)`
- `assert.match((await executor.snapshot({ source: "TABLECHECK", stage: "IDENTITY", session: freshSession, signal })).text, /New candidate/)`

### 193 — `${runtimeKind} selects Tabelog paragraph dates and labelled guests without treating time options as slots`

**KEEP_G3_COORDINATION**

- chromium / LOCAL selects Tabelog paragraph dates and labelled guests without treating time options as slots / 1749.133 ms / pass
- chromium / CLOUDFLARE_SESSION selects Tabelog paragraph dates and labelled guests without treating time options as slots / 1753.418 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(disabledDate?.rejectionReason, "DISABLED")`
- `assert.ok(!input.observation.targets.some(target=>target.label.includes("7:00 PM")), "booking time buttons are evidence-only, not model actions")`
- `assert.equal(hasTabelogSelectedQuery(snapshot,"2026-09-20",4),true)`

### 253 — `${runtimeKind} ${markup} Tabelog Adapter grounds passive exact-query responses and clears them on navigation`

**KEEP_DISTINCT_CONTRACT**

- chromium / LOCAL legacy Tabelog Adapter grounds passive exact-query responses and clears them on navigation / 1627.066 ms / pass
- chromium / LOCAL current Tabelog Adapter grounds passive exact-query responses and clears them on navigation / 1616.290 ms / pass
- chromium / CLOUDFLARE_SESSION legacy Tabelog Adapter grounds passive exact-query responses and clears them on navigation / 1583.937 ms / pass
- chromium / CLOUDFLARE_SESSION current Tabelog Adapter grounds passive exact-query responses and clears them on navigation / 1616.374 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(input.observation.targets.find(t=>t.label==="Date 2026-09-20")?.availableActions, [], "selected date remains evidence without a repeat action")`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status,"AVAILABLE",JSON.stringify(result))`
- `assert.equal(result.offers.length,1)`

## src/harness/browser/browser-read-tablecheck.test.ts

45秒provider窗有原失败依据，旧页库存/错误查询与ARIA控件接线需保留；有时段真实页尚缺，TableCheck G3不能提前用未知PASS签收。

### 7 — TableCheck waits for its guide result and grounds exact-query empty availability

**KEEP_DISTINCT_CONTRACT**

- chromium / TableCheck waits for its guide result and grounds exact-query empty availability / 1586.639 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status,"UNAVAILABLE",JSON.stringify(result))`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode,"NO_MATCHING_SLOT")`
- `assert.equal(result.offers.length,0)`

### 30 — real Chromium TableCheck source observation completes inside the current 45s provider window

**KEEP_DISTINCT_CONTRACT**

- chromium / real Chromium TableCheck source observation completes inside the current 45s provider window / 32333.476 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(extendedWindow.result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE", JSON.stringify(extendedWindow.result))`
- `assert.ok(extendedWindow.elapsedMs >= 30_000, \`the extended provider window must retain the delayed source observation, elapsed ${extendedWindow.elapsedMs}ms\`)`
- `assert.equal(extendedWindow.result.offers.length, 1, "the current post-update slot is grounded through the production Adapter")`

### 111 — TableCheck handles multiple current search links and reads only the identity-bound outlet

**KEEP_DISTINCT_CONTRACT**

- chromium / TableCheck handles multiple current search links and reads only the identity-bound outlet / 1149.826 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE", JSON.stringify(result))`
- `assert.equal(result.offers.length, 1)`
- `assert.fail("known feasible guide requires no browser model action")`

### 140 — TableCheck form waits past old inventory until a current same-outlet slot link appears

**KEEP_DISTINCT_CONTRACT**

- chromium / TableCheck form waits past old inventory until a current same-outlet slot link appears / 1349.723 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(input.observation.url, reserve, "wait only for the selected reservation form")`
- `assert.equal(modelDecisionCalls, 1, "one bounded wait suffices for the controlled update")`
- `assert.equal(modelDecisionCalls, 0, "navigation settles the current result without spending a model WAIT")`

### 176 — `${runtimeKind} TableCheck changes guests through a read-only ARIA combobox without repeating the selected date`

**KEEP_DISTINCT_CONTRACT**

- chromium / LOCAL TableCheck changes guests through a read-only ARIA combobox without repeating the selected date / 2523.162 ms / pass
- chromium / CLOUDFLARE_SESSION TableCheck changes guests through a read-only ARIA combobox without repeating the selected date / 2474.446 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(input.observation.targets.find(t=>t.label==='Sep 19th')?.availableActions,[],"selected disabled calendar day retains state evidence but cannot repeat the date trigger")`
- `assert.ok(!input.observation.targets.some(t=>t.role==='combobox'&&t.label===(calls===2?'Any party size':'Time')), 'an already open list must not invite another open action')`
- `assert.equal(target.kind,calls===1||calls===3?'BUTTON':'OPTION')`

## src/harness/browser/browser-read-workspace.test.ts

浏览器展示刷新、晚到列表与G1逐字原文/来源/确认提示都有用户可见后果；CSS locator用于操作测试页面，不等于只测CSS形状。

### 6 — Web refresh replaces commercial terms and cites the displayed fact source

**KEEP_DISTINCT_CONTRACT**

- chromium / Web refresh replaces commercial terms and cites the displayed fact source / 278.105 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.doesNotMatch(await page.locator("#artifact").innerText(), /Evidence-grounded result/)`
- `assert.equal(await page.getByRole("link", { name: "Terms source" }).getAttribute("href"), current.sourceUrl)`
- `assert.match(text, /Evidence-grounded result/)`

### 61 — workspace New case survives a late initial case-list response

**KEEP_DISTINCT_CONTRACT**

- chromium / workspace New case survives a late initial case-list response / 273.575 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(oldCaseRequests,0,'a late list must not select a case after the user chose New case')`
- `assert.equal(await page.locator('#case-title').innerText(),'Start a case')`

### 91 — G1 Web asks only for the displayed outlet and renders quoted answers, absence and sensitive notice

**KEEP_DISTINCT_CONTRACT**

- chromium / G1 Web asks only for the displayed outlet and renders quoted answers, absence and sensitive notice / 374.391 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(await page.getByRole('link',{name:'Source page',exact:true}).getAttribute('href'),'https://merchant.example/a')`
- `assert.deepEqual(Object.keys(submitted[0]!).sort(),['candidateId','question','requestId','taskVersion'])`
- `assert.equal(submitted[0]!.candidateId,'a')`

## src/harness/browser/dom-change-agent.test.ts

原页/全标记改名后都由实际观察标签决定OPEN_LINK，证明动作不依赖私有定位；固定页观察对照没有替代这一动作链。

### 8 — G2 constructed normal control uses observed labels after every private marker changes

**KEEP_DISTINCT_CONTRACT**

- chromium / G2 constructed normal control uses observed labels after every private marker changes / 3736.937 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED", JSON.stringify(result))`
- `assert.equal(mapping.integrity.valid, true)`
- `assert.ok(target)`

## src/harness/browser/dom-change-mutation.test.ts

确定性改名需同步ARIA/CSS/SVG引用且悬空引用透明保留，另测错误变异不能入分母；这是测试生成器自身有效性。

### 6 — G2 extends the F3 class-only mutation to every id and private data attribute

**KEEP_DISTINCT_CONTRACT**

- chromium / G2 extends the F3 class-only mutation to every id and private data attribute / 137.144 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(await page.locator('[id="private-field"]').count(), 0, "the old private id must not survive the mutation")`
- `assert.equal(await page.locator("[data-testid], [data-private-owner]").count(), 0, "all private data names must change")`
- `assert.equal(Object.keys(value.mapping.ids).length, 2)`

### 24 — G2 rule two rewrites all bound ID references, leaves dangling/script references and preserves CSS

**KEEP_DISTINCT_CONTRACT**

- chromium / G2 rule two rewrites all bound ID references, leaves dangling/script references and preserves CSS / 150.640 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(first.integrity.valid, true, JSON.stringify(first.integrity))`
- `assert.equal(first.references.length, 11, "include each multi-valued token and label target")`
- `assert.ok(first.references.every(ref => ref.before.target === ref.after?.target))`

## src/harness/browser/dom-change.test.ts

12页既知事实不能在两边同时抹掉，Mutation有效性与诚实退化独立比较；复核通过的生命周期修复红灯保护。

### 7 — G2 saved pages preserve the frozen reference capability and reject new false claims

**KEEP_PROTECTED**

- chromium / G2 saved pages preserve the frozen reference capability and reject new false claims / 18639.298 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(actual.sourceTransportCalls, 0)`
- `assert.deepEqual(retained.lost, [], reference.id + " cannot erase previously known source facts on both sides")`
- `assert.deepEqual(retained.contradictions, [], reference.id + " original source interpretation changed and needs review")`

保护：REVIEWED_CPU_LIFETIME_RED

## src/harness/browser/fact-qa-runner.test.ts

Runner不读答案、执行与评分分离、SHA/旧Run阻断和敏感双允许结果，均有实际进程/核心接线；不可只以scorer单元PASS代替。

### 17 — G1 Runner executes bound pages, rejects previous-run binding, then scores in a separate phase

**KEEP_DISTINCT_CONTRACT**

- chromium / G1 Runner executes bound pages, rejects previous-run binding, then scores in a separate phase / 259.712 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(results[2].answer.status, "UNVERIFIED", "an old-run page must never be relabelled as current by the Runner")`
- `assert.equal(results[2].answer.reason, "NO_BOUND_PAGE")`
- `assert.deepEqual(results.map((row: { answer: QuestionOutcome }) => row.answer.status), ["ANSWERED", "NOT_STATED", "UNVERIFIED"])`

### 44 — G1 Runner rejects unknown public keys and changed source SHA before any model invocation

**KEEP_DISTINCT_CONTRACT**

- chromium / G1 Runner rejects unknown public keys and changed source SHA before any model invocation / 1.746 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(runBoundQuestions({ questions: path, output: join(directory, "bad-keys"), codeRef: "0".repeat(40), model: gateway, signal: AbortSignal.timeout(10_000) }), /UNKNOWN_QA_INPUT_KEY/)`
- `assert.rejects(runBoundQuestions({ questions: path, output: join(directory, "bad-hash"), codeRef: "0".repeat(40), model: gateway, signal: AbortSignal.timeout(10_000) }), /QA_SOURCE_SHA_MISMATCH/)`
- `assert.equal(calls, 0)`

### 61 — G1 scoring projection rejects a citation with another URL or readAt

**KEEP_DISTINCT_CONTRACT**

- chromium / G1 scoring projection rejects a citation with another URL or readAt / 0.146 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(scoringResponse(answer, read).citations[0]!.readId, "read")`
- `assert.throws(() => scoringResponse({ ...answer, citations: [{ ...answer.citations[0]!, ...patch }] }, read), /CITATION_NOT_BOUND/)`

### 70 — G1 execution CLI runs while answer-file reads are denied, with a working canary

**KEEP_DISTINCT_CONTRACT**

- chromium / G1 execution CLI runs while answer-file reads are denied, with a working canary / 533.942 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(execFile(process.execPath, ["--import", guard, "--input-type=module", "-e", "import {readFile} from 'node:fs/promises'; await readFile('.eval-artifacts/phase3b/g1-qa/answers.reviewed.json');"], { timeout: 10_000 }), error => String(error).includes("RUNNER_REFERENCE_READ_FORBIDDEN"))`
- `assert.equal(JSON.parse(result.stdout).executed, 3)`

### 82 — G1 reviewed Q28/Q30 run both permitted outcomes through actual core and independent references

**KEEP_DISTINCT_CONTRACT**

- chromium / G1 reviewed Q28/Q30 run both permitted outcomes through actual core and independent references / 1091.044 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(raw.map((row: { answer: QuestionOutcome }) => row.answer.status), [kind, kind])`
- `assert.equal(result.status, "PASS")`
- `assert.equal(row.raw.confirmationRequired, true)`

## src/harness/browser/fact-qa-scoring.test.ts

真实Chromium可见文本oracle防隐藏/script假引文进入独立评分，S0评分器负例保护。

### 6 — G1 independent source reader excludes script-only and hidden claims from quote support

**KEEP_PROTECTED**

- chromium / G1 independent source reader excludes script-only and hidden claims from quote support / 142.361 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(scoreQaAnswer(reference, read, response).status, "PASS")`
- `assert.equal(invalid.status, "FAIL")`
- `assert.equal(text.includes("Private room for four guests."), true)`

保护：INDEPENDENT_VISIBLE_TEXT_FALSE_CLAIM

## src/harness/browser/group-window.test.ts

真实Guard与Assembly绑定时间窗口的部分覆盖、禁用人数、禁止reserve与24点混合时钟；私有控件改造需B/A协调，安全断言保留。

### 39 — `group-window Chromium: ${mode} keeps exact request and explicit coverage`

**KEEP_DISTINCT_CONTRACT**

- chromium / group-window Chromium: available keeps exact request and explicit coverage / 862.277 ms / pass
- chromium / group-window Chromium: all-empty keeps exact request and explicit coverage / 1518.321 ms / pass
- chromium / group-window Chromium: wrong-party keeps exact request and explicit coverage / 833.755 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(modelTransportCalls,mode === "wrong-party" ? 1 : 0)`
- `assert.equal(googleCalls,0)`
- `assert.equal(assembly.browserBudget.totalModelCalls,modelTransportCalls)`

### 60 — group-window Chromium: forbidden entry is not attempted by availability or repeated FACTS

**KEEP_DISTINCT_CONTRACT**

- chromium / group-window Chromium: forbidden entry is not attempted by availability or repeated FACTS / 1330.357 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.availabilityChecks[candidate.restaurant.id]!.status,"SOURCE_UNSUPPORTED")`
- `assert.equal(read.offers.length,0)`
- `assert.equal(result.factChecks[candidate.restaurant.id]!.reasonCode,"SOURCE_UNSUPPORTED")`

### 74 — group-window Chromium: disabled exact party stops without clicking or changing the count

**KEEP_DISTINCT_CONTRACT**

- chromium / group-window Chromium: disabled exact party stops without clicking or changing the count / 462.490 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.reasonCode,"PARTY_SIZE_NOT_SELECTABLE",JSON.stringify(result.controls))`
- `assert.match((await session.snapshot()).html,/is-selected[^>]*data-value="2"/)`
- `assert.equal(decisions,0)`

### 86 — mixed clock alternatives pass through the Live assembly with installed Guard and exact query binding

**KEEP_DISTINCT_CONTRACT**

- chromium / mixed clock alternatives pass through the Live assembly with installed Guard and exact query binding / 808.990 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[native.restaurant.id]?.status,'AVAILABLE',JSON.stringify(result))`
- `assert.equal(result.offers.length,1)`
- `assert.equal(result.offers[0]!.dateTime,'2026-11-03T19:00:00+09:00')`

## src/harness/browser/live-source-health.test.ts

完整健康状态矩阵用真实DOM和注入时钟，visible后busy反例曾在2核并发失败；不能删或仅保留单跑。

### 24 — Live source health uses real Guard and observes a busy error arriving after visible results; 403/challenge never start a Live

**KEEP_PROTECTED**

- chromium / Live source health uses real Guard and observes a busy error arriving after visible results; 403/challenge never start a Live / 2738.291 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(clock,'every source uses its own injected clock')`
- `assert.rejects(work(),SourceDataPreflightError)`
- `assert.equal(result.modelCalls,0)`

保护：REVIEWED_CPU_LATE_BUSY_RED

## src/harness/browser/pacing-static-resources.test.ts

静态资源并发与来源文档节奏不应互相串行阻塞；实际local receiver观察，不能只测协调器队列。

### 9 — two Chromium runs count20 static resources each but pace only documents

**KEEP_DISTINCT_CONTRACT**

- chromium / two Chromium runs count20 static resources each but pace only documents / 906.944 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(check(),reason+JSON.stringify(children.map(c=>({messages:c.messages,error:Buffer.concat(c.errors).toString()}))))`
- `assert.equal(done.usage[origin].requests,21,'all source requests are counted')`
- `assert.equal(done.leases,1,'static resources must never acquire a pacing lease')`

## src/harness/browser/pacing-transport.test.ts

实际来源HTTP transport必须继承共同节奏与GET-only限制，防仅内存计数正确但请求逃逸。

### 14 — formal pacing bootstrap covers Chromium Guard routes, native redirects and Google transport

**KEEP_DISTINCT_CONTRACT**

- chromium / formal pacing bootstrap covers Chromium Guard routes, native redirects and Google transport / 155.467 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(googleFixtureCalls,2)`
- `assert.deepEqual(usage.byOrigin,{[origin]:{requests:3,waitMs:0},[googleOrigin]:{requests:1,waitMs:0},[geocodeOrigin]:{requests:1,waitMs:0}})`
- `assert.equal(session.metadata.readNetworkBoundary,"INSTALLED")`

## src/harness/browser/page-question-budget.test.ts

真实页面访问两页上限跨Session累计，并核实未批准POST与第三/第四页零到达；安全负例保护。

### 9 — G1 question permits two document visits across sessions, blocks the third before network and preserves Guard

**KEEP_PROTECTED**

- chromium / G1 question permits two document visits across sessions, blocks the third before network and preserves Guard / 1354.253 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(page.networkRequests?.some(r=>r.outcome==="BLOCKED"&&r.method==="POST"),"the unchanged read Guard blocks the unreviewed write")`
- `assert.rejects(()=>session.navigate(origin+"/three"),{code:"QUESTION_PAGE_BUDGET_EXHAUSTED"})`
- `assert.equal(visits.exhausted,true)`

保护：GUARD_AND_PAGE_BUDGET

## src/harness/browser/read-network-redirect.test.ts

CDP/Playwright事件错配、自动预检、完整POST审计及每跳/worker/popup/iframe各有不同拦截面；Guard负向/正常对照全保护。

### 8 — H003 TableCheck reservation forms stay unreachable even through a reviewed rule or redirect

**KEEP_PROTECTED**

- chromium / H003 TableCheck reservation forms stay unreachable even through a reviewed rule or redirect / 227.071 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(arrivals.some(p => decodeURIComponent(p).split("/").includes("reserve")), false, JSON.stringify(arrivals))`
- `assert.equal(arrivals.some(p => decodeURIComponent(p).split("/").includes("reserve")), false, JSON.stringify(arrivals))`
- `assert.ok(guard.snapshotRequests().some(r => r.outcome === "REDIRECT_BLOCKED"))`

保护：GUARD_REAL_CHROMIUM_BOUNDARY, EXPLICIT_HISTORICAL_REGRESSION

### 52 — P21 source preflight retains a6.5s result under the production navigation budget

**KEEP_PROTECTED**

- chromium / P21 source preflight retains a6.5s result under the production navigation budget / 6841.069 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.attempts[0].responseStatus,200)`
- `assert.equal(request.method,'GET')`
- `assert.ok(address&&typeof address!=='string')`

保护：GUARD_REAL_CHROMIUM_BOUNDARY

### 95 — E1 outer body observer captures real Chromium POST bytes independently of Guard admission

**KEEP_PROTECTED**

- chromium / E1 outer body observer captures real Chromium POST bytes independently of Guard admission / 3383.937 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(guard.snapshotResourceTypes().some(row => row.pathname === postRule.pathname && row.resourceTypeDetails.selectedFrom === "FETCH" && row.resourceTypeDetails.fetch === "XHR" && !row.resourceTypeDetails.network), "cache-missing adoption path stays explicit")`
- `assert.ok(guard.snapshotRequests().some(row => row.method === "POST" && row.resourceTypeDetails?.playwright === "fetch"))`
- `assert.deepEqual(rows.map(row => row.detail.status), ["MATCH", "MISMATCH"])`

保护：GUARD_REAL_CHROMIUM_BOUNDARY

### 256 — `real Chromium rejects a second ${name} redirect before receiver arrival`

**KEEP_PROTECTED**

- chromium / real Chromium rejects a second cross-origin redirect before receiver arrival / 158.818 ms / pass
- chromium / real Chromium rejects a second sensitive redirect before receiver arrival / 151.642 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(guard.snapshotRequests().some(row => row.outcome === "REDIRECT_BLOCKED"), JSON.stringify({ arrivals, requests: guard.snapshotRequests(), diagnostics: guard.snapshotDiagnostics() }))`
- `assert.equal(arrivals.includes(forbidden), false, \`forbidden receiver received ${forbidden}\`)`

保护：GUARD_REAL_CHROMIUM_BOUNDARY

### 264 — real Chromium preserves allowed redirect URL, relative links, cookies and recording of every hop

**KEEP_PROTECTED**

- chromium / real Chromium preserves allowed redirect URL, relative links, cookies and recording of every hop / 247.184 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(page.url(), origin + "/result/final")`
- `assert.equal(await page.locator("#relative").evaluate((el: HTMLAnchorElement) => el.href), origin + "/result/next")`
- `assert.deepEqual(cookies, ["read_probe=public"])`

保护：GUARD_REAL_CHROMIUM_BOUNDARY

### 275 — `real Chromium checks every ${type} redirect before cross-origin dispatch`

**KEEP_PROTECTED**

- chromium / real Chromium checks every fetch redirect before cross-origin dispatch / 166.153 ms / pass
- chromium / real Chromium checks every xhr redirect before cross-origin dispatch / 152.622 ms / pass
- chromium / real Chromium checks every script redirect before cross-origin dispatch / 187.164 ms / pass
- chromium / real Chromium checks every stylesheet redirect before cross-origin dispatch / 147.548 ms / pass
- chromium / real Chromium checks every image redirect before cross-origin dispatch / 145.398 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(guard.snapshotRequests().some(row => row.outcome === "REDIRECT_BLOCKED"), JSON.stringify({ arrivals, requests: guard.snapshotRequests(), diagnostics: guard.snapshotDiagnostics() }))`
- `assert.equal(arrivals.includes("B/forbidden"), false, "cross-origin receiver must receive zero requests")`

保护：GUARD_REAL_CHROMIUM_BOUNDARY

### 293 — real Chromium redirect loops fail at the Guard hop bound

**KEEP_PROTECTED**

- chromium / real Chromium redirect loops fail at the Guard hop bound / 167.279 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(guard.snapshotRequests().some(row => row.outcome === "REDIRECT_BLOCKED"), JSON.stringify({ arrivals, requests: guard.snapshotRequests(), diagnostics: guard.snapshotDiagnostics() }))`
- `assert.ok(arrivals.filter(x => x.startsWith("A/loop/")).length <= 10, "Guard must bound redirects before Chromium's own limit")`

保护：GUARD_REAL_CHROMIUM_BOUNDARY

### 300 — real Chromium protects popup navigation before its first redirect

**KEEP_PROTECTED**

- chromium / real Chromium protects popup navigation before its first redirect / 165.653 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(guard.snapshotRequests().some(r => r.outcome === "REDIRECT_BLOCKED"))`
- `assert.equal(arrivals.includes("B/forbidden"), false)`

保护：GUARD_REAL_CHROMIUM_BOUNDARY

### 311 — real Chromium protects iframe redirect chains

**KEEP_PROTECTED**

- chromium / real Chromium protects iframe redirect chains / 135.236 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(guard.snapshotRequests().some(r => r.outcome === "REDIRECT_BLOCKED"))`
- `assert.equal(arrivals.includes("B/forbidden"), false)`

保护：GUARD_REAL_CHROMIUM_BOUNDARY

### 317 — real Chromium preserves normal allowed popup redirect navigation

**KEEP_PROTECTED**

- chromium / real Chromium preserves normal allowed popup redirect navigation / 150.668 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(await popup.locator("h1").textContent(), "Public result")`
- `assert.equal(await popup.locator("#relative").evaluate((el: HTMLAnchorElement) => el.href), origin + "/result/next")`

保护：GUARD_REAL_CHROMIUM_BOUNDARY

### 326 — real Chromium protects dedicated-worker fetch redirects

**KEEP_PROTECTED**

- chromium / real Chromium protects dedicated-worker fetch redirects / 127.753 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(outcome, "blocked", JSON.stringify({ requests: guard.snapshotRequests(), diagnostics: guard.snapshotDiagnostics(), arrivals }))`
- `assert.ok(arrivals.includes("A/worker.js"), "the allowed worker script must actually execute before its fetch is guarded")`
- `assert.ok(guard.snapshotRequests().some(row => row.pathname === "/worker.js" && row.resourceType === "script" && row.outcome === "ADMITTED"))`

保护：GUARD_REAL_CHROMIUM_BOUNDARY

### 341 — reviewed stylesheet redirects preserve their URL without promoting the CDN to generic public reads

**KEEP_PROTECTED**

- chromium / reviewed stylesheet redirects preserve their URL without promoting the CDN to generic public reads / 137.986 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(guard.snapshotRequests().some(row => row.origin === other && row.pathname === "/private.css" && row.outcome === "BLOCKED"), "relative CSS import is resolved against the final CDN URL and remains rule-bound")`
- `assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).color), "rgb(1, 2, 3)")`
- `assert.ok(arrivals.includes("B/public/final.css"))`

保护：GUARD_REAL_CHROMIUM_BOUNDARY

### 350 — T1 native redirect URL-normalization attempts keep forbidden receivers untouched

**KEEP_PROTECTED**

- chromium / T1 native redirect URL-normalization attempts keep forbidden receivers untouched / 1065.472 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(arrivals.includes("A/normalize-hop"), "Chromium must actually follow the first allowed redirect")`
- `assert.ok(guard.snapshotRequests().some(row => row.outcome === "REDIRECT_BLOCKED"))`
- `assert.equal(arrivals.filter(row => row.startsWith("B/")).length, 0, "normalization must never reach a forbidden receiver")`

保护：GUARD_REAL_CHROMIUM_BOUNDARY

### 351 — form

**KEEP_PROTECTED**

- chromium / fragment / 134.978 ms / pass
- chromium / dot / 150.760 ms / pass
- chromium / encodedDot / 145.755 ms / pass
- chromium / escaped / 133.232 ms / pass
- chromium / queryEscape / 133.106 ms / pass
- chromium / slash / 133.461 ms / pass
- chromium / unicode / 116.314 ms / pass
- chromium / protocolRelative / 117.130 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(arrivals.includes("A/normalize-hop"), "Chromium must actually follow the first allowed redirect")`
- `assert.ok(guard.snapshotRequests().some(row => row.outcome === "REDIRECT_BLOCKED"))`
- `assert.equal(arrivals.filter(row => row.startsWith("B/")).length, 0, "normalization must never reach a forbidden receiver")`

保护：GUARD_REAL_CHROMIUM_BOUNDARY

### 361 — `T1 CDP independently rejects an unrecognized paused ${mode} request`

**KEEP_PROTECTED**

- chromium / T1 CDP independently rejects an unrecognized paused origin request / 147.795 ms / pass
- chromium / T1 CDP independently rejects an unrecognized paused method request / 121.002 ms / pass
- chromium / T1 CDP independently rejects an unrecognized paused resource-type request / 130.865 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(arrivals.includes("A/page"), "a public allowed control must reach its real receiver")`
- `assert.ok(guard.snapshotRequests().some(row => row.outcome === "BLOCKED"))`
- `assert.equal(forbidden.length, 0, \`CDP must reject the unrecognized ${mode} request before receiver arrival\`)`

保护：GUARD_REAL_CHROMIUM_BOUNDARY

### 375 — TableCheck public search JSON reaches an independent receiver while writes, other paths and fields stay blocked

**KEEP_PROTECTED**

- chromium / TableCheck public search JSON reaches an independent receiver while writes, other paths and fields stay blocked / 161.783 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(recording.replay.status,'REPLAYABLE')`
- `assert.ok(apiAddress&&typeof apiAddress!=='string'&&siteAddress&&typeof siteAddress!=='string')`
- `assert.equal(await get('/catalog.json'),true,'observed exact public catalog GET must arrive')`

保护：GUARD_REAL_CHROMIUM_BOUNDARY

### 413 — TableCheck browser preflight is tied to its reviewed GET or POST and rejects unknown methods, headers, paths and bodies

**KEEP_PROTECTED**

- chromium / TableCheck browser preflight is tied to its reviewed GET or POST and rejects unknown methods, headers, paths and bodies / 1106.903 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(red.requests.some((r:any)=>r.method==='OPTIONS'&&r.outcome==='BLOCKED'&&JSON.stringify(r.queryKeys)===JSON.stringify(facetKeys)))`
- `assert.ok(green.requests.some((r:any)=>r.method==='GET'&&r.outcome==='ADMITTED'&&JSON.stringify(r.queryKeys)===JSON.stringify(facetKeys)))`
- `assert.equal(ok, ["get", "xhr", "missing-network-marker", "facet-no-hits", "catalog", "default-get", "static-get", "calendar-post", "calendar-xhr"].includes(mode), \`${mode}: browser read handshake must reach receiver; disallowed requests must not\`)`

保护：GUARD_REAL_CHROMIUM_BOUNDARY

## src/harness/browser/recorded-reference.test.ts

保存F5观察的RAW stale-ref红灯与同语义重绑绿灯成对，仍验证当前解码/DOM合同；用户取消旧整包并不废除此最小回归。

### 10 — F5 recorded region action rebinds to the same observed link and reaches the next saved page

**KEEP_PROTECTED**

- chromium / F5 recorded region action rebinds to the same observed link and reaches the next saved page / 6239.948 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(selected.href, "https://tabelog.com/en/tokyo/A1322/")`
- `assert.equal(result.status, "NO_SAFE_ACTION")`
- `assert.ok(diagnostics.some(row => row.event === "REJECTED" && row.detail === "STALE_OR_UNKNOWN_TARGET_REF"))`

保护：EXPLICIT_HISTORICAL_REGRESSION

## src/harness/browser/recording-keys.test.ts

assert在runRecordingKeyScenario helper内，不能以外层零assert删掉；真实录制/脱敏/缺脚本停止和接收器零流量均受检。

### 7 — slot1 map DOM records in real Chromium and replays up to the first unqualified page without source traffic

**KEEP_PROTECTED**

- chromium / slot1 map DOM records in real Chromium and replays up to the first unqualified page without source traffic / 402.630 ms / pass

检错依据（精确原断言；全文见 source card）：

- `runRecordingKeyScenario: record and replay real local Chromium, all files scanned for credentials, unqualified page stops before source traffic (fixtures/recording-key-scenario.ts:37-74)`

保护：CREDENTIAL_AND_PARTIAL_REPLAY

## src/harness/browser/replay-missing-response.test.ts

Guard允许但HAR缺字节须零流量停止；与Guard本身拒绝请求不同，属于独立网络边界。

### 12 — missing HAR response is stopped without any network fallback

**KEEP_PROTECTED**

- chromium / missing HAR response is stopped without any network fallback / 296.518 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(recording.pages[0]!.status,"REPLAYABLE")`
- `assert.equal(hits,0,"unrecorded CSS must not reach even the local source")`
- `assert.equal((stopped as any)?.reason,"MISSING_RESPONSE")`

保护：REPLAY_ZERO_NETWORK_ESCAPE

## src/harness/browser/runner-interruption.test.ts

真实子进程退出/信号中断后仍独立评S0，不能因外层失败掩盖已展示错误；禁止删除的评价器检查。

### 9 — `formal Runner real subprocess ${mode} persists execution and supports independent S0`

**KEEP_PROTECTED**

- chromium / formal Runner real subprocess complete persists execution and supports independent S0 / 1784.232 ms / pass
- chromium / formal Runner real subprocess signal persists execution and supports independent S0 / 1691.334 ms / pass
- chromium / formal Runner real subprocess deadline persists execution and supports independent S0 / 1691.843 ms / pass
- chromium / formal Runner real subprocess external persists execution and supports independent S0 / 1663.804 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(evaluation.severity.S0_DECLARATION.status, "ABSENT")`
- `assert.equal(evaluation.severity.S0_BOUNDARY.status, "ABSENT")`
- `assert.equal(evaluation.outcome.type, "ORCHESTRATION_INTERRUPTED")`

保护：POST_INTERRUPTION_S0

## src/harness/browser/runner-pacing.test.ts

跨进程共享origin、单Run零等待和第三Run排队/释放覆盖不同并发阶段；实际请求间隔是运行规范，不是私有次数。

### 34 — shared origin pacing spans two real subprocesses

**KEEP_DISTINCT_CONTRACT**

- chromium / shared origin pacing spans two real subprocesses / 1032.071 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(differences.every(ms => ms >= 200), \`source intervals ${differences}\`)`
- `assert.equal(fixture.hits.length, 4)`
- `assert.ok([a,b].some(run => Object.values(run.messages.find(m => m.stage === "DONE").usage).some((row: any) => row.waitMs > 0)))`

### 49 — one run has exactly zero pacing wait

**KEEP_DISTINCT_CONTRACT**

- chromium / one run has exactly zero pacing wait / 274.601 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(Object.values(usage), [{ requests: 2, waitMs: 0 }])`

### 59 — `third queues and ${stop} releases in-flight ownership`

**KEEP_DISTINCT_CONTRACT**

- chromium / third queues and SIGTERM releases in-flight ownership / 1206.328 ms / pass
- chromium / third queues and timeout releases in-flight ownership / 1195.201 ms / pass
- chromium / third queues and stop releases in-flight ownership / 1192.063 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(!c.messages.some(m => m.stage === "ENTERED"))`
- `assert.equal(fixture.coordinator.snapshot().heldLeases, 0)`
- `assert.ok(!fixture.coordinator.snapshot().activeRuns.includes("interrupted"))`

## src/harness/browser/runner-post-exit.test.ts

每槽退出立即独立评价及已提交reviewed-reads SHA/提交身份绑定全为Live修复红灯，保护NOT_EVALUATED失败收据。

### 11 — each exited slot is independently evaluated before another slot exits, including nonzero and missing artifacts

**KEEP_PROTECTED**

- chromium / each exited slot is independently evaluated before another slot exits, including nonzero and missing artifacts / 2193.522 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(summary.exits.find((row:any)=>row.id==='first').code,7)`
- `assert.equal(summary.exits.find((row:any)=>row.id==='second').code,0,'first receipt must be saved while second is still running; '+Buffer.concat(logs.second!).toString().slice(-1200))`
- `assert.equal(summary.exits.find((row:any)=>row.id==='missing').code,9)`

保护：LIVE_FAILURE_AND_POST_EXIT_S0

### 53 — single-slot CLI supervisor immediately reports independent review hash failure instead of S0 absence

**KEEP_PROTECTED**

- chromium / single-slot CLI supervisor immediately reports independent review hash failure instead of S0 absence / 1903.614 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(receipt.exit.code,0)`
- `assert.equal(receipt.status,'NOT_EVALUATED')`
- `assert.equal(receipt.failureCode,'REVIEWED_READS_SHA_MISMATCH')`

保护：LIVE_FAILURE_AND_POST_EXIT_S0

### 65 — post-exit evaluator rejects an uncommitted catalog even with its matching SHA

**KEEP_PROTECTED**

- chromium / post-exit evaluator rejects an uncommitted catalog even with its matching SHA / 1867.302 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(receipt.exit.code,0)`
- `assert.equal(receipt.status,'NOT_EVALUATED')`
- `assert.equal(receipt.failureCode,'INVALID_REVIEWED_READS_REFERENCE')`

保护：LIVE_FAILURE_AND_POST_EXIT_S0

## src/harness/browser/runner-replay.test.ts

当前Runner非空交付、模型/来源边界、缺响应/脚本、重定向和可选图像各自证据资格不同；新录制验收将复用这些机制。

### 11 — recorded decisions reproduce nonempty candidates and delivery under OS-denied network

**KEEP_DISTINCT_CONTRACT**

- chromium / recorded decisions reproduce nonempty candidates and delivery under OS-denied network / 3650.277 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.summary.status,"COMPLETED",JSON.stringify(result.summary))`
- `assert.equal(result.fixtureModelCalls,0)`
- `assert.equal(result.evaluation.executionSource,"REPLAY")`

### 22 — `replay ${mode} preserves source/progress and model boundaries`

**KEEP_DISTINCT_CONTRACT**

- chromium / replay missing preserves source/progress and model boundaries / 2209.767 ms / pass
- chromium / replay partial preserves source/progress and model boundaries / 2988.720 ms / pass
- chromium / replay model-wiring preserves source/progress and model boundaries / 3360.128 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.evaluation.outcome.capabilityDenominator,"EXCLUDED")`
- `assert.equal(result.summary.status,"COMPLETED")`
- `assert.ok(result.fixtureModelCalls>0)`

### 49 — recorded document redirects reach the qualified final snapshot through real Chromium and Guard

**KEEP_DISTINCT_CONTRACT**

- chromium / recorded document redirects reach the qualified final snapshot through real Chromium and Guard / 143.166 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(stops,[],'a recorded301 to a qualified final document must not be rejected before snapshot1')`
- `assert.ok(recording.entries.some(entry=>entry.request.url===first&&entry.response.status===301),'retain the original recorded redirect, never synthesize a200')`
- `assert.ok(address&&typeof address!=='string')`

### 69 — a missing optional image fails and is recorded without inventing bytes or rejecting a qualified document

**KEEP_DISTINCT_CONTRACT**

- chromium / a missing optional image fails and is recorded without inventing bytes or rejecting a qualified document / 118.750 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(replay.missingRequests(),[{snapshot:1,origin,pathname:'/not-recorded',reason:'MISSING_RESPONSE',method:'GET',resourceType:'image'}])`
- `assert.ok(address&&typeof address!=='string')`
- `assert.deepEqual(stops,[],'image bytes are not a required page qualification and must never be fabricated')`

### 85 — redirect qualification cannot promote an unqualified final page, missing hop or cycle

**KEEP_DISTINCT_CONTRACT**

- chromium / redirect qualification cannot promote an unqualified final page, missing hop or cycle / 3.005 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(recording.allowed.has(first),false,kind)`

### 93 — replay checks missing responses after Guard admission, retaining denial and missing-entry boundaries

**KEEP_DISTINCT_CONTRACT**

- chromium / replay checks missing responses after Guard admission, retaining denial and missing-entry boundaries / 247.098 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(snapshot?.networkRequests?.some(row=>row.method==='POST'&&row.pathname==='/not-recorded'&&row.outcome==='BLOCKED'),'the unchanged Guard must actually deny the POST')`
- `assert.deepEqual(stops.map(row=>row.reason),['MISSING_RESPONSE'],'an admitted missing GET must still fail closed')`
- `assert.deepEqual(stops,[],'a Guard-denied telemetry request is not a missing admitted recording')`

## src/harness/restaurant-execution-router.test.ts

Router真实read端口与state结算、默认结果窗口/部分子结果及F6预算交接是关键集成；不同预算耗尽原因不能并入同一个泛型UNKNOWN。

### 31 — Execution Router binds only the matching durable search cursor; the Agent cannot supply or reuse one after an intent change

**KEEP_DISTINCT_CONTRACT**

- default / Execution Router binds only the matching durable search cursor; the Agent cannot supply or reuse one after an intent change / 2.197 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(requests[0]?.continuation?.nextPageToken, "page-3")`
- `assert.equal(requests[1]?.continuation, undefined)`

### 61 — Execution Router aborts and bounds a Provider search read that exceeds its deadline

**KEEP_DISTINCT_CONTRACT**

- default / Execution Router aborts and bounds a Provider search read that exceeds its deadline / 2.356 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(execution.failure?.source, "PROVIDER")`
- `assert.equal(execution.failure?.code, "SEARCH_FAILED")`
- `assert.match(execution.failure?.reason ?? "", /timed out after 1ms/)`

### 92 — Execution Router returns at its deadline even when a Provider ignores abort

**KEEP_DISTINCT_CONTRACT**

- default / Execution Router returns at its deadline even when a Provider ignores abort / 2.113 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(execution.failure?.source, "PROVIDER")`
- `assert.equal(execution.failure?.code, "SEARCH_FAILED")`
- `assert.match(execution.failure?.reason ?? "", /timed out after 1ms/)`

### 111 — Execution Router retains source-owned Google request accounting when a sent read fails

**KEEP_DISTINCT_CONTRACT**

- default / Execution Router retains source-owned Google request accounting when a sent read fails / 1.206 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(execution.failure?.code, "GOOGLE_NETWORK_FAILED")`
- `assert.deepEqual(execution.executionMetadata?.googleRequests, { limit: 100, total: 4, namedPlaceResolution: 1, discovery: 2, placeDetails: 1, reverseAddressObservation: 0, })`

### 133 — Execution Router passes only bound availability arguments and its deadline signal to the adapter

**KEEP_DISTINCT_CONTRACT**

- default / Execution Router passes only bound availability arguments and its deadline signal to the adapter / 5.462 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(receivedRequest, { candidateIds: [fixtureCandidates[0]!.restaurant.id], candidates: [fixtureCandidates[0]!], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: fixtureIntent.partySize, hardCriteria: ["yakiniku"], })`
- `assert.ok(receivedSignal instanceof AbortSignal)`
- `assert.equal(execution.route, "STRUCTURED_ADAPTER")`

### 175 — Execution Router preserves a current exact immediate request for source-side slot verification

**KEEP_DISTINCT_CONTRACT**

- default / Execution Router preserves a current exact immediate request for source-side slot verification / 0.233 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(calls, 1)`
- `assert.equal(execution.event?.availabilityChecks[fixtureCandidates[0]!.restaurant.id]?.status, "UNKNOWN")`
- `assert.equal(execution.event?.type, "AVAILABILITY_CHECKED")`

### 201 — Execution Router forwards only a current exact immediate slot to the provider

**KEEP_DISTINCT_CONTRACT**

- default / Execution Router forwards only a current exact immediate slot to the provider / 0.229 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(execution.event?.availabilityChecks[fixtureCandidates[0]!.restaurant.id]?.status, "UNAVAILABLE")`
- `assert.deepEqual(received, { candidateIds: [fixtureCandidates[0]!.restaurant.id], candidates: [fixtureCandidates[0]!], date: fixtureIntent.date, timeWindow: { earliest: "12:00", latest: "12:00" }, immediateAvailability: { validUntil: "2026-08-05T09:01:00.000Z", sourceSlotPolicy: "EARLIEST_IN_WINDOW" }, partySize: fixtureIntent.partySize, hardCriteria: ["yakiniku"], })`
- `assert.equal(execution.event?.type, "AVAILABILITY_CHECKED")`

### 247 — Execution Router binds a fact-only read to known candidates and the authoritative recommendation intent

**KEEP_DISTINCT_CONTRACT**

- default / Execution Router binds a fact-only read to known candidates and the authoritative recommendation intent / 0.265 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(received, { candidateIds: [fixtureCandidates[0]!.restaurant.id], candidates: [fixtureCandidates[0]], intent: { timezone: fixtureIntent.timezone, target: fixtureIntent.target, date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: fixtureIntent.partySize, area: fixtureIntent.area, criteria: fixtureIntent.criteria, budgetPerPerson: fixtureIntent.budgetPerPerson, }, })`
- `assert.equal(execution.event?.type, "CANDIDATE_FACTS_CHECKED")`

### 284 — ADR-0044 Router may add a current slot to a recommendation without changing its goal

**KEEP_G3_COORDINATION**

- default / ADR-0044 Router may add a current slot to a recommendation without changing its goal / 37.762 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal((await composition.interpretAndDispatch({ taskId, message: "Find cafes nearby tomorrow afternoon for two.", referenceTime: now.toISOString(), timezone: "Asia/Tokyo" }, HIGASHI_GINZA_EVALUATION_LOCATION)).status, "PROPOSED")`
- `assert.equal((await composition.coordinator.run(taskId)).status, "TERMINAL")`
- `assert.equal(after.phase, "PRESENT_RESULTS")`

### 327 — Execution Router keeps a shared browser startup failure candidate-scoped after all requested candidates fail

**KEEP_DISTINCT_CONTRACT**

- default / Execution Router keeps a shared browser startup failure candidate-scoped after all requested candidates fail / 0.216 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(execution.failure, undefined)`

### 349 — Execution Router preserves all-provider browser failure evidence without escalating it to task terminal

**KEEP_DISTINCT_CONTRACT**

- default / Execution Router preserves all-provider browser failure evidence without escalating it to task terminal / 0.152 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(execution.failure, undefined)`

### 381 — Router partial-port contract: an explicitly permitted alternate time is queried as a bounded range and presented as an alternate, without changing the original request (packs=Google; maxAgentSteps=6, maxRejectedActions=3, maxAutomaticBrowserMs=500000, maxStructuredReadMs=8000)

**KEEP_G3_COORDINATION**

- default / Router partial-port contract: an explicitly permitted alternate time is queried as a bounded range and presented as an alternate, without changing the original request (packs=Google; maxAgentSteps=6, maxRejectedActions=3, maxAutomaticBrowserMs=500000, maxStructuredReadMs=8000) / 19.405 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal((await composition.coordinator.run(taskId)).status, "TERMINAL")`
- `assert.equal(state.phase, "PRESENT_RESULTS", JSON.stringify(state.availabilityChecks))`
- `assert.deepEqual(state.intentDraft?.timeWindow, { earliest: "19:00", latest: "19:00" })`

### 438 — Router partial-port contract: fresh request-bound inventory can receive missing facts before another inventory read and reach three results (packs=Google; maxAgentSteps=12, maxRejectedActions=3, maxAutomaticBrowserMs=500000, maxStructuredReadMs=8000)

**KEEP_G3_COORDINATION**

- default / Router partial-port contract: fresh request-bound inventory can receive missing facts before another inventory read and reach three results (packs=Google; maxAgentSteps=12, maxRejectedActions=3, maxAutomaticBrowserMs=500000, maxStructuredReadMs=8000) / 43.909 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal((await composition.coordinator.run(taskId)).status, "TERMINAL", JSON.stringify(actions))`
- `assert.equal(state.phase, "PRESENT_RESULTS", JSON.stringify({ actions, presentation: projectRestaurantAgentContext(state, now.toISOString()).presentation }))`
- `assert.equal(request.purpose, "restaurant_agent_decide")`

### 507 — Router partial-port contract: default delivery keeps a produced source-backed result when the next availability batch would consume the reserve (packs=Google; maxAgentSteps=8, maxRejectedActions=3, maxAutomaticBrowserMs=300000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / Router partial-port contract: default delivery keeps a produced source-backed result when the next availability batch would consume the reserve (packs=Google; maxAgentSteps=8, maxRejectedActions=3, maxAutomaticBrowserMs=300000, maxStructuredReadMs=8000) / 21.296 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "TERMINAL", JSON.stringify({ actions, calls, phase: final.phase }))`
- `assert.equal(final.phase, "PRESENT_RESULTS")`
- `assert.equal(calls, mode === "slow-read" ? 2 : 1, "the read must not consume the delivery reserve")`

### 508 — mode

**KEEP_G3_COORDINATION**

- default / slow-read / 11.816 ms / pass
- default / slow-decision / 9.141 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "TERMINAL", JSON.stringify({ actions, calls, phase: final.phase }))`
- `assert.equal(final.phase, "PRESENT_RESULTS")`
- `assert.equal(calls, mode === "slow-read" ? 2 : 1, "the read must not consume the delivery reserve")`

### 595 — Router partial-port contract: model-call delivery reserve presents a source-backed short batch without relaxing qualification (packs=Google; maxAgentSteps=10, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / Router partial-port contract: model-call delivery reserve presents a source-backed short batch without relaxing qualification (packs=Google; maxAgentSteps=10, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000) / 23.237 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(state.phase, "PRESENT_RESULTS", JSON.stringify({ contexts, state }))`
- `assert.equal(reads, 1, "budget reserve blocks another source read while an eligible result exists")`
- `assert.equal(offers[0]?.dateTime, "2026-09-17T19:00:00+09:00")`

### 600 — mode

**KEEP_G3_COORDINATION**

- default / ready / 3.225 ms / pass
- default / crossing / 10.647 ms / pass
- default / wrong-party / 3.667 ms / pass
- default / expired / 2.914 ms / pass
- default / explicit-count / 2.364 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(state.phase, "PRESENT_RESULTS", JSON.stringify({ contexts, state }))`
- `assert.equal(reads, 1, "budget reserve blocks another source read while an eligible result exists")`
- `assert.equal(offers[0]?.dateTime, "2026-09-17T19:00:00+09:00")`

### 682 — Router partial-port contract: C0b reserves the last four calls inside a provider read and then presents (packs=Google; maxAgentSteps=10, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / Router partial-port contract: C0b reserves the last four calls inside a provider read and then presents (packs=Google; maxAgentSteps=10, maxRejectedActions=3, maxAutomaticBrowserMs=50000000, maxStructuredReadMs=8000) / 59.263 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(state.phase, "PRESENT_RESULTS", JSON.stringify({ contexts, state }))`
- `assert.equal(budget.usage(taskId)?.calls, 6, "one browser call followed by delivery preserves the four-call reserve")`
- `assert.equal(offers[0]?.dateTime, "2026-09-17T19:00:00+09:00")`

### 687 — mode

**KEEP_G3_COORDINATION**

- default / ready / 37.355 ms / pass
- default / no-qualified / 5.605 ms / pass
- default / expired / 15.777 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(state.phase, "PRESENT_RESULTS", JSON.stringify({ contexts, state }))`
- `assert.equal(budget.usage(taskId)?.calls, 6, "one browser call followed by delivery preserves the four-call reserve")`
- `assert.equal(offers[0]?.dateTime, "2026-09-17T19:00:00+09:00")`

### 781 — Router partial-port contract: C6a observed public hours end the immediate window only when every checked page has no opening period (packs=Google; maxAgentSteps=4, maxRejectedActions=3, maxAutomaticBrowserMs=500000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / Router partial-port contract: C6a observed public hours end the immediate window only when every checked page has no opening period (packs=Google; maxAgentSteps=4, maxRejectedActions=3, maxAutomaticBrowserMs=500000, maxStructuredReadMs=8000) / 274.809 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(state.phase,'NO_VERIFIED_RESULT',JSON.stringify(state))`
- `assert.ok(Object.values(state.availabilityChecks).every(check=>check.status!=='UNAVAILABLE'))`
- `assert.ok(inventoryReads>0,'one closed outlet, an open/unknown source or non-immediate hours cannot suppress further reads')`

### 782 — mode

**KEEP_DISTINCT_CONTRACT**

- default / closed / 23.543 ms / pass
- default / outside / 9.428 ms / pass
- default / open / 13.559 ms / pass
- default / partial / 9.698 ms / pass
- default / unknown / 21.127 ms / pass
- default / malformed / 34.322 ms / pass
- default / ambiguous-closed / 13.366 ms / pass
- default / wrong-day / 46.572 ms / pass
- default / overnight / 9.531 ms / pass
- default / api-only / 36.809 ms / pass
- default / explicit-time / 13.879 ms / pass
- default / one-closed / 4.796 ms / pass
- default / three-two-closed-one-open / 36.471 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(state.phase,'NO_VERIFIED_RESULT',JSON.stringify(state))`
- `assert.ok(Object.values(state.availabilityChecks).every(check=>check.status!=='UNAVAILABLE'))`
- `assert.ok(inventoryReads>0,'one closed outlet, an open/unknown source or non-immediate hours cannot suppress further reads')`

### 823 — Router partial-port contract: reserve checkpoints retain completed outlets and mark only unfinished ones UNKNOWN (packs=Google; maxAgentSteps=10, maxRejectedActions=3, maxAutomaticBrowserMs=mode.endsWith("-time")?300000:500000, maxStructuredReadMs=8000)

**KEEP_DISTINCT_CONTRACT**

- default / Router partial-port contract: reserve checkpoints retain completed outlets and mark only unfinished ones UNKNOWN (packs=Google; maxAgentSteps=10, maxRejectedActions=3, maxAutomaticBrowserMs=mode.endsWith("-time")?300000:500000, maxStructuredReadMs=8000) / 104.805 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(state.phase,mode==="empty-call"?"NO_VERIFIED_RESULT":"PRESENT_RESULTS",JSON.stringify({mode,inspected,state}))`
- `assert.equal(Object.values(checks).filter(x=>x.status==="UNKNOWN"&&x.reasonCode==="RESERVE_REACHED").length,mode==="empty-call"?3:2)`
- `assert.ok((budget.usage(taskId)?.calls??Infinity)<(mode.endsWith("-time")?50:mode==="empty-call"?8:12))`

### 824 — mode

**KEEP_G3_COORDINATION**

- default / availability-call / 22.160 ms / pass
- default / availability-time / 30.378 ms / pass
- default / empty-call / 24.217 ms / pass
- default / facts-call / 9.741 ms / pass
- default / facts-time / 9.746 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(state.phase,mode==="empty-call"?"NO_VERIFIED_RESULT":"PRESENT_RESULTS",JSON.stringify({mode,inspected,state}))`
- `assert.equal(Object.values(checks).filter(x=>x.status==="UNKNOWN"&&x.reasonCode==="RESERVE_REACHED").length,mode==="empty-call"?3:2)`
- `assert.ok((budget.usage(taskId)?.calls??Infinity)<(mode.endsWith("-time")?50:mode==="empty-call"?8:12))`

## src/harness/restaurant-harness.test.ts

H01授权正常控制及重复/错Attempt/未知Outcome保护；只读续搜、刷新和追问保留真实Reducer链，旧书写路径仍是当前受控写架构合同。

### 13 — restaurant booking mock harness

**GROUP_NOT_A_TEST**

- default / restaurant booking mock harness / 114.352 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(snapshot.domainState.phase, "BOOKED_VERIFIED")`
- `assert.equal(snapshot.outcome?.status, "BOOKED_VERIFIED")`
- `assert.equal(snapshot.domainState.evidence?.strength, "STRONG")`

### 14 — H01 completes a verified booking through the authorized happy path

**KEEP_PROTECTED**

- default / H01 completes a verified booking through the authorized happy path / 8.722 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(snapshot.domainState.phase, "BOOKED_VERIFIED")`
- `assert.equal(snapshot.outcome?.status, "BOOKED_VERIFIED")`
- `assert.equal(snapshot.domainState.evidence?.strength, "STRONG")`

保护：AUTHORIZATION_IDEMPOTENCY_OR_OUTCOME

### 28 — H02/H03/H04 retain the bounded discovered candidate pool and stop the proposed booking before authorization

**KEEP_PROTECTED**

- default / H02/H03/H04 retain the bounded discovered candidate pool and stop the proposed booking before authorization / 2.778 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(snapshot.domainState.phase, "AWAITING_AUTHORIZATION")`
- `assert.equal(snapshot.domainState.candidates.length, 4)`
- `assert.equal(harness.countCommands("COMMIT_BOOKING"), 0)`

保护：AUTHORIZATION_IDEMPOTENCY_OR_OUTCOME

### 38 — continues from three unavailable candidates to a fourth discovered candidate without changing the request

**KEEP_DISTINCT_CONTRACT**

- default / continues from three unavailable candidates to a fourth discovered candidate without changing the request / 4.535 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(snapshot.domainState.phase, "AWAITING_AUTHORIZATION")`
- `assert.equal(snapshot.domainState.selectedCandidateId, fourth.restaurant.id)`
- `assert.equal(snapshot.domainState.availabilityChecks[fixtureCandidates[0]!.restaurant.id]?.status, "UNAVAILABLE")`

### 59 — H05 resumes the Agent after a definitive commit failure and requires a new authorization

**KEEP_PROTECTED**

- default / H05 resumes the Agent after a definitive commit failure and requires a new authorization / 8.587 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(resumed.domainState.phase, "AWAITING_AUTHORIZATION")`
- `assert.equal(resumed.domainState.selectedCandidateId, second.restaurant.id)`
- `assert.equal(afterSecondAuthorization.domainState.phase, "NEEDS_INPUT")`

保护：AUTHORIZATION_IDEMPOTENCY_OR_OUTCOME

### 107 — Agent resumes after BOOKING_ABSENT with a new candidate proposal awaiting authorization

**KEEP_PROTECTED**

- default / Agent resumes after BOOKING_ABSENT with a new candidate proposal awaiting authorization / 9.753 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(snapshot.domainState.phase, "AWAITING_AUTHORIZATION")`
- `assert.equal(snapshot.domainState.failure?.code, "BOOKING_ABSENT")`
- `assert.equal(snapshot.domainState.selectedCandidateId, second.restaurant.id)`

保护：AUTHORIZATION_IDEMPOTENCY_OR_OUTCOME

### 138 — H06 weak evidence after submit becomes OUTCOME_UNKNOWN

**KEEP_PROTECTED**

- default / H06 weak evidence after submit becomes OUTCOME_UNKNOWN / 9.400 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(snapshot.domainState.phase, "OUTCOME_UNKNOWN")`
- `assert.equal(snapshot.domainState.evidence?.strength, "WEAK")`
- `assert.equal(snapshot.outcome?.status, "OUTCOME_UNKNOWN")`

保护：AUTHORIZATION_IDEMPOTENCY_OR_OUTCOME

### 151 — H07 OUTCOME_UNKNOWN blocks selecting and committing another candidate

**KEEP_PROTECTED**

- default / H07 OUTCOME_UNKNOWN blocks selecting and committing another candidate / 9.235 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(snapshot.domainState.phase, "OUTCOME_UNKNOWN")`
- `assert.rejects( harness.send({ type: "CANDIDATE_SELECTED", candidateId: "restaurant-2" }), /invalid while restaurant task is OUTCOME_UNKNOWN/, )`
- `assert.equal(harness.countCommands("COMMIT_BOOKING"), 1)`

保护：AUTHORIZATION_IDEMPOTENCY_OR_OUTCOME

### 166 — H08 replaying a commit command does not repeat the side effect

**KEEP_DISTINCT_CONTRACT**

- default / H08 replaying a commit command does not repeat the side effect / 8.615 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(replayed, true)`
- `assert.equal(harness.countCommands("COMMIT_BOOKING"), 1)`
- `assert.equal(harness.ledger.records.length, 1)`

### 178 — H09 mismatched booking details cannot produce BOOKED_VERIFIED

**KEEP_DISTINCT_CONTRACT**

- default / H09 mismatched booking details cannot produce BOOKED_VERIFIED / 17.307 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(snapshot.domainState.phase, "OUTCOME_UNKNOWN")`
- `assert.deepEqual(snapshot.domainState.evidence?.conflictingFields, [ "restaurantId", "dateTime", "partySize", ])`
- `assert.equal(snapshot.outcome?.status, "OUTCOME_UNKNOWN")`

### 197 — H10 evidence from another attempt cannot produce BOOKED_VERIFIED

**KEEP_PROTECTED**

- default / H10 evidence from another attempt cannot produce BOOKED_VERIFIED / 4.016 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(snapshot.domainState.phase, "OUTCOME_UNKNOWN")`
- `assert.deepEqual(snapshot.domainState.evidence?.conflictingFields, ["attemptId"])`
- `assert.equal(snapshot.outcome?.status, "OUTCOME_UNKNOWN")`

保护：AUTHORIZATION_IDEMPOTENCY_OR_OUTCOME

### 212 — H11 run artifact preserves the causal chain, proof and side-effect ledger

**KEEP_DISTINCT_CONTRACT**

- default / H11 run artifact preserves the causal chain, proof and side-effect ledger / 2.772 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(artifact.finalSnapshot.outcome?.status, "BOOKED_VERIFIED")`
- `assert.equal(artifact.evidence.length, 1)`
- `assert.equal(Array.isArray(trajectory.causalRefs.evidenceIds), true)`

### 273 — Agent can request a second search strategy after the first discovery

**KEEP_DISTINCT_CONTRACT**

- default / Agent can request a second search strategy after the first discovery / 1.147 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(snapshot.domainState.phase, "NEEDS_INPUT")`
- `assert.deepEqual(actions, ["SEARCH_RESTAURANTS", "SEARCH_RESTAURANTS", "ASK_USER"])`

### 287 — a same-request supplementary search preserves completed checks and deduplicates the candidate pool

**KEEP_DISTINCT_CONTRACT**

- default / a same-request supplementary search preserves completed checks and deduplicates the candidate pool / 1.503 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(snapshot.domainState.candidates.length, fixtureCandidates.length)`
- `assert.equal(snapshot.domainState.availabilityChecks[first.restaurant.id]?.status, "UNAVAILABLE")`
- `assert.equal(snapshot.domainState.candidates.filter((candidate) => candidate.restaurant.id === first.restaurant.id).length, 1)`

### 304 — a changed authoritative condition invalidates prior candidate and availability evidence

**KEEP_DISTINCT_CONTRACT**

- default / a changed authoritative condition invalidates prior candidate and availability evidence / 1.508 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(changed.candidates, [])`
- `assert.deepEqual(changed.readEvidence, [])`
- `assert.equal(changed.intent, undefined)`

### 322 — Agent checks an unavailable candidate then independently checks and selects another

**KEEP_DISTINCT_CONTRACT**

- default / Agent checks an unavailable candidate then independently checks and selects another / 2.163 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual( trajectories.flatMap((step) => step.agentAction?.type === "CHECK_AVAILABILITY" ? [step.agentAction.candidateIds] : []), [[fixtureCandidates[0]!.restaurant.id], [second.restaurant.id]], )`
- `assert.equal(snapshot.domainState.selectedCandidateId, second.restaurant.id)`
- `assert.equal(snapshot.domainState.phase, "AWAITING_AUTHORIZATION")`

### 345 — Agent cannot execute a duplicate availability read after the candidate already has a check

**KEEP_DISTINCT_CONTRACT**

- default / Agent cannot execute a duplicate availability read after the candidate already has a check / 1.637 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(snapshot.domainState.phase, "NEEDS_INPUT")`
- `assert.equal(rejected?.actionValidation?.status, "REJECTED")`
- `assert.equal(rejected.actionValidation.code, "AVAILABILITY_ALREADY_CHECKED")`

### 363 — Harness binds party-size discovery metadata and availability arguments from authoritative task state

**KEEP_DISTINCT_CONTRACT**

- default / Harness binds party-size discovery metadata and availability arguments from authoritative task state / 1.639 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(availability.event.request, { candidateIds: fixtureCandidates.slice(0, 3).map((candidate) => candidate.restaurant.id), candidates: fixtureCandidates.slice(0, 3), date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: fixtureIntent.partySize, hardCriteria: ["yakiniku"], })`
- `assert.ok(search && search.event.type === "SEARCH_COMPLETED")`
- `assert.ok(availability && availability.event.type === "AVAILABILITY_CHECKED")`

### 391 — Provider failure is durable execution evidence, not a model failure

**KEEP_DISTINCT_CONTRACT**

- default / Provider failure is durable execution evidence, not a model failure / 0.521 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(harness.lastAgentLoopResult?.status, "WAITING_USER")`
- `assert.equal(snapshot.domainState.failure?.code, "SEARCH_FAILED")`
- `assert.equal(harness.trajectories.steps[0]?.stepOutcome, "EXECUTION_FAILURE")`

### 408 — exhausted discovery without candidates terminates instead of retrying rewritten searches

**KEEP_DISTINCT_CONTRACT**

- default / exhausted discovery without candidates terminates instead of retrying rewritten searches / 0.619 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(harness.lastAgentLoopResult?.status, "TERMINAL")`
- `assert.equal(snapshot.domainState.phase, "NO_VERIFIED_RESULT")`
- `assert.equal(harness.trajectories.steps.at(-1)?.stepOutcome, "TERMINAL")`

### 427 — GENERIC_BROWSER availability observations retain the external adapter trace actor

**KEEP_DISTINCT_CONTRACT**

- default / GENERIC_BROWSER availability observations retain the external adapter trace actor / 6.257 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(availability?.trace.actor, "ADAPTER")`
- `assert.equal(step?.executionRoute, "GENERIC_BROWSER")`

### 443 — a candidate-scoped browser read failure can end without asking the user to resolve provider infrastructure

**KEEP_DISTINCT_CONTRACT**

- default / a candidate-scoped browser read failure can end without asking the user to resolve provider infrastructure / 1.617 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(harness.lastAgentLoopResult?.status, "TERMINAL")`
- `assert.equal(snapshot.domainState.phase, "NO_VERIFIED_RESULT")`
- `assert.equal(snapshot.domainState.pendingUserQuestion, undefined)`

### 460 — Timeout, step limit, and rejection limit terminate with durable state and trajectory

**KEEP_DISTINCT_CONTRACT**

- default / Timeout, step limit, and rejection limit terminate with durable state and trajectory / 0.884 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(timeoutHarness.lastAgentLoopResult?.status, "TERMINAL")`
- `assert.equal(timeoutSnapshot.domainState.phase, "NO_VERIFIED_RESULT")`
- `assert.equal(timeoutHarness.trajectories.steps.at(-1)?.stepOutcome, "TERMINAL")`

### 494 — repeated rejected batches remain bounded by the explicit rejection limit without inferring exhausted source paths

**KEEP_DISTINCT_CONTRACT**

- default / repeated rejected batches remain bounded by the explicit rejection limit without inferring exhausted source paths / 7.096 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(harness.lastAgentLoopResult?.status, "TERMINAL")`
- `assert.equal(snapshot.domainState.phase, "NO_VERIFIED_RESULT")`
- `assert.equal(harness.trajectories.steps.filter((step) => step.stepOutcome === "REJECTED").length, 2)`

### 517 — an exhausted discovery cursor rejects a reworded retry and the model can end the bounded read

**KEEP_DISTINCT_CONTRACT**

- default / an exhausted discovery cursor rejects a reworded retry and the model can end the bounded read / 1.193 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(harness.lastAgentLoopResult?.status, "TERMINAL")`
- `assert.equal(snapshot.domainState.phase, "NO_VERIFIED_RESULT")`
- `assert.equal(discoverySteps.length, 1, "the exhausted cursor must not cause a fresh or repeated discovery request")`

## src/harness/restaurant-time-reserve.test.ts

F6槽3、100秒准入、慢模型/慢关闭、已完成子结果与错误身份/时间过滤都有离线有效红灯；后续Live缺口不能因fixture通过消失。

### 12 — F6 whole-read reserve: 100-second admission, completed children and bounded closing

**KEEP_PROTECTED**

- default / F6 whole-read reserve: 100-second admission, completed children and bounded closing / 130.247 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(final.phase, mode === "unsettled-close" ? "FAILED" : shouldPresent ? "PRESENT_RESULTS" : "NO_VERIFIED_RESULT", JSON.stringify({ mode, result, reads, failure: final.failure, contexts: contexts.map(c => c.legalActions) }))`
- `assert.ok(offers.length)`
- `assert.ok(offers.every(o => o.dateTime === "2026-09-17T19:00:00+09:00" && o.partySize === 2), "compare the independent raw fixture slot/party oracle")`

保护：F6_LIVE_FAILURE_REDS, EXPLICIT_HISTORICAL_REGRESSION

### 14 — mode

**KEEP_PROTECTED**

- default / normal-100 / 53.717 ms / pass
- default / zero-empty / 2.525 ms / pass
- default / slow-empty-model / 3.611 ms / pass
- default / unsupported-hard / 3.908 ms / pass
- default / thinking-crosses / 3.197 ms / pass
- default / partial / 4.785 ms / pass
- default / wrong-identity / 5.028 ms / pass
- default / wrong-date / 4.020 ms / pass
- default / wrong-party / 3.739 ms / pass
- default / wrong-time / 9.107 ms / pass
- default / expired / 9.574 ms / pass
- default / zero-calls / 4.364 ms / pass
- default / last-model-fails / 4.087 ms / pass
- default / slow-model / 10.123 ms / pass
- default / slow-close / 3.976 ms / pass
- default / unsettled-close / 2.908 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(final.phase, mode === "unsettled-close" ? "FAILED" : shouldPresent ? "PRESENT_RESULTS" : "NO_VERIFIED_RESULT", JSON.stringify({ mode, result, reads, failure: final.failure, contexts: contexts.map(c => c.legalActions) }))`
- `assert.ok(offers.length)`
- `assert.ok(offers.every(o => o.dateTime === "2026-09-17T19:00:00+09:00" && o.partySize === 2), "compare the independent raw fixture slot/party oracle")`

保护：F6_LIVE_FAILURE_REDS

## src/harness/test-filesystem-boundary.test.ts

文件读取guard的故意越界canary验证测试隔离本身有效，不能让被拒绝读取作为普通测试删除。

### 8 — offline test file reads reject an existing external file and allow repository inputs and self-created temporary files

**KEEP_DISTINCT_CONTRACT**

- default / offline test file reads reject an existing external file and allow repository inputs and self-created temporary files / 62.963 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(child.status, 0, child.stdout + child.stderr)`
- `assert.match(child.stdout, /file-read boundary controls passed/)`

## src/infrastructure/browser/browser-action-decision.test.ts

Decoder实际动作及字段拒绝均保留；仅205行逐字Prompt六句regex不验证模型行为，拟由真实wire/Executor行为覆盖接替。F5合同版本/asserts其余不删。

### 39 — strict browser wire COMPLETE accepts only a current observed placeholder and restores target-free canonical action

**KEEP_DISTINCT_CONTRACT**

- default / strict browser wire COMPLETE accepts only a current observed placeholder and restores target-free canonical action / 0.931 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(await decision.decide(input), { type: "COMPLETE", reason: "The read-only page is ready." })`
- `assert.equal(requestedTimeoutMs, 30_000, "Browser decision latency allowance; executor/Runner deadlines remain bounded")`

### 56 — runner model-call budget exhaustion remains a task cause, not a browser network failure

**KEEP_DISTINCT_CONTRACT**

- default / runner model-call budget exhaustion remains a task cause, not a browser network failure / 0.226 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(decision.decide(input), { code: "MODEL_CALL_BUDGET_EXHAUSTED" })`

### 63 — strict browser wire canonicalizes inert page-action envelope fields

**KEEP_DISTINCT_CONTRACT**

- default / strict browser wire canonicalizes inert page-action envelope fields / 0.110 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(await fabricated.decide(input), { type: "COMPLETE", reason: "Ready." })`
- `assert.deepEqual(await authority.decide(input), { type: "COMPLETE", reason: "Ready." })`

### 83 — strict browser wire restores authoritative calendar and observed-option actions

**KEEP_DISTINCT_CONTRACT**

- default / strict browser wire restores authoritative calendar and observed-option actions / 0.100 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(await decision.decide(input), { type: action, targetRef: "observation:1:target:1", field, reason: "Choose the requested calendar day.", })`

### 102 — strict browser wire restores bound retrieval input fill and observed query-option selection

**KEEP_DISTINCT_CONTRACT**

- default / strict browser wire restores bound retrieval input fill and observed query-option selection / 0.103 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(await decision.decide(scoped), { type: "FILL_AUTHORITATIVE", targetRef: "observation:1:target:1", field: "RETRIEVAL", reason: "Use the current public search expression.", })`
- `assert.deepEqual(await new ModelBrowserReadActionDecision(gateway({ action: "CHOOSE_OPTION", targetRef: "observation:1:target:1", authoritativeField: "RETRIEVAL", requestedState: "NONE", reason: "Select the exact public query.", })).decide(option), { type: "CHOOSE_OPTION", targetRef: "observation:1:target:1", field: "RETRIEVAL", reason: "Select the exact public query." })`

### 121 — strict browser wire restores only bounded observed checkbox, slider, and region actions

**KEEP_DISTINCT_CONTRACT**

- default / strict browser wire restores only bounded observed checkbox, slider, and region actions / 0.144 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(await new ModelBrowserReadActionDecision(gateway({ action: "SET_CHECKED", targetRef: targets[0]!.ref, authoritativeField: "NONE", requestedState: "CHECKED", reason: "Apply the observed public filter.", })).decide(scoped), { type: "SET_CHECKED", targetRef: targets[0]!.ref, checked: true, reason: "Apply the observed public filter." })`
- `assert.deepEqual(await new ModelBrowserReadActionDecision(gateway({ action: "ADJUST_RANGE", targetRef: targets[1]!.ref, authoritativeField: "NONE", requestedState: "DECREASE", reason: "Move one observed slider step.", })).decide(scoped), { type: "ADJUST_RANGE", targetRef: targets[1]!.ref, direction: "DECREASE", reason: "Move one observed slider step." })`
- `assert.deepEqual(await new ModelBrowserReadActionDecision(gateway({ action: "SCROLL_REGION", targetRef: targets[2]!.ref, authoritativeField: "NONE", requestedState: "DOWN", reason: "Read the next visible part of this dialog.", })).decide(scoped), { type: "SCROLL_REGION", targetRef: targets[2]!.ref, direction: "DOWN", reason: "Read the next visible part of this dialog." })`

### 139 — strict browser wire accepts page-level WAIT with inert envelope fields and rejects unknown fields

**KEEP_DISTINCT_CONTRACT**

- default / strict browser wire accepts page-level WAIT with inert envelope fields and rejects unknown fields / 0.980 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(wait, { type: "WAIT", reason: "Wait for the public result." })`
- `assert.deepEqual(await new ModelBrowserReadActionDecision(gateway(wire)).decide(input), { type: "WAIT", reason: "Wait" })`
- `assert.rejects( () => new ModelBrowserReadActionDecision(gateway({ action: "WAIT", targetRef: "", authoritativeField: "NONE", requestedState: "NONE", reason: "Wait", authorization: "secret-marker-do-not-log" })).decide(input), (error: unknown) => error instanceof BrowserReadDecisionError && error.code === "INVALID_MODEL_OUTPUT" && !error.message.includes("secret-marker-do-not-log"), )`

### 156 — strict browser wire canonicalizes inert metadata but records a typed rejection for an extra field

**KEEP_DISTINCT_CONTRACT**

- default / strict browser wire canonicalizes inert metadata but records a typed rejection for an extra field / 0.289 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( () => rejected.decide(input), (error: unknown) => error instanceof BrowserReadDecisionError && error.wireRejection?.action === "CLICK" && error.wireRejection.fieldPath === "$.authorization" && error.wireRejection.valueType === "string" && error.wireRejection.reason === "UNSUPPORTED_FIELD" && !JSON.stringify(error.wireRejection).includes("secret-marker-do-not-log"), )`
- `assert.deepEqual(rejected.takeLastWireRecord?.(), { action: "CLICK", targetRef: "observation:1:target:1", authoritativeField: "NONE", requestedState: "NONE", reason: "REDACTED", extras: [{ fieldPath: "$.authorization", valueType: "string" }], })`
- `assert.deepEqual(await new ModelBrowserReadActionDecision(gateway({ action: "CLICK", targetRef: "observation:1:target:1", authoritativeField: "DATE", requestedState: "CHECKED", reason: "Use current control.", })).decide(input), { type: "CLICK", targetRef: "observation:1:target:1", reason: "Use current control." })`

### 179 — strict browser wire ignores only action-inert metadata

**KEEP_DISTINCT_CONTRACT**

- default / strict browser wire ignores only action-inert metadata / 0.274 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(await new ModelBrowserReadActionDecision(gateway({ action: "FILL_AUTHORITATIVE", targetRef: target, authoritativeField: "RETRIEVAL", requestedState: "CHECKED", reason: "Fill public query.", })).decide({ ...input, goal: { ...input.goal, retrievalExpression: "omakase" } }), { type: "FILL_AUTHORITATIVE", targetRef: target, field: "RETRIEVAL", reason: "Fill public query." })`
- `assert.deepEqual(await new ModelBrowserReadActionDecision(gateway({ action: "SET_CHECKED", targetRef: target, authoritativeField: "DATE", requestedState: "CHECKED", reason: "Apply filter.", })).decide(input), { type: "SET_CHECKED", targetRef: target, checked: true, reason: "Apply filter." })`
- `assert.rejects( () => new ModelBrowserReadActionDecision(gateway({ action: "SET_CHECKED", targetRef: target, authoritativeField: "NONE", requestedState: "UP", reason: "Invalid checked state.", })).decide(input), (error: unknown) => error instanceof BrowserReadDecisionError && error.wireRejection?.fieldPath === "$.requestedState", )`

### 195 — browser record keeps a valid wire shape but redacts its free-text reason

**KEEP_DISTINCT_CONTRACT**

- default / browser record keeps a valid wire shape but redacts its free-text reason / 0.165 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(decision.takeLastWireRecord?.(), { action: "WAIT", targetRef: "", authoritativeField: "NONE", requestedState: "NONE", reason: "REDACTED", extras: [], })`

### 205 — browser prompt describes installed public-query controls and page-level recovery

**RETIRE_OR_MERGE_PROPOSED** · A-D01

唯一观察是系统Prompt六句英语的正则匹配；同义改写会失败，句子仍在而执行权限坏掉则通过。未模拟一次模型决策，既不验证动作正确也不验证真实模型遵循。删除这一文案形状测试，行为合同继续由下面实际解码/执行覆盖。

- default / browser prompt describes installed public-query controls and page-level recovery / 0.486 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.match(prompt, /checkbox\/radio, option, range, and region scroll/i)`
- `assert.match(prompt, /Targeted actions are permitted only when their current availableActions explicitly list them/i)`
- `assert.match(prompt, /WAIT waits for one bounded visible result change at page level/i)`

### 215 — LOCATION wire cannot carry a replacement value or use a non-fill action

**KEEP_DISTINCT_CONTRACT**

- default / LOCATION wire cannot carry a replacement value or use a non-fill action / 0.503 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(await new ModelBrowserReadActionDecision(gateway(wire)).decide(input),{type:'FILL_AUTHORITATIVE',targetRef:wire.targetRef,field:'LOCATION',reason:wire.reason})`
- `assert.rejects(()=>new ModelBrowserReadActionDecision(gateway({...wire,value:'Nearby substituted place'})).decide(input),error=>error instanceof BrowserReadDecisionError && error.wireRejection?.reason==='UNSUPPORTED_FIELD')`
- `assert.rejects(()=>new ModelBrowserReadActionDecision(gateway({...wire,action:'CLICK_AUTHORITATIVE'})).decide(input),error=>error instanceof BrowserReadDecisionError && error.wireRejection?.reason==='INVALID_STATE')`

### 223 — SELECT_REGION_ENTRANCE wire carries a supplied collection ref and cannot carry href or authoritative values

**KEEP_DISTINCT_CONTRACT**

- default / SELECT_REGION_ENTRANCE wire carries a supplied collection ref and cannot carry href or authoritative values / 0.528 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(await good.decide({...input,regionCorrection}),{type:'SELECT_REGION_ENTRANCE',targetRef:wire.targetRef,reason:wire.reason})`
- `assert.rejects(new ModelBrowserReadActionDecision(gateway(bad)).decide({...input,regionCorrection}),{code:'INVALID_MODEL_OUTPUT'})`
- `assert.equal(body.regionCorrection.samples[0].distanceMeters,3400)`

## src/infrastructure/browser/browser-read-policy-draft.test.ts

自动生成只允许value-free GET草稿，POST只能提示人工审核；不能以Recorder成功代替自动草稿不激活权限的边界。

### 6 — policy draft records only admitted value-free GET shapes and never activates a POST

**KEEP_DISTINCT_CONTRACT**

- default / policy draft records only admitted value-free GET shapes and never activates a POST / 0.648 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(draft.status, "DRAFT_NOT_APPROVED")`
- `assert.deepEqual(draft.reviewedReads, [{ origin: "https://official.example", pathname: "/menu", resourceTypes: ["fetch"], methods: ["GET"], queryKeys: ["locale"], }])`
- `assert.deepEqual(draft.omitted.map(item => item.reason), ["POST_REQUIRES_BODY_REVIEW", "NOT_ADMITTED"])`

## src/infrastructure/browser/browser-read-skills.test.ts

按注入Pack选择来源指导，官网另走website Skill；测试保护模块注入而非仅站名文案，不并入特定来源组合。

### 7 — Browser Skills load source guidance only when the injected pack supplies it

**KEEP_DISTINCT_CONTRACT**

- default / Browser Skills load source guidance only when the injected pack supplies it / 0.659 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.match(tableCheck.source, /TableCheck/)`
- `assert.match(tabelog.source, /Tabelog/)`
- `assert.notEqual(tableCheck.source, tabelog.source)`

## src/infrastructure/browser/browser-runtime-factory.test.ts

仅LOCAL无需Cloudflare配置，与AUTO/两远端模式的构造选择是两个实际环境入口，后者循环内不增加独立用例数。

### 8 — LOCAL_CHROMIUM selects the local runtime without requiring or constructing Cloudflare configuration

**KEEP_DISTINCT_CONTRACT**

- default / LOCAL_CHROMIUM selects the local runtime without requiring or constructing Cloudflare configuration / 0.344 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(runtime instanceof LocalPlaywrightChromium)`

### 13 — AUTO, KITESURF, and CHROMIUM preserve Cloudflare runtime selection

**KEEP_DISTINCT_CONTRACT**

- default / AUTO, KITESURF, and CHROMIUM preserve Cloudflare runtime selection / 0.092 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(runtime instanceof CloudflareBrowserRun)`

## src/infrastructure/browser/browser-task-executor.test.ts

预算、stale ref、后置条件、Session退休与region数据动作是执行层安全/恢复合同；低层mock补分支，真实DOM对照另在Chromium，两者并不互相替代。

### 88 — BrowserTaskExecutor shares one browser session across source work and closes it once at the enclosing read boundary

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor shares one browser session across source work and closes it once at the enclosing read boundary / 0.886 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY"), session)`
- `assert.equal(await executor.acquire(new AbortController().signal, "TABELOG", "DISCOVERY"), session)`
- `assert.equal(opens, 1)`

### 100 — BrowserTaskExecutor refuses a policy read when a runtime only exposes an unguarded session

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor refuses a policy read when a runtime only exposes an unguarded session / 0.386 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( () => executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY", policy), (error: unknown) => error instanceof BrowserRuntimeError && error.code === "BROWSER_RUNTIME_FAILED", )`
- `assert.equal(session.closed, 1)`

### 111 — BrowserTaskExecutor records candidate and provider lifecycle costs through a normal close

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor records candidate and provider lifecycle costs through a normal close / 0.331 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(diagnostics.find(item => item.event === "PROVIDER_STARTED")?.lifecycle.outcome, "STARTED")`
- `assert.equal(diagnostics.find(item => item.event === "PROVIDER_FINISHED")?.lifecycle.reason, "EXECUTOR_CLOSED")`
- `assert.equal(diagnostics.find(item => item.event === "CANDIDATE_FINISHED")?.lifecycle.outcome, "FINISHED")`

### 127 — BrowserTaskExecutor completes after a canonical page-level WAIT without an observed target

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor completes after a canonical page-level WAIT without an observed target / 1.900 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED", JSON.stringify(result))`
- `assert.deepEqual(value.observation.pageActions, ["WAIT", "PRESS_ESCAPE"])`
- `assert.equal(value.observation.targets.some(target => target.availableActions?.includes("WAIT")), false)`

### 153 — BrowserTaskExecutor spends one bounded operation on page-level Escape then re-observes

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor spends one bounded operation on page-level Escape then re-observes / 0.310 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED")`
- `assert.deepEqual(input.observation.pageActions, ["WAIT", "PRESS_ESCAPE"])`
- `assert.equal(session.escapes, 1)`

### 174 — BrowserTaskExecutor applies one obstruction recovery and re-observes instead of retrying an old click

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor applies one obstruction recovery and re-observes instead of retrying an old click / 11.356 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED")`
- `assert.ok(target)`
- `assert.equal(session.clicks, 1, "recovery must not replay the blocked click")`

### 206 — BrowserTaskExecutor exposes an ordinary observed query submit only in an installed read boundary

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor exposes an ordinary observed query submit only in an installed read boundary / 6.622 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED")`
- `assert.equal(result.status, "REQUESTED_HUMAN_HELP")`
- `assert.deepEqual(target?.availableActions, ["CLICK"])`

### 244 — BrowserTaskExecutor waits once for a guarded GET submit when cosmetic form state changes before results

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor waits once for a guarded GET submit when cosmetic form state changes before results / 6.288 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED")`
- `assert.ok(target)`
- `assert.ok(target.availableActions?.includes("CLICK"))`

### 270 — BrowserTaskExecutor keeps an observed sensitive submit unavailable even in an installed read boundary

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor keeps an observed sensitive submit unavailable even in an installed read boundary / 0.929 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "REQUESTED_HUMAN_HELP")`
- `assert.deepEqual(target?.availableActions, [])`
- `assert.equal(session.clicks, 0)`

### 290 — BrowserTaskExecutor exposes generic public query controls only after the Guard boundary is installed

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor exposes generic public query controls only after the Guard boundary is installed / 1.375 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "REQUESTED_HUMAN_HELP")`
- `assert.deepEqual(action("Sushi"), ["SET_CHECKED"])`
- `assert.deepEqual(action("Counter"), ["SET_CHECKED"])`

### 316 — BrowserTaskExecutor executes a guarded authoritative date button only for the Router-bound date

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor executes a guarded authoritative date button only for the Router-bound date / 1.365 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED")`
- `assert.ok(target?.availableActions?.includes("CLICK_AUTHORITATIVE:DATE"))`
- `assert.equal(session.clicks, 1)`

### 337 — BrowserTaskExecutor identifies an operation ceiling before a denied next observation

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor identifies an operation ceiling before a denied next observation / 0.428 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(executor.snapshot({ source: "TABLECHECK", stage: "AVAILABILITY", signal, session: acquired }), (error: unknown) => error instanceof BrowserRuntimeError && error.code === "BROWSER_OPERATION_BUDGET_EXCEEDED" && /operation budget/.test(error.message))`
- `assert.equal(diagnostics.find(item => item.event === "BUDGET_EXHAUSTED")?.lifecycle.reason, "OPERATION_BUDGET_EXHAUSTED")`
- `assert.equal(actionResult.status, "BUDGET_EXCEEDED")`

### 367 — BrowserTaskExecutor records the real acquisition root cause instead of inferring a run failure

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor records the real acquisition root cause instead of inferring a run failure / 0.172 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY"), { code: "BROWSER_RUNTIME_UNAVAILABLE" })`
- `assert.deepEqual(failure?.lifecycle, { outcome: "FAILED", candidateElapsedMs: failure?.lifecycle.candidateElapsedMs, providerElapsedMs: failure?.lifecycle.providerElapsedMs, candidateModelCalls: 0, providerModelCalls: 0, candidateRuntimeOperations: 0, providerRuntimeOperations: 0, runModelCalls: 0, reason: "RUNTIME_UNAVAILABLE", failureCode: "BROWSER_RUNTIME_UNAVAILABLE", })`
- `assert.equal(diagnostics.find(item => item.event === "PROVIDER_FINISHED")?.lifecycle.outcome, "FAILED")`

### 383 — BrowserTaskExecutor emits a typed provider deadline before opening a session

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor emits a typed provider deadline before opening a session / 0.125 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY"), { code: "BROWSER_TIMEOUT" })`
- `assert.equal(failure?.lifecycle.reason, "DEADLINE_EXCEEDED")`
- `assert.equal(failure?.lifecycle.scope, "PROVIDER")`

### 396 — BrowserTaskExecutor aborts session acquisition immediately and closes a late session

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor aborts session acquisition immediately and closes a late session / 3.497 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(acquisition, { code: "BROWSER_ABORTED" })`
- `assert.equal(diagnostics.find(item => item.event === "SESSION_OPEN_FAILED")?.lifecycle.reason, "PARENT_ABORTED")`
- `assert.equal(diagnostics.find(item => item.event === "PROVIDER_FINISHED")?.lifecycle.outcome, "ABANDONED")`

### 415 — BrowserTaskExecutor records a failed runtime operation with its local cause

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor records a failed runtime operation with its local cause / 0.254 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(executor.snapshot({ source: "TABLECHECK", stage: "DISCOVERY", signal: new AbortController().signal, session: acquired }), { code: "BROWSER_RUNTIME_FAILED" })`
- `assert.equal(failure?.lifecycle.reason, "RUNTIME_FAILURE")`
- `assert.equal(failure?.lifecycle.failureCode, "BROWSER_RUNTIME_FAILED")`

### 429 — a runtime navigation failure retires its session before the next candidate without resetting the run

**KEEP_DISTINCT_CONTRACT**

- default / a runtime navigation failure retires its session before the next candidate without resetting the run / 0.235 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(executor.navigate({ source: "TABLECHECK", stage: "DISCOVERY", signal, session: old, url: "https://www.tablecheck.com/fail", allowedOrigins: ["https://www.tablecheck.com"] }), { code: "BROWSER_RUNTIME_FAILED" })`
- `assert.equal(budget.totalModelCalls, 3)`
- `assert.equal(await executor.acquire(signal, "TABLECHECK", "DISCOVERY"), next)`

### 448 — a stuck old close cannot delay cancellation or overwrite the next candidate

**KEEP_DISTINCT_CONTRACT**

- default / a stuck old close cannot delay cancellation or overwrite the next candidate / 0.737 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(executor.navigate({ source: "TABLECHECK", stage: "IDENTITY", signal: oldSignal.signal, session: old, url: "https://www.tablecheck.com/fail", allowedOrigins: ["https://www.tablecheck.com"] }), { code: "BROWSER_RUNTIME_FAILED" })`
- `assert.equal((await executor.snapshot({ source: "TABLECHECK", stage: "IDENTITY", signal: nextSignal, session: fresh })).title, "new")`
- `assert.equal(fresh, next)`

### 476 — a stuck runtime cleanup does not hold a canceled read or reset its candidate deadline

**KEEP_DISTINCT_CONTRACT**

- default / a stuck runtime cleanup does not hold a canceled read or reset its candidate deadline / 0.518 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(navigation, { code: "BROWSER_ABORTED" })`
- `assert.rejects(executor.acquire(new AbortController().signal, "TABLECHECK", "IDENTITY"), { code: "BROWSER_TIMEOUT" })`

### 494 — BrowserTaskExecutor aborts an in-flight operation, closes once asynchronously, and never reuses that session

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor aborts an in-flight operation, closes once asynchronously, and never reuses that session / 1.579 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(pending, { code: "BROWSER_ABORTED" })`
- `assert.equal(session.closed, 1)`
- `assert.equal(await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY"), next)`

### 515 — BrowserTaskExecutor bounds a late session acquisition without leaking its deadline into the next candidate

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor bounds a late session acquisition without leaking its deadline into the next candidate / 0.929 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY"), { code: "BROWSER_TIMEOUT" })`
- `assert.equal(late.closed, 1, "a session that resolves after its candidate deadline is closed rather than cached")`
- `assert.equal(await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY"), next)`

### 538 — BrowserTaskExecutor times out a hanging snapshot, closes that session, and permits the next candidate

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor times out a hanging snapshot, closes that session, and permits the next candidate / 2.502 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(executor.snapshot({ source: "TABLECHECK", stage: "DISCOVERY", signal: new AbortController().signal, session: first }), { code: "BROWSER_TIMEOUT" })`
- `assert.equal(stuck.closed, 1)`
- `assert.equal(await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY"), next)`

### 556 — BrowserTaskExecutor stops a repeated two-page cycle without spending the full operation budget

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor stops a repeated two-page cycle without spending the full operation budget / 2.189 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "NO_SAFE_ACTION")`
- `assert.equal(diagnostics.filter(detail => detail === "REPEATED_FROM_SAME_STATE").length, 2)`
- `assert.equal(closes, 1)`

### 582 — BrowserTaskExecutor keeps a model-call ceiling across sequential candidate executors

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor keeps a model-call ceiling across sequential candidate executors / 0.491 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal((await first.runSkill({ ...input(acquiredFirst), completion: () => ({ complete: false, reason: "continue" }) })).status, "REQUESTED_HUMAN_HELP")`
- `assert.rejects( second.runSkill({ ...input(acquiredSecond), completion: () => ({ complete: false, reason: "continue" }) }), { code: "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED" }, )`
- `assert.equal(decisions, 1)`

### 608 — BrowserTaskExecutor enforces the shared budget ceiling when no caller-specific option is supplied

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor enforces the shared budget ceiling when no caller-specific option is supplied / 0.523 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal((await first.runSkill({ ...input(firstSession), completion: () => ({ complete: false, reason: "continue" }) })).status, "REQUESTED_HUMAN_HELP")`
- `assert.rejects( second.runSkill({ ...input(secondSession), completion: () => ({ complete: false, reason: "continue" }) }), { code: "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED" }, )`
- `assert.equal(decisions, 1)`

### 638 — BrowserTaskExecutor accepts only observed, read-only targets and invalidates old references after every observation

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor accepts only observed, read-only targets and invalidates old references after every observation / 1.306 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "NO_SAFE_ACTION")`
- `assert.equal(value.observation.targets.length, 1)`
- `assert.equal(session.clicks, 1)`

### 668 — BrowserTaskExecutor allows an observed GET availability-search control but never treats it as a booking submit

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor allows an observed GET availability-search control but never treats it as a booking submit / 0.660 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED")`
- `assert.equal(session.clicks, 1)`

### 686 — fragment UI click permission cannot be used for another document, origin, or sensitive action

**KEEP_DISTINCT_CONTRACT**

- default / fragment UI click permission cannot be used for another document, origin, or sensitive action / 2.744 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "REQUESTED_HUMAN_HELP", scenario.name)`
- `assert.equal(target.availableActions?.includes("CLICK"), false, scenario.name)`
- `assert.equal(session.clicks, 0, scenario.name)`

### 717 — BrowserTaskExecutor binds model-controlled fields to the Router authority and blocks an unsafe submit-looking click

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor binds model-controlled fields to the Router authority and blocks an unsafe submit-looking click / 1.109 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(select?.rejectionReason, "CHOOSE_AN_OBSERVED_OPTION")`
- `assert.equal(submit?.rejectionReason, "WRITE_PROHIBITED")`
- `assert.equal(result.status, "REQUESTED_HUMAN_HELP")`

### 747 — BrowserTaskExecutor binds a public retrieval field by observed native name without admitting PII entries

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor binds a public retrieval field by observed native name without admitting PII entries / 0.355 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(email.rejectionReason, "NO_BOUND_INPUT_FIELD")`
- `assert.equal(result.status, "REQUESTED_HUMAN_HELP")`
- `assert.ok(search.availableActions?.includes("FILL_AUTHORITATIVE:RETRIEVAL"))`

### 779 — BrowserTaskExecutor permits only an exact non-submit calendar button for a model-controlled date

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor permits only an exact non-submit calendar button for a model-controlled date / 0.318 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED")`
- `assert.equal(session.clicks, 1)`

### 805 — BrowserTaskExecutor shows a disabled date as read-only and rejects a proposed click

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor shows a disabled date as read-only and rejects a proposed click / 0.254 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(date.rejectionReason, "DISABLED")`
- `assert.equal(result.status, "REQUESTED_HUMAN_HELP")`
- `assert.equal(date.disabled, true)`

### 826 — BrowserTaskExecutor reuses post-action controls to confirm two selections within the operation limit

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor reuses post-action controls to confirm two selections within the operation limit / 0.481 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED")`
- `assert.equal(session.clicks, 2)`
- `assert.equal(events.filter(event => event.event === "OPERATION_STARTED").length, 10)`

### 855 — BrowserTaskExecutor permits a non-submit calendar control nested in a POST form

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor permits a non-submit calendar control nested in a POST form / 0.185 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED")`
- `assert.equal(session.clicks, 1)`

### 875 — BrowserTaskExecutor addresses a distinct observed calendar value before a shared test id

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor addresses a distinct observed calendar value before a shared test id / 0.251 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED")`
- `assert.equal(session.clicks, 1)`

### 896 — BrowserTaskExecutor rejects an ambiguous calendar day and a submit-looking authoritative button

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor rejects an ambiguous calendar day and a submit-looking authoritative button / 0.419 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "REQUESTED_HUMAN_HELP")`
- `assert.equal(session.clicks, 0)`

### 918 — BrowserTaskExecutor keeps an invalid model action in the same bounded session and accepts a later observed-target proposal

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor keeps an invalid model action in the same bounded session and accepts a later observed-target proposal / 0.444 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.match(value.progress, /MODEL_WIRE_REJECTED/)`
- `assert.equal(result.status, "COMPLETED")`
- `assert.equal(events.filter((event) => event === "REJECTED").length, 1)`

### 942 — BrowserTaskExecutor abandons two identical rejected proposals on an unchanged page

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor abandons two identical rejected proposals on an unchanged page / 0.351 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "NO_SAFE_ACTION")`
- `assert.equal(calls, 2)`
- `assert.ok(diagnostics.includes("NO_PROGRESS_REJECTED_ACTION"))`

### 965 — BrowserTaskExecutor removes an observed target after its action makes no page progress and continues in the same session

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor removes an observed target after its action makes no page progress and continues in the same session / 0.359 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "REQUESTED_HUMAN_HELP")`
- `assert.equal(calls, 2)`
- `assert.equal(value.observation.targets.some((target) => target.value === "2026-9-10"), false)`

### 993 — model COMPLETE is returned to the same browser loop until the completion predicate passes or makes no progress

**KEEP_DISTINCT_CONTRACT**

- default / model COMPLETE is returned to the same browser loop until the completion predicate passes or makes no progress / 0.157 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "NO_SAFE_ACTION")`

### 1006 — an early COMPLETE receives the missing predicate and can take a later safe action in the same session

**KEEP_DISTINCT_CONTRACT**

- default / an early COMPLETE receives the missing predicate and can take a later safe action in the same session / 1.248 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED")`
- `assert.equal(session.clicks, 1)`
- `assert.match(secondProgress, /Completion was not accepted: A request-bound result is not yet visible/)`

### 1028 — a rejected COMPLETE refreshes an asynchronous result before requesting another model decision

**KEEP_DISTINCT_CONTRACT**

- default / a rejected COMPLETE refreshes an asynchronous result before requesting another model decision / 0.439 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED")`
- `assert.equal(result.snapshot.text, "Inventory ready")`
- `assert.equal(decisionsRequested, 1)`

### 1048 — BrowserTaskExecutor never advertises or executes page Escape without an installed read boundary

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor never advertises or executes page Escape without an installed read boundary / 0.485 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "NO_SAFE_ACTION")`
- `assert.deepEqual(input.observation.pageActions, ["WAIT"])`
- `assert.equal(session.escapes, 0)`

### 1059 — BrowserTaskExecutor passes only the recent six executed or rejected steps to the next decision

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor passes only the recent six executed or rejected steps to the next decision / 1.571 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal((await executor.runSkill(input(session))).status,"COMPLETED")`
- `assert.ok(history.every((x:any)=>x.action==='WAIT' && x.outcome==='PAGE_CHANGED' && x.urlChanged===true))`
- `assert.equal((await other.runSkill(input(stuck))).status,"REQUESTED_HUMAN_HELP")`

### 1079 — BrowserTaskExecutor no-change feedback directs a current target and waits only on actual loading

**KEEP_DISTINCT_CONTRACT**

- default / BrowserTaskExecutor no-change feedback directs a current target and waits only on actual loading / 1.059 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal((await executor.runSkill({...input(session),completion:()=>({complete:false,reason:"Select a category"})})).status,"REQUESTED_HUMAN_HELP")`
- `assert.match(value.progress,/did not produce a visible change/i)`
- `assert.match(value.progress,/current observed target/i)`

### 1095 — C2a rejects ordinary wrong-date clicks at execution even when the model ignores hints

**KEEP_DISTINCT_CONTRACT**

- default / C2a rejects ordinary wrong-date clicks at execution even when the model ignores hints / 0.577 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(other.rejectionReason,'NON_REQUEST_DATE')`
- `assert.equal(read.status,'NO_SAFE_ACTION')`
- `assert.equal(session.clicks,0)`

### 1102 — LOCATION fills only the same-request authoritative name in an observed public location input

**KEEP_DISTINCT_CONTRACT**

- default / LOCATION fills only the same-request authoritative name in an observed public location input / 0.843 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(area.availableActions?.includes('FILL_AUTHORITATIVE:LOCATION'))`
- `assert.equal(d.observation.targets.find(t=>t.label==='Location address')!.availableActions?.includes('FILL_AUTHORITATIVE:LOCATION'),false)`
- `assert.deepEqual(fills,[['area','Ebisu Station']])`

### 1109 — LOCATION is unavailable for coordinate-only requests without an authoritative name

**KEEP_DISTINCT_CONTRACT**

- default / LOCATION is unavailable for coordinate-only requests without an authoritative name / 0.531 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(d.observation.targets.every(t=>!t.availableActions?.includes('FILL_AUTHORITATIVE:LOCATION')))`

### 1115 — executor requires explicit positive model and operation limits

**KEEP_DISTINCT_CONTRACT**

- default / executor requires explicit positive model and operation limits / 0.178 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.throws(() => new BrowserTaskExecutor({ openSession: async () => new FixtureSession([]) }, { maxModelCallsTotal: 120 }), TypeError)`
- `assert.throws(() => new BrowserTaskExecutor({ openSession: async () => new FixtureSession([]) }, { maxAutomaticElapsedMs: 300_000, maxModelCallsTotal: 120, maxModelCallsPerCandidate: 0, maxOperationsPerCandidate: 80 }), TypeError)`

### 1122 — group-window: visible disabled requested party ends before another model decision

**KEEP_DISTINCT_CONTRACT**

- default / group-window: visible disabled requested party ends before another model decision / 0.932 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.reasonCode,"PARTY_SIZE_NOT_SELECTABLE")`
- `assert.equal(decisions,0)`
- `assert.equal(session.clicks,0)`

### 1137 — `group-window: party stop excludes ${JSON.stringify(control)}`

**KEEP_DISTINCT_CONTRACT**

- default / group-window: party stop excludes {"label":"Guests 10","value":"10","controlGroupLabel":"Guests","disabled":false,"visible":true} / 0.650 ms / pass
- default / group-window: party stop excludes {"label":"Guests 10","value":"10","controlGroupLabel":"Guests","disabled":true,"visible":false} / 0.160 ms / pass
- default / group-window: party stop excludes {"label":"Guests 10","value":"10","controlGroupLabel":"Guests","disabled":true,"visible":true,"outsideViewport":true} / 1.051 ms / pass
- default / group-window: party stop excludes {"label":"Guests 9","value":"9","controlGroupLabel":"Guests","disabled":true,"visible":true} / 0.288 ms / pass
- default / group-window: party stop excludes {"label":"10","value":"10","controlGroupLabel":"Booking time","disabled":true,"visible":true} / 0.270 ms / pass
- default / group-window: party stop excludes {"label":"Guests 10","value":"10","controlGroupLabel":"Guests","disabled":true,"visible":true,"selected":true} / 0.213 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.notEqual(result.reasonCode,"PARTY_SIZE_NOT_SELECTABLE")`
- `assert.equal(decisions,1)`

### 1145 — `group-window: disabled party is bound to selected date ${selectedDate}`

**KEEP_DISTINCT_CONTRACT**

- default / group-window: disabled party is bound to selected date 2026-11-05 / 0.502 ms / pass
- default / group-window: disabled party is bound to selected date 2026-11-06 / 0.089 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.reasonCode,selectedDate==="2026-11-06"?"PARTY_SIZE_NOT_SELECTABLE":undefined)`
- `assert.equal(models,selectedDate==="2026-11-06"?0:1)`

### 1156 — region selection is data-only DISCOVERY and consumes the same global model budget without reviving other stages

**KEEP_DISTINCT_CONTRACT**

- default / region selection is data-only DISCOVERY and consumes the same global model budget without reviving other stages / 0.470 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(outside.status,'NO_SAFE_ACTION')`
- `assert.equal(calls,0)`
- `assert.equal(budget.totalModelCalls,49)`

## src/infrastructure/browser/cloudflare-browser-run.test.ts

CDP receiver绑定、引擎受控回落、Abort关闭和Guard安装失败资源清理各走不同生产入口；远端连接替身不冒充真实Cloudflare运行。

### 32 — Browser Run keeps Kitesurf on successful AUTO session creation

**KEEP_DISTINCT_CONTRACT**

- default / Browser Run keeps Kitesurf on successful AUTO session creation / 0.740 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(session.metadata.engine, "KITESURF")`
- `assert.equal(endpoints.length, 1)`
- `assert.match(endpoints[0]!, /browser=kitesurf/)`

### 45 — Browser Run rejects HAR replay before opening a remote browser

**KEEP_DISTINCT_CONTRACT**

- default / Browser Run rejects HAR replay before opening a remote browser / 0.221 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( runtime.openSession({ signal: new AbortController().signal, replayHarPath: "/tmp/replay.har" }), (error: unknown) => error instanceof Error && /does not support isolated HAR replay/.test(error.message), )`
- `assert.equal(connects, 0)`

### 58 — Browser Run preserves the Playwright receiver for its default CDP connector

**KEEP_DISTINCT_CONTRACT**

- default / Browser Run preserves the Playwright receiver for its default CDP connector / 0.104 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(receivedThis, chromium)`

### 79 — Browser Run falls back once from Kitesurf to Chromium and does not loop

**KEEP_DISTINCT_CONTRACT**

- default / Browser Run falls back once from Kitesurf to Chromium and does not loop / 0.105 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(session.metadata.engine, "CHROMIUM")`
- `assert.equal(endpoints.length, 2)`

### 96 — Browser Run returns a stable failure after both engines fail

**KEEP_DISTINCT_CONTRACT**

- default / Browser Run returns a stable failure after both engines fail / 0.088 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(runtime.openSession({ signal: new AbortController().signal }), /Cloudflare Browser Run could not open/)`
- `assert.equal(attempts, 2)`

### 106 — Browser Run closes a remote session after AbortSignal

**KEEP_DISTINCT_CONTRACT**

- default / Browser Run closes a remote session after AbortSignal / 1.506 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(closed, 1)`

### 119 — Browser Run closes its remote browser when isolated guard setup fails

**KEEP_DISTINCT_CONTRACT**

- default / Browser Run closes its remote browser when isolated guard setup fails / 0.261 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( runtime.openSession({ signal: new AbortController().signal, networkPolicy: { documentOrigins: ["https://public.example"], staticResources: [], dynamicReads: [] } }), /Cloudflare Browser Run could not open/, )`
- `assert.equal(closed, 2, "AUTO closes each connected engine after its isolated context fails")`
- `assert.equal(contextsClosed, 2, "guard setup does not leave isolated contexts behind")`

## src/infrastructure/browser/local-playwright-chromium.test.ts

profile必须双开关、HAR需隔离Guard、响应旧代失效、截图不改变控件均有不同风险；与Cloudflare Session测试保留各自实现。

### 29 — Local Playwright Chromium preserves the BrowserType method binding, exposes the BrowserSession contract, and closes page, context, and browser

**KEEP_DISTINCT_CONTRACT**

- default / Local Playwright Chromium preserves the BrowserType method binding, exposes the BrowserSession contract, and closes page, context, and browser / 1.211 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(page, { settlement: "SETTLED", url: "https://example.com/", html: "<html><body>Example Domain</body></html>", text: "Example Domain", title: "Example Domain", responses: [], })`
- `assert.equal(pageId, "page:1")`
- `assert.equal(session.metadata.runtimeProvider, "LOCAL_PLAYWRIGHT_CHROMIUM")`

### 56 — environment gates keep ordinary profiles temporary and enable persistence only with both eval switches

**KEEP_DISTINCT_CONTRACT**

- default / environment gates keep ordinary profiles temporary and enable persistence only with both eval switches / 0.536 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(launches.at(-1), expected, \`interactive=${interactive}, manual=${manual}\`)`
- `assert.deepEqual(counts, { page: 4, context: 4, browser: 3 })`
- `assert.deepEqual(launches.at(-1), { headless: interactive === "0", proxy: { server: "http://127.0.0.1:10808" }, ...(interactive === "1" ? { userDataDir: resolve(".eval-artifacts", "local-chromium-profile") } : {}), })`

### 98 — Local Playwright Chromium maps launch failures into the fail-closed BrowserRuntime error

**KEEP_DISTINCT_CONTRACT**

- default / Local Playwright Chromium maps launch failures into the fail-closed BrowserRuntime error / 0.215 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( runtime.openSession({ signal: new AbortController().signal }), (error: unknown) => error instanceof BrowserRuntimeError && error.code === "BROWSER_RUNTIME_UNAVAILABLE" && /install a Playwright Chromium browser binary/.test(error.message), )`

### 106 — Local Playwright Chromium installs HAR replay before the Guard and refuses replay without that boundary

**KEEP_DISTINCT_CONTRACT**

- default / Local Playwright Chromium installs HAR replay before the Guard and refuses replay without that boundary / 0.524 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(calls, ["har:abort", "websocket", "guard-route"])`
- `assert.rejects(runtime.openSession({ signal: new AbortController().signal, replayHarPath: "/tmp/replay.har" }), BrowserRuntimeError)`
- `assert.equal(session.metadata.readNetworkBoundary, "INSTALLED")`

### 129 — passive query capture invalidates old stock at request time and rejects late responses

**KEEP_DISTINCT_CONTRACT**

- default / passive query capture invalidates old stock at request time and rejects late responses / 6.288 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal((await observer.snapshot(page)).length, 1)`
- `assert.deepEqual(await observer.snapshot(page), [], "a newly requested query cannot reuse the old result")`
- `assert.deepEqual((await observer.snapshot(page)).map(item => item.body), [{ slot: "18:45" }])`

### 149 — layout-only screenshot is a PNG and leaves observed controls unchanged

**KEEP_DISTINCT_CONTRACT**

- default / layout-only screenshot is a PNG and leaves observed controls unchanged / 332.633 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(png && png[0] === 137 && png[1] === 80 && png[2] === 78 && png[3] === 71)`
- `assert.deepEqual(after?.map(item => [item.kind, item.label, item.value]), before?.map(item => [item.kind, item.label, item.value]))`

## src/infrastructure/browser/playwright-read-network-guard.test.ts

负向准入/方法/字段/敏感路径全保护；50行6秒fake sleep可改为测试注入计时但保留原timeout/fulfill/abort断言及真实Chromium6.5秒控制，详见proposal。

### 50 — read network guard preserves the Executor source-read deadline beyond the action cap

**KEEP_SPEEDUP_PROPOSED** · A-T01

fakeRoute.fetch目前真实sleep6000/100ms后仅按传入timeout判定成功或超时，默认基线耗时6107ms；并未使用真实浏览器网络。可用Node test注入Date/setTimeout并按fake fetch已开始的条件推进，保留6000>5000、8000放行、100超时等同样时间关系。

- default / read network guard preserves the Executor source-read deadline beyond the action cap / 6107.355 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(delayedPublicScript.calls, ["fetch:0:8000", "fulfill"])`
- `assert.deepEqual(exceeded.calls, ["fetch:0:100", "abort"])`
- `assert.deepEqual(shortDeadline.snapshotDiagnostics().map(item => item.code), ["READ_TIMEOUT"])`

保护：GUARD_NEGATIVE_AND_NORMAL_CONTROLS

### 75 — read network guard admits only prepared public documents and exact source read rules

**KEEP_PROTECTED**

- default / read network guard admits only prepared public documents and exact source read rules / 1.287 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(document.calls, ["fetch:0:700", "fulfill"])`
- `assert.deepEqual(repeatedDocument.calls, ["abort"], "a document admission is consumed after one navigation")`
- `assert.deepEqual(dynamic.calls, ["fetch:0:700", "fulfill"])`

保护：GUARD_NEGATIVE_AND_NORMAL_CONTROLS

### 163 — ordinary route records the initial redirect and rejects its unadmitted immediate target; Chromium owns hop coverage

**KEEP_PROTECTED**

- default / ordinary route records the initial redirect and rejects its unadmitted immediate target; Chromium owns hop coverage / 0.378 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(sameOrigin.calls, ["fetch:0:700", "fulfill"])`
- `assert.deepEqual(recorded, [{ url: "https://public.example/guide", status: 301, redirectLocation: "https://public.example/public-index" }])`
- `assert.deepEqual(crossOrigin.calls, ["fetch:0:700", "abort"])`

保护：GUARD_NEGATIVE_AND_NORMAL_CONTROLS

### 189 — ADR-0036 permits prepared same-origin public GET reads but keeps sensitive and cross-origin reads outside the boundary

**KEEP_PROTECTED**

- default / ADR-0036 permits prepared same-origin public GET reads but keeps sensitive and cross-origin reads outside the boundary / 0.671 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(publicRead.calls, ["fetch:0:700", "fulfill"])`
- `assert.deepEqual(publicSearchDocument.calls, ["fetch:0:700", "fulfill"], "a guarded public GET form navigation is a same-origin document read")`
- `assert.deepEqual(sensitivePath.calls, ["abort"])`

保护：GUARD_NEGATIVE_AND_NORMAL_CONTROLS

### 214 — replay applies the same admission before falling through to a HAR and never route-fetches

**KEEP_PROTECTED**

- default / replay applies the same admission before falling through to a HAR and never route-fetches / 0.159 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(document.calls, ["fallback"])`
- `assert.deepEqual(read.calls, ["fallback"])`
- `assert.deepEqual(forbidden.calls, ["abort"])`

保护：GUARD_NEGATIVE_AND_NORMAL_CONTROLS

### 230 — TableCheck calendar admission requires the captured four-string public schema

**KEEP_PROTECTED**

- default / TableCheck calendar admission requires the captured four-string public schema / 0.188 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(accepted.calls, ["fetch:0:5000", "fulfill"])`
- `assert.deepEqual(wrongPrimitive.calls, ["abort"])`
- `assert.deepEqual(guard.snapshotDiagnostics().map((item) => item.code), ["BLOCKED_FIELDS"])`

保护：GUARD_NEGATIVE_AND_NORMAL_CONTROLS

### 249 — Tabelog calendar reads admit only the captured public GET grammars

**KEEP_PROTECTED**

- default / Tabelog calendar reads admit only the captured public GET grammars / 0.261 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(accepted.calls, ["fetch:0:5000", "fulfill"])`
- `assert.deepEqual(dateStatus.calls, ["fetch:0:5000", "fulfill"])`
- `assert.deepEqual(members.calls, ["fetch:0:5000", "fulfill"])`

保护：GUARD_NEGATIVE_AND_NORMAL_CONTROLS

### 298 — TableCheck search prerequisites admit only the observed geolocation and autocomplete grammars

**KEEP_PROTECTED**

- default / TableCheck search prerequisites admit only the observed geolocation and autocomplete grammars / 0.345 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(geolocation.calls, ["fetch:0:5000", "fulfill"])`
- `assert.deepEqual(autocomplete.calls, ["fetch:0:5000", "fulfill"])`
- `assert.deepEqual(incompleteAutocomplete.calls, ["abort"])`

保护：GUARD_NEGATIVE_AND_NORMAL_CONTROLS

### 329 — TableCheck public list continuation admits its observed GET grammar only

**KEEP_PROTECTED**

- default / TableCheck public list continuation admits its observed GET grammar only / 0.231 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(publicLists.calls, ["fetch:0:5000", "fulfill"])`
- `assert.deepEqual(missingSort.calls, ["abort"])`
- `assert.deepEqual(repeatedLimit.calls, ["abort"])`

保护：GUARD_NEGATIVE_AND_NORMAL_CONTROLS

### 361 — prepared documents cannot bypass credential, sensitive-path, or sensitive-query admission

**KEEP_PROTECTED**

- default / prepared documents cannot bypass credential, sensitive-path, or sensitive-query admission / 0.301 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.throws(() => guard.prepareNavigation("https://user:pass@public.example/guide"), /credentials/)`
- `assert.throws(() => guard.prepareNavigation("https://public.example/cancel?date=2026-10-08"), /sensitive/)`
- `assert.throws(() => guard.prepareObservedNavigation("https://public.example/guide?token=opaque"), /sensitive/)`

保护：GUARD_NEGATIVE_AND_NORMAL_CONTROLS

### 368 — generic public reads block explicit destructive query values but keep an exact reviewed public query document

**KEEP_PROTECTED**

- default / generic public reads block explicit destructive query values but keep an exact reviewed public query document / 0.106 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.throws(() => guard.prepareNavigation("https://public.example/public/operation?action=cancel"), /sensitive/)`

保护：GUARD_NEGATIVE_AND_NORMAL_CONTROLS

### 375 — generic public GET admits a calendar query namespace but not a booking action

**KEEP_PROTECTED**

- default / generic public GET admits a calendar query namespace but not a booking action / 0.232 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(calendar.calls, ["fetch:0:5000", "fulfill"])`
- `assert.deepEqual(action.calls, ["abort"])`
- `assert.deepEqual(nestedCancel.calls, ["abort"])`

保护：GUARD_NEGATIVE_AND_NORMAL_CONTROLS

### 407 — guard supplies an admitted response to the in-memory recorder before fulfilling it

**KEEP_PROTECTED**

- default / guard supplies an admitted response to the in-memory recorder before fulfilling it / 0.115 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(response.calls, ["fetch:0:5000", "fulfill"])`
- `assert.fail("route handler missing")`
- `assert.equal(captured.length, 1)`

保护：GUARD_NEGATIVE_AND_NORMAL_CONTROLS

### 419 — TableCheck permanently rejects reserve documents and descendants, even with a reviewed rule

**KEEP_PROTECTED**

- default / TableCheck permanently rejects reserve documents and descendants, even with a reviewed rule / 18.541 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(request.calls, ["abort"], JSON.stringify(shape))`
- `assert.deepEqual(document.calls, ["fetch:0:5000", "fulfill"])`
- `assert.deepEqual(redirect.calls, ["fetch:0:5000", "abort"])`

保护：GUARD_NEGATIVE_AND_NORMAL_CONTROLS

### 461 — TableCheck reserve static assets admit only reviewed CDN paths and read resource types

**KEEP_PROTECTED**

- default / TableCheck reserve static assets admit only reviewed CDN paths and read resource types / 1.947 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(allowed.calls, ["fetch:0:5000", "fulfill"], \`${cdn}/${type}\`)`
- `assert.deepEqual(denied.calls, ["abort"])`
- `assert.deepEqual(denied.calls, ["abort"])`

保护：GUARD_NEGATIVE_AND_NORMAL_CONTROLS

### 484 — C3b settlement counts only short data requests and diagnoses all outstanding types

**KEEP_PROTECTED**

- default / C3b settlement counts only short data requests and diagnoses all outstanding types / 0.203 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(guard.settlementActivity().pending, 3)`
- `assert.equal(guard.settlementActivity().pending, 0, "unfinished image/beacon cannot block data readiness")`
- `assert.equal(guard.settlementActivity().pending, 0, "long connection is diagnosed without blocking")`

保护：GUARD_NEGATIVE_AND_NORMAL_CONTROLS

## src/infrastructure/deepseek/deepseek-model-gateway.test.ts

strict工具形状、配置失败、provider/传输/超时及安全metadata都在模型边界发生；无真实调用，Secret隔离与一次发送语义不删。

### 58 — DeepSeek gateway sends the complete schema through strict structured output and records redacted metadata

**KEEP_DISTINCT_CONTRACT**

- default / DeepSeek gateway sends the complete schema through strict structured output and records redacted metadata / 11.643 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.finishReason, "TOOL_CALLS")`
- `assert.deepEqual(result.usage, { inputTokens: 12, outputTokens: 8, totalTokens: 20, reasoningTokens: 3, })`
- `assert.deepEqual(records[0], { invocationId: result.invocationId, taskId: "task-intent-001", purpose: "restaurant_semantic_interpret", promptVersion: "v1", fallback: "STRUCTURED_FORM", provider: "DEEPSEEK", model: "deepseek-v4-flash", responseFormat: "JSON_SCHEMA", outputSchema: { name: "restaurant_semantic_proposal", version: "1" }, outcome: "SUCCEEDED", latencyMs: 1, providerStatus: 200, usage: result.usage, providerRequestId: "chatcmpl-123", })`

### 171 — DeepSeek gateway sends the actual restaurant strict schema with every object property required

**KEEP_DISTINCT_CONTRACT**

- default / DeepSeek gateway sends the actual restaurant strict schema with every object property required / 1.543 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(tools?.length, 1)`

### 198 — DeepSeek gateway fails closed when server configuration is incomplete

**KEEP_DISTINCT_CONTRACT**

- default / DeepSeek gateway fails closed when server configuration is incomplete / 0.488 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.throws( () => DeepSeekModelGateway.fromEnvironment({ DEEPSEEK_API_KEY: "configured" }), (error: unknown) => error instanceof ModelGatewayError && error.code === "CONFIGURATION" && !error.retryable, )`

### 206 — DeepSeek gateway classifies provider rejection without exposing response body

**KEEP_DISTINCT_CONTRACT**

- default / DeepSeek gateway classifies provider rejection without exposing response body / 1.037 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( () => gateway.complete(request), (error: unknown) => error instanceof ModelGatewayError && error.code === "PROVIDER_RATE_LIMITED" && error.retryable && error.providerStatus === 429 && error.providerRequestId === "provider-request-123" && error.providerError?.code === "rate_limit" && error.providerError?.type === "invalid_request" && error.providerError?.message === "[redacted] must not be retained" && !error.message.includes("sk_secret-token"), )`
- `assert.equal(records[0]?.outcome, "FAILED")`
- `assert.equal(records[0]?.errorCode, "PROVIDER_RATE_LIMITED")`

### 245 — DeepSeek gateway turns an aborted bounded request into a timeout

**KEEP_DISTINCT_CONTRACT**

- default / DeepSeek gateway turns an aborted bounded request into a timeout / 3.680 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( () => gateway.complete({ ...request, timeoutMs: 1 }), (error: unknown) => error instanceof ModelGatewayError && error.code === "TIMEOUT" && error.retryable, )`

### 262 — DeepSeek gateway rejects a malformed provider completion before it reaches a Domain parser

**KEEP_DISTINCT_CONTRACT**

- default / DeepSeek gateway rejects a malformed provider completion before it reaches a Domain parser / 0.300 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( () => gateway.complete(request), (error: unknown) => error instanceof ModelGatewayError && error.code === "MALFORMED_RESPONSE" && !error.retryable, )`

### 277 — DeepSeek gateway records only the safe structured-output shape when a tool call is absent

**KEEP_DISTINCT_CONTRACT**

- default / DeepSeek gateway records only the safe structured-output shape when a tool call is absent / 0.214 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( () => gateway.complete(request), (error: unknown) => error instanceof ModelGatewayError && error.code === "MALFORMED_RESPONSE" && error.providerError?.type === "STRUCTURED_OUTPUT_SHAPE" && error.providerError.message === "finish_reason=stop; tool_calls=0", )`
- `assert.deepEqual(records[0]?.providerError, { type: "STRUCTURED_OUTPUT_SHAPE", message: "finish_reason=stop; tool_calls=0", })`
- `assert.equal(JSON.stringify(records[0]).includes("must-not-log"), false)`

### 305 — DeepSeek gateway preserves safe transport causes without retries or body misclassification

**KEEP_DISTINCT_CONTRACT**

- default / DeepSeek gateway preserves safe transport causes without retries or body misclassification / 0.449 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(() => gateway.complete(request), (error: unknown) => error instanceof ModelGatewayError && error.code === "NETWORK" && error.providerError?.type === "TRANSPORT" && error.providerError.code === "ECONNRESET")`
- `assert.equal(calls, 1)`
- `assert.equal(records[0]?.errorCode, "NETWORK")`

## src/infrastructure/postgres/postgres-runtime.test.ts

15个currentTest是真正默认PGlite测试，8个probeTest不计默认。原迁移升级已有真实持久化保护，不能按开发期旧编号删；事务/租约/外写恢复与内存Runtime不重复。

### 269 — PostgresTaskRuntime with PGlite

**GROUP_NOT_A_TEST**

- default / PostgresTaskRuntime with PGlite / 8700.891 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(legacyMigration?.statements?.some((statement) => statement.includes("evidence_refs JSONB NOT NULL")))`
- `assert.deepEqual(parseDatabaseJson(migrated.rows[0]?.causal_refs), { eventIds: [], commandIds: [], attemptIds: [], evidenceIds: ["evidence-legacy"], })`
- `assert.deepEqual(parseDatabaseJson(migrated.rows[0]?.causal_refs), { eventIds: ["event-1"], commandIds: [], attemptIds: [], evidenceIds: [], })`

### 270 — upgrades immutable trajectory migration 0006 with causal refs and proposal joins

**KEEP_DISTINCT_CONTRACT**

- default / upgrades immutable trajectory migration 0006 with causal refs and proposal joins / 1404.115 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(legacyMigration?.statements?.some((statement) => statement.includes("evidence_refs JSONB NOT NULL")))`
- `assert.deepEqual(parseDatabaseJson(migrated.rows[0]?.causal_refs), { eventIds: [], commandIds: [], attemptIds: [], evidenceIds: ["evidence-legacy"], })`
- `assert.equal(legacyMigration?.statements?.some((statement) => statement.includes("causal_refs")), false)`

### 328 — keeps the short-lived causal-ref development form of already-applied migration 0006

**KEEP_DISTINCT_CONTRACT**

- default / keeps the short-lived causal-ref development form of already-applied migration 0006 / 731.740 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(parseDatabaseJson(migrated.rows[0]?.causal_refs), { eventIds: ["event-1"], commandIds: [], attemptIds: [], evidenceIds: [], })`
- `assert.equal(migrated.rows[0]?.proposal_id, null)`

### 392 — round-trips the supplied Agent decision context and schema version

**KEEP_DISTINCT_CONTRACT**

- default / round-trips the supplied Agent decision context and schema version / 642.382 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(step?.decisionContext, { schemaVersion: "17", now: "2026-08-20T00:00:00.000Z", phase: "SEARCHING", missingBlockingFields: [], candidates: [], availability: {}, availabilityChecks: {}, presentation: [], readCompletion: { allowed: false, investigationRecorded: false, unresolvedCandidateIds: [] }, legalActions: { answerPageQuestion:false, search: true, investigateCandidateFacts: [], checkAvailability: [], presentResults: [], endRead: false }, searchAvailability: { available: true }, })`
- `assert.equal(step?.contextSchemaVersion, "17")`
- `assert.equal(step?.executionRoute, "STRUCTURED_ADAPTER")`

### 451 — atomically stores task state, event and outbox command

**KEEP_DISTINCT_CONTRACT**

- default / atomically stores task state, event and outbox command / 547.653 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.snapshot.domainState.phase, "WAITING")`
- `assert.equal(status, "PENDING")`
- `assert.equal(result.snapshot.version, 1)`

### 486 — deduplicates a persisted event without emitting another command

**KEEP_DISTINCT_CONTRACT**

- default / deduplicates a persisted event without emitting another command / 516.294 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(first.commands.length, 1)`
- `assert.equal(duplicate.duplicateEvent, true)`
- `assert.equal(duplicate.commands.length, 0)`

### 507 — rejects a stale expected version

**KEEP_DISTINCT_CONTRACT**

- default / rejects a stale expected version / 547.244 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( runtime.dispatch( { id: "event-2", taskId: "task-1", event: { type: "COMPLETED", value: 1 }, occurredAt: clock.now().toISOString(), }, 0, ), StaleTaskVersionError, )`

### 533 — rolls back state and event when outbox insertion fails

**KEEP_DISTINCT_CONTRACT**

- default / rolls back state and event when outbox insertion fails / 502.993 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( runtime.dispatch({ id: "event-1", taskId: "task-1", event: { type: "TRIGGER_READ" }, occurredAt: clock.now().toISOString(), }), )`
- `assert.equal((await runtime.snapshot("task-1")).version, 0)`
- `assert.equal((await runtime.listEvents("task-1")).length, 0)`

### 581 — releases an expired read lease for another worker

**KEEP_DISTINCT_CONTRACT**

- default / releases an expired read lease for another worker / 474.216 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(first?.deliveryAttempt, 1)`
- `assert.deepEqual(await outbox.recoverExpiredLeases(clock.now().toISOString()), { retried: 1, recoveryRequired: 0, reconciled: 0, })`
- `assert.equal(second?.id, first?.id)`

### 616 — never re-leases an expired external write without a result event

**KEEP_DISTINCT_CONTRACT**

- default / never re-leases an expired external write without a result event / 465.356 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(await outbox.getStatus(commandId), "RECOVERY_REQUIRED")`
- `assert.deepEqual(await outbox.recoverExpiredLeases(clock.now().toISOString()), { retried: 0, recoveryRequired: 1, reconciled: 0, })`
- `assert.equal( await outbox.leaseNext({ workerId: "worker-2", now: clock.now().toISOString(), leaseDurationMs: 1_000, }), null, )`

### 653 — reconciles an expired external write when its result event was persisted

**KEEP_DISTINCT_CONTRACT**

- default / reconciles an expired external write when its result event was persisted / 473.772 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(await outbox.getStatus(dispatched.commands[0]!.id), "SUCCEEDED")`
- `assert.ok(command)`
- `assert.deepEqual(await outbox.recoverExpiredLeases(clock.now().toISOString()), { retried: 0, recoveryRequired: 0, reconciled: 1, })`

### 699 — worker persists a deterministic result event before completing the command

**KEEP_DISTINCT_CONTRACT**

- default / worker persists a deterministic result event before completing the command / 476.431 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "SUCCEEDED")`
- `assert.equal((await runtime.snapshot("task-1")).outcome, 9)`
- `assert.equal( await outbox.getStatus(dispatched.commands[0]!.id), "SUCCEEDED", )`

### 742 — worker delays a failed read command until its retry time

**KEEP_DISTINCT_CONTRACT**

- default / worker delays a failed read command until its retry time / 477.919 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "HANDLER_FAILED")`
- `assert.equal(await outbox.getStatus(dispatched.commands[0]!.id), "PENDING")`
- `assert.equal( await outbox.leaseNext({ workerId: "worker-2", now: clock.now().toISOString(), leaseDurationMs: 1_000, }), null, )`

### 785 — worker never retries a failed external-write handler blindly

**KEEP_DISTINCT_CONTRACT**

- default / worker never retries a failed external-write handler blindly / 465.120 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "HANDLER_FAILED")`
- `assert.equal( await outbox.getStatus(dispatched.commands[0]!.id), "RECOVERY_REQUIRED", )`
- `assert.equal( await outbox.leaseNext({ workerId: "worker-2", now: clock.now().toISOString(), leaseDurationMs: 1_000, }), null, )`

### 825 — restores a Restaurant task through a new runtime instance

**KEEP_DISTINCT_CONTRACT**

- default / restores a Restaurant task through a new runtime instance / 476.234 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(restored.domainState.readEvidence, [priceEvidence])`
- `assert.deepEqual(restored.domainState.searchContinuation?.sourceProgress, continuation.sourceProgress)`
- `assert.equal(restored.domainState.phase, "SEARCHING")`

### 913 — routes an uncertain Restaurant external write into verification without retrying commit

**KEEP_DISTINCT_CONTRACT**

- default / routes an uncertain Restaurant external write into verification without retrying commit / 496.461 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(failed.status, "HANDLER_FAILED")`
- `assert.equal(await outbox.getStatus(commitCommand.id), "RECOVERY_REQUIRED")`
- `assert.deepEqual(recovered, { status: "DISPATCHED", commandId: commitCommand.id, eventId: \`event:recovery:${commitCommand.id}\`, })`

### 1073 — G03 completes a Goal only after both critical child tasks succeed

**OUTSIDE_DEFAULT_FROZEN_PROBE**


检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual( await graph.dependencyReadiness("goal-coordination-1", "coordination-route"), { goalId: "goal-coordination-1", taskId: "coordination-route", status: "WAITING", condition: "ALL_UPSTREAM_SUCCEEDED", upstream: [{ taskId: "coordination-booking", lifecycleState: "READY" }], }, )`
- `assert.equal( (await graph.dependencyReadiness("goal-coordination-1", "coordination-route")) .status, "READY", )`
- `assert.equal((await graph.reconcileGoal("goal-coordination-1")).status, "ACTIVE")`

NOT_RUN：冻结探针独立入口，不计默认缩减收益。

### 1161 — blocks an unsatisfiable dependency and rejects cycles

**OUTSIDE_DEFAULT_FROZEN_PROBE**


检错依据（精确原断言；全文见 source card）：

- `assert.equal( (await graph.dependencyReadiness("goal-graph-2", "graph-b")).status, "BLOCKED", )`
- `assert.rejects( graph.addDependency({ goalId: "goal-graph-2", upstreamTaskId: "graph-c", downstreamTaskId: "graph-b", condition: "UPSTREAM_SUCCEEDED", }), /would create a cycle/, )`

NOT_RUN：冻结探针独立入口，不计默认缩减收益。

### 1206 — dispatches a due trigger once and preserves its causal event ID

**OUTSIDE_DEFAULT_FROZEN_PROBE**


检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(await scheduler.runOnce("scheduler-1"), { status: "IDLE" })`
- `assert.deepEqual(await scheduler.runOnce("scheduler-1"), { status: "DISPATCHED", triggerId: "trigger-due-1", eventId: "event:trigger:trigger-due-1", })`
- `assert.equal((await runtime.snapshot("trigger-due-task")).outcome, 42)`

NOT_RUN：冻结探针独立入口，不计默认缩减收益。

### 1258 — G01 recurring shopping waits for every user confirmation across persisted trigger cycles

**OUTSIDE_DEFAULT_FROZEN_PROBE**


检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(await scheduler.runOnce("shopping-scheduler"), { status: "DISPATCHED", triggerId: "shopping-trigger-1", eventId: "event:trigger:shopping-trigger-1", })`
- `assert.equal(snapshot.domainState.phase, "AWAITING_CONFIRMATION")`
- `assert.equal(confirmation.snapshot.domainState.phase, "PREPARING_ORDER")`

NOT_RUN：冻结探针独立入口，不计默认缩减收益。

### 1369 — G02 long-running case waits for external events and material before resubmitting

**OUTSIDE_DEFAULT_FROZEN_PROBE**


检错依据（精确原断言；全文见 source card）：

- `assert.equal(requested.snapshot.domainState.phase, "SUBMITTING")`
- `assert.equal(firstSubmission.snapshot.domainState.phase, "WAITING_EXTERNAL")`
- `assert.equal(needsMaterial.snapshot.domainState.phase, "NEEDS_MATERIAL")`

NOT_RUN：冻结探针独立入口，不计默认缩减收益。

### 1473 — recovers an expired trigger lease and lets another scheduler deliver it

**OUTSIDE_DEFAULT_FROZEN_PROBE**


检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "DISPATCHED")`
- `assert.equal((await runtime.snapshot("trigger-recovery-task")).outcome, 7)`
- `assert.equal(await triggers.getStatus("trigger-recovery-1"), "DISPATCHED")`

NOT_RUN：冻结探针独立入口，不计默认缩减收益。

### 1520 — marks a trigger obsolete when its expected Task version is stale

**OUTSIDE_DEFAULT_FROZEN_PROBE**


检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "OBSOLETE")`
- `assert.equal(await triggers.getStatus("trigger-stale-1"), "OBSOLETE")`
- `assert.equal((await runtime.listEvents("trigger-stale-task")).length, 1)`

NOT_RUN：冻结探针独立入口，不计默认缩减收益。

### 1567 — bounds a trigger mapping failure instead of retrying forever

**OUTSIDE_DEFAULT_FROZEN_PROBE**


检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(await scheduler.runOnce("scheduler-failure"), { status: "MAPPING_FAILED", triggerId: "trigger-failure-1", retryStatus: "FAILED", error: "unsupported scheduled event", })`
- `assert.equal(await triggers.getStatus("trigger-failure-1"), "FAILED")`

NOT_RUN：冻结探针独立入口，不计默认缩减收益。

## src/integrations/google/google-places-client.test.ts

Google transport字段掩码、代理、headers凭据与响应body挂起有各自独立故障；核心网络/超时行为不是搜索排名测试可代替。

### 8 — Google Text Search carries an opaque page token and keeps its response field separate from Place Details

**KEEP_DISTINCT_CONTRACT**

- default / Google Text Search carries an opaque page token and keeps its response field separate from Place Details / 27.705 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(page.nextPageToken, "page-2")`
- `assert.deepEqual(requests[0]?.body, { textQuery: "restaurant", pageSize: 20, pageToken: "page-1" })`
- `assert.equal(requests[0]?.fieldMask, GOOGLE_PLACES_RESTAURANT_FIELD_MASK)`

### 32 — Google Nearby Search sends only the pack-selected type and exact planner circle

**KEEP_DISTINCT_CONTRACT**

- default / Google Nearby Search sends only the pack-selected type and exact planner circle / 0.738 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(request?.url, "https://places.googleapis.com/v1/places:searchNearby")`
- `assert.deepEqual(request?.body, { includedTypes: ["restaurant"], maxResultCount: 20, locationRestriction: { circle: { center: { latitude: 35.6697, longitude: 139.767 }, radius: 3_000 } } })`
- `assert.doesNotMatch(request?.mask ?? "", /nextPageToken/)`

### 46 — Google Places hard deadline rejects even when fetch ignores AbortSignal

**KEEP_DISTINCT_CONTRACT**

- default / Google Places hard deadline rejects even when fetch ignores AbortSignal / 5.790 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( client.textSearch({ textQuery: "restaurant", pageSize: 1 }, new AbortController().signal), (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === "GOOGLE_TIMEOUT", )`

### 58 — Google Places deadline also bounds a response body that never resolves

**KEEP_DISTINCT_CONTRACT**

- default / Google Places deadline also bounds a response body that never resolves / 5.823 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( client.textSearch({ textQuery: "restaurant", pageSize: 1 }, new AbortController().signal), (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === "GOOGLE_TIMEOUT", )`

### 70 — Google Places distinguishes service rate/permission responses from local request budgets

**KEEP_DISTINCT_CONTRACT**

- default / Google Places distinguishes service rate/permission responses from local request budgets / 0.695 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( rateLimited.textSearch({ textQuery: "restaurant", pageSize: 1 }, new AbortController().signal), (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === "GOOGLE_RATE_LIMITED", )`
- `assert.rejects( quotaOrPermission.textSearch({ textQuery: "restaurant", pageSize: 1 }, new AbortController().signal), (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === "GOOGLE_SERVICE_QUOTA_OR_PERMISSION", )`

### 89 — Google Places sends its API request through its own configured proxy

**KEEP_DISTINCT_CONTRACT**

- default / Google Places sends its API request through its own configured proxy / 26.874 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( client.textSearch({ textQuery: "Shibuya", pageSize: 1 }, new AbortController().signal), (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === "GOOGLE_NETWORK_FAILED", )`
- `assert.ok(address && typeof address !== "string")`
- `assert.deepEqual(targets, ["places.googleapis.com:443"])`

### 116 — reverse address observation is one minimal public GET with credentials only in headers

**KEEP_DISTINCT_CONTRACT**

- default / reverse address observation is one minimal public GET with credentials only in headers / 0.601 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(String(url), "https://geocode.googleapis.com/v4/geocode/location?location.latitude=1&location.longitude=2")`
- `assert.equal(init?.method, "GET")`
- `assert.equal((init?.headers as Record<string, string>)["X-Goog-FieldMask"], "results.addressComponents")`

## src/integrations/google/google-places-restaurant-search.test.ts

候选地域/分页/预算/事实再读保留；419行稳定ID路径可并入383行同一次搜索→Details控制，451行transport隐私反例可并入463行失败计账，具体断言须完整迁移。

### 15 — ranked named geography accepts the saved spellings, keeps nearby geographic alternatives and rejects remote ambiguity

**KEEP_DISTINCT_CONTRACT**

- default / ranked named geography accepts the saved spellings, keeps nearby geographic alternatives and rejects remote ambiguity / 6.842 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.evidence?.claims.locationNameExactMatch, false, "spelling correspondence is recorded, never a gate")`
- `assert.equal(clustered.publicLocationObservation?.placeId, first.id, "preserve source ranking inside a local cluster")`
- `assert.rejects(resolve([{ ...first, types: ["restaurant"] }], "near user supplied area"), { code: "GOOGLE_LOCATION_UNRESOLVED" })`

### 37 — Google query is discovery-owned and does not serialize criteria into retrieval text

**KEEP_DISTINCT_CONTRACT**

- default / Google query is discovery-owned and does not serialize criteria into retrieval text / 0.121 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.match(query, /Shinjuku/)`
- `assert.match(query, /Japanese wording/)`
- `assert.doesNotMatch(query, /yakiniku/)`

### 44 — a positive-HARD pack query keeps only its keyword and resolved location in Text Search

**KEEP_DISTINCT_CONTRACT**

- default / a positive-HARD pack query keeps only its keyword and resolved location in Text Search / 0.290 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(query, "omakase Shibuya")`

### 52 — a source-plan location prevents a second named-place lookup before Google discovery

**KEEP_DISTINCT_CONTRACT**

- default / a source-plan location prevents a second named-place lookup before Google discovery / 1.108 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(queries, ["omakase Shibuya"])`

### 70 — a pack query without a positive HARD keyword uses Nearby Search's exact circle instead of location-only text

**KEEP_DISTINCT_CONTRACT**

- default / a pack query without a positive HARD keyword uses Nearby Search's exact circle instead of location-only text / 2.122 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.continuation?.exhausted, true)`
- `assert.equal(requests[0]?.url, "https://places.googleapis.com/v1/places:searchNearby")`
- `assert.equal((requests[0]?.body.locationRestriction as { circle: { radius: number } }).circle.radius, 3_000)`

### 86 — initial discovery reads at most two 20-result pages, dedupes stable outlets, and retains the next cursor

**KEEP_DISTINCT_CONTRACT**

- default / initial discovery reads at most two 20-result pages, dedupes stable outlets, and retains the next cursor / 2.371 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.candidates.length, 3, "the second page duplicate is merged by stable outlet ID")`
- `assert.deepEqual(result.continuation, { intentFingerprint: JSON.stringify(fixtureIntent), nextPageToken: "page-3", usedPageTokens: ["page-2"], pagesRead: 2, exhausted: false, sourceRequestContext: { textQuery: buildGooglePlacesTextQuery({ intent: fixtureIntent }) }, locationContext: { latitude: 35.6, longitude: 139.7, radiusMeters: 1000, label: fixtureIntent.area.query, areaMatchBasis: "TASK_LOCATION_RADIUS" }, })`
- `assert.deepEqual(continued.candidates.map((candidate) => candidate.restaurant.sourceIds.googlePlaces), ["d"])`

### 126 — a second-page provider failure preserves accepted first-page candidates and records a bounded retry cursor

**KEEP_DISTINCT_CONTRACT**

- default / a second-page provider failure preserves accepted first-page candidates and records a bounded retry cursor / 2.423 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(calls, 2)`
- `assert.equal(result.candidates.length, 1)`
- `assert.equal(result.metadata.failureCode, "GOOGLE_SERVICE_REJECTED")`

### 152 — named-location resolution accepts near X and bare X with the same bounded typed observation

**KEEP_DISTINCT_CONTRACT**

- default / named-location resolution accepts near X and bare X with the same bounded typed observation / 0.960 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(calls, 1)`
- `assert.equal(JSON.parse(String(init?.body)).textQuery, "Higashi Ginza")`
- `assert.deepEqual(result.publicLocationObservation, { placeId: "higashi-ginza", displayName: "Higashi Ginza", types: ["neighborhood", "political"], addressComponents: [{ longText: "Ginza", types: ["sublocality_level_1", "political"] }], coordinates: { latitude: 35.6697, longitude: 139.767 }, })`

### 175 — a named nearby place is resolved to observed coordinates and grounds candidate distance

**KEEP_DISTINCT_CONTRACT**

- default / a named nearby place is resolved to observed coordinates and grounds candidate distance / 4.758 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.candidates.map((candidate) => candidate.restaurant.outletName), ["Nearby Cafe"])`
- `assert.equal(result.evidence.some((item) => item.kind === "DISCOVERY" && item.claims.areaMatch === false), false, "a candidate outside the named-place radius must not be emitted as discovery evidence")`
- `assert.equal(result.evidence[0]?.claims.locationResolutionSource, "GOOGLE_TEXT_SEARCH")`

### 249 — geographic source labels require no spelling or administrative suffix inference

**KEEP_DISTINCT_CONTRACT**

- default / geographic source labels require no spelling or administrative suffix inference / 2.891 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.evidence?.claims.resolvedPlaceTypes, [type])`
- `assert.equal(result.location?.label, place.displayName.text)`

### 259 — an unrelated first search result never becomes a named nearby landmark

**KEEP_DISTINCT_CONTRACT**

- default / an unrelated first search result never becomes a named nearby landmark / 1.752 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( search.search({ intent: { ...fixtureIntent, area: { query: "near Central Station" } } }, new AbortController().signal), (error: unknown) => error instanceof Error && "code" in error && error.code === "GOOGLE_LOCATION_UNRESOLVED" && error.message.includes("Different Station") && error.message.includes("wrong"), )`

### 273 — unresolved named-place diagnostics retain only bounded public identity observations

**KEEP_DISTINCT_CONTRACT**

- default / unresolved named-place diagnostics retain only bounded public identity observations / 1.312 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( search.search({ intent: { ...fixtureIntent, area: { query: "near Central Station" } } }, new AbortController().signal), (error: unknown) => { if (!error || typeof error !== "object" || !("publicLocationObservations" in error)) return false; const observations = error.publicLocationObservations as Array<Record<string, unknown>>; assert.deepEqual(observations, [{ placeId: "wrong", displayName: "Different Station", types: ["restaurant"], addressComponents: [{ longText: "Shinjuku City", shortText: "Shinjuku", types: ["locality"] }], coordinates: { latitude: 35.6, longitude: 139.7 }, }]); assert.doesNotMatch(JSON.stringify(observations), /private-phone|private\.example|not-retained-address/); return true; }, )`
- `assert.deepEqual(observations, [{ placeId: "wrong", displayName: "Different Station", types: ["restaurant"], addressComponents: [{ longText: "Shinjuku City", shortText: "Shinjuku", types: ["locality"] }], coordinates: { latitude: 35.6, longitude: 139.7 }, }])`
- `assert.doesNotMatch(JSON.stringify(observations), /private-phone|private\.example|not-retained-address/)`

### 300 — Google Places text search uses the explicit small field mask and stable candidate IDs

**KEEP_DISTINCT_CONTRACT**

- default / Google Places text search uses the explicit small field mask and stable candidate IDs / 0.915 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.candidates[0]?.restaurant.id.startsWith("praxis:restaurant:"), true)`
- `assert.equal(result.evidence.length, 3)`
- `assert.deepEqual(result.evidence.map((item) => item.kind), ["DISCOVERY", "ENTITY_MATCH", "RESTAURANT_FACT"])`

### 322 — Google Places reports eval-radius decisions separately from its accepted discovery pool

**KEEP_DISTINCT_CONTRACT**

- default / Google Places reports eval-radius decisions separately from its accepted discovery pool / 1.358 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.candidates.map((candidate) => candidate.restaurant.sourceIds.googlePlaces), ["eval-near"])`
- `assert.deepEqual(evalDiagnostics.map(({ distanceMeters: _distanceMeters, ...diagnostic }) => diagnostic), [ { sourcePlaceId: "eval-near", sourceCoordinates: { latitude: 35.6763, longitude: 139.6504 }, accepted: true, reasonCode: "ACCEPTED" }, { sourcePlaceId: "eval-far", sourceCoordinates: { latitude: 35.8, longitude: 139.8 }, accepted: false, reasonCode: "GOOGLE_OUTSIDE_REQUESTED_RADIUS" }, { sourcePlaceId: "eval-missing", accepted: false, reasonCode: "GOOGLE_LOCATION_REQUIRED_FOR_RADIUS" }, ])`
- `assert.equal(result.evidence.some((item) => item.claims.placeId === "eval-far" || item.claims.placeId === "eval-missing"), false, "rejected eval observations are diagnostics only")`

### 372 — Google Places request budget is mechanical and isolated by persistent read run

**KEEP_DISTINCT_CONTRACT**

- default / Google Places request budget is mechanical and isolated by persistent read run / 2.312 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(search.search({ intent: fixtureIntent, readRunId: "task-a" }, new AbortController().signal), { code: "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED" })`

### 383 — candidate fact investigation re-reads only the known Google place and shares discovery budget

**KEEP_DISTINCT_CONTRACT**

- default / candidate fact investigation re-reads only the known Google place and shares discovery budget / 11.239 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(calls, 2)`
- `assert.equal(facts.factChecks[discovered.candidates[0]!.restaurant.id]?.status, "COMPLETED")`
- `assert.ok(facts.evidence.some((item) => item.kind === "RESTAURANT_FACT" && item.claims.openingHoursMatch === true))`

### 419 — candidate fact investigation uses Place Details by stable ID, never another text search

**RETIRE_OR_MERGE_PROPOSED** · A-D02

两条都构造Cafe One/place-1的同一GooglePlacesRestaurantSearch→search→inspectFacts→GooglePlacesClient路径；419行只额外断言第二个URL是/v1/places/place-1，383行已核对读取成功、营业时间和共享两次额度。保留更完整正常控制并加上该URL断言，省掉第二次同路径装配。

- default / candidate fact investigation uses Place Details by stable ID, never another text search / 0.327 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.match(urls[1] ?? "", /\/v1\/places\/place-1$/)`

### 436 — a fact read records exhausted shared discovery capacity without a second provider call

**KEEP_DISTINCT_CONTRACT**

- default / a fact read records exhausted shared discovery capacity without a second provider call / 1.048 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(facts.factChecks[discovered.candidates[0]!.restaurant.id]?.reasonCode, "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED")`
- `assert.equal(facts.metadata.failureCode, "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED")`

### 451 — Google Places classifies provider failure without exposing a response body

**RETIRE_OR_MERGE_PROPOSED** · A-D03

451行在Search测试文件里直接调用GooglePlacesClient.textSearch，只有同一fetch抛Error后GOOGLE_NETWORK_FAILED和错误消息脱敏。463行已经从真正Search入口触发同一Client失败并核对失败计账；把原upstream diagnostic payload的不可见断言移入后，错误和预算可在一次失败上共同核对。

- default / Google Places classifies provider failure without exposing a response body / 0.135 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects( failed.textSearch({ textQuery: "restaurant", pageSize: 1 }, new AbortController().signal), (error: unknown) => error instanceof Error && "code" in error && error.code === "GOOGLE_NETWORK_FAILED" && !error.message.includes("upstream diagnostic payload"), )`

### 463 — failed sent Google requests consume the same per-run local budget and remain separately accounted

**KEEP_DISTINCT_CONTRACT**

- default / failed sent Google requests consume the same per-run local budget and remain separately accounted / 0.959 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(search.search({ intent: fixtureIntent, readRunId: "failed-run" }, new AbortController().signal), { code: "GOOGLE_NETWORK_FAILED" })`
- `assert.rejects(search.search({ intent: fixtureIntent, readRunId: "failed-run" }, new AbortController().signal), { code: "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED" })`
- `assert.deepEqual(search.googleRequestUsage("failed-run"), { limit: 1, total: 1, namedPlaceResolution: 0, discovery: 1, placeDetails: 0, reverseAddressObservation: 0, })`

### 480 — the explicit one-hundred-request debug ceiling permits work beyond the retired cap and stops only at its own run boundary

**KEEP_DISTINCT_CONTRACT**

- default / the explicit one-hundred-request debug ceiling permits work beyond the retired cap and stops only at its own run boundary / 6.473 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(search.search({ intent: fixtureIntent, readRunId: "debug-run" }, new AbortController().signal), { code: "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED" })`
- `assert.equal(sent, 100)`
- `assert.deepEqual(search.googleRequestUsage("debug-run"), { limit: 100, total: 100, namedPlaceResolution: 0, discovery: 100, placeDetails: 0, reverseAddressObservation: 0, })`

### 506 — nearby defaults to 1000 meters, preserves explicit radius and admits only the exact circle

**KEEP_DISTINCT_CONTRACT**

- default / nearby defaults to 1000 meters, preserves explicit radius and admits only the exact circle / 0.523 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(evaluation.candidates.map(c => c.restaurant.sourceIds.googlePlaces), ["distance-999"])`
- `assert.equal(explicit.candidates.length, 2)`
- `assert.equal(evaluation.metadata.googleGeoDiagnostics?.radiusMeters, 1000)`

### 531 — named area resolution binds bias, prefers geography and refuses distant or merchant authority

**KEEP_DISTINCT_CONTRACT**

- default / named area resolution binds bias, prefers geography and refuses distant or merchant authority / 0.538 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(resolve(recorded.places, "near Recorded area"), { code: "GOOGLE_LOCATION_UNRESOLVED" })`
- `assert.rejects(resolve([merchant]), { code: "GOOGLE_LOCATION_UNRESOLVED" })`
- `assert.rejects(resolve([{ ...geographic, location: { latitude: 3, longitude: 4 } }]), error => { assert.equal((error as { code: string }).code, "GOOGLE_LOCATION_AMBIGUOUS"); assert.equal((error as { publicLocationObservations: unknown[] }).publicLocationObservations.length, 1); return true; })`

### 559 — saved successful geographic observations retain their source coordinates and distance boundary

**KEEP_DISTINCT_CONTRACT**

- default / saved successful geographic observations retain their source coordinates and distance boundary / 0.809 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(resolve("Ebisu", [{ id: "merchant", displayName: { text: "Ebisu" }, types: ["restaurant"], location: { latitude: 26.9355755, longitude: -80.1379124 } }]), { code: "GOOGLE_LOCATION_UNRESOLVED" })`
- `assert.rejects(resolve("Kichijoji", [{ ...fixture.kichijoji, location: { latitude: 26.9, longitude: -80.1 } }]), { code: "GOOGLE_LOCATION_AMBIGUOUS" })`
- `assert.deepEqual(body.locationBias.circle, { center, radius: 1000 })`

## src/integrations/restaurant-availability/availability-source-resolver.test.ts

来源顺序只由合法同店入口改变，原生候选不跨平台、失败UNKNOWN不被覆盖；C接口刚合入，暂不跨对话删测。

### 46 — source resolver always prefers TableCheck and does not call Tabelog after a conclusive read

**KEEP_DISTINCT_CONTRACT**

- default / source resolver always prefers TableCheck and does not call Tabelog after a conclusive read / 1.035 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(calls, ["TABLECHECK"])`
- `assert.deepEqual(result.metadata.providerAttempts, [{ candidateId: candidate.restaurant.id, provider: "TABLECHECK", outcome: "AVAILABLE" }])`
- `assert.equal(result.metadata.provider, "TABLECHECK")`

### 57 — a legal Tabelog same-store entrance changes only source order and still stops after its grounded no-slot observation

**KEEP_DISTINCT_CONTRACT**

- default / a legal Tabelog same-store entrance changes only source order and still stops after its grounded no-slot observation / 0.140 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(calls, ["TABELOG"])`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNAVAILABLE")`
- `assert.deepEqual(result.availabilityChecks[candidate.restaurant.id]?.sourceAttempts, [{ source: "TABELOG", outcome: "UNAVAILABLE" }])`

### 75 — a source-native outlet is checked only on its own platform even when the read is unknown

**KEEP_DISTINCT_CONTRACT**

- default / a source-native outlet is checked only on its own platform even when the read is unknown / 0.192 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(calls, [expected])`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, expected === "TABLECHECK" ? "UNKNOWN" : "AVAILABLE")`

### 92 — an unrelated or malformed URL cannot reorder the default TableCheck-first source path

**KEEP_DISTINCT_CONTRACT**

- default / an unrelated or malformed URL cannot reorder the default TableCheck-first source path / 0.195 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(calls, ["TABLECHECK"], googleWebsiteUri)`

### 104 — source resolver falls back from a TableCheck provider failure to Tabelog

**KEEP_DISTINCT_CONTRACT**

- default / source resolver falls back from a TableCheck provider failure to Tabelog / 1.451 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(calls, ["TABLECHECK", "TABELOG"])`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNAVAILABLE")`
- `assert.deepEqual(result.metadata.providerAttempts, [ { candidateId: candidate.restaurant.id, provider: "TABLECHECK", outcome: "PROVIDER_FAILURE", failureCode: "EXTRACTION_FAILED" }, { candidateId: candidate.restaurant.id, provider: "TABELOG", outcome: "UNAVAILABLE" }, ])`

### 118 — Tabelog bot challenge remains provider-scoped and all providers exhausted fail closed

**KEEP_DISTINCT_CONTRACT**

- default / Tabelog bot challenge remains provider-scoped and all providers exhausted fail closed / 0.222 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(calls, ["TABLECHECK", "TABELOG"])`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN")`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "BOT_CHALLENGE")`

### 135 — group-window: disabled requested party moves to next candidate rather than another query

**KEEP_DISTINCT_CONTRACT**

- default / group-window: disabled requested party moves to next candidate rather than another query / 0.122 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(calls,["TABLECHECK"])`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]!.status,"UNKNOWN")`
- `assert.equal(result.offers.length,0)`

### 140 — group-window: one unsupported source does not erase another source's UNKNOWN

**KEEP_DISTINCT_CONTRACT**

- default / group-window: one unsupported source does not erase another source's UNKNOWN / 0.079 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(calls,["TABLECHECK","TABELOG"])`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]!.status,"UNKNOWN")`
- `assert.equal(result.offers.length,0)`

## src/integrations/restaurant-availability/bound-result-completion.test.ts

五个生产completion调用方虽共享settlement helper，但各自result key与scope选择不同；不同caller不可合成只留一种来源，G3改变scope需B负责。

### 40 — `${item.name}: displayed bound result completes despite unrelated calendar/image loaders`

**KEEP_DISTINCT_CONTRACT**

- default / Tabelog name search: displayed bound result completes despite unrelated calendar/image loaders / 518.203 ms / pass
- default / TableCheck name search: displayed bound result completes despite unrelated calendar/image loaders / 504.244 ms / pass
- default / Tabelog availability: displayed bound result completes despite unrelated calendar/image loaders / 506.715 ms / pass
- default / TABELOG native listing: displayed bound result completes despite unrelated calendar/image loaders / 503.879 ms / pass
- default / TABLECHECK native listing: displayed bound result completes despite unrelated calendar/image loaders / 503.219 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "COMPLETED")`
- `assert.equal(item.completion({ ...page(ready), settlement: "SETTLED" }).resultBusy, false)`
- `assert.equal(result.snapshot.settlement, "SETTLED")`

### 45 — `${item.name}: a result-region skeleton keeps even old parsed results pending`

**KEEP_DISTINCT_CONTRACT**

- default / Tabelog name search: a result-region skeleton keeps even old parsed results pending / 0.957 ms / pass
- default / TableCheck name search: a result-region skeleton keeps even old parsed results pending / 0.522 ms / pass
- default / Tabelog availability: a result-region skeleton keeps even old parsed results pending / 0.992 ms / pass
- default / TABELOG native listing: a result-region skeleton keeps even old parsed results pending / 0.454 ms / pass
- default / TABLECHECK native listing: a result-region skeleton keeps even old parsed results pending / 0.229 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.notEqual(result.status, "COMPLETED")`
- `assert.equal(item.completion({ ...page(loading), settlement: "SETTLED" }).resultBusy, true)`
- `assert.equal(result.snapshot.settlement, "PENDING")`

### 51 — `${item.name}: changed bound results between snapshots stay pending`

**KEEP_DISTINCT_CONTRACT**

- default / Tabelog name search: changed bound results between snapshots stay pending / 1507.070 ms / pass
- default / TableCheck name search: changed bound results between snapshots stay pending / 1506.943 ms / pass
- default / Tabelog availability: changed bound results between snapshots stay pending / 1508.985 ms / pass
- default / TABELOG native listing: changed bound results between snapshots stay pending / 1507.670 ms / pass
- default / TABLECHECK native listing: changed bound results between snapshots stay pending / 1507.173 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.notEqual(result.status, "COMPLETED")`
- `assert.notEqual(item.completion({ ...page(ready), settlement: "SETTLED" }).resultKey, item.completion({ ...page(changed), settlement: "SETTLED" }).resultKey)`
- `assert.equal(result.snapshot.settlement, "PENDING")`

## src/integrations/restaurant-availability/live-browser-availability.test.ts

来源链共享Session、候选间入口提示须重新识别、Run结束清提示；正常组合与缓存泄露不是同一失败机制。

### 12 — production composition shares one literal-fragment model proposal across both source searches

**KEEP_DISTINCT_CONTRACT**

- default / production composition shares one literal-fragment model proposal across both source searches / 10.482 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(request.purpose, "restaurant_named_source_query")`
- `assert.equal(calls, 1)`
- `assert.equal(budget.totalModelCalls, 1)`

### 63 — Live browser composition keeps TableCheck then Tabelog in one session and closes it after the chain

**KEEP_DISTINCT_CONTRACT**

- default / Live browser composition keeps TableCheck then Tabelog in one session and closes it after the chain / 3.126 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE")`
- `assert.deepEqual(diagnostics.filter(item => item.event === "PROVIDER_STARTED").map(item => item.source), ["TABLECHECK", "TABELOG"])`
- `assert.deepEqual(diagnostics.filter(item => item.event === "PROVIDER_FINISHED").map(item => item.lifecycle.outcome), ["FINISHED", "FINISHED"])`

### 89 — Live composition reuses a source-observed Hajime entrance across candidate batches, but re-identifies it

**KEEP_DISTINCT_CONTRACT**

- default / Live composition reuses a source-observed Hajime entrance across candidate batches, but re-identifies it / 17.628 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[hajime.restaurant.id]?.status, "AVAILABLE")`
- `assert.equal(second.openedPages[0]?.includes("/japan/search"), true, "current candidate still performs its own discovery")`
- `assert.equal(second.openedPages[1], "https://www.tablecheck.com/en/sushihajime-shibuya", "observed Teppen-page entrance is a later identity-gated hint")`

### 129 — Live composition clears observed TableCheck entrances when a read run ends

**KEEP_DISTINCT_CONTRACT**

- default / Live composition clears observed TableCheck entrances when a read run ends / 0.894 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[hajime.restaurant.id]?.status, "UNKNOWN")`
- `assert.equal(second.openedPages.includes("https://www.tablecheck.com/en/sushihajime-shibuya"), false)`

## src/integrations/restaurant-availability/native-outlet-continuity.test.ts

同源ID连续性不能扩到官网/错分店/challenge；130行无Guard mock读reserve不代表生产允许该URL，服务范围隔离仍保留并交B判断G3后是否退役。

### 10 — Tabelog native outlet continuity accepts a language canonical for the same source ID

**KEEP_DISTINCT_CONTRACT**

- default / Tabelog native outlet continuity accepts a language canonical for the same source ID / 1.070 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.observedSourceEntityId, "tokyo/A1303/A130301/13308491")`
- `assert.equal(inspectNativeOutletContinuity({ provider: "TABELOG", sourceEntityId: "en/tokyo/A1303/A130301/13308491", sourceUrl: expected }, { ...page, url: expected.replace("13308491", "13308492") }, { sourceEntityId: "tokyo/A1303/A130301/13308492", sourceUrl: canonical.replace("13308491", "13308492"), pageOwnedName: true, pageOwnedAddress: true, }).reason, "OUTLET_CHANGED")`
- `assert.equal(inspectNativeOutletContinuity({ provider: "TABELOG", sourceEntityId: "en/tokyo/A1303/A130301/13308491", sourceUrl: expected }, { ...page, url: "https://tabelog.com/tokyo/A1304/A130401/13308491/" }, { sourceEntityId: "tokyo/A1304/A130401/13308491", sourceUrl: "https://tabelog.com/tokyo/A1304/A130401/13308491/", pageOwnedName: true, pageOwnedAddress: true, }).reason, "OUTLET_CHANGED", "a repeated numeric suffix in a different area path is not the same outlet")`

### 32 — native fact reads never pass a same-URL challenge or explicit error page to judgment

**KEEP_DISTINCT_CONTRACT**

- default / native fact reads never pass a same-URL challenge or explicit error page to judgment / 3.879 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.evidence.length, 0)`
- `assert.equal(read.factChecks[candidate.restaurant.id]?.status, "UNKNOWN")`
- `assert.equal(read.metadata.nativeContinuity?.[0]?.reason, reason)`

### 64 — native fact read retains each observed source page with its own identity

**KEEP_DISTINCT_CONTRACT**

- default / native fact read retains each observed source page with its own identity / 505.413 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.factChecks[candidate.restaurant.id]?.status, "COMPLETED", JSON.stringify(read))`
- `assert.equal(judged, 2, "the second judgment follows a newly retained source page, not a type keyword")`
- `assert.equal(read.sourceDocuments?.length, 2)`

### 101 — native fact continuation keeps the prior judgment when no new cited page is retained

**KEEP_DISTINCT_CONTRACT**

- default / native fact continuation keeps the prior judgment when no new cited page is retained / 2.840 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.factChecks[candidate.restaurant.id]?.status, "UNKNOWN")`
- `assert.equal(judgments, 1, "a repeated page is not material for a second cited judgment")`

### 123 — an observed official page cannot inherit native outlet identity from a shared phone

**KEEP_DISTINCT_CONTRACT**

- default / an observed official page cannot inherit native outlet identity from a shared phone / 0.132 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(candidateVisibleObservation(candidate, "https://restaurant.example/menu", "2026-10-06T00:00:00.000Z", wrongBranch, '<a href="tel:03-1111-2222">call</a>', { allowExactSourcePhone: false }), undefined)`

### 130 — native TableCheck facts read an observed reserve menu as a scoped document without widening its text to the guide

**KEEP_DISTINCT_CONTRACT**

- default / native TableCheck facts read an observed reserve menu as a scoped document without widening its text to the guide / 3.353 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(documents.find((document) => document.serviceScope?.value === "bar")!.statements.some((statement) => /omakase/i.test(statement.text)), false, "a sibling category cannot borrow the sushi source text")`
- `assert.equal(documents.filter((document) => document.serviceScope === undefined).some((document) => document.statements.some((statement) => /no fast food/i.test(statement.text))), true, "a venue-wide source statement stays available to the global negative-condition gate")`
- `assert.ok(reserveRemainder, "the reserve-page remainder remains a bounded source document")`

### 182 — an observed TableCheck reserve entrance cannot turn stale outlet metadata on a challenge page into fact evidence

**KEEP_DISTINCT_CONTRACT**

- default / an observed TableCheck reserve entrance cannot turn stale outlet metadata on a challenge page into fact evidence / 1.384 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.factChecks[candidate.restaurant.id]?.status, "UNKNOWN")`
- `assert.equal(judgments, 1, "the initial guide can be judged once, but the challenged reserve page cannot enter the cited document set")`
- `assert.equal(documents.some((document) => document.statements.some((statement) => /verify you are human/i.test(statement.text))), false)`

### 208 — an observed TableCheck reserve entrance rejects a foreign canonical even with matching visible fields

**KEEP_DISTINCT_CONTRACT**

- default / an observed TableCheck reserve entrance rejects a foreign canonical even with matching visible fields / 0.915 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(documents.some((document) => document.statements.some((statement) => /omakase/i.test(statement.text))), false)`

## src/integrations/restaurant-availability/outlet-identity.test.ts

楼层/门牌/邮编显式冲突优先于电话同名，语言归一化不能抹冲突；C的G4正负控制受保护，格式变化不是任意数据排列。

### 14 — same floor survives language, case, width and delimiter changes in either source order

**KEEP_DISTINCT_CONTRACT**

- default / same floor survives language, case, width and delimiter changes in either source order / 7.202 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(compareCompleteOutletAddress(address(left!), address(right!)), "MATCH", \`${left} ≡ ${right}\`)`

### 45 — `structured address restores ${example.id} without changing exact-phone identity`

**KEEP_DISTINCT_CONTRACT**

- default / structured address restores nr-004 without changing exact-phone identity / 1.628 ms / pass
- default / structured address restores nr-016 without changing exact-phone identity / 0.258 ms / pass
- default / structured address restores nr-024 without changing exact-phone identity / 0.211 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(compareCompleteOutletAddress(example.google, example.source), "MATCH")`
- `assert.equal(compareCompleteOutletAddress(example.source, example.google), "MATCH")`
- `assert.equal(resolveTabelogEntity(candidate, [outlet]).confidence, "HIGH")`

### 57 — same phone and name never override explicit floor, door or nr-020 postal conflicts

**KEEP_DISTINCT_CONTRACT**

- default / same phone and name never override explicit floor, door or nr-020 postal conflicts / 0.494 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.notEqual(resolveTabelogEntity(candidate, [outlet]).confidence, "HIGH")`
- `assert.notEqual(inspectTableCheckEntity(candidate, outlet).resolution.confidence, "HIGH")`
- `assert.notEqual(resolveTabelogEntity(candidate, [wrongPhone]).confidence, "HIGH")`

### 74 — omitted floors stay neutral without losing street numbers or accepting incomplete addresses

**KEEP_DISTINCT_CONTRACT**

- default / omitted floors stay neutral without losing street numbers or accepting incomplete addresses / 1.415 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(compareCompleteOutletAddress(address(floor), address("")), "MATCH", \`${floor} → omitted\`)`
- `assert.equal(compareCompleteOutletAddress(address(""), address(floor)), "MATCH", \`omitted → ${floor}\`)`
- `assert.equal(compareCompleteOutletAddress(left, right), "INSUFFICIENT", \`${left} / ${right}\`)`

### 91 — floor normalization never erases explicit floor, street or postal conflicts

**KEEP_DISTINCT_CONTRACT**

- default / floor normalization never erases explicit floor, street or postal conflicts / 0.184 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(compareCompleteOutletAddress(left, right), "CONFLICT", \`${left} ≠ ${right}\`)`
- `assert.equal(compareCompleteOutletAddress(right, left), "CONFLICT", \`${right} ≠ ${left}\`)`

### 109 — leading space-separated street components retain existing normalization and reject another street

**KEEP_DISTINCT_CONTRACT**

- default / leading space-separated street components retain existing normalization and reject another street / 0.308 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(compareCompleteOutletAddress(original, "1 18 Jinnan Shibuya City Tokyo"), "MATCH")`
- `assert.equal(compareCompleteOutletAddress(original, "9F, 99 Other Building, Shibuya City, Tokyo"), "CONFLICT")`

## src/integrations/restaurant-facts/google-listed-website-facts.test.ts

商家官网身份、菜单follow-up、价格/包间最低额/取消费与跨页引用独立；不得因Google已有type/hours提前宣称缺少的商业事实。

### 46 — an identity-bound Google HARD exclusion stops website and model fact work

**KEEP_DISTINCT_CONTRACT**

- default / an identity-bound Google HARD exclusion stops website and model fact work / 0.695 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.factChecks["cafe-a"]?.status, "COMPLETED")`
- `assert.equal(websiteCalls, 0)`
- `assert.equal(judgmentCalls, 0)`

### 113 — website facts require candidate-bound structured identity and do not promote visible prose

**KEEP_DISTINCT_CONTRACT**

- default / website facts require candidate-bound structured identity and do not promote visible prose / 40.644 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.factChecks["cafe-a"]?.status, "COMPLETED")`
- `assert.equal(facts?.sourceUrl, "https://cafe.example/about")`
- `assert.equal(JSON.stringify(read.evidence).includes("open forever"), false)`

### 128 — website prose without exact structured name and address remains unknown

**KEEP_DISTINCT_CONTRACT**

- default / website prose without exact structured name and address remains unknown / 0.856 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(read.factChecks["cafe-a"], { status: "UNKNOWN", checkedAt: read.factChecks["cafe-a"]?.checkedAt, evidenceIds: [], reasonCode: "WEBSITE_STRUCTURED_IDENTITY_UNVERIFIED", })`
- `assert.equal(read.evidence.length, 0)`

### 137 — candidate-bound visible opening hours are grounded when JSON-LD is absent

**KEEP_DISTINCT_CONTRACT**

- default / candidate-bound visible opening hours are grounded when JSON-LD is absent / 1.747 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.factChecks["cafe-a"]?.status, "COMPLETED")`
- `assert.equal(facts?.claims.openingHoursMatch, true)`
- `assert.equal(facts?.artifactRef?.kind, "DOM_EXCERPT")`

### 148 — a differently punctuated but equivalent numbered address can identify the same outlet

**KEEP_DISTINCT_CONTRACT**

- default / a differently punctuated but equivalent numbered address can identify the same outlet / 1.198 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.factChecks["cafe-a"]?.status, "COMPLETED")`
- `assert.equal(read.evidence[0]?.entityMatch?.matchedBy[0], "VISIBLE_WEBSITE_NAME_AND_ADDRESS_COMPONENTS")`

### 160 — a same-name page without the candidate address does not become an outlet fact

**KEEP_DISTINCT_CONTRACT**

- default / a same-name page without the candidate address does not become an outlet fact / 0.244 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.factChecks["cafe-a"]?.status, "UNKNOWN")`
- `assert.equal(read.evidence.length, 0)`

### 168 — matching street numbers cannot bind same-name outlets in different cities

**KEEP_DISTINCT_CONTRACT**

- default / matching street numbers cannot bind same-name outlets in different cities / 0.190 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.factChecks["cafe-a"]?.status, "UNKNOWN")`
- `assert.equal(read.evidence.length, 0)`

### 176 — identity-only JSON-LD does not prevent the same page's visible facts from completing a gap

**KEEP_DISTINCT_CONTRACT**

- default / identity-only JSON-LD does not prevent the same page's visible facts from completing a gap / 0.486 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.factChecks["cafe-a"]?.status, "COMPLETED")`
- `assert.equal(read.evidence.some((item) => item.kind === "RESTAURANT_FACT" && item.claims.openingHoursMatch === true), true)`

### 186 — candidate-bound public commercial terms retain price, tax, room minimum, cancellation, and no-show as distinct evidence

**KEEP_DISTINCT_CONTRACT**

- default / candidate-bound public commercial terms retain price, tax, room minimum, cancellation, and no-show as distinct evidence / 0.931 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(facts?.claims.coursePriceYen, 8000)`
- `assert.equal(facts?.claims.coursePriceTax, "INCLUDED")`
- `assert.equal(facts?.claims.privateRoomMinimumYen, 20000)`

### 209 — the production website reader expands an observed public terms section before grounding its candidate-bound evidence

**KEEP_DISTINCT_CONTRACT**

- default / the production website reader expands an observed public terms section before grounding its candidate-bound evidence / 6.785 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(terms, "only the observed public terms control may be selected")`
- `assert.equal(read.factChecks["cafe-a"]?.status, "COMPLETED", JSON.stringify(read))`
- `assert.equal(facts?.claims.coursePriceYen, 8000)`

### 228 — a cited website judgment drives one same-session observed menu follow-up for a missing HARD fact

**KEEP_DISTINCT_CONTRACT**

- default / a cited website judgment drives one same-session observed menu follow-up for a missing HARD fact / 1.030 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(input.sourceDocuments?.length, judged, "each cited judgment sees only the accumulated candidate-bound documents")`
- `assert.equal(read.factChecks["cafe-a"]?.status, "COMPLETED")`
- `assert.equal(read.evidence.some(item => item.evidenceId === "judged-menu"), true)`

### 263 — a bare public yen amount does not become a price or room-minimum fact

**KEEP_DISTINCT_CONTRACT**

- default / a bare public yen amount does not become a price or room-minimum fact / 0.448 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(facts?.claims.coursePriceYen, undefined)`
- `assert.equal(facts?.claims.privateRoomMinimumYen, undefined)`

### 276 — two candidate website reads keep cross-page commercial evidence scoped to its matching restaurant

**KEEP_DISTINCT_CONTRACT**

- default / two candidate website reads keep cross-page commercial evidence scoped to its matching restaurant / 0.761 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(navigated, ["https://cafe.example/about", "https://cafe.example/b"])`
- `assert.equal(factsA?.claims.coursePriceYen, 8000)`
- `assert.equal(factsA?.claims.privateRoomMinimumYen, undefined)`

### 304 — ambiguous amounts and multiple courses are not promoted to a single commercial price

**KEEP_DISTINCT_CONTRACT**

- default / ambiguous amounts and multiple courses are not promoted to a single commercial price / 0.835 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(claims?.coursePriceYen, undefined, line)`
- `assert.equal(claims?.privateRoomMinimumYen, undefined, line)`

### 318 — missing requested cancellation facts remain unknown even when type and hours are known

**KEEP_DISTINCT_CONTRACT**

- default / missing requested cancellation facts remain unknown even when type and hours are known / 0.377 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.factChecks["cafe-a"]?.status, "UNKNOWN")`
- `assert.equal(read.factChecks["cafe-a"]?.reasonCode, "WEBSITE_REQUESTED_FACTS_UNCONFIRMED")`
- `assert.equal(read.evidence.find(item => item.kind === "RESTAURANT_FACT")?.claims.cancellationTerms, undefined)`

### 327 — commercial information requests continue from Google to a real website fact read without invented hard criteria

**KEEP_DISTINCT_CONTRACT**

- default / commercial information requests continue from Google to a real website fact read without invented hard criteria / 3.662 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.evidence.find(item => item.kind === "RESTAURANT_FACT")?.claims.cancellationTerms, "Cancellation: 50% after 17:00.")`

### 335 — multilingual website facts retain cancellation and complete course cards across pages with separate citations

**KEEP_DISTINCT_CONTRACT**

- default / multilingual website facts retain cancellation and complete course cards across pages with separate citations / 2.691 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.factChecks['cafe-a']?.status, "COMPLETED")`
- `assert.equal(facts.find(item => item.sourceUrl === "https://venue.owst.jp/")?.claims.cancellationTerms, cancel)`
- `assert.deepEqual(facts.find(item => item.sourceUrl?.endsWith('/courses'))?.claims.listedCourseDetails, [course])`

### 364 — a telephone-link-bound page retains source statements without claiming the criterion

**KEEP_DISTINCT_CONTRACT**

- default / a telephone-link-bound page retains source statements without claiming the criterion / 1.243 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(decisions, 2, "an incomplete COMPLETE is fed back once, then fails closed without duplicating source statements")`
- `assert.equal(read.evidence.find(e => e.kind === "ENTITY_MATCH")?.entityMatch?.confidence, control.bound ? "HIGH" : undefined)`
- `assert.equal(read.sourceDocuments?.some(d => d.statements.some(s => s.text === "おまかせコース")), control.bound)`

## src/integrations/restaurant-facts/model-fact-judgment.test.ts

HARD判断引用/实体/类别/服务scope与评论角色各有误接纳风险；G1句子切分不能改变旧HARD字节，此组属于B的事实合同。

### 36 — a cited model type judgment becomes auditable negative-condition evidence

**KEEP_DISTINCT_CONTRACT**

- default / a cited model type judgment becomes auditable negative-condition evidence / 4.210 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.evidence[0]?.claims.verifiedNegativeCriteria, ["hot pot restaurant"])`
- `assert.deepEqual(result.evidence[0]?.claims.supportingEvidenceIds, ["source-type"])`
- `assert.equal(result.evidence[0]?.provider, "MODEL_JUDGMENT")`

### 48 — a category conflict from a generic type needs a same-source HIGH grounded entity

**KEEP_DISTINCT_CONTRACT**

- default / a category conflict from a generic type needs a same-source HIGH grounded entity / 1.248 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.evidence[0]?.claims.violatedNegativeCriteria, ["fast food"])`
- `assert.deepEqual(noIdentity.evidence, [])`
- `assert.deepEqual(opaqueIdentity.evidence, [], "opaque source IDs are not source-stated venue identities")`

### 59 — a cited concrete type judgment can ground a positive HARD condition

**KEEP_DISTINCT_CONTRACT**

- default / a cited concrete type judgment can ground a positive HARD condition / 0.165 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.evidence[0]?.claims.verifiedHardCriteria, ["good for drinks"])`
- `assert.deepEqual(result.evidence[0]?.claims.supportingEvidenceIds, ["source-type"])`
- `assert.equal(result.evidence[0]?.provider, "MODEL_JUDGMENT")`

### 72 — a positive HARD criterion cannot be grounded by an uncited assertion or conflict label

**KEEP_DISTINCT_CONTRACT**

- default / a positive HARD criterion cannot be grounded by an uncited assertion or conflict label / 0.102 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.evidence, [])`
- `assert.equal(result.modelUsage?.calls, 1)`

### 84 — an uncited model assertion cannot become a negative-condition fact

**KEEP_DISTINCT_CONTRACT**

- default / an uncited model assertion cannot become a negative-condition fact / 0.085 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.evidence, [])`
- `assert.equal(result.modelUsage?.calls, 1)`

### 92 — a broad source type cannot be promoted by the model into exclusion evidence

**KEEP_DISTINCT_CONTRACT**

- default / a broad source type cannot be promoted by the model into exclusion evidence / 0.092 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.evidence, [])`
- `assert.equal(result.modelUsage?.calls, 1, "broad facts may reach the existing category-scope judgment but cannot support an exclusion claim")`

### 100 — a cited restaurant-category UNKNOWN is auditable without becoming a verified-negative claim

**KEEP_DISTINCT_CONTRACT**

- default / a cited restaurant-category UNKNOWN is auditable without becoming a verified-negative claim / 0.103 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.evidence[0]?.claims.categoryUnknownNegativeCriteria, ["fast food"])`
- `assert.equal(result.evidence[0]?.claims.verifiedNegativeCriteria, undefined)`
- `assert.deepEqual(result.evidence[0]?.claims.supportingEvidenceIds, ["source-type"])`

### 110 — a generic restaurant fact is sent only for the same negative category judgment and remains UNKNOWN

**KEEP_DISTINCT_CONTRACT**

- default / a generic restaurant fact is sent only for the same negative category judgment and remains UNKNOWN / 0.107 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(calls.length, 1, "the category scope is learned in the existing cited judgment, not from a prefilter word list")`
- `assert.deepEqual(result.evidence[0]?.claims.categoryUnknownNegativeCriteria, ["fast food"])`
- `assert.equal(result.evidence[0]?.claims.verifiedNegativeCriteria, undefined)`

### 128 — a venue name alone never becomes a fast-food fact, and non-category UNKNOWN stays fail-closed

**KEEP_DISTINCT_CONTRACT**

- default / a venue name alone never becomes a fast-food fact, and non-category UNKNOWN stays fail-closed / 0.094 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(calls, 0)`
- `assert.deepEqual(nameOnly.evidence, [])`
- `assert.deepEqual(safety.evidence, [])`

### 148 — a locality-cuisine UNKNOWN remains unverified while receiving authoritative locality context

**KEEP_DISTINCT_CONTRACT**

- default / a locality-cuisine UNKNOWN remains unverified while receiving authoritative locality context / 0.299 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.evidence, [])`
- `assert.equal(calls[0]?.promptVersion, "14")`
- `assert.match(calls[0]?.messages[0]?.content ?? "", /direct textual entailment/i)`

### 177 — candidate address and venue name alone never invoke or verify a locality-food criterion

**KEEP_DISTINCT_CONTRACT**

- default / candidate address and venue name alone never invoke or verify a locality-food criterion / 0.069 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(calls, 0)`
- `assert.deepEqual(result.evidence, [])`

### 194 — a cited native-cuisine support remains a model judgment rather than a deterministic cuisine mapping

**KEEP_DISTINCT_CONTRACT**

- default / a cited native-cuisine support remains a model judgment rather than a deterministic cuisine mapping / 0.078 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.evidence[0]?.claims.verifiedHardCriteria, ["local food"])`
- `assert.deepEqual(result.evidence[0]?.claims.supportingEvidenceIds, ["source-type"])`

### 206 — negative category raw judgments reach conversion and the current presentation gate without changing the source facts

**KEEP_DISTINCT_CONTRACT**

- default / negative category raw judgments reach conversion and the current presentation gate without changing the source facts / 2.656 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(result.evidence[0]?.claims[control.claim], [criterion], control.name)`
- `assert.equal(validateRestaurantAction(state, { type: "PRESENT_RESULTS", candidateIds: ["a"] }, now()).status, control.eligible ? "ALLOWED" : "REJECTED", control.name)`

### 236 — website judgments preserve selected source statements and reject invented or cross-candidate citations

**KEEP_DISTINCT_CONTRACT**

- default / website judgments preserve selected source statements and reject invented or cross-candidate citations / 0.432 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.evidence.some(e => e.provider === "MODEL_JUDGMENT"), false, "do not guess which source a paragraph number meant")`
- `assert.equal(read.evidence.length, 0)`
- `assert.equal(properties.sourceSelections.items.properties.statementIds.maxItems, undefined)`

### 283 — a selection spanning merchant and review fields preserves each complete field's own role

**KEEP_DISTINCT_CONTRACT**

- default / a selection spanning merchant and review fields preserves each complete field's own role / 0.125 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(source.sourceFieldQuotes, document.sourceFieldQuotes.slice(0, 2), "partial overlaps and other outlets cannot inherit roles; review words stay in their own field")`
- `assert.equal(assessed[0]!.status, "NOT_CHECKED", "a review cannot become a merchant HARD condition through a flattened paragraph")`

### 307 — a model fact judgment keeps one cited service scope and rejects mixed scope citations

**KEEP_DISTINCT_CONTRACT**

- default / a model fact judgment keeps one cited service scope and rejects mixed scope citations / 0.167 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(judgment?.claims.supportingEvidenceIds, ["sushi"])`
- `assert.equal(mixed.evidence.some(item => item.provider === "MODEL_JUDGMENT"), false, "two service scopes cannot be merged into an outlet-wide positive")`
- `assert.equal(judgment?.claims.serviceScopeValue, "sushi")`

## src/integrations/restaurant-facts/model-page-question-quality.test.ts

六题小修的真实保存页fixture红灯刚被复核，且真实重跑仍有质量失败；不因为提示词regex较弱就删掉同test中的核心拒绝控制，真实结果另报。

### 53 — G1 quality language: Q07/Q33 reject predominantly Japanese answers to Latin questions

**KEEP_DISTINCT_CONTRACT**

- default / G1 quality language: Q07/Q33 reject predominantly Japanese answers to Latin questions / 11.501 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(rejected.result.status, "UNVERIFIED", "Japanese answer to an English question must be discarded")`
- `assert.ok(rejected.result.status === "UNVERIFIED", "language mismatch has no usable answer")`
- `assert.equal(rejected.result.reason, "INVALID_MODEL_OUTPUT")`

### 57 — row.id

**KEEP_DISTINCT_CONTRACT**

- default / nishi / 5.549 ms / pass
- default / alaska / 4.746 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(rejected.result.status, "UNVERIFIED", "Japanese answer to an English question must be discarded")`
- `assert.ok(rejected.result.status === "UNVERIFIED", "language mismatch has no usable answer")`
- `assert.equal(rejected.result.reason, "INVALID_MODEL_OUTPUT")`

### 70 — G1 quality sentence: Q31 quotes a complete sentence within the saved 186-character paragraph

**KEEP_DISTINCT_CONTRACT**

- default / G1 quality sentence: Q31 quotes a complete sentence within the saved 186-character paragraph / 1.500 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "ANSWERED", "a whole sentence inside the original paragraph is a valid citation")`
- `assert.ok(result.status === "ANSWERED", "retain the verbatim sentence")`
- `assert.equal(partial.result.status, "UNVERIFIED", "an arbitrary substring is still not a complete source sentence")`

### 86 — G1 sentence units retain punctuation, closing quotes, decimals, URLs and review roles

**KEEP_DISTINCT_CONTRACT**

- default / G1 sentence units retain punctuation, closing quotes, decimals, URLs and review roles / 5.293 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(good.result.status, "ANSWERED")`
- `assert.equal(denied.result.status, "UNVERIFIED", "splitting a review cannot remove its exclusion")`
- `assert.deepEqual(documents[0]!.statements.map(row => row.text), units)`

### 99 — G1 quality reviews: Q27 prompt directs review-only information to NOT_STATED and comments remain uncitable

**KEEP_DISTINCT_CONTRACT**

- default / G1 quality reviews: Q27 prompt directs review-only information to NOT_STATED and comments remain uncitable / 0.325 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(denied.result.status, "UNVERIFIED", "even an attributed customer review must not enter a merchant answer")`
- `assert.equal(absent.result.status, "NOT_STATED")`
- `assert.match(absent.request.messages[0]!.content, /only customer reviews[\s\S]*?NOT_STATED/u, "the fixture proves the review-only absence instruction reaches the model, not that a real model follows it")`

### 115 — G1 quality conflict: Q26 model-reported source conflict derives confirmation without sensitive classification

**KEEP_DISTINCT_CONTRACT**

- default / G1 quality conflict: Q26 model-reported source conflict derives confirmation without sensitive classification / 0.202 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "ANSWERED")`
- `assert.ok(result.status === "ANSWERED", "both sides of the source conflict remain cited")`
- `assert.equal(result.confirmationRequired, true, "source conflict needs confirmation even for a non-sensitive question")`

### 132 — G1 quality dietary preferences: Q14 prompt keeps vegan preferences in NONE unless allergies are involved

**KEEP_DISTINCT_CONTRACT**

- default / G1 quality dietary preferences: Q14 prompt keeps vegan preferences in NONE unless allergies are involved / 0.123 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "NOT_STATED")`
- `assert.ok(result.status === "NOT_STATED", "unknown dietary preference remains a bounded absence")`
- `assert.match(request.messages[0]!.content, /vegetarian[\s\S]*?vegan[\s\S]*?gluten-free[\s\S]*?NONE[\s\S]*?allerg/iu, "classification guidance reaches the model; code does not classify questions by keywords")`

## src/integrations/restaurant-facts/model-page-question.test.ts

问答同店/同Run/本次读取/逐字完整引文/评论排除以及敏感确认全为G1接纳合同；不碰B核心或以确定性的fixture当模型质量证明。

### 72 — G1 answers a payment question outside the original request conditions with an exact source quotation

**KEEP_DISTINCT_CONTRACT**

- default / G1 answers a payment question outside the original request conditions with an exact source quotation / 8.729 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "ANSWERED")`
- `assert.deepEqual(result.citations.map(({ url, readAt }) => ({ url, readAt })), [{ url: sourceUrl, readAt }])`
- `assert.deepEqual(navigated, [sourceUrl])`

### 86 — G1 reuses current-run bound pages without opening a new session; whitespace is the only quote normalization

**KEEP_DISTINCT_CONTRACT**

- default / G1 reuses current-run bound pages without opening a new session; whitespace is the only quote normalization / 0.256 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(result.status === "ANSWERED")`
- `assert.equal(result.citations[0]!.text, original, "return original source text, never model spelling")`
- `assert.fail("current cache must be reused")`

### 98 — G1 an asynchronous model reply cannot attach a quotation to a subsequently mutated cache page

**KEEP_DISTINCT_CONTRACT**

- default / G1 an asynchronous model reply cannot attach a quotation to a subsequently mutated cache page / 0.142 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(result.status === "ANSWERED")`
- `assert.equal(result.citations[0]!.url, sourceUrl, "quote and metadata must use the same immutable read")`
- `assert.equal(result.citations[0]!.readAt, readAt)`

### 114 — G1 rejects fabricated, partial, wrong-document and uncited answers, including a page that says nothing about payment

**KEEP_DISTINCT_CONTRACT**

- default / G1 rejects fabricated, partial, wrong-document and uncited answers, including a page that says nothing about payment / 1.528 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal((await new ModelRestaurantPageQuestion(invented, undefined, now).answer(input, signal())).status, "UNVERIFIED")`
- `assert.ok(absent.status === "NOT_STATED")`
- `assert.deepEqual(absent.checkedPages, [{ url: sourceUrl, readAt }])`

### 126 — name

**KEEP_DISTINCT_CONTRACT**

- default / fabricated quotation / 0.135 ms / pass
- default / negation removed / 0.105 ms / pass
- default / other document / 0.098 ms / pass
- default / uncited answer / 0.094 ms / pass
- default / URL override / 0.104 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "UNVERIFIED")`
- `assert.ok(!("answer" in result), "discard the entire unverified answer")`

### 144 — G1 same name is not the same outlet: existing identity reader rejects the other branch before model answering

**KEEP_DISTINCT_CONTRACT**

- default / G1 same name is not the same outlet: existing identity reader rejects the other branch before model answering / 1.130 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "UNVERIFIED")`
- `assert.equal(calls.length, 0)`
- `assert.deepEqual(navigated, [sourceUrl])`

### 153 — G1 native page observer preserves the old fact result and only emits after existing same-outlet verification

**KEEP_DISTINCT_CONTRACT**

- default / G1 native page observer preserves the old fact result and only emits after existing same-outlet verification / 4.435 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(observed.evidence, old.evidence)`
- `assert.deepEqual(observed.sourceDocuments, old.sourceDocuments)`
- `assert.equal(pages[0]!.identity.entityMatch?.confidence, "HIGH")`

### 178 — G1 rejects stale runs, unbound identities, review providers, changed URLs and incomplete snapshots

**KEEP_DISTINCT_CONTRACT**

- default / G1 rejects stale runs, unbound identities, review providers, changed URLs and incomplete snapshots / 0.730 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(result.status === "UNVERIFIED")`
- `assert.equal(result.reason, reason)`
- `assert.fail("no model for unverified page")`

### 191 — name

**KEEP_DISTINCT_CONTRACT**

- default / other run / 0.073 ms / pass
- default / old read / 0.047 ms / pass
- default / old identity / 0.037 ms / pass
- default / other candidate / 0.032 ms / pass
- default / weak identity / 0.038 ms / pass
- default / unbound source / 0.036 ms / pass
- default / non-page provider / 0.035 ms / pass
- default / redirect mismatch / 0.031 ms / pass
- default / loading / 0.053 ms / pass
- default / truncated line / 0.068 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(result.status === "UNVERIFIED")`
- `assert.equal(result.reason, reason)`
- `assert.fail("no model for unverified page")`

### 198 — G1 sensitive questions carry model categories and source paraphrases, rejecting yes/no prefixes

**KEEP_DISTINCT_CONTRACT**

- default / G1 sensitive questions carry model categories and source paraphrases, rejecting yes/no prefixes / 3.019 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(good.status === "ANSWERED")`
- `assert.deepEqual(good.citations.map(citation => citation.text), sentences, "every source sentence, including its negation, is retained")`
- `assert.ok(bad.status === "UNVERIFIED")`

### 204 — category

**KEEP_DISTINCT_CONTRACT**

- default / ALLERGY / 1.252 ms / pass
- default / RELIGIOUS_DIET / 0.383 ms / pass
- default / ACCESSIBILITY / 0.398 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(good.status === "ANSWERED")`
- `assert.deepEqual(good.citations.map(citation => citation.text), sentences, "every source sentence, including its negation, is retained")`
- `assert.ok(bad.status === "UNVERIFIED")`

### 222 — G1 reception mode comes from explicit source text without inventory; time-sensitive source statements retain read time

**KEEP_DISTINCT_CONTRACT**

- default / G1 reception mode comes from explicit source text without inventory; time-sensitive source statements retain read time / 0.421 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(result.status === "ANSWERED")`
- `assert.equal(citation.url, sourceUrl)`
- `assert.deepEqual(result.citations.map(citation => citation.text), sentences)`

### 232 — G1 each quotation keeps its own page and read time; bounded excerpts cannot establish page silence

**KEEP_DISTINCT_CONTRACT**

- default / G1 each quotation keeps its own page and read time; bounded excerpts cannot establish page silence / 4.765 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(result.status === "ANSWERED")`
- `assert.deepEqual(result.citations.map(({ text, url, readAt, identityEvidenceId }) => ({ text, url, readAt, identityEvidenceId })), [ { text: quote, url: sourceUrl, readAt, identityEvidenceId: identity.evidenceId }, { text: cancellation, url: terms.snapshot.url, readAt: terms.observedAt, identityEvidenceId: terms.identity.evidenceId }, ])`
- `assert.ok(answered.status === "ANSWERED", "retained complete source statements are still quotable")`

### 257 — G1 saved merchant fragment is quoted in place with provenance; it is not a live or identity-validation claim

**KEEP_DISTINCT_CONTRACT**

- default / G1 saved merchant fragment is quoted in place with provenance; it is not a live or identity-validation claim / 11.280 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(result.status === "ANSWERED")`
- `assert.equal(createHash("sha256").update(html).digest("hex"), provenance.fixtureSha256)`
- `assert.equal(provenance.capturedOn, "2026-10-19")`

### 279 — G1 propagates shared model-budget exhaustion and cancellation instead of inventing an answer

**KEEP_DISTINCT_CONTRACT**

- default / G1 propagates shared model-budget exhaustion and cancellation instead of inventing an answer / 0.364 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(new ModelRestaurantPageQuestion({ complete: async () => { throw exhausted; } }, undefined, now).answer(question(), signal()), error => error === exhausted)`
- `assert.rejects(new ModelRestaurantPageQuestion(fixtureModel(() => assert.fail("aborted")), undefined, now).answer(question(), controller.signal), { name: "AbortError" })`
- `assert.fail("aborted")`

### 286 — G1 revision returns a short English answer with Japanese table label and value quotations

**KEEP_DISTINCT_CONTRACT**

- default / G1 revision returns a short English answer with Japanese table label and value quotations / 0.129 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "ANSWERED")`
- `assert.equal(calls[0]!.promptVersion, "3")`
- `assert.equal(calls[0]!.outputSchema.version, "3")`

### 300 — G1 rejects a customer review quotation using the visible heading outline, independent of private markers

**KEEP_DISTINCT_CONTRACT**

- default / G1 rejects a customer review quotation using the visible heading outline, independent of private markers / 0.325 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "UNVERIFIED", "a customer statement cannot be cited as the merchant's fact")`

### 307 — G1 returns structured absence and confirmation flags without display boilerplate

**KEEP_DISTINCT_CONTRACT**

- default / G1 returns structured absence and confirmation flags without display boilerplate / 0.156 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "NOT_STATED")`
- `assert.deepEqual(result.checkedPages, [{ url: sourceUrl, readAt }])`
- `assert.equal(normal.status, "ANSWERED")`

### 323 — G1 source limits are independent of HARD limits and reject genuinely oversized pages

**KEEP_DISTINCT_CONTRACT**

- default / G1 source limits are independent of HARD limits and reject genuinely oversized pages / 0.587 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "ANSWERED")`
- `assert.ok(rejected.status === "UNVERIFIED")`
- `assert.equal(rejected.reason, "INCOMPLETE_PAGE")`

### 335 — G1 rejects missing or invalid model classifications and malformed answer fields

**KEEP_DISTINCT_CONTRACT**

- default / G1 rejects missing or invalid model classifications and malformed answer fields / 0.492 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(result.status === "UNVERIFIED")`
- `assert.equal(result.reason, "INVALID_MODEL_OUTPUT")`

### 345 — name

**KEEP_DISTINCT_CONTRACT**

- default / missing conflict flag / 0.085 ms / pass
- default / non-boolean conflict flag / 0.043 ms / pass
- default / missing category / 0.044 ms / pass
- default / unknown category / 0.039 ms / pass
- default / non-string category / 0.038 ms / pass
- default / empty answer / 0.038 ms / pass
- default / overlong answer / 0.040 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(result.status === "UNVERIFIED")`
- `assert.equal(result.reason, "INVALID_MODEL_OUTPUT")`

### 353 — G1 preserves a model's concise conflict answer and both source quotations

**KEEP_DISTINCT_CONTRACT**

- default / G1 preserves a model's concise conflict answer and both source quotations / 0.088 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.status, "ANSWERED")`
- `assert.equal(result.answer, answer)`
- `assert.deepEqual(result.citations.map(citation => citation.text), [positive, negative])`

### 365 — G1 review exclusion follows visible headings after private markers are renamed and preserves neighbouring merchant statements

**KEEP_DISTINCT_CONTRACT**

- default / G1 review exclusion follows visible headings after private markers are renamed and preserves neighbouring merchant statements / 0.208 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(denied.status === "UNVERIFIED")`
- `assert.equal(denied.reason, "INVALID_MODEL_OUTPUT")`
- `assert.equal(allowed.status, "ANSWERED")`

## src/integrations/restaurant-facts/page-question-reader.test.ts

独立问答预算与原搜索余额分离，主动取消后下一题仍可读；绑定在reader入口，模型gateway计数测试覆盖不了浏览器关闭。

### 8 — fresh question reads own independent model and browser counters, with no completed search context

**KEEP_DISTINCT_CONTRACT**

- default / fresh question reads own independent model and browser counters, with no completed search context / 7.124 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(scope.totalModelCalls,0)`
- `assert.equal(scope.maxModelCalls,3)`
- `assert.ok(result.status==="UNVERIFIED"&&result.reason==="BUDGET_EXHAUSTED","each question stops at its own model ceiling")`

### 25 — question deadline actively cancels a pending read, without cancelling the next question

**KEEP_DISTINCT_CONTRACT**

- default / question deadline actively cancels a pending read, without cancelling the next question / 22.375 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(result.status==="UNVERIFIED"&&result.reason==="BUDGET_EXHAUSTED","expired read is unverified")`
- `assert.ok(next.status==="UNVERIFIED"&&next.reason==="NO_BOUND_PAGE","the next question starts a fresh live scope")`
- `assert.equal(RESTAURANT_PAGE_QUESTION_BUDGET.maxElapsedMs,60_000)`

## src/integrations/restaurant-identity/detail-identity-fields.test.ts

公开电话/完整地址/HTML entity解码与显式结构变化告警均在身份抽取层；C刚合入的错分店反例保护，不由单纯string equality替代。

### 44 — `${platform.provider} matches the observed reservation phone and keeps full visible address after private-marker changes`

**KEEP_DISTINCT_CONTRACT**

- default / Tabelog matches the observed reservation phone and keeps full visible address after private-marker changes / 8.274 ms / pass
- default / TableCheck matches the observed reservation phone and keeps full visible address after private-marker changes / 0.804 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(platform.inspect(subject, extraction.outlet).confidence, "HIGH", "same-store public 050 must not be lost behind the JSON-LD 03 phone")`
- `assert.equal(extraction.outlet.address, \`1530052 ${sourceAddress}\`)`
- `assert.equal(details.sourceUrl, platform.url)`

### 57 — `${platform.provider} cannot use another restaurant phone, a near phone or conflicting floor/door number`

**KEEP_DISTINCT_CONTRACT**

- default / Tabelog cannot use another restaurant phone, a near phone or conflicting floor/door number / 0.675 ms / pass
- default / TableCheck cannot use another restaurant phone, a near phone or conflicting floor/door number / 0.338 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.notEqual(platform.inspect(subject, { ...withoutAddress, sourceUrl: platform.url.replace(/\/$/, "") + "/other-store" }).confidence, "HIGH", "a phone quote cannot be lent to another source outlet")`
- `assert.notEqual(platform.inspect(uncertain, extraction.outlet).confidence, "HIGH")`
- `assert.notEqual(platform.inspect(candidate, other.outlet).confidence, "HIGH")`

### 75 — `${platform.provider} reports conflicting or ambiguous detail identity instead of silently choosing it`

**KEEP_DISTINCT_CONTRACT**

- default / Tabelog reports conflicting or ambiguous detail identity instead of silently choosing it / 0.265 ms / pass
- default / TableCheck reports conflicting or ambiguous detail identity instead of silently choosing it / 0.095 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.throws(() => platform.parse(snapshot(platform.url, body.replace(sourceAddress, \`${sourceAddress}</td></tr><tr><th>Address</th><td>東京都港区六本木1-2-3\`))), /SOURCE_IDENTITY_STRUCTURE_CHANGED/)`
- `assert.throws(() => platform.parse(snapshot(platform.url, body + "<h3>Restaurant information</h3>")), /SOURCE_IDENTITY_STRUCTURE_CHANGED/)`

### 81 — nr010 saved page keeps the same outlet when JSON-LD encodes its ampersand

**KEEP_G3_COORDINATION**

- default / nr010 saved page keeps the same outlet when JSON-LD encodes its ampersand / 2.236 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(inspection.resolution.confidence, "HIGH")`
- `assert.equal(inspection.resolution.outlet?.sourceUrl, "https://tabelog.com/en/tokyo/A1320/A132001/13196218/")`
- `assert.equal(extraction.outlet.outletName, "Yakitori &amp; Obanzai SAKAMOTO", "source spelling remains intact; only comparison decodes")`

### 96 — `${platform.provider} decodes names without admitting same-name other outlets or conflicting branches`

**KEEP_DISTINCT_CONTRACT**

- default / Tabelog decodes names without admitting same-name other outlets or conflicting branches / 0.725 ms / pass
- default / TableCheck decodes names without admitting same-name other outlets or conflicting branches / 0.153 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(platform.inspect(original as typeof subject, outlet).confidence, "HIGH", "decoded name plus full matching address is still the existing rule")`
- `assert.notEqual(platform.inspect(withPhone as typeof subject, { ...outlet, address, phone: "03-1111-2222" }).confidence, "HIGH", "decoding cannot erase a location, door or floor conflict, even with the same phone")`
- `assert.notEqual(platform.inspect(missing as typeof subject, { ...outlet, address: "Tokyo" }).confidence, "HIGH", "decoded name alone cannot identify the outlet")`

## src/integrations/restaurant-search/directory-region-selection.test.ts

D1原blob观察入口、本地坐标控制与四页直达/全流程一次纠正预算是F5有效红灯；普通stale-ref/跨Run集合拒绝全保留。

### 37 — directory Agent uses observed references; a proved wrong first entry is replaced once without resetting progress

**KEEP_PROTECTED**

- default / directory Agent uses observed references; a proved wrong first entry is replaced once without resetting progress / 35.448 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.candidates.length,5)`
- `assert.equal(read.metadata.nativeDiscoveryFunnel!.sourceDetailAttempts,10)`
- `assert.equal(directoryEntryReplacementAllowed(region),false)`

保护：F5_R1_G1_G3_A3_N1_N4

### 42 — unknown coordinates do not establish a wrong entry and cannot admit candidates

**KEEP_PROTECTED**

- default / unknown coordinates do not establish a wrong entry and cannot admit candidates / 2.103 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(a.candidates.length,0)`
- `assert.ok(a.metadata.nativeDiscoveryFunnel!.directoryRegion!.samples.every(x=>x.outcome==='UNKNOWN'))`
- `assert.equal(directoryEntryReplacementAllowed(a.metadata.nativeDiscoveryFunnel!.directoryRegion),false)`

保护：F5_R1_G1_G3_A3_N1_N4

### 45 — only four proved outside among exactly five allow one replacement; spent deadline stays spent

**KEEP_PROTECTED**

- default / only four proved outside among exactly five allow one replacement; spent deadline stays spent / 0.444 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(directoryEntryReplacementAllowed(region),true)`
- `assert.equal(directoryEntryReplacementAllowed({...region,samples:region.samples.slice(0,4)}),false)`
- `assert.equal(directoryEntryReplacementAllowed({...region,samples:region.samples.map((x,n)=>n===3?{...x,outcome:'UNKNOWN' as const}:x)}),false)`

保护：F5_R1_G1_G3_A3_N1_N4

### 57 — a named request continues through an unrelated parent menu before admitting child-list details

**KEEP_PROTECTED**

- default / a named request continues through an unrelated parent menu before admitting child-list details / 2.722 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.candidates.length,5)`
- `assert.equal(result.metadata.nativeDiscoveryFunnel!.directoryRegion!.first.url,second)`
- `assert.equal(result.metadata.nativeDiscoveryFunnel!.directoryRegion!.replacement,undefined)`

保护：F5_R1_G1_G3_A3_N1_N4

### 65 — directory navigation timeout retains its runtime code rather than claiming no observed region

**KEEP_PROTECTED**

- default / directory navigation timeout retains its runtime code rather than claiming no observed region / 0.663 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.metadata.failureCode,'BROWSER_TIMEOUT')`
- `assert.equal(result.candidates.length,0)`

保护：F5_R1_G1_G3_A3_N1_N4

### 119 — captured Kagurazaka region loop cannot reopen an already visited parent, even with listing query aliases

**KEEP_PROTECTED**

- default / captured Kagurazaka region loop cannot reopen an already visited parent, even with listing query aliases / 10.654 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.candidates.length,0)`
- `assert.ok(result.metadata.nativeDiscoveryFunnel!.sourceElapsedMs!<90_000)`
- `assert.equal(f.blocked,true,'the previously visited parent must not be offered again')`

保护：F5_R1_G1_G3_A3_N1_N4

### 128 — a confirmed authoritative location search replaces a previous broad region without accepting the filled old page

**KEEP_PROTECTED**

- default / a confirmed authoritative location search replaces a previous broad region without accepting the filled old page / 13.641 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.candidates.length,1,'the known-feasible exact-location result must survive prior broad-region state')`
- `assert.ok(result.metadata.nativeDiscoveryFunnel!.sourceElapsedMs!<90_000)`
- `assert.equal(f.filled,'Kagurazaka')`

保护：F5_R1_G1_G3_A3_N1_N4

### 196 — recorded Kagurazaka and Nakameguro links constrain the first region and reach a controlled result within the unchanged budget

**KEEP_PROTECTED**

- default / recorded Kagurazaka and Nakameguro links constrain the first region and reach a controlled result within the unchanged budget / 21.375 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.candidates.length,1,'a known-feasible regional result must be obtained, not just refused safely')`
- `assert.equal(f.googleCalls,1)`
- `assert.ok(result.metadata.nativeDiscoveryFunnel!.sourceElapsedMs!<90_000)`

保护：F5_R1_G1_G3_A3_N1_N4

### 208 — an action bypassing observed outlet region evidence cannot navigate to the wrong region

**KEEP_PROTECTED**

- default / an action bypassing observed outlet region evidence cannot navigate to the wrong region / 5.343 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.candidates.length,0)`
- `assert.equal(f.navigations.includes(f.wrong),false)`

保护：F5_R1_G1_G3_A3_N1_N4

### 214 — region evidence excludes foreign/malformed URLs, missing or invalid coordinates, and points beyond the original radius

**KEEP_PROTECTED**

- default / region evidence excludes foreign/malformed URLs, missing or invalid coordinates, and points beyond the original radius / 0.303 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(observedDirectoryOutletReference(tabelogDiscoveryPack,{...source,candidates:[changed]},r.location),undefined)`
- `assert.equal(directory.containsObservedOutlet!('https://tabelog.com/en/tokyo/A1309/',baseline.sourceUrl),true)`
- `assert.equal(directory.containsObservedOutlet!('https://tabelog.com/en/tokyo/A1304/',baseline.sourceUrl),false)`

保护：F5_R1_G1_G3_A3_N1_N4

### 237 — a saved early source read cannot cross the authoritative request or runtime run

**KEEP_PROTECTED**

- default / a saved early source read cannot cross the authoritative request or runtime run / 10.677 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(f.native.search({...f.request,intent:{...f.request.intent,partySize:9},continuation:result.continuation!},new AbortController().signal),{code:'GOOGLE_MALFORMED_RESPONSE'})`
- `assert.rejects(f.native.search({...f.request,readRunId:'different-run',continuation:result.continuation!},new AbortController().signal),{code:'GOOGLE_MALFORMED_RESPONSE'})`
- `assert.equal(f.googleCalls,1)`

保护：F5_R1_G1_G3_A3_N1_N4

### 245 — an early provider failure is reported at its original source stage without a second request

**KEEP_PROTECTED**

- default / an early provider failure is reported at its original source stage without a second request / 6.280 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(f.googleCalls,1)`
- `assert.equal(next.candidates.length,0)`
- `assert.equal(next.metadata.failureCode,'GOOGLE_NETWORK_FAILED')`

保护：F5_R1_G1_G3_A3_N1_N4

### 252 — early region reference reading keeps the shared positive HARD retrieval and does not plan it twice

**KEEP_PROTECTED**

- default / early region reference reading keeps the shared positive HARD retrieval and does not plan it twice / 12.204 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(first.candidates.length,1)`
- `assert.ok(planningCalls>0)`
- `assert.equal(f.googleCalls,1)`

保护：F5_R1_G1_G3_A3_N1_N4

### 312 — R1 D1 unbound observed entrance reaches detail sampling before a place label or pointer is available

**KEEP_PROTECTED**

- default / R1 D1 unbound observed entrance reaches detail sampling before a place label or pointer is available / 3.759 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(result.metadata.nativeDiscoveryFunnel!.inspectedOutlets>0,'R1: namedEntrance must not prevent all coordinate sampling')`

保护：F5_R1_G1_G3_A3_N1_N4, EXPLICIT_HISTORICAL_REGRESSION

### 318 — G1/G3 D1 second-level provisional samples replace once in four region pages with immutable directional feedback and no restore

**KEEP_PROTECTED**

- default / G1/G3 D1 second-level provisional samples replace once in four region pages with immutable directional feedback and no restore / 9.890 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(second.continuation!.sourceProgress!.directoryRegion!.provisional,true)`
- `assert.equal(second.continuation!.sourceProgress!.directoryRegion!.samples.length,2)`
- `assert.equal(directoryEntryReplacementAllowed(second.continuation!.sourceProgress!.directoryRegion),false)`

保护：F5_R1_G1_G3_A3_N1_N4, EXPLICIT_HISTORICAL_REGRESSION

### 335 — C1/C2 local mixed and missing coordinates only count valid samples and never replace an in-radius entrance

**KEEP_PROTECTED**

- default / C1/C2 local mixed and missing coordinates only count valid samples and never replace an in-radius entrance / 9.373 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(directoryEntryReplacementAllowed(region),false)`
- `assert.equal(read.candidates.length,within?1:2)`
- `assert.equal(read.metadata.nativeDiscoveryFunnel!.sourceDetailAttempts,points.length+(within?0:2))`

保护：F5_R1_G1_G3_A3_N1_N4

### 345 — A3 no observed alternate ends UNKNOWN immediately without asking the model or restoring a menu

**KEEP_PROTECTED**

- default / A3 no observed alternate ends UNKNOWN immediately without asking the model or restoring a menu / 1.085 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.metadata.nativeDiscoveryFunnel!.directoryRegion!.stopReason,'NO_OBSERVED_REPLACEMENT_ENTRANCE')`
- `assert.equal(read.metadata.nativeDiscoveryFunnel!.sourceEnded,true)`
- `assert.equal(read.metadata.nativeDiscoveryFunnel!.sourceExhausted,'UNKNOWN')`

保护：F5_R1_G1_G3_A3_N1_N4

### 351 — A3/G2 correct-area edge misclassification uses only one correction and retains previously admitted candidates and cumulative budget

**KEEP_PROTECTED**

- default / A3/G2 correct-area edge misclassification uses only one correction and retains previously admitted candidates and cumulative budget / 4.152 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.metadata.nativeDiscoveryFunnel!.directoryRegion!.stopReason,noAlternate?'NO_OBSERVED_REPLACEMENT_ENTRANCE':'REPLACEMENT_SAMPLES_OUTSIDE_RADIUS')`
- `assert.equal(read.metadata.nativeDiscoveryFunnel!.sourceEnded,true)`
- `assert.equal(read.metadata.nativeDiscoveryFunnel!.sourceDetailAttempts,noAlternate?5:7)`

保护：F5_R1_G1_G3_A3_N1_N4

### 362 — X3 retained entrance selection rejects set-external, foreign-flow and invented href refs before navigation

**KEEP_PROTECTED**

- default / X3 retained entrance selection rejects set-external, foreign-flow and invented href refs before navigation / 10.720 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(second.metadata.nativeDiscoveryFunnel!.directoryRegion!.stopReason,'INVALID_OBSERVED_ENTRANCE_SELECTION')`
- `assert.equal(second.metadata.nativeDiscoveryFunnel!.sourceEnded,true)`
- `assert.equal(budget.totalModelCalls,23)`

保护：F5_R1_G1_G3_A3_N1_N4

### 371 — A3 source90 deadline after sampling is not reset by a correction or source handoff

**KEEP_PROTECTED**

- default / A3 source90 deadline after sampling is not reset by a correction or source handoff / 4.116 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.metadata.nativeDiscoveryFunnel!.sourceTimeLimitReached,true)`
- `assert.equal(read.metadata.nativeDiscoveryFunnel!.directoryRegion!.stopReason,'SOURCE_BUDGET_EXHAUSTED')`
- `assert.equal(read.metadata.nativeDiscoveryFunnel!.sourceDetailAttempts,2)`

保护：F5_R1_G1_G3_A3_N1_N4

### 379 — N1 N2 N4 named Shibuya Kagurazaka Higashi-Ginza controls retain original page and detail counts

**KEEP_PROTECTED**

- default / N1 N2 N4 named Shibuya Kagurazaka Higashi-Ginza controls retain original page and detail counts / 4.595 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.candidates.length,5)`
- `assert.equal(result.metadata.nativeDiscoveryFunnel!.sourceDetailAttempts,5)`
- `assert.equal(region.provisional,false)`

保护：F5_R1_G1_G3_A3_N1_N4

### 390 — N3 local Kichijoji same-source pointer control keeps a nonmatching observed label and original budget

**KEEP_PROTECTED**

- default / N3 local Kichijoji same-source pointer control keeps a nonmatching observed label and original budget / 14.143 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.candidates.length,1,JSON.stringify({metadata:read.metadata,nav:f.navigations}))`
- `assert.equal(f.googleCalls,1)`
- `assert.equal(read.metadata.nativeDiscoveryFunnel!.sourceDetailAttempts,1)`

保护：F5_R1_G1_G3_A3_N1_N4

### 398 — B1 all A3 endings retain the remaining500s/50call window at the next source

**KEEP_PROTECTED**

- default / B1 all A3 endings retain the remaining500s/50call window at the next source / 41.093 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(progress.sourceEnded,true)`
- `assert.equal(progress.sourceExhausted,'UNKNOWN')`
- `assert.ok(progress.sourceElapsedMs!>0)`

保护：F5_R1_G1_G3_A3_N1_N4

### 416 — X3 a whole saved collection cannot be replayed into another read run with the same intent

**KEEP_PROTECTED**

- default / X3 a whole saved collection cannot be replayed into another read run with the same intent / 4.462 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(first.continuation!.sourceProgress!.regionEntrances!.readRunId,'task-one:run-one')`
- `assert.equal(second.metadata.nativeDiscoveryFunnel!.directoryRegion!.stopReason,'INVALID_OBSERVED_ENTRANCE_SCOPE')`
- `assert.equal(second.metadata.nativeDiscoveryFunnel!.sourceEnded,true,'terminal scope rejection must end source despite pending details')`

保护：F5_R1_G1_G3_A3_N1_N4

## src/integrations/restaurant-search/discovery-retrieval-planner.test.ts

稀疏关键词可改写但GENERAL只能选已观察引用，模型失败仍花额度；F3-034红灯保护，不退回隐式列表。

### 6 — retrieval model uses a versioned strict proposal and shared budget including failures

**KEEP_DISTINCT_CONTRACT**

- default / retrieval model uses a versioned strict proposal and shared budget including failures / 0.752 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.rejects(planner.decide(input),{code:'PROVIDER_REJECTED'})`
- `assert.equal(budget.totalModelCalls,1)`
- `assert.rejects(planner.decide(input),{code:'BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED'})`

### 14 — an invalid model keyword returns a rejected bounded result; no synthetic synonym repair

**KEEP_DISTINCT_CONTRACT**

- default / an invalid model keyword returns a rejected bounded result; no synthetic synonym repair / 1.053 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.rejectionReason,'INVALID_KEYWORD')`
- `assert.equal(result.accepted,false)`
- `assert.equal(result.keyword,undefined)`

### 18 — no positive HARD skips shared text planning but keeps observed category selection

**KEEP_DISTINCT_CONTRACT**

- default / no positive HARD skips shared text planning but keeps observed category selection / 0.157 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(calls,0)`
- `assert.equal(budget.totalModelCalls,0)`
- `assert.equal(calls,1)`

### 28 — sparse retrieval removes KEEP from schema and rejects it until rewrites are exhausted

**KEEP_DISTINCT_CONTRACT**

- default / sparse retrieval removes KEEP from schema and rejects it until rewrites are exhausted / 0.194 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.rejectionReason,'SPARSE_LIST_KEEP_NOT_ALLOWED')`
- `assert.equal(JSON.stringify(requests[0]!.outputSchema.jsonSchema).includes('"KEEP"'),false)`
- `assert.equal((await planner.decide({...input,observation,...patch})).keep,true)`

### 42 — GENERAL requires a supplied observed reference and old output fields have no compatibility route

**KEEP_DISTINCT_CONTRACT**

- default / GENERAL requires a supplied observed reference and old output fields have no compatibility route / 0.335 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal((await planner.decide({...input,observation:{...observation,generalLists:[]}})).rejectionReason,'UNOBSERVED_GENERAL_LIST')`
- `assert.equal((await planner.decide({...input,observation})).rejectionReason,'UNOBSERVED_GENERAL_LIST')`
- `assert.equal((await planner.decide({...input,observation})).generalRef,general.ref)`

## src/integrations/restaurant-search/named-source-query.test.ts

模型只能选Google原名的正当子串，代码定位偏移、失败缓存和双来源共用一次额度均是G4新合同；不重复中文拼写变体来凑数。

### 13 — code locates the four valid batch2 fragments, independent of model offsets

**KEEP_DISTINCT_CONTRACT**

- default / code locates the four valid batch2 fragments, independent of model offsets / 1.115 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(locateNamedSourceFragment(unicode, { field: "name", fragment: "Sushi Dai" }), { field: "name", query: "Sushi Dai", start: 4, end: 13 })`
- `assert.ok(located)`
- `assert.equal(original.restaurant.outletName.slice(located.start, located.end), fragment)`

### 27 — invented, translated, wrong-field, repeated and old-offset proposals fail closed

**KEEP_DISTINCT_CONTRACT**

- default / invented, translated, wrong-field, repeated and old-offset proposals fail closed / 0.114 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(locateNamedSourceFragment(original, proposal), undefined)`
- `assert.equal(checkedNamedSourceQuery(original, "invented"), undefined)`

### 36 — a retrieval fragment must be a proper substring of the Google name, never an address-only fragment

**KEEP_DISTINCT_CONTRACT**

- default / a retrieval fragment must be a proper substring of the Google name, never an address-only fragment / 0.068 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(checkedNamedSourceQuery(original, "Shinjuku"), undefined)`
- `assert.equal(locateNamedSourceFragment(original, { field: "address", fragment: "Shinjuku" }), undefined)`
- `assert.equal(checkedNamedSourceQuery(original, original.restaurant.outletName), undefined)`

### 45 — proper-substring instruction abandons a full-name response once and caches that failure across sources

**KEEP_DISTINCT_CONTRACT**

- default / proper-substring instruction abandons a full-name response once and caches that failure across sources / 0.248 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(calls, 1)`
- `assert.equal(budget.totalModelCalls, 1)`
- `assert.match(request.messages[0]!.content, /strictly shorter/)`

### 60 — one cached proposal is shared across both sources, spends the existing run budget and excludes IDs

**KEEP_DISTINCT_CONTRACT**

- default / one cached proposal is shared across both sources, spends the existing run budget and excludes IDs / 0.373 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(request.promptVersion, NAMED_SOURCE_QUERY_PROMPT)`
- `assert.equal(request.outputSchema.name, NAMED_SOURCE_QUERY_SCHEMA.name)`
- `assert.equal(request.outputSchema.version, NAMED_SOURCE_QUERY_SCHEMA.version)`

## src/integrations/restaurant-search/native-restaurant-search.test.ts

Native地理解析交给Google后不得二次解析，逆地址失败不改圆心；保存h06具名地点控制在生产计划入口，非地区单元函数替代。

### 12 — native source-plan resolution is reused by the subsequent Google pack request

**KEEP_DISTINCT_CONTRACT**

- default / native source-plan resolution is reused by the subsequent Google pack request / 26.012 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(queries, ["Shibuya", "omakase Shibuya"], "the provider page request reuses the plan location instead of resolving it again")`

### 35 — coordinate-only address observations reach the discovery goal once and failures keep the exact center

**KEEP_DISTINCT_CONTRACT**

- default / coordinate-only address observations reach the discovery goal once and failures keep the exact center / 1.571 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(urls.filter(url => url.includes("geocode")).length, 1)`
- `assert.equal((location as unknown as { addressObservation: { status: string } }).addressObservation.status, fails ? "UNAVAILABLE" : "OBSERVED")`
- `assert.rejects(native.search({ intent, readRunId: \`address-${fails}\`, continuation: result.continuation! }, new AbortController().signal), { code: "DISCOVERY_PLAN_EXHAUSTED" })`

### 61 — saved h06 bare named location reaches native source discovery with the observed circle

**KEEP_DISTINCT_CONTRACT**

- default / saved h06 bare named location reaches native source discovery with the observed circle / 1.899 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(createHash("sha256").update(bytes).digest("hex"), row.projectionSha256)`
- `assert.equal(intent.area.query, "Kitasenju", "retain the actual saved semantic output without inserting near")`
- `assert.equal(createHash("sha256").update(geo).digest("hex"), manifest.geography.sha256)`

## src/integrations/restaurant-search/source-packs.test.ts

Pack提供来源URL语法/来源自有引用和审核读取权限；不改source-packs。私有解析相关项随B G3替换，Guard、半径、权威query的负例不删。

### 9 — Tabelog Pack normalizes only a supported outlet URL to the same numeric ID in English

**KEEP_DISTINCT_CONTRACT**

- default / Tabelog Pack normalizes only a supported outlet URL to the same numeric ID in English / 0.580 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(normalizeTabelogOutletUrl("https://tabelog.com/tokyo/A1303/A130301/13293469/?utm_source=google#menu"), "https://tabelog.com/en/tokyo/A1303/A130301/13293469/")`
- `assert.equal(tabelogDiscoveryPack.availability!.sourceBusy!.matches(page), true)`
- `assert.equal(tabelogDiscoveryPack.availability!.sourceBusy!.matches({ ...page, text: "A busy sushi restaurant" }), false)`

### 19 — availability paths distinguish observed outlet entrances from source lists and unsupported booking hosts

**KEEP_DISTINCT_CONTRACT**

- default / availability paths distinguish observed outlet entrances from source lists and unsupported booking hosts / 0.328 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(candidateAvailabilityPath(outlet), expected, website)`
- `assert.equal(candidateAvailabilityPath(outlet, [googlePlacesDiscoveryPack]), "NONE", "an explicit registry without availability cannot grant a path")`

### 36 — real source packs own URLs, reviewed reads, skills, and opaque source IDs

**KEEP_DISTINCT_CONTRACT**

- default / real source packs own URLs, reviewed reads, skills, and opaque source IDs / 0.576 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(neutral.areaEntrance, "OBSERVE_SOURCE_REGION")`
- `assert.deepEqual(tableCheckDocumentRule?.resourceTypes, ["document"], "the Pack carries its public search-document grammar into guarded recording")`
- `assert.deepEqual(tableCheckDocumentRule?.queryKeyRules?.allowed, ["search_text", "date", "time", "num_people", "availability_mode"])`

### 64 — TableCheck request URL construction is consumed through its source pack

**KEEP_DISTINCT_CONTRACT**

- default / TableCheck request URL construction is consumed through its source pack / 0.155 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(buildRequestUrl)`
- `assert.equal(url.searchParams.get("date"), "2026-10-08")`
- `assert.equal(url.searchParams.get("num_people"), "2")`

### 76 — directory retrieval URL grammar stays inside its pack

**KEEP_DISTINCT_CONTRACT**

- default / directory retrieval URL grammar stays inside its pack / 0.130 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(directory)`
- `assert.equal(tabelogDiscoveryPack.browser!.retrievalExpression(queried), "omakase")`
- `assert.equal(tabelogDiscoveryPack.browser!.retrievalExpression(directory.withoutRetrievalExpression(queried)), undefined)`

### 86 — both browser source packs parse their own current listing entrances before the shared cursor schedules details

**KEEP_DISTINCT_CONTRACT**

- default / both browser source packs parse their own current listing entrances before the shared cursor schedules details / 1.476 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(directoryListing.outlets.map((outlet) => outlet.sourceEntityId), ["tokyo/A1304/A130401/100"])`
- `assert.equal(directoryListing.nextPage, "https://tabelog.com/en/tokyo/rstLst/2/", "pagination remains source-pack data")`
- `assert.deepEqual(venueListing.outlets.map((outlet) => outlet.sourceEntityId), ["fixture-outlet"])`

### 99 — Tabelog region selection requires an exact source-owned region label and recognizes only local homepage cards

**KEEP_DISTINCT_CONTRACT**

- default / Tabelog region selection requires an exact source-owned region label and recognizes only local homepage cards / 0.302 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(directory.isRegionEntrance("https://tabelog.com/en/rstLst/"), false, "a national anchor mentioning an area cannot re-ground the source query")`
- `assert.ok(directory)`
- `assert.equal(directory.isRegionEntrance("https://tabelog.com/en/tokyo/A1303/A130301/rstLst/"), true)`

### 117 — search availability URL values overwrite source links with the authoritative request, without creating stock

**KEEP_DISTINCT_CONTRACT**

- default / search availability URL values overwrite source links with the authoritative request, without creating stock / 0.210 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(capability.observe({url:filtered.toString(),title:'Unbound result',text:'2026-10-27 19:00 2 guests',html:'<p>2026-10-27 19:00 2 guests</p>'},[]),{},'URL/prose co-occurrence cannot confirm selected query')`
- `assert.ok('withRequest' in capability)`
- `assert.equal(filtered.searchParams.get('svd'),'20261027')`

### 126 — search filters restore only the already observed same-region listing root from a homepage

**KEEP_DISTINCT_CONTRACT**

- default / search filters restore only the already observed same-region listing root from a homepage / 0.621 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok('withRequest' in capability)`
- `assert.equal(filtered,'https://tabelog.com/en/tokyo/A1303/rstLst/?sw=omakase&vac_net=1&svd=20261027&svt=1900&svps=2')`
- `assert.equal(capability.withRequest(homepage,binding),undefined,'a guessed root is not an observation')`

### 137 — unsupported TableCheck search filters are explicitly disabled without broadening transport reads

**KEEP_DISTINCT_CONTRACT**

- default / unsupported TableCheck search filters are explicitly disabled without broadening transport reads / 0.271 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(tableCheckDiscoveryPack.browser!.searchAvailability,{disabledReason:'FILTER_TRANSPORT_NOT_REVIEWED'})`
- `assert.equal(search?.queryKeyRules?.allowed?.includes('open_from'),false)`
- `assert.equal(search?.queryKeyRules?.allowed?.includes('open_until'),false)`

### 144 — C8 list categories stay source-attributed to one outlet, without borrowing neighbouring or hidden text

**KEEP_DISTINCT_CONTRACT**

- default / C8 list categories stay source-attributed to one outlet, without borrowing neighbouring or hidden text / 1.335 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(directory.outlets.map(outlet => outlet.sourceCategories), [["Sushi"], ["Italian"]])`
- `assert.deepEqual(venues.outlets.map(outlet => outlet.sourceCategories), [["Japanese, Seafood"], ["French"]])`

### 156 — observed regional homepage exposes only its own category listing links

**KEEP_DISTINCT_CONTRACT**

- default / observed regional homepage exposes only its own category listing links / 0.706 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(links.length > 0, 'real A1 homepage category fragment must be exposed')`
- `assert.ok(links.every(link => directory.listingRoot(link.url) === '/en/tokyo/A1303/rstLst/'))`
- `assert.equal(links.some(link => link.url === foreign), false)`

## src/integrations/tabelog/tabelog-browser-availability.test.ts

B所属站点文件：日历私有标记、find_vacancy形状及查询核对由G3逐项红绿退役；身份、请求绑定、challenge、忙页重试和预算反例不能随解析实现一并删。

### 26 — captured kf-h001 Sen after selecting the date still has no slot result and remains EXTRACTION_FAILED

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / captured kf-h001 Sen after selecting the date still has no slot result and remains EXTRACTION_FAILED / 166.592 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[sen.restaurant.id]?.status, "UNKNOWN")`
- `assert.equal(result.metadata.failureCode, "EXTRACTION_FAILED")`
- `assert.equal(tabelogAvailabilityCompletion(page, request).complete, false)`

### 40 — three recorded Tabelog busy pages remain source-busy UNKNOWN after one waited retry, before identity

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / three recorded Tabelog busy pages remain source-busy UNKNOWN after one waited retry, before identity / 3013.027 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[listed.restaurant.id]?.status, "UNKNOWN", input.run)`
- `assert.equal(result.availabilityChecks[listed.restaurant.id]?.reasonCode, "SOURCE_BUSY", input.run)`
- `assert.equal(result.evidence.some(e => e.kind === "ENTITY_MATCH" && e.entityMatch?.confidence === "HIGH"), false)`

### 60 — Tabelog busy retry can recover a known feasible control without bypassing identity

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog busy retry can recover a known feasible control without bypassing identity / 2011.575 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(performance.now() - started >= 900, "the source retry waits before its second navigation")`
- `assert.equal(result.availabilityChecks[listed.restaurant.id]?.status, conflict ? "UNKNOWN" : "AVAILABLE")`
- `assert.equal(session.navigated.slice(0, 2).every(value => value === url), true)`

### 77 — Tabelog source-busy delay cannot reset or outrun the existing provider deadline

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog source-busy delay cannot reset or outrun the existing provider deadline / 253.973 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[listed.restaurant.id]?.status, "UNKNOWN")`
- `assert.equal(result.availabilityChecks[listed.restaurant.id]?.reasonCode, "BROWSER_TIMEOUT")`
- `assert.equal(RESTAURANT_FAILURE_CLASSIFICATION.SOURCE_BUSY, "ENVIRONMENT")`

### 91 — Tabelog entity resolver is outlet-safe and rejects ambiguous branch matches

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog entity resolver is outlet-safe and rejects ambiguous branch matches / 0.474 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(exact.confidence, "HIGH")`
- `assert.notEqual(ambiguous.confidence, "HIGH")`

### 101 — Tabelog accepts complete reordered address components but rejects an incomplete source address

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog accepts complete reordered address components but rejects an incomplete source address / 0.188 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(reordered.confidence, "HIGH")`
- `assert.equal(incomplete.confidence, "MEDIUM")`

### 108 — Tabelog does not turn identical but insufficient abbreviated addresses into outlet proof

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog does not turn identical but insufficient abbreviated addresses into outlet proof / 0.100 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(resolution.confidence, "MEDIUM")`

### 119 — Tabelog entity inspection retains phone conflict diagnostics without rejecting complete same-outlet proof

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog entity inspection retains phone conflict diagnostics without rejecting complete same-outlet proof / 0.115 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(inspection.resolution.confidence, "HIGH")`
- `assert.deepEqual(resolveTabelogEntity(phoneCandidate, [{ sourceEntityId: "x", sourceUrl: "https://tabelog.com/tokyo/A1304/x/", outletName: "Restaurant 1", address: "1-1 Shinjuku, Tokyo", phone: "03-9999-8888", }]), inspection.resolution)`
- `assert.equal(inspection.diagnostic.resolution.reason, "HIGH_NAME_AND_ADDRESS")`

### 139 — Tabelog blocks HIGH identity for a stated floor conflict or a shared phone at a distinct branch

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog blocks HIGH identity for a stated floor conflict or a shared phone at a distinct branch / 0.179 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.notEqual(inspection.resolution.confidence, "HIGH")`
- `assert.equal(inspectTabelogEntity({ ...scoped, restaurant: { ...scoped.restaurant, address: "〒150-0002 1F" } }, [{ sourceEntityId: "incomplete", sourceUrl: "https://tabelog.com/tokyo/incomplete/", outletName: "Sushi Hajime", address: "1500002 1F", }]).diagnostic.comparedOutlets[0]?.comparison.address, "INSUFFICIENT")`
- `assert.equal(inspection.diagnostic.comparedOutlets[0]?.comparison.address, "CONFLICT")`

### 157 — Tabelog shares the Japanese basement and Latin B1F identity normalization

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog shares the Japanese basement and Latin B1F identity normalization / 0.493 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(inspection.diagnostic.resolution.confidence, "HIGH")`
- `assert.equal(inspection.diagnostic.resolution.reason, "HIGH_NAME_AND_ADDRESS")`
- `assert.equal(inspection.diagnostic.comparedOutlets[0]?.comparison.address, "MATCH")`

### 178 — Tabelog relative search links are enriched with page identity before an exact phone creates a HIGH outlet match

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog relative search links are enriched with page identity before an exact phone creates a HIGH outlet match / 0.837 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(search[0]?.sourceUrl, "https://tabelog.com/tokyo/A1303/A130301/132590/")`
- `assert.equal(enriched.sourceEntityId, "tokyo/A1303/A130301/132590")`
- `assert.equal(extraction.fields.address.source, "DOM")`

### 213 — Tabelog parser reports every observed outlet; the native batch owns the detail cap

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog parser reports every observed outlet; the native batch owns the detail cap / 0.138 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(outlets.length, 6, "parser output must not silently become the five-detail batch")`

### 222 — Tabelog identity parser extracts JSON-LD identity field provenance

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog identity parser extracts JSON-LD identity field provenance / 0.087 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(extraction.fields.outletName.source, "JSON_LD")`
- `assert.equal(extraction.fields.address.source, "JSON_LD")`
- `assert.equal(extraction.fields.phone.source, "JSON_LD")`

### 235 — Tabelog slot parser ignores prose times and trusts only explicit available controls

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog slot parser ignores prose times and trusts only explicit available controls / 0.377 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(prose, { availableSlots: [], hasExplicitSlotUi: false })`
- `assert.deepEqual(controls, { availableSlots: ["19:00"], hasExplicitSlotUi: true })`

### 242 — Tabelog reads the visible requested calendar restriction without treating loading or hidden projected dates as terminal

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog reads the visible requested calendar restriction without treating loading or hidden projected dates as terminal / 0.461 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(tabelogRequestedDateState(closed, closedDate), "CLOSED")`
- `assert.equal(tabelogQueryControlsRestricted(closed, [{ label: "Guests 2", disabled: true }], 2), true)`
- `assert.equal(tabelogQueryControlsRestricted(loading, [{ label: "Guests 2", disabled: true }], 2), false, "a disabled control during loading remains recoverable rather than a date restriction")`

### 330 — Tabelog executor grounds a deterministic browser observation and never submits

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog executor grounds a deterministic browser observation and never submits / 0.824 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE")`
- `assert.equal(result.offers.length, 1)`
- `assert.equal(session.navigated[0], "https://tabelog.com/en/tokyo/rstLst/?sw=Restaurant%201")`

### 347 — Tabelog Tokyo discovery carries MARUNOUCHI BASE into outlet comparison without granting inventory

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog Tokyo discovery carries MARUNOUCHI BASE into outlet comparison without granting inventory / 0.439 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal((diagnostics[0] as { resolution: { confidence: string } }).resolution.confidence, "HIGH")`
- `assert.notEqual(result.availabilityChecks[tokyoCandidate.restaurant.id]?.status, "AVAILABLE")`
- `assert.equal(session.navigated[0], "https://tabelog.com/en/tokyo/rstLst/?sw=MARUNOUCHI%20BASE")`

### 381 — Tabelog reads a Google-listed merchant page through the identity gate before a wrong discovery branch

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog reads a Google-listed merchant page through the identity gate before a wrong discovery branch / 0.625 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[listedCandidate.restaurant.id]?.status, "AVAILABLE")`
- `assert.equal(session.navigated[0], "https://tabelog.com/en/tokyo/A1304/A130401/123/")`
- `assert.equal(session.navigated.some((url) => url.includes("/rstLst/")), false)`

### 401 — Tabelog native result keeps its observed outlet ID and skips name search without self-matching a phone

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog native result keeps its observed outlet ID and skips name search without self-matching a phone / 1.124 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[native.restaurant.id]?.status, "AVAILABLE")`
- `assert.equal(result.evidence.some((item) => item.kind === "ENTITY_MATCH" && item.entityMatch?.matchedBy.includes("NATIVE_SOURCE_ID_AND_DETAIL")), true)`
- `assert.deepEqual(nativeDiagnostics[0]?.nativeContinuity, { confirmed: true, reason: "SAME_SOURCE_OUTLET", expectedSourceEntityId: "tokyo/A1304/A130401/123", observedSourceEntityId: "tokyo/A1304/A130401/123" })`

### 437 — Tabelog keeps an immediate non-slot UNKNOWN rather than treating a nearby source slot as unavailable

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog keeps an immediate non-slot UNKNOWN rather than treating a nearby source slot as unavailable / 0.367 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN")`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "IMMEDIATE_SLOT_NOT_OFFERED")`
- `assert.equal(result.offers.length, 0)`

### 451 — Tabelog bot challenge and external booking redirect remain non-available results

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog bot challenge and external booking redirect remain non-available results / 0.539 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(challenge.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN")`
- `assert.equal(justAMoment.availabilityChecks[candidate.restaurant.id]?.reasonCode, "BOT_CHALLENGE")`
- `assert.equal(redirect.availabilityChecks[candidate.restaurant.id]?.status, "SOURCE_UNSUPPORTED")`

### 465 — Tabelog recovers one challenged canonical page through an observed alternate-language outlet

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog recovers one challenged canonical page through an observed alternate-language outlet / 0.670 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE")`
- `assert.equal(session.navigated.filter((url) => url === "https://tabelog.com/en/tokyo/A1304/A130401/123/").length, 2)`
- `assert.equal(session.navigated.filter((url) => url === "https://tabelog.com/tokyo/A1304/A130401/123/").length, 1)`

### 480 — Tabelog rejects a challenged alternate that no longer proves the same outlet and keeps the earlier HIGH identity

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog rejects a challenged alternate that no longer proves the same outlet and keeps the earlier HIGH identity / 0.322 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN")`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "BOT_CHALLENGE")`
- `assert.equal(result.evidence.some((item) => item.kind === "ENTITY_MATCH" && item.entityMatch?.confidence === "HIGH"), true)`

### 495 — Tabelog pauses a challenged local session for explicit human intervention, then resumes the same page/session without an automated retry

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog pauses a challenged local session for explicit human intervention, then resumes the same page/session without an automated retry / 0.487 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE")`
- `assert.equal(session.closed, false, "the browser must remain open while the human verifies the page")`
- `assert.equal(intervention?.state, "USER_INTERVENTION_REQUIRED")`

### 532 — Tabelog fails closed when the challenge remains after an explicit resume signal

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog fails closed when the challenge remains after an explicit resume signal / 0.149 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "BOT_CHALLENGE")`
- `assert.equal(pauses, 1)`
- `assert.equal(session.navigated.length, 1, "a still-challenged page is not retried automatically")`

### 550 — Tabelog browser session budget returns UNKNOWN rather than reusing or over-opening a session

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog browser session budget returns UNKNOWN rather than reusing or over-opening a session / 0.053 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN")`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "READ_BUDGET_EXCEEDED")`

### 561 — Tabelog browser startup failure remains observable and is not reported as an entity mismatch

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog browser startup failure remains observable and is not reported as an entity mismatch / 0.118 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "BROWSER_RUNTIME_FAILED")`
- `assert.equal(result.metadata.failureCode, "BROWSER_RUNTIME_FAILED")`

### 573 — Tabelog entity failure sends a sanitized search, detail, and comparison diagnostic to the eval sink

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog entity failure sends a sanitized search, detail, and comparison diagnostic to the eval sink / 0.315 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[phoneCandidate.restaurant.id]?.reasonCode, "ENTITY_MATCH_UNCERTAIN")`
- `assert.deepEqual(diagnostic.searchResults[0], { sourceEntityId: "tokyo/A1304/A130401/123", sourceUrl: "https://tabelog.com/tokyo/A1304/A130401/123/", outletName: "Restaurant 1", })`
- `assert.equal(diagnostic.details[0]?.extracted?.phone.source, "TEL_LINK")`

### 630 — Tabelog search challenge records its cause while removing transient challenge tokens

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog search challenge records its cause while removing transient challenge tokens / 0.140 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[nonTokyoCandidate.restaurant.id]?.reasonCode, "BOT_CHALLENGE")`
- `assert.equal(diagnostic.resolution.reason, "SEARCH_BOT_CHALLENGE")`
- `assert.equal(diagnostic.search.requestedUrl, "https://tabelog.com/en/rstLst/?sw=Restaurant%201")`

### 655 — Tabelog external booking detection ignores unrelated links and requires a booking link

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog external booking detection ignores unrelated links and requires a booking link / 1.727 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(detectExternalReservationRedirect(snapshot),false)`
- `assert.equal(detectExternalReservationRedirect({...snapshot,html:'<a href="https://www.tablecheck.com/en/shops/shop/reserve">Reserve</a>'}),true)`
- `assert.equal(detectExternalReservationRedirect({...snapshot,html:'<a href="/en/booking/form_course/new">Reserve</a>'}),false)`

### 663 — Tabelog captured vacancy binds source merchant, date, party and time rather than visible options

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog captured vacancy binds source merchant, date, party and time rather than visible options / 1.006 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(tabelogCapturedSlots({...snapshot,responses:[{...response,status:503}]},"2026-09-20",4),undefined)`
- `assert.deepEqual(tabelogCapturedSlots(snapshot,"2026-09-20",4),{availableSlots:["19:00"],hasExplicitSlotUi:true})`
- `assert.equal(tabelogCapturedSlots({...snapshot,responses:[{...response,body:changed}]},"2026-09-20",4),undefined)`

### 679 — Tabelog current public controls confirm selection without private hooks or hidden fields and reject contradictory inventory

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog current public controls confirm selection without private hooks or hidden fields and reject contradictory inventory / 0.508 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(hasTabelogSelectedQuery(snapshot,'2026-11-03',2),true)`
- `assert.equal(hasTabelogSelectedQuery({...snapshot,html:changed},'2026-11-03',2),false)`
- `assert.deepEqual(parseTabelogAvailabilitySlots({...snapshot,responses:[{...response,body:changed}]},{date:'2026-11-03',partySize:2}),{availableSlots:[],hasExplicitSlotUi:false},'visible time options cannot rescue a rejected payload')`

### 699 — all 19 saved quick-validation selections match the independent source oracle without fabricating missing responses

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / all 19 saved quick-validation selections match the independent source oracle without fabricating missing responses / 78.057 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(hasTabelogSelectedQuery(snapshot,row.request.date,row.request.partySize),expected.selectedQuery,row.id)`
- `assert.equal(manifest.rows.length,19)`
- `assert.equal(oracle.confirmed,17)`

### 713 — Tabelog uses at most one validated Google-name fragment after an empty first screen, with original identity

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog uses at most one validated Google-name fragment after an empty first screen, with original identity / 1.323 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.offers.length, matchingPhone ? 1 : 0, JSON.stringify({ checks: result.availabilityChecks, identity }))`
- `assert.equal(original.restaurant.outletName, localized.restaurant.outletName)`
- `assert.equal(proposals, 1)`

### 734 — Tabelog nonempty wrong first screen uses one alternative only within the shared detail cap

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog nonempty wrong first screen uses one alternative only within the shared detail cap / 0.559 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.offers.length, 0)`
- `assert.equal(result.evidence.some(item => item.entityMatch?.confidence === "HIGH"), cap === 2)`
- `assert.deepEqual(original, subject)`

### 756 — Tabelog prioritizes the closest observed name before the five-detail cap without granting identity

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog prioritizes the closest observed name before the five-detail cap without granting identity / 0.867 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.evidence.some(e => e.entityMatch?.confidence === "HIGH"), !conflict, "ranking cannot override conflicting identity fields")`
- `assert.equal(details[0], target, "the sixth listed closest name must be inspected first")`
- `assert.equal(new Set(details).size, 5, "availability may reopen the matched outlet but cannot inspect a sixth candidate")`

### 779 — detail priority uses observed locality then distance for equal names and preserves unobserved ties

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / detail priority uses observed locality then distance for equal names and preserves unobserved ties / 0.186 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(prioritizeTabelogOutlets(subject, rows).map(o => o.sourceEntityId), ["near", "far", "other-area"])`
- `assert.deepEqual(rows, before)`
- `assert.deepEqual(prioritizeTabelogOutlets(subject, unknown), unknown, "missing fields cannot invent a location or reorder a tie")`

### 792 — Tabelog applies availability controls on the resolved outlet after inspecting other branches

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog applies availability controls on the resolved outlet after inspecting other branches / 0.771 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.offers.length, 1)`
- `assert.equal(session.navigated.at(-1), selected.url)`

### 805 — recorded source price fragments retain exact ranges, course values, tax and quotes

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / recorded source price fragments retain exact ranges, course values, tax and quotes / 3.108 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(facts.listedCoursePricesYen.every(price => price.sourceUrl === url && price.quote && price.tax === "INCLUDED"))`
- `assert.equal(parseTabelogPriceFacts({ url: sourceUrls["ginza-sushi-sendou"]!, title: "No price", html: "<p>Contact us</p>", text: "Contact us" }), undefined)`
- `assert.ok(facts, name)`

### 829 — Tabelog existing read grounds recorded course prices even when inventory is UNKNOWN

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog existing read grounds recorded course prices even when inventory is UNKNOWN / 1.911 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(read.offers.length, 0, "listed prices do not establish inventory")`
- `assert.equal(prices?.listedCoursePricesYen[0]?.amount, 9800, "the opened page's price must survive Adapter → grounding, without a new read")`

### 847 — Tabelog field quotations retain merchant courses separately from names/reviews and reject neighboring courses

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog field quotations retain merchant courses separately from names/reviews and reject neighboring courses / 17.317 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(q.some(q=>q.field==="NAME"&&q.quote==="Omakase House"))`
- `assert.ok(q.some(q=>q.field==="CUSTOMER_REVIEW"&&q.quote==="Wonderful Kaiseki"))`
- `assert.ok(q.some(q=>q.field==="COURSE_TITLE"&&q.quote==="Lunch Omakase Course"&&q.meal==="LUNCH"))`

### 866 — Tabelog field quotations match class tokens with reordered and extra classes without JS hooks

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / Tabelog field quotations match class tokens with reordered and extra classes without JS hooks / 0.225 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(parseTabelogSourceFieldQuotes({ url, title: "Source", text: "", html }), expected)`

### 886 — bound vacancy collections keep supported clock alternatives and never infer stock from unsupported rows

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / bound vacancy collections keep supported clock alternatives and never infer stock from unsupported rows / 16.040 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(hasTabelogSelectedQuery(snapshot,request.date,request.partySize),true,row.id)`
- `assert.equal(parsed.hasExplicitSlotUi,true,row.id)`
- `assert.ok(parsed.availableSlots.includes('19:00'),row.id+' retains the independently bound requested slot')`

## src/integrations/tablecheck/tablecheck-browser-availability.test.ts

B所属站点文件：TableCheck G3等待有时段真实录制，当前菜单/服务范围与错店/错请求/错误空位对照继续冻结；A不抢先改文件。

### 30 — TableCheck original then one fragment shares the detail cap and never changes identity fields

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck original then one fragment shares the detail cap and never changes identity fields / 9.796 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(confidence, expectAlternative || originalHigh ? "HIGH" : "LOW", scenario)`
- `assert.equal(result.offers.length, 0, "identity alone is not inventory")`
- `assert.deepEqual(original, subject)`

### 72 — TableCheck binds a request only to explicit complete date and party control state

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck binds a request only to explicit complete date and party control state / 0.807 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(hasTableCheckSelectedRequest(snapshot, "2026-09-07", 2), true)`
- `assert.equal(hasTableCheckSelectedRequest(snapshot, "2026-09-08", 2), false)`
- `assert.equal(hasTableCheckSelectedRequest({ ...snapshot, html: '<div data-selected-date="2025-09-07" data-pax="2"></div>' }, "2026-09-07", 2), false)`

### 86 — TableCheck records only a same-shop, exact-date/party/time unclassified availability failure response

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck records only a same-shop, exact-date/party/time unclassified availability failure response / 11.953 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(parseTableCheckCapturedAvailability([{ ...exact, body: { status: "success", data: null } }], target, request), undefined)`
- `assert.deepEqual(tableCheckAvailabilityResponseRule(target), { origin: "https://www.tablecheck.com", pathname: "/en/shops/cytokyo-lavarock/available", })`
- `assert.deepEqual(parseTableCheckCapturedAvailability([exact], target, request), { classification: "UNCLASSIFIED_FAILURE", observedAt: "2026-10-01T10:10:00.000Z", time: "19:00", })`

### 105 — TableCheck reservation form binds the selected date and adult count without inventing inventory

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck reservation form binds the selected date and adult count without inventing inventory / 2.626 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(hasTableCheckSelectedRequest(snapshot, "2026-09-25", 10), false, "HTML attributes alone can be stale after selection")`
- `assert.equal(hasTableCheckSelectedRequest(snapshot, "2026-09-25", 10, controls), true)`
- `assert.equal(hasTableCheckSelectedRequest(snapshot, "2026-09-25", 10, changed), false)`

### 143 — TableCheck recognizes its explicit public no-table widget state but not ordinary restaurant prose

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck recognizes its explicit public no-table widget state but not ordinary restaurant prose / 0.881 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(parseTableCheckAvailabilitySlots(noTable), { availableSlots: [], hasExplicitSlotUi: true, explicitlyEmpty: true, queryComplete: true })`
- `assert.deepEqual(parseTableCheckAvailabilitySlots({ ...noTable, html: "", text: "Restaurant reviews say we could not find a table last year." }), { availableSlots: [], hasExplicitSlotUi: false, explicitlyEmpty: false, queryComplete: false })`

### 152 — TableCheck does not treat a partial or stale slot list as a completed query result

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck does not treat a partial or stale slot list as a completed query result / 0.444 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(hasTableCheckSelectedRequest(partial, "2026-09-07", 2), true)`
- `assert.deepEqual(parseTableCheckAvailabilitySlots(partial), { availableSlots: ["19:00"], hasExplicitSlotUi: true, explicitlyEmpty: false, queryComplete: false, })`

### 164 — TableCheck binds a public slot result only when its reservation link carries the exact request

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck binds a public slot result only when its reservation link carries the exact request / 1.189 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(hasTableCheckSelectedRequest(snapshot, "2026-09-07", 2), true)`
- `assert.equal(hasTableCheckSelectedRequest(snapshot, "2026-09-07", 3), false)`
- `assert.deepEqual(parseTableCheckAvailabilitySlots(snapshot, { date: "2026-09-07", partySize: 2 }), { availableSlots: ["19:00"], hasExplicitSlotUi: true, explicitlyEmpty: false, queryComplete: true, })`

### 182 — TableCheck binds the observed non-shops reservation landing path only to the same exact request

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck binds the observed non-shops reservation landing path only to the same exact request / 0.585 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(hasTableCheckSelectedRequest(snapshot, request.date, request.partySize), true)`
- `assert.deepEqual(parseTableCheckAvailabilitySlots(snapshot, request), { availableSlots: ["19:00"], hasExplicitSlotUi: true, explicitlyEmpty: false, queryComplete: true, })`
- `assert.deepEqual(parseTableCheckControlAvailability([ { id: "exact", stableKey: "exact", kind: "LINK", role: "link", label: "19:00", href: "https://www.tablecheck.com/en/omotesandoria/reserve/landing?start_date=2026-10-04&start_time=19:00&num_people=2", disabled: false, visible: true }, { id: "other", stableKey: "other", kind: "LINK", role: "link", label: "19:00", href: "https://www.tablecheck.com/en/other-branch/reserve/landing?start_date=2026-10-04&start_time=19:00&num_people=2", disabled: false, visible: true }, { id: "wrong-party", stableKey: "wrong-party", kind: "LINK", role: "link", label: "19:00", href: "https://www.tablecheck.com/en/omotesandoria/reserve/landing?start_date=2026-10-04&start_time=19:00&num_people=3", disabled: false, visible: true }, { id: "disabled", stableKey: "disabled", kind: "LINK", role: "link", label: "19:30", href: "https://www.tablecheck.com/en/omotesandor`

### 208 — TableCheck excludes a disabled exact-request reservation link from current availability

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck excludes a disabled exact-request reservation link from current availability / 0.314 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(hasTableCheckSelectedRequest(snapshot, request.date, request.partySize), false)`
- `assert.deepEqual(parseTableCheckAvailabilitySlots(snapshot, request), { availableSlots: [], hasExplicitSlotUi: false, explicitlyEmpty: false, queryComplete: false, })`

### 220 — TableCheck reads the same exact request binding from live DOM controls when hydration omits it from HTML

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck reads the same exact request binding from live DOM controls when hydration omits it from HTML / 0.197 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(parseTableCheckControlAvailability([ { id: "slot", stableKey: "slot", kind: "LINK", role: "link", label: "19:00", href: "https://www.tablecheck.com/en/shops/restaurant1/reserve?start_date=2026-09-07&start_time=19:00&num_people=2", disabled: false, visible: true }, { id: "stale", stableKey: "stale", kind: "LINK", role: "link", label: "19:30", href: "https://www.tablecheck.com/en/shops/restaurant1/reserve?start_date=2025-09-07&start_time=19:30&num_people=2", disabled: false, visible: true }, { id: "other", stableKey: "other", kind: "LINK", role: "link", label: "19:15", href: "https://www.tablecheck.com/en/shops/other-branch/reserve?start_date=2026-09-07&start_time=19:15&num_people=2", disabled: false, visible: true }, ], "2026-09-07", 2, "https://www.tablecheck.com/en/restaurant1", {earliest:"19:00",latest:"19:00"}), { availableSlots: ["19:00"], hasExplicitSlotUi: true, ex`

### 230 — TableCheck category scope binds every presented slot to a visible enabled same-outlet control

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck category scope binds every presented slot to a visible enabled same-outlet control / 0.497 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(hasTableCheckScopeBoundSlot(page, controls, { date: "2026-08-05", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:30" } }, scope, ["19:00"]), false)`
- `assert.equal(hasTableCheckScopeBoundSlot(page, [...controls, exact], { date: "2026-08-05", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:30" } }, scope, ["19:00"]), true)`
- `assert.equal(hasTableCheckScopeBoundSlot(page, [...controls, exact, { ...controls[0]!, id: "old-later", stableKey: "old-later", label: "19:30", href: current("/en/restaurant1/reserve/landing", "19:30") }], { date: "2026-08-05", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:30" } }, scope, ["19:00", "19:30"]), false)`

### 246 — TableCheck reads scoped menu text only from a real outer menu item

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck reads scoped menu text only from a real outer menu item / 1.909 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(parseTableCheckScopedMenuExcerpts(snapshot(scoped), [scopeControl]).map((item) => ({ value: item.serviceScope.value, text: item.text })), [{ value: "sushi", text: "Sushi Omakase\nTwelve pieces" }])`
- `assert.deepEqual(parseTableCheckScopedMenuExcerpts(snapshot(scoped.replace('class="menu-item"', 'class="menu-item-title"')), [scopeControl]), [], "a title class prefix is not an outer menu container")`
- `assert.deepEqual(parseTableCheckScopedMenuExcerpts(snapshot(hiddenMarkup), [scopeControl]), [])`

### 304 — TableCheck keeps an exact captured failure diagnostic-only until page inventory evidence exists

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck keeps an exact captured failure diagnostic-only until page inventory evidence exists / 3.610 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[scoped.restaurant.id]?.status, "UNKNOWN")`
- `assert.equal(result.availabilityChecks[scoped.restaurant.id]?.reasonCode, "AVAILABILITY_RESULT_UNOBSERVED")`
- `assert.equal(result.evidence.some(item => item.kind === "AVAILABILITY" && item.claims.inventoryStatus === "UNAVAILABLE"), false)`

### 341 — TableCheck does not complete an enabled HTML slot when its current live control is disabled

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck does not complete an enabled HTML slot when its current live control is disabled / 1.009 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.offers.length, 0)`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN")`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "AVAILABILITY_RESULT_UNOBSERVED")`

### 360 — TableCheck does not promote an exact reservation link hidden from the current DOM

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck does not promote an exact reservation link hidden from the current DOM / 0.650 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.offers.length, 0)`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN")`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "AVAILABILITY_RESULT_UNOBSERVED")`

### 378 — TableCheck keeps a visible exact sibling when a nested hidden prior result has the same link

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck keeps a visible exact sibling when a nested hidden prior result has the same link / 0.780 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.offers.length, 1)`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE")`

### 396 — TableCheck does not revive a disabled request card through an enabled hydrated link

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck does not revive a disabled request card through an enabled hydrated link / 0.667 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.offers.length, 0)`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN")`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "AVAILABILITY_RESULT_UNOBSERVED")`

### 415 — TableCheck keeps an enabled exact slot when a different slot in the requested window is disabled

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck keeps an enabled exact slot when a different slot in the requested window is disabled / 0.696 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.offers.length, 1)`
- `assert.match(result.offers[0]?.dateTime ?? "", /T18:30/)`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE")`

### 436 — TableCheck does not complete a current exact slot while its availability widget still has a skeleton

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck does not complete a current exact slot while its availability widget still has a skeleton / 2.030 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(loading.offers.length, 0)`
- `assert.equal(loading.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN")`
- `assert.equal(loading.availabilityChecks[candidate.restaurant.id]?.reasonCode, "AVAILABILITY_RESULT_UNOBSERVED")`

### 466 — TableCheck does not treat an outside or ambiguous-widget reservation entrance as inventory

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck does not treat an outside or ambiguous-widget reservation entrance as inventory / 1.228 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.offers.length, 0)`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN")`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "AVAILABILITY_RESULT_UNOBSERVED")`

### 505 — TableCheck discovers public guide pages by restaurant name and coordinates, never by slug guessing

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck discovers public guide pages by restaurant name and coordinates, never by slug guessing / 0.083 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(url.pathname, "/en/japan/search")`
- `assert.equal(url.searchParams.get("search_text"), "Sushi Inase")`
- `assert.equal(url.searchParams.get("geo_latitude"), "35.6555319")`

### 525 — TableCheck parser reports every observed guide; callers own bounded detail inspection

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck parser reports every observed guide; callers own bounded detail inspection / 0.055 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(parseTableCheckDiscoveryOutletUrls(snapshot, "").length, 6)`

### 533 — TableCheck resolves a real linked reservation page and only sets read parameters

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck resolves a real linked reservation page and only sets read parameters / 0.045 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(target, { kind: "LINKED_PAGE", url: "https://www.tablecheck.com/en/restaurant1/reserve/landing?utm_source=tablecheck_portal" })`
- `assert.equal( tableCheckRequestedReservationUrl(target!, "2026-08-05", 2), "https://www.tablecheck.com/en/restaurant1/reserve/landing?utm_source=tablecheck_portal&start_date=2026-08-05&pax=2", )`

### 546 — TableCheck pre-fills only an exact observed guide request without turning it into inventory

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck pre-fills only an exact observed guide request without turning it into inventory / 0.032 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal( tableCheckRequestedReservationUrl(target, "2026-10-08", 2, { earliest: "19:00", latest: "19:00" }), "https://www.tablecheck.com/en/sushihajime-shibuya?date=2026-10-08&time=19%3A00&num_people=2&availability_format=datetime&availability_mode=same_meal_time", )`
- `assert.equal( tableCheckRequestedReservationUrl(target, "2026-10-08", 2, { earliest: "18:00", latest: "19:00" }), target.url, "the observed serializer does not justify picking a time from a requested range", )`

### 559 — TableCheck accepts a source-owned reservation page on a distinct shops route only for the selected guide

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck accepts a source-owned reservation page on a distinct shops route only for the selected guide / 0.104 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(resolveTableCheckReservationTarget(snapshot(guide, reserve, true), outlet), { kind: "LINKED_PAGE", url: reserve })`
- `assert.equal(resolveTableCheckReservationTarget(snapshot("https://www.tablecheck.com/en/other-branch", reserve), outlet), undefined)`
- `assert.equal(resolveTableCheckReservationTarget(snapshot(guide, "https://example.com/en/shops/cytokyo-lavarock/reserve"), outlet), undefined)`

### 572 — TableCheck retains an observed same-entity shops reservation entrance when guide JSON-LD omits acceptsReservations

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck retains an observed same-entity shops reservation entrance when guide JSON-LD omits acceptsReservations / 0.040 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(resolveTableCheckReservationTarget(page, outlet), { kind: "LINKED_PAGE", url: "https://www.tablecheck.com/en/shops/restaurant1/reserve", })`
- `assert.equal(resolveTableCheckReservationTarget({ ...page, html: '<a href="/en/shops/other-branch/reserve">Other branch</a>' }, outlet), undefined)`

### 584 — TableCheck identity uses exact phone or name and full address, never name alone

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck identity uses exact phone or name and full address, never name alone / 0.173 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(extraction.fields.address.source, "DOM")`
- `assert.equal(extraction.fields.phone.source, "TEL_LINK")`
- `assert.equal(inspectTableCheckEntity(candidate, extraction.outlet).resolution.confidence, "HIGH")`

### 608 — TableCheck keeps phone disagreement diagnostic but accepts a complete same outlet and rejects a branch

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck keeps phone disagreement diagnostic but accepts a complete same outlet and rejects a branch / 0.052 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(sameOutlet.resolution.confidence, "HIGH")`
- `assert.equal(otherBranch.resolution.confidence, "MEDIUM")`
- `assert.equal(sameOutlet.comparison.phone, "CONFLICT")`

### 621 — TableCheck blocks HIGH identity for a stated floor conflict or a shared phone at a distinct branch

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck blocks HIGH identity for a stated floor conflict or a shared phone at a distinct branch / 0.982 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.notEqual(inspection.resolution.confidence, "HIGH")`
- `assert.equal(inspectTableCheckEntity({ ...scoped, restaurant: { ...scoped.restaurant, address: "〒150-0002 1F" } }, { sourceEntityId: "incomplete", sourceUrl: "https://www.tablecheck.com/en/incomplete", outletName: "Sushi Hajime", address: "1500002 1F", }).comparison.address, "INSUFFICIENT")`
- `assert.equal(inspection.comparison.address, "CONFLICT")`

### 639 — historical TWO ROOMS postal variation preserves same outlet while real branches and other controls stay distinct

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / historical TWO ROOMS postal variation preserves same outlet while real branches and other controls stay distinct / 1.308 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(same.comparison.address, "INSUFFICIENT", "different town/building-floor postal codes alone do not prove a conflict")`
- `assert.equal(same.resolution.confidence, "HIGH")`
- `assert.equal(bills.resolution.confidence, "HIGH")`

### 675 — TWO ROOMS frozen identity fields pass the production TableCheck extraction gate before availability

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TWO ROOMS frozen identity fields pass the production TableCheck extraction gate before availability / 3.243 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(diagnostics[0]?.resolution.confidence, "HIGH")`
- `assert.equal(saved.readEvidence.find((item) => item.kind === "ENTITY_MATCH")?.entityMatch?.confidence, "HIGH")`
- `assert.equal(saved.readEvidence.find((item) => item.kind === "ENTITY_MATCH")?.sourceEntityId, "trnihombashi")`

### 723 — TableCheck treats historical Japanese and Latin floor forms as the same stated unit

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck treats historical Japanese and Latin floor forms as the same stated unit / 0.454 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(inspection.resolution.confidence, "HIGH", pair.outletName)`
- `assert.equal(inspection.reason, "HIGH_NAME_AND_ADDRESS", pair.outletName)`
- `assert.equal(missingUnit.resolution.confidence, "HIGH")`

### 808 — TableCheck accepts cross-script complete addresses only with matching postal and unit sequence

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck accepts cross-script complete addresses only with matching postal and unit sequence / 0.204 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(sameOutlet.resolution.confidence, "HIGH")`
- `assert.equal(sameMallOtherFloor.resolution.confidence, "MEDIUM")`

### 823 — TableCheck slot parser ignores prose and accepts only explicitly bookable time controls

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck slot parser ignores prose and accepts only explicitly bookable time controls / 0.126 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(prose, { availableSlots: [], hasExplicitSlotUi: false, explicitlyEmpty: false, queryComplete: false })`
- `assert.deepEqual(controls, { availableSlots: ["19:00"], hasExplicitSlotUi: true, explicitlyEmpty: false, queryComplete: false })`

### 857 — TableCheck native guide uses its own ID and linked booking entrance without a name search

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck native guide uses its own ID and linked booking entrance without a name search / 17.918 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[native.restaurant.id]?.status, "AVAILABLE", JSON.stringify({ checks: result.availabilityChecks, navigations: session.navigations }))`
- `assert.equal(result.evidence.some((item) => item.kind === "ENTITY_MATCH" && item.entityMatch?.matchedBy.includes("NATIVE_SOURCE_ID_AND_DETAIL")), true)`
- `assert.equal(priceFact?.sourceUrl, guide.url, "the guide citation must not become the request page URL")`

### 906 — TableCheck recovers one challenged canonical availability page through its observed alternate-language outlet

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck recovers one challenged canonical availability page through its observed alternate-language outlet / 0.782 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE")`
- `assert.equal(session.navigations.filter((url) => url === "https://www.tablecheck.com/en/restaurant1").length, 2)`
- `assert.equal(session.navigations.filter((url) => url === "https://www.tablecheck.com/ja/restaurant1/reserve/landing?start_date=2026-08-05&pax=2").length, 1)`

### 925 — TableCheck does not invent an alternate after a challenged high-identity outlet and retains that identity

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck does not invent an alternate after a challenged high-identity outlet and retains that identity / 0.297 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN")`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "BOT_CHALLENGE")`
- `assert.equal(result.evidence.some((item) => item.kind === "ENTITY_MATCH" && item.entityMatch?.confidence === "HIGH"), true)`

### 938 — TableCheck rejects a recovered alternate whose high identity cannot be re-established

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck rejects a recovered alternate whose high identity cannot be re-established / 0.283 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN")`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "BOT_CHALLENGE")`
- `assert.equal(result.evidence.some((item) => item.kind === "ENTITY_MATCH" && item.entityMatch?.confidence === "HIGH"), true)`

### 957 — TableCheck retains verified identity when later availability controls time out

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck retains verified identity when later availability controls time out / 0.513 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "BROWSER_TIMEOUT")`
- `assert.equal(result.evidence.some((item) => item.kind === "ENTITY_MATCH" && item.entityMatch?.confidence === "HIGH"), true)`

### 975 — TableCheck executor grounds a discovered same-outlet page and real linked reservation page without booking actions

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck executor grounds a discovered same-outlet page and real linked reservation page without booking actions / 2.279 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, fixture.expected, fixture.state + ":" + fixture.date)`
- `assert.equal(result.offers[0]?.source, "TABLECHECK")`
- `assert.deepEqual(result.evidence.map((item) => item.kind), ["ENTITY_MATCH", "RESTAURANT_FACT", "AVAILABILITY"])`

### 1027 — TableCheck reads a Google-listed merchant page through the same identity gate before using discovery results

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck reads a Google-listed merchant page through the same identity gate before using discovery results / 0.589 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[listedCandidate.restaurant.id]?.status, "AVAILABLE")`
- `assert.equal(session.navigations[0], "https://www.tablecheck.com/en/restaurant1")`
- `assert.equal(session.navigations.some((url) => url.includes("/japan/search")), false)`

### 1048 — TableCheck validates each Google link field so Maps or an invalid lead cannot hide a public merchant website

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck validates each Google link field so Maps or an invalid lead cannot hide a public merchant website / 1.021 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[listedCandidate.restaurant.id]?.status, "AVAILABLE")`
- `assert.equal(session.navigations[0], "https://www.tablecheck.com/en/restaurant1")`
- `assert.equal(session.navigations.some((url) => url.includes("/japan/search")), false)`

### 1081 — TableCheck keeps an immediate non-slot UNKNOWN rather than treating nearby cards as no matching table

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck keeps an immediate non-slot UNKNOWN rather than treating nearby cards as no matching table / 0.511 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN")`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "IMMEDIATE_SLOT_NOT_OFFERED")`
- `assert.equal(result.offers.length, 0)`

### 1099 — TableCheck reuses a verified outlet entry only after independently matching a second candidate

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck reuses a verified outlet entry only after independently matching a second candidate / 1.795 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[alias.restaurant.id]?.status, "AVAILABLE")`
- `assert.notEqual(result.evidence.find((item) => item.candidateId === alias.restaurant.id && item.kind === "AVAILABILITY")?.candidateId, candidate.restaurant.id)`
- `assert.ok(unrelatedExtraction)`

### 1124 — TableCheck does not let an unrelated run entry suppress the current candidate's required discovery

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck does not let an unrelated run entry suppress the current candidate's required discovery / 2.464 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE")`
- `assert.equal(modelCalls, 1)`
- `assert.ok(target)`

### 1152 — TableCheck continues in one session when the standard method is incomplete and accepts slots only after model actions visibly confirm date and party

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck continues in one session when the standard method is incomplete and accepts slots only after model actions visibly confirm date and party / 2.006 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.match(input.skills.source, /TableCheck/)`
- `assert.equal(modelCalls, 2)`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE")`

### 1190 — TableCheck continues in the same session from confirmed conditions to an explicitly marked slot UI

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck continues in the same session from confirmed conditions to an explicitly marked slot UI / 0.993 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE")`
- `assert.ok(target)`
- `assert.equal(session.clicks, 1)`

### 1219 — TableCheck uses the one exact-phone outlet among multiple discovered same-name pages

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck uses the one exact-phone outlet among multiple discovered same-name pages / 0.517 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE")`
- `assert.deepEqual(session.navigations.slice(1, 3), [ "https://www.tablecheck.com/en/restaurant1-other", "https://www.tablecheck.com/en/restaurant1", ])`

### 1247 — TableCheck returns to the selected outlet after inspecting another branch before reading slots

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck returns to the selected outlet after inspecting another branch before reading slots / 0.503 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE")`
- `assert.deepEqual(session.navigations.slice(1, 4), [ "https://www.tablecheck.com/en/restaurant1", "https://www.tablecheck.com/en/restaurant1-other", "https://www.tablecheck.com/en/restaurant1", ])`

### 1275 — TableCheck rejects hydrated links from a prior search query

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck rejects hydrated links from a prior search query / 0.116 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "TABLECHECK_DISCOVERY_INCOMPLETE")`
- `assert.equal(result.offers.length, 0)`
- `assert.equal(session.navigations.length, 1)`

### 1285 — TableCheck fails closed when discovered same-name branches have no HIGH identity evidence

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck fails closed when discovered same-name branches have no HIGH identity evidence / 0.210 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "TABLECHECK_ENTITY_MATCH_UNCERTAIN")`
- `assert.equal(result.offers.length, 0)`
- `assert.equal(diagnostic.resolution.reason, "TABLECHECK_ENTITY_MATCH_UNCERTAIN")`

### 1316 — TableCheck discovery distinguishes a public no-result page from parser failure

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck discovery distinguishes a public no-result page from parser failure / 0.117 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "TABLECHECK_DISCOVERY_NO_RESULT")`
- `assert.equal(diagnostic.discovery.status, "NO_RESULT")`
- `assert.equal(diagnostic.resolution.reason, "TABLECHECK_DISCOVERY_NO_RESULT")`

### 1333 — TableCheck error-page classification does not treat normal result copy or numbers as an unavailable document

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck error-page classification does not treat normal result copy or numbers as an unavailable document / 0.040 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(error.matchedSignals, [ { source: "TITLE", value: "404 Not Found" }, { source: "PRIMARY_HEADING", value: "404 Not Found" }, ])`
- `assert.equal(normal.pageUnavailable, false)`
- `assert.deepEqual(normal.matchedSignals, [])`

### 1352 — TableCheck hands an extractable-search gap to the model in the same session and verifies the resulting observation

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck hands an extractable-search gap to the model in the same session and verifies the resulting observation / 0.813 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE")`
- `assert.ok(target)`
- `assert.equal(session.clicks, 1)`

### 1393 — TableCheck classifies exhausted recoverable discovery separately from an unavailable provider page

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck classifies exhausted recoverable discovery separately from an unavailable provider page / 0.210 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN")`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "TABLECHECK_DISCOVERY_INCOMPLETE")`
- `assert.equal(diagnostic.discovery.status, "EXPLORATION_EXHAUSTED")`

### 1413 — TableCheck discovery 403 documents are provider-page failures, not outlet identity failures

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck discovery 403 documents are provider-page failures, not outlet identity failures / 0.114 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "SOURCE_UNSUPPORTED")`
- `assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "TABLECHECK_PAGE_UNAVAILABLE")`
- `assert.equal(diagnostic.discovery.status, "PAGE_UNAVAILABLE")`

### 1432 — TableCheck guide empty result is bound to one ready widget and exact selected request

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck guide empty result is bound to one ready widget and exact selected request / 0.506 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(hasTableCheckSelectedRequest(snapshot,query.date,query.partySize),true)`
- `assert.equal(parseTableCheckAvailabilitySlots(snapshot,query).explicitlyEmpty,true)`
- `assert.equal(parseTableCheckAvailabilitySlots(snapshot,input).explicitlyEmpty,false)`

### 1446 — TableCheck accepts a correct realtime control slot inside its ready widget and rejects its wrong-date counterpart

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck accepts a correct realtime control slot inside its ready widget and rejects its wrong-date counterpart / 1.682 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.offers.length, date === request.date ? 1 : 0)`
- `assert.equal(result.availabilityChecks[request.candidateIds[0]!]?.status, date === request.date ? "AVAILABLE" : "UNKNOWN")`

### 1462 — TableCheck disabled times cover only the ready widget's requested half-hour window

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck disabled times cover only the ready widget's requested half-hour window / 0.901 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.explicitlyEmpty,true)`
- `assert.equal(result.queryComplete,true)`
- `assert.deepEqual(result.availableSlots,['20:00'])`

### 1477 — TableCheck recorded GiNZA no-table message is EMPTY only for its bound mealtime

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck recorded GiNZA no-table message is EMPTY only for its bound mealtime / 5.277 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual((partial as any).emptyMealtime, { date: query.date, partySize: 10, time: "17:30", status: "EMPTY" })`
- `assert.equal(partial.explicitlyEmpty, false, "one mealtime must not cover the whole window")`
- `assert.equal(partial.queryComplete, false)`

### 1492 — TableCheck actual empty widget stops mealtime loops without claiming a wider window empty

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / TableCheck actual empty widget stops mealtime loops without claiming a wider window empty / 24.356 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.offers.length, 0)`
- `assert.equal(check.status, variant === "exact" ? "UNAVAILABLE" : "UNKNOWN")`
- `assert.equal(check.reasonCode, "SELECTED_MEALTIME_EMPTY")`

### 1516 — group-window: prohibited linked workflow is unsupported before navigation

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / group-window: prohibited linked workflow is unsupported before navigation / 1.099 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]!.status,"SOURCE_UNSUPPORTED")`
- `assert.equal(session.navigations.some(url=>url.includes("/reserve")),false)`

### 1529 — group-window: point empty continues to the next observed legal time

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / group-window: point empty continues to the next observed legal time / 2.951 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]!.status,"AVAILABLE")`
- `assert.equal(result.offers[0]!.dateTime,\`${date}T19:30:00+09:00\`)`
- `assert.deepEqual(selections,["19:30"])`

### 1547 — group-window: an already prohibited candidate entrance is rejected before a browser session

**DEFER_TO_B_G3_KEEP_UNTIL_REPLACED**

- default / group-window: an already prohibited candidate entrance is rejected before a browser session / 0.215 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.availabilityChecks[candidate.restaurant.id]!.status,"SOURCE_UNSUPPORTED")`
- `assert.equal(result.offers.length,0)`
- `assert.equal(result.evidence.some(e=>e.entityMatch?.confidence==="HIGH"),false)`

## src/server/local-web-server.test.ts

HTTP用户授权、case/profile隔离、重复提交、W12截止与G1问答重启/取消/20题持久上限都是真实Web入口；PGlite/fixture并非无意义慢集成。

### 384 — T1 Web waits fail with the target signal label when no SSE event arrives (timeoutMs=20)

**KEEP_DISTINCT_CONTRACT**

- default / T1 Web waits fail with the target signal label when no SSE event arrives (timeoutMs=20) / 21.427 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.ok(error instanceof Error)`
- `assert.match(error.message, /Timed out waiting for next SSE event/, "the SSE wait itself must fail, not the outer test deadline")`
- `assert.equal(await withinTestTimeout(Promise.resolve("ready"), "resolved signal", 20), "ready")`

### 510 — Stage 2B serves the fixture workspace and rejects unauthenticated case access

**KEEP_PROTECTED**

- default / Stage 2B serves the fixture workspace and rejects unauthenticated case access / 952.865 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(response.status, 200)`
- `assert.equal(unauthorized.status, 401)`
- `assert.match(page, /Fixture only/i)`

保护：AUTHORIZATION_IDEMPOTENCY_OR_OUTCOME

### 526 — H002 persistent Runtime preserves explicit or inferred party size and safely asks when the supplement is unknown or fails

**KEEP_DISTINCT_CONTRACT**

- default / H002 persistent Runtime preserves explicit or inferred party size and safely asks when the supplement is unknown or fails / 699.353 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(explicit.restaurant.intentDraft?.partySizeSource, "EXPLICIT")`
- `assert.equal(relational.restaurant.intentDraft?.partySizeSource, "INFERRED_CLOSED_PARTY")`
- `assert.equal(unknown.case.phase, "NEEDS_INPUT")`

### 589 — H002 persistent duplicate message delivery invokes the supplement once; completed retries and refresh do not invoke it

**KEEP_DISTINCT_CONTRACT**

- default / H002 persistent duplicate message delivery invokes the supplement once; completed retries and refresh do not invoke it / 658.233 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(initial.case.phase, "NEEDS_INPUT")`
- `assert.ok(settled.every((result) => result.status === "fulfilled"), "both duplicate deliveries must resolve from the one durable event")`
- `assert.equal(created.case.phase, "PRESENT_RESULTS")`

### 712 — selection-session browse and shortlist use the persistent Web entry without new model or source work

**KEEP_DISTINCT_CONTRACT**

- default / selection-session browse and shortlist use the persistent Web entry without new model or source work / 561.133 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(created.case.phase, "PRESENT_RESULTS")`
- `assert.deepEqual(calls, { model: 3, search: 1, facts: 0, availability: 0 })`
- `assert.equal(viewed.response.status, 200, String(viewed.payload.error))`

### 760 — selection-session fills an open-ended result target with candidate fact reads before presenting

**KEEP_DISTINCT_CONTRACT**

- default / selection-session fills an open-ended result target with candidate fact reads before presenting / 504.388 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(created.case.phase, "PRESENT_RESULTS")`
- `assert.deepEqual(calls, { model: 4, search: 1, facts: 3, availability: 0 }, "three outlet checkpoints retain one Agent fact action and event")`
- `assert.deepEqual(created.restaurant.presentedCandidateIds, ["a", "b", "c"])`

### 780 — selection-session replenishes an inadequate same-condition pool through its durable cursor

**KEEP_DISTINCT_CONTRACT**

- default / selection-session replenishes an inadequate same-condition pool through its durable cursor / 513.191 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(another.response.status, 200, String(another.payload.error))`
- `assert.equal(view.case.phase, "PRESENT_RESULTS")`
- `assert.deepEqual(calls, { model: 5, search: 2, facts: 0, availability: 0 })`

### 801 — selection-session condition revision preserves shortlist memory but performs a fresh authoritative read

**KEEP_DISTINCT_CONTRACT**

- default / selection-session condition revision preserves shortlist memory but performs a fresh authoritative read / 509.382 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(revised.response.status, 200, String(revised.payload.error))`
- `assert.deepEqual(calls, { model: 6, search: 2, facts: 0, availability: 0 })`
- `assert.equal(view.restaurant.intentDraft?.partySize, 4)`

### 826 — local workspace Live mode is explicit and never falls back to fixture on a misspelled provider mode

**KEEP_DISTINCT_CONTRACT**

- default / local workspace Live mode is explicit and never falls back to fixture on a misspelled provider mode / 0.283 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(localRestaurantProviderMode({}), "FIXTURE")`
- `assert.equal(localRestaurantProviderMode({ PRAXIS_RESTAURANT_PROVIDER_MODE: "LIVE_READ" }), "LIVE_READ")`
- `assert.throws( () => localRestaurantProviderMode({ PRAXIS_RESTAURANT_PROVIDER_MODE: "live" }), /FIXTURE or LIVE_READ/, )`

### 835 — local workspace Live mode rejects missing server-only gates and accepts LOCAL_CHROMIUM without Cloudflare credentials

**KEEP_DISTINCT_CONTRACT**

- default / local workspace Live mode rejects missing server-only gates and accepts LOCAL_CHROMIUM without Cloudflare credentials / 0.130 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.throws( () => assertLocalLiveReadEnvironment({ PRAXIS_ALLOW_BROWSER_RUN: "1" }), /PRAXIS_ALLOW_LIVE_RESTAURANT_READ=1/, )`
- `assert.throws( () => assertLocalLiveReadEnvironment({ PRAXIS_ALLOW_LIVE_RESTAURANT_READ: "1", PRAXIS_ALLOW_BROWSER_RUN: "1", DEEPSEEK_API_KEY: "test", DEEPSEEK_MODEL: "test", GOOGLE_MAPS_API_KEY: "test", PRAXIS_BROWSER_ENGINE: "AUTO", }), /CLOUDFLARE_ACCOUNT_ID/, )`
- `assert.doesNotThrow(() => assertLocalLiveReadEnvironment({ PRAXIS_ALLOW_LIVE_RESTAURANT_READ: "1", PRAXIS_ALLOW_BROWSER_RUN: "1", DEEPSEEK_API_KEY: "test", DEEPSEEK_MODEL: "test", GOOGLE_MAPS_API_KEY: "test", PRAXIS_BROWSER_ENGINE: "LOCAL_CHROMIUM", }))`

### 853 — local workspace rejects copied non-PostgreSQL URLs before migrations

**KEEP_DISTINCT_CONTRACT**

- default / local workspace rejects copied non-PostgreSQL URLs before migrations / 0.088 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.throws( () => localPostgresConnectionString({ DATABASE_URL: "https://api.example.test" }), /must use postgresql/i, )`
- `assert.equal( localPostgresConnectionString({ DATABASE_URL: "postgresql://localhost:55432/praxis_web" }), "postgresql://localhost:55432/praxis_web", )`

### 864 — W01 restores a conversation, case and task after server restart

**KEEP_DISTINCT_CONTRACT**

- default / W01 restores a conversation, case and task after server restart / 514.313 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(created.case.phase, "AWAITING_AUTHORIZATION")`
- `assert.equal(created.restaurant.candidates.length, 3)`
- `assert.equal(restored.response.status, 200)`

### 891 — W02 resumes the same case from a second mobile-web session

**KEEP_DISTINCT_CONTRACT**

- default / W02 resumes the same case from a second mobile-web session / 502.955 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(resumed.response.status, 200)`
- `assert.notEqual(mobileCookie, desktopCookie)`
- `assert.deepEqual(summaries.map((item) => item.caseId), [created.case.caseId])`

### 918 — W03 denies cross-user case and event-stream access

**KEEP_PROTECTED**

- default / W03 denies cross-user case and event-stream access / 496.019 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(caseResponse.status, 404)`
- `assert.equal(streamResponse.status, 404)`

保护：AUTHORIZATION_IDEMPOTENCY_OR_OUTCOME

### 941 — W04 SSE reconnect sends an idempotent Agent-loop snapshot

**KEEP_PROTECTED**

- default / W04 SSE reconnect sends an idempotent Agent-loop snapshot / 508.449 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(latest.case.phase, "AWAITING_AUTHORIZATION")`
- `assert.equal(latest.activities.filter((item) => item.type === "CANDIDATE_SELECTED").length, 1)`
- `assert.equal(replay.case.taskVersion, first.case.taskVersion)`

保护：AUTHORIZATION_IDEMPOTENCY_OR_OUTCOME

### 974 — W06 Live read creates a recoverable active Case and cancellation reaches the in-flight provider

**KEEP_DISTINCT_CONTRACT**

- default / W06 Live read creates a recoverable active Case and cancellation reaches the in-flight provider / 496.752 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(created.case.status, "ACTIVE")`
- `assert.equal(created.case.phase, "UNDERSTANDING")`
- `assert.equal(stopped.response.status, 200)`

### 1002 — W08 ordinary Web cancellation writes an immutable execution artifact and independent evaluation

**KEEP_DISTINCT_CONTRACT**

- default / W08 ordinary Web cancellation writes an immutable execution artifact and independent evaluation / 466.645 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(stopped.response.status, 200)`
- `assert.equal(result.status, "CANCELLED")`
- `assert.equal(semantic.party_size_source, "EXPLICIT")`

### 1055 — W10 ordinary Web persists a semantic-model failure as a failed case and artifact

**KEEP_DISTINCT_CONTRACT**

- default / W10 ordinary Web persists a semantic-model failure as a failed case and artifact / 461.881 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(result.response.status, 201, String(result.payload.error))`
- `assert.equal(view.case.phase, "FAILED")`
- `assert.equal(artifact.status, "FAILED")`

### 1091 — W11 ordinary Web artifact retains shared Google request limits and category totals

**KEEP_DISTINCT_CONTRACT**

- default / W11 ordinary Web artifact retains shared Google request limits and category totals / 471.673 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.deepEqual(artifact.resourceUsage?.googleRequests, { limit: 50, total: 4, namedPlaceResolution: 1, discovery: 2, placeDetails: 1, reverseAddressObservation: 0, })`
- `assert.ok((artifact.resourceUsage?.modelCallsStarted ?? 0) > 0, "the artifact records the model calls made under its live per-run scope")`
- `assert.ok((artifact.resourceUsage?.elapsedMs ?? 0) >= 0, "resource elapsed time is taken from the same completed per-run scope")`

### 1141 — W13 ordinary Web presents a qualified short batch using its shared model-call reserve

**KEEP_DISTINCT_CONTRACT**

- default / W13 ordinary Web presents a qualified short batch using its shared model-call reserve / 472.924 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(state.phase, "PRESENT_RESULTS")`
- `assert.equal(calls.facts, 0, "the shared reserve blocks further fact reads while a qualified result exists")`
- `assert.equal(calls.model, 3, "semantic and both Agent decisions share the six-call scope")`

### 1181 — W12 F6 Live Persistent run inherits the semantic-started deadline and its twenty-second reserve

**KEEP_PROTECTED**

- default / W12 F6 Live Persistent run inherits the semantic-started deadline and its twenty-second reserve / 473.408 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(state.phase, "NO_VERIFIED_RESULT", JSON.stringify({failure:state.failure,window:state.readEndWindow,trajectories:artifact.trajectories}))`
- `assert.equal(window.reason, "DELIVERY_TIME")`
- `assert.equal(restaurant.aborted, false, "the admitted read remains valid until the original reserve boundary")`

保护：EXPLICIT_HISTORICAL_REGRESSION

### 1232 — W09 HTTP/SSE publishes background progress and accepts an edit based on the last user-visible version

**KEEP_DISTINCT_CONTRACT**

- default / W09 HTTP/SSE publishes background progress and accepts an edit based on the last user-visible version / 484.647 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(progressed.case.phase, "SEARCHING")`
- `assert.equal(edited.response.status, 200, String(edited.payload.error))`
- `assert.equal(created.case.taskVersion, 1)`

### 1276 — T1 Web shared assembly keeps ownership during semantic parsing and completes after a concurrent list (packs=Google)

**KEEP_DISTINCT_CONTRACT**

- default / T1 Web shared assembly keeps ownership during semantic parsing and completes after a concurrent list (packs=Google) / 473.076 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(listed.response.status, 200)`
- `assert.equal(summaries[0]!.phase, "UNDERSTANDING", "a current-process semantic call must not become EXECUTION_FAILURE")`
- `assert.equal(googleCalls, 0, "list cannot start discovery or finish a pending semantic call")`

### 1357 — W07 a Live Case left without an in-process owner is ended explicitly after restart

**KEEP_DISTINCT_CONTRACT**

- default / W07 a Live Case left without an in-process owner is ended explicitly after restart / 463.494 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(restored.response.status, 200)`
- `assert.equal(view.case.phase, "FAILED")`
- `assert.match(view.activities.at(-1)?.display.detail ?? "", /not resumed automatically/i)`

### 1380 — W05 conversation claims cannot change authoritative task state or outcome

**KEEP_DISTINCT_CONTRACT**

- default / W05 conversation claims cannot change authoritative task state or outcome / 468.900 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(view.case.phase, "AWAITING_AUTHORIZATION")`
- `assert.equal(view.artifacts.some((item) => item.type === "OUTCOME"), false)`
- `assert.equal(view.case.taskVersion, created.case.taskVersion)`

### 1417 — Web location is bound once to the authenticated nearby case and is rejected for a named area

**KEEP_DISTINCT_CONTRACT**

- default / Web location is bound once to the authenticated nearby case and is rejected for a named area / 498.195 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(createdResult.response.status, 201)`
- `assert.equal(located.response.status, 200, String(located.payload.error))`
- `assert.equal(view.restaurant.intentDraft?.area?.coordinates?.source, "DEVICE")`

### 1438 — Web nearby fallback accepts a manually supplied place through the normal message path

**KEEP_DISTINCT_CONTRACT**

- default / Web nearby fallback accepts a manually supplied place through the normal message path / 473.726 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(continued.response.status, 200, String(continued.payload.error))`
- `assert.equal(view.restaurant.intentDraft?.area?.query, "Higashi-Ginza")`
- `assert.equal(view.restaurant.intentDraft?.area?.coordinates, undefined)`

### 1454 — Stage 2B continues an incomplete request and enforces optimistic concurrency

**KEEP_DISTINCT_CONTRACT**

- default / Stage 2B continues an incomplete request and enforces optimistic concurrency / 475.115 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(incomplete.case.phase, "NEEDS_INPUT")`
- `assert.equal(stale.response.status, 409)`
- `assert.equal(revised.response.status, 200)`

### 1561 — G1 displayed restaurant follow-up answers through the persistent HTTP entry

**KEEP_DISTINCT_CONTRACT**

- default / G1 displayed restaurant follow-up answers through the persistent HTTP entry / 497.738 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(view.case.phase,"PRESENT_RESULTS")`
- `assert.equal(f.calls.pages,1)`
- `assert.equal(reply.response.status,200,"A user must be able to ask a question about a displayed restaurant")`

### 1609 — G1 persistent follow-up preserves NOT_STATED, sensitivity and quote rejection

**KEEP_DISTINCT_CONTRACT**

- default / G1 persistent follow-up preserves NOT_STATED, sensitivity and quote rejection / 530.546 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(reply.response.status,200)`
- `assert.equal(result.status,"NOT_STATED")`
- `assert.equal(result.status,"ANSWERED")`

### 1637 — "G1 independent question answers "+scenario

**KEEP_DISTINCT_CONTRACT**

- default / G1 independent question answers after 520 seconds / 469.045 ms / pass
- default / G1 independent question answers after 49 original calls / 469.729 ms / pass
- default / G1 independent question answers after process restart / 472.024 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(f.budget.usage(view.case.caseId)?.calls,49)`
- `assert.equal(reply.response.status,200)`
- `assert.equal(after.restaurant.pageQuestion!.result!.status,"ANSWERED")`

### 1669 — "G1 independent question stops at its own "+limit+" and the next question still answers"

**KEEP_DISTINCT_CONTRACT**

- default / G1 independent question stops at its own 60 seconds and the next question still answers / 491.332 ms / pass
- default / G1 independent question stops at its own 3 model calls and the next question still answers / 474.307 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(reply.response.status,200)`
- `assert.ok(result.status==="UNVERIFIED"&&result.reason==="BUDGET_EXHAUSTED","question must stop at its own limit")`
- `assert.equal(f.calls.model-calls,3,"fourth transport call must never start")`

### 1696 — G1 twenty-question conversation limit survives restart and duplicate delivery

**KEEP_DISTINCT_CONTRACT**

- default / G1 twenty-question conversation limit survives restart and duplicate delivery / 656.762 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(reply.response.status,200)`
- `assert.equal(view.restaurant.pageQuestion!.result!.status,"ANSWERED")`
- `assert.equal(duplicate.response.status,200)`

### 1720 — G1 async cancellation and newer question discard a late model answer

**KEEP_DISTINCT_CONTRACT**

- default / G1 async cancellation and newer question discard a late model answer / 497.834 ms / pass

检错依据（精确原断言；全文见 source card）：

- `assert.equal(first.response.status,200)`
- `assert.equal(next.response.status,200)`
- `assert.equal(view.restaurant.pageQuestion!.result?.status,"ANSWERED")`

