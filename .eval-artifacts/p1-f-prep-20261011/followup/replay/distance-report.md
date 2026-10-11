# 距离回放

exposed development replay / not clean baseline。仅执行已准备的 8 条请求；原消息不变，JSON Schema 按现有 replay Runner 从生产 Schema 5 还原。8 个本地校验拒绝不计真实调用，保存在 local-validation-red/；真实调用 8，Google 0。

|种子|原样|距离注入|
|---|---|---|
|p1-seed-0129|CHECK_AVAILABILITY；未通过|CHECK_AVAILABILITY；未通过|
|p1-seed-0130|CHECK_AVAILABILITY；未通过|CHECK_AVAILABILITY；未通过|
|p1-seed-0131|PRESENT_RESULTS；通过|PRESENT_RESULTS；通过|
|p1-seed-0132|PRESENT_RESULTS；通过|PRESENT_RESULTS；通过|

按 seeds.v6 固定规则计分；0129、0130 两种模式均未通过，0131、0132 两种模式均通过，不声称距离注入已改善失败种子。候选集合、响应与原动作保存在逐条 JSON。
