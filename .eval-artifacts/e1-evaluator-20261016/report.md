# E1 评测器第一切片

- 日期：2026-10-16（Asia/Shanghai）。状态：执行中，第0项已校验待提交；第1–9项尚未签收。
- 证据：已暴露开发回归，不是 Clean Baseline，不证明新用例准确率。
- 开工同步：git pull --ff-only，36ab029 → 78fcc13；保留复核者文件，T1独立复核已通过。
- 用户原有 INDEX、预约设计草案和三个演示文件保留，不纳入提交。
- 除开工授权Git同步，没有网络、Live、模型或见证GET；Gold、变体、见证和生产资格不改。
- 最新直接指令授权最终推送，优先于指令文件末尾旧“不推送”文字。

## 0 输入冻结

原始预检发现两次外层SIGKILL从未生成result，未伪造或重建result。用户随后明确批准20份原始result＋2份中断包，保留22条运行；两条不计能力分母。

- 目录：../calibration-phase1-20261015/inputs/；manifest schema 1，dataset restaurant-evaluator-calibration-phase1@1。
- 22条／30个gzip／12,630,285字节，小于60,000,000字节。
- manifest SHA-256：68125e710ee1ffee5f101fd390ba4e769e2e1d67e5fa3b5f1bc3035ecbd6d1f2。
- 每文件原始绝对路径、原始及gzip SHA-256、原始及gzip字节数在manifest。
- 独立列出22个预期run-id核对全集；逐文件gunzip、双SHA、长度及与原始字节逐字比较通过。命令与结果：00-inputs/verify-inputs.mjs、00-inputs/green.log。
- p1fA-kf-h003-a1、p1fA-kf-h005-a1为 RESULT_NOT_GENERATED / OUTER_SIGKILL_INTERRUPTION，各含started、decisions、interruption、finish、trace五个原始文件。
- 两条读取规则：外层记录判断 ORCHESTRATION_INTERRUPTED；依赖result的维度未评价并注明缺失；S0只看trace网络观察，不足则NOT_EVALUATED，不写“无S0”。校准这两条允许S0未评价但须解释，其余20条须与人工S0一致。
- 包装器：package-inputs.mjs（拒绝覆盖，先计算总体积再写入）；冻结后不修改输入字节。

## 当前切片／行为覆盖表

每项以独立反例先红后绿、单独提交并通过四门禁。待人工导出的labels和等价结论只阻断最终校准，不阻断其它实现。

| 项／主要失败类型 | 测试与检错证据 | 未覆盖／当前状态 |
| --- | --- | --- |
| 1 旧字段缺失被猜测 | 待实施 | 未开始 |
| 2 未审核措辞误接受、polarity/strength漂移 | 待实施，生产表保持空 | 等待复核者结论 |
| 3 复制请求自证库存、共用营业时间规则 | 待实施，优先真实输入反例 | 未开始 |
| 4 错误结果分类／S0把未知当无错 | 待实施，外部证据而非人工标签 | 五条人工口径待导出 |
| 5 见证跨店／漏斗漏接 | 待实施，卡点只能HYPOTHESIS | 未开始 |
| 6 死循环误判调查充分 | 待实施，真实24步及三次同词 | 未开始 |
| 7 声明限额掩盖实际限额 | 待实施，effectiveLimits独立比对 | 未开始 |
| 8 补见证越界／无交付触发漏接 | 待实施，仅dry run | 不运行Live |
| 9 种子写死店名／缺真实上下文 | 待实施，两个真实决策点 | 待独立标注，不计通过率 |

## 提交、门禁、校准

第0项仅输入完整性校验，无代码变化，不用全仓门禁替代数据校验。第1–9项尚未执行，不宣称代码完成或门禁通过。

校准待复核者提交 labels.yaml 与 criterion-equivalences.yaml，不自行填写。评测器不得读取人工标签。四层结果、未评价原因和逐次对照将在后续逐项补齐。

## 1 类型化读取

真实h002删除两端criteria时旧评测仍SATISFIED（01-reader/red.log），类型投影后NOT_EVALUATED并带完整路径；正常产物、非法类型和缺轨迹控制通过。所有判定已移除asRecord动态取字段，仅边界读取已消费字段；evaluator@29/rubric@23，不补造旧记录。输入冻结提交3389131。

定向85/85；typecheck、arch:check、npm test 883/883、build全绿，命令及日志01-reader/{red,green,typecheck,arch-check,test,build}.log。首次正常产物null失败码格式误报已在读取层区分；重叠日志已以单次干净门禁重跑替代。未覆盖的历史字段继续未评价。
