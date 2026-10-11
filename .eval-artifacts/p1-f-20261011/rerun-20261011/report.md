# P1-F h005 用户授权重试记录

- 状态：**ENV_FAILURE；按一次环境重试规则停止**。
- 用户“你再执行一次”后，按最近中断的 h005 最小范围重试，未重跑整批，未启动其他用例。
- 冻结：`73bfca588ad5007a4a9326c8c13a958718898f1c`；宿主机工作树起止 CLEAN，原配置不变。
- 只纠正外层监测对 ADR-0036 既有只读许可的误解：公共日历 read POST 与 exact G1 GET document 不再误停；下一步、预约提交、确认、登录、支付、个人信息操作仍禁止。6 项离线外层观察检查通过，0 网络/模型/Google 调用；生产 Runtime、Guard、Prompt、Schema、配置未改。

| 步骤 | UTC 起点 | TableCheck 状态 | 耗时 | 业务调用 |
| --- | --- | --- | --- | --- |
| 第一次 CLI 尝试 | 2026-10-11 15:16:03 | HTTP 503；PREFLIGHT_PUBLIC_ENDPOINT_REJECTED | preflight 3.515 s | 模型0，Google0 |
| 既有 preflight 恢复检查，仅 TableCheck | 2026-10-11 15:17:33 | HTTP 206；REACHABLE | 2.152 s | 模型0，Google0 |
| 唯一环境重试 | 2026-10-11 15:18:21 | HTTP 503；PREFLIGHT_PUBLIC_ENDPOINT_REJECTED | preflight 3.185 s | 模型0，Google0 |

每次请求仍是原 preflight 的 `GET https://www.tablecheck.com/en/`、`Range: bytes=0-0`、no-proxy，没有绕过失败端点、没有换配置。其他三项 preflight 在两次 CLI 中均可达。首次环境失败后确认恢复才重试，重试再次失败，未追加请求或模型运行。

本轮没有越过 preflight，所以没有正式 result、decisions 或 recording，未生成餐厅交付或启动浏览器。既有网络诊断明确标记 evaluator NOT_APPLICABLE；没有把网络诊断包装成 evaluator@27 的餐厅成功/失败。没有正式零交付运行，因此未额外采集见证接口；见证有效期原值未改。

用量：新增模型 **0**、Google业务 **0**、整单Live **0**；累计模型仍 **521/1500**、整单Live仍 **22/33**。使用 **1** 次环境重跑预留，剩 **2** 次。preflight 的 Google根路径传输检查与 DeepSeek models GET 不是业务/生成调用。

原始网络产物路径与 SHA-256 在 [summary.json](summary.json)。原始三份 JSON 原样复制为 attempt-1-preflight.json、recovery-preflight.json、attempt-2-preflight.json；两次 CLI start/finish/log 在 p1f-kf-h005-20261022/。之前的中断和交付产物未修改。

到此停止；未推送，未开始 B。不能报告 h005 复测完成或 A 部分签收通过。
