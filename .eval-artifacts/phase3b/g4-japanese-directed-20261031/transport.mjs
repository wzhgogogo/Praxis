import {performance} from 'node:perf_hooks';
export const DEADLINE_MS=20_000, MINIMUM_GAP_MS=30_000, USER_AGENT='Praxis-G4-Directed-Evidence/1.0';
export const cet=()=>new Date(Date.now()+3_600_000).toISOString().replace('Z','+01:00');
export function permittedURL(kind,value,googleURL){
 let u;try{u=new URL(value);}catch{return false;}
 if(u.protocol!=='https:'||u.username||u.password||u.port||u.hash)return false;
 if(kind==='GOOGLE')return value===googleURL;
 if(u.origin!=='https://tabelog.com')return false;
 if(kind==='ROBOTS')return value==='https://tabelog.com/robots.txt';
 if(kind==='SEARCH')return u.pathname==='/en/tokyo/rstLst/'&&[...u.searchParams.keys()].join(',')==='sw'&&u.searchParams.getAll('sw').length===1&&!!u.searchParams.get('sw');
 return kind==='DETAIL'&&/^\/en\/[a-z-]+\/A\d+\/A\d+\/\d+\/$/.test(u.pathname)&&!u.search;
}
export function robotsDecision(text,value,agent=USER_AGENT){
 const groups=[];let group,hasRules=false;
 for(const line of text.replace(/^\uFEFF/,'').split(/\r?\n/)){
  const clean=line.split('#')[0].trim(),m=clean.match(/^([^:]+):\s*(.*)$/);if(!m)continue;
  const key=m[1].trim().toLowerCase(),v=m[2].trim();
  if(key==='user-agent'){
   if(!group||hasRules){group={agents:[],rules:[],delay:0};groups.push(group);hasRules=false;}
   group.agents.push(v.toLowerCase());
  }else if(group){hasRules=true;if((key==='allow'||key==='disallow')&&v)group.rules.push({allow:key==='allow',pattern:v});
   if(key==='crawl-delay'&&/^\d+(?:\.\d+)?$/.test(v))group.delay=Math.max(group.delay,Number(v)*1000);
  }
 }
 if(!groups.length)throw Object.assign(Error('ROBOTS_UNRECOGNIZED'),{code:'ROBOTS_UNRECOGNIZED'});
 const rank=g=>Math.max(-1,...g.agents.map(a=>a==='*'?0:agent.toLowerCase().includes(a)?a.length:-1));
 const best=Math.max(...groups.map(rank));const selected=groups.filter(g=>rank(g)===best&&best>=0);
 const u=new URL(value),path=u.pathname+u.search,matches=[];
 for(const g of selected)for(const rule of g.rules){
  const anchored=rule.pattern.endsWith('$'),body=anchored?rule.pattern.slice(0,-1):rule.pattern;
  const regex='^'+body.split('*').map(p=>p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*')+(anchored?'$':'');
  if(new RegExp(regex).test(path))matches.push({...rule,specificity:body.replaceAll('*','').length});
 }
 matches.sort((a,b)=>b.specificity-a.specificity||Number(b.allow)-Number(a.allow));
 return {allowed:matches[0]?.allow??true,matchedRule:matches[0]??null,agent,selectedAgents:selected.flatMap(g=>g.agents),minimumGapMs:Math.max(MINIMUM_GAP_MS,...selected.map(g=>g.delay))};
}
export function underlyingCodes(error){
 const out=new Set(),seen=new Set();
 function visit(e,depth){if(!e||depth>5||seen.has(e))return;seen.add(e);
  if(typeof e.code==='string'&&/^[A-Z][A-Z0-9_]{1,70}$/.test(e.code))out.add(e.code);
  if(typeof e.code==='number'&&Number.isInteger(e.code))out.add('DOM_CODE_'+e.code);
  visit(e.cause,depth+1);if(Array.isArray(e.errors))e.errors.slice(0,8).forEach(x=>visit(x,depth+1));
 }visit(error,0);return [...out];
}
export async function timedGet(url,{fetchImplementation,headers,dispatcher,signal,onHeaders,timeoutMs=DEADLINE_MS}){
 const controller=new AbortController(),startedAtCET=cet(),start=performance.now(),chunks=[];
 let response,headersAtCET=null,bodyCompletedAtCET=null,headerMs=null,error=null,expired=false;
 const relay=()=>controller.abort(signal.reason);if(signal?.aborted)relay();else signal?.addEventListener('abort',relay,{once:true});
 let timer;
 const expiry=new Promise((_,reject)=>{timer=setTimeout(()=>{expired=true;controller.abort();reject(Object.assign(Error('DEADLINE_EXCEEDED'),{code:'DEADLINE_EXCEEDED'}));},timeoutMs);});
 try{await Promise.race([(async()=>{
  response=await fetchImplementation(url,{method:'GET',redirect:'manual',credentials:'omit',headers,signal:controller.signal,...(dispatcher?{dispatcher}:{} )});
  headersAtCET=cet();headerMs=performance.now()-start;onHeaders?.({status:response.status,headersAtCET});
  if(response.status===429){await response.body?.cancel();return;}
  if(response.body){const reader=response.body.getReader();for(;;){const part=await reader.read();if(part.done)break;chunks.push(Buffer.from(part.value));}}
  bodyCompletedAtCET=cet();
 })(),expiry]);}catch(e){error=e;}finally{clearTimeout(timer);signal?.removeEventListener('abort',relay);}
 const end=performance.now(),bytes=Buffer.concat(chunks),safeHeaders={};
 if(response)for(const name of ['content-type','content-encoding','last-modified','date','retry-after'])safeHeaders[name]=response.headers.get(name);
 const location=response?.headers.get('location');if(location){try{const u=new URL(location,url);safeHeaders.locationSanitized=u.origin+u.pathname;safeHeaders.locationHadQuery=!!u.search;}catch{safeHeaders.locationSanitized='<invalid>';}}
 const name=['Error','TypeError','TimeoutError','AbortError','AggregateError'].includes(error?.name)?error.name:'Error';
 return {bytes,complete:!!bodyCompletedAtCET,meta:{url,method:'GET',redirect:'manual',cookie:false,retries:0,timeoutMs,startedAtCET,headersAtCET,bodyCompletedAtCET,finishedAtCET:cet(),
  status:response?.status??null,responseHeaders:safeHeaders,headersMs:headerMs===null?null:Math.round(headerMs),bodyMs:headerMs===null?null:Math.round(end-start-headerMs),elapsedMs:Math.round(end-start),bytesReceived:bytes.length,
  bodyRepresentation:'FETCH_DECODED_HTTP_BODY_UNMODIFIED_BYTES',networkFailure:error?{reason:expired?'DEADLINE_EXCEEDED':'NETWORK_FAILED',phase:headersAtCET?'BODY':'BEFORE_HEADERS',name,underlyingCodes:underlyingCodes(error)}:null}};
}
