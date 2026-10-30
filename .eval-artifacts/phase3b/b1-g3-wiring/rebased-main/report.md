# B1 G3接线：已重放到G3 main并完成复验

- Evidence status: **draft / not integrated — ready for review**；仅C分支，不合main。
- 时间：2026-10-30，维也纳CET（UTC+1）；正式检查11:28:28–11:31:38。
- 分支：`codex/feat-phase3b-b1-g3-wiring`。
- main基线：`7c83e02ee78ccb18c9ddf6670a64823bb18a2c95`，已含G3、G3c、前端4cbc521b和ADR-0050。
- 旧远端交付：`20ff1466bf191e1ff5dff5b99128eb82c79aca11`；重放后候选adc15dc4；正式冻结提交：`ec58c3ec40493ed6aa4960db96a1707b496b222f`。

## 同步与范围

按用户已经批准的“G3入main后rebase、五门禁、严格G2”执行。8个C提交在新main上重放，源码冲突0；文档冲突保留双方记录并整理revision元数据。原停止点f861befe及原准备交付的全部输入/原始红绿日志/截图原样保留，没有把旧基线结果改成新基线通过。

对新main，B的tabelog-browser-availability.ts、tabelog-query-controls.ts、tabelog-vacancy-response.ts，A的src/eval与src/harness，前端src/web、所有ADR和共享账本均无C差异。缓存、root Task作用域getter及read-assembly代码与20ff1466逐字一致。新main的结构化selectionHint/verificationHint/cancellationConfirmation、查看上下文校验与字体资源路径完整保留；没有增加Prompt/Schema/State/TaskDefinition版本或改变链接、身份、权限和副作用规则。

本分支普通启动已注入B1来源读者，但C接线尚未合main。Tabelog链接继续只消费G3已核对的formCourseLinks/sourceResponse，先生成后展示的两次服务端校验保留。绝对链接原文不变；根相对链接只补可信来源origin，其路径、参数顺序和编码不变。原生路径ID仅以相同来源ID的数字组件核对rcd，完整候选与证据身份相等仍必需。此前有效缺按钮红灯及全部拒绝反例见[准备报告](../implementation/report.md)。

## 当前基线的实际检查

| 检查 | 结果 |
| --- | --- |
| npm run typecheck | PASS |
| npm run arch:check | PASS |
| npm test | 1254/1254，失败/取消/跳过0 |
| npm run build | PASS |
| npm run test:browser:fixture | 186/186，129.449秒 |
| PRAXIS_G2_REQUIRE_PASS=1 npm run test:dom-change | 5/5测试，12/12保存页面PASS |
| 当前UI + 实际HTTP投影产物 | 2入口 × 2尺寸PASS；未访问来源、未提交写请求 |
| 运行前后SHA | 725/725一致 |

正式记录为本目录gates.json与gates/。9个步骤每项前后git status --porcelain为空；没有恢复文件来清理状态。完整原文、时间、命令和输出SHA已保存。main新增字体包在本工作树缺失，已由`npm ci --offline --ignore-scripts --no-audit --no-fund`从本机缓存恢复（74包，未联网或运行生命周期脚本），package/lock未改；两份实际渲染字体字节也冻结。

生产HTTP组合仍走Interpreter/Compiler/Agent/Validator/Router/实际G3解析器/Reducer/PGlite，只有模型和Google/BrowserSession来源I/O为构造fixture。默认套件实际复跑普通组合的原绝对链接、根相对链接、缺链接、日期/人数/时刻/店号/域名/路径/额外参数拒绝、同钟跨Case隔离、跨用户拒绝、新应用无来源缓存和过期不重读等覆盖。

## 新main界面核验

旧UI观察器不作为当前界面通过证据。本目录自有观察脚本只改观察入口，未改A评测、harness或前端：先由上述真实HTTP测试产出web/http-view.json，再用未修改的main产品页面及本地字体，在1280×900和390×844的真实Chromium中通过My plans→Choose this进入交接视图。

两个当前公开入口为“Continue on Tabelog ↗ / Date, time, 2 guests filled in”和“Go to source website ↗”。两个尺寸的两个href均逐字等于独立字面量：

`https://tabelog.com/en/booking/form_course/new?visit_time=%31%39%30%30&member=2&rcd=13123456&visit_date=20260809`

检查保留原参数顺序/编码和filled in语义，没有selected/booked声明。Choose this只改变当前视图：观察到的写请求为0，原投影selectedCandidateId仍未设置。没有激活外部出发链接。页面错误0、外站请求0；已目视核对桌面和手机截图。web/web.json、web-desktop.png、web-mobile.png为原件。

此项是“实际HTTP产物→当前真实本地Chromium渲染”的两阶段验证，不称为当前网站或完整外部Live；没有为适配新界面削弱URL oracle。

## 交付与未运行

本次真实模型、Google、网站GET、Live、真实PostgreSQL调用均0，不读取.env，不跑私有Holdout，不进入任何预约流程。PGlite仅为本机HTTP集成。真实网站预填、当前库存与现实预约均未运行，沿原Live前清单。

G3合main后用户要求的rebase及重验已经完成。只发布C分支，使用已知旧远端20ff1466的精确force-with-lease防止覆盖他人新提交，并以ls-remote核对；不合/推main。停在复核点，等用户批准下一步。
