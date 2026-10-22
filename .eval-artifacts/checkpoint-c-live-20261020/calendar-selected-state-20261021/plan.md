# 通用选中状态与人数确认修复

- Evidence status: draft / not integrated；原69点已暴露开发回归，不是Clean Baseline。
- 基线：codex/fix-calendar-next-month @54ac940；只读独立复核原文，不改上一轮54/69、74调用与S0历史。
- 本切片使用仓库Planning、Test、Eval与Post-change流程；复用未变化的权威文档和验证矩阵。

用户可观察结果：Registry读取控件自身aria-pressed/selected/checked/current及精确active/selected/current/checked、is-同名class。来源可绑定时按DOM组汇总当前选中值；无标记、无组或组内多值不猜测。当前已选控件保留selected状态证据，不能再作为重复人数操作。执行器必须在人数点击后回读同组唯一值等于请求人数，才记为确认；无关页面变化不能替代确认。已有日期/人数/库存/Task State权威和TableCheck reserve禁令不变，URL参数仍仅报告。

先用既有真实Chromium Matsumoto Fixture复现人数→Next→人数循环；补通用ARIA/class与同名组隔离、人数点击只改无关内容的失败后置条件，留有效红灯与绿灯。Browser Prompt18→19、Browser context1→2；wire11及Restaurant Context15/Prompt27、web-skills/thinking不变。

同一69点由生产Registry/Executor从原HTML/CSS重建，不改种子/答案。历史引用中显式旧编号按确定映射修正；不能映射的逐点列明，原历史保留在审计侧，不制造执行历史。新ref只指当前观察。所有69点必须保留原目标、progress/history的语义、独立DOM翻月oracle；不得把已选人数动作算翻月正确。逐点标明原/新观察编号与引用处理。

冻结前只做0模型离线准备和五门禁；冻结提交代码/输入/外层及SHA后，原22校准0模型，再69翻月+5选店各一次，最多74个模型请求含失败，不自动补跑。门槛原样≥68/69、5/5、22/22、五门禁全绿。阶段账本2069/4000，最多2143，Live7/100及环境重跑0/10不增加。仅已有DeepSeek模型API，0网站/Google/Live。

按四层结构报告真实结果、资源、归因及缺口；不到门槛如实判失败，不采用V1/V2或URL路径，不额外付费补跑。完成后只推本修复分支并停止等复核，不推集成分支。
