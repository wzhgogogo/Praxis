# B1 交接投影：只给已展示或就绪候选

时间：2026-11-02，维也纳 CET（UTC+1）。状态：离线验证通过，按用户预先批准发布 main；最终发布提交以 Git 合并记录及 `ls-remote` 回执为准。真实模型、Google、来源网站、Live 新增调用均为 **0**，未读取或加载 `.env`。

## 结果与范围

`PRESENT_RESULTS` 只投影 `presentedCandidateIds`；其他阶段只投影 `readyCandidateIds`。缺少展示集合视为空，`selectedCandidateId` 不绕过集合。无完整请求时也清空已有交接投影，避免返回传入 DTO 中的旧交接。

准备缓存保留。有效链接、两次服务端校验、身份、查位、条款证据、20 秒保留和手续费规则不变。HTTP departure 原来就读取这个投影，因此无需修改服务端路由：隐藏店现在走 `No current verified source handoff`，返回 400。条款入口在任何取页/模型调用前使用同一集合规则。

产品改动只有三处：

- `src/domains/restaurant/booking-handoff.ts`：新增纯集合选择函数，两个实际调用方为应用投影和条款入口；无 State 或新持久结构。
- `src/application/restaurant-booking-handoff.ts`：候选集合过滤及不完整请求的空投影。
- `src/integrations/restaurant-facts/booking-terms.ts`：只增加一条集合成员守卫；其余读取逻辑不动。

ADR-0049 追加本次用户决定，Document revision 0.6。State、TaskDefinition、Prompt、Proposal Schema 版本不变。没有改变来源 Adapter 能力，未增加 Capability Matrix 声明。

## 有效红灯与绿灯

固定开发来源输入取自已存在的 A G6 Sushi 材料；新增本轮用户 HARD kushikatsu 要求。完整生产组装、持久应用、语义 Compiler、Router/Reducer、事实和空位接纳均运行，只固定模型传输及来源 I/O。没有直接写 State、身份或空位结果。它复现 D1 的同类缺陷，**不是重新运行或重评 D1 Live**。

有效红灯冻结提交：`1bf906060f1ecaeae4ce12517978453b94c3df81`。生产修复及同输入绿灯：`39d7823feecb79db63e78e50e2fb51eb07617518`。

| 检查 | 修复前 | 修复后 |
| --- | --- | --- |
| 实际空位响应及原始 form_course 链接已绑定；HARD 未核实，NO_VERIFIED_RESULT、就绪/展示均为空 | 对外仍有 1 条交接 | 交接为 `[]` |
| 本机真实 HTTP departure，猜测该隐藏候选与 offer | 201，返回链接 | 400，无链接 |
| 同一 source 准备缓存 | 1 条 | 1 条 |
| SEARCHING 阶段真实就绪候选，暂停在模型返回展示动作之前 | 有交接 | 有交接 |
| 放行后展示，再由用户明确选店 | 链接及取消/卡要求两项条款 | 逐字段相同 |
| 单独组件边界：selected 已给但不在展示集合 | 启动 2 次条款调用 | 0 次；投影为空 |

四条测试由 1 绿 3 红变为 4/4 绿。其他组件边界覆盖：缺失展示集合；非展示阶段即使旧展示集合有该店，但就绪集合为空；请求已缺失而 DTO 带旧交接。它们明确标为不一致 DTO 的组件控制，不当作整组装或 Live 结果。

首次预检记录在 `preflight-invalid-red/`：夹具缺少 HARD 检索词模型端口，未进入查位；本机 HTTP 监听被沙箱拒绝。该次不算目标红灯。补齐固定模型 I/O、提交冻结后在本机许可环境取得上述有效红灯，没有修复或绕过产品失败。

## 独立核验与四层报告

`evaluate.py` 不导入生产集合或身份判定函数。它对照固定来源的逐字原链接、页面没有 kushikatsu 的原文、实际 HTTP 返回以及用户规定的集合关系，核对红绿各 6 帧；其中 5 帧来自真实组装流程，1 帧单列组件边界。同一流程在多个时刻的帧不计为独立 Live 样本。

1. 端到端：离线四项合同全部通过，含两条无合格结果路径和一条就绪→展示→用户选店路径。新的 Live 交付率、真实网站稳定性均未评。
2. 逐环节：权威 HARD 来自语义接纳，来源身份/精确时段和原链接经既有生产链路接纳；页面没有该 HARD 依据，不具备展示资格；修复前首个偏离为最终交接投影，HTTP 接受离开是同一根因下游表现。
3. 严重程度：红灯是可达的服务端合同越界；没有把它改称 D1 用户已看到的错误声明。固定 I/O 安全核验未出现预约流程导航、提交请求或 `BOOKING_PROPOSED`；原 D1 Live 严重程度不重新打分。
4. 归因：只有这三处产品差异，红绿使用相同输入；正控制的交接内容逐字段相同，原 source 缓存仍在，独立核验 PASS。未靠扩大身份或链接接纳条件转绿。

原始输出为 `red/test.log`、`green/test.log`、`gates/test.log.gz`；包含完整模型请求/固定响应、页面、事件、Trajectory、时钟及生命周期时间。`gates/independent.log` 为六帧独立核验和按用途模型计数。所有计数均为 fixture 调用，不能当作真实模型次数或 Live 等待时间。

## 完整验证

候选基于 main `f992a8ac4cf50ab7ff36d7878a03507525ef61af`。最终门禁冻结提交：`1d7377b1110ca4ddbf71f590c69e8eb972c02e52`；`freeze.json` 共 757 项源码、测试、配置、输入及原件 SHA。九步前后工作区均为空，HEAD 和冻结 SHA 不变，未过滤、跳过、豁免、重试或放宽时限。

| 命令/检查 | 结果 | 秒 |
| --- | --- | --- |
| 输入/受保护文件/账本完整性 | PASS | 0.120 |
| `npm run typecheck` | PASS | 0.532 |
| `npm run arch:check` | PASS，0 forbidden dependencies | 0.219 |
| `npm test` | 1355/1355 | 40.912 |
| 独立原件评价 | PASS，6 帧 | 0.091 |
| `npm run build` | PASS | 0.490 |
| `npm run test:browser:fixture` | 188/188，本地真实 Chromium | 131.394 |
| `PRAXIS_G2_REQUIRE_PASS=1 npm run test:dom-change` | 5/5；12 页全部 PASS | 24.795 |
| 再次完整性检查 | PASS | 0.138 |

完整记录见 `gates.json`，2026-11-02 16:25:48 CET 完成。之后仅保存报告和文档，不改变被测源码、配置或输入。门禁前后核对远端 main，均为同一 `f992a8ac`，无需引入额外主线差异。

## 文件归属与账本

A 的 `src/eval/**`、`src/harness/**`、G6/`g6-booking-*` 测试，以及现有 `local-web-server.test.ts` 全部与 main 原字节一致。B 三个 G3 文件和前端均原字节一致。

唯一既有测试输入同步是 C 自有 `tablecheck-booking-handoff-reader.test.ts` 的组件 DTO：补上此前省略的 `phase: SEARCHING` 和 `readyCandidateIds: [id]`。业务断言未改，避免不完整组件桩绕过新合同。新增测试和 C 夹具选项不改原场景默认行为。

共享账本 main 的 570 条与 A `f094e034` 的 618 条共有行完全一致；并集保留全部 48 条 A 新记录，新增 C 零调用行为 619 条。保留 main 限额 GET 290，没有采纳 A 分支另列的 GET 390 上限。并集累计 Live 1、模型 264、评测公开 GET 262、Google 19、来源请求 1392 来自历史及 A 记录；**本轮 C 每项均为 0**。两个原始账本快照和 SHA 均保留，不覆盖他人条目。

按用户授权正常合并推送 main，远端核对后通知对话 A；随后 C 待命。
