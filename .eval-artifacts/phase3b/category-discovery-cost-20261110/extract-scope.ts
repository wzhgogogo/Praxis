// Project real decision observation only; snapshot5 DOM was UNSAFE_DOCUMENT.
// No reconstructed page/response is presented as a recording.
import {readFile,writeFile} from 'node:fs/promises';
const path='.eval-artifacts/phase3b/discovery-progress-20261110/runtime-namespaced/D01/D01/execution.decisions.jsonl';
const decision=(await readFile(path,'utf8')).trim().split('\n').map(x=>JSON.parse(x)).find(d=>d.sequence===8);
const input=JSON.parse(decision.messages.find((m:any)=>m.role==='user').content);
await writeFile('src/integrations/restaurant-search/fixtures/d01-discovery-scope.json',JSON.stringify({mode:'RECORDED_DECISION_COMPONENT',sourcePath:path,sequence:8,originalAction:JSON.parse(decision.outputText),observation:input.observation,limitation:'Original snapshot5 DOM omitted as UNSAFE_DOCUMENT; component uses recorded visible controls, with local session envelope.'},null,2));
