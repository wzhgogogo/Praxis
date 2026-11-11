# 条件胶囊原地编辑 — 2026-11-11 CET

- Status: 本地实现完成，未推送/未合main
- Document revision: 0.1
- Last updated: 2026-11-11 CET (UTC+1)

按用户追加决定替代底部预填：点击胶囊原位编辑，最长30字符，实时字数，Save/Enter确认、Cancel/Escape取消。确认走原需求消息接口，详情视图也不会误入G1；正常解释/重查仍遵守原路径。底部未发草稿不改、不聚焦；SSE保留编辑节点与内容，切Case不串。没有新结构化事件、存储或Prompt变化。

源码冻结**e057555225bf03ec3f08a3fdd4ef8f67cbc85f2a**，1001项SHA前后不变。净树五门禁全绿：type/arch/build、默认1591/1591、Chromium305/305与G6 154/154。[原始记录](../../.eval-artifacts/web-inline-conditions-20261111/gates/manifest.json)。严格G2未重复，复用前一切片，相关实现未改。真实模型/Google/来源GET/Live/外写0。

两尺寸相关26条通过：30字符后的额外键入被阻止、取消不发修改、SSE保留同一编辑节点、详情确认走messages而非questions，主输入草稿保持。固定模型夹具补充数字人数修正识别，仅为演示输入，不是生产语义规则。初轮24/26的两处失败是迁移测试误把批末Adjust焦点断言指向已关闭的原位框；修正该定位后26/26，原日志保留，不计产品红灯。最终完整浏览器包含这两项新增用例。

[手机原位编辑](../../.eval-artifacts/web-inline-conditions-20261111/gates/screens/mobile-inline-condition.png) · [桌面原位编辑](../../.eval-artifacts/web-inline-conditions-20261111/gates/screens/desktop-inline-condition.png) · [全部截图SHA](../../.eval-artifacts/web-inline-conditions-20261111/screenshots.json)。手机原地址http://192.168.1.102:4311已重启到本版；为固定数据Fixture，口令workspace-fixture。实际Safari/Android整条签收与[3c原有Replay待办](WEB-WORKSPACE-SLICE2-SYNC-20261111.md)不因此改变。
