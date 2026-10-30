# SR04 离线定位与前端合入复核

- Status: Draft
- Document revision: 0.1
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
