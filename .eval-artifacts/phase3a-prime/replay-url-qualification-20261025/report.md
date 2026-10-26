# 回放文档重定向资格

状态：completed / frozen regression；2026-10-25 CET（UTC+1）。分支 `codex/fix-phase3a-prime-replay-document-redirects`，验证源码 `278302bf06ced05d50812dc9c984c836a01587f4`，基线 main `70db9152`。输入来自已暴露的 F5 槽1原录制，污染状态 PROMPT_AND_RESULT_EXPOSED，不是 Clean Holdout。

请求 `/en/tokyo/rstLst/` 的原始 HAR 301 指向合格最终 URL `/en/tokyo/`。旧 loader 按最终 URL 过滤 HTML，同时在请求时只认最终 URL，导致初始请求被误拒绝。修复只让完整、无歧义、最终指向合格文档的录制 GET 重定向链继承资格，保留原始 301；缺 hop、环或不合格终点不获得资格。

验证原录制时另发现两个 eval 层误停：原检查早于 Guard，会把被拒绝的遥测算作 HAR 缺失；图片不属于既有页面资格的必需依赖，却被当作整次回放终止条件。检查现位于 Guard 准入之后、HAR 之前。未录请求一律 abort 并登记 missingRequests；文档、脚本、样式、动态读取等关键响应缺失仍停止；缺失图片/字体/媒体只拒绝该请求，不伪造响应，也不改变录制页资格。产品层和 Guard 未修改。

- 红灯：`7db74947` 上重定向正例失败、三类资格负例通过；原始 F5 槽1系统断网回放消费 0/94 页，在 snapshot1 DOCUMENT_NOT_QUALIFIED 停止。`f4040e18` 的 Guard 拒绝遥测断言失败；`dcd77325` 的缺失可选图片断言失败，原始日志完整保留。
- 绿灯：四项最小 Chromium/真实 Guard 回归全通过；同一份 F5 原始录制在 macOS sandbox-exec 与 Linux unshare -rn 系统断网下消费前两个合格快照，0 次模型传输；30 条缺失图片请求被拒绝并记录。随后 snapshot3 DECISION_SEQUENCE_DIVERGED，结论仍为 REPLAY_INCOMPLETE，未回放部分不计通过或失败，不声称完整 F5 重放。诊断 DOM 未作为输入，不补造页面或响应。
- 五门禁：macOS 默认 1053/1053、Chromium 159/159（103.489690 秒）；Linux 默认 1053/1053、Chromium 158/159（104.029268 秒），唯一失败为已登记 E1 `Failed to fetch`，原始 exit1 保留并按用户例外归 F3；其余 typecheck、arch:check、build 全绿，无其他失败、跳过或取消。每门禁后 git status 空，637 个冻结输入 SHA 核对通过。
- 站点非测试 TypeScript 3864，source-packs 473，均不增加；新增真实模型、Google、网站、Live、环境重跑调用全部 0。所有运行均离线 Fixture 或 Replay，排除 Live 能力分母。

输入和外层脚本 SHA 见 `qualification-final-inputs/freeze.json`；原录制及决策逐文件来源 SHA 见 `inputs/provenance.json`；各轮红绿、运行产物、两平台门禁及哈希见 evidence-manifest.json。原始 HTML 的空白字节不清理。Linux 复用本回合专用 VM，沿用健康项报告的真实 Chromium、非特权 unshare 和源快照校验；回合结束统一清理。

按授权在本项报告提交后合入并推送 main，使用 ls-remote 核对最终 SHA，再进入独立决策关联分支。原始 F5 的后续决策序列/页面不完整性保留为回放限制，不扩张本项验收。
