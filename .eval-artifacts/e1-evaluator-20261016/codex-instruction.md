# E1：评测器第一切片

状态：可以开始写代码。验收的最后一步要等用户在 "Phase 1 Run Labels" 页面完成 22 条运行标签和 8 组措辞判断，由复核者导出为 `labels.yaml` 和 `criterion-equivalences.yaml` 提交后再做。开始前 `git pull --ff-only`。

依据（按此顺序读）：

- `docs/skills/eval/SKILL.md` 2.0：四层结构、独立 oracle、输入冻结；
- `.eval-artifacts/review-eval-test-20261015/independent-review.md` 第一节：评测器的保留、改造与新增；
- Playbook 1.9 附录 D 第六组第 2 项；
- P2-0 与 T1 复核。

本批全部离线：**不跑 Live，不调用模型，不访问网络。** 不改 Gold、变体、见证，不放宽生产交付资格，不改生产代码的行为（第 8 项外层脚本除外，它不在本批运行）。

## 为什么做这一批

第一阶段和 P2-0 中有交付的 8 次运行，自动评价只判对 2 次：5 次因为条件措辞不同判为 UNKNOWN，1 次判为 NO。每次都要人工复核才能得出结论。评测器还有三处"自己证明自己"：

- Tabelog 的日期和人数是从请求复制过来再与请求比较；
- 营业时间直接调用生产函数；
- 资源维度只和声明的上限比较，不看实际生效值。

本批目标：评测器的结论能独立成立，并与人工标签一致。之后的找店改进靠它比较前后效果。

## 0 校准输入包

E1 验收要离线重评 22 次运行，原始 `result.json` 只在你本机的冻结工作树中。

- 把这 22 次运行的 `result.json` 以 gzip 压缩，放到 `.eval-artifacts/calibration-phase1-20261015/inputs/<run-id>.result.json.gz`。`<run-id>` 用标签页上的 ID，清单见 `run-inventory.json` 和 `label-sheet.html` 中的 `RUNS`，另加 `p20-h002-a1`、`p20-h001-a1`。
- 另写 `inputs/manifest.json`：每个文件的原始路径、原始 SHA-256、压缩后 SHA-256、大小。
- **压缩后总量超过 60 MB 就停下报告，不要提交。** 仓库是私有的；这些文件含来源页面内容，不得放到任何公开位置。
- 这些文件按 Eval Skill §5 是评测输入：提交后不再修改。复核者会用同一份输入独立重跑评测器。

## 1 读取层

- 把 `result.json` 解析成有类型的运行记录，只覆盖评测器实际用到的字段。之后的判定不再到处用 `asRecord` 取字段。
- 旧 Schema 的产物缺字段时，相关判定为 `NOT_EVALUATED`，并写明缺哪个字段；不猜测，不补值。

## 2 条件措辞等价表

- 新增一个版本化文件（建议 `src/eval/restaurant/agent-loop/cases/criterion-equivalences.yaml`）。每条记录：
  - Gold 写法、系统写法；
  - polarity；
  - 结论（`SAME` / `DIFFERENT`）；
  - 决定人、决定时间、来源运行。
- 初始内容由复核者根据用户在标签页上的 8 组判断导出并提交，你不要自己填写结论。在那之前用空表开发，测试用测试专用的小表。
- 加载器拒绝未知键和 null；按 Eval Skill §5 记录 SHA。
- `compareCriteria` 的规则：
  1. 字面相同，或表中有一条 `SAME` 且 polarity 一致：判为等价；
  2. 表中为 `DIFFERENT`：判为冲突；
  3. 表中查不到：仍为 UNKNOWN，并把这一对写进评价输出的"待审措辞"列表。
- strength 和 polarity 继续单独比较，不因措辞等价而放过。
- **不使用模型评判。**

## 3 独立核验（去掉"自己证明自己"）

1. **Tabelog 空位。** 日期、人数、时段只能来自来源的原始观察，按优先顺序：
   - 交付后 GET 的原始响应；
   - 运行中录制的 `find_vacancy` 原始响应；
   - 录制的页面快照。

   都没有时为 `NOT_EVALUATED`。**不再使用生产代码从请求复制进证据的字段**（`diagnostic-evaluator.ts` 约第 776 行）。
2. **营业时间。** 评测器不再 import 生产代码 `read-grounding.ts` 的 `openingHoursForRequest`（评测器第 5 行、约第 762 行）。改为评测器自己的最小实现，或固定样例表；与生产实现的差异要有测试覆盖。
3. **依赖检查。** 在 `arch:check` 中加一条规则：`src/eval/restaurant/agent-loop/diagnostic-evaluator*.ts` 不得 import 生产代码中做合格判断的模块，至少包括 `read-grounding`、`read-assessment` 和 `action-validator`。类型 import 不算。失败码的系统／业务分类（`failure-codes.ts`）可以读取，但不能单独决定结果类型。

## 4 结果类型与严重程度

- 按 Eval Skill 2.0 §1.1 和 §1.3，为每次运行输出：
  - 结果类型：QUALIFIED_DELIVERY、DELIVERED_UNQUALIFIED、HONEST_NO_RESULT、CAPABILITY_MISS、INTERNAL_FAILURE、ENV_FAILURE、ORCHESTRATION_INTERRUPTED，另加 NOT_A_VALID_SAMPLE；
  - 是否有 S0，以及 S1–S4。
- **推导只能用环节判定和外部 Gold**：冻结用例、见证、交付后 GET、等价表、外层编排记录（中断、环境失败）。
  - 不读生产代码给出的合格判断；
  - **不读人工标签**。标签只用于验收比较，不能成为评测器的输入。
- 判定规则写进代码的同时写进文档（Eval Skill 或验收契约，二选一，不要两处各写一遍），包括用户在标签页 "Your call" 中定下的五条口径。复核者导出标签时会把这五条口径单独列出。
- 规则得不出结论时，输出 `NOT_EVALUATED` 并写明缺什么，不选一个"最像的"类型。
- **没有见证或运行后见证时，不得判为 CAPABILITY_MISS。**

## 5 见证漏斗

- 有见证文件（含运行后见证，例如 `p2-0-hardening-20261015/prep/live/h001/witness-after/`）时，对每家见证店输出：
  - 是否被发现（跨来源按名称和地址匹配）；
  - 是否完成身份与事实核对；
  - 查位结论与原因码；
  - 是否展示。
- 据此给出候选卡点（Eval Skill §1.4），标为 `HYPOTHESIS`，不标 `CONFIRMED`。

## 6 Agent 行为：无进展检测

`INVESTIGATION_BEHAVIOR` 增加以下统计，任一超过阈值就判为 `NOT_SATISFIED`，阈值写在代码常量和文档中：

- 被拒动作数；
- 连续没有新观察的步数；
- 同类动作重复失败（例如同一检索词连续返回 0 家）；
- 同一 URL 重复加载。

**验收样本：**

- P1-G2 h001（24 步死循环）必须判为 `NOT_SATISFIED`；
- P2-0 h001 第 4–6 步同一检索词连续 3 次必须被报告出来。

## 7 资源与实际生效限额

- `RESOURCES` 与执行器诊断中的 `effectiveLimits` 比较，不只是 `runCeilings`。
- 两者不一致时单独报告。旧产物没有 `effectiveLimits` 时为 `NOT_EVALUATED`。

## 8 外层脚本：无结果运行补见证（只改脚本，本批不运行）

- Live 外层脚本在每次 0 交付的运行结束后，立即对该用例已登记的见证店做一次已批准的四参数只读 GET（Tabelog `find_vacancy`），不调用模型。原始响应保存在运行目录，作为第 5 项的输入。
- 没有登记见证店的用例（原版实时用例）不做。
- 按 Eval Skill §5，这是被评测的配置：提交并记录 SHA，下一次 Live 前冻结；在 dry run 中证明它只在 0 交付时触发，且只请求已登记的店。

## 9 h001 回放种子

- 从 P2-0 h001（`p20-h001-a1`）取两个决策点，按现有回放种子格式加入新版本种子文件：
  1. 第 1 步 Tabelog 找店只返回 1 家之后的决策；
  2. 第 8 步从 Google 37 家中选 3 家查位的决策。
- 可接受动作由你提议，标为"待独立标注"，不计入任何通过率。
- 种子标注不得写死"必须选 Matsumoto"；可接受集合应当是"选一家可经已支持来源查位的候选"这类条件。
- 本批不执行回放（不调用模型）。

## 版本与产物

- evaluator 升级为 @29，rubric 递增；旧评价产物不覆盖，不重标历史结论。
- 测试优先用真实产物（第 0 项的输入包）构造反例，例如把产物中 Tabelog 展示的日期改掉一天：@28 仍判为满足（红），@29 判为冲突（绿）。手工构造的 artifact 只用于真实产物中不存在的情形。

## 验收

1. 每项先红后绿，各自单独提交。门禁：typecheck、arch:check、npm test、build。本批不涉及浏览器路径，不要求 `test:browser:fixture`；如果改动了浏览器相关代码，按 Test Skill 1.4 补跑。
2. **校准比对**（等复核者提交 `labels.yaml` 和等价表之后做）：用 @29 离线重评 22 次运行，输出逐次对照表，列出：
   - 自动结论：结果类型、S0、严重程度；
   - 人工标签；
   - 是否一致；
   - 分歧原因。

   通过条件：

   - S0 22/22 一致；
   - 没有任何一次"人工判为不合格或无交付、自动判为 QUALIFIED_DELIVERY"；
   - 8 次有交付的运行，结果类型全部一致；
   - 其余分歧逐条说明属于哪一种：规则缺口、Gold 缺失（判为 NOT_EVALUATED），或评测器错误。评测器错误必须修复后重跑。
3. 报告注明：这 22 次运行和等价表都来自开发中已暴露的运行，一致率是开发集上的结果，不代表对新用例的准确率。

汇报写入 `.eval-artifacts/e1-evaluator-20261016/report.md`，内容包括：

- 各提交号；
- 红灯与绿灯日志；
- 输入包清单与 SHA；
- 校准对照表；
- 门禁结果；
- 仍为 `NOT_EVALUATED` 的维度及原因。

本地提交，不推送，停下等待复核。

## 不在本批范围

- 耗时分解、推荐偏好与排序、决策质量评分（Playbook 第六组第 3 项，E2）；
- 安全维度（随预约一起做）；
- 录制按页判定（L2）、决策回放进入每批必跑（L3）；
- 任何 Live 运行。
