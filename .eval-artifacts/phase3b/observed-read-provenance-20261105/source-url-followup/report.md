# 来源确切网址与独立表单审计：续作检查点

- 时间：2026-11-05 15:44 Vienna CET（UTC+1）
- 状态：**draft / not integrated；未满足合入验收**。已暴露开发录制，非 Clean Baseline。
- 基线：40ba7ea5；本次不合 main、不运行 Live，不更新仅在合入时更新的共享 STATUS / DEVLOG / TEST-LOG。
- 真实模型 / 网站 / Google / Live 新增调用均 0；没有读取或注入 .env，没有读取私有留出集。库存 UNKNOWN 不算无位，不算通过。

## 改动与已完成证据

1. `BrowserTaskExecutor.navigate` 恢复原样打开来源绑定确切 URL 和本次观察 href；仍经过来源、禁止路径、Guard、重定向边界及原预算。未恢复 URL 模板、构造、固定地区序列或 GO_BACK。未发布 Browser Prompt@21 仅澄清措辞；其他已批准版本不再变动，Agent Prompt@29 / Context@17 保持原字节。
2. 来源原生列表由普通观察模型确认，随后读取列表实际提供的详情 href；每家身份/地址/来源坐标/原半径核对不变。保留批次 5、来源详情 10、列表页、地区页 4、检索页 3、来源 90 秒及整单原限制；没有从超时/未确认列表推导来源穷尽。候选导航失败退休上下文；未开始的候选保留；不会因恢复会话丢掉先前合格候选。
3. H001 固定模型迁移到当前 DOM 动作；原来的最终交付、HARD、异地拒绝、失败后继续、候选保留、跨来源批次预算断言保留。删除的实现断言是已退役的 SELECT_REGION_ENTRANCE 集合动作、固定两样本纠正、自动改写/回退检索序列。替代覆盖在同一文件检查当前观察 ref、非法自由输入/未知链接拒绝、最终交付和无隐式通用检索。导航次数由旧 query/hint/fallback 四次变为实际 root/region 两次；七候选仍全部受每批五家上限约束，调度切分由 5+1+1 变为 5+2。这些是执行路径迁移，非新 Gold 或 Live 成功。
4. 标准 Live 外层的独立原生表单审计已接通：独立 CDP isolated world 捕捉原生 formdata / trusted input，实际 formSubmissionGet 与实际 Request 对应；只保存字段名与 SHA，不保存页面隐藏原值/用户输入原值。评分不导入 Guard 的值来源判定；按权威请求/来源名称重算散列。未知来源、缺原生关联或别名来源证据时仍为 EVIDENCE_GAP。生产 receipt 只提供待核对事实，不能自己使评分通过。
5. D4 真实 HAR 回放实际发出的 Search 有一份独立原生证据，`independentFormAudit[0].status=SUPPORTED`（见 audited JSON，外层 browserTrace[98]）；这只通过该次表单边界核对，**不是整链成功**。本机 Node/BROWSER 两种传输、隐藏默认值、未授权输入、POST、跨源、禁止路径、popup/iframe、非表单敏感参数和逐请求时间线控制另见日志。
6. 删除 run-hybrid-live-read.ts 中已无生产者的 SOURCE_FLOW_ENTRANCE_SELECTION 捕捉分支。历史录制解释保留显式 retired-action 拒绝，不让旧动作继续执行。历史 suggestion 录制安全保留器按用户本轮例外保留，列为 3b 后退役项。

## 真实录制回放（0 真实调用）

| 对象 | 范围与实际进展 | 首个剩余阻断 / 结论 |
|---|---|---|
| D4 | 首页→Akabane→真实 fragment 地点项→回读标签→原生 GET Search→Ageage / Dengana 详情。来源坐标分别在中心约 214 m / 177 m，均进入候选；Ageage HARD 类别已由生产链核对。来源为 stop3 的原 HAR 和 W1 保存页。 | 选站后的 cuisine 辅助联想响应缺失，明确 abort 并标注 partial-fidelity；Tanaka 详情无合格页。两家详情在活动 HAR 重放后没有可操作日期控件，查位均 REQUEST_SELECTION_UNCONFIRMED / UNKNOWN；无展示、无 B1，G1 追问未发出。**未完成交付验收**。 |
| D3 | **定向回放（自搜索结果页起）**；起点是原 manifest snapshot 2 的确切记录 URL，仅 eval runner 注入。原语义与 Agent outputText 原字节，实际 #3 CHECK / #6 PRESENT 都仍指向 Dengana `praxis:restaurant:07b0ba0daee00150d6d202e1`。 | 已到原 Tabelog 店并进入查位；新链路需要 restaurant_source_facts，但旧原始模型记录没有该目的输出；原日期点击在当前 DOM 无唯一同义 ref，未执行。原 PRESENT 未交付，后续输出不足，FAILED。不是新入口完整回放，不补造响应/模型输出。 |
| D5 | **定向回放（自搜索结果页起）**；原 #2 ASK_USER 先补日期，再 #5 CHECK / #8 PRESENT 同一 Dengana。原件引用见上一层 d3-d5-input-refs.json。 | 与 D3 相同：source-facts 输出及可重绑定日期控件不足，补日期后 FAILED。没有把“原模型仍选同店”当作不退化通过。 |
| D8 | 从原用户消息走普通生产组装，三个近名候选仍使用原身份规则。 | 本次原件没有合格的新 Tabelog 首页入口；三次来源入口各在 DOCUMENT_NOT_QUALIFIED 停下，最终 NEEDS_INPUT。不能从缺页推断 UNIQUE、无位、Tabelog B1 或条款成功，未增加跨语言别名/相似度规则。 |

D3/D5 的 Google websiteUri 原件是 stores.dengana.jp；旧流程是代码构造搜索 URL 再进详情。已按用户确认纠正此前“原来直接进详情”的描述。起点注入只在 `run-observed-source-replay.ts --targeted-recorded-entry`，产品没有回放专用分支。旧快照与 HAR 未修改。

`D4-current-observation-replay-audited.json` 保留普通持久组装的完整产物、固定模型调用、实际浏览器动作、诊断和独立时间线。D4 的模型替身按现有来源原句选类别，属于固定模型回放，不冒充真实模型本次调用或原始模型选择。D3/D5 的缺失输出未被替换。

## 验证与未完成项

| 检查 | 结果 | 说明 |
|---|---|---|
| 来源 URL 红→绿 | 原实现拒绝合法确切来源 URL；修复后绿 | logs/source-exact-url-{red,green}.log；未知目的地/不安全来源仍拒绝 |
| native composition + native search + executor + diagnostic evaluator 相关集 | **258/258** | H001 迁移、资源/候选保留、独立表单检错均在此；不是默认全套 |
| 实际本机 Chromium 表单 + timeline + Guard 相关集 | **25/25** | 两种传输与独立观测；不是全 Chromium 门禁 |
| typecheck / arch:check / build | **通过** | arch 0 forbidden dependencies |
| Tabelog / TableCheck 旧 Adapter 单元回归 | **63/111，48 红** | 明确尚未闭合；入口仍用无 networkPolicy / 无观察模型的旧替身，旧 URL 构造/固定控件序列合同也待迁移；未逐项证明全为夹具问题，不能一概归为无关。详见 remaining-adapter-failures.json 和原日志。不删断言/排除文件凑绿。 |
| 五门禁全套 / 严格 G2 / G6 全组 | **未运行** | 尚非合入候选，按工作规则不反复跑全套；存在已知红灯与真实回放缺口 |
| 合入 main / Live | **未执行** | 保留用户指定 Live 前停止点，当前更未满足合入前置条件 |

因此不能报告已恢复 D3/D5 到交付，也不能用 258/258 替代主验收。下一步分开处理：离线继续迁移剩余 Adapter 观察模型夹具；实际录制缺口交复核确认补采/补充原件方式，在授权前不请求新页面、不替旧原件造响应。当前不提议增加时限/预算或放宽身份、安全规则。

## 必要配置与边界

保留的全部平台配置类别：两平台公开启动 URL；既有 document origins；静态资源与动态响应允许范围；禁止路径/CDP 边界；来源 skill 路径；来源字段/店号解析与既有身份规范化；来源包 candidatePath 和 Agent availabilityPath 事实；B1 来源链接/参数双重校验与已有固定手续费配置。不把这些当作未观察动作、目录模板或固定点击顺序的许可。

没有修改 State@25、TaskDefinition@24、语义 Prompt@26 / Proposal@4。版本轴仍按原已批准方案。

## 自动审批记录

一次拟运行命令包含“对缺失 restaurant_source_facts 返回空 selections”的回放改动，被自动审批拒绝：这会合成原录制没有的模型输出，违反本次不补造要求。命令未执行，该替代未进入文件/提交；缺口照原记录保留。没有换工具绕过拒绝。
