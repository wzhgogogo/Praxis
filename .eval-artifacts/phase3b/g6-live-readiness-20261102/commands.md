# 已准备命令：阶段边界必须保留

2026-11-02 CET。本批没有执行以下真实命令。pack/请求已提交；C尚未合入，用户尚未批准Live。现在可以执行的只有本地fixture命令。

## A. C 合入后：同步、门禁、补回放

先按用户指定的C批准main合入SHA同步A工作分支，文档两边保留，budget按id并集；不合main。整体五门禁和严格G2，各项前后净树。此处不是让本批先合未批准C分支。

把复核者给出的C合入SHA传给 `PRAXIS_G6_SELECTION_MAIN`。下列fixture先过，再执行真实模型；两条都只重放P1三种措辞和P2预订轮，原开发用户文字/来源文件SHA不变。模型只替换受影响轮的Agent决策传输；初始建立、语义提取、来源和条款模型仍为同一固定开发fixture。它是隔离选店机制的真实模型回合回放，不是新的语义或条款质量评测。

```bash
PRAXIS_G6_SELECTION_MAIN=<C批准合入SHA> node --import tsx src/eval/restaurant/agent-loop/g6/booking-replay.ts .eval-artifacts/phase3b/g6-live-readiness-20261102/booking-replay-input.json 6c14aacf8291c5cf4fe8dfab8be1f36314fc49796658810218269b04da4cbc4a .eval-artifacts/phase3b/g6-live-readiness-20261102/booking-replay-fixture --fixture
```

```bash
PRAXIS_G6_SELECTION_MAIN=<同一C批准合入SHA> node --env-file=/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.env --import tsx src/eval/restaurant/agent-loop/g6/booking-replay.ts .eval-artifacts/phase3b/g6-live-readiness-20261102/booking-replay-input.json 6c14aacf8291c5cf4fe8dfab8be1f36314fc49796658810218269b04da4cbc4a .eval-artifacts/phase3b/g6-live-readiness-20261102/booking-replay-real
```

真实请求在物理fetch前逐次入共享账本，上限20，无额外回放重试。报告实际动作、Agent选择前/无Agent选择时的代码选择证据、条款模型是否调用、卡片。源码页只写包间，没写取消/卡要求，故NOT_STATED后省略条款是正确卡片结果；不向fixture补政策来凑绿。SELECT_CANDIDATE不再是必须动作。原P2缺schemaVersion保留历史，生产已有MAX_SCHEMA_ATTEMPTS=2；Live统计额外尝试，不改产品或Prompt。

## B. 仅用户批准本Live计划后：真实见证认证

不要给此命令加载.env；它只有公共GET，没有模型、Google或Live：

```bash
node --import tsx src/eval/restaurant/agent-loop/g6/development-evidence.ts .eval-artifacts/phase3b/g6-live-readiness-20261102/development-pack.json 84f4c1f98cf42fb323fda54537ddfc465e967718c9ba88e105186e371c9d5c8b .eval-artifacts/phase3b/g6-development-live/84f4c1f9-certification
```

运行产生原始响应/SHA、capture.json、未确认execution-evidence.json。认证时自己读取这些公开原文：W1/W2名称、地址、电话；W1类别与1000m范围；W2当前Tabelog与公开TableCheck详情电话/地址是否同店；Tabelog在线预约区块和四参数时段。所需5个前置GET均计入开发20，没有Cookie/登录/预约表单，没有失败重试。没有有效W1时段就停止。

这是执行期的真实证据核对，不是再改请求或实现代码。只在实际核对通过后把生成的证据文件填为reviewed=true、核对人/时间、identityChecks，以及每槽独立oracles。qualification必须有真实名称/地址/电话、完整原请求的HARD/地区核对和该店原始detailRef；不能用生产MET。页面原文、期望答案或Not-stated范围仅来自本次公开材料。请求、日期、人数与后续回合不允许覆盖。将完成的证据文件提交/记录SHA后才启动Live。

若实际确认W2没有在线预约：保留所有原始响应和尝试账目，w2ConfirmedNoOnline=true，W2证书用该detail.body.json的真实checkedAt与SHA，exists=null、evidenceMode=DETAIL_ONLY、detailRef/detailSHA256/responseSHA256均绑定原详情，删除vacancy字段；target仍逐字来自pack的13186922。仅详情结论不证明有位。不能把某天0时段当作无在线预约。电话或身份无法核对则不标reviewed，停止报告；不猜其他路径。

预先取得的认证和其真实GET尝试数由启动器导入，24h检查及原始body/SHA/请求绑定检查后才运行，不重复花一轮认证。任何过期、缺身份或证据不足都在真实模型开始前拒绝。

## C. 同一授权下：开始第一槽至串行后续槽

认证时只填写独立执行证据，不改已冻结pack。把其SHA填入命令：

```bash
node --env-file=/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.env --import tsx src/eval/restaurant/agent-loop/g6/run-g6.ts --pack .eval-artifacts/phase3b/g6-live-readiness-20261102/development-pack.json --sha256 84f4c1f98cf42fb323fda54537ddfc465e967718c9ba88e105186e371c9d5c8b --evidence .eval-artifacts/phase3b/g6-development-live/84f4c1f9-certification/execution-evidence.json --evidence-sha256 <认证文件SHA> --output .eval-artifacts/phase3b/g6-development-live/84f4c1f9-run --record-browser --record-decisions
```

Google结构化响应固定开启。仅LOCAL_CHROMIUM、无人工介入产品、无预约提交。每槽后独立核验、报告页级合格比例/原因；S0或未知安全证据即停，不自动重试。认证+后验达到开发20GET时，在下一次计账/传输前停，保留已展示权威输出供独立核对。剩15留出集额度不动。若11-05或之后执行，日期预检拒绝；先重新冻结日期，不原地改请求。

## D. 当前可执行的本地空跑

```bash
node --import tsx src/eval/restaurant/agent-loop/g6/development-dry-run.ts .eval-artifacts/phase3b/g6-live-readiness-20261102/development-pack.json 84f4c1f98cf42fb323fda54537ddfc465e967718c9ba88e105186e371c9d5c8b <新的artifact输出目录>
```

末尾加 `D3` 即在该槽注入独立后验时段消失，验证D4–D8不启动。这些是本地构造传输，不能称网站回放、当前见证或C修复验收。
