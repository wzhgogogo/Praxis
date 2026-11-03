# D6 逐回合预算与独立核对修正

- 状态：draft / not integrated；开发输入已暴露，非留出集。
- 时间：2026-11-03，维也纳 CET（UTC+1）。
- 切片：只改 A 的评测、Harness 与 Runner。保留 D4 原始评价，另存用户复核；来源捕获与四参数后验核对分离；非见证店只机械核实同店原文，含义待审；用户每回合独立 500 秒 / 50 模型 / 40 Google，槽内至多三回合 / 150 模型 / 120 Google，开发总模型 400 不变。
- 验收：D4 保存输入的新评价中 B1 来源 PASS，资格为 QUOTE_VERIFIED_MEANING_PENDING_REVIEW 且安全项全 PASS 时继续；错参数、错店、缺失原文仍 S0；生产组合中首轮接近 500 秒后追问仍调用 G1，回合预算独立且 F6 保留不变；五门禁与严格 G2 净树通过，冻结后只运行 D6。
- 输入：D4 原始 evaluation.input.json、HAR entry 65、官网诊断 snapshot-0078.html、Google HAR entries 80/85；本地构造反例明确标注 LOCAL_CONSTRUCTION。历史评分不改，不使用生产 eligibility 作为独立 oracle。
- Live：W1 24 小时内复用，否则两次公开 GET；请求文字与访问日保持原样。开发 GET 10/25、Live 3/8、模型 57/400（全局 298/1600）为本轮起点。串行 D6，任一 S0 / 安全证据缺失 / 额度耗尽立即停止，无自动重试。
- 收敛：条件投影交 B；具名店缺地区交 C；本批不改产品，不运行 D3/D5/D2/D8，不合 main。
