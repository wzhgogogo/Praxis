# 种子前开发检查运行冻结（2026-11-11 CET）

当前可执行开发配置，非held-out签收。产品f385191e已复核合入；仅eval选择源码b8af6960净树type/arch/default1588/build/G6 154通过，扫描0。原产品Chromium279/strictG2全12复用；eval变更不涉及产品或浏览器执行。原有“只许certify-only用cases”的断言按本次用户明确授权更新为原文件/清单仍必需，未删除安全检查。

完整原文与R2清单仍先承诺/逐字回填校验；SHA保持8bf81a78…/e0aabdf1…。本次仅--cases p3b-holdout-03,p3b-holdout-07 --repetitions 2，按原清单顺序；执行计划SHA进入input-hashes与续跑一致性检查，第三次及其他用例不会执行。只读原文件的权限仅交运行器，不人工打开题面或清单。

发布后净树main完整SHA作为--source-sha；既有run-holdout.ts，PRAXIS_RUN_HOLDOUT_LIVE=1，凭据仅--env-file（原.env）。--commitment使用commitment-r2.json，--budget使用独立active-budget-seed-dev-20261111.json，--output .eval-artifacts/phase3b/seed-dev-20261111。不传--resume/--review。见证各1GET、后验至多2、每例一次体检（原60秒窗口，失败/中断恢复前再做）、5秒GET间隔、轮间随机120–240秒和三类录制保持。既有网络分流：浏览器代理开启、Google代理开启、DeepSeek直连，型号deepseek-v4-flash。

任何停批后不改运行工作区、不自行续跑或补评；独立工作区推证据分支codex/seed-dev-evidence-NN并停下。PENDING_REVIEW遵循原规则可继续，S0或其他缺证停批。正常完成也推证据并报告；D02十二月八人时段待用户，预留两次Live。本次最多4计划运行，不自动花环境重跑额度。
