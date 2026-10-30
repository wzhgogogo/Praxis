# B1 G3原链接接线：离线准备完成

- Evidence status: **draft / not integrated**；仅工作分支，未合 main。
- 日期：2026-10-30，维也纳 CET（UTC+1）。
- 分支：`codex/feat-phase3b-b1-g3-wiring`。
- 依赖：B 的 G3 `02163d39467a0a04f261ae2a6b426b292b1e185e`（含 main404a766e/A31398a77）；旧停止点及8c66921a接口红灯原件保留，不重写为新接口结果。
- 功能提交：`295511c9`；最终门禁冻结：`72e3745b459bc7869c0a0e3cb0f60f5e1238325e`，723份输入。
- 最后核对 origin/main：`4cbc521bb9e4fb177e247266561bd90eb5d34e3f`，尚不包含上述 G3。因此本次没有提前 rebase/main 合并；G3 合 main 后仍按用户指令 rebase、重新冻结、五门禁及严格 G2，再交复核。

## 实现及合同

普通服务端启动把同一个生产 readAssembly 交给 Web 组合，注入 B1 来源读者。读者只观察既有可用性读取的 BrowserSession.snapshot，调用未修改的 inspectTabelogVacancyResponse 并保存其 formCourseLinks/sourceResponse 输出；没有新增 snapshot、网页、Google 或模型请求，没有另写响应解析器。

来源记录按当前 root Task 隔离，即使两个 Case 的候选、时钟和确定性 evidence ID 相同也不互相覆盖。记录关联本次可用性结果的 HIGH 同店证据、请求指纹、来源响应 sequence/URL/observedAt、原链接；不保存 DOM。信号取消、缺少身份/链接、结构或请求不符时不产生交接。缓存按可用性新鲜度过期；服务端重启丢失缓存时只隐藏链接，不从店号/时刻恢复，也不自动重读网站。

生成使用原 prepareBookingHandoff，展示/出发前沿用 presentBookingHandoff 的第二次服务端检查。保留完整 candidate/source evidence identity 相等、日期、人数、时段、指纹、新鲜度和 URL 白名单规则。没有 Task State、TaskDefinition、Agent/Semantic/Source Prompt 或 Schema 版本递增，没有预约授权或执行行为变化。

实际生产来源 ID 是 en/tokyo/A…/13123456 这样的原生路径；rcd 是同一个 ID 的末尾数字。仅在 B1 URL 字段校验中取该数字组件，完整候选/证据/source ID 的相等比较保持原样；没有改变 G4 身份接纳规则、地址/电话/名称阈值。新增反例证明同尾号但完整候选/证据 ID 不同、低身份置信度或不同 rcd 仍拒绝。

绝对原链接逐字保留，包含参数顺序和 percent encoding。对来源实际给出的根相对链接，只补已核对的 https://tabelog.com origin，路径和查询字符串原样拼接，不用 URLSearchParams/URL serialization 重建参数；原相对字符串仍留在来源记录中供审计。未支持的 URL 形式照旧拒绝。模型没有输入或构造链接。

## 红灯、绿灯与独立展示

首轮20秒 fixture总时限正好等于既有20秒收尾保留窗，SEARCH被READ_TIME_RESERVED拒；这是测试前置错误，不算 B1红灯。日志 red-http.log/fixture-diagnostic*.log 保留。改为未变的生产时限后，`bcff9e1c` 下真正的 Interpreter → Compiler → Agent → Validator → Router → Google/Browser fixture transports → G3 parser → Reducer → PGlite → authenticated HTTP 路径已到 PRESENT_RESULTS，而原普通组合交接数仍为0，目标断言0≠1有效失败（red-http-valid.log）。当时产品接线未修改。

同一主要断言接线后通过；没有手填 State、HIGH结果或 PreparedBookingHandoff 代替链路。只有模型、Google与BrowserSession I/O 是明确构造的本地 fixture。最终默认测试含这些控制：

- 绝对链接：原 URL 的顺序和 `%31%39%30%30` 字节保留；相对链接只补来源 origin。
- 缺链接、错日期、人数、时段、店号、域名、路径以及额外 redirect 查询字段：均无交接按钮。
- 同一时钟/同候选的多个 Case 不覆盖已有交接；跨用户 GET 拒绝。
- 到期隐藏；新应用与新读者无缓存时，原可用性仍在而链接隐藏，不增加来源打开次数。
- 源站实际选中仍为 UNKNOWN；无 selected/booked 声明。

最后由同一真实 HTTP 测试实际产出的完整投影（web-delivery/http-view.json）进入真实本地 Chromium，使用未改的产品页面。页面 API在渲染阶段替换为这个冻结产物，所有非本机受控URL请求阻断。两个角色为link的按钮实际显示：Book on Tabelog 和 Continue on Tabelog — date, time, 2 guests filled in；href均逐字等于上述原绝对链接。没有激活按钮或访问预约页面。见 web-delivery/web.json、web-desktop.png；已目视核对按钮。此项是“真实HTTP产物→真实Chromium渲染”两阶段验证，不称为真实网站/单进程完整Web Live。

## 最终正式门禁

| 检查 | 结果 |
| --- | --- |
| npm run typecheck | PASS |
| npm run arch:check | PASS |
| npm test | 1253/1253，失败/取消/跳过均0 |
| npm run build | PASS |
| npm run test:browser:fixture | 180/180，130.955秒 |
| PRAXIS_G2_REQUIRE_PASS=1 npm run test:dom-change | 5/5测试，12/12页面PASS |
| HTTP产物 → 本地Chromium B1按钮核验 | PASS，2个按钮，真实来源请求0 |
| 前后输入完整性 | 723/723 SHA一致 |

最终9步骤前后 git status --porcelain 全为空，无恢复文件。正式记录是 gates-delivery.json/gates-delivery/；原 gates.json 是五门禁/严格G2通过但UI日志TAP解码失败的历史轮次，gates-final.json 是为防复用已提交日志路径而在UI前主动停止的轮次（exit143，round2-cancelled.json）。两次问题仅在测试证据传输/输出隔离：现以base64传递JSON，并独占新建web-delivery目录，产品和业务断言未改；失败/中止原件都保留。最终轮完整PASS，不用前两轮替代。

## 范围和停止点

相对B02163d39，三个受保护文件、src/eval、src/harness、src/web和共享账本均无差异。产品改动只在B1读者、普通read/server组合、只读root任务作用域getter和B1原生ID表示绑定；没有修改B的parser/query-controls/browser-availability，没有调用、登录、填写、确认、支付或个人资料存储。

本次真实模型/Google/网站GET/Live/真实PostgreSQL调用均0，不读.env；PGlite仅用于既有本机离线HTTP集成。TableCheck当前网站预填和Tabelog真实库存/工作流没有测试，保留原Live前检查单。

只推准备分支；本次不合main，不把它报告为main已启用。后续G3进入main后，先rebase到新main并重跑五门禁、严格G2，保留前端对话/A/B的变更，再提交复核。
