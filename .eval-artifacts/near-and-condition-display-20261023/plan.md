# Named-place resolution and condition display

Status: draft implementation / exposed frozen regression; no new Live. Base: origin/codex/feat-live-restaurant-read-path @8487a844. Original11 saved results and reviewed evaluations from codex/holdout-phase2c-exit @1a2e7c12; unchanged source bytes stay in that private branch.

切片一：非空具名地点（不是 nearby）必须进入现有有界地名解析，不依赖 near 是否出现在原文字里。不新增地点或关系词表，既有纯 nearby/坐标/预算/地理类型/歧义约束保留。先保存“X/near X”与原h-06输入的失败，再证明 Native→Google 解析/下游source pack入口获得观测圆心。该回放不证明新的实时发现或库存。

切片二：四条菜系支持属于h-02三家、h-08一家。当前同店引文与模型的条件对应仍在，但显示层把 Korean food 与字段Korean做字面比较，现有通用restaurant/cuisine描述词处理未包含food。沿用同一通用类型描述处理，不加入菜系别名/地点/站点/评测坐标，不改变判定来源、当前性、同店同来源、字段角色、否定、餐段规则。先红灯，修复后从原事件走Router→Reducer，4条变MET且与固定@33相符，其他9份已评产物展示逐字段不变，h-02/h-08其余行不变。独立评分不修改，原评价不覆盖。

两项生产修复分别提交。必要验证为各自红绿与反例、全部11份成对展示回放、五门禁、相同69点翻月/5选店缓存真实模型响应回放、22独立校准（先自动输出再读标签）。输入/脚本/代码运行前提交并记录SHA；本轮不改Prompt/模型参数，不新增付费调用；所有缓存响应/脚本化调用与新模型调用分开记账。没有通过则如实报告，不放宽门槛。

未做：TableCheck Guard修复、h12额外UNSPECIFIED评分器行为、语义Prompt、重新认证、Live或主线合并。完成推私有修复分支后停下等复核。适用架构边界：现有受控Google Adapter、Domain条件展示与Router→Reducer，权限与State权威不变；Adapter行为说明同步Capability Matrix，已接受ADR不变。
