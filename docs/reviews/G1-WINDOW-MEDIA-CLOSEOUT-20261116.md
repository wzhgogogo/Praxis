# G1 窗口与媒体过滤收口

**待以本次复核提交整合 main；已完成离线与本地 Chromium 验证，D8 线上 Live 待冻结主线 SHA 后验证。** 仅本地分支 `codex/fix-g1-body-and-query-selection`；基线 `6adbeeb287d7731183fd2c5ba48538a56d24e49d`，本轮源码/测试冻结 `a5c4597b0031881e8e765888451a22785a32fb98`。最终净树复核 SHA 由独立证据 `gates.json.sourceSHA` 与报告记录。

## 收口与证据

1. LOCAL / Cloudflare 快照对比本次采集的正文端点并刷新 `visibleTextChanging`，不复用上次 wait 的文字标志；G1 仍核对当前 500ms 正文稳定与全部在途正文请求，静态显式当前变化仍拒答。`capturePage` 仅同 URL 复用 previous，导航后重新取当前快照。
2. opacity=0 后先保护显式 aria-busy / progressbar。未淡出遮罩必须与独立媒体表面和框的几何范围匹配；混合正文卡片不因包含图片/背景图而忽略加载器。使用公开结构、尺寸与自身可访问名称，不使用私有类名、testid 或固定文案。通用 busySelectors 的 9/12 截断合同不变。
3. 正例以真实日文原句“和モダンな店内には個室も備え、接待や会食、記念日など幅広いシーンでご利用いただけます。”核对完整 sourceDocuments → 原句引用 → ANSWERED。构造回答使用英文，引用保持日文；没有放宽既有语言规则。

未修 6adbeeb28 下，两种真实会话的旧 true 恢复失败、图片和背景卡片的六个忙态漏拦、导航 previous 复用错误均保留红灯。测试包含前置 wait 的实际正文变化、超时诊断与静止后恢复；持续变化/先超时仍变化均拒答。既有 aged-fetch、12+1、PENDING 缺诊断与正文变化反例保留。定向单元/刷新 25 项、包间和恢复正例 6 项通过；最终五门禁另在最终提交净树执行，结果以原始输出为准。

## 边界与交付

真实保存 DOM/CSS + 本地构造网络/文字变化/问答替身；不是完整网站 Replay，不证明线上库存或真实模型语义。Guard 3 秒规则、S0/评价器、Prompt/Skill/Wire Schema、执行器原生 value/控件回读、生产时限不变。0 Live / 0 网站 GET / 0 真实模型调用。主工作区、旧账本与分流配置前后哈希比对；6adbeeb28 的历史报告与日志按原样保存。本轮源码分支 `.eval-artifacts/` 新增为 0。

新证据目录：`/private/tmp/praxis-category-guidance-live-evidence/.eval-artifacts/phase3b/g1-window-and-media-closeout-20261116/`，含红绿日志、五门禁、提交与输入哈希、保护比对与一页报告。不推送、不合 main，停止待复核；未来单次 D8 必须在主线冻结后另执行。
