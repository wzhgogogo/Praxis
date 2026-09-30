# H001 原生接线独立审查

- Status: Draft / changes requested
- Document revision: 0.1
- Last updated: 2026-09-29
- Source of truth for: 本轮独立审查发现；不是 H001 通过结论

主 chat 独立运行 `node --import tsx --test src/eval/restaurant/agent-loop/native-discovery-composition.test.ts`，4/4 通过。确认交付场景确有正式组合和展示；这些固定动作覆盖不证明任意合法模型顺序下的切源控制。

## 必须修正

1. 原生发现详情循环缺少候选局部失败隔离。以现有 TABELOG_DELIVERS 固定页面为正常对照，只让第二个详情 `/101/` 导航抛错：第一候选已读，但整个 batch 抛错，search 返回零候选，第三个详情不再读取。`native-restaurant-search.ts` 的详情循环与外层 catch 使局部失败丢掉整个批次。应保留已获得结果并按既有会话安全规则继续其他候选，取消／预算／系统终止仍停止，不加重试体系。
2. 执行层缺少切源前置限制。发现完 Tabelog 即设置 TABELOG_DONE；validator 对 SEARCH 仅检查 exhausted 等现有条件。定向把首批候选、continuation 和尚未查事实／库存的状态送入 validator，第二次 SEARCH 得到 ALLOWED，下一次 search 随即进入 TableCheck。现有组合脚本模型主动先查事实，掩盖这个缺口。需证明本批处理及现有交付门槛在执行层约束切源，而非依赖模型恰好选对顺序。

反例摘要保存在 `/private/tmp/praxis-h001-native-review-counterexamples.json`。上述第二项为 validator 定向诊断，不冒充完整组合红绿；已要求实施者在所属组合覆盖补强。

## 继续核对

- 当前适配器 diff 主要为 native 分支，尚未见清晰提取的 matcher 后共用入口；尤其核对原生身份失败是否仍回全站搜索。
- 跨来源候选 ID 带 provider 前缀，需证明疑似同店不会当两个确认不同餐厅凑数量，复用既有可靠判断，不建实体合并系统。

已发送同一 Sol chat 修复并复审。真实模型固定来源和唯一 H001 Live 均未放行；Playbook 未完成，不以四场景或全量套件通过替代上述缺口。

## 第二次复审

独立运行组合与两站适配器测试，75/75通过。已确认详情局部失败保留其他候选、SEARCH切源门槛、原生错ID不全站搜索及共用后段提取已实现。跨源疑似同店计数已加约束，未建立实体合并系统。

尚未放行真实模型，新增具体阻断：第一站空批后 END_READ 仍被允许。将空批产物恢复为非终态、TABELOG_DONE且exhausted=false，validator 返回 ALLOWED；当前 canEndRead 未阻止遗漏第二来源。已要求在原组合覆盖中验证过早END_READ被拒，而取消／预算停止继续保留。

原生详情读取直接使用session.navigate，错误后继续同一session，未接BrowserTaskExecutor已有导航失败隔离；普通抛错Fixture不能证明迟到导航不会影响下一店。已要求复用既有生命周期机制，记录候选失败原因并对失败会话隔离，不增加同店重试或恢复框架。

## 第三次复审：进入固定来源真实模型

检查修正版确认：首批之后未读第二来源时 canEndRead=false；详情导航失败使旧session退出，下一候选开新session，正常详情仍复用，candidateFailures保留归因。独立复跑组合与action-validator共34/34通过。review2-final六份评价为三个展示YES、三个控制NO。基线hash对比semantic与cases路径无变化。该离线会话测试仍是模拟页面，不声明真实来源导航已验证。

未发现此前原生固定来源真实模型产物。已放行TABELOG_DELIVERS、TABLECHECK_RECOVERS两个固定来源真实模型场景按顺序各一次，每轮300000ms、50总模型调用、30Agent步，不扩预算或自动重跑。第一轮出现确定性缺陷先定位，不盲目消费第二轮。只调用真实模型，来源仍OFFLINE_FIXED_TRANSPORT/OFFLINE_FIXED_PAGES；结束后独立核对实际展示、来源顺序与资源。真实网站H001 Live仍未放行，Playbook尚未完成。

## 固定来源真实模型与阶段3放行

初次沙箱运行ENOTFOUND未取得模型响应，单独保留；允许联网环境的两个后续产物已核对：a5791cc6场景PRESENT_RESULTS三家Tabelog、9次调用／11800ms，TableCheck导航零；07e46c54场景先Tabelog后TableCheck，展示三家TableCheck原生候选、14次调用／17076ms。两轮Google固定响应均仅解析Shibuya，未餐厅发现；Evaluator均YES。仍不证明真实网站库存或速度。

主chat已放行正式hybrid-live-read入口的唯一一次H001 --native-discovery只读Live：正常日期物化，原条件，300000ms／50总模型调用／原30Agent步／60000ms候选／30000ms来源上限。默认浏览器网络，不显式10808，不跑H003或外部写。启动前查重，运行后交独立验收；确定性失败不得自动重跑或改输入。Playbook尚未完成。
