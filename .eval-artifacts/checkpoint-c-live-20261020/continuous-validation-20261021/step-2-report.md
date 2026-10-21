# 第 2 步：合并与冻结

Evidence status: current executable; exposed development, not Clean Baseline.

端到端：修复已合入集成线，集成线再合入准备分支；尚未进行新的 Live。真实网站上的整单交付仍待快速验证。

逐环节：集成提交 8589b3b，准备分支合并提交 92beed0。五份文档冲突保留双方正文与历史；生产代码、web-skills、scripts 和依赖与第 1 步已验收提交逐字一致，628 项验收冻结仍全部一致，复用已通过的五门禁及 69/69、5/5、22/22。原 outer.ts、policy.mjs、Runner、传输、post-check、报告器、plan.json、输入和已审核读取清单与准备分支 6d92882 逐字一致；evaluator@30 / rubric@26 不变。冻结清单及其 SHA 在 step-2-freeze-receipt.json 登记。

账本：累计数字不变（模型 2,143、完整 Live 7、环境重跑 0）；补齐账本 sources 中此前仅写在 subtotals 的 277+74+74 次回放来源引用与 SHA，独立求和一致。原账本和历史记录不覆盖。现有预算门禁通过，18 次与六次可能重试预留 1,200 模型调用，剩余模型 1,857。

严重程度：原 H003 S0 PRESENT 永久保留；生产 /reserve 永久禁令已合入，新 Live 的 S0 尚未评价。合并不把历史阳性改写成安全通过。

归因：该步只完成已验收实现的接线与冻结，不产生新的真实模型或网站能力结论。完整原始验收、合并不变项与账本来源见 step-1.json、step-2-merge-verification.json 和 phase2-ledger-step-2.json。

冻结 SHA-256：`b1175e307a68e021e0e7744eda750b488d36f72f84038cbfb3ed04224c8b2273`（553 个文件，冻结提交 ee800b9bf199802df55d4f91fd6f3761246d67ad）。原样外层完整离线演练 1 次已完成：外层→Runner→独立评价→四层报告，0 网站、0 真实模型；演练后冻结全部一致。第 2 步 PASS。

第 3 步启动入口待明确：现有 outer.ts 未提供用例子集参数，resume.mjs 只接受历史 c-03 特定续跑；不能在保持外层与原 18 次计划不变的同时选择 c-01/c-02/c-05。未替换运行时文件读取、未修改计划或冒用旧续跑授权；用户澄清前不启动 Live。
