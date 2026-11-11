# 07 / D02-V 修后开发 Live（2026-11-11 CET）

代码与 main 冻结：`dafc2278267dd248e36a1f3c5f13fdeb1b81bb19`。保留前三项修复及体检/identityOnly迁移；两份发现Prompt文件恢复ead28945，browserPrompt24、AgentPrompt32。type/arch/build、默认1590、Chromium281、G6 159全绿；相对ead28945新增产品写死命中0。源代码运行期间零改动。

| 运行 | 结果 / 交付 | 首回合用时 / 模型 | S0 / 请求边界 |
|---|---|---|---|
| 07-r1 | PENDING_REVIEW；あおき屋1家、11-18/10人、18:30–20:30共9个时段及B1 | 382.371秒 / 47 | 0 / 382/382 PASS |
| 07-r2 | EVALUATED / CAPABILITY_MISS；未交付 | 171.091秒 / 27 | 0 / 318/318 PASS |
| D02V-r1 | EVALUATED / CAPABILITY_MISS；未交付 | 247.916秒 / 41 | 0 / 256/256 PASS |
| D02V-r2 | EVALUATED / CAPABILITY_MISS；未交付 | 263.190秒 / 40 | 0 / 256/256 PASS |

**07 核对。** r1 あおき屋（13231218）数据members=10，事实COMPLETED并交付；Agent先对该AVAILABLE候选补事实再继续查其他店。Arai-ya（13156488）虽录到members=10响应，但完成确认前provider超时，UNKNOWN、未补事实/交付。三宝苑（13306197）实际打开并读取来源身份，录到2人响应，查位超时，未补事实/交付。r2来自原生列表的4家候选未建立请求匹配10人时段，三家目标未进入该轮候选。两轮“没有搜索入口”求助均0。批处理第三家报错的部分保留仅有本轮前离线红绿证据，未把本次单店事实成功冒充该故障已在Live触发。

**资格独立核对。** r1引用“Yakiniku (Japanese BBQ), Tripe, Izakaya (Japanese style tavern)”已经独立评测器对同店同源录制逐字核验，9个B1/日期/人数/时段/后验和其他检查PASS；唯一待项是完整冻结请求资格的独立语义与地区注释。原评价保持PENDING_REVIEW，不借产品HIGH或SUPPORTED自行填hardCriteriaMet=true。完整资格结论交复核者补评，本报告不报告通过率。

**D02-V 四项。** 两轮Sumika及まんてん別館均有200 `find_vacancy`、`base_date=2026-12-10`，翻月/日期已有数据支持。20:30存在于已录2人响应的同日来源链接；它不证明8人有位。两轮均未得到产品认可的8人匹配响应/选择，未交付；r1只推进到人数轮播翻页，r2 Sumika在日期后即到截止，まんてん同样未完成8人。原字符串`no actionable target`均0次。首个剩余卡点是provider45秒窗口：r1 Sumika诊断#222=45007ms、まんてん#431=45029ms；r2分别#196=45013ms/#412=45007ms，均DEADLINE_EXCEEDED。不能把先前44.508秒组件计时投影当作本轮真实成功；本轮不再修代码/改时限/追加Live。HAR逐项索引及模型决定见run-summary.json与原录制。

**预算与保全。** 本轮4 Live、20认证/体检/后验GET、155模型、0环境重跑。累计40/40 Live、205/220 GET、2483/2800模型、2/4环境；剩0 Live、15 GET、317模型、2环境。派生账本快照SHA `3fd1b58954bee9ad4cb3636cf436b22aee177edad633b486723ed842eef9aed6`；旧281条记录和旧账本e78bd8c7逐字节不变。主工作区HEAD/草稿哈希未变，原冻结运行树仍净。两组完整输出共659文件原样复制并逐文件核SHA，不含私有原文/清单；三录制、原评价与PENDING均保留。四次均正常结束，无S0/环境停批；证据分支推送核对后停止。
