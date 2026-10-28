# G2 日历日期证据基线修订

Evidence status: current executable / reviewer-approved exposed regression correction；非 Clean Baseline、非当前库存认证。2026-10-28，Europe/Vienna CET（UTC+1）。

## 批准与范围

复核人：**independent reviewer (Claude), 2026-10-28**；用户已批准。日期业务状态以同店、同次读取、对应日期/人数的站点数据响应为依据；私有 class 仅作导航提示；缺响应正文即 UNKNOWN。按本条授权直接合入 main 后通知 B，不等待新的行为口径批准。

从 main `ba466eb3eff89cc3f934bafc2134a39c4b6d84ed` 开 `codex/fix-phase3b-g2-calendar-response-baseline`。本批改 A 的 baseline.json、G2观察投影 run.ts 和现有 Harness 检查；产品、两站 parser/query-controls/availability、source-packs、Guard、Prompt/Schema/State均不变。分类器和 `dom-marker-mutation@2` 的原始字节不变。

## 同次保存证据核对

[逐项审计](evidence-audit.json)、[历史输入及SHA](historical-inputs-sha256.json)、[原基线](original-baseline.json)保留。固定Git blob均来自 main `ba466eb3`；G2压缩页与原保存HTML解压后SHA一致。

- **Teppen**：G2 HTML SHA `17ca46ffb9f8f6078fb354ef230095cc1ae0547b254566f9dabadbae51616854`，为2026-09-29保存日历转录。按其provenance定位的原次目录仍在；9份文件全量列名/hash，只有HTML、PNG和3份观察JSON，没有HAR/响应正文文件。`02-teppen-production-ready.json` SHA **`24507cf76afffe58771da24e98f348996fdd94d7f502b4e5edcb6da4b4f5191d`** 与旁置provenance相符，其traffic记有 `/en/booking/calendar/initial_vacancy` HTTP 200，但只保留type/url/status，没有返回体，不能绑定任一日期的状态。其余两份JSON也只有观察及traffic元数据。该SHA是**元数据SHA，不能冒充响应正文SHA**。
- **Sen**：G2原HTML SHA `65110e43e4f80255cad45acb3f92fe872b9990fa4200f75e124ef67ccdfe68f7`；同次文本投影SHA **`62d598de757df0075e3fb103de9090577563da8b5dc962678353ead95bb688cc`**，只有url/title/visibleText，无responses。provenance指向 `hybrid-1791616284408/snapshot-0025.html`；原工作树录制目录与主工作树同名录制目录现在都不存在。旧provenance中的available标记不能代替本次实际存在性核对。
- 固定Git归档内 **225份 `recording.json` / `.har`** 检查同次run标识、原HTML SHA字面量和HAR正文解码后的精确SHA，均未找到匹配。较晚/另一运行中同店同日期的响应不得挪用为此两页的同次证据。此为所查留存材料的缺口，不推断网站当时没有发请求或没有空位。

因此本批没有可绑定的原始空位响应，不制造响应fixture，不重新访问网站，不从class规则生成新期望。

## 逐日期旧值、新值与依据

| 保存页 / 日期 | 原期望 | 新期望 | 响应正文SHA / 依据 |
| --- | --- | --- | --- |
| Teppen 2026-09-28 | FULL | UNKNOWN | 无公开证据；仅有上述initial_vacancy 200元数据，无正文 |
| Teppen 2026-09-29 | PHONE_ONLY | UNKNOWN | 无公开证据；同次保存材料无可绑定该日期/2人的响应正文 |
| Teppen 2026-09-30 | CLOSED | UNKNOWN | 无公开证据；同次保存材料无可绑定该日期/2人的响应正文 |
| Sen 2026-10-01 | FULL | UNKNOWN | 无公开证据；HTML/文本投影无数据响应，原录制缺失 |
| Sen 2026-10-22 | SELECTABLE | UNKNOWN | 无公开证据；HTML/文本投影无数据响应，原录制缺失 |

机器期望以现有分类器约定的 **null** 表示UNKNOWN，未引入把字符串UNKNOWN视为“已知”的新口径。[逐日期变更](date-expectation-changes.json)附原值、批准与无证据说明。原报告不改，旧JSON原字节另存且有原SHA；本次纠正不反写历史结果。

## 最小接线与红绿

仅改JSON不足以落实新证据语义：原 A observer 会直接把旧 `tabelogRequestedDateState(snapshot,date)` 从class推出的状态放入事实。A现在对日期事实只向既有生产入口提供 **URL和已捕获responses**，不提供HTML/text；该通道无观察返回UNOBSERVED时记null。没有在评测层重写站点响应解析器、没有拼URL或字段。原始完整snapshot仍用于控件、请求确认和其他既有观察；B的生产日期业务判定和结构变化告警继续由B实施，本次投影修正不证明该产品工作已经完成。

复用现有G2测试，补强显式UNKNOWN期望对原页也必须未知的断言，并记录前后日期值。没有新增独立测试或删除旧断言。固定 `d477d691` 在旧观察投影上取得**有效红灯**：`tabelog-calendar-teppen day:2026-09-29` 实际PHONE_ONLY、期望null，16.379s；[red.json](red.json)与[原日志](red.log)留存。修正投影后同一断言在 `a6853be8` 17.827s通过，[green.json](green.json)保留。脚本早期一次Python源编码启动错误不是该红灯，不算来源或产品结果。

五个日期均应在原页/改名页为UNKNOWN，日期比较为PASS。整页结果须分开：

- Teppen：三个日期UNKNOWN→UNKNOWN，整页PASS。
- Sen：两个日期UNKNOWN→UNKNOWN，日期比较PASS；原有非日期 `requestConfirmed=true` 期望保持，改名后该查询控制仍丢失，因此整页仍 **DEGRADED_HONEST，lost仅requestConfirmed**，等待B控件组；不为把整页写PASS而删去这一项。B后续严格G2仍应消除此独立控制退化。
- 其余10个case的期望逐字节语义一致，12份保存页、manifest、变异规则和分类器SHA不变。列表Nerima/Akabane仍诚实退化，未签收G3。

## 验证、账本与交付

先提交并冻结 `green-inputs-sha256.json`，再运行五个标准门禁与普通 `npm run test:dom-change`，每项前后净树；收据在 `verification/`。最终源差异、逐日期原/改名状态、所有非日期事实/其他case不变由 `delivery-validation.json` 核对。额外严格G2本批NOT_RUN；普通G2及其余断言照旧，不通过改评分器、变异规则或抹掉其他事实过关。

本批真实模型/Google/网站/评测GET/Live/环境重跑新增全部0，不读取或暂存.env。共享账本按id并集导入另两工作分支中19条**此前已花**模型记账及审查0条目，原main441条不变；本批新增1条全0记账，463条目前共171模型/242GET/11Google/0Live/0环境重跑，未把旧花费改记为本批新调用。

四层口径：本批仅完成A的离线输入与证据投影修订；完整用户任务、当前来源连接/库存及S0声明为NOT_EVALUATED。环节上核对同次证据缺口并保留5个未知，无矛盾或未知升格；归因是旧基线/投影使用不可接受的class业务解释，不能归功为B的生产日历改造。用户批准后主线合入与通知B均以最终Git/消息回执为准。

### 最终标准验证收据

受测冻结 `9017a8cdff7056f89de71993228d5ed8ca369b08`。2026-10-28 CET。

| 命令 | 结果 | 墙钟 | 前/后工作区 |
| --- | --- | --- | --- |
| `npm run typecheck` | PASS | 0.429 s | clean / clean |
| `npm run arch:check` | PASS | 0.166 s | clean / clean |
| `npm test` | PASS（1203/1203） | 35.970 s | clean / clean |
| `npm run build` | PASS | 0.528 s | clean / clean |
| `npm run test:browser:fixture` | PASS（175/175） | 118.249 s | clean / clean |
| `npm run test:dom-change` | PASS（4/4） | 22.215 s | clean / clean |

十二次门禁前后净树检查及676项执行输入SHA核对均通过。普通G2日志实际记录五个日期before/after均null；Teppen整页PASS，Sen整页DEGRADED_HONEST且lost仅requestConfirmed。12页汇总9 PASS / 3 DEGRADED_HONEST / 0 FAIL；两份列表与Sen控制仍属B后续G3，未篡改为通过。[交付核对](delivery-validation.json)确认其他10个case和所有非日期事实不变，12页、manifest、评分器、变异字节不变；产品差异0，仅A的3个源/fixture文件改变。分支推送与main合入按用户本条已批准执行，Git实际回执决定发布状态。
