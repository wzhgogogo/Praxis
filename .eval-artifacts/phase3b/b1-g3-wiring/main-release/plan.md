# B1 G3接线发布main：复核后验证计划

- Evidence status: frozen regression / reviewed implementation, release verification pending.
- 用户日期：2026-10-31；执行原始时间单列维也纳CET（UTC+1）。
- 用户批准复核候选7e701207合main。远端main同步后仍为7c83e02e。
- 独立发布分支从origin/main构造双亲merge，避免移动其他对话正在检出的本地main；源码与复核候选逐字相同。
- 承诺：普通产品组合的Tabelog/TableCheck B1离线可用；两入口原URL及拒绝反例复用现有默认测试，已通过的两尺寸UI证据复用。
- 冻结725项原输入和本轮编排；运行五门禁及严格G2，各项前后净树，不恢复文件。失败停止，不发布main。
- 全绿后仅追加证据文档，HEAD:main快速前移推送，ls-remote核对；不改B、A、前端和身份规则。
- 真实模型/Google/网站GET/Live/真实PG均0，不加载.env；日文名任务另开分支。
