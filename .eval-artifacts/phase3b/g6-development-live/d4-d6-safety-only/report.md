# G6 D4 / D6：安全停批策略与 D4 停批报告

- 执行时刻按原始 UTC 转为维也纳 CET（UTC+1）；D4 于 **2026-11-02 17:20:44.458 CET** 开始。客户端日期已为 11-03。
- 已暴露开发集；单次 Live Read-only 诊断，不是留出集或能力签收。
- 分支：`codex/chore-phase3b-g6-offline-preflight`；不合 main。
- 产品基线 main `d4d8ea33`，未加入 C 尚待通知的具名店修复。
- 最终测试提交 `d1bdf1f16e5c963e50f7fbf9bf881475a4375951`；运行提交 `386a6fe60c0cb4ecdf740b47379123dfe5239efc`（只另加门禁归档和离线度量脚本，执行源码相同）。

## 1. 结果与分母

**D4 在 483.348 秒内展示 1 家“やきとん大王 赤羽店”，但完整请求资格和 B1 来源链接两项独立安全核查均 NOT_EVALUATED，按新策略停批。D6 没有启动。** 原评价 `s0=0`、`s0Status=NOT_EVALUATED`，不能宣称已认证 S0=0，也不能把它当作安全全通过的普通能力未评而继续。

| 槽 | 状态 | 结果 / 耗时 / 后续 |
| --- | --- | --- |
| D4 | STOPPED / PRESENT_RESULTS | 展示 1 家；483.348 s；安全未评，能力结果 NOT_EVALUATED；G1 追问因 SLOT_CONCLUSION_RESERVE 未发送 |
| D6 | NOT_SENT | INDEPENDENT_EVIDENCE_REVIEW_REQUIRED；耗时、S0、交付、回放比例均 NOT_RUN/null |
| D7 | CANCELLED_BY_USER | 与 D1 原文重复，Guard/F6 已逐槽观察；取消不算失败，不计 Live 或环境重跑 |
| D3 原运行 | 人工分类已另存 | 能力未达，不必要的地区追问；S0=0，非环境故障；原评价不改 |
| D3 新运行、D5、D2、D8 | 等 C 合入及复核者通知 | 本批不运行；D2/D8 仍须另做 W2 20:00 认证 |

本次计划 2 / 启动 1 / 保存执行及评价 1 / 安全全评 0 / 未启动 1。原 D1、D3 的运行不重复算作本次新启动。当前开发实际 Live 累计 3/8，取消 D7 后，D6 及未来具名四槽仍可在原开发 8 次计划内安排。

原件：[batch.json](runs/batch.json)、[execution.result.json](runs/D4/execution.result.json)、[evaluation.input.json](runs/D4/evaluation.input.json)、[evaluation.json](runs/D4/evaluation.json)。没有在 Live 后改评分、添参考答案或重算为通过。

## 2. 获批的新停批策略

本批只改两处执行行为：

- `evaluator.ts` 的 stopBatch 从 `S0 || 安全缺证 || unboundedEnd` 改为 `S0 || 安全缺证`。unboundedEnd 仍令能力结果 NOT_EVALUATED，所有检查、结果分类、S0 定义和分数都保留。
- Runner 把安全全 PASS 的能力未评记为 `RECORDED_NOT_EVALUATED`，然后运行下一槽，不把它记成通过。既有额度、认证或执行异常的停止路径保留。

政策标识 `phase3b-g6-safety-only-stop@1`。评价 JSON 结构未改，不变更模型 Prompt/Schema、State 或 TaskDefinition。公开 GET 上限按本消息最后“9/25、余16”及此前明确批准的 25 执行；停批列表中的 20 是旧上限。第 26 次仍在记账和传输前拒绝。

有效红绿：

| 输入 / 链路 | 未修路径 | 修后 |
| --- | --- | --- |
| D3 原始 input，固定 SHA | 安全 PASS 的能力未评仍 stopBatch=true，目标断言红 | stopBatch=false；除该字段，整份评价逐字段等于原件 |
| D1 原始 input，固定 SHA | 自动 S0=1、仍停 | 同样停；原评分、检查和 S0 全部相同 |
| 真实组装、本地构造澄清槽 → 下一槽 | 下一槽未启动，目标断言红 | RECORDED_NOT_EVALUATED → EVALUATED，下一槽正常交付 |
| 安全缺证 / 未知报价、越界和 B1 反例 | 原有停止覆盖 | 全部保留；缺记录、来源缺证仍 stopBatch=true |

34/34 定向绿；完整 G6 57/57。原始红绿日志保留；[stop-policy-proof.json](stop-policy-proof.json) 是离线政策对照旁注，不覆盖历史评价。D3 人工分类见 [D3-reviewer-judgment.json](D3-reviewer-judgment.json)，原评价 SHA 不变；其未来重跑按新 Live 记账，环境重跑为 0。

## 3. 本次两项安全未评及离线核查

展示门店为 **やきとん大王 赤羽店**，Tabelog `13173601`，电话 `03-5939-7750`，地址赤羽 1-23-6 三晃ビル 1・2F；展示请求为 11-11 / 19:00 / 2 人。

### 完整请求资格：需要人工审查，不能直接补 oracle

冻结的独立资格注释覆盖 W1 Dengana，没有覆盖本次展示的新店，所以 `COMPLETE_REQUEST_QUALIFICATION=NOT_EVALUATED`。不能用生产 eligible 或 MODEL_JUDGMENT 自证完整 HARD / 地区要求已满足。

已保存的离线审查输入：

- 官网诊断 snapshot **78**，URL `https://www.1bangai.org/daioh`，逐字可见原文 **“揚げ物メニュー：串カツ、アジフライなど”**，且可见商家名“やきとん大王”。该句是菜单信息；是否足以满足用户完整的“kushikatsu place”含义，留给复核，不由本批自动认定。
- 同次 Google 原始结构化响应（HAR entries 80、85）包含该店的名址、电话和坐标。按原已冻结 Akabane Station 圆心机械计算约 **271.56 m**，在 1000 m 内；几何计算不替代 HARD 审查。
- 生产当前 MODEL_JUDGMENT 支持 kushikatsu，Agent context 中该店 eligible=true；但返回的 `conditionStates` 却把同一 HARD 记为 **NOT_CHECKED**，并附上上述串カツ菜单引用。此投影差异单列交 B / 复核者审查，不把 NOT_CHECKED 改成 MET 过关。
- 官网诊断文本没有保留可见电话；不能因生产称 EXACT_PHONE 就补写独立身份确认。原始 Google 和 Tabelog 详情材料仍随录制保存。

[qualification-review-input.json](qualification-review-input.json) 仅为审查材料，不是新增的已确认 Gold / qualificationOracle。原 D4 评分及冻结输入不改。

### B1 来源：原响应存在，冻结读取器拒绝了额外来源参数

返回的 B1 为：

`https://tabelog.com/en/booking/form_course/new?member=2&rcd=13173601&visit_date=20261111&visit_time=1900`

同次 HAR entry **65** 的原始 find_vacancy 响应包含对应的 19:00 相对链接；按同源解析后与该 B1 URL 逐字相同。原 body 的 base_date=11-11、members=2；并非从店号重新造出的 URL。此表单没有被打开。

评价输入中已有两份 SOURCE_CAPTURE，但它们的来源请求带合法观测参数 `exclude_unavailable_time=1`。`evaluator.ts:independentVacancy` 是严格的**四参数独立见证**读取器，却也被 B1_SOURCE_URL 的 SOURCE_CAPTURE 检查复用；它的 fieldSet 只接纳 rst_id/svd/svps/svt，因此拒绝该第五参数，返回空 links，导致 `B1_SOURCE_URL=NOT_EVALUATED`。

这是 A 的来源证据读取覆盖缺口，有原始材料和明确代码路径；本批不通过删参数、重写响应或放宽评分来补绿。独立后验 GET 仍严格只有四参数，规则正确保留。审查输入：[B1-source-review-input.json](B1-source-review-input.json)。

本次停批因此符合新政策：**存在未完成的安全核查**。离线找到数据不自动授权继续 D6。

## 4. 四层结果与首个偏离点

| 环节 | 实际观察 |
| --- | --- |
| 理解 | D4 原文与后续问答原字节不变，日期 11-11、19:00、2 人、Akabane、kushikatsu HARD 已进入权威状态；无自行改日期 / 地区。 |
| 原生发现 | 首选 Itabashi 菜单；两样本距圆心 5547 m（南）、3911 m（西南）。同次来源内执行 SELECT_REGION_ENTRANCE，换到已观察的 Kita-Ikebukuro & Itabashi St. Area；替代两样本仍在南约4041/3807 m，按 REPLACEMENT_SAMPLES_OUTSIDE_RADIUS 收尾，接纳0。 |
| 纠正边界 | 只换一次；地区页3/4，取样4个有效坐标；恢复菜单页0。Tabelog 调用元数据86.429 s，未增加90秒/10详情/500秒预算，没有回东京菜单空转。 |
| 身份 / 事实 / 查位 | Google 中发现 W1；Dengana 的 Tabelog 同店身份读到，但查位 UNKNOWN/BROWSER_TIMEOUT，未展示。另一家 Yakiton Daio 读到当前时段并经官网事实判断后进入生产可展示集合。 |
| 展示 | 服务端 PRESENT_RESULTS 1家，返回 B1 也只有同一候选；没有 D1 那种投影给未展示店的现象。未调用 departure / 预约提交。返回集合一致不等于独立确认整条 B1 或隐藏缓存负例通过。 |
| G1 追问 | `ask-private-room` NOT_SENT / SLOT_CONCLUSION_RESERVE，G1模型0次。本次没有完成“交付→追问”验收。原问答注释绑定W1，不能把W1的“无包间”参考答用于新展示的另一家店。 |
| 结束 / 评价 | 两项安全未评，stopBatch=true；D6 NOT_SENT。没有确认的 S0 FAIL，但不能把安全未评写成零S0签收。 |

首个路线偏离仍是 Itabashi 入口选择，F5 纠正执行后仍越界，按既定机制 bounded UNKNOWN。近交付卡点已转为新门店资格覆盖及 SOURCE_CAPTURE 五参数读取问题；G1 则被较晚展示压进收尾区而未到达。三类问题分开，不把未评直接归成模型编造或网站不可用。

W1 漏斗：原生Tabelog接纳0 → Google发现Dengana → Tabelog身份读到 → 库存UNKNOWN/BROWSER_TIMEOUT → 未展示。本次展示了别家，因此按冻结脚本只后验该店，没有追加W1后验；不能据此写W1结束时仍有位或已无位，也不因W1未展示就直接给本槽CAPABILITY_MISS。

## 5. 时间分解、首结果与 F6

开始 **17:20:44.458 CET**；服务端展示 **17:28:47.738 CET**；产品读流程用时 **483.348499375 s**，未超过500秒。独立合格证据齐全时刻为 **NOT_EVALUATED**，因为完整资格尚待审查，不能把生产 eligible 当作该指标。

生产上下文首次观测到 eligible 的时刻为 **17:27:35.211**，到服务端展示相隔 **72.527 s**。这是系统侧观察，不是已独立认证的首个合格结果时间，也没有前端屏幕渲染计时。

| 独占墙钟分解（已有I/O和模型跨度，避免重复相加） | 秒 |
| --- | ---: |
| 页面导航操作代理量 | 292.186 |
| 操作后等待 | 57.461 |
| 读页面结构 / 控件 | 23.295 |
| 全部模型 | 88.676 |
| 浏览器会话启动 | 1.081 |
| 页面操作 | 0.138 |
| 录制截图 | 3.258 |
| 会话关闭 | 0.268 |
| 未进一步归因 | 16.9855 |

导航操作含网络、浏览器和执行器处理，不等于纯网站网络延迟；并发跨度采用模型优先分配，Google独立等待仍未拆出。原始方法跨度与未归因项见 [observations.json](observations.json)，不凭下一次调用的开始时间补造上一操作结束。

| 模型用途 | 次数 | latency合计 |
| --- | ---: | ---: |
| 语义 | 1 | 3.890 s |
| Agent | 8 | 26.712 s |
| 发现检索 | 4 | 10.593 s |
| 浏览器动作 | 8 | 25.217 s |
| 具名来源检索词 | 7 | 16.676 s |
| 事实判断 | 3 | 4.078 s |
| 原文事实选句 | 1 | 1.510 s |

主要动作 provider latency：Tabelog发现86.429 s、TableCheck发现9.154 s、Google排队结果交接0.001 s；前两批查位131.528+142.245=273.773 s，事实调查12.792 s，最后一批查位元数据39.100 s（trajectory到AVAILABILITY_CHECKED实际跨度69.275 s，不能把元数据当整段墙钟）。

F6收尾窗于 **17:28:44.517** 打开；20秒阈值为 **17:28:44.458**。记录的保留区新读为0，另用独立OPERATION_STARTED配对日志核对导航、快照、控件及会话启动，阈值后也无新读。最后的PRESENT_RESULTS是允许的结论动作。已有时段结果被保留；新的未完成读取没有抹去它。G1追加回合因最终已到483秒而按SLOT_CONCLUSION_RESERVE省略；选店条款读取未触发，不能签收该项F6 Live。

原始观测：[raw-safety-and-timing-observations.json](raw-safety-and-timing-observations.json)。

## 6. 独立后验、Guard与三类录制

- 立即后验展示店 `13173601`：四参数GET、HTTP200，**17:28:49.155 CET**收到原始响应，含11-11/19:00/2人。SHA `8fcf84bd3f1ef54467b9c32df283cd7fbf46fdf9372e513f2c88838e7320c3d9`；没有Cookie、表单或重试。只有1 GET，不重置开发计数。
- 实际来源接收2,206请求：GET 2,203 / POST 3，独立REQUEST_BOUNDARY检查2,206/2,206 PASS，越界0。3个POST为已审核TableCheck availability_calendar_v2，正文类型及hash按既有规则核对；不把合法POST当预约提交。
- 人工介入未开启。WAIT / REQUEST_HUMAN_HELP均是保存的模型动作，来源仍按未知/失败处理，没有人工接管或绕过页面限制。
- 决策32次/32行保存；语义INITIAL一次，额外schema尝试0。
- 浏览器94页，现有Recorder准入 **12/94=12.77%**；另外82页为UNCAPTURED_STATIC_DEPENDENCY，逐页原原因见 [recording-observation.json](runs/D4/recording-observation.json)。这不是实跑重放成功率，未执行整包replay或放宽Recorder规则。
- Google **8/8** 结构化响应在同次HAR；原始Source/PUBLIC DOM、诊断DOM与独立时序元数据均落盘。未捕获脚本只列origin+path，不含query，见observations.json。
- G2候选：Tabelog snapshot **58、59** 与同次13173601空位数据保存，绑定11-11/2人/19:00；只是待审采集材料，未改G2基线或宣称新页面验收通过。
- TableCheck：30个快照已保存，3个日历POST审计存在，但HAR未保存对应POST响应正文；未找到带日期/人数/时段三重链接绑定的正例。G3b时段日历仍未认证，见 [tablecheck-calendar-review-input.json](tablecheck-calendar-review-input.json)。
- D8双渠道用户链接清单NOT_REACHED。本槽的单个B1不是D8成果，不代替用户自行核对两个渠道；Runner没有打开任何交接URL。

## 7. 预算及冻结

| 资源 | 本轮D4新增 | 3b累计 / 上限 | 开发批次累计 |
| --- | ---: | ---: | ---: |
| Live | 1 | 3/26 | 3/8 |
| 真实模型 | 32 | 298/1600 | 57/400 |
| 评测公开GET | 1 | 265/390 | **10/25，余15** |
| 环境重跑 | 0 | 0/4 | 未重跑 |
| Google | 8 | 累计27（旁账） | 本槽8/40 |
| 网站请求 | 2207 | 累计3601（旁账） | 2206来源+1后验GET |

627条运行前账目原值保留；Live1+模型32+GET1+来源I/O汇总1，追加35条为 **662条**，id唯一。之前9次GET完整继承，失败历史认证也没有丢；没有挪用留出集额度或追加调用。

W1证书原时刻 `2026-11-02T13:37:41.723Z`，24h到11-03 14:37:41.723 CET；本次有效，未重新认证。日期11-11没有改；最晚运行日11-04保留。

包SHA：`5c64ac4689cff58d298e11c077e2769da2d12ff933ba443f8a01683b7881ca36`；证据SHA：`84ab5282045046de70da25e108b146b5a00bfa59e5c3f526523ed4c4bebcc3e3`。[frozen-inputs.json](frozen-inputs.json) 及 [slot-disposition.json](slot-disposition.json) 记录取消、延期、政策和配额。

凭据只在已获准的D4受控Node `--env-file`进程中注入，未读取/打印/复制/暂存.env；没有D6、D7、W2或具名后续槽的凭据进程或真实调用。

## 8. 门禁与停止状态

冻结提交上完整七项净树复验，日志 [gates/results.json](gates/results.json)：

- typecheck、arch:check（含组装门禁）、build PASS；原条款组装控制1/1。
- 默认 **1363/1363**，40.870 s。
- 原Chromium **188/188** + G6 **57/57**，浏览器门禁164.292 s。
- 严格G2 **5/5**、12页PASS，24.276 s。
- 每项前后净树；770项执行源码/配置SHA未变；无豁免/跳过/降断言。产品、来源目录、source-packs、模型Prompt/Schema/State相对本批main d4d8ea33基线零改动。Live后只增加数据、度量和文档，不用重跑门禁掩盖安全未评。

**本批按新安全停批策略结束。D6待后续安排；D7已取消；D3新运行、D5、D2、D8仍等C修复与复核通知。** 已打包资格原文、投影差异和B1五参数证据给复核，不在本批修改这些评分/产品路径，不继续GET或Live。提交推原工作分支，不合main。
