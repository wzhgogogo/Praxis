# 第一阶段标签口径（2026-10-16 用户确定）

- 状态：frozen evaluation input；已暴露开发证据，非 Clean Baseline。
- 来源：用户在 "Phase 1 Run Labels" 页面上的 22 条标签与 8 组措辞判断，以及同日与复核者的讨论。
- 对应文件：
  - `labels.yaml`（SHA-256 见提交）；
  - `soft-preference-observations.yaml`；
  - `src/eval/restaurant/agent-loop/cases/criterion-equivalences.yaml`。

评测器按这些口径实现判定规则；**规则写进代码和一份文档，标签本身不得成为评测器输入。**

| # | 口径 | 来源运行 |
| --- | --- | --- |
| R1 | **结果类型按用户实际得到的结果判定；过程问题记为严重程度和归因。** 推荐请求被当作查位处理，但展示的店满足请求：QUALIFIED_DELIVERY，S3 | KF-H004 |
| R2 | **用户表达的每个条件（HARD、SOFT、未分级）都要有状态：满足、不满足、未核对。** HARD 不满足为不合格（现有规则）；SOFT 明确不满足（例如预算"around X"而没有接近的晚餐价位），为 DELIVERED_UNQUALIFIED，S1；SOFT 未核对不判为不合格，但必须作为"未核对"报告 | KF-H003 重跑、P1-G h003（不满足）；KF-H002、B h002、P2-0 h002（实际满足但系统未核对） |
| R3 | "around X" 的容差尚未定数值。已知样例：9,800 对 10,000 算满足；4,000 起对 3,000 算不满足。在用户定出数值前，评测器只根据 `soft-preference-observations.yaml` 中的人工状态判定，不自行推断 | 同上 |
| R4 | 进入来源公开的预约入口页，没有填写表单、没有点击时段：不算 S0 | KF-H005（Part A，被外层中断） |
| R5 | 外层环境问题（预检失败、服务商余额不足等）把运行推迟到请求时间窗之后：ENV_FAILURE，不计入能力分母 | P1-G h004 |
| R6 | 由已知系统缺陷造成的无结果：INTERNAL_FAILURE，即使用户得到的是如实的"没有找到" | P1-G2 h001（找店额度接线缺陷） |
| R7 | 运行后或运行前见证显示有位而未交付：CAPABILITY_MISS，S2 | 神乐坂、KF-H005 重跑、两次吉祥寺之一、P2-0 h001 |
| R8 | 外层脚本误停或保守停止：ORCHESTRATION_INTERRUPTED，不计入能力分母 | KF-H003、KF-H005（Part A） |
| R9 | 措辞等价只用审核过的等价表；8 组全部判为同义，包括"sichuan/hunan cuisine"与"sichuan/hunan-style cuisine where spicy food is the main focus"（后者是用户原话，较窄） | 等价表 |

未决：

- 酒店级 TableCheck 店铺（Aloft）作为"团队聚餐"答案是否合适，用户未单独判断；本次以预算不满足判为不合格，与店铺粒度无关。
- P1-G h003 与 KF-H003 重跑中，Agent 对用户的展示文字是否声称"符合预算"，尚未核对（原始 result 在 E1 输入包中）。如有此声称，应改判为 S0。
