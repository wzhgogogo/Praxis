# G3 停止报告：HARD 预算未核对报价适用人数

2026-10-29T09:52:53.665907+01:00，维也纳 CET（UTC+1）。状态：**STOPPED_S0_CLASS_HARD_PRICE_SCOPE**。工作分支 `codex/feat-phase3b-tabelog-observed-availability`；反例冻结提交 `c8ff6bf70621c776c7b701727653a13bea02f4ef`。G3/G3c **未完成、未合入 main**。

## 触发停止的独立反例

| 项目 | 正常对照 | 限制反例 |
|---|---|---|
| 请求 | 2 人，晚餐，人均上限 JPY 8,000 | 完全相同 |
| 原文 | Seasonal dinner course: JPY 8,000, tax included; dinner only. | 同一句后加 **Available only for parties of 4 or more.** |
| 报价解析 | 8,000，含税，晚餐；逐字保留 | 完全相同，**人数限制也完整保留** |
| 库存 | 站点响应精确绑定 2 人/该日期/时段 | 完全相同；没有给出套餐库存或套餐成交价 |
| 生产 HARD 预算状态 | MET | **MET** |
| 独立期望 | MET | **NOT_CHECKED**：没有适用 2 人的报价证据，不能据此断言满足上限；也不能推出全店 NOT_MET |

这是一条 **实际 Tabelog Adapter → fixture 模型选句 → 原文/数字核对 → 生产条件判断** 的离线反例。模型仅选择原文编号，未提供金额；没有预填合格中间状态。源限制与请求人数独立给定，判错依据是原文至少 4 人与请求 2 人的字面冲突，不是生产代码自己的 verdict。

[完整日志](counterexample/hard-scope.log)、[执行收据](counterexample/receipt.json)、[独立对照数据](independent-counterexample.json)。当前默认测试中的目标断言实际失败：`MET` ≠ `NOT_CHECKED`。未跳过、未改成接受错误输出。705 个输入/脚本在运行前提交并冻结，SHA `76fdcb0888ee6b66d5df8cc6a8d0d96fa30d01d3b0745ded3de048203e292963`；执行前后净树。

## 首个偏离和影响范围

`src/domains/restaurant/condition-states.ts` 的预算分支只按 MEAL、午晚餐及金额筛选；输入类型也没有传递日期/人数。它没有核对被引用套餐的适用人数，因此把不适用请求的报价用于 HARD 上限。该文件与最新 main **50a08361** 逐字节相同，SHA `116261708af0bc69e18011f386b751d84875bb89c6ec4ea40d10642ff3dfdc76`。

本次实际证明的是离线 HARD 资格错判／S0 类风险。**没有真实 Live 用户交付或预约错误事件**；模型、网站和 Live 新调用均为 0。库存人数/日期绑定和 `offer.price` 不从列出套餐推断的核验正常，不能把问题归因成库存串店或时段错误。

通用旧 HARD 回归仍为 44,197 字节、SHA `9a3298bc5e004b99e41d80713e8913b68c336cfa594f6eb60599e310ee3fb633`；它没有覆盖这类报价人数限制，不能替代新反例。

## 按用户规则停止

用户长批次保留了“出现错误声明（S0 类）”停止条件，G3c 还要求旧 HARD 输出改变前说明原因并复核。因此此处停止产品修改，未自行把 MET 改为其他状态，未继续删除 HARD 元数据路径。当前分支包含待复核的菜单/价格实现和一个真实红灯回归，不宣称五门禁全绿。

建议复核口径：**无附加限制的适用报价仍可 MET；带适用条件的报价必须核对请求上下文。已知不适用，或条件尚未核实且没有其他适用报价时，预算为 NOT_CHECKED。一个不适用套餐不能推出 NOT_MET。** 修复应沿已有 Intent 传递日期/人数并核对原文限制，保留原始报价、原文和库存边界；不得新增猜测。具体 State/TaskDefinition 如需变化仍按原规则先报告。此建议尚未实施，待复核确认后恢复 G3c。

## 各组结果与五门禁

| 组 | 红绿与候选 | 门禁与状态 |
|---|---|---|
| 01 响应结构告警/精确绑定 | 原生 7 + Chromium 1 红→绿，da0546fb | 五门禁 PASS，1210/176 |
| 02 公开列表/busy | 原生 3 + Chromium 1 红→绿，f6154ca3 | 五门禁 PASS，1213/177；严格列表 PASS |
| 03 控件失配回观察 | 实际 Playwright 失配红→日期/人数动作绿，6bb5ba78 | 五门禁 PASS，1213/178；错人数响应 UNKNOWN |
| 05 只从响应得出时段/日期 | 原生 2 + Chromium 1 红→绿，2d29aead | 五门禁 PASS，1215/179；C 授权输入精确同步 |
| 07 同步 G1/main 测试整理 | 0073ec8d，既有机制证据复用 | 五门禁 PASS，1213/178 |
| 08 公开选中状态 | 41cec356 红→32a9d16c 目标绿、12f5dd0d 对应回归绿 | 前四门禁 PASS，1216；Chromium **178/179**，唯一旧 Sen 基线红 |
| 09 G3c 菜单/价格草案 | 两站有效红→绿；缓存/范围有效红→49/49 绿；163 原生/14 Chromium 绿 | 通用 HARD 字节不变；**新人数适用反例红**，最终五门禁未运行 |

08 的失败门禁完整保留，不计作通过。A 的 Sen UNKNOWN 基线现已合入 main **50a08361**（PASS / requestConfirmed:null），读核对完成；新 S0 停止后未再同步。**严格 G2 未在当前停止版本运行到通过**，不得用普通/局部门禁代替。下一轮先同步已批准 A 输入，再跑 `PRAXIS_G2_REQUIRE_PASS=1 npm run test:dom-change`，不需要再次批准这次同步。

## 仍保留的私有依赖和原因

| 范围 | 当前保留项 | 原因/后续 |
|---|---|---|
| OBS13/33 | Tabelog 已知选择器、原生 name 作为加速 | 已有失配回观察；不再作为选中/库存结论依据，允许保留导航提示 |
| OBS24/35/36 | Tabelog 分类/字段/价格元数据；Native/website facts 的私有字段链路；网站 courseName/coursePrice | G3c 事实读取/HARD 迁移尚未完成；先处理本次 HARD 适用范围，再迁移并比较旧判断 |
| OBS29 | TableCheck 菜单服务范围的 class 分区 | 同上，互斥餐期/服务范围核验不能删，仍需公共语义替代 |
| OBS30 残余 | 旧 TableCheck 私有报价函数已无生产消费者，仅旧解析测试引用 | 因 S0 停止尚未退役，下一轮随对应测试清理，不长期保留重复执行路径 |
| OBS25/26/27/34、部分共享展示读取 | TableCheck 日历/testid、readonly combobox 私有展示容器 | 用户已将查位改造留待 G3b 正时段录制，不冒充本批完成 |
| OBS20/31 | 两站详情身份与 C 负责的解析/匹配 | 仍归 C；本批未改，保护文件/测试已核对 |
| 站点响应字段 | find_vacancy base_date/members/selection 等 | 属允许保留的数据响应绑定；结构告警、最新响应、同店日期人数时段核验不变 |

## C 接口、版本与账本

`tabelog-vacancy-response.ts` 与已发布 G3 完全一致，SHA `3c31462c902faaaa3acae3a3f040583472e757ac68b15ef1b371a46b563c0afa`，输出格式未改。C 的 5 个保护文件、4 个测试块全部断言保留；唯一输入差异仍是用户批准的响应补丁。[保护证明](preservation.json)。

独立来源选句 Prompt/Schema **1**；G1 问答仍 **3**；Agent Prompt/Action Schema/Context/State/TaskDefinition 未改。新增内部候选模型预算诊断，不改变生产预算数值；source-packs 新增 4 行仅传递通用模型依赖，未迁移站点私有逻辑。

统一脚本计数：两个站点非测试 TS **3,970 行**，source-packs.ts **482 行**，仅参考；main b2a3cbd3 为 3,911/478，已发布 d331583d 为 3,950/478。[完整计数](adapter-lines.json)。

477 个账本 id 保留此前 475 条及本批两条零调用记录，累计实花未变；本批真实模型/Google/网站/Live/公开 GET/环境重跑全部 **0**。未读取 `.env` 或 QA `answers*.json`。仅推工作分支，**不合 main，等待复核**。
