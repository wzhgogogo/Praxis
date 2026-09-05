# Praxis Roadmap

- Status: Accepted
- Document revision: 4.0
- Last updated: 2026-09-05
- Source of truth for: 产品纵向阶段、进入条件、范围和退出标准；不维护当前实现或测试数量
- Related documents: [Status](STATUS.md)、[MVP PRD](product/MVP-PRD.md)、[ADR Index](decisions/README.md)、[Archived Roadmap](superseded/ROADMAP-BEFORE-REPOSITORY-REVIEW.md)

## 执行原则

每次只交付一个能由用户入口或Harness驱动的切片。当前是否完成以STATUS和具体证据判断；历史过程保留在日志和归档。无API网站的浏览与受控操作是核心建设方向，API按可用性选择。未知平台先验证，不以基础设施或测试数量代替产品进展。

## Stage 1 — Minimal Control Plane

- 进入：明确首个Restaurant Domain与权限边界。
- 结果：Runtime、Policy、Authorization、幂等、Verifier在Mock预约链路中协同。
- 退出：未授权、重复提交和错误成功为0，重放/恢复有证据；数据库模式分别验证。
- 冻结探针：Goal/Scheduler与合成Domain保留，只有真实切片触发时扩展，不作为Restaurant当前门禁。

## Stage 2A / 2B — Fixture Workspace

- 进入：最小控制面可运行。
- 结果：英文输入、候选、授权前检查点，以及持久Conversation/Case、身份隔离与恢复。
- 退出：Fixture用户可端到端操作并恢复同一Case；HTTP/SSE、嵌入式数据库与浏览器视觉证据分别报告。不宣称Live来源或生产身份。

## Stage 2C — Single-path Live Read Diagnostic

- 进入：语义/Agent/Validator/Router契约和只读门禁明确；来源支持遵守ADR-0015，本地profile遵守ADR-0016。
- 范围：单来源真实入口、HIGH门店身份、日期/人数/时段、页面就绪与空位；先独立Probe，再原始H001 Hybrid。
- 退出：至少一条完整Google发现→同门店来源→请求对应空位→证据约束PRESENT_RESULTS链路。受控人工恢复、固定URLProbe和原H001分别记录；不能注入手工结果或放宽HARD条件通过。
- 边界：不提交预约。私有Clean Holdout是独立语义质量工作，不阻塞来源诊断；失败达到预算后保留证据，不无限重试。

## Stage 2D — Live Search Product

- 进入：Stage 2C的一条Live只读证据链已验证。
- 结果：该能力进入持久Web Case，展示最多3家可执行候选、来源、空位时间和限制，正确处理不足候选、来源失败和过期结果。
- 退出：当前搜索产品承诺和H001–H005所需行为有执行/评分证据；完整Rubric未集成时不宣称质量门槛通过。约30秒目标按自动执行与人工等待分别测量。
- 扩展：第一路径证明后，依据实际覆盖需要加入第二路径；已有来源实现不代表它们均已Live验证。

## Stage 3 — Authorized Booking

- 进入：真实候选与可执行路径成立。
- Stage 3A：Web展示条款、用户授权一家、提交前重验、Policy/Mock Commit/Verifier闭环；Mobile接管绑定用户/Case/Task版本与Action。
- Stage 3B：一个受支持API或Browser路径完成Controlled Live-write与清理，必要时同会话人工接管后恢复；不同时建设多平台。
- 退出：真实匹配回执验证、未经授权和重复提交为0；明确失败、OUTCOME_UNKNOWN和授权失效均有验证。

## Stage 4 — Follow-through and Pilot

- 进入：一条真实预约闭环成立。
- 顺序：路线与出发信息 → 一个真实Trigger和通知渠道 → 一条取消验证路径 → 新订后取消旧单 → Pilot观测与运营。
- 退出：达到PRD Pilot指标，结果可验证、失败可解释且可恢复；跨用户隐私和状态一致性成立。

## 后续触发条件

第二个真实Domain才提取共享业务抽象；真实产品需要才扩展Scheduler、跨Case Memory和Standing Authorization；用户侧浏览器或跨Case持久会话先立部署/数据ADR。多Agent、多模型和更多Provider由测得的当前缺口触发。局部文件重构不单独作为阶段交付。
