# SR04 离线定位与前端合入复核

- Status: Draft
- Document revision: 0.3
- Last updated: 2026-10-30
- Source of truth for: 用户批准的零API SR04定位、诊断透传修复、main同步与复核证据
- Related documents: [前次停止报告](WEB-WORKSPACE-SLICE1-FOLLOWUP-20261030.md), [切片计划](../WEB-WORKSPACE-SLICE1-PLAN.md)
- Evidence status: draft / not integrated；暴露开发集的离线诊断，不是Clean Baseline

## 执行前承诺

用户2026-10-30批准：只用保存的10份响应与请求，分别经无守卫和原守卫的克隆读取两次生产Gateway/Interpreter路径；再用现有评分器评价SR04，与Prompt26最近一次SR04目标规则对照。新API、Google、来源GET、Live和Holdout全部0，不加载真实凭据，不补跑模型。输入、原守卫、生产解析及评分路径先提交记录SHA；旧运行/Gold/评分器不改。

控制变量为是否套用原`semantic-transport-guard.mjs`（包含等待`response.clone().text()`）。每次Fake fetch严格核对完整保存请求，只返回原响应字节的新Response，状态200；每轮10次、无重试。实际使用生产Interpreter构造请求、Gateway读取/解析与Interpreter校验；不以独立JSON.parse成功替代生产解析。完整响应回放不重现原网络流、socket和Abort时序。

SR04随后使用相同消息、Gold5、参考时间和既有目标标注，原Compiler/Runtime生成权威Draft，复用现有目标及严格评分器；同样离线重评保存的v26提案并与原评价核对。任一解析失败或目标不一致立即停下；不调整Prompt追分。两项通过后才实施诊断透传、同步用户指定main404a766e，并重跑净树五门禁及390×844/1280×900验收。

修复承诺是失败记录与语义解释器失败结果保留安全的原始错误名/cause code；读取响应体抛异常时，结果可见原因，仍按原失败/结构化表单路径关闭，不记录密钥、Headers、URL或异常消息。复用已有失败测试，先记录未修断言失败，再修复并完整验证。只改必要诊断路径；B1链接/证据、A的Gold/评分器、B的Tabelog/G3、C的Google客户端不手工修改。main合并仅同步已接受上游改动，冲突按文件归属处理。

证据写入独立目录[离线定位包](../../.eval-artifacts/web-workspace-sr04-offline-20261030/)，原真实调用产物不可覆盖。完成后更新STATUS与历史、推送工作分支，不合main，交合入复核。

## 解析与目标核对结果

冻结提交`c1b5999e`，103项输入/脚本/源码SHA，清单SHA256 `ca72439e7020e042ebd5612e49d3f8915786a7c7da03fb7929e0356e1a04afb7`。调用`node --import tsx .eval-artifacts/web-workspace-sr04-offline-20261030/run-offline.mjs`前后核对该清单；运行期间103项未变。该清单描述修复前的定位配置，后续诊断修复和报告更新不改写旧清单。重现此历史定位须使用该冻结提交。

| 控制 | Fake fetch | 完整请求一致 | Gateway/Interpreter正常解析 | SR04 |
| --- | --- | --- | --- | --- |
| 无守卫 | 10 | 10/10 | 10/10 PROPOSED | PROPOSED |
| 原守卫，先等待clone读取 | 10 | 10/10 | 10/10 PROPOSED | PROPOSED |

守卫保存的10份克隆正文与原响应SHA逐一相同。新API请求0，未读取任何真实凭据；不是模型重跑。参见[无守卫原件](../../.eval-artifacts/web-workspace-sr04-offline-20261030/execution/unguarded.json)、[有守卫原件](../../.eval-artifacts/web-workspace-sr04-offline-20261030/execution/guarded.json)及[完成记录](../../.eval-artifacts/web-workspace-sr04-offline-20261030/execution/finished.json)。

SR04原提案经Compiler与内存Runtime得到权威Draft。与v26同一消息、Gold5、参考时刻、B类独立标注下，现有目标评分均为`SATISFIED / AVAILABILITY`；完整提案、TARGET及goalBasis、编译Patch、权威Draft、目标评分和严格评分全部相同。严格评分仍是原有`SEMANTIC_INTERPRETER`不匹配，不把离线目标通过改写为严格回归通过。[现有评分器的成对结果](../../.eval-artifacts/web-workspace-sr04-offline-20261030/execution/score.json)。

因此按用户预定规则，将原SR04新增失败归为**测试守卫或传输层，不计提示词退化**。旧真实运行的`MODEL_FAILURE / NETWORK`、严格0/15及五轮上游阻断原样保留。完整已缓存Response在两条路径都成功，不能区分原时刻的克隆/流/socket/Abort故障；原异常未保留，不能追补具体原因。

## 诊断修复与检错

复用现有Gateway的连接/读正文失败测试，把正文分支接到真实Semantic Interpreter。修复前目标断言实际为`undefined`，独立期望为`TypeError → Error / UND_ERR_SOCKET`，失败关闭与零重试仍成立。[红灯](../../.eval-artifacts/web-workspace-sr04-offline-20261030/diagnostics/red.log)。

Gateway现在保留安全错误名及最多三层cause名称/代码，失败Observer记录与解释器`MODEL_FAILURE.providerError`携带相同诊断；超时也保留原始原因。名称/代码限制为64字符标识符，过滤配置密钥及Secret前缀，不保存异常消息、URL、Headers或socket内容。共用Core诊断类型，移除重复定义；Prompt28/Proposal Schema4和重试规则不变。

原反例及相关Gateway/Interpreter文件17/17通过、typecheck通过；正文分支为原生Response/ReadableStream读取时抛错，并断言结构化表单失败结果、Observer原因相同、实际Fake fetch一次及敏感消息未保存。[绿灯](../../.eval-artifacts/web-workspace-sr04-offline-20261030/diagnostics/green.log)。这只关闭诊断丢失机制，不声称复现或修复了原网络失败。

## main同步与最终验收计划

诊断修复提交`df60d11a`；同步指定main `404a766e300668230d23c75ee7486bb3dc7a1d43`的合并提交`4746b313`。上游只有C已复核PostgreSQL证据和文档，没有可执行变化；5份状态/历史的追加冲突完整保留双方段落，修订号递增，没有手改A/B/C源码、迁移或账本。C原PG结论已随main纳入，本轮不重跑数据库。

最终门禁在另一个提交冻结后的净树执行：typecheck、arch:check、npm test、build、完整test:browser:fixture；每项检查前后净树、HEAD和输入SHA。后者包含完整工作区390×844/1280×900的十项、长条款取消冲突的两入口可见/可点以及原来源/问答三项回归，不以17项局部测试替代实际HTTP/SSE/Runtime/PGlite/Chromium链路。截图另存，不覆盖前两批截图。五门禁不读取.env或调用真实模型/来源/Google，不跑Holdout、Postgres Live或Controlled write。
