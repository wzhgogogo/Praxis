import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,renameSync,writeFileSync} from 'node:fs';

export const root='.eval-artifacts/phase3b/c-batch2';
export const load=p=>JSON.parse(readFileSync(p,'utf8'));
export const hash=b=>createHash('sha256').update(b).digest('hex');
export const cet=()=>new Date(Date.now()+3600000).toISOString().replace('Z','+01:00');
export const git=(...args)=>execFileSync('git',args,{encoding:'utf8',env:{PATH:process.env.PATH,HOME:process.env.HOME,LANG:'C.UTF-8'}}).trim();
export class Stop extends Error {constructor(code,detail={}){super(code);this.code=code;this.detail=detail;}}
export function safeBytes(bytes){
  const text=bytes.toString();
  for(const key of ['DEEPSEEK_API_KEY','GOOGLE_MAPS_API_KEY'])if(process.env[key]&&text.includes(process.env[key]))throw new Stop('S0_SECRET_RECORDING_REFUSED');
  return bytes;
}
export function save(path,value,exclusive=false){writeFileSync(path,safeBytes(Buffer.from(JSON.stringify(value,null,2)+'\n')),{flag:exclusive?'wx':'w'});}
export function verify(){
  for(const item of load(`${root}/freeze.json`).files){
    if(item.path.split('/').some(p=>p.startsWith('.env')||p==='.eval-private'))throw new Stop('FORBIDDEN_FROZEN_INPUT');
    if(hash(readFileSync(item.path))!==item.sha256)throw new Stop('FROZEN_INPUT_CHANGED',{path:item.path});
  }
}
const ledgerPath='.eval-artifacts/phase3b/budget.json',prefix='phase3b-c-batch2-call-';
const keys=['fullLive','realModelCalls','environmentReruns','evaluationPublicGET','googleRequests','restaurantWebsiteRequests'];
export function total(entries,key){return entries.reduce((n,e)=>n+(e[key]??(key==='evaluationPublicGET'?e.publicGET:0)??0),0);}
export function checkBudget(entries,key){
  const batch=total(entries.filter(e=>e.id.startsWith(prefix)),key);
  const caps={realModelCalls:100,evaluationPublicGET:35,googleRequests:35};
  const shared={realModelCalls:1000,evaluationPublicGET:40};
  if(batch>=caps[key]||(shared[key]!==undefined&&total(entries,key)>=shared[key]))throw new Stop('BUDGET_EXHAUSTED',{key});
}
export function charge(kind,meta){
  const key={MODEL:'realModelCalls',GOOGLE:'googleRequests',GET:'evaluationPublicGET'}[kind];
  const ledger=load(ledgerPath);checkBudget(ledger.entries,key);
  const number=ledger.entries.filter(e=>e.id.startsWith(prefix)&&e.kind===kind).length+1;
  const entry={id:`${prefix}${kind.toLowerCase()}-${String(number).padStart(3,'0')}`,conversation:'C',batch:2,kind,
    startedAtCET:cet(),...Object.fromEntries(keys.map(k=>[k,k===key?1:0])),...(kind==='GET'?{restaurantWebsiteRequests:1}:{}),...meta};
  if(ledger.entries.some(e=>e.id===entry.id))throw new Stop('DUPLICATE_LEDGER_ENTRY');
  ledger.entries.push(entry);ledger.cumulative=Object.fromEntries(keys.map(k=>[k,total(ledger.entries,k)]));ledger.asOfCET=cet();
  const temp=ledgerPath+'.c-batch2-tmp';save(temp,ledger);renameSync(temp,ledgerPath);
  return {entry,number};
}
export function start(phase,credentialKeys=[]){
  verify();if(git('status','--porcelain'))throw new Stop('DIRTY_START');
  for(const key of credentialKeys)if(!process.env[key]?.trim()){console.log('未加载');throw new Stop('CREDENTIAL_NOT_LOADED');}
  if(credentialKeys.length)console.log('已加载');
  const sourceCommit=git('rev-parse','HEAD');mkdirSync(`${root}/${phase}`,{recursive:true});
  save(`${root}/${phase}/started.json`,{phase,startedAtCET:cet(),sourceCommit,freezeSha256:hash(readFileSync(`${root}/freeze.json`)),
    credentialStatus:credentialKeys.length?'已加载':'未加载',fileHandlingStatement:'未独立读取文件',fullLive:0},true);
  return sourceCommit;
}
export function fragmentValid(subject,item){
  if(!item||!['name','address'].includes(item.field)||!Number.isInteger(item.start)||!Number.isInteger(item.end))return false;
  const value=subject[item.field];
  return item.start>=0&&item.end>item.start&&item.end<=value.length&&item.fragment===value.slice(item.start,item.end)
    &&item.fragment.trim()===item.fragment&&item.fragment.length>=2&&item.fragment.length<=100;
}
export function targetCheck(target,expected){
  const query=target?.query?.normalize('NFKC').toLowerCase()??'';
  return !!target&&target.selectionScope===expected.scope&&target.goal===expected.goal
    &&(!expected.contains||query.includes(expected.contains.toLowerCase()))
    &&(!expected.mustNotContain||!query.includes(expected.mustNotContain.toLowerCase()));
}
