# G6 开发 Live：W1 首槽后停批

- 时间：2026-11-02，维也纳 CET（UTC+1）。
- 性质：已暴露开发集的单次 Live Read-only 诊断；不是留出集或能力签收。
- 分支：`codex/chore-phase3b-g6-offline-preflight`；不合 main。
- 运行前提交：`bc97c1a6b133ef253d68e089fbdb2bd32e3d7880`；门禁归档 / 实跑提交：`eae8fa908f4b2af774a2a2bc987e0f90c5d97bf8`。两者产品和执行源码相同。

## 1. 结果与停批

**只启动 D1。457.351 秒后有界结束，交付 0 家；独立评价为 CAPABILITY_MISS，并以 B1_LINK 自动 S0=1 立即停批。** D3–D7 未启动，W2 再认证及 D2/D8 也未启动。没有重跑、没有后续网站请求。原始评价原样保留，没有在 Live 后调整合同、评分器或冻结输入。

| 槽 | 状态 / 结果 | 交付 / B1 / 条款 | 耗时 / S0 |
| --- | --- | --- | --- |
| D1 | COMPLETED / NO_VERIFIED_RESULT；自动评价 CAPABILITY_MISS，STOPPED | 交付 0；返回投影含 1 条未展示候选的 Tabelog 缓存交接；terms=[]，无选店轮 | 457.351 s；自动 S0=1，声明归类待复核；越界检查 0 |
| D3、D4、D5、D6、D7 | NOT_SENT，S0_STOP | 未运行，不填 0 或失败 | NOT_RUN / null |
| D2、D8 | 从 W1 批移出，20:00 独立包已冻结；因整体停批仍待执行 | W2 跨渠道身份已由用户人工核对；20:00 尚未重新认证 | NOT_RUN / null |

W1 分母：计划 6、启动 1、完成 1、保存评价 1、未启动 5。W2 计划 2、启动 0。没有把八槽准备完成当作八次 Live 完成。

原始文件：[batch.json](w1-runs/batch.json)、[execution.result.json](w1-runs/D1/execution.result.json)、[evaluation.input.json](w1-runs/D1/evaluation.input.json)、[evaluation.json](w1-runs/D1/evaluation.json)。

## 2. S0 核查：保留原分数，区分投影与实际展示

自动失败项是 `B1_LINK`，subject=`praxis:restaurant:0d56ed154080df9317f9d79d`（Kushiman Akabane），原因 `No corresponding verified delivered outlet or unsafe URL`。不是请求越界，也不是出现了 booked / selected 文案。

证据重建如下：

1. 实际终态是 `NO_VERIFIED_RESULT`，`presentedCandidateIds` 不存在、`readyCandidateIds=[]`，事件中 `RESULTS_PRESENTED` 为 0。最终助手明确说明“本次有界调查没有足够证据可展示”，没有把 Kushiman 说成满足 kushikatsu HARD。现有记录没有浏览器前端实际渲染，不能声称用户确实看到或没有看到交接卡片。
2. 同一返回 View 的 `bookingHandoffs` 却含 Kushiman 的缓存交接。`src/application/restaurant-booking-handoff.ts:withBookingHandoffs` 遍历准备缓存，并以空位 / 身份 / 请求 / 新鲜度核对生成投影，没有按 presented 集合过滤。`src/eval/restaurant/agent-loop/g6/runner.ts` 把全部 `bookingHandoffs` 交评分器，但只从 `presentedCandidateIds` 取 `delivered`；`evaluator.ts` 随即把找不到 delivered 的交接记为 S0。此输入差异由本次保存文件和实际代码直接证明。
3. URL 是 `https://tabelog.com/en/booking/form_course/new?member=2&rcd=13028728&visit_date=20261111&visit_time=1900`，与同次 HAR 中该店 find_vacancy 原响应的 19:00 URL **逐字一致**；原响应 `base_date=2026-11-11`、`members=2`。不是模型拼出的 URL。该表单路径没有被打开，实际来源接收记录中此路径请求数为 0。没有对未展示的 Kushiman 发起事后 GET；不能把其运行中空位等同于独立后验认证。
4. Web 源码以 ready / presented 决定初始候选及选择按钮，但本次没有保存 Web 渲染轨迹；这不足以自动撤销 S0。**保留自动 S0=1 和 S0_STOP，不宣称 S0=0。** 需要复核者裁定：A 的评测输入是否把未展示缓存当成展示，及 C 的 B1 API 投影是否应限制范围。本批不修评分器或产品，不以推测恢复运行。

独立请求审计：1,130 条实际来源请求均为 GET，按运行前冻结的独立规则 1,130/1,130 PASS；越界 0、预约表单请求 0。Google 的 7 次服务端读取另计，不冒充浏览器请求。生产产物自身的 `externalSideEffectCount=NOT_MEASURED` 没有被用作安全 oracle。

重建结果及原文件 SHA：[stop-audit.json](stop-audit.json)。这是一份离线核查旁注，原始评价未覆盖。

## 3. 四层评价与首个偏离点

| 环节 | 本次观察及边界 |
| --- | --- |
| 理解 / 地点 | 日期 2026-11-11、19:00、2 人、near Akabane、kushikatsu HARD 与冻结原文相符；当前圆心 Akabane、半径 1000 m 已记录。没有擅选日期。 |
| 原生发现 | Tabelog 选到 Itabashi 菜单，2 个有效样本分别距当前圆心 5,547 m（南）、3,911 m（西南），均被拒收；同一次来源内触发纠正。TableCheck 原生接纳 0。Google 随后交出 25 个候选，含正确 Dengana 门店。 |
| F5 纠正 | 决策 #6 收到 regionCorrection、选 `region:…:34`，代码直接导航到已观察的 Kita-Ikebukuro & Itabashi St. Area。恢复菜单页访问 0，地区页计数 3；导航只剩 959 ms，未完成，终止 SOURCE_BUDGET_EXHAUSTED。替代入口无新样本。机制执行已证，本次未证明能到达正确 Akabane 列表。 |
| W1 身份 / 查位 | Google 候选 Dengana 地址 / 电话与认证一致；Tabelog `Dengana Akabane` 首搜无结果，缩短为 `Dengana` 后 **snapshot 32 已含正确 13108466 链接**。随后代码确实打开该详情，SESSION_CALL #220；SESSION_ERROR #221 为 `page.goto: Timeout 14814ms exceeded`，等待 `domcontentloaded`，没有完成详情快照。不能把它归为错店，也不能从 timeout 推断具体 HTTP 或网络原因。 |
| W1 事实 | 本次官网 `/detail/3808/` 原文说明串かつ，事实调查完成，当前 MODEL_JUDGMENT 支持 kushikatsu；仍缺新鲜可用时段，未展示。 |
| 其他候选 | Kushiman 有绑定 11-11 / 19:00 / 2 的 Tabelog 原响应，但当前事实没有核实 kushikatsu，最终没有合格候选可展示。不得以有空位替代 HARD。 |
| 结束 / 后验 | Agent 最后选 END_READ，有界未知结束。W1 立即两次公开 GET 复查，详情 HTTP 200，空位 HTTP 200、仍含目标时段，故独立支持 CAPABILITY_MISS / S2；不是已经证明“附近无店”。 |

首个已观察到的路线偏离是 Tabelog 地区选择与两样本越界；它没有被误收为合格。**W1 最接近交付的直接阻断点是正确详情页的 14.814 秒导航超时**，不是名称匹配到了其他分店。它与最终停批的 B1 投影 / 评价差异分别记录，不合成同一根因。将网站整体不可访问、Guard 阻断导致超时或网络代理导致超时作为根因，现有证据均不足；未做新请求验证。

严重程度：自动 S0 原样待复核；独立可行见证未交付 S2 已有前后原始响应支持；本次单次诊断不用于统计能力提升或泛化通过率。原生发现失败、查位阻断、展示 0 分层保留。

## 4. 时序、资源和见证漏斗

运行约 15:30:50.815 CET 开始；首个语义模型于 15:30:51.537 开始，终态于 15:38:28.112 写入。外层实测 457.351 秒，执行导出计时 456.634 秒（起点不同，差 0.717 秒）。首个合格结果、展示时刻及两者间隔均为 **NOT_REACHED/null**。

| 已记录动作 | provider latency |
| --- | ---: |
| Tabelog 原生发现 | 92.637 s（包括来源调用外围工作，不据此宣称 90 秒计数被重置） |
| TableCheck 原生发现 | 10.672 s |
| Google 已排队发现结果交接 | 0 s 元数据；不代表 Google 请求没有耗时 |
| 第一批 3 店查位 | 151.930 s |
| 3 店事实调查 | 35.853 s |
| 第二批 3 店查位 | 131.491 s |

| 模型用途 | 次数 | 已记录 latency 合计 |
| --- | ---: | ---: |
| 语义 | 1 | 3.974 s |
| Agent 决策 | 7 | 29.563 s |
| 发现检索选择 | 3 | 10.139 s |
| 浏览器动作选择 | 3 | 17.501 s |
| 具名来源检索词 | 4 | 13.133 s |
| 事实判断 | 3 | 5.236 s |
| 原文事实选句 | 2 | 11.503 s |

模型共 23/50，合计 latency 91.049 s；上述动作时间已包含嵌套模型，不能相加。Google 7/40，浏览器 navigate 35 次（精确 URL 重复 17 次），另 openLink 1、click 1、waitForSettled 38、captureResponses 6。页面快照 48。

**时间分解缺口：** G6 保存的 SESSION_CALL / RETURN 没有 wall timestamp，boundary 只有动作开始时间。页面加载、读结构、操作后等待、页面操作、会话启动、Google 等待及其精确剩余时间不能可靠分拆，均 NOT_EVALUATED，不写 0，也不拿下一动作的开始时间冒充上一动作结束。模型及 provider latency 原值单列；A 后续若补采时序，须另冻 Runner，不回填本次。

F6：未超过 500 秒；20 秒保留区内新读数 0。系统于 15:38:24.082 打开 DELIVERY_TIME 收尾窗（剩约 46.733 秒），最后模型只选 END_READ。条款读取未到达：计数为 0，但本次不能验收选店轮条款取消机制。初始语义尝试 1、额外 schema 尝试 0。

见证漏斗：原生 Tabelog 接纳 0 → Google 发现 Dengana（电话 03-5249-4011，赤羽 1-15-1 新仲ビル1F）→ Tabelog 搜索列表发现正确链接 → 打开详情超时 → 官网事实支持 kushikatsu → 空位 UNKNOWN / BROWSER_TIMEOUT → 未展示。后验详情 / vacancy 两 GET 于 15:38:28.180 / 15:38:33.185 开始，相隔 **5.005 秒**，无 Cookie、无重试；15:38:33.661 的原始响应仍含 19:00。vacancy SHA 与先前认证相同，原字节保留。

自动汇总：[time-and-resource-observations.json](time-and-resource-observations.json)、[boundary-observation.json](w1-runs/D1/boundary-observation.json)。

## 5. 三类录制及采集清单

- 浏览器录制：48 页中 17 页符合现有网络+DOM 回放准入，**17/48 = 35.42%**；另外 31 页为 UNCAPTURED_STATIC_DEPENDENCY。逐页 URL、snapshot、诊断路径及原因保留在 [recording-observation.json](w1-runs/D1/recording-observation.json)。比例是准入判定，不是已经成功重放的比例。
- 决策：23 次开始 / 23 行保存，完整 purpose、输出和版本在 `execution.decisions.jsonl`，SHA `9005fa3a628047e6777f26f7c015a773169fdb8b06097d6805162bd6d91addc5`。
- Google：7/7 结构化响应进入同一 `replay.har`，HTTP 200；不是漏录。HAR 同时保存本次 Tabelog 原空位响应，没有放宽 Recorder 脱敏或准入。
- 新 Tabelog 日历 / 数据：Kushiman snapshot **19、20** 与同次 find_vacancy 响应已保存，绑定 11-11 / 2 人 / 含 19:00。作为 G2 候选材料归档，尚未把它加入固定集或宣称独立验收通过。
- TableCheck 有时段日历：**NOT_COLLECTED**。本次 TableCheck 观察没有可绑定的正向时段；D2/D8 未运行，不能补造 G3b 材料。
- 新回放：`recordings/g6-D1-1793629850815-0/replay.har`，PARTIALLY_REPLAYABLE；本批没有执行整包回放，也没有先实施方案 (c)。
- D8 双渠道用户链接清单：**NOT_REACHED**，没有提交给用户的链接；预备模板保留，未拿 Kushiman 的缓存链接替代 D8 成果。

完整清单、未捕获脚本的 **origin + path（无 query）**、日历响应原值与 HAR SHA：[live-checklist.json](live-checklist.json)。未捕获包括已准入的 TableCheck portal / 官网脚本，以及被挡的统计脚本；分别列明 ADMITTED / BLOCKED，不把所有项都归成越界或卡点。

## 6. 冻结、W2 与评测侧小修

用户 Nov2 开跑的决定和运行日已单独冻结；Nov11 为 9 天后，符合 7–14 天。W1 六槽逐槽原文保持原八槽包原字节；D2/D8 从本批移出不算失败。

| 冻结物 | SHA-256 |
| --- | --- |
| 原八槽包（保留） | `84f4c1f98cf42fb323fda54537ddfc465e967718c9ba88e105186e371c9d5c8b` |
| W1 六槽包 | `42d933ff7f6c0ec1d5645d125bfcc60f67e0a9b22112de50ddb84069145c67e4` |
| W1 新包绑定证据 | `292f68ca83bb4311c2ee5699f075a469bb1627b6e1880e745c4394e025ec59d3` |
| W2 20:00 两槽包 | `e38afaeb40707c94b9feede40e1aa675a90be249f037653b4a8e6a41b2928f09` |
| W2 再认证配置（未执行） | `abea23eb5ebc73f5b58ddfe0ca84851f08724785aedc4059b192cee61f660f57` |

W2 两槽只把请求中的 7 PM 改为 8 PM，并改见证 / oracle 时间；其他文字不变。跨渠道身份来自用户本次人工核对，原话、03-6264-3229 的 matched 解释和“只给日期、没有精确时刻”保存在 [user-w2-identity.json](user-w2-identity.json)。原 19:00 无位证据不改，不冒充 20:00 已认证。再认证入口要求 W1 六槽无停批且全部 EVALUATED，因此本次不可执行。

仅评测侧改动在付费前提交：25 次计账前硬拒绝、任何声明上限都要求证据导入、CLI 先验证据再构造凭据依赖、保存 TypeError 的底层 cause / code / message。3 条旧路径有效红灯及同断言绿灯已归档。原 TC 请求没有重试；本次没有再发 TC 电话 GET。

## 7. 预算账本与验证

| 资源 | 本次 D1 新增 | 3b 累计 / 上限 | 开发批次 |
| --- | ---: | ---: | ---: |
| 完整 Live | 1 | 1/26 | 1/8 |
| 真实模型 | 23 | 264/1600 | 23/400 |
| 评测公开 GET | 2 | 262/390 | 原 5 + 新 2 = **7/25**，余 18 |
| 环境重跑 | 0 | 0/4 | 0；没有自动重跑 |
| Google | 7 | 累计 19（旁账） | 本槽 7/40 |
| 网站请求 | 1,132 | 累计 1,392（旁账） | 1,130 来源接收 + 2 独立 GET，不与公开 GET 重复算额度 |

共享账本原 591 条全部原值保留，追加 27 条后 618 条，id 唯一；不是覆盖他人条目。原先 5 次认证（含失败 TC）已继承，25 次从本开发批累计 7 起算。对账：[budget-reconciliation.json](budget-reconciliation.json)。

实跑前完整五门禁及严格 G2 在净树提交 bc97c1a6 上完成，每项前后 `git status` 为空，原始日志与摘要见 [gates/results.json](gates/results.json)：

- typecheck、arch:check（含组装门禁）、build：PASS。
- npm test：**1359/1359**，46.814 s。
- test:browser:fixture：原 Chromium **188/188** + 串行 G6 **53/53**，163.502 s。
- 严格 G2：**5/5**，12 页 PASS，24.355 s；原条款组装控制 1/1。
- 无失败豁免、断言削弱、产品 / 站点 / Prompt / Schema / State 改动。门禁后和 Live 后 769 个冻结源码 / 配置 SHA 全部一致。Live 后仅新增原始产物、离线旁注和文档，不重复跑门禁冒充 Live 通过。

离线重建命令：`python3 .eval-artifacts/phase3b/g6-development-live/split-resume-20261102/audit-saved-run.py`。脚本只读已保存输入并生成独立汇总，断言原账本前缀、原评价、原文链接、GET / 模型计数及源 SHA，没有网络 / 模型入口；不读取 `.env`。凭据只在已获准的 D1 Node `--env-file` 子进程注入。

**停止状态：等待复核 B1 停批证据及下一步安排。没有继续 D3–D7、W2 GET 或 D2/D8，不合 main。**
