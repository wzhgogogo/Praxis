import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const dir='.eval-artifacts/checkpoint-c-live-20261020/budget-condition-20261022',base='.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p));
const put=async(p,v)=>fs.writeFile(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const replay=await read(`${dir}/replay-summary.json`),calibration=await read(`${dir}/calibration/comparison.json`),diagnosis=await read(`${dir}/h11-diagnosis.json`);
assert.equal(replay.status,'PASS');assert.equal(calibration.status,'PASS');assert.equal(calibration.outcomeMatches,22);
const frozen=[];
for(const name of ['replay-freeze.json','calibration-freeze.json']){
 const bytes=await fs.readFile(`${dir}/${name}`),freeze=JSON.parse(bytes);
 for(const[p,h]of Object.entries(freeze.files))assert.equal(sha(await fs.readFile(p)),h,`FROZEN_CHANGED:${p}`);
 frozen.push({path:`${dir}/${name}`,sha256:sha(bytes),codeCommit:freeze.codeCommit,verifiedFiles:Object.keys(freeze.files).length});
}
const gates=[];
for(const [name,file,pattern,count]of [
 ['typecheck','typecheck-final.log',null,null],['architecture','architecture.log',/Architecture check passed: 0 forbidden/,null],
 ['unit','unit-local-corrected.log',/ℹ pass 1001\nℹ fail 0/,1001],['build','build-final.log',null,null],
 ['browser-fixture','browser-local.log',/ℹ pass 131\nℹ fail 0/,131],
]){
 const p=`${dir}/gates/${file}`,bytes=await fs.readFile(p),text=bytes.toString();
 if(pattern)assert.match(text,pattern);assert.doesNotMatch(text,/error TS\d+|^✖/m);
 gates.push({name,status:'PASS',path:p,sha256:sha(bytes),tests:count});
}
const comparisons=[];
for(const row of replay.rows){const e=await read(row.evaluationPath);assert.equal(sha(await fs.readFile(row.evaluationPath)),row.evaluationSha256);comparisons.push(...e.conditionStateComparisons);}
assert.equal(comparisons.length,10);assert.ok(comparisons.every(c=>c.assessment==='CONSISTENT'));
const priorLedgerPath=`${base}/ledger-after.json`,priorLedgerBytes=await fs.readFile(priorLedgerPath),ledger=JSON.parse(priorLedgerBytes);
assert.equal(ledger.totalModelCalls,3280);assert.equal(ledger.totalFullLiveRuns,51);assert.equal(ledger.environmentReruns,3);
await put(`${dir}/resource-ledger.json`,{schema:'budget-condition-offline-resources@1',mode:'OFFLINE_DISPLAY_REPLAY_AND_EXPOSED_CALIBRATION',
 prior:{path:priorLedgerPath,sha256:sha(priorLedgerBytes)},increment:{realModelCalls:0,websiteRequests:0,GoogleRequests:0,fullLiveRuns:0,environmentReruns:0},
 after:{totalModelCalls:ledger.totalModelCalls,phase2ModelCalls:ledger.phase2ModelCalls,totalFullLiveRuns:ledger.totalFullLiveRuns,environmentReruns:ledger.environmentReruns,remaining:ledger.remaining},
 offline:{savedDisplayReplays:3,displayEvaluations:3,calibrationEvaluations:22,localBrowserFixtures:131},
 rule:'Historical invocations/resources copied into replay artifacts are old observations, never billed a second time. Local loopback Fixture traffic is separate from website traffic.'});
await put(`${dir}/verification.json`,{schema:'budget-condition-verification@1',status:'PASS',codeCommit:replay.codeCommit,
 freezes:frozen,gates,targetedTests:{green:42,red:4,redPath:`${dir}/red-tests.log`,greenPath:`${dir}/green-tests.log`},
 savedRuns:3,deliveredRecords:5,uniqueOutlets:2,budgetRowsConsistent:5,totalConditionRowsConsistent:10,unsupported:0,missedKnown:0,
 calibration:{outcomes:'22/22',normalDeclaration:'20/20',interruptedDeclarationUnknown:2,boundary:calibration.boundary},
 scope:'Offline counterfactual display regression on exposed saved artifacts. Original Live and original evaluations unchanged; no phase-exit claim.',newModels:0,newWebsites:0,newLive:0});
const table=replay.rows.flatMap(r=>r.budgets.map(b=>`| ${r.runId} | ${b.outletName} (${b.candidateId.split('/').at(-1)}) | criterion:1 / HARD | MET → MET | ${b.displayed.sources.at(-1).quote.replaceAll('|','\\|')} | CONSISTENT |`)).join('\n');
const report=`# 结构预算条件修复：离线四层报告

- Status: frozen regression / draft, not integrated；已暴露留出集的用户授权修复回放，非 Clean、非新 Live。
- 分支：codex/fix-budget-condition；准备分支起点 17415d1cc1fad5c5da7729de125f4581e0251cb1；生产修复提交 ${replay.codeCommit}。
- Evaluator @33 / rubric @29，语义 Prompt @21、条件状态 @3 不变：没有改 Prompt、Schema 或评价规则，仅修复既有 firm-cap 条件遗漏。
- 回放冻结 SHA-256：\`${frozen[0].sha256}\`（${frozen[0].verifiedFiles} 项）；校准冻结：\`${frozen[1].sha256}\`（${frozen[1].verifiedFiles} 项），运行前已提交，运行后全部逐项一致。

## 1. 端到端结果与本轮承诺

本轮承诺已兑现：h-02、h-08、h-14 的原始事件经当前生产 Router → Reducer，五条门店交付记录（两家不同店）都生成带 criterionRef 的结构化 HARD 预算行。价格来自产品当时已读取的当前同店事实，无新来源请求或价格重采；@33 独立核对全部一致。三份回放仍为 QUALIFIED_DELIVERY，原先三份 @33 参考评价本来也为 QUALIFIED_DELIVERY；改善的是缺失预算展示和交付资格门槛，不能把这三份派生展示记为新增 Live 成功。

| 保存运行 | 交付店 | 新预算行 | 产品 → 独立 @33 | 实际展示价格原文之一 | 展示一致性 |
| --- | --- | --- | --- | --- | --- |
${table}

每行完整价格原文、sourceUrl、evidenceIds、独立依据与旧缺行对照保存在 [replay-summary.json](replay-summary.json)。三份生产派生产物在 replays/，评价表示视图在 views/，独立结果在 evaluations/；[lineage.json](lineage.json) 绑定原始与派生 SHA。原始运行和原始评价没有覆盖。

@33 评价沿用上轮已批准的 budgetPerPerson→criteria 表示投影及原产物专属对应，只重绑派生 SHA，未增加语义等价关系。生产 Router/Reducer 使用真实结构预算 intent，未向生产 criteria 补写 Gold。原模型选择、source recordings、全部 priceFacts、请求、耗时、资源不变。保存的时延是原 Live 时延，本次没有新的模型等待或 Live 耗时样本。

## 2. 逐环节判定与检错

| 环节 | 判定 | 证据及边界 |
| --- | --- | --- |
| 语义结构预算 | 保留既有正确结构 | 原 Proposal、intentDraft/intent 的 max=8000 JPY 没有改；语义合同只将 firm cap 放在 budgetPerPerson，SOFT 目标仍为 criteria。 |
| 发现/身份/查位 | 沿用保存证据 | 本轮未重跑发现、来源或模型，不据此声明当前库存。独立评价复用原四参数 GET 响应。 |
| HARD 价格 | PASS | 条件核对和资格使用相同结果；明确 cap 超出 NOT_MET、价格未知 NOT_CHECKED，均不允许交付。合成正常 2500/3000 可交付，4000/3000 和无价均被 Validator 与 Reducer 拒绝。 |
| 价格来源 | PASS（保存响应范围） | 仅当前、同候选、同来源、适用餐期 MEAL/range；保留真实原文、税信息和来源。午餐/附加项不建立晚餐价格，课程列价不代表该课程可订。 |
| Router → Reducer 展示 | PASS | 3 次保存事件，5 条预算、10 条全部条件均 CONSISTENT；旧 Italian criterion:0 不变，预算追加 criterion:1。 |
| SOFT 价格 | PASS（局部回归） | ideally under 6000 与 around 6000 保留不同比较；6500 对前者 NOT_MET、对后者沿20%政策 MET，SOFT 未硬化；另行 firm cap 不按金额与 SOFT 合并。 |

| 主要失败机制 | 测试入口 | 红灯 → 绿灯 | 未覆盖边界 |
| --- | --- | --- | --- |
| 结构预算不在 criteria 导致缺行 | condition-states + 保存产物 Router/Reducer 默认集成测试 | 修复前缺行断言失败；修复后五行齐全 | 新的实时网站表现 |
| 结构上限超出或未知仍被交付 | action-validator 既有价格测试扩充 | 修复前错误 ALLOWED；修复后超出/无价拒绝，Reducer 拒绝伪造展示 | 未验证套餐在请求时段可订 |
| max 文本未识别 | condition-states 通用价格测试 | 修复前 NOT_CHECKED；修复后 NOT_MET | 未新增比较操作符 Schema |
| 测试替身把来源价格丢掉 | W11 普通 Web + 全套 | 新门槛暴露 W11 价格缺证；补齐来自 Fixture offer 的真实替身报价，未放宽生产规则 | Fixture 不是当前网站 |

[red-tests.log](red-tests.log) 保存四个有效断言红灯；[green-tests.log](green-tests.log) 42/42。实际五门禁：typecheck、arch:check、npm test **1001/1001**、build、本地 Chromium Fixture **131/131**，详见 [verification.json](verification.json)。初次沙箱拒绝本机监听/Chromium、以及 W11 缺证的失败日志均保留；在允许本机 Fixture 的环境实际跑绿，不将环境失败算产品通过。校准自动输出先保存再读标签：**22/22**，常规声明20/20 ABSENT、两次中断声明保持未评估；越界9 ABSENT/13 NOT_EVALUATED，没有把缺证变绿。

比较政策沿用现状：budgetPerPerson.max 不保存独占“小于”操作符；区间相交、近似±20%、税不换算及课程价格分类不在本轮改动范围，未利用本轮修复放宽它们。

## 3. 严重程度与资源

五条新预算展示与独立依据一致，全部十条条件比较 0 S1_UNSUPPORTED、0 MISSED_KNOWN_CONDITION。三份派生评价的 S0_DECLARATION/S0_BOUNDARY 均 ABSENT，仅针对各自保存的执行证据；不能消除历史 H003 阳性或其他旧未评估项。校准的 UNKNOWN/NOT_EVALUATED 原样保留。

本轮真实模型、网站、Google、完整 Live、环境重跑均增量 **0**。累计保持 **3280 模型调用 / 51 完整 Live / 3 环境重跑**，剩余720/49/7，见 [resource-ledger.json](resource-ledger.json)。本机 Fixture 的 loopback 与外部来源访问分开记录。未申请或消耗新的模型预算。

## 4. 归因、h-11 与收敛

已证实根因是两个消费者只遍历 intent.criteria，漏掉正确保存的 budgetPerPerson。condition-states 现在派生追加 HARD 行；read-assessment 复用同一条件判定。既有默认价格测试只涵盖文字 criteria，因此没覆盖结构预算；新增保存事件与结构字段反例补齐这个遗漏。没有新增站点、地名、菜系或评测坐标常量，没有改变通用 Runtime、Guard、来源解析器或模型权限。

h-11 的 SOFT 措辞问题独立于本修复：原用户说“**Ideally under 6,000 yen per person**”；原始模型第1次语义响应已输出“**around 6,000 yen per person or less**”，之后 Compiler 和最终 intent 原样保留。记录是 SUCCEEDED/TOOL_CALLS，3495ms，非超时；h-05/h-17 对相同用户文本保留 under。三个 Prompt 都是 @21，移除参考时间后系统文本相同；这定位到语义模型输出，不能声称观察到模型内部推理。详见 [h11-diagnosis.json](h11-diagnosis.json) 的原产物 SHA、decisions SHA、调用序号与字段指针。

Prompt 已要求 ideally 为 SOFT、只把 firm cap 放入 BUDGET_PER_PERSON，并保留金额/每人基准，但未显式约束比较方向。**推测**模型把偏好强度的软化误作金额区间的近似化；当前政策会把 around 6000 的上界放到7200，而 ideally under 的软上界仍为6000。建议后续单独评审 Prompt：明确强度与数值运算符互相独立，ideally under X 保留 SOFT + under X，只有真正 around/approximate 才使用20%容差；配固定输入回归再验证模型。本轮仅报告，语义 Prompt 未改、h-11 原评价未覆盖。

本切片离线验收通过，等待复核。原18次正式评价与阶段退出判断不因展示反事实而改写；没有启动任何新 Live，没有合并准备/集成分支。按用户要求推送本修复分支后停止。
`;
await fs.writeFile(`${dir}/four-layer-report.md`,report,{flag:'wx'});
console.log(JSON.stringify({status:'PASS',budgetRows:5,conditionRows:10,calibration:'22/22',freezes:frozen.map(f=>f.sha256),newModels:0,newWebsites:0,newLive:0}));
