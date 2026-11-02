# G6 开发 Live 定稿计划（待批准执行）

2026-11-02 Vienna CET，`draft / not integrated`。计划运行2026-11-03，亦可11-04；访问日固定2026-11-11（周三），分别8天/7天后。11-05及之后本pack拒绝启动，必须按7–14天和原星期重新物化并冻结日期/请求。没有接触3b留出集原文。

当前冻结pack：`development-pack.json`；原文与全部后续回合的独立SHA为 `4e883554d43a472ee2eb60bf8f56e04dd39bb3b0861e339c9bd02619aa5ddb71`。整个pack SHA为 `84f4c1f98cf42fb323fda54537ddfc465e967718c9ba88e105186e371c9d5c8b`。

| 槽 | 请求原文 | State触发的后续回合 | 见证/预期 |
|---|---|---|---|
| D1 | Could you find a kushikatsu place near Akabane with a table for 2 on Wednesday, November 11, 2026 at 7 PM? | 无 | W1；原已暴露3a′例01仅DATE物化。店名解析/原生候选与Guard/F6观察，不把Dengana硬注入产品候选 |
| D2 | Check whether Specializing in Nodoguro Ginza Nakamata has a table for two on November 11, 2026 at 7 PM. | 无 | W2；采到有位时保存可绑定日期/人数/时段的TableCheck日历，没有则如实记录 |
| D3 | Can you find a table for two at Kushi Katsu Dengana Akabane ten on November 11, 2026 at 7 PM? | DISPLAYED_AVAILABLE → “Please book the first restaurant for me.” | W1；明确预订由代码记录选择，然后读取条款或按规则省略；不要求模型选择SELECT_CANDIDATE |
| D4 | 与D1逐字相同，pack中保存全文 | DISPLAYED_AVAILABLE → PAGE_QUESTION “Does the first restaurant have a private room?” | W1；G1取得同店本页；原文引用或NOT_STATED。新转述由独立评价核对 |
| D5 | I'd like to book Kushi Katsu Dengana Akabane ten at 7 PM sometime next week, for two people. | 当前pendingUserQuestion.relatedFields含date → “November 11, 2026.” | W1；用户补日期前不得自行赋值或查库存 |
| D6 | Recommend a restaurant near Akabane Station. | DISPLAYED_RESULTS → “I'd like to book the first restaurant on November 11, 2026 at 7 PM.”；当前pending含partySize → “Two people.” | W1；推荐不当库存；明确预订由代码记选择，缺人数先问，查位后交接，条款读取或按规则省略 |
| D7 | 与D1逐字相同，pack中保存全文 | 无 | W1；Guard实际请求与20秒保留测量，不人为拖慢网站或为触发增加请求 |
| D8 | 与D2逐字相同，pack中保存全文 | DISPLAYED_AVAILABLE → “I'd like to reserve the first restaurant.” | W2；TableCheck B1、条款/手续费/反馈；生成两个渠道的真实链接清单 |

每槽500秒/50模型/40Google，串行。最多8次Live/400模型，仍受共享总账26/1600/290/4；本批实际Live/模型/GET均0。无自动环境重跑。用户先批准本计划，再执行命令清单；C修复须先合入并完成补回放。

## W2 已确认指针

- TableCheck：`https://www.tablecheck.com/en/nakamata-nodoguro-ginza`。
- Tabelog：`https://tabelog.com/en/tokyo/A1301/A130101/13186922/`，のどぐろ専門 銀座 中俣。
- 复核依据：Tabelog地址東京都中央区銀座4-10-12 銀座サマリアビルB1，与Praxis10-22读到TableCheck的4-10-12 Ginza, Samaria Building B1一致；这是复核者提供的同店依据，不是本次新认证。
- 禁用13219563：銀座中俣 はなれ，銀座3-12-17 小森ビル1F，是其他分店。

认证时自己核对名称、地址、电话、Tabelog在线预约区块和四参数find_vacancy；现在不读取网站。保存的TC fixture电话为REDACTED，故获批后另1次公开TC详情GET做电话对照（公共guide，不是reserve表单）。Tabelog统一https://tabelog.com/en，不使用ssl域名。

若Tabelog明确没有在线预约：经实际原文核对后将W2执行证书设DETAIL_ONLY，记录原页/SHA/核对理由；只证明身份，不称WITNESS_EXISTS，不因未交付判CAPABILITY_MISS；TableCheck时段必须另有同次独立公开观察。不能仅凭某天0时段推断“无在线预约”。W1不允许详情模式。没有其他路径猜测或替代分店。

## 20 GET 严格开发额度

一次完整W1认证2 GET，一次完整W2认证2 GET，再1次TC公共详情电话对照，合计最多5个前置GET。之后每槽每家Tabelog交付店立即1 GET；无交付完整见证2 GET（W2详情模式只重读详情1 GET）。相同店/日期/人数/时段的已评审认证只在24小时内复用；后验不复用。全部先记共享账本，串行间隔≥5秒，无Cookie、登录、表单或模型认证。

总额度硬上限20，含认证和后验；认证文件记录实际尝试数（包括失败），Runner继承余额，在第21次计账/传输前拒绝。正常两槽TC、六槽各交付一家Tabelog约11 GET；无交付或多店交付会增加。原4前置+16后验=20的估算因电话对照变为最坏21，因此不能再承诺最坏情况下8槽全跑完：达到20就停止并保留权威输出/未知核验，不截断产品交付、不省核验、不动留出集余15，也不追加GET。只消耗实际请求，不预记满20。

## 录制与评价

每槽固定 `--record-browser --record-decisions`，Google结构化响应始终录制。预计路径 `.eval-artifacts/phase3b/g6-development-live/<pack-sha>/<slot>/`，包含recordings、诊断DOM、Google HAR、execution.decisions.jsonl、evaluation.input/evaluation、boundary-observation、recording-observation及witness。逐页合格数/总数/不合格原因原样报告，零页比率null；不改Recorder规则，不先实施方案(c)。

每槽立即独立评价，S0立刻停批；缺独立安全证据也停待核，不宣称认证S0=0。执行前的鲜活见证证书和独立oracle是认证产物，和冻结请求pack分别记SHA；导入不能改请求、日期、人数或后续轮。条款、费用、库存与反馈仍按原合同；没有预约执行端口。

顺带采集：Tabelog日历+同次空位响应→G2；有时段TC日历→G3b；新录制→当前版本回放；D8两渠道用户链接核对模板。生产语义schema仍最多2次尝试，Live边界记录每用户轮语义调用数及额外schema尝试，不改Prompt或重试规则。
