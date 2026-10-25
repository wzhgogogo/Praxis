# 停止点 3：录制器第三方 URL 凭据修复

- 完成时间：2026-10-25T03:31:14.348284+01:00（CET UTC+1）。状态：current executable / 已暴露离线回归。
- 分支：codex/fix-phase3a-prime-recording-keys；起点为先合入并推送的 main/28216ae330d64efcf48853c90fa783f872fca11e。
- 最小来源/初始反例提交：efb78d84；实现及实际 Chromium 控制：d067bf7f；最终自有凭据补丁与五门禁精确提交：05991efd39903d2fae094e209c9bf973381223c5。

## 结果

文档在进入回放与诊断文件前，把第三方 URL 的 key、apiKey/api_key、signature、client/client_id、token 等查询值替换为固定 REDACTED。覆盖 src/href/srcset/imagesrcset、data-*-src/data-srcset/data-*-url 等 URL 属性，也处理单/双引号、无引号、协议相对 URL、HTML 实体与多个 srcset 候选。原有表单 action、PII、脚本及URL接纳规则继续执行，未扩大 Guard 权限。

原 keyPattern/keyField 扫描表达式逐字未变；增加实体/URI解码检查。普通残留模式命中只排除该页/响应/条目；依赖被排除响应的页仍明确不可回放，不伪造完整捕获。写前及写后都逐条扫描，保留其余安全项，再扫描精确序列化字节。无 Google 传输的录制同样扫描。

实际 Live CLI 把有效 Google 与模型凭据仅在内存中交给录制器；Google 请求头/敏感 query 中的自有值也登记。原始文档/响应/trace 在脱敏前检查，命中自有凭据整份拒绝：不写 HAR、DOM、CSS、截图，只留无凭据的 recording.json 拒绝记录，所有页标不可回放。写后命中也整份拒绝。原始 Google JSON/请求 body 的安全响应字节不改，API key 不写入头或 query。

## 红绿与实际链路

- [初始红灯](red.log)：efb78d84 在旧录制器上，地图安全页被整包 NOT_REPLAYABLE；自有凭据命中仍已写出部分DOM，两条目标断言均失败。
- [最终局部绿灯](green-focused.log)：25/25，包括 src/href/data-* 与 srcset、普通页/响应隔离、已排除动态响应的依赖页不合格、自有 Google/模型凭据、编码URL、原始Google响应/trace，以及写前/写后控制。原整包拒绝普通命中的旧断言按用户新合同改为保留安全条目；自有凭据整包拒绝有独立控制。
- 开发中的旧断言迁移和无引号URL中“=”截断分别见 attempt-*.log；均在冻结门禁前修复，初轮五门禁全绿，随后交付检查补充自有凭据短路边界并完整复跑，原证据保留。
- [真实 Chromium/Guard 控制](green-control.log)：槽1第6页 img[data-lazy-src] 最小元素摘录，以合成凭据替换原公开值，采集日/原DOM/归档SHA及原查询值SHA见 [provenance](source-provenance.json)。没有把整份历史运行复制进产品测试。
- [实际产物](validation/summary.json)：localhost 原录制3次GET，fixture Google传输1次；HAR包含安全地图文档和原始GoogleJSON。回放消费第1页，遇第2页 UNCAPTURED_STATIC_DEPENDENCY明确 REPLAY_INCOMPLETE；来源请求0。诊断DOM未充当回放文档；未回放质量 NOT_EVALUATED，Live分母 EXCLUDED。
- recording/ 下所有文件检查无原/合成 key、signature 或自有凭据字面量；[输出SHA](validation-manifest.json)。现有完整 Runner 回放与交付、OS断网/缺响应/部分录制控制由浏览器全门禁继续验证。

## 最终五门禁

交付检查补充：5cb751e3先冻结“响应因第三方模式拒绝，同时请求体含自有凭据”的反例，[红灯](red-owned-body.log)为误留 REPLAYABLE；响应和请求体改为独立扫描后[7/7绿灯](green-owned-body.log)。最终候选05991efd重新完整跑五门禁；初轮5de17530的五项全绿保留在 [原记录](gates/gates.json)，不覆盖。

单次耗时，不是中位数；[最终freeze.json](final-candidate/freeze.json)、[最终gates.json](final-candidate/gates/gates.json)。

| 门禁 | 结果 | 通过项 | 秒 | 每项后 Git status |
| --- | --- | --- | --- | --- |
| typecheck | PASS | — | 0.481549 | 空 |
| arch-check | PASS | — | 0.183641 | 空 |
| npm-test | PASS | 1037 | 22.949792 | 空 |
| build | PASS | — | 0.510334 | 空 |
| browser-fixture | PASS | 154 | 93.159010 | 空 |

冻结前后SHA一致，恢复0，无端口/浏览器资源冲突。交付仅同步报告、证据和导航；实际实现、fixture、断言、编排与本候选一致。

## 四层结论与边界

1. 端到端：录制安全HAR可写并在已录范围回放，到首个不合格页停止，未声称整单 F5 成功。
2. 逐环节：原始输入检查 → 第三方URL脱敏 → 普通命中局部排除/自有命中全拒 → 写前/写后扫描 →真实Guard回放与明确停止。
3. 严重程度：本控制无餐厅交付，交付声明S0不适用；原凭据落盘风险由禁止发布与读盘扫描验证，不用评测器“通过”替代凭据检查。既有Runner完整交付与独立evaluator@34断言继续全绿。
4. 归因：测试基础设施误拒绝及提前发布内容的顺序问题已离线关闭。槽1原始101页缺HAR/响应不能补造，本控制不是整份F5回放；历史Live结论不更改，真实来源时序与库存未新增验证。

新增真实模型/Google/网站/Live/环境重跑均0。产品层、Prompt、产品Schema、Guard、两个站点、source-packs.ts 均无改动；3864/473行不增。按授权合入、推送后停止。
