# 停止点 3：基础设施修复完成

- 时间：2026-10-25T03:31:14.348284+01:00（CET UTC+1）；current executable / 已暴露离线回归，等独立复核。
- 基线 main：4d9279583299e798f43cace277b84700617635ce。两项按用户授权顺序独立完成、五门禁全绿、净工作树后合入推送。

| 项 | 分支 | 实现 / 五门禁SHA | 结果与证据 |
| --- | --- | --- | --- |
| 健康检查10秒竞态 | codex/fix-phase3a-prime-health-deadline | 3d50f385 / 5e0692f8 | [报告](health/report.md)，红绿，五门禁1034/153；已推送main/28216ae330d64efcf48853c90fa783f872fca11e，[ls-remote回执](health/push-receipt.json) |
| 第三方URL凭据与录制拒绝范围 | codex/fix-phase3a-prime-recording-keys | d067bf7f + 05991efd / 05991efd | [报告](recording/report.md)，红绿，五门禁1037/154；安全HAR，第2页明确停止，0回放来源请求 |

最终main将快进到本报告的交付提交；精确SHA经推送后 ls-remote 核验，记录在最终回复和 recording/push-receipt.local.json（本地回执，不向Git提交自指SHA）。报告、导航提交不改变已测实现与输入。

两个切片最终2组共10项门禁全绿；录制器初轮另5项全绿也保留，交付发现自有请求体短路边界后取得补充红绿、重新冻结并完整复跑。所有15项门禁每次后 git status --porcelain 为空、恢复0。输入/外层脚本SHA在health/freeze.json 与 recording/final-candidate/freeze.json，门禁原始输出及SHA在各项gates/。交付一致性检查见 delivery-verification.json；无产品/Prompt/产品Schema/Guard/站点/pack改动，适配器3864与pack473不增加。

新增真实模型/Google/网站/Live/环境重跑全部0，见 [调用账本](call-counts.json)。本批fixture Google传输和localhost单列，不进入Live分母。

当前关闭两项基础设施机制。历史F5录制缺失响应无法补造；本次只用槽1元素构造本地最小页面与缺捕获页，不声称重放原101页。历史Live结果未修改，完整F5/真实库存不新增判定；未回放部分保持NOT_EVALUATED。两项完成后停止，等待复核，不进入下一批。
