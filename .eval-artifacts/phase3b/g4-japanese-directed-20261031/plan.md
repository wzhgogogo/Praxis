# G4方案一：4家定向分阶段实测

- Evidence status: frozen exposed inputs / directed public-GET acquisition + production identity-prefix replay；不是新的37家通过率，不是完整Live。
- 基线：用户已复核da452626，产品代码固定，不合main。此前1271/1271、Chromium186/186、严格G2全12已通过；本批只增评测产物/账本，不重跑不受影响的产品门禁。
- 切片承诺：逐程序取得Beef同ID日文原名、原文生成首屏、现有排序/4+1选择的≤5详情，补8个已观察详情；实际结果原样评分，错认零容忍。
- 程序批准：中间不等复核；每个阶段URL清单/依据在请求前提交。每个请求先写共享账本和不可覆盖started记录；收到响应头立即写时间，正文完成或失败写时间/字节数/脱敏底层错误码。原文按fetch解压后字节原样保存、SHA标明表示，绝不重新序列化Google原文。
- 次序：robots一次→Google一次→冻结Google原件/名称/实际语言→由产品buildRequestUrl物化并提交Beef首屏→冻结首屏并用产品解析/排序物化并提交≤5详情→Beef生产前缀评分→8已知详情按Sancho/T/Sumi三组原样获取并各自评分。各组中按冻结名额获取资料，取得页面与生产前缀实际读到的页面分开报告。
- 网站严格白名单：只有https://tabelog.com/en/tokyo/rstLst/?sw=...和/en/<地区>/A.../A.../<数字>/，robots为用户明确例外。禁止booking/yoyaku/login、外域、JA入口、跳转目标；不改写不合规链接、不从认证ID构造链接。
- 总额：网站≤14（不含robots）、Google≤1、模型0、完整Live0。robots另1次也计入共享GET，当前244/260，最坏259/260；每次先记账，原487条保持；无自动重试或追加额度。
- 所有请求使用20秒整体期限（包括正文），从上次完成/失败至少30秒间隔；更长robots延迟同样遵守。无Cookie/credentials，redirect manual。连续3次网络失败停；限流立即停；robots/Google前置失败、ID不符/空名、未能合法物化、任何协议违例停。HTTP/网络失败不重试；已批准的独立详情仍可按冻结队列继续，直到全局停止条件触发。
- 凭据只在那一次Google受控Node进程用--env-file=/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.env加载；不独立读取/打印/复制/暂存.env或key。其余流程不加载.env。Google配置代理只作用于Google；网站沿旧G4宿主直连/TUN路径，不自行换路。
- 请求使用受控传输；Google产品客户端随后只消费本次已取的原始字节作ID/原文/实际语言校验，不发第二请求。模型没有网络入口。原名/片段/其余三份日文名/前三轮搜索复用原已冻结材料。
- T没有捕获片段提议：不会伪造空模型响应，整条路径保留未评条件，但实际HIGH即使带未评条件也必须独立核对并在错认时停，不用未知条件掩盖错认。
- 首屏结构/查询独立核验沿既有无Gold oracle，选择详情时不读Gold。Gold只在生产执行产物落盘后的独立评分程序使用。当前网页只证明本次读取，库存/预约不评价。
- Runner/清单/输入SHA运行前提交。先本地HTTP自测manual redirect/noCookie/头前和正文deadline；实际阶段后原件和SHA提交，随后才生成/提交下一阶段。最终检查原生产源码/旧证据不变，账本按id并集，汇总调用/等待/错误阶段，推工作分支停复核。
