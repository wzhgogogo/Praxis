# D4 Search 卡死、模型观察与独立评测接线

- 时间：2026-11-06 04:12 CET（UTC+1）。
- 状态：**draft / not integrated，分支交复核，不合 main、不跑 Live**。只使用已暴露的 D4 开发录制；不是 Clean Holdout。
- 当前代码冻结：`88ca2ded4b3f275b940de85abfdde19a0f0442ad`。最终证据提交只补报告/录制和能力矩阵说明，产品代码与此冻结一致。
- 分支：`codex/fix-phase3b-d4-d8-real-page-diagnosis`。

## 1. Search 卡死：真实红灯与修复

原件：此前提交711eebc7保存的 `observed-read-provenance-20261105/budget-approved-continuation/live/runs/D4/D4/recordings/g6-D4-1793928719238-0/`。使用已准入的首次 `snapshot-0001.html`、原 HAR 脚本/动态响应，以及原决策 #4–5 的目标和动作。最终运行器直接读取原记录的 latencyMs。缺失响应中止，代理指向关闭的本机端口，无网站回退；没有补结果页。

红灯：`first-document-timed-red-correct-wait.json`。时间点依次为：CLICK 开始 → DOCUMENT_CURRENT 返回 → INPUT_EVENTS 开始却不返回 → GUARD_EVIDENCE 等待 → CLICK 20秒超时；页面关闭后 INPUT_EVENTS 才报错。原点击日志已经完成点击，卡在“waiting for scheduled navigations to finish”。这与 Live 的三次 Search 相同，发生在 Guard 开始转发前。

尝试统一句柄上下文仍失败，见 `first-document-green.json`（文件名是尝试名，内容实际为失败，不能算绿灯）。最终修法是：动作前准备证据句柄，把同一文档、已观察表单、未批准输入事件、原始插入值、有效 method/action 和完整 FormData **在一次原子浏览器求值中取回**。不再让暂停的导航依赖第二次浏览器求值。Node 继续比较完整字段多重集、逐值来源、唯一表单、同源、GET 和凭据条件；禁止路径/CDP/重定向边界与20秒上限不变。

绿灯：`final-source-replay-green.json` / `.log`。相同原始动作和原始模型时延下原子取证完成，Guard 得到10字段哈希收据并进入归档传输。原 Live 没取得的结果页仍为 `RECORDED_RESPONSE_MISSING`，没有伪造成功页；本项只证明原来的卡点已越过，不证明查位/交付。

独立核对 `final-source-form-audit.json` 为 **SUPPORTED**：使用单独的 native form 观察和冻结用户请求核对字段/输入哈希，不读取 Guard 的通过标志。正常本地双传输表单与未知值/联系信息/变形输入/额外字段/POST/跨源/禁止路径/非表单/popup/iframe 反例保持。

### 为什么以前的 Replay 通过

原脚本化模型没有真实模型的等待间隔，选择动作也与本次 #4–5 不同。此次相同源文档/脚本的“立即点击”也通过；加入原轮次的等待、稳定观察后，多次求值稳定重现导航互等。此前的绿灯没有覆盖这个时序窗口。原子取证同时通过这两种情况。没有把此问题归因于网站响应慢或 TLS，也没有加等待时间或导航重试。

## 2. 地点优先与控件合法性

Browser Prompt@21 在本未发布分支内修改，指导模型：目标有地点且页面提供设地点方式时先建立地点，回读可见结果/摘要确认，不用输入值自证；明确无匹配且没有新路径时不反复提交。没有固定填/点控制器、站名后缀、词表或站点分支。

具名地区的原生列表完成判定要求在可见文本中有用户地点名，使用 Intl.Segmenter 的整词序列比较；**Akabanebashi 不等于 Akabane**。代码不把输入值当作地区生效证据，仍逐店核对坐标/半径。只给坐标的 TASK_LOCATION_RADIUS 继续按原数字半径核对，不能要求网页出现“nearby”或界面自拟标签；只有已有 NAMED_PLACE_RADIUS 要求地点名文字证据。

真实 D4 日期输入的原生属性为 readonly。运行时读取 HTML 原生 readOnly，拒绝所有 FILL；在既有 Guard 边界下仍可让模型点击其公开控件。没有用“November”等字面词分类。此属性是内部元数据，从模型 Context 中剥离，不新增 Schema 字段。

## 3. 纯模型验证（40/40，网站/Google/Live 均0）

只有本次 D4 已保存的真实观察。原 user Context、观察、历史与动作列表逐字节不变；只替换通用 system prompt。旧观察中的过宽日期动作保留，实际运行时 readonly 收紧另由本地测试验证。`model-only-audit.json` 核对40份原 Context 不变及 canonical 动作合法；3份 REQUEST_HUMAN_HELP 带无效的占位 target，按原解码合同忽略，不是点击该目标。

| 原决策观察 | 首轮（62b13f4a，32次） | 最后8次（bb67fa17） |
|---|---|---|
|#4 Tabelog 初始输入|4/4 FILL LOCATION，原输出为 RETRIEVAL|4/4仍先 LOCATION|
|#5 已误填菜系但未设地区|4/4改填 LOCATION，原输出为 Search|未重测|
|#7 TableCheck 初始入口|4/4打开 Destination|未重测|
|#8 已打开 Destination|4/4填 LOCATION|未重测|
|#9 明确无匹配地区|4/4请求帮助，未再改填菜系|未重测|
|#14 明确无匹配菜系|4/4改去 Destination；属于另一个观察路径，未证明完成或不循环|未重测|
|#26 店名查询无匹配|4/4请求帮助|未重测|
|#29 同查询已经提交、仍无匹配|1/4请求帮助，**3/4仍重复提交，失败保留**|补充通用“按钮仍可见不是新路径”指引后，4/4请求帮助|

没有合并两种 Prompt 文本成“40/40通过”。最后文本只新增测了两份观察各4次；同一观察的重复不是新独立 Case。完整请求/原始响应保留，system 文本各自 SHA 在 freeze.json。这里只证明下一步选择，不能宣称网站搜索/日历/交付已成功。

第一次 Runner 的本地端点白名单漏掉已有 DeepSeek beta 入口，在 fetch/记账前拒绝：实际请求0，原错误保留在 `model-only-rejected-before-fetch/`。修正、提交冻结后才发32次，再冻结通用指引补8次；没有免费掩掉一次实际失败。

实际 API 请求40次，模型累计 latency86024ms，input tokens1044388 / output tokens5046。没有按价格估算费用。调用发生于03:36:11–03:40:12 CET（含两批之间的修订间隔）。凭据只由 Node --env-file 加载；不独立读、打印、复制或暂存 .env。

## 4. TableCheck 首个偏离与时限链

详表见 `tablecheck-analysis.md`。页面收到 Akabane 或店名后，明确显示 “No matching area or station. Check what you typed.”；菜系弹层也明确无匹配。模型仍在同一 Destination/菜系间改填、重复提交。背景卡片在 Akabanebashi/Onarimon，不是 Akabane 当前查询结果。这是本次 UI 查询/选项限制证据，不是网络不可达、无此店或无位证据。

TableCheck 合计206.551s（原生发现90.004s，三次具名45.003/43.243/28.301s）；Tabelog合计99.050s。不能把这些失败搜索时间当成“身份＋查位”的正常样本。

`time-chain-proposal.md` 有两种选择：推荐下一次验证先保持20秒导航/45秒provider/90秒候选/500秒总时长与20秒保留，测修复后的正常样本；另一待批准方案为 provider45→90，但候选仍90，可能完全挤掉备用来源，现有数据不支持直接采用。原生发现现用90秒候选窗口，不冒称45秒覆盖所有来源工作。**没有改任何数值、来源顺序、身份门槛或重试策略。**

## 5. 独立 POST 与表单证据接线

外层 route.fetch 调用前，从真实 Request 读取方法、源站/路径、查询键、content-type、正文SHA256、字段/类型结构，不存正文或其他请求头。失败连接也保守按已派发审计，不能用“没收到响应”证明请求没到来源。另由外层 CDP 记录 native CORS 请求/收到响应，不读取 Guard 的判定。

已批准读取规则的独立字面副本在 `reviewed-read-rules.json` 和 `D4-next-pack.json`/`D8-next-pack.json`。它们是待复核输入，不从生产 policy 生成；仍需复核者核对完整独立见证/qualification oracle，原 pack 的空 pages 不自动变成认证事实。没有因此访问任何认证页面或增加额度。

新增外层核对9/9：正常POST、额外字段、错误类型/方法/路径、缺正文/哈希/content-type、错误CORS前检。使用原 G6 Evaluator 接口，不修改评分算法或将 Guard 通过值当 oracle。**旧 D4 的3条 POST 缺原始证据，仍为 NOT_EVALUATED，不能回填这次新规则把旧结果改为通过。**

还补到一处实际序列化缺陷：safeRecord 给 documentOrigin/actionOrigin 加了尾部斜线。原独立表单测试接入与G6相同的脱敏器后，两种传输均由 SUPPORTED 变成 MISSING（`serialized-form-audit-red.log`）。保留规范协议 Origin 后，原断言4/4恢复；Guard 许可、字段来源规则、评测阈值不变。新增只保真已有协议字段，无新 Schema。

## 6. 产品改动范围与回归

| 产品文件 | 改动及通用性 |
|---|---|
|playwright-observed-get-forms.ts|一次原子取证；仍是原生同文档/表单所有权与精确多重集核对；诊断只含时点/哈希收据|
|playwright-read-network-guard.ts|给证据 await 打时点，准入规则不改|
|local-playwright-chromium.ts|动作前准备句柄，记录 click 时点，不选目标或增加动作|
|browser-runtime.ts|内部原生 readOnly 元数据|
|playwright-browser-controls.ts|观察 readOnly 原生属性，不读站点私有 class/testid|
|browser-task-executor.ts|readonly 禁止填入，保留安全的观察动作；内部属性不进入模型 Context|
|browser-action-decision.ts|通用地点/无匹配指引，动作仍由模型选择|
|native-restaurant-search.ts|按真实地点名要求可见文字证据，整词核对；坐标请求保持数字半径合同|

外层评测：新增 request-observation 与9项独立反例，Live Runner调用前采集元数据及native preflight；新增两个有明确替换边界的离线/模型诊断 Runner；修复证据 Origin 保真。A 的原 G6能力行为断言、Gold、B 的查位/响应绑定/身份规则均未改。State25、TaskDefinition24、Action13、Context4及既有录制/评分版本不变；Prompt21尚未发布，在该版内记录文本SHA差别。

首次完整门禁的 npm test 红灯原件保留在 `gates/`：正例构造列表缺少其既定地区文字，另有 PGlite/V8 `Check failed: end > addr` 进程崩溃。没有重写这些日志。等待中的 native-discovery 子进程被有界停止，不冒充通过。正例夹具补其既定Shibuya/Akabane标题；全国/异地/加载中/旧查询负例不改，原断言不删。坐标 F6 用例的原标签和断言恢复，修正的是新结果检查误用标签的问题。相关70/70恢复，saved-booking-terms 原文件单独2/2；最终完整 npm test也全绿。

最终冻结88ca2ded的全套：typecheck、arch、build PASS；默认 **1421/1421**；Chromium **227/227**；G6 **75/75**；严格G2 **5/5**（12对全部PASS）。每项前后净树，日志/命令/退出码/耗时在 `final-gates/`。额外的证据保存不改被测代码。写死扫描6条均逐条说明在 `hardcoded-audit.md`，原扫描脚本与输出保留；没有不明例外。

## 7. 额度、冻结与停止点

本轮新增：真实模型 **40/40**；公开网站GET **0**、Google **0**、Live **0**、环境重跑 **0**。本地HTTP/Chromium测试与真实模型、网站读取分开。承接快照累计 models547/1600、Live17/37、评测GET332/442；留出预留Live18/GET108未动。主会话账本为 `followup8/model-only-budget.json`，其他为历史快照，汇总按entry.id并集去重，不叠加相同基线（见ledger-index.json）。

已准备后续D4重跑1次和D8首次1次的规则材料，但**未执行**；依用户指令，复核确认后才能发出。后验GET最多2次仍留着，没有再做连通确认。main、STATUS/DEVLOG/TEST-LOG/月度索引均未改，按本任务先分支复核。

四层结论：配置=冻结代码/原始输入与两批system SHA；执行=真实录制组件回放＋本地门禁＋40次纯模型；独立核对=真实 Search 表单 SUPPORTED、新POST采集反例通过、旧D4 NOT_EVALUATED不变；产品=卡死机制已离线关闭，完整真实身份/日历/交付仍待已批准但尚未执行的Live，不冒称完成。
