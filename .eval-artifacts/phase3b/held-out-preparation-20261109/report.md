# Held-out 离线准备复核

2026-11-09 CET · **draft / not integrated，已停下等复核**。源码冻结 **5bb04c63**，基线 main 8a658179 / 产品 fc62b663。D4/D8 是已暴露开发回归，非 Clean Baseline；留出原文未触碰。

- **资格红绿完成：** 原 D8/D4 均因机械注释缺失 NOT_EVALUATED；独立补评分别为 **QUALIFIED_DELIVERY / DELIVERED_UNQUALIFIED，S0 均0**。D4 保留“追问未回答”能力失败，首轮来源身份/引文绑定通过。原评分与录制不改。独立解析公开 DOM/JSON 的身份、完整地址、同表单日期/人数/可用时段和实际入口；跨语言关联核对冻结来源原文及实体/路径/完整地址连续，不采用生产 HIGH/AVAILABLE/Guard 结论。见 `qualification-red-green.json` 和 D8/D4 侧车。
- **B1 与条款：** 用户04:31 CET在自己的浏览器确认主店 / 2 Guests / Wed Nov 11 / 8:30 PM正确带入，未确认预订，已记能力矩阵与TEST-LOG。两次 NO_PAGES 均在 PENDING/COMPLETION_RESULT_BUSY 后结束采集；仅保留该快照也仍会被G1拒绝回答，页面结算留为非阻塞缺口，完整性规则不放宽。
- **承诺与运行器：** 只导入c06e9bec指定三文件，commitment.json与原blob逐字节一致。按复核者2026-11-09解释排除注释前言参与用例哈希，全文哈希仍含前言。虚构清单覆盖哈希/顺序/日期还原/逐字子串拒绝、四类结构化条件正反例、体检失败零Live、S0即停、三次串行；普通G6/createLiveReadAssembly完成三次离线Fixture。私有请求仅留哈希，ASSISTANT回答保留供审计；独立语义Gold仍由复核者提供。见 `runner-guide.md`。
- **自检与门禁：** 同URL先Fetch后原生script的漏计已红绿2/1→2/2；Google请求中的私有回合遮盖、公开响应保留，自有凭据仍整份拒录。最终同SHA净树 **type/arch/build、默认1521、Chromium260 + G6 82、strict G2全12 PASS**；生产写死扫描新增 **0**，非测试eval开发店名/时段字面量审计0。记录见 `gates.json`、`final-source-audit.json`；前两冻结日志独立保留。
- **额度与停止：** 模型2500/已849；Live预留18、环境额度4。用户本聊天直接批准额外GET，按已说明的最坏用量追加18，留出GET **108→126**（18×[体检4+认证1+后验≤2]），来源见 `get-authorization.json`。模板未激活、旧账本未改。本步真实网站GET/模型/Live **均0**；未跑held-out、未合main、未推送。
