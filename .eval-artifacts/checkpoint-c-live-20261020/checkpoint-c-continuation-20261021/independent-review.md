# 检查点 C（18 次）：独立复核

复核对象：`codex/chore-checkpoint-c-prep` @ `1910fdfb`。复核时间：2026-10-22 10:50 北京（Vienna 04:50）。

## 总体

- **18/18 正式运行完成；13 次有交付；S0-越界 18/18 ABSENT；S0-声明没有 PRESENT。**
- H001 3/3 QUALIFIED_DELIVERY，满足退出条件 1 的单例要求。
- 12 次 NOT_EVALUATED 分三类，复核者逐次查看了 `criterionCorrespondence` 和 `pendingCriterionWordings`：

| 类别 | 运行 | 原因 |
| --- | --- | --- |
| A 条件措辞未对应 | 神乐坂 c-05/09/13，吉祥寺 c-06/10/14，H002 c-02/12/16（9 次） | 系统措辞与 Gold 措辞不同，@31 不使用同义词表，未对应即整体不评 |
| B 无交付且无可用的原因判定 | H003 c-04、c-08 | 10 人、时间窗；"无见证即不能判 CAPABILITY_MISS" |
| C 独立复查网络失败 | H005 c-17 | 13292459 的运行后独立 GET 出现 TypeError（无 HTTP 状态），独立支持缺失 |

## 复核者对 A 类条件对应的人工判定

逐对核对了用户原文（variants.yaml）。以下对应在**极性和强度都与 Gold 一致**时成立：

| Gold | 系统措辞 | 判定 | 依据 |
| --- | --- | --- | --- |
| kaiseki（POSITIVE HARD） | kaiseki restaurant | 等价 | 只多了类别词 restaurant |
| tempura（POSITIVE HARD） | tempura restaurant | 等价 | 同上 |
| good for a first date（POSITIVE UNSPECIFIED） | first date restaurant | 等价 | 用户原文 "a first-date restaurant" |
| Sichuan/Hunan cuisine（NEGATIVE HARD） | sichuan hunan style cuisine where spicy food is the main focus | 等价 | 用户原文为 "no Sichuan/Hunan-style cuisine where spicy food is the main focus"；Gold 的 acceptance 也写明"不是禁止所有辣菜"。系统措辞比 Gold 文本更贴近原文 |

`pendingCriterionWordings` 中的交叉配对（例如 "good for a first date" 对 "sichuan hunan …"）**不成立**。

这些判定只对本次 9 份产物有效：按产物 SHA 和条件编号写入既有的 `artifact-criterion-correspondence@1` 登记，引用本文件。不作为通用同义词规则。

## 产品问题（不是评测问题）

- **价格未显示（MISSED_KNOWN_CONDITION 3 条，H002）**：独立判为满足"约 10,000 日元/人"，展示却为 NOT_CHECKED。
- **S1_UNSUPPORTED 11 条**：大多数应由 @32 的课程证据和展示修复分支（`4fcf7702`）解决，需要用回放确认。

## 下一步

1. **重评（离线）**：写入上述对应 → 用 @31 + 对应重评 18 次；为本次产物准备 hard-evidence 清单（只含本次认证的见证原句，按产物 SHA 绑定），用 @32 + 对应重评；三套结果并列报告，退出条件按 @32 判断，原评价不覆盖。
2. **合入展示修复**，用 C18 产物做 Router → Reducer 展示回放，用 @32 评价回放后的展示，逐条报告 S1_UNSUPPORTED 和 MISSED_KNOWN_CONDITION 的变化。价格未显示若未被展示修复解决，查明原因并修复。
3. **以后的流程**：评价前先由实现者抽出未对应的条件措辞（不附结果），复核者判定后再评价。这样措辞判定不会受结果影响；留出集也按这个流程。
