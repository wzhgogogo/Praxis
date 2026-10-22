// Frozen development recordings only. No provider/model transport.
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {observedDirectoryOutletReference} from '../../src/integrations/restaurant-search/native-restaurant-search.js';
import {tabelogDiscoveryPack} from '../../src/integrations/restaurant-search/source-packs.js';
const root=new URL('./',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('inputs.json',root),'utf8'));
const raw=readFileSync(new URL('recordings.json.gz',root));
if(createHash('sha256').update(raw).digest('hex')!==manifest.recordings.sha256)throw Error('Frozen recording hash mismatch');
const recordings=JSON.parse(gunzipSync(raw).toString());
const directory=tabelogDiscoveryPack.browser!.directory!;
const normalize=(s:string)=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'');
const topRegion=(url:string)=>{try{return new URL(url).pathname.match(/^\/(?:en\/)?[^/]+\/(A\d+)(?:\/|$)/)?.[1];}catch{return undefined;}};
const records=recordings.map((r:any)=>{
 const expected=manifest.expectedTopRegionByCase[r.caseId];
 const decisions=r.regionDecisions;
 const observed=decisions.flatMap((d:any)=>d.input.observation.targets.filter((t:any)=>t.href&&directory.isRegionEntrance(t.href)));
 const outputs=decisions.flatMap((d:any)=>{try{const a=JSON.parse(d.outputText);const t=d.input.observation.targets.find((t:any)=>t.ref===a.targetRef);return a.action==='OPEN_LINK'&&t?.href&&directory.isRegionEntrance(t.href)?[t]:[];}catch{return [];}});
 const first=outputs[0];
 const reference=r.googleBatch&&r.location?observedDirectoryOutletReference(tabelogDiscoveryPack,r.googleBatch.detail.read,r.location):undefined;
 const matches=reference?observed.filter((t:any)=>directory.containsObservedOutlet!(t.href,reference.sourceUrl)):[];
 const chosen=matches.sort((a:any,b:any)=>new URL(a.href).pathname.length-new URL(b.href).pathname.length)[0];
 const old=first?(topRegion(first.href)===expected?'CORRECT':'INCORRECT'):'NOT_REACHED';
 const after=reference?(chosen?(topRegion(chosen.href)===expected?'CORRECT':'INCORRECT'):'NO_OBSERVED_MATCH'):'UNCHANGED_NO_REFERENCE';
 const locationName=decisions[0]?.input.goal.location?.name??r.location?.label??'';
 // Method B feasibility: source-observed station/neighborhood labels only.
 // New model-inferred station rationales are unmeasured (zero real calls).
 const names=[locationName,...(r.location?.addressComponents??[]).filter((c:any)=>c.types.some((t:string)=>/^(?:sublocality(?:_level_\d+)?|neighborhood|train_station|transit_station)$/.test(t))).map((c:any)=>c.longText)].filter(Boolean);
 const labels=observed.filter((t:any)=>names.some((n:string)=>normalize(t.label).includes(normalize(n))));
 const planningMs=r.sharedTextPlanning.reduce((sum:number,d:any)=>sum+(d.latencyMs??0),0);
 const indirect=!!locationName&&!observed.some((t:any)=>normalize(t.label).includes(normalize(locationName)));
 return {id:r.id,group:r.group,caseId:r.caseId,expected,old,firstUrl:first?.href??null,
  reference:reference??null,observedReferenceMatch:chosen?.href??null,after,
  b:{observedNames:names,matchingLabels:[...new Set(labels.map((t:any)=>t.label))],newModelRationale:'NOT_EVALUATED'},
  timing:{googleStageMs:r.googleStageElapsedMs,sharedTextPlanningMs:planningMs,indirectInRecordedObservations:indirect,
   estimatedPreselectionWaitMs:r.googleStageElapsedMs!==null?r.googleStageElapsedMs+planningMs:null},sources:r.sources};
});
const quantiles=(values:number[])=>{const sorted=values.sort((a,b)=>a-b);return {n:values.length,medianMs:values.length?sorted.length%2?sorted[Math.floor(sorted.length/2)]:(sorted[sorted.length/2-1]!+sorted[sorted.length/2]!)/2:null,maxMs:values.length?sorted.at(-1):null};};
const cases=Object.keys(manifest.expectedTopRegionByCase).map(caseId=>{
 const rs=records.filter((r:any)=>r.caseId===caseId);
 return {caseId,n:rs.length,oldCorrect:rs.filter((r:any)=>r.old==='CORRECT').length,oldIncorrect:rs.filter((r:any)=>r.old==='INCORRECT').length,
  referenceCorrect:rs.filter((r:any)=>r.after==='CORRECT').length,referenceIncorrect:rs.filter((r:any)=>r.after==='INCORRECT').length,
  unchangedOrMissing:rs.filter((r:any)=>!['CORRECT','INCORRECT'].includes(r.after)).length,
  wait:quantiles(rs.flatMap((r:any)=>r.timing.estimatedPreselectionWaitMs===null?[]:[r.timing.estimatedPreselectionWaitMs]))};
});
const out={status:'OFFLINE_REFERENCE_ROUTING_COMPARISON',mode:'RECORDED_INPUTS_WITHOUT_MODEL',freeze:manifest.recordings,realModelCalls:0,networkCalls:0,
 layer1:'NOT_EVALUATED: no full task, inventory or delivery',layer2:'Recorded regional evidence classification; production completion separately tested with controlled browser fixtures',
 severity:'No live S0 conclusion; independent region Gold finds no new incorrect region in covered records',
 attribution:'Old coverage omitted absent-name routing from observed same-source outlet paths; old administrative/name-similar choices are documented source navigation failures',
 method:'A selected; B new-model behavior not evaluated, source-observed station/neighborhood coverage only',cases,records};
writeFileSync(new URL('comparison.json',root),JSON.stringify(out,null,2)+'\n');
const lines=['# 离线地区证据比较','','Evidence status: exposed development / frozen regression. 54 条，网络与真实模型调用均为 0。','',
 '逐例结论是来源证据的机械路由对照，不是模型回放通过率。无 Google 链接/未执行到 Google 的轨迹保留原路径，不计新增成功。','',
 '| 用例 | n | 旧正确/错误 | URL 支持正确/错误 | 无证据保持 | 提前等待估计中位/最长(ms) |','|---|---:|---|---|---:|---|',
 ...cases.map((c:any)=>`| ${c.caseId} | ${c.n} | ${c.oldCorrect}/${c.oldIncorrect} | ${c.referenceCorrect}/${c.referenceIncorrect} | ${c.unchangedOrMissing} | ${c.wait.medianMs}/${c.wait.maxMs} |`),'',
 '等待是原有串行 Google 阶段的时间间隔，加上提前移动的共享文本规划实际延迟；不是新路径的实测耗时。没有新增 Google 发现批次；这部分移到地区选择前，仍计原 90 秒来源预算。无法从旧轨迹推断网络并发收益。','',
 '方案 B：表中 JSON 保留原地点名称、来源实际给出的街区/车站字段及可匹配标签。神乐坂/中目黑缺少可独立核实的新车站推理；没有调用模型补写依据，故新模型行为为 NOT_EVALUATED。选择已有真实 URL 依据的 A，不同时上线 B。','',
 '| 批次/用例/attempt | 旧入口 | 旧判定 | URL 对照入口 | URL 判定 |','|---|---|---|---|---|',
 ...records.map((r:any)=>`| ${r.id} | ${r.firstUrl??'未到达'} | ${r.old} | ${r.observedReferenceMatch??'无可用证据，保持原路径'} | ${r.after} |`),''];
writeFileSync(new URL('comparison.md',root),lines.join('\n'));
console.log(JSON.stringify({records:records.length,cases},null,2));
