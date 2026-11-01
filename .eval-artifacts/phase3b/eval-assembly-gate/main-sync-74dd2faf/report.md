# 组装门禁：同步获批 main 后的复验

- 状态：五门禁全绿，候选待独立复核；未合 main。
- 基线：远端 main `74dd2faf6ac8ef99492c86eaf3d57d7244b1745c`，已由 fetch 与 ls-remote 独立核对。
- 原候选：`02e632e3ce93d8c335b9f23a8fe8f69eee8ffba5`；实现 `da92154c`。
- 原承诺：C 调度修复先合 main，再同步本分支重跑五门禁。此次通过 main 取得修复，未从 C 工作分支复制文件。

本切片只同步已获批基线并补齐本分支的五门禁证据，不新增产品修复或能力评测。唯一历史红项的原默认输出、干净 main 三次对照、9 项门禁检错及其他原始证据保持原字节，见[上一轮报告](../stop2-report.md)。历史结论不覆盖；本轮单独归档。

## 同步边界与检查点

代码自动合并无冲突，六处冲突均为状态或历史导航；保留双方历史正文，文档元数据沿用传入 main。当前产品源码与 main 相同，原组装门禁、白名单、SF 退役、机械导入清理和 Web 注释与原候选相同；A 新增 G6 测试及五文件输入原样取得。详见[合并完整性](merge-preservation.json)。

| 主要失败类型 | 实际检查 | 既有检错证据 | 未覆盖边界 |
| --- | --- | --- | --- |
| 同步时覆盖已复核产品或 A 输入 | 产品/脚本与 main、A 五文件逐字 SHA 比较 | 合并完整性记录 | 不重新评估产品策略 |
| 新入口绕过确认的能力核心 | npm run arch:check，原清单不扩展 | 原 TS/MJS/G1/陈旧等 9 项隔离对照 | 未确认的新核心、计算路径和传递调用 |
| 原调度问题仍污染默认验收 | 实际完整 npm test，保留原断言 | 旧 main 同命令失败和 C 原修复证据 | 非本轮新增调度修复 |
| 测试运行改动输入或工作树 | 每项前后 clean status、HEAD 和冻结 SHA 核对 | 本轮逐项 receipt | 不把干净状态替代行为通过 |

## 执行与停止条件

在单一干净提交上顺序运行 `npm run typecheck`、`npm run arch:check`、`npm test`、`npm run build`、`npm run test:browser:fixture`。每项前后检查 HEAD、git status 和[冻结输入](source-inputs-sha256.json)，保存完整原始输出和真实退出码；失败停止，不重试、不过滤、不豁免，不扩大白名单。全绿后仅补证据和必要状态文档，推送本工作分支交独立复核，仍不合 main。

全部是离线测试及本地 Chromium，不运行 Live、不调用真实模型/Google/餐厅网站或见证请求，不读取、加载或暂存 `.env`，不新增 G2 或其它评测任务。时间记录使用维也纳 CET（UTC+1）。

## 本轮实际结果

冻结并执行的提交为 `b5e804b808326bd8b4938a3e10acf735a8590407`，父提交分别是原候选 `02e632e3` 和获批 main `74dd2faf`；共 729 项输入。五项各执行一次，前后工作树为空、HEAD 和输入 SHA 不变，44 份原组装门禁产物原字节保留。完整开始/结束时间、真实退出码、数量、日志及解压字节 SHA 见 [gates.json](gates.json)。

| 实际命令 | 结果 | 外层耗时 | 完整原始输出 |
| --- | --- | --- | --- |
| npm run typecheck | PASS，exit 0 | 0.508s | [typecheck](verification/typecheck.log.gz) |
| npm run arch:check | PASS，exit 0 | 0.229s | [arch-check](verification/arch-check.log.gz) |
| npm test | 1308/1308，exit 0 | 30.154s | [test](verification/test.log.gz) |
| npm run build | PASS，exit 0 | 0.503s | [build](verification/build.log.gz) |
| npm run test:browser:fixture | 187/187，exit 0 | 130.747s | [test-browser-fixture](verification/test-browser-fixture.log.gz) |

两套测试均失败 0、取消 0、跳过 0、todo 0。原调度测试由完整默认入口实际执行通过；不以单文件通过代替整套，也没有重复尝试、过滤或失败豁免。本轮并未独立重做 C 的产品故障关闭，其修复证据仍见 [原调度报告](../../fixture-scheduling-events/report.md)。

## 最终核对与签收边界

新 G6 入口通过同一 arch:check；原 25 核心和 24 条组件例外没有变动，没有给 G6 增加组件例外。TS/MJS 直接导入、G1 例外删除、陈旧/未知键和正常控制的 9 项检错证据复用上一轮，扫描及规则源码原字节未变，不为同步基线重复构造相同变异。

当前文档和代码的退役引用再次以 rg 核对，命令、排除的历史目录及结果见 [retirement-reference-check.json](retirement-reference-check.json)。main 新增的 TableCheck handoff reader 未自动扩入已复核的 25 核心名单；当前 src/eval 没有直接引用它，rg 结果同时保留。确认清单之外的新模块仍需复核维护，本轮不自行改变核心范围。

[最终完整性核对](final-integrity.json)绑定产品/脚本、原门禁实现、A 五文件、原产物及冻结输入；[交付 SHA](evidence-sha256.json)覆盖本轮报告和所有机器记录、压缩日志。gzip 无损保留原始输出，不裁剪空行或失败记录。此次同步中传入 main 的历史日志空白也原样保留，新增差异按 main 基线检查，不为格式清理改写他人证据。

原来未完成的“五门禁全绿”已取得本分支实际证据；停止点 2 的门禁实现、白名单、SF 退役及检错要求均已交付，仍待独立复核，不等于 main 已合入或 Live 能力签收。真实模型理解、自由文本质量、当前网站兼容性、未确认核心、计算路径和传递依赖仍不由此离线门禁证明。归档后执行输入不再改动，只推本工作分支，然后停止。
