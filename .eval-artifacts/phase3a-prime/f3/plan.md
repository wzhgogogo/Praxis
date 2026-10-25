# F3僵硬代码审计与F6窄ADR草案

- Document revision: 1.0
- Evidence status: draft / not integrated；已暴露开发证据
- 基线main e096ba35dbc77d6852fa4875dbeadaae92835ffe；执行时间2026-10-25T20:55:55.162732+01:00 CET UTC+1；复核编号20261026。

切片承诺：只用固定Git源码、既有Live/DOM/HAR和本地构造fixture，输出逐项audit.csv、证据引用、Guard/ADR-0036补充草案、class改名观察/完成判定对照、Ebisu/Omotesando/OPTIONS/首10秒超时分析和≤3591行删改计划；另起草F6有界收尾预留ADR。查明已证机制与缺证，不实现任何规则或Prompt/Schema变化，不重评历史Live。

验收：F5已全绿合入推送；F3源码/测试/Runner/Prompt/Schema/Guard/站点/Pack与main零差异，预算原字节不变；本地真实Chromium只接loopback或固定HAR，模型/Google/网站/Live/环境重跑新增0。既有来源fixture只改变私有class名，原文件不动，运行前提交脚本、变换和SHA。新规则的红绿灯本批仅设计；观察实验不冒称网站回放或修复已绿。

交付按Planning/Test/Eval/Post-change：本地实验和历史Live分开；无新增产品代码，后续不重复五门禁替代审计。本批在停止点4交用户批准草案；不实施F3/F6、不合入或推送本审计分支（原§1不推送规则）。
