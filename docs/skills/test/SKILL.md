---
name: praxis-test
description: 为Praxis改动选择必要的功能与安全验证，明确Mock、真实浏览器Fixture、Replay和Live的证据范围。
---

# Praxis Test

本文件唯一维护验证矩阵；当前通过数量见[STATUS](../../STATUS.md)，运行命令、失败和证据见[TEST-LOG](../../history/TEST-LOG.md)。模型质量另见[Eval](../eval/SKILL.md)。

## 验证矩阵

| 改动 | 必要验证 |
|---|---|
| 纯文档/配置说明 | 链接、命令/变量引用、权威一致性、diff；不运行付费或Live测试 |
| 局部实现/重构 | typecheck、arch:check、相关行为测试、build；共享路径受影响时运行npm test |
| Runtime、Policy、授权、State/Schema、Verifier、P0路径 | typecheck、arch:check、npm test、build及对应状态/副作用不变量 |
| Provider/Browser Adapter | Contract；操作DOM时加真实浏览器本地Fixture；有合法样本时Replay；改变平台能力声明时单独Live Read-only |
| Search/排序 | Unit与Search Harness；真实响应兼容性变化时Replay或明确缺口 |
| Web交互 | 客户端检查、相关HTTP/API与关键浏览器交互；响应式标记不能替代视觉/设备验证 |
| 语义Prompt/Contract/Scorer | 对应Unit、固定开发Regression及Eval协议要求；不自动运行或读取私有Holdout |
| Holdout纯标注数据 | 仅在任务允许修改数据时按Holdout协议做Preflight；完成后才做严格Preflight |
| PostgreSQL持久化 | PGlite集成；另经测试数据库写入授权运行真实PostgreSQL smoke |
| 冻结Goal/Scheduler探针 | 仅影响该路径时运行npm run test:probes；不属于当前Restaurant默认产品门禁 |

四条离线代码门禁是`npm run typecheck`、`npm run arch:check`、`npm test`、`npm run build`。通过后仅在新改动、失败或未解决风险需要时重复，不按测试数量扩张范围。

## 每种测试证明什么

| 模式 | 证明范围 | 不证明 |
|---|---|---|
| Unit / Adapter Mock | 参数、解析、状态/错误分支、授权与幂等 | 真实页面DOM与网络行为 |
| 真实浏览器 + 本地Fixture | 实际控件操作、异步状态、等待和恢复 | 当前网站可访问或可预约 |
| Replay | 脱敏真实响应的回归 | 当前站点状态与库存 |
| Live Read-only | 此次环境下连接、门店、请求条件与空位 | 真实提交成功或长期可靠性 |
| Controlled Live-write | 授权范围内真实写入及验证/清理 | 未测平台或任意网站自动化 |
| Embedded-postgres integration | PGlite的SQL/事务/恢复 | 真实PostgreSQL部署 |

首次接入没有Replay样本时明确记录缺口，先做受控只读观察，再按来源政策建立脱敏回归。合成HTML不命名为Replay。未来Golden目录项不自动成为当前Stage必过项。

## 关键行为

- 优先测试外部行为与状态转换，不重复等价私有分支，不因覆盖率保留旧实现测试。
- 未授权Commit、重复提交、错误候选/Attempt Evidence导致的成功均为0；`OUTCOME_UNKNOWN`禁止再次提交和换店。
- 新Proposal必须有新Authorization；跨用户Case、Takeover和Profile访问被拒绝；Projection不改变权威State。
- Browser条件修改后观察新请求对应结果；旧slot、加载中、challenge或未知页面不能形成AVAILABLE/UNAVAILABLE结论。
- 检测到控件、尝试操作、观察到生效分别记录；未实测为未验证。静态只读限制不冒充副作用实测计数。
- 确定性时间逻辑用Fake Clock；浏览器deadline另做有界异步验证，空waitFor不证明浏览器行为。

## 测试维护与退役

- 新增自动化测试前搜索同一行为的既有覆盖，优先扩展所属测试。说明新增测试能捕获什么现有测试漏掉的失败；无需为每个模块、函数或改动机械新增测试文件。
- 同一输入、同一执行路径、同一失败后果只保留一处主覆盖。等价数据变体使用带案例名称的参数化断言；不同故障机制不要为了降低数量塞进一个大测试。
- Unit负责规则与边界，集成测试负责规则接入、事务和真实协议；跨层重复只有在能捕获不同故障时保留，不把Unit的全部组合复制到Harness/Web。
- 替换实现或修复缺陷时，同一改动中检查相关旧测试：更新仍有效的行为断言，删除被替代路径及重复回归，保留真实状态所需的迁移验证。新增缺陷用例优先并入所属行为测试，不无限追加独立回归文件。
- 不绑定无契约意义的私有调用次数、文案、CSS断点或源码形状；时间/重试预算、Secret隔离、授权和副作用次数属于真实契约，应保留。脆弱测试修复等待与观察条件，不通过重试或放宽断言掩盖失败。
- 默认套件只收当前产品及其维护所需的离线行为测试；浏览器、冻结探针和Live按现有独立入口运行，不为减少报告数字隐藏当前必需测试。
- 涉及测试变更的交付简记新增/合并/删除及覆盖去向，关注重复setup、运行耗时、偶发失败和维护成本。数量与覆盖率不是增长目标，也不设强制删除配额；只审查当前受影响范围，不每次全仓盘点。

## 运行边界

普通测试不加载.env，不调用付费模型或外部生产服务，不创建真实预约。`test:browser:fixture`只启动本机浏览器和本地Fixture，不读取站点Cookie或个人profile；缺少浏览器时明确失败，不伪装为通过。

真实PostgreSQL仅使用授权专用测试库和`PRAXIS_ALLOW_TEST_DATABASE_WRITE=1`；Live/付费实验还需对应开关与用户授权范围。Controlled Live-write不能在CI运行，完成后记录取消/清理。环境开关不等于授权。

报告通过、失败、未运行、不适用及原因，分别列运行模式；不能证明真实结果或清理失败时明确保留限制。
