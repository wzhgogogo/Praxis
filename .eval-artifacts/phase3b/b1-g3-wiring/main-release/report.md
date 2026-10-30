# B1 G3接线：复核后发布main

- Evidence status: reviewed implementation / frozen release verification PASS.
- 复核候选：`7e701207caafae434beb632daf9795aa26da0553`；合入基线：`7c83e02e`；门禁冻结：`47c6c5efee488a5547abc6123a01997d7a2ac99f`。
- 执行原始时间：2026-10-30T17:39:32.725682+01:00 至 2026-10-30T17:42:37.217500+01:00（维也纳CET，UTC+1）；会话客户端日历为上海2026-10-31。
- 源码与复核候选完全一致；未修改B三文件、A评测/harness、前端或ADR。

五门禁全绿：typecheck、arch、build PASS，默认1254/1254，Chromium186/186（129.171秒）；严格G2 5/5及12/12页面PASS。8步每项前后净树、728输入SHA首尾一致，无restore；原始gates.json与各日志单列。

两个交接入口的原URL、相对链接前缀、错误参数/域名/路径拒绝、跨任务/用户和时效边界由同一生产组合HTTP测试重跑。当前源码与UI未变化，复用[两尺寸真实Chromium证据](../rebased-main/report.md)，不再另开网站。Tabelog/TableCheck B1均为离线可用；真实网站带入情况仍待首次Live，未产生预约。

用户批准main合入并推送。使用发布分支形成正常双亲merge，源分支及其他工作树不移动；远端main仅快速前移，不force。源码在门禁后不变，只补本报告及状态/历史文档；远端以ls-remote核对实际发布SHA。

当前真实模型、Google、公开GET、Live、真实Postgres均0；不加载.env。日文名另开产品接线分支，最终清单仍需复核，当前不发出任何来源请求。
