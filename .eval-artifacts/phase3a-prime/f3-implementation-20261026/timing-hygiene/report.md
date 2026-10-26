# 时序测试卫生

状态：completed / frozen regression；2026-10-26 CET（UTC+1）。分支codex/fix-phase3a-prime-f3-timing-hygiene，交付验证源码d83ff50c346242f79b300a1745648a6df5da1ba5。产品源码和站点行数未改。

扫描113个测试文件，58个计时/时钟/小预算声明或共享helper候选逐项处理，见[完整表](../timing-disposition.md)及JSON；显式SDK和外层测试超时另逐行核对，见timing-sdk-supplement.json。声明数不是运行用例数，非时序候选的排除理由也保留。

- 已知OPEN_LINK：保留正常6.5秒真实导航；超时对照用注入Date控制30秒候选窗口中的1.5秒setup成本，模型选择时精确留下5秒，并在实际session.openLink端口核对传入值。响应悬置，仍须BROWSER_TIMEOUT、一次模型调用、操作失败诊断、会话只关闭一次。移除依赖机器速度的原1秒/2.5秒竞争。
- 候选取消/重建：40/10毫秒案例用虚拟Date和计时器，tick(10)触发精确期限；15毫秒旧清理案例用20毫秒逻辑推进，不真实sleep。来源获取用20毫秒逻辑成本对照1毫秒来源余额，未开始入口仍保留。原断言不减。
- 其他观察：C3 settling/result预算20秒；图像未完成测试的墙钟调度余量5秒，仍断言SETTLED、pending image1及blocking data0；弹窗/worker和普通SDK导航留10秒；父进程就绪30秒且外层测试45秒。所有拒绝接收端、同query、状态和节奏下界断言保留，生产预算不改。
- 保留真实尺度：健康slow-last-snapshot的1000/800/220毫秒、生产健康10秒；一个31秒来源观察/45秒provider窗口；真实6秒/8秒Guard读取、6.5秒preflight、3.25秒POST observer、来源重试最小延迟。普通健康4秒已验证窗口保持原样。E1测试块逐字节相同，四个对话B生产文件SHA不变。

检错证据：五个隔离副本均产生AssertionError红灯，分别为原1秒窗口、导航余量失传、候选期限被续期、来源成本丢失、worker未装Guard。原1秒副本在1.5秒setup之后没有真正导航，不能冒充导航超时覆盖；正确配置绿灯到达openLink且精确传5秒。详情见challenges及red-reuse-proof.json。后续只改了三个其他计时器声明和更宽就绪窗口，五项选中测试原字节及生产实现仍相同，复用有效红灯。早期未冻结尝试、清单API尝试和错误观察navigate端口的准备失败不计有效红灯，日志保留。

最终严格五门禁全绿：默认1054/1054、真实Chromium161/161；typecheck、arch:check、build通过，无skip/todo/cancel，无E1例外，每项前后git status为空。前两轮在补齐40/10毫秒及外层窗口前也各自全绿，作为过程证据，最终交付以delivery-gates为准。冻结603项输入/脚本SHA，详见delivery-inputs/freeze.json。未运行Linux、不声称本批有Linux新结论；所有运行都是离线Mock/真实本地Chromium。

两个站点目录非测试TS保持3864，source-packs.ts单列473，实际减行0。本切片只处理测试卫生；行数目标仍由后续条目实际实施或证据不足延期决定。新增真实模型、Google、来源网站、Live调用0，不读.env。按授权合main后继续行数范围。
