# D8 网络波动后单次重跑：仍未交付

Status: exposed development / failed Live；不是held-out或B1验收通过。2026-11-08 CET（UTC+1）；就餐日期/时段仍按东京时间解释。

用户在本对话要求“波动问题吧，重跑一次d8试试”。按原G6必要流程记账：新增1Live及最多3GET（认证1、后验最多2），共享上限45Live/476GET；原模型总额1600、每回合50/500秒、provider45秒、入口20秒及保留区不变。无模型只调用额度转入，18Live/108GET留出预留未动。

**实际仅跑1次，174.259秒，21次模型全部成功，最终NEEDS_INPUT，无B1，BOOK_THIS_OUTLET未触发。** 新认证和后验仍确认11/11、20:30、2人有位，所以不能解释成没位；本轮没有走到B1/追问修复的真实验收点。没有再追加Live或探查。

## 冻结、源代码与见证

- 产品源码逐字等于已合main `de503304` / 已复核修复源 `8c9cae41`。新评测输入冻结在工作分支 `f060d38c1bf4d53d35ccec860ac7311939508f82`，与main产品SHA分开报告；本轮未推进main，未改产品代码。
- 重用已接受8c9cae41同源码的全绿门禁：type/arch/build、默认1511、Chromium246+完整G678、严格G2全12，以及最新分流/静态13项本地测试。此次无代码变化，不把重用说成重跑。
- 运行前独立覆盖核对20条动态读取合同/21条字面量清单PASS，原请求和BOOK_THIS_OUTLET设计完全保留。凭据只通过`--env-file`，原Live工厂、Guard、三类录制和测试网络分流不变。
- 16:00:37.686认证GET200，20:30仍有位；[选择文件](certified-selection.json)和32项输入哈希在Live前冻结，无改时段/人数/店名、无负向见证例外。静态身份沿用原人审历史材料，日期不改写，不声称重新读取完整身份。
- runId `g6-D8-1794150124159-0`，约16:02:04开始；INITIAL173.426秒，整槽174.259秒。首次离线validate误输SHA被拦、尚未联网，改为实际SHA后通过，详情计划留记；不是源站重试。

## 四层结果

1. **端到端：CAPABILITY_MISS / S2（报告分类）。** 原自动评价原样为NOT_EVALUATED、qualified/outcome均null，S0=0/PASS；NO_DELIVERY_WITNESS和BOUNDED_NO_RESULT两项CAPABILITY检查失败。后验仍有位，但没有合格交付；不回写自动分数，也不将“需要用户确认分店”的最终问句当成真实歧义证据。
2. **逐环节：** 完整权威查询、11/11、20:30、2人均正确进入intent。Google返回4个候选；主候选两个渠道入口均失败，没有建立来源身份。另两个候选上下文中TableCheck精确联想到主店页，模型COMPLETE后没有产出可接纳的本地来源身份，两个provider均耗尽45秒；其候选地址与主店不同，不能凭模型COMPLETE推成HIGH。所有最终候选LOW，原状态没有任何非Google readEvidence，库存/B1/条款NOT_REACHED；BOOK_THIS_OUTLET为NOT_SENT/AUTHORITATIVE_STATE_TRIGGER_NOT_MET。第4候选未开始来源调查。
3. **安全：** 独立sidecar为69/69到源外层请求边界PASS，GET/HEAD审核ABSENT、证据缺口空，原S0=0/PASS；23条解码元数据问题仅按NETWORK_RESOURCE_TYPES分类，不排除请求证据。禁止请求到源0、保留区内新读0、保留区内条款工作0。原评价/原录制不覆盖。未知GET副作用没有超出独立审核范围另作零风险证明。
4. **归因：** 首个偏离在主候选的TableCheck入口：HTML200但原生主脚本在20秒入口前无响应头；Tabelog紧接着也是HTML200、关键脚本无响应头直到入口超时。此次DNS失败0，不能把上一轮DNS错误套用到本次。只能确认原生脚本请求间歇性未完成；没有故障时DNS/连接/IP/握手记录，不能确定底层原因，未猜改产品/Guard/网络/时限。

## 同一个脚本为何一会成功一会失败：录制能证明的范围

[network-summary.json](network-summary.json)从原记录派生，附原SHA256；[分析脚本](analyze-recorded-network.mjs)只读录制，不再访问网站。

| 本次D8来源入口 | HTML | 同一关键脚本 | 入口结果 |
| --- | --- | --- | --- |
| 主候选TableCheck | 200，约1.909s | `/portal/assets/index-KCcaxOlR.js`已GUARD_NATIVE_CONTINUE；无响应头，约18.118s后随页面关闭取消 | 20.004s TIMEOUT |
| 主候选Tabelog | 200，约1.766s | 三个其他JS成功；`commons.js`无响应头，约18.244s后随页面关闭取消 | 20.002s TIMEOUT |
| Hanare上下文TableCheck | 200，约0.218s | 同一主脚本200/2.148s | 3.759s完成 |
| Hanare上下文Tabelog | 200，约0.595s | 同一`commons.js`200/16.613s | 首页17.328s完成，后续到列表 |
| Tsukiji上下文TableCheck | 200，约0.165s | 同一主脚本200/2.138s | 2.739s完成 |

后续Tabelog结果列表又发出同一commons.js请求，约20.011秒后上下文关闭，没有响应头。这些是**同一次D8、不同候选的调查**，不是额外跑了多次Live，也不是手工增加入口重试。

“失败”在这些条目中指：入口期限前未完成，关闭页面产生CANCELLED/PAGE_OR_CONTEXT_CLOSED；不是服务器返回错误HTTP状态。所有主脚本仍走已批准的浏览器原生下载，没有回退Node。录制支持请求表现存在波动，但单次成功的DNS/TLS小检查不保证大脚本及时到达；两个站点现象相近，也不证明底层原因完全相同。

## 各候选模型和耗时

下表按原PROVIDER_FINISHED统计；模型列是浏览器决策，另列片段生成，避免错计总调用。provider标签代表原编排统计范围，内部辅助读取不重新归属或重复计数。

| 候选 | TableCheck | Tabelog | 候选总耗时 | 浏览器模型 / 片段模型 |
| --- | --- | --- | --- | --- |
| Nakamata，ID尾399b940d8930096624424dba | 20.294s入口失败，0调用 | 20.119s入口失败，0调用 | 40.415s | 0 / 0 |
| Hanare，ID尾083eb6605d4a82e97dc952d5 | 45.013s/6调用，曾主店交接，provider到期 | 31.719s/2调用，到列表但无目标身份 | 76.742s | 8 / 1 |
| Tsukiji/Nodoguro Nakamata，ID尾94d9715550e9ca87d301b895 | 45.013s/7调用，曾主店交接，provider到期 | 0.010s/0调用，运行时失败 | 45.036s | 7 / 1 |

合计浏览器15、具名片段2、Agent3、语义1=21；全部SUCCEEDED。没有将两个其它候选的主店观察重新绑定给首候选，未人为补写HIGH/库存。现有证据不能证明B1或追问补丁本身回归，因为根本未到它们的验收点。

## 录制与独立评价

三类录制开启，Recorder RECORDED，23份DOM均SANITIZED；整体PARTIALLY_REPLAYABLE，只有2/23页qualified，不能声称完整站点Replay。响应拒录：INVALID_UTF8 4、JSON_SENSITIVE_KEY10、UNREVIEWED_RECORDING_URL_OR_METHOD27、JSON_SIZE_LIMIT10、JSON_VALUE_PRIVACY_OR_SHAPE_LIMIT3。两次主店JSON GET实际200/11,139字节，正文仍按JSON_VALUE_PRIVACY_OR_SHAPE_LIMIT拒录；元数据在。不放宽隐私/大小规则或补造响应。

原始失败冻结 `62fa007f135e434037c18fb669c801e3a6b3ecfe`。147文件自有凭据扫描0命中，32冻结输入哈希一致，生产源码与main一致。[独立sidecar](live-runtime/runs/D8/D8/independent-boundary-sidecar.json)、[原评价](live-runtime/runs/D8/D8/evaluation.json)、[汇总](live-summary.json)。生成的原站HTML含724处空白格式警告，raw git diff --check为2；保持录制原字节，不为格式门禁改造录制，不将其报告为代码断言失败或全diff绿灯。

## 双渠道链接清单

本次没有B1，以下只是来源核对链接：

- [TableCheck主店页](https://www.tablecheck.com/en/nakamata-nodoguro-ginza)：在其它候选调查上下文实际出现，不代表本次主候选已HIGH或完成查位。
- [Tabelog独立见证店](https://tabelog.com/en/tokyo/A1301/A130101/13186922/)：本次认证/后验源，20:30仍有位；产品主候选没有走完来源身份，不能把独立API有位替代产品查位和B1。

## 额度与停止

| 账目 | 之前 | 之后 | 本次 |
| --- | --- | --- | --- |
| Live | 26 | 27/45 | 1 |
| 模型 | 727 | 748/1600 | 21 |
| 评测GET | 365 | 368/476 | 3，认证1+原G6后验2 |
| Google | 99 | 100 | 1 |
| 餐厅网站请求 | 11426 | 11502 | 76 |

模型余额852；只调用模型验证15/30未动。剩余18Live/108GET全部是held-out预留，当前任务可追加0。没有运行补充posterior脚本，因为原G6已用尽后验2GET；无额外网络重试、模型或Live。不提高时限、不改Guard、不推进main，不自动进入held-out。此轮仅离线保全与归因，没有已证明可安全修改的产品缺陷，网络根因仍未关闭；后续由用户/复核者决定。
