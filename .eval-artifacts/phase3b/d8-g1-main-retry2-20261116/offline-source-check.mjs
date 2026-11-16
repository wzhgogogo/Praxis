import {readFile,writeFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {independentVisibleText,readIndependentSource} from '/private/tmp/praxis-premerge-scope-main-20261115/src/eval/restaurant/agent-loop/g6/source-document.ts';
const root=dirname(fileURLToPath(import.meta.url));
const slot=join(root,'d8/live/runtime/dev-d8-g1-main-retry2-20261116');
const input=JSON.parse(await readFile(join(slot,'evaluation.input.json'),'utf8'));
const recdir=join(slot,'recordings',input.runId);
const recording=JSON.parse(await readFile(join(recdir,'recording.json'),'utf8'));
const trace=JSON.parse(await readFile(join(slot,'browser-trace.json'),'utf8'));
const times=trace.events.filter(e=>e.kind==='SNAPSHOT').map(e=>e.at);
const frames=[];
for(const p of recording.pages){
 if(p.diagnostic.status!=='SAVED'||!p.url)continue;
 const file=join(recdir,p.diagnostic.file),html=await readFile(file,'utf8');
 const source=readIndependentSource({url:p.url,html});
 if(!source.identity||source.identity.sourceEntityId!=='nakamata-nodoguro-ginza')continue;
 frames.push({snapshot:p.snapshot,file,sha256:createHash('sha256').update(html).digest('hex'),at:times[p.snapshot-1],source,quotePresent:independentVisibleText(html).includes(input.answers[0].citations[0].text)});
}
const handoff=input.handoffs[0],u=new URL(handoff.url),d=input.delivered[0];
const supported=frames.filter(f=>f.source.widget?.date===d.date&&f.source.widget.partySize===d.partySize&&f.source.widget.slots.includes(d.time));
const b1={url:handoff.url,parametersMatchDelivered:u.searchParams.get('start_date')===d.date&&u.searchParams.get('start_time')===d.time&&u.searchParams.get('num_people')===String(d.partySize),sourceEntranceObserved:frames.some(f=>f.source.links.includes(u.origin+u.pathname)),sourceWidgetFrames:supported.map(f=>f.snapshot),exactQueryBearingHrefRetainedInSanitizedDOM:frames.some(f=>f.source.links.includes(handoff.url)),note:'Sanitization removes query-bearing DOM anchors. Parameter equality and source-owned reservation entrance are separate checks; no missing raw URL is fabricated.'};
const last=frames.at(-1),citation=input.answers[0].citations[0];
const result={mode:'OFFLINE_RECORDED_SOURCE_CHECK',live:0,websiteGET:0,modelCalls:0,sourceSHA:'dbc2d9c55bb9dd759a17551cbe9c11af6b1073b0',frames,b1,g1:{answer:input.answers[0].answer,quote:citation.text,literalQuoteInLastRecordedShopDOM:last?.quotePresent,recordedAt:last?.at,citationReadAt:citation.readAt,timestampDifferenceMs:Date.parse(citation.readAt)-Date.parse(last.at),humanMeaningReview:'The Japanese sentence explicitly says private rooms are provided. The English answer asserts private rooms and makes no additional availability or booking guarantee.',formalEvaluationUnchanged:true},limitations:['Focused offline source check; not a replacement full qualification evaluation.','Six unrelated/list-page qualification excerpts lack independent shop binding.','G1 citation exact-time oracle is not matched; original NOT_EVALUATED retained.','No new post-delivery network check was made.','Single diagnostic only; no stability/generalization claim.']};
if(!supported.length||!b1.parametersMatchDelivered||!b1.sourceEntranceObserved||!last.quotePresent)throw Error('Focused source check failed');
await writeFile(join(root,'offline-source-check.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({frames:frames.length,supportedFrames:b1.sourceWidgetFrames,b1,g1:result.g1}));
