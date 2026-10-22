import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const dir='.eval-artifacts/checkpoint-c-live-20261020/budget-condition-20261022';
const previous='.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/evaluation-20261022';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p));
const put=async(p,v)=>fs.writeFile(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const source=await read(`${previous}/inputs.json`),runs=[];
for(const runId of ['h-02','h-08','h-14']){
 const input=source.runs.find(r=>r.run.runId===runId);assert.ok(input);
 assert.equal(sha(await fs.readFile(input.originalArtifactPath)),input.originalArtifactSha256);
 assert.equal(sha(await fs.readFile(input.evaluationArtifactPath)),input.evaluationArtifactSha256);
 const oraclePath=`${previous}/evaluations-33/${runId}.evaluation.json`;
 runs.push({...input,oraclePath,oracleSha256:sha(await fs.readFile(oraclePath))});
}
await put(`${dir}/inputs.json`,{schema:'budget-condition-replay-inputs@1',status:'frozen regression; exposed holdout used for requested repair, not Clean',
 baseBranch:'codex/chore-checkpoint-c-prep',baseCommit:'17415d1cc1fad5c5da7729de125f4581e0251cb1',previousEvaluation:previous,
 rule:'Replay saved events through current Router and Reducer. No new source reads, price parsing, model output or source evidence. Only presentation changes. Reuse previously approved structured-budget evaluation representation; no new semantic pairs.',runs});
const diagnosis=[];
for(const runId of ['h-05','h-11','h-17']){
 const input=source.runs.find(r=>r.run.runId===runId),bytes=await fs.readFile(input.originalArtifactPath);assert.equal(sha(bytes),input.originalArtifactSha256);
 const artifact=JSON.parse(bytes),decisionBytes=await fs.readFile(artifact.decisionCapture.path);assert.equal(sha(decisionBytes),artifact.decisionCapture.sha256);
 const decisions=decisionBytes.toString().trim().split('\n').map(JSON.parse),decision=decisions.find(d=>d.purpose==='restaurant_semantic_interpret');assert.ok(decision);
 const output=JSON.parse(decision.outputText),index=output.facts.findIndex(f=>f.field==='CRITERION'&&/6,000/.test(f.value.text)),value=output.facts[index].value;
 assert.deepEqual(artifact.semantic.proposal,output);assert.equal(value.strength,'SOFT');
 assert.equal(output.facts.some(f=>f.field==='BUDGET_PER_PERSON'),false);
 const compiled=artifact.finalSnapshot.domainState.intentDraft.criteria.find(c=>/6,000/.test(c.text));
 assert.equal(compiled.text,value.text);assert.equal(compiled.strength,value.strength);
 const user=decision.messages.find(m=>m.role==='user').content,system=decision.messages.find(m=>m.role==='system').content;
 assert.ok(user.includes('Ideally under 6,000 yen per person'));
 diagnosis.push({runId,artifactPath:input.originalArtifactPath,artifactSha256:input.originalArtifactSha256,
  decisionsPath:path.relative(process.cwd(),artifact.decisionCapture.path),decisionsSha256:sha(decisionBytes),sequence:decision.sequence,
  promptVersion:decision.promptVersion,systemPromptSha256:sha(system),userMessageSha256:sha(user),
  inputBudgetQuote:'Ideally under 6,000 yen per person',proposalPointer:`/semantic/proposal/facts/${index}/value`,proposalValue:value,
  compiledPointer:'/finalSnapshot/domainState/intentDraft/criteria/1',compiledValue:compiled,
  outcome:decision.outcome,finishReason:decision.finishReason,temperature:decision.temperature,latencyMs:decision.latencyMs,
  finding:'Model output already contains this wording; deterministic compilation preserved it. No BUDGET_PER_PERSON hard cap was emitted.'});
}
assert.equal(new Set(diagnosis.map(d=>d.userMessageSha256)).size,1,'Same user input in all three observations');
const savedSystems=[];
for(const runId of ['h-05','h-11','h-17']){
 const row=source.runs.find(r=>r.run.runId===runId),a=await read(row.originalArtifactPath);
 const ds=(await fs.readFile(a.decisionCapture.path,'utf8')).trim().split('\n').map(JSON.parse);
 const sys=ds.find(d=>d.purpose==='restaurant_semantic_interpret').messages.find(m=>m.role==='system').content;
 // Reference time is expected to vary. Keep full hashes and compare stable text separately.
 savedSystems.push(sys.replace(/2026-10-22T[\d:.]+Z/g,'<REFERENCE_TIME>'));
}
await put(`${dir}/h11-diagnosis.json`,{schema:'budget-wording-diagnosis@1',status:'report only; semantic Prompt and saved proposal unchanged',
 confirmedCause:'The semantic model introduced around before the Compiler. Same user message, same Prompt version; h05/h17 retained under. Strength remained SOFT, while the numerical operator changed.',
 stableSystemTextEqualAfterTimestampRemoval:new Set(savedSystems).size===1,
 hypothesis:'The Prompt scopes ideally as SOFT and tells the model to preserve amount/per-person, but does not explicitly require preserving the numeric comparison operator. The recorded output demonstrates a semantic deviation; model internal reasoning is not observable.',
 suggestion:'In a separately reviewed semantic Prompt change, explicitly separate condition strength from comparison direction: ideally under X stays SOFT and under X; only approximate/around wording gets the approved 20% tolerance. Add fixed-input under/around regressions before any model validation.',
 policy:{path:'src/domains/restaurant/condition-policy.json',sha256:sha(await fs.readFile('src/domains/restaurant/condition-policy.json')),aroundTolerance:0.2,softUpperLimit:6000,aroundUpperLimit:7200,rule:'Existing comparison policy; no strict-under boundary or tax conversion change.'},diagnosis,newModels:0,newWebsites:0,newLive:0});
console.log(JSON.stringify({inputs:runs.length,h11Diagnosed:true,newModels:0,newNetwork:0}));
