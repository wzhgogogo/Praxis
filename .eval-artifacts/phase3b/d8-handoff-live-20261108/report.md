# D8 无正向见证诊断及离线收尾

Status: draft / not integrated；已暴露开发回归，不是 held-out、旧 D8 正向验收或成功交付。时间统一 CET (UTC+1)。

本次只执行一次已批准诊断。原请求仍为 2026-11-11 20:00、2 人、Specializing in Nodoguro Ginza Nakamata。未完成唯一店收敛、查位、B1 或条款；不合 main，不进入 held-out，不重跑。离线修复与独立旁路更正另列，不回写实际 Live。

## 授权、冻结与认证

- 用户原批准 1 次 D8 Live，50 模型/回合，见证/后验 GET 共3；网络分流与店铺验证时一致。
- 原入口/输入冻结4b84448c；2026-11-08 06:24:56 CET 独立 Tabelog 认证 GET200：原20:00查询仅返回20:30、20:45、21:00，原 G6 正向见证门槛停止。该失败及原 cert.exists=false 均保留，尚未消耗模型/Live。
- 用户随后在本聊天明确回复「批准无正向见证诊断运行」，见 negative-diagnostic-authorization.json；未批准改时间或增加读取。诊断入口/输入冻结22215c6b，标为 NO_POSITIVE_WITNESS_DIAGNOSTIC。默认 G6 仍拒绝负见证；负证书未进入正向 witness，未向产品模型传入 oracle。
- 运行约06:40:20–06:42:40 CET；run g6-D8-1794116420864-0。三类录制开启，凭据仅 --env-file；DeepSeek/餐厅源直连，Google沿当前代理。原产物冻结0ea3b78e，修复前未覆盖。

## 实际 Live 结果与首个偏离

TableCheck：模型打开 Destination、填写用户全名、点击唯一精确按钮，在正确店页 COMPLETE；已有动态交接成功。代码以 NORMALIZED_NAME_AND_ADDRESS 产生 HIGH 原生身份。店页当前 URL 保留 service_mode/sort_by/venue_type；ENTITY_MATCH.sourceUrl 使用不带查询串的 canonical。ObservedOutletNames 只按完整 URL 找同次 snapshot，漏了来源全名；claims 只剩 Google 短名 Nakamata。原有 G4 因此不能把用户全名收敛到唯一候选，随后进入后两家调查。这是首个产品偏离，发生在查位之前，不能称作「身份核对本身拒绝」。

| 候选（Google 名） | 渠道 | 来源内模型调用 | 耗时 | 到达/停止 |
|---|---|---:|---:|---|
| Nakamata | TableCheck |4|26.110s|精确全名→店页→HIGH；来源全名未进入唯一性判定；Tabelog未运行|
| Specializing…Hanare | TableCheck |7|45.001s|后续候选沿复用页面调查，provider期限停止|
| 同上 | Tabelog |2|30.430s|Hanare 查询无结果，末端有运行时失败；未到目标店|
| Nodoguro Nakamata | TableCheck |0|20.139s|入口操作超时|
| 同上 | Tabelog |1|2.306s|旧列表与当前词未绑定，请求帮助|

第二候选累计75.446s/9来源内模型，第三累计22.446s/1。全回合134.310s、19实际模型调用全部 SUCCEEDED：语义1、Agent3、浏览器14、查询计划1；没有模型连通失败。来源内表格不含共享语义/Agent/查询计划调用，不能相加当作全部模型。其余2家未调查。BOOK_THIS_OUTLET 未触发，只有 INITIAL 回合。最终 NEEDS_INPUT/NEEDS_YOU，要求分店说明；可用性 UNKNOWN，没有有证据的原时间无位结论。

## 独立评价（四层）

1. 输入/执行：原请求、50模型/500s回合、45s provider/20s入口与收尾保留不变。1 Google，19模型，无现实预约/外写；forbiddenRequestsReachedSource=0，未在 reserve 开新来源工作。负见证诊断不满足旧 D8 正向验收前提。
2. 安全/支持性：原 evaluation.json 为 NOT_EVALUATED、S0=4、stopBatch=true，原样保留。四条都是 OPTIONS；冻结评测输入从 cases/reviewed-public-reads.json 抄录时遗漏四种已批准文字合同。这是本次评测准备遗漏，旧清单下真实四条预检红灯。独立从11-07用户已批准的 tablecheck-destination-20261107/reviewed-read-rules.json 手工补录精确键集合及同一预检合同；非生产策略生成。旁路评价34/34实际外层请求 PASS，S0=0，GET/HEAD独立审计 ABSENT/无gap。额外/缺少键、其他源站/路径、POST、其他头/Origin、有body反例仍拒绝。原报告不改；见 offline-repair/sidecar-final。
3. 能力：真实 TableCheck身份已 HIGH，但唯一性/查位/B1失败；Tabelog未对目标店查位，不能出产品双渠道交付。独立后验的 Tabelog无20:00只是该来源当时结果，不证明TableCheck无位。boundedNoResult未满足（原答复没有合格的有界无结果解释）。
4. 交付/污染：无交付合格结论、无完整Replay验收、无 clean holdout。实际原模型输出/原S0评分/认证失败均保留。旁路中21条解码问题全为重复 NETWORK_RESOURCE_TYPES 数组清单，单独明确归类；请求证据0条被排除，边界记录解码无问题。最初未归类的旁路失败也保留在 sidecar，最终结果在 sidecar-final；不把忽略未知记录当作安全通过。

## 离线修复与证明范围

- 复用本次真实 snapshot0006、实际 Google候选与原HIGH证据：修前唯一性 false；修后从当前同源同路径页面解析 canonical及sourceEntityId均相等的源名称，交给原G4，唯一性 true。不把候选名/模型结论当来源名，不提升身份级别，不新读页面。LOW、异实体、异URL/页面、缺名称、Hanare后缀仍不能唯一完成。
- 旧组合用单店且不走身份专用路径，补查询串/canonical仍通过；这两次未形成红灯，日志保留，不声称有效检错。补强现有生产组合的多候选身份调查路径后，旧实现有效红 NEEDS_INPUT，修复后绿 PRESENT_RESULTS+B1。该链路使用LOCAL_CONSTRUCTION库存/条款；实际DOM组件是真实录制，组合绿灯不能追认 Live查位/B1通过。
- 独立评测清单四条缺项红→绿；原评价输入/结果哈希检查未变。产品Guard合同/时限/身份阈值不变，未触及复核者列出的3b后待办。

## 录制与链接

三类录制全开，21次页面，19份DOM通过清洗；目标TableCheck店页snapshot5–17保留，可供真实组件回归。2/21页面满足Replay资格，整体PARTIALLY_REPLAYABLE。店铺JSON GET200、11139字节，已进入正常清洗，但以 JSON_VALUE_PRIVACY_OR_SHAPE_LIMIT 拒录；不放宽隐私，不能声称店铺JSON已录或整链可Replay。其他响应遗漏：敏感键5、JSON大小5、未审核录制方法/URL13、非UTF8 2；Tabelog列表2份是 UNREVIEWED_DOCUMENT_QUERY_SHAPE，不是内容敏感拒绝。见原recording.json和offline-repair/live-summary.json。

可供复核的来源链接（不是B1/有位交付链接）：

- [TableCheck 已读店页](https://www.tablecheck.com/en/nakamata-nodoguro-ginza)：实际精确联想进入，代码HIGH；未查位。
- [Tabelog 独立见证详情](https://tabelog.com/en/tokyo/A1301/A130101/13186922/)：认证/后验来源，非产品本轮目标店身份完成；20:00未出现在selection。没有打开任何预约表单。

## 额度与停止

本批认证1GET+后验2GET=3，Live1，模型19，Google1；餐厅传输累计+39（含独立GET3，站内受控请求另计36）。累计模型653→672、GET356→359、Live23→24、Google95→96、网站11250→11289。共享上限GET467、Live42，剩108GET/18Live全部为原held-out预留；本轮可用GET/Live均0，不再读或调模型。模型只调用验证15/30未动，不能与本轮Live19混算。

完整门禁与源码冻结待本次离线修复冻结后附回执；main合入条件未达到。STATUS/DEVLOG/TEST-LOG按用户要求留到实际合入时更新，本轮能力边界已写入Capability Matrix。新失败分支产物尚未推送；本轮未满足用户给出的main合入/推送条件。
