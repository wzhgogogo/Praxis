# TableCheck Guard 预检修复：独立复核

对象：`codex/fix-tablecheck-guard-preflight` @ `2ed45834`（基线 8487a844）。复核时间：2026-10-23 18:50 北京。

## 结论：可以合并主线。

- Guard：V4 搜索的 `hits` 改为可选参数；对已放行的 GET 规则（cdn0 /common/、production.tablecheck.com 的公开只读端点、search-v4、ai_search），绑定同来源 `x-api-key` 的浏览器 CORS 预检可以放行。OPTIONS 仍须满足 `sec-fetch-mode: cors`、请求方法为 GET、无请求体，并匹配对应 GET 的完整端点和查询语法。主机和路径白名单没有放宽，`/reserve` 禁止规则不变。这是最小修复，仍属于"白名单精确匹配"的思路，第三阶段的僵硬代码审计应评估改为"永久禁止危险操作，放行无害读取"。
- 来源检查：每次 Live 前，通过生产 Guard 打开 Tabelog 和 TableCheck 搜索页，不调用模型和 Google；检查忙碌页、验证页、403/5xx，以及是否出现结果；不健康时等 5 分钟，最多查 3 次，不计 Live 额度。设计正确。
- 小问题（不阻挡）：Runner 读取固定路径 `.eval-artifacts/tablecheck-guard-preflight-20261023/reviewed-reads.json`。评测入口依赖一个带日期的产物文件，以后应改为参数或配置。

## 复核者补充证据：Guard 误拒影响面比"忙碌页"更大

复核者统计了已保存产物中 BLOCKED_METHOD（被拒的预检）的次数：

| 运行 | BLOCKED_METHOD | 结果 |
| --- | ---: | --- |
| h-02、h-04、h-05、h-08、h-10、h-11、h-12（成功交付，主要使用 Tabelog） | 111–170 | QD / 有交付 |
| h-07（例 01） | 867（主要是 cdn0 和 production.tablecheck.com） | CAPABILITY_MISS |
| h-03、h-09（例 03） | 563–568，并有约 330 次 search-v4 请求 | 无交付，约 458 秒 |

成功的运行在 Tabelog 上就找到了店；失败的运行转去 TableCheck，而那里的读取被 Guard 大量误拒。这说明 TableCheck 读取受损，与例 01、例 03 的失败相关，但还不能证明是唯一原因。对例 01 做诊断重跑可以验证这一点。
