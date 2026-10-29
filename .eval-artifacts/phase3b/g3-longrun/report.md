# G3 长批次：三组已验证；停在受保护 C 测试输入边界

## 2026-10-29 CET: C补丁获批，响应证据组完成，继续

用户明确授权的 C fixture 响应补丁已应用，仅这处输入变化，C逻辑/全部断言保留。[Group05报告](05-response-only-slots-days/report.md)：native2/Chromium1有效红→绿，五门禁1215/179及普通G2全绿、净树；DOM时段/日期class业务判定已退役，旧HARD结果一致，真实调用0。先前C授权停止已解除；继续核对Sen公开选中证据，然后G3c（除非触发停止条件）。下方较早记录以其时间为准。

## 最新同步：A 日历基线已合入本工作分支

2026-10-28T17:34:28.558006+01:00，Vienna CET。已同步用户批准的 main `8454fffa`，受测合并提交 `6c339ba7`，没有新增产品改动；A 三处文件原字节保留。五门禁全绿：默认1213/1213，Chromium178/178（111.821秒），普通G2 4/4，每项前后净树。普通G2逐页11 PASS/1诚实退化，Teppen已PASS，严格G2只剩Sen的requestConfirmed（命令3/4、exit1），未改该期望。共享账本469 id保留双方全部条目，累计171模型/242 GET/11 Google，本同步新增全部0。旧HARD44,197字节一致。

**仍停在 C 受保护测试输入补丁待用户授权，补丁未应用；不是等待 A 基线。** G3/G3c 尚未全部完成，不合 main。[本次完整同步报告](04-calendar-main-sync/report.md)。下方原记录以其各自时间和受测SHA为准。

2026-10-28T17:15:17.578185+01:00，Vienna CET（UTC+1）。Current evidence: OFFLINE_LOCAL_CHROMIUM / fixture model。**G3/G3c 未全部完成，不合 main。**

当前分支 `codex/feat-phase3b-tabelog-observed-availability`，main 基准 `ba466eb3`。用户日历证据决定已记入 ADR0048。B 没有等待 A：完成响应结构告警与精确绑定、公开列表/busy、原生控件失配后回到 Agent 观察三组，每组先有效红灯、后绿灯和五门禁、净树、推送后继续。原 A 输入阻点的历史报告保留在本文后半，不作为当前停止理由。

| 组 | 受测提交 | 有效红→绿 | 五门禁（默认 / Chromium） |
|---|---|---|---|
| [01 响应/结构告警](01-vacancy-responses/report.md) | da0546fb | native7 / Chromium1 | PASS 1210 / 176；107.281s |
| [02 列表/公开 busy](02-public-list-busy/report.md) | f6154ca3 | native3 / Chromium1 | PASS 1213 / 177；109.899s |
| [03 控件加速失配回退](03-observed-control-fallback/report.md) | 6bb5ba78 | Chromium1（含正常、人数冲突和最终控件值） | PASS 1213 / 178；119.580s |

每项门禁前后 git status 空，无恢复掩盖、排除、skip/cancel；各组冻结输入/外层脚本 SHA、红绿和原始日志分别保存。第二组曾有两轮门禁失败，均保留诊断：私有 fixture 前提同步，以及 DOM clone 引发重复图片请求；最终纯字符串观察并通过原请求次数断言。未修改 Guard。新增 State/TaskDefinition/Prompt 版本0。

严格 `PRAXIS_G2_REQUIRE_PASS=1` 已实际运行：Tabelog 两列表（Nerima20项、Akabane1项）及两详情均 PASS，首个剩余断言为日历 Teppen。整个命令仍3/4测试组，不能冒充 G3 全 PASS。A 的固定日期基线截至最后 fetch 尚未合 main。日期状态/共享选中状态/非英文 slot 私有依赖仍未全部退役；G3c 尚未实施。

## 当前停止点与具体待批补丁

继续移除非英文 slot 的私有 class 库存结论，会触及 C 受保护的片段检索正例。它只有 class 空位，没有数据响应。用户特定规则要求“保留 C 逻辑及其测试，需改动先报告”。[最小完整输入 diff](pending-c-fixture/fragment-response.patch) 只为这个本地构造页增加同店/日期/人数/时段一致的固定 find_vacancy 响应，C 代码和所有断言保持。**补丁未应用，授权问题待答复。** [依据与后续](pending-c-fixture/report.md)。这处归属边界是本次停止原因；没有因 A 基线待合而停止所有工作。

## 保留、范围与调用

C 实体解析、详情排序/片段逻辑和四个受保护测试仍原字节；未改 A 的 eval、固定 G2 fixture/基线/变异/评分。只按用户授权改写了被退役私有列表/busy前提对应的普通测试输入，完整清单见组02报告。没有删除核验或降低业务断言。

旧 HARD 完整 fixture 结果仍44,197字节，SHA-256 `9a3298bc5e004b99e41d80713e8913b68c336cfa594f6eb60599e310ee3fb633`。两站非测试生产 TS4,028、Pack478（仅参考，门槛已取消）；未把站点代码迁到 Pack/通用层充数。共享账本446个唯一 id，main441条保留原值，新增真实模型/Google/网站/Live/评测GET/环境重跑全部0，不读 .env 和私有 QA 答案。此轮仅 macOS，Linux 未自行复跑。

接下来需要：受保护 C fixture 输入批准后，继续 slot/日期/共享公开控件，接入 A 已批准基线后完成严格 G2，然后 G3c；TableCheck 查位仍按用户决定等首次 Live 保存页。没有合 main。各组工作分支推送回执随下一组/交付记录保存。

---

## 历史记录：原固定输入证据停止（已由用户日历决定解除）

# G3 长批次：重放完成，按固定验收输入边界停止

2026-10-28，Vienna CET（UTC+1）。Evidence status: offline source/input audit；**G3/G3c 实现未完成，不合 main**。

工作分支 codex/feat-phase3b-tabelog-observed-availability 已从原250cba72重放到最新main **ba466eb3eff89cc3f934bafc2134a39c4b6d84ed**，重放后可执行树与main逐字节相同。原browser-availability文件归属阻点已解除：该文件可由B修改；entity-resolver仍归C。C的详情排序、HTML实体解码、片段逻辑及4个受保护测试均保持原字节。[预检](preflight.json) / [C测试边界](c-protected-tests.json)。重放冲突只涉及历史和预算记录，main441条与旧G3条目按id并集，另加本批零调用，当前443唯一id，原main条目原值保留。

原用户长批次保存于 [CODEX-3B-B-G3-LONGRUN.md](CODEX-3B-B-G3-LONGRUN.md)，最新文件安排单独保留。按顺序计划日历/控件、时段/响应、列表/busy、套餐价格/事实；当前在首组实施前发现新的**固定输入证据阻点**，触发用户“需要改动A的文件时停止”。

## 已验证的具体问题

G2日历冻结基线要求：Teppen2026-09-29=PHONE_ONLY、09-28=FULL、09-30=CLOSED；Sen2026-10-01=FULL。当前这些状态由私有class区分。Teppen原页是保存的日历片段，无样式表；Sen链接的样式表在当前单文档本地回放中未提供。G2声明的额外样式只有隐藏未来月的visibility shim，没有日期状态样式。

使用真实Chromium、禁用页面脚本、全部请求拦截、同一G2 visibility shim做4项对照。只改各日期span的状态class，其他输入保持不变：

| 固定页/日期 | 原class解析值 | 仅换class后的解析值 | 可见文字/ARIA/样式/单元格像素 |
|---|---|---|---|
| tabelog-calendar-teppen/2026-09-29 | PHONE_ONLY | FULL | 完全相同 |
| tabelog-calendar-teppen/2026-09-28 | FULL | CLOSED | 完全相同 |
| tabelog-calendar-teppen/2026-09-30 | CLOSED | FULL | 完全相同 |
| tabelog-calendar-sen/2026-10-01 | FULL | CLOSED | 完全相同 |

全页可见文字和ARIA各自SHA、单元格截图SHA、原生/ARIA属性、计算样式及伪元素content均实际比较，不用生产状态判定器作这些观察的oracle。恢复原class后再执行A的冻结私有标记改名，变异integrity.valid=true，日历可见语义/像素不变，而原解析器返回UNOBSERVED。完整字段和摘要见 [calendar-observability.json](calendar-observability.json)。这些原解析值只用于证明class耦合，不作为餐厅真实状态或模型质量的真值。

例如Teppen09-30单元格可引用文字只有“30”；无CLOSED/FULL/电话状态的label、ARIA、原生状态或视觉差异。页面只有泛化的“No available seats for 2 guests”提示，不能把它绑定成任一具体日期的三种不同状态。Agent遵守“观察→逐字引用→代码核对”时，现有输入无法提供基线所需的日期状态引用。

**这不是当前网站能力结论，也未运行新的Live或真实模型；是固定验收输入缺少当前合同所需证据。** 实现若仍输出上述具体状态，就继续依赖私有class；若如实未知，当前G2又会按“不能抹掉原页已知事实”拒绝。不能在B分支把引用编出来，或自行删除这些冻结断言。

## 需要A/独立复核处理的范围

- src/harness/browser/fixtures/dom-change/tabelog-calendar-teppen.html.gz 及其原始保存页/来源依据；Sen保存页的同类问题。
- 固定manifest.json、baseline.json，以及必要的src/eval/restaurant/dom-change/run.ts本地回放输入接线。

建议A/复核者先检查能否从**已有**同次保存材料补齐带来源SHA的CSS、公开状态说明或原始响应，使Agent确实有可观察依据；现有材料无法支持的旧“已知事实”需独立复核并明确版本化调整，B不自行改Gold或放宽断言。新增语义必须绑定实际来源，不从待删除的class规则自行制造依据。修复固定输入或确认新基线后，B可继续同一长批次。这里需要处理的是A负责的固定验收输入/判定，不是B删除私有实现时可自行改写的普通单元测试。

按用户停止条件，发现此依赖后没有继续改产品代码或越过A的输入归属；没有把静态解析通过当作Agent真实任务完成。

## 当前门禁结果

正式受测提交 **bfb38d2c69224cd184de44242a54f35207fe02d0**，macOS26.6.2 arm64 / Node24.4.1。重放源码与main相同，首轮五门禁及普通G2全部绿：

| 检查 | 结果 | 数量/耗时 |
|---|---|---|
| typecheck | PASS | 5.964秒 |
| arch-check | PASS | 0.187秒 |
| npm-test | PASS | 1203/1203；27.318秒 |
| build | PASS | 0.414秒 |
| browser-fixture | PASS | 175/175；106.556秒 |
| dom-change | PASS | 4/4；20.885秒 |

每项前后git status --porcelain为空，restorations=0，无skip/cancel。685份源码/输入/指令/外层脚本先提交冻结，运行后SHA一致。[全部日志](verification/gates.json) / [冻结清单](input-freeze.json)。

`PRAXIS_G2_REQUIRE_PASS=1 npm run test:dom-change` 当前仍红：4检查3通过/1失败，20.994秒，首个断言为tabelog-list-nerima的“G3 requires PASS”。这是首个列表基线缺口；测试在该严格断言后没有继续逐页接受其它页，不能据此宣称日历通过。日历缺证另由上述4项独立观察对照确认。[严格记录](strict-g2/strict-g2.json)。此红灯尚未修复，不属于G3实现绿灯。

原诊断脚本的压缩/解压SHA口径和禁脚本环境的样式注入等待曾在准备阶段失败/中断，已纠正、重新提交冻结后完成4项对照；这些准备失败不算有效业务红灯。依赖按C锁文件从本机缓存离线npm ci --ignore-scripts补齐，无网络请求，package/lock未改。

## 各组状态、测试与私有依赖

| 组 | 状态 | 红绿及五门禁 |
|---|---|---|
| 0 重放/C边界/输入检查 | 完成，发现A输入阻点 | 重放基线五门禁全绿；观察对照4/4完成 |
| 1 日历日期/选中/人数控件 | 未实施，固定输入证据阻断 | 只有严格G2基线红灯；没有宣称实现红绿完成 |
| 2 时段/find_vacancy/结构告警 | 未达（按停止条件不继续） | 未实施/未验证 |
| 3 列表/busy | 未达 | 未实施/未验证 |
| 4 G3c套餐/价格/事实 | 未达 | 未实施；旧HARD输出未变化，无新增输出复核请求 |

见 [groups.json](groups.json)。本批没有删除私有逻辑，也没有删除/改写测试；用户清单的私有依赖仍保留，理由是尚未进入实现，不能报告已完成迁移。没有新增Prompt/Schema、State或TaskDefinition版本，没有改变身份/Guard/授权。C详情排序/片段/解码及其测试全部保留，src/scripts/web-skills/package/tsconfig相对main无差异。

旧HARD完整结果仍44,197字节，SHA-256 9a3298bc5e004b99e41d80713e8913b68c336cfa594f6eb60599e310ee3fb633逐字节一致。[HARD记录](hard-compatibility.json)。网站两目录当前 **3,911行**、source-packs.ts **478行**，与新main相同，**仅参考，不作门槛**。[行数](adapter-lines.json)。

## 预算、交付与停止

新增真实模型、Google、餐厅网站、Live、环境重跑、公开GET全0。未读取.env，未读取/哈希answers*.json。只推重放后的G3工作分支，不合main；使用原远端250cba72的精确force-with-lease，仅更新用户明确要求重放的B工作分支，不改其它分支。

STATUS、DEVLOG、TEST-LOG、月度摘要/索引同步。**按“需要改动A的文件”停止，等待A/复核者处理固定日历输入的公开证据及基线。** G3/G3c未完成。实际分支SHA和推送回执见delivery.json；报告提交后只追加审计回执，不改冻结配置。

## 已核对的交付回执

2026-10-28T16:09:52.019625+01:00：重放后的报告提交be6a940ae159aec3637fa976509629396b57ffdc已成功推送，使用精确旧租约250cba72，ls-remote匹配；main仍为ba466eb3，本批未合/推main。685份输入SHA及可执行树不变，追加回执前工作区干净。[delivery.json](delivery.json) / [原始refs](push-verified.refs)。这次回执仅审计产物，也推同一工作分支。


## 2026-10-28 CET: resumed / Group01 COMPLETE

The prior evidence stop is resolved by the user decision in ADR0048. [Group01 report](01-vacancy-responses/report.md): five gates and ordinary G2 PASS; new real calls0. Long batch continues with list/controls/G3c, no main merge.


## 2026-10-28 CET: Group02 COMPLETE

[Public list/busy report](02-public-list-busy/report.md): five gates/ordinary G2 PASS; strict lists now PASS, first remaining calendar failure preserved. Two diagnosed gate repairs retained, real calls0. Controls/G3c continue; C protected input approval pending, no main merge.
