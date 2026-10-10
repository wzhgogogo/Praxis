# P1-E 预跑两例独立归因（2026-10-10 04:00 北京）

- 复核者：独立复核（Claude），非实现者
- 冻结提交：`5aac484`（含 C0、C0b、E1、C6a、C5a、G1、Gold@7 默认）
- 原始产物：Codex 工作树 `p1-e-early-live`；Codex 报告 `.eval-artifacts/p1-e-early-20261009/report.md`
- 见证：10/9 21:48 东京复查，均有位
- 证据状态：开发集已暴露，非 Clean Baseline

## 结论

| 运行 | 结论 | 说明 |
| --- | --- | --- |
| kf-h003 | **合格交付（人工，附说明）** | 100 Spoons TOYOSU，10/23 17:30、18:00、18:30、19:00 十人有位；查位快照 #541 与证据一致。"team dinner"与"suitable for a team dinner"措辞等价。附说明：距评测点 2,976 m，在 3 km 半径边缘；店型偏家庭餐厅，聚餐、饮酒为 UNSPECIFIED，人均价格、包间为 SOFT，不阻断。不是见证店。32 次调用、100 秒 |
| kf-h001 | **能力缺口** | 到第 50 次调用时没有任何合格候选，C0/C0b 没有机会触发。かみや 有 10/22 19:00 两人的真实时段，但官网是 Instagram 空页，omakase 无法核实；Sushi Suga 的 omakase 已核实，查位在 Tabelog 点完日期后请求人工帮助（#46），最后一次调用（#50）又在点日期。见证店 Matsumoto 已作为 Google 候选被发现，但没有轮到查位 |

错误展示：0。

## 改动在真实网站上的表现

- **C5a 有效。** 10 人下拉在两家店都是"打开 → 选 10 guests"两步完成（#8–#9、#24–#25）；之前同类情况为 15–30 次。
- **G1 只通了一半。** 预约入口页 `/en/shops/<slug>/reserve` 已放行，但页面自身的脚本和样式来自 `cdn1/cdn2/cdn3.tablecheck.com/assets/table_check/`，被 Guard 拦截，页面空白（kf-h003 #28 可见文字为空；kf-h001 Sushi Teppen 同样）。需要为这些公共静态资源加复核规则。
- **C0/C0b 未经检验。** kf-h001 没有出现合格候选。

## 新发现

1. **TableCheck 明确无位提示没有被识别。** 0711 GiNZA BiSTRO 选 10 人后，页面明确写着"We could not find a table on Oct 23rd for the selected mealtime"。校验器没有把它判为无位，结果为 AVAILABILITY_RESULT_UNOBSERVED；模型在 17:30 和 18:00 之间来回切换，用了 13 次调用（#10–#22）。
2. **kf-h001 的调用去向：**
   - Tabelog 分类扩展重复点"All"9 次（#10–13、#24–28），属于 NO_ACTION_MEMORY，对应 C1；
   - TableCheck 按店名搜索 Google 候选，"Search / 打开下拉"循环约 12 次。搜索请求已放行，结果最终被解析，但每家要 3–4 次决策，属于等待和动作记忆问题，对应 C3、C1；
   - Tabelog 点完日期后请求人工帮助 3 次（#5、#31、#46），属于 ASYNC_SETTLE，对应 C3。
3. **事实来源限制。** かみや 的官网是 Instagram，页面无可读文字，omakase 无法核实。属于 SOURCE_LIMIT，第二阶段处理。

## 子原因（本轮）

| 标签 | kf-h001 | kf-h003 |
| --- | --- | --- |
| NO_ACTION_MEMORY | ✓ | |
| ASYNC_SETTLE | ✓ | |
| REPETITIVE_STEPS | ✓ | ✓（时段来回切换） |
| PARSER_EXTRACTION（明确无位未识别） | | ✓ |
| GUARD_BLOCK（预约页静态资源） | ✓ | ✓ |
| SOURCE_LIMIT（Instagram 官网） | ✓ | |

## 建议的下一批

1. **G1b：** 为 TableCheck 预约页的公共静态资源（`cdn0–3.tablecheck.com/assets/table_check/` 的 script、stylesheet、font、image）加复核规则，补 Guard 正反例。
2. **TableCheck 明确无位：** 把页面上与当次日期、人数、餐段绑定的明确无位提示判为 EMPTY，只覆盖该餐段；用本次录制的快照做 Fixture。
3. **C1 动作历史：** 可以用原样回放加"由前序记录生成的 history 字段"来验证，不依赖缺 CSS 的静态重建。
4. **C3 操作后等待页面稳定：** 用本地 Chromium Fixture 和下一次 Live 验证。
5. **Recorder 补存样式表：** 为以后的静态重建做准备。

做完 1–4 后，用 P1-E 剩余 3 次 Live 跑 kf-h001、kf-h002、kf-h005，跑前重新复查见证店。

## 更正（2026-10-10 06:00 北京，P1-C 第二批复核时）

- **#31 归因有误。** #31 是 Sushi Tomi Naka 的 Tabelog 页面，没有在线日历、日期或人数控件（只能电话预约），请求人工帮助是正确的，应归为 SOURCE_LIMIT，不是 ASYNC_SETTLE。#5、#46 的归因不变：点完日期后，已选日期和人数从目标列表中消失，模型误读为"控件不存在"而请求帮助，本应等待。
- **#24–28 的根因补充。** 这 5 次不只是动作记忆问题：Agent 用 Google 显示名"Sushi Teppen(Shibuya)"在 Tabelog 全东京范围按店名搜索，页面明确显示"0 results / No restaurants match"，模型仍在点"All"、"More filters"。根因是带括号分店名的检索词（RETRIEVAL_TERMS）和"0 results"未被识别为"已完成、无结果"。
- 对应的种子标注见 `.eval-artifacts/phase1-replay/seeds.v4.json`（p1-seed-0107–0128），复核结论见 `.eval-artifacts/p1-c-batch-20261010/independent-review.md`。
