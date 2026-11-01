# TableCheck B1 普通组装主线合入

- Status: current executable / user-approved publication。
- 时间：2026-11-01，维也纳 CET（UTC+1）。
- 已复核修复：`ffe8fc8ea0088ac7fe72c506de0b99bb972b52e1`。
- 最新 main：`fceecaad717eea21f7642f1b0b1cf35b0aea218e`，已是修复分支祖先；同步后源码不变。

承诺：仅同步、冻结和验证已批准的 TableCheck B1 组装接线，再发布 main；不继续新功能、真实调用、排序/身份/链接规则改动。A原测试及输入、原Tabelog读取器、B G3与两次服务端校验保持。旧红/绿/类型修正记录原样保留，本次门禁另存。

顺序执行完整性 → typecheck → arch:check → npm test → build → test:browser:fixture → PRAXIS_G2_REQUIRE_PASS=1 test:dom-change → 完整性。运行前提交输入SHA，各步前后必须净树，任何失败立即停，不自动修复或碰运气重跑。标准G2由完整Chromium首组独占执行；严格G2单独运行。

全绿后只追加本次报告、STATUS/DEVLOG/TEST-LOG与11月摘要/索引。发布前再次核对远端main；若前移先同步重验。因本地main在其它工作树使用，在当前工作树创建main为第一父的发布合并，要求其树等于已测代码及交付记录的完整C树，正常快进推送，不force、不动其它工作树。

ls-remote核对main后，按用户明确授权通知 A 与“2026-09-15｜测试和eval优化”对话新的main提交号，再待命。无模型/Google/网站/Live/真实数据库请求，不读取或加载.env，不读私有Holdout。所有结论仍限于离线构造I/O、真实本地Chromium与PGlite组装，不声称真实网站预填或预约完成。
