# 评测器 @32：HARD 商家字段与见证原句

状态：**OFFLINE_PASS / AWAITING_REVIEW**；draft / not integrated。分支 `codex/fix-evaluator-hard-course-evidence`，基于 `27b3884a`；代码 `0a5c889a`，冻结提交 `c2c00cb8`，参考产物提交 `f74d75cf`。不影响正在运行的检查点 C，不合入产品分支。

## 冻结和门禁

- Evaluator@32 / rubric@28；[冻结清单](freeze.json) SHA-256：`fcbedc331de53a7262a93db083aa1022f20ed14dff8a5b6fd165c46aa1016ded`，1354 个文件，运行前后相同，见[核验](freeze-verification-after.json)。
- 五门禁通过：默认 **988/988**，真实本地 Chromium **131/131**，typecheck、arch:check、build。见[门禁和日志 SHA](gates.json)。
- [有效红灯](red-complete-independent-input.log)：隔离的旧代码先确认独立库存及引用 REQUIRED_EVIDENCE=SATISFIED，再在“有商家课程明文应为 MET”断言失败，实际 NOT_CHECKED。[正反例绿灯](source-binding-green.log)覆盖课程／类别、名称、评论、邻店、隐藏、替代、引用、来源、请求、时刻、散列和餐段。
- 保存 HTML 的散列与脱敏前运行时 HTML 散列不同；通过录制 SHA、快照序号、URL、原运行中同序快照散列逐项绑定，不混称同一原件。
- 既有全套测试在本新工作树生成了旧路径的区域组合派生产物。先保全两份字节、核对差异为观察字段和耗时，随后将历史副本恢复为 HEAD。[来源记录](test-output-provenance.json)保留 SHA；运行中 C 的工作树未改。原始命令日志保留空白，非日志 diff 检查通过。

## 第一层：旧产物参考评价

原 22 次校准保持 **结果类型 22/22、正常 S0 声明 20/20**。两份无 result 中断例外仍未评；13 份历史越界证据缺口仍未评。自动输出先保存并核 SHA，再读原独立标签比较，不把标签送给评测器。见[自动输出](calibration/summary.json)、[比较](calibration-comparison/comparison.json)。

| 快速运行 | @31 | @32 | 条件变化 |
|---|---|---|---|
| c-01 | QUALIFIED_DELIVERY | QUALIFIED_DELIVERY | 三条 omakase 由 NOT_CHECKED 变为 MET，依据本店课程原文 |
| c-02 | QUALIFIED_DELIVERY | QUALIFIED_DELIVERY | 条件状态不变，原未知仍未知 |
| c-05 | DELIVERED_UNQUALIFIED | DELIVERED_UNQUALIFIED | Utou 依据课程明文；Kaga 仅依据限定人工见证；原展示漏引仍失败 |

[逐条对照](quick-comparison.json)保留 @31 路径和 SHA；@32 单独保存在 quick-reevaluations/。原 result、@30/@31、快速门槛 1/3 和旧失败不改写，不形成新签收。

## 第二层：独立 HARD 支持

只接纳同候选、同来源、当前实际执行、已展示引用、有原 HTML 对应的商家课程标题／描述或类别。独立解析不导入生产 parser，不以 verifiedHardCriteria 或模型标签自证；只做字面规范化匹配，不新增同义词／翻译表。

Sen、Issekisanchou 的 MET 只表示 **RESTAURANT_OFFERING / LUNCH**；`requestedCourseAvailability=NOT_VERIFIED`。显式套餐条件按请求餐段核对，午餐课程不能证明晚餐套餐。课程出现也不承诺本次日期人数的套餐库存。

[独立输入](hard-evidence.json)另接入 Sen、Matsumoto、Kaga 的已复核见证原句。Kaga 受 c1744b3d 限定：本店 ID、本次请求、原 result SHA、认证产物 SHA、原句文件 SHA、复核文档 SHA 全部绑定。商家名称／顾客评论仍不能自动证明；人工解释不是产品命名规则，不能套给新 C 产物。

历史 Kaga 缺漏的是较晚价格等事实的引用。@32 不抹掉另一条已引用且有独立支持的 HARD 真值，同时整体 REQUIRED_EVIDENCE 和展示漏引仍失败；身份、来源、当前性及冲突规则保持。

## 第三层：三类问题分列

`conditionEvidenceFindings` 分开报告：

- `SOURCE_TEXT_PRESENT_NOT_ACCEPTED`：有原文，但当前事实／范围／餐段不接纳；
- `CANNOT_INDEPENDENTLY_PROVE`：商家字段不能独立证明，包括名称／评论；
- `PRESENTATION_CITATION_MISSING`：展示漏引。

接受的商家字段和限定人工见证另记 `SOURCE_TEXT_ACCEPTED`、`REVIEWED_WITNESS_ACCEPTED`。Kaga 同时报告“商家字段不能证明”“人工见证支持”“历史展示漏引”。五条旧 S1_UNSUPPORTED 获得独立支持不表示产品引文／餐段显示已修复；产品问题另分支处理。缺证不升级为明确冲突，也不产生新 S0 安全声明。

## 第四层：证明范围和资源

本批是离线机制测试、保存来源字节上的重评及校准；不是新真实模型或 Live。新增模型、网站、Google、完整 Live 均 **0**；浏览器仅本地 Fixture。没有修改 C 的运行分支、输入、脚本、账本或录制。当前运行的累计用量由其原账本维护，本批不回写。

通用离线入口支持 `npm run eval:restaurant:agent-loop:artifact -- <existing.result.json> --hard-evidence <frozen-hard-evidence.json>`。完整参考重评保留原来的后验／网络核验 options，再附加 `loadHardCriterionEvidence(...)`。清单按原产物 SHA 冻结，不跟随结果中的任意路径。当前三份旧清单不能套给新 C；C 结束后是否准备新清单、用 @32 并列评价，由复核者决定。

推送后停止等待复核；不合并，不启动新运行。
