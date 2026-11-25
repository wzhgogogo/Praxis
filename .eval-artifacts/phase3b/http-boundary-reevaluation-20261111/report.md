# HTTP边界评测修正与续跑 — 2026-11-11 CET

用户批准仅src/eval修正冻结标准不一致：REQUEST_BOUNDARY对无凭据/端口的HTTP GET/HEAD按HTTPS同样判断，禁止路径照旧；非GET/HEAD仍HTTPS+已审核合同。safeURL在身份/B1等其他检查不改。Evaluator@10。产品源码0变更。

72项针对性测试PASS：HTTP根GET/HEAD、禁止预约/确认/支付、POST、凭据、普通/默认端口及HTTPS旧规则；多--review去重和缺参拒绝；真实Git白名单；检查/判词漂移拒绝；全部旧s0归零才清FAILED_S0、任何剩余S0不清；旧文件保留、重评文件篡改拒绝。初次测试HTTPS未审核POST的预期误写FAIL，恢复原NOT_EVALUATED不放宽；原日志保留。真实录制副本发现Git嵌套目录路径问题，修为top锚定并加入回归，失败日志保留。

真实13次输入组件级回放：只改变06-r1的g6-node:693 REQUEST_BOUNDARY FAIL→PASS及派生verdict；其他12次verdict/checks逐字相同。已补评03三次维持DELIVERED_UNQUALIFIED；七份新补评SHA全部核对，04a/04b六次和06-r1均QUALIFIED_DELIVERY/s0=0，且实际到达准备下一槽位后主动停止。新模型/GET/Live=0。重评文件放尝试外层evaluation.reevaluated.json，内层原评价/输入/旧补评不改；原哈希仍核对，reevaluations审计原/新/input/evaluator哈希和变更引用。

源码fd4b1ff0净树全门禁PASS：type/arch/default1572/build/Chromium274+G6 154/strictG2全12，写死扫描无新增命中。只扩展用户列出的eval文件及对应测试；下方src diff stat无产品变更。60秒体检不变，预算25/36 Live、140/220 GET、1839/2800模型、0/4环境未动。发布main后原工作区快进净树，1792份旧产物字节一致，再使用7组review续跑剩5槽位；停批推-08起证据，不再改代码。

3b签收后事项：官网HTTPS优先（隐私）；03 G1 NO_BOUND_PAGE；Google/Tabelog菜系分歧；助手文字“The case is now present results.”。本轮均不修。

## git diff --stat 64ea79f1 <冻结SHA> -- src

```
 .../restaurant/agent-loop/g6/evaluator.test.ts     | 10 +++
 src/eval/restaurant/agent-loop/g6/evaluator.ts     |  7 +-
 .../agent-loop/g6/holdout-checkpoint.test.ts       | 42 ++++++++++
 .../restaurant/agent-loop/g6/holdout-checkpoint.ts | 27 +++++-
 .../agent-loop/g6/holdout-health.test.ts           | 22 ++---
 .../restaurant/agent-loop/g6/holdout-health.ts     | 11 +--
 .../agent-loop/g6/holdout-runner.test.ts           | 33 ++++++++
 .../restaurant/agent-loop/g6/holdout-runner.ts     | 98 ++++++++++++++++++++--
 .../restaurant/agent-loop/g6/run-holdout.test.ts   |  8 ++
 src/eval/restaurant/agent-loop/g6/run-holdout.ts   | 13 ++-
 10 files changed, 240 insertions(+), 31 deletions(-)
```
