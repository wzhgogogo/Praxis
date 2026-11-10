# D02 多时段 B1 配对修复 — 2026-11-10 CET

只改src/eval，产品8ca251f8、身份/Guard/G1、预算/时限不变；Evaluator@8。新增GET/模型/Live均0，原425工作区/账本保持。

链接优先按记录中的offerId精确配对；历史真实记录缺ID时才按同候选/来源的日期+时间+人数精确配对。新运行器把实际offer.id写入交付记录，不解析ID文本猜测参数。配不到、歧义或重复占用同一交付记录仍S0。来源calendar核GET的rst_id、日期/人数，正文核base_date/members，B1自身店号/日期/时间/人数逐项核对，并要求对应时段返回的原URL逐字一致。svt只需合法时间，不再等于每个返回时段；未改变准入。

虚构5时段/5链接正常全PASS，错时间、原响应缺链接、重复链接、错offerId、歧义配对均S0；D01/D8真实输入的verdict和B1检查结论与原来一致。既有D4测试中“合法svt=2000也应FAIL”按本次批准合同改为PASS；非法svt=9999、错店/日/人数、伪造原链接等断言保留。首轮旧断言失败保留。

D02只使用原failure输入/实际offer记录、原来源响应及已录18:00/18:30两份后验，SHA/URL/正文核对；另存evaluation.offline-recovery-2.input.json与evaluation.offline-recovery-2.json。结果 **PENDING_REVIEW / qualified=null / s0=0 / stopBatch=false**；只有5条COMPLETE_REQUEST_QUALIFICATION待资格注释。此前s0=9文件与原failure均保留，不覆盖。

确认：svt=1900且svps=6的原来源响应里，5个B1均存在；原相对链接只按既有规则补固定来源origin，之后完整URL逐字比较，未改参数/顺序。详见recovery-provenance.json。D01/D8回归通过；完整门禁/扫描待冻结。

之后按用户提供的Wang/Git/commitment-r2.json原样入库，只核JSON字节/哈希和4个沿用用例，不读新题原文，不运行held-out。11-11 CET开跑安排仍由后续授权执行。
