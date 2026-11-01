# 评测组装门禁：停止点 2

- 时间：2026-11-01 CET（维也纳，UTC+1），09:04 开始。
- 状态：`draft / not integrated`，实施和验证中，未合 main。
- 分支：`codex/chore-eval-assembly-gate`；停止点 1 `8743f56b` 已复核通过。
- main 已 fetch 核对，仍为 `6db445ea9afdbe5debdc60efc1107f768434c555`，已包含于当前分支，无需重放或覆盖 A/B/C 文件。
- 本切片：使用现有 arch:check 扫描/依赖判定，禁止 src/eval 的 TS/MJS 值导入复核确认的25个能力核心；精确组件白名单严格解析并检查陈旧项。保留既有独立 Evaluator 规则。
- 结束条件：SF退役前替代回归通过；旧门禁漏拦反例和修复后的隔离红绿灯；五门禁在干净提交上全绿；只推工作分支，停交复核。
- 实际模型、Google、餐厅网站、Live及见证请求均0；不读取或暂存 .env。依赖仅从本机 npm 缓存恢复。

## 已批准范围与替代覆盖

复核附件确认核心名单、纯类型豁免、逐文件逐核心白名单；本次用户另批准 SF 四文件、npm命令及两处当前说明退役。保留 named-retrieval-simulation 及其测试，按真实直接导入点登记组件用途；其测试没有直接核心导入，不制造会被陈旧检查拒绝的虚假条目。

退役前执行（源码仍为8743f56b）：

```bash
node --import ./scripts/test-filesystem-guard.mjs --import tsx --test src/harness/restaurant-harness.test.ts src/application/restaurant-message-handler.test.ts src/server/local-web-server.test.ts
```

结果：77/77通过，退出0，耗时24016.809459ms。原始输出：[pre-retirement.tap.log](pre-retirement.tap.log)。首次默认沙箱拒绝创建日志，测试未启动；上面结果来自同一离线命令在获准工作树权限下的实际运行，环境失败不计业务红灯。

| 退役行为 | 仍存在并已通过的替代入口 | 证明边界 |
| --- | --- | --- |
| 完整请求→候选调查/选择→授权检查点 | `src/harness/restaurant-harness.test.ts:28,38,107`；`src/server/local-web-server.test.ts:880` W01及相邻W02 | 保留已有当前Runtime/Agent/授权前检查；不证明Live或新增来源能力 |
| 缺字段追问/补齐 | `src/application/restaurant-message-handler.test.ts:48,103`；`src/server/local-web-server.test.ts:542,605,1470` | 缺/未知人数保留NEEDS_INPUT、完整请求续行；不从无结果推导正确追问 |

## 实施与检错计划

| 主要失败类型 | 实际入口/断言 | 检错证据（待执行） | 未证明边界 |
| --- | --- | --- | --- |
| TS/MJS评测直接构造能力核心 | npm run arch:check的扫描及evaluatorImportViolation | 旧门禁漏拦→修复后指出违规文件和模块 | 任意计算路径/跨目录注入不是完整调用分析 |
| 文件白名单被当成任意模块豁免 | 精确file+core匹配，真实值导入识别 | 只允许登记对；纯类型正常控制、其他模块仍拒绝 | 白名单用途仍需人工复核 |
| 未知键/不完整说明/陈旧例外 | 严格JSON解析、实际值导入集合比对 | 未知键与陈旧项必须失败，正常清单通过 | 不以描述文本充当真实能力证据 |
| G1固定页绕过被误用于整能力签收 | core-adapter确切条目与Test Skill单条签收规则 | 删除G1例外产生目标门禁红灯 | 页面取得整组装由A补，不修改其测试行为 |
| SF退役导致原合同覆盖丢失 | 既有harness/application/Web回归 | 退役前77/77；退役后默认套件待跑 | 不把旧Fixture当当前生产来源组装 |

## 实际修改

1. `scripts/arch-check.ts` 保留现有扫描/相对路径规范化/违规汇总流程，额外扫描 `src/eval/**/*.mjs`；`.js` specifier 归一到 TS，`.mjs` 保留。检查实际值导入对并拒绝清单中的陈旧项；无第二个 Runner 或检查框架。
2. `src/eval/shared/evaluator-import-rule.ts` 保留独立 Evaluator 的既有规则，加入复核确认的25个核心、纯类型识别和严格组件清单解析。`import {}`、未使用值、re-export、字面量动态 import/require 均受禁；MJS没有TypeScript类型声明，名为type的默认值绑定不能伪装纯类型。
3. [组件白名单](../../../src/eval/assembly-bypass-allowlist.json) revision1：24个精确文件/核心对，类别仅组件评测，每项都有proves/cannotSignOff。无“其他：已走组装”的整单Runner例外。混合native测试文件的两个例外只说明直接构造的三个组件控制，不替同文件的factory场景签收。
4. `run-hybrid-live-read.ts` / `run-native-fixed-source-model.ts` 按批准清理类型/未用值导入；扫描另发现 `source-stage-probe.ts` 的Google类也仅类型使用、native composition测试的LiveBrowserAvailability未使用，同样机械清理。两份Runner、该helper和两份测试去注释转译输出均与8743f56b逐字相同；未改任何原有断言、业务选路、Prompt、Schema、State、TaskDefinition、站点或source-pack。
5. 删除批准的SF四文件和npm命令；`npm test`原glob原样保留，named-retrieval-simulation及其测试原样保留。Eval Skill、eval README各只删除指定的一行；其他两处遗留当前引用已向用户提出额外文档范围问题，未获答复前不改。
6. Web G1和B1夹具仅改注释，如实说明手工业务Port/取页器/evidence/cache；没有给它们增加生产组装证明。G1整组装归A；B1认既有ordinary assembly控制。
7. Test Skill仅新增一条：门禁/组件清单含义、能力签收必须来自src/eval中实际生产组装且通过门禁的入口、.eval-artifacts仅组件/诊断证据。历史脚本不扫描、不改写、不追溯改判既有结果；按新签收规则交复核者判断适用范围。

定向规则和既有Evaluator回归：141/141通过（含独立性原有回归），退出0；日志为[targeted-rules.log](targeted-rules.log)。旧门禁分别漏拦TS和MJS，退出均0；日志为[before-ts.log](red-green/before-ts.log)、[before-mjs.log](red-green/before-mjs.log)。这是“期待拒绝却没有拒绝”的修复前反例，不能当作成功拦截。

五门禁、修复后的隔离红绿日志与最终Skill diff在完成后补齐。现有停止点1报告和历史产物保持原样；全部故意违规只在临时工作树，工作分支不放置违规文件。
