# 停止点 3：测试基础设施修复

- 状态：current executable / 已暴露离线开发回归；非 Live 能力证明。
- 基线：main 4d9279583299e798f43cace277b84700617635ce。
- 时间：报告统一 CET（UTC+1），按用户明确口径。
- 授权：两项分别红绿、五门禁、净工作树后依次合入并推送 main，最终停止等复核。

## 切片与验收

1. 健康检查：以已完成快照即时计算就绪；保留完整观察窗口以发现后来繁忙/挑战/HTTP 失败。10 秒截止读取最后完成的观察，不让末次未完成快照覆盖为 CHECK_TIMEOUT。每个快照起止时刻如实记录，未完成结束为 null。复用 F5 的 1000ms fixture 窗口、后段延迟 220ms 本地构造，先红；补真实 Chromium 控制和截止/空结果/晚失败边界。实际 Runner 预检入口、重试及产品预算不变。
2. 录制器：槽 1 保存 DOM 构造本地页面；第三方 URL key/signature/client 等查询值统一占位，全部原扫描保留；普通扫描命中按页/条目排除，自有凭据命中整份拒绝。真实 Chromium/Guard 录制和回放到首个不合格页，未录请求不联网。先复现旧整包拒绝，再绿；保留自有凭据、其他残留命中和写后扫描控制。

## 边界、证据和停止

- 新增真实模型/Google/网站/Live/环境重跑全部 0；fixture 传输、localhost 与本地 HAR 单列。
- 仅 eval/harness 与报告可改；产品层、Prompt、产品 Schema、Guard、共享 Browser、站点目录与 source-packs.ts 不改。
- 评测输入与编排先提交并冻结 SHA。红灯必须是目标行为断言；各门禁后 git status --porcelain 必须为空，不恢复掩盖写入。
- typecheck、arch:check、npm test、build、test:browser:fixture 各项各一次；失败保留原因，修复两次仍失败则停。
- 复用 evaluator@34；本地健康检查无交付 S0 不适用。回放只证明保存响应的安全接纳，不与 Live 分母合并；未回放质量不计通过/失败。
- 同步 STATUS、DEVLOG、TEST-LOG、月度摘要和索引。真实来源时序及库存仍需后续授权 Live，本批不补跑。
