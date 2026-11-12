# 两个真实使用者的前提未满足：按授权停止

2026-11-12 CET；draft / not integrated。源基线main `32b97ed812be10e80a683ad1f2be8caba5608bf0`。本轮最终产品、Prompt、Fixture、评价器及编排均零改动，0 Live / 0 网站GET / 0真实模型调用。

## 直接证据

来源为证据分支 `codex/chore-seed-post-fix-evidence-03`，提交 `53d651854158d5b7666f0f9dec15d02840d41a24`：

`.eval-artifacts/phase3b/seed-d02v-r4-pathfix-20261112/D02V-r1/runtime/dev-d02v-paging-r1/execution.decisions.jsonl`

原始文件SHA-256见 [group-evidence.json](group-evidence.json) 的 provenance；本次只提取已暴露D02-V的观察/目标/请求值，不复制完整messages、不读取私有题面。

| 文件位置 | 原始观察事实 |
| --- | --- |
| 第10行，sequence10，recordingSnapshot12，user消息observation.targets中的 `observation:1:target:114` | 模型选中的日历推进目标是LINK，label `Next month`，`controlGroupLabel: Calendar`，`controlGroupRef: observation:1:group:13`；其现有安全动作是CLICK，href为本页片段链接 |
| 第11行，sequence11，recordingSnapshot13，同一个日历推进LINK | `controlGroupRef: observation:2:group:13`，仍属13组 |
| 同第11行，目标 `observation:2:target:10` | 请求日期的BUTTON `Date 2026-12-10` 已出现，`controlGroupLabel: Calendar`，但 `controlGroupRef: observation:2:group:1`；现有动作CLICK_AUTHORITATIVE:DATE |
| 第12、13、14行，snapshot14→15→16 | 人数推进目标和8人按钮均属于同一个人数组，能支持人数场景；仅这一个使用者不足以满足本轮前提 |

关键区别并非观察版本从1变2：**在同一个 observation:2 内，推进目标是group13，日期选项是group1。** 相同的Calendar展示标签不等于相同的已绑定控件组，不能用标签合并，也不能把整页日期搜索替代“同组内匹配”。现有安全CLICK支持本页片段链接，因此不是仅凭LINK类型就断言该推进不可用；决定性的阻断是组身份不同。

完整投影见 [r1-observations.json](r1-observations.json)。[verify-group-evidence.py](verify-group-evidence.py) 对同观察内两个不同groupRef做独立字面量断言；它不是产品完成条件或网页回放。

## 为什么停止，而不是继续扩展实现

用户要求：“检查同一个controlGroupRef中是否出现可选的目标值”；又明确要求两个真实使用者，“如果其中一处在录制中无法支撑这个动作，停下汇报，不得用合成场景替代”。现有日历录制不能满足同组条件。继续做需要另行确定通用控件组关联/观察契约，或者改变动作的搜索范围，均超出本轮已定义机制；没有通过重命名组、按Calendar文字合并、选定页面结构或构造新Fixture消除差异。

最初只核对展示标签时误认为日历也同组；在组件接线和原始ref复核中发现并纠正。未提交的两文件原型已经撤回，当前src逐字与基线相同。原型差异只以不可执行的历史patch保留，不进入任何运行或测试路径。

## 测试与证据状态

- `test-setup-import-failure.log`：测试入口导出名错误，**不算红灯证据**。
- `red.log`：原实现拒绝新wire动作（UNSUPPORTED_ACTION），保留原记录。
- `green-initial.log`：原型语法错误，**不算红绿验收**。
- `green-initial-2.log`：未提交原型的人数组件通过、日历组件失败；严格wire样例通过。**整体不是绿灯**，不作功能完成声明。
- `typecheck-initial.log`：未提交原型类型错误，已随原型撤回，不隐瞒为通过。
- 复核脚本通过只证明组差异事实；没有完成A，不给出节省调用/耗时、修后回归或Live成绩。全套产品门禁未运行，不用未改源码的历史全绿替代新动作验收。

## B与保护边界

B尚未启动；没有激活新探查账本，没有提交或执行探查脚本、没有进入网站。不能把旧DOM里看到表单/分类面板写成新Live探查结论。原生表单筛选、菜系路径、叠加能力三个问题均为本轮未探查。

主工作区、四份既有账本及历史录制/评价不改；保护哈希见 before/after及protection-check。当前分支只包含停止诊断与文档。产品相对main32b97ed8增量为空，ead28945的既有产品差异也未改变；未伪报重新跑过累计scanner。无main合入，无完整Live，无额外消耗。
