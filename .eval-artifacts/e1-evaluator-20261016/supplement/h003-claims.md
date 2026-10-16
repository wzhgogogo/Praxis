# H003 展示声明核对（2026-10-16）

状态：exposed development evidence；离线复核，不是模型新运行。核对先于人工标签比对，未读取 `labels.yaml`。

## KF-H003 重跑：`p1fA-kf-h003-a2`

冻结 result SHA-256：`ba5c5e8385aa6c7c213310cff9528fe667b5cacf1cbe4dfadccaf4e4a9fb8c2b`。

`trajectories[10]`，step 11，`PRESENT_RESULTS` 的 `decisionSummary` 原文：

> Three candidates have fresh evidenced availability for 2026-10-23, party of 10, within 17:30-22:00; present the eligible batch of 3.

实际展示候选：`tablecheck:alaska-asahi`、`tablecheck:aloft-tokyo-ginza`、`tablecheck:amajoh`。

## P1-G H003：`p1g-h003-a2`

冻结 result SHA-256：`eddb78a2e46ad81867d500f99ecb7bd801b0305e0b85eee76dfc005825224714`。

`trajectories[9]`，step 10，`PRESENT_RESULTS` 的 `decisionSummary` 原文：

> Default batch delivery window is open; only tablecheck:aloft-tokyo-ginza has fresh evidenced availability (Fri 2026-10-16, 17:30-21:00, party of 10, request mode). Present it now; other candidates remain unknown.

实际展示候选：`tablecheck:aloft-tokyo-ginza`。

## 结论与边界

两份 result 的全部 Agent decisionSummary、展示动作和 `presentedResults` 均已核对。没有声称符合预算或有包间；早期摘要提到需要调查这些资料，并非声称满足。`presentedResults` 只保存候选、引用与时间，没有另存用户自由文本答复。两份原始决策 capture 的字节 SHA 均与 result 一致（分别为 `1724340ffb90cd970dcba2a25410c6485c1cab3cdf03f89644dfdcfefded6972`、`fe5f2f9f6b73b0c42050875c9d4dc3e22a547887a1aeaa9f05935853adb2d78d`）；各自第 47 行的 `PRESENT_RESULTS` 原始 outputText 也已核对，除上述摘要外，question/retrievalHint 等自由文本字段皆空。不能把未存的其他 UI 内容视为已核验。

因此目前未触发补充指令的 S0 候选停工条件；这不等于预算或包间满足，也不等于全维度无 S0。

## 当前补充切片与停止点

| 主要失败类型 | 主测试入口 | 检错证据要求 | 未覆盖边界 |
| --- | --- | --- | --- |
| 人工表已就绪但加载器仍读旧字段／接受坏输入 | `diagnostic-evaluator.test.ts`，真实表＋测试专用小表 | 旧加载器拒绝真实表；新加载器通过，未知键/null/冲突仍拒绝 | 未审核自由同义表达 |
| 展示了预算不符的店仍算合格，或遗漏 SOFT/未分级条件 | 同入口，真实 h003/h002 产物经真实 Evaluator | 未接 R2 时失败；接 Gold 后冲突与正常对照分离，缺证为 NOT_CHECKED | 未定数值预算容差、自由语义理解 |
| 环境延误／系统缺陷被包装成普通无结果 | 同入口，实际运行／外层记录与独立副本 | R5/R6 仅由记录推导；改变 ID 不改变判断，删除原因依据不得仍通过 | 未保留的外层记录 |
| 以人工标签作为自动答案 | 既有共享 artifact 入口→独立校准比对 | Evaluator 不读 labels；最终冻结输出后才比对 | 开发集不证明泛化 |

完成点：补充规则接通现有共享入口，目标反例与对照、适用四条门禁及 22 次逐项校准均有证据；若触发明确停工条件则报告，不改标签或生产策略，不新增 Live。
