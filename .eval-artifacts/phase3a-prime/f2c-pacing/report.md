# F2③ Runner 节奏与并行

- 状态：frozen regression / draft not integrated；工作分支待复核，不合 main。
- 日期：2026-10-24（Europe/Vienna）；精确时间见 gates/gates.json。
- 分支：`codex/feat-phase3a-prime-f2c-pacing`，基于新 main `e0e1037e127bd0264d85c6ab27708179c3f7766f`。
- 受测提交：`dc9f12efac1d5fbef2d06db8fff40c2b1520dd6d`。

## 范围与实际入口

新批量入口为 `node --import tsx src/eval/restaurant/agent-loop/runners/run-paced-hybrid-read.ts manifest.json output-directory`。清单包含 `runs: [{id, args}]`、可选 `minimumIntervalMs` 和 `originIntervalsMs`；args 使用原单运行 CLI 参数，运行前冻结清单。每个子进程仍执行原 `runHybridLiveRead`，保留原 Live 权限开关、预检、500秒及来源预算。未配置批量入口时，原单运行命令不变。

父协调进程在127.0.0.1临时端口提供共享仲裁，随机本地会话令牌注册，只交换run ID与origin，不传查询值、请求头或密钥。固定两个正式运行；第三个进程FIFO等待，在其预检和整单预算开始前放行。不存在磁盘锁，连接断开即删除该运行的排队、来源身份和持有租约。

同origin只有一个参与运行时，立即放行其请求，包括自己的并发请求，节奏等待严格为0。两个尚未结束的运行都使用过同origin后，共享串行请求租约，前一响应结束后再计最小间隔。来源成员身份保留到运行结束；不同origin互不等待。

默认间隔为每origin **1000ms**，可由清单覆盖。依据是并发评测采用保守的礼让间隔，避免两运行突发；这不是站点公布限额或Live验证的安全频率。响应完成后计时比请求开始后计时更保守；吞吐会下降，等待照常消耗现有来源和500秒预算。没有改预算数值。单运行只有本地协调RPC开销，没有人为节奏等待。

评测进程装饰现有Playwright启动接线：原Guard已经准入的route.fetch，以及已准入的原生重定向/预检继续命令，均获取同一个协调器租约。Google/来源fetch也接入，模型传输不加入来源节奏组；来源预检在该进程接线范围。没有修改共享Browser、restaurant-search或Guard源文件。

每运行的 `.pacing.json` 记录每origin发起的请求尝试数和节奏等待毫秒；`batch.json` 保留退出码及断开后的统计。计数不是成功响应数。

## 红绿灯与限制

[有效红灯](red.log)：移除间隔但保留仲裁，两个真实子进程访问70ms响应的本机来源，实测间隔88/77/70ms，小于配置200ms。首次150ms响应掩盖120ms间隔的预检不敏感，保存在red-initial-insensitive.log，不作为红灯；调整fixture时序后先提交再运行。

[绿灯](green-processes.log)：五项通过，同源四请求间隔≥200ms；单运行两请求等待0；第三运行排队；SIGTERM、模拟timeout与外层AbortSignal使真实子进程断开后，另外两个继续且持有租约归零。500秒正式Runner的留档语义复用F2①既有回归。

[正式传输接线](green-transports.log)：真实Chromium/生产Guard经普通页面和原生302访问/public、/redirect、/final，计3次；fixture Google传输计1次，两个origin等待均0。无真实Google请求。未验证当前网站并发吞吐或库存，不用合成结果宣称Live能力。

类型预检发现exactOptionalPropertyTypes下计时器清理不能赋undefined，修复一次后通过，前后日志保留。正式五门禁没有红灯；未出现端口或浏览器资源冲突。

## 五门禁

| 门禁 | 通过数 | 单次秒 |
| --- | ---: | ---: |
| typecheck | PASS | 0.422748 |
| arch:check | PASS | 0.192095 |
| npm test | 1028/1028 | 19.434549 |
| build | PASS | 0.416690 |
| Chromium fixture | 147/147 | 84.462761 |

[原始日志](gates/gates.json)：每项前后Git status为空，恢复0；[572项冻结](freeze.json)前后相同。单次结果，不称中位数。

## 调用与后续

新增真实模型、Google、餐厅网站、Live和环境重跑均0。产品层、Prompt、产品Schema、Guard规则零改动；站点3864行、source-packs.ts 473行不增。仅推送本工作分支，直接继续F2④b；不合main。
