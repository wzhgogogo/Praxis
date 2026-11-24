请在 `/private/tmp/praxis-3c-unified`（分支 `codex/feat-web-photos-unified`，基线 `bb2a541ad` / 冻结代码 `6a5f78297`）执行 **Round 27 — 3C 收口修复与离线验收**。
全程严禁修改主仓 `/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing`、`.env`、历史归档目录（`round-22*`~`round-26*` / `round-25-independent-review-*` / `restaurant-web-read/`），严禁推送远端或合入 `main`。

建议按 **两个切片顺序推进**（先完结并验收 Slice A，再做 Slice B，最后统一冻结单个代码 SHA 跑全套离线门禁）。

---

## Slice A · SEM-1：通用相对天数 `relativeOffsetDays` 与错日期拦截（先独立成切片）

1. **窄范围 ADR 与版本化**：
   - 新增窄范围 ADR `docs/decisions/0052-relative-day-offset-and-date-binding.md`（扩展已接受的 `ADR-0024`，并登记到 `docs/decisions/README.md`）。
   - 升级 `RESTAURANT_SEMANTIC_PROPOSAL_PROMPT_VERSION`（并同步所有引用该常量的测试）。

2. **Schema 与全部调用方更新**：
   - `src/domains/restaurant/semantic-proposal.ts`：为 `DATE` 新增 `{ kind: "DATE"; relativeOffsetDays: number; raw: string }`（正整数 `2..365`，与 `TIME_WINDOW.relativeOffsetMinutes` 对称；保留现有 `TODAY` / `TOMORROW`，同步 `jsonSchema` 与 `valueMatchesField`）。
   - `src/domains/restaurant/semantic-interpreter.ts`：更新 Prompt 明确 `today -> TODAY`、`tomorrow -> TOMORROW`、`后天 / day after tomorrow -> relativeOffsetDays: 2`、`大后天 / 3天后 / in 3 days -> relativeOffsetDays: 3`、`N天后 / in N days -> relativeOffsetDays: N`、`一周后 / in a week -> relativeOffsetDays: 7`，禁止模型心算相对日期。
   - `src/domains/restaurant/semantic-compiler.ts`（L25）与 `src/eval/restaurant/semantic/scorer.ts`（L114）：同步更新 `semanticValueKey()`，显式处理 `"relativeOffsetDays" in value`（绝不落入 `weekday` 分支），保证 `+2` 与 `+3` 可区分且同轮冲突时按 `CONFLICT` 拒绝。
   - `src/domains/restaurant/temporal-materialization.ts`：在 `dateResolution()` 中使用东京自然日 `addTokyoDays(reference.date, value.relativeOffsetDays)` 物化日期并记录确定性 `basis`（如 `RELATIVE_OFFSET_DAYS:<N>`）。

3. **错日期拦截防线（P1 重点）**：
   - 在解释器/编译器边界，将模型产出的 `DATE` 提案与**本轮用户原文**及 `raw` 中的明确相对日期表达绑定校验（覆盖 `今天/today`、`明天/tomorrow`、`后天/day after tomorrow`、`大后天`、`N天后/in N days`、`一周后/in a week`）。
   - 当东京时间 11 月 24 日用户输入「后天晚上七点」，而模型错误输出 `{ kind: "DATE", relativeDay: "TOMORROW", raw: "后天" }` 或 `{ kind: "DATE", value: "2026-11-25", raw: "后天" }` 时，**严禁静默接受并生成 2026-11-25 发起查位**——按受控确定性规则（明确无歧义相对偏移时按信任时钟纠偏为 `relativeOffsetDays: 2 -> 2026-11-26`，或存在真正歧义/冲突时 fail-closed 要求澄清）。

4. **Slice A 必须覆盖的回归用例**：
   - 本地假模型双错误回包回归（东京 `2026-11-24` + 「后天晚上七点」）：模型返回 `TOMORROW` (`raw: "后天"`) 与模型返回 `value: "2026-11-25"` (`raw: "后天"`)，均不得编译为 `2026-11-25`。
   - 冲突与区分回归：`+2` 与 `+3` 冲突键不同；同轮同时出现冲突相对偏移时编译器拒绝；越界/负数/小数拒绝。
   - 东京自然日边界回归：跨月（如 `2026-11-30 + 2 -> 2026-12-02`）、跨年（如 `2026-12-30 + 3 -> 2027-01-02`），以及既有 `TODAY` / `TOMORROW` 保持正常。

---

## Slice B · 前端 7 项收口（UI-1 ~ UI-7）

### UI-1 · Q&A `#asked-pending` 内 `Stop` 排版
- `src/web/local-workspace-page.ts`：将 `#asked-pending` 的 `Checking the page…` 与 `#question-stop` 放同一行左右两端对齐；去掉 `#question-stop` 的 `.quiet` 灰底盒模型（消除与 `.asked-item` 同色 `#F5F6F9` 融合造成的悬浮缩进），采用与主进度条 `#stop` 一致的极简下划线样式，保留可点热区。

### UI-2 · 蓝字收敛与 `Confirmed` 定色（B 方案，不加小胶囊）
- `src/web/local-workspace-page.ts`（L219、L232）：
  - `#candidate-panel #details-button`（`About ›`）恢复 `#15172B`；
  - `.citation-footer a` 与 `.about-commercial a`（`Tabelog ↗` / 官网外链等）恢复 `#5F6275`（保留下划线与 `↗`）；
  - `.condition-status.confirmed` 定死为纯文字 **`#364B8A`**（`rgb(54, 75, 138)`，`font-weight: 500`，不加背景胶囊）；
  - 保留 `#3D5AFE` 点缀：引文左 2px 竖线、主按钮 `Book`、执行中脉冲竖杠、已收藏书签填充/描边、选中时间片淡蓝底及 `#handoff-recommended`。
- 同步更新 `docs/product/VISUAL-DIRECTION.md`、`src/harness/browser/web-workspace-round25.test.ts`（L50–54）与 `src/harness/browser/web-workspace-round6.test.ts`（L85）中的精确颜色断言。

### UI-3 · 纯事实推荐隐藏 `Refresh details`
- 说明：纯推荐的 `Refresh details` 当前触发 `CANDIDATE_FACTS_REFRESH_REQUESTED`（重查已展示门店事实，不重新搜店）。按产品决定，仅在有空位查位能力时保留 `Refresh availability`，纯事实推荐不再展示 `Refresh details`。
- `src/web/browser/views.ts`（L75–76）：`show('refresh', requireView().case.phase === 'PRESENT_RESULTS' && refreshSlots)`。
- 验收与测试：更新 `src/harness/browser/web-workspace-round6.test.ts`（L61），分别验证 ① 纯事实推荐隐藏 `#refresh`、② 推荐但已有可用时段仍显示 `Refresh availability`、③ 正式 `AVAILABILITY` 查位仍显示 `Refresh availability` 并可刷新。若 Round 27 复用走查脚本，仅在 `round-27/` 新副本中移除纯推荐点 `Refresh details` 的步骤（严禁改动 `round-25/` 历史脚本）。

### UI-4 · `Source` 展开无漂移 & 去移动端点击蓝条
- `src/web/local-workspace-page.ts`（L59、L227）：去掉 `details[open]` 的 `padding-top` 位移（间距放内部 `.citation-group`），并给 `summary` 增加 `-webkit-tap-highlight-color: transparent`。
- 几何验收（弹层与问答历史双测）：
  - 在 **问答历史（`#details #asked-history`）** 中验证点击展开前后 `summary.getBoundingClientRect().top` 绝对坐标差为 `0`；
  - 在 **问答弹层（`#answer-sheet`，贴底 `bottom: 0`）** 中验证展开后无 `padding-top` 内部跳动，并实测弹层与 `summary` 的实际屏幕坐标变化（若需保持 `summary` 屏幕坐标或相对弹层顶边 `summary.top - sheet.top` 零漂移，明确断言实测结果并附截图目检）。

### UI-5 · 运行/换批/重试中隐藏旧 `#empty-state`（对齐有效快照）
- `src/web/browser/views.ts`、`src/web/browser/entry.ts`（L162、L211–222）、`src/web/browser/transport.ts`（L86–104）：
  - `renderReadState()` 改用与 `renderProgress()` 一致的有效快照（`state.deferredView?.view ?? state.view`）；
  - 为 `Find more`（`findMore()`）与 `Try again`（`refreshCase()`）等重搜请求建立明确的进行中状态（不依赖 `state.sending`）；当有效快照处于 `progress.active` / `UNDERSTANDING` / `SEARCHING`，或存在 `state.sending` / `state.preview` / 进行中重搜请求时，隐藏 `#empty-state`。
- 验收回归：必须覆盖 ① **延迟 HTTP**（请求在途立即隐藏旧空卡）、② **SSE 先到写入 `deferredView`**（进度条进运行态同时空卡不残留）、③ **重试/换批失败后** `#empty-state` 与操作按钮（`#empty-more`、`#empty-retry`、`#empty-adjust`）完整恢复可用。

### UI-6 · 移动端聚焦输入框不遮 `Stop` & 胶囊编辑不遮盖同行
- **不遮 `Stop`**：在 `src/web/local-workspace-page.ts`（L40、L230）与 `src/web/browser/composer.ts`（L6–20）中，移动端 `body.composer-focused` 收紧 `#progress:not(.has-card)` 顶距，并将活跃的 `#progress` / `#stop` 纳入视口避让滚动。
- **移动端胶囊编辑满宽流式布局**：在 `src/web/local-workspace-page.ts`（L71–77、L233）与 `src/web/browser/entry.ts`（L51–65）中，桌面端保持既有行内覆层；移动端（`@media(max-width:959px)`）**不写入旧胶囊的行内固定宽高（`anchor.style.width/height`）也不套桌面 `left` 覆层定位**，改为流式独占整行（`flex: 1 1 100%; width: 100%; position: static`），输入框 `flex: 1; min-width: 0`（保留 `font-size: 16px`），右侧操作按钮 `flex: none`。
- 390px 回归验收：
  - 模拟软键盘缩小 `visualViewport` + `composer-focused`：断言 `#stop` 完整落在可视区内且底边严格高于 `#workspace-composer` 顶边，**并实际点击 `#stop` 验证触发 `DELETE .../run` 返回 `200`**；
  - 分别测 **双时段输入（`kind === 'time'`）** 与 **带删除键的可删文本条件（`removable === true`）**：断言 `.condition-editor` 不与相邻条件胶囊重叠、所有输入框及 `✓ / × / 删除` 按钮完整在 390px 视口内且可点击。

### UI-7 · About 页 `Categories:` 仅对实际渲染的引文正文去重
- `src/web/browser/views.ts`（L80–103）：先算出 `groups` 中**最终实际渲染为 `<blockquote>` 的引文正文集合**（不包含已被 Round 25 折叠成纯页脚的同文引文），仅当 `Categories:` 汇总文本标准化后与某条实际渲染的 `CATEGORY` 引文 `<blockquote>` 完全一致（且没有额外 Google 类别补充）时，省略上面冗余的 `Categories:` 行。
- 验收回归必须包含三组对照：
  1. `Categories:` 与下方实际渲染的唯一 `CATEGORY` 引文同文 → 省略 `Categories:` 行，保留引文卡；
  2. 存在 Google 额外类别（比下方引文更全）→ 保留 `Categories:` 行；
  3. **反例**：原始 `CATEGORY` 文本与 `Categories:` 相同，但该引文已被折叠成纯来源页脚（无渲染 `<blockquote>`）→ **必须保留 `Categories:` 行**，确保类别文字至少展示一处。

---

## 三、冻结验收、证据归档与汇报边界

1. **单一冻结提交**：Slice A + Slice B 完成后提交冻结代码 SHA（`<R27_FROZEN_SHA>`），在净树、**不加载 `.env`** 下执行全套门禁并将日志归档到 `.eval-artifacts/3c-unified-20261117/round-27/`：
   - `npm run typecheck`
   - `npm run arch:check`
   - `npm run build`
   - `npm test`
   - `npm run test:browser:fixture`（G2 + Chromium + G6 assembly）
   - `PRAXIS_CDP_DIST=1 node --import tsx --test src/harness/browser/cloudflare-cdp-isolation.test.ts`
   - 19 JS + HTML 构建产物一致性校验（`round-27/build-assets.json`）
   - 历史与 `round-25` / `round-26` 哈希保护校验（`round-27/protection-verification.json`，已知 137 份早期未跟踪原件缺失如实保留）
   - 关键视觉截图目检（390px & 1440px：Q&A `Stop`、新配色 `Confirmed #364B8A` / 中灰外链 / 深墨 `About ›`、`Source` 展开前后、运行中隐藏旧空卡、390px 键盘态 `Stop`、390px 双时段与可删胶囊编辑、`Categories:` 同文省略与折叠反例）。
2. **账本与提交**：生成 `round-27/REPORT.md`、`gates/manifest.json`、`artifact-sha256.json`，同步追加 `docs/STATUS.md`、`docs/history/DEVLOG.md`、`docs/history/TEST-LOG.md`、`docs/history/monthly/2026-11-index.md`，提交 `docs: archive Round 27 offline closure`，验证 `<R27_FROZEN_SHA>..HEAD -- src/` 为空且工作树干净。
3. **如实报告边界**：明确区分离线门禁结果与 `NOT_EVALUATED`（Live、真实 PG、远端 Cloudflare CDP、真机 iPhone/Android 手感、4312 重启走查），不启动 4312、不推送、不合入 `main`。