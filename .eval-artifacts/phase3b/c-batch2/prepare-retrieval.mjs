import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {ProxyAgent} from 'undici';
import {DeepSeekModelGateway} from '../../../src/infrastructure/deepseek/deepseek-model-gateway.ts';
import {GooglePlacesClient} from '../../../src/integrations/google/google-places-client.ts';
import {root,load,save,cet,verify,charge,start,Stop,fragmentValid,safeBytes,hash} from './controlled-io.mjs';

async function execute(){
  const sourceCommit=start('retrieval-inputs',['DEEPSEEK_API_KEY','GOOGLE_MAPS_API_KEY']);assert.equal(process.env.DEEPSEEK_MODEL,'deepseek-v4-flash');
  const subjects=load(`${root}/subjects.json`).subjects,fragmentSubjects=subjects.filter(s=>s.variant==='MODEL_FRAGMENT'),japaneseSubjects=subjects.filter(s=>s.variant==='GOOGLE_JA');
  const accepted=new Map();let stop,modelCalls=0,googleCalls=0;
  mkdirSync(`${root}/retrieval-inputs/google`,{recursive:true});
  try{
    const request={taskId:'phase3b-g4-fragments',purpose:'restaurant_source_query_fragment_eval',promptVersion:'phase3b-fragment-proposal@1',
      messages:[{role:'system',content:'Propose one short restaurant-name search fragment per object. The fragment MUST be an exact contiguous substring of the provided original Google name or address. Prefer the distinctive store-name core over area/cuisine/descriptive words. Never translate or invent names. Return UTF-16 start/end offsets and the exact fragment. No websites, IDs, external lookup, or alternative attempts.'},
        {role:'user',content:JSON.stringify(fragmentSubjects.map(s=>({id:s.id,name:s.subject.name,address:s.subject.address})))}],
      responseFormat:'JSON_SCHEMA',outputSchema:{name:'source_search_fragments',version:'1',jsonSchema:{
        type:'object',additionalProperties:false,required:['samples'],properties:{samples:{type:'array',maxItems:23,items:{
          type:'object',additionalProperties:false,required:['id','field','fragment','start','end'],properties:{
            id:{type:'string'},field:{type:'string',enum:['name','address']},fragment:{type:'string'},start:{type:'integer'},end:{type:'integer'},
          },
        }}},
      }},
      timeoutMs:30000,fallback:'FAIL_CLOSED',maxOutputTokens:4096,temperature:0,thinking:'disabled'};
    const {entry}=charge('MODEL',{purpose:'QUERY_FRAGMENT',sourceCommit});modelCalls++;
    save(`${root}/retrieval-inputs/fragment.request.json`,{request,ledgerId:entry.id},true);
    const response=await DeepSeekModelGateway.fromEnvironment(process.env).complete(request);
    save(`${root}/retrieval-inputs/fragment.response.json`,response,true);
    let samples=[];try{samples=JSON.parse(response.outputText).samples??[];}catch{/* Invalid proposal never becomes a query. */}
    const decisions=[];
    for(const s of fragmentSubjects){
      const rows=Array.isArray(samples)?samples.filter(r=>r.id===s.id):[];const valid=rows.length===1&&fragmentValid(s.subject,rows[0]);
      decisions.push({id:s.id,status:valid?'VERIFIED_FRAGMENT':'INVALID_FRAGMENT',proposal:rows});
      if(valid)accepted.set(s.id,{query:rows[0].fragment,provenance:{kind:'GOOGLE_ORIGINAL_FRAGMENT',field:rows[0].field,start:rows[0].start,end:rows[0].end}});
    }
    save(`${root}/retrieval-inputs/fragment.validation.json`,{decisions,additionalRetries:0},true);
    let current;
    const agent=process.env.PRAXIS_GOOGLE_API_PROXY_SERVER?.trim()?new ProxyAgent(process.env.PRAXIS_GOOGLE_API_PROXY_SERVER):undefined;
    const google=new GooglePlacesClient({apiKey:process.env.GOOGLE_MAPS_API_KEY,fetchImplementation:async(url,init)=>{
      verify();const u=new URL(String(url));assert.equal(u.origin,'https://places.googleapis.com');assert.equal(init.method,'GET');
      assert.equal(u.pathname,`/v1/places/${encodeURIComponent(current.googlePlaceId.replace(/^places\//,''))}`);u.searchParams.set('languageCode','ja');
      const {entry,number}=charge('GOOGLE',{purpose:'JAPANESE_NAME_SAME_PLACE_ID',subjectId:current.id,sourceCommit});googleCalls++;
      save(`${root}/retrieval-inputs/google/${current.id}.started.json`,{atCET:cet(),ledgerId:entry.id,url:u.toString(),proxyConfigured:!!agent},true);
      const response=await fetch(u,{...init,redirect:'manual',...(agent?{dispatcher:agent}:{})});
      const bytes=safeBytes(Buffer.from(await response.clone().arrayBuffer()));
      writeFileSync(`${root}/retrieval-inputs/google/${current.id}.raw.json`,bytes,{flag:'wx'});
      save(`${root}/retrieval-inputs/google/${current.id}.meta.json`,{status:response.status,atCET:cet(),contentType:response.headers.get('content-type'),sha256:hash(bytes),ledgerId:entry.id},true);
      return response;
    }});
    for(const s of japaneseSubjects){
      current=s;verify();const response=await google.placeDetails(s.googlePlaceId,new AbortController().signal);
      const expected=s.googlePlaceId.replace(/^places\//,'');
      if(response.id!==expected)throw new Stop('S0_GOOGLE_PLACE_ID_MISMATCH',{subjectId:s.id});
      const name=response.displayName?.text;
      if(typeof name==='string'&&name.trim())accepted.set(s.id,{query:name,provenance:{kind:'GOOGLE_JAPANESE_RESPONSE',placeId:expected,languageCode:response.displayName?.languageCode??null,raw:`${root}/retrieval-inputs/google/${s.id}.raw.json`}});
      console.log(JSON.stringify({event:'google-name',id:s.id,status:typeof name==='string'?'RETURNED':'NO_NAME',requests:googleCalls}));
    }
    await agent?.close();verify();
  }catch(e){stop={code:e?.code??'INFRASTRUCTURE_RETRIEVAL_INPUT_FAILURE',type:e?.name??'UNKNOWN'};}
  const queries=[];
  for(const s of subjects){
    if(s.cohort==='NEW_PRIMARY')queries.push({subjectId:s.id,cohort:s.cohort,variant:'ORIGINAL',query:s.subject.name,provenance:{kind:'GOOGLE_ORIGINAL_NAME'}});
    const alternate=accepted.get(s.id);
    queries.push({subjectId:s.id,cohort:s.cohort,variant:s.variant,...(alternate??{}),status:!alternate?'SKIPPED_INVALID_OR_MISSING':alternate.query.normalize('NFKC').trim().toLowerCase()===s.subject.name.normalize('NFKC').trim().toLowerCase()?'SKIPPED_IDENTICAL':'READY'});
  }
  assert.equal(queries.length,31);
  save(`${root}/queries.materialized.json`,{schema:'phase3b-materialized-searches@1',status:stop?'STOPPED':'PREPARED',queries,sourceCommit},true);
  save(`${root}/retrieval-inputs/summary.json`,{status:stop?'STOPPED':'COMPLETED',sourceCommit,finishedAtCET:cet(),modelCalls,googleCalls,ready:queries.filter(r=>r.variant==='ORIGINAL'||r.status==='READY').length,stop},true);
  console.log(JSON.stringify({status:stop?'STOPPED':'COMPLETED',modelCalls,googleCalls,stop}));
}
if(process.argv.includes('--execute'))await execute();else throw Error('Choose --execute');
