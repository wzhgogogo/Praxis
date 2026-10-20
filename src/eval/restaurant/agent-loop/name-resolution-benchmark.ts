/** Exposed name-resolution benchmark. No provider setup, secrets or live runner. */
export type NameResolutionPlatform = 'TABELOG' | 'TABLECHECK';
export interface NameResolutionSubject { name:string; address:string; phone:string; coordinates:{lat:number;lng:number}; }
export interface NameResolutionSample {
 id:string;role:'GOLD'|'CONTROL';platform:NameResolutionPlatform;subject:NameResolutionSubject;
 groups:{areas:string[];nameShapes:string[];linkKind?:string};expected?:{outletId:string;sourceUrl:string};
 provenance:Array<{path:string;sha256:string;record:number;candidate:number;googlePlaceId:string;website?:string}>;
}
/** Deliberately independent of production URL parsers: outlet-ID oracle. */
export function benchmarkOutlet(value:string):{platform:NameResolutionPlatform;outletId:string}|undefined {
 try {
  const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)return undefined;
  if(u.hostname==='tabelog.com'){
   const m=u.pathname.match(/^\/(?:en\/)?[^/]+\/A\d+\/A\d+\/(\d+)(?:\/[^/]+)*\/?$/);
   return m?{platform:'TABELOG',outletId:m[1]!}:undefined;
  }
  if(u.hostname==='www.tablecheck.com'||u.hostname==='tablecheck.com'){
   const m=u.pathname.match(/^\/(?:en|ja)\/(?:shops\/([^/]+)\/reserve|([^/]+)(?:\/reserve(?:\/landing)?)?)\/?$/);
   const id=m?.[1]??m?.[2];return id&&!['japan','shops','login','search'].includes(id)?{platform:'TABLECHECK',outletId:id}:undefined;
  }
 }catch{/* Invalid URLs provide no Gold. */}
 return undefined;
}
export function benchmarkNameShapes(name:string):string[]{
 const shapes:string[]=[];
 if(/^[\x20-\x7e]+$/.test(name)&&/[A-Za-z]/.test(name))shapes.push('ENGLISH');
 if(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(name))shapes.push('JAPANESE');
 if(/[（(][^）)]+[）)]|\b(?:branch|store|ten)\b|店/u.test(name))shapes.push('BRANCH_SUFFIX');
 if(/\b(?:sushi|restaurant)\b/i.test(name))shapes.push('GENERIC_TERM');
 return shapes.length?shapes:['OTHER'];
}
/** Whitelist projection; URL/ID/provenance/Gold never cross into the method. */
export function nameResolutionInput(sample:NameResolutionSample):NameResolutionSubject {
 return {name:sample.subject.name,address:sample.subject.address,phone:sample.subject.phone,
  coordinates:{lat:sample.subject.coordinates.lat,lng:sample.subject.coordinates.lng}};
}
export interface NameResolutionObservation {
 sampleId:string;method:'A'|'B';platform:NameResolutionPlatform;
 accepted:boolean;returnedUrl?:string;rawSelectedPageUrl?:string;identityRecorded:boolean;
 observedOutletUrls:string[];searchCompleted:boolean;failure?:string;elapsedMs:number;modelCalls:number;
}
export function nameResolutionFailureCategory(result:NameResolutionObservation){
 const reason=result.failure??'';
 if(/SOURCE_BUSY|503|RATE_LIMIT/.test(reason))return 'BUSY_OR_RATE_LIMIT';
 if(/TIMEOUT/.test(reason))return 'TIMEOUT';
 if(/BENCHMARK_FORM_BOUNDARY/.test(reason))return 'READ_BOUNDARY';
 if(/AMBIGUOUS|MULTIPLE/.test(reason))return 'AMBIGUOUS_RESULTS';
 if(/NAME_ONLY|PARTIAL/.test(reason))return 'PARTIAL_NAME_OR_MISSING_ADDRESS_PHONE';
 if(/MODEL/.test(reason))return 'MODEL_FAILURE';
 if(/OTHER_PAGE|REDIRECT/.test(reason))return 'OTHER_PAGE';
 if(result.searchCompleted&&!result.observedOutletUrls.length)return 'ZERO_RESULTS';
 return result.accepted?'NONE':'UNCLASSIFIED';
}
export type NameResolutionVerdict = 'CORRECT'|'WRONG_ACCEPTED'|'UNCERTAIN'|'NOT_FOUND'|'ENV_FAILURE'|'NOT_EVALUATED'|'REVIEW_REQUIRED';
export function evaluateNameResolution(sample:NameResolutionSample,result:NameResolutionObservation){
 let verdict:NameResolutionVerdict='NOT_EVALUATED';let reason='Missing identity or selected raw page evidence';
 const returned=result.returnedUrl?benchmarkOutlet(result.returnedUrl):undefined;
 const raw=result.rawSelectedPageUrl?benchmarkOutlet(result.rawSelectedPageUrl):undefined;
 if(result.sampleId!==sample.id||result.platform!==sample.platform)throw Error('Benchmark sample/observation mismatch');
 if(result.accepted&&returned&&raw&&result.identityRecorded){
  if(returned.platform!==raw.platform||returned.outletId!==raw.outletId){verdict='WRONG_ACCEPTED';reason='Claimed outlet differs from selected raw page';}
  else if(!sample.expected){verdict='REVIEW_REQUIRED';reason='Control has no independently reviewed Gold';}
  else if(returned.platform===sample.platform&&returned.outletId===sample.expected.outletId){verdict='CORRECT';reason='Independent URL ID equals Gold and production identity accepted';}
  else{verdict='WRONG_ACCEPTED';reason='Accepted another outlet ID';}
 }else if(!result.accepted){
  if(/SOURCE_BUSY|503|RATE_LIMIT|TIMEOUT|BROWSER_TIMEOUT/.test(result.failure??'')){verdict='ENV_FAILURE';reason=result.failure!;}
  else if(result.searchCompleted&&sample.expected&&!result.observedOutletUrls.some(url=>{const x=benchmarkOutlet(url);return x?.platform===sample.platform&&x.outletId===sample.expected!.outletId;})){verdict='NOT_FOUND';reason='Gold absent from this bounded search result';}
  else if(result.observedOutletUrls.length){verdict='UNCERTAIN';reason=result.failure??'Identity rejected or insufficient';}
  else if(result.searchCompleted){verdict='NOT_FOUND';reason='No outlet found within the recorded search';}
 }
 return {sampleId:sample.id,verdict,reason,stopBatch:verdict==='WRONG_ACCEPTED',severity:verdict==='WRONG_ACCEPTED'?'S0':undefined,
  failureCategory:nameResolutionFailureCategory(result),goldScorable:sample.role==='GOLD'&&verdict!=='NOT_EVALUATED',elapsedMs:result.elapsedMs,modelCalls:result.modelCalls};
}
export function summarizeNameResolution(samples:NameResolutionSample[],results:NameResolutionObservation[]){
 const seen=new Set<string>();
 const rows=results.map(result=>{
  const key=result.method+':'+result.sampleId;if(seen.has(key))throw Error('Duplicate benchmark run');seen.add(key);
  const sample=samples.find(s=>s.id===result.sampleId);if(!sample)throw Error('Unknown benchmark sample');
  return {...evaluateNameResolution(sample,result),method:result.method,role:sample.role,groups:sample.groups};
 });
 const summary=(subset:typeof rows)=>{
  const gold=subset.filter(r=>r.role==='GOLD');const denominator=gold.filter(r=>r.goldScorable).length;
  const count=(v:NameResolutionVerdict)=>gold.filter(r=>r.verdict===v).length;
  const times=subset.map(r=>r.elapsedMs).sort((a,b)=>a-b);const n=times.length;
  return {failureCategories:Object.fromEntries([...new Set(subset.map(r=>r.failureCategory))].map(category=>[category,subset.filter(r=>r.failureCategory===category).length])),started:subset.length,goldStarted:gold.length,goldEvaluated:denominator,controls:subset.length-gold.length,
   correct:count('CORRECT'),wrongAccepted:count('WRONG_ACCEPTED'),uncertain:count('UNCERTAIN'),notFound:count('NOT_FOUND'),environment:count('ENV_FAILURE'),notEvaluated:count('NOT_EVALUATED'),
   correctRate:denominator?count('CORRECT')/denominator:null,wrongRate:denominator?count('WRONG_ACCEPTED')/denominator:null,
   uncertainRate:denominator?(count('UNCERTAIN')+count('ENV_FAILURE'))/denominator:null,notFoundRate:denominator?count('NOT_FOUND')/denominator:null,
   medianMs:n?(n%2?times[(n-1)/2]!:(times[n/2-1]!+times[n/2]!)/2):null,maxMs:n?times[n-1]!:null,modelCalls:subset.reduce((s,r)=>s+r.modelCalls,0)};
 };
 return {planned:samples.length,rows,stopBatch:rows.some(r=>r.stopBatch),methods:(['A','B'] as const).map(method=>{
  const part=rows.filter(r=>r.method===method);
  return {method,...summary(part),areas:[...new Set(samples.flatMap(s=>s.groups.areas))].map(area=>({area,...summary(part.filter(r=>r.groups.areas.includes(area)))})),
   nameShapes:[...new Set(samples.flatMap(s=>s.groups.nameShapes))].map(shape=>({shape,...summary(part.filter(r=>r.groups.nameShapes.includes(shape)))}))};
 })};
}
