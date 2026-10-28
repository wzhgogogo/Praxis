# 开发Gold逐条更新清单（不改Gold）

Status: draft / not integrated；逐条等待用户确认。当前Gold4原文SHA：`96a3dbd7c406805e31586a0a6fb472b5bb2dd7458bd3187a3413c6ed2e5f8b66`，文件没有修改；旧Gold3保持。不能因为新旧Prompt都出现某个差异就把模型输出当新Gold。

15轮全部盘点，15项标签变更建议；另列应保持Gold、修正模型行为的query、否定文本与CONFIRM问题。确认后才生成Gold5并保留4，不回写旧评价。依据为ADR-0029 Decision（核心请求对象/类型、显式排除为HARD，明确可折中为SOFT）；当前Prompt的CRITERIA、STRENGTH、OPERATIONS、OUTPUT SHAPES；ADR-0026 Decision2及temporal-materialization.ts当前政策：AFTERNOON12–17、EVENING18–23、AFTER_WORK17:30–22。

| Turn | 字段 | 当前Gold | 建议 | 原因/依据 | 状态 |
| --- | --- | --- | --- | --- | --- |
| SR01-T01 | criteria[yakiniku].strength | "UNSPECIFIED" | "HARD" | ADR0029/Prompt STRENGTH | AWAITING_USER_CONFIRMATION |
| SR01-T02 | 无待改标签 | 保留 | 保留 | 无本次列明差异；原始诊断仍保留 | 不改 |
| SR02-T01 | 无待改标签 | 保留 | 保留 | 无本次列明差异；原始诊断仍保留 | 不改 |
| SR02-T02 | 无待改标签 | 保留 | 保留 | 无本次列明差异；原始诊断仍保留 | 不改 |
| SR03-T01 | 无待改标签 | 保留 | 保留 | 无本次列明差异；原始诊断仍保留 | 不改 |
| SR03-T02 | target.query | "Sushi Dai" | "Sushi Dai" | 见下方逐项说明 | KEEP_GOLD_FIX_SEMANTIC_PROPOSAL |
| SR04-T01 | criteria[Japanese food].strength | "UNSPECIFIED" | "HARD" | ADR0029/Prompt STRENGTH | AWAITING_USER_CONFIRMATION |
| SR05-T01 | timeWindow | {"earliest":"18:00","latest":"21:00"} | {"earliest":"18:00","latest":"23:00"} | ADR0026/时间物化政策 | AWAITING_USER_CONFIRMATION |
| SR05-T01 | criteria[smoking].text/polarity/strength | {"text":"smoking","polarity":"NEGATIVE","strength":"HARD"} | {"text":"smoking","polarity":"NEGATIVE","strength":"HARD"} | ADR0029/Prompt STRENGTH | KEEP_GOLD_REVIEW_MODEL_WORDING |
| SR06-T01 | timeWindow | {"earliest":"13:00","latest":"17:00"} | {"earliest":"12:00","latest":"17:00"} | ADR0026/时间物化政策 | AWAITING_USER_CONFIRMATION |
| SR07-T01 | criteria[Korean food].strength | "UNSPECIFIED" | "HARD" | ADR0029/Prompt STRENGTH | AWAITING_USER_CONFIRMATION |
| SR08-T01 | criteria[sushi].strength | "UNSPECIFIED" | "HARD" | ADR0029/Prompt STRENGTH | AWAITING_USER_CONFIRMATION |
| SR08-T01 | criteria[omakase].strength | "UNSPECIFIED" | "HARD" | ADR0029/Prompt STRENGTH | AWAITING_USER_CONFIRMATION |
| SR08-T01 | timeWindow | {"earliest":"18:00","latest":"21:00"} | {"earliest":"18:00","latest":"23:00"} | ADR0026/时间物化政策 | AWAITING_USER_CONFIRMATION |
| SR08-T02 | criteria[sushi].strength | "UNSPECIFIED" | "HARD" | ADR0029/Prompt STRENGTH | AWAITING_USER_CONFIRMATION |
| SR08-T02 | timeWindow | {"earliest":"18:00","latest":"21:00"} | {"earliest":"18:00","latest":"23:00"} | ADR0026/时间物化政策 | AWAITING_USER_CONFIRMATION |
| SR08-T02 | CRITERION CONFIRM model operation | "Gold expects omakase restriction removed and sushi retained" | "Keep that expected state; NEGATE the existing omakase restriction, omit unchanged sushi; do not accept collection CONFIRM or value-bearing CONFIRM." | 见下方逐项说明 | KEEP_GOLD_STATE_MODEL_CONTRACT_FIX_REQUIRES_REVIEW |
| SR09-T01 | criteria[Italian food].strength | "UNSPECIFIED" | "HARD" | ADR0029/Prompt STRENGTH | AWAITING_USER_CONFIRMATION |
| SR09-T01 | timeWindow | {"earliest":"19:00","latest":"22:00"} | {"earliest":"18:00","latest":"23:00"} | ADR0026/时间物化政策 | AWAITING_USER_CONFIRMATION |
| SR09-T02 | criteria[Italian food].strength | "UNSPECIFIED" | "HARD" | ADR0029/Prompt STRENGTH | AWAITING_USER_CONFIRMATION |
| SR09-T02 | timeWindow | {"earliest":"19:00","latest":"22:00"} | {"earliest":"18:00","latest":"23:00"} | ADR0026/时间物化政策 | AWAITING_USER_CONFIRMATION |
| SR10-T01 | timeWindow | {"earliest":"18:00","latest":"20:00"} | {"earliest":"17:30","latest":"22:00"} | ADR0026/时间物化政策 | AWAITING_USER_CONFIRMATION |

## 不可通过改Gold掩盖的三类问题

- SR03-T02：Gold4的AVAILABILITY已在3a获准；query仍应Sushi Dai。泛化query是模型提议丢名，不建议把Gold改成泛化推荐。修订与限制见具名目标报告。
- SR05-T01：smoking / NEGATIVE / HARD保持，quiet room / POSITIVE / SOFT保持。模型将text写成no smoking却继续NEGATIVE，可能双重否定，不能照抄进Gold。只建议把Friday evening的18–21按当前政策改18–23。
- SR08-T02：用户要求Drop omakase、keep sushi；当前Gold状态目标是删除omakase而保留sushi，不能改成无效提议后遗留的旧状态。当前Prompt只允许singleton CONFIRM且无value；CRITERION CONFIRM禁止。建议移除已有omakase条件、对未变sushi不重发，不放宽合同。sushi强度和继承的EVENING窗口变更分别等待确认。

## 逐条原话和完整差异

- **SR01-T01** 原话：Tomorrow between 19:00 and 19:30 in Shinjuku for two people, yakiniku under 5000 JPY per person.
  - `criteria[yakiniku].strength`：Core requested cuisine/type, or explicit exclusion for omakase; this follows accepted semantics rather than matching a model vote.
- **SR03-T02** 原话：Tomorrow between 19:00 and 19:30 for two people in Tsukiji.
  - `target.query`：Named outlet must survive supplemental time/party/area. Goal AVAILABILITY already approved in Gold4; generic model query is the defect.
- **SR04-T01** 原话：Tomorrow between 18:00 and 18:30 in Ginza for four people, Japanese food.
  - `criteria[Japanese food].strength`：Core requested cuisine/type, or explicit exclusion for omakase; this follows accepted semantics rather than matching a model vote.
- **SR05-T01** 原话：This Friday evening near our office for three colleagues and me; no smoking is essential, and a quiet room would be nice.
  - `timeWindow`：Align the frozen draft with the current documented code materialization. This is a query interpretation, not a user-stated exact time.
  - `criteria[smoking].text/polarity/strength`：Keep smoking / NEGATIVE / HARD. Model text no smoking with NEGATIVE risks inverting meaning; do not copy it into Gold. Quiet room stays SOFT.
- **SR06-T01** 原话：Tomorrow afternoon nearby for my parents and me. Around 3,000 yen per person would be ideal.
  - `timeWindow`：Align the frozen draft with the current documented code materialization. This is a query interpretation, not a user-stated exact time.
- **SR07-T01** 原话：In about 30 minutes near me for two people, Korean food.
  - `criteria[Korean food].strength`：Core requested cuisine/type, or explicit exclusion for omakase; this follows accepted semantics rather than matching a model vote.
- **SR08-T01** 原话：Tonight at dinner in Ginza for two. I need sushi, but not omakase.
  - `criteria[sushi].strength`：Core requested cuisine/type, or explicit exclusion for omakase; this follows accepted semantics rather than matching a model vote.
  - `criteria[omakase].strength`：Core requested cuisine/type, or explicit exclusion for omakase; this follows accepted semantics rather than matching a model vote.
  - `timeWindow`：Align the frozen draft with the current documented code materialization. This is a query interpretation, not a user-stated exact time.
- **SR08-T02** 原话：Drop the omakase restriction; keep sushi.
  - `criteria[sushi].strength`：Core requested cuisine/type, or explicit exclusion for omakase; this follows accepted semantics rather than matching a model vote.
  - `timeWindow`：Align the frozen draft with the current documented code materialization. This is a query interpretation, not a user-stated exact time.
  - `CRITERION CONFIRM model operation`：Invalid proposal is an execution/contract failure, not evidence to relabel Gold to the failed state. Any inherited sushi strength/window change needs its own confirmation above.
- **SR09-T01** 原话：This Saturday night near my hotel for two people, Italian food.
  - `criteria[Italian food].strength`：Core requested cuisine/type, or explicit exclusion for omakase; this follows accepted semantics rather than matching a model vote.
  - `timeWindow`：Align the frozen draft with the current documented code materialization. This is a query interpretation, not a user-stated exact time.
- **SR09-T02** 原话：Actually, use the area near our office instead.
  - `criteria[Italian food].strength`：Core requested cuisine/type, or explicit exclusion for omakase; this follows accepted semantics rather than matching a model vote.
  - `timeWindow`：Align the frozen draft with the current documented code materialization. This is a query interpretation, not a user-stated exact time.
- **SR10-T01** 原话：Tomorrow after work in Shinjuku for two. The 5,000 yen maximum is firm.
  - `timeWindow`：Align the frozen draft with the current documented code materialization. This is a query interpretation, not a user-stated exact time.

inventory.json按15轮逐项保存原话、旧/新建议、规则出处、原始非目标差异、未标注诊断、无效输出错误及v23单次控制位置。partySizeSource、原始表达、temporalResolution与未标注selectionScope的严格差异另留诊断；不是本批自动补标对象。相对“in about30 minutes”的目标仍灰区，3a接受的灰区3/3推荐观察不变成固定标签。未读取私有Holdout，没有更改Gold、scorer或开发Fixture。
