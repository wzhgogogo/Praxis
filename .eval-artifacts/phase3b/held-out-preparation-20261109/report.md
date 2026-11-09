# Held-out 离线准备复核

2026-11-09 CET · draft / not integrated · 基线 main 8a658179，产品 fc62b663。最终源码冻结和同SHA门禁回执见 gates.json；此前两份冻结的完整门禁也单独保留，未覆盖。

- **资格注释红绿：** D8 原评价 NOT_EVALUATED → 补评 **QUALIFIED_DELIVERY，S0=0**；D4 原评价 NOT_EVALUATED → **DELIVERED_UNQUALIFIED，S0=0**，原 G1 追问未回答仍失败。两份原评价和录制未修改。独立 parse5 解析同次公开 DOM/原始 JSON，取得名称/完整地址、同一 form 选中日期/人数/可用时段及实际预约入口；跨语言 Gold 关联另读冻结公开原文的名称+电话/完整地址，当前实体/canonical路径/完整来源地址须一致，未采用生产 HIGH/AVAILABLE/Guard 结论。错实体/日期/人数/旧run/禁用隐藏按钮/异城市/缺冻结源绑定均不能通过。补评见 `qualification-red-green.json`、`D8/`、`D4/`，属于真实录制组件回归，不是新 Live。
- **B1 与条款：** 用户 04:31 CET 在自己的浏览器确认主店 / 2 Guests / Wed Nov 11 / 8:30 PM 正确带入，未确认预订，已记能力矩阵和 TEST-LOG。两次 NO_PAGES 都是 FACTS 的 PENDING/COMPLETION_RESULT_BUSY 在保留快照之前结束；本轮不扩大修复，G1 完整性保持，列为非阻塞已知缺口。
- **承诺与运行器：** 只导入 c06e9bec 的三个承诺文件，JSON blob 字节完全相同（SHA见 provenance）；全文哈希含注释前言、六段用例哈希不含前言，解释来自复核者2026-11-09原文核对。虚构清单覆盖承诺/顺序/日期还原/子串拒绝、四类结构化条件正反例、体检失败零Live、S0即停、三次串行。真实 G6/createLiveReadAssembly 的三次 Fixture 均完成追问条件和私有原文省略；本地真实 Chromium 验证静态原生、文档/数据Node各有独立请求记录，POST未到源站。每回合50/500秒、provider45秒、入口20秒与三类清洗不变；明确环境失败记入4次额度并停止，无自动替代运行。清单日志仅哈希/填写值，模型 messages 正文省略，独立语义Gold仍由复核者提供；不把机械注释冒充完整语义判断。入口与限制见 `runner-guide.md`。
- **自检修正：** 本地源站同一URL先Fetch后原生script收到2次，外层旧去重只记1次；改为按待结算次数配对后2/2，已纳入真实Chromium回归。私有回合若完整进入Google textQuery，录制请求体也以哈希替代，公开响应保留；自有凭据仍整份拒录。隐私遮盖仅省略模型请求messages；产品USER消息去掉原文、ASSISTANT回答和交付文案保留，仍可复核。忙碌表单不产时段注释、明确其他店铺的来源指针否决地址绑定。均不改变Guard或网络准入。
- **门禁与额度：** 最终五门禁、严格G2、写死扫描待冻结后回执。模型上限2500、已849；Live预留18，环境额度4。用户本聊天批准额外GET，按刚才所述最坏用量追加18，108→126（18×[体检4+认证1+后验≤2]）；模板未激活、旧账本不改。本步真实源站GET/模型/Live均 **0**，未读取私有原文，未运行held-out，未合main或推送。完成后停下等复核。
