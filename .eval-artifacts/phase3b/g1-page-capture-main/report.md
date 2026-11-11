# G1 页面获取修复：已审候选的 main 发布验证

2026-11-01，维也纳 CET（UTC+1）。状态：**发布验证全部通过**。本报告记录发布前候选；确切 main SHA 和推送成功以发布合并及最终 `ls-remote` 回执为准。随后待命。

用户批准 B `a7860924`，要求同步最新 main 并五门禁、严格 G2 全绿后合入。同步时远端 main 为 `6db445ea9afdbe5debdc60efc1107f768434c555`，已是本分支祖先。B 快进继承 A 的原集成 `5683dcfb`（调度修复 `5760b3f1`）；无冲突、无手工改写 A 文件。全部门禁使用同一已提交候选 **`d99a0c2bc782550703dee01044ee7468424980d2`**。

## 范围与原修复证据

G1 唯一产品文件仍是 `google-then-website-facts.ts`：`capturePagesOnly` 时不以原请求缺口决定是否读取已绑定官网；取页不运行额外事实判断。不带该标志的普通读取不变。Tabelog、TableCheck 分支及身份、run、Guard、取消、追问独立预算保持原行为。State、TaskDefinition、Prompt、Schema 均无变化。

与获批 `a7860924` 相比，全部 src/scripts/web-skills、依赖清单及配置只有 A 的 `browser-fixture-scheduling.test.ts` 不同；其字节精确等于 A `5683dcfb`，SHA-256 `ee79a1d8572b5f8d19464c095271525bef31bc4b794fbb8195d4a7e60d1dd744`。A 用真实生命周期 TEST_START 消息同步受控时钟，原断言和 60/180/600 秒限制保留。B 不改 A 源码或断言，不导入 A 后续 G6 评测文件。

沿用且原样保留[原修复报告](../g1-page-capture/report.md)、[B 交付与对照](../g1-page-capture/known-a-scheduling/report.md)及[A 所有者修复证据](../fixture-scheduling-events/report.md)：A `27cf175c` 原 P4 未修时 NO_BOUND_PAGE、问答模型替身 0 次，修后 ANSWERED、替身 1 次，并逐字引用同店“至少四人”原文。该因果控制和 114 项相关回归、2 项真实 Chromium Guard 控制本批未重复制作；输入和产品字节未变。本批为离线发布验证，不声称新的真实模型或当前网站质量。

## 同一候选的完整门禁

运行时间 09:59:06–10:02:12 CET；每项前后 `git status --porcelain` 均为空。无过滤、skip、todo、重试、失败豁免或恢复已提交文件。

| 检查 | 结果 | 墙钟秒 |
| --- | --- | ---: |
| `npm run typecheck` | PASS | 0.559 |
| `npm run arch:check` | PASS | 0.242 |
| `npm test` | 1288/1288；失败/取消/跳过均 0 | 29.636 |
| `npm run build` | PASS | 0.494 |
| `npm run test:browser:fixture` | 187/187；失败/取消/跳过均 0 | 130.203 |
| `PRAXIS_G2_REQUIRE_PASS=1 npm run test:dom-change` | 5/5 测试，12/12 页面 PASS；各页 lost=[] | 24.181 |
| 既有 HARD 字节核对 | 44,197 字节逐字节一致 | 0.144 |

Chromium 完整入口先 G2 独占，再其余文件并发 4；入口内 G2 180 秒与每阶段 600 秒限制不变。外层 Python 仅为整个 Chromium 命令保留 720 秒以接收 G2+原保护的输出和清理，本次 130.203 秒完成。严格 G2 的 12 页详情见 [逐页结果](strict-g2-pages.json)。HARD SHA-256：`9a3298bc5e004b99e41d80713e8913b68c336cfa594f6eb60599e310ee3fb633`。

原始输出及逐项时刻、退出码、摘要、净树证据见 [gates.json](gates/gates.json)，七份日志未改字节。用户转达的复核环境曾被 600 秒截断、随后 187/187 通过的事实保留为历史；A 的调度同步修复不表示已定位或解决那个浏览器挂起原因。

## 冻结、归档与账本

727 份输入在运行前提交，运行中和完成后逐份 SHA 不变；冻结文件 SHA-256 `55be532de8566eaeac2affeb6626f152434e01164fb75c1248efc571cd1baa12`，外层脚本 SHA-256 `6e2b7971ce48cc2f3a5f508b07eea9441021906f29ae98c30c6b6fbbfad90c53`。见 [冻结清单](input-freeze.json)、[集成归属](integration.json)、[完成后源码核对](post-gate-source-check.json)。门禁后只增加报告、日志归档和文档/账本记录，不改被测输入。

账本按 id 保留原 504 条（包含 B 的全部 503 条及 A 的零调用行），仅追加本次零调用行至 505；累计仍为模型 171、公开 GET 255、完整 Live/环境重跑 0。继承用户在 A 的 G6 指令已批准的共享限额（26 Live、1600 模型、290 GET、4 环境重跑），批准摘录保存在 [budget-approval.json](budget-approval.json)；本批不使用该额度。详见 [账本保全](ledger-preservation.json)。

**本批新增真实模型、Google、餐厅网站、Live、公开 GET、环境重跑全部 0。** 不读取 `.env`、G1 答案或私有留出集原文。Mock/本地真实 Chromium 门禁只证明受控读取接线及回归；未执行新的 Replay、Live 或受控写入。没有新质量评分分母，不把离线通过当作 Live 验收。

发布前再次确认远端 main 未变化，以正常合并、正常 push 和 `ls-remote` 校验完成用户批准的发布；不覆盖并行提交。合并树须与本交付树相同。完成后待命，不继续 G6、G3b 或其它清理。
