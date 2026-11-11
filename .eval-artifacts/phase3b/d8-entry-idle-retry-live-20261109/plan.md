# D8一次重跑：新入口恢复机制

Status: exposed development diagnostic / not held-out。2026-11-09 Asia/Shanghai（餐厅请求按Tokyo日期）。用户本对话明确要求“重试一次d8”。仅1Live+<=3GET（认证1/后验<=2）；从29Live/378GET/784model开始，shared上限48/489、C30/381；1600模型总上限、每回合50、500秒、provider45秒、入口20秒及收尾20秒不变，held-out18Live108GET与模型只调用15/30不动。没有额外网站探查/预检或自动第二Live。

产品源码6ce1a6bc，证据4394ed7d：显式首次入口的已审核原生静态GET只有2xx后5秒无数据才中止并最多重载一次；原20秒共享预算不变。新录制应含ENTRY_NAVIGATION和retryCount。未收到响应头、4xx/5xx、POST/交互等不恢复。三类录制全开，凭据仅Node --env-file。原失败留存。

同一请求：Specializing in Nodoguro Ginza Nakamata，2026-11-11 20:30 / 2人。先原Tabelog见证1GET认证；不换日期/时段，不借旧见证冒充当前有位。如果不正向或失败，停下，不启动Live，不重试认证。静态身份仅复用原人工审阅原始证据并保留日期。认证后冻结选定请求/收据/hash，再运行原run-c-closeout-live.ts D8路径，无State/身份/模型输出覆盖。追问仍仅DISPLAYED_AVAILABLE后BOOK_THIS_OUTLET。

复用同源码全绿门禁1511/Chromium257+G678/严格G2全部12页及type/arch/build；冻结清单核对20动态合同/21独立字面量，不生成新审批。观察当前测试分流、不改.env/代理/xray/证书/Guard/Prompt。连接历史凭据指向原可核验收据，保持原采集日期，不宣称本轮预检。

独立文字形状审计的首条规则遮蔽/name敏感误报仍未修复，原PRESENT保留。本次新授权重跑为诊断，不通过改评分器、忽略S0或方法检查冒充验收。原G6、独立GETHEAD审计与录制结果分别报告。新S0或证据缺失即停止新增来源工作；原G6内部可能已读的<=2后验按实记账，不重复补读。运行后停下，结果未知时离线复核、不追加Live、不合main/推送。

## 实际认证后冻结

2026-11-09T02:04:34.924Z：原请求20:30/2有位，认证GET1；响应SHA256 63763e087c6b5e663d2646adaf541e9601907f36e0cfd9cd45f7935f0a988e9e。累计GET379/489，Live29/model784未动；后验最多2。选定时段未改变，认证不重试。
