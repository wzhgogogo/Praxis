# P1-F 执行中：评测与测试 P0 复核

- 复核时间：2026-10-12 01:05 东京
- 复核者：独立复核（Claude），非实现者
- 范围：冻结 `73bfca5` 的评测与测试代码；P1-F A 部分、h005 重试、续跑第一段的产物和外层脚本（HEAD `035d04c`，之后只有文档提交）
- 方法：按 git index 的 blob 哈希取回全部变更源码；在本地 Chromium 中复现 Guard 重定向；用项目自带的 yaml 库解析冻结变体；在容器中跑默认测试
- 证据状态：开发集已暴露，非 Clean Baseline
- 仓库副本说明：原件在 Praxis 项目文档 `reviews/P1-F-EVAL-TEST-P0-REVIEW-20261012.md`，本文件为复核者原样放入仓库的副本，供实施者通读。

## 结论

有三个 P0。A 部分两次被外层脚本中断的问题，已经由用户批准的"剩余五例分两段补跑"解决，不再列入。

### P0-1 FALSE_CLAIM 安全门对 Tabelog 交付没有独立核验

- `read-grounding.ts` 生成 Tabelog 空位证据时，`claims.date`、`claims.partySize` 和 offer 的日期、人数直接取自请求（约 594–626 行）。evaluator@27 再拿这些字段和请求比对（`diagnostic-evaluator.ts` 776、781 行），结果必然一致。
- 按原始 trace 复核"页面实际显示的日期、人数、时段"的逻辑（`rawTableCheckCurrentResult`）只覆盖 TableCheck，Tabelog 没有对应逻辑。
- 外层脚本只在交付数为 0 时才发见证 GET（`run-one.mjs`：`deliveryCount===0`），已交付的门店运行后没有任何独立核验。
- P1-F 目前交付了 6 家，其中 5 家来自 Tabelog（h001 三家、h002 Ginza Sushi Sendou、h004 Noa Cafe Ginza）。退出条件 3（FALSE_CLAIM 为 0）对这 5 家实际上只能依据系统自己的记录。
- 修法（不改冻结代码）：每次运行结束后，外层脚本对每家已交付的 Tabelog 门店立即发一次已批准的四参数 `find_vacancy` GET，不调用模型，方法与见证相同，并保存原始响应。A 部分已交付的门店中，Sen、Matsumoto 因 h001 的字段误读，在运行后约 2 秒恰好做过 GET，原始响应已保存；Sushi Tokyo Ten、Sendou、Noa Cafe 由复核者从录制中查位阶段的 DOM 快照核对。现在补发 GET 已没有意义。

### P0-2 Guard 多跳重定向绕过仍在冻结版本中，Guard 单测把这条路径测错了

- 10/12 在 `73bfca5` 的 Guard 上用真实 Chromium 复现（10/9 发给用户的同一 repro）：
  - 一跳重定向到未放行的来源：被拦下。
  - 两跳 `A → A/hop2 → B`：到达 B，B 是未放行的来源。
  - `A → /public-hop → /account/delete?action=confirm`：到达敏感路径。
  - 两种情况下，Guard 都只看到第一个请求。
- 原因：Guard 对第一跳用 `route.fetch({maxRedirects: 0})` 取回 3xx，再原样 fulfill；之后浏览器自己跟随重定向，而 Playwright 不会为重定向产生的请求调用 route handler。
- `playwright-read-network-guard.test.ts` 154–170 行用 fakeRoute 模拟"重定向后的请求会重新进入 handler"，与 Playwright 的实际行为不符，所以单测全绿也发现不了这个问题。
- 对 P1-F 证据的影响：外层观察镜像的是 Guard 写出的录制条目，同样看不到这些请求。A 部分报告"没有非预期 Guard 放行"的结论，只在 Guard 能看到的请求范围内成立。ADR-0036 的通用公开读取会访问任意第三方官网，这类站点经常有多跳重定向。
- 建议：
  - 是否为此重新冻结由用户决定。复核者倾向于不在 P1-F 中途更换冻结版本，否则 A 部分与后续运行不可比。
  - 签收报告要把它列为已知的边界缺口，不能写"只读边界已验证"。
  - P1-F 结束后第一个修，且必须在任何预约相关工作（路线图第 2、4 步）之前修好。
  - 单测改为在真实 Chromium 上跑多跳重定向链。

### P0-3 签收口径有一个空档，可能直接决定结论

- 基线 Playbook §6 的运行结论中，没有一类对应"已展示、证据充分、并非虚假，但自动评价为 NO"。`p1f-kf-h004` 正是这种情况：
  - evaluator 的观察是 target.goal 冲突，即 RECOMMENDATION 被当成查位任务；
  - 交付的是 Noa Cafe，带 13 个时段，证据为 SATISFIED。
- P1-A 中同一家店出现过同样情况，当时由用户临时决定为"可接受交付（附说明）"。
- 退出条件 1 要求已知可行 5 例中至少 3 例合格，且包括 KF-H001。目前的情况：
  - h001：YES；
  - h002：自动评价为 UNKNOWN（criteria 文本按字面比对），要靠人工判断；
  - h004：NO；
  - h003、h005：待补跑。
- 所以 h004 算不算交付，可能直接决定签收结果。B 部分原版 h004 对退出条件 4 也有同样的风险。
- 要求：在第二段和 B 部分开始之前，由用户书面确定 h004 这类运行的归类。同时写明"自动 UNKNOWN 仅因措辞不同，人工判定合格"计为 QUALIFIED_DELIVERY（P1-A 已按此执行，但没有写进规则）。不能看到结果之后再定口径。

## 非 P0，签收前处理

1. **P1-F 变体 YAML 被 flow 写法截断。**
   - `{ value: around 10,000 yen per person, ... }` 被解析成 `value: "around 10"`，外加一个多余的键 `"000 yen per person": null`。h003 的 "around 3,000" 同样如此。8 例的 `date.expression` 全部只剩星期几，后面多出一个值为 null 的键。
   - 证据就在 `loading/parsed-cases.json` 中。`p1-f-20261014/variants.draft.yaml` 有同样问题；Gold6、Gold7 正式用例文件已检查，没有问题。
   - 加载检查用同一个 yaml 库的解析结果做对照，属于同义反复；加载器也不拒绝未知键和 null 值。
   - 影响：目前没有翻转任何自动结论（h002、h003 的 criteria 按字面比对本来就是 UNKNOWN；`date.expression` 没有参与评价）。但冻结的 Gold 与用户批准的文字不一致，报告中"semantic 一致"的说法不成立。
   - 这份文件是复核者起草的，错误在复核侧。
   - 修法：改为 block 写法，请用户重新确认，重算 SHA，离线对已有结果重跑 evaluator@27（不需要 Live）；加载器拒绝 null 值和未知键。
2. **外层脚本不在冻结范围内。**
   - `run-one.mjs` 和 `observe.mjs` 通过 `--import` 从主工作树注入冻结 Runner；停止规则在 A 部分、重试和续跑之间改了三次；manifest 没有记录这两个脚本的哈希。
   - 现在的续跑脚本对 h001–h005 原版用例会抛出 `CASE_NOT_AUTHORIZED`（它要求见证文件中有对应条目），B 部分需要另写脚本。
   - 第二段和 B 部分开始前，冻结这两个脚本并记录 SHA，先离线空跑一次。
3. **运行之间没有安全暂停。** h004 的 evaluator 在 08:27:56Z 给出 NO，h005 在 08:27:58Z 就启动了。建议：有交付且 evaluator 为 NO 时，先由复核者完成 FALSE_CLAIM 判断，再跑下一例。配合 P0-1 的 GET，这只需要几分钟。
4. **见证有效期。** 见证在东京时间 2026-10-12 17:20 到期，之后 `run-one.mjs` 会抛出 `WITNESS_EXPIRED`。第二段要在此之前跑完，否则需要重新认证见证。
5. **10/9 报过、仍未修，但不在 P1-F 路径上：** source-stage 探测 Runner 会把失败的读取标成 SUCCEEDED/REPLAYED（`run-source-stage-probe.ts` 651、674、682 行）。它不参与退出条件，转入第二阶段。

## 测试

- 容器环境为 Node 22（宿主机要求 ≥24）。共 840 个测试，837 个通过：
  - 2 个是环境问题：复制的仓库里缺少归档的 docs 用例文件；代理用的是桩。
  - `local-web-server.test.ts` 的 W12 挂起超过 6 分钟，被手动终止。原因是 `await restaurant.started` 前面没有超时保护，用例启动不起来时测试会一直挂着，而不是报失败（P2）。
- 与宿主机的 846/846 一致。
- 现有测试覆盖不到上面三个 P0：Guard 单测模拟的重定向行为与真实不符；加载器没有 schema 测试；evaluator 测试没有覆盖 Tabelog 证据的独立核验。

## 第二段与 B 部分之前的顺序

1. 用户确定 P0-3 的归类口径，写入第一阶段 Playbook §10。（2026-10-12 04:10 已批准并写入，Playbook 第 20 条）
2. 外层脚本加上"交付后 Tabelog GET"，连同 B 部分用的版本一起冻结、记录哈希。
3. 变体 YAML 改为 block 写法，用户重新确认，离线重新评价。（第 2 版已由用户确认）
4. 用户决定 Guard 的处理方式：沿用 `73bfca5` 并在签收中记为已知缺口（已批准）。
5. 复核者从录制中核对 A 部分 Tabelog 交付门店（Sushi Tokyo Ten、Sendou、Noa Cafe）的查位快照。
