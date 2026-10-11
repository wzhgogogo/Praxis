# 检索词固定请求回放

exposed development replay / pending independent label；实验分支 codex/exp-retrieval-terms，冻结 a51a59c。16 条已保存请求各调用一次；只补实验分支既有 Schema 12 的传输 JSON Schema，消息未重新生成。模型 16、Google 0，不评分、不增加调用。

|来源|序号|原动作（目标）|新动作（目标）|搜索词 / 模型引用说明（未校验为页面原文）|
|---|---:|---|---|---|
|kf-h001 P1-E|24|CLICK (observation:7:target:13)|REPORT_NO_RESULTS ()|Search for "Tokyo Sushi Teppen(Shibuya)" returns 0 results; no restaurant result link is available to open.|
|kf-h001 P1-E|25|CLICK (observation:8:target:13)|REPORT_NO_RESULTS ()|Search for "Sushi Teppen(Shibuya)" returns 0 results; no public restaurant result link is available.|
|kf-h001 P1-E|26|CLICK (observation:11:target:16)|REFINE_RETRIEVAL（解码拒绝） ()|未给出搜索词；requestedState=NONE|
|kf-h001 P1-E|27|CLICK (observation:12:target:13)|REPORT_NO_RESULTS ()|Search for "Tokyo Sushi Teppen(Shibuya)" returned 0 results; no public restaurant result is available.|
|kf-h001 P1-E|28|CLICK (observation:13:target:13)|REPORT_NO_RESULTS ()|Current page shows 0 results for the keyword query; no observed result link or safe query control can advance the read-only objective.|
|kf-h005 P1-E|3|CLICK (observation:1:target:18)|CLICK (observation:1:target:18)|—|
|kf-h005 P1-E|4|CLICK (observation:2:target:18)|CLICK (observation:2:target:18)|—|
|kf-h005 P1-E|5|CLICK (observation:4:target:14)|CLICK (observation:4:target:21)|—|
|kf-h005 P1-E|6|CLICK (observation:5:target:21)|CLICK (observation:5:target:21)|—|
|kf-h005 P1-E|7|CLICK (observation:7:target:21)|CLICK (observation:7:target:14)|—|
|kf-h005 P1-E|8|CLICK (observation:8:target:18)|CLICK (observation:8:target:18)|—|
|kf-h005 retest|3|CLICK (observation:1:target:18)|CLICK (observation:1:target:18)|—|
|kf-h005 retest|4|CLICK (observation:2:target:18)|CLICK (observation:2:target:18)|—|
|kf-h005 retest|5|CLICK (observation:4:target:21)|CLICK (observation:4:target:21)|—|
|kf-h005 retest|6|CLICK (observation:5:target:18)|CLICK (observation:5:target:18)|—|
|kf-h005 retest|7|CLICK (observation:6:target:18)|CLICK (observation:6:target:18)|—|

四条 REPORT_NO_RESULTS、十一条 CLICK；一条原始输出 REFINE_RETRIEVAL 但 requestedState=NONE，没有搜索词，被既有 Schema 12 解码器拒绝。未修复或追加请求。REPORT_NO_RESULTS 的 reason 原样列出，不能视为已经验证的页面逐字引用。原 DOM、绑定查询区域及前后稳定快照均缺失；executorAcceptance=null，不能声称执行器接受。由独立复核标注，不据此计产品成功率。
