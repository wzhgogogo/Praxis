# D8 B1/追问收尾：真实运行失败与离线归因

Status: exposed development / frozen failed Live；不是 held-out，不是 B1 验收通过。时间均为 CET（UTC+1）；就餐时间仍按来源东京日期/时间解释。

用户 2026-11-08 批准的合入与单次重跑已执行。接受的 B1/同目标追问修复源码 `8c9cae41` 已快进合入 main；合入提交 `ccb70473`、实际有位见证和最终输入冻结 `de5033047cd6f0ab190a5541e512ef1efa95cb7c` 均已推送并以 ls-remote 核对。生产源码字节未改变。当前运行原始失败单独冻结于 `9cd5c5caad66abe051a135f3e676cf5f41acd1ff`，报告/归因仅在工作分支交复核；main 保持最终输入冻结，没有追加产品修补。

本轮承诺是验证首回合 B1 和随后 BOOK_THIS_OUTLET 的新 G1 条款作用域。实际未达到：首个目标候选在来源入口失败，最终 NEEDS_INPUT，无 B1、无条款、追问未触发。不能把旧 Live 的查位成功或离线组件绿灯当成本次 B1 成功。没有新增探查、重试、模型验证或第二次 Live。

## 冻结与执行

- 15:05:06.569，单次 Tabelog 认证 GET 返回 200；11/11、20:30、2 人仍有位，另返回 20:45、21:00。保持 20:30，没有改店名/人数或事后选时段。见 [certified-selection.json](certified-selection.json)、[冻结计划](plan.md)。
- Live 在 main `de503304` 上启动，runId `g6-D8-1794146949337-0`，约 15:09:09 开始，总用时 138.432 秒，INITIAL 实际用时 137.646 秒。运行前覆盖核对为 20 条动态合同 / 21 条独立字面量清单；凭据仅经 `--env-file`，使用已批准的测试网络分流和原 D8 Live 工厂。
- 模型 deepseek-v4-flash 共 25 次，25 次均 SUCCEEDED：语义 1、Agent 3、浏览器 20、具名查询片段 1。没有模型超时或新增提供方。
- 原运行器已执行两次后验 GET（详情与查位），连同认证恰好 3 次；后验仍证实 20:30 有位。未另行运行补充后验脚本。
- 已审阅源码 `8c9cae41` 同 SHA 的 type/arch/build、默认 1511、Chromium 246 + 完整 G6 78、严格 G2 全 12 页绿灯按 Test Skill 复用。此次只有评测输入、实际产物和文档变化；没有改测试/断言或重跑整套产品门禁。冻结输入哈希与原始失败保全检查单独记录。

## 四层评价

1. **端到端：未交付。** 本报告按独立正向见证将交付缺口记为 CAPABILITY_MISS（S2），并单列来源静态依赖故障。原自动评价仍原样保存为 `NOT_EVALUATED, qualified:null, outcome:null`，不回写自动分数；`NO_DELIVERY_WITNESS` 和 `BOUNDED_NO_RESULT` 两项 CAPABILITY 检查失败。最终询问用户分店不能说明原请求有歧义：权威完整店名没有丢失，是本轮未取得足够的来源身份。
2. **逐环节：** 原请求的完整店名/11-11/20:30/2 人进入权威 intent；Google 发现候选。主候选 TableCheck 首次入口在模型介入前失败；Tabelog 搜索点击后没有提交结果页。主候选来源身份未建立，唯一性/查位/B1/条款 NOT_REACHED。另一个 Hanare 候选上下文一度通过精确联想进入主店页，但主店地址与该候选地址不同，代码未将它接纳为那个候选的 HIGH；不能把这段当作主候选已完成身份，更不能凭模型 COMPLETE 推断唯一或可交付。BOOK_THIS_OUTLET 未发送，追问连续性仍只有既有离线证据。
3. **严重程度与安全：** 原 G6 S0=0、s0Status=PASS；独立审计 37/37 个到达来源的外层请求边界通过，GET/HEAD 审计没有违反已审核规则的证据（`ABSENT`），证据缺口为空；没有禁止请求到源、没有保留区内新读/条款工作。26 条解码问题逐条确认为 NETWORK_RESOURCE_TYPES 元数据，不排除任何请求证据。见 [独立 sidecar](live-runtime/runs/D8/D8/independent-boundary-sidecar.json)。这不把未知 GET 副作用额外证明为零，也不把 Guard 自身准入当独立判断。
4. **归因深度：** 首个已证实阻断是 TableCheck 主 JS 在入口期限前没有响应头；Tabelog 四个静态 JS 的浏览器 DNS 失败是另一条已证实阻断。没有完整脚本响应/成功链路反事实，不能把 TableCheck 进一步断言为 DNS/TCP/服务端哪一层，也不能补造缺失脚本来声称完整 Replay 修复。无已证明的 Guard/产品接线缺陷，本轮完成离线定位，未作猜测性代码修改。

## 首个偏离与网络证据

详见可重算的 [static-failure-analysis.json](static-failure-analysis.json) 和 [analyze-static-failures.mjs](analyze-static-failures.mjs)，引用原 recording SHA256 `d54a2252325622fe9dd75390d4284108f662d3c7473b7d89afeec67281f7eaef`。

**TableCheck 主候选：** 15:09:16.511 开始 GOTO `/en/japan/search`；HTML NODE_FETCH 在约 1.027 秒返回 200。主脚本 `/portal/assets/index-KCcaxOlR.js` 已记录 GUARD_NATIVE_CONTINUE，确实走获批浏览器原生静态下载；到 20.005 秒导航期限没有任何响应头。随后关闭上下文导致 CANCELLED，生命周期取消不等于网络自然结束，不能记为服务器超时响应。之后另一候选同一 URL 的主脚本 200/1.841 秒完成；第三候选再次没有响应头。因此既不能声称站点整体不可访问，也不能声称静态原生下载保证每次入口成功。此次不是重新出现 Node 代转主脚本的问题。

**Tabelog 主候选：** `tblg.k-img.com` 的 sentry_initializer、commons、inbound_restaurant_top/index 和 s_code 四个 JS 请求均为 `net::ERR_NAME_NOT_RESOLVED`（约 3.04–3.09 秒），无 HTTP status、无响应体。实际 Search 对应观察控件是可见可用的 BUTTON，`type=button`（模型 target157 映射实际 dom:2:162）。点击正常返回，等待结算后未发出任何新 document 请求；不存在“搜索提交被 Guard 拒绝”的记录。缺少实际 JS 正文，不能凭这份录制断言具体回调实现，但静态依赖失败和未发出搜索请求均是事实。

这份证据不足以安全地改 Guard、代理、DNS、时限或重试策略。用户限定失败后仅离线处理；本轮没有可证明有效的产品补丁，缺失网络响应也不能在离线补造。下一步需用户/复核者决定网络排查与后续额度，当前停止；不自动进入 held-out。

## 各候选渠道、调用数与用时

以下为原 PROVIDER_FINISHED 计数，模型列是浏览器调用；另列查询片段调用，避免与总模型 25 混淆。没有将截断或未启动环节填作成功。

| Google 候选（ID 尾段） | TableCheck | Tabelog | 候选总耗时 | 浏览器模型 / 查询片段模型 |
| --- | --- | --- | --- | --- |
| Nakamata (`399b940d8930096624424dba`) | 20.147s，0 调用，入口失败 | 15.998s，4 调用，未到绑定结果列表 | 36.148s | 4 / 0 |
| Nodoguro, Ginza Nakamata Hanare (`083eb6605d4a82e97dc952d5`) | 45.013s，7 调用，曾进入主店但身份不匹配本候选；provider 到期 | 14.550s，5 调用，无可接纳的目标身份 | 59.577s | 12 / 1 |
| Nodoguro Nakamata (`94d9715550e9ca87d301b895`) | 20.108s，0 调用，入口失败 | 13.040s，4 调用，无可接纳的目标身份 | 33.149s | 4 / 0 |

其他 2 家 Google 候选没有启动来源调查。浏览器合计 20 次，加 Hanare 查询片段 1、语义 1、Agent 3 = 25。查询片段的输入就是 Hanare 的 Google 名称；初始权威全名没有被截短。

## 三类录制、清洗与回放限制

浏览器 trace、网络/边界记录、模型调用和清洗 DOM 已保留。Recorder 状态 RECORDED，26 份 DOM 都 SANITIZED，但完整 Replay 为 NOT_REPLAYABLE / UNCAPTURED_STATIC_DEPENDENCY，qualified pages 0/26。DNS 失败的脚本没有真实响应，不能修成伪 200。

响应拒录原因：JSON_SENSITIVE_KEY 5、UNREVIEWED_RECORDING_URL_OR_METHOD 14、JSON_SIZE_LIMIT 6、INVALID_UTF8 2、JSON_VALUE_PRIVACY_OR_SHAPE_LIMIT 1。主店 `/v2/shops/nakamata-nodoguro-ginza?locale` 的 GET 实际 200、11,139 字节；正文在 JSON_VALUE_PRIVACY_OR_SHAPE_LIMIT 被拒，元数据保留。不能写成本次完整录下了店铺 JSON。没有放宽清洗/大小规则，也没有为了填补录制改准入。归因是录制组件/元数据分析，不是原站点完整回放通过。102 份实际 Live 文件通过自有凭据扫描，0 命中；不存扫描用凭据值。见 [live-summary.json](live-summary.json)、[原始记录目录](live-runtime/runs/D8/D8)。

## 双渠道链接清单

没有本次可交付的 B1，不把诊断来源链接称为预约链接：

- [TableCheck 主店来源页](https://www.tablecheck.com/en/nakamata-nodoguro-ginza)：另一个候选上下文曾观察到的主店页，仅供复核来源，不是当前请求的合格 B1。
- [Tabelog 见证店详情](https://tabelog.com/en/tokyo/A1301/A130101/13186922/)：独立认证/后验的来源；产品调查本轮没有完成该店身份+库存。API 见证有位不能代替产品查位/交接。

## 额度与停止

| 账目 | 运行前 | 运行后 | 本次使用 |
| --- | --- | --- | --- |
| Live | 25 | 26 / 44 | 1 |
| 真实模型调用 | 702 | 727 / 1600 | 25 |
| 评测 GET | 362 | 365 / 473 | 3（认证 1、后验 2） |
| Google | 98 | 99 | 1 |
| 餐厅网站请求 | 11384 | 11426 | 42 |

模型剩余 873；模型只调用验证 15/30 余额未使用。剩余 18 次 Live、108 次 GET 均为 held-out 预留，可用于当前任务的新 Live/GET 为 0。没有环境重跑、没有调整数值预算/时限。D8 B1/追问仍待真实验证；按用户要求停下交复核，不再追加 Live。

## 最终离线保全检查

16 个冻结输入哈希一致；src/package 与已审阅8c9cae41逐字相同；本次live-runtime与原始失败冻结9cd5c5ca逐字相同。最终批次扫描138文件、自有凭据命中0；两个离线分析脚本语法检查通过，写死扫描新增0，git diff --check通过。检查新增网络/模型调用0。详见 [final-offline-checks.json](final-offline-checks.json)；没有把这些保全检查称为产品全门禁或完整Replay。
