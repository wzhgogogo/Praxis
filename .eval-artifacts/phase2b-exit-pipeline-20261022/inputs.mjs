import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parseAllDocuments, stringify} from 'yaml';
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export function committedBlocks(bytes, commitment) {
 assert.equal(commitment.schema,'holdout-commitment@1');
 assert.equal(commitment.status,'APPROVED_BY_USER');
 assert.equal(sha(bytes),commitment.fileSha256,'FILE_SHA_MISMATCH_BEFORE_YAML_PARSE');
 const text=bytes.toString('utf8');assert.ok(!text.includes('\r')&&text.endsWith('\n'),'UTF8_LF_REQUIRED');
 assert.equal(Buffer.from(text).equals(bytes),true,'INVALID_UTF8');
 const blocks=text.split(/^---$/m);
 if(blocks[0].split('\n').every(line=>!line.trim()||line.trimStart().startsWith('#')))blocks.shift();
 const chunks=blocks.map(s=>s.replace(/^\n+|\n+$/g,'')+'\n');
 const expected=Object.values(commitment.caseSha256);
 assert.equal(chunks.length,6,'SIX_CASES_REQUIRED');assert.equal(expected.length,6);
 assert.equal(new Set(expected).size,6);
 for(const chunk of chunks)assert.ok(expected.includes(sha(chunk)),'CASE_SHA_MISMATCH_BEFORE_YAML_PARSE');
 assert.equal(new Set(chunks.map(sha)).size,6);
 return chunks;
}
export function loadCommittedCases(bytes, commitment) {
 const chunks=committedBlocks(bytes,commitment); // All hashes checked before any YAML parser call.
 return chunks.map(chunk=>{
  const docs=parseAllDocuments(chunk,{uniqueKeys:true});assert.equal(docs.length,1);
  assert.deepEqual(docs[0].errors,[],'INVALID_YAML');
  const c=docs[0].toJS({maxAliasCount:0});assert.equal(sha(chunk),commitment.caseSha256[c.id],'CASE_ID_SHA_MISMATCH');
  validateCase(c);return c;
 });
}
export function runnerYaml(cases){return cases.map(c=>'---\n'+stringify(c)).join('');}

const fail=(path,reason)=>{throw Error(`${path}: ${reason}`);};
function object(value,path,allowed){
 if(!value||typeof value!=='object'||Array.isArray(value))fail(path,'expected mapping');
 for(const key of Object.keys(value))if(!allowed.includes(key))fail(path+'.'+key,'unknown field');
 return value;
}
function text(value,path){if(typeof value!=='string'||!value.trim())fail(path,'expected nonempty string');}
function fields(value,path,allowed,required=allowed){object(value,path,allowed);for(const key of required)text(value[key],path+'.'+key);for(const key of Object.keys(value))text(value[key],path+'.'+key);}
export function validateCase(c){
 object(c,'case',['id','weekday','fallback_place','content','semantic','acceptance']);
 for(const key of ['id','weekday','fallback_place','content'])text(c[key],'case.'+key);
 assert.ok(['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].includes(c.weekday),'INVALID_WEEKDAY');
 object(c.semantic,'semantic',['target','location','date','time','party_size','criteria']);
 fields(c.semantic.target,'semantic.target',['goal']);
 fields(c.semantic.location,'semantic.location',['value','relation']);
 fields(c.semantic.date,'semantic.date',['expression']);assert.equal(c.semantic.date.expression,'{DATE}');
 fields(c.semantic.time,'semantic.time',['expression','type','value','start','end'],[]);
 const t=c.semantic.time;assert.ok(t.value||t.start&&t.end,'TIME_REQUIRED');
 assert.ok(Number.isSafeInteger(c.semantic.party_size)&&c.semantic.party_size>0,'INVALID_PARTY_SIZE');
 assert.ok(Array.isArray(c.semantic.criteria),'CRITERIA_SEQUENCE_REQUIRED');
 c.semantic.criteria.forEach((x,i)=>{const p=`semantic.criteria[${i}]`;fields(x,p,['value','polarity','strength']);assert.ok(['POSITIVE','NEGATIVE'].includes(x.polarity));assert.ok(['HARD','SOFT','UNSPECIFIED'].includes(x.strength));});
 object(c.acceptance,'acceptance',['required_claims','optional_investigation','review']);
 assert.ok(Array.isArray(c.acceptance.required_claims)&&c.acceptance.required_claims.length,'REQUIRED_CLAIMS_REQUIRED');
 for(const [key,values]of Object.entries(c.acceptance)){
  if(key==='review'&&typeof values==='string'){text(values,'acceptance.review');continue;}
  if(!Array.isArray(values))fail('acceptance.'+key,'expected string sequence');
  values.forEach((v,i)=>text(v,`acceptance.${key}[${i}]`));
 }
 assert.ok(c.content.includes('{DATE}'),'DATE_PLACEHOLDER_REQUIRED');
}
function fill(value,date){
 if(typeof value==='string')return value.replaceAll('{DATE}',date);
 if(Array.isArray(value))return value.map(v=>fill(v,date));
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,fill(v,date)]));
 return value;
}
export function materializeCases(cases,exitStart,fallbacks=[]){
 assert.ok(/(?:Z|[+-]\d\d:\d\d)$/.test(exitStart)&&Number.isFinite(Date.parse(exitStart)),'EXPLICIT_EXIT_TIMESTAMP_REQUIRED');
 const tokyo=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(exitStart));
 const start=Date.parse(tokyo+'T12:00:00Z'),changes=[];
 assert.equal(new Set(fallbacks.map(f=>f.caseId)).size,fallbacks.length);
 for(const f of fallbacks)assert.ok(cases.some(c=>c.id===f.caseId),'UNKNOWN_FALLBACK_CASE');
 const runnerCases=cases.map(c=>{
  validateCase(c);let date;
  for(let d=7;d<=14;d++){const day=new Date(start+d*86400000);if(new Intl.DateTimeFormat('en',{weekday:'long',timeZone:'UTC'}).format(day)===c.weekday){date=day;break;}}
  assert.ok(date,'WEEKDAY_OUTSIDE_DATE_WINDOW');const iso=date.toISOString().slice(0,10);
  const display=new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',timeZone:'UTC'}).format(date);
  const fallback=fallbacks.find(f=>f.caseId===c.id);
  if(fallback){assert.equal(fallback.place,c.fallback_place,'ONLY_LISTED_FALLBACK');assert.equal(fallback.classification,'PRIMARY_BUSINESS_WITNESS_NOT_CERTIFIED');assert.match(fallback.reviewSha256,/^[a-f0-9]{64}$/);text(fallback.reviewPath,'fallback.reviewPath');}
  const place=fallback?.place??c.semantic.location.value;
  const relocate=s=>s.replaceAll(c.semantic.location.value,place);
  const semantic=structuredClone(c.semantic);semantic.date={expression:display,value:iso};semantic.location.value=place;
  const acceptance=fill(c.acceptance,iso);
  if(fallback)for(const [k,v]of Object.entries(acceptance))acceptance[k]=Array.isArray(v)?v.map(relocate):relocate(v);
  changes.push({caseId:c.id,date:iso,display,weekday:c.weekday,offsetDays:(date.valueOf()-start)/86400000,originalPlace:c.semantic.location.value,place,fallbackUsed:!!fallback,...(fallback?{fallback}:{}),onlyDateAndApprovedFallback:true});
  const result={id:c.id,dataset:'restaurant-read-novel-variant@1',reference_time:tokyo+'T00:00:00+09:00',content:relocate(c.content.replaceAll('{DATE}',display)),semantic,acceptance};
  assert.ok(!JSON.stringify(result).includes('{DATE}'));return result;
 });
 return {cases:runnerCases,changes,exitStart};
}
export function executionPlan(cases){
 assert.equal(cases.length,6);assert.equal(new Set(cases.map(c=>c.id)).size,6);
 return {schema:'phase2b-exit-execution@1',deferEvaluation:true,ceilings:{decisionTimeoutMs:30000,timeoutMs:500000,maxModelCalls:50,maxGoogleRequests:40},minGapMs:300000,cooldownMs:900000,maxRerunsPerCase:1,maxTotalReruns:4,runs:Array.from({length:18},(_,i)=>({runId:`h-${String(i+1).padStart(2,'0')}`,caseId:cases[i%6].id,repeat:Math.floor(i/6)+1,role:'HOLDOUT'}))};
}
