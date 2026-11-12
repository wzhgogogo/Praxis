# D02-V：路径修正后 Live r1 已交付，安全证据缺项停批

2026-11-12 CET。产品 main 仍为 `105a8b0a825f4dd729674ffb26847d4b13f60771`；新编排冻结 `52860e6080cd502aa151f69b6d24766900282e9d`。只修外层输出路径，真实录制器离线红绿通过；产品源码 0 改动，复用该 main 已通过的全门禁。旧失败目录完整保留。

| 运行 | 实际结果 / 独立评价 | 用时 / 模型 | 评估 GET |
| --- | --- | --- | --- |
| D02V-r1 | 交付 Sumika 12-10 / 20:30 / 8 人及 B1；评价 NOT_EVALUATED | 299.857 秒 / 47 次 | 6（见证1、体检4、后验1） |
| D02V-r2 | NOT_SENT：前序安全证据缺项停批 | — / 0 | 0 |

**逐环节证据**（`D02V-r1/runtime/dev-d02v-paging-r1/execution.decisions.jsonl`）：

- **LOCATION / 行政区：** #4 填权威 LOCATION，goal.name/label 均为 `Nakano City`；#6 URL 的 `sw=Nakano+City`，模型打开已观察到的 `/en/tokyo/A1319/A131902/rstLst/` 链接。#7–8 实际目录为 `https://tabelog.com/en/tokyo/A1319/A131902/`，与 addressComponents 的 Tokyo 一致。未进入错误行政区，故 Prompt25 的错区恢复没有触发，不宣称已验证恢复分支。
- **目录完成 / 直达：** #8 COMPLETE 后原生来源成功产出 5 家；原始漏斗记录解析20家、详情读取5家，Sumika 排第1并保留 `13309182` 原生直达 URI。#9 首批 CHECK，#10 已在 Sumika 详情页，无原生候选名称盲搜。Google 同店候选仍在 #15–17 做了名称搜索，不能声称所有名称搜索已消失。首个模型动作前只有一次原始 observeControls（browser-trace #1739）。
- **翻月 / 人数 / 时段：** #10 Next month、#11 Date 2026-12-10；#12–13 人数轮播，#14 Guests 8。#12–14 progress 明确日期已由来源响应确认。captured-snapshot:16:response:2 为 `rst_id=13309182&svd=20261210&svps=8&svt=1900`，正文 members=8，selection 含20:30及其原始链接。未观察到模型单独翻时段/点20:30；代码从全天响应确认该时段。#47 PRESENT_RESULTS，独立后验同店同日8人20:30仍为 true。
- **时限：** Sumika 原生供应方用时 **42.394 秒**（browser-diagnostics #116→#211），低于45秒；没有45秒超时。离线44.508秒只作历史组件基线，不作此次Live结论。

**安全与验收：** 独立请求边界 **419/419 PASS**，DATE/PARTY_TIME/POST_DELIVERY_SLOT/B1_LINK 等通过，已检测 S0=0；但 **s0Status=NOT_EVALUATED**，不能宣称完整安全验收通过。产品以原生及 Google 两个 candidateId 展示了同一实体13309182、同一 B1。原生候选的 B1_SOURCE_URL PASS；Google 别名候选该项 NOT_EVALUATED，另两项资格语义待人工复核。该缺口属于安全证据，不是仅缺资格注释，因此按冻结规则停下，未修评测器或启动r2。完整原评价不覆盖，差异见 trajectory-audit.json。

录制：47/47模型行，errors为空；页面55/59可录，拒录项原样保留。原始运行目录206文件逐字节复制、哈希核对；源目录不改。当前端到端评价未完成，不能记为 QUALIFIED_DELIVERY；03/07 按用户已复核切片仍各2/2，D02-V本轮为一次已交付待复核、一次未运行。

本次续跑消耗 **1 Live / 6 GET / 47模型**；含前一次编排中断的 r4 累计 **1/2 Live、11/20 GET、47/120模型、0/0环境重跑**，剩余 **1 Live / 9 GET / 73模型**。三份历史账本、主工作区HEAD/草稿/状态前后哈希一致；冻结源码及编排不变。Mock/Replay仅上述离线路径验证，无新增网站探查或模型验证。推证据后停止待复核，不追加运行、不修代码。
