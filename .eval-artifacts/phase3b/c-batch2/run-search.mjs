import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {root,load,save,cet,verify,charge,start,Stop,hash,safeBytes} from './controlled-io.mjs';

async function execute(){
  const sourceCommit=start('search');
  for(const row of load(`${root}/search-freeze.json`).files){
    const {readFileSync}=await import('node:fs');assert.equal(hash(readFileSync(row.path)),row.sha256);
  }
  const input=load(`${root}/queries.materialized.json`),config=load(`${root}/config.json`);assert.equal(input.status,'PREPARED');
  let lastFinished=0,requests=0,stop;const results=[];
  try{
    for(let i=0;i<input.queries.length;i++){
      const q=input.queries[i];
      if(q.status?.startsWith('SKIPPED')){results.push({...q,status:q.status});continue;}
      assert.equal(typeof q.query,'string');
      if(lastFinished){const remaining=lastFinished+config.sourceIntervalMs-Date.now();if(remaining>0)await new Promise(r=>setTimeout(r,remaining));}
      verify();if(requests>=31)throw new Stop('SEARCH_PLAN_EXHAUSTED');
      const url=new URL(config.websitePath,config.websiteOrigin);url.searchParams.set('sw',q.query);
      assert.equal(url.origin,'https://tabelog.com');assert.equal(url.pathname,'/en/tokyo/rstLst/');assert.deepEqual([...url.searchParams.keys()],['sw']);
      const {entry}=charge('GET',{purpose:'SOURCE_QUERY_COMPARISON',subjectId:q.subjectId,variant:q.variant,sourceCommit});requests++;
      const path=`${root}/search/${String(i+1).padStart(3,'0')}-${q.subjectId}`;const began=Date.now();
      save(path+'.started.json',{atCET:cet(),url:url.toString(),method:'GET',cookie:false,redirect:'manual',retries:0,ua:'Node default, not overridden',ledgerId:entry.id},true);
      let row;
      try{
        const response=await fetch(url,{method:'GET',redirect:'manual',credentials:'omit',headers:{'Accept-Encoding':'identity'},signal:AbortSignal.timeout(config.sourceTimeoutMs)});
        const bytes=safeBytes(Buffer.from(await response.arrayBuffer()));writeFileSync(path+'.body.html',bytes,{flag:'wx'});
        row={...q,status:'FETCHED',httpStatus:response.status,contentType:response.headers.get('content-type'),contentEncoding:response.headers.get('content-encoding'),location:response.headers.get('location'),
          responseBody:'HTTP body bytes returned by fetch; transfer/content decoding performed by runtime',sha256:hash(bytes),bodyPath:path+'.body.html',elapsedMs:Date.now()-began,finishedAtCET:cet(),ledgerId:entry.id};
        const text=bytes.toString('utf8'),visible=text.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ');
        if(response.status>=300)throw new Stop('SOURCE_HTTP_OR_REDIRECT_STOP',{status:response.status});
        if(response.status<200||/現在アクセスが集中|verify you are human|unusual traffic|robot check|access denied|just a moment|ロボットではない|不正なアクセス/i.test(visible))throw new Stop('SOURCE_BUSY_OR_CHALLENGE');
        if(!/text\/html/i.test(row.contentType??''))throw new Stop('SOURCE_STRUCTURE_CHANGED_CONTENT_TYPE');
      }catch(e){row??={...q,status:'NOT_FETCHED',elapsedMs:Date.now()-began,ledgerId:entry.id};row.failure={code:e?.code??(e?.name==='TimeoutError'?'SOURCE_TIMEOUT':'SOURCE_NETWORK_FAILED'),detail:e?.detail??{type:e?.name??'UNKNOWN'}};throw e;}
      finally{lastFinished=Date.now();if(row){save(path+'.result.json',row,true);results.push(row);console.log(JSON.stringify({event:'public-get',id:q.subjectId,variant:q.variant,httpStatus:row.httpStatus,elapsedMs:row.elapsedMs,requests,failure:row.failure}));}}
    }
  }catch(e){stop={code:e?.code??'SOURCE_NETWORK_FAILED',detail:e?.detail??{type:e?.name??'UNKNOWN'}};}
  save(`${root}/search/execution.json`,{status:stop?'STOPPED':'COMPLETED',sourceCommit,finishedAtCET:cet(),sourceRequests:requests,planned:31,results,stop},true);
  console.log(JSON.stringify({status:stop?'STOPPED':'COMPLETED',sourceRequests:requests,stop}));
}
if(process.argv.includes('--execute'))await execute();else throw Error('Choose --execute');
