# G4 日文检索与来源标记合入切片

- Status: current executable / authorized main integration；不是新的能力评测。
- 时间：2026-10-31，维也纳 CET（UTC+1）。
- 用户复核通过 `efee5a81`：三家日文词下正确接纳、T 未错认且完整路径未评；独立 Linux 五门禁与 G2 全绿。
- 同步基线：main `90559cc956d5288d52c1762cdaa85aeb6c3fb8d7`。

承诺：保留该 main 的 A 浏览器超时诊断与 C 已复核产品、原件、账本和文档；当前切片只做同步、必要权威文档状态更新、输入冻结、五门禁与严格 G2。全部通过才发布 main 并核对远端 SHA；任一检查失败立即停，不修门禁、不重试、不调整排序或验收口径。

`6e0f134a` 已同步 main：产品源码无冲突；四份状态/历史文档保留双方冲突块，账本按 ID 并集 500 条、同 ID 差异 0，累计 GET255/260 不变。同步后相对 C 复核候选的源码差异恰为 A 的 `scripts/browser-fixture-worker.mjs`、`scripts/run-browser-fixtures.mjs` 与 `src/harness/browser-fixture-scheduling.test.ts`，均逐字等于最新 main。其他产品/Fixture/评分/身份/排序不变。

## 冻结与验收

1. 提交本计划、外层门禁 Runner、产品/Fixture/config SHA 与旧 C 原件保留清单，前置净树。
2. 顺序执行：完整性核对 → typecheck → arch:check → npm test → build → test:browser:fixture → `PRAXIS_G2_REQUIRE_PASS=1 npm run test:dom-change` → 完整性复核。每项前后 `git status --porcelain` 必须为空，保存原始输出及 SHA；任一失败立即退出，不自动修复/复跑。
3. 标准 G2 已由 `test:browser:fixture` 首组独占执行，严格 G2 单独执行；不把默认套件替代 Chromium。旧定向结果保持历史标签，不新增 Google、模型、网站 GET、Live、数据库或 `.env` 读取。
4. 通过后保存报告，同步 STATUS/DEVLOG/TEST-LOG/月度摘要与索引；产品源码和测试输入不再改。发布前再次核对远端 main；若前移，先同步并重新验证，绝不覆盖。
5. 本地 `main` 被其他工作树占用；不改那些工作树。通过后在本工作树创建 main 为第一父的发布合并，确认其产品与测试树逐字等于已测候选，再按已授权正常快进推送 `HEAD:main`。不 force push。
6. `ls-remote` 核对 main，净树后待命。T 第六位排序与缺片段限制保留，不延伸新任务。

## 证明边界

本轮全量离线门禁验证同步后的兼容性，不重跑原37家、四家公开采集或真实模型。签收依据仍分别引用旧保存页 Replay、四家定向 GET + Replay 与独立复核；不产生新的37家通过率，不评价库存或预约成功。
