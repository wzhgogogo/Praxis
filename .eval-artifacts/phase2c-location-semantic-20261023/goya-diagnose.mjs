import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {hasTabelogSelectedQuery,tabelogCapturedSlots} from '../../src/integrations/tabelog/tabelog-query-controls.ts';
import {tabelogAvailabilityCompletion} from '../../src/integrations/tabelog/tabelog-browser-availability.ts';
globalThis.fetch=()=>{throw Error('GOYA_OFFLINE_DIAGNOSIS_NO_NETWORK');};
const base='.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/exit-live',cid='tabelog:en/tokyo/A1307/A130702/13320164',sha=b=>createHash('sha256').update(b).digest('hex'),rows=[];
for(const id of ['h-05','h-11','h-17']){
 const runDir=`${base}/${id}-attempt-1`,files=await fs.readdir(`${runDir}/runner`),file=`${runDir}/runner/${files.find(p=>p.endsWith('.result.json'))}`,raw=await fs.readFile(file),data=JSON.parse(raw),trace=data.diagnostics.browserTrace;
 const start=trace.findIndex(e=>e.kind==='EXECUTOR_DIAGNOSTIC'&&e.detail.event==='CANDIDATE_STARTED'&&e.detail.candidateId===cid),end=trace.findIndex((e,i)=>i>start&&e.kind==='EXECUTOR_DIAGNOSTIC'&&e.detail.event==='CANDIDATE_STARTED'),segment=trace.slice(start,end<0?undefined:end),last=segment.filter(e=>e.kind==='SNAPSHOT').at(-1);
 const ordinal=trace.filter(e=>e.kind==='SNAPSHOT'&&e.sequence<=last.sequence).length;
 const recordingDir=path.dirname(file).replace(/\/runner$/,'')+'/recordings/'+(await fs.readdir(`${runDir}/recordings`))[0],manifest=JSON.parse(await fs.readFile(`${recordingDir}/recording.json`)),entries=manifest.entries.filter(e=>e.kind==='SNAPSHOT');
 assert.equal(entries[ordinal-1].detail.htmlSha256,last.detail.htmlSha256);
 const htmlPath=`${recordingDir}/snapshot-${String(ordinal).padStart(4,'0')}.html`,htmlBytes=await fs.readFile(htmlPath),responses=structuredClone(last.detail.responses??[]);
 // Recorder replaces a public URL string by its observed allowlisted fields.
 // Restore only that exact observed URL, never an inferred slot or request.
 for(const response of responses)for(const item of Object.values(response.body?.selection??{}))if(item.link){const u=new URL(item.link.pathname,item.link.origin);for(const[k,v]of Object.entries(item.link))if(!['origin','pathname'].includes(k))u.searchParams.set(k,v);item.url=u.href;delete item.link;}
 const snapshot={url:last.detail.url,title:last.detail.title,html:htmlBytes.toString(),text:'',settlement:'SETTLED',responses};
 const request={date:'2026-11-03',partySize:3,timeWindow:{earliest:'19:00',latest:'19:00'}};
 const selected=hasTabelogSelectedQuery(snapshot,request.date,request.partySize),parsed=tabelogCapturedSlots(snapshot,request.date,request.partySize),completion=tabelogAvailabilityCompletion(snapshot,request);
 const stock=responses.at(-1)?.body,selection=Object.values(stock?.selection??{}),invalid=selection.map((r,i)=>({i,time:r.time,url:r.url})).filter(r=>typeof r.time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time));
 rows.push({id,result:{path:file,sha256:sha(raw)},candidateId:cid,traceStart:segment[0].sequence,traceEnd:segment.at(-1).sequence,lastSnapshot:{traceSequence:last.sequence,ordinal,htmlPath,htmlSha256:sha(htmlBytes),originalRuntimeHtmlSha256:last.detail.htmlSha256},recordedQueryRegions:last.detail.queryRegions,selectedQuery:selected,parsed,completion,passiveResponses:responses,recordedRequest:request,responseSummary:{date:stock?.base_date,members:stock?.members,rows:selection.length,has19:selection.some(r=>r.time==='19:00'),firstNonClockRow:invalid[0],nonClockRows:invalid.length},limitation:'Recorded URL projection is mechanically rehydrated; missing time strings are not invented. Saved HTML visibility is markup-only, not current site visibility.'});
}
await fs.writeFile('.eval-artifacts/phase2c-location-semantic-20261023/goya-diagnosis.json',JSON.stringify({mode:'OFFLINE_SAVED_HTML_AND_PASSIVE_RESPONSE_DIAGNOSIS',rows,models:0,Google:0,websites:0},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(rows.map(r=>({id:r.id,selectedQuery:r.selectedQuery,parsed:r.parsed,complete:r.completion.complete,response:r.responseSummary}))));
