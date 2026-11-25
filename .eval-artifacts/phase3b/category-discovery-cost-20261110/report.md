# 三处修复、D01/D02 各一次 — 2026-11-10 CET

产品 **8ca251f8** / 运行main **38479f8b**。两次均产出交付，**D01 PENDING_REVIEW；D02运行器FAILED、无正式评价**，不报告通过率、不追加Live、不进held-out。

定位与修法：发现COMPLETE只核列表/地点，未核菜系（旧D01 #8 Western、D02 #8–10 Seafood）；现在记录当前可见范围引用，缺失则未证实/后排。Google原被原生批次核对门槛饿死，现在同批补充、保守去重/菜系线索优先。每家4次调用实际耗在FACTS菜单往返（旧D01 #16–19），不是查位；组件4→1后仍保持UNKNOWN。AVAILABLE无绑定那句话是摘要错误，原offer已绑定；4模型/24操作上限不变。

分类红绿：旧Sumika #30缺CATEGORY→本轮 **#22** 引用 `tabelog-hard-criteria:5959288d60671daf5948fa89` 的 `Izakaya … Robatayaki, Seafood`，SUPPORTED；奥里火仅父类仍UNKNOWN。实际引用进入qualificationClaims；LOW/错引文/评论/错ID反例、D4/D8回归通过。组件替代模型均标LOCAL_CONSTRUCTION，额外模型0。

| 运行 | 原生/Google候选；分类引用/查位尝试 | 原生发现成本 | 交付、调用、用时 |
|---|---|---|---|
| D01 | 0/4；1/4 | 5次/21.9秒 | Bar014，11-18 19:00/2+B1；追问保留；22次/66.9秒 + 追问9次/33.6秒；待资格补评 |
| D02 | 0/9；2/9，仅Sumika满足HARD | 6次/25.6秒 | Sumika，11-19/6，18:00至20:00半小时5时段+B1；英文菜单NOT_CHECKED；47次/156.5秒 |

D02剩余阻断在交付后：18:00、18:30后验均true；运行器继续按第三个时段读取同店空位API（svt不同），触及“见证1+后验≤2”，发送/扣费前被拒。**不是三家店，也不是同一个完整URL**；原failure和批次停因保留，未补读/补评。原生候选本轮均0，成本改善仍仅组件验证。

逐家模型 B=浏览器/J=事实判断：D01 LA CEPA1B+1J，Bar0142B+2J+2问答（含追问），vivo1B+1J，ESTASI1B+1J；D02 Sumika6B+1J，奥里火5B+2J，Okajoki1B+1J，Aburiya2B+2J+2引用提取，Dai Ni/十七番地/まんてん/最魚各1B，Guttsu5B+1检索词。共享Agent/发现另计，[逐候选原始计数](candidate-calls.json)。NO_PROGRESS=0/2、skip=2/3、入口重试均0。

上一轮两次均未交付；本轮D01首轮46→22，D02仍47，尚不能宣称整体通过率/成本改善（旧held-out01=1/3、02=0/3）。78模型全返回、8次体检全200且<10秒。完整门禁1571 / Chromium274+G6 103 / strictG2全12、type/arch/build全绿；扫描3条通用归一化。独立边界128/128、200/200通过；D02不据此补造正式评价。

新增 **2Live/13GET/78模型**；累计 **12/26、86/126、1410/2500**。原425净树/871文件/账本未变。录制D01 25/29页可回放、D02 50/55，拒录规则不变。

用户核对B1（JST、未预订）：[Bar014 11-18 19:00/2](https://tabelog.com/en/booking/form_course/new?member=2&rcd=13198396&visit_date=20261118&visit_time=1900)、[Sumika 11-19 18:00/6](https://tabelog.com/en/booking/form_course/new?member=6&rcd=13309182&visit_date=20261119&visit_time=1800)。[完整细节](details.md)、[录制与批次](runtime/batch.json)。停止等待复核。
