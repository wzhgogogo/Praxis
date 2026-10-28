import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync,renameSync} from 'node:fs';
import {ModelNamedSourceQuery} from '../../../src/integrations/restaurant-search/named-source-query.ts';
import {DeepSeekModelGateway} from '../../../src/infrastructure/deepseek/deepseek-model-gateway.ts';
const root='.eval-artifacts/phase3b/g4-priority-fragments',ledgerPath='.eval-artifacts/phase3b/budget.json',load=p=>JSON.parse(readFileSync(p,'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex'),cet=()=>new Date(Date.now()+3600000).toISOString().replace('Z','+01:00');
function save(p,v){const b=Buffer.from(JSON.stringify(v,null,2)+'\n');for(const k of ['DEEPSEEK_API_KEY','GOOGLE_MAPS_API_KEY'])if(process.env[k]&&b.includes(Buffer.from(process.env[k])))throw Error('SECRET_RECORDING_REFUSED');writeFileSync(p,b,{flag:'wx'});}
for(const f of load(root+'/freeze.json').files)assert.equal(sha(readFileSync(f.path)),f.sha256,f.path);
assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),'');assert(!existsSync(root+'/model-summary.json'));assert(process.env.DEEPSEEK_API_KEY?.trim());assert.equal(process.env.DEEPSEEK_MODEL,'deepseek-v4-flash');console.log('已加载');
const gateway=DeepSeekModelGateway.fromEnvironment(),results=[];let stop=null;
for(const row of load(root+'/model-inputs.json').rows){
 const candidate={restaurant:{id:row.caseId,outletName:row.subject.name,address:row.subject.address,sourceIds:{googlePlaces:row.googlePlaceId},provenance:{}},matchReasons:[],warnings:[],executionConfidence:'LOW'};
 const budget={totalModelCalls:0,maxModelCalls:1};let wire;
 const planner=new ModelNamedSourceQuery({async complete(request){
  const l=load(ledgerPath),prior=l.entries.filter(e=>e.id.startsWith('phase3b-c-g4-priority-model-'));
  assert(prior.length<10&&l.cumulative.realModelCalls<l.limits.realModelCalls);const id=`phase3b-c-g4-priority-model-${String(prior.length+1).padStart(3,'0')}`;
  assert(!prior.some(e=>e.caseId===row.caseId));l.entries.push({id,caseId:row.caseId,conversation:'C',batch:'G4_PRIORITY_FRAGMENTS',kind:'MODEL',atCET:cet(),fullLive:0,realModelCalls:1,evaluationPublicGET:0,restaurantWebsiteRequests:0,googleRequests:0,environmentReruns:0});l.cumulative.realModelCalls++;l.asOfCET=cet();writeFileSync(ledgerPath+'.g4-priority-tmp',JSON.stringify(l,null,2)+'\n');renameSync(ledgerPath+'.g4-priority-tmp',ledgerPath);
  wire={ledgerId:id,request};try{wire.response=await gateway.complete(request);return wire.response;}catch(e){wire.failure={code:e.code??'MODEL_INFRASTRUCTURE_FAILURE'};throw Error('MODEL_INFRASTRUCTURE_FAILURE');}
 }},budget);
 let query;try{query=await planner.alternative(candidate,new AbortController().signal);}catch{stop='MODEL_INFRASTRUCTURE_FAILURE';}
 const result={caseId:row.caseId,id:row.id,atCET:cet(),wire,query:query??null,strictProperSubstring:typeof query==='string'&&query.length<row.subject.name.length&&row.subject.name.includes(query),realCalls:budget.totalModelCalls,GET:0,google:0,live:0,credentialHandling:'未独立读取文件',stop};save(`${root}/models/${row.caseId}.json`,result);results.push({caseId:row.caseId,query:result.query,strictProperSubstring:result.strictProperSubstring});console.log(JSON.stringify(results.at(-1)));if(stop)break;
}
save(root+'/model-summary.json',{sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),atCET:cet(),results,stop,GET:0,google:0,live:0,credentialStatus:'已加载',handling:'未独立读取文件'});
