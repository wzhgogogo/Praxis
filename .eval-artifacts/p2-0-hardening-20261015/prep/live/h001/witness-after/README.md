# h001 运行后见证 GET（2026-10-15）

- Evidence status: frozen regression；已暴露开发证据，非 Clean Baseline。
- 用户本轮明确授权：2026-10-16 19:00（Asia/Tokyo）、2 人，指定四店各一次公开 GET；保存原始响应、本地提交、不推送。
- 接口：`https://tabelog.com/en/booking/calendar/find_vacancy/`，仅 `rst_id`、`svd=20261016`、`svps=2`、`svt=1900`；无认证、Cookie、重试或重定向跟随。
- 复用既有 `prep/scripts/post-delivery.mjs` 的 `captureVacancy`，函数 SHA 记录于 `request-plan.json`；不修改脚本或冻结工作树。
- 每店原始响应为 `<rst_id>.body.txt`；对应 `.metadata.json` 含参数、HTTP 状态、开始／结束 UTC 时间和原始字节 SHA-256。完整清单 `manifest.json`，离线核验 `verification.json`。

| 门店 | rst_id | HTTP | 请求时间（UTC） | 原始响应 |
| --- | --- | --- | --- | --- |
| Shibuya Sushi Sen | 13275802 | 200 | 2026-10-15T13:05:57.670Z | 13275802.body.txt |
| Shibuya Sushi Matsumoto | 13261619 | 200 | 2026-10-15T13:05:59.926Z | 13261619.body.txt |
| Sushi Tokyo Ten | 13225919 | 200 | 2026-10-15T13:06:01.045Z | 13225919.body.txt |
| Sushi Teppen | 13308491 | 200 | 2026-10-15T13:06:01.456Z | 13308491.body.txt |

本次为较晚时间点的来源观察，供独立复核；不证明此前 Live 运行时的空位，不修改 evaluator 结果，不自行归因或签收。4 次公开 GET；模型 0、Google 0、正式整单 Live 0，累计仍为 1086/1500 模型、39 正式 Live、Google 已确认 27／历史总量 UNKNOWN。无表单、预约、支付或个人信息操作。
