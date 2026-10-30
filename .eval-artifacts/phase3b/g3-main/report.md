# G3/G3c 签收后主线整合验收

2026-10-30T11:17:38.824080+01:00，Vienna CET（UTC+1）。**全量离线验收通过，获用户批准发布main**；本报告先归档验收，具体main合并SHA及远端核对在本回合发布回执/C通知中给出。

已复核G3/G3c `02163d39467a0a04f261ae2a6b426b292b1e185e`（原候选d7131675）同步最新main **`4cbc521bb9e4fb177e247266561bd90eb5d34e3f`**。本次统一受测候选 **`8025362b44aa3f08137f4e9aab4e2f187556e310`**。仅合并与保留文档，无新增产品/测试/Prompt/State/Schema/Guard改动。实际源码冲突0；main的20份来源文件/配置继承、G3核心原字节核对见[来源保留凭据](source-preservation.json)。

用户转达的独立复核：2核Linux对原G3分支type/arch/build、默认1241/1241、Chromium180/180、普通及严格G2各5/5，所有检查净树。该结果归属于复核者，不冒称本批Linux实测；本批是macOS本地Chromium与fixture模型。

## 同一候选门禁

| 检查 | 结果 | 秒 |
|---|---|---:|
| typecheck | PASS | 0.510 |
| arch:check | PASS | 0.233 |
| npm test | **1242/1242** | 29.784 |
| build | PASS | 0.499 |
| test:browser:fixture | **186/186**，G2独占并发1后其余并发4 | 130.563 |
| PRAXIS_G2_REQUIRE_PASS=1 npm run test:dom-change | **5/5测试，12/12页面PASS（Tabelog6/6）** | 24.238 |
| 旧367组/481状态 | 仅用户已批准的一项MET→NOT_CHECKED | 0.139 |
| 旧事实完整字节回归 | **44,197字节完全相同** | 0.144 |

八项执行前后均`git status --porcelain`为空；输入/外层脚本先提交，721项SHA前后相同，无恢复、跳过、todo或重试。实际失败0，未触发停止条件。[完整门禁命令/日志SHA](verification/gates.json)、[严格逐页结果](strict-pages.json)。统计变化来自已批准main的现有前端覆盖，本批不增删测试。浏览器只测一次，不称三次中位数。

旧条件唯一变化仍是请求2人、8,000日元上限，对原文至少4人的报价MET→NOT_CHECKED；其余480状态不变，原始报价保留。[逐项对照](verification/legacy-state-changes.json)。旧事实SHA `9a3298bc5e004b99e41d80713e8913b68c336cfa594f6eb60599e310ee3fb633`。[字节检查](verification/hard-bytes.log)。

## 合并与文档

实际6份文档冲突（不是试合并预计的2份）：STATUS、ADR索引、DEVLOG、TEST-LOG、月度索引、月度摘要。所有双方历史正文逐行（含重复行次数）保留；只合并重复revision页头，月度标题采用main更新版本；ADR0049同时保留用户批准日期与ADR0050对提示展示的部分替代说明。0047、0048、0050全部保留，不改变Accepted正文。[冲突输入/解决SHA](integration.json)、[正文保留核对](document-preservation.json)。构建原始日志空白逐字保留，格式检查对原始log/diff与当前源码文档区分。

本次不重复构造修复红灯；复用用户已经签收的逐组红绿、跨归属和输出格式，[完整G3/G3c报告](../g3-longrun/16-form-course-and-completion/report.md)及其冻结原始证据不改。合main前确认远端仍为4cbc521b，合并树与已验证工作分支树一致，源码/721项冻结输入在文档归档后再核对；推送不覆盖并行新提交，ls-remote确认后通知C。

## 后续（本批不做）

- provider observation的`verifiedHardCriteria`已无非空生产者；相关可选字段、条件透传、`matchReasons`旧文案投影及旧直接构造测试待后续删除。库存/身份grounding仍有生产调用者；Google和Source2 `MODEL_JUDGMENT`的合法criterion claims保留。不做全局删除或额外改造。
- **G3b/TableCheck查位**等待第一次Live保存到有真实时段的日历；本批不伪造日历、不跑Live。
- 当前网站连接/库存、新Source2真实模型质量及Live独立S0仍未评价，不能由离线门禁推导。严重程度不填无独立证据的0；Mock、本地构造Chromium、固定保存页回归与Live分开。

真实模型/Google/餐厅网站/Live/公开GET/环境重跑新增均**0**；未读取.env或QA参考答案。账本保留485条并按id追加本批0调用为486条，累计值不变。[追加凭据](ledger-append.json)。

冻结清单SHA **`66a871fa94ef6f895e2d4b53d5e47724a405cead2307574c70d5083e2e9a835b`**，外层脚本SHA **`d34dec44eb3d270810454a5c5892bc8868e877fa65377327b89123c44c0effcf`**。[冻结清单](input-freeze-gates.json)。按用户批准合入推送main，通知C新main提交后待命；不启动清理或G3b。
