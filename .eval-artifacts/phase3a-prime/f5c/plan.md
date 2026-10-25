# F5c 离线集成修复

- 状态：draft / not integrated；开发证据已暴露，不是 Clean Holdout。
- 基线：`a691f7ddbce7a4fc32829508993a1ef49b269fd2`；分支 `codex/fix-phase3a-prime-f5-provisional-entrance`。
- 时间口径：维也纳 CET（UTC+1），2026-10-25。
- 切片承诺：Tabelog 第二个有效坐标越界后，在本次来源调用内完成一次纠正并继续详情；根 Agent 的候选门禁保持有效。来源 90 秒、4 地区页、10 详情与整单 500 秒 / 50 模型调用不变。
- 验收接线：真实 Interpreter → Coordinator 合法动作 → Router → Native 来源循环 → 坐标判定 → 已观察引用选择 → 直接导航 → 候选接纳 / UNKNOWN 收尾。先在旧产品代码上取得 Agent 循环层红灯，再以同一断言取得绿灯；本地构造 TableCheck 2 个、Google 26 个待处理候选，断言真实 `NATIVE_FIRST_BATCH_PENDING` 仍阻止新的 SEARCH。
- 复用 G1/G3、N1–N4、F1–F4 与普通 stale-ref 等既有行为 fixture；调整其一次调用断言，不保留延期纠正的旧执行路径。构造输入均明确标作“本地构造”，不称网站回放。
- 见证冻结：补入公开详情完整地址，并用真实见证漏斗检验“店名 + 地址”跨来源匹配。历史冻结包、原始响应和评价只读，不改历史结论。
- 槽 5：仅用固定 Git blob 的诊断 DOM、决策与 trace 分析超时及 F3 / F5 关系，记录输入 SHA；不修 F3、不修健康检查或录制器。
- Prompt / Schema：仅在实际合同改变时递增；若只是共享层控制流和冻结数据补齐，保持现有版本。
- 验证：目标回归、独立证据与旧代码红灯；同步 STATUS / DEVLOG / TEST-LOG / 月度索引后，干净提交上运行五门禁，前后检查工作树；站点目录及 source-packs.ts 相对基线零差异（3864 / 473 行）。
- 新增真实模型、Google、网站 GET、Live、环境重跑均为 0；不读 `.env`。不合并 main。本批交付后停止；后续 Live 需对话 A 修复合入、重放与用户批准额度。
