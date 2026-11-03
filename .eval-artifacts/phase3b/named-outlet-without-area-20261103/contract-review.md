# 具名店无地区：合同冲突停止点

2026-11-03 CET。状态：实现候选，未通过全部门禁、未推送、未合 main；等待窄授权。真实模型/Google/来源/Live 新增调用均为 0，未读取或加载 `.env`。

用户已确认 State@24→25、TaskDefinition@22→23；语义 Prompt26、Proposal4、Draft3、Agent Prompt/Action Schema 不变。

## 已完成的实际链路

原 D3 #1 outputText 逐字节保留，经 createLiveReadAssembly 默认组装、真实 Compiler/Reducer/Router 和持久应用取得有效红灯 ead356c0：权威 SPECIFIC_OUTLET、无 AREA、search=false、ASK_USER、来源访问0。正例使用明确标为构造的来源/模型 I/O，不是原 D3 网络回放或新的真实空位证明。

9e07e889 首轮达到 PRESENT_RESULTS，但两个来源交接读者还要求地区，交接为空；保留原件后修复。897cafdb 同六项绿，f16d7c50 加入 Tokyo 范围、歧义模型实际提议 SELECT_CANDIDATE 被拒、访问条件仍必需等控制后八项绿。

ea1289c3 完整默认回归1363/1363通过。不过继续检查“用户后补地区”发现真实反例：地区路径会接受名字不符的候选。0db94123 冻结同一世界输入后，UNRELATED→用户补 Akabane 的完整流程错误到达 PRESENT_RESULTS；红灯保存在 area-red。9a0c07ea 修复后，地区和原店名必须同时成立，不能以补地区为由更换门店。

当前 9a0c07ea 的完整默认回归为 **1361/1363**。新八项控制全部通过，包括后补地区的不替店反例；两项失败都是旧选店负控制对 B1 交接的预期，与本次唯一性要求冲突。没有放宽新规则去满足旧断言，也没有改动原断言。

## 必须由用户/复核者决定的冲突

原承诺是保留所有现有断言。实际旧 `restaurant-user-booking-selection.test.ts` 的 `AMBIGUOUS` 和 `PARTIAL` 控制都要求“用户无法唯一选店时，仍必须有 independent qualified handoff”。新指令要求具名店不能唯一确定时询问、不能自选，不应成为 ready/presented 交接。这两个预期不能同时用于本次具名查找。

失败位置：旧测试第75–76行的交接存在性和 terms 取值。其它选择、USER因果、无 BOOKING_PROPOSED、无条款额外调用等不变量仍成立。

建议只把这两个控制的交接预期改为 `[]`；OPEN_ENDED、NON_BOOKING 的既有独立交接及所有其它断言、输入、真实模型回放字节均保留。精确候选补丁为 `c-selection-expectation-proposal.patch`，**尚未应用**。这是验收合同同步，不能当成普通类型修复擅自修改。

另一个已提出且仍等待确认的窄授权是 A 五个文件的版本/可选地区机械同步，补丁为 `a-owned-sync-proposal.patch`。当前 A 的 src/eval、src/harness 和 B 三个 G3 文件与 main 原字节一致。

## 产品实现范围

- 有非空店名的 SPECIFIC_OUTLET 才能省略 area；没有日期、时段、人数仍不能查位，OPEN_ENDED 仍要地区。
- 默认生产组装把具名查询交给现有 Google 客户端，按原完整店名加服务范围 Tokyo 检索。Tokyo 是服务范围，不写成用户 AREA；不请求地区圆心、不按半径裁切。实际来源地址要明确在 Tokyo，缺证/非 Tokyo 不进入结果。
- 无地区时只有完整名称经既有 NFKC/大小写/空白规范化后唯一相同才接纳。近似匹配仅用来保留澄清选项，绝不接纳；缩写、跨语言名、不同分店不猜。同名多店、近似分店或未确认唯一性（包含超过有界页数的结果）询问后才能查位/选择/展示。
- `NAMED_OUTLET_RESOLUTION` 存在既有 DISCOVERY 证据中，明确绑定原请求名和来源地址，不加持久 State 顶层字段，不回填 intentDraft.area。无用户圆心不显示距离；matchReasons 标明地址来自店名解析。
- 用户后补 AREA 后，既有 reset 清除前轮证据；使用用户地区约束，同时核对原店名。G4原名/合法片段/同Place ID日文名、来源电话/地址身份规则均未改。
- B1投影、两来源准备缓存与条款上下文复用 completeRestaurantIntent；保留已展示/就绪集合、两次服务端校验、同渠道逐字引用、20秒保留和预算。无查位证据没有按钮，不产生预约提交。

## 验证状态与证据

- `red/`：有效初始六项红绿对照输入，1绿5红。
- `green-before-reader-context-fix/`：首轮实现5/6，揭示来源读者仍阻挡 B1。
- `green-six-controls/`：同六项6/6。
- `green/`：补充后八项8/8。
- `runtime-preflight/`：1363/1363，尚不包含后补地区目标名反例的最终修复，不当作当前候选全绿。
- `area-red/`：原新八项中7绿1红，证明后补地区不能丢失店名约束。
- `runtime-contract-check/`：当前完整运行回归1361/1363，仅旧AMBIGUOUS/PARTIAL交接断言两红；本次八项控制仍全绿。
- `typecheck-preflight/`：首次净树编译红灯，包含 A 待授权机械同步及当时 C 类型问题。C 类型修复已提交，但没有忽略 A 错误来宣称 typecheck 通过。
- `evaluate.py`：只对当前九个观察帧独立核对原始语义字节、固定Google请求/响应、页面身份/slot原文、拒绝歧义动作和后补地区不替店；不导入生产判定函数。它不代表全套测试已绿。

所有运行前提交/记录SHA，每次运行前后工作区为空。原件不覆盖、无真实调用、无重试或延长时限。尚未声称五门禁或严格G2完成，未推送分支。按“验收口径需要变化时先报告”和本次“原断言保持”要求停在此处；收到两项窄授权后完成同步、重跑最终五门禁/严格G2、推工作分支交复核，不合 main。

独立核验已物化为 evaluation.json：PASS，9个观察帧；只证明本次构造来源/D3原语义的链路与安全控制，不覆盖两条旧合同冲突，也不把1361/1363改写成全绿。

后续批准（本停止点原记录保留）：用户已批准A五文件机械同步，以及仅修改AMBIGUOUS/PARTIAL交接预期。分别提交3d632a49和28c45602；精确补丁原样应用。当前授权记录见authorizations.json，最终门禁另存gates.json，本报告原1361/1363不被覆盖或冒充最终绿灯。
