# G3 / G3c 完成报告：观察、响应证据、通用原文事实及原链接输出

2026-10-30T07:27:09.079582+01:00，维也纳 CET（UTC+1）。**OFFLINE_COMPLETE / WORK BRANCH / NOT MERGED TO MAIN，停下等复核。**

分支 `codex/feat-phase3b-tabelog-observed-availability`。最终统一门禁候选 **`d71316750cab29cadf3a4ef9b5423ead13f94903`**。已合入 A **`31398a77263902951475620a81824ab8150d2709`**（合并 `c0de163f`），再同步 main **`404a766e300668230d23c75ee7486bb3dc7a1d43`**（合并 `50d2761b`）。源码输出补丁 `3e6799f1`；本报告/日志/账本提交仅归档，不再改被测源码或冻结脚本。不合 main。

## 最终同一候选验收

| 检查 | 结果 | 秒 |
|---|---|---:|
| typecheck | PASS | 0.517 |
| arch:check | PASS | 0.234 |
| npm test | **1241/1241** | 29.334 |
| build | PASS | 0.499 |
| test:browser:fixture | **180/180**，G2独占后其余文件并发4 | 129.594 |
| PRAXIS_G2_REQUIRE_PASS=1 npm run test:dom-change | **5/5测试、12/12页面PASS，Tabelog6/6** | 24.078 |
| 原链接目标控制 | 11/11 | 0.193 |
| 固定旧条件输入 | 367组、481状态，仅批准变化1项 | 0.144 |
| 完整旧事实字节回归 | 44,197字节完全相同 | 0.146 |

九项执行各自前后 `git status --porcelain` 均为空；无恢复、跳过、取消或todo；718项冻结输入前后SHA一致。[门禁与命令](verification/gates.json)、[严格逐页结果](strict-pages.json)。浏览器仅本轮一次完整测量，129.594秒；不将单次称作三次中位数。macOS arm64；本批没有再跑Linux，不代替复核者的独立Linux结果。

## 逐组红绿与收敛

以下是各组当时冻结证据；最后全部由上表同一候选重新验收。此前停止/失败原始报告保留，不能把历史中间结果当当前结论。

| 组 / OBS | 有效红灯 → 绿灯 | 该组门禁及最终闭环 |
|---|---|---|
| [01 响应结构/精确绑定](../01-vacancy-responses/report.md)，18 | c96c7436：native7+Chromium1目标失败 → 同8控制通过 | da0546fb五门禁1210/176绿；未知形状告警SOURCE_STRUCTURE_CHANGED，错绑定UNKNOWN |
| [02 公开列表/busy](../02-public-list-busy/report.md)，19/21 | c330fbc3：native3+Chromium1失败 → 同4控制通过 | f6154ca3五门禁1213/177绿；链接文字和同卡片地址、公开busy范围 |
| [03 控件失配回到观察](../03-observed-control-fallback/report.md)，13/15/33 | 551e6dd0真实Chromium最终AVAILABLE失败 → 观察动作/精确Offer通过，错人数仍UNKNOWN | 6bb5ba78五门禁1213/178绿 |
| [05 时段与日期只从响应](../05-response-only-slots-days/report.md)，08/14/18 | bcc122d3：native2+Chromium1失败 → a84066c8同控制通过 | 2d29aead五门禁1215/179绿；class仅导航提示，无响应UNKNOWN |
| [08 公开选中状态](../08-public-selection/report.md)，08/09 | 41cec356失败 → 32a9d16c/12f5dd0d目标与对应控制通过 | 原Sen基线问题经用户决定、A main50a08361解决；11/12及本次严格12页PASS |
| [09 原文套餐/价格](../09-quoted-menu-prices/report.md)，22/23/29/30 | f5103dcc两站改名、182cb113/cb752bea完整条件/冻结反例失败 → 原生163/核心49/Chromium14通过 | c8ff6bf7暴露旧main报价人数错误而停；按用户新规则由11闭环 |
| [11/12 报价适用](../11-price-applicability/report.md)与A基线同步 | 请求2人、原文至少4人却MET红 → NOT_CHECKED绿；适用报价正反例保留 | dc337a7b五门禁1225/180绿、严格5测试/12页PASS |
| [13 公开信息字段/菜单范围](../13-public-fact-fields/report.md)，24/29/30/35/36 | a4006071两站改名、2eb7bafb范围/全局原文控制失败 → cbfdb210对应123通过 | a47b5ac6五门禁1225/180绿、严格12页PASS |
| [14 通用原文事实读取](../14-quoted-fact-reads/report.md)，22–24/29–30/35–36 | 4a7f8a31六目标失败 → 核心27/实际对应141通过 | 原13项A fixture失败经31398a77同步关闭；最终默认1241/浏览器180全绿 |
| [15 等时戳引用](../15-equal-timestamp-evidence/report.md) | 24e3e8e8领域/原H001失败 → 80797d48修复、相关49通过；冻结A原单例引用0/3→3/3 | 事件顺序沿既有Reducer因果替代，不用时间戳猜先后；本次完整链路绿 |
| 16 原form_course链接 | 3271f92c：11项中8绿、3个缺字段断言红 → 3e6799f1目标11/11、相关46/46绿 | 本次同候选目标11/11及全部门禁绿 |

诊断/同步组0、04、06、07、10、12的证据和用户决定保留于[全部组清单](../groups.json)。G1单句编号补丁已另行合main，本批保留。已知私有捷径退役后，事实动作必须由同店公开页面产生证据；没有恢复私有class业务结论，也没有降低身份、Guard、授权、预算或核验。

## 本批新增：form_course输出合同

`inspectTabelogVacancyResponse(snapshot, date, partySize)` 的 `OBSERVED` 为：

```ts
{
  status: "OBSERVED",
  availableSlots: string[],
  hasExplicitSlotUi: true,
  formCourseLinks: Array<{ time: string; url: string }>,
  sourceResponse: { sequence: number; url: string; observedAt: string }
}
```

`formCourseLinks[].url` **逐字等于选中响应的selection行原字符串**；不重建、不改参数顺序/大小写/百分号编码，原相对链接仍相对。按time稳定排序，同一时段的多个已核验行全部保留；`availableSlots`仍唯一排序。`sourceResponse`来自同一个最新已选响应，可按其sequence/URL/读取时间审计。调用者仍须另外验证当前查询与同店身份，不能把链接当作已经提交或套餐库存保证。本批只交付输出，C的B1接线另行实施。

现有请求URL、HTTP状态、body/selection结构、店号、人数、日期、时刻、origin/path规则**逐条不变**。任一不符照旧UNKNOWN或SOURCE_STRUCTURE_CHANGED，整项不返回链接；24点后不支持时钟照旧跳过。新增字段仅在成功分支收集，没改任何资格分支。[完整产品diff](audit/vacancy-output.diff)。库存包装器仍只暴露原slots/显式UI字段，原调用者输出不变。

红灯使用冻结输入/外层脚本：`3271f92c`，缺链接/来源字段的三处断言失败，原核验反例通过；不是启动或类型错误。[红灯](red/receipt.json)。绿灯 `3e6799f1` 覆盖array/object响应、最新sequence、相对/绝对原URL、参数顺序/编码；店号/人数/日期/时刻/协议/域名/路径反例不产生链接，形状变化仍changed。[绿灯](green/receipt.json)。原vacancy测试全文保留并追加控制；初始c6fb9e24草稿误覆盖在执行前已于3271f92c完整恢复，不作为测试证据。

## G3c原文链路及旧HARD对照

Native、官网共同组合以及两站读取页复用 `restaurant_source_facts` Prompt/Schema **2**：模型只选完整原文编号/角色/价格行编号；代码核对同店、本次页面、完整引用及范围后，从引用原文解析金额。保留人数、日期、餐别、税费和库存边界；私有价格/HARD快捷函数及OWST私有课程字段退役，不把站点代码搬到Pack充数。公开TableCheck菜单范围不会复制成全店事实。G1内部capturePagesOnly只复用绑定页面获取，不额外解释HARD；既有独立追问预算不变。

用户批准的报价限制由代码结合既有Intent核对：适用报价可以MET/NOT_MET；已知不适用排除；无法核对的条件不能单独支持MET。原报价及原文仍保留，不适用套餐不证明NOT_MET。

| 旧→新 | 请求与原文 | 原因 |
|---|---|---|
| **MET → NOT_CHECKED**，仅此1项 | 2026-08-05晚餐、2人、上限JPY8,000；“Seasonal dinner course: JPY 8,000, tax included; dinner only. Available only for parties of 4 or more.” | 明确至少4人，2人已知不适用；无其他适用报价，不能支持MET或NOT_MET |

367组/481状态（370 HARD、59 SOFT、52 UNSPECIFIED）其余480不变。[最终逐项状态对照](verification/legacy-state-changes.json)。17条来源变更（8份不同报价）的原文/原因见[旧来源逐项对照](../11-price-applicability/legacy-state-and-source-changes.json)及[字面限制依据](../11-price-applicability/literal-source-dispositions.json)，原始事实未删。

另一个完整旧事实回归 **44,197字节逐字节相同**，SHA-256 `9a3298bc5e004b99e41d80713e8913b68c336cfa594f6eb60599e310ee3fb633`。[最终字节检查](verification/hard-bytes.log)。两份回归分别证明其固定输入范围，不互相冒充，也不证明新Prompt真实模型选句质量。Agent29/Action5/Context17、State24、TaskDefinition22不变。

## 跨归属改动与测试维护

A合入来自用户批准的31398a77，以下五个文件，未改评分器、Gold、参考答案或迟到/取消/预算反例。[完整五文件diff](audit/A-five-files.diff)、[逐文件/保护块SHA](audit/cross-ownership.json)。

| A文件 | 同步内容与明确例外 |
|---|---|
| current-development-fixed-sources.ts | Source2按purpose返回本页完整statement编号；公开同店菜单/身份与有来源SHA的文字。同步main时仅get/has两处pax→num_people，保留A其余字节，[独立diff](audit/A-main-parameter.diff)。不能宣称该文件与A完全相同 |
| current-development-offline.test.ts | Source2分流不消耗Agent脚本；H001/explicit-two显式I动作（S→C→P改S→I→C→P）。**唯一旧计数断言0→3 Google Details**，记录新增调查三家实际调用；业务结果/限额不放宽 |
| fixed-source-case-execution.test.ts | 正常控制增加I，原semantic-started截止、迟到、取消、预算控制保留 |
| native-discovery-composition.test.ts | Source2 purpose分流、真实保存页支持的公开课程原文；未给identity guide补造菜单 |
| browser-read-request-binding.test.ts | 经用户批准，旧“Verified HARD criterion from source: omakase”文案断言替换为当前已接纳判断、同店/同页/本次Source2引用、身份绑定、Agent context；AVAILABLE/UNAVAILABLE等其余断言保留，新增替代后不留旧判断控制 |

第五文件行为控制由A提供：丢弃已接纳判断时0/2红，旧判断消费时1/2红，正常2/2绿。AVAILABLE实际S→C→I→P；UNAVAILABLE实际S→I→C→S→S→END。旧字符串之后全部6,641字节保留（SHA `d0e552b63415b740d484b702bf0f897ba244db0e2adb5ee8a8925b58f4d76d97`）。[A独立维护报告](../../g3c-eval-fixtures/behavior-assertions/report.md)、[A原13项同步和来源SHA](../../g3c-eval-fixtures/resumed-sync/report.md)。

main已接受的C B1/num_people、Web/持久化及PostgreSQL迁移0010随本次main同步继承，未由B另行修改。完整来源路径另列[main继承清单](audit/inherited-main-sources.json)；不把main既有改动算成本批跨归属实现。

C仅一处授权测试输入：`tabelog-browser-availability.test.ts` 的Google-name片段正例添加固定同店/日期/人数/时段find_vacancy响应，[完整diff](audit/C-fragment-input.diff)。C五个保护文件原SHA不变，四测试块仅该一处输入差异，全部断言保留；详情排序、片段、身份逻辑未改。

B退役私有逻辑时的对应测试逐项在01/02/03/05/08/13/14/15报告维护清单：列表/地址与busy改公开结构；日期/slot私有class正例改绑定响应、无响应UNKNOWN；共享选中改ARIA/原生值/响应；价格保存片段接模型编号→代码金额，同四份来源和独立金额/税/URL期望；featured-menu私有class自动产HARD的实现断言退役，保留库存/身份并由真实事实组合证明正向能力；等时戳负例改真实Reducer事件，原业务断言保留。未删核验或把AVAILABLE/UNAVAILABLE改为UNKNOWN求绿。其余测试审查仍归A。

## 旧provider criterion路径审计与保留依赖

`groundProviderAvailability`仍有两站生产调用者（Adapter→source-packs→两站ground wrapper），继续负责身份/库存/价格/引用，**整个函数不是死代码**。但其输入 `observation.verifiedHardCriteria` 已无两站非空生产者：仅剩可选类型、条件透传及map旧matchReasons分支；当前map为空，不能再用旧文案证明HARD已核实。[审计](audit/legacy-provider-criteria.json)。后续清理应同步删除这组失用字段/透传/文案投影和对应旧直接构造测试，保留Google与Source2 MODEL_JUDGMENT的合法criterion claims，本批不扩范围。

| 仍保留的私有依赖 | 理由和边界 |
|---|---|
| Tabelog已知CSS/data控件及日历格子提示 | 观察/导航或加速，失配回公开label、ARIA、原生值；不以class证明满席/电话/休息/选中或slot库存 |
| 两站详情身份字段（OBS20/31），C检索/排序/片段 | C负责，原保护文件/块不变，身份安全核对不放宽 |
| TableCheck查位/结果容器/busy/日历（OBS25/26/27/34） | **G3b延期**，需第一次Live保存真实有时段日历后再改；本批未伪造样本 |
| 无公开标记的评论区 | 现有公开标题/ARIA/链接识别和拒引仍生效；不能保证识别任意无标记评论，ADR残余风险保留 |

网站适配器物理行数仅参考：G3起点ba466eb3 **3911**，同步main404a **3914**，候选 **3900**；`source-packs.ts`起点/main **478**、候选 **482**（+4为模型依赖接线，无站点业务迁移）。[统一脚本与逐文件SHA](audit/adapter-lines.json)。按用户决定不以3591为验收，不为凑行数移动代码。

## 评价边界、冻结及账本

本轮服务“G3离线机制/真实产品组合是否可交复核”，不是Live签收。四层分开：端到端为受控fixture模型+真实Router/Reducer/Chromium路径通过；逐环节按固定同店/引用/日期人数响应及G2公开事实断言；严重程度未发现本轮新增S0，但**Live声明与网络独立S0为NOT_EVALUATED**（无当前网站复查，不填0）；历史已发现报价适用S0反例按用户规则关闭，等时戳缺引用按因果修复；归因为旧私有捷径、A fixture用途接线及旧文案断言，未变成放宽核验。A保存的独立REQUIRED_EVIDENCE反例从未满足→满足；不能从门禁绿推导真实模型质量或当前库存。

固定G2/保存页均已暴露开发回归，不是Clean Holdout。Mock/本地构造Chromium、固定保存页回归、历史合成原始执行/独立评价分开保留；本批没有新增真实来源Replay、真实模型或Live。

红灯冻结708项SHA `3011cfdedab499795c03b71c353e89e36d31b8cc36591081aee76a1dca08010c`，绿灯708项SHA `10eae1f7613244e08bd975d022f6518206196ac0bddc8dc231e7d8e5dba026a7`；最终718项冻结SHA **`3a3e5ec02817497e5c5f594c96ea23a2ce3f64603adbe740972b18b6bd6d9657`**，最终外层脚本SHA **`3055328d75885785a4af09544dbaf06c385ad8b7930d53944336eed64bcd747e`**，均先提交后运行。[冻结](input-freeze-gates.json)。报告归档后再次核对冻结字节与净树。

账本按id并集合并保留原484条，追加本批0调用为485条，无覆盖。新增真实模型/Google/餐厅网站/Live/公开GET/环境重跑全部 **0**；累计账本仍171模型、244公开GET、11 Google、0 fullLive，属于之前各对话的独立条目，不是本批消耗。[账本追加凭据](ledger-append.json)。未读取.env或QA answers文件。

待办仅为本批复核、C消费新链接输出、失用旧provider字段后续清理、G3b真实TableCheck日历及后续真实模型/Live验证。推工作分支后按用户授权通知C分支/提交/接口，随后停止；main发布需复核批准。
