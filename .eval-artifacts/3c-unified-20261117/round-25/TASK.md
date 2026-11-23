# Round 25：Phase 3C 完整质量收口（CDP 故障隔离 + 后端 5 项 + 真机交互 3 项 + UI 精简与主题蓝）

工作树：`/private/tmp/praxis-3c-unified`  
分支：`codex/feat-web-photos-unified`  
起点提交：`287879cbe6d46b60e11909a145ffab1abfbd2ca8`  
本轮目标：**高质量离线收口全部已知后端与 UI/交互问题**，包括 4312 实测抓到的远程 CDP 崩溃 P1、Round 24 独立复核登记的 5 项后端缺陷、iOS 软键盘与相册恢复 3 项，以及用户拍板的 4 项 UI 展示精简与 `#3D5AFE` 主题蓝点缀。  
不运行 Live、真实 PostgreSQL、4312，不推送远端，不合并 `main`；远程真实 CDP、真机 iOS/Android 软键盘与真机缩放单列 `NOT_EVALUATED`，留待本轮完成后拉 `4312` 实机验收。

---

## §0 开工预检、切片顺序与保护边界

1. **开工只读预检**：核验 `git rev-parse HEAD` 为 `287879cbe6d46b60e11909a145ffab1abfbd2ca8`、分支正确、`git status --short` 净树、本机 sparse check 通过，保存保护面基线哈希（全部历史 `.eval-artifacts/3c-unified-20261117/round-*`、`.eval-artifacts/restaurant-web-read/`、主工作区 HEAD/status/diff、主 `.env` 哈希）。若有非预期缺失或改动，先停止报告。
2. **执行切片顺序**：
   - **切片 1（优先独立闭环）**：先完成并验证 **C1（真实 Playwright + 受控本地 CDP 故障隔离）**，确认 `tsx` 与 `dist` 路径均有效过关；
   - **切片 2**：完成并定向验证 **R1–R5（Round 24 后端 5 项）**；
   - **切片 3**：完成并定向验证 **M1–M3（软键盘、照片手势与全链路恢复、`Reconnecting…` 居中）** 与 **V1–V4（单条件引文精简、站名+Checked+日期、同行证明表头合并、主题蓝点缀）**；
   - **统一冻结与验收**：合并为单一冻结 SHA 后按 §4 执行全量五门禁、独立脚本、视觉回归与归档。
3. **本轮允许改动范围**：
   - 浏览器运行与文档：`src/infrastructure/browser/cloudflare-browser-run.ts`（及为安全隔离 CDP 异常所需的最小辅助模块/worker 入口）、`docs/integrations/CAPABILITY-MATRIX.md`
   - 应用与服务层：`src/application/persistent-restaurant-agent.ts`、`src/application/run-bounded-model-gateway.ts`、`src/server/local-web-server.ts`（仅限相册代理状态码区分及必要的启动入口配合）
   - 领域与事实层：`src/domains/restaurant/contracts.ts`（仅当 V3 需要携带可选同行证明字段时）、`src/domains/restaurant/condition-states.ts`、`src/domains/restaurant/open-ended-target.ts`、`src/domains/restaurant/read-grounding.ts`、`src/integrations/restaurant-facts/model-page-question.ts`（若 V3 由后端提供原始同行结构证明）
   - 照片代理层：`src/integrations/restaurant-photos/display-photos.ts`、`src/integrations/restaurant-photos/website-photos.ts`
   - Web 层：`src/web/local-workspace-page.ts`、`src/web/browser/composer.ts`、`src/web/browser/photos.ts`、`src/web/browser/transport.ts`、`src/web/browser/format.ts`、`src/web/browser/citations.ts`、`src/web/browser/citation-groups.ts`、`src/web/browser/views.ts`、`src/web/browser/view-contracts.ts`
   - 对应自动化测试、`docs/product/VISUAL-DIRECTION.md`、`docs/product/USER-FLOWS.md`（按变更同步）及 `.eval-artifacts/3c-unified-20261117/round-25/`
   - 不新增外部依赖、不引入前端框架或打包器、不改数据库迁移、不触碰所有历史证据目录（`round-22*`、`round-23*`、`round-24*`、`restaurant-web-read/` 只读零修改）。

---

## §1 切片 1：远程 CDP 故障隔离（P1）

### C1（P1，4312 实测新发）远程 CDP `Duplicate target` 故障隔离与有界恢复
- **实测崩溃栈**：`Error: Duplicate target <id>` at `_CRBrowser._onAttachedToTarget` (`node_modules/playwright-core/lib/coreBundle.js:38185:9` -> `_CRSession.emit` -> `process.processImmediate`)。
- **要求**：
  1. 隔离远程 Playwright CDP 会话的内部协议断言崩溃（如重复 `Target.attachedToTarget`），覆盖**连接/会话初始化期间**与**页面已经开始读取期间**两条故障路径；故障必须有界退出并转化为该次查页的明确失败（`BrowserRuntimeError("BROWSER_RUNTIME_FAILED", ...)`，或初始化期在 `AUTO` 模式下按既有规则安全回退到 `CHROMIUM`）。
  2. **宿主进程必须保留正常的未捕获异常行为**（禁止在宿主进程里挂宽泛的 `process.on("uncaughtException")` 吞掉无关程序错误）；优先采用干净的边界隔离（如子进程/worker 隔离远程 Playwright CDP 会话，确保受损会话崩退时只终止该会话、不波及并行会话与宿主服务）。
  3. 同步更新 `docs/integrations/CAPABILITY-MATRIX.md` 及对应 Harness 场景（落实外部浏览器 Adapter 改动规则）。
- **验收**：
  - 使用**已安装的真实 `playwright-core` + 生产 `CloudflareBrowserRun` 会话入口**对接本地受控 CDP WebSocket 测试端（不得只用 `setImmediate` 假抛异常冒充），分别复现并验收：
    1. **初始化期间**触发 `Duplicate target`：有界失败或 `AUTO` 安全回退，不崩宿主；
    2. **读页期间**触发 `Duplicate target`：故障会话有界退出、返回明确失败结果，**并行中的另一健康会话不受影响**，且**下一次实际读页请求成功完成**；
    3. 若采用子进程/worker 隔离，**`tsx` 与 `dist`（`npm run build`）两个服务启动入口均须实际验证通过**，并补充正反对照证明宿主无关未捕获异常仍按正常机制处理。

---

## §2 切片 2：Round 24 独立复核 5 项后端收清

参考复现基线（只读）：`.eval-artifacts/3c-unified-20261117/round-24-independent-review-Vt39Rl/REPORT.md`

### R1（P2）待答编辑提交到工作器启动的读轮句柄无缝交接（含旧 worker 收尾窗口）
- **位置**：`src/application/persistent-restaurant-agent.ts`（约 L433、L984 及待答提交路径）
- **要求**：
  - 从待答编辑成功提交起（含**旧 About 问答正在执行、编辑已提交、旧 worker 正在收尾**，以及**正在写 `messages`**两个窗口），当前读轮持续可识别、可取消；
  - 新版本后继编辑不得收到同版本 `409 expected N, actual N`；用新版本发出的 Stop 必须取消新读轮（停止后零搜店/零查位）；旧版本 Stop 不得影响新读轮；迟到的旧 worker 或旧续体绝不得覆盖新句柄所有权。
- **验收**：双编辑探针 + 准备期 Stop 探针覆盖**写消息窗口**与**旧 worker 收尾窗口**两条边界，全通过。

### R2（P2）409 冲突期间与冲突后均保持最近已提交读轮的预算账本
- **位置**：`src/application/run-bounded-model-gateway.ts`、`src/application/persistent-restaurant-agent.ts`（约 L1150）
- **要求**：
  - 最近成功读轮已结束并记录为 N 次（如 4 次）后，当一个候选编辑与不调用模型的收藏竞争时：
    - **在编辑等待提交期间**以及**编辑因 409 退出之后**，读取 `usage()` 与最终导出都必须持续保留原已提交读轮的用量（如 4），不得被未提交/被拒请求覆盖；被拒请求的调用可记在自身独立账本中；
  - **不得破坏非语义读轮入口**：现有刷新（refresh）、换批（another batch）、定位（location）等直接启动读轮的入口，必须仍能正常发布自己的用量和截止时间。
- **验收**：
  - 保留原“双编辑竞争”测试；
  - 新增“上一成功读轮已结束 + 编辑输给收藏 409”应用入口测试，**同时断言编辑等待提交时与 409 之后两次导出均为原读轮用量**；
  - 回归验证刷新、换批、定位三个入口均能正常发布用量与截止时间。

### R3（P2）删 `serves beer` 补全词边界与首/中/末位标点整理
- **位置**：`src/domains/restaurant/open-ended-target.ts`
- **要求**：
  - 删除 `serves beer` 时，仅匹配独立饮品项，严禁破坏连字符复合词或场地短语（`beer-battered fish`、`beer garden access` 保持完整），且正确清理删除首项、中间项、末项后的残留逗号与多余空格（例如删除 `gastropub with beer, outdoor seating and wine` 首项 `beer` 后不得残留 `, outdoor seating`）。
- **验收**：通过生产 Google 适配器假传输核对真实 `textQuery`，覆盖**删首项、删中间项、删末项**（均保留 `outdoor seating` 与 `wine` 且无畸形标点）以及 `SOFT`/`HARD` 下的 `beer-battered fish`、`beer garden access`，并回归全部 21 项 Google 原矩阵。

### R4（P2）晚餐轻食过滤补齐同义措辞与 `not specifically` 成对对照
- **位置**：`src/domains/restaurant/read-grounding.ts`
- **要求**：
  - 同一 `Age.3 GINZA` 晚餐 fixture 与 SOFT 负向条件下，普通搜索与详情复查（`inspectFacts`）双入口全部一致通过：
    - 过滤（0 家）：`please avoid dessert cafés`、`please avoid e.g. dessert cafés`、**`dinner in Ginza, not specifically looking for a dessert café`**、以及既有标点（无/`.!/?`）变体；
    - 保留（1 家）：`We have no parking requirements and want a dessert café in Ginza`、`We have no parking requirements and we want a dessert café in Ginza`、**`not too sweet, but specifically looking for a dessert café in Ginza`**、`without outdoor seating I would like a dessert café in Ginza` 及点名 `Age.3 GINZA` 对照。

### R5（P3）About 软条件经模型间接引用商家原文时补全商家 `evidenceId`
- **位置**：`src/domains/restaurant/condition-states.ts`
- **要求**：
  - 条件走 `weak` 分支且模型通过 `supportingEvidenceIds` 引用商家原文时，将实际展示引文对应的商家证据 ID 纳入条件 `evidenceIds`。
- **验收**（配合 V2 日期格式）：390/1440 验证经模型间接引用与直接引用同一商家原文时，**先断言引文容器 `[data-source-id]` 绑定到正确的完整 `readAt` ISO 时间戳**（防止同一天取错批次被日期隐藏），再断言可见页脚显示正确的 `<站名> ↗ · Checked <东京日期>`；旧快照歧义对照仍省略日期。

---

## §3 切片 3：真机交互修复（M1–M3）与 UI 精简/主题蓝（V1–V4）

### M1（P1/P2，真机实测）iOS 软键盘字号防缩放 + 对话区可滚动不遮字
- **位置**：`src/web/local-workspace-page.ts`、`src/web/browser/composer.ts`、`src/web/browser/entry.ts`
- **要求**：
  1. 移动端（`@media (max-width: 959px)`）将 `#message` 与 `.condition-editor input` 字号设为 **`16px`**，避免 iOS Safari / 微信浏览器聚焦自动放大（最终真机放大行为留待真机实测验证）。
  2. 软键盘弹起缩小 `visualViewport` 高度时，准确预留底部 `#workspace-composer` 高度与安全留白；在非 `DETAILS` 澄清/对话视图中，聚焦瞬间滚到使澄清提问最后一行露出在输入框上方，**但绝不强制锁死滚动（用户向上回看标题/条件后不得被拉回）**；长 `DETAILS`（About）页聚焦仍保持原阅读滚动位置不重置。
- **验收**：
  - 标准 390×844 中文多行澄清模拟：断言 `#message` 计算字号 `>= 16px`、无横向溢出/裁切、澄清提问末行底边严格位于 `#workspace-composer` 顶边之上；
  - **较矮键盘视口对照（新增）**：叠加长条件 + 多行输入 + 较矮 `visualViewport` 时，验证澄清末行**能滚动到**输入框上方且用户向上回滚阅读时不会被强行拉回；
  - 保留长 About 焦点切换不重置阅读位置与草稿对照。真机 iOS 标注 `NOT_EVALUATED`。

### M2（P2，真机实测 + Round 24 U4 尾巴）照片手势、放大平移与全链路失败恢复
- **位置**：`src/web/browser/photos.ts`、`src/web/local-workspace-page.ts`、`src/web/browser/transport.ts`、`src/integrations/restaurant-photos/display-photos.ts`、`src/integrations/restaurant-photos/website-photos.ts`、`src/server/local-web-server.ts`
- **要求**：
  1. **桌面端取消鼠标拖图翻页**：`bindPhotoGestures()` 仅响应触控指针（`event.pointerType === "touch"`）；桌面端只保留左右按钮与键盘左右键（同步更新 `VISUAL-DIRECTION.md` 与原桌面鼠标拖图测试）。
  2. **放大后单指平移不跳图**：当 `visualViewport.scale > 1.02` 时，允许浏览器原生横向与纵向平移浏览同一张图，JS 禁止触发翻页；缩回 `1×` 后恢复单指左右翻页。
  3. **打通前端 + 代理服务端的可恢复失败重试（根治 8 张变 5 张）**：
     - **列表请求中断**：前端不得把网络/服务短暂中断导致的列表请求失败缓存成 10 分钟空列表（只对明确成功或非瞬时状态按原 TTL 缓存，断连/失败后允许在重连或重新打开时重新拉取）；
     - **图片代理下载中断**：在 `display-photos.ts`、`website-photos.ts` 与 `local-web-server.ts` 中区分**永久不可用**（如 404/410、缓存头禁止、尺寸/格式不合法 -> 继续标记不可用并跳过，不破坏既有破图跳过测试与媒体请求预算）与**可恢复瞬时故障**（如上游/本地中断、超时、短暂 5xx -> 不永久封死该图片，服务端返回可区分状态码，SSE 重连后仅对当前相册的可恢复失败允许重试；持续 502 仍 fail closed，不陷入死循环或突破原媒体预算与按需加载约束）。
- **验收**：
  - 390×844 全屏第 2 张放大至 1.8× 后单指左移 80px -> 计数保持 `2 of 8` 且 `visualViewport.offsetLeft` 明显平移；恢复 1× 后双向单指翻页正常；
  - 1440 桌面鼠标横拖 95px -> 不翻页；左右按钮与键盘左右键正常；
  - **全链路恢复回归（至少 1 条经过实际本地图片代理）**：分别覆盖**列表请求短暂中断后恢复**与**图片代理下载短暂中断（及持续 502 对照）后恢复**，证明恢复后当前相册重新展现完整张数，同时保留原真实坏图跳过、按需加载与媒体预算回归。

### M3（P3，图 4）移动端 `Reconnecting…` 胶囊垂直位置微调
- **位置**：`src/web/local-workspace-page.ts`
- **要求**：微调移动端 `#reconnecting` 的上间距/定位，使其在 `#topbar` 下方与标题之间视觉居中、不紧贴标题。

### V1（图 1）条件名与引文完全相同时不再重复画引文白框
- **位置**：`src/web/browser/views.ts`
- **要求**：
  - 在 About 页中，若某条件对应的引文规范化文本与该条件展示名完全相同（如 `Steak · Confirmed` 对引文 `Steak`），不再画只写着 `Steak` 的独立白框，直接附一行紧凑来源页脚（保留 `<站名> ↗ · Checked <日期>`）；引文含额外信息时仍正常展示白框。

### V2（图 2 + 图 3）来源页脚统一改为 `<站名> ↗ · Checked <日期>`（不要具体时间）
- **位置**：`src/web/browser/citations.ts`、`src/web/browser/format.ts`、`docs/product/VISUAL-DIRECTION.md` 及受影响测试
- **要求**：
  1. 折叠开关保留 `Source`；内部外链文案改为站点/来源名（`Tabelog`、`TableCheck`、`Google Maps`、商家域名去 `www.`，无有效域名回退 `Open page`），消除 `Source` / `Source page` 重复。
  2. 可见页脚不再展示 `HH:MM JST` 与星期，统一格式为 **`<站名> ↗ · Checked <月 日>`**（如 `Tabelog ↗ · Checked Nov 21`，按 `Asia/Tokyo` 格式化）。
  3. 内部 `groupCitations()` 与 `[data-source-id]` 继续保留完整精确 `[url, readAt]`（ISO 时间戳），同日不同批次仍独立归组；无 `evidenceId` 且存在歧义的旧快照仍省略 `Checked <日期>` 只留 `<站名> ↗`。
  4. 同步更新既有测试中旧的 `Source page` / `Checked ... JST` 断言。

### V3（图 3）Q&A 表格短表头与值合并——必须有原始同行证明，否则 fail closed
- **位置**：`src/integrations/restaurant-facts/model-page-question.ts`（如需透传同行结构证明）、`src/domains/restaurant/contracts.ts`（如需可选字段）、`src/web/browser/citation-groups.ts`
- **要求**：
  - **严禁仅凭前端引用数组相邻就猜测合并**（防止页面同时有“包间”和“包场”两行且模型乱序引用时，把包场的 `Available` 错拼到包间上导致 S0 错误事实）；
  - 只有在后端/原始页面抽取结构能**明确证明该表头与状态值属于源表同一行**（例如同一表格 `<tr>` 内的紧邻 `<th>` + `<td>` 配对，或文档结构中的显式同行关系）时，才在 Q&A 引文中合并展示为 `Private rooms: Available`（后续人数说明仍单独换行）；若现有/旧 DTO 无法确认同行归属，必须 fail closed 保留两条独立原文；
  - 绝不修改答案正文，保留 About/Handoff 原文与支付两条对照。
- **验收**：
  - 正例：源表同一行 `Private rooms` + `Available`（+ `For 2 people...`）在 390/1440 Q&A 弹层与历史合并为 `Private rooms: Available`；
  - **反例（必须覆盖）**：同页同时含“包间”与“包场”两行、引用顺序打乱（跨行相邻），以及无同行证明的旧 DTO，均**绝不合并**，原样保留两条独立引文。

### V4（主题蓝 `#3D5AFE` 克制点缀）
- **位置**：`src/web/local-workspace-page.ts`、`src/web/browser/views.ts`、`docs/product/VISUAL-DIRECTION.md`
- **要求**：保持白底 `#fff`、深墨 `#15172B`、次级 `#5F6275`、`DM Sans` 与字号体系不变，在以下功能性节点增加克制的主题蓝 `#3D5AFE` 点缀：
  1. 引文左竖线（`.citation-group blockquote`）：`border-left: 2px solid #3D5AFE`；
  2. 卡片与 About 的 `Confirmed` 状态（`item.status === 'MET'`）：状态文字采用 `#3D5AFE`（`Not a match` / `Unverified` 保持 `#5F6275`）；
  3. 已收藏书签图标（`#bookmark[aria-pressed=true] svg`）：`fill: #3D5AFE; stroke: #3D5AFE`；
  4. 卡片 `About ›` 入口与引用来源外链（`.citation-footer a`、`.about-commercial a`）：文字采用 `#3D5AFE`。
- 同步更新 `docs/product/VISUAL-DIRECTION.md` 及对应样式断言。

---

## §4 冻结、全量门禁、独立验证与归档

1. **禁止原地执行历史目录脚本**：所有本轮独立验证入口与输入清单新建于 `.eval-artifacts/3c-unified-20261117/round-25/`，全部观测 JSON 与截图输出至本轮全新空子目录；先采集并核对新产物齐全，再运行断言脚本。
2. **并入正式套件 & 单一冻结 SHA**：C1、R1–R5、M1–M3、V1–V4 全部核心回归并入仓库正式测试套件；提交唯一冻结 SHA（记录 commit SHA 与 `src/` tree SHA），后续全部正式门禁、历史 10 路径、本轮独立验证与视觉三组均绑定该唯一冻结 SHA，运行前后净树；如任一门禁失败，保留原失败日志于子目录，修正后重新冻结并从头完整重跑。
3. **正式五门禁（`PRAXIS_GATES_SUBDIR=round-25/gates`）**：`typecheck`、`arch:check`、`test`、`test:browser:fixture`（G2/Chromium/G6 分列计数）、`build` 全绿；验证严格 TS（0 any / 0 环 / 无反向 import `entry`）及 `tsx` 与 `dist` 资产逐字一致（含 C1 隔离路径在 `tsx` 与 `dist` 双入口的验证）。
4. **视觉回归与原图目检**：重跑 `formal`、`style1`、`states`（加载新增测试与正则）与历史 10 路径，目检联系表及关键原图（390/1440 卡片主题蓝点缀、About 单 `Steak` 精简、Q&A `Private rooms: Available` 与反例未错拼、`Tabelog ↗ · Checked Nov 21`、390 中文澄清软键盘标准+矮视口、390 1.8× 缩放后平移、390 `Reconnecting…` 居中）。
5. **归档与边界声明**：在 `.eval-artifacts/3c-unified-20261117/round-25/` 写入 `REPORT.md`、SHA-256 清单、保护面核验与改动范围核验，另做最终本地归档提交（冻结后 `src/` diff 为 0）；显式单列 **远程真实 CDP、真机 iOS/Android 软键盘、真机双指缩放平移、Live/真实 PostgreSQL/4312 走查均为 `NOT_EVALUATED`**；所有浏览器/端口/PGlite 进程在 `finally` 中收尾，净树停下。