# Test and Verification Log

- Status: Accepted
- Document revision: 4.270

- Document revision: 4.276
- Last updated: 2026-10-23
- Source of truth for: 每次验证结果、模式、未覆盖项和外部副作用
- Related ADRs: [ADR Index](../decisions/README.md)
- Related documents: [Current Status](../STATUS.md), [Test Skill](../skills/test/SKILL.md), [Harness Design](../harness/HARNESS-DESIGN.md)

> Historical record only. The current evidence summary and known gaps are maintained in [Current Status](../STATUS.md).

> 按需阅读入口：[月度摘要与索引](README.md)。本文件保留原始逐条详情，不作为日常全量阅读材料。

## TEST-2026-10-23-PHASE2C-WITNESS-CERTIFICATION

第二阶段c退出见证认证完成：5/6例各1家独立认证，唯一无见证例按承诺fallback后仍无充分来源支持，按用户预先批准排除；所有换地点与原始观察SHA保留。承诺整文件及六例SHA一致，原文/日期未改；42次只读来源请求（Google11、Tabelog31）全200、0重试，最小来源间隔30秒。0产品代码/模型/浏览器/完整Live/环境重跑；16项离线边界控制和零网络认证及独立字节/距离/库存复算通过，140项输入冻结保持。认证材料登记与报告只在私有留出分支；本轮不开始18次Live。最早保守观察为北京时间10月23日12:15:40.465，24小时截止10月24日12:15:40.465。 [报告](../../.eval-artifacts/phase2c-holdout/witness-certification-20261023/report.md).

## TEST-2026-10-23-PHASE2C-REVIEWED-MERGE

Reviewed ae2235b6 merged onto remote-main baseline8ba0c54a in03f585a2, no conflicts.337 source/test/skill/script/build files byte-identical to16e91940, exceptions0; no product/Prompt/Schema/evaluator changes. Fresh post-merge five gates PASS:1022 default,137 Chromium, typecheck/arch/build. Frozen9ba840d7 rerun calendar69/69, selection5/5 and independent evaluator33 calibration22/22 with normal declarations20/20, all PASS; interrupted and incomplete evidence remain unknown. Main worktree HEAD/status/all9 user file hashes preserved. New model/Google/source websites/Live0, new holdout commitments/questions not searched or opened. Historical limits and exit6 unchanged. Final evidence commit and authorized normal push to codex/feat-live-restaurant-read-path follow, then stop. [Report](../../.eval-artifacts/phase2c-merge-20261023/report.md).

## TEST-2026-10-23-PHASE2C-FINAL-OFFLINE-COMPLETE

Final Phase2c repair branch complete, pending independent review, no main merge. Promptv23 final54 replay passes exposed constraints; chain162/220, no more tuning. Goya3 saved-page replays and installed-Guard Chromium composition pass without widening query/identity/qualification rules. Five gates1022/137 PASS; frozen8ad2d118 replay69/69 calendar,5/5 selection and independent22/22 calibration/normal declarations20/20 PASS,0 new calls. Same06287b6f source count narrow3863/expanded6359 physical, this-chain delta0, shared constant candidates0; historical+272/+721 and exit6 NOT_SATISFIED retained. Google29/30 unchanged: Omotesando returned route, rejected; old Ebisu cause and40 missing ranked-response projections remain gaps. New continuation model54, Google0, websites/Live0. Initial5b2ea9bf remote verified; final authorized branch push follows evidence commit. [Report](../../.eval-artifacts/phase2c-location-semantic-20261023/report.md).

## TEST-2026-10-23-PHASE2C-BOUND-CLOCK-COLLECTION

Goya parser repaired by retaining independently bound supported clock alternatives; no extended-hour conversion or new source branch/permission. Three saved full-HTML/projection replays complete with41 supported slots including19:00 each; missing supported-time, mismatched binding, newer contradiction, all-unsupported and PENDING negatives remain UNKNOWN. Actual createLiveReadAssembly with Guard INSTALLED returns AVAILABLE/19:00 on local HAR,0 model/Google; valid before-fix composition UNKNOWN red preserved. Initial fixture setup failures explicitly excluded. Five gates all PASS:1022 default,137 Chromium, typecheck/arch/build. Production source physical delta0; formal same-scope audit and69/5/22 offline regression pending. Raw response time was not captured, so saved projection plus independent Chromium proves the mechanism, not current stock or full-task delivery. [Scope](../../.eval-artifacts/phase2c-location-semantic-20261023/goya-followup/scope.md).

## TEST-2026-10-23-PHASE2C-SEMANTIC-FOLLOWUP-PASS

Final one-shot promptv23 replay completed54/54 with54 new calls, no retries; chain162/220. Sit-down retained and invented with-tables removed3/3; NEGATIVE standing-counter preserved. Numeric-direction rows12/12: flexible under remains SOFT6/6, firm under/at-most existing max representation6/6. No more than/below absent from frozen18 messages, not separately sampled. Implementer read all54 paired condition lists and observed no other criterion regression; independent review pending. All30 changed full patches and original/v21/v22/v23 criteria retained, no historical inputs rewritten. No more prompt changes. [Comparison](../../.eval-artifacts/phase2c-location-semantic-20261023/semantic-followup-220/comparison.md).

## TEST-2026-10-23-PHASE2C-SEMANTIC-FOLLOWUP-FREEZE

User raised the chain ceiling to220 (prior108 calls) and authorized one final generic prompt revision. Promptv23 requires each modifier to correspond to user words; explicit sit-down remains allowed.54 after trials reuse the frozen54 before controls with identical captured clocks/schema/model. Valid prompt-wire red and31 semantic green retained; prepare0 network. No further prompt tuning after this batch, pass or fail. Initial5b2ea9bf repair branch pushed and remote verified. Full gates and quality replay pending. [Plan](../../.eval-artifacts/phase2c-location-semantic-20261023/semantic-followup-220/approval.json).

## TEST-2026-10-23-PHASE2C-SEMANTIC-STOP

Stopped Phase2c after real semantic replay failed:108/108 trials executed with108 calls, no retries; v22 still adds HARD sit-down restaurant with tables in3/3 after samples. Relevant soft-upper-bound after6/6 correct but v21 controls also correct, so no sampled improvement claim. Full next after sweep needs54 calls, projected162>150; remaining42 is insufficient, no quota extension or extra sampling. Google29/30 on30 calls; Omotesando route type left unsupported. Six saved rejected-location observations now resolve,3 recorded empty lists remain unresolved,40 old selected projections lack ranked response/types and remain NOT_EVALUATED. Goya saved query/date/party and19:00 response confirmed, collection parser rejects non-clock tail; diagnosis only, no provider-specific patch. Zero-call offline five gates1021/136, cached69/69+5/5 and independent22/22 calibration/normal declarations20/20 PASS do not override semantic failure. Site-specific lines net0 this batch; historical increase retained. Mainline integrated/pushed8ba0c54a; repair branch local only, pending user decision. New source websites/completeLive0; chain model count3634+108=3742/5000, local cap150 unchanged. [Report](../../.eval-artifacts/phase2c-location-semantic-20261023/progress-report.md).

## TEST-2026-10-23-PHASE2C-SEMANTIC

Phase2c semantic candidate: promptv21 to v22, schema3 and compiler unchanged. Generic entailment/polarity rule rejects invented positive prerequisites/amenities; numeric relation/direction/strictness is independent of condition strength, so a flexible ceiling remains a SOFT ceiling. Valid prompt-wire red retained,31 semantic tests pass; actual saved affected-family proposals preserved as quality red evidence. Prepared18 exposed families x3 repetitions xbefore/after=108 trials, existing schema retry envelopes frozen, real-model hard cap150. Same captured clocks on both sides;54 before system messages byte-identical to original captures. Original materialized-clock inputs retained, no historical request/Gold rewrite. Real semantic replay pending; current new Google30, source websites/Live0. [Plan](../../.eval-artifacts/phase2c-location-semantic-20261023/continuation-plan.md).

## TEST-2026-10-23-PHASE2C-LOCATION

Phase2c location candidate: delete spelling/suffix admission and use ranked valid geographic observations; preserve100km context and leading-three separation bound, merchant-only unresolved. Same adopted center/name exposed in Web reply and artifact; original AREA retained. Valid saved Ningyocho red and actual Web-composition display red retained; google24/24, Web production-composition1/1, typecheck/arch/default1021/build pass. Five obsolete spelling-only tests retired in favor of ranked/type/distance behavior, not skipped. Existing successful-coordinate fixture still passes. Thirty Google names were committed at e04e9700 (SHA206c368b15133eea1204ca82af026c043336ae66911e83bec9f78a34605b435d). Google/saved-response checks pending frozen execution;0 new model/Google/site/Live so far. Ebisu upstream empty-list cause remains unknown due missing raw HTTP. No invented request fallback. [Plan](../../.eval-artifacts/phase2c-location-semantic-20261023/continuation-plan.md).

## TEST-2026-10-23-PHASE2C-MAINLINE-INTEGRATION

Integrated exact prep06287b6f into main06703ba1 in merge6cbf43c8, preserving both histories, main allowance5000 and Phase2b decision. No manual conflicts;331 source/test/skill/script/config files match1a715325 byte-for-byte with0 exceptions. State20/Evaluator33/rubric29. Fresh five gates1024/136 PASS, cached calendar69/69 and selection5/5, independent22/22 calibration and normal S0 declaration20/20. No new models/Google/source websites/completeLive; local user worktree unchanged. Phase2c implementation pending on the integrated base. [Report](../../.eval-artifacts/phase2c-mainline-integration-20261023/report.md).

## TEST-2026-10-23-CHECKPOINT-C-PHASE2B-OFFLINE-EVALUATION

仅离线评价保存的18次第二阶段b运行；对应及结构预算先登记SHA并提交冻结，固定Evaluator33/rubric29无后改。7QD/7MISS/2未合格/2未评，例01与04各3/3，仅2例达单例门槛；例02按运行前无见证批准排除。39条对照33一致、6条已审不等价价格展示未对应。S0 PRESENT为0，声明4次/越界6次未完整评价；退出2/4/6未满足、3未完整评价，5仅指标。站点窄口径3591→3863（+272），共享层新增常量候选0。0新模型/网站/Live/重跑，累计3634/5000模型、72/100 Live、3/10环境重跑。原始材料、Gold、评测器、rubric与登记不改；仅私有准备分支推送后停下等签收。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/evaluation-20261023/four-layer-report.md).

## TEST-2026-10-23-CHECKPOINT-C-PHASE2B-WORDINGS-PENDING

第二阶段b原顺序18槽位已全部保存原始产物与SHA；本批294模型、18完整Live、0环境重跑，累计3634/5000模型、72/100 Live、3/10重跑。Live冻结69209a016be68d6df97417fa7679d70b0e321212ab0c6d6400f361ba507f8448的884项未变；完成于2026-10-22T22:23:37.641Z，早于见证截止。仅抽14份产物的20条候选措辞配对；无能力评价/退出结论，等待独立措辞判定。第02例既定业务无见证排除记录保留，未修改产品/Prompt。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/exit-live/pending-wordings.md).

## TEST-2026-10-23-CHECKPOINT-C-PHASE2B-WITNESS-RESUMED

已批准恢复的评测侧见证认证完成：五例有见证，一例主地点及承诺fallback业务无见证，按用户预先批准排除能力分母并保留全部18槽位。80来源请求、0模型/Live/环境重跑；新增外层19项控制全绿，生产与Prompt字节未改，复用已验收五门禁及回放基线。累计3340/5000模型、54/100 Live、3/10重跑；最早见证截止2026-10-23T17:14:00.086Z。下一步提交最终冻结后连续执行18次，能力评价延后，仅提措辞等待复核。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/plan.md).

## TEST-2026-10-23-CHECKPOINT-C-PHASE2B-STEP3-HTTP400-STOP

已批准连续任务：步骤1验收与步骤2三次暴露Live检查通过；步骤3只读认证在四参数接口HTTP400处按冻结采集器停止，原始响应与部分登记已保存，未将来源失败/未到达冒充业务无见证。新留出Live 0/18、未作能力评价；本阶段认证0模型，累计3340/5000模型、54/100完整Live、3/10环境重跑。详见停止四层报告、部分登记、源节奏审计和冻结；等待复核。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/plan.md).

## TEST-2026-10-22-CHECKPOINT-C-PHASE2B-WITNESS-INPUTS

在前两步全部通过后才打开复核者提供的da8ff090新留出：承诺eb5458b2与71d9961c及提供分支逐字一致，原文358beff8、6份用例SHA独立匹配，字符串严格校验通过。按东京10月23日物化6例日期，与复核exit-dates一致，只填日期无其他更改。原文只用于本次退出认证/执行，不复制到开发Fixture、语义Prompt或开发日志；生产代码保持三次合格检查的版本。准备冻结后0模型、30秒来源节奏查找认证。现累计3340/54/3、上限5000，剩1660/46/7；尚无新留出模型请求或Live，能力评价延后。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/plan.md).

## TEST-2026-10-22-CHECKPOINT-C-PHASE2B-STEP2-LIVE-PASS

三次旧暴露完整Live检查全通过：例03两次及例01对照均Evaluator33/rubric29 QD，各交付3家，三次实际先到Tabelog。例03见证1/2进候选，两次返回18:00至20:00窗口内九时刻并集；例01见证3/3入候选，19:00。声明/越界均ABSENT；无重跑，间隔/500秒/50模型/40Google/旧见证有效期均满足。新增60模型/3Live/0重跑，累计3340/54/3，按5000剩1660/46/7；不计任何退出分母。冻结8afad494/4175项前后通过，原始/独立评价/四层报告已保存。第三步新原文仍未打开，接下来核对承诺及分支后准备新见证，最终18次只提措辞不评价。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/four-layer-report.md).

## TEST-2026-10-22-CHECKPOINT-C-PHASE2B-STEP1-COMPLETE

第一步合并验收全部满足：预算/团体/流水线已按序进入准备分支，模型累计上限5000。实际五门禁1024/136、缓存真实响应69/69与选店5/5、独立校准22/22及旧例02五条预算均CONSISTENT。69与5请求经当前生产重建后逐项内容相同；无新模型/网站/Live。冻结f648d2df/4173项前后核对，当前3280/51/3、剩1720/49/7；旧原始/评价/Gold保持。新留出未打开，进入已批准三次旧暴露Live检查，必须在旧见证北京时间10月23日14:41:36前完成；不过门槛即停，不续期。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/four-layer-report.md).

## TEST-2026-10-22-CHECKPOINT-C-PHASE2B-MERGED-INPUTS

已按顺序合入预算200e13cf、团体98cc7994、退出流水线47afd2d7，逐项保留各方行为、测试与历史正文，统一State20/Task18和文档修订；只摘取06703ba1预算批准。累计模型上限5000，当前3280剩1720；Live100与重跑10不变。实际五门禁1024/136全绿；69+5请求经当前生产重建，与批准内容完全相同（仅既有30秒传输超时差异），准备提交冻结后复用真实响应验收、独立22校准及旧例02五预算行回放。三次检查入口复用同一外层，仅三槽计划/单独授权，16项控制通过；原18槽行为保留。新留出未打开，模型/外站/Live增量0。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/plan.md).

## TEST-2026-10-22-PHASE2B-EXIT-PIPELINE-COMPLETE

Phase2b退出流水线已完成零网站/零模型离线验收：最终d662a23b冻结3112项，旧暴露18槽位完整通过；6例见证3/3/2/3/1/2，9条目12措辞对不附结果，3份结构预算对应，缺判词评价0次、复用旧独立判词后18份评价。五门禁全绿（1005默认/131本地浏览器）。新留出仅71d9961c承诺未开原文，产品/ADR/Gold/预算及例03不改；旧500076/500080ms超限保留。此为流水线准备验收，非新留出或阶段退出；基线剩720模型不足900最低预留，未扩容。推送后停下等复核。 [报告](../../.eval-artifacts/phase2b-exit-pipeline-20261022/four-layer-report.md).

## TEST-2026-10-22-PHASE2B-EXIT-PIPELINE-PREP

在17415d1c独立分支准备Phase2b退出流水线；仅引入71d9961c承诺，未读新留出原文。增加SHA先于解析、非字符串条件拒绝、日期/后备记录、800米见证、18槽位及措辞复核门禁，复用旧Runner/独立Evaluator33。旧例05类型门禁红绿通过，后续提交冻结后演练旧已暴露18产物；模型/网站/Live均0，预算修复和例03不改。 [计划](../../.eval-artifacts/phase2b-exit-pipeline-20261022/plan.md).

## TEST-2026-10-22-CHECKPOINT-C-BUDGET-CONDITION-COMPLETE

结构预算漏核对和漏展示已修复：生成稳定criterionRef的HARD行，资格与展示共用来源价格结果，超预算/无价拒绝；SOFT比较含义和既有价格政策保留。h-02/h-08/h-14原事件经当前Router→Reducer，5条预算及全部10条条件与Evaluator33/rubric29独立评价CONSISTENT，原产物/旧评价不覆盖。4个红灯、42项相关测试、实际五门禁（1001/1001、131/131）与校准22/22全通过。代码46d471ff；回放冻结5ff44333（2898项）、校准0452645d（808项）运行前后均一致。h11的around已在原模型Proposal，3495ms成功而非超时，仅报告比较方向修正建议，未改语义Prompt。0新模型/网站/Live，累计3280/51/3不变；仅本修复分支，未集成，推送后停下等复核。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/budget-condition-20261022/four-layer-report.md).

## TEST-2026-10-22-CHECKPOINT-C-BUDGET-CONDITION-INPUTS

在请求分支修复结构预算遗漏：同一条件结果供HARD核对和展示，保留现有SOFT政策及来源约束。已复现4个红灯并通过42项相关回归；完整单测1001/1001、本地浏览器131/131通过，W11测试替身补齐来源报价事实。准备提交当前代码、三份已保存例02输入和离线脚本后冻结，再跑五家Router→Reducer的独立33展示复核与22项校准；h11只报告语义Proposal已改写比较方向，不修改Prompt。无新增模型/网站/Live，不改旧运行和评价，未集成。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/budget-condition-20261022/plan.md).

## TEST-2026-10-22-CHECKPOINT-C-HOLDOUT-CASE05-REASSESSMENT

按19941c4e批准的可逆格式恢复补评例05三次，使用原Evaluator33/rubric29和原证据。h-05/h-17由原NE变QD，h-11格式错误消除后仍因已判不等价的SOFT措辞保留NE；旧三份NE、原始运行、Gold和承诺SHA不覆盖。全18参考结果10QD/7MISS/1NE，例05达2/3，共4/6例达标；仅数值子门槛通过，例03第一卡点仍属P2-1，完整退出2仍不满足。退出4/6不满足、3未完整评价、5仍仅指标；S0声明17ABSENT/1未评、越界15ABSENT/3未评，无新阳性，历史H003和H005两种口径保留。冻结d6315af5前后2975项、旧779/2891项、326生产/评测及483校准输入SHA均通过，复用五门禁和22/22校准。其他15评价不重跑，增量模型/网站/Live/重跑0，累计3280/51/3不变；推送后停下等签收。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/evaluation-20261022/case05-reassessment-20261022/four-layer-report.md).

## TEST-2026-10-22-CHECKPOINT-C-HOLDOUT-CASE05-FORMAT-RECOVERY

按19941c4e和用户批准，只对例05三份原SHA绑定的required_claims[1]单键对象逐字恢复为字符串；三份输入往返还原与唯一字段差异核对已通过。使用Evaluator33/rubric29现有批准更正接口，原始Gold/承诺/运行/旧NE不变，其他15份评价不重跑。准备提交冻结后0网络0模型补评三份，按原阈值与第一卡点条款更新退出，推送后停下。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/evaluation-20261022/case05-reassessment-20261022/plan.md).

## TEST-2026-10-22-CHECKPOINT-C-HOLDOUT-EVALUATION-COMPLETE

已按dfdb175b完成18份保存产物的Evaluator33/rubric29离线评价；原始对应后5QD/3未合格/7MISS/3未评，结构预算对应的3份表示视图后为8QD/7MISS/3未评，原始和派生SHA并列。例02预算8000JPY保留，5条预算展示缺失；h-11 SOFT不等价未登记，另3条无等价展示。仅3/6例达2/3，退出2/4/6不满足、3未完整评价；52条件44一致、8未对应，0unsupported/missed。例05三份冻结required_claims字段object导致未评，未改Gold或排除本例。站点目录3591→3809行（+218），含混合文件5638→6279（+641）；共享层新增站点等常量候选0。有展示11次中位193.250秒/最大286.209秒仅指标；历史H005两口径和H003 S0保留。779 Live/2891评价冻结项、18原始SHA、326生产/评测文件及483校准输入均核对，复用五门禁998/131和22/22。新增模型/网站/Live0，累计3280/51/3不变；推送报告后停下等签收，不报告阶段通过。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/evaluation-20261022/four-layer-report.md).

## TEST-2026-10-22-CHECKPOINT-C-HOLDOUT-EVALUATION-INPUTS

离线评价前已同步dfdb175b：9原产物9等价对应，6对拒绝（含1个SOFT偏差、5交叉配对）。例02三次的语义事实与最终意图均保留结构预算8000JPY；单独登记原SHA与字段路径，未补造价格核对或展示。为不改Evaluator33建立3个仅预算表示投影的评价视图，原始字节与原始33评价保留。阶段起点025940c5审计站点目录3591→3809行、含混合文件5638→6279行，退出6不满足；共享生产层新增常量候选0。准备提交冻结后用网络阻断器评价全部18份，不改产品、不跑模型或Live。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/evaluation-20261022/plan.md).

## TEST-2026-10-22-CHECKPOINT-C-HOLDOUT-AWAITING-WORDINGS

六例见证3/3/2/3/1/2；按冻结d97eeab7完成18槽位、19次尝试（1次合规预检环境重跑），北京时间19:14:03结束，在最早见证24小时窗内。仅离线提取9原产物/15待对应措辞，逐条SHA和零基编号已核，不生成能力/条件/展示/退出评价。记录耗时最大500080ms超500000上限80ms，单列协议偏差待复核，未放宽阈值；原始与779冻结项保持。累计3280模型/51完整Live/3环境重跑，原始秘密扫描0匹配。本留出已暴露，非后续Clean基线；推送原始、账本及措辞后停下等独立判定。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/plan.md).

## TEST-2026-10-22-CHECKPOINT-C-HOLDOUT-LIVE-READY

六例见证全部有效（3/3/2/3/1/2），截止不重置为最早观察后24小时。0网络0模型完整演练已走通外层、完整Runner、独立S0安全检查、延后执行清单和措辞提取，未生成能力评价文件；13项新增/核心控制全绿，其他既有控制另留日志。326生产/Prompt/评测文件未变，五门禁按SHA复用。即将冻结18次完整留出运行，不带run-ids；完成后仅提交待复核措辞和原始记录，不报告评分。C签收H005严格原规则与用户特批30秒两口径并列。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/plan.md).

## TEST-2026-10-22-CHECKPOINT-C-HOLDOUT-LIVE-INPUTS

第05例按复核许可的商家地域/业态字段及四参数原始库存补证，六例3/3/2/3/1/2家均认证；其余完整来源不重采。仅Runner机械投影落实已批准备用地点。外层新增冻结留出计划与延后评分：Runner不自动评价、仅保留独立S0及环境重跑白名单；12项离线控制通过，326生产配置文件与通过基线SHA相同。准备0网络0模型接线演练再冻结18次，尚未运行留出Live。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/plan.md).

## TEST-2026-10-22-CHECKPOINT-C-HOLDOUT-CONTINUATION

依据044f7de7及用户续行批准，补充第05例非川菜细分类别见证；无见证仍完整运行18次且排除该例能力分母。沿用其余有效登记，30秒决策不变，准备冻结延后评价编排；运行后仅提交未对应措辞，不生成评分。当前仅离线准备，原停止材料保持。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/plan.md).

## TEST-2026-10-22-CHECKPOINT-C-HOLDOUT-WITNESS-STOP

C17用户特批30秒重跑已QUALIFIED_DELIVERY（3家、29/29模型成功），C机械门槛PASS；随后按批准步骤解封并核对原文件/6例SHA，0模型认证登记为3/3/2/3/0/2家，两个唯一备用地点均留证。第05例备用地点仍缺负向HARD明文，见证门槛5/6而停；留出18次和措辞对提取均NOT_REACHED，不生成产品评分或最终Live启动冻结。生产/Prompt/评测器与C17通过时逐字节相同，复用五门禁998+131和校准22/22；累计Live33、模型2885、完整Live环境重跑2，认证传输重试单列。等待复核，不继续来源请求或Live。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/four-layer-report.md).

## TEST-2026-10-22-CHECKPOINT-C-HOLDOUT-INPUTS

前两步通过后才解封指定留出提交b1ed9979；原5418字节与承诺SHA、6例文档SHA全部一致，commitment与父提交逐字节相同。原文不改，Runner只按exit-dates物化日期并添加运行信封，其他条件/验收一致。当前只准备0模型地点解析/见证发现，不开发或调试生产代码/Prompt；正式18次后按用户要求仅抽未对应措辞、不附结果。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/plan.md).

## TEST-2026-10-22-CHECKPOINT-C-C17-TIMEOUT-PASS

用户特批30秒决策补跑通过：c17 attempt3在214.037秒以29模型交付3家，@33 QD，S0声明/越界ABSENT，6条展示均CONSISTENT，3家事后GET200；一次浏览器模型响应15.692秒成功（旧限10秒）。29/29模型成功，旧CAPABILITY_MISS和全部原始未覆盖。H0052/3QD，其余TARGET各3/3；当前用户C门槛PASS。默认998/浏览器131及五门禁全绿，@33校准22/22只复用经SHA验证的不变评价输入。累计2885/4000模型、33/100Live、2/10正式重跑（用户特批额外1次保守计入），随后按原连续授权进入留出准备，当前尚未打开。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c17-timeout-retry-20261022/four-layer-report.md).

## TEST-2026-10-22-CHECKPOINT-C-C17-TIMEOUT-INPUTS

用户额外批准H005一次补跑：Agent及Browser决策超时10→30秒，500秒/50模型/40Google总限额不改；不增加自动重试，不改模型/消息/Prompt/Schema/@33评价。旧29调用含2次TIMEOUT和CAPABILITY_MISS保留。先红绿及五门禁，提交新freeze后只跑c17 attempt3；本次额外正式补跑保守记第2/10环境重跑。留出集仍未打开。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c17-timeout-retry-20261022/plan.md).

## TEST-2026-10-22-CHECKPOINT-C-C17-STOPPED

第一步双向引文修复已通过（38一致+2外部支持，0 unsupported/missed，校准22/22，五门禁全绿）。c17唯一补跑258.141秒/29模型/0交付：最后Agent调用10.004秒TIMEOUT，@33独立判CAPABILITY_MISS；本次声明/越界S0均ABSENT。H005仍1/3QD，其余TARGET各3/3，C门槛FAIL，按用户机械停止规则未打开留出集。新增1Live/1环境重跑，累计2856/4000模型、32/100Live、1/10环境重跑。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c17-environment-retry-20261022/four-layer-report.md).

## TEST-2026-10-22-CHECKPOINT-C-C17-RETRY-INPUTS

离线补修通过后按用户连续授权准备c17唯一环境重跑：resume@3验证原18份、TypeError独立复查失败、复核SHA和第一步五门禁/七条展示门槛。外层绑定@33/rubric29并按1次预留50模型，原18顺序/预算/停止规则不变；HARD仅绑定运行自身原始快照与当前已复核见证。留出集仍未打开。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c17-environment-retry-20261022/plan.md).

## TEST-2026-10-22-CHECKPOINT-C-BIDIRECTIONAL-PASS

第一步双向字段引文补修通过：同一C18的40条展示对照38 CONSISTENT、2 PRODUCT_UNKNOWN_EXTERNAL_SUPPORT，天妇罗4/4、Utou3/3均一致，0 unsupported/missed；校准22/22，五门禁998+131全绿。网站、模型、Live均0；旧原始及评价SHA保持。连续授权下一步为c17唯一环境补跑，留出集尚未打开。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c18-bidirectional-acceptance-20261022/four-layer-report.md).

## TEST-2026-10-22-CHECKPOINT-C-BIDIRECTIONAL-INPUTS

按复核者决定修复双向字段引文：完整字段被所选段落包含时仅展示字段原文；分行文字被字段包含时展示所选文字。Utou原三条红灯已复现，修后与天妇罗四条及跨角色评论边界均通过。当前仅离线；待C18回放@33、校准和五门禁后才解锁c17补跑，留出集未读取。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c18-bidirectional-acceptance-20261022/plan.md).

## TEST-2026-10-22-CHECKPOINT-C-C18-ACCEPTANCE-STOPPED

STOPPED于离线验收：字段⊇语句修复使天妇罗4/4 CONSISTENT，Evaluator33/rubric29使Kaga2条单列PRODUCT_UNKNOWN_EXTERNAL_SUPPORT，unsupported0；但Utou标题含相邻8 items计数时丢失角色，c05/c09/c13新生3条MISSED，C18无MISSED门槛失败。未继续改口径、未消耗c17环境补跑、未读取留出集。已将同一实际判断适配器->Router->Reducer反例纳入默认：最终996/997（1失败），不是五门禁全绿；其余type/arch/build及本地Chromium131/131通过，校准22/22/声明20/20。13份展示回放/@33评价保留，5份N/A，原2299材料/18结果/18旧评价未变。新增模型/网站/Live0，累计2827模型/31Live/0正式环境重跑不变；推送准备分支后停下等复核。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c18-acceptance-20261022/four-layer-report.md).

## TEST-2026-10-22-CHECKPOINT-C-C18-FIELD-ROLE-EVALUATOR33-PREP

依据复核fbb200ec开始用户批准连续步骤，当前仅离线第一步：字段⊇所选完整语句继承角色并保留所选原句；不扩成未选整字段。Evaluator33/rubric29分离产品已观察支持与外部支持，Kaga未知不再误记missed，S0和unsupported不放宽。两条有效红灯保留，初步相关159/159，准备提交冻结、重做C18展示回放/校准/五门禁。留出分支未打开；H005补跑尚未开始，必须先过第一步并在20:23前完成。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c18-acceptance-20261022/plan.md).

## TEST-2026-10-22-CHECKPOINT-C-C18-OFFLINE-COMPLETE

本离线切片完成，非阶段签收：只在准备分支合入复核6d758f70的Evaluator32/rubric28及4fcf7702的展示修复，登记仅9个原SHA/12对应（旧13不变），当前认证见证原句限定清单已提交冻结。18份保存产物按原31、31+对应、32+对应+HARD并列：4QD/12NE/1MISS/1HONEST -> 12QD/4NE/1MISS/1HONEST；原始评价不覆盖。真实Router->Reducer回放13份、5份N/A，32展示unsupported4->0，H002价格遗漏3->0；仍6条MISSED（人工见证2、字段/摘录粒度4），逐条留证。退出1/3未评、4未满足、5中位224.642秒/最长341.062秒仅指标；不报告阶段通过。五门禁994/131全绿、校准22/22、正常S0声明20/20；2299原始文件、18原产物与18旧评价SHA不变。新增模型/网站/Live0，累计2827/31/0不变。提交并推送准备分支后停下等复核，不跑Live。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c18-offline-reassessment-20261022/four-layer-report.md).

## TEST-2026-10-22-CHECKPOINT-C-C18-DISPLAY-REPLAY-RESULTS

离线Router->Reducer展示回放13/13，另5份无展示明确N/A；2738输入与2757评价输入运行后核SHA通过。32评价S1_UNSUPPORTED 4->0，H002漏价格3->0；同时保留6条MISSED（Kaga人工见证2、tempura选中摘录与字段范围4），不扩大规则强行通过。默认994项首轮仅登记旧数量断言13/20失败，已按复核精确更新为22产物/32对，其中新增9/12；失败日志保留，继续最终门禁。原C18/评价不改，0新增模型/网站/Live。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c18-offline-reassessment-20261022/plan.md).

## TEST-2026-10-22-CHECKPOINT-C-C18-DISPLAY-PRICE-REPAIR

已合入复核展示分支4fcf7702，五文档冲突保留双方历史。H002价格缺失根因为后续事实读取未保留同页结构化价格；现由原生产解析器随当前来源文档传递，模型消息不增加元数据，旧证据不复活。消费者原反例与生产者隔离红灯均为有效断言，当前相关28/28；三条C12/C16价格经Router->Reducer为MET。State19/TaskDefinition17/condition-states3，FactPrompt14/Schema4、Browser19/Context2和Evaluator32/rubric28分别统一，未变的轴不虚增。下一步提交冻结后回放13份已有展示，5份无展示不补造；0模型/网站/Live，账本2827/31/0不变，非Clean。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c18-offline-reassessment-20261022/plan.md).

## TEST-2026-10-22-CHECKPOINT-C-C18-REASSESSMENT-RESULTS

C18两套离线补评18+18完成，2678冻结项运行后未变、外部调用0。原31为4QD/12NE/1MISS/1HONEST；31+对应和32+对应+当前HARD均12QD/4NE/1MISS/1HONEST，三者新文件并列，原评价不改。展示对照S1_UNSUPPORTED：原11→31对应16→32为4；MISSED_KNOWN_CONDITION仍3。剩余未知保留c02/c04/c08/c17，不补抓网络或重跑模型；下一步合入4fcf7702进行展示反事实回放。累计模型2827/正式Live31/正式环境重跑0不变，非Clean Baseline。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c18-offline-reassessment-20261022/plan.md).

## TEST-2026-10-22-CHECKPOINT-C-C18-REASSESSMENT-FROZEN

C18离线双评输入已准备：Evaluator32/rubric28，归档31代码3aeb708b；9产物/12对应、80保存快照、17当前认证见证引用。Fukumimi旧原句本次未找到，未加入人工HARD输入。重评冻结f14117b790c18531691996af5de9a39e8fa8fccaa5678ece39ba3abeb9d3f18b，共2678项依赖与原始文件已核SHA；提交后仅本地运行两套18份评价，原评价不覆盖。0新增模型/网站/Live，账本2827/31/0保持；展示修复尚未合并，非Clean。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c18-offline-reassessment-20261022/plan.md).

## TEST-2026-10-22-CHECKPOINT-C-C18-EVALUATOR32-MERGED

C18离线重评已合入Evaluator32/rubric28及其独立复核6d758f70；五份并行文档冲突保留双方历史，Eval Skill同步到当前32契约。登记仍仅9个C18原始SHA/12配对，旧13条不变。下一步准备当前认证见证与保存HTML清单、提交冻结后进行31/32并列重评。尚未运行新评价或展示回放，0模型/网站/Live，账本2827/31/0不变；draft / not integrated，非Clean。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c18-offline-reassessment-20261022/plan.md).

## TEST-2026-10-22-CHECKPOINT-C-C18-CORRESPONDENCE

C18离线重评准备：按独立复核5b470eaa登记9份原始SHA/12个条件配对，原13条登记不变，独立字面审计与加载器控制通过，H002交叉配对0。原18个result及旧评价保留；当前仍为Evaluator31，后续合入32并冻结本次见证/保存HTML输入。0新增模型、网站、Google、Live或环境重跑，累计账本2827模型/31正式Live/0正式环境重跑不变。draft / not integrated，非Clean Baseline。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/c18-offline-reassessment-20261022/plan.md).

## TEST-2026-10-22-CHECKPOINT-C-CONTINUATION-RESULTS

当前C18正式18次完成（原8次保留，续跑c-09至c-18共10次）；冻结评测器@31/rubric@27：4 QUALIFIED_DELIVERY、1 CAPABILITY_MISS、1 HONEST_NO_RESULT、12 NOT_EVALUATED。退出条件1/3为NOT_EVALUATED，4为NOT_SATISFIED，5仅测量（交付中位224.642秒、最大341.062秒）；正式S0声明9 ABSENT/9未评价，越界18 ABSENT。续跑新增231模型调用/10正式Live；累计2827/4000模型、31/100正式Live、0/10正式环境重跑；原8次/178调用不重复计账。续跑冻结a6843af52023b2febdcb6fc5e5b576262c649fb82f1d686a7d59706b2c701e1e；558冻结输入、1044旧原始文件与2299总原始文件SHA核对通过。汇总审计0网络/模型，非Clean Baseline；已结束执行，提交推送后停下等独立复核。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/four-layer-report.md).

## TEST-2026-10-21-CHECKPOINT-C-CONTINUATION-READY

用户要求继续剩余Live；只从c-09预检失败处额外进入1次，再原序c-10至c-18，不带--run-ids。旧8次正式样本/10条attempt原评价不动，神乐坂自动额度仍耗尽，S0继续立即停。仅替换过期c03恢复入口为当前c09证据绑定；31项离线控制通过，生产/外层主脚本/计划/评测器@31/rubric@27均未改，旧门禁与69/5/22结果复用。账本2596模型/21Live/0正式环境重跑，所有47来源SHA核对；截止仍10月22日20:23:38.769北京。先提交冻结后启动，未知条件与展示问题继续如实记录。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/checkpoint-c-continuation-20261021/plan.md).

## TEST-2026-10-21-CHECKPOINT-C-LIVE-STOPPED

Live冻结598585fd（507文件）保持不变，评测器@31/rubric@27。见证重新认证6/6通过（15/16家有匹配库存）。C18于c-09预检失败后按同一用例重试已耗尽停批；8次完整Live：QD2、CAPABILITY_MISS1、NOT_EVALUATED5，另2次来源预检失败；c-10至c-18 NOT_REACHED。声明6 ABSENT/2未评、越界8 ABSENT（正式运行），不作零S0签收。模型178含8次TIMEOUT、Google28；累计2596/4000模型、21/100完整Live、0/10正式环境重跑，来源重试1单列。退出1/3/4未验收；四层报告与原始result/decisions保留，停止等待复核。 [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/plan.md).

## TEST-2026-10-21-CHECKPOINT-C-RECERTIFIED

Six-case recertification PASS,15/16 witnesses: H0012,H0023,H0033,H0052,Kagurazaka2,Kichijoji3.33GET all200,min gap30s,0model/Google/Live/retries. Komuro no matching19:30 retained; dates unchanged. Earliest2026-10-21T12:23:38.769Z,Live deadline2026-10-22T12:23:38.769Z. Original raw/capture freeze unchanged; completed-capture offline audit corrected whole-object equality for optional dow, preserving old failure/script and new497-file auditfreeze. Final Live freeze598585fd34b9b5877ba644cdfb5b6a20d4cf83a796de1219ae4f70a53dedeb7d (507files),evaluator31/rubric27. Budget2418models/13Live/0env; source and all18 order/rules unchanged. User preapproved original18 without --run-ids; launch next, no third quick run. [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/plan.md).

## TEST-2026-10-21-CHECKPOINT-C-MERGE-FREEZE

Reviewed fix27b3884a fast-forwarded into prep; evaluator31/rubric27 bound with original18 order/budgets unchanged. Certification freeze a71b2e56d39ea24d939cf9b06cf21e9a5074e614da70c6ecae07034e1d5feeee (425 files), code b6d4abd3. Complete scripted outer rehearsal1/1,0network/0models; outer and certification controls green. Accepted source hashes unchanged; gates982/131,calendar69/69,selection5/5,calibration22/22 reused. Runtime ledger2418models/13Live/0env,remaining1582/87/10; reserves24 attempts/1200calls. User authorizes recertification then full18, no third quick run; old results and H003 S0 retained. [Batch](../../.eval-artifacts/checkpoint-c-live-20261020/checkpoint-c-rerun-20261021/plan.md).

## TEST-2026-10-21-EVALUATOR32-HARD-COURSE-EVIDENCE

- Valid old-code red uses complete independent post-delivery inputs and fails only course HARD status. Focused140/140, default988/988, local Chromium131/131, typecheck/arch/build green. New tests reject name/review/neighbor/hidden/superseded/wrong-source/hash/request/late evidence and preserve lunch scope. Calibration22/22 and S0 declaration20/20; quick3 QD/QD/DU preserved, five HARD statuses independently supported with offering scope/manual restrictions and Kaga missing citation kept separate. Freeze1354 verified; no model/websites/Live.
- [Report](../../.eval-artifacts/evaluator-hard-course-evidence-20261021/report.md); frozen evidence and limitations remain separate from Live signoff.
## TEST-2026-10-21-CONDITION-DISPLAY-CLASS-TOKENS

- Class-token review followup PASS on isolated display branch; reviewed base5110f6aa, full tokens for course cards/title/description/review/name, no JS dependency. Fixture covers reorder/extra/no-JS/prefix exclusion; related39/39, default987/987, local Chromium131/131, type/arch/build PASS. Prompt/Schema/State and qualification unchanged. Zero models/sites/Live; both accepted fixes await checkpoint-C completion before integration.
- [Report](../../.eval-artifacts/condition-display-evidence-20261021/class-token-followup/report.md). Raw red/green and five-gate logs retained; existing quick3/calibration not rerun.

## TEST-2026-10-21-CONDITION-DISPLAY-EVIDENCE

- Valid original Kaga Router->Reducer red plus quote/meal/name/review controls saved. Focused57/57, default986/986, local Chromium131/131 and type/arch/build pass. Chromium verifies real source field labels in Web. Source parsing rejects nested reviews/neighbors and preserves lunch. Frozen quick3 display replay3/3 PASS; 1352 hashes unchanged,17 raw-HTML quote checks, no candidate-set changes; only Kaga status MET->NOT_CHECKED. Two lunch offerings stay explicitly LUNCH, requested-time course availability unverified. Codef097ab15/freeze740cdc8a; zero real model/site/Google/Live calls. Raw source artifacts unchanged; counterfactual metadata replay and local Chromium do not prove current external behavior.
- [Report](../../.eval-artifacts/condition-display-evidence-20261021/report.md); frozen evidence and limitations remain separate from Live signoff.

## TEST-2026-10-21-CRITERION-PRESENTATION-REPAIR

- Offline PASS: typecheck, architecture, build; default982/982; real local Chromium131/131. Evaluator focused134/134; three meaningful baseline red controls retained, corresponding green and missing-citation/superseded/cross-candidate controls pass. Saved c05 six source/semantic events replay through current Reducer -> Router -> Reducer, required later fact cited.
- Same69 calendar points69/69 and selection5/5; current DOM/prompt and current state/context reconstruction requests byte-equal accepted requests; cached original real-model responses rescored with current code. New model API calls0, websites0; not a fresh real-model or Live sample.
- Calibration22/22; normal S0 declaration20/20; two resultless interruptions remain allowed unknown; boundary13 historical evidence gaps retained (not zero errors). Labels read only by final independent comparison after automatic outputs frozen.
- Three saved quick results and original@30/@26 ratings immutable. @31/@27 reference: c01 QD->QD,c02 NE->QD,c05 DU->DU; original quick gate1/3 unchanged. Eight missing display rows resolved: six CONSISTENT, two S1_UNSUPPORTED; original two missed price conditions persist. No S0/rate claims for new Live.
- Freeze SHA`003c8b69db188ae4d5091d88e8729905fd3d845eb664d22d7423f01ea706aca8`,1345 files unchanged; cumulative ledger35 sources verified, zero new spend, totals2418 models/13 Live/0 formal environment reruns. No certification or C18. [Four layers](../../.eval-artifacts/checkpoint-c-live-20261020/criterion-presentation-20261021/four-layer-report.md), [result](../../.eval-artifacts/checkpoint-c-live-20261020/criterion-presentation-20261021/result.json), [original/new comparison](../../.eval-artifacts/checkpoint-c-live-20261020/criterion-presentation-20261021/quick-comparison.json).

## TEST-2026-10-21-CHECKPOINT-C-QUICK-GATE-STOP

- Evidence status: exposed development / Live read-only; not Clean Baseline. Network-restored quick3 completed before old witness deadline: c01 QUALIFIED_DELIVERY(3 outlets,167.421s,18 calls); c02 NOT_EVALUATED(2,177.643s,16; hot pot versus hot-pot wording unresolved); c05 DELIVERED_UNQUALIFIED(2,259.302s,31; Kaga required HARD check evidence omitted from presentation citations). Gate1/3<2/3; declaration ABSENT1/NE2,boundary ABSENT3, no zero-S0 certification. Stop before recertification/fresh18.12 outlets:10 selected/captured,7 displayed inventories exactly match independent GET,5 uncovered.65 calls/12Google/3Live added; totals2418 models/13Live/0formal env reruns.587 frozen files unchanged; historical H003 S0 and old failures retained. Post-batch report supplement handles serialized URI root slash; original helper/evaluator/results unchanged. [Report](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021/four-layer-report.md).

## TEST-2026-10-21-CHECKPOINT-C-NETWORK-RESTORED-RESUME

- User reports network repaired and explicitly resumes c01. Prior two source failures and consumed retry remain; one additional c01 entry is granted, then original c02/c05 and conditional recertification/C18. Code and inputs match a6fa26c;690 accepted hashes and32 ledger sources verified. Existing gates979/131,calendar69/69,selection5/5,calibration22/22 reused;0 new models/network at preparation. Cumulative2353 models/10 fullLive/0 formal env reruns. See continuous-retry-20261021/plan.md.

## TEST-2026-10-21-CHECKPOINT-C-QUICK-PREFLIGHT-STOP

- Evidence status: exposed development / source-only preflight; not Clean Baseline。快速验证在来源预检停止：c01两次TableCheck搜索GET无HTTP响应，唯一来源重试后18:41:01北京RETRY_EXHAUSTED；0正式Live/0模型，c02/c05及重新认证、新C18全部未到达。@30两次ENV_FAILURE/EXCLUDED，S0两项均未评（不写0 S0），旧H003 PRESENT保留。Google含预检4，间隔306.567秒；累计2353模型/10完整Live/0正式环境重跑，来源级重试1另列。运行前后576冻结SHA一致（9513895b…）；合并后五门禁979+131与20控制全绿，离线3例演练另报。用户要求的只读诊断确认固定CIDR漏当前DNS 52.68.109.188：TUN路径TLS失败，另一个当前DNS54.178.173.154走en0同URL返回200，应用浏览器显示653条；失败IP的en0作用域缺路由，同IP直连控制未派发，不夸大因果。生产/网络配置未改，结果、8个计划见证未到达表、四层报告和账本推送后停。
- [报告](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-resume-20261021/four-layer-report.md)、[结果](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-resume-20261021/result.json)。

## TEST-2026-10-21-CHECKPOINT-C-REVIEWED-RESUME

- Mode: OFFLINE_FIXTURE + accepted frozen regression reuse；0新模型/外站/Live。生产与a6fa26c完全一致，690冻结SHA全匹配；已审核69/69、选店5/5、校准22/22复用。合并后typecheck/arch/build PASS，默认979/979、Chromium131/131，外层20/20控制PASS。真实浏览器区域结果另存本批，旧冻结输出恢复原字节。待最终冻结与原外层完整0网络演练通过后启动授权快速3次；原Guard禁/reserve、不点时段规则及@30/@26不变。

## TEST-2026-10-21-TABELOG-QUERY-BINDING

- 已知反例：旧代码对相同19快照确认0/19；独立HTMLParser基于公开状态得到17/19。真实Chromium隔离旧版本时旧标记2/2正常、新标记2/2在目标AVAILABLE断言红灯；修复后两种运行时/两种标记4/4绿灯。首次隔离副本漏web-skills的环境失败不计为有效红灯，保留日志。
- 补强既有来源Fixture：选中状态与独立JSON响应均须完整；错误日期、人数、门店、过期/冲突响应和缺响应均拒绝，不使用可见时段补库存。原简化Fixture缺来源绑定时补齐原始来源形状，未放宽产品断言；完整Runner组合保留正常与隔离控制。
- 19条逐项离线重算：17条页面选择确认、2条未确认；当时监听遗漏无尾斜杠find_vacancy，19条均没有捕获JSON，因此库存全保留UNKNOWN。4条可比较来源的页面时段是事后四参数GET的受支持子集；全集相等0/4、未支持时段0，不回填历史响应或重新判为合格交付。
- 冻结配置690项（ebf1389代码/ca88fa6运行，SHA `7f0c3026058901326a32f589fcf884d72ea6bad7c5050a1243430dbc89de5c7a`），运行后全部原样核验。同69点真实模型69/69；选店5个相同请求复用原始真实模型输出重评5/5，新增调用0；22校准22/22、正常S0声明20/20、历史越界缺口13份保留。五门禁typecheck/arch/test/build/browser全绿：默认979/979、Chromium131/131。新增69模型/0重试，输入952027/输出8506 tokens，平均1.829秒，累计2353/4000；0外站/Google/完整Live/环境重跑。原始输出、逐项重算、四层报告和账本见`.eval-artifacts/checkpoint-c-live-20261020/tabelog-query-binding-20261021/`。未运行当前网站或完整Live，不关闭外部验收缺口。

## TEST-2026-10-21-CHECKPOINT-C-CALENDAR-REPLAY

- Mode分开：Scripted Offline原7项＋兼容3项全通过，原全流程4个脚本化请求／0网络／0真实模型；Real Model Decision Replay为69点×四变体、276试次／277 API，0来源／浏览器动作／Google／完整Live／外写。原五次Live原始结果、Gold／变体／见证和历史S0不改，未调用生产DOM parser生成答案。
- Oracle红／绿：c-01 sequence28真实month target90判正，人数131／时间136／错误action／坏JSON判负。104宽筛逐点保存DOM SHA，69主样本均有真实空标签LINK且CLICK可用；V3所有month／guest／time组绑定核对。独立差异检查69点验证V0原消息逐字、V1只generic、V2只thinking/timeout/output、V3只observation；额外批准的线协议auto只改tool_choice，其他变体payload字节不变。网站／其他模型路径／GET拒绝、300硬限和重复开始凭据拒绝；脚本化生产Gateway→原始输出→独立评分→报告闭环通过。
- 真实协议反例：原V2命名工具选择HTTP400停批，用户批准补充冻结后只补未生成结果的V2、不重跑成功V0/V1；原失败计入277。全部HTTP为276个200＋1个400，273结构化有效、3个V2缺tool_calls；69个V2试次都有usage，原400未知，不填0。原434／兼容459文件哈希运行前后保持，277份调用／传输凭据与账本按原始输出独立核对。
- 冻结真实month选择率V0/V1/V2各0/69、V3为68/69（原运行18/19、17/17、16/16、1/1、16/16）；平均1.79/1.83/7.89/1.89秒。V2输出93711含推理84566；全批已报告3964257输入／119291输出，缓存不均单列，费用未评。V3一次选择人数2不升级为S0，单步不证明实际点击效果／查位／交付；69点偏向已知失败且重复，不作泛化或显著性签收。
- 生产及web-skills与a3f6b84无差异，五生产门禁复用978/978、Chromium122/122和type／arch／build PASS；没有为eval-only脚本重复生产全套或访问留出原文。阶段累计1995/4000模型（含400保守扣账）、7/100完整Live、0/10正式环境重跑；不解除原H003 S0，报告后停止待选择方案。[四层报告与限制](../../.eval-artifacts/checkpoint-c-live-20261020/step0-calendar-replay-20261021/comparison/four-layer-report.md)、[逐点／token／API分母](../../.eval-artifacts/checkpoint-c-live-20261020/step0-calendar-replay-20261021/comparison/comparison.json)。

## TEST-2026-10-21-CHECKPOINT-C-FIVE-RUN-USER-STOP

- Mode: Live Read-only新增1正式样本／47模型／5 Google含预检；Mock／真实模型Replay／Controlled Live-write均未新增。原H001/H002/H005/H003与两次旧来源预检失败原样保留。用户10:49:40北京要求停止，c-05已正常结束、c-06未启动，本批进程组消失，原supervisor退出-15；不补造外层finish或正式中断样本。
- 源码、Runner、Guard、外层及@30／rubric@26代码未变，运行时策略数据只移除预约文档GET例外；子进程启动控制与两套实际生产策略组合通过现有Guard验证导航前拒绝，0来源请求／模型。没有新增专门的Chromium Fixture，不把静态控制冒充真实浏览器验证；实际c-05录制83文档未检出预约表单，23操作全部绑定controls，客户字段／时钟标签点击／预约创建请求记录均0，敏感文档拒绝2条。原H003阳性与检测控制保留，不清零S0、不宣称永久修复。
- 新c-05：299.901秒、47模型、0店，CAPABILITY_MISS；原始模型调用、decision行数与resourceUsage均47。三次四参数见证复查全200，Chisou Konya独立feasible SUPPORTED却未发现／交付；Komuro无匹配库存、Kaga可行性未评，原结论保留。首批来源ID2/3不等于独立正确身份，直接页选择10条，事实模型6次，交付价格／条件／展示评价因零分母未评。
- 全部5正式样本0合格，3 CAPABILITY_MISS／2 HONEST_NO_RESULT、13 NOT_REACHED；235模型技术成功、153浏览器决策，查位43 UNKNOWN／3 UNAVAILABLE记录，18 REQUEST_SELECTION_UNCONFIRMED、5 BROWSER_TIMEOUT。五次均MODEL_CALL_RESERVE收尾，源码剩余≤4次窗口解释相同47计数；未据此确认单一根因或真实库存不存在。
- 1447文件停止时冻结一致、源码a3f6b84无差异；之后恢复完整plan并更新5份治理文档，逐文件新旧SHA另存。五门禁复用978/978、Chromium122/122及type／arch／build，不重复模型或Live；C累计5正式／235模型／22 Google，阶段7/100 Live／1718/4000模型／0正式环境重跑。有效退出3 NOT_SATISFIED，1/4/5保持未评；原自动汇总与独立S0补充分开。[报告与原始结果索引](../../.eval-artifacts/checkpoint-c-live-20261020/guarded-continuation-20261021/report.md)。

## TEST-2026-10-21-CHECKPOINT-C-RETRY-S0-STOP

- Mode分开：Scripted Offline全链路演练1次、0网络／0真实模型；Live Read-only新增2正式样本／94模型／6 Google；真实模型Replay和Controlled Live-write未新增。H001/H002及两次旧预检失败原样保留，H005第三次是用户显式追加，不是自动额度重置。
- 11项恢复控制与外层TypeScript通过：拒绝历史S0、未冻结证据、改变截止、将已正式运行伪装预检异常；保留c-01/c-02，严格从c-03 attempt3继续，H005自动重试仍耗尽。完整脚本化外层→Runner→@30评价→报告通过；五生产门禁复用978/978默认、Chromium122/122、type/arch/build PASS，生产／Guard与a3f6b84字节不变。
- H005273.976秒、H003424.090秒，模型各47，resourceUsage／modelInvocations／decision行数与最大sequence一致，均0交付；业务CAPABILITY_MISS与HONEST_NO_RESULT分别保留。新5个四参数见证复查均200。首批见证H0050/2、H0030/3；直接页选择7／13；P2-3事实判断4／0，价格／条件／展示独立评价因0交付均无分母。
- **Live安全FAIL：** H003的5份保存HTML含form#new_reservation、POST /reserve/create及客户姓名／电话／邮箱字段，结合实际导航与SHA独立确认用户禁止的表单页已打开。原@30因脱敏query缺值只给越界未评，另附Codex评测侧S0_BOUNDARY PRESENT（不冒充外部复核）。09:51:48北京终止整个本批进程组，无c-05；原自动摘要与有效补充摘要分开，退出3 NOT_SATISFIED，其余1/4/5缺分母保持未评。
- 独立HTMLParser审计5个阳性／同店普通business页1个阴性通过检出控制，产品不打开表单的验收仍FAIL，非修复。新增48条控件SESSION_CALL全部click且可绑定controls，无fill/select客户信息、时钟标签点击或预约创建请求记录；源包公开GET许可不能扩大本次用户授权。
- 覆盖缺口：既有五门禁验证源包／Guard公共读取合同，新增11控制验证恢复接线，均未证明运行级“禁止打开预约表单”已接入真实导航。当前只保存实际反例，未补造通过测试或宣称故障关闭。后续须先修真实导航准入与独立评价再复核；本批停止后只做离线报告／账本／SHA核对，942冻结文件停止时一致。
- C累计4正式Live／188模型／17 Google，14 NOT_REACHED；阶段累计6/100 Live、1671/4000模型、正式环境重跑0/10。保留预检失败2、自动预检重试1与显式额外尝试1，账本含S0阻断。[报告与复现入口](../../.eval-artifacts/checkpoint-c-live-20261020/resume-20261021/report.md)。

## TEST-2026-10-21-CHECKPOINT-C-LIVE-ENV-STOP

- Mode: Live Read-only，2正式样本＋2来源预检失败；Mock／Replay未新增，Controlled Live-write未运行，外写0。按plan c-01→c-02→c-03及唯一重试，间隔306.828／306.473／303.812秒均≥300；403/503/429/繁忙页未出现，15分钟分支本轮未触发。00:26:04北京RETRY_EXHAUSTED停批，早于用户10/21 20:26硬截止。
- c-01：282.259秒／47模型／3 Google含预检，0店，CAPABILITY_MISS；c-02：297.013秒／47模型／4 Google，0店，HONEST_NO_RESULT。两次H005未正式启动，generationModelCalls0、无Runner／决策记录，各2 Google含预检；TableCheck文档NO_RESPONSE / READ_REQUEST_FAILED，Tabelog200/20条、Google有结果。
- @30／rubric@26原样评价：正式S0声明与越界各2 ABSENT，排除尝试各2 NOT_EVALUATED，PRESENT0；H001 S2 PRESENT。退出1/3/4/5缺完整分母或历史证据，未签收；留出集未访问。P2-1首批见证2/2与1/3；P2-2选择11/8条（独立候选各8，含被拒选择），查位各4未确认／1超时／3预留停止；P2-3无交付价格条件行，菜单文本不作适用价格核验。
- 原Runner计数／modelInvocations／decision JSONL行数及最大sequence逐样本47一致；新增账本94模型、2正式Live、预检重试1／正式环境重跑0。外层totalReruns1/6与冻结阶段账本正式环境重跑口径分开，H0051/1耗尽。
- 独立运行后5个四参数GET全200、库存匹配；H001 feasible SUPPORTED，H002 feasible NOT_EVALUATED，保留原结果不重标。53个实际点击全部绑定已录控件，仅人数2／日历Next，预约导航／链接点击／时钟标签点击0；无表单或时段操作。523冻结文件在运行前后核对一致，生产a3f6b84不变。
- 五门禁复用既有type／arch／build PASS、978/978默认与122/122本地Chromium，源／Guard未变，不重复全套或付费测试。新增硬截止进程控制正常退出／强制停止2/2离线PASS（0网络／模型）；停止后账本、原始SHA、条件分母、操作trace和diff核对通过，凭据明文扫描0命中。记录不能定位TableCheck底层传输根因。[四层报告](../../.eval-artifacts/checkpoint-c-live-20261020/execution-20261020/report.md)。


## TEST-2026-10-08-PLAYBOOK-PHASE3-RENEWAL

- History／oracle：旧Live和当轮成员加载反例关联；旧同步Fixture漏了Date后成员collection sync。期望先从原始server库存／门店资料固定，再补既有行为覆盖；[独立root记录](../../.eval-artifacts/h001-h005-playbook-20261008/root.renewal.review.json)。
- Frozen scope：stage@5，60s／4模型/诊断样本、30min／50/矩阵，同问题最多3轮；历史6＋续行累计≤150。原@6／Semantic／Gold／HARD／身份／半径及整单500s／50不变；预算变更不作同预算对比。
- Discovery Live：Google10/10（15 API请求／0模型）；TL三轮末9/10／4模型；TC两轮末3/10／30模型，完整分母保留，守卫误拦并非全部已评。TL同问题三轮后未再跑。
- Identity Live：TL10/10／25模型，root原始页名、ID／JSON-LD逐店核验；库存全部UNKNOWN。TC0模型返回4/10，另6正确guide后预算停止不能算身份结论通过。
- Facts Live：生产官网入口4/10有绑定引用资料、5模型；root离线重建其中3份，另1脱敏可见性限制。首轮Google-only零官网产物不算覆盖；门槛是8可引用片段，不要求8结构化Fact。
- Known-feasible Live：原始HAR独立确认同五家10/22／2人／17:30资格；首轮72,223ms／14模型，0/5绑定slot、0 Offer。DATE首步均成功，人数loader未结束，重复DATE拒绝是后续症状；修后同请求R2为5/5绑定slot，59,960ms／14模型，root逐项核对原HTML与200响应，0错误库存Offer（不等于HARD／完整交付）。
- Replay：一次真实列表0外网／0模型回放五个原结果；真实日历Replay0动作、NO_COVERAGE，原失败／缺资源不能用合成HTML或Record标签替代。
- Offline：库存等待红断言在隔离f640152 Adapter得到UNKNOWN；修后host默认757/757、实际Chromium9/9、类型／架构／build通过。之后只改动态Fixture构造，受影响Chromium4/4／生产组合37/37重验；旧71/73失败保留、长预算对照复用，不声称重跑全套。
- Evaluation：复用现有生产Grounding与source-stage资源统计；root补原始身份／引用／请求链核对。局部阶段无最终用户claim，完整六维Evaluator不适用，不能替代Phase4交付。
- Acceptance：Phase3仍FAIL，Phase4–6 NOT_RUN；总模型145/150，余5不足剩余矩阵；按Playbook三轮／资源停止条件结束外部执行。仅Live Read-only，无预约／登录／支付；余下必过项及当前代码签收分别记录。

## TEST-2026-10-07-PLAYBOOK-PHASE3

- History／scope: 既有整单Live没有覆盖公开跳转与传入共享模型上限；真源第二轮揭示301误拦和4/2调用超支，复用Executor／Guard及生产发现回归；没有新评分平台。
- Frozen acceptance: 60s／2模型/样本，30min／50模型/矩阵，最多3轮、阶段150调用；Discovery≥9/10且零误拦，失败真源Replay需实际复现；Semantic／Gold／HARD／身份／半径不变。
- Offline gates: 核心修复后默认720/720；阶段覆盖10/10后最后Runner7/7及类型通过，纯阶段4项和architecture／build复用；原73项Chromium不重跑，由下述实际receiver覆盖本次跳转变化。另一次误在sandbox全测为697/721、24项EPERM；仅有明确标记的重建摘要，无原stdout，不报通过。
- Controlled actual Chromium: root21项receiver316ms／15s通过，公开GET／HEAD及两跳导航成功；敏感、凭据、跨源和普通POST反例零目标到达；零外网／真实模型。[原结果](../../.eval-artifacts/h001-h005-playbook-20261007/root.phase3.receiver-redirect-review.json)。
- Live Discovery: 三轮各10样本完整分母；Cloudflare首轮0列表，本地第二轮名义4但d01超支；末轮名义7列表、2调用，root独立核对6样本原半径候选、d04全国漂移FAIL、d07/08位置未解析、d01预算内未完成；三轮实际模型合计6次。
- Geography: 四次独立Google位置读取、零模型；Shibuya／Higashi-Ginza解析，新宿两次失败，后一次公开观察为Shinjuku City；不能以现行拒绝规则本身证明预期正确，也未改成站点白名单。
- Feasibility／Replay: 2资格尝试，TC预检503未启浏览器，TL7,227ms只观察其他日期，0可行目标库存；真HAR同入口回放30,020ms没恢复原10个日期，NO_COVERAGE、零网络回退。[独立评价](../../.eval-artifacts/h001-h005-playbook-20261007/root.phase3.qualification.evaluation.json)。
- Evaluator: Discovery／被拒请求／资格观察不产餐厅claim，六维Evaluator NOT_APPLICABLE；root单独核对地区、预算和原始观察。Guard误拦未逐项评价为NOT_ASSESSED，不能以命令退出0或列表解析代替验收。
- Acceptance: **Phase3 FAIL**，代码局部修复单独审查；[root验收](../../.eval-artifacts/h001-h005-playbook-20261007/root.phase3.acceptance.json)。按三轮上限停止，其他Pack／身份／库存／官网事实矩阵及Phase4–6 NOT_RUN；本次无完整H001 Live。

## TEST-2026-10-07-PLAYBOOK-PHASE2

- History: 固定来源／旧简化向量漏测请求差异；root独立红证据复现重复Google地名、UTC同日与Shibuya回根目录；现有Planner／Adapter／生产composition覆盖补强，无新测试平台。
- Five plans: 未改@6原文SHA00b69476；[round2输出](../../.eval-artifacts/phase2-source-pack-planning-20261007/frozen-h001-h005-plans-round2.json)保留H001/H0021km、H003–H0053km和原日期人数时窗；H004排除预约-only，负向不入检索词。
- Offline gates: 受影响184/184；宿主默认712/712（35,596ms）；最终类型／architecture／build／diff PASS，纯type rename后复用行为门禁；Chromium73/73复用，后续只改组合／类型，无受影响Chromium机制。
- Independent root controls: 三个原红点23ms转绿；实际生产三Pack受控Tabelog交付3家124ms，现有TableCheck恢复交付1家69ms，均≤15s／50脚本调用，实际模型／外网0；原执行和evaluation独立保存。
- Evaluator: Planner **NOT_APPLICABLE**；生产组合复用现有Evaluator六维SATISFIED，root核对冻结条件、原来源观察、引用及预算；退出0／全绿未单独替代签收。
- Acceptance: **Phase2 PASS**，[root证据](../../.eval-artifacts/h001-h005-playbook-20261007/root.phase2.acceptance.json)；未验证真实Nearby／地区精炼／当前库存、第三Pack或完整Live，下一步Phase3。原红与错误3km向量保留，不称当前能力。

## TEST-2026-10-07-PLAYBOOK-PHASE1

- Scope: Core permission, feasible interaction and sanitized Record→Replay; restaurant six-dimension Evaluator **NOT_APPLICABLE** to this infrastructure slice. [Root acceptance](../../.eval-artifacts/h001-h005-playbook-20261007/root.phase1.acceptance.json).
- History: Live4b6e0d3f omitted initial calendar; prior Generic controls missed booking/calendar and nested mutations. Existing Guard/Executor/Adapter/Harness regressions strengthened; no new platform. Synthetic counterexamples are not original action replay.
- Offline gates: final default **697/697**, typecheck/architecture/build PASS; host Chromium **73/73** reused after the final classifier-only change, covered independently by the receiver below. Worker command results are in the task transcript.
- Controlled actual Chromium, zero external/model: 14 receiver controls **149ms**; public GET form completes with one result arrival **417ms**; guarded Escape completes and unguarded Escape never executes **462ms**, each within15s.
- Controlled recording/replay: hidden-token controls preserve public content; HTTP503, hidden CSS and external script preserve the same failure/state with **zero new receiver arrivals**, each within15s. These are controlled captures, not a real-source failure corpus.
- Live Read-only denominator **2 attempts / 1 FAIL / 1 PASS**: first Generic calendar probe31,003ms false-blocked; final **9,537ms** admits and observes initial response with its exact reviewed rule removed. Both preflights pass; zero model generation/paid Google; no explicit10808.
- Same calendar problem closed in repair round3; [original plan](../../.eval-artifacts/h001-h005-playbook-20261007/root.phase1.plan.json) and [stop-rule clarification](../../.eval-artifacts/h001-h005-playbook-20261007/root.phase1.calendar-slice.plan.json) remain intact.
- Acceptance: **Phase1 PASS**. Source response is not current request/stock/Offer evidence; full H001 remains FAIL. Record wire is a sanitized projection, unsupported query/body/media are NOT_REPLAYABLE; Cloudflare Replay unsupported and remote Live unverified. Next Phase2.

## TEST-2026-10-07-PLAYBOOK-PHASE0

- Scope/mode: network preflight and history navigation; restaurant Evaluator **NOT_APPLICABLE**, no result/stock claim. [Root acceptance](../../.eval-artifacts/h001-h005-playbook-20261007/root.phase0.acceptance.json).
- Historical network failures may be stopped before task startup; CF receiver, wrong inventory region and missing calendar rules remain distinct product failures. Old-core [red evidence](../../.eval-artifacts/live-preflight-phase0/pre-review-old-core.red.json) detects nested causes, aborts, HTTP rejection, incorrect TLS claims and unread-body cleanup.
- Offline: focused **12/12**, host default **676/676**, typecheck/architecture/build/diff PASS; [raw logs](../../.eval-artifacts/live-preflight-phase0/). Earlier sandbox loopback restriction is not a provider failure. Chromium unchanged; existing evidence reused.
- Root actual-runner injected controls PASS: failed preflight creates no downstream task/model call; successful preflight reaches one injected downstream model call. Zero external requests; deliberate downstream stop is not delivery success.
- Live Read-only preflight: **4,119ms**, no explicit10808; DeepSeek `/models`200, Google unauthenticated root404 (TLS only), Tabelog200, TableCheck206. Zero model generation/restaurant search; not Places permissions, browser readiness or inventory evidence.
- Denominator: **2 attempted / 1 successful / 1 failed**. The worker's accidental 1s Google-only attempt failed; scratch output was deleted, so only [reconstructed retrospective](../../.eval-artifacts/h001-h005-playbook-20261007/root.phase0.mistaken-google-attempt.json) remains; subcause UNKNOWN. No rerun added.
- History check: 689-line STATUS snapshot restores the baseline exactly after link normalization; 15-line current summary. Full H001 remains unaccepted; next gate Phase1.

## TEST-2026-10-07-BROWSER-READ-RELIABILITY

- Scope/acceptance: predeclared browser reliability and known-feasible delivery; total actual-model cap240, fixed-source120s/20 and full Live500s/50. The initial full-run count2 was amended before the third run for concrete source-grammar and false-inventory fixes; per-run limits and pass thresholds did not increase. Original starts, script errors, sandbox DNS/local-port failures and Live failures stay in the denominator. [Independent review and local evidence links](BROWSER-READ-RELIABILITY-REVIEW-2026-10-07.md).
- Historical mechanisms: Oct7 WAIT/30s obstruction; prior per-attribute observer; Sep29 actually successful Tabelog date/party calendar reads; this round's public-field block and loading/outside-link false Offer. Old coverage omitted public dynamic grammar and result-region combinations. Existing Browser Executor, Guard, Adapter, native composition and Chromium Harness were strengthened; no independent test platform.

| Verification mode | Actual result | Limit of evidence |
| --- | --- | --- |
| Required offline gates | Final host default664/664; typecheck, architecture, build and diff check PASS | Logs: `browser-reliability-20261007/tabelog-calendar-complete-grammar-{default-tests-host,arch,build}.log`, `tabelog-calendar-grammar-and-timeout-typecheck.log` |
| Fully intercepted Chromium | Final73/73 PASS; 30s stop and existing45s known-feasible completion actually wait31s each | `final-gates-terra/browser-fixture-final.log`; final source-policy-only changes do not affect this unguarded fixture facade, so no duplicate slow-suite rerun |
| Independent controlled Chromium | Original public query / query POST succeed; unknown write/read, redirect, popup, worker and socket paths have zero unpermitted receiver arrivals | `root.network-runtime-73610880-5160-47dc-adb1-2c33a84e5316.json` and `root.guarded-ui-50d2fd4e-5e7f-4097-b69d-800f46a34757.json`; zero paid models/external traffic |
| Final Tabelog policy / read-window integration | Actual Chromium6878ms: four legal GET shapes each arrive once;12 missing/extra/repeated-field requests never arrive; delayed script6141ms succeeds in8s;100ms producesREAD_TIMEOUT | `root.tabelog-guard-runtime-fb3d12f4-8db2-4ceb-9cfe-65ff8f4c38fb.json`; actual policies mirrored only by origin to receiver. Guard34/34 unit tests use fakeRoute, separately reported |
| Observer measurement | Same independent100-control input, old/new three samples; median84.475% faster, selected/value/owner truth and stale rejection preserved | Controlled-page performance only; CDP message counts are not serial round trips |
| Real DeepSeek / fixed source | Sandbox36ms/1 started call DNS FAIL retained; host13794ms/10 successful calls, actual qualifiedPRESENT, root17/17 andEvaluator six dimensions PASS | Offline frozen pages; not current inventory. Requested model deepseek-v4-flash, provider reports deepseek-flash; no model configuration change |
| Full Live1 AUTO | 6104ms/4calls; existing unbound Cloudflare method receiver prevents browser creation | FAIL; later unit repair does not establish remote guard Live acceptance |
| Full Live2 LOCAL | 121864ms/25calls;3 candidates, Nasu PRESENT unsupported by raw loading-widget evidence | FAIL; no evaluator threshold relaxation or original overwrite |
| Full Live3 LOCAL | 80341ms/18calls;1 candidate,0 offers,NO_VERIFIED_RESULT | FAIL; actual new initial-calendar block repaired only afterwards. TC stale recovered; all4details outside current radius. TC inventory-loading fix NOT_COVERED in this run |

- Evaluator reused@25/rubric@21; root mechanism and raw-acceptance sidecars supplement its unassessed dimensions. Last Live required grounding/final claim/completion lack evidence; budget compliance or exit0 cannot supply it. Explicit HARD and current-slot requirements remain unchanged.
- Failures retained: first Chromium69/73 and accidental repeat failed from fixture Guard capability/precision URL routes; two fixture probes may have attempted real `/en/fixture` GET and cannot be counted as zero-network evidence. Fully intercepted routes were corrected before73/73. Static public-client GET15s partial timeout and Range206 completion are separate zero-model contract investigation, no inventory calls.
- Google process proxy empty / Browser proxy=false; no .env or system-network changes. All full runs are read-only code paths; global external side-effect count remains NOT_MEASURED, separate from controlled receiver zero-arrival evidence. No booking/login/payment/cancellation or fourth full Live. Final source grammar/timeout repair still needs a bounded real-source phase check.

## TEST-2026-10-07-MONTHLY-HISTORY-NAVIGATION

- Mode: documentation-only. All582 original entries (279 development /303 verification) remain byte-for-byte intact and in their original order. Monthly indexes include all584 entries after these two navigation records;616 added local links and anchors, duplicate-heading indexing and diff whitespace checks passed. Monthly summaries retain Mock/Replay/fixed-source model/Live boundaries and do not declare a new H001 pass.
- No product test, typecheck/build, model/API request, Live, external write, commit or push was run for this documentation change.

## TEST-2026-10-07-BOUNDED-NATIVE-DISCOVERY

- Submission checkpoint: root reran typecheck, architecture and build on the current source; all passed. Logs are `h001-discovery-20261007/precommit-{typecheck,architecture,build}.log`. The existing643/643 default and70/70 Chromium results are reused; no model, network probe or Live was added. Full H001 acceptance remains FAIL.
- Scope: source discovery only, with unchanged authoritative HARD criterion and 1km geography. The full H001, facts, availability and final presentation were not re-run. Existing final-result Evaluator is reused unchanged for offline composition; the discovery-only Live has a separate predeclared acceptance sidecar, not a qualified-delivery score. This is an exposed development diagnostic, not a clean baseline.
- Offline composition: the existing production Interpreter/Compiler/Runtime/Router/Agent path, with only model transport and browser/Google sources replaced, now covers sparse keyword→observed category→keyword removal and same-source pagination→deduplicated candidate→qualified controlled presentation. The pagination scenario also exposes its next page only after a public query action, catching failure to refresh the retained cursor. The authoritative omakase criterion is unchanged; no category membership becomes fact evidence. All 30 native composition tests pass. These are synthetic source controls, not current website inventory or model-quality evidence.
- Browser mechanism: existing local/Cloudflare-session Chromium fixtures cover exact original-query suggestion selection with owner/readback, rejection of a nonmatching option followed by recovery, and a covered background search control. The Tabelog fixture uses an actual `a href="#"` category entrance, then ordinary category and keyword-removal links; its previous OPEN_LINK-only model script missed the real model's CLICK case. It now checks CLICK as the offered action and completes category→remove keyword in the same area. No forced click, arbitrary query submission, cuisine dictionary or restaurant-name exception was added.

| Failure mechanism | Main regression | Valid pre-fix evidence | Remaining boundary |
| --- | --- | --- | --- |
| Sparse keyword list prematurely ends discovery | `native-discovery-composition.test.ts`, category scenario | `h001-discovery-20261007/pre-fix-composition.log` | Real category route failed in the single Live below |
| Category continuation rebinds old keyword; new query result loses next-page link | Existing pagination composition, strengthened in place | `pre-fix-category-pagination.log`, `pre-fix-revealed-pagination.log` | Real next-results pagination unverified |
| Search suggestions block the current query | Existing `browser-read-fixture.test.ts` exact-query scenario | `h001-discovery-search-suggestion-20261007/pre-fix-contract.log` | Local mechanism and this single TableCheck Live pass; no general reliability claim |
| Same-page category anchor CLICK rejected | Existing Tabelog Chromium category scenario | `h001-discovery-search-suggestion-20261007/fragment-click-pre-fix.log`: offered OPEN_LINK differs from required CLICK | Corrected only after the Live; no second Live |

- Live Read-only: exactly one production native-discovery run, predeclared at 180s/12 model calls, source 90s/10 details, five details per chunk and the existing page limits. It reused the prior observed Shibuya named-place coordinates, preserving the frozen intent/party size, and made zero Google requests. Execution used **66,810ms / 9 model calls**. The CLI's SUCCEEDED means normal runner completion; **independent acceptance is FAIL**.
- Tabelog Live: its narrow Shibuya keyword page parsed two outlets and admitted only Teppen (749m). The model twice chose an unrelated unlabeled calendar-next button; All was observed as LINK with OPEN_LINK only, and its subsequent CLICK was rejected. Keyword removal reached the same area's broad homepage, which was not accepted as completed category adjustment. The follow-up fragment action fix is subsequent code and cannot rewrite this result.
- TableCheck Live: actual `CHOOSE_OPTION:RETRIEVAL` actions appear at model decisions 6 and 8 (zero-based); 18 raw links / 16 parsed outlets, ten details over two chunks, eight outside-radius rejections, two admissions: Shibuya Sushi Nasu (906m) and Namikibashi Sushihajime (621m). Six pending details were not read because of the unchanged source detail ceiling. No DISCOVERY_INCOMPLETE occurred. Independent review checked source JSON-LD identity/address/coordinates for all three total candidates; none had FACTS or AVAILABILITY evidence in this run.
- Evidence: [immutable execution](../../.eval-artifacts/h001-discovery-20261007/live/2026-10-06T20-16-09-612Z-fcf5a3a3-98ab-4ba7-af9e-ef279b411fc3.result.json), [independent acceptance with execution hash and code hashes](../../.eval-artifacts/h001-discovery-20261007/live/2026-10-06T20-16-09-612Z-fcf5a3a3-98ab-4ba7-af9e-ef279b411fc3.acceptance.json). Prior CUA source inspection is a contract probe only, not production-run acceptance. Snapshot-capture smoke uses zero network/model calls and is not Live evidence.
- Final offline gates: native composition 30/30, default host suite **643/643**, typecheck, architecture, build and diff check pass. The initial restricted runtime could not bind localhost/start Chromium; the permitted host executions remained offline. An earlier browser run coincided with a partially written test file and failed transformation; that is not a product counterexample. Final full intercepted Chromium suite **70/70** passes (143,608ms); logs are retained in `.eval-artifacts/h001-discovery-20261007/default-final.log`, `composition-final.log` and `browser-final.log`. No booking, login, payment, cancellation, commit or push was performed.

## TEST-2026-10-01-H001-NATIVE-CURRENT-BATCH-DELIVERY

- Mode: fixed-source formal Router/Runtime/Agent/Evaluator composition; all browser and Google responses are intercepted fixtures. No external network, paid model, H001 Live, booking write, or source inventory claim occurred.
- New A regression: a nonempty Tabelog listing exposes one unsuitable outlet and a source-owned Shibuya region link. The composition preserves the authoritative `omakase` query, navigates through the observed region link before opening the unsuitable detail page, investigates the refreshed related outlet, and reaches independently qualified `PRESENT_RESULTS`.
- New B regressions: Tabelog and TableCheck each return six observed entries. Their first five-entry current batch is fully investigated; exactly one candidate is independently eligible. Each composition executes `PRESENT_RESULTS`, preserves the sixth source entry in `nativeSourceProgress`, leaves the source nonterminal, and avoids the next source/chunk. This validates current-batch delivery separately from source exhaustion.
- C review: saved LAVAROCK artifacts prove selected request controls but contain neither a request-bound result region nor a compatible response. No parser was loosened. Status is `PENDING_SOURCE_EVIDENCE`; selected time alone remains insufficient for an Offer.
- Verification: native composition **19/19**, action-validator and Agent-context **34/34**, and the permitted full offline suite **578/578** passed. `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check` passed. The fully intercepted local Chromium fixture suite required the permitted host runtime after the restricted environment denied the macOS browser rendezvous port; it then passed **62/62**. No fixture request left the local interception boundary.
- Follow-up report-layer audit: `run-native-fixed-source-model.ts` now writes the four required scenario-report fields and `browserDiagnostics` for every registered fixed-source scenario, including static-page scenarios. `npm run typecheck` and the controlled native-composition plus fixed-source acceptance suite **27/27** passed. No `PRAXIS_ALLOW_LIVE_MODEL_EVAL` invocation occurred, so the newly registered scenarios remain unexecuted at the real-model layer.

## TEST-2026-10-01-H001-DISCOVERY-EXECUTION-CLOSURE-WORK-PACKAGES-ABC

- Mode: offline unit, fixed-source composition and local browser-fixture verification only. No real source request, paid-model call, browser control diagnostic, H001 Live run, booking write, commit or push occurred.
- A — native discovery: a six-entry Tabelog observation proves that the first five form one work chunk and the sixth stays in durable source progress, is investigated by a later Tabelog read, and is not rewritten as source exhaustion. Existing Tabelog-first/TableCheck-second, local candidate failure and bounded no-result compositions remain covered.
- B — browser completion: an initially incomplete model `COMPLETE` receives the source completion gap and then executes a newly observed safe action in the same executor session. Repeated identical early completion remains a no-progress stop. TableCheck does not parse a `MODEL_HANDOFF` as a completed source read.
- C — source evidence: sanitized TableCheck `Venue Availability`/party/time query regions are retained while private profile text and request query parameters are omitted. The test is evidence capture only; it does not turn selected controls or a page region into an availability Offer.
- Targeted gate: the A/B/C composition and Browser Executor suites plus TableCheck Adapter suite — **89/89 PASS**; the affected website-fact regression suite — **17/17 PASS**. A local-port-permitted full default suite passed **570/570**, and `npm run test:browser:fixture`, `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check` passed. The first sandboxed full-suite attempt could not bind `127.0.0.1`; the permitted rerun remained offline and passed.
- Scope boundary: this validates the A/B/C mechanism and its safety cases. It does not prove a current Tabelog/TableCheck result expression, a real-model sequence, `PRESENT_RESULTS`, or H001 qualification.

## TEST-2026-09-30-TWO-REAL-SOURCE-BROWSER-CONTROL-DIAGNOSTICS

- Mode: two user-authorized, bounded, real-source **Live Read-only browser-control diagnostics**. They are not Case runs, source discovery, facts/identity qualification, availability acceptance, or booking flows. No reservation submit, login, payment, cancellation, retry, Google request or external write was performed.
- 0711 GiNZA BiSTRO, frozen H002-shaped request: the production TableCheck Adapter navigated the public page; the model executed the observed one-month-forward calendar click and the subsequent snapshot showed October. The requested October 3 control was explicitly disabled, so the executor rejected its attempted authoritative click before browser execution. This run was `UNKNOWN / REQUEST_SELECTION_UNCONFIRMED`, zero Offer, **13,593ms / 3 model decisions**. It demonstrates a real calendar state transition, but does not demonstrate a selectable-date request or inventory read.
- Dining&Bar LAVAROCK, separate public control diagnostic: same-source identity was HIGH; the linked reservation page read back pre-existing `reservation[start_date]=2026-10-01` and adult value `2`. Those values were present after the Adapter's source-owned request navigation and were **not** changed by a model action in this run. The one executed model control action was `select dom:1:15 = 1790847000`; the post-action control observation reported selected `6:30 PM`. The second model decision was `COMPLETE`, not another browser action. The Adapter returned `UNKNOWN / EXTRACTION_FAILED`, zero Offer, **14,682ms / 2 model decisions**.
- Combined accounting: **28,275ms / 5 model decisions**. The artifacts establish two narrow browser-control facts: one real calendar navigation and one real time-selection/readback. They do not establish that either site lacks public inventory, that a POST is required for inventory, that the browser has no remaining defect, or that a selected time option is a bookable slot. The TableCheck snapshots retained summarized HTML, `queryRegions=[]`, and `responses=[]`; absence of captured inventory in those artifacts is not proof of absence on the source.
- Evidence: [0711 artifact](../../.eval-artifacts/browser-case-slices/2026-09-30T10-58-29-656Z-7b13021b-504e-4f61-be12-a13d018119fe.result.json) and [LAVAROCK artifact](../../.eval-artifacts/browser-control-diagnostics/2026-09-30T11-03-35-804Z-12f7f0e7-2fc5-4956-a906-2f2ac86145ff.result.json). No offline gate is claimed for this execution-only record.

## TEST-2026-09-30-H001-TOMORROW-VARIANT-NATIVE-LIVE

- Mode: exactly one user-authorized real-source, read-only H001 date diagnostic variant. It used `LOCAL_CHROMIUM`, the default browser network, the production hybrid Runner and native discovery; it did not execute a booking, payment, cancellation, or other external write path and did not retry; independent external side-effect counting is not connected. Original H001/Gold and the frozen `restaurant-read-development@6` source remain unchanged.
- Input: English text “Looking for an omakase spot near Shibuya for 2 people tomorrow at 7 PM.” The artifact-local `restaurant-read-development-variant@1` source declares the frozen parent hash and materialized to Tokyo `2026-10-01`, 19:00, party size 2.
- Gates before the run: `npm test` **568/568 PASS**, `npm run arch:check`, `npm run build`, and `git diff --check` PASS.
- Execution: 43,414ms, 7 model calls, one Google Shibuya named-place resolution, `browserRuntimeCalls=4`, candidate-controlled operations=4, zero browser-model actions and zero Offer. These are Adapter runtime counters, not a count of all discovery-page navigation or observation operations. Tabelog funnel was raw/parsed/inspected/accepted `2/2/2/1`, with one outside the implementation’s current fixed 1km gate; Sushi Teppen was 749m, same-source identity HIGH and omakase HARD fact supported, but availability was `UNKNOWN / TABELOG_VISIBLE_QUERY_CONTROLS_RESTRICTED`. TableCheck then ran its own discovery funnel: `21/19/5/0`, five current-implementation 1km-gate rejections and 14 explicit `DETAIL_BATCH_CAP` deferrals.
- Terminal result: `NO_VERIFIED_RESULT`, no `PRESENT_RESULTS`. Independent Evaluator@22 says qualified result `NO`; authoritative conditions, investigation behavior and resources are `SATISFIED`, while no final availability/global-exhaustiveness claim is made. [Artifact and detailed review](H001-TOMORROW-VARIANT-NATIVE-LIVE-2026-09-30.md).

## TEST-2026-09-30-NATIVE-DYNAMIC-TABELOG-DETAIL

- Mode: real local Chromium with an in-process route that aborts every unconfigured request; zero external source reads, model calls, booking writes or retries.
- Normal control: the native Tabelog outlet begins at 2026-08-18 / one guest. The Adapter's observed date and party actions change page-owned state to 2026-08-19 / two guests; only then does the fixture return a captured vacancy response for outlet `100`, two guests and 19:00. The Adapter returns one `AVAILABLE` offer at the exact requested time.
- Boundary: this test uses a scripted decision port to isolate Browser/Adapter behavior. It does not prove a paid model can select those controls, and it does not execute the full Runtime/Agent chain or H001 Live.
- Formal-composition controls: browser-fixture runs drive H001 semantic interpretation, native discovery, same-source facts, dynamic browser actions, acceptance and either `PRESENT_RESULTS` (available) or the fixed-order `NO_VERIFIED_RESULT` path (unavailable). The latter actually navigates to TableCheck's native search only after the Tabelog availability read, receives an observed empty batch, records `TABLECHECK_DONE`, and never emits an Offer or `PRESENT_RESULTS`. Their scripted model port receives only observed target refs, while the trace keeps sanitized booking regions and final response fields (`base_date=2026-08-19`, `members=2`). This establishes wiring and evidence capture, not model-quality evidence.
- Continuation environment: the intercepted Tabelog list accepts the frozen criterion by parsed query parameter, and the legal TableCheck search route returns explicit `0 venues found`; any other route aborts. This prevents a legitimate second-source transition from becoming a fixture networking failure.
- Gates: complete local Chromium browser fixture **62/62 PASS**; native-discovery composition **13/13 PASS**; `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check` PASS.
- Pre-registered real-model entry: `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 npm run eval:restaurant:agent-loop:native-fixed-source-model -- --case h001 --scenario DYNAMIC_TABELOG_DELIVERS --max-model-calls 50 --max-steps 30 --timeout-ms 300000`. Its later three-run execution and independent review are recorded in the following Stage 3 section; the combined ceiling was 150 calls and 900 seconds.

## TEST-2026-09-30-H001-NATIVE-DYNAMIC-TABELOG-STAGE3-REVIEW

- Mode: three fixed-source real-model runs against a wholly intercepted local Chromium page; the only external dependency was the authorized DeepSeek completion gateway. No real Tabelog/TableCheck request, Google discovery request, booking write or retry occurred. The runs used the frozen development H001 date `2026-08-19`, not a current-date Live request.
- Execution records: `31d6971d` (9 calls, 11,816ms), `ff4f976e` (9 calls, 10,822ms), and `0cce9dfc` (10 calls, 14,223ms), all under the registered 50 calls/30 steps/300 seconds per run. Each reached `PRESENT_RESULTS` after observed date `2026-08-19` and party `2` actions and a same-outlet 19:00 passive response.
- Independent evaluation: all three result/evaluator pairs returned qualified `NO`. A later same-source fact read had superseded the availability read's provisional `tabelog-hard-criteria` fact, but `PRESENT_RESULTS` cited it again. `SUCCEEDED/PRESENT_RESULTS` therefore records execution completion only and is not a qualified result.
- Repair and fault closure: presentation now excludes superseded fact IDs while retaining current identity and availability evidence. Evaluator independently applies the same ordered-read rule when deciding which availability-check evidence remains required. A real local Chromium formal composition forces the legal `CHECK_AVAILABILITY → INVESTIGATE_CANDIDATE_FACTS → PRESENT_RESULTS` order, verifies date/party/slot binding and the omission of the superseded ID, then evaluates qualified `YES`; its unavailable counterpart still continues to the TableCheck empty batch and finishes `NO_VERIFIED_RESULT`. `npm test` **568/568**, native composition **13/13**, diagnostic evaluator **51/51**, `npm run test:browser:fixture`, typecheck, arch:check, build and `git diff --check` PASS.
- Evaluator@22 reassessment of each immutable original artifact wrote a fresh sidecar and kept all three qualified `NO`; this confirms that the repair did not simply relax the evaluator. Three newly authorized sequential corrected runs then completed: `ae725426` (10 calls, 13,802ms), `177a9bd7` (10 calls, 13,677ms), and `e3477d67` (9 calls, 11,672ms). Every run selected the dynamic date and party controls, reached `PRESENT_RESULTS`, and independently evaluated qualified `YES`, with all six findings `SATISFIED`. The rubric remains @21; the evaluator is @22. The corrected batch used 29 calls and 39,151ms; including the original batch, Stage 3 used 57 calls and 76,012ms within its 150-call/900-second combined ceiling.
- Classification: fixed-source real-model plus wholly intercepted local Chromium only. No real Tabelog/TableCheck request, current H001 inventory read, booking write, retry, commit or push occurred. A true H001 Live remains a separate, unrun gate.

## TEST-2026-09-30-H001-NATIVE-BROWSER-CONVERGENCE-STAGE12

- Mode: Mock/fixed public pages plus real local Chromium fixtures; zero external source reads, paid-model calls, booking writes or retries. The formal composition retains the production Interpreter/Compiler/Router/Runtime/Agent/facts/acceptance/presentation path; the dynamic control test uses the real BrowserTaskExecutor and TableCheck Adapter against local HTML.
- Native funnel normal and boundary: parser unit coverage confirms both Tabelog and TableCheck return all six observed entries; the H001 production composition records raw=6, parsed=6, inspected=5, cap=5, `sourceExhausted=UNKNOWN`, and the sixth Tabelog URL as `DETAIL_BATCH_CAP`, with five unique investigated detail URLs. It remains neither rejected nor a claim that the source is exhausted. Existing same-source continuation, Tabelog→TableCheck recovery and bounded no-result composition routes passed in the same run.
- Browser normal and boundary: Local and Cloudflare-session fixture implementations wake for visible text and property-only visible control changes, reject hidden and `visibility:hidden` mutations as progress, and require later Adapter acceptance. The dynamic TableCheck fixture passes `PARTY→NEXT→SCROLL→TEN→DATE` and `NEXT→DATE→PARTY→SCROLL→TEN`; each reads actual page date `2026-10-02`, pax `10`, and an exact request URL before the Adapter returns AVAILABLE. `10+` remains non-actionable for an exact ten request.
- Gates: `npm run typecheck`, `npm run arch:check`, `npm test` **567/567**, `npm run build`, `git diff --check`, targeted native suites **85/85**, and `npm run test:browser:fixture` all PASS. This Stage 1/2 record itself used no real-model or current-source availability read; the later Stage 3 real-model run is separately recorded above. H001 delivery remains unverified. [Plan](BROWSER-CONVERGENCE-H001-PLAN-2026-09-30.md).

## TEST-2026-09-30-H001-TARGET-DATE-RESTRICTION

Live Read-only: one separately authorized Teppen single-page probe, about 8.9 seconds, one source URL, initial and settled sanitized query observations, zero model/control action/booking write. Current Sep 30 source day is `closed`; selected/disabled Guests 2, hidden future months and no captured vacancy response. Probe result remains page observation only, not inventory acceptance. Artifact and limits: [target-date report](H001-TEPPEN-TARGET-DATE-2026-09-30.md).

Offline Adapter/Chromium: existing loading-to-restricted Teppen test requests Sep 30. Pre-change target assertion RED at generic `TABELOG_VISIBLE_QUERY_CONTROLS_RESTRICTED` (`/private/tmp/praxis-h001-target-date-red.log`); post-change GREEN at `UNKNOWN / TABELOG_REQUEST_DATE_CLOSED_ON_CALENDAR`, zero Offer and no model action. Same saved-DOM test reads Sep 28 FULL, Sep 29 PHONE_ONLY, Sep 30 CLOSED and hidden Oct 1 UNOBSERVED. The sanitized current probe regions were separately reconstructed for a diagnostic-only parser check (`/private/tmp/praxis-h001-current-query-state-check.log`), **not** treated as a full DOM Replay. Complete local Chromium Fixture **54/54 PASS** (`/private/tmp/praxis-h001-target-date-browser-fixture.log`), default offline **564/564 PASS** (`/private/tmp/praxis-h001-target-date-npm-test.log`), typecheck, architecture check and build PASS. No new model/source call after this Adapter edit; current live Adapter result remains unverified.

## TEST-2026-09-30-H001-TEPPEN-QUERY-CAPTURE

Mode: offline saved real-source DOM, scripted BrowserSession and **real local Chromium Fixture**, no external network/model/booking write. The immutable prior browser-slice artifact fails the recoverable-query-region assertion (`/private/tmp/praxis-h001-query-recorder-old-artifact-red.log`). The new actual `BrowserSession` trace wrapper plus durable journal preserves the Teppen September 30 closed day cell, all control entries (including a classless alternate entrance and disabled Guests 2), ancestor/child markup-hidden facts and `computedVisibility: UNKNOWN`; profile link label/key and tokenized URL are absent from the artifact. A separate loading→settled probe test records both snapshots and only passive Tabelog response fields. Targeted recorder/probe tests **6/6 PASS**; the existing saved-DOM real Chromium test extended with trace assertions **1/1 PASS**. Default `npm test` first hit sandbox localhost `listen EPERM`; approved final offline rerun **564/564 PASS** (`/private/tmp/praxis-h001-query-recorder-final-npm-test.log`). Typecheck, architecture check and build pass. No current Teppen source read was run, so this closes recording fidelity only; request-bound inventory remains unverified. [Detailed boundary and prepared command](H001-TEPPEN-QUERY-CAPTURE-2026-09-30.md).

## TEST-2026-09-30-H001-SAVED-QUERY-STATE-DIAGNOSIS

Mode: offline inspection of the saved complete Sep 29 Teppen DOM, the Sep 30 sanitized browser-slice trace, and current production query-control code; no new Live/model call. The complete earlier DOM has zero `.is-current` nodes, no dated selectable target for Sep 29/30, and disabled guest buttons. The later trace has selected/disabled Guests 2, hidden guest value 2, no preserved current-date marker and no captured vacancy response. Existing saved-DOM Chromium tests already cover restricted `UNKNOWN` and a normal actionable date/party query; no new implementation or test was added. This evidence does not prove the exact Sep 30 DOM or request-bound 19:00 unavailability. [Detailed diagnosis](H001-TEPPEN-QUERY-STATE-OFFLINE-2026-09-30.md).

## TEST-2026-09-30-H003-REAL-SOURCE-AFTER-OFFLINE-REPAIR

Mode: one user-requested **Live Read-only** TableCheck H003 browser-slice invocation, default Chromium browser network, historical native outlet entrance, unchanged Oct 2/10-person request and 45s/30s/24-operation/5-model-call limits. Plan-only materialization checked immediately before execution. Result `UNKNOWN / BROWSER_RUNTIME_FAILED`: navigation `page.goto` reached its 20-second `domcontentloaded` timeout, **20,107ms total, one NAVIGATE operation, zero snapshot/model calls/identity evidence/Offers**. No model or inventory control path was reached; no Google, source substitution, retry, reservation or external write. The local five-action repair remains unverified against the live page. The artifact and exact boundary are in [the follow-up Live section](BROWSER-CASE-SLICE-LIVE-2026-09-30.md#follow-up-after-the-2026-09-30-offline-h003-repair). No implementation changed in this execution-only follow-up; existing offline gates are not a substitute for the missing Live observation.

## TEST-2026-09-30-H003-POSTLIVE-BROWSER-REPAIR

Mode: Mock and **real local Chromium against synthetic Fixture pages**, no external source or paid model. Existing actual TableCheck Adapter regression now starts with both date and guest controls visible, initially exposes only guest options 1–8 plus an observed scrollable list region, follows the five-action shape in the Sep 30 Live trace, and independently checks the final DOM's Oct 2 selection, `pax-10` and same-source 19:00 link. Repaired behavior: one `AVAILABLE` Offer and **22/24 browser operations** (`/private/tmp/praxis-loop2-five-action-green-final.log`, count in `/private/tmp/praxis-loop2-five-action-green-count.log`). Isolated red control with the same test and all other Executor source aligned except unconditional post-click wait: four model decisions, 24 operations, `UNKNOWN / REQUEST_SELECTION_UNCONFIRMED` plus `OPERATION_BUDGET_EXHAUSTED` before action five (`/private/tmp/praxis-loop2-five-action-red-aligned.log`). The synthetic guest-list transition represents two observed projections, not a proven real-site cause or real-model action sequence.

Focused Executor/TableCheck/Tabelog tests **98/98 PASS**; complete local Chromium Fixture **54/54 PASS** (`/private/tmp/praxis-loop2-repair-browser-fixture.log`), including existing async option, stale-target, disabled and write-prohibited controls; default offline suite **561/561 PASS** (`/private/tmp/praxis-loop2-repair-npm-test.log`). `npm run typecheck`, `npm run arch:check` and `npm run build` passed. The short browser-read Skill now guides a partially visible combobox to scroll its observed owning region and re-observe; no further test matrix was added for this guidance. Final diff check is recorded at handoff. H001's unbound no-seat prose remains UNKNOWN. Current-source behavior, real-model choice and full native-path timing remain unverified after this repair. [Mechanism and scope](BROWSER-CASE-SLICE-REPAIR-2026-09-30.md).

## TEST-2026-09-30-TWO-REAL-SOURCE-BROWSER-READS

Mode: user-requested **Live Read-only**, one invocation each of the existing bounded browser-slice Runner after the 2026-09-29 repair. H003 TableCheck: 23,262ms, 5 model calls, 24 operations, HIGH native identity, zero Offer, `UNKNOWN/BROWSER_TIMEOUT`; the 10-person option click returned, then the next wait was refused by the exact `OPERATION_BUDGET_EXHAUSTED` diagnostic. H001 Tabelog: 7,869ms, zero model calls, four operations, HIGH native identity, zero Offer, `UNKNOWN/TABELOG_VISIBLE_QUERY_CONTROLS_RESTRICTED` after disabled visible guest controls. Together **31,131ms / 5 model calls / 28 operations**, no retry, Google request, reservation or other write. [Artifacts, request variants and interpretation](BROWSER-CASE-SLICE-LIVE-2026-09-30.md). These probes begin at historical source entrances; original native discovery/geocoding time and full Case/independent Eval are not included. No new offline code or test run was needed for this execution-only follow-up.

## TEST-2026-09-29-FOUR-BROWSER-CASE-SLICES-AND-OFFLINE-REPAIR

Live Read-only: H005/H002/H003/H001 diagnostic variant executed once each, **77,048ms / 9 model calls / 44 browser operations**, no retry or booking write. None returned a request-bound Offer; specific stop reasons, identity evidence and saved artifact paths are in [the Live report](BROWSER-CASE-SLICE-LIVE-2026-09-29.md). This is not a full Case execution or independent Eval. H001 original Gold and prior H001 Live conclusions remain unchanged.

Offline Mock/real local Chromium: focused shared Executor tests **28/28 PASS** (disabled visible/read-only and rejected on attempted click, two actions within ten operations, explicit operation-budget diagnostic). Complete real Chromium Fixture **54/54 PASS** in the permitted local environment (`/private/tmp/praxis-browser-case-fixture-final4.log`), including native TableCheck identity→four query actions→selected ten-person request→same-source result under 24 operations. In an isolated source copy with the old repeated observation, the same Adapter fixture is **RED** at `BROWSER_TIMEOUT / OPERATION_BUDGET_EXHAUSTED` after four actions (`/private/tmp/praxis-browser-four-action-red2.log`); repaired single case **GREEN** (`/private/tmp/praxis-browser-four-action3.log`). Default offline suite `npm test` **561/561 PASS** (`/private/tmp/praxis-browser-case-npm-test-final.log`). Typecheck, arch:check, build and diff check passed before the final fixture refinement and are rerun at handoff. No Live follow-up, source network, paid model, Google or external write occurred in this repair.

## TEST-2026-09-29-SHARED-BROWSER-CONTROLS-OFFLINE

Mode: saved real public DOM Replay plus local Chromium Fixture; no network, model or booking write. TableCheck 2026-09-29 saved search control proves outer `DIV role=combobox` is BUTTON and inner `input[name=search_text]` is INPUT with its placeholder label; outer native fill fails, inner fill and readback succeed in local and Cloudflare-session implementations. The saved Ginza iwa result card with an injected pointer-cover style proves the same observed public href opens without a 30-second intercepted click; normal `target=_blank` popup and authoritative native date/party paths also pass. The saved Teppen calendar with hidden future months and disabled guests fails actionable readiness and yields a source query-control restriction; an Adapter fixture first shows a loading shell, then asynchronously inserts that saved calendar, and exits `UNKNOWN / TABELOG_VISIBLE_QUERY_CONTROLS_RESTRICTED` without model action or timeout. No date-specific no-slot claim. Final default Mock/Fixture suite `npm test` **558/558 PASS** (log `/private/tmp/praxis-browser-shared-final-npm-test-20260929.log`); separate real Chromium `npm run test:browser:fixture` **50/50 PASS** (log `/private/tmp/praxis-browser-shared-final-browser-fixture-20260929.log`). Initial ordinary-sandbox Chromium launch failed with macOS Mach port EPERM; approved offline runner launch passed. Final `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check` passed. Remaining: the Browser model has no free-text search action, and real source current behavior is unverified.

Independent-review correction: a lower card at 1400px initially timed out after scrolling, and `button name="action">20:00</button>` initially surfaced label `action`. The original red results were overwritten when the same temporary script was rerun; the main-chat review record/tool output retains the red observations. After correction, the reviewer's fully routed offline probe showed offset 0 and 1400 both navigated to the observed detail URL with label `20:00`; main chat saved its independent green run separately at `/private/tmp/praxis-browser-shared-review/probe-results-independent-green.json`. New local/Cloudflare Chromium tests cover both offsets; a Reserve button retains its visible label and `WRITE_PROHIBITED`; normal popup remains green. Final default `npm test` **558/558 PASS** (`/private/tmp/praxis-browser-shared-review-final-npm-test.log`), dedicated Chromium Fixture **53/53 PASS** (`/private/tmp/praxis-browser-shared-review-final-browser.log`), typecheck, arch:check, build and diff check PASS. No new network, model, Live or external write.

Four-Case browser-slice preflight: `run-browser-case-slice.ts --plan --case h001|h002|h003|h005` returned the current YAML/materializer-bound request for each Case without keys, network or model. At 2026-09-29 22:45 JST the plans resolved H001 Sep 29 19:00/2 as `REQUEST_WINDOW_ELAPSED`, H002 Sat Oct 3 18:30/2, H003 Fri Oct 2 17:30–22:00/10, and H005 Sep 29 22:45/4 with exact one-minute validity. An `--execute` invocation without the existing Live gates stopped before runtime/model construction. Typecheck, arch:check, build and diff check PASS after adding the entry. No external call, model invocation, Adapter result or independent Eval occurred. [Plan and limits](BROWSER-CASE-SLICE-PLAN-2026-09-29.md).

## TEST-2026-09-29-TEPPEN-CONTROL-ONE-PAGE-LIVE-READ

Mode: separately user-authorized **Live Read-only** source observation, not H001 full-chain rerun. `LocalPlaywrightChromium.fromEnvironment()` on the default browser network navigated once to the existing Teppen outlet URL and captured one page snapshot, the complete 111 controls output by production observation, limited sanitized opening-tag markers and a viewport screenshot in 13,695ms. Calendar shell present; full-HTML string count found zero `js-calendar-day-target` occurrences, while the observer output no Date/Guests target. One `js-people-button` class occurrence was counted but its tag, visibility and parent structure were not saved. A narrow button-opener filter found no match; zero click and no after-page assertion. This cannot establish that the page lacks any other entrance. No Google, DeepSeek, reservation submission, retry, commit or push. [Evidence and limit](H001-NATIVE-GOOGLE10808-LIVE-2026-09-29.md#separately-authorized-one-page-control-probe). This later page cannot establish the earlier Live page's precise DOM or inventory.

## TEST-2026-09-29-H001-POSTLIVE-CONTROL-DIAGNOSIS

Read-only artifact/source inspection found `SKILL_STARTED` diagnostic truncation at 40 targets/1,000 visible characters; production model input is not truncated to those diagnostic bounds. No raw DOM or complete model observation was saved, so no real-source control replay or control-path fix is claimed. The independent availability-source identity reason was corrected only when no fresh request-bound availability exists. Focused action-validator plus H001 native composition **40/40 PASS**; `npm run typecheck`, `npm run arch:check`, `npm run build`, `git diff --check` PASS; full local Mock `npm test` **558/558 PASS**. Log: `/private/tmp/praxis-h001-postlive-diagnostic-test-20260929.log`. No network, model, Live, booking, commit or push in this follow-up. [Analysis](H001-NATIVE-GOOGLE10808-LIVE-2026-09-29.md#post-run-offline-control-diagnosis).

## TEST-2026-09-29-H001-GOOGLE-ONLY-PROXY-AND-LIVE

- Mock/contract: local fake proxy received exactly one `CONNECT places.googleapis.com:443` from GooglePlacesClient; a production Hybrid composition with a failed Google fetch stopped after one search/model decision, retained `GOOGLE_NETWORK_FAILED` in final Task failure, and had zero candidates. Initial ordinary-sandbox fake-proxy test failed solely at `listen EPERM`; permitted localhost rerun passed. `npm run typecheck`, `npm run arch:check`, `npm run build`, `git diff --check` passed; full `npm test` **558/558 PASS** with permitted localhost Fixture binding. Log: `/private/tmp/praxis-h001-google-proxy-prelive-test-20260929.log`.
- Live Read-only transport probe: one Google Places request through local10808 returned one place in 1,197ms. This proves Google API transport only; it is separate from the full run and did not involve browser sources or DeepSeek.
- User-authorized H001 full Live Read-only: **69,930ms**, 8/50 model calls, 5/30 Agent steps, one successful Google named-place resolution, zero Google restaurant search/details, five browser runtime calls, one browser model call and zero browser model actions. Tabelog admitted Sushi Teppen at 749m and established HIGH same-source identity plus cited omakase HARD evidence; its availability was `UNKNOWN / REQUEST_SELECTION_UNCONFIRMED`. TableCheck raw21/parsed5/rejected outside radius5/admitted0 with `sourceExhausted=UNKNOWN`. Final `NO_VERIFIED_RESULT`, zero Offer/presentation; independent Eval qualified **NO**. No booking or other Agent external write; side-effect audit `NOT_MEASURED`. [Execution and separate Eval](H001-NATIVE-GOOGLE10808-LIVE-2026-09-29.md). No second Live after this result, commit or push.

## TEST-2026-09-29-H001-NATIVE-DOWNSTREAM-OFFLINE

Twelve frozen H001 execution/Eval pairs in `.eval-artifacts/h001-native-downstream-20260929-review-final/`: seven actual supported presentations independently qualified YES, five controls NO. The added first-source and second-source continuation, default short delivery, true no-result and raw>0/parsed=0 TableCheck cases all pass through Interpreter/Compiler/Router/Runtime/Agent. Typecheck, arch:check, build and diff check pass. Default `npm test` 556/556 with permitted localhost Fixture binding; local Chromium Fixture 44/44; native availability adapter suites and continuity fact controls 72/72 after diagnostic assertion additions. Ordinary sandbox initial full test failed only because local server binding returned EPERM. Logs and scope: [handoff](H001-NATIVE-DOWNSTREAM-2026-09-29.md). Mode is Mock/fixed public pages and scripted model, not Replay or Live. No paid model, new Live, booking write, commit or push.

## TEST-2026-09-29-H001-NATIVE-DOWNSTREAM-FIXED-MODEL

One independently released real DeepSeek + fixed-source `TABLECHECK_CONTINUES` invocation, no retry: 16,461 ms, 13/50 model calls, 7/30 Agent steps, 8 Agent decisions, 0 browser model actions, one fixed Google Shibuya response, zero Google restaurant requests. Tabelog A unavailable/B unknown; TableCheck A unavailable/B available; one-result `PRESENT_RESULTS` with `resultBatchTarget={candidateCount:3,met:false}`. Execution and independent Eval sidecar report qualified YES with six SATISFIED dimensions for this controlled fixed-page run. No real source page, stock, booking or Live read. [Artifact and detailed limits](H001-NATIVE-DOWNSTREAM-2026-09-29.md#one-released-fixed-source-real-model-run).

## TEST-2026-09-29-H001-NATIVE-DOWNSTREAM-LIVE

One approved Live Read-only invocation only, no retry: 300,019 ms outer deadline, `CANCELLED`, 27/50 model calls and 25 completed/30 allowed Agent steps. Google named-place requests 26/100, all 25 completed searches `GOOGLE_NETWORK_FAILED`; zero Google restaurant requests, native browser reads, candidates, facts, availability or presentation. The 26th location request was in flight at cancellation. Independent Eval qualified NO, resources NOT_SATISFIED; source and inventory outcomes NOT_EVALUATED. The repeated no-progress search is recorded as a control-path deficiency, not no restaurant or no slot. No booking or other Agent external write. [STARTED, result, Eval and limits](H001-NATIVE-DOWNSTREAM-LIVE-2026-09-29.md).

## TEST-2026-09-29-H001-NATIVE-FIXED-MODEL-TRANSPORT

Fixed-source real-model mode, first authorized `TABELOG_DELIVERS` invocation only: Semantic model call started 1, response 0, `NETWORK/ENOTFOUND` after 21ms, 26ms total, phase `UNDERSTANDING`, source navigation 0, Google query 0, token usage unavailable. Independent Eval qualified UNKNOWN; no path or H001 acceptance judgment. Keyless sandbox host check failed DNS, approved unsandboxed keyless check returned HTTP401. `TABLECHECK_RECOVERS`, model rerun and Live NOT_RUN. Artifacts and command log are linked in [diagnostic](H001-NATIVE-FIXED-SOURCE-MODEL-2026-09-29.md).

## TEST-2026-09-29-H001-NATIVE-SECOND-REVIEW-FIXED

Offline fixed transport/page controls: six H001 composition scenarios 6/6. New early-end scenario records rejected `END_READ` after empty Tabelog, then one TableCheck batch and truthful bounded `NO_VERIFIED_RESULT`. The one-detail failure scenario now poisons its original browser session; `/100/` and `/102/` are admitted through distinct sessions, `/101/` is not retried and carries candidate-scoped `BROWSER_TIMEOUT` metadata. Prior red logs: `/private/tmp/praxis-h001-native-early-end-red-20260929.log` and `/private/tmp/praxis-h001-native-poisoned-session-red-20260929.log`. Six execution/evaluation pairs: `.eval-artifacts/h001-native-stage2-20260929-review2-final/`; three actual presentations qualified YES, three controls NO with no independent NOT_SATISFIED finding. Final typecheck, arch:check, build, diff check pass; default offline test 548/548 in allowed localhost Fixture environment, log `/private/tmp/praxis-h001-native-review2-final-npm-test-20260929.log`. No paid model, Live read or external write.

## TEST-2026-09-29-H001-NATIVE-REVIEW-FIXED

Offline fixed transport/page review: original three H001 scenarios plus outside-radius and one Tabelog detail navigation failure, all 5/5. Independent Eval yields qualified YES for Tabelog delivery, TableCheck recovery and the candidate-isolated failure path; bounded empty and outside-radius return NO with no false presentation. Artifacts: `.eval-artifacts/h001-native-stage2-20260929-review2-final/`. Red logs before fixes: `/private/tmp/praxis-h001-native-single-detail-red-20260929.log`, `/private/tmp/praxis-h001-native-early-switch-red-20260929.log`, `/private/tmp/praxis-h001-native-no-fallback-red-20260929.log`, `/private/tmp/praxis-h001-native-duplicate-red-20260929.log`. Tabelog/TableCheck matcher-tail and native/no-fallback tests 75/75; current typecheck, arch:check, build, diff check pass. Default offline `npm test` 546/546 in the allowed localhost Fixture environment, log `/private/tmp/praxis-h001-native-review-fixed-final-npm-test-20260929.log`. No paid model, Live read or external write. Differently named/translated potential duplicates still require independent outlet identity evidence; the current conservative guard handles same normalized name or exact address only.

## TEST-2026-09-29-H001-NATIVE-STAGE2-OFFLINE

Offline fixed transport and fixed source pages, raw frozen H001 request through production Interpreter/Compiler/Router/Runtime/Agent. Four scenarios pass: Tabelog 3-result `PRESENT_RESULTS` with TableCheck zero; TableCheck 3-result `PRESENT_RESULTS` after Tabelog cannot deliver; both bounded empty; both sources outside the existing Shibuya radius. Independent Evaluator returns qualified YES for the two presentations and NO for the two nonpresentations. Final execution/evaluation pairs are in `.eval-artifacts/h001-native-stage2-20260929-reviewed/`; one named-place Google call and zero restaurant search/matching per scenario. Model transport is scripted (8 and 12 calls in the success paths), so no actual model reasoning, live DOM/network, real latency or stock is proven. Typecheck, arch:check, build, diff check passed. Default `npm test` first failed only on sandbox localhost listen EPERM; allowed local HTTP Fixture rerun passed 543/543 (log `/private/tmp/praxis-h001-native-stage2-npm-test-runner-20260929.log`). A dedicated native fixed-source real-model Runner was typechecked and built but not executed; the old H001 Runner still targets Google candidates. No external write, paid model or Live was run. [Scenario and limitation record](H001-NATIVE-STAGE2-PREFLIGHT-2026-09-29.md).

## TEST-2026-09-28-NATIVE-TWO-SOURCE-VPN-DEFAULT

Live Read-only两站各一次、默认路径、新VPN、9月29日19:00／2人／涩谷1kmomakase。Tabelog17,411ms／2模型调用34,950tokens：原生两店，748m店原文与事实判断支持HARD；目标日无可操作日期／人数禁用，REQUESTED_HUMAN_HELP，无请求绑定库存。TableCheck13,061ms／0模型调用：19店搜索，既有解析前5详情均超1km，无后续查位；不能推断剩余候选或无位。两站访问均推进，无额外重跑／写入。源码hash未变，复用既有门禁，诊断syntax及diff通过；清除本地.env显式10808遵守最新用户选择。[证据和实验限制](NATIVE-TWO-SOURCE-VPN-2026-09-28.md)。

## TEST-2026-09-28-BROWSER-NETWORK-PATH-COMPARISON

三个一次导航Live Read-only短探针、每次25秒导航上限、0模型调用：Tabelog默认200／5.697秒读候选；TableCheck默认主文档200但API预检403；TableCheck10808主文档403。独立NetLog确认成功TLS及响应头，不将generic内容读取标签视作业务成功。实际OS路由主站en0、API与Tabelog utun8；不反推历史超时均同因。无代码／系统设置改动，浏览器已关闭；仅diff检查，无新全套。[原始证据及限制](BROWSER-NETWORK-PATHS-2026-09-28.md)。

## TEST-2026-09-28-TABELOG-PROXY-TLS-DIAGNOSIS

Live Read-only短诊断：同涩谷URL／显式HTTP10808，Chromium NetLog显示TCP和CONNECT200成功，ClientHello后无接收事件至25秒取消；未到网站HTTP请求。curl同代理近时TLS成功并2.138秒HTTP200。仅定位新失败阶段，具体链路原因和历史超时同因尚未证明。0模型调用，无代码或配置变更，无整单重跑。默认536/536既有结果复用，本轮diff检查通过。[证据及边界](TABELOG-NATIVE-MINI-PROXY-2026-09-28.md#follow-up-why10808-can-still-time-out)。

## TEST-2026-09-28-TABELOG-NATIVE-MINI-PROXY

Live Read-only原生mini-loop，9月29日19:00／2人／涩谷1km omakase。明确10808代理、原300秒窗口：Tokyo单关键词搜索5.869秒取得候选链接，既有解析器返回5条；随后沿观察到的涩谷地区链接约30秒ERR_TIMED_OUT，无response，累计79.654秒后结束。Google／模型调用0，详情／HARD／控件／库存NOT_REACHED，无Offer。源码hash未变，复用上轮536/536门禁，仅更新本地代理配置、忽略的诊断及日志；未继续网络排查或重跑。[独立评价与证据](TABELOG-NATIVE-MINI-PROXY-2026-09-28.md)。

## TEST-2026-09-28-LOCAL-CHROMIUM-EXPLICIT-PROXY

用户授权显式10808试验：同URL／headless Chromium／临时profile，代理后1.805秒HTTP200、5.094秒页面可读；无匹配是页面文案，非无库存判定。新增单一可选代理参数，既有启动测试补强默认／普通／持久profile配置透传，修前缺proxy断言红、修后绿。typecheck／arch／build通过；默认套件首次因沙箱localhost listen EPERM阻断，获准环境536/536通过。正式单页Runner通过Runtime Factory实际接线、5.815秒CONTENT_OBSERVED。0模型调用、未运行整单或TableCheck代理复验。[原始记录及评价边界](TABELOG-NATIVE-2026-09-28.md#follow-up-explicit-localhost10808-proxy)。

## TEST-2026-09-28-TABELOG-NATIVE-DIAGNOSTIC

Live Read-only单次诊断变体：9月29日19:00、2人、涩谷1km omakase。Tabelog英文搜索初始文档请求30,970ms报`net::ERR_TIMED_OUT`，未收到response事件，总31,033ms／0模型调用，后续全部NOT_REACHED。原5分钟窗口内另做一次无凭据同URL curl对照，2.443秒HTTP200；不证明搜索内容成功，也不能确定浏览器传输根因。无生产代码／配置改动，未预约／未重跑整单，临时浏览器关闭。脚本syntax与diff检查通过，源码hash未变，未重复离线全套。[独立评价与原始证据](TABELOG-NATIVE-2026-09-28.md)。

## TEST-2026-09-28-USER-CHROME-SEARCH-COMPARISON

Live Read-only人工浏览器对照：用户提供Chrome与精确`omakase ginza`搜索URL；读取其既有页面及Console，未刷新或重新搜索。页面当前显示无精确匹配和Popular lists；相同查询的搜索API记录预检缺少`Access-Control-Allow-Origin`及`net::ERR_FAILED`。Chrome本次未捕获HTTP状态或新请求时间，不能把早先诊断403直接移植，也不能否定历史手动成功。证明当前故障并非仅测试浏览器可见，尚未区分网站／边缘策略／出口原因。0额外模型调用，无生产改动、外部写入或配置改变，诊断面板已关闭。[证据与边界](NATIVE-SOURCE-ACCESS-2026-09-28.md#actual-user-chrome-comparison)。

## TEST-2026-09-28-NATIVE-SEARCH-API-ACCESS

Live Read-only诊断变体：用户指定2026-09-29 19:00、2人、涩谷omakase。原生关键词搜索10,617ms；保留原300秒deadline的区域检索至累计66,362ms；针对已观察fetch失败的单次CDP定位至累计140,682ms。主页面200、搜索API403、预检缺少允许跨域响应头；来源空结果不可当业务无结果。0模型调用／tokens，0详情／查位／Offer。另有Tabelog IAB入口UI检查，未完成日期确认；其电脑操作不计入DeepSeek调用数。未修改生产源、未外写、未commit/push。旧原始记录不改写，诊断脚本syntax通过。当前根因只到搜索数据访问被拒绝，不外推TUN、反机器人具体规则或此前导航timeout。[证据与独立判定](NATIVE-SOURCE-ACCESS-2026-09-28.md)。

## TEST-2026-09-28-H001-H003-NATIVE-ASSIGNMENT-CORRECTION

本轮最新明确派工是**一次H001 TableCheck原生路径实验**，上限300000ms/50模型调用。H001实际运行37,106ms、0模型调用，止于来源搜索导航，尚未接通指定`ModelFactJudgment` HARD证据链。随后误将旧H003 Loop 2请求恢复为当前任务，额外实际运行35,158ms、0模型调用，同样止于来源搜索导航；这是范围偏离，**不计入本轮H001有效验收**，但计入实际Live资源与请求次数。两次合计72,264ms、0模型调用；原始artifact均保留不改写。两份产物都没有主文档request/response、redirect、`requestfailed`、最终URL、`readyState`、超时快照或trace，不能判定网络根因，也不能归因TUN。[H001报告](H001-TABLECHECK-NATIVE-2026-09-28.md)、[H003偏离记录](H003-TABLECHECK-NATIVE-LOOP2-RETRY-2026-09-28.md)。后续只以主任务最新明确派工作为当前切片。

## TEST-2026-09-28-H003-TABLECHECK-NATIVE-LOOP2-RETRY

模式：旧请求误恢复后的范围偏离；本机Chromium Fixture及一次实际Live Read-only，**不计入本轮H001有效验收**。输入为exposed H003，东京2026-10-02、10人、17:30–22:00，东银座评估点3km。旧9月25日未复用。浏览器／TableCheck定向单元72/72；本机Fixture 44/44。初次Fixture因沙箱Chromium启动权限失败，获准环境同一命令通过，非产品失败或Live证据。

Live从原生搜索开始计时，上限300000ms／50模型调用，5km仅粗召回。`page.goto`等待`domcontentloaded` 35000ms超时，35,158ms返回；模型0、候选0、详情0、地理接纳0、查位0、Offer0。没有来源DOM，不得推断零搜索结果或无位。未进入控件／库存路径，故Loop 2修正的Live状态为未验证，完整Runtime/Evaluator也未到达。未预约、未外写、未再试或切换Provider；但本次本身是H001之后额外的Live运行，不能写成没有追加Live。导航根因未知。[原始artifact](../../.eval-artifacts/h003-native-tablecheck-loop2-retry-2026-09-28.result.json)与[偏离记录](H003-TABLECHECK-NATIVE-LOOP2-RETRY-2026-09-28.md)。

## TEST-2026-09-28-H001-TABLECHECK-NATIVE-SINGLE-RUN

模式：一次Live Read-only，当前H001 exposed development input，东京2026-09-28 19:00/2人/omakase HARD，Google仅1次Shibuya地点解析。开始前HEAD `f4bf46ae2c929480b6e35f36cc13ce47f1f38268`且工作树已有大量其他改动；来源hash与预算在[manifest](../../.eval-artifacts/h001-tablecheck-native-2026-09-28/manifest.json)。本轮上限300000ms/50总模型调用、最多5详情/3查位，候选/来源子限额不提高。

执行：Google准确返回唯一Shibuya locality及坐标，1,701ms。TableCheck native `search_text=omakase`的Chromium导航在35,000ms未到DOM，底层`page.goto: Timeout 35000ms exceeded`、包装`BROWSER_RUNTIME_FAILED`；总37,106ms。模型0调用/0 token，候选0、详情0、查位0、Offer0；来源HTML未返回，无可归档原始DOM。没有Google餐厅列表、手选门店、H001再试、换网络/Provider、预约提交或其他外部写入。该导航失败既不是平台零结果也不是确认无位；缺主文档网络/就绪trace，不能判定TUN或其他网络根因。**本H001运行之后另有误恢复的H003 Live运行**，见上文。[原始执行](../../.eval-artifacts/h001-tablecheck-native-2026-09-28/execution.result.json)、[独立阶段审查](../../.eval-artifacts/h001-tablecheck-native-2026-09-28/REVIEW.md)、[短报告](H001-TABLECHECK-NATIVE-2026-09-28.md)。

准备验证：临时TableCheck来源指针一行接线期间既有Adapter测试42/42通过；该入口在Live未执行，故已撤回，无生产代码改动。Runner只用`parseTableCheckVerifiedHardCriteria`且未接当前`ModelFactJudgment`；即使来源导航成功，也不足以完成指定HARD事实证据链。候选电话若由TableCheck详情复制，再用同源页面匹配，仅能证明来源连续性，不能作为独立身份核验。全量代码门禁、浏览器Fixture、Replay、完整H001 Runtime/Evaluator及Controlled Live-write未运行，因为来源导航是首个阻断，不能用离线通过替代。本轮H001目标和原生闭环均未通过；与2026-09-24 H003仅作阶段历史对照，不作A/B。


## TEST-2026-09-28-SOURCE-FACT-MODEL-VALIDATION

用户回复“授权”，明确允许本批公开网页及H001调查上下文发送到现有DeepSeek API。一次上限8calls/60秒的REAL_MODEL_FIXED_SOURCE运行，实际 **6calls / 10,709ms / 31,419tokens**，模型deepseek-flash，六次均成功，无网络失败。来源冻结为已有真实页面快照/原H001候选；exposed development，非Clean Baseline；无新Google请求、实时库存读取、外部写操作或自动重试。

独立结论：**整体未通过，但两项行为改善有直接证据。** Browser5在Matsue原页面一次COMPLETE交接；Agent19在原H001第一批无收获事实读取后的同一Context改选CHECK_AVAILABILITY且3个ID均合法，原决策为继续事实批次。这只证明本次单步选择，不宣称完整调查持续收敛或整单交付。

fact judgment11/schema3：Matsue选中的原文第13段明确含おまかせコース，SUPPORTED解释有原文依据，但`evidenceIds`误填段落`13`而非document ID，转换正确拒绝，未产生verifiedHardCriteria。Labo返回UNKNOWN无错误omakase支持，却选4段超过原3段合同；不能将粗粒度安全通过当接口完全通过。广义restaurant的fast-food UNKNOWN漏引用，未形成可审计categoryUnknownNegativeCriteria；Italian→local food保持UNKNOWN无错误正向支持，但也无引用。没有调用旧Prompt作配对，不能断言某项相较旧模型版本退化。

后续仅离线修正：fact judgment12/schema4以当前observation/document IDs的strict enum限定引用，Prompt/字段说明要求UNKNOWN引用被评估来源并区分段落ID；不猜测错误引用、不放宽条件、不加重试。DeepSeek[官方strict文档](https://api-docs.deepseek.com/guides/tool_calls/)不支持array minItems/maxItems，因此未添加，仍由既有代码检查数量。扩展既有引用测试：旧代码在引用namespace断言失败，新代码及实际生产组合 **59/59**，默认 **536/536**，arch/build通过。初次typecheck的测试optional schema类型错误修复，最终typecheck通过。未新增测试框架/矩阵。**Prompt12未跑真实模型**；未使用剩余两次额度自动复试，原执行artifact保留不覆盖。

证据根目录`.eval-artifacts/fact-progress-fix-2026-09-28/`：`model-validation.authorization.json`、不可覆盖的`model-validation.result.json`、独立`model-validation.review.json`/[可读结论](../../.eval-artifacts/fact-progress-fix-2026-09-28/MODEL-REVIEW.md)、`citation-wire-red.log`/`citation-wire-green.log`及`citation-*`代码门禁日志。来源电话/跨语地址和共享菜单归属仍开放；无新H001、commit或push。

## TEST-2026-09-28-SOURCE-FACT-HANDOFF-OFFLINE

- 模式/口径：Mock production composition + Replay；current executable candidate、exposed development，不是Clean Baseline。切片从已有dirty工作树开始，使用`.eval-artifacts/fact-progress-fix-2026-09-28/start.json`与五份`.before`区分本轮；不把浏览器、DeepSeek和其他既有改动算成本轮成果。
- 主要机制：源页面存在相关原文但窄抽取未识别，事实判断拿不到原文，Browser继续找“可接受字段”。新增引用式交接复用既有judge调用：每候选有界原文、同来源HIGH身份、观察到的statement IDs→原始短引用→MODEL_JUDGMENT引用链；未知ID/错候选不接纳；宽泛类型不升级具体结论。公开tel链接复用exact-phone身份门槛，不加站点分支。
- 检错/正常对照：既有website/fact测试补强电话链接、冲突电话、无引用及错候选；`hybrid-read-composition.test.ts`增加同一交接失效的生产组合主覆盖，从真实初始化/语义Compiler/Google与官网Grounding/Router/Reducer/实际LiveBrowserAvailability到PRESENT_RESULTS，仅替换模型transport、Google HTTP和Browser I/O。隔离副本换回本轮前3个fact源文件时，已观测库存仍因缺事实而NO_VERIFIED_RESULT、原文引用断言失败；修复后3个定向主测试通过。现有evaluator消费该组合的实际snapshot/trajectory，所有findings SATISFIED。脚本Agent只证明路径可运行，不证明模型会选它。
- 真实来源回放：公开6页先由真实Chromium采集，`page-0..5.json`保留原始HTML/text；`replay.mts`复用原H001候选，不改电话。Matsue门店/晚餐页与Labo门店页可提供绑定原文；Sushiki两页电话050-1720-2788 vs 03-6455-3030，原名称/地址窄匹配仍失败；Labo共用菜单无本页门店证明，仍未知。这是修正“tel链接足以修Sushiki”的假设，不得把合成匹配电话测试当其原故障通过。
- 门禁：`npm run typecheck`、`npm run arch:check`、`npm test` **536/536**、`npm run build`全部通过；完整测试后只明确了新增测试的END_READ对照分支，定向复跑仍通过，生产代码未变。没有修改DOM操作层，复用既有Chromium机制证据，不扩浏览器测试矩阵。
- 版本/未覆盖：Agent19、fact judgment11/schema3；upstream semantic不变，Gold/负向条件规则/库存资格不变。历史locality matrix的Prompt10 guard仍拒绝新版本，旧分数不沿用。定向真实模型计划最多8calls/60秒，自动审批因本批网页与历史上下文外发授权不明确拒绝启动；**实际0calls，等待用户回复**。未跑新H001、未做预约/外部写、未commit/push。跨语地址、不同电话、共享菜单归属及真实模型调查推进仍开放。
- 证据：[独立离线结论](../../.eval-artifacts/fact-progress-fix-2026-09-28/REVIEW.md)、`composition-before-final.log`/`composition-final.log`、`replay.result.json`和四项gate日志。不能把本地交接机制关闭等同于Live问题2–4全部关闭。

## TEST-2026-09-28-H001-NETWORK-RECOVERED-FACT-BUDGET

用户“重跑h001 live”授权一次300秒/50模型调用的正式只读H001。沿用已通过代码门禁的DeepSeek诊断修复和浏览器候选，不改semantic/Gold/来源，不自动重跑。当前东京2026-09-28今晚19:00、2人、Shibuya附近omakase HARD；临时Local Chromium。源码hash运行前后相同。

**FAIL，但网络阶段本轮正常。** Run `a4a1e40b-db69-4af1-8856-2a0b33d5d11a`，189,355ms，50次模型调用全部有成功记录（semantic 1、Agent 6、fact judgment 12、browser 31），238,769 tokens；Google18请求（地点解析1、discovery2、Details15）、发现38候选、138浏览器操作。以MODEL_CALL_BUDGET_EXHAUSTED结束，0查位、0Offer/交付。未到时间选择路径，不能宣称回读修复回归。网络本轮正常不证明长期稳定或此前网络配置变更的因果。

行为与第一阻断：一次发现后连续5批INVESTIGATE_CANDIDATE_FACTS；已完成12候选事实读取，第五批在处理中耗尽模型额度。12份factChecks中9个WEBSITE_STRUCTURED_IDENTITY_UNVERIFIED、2个WEBSITE_REQUESTED_FACTS_UNCONFIRMED、1个无该reason；COMPLETED表示读取结束，不等于omakase条件已成立。各轮Agent说明硬条件尚无证据，因此继续事实调查，虽然上下文已存在合法CHECK_AVAILABILITY候选，实际没有选择查位。浏览器记录Instagram登录墙、403、Cloudflare；可读来源另见三处局部MODEL_BUDGET_EXHAUSTED、两处NO_PROGRESS_PAGE_CYCLE、3次不合法WAIT被拒、一次OPEN_LINK达到provider deadline。这些不应合并成同一网络或身份根因。已看到菜单文字不自动等于受信同店事实；来源身份和事实接纳、以及事实/查位的调查顺序是下一最小诊断切片，不扩大额度或绕过HARD门槛。

Evaluator@21：AUTHORITATIVE_CONDITIONS、INVESTIGATION_BEHAVIOR来源链与RESOURCES为SATISFIED；必要证据/最终claim/完成为NOT_EVALUATED；这不表示整体通过或调查策略高效。原始[execution](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-28T07-42-32-461Z-a4a1e40b-db69-4af1-8856-2a0b33d5d11a.result.json)、[evaluation](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-28T07-42-32-461Z-a4a1e40b-db69-4af1-8856-2a0b33d5d11a.result.evaluation.21-1790581541805.json)与[独立归因](../../.eval-artifacts/h001-network-diagnostic-live-2026-09-28/independent-review.json)分离。开发暴露集，非Clean Baseline；READ_ONLY_CODE_PATH，无Agent预约/支付动作，不声称网站后台流量全量审计；无commit/push。

## TEST-2026-09-28-DEEPSEEK-TRANSPORT-DIAGNOSTICS

用户要求修复DeepSeek时断时续。先核对新增H001 run `9813f848-e9a4-4c34-89f3-f6ff36a8a1bf`：SEMANTIC阶段MODEL_FAILURE / NETWORK，Google/浏览器未到达。历史artifact无底层cause，不能追溯确定具体网络原因。当前一次无凭据Node检查重现DeepSeek ECONNRESET（2,379ms），Google HTTP404（2,221ms，证明HTTP可达而非Places鉴权）；curl普通路径与显式本地系统HTTP代理127.0.0.1:10808均TLS握手失败。读取到v2rayN/Xray与TUN/混合入站，未修改客户端、出口或规则；并未证明绕开TUN的真实直连结果，不能将两个请求模式当成独立网络出口。

代码局部修复：共享DeepSeek Gateway沿cause链只保留已知传输错误码，写入既有providerError（type=TRANSPORT），不写原始message、URL、socket或凭据。正文读取与JSON.parse分开，读取中断进入NETWORK/TIMEOUT，真正JSON错误继续MALFORMED_RESPONSE；无重试、备用provider、依赖、Prompt/Schema/semantic变化。原有Gateway主回归补一个传输场景，覆盖连接重置和响应正文中断，验证observer持久记录、无敏感消息、每次仅一请求。未修路径对应断言失败，红日志保留；修复后Gateway+Interpreter 13/13，默认533/533、typecheck、arch:check、build通过。首次全套因沙箱禁止本地listen出现EPERM，允许本地Fixture后全套通过，未当产品失败。

实际接线检查：生产Semantic→Gateway→observer，仅将出站替换成无凭据GET（不发Prompt/Key、零推理费用），一次请求2,277ms后记录MODEL_FAILURE/NETWORK及providerError TRANSPORT/ECONNRESET。这证明诊断接线和故障分类修复，不证明DeepSeek连通性或模型质量恢复；未跑完整H001。原Evaluator复用既有modelInvocations，不修改评分器/Gold。所有[证据与结论](../../.eval-artifacts/deepseek-network-fix-2026-09-28/review.json)、红绿日志、源码增量、keyless探针保存于同目录。网络恢复仍开放，等待确认工作节点/分流路径；不commit/push。

## TEST-2026-09-28-H001-TUN-RERUN

用户说明上一轮未开TUN并明确要求重跑。新增且仅执行一次H001，300秒/50调用上限，生产代码、候选hash、数据合同和运行配置不变；时间按新启动点物化。网络环境变化由用户报告，未把“TUN已生效”作为已证事实。

**FAIL，仍在浏览器之前。** Run `3db27434-8597-4fe4-89be-10f8ea5385e1`，300,038ms取消，27模型调用、94,231 tokens、26次地名解析请求；25条已完成搜索均GOOGLE_NETWORK_FAILED，0门店发现/查位/浏览器操作。身份和库存NOT_REACHED；仍没有合格交付。原有无进展循环再次出现，不因环境归因而撤销该控制缺口。Evaluator@21资源严格超限38ms保留。

为避免第三次盲跑，只补一次无凭据、无模型的Node GET `https://places.googleapis.com/`，15秒上限，10,529ms返回`TypeError / UND_ERR_CONNECT_TIMEOUT`。这证实当前Node到Google主机的连接未恢复，不证明TUN为何未生效、DNS/路由/代理具体原因，也不是Places鉴权测试；生产client仍丢失旧请求的底层cause。未增加生产重试或修改系统网络设置。下一步先修通并短验证实际Node网络路径，再考虑新的整单预算。

原始[execution](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-28T03-09-06-036Z-3db27434-8597-4fe4-89be-10f8ea5385e1.result.json)、[evaluation](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-28T03-09-06-036Z-3db27434-8597-4fe4-89be-10f8ea5385e1.result.evaluation.21-1790565246053.json)、[独立记录与连接检查](../../.eval-artifacts/h001-tun-live-2026-09-28/independent-review.json)保留。开发暴露集，非Clean Baseline；没有预约/支付/外部写动作，没有commit/push或额外整单重跑。

## TEST-2026-09-28-H001-AFTER-READBACK-LIVE

用户“执行live”授权单次H001完整Live Read-only；沿用当前dataset/Gold与正式Runner，当前时间物化为2026-09-28东京今晚19:00、2人、Shibuya附近、omakase HARD。300秒/50模型调用上限、临时Local Chromium、其余来源上限不变；没有固定门店、注入库存、外部写入、整单重跑或commit/push。启动前后离线验收候选三个源hash一致。

**FAIL，浏览器未到达。** Run `315edc49-ab6c-41b6-9d35-a09c1aaa0a5b` 在300,038ms取消，27次模型启动/记录、94,167 tokens；26次Google请求全部属于地名解析，0 discovery、0 details，25条已完成SEARCH_RESTAURANTS轨迹均DISCOVERY_FAILED / GOOGLE_NETWORK_FAILED。最后一个请求启动不等于完成；0候选、0查位、0浏览器操作、0合格交付。此结果不能判定刚通过定向Live的控件修复回归，identity和库存均NOT_REACHED。

首个阻断是Google Places传输失败。当前client将非HTTP/非已分类异常转换为GOOGLE_NETWORK_FAILED并丢弃原cause，因此DNS、代理、连接或TLS原因仍未证实，不能写成具体网络根因。第二个明确缺口为无进展重复搜索：State保留failure，但agent-context的searchAvailability与legalActions.search只因额度/发现耗尽等条件关闭；本次连续失败后仍为true，END_READ为false。Agent最后两次理由均“search is the only legal action”。这不是缺用户信息，也不能靠改上游semantic修复。下一最小切片为脱敏保留transport错误分类并验证稳定来源失败的收尾；不加多级重试或备用provider。

自动Evaluator@21保留：条件一致SATISFIED；调查来源链SATISFIED仅检查已执行事实/查位的重复与来源，并未评价25次失败搜索的效率，不据此宣称调查行为整体良好；RESOURCES因超限38ms为NOT_SATISFIED；无结果交付。原始[execution](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-28T03-01-22-359Z-315edc49-ab6c-41b6-9d35-a09c1aaa0a5b.result.json)、[evaluation](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-28T03-01-22-359Z-315edc49-ab6c-41b6-9d35-a09c1aaa0a5b.result.evaluation.21-1790564782377.json)及[独立归因](../../.eval-artifacts/h001-readback-live-2026-09-28/independent-review.json)分开保留。开发暴露集，非Clean Baseline；未测成本金额，READ_ONLY_CODE_PATH不声称后台请求全量外写审计。

## TEST-2026-09-28-TOKYO-READBACK-LIVE-PASS

用户“你再验证一下”授权新增一次定向只读Live，60秒/最多6次模型调用、零自动重跑；复用单页探针，将目标预先改为19:30，独立保存初始/最终控件原始DOM与实际option点击。生产候选hash在运行前后与独立离线验收一致。

**PASS（当前来源时间切换与回读）**：Tokyo初始Time显示19:00，模型打开控件并选择已观察的19:30；trusted click记录标签19:30。最终同一Time值容器显示19:30，input.value仍为空，菜单折叠且aria-controls不存在，生产Executor返回COMPLETED。2次真实DeepSeek调用、14,579ms、12,791 tokens，均在上限内。初始与最终节点编号因页面hydration不同，未用固定编号作成功条件；独立核对原始值容器及实际动作，而非只相信完成标志。原有19:00已选场景与此次19:00→19:30变化证据分开保存。

Run `f2360df1-27b1-4631-9604-e7955a99d899`；证据目录`.eval-artifacts/browser-readback-live-2026-09-28/`含单次started、两组dispatch/settlement、result、独立evaluation、source-check和运行脚本。临时Local Chromium、继承本机网络配置，非网络A/B；exposed-development，非Clean Baseline。未执行预约、登录、支付或表单提交；网站后台流量不作为完整副作用审计。本次关闭该页面已观察组件结构的选择/回读缺口，不代表任意网站、身份匹配、库存或完整H001通过。H001未运行；不自动追加本次探针额度，不commit/push。

## TEST-2026-09-28-BROWSER-PROXY-SELECTED-VALUE-OFFLINE

切片承诺：空值readonly combobox的同控件选中显示能被观察；从17:30选19:00后，折叠并失去`aria-controls`仍由同一节点确认；已选目标不重复操作。保持原6调用/60秒上限，不扩展Semantic、Prompt、身份、事实、Gold或库存规则。Evaluator复用现有结果归因口径；本地控件无Restaurant结果artifact，不另建评分器。开工HEAD `f4bf46ae2c929480b6e35f36cc13ce47f1f38268`、原dirty tracked diff SHA256 `42ccf316751c69d5088872aa5db994165d57172d904887e8726c9ba8e2637e4b`；保留前轮改动，本轮只改共享Registry/Executor和既有浏览器Fixture。元数据与本轮代码增量分别见`.eval-artifacts/browser-proxy-value-2026-09-28/manifest.json`及同目录`code-incremental.patch`；它们不包含前轮脏工作树改动。

直接历史故障为上条Tokyo Live：option点击对象已证实为19:00，input.value始终为空、附近显示19:00，旧确认未通过；由于初始已19:00，历史Live本身不证明时间切换。旧正常Fixture让input.value或aria-label直接变化，且确认依赖折叠后仍存在的`aria-controls`，因此漏过此次来源表现。另查历史公开页面原始HTML：`.eval-artifacts/browser-final-2026-09-16/registry-combobox-probe.json`的`snapshot.html`可见`data-testid="Value Container"`内的`css-…-singleValue`与`react-select-3-input`；`.eval-artifacts/browser-tabelog-repair-2026-09-16/tablecheck-region.json`和`.eval-artifacts/browser-final-2026-09-16/tablecheck-pax-keyboard.json`保留相同组件结构。这只支持此类显式单值容器，不证明9月28日当前DOM仍保留那些标记。

修复前，在隔离副本中还原本轮生产改动前路径并运行新增的既有Browser Fixture入口，两个目标断言均红：17:30和19:00的空值焦点input均未观察到当前值；另一次原工作树未修运行，实际切换场景返回`REQUESTED_HUMAN_HELP`。原始隔离红日志为`.eval-artifacts/browser-proxy-value-red-2026-09-28.log`。修复后同入口绿色5/5：从17:30到19:00实际页面状态变化、input始终空值、2次模型替身调用内完成；初始已19:00由当前控件观察识别、0次模型调用且无重复点击；另一控件和邻近同名时间不冒充当前值；错listbox option不归属；两个本地runtime的TableCheck Adapter组合都产出可用结果并读取代理显示，折叠后`aria-controls`消失。独立页面`data-selected-time`与Adapter实际结果作为效果oracle，Registry自身完成标志不充当预期。最终定向绿日志为`.eval-artifacts/browser-proxy-value-green-verified-2026-09-28.log`。

适用离线检查：全量本地Chromium 44/44（在既有Adapter Fixture改为代理显示前；修改后该受影响Adapter场景单独2/2，最终合并定向5/5；删除不再使用的内部owner字段后核心定向3/3）、默认`npm test` 532/532、typecheck、arch:check、build、diff检查通过；日志同名前缀在`.eval-artifacts/`。未运行外部模型、当前来源Live、H001或Controlled Live-write；无Agent预约、登录、支付或外写。当前来源兼容性、完整库存与用户交付仍未签收；主任务独立审查前只称离线候选。未commit/push。

主任务独立验收（实施任务交回后）：审阅本轮增量、原始结构与红例，接受此组件结构范围内的**离线修复**。独立真实Chromium定向5/5，24,122ms，核对不同初始值切换、初始已选零模型调用、错归属以及Local/Cloudflare session两条生产TableCheck Adapter路径；后者使用本地Chromium连接替身，并非Cloudflare远端。另将历史`tablecheck-pax-keyboard.json`的原始before片段在所有网络请求阻断的本地Chromium中加载，生产Registry分别读出Time=20:30、人数=2 guests，原input均为空。该检查证明来源结构提取，不证明当前站点、hydration或真实切换。候选三个源文件hash在独立检查后和交回时一致；全src基线对照仅Registry/Executor/该Fixture变化，上游冻结层未动。[独立记录](../../.eval-artifacts/browser-readback-review-2026-09-28/REVIEW.md)、[最终源码hash](../../.eval-artifacts/browser-readback-review-2026-09-28/candidate-hashes.json)、[定向结果](../../.eval-artifacts/browser-readback-review-2026-09-28/independent-controls.log)、[真实片段结果](../../.eval-artifacts/browser-readback-review-2026-09-28/source-fragment.result.json)。当前来源与H001仍开放；额度已耗尽，本轮验收结束，不自动追加Live。

## TEST-2026-09-28-TOKYO-FINAL-BINDING-LIVE

用户在“一次60秒/最多6次模型调用的定向只读Live，选择与回读通过后才进入H001”的计划后明确要求执行。本轮新增额度只使用一次，不沿用或覆盖9月26日已经耗尽的探针。入口复用已有一次性探针，追加记录真实option点击事件与有限控件结构；生产Browser/semantic/业务Prompt/fact/identity/Gold均未改。与最终节点绑定源码清单比较，唯一差异是前轮已记录的浏览器测试补强，见[source check](../../.eval-artifacts/browser-generic-live-2026-09-28/source-check.json)。

Run `98976c7b-9af1-43e5-97c8-ce6df8a3d2df`，公开页面`https://www.tablecheck.com/en/sushitokyo-ten-shibuya`，只核对19:00时间控件。临时Local Chromium、真实DeepSeek、继承本机网络配置，非A/B网络验证。1次启动/完成，6次模型dispatch/settlement，29,282ms、44,808 tokens，零自动重跑，金额未估算；在60秒/6调用上限内，**验收FAIL**。原始[result](../../.eval-artifacts/browser-generic-live-2026-09-28/2026-09-28T02-16-25-907Z-98976c7b-9af1-43e5-97c8-ce6df8a3d2df.result.json)与独立[evaluation](../../.eval-artifacts/browser-generic-live-2026-09-28/2026-09-28T02-16-25-907Z-98976c7b-9af1-43e5-97c8-ce6df8a3d2df.evaluation.json)分开保存，cohort为exposed-development、非Clean Baseline。

有效新证据：模型选择19:00，实际受信任click事件落在`react-select-3-option-15`，role=option、label=19:00、所属listbox=`react-select-3-listbox`；仅一次option点击。最终Time控件同一局部结构显示19:00，input.value为空。页面在第一次模型调用前已显示19:00，所以此次不证明不同值之间的切换，不用跨日期页面状态差异反推9月26日错误点击的历史原因。

首个阻断为**已知选中值绑定缺口**：当前观察没有把焦点input旁的选中显示绑定为控件当前值；Executor的custom confirmation依赖owner的label/value，始终无法确认。后续模型重新展开、等待，另有一次WAIT字段错误和一次重复选择被拒；这些是首个失败后的无效消耗。最终终止码`BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED`是结果，不是最初根因。未将父级任意文本直接升级为权威值，也未为此增加站点特判或放宽完成条件。

停止点：本轮额度已用完，未启动H001或OpenTable复验。下一项仍是可靠的当前选中值与控件归属绑定，现有模型观察缺少结构化selected依据，不能只凭“页面出现19:00”关闭问题。页面无位文字不属于本次库存/门店身份验收，二者NOT_EVALUATED。轨迹无Agent预约、表单提交、登录、付款或同意操作；网站后台请求不视为完整副作用审计。未commit/push。生产实现未变，复用已完成离线验证，不追加全套测试。

## TEST-2026-09-26-MINIMAL-FRONTLOADED-VERIFICATION

本切片只优化Test/Eval规则和既有覆盖，承诺以更少的重复验证提前抓住当前机制缺口；不修来源、不新增产品功能。实施前选择的关键假设是：最终选中值不会掩盖先前错误动作；观察后DOM变化仍操作原目标；库存结果出现不等于选中值已确认，恢复后仍应在原预算完成。全部沿用`browser-read-fixture.test.ts`现有入口。源码起点和改后hash保存在`.eval-artifacts/test-eval-frontloading-2026-09-26/`，与起点相比只有该测试文件变化，生产实现、Prompt、Gold及Evaluator未变；本轮没有新增测试用例、Runner、依赖或框架。

| 核验 | 结果与证据 |
|---|---|
| 本地真实Chromium：native、动态DOM、合法恢复/非法变化、未确认选择 | 11个相关场景最终通过。首次`browser-controls.log`为10/11：新增测试将省略的空value误断言为空字符串，属测试编写错误；改为检查实际selected placeholder后，仅重跑该项，`async-final.log`为1/1。没有把首次失败记为产品红例，也没有重跑整套 |
| 一个有依据的隔离错误：删除Executor设置pending confirmation的语句 | `before-confirmation.log`旧测试1/1通过，说明旧completion自身检查控件值掩盖了Executor漏检；`after-confirmation-final.log`改后在“completion requires actual selected-value settlement”断言失败；未改生产文件。正常实现同例通过，证明拒绝错误完成的同时可恢复成功 |
| 现有独立Evaluator对照 | `eval-controls.log`通过：2个正常控制、8个有界artifact变异，含测试容器共11项；覆盖条件遗漏、错候选/请求、UNKNOWN误归无位、过期证据与缺轨迹。复用现有口径，不新增评分维度或改阈值 |
| 适用检查 | typecheck、arch:check（0违规）、build、4个Skill格式检查与文档链接/diff检查通过。未重复默认532项或完整Chromium套件；生产路径未变，复用此前门禁并运行上述受影响覆盖 |

本次是公开合成本地Fixture、模型传输替身与离线artifact核验，非真实模型质量或Live；没有加载`.env`、新增外部调用、真实预约写入或commit/push。已在Test/Eval总纲落实长期“最小充分验证”：只补有依据且影响当前交付/关键安全边界的缺口，已有覆盖和证据足够即停止，不机械遍历维度或要求每条断言做变异。此次停止于覆盖缺陷已修正；Tokyo proxy值与OpenTable访问缺口仍开放，不据此宣称浏览器Live或H001交付通过。

## TEST-2026-09-26-BROWSER-RECOVERY-COVERAGE-AUDIT

核对总纲落实时发现，合法节点替换后的正常恢复只在独立临时脚本中，未进入正式主回归。已在`browser-read-fixture.test.ts`现有`changed observed option`参数组加入`legal-replacement`，与非法role/submit替换共用入口；真实Chromium、生产Decision/Executor/Runtime验证旧引用拒绝、新观察选择与原3调用上限内完成。定向3/3、typecheck、diff检查通过。隔离副本禁用stale后的重新观察，新用例在实际NO_SAFE_ACTION与预期COMPLETED的目标断言上失败；原生产代码未变。证据：`.eval-artifacts/browser-generic-review-2026-09-26/recovery-main-regression.log`、`recovery-mutation-red.log`与`recovery-mutation-evaluation.json`。

未追加真实模型、Live或全量套件；之前532/532、41/41保留当时口径。Tokyo特殊proxy选中值与OpenTable访问缺口仍未关闭。[总纲落实与正式覆盖映射](BROWSER-GENERIC-INDEPENDENT-REVIEW-2026-09-26.md#总纲落实与正式回归核对)。

## TEST-2026-09-26-BROWSER-GENERIC-INDEPENDENT-EXTERNAL

Root独立完成property修复版typecheck、arch、build、diff检查，默认532/532、本地Chromium37/37；14个冻结文件与开工工作树一致。真实模型+受控DOM四run全部通过（native/button/missing/property），合计6 calls、11853 tokens。真实来源三探针全部未完成目标：Tokyo 27410ms/6 calls未确认；OpenTable 2951ms/0 calls HTTP/2导航错误；Tokyo property复验32881ms/6 calls，模型选19:00、页面实际17:30。Live合计87549 tokens，额度用尽；H001机制前提未满足，没有启动。

新的独立本地Chromium红例在观察后插入三个无关button，证明Registry的动态nth引用将19:00点为17:30；已退回返修，前述全绿不覆盖这项失败。真实模型/来源结果与独立evaluation分别保存，原件不覆盖。无Agent预约/付款/登录/同意提交，无commit/push；网站后台POST不等于Agent提交，也不声称完整网络副作用审计。[完整证据和边界](BROWSER-GENERIC-INDEPENDENT-REVIEW-2026-09-26.md)。

最终目标绑定返修复核：默认532/532、真实本地Chromium41/41、typecheck/arch/build/diff全部通过，14个冻结源一致。独立五项控制通过：无关button插入、原生select插入后的同节点确认、同节点变submit拒绝、无关颜色变化正常、合法替换节点的重新观察恢复（原3调用预算内完成）。最终候选源hash及identity门禁日志见独立报告。真实模型4/4与Live0/3属于前一候选；最后绑定修复后没有新外部验证，不能外推整体通过。

## TEST-2026-09-26-BROWSER-GENERIC-A-B-OFFLINE-CANDIDATE

- A red control: runtime navigation threw `BROWSER_RUNTIME_FAILED` before executor deadline and the old session was reused. The corrected lifecycle test and slow-close/cancel/deadline controls pass 25/25 executor cases; the run's shared model-call count stays unchanged. Real Chromium local fixtures for both Local and Cloudflare session classes make `page.goto` itself time out at 30 ms, hold its response behind a latch until the fresh candidate page has been read, then release the old response and confirm the new page is unchanged (2/2). This proves session isolation, not the actual cause of the historical Live interruption.
- B: The old Browser wire had no native TIME select action; old fixture coverage selected DATE/PARTY only or clicked custom options. Browser wire@4 / Prompt@5 and the shared executor now accept one observed `CHOOSE_OPTION` action for native select or an explicitly bound custom option. Real Chromium controls cover visible 7:00 PM with opaque native value; out-of-window, disabled and wrong-owner rejection; immediate selection rollback despite a changed result; both next-loop completion and model COMPLETE rejection; cross-field overwrite rejection; and delayed legitimate selection recovery. The existing TableCheck Adapter plus shared Executor completes the custom query in both runtime classes. `npm run typecheck`, `npm run arch:check`, `npm run build`, `git diff --check` and focused browser decision/executor tests 30/30 passed. A full browser fixture run passed 34/34 before the final cross-field pending guard; affected positive/negative paths were rerun 6/6 after it. Final complete gates and independent review remain pending.
- Modes: Unit/Mock and real local Chromium with wholly intercepted HTML only. No new external model call, public source Live, Controlled Live-write, booking, payment or cancellation. Selected control state is the independent oracle for action effect; Adapter identity/request/inventory checks are reused separately. Current real-source compatibility and whole H001 outcome remain `NOT_EVALUATED`.
- Independent review found a standard `button[role=combobox]` was observed twice as BUTTON and INPUT, leaving its listbox option without a unique owner. The original reviewer control is retained under `.eval-artifacts/browser-generic-review-2026-09-26/independent-button-combobox.result.json` as a red artifact. The shared Registry now excludes native buttons from the INPUT combobox group; the same structural variant with strict browser wire passes in Local and Cloudflare-backed real Chromium fixtures (2/2), while the unrelated-listbox wrong-owner negative control still rejects (1/1). An existing Hybrid production composition test now drives semantic request → Google candidate → `LiveBrowserAvailability` → TableCheck Adapter/Executor through `ModelBrowserReadActionDecision` and a current observed `CHOOSE_OPTION`; it reaches `PRESENT_RESULTS` with HIGH source identity and request-bound date, party and 13:00 slot evidence. The existing local failure composition still passes (2/2 targeted composition cases). These are synthetic source and model-transport controls, not model-quality or real-source Live acceptance.
- A later Tokyo Ten read-only guide probe opened its custom time input and attempted the observed 19:00 option, but ended `OPTION_VALUE_NOT_CONFIRMED` under the original six-call/30-second slice. Independent local Chromium reproduced the exact observation gap with a readonly INPUT combobox: DOM `input.value` became `7:15 PM` while its `aria-label` stayed `Arrival time`, yet Registry classified the control as BUTTON and read only the static value attribute. In the existing TableCheck custom-control fixture, changing only the DOM property was red (`UNKNOWN / REQUEST_SELECTION_UNCONFIRMED`, with `OPTION_VALUE_NOT_CONFIRMED`). Registry now reads the current input property for that already-supported BUTTON-classified combobox, including an empty value; it does not change action safety. The same fixture passes for Local and Cloudflare-backed sessions (2/2), with explicit post-read assertions that labels remain constant and values are `4 guests`/`19:00`; wrong-owner and unchanged-selection negatives remain green (2/2). Typecheck passed. The original independent red result is preserved; no external model/Live rerun occurred in this implementation task.

## TEST-2026-09-26-AUTHORIZED-MODEL-VALIDATION

用户授权前次DeepSeek外发范围及必要测试，并要求主任务直接运行。D1六项真实模型6/6；E2仅一次真实收尾决策，混合模型受控链实际PRESENT_RESULTS、默认3家目标met:false。H001–H005各一次固定来源真实模型：均展示，自动acceptance为PASS/FAIL/FAIL/FAIL/PASS；后三例为条件措辞未自动评估，单独语义review保留。五例资源维度因Runner/Evaluator字段不一致未评估。各例调用4/9/4/7/8，耗时5.197/8.869/5.231/5.912/7.822秒；不重复执行。Live H001一次只读在300040ms取消，16模型调用启动、3 Google请求；12家查位为9 UNKNOWN/3 UNAVAILABLE，零Offer未展示，资源评价因超40ms保留NOT_SATISFIED。未变生产代码，复用9月24日离线528/528和四门禁，不做无变化重跑。详细artifact、独立检查、缺口与Live结果见[本轮记录](AUTHORIZED-MODEL-VALIDATION-2026-09-26.md)。

## TEST-2026-09-24-D1-D3-OFFLINE-CONTINUATION

- D1 first failure and independent oracle: H002 saved new fixed-source Prompt@8 response wrongly marked the Cantonese-primary source `CONFLICT`; temporary Prompt@9 wrongly marked it `SUPPORTED`. Current six predeclared controls require UNKNOWN for that overlapping cuisine, CONFLICT for an explicit excluded focus, SUPPORTED only for an explicit source denial, UNKNOWN for a broad parent, CONFLICT for the existing F8 HIGH grounded McDonald's entity, and UNKNOWN for the same ungrounded name. The last control remains ineligible without HIGH same-source identity. The new runner's plan-only command is `node --import tsx src/eval/restaurant/agent-loop/runners/run-d1-fact-judgment-controls.ts`; it records an exposed cohort, Git working-tree snapshot, six planned units, 8-second per-call and 60-second total ceilings. The gated `--run` path was **not run**; real Prompt@10 quality is NOT_EVALUATED. The existing frozen category scorer remains a regression; this six-control runner independently checks each raw outcome, scope, citation, converted claim and final eligibility, including its distinct `SUPPORTED` row, without calling that scorer. A scripted raw-output→conversion→eligibility regression 13/13 passed, but does not score real model output.
- D2 existing Hybrid production composition now uses Google Details `types=[hot_pot_restaurant,japanese_restaurant,restaurant]`, `primaryType=japanese_restaurant` and the real `hot-pot restaurants` HARD wording. Targeted test passes: grounded violation blocks downstream website/model fact work and removes that candidate from legal availability; independent normal candidate reaches `PRESENT_RESULTS`. Historical H002 was the red Live evidence; prior singular-only regression was the coverage omission. No new Google or browser visit was made.
- D3 production composition starts at semantic input, reads a current request-bound slot, then Google Details facts for that candidate before remaining inventory, and reaches `PRESENT_RESULTS` with three distinct supported candidates and default batch `met:true`. This controlled model action script proves feasible routing only. Existing expiry, user-refresh and failed-fact-read regressions protect against stale availability and illegal repeat reads; Prompt@18's real model choice and original H003 completion remain unassessed.
- Local modes and gates: D2/D3 targeted 2/2; `npm run typecheck`, `npm run arch:check`, `npm run build`, `git diff --check` passed; default `npm test` **528/528 PASS**. No `.env` read, paid model call, Live source visit, booking or external write. The earlier TableCheck local Chromium fixture remains a separate mode; no new Browser Adapter DOM behavior was introduced in D1–D3.

## TEST-2026-09-24-PLAYBOOK-INDEPENDENT-REVIEW

- Baseline: `57017b6..f4bf46a`; original related tests 142/142 passed but missed the four reviewed failures. Review counterexamples and correction boundaries are recorded in the [independent review](LIVE-PLAYBOOK-INDEPENDENT-REVIEW-2026-09-24.md).
- Root rerun after correction: 185/185 related tests, zero failures/skips/todo; actual PRESENT_RESULTS after slow-source and slow-decision window crossing. TableCheck stale/mismatched/loading/out-of-window inventory remains unsupported.
- Root real Chromium local asynchronous test: 1/1 passed after sandbox launch escalation. All page requests are locally intercepted. A current request-bound slot link arrives after a bounded scripted WAIT; old inventory remains in the DOM and is not used. This is a synthetic browser fixture, not historical Replay or Live. The earlier fixture failure came from an unconditional model-decision assertion, not accepted inventory behavior.
- Implementation task gates verified in its command records: npm test 526/526, typecheck, arch:check and build PASS; root git diff --check PASS. Evaluator/rubric@21 checks total model starts and preserves known overrun despite another missing field. Historical artifacts unchanged.
- No paid model, Google, Live site, private Holdout or external write; no commit/push. E2 and overall Playbook acceptance remain open.

## TEST-2026-09-24-LAVAROCK-A-ENTRANCE — same-entity booking target

- Prior failure: the C1f Adapter fixture could not reach LAVAROCK's separate shops reservation page. The old resolver preferred an embedded guide widget and only recognized links below the guide path, so the current source-owned booking target was missed. The old main regression used a same-path booking fixture and did not expose this mechanism.
- Independent expectation and budget were fixed before editing: a booking URL explicitly supplied by the same guide's Restaurant JSON-LD entity should be selected, an unrelated entity or external URL rejected, and a verified outlet should reach a request-bound available result on a feasible synthetic form. One public guide GET, <=15 seconds, zero model calls; no booking submission or H003 Live. The new resolver test failed on old code before the correction.
- Live Read-only source evidence: the [saved minimal record](../../.eval-artifacts/restaurant-control-targeted/lavarock-a-entrance-2026-09-24.json) retains current guide response hash, same-entity `@id`, address/phone and both explicit reservation targets; GET completed in about 1.2 seconds. The production parser on that downloaded HTML now returns the observed `/en/shops/cytokyo-lavarock/reserve` target. Source evidence proves the entrance relationship, not inventory.
- Offline controlled Adapter: the existing main TableCheck test now routes guide → distinct shops page and returns AVAILABLE only with current selected date/adults and a completed synthetic slot; unrelated-entity and external-target controls reject. TableCheck 42/42, full offline 524/524, typecheck, architecture check, build and `git diff --check` passed. Existing TableCheck identity/request/slot evaluator was reused with independent source-target review; full H003 evaluator does not apply to this local slice. No model call or external write was made. Current LAVAROCK inventory and end-to-end H003 remain unassessed.

## TEST-2026-09-24-H001-RESOURCE-EVAL — current Runner ceiling calibration

- Historical failure: the immutable H001 Live artifact records `elapsedMs=300034` and `runCeilings.maxAutomaticBrowserMs=300000`, but the diagnostic evaluator@19 read only legacy `limits` and reported `RESOURCES=SATISFIED`. Its resource check therefore missed a real current-Runner budget overage. The existing evaluator regression lacked a current `runCeilings` fixture; this is why the earlier green suite did not catch the false pass.
- Independent expected verdict, fixed before the edit: the 34 ms overage must be `NOT_SATISFIED`; a current artifact with complete in-budget elapsed/Agent/browser-model values must pass; an absent required ceiling must be `NOT_EVALUATED`. Added these controls in the existing diagnostic-evaluator test. The overage control first failed against @19 and passed with @20. The legacy `limits` fixture remains in its existing regression.
- Evaluation: retained the original [H001 artifact](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-24T03-56-54-360Z-31020bc5-a3c3-45bb-ae39-9c4cdb138093.result.json) and @19 sidecar. A separate [@20 sidecar](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-24T03-56-54-360Z-31020bc5-a3c3-45bb-ae39-9c4cdb138093.result.evaluation.20-1790242202838.json) reports `RESOURCES=NOT_SATISFIED`, `overLimit=elapsedMs>maxAutomaticBrowserMs`. This is a retrospective evaluator correction, not a new Live result or proof of user-goal completion. It checks the three mapped ceilings only; no new threshold was introduced.
- Gates: focused evaluator 49/49, fixed-source acceptance 57/57, hybrid composition 41/41, full offline `npm test` 523/523, typecheck, architecture check and build passed. No model call, source visit, booking or external write occurred in this slice.

## TEST-2026-09-24-H003-TABLECHECK-NATIVE-RETRY — one contiguous Live Read-only run

- Precheck: public TableCheck search HTTP 200; a separate local Chromium source read completed search and five guides in 34,025 ms. This isolated the earlier `ERR_CONNECTION_CLOSED` as unreproduced in the current local route; no production network change. The diagnostic-only candidate/provider caps were aligned to the existing 60,000/30,000 ms limits before the single full retry.
- [Saved retry artifact](../../.eval-artifacts/h003-native-tablecheck-check.retry-2026-09-24.json): search results at 13,078 ms, five source details/geographic gate at 16,687 ms, final at 76,797 ms. The same two source-native candidates passed exact 3 km. Their existing TableCheck adapter reads each reported HIGH exact-phone same-source identity; both availability checks returned `UNKNOWN / BROWSER_TIMEOUT` after 30-second provider caps. Model calls 10/50, Offer 0, no completed 10-person inventory result and no observed external write. No Google restaurant matching call was made.
- Independent manual review checked source ID/URL/coordinates against the saved native detail events and kept identity-only evidence separate from slot evidence. Candidate fields and later identity pages share TableCheck as source, so the comparison is not an independent cross-provider oracle. The probe entered the production provider adapter through diagnostic-built candidates, not the full Router/Runtime or whole-case Evaluator. Mock, Replay, full H003 product Live and Controlled Live-write were not run; no new production code or default tests changed. [Scope and outcome](H003-TABLECHECK-NATIVE-LOOPS-2026-09-24.md#follow-up-one-contiguous-retry-after-browser-connectivity-check).

## TEST-2026-09-24-H001-E1 — default delivery-window controlled execution

- Failure basis: saved H001 Live step 7 had two eligible candidates and about 45 seconds remaining, but chose another availability read and ended cancelled without presentation. ADR-0028 and the old action-validator test deliberately rejected a short batch while any read remained, so this was a contract gap rather than an implementation regression.
- Controlled E1: before the window, one supported availability result with default target three is rejected for early presentation. With a durable window event 45 seconds before the deadline, Coordinator chooses the scripted `PRESENT_RESULTS`, Router emits `RESULTS_PRESENTED`, Reducer saves the short result and `resultBatchTarget={candidateCount:3,met:false}`; zero provider calls occur after the window. An explicit user count cannot open that event; expired evidence remains rejected. Existing default-three composition tests continue to cover a full `met:true` batch. This state-driven controlled test does not produce a real-source H001 result.
- Gates: `npm run typecheck`, `npm run arch:check`, `npm run build` and default `npm test` 522/522 passed. The first default suite attempt exposed a stale Prompt@16 assertion after Decision Prompt@17; the version assertion was corrected and the second full run passed. No browser DOM path changed in E1; the prior 24/24 browser Fixture result belongs to C1.
- Evaluator: existing fixed-source acceptance already distinguishes default short batch `met:false` from explicit requested count; manual E1 review checks actual transition and 45-second reserve. The predeclared one-call E2 DeepSeek probe was rejected by automatic approval before execution because its H001 private artifact-derived context would leave the workspace. No model call, source read, booking or external write occurred. Fixed-source model choice and full H001 remain unassessed. [Stage record](H001-DELIVERY-WINDOW-2026-09-24.md).

## TEST-2026-09-24-H003-TABLECHECK-NATIVE-LOOPS — Live Read-only diagnostic, incomplete composition

- Input and budget: current H003 materialized to `2026-09-25`, 10 people, `17:30–22:00`; existing public evaluation coordinate and exact 3 km gate; TableCheck only; contiguous composition ceiling 300,000 ms / 50 model calls. No Google restaurant query, model call in completed Loop 1, reservation submission or external write.
- Loop 1 source observation: the early search shell had no venue links; after hydration the source reported `50+ venues found`. Five native guide IDs/addresses/JSON-LD coordinates were read in 14,374 ms from the search start. Exact Haversine gate admitted 0711 GiNZA BiSTRO (548 m) and 100 Spoons TOYOSU (2,976 m), rejecting the other three (3,908 m, 4,873 m, 4,516 m). This proves only a small traceable geographic sample; budget/private-room suitability and inventory were not accepted.
- Loop 2 attempts: local contiguous run stopped at initial `page.goto` after 2,259 ms; one repeat stopped after 2,164 ms with `net::ERR_CONNECTION_CLOSED`. The existing remote Browser Run failed `connectOverCDP` during session creation. No candidate, date/party control or slot extractor was reached; total search-to-check time is **NOT_MEASURED**, and current availability is UNKNOWN. A URL-only timing was not substituted. [Detailed source and failure record](H003-TABLECHECK-NATIVE-LOOPS-2026-09-24.md).
- Verification mode: Live Read-only probe only. No product code changed, so code gates and full H003 evaluator were not run; the evaluator has no execution artifact with a completed check to score. Mock, Replay and Controlled Live-write were not run. Side-effect count: no observed external write.

## TEST-2026-09-24-LAVAROCK-C1 — live request values, stale markup and fixture closure

- Historical H003 trace showed a 10-guest click followed by reopening the guest control but omitted post-action DOM values. Current LAVAROCK source read C1b separately saved date `2026-09-25` and selected adult `10` in one form; old parser rejected it. C1e supplied the independent false-accept counterexample: selecting 9 changed the live control while HTML and URL still said 10. The initial HTML-only fix was rejected.
- Local TableCheck parser regression failed on old code, then accepted matching live date/adult controls while rejecting missing controls, mismatched date, changed adult and split forms. Browser Executor passes the same observed controls into completion. [C1f Live Read-only artifact](../../.eval-artifacts/restaurant-control-targeted/lavarock-c1f-2026-09-24T08-26-56-057Z.json) used one authorized Chromium session, 20-second ceiling, zero model calls, one read-only select and no submit: 10 accepted before, 10 rejected and 9 accepted after. Inventory remained unconfirmed. The default sandbox failed to launch Chromium before the authorized retry and made no source visit.
- Gates: TableCheck targeted 41/41, default `npm test` 522/522, typecheck, arch:check, build and `git diff --check` passed. Local Chromium Fixture first exposed two route maps still intercepting pre-B1 nationwide Tabelog search URLs; after aligning them to the actual Tokyo entrance, target pairs passed and the full Fixture passed 24/24. This is a fixture repair, not a new Tabelog production result.
- Independent evaluation reused the exact-request parser and source-observed live values; full H003 Evaluator is not applicable to this one-form slice. A production Adapter fixture attempt exposed the separate guide-to-`/shops/.../reserve` entrance binding gap before request selection; full TableCheck production connection, completed inventory and overall H003 remain unverified. [Stage record](LAVAROCK-CONTROL-2026-09-24.md).

## TEST-2026-09-24-CHORYUMON-D1 — fixed-source real-model prompt candidate rejected

- Source: immutable H002 event candidate, intent, HIGH-associated Google/website identity and fact records. Independent expectation: Cantonese-primary facts do not justify `CONFLICT` with a Sichuan/Hunan spicy-focus exclusion; explicit prohibited focus must still conflict; broad Chinese remains unknown.
- Model-only diagnosis: one Prompt@8/schema@2 provider attempt, zero retry and zero browser/Google calls. [Saved exact request/raw output](../../.eval-artifacts/restaurant-fact-targeted/choryumon-2026-09-24T08-05-25-800Z.result.json) has `CONFLICT` on the Cantonese website fact and matching derived violation. This is a new fixed-source result, not a historical raw-output replay.
- Temporary Prompt@9 candidate: [three saved controls](../../.eval-artifacts/restaurant-fact-targeted/choryumon-controls-2026-09-24T08-07-57-020Z.result.json), three provider attempts, zero retries. The explicit Sichuan/Hunan case remained `CONFLICT`, broad Chinese was `UNKNOWN`, but Cantonese-primary became `SUPPORTED` and emitted `verifiedNegativeCriteria` without a source-explicit exclusion. This violates the conservative independent oracle. Candidate reverted; no production code or evaluator change, so the diagnosis is not a repair and no full offline gate or H002 Live was run for it.

## TEST-2026-09-24-C1-E1-DIAGNOSIS — no repair claimed

- C1 Live Read-only: one LAVAROCK TableCheck reservation-page visit, <=25 seconds, one temporary Chromium session, zero model calls, no submit. [Artifact](../../.eval-artifacts/restaurant-control-targeted/lavarock-2026-09-24T07-59-40-509Z.json) records selected adult value 10, no independently saved selected date, and `hasTableCheckSelectedRequest=false`. This does not replay the H003 click or establish a completed 10-person/date query. Existing request/inventory gate was reused; no tests or evaluator changed, no availability asserted.
- E1 historical artifact diagnosis: [H001 result](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-24T03-56-54-360Z-31020bc5-a3c3-45bb-ae39-9c4cdb138093.result.json) retains two eligible candidates in the last contexts and 22 checkable candidates about 45 seconds before run end. Current ADR-0028, prompt and Domain Validator intentionally reject a short batch while reads remain legal; existing `action-validator.test.ts` covers that rule. This is a contract gap for budget-aware delivery, not a repaired bug. No controlled presentation, real-model E2 or new Live was run; the existing result evaluator and manual acceptance remain FAIL for H001.

## TEST-2026-09-24-MARUNOUCHI-B1 — targeted source read and Adapter regression

- Mode: Live Read-only targeted Tabelog search, then offline Adapter Mock; no model call, booking or external write.
- Frozen H003 failure: unscoped `MARUNOUCHI BASE` search returned Aichi results and no same-store match. Independent [Tabelog Tokyo outlet](https://tabelog.com/en/tokyo/A1302/A130201/13251017/) fixes the expected source door. First Tokyo probe showed the region but its limited extraction did not decide target presence; second [saved observation](../../.eval-artifacts/restaurant-source-targeted/marunouchi-2026-09-24T07-54-22-129Z.json) parsed the correct outlet with the production parser.
- Red/green: existing Adapter navigation assertion changed to the expected Tokyo-scoped entrance and failed before the code edit; it passed after. Added a field-derived MARUNOUCHI BASE synthetic search/detail path in the same Adapter test file, with HIGH identity diagnostic and no invented availability; an Osaka candidate retains the unscoped search in the existing challenge diagnostic test. Synthetic HTML is not real-page Replay.
- Checks: `node --import tsx --test src/integrations/tabelog/tabelog-browser-availability.test.ts` 26/26; `npm run typecheck`, `npm run arch:check`, `npm run build` passed. Initial sandbox `npm test` hit `listen EPERM 127.0.0.1` in local Web tests; the authorized local-listener run passed 521/521. `git diff --check` pending final diff review.
- Stage evaluator: existing Tabelog identity diagnostic reused, with independent manual source/outlet verdict; whole-task Eval was not used. Current Tabelog detail, real inventory, other regions and complete H003 remain unverified. The source-discovery stage has a current feasible target within one bounded source query, but no claim of full user-goal completion.

## TEST-2026-09-24-TWO-ROOMS-A2-A3 — local wiring supported, current source not reached

- Mode: frozen H001/H003 identity fields, field-derived synthetic TableCheck page fixture through actual parser/Router/Runtime reducer, and one Live Read-only single-provider probe. No full-page historical Replay is claimed. Existing wrong-floor/street, same-phone branch and missing-address controls were reused.
- A2: Kazumasa and Komachi remain `CONFLICT` with different field mechanisms; neither is a floor-postcode case or a proven same-outlet expectation. A3 local test retains HIGH identity evidence for provider ID `trnihombashi`, navigates to its reservation page, and keeps unconfirmed inventory non-AVAILABLE.
- Targeted Live: [source artifact](../../.eval-artifacts/restaurant-identity-targeted/two-rooms-2026-09-24T07-47-18-671Z.json), one session, zero model calls, ceiling 45 seconds / 30 browser operations, elapsed about 11.5 seconds. TableCheck search yielded five other merchants; none passed identity and `trnihombashi` was not inspected. Verdict: source discovery **uncovered** for this identity mechanism, UNKNOWN correctly retained. The first temporary script attempt failed compilation before browser startup; one actual read followed. No repeat or full H003.
- Evaluator: current provider diagnostic plus independent manual stage verdict; no claim of a general Live evaluator pass or successful inventory. [Detailed scope and stage attribution](TWO-ROOMS-IDENTITY-2026-09-24.md).
- Offline gates after the added production-path control: typecheck, architecture check, build, diff check and default tests 520/520 pass.

## TEST-2026-09-24-TWO-ROOMS-IDENTITY — local mechanism supported

- Mode: frozen historical Google/TableCheck identity fields plus independent restaurant/Japan Post sources; no model or Live execution. Four controls are TWO ROOMS Nihombashi, bills Ginza, actual Aoyama sister outlet and Ginza Kazen. The current diagnostic comparison is reused with a separately fixed expected identity verdict; the general Live Evaluator does not contain gold same-outlet labels for this local hypothesis.
- Detector: the target assertion failed on unmodified code (`CONFLICT` versus independently expected `INSUFFICIENT`); the old suite had no town-postcode/building-floor-postcode pair. After the one-rule correction, TableCheck tests pass 39/39, address tests 3/3 and all four control decisions match expectations. Aoyama remains below HIGH; Ginza Kazen remains below HIGH for a separate issue.
- Gates: typecheck, architecture check, build, diff check and default tests 519/519 pass. No targeted Live or full H003 rerun. Identity comparison is supported locally; inventory and task completion remain unassessed. [Evidence and limitations](TWO-ROOMS-IDENTITY-2026-09-24.md).

## TEST-2026-09-24-A-D-LIVE-H003 — failed normal acceptance

- Mode: Live Read-only, exposed development case H003, clean `605dc82`, temporary Local Chromium, original 300000 ms / 50 shared model calls, no human takeover or external write. A direct runner invocation lacked `.env` and stopped before execution; the project script loaded local configuration and made the sole H003 Live run.
- Result: CANCELLED at 300038 ms, 30 discovered, 9 completed checks (5 request unconfirmed, 3 evidence incomplete, 1 source-grounded available offer); no presentation. Browser operations 281 versus old H003 435; browser-model calls 30 versus 26. Automatic evaluator says no qualified user result and leaves criterion wording equivalence unassessed. The single offer emerged near the deadline, so it cannot be counted as budgeted completion. [Artifact links and manual acceptance](EXECUTION-CORRECTNESS-2026-09-24.md).
- Overall A–D acceptance: H001, H002 and H003 all failed to produce a qualified user result within the unchanged deadline. Safety stops and offline controls pass within their scope; they do not close the promised normal-result path. No additional paid retry was performed.

## TEST-2026-09-24-A-D-LIVE-H001-H002 — failed normal acceptance

- Mode: Live Read-only, exposed development set, clean `fb1b48a`, temporary Local Chromium, each case at 300000 ms / 50 shared model calls, no human takeover or external-write route. The initial sandbox H001 `NETWORK` failure stopped at Semantic; separate artifact preserved. The same command outside the sandbox produced the H001 execution result; H002 ran once outside the sandbox.
- H001 CANCELLED at 300034 ms: 18 completed checks, 8 UNAVAILABLE / 8 UNKNOWN / 2 AVAILABLE and currently eligible, but no presentation. Browser operations 333, browser-model calls 9. Automatic evaluation: no qualified user result.
- H002 CANCELLED at 300036 ms: 9 completed checks, 7 UNKNOWN / 2 AVAILABLE but neither eligible. Browser operations 247 versus 417 in old H002, browser-model calls 19. Automatic evaluation: no qualified user result. Hyoki had source `hot_pot_restaurant` but the real plural HARD criterion was not detected before availability; an added same-suite wording regression catches this after the run. No H002 retry or post-fix Live pass claimed. [Artifact links and acceptance comparison](EXECUTION-CORRECTNESS-2026-09-24.md).
- Post-Live D wording correction: typecheck, architecture check, build, diff check and default tests 518/518 pass. Browser fixture was not repeated because the correction touches only Domain type-criterion matching.

## TEST-2026-09-24-A-D-OFFLINE — implementation checks, no Live acceptance

- Reused TableCheck Adapter, Agent action/decision, Browser Executor, Domain grounding/context and website fact suites with synthetic negative and normal controls. A new scenario in the existing local Chromium Harness reads the correct outlet from two current search links with zero model actions. The original H001 invalid fields are unavailable; its new malformed-wire cases are explicitly synthetic.
- Final `npm run typecheck`, `npm run arch:check`, `npm run build`, `git diff --check` PASS; default `npm test` **518/518 PASS** and `npm run test:browser:fixture` **24/24 PASS**. Initial sandbox-only test and Chromium failures were permission errors (`listen EPERM`, browser MachPort denial); identical commands passed outside the sandbox.
- Mode: Mock plus real local Chromium Fixture. No new real model, source Live, private Holdout, controlled Live-write, booking or payment. Fixture normal completion and rejection controls are distinct from H001–H003 acceptance; automatic evaluation and a new Live comparison remain pending.

## TEST-2026-09-24-TEST-EVAL-HOLDOUT-PROTOCOL — documentation verification

- Mode: static documentation/Runner inspection only. Checked Planning→Test fault-closure anchor, Test/Eval acceptance wording, and current Holdout SHA-change requirements against `run-exposed-holdout-regression.ts`.
- `git diff --check` passed. No code test, real model, private Holdout, Live, or external write was run; no product or Clean Baseline acceptance is claimed.

## TEST-2026-09-21-LIVE-READ-P0-SINGLE-PASS — failed overall gate, partial execution improvements

- Provenance: implementation `325880d1bdc408b783cbc5106d96780002d8121e`; H001/H002/H003 all CLEAN, temporary Local Chromium, 300000 ms / 50 shared model calls, no human takeover. Each ran once, with original execution and separate evaluator@19 retained. Exposed development evidence, not Clean Baseline.
- H001: FAILED / AGENT_DECISION_FAILED invalid INVESTIGATE_CANDIDATE_FACTS non-placeholder fields; 40 discovered / 3 availability checked / 37 remaining; 90 browser operations / 6 browser-model calls / 100992 ms.
- H002: CANCELLED at actual global deadline; named Higashi-ginza Sta. resolved, 40 discovered / 9 checked / 31 remaining, 417 operations / 11 browser-model calls / 299999 ms. One additional in-flight candidate contributes cost but is not counted as checked. Party=2 and negative HARD retained; evaluator paraphrase dimensions remain NOT_EVALUATED.
- H003: CANCELLED at actual global deadline; 28 candidates all within 3 km (max 2614.375m), 6 checked / 22 remaining, 435 operations / 26 browser-model calls / 300039 ms. No US candidate; no qualified result or completion claimed.
- Local-failure scope and geography have real evidence; normal completion/efficiency remains unaccepted. No paid retries, H004/H005, or controlled Live-write. Full immutable paths/hashes, diagnostic coverage limits, and next bounded reproduction are in the [review](LIVE-READ-P0-REVIEW-2026-09-21.md).


## TEST-2026-09-21-LIVE-READ-P0 — offline integration and browser review

- Mode: offline model/network/runtime fixtures plus real local Chromium fixture; no new real-site/paid Live calls yet and no controlled Live-write.
- Actual Hybrid composition: A/B/C source failures leave D presentable, outside/missing-coordinate observations never enter the Agent pool, shared gateway budget and runtime launch outage stay TASK failures, cancellation writes immutable partial state/cost/search diagnostics using the CLI's shared production capture. Independent evaluation consumes the produced result; isolated mutations must fail business assertions.
- Final default suite: 509/509 PASS in the local loopback environment. The sandbox attempt failed on `listen EPERM` HTTP fixtures; the same command succeeded outside it. Full real-browser fixture: 23/23 PASS; the prior text-only cycle-key regression failed the public-filter fixture and was corrected to observe actual control state. Initial sandbox Chromium launch failures are environmental and are not fixture passes.
- Logs: `.eval-artifacts/live-read-p0-review-2026-09-21/final-default-tests.log` and `final-browser-fixture.log`. Final source recovery review, typecheck, arch:check, build and diff check passed; clean-HEAD H001–H003 Live remains pending. No H004/H005 Live, no automatic paid retry. [Behavioral matrix and retained failed controls](LIVE-READ-P0-REVIEW-2026-09-21.md).


## TEST-2026-09-18-PARTY-SIZE-SUPPLEMENT — bounded real-model transport gate

- Scope: a disposable supplementary resolver candidate only; its primary semantic boundary was controlled as an already-compiled AVAILABILITY draft with date/time/area and no party. The pre-frozen plan has four existing and four blind controls; the model receives only raw message plus the necessary goal context, never sample IDs, Gold or case names. It has one strict schema call per attempt, 30,000 ms timeout, temperature 0, disabled thinking, and no retry.
- Preflight: `npm run typecheck` and `PRAXIS_PARTY_SIZE_SUPPLEMENT_DIAGNOSTIC_MODE=preflight node --env-file-if-exists=.env --import tsx scripts/run-party-size-supplement-diagnostic.ts` passed before the run. Candidate-focused Interpreter→Compiler→merge tests passed before the paid gate; they prove only code-path guards/no-overwrite/fail-closed behavior.
- Accounting/result: the single process reserved and dispatched all 24 calls (8×3); all 24 received `MODEL_FAILURE / PROVIDER_REJECTED` before a structured completion. There were 0 retries, 0 completed outputs, and 0 Google/website/browser/booking/external-write calls. The run artifact's provider-detail diagnostic is missing, so a strict-schema incompatibility is a supported but unconfirmed cause. It is not evidence of a wrong party inference.
- Decision: H002 acceptance fails (all cases 0/3 due transport rejection). The resolver and E+resolver wiring were removed; no production Prompt@20 or resolver path is claimed. H004 closure and H003 human review are recorded separately; no H005 model, fixed-source, or Live run was invoked. Evidence: [closure report](H002-H003-H004-SEMANTIC-CLOSURE-2026-09-18.md) and `.eval-artifacts/party-size-supplement-diagnostic-2026-09-18/party-size-supplement-2026-09-18T07-51-26-983Z-1ff94503-3910-49e0-b724-e78cdb722c23/`.
- Post-withdrawal checks: `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check` passed; local `npm test` passed 438/438. A sandbox attempt saw 19 `listen EPERM` localhost failures, then the identical suite passed outside the sandbox. Scope deviation: default `npm test` includes existing static H005 unit/fixture cases. No H005 fact-judge, fixed-source runner, external source, or Live run was invoked, and no H005 artifact/fixture/evaluator changed.

## TEST-2026-09-18-SEMANTIC-RULE-EXPRESSION — bounded real-model A/D and A/E diagnostics

- Scope: reference `01e073f`; no production code or Prompt revision. Both variants retain the complete Semantic parser/schema/transport/context/Compiler/Draft path. D differs from A only in the generic PARTY SIZE block; E differs only in the local optionality-scope paragraph. Each prompt diff checks exactly one original/replacement block and byte-identical prefix/suffix. H004 was not run and has a manual-equivalence closing note; H005/fact judgment/fixed-source/E2E were not run.
- Accounting: two independent artifacts and ledgers each record 24 `RESERVED` and 24 `COMPLETED` calls, no failures/retries/timeouts, all `DEEPSEEK/deepseek-flash`, `TOOL_CALLS`, Proposal-valid and `COMPILED`. H002 A/D used 152,368 tokens / 37,425 ms; H003 A/E used 155,051 tokens / 39,668 ms. No Google, website, browser, booking or external write occurred.
- Result / proof boundary: D has H002 A=0/3 and D=0/3, with all controls 3/3, so it is rejected and no new D wording follows. E has H003 A=0/3 and E=3/3, preserves explicitly flexible room/budget SOFT and does not add a comparative control failure; its work-celebration/drinks control remains a known A/E 0/3 failure, and its `suitable for a team dinner` wording is unreviewed semantic fidelity. E is only a limited candidate for human review, not an applied production change or proof of general strength correctness.
- Offline verification before the run: `PRAXIS_RULE_EXPRESSION_DIAGNOSTIC_MODE=preflight node --env-file-if-exists=.env --import tsx scripts/run-semantic-rule-expression-diagnostic.ts`, `npm run typecheck`, `npm run arch:check`, `git diff --check` passed. Evidence: `.eval-artifacts/semantic-rule-expression-diagnostic-2026-09-18/H002-H003-RULE-EXPRESSION-REPORT.md`, two plans/results/ledgers and 48 per-call records. No commit/push.

## TEST-2026-09-18-SEMANTIC-PARTY-POSITION — bounded real-model A/C diagnostic

- Scope: frozen `01e073f`; four already-exposed party samples; complete A Prompt@19 versus complete C with only the PARTY SIZE section moved. Preflight saved actual prompt text and passed exact-move checks: A/C contain one identical PARTY SIZE block, all remaining text is byte-identical after block removal, and the PARTY_SIZE output shape remains in place. Model transport/schema/reference time/timezone/temperature/thinking/output cap/timeout/context were identical; C's diagnostic metadata does not claim a production prompt version.
- Accounting: `node --env-file-if-exists=.env --import tsx scripts/run-semantic-party-position-diagnostic.ts` recorded 24 reserved and 24 completed calls, 0 failure/retry/timeout, all `DEEPSEEK/deepseek-flash` with `TOOL_CALLS`, valid Proposal and `COMPILED` patch/Draft. Recorded usage is 144,462 input / 7,651 output / 152,113 total tokens and 35,221 ms summed latency. No Google, website, browser, booking or external-write action occurred.
- Result / proof boundary: H002 A=0/3 and C=2/3, so C fails the explicit stability acceptance criterion and is not a candidate. All three party controls are A=3/3 and C=3/3. All complete outputs are retained and no C-only confirmed key regression was found in this four-sample review; absent independent expectations remain unscored, including a friends criterion added in both variants for open attendees. This is an exposed current-model diagnostic, not evidence of general parser improvement or causal attribution.
- Offline verification after the diagnostic runner addition: `PRAXIS_PARTY_POSITION_DIAGNOSTIC_MODE=preflight node --env-file-if-exists=.env --import tsx scripts/run-semantic-party-position-diagnostic.ts`, `npm run typecheck`, `npm run arch:check`, and `git diff --check` passed. Evidence: `.eval-artifacts/semantic-party-position-diagnostic-2026-09-18/PARTY-POSITION-DIAGNOSTIC-REPORT.md`, plan, 24 immutable call records, result and ledger. No commit or push.

## TEST-2026-09-18-SEMANTIC-FIELD-SCOPE-DIAGNOSTIC — bounded real-model diagnostic

- Scope: code snapshot `01e073f`; eight already-exposed targeted-repair samples, each in fixed `A1/B1/A2/B2` order. A used the actual Prompt@19 request builder; B retained the relevant original rules and the same `restaurant-semantic-proposal@3` schema/transport, reference time, timezone, 30,000 ms timeout, 5,000 output cap, temperature 0 and disabled thinking. B is an incomplete diagnostic task, not a production parser or proposed production path.
- Accounting: an initial start record is `FAILED_BEFORE_DISPATCH` because its Node command did not load the existing `.env`; it has 0 reservations and 0 calls. The completed run has 32 pre-dispatch `RESERVED` ledger records and 32 corresponding `COMPLETED` records, 0 failure/retry/timeout, all `DEEPSEEK/deepseek-flash`, `TOOL_CALLS` and locally schema-valid. It used 160,168 input / 8,283 output / 168,451 total recorded tokens and 43,139 ms summed provider latency. It made 0 Google, website, browser, booking or other external-write calls.
- Result / proof boundary: H002 A=0/2 vs B=2/2 while all three party controls remain correct. Strength is mixed: H003 B=1/2 full passes, defining-activity/drinks B=0/2, flexible-improvements B=2/2, and local optionality B=2/2. The source expectation format lacks criterion polarity, so actual polarity is recorded but not retrospectively scored; criteria order and non-exact wording are not automatic failures. This proves only this exposed sample/model comparison, not an internal causal mechanism or a production-quality improvement.
- Offline checks after diagnostic-script changes: `PRAXIS_FIELD_SCOPE_DIAGNOSTIC_MODE=preflight node --import tsx scripts/run-semantic-field-scope-diagnostic.ts`, `npm run typecheck`, `npm run arch:check`, `git diff --check` all passed. Evidence: `.eval-artifacts/semantic-field-scope-diagnostic-2026-09-18/FIELD-SCOPE-DIAGNOSTIC-REPORT.md` and the linked plan/result/ledger; no commit or push.

## TEST-2026-09-18-SEMANTIC-REPAIR-FAILURE-REVIEW — read-only artifact audit

- Scope: review `01e073f` with a clean starting worktree; no production behavior, dataset, evaluator, model or source transport changed. `node --import tsx scripts/extract-semantic-targeted-repair.ts` read the complete 48-call artifact and asserted 48 captured semantic calls plus structural equality between each decoded raw response and stored Proposal. It emits full user payload, saved context, request configuration, raw response, Proposal and original assessment; it explicitly marks final Draft as not captured because the runner did not compile/reduce.
- Audit result: all 48 were `DEEPSEEK/deepseek-flash`, JSON schema, 30s / 5000-output / temperature 0 / thinking disabled, `TOOL_CALLS`. The old scorer uses normalized phrase containment plus strength only; it does not score expected polarity, order or extras. H002 has no A/B PARTY SIZE instruction difference, H003 has a retained-word SOFT failure, and H005's v2 fact raw messages are absent. No new model, Google, website, browser, booking or external-write action was run. No test result is claimed for Prompt@3 model behavior.
- Accounting: completed artifact proves 48 successful semantic calls / 304,482 recorded tokens and zero fact calls; the second `STARTED` artifact has no result or call log, therefore its call count remains unknown and is not reported as zero. The local artifacts do not preserve authorization provenance sufficient to reconcile the prior 66-call playbook wording with the earlier 50-call constraint.
- Evidence: `.eval-artifacts/semantic-repair-failure-review-2026-09-18/REPORT.md`, `CALL-DETAILS.md`, and the read-only extractor. No commit/push was performed by this review.

## TEST-2026-09-18-TARGETED-SEMANTIC-REPAIR — one candidate, bounded semantic diagnostic

- Evidence / scope: frozen failure snapshot `9cfbd4f` (Semantic@17) versus current uncommitted candidate (Semantic@19, Fact Judgment@3). H002 actual Proposal/Draft omit PARTY_SIZE; H003 actual Proposal/Draft contain `suitable for a team dinner` at SOFT; H005 original fixed source is `Tokyo regional cuisine` rather than an explicit local-food fact. Original executions, evaluator sidecars, Gold and source artifacts are unchanged. H004 has a separate append-only supplemental condition review: user-accepted `SEMANTICALLY_EQUIVALENT`, while original automatic `NOT_EVALUATED` and all overall findings remain unchanged.
- Real semantic diagnostic: exactly **48 successful** DeepSeek semantic calls, eight fixed exposed development samples × v17/v19 × three. All were structurally PROPOSED. H002 inferred-party expectation: 0/3 → 0/3. H003 all-four-strength expectation: 0/3 → 1/3. Closed singular counterpart, open-attendee, and explicit-total controls: 3/3 in both; defining-activity/drinks and flexible-improvement controls: 0/3 in both; locality optionality: 3/3 in both. This is not a strict historical causal A/B and is not a Holdout or reliability estimate. One duplicate temporary process was terminated and left a separate STARTED artifact without a result; its provider-call count is indeterminate, so no further calls were made under the prior 50-call authorization.
- H005: Prompt@3 requires direct textual entailment and treats geographical/regional-cuisine association alone as UNKNOWN. Original a/c show over-confirmation risk, b shows insufficient evidence. The frozen fixture and scripted production composition now preserve that distinction: three facts plus three availability reads reach `NO_VERIFIED_RESULT`, no results are presented, and the registered fixed-source acceptance deliberately returns FAIL. This is fail-closed code-contract evidence, not a real Fact Judgment@3 model result. The planned v2/v3 three-candidate × three-repeat comparison (18 calls) was not run and needs fresh explicit quota.
- Offline verification: focused `node --import tsx --test src/eval/restaurant/agent-loop/current-development-offline.test.ts src/domains/restaurant/semantic-interpreter.test.ts src/integrations/restaurant-facts/model-fact-judgment.test.ts src/eval/restaurant/agent-loop/current-development-fixed-sources.test.ts` passed **29/29**. `npm run typecheck`, `npm run arch:check` (0 forbidden dependencies), `npm run build` and `git diff --check` passed. The authorized local-loopback `npm test` passed **438/438**, 0 fail/cancel/skip/todo, **17,536.623ms**; the only prior sandbox result was listener `EPERM`, recorded as environment-only and not a product failure. No real Google, website, browser, booking or external write was run.
- Decision: H004 supplemental record complete at one condition only; H002 unresolved; H003 partial and not accepted; H005 source/transport boundary corrected but real fact-judge behavior unverified. No Prompt@20, additional real-model retry, commit or push is permitted by this test record. Evidence: `.eval-artifacts/restaurant-semantic-targeted-repair/`.

## TEST-2026-09-18-H001-H005-FIXED-SOURCE-REAL-MODEL — one run per frozen development case

- Scope/budget: frozen commit `9cfbd4f`; one DeepSeek fixed-source execution each for H001–H005, with per-case ceilings 300,000ms/50 steps/50 model calls. All external source pages and Google responses were `SYNTHETIC_CONTROL` fixed transport; no real Google, website, browser, login, booking or external write occurred. Total: **25 model calls**, **95,297 tokens**, **30,990ms**, 11 controlled source-composition Google calls.
- H001: PASS — `PRESENT_RESULTS`, three distinct candidates and `{candidateCount:3, met:true}`; evaluator@16 `qualified=YES`; 5,847ms/4 model calls. Artifacts: [result](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-18T04-25-07-895Z-dd1e1427-402b-4165-a38c-7ea391805ecf.result.json) and [evaluation](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-18T04-25-07-895Z-dd1e1427-402b-4165-a38c-7ea391805ecf.result.evaluation.16-1789705513752.json).
- H002: FAIL — semantic Proposal omitted `PARTY_SIZE`; Agent correctly stopped at `NEEDS_INPUT` before source reads (3,621ms/2 calls). H003: FAIL — three results were presented, but semantic output changed required `team dinner` to `suitable for a team dinner`; evaluator rejected authoritative conditions/evidence (6,586ms/4 calls). H004: FAIL/unknown — evidence was sufficient but a SOFT paraphrase made independent semantic equivalence `NOT_EVALUATED` (6,495ms/7 calls). H005: FAIL — evaluator found the two presented candidates supported, but acceptance rejected `2/3` and `met:false` (8,441ms/8 calls). Their execution/evaluation pairs remain in the same artifact directory; no rerun was made.
- The post-run Prompt@18 / explicit-`local food` candidate is historical only. It is superseded by `TEST-2026-09-18-TARGETED-SEMANTIC-REPAIR`, which removes the case-specific sentences and restores the original H005 source. Its earlier local-pass count cannot be used as evidence for the current candidate or for the original source facts.
- Next gate: original-researcher review of both the immutable run artifacts and the local repair. A further real-model run would require a new bounded authorization and a separately recorded snapshot.

## TEST-2026-09-18-OPEN-ENDED-AVAILABILITY-RESULT-TARGET — offline production composition and acceptance

- Scope: `OPEN_ENDED` AVAILABILITY now reaches the same runtime result target as open-ended recommendation. H001–H005 each use three source-distinct candidates and retain the real Interpreter → Compiler → Runtime/Reducer → Agent/Validator → Router → fixed source → artifact evaluator route; only the model/source transports are controlled.
- Independent acceptance: registered frozen cases require exactly three distinct `presentedResults.candidateIds` and persisted `{ candidateCount: 3, met: true }`. A dedicated failure control supplies one presented candidate with an unmet target and gets `FAIL`; it cannot pass merely because the evaluator calls the single result qualified.
- Focused command: `node --import tsx --test src/eval/restaurant/agent-loop/fixed-source-acceptance.test.ts src/eval/restaurant/agent-loop/current-development-offline.test.ts` — **14/14 PASS**, 0 fail/cancel/skip/todo (520ms). This run produced no paid-model, Google, browser, replay or external-write action.
- Required final gates: `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check` PASS; loopback-authorized `npm test` **436/436 PASS**, 0 fail/cancel/skip/todo (18168ms).
- Limits: scripted model decisions prove runtime/acceptance wiring and the source fixtures prove three-candidate evidence production. They do not prove real-model selection, current website behavior, real Google results or availability; original-researcher review remains pending.

## TEST-2026-09-18-OPEN-ENDED-TARGET-AND-PARTY-BOUNDARY — offline contract and Web composition

- Scope and production composition: preserved `Semantic Interpreter → Proposal Contract → Compiler → Runtime/Reducer → Agent Context/Decision → Action Validator → Router → PersistentRestaurantAgentApplication → PGlite → HTTP Web`. The Web scenario uses a controlled ModelGateway and controlled source transport only at external boundaries; it does not hand-write qualified State, access a real model/Google/browser, or perform an external write.
- Result-target evidence: semantic `TARGET.selectionScope=OPEN_ENDED` produces a first `resultBatchTarget` of three; the production Web composition presents a/b/c and projects `{ candidateCount: 3, met: true }`. Its shortfall fixture withholds b–f facts, so a is the only initially qualified result; the controlled Agent must select b/c/d for `INVESTIGATE_CANDIDATE_FACTS`, after which Router/Reducer/PGlite/HTTP present a/b/c. It asserts exactly one discovery, one fact read, four model-boundary calls and no availability read, proving the real entry does not prematurely present or blindly restart discovery while a legal fact read remains. The Domain validator rejects a one-result presentation while another cursor/fact read is legal, permits it only after both discovery and candidate reads are exhausted, and the actual Reducer records `{ candidateCount: 3, met: false }`. Schema/compiler tests accept an open user count, reject the same field for a named outlet, and preserve legacy targets without invented classification. Existing target scope/count is included in a later Semantic Interpreter model context.
- Party-boundary evidence: controlled Interpreter responses cover closed pair (2), enumerated three, explicit correction to four, open group, unspecified extra attendees, and generic dated romantic recommendation. `PARTY_SIZE.source` accepts only `EXPLICIT` or `INFERRED_CLOSED_PARTY`; Compiler/Reducer retain it only with the count and clear it with the count. The ordinary persistent Web artifact scenario proves an explicit count exports `party_size_source=EXPLICIT` and its semantic Event references the same stored user-message request ID. No code path adds 2 from a date or generic recommendation, and source never changes Router/Policy/provider inputs. This is a transport/state boundary test, not an independent real-model quality evaluation or a claim that the fixtures establish semantic inference quality.
- Commands: focused party-source Contract/Compiler/Interpreter/Web-artifact tests **4/4 PASS**; focused local Web shortfall composition test **1/1 PASS** after the first sandboxed attempt was blocked only by local `127.0.0.1` `EPERM`; focused Domain semantic/validator suite **50/50 PASS**. First unrestricted `npm test` attempt had **18** loopback `EPERM` failures solely because the sandbox denied `127.0.0.1` listeners; its remaining Domain tests passed. The final repository test command with loopback permission passed **435/435**, 0 fail/cancel/skip/todo; `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check` PASS on the final worktree. No new Live/Replay/paid-model artifact was created.
- Limits: this advances offline B8/B9-like selection and B10-like condition persistence evidence only. It does not replace B1–B7 or B11–B14 historical evidence, does not prove source relevance, dynamic page controls, availability or real-model semantic quality, and is not an original-researcher review.

## TEST-2026-09-18-CONTINUOUS-SELECTION-OFFLINE — controlled Web/PGlite composition

- Scope and boundaries: actual `PersistentRestaurantAgentApplication` → Runtime/Reducer → Agent Decision → Router → PGlite persistence → HTTP Web entry was retained. The controlled test replaces only ModelGateway and restaurant-source transport; it does not hand-construct a qualified Task state and does not call real Google, a browser, a paid model, or an external write.
- Behaviour evidence: initial a/b/c are presented; browse, shortlist and `too expensive` feedback each persist through the Web entry without extra model/search/fact/availability calls. A separate scenario begins with only a/b/c and a durable cursor, records `NEXT_BATCH_REPLENISHMENT_REQUESTED`, resumes the same application loop, requests the cursor page, and presents unseen d/e/f. It asserts two searches, five model boundary calls, no fact/availability read, and no repeated delivered ID.
- Independent failure mechanisms: Google adapter contracts reject token reuse and preserve page one after page-two failure; Router tests omit a stale-intent cursor; Action/assessment tests reject exhausted reworded discovery. The prior terminal-outcome assertion was deliberately updated because a presented batch is now `WAITING_USER`, not a completed Task.
- Commands: `npm run typecheck` PASS; focused domain/Google/Web tests PASS; final `npm test` **427/427 PASS** (0 fail/cancel/skip/todo, 17239ms); final `npm run arch:check`, `npm run build`, and `git diff --check` PASS.
- Limits: scripted boundary choices prove the composition and safety constraints, not real-model judgment. No Replay or Live evidence was created; B1–B7, B10–B14 retain their previously recorded scope and this slice adds only offline B8/B9-adjacent continuation evidence. It is not an independent review or Live acceptance.

## TEST-2026-09-17-H001-30S-SEMANTIC-RETRY — Live Read-only

- Code contract: `RestaurantSemanticInterpreter` now sends `timeoutMs=30000`; its focused request-contract test **2/2 PASS** plus `npm run typecheck`、`npm run arch:check`、`npm run build` all PASS. The subsequently started full `npm test` was interrupted by the user after 3.9 seconds and has no final result; it is not reported as passing. The existing runner wrapper still bounds the request by remaining five-minute budget.
- Scope/budget: one explicit H001 retry only, isolated current source snapshot, `LOCAL_CHROMIUM` temporary profile, tomorrow→Tokyo 2026-09-19 at exact 19:00／2 people／omakase HARD; 300 seconds, max 30 model calls, 10 Google, 50 browser operations per candidate. Actual **103378ms**, 4 agent steps, 13 model calls (semantic1/agent4/browser8), Google **5/10**, three availability checks and browser operations 28/12/16 per checked candidate. No login, manual challenge, reservation submission or external write.
- Entry and identity: Sushi Inase first attempted its Google-listed `https://www.tablecheck.com/ja/sushiinase/reserve/landing`, then verified the corresponding English TableCheck outlet; `地下1階` versus `B1F` was HIGH (name/address/phone all MATCH). Sushisho Isseki Sancho was HIGH on the separately discovered TableCheck merchant page. Jinnan rejected all unrelated TableCheck discovered outlets before Tabelog identified the same branch HIGH; it remained request-control UNKNOWN rather than borrowing inventory from another branch.
- Exact request/result: TableCheck evidence for **Sushisho Isseki Sancho** claims date 2026-09-19, partySize 2 and visibleSlots `["19:00"]`, thus AVAILABLE and presented. **Sushi Inase** claims the identical date/party with an empty slots list, thus `UNAVAILABLE/NO_MATCHING_SLOT`. **Shibuya Sushi Jinnan** is `UNKNOWN/REQUEST_SELECTION_UNCONFIRMED`; seven other discovered candidates were not checked after a grounded result became available, so this does not claim complete search or global availability.
- Independent evaluator@16: `taskProducedQualifiedResult=YES`, `systemBehavior=SUPPORTED_BY_EVIDENCE`, `externalConditions=OBSERVED`, `evidenceSufficiency=SUFFICIENT_FOR_PRESENTED_RESULT`, and all six recorded dimensions SATISFIED. It does not score provider reliability, long-term inventory freshness, exhaustive discovery, subjective ranking or model quality. Artifacts: [started](../../.eval-artifacts/h001-live-tomorrow-30s-2026-09-17/workspace/.eval-artifacts/restaurant-hybrid-live-read/2026-09-17T15-08-25-556Z-fb613f8b-c6c5-4241-a98a-a056063b0af5.started.json)、[result](../../.eval-artifacts/h001-live-tomorrow-30s-2026-09-17/workspace/.eval-artifacts/restaurant-hybrid-live-read/2026-09-17T15-08-25-556Z-fb613f8b-c6c5-4241-a98a-a056063b0af5.result.json)、[evaluation](../../.eval-artifacts/h001-live-tomorrow-30s-2026-09-17/workspace/.eval-artifacts/restaurant-hybrid-live-read/2026-09-17T15-08-25-556Z-fb613f8b-c6c5-4241-a98a-a056063b0af5.result.evaluation.16-1789657808914.json)。

## TEST-2026-09-17-H001-CURRENT-REPAIR-SINGLE-LIVE — stopped before source investigation

- Scope: 用户授权的唯一 H001 Live Read-only，隔离当前修复快照；只把执行输入改为 `h001-tomorrow`，保持涩谷／omakase HARD／2 人／19:00。不是 H001–H005 批跑，不改 Gold、产品源码、Prompt、权限或浏览器规则；`LOCAL_CHROMIUM` 临时会话，没有人工 challenge、登录、预约或外部写。
- Budget evidence: started artifact 记录 30 模型调用、10 Google、每候选 50 浏览器操作和 `maxAutomaticBrowserMs=300000`；实际在 10039ms 结束。Tokyo 时区的真实启动时间为 2026-09-18 00:00:39，故 `tomorrow` 正确物化为 2026-09-19／19:00／2 人，而非把运行时条件偷偷改为日期常量。
- Execution: 首次 `restaurant_semantic_interpret` 调用使用当前 Interpreter 的固定 `timeoutMs=10000`，DeepSeek invocation 在 10003ms 记录 `outcome=FAILED,errorCode=TIMEOUT`，runner result 为 `FAILED / SEMANTIC / MODEL_FAILURE`。没有 events、trajectories、Google 请求、浏览器诊断、候选、TableCheck／Tabelog 身份诊断或空位检查；因此绝不能报告无位、入口未用、同店／分店判断、日期／人数未应用或来源读取失败。
- Independent evaluation: runner 写出独立 evaluator@16 sidecar，`taskProducedQualifiedResult=UNKNOWN`；`AUTHORITATIVE_CONDITIONS`、`REQUIRED_EVIDENCE`、`FINAL_CLAIM`、`COMPLETION_OUTCOME`、`RESOURCES`均为 `NOT_EVALUATED`，只有零次观察的谱系／重复读取记账为 `SATISFIED`。执行失败 artifact 和该无结论 sidecar 分开保留，不用 evaluator 文件存在冒充验收。原件：[started](../../.eval-artifacts/h001-live-tomorrow-2026-09-17/workspace/.eval-artifacts/restaurant-hybrid-live-read/2026-09-17T15-00-39-422Z-1d711993-99fb-48a9-b02d-5f13c5613829.started.json)、[result](../../.eval-artifacts/h001-live-tomorrow-2026-09-17/workspace/.eval-artifacts/restaurant-hybrid-live-read/2026-09-17T15-00-39-422Z-1d711993-99fb-48a9-b02d-5f13c5613829.result.json)、[sidecar](../../.eval-artifacts/h001-live-tomorrow-2026-09-17/workspace/.eval-artifacts/restaurant-hybrid-live-read/2026-09-17T15-00-39-422Z-1d711993-99fb-48a9-b02d-5f13c5613829.result.evaluation.16-1789657249430.json)。单次授权已耗尽，未自动重试；首个下一步是离线修复／验证该 semantic 单请求 timeout 与 runner deadline 的传递，再另行申请一次绝对日期、明确时区的 Live。

## TEST-2026-09-17-INDEPENDENT-IDENTITY-MATRIX

- Current executable / exposed development regression: 新增 `outlet-identity.test.ts` 的三组规则矩阵；扩展现有 TableCheck 七家历史正常对照并禁止电话捷径，Tabelog 保留共享规则接入检查；两平台同电话仍拒绝明确楼层/分店冲突。默认 npm test 自动发现，无额外运行器。
- 有效性验证：同一新增矩阵在 HEAD 565b08f 的旧规则失败；在按旧规则追加 lowercase 所重建的中间修复版也失败（明确标记重建，不宣称保存了原快照）；当前实现通过。均为目标 `ERR_ASSERTION`，不是依赖或环境故障。来源、hash、结果见 `.eval-artifacts/identity-matrix-review-2026-09-17/{red-green.json,head-before-repair.log,reconstructed-case-only-repair.log,current.log}`。
- 历史提取字段复核：Inase、涩谷 Hajime、Teppen、Sushi Labo、一石三鸟、Matsue 涩谷、Ajuuta 七家均 MATCH/HIGH；已有原安全反例仍拒绝，Maps+website 原入口反例通过。此为已保存字段的离线回归，不是当前来源或库存读取。
- 最终默认全量 **417/417 PASS**，0 fail/cancel/skip/todo，15617ms；typecheck、arch:check、build、diff check 通过。首次默认测试 402/417，15 个失败全部是沙箱禁止 `127.0.0.1` 监听的 EPERM；授权回环后通过。初次 typecheck 发现测试数据删减后的可选 phone 类型问题，去掉不必要的电话依赖后通过。最终日志分别保存，不覆盖最初失败。
- 新增三组共享规则主覆盖，已有 Adapter 用例原位扩展，不复制整个矩阵；未修改生产实现、Gold/Holdout、模型 Prompt/Evaluator 或 Live 口径。无模型/Google/外站/预约/commit/push。完整证据见[独立矩阵报告](../../.eval-artifacts/identity-matrix-review-2026-09-17/REPORT.md)。

## TEST-2026-09-17-AFTERNOON-H001-IDENTITY-ENTRANCE-REPAIR

- Before-fix evidence is retained in `.eval-artifacts/afternoon-review-2026-09-17/{REPORT.md,reproduce.mjs,results.json}`. Re-running `node --import tsx .eval-artifacts/afternoon-review-2026-09-17/reproduce.mjs` before the repair produced `CONFLICT/MEDIUM` for the historical Inase and Shibuya Hajime `地下1階`/`B1F` identities, and sent the Maps-plus-website case to TableCheck search instead of the saved outlet URL.
- After repair, the same script produces `MATCH/HIGH` for both identities and starts both the no-Maps and normal-Maps variants at `https://www.tablecheck.com/en/sushihajime-shibuya`. Existing TableCheck/Tabelog assertions retain distinct-floor, shared-phone distinct-branch, and insufficient-address refusal; new Adapter tests cover both historic identity field pairs, omitted-floor non-conflict, Maps-plus-website and invalid-lead-plus-website first navigation. Fixed-source composition retains the cross-candidate entrance re-identification test under real Google field semantics.
- Focused command over TableCheck, Tabelog, `LiveBrowserAvailability`, and fixed-source composition: **66/66 PASS**. `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check`: PASS. Authorized loopback `npm test`: **414/414 PASS**, 0 fail/cancel/skip/todo, 15083ms.
- Classification: offline production-Adapter/production-composition regression plus synthetic transport. No model, Google, Live source page, Replay, booking, payment, cancellation, login, Gold/Holdout access, commit or push. This does not alter prior Live artifacts or claim current source availability.
- Follow-up regression from `floor-repair-delta.json`: Teppen `2階`/`2F` and Sushi Labo `1階`/`1F` had regressed to `CONFLICT` after the first case-normalization repair. The shared unit pattern now removes and extracts Japanese/Latin floors with identical Unicode-aware boundaries. Four historical pairs (Inase, Hajime, Teppen, Sushi Labo) re-evaluate as `MATCH`; B1F/1F and basement/ground remain `CONFLICT`. The same focused **66/66**, typecheck, arch, build and authorized **414/414** suite were rerun PASS; no Live/model/source action occurred.


## TEST-2026-09-17-H001-DATE-VARIANTS — Live Read-only

- 用户授权只改 H001 日期为 tomorrow / this Saturday；冻结当前源码到隔离 eval 工作区，预登记9月18/19日、涩谷、2人、精确19:00、omakase HARD；canonical Gold/生产源码/Prompt未改。每轮一次、5分钟、10候选、50模型调用、50 Google、每候选50浏览器操作上限。
- 明天：PRESENT_RESULTS，鮨匠一石三鳥及Matsue涩谷店，186898ms、14模型调用、108152 tokens、2 Google。周六：PRESENT_RESULTS，Matsue涩谷店，179551ms、21模型调用、107568 tokens、5 Google。两轮各发现10家/检查6家；独立diagnostic evaluator@15均qualified YES、systemBehavior SUPPORTED_BY_EVIDENCE，六项findings SATISFIED；原始执行与sidecar分别保存。
- 原9月17日基线四个UNKNOWN是发现或身份核验失败，不是库存为零。Matsue在9月17日UNAVAILABLE而18/19日AVAILABLE，支持日期库存差异；完整原页面未留存、候选与模型路径变化、早上基线与本轮源码存在已记录事实判断修复，不能声称严格因果A/B或全城无位。新变体Jinnan仍REQUEST_SELECTION_UNCONFIRMED，其他候选仍有身份UNKNOWN。
- 本轮仅运行和审查，没有新增Mock/Replay或Controlled Live-write，不重复已有本地门禁；未预约、外部写入、commit或push。共35模型调用/215720 tokens/7 Google。完整[报告和原件索引](../../.eval-artifacts/h001-date-variants-2026-09-17/REPORT.md)。

## TEST-2026-09-17-H001-H005-BASELINE-AND-ONE-FACT-JUDGMENT-REPAIR

- **Live Read-only baseline, original requests:** Tokyo execution started 2026-09-17 10:58 CST; each H001–H005 ran once with `LOCAL_CHROMIUM`, candidate limit 10, max 5 minutes, 50 model calls, 50 Google calls and 50 browser operations per candidate. H001 `TERMINAL/NO_VERIFIED_RESULT` (218288ms; 7 Agent decisions; Google 5; browser-model 11); H002 `WAITING_USER` (4265ms; asks party size before a source read); H003 `CANCELLED` (300009ms; 10 Google; browser-model 38); H004 `TERMINAL/RESULTS_PRESENTED` (7403ms; 7 fact recommendation candidates; Google 1); H005 `CANCELLED` (300018ms; Google 7; browser-model 33). H003/H005 were budget limits, not evidence of no availability; H002 is neither source nor browser failure. No shared `INFRA_BLOCKER` was established.
- **First-root evidence and local repair:** original H003 trajectory recorded HIGH-identity Google/website `bar`/`lounge bar` facts yet no `restaurant_fact_judgment` because production judgment filtered to NEGATIVE HARD criteria. H005 demonstrated the same missing positive path for `local food`; it does not imply that local food should be accepted. `model-fact-judgment.test.ts` now proves cited `lounge bar` can produce positive `verifiedHardCriteria`, while invented citations, positive conflict labels and broad types cannot. Targeted command `node --import tsx --test src/integrations/restaurant-facts/model-fact-judgment.test.ts src/eval/restaurant/agent-loop/hybrid-read-composition.test.ts src/eval/restaurant/agent-loop/current-development-offline.test.ts`: 40/40 pass. `npm run typecheck`, `npm run arch:check`, `npm run build` pass. Full `npm test` under local-loopback authorization: 371/371 pass in 14983ms; the initial restricted-sandbox 356/371 result had exactly 15 `127.0.0.1` listen `EPERM` environment failures, then the unchanged command passed with loopback permission.
- **Affected-case Live post-check:** one H003 rerun after the patch at the same caps saved a separate artifact (`2026-09-17T03-16-42-439Z-69f0962c-f2f2-4657-8da6-f3ee1f8cbfe4.result.json`) plus evaluator sidecar. It terminated `EXECUTION_FAILURE` in 205854ms after only discovery plus one availability batch: this fresh Semantic proposal made every condition SOFT, so it never invoked facts/judgment. The first reached runtime blocker was TableCheck `REQUEST_SELECTION_UNCONFIRMED` plus Tabelog `BROWSER_TIMEOUT`, not proof the positive judgment changed a Live outcome. The entry gate for full H001–H005 post-fix regression is therefore unmet; no further Live or root-cause repair was run.
- All artifacts remain append-only under `.eval-artifacts/restaurant-hybrid-live-read/`; no booking, external write, Gold/Holdout action, commit or push occurred. Evaluator@15 remains `DRAFT_DIAGNOSTIC_ONLY`/`FULL_RUBRIC_NOT_INTEGRATED`, so it is independent diagnostic evidence, not a claim of final user-task success.

## TEST-2026-09-16-BROWSER-READ-FINAL

- 最终代码门禁：`npm run typecheck`、`npm run arch:check`、`npm test`（369/369）、`npm run build`、`npm run test:browser:fixture`（23/23）全通过。日志 `.eval-artifacts/browser-final-2026-09-16/delivery-*`；最后的 Web 过期场景使用浏览器模拟时钟验证自动更新，无实等 10 分钟或额外请求。
- Mock/真实 Chromium 本地 Fixture：实际共享 Executor、两 Session、Adapter、来源 Grounding、Web 与持久化链；回归先保存跨分店、ARIA、范围外时段、禁用窗口、导出遗漏、New case 竞态、展示范围与过期标签的失败。Cloudflare Session 本地测试不等于线上 Cloudflare 服务通过。
- Replay：保存的真实 TableCheck DOM 复核允许窗口无位。真实 Web 事件离线通过生产 exporter 重新导出，events/trajectories/finalSnapshot 不变，原件和 SHA 保留；evaluator@15 两轮业务维度通过，资源字段不足仍 NOT_EVALUATED。
- 真实模型固定上下文：Agent Decision@14 最终两例通过，前轮非法重查失败保留；Semantic@14 调查说明/真正硬要求定向对照已验证。既有 static semantic regression@3 仍 1/15 PASS、11 evaluated、10 mismatch、4 blocked；不改 Gold、不将其报为通过，未用私有 Holdout。
- Live Read-only：Tabelog 八芳 9/20、4 人 5 时段；TableCheck 一石三鳥 9/18、2 人 3 时段；八芳 9/19、4 人在 18:30–19:30 明确无位。新商户两批逐例保留失败，首份 Maru 跨分店结果作废。实际 Web 两店比较与人数/日期修订均 PRESENT_RESULTS，并核对来源、替代标签、旧结果失效和刷新恢复；最终重载仅两店、库存已过期则要求刷新。详见[完整结果和边界](BROWSER-AGENT-FINAL-REVIEW-2026-09-16.md)。
- 无 Controlled Live-write，未预约、支付、登录外部账户或代勾条款。专属 Web 3033 / PostgreSQL 55439 已停止，数据和证据保留；`cleanup.json` 两端口无监听。未 commit/push。源码差异与已有改动共存，不把整体脏工作树都算为本轮新增。

## TEST-2026-09-16-WORKFLOW-CONVERGENCE

纯文档验证：检查本轮AGENTS/Planning/Test/Post-change新增链接与章节锚点、diff及职责一致性；不复制验证矩阵，不放宽已有授权、离线门禁或证据边界。未运行业务测试、模型、Replay或Live，无外部写入。工作区其他既有改动不属于本轮。

## TEST-2026-09-16-H004-EVALUATOR

2026-09-16 H004评分器误判已局部修复：diagnostic-evaluator/rubric@14将SOFT措辞语义复核与实际来源观察适用性分开，适用于展示和无结果调查记录；不放宽门店、日期、时间、人数、HARD或证据新鲜度检查。原始H004 artifact离线重评：REQUIRED_EVIDENCE从NOT_SATISFIED变为SATISFIED，AUTHORITATIVE_CONDITIONS仍NOT_EVALUATED，FINAL_CLAIM和整体结果由失败变为待复核（qualified UNKNOWN），不宣称自动2/5成功；原始执行和@13评价未覆盖，SHA核对一致。评分器42/42定向测试及arch通过；首次全仓检查受并发agent-decision.ts语法错误阻断，该错误随后消失；最终typecheck/build通过，npm test为354/356，剩余2项为并发Agent Context版本升至7但Harness/PGlite断言仍期望6，本轮未修改这些文件。未调用模型或来源Live。

Offline historical-artifact re-evaluation；42/42定向测试包含缺硬条件、错门店、错时间和bounded no-result反例；未新建测试文件。原始artifact哈希2ba39d62a63a7aa9817a731c275711164dadb495d385cf63dc9af1a7dd3e1d89。

[报告](../../.eval-artifacts/h004-evaluator-fix-2026-09-16/REPORT.md)。

## TEST-2026-09-16-TIME-SEMANTICS-20

模式：Offline + REAL_MODEL_SEMANTIC_ONLY。2026-09-16 时间语义局部修订完成：prompt@12增加EVENING，evening/night由代码temporal-policy@3按同日18:00–23:00物化；after work保持17:30–22:00且不再自动生成criterion。预算、人数和HARD/SOFT规则不变。当前开发dataset@4仅移除H003重复after work条件。离线352/352、固定semantic fixture15/15及typecheck/arch/build通过。原20条真实模型复测20/20结构合法、20调用、24694ms、107909 tokens；Q03/05/06晚间、Q02/15/16时间-only验收通过，Q01/17/18原时间行为保持。范围外仍有波动：Q06本次first date补出2人，Q02team dinner仍SOFT，Q10新增target；不声称全语义正确或长期稳定。旧快照与本轮之间还有预先存在的备选时间prompt/schema变化，故非严格隔离A/B。没有餐厅来源Live或预约写操作。

新增一项EVENING参数化校验→Compiler→Reducer行为回归，先确认旧实现校验拒绝，再修复通过；更新版本断言和H003旧预期。初次全量：336/352，15项本机端口EPERM，1项旧prompt版本断言；修正断言并解除本机监听限制后352/352。输入/context相同，温度0、thinking关闭、cap5000，无重试/截断。输入103928/输出3981 tokens；费用未计算。未执行浏览器或站点Live。证据：[REPORT](../../.eval-artifacts/time-semantics-20-2026-09-16/REPORT.md)。

## TEST-2026-09-16-USER-20-SEMANTIC — unchanged current prompt, user-provided queries

- 用户指定20条原文，Q19/20另给人数/区域/包间偏好上下文；其余无上下文，逐条独立。不优化Prompt，不切换自由表达方案，不改Gold/源码。冻结当前prompt@11/schema@3/5000输出/temperature0/thinking disabled/10秒timeout，参考时刻2026-09-16T07:13:00.237Z（Tokyo16:13）全批相同。
- 本轮仅离线输入/上下文预检：20条，19/20的给定上下文通过生产Compiler→Runtime事件建立，精确核对仅有partySize/area/criteria，无虚构目标或时间。随后复用生产Hybrid interpretAndDispatch，给模型传真实初始Draft；模型结果经真实Compiler/Reducer保存。未执行Agent loop，外部ports若触达立即报错。没有源码改动，未重复完整Mock/build。
- 真实模型run27042c66：20调用（预设上限40，实际每条1次），无重试/截断，24564ms；input94648/output3916/total98564 tokens，无usage缺失，单条输出86–423，费用未知。20条结构PROPOSED且状态更新完成，不表示20条语义全部正确。输出、初始/最终Draft和原始Proposal逐条独立保存，人工review另存，无LLM Judge。
- 明确问题：Q06以AFTER_WORK表达tomorrow night，编译器按既有17:30–22:00策略执行，首错Proposal；Q14同时text=no spicy food与NEGATIVE，违反文本不带否定的现有约定，未运行下游所以不声称结果实际反转；Q04在target.query额外加入dinner（原句going out）。
- 未直接判错的待讨论项：Q02饮酒SOFT/Q16饮酒HARD可能与句子主目的不同有关，不证明随机波动；Q03/Q05的night仅在query，无TIME_WINDOW，但未完全丢原意或编造钟点；近似预算Q07/Q09保留金额/可略超文本，没有数值容差执行政策；部分片段无TARGET，目标分类及独立after-work适配条件待明确。first-date隐含人数与场景强度不套旧有争议Gold计算总分。
- 明确边界正确：Q19仅人数CORRECT=4且Shibuya/包间偏好保留；Q20移除原POSITIVE SOFT包间criterion，4人/Shibuya保留，没有把取消偏好误成禁止包间。显式must/nice/only、可数人数和开放群体等结果详见逐例表。
- USER_SUPPLIED_20_QUERY_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false；每例仅一次，非稳定性或一般成功率估计。无Google、Browser、Replay、Controlled Live-write，外部副作用计数NOT_MEASURED；未提交/推送。证据：[报告](../../.eval-artifacts/user-20-semantic-2026-09-16/REPORT.md)、[完整20条输出](../../.eval-artifacts/user-20-semantic-2026-09-16/RESULTS.md)。

## TEST-2026-09-16-BROWSER-AGENT-P0-P4 — offline shared executor verification

- 模式：本地 Unit/Contract、真实 Chromium + 拦截合成 HTML、Mock Application/Router/Domain/Evidence/Web composition；不是 Replay、真实模型、Live Read-only或Controlled Live-write。未读私有 Holdout，未改Gold。
- `node --import tsx --test src/infrastructure/browser/browser-action-decision.test.ts src/infrastructure/browser/browser-task-executor.test.ts`：15/15通过。覆盖`browser_read_action@2` strict decoder、当前观察引用、checkbox明确状态、range单步、region scroll，以及既有预算/取消/stale target边界。
- `npm run test:browser:fixture`：9/9通过。真实 Chromium 的 local fixture 验证 modal 阻挡背景日历、selected/value 与 options 分离、checkbox/range/scroll 后置状态；另保留 Local/Cloudflare session 的`dom:`引用解析。所有页面由本地拦截提供，不访问外网或提交预约。
- `npm test`：344/344通过，0 fail/skip/todo；当前 H001–H005 使用真实内部 Router/Reducer/Context/Grounding/来源组合和独立 evaluator，外部模型/HTTP/页面为替身。`npm run typecheck`、`npm run arch:check`（0 forbidden dependencies）、`npm run build`、`git diff --check`均通过；`npm run eval:restaurant:semantic:fixture`为15/15，但分类仍是`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。
- 未运行 P3：没有本轮模型调用、Google请求、真实商户、真实网页、Live artifact、预约/付款/取消写操作或独立 Review。B2、B6–B10、B13–B14 的未覆盖范围和逐项状态见 [P0–P4交付记录](BROWSER-AGENT-RESTAURANT-P0-P4-DELIVERY-2026-09-16.md)。

## TEST-2026-09-16-SEMANTIC-PROMPT-11 — offline gates and real-model semantic-only batch

- Prompt@11 / schema@3 / output5000 / temperature0 / thinking disabled / timeout10sec；生产语义链保持Interpreter→Compiler→Runtime/Reducer。原始H001–H005、原H001复杂变体与Gold未改；4条新合成对照及其期望在模型运行前保存。引用固定参考时刻2026-09-16T02:18:29.638Z，不是当前餐厅库存Live。
- 离线typecheck、arch:check、完整Mock343/343、build及semantic fixture15/15通过。只迁移既有prompt版本断言，未新增镜像prompt措辞测试、未修改语义评分门槛或浏览器。当前版本@11不代表语义质量通过。
- 真实模型批次34ed3864：10条输入，预设最多20调用（沿用schema尝试上限），实际10调用、无重试、17327ms；10条均PROPOSED，独立人工对预登记字段/条件语义审查5满足/5不满足。input47525/output3907/total51432 tokens，无usage缺失，费用未知；全部来源ports不可执行且未被调用，无Google/Browser/Agent决策。
- 满足：H001/H002/H004/H005及开放群体对照。H002推断2人、近似10000 SOFT、first-date SOFT、排除项HARD；开放群体不虚构人数/时间。H003饮酒和团餐适配均SOFT代替HARD，缺单独after-work适用性（时间/原词/10人仍正确）；复杂H001饮酒仍SOFT。两个新对照near Ueno/Akasaka关系词丢失；家庭对照虽正确数4人/vegan HARD，却多提取budget is flexible正向SOFT条件。
- 评分为独立人工语义审查，原始执行与evaluation.json分开；未调用LLM Judge，也未把@13网站证据评分器套用到语义-only。H003的after-work重复语义要求是原有契约，非新增标注；同义表达人工核对不改Gold。新的对照无@10基准，不能称@11引入回归；H002/H003旧500预算结果与当前同时改变prompt/预算，因果混淆；复杂H001旧5000预算对照下饮酒强度仍未改善。
- 分类EXPOSED_DEVELOPMENT_SEMANTIC_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false，5/10不外推一般成功率。未读/运行私有Holdout、无Replay/浏览器Live/Controlled Live-write；外部副作用计数NOT_MEASURED，未提交/推送。证据：[完整报告与prompt](../../.eval-artifacts/semantic-prompt-11-2026-09-16/REPORT.md)。

## TEST-2026-09-16-SEMANTIC-OUTPUT-BUDGET — offline gates and single Live treatment

- 用户授权5000单次输出上限；既有Interpreter请求测试新增5000预算断言，旧实现500!==5000红色证据已保存。实际请求及当前Eval manifest共用导出常量。Prompt文本@10、schema@3、模型、temperature0、thinking disabled、10秒timeout与重试保持不变；不读取/运行私有Holdout，不改历史artifact或原五例Gold。
- 本次离线typecheck、arch:check、npm test343/343（0fail/skip/todo）、build、semantic fixture15/15通过；复用未受影响的此前Chromium7/7，不冒充本次重跑。没有新增测试套件，预算断言归入原Interpreter请求契约测试。
- 与500-token变体完全同输入/预登记期望，以独立快照运行一次Live，ede11126；UTC02:18:29开始，336966ms，10步，10候选，END_READ/NO_VERIFIED_RESULT。语义调用2179ms，input4459/output520/total4979 tokens，TOOL_CALLS正常返回；输出大于此前500上限，直接支持预算缺口已在本例解除，但不证明所有复杂输入均足够。
- 原始Proposal正确保留2人推断、今晚19点/涩谷、omakase HARD、近似15000/date night/private room SOFT；good for drinks仍为SOFT，违反预登记HARD，独立@13 qualified=NO，不能视为语义全通过。Compiler/Reducer未改写该强度。H002/H003未复跑，不把本例结果外推到它们。
- 空位1UNAVAILABLE+9UNKNOWN；来源仍有身份不确定、选择未确认、外部Provider限制；当前终态指出omakase缺少证据，非确认全局无位。评价器因权威请求冲突而排除适用观察，不能解释成实际未搜索。新增条件改变搜索候选，端到端无结果不能归因于输出预算增加。
- Google12（named1/discovery1/details10）；24模型调用（semantic1/Agent10/browser13）共143618 tokens，均有usage，费用未知。只读执行，无Replay/Controlled Live-write、未提交/推送；外部副作用计数NOT_MEASURED。原始执行、独立@13评价、版本/输入hash、红绿和门禁日志：[报告](../../.eval-artifacts/semantic-output-budget-5000-2026-09-16/REPORT.md)。

## TEST-2026-09-16-H001-COMPLEX-VARIANT — single Live Read-only diagnostic

- 用户授权一个H001复杂表达变体；预先固定文本及独立期望，保留涩谷/当日19:00/omakase/实际2人，显式人数改为me and my partner，增加date-night、近似15000日元、饮酒和理想包间。多个因素共同变化，不是单因素因果实验。原五例及Gold保持不变；只在独立冻结实验副本追加h001-complex-variant，明确synthetic exposed development / baselineEligible:false，runner的@3数据标签仅为入口兼容，不把该变体当canonical H001。
- 输入预检PASS：YAML六条、原文物化不变、2人、19:00、5条件；无模型或网络。执行源码与上午成功H001逐文件hash相同（仅副本case YAML不同），prompt@10/schema@3/500-output-token上限/temperature0/thinking disabled均不变；沿用既有离线门槛，本次未重复完整Mock/build。
- 运行2aaf6d09，UTC02:00:45开始，2331ms，单次DeepSeek语义调用延迟2299ms；MALFORMED_RESPONSE/STRUCTURED_OUTPUT_SHAPE，finish_reason=length; tool_calls=1。MODEL_FAILURE，无完整Proposal、无状态事件/Agent轨迹，GOOGLE_BROWSER_AGENT_NOT_REACHED；runner退出码1，无补跑。usage未保存，tokens及费用未知，不能记0或声称实测正好500。
- 与原H001的318输出tokens成功及H003同类length错误对照，确认截断在更复杂H001也会出现。本次未判断H002式人数/近似预算/条件强度错误，未证明一般因果或成功率；未提高预算验证反事实。原始执行及独立@13评价分别保存，评价不能把未到达阶段当验收通过。
- 无新增Replay、Controlled Live-write、产品代码或Prompt修改、提交、推送；未到浏览器/Google/写链路，外部副作用计数NOT_MEASURED。证据：[REPORT](../../.eval-artifacts/h001-complex-variant-2026-09-16/REPORT.md)，同目录计划、变体Gold、provenance、预检、原始执行/独立评价及核验。

## TEST-2026-09-16-H001-H005-LIVE-RERUN — Live Read-only and offline diagnostics

- 用户明确授权复跑H001–H005，五条原文各执行一次，没有自动补跑。a093764+已有修复的src/web-skills冻结快照与昨晚最后H003执行源码一致；运行后根目录及快照源码hash未变。LOCAL_CHROMIUM临时会话，10候选/30步/Google100次/20分钟既有预算。Tokyo 10:18–10:23执行，H001当日19:00及H004当日12–17点均未过期；H005“现在”仍物化为执行起点10:19，后续精确分钟过期风险未排除。
- Mock预检：当前development内部composition 6/6通过（五例+父套件）；昨晚完整Mock343/343、Chromium7/7、typecheck/arch/build因相同源码复用，本次没有重跑这些完整门槛。无新增Replay。
- H001 `6f04cb04`：45465ms/3步，10发现/3空位检查，Google2，6模型调用/31172 tokens；TableCheck观察到鮨匠一石三鳥当日19:00/2人slot，PRESENT_RESULTS，独立@13 qualified=YES。实际日期操作成功，人数默认2，不证明自定义人数控件修复；slot为运行时观察，有效期已在原始证据中保存。
- H002 `d29da2ba`：3112ms/1步，Google0，2模型调用/7489 tokens，NEEDS_INPUT；原始Semantic Proposal漏人数推断、近似预算变硬上限、first-date SOFT变HARD，qualified=NO。尚未触及浏览器。
- H003 `4f497632`：1790ms，1次语义调用FAILED，finish_reason=length/tool_calls=1，MALFORMED_RESPONSE后MODEL_FAILURE。当前语义maxOutputTokens=500；无Google/浏览器，无usage（不能计0）。本次未重新验证昨晚good for drinks条件或下拉框问题。日志成功记录response model、失败记录configured model，名称差异不构成换模型证据。
- H004 `c5888de9`：5565ms/2步，Google1，3模型调用/14189 tokens；2家推荐有Google咖啡馆、距离及当日下午营业事实支撑，原始自动qualified=NO。审查发现SOFT同义措辞导致applicableRequest=false，实际证据观察被误排除。单独OFFLINE_SYNTHETIC_COUNTERFACTUAL只在复制artifact中归一SOFT文本即全项SATISFIED，删除HARD证据负向对照不通过；原始artifact哈希不变，Gold/源码/原始评价均未改。此实验不是Live验收替代，不计自动2/5成功，也不证明主观聚会氛围。
- H005 `6136466d`：221649ms/8步，9候选各一次事实和空位检查，Google10（1 discovery/9 details），25模型调用/103551 tokens，NO_VERIFIED_RESULT，qualified=NO。TableCheck9身份不确定；Tabelog7身份不确定/2外部Provider限制；所有空位UNKNOWN。候选含food court等聚合实体；官网7次尝试中3读取失败、4结构化身份未核实，2候选无URL。正向local food事实缺失、官网共享2次模型预算及逐页诊断不足仍在。本次无重复读取、无实际下拉框失败、无步数耗尽；不证明调查充分或确实无位。
- 原始自动评价仅H001合格。历史对照受代码、目标契约、时刻和候选差异影响，仅描述性比较；不能把更快失败/更少调查等同成功率提升。数据restaurant-read-development@3 / acceptance@2 / evaluator-rubric@13 / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false，非Clean Baseline。
- 共37模型调用（36成功/1失败），已记录至少156401 tokens（input150029/output6372），Google13；执行耗时合计277581ms，串行墙钟约279555ms。费用未知，H003usage缺失。全部runner退出且自有进程组无残留；未进入受控预约/支付写链路，实际外部副作用计数仍NOT_MEASURED。无Controlled Live-write、产品代码修改、提交或推送。
- 证据及完整归因：[REPORT](../../.eval-artifacts/h001-h005-live-2026-09-16/REPORT.md)，同目录含计划、源码provenance、五例日志、comparison、离线反例及post-run verification；原始started/result和@13 sidecar保存在restaurant-hybrid-live-read目录。

## TEST-2026-09-15-H003-LIVE-AND-CONTROL-REPAIR — Live Read-only and offline regression

- 用户授权Mock后运行Live。选择未过期的H003原文，当前Tokyo参考时刻物化2026-09-18/17:30–22:00/10人，显式东银座评估点；候选上限10、Agent30步、Google100次、自动调查20分钟，LOCAL_CHROMIUM临时headless会话，不开启人工验证。两次运行都保存不可覆盖的started/result及独立@13 evaluation。当前数据restaurant-read-development@3 / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false；不是Clean Baseline。
- 首轮`f7e969d3`：TERMINAL/NO_VERIFIED_RESULT，284490ms，10步、10候选事实+空位检查、Google11（1 discovery/10 details）、22次DeepSeek（1 semantic/10 agent/11 browser）、146326 tokens。三次真实SELECT_AUTHORITATIVE将dom引用送给CSS解析器；TableCheck本地接线故障不能解释为站点不可访问。网站9次身份不确定/1次读取失败；所有空位UNKNOWN。
- 原有Chromium Harness补同一参数化场景（Local与Cloudflare session，远程连接替换为本地Chromium），保留真实Executor/DOM，仅替换模型传输和网络。修复前原5条通过、新2条失败；修复两种session的fill/select引用查找后7/7。完整npm test343/343、0 fail/skip/todo；typecheck、arch:check（0 forbidden dependencies）、build通过。真实Cloudflare远程服务未调用；HTML为Synthetic，不是Replay。
- 修复后唯一追加轮`e60abc02`：TERMINAL/NO_VERIFIED_RESULT，316186ms，仍10步/10候选/Google11/22次DeepSeek，154606 tokens。dom CSS错误已消失，但5个人数控件实际是自定义combobox，被错误当原生select而失败。该控件类型缺口仍未修复；本地原生select Fixture通过不证明自定义控件已支持。网站10次身份不确定；所有空位UNKNOWN。每轮Tabelog均8次外部预约Provider限制/2次身份不确定。
- 两轮独立诊断均qualified=NO、systemBehavior=NOT_SUPPORTED；AUTHORITATIVE_CONDITIONS和COMPLETION_OUTCOME为NOT_SATISFIED，调查重复核验及资源记录SATISFIED，一般调查充分性NOT_EVALUATED。真实原始Semantic Proposal已将good for drinks从HARD降为SOFT，并缺after work适用性criterion；Compiler/Reducer保留该Proposal，时间原词/宽窗仍存在，不能误报为日期/人数丢失。诊断中的“无适用请求的discovery”源自条件不一致，不代表没有实际Google搜索。
- 对照9月14日H003（285464ms、30步、Google50、33模型调用/215478 tokens、STEP_LIMIT/FAILED、0空位检查），当前到达了10个空位检查并正常有界结束，但未提升合格结果数、未变快；原文哈希相同，历史Prompt/目标/时段、候选及外部状态不同，仅为描述性对比。历史执行不覆盖，另存@13补评。
- 两轮共44次DeepSeek、300932 tokens，显式费用输入缺失，cost=NOT_MEASURED；未执行预约、支付或其他受控外部写链路，实际副作用计数仍NOT_MEASURED。没有第三次Live、私有Holdout、Cloudflare服务Live或新增Replay。证据目录`.eval-artifacts/terra-live-review-2026-09-15/`包含计划、运行前后patch/hash、对照JSON、红绿/Mock/build日志及报告。修改未提交、未推送。

## TEST-2026-09-15-TERRA-REVIEW-REPAIR — Mock source composition and independent diagnostics

- 基线a093764；已保存旧源码下的红色证据：官网刷新失败仍PRESENT_RESULTS、Evaluator将其判为SUPPORTED_BY_EVIDENCE、关门后Context仍openingHoursMatch=true。三处均在预期业务断言失败，正常首次展示作对照。扩展Google在复合读取起点失败的反例后，又关闭了Evaluator遗漏EXECUTION_FAILURE来源观察的问题。
- 原H001–H005自定义search/facts/availability ports已退役；测试现在使用真实GooglePlacesClient/GooglePlacesRestaurantSearch、Google→官网→判断组合、LiveBrowserAvailability/TableCheck/AvailabilitySourceResolver，保留Interpreter/Compiler/Runtime/Context/Validator/Router/Grounding。只替换模型传输、HTTP与Browser页面，未计划调用仍失败；无手工State或合格Evidence注入。旧CONCRETE-VISIT条目中关于五例已具完整来源组合和独立诊断的表述，由本条纠正；旧结果仅证明当时内部链。
- 五例从未修改的YAML原文进入；补齐替身原先遗漏的SOFT条件后，五例AUTHORITATIVE_CONDITIONS均SATISFIED。H001/H003实际slot、H004官网营业事实推荐的qualified=YES；H002实际UNAVAILABLE、H005缺负向HARD证据的qualified=NO且NO_VERIFIED_RESULT。两者COMPLETION_OUTCOME仍NOT_EVALUATED：当前诊断器不自动证明非空候选调查充分性。不能报告“5/5用户目标完成”。
- 完整`npm test`为343/343、0 fail/skip/todo，约14.9秒；typecheck、arch:check（0 forbidden dependencies）、build通过。语义fixture15/15、搜索fixture3/3、本地Chromium fixture5/5。真实浏览器fixture只证明本地页面/控件契约。
- 完整Mock首次自动权限审核超时未执行；获准重试后运行成功。该超时不是产品或安全失败。测试未加载.env、未运行付费模型/真实来源/Live、真实PostgreSQL或任何外部写入。
- 证据保存在本地忽略目录`.eval-artifacts/terra-repair-2026-09-15/`：red/green日志、五例分离的`.mock.result.json`/`.mock.evaluation.json`及修复报告。对审查时旧错误artifact另存@13补评，不改写原始执行或@12结果。这些均为exposed synthetic development diagnostics，不是Clean Baseline或Replay。


## TEST-2026-09-15-CONCRETE-VISIT-READ-CLOSURE — offline execution and diagnostic verification

- 红色证明先于修复：`Availability keeps its delivery goal while candidate discovery waits only for discovery inputs` 在旧 Validator 上被错误拒绝；将 `END_READ` 的 Router `TERMINAL` observation 送入旧诊断器得到 `NOT_EVALUATED`。两项均有正常对照，失败归因于待修的产品/评分契约而非替身或类型错误。
- 当前实际 composition 的定向套件为 99/99：从 H001–H005 YAML 原文进入 Hybrid 初始化，保留 Interpreter、Compiler、Runtime/Reducer、Context、Validator、Router、Grounding 与独立诊断；固定模型和来源计划只按原文匹配，未计划调用立即失败。H001/H003 得到当前 slot，H004 得到事实推荐，H002/H005 分别得到有依据的无结果与未核实结果，不注入中间 State 或合格 Evidence。
- 默认离线套件在获准本机 loopback fixture listener 环境为 `npm test` 339/339，0 failed/skip/todo。首轮受限沙箱的 listener `EPERM` 与产品失败分开记录；其中唯一产品回归是 Harness 仍断言 Context `@5`，已更新为当前 `@6` 合约后重跑通过。
- `npm run typecheck`、`npm run arch:check`（0 forbidden source dependencies）、`npm run build`均通过；`npm run eval:restaurant:semantic:fixture` 为 15/15，明确分类为 `DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`，不作为模型质量 Baseline。
- `npm run test:browser:fixture` 在受限沙箱被 Chromium Mach-port 权限阻断，获准本机受控权限后为 5/5；只访问本地 fixture，覆盖通用模型驱动的无站点专用适配读取，不访问外部网络或执行提交。新增/更新的覆盖归入既有 action-validator、grounding、Context、diagnostic 和 Harness 测试；当前 H001–H005 离线组合为唯一新增实际入口覆盖，未保留重复执行器。
- 未运行付费模型、真实网站/来源、Hybrid 或 Web Live、真实 PostgreSQL、预约、支付、取消、登录或任何外部写入。离线结果不证明自由文本模型选路、当前 DOM 兼容性、实时库存、搜索穷尽或一般调查充分性。

## TEST-2026-09-15-READ-ACCEPTANCE-ALIGNMENT — current development contract (superseded in part by the concrete-visit closure above)

- 范围：实际当前YAML loader → relative-time materializer → 独立diagnostic evaluator的AUTHORITATIVE_CONDITIONS维度；固定2026-09-16T03:00Z，五例分别采用独立编写的请求预期，完整错误goal反例不得通过。没有把Gold复制成模型响应，也未执行模型/来源或声明结果证据合格。
- 数据保护：旧YAML SHA-256固定核验，五例content与归档逐条相等；当前文件只有一份semantic参数预期。额外反例证明日期/时钟物化不修改原始用户消息里的相同字面值。合成空位Evaluator fixture改用独立名称，不再冒充当前H001。
- 定向materializer + evaluator：47/47。完整默认`npm test`初次因沙箱不允许127.0.0.1监听失败；获准同命令在本机listener环境重跑后328/328、0 failed/skip/todo。typecheck、arch:check、build、diff检查通过；7份相关文档链接核验无缺失。
- 未覆盖：真实模型理解和自由文本等价、来源调查、完整推荐质量与Live；原有END_READ/负向证据诊断缺口不在本轮修复。完整错误goal反例补足空位参数以隔离goal冲突；当前Evaluator对另有缺记录的混合错误可能返回NOT_EVALUATED，不声称可精确定位全部语义首错。
- 无Live、付费模型、真实网站、外部写入、提交或推送；未重跑历史artifact或更改历史评分。浏览器执行未改，因此未另跑Chromium fixture。

## TEST-2026-09-15-SHARED-READ-EXECUTION-REPAIR — offline regression closure

- 用户审查后的防线定向命令`node --import tsx --test src/eval/restaurant/agent-loop/hybrid-read-composition.test.ts src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts`先以56通过、9失败确认残余均为业务红色。修复候选 oracle、观察 lineage 和变异辨别力后，再修共享执行；最终该定向命令为65/65。
- 最终定向：Hybrid + Evaluator为65/65；`read-grounding.test.ts`为13/13。覆盖请求更新不被去重、跨批/顺序累计、Google耗尽后的browser可达性、候选间来源范围、UNKNOWN slot保留独立事实，及独立候选截断、轨迹候选/日期篡改、search-only事实推荐等反例。
- `npm run typecheck`、`npm run arch:check`、`npm run build`和`git diff --check`通过。获准本机loopback监听环境，最终默认`npm test`为325/325，0 failed、0 skip/todo。未运行付费模型、真实Google/网站、浏览器Live、数据库部署、预约或其他外部写操作。

## TEST-2026-09-15-FIVE-CONTRACT-COMBINATORIAL-DEFENSE — initial offline integration and evaluator (superseded by the repair entry above)

- 基线（业务未改前）`hybrid-read-composition.test.ts` + `diagnostic-evaluator.test.ts`为31通过、7失败；7项均为既有Hybrid业务回归。扩展后定向运行`npm run typecheck && node --import tsx --test src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts src/eval/restaurant/agent-loop/hybrid-read-composition.test.ts`为51通过、9失败、0 skip/todo：新增两项红色入口分别为重复semantic event id导致请求更新失效，以及固定种子发现并最小化的跨批累计缺陷。随后独立审查发现候选oracle、observation lineage与部分变异的命名/实际破坏不充分；这些初始结果不作为验收，已由上方修复条目替代。
- `node --import tsx --test src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts`为37/37。成对正反artifact控制验证条件保真、候选/来源/请求/时效归属、UNKNOWN不伪装为无位、真实执行记录与提前结束；M01–M08均被相应断言拦住。M01–M02在`/tmp`隔离源码副本执行，正常对照先通过；M03–M08仅变异`structuredClone`公开样本，未覆盖历史artifact。
- `npm run arch:check`、`npm run build`和`git diff --check`通过。获准本机loopback监听环境，最终默认`npm test`为320项：310通过、10失败、0 skip/todo；失败项为8个既有执行回归、请求更新event-id错误及同一状态累计根因的随机独立复现。首次受限沙箱的监听`EPERM`单独归为环境限制，不作为产品失败。
- 未运行付费模型、真实Google/网站、浏览器Live、数据库部署、预约或其他外部写操作；测试替身不证明自由文本理解、真实页面兼容性、实时库存、搜索穷尽或一般调查充分性。

## TEST-2026-09-12-WEB-READ-INTEGRATION-CLOSURE — offline integration

- 先运行冻结复现脚本（真实内部Router/Application/Reducer/Grounding，外部来源与模型为离线边界）：基线四项均失败，分别为浏览器取消与deadline的`unhandledRejection`、后台版本变化没有Case通知导致编辑stale、刷新后展示仍引用旧事实、无日期事实推荐被Eval错误要求availability。保留其同时确认的既有正确行为：事实推荐可展示，刷新后的关门或`UNKNOWN`不会复用历史成功。
- 修复后复现均通过：取消/deadline两个分支`unhandled=[]`；后台由版本1推进到2时通知1次，按版本1编辑被接纳；成功→新成功只引用当前事实；无日期推荐在`PRESENT_RESULTS`后独立诊断为`taskProducedQualifiedResult=YES`/`REQUIRED_EVIDENCE=SATISFIED`。这些是离线集成结果，不是来源Live。
- 新增现有`src/server/local-web-server.test.ts`中的两类HTTP/SSE回归：W08从真实Web取消流程写出不可变`WEB_READ` result并由同一Evaluator写出sidecar；W09先接收`SEARCHING` SSE推进，再以创建时用户版本编辑需求，验证旧读取取消、更新被接受且新partySize成为权威状态。它们覆盖此前测试没有覆盖的后台进度/version竞争和普通Web artifact接线；没有保留临时复现脚本为第二测试体系。
- 最终离线门禁：`npm run typecheck`、`npm run arch:check`（0 forbidden dependency）、`npm run build`、`git diff --check`均通过；获准本机loopback环境`npm test`为`259/259`；真实本地Chromium动态Fixture为`5/5`。受限沙箱首次不能绑定`127.0.0.1`（`EPERM`）；获准本机loopback环境重跑后通过，未访问外部网络。Live/付费模型/外部来源、真实PostgreSQL、预约/付款/登录/取消及push均未运行。

## 2026-09-05 — Draft repository improvement plan: documentation-only verification

- 范围：新增[Repository Improvement Plan](../REPOSITORY-IMPROVEMENT-PLAN.md)、INDEX入口和本次DEVLOG/TEST-LOG记录；整改项仍为`draft / not integrated`。
- 前序静态Review：43份当前文档/入口无失效相对链接；现有测试文件均被npm test路径规则匹配。这不代表测试已运行或功能通过。
- 本次交付检查：核对新清单链接、14个工作项及其索引；检查本次diff空白与原有未提交改动保留情况。
- Mock/Unit、Replay、build、Live Read-only、Controlled Live-write及付费模型Eval均未运行：本次仅整理文档，没有代码或测试行为变更。未修改人工标注、Golden Set、私有数据或已有artifact。

## 2026-09-04 — Eval-only Tabelog explicit human challenge resume experiment

### Scope

仅开发/eval的LOCAL_CHROMIUM headed persistent profile和Tabelog manual challenge pause。没有产品Desktop/Mobile surface、stealth、CAPTCHA自动化、预约或写路径变更。

### Checks

- Focused Browser Runtime、factory、Tabelog adapter、source resolver和Router tests：通过`27/27`。覆盖headed persistent context/profile关闭、缺失browser binary的稳定失败、`USER_INTERVENTION_REQUIRED`、浏览器在pause期间保持打开、同一session/page恢复、无自动search retry、challenge仍在时fail closed、challenge清除后继续既有identity/availability读取。
- `npm test`：在允许本机HTTP/SSE fixture listener的环境中通过`159/159`，0 failed。首次沙箱运行仅7个本地server测试因`listen EPERM 127.0.0.1`失败；其余152项及本次focused均通过，随后同一命令在受控本机listener环境完整通过。
- `npm run typecheck`、`npm run arch:check`、`npm run build`和`git diff --check`：通过；Architecture check为0 forbidden dependency。

### Live Read-only

在离线门禁后仅运行一次：`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM PRAXIS_LOCAL_CHROMIUM_INTERACTIVE=1 PRAXIS_EVAL_ALLOW_TABELOG_MANUAL_INTERVENTION=1 npm run eval:restaurant:agent-loop:hybrid-live-read -- --case h001`。Semantic Interpreter在第一步返回`MODEL_FAILURE`，runner在Google discovery、Browser launch、Tabelog或人工暂停之前退出，因而无新的artifact。没有外部写、Authorization、Booking、payment、cancellation或PII submission；此结果不证明真实challenge能被恢复。

## 2026-09-04 — H001 TableCheck→Tabelog source-chain verification

### Scope

Restaurant-only deterministic TableCheck-first/Tabelog-fallback read chain、TableCheck HIGH outlet identity and explicit slot grounding、provider failure isolation and 403 attribution。没有改变Agent action、HARD evidence、预约或其他写路径。

### Checks

- Focused source resolver、TableCheck adapter、Tabelog adapter、Grounding与Router tests：通过`33/33`。覆盖确定性优先级、TableCheck failure→Tabelog fallback、Tabelog `BOT_CHALLENGE`仍为provider-level、所有来源耗尽fail closed、exact phone/name+address、name-only拒绝、显式slot、无click/fill/submit、TableCheck 403不伪报identity以及所有来源相同browser failure的内部terminal处理。
- `npm test`：通过`156/156`，0 failed（获准localhost fixture listener环境）。
- `npm run typecheck`、`npm run arch:check`（0 forbidden source dependencies）、`npm run build`和`git diff --check`：通过。

### Modes and external effects

仅在完整离线门禁后运行一次`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM npm run eval:restaurant:agent-loop:hybrid-live-read -- --case h001`。artifact为`2026-09-04T08-32-54-786Z-h001.json`：Google Discovery为10个候选，Agent在同一个`CHECK_AVAILABILITY`中检查前三个；每个候选先收到TableCheck `403 Forbidden`，后收到Tabelog `Just a moment...`，最终`NEEDS_INPUT / WAITING_USER`和`AVAILABILITY_SOURCES_EXHAUSTED`。未获得同Outlet HIGH identity、availability或`PRESENT_RESULTS`。之后只做离线403归因修正，未重跑H001。没有Authorization、预约、付款、取消、个人信息提交或其他外部写操作；artifact的`sideEffects`全为0。

## 2026-09-04 — H001 identity diagnostics and Tabelog challenge attribution

### Scope

Eval-only Google→Tabelog identity diagnostic retention and correct fail-closed attribution of browser-visible Tabelog anti-bot challenges. No change to HIGH identity policy, availability semantics, H001 HARD evidence or any write path.

### Checks

- Focused Tabelog adapter and read-grounding tests: passed `19/19`. Covers search/detail/canonical diagnostics, JSON-LD/DOM/tel provenance, normalized phone conflict reporting, challenge-query sanitization, `Just a moment...` recognition and `BOT_CHALLENGE` grounding precedence.
- `npm test`: passed `146/146`, 0 failed (in the approved localhost-listener environment).
- `npm run typecheck`, `npm run arch:check` (0 forbidden source dependencies), `npm run build` and `git diff --check`: passed.

### Modes and external effects

One and only one `PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM npm run eval:restaurant:agent-loop:hybrid-live-read -- --case h001` run occurred. Artifact `2026-09-04T08-00-55-386Z-h001.json` showed successful Google discovery and a local browser reaching Tabelog, but all three search pages were the Cloudflare `Just a moment...` challenge before any result or detail page could be parsed. The run ended `NEEDS_INPUT / WAITING_USER`; it did not prove HIGH identity, availability evidence or `PRESENT_RESULTS`. No Authorization, booking, payment, cancellation, PII submission or other external write occurred.

## 2026-09-04 — Local Playwright Chromium runtime verification

### Scope

新增仅开发/eval的`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM` BrowserRuntime；保持Cloudflare AUTO/Kitesurf/Chromium选择、Tabelog逻辑、HARD evidence和所有写路径不变。

### Checks

- Focused Browser Runtime/Tabelog checks：通过`16/16`。覆盖LOCAL选择不要求或构造Cloudflare、AUTO/KITESURF/CHROMIUM继续为Cloudflare、local session的snapshot与page/context/browser cleanup，以及launch失败到`BROWSER_RUNTIME_FAILED`的映射。
- `npm test`：通过`142/142`，0 failed（获准本机listener环境）。
- `npm run typecheck`、`npm run arch:check`（0 forbidden source dependencies）与`npm run build`：通过。

### Modes and external effects

首次isolated local probe因缺少Playwright Chromium binary明确失败；安装binary后发现并修复裸`chromium.launch`丢失BrowserType绑定的问题，focused tests仍为`16/16`、完整基线仍为`142/142`。修复后的`example.com` probe成功启动、导航、读取`Example Domain`并关闭。本轮随后只运行一次`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM npm run eval:restaurant:agent-loop:hybrid-live-read -- --case h001`，artifact为`2026-09-04T07-35-19-762Z-h001.json`：Google Discovery成功，三次Tabelog read带`LOCAL_PLAYWRIGHT_CHROMIUM` metadata、总耗时约6.3秒，均为真实`ENTITY_MATCH_UNCERTAIN`；没有HIGH identity、availability evidence或`PRESENT_RESULTS`。没有Cloudflare访问、Authorization、预约、付款、取消、个人信息提交或其他外部写操作。

## 2026-09-04 — H001 browser attribution and fail-closed terminal handling

### Scope

只修复Cloudflare Browser Run会话建立失败被误分类为`ENTITY_MATCH_UNCERTAIN`，以及所有候选同一浏览器基础设施失败后Agent向用户提问的路径；不放宽Google→Tabelog HIGH identity、HARD evidence或任何预约/写路径。

### Checks

- Focused grounding、Tabelog adapter、Router与Harness tests：通过`39/39`；覆盖browser startup reason保留、metadata可观察性、共享browser failure的terminal Router标记及无`ASK_USER`的`FAILED`结束。
- `npm test`：通过`138/138`，0 failed（首次沙箱运行仅因127.0.0.1 listener受限，使用获准本机权限重跑通过）。
- `npm run typecheck`、`npm run arch:check`（0 forbidden source dependencies）、`npm run build`与`git diff --check`：通过。

### Modes and external effects

仅运行一次`npm run eval:restaurant:agent-loop:hybrid-live-read -- --case h001`，artifact为`2026-09-04T01-35-21-558Z-h001.json`。Semantic与Agent决策成功；两次Google Discovery在8秒deadline超时，第三次为Google搜索预算耗尽，最终`NEEDS_INPUT / WAITING_USER`。没有候选、Browser session、Tabelog搜索/详情页、availability evidence或`PRESENT_RESULTS`，因此不能把identity修复报告为真实页面成功。没有Authorization、预约、付款、取消、个人信息提交或其他外部写操作；`sideEffects`为0。

## 2026-09-03 — H001 identity, area and no-progress offline verification

### Scope

Google structure-backed `near Shibuya` grounding、Tabelog relative/canonical page identity enrichment和重复availability read拒绝；不改变HARD evidence门槛、预约或其他写路径。

### Checks

- Focused tests：通过`43/43`。覆盖relative Tabelog result URL、门店页电话/地址提取和exact-phone HIGH identity；结构化Google address component area evidence与格式化地址关键词拒绝；重复candidate availability action在Router之前被拒绝。
- `npm test`：通过`134/134`，0 failed（允许localhost fixture listener）。
- `npm run typecheck`、`npm run arch:check`（0 forbidden source dependencies）与`npm run build`：通过。

### Modes and external effects

以上离线验证覆盖Unit、Contract、Fixture、Mock Harness、Embedded PGlite和local HTTP/SSE。随后仅运行一次`npm run eval:restaurant:agent-loop:hybrid-live-read -- --case h001`：Semantic与4次Agent decision均HTTP 200；两次Google Discovery在Router的8秒deadline失败，第三次为`GOOGLE_SEARCH_BUDGET_EXCEEDED`，Agent安全地`ASK_USER`并以`WAITING_USER`退出。没有候选、Tabelog读取、Availability Check或`PRESENT_RESULTS`，所以本次不能把离线身份/area修复报告成真实Provider成功。没有Authorization、预约、付款、取消、个人信息提交或其他外部写操作；`sideEffects`为0。

## 2026-09-03 — H001 DeepSeek strict Agent transport verification

### Scope

`restaurant_agent_decide` 的DeepSeek Beta strict function wire compatibility、非2xx安全诊断和canonical `restaurant_agent_action@3`恢复；不改变外部Provider读路径或任何写操作。

### Checks

- Focused tests：通过`10/10`，覆盖全字段required/`additionalProperties:false`的strict wire schema、wire到canonical恢复、无关有效字段fail-closed、Beta endpoint/function strict shape，以及provider非2xx的status/request ID/code/type/脱敏message诊断。
- `npm test`：通过`129/129`，0 failed（在允许localhost fixture listener的环境中）。
- `npm run typecheck`：通过。
- `npm run arch:check`：通过，0 forbidden source dependencies。
- `npm run build`：通过。
- `npm run eval:restaurant:agent-loop:hybrid-live-read -- --case h001`：仅执行一次真实Live Read-only。Semantic与6次`restaurant_agent_decide`均为HTTP 200；模型问题已越过。Google Discovery完成10个候选；首次Tabelog availability对前3个候选均fail closed为`ENTITY_MATCH_UNCERTAIN`，后续重复检查触发`READ_BUDGET_EXCEEDED`，最终为`STEP_LIMIT / NEEDS_INPUT`，未进入`PRESENT_RESULTS`。

### Modes and external effects

Unit、Contract、Fixture、Mock Harness、Embedded PGlite和local HTTP/SSE均通过；另有一次真实模型、Google Places与Tabelog/Browser read-only运行。该运行没有Authorization、预约提交、付款、取消、个人信息提交或其他外部写操作；`sideEffects`为0。H001仍未完成，其下一项阻塞是可证明的Google→Tabelog门店身份匹配，而非DeepSeek模型调用。

## 2026-09-03 — H001 read-only completion hardening verification

### Scope

`restaurant-state@10` search-only completion, Google hard deadline, Tabelog slot-level availability and identity grounding, HARD evidence gates, and the opt-in H001 Hybrid runner. No booking action is in scope.

### Checks

- Targeted Domain/Google/Tabelog checks: passed `12/12`, including non-cooperative fetch and non-resolving response-body deadlines, prose-time rejection, HIGH-only branch resolution/conflicting-phone rejection, and `PRESENT_RESULTS` reducer/outcome behavior.
- `npm run typecheck`: passed.
- `npm run arch:check`: passed with 0 forbidden source dependencies.
- `npm test`: passed `125/125`, 0 failed, using the permitted localhost-only fixture listener. This includes PGlite persistence, Router/Harness, Browser fixture and HTTP/SSE suites.
- `npm run build`: passed.
- `git diff --check`: passed.
- `npm run eval:restaurant:agent-loop:hybrid-live-read -- --case h001`: deliberately fail-closed before any model or provider request because `PRAXIS_ALLOW_LIVE_RESTAURANT_READ` is not `1`.

### Modes and external effects

Unit, Contract, Fixture, Mock Harness, Embedded PGlite and local HTTP/SSE checks passed. The attempted Live Read-only H001 did not start a provider/browser/model request. Current configuration has no active live-read/browser gates and no Google Places or Cloudflare credentials, so a real H001 evidence artifact and `PRESENT_RESULTS` trajectory cannot yet be claimed. No external write occurred.

## 2026-08-20 — Live / Hybrid Restaurant read path verification

### Scope

`restaurant-state@9` read evidence and availability status, Google Places Text Search adapter, Cloudflare Browser Run Runtime, bounded Tabelog read-only executor, Grounding, temporal case materialization, opt-in probe/Hybrid runners and trajectory metadata. No external side effect is in scope.

### Checks

- `npm run typecheck`: passed.
- `npm run arch:check`: passed with 0 forbidden source dependencies.
- `npm test`: passed `121/121`, 0 failed, in a permitted local-listener environment. This includes Google request/FieldMask/location-bias/search-budget/provider-failure/timeout Contract tests, Browser Runtime fallback/abort tests, Tabelog entity/grounding/no-submit/session-budget tests, materializer tests, Router/Harness safety tests, local HTTP/SSE and embedded PGlite migration persistence.
- `npm run test:probes`: passed `8/8`; this is the separate frozen Goal/Scheduler probe suite, not Browser compatibility evidence.
- `npm run build`: passed.
- `git diff --check`: passed.

### Modes and external effects

Only Unit, Contract, Fixture, Mock Harness, local HTTP/SSE and embedded PGlite verification ran. The environment inspection found `PRAXIS_ALLOW_LIVE_RESTAURANT_READ=0`, `PRAXIS_ALLOW_BROWSER_RUN=0`, no Google key, no Cloudflare account/token and no Tabelog probe URLs; therefore no Browser probe, Google Discovery smoke or Hybrid h001 run was attempted. `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1` alone is insufficient and did not make a model request. No real PostgreSQL smoke, model call, Provider call, Browser session, Authorization, booking, payment, cancellation or PII submission occurred. Embedded PGlite does not replace real PostgreSQL verification.

## 2026-08-20 — ADR-0013 Agent Loop final hardening verification

### Scope

Post-authorization Agent resume after `COMMIT_FAILED` / `BOOKING_ABSENT`, fresh proposal and Authorization enforcement, long-lived execution-route naming, sanitized Decision Context trajectory persistence, immutable `0008` migration and Hybrid E2E gate documentation. Semantic conflict gating intentionally remains unchanged. No real platform or external write is in scope.

### Checks

- `npm run typecheck`: passed.
- `npm run arch:check`: passed with 0 forbidden source dependencies.
- `npm test`: passed `100/100`, 0 failed, in a permitted local-listener environment. This includes 17 Restaurant Mock Agent Loop Harness scenarios, 3 Provider Router parameter/deadline scenarios, 15 embedded-PGlite Runtime/Recovery/Migration scenarios and Fixture Web/API/SSE.
- `npm run test:probes`: passed `8/8`; frozen Goal/Scheduler probes remain separate from the current product gate.
- `npm run build`: passed.
- `git diff --check`: passed.
- New Harness coverage proves `COMMIT_FAILED` and `BOOKING_ABSENT` both return through the mandatory chain to an Agent recovery decision, create a different proposal, require a new Authorization and reject an old `proposalId` before Policy/Commit. PostgreSQL coverage proves migration `0008` persists exactly the sanitized `restaurant-agent-context@1`, its schema version and `STRUCTURED_ADAPTER` route. Trajectory assertions exclude Authorization, proposal terms, execution result, evidence and reservation data from the decision context.

### Modes and external effects

Only Unit, Contract, Fixture, Mock Harness, local HTTP/SSE and embedded-PGlite verification ran. The first sandboxed `npm test` run passed 93 non-listener tests and could not bind the seven HTTP/SSE fixtures to `127.0.0.1` (`EPERM`); the permitted-local-listener rerun passed the complete `100/100`. No real PostgreSQL smoke, model call, Replay, Live Read-only, Controlled Live-write, real Provider, Browser Agent, Human Takeover, Authorization, booking, payment or cancellation occurred. Embedded PGlite does not replace real PostgreSQL verification.

## 2026-08-20 — ADR-0012 migration integrity and Agent Loop hardening verification

### Scope

Immutable migration recovery, explicit local-only `restaurant-state@7` reset policy, minimal Agent Context projection, bounded Provider reads, BOOK-to-Outcome proposal join and Discovery-only `hasEnough` semantics. No real database reset, external provider or browser automation is in scope.

### Checks

- `npm run typecheck`: passed.
- `npm run arch:check`: passed with 0 forbidden source dependencies.
- `npm test`: passed `98/98`, 0 failed, in a permitted local-listener environment. This includes 16 Restaurant Mock Agent Loop Harness scenarios, 3 Provider Router parameter/deadline scenarios, 14 embedded-PGlite Runtime/Recovery/Migration scenarios and Fixture Web/API/SSE.
- `npm run test:probes`: passed `8/8`; frozen Goal/Scheduler probes remain separate from the current product gate. The new migration tests are current-product tests and therefore do not alter that frozen baseline.
- `npm run build`: passed.
- `git diff --check`: passed.
- PGlite migration coverage proves both the original `0006` `evidence_refs` form upgrades through `0007` and the short-lived already-causal local development form remains readable before `proposal_id` is added. Agent-context coverage proves authorization, proposal, execution, evidence and reservation data do not reach the decision input. Router coverage proves authority-bound availability arguments, cooperative abort and an abort-ignoring Provider deadline.

### Modes and external effects

Only Unit, Contract, Fixture, Mock Harness, local HTTP/SSE and embedded-PGlite verification ran. No reset command was run and no durable development data was deleted. Real PostgreSQL smoke was not run because no explicit writable test-database authorization or configuration was provided; embedded-PGlite does not replace it. No real model call, Replay, Live Read-only, Controlled Live-write, real Provider, Browser Agent, Human Takeover, Authorization, booking, payment or cancellation occurred.

## 2026-08-20 — ADR-0011 Restaurant Agent Loop control refinement verification

### Scope

Restaurant Agent Action Contract、权威Search/Availability参数绑定、Provider/Router/模型失败归因、Loop终止、`SELECTION_REQUIRED` lifecycle、trajectory causal refs、Mock Adapter故障注入、PGlite持久化恢复和对应文档。没有真实平台或浏览器自动化。

### Checks

- `npm run typecheck`: passed.
- `npm run arch:check`: passed with 0 forbidden source dependencies.
- `npm test`: passed `92/92`, 0 failed, in a permitted local-listener environment. This includes 16 Restaurant Mock Agent Loop Harness scenarios, 12 embedded-PGlite Runtime/Recovery scenarios and Fixture Web/API/SSE.
- `npm run test:probes`: passed `8/8`; frozen Goal/Scheduler probes remain separate from the current product gate.
- `npm run build`: passed.
- `git diff --check`: passed.
- New Harness assertions cover Router binding of authoritative read parameters, Provider failure as `SEARCH_FAILED` rather than model failure, `SELECTION_REQUIRED → RUNNING` with no pending user question, and durable timeout / step-limit / rejection-limit state plus trajectory outcomes and causal refs.

### Modes and external effects

Only Unit, Contract, Fixture, Mock Harness, local HTTP/SSE and embedded-PGlite verification ran. No real model call, Clean Holdout, Replay, Live Read-only, Controlled Live-write, real PostgreSQL smoke, Authorization, booking, payment or cancellation occurred. Real PostgreSQL smoke was not run because no explicit writable test-database authorization or configuration was provided; embedded-PGlite does not replace it.

## 2026-08-20 — Repository naming normalization verification

### Scope

Naming/version governance, evidence lifecycle classification, local branch identity, source and Eval path moves, npm Eval entry points, Brainstorming/Superseded archive indexes and Markdown references. No product behavior, Eval content or external integration was intentionally changed.

### Checks

- `npm run typecheck`: passed.
- `npm run arch:check`: passed with 0 forbidden source dependencies.
- `npm run build`: passed.
- `npm run test:probes`: frozen Goal/Scheduler probes passed `8/8`, 0 failed; they remain separate from the current product gate.
- `npm test`: the sandboxed run passed 82 tests and the 7 local HTTP/SSE cases could not bind `127.0.0.1` (`EPERM`); the same command rerun with local-listen permission passed `89/89`, 0 failed.
- `npm run eval:restaurant:semantic:fixture`: passed `15/15`, reported only `DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`.
- `npm run eval:restaurant:search:fixture`: passed `3/3` Fixture cases.
- `npm run eval:restaurant:semantic:holdout:preflight`: Draft Preflight passed with 15 sessions / 25 turns / 0 issues; it did not run a model or restore Clean eligibility.
- Eval JSON/YAML parsing, Markdown local-link validation across 56 files, `git diff --check`, filename/extension scans and stale-name searches passed.
- Strict TypeScript unused-symbol check (`--noUnusedLocals --noUnusedParameters`) passed after removing three unused type imports; no zero-value historical evidence was treated as executable code.

### Modes and external effects

Only static checks, Unit/Contract tests, Fixture/Mock Harness, local HTTP/SSE, embedded PGlite and Draft Preflight ran. No real model call, Complete/Baseline Holdout run, Replay, Live Read-only, Controlled Live-write, real PostgreSQL deployment, Authorization, booking, payment or cancellation occurred.

## 2026-08-19 — Restaurant v18 Agent Loop verification

### Scope

Single-Agent Restaurant action loop, candidate/offer separation, deterministic action validation, trajectory persistence, Fixture Workspace integration, and existing Mock Booking safety controls. Browser automation, Live Providers and E2E scoring are out of scope.

### Checks

- `npm run typecheck`: passed.
- `npm run arch:check`: passed with 0 forbidden source dependencies.
- `npm run build`: passed.
- `npm run test:probes`: `8/8` passed; frozen probes are reported separately from the product baseline.
- `npm test`: `89/89` passed, 0 failed, including 13 Restaurant Mock Harness scenarios, 12 embedded-PGlite Runtime/Recovery scenarios, Fixture Web/API/SSE, semantic boundary tests and Fixture Search.
- `git diff --check`: passed after all code and documentation updates.

### Modes and external effects

Only Unit, Contract, Fixture, Mock Harness, local HTTP/SSE and embedded-PGlite verification ran. No real model call, Clean Holdout, Replay, Live Read-only, Controlled Live-write, real Authorization, booking, payment or cancellation occurred. Embedded PGlite is not evidence of a real PostgreSQL deployment.

## 2026-08-18 — Prompt v7 canonical-Gold exposed regression verification

### Scope

一次受用户授权的Prompt v7真实诊断，使用已暴露的current canonical Gold；不改Gold、Contract、Schema、Scorer或Decision Kernel。它不是Clean Holdout，仅报告与Prompt v6的`COMMON_UNCHANGED_TURNS`比较。

### Checks

- 当前Dataset SHA与v6 artifact均为`9f067e2826e248971c206d379107505e72e3cdff42574eb9730219e71fa6976c`；v6为`COMPLETED` / Prompt `v6`，并含24个可比快照。若SHA不同，Runner会在模型调用前拒绝。
- `npm run typecheck`、`npm run eval:semantic:holdout:preflight:complete`（`READY_FOR_BASELINE`，15 session / 25 turn / 0 issue）、`npm run eval:semantic:fixture`（15/15）、`npm run arch:check`与`npm run build`：通过。
- `npm test`：86/86通过，0 failed；HTTP/SSE使用允许本地监听的环境验证。
- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_CONFIRM_EXPOSED_HOLDOUT_REGRESSION=1 PRAXIS_CONFIRM_CURRENT_EXPOSED_GOLD_VERSION=1 PRAXIS_PREVIOUS_EXPOSED_REGRESSION_ARTIFACT=<v6-artifact> PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=25 DEEPSEEK_MODEL=deepseek-v4-flash npm run eval:semantic:holdout:exposed-regression`：16 successful calls、0 retry、32,892 ms、56,436 reported tokens、cost `NOT_CONFIGURED`。全25 turn为4 pass、12个`SEMANTIC_RESULT`、9个`BLOCKED_BY_UPSTREAM`；归类为`EXPOSED_GOLD_ACCEPTANCE_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。
- `COMMON_UNCHANGED_TURNS`为24个；H007缺少v6可比快照而排除。v6 → v7字段mismatch为criteria text `6 → 8`、polarity `0 → 0`、strength `2 → 2`、date `4 → 4`、timeWindow `1 → 2`、partySize `5 → 2`、area `7 → 8`、decision `7 → 6`。这只是已暴露数据的受限诊断，不是泛化、Baseline或Parser close的质量结论。

### Modes and external effects

Unit、Fixture、Mock Harness和embedded PGlite验证均通过；另有16次付费DeepSeek调用，仅针对已暴露canonical Gold，使用内存Runtime和Fixture Search。没有新的Clean Holdout、真实Discovery、Availability、Authorization、预约、Replay、Live Read-only或Controlled Live-write。

## 2026-08-18 — Prompt v6 canonical-Gold acceptance diagnostic verification

### Scope

一次受用户授权的Prompt v6真实诊断，使用明确保留为canonical的已暴露私有Gold。它不是Clean Holdout，也不与v4 Clean Baseline或v5 Regression作整集比较；仅报告`COMMON_UNCHANGED_TURNS`。

### Checks

- `npm run typecheck`：通过。
- Exposed Regression focused tests：`4/4`通过；Prompt Contract tests：`2/2`通过。
- `npm run eval:semantic:holdout:preflight:complete`：`READY_FOR_BASELINE`，15 session / 25 turn / 0 issue；这是结构门禁，不恢复任何Clean资格。
- `npm run eval:semantic:fixture`：`15/15`通过，`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。
- `npm run arch:check`、`npm run build`和`git diff --check`：通过。
- `npm test`：`86/86`通过，0 failed；HTTP/SSE使用允许本地监听的环境验证。
- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_CONFIRM_EXPOSED_HOLDOUT_REGRESSION=1 PRAXIS_CONFIRM_CURRENT_EXPOSED_GOLD_VERSION=1 PRAXIS_PREVIOUS_EXPOSED_REGRESSION_ARTIFACT=<v5-artifact> PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=25 DEEPSEEK_MODEL=deepseek-v4-flash npm run eval:semantic:holdout:exposed-regression`：完成，16 successful calls、0 retry、35,296 ms、56,986 reported tokens、cost `NOT_CONFIGURED`。全25 turn为4 pass、12个`SEMANTIC_RESULT`、9个`BLOCKED_BY_UPSTREAM`；归类固定为`EXPOSED_GOLD_ACCEPTANCE_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。
- `COMMON_UNCHANGED_TURNS`共有24 turn；1个annotation-changed turn排除。两次均实际评估15个公共turn，exact pass均为3。v5 → v6的mismatch为criteria text `8 → 6`、polarity `0 → 0`、strength `2 → 2`、date `4 → 4`、timeWindow `2 → 1`、partySize `3 → 5`、area `4 → 7`、decision `6 → 7`。这只是已暴露数据的受限诊断，不是泛化或Baseline结论。

### Modes and external effects

Unit、Fixture、Mock Harness和embedded PGlite验证均通过；另有16次付费DeepSeek调用，仅针对当前已暴露canonical Gold，使用内存Runtime和Fixture Search。没有新的Clean Holdout、真实Discovery、Availability、Authorization、预约、Replay、Live Read-only或Controlled Live-write。

## 2026-08-18 — Prompt v5 exposed-Holdout regression verification

### Scope

一次受用户授权的Prompt v5真实回归，仅使用已经`EXPOSED / RESULT_EXPOSED`的私有v4 Holdout。原始Clean Baseline artifact、Gold、Prompt文本、Contract、Scorer与readiness policy不在修改范围。

### Checks

- `npm run eval:semantic:holdout:preflight:complete`：`READY_FOR_BASELINE`，15 session / 25 turn / 0 issue；这只是结构与Gold一致性检查，不使数据恢复Clean资格。
- `npm run typecheck`：通过。
- `npm run eval:semantic:fixture`：15 / 15通过，`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。
- `npm run arch:check`：通过，0 forbidden source dependencies。
- `npm test`：85 / 85通过，0 failed；HTTP/SSE用允许本地监听的环境验证。
- `npm run build`与`git diff --check`：通过。
- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_CONFIRM_EXPOSED_HOLDOUT_REGRESSION=1 PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=25 DEEPSEEK_MODEL=deepseek-v4-flash npm run eval:semantic:holdout:exposed-regression`：完成，16 successful calls、0 retry、37,102 ms、56,122 reported tokens、cost `NOT_CONFIGURED`。全25 turn为3 pass、13个`SEMANTIC_RESULT`、9个`BLOCKED_BY_UPSTREAM`；归类固定为`EXPOSED_HOLDOUT_REGRESSION / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。
- 初版字段诊断重复计数criteria文本不匹配为polarity/strength不匹配。修复分析器后，新增该边界的单测；`npm run eval:semantic:holdout:exposed-regression:analyze <artifact>`在不调用模型的情况下写入`field-analysis-v2` sidecar，保留原始运行记录。v4同口径15 turn的字段差异为criteria text `-1`、strength `-5`、timeWindow `-1`、area `-1`，date `+3`、partySize `+1`、decision `+1`（负号表示v5减少mismatch）。

### Modes and external effects

Unit、Fixture、Mock Harness和embedded PGlite验证均通过；另有16次付费DeepSeek调用，仅针对已暴露私有Holdout，使用内存Runtime和Fixture Search。没有真实Discovery、Availability、Authorization、预约、Replay、Live Read-only或Controlled Live-write。

## 2026-08-17 — v16 open Restaurant Criterion Contract verification

### Scope

Restaurant semantic Contract migration from classified cuisine / hard-constraint / soft-preference arrays to open criteria, plus the dependent Compiler, Reducer, Fixture Regression, Holdout preflight, deterministic scorer and documents. No real model or private Holdout content is in scope.

### Checks

- `npm run typecheck`: passed.
- Focused Restaurant Domain, v16 Eval, Harness, PGlite Runtime and Fixture Search tests: `54/54` passed, 0 skipped and 0 failed.
- `npm run eval:semantic:fixture`: `7/7` exposed v16 Regression Turns passed with `DEVELOPMENT_STAGE_ORACLES`, Regression Dataset `2` and Evaluator `2`; `baselineEligible:false`.
- `npm run eval:search:fixture`: `3/3` passed.
- `npm run arch:check`: passed with 0 forbidden source dependencies.
- `npm run build`: passed.
- `npm test`: `78/78` passed, 0 skipped and 0 failed in a permitted local-listener environment, including HTTP/SSE.
- `npm run test:probes`: `8/8` passed.
- `git diff --check`: passed after all code and documentation updates.

### Modes and external effects

Only Unit, Contract, Fixture, Mock Harness and embedded PGlite verification ran. No DeepSeek or other real model, Clean Holdout, Replay, Live Read-only, Controlled Live-write, Discovery, Availability, authorization or reservation ran. User-owned untracked annotation files were not read or modified.

## 2026-08-17 — v15 strict transport and semantic-equivalence hardening verification

### Scope

Provider-compatible strict Schema constraints, Eval collection/fact semantic equality, deterministic singleton clear-and-set conflict handling, and Clean Holdout boundary wording. No Prompt, Proposal field, Holdout Gold, real Provider or external platform behavior is in scope.

### Checks

- `npm run typecheck`: passed.
- Focused Proposal / Compiler / DeepSeek Gateway / Scorer / Regression / Holdout tests: 27/27 passed.
- `npm run eval:semantic:fixture`: 7/7 exposed Regression Turns passed with `DEVELOPMENT_STAGE_ORACLES` and `baselineEligible:false`.
- `npm run arch:check`: passed with 0 forbidden source dependencies.
- `npm test`: 78/78 passed, 0 skipped and 0 failed in a permitted local-listener environment.
- `npm run test:probes`: 8/8 frozen probes passed.
- `npm run eval:search:fixture`: 3/3 passed.
- `npm run build`: passed.
- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=7 npm run eval:semantic:deepseek`: passed with the repaired strict Schema: 7/7 exposed Turns, 7 successful calls, 0 retry, 0 failed, 15,493 ms and 18,955 reported tokens. Classification remains `DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`.

### Modes and external effects

Unit, Contract, Fixture, Mock Harness and embedded PGlite verification ran, plus one paid real DeepSeek request sequence against the 7 already-exposed Regression Turns. No Clean Holdout baseline, Replay, Live Read-only, Controlled Live-write, Discovery, Availability, authorization or reservation ran. The private Holdout was not read or modified.

## 2026-08-17 — v15 architecture cleanup and hardening verification

### Scope

Provider structured-output transport, Eval first-failure attribution, derived readiness removal, semantic operation semantics, Restaurant application dependency injection, lightweight architecture checking, and repository/document cleanup. No new Semantic Proposal field, Decision Kernel responsibility, Holdout case behavior or external side effect is in scope.

### Checks

- `npm run arch:check`: passed with 0 forbidden source dependencies.
- `npm run typecheck`: passed.
- Focused Domain/DeepSeek/Eval/Search tests: 32/32 passed before the full baseline.
- `npm test`: 74/74 passed, 0 skipped and 0 failed in a permitted local-listener environment.
- `npm run test:probes`: 8/8 frozen probes passed.
- `npm run eval:semantic:fixture`: 7/7 exposed Turns passed with `DEVELOPMENT_STAGE_ORACLES` and `baselineEligible:false`.
- `npm run eval:search:fixture`: 3/3 passed.
- `npm run build`: passed.
- Final reference scan, ignored Holdout confirmation and `git diff --check`: passed.

### Modes and external effects

Only Unit, Contract, Fixture, Mock Harness and embedded PGlite verification ran. No real DeepSeek request, Clean Holdout baseline, Replay, Live Read-only, Controlled Live-write, Discovery, Availability, authorization or reservation ran. The private Holdout was not modified or semantically inspected.

## 2026-08-16 — Obsolete Eval and probe cleanup verification

### Scope

Removal of the executable v14 Decision Harness and legacy Intent Parser/eval, plus separation of frozen Goal/Scheduler/Synthetic architecture probes from the current default product suite. The v15 product semantic boundary and Holdout content are out of scope.

### Checks

- `npm run typecheck`: passed after the deleted imports and entrypoints were removed.
- `npm test`: `65/65` current product tests passed with 0 skipped and 0 failures in a permitted local-listener environment.
- `npm run test:probes`: `8/8` frozen architecture probes passed with 0 skipped and 0 failures.
- `npm run build`: passed.
- `npm run eval:semantic:fixture`: 7/7 exposed Regression Turns passed; classification remains `DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`.
- `npm run eval:semantic:holdout:preflight`: returned `READY_FOR_ANNOTATION`, 0 Sessions / 0 Turns / 0 issues; no model call was made.
- `npm run eval:search:fixture`: 3/3 cases passed.
- Deleted-path/reference scan, ignored-private-file confirmation and final `git diff --check`: passed.

### Modes and external effects

Only Unit, Contract, Fixture, Mock Harness and embedded PGlite verification ran. No DeepSeek or other real model, Replay, Live Read-only, Controlled Live-write, real Discovery, Availability, reservation, authorization or external network request ran. The private Holdout content was not inspected or changed.

## 2026-08-14 — v15 Clean Holdout harness preparation verification

### Scope

Eval-only Holdout infrastructure: private empty data file, committed empty template, frozen manifest, runtime Preflight, deterministic Draft/Decision scorer, exposed-Regression Fixture pipeline and guarded one-time real-model runner. No Holdout content, product Contract field, Prompt content, Domain State or Provider Adapter changed.

### Checks

- `npm run typecheck`: passed.
- `npm run build`: passed.
- v15 targeted tests: `5/5` passed. Four Holdout tests prove the empty-template boundary, complete valid Dataset acceptance, manifest/duplicate/Gold rejection and Draft-before-Decision first-failure attribution; the existing runner test now drives all 7 exposed Regression Turns through Proposal, Compiler, Runtime/Reducer and Kernel.
- `npm run eval:semantic:fixture`: 7/7 exposed Regression Turns passed with `DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`.
- `npm run eval:semantic:holdout:preflight`: returned `READY_FOR_ANNOTATION`, 0 Sessions / 0 Turns / 0 structural issues for the private empty scaffold.
- Strict Preflight and the real Holdout entry both rejected the empty scaffold with `EMPTY_HOLDOUT` before model configuration, artifact locking or network access. This is the expected pre-annotation state, not a failed Baseline.
- Full `npm test`: `151/151` passed with 0 failures in a permitted local-listener environment, including HTTP/SSE and embedded-PGlite scenarios.
- Final `git diff --check`, ignored-private-file confirmation and product Prompt/Contract diff review are required after this log update.

### Modes and external effects

Only Unit, Fixture, Mock Harness and embedded PGlite verification ran. No DeepSeek or other real model, Replay, Live Read-only, Controlled Live-write, real Discovery, Availability, reservation, authorization or external network request ran. The private Holdout remains empty and no one-time baseline artifact exists.

## 2026-08-14 — Stage 2C freeze verification

### Scope

Documentation and Eval lifecycle governance only: freeze the v15 responsibility boundary, Prompt `v2` and Proposal Schema `1`; retire v14 as `FROZEN / HARNESS_ONLY / REGRESSION`; and make a future independent v15 `CLEAN_HOLDOUT` the next baseline gate. No product TypeScript, Contract field, Prompt content, dataset, evaluator or Provider configuration changed in this freeze.

### Checks

- Production dependency review: no reference to `decision-v14` or its former `restaurant-decision-eval` path exists outside Eval documentation/entrypoints; product application, core, Domain, infrastructure, server and Harness directories do not import Eval modules.
- Documentation contradiction scan: no remaining active claim says v14 has not run a real model, requires a new v14 Holdout, or remains the current Progressive Decision baseline.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm run eval:decision:preflight:complete`: `READY_FOR_EVALUATOR`, 7 Episodes / 17 labeled Turns / 0 pending.
- `npm run eval:decision:fixture` and `npm run eval:decision:model:fixture`: passed as local frozen-history replay; the model Fixture used 17 calls, 0 schema retries and reported no P0.
- v15 targeted Regression test: `1/1` passed. It proves the current exposed Regression runner executes Proposal, Compiler, Runtime/Reducer and Kernel in order; it is not a Clean Holdout baseline.
- `npm run eval:search:fixture`: 3/3 cases passed.
- Full `npm test`: the restricted sandbox first produced 140/147 because seven HTTP/SSE tests could not bind `127.0.0.1` (`listen EPERM`); the identical command in a permitted local-listener environment passed `147/147` with 0 failures.
- `git diff --check`: passed before the verification record was added and is required again at final review.

### Modes and external effects

Only Unit, Fixture, Mock Harness and embedded PGlite verification ran. No DeepSeek or other real model, Replay, Live Read-only, Controlled Live-write, real Discovery, Availability, reservation, authorization or external network request ran.

## 2026-08-14 — Eval directory organization verification

### Scope

Repository organization only. The flat `src/eval/` files are grouped as `decision-v14/`, `semantic-v15/`, `intent-legacy/`, `search-fixture/`, and `shared/`; imports and public npm command paths now point to those locations. Dataset content, prompts, evaluator behavior, model configuration, and product runtime behavior were not changed.

### Checks

- `npm run typecheck`: passed after all moved-module imports were updated.
- Eval-only test selection: `78/78` passed. This was a compatibility check for moved TypeScript modules, not a new regression result or model-quality claim.
- `npm run build`: passed.
- `git diff --check`: passed. Markdown links and active source-path references were reviewed.
- Full `npm test` was not re-run after the user clarified this was an organization-only change. Its prior verified baseline remains `147/147`; an initial sandbox attempt was blocked only because the HTTP/SSE tests cannot bind `127.0.0.1` there.

### Modes and external effects

No real model, Replay, Live Read-only, Controlled Live-write, Discovery, Availability, reservation, authorization, or external network request ran. The compatibility test used only existing local fixtures.

## 2026-08-13 — Documentation navigation and history consolidation verification

### Scope

Documentation information-architecture change only: added a current-state entry point, moved the two append-only logs into `docs/history/`, and updated navigation and references. No executable product behavior, test fixture, model request, Provider, Adapter or external side effect changed.

### Checks

- Markdown path review and `git diff --check` are required for this change.
- The current baseline remains `147/147` from the v15 product slice verification; it was not re-run because this change has no executable code.

### Modes and external effects

No Unit, Fixture, Mock Harness, Replay, Real Model, Live Read-only or Controlled Live-write run. Moving versioned Markdown files only changes repository paths; all historical entries are retained.

## 2026-08-13 — Version branch delivery convention verification

### Scope

Git 与文档治理变更：为 v15 从已验证提交建立独立版本分支，并将版本分支选择与交付检查写入`AGENTS.md`和Post-change Verify。没有运行时、状态、模型、Provider、Adapter或产品行为改动。

### Checks

- 创建前工作区干净，当前 v15 实现 HEAD 为`714adcb`。
- 已从该提交创建`codex/restaurant-decision-v15`；`codex/restaurant-decision-v14`保留，未被重写。
- `git diff --check`：通过。未运行TypeScript、Fixture、Replay或真实模型测试，因为没有可执行产品改动。

### Modes and external effects

没有Unit、Fixture、Mock Harness、Replay、Real Model、Live Read-only或Controlled Live-write。Git分支创建只改变本地仓库引用；远端 push 单独报告，且必须取得用户明确授权。

## 2026-08-13 — v15 DeepSeek Semantic Proposal regression verification

### Scope

新增独立于Harness-only v14 `statePatch` Eval的v15真实模型回归。DeepSeek只产生Semantic Proposal；Proposal Contract、Compiler、In-memory Runtime/Reducer、Decision Kernel和Fixture Search依次执行。Dataset为7个静态、已暴露的Regression Turn；没有产品持久化State、真实Discovery、Availability、Authorization或外部写操作。

### Checks

- `npm run typecheck`、`npm run build`与v15 Runner Fixture Test：通过。
- `npm test`：`147/147`通过，包括新增v15 Runner Fixture Test及完整Runtime、Harness、PGlite、HTTP/SSE基线。
- 初次预调试：发现Prompt未明确每个`value.kind`的完整封闭JSON形状，DeepSeek出现AREA、PARTY_SIZE和BUDGET_PER_PERSON Contract失败；该轮不纳入矩阵。
- 补齐Prompt形状后，受控真实DeepSeek运行10次：每次7/7通过，合计`70/70`通过；0个`SEMANTIC_PROPOSAL_CONTRACT`、`COMPILER`、`SEMANTIC_RESULT`、`DECISION_KERNEL`或`RUNTIME`首错；0次结构重试、0次Provider失败或P0。
- 模型：`DEEPSEEK:deepseek-v4-flash`；累计输入39,290 Token、输出6,990 Token、总模型延迟125,360ms（均值12,536ms/运行）；价格环境未配置，成本状态为`NOT_CONFIGURED`。
- Prompt内容在正式十次前已修正，但请求遥测仍标`v1`；随后代码将其正确升为`v2`。因此十次结果证明该最终内容的行为，不构成按`v2`标识可复现的Baseline。

### Modes and external effects

`REAL_MODEL_MOCK_WORLD`与Fixture Search运行，结果单独报告。没有Replay、Live Read-only或Controlled Live-write。每次运行将静态Proposal诊断写入Git忽略的`.eval-artifacts/restaurant-semantic/`；无生产用户文本、Prompt正文或Key被持久化。

## 2026-08-13 — v15 Restaurant semantic/search product slice verification

### Scope

Fixture-only implementation of `Semantic Interpreter → Proposal Contract → Compiler → Reducer → Decision Kernel → Runtime Command → Fixture Search`. It changes Restaurant state/event/command schema to `4`, migrates the product Fixture applications and Harness, and leaves real DeepSeek, external Tool/Adapter execution and automatic re-interpretation disabled.

### Checks

- `npm run typecheck`: passed.
- Semantic Contract / Interpreter / Compiler / Reducer / Kernel unit tests: passed. They separately prove closed schema rejection, no internal state/tool protocol, deterministic correction/negation compilation, authoritative missing-field derivation and `NEED_REINTERPRETATION` safe reserve behavior.
- Fixture product / Mock Harness / PGlite Runtime regression: `48/48` passed, including local full-input, clarification and selection flow, booking safety invariants, Restaurant Event replay and durable-command recovery.
- `npm test`: `146/146` passed after running the HTTP/SSE cases in a permitted local-listener environment. The multi-session version assertion was migrated from `2` to `4`, reflecting the newly durable Proposal, Decision, Search observation and candidate-presentation Decision events.
- `npm run build`: passed.
- `git diff --check`: passed.

### Modes and external effects

Unit, Fixture product, Mock Harness and PGlite persistence were run and reported separately. Replay, Real Model, Live Read-only and Controlled Live-write were not run. No DeepSeek, Discovery, Availability, reservation, authorization or external write request was made.

## 2026-08-13 — v15 semantic-to-execution architecture governance verification

### Scope

Documentation-only architecture governance change. ADR-0007 fixes the Restaurant v15 target chain: Semantic Interpreter, Semantic Proposal Contract, Restaurant Semantic Compiler, Runtime/Reducer, Decision Kernel, execution control and Verifier. No TypeScript, Runtime, Parser, Web, Harness behavior, Provider configuration or external integration changed.

### Checks

- Documentation consistency review: ADR, Architecture Overview, Agent Orchestration, Restaurant Domain, Interfaces, Arch Guard, Planning, Eval, Harness and Post-change Verify all identify the Semantic Interpreter output as an untrusted Proposal rather than a State Patch/Event/Tool Call.
- Documentation consistency review: each source preserves the required Runtime/Policy/Authorization/Execution Router/Verifier control path and prohibits `LLM → Tool`, `LLM → State`, and `Verifier → LLM → Tool`.
- Documentation consistency review: `NEED_REINTERPRETATION` is a v15 reserved Decision Kernel result, records conflict and asks the user or safely degrades; no automatic state overwrite or model retry loop is authorized.
- `git diff --check`: passed after final documentation review.

### Modes and external effects

No Unit, Fixture, Replay, Real Model Mock World, Live Read-only or Controlled Live-write run because this change has no executable code. No DeepSeek, database, Discovery, Availability, reservation or other external request was made.

## 2026-08-13 — Prompt v14 / typed Patch Contract verification

### Scope

Harness-only Restaurant Progressive Decision Eval：typed Preference/Hard Constraint、JSON Schema、共享Validator、Reducer语义集合、Golden v0.10 / Schema 3与Prompt v14。未改产品Restaurant State、Task Runtime、Web、Provider Adapter或外部执行路径。

### Checks

- `npm run typecheck`：通过。
- Contract、Model Contract、Preflight、Mutation、Reducer/Scorer、Decision Kernel与Runner定向测试：65/65通过。
- `npm run eval:decision:preflight:complete`：`READY_FOR_EVALUATOR`，7个Episode / 17个Labeled Turn / 29个Candidate / 417个Fact，dataset v0.10。
- `npm run eval:decision:model:fixture`：Runner v4 / Prompt v14 / Proposal Schema 4，17次Fixture调用、0次Schema retry；S1–S4与S8均17/17通过，S5 5个适用Turn通过，S6 11个适用Turn通过，S7 10个适用Turn通过，P0为空。
- `npm test`：受限沙箱首次运行时131个非HTTP用例通过，7个Local Web/SSE场景仅因`listen EPERM 127.0.0.1`失败；允许本机监听后原命令重跑为138/138通过、0失败。
- `npm run build`：通过。
- `git diff --check`：通过。

### Modes and external effects

只运行Unit/Contract、Preflight和Golden Fixture Model；没有调用DeepSeek、真实Discovery、Availability、地图或预约平台，没有数据库或其他外部写入。当前Golden和Prompt相关结果已暴露，不能作为Baseline或Holdout。

## 2026-08-12 — Prompt v13 State Patch Contract verification

只修改Harness-only Prompt及其Contract断言；Schema、Kernel、Gold、Reducer、Scorer和canonicalization未变。`node --import tsx --test src/eval/restaurant-decision-eval-model-contract.test.ts`为8/8通过，`npm run typecheck`与`git diff --check`通过。静态Prompt测试明确拒绝当前四条Regression原句和既有Fixture实体。未运行DeepSeek、完整Golden Regression、真实Discovery、Availability或任何外部写入。

## 2026-08-12 — Eval-only Decision Kernel probe / Prompt v12 verification

### Scope

只修改Progressive Decision Eval的Harness：Proposal Schema 3只接受语义`statePatch`和可选Candidate排序，Eval-only Decision Kernel从累计State、可信Fixture/Search结果和Candidate Fact生成Readiness、下一步动作、候选展示上限与Grounding。没有改Restaurant产品Domain、Task Runtime、Web、真实Discovery、地图、Availability、预约或外部写入。

### Checks

- `npm run typecheck`：通过。
- `node --import tsx --test src/eval/restaurant-decision-eval-decision-kernel.test.ts src/eval/restaurant-decision-eval-model-contract.test.ts src/eval/restaurant-decision-eval-runner.test.ts`：15/15通过；覆盖命名目标/严格零结果路由、有限候选Grounding、Schema拒绝旧Policy字段及Runner不向模型发送`retrievalSummary`。
- `npm run eval:decision:preflight:complete`：通过，7个Episode / 17个Labeled Turn，`READY_FOR_EVALUATOR`。
- `npm run eval:decision:fixture`与`npm run eval:decision:model:fixture`：通过；Fixture Runner v4 / Prompt v12 / Schema 3，17次Fixture调用、0次Schema retry，S1–S8全部通过。
- `npm run build`与`git diff --check`：通过。
- 完整`npm test`：受限沙箱首跑中7个Local Web/SSE用例因`listen EPERM 127.0.0.1`失败，其余126个通过；以本机监听权限重跑后133/133通过，0 failed。该差异是沙箱网络权限，不是本次代码断言失败。

### Modes and external effects

已运行Unit/Contract、Fixture Oracle与Fixture Episode Runner；没有发起DeepSeek调用，未访问真实站点、Discovery、Availability或预约平台。当前Golden与结果已暴露，后续任何真实模型重跑仍只能报告为`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。

## 2026-08-12 — Prompt v11 action routing verification

### Scope

只修改Progressive Decision Eval的Harness-only Prompt动作路由边界：`BRAND`、`RESTAURANT`、`OPEN/CATEGORY`和`CHECK_AVAILABILITY`的触发条件显式分开。Gold、Reducer、Scorer、输出Schema、真实Discovery、地图、Availability、预约平台和产品Runtime均未修改。

### Checks

- `npm run typecheck`：通过。
- `node --import tsx --test src/eval/restaurant-decision-eval-model-contract.test.ts`：8/8通过；Prompt Contract断言覆盖Routing Matrix、`BRAND`不得走`CHECK_TARGET_RESTAURANT`、`RESTAURANT`不得走`RESOLVE_BRAND_OUTLET`或`SHOW_RECOMMENDATIONS`，以及`APPROXIMATE/DAYPART`不等于Exact Availability。
- `npm run eval:decision:model:fixture`：Runner v3、Fixture Model、17次调用、0次Schema retry；Model Contract使用`promptVersion: v11`与输出Schema `2`，S1–S8全部通过。
- `npm run eval:decision:fixture`：Golden v0.9 Fixture Oracle 17个Turn的S1–S8全部通过，P0为0。
- `npm run build`：通过。
- `git diff --check`：通过。

### Real Model Mock World

- 首次`PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_DECISION_EVAL_SCOPE=FULL_REGRESSION PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=7 npm run eval:decision:deepseek:smoke`在sandbox内完成Preflight但7个Episode均为`MODEL_FAILURE / NETWORK`，`modelCalls: 0`，没有产生语义评分；诊断文件为`.eval-artifacts/restaurant-decision/2026-08-12T08-21-31-195Z-full_regression.md`。
- 用户随后明确批准调用DeepSeek并接受当前Regression评测数据发送给DeepSeek后，使用同一命令以外部网络权限重跑成功：7个Episode、17个Turn全部到达DeepSeek并完成评分，17次调用、0次Schema retry、0次Provider failure、P0为0，`totalLatencyMs: 35293`，Token为45,262 input / 2,125 output / 47,387 total，成本仍为`NOT_CONFIGURED`。
- 诊断文件：`.eval-artifacts/restaurant-decision/2026-08-12T08-37-35-090Z-full_regression.md`。
- 分类保持`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`，因为当前Golden Seed与结果已参与Prompt迭代。
- 12/17个Turn无首错；剩余5个首错为`S3_READINESS: 2`、`S1_STATE_EXTRACTION: 2`、`S7_SELECTION_DIVERSITY: 1`。`S4_ACTION_ROUTING`直接失败为0；v8中DGS02-T01、DGS03-T01和DGS03-T02的3个S4路由首错均不再作为首错出现。
- 代表性剩余问题：
  - DGS03-T02：状态正确、动作已为`CHECK_TARGET_RESTAURANT`，但readiness输出`NOT_READY`，Gold为`RECOMMENDATION_READY`。
  - DGS04-T03：`no smoking`仍被写成`negativePreferences: ["smoking"]`，Gold要求`hardConstraints: ["fully non-smoking"]`。
  - DGS06-T03：推荐2个候选，Gold要求3个候选，首错`RECOMMENDATION_CANDIDATE_COUNT`。
  - DGS06-T04：`nothing too formal`被写为`negativePreferences: ["too formal"]`，Gold要求`["formal"]`。
  - DGS07-T01：状态正确，但严格结果为空时readiness输出`NOT_READY`，Gold为`AVAILABILITY_READY`并要求`PROPOSE_CONSTRAINT_RELAXATION`。
- 用户同意后对相同v11 Prompt、Golden v0.9和`FULL_REGRESSION`范围继续重复运行，最终形成10次真实模型Mock World诊断；10次均保持`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`，不能作为质量Baseline或趋势证据。
- 追加9次诊断Artifact与调用数：
  - `.eval-artifacts/restaurant-decision/2026-08-12T08-54-41-045Z-full_regression.md`：18次调用、1次Schema retry。
  - `.eval-artifacts/restaurant-decision/2026-08-12T08-55-29-151Z-full_regression.md`：18次调用、1次Schema retry；DGS05-T04出现`INVALID_MODEL_OUTPUT`，原因是模型输出了不受Schema支持的顶层`explainsInsufficientCandidates`。
  - `.eval-artifacts/restaurant-decision/2026-08-12T08-56-06-749Z-full_regression.md`：17次调用、0次Schema retry。
  - `.eval-artifacts/restaurant-decision/2026-08-12T10-09-14-283Z-full_regression.md`：17次调用、0次Schema retry。
  - `.eval-artifacts/restaurant-decision/2026-08-12T10-10-03-944Z-full_regression.md`：19次调用、2次Schema retry。
  - `.eval-artifacts/restaurant-decision/2026-08-12T10-10-53-066Z-full_regression.md`：17次调用、0次Schema retry。
  - `.eval-artifacts/restaurant-decision/2026-08-12T10-11-30-967Z-full_regression.md`：17次调用、0次Schema retry。
  - `.eval-artifacts/restaurant-decision/2026-08-12T10-12-12-973Z-full_regression.md`：17次调用、0次Schema retry。
  - `.eval-artifacts/restaurant-decision/2026-08-12T10-13-30-090Z-full_regression.md`：17次调用、0次Schema retry。
- 10次矩阵显示：DGS03-T02为10/10 `S3_READINESS`；DGS04-T03为10/10 `S1_STATE_EXTRACTION`；DGS06-T03为10/10 `S7_SELECTION_DIVERSITY`；DGS06-T04为10/10不通过，但首错阶段不稳定（2次`S1`、7次`S7`、1次`S4`）；DGS07-T01为10/10不通过，其中9次`S3_READINESS`、1次`S1_STATE_EXTRACTION`。DGS05-T04只有1次Schema越界；DGS06-T02只有1次臆造`FLEXIBLE.anchorQuery: "current location"`；DGS07-T02只有1次`S2_STATE_ACCUMULATION`，且确认是同次DGS07-T01把`at 7pm`写成`APPROXIMATE`导致的累计污染，不是T02本身的新错误。
- 首跑的“直接S4失败为0”不能当作稳定结论；10次中出现过1次DGS06-T04反馈路由`S4_ACTION_ROUTING`，但v8中DGS02-T01、DGS03-T01和DGS03-T02的3个固定路由首错没有复现为直接S4。后续不得基于单次真实模型运行继续调Prompt；应优先处理10/10稳定不通过的问题，并把一次性Schema越界、臆造anchor和上游累计污染单独归类。

### Modes

- Unit/Contract、Fixture Oracle、Fixture Episode Runner：通过。
- Real Model Mock World：经用户明确授权后通过DeepSeek完成；结果仅为已暴露Regression开发诊断。
- Replay、Live Read-only和Controlled Live-write：本轮未运行；没有访问真实网站或预约平台。

### External side effects

无生产外部副作用；未访问live sites、真实Discovery、地图、Availability或预约平台。外部副作用仅限经用户明确授权后的DeepSeek模型调用；本v11记录中的10次成功/诊断运行合计174次DeepSeek API请求，其中包含4次Schema retry请求。

## 2026-08-12 — Prompt v10 extraction boundary verification

### Scope

只修改Progressive Decision Eval的Harness-only Prompt边界：社交语境不得推出人数，软偏好不得把`target: OPEN`提升为`CATEGORY`。Gold、Reducer、Scorer、输出Schema、真实Discovery、地图、Availability、预约平台和产品Runtime均未修改。

### Checks

- `npm run typecheck`：通过。
- `node --import tsx --test src/eval/restaurant-decision-eval-model-contract.test.ts`：8/8通过；Prompt Contract断言覆盖“不从社交语境推断party”和“软偏好保留为preferences”。
- `npm run eval:decision:model:fixture`：Runner v3、Fixture Model、17次调用、0次Schema retry；Model Contract使用`promptVersion: v10`与输出Schema `2`，S1–S8全部通过。
- `npm run eval:decision:fixture`：Golden v0.9 Fixture Oracle 17个Turn的S1–S8全部通过，P0为0。
- `npm run build`：通过。
- `git diff --check`：通过。

### Modes

- Unit/Contract、Fixture Oracle、Fixture Episode Runner：通过。
- 完整`npm test`：本轮未运行；改动只限Prompt文本、Prompt Contract测试和文档，没有修改Runtime、Web、Reducer或Scorer。当前完整基线仍为2026-08-12的131 tests / 5 suites。
- Real Model Mock World、Replay、Live Read-only和Controlled Live-write：本轮未运行；没有新的DeepSeek请求。

### External side effects

无生产外部副作用；没有网络模型调用。

## 2026-08-12 — Prompt v9 / Golden v0.9 location strategy verification

### Scope

只修改Progressive Decision Eval的Harness-only地点语义表示与比较：`FLEXIBLE`可带`anchorQuery`表达“从某地出发且愿意移动”，S1/S2对同一query的`AREA`/`NEAR_PLACE`做受控等价，并忽略泛化“willing to travel”类scope。未接真实地图、Discovery、Availability、预约平台或产品Runtime写入。

### Checks

- `npm run typecheck`：通过。
- `npm run eval:decision:preflight:complete`：Golden v0.9，7个Episode、17个Labeled Turn，`READY_FOR_EVALUATOR`。
- `npm run eval:decision:fixture`：17个Turn的S1–S8全部通过，P0为0。
- `npm run eval:decision:model:fixture`：Runner v3、Fixture Model、17次调用、0次Schema retry；Model Contract使用`promptVersion: v9`与输出Schema `2`。
- `node --import tsx --test src/eval/restaurant-decision-eval-scorer.test.ts src/eval/restaurant-decision-eval-model-contract.test.ts src/eval/restaurant-decision-eval-preflight.test.ts`：35/35通过。
- `npm test`：首次在sandbox内7个Local HTTP/SSE用例因`listen EPERM 127.0.0.1`失败，其余124个已通过；使用批准的`npm test`本机监听权限重跑后131 tests / 5 suites / 0 failed。
- `npm run build`：通过。

### Modes

- Unit/Contract、Fixture Oracle、Fixture Episode Runner：通过。
- Real Model Mock World、Replay、Live Read-only和Controlled Live-write：本轮未运行；没有新的DeepSeek请求。

### External side effects

无生产外部副作用。完整测试只临时监听本机`127.0.0.1`。

## 2026-08-11 — Prompt v8 Full Regression real-model diagnostic

### Scope

用户明确授权后，以`REAL_MODEL_MOCK_WORLD`运行全部7个已暴露的Regression Episode、17个Turn。候选仍为Golden Fixture；不访问真实Discovery/Availability，不执行预约、购买、取消、支付或任何产品Runtime写入。本次结果按`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`记录，不能作为模型质量或泛化证据。

### Checks

- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_DECISION_EVAL_SCOPE=FULL_REGRESSION PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=7 npm run eval:decision:deepseek:smoke`：17/17真实DeepSeek调用完成，Schema retry为0。
- 7个Turn没有首错；其余10个首错为7个`S1_STATE_EXTRACTION`和3个`S4_ACTION_ROUTING`。没有由相对时间归一导致的首错。
- 本机Git忽略诊断Artifact：[2026-08-11T09-53-25-270Z-full_regression.md](../../.eval-artifacts/restaurant-decision/2026-08-11T09-53-25-270Z-full_regression.md)；它包含可信相对时间、原始/有效Patch及阶段差异，不包含原始Prompt、自然语言Completion、API Key或生产用户数据。

### Modes

- Real Model Mock World：已运行。
- Unit/Contract、Fixture Oracle、Fixture Episode Runner：见同日v8验证记录；Replay、Live Read-only和Controlled Live-write：未运行。

### External side effects

17次明确授权的付费DeepSeek只读模型调用，以及一个本地Git忽略诊断文件；没有生产外部写入。

## 2026-08-11 — Prompt v8 trusted relative-time normalization verification

### Scope

新增仅限Progressive Decision Eval的确定性相对时间解析与Runner v3：在固定`referenceTime`、`Asia/Tokyo`下，将`today`、`tomorrow`、`tonight`、`now`和`right now`并入可信State和有效Patch；诊断输出原始模型Patch、解析结果和有效Patch。不改生产Restaurant State、Task Runtime、真实时钟、Discovery、数据库、预约或外部写入。

### Checks

- `node --import tsx --test src/eval/restaurant-decision-eval-relative-time.test.ts src/eval/restaurant-decision-eval-runner.test.ts src/eval/restaurant-decision-eval-model-contract.test.ts`：18/18通过。覆盖Tokyo时区、五个相对表达、冲突不解析、跨回合Daypart保留、date-less模型`DAYPART`补齐，以及诊断中原始/有效Patch分离。
- `npm run typecheck`、`npm run eval:decision:preflight:complete`、`npm run eval:decision:model:fixture`、`npm run build`：通过；Fixture Runner为v3，17个Turn的S1–S8通过，P0为0，Model Contract使用`promptVersion: v8`。
- `npm test`：首次在PGlite WebAssembly的Node/V8清理阶段原生中止，尚未到断言级失败；同一命令立即重跑后为130 tests / 5 suites / 0 failed。

### Modes

- Unit/Contract、Fixture Oracle、Fixture Episode Runner：通过。
- Real Model Mock World、Replay、Live Read-only和Controlled Live-write：本轮未运行；没有新的DeepSeek请求。

### External side effects

无；完整测试仅临时监听本机`127.0.0.1`。

## 2026-08-11 — Prompt v7 occasion mapping verification

### Scope

只修改Progressive Decision Eval的Harness-only Model Contract：移除缺字段示例的`occasion: DATE`默认值，明确`FAMILY`、`FRIENDS`、`TEAM`与浪漫`DATE`的显式场景映射，并将`ASK_CORE_FIELD.DATE`与`occasion.DATE`的含义分开。不改生产Restaurant State、Task Runtime、Discovery、数据库、预约或任何外部写路径。

### Checks

- `node --import tsx --test src/eval/restaurant-decision-eval-model-contract.test.ts`：8/8通过。新断言确认Prompt包含抽象`FAMILY`、`FRIENDS`、`TEAM`、浪漫`DATE`规则，不含`"occasion":"DATE"`缺字段示例，且无Golden实体或样例事实。
- `npm run eval:decision:preflight:complete`：Golden v0.8，7个Episode、17个Labeled Turn，`READY_FOR_EVALUATOR`。
- `npm run eval:decision:model:fixture`：17个Turn完成评分，S1–S8通过，P0为0；所有Fixture调用携带`promptVersion: v7`。
- `npm run typecheck`、`npm run build`：通过。
- `npm test`：124 tests / 5 suites / 0 failed。初次沙箱运行的7个本机Web/SSE监听用例因`listen EPERM`无法启动；使用仅允许`127.0.0.1`临时监听的同一命令重跑后全部通过。

### Modes

- Unit/Contract、Fixture Oracle、Fixture Episode Runner：通过。
- Real Model Mock World、Replay、Live Read-only和Controlled Live-write：本轮未运行；没有新的DeepSeek请求。

### External side effects

无。

## 2026-08-11 — Eval-only restaurant category canonicalization verification

### Scope

只修改Progressive Decision Eval的S1/S2语义比较：受控类别别名和大小写视为等价。未改生产Restaurant State、Task Runtime、模型输入、Discovery、数据库或外部平台。

### Checks

- `npm run typecheck`、`npm run build`：通过。
- `npm run eval:decision:preflight:complete`：Golden v0.8，7个Episode、17个Labeled Turn，`READY_FOR_EVALUATOR`。
- `npm run eval:decision:model:fixture`：17个Turn完成评分，S1–S8通过，P0为0。
- `npm test`：124 tests / 5 suites / 0 failed。新增回归验证`WESTERN`、`IZAKAYA`、`JAPANESE`通过S1/S2，而非批准类别`Italian`仍为S1失败。

### Modes

- Unit/Contract、Fixture Oracle、Fixture Episode Runner：通过。
- Real Model Mock World、Replay、Live Read-only和Controlled Live-write：本轮未运行；没有新的DeepSeek请求。

### External side effects

无。

## 2026-08-11 — v6 full Regression diagnostic artifact run

## 2026-08-11 — v6 full Regression diagnostic artifact run

### Scope

用户明确授权后，以Prompt v6运行全部7个静态Regression Episode、17个Turn，并读取本机逐TurnMarkdown Artifact。该调用只访问DeepSeek，Candidate World保持虚构Golden Fixture。

### Checks

- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_DECISION_EVAL_SCOPE=FULL_REGRESSION PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=7 npm run eval:decision:deepseek:smoke`：完成17次模型调用；Artifact记录0次Schema重试、4个完整通过Turn和13个首错（S1=10、S2=2、S7=1），未发现`P0_`错误。
- Artifact：`.eval-artifacts/restaurant-decision/2026-08-11T03-59-28-429Z-full_regression.md`。它逐条验证S1 Patch效果与S2累计状态确实可区分：DGS03-T02、DGS04-T02是上游偏差的S2后果；DGS02是独立的`RECOMMENDATION_MISSING`；其他10个首错为可见的S1字段差异。

### Modes

- Real Model Mock World：完成，固定标记`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。
- Unit/Contract、Fixture、Replay、Live Read-only和Controlled Live-write：本轮未运行。

### External side effects

17次受控、只读DeepSeek API调用，可能产生供应商费用；本机写入一个Git忽略的诊断Markdown；无数据库、Discovery、餐厅平台、预约、支付或其他外部写操作。

## 2026-08-11 — Progressive Decision diagnostic artifact verification

## 2026-08-11 — Progressive Decision diagnostic artifact verification

### Scope

新增当前静态Golden Regression的逐Turn诊断Artifact和真实Eval重试指标修正。范围仅限`src/eval/`与本机Git忽略的`.eval-artifacts/`输出；不改变生产状态、Task Runtime、Model Gateway遥测、数据库、Discovery或外部写入。

### Checks

- `npm run typecheck`：通过。
- `node --import tsx --test src/eval/restaurant-decision-eval-runner.test.ts src/eval/real-model-eval.test.ts`：7/7通过。回归场景故意令DGS01的`target`变为`OPEN`，确认诊断Markdown显示`state.target.kind`的期望/实际差异与`S1_STATE_EXTRACTION / STATE_PATCH_MISMATCH`。
- 指标回归验证：两条独立Turn主调用、两条Invocation Record时`retryCalls`为0；同一Case的两条调用仍正确计为一次重试。

### Modes

- Unit/Contract、Fixture Episode Runner：通过。
- Real Model Mock World：随后在同日的v6 full Regression diagnostic artifact run中运行，见上方独立记录。
- Replay、Live Read-only和Controlled Live-write：未运行；没有新的DeepSeek请求。

### External side effects

无。真实CLI的Artifact写入尚未在本轮实际触发；下次显式付费Regression Eval仅在本机`.eval-artifacts/`创建文件，不写数据库或普通遥测。

## 2026-08-11 — v6 full Regression diagnostic verification

## 2026-08-11 — v6 full Regression diagnostic verification

### Scope

在Golden v0.8 / Prompt v6的Fixture边界验证后，按用户明确授权运行全部7个已暴露`REGRESSION` Episode、17个Turn。此命令只向DeepSeek发送静态虚构Fixture和允许的当前Turn上下文；没有真实Discovery、Availability、Task、数据库或平台写入。

### Checks

- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_DECISION_EVAL_SCOPE=FULL_REGRESSION PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=7 npm run eval:decision:deepseek:smoke`：`COMPLETED`，7/7 Episode为`SCORED`，17/17模型调用成功，0次Provider失败，Runner记录0次Schema重试，总延迟28,543ms；输入34,750、输出2,199、合计36,949 Token；成本`NOT_CONFIGURED`；P0为空。
- S1为6 Pass / 11 Fail；S2为4 Pass / 2 Fail / 11 Blocked。首错仅为11次`S1_STATE_EXTRACTION`和2次`S2_STATE_ACCUMULATION`；命名目标、Grounding和候选充分性不再是首错。
- 外层`modelMetrics.retryCalls`显示10，是通用汇总以7个Episode而不是17个有模型调用的Turn计算的已知报告缺陷；不得当作真实重试。逐TurnRunner的`schemaRetryCalls: 0`才是本次Schema重试结果。

### Modes

- Real Model Mock World：完成，`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`；结果不可作为Baseline、版本趋势或发布证据。
- Unit/Contract、Fixture Oracle和Fixture Episode Runner：采用本次v6边界验证结果；本次真实运行后未改代码，未重复执行。
- Replay、Live Read-only和Controlled Live-write：未运行。

### External side effects

17次受控、只读DeepSeek API调用，可能产生供应商费用；无数据库、Discovery、餐厅平台、预约、支付或其他外部写操作。

## 2026-08-11 — v6 Fixture Tool boundary verification

### Scope

Golden v0.8 / Prompt v6把命名目标解析、候选充分性和证据装配收回到Harness可信侧。改动限于Eval Contract、Preflight、Runner、Scorer、Golden Fixture和对应测试；未修改生产Restaurant State、Task Runtime、Adapter、Web、数据库或外部平台。

### Checks

- 定向Eval Contract / Preflight / Runner / Scorer / Mutation：54/54通过；包括缺少`FIXTURE_DISCOVERY`解析时Strict Preflight失败、品牌解析传入模型、有限结果的`retrievalSummary`传入模型、可信Grounding装配和语义no-op Patch。
- `npm run typecheck`、`npm run build`：通过。
- `npm run eval:decision:preflight:complete`：Golden v0.8，`READY_FOR_EVALUATOR`，7个Episode、17个Labeled Turn。
- `npm run eval:decision:model:fixture`：`FIXTURE_MODEL`下17个Turn均完成评分；S1–S8均通过，P0为0。
- `npm test`：122 tests / 5 suites / 0 failed。

### Modes

- Unit/Contract、Fixture Oracle、Fixture Episode Runner：通过。
- Real Model Mock World：随后在同日的v6 full Regression diagnostic中运行，见上方独立记录。
- Replay、Live Read-only和Controlled Live-write：未运行。

### External side effects

无。

## 2026-08-11 — v5 full Regression diagnostic verification

### Scope

在不修改生产路径的前提下，显式运行当前全部7个`REGRESSION` Episode。新增的Scope选择只影响Harness-only CLI的Episode集；默认三条Smoke仍保持不变。

### Checks

- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_DECISION_EVAL_SCOPE=FULL_REGRESSION PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=7 PRAXIS_EVAL_SHOW_COMPLETIONS=1 npm run eval:decision:deepseek:smoke`：Prompt v5完成7个Episode、17个Turn，所有Episode均为`SCORED`。本次诊断在终端显示每个Completion与结构结果；原始正文按设计没有写入数据库、普通遥测或文件。
- `npm run typecheck`：通过。
- `npm test`：120 tests / 5 suites / 0 failed。
- `git diff --check`：通过。

### Modes

- Real Model Mock World：完成，结果标记为`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`；不能作为Baseline、趋势或发布证据。
- Unit/Contract、Fixture Runner：本轮未重跑定向命令；全量`npm test`覆盖它们。
- Replay、Live Read-only和Controlled Live-write：未运行。

### External side effects

17次受控、只读DeepSeek模型调用；无数据库、餐厅平台、预约、支付或其他外部写操作。

## 2026-08-11 — Prompt v5 decontamination and controlled smoke verification

### Scope

Prompt v5只删除静态System Prompt中来自Golden Regression的worked examples：店名、地点、菜系、候选、日期/人数与反馈措辞均替换为抽象规则；新增防泄漏Contract断言，并按用户明确授权重跑固定E1/E2/E3 DeepSeek Smoke。没有改变Task Runtime、生产Parser、状态、Schema、Authorization、Adapter、Web、数据库或外部写路径。

### Checks

- `node --import tsx --test src/eval/restaurant-decision-eval-model-contract.test.ts src/eval/restaurant-decision-eval-runner.test.ts`：11/11通过；覆盖v5不含`Sora Dining`、Ginza、西餐类别、原反馈措辞与候选占位符，且保留抽象命名店铺/偏好规则。
- `npm run typecheck`、`npm run build`：通过。
- `npm run eval:decision:preflight:complete`：通过，7个Episode、17个Labeled Turn为`READY_FOR_EVALUATOR`；`npm run eval:decision:model:fixture`：通过，17个Fixture Turn完成评分，P0为0。
- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=3 PRAXIS_EVAL_SHOW_COMPLETIONS=1 npm run eval:decision:deepseek:smoke`：Prompt v5共7次成功调用、0次Provider失败、0次Schema Retry、15,548ms、14,704输入Token、918输出Token、15,622总Token，成本`NOT_CONFIGURED`，P0为0。7个Turn均结构合规并进入评分；S1为5 Pass / 2 Fail，S2为4 Pass / 1 Fail / 2 Blocked，S8为0 Pass / 3个`GROUNDING_MISSING` / 4 Blocked。首错另包括一次State Accumulation和一次不足候选解释。
- 全量`npm test`：120 tests / 5 suites / 0 failed（在允许临时`127.0.0.1`监听后）；`git diff --check`：通过。

### Modes

- Unit/Contract、Strict Complete、Fixture Episode Runner：通过。
- Real Model Mock World：Prompt v5完成；结果为`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`，不报告为质量Baseline或趋势。
- Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- v5静态Prompt不再含当前Golden Regression事实；模型仍仅可接收当前Turn的用户消息与允许的只读Fixture Candidate Context，不能伪造Retrieval、写Task、Authorization、Attempt或Outcome。
- Completion诊断只输出至本次终端，未写入普通Gateway遥测、数据库或文件。所有真实调用只读DeepSeek；没有数据库、餐厅平台、预约、支付或其他外部写操作。

### External side effects

7次受控、只读DeepSeek模型调用；无其他外部副作用。

## 2026-08-11 — Progressive Decision anti-leakage governance verification

### Scope

固定DeepSeek Smoke的报告分类和评测防泄漏协议：把已经用于Prompt v1–v5调优的`DGS01/DGS03/DGS05`明确降级为开发诊断，禁止将既有六次Smoke作为独立质量Baseline、趋势或发布证据。没有运行模型、Web、数据库或外部平台。

### Checks

- `npm run typecheck`、`npm run build`：通过。
- `npm test`：119 tests / 5 suites / 0 failed；最初Sandbox阻止本机`127.0.0.1`监听，按同一命令允许临时本机监听后全部通过。
- `npm run eval:decision:preflight:complete`：通过，Dataset为`READY_FOR_EVALUATOR`（7个Episode、17个Labeled Turn）；`npm run eval:decision:model:fixture`：通过，17个Fixture Turn均已评分、P0为0。
- `git diff --check`：通过。`evaluationClassification`随受控Smoke JSON输出编译进入CLI；为避免付费网络调用，本轮不实际执行该CLI。

### Modes

- Governance documentation / static CLI metadata：通过TypeScript编译、Fixture回归与差异检查验证；真实Smoke未运行。
- Fixture Oracle、Real Model Mock World、Replay、Live Read-only和Controlled Live-write：本轮未运行。

### Safety

- 该分类字段只随CLI报告输出，不保存Prompt/Completion，不影响Fail-closed、Task State、Authorization、Attempt或Outcome。
- 当前所有7个Golden Seed均为Regression；固定Smoke的三样本和结果已暴露给调优过程，报告为`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`。

### External side effects

无。没有发起模型调用，也没有数据库、餐厅平台、预约、支付或其他外部写操作。

## 2026-08-11 — Episode Runner, controlled Progressive Decision smoke and completion diagnostic verification

### Scope

Harness-only Episode Runner：Strict Preflight、Golden Fixture候选上下文、版本化Model Contract、确定性S6、S1–S8评分、Schema/Provider失败隔离、静态Fixture专用Completion诊断，以及五次受控DeepSeek E1/E2/E3 Smoke。没有改动Web、Task Runtime、数据库、Authorization、Adapter或外部写路径。

### Checks

- `npm run eval:decision:preflight:complete`、`npm run eval:decision:fixture`和`npm run eval:decision:model:fixture`：通过。Fixture Model完整运行7个Episode、17个Turn；S1–S4/S8各17个Pass，S5为5个Pass，S6为11个Pass，S7为10个Pass，其余为设计上的`NOT_APPLICABLE`；P0为0。
- `node --import tsx --test src/eval/restaurant-decision-eval-model-contract.test.ts src/eval/restaurant-decision-eval-runner.test.ts`：10/10通过，覆盖Prompt v2嵌套Schema约束、显式进程内Completion诊断、完整Fixture路径、Provider失败停止Episode和Preflight阻断调用。
- `npm run typecheck`、`npm run build`：通过。
- `npm test`：119 tests / 5 suites / 0 failed；Web/SSE Fixture用例在允许本机`127.0.0.1`监听后通过。
- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=3 npm run eval:decision:deepseek:smoke`：Prompt v1真实Provider连接成功，7次调用全部到达DeepSeek，0次Provider失败，3次Schema Retry，24,083ms总延迟，7,863输入Token、1,616输出Token、9,479总Token；三个Episode均以`INVALID_MODEL_OUTPUT`停止，未产生S1–S8语义分数。
- 相同范围的Prompt v2 Smoke：8次调用全部到达DeepSeek，0次Provider失败，3次Schema Retry，20,731ms总延迟，11,337输入Token、1,800输出Token、13,137总Token；E2-T01和E3-T01通过结构校验，E1-T01、E2-T02和E3-T02仍以`INVALID_MODEL_OUTPUT`停止，故没有完整Episode进入S1–S8语义评分。价格未配置，成本为`NOT_CONFIGURED`。
- 静态Fixture Completion诊断的第二次Prompt v2 Smoke：8次调用全部到达DeepSeek，0次Provider失败，3次Schema Retry，20,225ms总延迟，11,337输入Token、1,585输出Token、12,922总Token。E1两次均输出不受支持的`DAY`/`EVENING`、`location.type`和`RECOMMEND`；E2-T02用`DATE`或缺失的时间精度；E3-T02用`NIGHT`和布尔`preferred`。这些是Schema词表/字段组合错误，不是Provider或语义评分错误。
- 静态Fixture Completion诊断的Prompt v3 Smoke：7次调用全部到达DeepSeek，0次Provider失败、0次Schema Retry，12,573ms总延迟，13,389输入Token、812输出Token、14,201总Token。全部7个Turn结构合规并进入评分，但S1均为`STATE_PATCH_MISMATCH`；v3强制空`add`/`remove`而Gold no-op Patch省略它们，另有明确Restaurant当作Brand、DATE的occasion/target遗漏和反馈负偏好遗漏。结果不能作为语义质量Baseline；P0为0，成本仍为`NOT_CONFIGURED`。
- 静态Fixture Completion诊断的Prompt v4 Smoke：7次调用全部到达DeepSeek，0次Provider失败、0次Schema Retry，13,226ms总延迟，15,372输入Token、886输出Token、16,258总Token。全部7个Turn结构合规；S1为6 Pass/1 Fail、S2为6 Pass/1 Blocked、S3为5 Pass/1 Fail/1 Blocked、S4为5 Pass/2 Blocked，S6/S7各3 Pass/2 Blocked/2 NA，S8为5个`GROUNDING_MISSING`和2个Blocked。`Sora Dining`正确分类为`RESTAURANT`，反馈正确加入正/负偏好；P0为0，成本仍为`NOT_CONFIGURED`。

### Modes

- Dataset Annotation、Strict Complete、Fixture Oracle、Fixture Episode Runner、Core/Contract、PGlite Integration和本机HTTP/SSE：通过。
- Real Model Mock World：Prompt v1/v2均完成连接与Telemetry验证但Schema不稳定；Prompt v3已稳定结构输出却出现Gold State Patch和语义差异；Prompt v4进一步推进至Grounding、Readiness和单个State Patch 首错，仍不能报告为语义质量Baseline。静态Fixture Completion诊断已完成。
- Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- 真实Smoke仅使用虚构Golden候选，模型没有Task、Authorization、Attempt、Outcome、Discovery或写Tool；失败按`INVALID_MODEL_OUTPUT`停止，未以Golden数据替代模型结果。
- 普通Gateway遥测、Runner报告和文件均不输出或保存Prompt/Completion和Secret；仅在显式`PRAXIS_EVAL_SHOW_COMPLETIONS=1`下，静态虚构Golden Fixture的Completion与逐次校验结果会交给本次终端，不写入持久化日志。价格未配置时成本保持`NOT_CONFIGURED`。

### External side effects

五次Smoke共37次受控、只读DeepSeek模型调用；没有数据库、餐厅平台、预约、支付或其他外部写操作。

## 2026-08-10 — Progressive Decision Model Contract verification

### Scope

Harness-only Progressive Decision Model Proposal Contract：版本化服务端Gateway请求、严格JSON/嵌套Schema、一次无效输出重试、禁止模型伪造Candidate Retrieval、Provider失败和输入边界。没有发起真实Provider请求。

### Checks

- `node --import tsx --test src/eval/restaurant-decision-eval-model-contract.test.ts`：6/6通过。请求为`JSON_OBJECT`、10秒、900 Token、`temperature: 0`、Thinking关闭、`FAIL_CLOSED`；无效输出只重试一次，Provider失败不重试，`retrievedCandidateIds`被Schema拒绝。
- `npm run typecheck`、`npm run build`、`npm run eval:decision:fixture`：通过。
- `npm test`：115 tests / 5 suites / 0 failed；本机`127.0.0.1`监听的Web/SSE回归在允许本机监听后通过。

### Modes

- Eval Model Contract / Fixture Gateway：通过。
- Progressive Decision Real Model、Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- Proposal不会写Task State、Authorization、Attempt或Outcome；Candidate Retrieval只能由独立只读Fixture/Search阶段产生。
- 未加载或输出任何DeepSeek Key、Prompt正文或真实用户数据。

### External side effects

0。只执行本地Fixture Gateway与类型检查。

## 2026-08-10 — Progressive Decision Evaluator Verification Set

### Scope

18个S0–S8单点Mutation和S7 Fixture多样性可满足性检查。没有调用DeepSeek、真实Discovery/Availability、Authorization、Adapter或外部写入。

### Checks

- `node --import tsx --test src/eval/restaurant-decision-eval-mutation.test.ts`：18/18通过。M01–M02在Preflight拒绝无效Dataset/过敏证据；M03–M18分别命中预期S1–S8首错阶段与错误码，包括`P0_HARD_CONSTRAINT_VIOLATION`和`FIXTURE_COVERAGE_GAP`。
- `npm run eval:decision:fixture`：通过，Strict Preflight为`READY_FOR_EVALUATOR`，7个Fixture Journey全部Pass。
- `npm run typecheck`、`npm run build`：通过。
- `npm test`：109 tests / 5 suites / 0 failed；本机`127.0.0.1`监听的Web/SSE回归在允许本机监听后通过。

### Modes

- Dataset Annotation、Strict Complete、Fixture Oracle、Evaluator Verification、Core/Contract、PGlite Integration和本机HTTP/SSE：通过。
- Progressive Decision Real Model、Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- 当Fixture本身不能提供Gold要求的多样性时，Scorer给出`FIXTURE_COVERAGE_GAP`，不把该问题计为模型选择失败。
- 真实模型、Web、Task Runtime、Authorization、Adapter和外部写路径未被调用或修改。

### External side effects

0。只执行本地Fixture、类型检查、构建、PGlite和本机HTTP/SSE测试。

## 2026-08-10 — Progressive Decision S6–S8 Fixture Oracle verification

### Scope

Golden Seed v0.7、S6 Candidate Retrieval、S7 Selection/Diversity、S8 Response Grounding和过敏候选卡“仍需餐厅确认”披露。全部为Harness-only：没有调用DeepSeek、真实Discovery、Availability、Authorization、Adapter或外部写入。

### Checks

- `npm run eval:decision:preflight:complete`：通过，`READY_FOR_EVALUATOR`；7个Pool、29个Candidate、417个Fact、7个Episode、17个Turn、17个Labeled、0个Pending、0个Issue。
- `npm run eval:decision:fixture`：通过。7个Journey均Pass；S1–S4各17个Pass，S5为5个Pass/12个`NOT_APPLICABLE`，S6为11个Pass/6个`NOT_APPLICABLE`，S7为10个Pass/7个`NOT_APPLICABLE`，S8为17个Pass。
- 定向Eval测试：23/23通过。覆盖Preflight的过敏披露Fact边界、Perfect Oracle，以及S1/S3/S5/S6/S7/S8的单点Mutation和首错归因。
- `npm run typecheck`、`npm run build`：通过。
- `npm test`：91 tests / 5 suites / 0 failed；本机`127.0.0.1`监听的Web/SSE回归在允许本机监听后通过。

### Modes

- Dataset Annotation、Strict Complete、Fixture Oracle、Core/Contract、PGlite Integration和本机HTTP/SSE：通过。
- Progressive Decision Real Model、Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- 明确不支持严重花生过敏的Fixture Candidate进入检索或选择时得到`P0_HARD_CONSTRAINT_VIOLATION`；不得用多样性掩盖。
- DGS06每个可展示候选均必须携带引用`attributes` Fact的确认披露；遗漏时在S8得到`RESULT_GROUNDING_REQUIRED_DISCLOSURE_MISSING`。
- Fixture Oracle通过只证明Dataset、Scorer与归因自洽，不代表DeepSeek或产品已经具备渐进决策能力。

### External side effects

0。只执行本地Fixture、类型检查、构建、PGlite和本机HTTP/SSE测试。

## 2026-08-10 — Eval-only Reducer and S1–S5 Fixture Oracle verification

### Scope

Eval-only State Reducer、S1–S5确定性Scorer、首错/Blocked归因、Fixture Oracle CLI和首批Mutation。新增结构化Prediction只在评测进程使用；不连接DeepSeek，不修改生产Task State、Authorization、Command、Web、Adapter或外部执行。

### Checks

- `npm run eval:decision:fixture`：通过。Strict Preflight为`READY_FOR_EVALUATOR`；Fixture Oracle对7个Episode全部Pass，S1–S4各17个Pass，S5为5个Pass、12个`NOT_APPLICABLE`。
- 定向Eval测试：19/19通过；包括Reducer修正/清除/不变性、Perfect Oracle、S1/S3/S5单点Mutation首错归因和缺失Prediction fail closed。
- `npm run typecheck`、`npm run build`：通过。
- `npm test`：87 tests / 5 suites / 0 failed；本机`127.0.0.1`监听的Web/SSE用例在允许本机监听后通过。
- Markdown相对链接检查：通过。

### Modes

- Dataset Annotation、Strict Complete、Fixture Oracle、Core/Contract、PGlite Integration和本机HTTP/SSE：通过。
- Progressive Decision Real Model、Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- 任何缺失Prediction被fail closed；评分器仅计算报告，不能写Task State、Authorization、Attempt或Outcome。
- `BLOCKED_BY_UPSTREAM`不被重复计为下游根因；Fixture Oracle通过不报告为真实模型分数。

### External side effects

0。只执行本地Fixture、类型检查、构建、PGlite和本机HTTP/SSE测试。

## 2026-08-10 — DGS06 completion and strict Golden Seed verification

### Scope

Golden Seed v0.6及DGS06四个Turn：无日期宽泛Dinner保留、无地理锚点Flexible追问、人数范围修正、严重花生过敏候选呈现与敏感信息披露Consent边界。Preflight Contract调整为允许无日期`DAYPART`，其他已知时间精度仍要求日期。没有修改生产Parser、Web、Runtime、Adapter或外部写路径。

### Checks

- 定向`restaurant-decision-eval-preflight.test.ts`：15/15通过；新增覆盖无日期`DAYPART`保留与Exact仍需日期、无锚点Flexible追问、过敏请求备选、明确不支持排除及敏感披露未同意前不得提交。
- `npm run eval:decision:preflight`与`npm run eval:decision:preflight:complete`：均通过，`READY_FOR_EVALUATOR`；7个Pool、29个Candidate、417个Fact、7个Episode、17个Turn、17个Labeled、0个Pending、0个Issue。
- `npm run typecheck`与`npm run build`：通过。
- `npm test`：83 tests / 5 suites / 0 failed；本机`127.0.0.1`监听的7个Web/SSE用例在权限允许后通过。未授权沙箱首次运行的7项`EPERM`仅为监听限制，不是代码失败。
- Markdown相对链接检查：通过。

### Modes

- Dataset Annotation Draft、Strict Complete / Fixture Preflight、Core/Contract、PGlite Integration和本机HTTP/SSE：通过。
- Progressive Decision Real Model、Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- Fixture中“可接受过敏请求”不被表述为可安全接待；来源有处理流程也仍须餐厅确认；明确不支持严重花生过敏的候选被排除。
- Consent Card目前只作为Golden/Eval和设计门禁：未获用户对外披露过敏信息的确认，不得提交预约或过敏请求。

### External side effects

0。只执行本地类型检查、构建、Fixture Preflight、PGlite和本机HTTP/SSE测试。

## 2026-08-10 — DGS05 core-ready recommendation verification

### Scope

Golden Seed v0.5及DGS05四个Turn的Gold：开放约会需求、最小澄清、核心字段闭合即推荐、不得虚构口味排除、宽泛Dinner下的候选/Slot陈述，以及反馈后收敛为非套餐的亲密用餐选项。没有修改Contract、Schema、Preflight、Reducer、Scorer或生产代码。

### Checks

- 定向`restaurant-decision-eval-preflight.test.ts`：13/13通过；新增覆盖不从约会推断人数、只补地点、无“不吃辣”反馈时辣味候选仍合格、以及后续非套餐反馈的收敛结果。
- `npm run eval:decision:preflight`：通过，`READY_FOR_ANNOTATION`；7个Pool、29个Candidate、417个Fact、7个Episode、17个Turn、13个Labeled、4个Pending，0个Issue。
- Markdown相对链接检查：通过。
- `npm test`与`eval:decision:preflight:complete`：按Golden Seed分级验证规则未运行；本轮没有触发全量回归条件，且4个Pending为已知状态。

### Modes

- Dataset Annotation Draft / Fixture Preflight：通过。
- Strict Complete、Real Model、Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- 未表达的“不吃辣”不进入State或候选排除条件；Fixture Slot不被描述为用户确切时间匹配、真实有位或已可订。
- 候选、偏好、容量、属性和Slot均来自虚构Fixture，没有模型调用或外部执行。

### External side effects

0。只执行本地定向测试、Fixture Preflight和Markdown检查。

## 2026-08-10 — DGS04 Gold targeted verification

### Scope

Golden Seed v0.4及DGS04三个Turn的Gold：最小核心追问、8人容量过滤、宽泛Dinner推荐、安静排序偏好、全面禁烟硬约束和反馈后候选收敛。没有修改Contract、Schema、Preflight、Reducer、Scorer或生产代码。

### Checks

- 定向`restaurant-decision-eval-preflight.test.ts`：12/12通过；新增覆盖T01不提前检索、T02排除容量不足候选、T03排除吸烟区并禁止把Hachi声称为已证实安静。
- `npm run eval:decision:preflight`：通过，`READY_FOR_ANNOTATION`；7个Pool、29个Candidate、417个Fact、7个Episode、17个Turn、9个Labeled、8个Pending，0个Issue。
- Markdown相对链接检查：通过。
- `npm test`与`eval:decision:preflight:complete`：按Golden Seed分级验证规则未运行；本轮没有触发全量回归条件，且8个Pending为已知状态。

### Modes

- Dataset Annotation Draft / Fixture Preflight：通过。
- Strict Complete、Real Model、Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

- 候选、容量、氛围、禁烟属性和Slot均来自虚构Fixture；没有模型调用、真实Availability或外部执行。
- 不把软偏好伪装成候选硬事实，也不为推荐数量放宽用户明确的禁烟约束。

### External side effects

0。只执行本地定向测试、Fixture Preflight和Markdown检查。

## 2026-08-10 — DGS03 outlet discovery and approximate-time verification

### Scope

Golden Seed v0.3、DGS03两Turn Gold、Outlet Discovery Oracle、Approximate Time、Outlet Name Fact、Sora干扰候选和Golden Seed分级验证流程。没有修改生产Parser、Prompt、Web、Task Runtime、Restaurant State、数据库Schema或Provider Adapter。

### Checks

- `npm run typecheck`：通过。
- `npm run build`：通过。
- 定向`restaurant-decision-eval-preflight.test.ts`：11/11通过；新增覆盖检索后才可见的Outlet集合、Discovery/Eligibility分离、Approximate 19:30、禁止发明Window和非目标餐厅过滤。
- `npm test`：79 tests / 5 suites / 0 failed；既有HTTP/SSE测试使用本机`127.0.0.1`临时监听，其余为本地Fixture/PGlite路径。
- `npm run eval:decision:preflight`：通过，`READY_FOR_ANNOTATION`；7个Pool、29个Candidate、417个Fact、7个Episode、17个Turn、6个Labeled、11个Pending，0个Issue。
- `npm run eval:decision:preflight:complete`：本轮不重复运行；根据新分级规则，只在全部Gold完成或进入Evaluator/Baseline门禁时运行。

### Modes

- Dataset Annotation Draft / Fixture Preflight：通过。
- Strict Complete Preflight：未运行，原因是11个Pending为已知状态。
- Fixture Oracle、Real Model Mock World、Replay、Live Read-only、Controlled Live-write：未运行。

### Safety

- Approximate Time不会被Schema静默转换为Exact或有界Window；检索前Candidate事实不进入允许Grounding集合。
- 所有Outlet和Slot均为虚构Fixture，没有模型调用、真实Availability、Authorization或外部执行。

### External side effects

0。只执行TypeScript编译、Fixture Preflight、PGlite和本地HTTP/SSE测试。

## 2026-08-10 — Domain Knowledge and Memory staging documentation verification

### Scope

Data/Context、Search和Roadmap文档中的Domain Entity Observation、Interaction Event、Aggregate Insight、Private User Memory与Freshness-aware复用边界。本轮没有修改代码、数据库Schema、Prompt、配置、Provider Adapter或产品行为。

### Checks

- 文档分层检查：Conversation、Task State、外部实体Observation、群体Aggregate和个人Memory职责互不替代。
- Stage检查：2C只新增Restaurant Domain-owned的最小Observation/Event Contract，并明确只采集、不参与在线排序；通用Knowledge Platform、Trending和个性化仍有真实数据与评审门槛。
- Grounding检查：缓存事实保留Source、`observedAt`和Freshness；Availability、价格、条款及现实执行前仍要求按用途刷新或重新验证。
- Markdown相对链接检查：通过；README、AGENTS和`docs/`内Markdown链接无缺失目标。

### Modes

- Design / documentation verification：通过。
- Mock、Replay、Real Model、Live Read-only和Controlled Live-write：未运行；本轮没有可执行实现。

### Safety

- 未引入跨用户Memory读取、自动在线学习、群体数据回写个人偏好或过期缓存支持现实声明的路径。
- Provider内容继续受来源缓存、展示、署名和删除政策约束。

### External side effects

0。只修改和读取本地Markdown文档。

## 2026-08-10 — DGS02 and constraint-relaxation pair verification

### Scope

Golden Seed v0.2、DGS02/DGS07 Gold、单约束Fallback Oracle、Preflight同意门禁、干扰Candidate以及Episode批量标注流程。没有修改生产Parser、Prompt、Web、Task Runtime、Restaurant State、数据库Schema或Provider Adapter。

### Checks

- `npm run typecheck`：通过。
- `npm run build`：通过。
- 定向`restaurant-decision-eval-preflight.test.ts`：9/9通过；覆盖DGS01、DGS02严格品牌结果、DGS07零结果双Fallback、用户选择后的单字段更新、缺失同意、严格结果非空时禁止Fallback、悬空引用和运行时结构防护。
- `npm test`：77 tests / 5 suites / 0 failed；既有HTTP/SSE测试使用本机`127.0.0.1`临时监听，其余为本地Fixture/PGlite路径。
- `npm run eval:decision:preflight`：通过，`READY_FOR_ANNOTATION`；7个Pool、28个Candidate、374个Fact、7个Episode、17个Turn、4个Labeled、13个Pending，0个Issue。
- `npm run eval:decision:preflight:complete`：按设计非零退出，`BLOCKED_PENDING_HUMAN_LABELS`并准确列出剩余13个Pending Turn。

### Modes

- Dataset Annotation Draft / Fixture Preflight：通过。
- Strict Complete Preflight：仅因剩余人工Gold按设计阻断。
- Fixture Oracle、Real Model Mock World、Replay、Live Read-only、Controlled Live-write：未运行；Reducer、阶段Scorer和Model Contract尚未实现。

### Safety

- Mutation验证`requiresUserChoice: false`和严格Eligible非空时触发Fallback均被Preflight拒绝。
- Fallback只使用虚构Fixture；没有真实Availability、模型调用、状态写入、Authorization或外部执行。

### External side effects

0。只执行TypeScript编译、Fixture Preflight、PGlite和本地HTTP/SSE测试。

## 2026-08-10 — DGS01 Gold verification

### Scope

DGS01人工Gold、宽泛Daypart下的Slot Grounding语义、Golden Seed统计和相关Eval/Roadmap文档。没有修改生产Parser、Prompt、Web、Task Runtime、Restaurant State、数据库Schema或Provider Adapter。

### Checks

- `npm run typecheck`：通过。
- `npm run build`：通过。
- 定向`restaurant-decision-eval-preflight.test.ts`：6/6通过；新增断言验证东京日期、`DAYPART/DINNER`、Ginza `AREA`、直接推荐、价格/子类型多样性，以及允许展示Slot但禁止声称精确时间匹配。
- `npm test`：74 tests / 5 suites / 0 failed；既有HTTP/SSE测试使用本机`127.0.0.1`临时监听，其余全部为本地Fixture/PGlite路径。
- `npm run eval:decision:preflight`：通过，`READY_FOR_ANNOTATION`；6个Candidate Pool、22个Candidate、291个Fact、6个Episode、1个Labeled Turn、14个Pending Turn，0个Issue。
- `npm run eval:decision:preflight:complete`：按设计非零退出，`BLOCKED_PENDING_HUMAN_LABELS`并准确列出剩余14个待人工标注Turn。

### Modes

- Dataset Annotation Draft / Fixture Preflight：通过。
- Strict Complete Preflight：仅因剩余Pending Gold按设计阻断。
- Fixture Oracle、Real Model Mock World、Replay、Live Read-only、Controlled Live-write：未运行；Reducer、阶段Scorer和Model Contract尚未实现。

### Safety

- Slot只作为虚构Fixture Fact接受Grounding，不表示符合用户的确切时间、真实Availability或可订承诺。
- 命令不加载`.env`、不读取DeepSeek Key、不产生模型请求、Task Event、数据库写入、Authorization或外部副作用。

### External side effects

0。只执行TypeScript编译、Fixture Preflight、PGlite和本地HTTP/SSE测试。

## 2026-08-09 — Progressive Decision Golden Seed and S0 Preflight verification

### Scope

Eval v2 Dataset/Fixture/Annotation Contract、6个Golden Seed Episode、Candidate Fixture、S0 Dataset Preflight、CLI和5个Contract测试。没有修改生产Parser、Prompt、Web、Task Runtime、Restaurant State、数据库Schema或Provider Adapter。

### Checks

- `npm run typecheck`：通过。
- `npm run build`：通过。
- 定向`restaurant-decision-eval-preflight.test.ts`：5/5通过，覆盖Draft可标注状态、Pending严格阻断、悬空Candidate引用、重复Fact ID、完整Gold样例和不可信运行时结构。
- `npm test`：73 tests / 5 suites / 0 failed。首次沙箱运行66/73通过，7个既有Stage 2B HTTP/SSE场景因`listen EPERM 127.0.0.1`失败；允许本机回环监听后同一命令完整通过，不是产品或本次Eval代码失败。
- `npm run eval:decision:preflight`：通过，`READY_FOR_ANNOTATION`；6个Candidate Pool、21个Candidate、278个Fact、6个Episode、15个Pending Turn，0个Issue。
- `npm run eval:decision:preflight:complete`：按设计非零退出，`BLOCKED_PENDING_HUMAN_LABELS`并准确列出15个待人工标注Turn；证明未完成Gold不能进入Evaluator阶段。

### Modes

- Dataset Annotation Draft / Fixture Preflight：通过。
- Strict Complete Preflight：按设计阻断Pending Gold。
- Fixture Oracle、Real Model Mock World、Replay、Live Read-only、Controlled Live-write：未运行；Reducer、阶段Scorer和Model Contract尚未实现。

### Safety

- 所有Candidate、Availability和Fact均为虚构Fixture；输出不代表真实餐厅或空位。
- 命令不加载`.env`、不读取DeepSeek Key、不产生模型请求、Task Event、数据库写入、Authorization或外部副作用。
- Gold保持人工所有权，当前代码未自动填充语义Label。

### External side effects

0。只运行TypeScript编译、Fixture Preflight、PGlite/本地既有测试；没有真实模型、餐厅平台、外部数据库或预约写入。

## 2026-08-09 — Restaurant Progressive Decision Eval v2 plan verification

### Scope

Eval v2计划、数据覆盖、评分规则、错误等级、候选门槛和Roadmap/架构/工程文档同步。本轮没有修改TypeScript、Prompt、数据集、Evaluator、Web、Task Runtime、Restaurant State或Provider Adapter。

### Checks

- Markdown相对链接：通过，检查README、AGENTS和`docs/`共41个Markdown文件，0个缺失目标。
- 状态扫描：通过；当前Source of Truth不再把真实DeepSeek标记为“尚未运行”，并明确2026-08-08的1条结果只是Connectivity Smoke，不是质量Baseline。
- 范围扫描：通过；Eval v2统一标记为`Draft / HARNESS_ONLY`，Roadmap和Harness文档均未声称产品已支持渐进决策。
- `npm run typecheck`、`npm test`、`npm run build`：未运行；本轮没有修改代码、配置、Schema或构建输入。

### Modes

文档静态验证：通过。Fixture Eval、Real Model Eval、Replay、Live Read-only和Controlled Live-write：本轮均未运行。

### Safety

计划保留模型无Task/Authorization/Attempt/Outcome写权限、真实模型显式付费门禁、Prompt/Response脱敏以及Mock/Real/Live结果分离。

### External side effects

0。没有模型、数据库、餐厅平台或其他外部网络调用。

## 2026-08-08 — Local configuration and Eval command boundary verification

### Scope

Git忽略的本地`.env`、可提交模板，以及`dev`、真实模型Eval和真实PostgreSQL smoke的原生配置加载。没有提供或读取真实Key、数据库凭据、Provider网络、预约平台或外部数据库。

### Checks

- Node.js 24.4.1支持`--env-file-if-exists`；命令在`.env`不存在时不因加载器失败。
- `npm test`、`npm run build`、`npm run eval:intent:fixture`和`npm run eval:search:fixture`脚本不含`.env`加载；它们不能隐式读取本地DeepSeek或数据库凭据。
- `npm run eval:intent:deepseek`继续保留`PRAXIS_ALLOW_LIVE_MODEL_EVAL=1`的既有fail-closed门禁；本轮未设置开关或Key，未发起网络请求。
- `npm run typecheck`、`npm run build`：通过。
- `npm run eval:intent:fixture`：8/8 Fixture样例通过，`p0Errors: 0`。
- `npm run eval:search:fixture`：3/3断言通过。
- `npm test`：通过，68 tests / 5 suites / 0 failed。沙箱内首次运行的7个本地HTTP/SSE用例因禁止监听`127.0.0.1`报`EPERM`；允许本机回环监听后同一命令完整通过，不是产品失败。

### Modes

配置/命令静态验证：通过。真实Model Eval、真实PostgreSQL smoke、Replay、Live Read-only和Controlled Live-write：未运行。

### Safety

`.env`和`.env.*`被Git忽略，只有`.env.example`可提交；Web不读取任何本地配置变量。真实模型与真实PostgreSQL命令仍需各自既有的显式门禁。

### External side effects

0。没有读取真实凭据、没有网络调用、数据库连接或外部写入。

## 2026-08-08 — First controlled DeepSeek Intent Eval

### Scope

使用本地服务端配置和显式付费门禁运行`restaurant-intent-eval-v1`的1条真实模型样本`I01-complete-tonight-yakiniku`。只验证Intent Parser与固定数据集，不创建Task、不写数据库、不调用餐厅平台。

### Checks

- `npm run eval:intent:deepseek`：通过，`mode: REAL_MODEL`。
- 样本：1/1有效输出，1/1精确匹配；所有字段准确率均为1；阻塞字段漏检率为0；不必要追问率为0；`p0Errors: 0`。
- Provider：DeepSeek；模型：`deepseek-v4-flash`。
- 模型调用：1次成功、0次失败、0次重试；总延迟约3950ms。
- Token：输入325、输出96、合计421；成本状态为`NOT_CONFIGURED`，因为本次未配置价格变量，未猜测费用。

### Modes

Real Model Eval：通过（仅1条样本）。Fixture、Mock、Replay、Live Read-only和Controlled Live-write：本条未运行。

### Safety

真实模型输出仍只经过Parser和Domain Schema Validator；本次Eval没有进入Task Runtime或任何外部副作用路径。运行完成后`PRAXIS_ALLOW_LIVE_MODEL_EVAL`已恢复为`0`。

### External side effects

1次DeepSeek API请求，可能产生供应商费用；没有数据库、餐厅平台或预约写入。

## 2026-08-08 — Stage 2B Persistent Agent Shell验证

### Scope

PostgreSQL Workspace Migration、Pilot Session、持久Conversation、Case/Activity/Artifact Projection、Persistent Restaurant Agent、Responsive Web、HTTP API与SSE重连。仍使用Fixture Model/Search；没有生产身份、通知、真实Provider、Authorization、外部写入或预约。

### Checks

- `npm run typecheck`：通过。
- Stage 2B定向HTTP/SSE测试：7/7通过；覆盖Responsive页面Contract、W01–W05、缺失信息续聊和陈旧版本409。
- `npm test`：通过，68 tests / 5 suites / 0 failed。沙箱内首次定向HTTP测试因禁止监听`127.0.0.1`报`EPERM`，允许本机回环监听后通过；不是产品失败。
- `npm run build`：通过。
- `npm run eval:intent:fixture`：8/8 Fixture样例通过，`p0Errors: 0`。
- `npm run eval:search:fixture`：3/3 Fixture断言通过。
- In-app Browser QA：通过；1280×800 Desktop与390×844 Mobile完成登录、创建Case、候选选择和Activity检查。Mobile切为单列、Case列表横向滚动、Composer按钮占满容器且无页面横向溢出；页面Console无Error/Warning。QA中发现并修复Desktop `Sign out`按钮窄屏换行。

### Modes

- Unit/Contract、Mock Harness、Embedded-postgres Integration、Local Fixture HTTP/SSE：通过。
- Local Browser视觉/交互：手动通过；Real PostgreSQL、Real Model Eval、Browser Adapter Fixture、Replay、Live Read-only、Controlled Live-write：未运行。

### Safety

- 跨用户Case和SSE均返回404；业务API只使用服务端Session解析的`userId`。
- W05证明Conversation中的“预约成功”文本不会改变Task Version、Phase、Event Activity或Outcome Artifact。
- Candidate Selection只到`AWAITING_AUTHORIZATION`；测试路径中Authorization、Attempt和`EXTERNAL_WRITE`均不存在。

### External side effects

0。测试只使用本机进程、PGlite和Fixture Model/Search；没有真实模型、平台、预约或外部数据库调用。

### Limitations

- PGlite只证明Embedded-postgres Integration，不能替代真实PostgreSQL测试；本轮未获得专用测试数据库写入配置，因此没有运行`npm run test:postgres:live`。
- 已完成单一In-app Browser的两个Viewport QA，但尚未覆盖Chrome/Safari差异、真实移动设备触控、可访问性审计或自动化视觉回归。

## 2026-08-08 — Web-first Agent Workspace文档验证

### Scope

ADR-0006、Agent Gateway/Workspace架构、MVP/User Flow、Stage 2B–2D Roadmap、Interfaces、Data/Context/Security、Arch Guard、Harness和工程记录同步。没有修改代码、数据库Schema、模型、Provider、Adapter或现实副作用行为。

### Checks

- Markdown相对链接：通过，检查README和`docs/`共38个Markdown文件，0个缺失目标。
- 阶段与术语扫描：通过；当前Source of Truth中没有残留“Stage 2B直接接Live Discovery”“Stage 2C为Availability”或“Task Runtime是所有交互顶层总指挥”的旧描述。Dev Log中的旧文字保留为历史记录，并由2026-08-08条目明确改变。
- `npm test`：首次沙箱运行61/63通过，2个Local Web/API测试因禁止监听`127.0.0.1`报`EPERM`；允许本机测试监听后重跑，63 tests / 5 suites / 0 failed。
- `npm run typecheck`、`npm run build`：未运行；本轮没有TypeScript或构建输入改动。

### Modes

- Unit/Contract、Mock Harness、Embedded-postgres Integration、Local Fixture HTTP：完整稳定基线通过。
- Real PostgreSQL、Real Model Eval、Replay、Live Read-only、Controlled Live-write：未运行；本轮没有对应实现或平台改动。

### Safety

- Conversation、Activity和Artifact被定义为非权威Projection，不能改变Task、Authorization、Attempt或Outcome。
- Stage 2B继续使用Fixture Model/Search，不新增外部网络、通知渠道或写操作。
- 用户隔离、跨设备恢复和Conversation非权威性新增为Golden `W01–W05`场景规格，尚未实现，不能报告为产品能力。

### External side effects

0。测试只使用本机进程、PGlite和Local Fixture HTTP，没有真实模型、平台、预约或外部数据库调用。

## 2026-08-07 — Stage 2A Local Fixture Search Web验证

### Scope

Restaurant `UNDERSTANDING / NEEDS_INPUT / SEARCHING / AWAITING_SELECTION`状态、必填Trace、Local-only Fixture ModelGateway/Search、HTTP/HTML本地入口、候选选择和Fixture Search Eval。没有真实DeepSeek、真实Provider、Authorization、预约、外部写入或真实PostgreSQL Smoke。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，63 tests / 5 suites / 0 failed；包括2个Local Web/API HTTP端到端场景和1个Fixture Search Eval Contract。
- `npm run eval:search:fixture`：通过，`mode: FIXTURE`、3/3断言通过：完整请求返回3候选、缺字段只请求日期/时间/人数、选择停在授权前。
- `npm run build`：通过。
- `npm run eval:intent:fixture`：通过，8条Fixture Intent样例全部通过；仅证明Fixture Oracle、Schema与计分器，不能作为DeepSeek质量分数。

### Modes

- Fixture Model / Fixture Search / Local HTTP API：通过。
- Mock Restaurant Booking Harness、Embedded-postgres Integration：完整基线维持通过。
- Real PostgreSQL：本轮未重跑。
- Real Model Eval、Replay、Live Read-only、Controlled Live-write：未运行。

### Safety

- Model输出经既有Parser和Schema Validator后才成为`INTENT_PARSED` Event；不直接写Task State。
- 所有Event必须携带Trace并匹配Task Run；不再为旧Fixture补默认值。
- 选择候选只到`AWAITING_AUTHORIZATION`；本阶段没有Authorization、Policy Commit或`EXTERNAL_WRITE`。

### External side effects

0。Fixture Model/Search和HTTP测试均在本机进程内；没有网络Provider、真实餐厅或预约调用。

### Limitations

- 本轮未完成浏览器视觉手测；本地HTTP端到端测试已经覆盖页面入口和JSON路径。开发者可通过`npm run dev`在`127.0.0.1:3000`手动检查Fixture页面。
- Fixture Search只覆盖三条演示路径；不验证真实Discovery、实体合并、Availability、30秒预算或模型质量。

## 2026-08-07 — Roadmap and Stage 1 review verification

### Scope

Roadmap阶段重划、扩展投资门槛、Agent实现原则、测试投入原则和文档状态修正。业务代码、Schema、Provider Adapter和外部执行均未修改；本次重新运行Stage 1基线以核实完成状态。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，61 tests / 5 suites / 0 failed；其中20个PGlite集成场景。
- `npm run build`：通过。
- Markdown相对链接：通过，共检查64个Markdown文件。
- Secret模式扫描：通过，排除`node_modules/`、`dist/`与`.git/`后未发现API Key、数据库凭据或私钥。

### Modes

- Unit/Contract、Mock Harness、Embedded-postgres Integration：通过。
- Real PostgreSQL：本次未重跑；此前隔离本机Smoke结果仍单独记录。
- Real Model Eval、Replay、Live Read-only、Controlled Live-write：未运行。

### Review conclusion

- Stage 1测试足以支持Runtime、Policy、Verifier、Outbox、恢复和Provider Contract完成结论。
- 这些结果不证明Web可用、DeepSeek质量、Search质量、真实Availability或预约成功率。
- Stage 2测试应优先覆盖同一条Web/API/Search纵向路径；不再用未来Runtime测试数量延后产品闭环。
- Goal Graph、Scheduler和合成Domain属于已验证架构探针；只有Roadmap中的真实触发条件出现后才恢复扩建。

### External side effects

0。没有真实模型、平台、预约或外部数据库调用。

## 2026-08-07 — Stage 1I Synthetic Runtime Domains验证

### Scope

Harness-only Recurring Shopping、Long-running Case及其与持久化Task Runtime/Trigger的集成；不含真实Shopping、支付、外部Case系统、模型、Browser或数据库外部副作用。

### Checks

- `npm run typecheck`：通过。
- `src/infrastructure/postgres/postgres-runtime.test.ts`：通过，20 tests / 1 suite / 0 failed。
- `npm test`：通过，61 tests / 5 suites / 0 failed。
- `npm run eval:intent:fixture`：通过，8个Fixture样本全部通过；`mode: FIXTURE`、`exactMatchRate: 1`、`p0Errors: 0`，不作为模型分数。
- `npm run build`：通过。
- Markdown相对链接：通过，共检查README、AGENTS和`docs/`内37个文件。
- Secret模式扫描：通过，排除`node_modules/`与`dist/`后未发现API Key、数据库凭据或私钥。
- `G01-recurring-shopping`：持久化Trigger/Fake Clock在到期后只进入`WAITING_USER`；确认后仅有`PREPARE`命令；下一周期再次等待确认，`EXTERNAL_WRITE`为0。
- `G02-long-running-case`：外部材料请求进入`WAITING_USER`，材料补齐后才再次准备，外部解决进入`SUCCEEDED`；`EXTERNAL_WRITE`为0。

### Modes

- Harness/Embedded-postgres Integration：通过，PGlite与Fake Clock。
- Mock Restaurant Harness、Fixture Eval：维持通过，未在本条重复运行。
- Real PostgreSQL、Real Model Eval、Live Read-only、Controlled Live-write：未运行。

### Safety

- 合成Shopping不存在自动购买或外部写命令；每周期必须由`CONFIRM_PURCHASE` Event重新开启。
- 合成Case的外部事件只能经Event状态机推进，不直接写Task State；无材料时不产生再准备命令。

### External side effects

0。仅PGlite内存数据库写入；没有网络、真实购买、真实Case提交或真实预约。

### Limitations

- 这两个Harness Domain不代表产品功能、第二个真实Domain或生产Scheduler桥接。
- Coordination仍只有Goal Graph聚合场景，独立状态机未实现；跨Domain Child Task/自动激活继续保持proposed。

## 2026-08-07 — Stage 1H Restaurant Intent Parser and Controlled Real Model Eval验证

### Scope

Restaurant Prompt/Parser、强化Intent Schema Validator、真实模型Eval Adapter、Token/成本计分与付费网络门禁；没有真实Key、Provider网络、Task State、数据库或预约平台。

### Checks

- `npm run typecheck`：通过。
- Restaurant Domain、Eval与DeepSeek Connector定向测试：通过，20 tests / 1 suite / 0 failed。
- `npm test`：通过，59 tests / 5 suites / 0 failed。
- `npm run eval:intent:fixture`：通过，8个Fixture样本全部通过；`mode: FIXTURE`、`exactMatchRate: 1`、`p0Errors: 0`，不作为模型分数。
- `npm run build`：通过。
- Markdown相对链接：通过，共检查README、AGENTS和`docs/`内37个文件。
- Secret模式扫描：通过，排除`node_modules/`与`dist/`后未发现API Key、数据库凭据或私钥。
- Parser Contract：验证版本化JSON Prompt、用户文本以JSON字符串传递、一次无效输出重试、两次无效后结构化表单降级、Provider失败不改变Task State。
- Real Model Eval Contract：验证付费开关、样本数和价格配置门禁、Golden数据集复用、Provider/模型/Token/成本聚合和Retry计数。
- `npm run eval:intent:deepseek`（未设置开关）：按预期退出，提示需要`PRAXIS_ALLOW_LIVE_MODEL_EVAL=1`；执行在构造Gateway前停止，0次网络调用。

### Modes

- Parser/Real Eval Connector Contract：通过，Fake ModelGateway/Fake Fetch；没有网络。
- Fixture Eval：维持通过，但仍是Fixture Oracle。
- Real Model Eval、Replay、Live Read-only、Controlled Live-write：未运行或未实现。

### Safety

- 未通过JSON、`finish_reason`和Domain Schema三层校验的模型结果不会以`PARSED`返回。
- JSON/Schema错误最多触发一次只读模型重试；Provider失败不重试，直接降级。
- 真实Eval必须同时具备服务端Key、模型名和显式付费网络开关；Token价格缺失时不生成虚构成本。

### External side effects

0。没有模型网络调用、Provider调用、数据库写入或真实预约副作用。

### Limitations

- 本轮证明Parser/评测的Contract和门禁，不证明DeepSeek的实际意图理解、JSON可靠性、速度、配额或成本。
- 当前Golden数据集只有8条；首次真实结果必须单独归档，之后再扩充错例集。

## 2026-08-07 — Stage 1G DeepSeek Model Gateway Provider Contract验证

### Scope

Core `ModelGateway` Contract、DeepSeek非流式Chat Completion HTTP Adapter、配置门禁、超时、错误归类和无内容Telemetry；不包含Restaurant Intent Parser、真实Key、真实网络或任何Task状态变更。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，52 tests / 5 suites / 0 failed。
- DeepSeek Connector Contract：5个场景通过。验证固定Endpoint、Bearer Header、`JSON_OBJECT`请求格式、内部Task ID不出站、Prompt/Completion不进入Telemetry、未配置模型fail-closed、429归类、请求超时和畸形响应拒绝。
- `npm run build`：通过。
- Markdown相对链接：通过，共检查README、AGENTS和`docs/`内37个文件。
- Secret模式扫描：通过，排除`node_modules/`与`dist/`后未发现API Key、数据库凭据或私钥。

### Modes

- Connector Contract：通过，Fake Fetch；不含网络。
- Fixture Eval：维持通过，但仍是Fixture Oracle。
- Replay、Real Model Eval、Live Read-only、Controlled Live-write：未实现或未运行。

### Safety

- Adapter没有Tool Call、Task Runtime、Policy或平台Adapter依赖，不能产生Task State或现实副作用。
- 真实Key及Provider正文未读取、未打印、未写入测试工件；Telemetry只保存脱敏调用元数据。

### External side effects

0。没有模型网络调用、Provider调用、数据库写入或真实预约副作用。

### Limitations

- 尚未验证真实DeepSeek凭证、账号权限、配额、模型可用性、延迟或价格。
- 后续真实Intent Eval必须显式启用并单独报告，不得与本条Connector Contract混报。

## 2026-08-07 — Stage 1F Intent Eval Harness验证

### Scope

Restaurant Intent Draft Schema Validator、8条固定Intent数据集、Fixture Eval Runner和字段级指标；没有DeepSeek API、网络、Browser、Provider或真实预约。

### Checks

- `npm run typecheck`：通过。
- `npm run eval:intent:fixture`：通过，8个Fixture样本全部通过Schema与Golden比对；报告`mode: FIXTURE`、`exactMatchRate: 1`、`p0Errors: 0`。
- `npm test`：通过，47 tests / 5 suites / 0 failed。
- Eval Contract：Fixture基线、阻塞字段漏检为P0、畸形模型输出被Schema Validator拒绝。
- `npm run build`：通过；编译产物Smoke可加载Intent Evaluator和Schema Validator。
- 相对链接：通过，共检查README、AGENTS和`docs/`内37个Markdown文件。
- Secret模式扫描：通过，排除`node_modules/`与`dist/`后未发现API Key、数据库凭据或私钥。

### Modes

- Fixture Eval：通过，8个样本。
- Replay Eval：框架支持、当前未运行真实Replay。
- Real Model Eval：未实现，未运行；DeepSeek Gateway和Key尚未接入。
- Live Read-only、Controlled Live-write：未实现或未运行。

### Safety

- Eval的模型输出只进入Schema Validator，不能直接写Task State或触发搜索/预约。
- Fixture Oracle分数不作为模型质量或发布依据。

### External side effects

0。没有模型网络调用、Provider调用、数据库写入或真实预约。

### Limitations

- 当前样本数为8，仅用于建立评测契约，不足以代表真实用户分布。
- 真实模型、Prompt版本、token/成本/延迟与重试统计将在DeepSeek Gateway接入后记录。

## 2026-08-07 — Stage 1E Trigger/Scheduler验证

### Scope

持久化定时Trigger、到期Claim、租约恢复、确定性Event、陈旧版本淘汰和有界失败；没有模型、Browser、Provider或真实预约。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，44 tests / 5 suites / 0 failed。
- Embedded-postgres Integration：18个PGlite场景通过；新增Trigger未到期不投递、到期单次投递、租约过期重领、期望版本陈旧转`OBSOLETE`及失败上限转`FAILED`。
- `npm run build`：通过。
- 编译产物导入Smoke：通过，`TriggerScheduler`与`PostgresTriggerStore`可从`dist/`加载。
- Real PostgreSQL smoke：通过。真实PostgreSQL 17中由Scheduler把Booking子Task推进为`SUCCEEDED`，随后验证Route就绪和Goal聚合。
- 后置只读清理检查：`praxis_schema_migrations=4`；`goals`、`tasks`、`task_events`、`task_commands`、`goal_task_memberships`、`task_dependencies`和`task_triggers`均为0行。
- 相对链接：通过，共检查README、AGENTS和`docs/`内37个Markdown文件。
- Secret模式扫描：通过，排除`node_modules/`与`dist/`后未发现API Key、数据库凭据或私钥。

### Modes

- Mock Harness：维持通过，11个Restaurant场景。
- Embedded-postgres Integration：通过，18个PGlite场景。
- Real PostgreSQL smoke：通过，隔离本机`praxis_smoke`数据库。
- Replay、Live Read-only、Controlled Live-write：未实现或未运行。

### Safety

- 过期或已完成Trigger不会重复投递Event。
- 陈旧Task版本的Trigger标为`OBSOLETE`，不会修改当前Task状态。
- Trigger的Factory或Dispatch失败仅作有界重试，不会无限循环。

### External side effects

仅本机隔离测试数据库创建Schema、临时Task、Goal与Trigger并清理；0次网络Provider或真实预约副作用。

### Limitations

- 尚无生产常驻Scheduler进程、Domain Trigger Factory、Webhook或周期计划表达。
- Real Smoke不替代生产权限、并发负载、备份恢复或跨节点故障测试。

## 2026-08-07 — Stage 1D Goal/Task Graph验证

### Scope

持久化Goal、Task成员/父子关系、依赖条件、Readiness、环检测与Goal聚合；没有模型、Browser、Provider或真实预约。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，40 tests / 5 suites / 0 failed。
- Embedded-postgres Integration：14个PGlite场景通过；新增`G03-coordination-parent-child`和上游失败/环依赖保护。
- `npm run build`：通过。
- 编译产物导入Smoke：通过，`PostgresGoalGraph`与Goal Contract可从`dist/`加载。
- Real PostgreSQL smoke：通过。真实PostgreSQL 17中创建Goal、Root Task、两个关键子Task和依赖；确认Route先为`WAITING`，Booking完成后为`READY`，两个关键Task完成后Goal为`ACHIEVED`。
- 后置只读清理检查：`praxis_schema_migrations=3`；`goals`、`tasks`、`task_events`、`task_commands`、`goal_task_memberships`和`task_dependencies`均为0行。
- 相对链接：通过，共检查README、AGENTS和`docs/`内37个Markdown文件。
- Secret模式扫描：通过，排除`node_modules/`与`dist/`后未发现API Key、数据库凭据或私钥。

### Modes

- Mock Harness：维持通过，11个Restaurant场景。
- Embedded-postgres Integration：通过，14个PGlite场景。
- Real PostgreSQL smoke：通过，隔离本机`praxis_smoke`数据库。
- Replay、Live Read-only、Controlled Live-write：未实现或未运行。

### Safety

- Task不能加入多个Goal；依赖双方必须属于同一Goal。
- 自依赖、依赖环和同一Downstream的混合条件被拒绝。
- 依赖Graph只计算Ready/Waiting/Blocked，不直接启动Domain，也不产生外部副作用。

### External side effects

仅本机隔离测试数据库创建Schema、临时Task与Goal并清理；0次网络Provider或真实预约副作用。

### Limitations

- 尚未实现跨Domain Child Task Command/Registry、自动激活、Scheduler或三个合成Domain。
- Real Smoke不替代生产权限、并发负载、备份恢复或跨节点故障测试。

## 2026-08-07 — Real PostgreSQL Smoke

### Scope

在新建、隔离的本机`praxis_smoke`数据库上运行真实PostgreSQL 17 Smoke。没有DeepSeek、Browser或真实Provider调用。

### Checks

- 本机PostgreSQL：`17.10 (Homebrew)`，监听本机端口`55432`。
- `PRAXIS_TEST_DATABASE_URL=postgresql://wangzhour@127.0.0.1:55432/praxis_smoke PRAXIS_ALLOW_TEST_DATABASE_WRITE=1 npm run test:postgres:live`：通过，输出`real-postgres-smoke: pass`。
- 后置只读检查：`praxis_schema_migrations=2`；`tasks=0`、`task_events=0`、`task_commands=0`。

### Modes

- Real PostgreSQL smoke：通过，隔离本机数据库。
- PGlite Embedded-postgres Integration：见下一条记录，已通过。
- Replay、Live Read-only、Controlled Live-write：仍未实现或未运行。

### Safety

- 写入由`PRAXIS_ALLOW_TEST_DATABASE_WRITE=1`显式门禁。
- 目标是新建的本机测试数据库；Smoke只留下Schema，临时Task及相关Event/Command已清理。

### External side effects

仅本机测试数据库建表、写入与清理；0次网络Provider或真实预约副作用。

### Limitations

不代表生产网络、身份权限、备份恢复、并发负载或跨节点故障行为已经验证。

## 2026-08-07 — Stage 1B/1C PostgreSQL Runtime与Recovery验证

### Scope

PostgreSQL Task/Event/Command持久化、事务Outbox、Command Worker、租约恢复、Recovery Coordinator和Restaurant Domain恢复映射。没有DeepSeek、Browser、真实Provider或真实预约调用。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，38 tests / 5 suites / 0 failed。
- Restaurant Mock Harness：11个场景通过。
- Embedded-postgres Integration：12个PGlite场景通过，包括事务回滚、Event去重、陈旧版本、租约重领、External Write禁止盲重试、结果Event Reconcile、Runtime重建，以及`RECOVERY_REQUIRED → OUTCOME_UNKNOWN → VERIFY_BOOKING`。
- Recovery安全断言：不确定External Write只有1个`COMMIT_BOOKING`和1个`VERIFY_BOOKING`；第二次Coordinator轮询为空闲。
- `npm run build`：通过。
- 编译产物导入Smoke：通过，`RecoveryCoordinator`与Restaurant Recovery Event Factory可从`dist/`加载。
- `npm audit --omit=dev`：通过，0 vulnerabilities；沙箱内首次因DNS不可用失败，经只读网络授权后完成。
- 相对链接：通过，共检查README、AGENTS和`docs/`内37个Markdown文件。
- Secret模式扫描：通过，排除`node_modules/`与`dist/`后未发现API Key、数据库凭据或私钥。

### Modes

- Mock Harness：通过，11个Bootstrap场景。
- Embedded-postgres Integration：通过，12个PGlite场景。
- Real PostgreSQL smoke：未运行；当前环境没有PostgreSQL服务或容器Runtime。
- Replay：未实现，未运行。
- Live Read-only：未实现，未运行。
- Controlled Live-write：未实现，未运行。

### Safety

- State、Event和Command Outbox在同一事务提交或回滚。
- External Write失败或租约失效且无结果Event时不会重新Lease。
- Recovery只投递Domain Event并进入验证，不重复预约提交。
- Worker Event与Recovery Event使用不同确定性ID，Reconcile不会把Recovery误判为成功结果。

### External side effects

0。PGlite只在本进程内写入测试数据库；没有网络Provider、真实PostgreSQL或现实事务副作用。

### Limitations

- `npm run test:postgres:live`需要用户提供可写测试数据库和显式写入开关，本轮未满足条件。
- 尚无生产Queue进程、Schema Migration并发部署门禁或运营恢复界面。
- 当前目录仍没有可被Git识别的`.git`元数据，无法执行`git diff`范围检查。

## 2026-08-07 — Stage 1B Trace、Proof与Run Artifact验证

### Scope

In-memory Task Runtime Causal Trace、Restaurant Booking Proof/Completion Verifier、Restaurant State Schema `1 → 2`迁移、Mock Adapter Verification模式、Harness Run Artifact和测试入口；没有数据库、模型、Browser或真实Provider调用。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，26 tests / 4 suites / 0 failed。
- Restaurant Mock Harness：11个场景通过，包括字段冲突、错误Attempt Evidence和Run Artifact因果链。
- Restaurant Verifier Unit：4个场景通过，覆盖Strong完整匹配、Weak Evidence、错误Attempt和预约字段冲突。
- State Migration：Schema `1` Strong Evidence Fixture成功迁移为Schema `2` Proof Bundle。
- Runtime Contract：Event Trace记录、Command因果传播和无Trace旧Fixture规范化通过。
- `npm run build`：通过。
- 编译产物导入Smoke：通过，`verifyBookingCompletion`可从`dist/`加载。
- 相对链接：通过，共检查README、AGENTS和`docs/`内37个Markdown文件。
- Secret模式扫描：通过，排除`node_modules/`与`dist/`后未发现API Key或私钥。

### Modes

- Mock Harness：通过，11个Bootstrap场景。
- Replay：未实现，未运行。
- Live Read-only：未实现，未运行。
- Controlled Live-write：未实现，未运行。

### Safety

- Weak、字段冲突或错误Attempt Evidence均不能产生`BOOKED_VERIFIED`。
- Commit和Verify绑定同一个Execution Attempt；Run Artifact中的Command/Event可通过Causation ID关联。
- Existing Policy、未授权Commit、单候选失败和`OUTCOME_UNKNOWN`不重试基线继续通过。

### External side effects

0。Side Effect Ledger只记录Mock Commit，未访问网络或真实预约平台。

### Limitations

- 当前Artifact只返回内存对象，尚未实现文件持久化、Replay读取或真实数据脱敏管线。
- 当前目录仍没有可被Git识别的`.git`元数据，无法执行`git diff`范围检查。
- 本轮未改变依赖，未重复运行`npm install`或依赖审计。

## 2026-08-06 — Agent Harness调研归档验证

### Scope

Agent Harness生态调研记录、文档索引、Dev Log和本验证记录；没有业务代码、依赖、Schema、Prompt、Adapter或架构决策改动。

### Checks

- 文档相对链接：通过，共检查35个`docs/` Markdown文件；同时修复`docs/INDEX.md`原有的两处Project Positioning错误链接。
- Secret模式扫描：通过，未发现API Key、私钥或本地Secret。
- Source of Truth边界：通过；调研记录标记为`Draft`和非架构决策依据，未修改ADR或Roadmap。
- 外部项目表述：只将可明确识别的公开GitHub仓库列为已核对项目；身份不明确的项目显式标为未验证。

### Modes

- Mock Harness：未运行，本轮只修改文档。
- Replay：未运行。
- Live Read-only：未运行。
- Controlled Live-write：未运行。

### External side effects

0。只进行了公开GitHub只读调研和本地Markdown编辑。

### Limitations

当前目录没有可被Git识别的`.git`元数据，因此不能执行`git diff`或Git范围检查。`npm run typecheck`、`npm test`和`npm run build`与本次纯文档改动无关，未运行。

## 2026-08-05 — Stage 1 Mock垂直切片验证

### Scope

TypeScript Task Runtime、Policy、Restaurant状态机、Mock Adapters、Side Effect Ledger和Restaurant Harness；没有真实Provider调用。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，16 tests / 3 suites / 0 failed，其中包括8个Restaurant Mock Harness场景以及Runtime、Policy和Ledger Contract测试。
- `npm run build`：通过，生成结果进入被忽略的`dist/`。
- 编译产物导入smoke：通过，`restaurant.booking` Task Definition可从`dist/`加载。
- 文档相对链接：通过，共检查37个Markdown文件。
- Secret模式扫描：通过。
- 安全断言：未选择Commit为0、未授权Commit为0、明确失败不自动提交第二家、弱Evidence不产生Verified Outcome、`OUTCOME_UNKNOWN`禁止换候选、相同幂等键重放外部写入为1次。
- `npm install`审计：0 vulnerabilities。

首次用`tsx --test`运行时因当前沙箱禁止本地IPC socket而失败；将入口改为`node --import tsx --test`后通过。该问题与业务逻辑无关。

### Modes

- Mock Harness：通过，8个Bootstrap场景。
- Replay：未实现。
- Live Read-only：未运行。
- Controlled Live-write：未运行。

### External side effects

0。Side Effect Ledger只记录Mock预约尝试，不访问网络或真实预约平台。

## 2026-08-05 — 文档体系验证

### Scope

只涉及Markdown、README和AGENTS规则；没有业务代码、依赖、数据库、API调用或真实预约。

### Checks

- `relative-links: pass`：全部内部相对链接目标存在。
- 文档页头检查通过：设计/记录文档使用统一页头，ADR使用固定`## Status`，skills使用YAML frontmatter。
- `doc-count: 29`：计划中的`docs` Markdown文件全部存在。
- `scenario-count: 40`：Golden Scenario编号1–40完整。
- 文件时间与清单检查通过：原有研究文档未删除；本轮只更新README、项目定位、AGENTS和新建`docs`。
- Proposed边界检查通过：代码目录、API、数据实体和测试命令未描述为已经实现。
- Capability Matrix包含官方来源、状态和`2026-08-05`最后验证日期。
- Secret模式扫描未发现API Key或生产Secret；仅存在变量名、文档链接和普通任务标识。

### Modes

- Mock Harness：未实现。
- Replay：未实现。
- Live Read-only：未运行。
- Controlled Live-write：未运行。

### Limitations

文档初始化验证当时，目录没有可被Git识别的`.git`元数据，且尚无代码、package或测试命令，因此不能报告typecheck、unit、build或smoke通过。后续实现和验证结果见本文件顶部的新记录。
# 2026-08-18 — Restaurant Semantic v17 Contract and Clean Holdout Gate

### Scope

v17 Criterion strength、Prompt / Proposal / Draft / State / Scorer版本、公开合成Regression、Clean Holdout exposure artifact和私有标注Preflight adapter；没有真实餐厅平台、Authorization、预约或其他外部业务写入。

### Checks

- `npm run typecheck`：通过。
- `npm test`：通过，81 tests / 5 suites / 0 failed；localhost Fixture server测试在允许本地监听的环境中运行。
- `npm run arch:check`：通过，0 forbidden source dependencies。
- `npm run build`：通过。
- `npm run eval:semantic:fixture`：通过，`DEVELOPMENT_DIAGNOSTIC / PROMPT_AND_RESULT_EXPOSED / baselineEligible:false`，15 / 15 turn通过。
- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=15 DEEPSEEK_MODEL=deepseek-v4-flash npm run eval:semantic:deepseek`：通过，`REAL_MODEL_MOCK_WORLD`公开Regression 15 / 15；15 successful calls、0 retry、28,817 ms、44,466 reported tokens、cost `NOT_CONFIGURED`。这是公开Development Diagnostic，不是Clean Holdout Baseline。
- 获授权后仅修复私有多轮标注的一处数组分隔结构，未修改任何字段值或Gold语义。
- 10个`DUPLICATE_ID`确认均由simplified单条case adapter把同一source ID用于session和turn所致；adapter现为这种结构生成确定性session ID，保留source ID作为turn ID。新增相应回归测试。
- `node --import tsx --test src/eval/semantic-v15/holdout.test.ts`：通过，8 / 8。
- `npm test`：通过，82 tests / 5 suites / 0 failed；localhost Fixture server测试在允许本地监听的环境中运行。
- 修复adapter后重跑`npm run eval:semantic:holdout:preflight:complete`：仍为`NOT_READY`，但15个session、25个turn仅剩一项Gold/readiness一致性问题；没有模型调用或baseline artifact。
- 经用户授权完成一处最终Gold一致性修正后，`npm run eval:semantic:holdout:preflight:complete`为`READY_FOR_BASELINE`，15 session / 25 turn / 0 issue；私有case和字段详情不进入Git记录。
- `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 PRAXIS_CONFIRM_CLEAN_HOLDOUT=1 PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=25 DEEPSEEK_MODEL=deepseek-v4-flash npm run eval:semantic:holdout`：唯一Baseline完成。15次真实模型调用全成功、0 retry、34,607 ms、44,405 reported tokens、cost `NOT_CONFIGURED`；25个turn中0 pass、15个`SEMANTIC_RESULT`失败、10个`BLOCKED_BY_UPSTREAM`。artifact在首个模型请求前持久化`EXPOSED`，完成后为`RESULT_EXPOSED / reusableAsCleanHoldout:false`。
- Prompt v5：仅替换Semantic Interpreter的用户提供通用文本并更新Prompt版本；Proposal / Draft / Eval Schema、Gold、Scorer、Compiler、Reducer和Decision Kernel均未改动。
- `npm run typecheck`、`node --import tsx --test src/domains/restaurant/semantic-interpreter.test.ts`、`npm run eval:semantic:fixture`与`npm run arch:check`：通过；定向测试2 / 2，已暴露Fixture Regression 15 / 15。
- `npm test`：通过，82 tests / 5 suites / 0 failed；`npm run build`与`git diff --check`：通过。

### Modes

- Fixture / Mock / Embedded-postgres：通过；不代表真实Provider或真实PostgreSQL。
- Real Model Mock World：通过；仅已暴露的开发Regression。
- Clean Holdout：已按冻结配置运行一次，现为`RESULT_EXPOSED`，不得重跑为Clean。
- Live Read-only / Controlled Live-write：未运行。

### Safety

- Clean runner将在首个模型请求前持久化`EXPOSED` marker和冻结审计元数据；此轮因Preflight失败没有创建该artifact。
- 未访问真实餐厅平台、没有Authorization或外部业务写入。

### Limitation

必须由数据所有者修复私有标注的结构，或确认可采用的Gold会话边界；在此之前不可合法地运行一次性Baseline。

## 2026-09-05 — 仓库整改验证

typecheck、arch:check（0 forbidden dependencies）、build通过；npm test 164/164通过；test:browser:fixture 3/3通过，包含缺失ready标记必须返回BROWSER_TIMEOUT，浏览器启动错误不会误通过。5个项目Skill的quick_validate全部通过。首次沙箱执行中本地Web监听EPERM（7项）及Chromium启动权限失败；获准在沙箱外重跑上述测试后全部通过。Fixture页面由本地响应拦截提供，不是Replay或真实来源验证。未执行付费模型、私有Holdout、Live来源读写、原始H001或真实PostgreSQLSmoke；未改已有测试artifact。

## 2026-09-05 — 测试去重后验证

默认测试从164项合并为162项，npm test为162/162通过（约9.5秒）；减少的是两次相同Harness初始化和重复断言，不宣称显著性能提升。typecheck、arch:check、build、git diff --check通过；Test/Planning/Post-change三个Skill的quick_validate通过。完整离线测试在获准环境运行以允许本地Web监听。此次仅测试和文档调整，没有新增测试；本地真实浏览器Fixture未受影响，未重复运行，前次3/3仍只是此前证据。未运行Live、付费模型或私有Holdout，未改既有artifact。

## 2026-09-06 — 全量测试正文审查验证

- 默认Unit/Fixture/Mock/PGlite：npm test 159/159通过，约9.8秒；相对本轮起点162减少3个独立重复项，没有新增独立测试；前轮164→162另有历史记录。
- 冻结探针：npm run test:probes 8/8通过；不计入当前产品完成度。
- 真实Chromium + 本地Fixture：npm run test:browser:fixture 3/3通过；不访问真实来源。
- typecheck、arch:check、build、git diff --check通过。
- 独立Live Smoke脚本：对实际源码stripTypeScriptTypes后在隔离VM以假数据库/Runtime注入，success、cleanup-failure、assertion-and-cleanup-failure共3种通过；验证每种均尝试4次行清理及连接关闭，失败不打印pass，同时保留测试与清理错误。临时验证工具位于本机临时目录，未新增长期测试框架。真实PostgreSQL未运行。
- 未运行付费模型、真实来源读写或私有Holdout；Golden及既有artifact未改。审查逐项记录：[TEST-SUITE-REVIEW-2026-09-05](TEST-SUITE-REVIEW-2026-09-05.md)。

## 2026-09-06 — Tabelog / TableCheck单页Live Read-only对照

- 既有探针：`PRAXIS_ALLOW_LIVE_RESTAURANT_READ=1 PRAXIS_ALLOW_BROWSER_RUN=1 PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM npm run probe:restaurant:browser:read -- --url 'https://tabelog.com/rstLst/?sk=Ginza' --network-path UNKNOWN --timeout-ms 20000`。沙箱内启动失败`BROWSER_RUNTIME_FAILED`；获准沙箱外运行后`BOT_CHALLENGE`。不得把沙箱失败归因网站。
- 临时脚本：`node .eval-artifacts/tabelog-network-diagnostic/probe.mjs`，另运行同入口`--path-check`。Live Read-only，Chromium 151.0.7922.34，fresh headed；Tabelog搜索带query/无query均307→403及`cf-mitigated: challenge`；Tabelog首页200、正文7372字符；TableCheck首页301→200到`/en/japan`、正文2162字符。没有点击、填写、刷新或处理验证码。浏览器会话均关闭；没有读取日常profile，未删除既有eval资料。
- 证据：`.eval-artifacts/tabelog-network-diagnostic/result-1788687890382.json`与`result-1788687987117.json`；既有探针独立start/result保留在原目录。当前网络标记UNKNOWN；只读配置证据显示Xray及TUN中两站有direct规则，不能替代实际出口测量。尚无challenge子域请求证据，分流不一致仅是假设。
- 本轮仅诊断脚本和文档；脚本语法及`git diff --check`检查。未改变生产路径，未重跑Unit/Mock、本地Fixture、Replay、模型、Holdout、H001或Controlled Live-write；本结果不证明identity、slot和availability，也不证明普通Chrome相同搜索URL可访问。

## 2026-09-06 — Tabelog英文入口后续控制实验与修复验收

模式分开：下列网络观察为Live Read-only；离线回归为Unit/Mock/Fixture/PGlite，无Replay或Controlled Live-write。

- 用户原始英文地区URL：fresh headed Chromium 200；证据`result-1788688239312.json`。仅给旧`sk=Ginza` URL加`/en/`：200；证据`result-1788688282472.json`。均位于`.eval-artifacts/tabelog-network-diagnostic/`，同一当前网络但未独立测量出口。
- `node --import tsx .eval-artifacts/tabelog-network-diagnostic/probe.mjs --keyword-check`：2次public GET导航，`sw=Ginza`名称匹配，`sw=PraxisDiagnosticNoRestaurant928471`零餐厅链接，两者200；证据`result-1788688373289.json`。旧解析器误收`list-rst__rvw-count-target`评论数，本轮按观察修复。
- 修复后`node --import tsx .eval-artifacts/tabelog-network-diagnostic/probe.mjs --fixed-smoke`：1次fresh headless导航200，5个解析结果均为餐厅名称与详情链接，未收评论页；证据`result-1788688472300.json`。保留默认webdriver/headless信号；无个人profile、持久Cookie、验证码处理、点击/填写/提交/重试。会话正常关闭。脚本后续导入当前TS解析器，现需`--import tsx`，前段历史无此参数命令对应当时脚本。
- `npm run typecheck`、`npm run arch:check`、`npm run build`通过。`npm test`沙箱首次因本地HTTP监听EPERM失败；批准沙箱外重跑159/159通过，9379 ms，日志`.eval-artifacts/tabelog-network-diagnostic/npm-test.log`。`git diff --check`通过。
- 复用既有Tabelog Contract测试：新增实际导航URL断言与评论/图片链接负例；更新英文search URL和sw的脱敏/接管Fixture。无新增独立测试、无旧可执行fallback。控件操作未变，本轮不重跑真实浏览器本地控件Fixture；未运行付费模型、私有Holdout、H001、详情identity或availability，不以搜索200宣称完整预约来源通过。

## 2026-09-06 — TableCheck公开发现切片验证

- Focused：`node --test --import tsx src/integrations/tablecheck/tablecheck-browser-availability.test.ts src/integrations/restaurant-availability/availability-source-resolver.test.ts src/domains/restaurant/read-grounding.test.ts`通过`19/19`。覆盖公开名称/坐标发现、真实结果链接提取、同名分店精确电话选择、无HIGH fail closed、真实reservation link解析、no-result、page-unavailable、parse failure与原有来源fallback。
- `npm run typecheck`、`npm run arch:check`（0 forbidden dependencies）、`npm run build`及`git diff --check`通过。`npm test`初次受沙箱`listen EPERM 127.0.0.1`影响，只有7个本地server测试失败；获准在本机listener环境重跑后`162/162`通过，0 failed。
- Live Read-only观察：受控Local Chromium打开公开TableCheck搜索与两个guide页。名称加Google坐标的Sushi Inase结果含`/en/sushiinase`、Shinjuku同名分店及真实`/reserve/landing`链接；Sushisho Issekisancho也出现在同一结果集。只读取公开页面，没有登录、填写、点击、提交、预约、付款或PII。
- Live H001：离线门禁后只运行一次`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM npm run eval:restaurant:agent-loop:hybrid-live-read -- --case h001`。artifact为`.eval-artifacts/restaurant-hybrid-live-read/2026-09-06T10-03-54-484Z-ac62a317-37ef-446a-b3e7-5e0c2fc71cf1.result.json`；Semantic和两次Agent决定200，Google discovery成功。动态TableCheck搜索用尽25秒Browser deadline，最终三个候选均`BROWSER_TIMEOUT`、Loop `EXECUTION_FAILURE / FAILED`。没有详情页、reservation、HIGH identity、slot、availability或`PRESENT_RESULTS`；没有任何外部写操作。此Live结果不能代替TableCheck完整路径的成功证据。

## 2026-09-07 — Controlled Browser Executor / Local Live Web / H001

### Offline Unit / Fixture / Mock / Local HTTP-SSE

- Focused：`npm run typecheck && node --import tsx --test src/infrastructure/browser/browser-action-decision.test.ts src/infrastructure/browser/browser-task-executor.test.ts src/integrations/restaurant-availability/live-browser-availability.test.ts src/integrations/tablecheck/tablecheck-browser-availability.test.ts src/integrations/tabelog/tabelog-browser-availability.test.ts`通过；最终扩展为含Grounding与Web Live配置Contract的`37/37`。覆盖共享会话/关闭、旧/伪造目标引用拒绝、只读与权威参数、strict wire placeholder→canonical、`+81`国内号码等价、TableCheck/Tabelog现有fail-closed行为和Live模式不回落Fixture。
- 完整`npm test`在获准localhost listener环境通过；`npm run typecheck`、`npm run arch:check`（0 forbidden dependencies）、`npm run build`和`git diff --check`通过。
- `npm run test:browser:fixture`：真实本机Chromium + 本地动态Fixture为`4/4`；包含无站点专用Adapter方法的受控通用页面动作。该项只证明本地机制，不访问真实来源。
- Replay、真实PostgreSQL、私有Holdout、Controlled Live-write均未运行。

### Live Read-only

- 单页探针：`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM npm run probe:restaurant:browser:read -- --url 'https://www.tablecheck.com/en/japan/search?...' --network-path UNKNOWN --timeout-ms 20000`返回`CONTENT_OBSERVED`，浏览器为`LOCAL_PLAYWRIGHT_CHROMIUM`；没有点击、填写、slot结论或业务Evidence。
- H001先后只在明确代码修正后重跑，不作无假设重试：strict browser wire placeholder修复后的artifact为`.eval-artifacts/restaurant-hybrid-live-read/2026-09-07T03-02-19-358Z-9380b99e-537c-4ebb-a476-0275c0c3fdc1.result.json`；日本国际电话格式修复后的最终artifact为`.eval-artifacts/restaurant-hybrid-live-read/2026-09-07T03-07-31-815Z-e7b534bb-1e13-4e2a-aab2-befc6e8c1ea2.result.json`。
- 最终artifact：Semantic、三个Restaurant Agent decision和一次browser decision均为DeepSeek HTTP 200；Google发现10候选并以结构化address component支持`near Shibuya`。Sushisho Isseki Sancho的Tabelog详情达到`HIGH_EXACT_PHONE`；其availability为`EXTERNAL_BOOKING_PROVIDER_REQUIRED`，另两候选非HIGH；三个TableCheck动态搜索均为`TABLECHECK_PAGE_UNAVAILABLE`。没有日期/人数回读、明确slot、Offer、read Evidence或`PRESENT_RESULTS`，最终`NEEDS_INPUT / WAITING_USER`与`H001_NOT_COMPLETED`。这不是无空位结论。
- 所有运行均为public-page read-only；没有登录、个人资料、预约提交、付款、取消、Authorization或其他外部写操作。Local Web的Live组合仅作离线配置/HTTP-SSE Contract验证，未把它报告为一次真实来源Web成功。

## 2026-09-07 — TableCheck可恢复发现与原始H001复验

- Focused：`npm run typecheck && node --import tsx --test src/infrastructure/browser/browser-task-executor.test.ts src/integrations/tablecheck/tablecheck-browser-availability.test.ts`通过`15/15`。新增覆盖普通正文数字／`not found`不构成错误页、明确title/heading错误信号、同session的受控发现交接与动作后验证、及探索耗尽独立归因。
- 完整离线：`npm test`、`npm run typecheck`、`npm run arch:check`（0 forbidden dependencies）、`npm run build`、`npm run test:browser:fixture`（`4/4`）和`git diff --check`通过。Fixture只访问本地页面。
- Live Read-only：一次原始`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM npm run eval:restaurant:agent-loop:hybrid-live-read -- --case h001`，artifact为`.eval-artifacts/restaurant-hybrid-live-read/2026-09-07T07-25-17-542Z-8a9de9b6-9b94-4788-a1bf-21dc41d31953.result.json`。本次三页TableCheck搜索均由固定解析直接得到guide URL，因此没有实际模型接管；Sushisho Issekisancho、Sushi Inase为`HIGH_EXACT_PHONE`，但前两者`REQUEST_SELECTION_UNCONFIRMED`，第三家`TABLECHECK_ENTITY_MATCH_UNCERTAIN`。Tabelog仍分别为外部预约Provider或identity不确定。没有slot、Offer、`PRESENT_RESULTS`或外部写操作；H001为`H001_NOT_COMPLETED`。
## 2026-09-08 — 连续候选调查 / H001 Live Read-only

- Focused：Restaurant Agent的strict输出预算、每批三家检查上限，以及两个BrowserTaskExecutor共享模型总预算的覆盖均通过。
- Full offline：`npm test`在本机localhost listener环境为`195/195`；`npm run typecheck`、`npm run arch:check`、`npm run build`和`git diff --check`均通过。`npm run test:browser:fixture`使用本机真实Chromium和本地动态Fixture为`5/5`；它不访问第三方来源，也不证明真实库存。
- Live Read-only：冻结H001命令仅运行一次，artifact为`.eval-artifacts/restaurant-hybrid-live-read/2026-09-08T07-41-45-298Z-3bd0ad52-bdc3-4fe1-8bb1-e19fd41737bc.result.json`。它调查10个去重候选、批次为3/3/3/1，并在第10家形成包含同门店、完整日期、人数、目标时间与新鲜结果来源的TableCheck slot Evidence；loop为`SUCCEEDED`且终态为`PRESENT_RESULTS`。这是外部public-page read-only观测，不执行预约或其他写入；它不等同于Web页面的实际用户交互验收。
- Web Live启动验收：尝试在`127.0.0.1:3210`启动现有`LIVE_READ` workspace前，安全配置检查发现`.env`的`DATABASE_URL`解析为`https://api.deepseek.com/`，不是PostgreSQL连接串；迁移初始化报`Connection terminated unexpectedly`，服务未监听、未创建Web任务、未调用模型/Google/来源浏览器，也未写入任务数据。该配置阻塞需由环境所有者提供正确的本地PostgreSQL连接串后重试；本次没有修改`.env`。
## TEST-2026-09-09-HYBRID-DIAGNOSTICS — evaluator、物化与配置前置检查

- Unit：`diagnostic-evaluator.test.ts`覆盖证据完整的terminal result、错误`PRESENT_RESULTS`、重复调查、显式无位与来源耗尽、以及历史artifact缺少资源字段时`NOT_EVALUATED`；`live-case-materializer.test.ts`覆盖结构化和可读eligibility日期同步；Local Web测试覆盖非PostgreSQL URL在迁移前拒绝。
- 离线补评：成功H001 artifact独立输出`YES / SUPPORTED_BY_EVIDENCE / SUFFICIENT_FOR_PRESENTED_RESULT`；两个既有失败artifact保留`NO / INSUFFICIENT`，没有触发模型、浏览器、Google或Provider调用。每次补评生成新的Git忽略evaluation文件，未覆盖原artifact。
- 本机只读数据库诊断：历史专用`127.0.0.1:55432/praxis_smoke`未监听；未修改`.env`、未启动/清库数据库、未创建Web任务，故Web Live和H002–H005 Live仍未运行。H002–H005的静态相对日期物化检查通过，但不构成外部来源、库存或产品通过证据。

## TEST-2026-09-09-HYBRID-DIAGNOSTICS-V2 — 逐引用诊断与收尾接线

- Focused：`npm run typecheck && node --import tsx --test src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts`通过`9/9`。覆盖当前runner形状的`executionMetadata.providerAttempts`、正确历史结果、错日期/人数/时段、LOW identity、呈现时已过期、跨candidate借证据、缺trajectory/空resource、请求版本变更后的合法重查与同一请求的重复执行、完整time window与不适用party字段，以及执行artifact已保存后评价失败仍不覆盖原记录。
- 离线补评：对既有H001成功artifact生成新的`@2` sidecar，逐引用得到`YES / SUPPORTED_BY_EVIDENCE / SUFFICIENT_FOR_PRESENTED_RESULT`；对历史失败artifact生成新的`@2` sidecar，得到`UNKNOWN / NOT_EVALUATED / NOT_EVALUATED`，并以trajectory的稳定引用定位`REQUEST_SELECTION_UNCONFIRMED`与`EXTERNAL_BOOKING_PROVIDER_REQUIRED`。原artifact保持不变；未调用模型、浏览器、Google或Provider。
- Shared path：`npm test`在本机localhost listener环境为`205/205`；`npm run typecheck`、`npm run arch:check`、`npm run build`与`git diff --check`通过。首次沙箱运行的7个本地Web listener失败均为`listen EPERM 127.0.0.1`，获准环境重跑同一测试后通过；没有把该环境限制归因为产品失败。未运行Live或付费模型。

## TEST-2026-09-09-HYBRID-DIAGNOSTICS-V3 — precise slot、时间顺序与权威intent缺失

- Focused：`npm run typecheck && node --import tsx --test src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts`通过`12/12`。新增覆盖：18:00–20:00窗口中“evidence只有18:00、Offer为19:00”必须拒绝；`observedAt`晚于presentation必须拒绝、缺少observation为未评估；以及缺失最终`intentDraft`为未评估而不是条件冲突。
- 离线补评：既有成功H001 artifact生成新的`@3` sidecar，仍为`YES / SUPPORTED_BY_EVIDENCE / SUFFICIENT_FOR_PRESENTED_RESULT`。仅以内存副本验证slot mismatch和authority缺失；原artifact没有改动。未调用模型、浏览器、Google或Provider。
- Shared path：`npm test`在本机localhost listener环境为`208/208`；`npm run typecheck`、`npm run arch:check`、`npm run build`与`git diff --check`通过。未运行Live或付费模型。

## 2026-09-09 — Local PostgreSQL 17 smoke

- Real PostgreSQL smoke：在已启动的本机 PostgreSQL 17、专用`praxis_smoke`数据库中，以`PRAXIS_ALLOW_TEST_DATABASE_WRITE=1`运行`npm run test:postgres:live`，通过。该脚本应用0001–0009 Migration，写入并验证3个临时Task与1个Goal的Runtime、Goal Graph和Scheduler链路；随后查询确认`postgres-smoke:%`临时Task为0。此模式只证明该次本机真实数据库连接与SQL行为，不证明生产部署、备份/恢复、权限或持续可用性。
- Local workspace migration/startup：以命令级`DATABASE_URL`连接`praxis_web`启动Fixture Workspace，首页HTTP 200；`praxis_schema_migrations`含0001–0009全部ID。未创建Case、未执行Live Read、未调用模型或Provider。
- Embedded-postgres integration：`node --import tsx --test src/infrastructure/postgres/postgres-runtime.test.ts`为15/15通过。`npm run typecheck`、`npm run arch:check`、`npm run build`与`git diff --check`通过。
- `.env`未修改；其现有`DATABASE_URL`仍不适用于PostgreSQL，常规`npm run dev`与Local Web Live需要环境所有者设置正确本机连接串。没有生产、staging、Pilot、真实用户或外部业务写入。

## 2026-09-09 — Local Fixture Web browser acceptance

- 实际浏览器：在运行中的本机`http://127.0.0.1:3210` Fixture Workspace使用页面显示的本地Fixture Pilot Token登录，提交完整Restaurant请求。页面可见1个`NEEDS_YOU · AUTHORIZE` Case、3个候选、3条evidence-grounded availability、授权提示与Activity Timeline；未显示错误、Live来源或外部写入口。
- 持久化恢复：浏览器刷新后，已认证Session、Conversation、Case状态、候选Artifact和Activity完整恢复，证明此路径从`praxis_web` PostgreSQL读取而非仅保留前端内存。窄视口截图中页面保持单列可操作布局。
- 边界：本次创建了1个仅本机开发验收用的Fixture Case；没有调用模型、Provider或浏览器外部页面，没有Authorization、预约、支付、取消、PII提交或其他外部业务写入。它不替代Web Live页面真实来源交互或真实移动设备验证。

## 2026-09-09 — Local Web Live Read-only browser acceptance

- 授权/预算与模式：用户明确授权一次真实只读Web验收。启动进程以命令级`DATABASE_URL`、`PRAXIS_RESTAURANT_PROVIDER_MODE=LIVE_READ`、`PRAXIS_ALLOW_LIVE_RESTAURANT_READ=1`、`PRAXIS_ALLOW_BROWSER_RUN=1`和`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM`覆盖；现有服务器端DeepSeek、Google与浏览器配置均存在。应用边界为12个Agent step、12次浏览器模型调用、每候选6次、总自动时限300,000ms；没有改写`.env`或打印凭据。
- 实际页面路径：真实浏览器在Live标识的Workspace中新建Case并提交“Tomorrow at 7pm near Shibuya for two, omakase.”。页面活动显示10个Discovery候选、4轮availability check；持久轨迹只读核对为5个`recorded_model_attempt`、4个`GENERIC_BROWSER`步骤与17条TableCheck/Tabelog provider outcome。页面展示真实TableCheck与Google来源链接，未呈现Fixture卡片为Live结果。
- 结果与恢复：约5分钟后Agent Loop以`TIMEOUT: Agent loop exceeded 300000ms`终止；Case为`WAITING_USER / NEEDS_INPUT`，页面要求澄清。候选中显示明确`UNAVAILABLE`、`AVAILABILITY_SOURCES_EXHAUSTED`和未grounded的TableCheck观察，而非可订成功；刷新后Case、Conversation、来源链接和Activity均恢复。该记录与H001 runner artifact独立，不能把H001的`PRESENT_RESULTS`归因给Web。
- 副作用边界：此为Live Read-only；没有预约、授权提交、付款、取消、第三方登录、验证码处理或PII输入。没有重试或创建第二个Live Case。未运行完整离线套件；本次证明真实Web配置、调用、fail-closed展示与持久恢复，不证明Qualified结果、真实移动设备或长期来源可用性。

## 2026-09-09 — Shared Web/H001 budget and Live terminal-attribution recheck

- Shared limits：Web和H001均从`LIVE_READ_INVESTIGATION_BUDGET`读取30 Agent steps、5 rejected actions、20分钟外层／浏览器deadline、每候选20次Browser model call、整轮120次和每候选80次操作；Google和来源会话上限也统一。此为本次明确授权的受控Live验收上限，不是产品SLA或持续费用授权。
- Focused regression：`node --import tsx --test src/harness/restaurant-harness.test.ts src/server/local-web-server.test.ts`在本机localhost监听环境31/31通过；覆盖timeout、step limit、rejection limit均为`FAILED`且不含`pendingUserQuestion`。沙箱内同一Web测试曾因`listen EPERM 127.0.0.1`失败，获准本机监听环境重跑后通过。
- Full offline：`npm test`在本机localhost监听环境208/208通过；`npm run typecheck`、`npm run arch:check`、`npm run build`和`git diff --check`通过。
- Web Live Read-only：以命令级`DATABASE_URL=postgresql://127.0.0.1:5432/praxis_web`、`LIVE_READ`、两项Read gates及`LOCAL_CHROMIUM`启动，浏览器新Case提交“Tomorrow at 7pm near Shibuya for two, omakase.”。约4分18秒后，连续5个`PRESENT_RESULTS` proposal因`PRESENTATION_EVIDENCE_MISSING`被确定性拒绝，Loop以`AGENT_LOOP_REJECTION_LIMIT`终止。页面与只读PostgreSQL均为`FAILED`，页面原因与Activity显示该稳定码和最后拒绝原因；重新打开页面仍恢复同一状态、候选、来源链接与Activity。没有Fixture、H001 artifact复用、预约、付款、取消、第三方登录、验证码处理、PII输入或其他外部写入。结果不证明可用slot或`PRESENT_RESULTS`成功。

## TEST-2026-09-09-AVAILABILITY-FRESHNESS — offline regression

- Static gates：`git diff --check`、`npm run typecheck`、`npm run arch:check`和`npm run build`通过。
- Focused regression：Action Validator/Reducer、Agent Context、Grounding、Router、Harness和diagnostic evaluator覆盖展示证据过期后允许受限重查、展示合格结果阻止继续调查、用户刷新仅重开已展示候选且保留历史evidence、请求变化重置旧证据、来源失败保持UNKNOWN、精确slot与历史`presentedAt` freshness校验，以及重复无效Action终止。受限沙箱下HTTP监听用例不能绑定`127.0.0.1`（`EPERM`），不归因于产品；完整矩阵将在获准本机监听环境重跑。
- Live Read-only：尚未运行。本切片不会把Fixture、离线回归、H001 runner或此前两次Web Live失败记录报告为Web Live展示/刷新成功。

## TEST-2026-09-09-AVAILABILITY-FRESHNESS-V2 — Web Live observations

- Final offline：本机localhost环境`npm test`为`210/210`；`npm run typecheck`、`npm run arch:check`、`npm run build`和`git diff --check`通过。
- Actual Web Live：浏览器新建Case并提交“Tomorrow at 7pm near Shibuya for two, omakase.”。首次短8秒Google deadline三次超时，准确记录为`SEARCH_FAILED`后才由Agent请求新条件；修复为共享的30秒structured-read上限后，新Case真实调用模型、Google与TableCheck，页面以`PRESENT_RESULTS`展示Sushisho Isseki Sancho、TableCheck来源链接、2026-09-10 19:00、2人和`omakase`证据。初始搜索约57秒，唯一Availability read约1秒。
- Refresh：第一次页面刷新暴露旧fresh evidence可被直接重呈现；第二次暴露刷新标记未从Reducer清除，实际TableCheck重查产生多条新观察（约10–27秒，`USER_REQUESTED_REFRESH`、新evidence ID、policy版本和前序evidence关联），随后因旧进程未加载清理修复而重复读取。已停止该本机开发进程以避免继续消耗预算；最终代码的刷新标记清理由Reducer回归覆盖。故“真实来源重查可执行并可落盘”已验证；“加载最终修复后的单次刷新恢复到页面`PRESENT_RESULTS`”仍未在新的Live调用中复验，不能报告为完成。
- 边界：没有Fixture替代、H001替代、第三方登录、预约、授权、支付、取消、PII输入或外部写操作。

## TEST-2026-09-10-REFRESH-CLOSURE — final Web Live and scenario preflight

- Focused：`npm run typecheck`、`node --import tsx --test src/domains/restaurant/action-validator.test.ts src/application/restaurant-execution-router.test.ts`（9/9）、`npm run arch:check`、`npm run build`与`git diff --check`通过。新增回归证明：仍待处理的刷新B不会被已完成A阻断，且存在未完成刷新目标时拒绝部分展示；UNKNOWN检查清除其自身刷新标记的既有Reducer回归继续覆盖。
- Web Live Read-only：确认3000/3210/3211均无旧监听后，以`298ce3a`加本轮未提交修复、命令级本机PostgreSQL、`LIVE_READ`、两个read gate和`LOCAL_CHROMIUM`启动3211服务。实际浏览器提交“Tomorrow at 7pm near Shibuya for two, omakase.”，真实模型、Google和TableCheck产生1个2026-09-11 19:00、2人的Sushisho Isseki Sancho结果并进入`PRESENT_RESULTS`（约81秒）。点击一次页面刷新后，Activity记录`AVAILABILITY_REFRESH_REQUESTED`、一次新Availability check和新的`RESULTS_PRESENTED`（约24秒）；reload后仍显示`PRESENT_RESULTS`、TableCheck来源链接与完整Activity。无Fixture、H001替代、登录、预约、支付、取消、PII或其他外部写入。
- H002–H005 static preflight：相对日期会在Asia/Tokyo物化；H002的spicy food/hot pot为NEGATIVE HARD但当前Evidence契约没有可审计的“明确不提供/不含”事实，价格与first-date也只有soft事实要求，不能评完整结果。H003/H004/H005均为`NEAR_USER`，但冻结case未提供`PRAXIS_EVAL_USER_LAT/LNG`；H004另需独立营业时间来源，不可拿预约slot替代。因此本轮未运行H002–H005的Live调用，不伪造位置、缺失证据或结果。

## TEST-2026-09-10-FACT-GROUNDED-H002-H005 — offline slice and interrupted Live record

- Focused regression：`node --import tsx --test src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts src/eval/restaurant/agent-loop/case-fact-policy.test.ts src/domains/restaurant/intent-draft.test.ts src/integrations/google/google-places-restaurant-search.test.ts`为`22/22`。覆盖H002案例专属否定类型事实的满足/冲突/未知、H004在无人数时必须有HIGH identity、区域、cafe HARD与适用营业时间而不要求Offer，以及`NEAR_USER`仅接受任务或显式评估半径的区域依据。
- Web location HTTP回归已包含在完整套件：附近Case只接受一次设备坐标，命名区域拒绝坐标写入，拒绝/失败后手输地点沿普通消息路径继续。该自动化测试不代表用户真实浏览器的权限点击；未保存精确个人位置。
- H003 Hybrid Live：复核后确认先前“只生成started”的判断错误。三次均已写入完整result与evaluation（`2026-09-10T07-30-30-318Z-78653782-3260-4a6a-afb0-8895233f855a`、`2026-09-10T07-34-05-411Z-67ca2955-8fc1-4d01-9f91-dcb53c1ac39a`、`2026-09-10T07-35-41-402Z-9448df53-fa9f-4c8b-b7ca-7520933d909f`）。这是超过每例一次授权的错误重复，后续停止重跑。每次约281/353/304秒、30个Agent decision、12个候选，TableCheck与Tabelog各12次只读尝试，全部为`PROVIDER_FAILURE`并保留为候选`UNKNOWN / AVAILABILITY_SOURCES_EXHAUSTED`；没有空位或无位声明。三次均因Semantic将冻结HARD条件改写或降级为SOFT，使`AUTHORITATIVE_CONDITIONS=NOT_SATISFIED`；无Offer、呈现或REQUIRED_EVIDENCE结论。H002/H004/H005未执行。
- H002 Hybrid Live：一次完整运行，artifact为`2026-09-10T08-12-54-814Z-cb458684-35d1-4721-bb9f-a65a40ae279a.result.json`，55,618ms后`STEP_LIMIT / FAILED`。实际Semantic遗漏冻结`party_size`且改写`first date`，故`AUTHORITATIVE_CONDITIONS=NOT_SATISFIED`；Google只发现一个候选，缺少适用Higashi-Ginza区域事实。三次Google读取额度耗尽后仍有重复搜索，30次Agent decision、0次Browser model/runtime和0次availability check。没有预约来源读取、Offer、展示、空位或无位声明。H004/H005未执行。
- Complete matrix：`npm run typecheck`、`npm run arch:check`、`npm test`（本机监听环境`223/223`）和`npm run build`通过；`git diff --check`通过。普通沙箱内同一完整套件的10项Web监听用例因`listen EPERM 127.0.0.1`无法启动，获本机监听权限后全部通过；这不是产品失败。

## TEST-2026-09-10-GOAL-DRIVEN-READ-PATH — offline regression

- Static gates：`git diff --check`、`npm run typecheck`、`npm run arch:check`、`npm run build`均通过。
- Focused coverage：目标而非人数决定事实／空位展示、空位目标缺人数、Google预算耗尽后换词被拒绝、Context脱敏的来源可用状态、通用负向HARD的满足／冲突／未知、以及Evaluator按`target.goal`独立复核，均纳入现有Domain、Grounding、Evaluator和Fixture回归。
- Full offline：获准loopback监听环境运行`npm test`，`226/226`通过；单独`src/server/*.test.ts`为`12/12`通过。初始受限沙箱的`listen EPERM 127.0.0.1`只影响本地Web listener，获准环境重跑后无产品失败。
- Live / paid model：未运行。H002/H003/H004历史artifact保持原样，H005未启动；Fixture和离线通过不被报告为新的Web Live验收。

## TEST-2026-09-10-NO-PROGRESS-CLOSURE — offline regression

- 新增Harness回归：Google discovery在零候选前返回`GOOGLE_SEARCH_BUDGET_EXCEEDED`时，只发生一次失败读取，随后持久化`AGENT_LOOP_NO_PROGRESS`；预置的改写检索动作没有执行，也没有转成`NEEDS_INPUT`。
- 完整验证：受准本机loopback环境`npm test`为`227/227`通过；`npm run typecheck`、`npm run arch:check`、`npm run build`和`git diff --check`通过。普通受限沙箱中的完整测试仍只因`127.0.0.1`监听被拒绝而有9项server测试失败，获准环境重跑后全部通过。
- Live / paid model：未运行；不改变或替代既有H001/H002/H003/H004 artifact，也没有启动H005。

## TEST-2026-09-11-CANDIDATE-FACT-INVESTIGATION — offline regression

- 定向覆盖：Action Validator拒绝未知或已完成候选事实调查；Router只把已知candidate与权威推荐Intent交给事实Port；Google事实读取以返回的相同Place ID生成candidate关联的`RESTAURANT_FACT`，并与Discovery共享调用上限。事实读取不产生Availability、Offer或写操作。
- 完整验证：受准本机loopback环境`npm test`为`230/230`通过；`npm run typecheck`、`npm run arch:check`、`npm run build`和`git diff --check`通过。普通受限沙箱中的9个Web listener测试仍仅因`listen EPERM 127.0.0.1`无法绑定，获准环境重跑后无产品失败。
- Live / paid model：未运行；该代码切片不消耗或重置H001/H002/H003/H004既有只读额度，H005仍未启动。

- 补充共享额度回归：事实读取在Discovery已经耗尽额度时不发出第二个Google调用，持久化candidate `UNKNOWN`与稳定耗尽码；正常事实重读仍产生同候选来源事实。该行为与既有“换检索词不得绕过额度”覆盖互补。

- Composition回归：Fixture Eval、Mock Harness和Local Web server在同一事实动作目录下均有事实Port；Fixture/Mock只返回`UNKNOWN`且不提供来源事实。受准loopback环境相关测试`35/35`通过；未运行Live或付费模型。

## TEST-2026-09-11-STABLE-SOURCE-FACTS — offline regression

- Focused coverage: Google `primaryType` no longer proves `not hot pot`/`not Sichuan`; explicit conflicts remain observable. Google fact reads use `GET /v1/places/{PLACE_ID}` with Details field mask, and per-run counter isolation rejects a second call in one run while allowing an independent run. Browser website facts require matching JSON-LD name/address and do not retain visible prose; a mismatch is `UNKNOWN`.
- Full offline: `npm run typecheck`、`npm run arch:check`、`npm run build`、`git diff --check`均通过；经授权本机loopback环境`npm test`为`234/234`通过。受限沙箱的首次完整测试仅有九项localhost listener `EPERM`，不是产品失败。Live/paid model未运行，仍待按既有H002/H004授权和实际预算记录另行核对。

- Web Live Read-only authorization audit: H002 and H004 had only older Hybrid artifacts, so their explicitly authorized one Web run each remained available. Started final-code `LIVE_READ` Workspace on local PostgreSQL 17 with command-scoped localhost URL, existing server-only model/Google keys, and `LOCAL_CHROMIUM`; `.env` was not edited. H004 (`restaurant:410b63606df1935b29f99169`, ~19s) ran from browser input “今天下午在东银座附近找一家适合和朋友见面的咖啡馆，不需要预约。” and H002 (`restaurant:cb503a22ef3e74100627eeb3`, ~12s) ran from browser input “明天晚上在东银座站附近找餐厅，两个人。不想要火锅店，也不要四川或湖南等以辣味为主的菜系。请给有来源依据的推荐，不需要预约。” Each trace has 3 real model decisions, 1 Google Discovery and 2 Place Details calls; a third candidate Details read was locally rejected with `GOOGLE_SEARCH_BUDGET_EXCEEDED`. Both then correctly became `NEEDS_INPUT`: returned candidates had `Ginza` area facts but no evidence for `Higashi-Ginza`. No qualifying Browser website fact, availability read, Offer, availability/no-availability claim, login, booking, payment, cancellation or external write occurred. Each case has consumed its one authorized Web run; this is an execution/evidence gap, not a successful Web acceptance.

## TEST-2026-09-11-CITED-SOURCE-FACT-INVESTIGATION — offline regression

- Focused: `node --test --import tsx src/domains/restaurant/action-validator.test.ts src/domains/restaurant/read-grounding.test.ts src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts src/integrations/google/google-places-restaurant-search.test.ts src/integrations/restaurant-facts/google-listed-website-facts.test.ts src/integrations/restaurant-facts/model-fact-judgment.test.ts` passed `56/56`. It covers named-place coordinate/radius evidence, source-level ambiguity, near/far candidates, goal-driven recommendation readiness, time boundaries, visible website facts without JSON-LD, formatting-tolerant address identity, same-name conflict, cited/uncited/broad negative-type judgments, and legal refresh rechecks.
- Complete matrix: privileged local-loopback `npm test` passed `248/248`; `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check` passed. This validates code and local Web lifecycle tests only.
- Live / paid model: not run. No new H002/H004 Web run was started, no H001/H003/H005 runner was started, and no Fixture/Replay result is reported as Live. Earlier Web authorization/budget consumption remains unchanged. No external write, credentials or personal location were stored.

- Follow-up recommendation-refresh regression: focused `action-validator`, `agent-context` and local Web tests passed `31/31`. It verifies a presented fact recommendation dispatches only `CANDIDATE_FACTS_REFRESH_REQUESTED`, permits one bounded new fact read for its displayed target, rejects availability routing and blocks presentation until the target produces a new observation. Live remains unrun.

## TEST-2026-09-12-READ-PATH-REVIEW — development diagnostic / frozen e504a3f

- 定向命令：`node --import tsx --test src/domains/restaurant/action-validator.test.ts src/domains/restaurant/read-grounding.test.ts src/integrations/restaurant-facts/google-listed-website-facts.test.ts src/integrations/restaurant-facts/model-fact-judgment.test.ts src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts`；53/53通过。
- 另在临时脚本调用当前生产函数/类，合成来源与模型传输，取得[审查报告](READ-PATH-REVIEW-2026-09-12.md)所列10项反例观察。它们证明现有覆盖遗漏，不是新Golden、真实模型或Live来源结果；未将故障脚本加入默认测试，也未修改原始artifact。
- 文档验证：4个修改的SKILL frontmatter/结构校验、修改文档的本地链接与新增锚点核对、规程职责一致性及`git diff --check`；无产品代码变化。未重跑全量测试/typecheck/build/真实浏览器Fixture/Live，未调用付费模型或访问私有Holdout。当前实现仍存在报告所列缺口。

## TEST-2026-09-12-CURRENT-FACT-LIFECYCLE — offline regression

- Focused: `npm run typecheck` plus `node --import tsx --test` over Action Validator, Google discovery, website facts, model judgments and the diagnostic evaluator passed `57/57`. The integration-shaped regressions prove a fresh fact `UNKNOWN` cannot reuse an old qualifying fact; zero exact named-place matches cannot use the search first item; same-name/same-number cross-city website text is UNKNOWN; identity-only JSON-LD can continue to same-page visible facts; and a cited derived fact is accepted only through candidate-bound raw source evidence.
- Browser goal contract now permits fact-only work to omit unprovided reservation parameters. Recommendation `nearby` without a device coordinate is intentionally incomplete, so the Web path collects a one-shot device location or ordinary manually entered place before discovery. A later semantic update can reopen a previously `FAILED` read-only case; it does not retry a provider or alter a completed historical outcome.
- No Live, paid model, real browser source, login, booking, payment, cancellation, credential change, personal location storage, or external write occurred. H002/H004 prior Web authorization consumption and all existing budget records remain unchanged.

- Complete matrix: privileged loopback `npm test` passed `254/254`; `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check` passed. The real local Chromium dynamic-fixture suite initially could not launch inside the restricted sandbox (`MachPortRendezvous` permission denied), then passed `5/5` under the approved local-browser execution context. Those fixtures validate browser mechanics only, not an external source or Web Live result.

## TEST-2026-09-12-LIVE-RUN-LIFECYCLE — offline / local Web regression

- Final matrix: privileged loopback `npm test` passed `257/257`; `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check` passed. The real local Chromium dynamic-fixture suite passed `5/5`. Evaluator @7 rejects duplicate `INVESTIGATE_CANDIDATE_FACTS` for the same request unless the persisted metadata contains the enumerated refresh reason; availability behavior remains covered by the same rule.
- Local Web: privileged loopback tests verify that a `LIVE_READ` POST returns an `ACTIVE` Case before a deliberately blocked source read completes; `DELETE /api/cases/:id/run` aborts that source signal, records `AGENT_LOOP_CANCELLED`, and appends a cancellation summary without results. A separate restart-shaped test verifies that an in-flight Live Case with no application owner is persisted as an explicit interrupted failure rather than silently resumed.
- Live / paid model: not run. This instruction granted no new Live budget; H001–H005 historical allowances and artifacts are unchanged. Fixture/local Web verification does not claim a real provider, model, browser source, or `PRESENT_RESULTS` success. No credential, precise location, booking, payment, cancellation, login, or external write occurred.

## TEST-2026-09-14-H001-H005-WEB-LIVE — actual read-only Web observations and post-run regression

- Offline integration first: before this Live sequence, the current Application/Router/Grounding/Reducer/Evaluator composition was exercised with only model/API/page boundaries substituted; it was not a hand-constructed State. After the Live observations, `npm test` under approved localhost binding passed `260/260`, `npm run typecheck` passed, and focused real HTTP/SSE/PGlite Web tests passed `17/17`. Restricted sandbox runs cannot bind `127.0.0.1` (`EPERM`); the privileged loopback reruns are the authoritative Web test result.
- H001 (`restaurant:dbd5ecf6da6d2e15ce72894b`, artifact run `5ad70538-a795-4ce9-9b19-066e10616c33`): future Shibuya omakase availability request ran about 287.9s, made 18 Agent decisions, discovered candidates and performed real TableCheck/Tabelog read attempts. It ended `WAITING_USER / NEEDS_INPUT`: no candidate had both verified omakase evidence and a confirmed matching slot. No card claimed a slot or no-vacancy; cost and browser-model-call count remain `UNKNOWN` in the artifact.
- H002 (`restaurant:b118b8b8fbaefc229620a873`): the future first-date, no-hot-pot/no-Sichuan-Hunan fact recommendation stopped at the real Semantic Interpreter with `MODEL_FAILURE`; no Google or browser source call followed. The pre-fix server left this historical Case `CREATED / UNDERSTANDING` and did not write an artifact. It is the independent failure that motivated W10; it is not a source/evidence result and was not rerun.
- H003 (`restaurant:4e7db7502809e2d672af646a`): the 10-person availability request, using a manually entered named Higashi-Ginza place rather than the operator's device location, likewise stopped at real Semantic Interpreter `MODEL_FAILURE`, before any source call. It was not rerun.
- H004 (`restaurant:0f23b9474aef7fe952ce55a0`, artifact run `9e77c8ea-89ab-449e-beeb-1e1bd064f055`): future afternoon cafe fact recommendation ran about 4.4s / one Agent decision. Real Google could not resolve the named location to coordinates, so the normal path ended `FAILED / NO_PROGRESS`; no result claimed nearby compliance. The card's displayed `partySize` missing field is a separate UI projection defect for fact-only goals, not a reason to ask for reservation parameters.
- H005 (`restaurant:b91d832cb57541eb6521f175`, artifact run `7d733c20-2812-489a-88ee-5da53c403895`): future 19:00 party-of-four local-food availability request ran about 282.6s / eight Agent decisions. It made three Google discovery reads (then recorded the per-run search budget exhaustion) and three real `GENERIC_BROWSER` availability reads. TableCheck/Tabelog entity/provider failures remained candidate-scoped `UNKNOWN / AVAILABILITY_SOURCES_EXHAUSTED`; it entered `WAITING_USER / NEEDS_INPUT` without saying there was no vacancy. The evaluator sidecar preserves provider attempt references and classifies the execution as `FAILED / NOT_EVALUATED`, not a qualified result.
- All three existing Web artifacts and independent evaluator sidecars are under ignored `.eval-artifacts/restaurant-web-read/`; source URLs are stored only in their existing redacted fields. No fixture/replay stood in for Live, no case was run twice, no real device location permission was accepted, and no booking/payment/cancellation/login/PII/external write occurred. No `PRESENT_RESULTS` claim is made for this sequence.

## TEST-2026-09-14-LIVE-DEBUG-GOOGLE-BUDGET — offline integration regression

- Static: `npm run typecheck` passed. The full Provider/Router/Web accounting change uses one explicit `LIVE_READ_DEBUG_INVESTIGATION_BUDGET.maxGoogleRequests=100` in both Web and Hybrid runner; the obsolete Details limit was removed.
- Cross-module fixture integration: the focused Provider/Router/Web run passed `39/39`, then the final approved localhost `npm test` matrix passed `264/264`. It verifies total/category accounting across named-place resolution, discovery and Details; failed sent calls count; same-run cumulative isolation; local exhaustion is not relabeled as service rate/permission/network failure; Router preserves failure usage; and ordinary Web artifact retains limit plus category totals. No real model, Google, browser source, account change, booking or external write was invoked.


## 2026-09-14 H001–H005 Hybrid Live 单次诊断（当前dirty工作区）

- 用户授权每例一次真实只读Runner；实际H001–H005各运行一次，没有重跑、Fixture或Web Live。
- 当前HEAD fd0dfb0，含Terra未提交修复；运行前后diff哈希一致。16次模型调用、48,903记录tokens、约61秒，费用UNKNOWN。
- H001：目标解释为RECOMMENDATION，与冻结AVAILABILITY冲突；10家发现、9家事实调查、旧本地每run Google请求上限耗尽，NEEDS_INPUT，无slot调查。
- H002：GOOGLE_LOCATION_UNRESOLVED→NO_PROGRESS/FAILED；H003：Proposal漏AREA→补问；H004：漏日期且评估坐标仅传Adapter、未到State→补问位置；H005：漏DATE、使用UTC钟面02:52而非Tokyo11:52→补问日期。
- 五例均PROPOSED，未复现MODEL_FAILURE；均未PRESENT_RESULTS，不能称验收通过或来源无位。每例原始execution及独立evaluation已保存。
- 详细首错、证据边界、资源及artifact索引：[批次报告](../../.eval-artifacts/hybrid-batch-2026-09-14/1789354306/REPORT.md)。报告为忽略目录本地证据，未提交。

## TEST-2026-09-14-HYBRID-REAL-COMPOSITION — offline integration

- 复现：原Runner只将东银座评估坐标传给Google Adapter，权威`intentDraft`仍无坐标，Agent Context正确判定`nearby`缺位置并在来源调用前补问；上下层各自通过不能证明此接线。
- 修复：Runner与`hybrid-read-composition.test.ts`共同调用实际初始化组合。冻结评估位置在语义编译后以`EVALUATION_LOCATION_BOUND`进入权威State，保留`source: EVALUATION`；无位置分支不注入默认坐标且Google HTTP调用为0。普通Web仍由真实PGlite/HTTP位置与手动地点回归覆盖，未把Runner成功当作Web验收。
- 完整组合：外部替换仅为显式合成的合法Semantic/Agent模型传输、Google HTTP响应及未触发的Browser Runtime。真实内部链穿过Interpreter、Compiler、Reducer、Agent Context、Validator、Router、Google Grounding和三个Place Details，在第4个Google请求后展示；artifact从实际snapshot/trajectory补评为`taskProducedQualifiedResult=YES`。这不证明真实模型、Google或浏览器网站。
- 预算：Provider回归实际发送100个同run discovery请求后，第101个请求在本地边界被拒绝且未发网络；新run再次可用。它与组合中的1 Discovery + 3 Details共同证明旧3次限制已不再截断正常调查。
- 最终验证：获准本机loopback `npm test`通过`268/268`；相关真实持久Web HTTP/SSE、组合与Google回归通过`33/33`，另有三项真实Hybrid组合回归（含旧的Adapter-only位置注入反例）。真实Chromium本地动态Fixture通过`5/5`，只访问本地页面。受限沙箱本身不能绑定`127.0.0.1`（`EPERM`），所以loopback结果在获准环境重跑；这是环境限制而非测试行为失败。
- 模式/副作用：本条只运行离线模型、HTTP和Browser替身；没有读取`.env`、运行真实来源、付费模型、Web Live、外部写入、提交或推送。

## TEST-2026-09-14-DETERMINISTIC-TIME-AND-COMPLETION — offline integration

- 时间链：实际Hybrid组合从Semantic Interpreter → Compiler → Reducer → Agent Context → Validator → Router → Google Grounding → 展示 → artifact → 独立Eval运行；外部仅替换模型传输、Google HTTP与未触发的Browser Runtime。`TOMORROW`与`AFTERNOON`由固定东京参考时刻物化为下一日及12:00–17:00，并在权威Draft保留原表达、参考时刻、时区、依据和结果；另有跨东京日界的相对分钟回归。
- 证据链：来源Grounding的无匹配slot先产生`UNAVAILABLE`，Reducer再绑定日期/时段/人数请求指纹；Validator拒绝用旧营业事实展示同一候选。未知、失败或不同请求条件不被当作无位。
- 完成诊断：实际artifact的独立Evaluator分别验证`QUALIFIED_RESULT`、`NO_CONFIRMABLE_RESULT`与`INTERNAL_EXECUTION_FAILURE`；后者不再获得正常无结果的支持性结论。该测试不证明真实模型选择、实时来源可用或主观推荐质量。
- 模式/副作用：仅离线模型/API/浏览器替身；无Live、付费模型、外部写入、提交或推送。完整门禁和本地Chromium Fixture结果在本轮结束后补记。
- 最终门禁：获准本机loopback环境下`npm test`通过`272/272`，`npm run typecheck`、`npm run arch:check`、`npm run build`和`git diff --check`均通过；真实Chromium本地动态Fixture为`5/5`。受限沙箱直接绑定`127.0.0.1`会报`EPERM`，已在同一离线测试命令的获准loopback环境重跑通过；这不改变测试替身边界。


## TEST-2026-09-14-TEMPORAL-LIVE-RECHECK — shared strict schema failure

在最新未提交确定性时间改动上，先运行相关离线12/12，再按新授权跑H001–H005各一次真实Hybrid。五例均HTTP400/PROVIDER_REJECTED：DATE/TIME_WINDOW显式值Schema包含raw但required漏列raw；本地实际Schema递归检查复现两个路径。无模型生成、Google或Browser来源调用，没有业务写入，未重跑。五份execution与独立evaluation均已保存，费用/token未返回，标UNKNOWN。源码哈希在批次期间一致。详见[批次报告](../../.eval-artifacts/hybrid-recheck-2026-09-14/1789372826/REPORT.md)。

## TEST-2026-09-14-DEEPSEEK-STRICT-SEMANTIC-SCHEMA-REPAIR — offline

- 修复：显式`DATE`和`TIME_WINDOW`值的`raw`现在在strict Schema、本地Validator、Prompt示例及Fixture/公开Regression输入中一致为必填非空字段；未关闭strict、未加重试或fallback。
- Gateway边界：实际DeepSeek HTTP body中的`tools[0].function.parameters`经过递归检查，所有含`properties`的对象均有同键集合的`required`；它直接覆盖此前Provider拒绝的两个路径，而不是只验证伪造completion。
- 验证：语义Contract、Interpreter、Fixture、公开Semantic Eval和DeepSeek Gateway相关测试`35/35`通过；`npm run typecheck`、`npm run arch:check`、`npm run build`与`git diff --check`通过。
- 模式/副作用：仅离线模型传输替身；未运行Live、付费模型、Google、Browser来源或外部写入，未提交或推送。


## TEST-2026-09-14-STRICT-SCHEMA-FIXED-HYBRID — Live Read-only

- 当前HEAD fd0dfb0加Terra未提交修复；src/web-skills源码哈希运行前后相同。先实际Gateway/Interpreter请求侧预检9/9，再按授权H001–H005各一次真实Hybrid，不重跑、不替代Web Live。
- 五例Semantic均PROPOSED，无旧HTTP400。H001 555.42秒STEP_LIMIT：真实TableCheck正向证据被旧factChecks白名单过滤；H002 6.55秒NO_PROGRESS：地点解析失败；H003 9.30秒PRESENT_RESULTS但周五被覆盖为今天；H004 6.94秒PRESENT_RESULTS但漏日期/无营业时间依据；H005 634.02秒STEP_LIMIT：26家空位UNKNOWN，非明确无位。
- 离线定位：原H001 artifact仅在内存副本增加一个已存在的新事实引用，真实readiness由false变true；实际时间物化函数复现DATE Friday→9/18后被TIME relative0覆盖为9/14。未改真实artifact或将探针视为Live成功。
- Eval未通过；且分类字段存在误导风险、H005动态“现在”仍对比冻结16:00、重复搜索未被investigation检查覆盖。原始execution/evaluation均保留，不修改Gold洗绿。
- 合计约1212秒、120次模型调用、557432记录tokens、65次Google请求、544次Browser Runtime调用、31次Browser模型调用；费用UNKNOWN。无登录、预约、支付、PII提交或业务外部写入。未重跑全量离线矩阵，业务源码未改。
- [完整报告与各case artifact](../../.eval-artifacts/hybrid-schema-fixed-2026-09-14/1789373476/REPORT.md)。报告/source hashes/因果探针在本地忽略目录，不提交。记录更新后git diff --check通过。

## TEST-2026-09-14-LIVE-DERIVED-CHAIN-REPAIR — offline and bounded Hybrid Live

- 离线：完整内部链保留真实Interpreter、Compiler、Reducer、Agent Context、Validator、Router、Grounding与Evaluator，仅替换模型/HTTP/浏览器边界。新增回归覆盖当前availability来源事实补充当前fact read、显式日期优先、`this afternoon`日期、命名地点变体/非首项拒绝、连续稳定拒绝、两次零新增发现，以及Live `right now`东京物化。最终`npm test` **281/281**、`typecheck`、`arch:check`、`build`、`git diff --check`及本地真实Chromium Fixture **5/5**通过。
- Live：H001–H005各一次Hybrid Read-only，无重跑、Fixture替代、登录、预约、支付或其他写操作；Google/Agent/Browser预算均独立按run累计，费用未配置故为`UNKNOWN`。H001：50.8s、Google12、Agent7，模型按原文产生RECOMMENDATION并在事实重复拒绝后`REJECTION_LIMIT`。H002：328.8s、Google63、Agent30，事实推荐候选扩张后`STEP_LIMIT`。H003：285.5s、Google50、Agent30，同类扩张且模型检索提示漂移，权威位置仍为EVALUATION。H004：32.3s、Google5、Agent4，`PRESENT_RESULTS`且独立来源证据充分；但原SOFT表达被改写，Eval正确标为需语义审查，不将其称为qualified自动通过。H005：758.4s、Google12、Agent30、37候选availability读取、541 browser runtime calls、28 browser model calls，真实来源均未给出合格slot，最终`STEP_LIMIT`，不称无位或成功。
- 这些Live是在零新增发现与availability路径一致性最终修复前后分批执行；授权限制禁止自动重跑，故只报告真实轨迹，不能称五例均在最终源码上验收。原始artifact与独立evaluation sidecar保存在git忽略`.eval-artifacts/restaurant-hybrid-live-read/`；历史artifact未改。


## TEST-2026-09-14-READ-EXECUTION-DESIGN — documentation only

- 交付：只读调查执行契约设计及ADR-0025 Draft，更新INDEX/ADR索引/STATUS和DEVLOG；Accepted ADR正文及业务源码未改。
- 验证：两份新文档相对链接目标、设计涉及的现有Domain文件、Draft标识和`git diff --check`通过。
- 设计包含真实组合回归、真实模型+固定来源诊断与后续有界Live的拟验证顺序，不表示本次已经运行这些验证。
- 本次未运行代码测试、模型调用、Live或数据库操作，未提交或推送；纯文档按Test Skill不运行完整代码门禁。


## TEST-2026-09-14-READ-DESIGN-TEST-MAPPING — documentation only

- 补齐设计中的现有测试文件映射、需退役断言、集成起终点、模型混合诊断边界和独立Eval反例；Test/Eval Skill为通用维护规则，设计为当前切片落点。
- 验证：设计相对链接、章节顺序、引用Skill目标和`git diff --check`通过；未修改或运行测试代码，未把待实施的混合诊断入口报告为已可执行。
- 无模型/来源调用、数据库操作、提交或推送。

## TEST-2026-09-14-ADR-0025-READ-COMPLETION — offline integration

- 真实内部组合保持Runtime/Reducer/Context/Validator/Router/PGlite/Web artifact与现有Evaluator；外部边界仍为既有离线替身。新增回归证明availability目标可以先补事实、`END_READ`只能在有实际调查且无可展示结果时形成持久`NO_VERIFIED_RESULT`、重复零新增发现由模型受控结束而不解析日志文案、同一来源的当前UNKNOWN不复用旧成功、独立来源事实不被错误遮蔽、地点后缀/地址/排名不成为地标确认。
- Evaluator/Rubric升至`@9`：`PRESENT_RESULTS`只是已记录展示，是否qualified仍由独立证据核验决定；正常无结果只能来自`NO_VERIFIED_RESULT`及范围记录，`STEP_LIMIT`/取消/内部失败不再转写成正常无结果。
- 验证：获准本机loopback环境下`npm run typecheck`与`npm test`通过**282/282**；真实Chromium本地动态Fixture `npm run test:browser:fixture`通过**5/5**。未运行付费模型、Google、预约来源或任何外部写入；本条不构成新的Live验收。

## TEST-2026-09-14-ADR-0025-INDEPENDENT-REVIEW — offline + one Live read

- 复跑 typecheck、arch:check、build、diff检查通过；npm test **282/282**，Chromium本地Fixture **5/5**。首次沙箱内Web监听EPERM，获准本机监听环境重跑通过，保留两份日志。
- 额外真实Hybrid初始化组合（只替换模型传输/Google HTTP）复现跨批factChecks被覆盖：4候选3+1批次反复读取直到STEP_LIMIT；Domain反例还证明A的新UNKNOWN会因读取B而丢失，重新使用A旧正向事实。另一组合复现Google耗尽时外层提前停止，尽管CHECK_AVAILABILITY仍合法。无生产代码修改。
- Evaluator反例：零来源轨迹、空noVerifiedResult对象仍获SUPPORTED_BY_EVIDENCE；地名固定响应反例：Higashi-Ginza与Higashi-ginza Sta.仍无法对应。它们不属于Live。
- 本次用户测试请求下运行原始H001一次：2026-09-14T13:48:53Z开始，540.236秒后STEP_LIMIT / FAILED；10候选、23次事实批次、69次Place Details（同店最多11次），Google共71/100，6家预约读取均UNKNOWN，未展示。38次模型调用、300276总tokens；金额未记录。开始时东京22:48，今晚19点已过；不据此评价未来库存，但重复调查与离线复现一致。无H002–H005/Web Live追加，无预约/支付命令；副作用计数未独立测量。
- Eval检出重复调查与公开Gold/产品target.goal口径冲突；STEP_LIMIT完成类别仍NOT_EVALUATED，不能称本轮验收通过。
- 可复现脚本、完整结果与限制：[review report](../../.eval-artifacts/adr0025-review-2026-09-14/REPORT.md)；[Live artifact](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-14T13-48-53-579Z-e08b2e88-0ede-4319-85fe-67f9b9ecb0f6.result.json)。资料位于本地忽略目录，exposed development diagnostic，不是Clean Baseline。未提交、未推送。

### TEST-2026-09-14-READ-ARCHITECTURE-REVIEW

- 模式：离线内部组合/Domain 契约诊断，合成外部事实响应；非完整 Runner E2E、非 Live。
- `node --import tsx .eval-artifacts/adr0025-review-2026-09-14/source-scope-probe.mjs`：断言复现 Google→官网批级来源污染；A 当前 UNKNOWN 因 B 官网观察重新 eligible，Google-only 对照不合格。实际调用组合器、Reducer、展示判断；外部请求 0。
- `node --import tsx .eval-artifacts/adr0025-review-2026-09-14/partial-observation-probe.mjs`：同一合成身份/事实在 slot UNKNOWN 时零 evidence、AVAILABLE 时保留三种 evidence；证明当前 grounding 的接纳耦合，不证明真实网页内容。
- 与前次 source-hashes.json 对比：170 个 src/web-skills 文件无变化，无新增源码。复用既有 282/282、Chromium 5/5 及失败 Live 证据，本轮未重跑默认矩阵、模型或真实来源。
- 两个探针成功复现缺陷/限制，不是修复通过。完整结论见 `.eval-artifacts/adr0025-review-2026-09-14/ARCHITECTURE-REVIEW.md`；仅新增诊断产物及更新记录。

### TEST-2026-09-15-TEST-CONTRACT-REPAIR

- 验证切片：先让正式测试捕获现有执行故障，再修Eval判定；产品红色回归留作下一阶段修复门槛。
- `node --import tsx --test src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts`：旧Evaluator加新预期会失败；最终27/27通过。无结果反例包括合格候选被忽略、空记录、仅提议、旧请求、范围矛盾和未完成执行；正常限定空搜索为对照。
- 实际Hybrid初始化组合测试只替换外部模型/HTTP/网页；跨批三种顺序、Google额度耗尽、混合来源均在产品契约断言失败；额度充足控制实际到达浏览器，避免以错误替身证明故障。部分事实接纳是另一个Domain测试，不计完整E2E。
- 最终`npm test`：298项，290通过、8失败（6失败叶项及2父项），0 skip/todo。仅剩上述4类执行缺陷。先前沙箱listen EPERM已与实际产品失败分开，在授权本机listener环境完整运行；中间Web版本字面量失败已同步当前Evaluator常量，最终不再失败。
- typecheck、arch:check、build、`git diff --check`通过。未改浏览器操作代码，不重跑Chromium本地Fixture。未运行付费模型、真实来源、Live或Web Live。
- 两份历史H001 artifact只读补评并与修改前@9对照，execution分类不变。09-08旧artifact缺target.goal，整体未评估但展示证据充分；09-14重复调查失败仍NOT_SUPPORTED。原artifact不改。
- 本地完整证据：`.eval-artifacts/test-contract-repair-2026-09-15/`，最终日志`npm-test-final-complete.log`。正式记录与未覆盖范围：[验证修复记录](TEST-VALIDATION-REPAIR-2026-09-15.md)。业务未修复，不报告总体通过。


## TEST-2026-09-16-BROWSER-LOOP-FEASIBILITY — Live component diagnostic

- 用户授权两站验证；每站一次、最多 8 次模型决策/60 次底层操作/180 秒。现有 DeepSeek Gateway、BrowserTaskExecutor、LocalPlaywrightChromium 未修改。绕过 Discovery/Semantic/Restaurant Runtime 的组件诊断，不是完整产品验收。
- Mock：`node --import tsx --test src/infrastructure/browser/browser-task-executor.test.ts src/infrastructure/browser/browser-action-decision.test.ts`，14/14。`npm run test:browser:fixture` 首次因沙箱 MachPort Permission denied 无法启动；经沙箱外许可运行 7/7，无源码改动。
- Live：141 2 次模型调用/11,703 tokens/19.2秒，日期选择与19:00入口可见，未验证完整套餐；八芳 8次/72,362 tokens/81.9秒，全部因 authoritativeField 解码错误被拒，BUDGET_EXCEEDED。无重跑、无Google、无预约提交，实际网络副作用计数 NOT_MEASURED。费用未知。
- 两份执行和独立助手复核分开存于 `.eval-artifacts/browser-loop-feasibility-2026-09-16/`；完整[报告](../brainstorming/2026-09-16-browser-loop-feasibility-validation.md)。未运行全量代码门禁（无生产改动）、Replay、Cloudflare Live、Controlled Live-write或框架对照；链接/diff通过。当前源码中的观察与反馈限制仍未修复。


## TEST-2026-09-16-STAGEHAND-SMALL-PROBE -- isolated component diagnostic

- User-authorized small test; npm Stagehand 4.1.0 pinned in ignored experiment directory. No production dependency or code change.
- Real Chromium synthetic fixture passed independent DOM date/party/result assertions; real DeepSeek fixture proposed the correct calendar cell and passed target inspection and post-action snapshot review.
- One timing sample: Stagehand snapshot 34ms / 14,730 characters / 395 mapped nodes; current Registry 10,368ms / 184 controls, missing calendar td. Different outputs and one sample; not a performance baseline.
- Live TableCheck and Tabelog each observed once. Picker-opener/unlabelled-button proposals stopped at the probe's exact-date guard; no live click, Offer or complete workflow acceptance. Total 3 model calls / 23,001 tokens; monetary cost unknown.
- Cap 6 model calls across probes, 180 seconds per run. Cache/selfHeal disabled; telemetry explicitly sent to localhost. No login, terms acceptance, contact information or reservation submission; external network side-effect count NOT_MEASURED.
- Initial sandbox npm DNS failure resolved with approved execution; initial local script ESM configuration corrected before browser/model access. Execution and independent assistant-review sidecars stored in `.eval-artifacts/stagehand-probe-2026-09-16/`. Browser process cleanup checked.
- No Replay, Cloudflare Live, complete Restaurant Runtime or Controlled Live-write. Documentation links and diff checked; full code gates not repeated because production code is unchanged. [Report](../brainstorming/2026-09-16-stagehand-small-probe.md).


## TEST-2026-09-16-STAGEHAND-WORKFLOW — isolated development diagnostic

- Synthetic real-browser: initial XPath prefix failure preserved; corrected same-page and asynchronous/new-tab fixtures passed. Not Replay.
- Live read-only component: two batches, 7 + 10 model calls, 186,337 tokens; TableCheck 141 / Happo / Sendou did not complete the model-driven workflow. Separate zero-model sequential Stagehand/Playwright navigation control read the public TableCheck form; not autonomous success or inventory proof.
- Original execution artifacts plus separate assistant review sidecars: `.eval-artifacts/stagehand-workflow-2026-09-16/`. Recording SUCCEEDED is not business success. Browser cleanup reported CLOSED. External side-effect count not independently measured.
- No production code/dependency change; no product full gates, Replay, Runtime integration or Controlled Live-write. Documentation links and diff checked separately. [Detailed evidence](../brainstorming/2026-09-16-stagehand-workflow-validation.md).


## TEST-2026-09-16-BROWSER-OBSERVATION-ACTION-MEMORY

- Synthetic real Chromium fixture: checkbox roundtrip, range keyboard value, search result and modal scroll assertions passed; first sandbox listener EPERM had no model call. Not Replay.
- Scripted Live read-only: TableCheck query, complete Filters roundtrip/apply/reset and budget value changes verified; Happo alternative Sep 20 19:15 party 4 verified from options-page body with two details expanded. Map marker click timed out; geographic bounds unverified. Earlier wrong-popup/endpoint-only probe failures preserved.
- Model Live: 15 observe calls, 141 public form reached, Tabelog model workflows incomplete; multiple observe candidates and repeated-date proposals are not evaluated as a complete agent API.
- Real model + captured Live source: 5 calls for extraction, notes-only comparison/revision and new-source update. Quote/reference containment passed in listed scope, but semantic review found inverse inference, incomplete quote scope and treating options as selected state; no overall memory pass. Not a clean holdout or product E2E.
- Total 20 calls / 228,988 tokens. Raw execution plus separate review under `.eval-artifacts/browser-capability-suite-2026-09-16/`; all completed browsers reported closed. No booking, consent or PII actions requested; external side-effect count not independently measured.
- Product full gates not run: no production code/dependency change in this slice. Documentation links and diff checked; no Replay or Controlled Live-write. [Report](../brainstorming/2026-09-16-browser-observation-action-memory-validation.md).


## TEST-2026-09-16-BROWSER-PLAN-HANDOFF — documentation only

Checked the plan against current browser/runtime/decision/executor interfaces, existing Skills/Evidence and current H001–H005 acceptance. Verified local Markdown links and git diff whitespace. No code tests, browser runs or paid model calls were run for this documentation-only turn. Implementation and Live gates remain future work in the [plan](../BROWSER-AGENT-RESTAURANT-IMPLEMENTATION-PLAN.md).


## TEST-2026-09-16-BROWSER-TERRA-INDEPENDENT-REVIEW

Typecheck and 15 existing decision/executor tests passed independently. Four local real-Chromium synthetic checks reproduced consent checkbox acceptance, native slider stale value (observed 15 vs actual 14), missing aria slider values, and fixed dialog missing background block. Artifacts: `.eval-artifacts/browser-terra-review-2026-09-16/`; no production code changes, model calls or Live sources. No independent full suite rerun. [Review](BROWSER-AGENT-TERRA-REVIEW-2026-09-16.md).


## 2026-09-16 Browser review repair — current development evidence

- Slice: R1–R4 in [independent review](BROWSER-AGENT-TERRA-REVIEW-2026-09-16.md), not complete P0–P4 acceptance.
- Before fix: strengthened existing Fixture and new state/consent regressions reproduced failures (`.eval-artifacts/browser-terra-review-2026-09-16/before-fix.log`).
- After fix: `npm run typecheck`, `npm run arch:check` (0 forbidden dependencies), `npm run build` PASS. `npm test` 344/344 PASS after authorized rerun; initial sandbox run could not listen on localhost.
- Final `npm run test:browser:fixture`: **12/12 PASS** (`final-browser.log`). This includes authorized-query check/uncheck/check, native/ARIA slider property roundtrip, strict-wire unsafe consent refusal, fixed native modal, and nested/hidden dialogs with background restoration. The additional checkbox cycle initially exceeded the existing fixture budget; only that fixture was raised to 36 operations, production default remains 24.
- Classification: Mock/unit plus Synthetic real-Chromium only. The Cloudflare-session-named fixture exercises the session wrapper with local Chromium, not remote Cloudflare deployment. No new Replay, Live Read-only, Controlled Live-write or paid model call. No real-site filter/booking success inferred.
- Production source query permission remains unset; default refusal is deliberate pending explicit source contract integration.

## 2026-09-16 Browser P1/P2 completion — offline only

- `npm run typecheck` PASS after each affected slice.
- `npm run test:browser:fixture` PASS **13/13** in authorized local Chromium. It uses only intercepted synthetic pages and production `BrowserTaskExecutor`: source-permitted GET filter check/uncheck/check, slider, bounded region scroll, Update/reopen/Reset, modal state, stale references and observed public new-tab switch. The eight-transition filter case has a fixture-only 52-operation cap; production remains 24.
- `node --import tsx --test src/integrations/restaurant-availability/public-query-control-policy.test.ts src/integrations/tablecheck/tablecheck-browser-availability.test.ts src/integrations/tabelog/tabelog-browser-availability.test.ts` PASS **33/33**. It proves each source policy permits only its own public GET search range/checkbox controls and rejects sensitive or mismatched paths.
- `node --import tsx --test src/eval/restaurant/agent-loop/hybrid-read-composition.test.ts` PASS **29/29**. The new alternative-time case starts at real Semantic/Compiler/Router/Reducer composition, substitutes only external model/HTTP/page edges, and confirms original 19:00, bounded 18:30–19:30 query, unchanged date/party and alternative label.
- `node --import tsx --test src/integrations/restaurant-facts/google-listed-website-facts.test.ts src/server/local-web-server.test.ts` PASS **29/29** in authorized loopback execution. Website facts exercise an observed terms disclosure and two candidate pages; price/tax, private-room minimum, cancellation and no-show remain separate and candidate-scoped. The first sandbox attempt failed because localhost binding is prohibited there; it was rerun unchanged outside the sandbox.
- Classification: unit/adapter mocks, synthetic HTTP/model boundaries, real local Chromium Fixture and localhost Web test. No Replay, real model, Live Read-only, Controlled Live-write, Gold/Holdout access or external write. These commands do not establish current source-page compatibility or inventory.
- Final shared gates: `npm run arch:check` PASS (0 forbidden dependencies), authorized `npm test` PASS **352/352**, `npm run build` PASS, authorized `npm run test:browser:fixture` PASS **13/13**, and `git diff --check` PASS. The initial full-suite sandbox run had 15 localhost listener failures plus a transient stale prompt-version assertion; the unchanged authorized rerun passed every test. No Live or paid invocation occurred.


## TEST-2026-09-16-BROWSER-AGENT-P1-P2-CURRENT-OFFLINE

- Scope: current P1/P2 offline increment after R5–R8 repair. No Gold/Holdout, paid model, real source, Replay, Controlled Live-write, booking, payment, cancellation, commit or push.
- `npm run typecheck`: PASS.
- `node --import tsx --test src/domains/restaurant/agent-context.test.ts src/domains/restaurant/agent-decision.test.ts src/domains/restaurant/action-validator.test.ts`: PASS **28/28**. Covers sourced current commercial notes at the actual Agent transport boundary and same-source fact refresh supersession.
- Authorized `npm run test:browser:fixture`: PASS **13/13**. Local synthetic Chromium only. The production Executor observes `aria-valuetext` for a two-ended JPY slider, changes only the fixture-permitted lower endpoint, re-observes the upper endpoint unchanged, scrolls the intended dialog and confirms the page's applied filter text. It does not grant production source controls or invoke external pages.
- `npm run arch:check`: PASS (0 forbidden dependencies). `npm run build`: PASS.
- First authorized `npm test`: 354/356; two stale v6 Context schema assertions in the mock harness/PGlite persistence tests failed after the deliberate Context v7 change. Both expectations were migrated. Second authorized `npm test`: PASS **356/356**, 0 fail/skip/todo. Loopback fixtures only.
- Classification: local unit/contract, synthetic real Chromium and loopback integration. This supports only the specified offline controls. Positive source query-control contracts, real complex-page behavior, P3 Live model/source execution, B13 and B14 remain outside the run; review handoff is pending in the [delivery record](BROWSER-AGENT-RESTAURANT-P0-P4-DELIVERY-2026-09-16.md).

## 2026-09-16 Browser second review counterexamples

Local production Compiler/Intent, public query policy and website reader/Grounding exercised with Synthetic boundary inputs; four failures reproduced (R5–R8 in browser Terra review). Existing policy/website-facts/compiler tests 24/24 and typecheck PASS. Evidence: `.eval-artifacts/browser-terra-review-followup-2026-09-16/{repro.ts,results.log,existing-tests.log}`. No Chromium, paid model, Replay, Live or external writes in this review; no claim of full-suite rerun or repair.


## 2026-09-16 Second review repair: R5-R8

Current development evidence. Time-window replacement now clears old alternative permission at Intent patch application; explicitly supplied new permission is applied afterwards. The unverified public GET search policy and adapter grants were removed: production checkbox/range actions default to deny pending positive source control contracts. The synthetic fixture alone grants its known query controls; Japanese consent is refused through the real Chromium strict-wire path.

Commercial scalar prices now require an unambiguous complete labelled line; deposits mixed with prices and multiple courses remain unknown. Supported commercial requests (course price, room minimum, cancellation, no-show) are included in the reader objective and completion check. Existing type/hours no longer cause early completion when requested terms are missing. Missing requested facts return UNKNOWN / WEBSITE_REQUESTED_FACTS_UNCONFIRMED while retaining observed evidence. This is narrow explicit-keyword support, not general multi-course or natural-language understanding.

Verification: typecheck, arch:check (0 forbidden), build, full npm test 353/353 and synthetic real-Chromium 13/13 PASS. Before-fix regressions saved. An initial Compiler-level null patch failed one old shape assertion; invalidation was moved to Intent patch application and the full suite rerun successfully. Logs: `.eval-artifacts/browser-terra-review-followup-2026-09-16/before-fix.log`, `final-tests.log`, `browser.log`. Old repro.ts records the pre-fix policy and is not a current runner after its deletion.

The unsafe policy test was retired with the implementation; existing semantic/website and Chromium tests were strengthened, with ambiguity and missing-fact regressions added. No paid model, Replay, Live, external writes, commit or push. R6 is safely closed but positive real-site filter wiring remains incomplete; full P1/P2/P3 acceptance is not claimed.


## 2026-09-16 Third browser review

Independently ran Context/Decision/Validator tests 28/28, test:browser:fixture 13/13, typecheck PASS. R9 reproducer evaluates the exact commercial-evidence selection expression extracted from local-workspace-page.ts against retained old/new facts: selected old 7500/no-show despite current 8000/cancellation and supersededEvidenceIds. This is a local expression-level counterexample, not an end-to-end Web test. No full-suite rerun, Live or paid calls.

## 2026-09-16 Browser 直接修复最终验证

- `npm run typecheck`、`npm run arch:check`、`npm run build`、`git diff --check` PASS。
- `npm test` 首次受 sandbox localhost listen EPERM 影响；允许本地监听后重跑 **358/358 PASS**，最终 log：`.eval-artifacts/browser-completion-2026-09-16/verified-final-tests-unrestricted.log`。
- `npm run test:browser:fixture` **15/15 PASS**（真实本地 Chromium，synthetic 页面/HTTP，非外站）：同目录 `verified-final-browser.log`。新增覆盖条款刷新/独立引用、来源 Budget 契约/拒绝 consent、模型停止与代码 completion 区分；不以测试数量证明产品完成。
- Live Read-only：TC 查询模型3 calls成功；H001 9 calls/5 Google并有独立 evaluation通过；Tabelog5 calls目标日期/人数未确认，**未通过**。合计17 calls/149093 tokens，未估算费用。原始 artifact 未覆盖；Tabelog独立判断见 `tabelog-independent-evaluation.json`。
- 无新增 Replay；无 Controlled Live-write；无生产 Web Live、两店修订/比较、新商户验收。未执行预约提交。达到本批40分钟上限后停止新增 Live。[明细](BROWSER-AGENT-VALIDATION-2026-09-16.md)。

## 2026-09-16 Tabelog / TableCheck follow-up verification

Final typecheck, arch:check, build and diff check PASS. npm test **361/361 PASS**; test:browser:fixture **18/18 PASS**. Logs: `.eval-artifacts/browser-tabelog-repair-2026-09-16/tests-complete.log` and `browser-complete.log`. Intermediate delayed fixture caught a multiple-match readiness selector; container selection fixed it before Live rerun.

Live Read-only: Tabelog early observation failed (1 call), readiness repair confirmed date/guests (2 calls) but not inventory. TableCheck disabled-control repair returned UNKNOWN (2 calls); scoped empty-result repair returned NO_MATCHING_SLOT in 8967ms without model calls. Total 5 calls / 39116 tokens / zero Google, below 12-call / 20-minute cap. Code hashes, executions and independent evaluation kept separately. No Replay, Controlled Live-write or booking submission. [Report](BROWSER-AGENT-VALIDATION-2026-09-16.md).

## TEST-2026-09-17-H001-H003-H005-TARGETED-OFFLINE

- Scope: pre-Live H001 store association, H003 current-source positive-HARD diagnostic, and H005 immediate-time contract. No Gold/private Holdout access, booking or external write.
- Targeted test command: semantic/compiler, Router, Model Fact Judgment, TableCheck, Tabelog and Hybrid composition **98/98 PASS**. It includes phone conflict plus same complete address, branch address conflict, direct Google-listed merchant identity read, cross-candidate entry reuse with independently scoped evidence, stale/unrepresentable immediate request with zero provider call, and positive-HARD cited judgment.
- Gates: `npm run typecheck`, `npm run arch:check` (0 forbidden dependencies), `npm run build`, `git diff --check` PASS. First sandbox `npm test` had 15 loopback `EPERM` failures; unchanged authorized rerun passed **376/376** in 14210ms.
- H003 fixed-input production-model diagnostic: final current-source record `.eval-artifacts/restaurant-hybrid-live-read/h003-hard-fact-diagnostic-current-2026-09-17T04-47-16Z.json`, one `restaurant_fact_judgment@2` invocation, 764 input + 82 output = 846 tokens, cited current Google fact and emitted `verifiedHardCriteria:[good for drinks]`. State replay retained the cited source/identity chain and changed the first missing reason from HARD-fact absence to missing availability-source identity; it is not an availability result. A failed artifact-save invocation and a superseded-source diagnostic are retained as failed attempts.
- Classification: local unit/contract plus one real model fixed-source diagnostic; no Replay, Live source read, Controlled Live-write, or booking. This is not a claim that H001/H003/H005 Live acceptance passed.

## TEST-2026-09-17-H001-H003-H005-BOUNDED-LIVE-READ

- Authorization/budgets: each original case once, `LOCAL_CHROMIUM`, `maxAutomaticBrowserMs=300000`, `maxModelCalls=50`, `maxGoogleRequests=50`, `maxBrowserOperationsPerCandidate=50`; runner's independent agent-step cap remained 30. Read-only code path; no booking/write action.
- H001: [result](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-17T04-49-22-764Z-72cbe0fd-5b21-4373-8aa2-44d10ef53538.result.json) and evaluator sidecar saved. `NO_VERIFIED_RESULT`, TERMINAL/7 steps, 181499ms, 10 candidates, Google 5, browser model 12, runtime calls 137 (per-candidate 7–24). Five request-bound `NO_MATCHING_SLOT`; five identity/extraction UNKNOWN. evaluator@15: qualified NO, scoped completion only.
- H003: [started record](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-17T04-52-35-417Z-5336c9d4-8f09-48aa-b372-c05d912a2b55.started.json) only. The single process did not finalize after the 5-minute cap and was interrupted at the user-bound limit; no result/evaluator exists, no retry was run. This is a failed/unfinished Live observation, not a no-result or acceptance result.
- H005: [result](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-17T04-57-51-585Z-81816d10-566e-4e98-b979-052ee0c40d4c.result.json) and evaluator sidecar saved. `NO_VERIFIED_RESULT`, TERMINAL/7 steps, 138627ms, 10 candidates, Google 4, browser runtime 0, browser model 10. Materialized 13:57 Tokyo; after elapsed fact work, every availability check is `UNKNOWN/IMMEDIATE_REQUEST_EXPIRED`. No later slot query or presentation occurred; this validates only the expiry fail-closed behavior, not source availability.
- Classification: Live Read-only development diagnostics, not clean baseline/Replay/Controlled Live-write. Independent evaluator remains a separate sidecar and does not establish H001/H003/H005 acceptance. Review handoff required.

## TEST-2026-09-17-H001-ADDRESS-REPRESENTATION-AND-DEADLINE-REPAIR

- Scope: post-Live offline repair only. The shared outlet identity helper is exercised through both production resolvers: a Japanese/Latin complete address pair with matching postal code and `1-1 2F` reaches HIGH; `3F` and incomplete address counterexamples do not. Existing direct Google merchant-entry, phone-conflict, branch-conflict and per-candidate availability-evidence isolation cases remain in the same adapter suites.
- Targeted command: TableCheck, Tabelog and Hybrid time composition suites **51/51 PASS**. `npm run typecheck`, `npm run arch:check` (0 forbidden dependencies), `npm run build` and `git diff --check` PASS. Authorized loopback `npm test`: **378/378 PASS**, 0 fail/cancel/skip/todo, 14160ms.
- Runner deadline settlement is typechecked and compiled by `npm run build`; no synthetic timeout was represented as a Live completion. The prior H003 `.started` artifact remains the only artifact for that attempt.
- Classification: local contract/unit/integration regression. No Gold/private Holdout, Replay, new real-model call, Live source read, Controlled Live-write, booking, payment, cancellation, commit or push. The tests do not establish the post-fix H001 Live behavior, H003 complete Live completion, or actual platform availability for a valid immediate H005 request.

## TEST-2026-09-17-H001-ADDRESS-SUFFICIENCY-FOLLOW-UP

- A new resolver counterexample proves identical abbreviated `1-1 Shinjuku` strings remain MEDIUM rather than becoming a same-outlet proof. A complete English reordered address, the postal-code cross-script pair and the distinct-floor case retain their respective HIGH/HIGH/MEDIUM outcomes.
- `node --import tsx --test src/integrations/tablecheck/tablecheck-browser-availability.test.ts src/integrations/tabelog/tabelog-browser-availability.test.ts src/eval/restaurant/agent-loop/hybrid-read-composition.test.ts`: **75/75 PASS**. `npm run typecheck`, `npm run arch:check`, `npm run build` PASS. Authorized loopback `npm test`: **379/379 PASS**, 0 fail/cancel/skip/todo, 14255ms.
- Classification: offline identity regression only. No new Live, model, Google, browser-source, write, Gold/Holdout, commit or push action; it does not upgrade the H001 Live result or any H003/H005 residual state.

## TEST-2026-09-17-H005-EXACT-SOURCE-SLOT-CONTRACT

- Replaced temporal materialization@4's fixed 15-minute queryability assumption with @5 `sourceSlotPolicy: EXACT_ONLY`. Fixed-clock Compiler tests retain the exact Tokyo minute and one-minute expiry; Router tests prove an unexpired exact request is forwarded unchanged and an expired request remains fail-closed.
- TableCheck and Tabelog adapter regressions each use a request for 12:08 with observed source cards at 12:00 and 12:30. Both return `UNKNOWN/IMMEDIATE_SLOT_NOT_OFFERED`, return no offer, and do not silently promote 12:30 or report `NO_MATCHING_SLOT`.
- Commands: H005/H001 relevant targeted suite **100/100 PASS**, final TableCheck adapter suite **28/28 PASS**, `npm run typecheck`, `npm run arch:check`, `npm run build`, `git diff --check` PASS. Authorized loopback `npm test`: **384/384 PASS**, 0 fail/cancel/skip/todo, 15711ms.
- Classification: fixed-time local contract plus synthetic source-page adapter evidence. No new Live, model, Google or external source request, Replay, Controlled Live-write, booking, Gold/Holdout, commit or push. This strengthens H005 before a future separately authorized Live; it does not alter the existing expired H005 run.

## TEST-2026-09-17-H005-PRESENTATION-EXPIRY

- State-to-presentation regression: a fully grounded immediate offer is allowed while its immediate valid-until timestamp is current, then `PRESENT_RESULTS` is rejected one second after expiry even though ordinary offer/evidence display TTL remains valid.
- H005/H001 relevant fixed-time, Router, Validator and adapter set **95/95 PASS**; authorized loopback `npm test`: **385/385 PASS**, 0 fail/cancel/skip/todo, 14386ms. Typecheck and architecture check passed in the same slice; prior build and diff check remain clean.
- Classification: offline authoritative State/Validator evidence only. It does not add a real source or model invocation and does not upgrade the historical H005 expired Live result.

The final cross-case classification and raw artifact links are in [H001/H003/H005 targeted repair report](H001-H003-H005-TARGETED-REPAIR-2026-09-17.md). The report is a development evidence handoff, not an independent-review approval or a clean-baseline claim.

## TEST-2026-09-17-H003-DEADLINE-SETTLEMENT

- `live-run-deadline.test.ts`: **2/2 PASS**. A never-settling child rejects `CANCELLED` when the outer signal aborts; a completed child result survives a later abort.
- `npm run typecheck`, `npm run arch:check`, `npm run build`, `git diff --check` PASS. Authorized loopback `npm test`: **387/387 PASS**, 0 fail/cancel/skip/todo, 14368ms.
- Classification: local runner lifecycle regression. It does not fabricate the historical H003 result/evaluator, invoke a model/source/Live run, or authorize retry.

## TEST-2026-09-17-TARGETED-REPAIR-INDEPENDENT-REVIEW

仅审查与离线诊断，无产品代码修改。独立运行deadline/TableCheck/Tabelog/model-fact-judgment现有测试56/56通过；额外调用生产地址比较与两个entity resolver，B1F vs 1F、同电话不同地点均HIGH（预期不得HIGH），仅邮编加楼层也被判为完整匹配。既有H001 Live复核确认Teppen时发现的涩谷Hajime入口未在随后Hajime调查使用；H003只存在started；H005全IMMEDIATE_REQUEST_EXPIRED。未重跑387项全量或typecheck/arch/build，未调用真实模型/网络/新Live或外部写入。反例脚本、结果、定向日志和限制见[审查报告](../../.eval-artifacts/targeted-repair-independent-review-2026-09-17/REPORT.md)。

## TEST-2026-09-17-H001-IDENTITY-ENTRANCE-FOLLOW-UP

- 修复前再次执行 [identity reproduction](../../.eval-artifacts/targeted-repair-independent-review-2026-09-17/identity-reproduction.mjs)：B1F/1F 与同电话异址均为 HIGH，`〒150-0002 1F` 为 true。修复后同一脚本输出前两项 `MEDIUM`、短地址 false。
- 定向命令 `node --import tsx --test src/integrations/tablecheck/tablecheck-browser-availability.test.ts src/integrations/tabelog/tabelog-browser-availability.test.ts src/integrations/restaurant-availability/live-browser-availability.test.ts`: **55/55 PASS**。覆盖两个 Adapter 的 floor/phone 冲突、短地址、direct merchant 先于 search、无关 ledger entry 不跳过 discovery，以及真实 `LiveBrowserAvailability` 跨 Agent batch 的 Teppen → Hajime entrance reuse/re-identification、及新 run 的 ledger reset。
- `npm run typecheck`、`npm run arch:check`、`npm run build`、`git diff --check`: PASS。授权 localhost `npm test`: **392/392 PASS**，0 fail/cancel/skip/todo，16427ms。
- 固定快照后各一次 Live Read-only probe：Teppen [artifact](../../.eval-artifacts/restaurant-browser-probe/2026-09-17T07-11-37-378Z-68d40f29-c653-4a3c-aa52-f7fe319a6c8d.result.json)、Hajime [artifact](../../.eval-artifacts/restaurant-browser-probe/2026-09-17T07-11-50-032Z-266e8d74-a116-422d-96f0-8b8c9500322a.result.json)、Nasu [artifact](../../.eval-artifacts/restaurant-browser-probe/2026-09-17T07-12-01-600Z-266438a6-6b8e-4769-b94b-8cb5f34aca50.result.json) 均为 `PAGE_OBSERVATION / BROWSER_RUNTIME_FAILED`，无 snapshot。第一条 300 秒参数在 Runner 的 60 秒上限校验前失败，未创建 artifact 或访问页面；三条实际 probe 各采用 60 秒上限且只允许 NAVIGATE/SNAPSHOT/WAIT_FOR。
- 分类：离线修复 + 已尝试但 browser-runtime 阻塞的 Live read-only，不等同于来源、身份、库存或产品验收。无模型调用、Google 请求、预订/支付/取消/登录、Gold/Holdout 读取、commit 或 push。详见 [后续记录](H001-IDENTITY-ENTRANCE-FOLLOWUP-2026-09-17.md)。

- 后续无网络 runtime 定位：`PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM` 仅启动并关闭本机 headless session，结果 `OPENED`。没有导航、snapshot 或来源访问。这将首个阻断限定为默认 Cloudflare Browser Run 的 session 创建；按单次 Live 边界未以本地引擎重跑。
- 现有 Hybrid diagnostic evaluator 对上述三份 probe 仅做不落盘内存兼容性检查：每份都是 `DRAFT_DIAGNOSTIC_ONLY`、0 candidates、`completion/evidence=NOT_EVALUATED`。它只适用于完整生产组合 artifact，故没有创建不适用的 evaluator sidecar，也没有独立评价通过的声明。
- 修复后授权 localhost 的 `npm run test:browser:fixture`: **17/17 PASS**。这是真实本地 Chromium 加合成页面的离线门禁，覆盖 dialog、日期/人数、公开新页、filters、slider/scroll 和 Tabelog 控件；不访问真实来源，也不改变本轮 Live 结论。

## TEST-2026-09-17-REGRESSION-DEFENSE-GENERALIZATION

- 五案 code-contract（真实 Hybrid composition + 独立 `SYNTHETIC_CONTROL` 来源）**6/6 PASS**；聚焦 composition/evaluator **78/78 PASS**。其中包含独立候选集合截断变异、前批事实丢失、请求更新/时钟/取消、来源额度耗尽、固定种子缩减，以及候选/请求/证据/展示链路的配对反例。
- `npm run typecheck`、`npm run build`、`npm run arch:check`、`git diff --check` PASS。沙箱 `npm test` 为 377 pass / 15 loopback `EPERM` 环境失败；授权 localhost 重跑为 **392/392 PASS**。沙箱浏览器 fixture 被 Mach-port 权限拦截；授权本机 Chromium 运行了真实 DOM 路径，但输出捕获截断，未将其报告为完整计数。
- 每案一次 fixed-source real-model（30-call cap）：H001 Runner 坐标绑定失败且未重试；H002 `NEEDS_INPUT`，H003 `NO_VERIFIED_RESULT`，H004 `FAILED`，H005 `PRESENT_RESULTS`。各 artifact 与独立 evaluator sidecar 位于 `.eval-artifacts/restaurant-fixed-source-model/`，均为 synthetic-source，不是 Live 证明。
- 每案一次 Live Read-only：H001/H003/H005（candidate≤5、model≤30、Google≤10、browser-operation≤30，30s；H001 first attempt 60s）均 `CANCELLED`，分别 4/5/3 model calls；artifact 标记 `DIRTY`，不作为 clean baseline 或来源结果。无预订、支付、取消或其他外部写。
- 分类与未覆盖范围见 [coverage report](REGRESSION-TEST-DEFENSE-REPORT-2026-09-17.md)：真实模型理解、自由文本质量、网站事实/兼容性、反爬与搜索完备性仍未由离线测试证明。

### Controlled migration sample follow-up

- `new-vegetarian-lunch` 以新来源记录和不同的菜系/排除条件/午餐时段/人数/命名区域，复用相同 fixed-source factory 与 Hybrid composition；定向 **7/7 PASS**，默认授权 localhost `npm test` **393/393 PASS**。它是已暴露受控迁移样本，不是私有 Holdout、真实模型或 Live 结果。

- `evaluation-location-selection.test.ts`：命名 `NEAR` 区域不绑定固定评估坐标，只有 `NEAR_USER` 绑定；避免 H001 fixed-source Runner 的已记录配置失败再次发生。与 H001–H005/新样本定向合计 **8/8 PASS**，`typecheck` 与 `git diff --check` PASS。

### H001 authorized corrective fixed-source model run

- 用户明确授权一次修正后 H001 重跑（最多 30 model calls；离线固定 HTTP/页面；无 Live/写操作）。artifact 为 [H001 result](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-17T09-02-23-359Z-4ce73364-d91e-4f20-b103-91c299dbde44.result.json) 与独立 evaluator sidecar。`SUCCEEDED` / `TERMINAL` / `PRESENT_RESULTS`，5 model calls、Google fixed-source 3、10722ms；evaluator@15 六个维度均 `SATISFIED`，qualified YES。首个错误尝试仍保留，不被覆盖。
- 最终授权 localhost 默认 `npm test`: **394/394 PASS**，0 fail/cancel/skip/todo，15317ms；包含 H001 坐标选择回归与新迁移样本。

## TEST-2026-09-17-FIXED-SOURCE-TEST-MECHANISM-REMEDIATION

- A: `fixed-source-acceptance.test.ts` PASS **4/4**. It rejects positive terminal no-result, missing evidence and evaluator failure; permits a declared no-result without reporting the user goal complete; only a fully supported positive has exit code 0.
- B: `fixed-source-case-execution.test.ts` plus `live-run-deadline.test.ts` PASS **4/4**. A frozen injected business clock cannot freeze the independent real deadline; ignored cancellation settles, late output does not rewrite the returned terminal record, and a normal result remains terminal. Existing immediate-expiry state/validator tests remain in the default suite.
- C/D: fixed-source candidate scoping, wrong retrieval, wrong party coverage-gap, all five raw H cases, and registered `new-vegetarian-lunch` control/evaluator/acceptance path pass in the focused set. Missing source evidence fails the unified acceptance path; unregistered/missing bindings are explicit errors.
- Focused command (`fixed-source-acceptance`, `fixed-source-case-execution`, `current-development-fixed-sources`, `current-development-offline`, `diagnostic-evaluator`, `live-run-deadline`): **62/62 PASS**. `npm run typecheck`, `npm run arch:check`, `npm run build`, `git diff --check`: PASS.
- Sandboxed `npm test`: 389 pass and 15 `127.0.0.1` listen `EPERM` environment failures only. Unchanged authorized local rerun: **404/404 PASS**, 0 fail/cancel/skip/todo, 16423ms. `npm run test:browser:fixture`: **17/17 PASS** using local Chromium and synthetic pages only.
- Classification: offline code-contract, local HTTP and synthetic local Chromium evidence. No paid model, Live/Replay, external site access, booking or other external write. It does not prove real-model free-text quality, current website compatibility/inventory, anti-bot behavior, factual freshness or search exhaustiveness. The historical model/Live diagnostic red results remain unchanged.

## TEST-2026-09-17-FIXED-SOURCE-CLOSURE

- Baseline 987c77e; focused fixed-source source/clock/acceptance command: **23/23 PASS**. It covers independent Google/TableCheck address/phone identity, a same-phone distinct branch, A-to-B entrance reuse with B re-identification, cited non-verbatim positive HARD judgment, structured Google/TableCheck/browser coverage gaps, configured Google 404, selector-specific waitFor, and separate t1/t2/t3 source observation timestamps.
- npm run typecheck, npm run arch:check, and npm run build: PASS. Sandboxed npm test produced 395 pass plus 15 local 127.0.0.1 listen EPERM environment failures; unchanged authorized local rerun: **410/410 PASS**, no test failure/skip/todo.
- Sandboxed local Chromium failed before page setup because macOS denied the browser Mach port. Authorized local Chromium fixture streamed 18 passing synthetic local-page controls, including requested-update and missing-marker wait controls; the host wrapper did not emit its aggregate line. No external website/navigation was used. This runtime distinction is retained rather than classifying it as a source/product failure.
- Classification: offline transport/adapter/composition/acceptance regression. No model, Live, Replay, Google, Cloudflare, restaurant website, booking, Gold or Prompt run/change. [Detailed matrix and limits](FIXED-SOURCE-CLOSURE-2026-09-17.md).

## TEST-2026-09-17-CONTROLLED-STOP-ARTIFACT-ACCEPTANCE

- Concrete counterexample before the change: an actual model-call budget was collapsed by the coordinator to `MODEL_FAILURE / FIXED_SOURCE_CASE_NOT_COMPLETED`; the persisted artifact no longer carried `MODEL_CALL_BUDGET_EXHAUSTED`, and evaluator/acceptance could not distinguish it from a generic failure.
- Actual repair: the fixed execution boundary preserves the original controlled transport failure code and call count; evaluator/rubric@16 reads the immutable execution record for `CANCELLED` and `MODEL_CALL_BUDGET_EXHAUSTED`; acceptance requires the declared matching completion kind, not merely a non-qualified result.
- Focused offline command: `npm run typecheck && node --import tsx --test src/eval/restaurant/agent-loop/fixed-source-case-execution.test.ts src/eval/restaurant/agent-loop/fixed-source-acceptance.test.ts src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts` — **50/50 PASS**. The new test uses real controlled abort and one-call-budget executions, writes temporary result artifacts plus evaluator sidecars, verifies each matching acceptance is `PASS / NOT_COMPLETE`, and verifies the budget artifact fails a cancellation expectation. No evaluator result is hand-filled in that chain.
- Full offline gates: `npm run typecheck`, `npm run arch:check`, authorized loopback `npm test` (**411/411 PASS**), and `npm run build` passed. The sandboxed default suite was **396 pass / 15 fail** only because its existing local HTTP tests cannot bind `127.0.0.1` (`EPERM`); the authorized rerun resolves that environment limitation without changing the test set.
- Classification and limits: no paid model, Live, Google, Cloudflare, restaurant site, Replay, booking or external write. The controlled model ceiling proves offline stop accounting, not real-model pricing/cost, model understanding, source behavior, website compatibility or inventory.

## TEST-2026-09-17-AFTERNOON-INDEPENDENT-REVIEW

审查基线565b08f。独立重跑TableCheck、Tabelog、LiveBrowserAvailability、fixed-source acceptance/execution、diagnostic evaluator共105/105通过；未重跑全量411项或其他门禁。旧三个identity反例关闭。直接回放早上已保存的真实身份字段，Inase/涩谷Hajime的地下1階与B1F错误CONFLICT，电话相同仍MEDIUM；离线真实Adapter首导航探针确认正常googleMapsUri遮蔽合法googleWebsiteUri。生产源码未改，无模型/网络/新Live。脚本、结果、日志及历史运行限制见[报告](../../.eval-artifacts/afternoon-review-2026-09-17/REPORT.md)。

## TEST-2026-09-18-H002-PARTY-SIZE-SUPPLEMENT-DIAGNOSTIC

- Focused offline gate: `npm run typecheck`, `node --test --import tsx src/domains/restaurant/party-size-supplement-resolver.test.ts`, and diagnostic preflight all passed. The test proves object-root/non-empty strict parameters, canonical UNKNOWN normalization, and extra-field fail-closed behavior; it does not prove a provider accepts the schema or model inference quality.
- Authorized real-model sequence preserved four immutable 8×3 artifacts. The first three batches each dispatched 24 calls and were rejected before completion (detailed causes retained for batches two/three: root must be object; empty object forbidden). The fourth batch dispatched and completed 24/24 with no retries, Google, browser, or booking calls. Its semantic gate is REJECTED: H002 1/3; seven controls 3/3. Raw outputs and ledger are linked from [the closure report](H002-H003-H004-SEMANTIC-CLOSURE-2026-09-18.md#h002-subsequent-provider-schema-repair-and-authorized-reruns).
- Classification: real-model diagnostic evidence, not production or Live read evidence. No production integration, Gold/Holdout/H005 change, commit, push, or independent Review occurred.

## TEST-2026-09-18-H002-SEMANTIC-ARITY-V2

- Candidate contract: focused resolver tests **3/3** prove strict non-empty object-root transport, UNKNOWN sentinel normalization, fail-closed extra output, AVAILABILITY-plus-missing-party guard, Recommendation/H004 and primary-party no-call, and one-attempt behavior. `typecheck`, `arch:check`, `build`, and `git diff --check` pass.
- Real-model diagnostic: a pre-dispatch frozen/hash-recorded 14-sample × 3 plan ran **42/42** completions, **32,958** reported tokens, zero retry/Google/browser/booking. H002 and all newly added semantic-arity/modifier controls were 3/3. Existing relational-three and blind enumerated-three were 0/3 due to `EXPLICIT` provenance for a correctly inferred count. The declared all-controls gate is therefore **REJECTED**. Artifact: [result.json](../../.eval-artifacts/party-size-supplement-diagnostic-2026-09-18/party-size-semantic-arity-v2-2026-09-18T08-44-12-699Z-78917c4c-bd3c-41e1-a84b-fecf0e7a179a/result.json).
- Final retained-tree offline suite in authorized loopback mode: `npm test` **441/441 PASS**; sandboxed preliminary run had 19 `127.0.0.1` `EPERM` environment-only failures. H002/H004 fixed-source, H003, H005, Live, Browser, and external writes were not run. The rejected candidate is not production-integrated.

## TEST-2026-09-18-H002-H003-SEMANTIC-CONTRACT-CLOSURE

- H002 real-model wire gate: **ACCEPTED**, 4 frozen samples ×2 = **8/8** completions, no retry/Google/browser/booking; actual response model `deepseek-flash`, 5,494 total tokens, 6,286ms aggregate latency. The preflight configured `deepseek-v4-flash`; that effective-model discrepancy is retained in the artifact.
- H003 real-model strength gate: **REJECTED**, 6 frozen categories ×3 = **18/18** completions, no retry/Google/browser/booking; actual response model `deepseek-flash`, 112,960 total tokens, 27,709ms aggregate latency. HARD exclusion/type, explicit SOFT, and both ambiguous UNSPECIFIED controls are 3/3. The H003 four-criterion primary sample is 1/3 because two outputs add `suitable for a team dinner`; no retry or Prompt change followed.
- Offline implementation evidence: focused **74/74 PASS**; `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check` PASS; authorized loopback full suite **443/443 PASS**. The ordinary sandbox full suite had local `127.0.0.1` EPERM failures only; no changed test was skipped.
- Stop boundary: H003 failure prevents H002/H003/H004 fixed-source real-model runs. H005 model/fixed-source/Live, all browser/Google/web source work, booking, Gold/Holdout, commit, and push were not invoked. Artifacts and review handoff are in [semantic contract closure](H002-H003-SEMANTIC-CONTRACT-CLOSURE-2026-09-18.md).
- Review follow-up: default suite now includes `src/application/*.test.ts`; evaluator/rubric is @17 and adds paired UNSPECIFIED nonblocking/review/HARD-mismatch coverage; same identity conflicting strengths are explicit compiler conflicts. Authorized loopback rerun: **446/446 PASS**. No model or source call followed. Persistent Postgres concurrent-request/refresh resolver coverage remains an explicitly open independent-review item.
## TEST-2026-09-18-H002-H003-SEMANTIC-CONTRACT-REVIEW-FOLLOW-UP

### Fixed-source real-model closeout

- After the original researcher's independent mutation check accepted the
  persistent single-flight regression, exactly one real-model fixed-source read
  ran for H002/H003/H004. Every run used `SYNTHETIC_CONTROL`, offline fixed
  transport/pages, `300000ms/50 steps/50 calls`, no external write, and the
  exposed YAML SHA `ef57893638be2cbc295cb14295d24b6d2d7bdc2918da83de68c48ae839ca7699`.
  Requested config was `deepseek-v4-flash`; returned invocation labels were
  `deepseek-flash`, recorded without asserting a backend switch.
- H002: 9 calls / 29,020 tokens / 13,350ms, three displayed request-bound
  slots. The primary parser omitted party size but one supplement call supplied
  `2/INFERRED_CLOSED_PARTY`. Strict evaluator/acceptance are `NO/FAIL`; the
  researcher accepted only the party sub-goal, not the full case.
- H003: 4 calls / 19,411 tokens / 8,095ms, three displayed request-bound slots;
  strict evaluator/acceptance are `UNKNOWN/FAIL`, while independent review
  accepts this bounded case. H004: 7 calls / 21,375 tokens / 8,711ms, three
  cafe recommendations; strict evaluator/acceptance are `UNKNOWN/FAIL`, and
  independent review rejects its SOFT→UNSPECIFIED non-regression.
- Raw started/result/evaluator paths and the exact non-retry boundary are in
  [semantic contract closure](H002-H003-SEMANTIC-CONTRACT-CLOSURE-2026-09-18.md).
  H001/H005/Live were not run; no Prompt, Gold or fixture was changed after
  these results.

- The H002 persistent path now has an authorized loopback PGlite/HTTP regression:
  primary explicit and inferred counts persist, UNKNOWN/transport failure remain
  `NEEDS_INPUT`, existing Draft counts are not overwritten, and recommendations
  do not call the supplement. A gated duplicate `submitMessage` delivery joins
  the in-flight `(taskId, requestId)` work before stale-version validation;
  completed replay and a legal presented-result refresh make no second
  supplement call. `src/server/local-web-server.test.ts`: **24/24 PASS**.
- The first version of that regression exposed a real ordering defect: the
  in-flight guard sat after optimistic-version validation, so a duplicated
  delivery could receive `StaleTaskVersionError` while the first resolver call
  was still active. A second review found a check-then-set window in that first
  repair. The final form synchronously sets one complete `submitMessageOnce`
  Promise immediately after authenticated conversation lookup; its regression
  dispatches both messages in the same tick, observes that the second actually
  awaits the in-flight Promise, and separately fails if a second resolver call
  occurs. This is offline PGlite/local-loopback evidence only.
- The H003 compiler regression now covers `ASSERT` strength transitions
  UNSPECIFIED→HARD, UNSPECIFIED→SOFT, HARD→SOFT through Proposal→Compiler→
  Reducer while retaining an unrelated criterion and opposite polarity. It does
  not claim `CORRECT` is incremental: existing `CORRECT` remains collection
  replacement. The evaluator is `restaurant-hybrid-read-diagnostic-evaluator@17`.
- No real model, Google, browser, restaurant site, source fixture, H005,
  Gold/Holdout, booking, commit, or push was run in this follow-up. H003's
  historical automatic gate remains rejected; the supplemental semantic review
  remains pending original-researcher signoff.

## TEST-2026-09-18-SEMANTIC-CONTRACT-V6-OFFLINE

- Baseline: `a66ef8a8e62c68339adb83c0b8c7aef8086b4923`; the historical
  `restaurant-read-development@5` YAML SHA is
  `ef57893638be2cbc295cb14295d24b6d2d7bdc2918da83de68c48ae839ca7699`.
  Current executable data is @6; old artifacts and evaluations were not edited.
- `npm run typecheck`: PASS. Focused command covering semantic Prompt contract,
  current YAML materializer, actual fixed Hybrid composition, diagnostic
  evaluator, fixed-source acceptance and the Proposal→Compiler→Reducer
  multi-turn strength control: **71/71 PASS**, 0 fail/cancel/skip/todo.
- Detection controls: a H002-shaped final-label/source-fact record is
  `REQUIRED_EVIDENCE=SATISFIED` but `AUTHORITATIVE_CONDITIONS=NOT_EVALUATED`;
  reversing polarity on the exact text is `NOT_SATISFIED`. A later HARD upgrade
  accepts a new HARD-context observation and rejects the otherwise identical old
  UNSPECIFIED-context observation at required-evidence/final-claim assertions.
- Classification: offline code-contract and synthetic fixed-source evidence.
  No real model, Google, website, browser, Live, Replay, booking, payment,
  cancellation, Gold/private Holdout access, commit or push. Full offline
  gates passed: `npm run arch:check`, `npm run build`, `git diff --check`, and
  the authorized local-loopback `npm test` (**451/451 PASS**, 0 failures).
  The initial sandbox-only test invocation had **430 pass / 21 fail** solely
  because existing local HTTP cases could not bind `127.0.0.1` (`EPERM`); the
  rerun did not change the test set or enable external transport.
- H002 historical-result supplement: evaluator@18 wrote a new sidecar beside,
  and did not alter, the @5 source result SHA-256
  `e9a1ed498cc6c484bb12c29655fb2622b147fba1a44653e7431ec624cf368aaf`.
  It records `systemBehavior=NOT_EVALUATED` for text without deterministic
  equivalence and `evidenceSufficiency=SUFFICIENT_FOR_PRESENTED_RESULT` for
  the final executed observation context. This verifies the split in one real
  saved artifact; it is not a semantic acceptance, Gold rewrite, or model run.
  Original-researcher pre-review remains required before any paid run.
- Second pre-review correction: the original evaluator used a text-keyed `Map`,
  which collapsed distinct `text + polarity` criteria. The regression now
  passes an identical two-polarity `quiet` collection and rejects a true
  exact-text polarity replacement. The initial scorer-only strength control is
  retained as a local lineage check but no longer claimed as the complete
  behavior. A new actual-Hybrid two-turn control starts from the real
  Interpreter/Runtime composition: it first presents an `UNSPECIFIED`
  vegetarian result, submits a second user turn making it HARD, verifies that
  `SEMANTIC_PROPOSAL_COMPILED` clears card/evidence and increments the request
  revision, then proves an old-card presentation is Validator-rejected without
  a current fact read. The paired normal control produces current cited HARD
  evidence through Router/Reducer and passes evaluator grounding. Targeted
  `typecheck` plus evaluator/Hybrid suites: **59/59 PASS**, no external call.
- Full recheck after that correction: `npm run typecheck`, `npm run
  arch:check`, `npm run build`, `git diff --check`, and authorized local
  loopback `npm test`: **455/455 PASS**, 0 fail/cancel/skip/todo, 18,758ms.
  The loopback allowance is only for existing PGlite/local HTTP tests; it does
  not enable model, Google, site, browser, or Live transport.
- Authorized fixed-source real-model post-review batch: H002 → H003 → H004 exactly once each, `deepseek-flash` / Semantic Prompt@v21, each capped at 300,000ms/50 steps/50 model calls and using fixed synthetic source transport only. All three executions were `SUCCEEDED/TERMINAL/PRESENT_RESULTS` and independently had `REQUIRED_EVIDENCE=SATISFIED`; all three automatic evaluations were `NOT_EVALUATED` on non-identical criterion wording and registered acceptance was `FAIL`. H002: 9 calls/28,922 tokens/8,814ms; H003: 4/19,518/6,727ms; H004: 7/21,405/6,461ms. Aggregate: 20 calls, 69,845 tokens, 22,002ms, 10 fixed Google-composition calls, zero browser calls. H005/Live/booking/commit/push were not run. Results await original-researcher semantic review; no automatic repair or rerun followed.
- Post-run annotation-only sync: the exact run-time @6 YAML was copied as an immutable audit snapshot with SHA-256 `75bf64732a9148720bb3d448c3fd53326195e8d7517d8689f80cec63e34df12b` before correcting only H002/H004 `acceptance.review` prose. The current YAML SHA is `00b69476e6d07eec5dcd9a657555c4e3766629fce5f8e630512710252886ffb6`; content, semantic expectations, source scenarios, code, original artifacts and existing scores were not changed, and no model/evaluator rerun occurred.


## 2026-09-18 — Independent semantic-contract @6 checks

Independent evaluator/current-development tests 59/59. Isolated old text-Map comparison fails the intended identical-polarity-set assertion; retaining Runtime old readEvidence fails real two-turn reset assertions. Original no-match identity probe excluded. Saved three-run input hashes/structured Proposals/State/citations/batch targets and original @18 findings independently checked; bounded manual acceptance 3/3, original AUTO remains FAIL 3/3. No extra model/source calls. Evidence .eval-artifacts/semantic-contract-migration-independent-review-2026-09-18/. Full 455/455 and typecheck/arch/build are Terra-run gates, not claimed as repeated independent runs.


## 2026-09-20 H005 locality matrix independent stop review

2026-09-20 **H005 locality Prompt@4 matrix 独立复核未通过，按停止条件结束**：L1–L8×3共24次真实模型、零重试、20,548 tokens；24份原始请求/响应及逐次落盘记录已核对。L3（Tokyo + Japanese restaurant）3/3错误SUPPORTED并进入verifiedHardCriteria；L5为CONFLICT/UNKNOWN/UNKNOWN，未误接纳，但Italian样本带地域信息，不能干净隔离location-only，预审遗漏已承认。L1/L2/L8正例9/9、L4/L7不足证据6/6、L6地区不匹配3/3均符合各自预期，仍不足以接纳Prompt@4。当前@4仅未提交候选，H005 fixed-source、Live、Prompt@5均未运行；禁止自动重跑。详见[独立矩阵复核](../../.eval-artifacts/h005-locality-independent-review-2026-09-20/MATRIX-REVIEW.md)。

独立复核未新增模型调用；前置定向检查14/14、typecheck及diff check通过，只证明预审代码边界。原始矩阵及Gold不改写。


## 2026-09-20 Local Food Semantics v2 independent stop review

2026-09-20 **Local Food Semantics v2：Prompt@5 / matrix@2 独立复核仍未通过**。用户已将普通local food定义为目的地本土料理，旧matrix@1失败记录保持原口径不回写。新12样本×3共36次、零重试、32,301 tokens；10个普通local-food样本30/30正确，窄地域冲突N2为3/3 CONFLICT；唯一失败N1（Tokyo regional food + Japanese restaurant）3/3错误SUPPORTED并生成verifiedHardCriteria。独立核对全部36份请求/原始输出及72个逐次记录，确认不是criterion漏传或评分误判。按预定gate停止，不运行H005 fixed-source/Live，不自动Prompt@6。[独立逐项结果](../../.eval-artifacts/h005-locality-independent-review-2026-09-20/matrix-v2-independent-review.json)。

## TEST-2026-09-20-H005-LOCALITY-PROMPT-6-MATRIX

- Focused local contract command covering Fact Judgment Prompt@6, dispatch/settled journal immutability, matrix request shape and scorer controls: **18/18 PASS**. `npm run typecheck` and `git diff --check` passed before the authorized matrix; no fixture, Gold, source fact or fixed-source acceptance path was changed.
- Final repository gates: `npm run arch:check`, `npm run build`, `npm run typecheck`, and `git diff --check` all passed. `npm test` first reported 444 pass / 21 fail only because the restricted sandbox denied the existing localhost listener (`listen EPERM 127.0.0.1`); the identical offline suite with localhost permission then passed **465/465**. Neither invocation enabled provider, Google, browser or Live transport.
- Authorized model evaluation only: matrix@2, 12 samples × 3 repetitions, 36 exact provider attempts, zero retries, `deepseek-flash`; all calls returned valid structured results. The runner recorded 36 dispatch and 36 settled immutable attempt journals, plus started/result records. Total provider usage: **34,383 tokens**, summed model latency **28,604ms**; Google/browser/booking use was zero.
- Result: **FAIL / stopped**. N1 (`Tokyo regional food` + Japanese restaurant) was `UNKNOWN` 3/3 and N2 (`Tokyo regional food` + Kyoto regional cuisine) was `CONFLICT` 3/3, but V2-L5 (Tokyo + Kyoto regional cuisine + unqualified `local food`) was `UNKNOWN` 3/3 where the frozen expectation is `SUPPORTED`. The raw responses and accepted citations are valid, so this does not establish a wire/scorer defect. No Prompt@7, H005 fixed-source run, Live run, Gold rewrite or retry followed. Evidence: [matrix result](../../.eval-artifacts/restaurant-locality-fact-judgment-matrix-v3/2026-09-20T04-32-59-815Z-2c991cb2-fd3c-44d0-8bf1-438f077fb673.result.json) and [independent V3 status](../../.eval-artifacts/h005-locality-independent-review-2026-09-20/TERRA-V3-PHASE-STATUS.md).

## TEST-2026-09-20-H005-LOCALITY-EXPLICIT-SCOPE-AND-FIXED-SOURCE

- The one-line Prompt@6 wording revision passed `node --import tsx --test src/integrations/restaurant-facts/model-fact-judgment.test.ts`: **8/8 PASS** and `git diff --check` passed. The matrix uses the unchanged frozen matrix@2 shape, source facts and scorer.
- Authorized real-model matrix: 12 samples × 3 repetitions, **36/36 provider attempts**, zero retries, 36 valid structured responses, no Google/browser/booking calls. `matrixPassed: true`; V2-L5 `SUPPORTED` 3/3, N1 `UNKNOWN` 3/3, N2 `CONFLICT` 3/3 (zero `SUPPORTED`), and no other case run failed. Recorded total: **36,006 tokens**, summed model latency **33,971ms**. Evidence: [matrix result](../../.eval-artifacts/restaurant-locality-fact-judgment-matrix-v3/2026-09-20T05-30-02-765Z-21112f4f-4c99-4808-942b-69718a8c55b2.result.json).
- Conditional first H005 fixed-source execution: one `SYNTHETIC_CONTROL` case, 50 model calls/50 steps/300,000ms ceilings. It used 8 model calls (1 semantic, 4 agent, 3 fact judgment), 28,522 tokens and 10,877ms; fixed source calls were discovery 1, details 3, website facts 3 and TableCheck availability 3. All three candidates had local-food verification and current availability; b lacked only verified-negative `fast food` evidence, so the system presented 2 instead of the registered 3-result batch (`met:false`). Execution was `SUCCEEDED/TERMINAL/PRESENT_RESULTS`; fixed-source acceptance was **FAIL** for the incomplete batch, not for local-food scope, a provider/source failure or no availability. No Live/retry/follow-up mutation occurred. Evidence: [result](../../.eval-artifacts/restaurant-fixed-source-model/2026-09-20T05-31-02-832Z-b5b0f649-c053-47df-bb5c-61dbf40a049d.result.json).

## TEST-2026-09-20-H005-PHASE-1-FIXED-SOURCE-BATCH-CONTRACT

- Targeted offline contract suite: `node --import tsx --test src/eval/restaurant/agent-loop/fixed-source-acceptance.test.ts src/domains/restaurant/action-validator.test.ts src/eval/restaurant/agent-loop/current-development-offline.test.ts` — **46/46 PASS**. It proves default `3/3/true` passes and reports the target; legal source-limited default `3/2/false` also passes and reports it; user-explicit `3/2/false` fails; user-explicit `2/2/true` passes; and a `QUALIFIED_RESULT` with zero candidates fails. It additionally proves that State `requestedResultCount=3` plus a missing/mismatched `USER_EXPLICIT` registry expectation fails closed rather than being labelled a default batch. A registered control carries an explicit two-result request through Interpreter/Compiler/authoritative State into acceptance and passes only at `2/2/true`. The existing Action Validator regression now uses two qualified candidates, independently preserving rejection of an early `2/3` partial batch while additional read remains legal, and records the shortfall only once source reads are exhausted. The H005 offline composition supplies the real `NO_VERIFIED_RESULT`/no-presentation control rather than treating a hand-built empty array as success.
- Static safeguards for this Phase 1 code slice: `npm run typecheck`, `npm run arch:check`, and `git diff --check` all passed. The Phase 4 whole-suite/build gate remains intentionally unrun because the authorized work stops before Phase 2/3; this is not a full H005 or Live acceptance.
- The first targeted run exposed one real test-composition omission: a shared fixed-source execution/evaluator test supplied no final presentation record to the strengthened acceptance function. The test now projects candidate IDs, Runtime batch target and authoritative `intentDraft.target.requestedResultCount` from the same final State that the real runner uses. This is a test-path repair, not a relaxed acceptance rule.
- Independent before/after evidence is retained separately. The pre-fix assessment records that the same qualified default `3/2/false` result failed solely for batch count; the read-only reassessment of the immutable historical H005 artifact now returns **PASS/COMPLETE** with `defaultBatchTarget: { target: 3, actual: 2, met: false }`. A post-review negative control preserves the distinct State-count/registration-omission false PASS and its new failure result. Evidence: [pre-fix failure](../../.eval-artifacts/h005-2026-09-20-phase1-terra/pre-fix-default-short-batch-acceptance.json), [offline reassessment](../../.eval-artifacts/h005-2026-09-20-phase1-terra/h005-fixed-source-offline-reassessment.json), and [omission rejection](../../.eval-artifacts/h005-2026-09-20-phase1-terra/post-review-explicit-count-registration-omission.json). No provider, browser, Google, website, booking or Live execution occurred.
## TEST-2026-09-20-H005-PHASE-2-CATEGORY-NEGATIVE-OFFLINE

- Focused production/evaluator composition: `node --import tsx --test src/eval/restaurant/agent-loop/category-negative-fact-judgment-matrix.test.ts src/integrations/restaurant-facts/model-fact-judgment.test.ts src/domains/restaurant/action-validator.test.ts src/eval/restaurant/agent-loop/diagnostic-evaluator.test.ts src/eval/restaurant/agent-loop/current-development-offline.test.ts` — **100/100 PASS**. Covers frozen F1–F8/16-attempt matrix shape, cited category `UNKNOWN` eligibility without verified-negative promotion, conflict priority, non-category fail-closed behavior, generic raw type routing, name-only rejection, independent evaluator citation/identity/currentness reconstruction, H001–H005 offline composition and the existing user-turn strength reset path.
- No paid model, Google, website, browser, fixed-source real-model run, Live run, booking, Gold/private Holdout access, commit or push. Matrix design is not execution evidence.


## 2026-09-20 H005 final review — Mock gates pass; real-model matrix rejected

Targeted preflight 110/110; Hybrid composition 33/33. Full Mock npm test 483/483 after rerunning with permitted localhost listening (initial sandbox result 462 pass / 21 EPERM). typecheck, arch:check, build and diff check passed. Real-model synthetic matrix: 16 attempts, zero retries, 20,618 tokens; F1–F7 14/14, F8 0/2 (UNKNOWN instead of CONFLICT). H005 Phase 3 and Live NOT RUN. No model calls after matrix failure. See [independent review](H005-CATEGORY-NEGATIVE-REVIEW-2026-09-20.md) for immutable artifacts, actual behavior coverage, failure attribution and limits.


## 2026-09-20 H005 F8 UNKNOWN attribution follow-up

Six offline saved-response/counterfactual controls reconstructed both original F8 requests exactly and isolated model output from production claim acceptance. Original UNKNOWN is retained; counterfactual CONFLICT becomes violation with grounded identity and is rejected without identity. Valid 86-token original outputs exclude truncation/fallback as the source of UNKNOWN. Zero new provider calls; no production edits or full-suite rerun. [Findings and evidence](H005-CATEGORY-NEGATIVE-REVIEW-2026-09-20.md#follow-up-why-grounded-mcdonalds-returned-unknown).


## 2026-09-20 Worktree H001–H005 rerun independent comparison

Read-only reevaluation of five saved worktree-1135 artifacts: H001/H005 all dimensions SATISFIED; H002–H004 grounding/investigation/resources SATISFIED and wording NOT_EVALUATED. All three complete criteria arrays, request fields and raw-user hashes match their 2026-09-18 manually accepted counterparts. Bounded manual semantic acceptance retained; original AUTO_FAIL untouched. Zero new model/source calls, no production edits. [Comparison](FIXED-SOURCE-SEMANTIC-COMPARISON-2026-09-20.md).


## 2026-09-20 Prompt@8 integration and pre-commit verification

- Scope: integrate the final accepted worktree implementation, preserve historical runs and separate automatic/manual fixed-source acceptance.
- Read-only raw artifact checks: Prompt@8 F1-F8 x2 **16/16 PASS**; F8 remains generic restaurant type plus HIGH source-grounded entity; exact prompt equals integrated production text. Original 12:32 network failure and Prompt@7 14/16 failure remain unchanged. Successful matrix SHA256: `e7ac796136faf6d98d1efc02a3ac766fe635f8706ad5eaa76e6c7178f11c5400`.
- Production comparison: 138 tracked non-test src files byte-identical to worktree 1135. Local-food paragraph SHA256 unchanged: `49c15a0186b7917a56d096ee1cc03c53f25018164f0779b8f2309b352db63193`. No Gold/source fixture changes.
- Integrated code gates: `npm run typecheck`, `npm run arch:check`, `npm run build`, `npm test` **483/483 PASS**, no skips/todo, `git diff --check` PASS. Full tests use authorized loopback permission; no .env or paid provider access.
- Existing real-model evidence reused: one H005 AUTO PASS, then H001-H005 all three-candidate presentations; H001/H005 automatic PASS, H002-H004 bounded independent manual semantic acceptance with original automatic FAIL retained. No fresh paid-model, real Google/browser source, private Holdout or booking calls.
- Logs and file/hash manifest: `.eval-artifacts/h005-commit-verification-2026-09-20/`. Persistent run hashes and review: [five-case comparison](FIXED-SOURCE-SEMANTIC-COMPARISON-2026-09-20.md), [category review](H005-CATEGORY-NEGATIVE-REVIEW-2026-09-20.md#prompt8-follow-up-and-commit-integration). Artifacts remain Git-ignored; this exposed fixed-source evidence is not Live or a Clean Baseline.

## TEST-2026-09-24-TEST-EVAL-SKILL-DOCUMENTATION

- Scope: pure documentation restructure for Test/Eval/Planning/Post-change, one superseded Eval snapshot/migration map, and an independently accepted paper review. No source code, ADR, Gold, fixture, private Holdout, artifact, provider, browser, Live or external write changed or ran.
- Checks: `git diff --check` passed. Root independently checked the current modified/new Markdown local links and anchors (13 documents, 342 references): no errors. All 11 referenced package scripts exist; the archived Eval body is byte-identical to commit `2b64388` (SHA-256 `3db37975cd23dfe0e5298878071ee9a8121e6b4cb37da81ae9ab83f07b147a4a`). No code suite is claimed or required for this document-only scope.
- The paper review is design evidence only: its multi-candidate, H005 time and booking recovery rows are not test executions, implementation acceptance, or future provider capability claims. Current contracts and the documented Live P0 blocker remain unchanged.
## TEST-2026-09-29-H001-NATIVE-TAIL-CHECKPOINT-AND-H003-DEVIATION

- Offline local identity/availability/source-route regression: `node --import tsx --test src/integrations/tabelog/tabelog-browser-availability.test.ts src/integrations/tablecheck/tablecheck-browser-availability.test.ts src/integrations/restaurant-availability/availability-source-resolver.test.ts` — **76/76 PASS**. Native wrong-ID and changed-address controls reject cross-outlet success; native UNKNOWN stays on its own platform.
- `npm run typecheck`, `npm run arch:check`, `npm run build` — PASS. Default `npm test` in the restricted sandbox failed only when HTTP tests attempted `127.0.0.1` listening (`EPERM`); the same offline suite in the permitted local environment passed **539/539**, zero skip/todo. Full suite log: `/private/tmp/praxis-h001-stage1-npm-test-20260929.log`.
- No native-search→Router/Runtime/Agent composition test, independent H001 evaluation, fixed-source real-model run or H001 Live run has been performed; stage 1/2 is not complete. The old H003 read consumed **77,685 ms / 11 model calls** and returned two `UNKNOWN/BROWSER_TIMEOUT` checks, zero Offer. It is an out-of-scope Live Read-only result, not part of the offline tests or H001 evidence; see [deviation record](H003-TABLECHECK-NATIVE-LOOP2-SCOPE-DEVIATION-2026-09-29.md).

## TEST-2026-09-29-H001-NATIVE-FIXED-SOURCE-REAL-MODEL

- Mode: real DeepSeek model with offline fixed source pages and fixed Google location response. Frozen exposed H001 request and derived prompts were sent only after the user explicitly authorized this data transfer; an earlier unsandboxed command was rejected by automatic approval review and did not run. The first ordinary-sandbox attempt had `NETWORK/ENOTFOUND` before a model response and remains a separate inconclusive artifact.
- `TABELOG_DELIVERS`: `SUCCEEDED/TERMINAL/PRESENT_RESULTS`, three Tabelog candidates, **11,800 ms / 9 model calls / 35,596 tokens**. Independent Eval: qualified `YES`, all six findings `SATISFIED`. TableCheck navigation count zero; one fixed Shibuya location resolution, zero Google restaurant search or details. [Execution](../../.eval-artifacts/h001-native-fixed-source-model/2026-09-29T04-12-11-311Z-a5791cc6-4f6d-4804-b2d7-c0bed9c2d9d0.result.json), [independent Eval](../../.eval-artifacts/h001-native-fixed-source-model/2026-09-29T04-12-11-311Z-a5791cc6-4f6d-4804-b2d7-c0bed9c2d9d0.result.evaluation.21-1790655143120.json).
- `TABLECHECK_RECOVERS`: first Tabelog batch did not deliver, then three distinct TableCheck candidates reached `SUCCEEDED/TERMINAL/PRESENT_RESULTS`, **17,076 ms / 14 model calls / 54,431 tokens**. Independent Eval: qualified `YES`, all six findings `SATISFIED`. One fixed Shibuya location resolution, zero Google restaurant search or details. [Execution](../../.eval-artifacts/h001-native-fixed-source-model/2026-09-29T04-13-08-370Z-07e46c54-52b1-4068-872e-56d08e2a0335.result.json), [independent Eval](../../.eval-artifacts/h001-native-fixed-source-model/2026-09-29T04-13-08-370Z-07e46c54-52b1-4068-872e-56d08e2a0335.result.evaluation.21-1790655205456.json).
- Both invocations used their own unchanged 300,000 ms / 50 model-call / 30-step ceiling. No real restaurant/Google request, booking write, `BOTH_BOUNDED_EMPTY` paid-model control or H001 Live run occurred. These timings cover semantic, fixed location, native search, detail, facts and same-source availability in the controlled environment; they do not estimate real website latency or live inventory. Full offline code gates were previously 548/548 with typecheck/arch/build passed; no production code changed in this model-only follow-up, so those gates were not repeated.

## TEST-2026-09-29-H001-NATIVE-SINGLE-LIVE-READ

- Mode: one user-authorized real-source Live Read-only via the formal hybrid runner with `--native-discovery`, local Chromium/default network. The first proposed command was previously rejected by automatic approval review before start because fixed-page authorization did not cover real Google/Tabelog/TableCheck access; the user then explicitly authorized Live. This section records **one** actual invocation only. Frozen H001 was materialized to Tokyo `2026-09-29` 19:00, 2 people, Shibuya NEAR, omakase HARD; no evaluation-location/proxy/radius override.
- Actual run: **39,515 ms from before semantic/location/native search**, 5 Agent steps, 6 model calls / 25,315 tokens, 1 Google Shibuya location resolution, 0 Google restaurant discovery/details, 2 browser runtime operations for the later Tabelog candidate check, 0 browser model actions. Limits: 300,000 ms whole run, 50 total model calls, 30 steps, 60,000 ms candidate, 30,000 ms provider. Tabelog admitted one geographically verified Sushi Teppen candidate at 749 m; its availability was `UNKNOWN / ENTITY_MATCH_UNCERTAIN` with zero Offer, and native fact read `UNKNOWN / NATIVE_SOURCE_IDENTITY_UNCONFIRMED`. TableCheck continuation admitted zero candidates with no explicit failure code; raw page/rejection counts were not captured, so no all-site/no-inventory conclusion is valid.
- Terminal phase `NO_VERIFIED_RESULT`, no presentation, no HARD omakase support or request-bound slot. Process `SUCCEEDED` denotes normal scoped stop only. Independent Eval: `taskProducedQualifiedResult=NO`; authoritative conditions, investigation and resources `SATISFIED`, required evidence, final claim and completion outcome `NOT_EVALUATED`. [Execution](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-29T04-49-44-008Z-230092e7-b54a-433a-8799-e974bd4f6373.result.json), [independent Eval](../../.eval-artifacts/restaurant-hybrid-live-read/2026-09-29T04-49-44-008Z-230092e7-b54a-433a-8799-e974bd4f6373.result.evaluation.21-1790657423499.json), [review and limit](H001-NATIVE-LIVE-2026-09-29.md).
- No code changed for this run, so the previously passed 548/548 offline suite and typecheck/arch/build were not repeated. No second Live, booking submission, external Agent write, commit or push. External side-effect count remains `NOT_MEASURED` in the runner artifact, so this is not a full network side-effect audit.


## TEST-2026-09-29-TABELOG-LEAD-PATH-DIAGNOSIS

- 主任务按用户截图亲自执行真实来源只读主页→Tokyo→单店，并通过生产 Chromium/observer/click 验证日期和人数变更；无模型、H001 整轮或预约提交。
- 正常店铺控件延迟出现后可读取与操作，库存接口 200；Teppen 当前日期电话/关闭、人数禁用，现有 ready 条件仍通过。明确区分来源限制、观察缺口及未知精确库存。
- [完整诊断及原始证据](TABELOG-LEAD-PATH-DIAGNOSIS-2026-09-29.md)包含首轮 popup 混合记录排除及末尾可选局部截图失败；未改生产代码，未重复全量离线门禁，未声称 H001/Playbook 通过。


## TEST-2026-09-29-TABLECHECK-LEAD-PATH-DIAGNOSIS

- Live Read-only 主任务诊断 + 保存来源页的离线生产解析；无模型/H001整轮/预约提交。主页与搜索成功，实际日期/人数/时间修改及回读成功；稳定来源库存解析能完成。
- 发现搜索外层 combobox 被标为可填写 INPUT、店名链接默认点击位置被卡片文字遮挡（一次定向复现30秒，底层cause已保存）。直接同href导航成功不算原点击链通过。
- 最近 H001 TC 是前五候选地点过滤，未进入单店；旧导航超时与旧控件回读失败不能混同。详见[诊断与证据](TABLECHECK-LEAD-PATH-DIAGNOSIS-2026-09-29.md)。未修改生产代码，不重复全量测试，不声明 H001 通过。

## TEST-2026-09-30-NATIVE-SOURCE-READ-CHECKPOINT

- Latest offline gates after the Teppen target-date Adapter repair: `npm test` **564/564 PASS**, local Chromium browser Fixture **54/54 PASS**, `npm run typecheck`, `npm run arch:check`, `npm run build` and `git diff --check` PASS. The saved Teppen DOM Chromium test failed on the old generic restriction reason and passed with the specific target-date UNKNOWN reason; the date-state control also distinguishes FULL, PHONE_ONLY, CLOSED and hidden-month UNOBSERVED. See [target-date evidence](H001-TEPPEN-TARGET-DATE-2026-09-30.md).
- The authorized same-day Teppen single-page read was Live Read-only, not an Adapter or full H001 rerun. It observed a closed September 30 calendar cell, selected but disabled guest count, and no captured inventory response. The H003 post-repair Live retry stopped at navigation timeout. Neither run produced an Offer or booking write; no current source inventory or end-to-end H001 acceptance is claimed. See [browser case evidence](BROWSER-CASE-SLICE-LIVE-2026-09-30.md) and [query capture](H001-TEPPEN-QUERY-CAPTURE-2026-09-30.md).

## TEST-2026-10-01-H001-ABC-REMEDIATION-AND-FIXED-SOURCE-REAL-MODEL

- Offline/local gates: native discovery composition **16/16**, TableCheck availability + native composition + Browser Executor **91/91**, and browser case-slice evidence **3/3**. `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check` passed. The complete default suite passed **575/575** in the permitted host environment. The restricted sandbox's 22 failures were all `EPERM` on `127.0.0.1` listener setup and did not execute a product assertion. Local Chromium fixture passed in the host environment.
- Authorized paid model, fixed-source-only paths, each bounded at 20 model calls, 20 agent steps, and 120 seconds: `TABLECHECK_DISCOVERY_RECOVERS` was `SUCCEEDED/PRESENT_RESULTS`, 8 calls/9,120ms, one TableCheck Offer, independent evaluator qualified `YES`; `DYNAMIC_TABELOG_DELIVERS` was `SUCCEEDED/PRESENT_RESULTS`, 9 calls/10,779ms, one Tabelog Offer after model-controlled date and party selection, qualified `YES`; `BOTH_BOUNDED_EMPTY` was `SUCCEEDED/NO_VERIFIED_RESULT`, 4 calls/5,035ms, qualified `NO`. The first two demonstrate evidence-grounded presentation; the third demonstrates bounded no-result handling. All page and Google data were fixed/intercepted. No real-source access, H001 Live, reservation write, retry, or claim of current availability occurred. [Artifacts and limits](H001-ABC-REMEDIATION-2026-10-01.md).

## TEST-2026-10-01-TABLECHECK-EXACT-QUERY-RESPONSE-COMPATIBILITY

- Adapter contract: `node --import tsx --test src/integrations/tablecheck/tablecheck-browser-availability.test.ts` — **47/47 PASS**. The new cases prove that only a page-owned same-shop GET response with the exact Tokyo date, adult count and a single requested time can ground an explicit `failure/data:null` result; wrong outlet, party, response status and wider time window remain unaccepted. The adapter integration verifies passive response-rule registration before grounding.
- Current-source diagnostic: one user-authorized, 30-second, no-model local Chromium LAVAROCK probe selected only observed native adult and time controls. It made no click, fill, link open, form submission or POST. The final controls confirmed `2026-10-03`, 2 adults and 19:00, but no same-shop `/available` response arrived and the submit control remained disabled. Artifact: `.eval-artifacts/tablecheck-availability-query-probe/2026-10-01T10-12-35-545Z-8323cbcb-2011-4f55-afc6-628d5516833d.result.json`. This is not current inventory or H001 acceptance.

## TEST-2026-10-01-TABLECHECK-EXACT-QUERY-RESPONSE-FINAL

- Final regression after the passive exact-response compatibility change: `npm test` **580/580 PASS** in the permitted local host environment; `npm run test:browser:fixture` passed in the same environment; `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check` passed. The restricted sandbox cannot launch macOS Chromium because its browser rendezvous port is denied before fixture execution; that environment failure is not recorded as a product assertion failure.
- The compatibility code is fail-closed: only an observed page-owned same-shop response whose URL carries the exact Tokyo date, adult count, and one requested time can ground the provider's explicit empty result. The bounded LAVAROCK diagnostic produced no such response and left submission disabled, so this remains `PENDING_SOURCE_EVIDENCE`, not `UNAVAILABLE`, an Offer, or H001 success.

## TEST-2026-10-01-H001-TOMORROW-NATIVE-LIVE

- Mode: one user-authorized real-source Hybrid Live Read-only run using `LOCAL_CHROMIUM`, real DeepSeek, one Google named-place resolution, and the H001 tomorrow-date variant. The original H001 input and Gold were unchanged; runtime materialized Tokyo `2026-10-02 19:00`, two people. The command fixed 300,000ms, 50 model calls, 30 Agent steps, 30 availability-browser operations per candidate, 60,000ms per availability candidate, and 30,000ms per provider. No retry, booking, payment, cancellation, or other external write was performed.
- Execution: `SUCCEEDED / NO_VERIFIED_RESULT`, 143,778ms, 13 model calls, six Agent steps, one named-place Google request, zero Google restaurant discovery/details, zero Offer. Tabelog ran first and accepted Sushi Teppen only after native same-source HIGH identity and omakase facts; the exact October 2 calendar date was not observed as a safe control, so the final availability result was `UNKNOWN / REQUEST_SELECTION_UNCONFIRMED`. TableCheck then ran: 21 raw, 19 parsed, five inspected and no candidates through the unchanged 1km gate; fourteen entries remained deferred. Its bounded continuation stopped at `BROWSER_TIMEOUT` waiting for a public source result anchor, not an empty result.
- Independent evaluator@22: authoritative conditions, investigation lineage and readable resource accounting `SATISFIED`; qualified user result `UNKNOWN`; evidence, final claim and completion result `NOT_EVALUATED` because no request-bound slot reached presentation. The artifact records 31 native-discovery TableCheck runtime operations despite `--max-browser-operations 30`, exposing that this command ceiling currently reaches availability but not native discovery. This is a scope/accounting defect; it is not treated as a successful global-cap check. [Full record](H001-TOMORROW-VARIANT-NATIVE-LIVE-2026-10-01.md).

## TEST-2026-10-03-H001-UNIFIED-DISCOVERY-EXECUTION

- Scope: H001 work packages A/C/D/E offline repair; no provider/model/Live run.
- `node --import tsx --test src/integrations/tablecheck/tablecheck-browser-availability.test.ts src/eval/restaurant/agent-loop/native-discovery-composition.test.ts`: **66/66 PASS**.
- `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check`: **PASS**.
- `npm test` in the sandbox: 558/580 with 22 `listen EPERM` loopback-environment failures. Re-run with the approved host-loopback execution: **580/580 PASS**.
- Not covered: real TableCheck failure-payload semantics, fixed-source paid-model runs, and H001 Live. These remain separate gates and were not inferred from fixtures.

## TEST-2026-10-03-H001-TOMORROW-NATIVE-LIVE-TRANSPORT

- One user-authorized real-source, read-only H001 tomorrow variant ran with `LOCAL_CHROMIUM`, the existing Google-only proxy, native discovery, and ceilings of 300,000ms, 50 model calls, 30 Agent steps, and 30 browser operations per candidate. It materialized `2026-10-04 19:00` for two and executed no booking write or retry.
- The real host run stopped `FAILED / LIVE_CASE_NOT_COMPLETED`: semantic interpretation and one Agent discovery decision succeeded, while its single Google named-place request failed as `GOOGLE_NETWORK_FAILED`. Usage was 3,490ms, two model calls, zero source browser calls, zero candidates, and zero inventory results. The no-progress guard closed the run after that first failed search.
- The source client intentionally emits a stable error code but does not retain a redacted transport cause, so this result does not distinguish proxy availability, DNS, TLS, or upstream connectivity. It does not exercise or validate the Tabelog/TableCheck/browser repairs. [Artifacts and limits](H001-TOMORROW-VARIANT-NATIVE-LIVE-2026-10-03.md).

## TEST-2026-10-03-H001-UNIFIED-REVIEW-RETURN

- Offline regression after A–D review return: `npm run typecheck` passed; `node --import tsx --test src/eval/restaurant/agent-loop/native-discovery-composition.test.ts src/integrations/tablecheck/tablecheck-browser-availability.test.ts src/infrastructure/browser/browser-task-executor.test.ts` passed **99/99**.
- The controls include: retained native entrance after a failed detail and failed replacement session; stale nonempty TableCheck discovery followed by observed retrieval fill and refreshed result; disabled HTML/control exact-slot conflict; historical `data-is-disabled="false"` positive behavior; requested-window-only control comparison; and current batch completion gating. This is offline fixture evidence, not a real provider or model result.
- Final host-loopback gate: `npm run arch:check`, `npm run build`, and `git diff --check` passed; `npm test` passed **587/587**. The sandbox-only full test had 22 pre-assertion loopback `listen EPERM` failures; host-loopback execution is the recorded definitive local result.

## TEST-2026-10-03-H001-UNIFIED-FINAL-OFFLINE-REGRESSION

- Focused evidence: native discovery composition **23/23** (including stale explicit-empty/nonempty `REQUEST_HUMAN_HELP` rejection and a 1 ms source-session deadline retaining its pending entrance); TableCheck Adapter **52/52** (including hidden exact request link with no live slot → `UNKNOWN`). Current fixed-source/diagnostic trace regression **83/83**.
- Final gates: `npm run typecheck`, `npm run arch:check`, `npm run build`, host-loopback `npm test`, host-local `npm run test:browser:fixture`, and `git diff --check` all passed. The unrestricted host execution is required only because sandboxed macOS Chromium fails before test assertions at Mach rendezvous setup.
- This is fixed-page/offline evidence. It makes no claim about current provider inventory and does not include a paid fixed-source model run, H001 Live run, or any booking write.

## TEST-2026-10-03-H001-NESTED-HIDDEN-SLOT

- Actual TableCheck Adapter fixtures cover a nested hidden same-tag ancestor containing the exact request link (`UNKNOWN`, zero Offer) and an enabled visible same-link sibling (`AVAILABLE`, one Offer). `npm run typecheck` and `tablecheck-browser-availability.test.ts` **53/53** pass. This is an offline parser correction only.

## TEST-2026-10-03-H001-POST-REVIEW-LIVE-QUERY-FIELD

- Native composition **25/25**: a full reservation-sentence `retrievalHint` yields Tabelog `sw=omakase` from the structured HARD criterion; fixed TableCheck input readback derives the expected phrase from the source URL's `search_text`, rejects a wrong phrase, and reveals a candidate only after the exact current URL phrase.
- `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check` passed. The paired real Tabelog reading is diagnostic evidence of query semantics only; it makes no stock or end-to-end success claim.

## TEST-2026-10-03-H001-TABLECHECK-OBSERVED-RESERVATION-PATH

- First red run: the added same-outlet Omotesandoria fixture failed because the parser admitted only `/en|ja/shops/<slug>/reserve[/landing]`; its enabled, request-bound `/en/omotesandoria/reserve/landing` link yielded no slot.
- Green regression: TableCheck Adapter **54/54** passes with the observed non-`shops` landing path and the established `shops` path. The new control keeps same-slug exact-date/party/time acceptance while rejecting a neighbouring outlet, wrong date, wrong party and disabled link in both HTML and hydrated-control parsing.
- `npm run typecheck`, `npm run arch:check`, `npm run build`, and `git diff --check` pass. The Live trace supplies a raw reconstruction of the selected controls and reservation URL, not an original full-HTML replay or a restaurant qualification/inventory conclusion. Bellwood's `require_service_category` remains outside this URL-format slice.

## TEST-2026-10-03-H001-FINAL-MODEL-LIVE-AND-STOCK-ACCEPTANCE

- **Historical relation and independent expectation:** existing saved-entrance and slot tests missed actual list reread, false-disabled attributes, nested hidden descendants and the observed non-`shops` reservation path. Review reuses those behavior tests and saved source responses; synthetic mutations remain labelled. Root subsequently recovered the original full HTML from the immutable Live callback argument and verified its hash equals Snapshot 129. Original replay gives nine slots including 19:00; isolated foreign outlet, wrong date and wrong party give zero slots. This supersedes only the earlier reconstruction-only evidence limit, not the original failed run.
- **Offline final:** native composition 25/25, TableCheck Adapter 54/54, collector/current-development/raw-evaluator/acceptance 98/98; typecheck, architecture, build and diff checks pass. The actual DOM-hydration counterexample initially exposed both per-handle error propagation and live-index successor omission. Existing Chromium coverage was extended with a removed first node preserving later enabled/disabled controls and an attached error that must rethrow. The full fixture exposed two existing passive-response lifecycle tests failing after this packet removed navigation reset (62/64); restoring reset preserves initial destination capture. Focused affected controls 4/4, definitive full host-local fixture 64/64 PASS. Earlier reported browser-green evidence lacked matching-code provenance and is superseded; sandbox Mach startup denial is separately an environment limitation.
- **Fixed-source real model:** the corrected `TABLECHECK_DISCOVERY_RECOVERS` fixture preserves actual query fill/readback; three fresh runs f810cfe0…, e5a7d830…, 7299f4f3… each executed PRESENT_RESULTS with one independently qualified result, ten calls, 13,687/12,967/13,299ms. All six mandatory dimensions SATISFIED and acceptance PASS. These are real model/fixed transport, not current website stock. The first three Boolean-fill fixture runs remain historical evidence with the stated retrieval-readback limitation.
- **Complete Live Read-only:** `61053f42-5ba3-412f-94da-6aecbee10476`, tomorrow variant October4/two/19:00, unchanged 1km/HARD omakase, 300,000ms/50calls. Actual 231,118ms / 38 calls / 109 runtime calls / one Google named-place request, five admitted candidates/five stock checks, zero qualified presentation. Evaluator@24: conditions/investigation/resources SATISFIED; evidence / final claim / completion NOT_EVALUATED. Predeclared manual H001 acceptance FAIL. Compared with October1 one candidate/one stock read, stages progressed; changed date/site state prevents a strict performance A/B. First failed post-review Live 65e6734b… and its diagnosed Tabelog query regression remain preserved.
- **Targeted current-stock Live Read-only:** budget45s overall/30sprovider/5calls/24operations, same observed Omotesandoria and Oct4/two/19:00. First 045fb39b… failed control observation at 8,432ms/zero calls; after generic repair, 341dabbc… returned AVAILABLE/one 19:00 Offer in 15,975ms / one call / 11 operations. Independent raw acceptance verifies source/title continuity, observed enabled date control 34→proposal 41→actual click 45→exact current link Snapshot 49→selected/enabled Controls 53, with no later state mutation or booking write. Stock-only acceptance PASS; HARD omakase and Runtime delivery NOT_ASSESSED, full H001 Evaluator inapplicable for this slice. Complete H001 stays FAIL.
- **Evidence and freeze:** [final review](H001-UNIFIED-REVIEW-2026-10-03.md); final 222-file executable hash `2efb2b612165abb272d2896840ef521b74ad3cd8d2f8a26d7ac3986380155551`; immutable Live acceptance `.eval-artifacts/h001-unified-review-20261003/post-repair-live.acceptance.json` and stock acceptance `stock-only-live/2026-10-03T07-49-57-132Z-341dabbc-3f1a-453d-a6d5-d16c006fef3e.result.acceptance.json` under that review artifact directory. No Clean Holdout, Gold, Semantic or booking-write change. Remaining service-category/date/observation-cost gaps are recorded without expanding this slice.

## TEST-2026-10-03-H001-PROVIDER-OBSERVATION-BUDGET-VARIANT

- User-authorized configuration-only slice: shared `LIVE_READ_DEBUG_INVESTIGATION_BUDGET.maxProviderBrowserMs` changes from **30,000ms** to **45,000ms** for existing Web and H001 Runner consumers. `maxCandidateBrowserMs` remains **60,000ms**, preserving 15,000ms for the existing alternate observation; all other model, operation, and global values remain unchanged.
- Historical `61053f42` retains its recorded 30-second ceiling and failure outcome. The next H001 variant may explicitly use `--timeout-ms 300000 --max-model-calls 50 --max-provider-browser-ms 45000`; `30000` remains a valid stricter override.
- Regression uses existing executor deadline behavior rather than a duplicate constant assertion. No model, provider network, or Live validation is included in this configuration record.

## TEST-2026-10-06-H001-QUALIFIED-DELIVERY-OFFLINE

- **Historical red and controlled expectation:** root's immutable source probe records an actual public POST `reserveform` radio group without a `radioGroupLabel`; the prior permit returned `REQUESTED_HUMAN_HELP`. The follow-up probe permitted `SET_CHECKED` but was parent-aborted after 25,857ms without a post-selection query/result, so it is a source capability limitation, not inventory success. Root's separate old-registry artifact records native radios as `INPUT`; current registry records `RADIO`, checked state and `form:name` ownership. Neither artifact is a model/Live acceptance.
- **Green controlled paths:** offline local Chromium `browser-read-fixture` verifies the no-legend POST structure in LOCAL and CLOUDFLARE_SESSION, associated-label radio activation, group readback, no submit and request-bound synthetic output (**2/2**). Adapter/domain/evidence/website tests (**120/120**), native source/menu continuation plus scope-aware fact-judgment and run-budget tests (**19/19**), and `npm run typecheck` pass. The loopback Web W11 regression passes when run on the host; the sandbox refuses `127.0.0.1` listening before assertions.
- **Limits:** no real category result binding was observed, so synthetic `service_category` links prove only production wiring and fail closed for the real source. No paid model, provider network, booking write, fixed-source model run or 2026-10-07 Live variant was run in this slice.
## 2026-10-06 — qualified-delivery review-return offline gates

- Historical red evidence retained: category probes under `.eval-artifacts/h001-qualified-review-20261006/service-category-probe/` ended without a post-selection result; they remain FAIL/unknown rather than inventory evidence.
- Green: `npm run typecheck`; focused qualified composition/evaluator/fact suites **178/178**; ordinary persistent `LIVE_READ` W11 accounting composition **1/1**; local Chromium category fixture (LOCAL and CLOUDFLARE_SESSION) **2/2**; `npm run arch:check`; `npm run build`; `git diff --check`.
- Independent expectations exercised: failed model calls consume one per-run ceiling, two concurrent runs each use two permitted calls then reject a third, retained source work observes its original deadline, raw scoped offer/evidence/radio/link mismatches fail closed, and a scoped category cannot borrow a whole-page HARD menu fact.
- These are offline fixture and fixed-source composition results. They do not verify the unobserved real TableCheck category result contract, provider/model behavior, or the prepared 2026-10-07 H001 Live variant.

## TEST-2026-10-07-H001-NATIVE-FACT-ARTIFACT-AND-PROVIDER-READINESS

- **C controlled composition:** `PRAXIS_WRITE_NATIVE_STAGE2_ARTIFACTS=1 PRAXIS_NATIVE_STAGE2_ARTIFACT_DIR=h001-qualified-native-followup-20261007 node --import tsx --test --test-name-pattern='H001 native cited-menu follow-up' src/eval/restaurant/agent-loop/native-discovery-composition.test.ts` passed. The retained execution and evaluation are `.eval-artifacts/h001-qualified-native-followup-20261007/NATIVE_FACT_FOLLOWUP_DELIVERS.{execution,evaluation}.json`; the saved execution SHA-256 and evaluation `sourceArtifact.sha256` are both `8dccb1d4053cba689973c5428f51b45292acf3160c476a0c9161f295050c78bf`. Root's independent evaluation/acceptance sidecars are suffixed `.2026-10-06T16-49-32.721Z-48753bb1-f8e6-4f9e-830f-ce45fd5bcf06.root.*`.
- **D controlled result:** the existing local Chromium fixture injects one signal- and close-cancellable 31-second source `SNAPSHOT` delay after an ordinary asynchronous DOM update. Root's host Chromium suite passes **67/67**, including a 30-second provider timeout with no Offer and a 45-second provider completion with one current Offer. Neither source readiness's 10-second limit nor model `WAIT`'s 2.5-second limit changes. This proves controlled observation latency, not current external Teppen/Ajuuta behavior.

## TEST-2026-10-07-H001-QUALIFIED-DELIVERY-FINAL-OFFLINE-REVIEW

- **Required gates:** typecheck, architecture (zero forbidden dependencies) and build PASS; repaired default host suite **633/633 PASS**, zero skipped/todo; local Chromium **67/67 PASS**. Production sources and browser paths did not change after their gates, so those results are reused following the final fixture/test repairs.
- **Failure evidence retained:** the sandbox default attempt included local-listen `EPERM`; the first host default attempt also failed behavior assertions (628/633). Root returned four mechanisms: scope-fixture mutation alias, deadline stop contract, source-handoff raw trace and schema-11 persistence expectation. Terra fixed the existing coverage, and the complete default host rerun passed. The failed logs are retained separately from green logs under `.eval-artifacts/h001-qualified-review-20261006/final-gates-*`.
- **Independent acceptance:** C synthetic production composition and D controlled slow-source completion pass within their declared budgets. Scoped HARD mismatches and stale-metadata challenge/error pages now reject in independent comparisons and regressions. These do not establish the real service-category query/result binding or B qualified delivery.
- **Freeze/input:** source aggregate SHA `bfdcff4954e6e011728c6fbd6ba119135d5d3cf9137d59a61c32a2175da2db57`, 228 files, `240af33` plus dirty source hashes. Absolute input is **2026-10-07 19:00 Asia/Tokyo**, two diners, independent `h001-20261007-1900` variant; 500 seconds／50 cumulative calls, unchanged HARD/location/short-batch conditions.
- **Not run / remaining:** the separately authorized bounded real-source probe has since run; its three artifacts total 21,766ms / zero model calls and establish the category query contract only. Comprehensive fixed-source real-model and complete Live have not run. Complete Playbook/H001 acceptance remains open. [Root review and exact artifact links](H001-QUALIFIED-DELIVERY-REVIEW-2026-10-07.md).

## TEST-2026-10-07-H001-QUALIFIED-DELIVERY-B-SCOPED-MENU (in progress)

- **Historical failure / oracle:** before this package, native fact documents had no service scope and a scoped TableCheck availability observation deliberately emitted no page-wide `verifiedHardCriteria`. The retained source probes under `.eval-artifacts/h001-qualified-review-20261006/service-category-probe/` are the red source evidence: they establish public radio/menu/request fields, but no current positive category-bound inventory. `failure/data:null` is explicitly diagnostic-only.
- **Predeclared pass/fail:** only a public `menu-item-data` element structurally associated with its source menu text and an observed visible category radio can produce a scoped source document. Same-source but different category values, missing association, hidden/disabled slot, or unclassified response must not produce a qualified Offer. A future controlled positive inventory record is synthetic-only unless the raw source contract independently binds the selected category to a current result.


## TEST-2026-10-07-H001-QUALIFIED-DELIVERY-B-SCOPED-MENU

- **Historical failure and oracle:** the immutable three-probe sequence under `.eval-artifacts/h001-qualified-review-20261006/service-category-probe/` consumed 21,766ms / zero model calls. It proves only checked radio readback, public scoped menu text, and a category-bearing current `/available` GET. The observed `failure/data:null` response remains `UNCLASSIFIED_FAILURE`; it is neither a positive result nor no inventory.
- **Controlled production composition:** `PRAXIS_WRITE_NATIVE_STAGE2_ARTIFACTS=1 PRAXIS_NATIVE_STAGE2_ARTIFACT_DIR=h001-qualified-tablecheck-scoped-menu-20261007 node --import tsx --test --test-name-pattern="TableCheck reserve-menu scope" src/eval/restaurant/agent-loop/native-discovery-composition.test.ts` passed. It executes guide → initial missing-HARD judgment → observed same-outlet reserve source page → scoped Sushi citation → read-only `SET_CHECKED`/checked readback → bounded `WAIT` → synthetic-only exact current slot → `PRESENT_RESULTS`. Execution SHA-256: `b5566abc0c75afbfcfbf3c57cfa4dc3d853b9b14b68ede8b4ff3664257968ab6`. Its independent evaluation records all six dimensions `SATISFIED` and qualified `YES`; this accepts the controlled artifact only, not current website category inventory.
- **Regression checks:** the affected TableCheck/parser, native fact, fact-judgment and native composition suites **106/106 PASS**; `npm run typecheck`, `npm run arch:check`, `npm run build` and `git diff --check` PASS. They cover real outer `menu-item` association, non-DOM markup rejection, void/malformed tag containment, same `/shops` source continuity, reserve challenge/foreign-canonical rejection, sibling scope isolation, venue-wide remainder retention, and raw current-result evaluation. The full default host suite and Chromium fixture are deliberately left for root's post-review gate; their earlier 633/67 results do not certify this changed packet.
- **Fixed-source registration and limit:** `TABLECHECK_SCOPED_MENU_DELIVERS` is registered in the existing native fixed-source Runner with its existing 20 decisions / 30 operations / 60s candidate / 45s provider limits. It has not run the paid model. A current positive TableCheck category-result contract remains unobserved, so full Playbook B and H001 acceptance remain open.

## TEST-2026-10-07-H001-QUALIFIED-DELIVERY-BROWSER-FIXTURE-BASELINE-RACE

- **Historical failure:** root's post-B Chromium suite first finished **66/67**. `CLOUDFLARE_SESSION wakes for delayed visible query state and ignores hidden state` returned `waitForChange=false`. The saved failure log did not retain `beforeApply` values; the fixture's click-before-snapshot order and its 20ms update make an already-updated baseline the timing diagnosis, not a saved observed state. The adjacent visible checked-property fixture used the same ordering risk. This was a fixture-oracle race, not a production wait, source, budget, or model failure.
- **Repair and independent expectation:** both fixtures now assert their independent baseline before clicking (`party=2`/enabled and checkbox unchecked), then assert the delayed visible selected/disabled or checked-property change wakes the wait. The prior hidden-only mutation remains expected not to wake. No production source or timeout changed.
- **Verification:** the four LOCAL/CLOUDFLARE intercepted Chromium cases passed **4/4** under the host runtime using `node --import tsx --test --test-reporter=spec --test-name-pattern='wakes for delayed visible query state|ignores hidden form mutations' src/harness/browser/browser-read-fixture.test.ts`. Sandbox launch separately failed with macOS Mach-port permission denial before test assertions, so it is not treated as a product result. No model, provider network, booking or Live command ran.

## TEST-2026-10-07-H001-QUALIFIED-DELIVERY-SCOPED-REMAINDER

- **Historical finding / oracle:** parser review identified that `plainText` merged the entire unscoped reserve-page remainder, after which the unchanged 1,600-character source-statement limit could discard it. No pre-change red execution artifact was retained; root's later production-path challenge is independent green evidence and is not presented as a replay.
- **Controlled regression:** the existing native TableCheck fact-read path now supplies 32 separate public reserve-page paragraphs, each below 1,600 characters, plus a venue-wide `hot pot` conflict. It asserts that every paragraph and the conflict reach the unscoped source document while category menu excerpts remain scoped. The affected parser, native continuity/fact, model-fact and production composition suites pass **106/106** with `npm run typecheck` and `git diff --check` passing. No model, provider, booking or Live command ran.

## TEST-2026-10-07-H001-FIXED-SOURCE-CATEGORY-DECISION-RETURN

- **Historical failure / oracle:** immutable fixed-source artifact `2026-10-06T19-14-14-825Z-851a370a-1038-44bb-b2cb-4204f682753b.result.json` records a legal `REQUEST_HUMAN_HELP` after 9 model calls. Its TableCheck availability observation contains the current `Sushi`/`Bar` radio group; the old progress message only reported missing date/party state. The saved acceptance is FAIL and is not overwritten.
- **Controlled repair:** the production composition exercises the real BrowserTaskExecutor action projection. Its availability-first path asserts a current `Sushi` target exposes only `SET_CHECKED`, the objective/progress identify the category-query prerequisite, the checked readback and bounded wait occur, and it reaches synthetic-only `PRESENT_RESULTS`; the existing facts-first path asserts the reverse legal Agent order. `browser-action-decision` also verifies the generic prompt requires public HARD relevance rather than selecting a radio by position.
- **Artifact/evaluation:** `PRAXIS_WRITE_NATIVE_STAGE2_ARTIFACTS=1 PRAXIS_NATIVE_STAGE2_ARTIFACT_DIR=h001-qualified-tablecheck-availability-first-20261007 node --import tsx --test --test-name-pattern='availability before facts' src/eval/restaurant/agent-loop/native-discovery-composition.test.ts` passed and saved `TABLECHECK_SCOPED_MENU_DELIVERS.execution.json` (SHA-256 `485c408ddbeba54b6ac800ae828f49e8a26ff2e373ef875a4d61bff471bbb458`). A separate existing evaluator invocation produced `TABLECHECK_SCOPED_MENU_DELIVERS.execution.evaluation.25-1791314569539.json`, with all six required dimensions `SATISFIED` and qualified result `YES`. It is offline fixed transport and synthetic-only positive inventory evidence; it does not retest the model or provider.
- **Focused checks:** browser action, TableCheck adapter and production-composition tests **91/91 PASS**; `npm run typecheck` and `git diff --check` PASS. No external model, source, booking or Live command ran.

## TEST-2026-10-07-H001-COMPREHENSIVE-FIXED-SOURCE-REAL-MODEL

- **Frozen input / budget:** registered `TABLECHECK_SCOPED_MENU_DELIVERS`, canonical frozen August 19 H001, synthetic website/Google transport, real DeepSeek; 500,000ms / 50 calls / 30 Agent steps. Executable checkpoint `cedbcfa82e863d2fe6c45c6b3f9cb7ece07779bf5133c206fada9683c4e48686`; the independent October 7 Live input is unchanged. Before this run, root's final paragraph-repair host default suite passed **638/638**, build PASS; typecheck/architecture and unaffected Chromium cases are reused with the narrowly repaired 4/4 fixture packet separately recorded.
- **One authorized execution:** `PRAXIS_ALLOW_LIVE_MODEL_EVAL=1 npm run eval:restaurant:agent-loop:native-fixed-source-model -- --case h001 --scenario TABLECHECK_SCOPED_MENU_DELIVERS --timeout-ms 500000 --max-model-calls 50 --max-steps 30`. Result SHA `29b655232d7a634e13e6884331d04b74f536f258108b4f9917e51f7d2ac784a3`; **12,347ms / 9 calls / five Agent steps**, all nine Provider outcomes `SUCCEEDED`.
- **Actual path / verdict:** normal two-source discovery → availability-first → browser requests human help without choosing either category radio → same-outlet reserve facts and real cited judgments establish Sushi omakase → `END_READ`. No Offer or `PRESENT_RESULTS`. Runner and root acceptance both **FAIL**, qualified `NO`; `REQUIRED_EVIDENCE`, `FINAL_CLAIM`, `COMPLETION_OUTCOME` remain `NOT_EVALUATED`. Safe `SUCCEEDED` termination is not delivery acceptance.
- **Follow-up:** original artifact/evaluation/acceptance retained; returned to Terra for offline prompt/feedback and legal-order regression investigation. The raw strict browser request/response was not retained; reconstructed inputs must be labelled. Scripted facts-first/radio choices missed this model decision failure. No second paid run, source revisit, booking write or complete Live has started. [Exact executions, independent sidecars and review](H001-QUALIFIED-DELIVERY-REVIEW-2026-10-07.md#comprehensive-fixed-source-real-model-failure).

## TEST-2026-10-07-H001-SUPPLEMENTARY-REAL-MODEL-ACCEPTANCE

- **Final gates / source:** browser Prompt@7, fact Prompt@14; final 228-file aggregate `9821e563eb62b2c48a7e637a8a1a29465a5f947cfcfc47efe3aec534f2880283`. Root default host **640/640**, build PASS; affected actual intercepted Chromium category controls **2/2**. Terra affected91/91, typecheck/architecture PASS; unchanged slow-source packet reused, no new full Chromium67/67 claim.
- **Authorization / one run:** user “追加一次，通过后继续 Live”, same registered `TABLECHECK_SCOPED_MENU_DELIVERS`, frozen August19 input and synthetic source/Google, real DeepSeek, 500s/50calls. `2026-10-06T19-26-56-118Z-ebd793ad-fc7d-42b5-8042-3a7b00d87127.result.json`, SHA `182805fb69dfa909eb10ed51083e45f547c2036ec9dc38ffc94981eac938ea21`: **13,230ms／10 successful calls／five Agent steps**, actual category action + bounded wait + scoped cited facts + `PRESENT_RESULTS`.
- **Independent acceptance:** Runner PASS; root regenerated all guide/reserve/pending/result byte hashes and independently checked17 obligations, existing Evaluator@25/rubric@21 six dimensions SATISFIED, acceptance PASS. One qualified result, default3 target unmet but recorded under unchanged short-batch contract. No real positive category inventory or sustained reliability claim. Earlier real-model FAIL retained. [Execution and root sidecars](H001-QUALIFIED-DELIVERY-REVIEW-2026-10-07.md#decision-feedback-repair-and-supplementary-real-model-acceptance).

## TEST-2026-10-07-H001-ABSOLUTE-LIVE-GOOGLE-BLOCK

- **Full Live once:** after preceding gate passed, same frozen sources and absolute independent `h001-20261007-1900`, Tokyo Oct7 19:00／2／Shibuya／omakase HARD, 500s/50calls, native discovery. `2026-10-06T19-30-03-818Z-1571bc50-20c2-4467-a99f-deb132fe22ee.result.json`, SHA `7f5dc7718e8f06a8ce16c9f064c9867c5b8b7e44f62b1fe7d5eed09cddb20bc0`: **3,365ms／two successful DeepSeek calls／one Google named-place request**. `GOOGLE_NETWORK_FAILED`, zero candidates/Offers/browser calls/presentations; browser/menu/inventory NOT_REACHED.
- **Acceptance:** root reuses existing evaluator and QUALIFIED_RESULT acceptance against all six predeclared dimensions: FAIL. Automatic evidence/final/completion NOT_EVALUATED and goal UNKNOWN preserved; separate root manual goal NOT_COMPLETE. Read-only code path, no write action or browser call recorded; external-side-effect meter remains NOT_MEASURED. No price-based cost inferred.
- **Local diagnosis:** post-run configuration selects Google `http://127.0.0.1:10808`; host lsof sees no listener. Original transport cause not retained; not labelled proven ECONNREFUSED. No extra API probe or source change. User subsequently explicitly authorizes “当前网络连接下绕过10808重新跑一次live”; one new run starts with process-only empty Google proxy, unchanged input/ceilings. Its result is recorded separately on completion. [Exact evidence and evaluation](H001-QUALIFIED-DELIVERY-REVIEW-2026-10-07.md#complete-october-7-live-and-independent-failure-acceptance).

## TEST-2026-10-07-H001-DIRECT-GOOGLE-FULL-LIVE

- **One new authorized run:** user explicitly requests current-network bypass of10808. Only process `PRAXIS_GOOGLE_API_PROXY_SERVER=` changes; no `.env`, source, semantic/Gold/input/ceiling changes. All228 frozen source hashes match. Same Oct7 19:00 Tokyo／2／Shibuya／omakase HARD,500s/50calls. Result `2026-10-06T19-33-58-632Z-11c1347f-0aa2-4b72-8ff7-369293e91977.result.json`, SHA `f612d15674c115c54b5413b2d6d037d473baaa8c08e425743cc2e87f6e660b06`.
- **Actual resources / outcome:** **88,187ms／12 successful model calls／four browser decisions／28 runtime operations／one successful Google location request**. Tabelog2 outlets inspected,1 admitted inside existing1000m; one stock check, one HARD fact investigation; TableCheck continuation; zero Offers/presentations. CLI0/SUCCEEDED/TERMINAL/NO_VERIFIED_RESULT does not pass delivery.
- **Source diagnosis:** snapshot25's complete Oct2026 calendar marks7 closed; Guests2 selected but disabled, model correctly refuses other dates. Adapter UNKNOWN/REQUEST_SELECTION_UNCONFIRMED, no time-bound negative inventory. TableCheck wrapper combobox click opens suggestions; a WAIT is rejected for its recorded contract reason; later `Find availability` `dom:3:15` click is intercepted by the search-header strong element and times out after30,000ms. Source discovery43,831ms, raw2/parsed0, TABLECHECK_DISCOVERY_INCOMPLETE. No category/inventory path reached.
- **Independent acceptance:** same Evaluator@25/rubric@21 and predeclared QUALIFIED_RESULT with all six required dimensions: root FAIL; separate manual goal NOT_COMPLETE. Conditions/investigation/resources SATISFIED; evidence/final/completion NOT_EVALUATED preserved. Raw calendar/controls/error and source snapshot hashes support manual attribution; no strict WAIT JSON replay claimed. All models succeeded, no total-budget exhaustion. No external write recorded; meter NOT_MEASURED. [Exact execution, root sidecars and missing-coverage explanation](H001-QUALIFIED-DELIVERY-REVIEW-2026-10-07.md#separately-authorized-google-proxy-bypass-live).
- **Scope / remaining:** retained previous controlled PASS and network FAIL; two complete Lives authorized/started, one source failure and one bounded no-result, zero qualified deliveries. The fixed-source category model control does not cover this search-overlay interaction. No code repair, extra network diagnostic, automatic retry or whole-run-time increase follows this run.


## TEST-2026-10-09-P1-A-WP-A-DECISION-CAPTURE

- **对象／口径：** WP-A eval Runner 捕获链路；current executable／公开固定来源与 fixture model 的开发回归，非 Clean Baseline。生产 composition 保留 Interpreter／Compiler／Runtime／Validator／Router／browser executor，仅替换模型传输、Google来源和浏览器页面；不证明真实来源或模型质量，未运行 Live、Replay 或 Controlled Live-write。
- **门禁：** `npm run typecheck` PASS；`npm run arch:check` PASS（0 forbidden dependencies）；`npm run build` PASS。首次沙箱 `npm test` 为735/759，24项因 localhost listen EPERM／Chromium bootstrap权限失败；默认套件包含 Chromium截图Fixture，后按 Playbook 在宿主机重跑同一离线 `npm test`，**759/759 PASS，0 fail／skip／todo**。未运行额外浏览器套件或外部模型／来源。两份原始日志保留在本条 artifact目录。
- **门禁后一次离线组合：** `PRAXIS_KEEP_WP_A_CAPTURE=1 node --import tsx --test --test-name-pattern='WP-A offline composition' src/eval/restaurant/agent-loop/native-discovery-composition.test.ts` PASS（116ms组合执行，约848ms命令）。产物 `.eval-artifacts/wp-a-decisions-dyIQ6R/offline.result.json`（SHA-256 `67109536963f4c74c3fe1c23ded19394049f4e006b790062b5311352a2ba5a96`）；`offline.decisions.jsonl`（SHA-256 `d553bf8283e58280477d56068f40cc14a7f3b09b1ffa40edd3081a1fad9574cc`）。调用10＝捕获10；其中1次刻意 `TIMEOUT` FAILED，output／finishReason／usage为null；其余9次SUCCEEDED；捕获errors为空。
- **独立产物核对：** 按保存字节重算SHA，核对result资源分母与JSONL行数，不使用捕获器自己的计数作为唯一oracle。浏览器决策#8：observation revision2→DOM snapshot10；#9（TIMEOUT）：revision3→snapshot11。均绑定同一实际reserve URL；在 Recording manifest 中查到对应DOM文件并确认存在。输入消息／实际参数完整保留；成功输出和finishReason保留；默认套件另验证usage与存储失败、运行截止的晚到响应不重复追加。
- **检错与范围：** 组合断言曾抓住既有发现页DOM被Recorder省略，未通过修改来源规则掩盖；最终受控详情／日历路径证明捕获与已保存DOM的关联。未修改Recorder grammar或sanitize、不声称任意发现页均能重建。捕获失败不会影响模型结果；是否有DOM仍须检查Recording documents。无真实API／模型／外部来源调用、预约／支付／个人信息写入；基线变体／见证文件未触碰，后续工作包未开始。


## TEST-2026-10-09-P1-C-C0-CALL-BUDGET-DELIVERY

- **对象／证据状态：** C0 current executable；公开开发回归、fixture composition和真实历史事件回放，非Clean Baseline。生产解释／编译／Grounding／Validator／Router／持久化保持，只替换模型传输和来源。C0未运行Live Read-only或Controlled Live-write。
- **四门禁：** typecheck、arch:check（0 forbidden dependencies）、build PASS；宿主机npm test最终766/766 PASS，0 fail／skip／todo。初次沙箱741/765因本机listen EPERM／Chromium bootstrap失败，宿主机首次765/765；补Web接线测试后重跑最终门禁。原始日志在`.eval-artifacts/p1-c-c0-20261009/`，环境失败不作产品检错证据。
- **主要机制与覆盖：** 原交付策略在模型预算先尽时阻断已有结果，`hybrid-read-composition.test.ts`保留`red-policy.log`→`green-policy.log`（父项＋5子项6/6）；正常和决策跨阈值均实际展示一家具备同请求19:00／2人证据的候选，目标3且met:false；错人数、过期证据、用户明确3家均不开窗口、不展示。`run-bounded-model-gateway.test.ts`复用失败计数和并发Task隔离；W13 HTTP/PGlite生产接线累计语义＋2次Agent，阻止后续事实读取并实际展示，仅本机fixture。
- **结果独立核验：** W13既有diagnostic evaluator返回PRESENTATION_RECORDED；组合正例核对实际最终Phase、候选、源slot日期／人数、未满足目标、唯一窗口期限和后续源读取次数，不以coordinator终止标志定义成功。各反例仍依赖现有独立资格判定，无评分器／Gold改动。
- **历史事件回放：** `.eval-artifacts/p1-c-c0-20261009/fixture-verified/`保存kf-h001 #38／#49；append-only事件重建Context与当时捕获逐字段相等，原State短批REJECTED，增加窗口后各一次fixture模型得到ALLOWED并实际PRESENT_RESULTS。#38是4次剩余的显式边界对照（原13次剩余），#49真实2次剩余；不声称#38原运行应自然触发阈值。
- **首次审批与后续授权：** 自动审批先拒绝向DeepSeek发送保存的任务／上下文，理由为未明确授权具体payload出境；该次无请求发出。两份完整输入及hash在`pending-deepseek-inputs.json`；用户随后明确授权，实际请求逐字段匹配保存输入，无Prompt或模型输入修改。
- **真实模型回放完成：** `.eval-artifacts/p1-c-c0-20261009/replay-{38,49}.result.json`各1次DeepSeek `deepseek-flash`、模型耗时2,228／1,783ms，finishReason TOOL_CALLS；均选PRESENT_RESULTS，Validator ALLOWED并写RESULTS_PRESENTED事件。实际同一Sushi Suga、10/22／19:00／2人Offer与历史投影一致且未过期；首批target=3, met=false。合计2次模型，零浏览器／Google／餐厅来源读取，无重试；不证明长期模型成功率或完整Live改善。
- **既有诊断与独立核验：** `replay.final-acceptance.json`核对请求hash、真实调用分母、动作、实际Phase、历史候选／slot与新事件；PASS。单步文件直接诊断因缺materializedCase、资源和历史观察谱系失败，第一次拼装误用不存在的decidedAt导致空prefix，原文件均保留。随后按seed前State version 9／10继承原冻结8／9条真实轨迹，资源明确只计本次新增决策；`replay-{38,49}.complete-lineage.{result,evaluation}.json`的既有Evaluator@25／rubric@21六维均SATISFIED，SUFFICIENT_FOR_PRESENTED_RESULT／PRESENTATION_RECORDED。不修改Evaluator／Gold，不把历史来源读取当成本次Live。C0证据门槛已完成，未运行Live或Controlled Live-write。


## TEST-2026-10-09-C0B

- 原策略正例MODEL_CALL_BUDGET_EXHAUSTED／FAILED，red.log保留；新组合ready／no-qualified／expired三子项＋父项4/4，green.log。ready在read留4时UNKNOWN随后实际PRESENT_RESULTS，默认目标未满足；反例可用尽原上限。历史kf-h001 #38完整事件重建与捕获Context一致，控制6次预算、先查位，UNKNOWN后展示，3次fixture调用、0真实模型；historical-composition.result.json及historical-green.log。typecheck、arch:check、build PASS；宿主机npm test770/770，无skip/todo。模型传输和来源为fixture，仅继承历史证据，不证明新Live。
- 产物：`.eval-artifacts/p1-c-night-20261009/C0b/`；无新增站点代码，无来源／Google／真实模型调用；本地提交后继续E1，不推送。


## TEST-2026-10-09-E1

red.log保留旧算法对3种阶段/时间反例失败；新evaluator76/76，composition95/95，离线夹具24/24。全套首次因typed旧版本与缺阶段夹具失败，完整原日志保留；四门禁最终结果见E1/test-green-final.log等。11份重新评价all-11-diff.json：仅kf-h005借#471而非#497得到确定YES；其余10份findings与结论不变。真实模型0，未运行Live。


## TEST-2026-10-09-C6A

旧物化对新窗口断言失败red.log；关闭到期快速收尾的mutation反例red-expiry.log失败，恢复后green-final49/49；正例展示18:10真实slot，过期通过Router事件实际NO_VERIFIED_RESULT、零来源调用。11次DeepSeek Agent层counterfactual #40–50：6/11 ASK_USER，5/11合法CHECK，全ALLOWED。历史时刻在新窗口内，冻结标签前提有冲突，不能为期望而虚构过期。未声明回放完全验收；真实11调用/零Live。门禁最终记录见C6a目录。

- C6a最终四门禁PASS，775/775；首次完整套件保存旧context/prompt版本及H005代码合同17:00单点断言失败，caller fixture与用户10/9明确决定同步为30分钟，Gold@6原文未改、旧质量FAIL断言保留。这是合同变更，不是迁就实现；新版草稿仅待人工批准。


## TEST-2026-10-09-P1B

原样106/106调用完成、无失败；FROZEN错误88/92=95.65%，浏览器65/69=94.20%，AGENT23/23；正向7/7。静态重建尝试所有106：浏览器11缺DOM、72缺保存静态样式（其中57缺滚动几何）；Agent23需独立State层，全部明确不进入浏览器通过率。保存CSS缺口使旧代码直接暴露10guests，static-probe.json为证据，未注入猜测CSS/尺寸。重建真实0；原样106，累计今晚117。单元验证消息字节序/失败计账与脚本网络关闭2/2，red类型检查错误保留。四门禁最终结果见P1B目录。

- P1-B最终四门禁PASS，777/777；106原样真实调用与零重建真实调用的账本一致，无失败或重试。4个未复现的浏览器错误种子单列在summary.json，不做二次采样。


## TEST-2026-10-09-C5a

Offline red: C5a/red.log; browser-full.log retains outdated mandatory SCROLL assertion failures. green-final.log 9/9; final four gates and all Chromium Fixtures in C5a/*-final.log. Rebuild all 54 list seeds + 7 positive controls: 61 excluded (57 styles+geometry missing, 3 styles missing, 1 snapshot missing), C5a/rebuild-after/summary.json. Real model calls 0. Before/after and positive-control changes NOT_EVALUATED; denominator zero.


## TEST-2026-10-09-Q8

Read-only artifact analysis with source paths, steps, funnel/listing count scopes, SEARCH_COMPLETED candidates, frozen-witness file provenance and snapshot mentions. Q8 uses final unchanged code gates (typecheck/arch/test/build), 777/777 default tests. No red/green implementation delta: analysis only; discovery/green.log records schema/provenance coverage checks, discovery/red.md marks not applicable.


## TEST-2026-10-09-G1

Offline fake Route red G1/red.log; green G1/green.log 1/1 contract scenario with positive and forbidden shapes plus sensitive redirect and method borrowing. Four gates pass, 778/778 default tests. No Live capability conclusion. Capability Matrix marks draft/not integrated and maps the Harness scenario.


## TEST-2026-10-09-G1-INTEGRATE

G1/composition-red.log catches missing Guard admission in the previously green scripted compositions. First wired run exposes bare-link rejection; original failure artifacts retained. composition-green-final.log validates both orders and their bare-link controls; evaluator@26 generated from real composition artifacts. Four gates in p1-e-early-20261009/G1. No Live before commit.


## TEST-2026-10-09-GOLD7-DEFAULT

Gold7/red.log fails under old default. green.log verifies actual loader/materializer/evaluator and independent 30-minute expectation; approved default, both bounds, literal text preservation, H001-H004 equality, frozen Gold6 content and valid/invalid variant parent hashes. Final four gates in p1-e-early-20261009/Gold7. G1 two-order admitted versus bare-link composition remains in default suite.


## TEST-2026-10-09-P1E-EARLY-LIVE

- Evidence status: exposed development Live Read-only，非 Clean Baseline。冻结 `5aac4847407da59b5733c73b132c406dafa2b1b0`，宿主机 LOCAL_CHROMIUM/headless/no-proxy/无人工介入，两份 result 均记录 CLEAN。两例计入用户批准的 P1-E 计划；各 500s/50模型/40 Google。
- kf-h001 preflight TableCheck 503 为 ENV_FAILURE，0 模型/0 Google/未生成 Hybrid result；唯一重跑 preflight 恢复后运行 294,992ms/50模型/6 Google，MODEL_CALL_BUDGET_EXHAUSTED、无展示，@26 qualified UNKNOWN。kf-h003 首次 99,986ms/32模型/0 Google，实际展示1家；@26 证据/调查/资源 SATISFIED，条件措辞待独立确认，qualified UNKNOWN。
- 两次由现有 Runner 自动生成 evaluator@26，source SHA256 与执行产物一致。捕获 50/32 条等于模型计账，全部浏览器决策带观察和录制快照序号，capture errors=[]。录制仍 NOT_REPLAYABLE/UNSAFE_DOCUMENT，不当作完整回放验收；外部副作用数 NOT_MEASURED。
- [报告与 result/decisions/recording/evaluation 路径](../../.eval-artifacts/p1-e-early-20261009/report.md)。原 Gold6/variants/见证/review 哈希未变，保留所有失败与成功产物。本轮无错误展示自动判定，终局质量待独立复核；不写归因 sidecar、不修复、不运行其余3例、不推送。四门禁沿用两项实现提交前结果（G1 778/778，Gold7 779/779），本记录仅同步事实。


## TEST-2026-10-10-G1b

Guard contract red reproduces abort of reservation assets; green all four CDNs and four types admitted, wrong path/POST/fetch/third-party/cdn4 rejected. Four gates PASS, logs G1b/typecheck.log, arch-check.log, test.log, build.log. Offline fixed transport, no real models or Live; rendering remains unverified.


## TEST-2026-10-10-TableCheck-empty

Recorded GiNZA #13 / snapshot21 fixture red fails missing mealtime classification. green-composition.log passes parser and actual Adapter composition for exact, wide and wrong-party variants; 60/60 related tests. Four gates PASS, default 782/782. No real model calls or Live; public widget extracted with provenance, controlled identity transport is explicit.


## TEST-2026-10-10-C1

Red executor history assertion fails on old code; green-composition.log and final four gates PASS (784/784). Two paid history rounds: 48+48=96/250, zero failed calls. Frozen baseline NO_ACTION_MEMORY 0/2 and MODEL_DECISION 1/10; final 1/2 and 2/10, positive controls 7/7 both rounds. First-round MODEL_DECISION 4/10 retained, final declines there; no cherry-picked aggregate. Seven NEEDS_INVESTIGATION and 22 new labels unscored. No Live/static rebuild; comparison.json and started source hashes preserve exact intervention.


## TEST-2026-10-10-C3

PASS: typecheck, arch:check, npm test 783/783, build. C3 local Chromium positive/timeout negative PASS; delayed-state, native Tabelog composition and stale TableCheck inventory controls PASS. Red stale-stock acceptance captured in C3/red.log; corrected behavior and final logs under C3/. Two obsolete selector-wait tests retired after generic Fixture coverage; no paid calls or Live.


## TEST-2026-10-10-Recorder

PASS: typecheck, arch:check, npm test 784/784, build; recording contracts 14/14 and local Chromium Guard-response → Recorder → offline HAR Adapter composition PASS. Red missing stylesheets manifest captured in Recorder/red.log, green captures exact bounded UTF-8 CSS including media rules and asset URLs; unreviewed URL is not retained. No paid calls or Live.


## TEST-2026-10-10-C0c

PASS: typecheck, arch:check, npm test 784/784, build. Existing production Hybrid budget composition now covers no-qualified/expired/qualification-crossing and no-read-yet endings: 10/10; Domain guards 34/34. C0c/red.log reproduces exhaustion; green-final3.log closes without MODEL_CALL_BUDGET_EXHAUSTED, qualified control still presents; source-invalid evidence never gains qualification. Scripted source/model boundaries only, no paid calls or Live.


## TEST-2026-10-10-C6a

C6a：有效机制红灯 red-mechanism.log（关闭触发禁用时正例失败）；绿灯 green-final4.log 14/14（十一组合模式+两个Native对照）。typecheck、arch:check、npm test（test-final.log，796/796）、build全部PASS；真实模型调用0，Live0。证据目录 .eval-artifacts/p1-c-batch-20261010/C6a/。原始无HARD试运行日志仅保留诊断，不作机制红灯依据。


## TEST-2026-10-10-P1-D

P1-D仅文档：Proposed状态、局部ADR链接和零src diff检查通过。按用户要求额外运行四门禁：typecheck、arch:check、npm test（796/796）、build全部PASS。没有适用行为红/绿测试；文档检查日志 document-check.log。发现探测0、真实模型0、Live0。证据目录 .eval-artifacts/p1-c-batch-20261010/P1-D/。


## TEST-2026-10-10-P1PRE-C3

C3/red.log复现轮播属性变化导致人工帮助；green-final.log新增三模式及原九Chromium场景10/10，green-summary.log摘要计数1/1。typecheck、arch:check、npm test 797/797、build PASS。tsx page.evaluate命名helper失败保留green.log，最终已修复；零真实模型/外部来源请求。


## TEST-2026-10-10-P1PRE-reserve-results

有效红灯red-mechanism.log复现首店结果丢失及整批未知。green-final.log 16/16，含三店调用保留、交付时间保留、零完成反例、事实路径及来源替代不复活对照。四门禁PASS：typecheck-final、arch-check、test-confirmed 802/802、build。初始合并丢失空失败来源绑定由完整门禁检出并修正；原日志保留。零真实模型/Live。


## TEST-2026-10-10-P1PRE-C6a

C6a/red.log复现单店休息提前结束；green.log原十一模式+单店/三店混合反例14/14，green-prompt.log 4/4。typecheck、arch:check、npm test-final 804/804、build PASS。初始Prompt常量断言失败保留test.log，已同步常量。零真实模型/Live。


## TEST-2026-10-10-P1PRE-progress-wording

修复前红灯 red.log；最终 green-final.log 1/1；typecheck-final、arch-check-final、test-final（805/805）、build-final 均通过。无真实模型调用、无 Live。


## TEST-2026-10-10-P1PRE-C4

有效红灯 red.log；Chromium 正反例 green-fixture-final.log 1/1（2模式），执行器 green-executor-final.log 45/45；typecheck-final、arch-check-final、test-final（805/805）、build-final 均通过。v4 35种子快速/思考兼容轮历史7/14→7/14、正控8/9→7/9；105次真实调用，含初始35次HTTP400，阶段320/1500。详见 comparison.json；无 Live。


## TEST-2026-10-10-P1PRE-Live

宿主机干净detached/LOCAL_CHROMIUM/headless/no-proxy/无人工介入；500s/50模型/40Google；38+30+47=115模型，1+1+2=4Google，256.293/221.975/369.869s。h002首次preflight TableCheck503环境失败，0正式调用，仅重跑1次恢复。三份result自动evaluator@26；决策数38/30/47与started一致，全部在见证有效期内完成。h001六项SATISFIED，h002措辞等价性NOT_EVALUATED，h005COMPLETION_OUTCOME NOT_SATISFIED；无终态错误展示检测项。C3 PENDING25/17/45，等待109042/77103/187789ms；重复拒绝0/2/1；思考0；C0窗口0，C0c仅h005一次，调用保留量一次完成2家（UNKNOWN），时间保留0；三份录制样式表总0。Live无修复，旧early失败作历史对照，无额外红灯运行。typecheck/arch-check/test（805/805）/build均PASS；证据与完整路径见report.md。


## TEST-2026-10-10-P1C3B-C3b

本地 Chromium 和网络生命周期 Fixture 红绿见 .eval-artifacts/p1-c3b-20261010/C3b/；12公开URL只读探测无模型无点击，结果与门禁明细见本批报告。已暴露开发诊断，不是整单Live验收。


## TEST-2026-10-10-P1C3B-E2

E2有效红灯及77项 evaluator 回归绿灯；三份P1-E原样产物SHA相同副本重评，kf-h005 COMPLETION_OUTCOME改为NOT_EVALUATED，kf-h001/002全部finding和execution不变；零新增模型/来源调用。四门禁日志与re-evaluation.json见E2目录。


## TEST-2026-10-10-P1C3B-C2a

Sushi Yuu与Shibuya Sushi Labo原录制十月日历片段Chromium红绿，缺CSS布局/遮挡不作结论；两个录制例各1次脚本决策结束、可选日对照通过。默认单测覆盖无视提示的错误日期CLICK零实际点击。零真实模型/来源调用；四门禁日志见C2a目录。


## TEST-2026-10-10-P1C3B-C8

红灯：C8/red.log；绿灯：green.log、composition-green.log、replay-fixture-green.log。两轮原样与注入回放共 12 次真实调用，目标两轮选择一致，没有增量提升，停止调参；两条已成功交付的 Agent 对照结果相同，冻结 Agent 正向种子为 0。四门禁均通过（见 C8/gates.json）。


## TEST-2026-10-10-P1C3B-Recorder

红灯：Recorder/red.log（Chromium 通用 GET 漏存）、bom-red.log（真实 TableCheck CSS BOM 导致字节校验失败）。绿灯：unit-green-final.log（14）、chromium-green-final.log；C3b 实际响应离线保存 53/53，tblg.k-img.com 41、cdn0.tablecheck.com 5、www.tablecheck.com 5、cdn2.tablecheck.com 2。四门禁通过（Recorder/gates.json）；无新增页面访问、模型调用或整单 Live。


## TEST-2026-10-10-P1D-review-artifacts

仅文档与原始复核证据原样入库，行为红灯不适用；baseline 默认测试811/811及四门禁通过，原文哈希见 review-artifacts/original-sha256.json。三个已有未跟踪演示文稿未动。


## TEST-2026-10-10-P1D-C3b-completion

Red: red-contract.log (three compile omissions), red-changing-results.log (stale snapshot completion), red-sen-hidden-times.log (hidden time template). Final source fixtures 15/15; captured Sen UNKNOWN / EXTRACTION_FAILED. Final 20 public navigation-only probes (40 total, 0 models), median 1228.5ms; displayed name searches 3/3 complete, 3 zero-result Tabelog searches remain incomplete; prior12 no regression. Final four gates PASS (npm test 828/828); complete local Chromium/Cloudflare Fixture suite 84/84. Initial browser suite 80/84 exposed three C3 predicates still omitting a scoped busy assessment and an inherited wrapper missing page.evaluate; corrected without changing those negative expectations, with final green logs retained. Four gates and local browser Fixture results are saved in .eval-artifacts/p1-d-batch-20261010/C3b-completion/.


## TEST-2026-10-10-P1D-kf-h005-retest

冻结工作树四门禁通过（828 tests）；保留首次 503 红灯和恢复 206、正式运行绿灯。诊断 PENDING 42；页面等待 87873ms，绑定结果验证 2007ms，总计 89880ms（29.43%）。按域名及逐条 busy 拒绝、选店顺序与当时 sourceCategories 见 summary.json。Mock/Replay 不替代本次 Live 事实。


## TEST-2026-10-10-P1D-replay-matching

四门禁通过（832 tests）；两规则各正反例与未知字段/全标签预验证通过，旧实现错误放行的红灯保留。v6 原动作 132 条离线计分，1–128 与 v4/v5 无变化；0129/0130 失败，0131/0132 通过。保存的原样/注入 C8 输出 12/12 通过，新增真实调用 0。


## TEST-2026-10-10-P1D-P1-D

四门禁通过（837 tests）；有效红灯为 e1e0cfe 硬编码地区路由反例与初轮 Asakusa 3/10。地区、LOCATION、未知坐标/一次替换/预算正反例及持久化恢复绿色。Discovery-only 共 8 次、10 模型；Roppongi 9/10、Nihonbashi 9/10、Ikebukuro 8/10、Asakusa 6/10（未读 2 仍在十家分母），4/5；Ebisu Google 解析美国同名店，失败。Shibuya 6/10。Live 不等于资格或库存证明，待独立复核。


## TEST-2026-10-10-P1D-final-report

本批模型增量57，累计389/1500，其中P1-D发现10次单列。主分支四门禁837、实验844均通过；11原观察Fixture、8针对性测试（含Guard/Chromium两子例）使用0真实调用。复核者原件与278项受保护文件SHA256均未变，三份演示文稿未动；无推送、外写或新增完整Live。各项目红绿日志、探测、复测、评分事实在报告逐项链接。


## TEST-2026-10-11-P1F-review-artifacts

原件 SHA256 存档，四门禁日志见本项 gates.json；无真实访问。


## TEST-2026-10-11-P1F-radius

有效红灯：旧3000默认违背1000断言；新增999/1001边界与显式半径、任务/评测/bias组合，四门禁见 gates.json。


## TEST-2026-10-11-P1F-distance

红灯证明旧上下文缺距离；组合测试证明距离注入不改变合法动作和展示资格。原样四种子仅注入距离，真实回放结果见 replay-summary.json。


## TEST-2026-10-11-P1F-location-resolver

匿名历史坐标/类型回归、商户与地理混合、无上下文及远距离反例。Google-only旧新五地点解析各一次，海外同名商户另作TextSearch观察；原HTTP响应缺失明确记录。


## TEST-2026-10-11-P1F-coordinate-address

有效红灯：坐标请求未产生地址观察；离线Native→Executor输入正反例及公共GET/计数/续行覆盖。第1–4项提交后仅两个授权发现探测，各6模型/90秒，不追加。


## TEST-2026-10-11-P1F-audit

四门禁复跑记录 audit/gates.json；审计是读取清单，不伪造功能红灯。来源专用代码增删按 41205e8..63ac2a0逐文件保存。278 个受保护原文件哈希未变；隔离实验 a51a59c 四门禁和本地 Chromium 通过，不合回主分支。累计本批 2 次模型、17 次 Google；真实回放未执行。


## TEST-2026-10-11-P1FF-review-artifacts

复核原文 sha256.json；文档项功能红灯不适用，未伪造；四门禁记录 review-artifacts/gates.json。起点 c0766ca，演示文稿不动，不推送。


## TEST-2026-10-11-P1FF-navigation

有效红灯 native-red.log（超时被改写地区失败）、chromium-red.log（6.5秒文档被5秒打断）→ native-green.log、chromium-green.log；后者覆盖预算超时、失败码、关闭一次及旧会话隔离。executor-green.log覆盖GET提交导航时限与普通动作不扩时；四门禁 navigation/gates.json。不外访。


## TEST-2026-10-11-P1FF-discovery

红灯复用原东银座导航失败与 navigation/chromium-red.log；本次不制造红灯、不重跑。原录制与 result 保留，analysis.json 纠正末批 inspectedOutlets 与总数差别；无非读放行和后续页面。四门禁日志见 followup/discovery/，提交前全部通过。


## TEST-2026-10-11-P1FF-replay

距离按 seeds.v6：0129/0130 两模式均不通过，0131/0132 均通过。检索词原动作与新动作逐条保留：4 REPORT_NO_RESULTS、11 CLICK、1 REFINE_RETRIEVAL 缺搜索词被解码拒绝；不做实施者评分。缺原 DOM，执行器接受性未验证。有效质量红灯保存；8 次本地传输 Schema 校验拒绝不是模型调用。两分支四门禁日志分别保留，提交前全部通过。


## TEST-2026-10-11-P1FF-timezone

有效 red.log 抓到两次 weekday 都忽略 UTC 输入；修复后 green-target.log 通过 Google/grounding/evaluator 既有正反例，合成 evaluator Fixture 补齐已有时区字段。四门禁全部通过才提交。模型累计 416/1500，本批 Google 1；P1-D 11/11 用完。旧 278 文件和复核原文 2 文件 SHA-256 一致；报告保留回放失败和原 DOM 缺口。


## TEST-2026-10-11-P1F-A-loading

旧 Runner 判据 5 接纳、3 拒绝的有效 red.log 保留；共享载入函数反例及真实 8 变体解析均绿灯，0 模型/Google。四门禁全过才提交。产品代码、Prompt、Schema、配置及 ADR-0041 实验分支不动；raw input hashes 保存，Playbook 实读页头 1.3 与指令 1.4 差异如实记录。


## TEST-2026-10-11-P1F-A-signoff-stopped

冻结前eval载入8/8、四门禁绿、npm test846/846；本批3份正式result各经既有evaluator@27复评，decisions条数等于模型调用、browser观察/DOM序号链接均存在。2次中断仅STARTED-only评价NOT_EVALUATED，Google计数与完整recording缺失不补造；见证原始GET在10分钟内保存。记录h001额外见证GET和h003观察误停两项执行偏差，无产品修复。报告：.eval-artifacts/p1-f-20261011/part-a-report.md。


## TEST-2026-10-11-P1F-h005-retry-env

模式：OFFLINE_ORCHESTRATION + NETWORK_PREFLIGHT；外层监测6项正反例通过（旧误停消除，预约后继/额外字段/不合法方法拒绝），0模型/业务调用。既有冻结四门禁复用，无产品改动；网络503→恢复206→重试503，未进入正式Live，无result/decisions/recording或餐厅evaluator@27结果。原始preflight JSON与SHA保留，冻结工作树CLEAN，原A产物未改，仅在报告末尾追加记录。


## TEST-2026-10-11-P1F-A-continuation-part1

模式Live Read-only与Network Preflight分列。三例preflight各1次：206、206、503；最后一例不计整单Live或环境重跑。两份正式result各用冻结evaluator@27复评：Kagurazaka NO/NO_VERIFIED_RESULT；Nakameguro YES/SUPPORTED_BY_EVIDENCE，交付TableCheck Daikanyama Yakiniku Kintan距圆心919m。零交付见证三份四参数GET均200、结束后1.315秒内发出，原始响应未判读。decision条数47/34与模型调用相等，浏览器观察/录制快照链接无缺失；冻结CLEAN、保护哈希相同、旧报告原文作为精确前缀保留。复用冻结四门禁846/846，无代码改动不重复；证据 continuation-20261011-part1/summary.json、verification.json。


## TEST-2026-10-12-P1F-rev2-loader

有效红灯：rev1与null/unknown缺少预期拒绝；最终对应11/11绿。独立oracle完整覆盖八例原文、日期措辞、数字、窗口、地点、目标与criteria三字段，包括around 10,000 yen per person、Saturday, October 24。四门禁全部通过，宿主机npm test849/849；初次沙箱26项环境失败（localhost与Chromium EPERM）另记，不冒充产品反例。证据 .eval-artifacts/p1-f-20261011/prep-20261012/loading/。模型/Google0。


## TEST-2026-10-12-P1F-run-preparation

OFFLINE_REEVALUATION五例与OFFLINE_ORCHESTRATION两个空跑均完成，0模型/Google/网络；旧结果SHA未变、旧评价不覆盖。Tabelog展示绑定和selection正反例通过，B无需见证。复用刚完成四门禁849/849（仅评测载入改动），外层证据不修改产品代码；原始路径、对照和SHA见prep-20261012/report.md。


## TEST-2026-10-12-P1F-review-read

DOC_REVIEW：复核报告与Playbook提交前后字节SHA一致；冻结脚本/载入器/变体/见证全部SHA再校验一致，宿主机冻结工作树CLEAN。当前仅阅读与证据记录，复用上一切片四门禁849/849，无新代码或Live；记录prep-20261012/review-read.json。


## TEST-2026-10-12-P1F-early-window

旧时窗拒绝提前启动的有效red保留；修改后A/B无网络空跑PASS，h005提前仍拒绝。冻结manifest记录新SHA，旧脚本/manifest作为历史证据保留。模型/Google/Live新增0，实际只读随后单列；上一eval四门禁849/849与生产冻结门禁复用，未改生产/src代码。


## TEST-2026-10-12-P1F-input-path-block

NETWORK_PREFLIGHT成功（TableCheck206）与ORCHESTRATION_INPUT_FAILURE分列；无餐厅评价，不记ENV或能力失败。预备空跑漏检真实Runner的artifact-root限制，如实保留失败依据。账本恢复实际preflight时间，下一次至少15分钟后；累计仍602模型、24整单Live、环境预留2。


## TEST-2026-10-12-P1F-input-path-resolution

使用冻结Runner的真实caseSourceFromArgs函数做无网络路径校验PASS；两个外层入口无网络空跑PASS，rev2两端SHA一致，WT CLEAN。共享SHA ff567ad81e3ca59fc6ab4449a997a12c167751f305edd601c4158b56cf9d9c61；生产与eval源无改动，复用已有四门禁849/849，实际Live另行逐例记录。


## TEST-2026-10-12-P1F-A-part2

LIVE_READ_ONLY三例，preflight206；h003 431.150s/47模型/1Google/等待31.27%，h005 327.960s/47/1/18.52%且有浏览器超时，Kichijoji 2.941s/2/1/0%、无浏览器读取。各执行现有evaluator@27；决策数47/47/2等于模型调用。段末累计698/1500、27/33、Google已确认10但历史完整数UNKNOWN、环境预留2。原始结果/旧评价不覆盖，来源响应未判读；冻结SHA再核一致。


## TEST-2026-10-12-P1F-B-h001-h004

LIVE_READ_ONLY四例均preflight206并执行evaluator@27；依次365.091/185.704/60.324/0.747秒、28/21/4/1模型、3/1/1/0Google，等待13.68/11.46/20.70/0%。决策数与模型数一致，冻结文件SHA全部一致，宿主机WT CLEAN。新增54模型/5Google/4Live；累计752/1500、31/33、Google已确认15但历史完整累计UNKNOWN、环境预留2。402不列环境重跑，h005未开始。仅运行/报告切片复用已有四门禁849/849，实际失败与自动评价完整保留；证据prep-20261012/b-h001-h004-verification.json和part-b-report.md。


## TEST-2026-10-12-P1F-balance-restored

冻结SHA全部一致，生产73bfca5/CLEAN；账本h005正式运行0、无安全stop。纯编排证据，复用已有四门禁849/849，新增模型/Google/Live均0。累计仍752/1500模型、31/33Live，环境预留2。


## TEST-2026-10-12-P1F-h005-preflight-1

NETWORK_PREFLIGHT失败与LIVE_READ_ONLY分列：TableCheck503，其余公共端点可达；正式Live、模型、Google业务新增均0，餐厅evaluator不适用。冻结SHA一致，生产73bfca5/CLEAN。累计752/1500模型、31/33Live、环境预留2；只记录运行证据，复用已有四门禁849/849。


## TEST-2026-10-12-P1F-h005-final

LIVE_READ_ONLY h005：276.285秒、47模型、1Google、等待82834ms/29.98%、无浏览器超时，evaluator@27 NO/NO_VERIFIED_RESULT；47决策等于47调用。零交付无核验GET、B无见证GET。累计799/1500模型、32/33Live、Google已确认16（历史完整UNKNOWN）、环境预留2。录制NOT_REPLAYABLE/UNSAFE_DOCUMENT如实报告。仅运行/报告切片复用四门禁849/849，冻结SHA/生产CLEAN/间隔验证PASS，证据part-b/h005/attempt-2/verification.json。


## TEST-2026-10-12-P1G-A-location

L0 离线 Adapter 固定传输：真实 Kichijōji 反例修复前 GOOGLE_LOCATION_UNRESOLVED，修复后坐标一致；Jiyūgaoka/Kōenji 正例、商户／同名歧义／远地反例及四地点坐标投影回归通过。相关27/27；四门禁 PASS，全套850/850。日志 `.eval-artifacts/p1-g-20261012/A-location/{red,green,typecheck,arch-check,npm-test,build}.log`。无真实模型、Google、Live 新增，未证明当前外部响应。


## TEST-2026-10-12-P1G-B-honest-end

L1: same createHybridReadComposition as Live, installed production PlaywrightReadNetworkGuard and source network policies; only model transport and public source pages replaced. Three pre-fix FAILED controls become NO_VERIFIED_RESULT, existing short-batch delivery (1), and unresolved-location honest stop. 3/3, related 157/157; typecheck/arch:check/npm test/build PASS, 853/853. Existing network, model, timeout, HARD, identity, freshness and authorization controls retained. evaluator@27 completion: presentation SATISFIED; no-result controls NOT_EVALUATED (prose is not independent exhaustion proof; failed location has no successful discovery). Evidence .eval-artifacts/p1-g-20261012/B-honest-end/: red.log/red-artifacts, combination-green.log/final-artifacts and four gate logs. L3 replay NOT_RUN; real model/Google/Live calls added: 0.


## TEST-2026-10-12-P1G-frozen-preparation

Outer offline dry runs PASS for rev2 Kichijoji and original Gold@7, network forbidden; displayed-slot binding positive/negative checks PASS. Balance GET fixed-transport true/false/wrong-type/503 controls PASS (4 mock calls, 0 real calls). 12 frozen file SHAs checked, both production worktrees CLEAN. Production four gates reuse final B logs 853/853; no additional production change. Witness certification and Live NOT_RUN, future Tokyo10/13 09:00-12:00; cumulative real799/1500 models, 32 Live, Google confirmed16/full history UNKNOWN, environment reserve2. Report .eval-artifacts/p1-g-20261012/report.md.


## TEST-2026-10-12-P1G-immediate-start

Outer syntax, new freeze SHA and A/B offline dry-run early controls PASS, no network. Reuse final production four gates853/853; no production/Prompt/Schema/config change. Actual certification and Live outcomes recorded separately in P1-G report.


## TEST-2026-10-12-P1G-live-final

LIVE_READ_ONLY四行事实：吉祥寺320.806s/47模型/1Google/等待10.63%/浏览器超时有/0交付/NO；h001297.997s/30/3/18.49%/超时有/0交付/FAILED-UNKNOWN；h003319.326s/47/1/37.65%/超时有/1交付-150m/UNKNOWN；h004266.993s/47/1/12.09%/超时无/0交付/NO。evaluator@27，47/30/47/47决策与调用一致，原result/evaluator/decisions/recording路径及SHA见live/summary.json和各verification.json。录制均NOT_REPLAYABLE/UNSAFE_DOCUMENT，不能称Replay通过。7次preflight：4通过、3TableCheck503，余额7次可用，失败不计Live/环境预留；间隔≥15分钟。累计970/1500模型、36正式Live、Google已确认22/历史UNKNOWN，环境预留2。Guard多跳重定向已知缺口保持；无账本安全stop。只运行/文档变更，复用B四门禁853/853与L0/L1红绿日志；本轮L3额外回放0。h001 Live反例仍失败，局部组合不能替代实际链路故障关闭。纯文档矩阵核验差异、引用和事实一致性，等待独立复核。


## TEST-2026-10-15-P1G2-honest-end

P1-G2 real preterminal states reconstructed at versions12/11, hashes equal recorded trajectories, sanitized shape/code fixture preserves phase/failure/eligibility/checkable/validation projection. Effective red2/2 FAILED at desired NO_VERIFIED_RESULT assertions; final green in default suite862/862. Advancing-clock L1 production Guard composition3/3, qualified presentation evaluator@27 completion SATISFIED; no-result controls NOT_EVALUATED. REJECTION_LIMIT/NO_PROGRESS/STEP_LIMIT with non-empty local failure, real provider refusal/uncaught Router exception and safety negatives covered. Four gates PASS; logs .eval-artifacts/p1-g-20261012/P1-G2/. Sandboxed EPERM and initial full-suite regressions retained; W07 remains FAILED and legacy FAILED-budget acceptance remains unchanged/rejects new honest completion. Extra real model/Google/Live0; no claim of current external inventory or signoff.

冻结补记：修复提交b55e91c，独立CLEAN工作树p1-g2-live，源码及Gold SHA与主树一致；复用已有本机依赖、不安装。生产冻结记录P1-G2/production-freeze.json。复核原文／外层过期批次信息待用户答复，尚无preflight、余额GET或Live；本地提交不推送。


## TEST-2026-10-15-P1G2-preflight-retry

用户“跑一次h001”后同步外层批次元数据并离线空跑；Google预检超时未启动。用户切换TUN和全局后要求即时重试，仅h001第2次获一次间隔例外，重新冻结execute SHA2fe4ab99（9文件SHA核对）。第2次UTC06:00:35.715–06:00:42.058：DeepSeek200、Google404可达、Tabelog200、TableCheck403，PREFLIGHT_PUBLIC_ENDPOINT_REJECTED；余额可用。两次均未启动正式Live，新增模型／Google业务／Live／环境重跑均0；累计970/1500、36Live、Google确认22／历史UNKNOWN。本次即时重试完成，未安排第三次；若继续须遵守剩余15分钟间隔与时窗。生产b55e91c/CLEAN、no-proxy及安全规则不变，evaluator不适用，无result／决策／录制。证据与报告见 .eval-artifacts/p1-g-20261012/P1-G2/ 及 report.md。只改外层和文档，复用修复四门禁862/862，离线空跑和冻结核验PASS；不推送、不宣称实际链路已关闭。


## TEST-2026-10-15-P1G2-preflight-final

用户要求十分钟后重试，第3次preflight于UTC06:18:57.192–06:19:04.931执行，距第2次18分15秒；balance可用、DeepSeek200/Google404可达/Tabelog200，TableCheck仍403。外层9,793ms、预检7,738ms，三次用尽记ENV_FAILURE，正式h001未启动，无evaluator/result/决策/录制／交付后GET。新增模型/Google业务/Live/启动后环境重跑均0，累计970/1500模型、36Live、Google确认22／历史UNKNOWN、预留1未扣；实际有网络预检与余额GET。冻结b55e91c/CLEAN、execute2fe4ab99、9SHA保持；复用四门禁862/862，纯文档／证据核验见P1-G2/final-preflight-verification.json。真实状态离线＋L1已绿，Live修复仍未验证，不能关闭h001签收缺口。心跳PAUSED，不第4次重试；本地提交，不推送。报告 .eval-artifacts/p1-g-20261012/report.md 的P1-G2节。


## TEST-2026-10-15-P1G2-403-diagnostic

用户要求查明403，限定两次公开GET（原Range／无Range）和一次无HTTP的DNS＋TLS握手：两GET均相同146字节nginx403，TableCheck证书校验成功。排除Range作为唯一原因及本次DNS/TLS连接失败；拒绝位于远端HTTP层，具体IP／地区／客户端策略未确定，不称反机器人或限流已证实。应用no-proxy不证明TUN未接管；未测试Chromium，未改请求身份／预检规则／生产。证据P1-G2/tablecheck-403-diagnostic/，报告P1-G2节追加；0模型／Google业务／正式Live，账本970/1500、36Live保持。纯文档及证据核对通过，复用四门禁862/862，三次preflight耗尽／心跳暂停保持。不推送。


## TEST-2026-10-15-P1G2-live-final

用户确认网络恢复并要求h001 Live，保留三次失败记录，为h001额外一次preflight设置专用门控，重新冻结execute ec4aa86b；9原SHA／生产b55e91c-CLEAN核对、门控正反核对及离线空跑PASS。第4次预检TableCheck206后唯一正式Live完成：SUCCEEDED/NO_VERIFIED_RESULT，终止REJECTION_LIMIT，最后轨迹READ_ENDED，缺口保留终止及局部浏览器预算原因。零交付；Sushi Teppen查位UNKNOWN/DATE_NOT_SELECTABLE，未声称全体无位。362.347秒、44模型/1Google、等待87.458秒/24.14%、未观察浏览器超时；44决策=44调用。evaluator@27 qualified NO、COMPLETION_OUTCOME NOT_EVALUATED（要求current-request END_READ观察），不改评价器或自判签收；录制NOT_REPLAYABLE/UNSAFE_DOCUMENT。原result/eval/decisions/recording路径和SHA见报告P1-G2节、live/h001/attempt-4/verification.json。无交付后GET／B见证GET，无启动后环境重跑；累计1014/1500模型、37Live、Google确认23/历史UNKNOWN、P1-G2预留1。只改授权外层门控与证据文档，复用四门禁862/862；真实状态离线＋L1和本次Live证明分列，停止待独立复核，不推送。前三次ENV_FAILURE作为历史保留、心跳PAUSED。


## TEST-2026-10-15-P20-guard

快进921aa76后，按第一阶段签收后的四项加固指令首先修P0重定向。普通route首跳＋预先安装CDP Fetch逐跳核对，原准入集合不变；原生URL／相对链接／Cookie保留，14/14真实Chromium覆盖多跳、XHR/fetch/静态资源、循环、popup/iframe/worker和CDN权限不晋升。原版真实接收端越界红灯已保存，修正CORS/LNA遮蔽后隔离原Guard复验；旧假route手动二次调用证明删除。四门禁绿862/862，完整浏览器97/99的两项旧动态发现失败在b55e91c也复现，报告明确保留，不篡改断言或越范围修复。真实远程引擎／当前外部来源未验证。ADR-0036只追加、Capability Matrix同步，证据 .eval-artifacts/p2-0-hardening-20261015/guard/，报告根report.md。0真实模型／Google业务／Live；其余三项继续，不推送。用户并行INDEX／Booking草稿／演示文件保留。


## TEST-2026-10-15-P20-limits

BrowserTaskExecutor模型／操作三限额必填且构造校验；Live Runner／Web／固定来源／探测／回放及Adapter调用方显式接线，原生找店20/120/80、事实4/120/24、查位20/120/80（独立探测按其入口显式配置）；每条执行器诊断记录实际生效上限，整单50模型不变。生产组合＋同一Guard/网络策略、真实脚本查位调用累计>12后再次找店，旧码BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED有效红灯，修复绿；不是手填预算，固定传输不证明实时网站。四门禁通过864/864，证据limits/red.log、green.log及四门禁日志；0付费模型/Google业务/Live。后两项与Live继续，不推送。


## TEST-2026-10-15-P20-termination

真实P1-G2 h001第6步后状态按事件前缀精确重建并核对轨迹hash，再脱敏为结构/码Fixture；旧码12次新搜索提议、TIMEOUT为FAILED红灯，修复后0次新增提议即NO_VERIFIED_RESULT。实际共享浏览器额度/整单额度耗尽在系统预判及动作校验拒绝；连续3次执行失败不再清零无进展计数。整单TIMEOUT按业务终止并返回TERMINAL，Web/Harness断言同步；服务商拒绝、异常、授权及副作用不确定仍FAILED，取消原样。15项终止回归及生产Guard L1旧组合保持绿，四门禁870/870。证据termination/，0真实模型/Google业务/Live；结构化原因与evaluator28继续，不推送。


## TEST-2026-10-15-P20-failure-types

State@15/TaskDefinition@14，noVerifiedResult.termination记录type/reasonCode/isSystemReason/initiator，区分系统发起与系统错误。State/Event/Router/读取metadata失败码显式typed集合，Model/Policy穷尽分类及Browser/Google类型覆盖；缺分类编译红灯与未知持久化码fail-closed。Evaluator@28/rubric@22核对系统事件、终态版本、READ_ENDED及已查/未查范围，只证明有范围的无结果。原P1-G2产物不改写，@27与@28原始重评完成均NOT_EVALUATED（原缺结构化字段）；第6步真实状态新终止离线回放SATISFIED、qualified仍NO，0新增外部调用。四门禁879/879，证据failure-types/；不更改资格/Prompt/Gold/变体/见证，不推送。


## TEST-2026-10-15-P20-live-h002

四项实现提交976baaa/60e78b9/f759c34/35b6bf0；生产35b6bf0在新宿主机树CLEAN，外层9SHA与双用例离线空跑通过。唯一h002正式SUCCEEDED/PRESENT_RESULTS，展示Ginza Sushi Sendou/TABELOG/390m；evaluator28 qualified UNKNOWN（条件措辞待独立确认）、证据SATISFIED，207.540秒/25模型/1Google，等待12.41%，无浏览器超时。立即四参数GET为200且18:30在selection，未触发停止；25决策=25模型，产物SHA核验，录制NOT_REPLAYABLE/UNSAFE_DOCUMENT。累计1039/1500、38Live、Google确认24/历史UNKNOWN，本批1/2、环境预留1。h001时窗已过未启动；每日及单次排程均遭自动审批拒绝，明确自动化未创建，需人类排程授权，不绕过。报告p2-0-hardening-20261015/report.md，纯文档核验复用四门禁879/879；不推送，P2-0未全部完成。


## TEST-2026-10-15-P20-live-h001-tomorrow

用户最新授权立即运行h001、date换明天；仅新建development-variant将tonight改tomorrow并同步semantic日期2026-10-16，其他条件与Gold逐项相等，原Gold/变体/见证不动。生产35b6bf0/CLEAN不变，外层重冻12SHA与离线空跑PASS。首次preflight后唯一Live SUCCEEDED/NO_VERIFIED_RESULT，Agent第11步END_READ，零展示；47模型/3Google、473.822秒、等待25.57%，有局部浏览器超时，未触发安全停止。evaluator28 qualified NO/完成维度NOT_EVALUATED，保留独立审计限制不改判；47决策=47调用、产物SHA通过，录制NOT_REPLAYABLE。浏览器共享调用达到36且>12仍有找店决策。累计1086/1500模型、39Live、Google确认27/历史UNKNOWN，本批2/2、0环境重跑/预留1。复用四门禁879/879与Guard14/14，完整浏览器2项既有失败保留。报告p2-0-hardening-20261015/report.md，不推送、不再运行，停止待独立复核；不建立自动化。

## DOCS-2026-10-12-EVAL-SKILL-HISTORY-MOVE

以下三段原位于 Eval Skill 1.3 末尾，属于运行与版本记录，按 Eval Skill 2.0 "Skill 只写规则" 逐字迁出，内容未改。

### 当前餐厅默认数据集切换（2026-10-09）

用户批准的 `restaurant-read-development@7` 是 H001–H005 默认输入，文件 `e2e-cases.gold7.yaml`。只改 H005 的30分钟即时窗口与验收，其他用例原条件不变；旧 `e2e-cases.yaml` / @6 留作 frozen regression，不改原文件或历史产物。Evaluator仍为@26、rubric@21；显式变体运行仍引用各自冻结原文和hash，不因默认Gold更新而重新标注它们。

### C1 action-history replay (2026-10-10)

Production browser action prompt@15 / schema@10 supplies the recent six executor decisions with effect/rejection feedback. Existing decision replay adds mode `history`: retain captured messages, goal and targets, inject only preceding captured steps and the shared history instruction. Request versions distinguish captured prompt plus history@1/@2 from full production prompt; no CSS rebuild or source requests. Frozen seeds.v2 browser labels remain unchanged; seeds.v3 adds implementer-proposed pending independent labels, excluded from pass rates. Two C1 rounds use 96/250 real model calls, positive controls 7/7 each; final NO_ACTION_MEMORY 1/2 and MODEL_DECISION 2/10 versus original 0/2 and 1/10. Recorded repetition and pending labels are descriptive, not scored passes.

### E2 C0c范围核验（2026-10-10）

当前 Hybrid diagnostic evaluator@27、rubric@21。investigatedCandidateIds为实际执行读取观察的门店子集；全部已发现门店分别列已查原因或NOT_CHECKED缺口，已查UNKNOWN须在unresolved中，END_READ观察与最终记录一致。伪造已查而无读取轨迹仍NOT_SATISFIED。范围一致不证明搜索穷尽或已有交付：旧kf-h005的COMPLETION_OUTCOME从NOT_SATISFIED改为NOT_EVALUATED，能力缺口归因不变；kf-h001/002原自动结论不变。旧@26产物不覆盖。

## TEST-2026-10-15-docs-eval-skill-2-and-phase1-signoff

纯文档（模式：Docs only）。合入2026-10-12用户已批准的文档整理包：AGENTS、Eval Skill 2.0、Test Skill 1.3、INDEX 1.7、Harness Design 4.1、Browser Read Diagnostics 0.16。六个目标文件合入前`git hash-object`与包内基线一致，替换后SHA-256前16位与包内清单一致（b23dfcd1f6caa05d、0414ba5970356de0、9cc28c901fa5e1a5、fa70603e86fd7d21、9825906fdc5d12ac、b9af4c5a598c41ff）；Eval Skill 1.3末尾三段运行记录按包内说明逐字迁入本日志`DOCS-2026-10-12-EVAL-SKILL-HISTORY-MOVE`。同时登记此前已提交的第一阶段签收复核材料（921aa76、cd876a7）。按Test Skill纯文档矩阵核对链接、引用与diff：包内Test Skill指向Eval Skill旧标题的锚点（`#执行结果与诊断的独立核验`）已改为2.0的`#7-执行结果的独立核验`，因此Test Skill最终SHA与包内清单不同，其余五个文件一致；STATUS中一处指向未提交产物的旧链接为既有问题，未改；未运行代码门禁、付费模型或Live。

## TEST-2026-10-15-docs-merge-before-push

Docs only：合并远端b36ec7f及其文档前序提交与本地P2-0六个提交，保留双方原提交和冻结SHA；冲突仅涉及STATUS、历史日志和月度索引，历史记录两侧原文均保留。复核材料、校准标签草稿和T1说明原样纳入，不执行新工作包；P2-0仍待独立复核。用户未提交的INDEX／Booking草稿和三个演示文件不纳入本次提交。按纯文档矩阵检查冲突标记、diff、链接、日志及索引计数和权威一致性；合并未改动src、tests、package或运行配置，复用P2-0既有四门禁879/879，不新增模型、Google或Live调用。

## TEST-2026-10-15-P20-h001-witness-after

按用户本轮授权，对h001的2026-10-16 19:00／2人向指定四店各发一次四参数Tabelog公开GET，4/4 HTTP200；原始字节、UTC时间、参数和SHA保存在`.eval-artifacts/p2-0-hardening-20261015/prep/live/h001/witness-after/`。复用既有captureVacancy，不改产品、Prompt、Schema、配置、Gold、变体、见证或冻结树；无模型／Google／正式整单Live增量，无重试或表单操作。不将较晚库存回写成此前Live事实，不重评或自行签收；本地提交，不推送。离线核验：四个指定rst_id与精确日期／人数／时段、GET唯一四参数、4/4 JSON合法、元数据与原始响应SHA一致、时间顺序、diff及月度索引PASS。仅Live Read-only来源观察＋纯文档核验，无代码改动，不重跑代码门禁。

## TEST-2026-10-15-T1-2-BROWSER

真实 Chromium 两条旧用例修复前目标 availability 断言失败（red.log），修复后正常 AVAILABLE 展示与 UNAVAILABLE 续查均通过（green-targeted.log，2/2）。四条代码门禁全绿，npm test 879/879；完整 Chromium 门禁结果见同目录 browser.log。只替换页面与模型传输，未放宽身份/资格、未删除用例。无付费模型/Live/见证 GET。

## TEST-2026-10-15-T1-1-ASSEMBLY


实际查位Fixture累计>12次共享浏览器模型调用后再找店；隔离工作树退回旧12次发现阈值，目标业务断言BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED红，恢复配置绿。Runner/Web比较组装返回的全部生效限额、Router／loop和独立预算。`01-assembly/`保存red-retired-cap.log、green-restored.log、controlled-execution.log（17/17）及五门禁：typecheck／arch／build通过、默认880/880、真实Chromium100/100。无外网／付费模型／Live；旧Hybrid迁移在第5项继续。

## TEST-2026-10-15-T1-3-WEB-OWNER

统一production assembly＋本地HTTP＋真实Postgres契约/PGlite：语义模型传输阻塞时列表必须UNDERSTANDING，修复前FAILED（red及隔离同样本red-confirmed）；释放后实际Google空发现正常结束。并发控制＋W07重启孤儿2/2；样本严格传输和空发现接线错误单列保留，不冒充检错。四条代码门禁见`t1-assembly-20261015/03-web-owner/`，无外网／真实模型。

## TEST-2026-10-15-T1-4-BOUNDED-WAITS

无数据流使旧SSE await挂起至外层期限；目标标签断言失败，修后内层20ms超时和正常信号均通过。完整Web28/28，四条代码门禁日志在`t1-assembly-20261015/04-bounded-waits/`；具体裸等待清单见report。仅离线，不把外层超时当目标断言成功。

## TEST-2026-10-15-T1-5-RETIREMENT

Hybrid完整生产factory＋Router部分端口分层85/85；正常100／耗尽1的Google配对进入真实SourceAware后，额度状态undefined红，透传已有metadata后EXHAUSTED绿。原隔离有限变异四项仍要求对应目标断言、正常控制通过。退役一条旧实现控制，七组迁层不删行为，实际runCeilings取factory；四条代码门禁默认881/881，附加Chromium日志均在`t1-assembly-20261015/05-retirement/`。不代表模型理解／当前网站通过，无Live。


## TEST-2026-10-15-T1-6-CDP

真实Chromium八种Location规范化第一跳均到达A/hop、禁用B零到达，旧版未复现原生跳转逃逸。CDP-only三个禁用请求旧版各实际到达1次（目标断言红），修后0且允许控制实际到达。Guard26/26含worker脚本实际执行／跨源拒绝、CSS类型、popup/iframe、录制和cookie控制。四条代码门禁881/881，最后完整Chromium及样本错误区分见`t1-assembly-20261015/06-cdp/`，无外网／真实模型／Live。


## TEST-2026-10-15-T1-HANDOFF

最终冻结源码77c4580：typecheck、arch:check、npm test 881/881、build与真实本地Chromium112/112全部通过（06-cdp原始日志）；第1/2/5项Chromium也各100/100。报告索引六项红绿、临时回退、正常控制、退役清单及八种原生跳转未复现边界。当前仅补提交号和交付文档，不改变源码、输入或限额，复用上述门禁；检查文档链接／diff及报告日志存在性，无真实模型／外网／Live增量。源码未发现共享文件并发改动，停下待复核。

## TEST-2026-10-16-E1-0-INPUTS

独立22个run-id全集、30文件gunzip、原始／压缩SHA与长度及原文件字节比较通过；12,630,285字节低于60MB。manifest SHA68125e710ee1ffee5f101fd390ba4e769e2e1d67e5fa3b5f1bc3035ecbd6d1f2。命令和green.log在E1的00-inputs；纯数据冻结不重复源码门禁，不称第1–9项已通过。原始中断trace完整，评测与校准尚未运行，无模型／网络。

## TEST-2026-10-16-E1-1

定向85/85；typecheck、arch:check、npm test 883/883、build全绿，命令及日志01-reader/{red,green,typecheck,arch-check,test,build}.log。首次正常产物null失败码格式误报已在读取层区分；重叠日志已以单次干净门禁重跑替代。未覆盖的历史字段继续未评价。 真实h002删除两端criteria时旧评测仍SATISFIED（01-reader/red.log），类型投影后NOT_EVALUATED并带完整路径；正常产物、非法类型和缺轨迹控制通过。所有判定已移除asRecord动态取字段，仅边界读取已消费字段；evaluator@29/rubric@23，不补造旧记录。输入冻结提交3389131。 原始日志见.eval-artifacts/e1-evaluator-20261016/report.md，不把测试总数当能力证明。

## TEST-2026-10-16-E1-2

定向87/87；四门禁typecheck、arch:check、npm test 885/885、build全绿，02-equivalences/{red,green,typecheck,arch-check,test,build}.log。未知键、null、重复键及重复对拒绝；正常字面相同和旧回归保留。校准仍等复核者表。 7793db8后以测试专用SAME表作反例，旧实现NOT_EVALUATED红；接入严格YAML加载和SHA后SAME通过，polarity反转与HARD降级拒绝；DIFFERENT冲突，未登记对保留UNKNOWN并输出待审列表。生产表初始为空，不填写真实8组人工判断，无传递等价推断。 原始日志见.eval-artifacts/e1-evaluator-20261016/report.md，不把测试总数当能力证明。

## TEST-2026-10-16-E1-3

定向178/178、四门禁typecheck／arch:check／npm test 888/888／build全绿；共享来源Fixture与Chromium组合原来漏原始响应及trace引用已补录，不降低YES断言，本地Chromium最终112/112（browser.log），动态2/2。03-grounding保存red、green、arch-counterexample/control及门禁原日志。首轮浏览器红灯另存browser-before-trace-capture.log。不证明未知网站格式或真实模型；窄语法不推断跨日营业。 真实h002仅改两份原始Tabelog响应日期，生产claims不变，旧版SATISFIED红，新版NOT_SATISFIED；优先已保存GET双SHA核验，其次录制响应，最后受限快照控件，全部缺失未评价。营业时间为评测器自己的窄语法，未知不冒充冲突，旧周二测试误配周一资料已修样本。生产合格函数值导入有隔离arch反例，类型导入正常。 原始日志见.eval-artifacts/e1-evaluator-20261016/report.md，不把测试总数当能力证明。

## TEST-2026-10-16-E1-4

定向95/95，四门禁typecheck／arch:check／npm test 893/893／build全绿，04-outcomes原始日志；实际共享CLI两条输出及SHA在evaluations/，没有手填评分。Eval Skill 2.1只维护一次分类规则并通过skill-creator校验。五条Your-call口径及最终校准尚未完成，等待复核者独立导出，不宣称分类已获人工校准；跨来源语义HARD与脱敏网络grammar仍可能未评价。 基线d621d1b对实际SIGKILL包没有类型的目标红灯，现统一入口验证manifest、每份gzip与原始双SHA，真实Evaluator保存不可覆盖sidecar。两条均ORCHESTRATION_INTERRUPTED、能力分母EXCLUDED、用户目标NO；缺result的六维全部未评价，S0只用trace且两条均因中断/脱敏未评价。实际表单POST篡改为S0，BLOCKED对照不冒充已越界；正常交付、明确冲突、HTTP402及缺因果配对通过，人工标签不被读取。 原始日志见.eval-artifacts/e1-evaluator-20261016/report.md，不把测试总数当能力证明。

## TEST-2026-10-16-E1-5

定向98/98、四门禁typecheck／arch:check／npm test 896/896／build全绿，05-witness原始日志与最终h001-with-witness-final.log指向sidecar；地址/楼层、缺读取/展示、错请求/错SHA、认证窗口过期成对控制通过。复查发现第3项后GET日期仍读URL，red-source-date.log证实，已改为响应base_date/members并绿；源文件及Gold未改。历史Matsumoto缺独立地址只能可能匹配，Sen/原生Teppen可定位；自由文本语义与较晚库存的历史推断边界保留。 5ca7972对真实运行后四店见证没有漏斗的目标红灯已转绿；共享CLI读取原库存及既有登记HARD/范围Gold，按artifact原始SHA绑定，h001自动CAPABILITY_MISS/S2，不读取独立复核结论或人工标签。四店逐项输出发现、实际身份/事实原始链、系统查位原因与独立库存、实际展示及HYPOTHESIS卡点。无位不误标交付卡点，缺独立地址不伪造跨源匹配。 原始日志见.eval-artifacts/e1-evaluator-20261016/report.md，不把测试总数当能力证明。

## TEST-2026-10-16-E1-6

定向101/101，四门禁typecheck／arch:check／npm test 899/899／build全绿；06-progress保存red、red-layer-separation、green、两个真实sidecar与门禁。3/4次失败、5/6次URL重载及不同query配对通过。调查差与真实合格交付分开，条件/原始证据/同请求执行检查仍必需。历史完整URL丢query则该子项NOT_EVALUATED，路径次数只描述；计数通过不代表调查充分，五条人工口径仍待输入。 0b1e2c2仍把P1-G2真实循环判SATISFIED的目标红灯已修；按实际拒绝、无新候选/证据/首次读范围、同类失败及完整URL次数判定。P1-G2超阈值为NOT_SATISFIED；P20同词4/5/6/7步实际输出，换来源不直接判错。上限与语义仅在Eval Skill及代码常量维护。 原始日志见.eval-artifacts/e1-evaluator-20261016/report.md，不把测试总数当能力证明。

## TEST-2026-10-16-E1-7

定向145/145及定位停止对照1/1；四门禁typecheck／arch:check／npm test 900/900／build全绿，07-resources/{red,green,termination-control,typecheck,arch-check,test,build}.log及actual-h002.log指向真实共享CLI sidecar。首次默认套件旧资源自证预期失败保存在test-before-resource-oracle-update.log。Eval Skill只增实际限额规则，skill校验通过；不证明未保留的时间子限额。 f2fc135对真实h002把actual全局模型限额改为1仍按声明120判SATISFIED，目标反例红；现在逐来源／阶段／候选比较effectiveLimits与实际计数，单列声明差异，单候选模型／操作超额均拦截，删除actual限额保持未评价。原始h002实际用量正常通过并报告FACTS 4/24与声明20/80差异，旧时间限额未记录单列未评价，不冒充deadline证明。Google-only及定位前停止的旧合成artifact缺actual限额，仍检查真实结果／原因／零浏览器调用，资源及依赖它的完成维度如实未评价，未手填限额或修改产品。 原始日志见.eval-artifacts/e1-evaluator-20261016/report.md，不把测试总数当能力证明。

## TEST-2026-10-16-E1-8

第8项仅修改外层脚本及其离线测试，红绿对照2/2，实际run-p20.mjs h001 --dry-run通过（网络／模型／Google均0）；四门禁typecheck／arch:check／npm test 902/902／build全绿。08-outer/{red,green,dry-run,typecheck,arch-check,test,build}.log及config-freeze.json记录脚本与登记SHA。未改历史freeze／ledger／见证；旧授权窗口与HEAD不延长，下次Live必须重新授权并冻结@29代码和新编排配置。 cf5d5be中现有外层复查函数对真实吉祥寺零交付和既有三店登记表发出0次请求，目标业务断言红；现按未变的materialized请求与登记范围绑定，零交付各店一次四参数Tabelog GET、禁止跳转／扩张候选／重试，原始响应双文件及manifest可被真实Evaluator见证漏斗读取。非零交付、原版未登记和缺result不触发补见证，错请求／外域登记阻断。已接入现有execute结束路径，不复制Runner；现有h001/h002仍无登记，保持跳过；安全停止后不新增复查。 原始日志见.eval-artifacts/e1-evaluator-20261016/report.md，不把测试总数当能力证明。

## TEST-2026-10-16-E1-9

定向9/9（新种子只读验证），四门禁typecheck／arch:check／npm test 903/903／build全绿，09-replay-seeds/{red,green,typecheck,arch-check,test,build}.log。原capture 47行仅提取两行，input-provenance.json记录完整与逐行哈希，机械提取器拒绝覆盖既存输入。首次本地Chromium受沙箱限制另存local-chromium-sandbox-error.log；必要权限下同一离线DOM控制通过，没有把环境启动错误当目标检错。第8步上下文缺来源链接仅作为后续接线候选问题记录，不改生产或代替独立标注。 f5fde99后的版本7空增量对照有132个旧种子、0个本批决策，目标断言红；现seeds.v7追加0133/0134，原capture #4/#28对应Agent第2/8步，完整原始消息和输出两行95,021字节保留，原capture SHA、逐行SHA、打包SHA及result SHA齐全。旧132条标注逐项不变；38候选=原1家+Google新增37家，不把候选集合缩为37。条件式可接受动作仅提议支持来源路径与保持请求，未写死店名；PROPOSED／待独立标注，评分动作数组留空、两条不计任何通过率，本轮不执行回放。 原始日志见.eval-artifacts/e1-evaluator-20261016/report.md，不把测试总数当能力证明。

## TEST-2026-10-16-E1-4f

定向2/2及四门禁typecheck／arch:check／npm test 904/904／build全绿，04-outcomes/source-path-followup保存红绿与门禁；Eval Skill校验通过。prepare-offline-diagnostics.mjs仅循环调用现有共享artifact入口并禁止fetch，原始22份诊断保留；正确版本将另存新目录，正式校准仍等待人工导出。 22条输入包纯离线诊断暴露第4项S0路径分类器缺陷：includes(/reserve)把ADR-0035明确记录的Tabelog公共reserve_date_status_list GET在12次运行中误报为TableCheck reserve页面；真实h002目标断言先红，现只匹配完整reserve路径段，公共读取不判越界，改成POST或真实预约页非法参数仍S0，合法入口但参数值脱敏仍未评价。不读取人工标签、不改Guard或生产准入策略，保留首次错误sidecar并标superseded exploratory。 原始日志见.eval-artifacts/e1-evaluator-20261016/report.md，不把测试总数当能力证明。

## TEST-2026-10-16-E1-5f

定向106/106；typecheck／arch:check／npm test 905/905／build全绿，05-witness/roster-followup保存red／green／四门禁及skill校验。最近浏览器相关改动已在04-outcomes/source-path-followup/browser.log本地112/112通过；本补充仅改显式witness选项的离线漏斗，不涉及浏览器路径或原始观察采集，复用该项证据，不重复Live或Chromium。 在原始h001见证的独立副本中仅删除Sen一行，保留其他三行及独立登记表，旧漏斗3行而应有4行的业务断言红；现按登记集合补出缺观察的店，库存／可行性／卡点NE、观察时间null，不借旧slot文本或候选池补值。其他门店原始库存不丢失；缺HARD Gold也只让可行性NE，不把已有席位或生产判断当HARD支持。历史源文件逐字不变。 原始日志见.eval-artifacts/e1-evaluator-20261016/report.md，不把测试总数当能力证明。

## TEST-2026-10-16-E1-4g

定向2/2；typecheck／arch:check／npm test 905/905／build全绿，04-outcomes/interrupted-goal-followup保存真实包红绿和门禁；Eval Skill校验通过。此项仅离线结果分类，不涉及浏览器执行，复用最近112/112的本地fixture证据。此前@29开发中间sidecar的用户目标NO不作为当前结论，原文件保留，最终诊断另存。 复核用户补充的NE边界：两份真实SIGKILL包缺result时，旧outcome仅因中断类型把userGoalComplete写NO，真实包断言先红；现在外层只决定ORCHESTRATION_INTERRUPTED，用户目标保持NOT_EVALUATED并注明缺result，两个包仍排除能力分母、六维NE、S0仅trace。反事实配对把真实支持交付记录与TEST_ONLY保存后中断组合，已支持的用户目标YES不被信号抹掉；删除实际结果则NE，不手填评分，不影响既有受控取消／预算artifact链。 原始日志见.eval-artifacts/e1-evaluator-20261016/report.md，不把测试总数当能力证明。

## TEST-2026-10-16-E1-HANDOFF

源码a94d91b的四门禁全绿，905/905；最近浏览器相关路径112/112，后续仅离线见证／外层中断分类，无浏览器采集变更，未重复相同门禁。最终包22输出逐份SHA复核；20 result＋2中断包／30 gzip／12,630,285字节，manifest SHA68125e710ee1ffee5f101fd390ba4e769e2e1d67e5fa3b5f1bc3035ecbd6d1f2。两中断：ORCHESTRATION_INTERRUPTED／EXCLUDED，六维、用户目标及S0均NE；缺result不推断NO或无S0。人工比对0，S0其余20条的一致与8交付类型一致未签收，等价表仍空，开发集不报告准确率。报告含逐次表、每项红绿／正常对照／门禁／未覆盖范围；无新增模型、网站、Google、Cloudflare、Live、见证GET或新种子回放，用户原文件保留。

## TEST-2026-10-16-E1-PUSH-BLOCKED

`git push origin codex/feat-live-restaurant-read-path`被自动审批拒绝，Git进程未启动，无推送结果。只读检查本地origin／branch／HEAD／未推送数量，不输出凭据；没有业务网络、模型或Live增量。仅报告状态变更，复用a94d91b的现有代码门禁，不重跑相同检查。等待敏感载荷与具体目的地确认。

## TEST-2026-10-16-E1-SUPPLEMENT-EQUIVALENCES

真实复核表加载旧路径unknown schema先红；新路径八组逐字独立期望及原始SHA通过，107/107定向绿。typecheck、arch:check、npm test 906/906、build通过，日志supplement/equivalences-{red,green-final,typecheck,arch-check,test,build}.log。旧UNKNOWN测试显式使用测试专用空表，不让审核表改变其局部前提；真实表未改。h003原始result/capture SHA与原文核验见supplement/h003-claims.md。无浏览器执行代码变更，不重复浏览器门禁，无模型/Live/GET。

## TEST-2026-10-16-E1-SUPPLEMENT-R2

目标红灯r2-red.log：实际h003 QUALIFIED≠独立预算NOT_MET的预期；新矩阵缺失同时暴露。绿色110定向覆盖两个h003的全部展示候选、h002正常预算MET、错SHA/候选/请求及无Gold保持NOT_CHECKED、严格Gold拒绝坏字段；原始Gold SHA39226c3b079b265789d354158f09fa52e3ae7fa821eedc10e2f3606eea84c7ce。第一遍默认门禁4项因普通评测误读校准文件ENOENT，明确不是检错成功；修复输入边界后typecheck/arch:check/npm test 909/909/build全绿，r2-*-final.log。Skill校验通过；无浏览器代码变化，不重跑已有112本地fixture证据。labels未读。

## TEST-2026-10-16-E1-SUPPLEMENT-RULES

rules-red.log三项实际业务断言失败：KF-H004误不合格，P1-G H004未识别环境过窗，P1-G2 H001系统失败被NE。对应正常/反例绿，改ID不改结果；删除预检、窗口内启动、缺相应失败attempt或仅孤立历史失败不能通过R5/R6；R1改日期仍不合格。真实共享CLI函数测试校验外层3refs、post-GET优先、错artifact/SHA拒绝，fetch替身禁止网络，非手填评分。114定向及四门禁typecheck/arch:check/npm test 913/913/build全绿，rules-{red,green-final,full-final,typecheck,arch-check,test,build}.log；Skill验证通过。历史失败日志保留，labels未读，校准未完成。

## TEST-2026-10-16-E1-SUPPLEMENT-HISTORICAL-WITNESS

旧加载器对真实神乐坂witness记录报Invalid witness source array（historical-witness-red.log），新加载器3店原始库存与独立HARD/半径进入真实Evaluator，CAPABILITY_MISS；删半径Gold不默认，删一店观察不缩水。h005独立认证对照通过，删除认证或改其日期仍AVAILABLE但feasible NE，不跨请求。116定向及typecheck/arch:check/npm test 915/915/build全绿；日志supplement/historical-witness-*。22包原始字节/双SHA重新核验通过input-recheck.log；Skill验证通过。仅历史来源引用与离线Evaluator，未动浏览器执行/Gold，无模型/Live/GET；正式校准尚未读取labels。

## TEST-2026-10-16-E1-CALIBRATION-CORRECTIONS

首次实际比较calibration-first-comparison.log退出1，4个分类遗漏并非靠测试数发现。calibration-causes-red.log为CAPABILITY_MISS≠INTERNAL及NE≠如实有界无结果的目标断言；修复后删除终止event不得仍判内部，删END_READ或UNKNOWN伪装无位不得仍判HONEST，改ID不改正常结果，必要环节NE仍保留。Gold异常字段目标断言calibration-gold-red.log先红，修复后明确UNEXPECTED_FIELD，不补原条件。119定向及四门禁918/918全绿，calibration-fixes-*.log。13条S0原始本地recording逐份只读核查，无HAR或body，retained-network-audit.json保留SHA与字段清单，不伪造无S0；正式最终校准仍待重评与独立输入。

## TEST-2026-10-16-E1-CALIBRATION-BLOCKED

真实共享入口8bdf88c的22重评输出逐份SHA已复核，校准比较脚本只读保存产物＋labels，calibration-final-comparison.log实际退出1，21/22类型，交付7/8，正常S0 7/20，2中断NE例外，误判合格0，4个已发现评测器错误关闭。Gold预算原始坏字段未修改、S0不足未改ABSENT，默认918/918不冒充签收。当前全表/逐维NE/输入SHA/红绿/命令在report.md最终节与calibration-20261016-rubric24-corrected目录。最后仅文档与结果保存，复用现有四门禁，不重复浏览器或模型；无Live/GET，未推送，停止等待。

## TEST-2026-10-16-E1-REVIEW-CLOSURE

当前证据在`.eval-artifacts/e1-evaluator-20261016/report.md`末尾、`review-followup/`及`calibration-20261016-rubric25-review/`，evaluator@29／rubric@25。Gold目标NOT_EVALUATED→QUALIFIED、搬迁目录路径失败→完整4家见证、声明因网络缺证无法独立输出→声明可评、端点检查误接额外POST字段→MISMATCH均有反例和正常对照；两h001旧冻结NE与新独立网络ABSENT对照单独标明旧结果复用，不伪称重新运行旧实现。实际取证是生产Guard＋真实本机Chromium＋独立localhost receiver，两POST字节/hash正确且错误body不会借用上次核对。脚本`run-p20.mjs h001 --dry-run-post-body`网络/模型/Live均0。

冻结7dd2645后运行`run-calibration.mjs`保存22输出，再用`compare-calibration.mjs`读取labels，实际退出0：类型22/22、交付8/8、正常S0-声明20/20、两缺result声明NE、误判合格0；越界9 ABSENT＋13 EVIDENCE_GAP，0 RULE_GAP，不把缺证写无错。`verify-calibration-gates.mjs`缺审核规则／缺必要Gold分别真正重评并保存后比较，实际目标退出1；正常22输出不覆盖。原始22包30gzip双SHA复验通过，manifest不变；37项冻结SHA前后及最终一致。

最终typecheck、arch:check、npm test 926/926、build通过。完整浏览器首次112/113的慢OPEN_LINK返回MODEL_FAILURE，原日志browser.log保留；单项browser-navigation-diagnostic.log通过，未改实现/时限/断言的唯一完整复验browser-final.log为113/113。原因尚未确定，不记环境错误或已修稳定性；未用skip/todo。Skill validator通过；其余必要维度仍NE（条件3／证据14／调查2／最终claim14／完成8／资源20），不是签收产品全部目标。78测试、98 eval源码输入及原始包／其他Fixture／v7种子路径清查保留JSON；历史Replay旧机路径依赖明确未改，不影响本22补评。全部业务离线，无新增真实模型、站点、Google、Cloudflare、Live、见证GET。

## TEST-2026-10-16-P21-prerequisites

E1已独立签收；P2-1第一段第0项完成。观察器迁入src/eval，全部调用方更新，浏览器测试不再依赖.eval-artifacts；3250ms本地响应下旧3秒请求失败红灯，新15秒测试时限在持续两CPU进程负载下连续5次通过。五门禁typecheck/arch/build通过、npm test926/926、真实Chromium113/113；迁移首轮遗漏调用方的失败日志保留。外层POST观察器、0交付补见证GET及reviewed-reads复制并冻结SHA，未新增规则；旧P2-0冻结清单保留作历史，本段不执行整单Live。0真实模型/Google/餐厅请求。证据p2-1-discovery-20261016/00-prerequisites与outer，继续发现探测工具；不推送。

## TEST-2026-10-16-P21-probe-tool

P2-1第1项发现探测工具完成：使用同一生产createLiveReadAssembly，每计划来源仅一次首批，不查位/交付；15模型/180秒上限含失败调用，来源未到达及指标下界显式保留。6份最近Live实际语义/位置按原SHA提取，仅按10fd06f批准variants.yaml换date，非date字段与独立criteria字面量核对。新增arch拒绝生产依赖本项探测/见证，实际import红灯有效；定向4/4、默认930/930、真实Chromium113/113及typecheck/arch/build全绿，6份CLI空跑0网络。输入/配置/认证脚本已冻结SHA；E1口径未改，Pack净变化0行。0真实模型/Google/餐厅请求，接下来认证并基线10次，做完ADR草案停下，不推送。

## TEST-2026-10-16-P21-witnesses

P2-1第2项运行前见证认证完成：6例均有当前可行见证，16原登记店全部保留，13家通过，32次公开只读GET；原始库存SHA及base_date/members独立校验全过，细节和未通过原因留证。不调用模型，不打开表单/点击时段；0 Google/整单Live。冻结认证集合、语义、工具及外层文件SHA后才能开始10次基线探测。工具260522e与五门禁930/930、Chromium113/113复用；只本地提交，不推送。

## TEST-2026-10-16-P21-preflight-wiring

首次探测在0ms预检配置失败，0HTTP/模型/Google/来源读取；原因是eval Runner预检参数位置错误。保留原日志，CLI改为有类型初始化，离线传输有效红绿证据通过；默认931/931、typecheck/arch/build绿，浏览器相关路径未改复用113/113。自动审批拒绝移除源码冻结检查且未执行，最终两层冻结边界均保留。首次模型前重新冻结@2，原清单与失败尝试保留；生产检索与6份语义/见证/预算不变，补一次未启动的编排失败，不推送。

## TEST-2026-10-16-P21-baseline-adr

第一段10次发现探测完成，86模型（含2失败）/15Google/0整单Live，四TARGET见证来源ID均未进入列表；CONTROL结果与超时/未到达如实保留。冻结0a25cae与active清单未变，931/931及Chromium113/113证据复用；ADR-0042为Proposed，0037只追加。报告见.eval-artifacts/p2-1-discovery-20261016/report.md；停在第3项，不推送，不实施第4–7项。

## TEST-2026-10-17-P21-readiness

ADR-0042已批准Accepted，探测40/模型450；新来源非空预检先于模型和正式运行，空/超时记ENV_FAILURE。十次旧基线TableCheck按复核改环境问题，Google精确官网ID分来源重算，原始产物不改；四门禁933/933绿，真实模型/业务网络/探测/Live均0。下一提交前记录P2-1a基线点，不推送。

## TEST-2026-10-17-P21-baseline-stop

Corrected the eval-only baseline stop predicate to use native source witness metrics; already-known exact Google website matches no longer trigger a false changed-bottleneck stop. Effective offline predicate red/green saved in followup/03b/baseline-stop-*.log. No production changes in this commit; 0 model, website, probe or Live calls. Prior readiness gates retained; current typecheck/arch/test/build also pass.

## TEST-2026-10-19-P21-tablecheck-get-draft

Authorized commits35c5dc2/4315ab8/3094193 pushed. Zero-model real TableCheck comparison proves catalog metadata GET and actual search GET at the new tablecheck.net origin; current Guard blocks catalog. Narrow GET declarations, API-document readiness count and frozen external GET audit added with effective red/green evidence. Actual search still requires browser CORS OPTIONS (requested GET, header name x-api-key); GET-only constraint preserved while clarification is pending. This is a partial transport fix, not a completed baseline. No witness recertification/probe/checkpoint/Live started; model budget remains86/450. Isolated fix worktree only; do not replace baseline point until transport is complete.

Final GET-only offline gates: typecheck/arch/build PASS, default935/935, real local Chromium114/114. Actual CORS blocker remains; no formal probes or witness requests.


## TEST-2026-10-19-P21-tablecheck-cors

L0：typecheck/arch/build通过，默认936/936；S0独立审核的合法/缺证/冲突协议事实通过。L1：真实Chromium六种预检对照通过，包括GET正常接收、POST预检/未知头/错路径/无GET规则/普通OPTIONS拒绝；Live trace与Recorder保留协议事实且无header值。有效红灯与中间接线失败均在network-restored-20261019/diagnostic/cors/保留。完整浏览器门禁115/115通过，日志gates/cors/browser.log；本条当前0新增真实模型/Google/探测/整单Live，实际网站验证单列。

最终类型补齐门禁另见gates/cors-final；并行默认套件有一次PGlite/V8原生崩溃，保留日志，不推定根因，不修改无关产品/测试；浏览器完整115/115通过，默认套件串行复验936/936通过（test-serial.log）。首轮变基组合940/940及Chromium116/116通过（基于344bea7），最终组合会在共同修复冻结后再验。

最终有效时序反例为diagnostic/cors/missing-marker-red.log→missing-marker-green.log；此前XHR类型字符样本并未复现缺标记，不能替代该红灯。含新Sec-Fetch-Mode事实的五门禁在gates/protocol-final/单独保存，原两轮日志保留为中间证据。

最终协议头版五门禁：typecheck/arch/build全绿、npm test936/936、完整真实Chromium115/115（222.056s），gates/protocol-final/results.json。中间原生崩溃已保留，此次顺序默认/浏览器门禁无失败。


## TEST-2026-10-19-P21-restored-baseline-ready

共同网络修复a60d27b（基于cac4b4f）已在真实来源验证：有/无Guard均20个解析门店，四条搜索GET200、四次合法浏览器预检放行，独立冻结S0边界审计ABSENT。见证重新认证32次公开GET，16原登记保留、13家合格，六例各至少一家，原始SHA/日期/人数/时段链接绑定独立校验通过；不打开链接、不调用模型。六份原输入SHA不变且Runner离线计划0网络/模型；共同配置/脚本/当前见证冻结后，十次基线在同一干净、未含P2-1a的工作树执行。原preparation/旧基线清单是历史材料；当前以network-restored-20261019/baseline-freeze.json为准。准备阶段0新增模型/Google/正式探测/整单Live，下一步是新基线；P2-1a还需变基到共同准备点，检查点A/Live不运行。

验证复用最终协议版五门禁936/936与真实Chromium115/115（源码不变），新认证校验/六份空跑/JSON与脚本语法检查通过，模式为0模型来源观察与离线准备；不是完整Live或资格交付验收。

## TEST-2026-10-17-P21-agent-retrieval

P2-1a implemented under Accepted ADR-0042: Agent-planned positive retrieval, visible same-region categories, at most two pre-detail rewrites, retained candidates and separate page budgets. Shared initial text proposal across TableCheck/Google; old post-batch expansion retired. State@16 has no compatibility path; no database touched. Baseline-before-P2-1a is 4315ab88fbab14424968ccbf0833f980c597de51. Effective planner/refinement and resumed-page-budget red/green evidence in followup/p2-1a; final five gates typecheck/arch/build PASS, npm test937/937, real local Chromium114/114. Fixed transports and local browser only; 0 real model/Google/restaurant requests, probes or Live. Checkpoint A and P2-1b not run; no push, await independent review.


## TEST-2026-10-19-P21-outer-preflight-resume

用户批准仅重冻外层并续跑剩余7项：每项仅对0模型、未正式启动的预检ENV允许补1次，所有旧失败保留；拒绝S0、已开始/完成的正式探测和第二次预检重试。外部恢复脚本独立冻结并从主树执行，cwd为干净acfaaffa基线树；源代码、输入、原外层及15模型/180秒预算不变。当前正式3次/13模型，另1次TableCheck空结果预检不计正式；累计99/450模型、13/40探测，0整单Live。

实际脚本语法与当前账本恢复正例、S0/已启动/已完成/第二次预检反例均通过，0网络/模型；证据network-restored-20261019/recovery/outer-resume-dry-run.json及freeze。源码未变，复用共同基线五门禁936/936、Chromium115/115及最终变基组合940/940、Chromium116/116；本提交先冻结外层，执行结果后续追加，不运行检查点A或完整Live。


## TEST-2026-10-19-P21-restored-baseline-complete

新的10次发现基线均在干净acfaaffa完成，新增55模型/55决策（全成功）、19正式Google＋11非空预检Google，0整单Live。仅神乐坂第2轮预检空结果停批，在用户明确批准的外层1b610a8下补1次预检后正式执行；旧失败和正式产物保留，0正式重跑。Tabelog见证列表1/10（H002 CONTROL）、TableCheck0/10、Google精确官网ID5/10；首批详情0/10。SOURCE失败码和指标观察范围限制原样报告，未把探测当交付或进行归因修复。累计20/40探测、141/450模型、45Google。

真实模型＋实时来源、仅发现：10次均来源非空预检READY，模型≤15/耗时≤180s/Google≤40；冻结源码/配置/输入SHA、55决策数与SHA、10份summary/trace/recording存在及旧产物逐字节一致、干净HEAD通过。独立冻结S0_BOUNDARY全部ABSENT；不证明未知GET无副作用，S0声明/S1–S4及资格库存仍NE。录制全部NOT_REPLAYABLE，缺忠实HAR/动态响应的原因保留，不冒充Replay。

L0/L1：有效红绿与原生崩溃中间日志保留；共同协议版936/936、真实Chromium115/115，最终变基组合940/940、Chromium116/116及typecheck/arch/build全绿。运行后无源码改动，复用五门禁；外层恢复实际脚本语法/账本正反例及纯文档链接、diff、权威/分母/命令检查另验。全批P2-1证据gzip估算约21.1MB＜60MB。当前端到端目标不适用，逐环节/严重度/归因限制见报告；新基线待独立复核后才决定A。


## TEST-2026-10-19-P21-checkpoint-a-freeze

用户批准进行检查点A。复用刚完成的0模型有/无Guard各20家对照、有效至10/20东京12:12后的同一见证认证、acfaaffa的10次基线；S0为0、基线预检ENV1次、4 TARGET原生来源命中0例，未触发新停止条件。A仅在干净39fc15e工作树执行，输入/见证/预检/指标与基线同字节；每次15模型/180秒/40Google，外层与计划先提交冻结，6份离线空跑0网络/模型。累计起点20/40探测、141/450模型、45Google；预检失败与基线合计超过2即停。A之后才单独修Google-only nearby，P2-1b/完整Live不启动。

外层状态正反例、语法、六份空跑通过；冻结sha与证据见checkpoint-a-20261019。A源代码与已通过的组合五门禁39fc15e相同，复用typecheck/arch/build绿、940/940和真实Chromium116/116；本准备0新增真实网络/模型/探测。


## TEST-2026-10-19-P21-checkpoint-a-stopped

检查点A按用户停止规则停批：仅H001第1轮正式完成，H001第2轮两次TableCheck非空预检EMPTY_RESULT，均0模型/未正式启动；连同恢复基线1次累计3＞2，剩余9次A不再启动。A新增4模型/4决策（全成功）、2正式＋3预检Google=5；累计21/40探测、145/450模型、50Google，0完整Live。

A冻结39fc15e、外层先提交e7e6913；输入/见证/规则SHA与干净工作树核验通过，用户草稿未动。复用五门禁940/940、Chromium116/116和typecheck/arch/build；1份A summary/trace/录制、4行capture SHA及两次预检原始文件保存。录制NOT_REPLAYABLE，不作Replay或完整业务验收。对照及全部未运行项见checkpoint-a-20261019/report.md、comparison.json与audit.json。

单个A的Tabelog见证true来自东京/涩谷通用导航列表；最终omakase3家、KEEP和首批详情与基线相同，不能把该命中解释为改写有效。3次规划5940ms/0超时，Tabelog3652ms=90秒预算4.058%，共享文本2288ms只计一次。网络形状S0_BOUNDARY为ABSENT，声明/其他严重度和9次未运行仍NE；环境根因未归因。只推送部分证据后停止，Google-only nearby修复因A未完成且命中停批规则而未开始，P2-1b不动。


## TEST-2026-10-19-P21-preflight-diagnosis

用户要求查清TableCheck预检原因；新增3次0模型公开只读页面诊断，带回调/去回调/实际生产预检均HTTP200、122条document hits，真实预检5308ms，未复现历史失败或403。确认程序缺陷：source preflight只设page.goto30秒，未prepareNavigation，Guard仍默认5秒；本地真实Chromium6.5秒响应在默认路径READ_TIMEOUT、显式10秒预算则200。确认无响应与明确空结果都归EMPTY_RESULT且不存HTTP/Guard详情。历史两次根因因缺证仍未确认，不把5秒机制或VPN追认成事实。

证据preflight-diagnosis-20261019/report.md/findings.json与三模式响应、本地timeout-fixture.json/log。首轮本地fixture缺根document审核配置导致启动失败，非目标红灯，已保留并只修fixture；真实超时对照两GET接收均验证通过。脚本语法/诊断断言通过，生产无改动，复用940/940、Chromium116/116及typecheck/arch/build，不新称完整门禁或产品修复通过。0新增模型/Google/正式探测，累计145/450、50Google、21/40，A停批账本不动；nearby/P2-1b未开始。诊断仅本地提交，不据查因请求推断新推送授权。


## TEST-2026-10-19-P21-preflight-fix

预检先调用 prepareNavigation，再以正式首批相同的35秒导航／单请求预算读取；不再把未收到搜索响应记为空结果，artifact@2分别保存 EMPTY_RESULT 与 NO_RESPONSE、HTTP状态、超时与Guard诊断。只有带状态或超时证据的失败进入停止计数；其余缺证失败仍阻止启动，留作预检诊断。

真实Chromium的6.5秒响应在旧代码下 EMPTY_RESULT/count0（red.log），修后返回1家/HTTP200（green.log）；既有空200、503无响应、无状态缺证及超时反例通过。五门禁typecheck/arch/build通过、默认941/941、完整真实Chromium117/117，日志见 checkpoint-a-corrected-20261019/preflight/gates/。

按aaeb088复核及用户指令，旧3次失败追加标注为“预检缺陷，原因未完全确认”，停止计数归0；旧A #1标为“P2-1a缺陷版本”并排除比较，原始字节与旧账本不改，4模型/1正式探测仍计费。探测上限42、模型450，累计145模型/21探测/50Google；本项0模型/真实网络/探测/完整Live。基线acfaaffa不变，接下来只修首页类别与规划提示，再重冻A；nearby留A后，P2-1b不开始。


## TEST-2026-10-19-P21-homepage-retrieval-fix

补齐Pack已识别的同地区首页类别：Pack从实际锚点提取本地区类别，执行器通过Pack地区绑定与当前可见LINK核对，继续拒绝隐藏、异地区与全国入口。未增加网络权限或资格放宽。Planner Prompt@2明确改写保留候选、少于5家优先相关类别、KEEP只用于列表足够；Schema@1不变。

A1原样7个类别锚点（snapshot5）旧Pack为0、新版大于0；生产组装的真实Chromium组合先红后绿，先改写再读取5家详情，原隐藏／异地区拒绝与候选保留覆盖仍通过。片段没有CSS，不当作原网站Replay；可见性由本地控件与新A来源另验。红灯red-pack.log/red-unit.log/red-composition.log，绿灯green-unit.log/green-composition.log；五门禁typecheck/arch/build通过、默认942/942、真实Chromium117/117，日志checkpoint-a-corrected-20261019/retrieval/gates/。

本项0真实模型/Google/网站/探测/完整Live；累计145/450模型、21/42探测、50Google。基线acfaaffa不变，旧A1不计比较但用量保留。下一步新干净工作树从头A10；Google-only nearby留A后单独提交，P2-1b不开始。


## TEST-2026-10-19-P21-corrected-a-freeze

修正后的检查点A冻结为209ac4200a1330e0ed8e1bdcbd03dd30faac0a23，使用新的干净管理工作树p21-checkpoint-a-corrected。基线acfaaffa、10项顺序和6份输入／见证／独立审核规则同字节；仅评测预检时限与诊断按用户批准修正。已核验未过期见证（最早10/20东京12:12）和基线TARGET原生见证命中0/4，未触发基线停止条件。

外层及315份源码／配置SHA冻结于checkpoint-a-corrected-20261019/freeze.json；真实模型前先提交。来源预检每次先行，只有具状态或超时证据的NO_RESPONSE／EMPTY_RESULT计停止，历史3次按复核排除；缺证仍阻止启动。每项最多1次预检专用补试，正式探测不重跑，S0即时停止。语法／停止及补试正反例、六例Runner离线空跑均通过，0网络/模型；复用修正源码五门禁942/942、Chromium117/117。

累计起点145/450模型、21/42探测、50Google；本轮A10每次15模型/180秒，仅发现、不查位、不交付。Google-only nearby在A后单独提交，P2-1b及完整Live不启动。


## TEST-2026-10-19-P21-corrected-a-complete

修正A10在干净209ac42全部完成，外层ee6ebd0／315冻结SHA通过；10次来源非空预检READY，0补试／0正式重跑／0计数失败，正式trace独立S0_BOUNDARY全ABSENT（不推断未知GET无副作用）。新增53模型／53成功决策、19正式Google＋10预检Google；累计198/450模型、31/42探测、79Google、0整单Live。

与acfaaffa同序输入的10次基线比较：Tabelog列表见证1→8／首批0→3；TableCheck列表与首批均0→0；Google精确官网ID5→3（名称线索不计）。列表含宽地区导航，不能当最终改写成功；页面内14次规划类别仍全0，本地提取7个原始锚点与Chromium机制绿灯不能证明真实页面类别扩展有效。总模型55→53，总时长788353→1062253ms；24规划调用52395ms、0超时。两项READ_BUDGET_EXCEEDED及CONTROL候选减少按原记录报告，不归因为某项修复。

逐例比较、来源序列、实际接受历史、页数、半径、规划时间、capture／trace／recording SHA及四层评价限制见checkpoint-a-corrected-20261019/report.md、comparison.json、audit.json。807份历史文件字节不变，旧A1缺陷版本不参与比较且用量保留；录制状态不冒称Replay。源码不变复用五门禁942/942、真实Chromium117/117，另验纯文档链接、JSON、diff与预算。A后只做独立Google-only nearby局部修复，不开始P2-1b／完整Live。


## TEST-2026-10-19-P21-google-only-nearby

A10完成并提交52ff459之后才实施Google-only nearby局部修正：地点规划输入不把nearby当成地点名，已规划Google Text Search复用现有去除nearby的area值。命名地点、权威坐标／半径、HARD和交付规则均不变；未修改P2-1a冻结工作树、Prompt、Schema或Gold。

生产createLiveReadAssembly入口＋脚本模型＋受控Google传输先红后绿：带来源／观察时间的有效坐标Fixture中，旧版location=nearby／local food nearby，新版空地点／local food；命名地点对照和坐标约束、intent不变通过，意外浏览器访问被测试拒绝。最终有效红灯nearby/red-typed-fixture.log，绿灯green-typed-fixture.log。原始缺失类型标注及两个依赖nearby字面量的旧组合失败日志保留；仅将h003/h005 SYNTHETIC_CONTROL检索匹配元数据改为通用restaurant，不改任何来源事实或Gold，既有五案组合恢复通过。

最终五门禁typecheck/arch/build通过、默认943/943、真实Chromium117/117，日志nearby/gates/。本项0真实模型／Google／来源／探测／整单Live；总量保持198/450模型、31/42探测、79Google。证明仅L0/L1受控组合，真实A仍用209ac42，效果和限制见A报告；不开始P2-1b或完整Live。按用户授权推送后停止待独立复核，推送以Git回执为准。


## TEST-2026-10-19-P21A-DOM-CORRECTION

切片：当前DOM中的同地区Pack合法类别进入检索规划，取消CSS门槛；地区与语法不变。Prompt@3传递实际已试表达式，明确空且无类别时选择GENERAL或实质不同词；执行器记录REPEATED_RETRIEVAL_EXPRESSION并在原改写额度内转通用列表或结束，不加模型重试。所有调用方同步，Schema@1、资格、网络规则及P2-1b不变。Accepted ADR-0042仅追加用户口径修订。

有效红灯：categories/red-css.log（真实本地Chromium的CSS隐藏类别）；retrieval/red.log（重复已用表达式）。绿灯：categories/green-css.log、retrieval/green-final.log。Google三来源实际请求回归当前源码本就通过；受控移除既有关键词接线的google/controlled-disconnection-red.log只证明测试检错，不能称旧版红灯。旧A10原始trace均为GOOGLE_TEXT_SEARCH且含共享词，review的nearby回归假设未复现。

五门禁全绿，typecheck/arch/build通过、默认943/943、Chromium117/117；冻结源码SHA与日志见p21a-dom-replay-20261019/gates/。旧A10离线DOM按现有语法实为5/9/9/0，多出的数字类别合法且逐条保留，与复核预期5/7/5/0差异明示。原14条页面规划categories均0；录制只有6条对应DOM，另7条可使用后续同地区DOM作反事实，1条无同地区DOM，不冒称原样浏览器Replay。本提交0真实模型/Google/网站/探测/完整Live，累计198/450模型、31/42探测、79Google。证明范围L0/L1，后续14条单步L3真实模型回放门槛至少两个指定用例选择相关类别，通过后才允许新A10。详见[批次报告](../../.eval-artifacts/p2-1-discovery-20261016/p21a-dom-replay-20261019/report.md)。


## TEST-2026-10-19-P21A-DOM-REPLAY-GATE

14条原始页面规划输入按已提交4017981的请求/审计/脚本冻结执行；只发往现有DeepSeek结构化输出端点，0网站/Google访问，14/14成功，新增14真实模型，累计212/450。6条有原规划DOM，7条用后续同地区DOM反事实注入，1条DOM缺证保留空类别；不称原样浏览器Replay。h001选sushi、吉祥寺选tempura、中目黑选yakiniku，3个不同用例达到预先固定的至少2例门槛。KF-H005仍选local cuisine/regional cuisine/regional dishes，不宣称近义词行为已改善。逐条原/新选择和理由、usage见p21a-dom-replay-20261019/report.md及replay/summary.json。

新A10冻结生产ba20b8a7e0ae5d00d93838f7f19b0ae01364e2be，干净管理工作树p21-checkpoint-a-dom；基线acfaaffa、6份输入和见证字节不变。现有见证最早10/20东京12:12过期，仍有效，0重新认证请求。318份SHA、外层与10项计划在checkpoint-a-dom-20261019/freeze.json；六例Runner空跑、预检失败计数及仅预检一次补试/拒绝S0/已完成/二次补试离线对照通过。冻结脚本仅改批次目录与账本起点，停止规则不变。复用源码五门禁943/943、真实Chromium117/117；本阶段除上述14模型无其他真实调用，探测仍31/42、Google79。接下来仅A10发现阶段，每次15模型/180秒、先非空来源预检；不查位、不交付、不开始P2-1b或完整Live。


## TEST-2026-10-19-P21A-DOM-A-PARTIAL

新A冻结ba20b8a/外层0195189，干净p21-checkpoint-a-dom工作树完成5/10正式发现：h001两次、神乐坂两次、KF-H005一次。新增29真实模型/29成功捕获，10正式Google+5来源预检Google，0正式重跑。两次h001均观察5类别后选Sushi，原生见证进入首批；神乐坂均READ_BUDGET_EXCEEDED；KF-H005实际首页57类别选Washoku，见证未进首批。仅为部分发现事实，不宣称整批改进或交付。

第6例KF-H005第2轮在早期LIVE_NETWORK_PREFLIGHT失败：TableCheck首页公开GET HTTP503/TLS建立，其他端点可达；0模型、未正式启动。其原始result具有状态码，但被冻结外层只读后续source-data-preflight，误作PREFLIGHT_EVIDENCE_GAP并停批；不是缺失HTTP证据，不推定VPN根因。剩余5例NOT_STARTED。最小外层恢复补丁已准备，严格只识别此公开TableCheck503、原0模型/未启动、一次补试；13个离线对照拒绝S0/已完成/模型已用/二次补试/缺状态/其他路径。补丁未应用或执行，已按Eval Skill §5请求重冻批准。

部分对照、检索序列/规划耗时/页数/半径/分来源见证和所有summary/decisions/trace/recording SHA见checkpoint-a-dom-20261019/report.md、comparison.json、audit.json；29捕获等于模型数、318冻结SHA/工作树clean、1400份历史字节一致。五份独立S0_BOUNDARY为ABSENT，仅指冻结规则可核验范围，不证明任意GET无副作用。源码无新增改动，复用五门禁943/943、真实Chromium117/117，并验证本轮纯文档/JSON/链接/预算。总量含14条离线回放为241/450模型、36/42探测、94Google、0完整Live。原冻结账本预检计数仍0，拟将已有503作为1次NO_RESPONSE的重分类另存提案，不静默改账。P2-1b不开始。


## TEST-2026-10-19-P21A-DOM-OUTER-RESUME

用户批准recovery/outer-network-preflight-resume.proposed.patch，仅外层把已有TableCheck公开首页GET503/TLS已建立、0模型/未正式启动的原始网络预检，记为1次NO_RESPONSE，并使用原有1次预检补试。用patch实际应用后逐字核对与批准稿一致。13个既有离线对照重跑全通过，0模型/网络；缺状态、其他地址、非503、模型已用、S0、已完成、正式已启动、第二次重试、超出2次停止计数均拒绝。原脚本/原失败/账本快照与原提案保留。

新外层SHA256为60546a05fbba4d5c4434f129730a5011666025e64cbbd8acb6158ef68b11775c，新recovery/freeze.json SHA256为5444b8d68333bbf41e252aad81ae2ea08ac0e6221140882f20e0ed6657c4b933，冻结595个文件，含已完成5例262份原始文件。生产ba20b8a、干净p21-checkpoint-a-dom、计划/6份输入/见证/预算/只读网络规则不变；见证仍有效至最早10/20东京12:12，无需再次认证。只有index5首条恢复带--recover-network-preflight和--resume-preflight-only，后续6–9正常执行；原已完成0–4禁止重跑。

源码无改动，复用五门禁943/943、真实Chromium117/117，并复核原318SHA、空闲进程、budget和工作树clean；外层单独13离线对照/AST检查。累计仍241/450模型、36/42探测、94Google，恢复首条会追加计数/审批/原始SHA记录，不覆盖旧失败。先本地提交本冻结再续跑剩余KF-H005#2、吉祥寺×2、H002、中目黑。S0、来源预检及每例补试/全批>2停止边界不变；完成后按授权推送并停止，不开始P2-1b。


## TEST-2026-10-19-P21A-DOM-A-COMPLETE

按用户最新批准，b0d15d3先提交外层恢复及595份SHA，再续跑唯一剩余KF-H005#2、吉祥寺×2、H002、中目黑，均正式完成且各只跑1次。批准前已完成0–4五例262份原始文件逐字不变；原失败及6条旧attempt记录完整保留，原503只追加为1次NO_RESPONSE并使用原1次预检补试。13/13离线对照通过，实际恢复链通过且无新增预检失败/正式重跑，stop=null。

恢复新增20模型/14Google/5发现探测；整轮新A共49模型/49成功捕获、19正式+10来源预检Google、10发现探测。累计261/450模型、41/42探测、108Google、0完整Live。每例15模型/180秒边界不变，生产ba20b8a、原6份输入/见证/模型配置/Guard及停止条件均未改；见证未过期，0新认证请求。完整summary/decisions/trace/recording路径和SHA、外层逐attempt绑定、分类证据见checkpoint-a-dom-20261019/report.md、audit.json、comparison.json、recovery/execution-bindings.json。

事实比较Baseline→上一轮A→本轮A：Tabelog列表见证1→8→8/10、首批0→3→5/10；TableCheck列表/首批均0；Google精确官网ID5→3→5。模型55→53→49，正式耗时788353→1062253→942173ms（不含预检与等待批准）；本轮22规划调用/56097ms/0规划超时。KF-H005首批仍0、神乐坂两次仍READ_BUDGET_EXCEEDED，H002半径内解析家数30→10；不足和CONTROL下降不隐去。类别机制在本轮实际页面生效，但不把开发发现计数当资格/交付或因果结论。

原318/恢复595冻结SHA、干净冻结工作树、1400历史文件、首五例262文件、49捕获计数、JSON/链接/diff/预算均核验通过。十份正式trace按独立冻结规则均S0_BOUNDARY ABSENT，仅限已记录规则证据，不证明任意GET副作用；端到端交付及S0声明未评价。源码未变，复用五门禁943/943、真实Chromium117/117；本轮只新增外层13对照与真实发现恢复证据。已按授权准备推送，Git回执为准，推送后停止待独立复核；P2-1b及完整Live未开始。


## TEST-2026-10-19-P21-HARD-RETRIEVAL

用户按 38b058e 复核批准 ADR-0042 追加：关键词仅绑定正向 HARD；SOFT/UNSPECIFIED 只可选择观察类别。共享无正向 HARD 的规划直接 GENERAL，0 模型，Google 附近搜索保留圆心。Prompt@4/Schema@1；原 ADR 原文保留。实际生产组合 H002 旧 textQuery=first date/1规划红灯，新 Nearby/0共享规划绿灯，HARD 关键词正向及页面类别对照通过。离线 Fixture 补齐已切换的 Nearby 响应与独立地点观察，不改原始 Gold/变体。证据 `.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-20261019/hard-only/`；五门禁全绿（默认946/946，Chromium117/117），仅 L0/L1，不宣称网站/模型质量。检查点 B 与 P2-1b 待后续实施，本项0付费模型/网站/探测。


## TEST-2026-10-19-P21B-SEARCH-HINTS

按 Accepted ADR-0042 第5项接入两个真实来源的 Pack URL 筛选：仅 AVAILABILITY/权威日期人数/可完整表达的单一时刻，核对页面实际选中值；缺值、冲突、忙或空结果最多一次未筛选回退，预留回退页数，原七/三页及90秒不提高。卡片时段不建 AVAILABILITY/Offer，资格不变。真实 Chromium 生产组合正反例与额外参数拒绝先红后绿；strictQueryKeys 避免带筛选的请求经通用公开 GET 绕过完整审核语法，Guard 无站点分支。独立网络审计、冻结用新 reviewed-reads.json、Recorder vac_net 同步。五门禁全绿：typecheck/arch/build，npm test948/948，Chromium119/119。红绿/中途 Fixture 计数迁移失败均保留在 `.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-20261019/search-hints/`。证明范围 L0/L1；0网站/真实模型。来源包生产代码净增54行，未以无关删除抵消，不认证阶段通用性退出条件。检查点B随后冻结运行，无完整Live。


## TEST-2026-10-19-P21B-FREEZE

生产冻结4975f9f，HARD修正884c56b，对照A为ba20b8a；新干净宿主机树p21-checkpoint-b。B外层复用批准的503分类/每项一次预检恢复，退役一次性A恢复入口；13/13离线对照、六个输入plan-only均0模型/网络。315文件SHA与A输入逐字节一致；新reviewed-reads SHA86c2203c…，outer SHAf833a007…，见证最早10/20 03:12:46UTC到期，仍有效故不额外认证。预算起点261/450模型、41/52探测、108Google；已计预检失败1沿用，超过2停止。运行前冻结配置，禁止中途变更。复用本次P2-1b五门禁948/119，冻结项只做离线配置矩阵。仅十次发现，不查位、不交付、不启动完整Live；完成后推送待复核。


## TEST-2026-10-19-P21B-PARTIAL-STOP

生产4975f9f/外层冻结c20001a不变。B完成3/10发现（h001×2、神乐坂#1），17条决策=17模型，3/3独立网络审计ABSENT；h001首批见证1/2，对照A2/2，不宣称提升。神乐坂#1仍READ_BUDGET_EXCEEDED。神乐坂#2两次网络预检均TableCheck首页HTTP503/NO_RESPONSE，0模型/0正式探测；本批2次+沿用A1次=3，触发PREFLIGHT_FAILURE_LIMIT，余7项未启动，H002/Nakameguro对照NOT_REACHED。新增17模型/3探测/9Google，累计278/450、44/52、117Google，完整Live新增0。见证未过期，0额外认证；315冻结/2660历史SHA、干净树核验通过。产物/逐例A-B/停止证据见 `.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-20261019/report.md`。代码五门禁948/119复用，收尾仅按纯文档/报告矩阵检查。按授权提交并推送后停止待独立复核，不修网络、不追加请求或重跑。


## TEST-2026-10-19-P21-B-CORRECTIONS-SOURCE

current executable。按4592a1e复核及用户批准，仅修同地区首页筛选、稀疏有类别时禁止KEEP，以及TableCheck搜索筛选限制。Schema restaurant_discovery_retrieval@2、Prompt restaurant-discovery-retrieval-prompt@5；Pack显式SKIPPED/FILTER_TRANSPORT_NOT_REVIEWED，删除停用的构造／选中值路径，不扩网络权限或资格。三个旧筛选快照实际为Search is unavailable，含open_from/open_until的OPTIONS被既有Guard拒绝，不是正常0结果；诊断0网络/模型。旧B三次标为B第一版并排除比较；原报告h001 #2跳过原因更正为QUERY_NOT_REPRESENTABLE（原始文件不改）。有效红灯fixes/red.log、tablecheck-red.log，最终五门禁typecheck/arch/test951/951/build/browser119/119全绿，原厂factory/Guard Chromium 302首页组合通过。证明范围L0/L1＋已有录制离线诊断；新B与完整Live未启动，模型仍278/450、探测44/55。报告及日志：.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md；fixes/verification.json。


## TEST-2026-10-19-P21-B-CORRECTED-FREEZE

current executable。生产a37e152b4283d8f407c9650d19200708314e3362，干净宿主机p21-checkpoint-b-corrected工作树；复用已验证生产五门禁951/119。仅按批准更新外层：预检失败归零按本检查点计、TableCheck503至少600秒后一次重试、最多1800秒恢复，持续503停止。17离线对照、六个原冻结输入plan-only通过，均0模型/网络；见证仍有效至2026-10-20T03:12:46.141Z，复用不新增认证请求。SHA清单322项；execute.py SHA-256 c4e0b8fbe51496888bb6f87776919dac586f1c90da864f9e5130ef5e1098dd40。模型起点278/450、探测44/55、Google117，最多新十次×15模型≤428/450及54/55；不跑完整Live。旧B第一版3次/17模型保留且计预算、排除比较。冻结路径.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/freeze.json；计划plan.json；外层offline-controls.json。源码门禁未变不重复，编排按纯外层离线矩阵核验。


## TEST-2026-10-19-P21-B-SETUP-RESTORE-PENDING

current executable。三项修正a37e152五门禁951/119通过；外层冻结3c4d241。首个外层尝试因新工作树漏部署冻结reviewed-reads.json，在Runner读取文件处ENOENT，未创建started、预检或决策目录，新增正式探测0／网络0／模型0；不是来源环境失败。原日志、ledger备份、0调用proof保留。已补齐原SHA审核文件，生产工作树仍CLEAN，冻结脚本未改、stop未清除。按Eval Skill§5发出最小外层恢复补丁批准请求，10项离线准入正反例通过（包括已完成／已正式启动／模型及Google计费／其他stop／不同HEAD拒绝），未擅自重跑。新B0/10，比较A全部NOT_REACHED；模型278/450、探测44/55、Google117、完整Live0。报告.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md及recovery/，源门禁复用，文档／证据按纯文档矩阵检查；尚未推送。


## TEST-2026-10-19-P21-B-SETUP-RESTORE-APPROVED

current executable。用户明确批准恢复补丁。按原提案逐字应用，只允许已留证据的首次0网络／0模型／未创建运行目录的准备失败恢复，输出改用setup-2，原日志和原ledger备份保留；正式探测不可重跑。17外层对照及10恢复准入对照全部通过，0新模型/网络。缺失审核文件已按同SHA部署且新增宿主机文件SHA绑定。生产a37e152／六输入／预算／预检十分钟及三十分钟规则不变；复用五门禁951/119。重冻329项，execute.py SHA 649f752e8b90f343d3f8b8a7f6a67fc8355c286f0cb597985336bf5c5345eacd。此前源冻结和脚本保存到recovery/，按Eval§5记录影响仅首个尚未进入预检的启动失败。继续B10，仅发现；旧B第一版排除，新起点278模型/44探测/117Google。报告.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md。


## TEST-2026-10-19-P21-B-CORRECTED-ENV-STOP

current executable / 本次外站效果未测。修正a37e152五门禁951/119全绿；初始3c4d241及首次0调用部署失败fc671b5保留。用户批准的精确恢复补丁在ae9288e重冻，17＋10离线对照通过，329冻结SHA包含实际审核文件部署；生产／输入／预算不变。北京20:49:03预检TableCheck503，首次结束627.529秒后在20:59:43使用唯一一次预检重试，仍503；TLS建立，其他就绪目标DeepSeek200、Tabelog200、公共Google404（非Places），根因未定。外层TABLECHECK_503_PERSISTED_AFTER_RETRY，检查点内失败2、起点0，按规则停止全部剩余。新B正式0/10，模型0、Google正式/数据预检0，累计278/450模型、44/55探测、117Google、0完整Live；全部B行NOT_REACHED，缺正式result/decisions/recording，诊断评价器不适用而非通过。A十行逐项对照保留，H002归HARD修正组，其余P2-1b；旧B第一版3次排除比较但保留用量和字节。329冻结及2893历史SHA、JSON/链接/diff核验，复用未变a37e152源五门禁；无源或配置继续修改，未额外探测／模型／重试。报告.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md，原始两次网络result和timeline/raw SHA保留。远端新增标注／未来变体通过普通merge4f57841保留，不用于当前B输入。用户授权推送，Git回执为准，之后停下待独立复核。


## TEST-2026-10-19-P21-B-20M-RECHECK-FREEZE

用户最新指令“你等20分钟再测一下”，以收到后UTC13:09:14为保守起点，不早于UTC13:29:14（北京时间21:29:14）补一次网络可达性预检。复用冻结a37e152生产函数与no-proxy，不改产品、模型、输入、原execute.py或已停止账本；两次503仍保留，不伪装为原30分钟恢复窗口内的重试。外层独立environment-recheck-20m/recheck.mjs与plan/approval已冻结，329项旧冻结验证、plan-only、提前调用拒绝均通过（0网络/模型），一次性原子目录防重复。只核对NETWORK_READINESS，不运行来源数据预检、模型或正式探测；返回结果再记录原始产物。复用a37e152五门禁951/951与Chromium119/119，来源能力和B比较仍未验证。累计278/450模型、44/55探测、117 Google、0完整Live不变。原始证据：[独立预检计划](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/environment-recheck-20m/plan.json)。


## TEST-2026-10-19-P21-B-20M-RECHECK-RESULT

按用户“你等20分钟再测一下”，冻结e691ca0后在UTC13:30:16.007–13:30:27.363执行一次runDiscoveryProbePreflight；晚于13:29:14，不提前访问。TableCheck范围GET206、Tabelog200、DeepSeek模型目录GET200、Google公开根路径404，NETWORK_READINESS PASSED，生产预检11219ms。原始HTTP元数据及摘要/SHA保存于checkpoint-b-corrected-20261019/environment-recheck-20m/attempt-1。仅4次既有预检GET，0模型生成、0Google搜索、0正式探测；没有来源非空预检、浏览器或Agent评价。原停止账本SHA不变，两次503和计数2保留；该通过不代表列表非空或B产品效果，不自动恢复B。新B仍0/10、模型278/450、探测44/55、Google117、完整Live0。复用a37e152五门禁951/951、Chromium119/119；此次冻结/历史/链接/diff与raw完整性另核。推送本批后停止待复核。报告：[追加预检结果](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md)。


## TEST-2026-10-19-P21-B-USER-CONTINUE

用户“你赶紧的”要求继续来源非空预检和修正B。独立outer user-resume-20261019已提交2f088b8：仅接纳两次503且0模型/0正式启动的停批状态，核对已成功补检与原账本SHA。原stop及完整账本另存，历史尝试不改，只追加恢复记录；保留计数2，任何新计数失败停批。生产a37e152、冻结输入和预算不变，无产品/Prompt/Schema修改。复用原Runner网络及来源非空预检，通过才开始模型，不另加重复来源请求。17项旧对照及7项恢复准入对照共24/24通过（0网络/模型）；复用源代码五门禁951与Chromium119。起点278模型/44探测/117Google，待原计划B10。报告：[续跑说明](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md)。


## TEST-2026-10-19-P21-B-USER-CONTINUE-ENV-STOP

用户要求立即继续，外层2f088b8已在执行前提交；宿主机a37e152/CLEAN于UTC14:40:31.516–14:40:45.366尝试首例。TableCheck首页GET再返回503（TLS成功），DeepSeek200、Tabelog200、Google公开根路径404；NETWORK_READINESS失败，尚未进入来源搜索非空检查、浏览器或模型。21:30曾206、22:40再503仅为观测事实，不据此归因VPN、限流或网站。旧三条attempt和stopHistory前缀保持，旧账本原字节另存；本次新增1次失败，累计3触发PREFLIGHT_FAILURE_LIMIT，未自动重试、未启动其他例。0新增模型/搜索/正式探测，修正B仍0/10，累计278/450模型、44/55探测、117Google、0完整Live。复用原生产五门禁951/119及24项外层离线对照，329原冻结与2893历史SHA通过。来源非空、模型效果及B比较保持NOT_REACHED。原始result、日志与账本同步证明：[续跑结果](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md)。保存提交推送后停止待复核。


## TEST-2026-10-19-P21-B-USER-RETRY4-ENV-STOP

按用户“再试一次，如果通过直接跑”，外层63a8136在运行前冻结，仅接纳当前0模型/0正式启动、历史3次失败的状态；保留旧attempt/stopHistory与userResume历史，允许这一次额外尝试，不放宽网络或来源非空检查。24项离线对照通过。UTC14:54:30.244–14:54:40.128再次尝试，TableCheck首页范围GET503（TLS成功），DeepSeek200、Tabelog200、Google公开根路径404。NETWORK_READINESS失败，来源非空和正式B均未到达，未增加自动重试。累计失败4、PREFLIGHT_FAILURE_LIMIT；本次0模型/Google搜索/正式探测，B仍0/10，累计278/450模型、44/55探测、117Google、0完整Live。复用a37e152五门禁951/119，原始HTTP元数据、账本前缀证明、冻结和历史SHA完整性均保存。报告：[本次结果](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md)。提交推送后停下。


## TEST-2026-10-20-P21-B-RETRY5-SOURCE-PREFLIGHT-STOP

按用户“你再试一次，如果没问题就跑b”，外层76137e8已在运行前冻结，24项离线对照通过；生产a37e152、输入/见证/资格与预算不变。UTC02:07:09.619–02:07:55.426首例尝试中网络预检通过（TC206、Tabelog/DeepSeek200、Google根路径404）。来源非空检查：Tabelog20家/HTTP200/7581ms；TableCheck count=null、无HTTP状态、NO_RESPONSE/NO_VALID_SEARCH_RESPONSE/22178ms；Google文本搜索count=null、无状态、READ_FAILED/8001ms。不得记作搜索结果为0或擅自归因。来源失败缺少HTTP状态或TIMEOUT证据，不计入阈值，历史计数4保留，PREFLIGHT_EVIDENCE_GAP停批。未开始正式B、模型、决策或录制；本次0模型/0正式探测，Google搜索尝试1次，累计278/450模型、44/55探测、118Google、0完整Live，B0/10。旧attempt/stopHistory/recovery记录前缀均保留，证据和报告保存。复用源五门禁951/119，冻结和历史SHA核验；[原始路径与报告](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md)。提交推送后停止，无额外重试或规则放宽。


## TEST-2026-10-20-P21-TABLECHECK-DIAGNOSTIC-CONTRAST

用户要求进一步核查网页正常而预检失败。冻结4552b06后，仅对同一Ginza预检URL做3次只读诊断，生产仍a37e152，Guard规则未改，0模型/0自有Google API/0正式发现探测。原生产runSourceDataPreflight在4149ms接纳HTTP200、122条接口文档命中；其关闭前页面尚未渲染卡片，不等于来源没有数据。手动原Guard与普通Chromium分别在3880/3610ms首次收到阳性API响应，随后页面都显示20张卡片及Showing1–20of652。请求分组口径不同，122不是页面总家数。全部响应早于20秒，未复现提前关闭、监听漏记或持续Guard阻断；此前geolocation拦截也出现于成功记录，不能作单独归因。历史NO_RESPONSE原因仍NOT_CONFIRMED，旧失败、stop账本和2893历史文件保持原样，不能用当前成功回写旧结果或再笼统认定VPN/网站故障。三组均无点击/填写，未观察到POST响应；不作全链路S0认证。B未启动，Google之前READ_FAILED未复测，累计仍278/450模型、44/55正式探测、118Google。复用原生产五门禁951/119，新增诊断仅脚本语法/plan-only及raw/冻结/链接/diff核验。[三组对照报告](../../.eval-artifacts/p2-1-discovery-20261016/preflight-diagnosis-20261020/report.md)。


## TEST-2026-10-20-P21-B-START-AND-RETRY10M-FREEZE

当前切片仅为已批准的 P2-1 修正B发现探测，不做完整Live。生产 a37e152 与原十项输入不变，16个注册见证原集合经32次公开GET更新认证，支持ID集合均未改变，0模型/Google；认证冻结0e4eed2、运行冻结8f39756。h001首例正式完成：84990ms、4模型、2正式Google+1数据预检Google，4条决策=4次调用，Tabelog/Google精确见证命中、TableCheck列表20卡片但无见证，录制网络独立审计ABSENT仅限该trace。第二例首页Range GET返回HTTP403，尚未进入来源数据/模型阶段；外层只识别503，记PREFLIGHT_EVIDENCE_GAP且历史计数4保留，缺口如实记录，不在运行中修代码。累计282/450模型、45/55探测、121Google、0完整Live。

用户随后批准“你可以十分钟之后再试一次”。只冻结新的外层准入：UTC2026-10-20 03:05:44后对未正式启动的index1补一次，来源预检通过后继续剩余顺序；已完成index0绝不重跑，既有attempt/stop/counter保留。24项0网络离线对照通过，原源五门禁951/951与119/119以源码和日志SHA复用。冻结输入/见证/指标/Guard不改；后续任何stop即停止，不自动追加重试。当前尚未执行本次补试，结果另记。[运行报告](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md)、[新准入和时限](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/user-retry-10m-20261020/approval.json)。L0/L1门禁、0模型认证和真实模型发现证据分开，不宣称B全批或完整交付通过。


## TEST-2026-10-20-P21-B-RETRY10M-HTTP403-FINAL

按用户“十分钟之后再试一次”的批准，冻结03944f4/400项SHA/outer df8f94a...；宿主机生产a37e152/CLEAN与所有输入、原见证集合、Guard和指标不变。UTC03:07:10启动（晚于03:05:44），03:07:17结束：TableCheck首页Range GET再次403，TLS已建立；网络预检6339ms，TC1850ms。DeepSeek200、Tabelog200、Google公开根404仅为连通性结果。尚未进入来源数据、模型或正式发现阶段，未创建决策/录制/完整任务评价；本次新增模型/Google搜索/探测均0。外层仅识别503，因此保留PREFLIGHT_EVIDENCE_GAP和历史计数4，不能把诊断缺口改成额外重试。原始result SHA43be1d97...已保存。

修正B仍1/10正式完成、余9项NOT_REACHED，首例4条决策=4模型，未重跑。累计282/450模型、45/55正式探测、121Google、0完整Live。旧attempt/stop/recovery前缀核对后同步账本，原329冻结/2893历史文件不变；源262及门禁日志SHA复用五门禁（951/951默认、119/119本地Chromium、typecheck/arch/build PASS），24外层离线控制PASS。新运行仅为只读预检，不构成B改善或完整交付验证，H002组未到达。

用户最新要求不再重试并正常推送已完成工作；心跳已暂停，不启动其余运行。只同步本批证据与文档，用户INDEX和未跟踪稿件不暂存。[部分B报告](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md)、[补试事实与raw SHA](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/user-retry-10m-20261020/attempt-summary.json)、[最终核验](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/user-retry-10m-20261020/post-change-verification.json)。推送结果以Git回执为准，完成后停下待复核。


## TEST-2026-10-20-P21-B-NETWORK-FIXED-RESUME-FREEZE

用户确认网页恢复并要求“现在应该行了。你再跑下b试试”，本次授权覆盖先前停止重试的指令，仅续跑未完成的B计划indices1–9，已正式完成的index0绝不重跑。生产a37e152、原十项计划/六输入、Prompt/Schema/指标/Guard/预算均不变；沿用8f39756冻结的同集合见证，最早有效至UTC2026-10-21 02:47:04。用户在宿主机添加en0作用域默认路由，独立物理出口公开GET获得TableCheck301/Tabelog200；当前实际直连规则覆盖TableCheck com/net及Tabelog。这些只作为宿主机环境观察，不替代Runner每例的网络和来源非空预检，未认证完整搜索或B改善。

新外层仅精确准入index1的两次0调用HTTP403预检之后的这一次恢复；账本与上次已提交SHA及回执一致，completed[0]、历史失败计数4、formalGoogle2/preflightGoogle2均保留，旧attempt/stop/recovery历史不清零。28项0网络离线对照PASS；408项文件SHA冻结，原329/历史2893/源码262和五门禁日志核对后复用951/951默认、119/119本地Chromium、typecheck/arch/build PASS。任一新stop结束本轮，无自动额外重试；源预检通过才正式发现，每次15模型/180秒/40Google，0完整Live。

本次准备新增模型/正式探测/Google均0，累计仍282/450模型、45/55探测、121Google；余9次最坏54/55探测、417/450模型。已批准正常推送将在结果汇总后执行，随后待复核；其他聊天P2-2/P2-3不动。[恢复授权与精确范围](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/network-fixed-resume-20261020/approval.json)、[离线对照](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/network-fixed-resume-20261020/offline-controls.json)、[冻结](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/network-fixed-resume-20261020/freeze.json)。


## TEST-2026-10-20-P21-B-NETWORK-FIXED-PARTIAL-503

- 范围：按用户“现在应该行了。你再跑下b试试”继续仅发现的修正检查点B；保留已完成index0，源生产`a37e152b4283d8f407c9650d19200708314e3362`及输入不变。当前恢复冻结提交`9b1e5f17fd604c98bca5d302a26f8cd82203f989`、408项SHA，外层SHA`180d48674c1d923840685fd8494d6f2d8a23d3adafeebcf3815482628b27ec6c`；28项0网络离线对照复用。用户在运行前修复宿主机路由，此环境变化限制A/B的单变量归因。
- 真实只读发现：本次indices1–4完成（h001第2次、神乐坂两次、KF-H005第1次），新增23模型、8正式Google＋4预检Google。每次三来源数据预检均通过，TableCheck返回122条命中；新产物决策数逐次等于模型调用数。B共5/10、27模型、10正式Google＋6预检Google；两次神乐坂来源含`READ_BUDGET_EXCEEDED`，不能把运行完成记为全部能力通过。
- 停止：index5于UTC2026-10-20T04:19:41.398进行NETWORK_READINESS，TableCheck首页GET返回503，未进入来源数据检查、模型或正式探测；保留原始响应与旧账本前缀，历史失败4→5，冻结外层触发`PREFLIGHT_FAILURE_LIMIT`。剩余KF-H005第2次、吉祥寺两次、H002、中目黑均NOT_REACHED，不额外重试、不继续P2-2/P2-3。
- 评价：按Eval四层分列；五条轨迹的独立网络审计ABSENT仅证明其记录内未见越界。十行A/B保留、只比较同例已到达的5行；H002的HARD修正组未到达。Tabelog见证进入列表3/5、首批2/5；TableCheck0/5；Google精确ID1/5。检索规划耗时、页数、检索序列、半径内家数和源级失败详见报告；仅发现不运行完整Task诊断评价，不证明实时库存或交付。
- 验证：生产源码未改，复用262源码SHA与五门禁（typecheck、arch、build；默认951/951、真实本地Chromium119/119）；核对408当前冻结、329原冻结、2893历史SHA、见证原认证、五条决策/模型计数及产物引用。按纯文档矩阵检查链接、账本、索引、diff和权威一致性；原网页录制字节保留，不清洗空白。未改用户INDEX、演示文稿与产品草稿。
- 用量：累计305/450模型、49/55正式发现探测、133 Google、0完整Live。停止后本地提交并按既有授权正常推送，等待独立复核，无后续自动运行。
- 证据：[B逐例报告](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md)、[续跑汇总](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/network-fixed-resume-20261020/attempt-summary.json)、[预检时间线](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/network-fixed-resume-20261020/preflight-timeline.json)、[后验核验](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/network-fixed-resume-20261020/post-change-verification.json)。


## TEST-2026-10-20-P21-B-BROWSER-READINESS-FREEZE

current executable / 外层编排冻结；外站结果待运行。

用户最新明确授权：移除TableCheck首页Range GET网络预检，TableCheck就绪仅依据原有真实Chromium来源数据预检返回非空；DeepSeek、Google、Tabelog网络预检照旧。外层入口从冻结的原Runner机械生成，只替换网络预检调用、模块定位与被动环境信号观察；生产组装、Guard、来源数据读取、模型捕获、资格与探测指标保持原样，生产仍`a37e152b4283d8f407c9650d19200708314e3362`，干净工作树不改。

离线44项对照（18项实际预检传输/观察＋26项外层时序/重试）及5项冻结输入Runner解析空跑全部PASS，0网络/模型。原逻辑遇模拟TableCheck首页403/503失败，新外层只发其他三项网络检查；真实浏览器来源预检的非空/空/超时语义仍复用原函数。Google无密钥根端点只证明HTTPS可达，任意HTTP状态与其原行为一致；传输失败仍阻断。被动观察保留原Guard策略和回调存在性，不新增响应体读取。

新顺序indices8、9、6、7、5，既有completed[0..4]保留且禁止重跑。正常从上一次尝试结束起至少300秒；确切403/503或来源繁忙页从失败结束起至少900秒，仅同项重试一次，持续失败停批。旧累计失败5原样保留，旧stop按此次明确授权归档；新策略不沿用旧累计阈值自动拒绝本次准入。任何正式环境重跑都计探测/模型预算；总上限55探测、450模型、60MB压缩artifact不增加。S0和旧安全停止规则继续最高优先级。

源262SHA及原五门禁复用（默认951/951，真实本地Chromium119/119；typecheck、arch、build通过）；现有16个注册见证认证未过期，不新增认证。准备阶段仍305/450模型、49/55正式发现、133 Google、0完整Live。先提交新外层、SHA和离线证据，再在同一干净宿主机工作树执行，结果完成或停批后按授权推送，等待复核。

[本轮授权](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/browser-ready-resume-20261020/approval.json)、[顺序/预算](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/browser-ready-resume-20261020/plan.json)、[传输对照](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/browser-ready-resume-20261020/offline-network-contrasts.json)、[时序对照](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/browser-ready-resume-20261020/offline-policy-controls.json)、[冻结](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/browser-ready-resume-20261020/freeze.json)。


## TEST-2026-10-20-P21-B-BROWSER-READINESS-H002-429-STOP

current executable / 修正B部分真实发现证据，未整体验收。

- 改动及冻结：本轮只改外层，冻结提交`31866be3fbe104ccf696361e8f4a50edc14aaf3f`，738项SHA，生产仍`a37e152b4283d8f407c9650d19200708314e3362`。TableCheck去掉首页网络GET，原真实Chromium非空来源数据预检保留；DeepSeek、Google、Tabelog网络预检保留。18项传输/观察＋26项时序/重试离线对照、5项Runner解析空跑通过，0网络/模型；生产五门禁复用262源码SHA和日志SHA（951/951、119/119、typecheck/arch/build PASS）。
- 本轮完成：按批准顺序先跑H002，三来源预检非空，TableCheck200/122条；正式发现85,872ms、4模型、1正式Google＋1来源预检Google。Tabelog见证进入列表与首批，半径内解析候选30个；共享文本规划0次，页面类别规划1次，Google上下文nearby:restaurant。H002作为HARD修正组单列，不把这一个结果推广为P2-1b效果。
- 本轮停止：H002记录结束04:58:00.506Z，中目黑05:03:46.223Z启动，间隔345.717秒，满足至少5分钟。三项网络预检通过；来源数据预检Tabelog列表HTTP429/NO_RESPONSE/HTTP_STATUS，TableCheck200/122条，Google1条。该次0模型、0正式探测，1次来源预检Google。未记录403、503或冻结忙碌原文匹配信号，外层未触发15分钟单次重试，按来源就绪失败停批。字面停止码PREFLIGHT_EVIDENCE_GAP是未匹配失败分支；本次已有429状态证据，不能解释为无HTTP响应。历史失败5→6保留，但不是触发旧累计阈值；不归因VPN或网站防护。
- 完成/剩余：原H001两次、神乐坂两次、KF-H005第1次全部未重跑且SHA保留，本轮新增H002，修正B共6/10。余中目黑、吉祥寺#1、吉祥寺#2、KF-H005#2未正式启动，中目黑仅预检，其他3项NOT_REACHED。真实15分钟重试未触发，其规则仅由本轮离线对照覆盖。
- 评价与限制：原两次READ_BUDGET_EXCEEDED保留；完整十行A/B表只对已到达6行比较，H002/HARD与其余P2-1b分组。六条正式轨迹的独立网络审计ABSENT仅限这些轨迹，来源预检非空不证明查位/交付。录制均保存原SHA，NOT_REPLAYABLE/UNSAFE_DOCUMENT标记如实保留，不声称静态回放通过。完整Task evaluator不适用于本次仅发现探测。
- 用量：本轮新增1正式探测、4模型、3 Google（1正式＋2来源预检）；累计309/450模型、50/55正式发现、136 Google、0完整Live。原329冻结、历史2893、当前738与已完成314文件SHA核验；源码、Prompt、Schema、Guard、输入、见证及已有录制未改。纯文档矩阵检查账本前缀、产物、链接、索引和diff，原网页字节保留。完成证据提交推送，停止等待独立复核，自动化保持暂停。
- 证据：[逐例报告](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md)、[新冻结回执](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/browser-ready-resume-20261020/freeze-commit.json)、[续跑汇总](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/browser-ready-resume-20261020/attempt-summary.json)、[429停止事实](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/browser-ready-resume-20261020/stop-facts.json)、[间隔核验](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/browser-ready-resume-20261020/pacing-verification.json)、[后验验证](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/browser-ready-resume-20261020/post-change-verification.json)。


## TEST-2026-10-20-P21-B-SEVENTH-RECOVERY-FREEZE

current executable / 本次仅外层恢复准入，外站结果待运行。

用户最新明确要求“继续第七次”。第七次为中目黑index9，前次仅来源预检Tabelog429，0模型、未正式启动；上次结束UTC05:03:56.504，现在已超过900秒。新恢复只接受这份原始429产物、原账本SHA、completed[0,1,2,3,4,8]、31个B模型调用和历史失败6；错误用例、已完成、正式启动、已消耗模型、安全停止、不同产物或提前时钟均拒绝。旧stop/attempt/recovery历史原样保留并追加本次人类授权，不清零。

新准入20项0网络/模型离线对照PASS，复用原44项预检/观察/节奏对照和5输入解析空跑。原冻结浏览器入口SHA47db4b10…完全复用；生产仍a37e152，262源码SHA、原五门禁951/951、119/119与typecheck/arch/build日志核验通过。826项SHA冻结，379份已存运行文件保护，用户INDEX、演示文稿、产品草稿不动。

准入后仍先做其他三项网络预检与三来源非空数据预检，TableCheck仅浏览器搜索就绪；正常间隔至少5分钟，明确403/503或已观察繁忙页才允许15分钟后单次自动重试，429未新增为自动条件。中目黑通过后，按此前已批准的剩余顺序吉祥寺#1、吉祥寺#2、KF-H005#2继续；任一冻结stop即结束。总上限仍450模型/55正式发现，当前309/50/136 Google、0完整Live，无额外认证或网站诊断。

[本次授权](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/user-resume-seventh-20261020/approval.json)、[20项离线对照](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/user-resume-seventh-20261020/offline-controls.json)、[新冻结](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/user-resume-seventh-20261020/freeze.json)、[运行前核验](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/user-resume-seventh-20261020/pre-launch-verification.json)。


## TEST-2026-10-20-P21-B-SEVENTH-RECOVERY-B10-COMPLETE

current executable / 完成十次真实只读发现探测，不代表完整用户交付或阶段签收。

- 冻结与准入：用户“继续第七次”后，外层恢复冻结`7103f0f24cd78febaaa8cacd1b42078e3292fbb5`、826项SHA。新20项0网络/模型精确准入对照通过，复用原44项外层对照、5输入解析和262源码/五门禁（默认951/951、真实本地Chromium119/119、typecheck/arch/build PASS）。原生产仍a37e152，原浏览器入口SHA47db4b10…完全复用；不新增自动429重试，旧失败计数6和全部历史保留。
- 第七至十次依序完成：中目黑66,740ms/9模型，Tabelog READ_BUDGET_EXCEEDED、Google精确命中；吉祥寺#1为74,501ms/3模型，#2为71,563ms/3模型，均Tabelog见证进入列表/首批且Google精确命中，无来源失败码；KF-H005#2为79,170ms/3模型，Tabelog见证进入列表未进首批，无来源失败码。所有原六项不重跑，四次预检均Tabelog20/TableCheck122/Google1，TableCheck200；Google来源预检状态未保留，不补造。
- 调度与边界：其他三项网络预检保留，TableCheck不做首页GET，只用原真实浏览器搜索非空。首个手动恢复距前429失败超过15分钟，后续间隔均至少5分钟；实际时间与原始响应SHA保存。无新403/503/繁忙页信号，无自动重试，无任何完整Live。十条正式轨迹的独立网络审计ABSENT仅限记录内，不能当作通用只读安全证明；录制NOT_REPLAYABLE/UNSAFE_DOCUMENT标记保留，不声称可执行静态回放。
- A/B十行对照：整体Tabelog列表8→7、首批5→5，Google精确5→4，TableCheck0→0；H002/HARD组首批0→1，其余9例/P2-1b组首批5→4。模型A/B均49，正式耗时942,173→806,489ms；规划22→18次、56,097→40,607ms，规划超时均0。READ_BUDGET_EXCEEDED为A2/B3（B神乐坂两次、中目黑一次）。不以耗时减少代替能力改善，不作单变量归因；宿主路由、来源数据、模型和外层节奏差异均披露。完整Task诊断Evaluator不适用于本批发现切片，用户交付/查位仍NOT_EVALUATED。
- 用量与验证：本次新增4探测、18模型、8正式Google＋4来源预检Google；修正B共49模型、19正式Google＋12来源预检Google。累计327/450模型、54/55正式探测、148 Google；artifact压缩估算54,638,987/60,000,000 bytes。49条决策逐次等于模型调用；原379运行文件、历史2893、原329/当前826及源码/门禁SHA核验，见证仍有效且未重新认证。按纯文档矩阵核对链接、索引、账本前缀和diff，原网页字节不清洗，用户INDEX、演示文稿和产品草稿不动。
- 完成后正常提交推送，自动化保持暂停，不启动完整Live或其他工作包，停止等待独立复核。
- 证据：[完整A/B报告](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/report.md)、[四次续跑汇总](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/user-resume-seventh-20261020/attempt-summary.json)、[新冻结回执](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/user-resume-seventh-20261020/freeze-commit.json)、[实际间隔](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/user-resume-seventh-20261020/pacing-verification.json)、[预检原始记录与SHA](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/user-resume-seventh-20261020/actual-readiness-verification.json)、[后验核验](../../.eval-artifacts/p2-1-discovery-20261016/checkpoint-b-corrected-20261019/user-resume-seventh-20261020/post-change-verification.json)。

## TEST-2026-10-19-P22-SELECTION-TIMING

- 历史与oracle：P20/P1 Google多候选选择需查名，旧脚本化覆盖未验证预算选择；复核者revision2完整when独立评分，保留revision1同输出对照。已有native组合/Pack/Context/回放/计时断言复用；恢复旧组装的真实入口目标断言失败，修后正常控制在原预算交付，见old-assembly-path-red.log/path-timing-green.log。
- 最终 typecheck、arch:check、build PASS；npm test952/952（gates/*rev2-final.log）。真实本地Chromium119/119（274410ms，gates/browser-final.log）复用本轮浏览器路径未再变化的结果。沙箱Chrome启动失败/旧断言/observer返回类型的调试日志保留，不算产品反例；允许本地进程权限后默认套件全绿。
- 0网络/模型离线计算52次：50可计时、2中断未评；30地区轨迹诊断。优先级互斥区间与独立固定算术对照通过，初版错误DISCOVERY归因保留为superseded，当前timing-results.rev2。
- 用户批准标注revision2后，真实DeepSeek单步回放5/30调用，23491ms，101327tokens；0Google/网站/动作执行/Live。0133不退步；神乐坂NOT_ACCEPTABLE；涩谷1/3，0134 TOOL_CALLS但$.retrievalHint非法被拒，整体门槛FAIL；S0–S4全任务影响不由单步结果推断。模型合法输出不等于可接受选择。
- 冻结290658f/319SHA，按既有仅外层授权6283843/325SHA续跑未运行3颗；生产源码/Gold/日期/半径不改，旧两次结果保留，五颗没有重复调用，源HASH及完整上下文独立比较通过。raw wire、输入、账本、旧严格对照、地域诊断和四层边界见[报告](../../.eval-artifacts/p2-2-selection-20261019/report.md)。不进入Live/检查点C，不宣称总体P2-2通过。

## TEST-2026-10-19-P22-STRUCTURAL-SCOPE

- P2-2首次查位结构约束离线通过：Context@14/Prompt@27与Validator同一scope，>=3未查且半径内直达时暂不提供名称解析候选；事实/显式刷新/资格不变。有效旧scope红灯、默认953/953及Chromium119/119全绿，0真实调用；本轮五种子回放留第3段。
- 证据：[后续报告](../../.eval-artifacts/p2-2-selection-20261019/followup/report.md)。旧实验/Gold/预算不变，原始失败不覆盖。

## TEST-2026-10-19-P22-TABELOG-SOURCE-BUSY

- P2-2 Tabelog繁忙页离线修复完成：Pack识别固定访问集中提示，原预算内等1秒后最多重试1次，仍繁忙为UNKNOWN/SOURCE_BUSY（ENVIRONMENT），不再冒充身份不确定；Google门店链接规范同ID英文页。保存的3次运行6份同形HTML红绿、恢复/真实冲突/期限控制通过；五门禁957/957与Chromium120/120。0真实调用，当前网站未验。
- 证据：[后续报告](../../.eval-artifacts/p2-2-selection-20261019/followup/report.md)。原始模型回放/Gold/预算和身份规则不变。

## TEST-2026-10-19-P22-STRUCTURAL-REPLAY

- P2-2结构约束真实模型回放达到门槛：冻结1646667，五颗各一次均可接受；神乐坂1/1、涩谷3/3、0133不退步，0134旧严格对照亦通过。新增5调用、累计10/30，0网站/Google/动作/Live；不额外重跑，历史见证未选中，非库存或端到端验收，继续已批准地区/测量工作。
- 五门禁957/957与Chromium120/120；原请求/Gold/旧产物不变，单步理由/独立判定/冻结SHA及四层限制见[后续报告](../../.eval-artifacts/p2-2-selection-20261019/followup/report.md)。


<a id="test-2026-10-20-p22-region"></a>
## TEST-2026-10-20-P22-REGION

- Red：旧代码父页面仍可选、合法LOCATION完成后候选为0；真实观察链接投影与合成搜索明示分开，初始Fixture失败保留。Green：7项地区行为与既有生产组合；旧卡片零调查、父入口强行绕过零导航，3步可行恢复在原预算产出1家；保留同地区首页恢复、4/5替换等边界。五门禁typecheck/arch/build PASS、默认962/962、本地Chromium120/120（278349ms）；最终地区/生产组合补充回归通过。见[原日志](../../.eval-artifacts/p2-2-selection-20261019/followup/step4-gates/)。默认测试沙箱EPERM及初始类型/同地区列表误拒均保留诊断，修后重验，不作有效故障红灯。无网站、Live、真实模型追加；完整交付/真实正确神乐坂路线未评。

<a id="test-2026-10-20-p22-timing-plan"></a>
## TEST-2026-10-20-P22-TIMING-PLAN

- 沿用52份旧产物（50可计时/2未评），汇总前三段为VENUE_SEARCH详情、Browser模型、查位解析；保留校准与仅发现分组，给出三个未实测节省区间/风险及同来源最小请求间隔方案。只写方案，0外站/模型、未实施、不变预算或门槛。报告：.eval-artifacts/p2-2-selection-20261019/followup/performance-proposals.md；纯文档核对原始汇总/算术/链接，复用第4段门禁。

<a id="test-2026-10-20-p22-website-measurement"></a>
## TEST-2026-10-20-P22-WEBSITE-MEASUREMENT

- 脚本冻结cf11c54后仅读取52份旧产物及30份trace并核SHA；32份有Google候选，20份无观察不计成功空结果。每run首见去重共1191次候选出现：158直达、927网站字段待查（77.8%）、106无网站；跨run253个ID中198待查（78.3%）。不等于已证实官网或预约出链率，检查点C未评。字面计数/去重/冲突/脏URL/SHA控制通过；0外站/模型，不接线抓取器，复用第4段生产门禁。

<a id="test-2026-10-20-p22-name-resolution-prep"></a>
## TEST-2026-10-20-P22-NAME-RESOLUTION-PREP

- 按主分支指令完成待审样本42条（30 Tabelog/2 TableCheck/10无Gold对照），来源66份原产物SHA可追溯，TableCheck少8家明示。样本SHA89ce49a49e428e84c5a4caed8831bf8ca98d1c06566d384879f8ce42992d0f87。src/eval接生产名称/身份前缀、独立ID指标/S0停批及去官网/Gold边界，生产代码和既有Gold不变；方法B条件未满足不启用。默认967/967及离线控制通过；Chromium门禁完成后另记。0真实模型/网站/预检，新增预算A150/B条件100未使用。报告：.eval-artifacts/name-resolution-benchmark-20261019/report.md；推送后等待样本独立批准，不跑第4项。

<a id="test-2026-10-20-p22-name-resolution-frozen"></a>
## TEST-2026-10-20-P22-NAME-RESOLUTION-FROZEN

- 样本/离线接线冻结1624aa3，SHA89ce49a49e428e84c5a4caed8831bf8ca98d1c06566d384879f8ce42992d0f87；30TL/2TC/10对照，TC缺口保留。五门禁type/arch/build PASS、默认967/967、本地Chromium121/121（283348ms），5项指标/泄漏/禁止日期控制通过，66份原输入及配置SHA不变。真实模型/网站/预检均0，方法B未启用；推送后停下等样本批准，第4项仍须批准与网络就绪。见基准report.md。

## TEST-2026-10-19-P2-3-PRICE-CONDITIONS

- Historical cause: Sendou9800 course existed in recorded HTML but was only prose; old behavior tests omitted numeric price grounding and per-condition display. Baseline4592 Adapter fails the new9800 assertion (`old-adapter-price-red.log`); current source fragment control passes. Extend existing Adapter/assessment/context/evaluator/Web tests; do not count fixture construction failures as product regression evidence.
- Known-feasible controls: exact recorded prices and tax retained, approved around endpoints2400/3600 accepted and4000 rejected, HARD missing/false blocked, SOFT false disclosed, lunch/add-on not used as dinner price. TableCheck retains guide facts when the request page is unavailable. Actual local Chromium Web refresh replaces the displayed price/status and keeps citations. Model/Google calls0.
- Independent calibration: code d79dae7,49 frozen file hashes;22 saved automatic outputs frozen before the existing comparator read unchanged reviewer labels. Outcome22/22, normal S0_DECLARATION20/20, interrupted2/2 explicitly NOT_EVALUATED allowed; S0_BOUNDARY9 ABSENT,13 evidence gaps allowed,0 rule gaps. Not an overall boundary-zero claim or new-case accuracy.
- Real read-only observation: guide317f501 yielded public menu HTML in12.9s; later user-supplied reserve URL was rejected before network by production Guard. Separate web text reading confirmed3300 drink option needs BBQ and cannot be booked alone. This is current text corroboration, not original historical DOM/Replay or inventory acceptance. No form interaction.
- Gates: typecheck/architecture/build passed, default953/953; full actual Chromium119/119 passed. Existing failed old-context assertion and fixture debugging logs remain for attribution. No full task Live, real model replay, or external write.

## TEST-2026-10-20-CHECKPOINT-C-INTEGRATION

Checkpoint C offline integration starts from origin13c93a3, sequentially merges P2-2 7dfeb69 and P2-3 89e0dfb (41d677c/5309545). All13 conflicted paths preserve both behaviors/history/tests; combined Context@15, Prompt@27, State@17, Evaluator@30/rubric@26. Five gates PASS: typecheck/arch/build, default972/972 and local Chromium121/121. Original22 calibration retains22/22 outcome types,20/20 normal S0 declarations,8/8 delivery subtypes,0 false qualified; boundary9 ABSENT/13 historical gaps remain distinct. All354 frozen hashes and both branch test inventories verified. No websites/models/Google/probes/Live or name-resolution item4; primary user drafts/INDEX untouched. Independent integration branch only, pushed under explicit user authorization; no source/main merge. [Report](../../.eval-artifacts/checkpoint-c-integration-20261020/report.md).

Concurrent remote review305d1e0 was synchronized verbatim after the feature merges (38 review-only lines,0 conflicts). src/package and all354 frozen hashes remain unchanged from5309545; the same five gates and22 calibration apply. No P2-1c implementation or new calls.

## TEST-2026-10-20-CHECKPOINT-C-SELECTION-NAME-BENCHMARK

Integrated branch8ecfcfc review read. Freeze1c08f4c and explicit specific-payload human approval precede5 actual DeepSeek selection replays: all ACCEPTABLE, Kagurazaka1/1, Shibuya3/3,0133control1/1, direct13/13. Context15/current Prompt27; original event prefixes supply commercial facts, but none of these historical turns has a price fact (no invented prices).0 websites/Google/actions/Live during replay. Tabelog benchmark now prepared:30Gold+5controls, TableCheck7 deferred; frozen sample89ce49a4 retained. Eval-only source admission removes cross-source readiness dependency,403/429 are ENV, both valid red/green. Final four code gates PASS (972/972), local browser121/121 reused because production browser/prefix unchanged. Outer11 offline controls and321 input/source/config hashes. Gold once/30s; source block10m and3/day stop; methodA<=150 and3/subject; methodB disabled. [Selection report](../../.eval-artifacts/checkpoint-c-integration-20261020/selection-recheck/report.md), [benchmark phase](../../.eval-artifacts/name-resolution-benchmark-20261019/live-20261020/report.md). Real source work starts only after this freeze commit; final results follow in the same entry.


Gold phase2260cc8 subsequently completed30 once-onlyHTTP200 reads (0 models), min gap30.032s; original28/2 automatic certificate preserved, manual full-address comparison before A yields29VERIFIED/1DROPPED. User-approved eval identity-stop patch closes swallowed-diagnostic continuation: strengthened existing default test red(select)→green(no controls), local Chromium identity prefix green, production unchanged. Fresh five gates PASS972/972 +121/121 (279333ms). MethodA-only390 SHA freeze and13 offline controls retain30 prior reads/5 replay calls; public-payload authorization recorded,34 subjects planned/≤150 models. No MethodA call yet. Parallel remote changes deferred until this frozen execution ends.


Final execution:30Gold once(allHTTP200),29VERIFIED/1DROPPED fixed before A;34/34 methodA subjects complete at1b4cfda. Gold12/29 CORRECT,15NOT_FOUND,2UNCERTAIN,0WRONG_ACCEPTED; controls2REVIEW_REQUIRED/3UNCERTAIN unscored.35 actual deepseek-flash calls(≤3/subject),5 selection calls,total40; Google/fullLive/B0. Median32530.5ms,max61442ms;63 logical gaps minimum30.025s,0source blocks.390 current/321 historical SHA,66 original input SHA,35 normalized paid-request SHA and unchanged30Gold ledger prefix verified. Independent response audit0 recorded violations but64 session/request gaps remain NOT_EVALUATED.14 list-request final URLs leave rstLst; record observation without attributing language/phone-rule cause. Root and phase reports include all result/artifact/raw/model paths and area/name-shape groups. Source execution finished before any parallel remote integration; no rerun or new call.

Publication-only remote merge after source completion preservesfe9b3fc and State18/P2-1c, with5 document conflicts resolved retaining both complete bodies/indices; all236 raw benchmark files and18 replay files unchanged. Fresh merged five gates978/978 +122/122 PASS.11 independent evaluator files unchanged; remote22/22 types and20/20 S0 calibration reused. Current State18/Task16/BrowserPrompt17; original name run remains frozen1b4cfda/State17. No extra model/source calls or source/main merge; publication-retention.json and report document scope. The existing browser suite regenerated its tracked region fixture output (20 timing fields); current gate output saved separately in the benchmark batch, original bytes restored exactly with SHA receipt.

<a id="test-2026-10-20-p21c-region-entrance"></a>
## TEST-2026-10-20-P21C-REGION-ENTRANCE

- 冻结输入/评分f85e7a0，源码/生产组装43000a9。旧覆盖遗漏：缺标签但已有同源指针；red.log在旧代码结果0且错误地区可执行。补强既有地区主测，含序列化一次消费、失败不重试、跨run/请求、外域/缺坐标/越界反例。
- 六例实际生产factory+Guard+本地Chromium，真实链接/Google指针投影与合成详情分列；独立字面地区、几何、观察引用和原预算核验。不是完整任务或真实模型通过率。54条历史逐条评分，神乐坂4条缺入口观察保留未覆盖。
- 默认973/973，本地Chromium122/122，typecheck/arch/build PASS；最终门禁及原始产物见[verification](../../.eval-artifacts/p2-1c-region-20261020/verification.json)。真实网站/模型/探测/Live均0，五次后续探测未运行。

## TEST-2026-10-20-P21C-CHECKPOINT-C-INTEGRATION

- 以8ecfcfc为基线合入已复核ddfdedd，源码/配置冻结d6d989b；State@18／TaskDefinition@16，保留价格/条件状态与地区提前读取，Browser Prompt@17。五门禁PASS：默认978/978、本地Chromium122/122，type/arch/build通过；原22份校准结果类型22/22、S0声明20/20。真实网站/模型/探测/Live均0。
- 用户18预期先红（17≠18）后绿；误选测试和初始类型错误单列，不算原故障红灯。六个受控生产地区组合按原独立Gold/几何/预算检查通过。Evaluator/Comparator复用，运行前冻结358项SHA；2中断声明不入20分母，边界9 ABSENT/13历史证据缺口保持。
- [报告](../../.eval-artifacts/checkpoint-c-p21c-integration-20261020/report.md)。离线 acceptance 通过；实际地区/来源预算和h001非退步等后续5探测等待用户通知，最早见证到期即停、不续期。

## TEST-2026-10-20-P21C-LIVE-PROBES

- 复用B失败原证据和P2-1c固定录制红绿，外层15核对+3 plan-only均0网络/模型；源码不变，复用前切片五门禁978/122与22份校准。真实五例神乐坂2/2正确A1309、中目黑2/2正确A1317、h001单次保持TL4/TC5及见证首批；原始snapshot/观察引用/几何/预算和只读边界独立核对通过。
- 五例均无失败码/READ_BUDGET_EXCEEDED，模型20/20成功，Google正式18+预检5；累计347模型/59探测/171Google。全部间隔≥300秒、0环境重试；原见证截止前完成未续期。录制NOT_REPLAYABLE/UNSAFE_DOCUMENT为当前限制，非库存/完整Live验收。
- [报告](../../.eval-artifacts/p2-1c-region-20261020/live-probes/report.md)与执行/评价/调用账本分列；普通推送集成分支后停下等复核，不追加探测。


## TEST-2026-10-20-CHECKPOINT-C-OFFLINE-PREP

- Evidence status: current executable preparation；演练为frozen regression，非Clean Baseline。
- 五门禁PASS：typecheck、arch:check、npm test 978/978、build、本地Chromium122/122。首次沙箱本地监听／浏览器权限失败独立保留，放行本地Fixture后全绿，未访问外站。外层控制8/8、外层TypeScript及认证脚本语法PASS。最终冻结0ce8a3f，341文件，脚本化传输完整跑通外层→Runner→@30/rubric@26→四层报告，8个脚本响应、0真实模型／网络／Live／认证；HONEST_NO_RESULT，S0声明ABSENT、越界NOT_EVALUATED，不当作Live验收。运行后来源失败控制保留原result和evidence-gap；仍待用户批准24h内见证、Live及预算／安全账本复核。
- [本批报告](../../.eval-artifacts/checkpoint-c-live-20261020/report.md)／[验证记录](../../.eval-artifacts/checkpoint-c-live-20261020/verification.json)。

- 后续外层最终合同检查：繁忙信号也须 ENV_FAILURE / ORCHESTRATION_INTERRUPTED 才能重跑；八项控制与外层typecheck仍PASS。当前有效冻结更新为 `d18c0ae`／SHA `961d5d62236c229ff4dc3762e93cc045588d9e51cb43b3e55d33bed02dc68157`，341文件，`rehearsal-policy/` 再次跑通完整0网络／0真实模型链路；较早冻结与演练作为历史保留，不覆盖原产物。


## TEST-2026-10-20-CHECKPOINT-C-REVIEW-PREP

- Evidence status: current executable preparation；脚本化frozen regression，非Clean Baseline。
- 五门禁全绿：typecheck/arch/build，默认978/978、Chromium122/122。未知即停批与shops/slug绑定有目标断言红灯；14项外层绿灯、1项真实Chromium/Guard本地捕获控制、独立外层typecheck通过。最终冻结1d40f62／364文件，SHA 4141d17db6601e404a6c3e23a8adae04e2f2bfa1833de8875091d4e40487ce4c；冻结后完整脚本化Runner→@30/rubric26→四层报告通过，8脚本响应，0外站/真实模型/认证/Live。较早冻结演练保留为历史，不覆盖。
- 未评价不等于安全通过；当前库存、真实模型表现均未验证。认证预计30–60分钟，18次预计3–4小时，满预算预留4–4.5小时；环境冷却另加。推送准备分支后停下等批准。
- [报告](../../.eval-artifacts/checkpoint-c-live-20261020/review-followup/report.md)／[验证](../../.eval-artifacts/checkpoint-c-live-20261020/review-followup/verification.json)。


## TEST-2026-10-20-CHECKPOINT-C-WITNESS-INTERRUPTED

- Evidence status: current partial Live Read-only witness evidence；非Clean Baseline。
- 认证前3/3节奏/重试/绑定控制PASS；停止后实体quote断言红→绿4/4，JS语法/外层类型检查PASS；partial finalize与六例Live门禁均拒绝，未启动Live。库存正文和JSON-LD原始片段SHA独立核验PASS，五门禁复用未变生产基线978/978＋122/122；这些不等于认证或Live通过。
- 用户批准认证，未批准Live；H002第三家fetch failed且无HTTP状态，停止后没有重试或自动恢复。最终认证未完成，无最终Live冻结SHA；只封存中断证据。
- [报告](../../.eval-artifacts/checkpoint-c-live-20261020/witness-certification-20261020/report.md)、[未完成登记](../../.eval-artifacts/checkpoint-c-live-20261020/witness-certification-20261020/registry.pending.json)。


## TEST-2026-10-20-CHECKPOINT-C-WITNESS-RESUME-STOP

- Evidence status: current partial Live Read-only witness evidence；已暴露开发集，非Clean Baseline。
- 两分钟重试红→绿；认证6/6、外层14/14、类型／语法通过。真实认证8次HTTP尝试6个200及2次无状态失败，重试等待120.002s、最小来源间隔30.002s。停止后JSON-LD身份复核7/7（含异店拒绝），旧捕获exact-name=false保留；partial finalize及全部六例Live门禁均拒绝。原始SHA与只读请求序列独立核验PASS；五门禁复用未变生产基线，不将源码门禁当完整认证／Live通过。
- 0模型／Google／整单Live／正式Live环境重跑；最早见证2026-10-20 20:26:41.866北京，24h截止次日同刻，认证完成时间为空。未自行改日期、未打开表单或点击时段。
- [报告](../../.eval-artifacts/checkpoint-c-live-20261020/witness-resume-20261020/report.md)、[未完成登记](../../.eval-artifacts/checkpoint-c-live-20261020/witness-resume-20261020/registry.pending.json)。


## TEST-2026-10-20-CHECKPOINT-C-WITNESS-COMPLETION

- Evidence status: current executable preparation；已暴露开发证据，非Clean Baseline。
- Live Read-only认证准备：8项认证控制通过，实际红灯证实旧实现会重采Meibutsuya门店页；跨轮SHA／时间保留反例通过。外层14控制、typecheck／arch／build通过；生产与a3f6b84同字节，复用978/978默认及122/122真实Chromium门禁。此时0新增网站／模型／Google／整单Live。
- [计划](../../.eval-artifacts/checkpoint-c-live-20261020/witness-completion-20261020/plan.md) · [离线核验](../../.eval-artifacts/checkpoint-c-live-20261020/witness-completion-20261020/pre-capture-verification.json)。


## TEST-2026-10-20-CHECKPOINT-C-WITNESS-CERTIFIED

- Evidence status: current Live Read-only witness certification；已暴露开发集，非Clean Baseline，不是正式Live。
- 精确续采18GET全200、最小间隔30.000秒、0重试／模型／Google／完整Live；保留原6家不重采。6例15/16登记认证，计数2/3/3/2/2/3；Komuro指定库存未匹配，Fukumimi当前菜系证据与原句变化及人工判断单列。
- 460项冻结运行输入结束后不变；原始SHA／请求字面量审计、六例500秒时效门禁与阶段剩余额度通过。认证控制8、外层14、本地边界1，typecheck／arch／build通过；生产未变复用978/122门禁。
- 最早见证2026-10-20 20:26:41.866北京，Live须在次日同一时刻前完成；生成最终Live冻结后推送准备分支，等待复核者和用户批准SHA，不开始Live。
- [报告](../../.eval-artifacts/checkpoint-c-live-20261020/witness-completion-20261020/report.md) · [核验](../../.eval-artifacts/checkpoint-c-live-20261020/witness-completion-20261020/verification.json)。

## TEST-2026-10-21-CALENDAR-NEXT-MONTH

- Evidence status: draft / not integrated；Fixture/静态生产观察，已暴露开发集。
- 初始sandbox Chrome/localhost启动失败单列；提权后有效旧实现红灯3/3：Matsumoto重复错误Next耗尽、月份未变无NO_CHANGE反馈、H003接收器收到reserve请求。修复后3/3绿，新增公开aria/title/img/svg文字及多个日历不乱绑Fixture通过。中间序列化__name导致观察缺失已修复并留原日志，不把它混作设计红灯。
- 五门禁：npm run typecheck PASS；npm run arch:check PASS（0 forbidden）；npm test PASS 977/977；npm run build PASS；npm run test:browser:fixture PASS 126/126（真实本地Chromium）。默认978→977来自两条过期reserve菜单成功测试合并为一条两顺序拒绝合同；Chromium122→126补当前真实失效点。0模型/真实网站。
- 69点生产观察预检69/69：真实Next month anchor对应公开DOM节点、Calendar组、Oct2026与CLICK许可；同一批69原种子/oracle不改。重建有CSS，本地履行所有文档/样式，其他资源拒绝；脚本不执行，未打开表单或点击时段。准备保留原progress/history；两日历锚点href按原始观察恢复脱敏丢失#，记录输入SHA。
- 冻结后计划：原22自动产物先保存SHA再独立比较；69浏览器点≥68，5选店5/5；最多74模型含失败且无付费重试。阶段账本1995/4000为唯一基线。单点回放不代表完整任务、实时库存或泛化能力；旧Live S0不撤销。
- 记录：[`gates.json`](../../.eval-artifacts/checkpoint-c-live-20261020/calendar-next-month-20261021/gates.json)、[`原始反例`](../../.eval-artifacts/checkpoint-c-live-20261020/calendar-next-month-20261021/red-fixtures.log)、[`Tabelog参数核查`](../../.eval-artifacts/checkpoint-c-live-20261020/calendar-next-month-20261021/url-parameter-audit/audit.json)。

- 本轮冻结后结果（同一切片）：b7f56b660c9a1fc017b792a01eb405ff83349383 / freeze SHA256 d065beef6675bdb0bc403a32326a956b83422e4632b93089ade434ba37b9709d，625项运行后无变。原22校准22/22（S0声明20/20、8交付子类8/8、0误判合格；越界9无/13缺口），P2-2五选店5/5、直接页13/13；翻月仅54/69，15点为PARTY_SIZE，未达≥68/69，整体NOT_ACCEPTED。全部74请求成功、无重试，984912输入/9975输出token、0 reasoning；模型请求墙钟翻月均1.890s、选店2.132s，批次141.296s。阶段账本2069/4000、完整Live7/100、环境重跑0/10；0新网站/Google/Live。
- 偏离与限制：真实静态生产重建的69份target集合、64份visibleText与第0步不同，history/progress/skills未变；不能把原68/69与新54/69当作严格单变量比较，门槛仍失败，不改标签/不付费补跑。独立Fixture证明字段与月份后置条件，不能代替真实任务或下游反事实。Guard旧S0不撤销。
- 浏览器门禁原有测试会覆盖旧region-composition-results.json，已将本轮产物另存本批次并恢复旧文件逐字原样；受保护Gold/变体/种子与所有冻结代码/输入/脚本均未变化。机器输出[result.json](../../.eval-artifacts/checkpoint-c-live-20261020/calendar-next-month-20261021/result.json)、[四层报告](../../.eval-artifacts/checkpoint-c-live-20261020/calendar-next-month-20261021/four-layer-report.md)、[逐点表](../../.eval-artifacts/checkpoint-c-live-20261020/calendar-next-month-20261021/decision-matrix.json)与[运行后校验](../../.eval-artifacts/checkpoint-c-live-20261020/calendar-next-month-20261021/post-verification.json)。推送独立修复分支后停止，等待复核，不合入集成、不跑Live。

## TEST-2026-10-21-CALENDAR-SELECTED-STATE

- Evidence status: draft / not integrated；真实本地Chromium与固定开发输入，非Clean Baseline。
- 有效红灯4/4：已有2人仍重复点击/1人点击后循环、通用选中状态缺失、人数未变但无关文案改变却COMPLETED。修后4/4绿；涵盖8种精确class及4种ARIA正状态、负状态不猜、同名不同组隔离、无人数组不编造、已选控件作为证据保留、人数未确认不能收尾。Matsumoto Fixture包含其他区域DOM内容更新，组确认仍绑定真实owner。
- 默认回归旧单元Fixture仅改变“confirmed”文案，现补选中控件与组；浏览器旧断言要求隐藏选中日期，现改为保留证据且无可执行动作。Tabelog组合与C3成功Fixture补真实标记与组归属，失败场景不改。测试证明当前行为合同，不改69点评分和原输入。
- 准备69原点全部独立DOM绑定真正Next month，当前引用均一致；历史引用时序逐点审计，0模型/网站。原15问题点selected=请求人数且不再给PARTY_SIZE权威点击；32未观察选择、3不同请求均如实保留。旧54/69与74调用原样保留。
- 最终五门禁、原22校准与69+5回放待提交冻结后记录；最多74真实模型请求，不重试，0网站/Google/Live。文件均在[本批次](../../.eval-artifacts/checkpoint-c-live-20261020/calendar-selected-state-20261021/plan.md)。

- 冻结后最终结果：运行提交8e47ddfd70be692e5d43dd70474e7e1a78b22d88，SHA256 040dbdac7477e64b643aa6550c43a57b650473dae51365b143d90f1f3954876b，628项复验一致；同69点69/69，原15未命中点15/15且重复已确认人数提议0；选店5/5、直接页13/13；原22校准22/22（正常S0声明20/20，交付子类8/8，0误判合格，越界9份无/13份缺口保持）。五门禁type/arch/build、默认977/977、真实Chromium129/129全绿。
- 全部74次API成功、0重试；翻月平均1.877s、961320输入/8535输出token，选店平均2.053s、95435输入/1361输出；reasoning0，批次墙钟140.104s。阶段账本2069→2143/4000、剩1857，完整Live7/100、环境重跑0/10不变。0网站/Google/Live，不实现URL路径。
- 37点正选中（34与请求一致、3不同），32点未观察到；独立来源核查69/69一致，未知不编造。69点历史/观察编号逐点一致，history/progress无改、显式历史targetRef0。选中状态/组投影/引用修正共同变化，非严格单字段因果试验，也不代表完整交付或泛化；历史H003 S0与上一轮54/69保持。
- [四层报告](../../.eval-artifacts/checkpoint-c-live-20261020/calendar-selected-state-20261021/four-layer-report.md)、[result.json](../../.eval-artifacts/checkpoint-c-live-20261020/calendar-selected-state-20261021/result.json)、[逐点表](../../.eval-artifacts/checkpoint-c-live-20261020/calendar-selected-state-20261021/decision-matrix.json)、[引用审计](../../.eval-artifacts/checkpoint-c-live-20261020/calendar-selected-state-20261021/reference-audit.json)和[冻结复验](../../.eval-artifacts/checkpoint-c-live-20261020/calendar-selected-state-20261021/post-verification.json)。既有门禁生成的区域输出另存本批次后原文件恢复，代码/输入/外层运行中无改。离线门槛通过、待复核，推本修复分支后停止。


## TEST-2026-10-21-CHECKPOINT-C-CONTINUOUS-STEP-1

- Evidence status: frozen regression, exposed development. Accepted review481b893 and 628 frozen-file SHAs independently rechecked; production/skills unchanged since8e47ddf. Calendar69/69, selection5/5, calibration22/22, all five gates PASS (977 default/129 Chromium). Reused existing unchanged evidence; new model/network/Live0.
- Freeze040dbdac7477e64b643aa6550c43a57b650473dae51365b143d90f1f3954876b; cumulative models2143/4000, fullLive7/100, environment reruns0/10. Historical H003 S0 retained. [Four-layer report](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-validation-20261021/step-1-report.md).


## TEST-2026-10-21-CHECKPOINT-C-CONTINUOUS-STEP-2

- Evidence status: current executable, exposed development. Accepted fix8589b3b merged/pushed integration; prep merge92beed0 preserves both histories. No production/skills/dependency delta from accepted gates,628 frozen inputs match. Existing outer, plan18, Runner, inputs, evaluator30/rubric26 unchanged.
- Cumulative ledger2143 models,7 Live,0 env reruns; source evidence now includes277+74+74 already-counted replay calls, totals unchanged. Existing global budget check PASS,1200 models reserved for18+6 possible retries. No new models/websites/Live. [Four-layer report](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-validation-20261021/step-2-report.md).


## TEST-2026-10-21-CHECKPOINT-C-QUICK-LIVE-ENTRY

- Evidence status: current executable plus frozen regression, exposed development. Steps1/2 PASS; original outer complete0-network/0-model rehearsal succeeds and553 freeze files reverified. SHA b1175e307a68e021e0e7744eda750b488d36f72f84038cbfb3ed04224c8b2273. No original outer/plan modification.
- Quick3 cannot be selected by current CLI (only18 or historical fixed-c03 resume); clarification requested before relaxing explicit immutable-outer constraint. No authorization consumed or Live started; steps3–5 NOT_REACHED. Cumulative2143 models,7 fullLive,0 env reruns unchanged; old H003 S0 retained. [Report](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-validation-20261021/four-layer-report.md).


## TEST-2026-10-21-CHECKPOINT-C-RUN-SELECTION

- Evidence status: current executable preparation, exposed development. User explicitly approved minimal --run-ids entry for c-01/c-02/c-05 only. Select original run objects in plan order; reject unknown/duplicate/empty IDs and resume combination. Default18 Live/default1 rehearsal/historical resume unchanged; no changes to Runner, plan, policies, evaluator or run budgets.
- Twenty offline controls PASS; full original outer scripted three-run/default verification follows committed freeze. New models/sites/Live0; cumulative2143/7/0 unchanged. Scope label and separate results keep quick samples outside checkpointC18. [Authorization](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-validation-20261021/run-selection-approval.md).

- Quick entry final verification PASS: original outer executed exactly c-01/c-02/c-05 in0-network/0-model mode, default rehearsal retained1 run and defaultLive18 unchanged;20 controls PASS. Final quick freeze5c4dd01e4d21afcc8a687066dbb1e2bd2cd8e8cfd683e404b26e9d292fbdd8f4,558 files verified. Cumulative2143 models/7 Live/0 env reruns;1857 model calls remain. Old witness window sufficient for quick3 before2026-10-21T12:26Z; user preapproval permits launch after push.

- Quick launch pre-run freeze check rejected changed documentation before authorization consumption, output directory or Runner start;0 models/sites/formalLive/env reruns. Rejection retained; refreeze final committed snapshot and verify all files before launch. Freeze record lives in continuous-validation-20261021/quick-final-freeze-receipt.json; do not mutate frozen documentation during quick batch.


## TEST-2026-10-21-CHECKPOINT-C-QUICK-VALIDATION-STOP

- Evidence status: exposed development Live Read-only, one diagnostic per case; not Clean Baseline. 快速验证未通过，按门槛停止：H001/神乐坂 CAPABILITY_MISS，H002 HONEST_NO_RESULT；QUALIFIED_DELIVERY 0/3（要求≥2/3），交付均为0，两项S0各3/3 ABSENT。三次47模型共141，Google含预检12，累计2284/4000模型、10/100完整Live、0/10正式环境重跑。快速三次不计检查点C18，原五次及H003 S0保留；第4步认证与新18次均NOT_REACHED。
- Original production/skills/plan/Runner/evaluator30/rubric26 unchanged; user-approved run selection20 controls and actual offline3+default1 passed. Existing production acceptance69/69,5/5,22/22 and five gates977/129 reused unchanged. Freeze225ca8b994308b999ab0a7156b0cbf3ff1b57466cb707a0c2e7d1669b8faac0d/559 files verified before and after runs, before documentation updates.
- Runner times278.382/280.614/482.445s; outer wall298.662/307.277/504.686s. c05 retains OUTER_DEADLINE plus exit0 and full result; @30 CAPABILITY_MISS not reclassified/retried. Independent post-reads8/8 HTTP200; gaps306.422/307.224s. Source-observed selection versus query-acceptance mismatch is a hypothesis, no new fix or extra calls.
- [Four-layer report](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-validation-20261021/quick-four-layer-report.md), [raw result index](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-validation-20261021/quick-result-manifest.json), [ledger](../../.eval-artifacts/checkpoint-c-live-20261020/continuous-validation-20261021/phase2-ledger-after-quick.json). Stop after push pending independent review.


## TEST-2026-10-22-GROUP-WINDOW-FIX

- Evidence status: draft / not integrated; exposed offline repair. Base17415d1c, review b180f30d. Partial source batches rotate behind other scheduled sources, retaining active/suspended cursors, pending entrances and candidates. Prohibited workflows return SOURCE_UNSUPPORTED before navigation and are not reopened for FACTS. Point-empty queries advance through at most four observed legal times; uncovered scope remains unknown. Disabled exact party ends UNKNOWN only after the requested date is selected.
- restaurant-state@20 / task definition18; Prompt, Browser action/context, Evaluator33/rubric29 and qualification unchanged. Valid before-fix scheduling assertions, installed-policy restriction red, and three real Chromium baseline failures are retained. Initial restriction Mock failure lacking INSTALLED is explicitly excluded as detection evidence.
- Five gates PASS: typecheck, arch:check, default1013/1013, build, Chromium136/136. Initial default failure was the old persisted-schema expectation19; updated to current20, original failure log retained. Browser-generated tracked fixture metrics are saved separately and historical bytes restored.
- 69 calendar and five selection inputs prepared: calendar differs only by the previously approved base timeoutMs10000 to30000; model messages/schema/observation/oracle identical. Selection requests byte-identical. Commit-freeze before cached response regression,22 calibration and six saved-run component replays; these final replays are not yet executed at this entry. New real models/websites/Google/Live0.
- [Plan](../../.eval-artifacts/group-window-fix-20261022/plan.md), [gates](../../.eval-artifacts/group-window-fix-20261022/gates/results.json).

- Frozen replay follow-up: code22fef57b passed five gates; cached69/69+5/5 and calibration22/22 (normal declarations20/20) passed with zero external calls. Six-run component driver stopped at c18 because it mixed recorder and global trace sequences. Original failure retained; only the eval-side mapping is corrected and newly frozen. Product/source inputs and scoring unchanged. No original snapshot/decision rewritten.

- Final source follow-up: retained even ended/capped source checkpoints (valid red-ended-checkpoint), and classified a completed point-empty observation UNKNOWN rather than provider failure (valid red-partial-observation). Chromium time-window controls now enter the same createLiveReadAssembly/Resolver/Guard as Live, with original80-operation/provider/run limits; positive and four-empty paths need no model transport, wrong-party negative uses one scripted help response. Final gates1013/136 PASS. Product code and all historical inputs remain frozen for a final zero-network component/cache/calibration replay.

- Delivery follow-up within prohibited-entry scope: even an initial candidate URL already prohibited by current policy now stops before acquiring a browser; identity remains unverified. Native FACTS checks the same initial boundary. Valid red-initial-entrance retained; final full five-gate rerun1014/136 PASS. Freeze the final unchanged-input offline replay before execution, then stop after report/push.

- Completed on frozen bd268ee0bf45e838f70235be6e34d4ae76b72d17: all five gates1014/136 PASS; final cached calendar69/69, selection5/5; current evaluator33 calibration22/22 and normal declaration20/20. Six saved-component rows complete: Tabelog first at scheduling boundary,24 prohibited paths early unsupported, five recorded bound-empty points retain unknown remainder, c18 disabled10 stops with zero new decision/action. Original219 model calls are historical reuse, new real model/site/Google/Live0. Missing Tabelog/Google response branches remain NOT_EVALUATED; no new full-task success, S0 clearance or efficiency claim. [Final report](../../.eval-artifacts/group-window-fix-20261022/report.md).

### 2026-10-23 Phase2c Live preparation

Reviewed mainline8487a844 merged into isolated holdout branch; product byte comparison remains identical. Witness gate5/6 with one approved exclusion, all fallback recorded; immutable source package preserved. Two queues (odd/even,90s stagger,max2) with independent artifact and ledger paths; remaining work becomes sequential on source/rate/resource signals. Eleven offline orchestration controls and the actual Runner entry with scripted transport pass,0 network/models. Evaluator33/rubric29 retained; capability evaluation deferred until wording review. Stage budget before run3796/5000 models,72/100 fullLive,3/10 environment reruns; reserve24 attempts/1200 calls. See `.eval-artifacts/phase2c-holdout/exit-live-20261023/plan-notes.md`. No new capability conclusion.
