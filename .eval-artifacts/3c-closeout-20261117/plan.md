# 3C 第一步剩余离线验证 — 2026-11-17

Status: draft / not integrated; exposed development verification, not Clean Baseline.

复用 /private/tmp/praxis-3c-closeout / codex/feat-web-workspace-3c-closeout，起点ecba80c0d53957e1dff9a1655f7af58d1a032764；代码仍为上一轮同步的 origin/main dbc2d9c55 + slice2，禁止产品/测试断言改动，不重新同步浮动main。

本轮只修外层编排。浏览器门禁直接执行 npm，不额外套sandbox；其Replay测试自身的sandbox-exec断言保留。其他门禁与独立Smoke按各自单层OS隔离执行。继承环境仅PATH/HOME/TMPDIR，不加载.env、不连接/写入本地PostgreSQL。Fixture/PGlite HTTP/SSE只允许loopback；D01/D02由原runner、原录制、OS禁止全部外连运行。无真实模型/Google/网站请求，0 Live。

先冻结净树提交完整五门禁；全绿后执行原smoke.mjs，两尺寸独立登录到departure/SQL记录与context拦截。D01/D02各一次原样Replay，observe-replay.mjs只旁听browser request和Google requestJson实参并原样委托，不更改返回、匹配、URL、模型输出、资格或State；新增请求日志用于对比原HAR的URL/方法/query/body。输入33+83文件保持可用，271项原冻结SHA逐blob复核。所有运行绑定实际SHA，新结果独立保存，不覆盖前轮失败。

若实际产品/测试断言失败，保留首失败并停止，不修改代码或断言；若只是明确缺失的同HEAD材料，按精确路径入口恢复并保留原失败，按本轮已授权范围继续。局部编排错误可在保存证据后更正、重新冻结，不能放宽验收。Replay不足记REPLAY_INCOMPLETE，四层只报告可证明部分，不把Fixture当Replay、无独立证据不声称S0=0。完成后本地提交日志/截图/报告及追加STATUS/历史/月索引，不合main/推送，停在第2步LIVE_READ前。
