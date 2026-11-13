# Praxis 工作树创建入口

- Status: Accepted
- Document revision: 1.2
- Last updated: 2026-11-13
- Source of truth for: 同任务工作树复用、新树首次检出、默认测试样本和历史批次按需取回
- Related documents: [Conventions](REPOSITORY-CONVENTIONS.md)、[Test](skills/test/SKILL.md)
- Evidence status: local main integrated / not pushed；当前本地基线验收见下文；离线开发验证非Clean Baseline，旧整单回放缺口保持

本切片只建设新工作树入口：从用户指定a91fc60b的36,763文件/5,690,288,843字节档案创建新树时，首次检出只展开代码、文档、模块Fixture和默认离线回归真实需要的历史样本。以原版npm test通过、按需取回一个原批次并完成其可验证回放、已有配置/工作树不变为验收。轨迹存储分支独立保留，本切片不含它的源码/Schema变动；不改变Gold、评分、测试断言或Live能力声明。停止条件为实际入口验收与适用门禁通过；旧目录清理单独认领，当前不删除。

## 优先复用原工作树（Codex）

继续同一任务时，先核对并复用原工作树的真实路径、分支、HEAD 和暂存/未提交状态。开新 chat、跑新一轮 eval、补证据，都可以继续用原树；输出使用独立批次目录，按 Eval Skill 冻结并记录代码与输入 SHA，保留原结果。不要因为换 chat、换评测批次或需要一份报告而复制项目或建树。

只有需要并行修改代码，或隔离执行/验证另一个代码版本，才用下述入口新建。既有工作树的代码、配置和本地内容不会因本入口合入 main 自动改变；从旧提交继续工作的 chat 也应遵守本节复用规则。需要读取历史材料时优先按提交/路径从 Git 或已有归档读取，在原树中保存独立输出；仅当验证需要另一版本代码时隔离建树。

## 今后创建工作树

从含本入口的本地 main 检出执行。默认基线是本地 `main`，因此暂不推送的入口和指引也会进入新树；需要远端快照时显式传 `--ref origin/main`。同步远端与集成其他产品改动是独立操作，入口不自动 fetch、不复制 `.env` 或 `node_modules`：

```sh
npm run create:worktree -- /path/to/new-worktree --branch codex/fix-task-name
npm run create:worktree -- /path/to/historical-check --detach --ref a91fc60b
```

实际文件是 `scripts/praxis-worktree.mjs`，无 npm 依赖，也可用绝对路径或 `npm --prefix <main-checkout>` 调用。仓库没有另一套生产建树脚本；`create:worktree` 统一分发到此文件。Codex 内置 `create_worktree` 未暴露 no-checkout 时，应使用仓库入口，不能先全量检出再删。合同测试中用于构造旧树对照的原生 Git 操作只服务临时测试仓库，不是日常建树入口。

入口先验证目标不已存在、引用有效与Praxis命名，再 `git worktree add --no-checkout`；已有Praxis仓库需已启用 `extensions.worktreeConfig=true`，否则在创建前报错且不自动改共享配置。新树自己的config.worktree设置sparseCheckout/non-cone，写新树info/sparse-checkout后才首次read-tree。既有树、共享config、已有分支、未提交文件及配置不修改；目标冲突或缺少引用不会覆盖。创建中途失败留下新树供检查，不自动删除任何目录。新树不会默认携带完整历史批次。

输出JSON同时记录首次检出前与后的.eval-artifacts文件数、逻辑字节、分配字节及省略字节。它只描述工作树展开量，Git共享对象库仍保留历史数据，不能将该数字报告为Git历史已释放空间。

## 测试样本白名单

`scripts/worktree-fixtures.json` 记录默认npm test实际读取的历史样本，以及测试直接导入的历史评测模块及其导入闭包。选择来自目标提交的Git blob，不从其他chat树复制。不同提交中不存在的白名单路径不会展开；未来默认回归新增历史输入时，须在同一改动更新此清单并从新树验证。缺样本时测试明确失败，不跳过测试、不自动回落为完整档案。

诊断读取采样仅用于本次确认依赖，最终入口、白名单和原版npm test验收不依赖自动补文件hook。部分默认回归确实读取完整历史结果与HAR，因此最小工作树仍含这些测试数据；本切片不以改写旧结果、改变断言或退役业务测试来缩小它。

## 按需取回历史批次

```sh
npm run restore:worktree -- /path/to/historical-check phase3b/category-discovery-cost-20261110/runtime/D01
```

该命令只用于本入口创建且HEAD仍等于创建快照的新树，要求tracked状态干净；批次路径须在.eval-artifacts下且存在于同一Git提交。它仅扩展该新树的稀疏规则，不更新引用、不取其他chat文件、不覆盖修改过的批次内容。原清单保持不变，追加批次原始路径和字节；回放输出应写独立新目录，原证据不改。代码已提交前移时，此受保护的恢复命令会拒绝改变原创建快照；这不要求另建工作树。继续同任务可按明确提交/路径用 `git show <commit>:<path>` 读取历史文件，或使用已验证归档在原树的独立输出目录复盘；只有需要执行另一版本代码时才隔离建树，不隐式混合快照。

回放仍服从原Runner的覆盖与契约检查：能取回原件不等于任何旧模型契约都兼容当前执行器；不完整回放必须如实报REPLAY_INCOMPLETE。此格式未改任何执行器或读取工具。实际a91验收与已知旧目录分组见对应验证记录和本轮交付清单。

## 2026-11-13 12:42 原分支验收快照（superseded retrospective）

入口源码冻结 `4a1a0b083bad98cbaf4295eeda42181ea7248ab6`，基于origin/main `32b97ed812be10e80a683ad1f2be8caba5608bf0`；生产src与历史.eval-artifacts diff均0，独立于保留的轨迹存储分支。验收工作树 `/private/tmp/praxis-sparse-a91-acceptance` 的HEAD原样为a91fc60b3e54a63e40314267f9c72ea17005dc30。

| 项目 | 实测 |
|---|---|
| a91完整历史档案 | 36,763文件、5,690,288,843逻辑字节 |
| 首次检出前已展开评测文件 | 0 |
| 首次检出实际样本 | 489文件、372,426,952逻辑字节（355.17MiB）、373,501,952分配字节（356.20MiB） |
| 未展开历史档案 | 36,274文件、5,317,861,891逻辑字节；逻辑展开量减少93.455% |
| a91原版默认回归 | 1572/1572；独立离线npm ci，不带诊断hook |
| 冻结入口源码的全新稀疏验证树 | typecheck/arch:check/test:worktree/npm test1610/build全绿，结束时Git干净 |

D01历史批次按需取回115文件/36,977,287字节，D8取回192文件/43,072,041字节，逐文件Git blob哈希全部一致。新增取回只发生在本轮新a91树，不改它的HEAD、代码或其他工作树。

**回放范围明确区分：** D8原录制标为REPLAYABLE的第16张Tabelog首页，使用既有loadReplayRecording/createRecordedBrowser与原HAR，通过真实Chromium窗口回放，消耗1页，missingRequests/stops均0。输出文档280,779字节，URL及标题吻合；OS deny network-outbound，0模型/Google/网站/Live。它只证明合格页面窗口的原件可恢复与回放，整单Agent任务NOT_EVALUATED。D01整单因原HAR缺联想响应未完成；D8整单及原Runner定向模式因原首页DOCUMENT_NOT_QUALIFIED等未完成，原输出全部保留，不改写原件或放宽资格。本轮未实现“任意旧整单均可完整重放”。

开工前73棵既有登记工作树保留；57份既有配置内容哈希、主工作树及轨迹树HEAD/status/diff全部保持。轨迹分支仍34a6504d540eec99f6653d82fc85cb26bbf29460，未合入或推送。42旧评测目录按创建chat及任务推断分A–G组，刷新du合计227.496GiB；全部保留，未清理。其明确评测依赖与node_modules链接在独立认领清单分列，idle/已备份/干净Git不作为释放依据。

完整日志、首次检出JSON、逐blob核对、回放receipt、配置保护结果和认领清单保存于本轮本机 `sparse-worktree-entry` 证据目录；[TEST-LOG](history/TEST-LOG.md#sparse-worktree-entry-20261113)记录命令和模式。该快照记录的是当时尚未合入 main 的分支状态；后续本地主线接入以本节之后的记录和 STATUS 为准，不据此推断旧目录当前仍存在。

## 本地主线接入（2026-11-13）

本次只将入口、合同测试、489 项样本选择及指引接入原本地 main `4256303de2cf8cf1921420e3318db5ce443d3c6d`，不合并源分支基线 `32b97ed8` 的产品/评测改动，也不包含轨迹存储分支。默认引用由 origin/main 改为本地 main，并用远端引用落后于本地提交的真实 Git 合同验证本地入口可继承。

验收要求：当前本地 main 的净树 typecheck、arch:check、test:worktree、npm test、build；再从 main 直接调用 create:worktree，核对新树 HEAD、首次样本和命令存在。源码与历史 .eval-artifacts 相对本地主线原提交应保持零改动；既有树文件、暂存和配置保留。D8 原 main 检出固定在原提交后，才推进本地 main，避免冻结代码和索引被新引用改变。远端不推送。

冻结入口源码 `1b1f1f6daa7a5d594ea246763703a2b069a876b9` 已净树通过 typecheck、arch:check、test:worktree、默认1546/1546及build；旧origin/main默认红、新本地main默认绿。新增10个相对文档链接均在Git提交中可解析。该源码门禁后已执行下述本地主线 CLI 验收。

### 本地主线实际调用验收

在本地 main `802f5b8c8018b8d0fa6896d9350aeea7e9979f96` 的检出中直接执行 `npm run create:worktree -- <独立临时验收路径> --detach`，未传 ref；新树 HEAD 等于本地 main，未选择落后的 origin/main，并包含 create/restore/test 命令、AGENTS 复用规则。首次检出前评测文件0，之后489文件/372,426,952逻辑字节（355.17MiB），省略34,969文件/5,016,494,496字节。未复制.env或node_modules。

再用主线的 restore:worktree 取回 `phase3b/heldout-known-unavailable-20261109`，14文件/1,341,382字节；全部503个展开评测文件逐Git blob一致，新树Git干净。该临时验收树以普通git worktree remove移除，既有树列表和共享配置未变。被测试源码、package/lock、src和历史.eval与冻结门禁提交1b1f1f6d完全一致，文档补记不重复产品回归。

主线检出保留为本次独立创建的持久 local-main 工作树；原D8检出仅固定为4256303d detached，文件、索引、未提交状态及稀疏配置不变。原主工作区草稿、轨迹分支34a6504和入口原分支15cee837均保留。入口合入仅发生在本地，未推送，也未同步origin/main其余产品提交。本机完整日志、原树保护快照和CLI JSON存于 sparse-entry-main-integration 证据目录。
