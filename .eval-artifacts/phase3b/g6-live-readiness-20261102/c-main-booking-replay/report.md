# C main 合入后的四轮补回放交付

2026-11-02，Vienna CET（UTC+1）。证据状态：REAL_MODEL_FIXED_SOURCE，待独立复核；只推G6工作分支，不合main。用户原条件授权在C合main后满足：远端main f992a8ac已核对包含C选店修复及A两文件fixture修复。本批Live、Google、公开GET和环境重跑均0。

## 结论

P1三种原措辞及P2预订回合4/4通过，真实模型13/20次，新增错误声明S0=0。没有模型SELECT_CANDIDATE：四轮均由生产代码产生actor=USER的CANDIDATE_SELECTED事件，causationId指向该次用户预订语义事件；每轮调用两次既有G1条款问答。源页只写包间，未写取消/卡要求，FIXTURE条款模型返回NOT_STATED，卡片terms为空，标签仅filled in。

真实模型只替换非INITIAL预订轮的restaurant_agent_decide传输；语义提取、源I/O和条款模型保持冻结fixture。它证明代码选店/条款接线在本组真实决策下可执行，不证明实时库存、真实条款生成质量或Live用时。所有用户原文/源页/期望不改，input SHA256仍6c14aacf8291c5cf4fe8dfab8be1f36314fc49796658810218269b04da4cbc4a。

## 每轮结果

| 回合 | 真实调用 | 真实动作顺序 | 选择证据 | 条款/卡片 | 结果 |
|---|---:|---|---|---|---|
| P1-0 | 3 | SEARCH_RESTAURANTS → CHECK_AVAILABILITY → PRESENT_RESULTS | USER代码事件+原用户语义因果引用 | 2次FIXTURE，NOT_STATED；卡片省略 | PASS |
| P1-1 | 3 | SEARCH_RESTAURANTS → CHECK_AVAILABILITY → PRESENT_RESULTS | USER代码事件+原用户语义因果引用 | 2次FIXTURE，NOT_STATED；卡片省略 | PASS |
| P1-2 | 3 | SEARCH_RESTAURANTS → CHECK_AVAILABILITY → PRESENT_RESULTS | USER代码事件+原用户语义因果引用 | 2次FIXTURE，NOT_STATED；卡片省略 | PASS |
| P2-0 | 4 | ASK_USER → SEARCH_RESTAURANTS → CHECK_AVAILABILITY → PRESENT_RESULTS | USER代码事件+原用户语义因果引用 | 2次FIXTURE，NOT_STATED；卡片省略 | PASS |

切换到具名目标会清空原候选，实际先重新SEARCH；代码在搜索返回后追加用户选店事件，随后才CHECK/展示。不能把本结果说成“首次Agent调用前已选店”或“无需再次搜索”。P2先询问人数，输入冻结的Two people.后再进入该路径。上述额外搜索/查位均计入本轮，不外推当前网站耗时。

四张卡片都是同店源响应的原form_course链接，日期2026-11-11/19:00/2逐项一致，没有打开链接或提交。保留已审核手续费信息；取消/卡条款为空，未从包间句子编造政策。单条source/user event ID、卡片label和绑定检查见independent-audit.json，原始模型输入/输出/完整State在../booking-replay-real各目录。

## 13次真实模型动作（全部保留）

| 次序 | 回合 | 用户轮 | 动作 | 进入该次模型前已由代码选店 | 模型latency ms |
|---:|---|---|---|---|---:|
| 1 | P1-0 | BOOK_DISPLAYED | SEARCH_RESTAURANTS | 否 | 3685 |
| 2 | P1-0 | BOOK_DISPLAYED | CHECK_AVAILABILITY | 是 | 2060 |
| 3 | P1-0 | BOOK_DISPLAYED | PRESENT_RESULTS | 是 | 1843 |
| 4 | P1-1 | BOOK_DISPLAYED | SEARCH_RESTAURANTS | 否 | 1690 |
| 5 | P1-1 | BOOK_DISPLAYED | CHECK_AVAILABILITY | 是 | 2056 |
| 6 | P1-1 | BOOK_DISPLAYED | PRESENT_RESULTS | 是 | 1762 |
| 7 | P1-2 | BOOK_DISPLAYED | SEARCH_RESTAURANTS | 否 | 2041 |
| 8 | P1-2 | BOOK_DISPLAYED | CHECK_AVAILABILITY | 是 | 2010 |
| 9 | P1-2 | BOOK_DISPLAYED | PRESENT_RESULTS | 是 | 1922 |
| 10 | P2-0 | BOOK_DISPLAYED | ASK_USER | 否 | 1534 |
| 11 | P2-0 | ADD_PARTY | SEARCH_RESTAURANTS | 否 | 1983 |
| 12 | P2-0 | ADD_PARTY | CHECK_AVAILABILITY | 是 | 1794 |
| 13 | P2-0 | ADD_PARTY | PRESENT_RESULTS | 是 | 1710 |

完整动作字段、invocationId和上下文布尔值见decision-results.json。模型latency总和26.090秒：P1-0 7.588、P1-1 5.508、P1-2 5.973、P2 7.021；这是网关报告时延之和，不含固定来源/数据库/组装开销，不是Live总时长。13个DEEPSEEK响应对应13条物理fetch前记账，无额外schema或传输重试、没有付费重跑。

## 付费前的红绿与冻结

先在6b140e8d完成整体门禁全绿，四轮fixture随后全红：它们在候选为空、legalActions.search=true时错误返回PRESENT_RESULTS+空candidateIds，运行时拒绝。C的userBookingSelection已正确绑定，首偏离点是A的fixture ModelGateway.complete，不是产品缺口；原件../booking-replay-fixture完整保留，fixture-correction.json说明根因。

f977706d只修本地fixture模型在无候选时先SEARCH，和既有预检脚本一致；没有改语义输出、用户文字、源材料、独立期望或产品。四轮修后fixture全绿，独立核对USER事件及causationId后于5415882a提交，真实调用仍0。最终整体门禁再全绿，a93c7a76提交付费前条件和原始绿灯后，才由Node --env-file注入凭据执行真实回放。原红灯、首轮全绿、修后全绿均分开保留。

## 最终完整门禁

测试提交5415882a，768份源/配置SHA不变。七项各一次、前后git status为空，没有跳过、过滤全套或门禁例外。

| 检查 | 结果 | 秒 |
|---|---|---:|
| 原条款组合 | 1/1 | 1.315 |
| typecheck | PASS | 0.483 |
| arch:check | PASS | 0.246 |
| npm test | 1359/1359 | 40.257 |
| build | PASS | 0.527 |
| browser:fixture | 原Chromium188/188 + G6 51/51 | 163.539 |
| 严格G2 | 5/5，12/12页PASS | 24.266 |

原Chromium188为独占G2 5+其余183，不重复累加；G6另串行51。gates-final保存控制器原JSON和无损日志。付费后只有账本/产物/文档变化，源SHA再次逐字核对，不重跑未变化的业务代码。

## 独立四层核对及账本

- 功能：4轮同一真实组装，代码USER选择、原用户消息因果、正确B1链接、两次政策问答，4/4。
- 质量：逐条核对用户可见消息/标签，无booked或selected声明；同店/日期/时刻/人数绑定，页面未写政策如实省略；S0=0。
- 效率：13/20物理调用，每次传输前计账；未用余7次。账本合并前G6 569、C main570，按id并集571，所有原值保留；随后新增13行到584，真实模型累计241/1600，GET255/290、Google12、Live0/26、环境重跑0/4不变。
- 安全：源I/O是固定fixture，workflow/form_course/预约/提交/支付导航0，无外部写执行；凭据只由获准Node --env-file加载，没有工具读取、打印、复制或暂存.env/密钥。产品、网站、source-packs及诊断目录相对main f992a8ac零差异。

账本逐行和金额无关的调用证明见budget-proof.json，原付款传输条目不修改。计数口径提醒：叶级preflight.json残留硬编码realModelCalls:0，传输覆盖时该字段不能表示真实调用；本次不采信它，以顶层report physicalCalls=13、13个DEEPSEEK响应及13条物理传输账本为准。原始文件保持不动，字段局限在model-accounting.json逐轮注明，不把0混入总账或结果摘要。

## 下一步

G6开发Live计划已定稿，日期仍11-03（可11-04）运行、访问11-11；pack SHA84f4c1f98cf42fb323fda54537ddfc465e967718c9ba88e105186e371c9d5c8b不变。D2/D8使用已冻结13186922+nakamata-nodoguro-ginza指针；D3/D6由代码记选择、读取条款或按既有规则省略。全部见证GET仍未执行，须用户批准Live后先认证；开发20GET硬限、留出集估算和D8模板不变。五个原偏离不重写：本次补足四个代码选择回合；原P2缺schemaVersion仍由生产既有一次重试处理，语义模型并非本次付费范围，Live照常量测。

完成后只推工作分支，停复核，等待用户批准Live，不自动认证或开跑。
