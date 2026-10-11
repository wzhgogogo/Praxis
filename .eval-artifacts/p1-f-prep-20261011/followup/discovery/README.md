# 第 11 次发现补探测

状态：exposed development probe / pending independent review。冻结 b301091；原输入未变，nearby、1 km；探测预算 11/11 用完，不追加探测。

78,977 ms，1 次模型、1 次 Google。入口：/en/tokyo/ → /en/tokyo/A1301/（Ginza & Shimbashi & Yurakucho）。页面结果计数 6,251，首列表解析 20 家；两批合计读取 10 家详情，半径内 9 家、半径外 1 家。完整坐标、距离和快照 URL 见 analysis.json。没有导航超时、非 GET/HEAD 放行或进入后续表单的页面。

原 result 的 firstTen.actualDetailsRead=5 是最后一批字段，不代表总数；聚合纠正只写在 analysis.json，原产物不覆盖。录制 replay 标为 NOT_REPLAYABLE / UNSAFE_DOCUMENT，不能声称可静态回放。通过与否由复核者判定。

红灯复用上一轮东银座 OPEN_LINK 5 秒超时及本批 navigation/chromium-red.log，不为本次真实探测制造失败或重跑。两次自动审批拒绝发生在进程启动前，0 模型、0 Google；收到针对公开载荷到 DeepSeek 的明确批准后只执行一次。
