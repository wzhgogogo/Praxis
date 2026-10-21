import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const dir='.eval-artifacts/checkpoint-c-live-20261020/tabelog-query-binding-20261021';
globalThis.fetch=()=>{throw Error('REPORT_OFFLINE_ONLY');};
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=async name=>JSON.parse(await fs.readFile(`${dir}/${name}`));
const freezeBytes=await fs.readFile(`${dir}/freeze.json`),freeze=JSON.parse(freezeBytes);
for(const[p,h]of Object.entries(freeze.files))assert.equal(sha(await fs.readFile(p)),h,`FROZEN_CHANGED:${p}`);
const model=await read('model-summary.json'),ledger=await read('model-ledger.json'),budget=await read('phase2-ledger-after.json'),recomputed=await read('recomputed-results.json');
const calibration=await read('calibration-comparison/comparison.json'),gates=await read('gates.json'),selection=await read('selection-reuse.json'),audit=await read('private-class-audit.json');
const sources=[];
for(const source of budget.sources){
 let bytes,method='WORKTREE';
 try{bytes=await fs.readFile(source.path);}catch{bytes=execFileSync('git',['show',`e95de8cd:${source.path}`]);method='IMMUTABLE_GIT_BLOB_e95de8cd';}
 assert.equal(sha(bytes),source.sha256,`LEDGER_SOURCE_CHANGED:${source.path}`);
 sources.push({...source,verifiedBy:method});
}
assert.equal(budget.sources.reduce((s,r)=>s+r.models,0),budget.totalModelCalls);
assert.equal(new Set(ledger.calls.map(c=>c.id)).size,ledger.calls.length);
const protectedInputs=execFileSync('git',['diff','--name-only',freeze.codeCommit,'--','.eval-artifacts/p2-live-set-20261019','src/eval/restaurant/agent-loop/cases','src/eval/restaurant/semantic/holdout','web-skills'],{encoding:'utf8'}).trim();
assert.equal(protectedInputs,'');
const usageKnown=ledger.calls.filter(c=>c.usage).length;
const passed=gates.status==='PASS'&&model.gate==='PASS'&&calibration.status==='PASS'&&calibration.outcomeMatches===22&&selection.passed===5;
const result={schema:'tabelog-query-binding-result@1',status:passed?'OFFLINE_PASS_AWAITING_REVIEW':'OFFLINE_NOT_ACCEPTED',finishedAt:new Date().toISOString(),
 sourceReview:'3d147882',codeCommit:freeze.codeCommit,runCommit:model.codeCommit,freezeSha256:sha(freezeBytes),frozenFilesVerified:Object.keys(freeze.files).length,
 sourceRecomputation:{total:19,beforeConfirmed:0,afterConfirmed:recomputed.afterConfirmed,unconfirmed:recomputed.stillSelectionUnknown,runtimeInventoryConfirmed:0,runtimeInventoryUnknown:19,postRun:recomputed.comparison},
 calendar:model.calendar,selection:model.selection,calibration:{status:calibration.status,outcomeMatches:calibration.outcomeMatches,gates:calibration.gates},gates,
 privateClasses:{total:audit.dependencies.length,disappeared:audit.dependencies.filter(d=>d.status==='已消失').length,stillPresent:audit.dependencies.filter(d=>d.status==='仍存在').length,tableCheckSupplement:audit.tableCheckSupplement},
 resourceUsage:{newModelApiRequests:ledger.calls.length,modelUsageKnown:usageKnown,inputTokens:model.calendar.inputTokens,outputTokens:model.calendar.outputTokens,modelAutomaticRetries:0,websiteRequests:0,googleRequests:0,fullLiveRuns:0,environmentReruns:0},
 phase2:{totalModelCalls:budget.totalModelCalls,remainingModelCalls:budget.remaining.modelCalls,fullLiveRuns:budget.totalFullLiveRuns,environmentReruns:budget.environmentReruns},
 safety:{offlineNegativeControls:'PASS_WRONG_DATE_PARTY_OUTLET_MISSING_OR_CONTRADICTORY_RESPONSE_REJECTED',historicalH003S0:'PRESENT_RETAINED',quickValidationHistorical:'0/3_RETAINED',newLive:'NOT_RUN',currentLiveS0:'NOT_EVALUATED'},
 versions:{browserPrompt:19,browserContext:2,browserActionWire:11,restaurantContext:15,restaurantPrompt:27,evaluator:30,rubric:26},
 next:'STOP; push fix branch only; do not merge integration, recertify witnesses, or run quick/full Live until independent review accepts this repair.'};
await fs.writeFile(`${dir}/result.json`,JSON.stringify(result,null,2),{flag:'wx'});
await fs.writeFile(`${dir}/post-verification.json`,JSON.stringify({status:'PASS',freezeSha256:result.freezeSha256,frozenFilesVerified:result.frozenFilesVerified,ledgerSources:sources,protectedInputChanges:[],callIdsUnique:true,modelCallsCharged:ledger.calls.length,automaticRetries:0,sourceRequests:0,fullLiveRuns:0},null,2),{flag:'wx'});
const lines=[
'# Tabelog 改版补修：四层离线报告','',
`状态：**${result.status}**；draft / not integrated，已暴露开发材料，不是 Clean Baseline。仅推修复分支，后续快速验证、见证认证和检查点 C 均等待复核。`,
'',`生产/输入提交：\`${freeze.codeCommit}\`；运行提交：\`${model.codeCommit}\`。离线冻结 SHA-256：\`${result.freezeSha256}\`，${result.frozenFilesVerified} 项运行后逐项复核无变。该 SHA 不是 Live 授权。`,
'','## 第一层：端到端结果','',
'本轮完成来源绑定的离线闭环：真实本地 Chromium 经生产 Adapter → 日期/人数操作 → 公开 GET 响应捕获 → 解析 → grounding 产出正确 Offer；新旧标记、两种浏览器运行时共4个正常控制通过。错日期、错人数、错门店、冲突或缺响应的控制均拒绝。没有运行当前网站或完整 Live，不声称完整任务已能交付。',
'',`相同 69 点真实模型翻月：**${model.calendar.passed}/69**（门槛≥68；实际调用${ledger.calls.length}，失败/未到达不缩小分母）。选店 **${selection.passed}/5**：5个请求与已接受版本逐字相同，使用冻结的真实模型原始响应和当前评判函数重评，新增模型0次；原13/13直接门店页仅为相同输入的既有证据。22份校准 **${calibration.outcomeMatches}/22**，评测器@30/rubric@26未改。五门禁：${gates.status}，默认${gates.defaultTests.passed}/${gates.defaultTests.total}、Chromium${gates.browserFixtures.passed}/${gates.browserFixtures.total}，typecheck/arch/build通过。`,
'','## 第二层：逐环节判定','',
'- **P2-1 发现：** 本轮没有新增发现运行；此前快速验证的首批见证和地区/来源漏斗保留原结果。不能用本轮解析回归重判发现能力。',
'- **P2-2 选店：** 相同5种子重评5/5（缓存真实模型响应）；新的日期/人数/时段提示和69点翻月单列，不将选店正确等同于库存正确。',
'- **P2-3 条件与价格：** 课程/价格提取未修改；22校准保持。原Live的价格/HARD核对结果不回填，17条页面选中确认不产生新的价格或资格事实。',
'', '19个原 REQUEST_SELECTION_UNCONFIRMED 的逐项重算如下。独立 oracle 使用 Python HTMLParser/JSON，不调用生产 parser。源文件、原提交、事件序号及 SHA 在 inputs/manifest.json。',
'','| 样本 | 页面选中 | 运行时库存 | 页面可见可用时段（独立解析） | 与事后GET比较 |','|---|---|---|---|---|'];
for(const r of recomputed.rows)lines.push(`| ${r.id} | ${r.selectedQueryConfirmed?'已确认':'未确认'} | UNKNOWN：未捕获JSON | ${(r.independentlyParsedRenderedSlots??[]).join(', ')||'未确认'} | ${r.postRunComparison.status} |`);
lines.push('',
'**确认数由0/19变为17/19，另外2条仍未知。19条运行时捕获数组均为空，故按修复后的主要绑定规则仍全部 UNKNOWN。** 当天记录显示页面实际请求不带尾斜杠的 find_vacancy，旧监听只匹配带斜杠路径；现被动监听两种明确路径，不新增请求或 Guard 权限。缺失的历史响应不补造，事后 GET 不冒充运行时响应。',
'', '与事后独立四参数 GET 的重合样本5条：4条页面选择可确认，页面显示的时段均被复查支持；页面只渲染了部分时段，完整集合相等为0/4。另1条页面选择未确认，不能比较；14条没有同店事后GET。详见 recomputed-results.json 与 independent-oracle.json。',
'', '## 第三层：严重程度与安全','',
'没有把选中状态或缺失响应宣称为库存。强制反例拒绝错日期、错人数、错门店、最新响应冲突及纯时间模板；TableCheck /reserve 及子路径永久禁止保持不变，不打开表单、不点时段。没有新的 Live，因此本轮实时 S0 为 NOT_EVALUATED；历史 H003 S0 PRESENT、此前快速验证0/3及其资源超限原样保留。',
'', `校准正常 S0 声明 ${calibration.gates.normalS0Declaration.matched}/20；历史边界证据缺口 ${calibration.gates.s0Boundary.allowedEvidenceGaps} 份保留，不当作无越界。离线红绿、固定来源模型、历史 Live 结果分别报告。`,
'', '## 第四层：归因、资源与剩余边界','',
'- 已关闭的确定性机制：消失的私有js-钩子和强制隐藏字段导致页面选择永远无法确认；尾斜杠精确匹配又使当前响应漏捕。已替换为公开日期属性、人数组、共享通用选中状态和明确响应路径，库存继续严格绑定。旧代码有效红灯中旧标记2/2正常，新标记2/2失败；环境不完整的首轮尝试不计为红灯证据。',
`- 私有class审计：${audit.dependencies.length}处，7处消失均属本轮关键路径并修；11处仍存在只报告。Tabelog191页、TableCheck39页，逐条源代码位置/表达式、页面SHA和“仍存在／已消失／未覆盖”见 private-class-audit.md/json。TableCheck没有js-或整串class精确匹配；其旧菜单等未覆盖结构不宣称消失。`,
`- 本轮真实模型 API ${ledger.calls.length} 次，均计账，自动重试0；已知usage ${usageKnown}/${ledger.calls.length}，输入${model.calendar.inputTokens}、输出${model.calendar.outputTokens} tokens，平均墙钟${(model.calendar.meanWallMs/1000).toFixed(3)}秒。网站/Google/完整Live/环境重跑均0。阶段累计${budget.totalModelCalls}/4000模型，完整Live${budget.totalFullLiveRuns}/100，环境重跑${budget.environmentReruns}/10。`,
'- Browser Prompt19/Context2、wire11、Restaurant Context15/Prompt27文本/schema未改；V1技能和V2thinking不采用。URL参数直接初始化仍仅报告，未实现。Gold、变体、留出集、外层和原plan均未修改。',
'- 剩余缺口：19条历史运行缺运行时JSON，不能证明修复后完整Live的实时库存和合格交付；当前来源访问、动态网络兼容与完整500秒预算须在复核后按已有门槛验证。本轮停止，不恢复预先批准的后续步骤。',
'');
await fs.writeFile(`${dir}/four-layer-report.md`,lines.join('\n'),{flag:'wx'});
console.log(JSON.stringify({status:result.status,calendar:result.calendar.passed,selection:5,calibration:calibration.outcomeMatches,freeze:result.freezeSha256,phaseModels:budget.totalModelCalls}));
