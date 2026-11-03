# D6 具名店跨回合连续性

Status: draft / not integrated；真实调用0，不读.env；main第一项已发布533f1bc5，新分支只推复核。

用户裁定D6历史S0=1（按一次展示，不按5家），不改A自动报告。当前main为ca18d02b产品源码，必须实测其是否仍能复现旧native五店路径，不强造旧代码行为。

三回合用D6原语义输出与原Agent输出字节，来源I/O固定，createLiveReadAssembly→持久应用→Router/Reducer→投影。若新main已阻止原native路径，区分历史S0与当前红灯；补测带area/no-record失守及同PlaceID显示名变化的跨回合身份丢失，不以组件绿代替组装。

实现候选：SPECIFIC_OUTLET全部走named检索，AREA只核对；从既有Runtime SEARCH_COMPLETED与USER选择事件恢复用户当时的public source IDs，跨party-only消息保留，重新绑定靠身份而非旧candidateId。不加持久State字段，State25/TaskDefinition23预计不变；若最终需改版本先报告。OPEN及新目标撤销旧引用。未找到/无位明确点名不能交付、不得替其他店；用户同意OPEN后才可展示其他店。

先有效红灯，再绿；保留八控制和原名称测试，不改A评测/B三G3文件。冻结并独立核验原件与错误交付，五门禁+严格G2全绿，净树推新分支供复核，不合main。
