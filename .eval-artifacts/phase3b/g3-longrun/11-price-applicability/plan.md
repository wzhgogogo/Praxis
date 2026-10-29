# G3 HARD 报价适用条件修复

2026-10-29，Vienna CET（UTC+1）。状态：draft / not integrated；真实调用 0。

用户已批准停止报告 c8ff6bf7 的规则：没有附加限制的报价保持原比较；有条件的报价从引用原文解析，与既有 Intent 的日期、人数、餐别核对。已知不适用不参与比较，无法核对的报价不能单独证明预算；没有适用报价为 NOT_CHECKED，不因一条不适用套餐推出 NOT_MET。报价原文、原始金额、库存和套餐库存的边界保持。

纵向切片：实际 Tabelog Adapter/fixture 模型产生完整报价 → 生产条件判断核对请求 → 结果预算状态。复用默认测试中的实际条件输入，冻结旧结果；修复后逐条列出旧 HARD 状态变化及其原文与原因。原 c8ff6bf7 为有效主红灯；补充人数、星期、日期、餐别和不可核实条件的正反例。日期/人数沿 RestaurantSearchIntent 传递，State/TaskDefinition 不变。

完成本组后五门禁全绿、每项前后净树并推工作分支；然后同步已批准 main50a08361（A Sen UNKNOWN 与 G2 调度），严格 G2 全部 Tabelog PASS，继续 G3c。全批不合 main。保留 C 的身份、详情排序、片段代码/断言；tabelog-vacancy-response.ts 输出不变。只在既定停止条件触发时停。

Evaluator：沿已有 HARD 条件函数实际输入/输出记录比较；独立期望来自用户规则与字面条件。对录入的每一个旧调用重算全部条件状态，变化行附完整旧/新状态、报价及核对原因。该比较不是问答评分，不读取 QA answers，也不证明 Live。
