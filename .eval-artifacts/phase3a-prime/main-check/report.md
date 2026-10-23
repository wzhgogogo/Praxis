# 第三阶段 3a′：批次 0 主线核对

- Evidence status: draft / not integrated；已暴露开发工程基线，不是 Clean Baseline。
- 当前停止结论：STOP_POINT_0 / COUNT_SCOPE_MISMATCH；五门禁全绿。
- 执行时间：北京时间 2026-10-23 开始，2026-10-24 完成（原始日志记录 UTC）。
- 对话角色：本对话执行 A 的批次 0；未启动 F1，也未启动 B 的 F5 分析。

## 1. 范围与提交列表

- 主线冻结：`ac571ca8188082902f2ea20fc10d9dd05cbb2f6a`；`git fetch` 成功后，本地 `main` 与 `origin/main` 相等。
- 工作分支：`codex/chore-phase3a-prime-main-check`，从上述 main 新建。
- 首个提交：`8601233ce60c365f8fb976892a7b1519faadd8d6`，只包含用户粘贴指令原文。
- 指令已同时原样保存于主工作树指定路径；SHA-256 `451b40ef26b917812a949f3649a91e616e72709c7067f890eb9085ce8ae6cfe1`，与原附件逐字节一致。
- 主工作树仍在原有旧分支，保留用户原有 9 份改动；未向旧分支提交、未合并 main、未推送。
- 后续证据提交同时保存本报告、日志与五份同步文档；提交清单可由 `git log ac571ca8..codex/chore-phase3a-prime-main-check` 核对。
- 基线命令实际在干净 main 工作树 `/private/tmp/praxis-phase2c-mainline-integration` 运行。独立日志保存在本分支，不把含新文档提交的树冒充 main。

## 2. 核对项目：目标、红灯、绿灯与未覆盖范围

### 主线与旧分支

- `git merge-base --is-ancestor 4d953731 main` 与 `git merge-base --is-ancestor 9de09404 main` 均返回 0。
- `git log --format='%H %s' main..codex/feat-live-restaurant-read-path` 无输出；远端同名分支相对 main 亦无独有提交。未自行合并任何提交。
- 原始引用与主工作树清单：`main-refs.json`。

### 五门禁与时间基线

- 无代码修复，不人为制造失败测试；红灯不适用。真实失败若发生，保留完整日志并停下。
- 测量为完整命令进程的单调时钟 wall time，包含 npm 启动及测试收尾；顺序运行，不并行，默认/Chromium 各三次，不舍弃慢样本。
- 每条命令最多 600 秒；触发则保存日志、终止本地测试进程组并停止后续采样。此限额只用于本次离线基线，不改变产品或 Live 的 500 秒限制。
- 测试生成的已追踪历史指标另存副本后恢复原字节，不改写历史证据；详见 `gates.json` 的 `generatedRestorations`。
- 本项不是端到端餐厅运行；四层评测不适用，不声明 S0=0 或真实交付能力。

### 网站适配器行数

可从仓库根目录复跑：

```bash
python3 .eval-artifacts/phase3a-prime/main-check/count-adapter-lines.py
```

脚本对 `025940c5` 和冻结 main 执行 `git ls-tree` / `git show`，统计 UTF-8 物理行（含空行、注释），排除 `.test.ts` 和 fixtures。逐文件行数、非空行、SHA 见 `adapter-lines.json`。

| 口径 | 第二阶段起点 025940c5 | 当前 main ac571ca8 | 增量 |
| --- | ---: | ---: | ---: |
| 两个适配器目录的非测试 TypeScript | 3591 | 3864 | +273 |
| 加 `restaurant-search/source-packs.ts`（指令要求的源码口径） | 3991 | 4337 | +346 |
| 再另列两个站点 Skill 文档 | 4021 | 4367 | +346 |

- 历史 `3591 → 3863` 可由旧报告的窄口径复现（本批 `historical-lines.json` 亦在06287b6f独立重数确认3863）；当前同口径比报告多 1 行，来自 TableCheck public-query 的近期 Guard 修复（`06287b6f..main` 为该文件 10 加 / 9 删），属于物理行统计，不解释为能力变化。
- 历史依据：`.eval-artifacts/phase2c-location-semantic-20261023/source-line-comparison.json` 及 `audit-generality.mjs`。其中 `provider-directories` 明确不包含 `source-packs.ts`。起点包文件 400 行、当前包文件 473 行；两份站点 Skill 各口径合计 30 行。
- 因此无法在“适配器目录 + 站点包”的同一口径复现起点 3591 和当前约 3863。报告采用指令文字要求的 **3991 → 4337** 为含包统计，同时保留旧窄口径并列，不自动改写后续 ≤3591 的门槛。

## 3. 五门禁结果（用例数、耗时）

| 门禁 | 用例数 | 各次完整耗时（秒） | 中位耗时（秒） | 结果 |
| --- | ---: | --- | ---: | --- |
| `npm run typecheck` | 不适用（静态检查/构建） | 0.456027 | 不适用 | PASS |
| `npm run arch:check` | 不适用（静态检查/构建） | 0.833966 | 不适用 | PASS |
| `npm test` | 1029 | 23.337168 / 23.196958 / 24.090059 | 23.337168 | PASS |
| `npm run build` | 不适用（静态检查/构建） | 0.455981 | 不适用 | PASS |
| `npm run test:browser:fixture` | 138 | 307.538626 / 307.573510 / 307.747521 | 307.573510 | PASS |

- 默认三次均1029/1029，Chromium三次均138/138；各次失败、取消、跳过、todo均0。架构检查为0条禁止依赖，无单元用例计数。
- 原始记录 `gates.json`；从日志独立提取用例计数的 sidecar 为 `gate-summary.json`；九份原始日志与其SHA保留。
- 三次中位数是F1可复用的main/ac571ca8基线；本批没有做任何测试清理，不报告数量或耗时改善。
- 五门禁通过只满足批次0测试项；含包统计口径与历史数字不一致，批次0仍未判PASS。

## 4. 额度消耗与累计

- 新增完整 Live 0 / 8；真实模型调用 0 / 400；环境重跑 0 / 2。
- Google、餐厅来源网站及见证 GET 均未调用；本地 Chromium fixture 的回环接收端访问不属于 Live。
- 账本：`../budget.json`。无消耗事件，entries 为空，不用虚构 0 次调用事件。

## 5. 偏离及原因

- 原承诺：同一“目录 + 站点包”口径复现 3591 / 约3863。实际：这些历史数字属于不含包的目录口径，含包是3991 / 4337。影响：后续 F3 的 ≤3591 上限对应的范围不明确。
- 按原文“停止点 0：任何一项不符合就停下”，在批次 0 报告后等待复核。没有以通过部分门禁替代整批验收，没有提前开展 F1/F5。
- 主工作树有用户既有改动且 main 已在另一树检出；原文保存于指定主工作树，提交与新报告使用从 main 创建的隔离分支。原有文件不移动、不 stash、不覆盖。
- 无新增/修改产品代码、测试、fixture、Schema、Prompt、Evaluator、Gold、变体或站点权限。69 例翻月与22例校准属于 F1 验收，本批未运行，不引用历史结果冒充本批结果。

## 6. 待复核决定

请明确后续 ≤3591 行针对适配器目录，还是包含站点包的源码；若包含站点包，是否继续保留3591这个门槛。未获复核前保持停止点0，F1/F5均未启动。
