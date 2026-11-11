# 3c：slice2同步、设备反馈与回放阻断

- Status: draft / not integrated；本地实现待复核，3c未签收
- Document revision: 0.1
- Last updated: 2026-11-11 CET (UTC+1)
- Source of truth for: 本轮分支验证、用户反馈及剩余门槛
- Related documents: [计划](../WEB-WORKSPACE-SLICE2-SYNC-PLAN.md)、[视觉](../product/VISUAL-DIRECTION.md)

分支`codex/feat-web-workspace-slice2-sync`从c2e5cf6e建立，265435a7把main249826cc合进分支；两个祖先均核对。随后45eb89b4再次合入已获复核的A/main1bc8ec31，四冲突保留A分类对照、G1和入口/翻页行为与设备反馈。slice1已在main，不重复合入；照片分支未带入。本次最终源码冻结**45eb89b4b874e4c845188972f406529472ccfa7b**，1001份源码/配置SHA前后不变。本地commit，无push或main合入。

## 同步与实现

13个冲突：四份代码保留main的State25/TaskDefinition24、显式店名筛选和条件依据，前端适配slice2；九份文档保留main正文，只追加slice2原始历史，旧23/24标为历史而非当前能力。Core、Eval、Infrastructure、Integrations相对所同步main1bc8ec31字节不变，见[范围和写死扫描](../../.eval-artifacts/web-workspace-slice2-sync-20261111/scope-scan-after-A.json)，指定case/门店写死命中0。未新增结构化条件事件或问答存储，不拼生产链接。

- 每家店展示实际时段和逐条件来源/读取时间；首时段不重复。G1使用当前店与原有引用/NOT_STATED路径。
- 多时段B1按服务端offerId选择已有交接对象，URL只取服务端原值；出发事件记录所选offer，不取第一条顶替。
- 用户11-11设备反馈：logo改Praxis；标题、条件及卡片正文共用左边距，来源时间行对齐；胶囊点击聚焦/预填原消息路径。有效出发按钮时隐藏重复直接来源链接，没有有效B1时保留来源页入口。核对提示补为Check date and guests on the website，提醒来源会话可能留旧条件，仍不能说selected/booked。

## 70447893独立复核

触发仅限NO_VERIFIED_RESULT、必要条件完整、请求未过期、没有未完成G1、并非全部来源失败，且服务端证明有未查候选或未消费的现有续接。投影canContinue是纯读取；用户未点Find more时不自动恢复，Reducer自身commands为空。Application只在显式another-batch后启动已有有界读取，保留版本/幂等/Stop/迟到规则。已调查失败/不合格店不重读；全部失败走独立refresh。

沿用runUserInitiatedRead：用户显式开始一轮新的封顶读取，不能把它称为旧run偷偷延长。Google耗尽标记和已检查状态保留，普通Validator继续检查模型/浏览器/时限及TC身份/库存证据。3b额度和120–240秒轮间冷却在评测外层；该代码原字节未改，本轮不声称普通Web新增了外层冷却，也不声称held-out测过这个分支。

原70447893本身是独立提交，本轮read-continuation.ts与复核slice2原字节相同。新增预算保留检错：注入“清空来源额度状态”的受控错误，独立断言确实失败；恢复产品字节后同断言通过，原日志[红](../../.eval-artifacts/web-workspace-slice2-sync-20261111/continuation-quota-mutation-red.log)/[绿](../../.eval-artifacts/web-workspace-slice2-sync-20261111/continuation-after-mutation-green.log)。这是测试检错，不冒称发现并修复了实际额度退款故障。两尺寸既有续查/幂等/不重读/Stop链路亦运行。

## 验证

同45eb89b4源码的最终净树五门禁（type/arch复用首轮同SHA通过项，其余见本次复验）：typecheck/arch/build PASS；默认**1591/1591**，Chromium **303/303**，另G6组装 **154/154**；strict G2 PASS。[原始记录及更新后的输入SHA](../../.eval-artifacts/web-workspace-slice2-sync-20261111/final-gates/manifest.json)。未加载.env，无真实模型、Google、来源GET、Live或外部写入。PGlite不替代真实PostgreSQL。

先前10f7f0a9全部通过；c89f99a7默认套件发生Node24.4.1/V8 Wasm原生Check failed: end > addr，并非业务断言，原日志保留。首次隔离误用受限环境导致EPERM，纠正本地监听权限后该文件5/5；最终同业务路径完整套件通过。原生崩溃深层根因未确定，不称产品修复。A同步后首次默认1590/1591，SCRIPT地点建议0/5；该产品源码与main一致，原样隔离8/8，随后原断言完整套件复验。原失败与隔离日志均保留，资源竞争仅是假设，未宣称根因关闭。设备文案改动后旧“双入口/旧提醒文案”断言失配保留，按用户新合同更新，不改安全断言或超时。

[67张两尺寸截图清单](../../.eval-artifacts/web-workspace-slice2-sync-20261111/screenshots.json)，均为本地Fixture，不能冒充录制Replay。用户反馈另有[局域网两尺寸检查](../../.eval-artifacts/web-workspace-slice2-sync-20261111/device-feedback/result.json)：对齐、胶囊聚焦预填、重复来源隐藏和过期来源入口通过。用户提供了六项反馈，未分别确认iPhone Safari与Android Chrome整条实测通过。

## Replay：尚未通过

复用现有生产组装回放器，输入先提交SHA，OS禁止全部外连，未使用targeted entry注入、不补造响应。D01的keyword_suggest请求未找到匹配响应；原HAR有一条同路径200 JSON，具体请求/参数覆盖差异尚未定位。D02当前请求的结果页没有可接纳记录，另有两份Google详情未匹配。outer-requests只有请求索引，没有可用响应体，不能据此补造。两份实际终态FAILED，下游原模型响应不足保留。它们是REPLAY_INCOMPLETE，不能报HONEST_NO_RESULT或合格交付。[输入冻结](../../.eval-artifacts/web-workspace-slice2-sync-20261111/replay-input-freeze.json)、[四层评价](../../.eval-artifacts/web-workspace-slice2-sync-20261111/replay-evaluation.json)。

A进入分支后两份原样回放亦重复，首个录制缺口保持，未放宽回放资格。R2公开包messages仅privateMessagesSHA256，当前逐步回放器无法核对原始targetRef；用户明确选择由复核者私有环境执行。未读取私有原文/Gold或改评分器。复核者可在完整录制上运行：

```sh
/usr/bin/sandbox-exec -p '(version 1)(allow default)(deny network-outbound)' node --import tsx src/eval/restaurant/agent-loop/runners/run-observed-source-replay.ts <完整录制目录> <私有输出路径>
```

D01/D02亦需核对请求匹配及补齐必要录制后再验；不能靠本地夹具全绿替代。尚无六种场景的完整录制截图签收。

## 本机交互与下一门槛

用户本机同Wi-Fi地址http://192.168.1.102:4311，口令workspace-fixture。服务只使用固定Fixture，顶部标明；夹具时钟/HTTP UUID垫片仅用于局域网设备交互，不是实时库存或自由语义能力。重启命令：

```sh
node --import tsx .eval-artifacts/web-workspace-slice2-sync-20261111/serve-fixture.mjs
```

剩余：D01/D02请求匹配/Replay覆盖定位；复核者R2回放；两种真实手机浏览器的完整流程与真实来源链接核对；复核者确认。以上未完成前不合main，当前未推送。
