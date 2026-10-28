# G1 小修交付（停止待复核）

2026-10-28，Vienna CET（UTC+1）。Evidence status: current offline regression / exposed saved-source inputs；不是真实模型复评或 Live。

从已包含 C b250bb17 的最新 main **fae69b48e541bef258b0c463d8d131ea46012b49** 开分支 **codex/fix-phase3b-g1-answer-quality**。五项完成，只推工作分支，不合 main。正式受测提交 **cb2267017ed639582b3e5d6e52508717afab44fb**。

用户转达的原版独立人工复核：34题×3次，错误声明0、84次正确、18次质量失败、未说明判断23/24。这是原版质量证据，本批不自评或重算；Prompt/Schema3 的真实模型质量仍待 A 复跑 Q07/Q14/Q26/Q27/Q31/Q33。

## 改动与边界

- 独立 restaurant_page_question Prompt/Schema **2→3**。英文问题用英文短答，引用保留原语言；字母中拉丁字母占比>60%的提问，如果答案字母中汉字/平假名/片假名占比>60%，整份答案拒绝为 INVALID_MODEL_OUTPUT。这是粗粒度字符检查，不是语言识别器，不宣称排除全部语言错误。
- G1 完整源行通过覆盖检查、绑定评论角色之后，按。．！？.!?进一步分句。保留标点和闭引号，ASCII小数/URL内部标点不拆；子句继承原行 USER_REVIEW。仍只能引用完整句子/完整表格行，不能任取子串；分句后超过1200单位仍 INCOMPLETE_PAGE。HARD 分段函数及上限未改。
- 提示明确：商家未说明、只有评论提到时 NOT_STATED，不引用评论；原有代码拒评论规则不放宽。未被公开标题识别的评论仍是 ADR 已登记风险。
- 模型输出必填布尔 **sourceConflict**。代码令 confirmationRequired = 敏感类别非NONE **或** sourceConflict；提示要求引用矛盾双方、不替用户下结论。标志在模型 Schema 内，现有持久结果只保存原有 confirmationRequired，因此 State 无新字段。现有 Web 对该布尔值显示英文 “Please confirm with the restaurant”，无需改入口/展示代码。A 可在其模型传输输出中检查 sourceConflict；评分器/题目/参考答案/评分口径未改。
- 提示明确：素食、纯素、无麸质偏好为 NONE，除非问题涉及过敏；代码不建关键词敏感分类器。

ADR-0046 Accepted 同步至 revision0.4，记录本次用户授权的合同修订。Agent Prompt29、Action5、Context17、State24、TaskDefinition22均未变。产品 Domain/Application、共享 Browser、Guard、语义/身份及两站/Pack 文件与基线相同。

## 红灯与绿灯

红灯提交 **d35ace2afa110fe07a2acb6c888bc109f39d6210**：5类目标机制全部失败（语言2子项，共7失败），均为目标断言，不是环境/类型错误。见 [red.json](red.json) 与 [red.log](red.log)。最终 focused **8/8** 绿，见 [focused-green](focused-green/focused.json)。

| 机制 | 旧实现红灯 | 修后证据与限制 |
|---|---|---|
| Q07/Q33语言 | 日文短答被当作 ANSWERED | 日文答英文题→UNVERIFIED/INVALID_MODEL_OUTPUT；英文短答+日文引文及日文题日文答正常 |
| Q31引用 | 原186字介绍中完整43字句子→UNVERIFIED | 完整句子 ANSWERED，任意子串仍拒绝；标点/闭引号/小数/URL和拆分评论的继承控制绿 |
| Q27评论 | 提示缺少“仅评论提到则NOT_STATED”明确接线 | 请求中指令存在，fixture的NOT_STATED接纳，评论引用仍拒；真实模型遵循率未评 |
| Q26矛盾 | sourceConflict控制下 confirmationRequired=false | 两方逐字引文保留、category NONE且确认true；语义矛盾识别由模型标注，独立质量待A |
| Q14偏好 | 提示缺少偏好与过敏的区分 | 指令到达模型，fixture NONE/NOT_STATED正常；不把固定响应变成真实分类成功率 |

默认回归复用已有 G1 测试，独立最小原文 fixture 带 URL/采集日期/原页SHA及提取方法：[来源索引](../../../src/integrations/restaurant-facts/fixtures/g1-answer-quality/README.md)。没有复制历史整次运行或读取答案。

真实本地 Chromium 读取六题的完整保存页，用 fixture 模型执行 **8项**（Q07/Q33各正反两项，另四题各一项），全部达到预期。页面请求全部 route.abort，37条被拦截、来源传输0。原页/存储SHA均核对。见 [saved-pages.json](saved-pages.json)。人工身份envelope只用于核对链路，不证明新身份或当前菜单。最初整页脚本把价格当独立DOM行，实际与税费文本同一单位，改为引用浏览器提供的完整单位后通过；未改源页或产品核对。

既有测试同步逐项：

1. model-page-question.test.ts fixture 增加新必填字段，版本断言升3，并新增缺字段/非布尔反例。
2. 无障碍多句示例改为两条完整引用，保留台阶与“无电梯”两方原文、敏感限制及拒yes/no断言；接待模式多句也逐句核对，并逐条核对URL/时间。
3. 已保存 Aloft 片段改为引用完整第一课程语句，保留原页SHA/日期及逐字核对，不再把四张菜单卡当一个语句。
4. local-web-server.test.ts 唯一问答 fixture 同步 sourceConflict:false；服务端绑定/预算/取消等断言不减少。
5. A 的 fixture 同步仅为下一节明确授权的单文件 diff；A 的其他测试未编辑。

相关两个 G1 单元文件 **52/52** 绿，见 [related-green.log](related-green.log)；这些回归已在默认门禁内。

## HARD 逐字节一致

改前记录与改后比较：**44,197字节**，SHA-256 **9a3298bc5e004b99e41d80713e8913b68c336cfa594f6eb60599e310ee3fb633**。包括3份源文档、原有语句选择、模型请求和固定时钟的完整 Native 事实结果。见 [hard-compatibility.json](hard-compatibility.json)；check-fact-compatibility.ts 沿用既有冻结脚本，未修改。共享事实分段/选择实现原字节不变。

## 五门禁与冻结

macOS26.6.2 arm64 / Node24.4.1；Chromium并发4。首轮typecheck发现两处fixture TypeScript标注问题，修正一次后完整重跑；[首轮记录](verification-first-typecheck-failure/gates.json)保留，不冒充绿灯。

| 检查 | 最终结果 | 数量/耗时 |
|---|---|---|
| typecheck | PASS | 0.449秒 |
| arch-check | PASS | 0.187秒 |
| npm-test | PASS | 1196/1196；28.792秒 |
| build | PASS | 0.564秒 |
| browser-fixture | PASS | 175/175；114.6秒 |
| dom-change | PASS | 4/4；21.908秒 |

额外 G2 是普通基线检查，不是 G3 的 REQUIRE_PASS 验收。每项前后 git status --porcelain 为空，restorations=0，无skip/cancel/fail。682份输入及外层脚本先提交冻结，运行后重新核对，见 [冻结清单](input-freeze/freeze.json)、[门禁完整收据](verification/gates.json)和[独立核验摘要](verification.json)。

最终冻结清单SHA-256: e2bf00cdaa0471aae21c2c063705b0f4781edc1676bf6bbabefcec1f908555d6。外层run-gates.py SHA-256: e25a542f9494362bef0d6d7b4138c8a4598706215e96cf2c6a2c2b0efe895400。受测提交后只补文档与证据；可执行树不变。

实际最新main基线已因C改动为两站非测试TS **3,878行**、source-packs.ts单列 **478行**。本批两项都不增加；并非继续沿用早期3,847/473数字。见 [逐文件物理行计数](adapter-lines.json)。G3仍须向≤3,591削减，不能靠迁移站点代码充数。

## 经用户授权，跨归属同步 A 的 fixture

只修改 src/eval/restaurant/fact-qa/core-adapter.ts 的适配器版本和fixture返回字段；完整diff如下，与 [独立diff文件](authorized-a-fixture.diff)相同。其他A文件、评分器/题目/答案/评分口径未改。

```diff
diff --git a/src/eval/restaurant/fact-qa/core-adapter.ts b/src/eval/restaurant/fact-qa/core-adapter.ts
index 36432239..21e88a4d 100644
--- a/src/eval/restaurant/fact-qa/core-adapter.ts
+++ b/src/eval/restaurant/fact-qa/core-adapter.ts
@@ -6,7 +6,7 @@ import type { QaRead, QaResponse } from "./scorer.js";
 
 // All pinned-core assumptions, including fixture wire format, are confined here.
 export const G1_CORE_REF = "e4829a582c7af2ff7eb8dc98d512f5bc5459d05d";
-export const G1_CORE_ADAPTER = "g1-core-adapter@3-confirmation-output";
+export const G1_CORE_ADAPTER = "g1-core-adapter@4-schema3-source-conflict";
 export type SensitiveCategory = "ALLERGY" | "RELIGIOUS_DIET" | "ACCESSIBILITY" | "NONE";
 export interface QuestionOutcome {
   status: "ANSWERED" | "NOT_STATED" | "UNVERIFIED"; candidateId: string; answer: string;
@@ -55,6 +55,6 @@ export function fixtureQuestionModel(selections: readonly { quote?: string; ques
     const selection = selections.find(row => !row.question || row.question === body.question);
     const found = selection?.quote && body.sourceDocuments.flatMap(document => document.statements.map(statement => ({ document, statement }))).find(row => row.statement.text.includes(selection.quote!));
     return { invocationId: "g1-fixture", provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS", latencyMs: 0,
-      outputText: JSON.stringify(found ? { status: "ANSWERED", answer: selection?.answer ?? found.statement.text, sensitiveCategory: selection?.sensitiveCategory ?? "NONE", citations: [{ documentId: found.document.id, statementId: found.statement.id, quote: found.statement.text }] } : { status: "NOT_STATED", answer: null, sensitiveCategory: selection?.sensitiveCategory ?? "NONE", citations: [] }) };
+      outputText: JSON.stringify(found ? { status: "ANSWERED", answer: selection?.answer ?? found.statement.text, sensitiveCategory: selection?.sensitiveCategory ?? "NONE", sourceConflict: false, citations: [{ documentId: found.document.id, statementId: found.statement.id, quote: found.statement.text }] } : { status: "NOT_STATED", answer: null, sensitiveCategory: selection?.sensitiveCategory ?? "NONE", sourceConflict: false, citations: [] }) };
   } };
 }
```

## 调用、交付与下一停止点

本批新增真实模型、Google、餐厅网站、Live、环境重跑、评测公开GET全为 **0**。未读取/复制/暂存.env，未读取或哈希answers*.json。共享账本原317条按id逐条保留，追加1条零调用记录，共318唯一id；不覆盖他人计数。

STATUS、DEVLOG、TEST-LOG、月度摘要/索引、ADR及相关产品合同已同步。本批按用户第1节的明确停止点，推送工作分支后**停下复核**，不合main。复核通过并合入后，从最新main另开G3 Tabelog分支，不必等A的6题重跑；TableCheck阳性日历仍等待首次Live。G3本批尚未开始，不宣称达到行数或严格DOM变异PASS。

实际推送回执附在 delivery.json；未得到远端成功核对前不宣称已推送。
