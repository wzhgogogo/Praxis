# F1b 补充审查（对话 A）

Evidence status: draft / not integrated；暴露的离线工程回归，不是 Clean Baseline。用户复核标记时间按原文保留为 2026-10-24 05:55 维也纳；本轮实际执行时间统一记录为 Europe/Vienna，并带 UTC offset。

复核结论是“F1 安全，但未完成审查”。原 1,175 行清单保留作索引，“保护的契约”列不作为覆盖证据。本轮使用实际文件读取失败、原断言、运行后 Git 状态、独立克隆及冻结回归完成补审。原 F1 报告、日志和清单不改写。

工作分支继续 `codex/chore-phase3a-prime-f1`；F1b 是原候选的复核修复。本轮不向 main 合并或推送；B/F5 分析由对话 B 单独交付。

## 1. 三项问题的红灯与绿灯

| 问题 | 有效红灯 | 绿灯与边界 |
| --- | --- | --- |
| 历史绝对路径 | `portability-red.log`：原 C18 Kaga 测试实际读取 `/private/tmp/praxis-checkpoint-c-prep/.../13048623.metadata.json`，被读取检查以 `ERR_TEST_READ_OUTSIDE_REPOSITORY` 拒绝 | `portability-green.log`：测试侧将归档路径的 `.eval-artifacts/` 后缀定位至当前仓库，原外部见证/产品未知/错误展示三项判定通过。Evaluator 实现和历史产物不改；完整默认测试还在下述隔离克隆验证 |
| 回写已提交文件 | `cleanliness-red.log/json`：原 P21c 用例成功后 `git status --porcelain` 出现历史 `region-composition-results.json` 修改；原 SHA 70f78ab6… 变为 92ff58d5… | P21c 结果写入 `mkdtemp` 创建的目录并在 finally 删除。正式三轮 Chromium 均包含原 P21c 用例，逐门禁 Git 状态为空；新 `run-gates.py` 的 restoration 为 0，无恢复或例外白名单 |
| 产品测试依赖评测目录 | `product-fixture-red.log`：原 busy-page 测试读取评测 manifest，被 `ERR_TEST_PRODUCT_EVAL_ARTIFACT` 拒绝 | `product-fixture-green.log`：全部相关产品测试及读取边界控制 69/69；原断言保留，实际读取仅来自仓库 fixtures 和自建临时文件 |

红灯复现之后，仅为清理该次回写，按捕获前原字节恢复历史文件；记录在 `cleanliness-red.json`。正式门禁不执行任何恢复操作。

两个离线测试命令预载 `scripts/test-filesystem-guard.mjs`，检查实际的 readFile、readFileSync、read stream 和 open/FileHandle 路径，包括从 JSON 取出的路径及符号链接最终目标。允许仓库数据、依赖安装资源和测试自己创建的临时目录；不允许任意历史工作树。新增默认测试以一个确实存在的外部文件验证同步、异步、stream 和 open 均拒绝，并验证仓库输入、自建临时文件和预期 ENOENT 行为。

`src/eval/` 保留评测产物读取，使用当前仓库路径。四个指定产品测试范围受归档读取禁令约束。`local-playwright-chromium.test.ts` 的跟踪结果没有评测输入读取；其中 `.eval-artifacts/local-chromium-profile` 只是生产默认配置的期望值，持久化启动被 mock，不读取该目录或个人 profile。原已有的共享价格/日历 fixtures 继续复用。

## 2. Fixture 迁移与来源

按测试实际读取集合迁移 94 份输入：87 份保持精确内容，7 份索引只重定位文件路径。较大 JSON 以确定性 gzip 保存，解压后与原文件逐字节相同，原 SHA 断言仍对解压后的原字节执行。详见 `fixture-relocation.json` 和 `preservation-audit.json`。

输入位于 `src/application/fixtures/restaurant-presentation-evidence`、`src/integrations/tabelog/fixtures/availability`、`src/integrations/restaurant-search/fixtures`。每份输入有相邻 provenance，记录原仓库产物、源提交、SHA、采集日期及其依据；37 份 HTML 加入集中 `PAGES.md`。地区链接 HTML 是历史观察的投影，busy 页按原录制 run-id 的 UTC 日期标记，不能把整理目录日期当成采集日。没有更新网站页面或复制私有 Clean Holdout。

## 3. 并行、计时与真实尺度

`browser-read-fixture.test.ts` 按录制回放、请求绑定、选项、日历、搜索控件、Tabelog、页面控件、Web workspace、TableCheck、稳定性和发现组装拆成 11 个测试文件。共享原浏览器/本地 HAR 构造放在 `browser-read-test-fixtures.ts`，文件并发限制为 4。`browser-split.json` 保留旧文件区段到新文件的映射。

原 Chromium 137 个运行名称多重集完全一致；旧大文件的 483 处断言调用按方法计数完全一致，原业务断言和参数化分支保留。新增默认文件读取检查 1 项，默认 F1 的 1023 项变为 1024 项；本轮没有删除用例。

| 机制 | 调整 | 保留的真实尺度 |
| --- | --- | --- |
| 候选导航截止 | `model full-page OPEN_LINK...` 的 budget 分支：2 秒预算/5 秒响应同比变为 1 秒/2.5 秒，耗时上限断言同比缩放 | 同一用例 slow 分支仍为 15 秒预算/6.5 秒真实响应，要求 elapsed ≥6 秒且到达目标页；P21 的 6.5 秒预检回归也保留 |
| Provider 来源观察 | 唯一的真实 31 秒观察及 45 秒 provider 预算保持 | `real Chromium TableCheck source observation completes inside the current 45s provider window`：AVAILABLE、≥30 秒、SNAPSHOT 与单个来源时段断言均保留 |
| 页面稳定性/网络 | 生产运行时固定等待与 DOM/网络行为保持，收益来自文件并行 | C3/C3b 等真实浏览器稳定性和 source-health 用例保持原尺度 |

首次完整并行预检查 137/137，84.820 秒；不计入正式三次样本。未观察到端口或浏览器资源冲突。

| 门禁 | 用例数 | 完整 wall time（秒） | 三次中位数（秒） | 结果 |
| --- | ---: | --- | ---: | --- |
| `typecheck` | 不适用 | 0.426548 | 不适用 | PASS |
| `arch:check` | 不适用 | 0.310596 | 不适用 | PASS |
| `npm test` | 1024 | 20.254150 / 20.469752 / 20.745268 | 20.469752 | PASS |
| `build` | 不适用 | 0.403174 | 不适用 | PASS |
| `test:browser:fixture` | 137 | 85.055580 / 85.092796 / 85.078675 | 85.078675 | PASS |

九次执行全部 PASS，fail/cancelled/skipped/todo 均为 0，每次 `gitStatusAfter` 为空、restoration 为 0。全部原始日志 SHA 已核对。Chromium 中位数 85.078675 秒，满足 ≤150 秒；对比 F1 的 276.823612 秒下降 69.27%，对比批次 0 的 307.573510 秒下降 72.34%。默认中位数 20.469752 秒。计时使用完整命令 wall time，串行采样，不剔除慢样本。

| 层级 | 批次 0 | F1 | F1b |
| --- | ---: | ---: | ---: |
| 单元/契约 | 506 | 505 | 506 |
| 组合 | 196 | 196 | 196 |
| 评测 | 327 | 322 | 322 |
| 真实 Chromium Fixture | 138 | 137 | 137 |

原 8 个非默认探针仍未运行、不计上述分母。默认新增唯一一项为文件读取边界测试，正式全部运行名多重集证明无删除；详见 `browser-name-preservation.json`。

## 4. 冻结、回归与评价边界

候选冻结提交 13429336；`input-freeze.json` 共 4528 项，SHA-256 `c9b90ca97607992955209356a1c5912eac8655785076027da0356d326d3568f7`。独立校准冻结 1035 项，SHA-256 `8770f9a1175ec3f8c146999ecc93b31309a4df1032785165d2a22b3f94461b02`。所有输入、外层脚本与配置在正式运行前提交，运行中不改。

194 份原有非测试 TypeScript 路径/字节不变；新增 TypeScript 仅为共享浏览器测试 fixture helper。统一计数脚本原字节复用，两个站点目录 3864、source-packs.ts 473，不以 fixture 移动抵扣源码减少。Prompt、Schema、Gold、Evaluator、Guard 和资格不变。

- 端到端现实结果：本轮未运行 Live，不声明当前库存、交付率或现实写入结果。
- 逐环节：本轮新运行真实本地 Chromium 137/137；缓存翻月 69/69、选店 5/5；独立评测器校准 22/22，正常声明 20/20，两个历史中断未评价保持。自动输出先落盘，之后才加载原标签比较；详见 `regressions/`。真实模型调用为 0。
- 严重程度：历史中断的未评价项保持，不从离线全绿推导新 Live 的 S0=0。
- 归因：仅归因于测试数据可移植性、归档解耦和文件并行；不声明产品找店更快。

初次迁移预检查暴露原 gzip 输入被重复压缩，`product-relocation-precheck-failed.log` 保留失败，修复后原断言通过。默认预检查发现 macOS `/var` 与 `/private/var` 在尚未创建文件上的路径归一问题，`default-precheck.log` 保留，修复后 ENOENT 断言及全默认测试通过。另一次局部校验误在受限沙箱启动 Chromium，出现 EPERM/SIGABRT；按本地浏览器权限重跑 `filesystem-controls-green.log` 27/27，该环境失败不作为代码红灯或资源冲突。

新增模型、Google、来源网站、见证 GET、完整 Live、环境 Live 重跑均为 0；预算账本无消耗事件。

## 5. 隔离克隆与停止点

独立 Git 深度一克隆的测试提交为 `03ffa186`，与五门禁的 `13429336` 之间仅新增克隆验证产物/脚本，src、测试入口和配置字节相同。复制本地 node_modules 并解引用符号链接，没有下载包。实际默认测试于 2026-10-24T00:23:02.990567+02:00 启动，1024/1024、21.139257 秒，退出 0，运行后 Git 状态为空；原始日志及 SHA 见 `portable-clone/`。

macOS sandbox 拒绝测试进程及后代列举 `/Users`、全部历史 `/private/tmp` 工作树目录和读取其中的文件。独立于 Node 读取检查的 OS probe 对真实存在的 package.json 得到 EPERM。这里采用数据不可访问的隔离克隆：宿主目录保留，存在性元数据仍可见；不是物理删除旧目录，也不是另一台机器或 Linux 的运行结果。

第一次预检查误要求 existsSync 为 false，未启动测试就停止，见 `clone-preflight-failed/`；原冻结脚本 `run-portable-clone.py` 仅保留为这次失败的审计配置，当前准备入口为 `verify-portable-clone.py`。修正后的第一轮默认 1023/1024：截图用例启动 `/Users` 下的 Chromium 后，ICU 资源被隔离规则拒绝，见 `clone-browser-install-failed/`。随后只把已有 Chromium headless-shell 的 20 份安装资源复制进克隆 node_modules/.cache，设置 PLAYWRIGHT_BROWSERS_PATH，再运行相同默认测试全绿。测试数据、断言及隔离规则均保持；源安装包 SHA 和环境见 `portable-browser-runtime.json`。

克隆外层修正与浏览器安装配置分别在运行前提交冻结：`portable-clone-freeze.json` 4530 项和 `clone-default-freeze.json`。它们补充宿主隔离验证，不改写五门禁的原冻结或样本。全套正式数据 SHA、浏览器安装资源与克隆数据在运行后复核未变。

主工作区原 9 份用户文件、HEAD 和 Git 状态与批次 0 快照一致，见 `primary-preservation.json`；净工作区门禁在独立 F1 工作树与独立克隆执行。

F1b 补审完成，停在停止点 1 等独立复核；不进入 F2 或 F5 实现，不代为宣告 B/F5 分析完成。交付时间 2026-10-24T00:24:08.831212+02:00（Europe/Vienna）；沿用用户已授权的工作分支推送，main 保持不变。
