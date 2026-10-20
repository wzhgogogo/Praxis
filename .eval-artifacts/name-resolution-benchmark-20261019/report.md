# 店名解析基准：第1–3项离线准备

Evidence status: frozen regression / exposed development sample candidates，PENDING_REVIEW。未运行第4项，未评价真实找对率。

## 范围、输入与冻结

用户批准后续方法A≤150真实模型调用，B仅必要时≤100；本轮仅准备。当前真实模型0、网站/Google0、预检/探测/Live0，不更新或重置已有阶段用量。当前42条若每条最多3调用，A上界126，仍受150总上限。

读取用户指定主分支指令8b70084；最初git fetch阻塞后已终止，无后台残留。沿独立P2-2工作树9a74f56（含8b70084及繁忙页修复）开发，没有修改主/P2-1工作树。推送获本次用户直接授权，指令文件原文不修改。

- source-manifest.json：66份历史文件，包含20份校准RESULT及46份P2-1/P2-0 trace；原校准22另2次中断无结果保留为缺口。P2-0 h001/h002已在校准集中，不重复计。全部路径已受Git跟踪，66份SHA逐一核对，原产物字节不改。
- 独立URL语法收集具备Google原名/地址/电话/坐标的具体门店，平台ID去重：31 Tabelog、2 TableCheck。保留已观察到的门店子页（如Tabelog /party/、TableCheck /reserve/landing）的同一门店ID；不会把搜索/列表入口当Gold。
- 分层选择30 Tabelog＋2 TableCheck＋10无Gold对照＝42。TableCheck少8家，明确样本不足；不构造额外样本、不改身份规则来凑数。对照含其他网站字段、Instagram、无网站，仍未人工证明网站归属；排除与Gold池同Google ID的对照。对照交替分配5 Tabelog/5 TableCheck，不自动双站搜索扩大调用量。
- 覆盖Shibuya、Higashi-Ginza、Kagurazaka、Kichijoji、Nakameguro和原始nearby标签；不把nearby猜成地名。覆盖英文、日文、分店后缀、Sushi/Restaurant泛称及OTHER；标签可重叠，不把分组分母相加。
- 样本SHA-256：`89ce49a49e428e84c5a4caed8831bf8ca98d1c06566d384879f8ce42992d0f87`。source-manifest SHA：`cebea2423d981350a3462837f856c25f76952dc9b428e70311b60717f49a7510`。samples.json / sample-freeze.json / samples.review.md供复核，Google网站字段只作为待审核的ID答案来源，不是同店HIGH或当前可用性保证。

## 方法A接线与边界

新增src/eval/restaurant/agent-loop/name-resolution-method-a.ts，通过现有Tabelog/TableCheck Adapter和BrowserTaskExecutor运行名称搜索及身份前缀，含现有繁忙页识别/一次重试；不改生产文件、身份或接纳逻辑。

方法函数只收id、平台、四字段subject和依赖，不收样本Gold。候选是全新opaque ID，sourceIds只含电话，清掉官网、Google地图/ID、平台ID、native入口、provenance答案及历史缓存。坐标原值不改。

生产Adapter DTO要求日期/人数/时间，eval使用不可执行占位值；模型输入移除这些字段及相应动作，明确拒绝模型强行日期/人数/时间操作。搜索URL和身份规则仍由生产路径生成。外层在首个AVAILABILITY操作开始前停止，保留已有HIGH身份与原页；显式预约/支付/取消URL导航另被拒绝。停止不被当作库存失败或运行成功。此处只证明已测的显式导航/操作边界，真实站点自动加载与当前网络兼容性未评；第4项仍需冻结正式只读编排与来源网络证据，不能把此入口当作已获准启动。

本地脚本和真实本地Chromium均证明两来源从搜索开始、读到同店身份、不导航到/reserve、不操作库存；页面摘要/完整快照、比较诊断、Executor trace、实际模型计数随单例返回供后续Runner保存。额外脚本反例证明占位日期不泄漏、强行填日期零执行、实际调用不超过3。当前这些调用是本地脚本决策，真实模型用量0。

方法B为“仅当A结果不好时”的可选项；目前没有A真实结果，保持NOT_ENABLED，不预建自由改写搜索平台或运行B。其后若需要，按同输入/只读/独立身份规则单独冻结最小实现，不把A与B结果混报。

## 独立指标与停止

name-resolution-benchmark.ts独立解析返回URL/原始选中页的门店ID，与冻结Gold比对；不复用生产URL解析器、eligibility或身份匹配函数给自己判对。生产HIGH是“系统接受了”的记录，原始选中页和独立Gold是ID oracle；缺原页/身份记录为NOT_EVALUATED。

- CORRECT：原页ID、返回ID、Gold一致且生产身份通过；WRONG_ACCEPTED：原页/返回声明不符或接受另一Gold ID，S0并stopBatch即时置真。
- UNCERTAIN：本次发现了候选但身份未通过；ENV_FAILURE细分繁忙/限流/超时，计入未知率而保留环境单列。
- NOT_FOUND：已完成的受限搜索中无Gold或0结果，不推断平台根本没有此店。没有完成证据则未评。
- 对照无独立Gold，接受结果只记REVIEW_REQUIRED，不计找对/找错分母；没有人工核对不能宣称控制组S0=0。
- 每行保留耗时/模型数；分方法、地区、名称形态给出各类数量/比例、中位数/最长耗时、失败分类。无结果分母为null，未执行不伪造0%通过。重复同方法/样本结果拒绝，A/B分开。

Gold pending不是当前已认可标准答案；未来live必须有同样本SHA的独立批准，TableCheck200、Tabelog健康非繁忙证据。当前没有读环境文件或实例化真实模型Provider，模块无自动Live入口。

## 验证与证据状态

独立字面ID/错ID S0/缺证/未知/无结果/对照、重复运行拒绝、冻结42条与完整SHA、去官网/Gold白名单、Live未批准/503/繁忙拒绝、双生产前缀和禁止日期操作均有离线控制。初次类型缺provenance及Chromium搜索URL Fixture缺少生产查询参数已修，原日志保留为调试，不能称为生产故障红灯。

第4项未启动；not-run-evaluation.json中真实找对/找错率与耗时均为null。model-ledger.json增量0，原阶段账本不变。

四层：端到端NOT_EVALUATED；身份环节只完成离线接线与指标合同验证，真实能力未评；故意错店合成控制能触发S0停批，真实S0未评；关于名称写法/平台搜索/限流/不存在的归因均未定。当前不能回答“名称解析本身难不难”或“应优先改哪种检索”；这些结论等审核后实际运行与原页核验。

## 等待复核

请复核样本字段、Google链接ID是否确为同店、名称/地区分层、TableCheck仅2家的代表性，以及对照分配。批准需引用完整samples SHA。冻结并推送后停下；未批准样本或网络未恢复，不做第4项预检/真实调用。
