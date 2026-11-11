# 2026-11-09 补评续跑与 G1 一次观察

Status: verified main integration candidate；源码冻结 `c0b5e4f4`。按本轮授权快进合入/推送后停止，发布 SHA 与 ls-remote 回执见交付消息。无私有留出原文进入仓库、提示词或日志。

- **补评续跑已接通。** `--resume <目录> --review <尝试key> <仓库外注释文件>` 绑定注释 SHA 与原证据树；原 evaluation.json 不变，另存 evaluation.supplement.json。重新从原 DOM/JSON 提取资格注释。只有 EVALUATED、S0=0、stopBatch=false 才记 EVALUATED_BY_REVIEW、跳过该槽位；NOT_EVALUATED/S0/文件变化仍停批。
- **无评价的已计费异常。** 新运行器即使失败也保存完整部分声明和外层方法/正文/预检观察。补评先按原独立 sidecar 方法重算边界，零违规且无缺证才评分；G6 evaluation@5 把已核实产品异常计为 PLANNED_RUN_FAILED/qualified=false，一次失败计划运行，无重跑/环境票。缺完整原始证据的旧异常继续停批。
- **虚构清单红绿。** 旧实现 STOPPED 无法通过复核继续；新实现补评后从下一槽位继续，原评价逐字不变。补评 S0、边界违规/缺证、SHA 变化均拒绝；实际 G6 异常保存路径也验证了部分交付/价格/偏好声明不被抹掉。格式和命令见 runner-guide.md。
- **页面问答。** 保留初次采集的原语言链接路线，只对不完整快照重新观察一次；当前取得的确切店页零导航，否则只打开绑定 URL 并重核实体，随后沿用原 G1。D4 snapshot24 的真实 DOM 组件引用 `Private rooms / Unavailable`；D8 snapshot41 条款组件完整时 NOT_STATED。新完整性/会话/时钟/模型回答均 LOCAL_CONSTRUCTION；仍 PENDING 时零回答、不循环。原 Live INCOMPLETE_PAGE/NO_PAGES 和原录制未改，不宣称真实条款问答已成功。
- **门禁。** c0b5e4f4 同 SHA 净树全绿：typecheck、arch、默认1539、build、Chromium260 + G6 83、strict G2 全12。写死扫描新增0。首轮6bef873b默认门禁拦出语言/预留时间接线回归，原日志完整保留；修复后原安全断言通过，忙碌页诊断从 NO_PAGES 改为已捕获但 INCOMPLETE_PAGE 的明确拒答。
- **额度与停止。** 本轮真实模型0、GET0、Live0。上限不变：模型2500（已用849）、held-out Live22/GET126/环境重跑4。等复核确认后，用户提供私有原文件、复核者清单与激活账本；本轮不启动 held-out。

证据：[门禁](gates.json)、[新旧红绿](red-green.json)、[续跑演练](resume-controls.log)、[真实组件](recorded-components.log)、[首轮失败](first-freeze-6bef873b/gates.json)、[扫描与范围](source-audit.json)。
