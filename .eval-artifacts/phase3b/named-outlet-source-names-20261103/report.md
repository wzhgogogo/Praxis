# 具名店来源名唯一性：离线候选

- Status: implementation candidate / not integrated；已暴露开发回归，非 Clean Baseline。
- Vienna CET UTC+1，2026-11-03；在 a0fe3a6c 后补修，只推工作分支、不合 main。
- 本次真实模型/Google/网站/Live 调用全部 0；未读取或加载 .env。

## 切片和版本

D1 的 Google `Dengana Akabane` 原字段与 D3 原始语义字节在普通 `createLiveReadAssembly` + 持久应用/Router/Reducer 中走到查位、展示、B1 和两条条款。浏览器页面/空位和后续动作是构造 I/O，不能报告为真实 Dengana 当前库存或新 Live。

保持 State25 / TaskDefinition23、Semantic Prompt26 / Proposal4 / Draft3、Agent Prompt/Context/Action Schema；只复用既有 ENTITY_MATCH、NAME 引文和自由 claims 字段，不增加持久字段、动作或事件形状。用户选店事件仍为 USER，未授权提交。

## 实现边界

- Google 初始匹配保留 `possibleNamedOutlet` 的候选发现语义；相似度永不直接接纳。完整分页状态、全部可能候选数量和 typed address locality 与原来源绑定。
- 只允许一个完整包含候选进入原有只读身份/查位链路。多店先询问；最终展示、选择、条款、B1 仍需名称消歧及既有 HIGH 来源身份。候选缓存/原 Google 显示名不替换。
- 原 DISCOVERY `AMBIGUOUS` 是当时检索的临时记录，不伪改历史；当前唯一性由同候选的后续身份和实际页名派生。它不再被解释为永久阻断。
- 来源全名：只旁听已有快照、调用已有两站身份解析器；只有同候选/同来源/同 URL 的 HIGH 身份结果才附实际名称及 NAME 引文。没有自行导航、解析响应或放宽身份比较器。
- Google 日文名来自相同 Place ID 的来源原文，保留实际语言码；共享现有 run 缓存与请求上限，读回证据不发请求。日文用户名称无法与英文显示名对应时，只在现有 Tokyo 候选范围内按 ID 请求原文（每 ID 最多一次；失败计数且不重试），仍需来源身份。
- 包含：整名边界、NFKC/大小写/空白规范化；有限明确菜系/分店词（kushi katsu、kushikatsu、sushi、ten、honten、串カツ、寿司、本店、店）。其余词必须来自 typed Google 地理组件且逐字出现在候选地址，不能把建筑词当作地名。未知别名、缩写和未经来源证实的跨语言名称均不猜。
- `userBookingCandidate` 复用当前已核实的名称引用；不会因为 Google 名不同而漏掉同店选店/条款。其他预订触发条件不变。

## 红绿与运行记录

- d1c5b683：两项正控制停在 NEEDS_INPUT，身份反例确认未进入读取（第三个红只证明当时没有读取，不能声称已测身份拒绝）。两家/错误地名原控制通过。
- 8a04aaea：首六项 6/6。
- 155c66e1：48/49；新增 TableCheck 因沙箱内 Chromium 无法启动，原始环境失败保留，未报产品通过。
- bab2defe：允许启动隔离本地 Chromium 后 50/50，原八项控制和所有原断言保持；新增 TableCheck 经过原身份代码，并未为绕开失败修改产品身份规则。
- 最终冻结 **2354b2bdf93615e86984da123c26c32ffb020c52**：实际完整 SHA 见 `gates.json.sourceCommit`（下表）；756项 SHA。五门禁及严格 G2 全绿，所有项前后 git status 为空，没有外层超时、跳过或自动重试。

| 检查 | 结果 | 耗时 |
|---|---|---|
| typecheck | PASS | 0.586s |
| arch | PASS | 0.231s |
| test | 1372/1372 | 44.354s |
| build | PASS | 0.524s |
| browser-fixture | 188/188 | 148.628s |
| strict-g2 | 5/5；12页全部PASS | 26.612s |

前后完整性检查通过；独立新7帧 + 原控制9帧，共16帧通过。`gates/test.log.gz` 保留含原始模型/页面/事件捕获的完整日志；`gates/independent*.log` 单独保存独立评价，不覆盖执行结果。



## 文件归属与安全

本次不改任何 A 的 eval/harness 文件、B 三个 G3 文件、身份比较器、查位/响应绑定/预约链接规则、两次校验、条款读取和20秒保留逻辑。全部源码及冻结输入已在 freeze.json 逐项 SHA；verify.py 比较 a0fe3a6c 的保护文件与版本源码、D1 Git 原件、D3 原字节、账本原有627行。

## 四层证据

1. 输入/权限：D1原件与提取字段、D3原字节；calls0、未读.env、工作分支。
2. 执行：固定模型/来源 I/O 的普通生产组装，原始模型请求、快照、事件、轨迹、view 与耗时记录在测试日志中的捕获帧。
3. 独立核验：evaluate.py 用 Python 字面输入和原始快照核对名称/电话/引用/原链接/不展示/不提交，不导入生产解析器或身份判断；执行与核验分开。
4. 结论：离线产品合同回归；不等同于真实模型会如何选择动作，不报告新的找店成功率，实时站点结构/库存/网络仍未评。

## 账本

原627行逐项保留，仅追加 C 本轮零调用一行；额度与累计数不变。最终十步前后净树，结束后推分支并 ls-remote 核对，等待复核。

## 逐项观察（固定I/O，不是新Live成功率）

| 输入/反例 | 结果 |
|---|---|
| D1_D3 | PRESENT_RESULTS；交接 1 |
| SOURCE_FULL_NAME | PRESENT_RESULTS；交接 1 |
| CONTAINMENT_ONLY | PRESENT_RESULTS；交接 1 |
| TWO_CONTAINED | NEEDS_INPUT；交接 0 |
| WRONG_LOCALITY | NEEDS_INPUT；交接 0 |
| IDENTITY_CONFLICT | NEEDS_INPUT；交接 0 |
| TABLECHECK_SOURCE_NAME | PRESENT_RESULTS；交接 1 |

原八项控制全保留，包括后补用户地区；Google同ID日文名组件验证了原文/语言/缓存和合计2次构造请求，计入既有Google上限。额外词边界另覆盖：地址存在但不是typed地名的建筑词、未知别名、Sen/Senga字内片段均拒绝。旧B1/G6、条款、HTTP和选店原断言都未改。

本轮不是37家基准，不提供新的成功率。来源名只信实际读到且已绑定身份的原文，不主动穷举未读的别名。无法得到这些证据、非唯一或不满足可调查引用的候选，仍交给 ASK_USER；真实模型决策和当前网站/库存均留待另行授权验证。

最终提交只补文档/原始运行与评价产物；源代码保持上表冻结SHA，提交后复核verify.py，不需要因结果归档重复全部门禁。工作分支 `codex/fix-phase3b-named-outlet-without-area` 推送供复核，不合main。
