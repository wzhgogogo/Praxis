// Offline evidence only: original recordings are read without modification.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname,join} from 'node:path';
import {tableCheckDiscoveryPack} from '../../../../src/integrations/restaurant-search/source-packs.js';
const root=resolve('.eval-artifacts/p2-1-discovery-20261016');
const sha=(file:string)=>createHash('sha256').update(readFileSync(file)).digest('hex');
const rows=[];
for(const [id,attempt] of [['p2-kf-h001-20261027',1],['p2-kf-h001-20261027',2],['p2-kagurazaka-kaiseki-20261029',1]] as const){
 const file=join(root,'checkpoint-b-20261019/runs',id,`attempt-${attempt}`,'recording',id,'recording.json');
 const recording=JSON.parse(readFileSync(file,'utf8'));
 const document=recording.documents.find((d:{url:string})=>d.url.includes('availability_mode='));
 const htmlFile=join(dirname(file),document.file),html=readFileSync(htmlFile,'utf8');
 const text=html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
 const fields=[...html.matchAll(/<button\b[^>]*data-testid="(Date Field|Guests Field)"[^>]*>([\s\S]*?)<\/button>/g)].map(m=>({field:m[1],label:m[2]!.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()}));
 const blocked=recording.entries.filter((e:{sequence:number;kind:string})=>e.sequence===document.snapshot&&e.kind==='NETWORK').flatMap((e:{detail:any[]})=>e.detail).filter((r:any)=>r.outcome==='BLOCKED'&&r.origin==='https://search-v4.production.ap-northeast-1.aws.tablecheck.net/'&&r.pathname==='/search/'&&r.queryKeys.includes('open_from')).map((r:any)=>({method:r.method,pathname:r.pathname,queryKeys:r.queryKeys}));
 rows.push({caseId:id,attempt,recording:file,recordingSha256:sha(file),snapshot:document.snapshot,html:htmlFile,htmlSha256:sha(htmlFile),url:document.url,selectedFieldLabels:fields,parsedCount:tableCheckDiscoveryPack.parseListing({url:document.url,html,text,title:'Map Search - Japan'}).outlets.length,sourceUnavailableText:text.includes('Search is unavailable right now. Please try again.'),quote:'Search is unavailable right now. Please try again.',blockedFilterRequestShapes:[...new Map(blocked.map((r:any)=>[JSON.stringify(r),r])).values()],responseStatus:'NOT_RECORDED',normalEmptyResult:false,visibilityLimit:'Text and buttons reconstructed from stored DOM; not a rendered CSS replay.'});
}
if(rows.some(r=>!r.sourceUnavailableText||r.parsedCount!==0||!r.blockedFilterRequestShapes.length))throw Error('Diagnosis evidence changed');
writeFileSync(new URL('tablecheck-diagnosis.json',import.meta.url),JSON.stringify({status:'SOURCE_FILTER_UNAVAILABLE_UNDER_REVIEWED_NETWORK_RULES',networkRequests:0,modelCalls:0,rows,decision:'Skip TableCheck search availability hints; retain unfiltered discovery. Do not infer no availability, or broaden the reviewed GET/OPTIONS shapes. The yearless selected date is a secondary confirmation gap, not an explanation for the missing cards.'},null,2)+'\n');
console.log('3/3 original filtered snapshots: unavailable error, 0 parsed cards, blocked open_from/open_until preflight; 0 network/model');
