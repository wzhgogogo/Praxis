# G6 追加三槽：本地预检停批

2026-11-04 CET（UTC+1）。用户已批准额度，**D4/D6/D8均NOT_RUN**；公开GET、真实模型、Google、网站、Live、环境重跑新增全部0，未加载`.env`。未合main。

## 已完成同步与批准记录

G6原分支4c8761ae已合入最新main75ba1605，合并20b7624b。仅4处历史文档冲突，双方记录全部保留；两个父分支的830条账目原值保留。批准行新增后831条，累计仍Live11/32、模型401/1600、GET298/425，开发Live11/14、模型160/400、GET43/58。留出集18 Live/108 GET预留不改。详见authorization.json、ledger-preservation.json。三个新包与SHA已保存，原包未覆盖。

## 首个产品阻断

原测试：`src/eval/restaurant/agent-loop/g6/runner.test.ts` 的 `G6 Runner serializes a user-named identity from actual Runtime State into the evaluation request`；真实createLiveReadAssembly/Runtime，CONTROL_FALLBACK只替换模型传输与来源I/O。

原能力断言在新增统计断言之前失败：首轮NEEDS_INPUT，无已展示店，后续预订回合没发送，request.named缺失。原测试和fixture、G6 Runner已全部恢复为合并20b7624b原字节，重跑仍同样失败（original-regression.log.gz）；不是新统计断言制造的红灯。全部原断言保留，无skip/todo/降断言。

执行原件（original-execution.tar.gz）显示：同店页两次成功到达；旧人数选择器`select[name*='party']...`命中故意隐藏的旧模板控件，`selectOption`在5000ms内无法操作。产品`src/infrastructure/browser/browser-task-executor.ts:1448`新增复用会话分支在非导航的BROWSER_RUNTIME_FAILED后也执行close(RUNTIME_FAILURE)。随后SNAPSHOT_ERROR为“Local Playwright Chromium session is closed”，无法进入读取页面/选择公开Date与Guests控件的纠正路径，查位最终UNKNOWN/BROWSER_RUNTIME_FAILED。

这与G3的“控件失配回到观察”能力冲突。建议归属C（会话复用的会话终止边界）并与B核对既有控件回退；A不改产品、不删除hidden模板、不预填证据，也不改评分器来通过。原源HTTP日志中其他无构造响应入口的失败不能单独证明产品故障；这里以同店页成功后的隐藏控件失败→会话关闭→snapshot失败为直接证据。历史W1真实超时根因仍未知，本次不是其线上因果证据。

## 未完成项与验证

逐请求记录已由main提供；本轮新增统计、重新认证、高峰/非高峰Live和D8链接均因上述前置阻断未执行。原统计草稿和日期CLI改动已撤回，未留下未经验证的执行路径。若11-05后才恢复，日期CLI仍须按实际新包日期核对而非旧11-11默认值；当前11-04包有效，不能把本条当作已修。

首次探索red.log.gz还含日期CLI检查红灯；integration-block.log.gz保留加捕获钩子的定位复跑；它们与恢复原代码后的正式original-regression.log.gz分开。新增诊断文件尚未落盘本身不作为有效红灯。

净树候选 `d8264221b79e94596ee789c3ded9ae7ff6914252` 一次完整门禁结果：typecheck、arch:check、build通过；默认1423/1423；浏览器原套件189/189；G6组63/66，3项失败，因此 `test:browser:fixture` **FAIL（exit 1）**，五门禁未全绿。严格G2 5/5、12页PASS。六项前后git status均为空，无重试/跳过/取消；逐项原始压缩日志与gates.json保存。verification-controller只为收齐清单而在已知红灯后继续跑严格G2，整体状态明确BLOCKED，不把控制器收集完成当全部通过。

| 能力 | 原测试 | 当前首偏离 / 归属 |
|---|---|---|
| 改名后观察 | capabilities.test.ts / G6 capability RENAMED: observed controls reach current response-bound presentation | 预期PRESENT_RESULTS，实际NEEDS_INPUT；与控件回退失败同症状，具体同因待产品方确认 |
| 控件失配回到观察 | capabilities.test.ts / G6 capability CONTROL_FALLBACK: observed controls reach current response-bound presentation | 预期PRESENT_RESULTS，实际NEEDS_INPUT；同上，建议C与B共同核对 |
| 连续对话绑定首店 | runner.test.ts / G6 Runner serializes a user-named identity from actual Runtime State into the evaluation request | 本报告原件已确认旧隐藏人数控件失败→close→snapshot失败，request.named缺失是后果；建议C修复会话终止边界 |

main已通过的门禁没有A未合main的这组G6用例，故不与B/C发布回执冲突。A G6此前01922aab的66/66回执仍保留在request-timeline-20261103/g6-gates，未覆盖新来源会话复用路径。

源码和三个原测试相对合并20b7624b逐字不变，产品目录相对main75ba1605零差异。最终只归档报告/原日志，不改已测源码。git diff --check通过，最终工作分支推送并核对；停批原因是产品归属边界，获批额度保留未使用，没有安排未来自动运行。
