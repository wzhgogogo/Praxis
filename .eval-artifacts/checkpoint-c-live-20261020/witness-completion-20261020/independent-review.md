# 见证认证与 Live 冻结包：独立复核

复核对象：`codex/chore-checkpoint-c-prep` @ `b318406`。复核时间：2026-10-20 23:58 北京（Vienna 17:58）。

## 结论：批准冻结包 `7caa315a0f02bff9a3476eaaff6b67ab849b6f42af5b7cf113e39b6b1fad2573`

- 复核者从 Git 中取出 `live-freeze.json` 重算 SHA-256，与上述值一致。
- 六个用例都至少有 1 家完整支持的见证店（共 15/16 家）。神乐坂 Komuro 在登记时刻没有匹配空位，标为 NOT_CERTIFIED，处理正确。
- 新增 18 次 GET 全部 200，最小间隔 30.000 秒，0 模型，没有打开表单或点时段。
- **Fukumimi（KF-H005）的人工判断，复核者同意：** 当前原始 JSON-LD 为居酒屋、烧鸟/鸡肉料理，满足"local food"的正向 HARD；居酒屋业态及价格范围不属于 fast food。这是来源解释，不是"没搜到关键词"，判为 CERTIFIED。
- 停批规则已按 4ac68fa 复核意见修改：`policy.mjs` 只在 S0 PRESENT 时停批，NOT_EVALUATED 继续；TableCheck 运行后复查不能独立完成时，保存运行时的原始证据（`tablecheck-post-review.mjs`）。
- 生产代码与 `a3f6b84` 相同（`src` 无差异）。
- 阶段账本：完整 Live 2/100，模型 1,483/4,000，环境重跑 0/10。18 次加最多 6 次预留重跑，最多 1,200 次模型调用，在额度内。

## Live 时限

最早的见证观察时间：2026-10-20 20:26:41 北京时间。18 次必须在 **2026-10-21 20:26 北京时间（Vienna 14:26）** 前跑完；未跑完的部分标为 NOT_REACHED，不能延用旧见证。
