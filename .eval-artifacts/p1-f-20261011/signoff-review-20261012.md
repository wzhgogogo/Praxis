# P1-F 签收复核

- 复核时间：2026-10-12 15:30 东京
- 复核者：独立复核（Claude），非实现者
- 范围：P1-F 全部正式运行，包括：
  - A 部分 8 例：已知可行 5 例、新地点 3 例；
  - B 部分 5 例：原版实时；
  - 冻结生产 `73bfca5`，外层 execute 最终 SHA `ff567ad8…`。
- 依据：
  - Playbook 1.6 §10 的六项退出条件与签收归类口径（§2 第 20 条）；
  - `part-a-report.md`、`part-b-report.md`；
  - 原始 result、录制 DOM 快照、见证 GET 与交付后 GET 原始响应。
- 证据状态：开发集已暴露，非 Clean Baseline。

## 结论

**第一阶段暂不签收。**

- 条件 1（能力）、3（安全）、5、6 满足。
- 条件 2（泛化）和条件 4（诚实处理）不满足。
- 未满足的原因中，有两项属于第一阶段范围，都是通用缺陷，改动小。按 §10，不能记为"能力目标转入第二阶段"。
- 另有 B h003、h004 两次是无效样本：模型服务商余额不足，返回 HTTP 402。

## 逐例归类

### 已知可行（A 部分，变体 rev2，见证有效期内）

| 用例 | 自动评价 | 复核归类 | 交付 | 依据 |
| --- | --- | --- | --- | --- |
| KF-H001 涩谷 omakase 10/20 19:00 ×2 | YES | **QUALIFIED_DELIVERY** | 3 家：Sen、Matsumoto、Sushi Tokyo Ten | Sen、Matsumoto：运行后约 2 秒发了 GET，响应中有 19:00。Sushi Tokyo Ten：DOM 快照 #42–43 显示 10/20、2 人，时段列表中有 7:00 PM（见下文"FALSE_CLAIM 核验"）。 |
| KF-H002 东银座 初次约会 10/24 18:30 ×2 | UNKNOWN（措辞） | **QUALIFIED_DELIVERY** | 1 家：Ginza Sushi Sendou，390 m | 4 条条件与 rev2 逐条等价（"suitable for a first date" = "good for a first date"；其余原文一致）。required_claims：距离 ≤1 km、2 人是推断、寿司店不属于火锅或川湘菜，全部满足。DOM 快照 #22–23 显示 10/24、2 人、6:30 PM。 |
| KF-H003 附近 团建 10/23 下班后 ×10 | UNKNOWN（措辞） | **QUALIFIED_DELIVERY** | 3 家：Restaurant Alaska 841 m、Aloft by Marriott Ginza 150 m、Amajoh 943 m（均来自 TableCheck） | 4 条条件逐条等价，仅顺序与措辞不同。距离均 ≤1 km，日期与 10 人保留；evaluator 的 TableCheck 原始 trace 核对为 SATISFIED，时段在 17:30–22:00 内。注：Aloft 是酒店的 TableCheck 店铺，"门店"粒度偏粗，记入第二阶段。 |
| KF-H004 附近 咖啡馆 10/19 下午 | NO | **QUALIFIED_DELIVERY（附说明）** | 1 家：Noa Cafe Ginza，188 m | 按第 20 条核对 required_claims：咖啡馆 ✓（页面类别 Cafe/Kissa）、≤1 km ✓、10/19 14:00–17:00 有位，可以证明营业 ✓。DOM 快照 #63–64 显示 10/19、2 人、2:00–7:00 PM。自动评价为 NO 的原因：Agent 把 RECOMMENDATION 改成了 AVAILABILITY，并推断为 2 人。偏差记入第二阶段。 |
| KF-H005 附近 local food 10/22 18:00 ×4 | — | **CAPABILITY_MISS** | 0 | 见证店 Iwai、Fukumimi 在运行后 38 秒的 GET 中都有 18:00 ×4。第一卡点：Tabelog 用 "local food" 关键词搜全东京（`rstLst/?sw=local+food`），结果没落到地区，返回 `DISCOVERY_SOURCE_LOCATION_UNGROUNDED`；TableCheck 找到 6 家，查位均无合格结果。主因归为 `RETRIEVAL_TERMS`（第二阶段第一项，§2 第 14 条），`REGION_BINDING` 为次因。 |

**条件 1：4/5，含 KF-H001，满足。** 唯一未交付的 KF-H005，主卡点属于第二阶段。复核者的判断有一处可以商榷：没走地区入口这一点也算 P1-D 的标签。如果用户认为应以它为第一卡点，条件 1 的附加句不满足。

### 新地点（A 部分）

| 用例 | 自动评价 | 复核归类 | 依据 |
| --- | --- | --- | --- |
| 中目黑 烤肉 10/23 19:00 ×4 | YES | **QUALIFIED_DELIVERY** | Kintan（TableCheck），6 项全部 SATISFIED。 |
| 神乐坂 怀石 10/22 19:30 ×3 | NO | **CAPABILITY_MISS** | 3 家见证店运行后都有 19:30 ×3。Tabelog 先搜全东京，再进新宿区（C13104，地区选对了），但关键词是 "kaiseki restaurant"，两次都是 0 家（EXTRACTION_FAILED）。随后 Google 返回 40 家，查位时预算已被交付保留量占用。主因 `RETRIEVAL_TERMS`，属第二阶段。 |
| 吉祥寺 天妇罗 10/20 18:00 ×2 | — | **INTERNAL_FAILURE（第一阶段缺陷）** | Google 返回唯一且明确的结果："Kichijōji, Musashino, Tokyo"，`colloquial_area`，坐标 35.704, 139.580。地点解析（`b89e22f`）的名称或类型匹配没认出它：长音符号 ō 与 o 不等价，`colloquial_area` 也不在接受的类型中。结果报 `GOOGLE_LOCATION_UNRESOLVED`，0 次浏览器操作。3 家见证店运行后都有 18:00 ×2。 |

**条件 2：1/3，不满足。** 吉祥寺属于第一阶段范围，P1-F 准备批本身引入的地点解析缺陷，所以不适用"转入第二阶段"。

### 原版实时（B 部分，Gold@7）

运行时间：h001–h004 为东京 10/12 05:51–06:03，经用户批准提前；h005 为 11:46。"今晚""本周六""今天下午"在 06:00 运行时仍然成立，样本有效。

| 用例 | 复核归类 | 依据 |
| --- | --- | --- |
| h001 涩谷 omakase 今晚 19:00 ×2 | **INTERNAL_FAILURE** | Agent 在 `AVAILABILITY_ALREADY_CHECKED` 被拒后再次提出同一动作，循环以 `REJECTION_LIMIT` 终止，运行 FAILED，用户没有得到任何答复。这是第一阶段范围的通用缺陷，有两层：①C4 重复拦截没有让模型改正；②被拒次数达到上限时，应当以带原因的诚实结果结束，而不是 FAILED。同类拒绝在 KF-H005 #7、#9 和神乐坂 #5 中也出现过，那两次未到上限。 |
| h002 东银座 本周六 18:30 ×2 | **QUALIFIED_DELIVERY** | Ginza Sushi Sendou，390 m；交付后 GET 返回的 selection 中有 18:30。 |
| h003 附近 今晚 ×10 | **无效样本** | 最后一次 Agent 调用返回 DeepSeek HTTP 402（余额不足）。 |
| h004 附近 今天下午 咖啡馆 | **无效样本** | 第一次语义调用即返回 402，0.7 秒结束。 |
| h005 附近 现在 ×4 | **HONEST_NO_RESULT** | 运行 SUCCEEDED，结果为 NO_VERIFIED_RESULT：47 次调用后如实说明没有查到，没有交付。原版用例没有见证，不能判断附近当时是否确实有位。 |

**条件 4：不满足。** h001 为 INTERNAL_FAILURE；h003、h004 无有效结论。

关于 402 的归类：服务商余额不足与产品能力无关，复核者把它视同环境失败。Codex 认为它不符合已批准的"环境重跑"定义，所以没有重跑。这一点需要用户决定（见末尾）。

## 条件 3：FALSE_CLAIM 核验

本阶段共交付 10 家次（含重复店）：Tabelog 6 家次，TableCheck 4 家次。逐家核对，**0 例错误展示，满足。**

**Tabelog（P0-1 要求独立核验）：**

| 门店 | 展示内容 | 独立证据 |
| --- | --- | --- |
| Sen 13275802 | 10/20 19:00 ×2 | 运行后 GET（A 部分 h001 witness-raw），selection 中有 19:00 |
| Matsumoto 13261619 | 10/20 19:00 ×2 | 同上 |
| Sushi Tokyo Ten 13225919 | 10/20 19:00 ×2 | 录制 hybrid-1791706452130 快照 #42–43：日历当前日 10/20，人数按钮 2 为激活，时段列表中有 7:00 PM |
| Ginza Sushi Sendou 13295658（KF-H002） | 10/24 18:30 ×2 | 录制 hybrid-1791706608749 快照 #22–23：10/24、2 人，时段列表中有 6:30 PM |
| Noa Cafe Ginza 13002704 | 10/19 14:00–17:00 ×2 | 录制 hybrid-1791706954502 快照 #63–64：10/19、2 人，时段 2:00–7:00 PM 包含全部 13 个展示时段 |
| Ginza Sushi Sendou（B h002） | 10/17 18:30 ×2 | 交付后 GET，selection 中有 18:30 |

用 DOM 快照核验时，要先确认 Tabelog 日历的时段列表随空位变化，而不是固定显示营业时间。确认依据：

- 同一家 Sushi Tokyo Ten：10/20 ×3 只列 11:00、21:00；10/20 ×2 列 14 个时段。
- Sendou：当天（10/11）只列 5 个时段；10/24 列全部时段。
- Sen、Matsumoto：DOM 列表与 GET 结果一致。

所以时段列表可以作为空位证据，但它是间接证据，不如 GET 硬。

**TableCheck：** 原始 trace 的核对（`rawTableCheckCurrentResult`）在 KF-H003 三家和中目黑一家中均为 SATISFIED，没有出现日期、人数或时段不符。

## 条件 5、6 与已知缺口

- **条件 5：** 原样回放与注入式回放已纳入常规离线检查，P1-F 期间没有新增改动，满足（沿用 P1-F 准备批复核的结论）。
- **条件 6：** 站点专用生产代码净 −3 行，`tabelogRegions` 与 Tabelog 加载等待已删除，满足（同上）。
- **只读边界：** P1-F 运行中没有出现表单提交、预约类点击、个人信息输入或非预期的 Guard 放行。但 Guard 多跳重定向缺口仍在冻结版本中，所以只能写"在 Guard 可见的请求范围内未发现越界"，**不能写"只读边界已验证"**。按第 20 条，它是 P1-F 之后第一个要修的问题。

## 未达标的两项第一阶段缺陷（都是通用缺陷，不涉及站点）

1. **地点解析过严。**
   - Google 只返回一个高置信结果、位于请求所在城市、类型是 `colloquial_area` 或 `neighborhood`、名称仅差变音符号时，应当接受。
   - 名称比较前做 Unicode 规范化，去掉变音符号（ō→o）；类型白名单加入 `colloquial_area`。
   - 歧义判定（100 km）和外地同名拒绝保持不变。
   - 反例：Ebisu 解析到佛罗里达的同名餐厅，仍然拒绝。
2. **被拒次数达到上限时以诚实结果结束。**
   - `REJECTION_LIMIT` 不再让运行 FAILED，而是带上原因和已查过的范围，结束为 NO_VERIFIED_RESULT。已有合格候选时照常交付。
   - 同时检查 C4：重复动作被拒后，下一次决策是否收到了明确的"换候选或结束"提示。

此外记入第二阶段（第 17 条，只记录不修）：

- RECOMMENDATION 被改成 AVAILABILITY 并推断人数（KF-H004）；
- 检索词（"local food""kaiseki restaurant"，即 KF-H005、神乐坂）；
- 酒店级 TableCheck 店铺的门店粒度（Aloft）；
- Google 候选查位时被交付保留量挤占（神乐坂）；
- 交付家数：H001 3 家、H003 3 家，其余 1 家。

## 用量

- 模型 799/1500；
- 整单 Live 32/33；
- Google 业务调用已确认 16，历史两次中断缺少计数；
- 环境重跑预留：账本记为 2。整单上限 33 已包含预留，实际只剩 1 次。账本与 Playbook §12 的口径不一致，需要按 33 的总上限理解。

## 需要用户决定

1. **是否做一个收尾小批（P1-G）：**
   - 修上面两项第一阶段缺陷，四门禁加回放验证；
   - 然后补跑 4 次 Live：吉祥寺（需重新认证见证）、B h001、h003、h004。
   - 整单将到 36/33，需要批准超出 3 次。
2. **B h003、h004 的 402 是否按环境失败处理。** 如果是，这两次补跑属于正常重跑，不算追加预算；但仍受 33 次总上限约束。
3. **替代方案：** 不补跑，记为"第一阶段未完全签收，两项缺陷与 B 部分无效样本转入下一批"，直接开始修 Guard 多跳重定向。
