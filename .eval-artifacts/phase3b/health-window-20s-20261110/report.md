# 20秒体检重新冻结 — 2026-11-10 CET

批准来源：用户2026-11-10 15:25 CET，当前R2仅此一次重新冻结。源码7824b8f8净树完整门禁全部通过：typecheck、architecture、default1572、build、Chromium274+G6 135、strictG2全12。15项针对性红绿：旧实现15秒失败及白名单跨SHA拒绝；修后15秒通过、21秒失败、文档401立即失败；真实本地Git白名单接受、产品/其他文档/产物代码拒绝，伪造HEAD/改清单拒绝，历史归属稳定。旧代码红灯日志原样保存。

仅holdout-health.ts、holdout-checkpoint.ts及两者对应测试，另为.eval-artifacts下说明JSON/日志/md。HEALTH_WINDOW_MS=20000同时约束计时器和完成判断；观察包含windowMs。Git实际HEAD、祖先关系和实际diff确认白名单，不信任调用方声明。默认SHA不等仍拒绝；仅白名单例外。input-hashes保留原SHA，原收据/评价/补评不改，batch.sourceSHAHistory记录旧03-r1/r2/r3与04a-r1体检在64ea79f1，新尝试在新冻结SHA。

产品入口10秒×2、资源20秒、provider45秒、回合500秒、50模型均不改；身份/Guard/G1和所有额度不改。旧10秒体检失败2026-11-10 15:14:18 CET，最早15:34:18 CET续跑；完成发布后确认间隔≥20分钟，本次计第1次体检续跑（最多3次）。运行产物快进前逐文件SHA保存并核对，原题面和清单不读取。G1和菜系差异不修。正式续跑后的停批证据从-06开始独立推送。
