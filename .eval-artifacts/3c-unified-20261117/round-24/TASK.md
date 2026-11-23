# Round 24：Phase 3C 离线最终收口（后端 5 项 + UI/投影 6 项）

工作树：`/private/tmp/praxis-3c-unified`  
分支：`codex/feat-web-photos-unified`  
起点提交：`5bca135c88da8b3ea62dd100aed3d401dfa036a4`  
本轮目标：**离线收口 Round 22 独立复核遗留的 5 项后端问题（1 P1 + 4 P2）以及 Round 23 独立复核发现的 6 项 UI/投影问题（含多指防误翻页联动保护）。**  
签收范围仅为**离线收口验收**；不运行 Live、真实 PostgreSQL、4312，不推送远端，不合并 `main`，不把浏览器模拟计作真机软键盘或真机双指缩放验收。

---

## §0 开工预检、切片顺序与保护边界

1. **开工只读预检**：核验 `git rev-parse HEAD` 为 `5bca135c88da8b3ea62dd100aed3d401dfa036a4`、分支正确、`git status --short` 净树、本机 sparse check 通过，并保存保护面基线哈希（涵盖全部历史 `.eval-artifacts/3c-unified-20261117/round-*`、`.eval-artifacts/restaurant-web-read/`、主工作区 HEAD/status/diff、主 `.env` 哈希）。若发现非预期缺失或改动，先停止报告，不静默清理或恢复。
2. **推荐执行切片顺序**：
   - **切片 1（优先）**：先完成并定向验证 **B1–B3**（并发编辑选店条款、并发预算隔离、收藏并发不冲掉 `ANSWERED`），确认最影响用户的 P1 与并发不变量独立过关；
   - **切片 2**：推进 **B4–B5** 与 **U1–U5** 并完成定向验证；
   - **统一冻结与验收**：合并为单一冻结 SHA 后按 §3 执行完整门禁、独立脚本、视觉与归档。
3. **本轮允许改动范围**：
   - 应用层：`src/application/persistent-restaurant-agent.ts`、`src/application/run-bounded-model-gateway.ts`（确有必要时最小修改以保障并发作用域隔离）、`src/application/workspace-read-projection.ts`
   - 领域层：`src/domains/restaurant/contracts.ts`、`src/domains/restaurant/condition-states.ts`、`src/domains/restaurant/positive-hard-evidence.ts`、`src/domains/restaurant/open-ended-target.ts`、`src/domains/restaurant/read-grounding.ts`
   - Web 层：`src/web/browser/view-contracts.ts`、`src/web/browser/views.ts`、`src/web/browser/citation-groups.ts`、`src/web/browser/photos.ts`、`src/web/local-workspace-page.ts`
   - 对应自动化测试与本轮独立产物目录 `.eval-artifacts/3c-unified-20261117/round-24/`
   - 若涉及公共契约/用户流变化，按最小必要范围同步相关产品文档；不新增依赖、不引入前端框架或打包器，不新增数据库迁移。
4. **严格禁止改动**：
   - 所有历史证据目录（`round-22/`、`round-22-gemini-review-uwPIlJ/`、`round-23/`、`round-23-independent-review-2zrHVV/`、`restaurant-web-read/` 等）**只读引用，零修改**；
   - 不改 `package.json` / lockfile、数据库 schema/迁移、安全/授权边界、外部 Adapter 生产 Secret 边界。

---

## §1 后端 5 项修复（来源：Round 22 独立复核）

参考复现基线（只读）：`.eval-artifacts/3c-unified-20261117/round-22-gemini-review-uwPIlJ/REPORT.md` 及其脚本。

### B1（P1）待答期间编辑可用时段 / 提交选店消息不丢失 `selectedCandidateId` 与 B1 商业条款
- **位置**：`src/application/persistent-restaurant-agent.ts`（约 L402–438 事务边界、L608–631 待答分支，对照 L1144–1202 `applyMessageOnce`）
- **要求**：
  1. 在 `pendingQuestion && !pendingQuestion.result` 的消息分支中，补齐普通消息路径的完整用户选店链路：
     - 预先读取 `priorEvents`（保留幂等检查 `userEventId`）；
     - 语义解析得到 `SEMANTIC_PROPOSAL_COMPILED` 后，调用 `bindUserBookingSelection(interpretedEvent, beforeCancellation.domainState)`；
     - 若存在 `event.patch.partySizeSource`，补写 `partySizeSourceMessageRequestId: "user:" + input.requestId`；
     - 触发后续读取时，将 `userBookingSelectionRequest([...priorEvents, envelope])` 透传给 `runAfterUserInput`（确保 `bookingTerms?.readBookingTerms` 正常执行，不丢 `selectedCandidateId` 与取消费/信用卡等 B1 商业条款）。
  2. **并发与事务不变量（不得破坏 Round 22 已验契约）**：
     - **只有后继编辑成功提交，旧问答的取消才生效；版本冲突（如另一标签先收藏导致 HTTP 409）时事务整体回滚，原问答可继续正常答完**；
     - 事务内部保留现有 Reducer 要求的“先结算旧问答、再修订意图”顺序；**提交前不得用编辑的准备句柄覆盖原问答句柄**；
     - 若该编辑导致计划进入 `FAILED`，原已受理的 `pendingQuestion` 仍留恰好一条终态事件（并补齐与普通路径一致的 `notifyReadFinished` / `appendAssistant` 处理）；
     - 若编译后无意图变化（`!restaurantIntentPatchHasChanges(event.patch)`），不误启新读取。
- **验收**：
  - 使用仓库既有 `P1-0-8` 模型回放，在 390×844 与 1440×900 验证：标签 A 在 About 提问停在受理后 -> 标签 B 改时段 `19:00 -> 19:00–19:30` -> 刷新标签 B 并显式选回 `19:00` 打开交接页 -> 持久化的 `selectedCandidateId` 保留、Handoff 完整显示当天取消费与信用卡两条条款（与无待答对照一致）；
  - 应用入口对照：待答期间提交明确点名预约意愿，门店绑定与两条商业条款同样保留；
  - 回归原 Round 22 双标签 409 冲突（收藏先于编辑，A 正常答完）与语义失败 `FAILED` 终态测试。

### B2（P2）待答消息分支的语义解释纳入同一 `modelRunBudget` 且并发作用域隔离
- **位置**：`src/application/persistent-restaurant-agent.ts`（约 L608–631）、`src/application/run-bounded-model-gateway.ts`（按需最小修改）
- **要求**：
  1. 待答消息分支中的 `restaurantEventForMessage`（`restaurant_semantic_interpret`）与后续 `runAfterUserInput` 必须共享同一个 `modelRunBudget` 作用域与截止时间，消除 `transport calls !== budget usage.calls` 漏计；不能因待答问题仍在 `activeReads` 而绕过新编辑轮的预算上下文。
  2. **并发作用域隔离**：同一 Case 出现两个重叠编辑作用域（一个成功提交、一个因版本冲突返回 409）时，两者不得互相污染 `calls`、剩余额度、截止时间，较晚退出的 409 冲突方绝不能把已提交成功方的最终记录覆盖掉。
- **验收**：
  - **默认预算组**：对比普通路径与待答路径处理同一选店消息，真实模型传输调用次数与账本 `usage.calls` 严格相等；
  - **限额组（必须显式断言）**：建案后仅对被测编辑轮设上限，断言真实传输调用数与账本 `usage.calls` 严格相等且未超上限；
  - **并发隔离组（新增应用入口验收）**：同一计划触发两次重叠编辑（一个成功、一个 409），分别核对成功轮的调用数、剩余额度、截止时间及最终导出记录均未被 409 冲突方篡改或覆盖。

### B3（P2）仅收藏与问答完成并发写入不将 `ANSWERED` 记成 `CANCELLED`
- **位置**：`src/application/persistent-restaurant-agent.ts`（约 L454–462，参照 L402–431 行锁事务写法）
- **要求**：
  - 在 `StaleTaskVersionError` 仅 `SHORTLIST_UPDATED` 的**单次重试**白名单中加入 `"PAGE_QUESTION_COMPLETED"`；
  - 将这一次重试的**最新版本读取、中间事件检查、待答身份核对（`current.runId === envelope.trace.runId`、中间事件全部为 `SHORTLIST_UPDATED`、`current.domainState.pageQuestion` 仍为同一未结算 `requestId`/`readRunId`）与写入**放进同一个任务行锁事务（`SELECT id FROM tasks WHERE id = $1 FOR UPDATE`），消除检查后、写入前的第二个冲突窗口。
- **验收**：
  - 双标签（390×844 / 1440×900）与应用层对照：标签 A 问答已生成 `ANSWERED` 并在写库前暂停 -> 标签 B 收藏同一家店 -> 放行答案写入 -> 两者均返回 200，刷新后收藏存在，问答唯一完成事件为 `ANSWERED`；
  - **连续两次收藏变动对照（新增）**：问答写库冲突期间发生连续两次收藏/取消收藏变动，最终收藏状态准确，唯一问答结果仍为 `ANSWERED`；
  - 负对照：若中间夹杂非 `SHORTLIST_UPDATED` 事件（如用户改条件、Stop 或第二问），不重试写库。

### B4（P2）开放目标条件编辑清理（三项英文并列 + 日文地区后缀）
- **位置**：`src/domains/restaurant/open-ended-target.ts`（约 L61–75）
- **要求**：
  1. 英文 `served` 多项并列：从 `café with outdoor seating, beer and wine in Ginza` 删除 `serves beer` 胶囊时，正确移除中间/逗号分隔的 `beer` 并整理标点/连词，保留 `café`、`outdoor seating`、`wine` 与 `Ginza`，下一笔 Google `textQuery` 不再含 `beer`；保留原双项并列正对照。
  2. 日文地区后缀：将 `銀座にある寿司店`、`銀座周辺の寿司店`、`銀座付近の寿司店` 的地区从 `銀座` 改为 `渋谷` 时，移除旧地区及紧随的 `にある` / `周辺` / `付近`（含后续 `の`），下一笔 `textQuery` 不得同时发送旧地名与新地名；保留独立 `銀座の` 与复合地名 `東銀座駅` 正对照。
- **验收**：
  - 单测 + 生产 Google 适配器假传输对照 + 390/1440 浏览器胶囊操作验证；
  - 全量重跑既有 Google 21 项验收矩阵无任何回退。

### B5（P2）普通晚餐甜品店过滤不随句末标点翻转，且不吞没后续肯定需求
- **位置**：`src/domains/restaurant/read-grounding.ts`（约 L162 `usableRestaurant`）
- **要求**：
  - 修正 `targetQuery` 中否定分句掩码规则：
    - 允许终止于句末标点 `.`、`!`、`?`，不再因末尾标点翻转过滤结果；
    - 不得吞没其后的肯定需求（包括无 `and`/`but` 连接词的新肯定主句，如 `without outdoor seating I would like a dessert café in Ginza`，以及 `no parking required and looking for a dessert café in Ginza`）。
- **验收**：
  - 固定同一 `Age.3 GINZA` 门店响应与晚餐时段，普通搜索与详情复查（`inspectFacts`）双入口全部验证：
    1. `dinner in Ginza, preferably without overly sweet desserts`（无标点 / 末尾 `.` / 末尾 `!` / 末尾 `?` 四种变体）均一致过滤（普通搜索 0 家，详情 `GOOGLE_PLACE_TYPE_UNUSABLE`）；
    2. 点名 `Age.3 GINZA` 对照在各标点下均保留；
    3. 正例 **`without outdoor seating I would like a dessert café in Ginza`**、**`no parking required and looking for a dessert café in Ginza`**、**`not too sweet, but specifically looking for a dessert café in Ginza`**、**`nothing too sweet, please find a dessert café in Ginza`**、**`a dessert café in Ginza without outdoor seating`** 在普通搜索与详情复查均正确保留。

---

## §2 UI 与投影 6 项修复（来源：Round 23 独立复核 + 多指联动保护）

参考复现基线（只读）：`.eval-artifacts/3c-unified-20261117/round-23-independent-review-2zrHVV/REPORT.md` 及其产物。

### U1（P2，R4）同页不同读取时间的报价精确归属，且无 `evidenceId` 歧义时不误挂时间
- **位置**：`src/domains/restaurant/contracts.ts`、`src/domains/restaurant/condition-states.ts`、`src/domains/restaurant/positive-hard-evidence.ts`、`src/web/browser/view-contracts.ts`、`src/web/browser/views.ts`（约 L84–87）
- **要求**：
  1. 为 `RestaurantSourceFieldQuote` 增加可选字段 `evidenceId?: string`（同步到 `src/web/browser/view-contracts.ts`），在 `condition-states.ts`（价格观察、accepted quotes、weak quotes）与 `positive-hard-evidence.ts` 输出 `sources` 时写入对应来源证据的 `evidenceId`。
  2. `views.ts` 归组规则：
     - **有 `q.evidenceId` 时**：同时核对候选店（`candidateId`）、`sourceUrl` 与 `evidenceId`（归属于 `item.evidenceIds`），精确取该证据的 `observedAt`；
     - **无 `q.evidenceId` 时**（兼容已持久化、重载直返的旧 `conditionStates`，无需数据库迁移）：只有在候选店 + `sourceUrl` + `item.evidenceIds` 范围内能**唯一确定**来源读取时间时，才显示 `Checked … JST`；若存在多个不同 `observedAt` 产生歧义，**保留原文和 `Source page ↗` 链接，省略不确定的读取时间**，绝不把 17:05 的报价误挂到 17:04。

### U2（P3，R4）About 同读取组内套餐原文与重复引用去重
- **位置**：`src/web/browser/views.ts`（约 L84–101）
- **要求**：
  - 在同一 `(url, readAt)` 来源组内：
    1. `quotes` 按规范化文本去重（若同文同时有带 `label: "Observed price:"` 与无 `label` 两条，合并为单条并保留带 `label` 的一条，不再在同一框内重复渲染 `Observed price:` 或重复引文）；
    2. `values`（`about-term` `<p>`）中若某项文本规范化后已存在于同组 `quotes` 中（例如真实 Tabelog 菜单里 `claims.listedCourseDetails` 与 `COURSE_TITLE`/`COURSE_DESCRIPTION` 原文一致），跳过重复 `<p>`，仅保留一次可追溯展示；
    3. 纯结构化项（如仅有 `coursePriceYen` 拼出的 `Course ¥8,000`）与无对应原文的 `cancellationTerms`/`noShowTerms` 仍保留 `<p>` + 同组来源/时间页脚，不伪造 `blockquote`。
- **验收**：
  - 390/1440 验证同 URL 双读取时间（17:04 ¥7,000 / 17:05 ¥8,000）：两组时间严格分离，无重复 `Observed price:` 或重复报价；
  - **旧数据重载对照（新增）**：持久化结果中的 `conditionStates` 缺 `evidenceId` 且同 URL 存在 17:04 / 17:05 两次读取，重载打开 About，验证保留原文与链接且不把歧义报价误挂到 17:04；
  - 回放仓库归档真实 Tabelog 菜单（无预算 & 有预算双对照）：每段套餐原文只出现一次并保留来源与 JST 时间；仅 `coursePriceYen` 与纯类别对照维持 Round 23 合同。

### U3（P2，R3）淘汰门店外链对齐领域层非空 `provider + sourceEntityId + HIGH` 规则
- **位置**：`src/application/workspace-read-projection.ts`（约 L94–103，对照 `src/domains/restaurant/read-assessment.ts:69-70`）
- **要求**：
  - 取消仅凭 `sameOrigin` 放行无 `entityMatch` 事实的做法，并补齐 `AVAILABILITY` 分支的身份检查：
    - `ENTITY_MATCH`：要求 `entityMatch?.confidence === "HIGH"`；
    - `AVAILABILITY` / `RESTAURANT_FACT`：
      - 证据自身携带 `entityMatch?.confidence === "HIGH"` 时放行；
      - 证据无 `entityMatch`（`undefined`）时，仅当**两侧 `sourceEntityId` 均非空字符串**，且同一 `candidateId` 下存在 `provider === item.provider && sourceEntityId === item.sourceEntityId` 的 `HIGH` `ENTITY_MATCH` 才放行（禁止 `undefined === undefined` 误放行）；
      - 任何显式非 `HIGH`（`LOW`/`MEDIUM`）一律拒绝；无合格证据再回退经 `humanUrl` 过滤的 `googleWebsiteUri` / `googleMapsUri`。
- **验收**：
  - 覆盖 6 组身份对照：`highOnly`、`lowMatchOnly`、`sameOriginOtherOutlet`（拒绝 B 店链接）、`sameOriginCorrectOutlet`（保留同店菜单）、`explicitlyLowAvailability`（拒绝 LOW 可用性链接）、**`bothMissingSourceEntityId`（双方均缺 `sourceEntityId` 时拒绝借用 HIGH 身份）**，以及原 Round 23 R3 的 4 组对照。

### U4（P2 + P3，R8）恢复全屏双指缩放 + 多指防误翻页 + 桌面鼠标拖图
- **位置**：`src/web/local-workspace-page.ts`（约 L229）、`src/web/browser/photos.ts`（约 L96、L188–197）
- **要求**：
  1. CSS 将 `.detail-photo-frame, #photo-viewer` 的 `touch-action` 改为 `pan-y pinch-zoom`，恢复浏览器原生双指缩放并保持纵向滚动与单指水平滑动。
  2. `photos.ts` 用 `Set<number>` 跟踪活跃 `pointerId`：一旦活跃指针数 `> 1`，立即作废 `start` 并标记多指手势，直至所有指针全部抬起/取消前均不得触发 `movePhoto`。
  3. 在图片/手势容器上阻止浏览器原生图片拖放接管（可设 `draggable="false"` 或在非链接目标上拦截 `dragstart` `preventDefault()`），使 1440 桌面普通鼠标水平拖动 ≥40px 能正常翻页，同时保留轻点打开全屏、左右箭头按钮、键盘左右键与署名外链点击。
- **验收**：
  - 390 手机 Chromium 模拟：**先切到中间一张照片（如 `2 of 8` 或 `3 of 8`，避免边界掩盖误翻）**，在全屏对照片执行 1.8× 双指放大 -> 视觉视口实测放大（约 1.80）且**计数严格保持原值不翻页**；恢复到 1× 后，单指左右滑正常翻页；About 纵向滚动、滑图后不误开全屏、下一轻点开全屏正常；
  - 1440 桌面无触屏：真实鼠标在 About 与全屏照片上分别水平拖动 95px -> **原生拖放未接管、计数恰好前进一张（如 `1 of 8 -> 2 of 8`）、随后轻点仍有效**；箭头与署名链接仍正常。

### U5（P3，R5）问答吸烟表头去重覆盖常见带限定语状态值
- **位置**：`src/web/browser/citation-groups.ts`（约 L88–95）
- **要求**：
  - 在 `questionCitations()` 中扩展 `status()` 匹配，覆盖真实 Tabelog 常见吸烟状态及其括号限定语（至少涵盖 `Designated smoking area (...)`、`Separate(d) smoking (area) (...)`、`Non-smoking (...)`、`All seats non-smoking (...)`、`Smoking allowed/permitted (...)`、`全席禁煙（...）`、`禁煙（...）`、`分煙（...）`、`喫煙可（...）`），仍严格仅限 Q&A 入口、仅当同 `(url, readAt)` 分组内存在明确状态值时去除 `Non-smoking/smoking` / `禁煙・喫煙` 表头，绝不改答案正文，保留支付两条、不同时间分组、About 与 Handoff 对照。
- **验收**：
  - 用仓库真实页面摘录 `Non-smoking/smoking` + `Designated smoking area (heated tobacco only)`（同 URL 同读取时间）在 390 与 1440 的答复弹层和 About Q&A 历史双入口验证：表头去除，状态值与括号限定语完整保留，390 页脚单行无溢出；原 R5 全部正反对照继续通过。

---

## §3 冻结、独立输出、全量门禁与归档

1. **禁止原地执行历史复核脚本**：Round 22 与 Round 23 的历史复核脚本会按 `import.meta.url` 写回自身目录或读取同目录旧 JSON。**冻结前必须在 `.eval-artifacts/3c-unified-20261117/round-24/` 下准备本轮独立的复核运行入口与输入清单**，记录输入哈希，所有观测 JSON 与截图均输出至本轮全新的空结果子目录；**先运行本轮采集器与投影验证脚本并核对新产物全部生成，再运行断言脚本**，确保历史目录零变更且断言只读取本轮新观测值。
2. **正式回归套件并入**：B1–B5 与 U1–U5 的核心正反对照全部并入仓库正式默认单测 / Browser Fixture 门禁。
3. **单一冻结 SHA**：完成全部代码、正式测试与本轮独立验证脚本后提交冻结 commit，记录冻结 SHA 与 `src/` tree SHA；后续所有正式门禁、历史 10 路径、本轮独立验证与视觉回归均绑定此唯一冻结 SHA，运行前后净树。如任一门禁失败需改动源码或冻结输入，保留原失败日志于子目录，修正后重新提交新冻结 SHA 并**从头完整重跑**。
4. **正式五门禁（输出隔离至 `round-24/gates`）**：
   - `PRAXIS_GATES_SUBDIR=round-24/gates` 运行 `typecheck`、`arch:check`、`test`、`test:browser:fixture`（G2 / Chromium / G6 分列计数，不重复累计）、`build`；
   - 核验浏览器严格 TS（0 any / 0 环 / 无反向 import `entry`）及 `tsx` 与 `dist` 资产逐字一致。
5. **独立验收与视觉回归**：
   - 本轮 `round-24/` 下的独立验证脚本覆盖 Round 22 全部 5 项（含限额组与并发预算隔离断言、连续两次收藏变动、`without outdoor seating I would like a dessert café in Ginza` 与 `?` 标点对照）及 21 项 Google 矩阵，全部全绿；
   - 本轮 `round-24/` 下的独立 UI/投影采集与断言覆盖 Round 23 全部 6 项（含无 `evidenceId` 旧快照重载、`bothMissingSourceEntityId`、中间张 1.8× 双指缩放与 1440 鼠标拖图），全部全绿；
   - 重跑历史 10 条用户路径（`PRAXIS_REVIEW_EXPECT_SOURCE` 绑定本轮冻结 `src` tree SHA）；
   - 重跑视觉三组（`formal`、`style1`、`states`，实际加载 `round23` / `round24` 新增测试文件与正则）并目检联系表 + 关键原图（390/1440 双时间报价 About、无 ID 旧快照重载 About、真实 Tabelog 菜单 About、390 `Designated smoking area` Q&A 弹层与历史、中间张双指缩放与 1440 鼠标拖图）。
6. **归档交付**：
   - 在 `.eval-artifacts/3c-unified-20261117/round-24/` 写入 `REPORT.md`、SHA-256 清单、保护面核验（证明所有历史目录及受保护文件哈希零变化）与改动范围核验，另做最终本地归档提交（冻结后 `src/` diff 为零）；
   - 报告中显式单列未覆盖边界：**真实手机软键盘、真机双指缩放、真实 Live 来源/模型/PostgreSQL/4312 均标注 `NOT_EVALUATED`，留待随后本地 4312 桌面 + 真机走查**；
   - 所有启动的 Chromium / 回环端口 / PGlite 在 `finally` 中收尾，确认无残留进程，净树停下。