import {bookingTermsComposition} from '../../../src/application/fixtures/booking-terms-composition.js';
import {readFile} from 'node:fs/promises';
const f=await bookingTermsComposition({namedWithoutArea:{outputText:await readFile('src/application/fixtures/named-outlet-without-area/d3-semantic.original.json','utf8'),sourceNames:{google:JSON.parse(await readFile('src/application/fixtures/named-outlet-without-area/d1-google-place.json','utf8'))}}});
try{const v=await f.initial();console.log('phase',v.case.phase);const a:any=await f.artifact();
for(const r of f.requests){if(r.request.purpose==='browser_read_decide'){const m=r.request.messages.find((x:any)=>x.role==='user');const i=JSON.parse(m.content);console.log(JSON.stringify({source:i.source,stage:i.stage,progress:i.progress,history:i.history,out:r.response.outputText,inputs:i.observation.targets.filter((t:any)=>t.kind==='INPUT').map((t:any)=>({label:t.label,value:t.value,actions:t.availableActions}))}));}}
console.log(JSON.stringify(a.execution.trajectories.map((t:any)=>({obs:t.observation,meta:t.executionMetadata}))));
}finally{await f.close();}
