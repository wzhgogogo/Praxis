# P2-0 加固批报告（执行中）

Evidence status: exposed development evidence，不是Clean Baseline。基线921aa76已通过git pull --ff-only取得；通读codex-instruction、P1-G复核、phase-1-signoff及Playbook1.8。第一阶段已独立签收，P2-0只处理四项获批通用缺陷；不改Gold／变体／见证，不扩大交付资格或只读准入。用户已有未提交INDEX、Booking草稿和演示文件保留，不纳入本批。

切片顺序：Guard逐跳安全 → 显式模型限额接线 → 无可执行路径／TIMEOUT诚实结束 → typed失败分类／结构化原因／evaluator@28。每项独立红绿、四门禁、本地提交；最后冻结新生产提交，只执行两次授权原版Live。起点1014/1500模型、37累计Live，新预算正式2次／启动后环境重跑最多1次；当前尚无本批真实模型／Google／Live新增。h001必须东京17:30前启动，今日时窗已过，不为赶时间跳过离线验证；完成后安排下一有效时窗。

## 1 Guard逐跳重定向

提交号在最终提交索引补记。实现采用CDP Fetch补充拦截：普通context.route负责第一请求，首个请求之前安装CDP，Location响应和后续原生请求均按原策略核对；10跳内有界。允许URL、方法、资源类型、query/body grammar均来自原ADR-0036与现有来源规则，无新增放行规则。Chromium原生跟随合法跳转，保留最终页面URL、相对链接、重定向Cookie与状态码方法转换。不会把最终响应体作为起始URL的页面交付。

显式Runtime页面在暴露前preparePage；popup首请求可能尚无Frame，先提交无外部请求／不记录为来源响应的空忙碌引导页，建立CDP后才请求原始GET。iframe子目标在恢复前安装同一保护；dedicated worker请求经owner-frame Fetch拦截，真实Fixture验证。Local与CloudflareSession共用安装；未验证真实远程Cloudflare引擎兼容性，安装失败仍关闭边界。HAR无法本地履行而试图原生跳转的请求拒绝，不能退回Live网络。静态CDN被来源规则放行不会晋升为通用文档来源。

红灯：guard/red.log为改动前真实Chromium，9项失败；其中fetch/XHR原Fixture受Chromium Local Network Access遮蔽，未把它们算作Guard实际接收端红证据。修正Fixture允许CORS并仅授予本地源LNA权限，再用921aa76原版Guard隔离副本复验：guard/red-corrected-receiver.log，13执行／1通过／12失败；有效机制依据是B／敏感路径接收端实到、录制遗漏后续跳、循环超过Guard上限，popup等待失败不单独充当receiver证明。源SHA／Fixture SHA见red-source-verification.json，诊断执行副本已删除。没有用假的第二次handler调用作为多跳证明。

绿灯：guard/chromium-green.log，14/14真实Chromium：文档多跳越源、经公开路径进入敏感路径、合法多跳最终URL＋相对链接＋Cookie＋每跳录制、fetch/XHR/script/stylesheet/image、循环上限、popup／iframe／worker、正常popup、已审核CSS的相对导入与CDN权限不扩张。错误的假route第二跳测试已移除；Unit只证明初始请求策略匹配，CDP测试端口不冒充真实浏览器证明。

门禁：guard/{typecheck,arch-check,npm-test,build}-green.log全过，默认862/862。较早npm-test.log的6例失败来自固定来源BrowserContext端口缺新接口，更新端口后恢复；unit-initial.log中一例Chromium被sandbox拒绝，最终门禁在宿主机离线运行。完整浏览器套件browser-fixture.log是97/99，两个旧native dynamic Tabelog场景失败；同样2例在未改的b55e91c冻结树也失败（baseline-browser-native.log）。不改断言或顺带扩写旧发现Fixture，将其列为既有失败；本次受影响Guard的14/14及默认四门禁绿灯分开报告。browser-native-green.log保留当前树同样失败的复跑，不称全套浏览器测试通过。

证明范围：真实本地Chromium请求前边界与正常跳转语义＋默认L0/L1；当前外部来源／远程引擎要由后续两次Live及独立复核判断。到此真实模型／Google业务／Live新增均0。

## 2 显式浏览器限额接线

待执行。

## 3 无可执行路径与读取时限

待执行。

## 4 typed失败分类与evaluator@28

待执行。

## 冻结及Live

待四项完成后冻结；未启动任何P2-0 Live。不推送。

## 2 显式模型额度接线

- Guard提交：`976baaa`。本项模型/操作三限额在Executor类型中必填，构造缺失、非正整数立即拒绝，移除隐藏12/6/24。所有调用入口显式提供；Live/Web原生找店20/120/80，事实4/120/24，查位20/120/80；独立探测/固定源保留各入口明确配置。每条执行器诊断的 `effectiveLimits` 给出阶段实际生效值（共享总额取最小值）。整单模型50不变。
- `limits/red.log`：同Live的`createHybridReadComposition`、Native读组合、查位组合和生产Guard/来源网络策略，固定网页上实际13步查位后再调用原生找店，未手填计数。旧码第一次请求前报BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED。为隔离本项接线，查位端口返回前触发后续找店探针；这不证明Agent会自主选择该顺序。
- `limits/green.log` 同用例通过；构造缺限额有类型反例和运行时反例。四门禁 `limits/{typecheck,arch-check,npm-test,build}-green.log`，864/864。最初沙箱默认测试被Chromium/HTTP权限拒绝，宿主机重跑完成，原日志保留；不计产品红灯。
- 证明范围：L1固定来源/脚本模型，真实调用与共享计数；CDP逐跳边界沿用第1项真实Chromium证明。0真实模型、Google业务、Live。本项提交号见最终索引。
