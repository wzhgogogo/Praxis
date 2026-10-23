# near 与条件展示修复：离线验收

- Evidence status: current executable repair / exposed frozen regressions / pending independent review。仅私有修复分支，未合并主线。

启动时fetch到主线最新基线 `8487a844e2f6041f92d8ce575d3d2e1c4a7627ba`；在独立工作区创建 `codex/fix-near-and-condition-display`。两项生产修复各自独立提交：

- near：`4472410642f76b7bc5075a5ce1e14c7958ad6bf6`，唯一生产文件 google-places-restaurant-search.ts。
- 展示：`53ac158cd197d117473d9c9d8c0a1203cb435bc0`，唯一生产文件 condition-states.ts。

正式回放前提交冻结274569c9；回放冻结SHA `0cea339a8ff09488ec2ee0aabf438303b37cb41106b08beac4d144d0306c4d67`，4271项；校准冻结SHA `abe3a2f370bf978bbd28ccf589c1d014d83e20e600dc3b66d79a5c193e55b235`。源11份产物与评价来自留出分支 `1a2e7c12e15e8f8475e8bff00faffcbe926906fa`，每份原始字节SHA/事件投影/来源评价SHA在inputs/manifest.json，独立Git原始对象复核全部一致。

## 第一层：用户可见结果与证明范围

near修复使具名AREA不再依赖原文中出现near/nearby；未加地名或关系词表。保存的h-06原语义AREA=Kitasenju不插词，修复前重现NATIVE_LOCATION_UNRESOLVED，修复后经现有Native→Google解析获得已保存的Kitasenju Station观测圆心，继续进入下游Google pack发现。只替换外部HTTP：第一次回放既有认证的原始Google地域响应，第二次为明确空发现Fixture；这证明圆心交接和请求预算，不声称恢复了h-06整单交付或当前库存。near X与X同样解析；纯nearby、设备坐标、地域类型、歧义、距离与预算保持现有规则。

展示修复把已观察支持传到四条条件行：h-02三家、h-08一家NOT_CHECKED→MET；逐项保留商家真实字段与来源。产品中原有MODEL_JUDGMENT已对应到完整Korean food条件并引用当前来源，Router整体引用集合也完整；断点是显示核对的字面键保留food，而商家字段写Korean。沿用现有restaurant/cuisine通用描述词处理补入food，余下所有菜系限定仍需字面支持，不增菜系别名表、不按模型标签直接判满足、不从评论或店名补证。

| 保存运行 | 门店ID | 原展示 | 回放展示 | 原独立@33真值 |
|---|---|---|---|---|
| h-02 | 13093277 | NOT_CHECKED | MET | MET |
| h-02 | 13018986 | NOT_CHECKED | MET | MET |
| h-02 | 13271031 | NOT_CHECKED | MET | MET |
| h-08 | 13271031 | NOT_CHECKED | MET | MET |

4条对应来自2份完整运行产物；不能写成4次新Live。其余9份已评价产物（含原本无展示的4份）展示逐字段不变；h-02/h-08的其他价格行、交付门店/时刻/全局引用不变。所有11份都从原事件进入现有Reducer，实际呈现动作经过当前Router→Reducer；无来源读取请求或新模型调用。历史Live结果/评价均不覆盖，不据回放新增QUALIFIED_DELIVERY或改写第二阶段退出决定。

## 第二层：逐环节与四条展示核对

near入口：非空具名AREA进入原有有界Google读取，near X/X单元和h-06保存输入红灯各1条，修复后相关27/27。部分分页/预算旧HTTP Fixture暗依赖跳过具名解析，现明确提供观测圆心，实际分页、稳定ID、计数和独立run隔离断言保留；不保留生产绕过。其余地理误接纳反例（非地理类型、异地/歧义、不在圆形半径等）仍过。

展示入口：保留当前身份绑定、同店同来源字段、字段角色、否定与餐段检查；原价与原文不改。泛称food仅作为已存在类型描述标准化的一部分，不降低任何菜系限定要求。NAME/CUSTOMER_REVIEW即使有模型标签也不支持MET，northern regional food不能由Regional类别单独满足，否定类别不误报支持。

使用原冻结@33独立条件真值逐行对照当前回放展示：33条中原29 CONSISTENT +4 MISSED_KNOWN_CONDITION，回放为33 CONSISTENT；S1_UNSUPPORTED无新增。该对照复用原独立HTML真值，不宣称重新评价/改分旧Live；h-12额外UNSPECIFIED评分限制、无见证例和未完成运行均维持原记录。源事件、来源与原独立评价SHA全部核对。逐条前后真实引文和证据ID在display-replay.json。

## 第三层：门禁、安全与资源

| 检查 | 结果 |
|---|---|
| typecheck | PASS |
| arch:check | PASS |
| npm test | 1025/1025 PASS |
| build | PASS |
| 本机Chromium Fixture | 137/137 PASS |
| 同69点翻月 | 69/69 PASS，当前生产解析器读既有真实模型响应 |
| 同5个选店种子 | 5/5 PASS，既有响应严格解码与既有独立选店oracle |
| 独立校准 | 22/22结果、20/20正常声明；2次历史中断声明保持未评价 |

默认测试首次在受限沙箱因本机127.0.0.1监听/Chromium启动失败（998通过/27失败）；允许本地Fixture的离线环境重跑1025全过。相关Google测试最初另有9条旧Fixture前提失败，保留在green/near-tests.log，不把它们计作9个独立生产缺陷或有效目标红灯。有效near/display目标红灯在red/；最终绿灯与全部门禁原始日志分别保存。

Chromium测试生成的已跟踪region-composition-results.json被单独保存，并恢复到HEAD原字节，SHA核对见gates/side-effect-verification.json；不得让测试输出覆盖历史冻结证据。日志原始空白保留，git diff --check仅排除原始.log，所有作者代码/文档/JSON通过。

新增真实模型Provider调用 **0**、Google **0**、餐厅网站 **0**、完整Live **0**、环境重跑 **0**。69次缓存Browser响应传给当前生产解码器，另5次缓存Agent响应严格解码；都不是新模型请求。校准22次为独立离线评分，先保存自动输出再读标签。正式回放预加载网络拒绝器且无network-denied记录；门禁仅本地Fixture/HAR，不加载.env。

五门禁不代替Live安全证明；本轮无真实外部操作，不能给未知/缺失的历史S0维度补ABSENT。原先未评价项仍保留。Tabelog/TableCheck Guard、只读边界、/reserve禁令、模型权限和生产Secret边界未改。

## 第四层：归因、版本和交付边界

near因果证据：同一保存输入在旧namedNearbyQuery上跳过解析，未到外部Google即抛缺圆心；仅移除near词门槛后进入原地域解析与source pack，地域真实性仍取来源观测。当前改动不解决无地理类型、空Google结果、来源限流等独立失败。

展示因果证据：来源/模型对应/全局引用已存在；旧literal key=Korean food与现有Korean类别不相等，当前通用类型描述处理后保留原Korean商家字段并达到MET。四条均修复且其他展示数据未变；未引入任何站点、地名、菜系或评测坐标生产常量。

生产只改Google Adapter和Domain展示核对，State/Schema、Browser/Agent/Semantic Prompt及Evaluator@33/rubric@29字节不变，因此不虚增版本。Capability Matrix补充定位行为与离线边界，Domain文档说明展示规则。h-12评分器行为、TableCheck no-hits Guard修复及任何Live均不在本分支。

本分支从启动时已fetch的8487a844出发；运行期间主线在其他任务前进，未擅自合并那些后续提交，也没有向主线推送。最终向用户授权的私有修复分支推送，精确远端SHA核对后停下等复核。

四层结论：这次只接受两项离线修复及既有回归稳定；不把已暴露样本当Clean Holdout，不宣称新端到端Live成功、泛化率或实时来源兼容性。
