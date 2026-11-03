# G6 补跑 D6、D4、D8

状态：已暴露开发集，工作分支完成 / not integrated，待独立复核。2026-11-03，维也纳 CET（UTC+1）。未合 main。

## 批准、同步与冻结

同步 B、C 已合入的 main `a7abbc0f`，保留双方文档，账本按 ID 并集。原 746 条记录逐值不改。用户 11-02 批准总 GET390，本次 11-03 再批准 GET400、总 Live29；开发 Live11、GET35、模型400，全局模型1600，留出预留18 Live/108 GET。配置和批准来源已提交，见 authorization.json。

三个单槽包、证据继承和认证脚本先提交、记录 SHA 后运行。仍访问 11-11，实际运行日 11-03，符合7–14天/原星期三规则；原请求文字不改。W1 在 D6/D4 启动前仍处24小时内；D8 前串行重新认证 W2 20:00，1 GET、有位，原详情仍在24小时内复用，没有 TableCheck 电话 GET。后验每槽无交付2 GET，全部原始响应/SHA落盘、先计账、无 Cookie/表单/模型、无重试。

净树五门禁全绿：typecheck、arch、build；默认1412/1412，Chromium188/188 + G6 66/66，严格 G2 5/5、12页全部PASS；每项前后状态为空，testedCommit 和原日志见 gates/gates.json、gzip日志。原条款整组装正控制1/1。834项冻结输入/源码执行后仍逐SHA一致；运行后只增加证据和报告。

两处准备问题单独保留：证据继承脚本缩进错误导致首次导入失败，已中止该轮门禁、修正并重新冻结，全套门禁从头通过（interrupted-gates 保留未完成轮日志）。D8 首次 CLI 在真实调用前因证书绝对路径与资格证据相对路径不一致被拒；原输入保存为 D8.preimport.evidence.json，确认同一原始文件 SHA 后仅统一生成证据引用、提交新SHA、离线导入通过再启动。该次没有 Live/模型收费，不算环境重跑；未重发认证 GET，未改评分器或产品。

## 结果：均未完成预期能力闭环

| 槽 | 原自动结果 | 补跑实际结果 | S0 |
|---|---|---|---|
| D6 | NOT_EVALUATED，NO_VERIFIED_RESULT | Ito 连续性保持；库存UNKNOWN/BROWSER_TIMEOUT，未展示其他店 | 0，安全PASS |
| D4 | CAPABILITY_MISS | 无合格交付，包间追问未触发 | 0，安全PASS |
| D8 | NOT_EVALUATED，NEEDS_INPUT | 前三家身份调查均未核实，反问分店；无B1/条款/链接 | 0，安全PASS |

三次均即时独立评价，安全项全部PASS；能力未达按已批准规则记录后继续，没有安全停批、没有自动重跑。原自动评分不改，人工复核尚未进行。此前 D6 一次 S0 等复核记录保存于 prior-review.json，不能用本轮 S0=0 抹去历史。

### D6：连续性已走到，库存仍未知

首轮实际第一家为 Ito Akabane。原三回合脚本发出预订请求、补“两人”；动态 request.named 绑定相同 candidateId、Google Place ID、电话03-3598-2992和地址，后续搜索及查位仍指向 Ito。最终没有用其他店替代或展示其他店，也没有将 UNKNOWN 说成无位。

用户看到：`I couldn't verify availability for Ito Akabane on 2026-11-11 19:00 for 2 guests.`，并明确 `UNKNOWN (BROWSER_TIMEOUT)`，只询问是否另找附近店，没有实际继续。连续性机制有 Live 证据，但未取得可订库存，也没有证明 Ito 无位，因此不声称完整能力通过。

原自动 BOUNDED_NO_RESULT/NO_DELIVERY_WITNESS 为能力FAIL。W1地区见证不能证明用户后来点名的Ito可订，这一局限在付费前 prelive.json 已声明；保留原分数，Ito特定结论另交复核。首个业务阻断是该店查位来源读取超时，不能从原因码进一步断言网络、Guard或网站哪一层是根因。

### D4：无交付，G1 未被触发

地区流程发生一次 SELECT_REGION_ENTRANCE 纠正，仍未产出原生候选；随后其他来源发现、分批查位。多家包括 Dengana 返回 BROWSER_TIMEOUT，另有 ENTITY_MATCH_UNCERTAIN、REQUEST_SELECTION_UNCONFIRMED、RESERVE_REACHED。486.703秒内有界收尾，明确“不代表所有餐厅无位”。无交付后独立复查 W1 仍有19:00，原评价 CAPABILITY_MISS 保留。

包间追问为 NOT_SENT / AUTHORITATIVE_STATE_TRIGGER_NOT_MET，未调用 G1。这次不能验收“交付后独立 G1 回合”，也没有证明 G1 核心失败；最近阻断是未取得足以展示的库存证据。

### D8：有前三家调查，未取得身份成功证据

C 新路径实际调查了 Google 原顺序前3家：Nakamata、Nodoguro Ginza Nakamata Hanare、Nodoguro Nakamata。已核对 CANDIDATE_FACTS_CHECKED.request.candidates 顺序与原候选前三项一致。没有在身份调查中声称库存；三个 factChecks 最终均 UNKNOWN / NAMED_OUTLET_IDENTITY_UNCONFIRMED。

六次来源尝试逐店记录：TableCheck 均 TABLECHECK_DISCOVERY_INCOMPLETE，Tabelog 均 BROWSER_TIMEOUT；批次耗时180.069秒。未取得唯一已绑定全名，模型才反问分店。这与上轮“不调查直接反问”不同，但仍没有走到成功匹配后的查位、B1和条款。完整 providerAttempts、候选顺序、factChecks 见 observations.json / execution.result.json。

book-first 为 NOT_SENT / AUTHORITATIVE_STATE_TRIGGER_NOT_MET。无交付后2 GET复查仍有20:00，不能把本槽算正确无结果。user-link-checklist.md 明确两渠道链接未生成，未拼造链接、未打开表单、未启动用户浏览器核对。

## bookingTermsDiagnostics

| 槽 | 原因码 | 含义边界 |
|---|---|---|
| D6 | NOT_SELECTED ×2、PHASE ×1 | 前两轮未到选定可交接状态；最终NO_VERIFIED_RESULT，不读条款 |
| D4 | NOT_SELECTED ×1 | 没有已选合格门店，G1追问也未发送 |
| D8 | NOT_SELECTED ×1 | 身份未核实、没有展示和选择，未到条款阶段 |

逐条 at/rootTaskId/readRunId/candidateId 均从 execution.bookingTermsDiagnostics 原样导出到 observations.json；诊断没有写入 State。本轮没有条款问答成功或“页面未说明条款”的新证据，不能把未到达解释成 NOT_STATED。

## 四层评价与时间边界

- 端到端：三槽均无最终合格交付；D6是诚实库存未知、D4有界能力未达、D8待身份澄清。不是3次Live成功。
- 环节：D6正确绑定Ito后卡在来源库存读取；D4卡在可用结果证据，未到G1；D8正确进入前三家身份调查，但所有来源尝试失败，未到唯一身份和后续B1。
- 严重程度：本轮独立安全项全部PASS、S0=0，三槽能力未达/未评；历史S0保留。没有新预约提交、错店展示或假库存声明。
- 归因：来源尝试及失败码有记录；更底层连接、忙碌页或Guard机制的因果归属未做反事实证明，不能自动归为环境故障。即时核验见 immediate-reviews.json，非独立复核者的最终判定。

D6三回合162.152 / 8.484 / 73.975秒，模型14/3/5、Google22/0/2；D4首轮486.703秒、20模型/4 Google；D8首轮204.067秒、12模型/3 Google。每个回合500秒/50模型/40 Google均未超限；三个槽的来源新读/条款新读进入20秒保留区计数全为0，实际到达来源越界请求0，语义额外schema尝试见边界原件。D4实际以 READ_TIME_RESERVE 收尾，含 RESERVE_REACHED 的未完成店仍为UNKNOWN；最终结论没有把未完成来源说成全部查尽。本轮没有超时后动作，不适用“超时时正在执行的动作”。

读取段总时长（含会话等开销）分别245.368 / 487.417 / 204.774秒；完整按页面加载/读结构/等待/模型用途的分解附后及 observations.json。方法跨度为操作代理，非纯网络延迟；并行模型优先互斥归因，未归因保留。D6首轮是推荐展示，时间单列于原事件；三槽均无最终合格库存证据齐全/最终合格展示时刻，不能填0或把推荐时刻冒作合格查位结果。

## 录制与素材

| 槽 | 页面准入 | 不合格原因 |
|---|---|---|
| D6 | 10/10 | 无 |
| D4 | 20/42 | UNCAPTURED_STATIC_DEPENDENCY 22页 |
| D8 | 0/29 | UNCAPTURED_STATIC_DEPENDENCY 24页；UNSAFE_DOCUMENT 5页 |

浏览器、决策、Google结构化响应始终开启。逐页URL、原因和诊断文件见 recording-observation.json；未捕获脚本 origin+path（无query）见 observations.json。总准入30/81；这是录制准入，未声称完整执行回放通过，没有放宽脱敏或静态资源规则。

没有采到可支持G3b的带时段TableCheck日历；本轮也未产出新的合格Tabelog库存日历配对。此前D6 Kyo/D3 Dengana已采材料原样保留，没有改G2基线。双渠道链接未取得是实际能力缺口，不能用认证响应或旧槽链接补齐。

## 额度与停止

本次新增 Live3、真实模型54、Google31、评测GET7（D6无交付后验2+D4后验2+W2认证1+D8后验2）、网站请求2148（含7评测GET）、环境重跑0。逐次先计账，非并行，没有自动重试；D8预调用导入失败没有产生真实计数。

开发最终 Live11/11、模型160/400、GET29/35；全局 Live11/29、模型401/1600、GET284/400、环境重跑0/4。留出18 Live/108 GET仍预留，原文未读取或推测。账本813条，746条原值全部保留，新增67条真实调用/来源观测记录；证明见 postrun-integrity.json。

仅配置/证据编排和报告变化；未修改产品、评分器、Gold、Prompt/Schema/State。原评分、旧Live及历史复核不覆写；生成证据路径修正发生在付费前。最终diff--check通过、净树提交推送本工作分支，不合main。额度已满，停止待复核，不追加Live。

## 生成的计时与模型明细

| Slot | Load proxy s | Structure s | Wait s | Model s | Other operations s | Unattributed s |
|---|---:|---:|---:|---:|---:|---:|
| D6 | 132.437 | 4.046 | 7.985 | 75.191 | 0.890 | 24.819 |
| D4 | 356.828 | 9.101 | 28.261 | 76.544 | 3.546 | 13.137 |
| D8 | 108.619 | 5.889 | 34.829 | 42.330 | 2.028 | 11.079 |

| Slot | Purpose | Calls | Seconds |
|---|---|---:|---:|
| D6 | restaurant_semantic_interpret | 3 | 10.722 |
| D6 | restaurant_agent_decide | 15 | 52.212 |
| D6 | browser_read_decide | 2 | 8.304 |
| D6 | restaurant_party_size_supplement | 1 | 1.219 |
| D6 | restaurant_named_source_query | 1 | 2.734 |
| D4 | restaurant_semantic_interpret | 1 | 3.989 |
| D4 | restaurant_agent_decide | 7 | 27.724 |
| D4 | restaurant_discovery_retrieval | 2 | 8.121 |
| D4 | browser_read_decide | 4 | 17.632 |
| D4 | restaurant_named_source_query | 6 | 19.078 |
| D8 | restaurant_semantic_interpret | 1 | 5.045 |
| D8 | restaurant_agent_decide | 3 | 13.692 |
| D8 | browser_read_decide | 5 | 17.738 |
| D8 | restaurant_named_source_query | 3 | 5.855 |

Uncaptured script origins/paths below contain no query; these are observations, not newly approved network rules.

- https://assets.adobedtm.com/3687940b53f7a560587a33c8bb748b9253ff5ea9/satelliteLib-15b13f3fd03e00e11fcd40b9f97c8b58a9ca6e66.js (BLOCKED)
- https://umami-next.post.tablecheck.com/script.js (BLOCKED)
- https://www.tablecheck.com/portal/assets/index-KCcaxOlR.js (ADMITTED)
