# 三个卡点修复与两次开发检查 — 2026-11-10 CET

已合 main，产品冻结 **8ca251f8**，运行 main **38479f8b**。获批两次已结束；不追加Live、不进入held-out。独立边界 D01 **128/128**、D02 **200/200** PASS，GET/HEAD来源审计ABSENT。D01资格待补评，D02未生成正式评价，**不报告通过率**。

定位：①发现 COMPLETE 原来只核列表/地点，不核菜系（D01 #8/snapshot5 Western；D02旧#8–10 Seafood）。现在只保留模型所引的当前可见范围原文，缺失/失效标未证实，不把Western当西班牙菜。②Google并未被删除，而是被原生批次核对门槛饿死；现按既有计划同批补充、保守去重，菜系线索优先。③每家4次浏览器其实是FACTS菜单往返（旧D01 #16–19），不是查位；UNKNOWN新页交接后停止重复提议，已有分类可直接走原语义判断。④“AVAILABLE/no request-bound slot”是摘要错误，原offer已绑定；FACTS上限仍4模型/24操作，未改预算。

红绿：Sumika旧#30缺CATEGORY/UNKNOWN→本轮 **#22** 输入含原分类 `Izakaya (Japanese style tavern), Robatayaki, Seafood`，引用 `tabelog-hard-criteria:5959288d60671daf5948fa89` 判SUPPORTED；LOW/错引文/评论/错evidenceId拒绝，宽父类组件UNKNOWN。D01 #21/#28引用自己的 `Wine bar, Spanish, Bistro`（末次证据 `…068a0daa5b9f42a3bc593971`）。实际引用已进入qualificationClaims，评测独立核对原文。组件替代语义响应明确LOCAL_CONSTRUCTION，额外真实模型0。D01菜单真实组件4→1浏览器调用仍UNKNOWN；D4/D8回归绿。本次原生候选均0，所以**原生候选成本改善仍只有组件证据**，不声称Live验证。

| 运行 | 候选/菜系引用/查位尝试 | 发现成本 | 产品交付和评价 | 模型/产品用时 |
|---|---|---|---|---|
| D01 | Google4，原生0；分类引用1家；4家尝试，1家AVAILABLE | 原生5调用/21.9秒；TC地区未执行 | Bar014，11-18 19:00/2，B1；追问保留，PENDING_REVIEW | 首轮22/66.9秒；追问9/33.6秒 |
| D02 | Google9，原生0；分类引用2家（仅Sumika满足HARD）；9家尝试，2家AVAILABLE | 原生6调用/25.6秒；TC地区未执行 | Sumika，11-19 /6，18:00、18:30、19:00、19:30、20:00；英文菜单NOT_CHECKED。**运行器FAILED/无评价** | 47/156.5秒 |

D02首个剩余阻断在产品交付之后：后验循环按每个时段读取同一家店的空位API，18:00、18:30两次均true；第三个时段发送前触及“见证1+后验≤2”的冻结上限，未扣/未发第三次。参数svt不同，**不是同一个完整URL**。原failure.json / failure.evaluation.input.json / batch.json原样保留，未补读、补评或重跑。5个时段不等于5家店。

逐候选实际模型（浏览器B/事实语义J/其余）：D01 LA CEPA 1B+1J；Bar014 2B+2J+2问答（含追问）；vivo 1B+1J；ESTASI 1B+1J。D02 Sumika6B+1J；奥里火5B+2J；Okajoki1B+1J；Aburiya2B+2J+2来源引用；Dai Ni1B；十七番地1B；まんてん1B；最魚1B；Guttsu5B+1检索词。共享语义/Agent/发现调用另计，详见analysis.json。NO_PROGRESS D01=0/D02=2；skip=2/3；两类入口重试均0。D02仍47调用，尚未证明总成本下降。

对比：旧held-out01为1/3、02为0/3；上一轮D01/D02均未交付，本轮产品都产交付，但资格/正式验收仍未完成。D01首轮46→22，最早成功基线43；D02上一轮47→47。本次模型78/78成功，8次体检全部200且<10秒（2.26–8.73秒）。同SHA全门禁1571 / Chromium274+G6 103 / strictG2全12、type/arch/build通过；扫描3条通用文本/电话归一化，无菜系/站点写死。首轮D4评测时间绑定回归保留并修正，未删安全断言。

额度：新增 **2Live /13GET /78模型**；累计 **12/26、86/126、1410/2500**；环境0。原4256303d净树、871份文件、原账本逐字节未变。三类录制全开：D01 29页/25可回放、D02 55页/50可回放；其余按原隐私规则拒录，无伪造补页。

用户浏览器核对入口：[D01 Bar014 11-18 19:00/2](https://tabelog.com/en/booking/form_course/new?member=2&rcd=13198396&visit_date=20261118&visit_time=1900)；[D02 Sumika 11-19 18:00/6](https://tabelog.com/en/booking/form_course/new?member=6&rcd=13309182&visit_date=20261119&visit_time=1800)。以上为运行时观察，时段JST原值，不承诺当前仍有位。全部B1在原输出，不执行预订。
