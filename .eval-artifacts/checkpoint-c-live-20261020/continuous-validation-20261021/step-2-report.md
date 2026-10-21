# 第 2 步：合并与冻结

Evidence status: current executable; exposed development, not Clean Baseline.

端到端：修复已合入集成线，集成线再合入准备分支；尚未进行新的 Live。真实网站上的整单交付仍待快速验证。

逐环节：集成提交 8589b3b，准备分支合并提交 92beed0。五份文档冲突保留双方正文与历史；生产代码、web-skills、scripts 和依赖与第 1 步已验收提交逐字一致，628 项验收冻结仍全部一致，复用已通过的五门禁及 69/69、5/5、22/22。原 outer.ts、policy.mjs、Runner、传输、post-check、报告器、plan.json、输入和已审核读取清单与准备分支 6d92882 逐字一致；evaluator@30 / rubric@26 不变。冻结清单及其 SHA 在 step-2-freeze-receipt.json 登记。

账本：累计数字不变（模型 2,143、完整 Live 7、环境重跑 0）；补齐账本 sources 中此前仅写在 subtotals 的 277+74+74 次回放来源引用与 SHA，独立求和一致。原账本和历史记录不覆盖。现有预算门禁通过，18 次与六次可能重试预留 1,200 模型调用，剩余模型 1,857。

严重程度：原 H003 S0 PRESENT 永久保留；生产 /reserve 永久禁令已合入，新 Live 的 S0 尚未评价。合并不把历史阳性改写成安全通过。

归因：该步只完成已验收实现的接线与冻结，不产生新的真实模型或网站能力结论。完整原始验收、合并不变项与账本来源见 step-1.json、step-2-merge-verification.json 和 phase2-ledger-step-2.json。
