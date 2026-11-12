// Offline independent read of sanitized retained DOM/HAR; never navigates.
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';import {fileURLToPath} from 'node:url';import {createHash}from'node:crypto';import {parse}from'parse5';
const root=dirname(fileURLToPath(import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
const txt=n=>(n.value??'')+(n.childNodes??[]).map(txt).join('');
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
function nodes(n,p){return [...(p(n)?[n]:[]),...(n.childNodes??[]).flatMap(c=>nodes(c,p))];}
const clean=n=>txt(n).replace(/\s+/g,' ').trim();
const position=n=>({line:n.sourceCodeLocation?.startLine,column:n.sourceCodeLocation?.startCol});
const evidence=[];
for(const [run,index]of[['runtime-02',1],['runtime-02',5],['runtime-02',8],['runtime-02',10],['runtime-03',2],['runtime-03',4],['runtime-03',5]]){
 const file=join(root,run,'directory-probe',`snapshot-${String(index).padStart(4,'0')}.html`),bytes=readFileSync(file),doc=parse(bytes.toString(),{sourceCodeLocationInfo:true});
 const scopes=nodes(doc,n=>n.tagName==='a'&&clean(n).startsWith('Reservations available(')).map(n=>({quote:clean(n),...position(n)}));
 const headings=nodes(doc,n=>n.tagName==='h1'||n.tagName==='title').map(n=>({tag:n.tagName,quote:clean(n),...position(n)}));
 const breadcrumbs=nodes(doc,n=>n.tagName==='ol'&&/breadcrumb/.test(attr(n,'class')??'')).map(n=>({quote:clean(n),...position(n)}));
 const categoryLinks=nodes(doc,n=>n.tagName==='a'&&['Other','Robatayaki'].includes(clean(n))).map(n=>({quote:clean(n),href:attr(n,'href'),...position(n)}));
 const form=nodes(doc,n=>n.tagName==='form'&&nodes(n,c=>attr(c,'name')==='svps').length>0)[0];
 const fields=nodes(form??{},n=>['svd','svps','svt'].includes(attr(n,'name'))).map(n=>({name:attr(n,'name'),value:n.tagName==='select'?nodes(n,c=>c.tagName==='option'&&c.attrs?.some(a=>a.name==='selected')).map(c=>attr(c,'value')):attr(n,'value'),...position(n)}));
 const cards=nodes(doc,n=>(attr(n,'class')??'').split(/\s+/).includes('list-rst')).map(n=>({sourceEntityId:attr(n,'data-rst-id'),heading:nodes(n,c=>c.tagName==='h3').map(clean),...position(n),dateAndParty:clean(n).match(/December 10, 2026 \(Thu\)\s+8 people/)?.[0],times:nodes(n,c=>['a','span'].includes(c.tagName)&&/^\d{1,2}:\d{2}\s*[AP]M$/.test(clean(c))).map(c=>({label:clean(c),tag:c.tagName,attributes:c.attrs,...position(c)}))}));
 evidence.push({run,index,file,sha256:sha(bytes),headings,breadcrumbs,scopes,fields,categoryLinks,cards});
}
const final=evidence.at(-1);if(!final.headings.some(x=>x.quote==='Best Robatayaki in Nakano'))throw Error('EXACT_SCOPE_MISSING');
if(!final.scopes.some(x=>x.quote.includes('December 10, 2026 (Thu)')&&x.quote.includes('8 people 8:30 PM')))throw Error('SOURCE_FILTER_SUMMARY_MISSING');
if(final.cards.length!==1||final.cards[0].sourceEntityId!=='13309182')throw Error('FINAL_LIST_CHANGED');
if(!final.cards[0].times.some(x=>x.label==='8:30 PM'&&x.tag==='a'))throw Error('REQUESTED_LIST_TIME_MISSING');
const charged=[],responseMeta=[],omissions=[],scripted=[];let nonGETAborted=0;
for(const run of ['runtime','runtime-02','runtime-03']){
 const events=JSON.parse(readFileSync(join(root,run,'probe-events.json')));for(const event of events){if(event.kind==='DOCUMENT_GET_CHARGED')charged.push({...event.detail,run});if(event.kind==='NON_GET_ABORTED')nonGETAborted++;if(event.kind==='NATIVE_SELECT_EXECUTOR')scripted.push({run,field:event.detail.field,status:event.detail.status,scriptedDecisions:event.detail.scriptedDecisionCount,realModelCalls:event.detail.realModelCalls});}
 const recording=JSON.parse(readFileSync(join(root,run,'directory-probe/recording.json')));for(const e of recording.entries){if(e.kind==='RESPONSE_CAPTURED'||e.kind==='RESPONSE_OMITTED')responseMeta.push({run,...e.detail});if(e.kind==='DOCUMENT_SANITIZATION'&&e.detail.reason!=='SANITIZED')omissions.push({run,...e.detail});}
}
for(const c of charged)c.response=responseMeta.find(r=>r.responseUrlSha256===sha(c.url)&&r.run===c.run)??null;
const ledger=JSON.parse(readFileSync(join(root,'active-budget-seed-probe-20261112.json')));if(charged.length!==8||ledger.cumulative.publicGET!==8||ledger.cumulative.realModelCalls!==0)throw Error('LEDGER_COUNTS_MISMATCH');
const output={mode:'OFFLINE_AUDIT_OF_LIVE_READ_ONLY_PROBE',evidence,chargedDocuments:charged,nativeSelectExistingExecutor:scripted,recorderOmissions:omissions,nonGETAborted,consumption:ledger.cumulative,note:'List UI only. No booking time clicked, no offer/identity/inventory acceptance produced. Initial submitted-list DOM omitted for unreviewed URL query shape; retained filtered category documents supply list evidence.'};
writeFileSync(join(root,'evidence-audit.json'),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify({status:'PASS',documentGET:charged.length,realModels:0,finalListCount:final.cards.length,finalTitle:final.headings,summary:final.scopes,nativeSelect:scripted,omissions}));
