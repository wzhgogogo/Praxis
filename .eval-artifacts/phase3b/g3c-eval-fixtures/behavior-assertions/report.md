# G3c 第五文件：用当前证据行为检查替换旧文案断言

- 状态：draft / not integrated；已完成本批离线验证，等待复核，不合 main。已暴露开发 fixture，不是 Clean Holdout 或 Live。
- 时间：2026-10-30T06:49:35.665912+01:00，维也纳 CET（UTC+1）。
- 分支：`codex/chore-phase3b-g3c-eval-fixtures`。
- 本轮基线：`7fd73d2bbe2c881f012bb017e3a8fe7316946dcf`；源码首次冻结 `69429d23`；控制脚本 TAP 格式修订后，最终红绿与全矩阵冻结提交 `0b4e3de785a1aa31fe45a01fc37212a65c550236`。两个提交的 fixture 源码字节相同。
- 原四文件同步及原 13 项红灯关闭记录：[resumed-sync/report.md](../resumed-sync/report.md)。本批补齐第五文件的 2 例，完整 Chromium 从历史 178/180 转为 180/180。

## 用户批准的替换

**用户 2026-10-30 批准，理由见上**：Agent context 已经从当前事实证据得到 `observedFacts.verifiedHardCriteria`；`matchReasons` 只追加、不删除，把判断再写成理由会在后续调查替代旧事实时残留过时结论。因此不修改产品重新生成该字符串。

原断言（AVAILABLE / UNAVAILABLE 共用循环）：

```ts
assert.ok(state.candidates.find((candidate) => candidate.restaurant.id === candidateId)?.matchReasons
  .includes("Verified HARD criterion from source: omakase"));
```

新行为检查位于同一位置（不要求、不补造 matchReasons）：

1. `restaurantCurrentFactEvidence` 中至少有一个本次接纳、核实 `omakase` 的 `MODEL_JUDGMENT`。每个判断的所有引用均非空，指向当前同店的 Tabelog 原文证据；引用与判断都在本次实际 `CANDIDATE_FACTS_CHECKED` 的 evidence/check 中。请求 `readRunId` 核对到本轮运行与调查修订。
2. 原文证据核对精确页面 URL、同店 HIGH 身份、同页 sourceEntityId；再用本次 Source2 请求中的 documentId/candidateId/identityEvidenceId 绑定，核对完整原句 `Omakase course`、原始 statement ID、首尾完整编号范围、COURSE 与空 priceStatementId。模型没有提供数字、URL、身份或库存。
3. 捕获模型实际收到的最后一次 `restaurant_agent_decide` context，断言该候选 `observedFacts.verifiedHardCriteria` 含 `omakase`；这里使用真实 model request，不以另行构造的预期 context 替代。
4. 仅 AVAILABLE：已展示的 omakase 条件状态为 MET，非空条件引用全部包含在展示 `evidenceIds` 中。
5. 新增负向控制（复用 AVAILABLE 的同一候选，不增加 test）：在克隆状态上，经真实 `CANDIDATE_FACTS_REFRESH_REQUESTED`、`CANDIDATE_FACTS_CHECKED` reducer 事件，接纳一次后续同源 UNKNOWN 事实调查。该**本地构造**只完成身份读取、不接纳事实判断，不是网站回放。旧判断仍保留在历史 readEvidence；当前事实不再含旧判断或旧“已核实”，生产投影的下一次 Agent context 也不再含 omakase。实际 Chromium 运行、原状态和 trace 不被修改。

唯一源码改动是 `src/harness/browser/browser-read-request-binding.test.ts`。为核对上述行为，补充 Source2 元数据捕获、实际 Agent context 捕获和导入；Agent 动作选择规则、原始 fixture 页面均不变。原四个获批评测文件、产品、Gold、评分器、独立期望、生产预算/截止时间、Prompt/Schema/State 均不变；不需要版本递增。全局 STATUS/DEVLOG/TEST-LOG/月度索引及共享 budget 不变，延续本切片已确认的限定文件/产物范围，在本报告记录状态、开发、测试和月度索引。

## 有效红绿与构造边界

[run-controls.py](run-controls.py)、[inputs-sha256.json](inputs-sha256.json) 在执行前提交。输入 SHA 共 706 项；故障只在不含 .env 和评测答案目录的稀疏本地克隆里改测试端口/消费者，不改任何产品文件。

| 控制 | 结果 | 独立失败依据 |
| --- | --- | --- |
| 不接纳 FactJudgment：fact port 丢弃 MODEL_JUDGMENT 及其 check 引用，保留 COMPLETED、原身份与 Source2 原文 | 0/2，预期红灯 | 两例均精确失败于“current facts must contain an accepted MODEL_JUDGMENT verifying omakase”；此前原 COMPLETED / 源事实断言已通过，避免被无关失败遮挡 |
| 过时消费者：后续 UNKNOWN 调查之后仍消费替代前的 current-facts 视图 | 1/2，预期红灯 | AVAILABLE 精确失败于“a replacement investigation must exclude every old accepted judgment from current facts”；UNAVAILABLE 原结论仍通过 |
| 完全不注入故障的同一冻结源码 | 2/2，绿灯 | 当前判断、原文引用、实际 context、展示、替代控制及全部原后续断言均通过 |

补丁、原始压缩日志与回执：[controls.json](controls.json)、[unaccepted-judgment-red.patch](unaccepted-judgment-red.patch)、[stale-consumer-red.patch](stale-consumer-red.patch)。每次前后 git status 均为空；706 项输入 SHA 未变。

首次 `69429d23` 控制运行也已命中两例目标红灯，但 Node 默认 spec 日志使控制脚本的 TAP 统计解析断言失败。该尝试不是完整控制矩阵 PASS，原样保留为 [first-attempt-controls.json](first-attempt-controls.json) 和 [原始日志](first-attempt-unaccepted-judgment-red.log.gz)。只给控制命令显式加 `--test-reporter=tap` 并重新冻结；不改 fixture 或期望后，取得上述完整红绿。

## 实际行为与原断言保留

[observed-outcomes.json](observed-outcomes.json) 逐字提取自无故障测试日志：

- AVAILABLE：fixture 模型调用14次；`SEARCH_RESTAURANTS → CHECK_AVAILABILITY → INVESTIGATE_CANDIDATE_FACTS → PRESENT_RESULTS`；当前判断与实际 context 均有 omakase；展示 MET，引用包含当前判断和原文。原独立评价断言到达并通过 `taskProducedQualifiedResult=YES`。本地后续 UNKNOWN 控制保留历史判断1条，当前判断0条，context 已核实列表为空。
- UNAVAILABLE：fixture 模型调用18次；`SEARCH_RESTAURANTS → INVESTIGATE_CANDIDATE_FACTS → CHECK_AVAILABILITY → SEARCH_RESTAURANTS → SEARCH_RESTAURANTS → END_READ`；仍核实餐厅 omakase 事实，但请求窗口无合格空位，原第二来源、无展示、有界结束及21:00越界时段断言全部通过。
- 两例 Source2 各选两次同一句 `Omakase course`；来自本地构造的动态 Chromium 页面，公开菜单版式依据仍为已保存 `src/harness/browser/fixtures/restaurant-prices/ginza-sushi-sendou.html`，SHA `34e82a5f3a2e882f261bf6e42cb54e5e75d0318e6a02b32c8d6047e76074057d`。未新增页面内容、私有捷径或身份 guide 证据。

[preservation.json](preservation.json)：从原文案断言紧接着的 `assert.deepEqual(browserActions, ...)` 到文件末尾，**整段 6641 字节**与 `7fd73d2b` 一致，SHA `d0e552b63415b740d484b702bf0f897ba244db0e2adb5ee8a8925b58f4d76d97`。因此全部原 DOM、query、库存、独立评价、AVAILABLE/UNAVAILABLE 结果断言保持原字节。源码 test 数量不增不减；此前三阶段58个归档输出全部 SHA 复核未变。

## 完整验证

同一冻结提交 `0b4e3de785a1aa31fe45a01fc37212a65c550236`，五门禁和严格 G2；每项前后 `git status --porcelain` 为空、706 项输入 SHA 均未变。原始压缩日志及完整命令、环境、用时见 [gates/gates.json](gates/gates.json)。

| 检查 | 结果 | 整套耗时 |
| --- | --- | --- |
| typecheck | PASS | 0.434 s |
| arch-check | PASS | 0.221 s |
| npm-test | PASS | 28.792 s |
| build | PASS | 0.515 s |
| browser-fixture | PASS | 130.455 s |
| strict-dom-change | PASS | 24.211 s |

默认测试1231/1231；Chromium180/180（G2独占5 + 其余175）；严格G2 5/5，12页全部PASS。失败、取消、跳过、todo均为0。`git diff --check` 通过。

Mock：fixture 模型与固定 Google 传输；Chromium：本地动态页面；Replay/Live/Controlled write：NOT_RUN。新增真实模型、Google、网站、评测GET、Live调用全部0；未读取、复制或暂存 .env，未读取 G1 答案文件。共享账本无新消耗、不改已有条目。

## 停止点与索引记录

2026-10-30 CET：本切片已完成获批旧文案断言替换、两组有效红灯与绿灯、旧判断失效控制及完整矩阵。当前能力证据仅为离线组合测试，不宣称 Live 能力或 main 已集成。提交推送工作分支并通知 B，等待复核；不合 main。此前五文件同步历史由 [上轮报告](../fifth-file/report.md)、[四文件报告](../resumed-sync/report.md) 继续保留，原失败记录不改写。
