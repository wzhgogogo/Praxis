# F2③ 停止点2复核补丁：静态资源豁免

- 状态：frozen regression；用户授权五门禁后合入main。
- 复核任务日期：2026-10-25；运行时间使用用户指定CET（UTC+01:00），见gates/gates.json。
- 分支：`codex/feat-phase3a-prime-f2c-pacing`；受测 `d7a3170f42dbdc40b1a1975294e9355bbd76602d`。

## 修复与边界

节奏租约仅用于Guard已经准入的document、xhr/fetch、它们的原生重定向/预检，以及Google Places和逆地址API。script、stylesheet、image、font、media等只发送计数消息，不加入来源仲裁，不持有租约、不延长来源间隔。原requests/waitMs输出字段、1000ms默认间隔、两运行上限和预算均不变。

Google API origin与来源静态origin分别处理：位于policy.staticResources的origin不再因此获得租约。计数是所有已发起的来源请求尝试，未把静态资源从访问次数中删除。没有修改产品层、共享Browser/restaurant-search非测试文件、Prompt、Schema或Guard。

## 有效红绿

[红灯](red.log)：两个真实子进程各启动Chromium、生产Guard，读取同源页面及20个CSS/JS。每运行21次来源访问，旧实现21次租约；“静态资源不得取租约”的独立断言期望1次，实际21，失败。

[绿灯](green-final.log)：两页各21次访问仍完整计数，每运行仅1次文档租约；40个静态请求不取租约，等待只来自文档，同源文档间隔达到fixture配置40ms。原有FIFO、单运行等待0、三种中断清理、原生302及Google Places/逆地址fixture传输均通过，共7项。没有改变生产默认1000ms，未发生端口/浏览器资源冲突。

## 耗时重算

旧输入没有静态/动态实测拆分。本次保持总请求数不变，明确加入资源类型假设，不能将其冒充Live统计。工作情景每运行Tabelog与TableCheck各12次请求，其中各2个document、2个dynamic、8个static；Google6次API。预计等待由66秒改为30.8秒/运行。

| 规模 | 旧假设 | 新规则估算 |
| --- | ---: | ---: |
| 6次未来F5 Live＋15次回放 | 23.8分钟 | 约22.0分钟 |
| 15次全新Live＋15次回放 | 56.0分钟 | 约51.3分钟 |

[重算输入与结果](estimate/estimate.json)。15次全新Live超过当前8次额度，只作规模参照。完整录制齐备仍是前提；deadline和健康重试压力情景仍超过1小时。未新增实际测量。

## 五门禁

| 门禁 | 结果 | 单次秒 |
| --- | --- | ---: |
| typecheck | PASS | 0.409459 |
| arch:check | PASS | 0.193899 |
| npm test | 1028/1028 | 20.615881 |
| build | PASS | 0.427686 |
| Chromium fixture | 148/148 | 84.814083 |

[日志](gates/gates.json)：每项前后Git status为空、恢复0；[576项冻结](freeze.json)前后一致，输入和编排先提交。新增真实模型、Google、餐厅网站、Live、环境重跑均0。

本项交付提交后依授权合入并推送main，精确SHA和ls-remote记录归档在本回合总报告及合入回执。随后继续F2④b补充，不等待下一次复核。
