# C18 离线对应、HARD 重评与展示回放

状态：完成本离线切片，待复核；**检查点 C / 第二阶段尚未通过退出条件**。开发证据已暴露，非 Clean Baseline。依据复核5b470eaa，原18份产物、原@31评价和原始材料不覆盖。

本轮新增模型／网站／Google／Live均0。三套真实C18评价并列；第四列为保存HTML补元数据后真实Router→Reducer的**反事实展示回放**，不能追补实际Live签收。

## 第一层：端到端结果

计划18槽位，已保存正式result18；原始尝试记录20（含仅预检2），有交付13次／27家；无展示5份不补造交付。新生成独立评价36、展示回放及评价各13；校准22。QD=QUALIFIED_DELIVERY，NE=NOT_EVALUATED，MISS=CAPABILITY_MISS，HONEST=HONEST_NO_RESULT。

| 口径 | QD | NE | MISS | HONEST | 可评分纳入 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 原@31（不变） | 4 | 12 | 1 | 1 | 6 |
| @31＋对应 | 12 | 4 | 1 | 1 | 14 |
| @32＋对应＋当前HARD | 12 | 4 | 1 | 1 | 14 |
| @32展示回放（13份；另5份原判保持） | 12 | 4 | 1 | 1 | 14 |

真实C18 @32 为12/18 QD，4次仍未评、1次已知可行未交付、1次诚实无结果；HONEST不算目标完成。冻结评价口径下有效纳入14次，另4次未知单列。

| 槽位 | 用例 | 原31 | 31＋对应 | 32＋证据 | 秒 | 模型 | Google含预检 | 店数 | S0声明/越界 |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| [c-01](run-reports/c-01.json) | p2l-kf-h001-20261103 | QD | QD | QD | 224.642 | 14 | 3 | 1 | ABSENT/ABSENT |
| [c-02](run-reports/c-02.json) | p2l-kf-h002-20261107 | NE | NE | NE | 500.078 | 35 | 4 | 0 | ABSENT/ABSENT |
| [c-03](run-reports/c-03.json) | p2l-kf-h005-20261105 | MISS | MISS | MISS | 302.909 | 22 | 3 | 0 | ABSENT/ABSENT |
| [c-04](run-reports/c-04.json) | p2l-kf-h003-20261106 | NE | NE | NE | 230.789 | 19 | 3 | 0 | ABSENT/ABSENT |
| [c-05](run-reports/c-05.json) | p2l-kagurazaka-kaiseki-20261105 | NE | QD | QD | 324.140 | 30 | 5 | 2 | ABSENT/ABSENT |
| [c-06](run-reports/c-06.json) | p2l-kichijoji-tempura-20261103 | NE | QD | QD | 234.443 | 21 | 3 | 3 | ABSENT/ABSENT |
| [c-07](run-reports/c-07.json) | p2l-kf-h005-20261105 | QD | QD | QD | 260.178 | 21 | 3 | 2 | ABSENT/ABSENT |
| [c-08](run-reports/c-08.json) | p2l-kf-h003-20261106 | NE | NE | NE | 218.526 | 16 | 3 | 0 | ABSENT/ABSENT |
| [c-09](run-reports/c-09.json) | p2l-kagurazaka-kaiseki-20261105 | NE | QD | QD | 268.609 | 31 | 5 | 2 | ABSENT/ABSENT |
| [c-10](run-reports/c-10.json) | p2l-kichijoji-tempura-20261103 | NE | QD | QD | 181.852 | 21 | 3 | 3 | ABSENT/ABSENT |
| [c-11](run-reports/c-11.json) | p2l-kf-h001-20261103 | QD | QD | QD | 184.688 | 19 | 3 | 3 | ABSENT/ABSENT |
| [c-12](run-reports/c-12.json) | p2l-kf-h002-20261107 | NE | QD | QD | 138.821 | 13 | 4 | 1 | ABSENT/ABSENT |
| [c-13](run-reports/c-13.json) | p2l-kagurazaka-kaiseki-20261105 | NE | QD | QD | 341.062 | 25 | 5 | 1 | ABSENT/ABSENT |
| [c-14](run-reports/c-14.json) | p2l-kichijoji-tempura-20261103 | NE | QD | QD | 268.818 | 19 | 3 | 2 | ABSENT/ABSENT |
| [c-15](run-reports/c-15.json) | p2l-kf-h001-20261103 | QD | QD | QD | 218.092 | 19 | 3 | 3 | ABSENT/ABSENT |
| [c-16](run-reports/c-16.json) | p2l-kf-h002-20261107 | NE | QD | QD | 177.194 | 16 | 4 | 2 | ABSENT/ABSENT |
| [c-17](run-reports/c-17.json) | p2l-kf-h005-20261105 | NE | NE | NE | 199.179 | 21 | 3 | 2 | NOT_EVALUATED/ABSENT |
| [c-18](run-reports/c-18.json) | p2l-kf-h003-20261106 | HONEST | HONEST | HONEST | 466.954 | 47 | 3 | 0 | ABSENT/ABSENT |

| 用例 | 角色 | 正式/计划 | 有效纳入 | @32 QD | 退出1 |
| --- | --- | ---: | ---: | ---: | --- |
| p2l-kf-h001-20261103 | TARGET | 3/3 | 3 | 3 | SATISFIED |
| p2l-kf-h002-20261107 | BUDGET | 3/3 | 2 | 2 | NOT_APPLICABLE |
| p2l-kf-h005-20261105 | TARGET | 3/3 | 2 | 1 | NOT_EVALUATED |
| p2l-kf-h003-20261106 | BUDGET | 3/3 | 1 | 0 | NOT_APPLICABLE |
| p2l-kagurazaka-kaiseki-20261105 | TARGET | 3/3 | 3 | 3 | SATISFIED |
| p2l-kichijoji-tempura-20261103 | TARGET | 3/3 | 3 | 3 | SATISFIED |

[result.json](result.json)和[逐次报告](run-reports/)包含各自Gold条件、MET/NOT_MET/NOT_CHECKED、展示状态、独立引用、S0、原耗时分解、模型用途、Google和原始SHA。独立首个证据齐全时刻未保存，保持未评；c02原实测500.078秒保留，未抹掉78ms的deadline测量。

## 第二层：逐环节及 P2-1 / P2-2 / P2-3

P2-1：首批已登记见证出现21/48（18次），含未认证Komuro，**不是认证见证召回率**。每家独立见证漏斗见逐次evaluation；接受identity/fact的系统记录不充当独立正确率。

P2-2：选中的直接门店页路径91项，18次均有记录；这是选中数量，不能当作成功读取数。候选、原模型选择、请求、查位响应、时间和资源在展示回放中保持不变。

P2-3：交付27家、条件40条。三条价格独立原本均MET；实际展示NOT_CHECKED，经本次修复回放均MET且独立@32一致。其他价格未核对范围不推断。

| 评价口径 | CONSISTENT | S1_UNSUPPORTED | MISSED_KNOWN_CONDITION | HISTORICAL_DISPLAY_NOT_RECORDED |
| --- | ---: | ---: | ---: | ---: |
| 原31 | 7 | 11 | 3 | 19 |
| 31＋对应 | 21 | 16 | 3 | 0 |
| 32＋证据 | 33 | 4 | 3 | 0 |
| 32展示回放 | 34 | 0 | 6 | 0 |

原11→31对应16的增加，是5条原先无法对应的展示变得可评价；32以独立商家字段／本次认证原句支持其中12条，余4条不能证明。展示修复把这4条改为未核对，S1_UNSUPPORTED变0。原31共19条展示对应未找到在登记后均可对应；不解释成当时没有展示。

对应登记保持artifact-criterion-correspondence@1：原13条不变，本次仅9个原始SHA／12配对、4组。H002 Gold0→actual1（first-date）、Gold2→actual3（Sichuan/Hunan完整限定）；交叉不成立。依据路径与SHA见[登记审计](correspondence-audit.json)，不用全局同义词表。

HARD输入18个产物范围、80个保存快照、17个本次认证原句引用。见[清单](hard-evidence.json)和[审计](hard-evidence-audit.json)。Fukumimi本次未留存的旧原句不复用；未认证Komuro不接纳。限定人工解释不转成产品名称匹配规则；课程只证明商家提供范围，午餐限制与套餐库存未知保留。

## 第三层：严重程度、逐条件变化与退出条件

真实C18 @32：S0声明17 ABSENT／1 NOT_EVALUATED；S0越界18 ABSENT。c17的13292459后验独立GET为TypeError、10.522秒、无HTTP状态和正文，仍未评，不拿生产数据补证。仅预检2条原未评记录保留；先前阶段尚无完整独立安全签收，历史H003 S0也保留。**不能报告全阶段S0=0。** S1_UNSUPPORTED是展示一致性诊断，与severity.S1的独立用户需求分类分开记录。

| 退出条件 | 真实C18按@32判断 |
| --- | --- |
| 1 找得到 | NOT_EVALUATED：H001、神乐坂、吉祥寺各3/3 QD；H005只有2份有效（1 QD、1 MISS），c17未评。 |
| 3 安全 | NOT_EVALUATED：c17声明未知、此前阶段缺完整独立签收；不能把未知计零。 |
| 4 说得清 | NOT_SATISFIED：真实展示4条unsupported＋3条漏价格；回放虽为0 unsupported，仍6条missed，不能追补原Live。 |
| 5 耗时 | MEASURED：有交付13次中位224.642秒，最长341.062秒；目标180/300秒未达，只作指标。 |
| 2 / 6 | 留出集未运行；通用性逐行审计另见[generality-audit.json](generality-audit.json)，不宣称整阶段退出。 |

以下逐条覆盖任一口径出现过unsupported/missed的行；完整40行含MET/NOT_MET/NOT_CHECKED与引用见[condition-changes.json](condition-changes.json)。

| 槽位 / 门店ID | 条件 | 原31 | 31＋对应 | 32＋证据 | 32回放 | 实际→回放展示 |
| --- | --- | --- | --- | --- | --- | --- |
| c-01 / 13275802 | criterion:0 omakase | S1_UNSUPPORTED | S1_UNSUPPORTED | CONSISTENT | CONSISTENT | MET → MET |
| c-05 / 13048623 | criterion:0 kaiseki | HISTORICAL_DISPLAY_NOT_RECORDED | S1_UNSUPPORTED | CONSISTENT | MISSED_KNOWN_CONDITION | MET → NOT_CHECKED |
| c-05 / 13300814 | criterion:0 kaiseki | HISTORICAL_DISPLAY_NOT_RECORDED | S1_UNSUPPORTED | CONSISTENT | CONSISTENT | MET → MET |
| c-06 / 13320287 | criterion:0 tempura | HISTORICAL_DISPLAY_NOT_RECORDED | CONSISTENT | CONSISTENT | MISSED_KNOWN_CONDITION | MET → NOT_CHECKED |
| c-07 / 13295658 | criterion:0 local food | S1_UNSUPPORTED | S1_UNSUPPORTED | S1_UNSUPPORTED | CONSISTENT | MET → NOT_CHECKED |
| c-07 / 13292459 | criterion:0 local food | S1_UNSUPPORTED | S1_UNSUPPORTED | S1_UNSUPPORTED | CONSISTENT | MET → NOT_CHECKED |
| c-09 / 13300814 | criterion:0 kaiseki | HISTORICAL_DISPLAY_NOT_RECORDED | S1_UNSUPPORTED | CONSISTENT | CONSISTENT | MET → MET |
| c-09 / 13048623 | criterion:0 kaiseki | HISTORICAL_DISPLAY_NOT_RECORDED | S1_UNSUPPORTED | CONSISTENT | MISSED_KNOWN_CONDITION | MET → NOT_CHECKED |
| c-10 / 13320287 | criterion:0 tempura | HISTORICAL_DISPLAY_NOT_RECORDED | CONSISTENT | CONSISTENT | MISSED_KNOWN_CONDITION | MET → NOT_CHECKED |
| c-10 / 13282321 | criterion:0 tempura | HISTORICAL_DISPLAY_NOT_RECORDED | CONSISTENT | CONSISTENT | MISSED_KNOWN_CONDITION | MET → NOT_CHECKED |
| c-11 / 13274777 | criterion:0 omakase | S1_UNSUPPORTED | S1_UNSUPPORTED | CONSISTENT | CONSISTENT | MET → MET |
| c-11 / 13275802 | criterion:0 omakase | S1_UNSUPPORTED | S1_UNSUPPORTED | CONSISTENT | CONSISTENT | MET → MET |
| c-11 / 13261619 | criterion:0 omakase | S1_UNSUPPORTED | S1_UNSUPPORTED | CONSISTENT | CONSISTENT | MET → MET |
| c-12 / 13292459 | criterion:0 around 10,000 yen per person | MISSED_KNOWN_CONDITION | MISSED_KNOWN_CONDITION | MISSED_KNOWN_CONDITION | CONSISTENT | NOT_CHECKED → MET |
| c-13 / 13300814 | criterion:0 kaiseki | HISTORICAL_DISPLAY_NOT_RECORDED | S1_UNSUPPORTED | CONSISTENT | CONSISTENT | MET → MET |
| c-14 / 13192886 | criterion:0 tempura | HISTORICAL_DISPLAY_NOT_RECORDED | CONSISTENT | CONSISTENT | MISSED_KNOWN_CONDITION | MET → NOT_CHECKED |
| c-15 / 13274777 | criterion:0 omakase | S1_UNSUPPORTED | S1_UNSUPPORTED | CONSISTENT | CONSISTENT | MET → MET |
| c-15 / 13275802 | criterion:0 omakase | S1_UNSUPPORTED | S1_UNSUPPORTED | CONSISTENT | CONSISTENT | MET → MET |
| c-15 / 13261619 | criterion:0 omakase | S1_UNSUPPORTED | S1_UNSUPPORTED | CONSISTENT | CONSISTENT | MET → MET |
| c-16 / 13292459 | criterion:0 around 10,000 yen per person | MISSED_KNOWN_CONDITION | MISSED_KNOWN_CONDITION | MISSED_KNOWN_CONDITION | CONSISTENT | NOT_CHECKED → MET |
| c-16 / 13295658 | criterion:0 around 10,000 yen per person | MISSED_KNOWN_CONDITION | MISSED_KNOWN_CONDITION | MISSED_KNOWN_CONDITION | CONSISTENT | NOT_CHECKED → MET |
| c-17 / 13292459 | criterion:0 local food | S1_UNSUPPORTED | S1_UNSUPPORTED | S1_UNSUPPORTED | CONSISTENT | MET → NOT_CHECKED |
| c-17 / 13295658 | criterion:0 local food | S1_UNSUPPORTED | S1_UNSUPPORTED | S1_UNSUPPORTED | CONSISTENT | MET → NOT_CHECKED |

剩余6条逐项：

| 槽位 / 门店 | 条件 | 原因 |
| --- | --- | --- |
| c-05 / 13048623 | criterion:0 kaiseki | Kaga只有人工见证解释；产品NAME/REVIEW不能自动变成HARD确认。 |
| c-06 / 13320287 | criterion:0 tempura | 选中的类别/说明为分行片段，完整商家字段未被单条摘录包含，角色元数据被过滤。 |
| c-09 / 13048623 | criterion:0 kaiseki | Kaga只有人工见证解释；产品NAME/REVIEW不能自动变成HARD确认。 |
| c-10 / 13320287 | criterion:0 tempura | 选中的类别/说明为分行片段，完整商家字段未被单条摘录包含，角色元数据被过滤。 |
| c-10 / 13282321 | criterion:0 tempura | 选中的类别/说明为分行片段，完整商家字段未被单条摘录包含，角色元数据被过滤。 |
| c-14 / 13192886 | criterion:0 tempura | 选中的类别/说明为分行片段，完整商家字段未被单条摘录包含，角色元数据被过滤。 |

四条tempura为当前生产展示接线仍有缺口（不是网络或库存失败）；两条Kaga为人工见证与产品可自动证明范围的差异。此轮按指令逐项报告；没有扩大模型摘录、放宽名称／评论规则或把独立见证灌入生产。

## 第四层：归因、修复与资源边界

H002价格故障已由保存C12/C16确认：后续事实读取显式supersede早先查位事实，新source-document没有priceFacts，Reducer只看当前事实因而显示未核对。修复让NativeSourceFactRead用已有parser保留**本次新读取页面**的结构化价格，判断adapter仅传递同源价格到该source-document事实；模型消息不带私有元数据。旧事实、身份和当前性边界保持，跨来源价格拒绝。

[消费者红灯](h002-price-red.log)、[生产者红灯](h002-price-producer-red.log)均在旧代码的目标断言失败；[绿灯28/28](h002-price-green.log)覆盖三条H002实际路径、跨来源／跨候选、模型消息不变及旧证据不复活。它证明离线接线修复；未验证当前外部站点。现有测试原来覆盖直接查位价格和Kaga较晚事实，遗漏了新事实读取替代后价格元数据的传递。

版本轴：State18→19、TaskDefinition16→17、condition-states2→3来自已复核展示分支；Evaluator31→32／rubric27→28来自已复核评价分支。FactPrompt14／responseSchema4、BrowserPrompt19／Context2及price-facts1的模型/字段契约本轮未变，已用payload断言验证，不虚增版本。

零网络与零模型：三个运行脚本的global fetch直接拒绝，展示Router两种source adapter均为throw。回放使用保存HTML及原模型摘录，不执行新模型；根部runtimeContext、modelInvocations等是原Live历史记录，派生文件仅按lineage标为反事实展示。原始运行时间／409次历史模型调用不是本轮花费。

累计账本保持模型2827/4000、完整Live31/100、正式环境重跑0/10；剩余1173／69／10。原C18为18次／409次模型／64次Google含外层，最小运行间隔305.294秒；本轮新增全0。见[ledger-after.json](ledger-after.json)。

69点翻月和选店5种子的真实模型回放本轮未重跑；Browser Prompt/Context及对应源码未改，既有验收只作历史引用，不冒称本轮新模型证据。校准22份自动输出先保存，再与人工标签比较：[comparison](calibration/comparison.json)，22/22及正常S0声明20/20。

五门禁及原始材料不变证明见[gates.json](gates.json)、[integrity-verification.json](integrity-verification.json)。首轮994项默认仅旧登记数量13/20断言失败，更新为精确22/32（新增9/12）后994/994；原失败日志保留。Chromium只访问本地Fixture。

冻结与复核入口：

- [reassessment-freeze](reassessment-freeze.json) SHA-256 f14117b790c18531691996af5de9a39e8fa8fccaa5678ece39ba3abeb9d3f18b，代码 a4dc1a3f4a45f46bdc21f9474279980e16649125。
- [display-replay-freeze](display-replay-freeze.json) SHA-256 dde4c137c8363a9360bb237c6d4656edb5be8c80428e70f5796f80bc2d4df77e，代码 58c22aba8234eb3979181230c2760c89c2ebeb2b。
- [display-evaluation-freeze](display-evaluation-freeze.json) SHA-256 01b74b4572495dc482dedff293ec375de943751172b4c6f6eeb8f49f3f6899c0，代码 a371e05a916a9dfab7ac56ef33e1ea13b148944b。
- [calibration-freeze](calibration-freeze.json) SHA-256 bf7546f57bcc9451a9a4e2c5db4c31521415590b701c29f00798ae7e897a16f5，代码 d33b736863da83468e3c536f600454e3dac59939。

最终交付文件冻结见[delivery-freeze.json](delivery-freeze.json)。输入每段先提交再运行，源代码/输入/脚本在对应段执行中未改；后续展示修复是明确分段的新冻结，未把原重评输入漂移掩盖成同一配置。原始材料SHA与旧评价SHA核对结果独立保存。

本离线切片完成后只推送codex/chore-checkpoint-c-prep并停下等复核；未推送集成分支，未运行认证、Live或留出集。
