import { readFileSync, writeFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { restaurantSemanticRegressionProposalFor } from "../../../src/eval/restaurant/semantic/stage-oracles.ts";
import { compileRestaurantSemanticProposal } from "../../../src/domains/restaurant/semantic-compiler.ts";
const out = ".eval-artifacts/phase3a-boundary/review-correction";
const run = JSON.parse(readFileSync(`${out}/execution.json`, "utf8"));
function diff(a,b,path="") {
  if (isDeepStrictEqual(a,b)) return [];
  if (a && b && typeof a==="object" && typeof b==="object" && !Array.isArray(a) && !Array.isArray(b)) return [...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(k=>diff(a[k],b[k],path?`${path}.${k}`:k));
  return [{path,...(a===undefined?{expectedAbsent:true}:{expected:a}),...(b===undefined?{actualAbsent:true}:{actual:b})}];
}
const noTarget = p => ({...p,facts:p.facts.filter(f=>f.field!=="TARGET").sort((a,b)=>a.field.localeCompare(b.field)||a.operation.localeCompare(b.operation))});
const noTargetPatch = p => {const {target,...rest}=p;return rest;};
const rows=run.rows.map(row=>{
  const expectedProposal=restaurantSemanticRegressionProposalFor(row.input.message);
  const expectedCompilation=compileRestaurantSemanticProposal(expectedProposal,{referenceTime:row.input.referenceTime,timezone:row.input.timezone});
  return {sessionId:row.sessionId,turnId:row.turnId,repetition:row.repetition,strictScore:row.evaluation.strictScore,
    expectedProposal,actualProposal:row.interpreted.proposal,expectedCompilation,actualCompilation:row.compilation,
    expectedGoldDraft:row.gold,actualDraft:row.actualDraft,
    nonTargetProposalRepresentationDifferences:diff(noTarget(expectedProposal),noTarget(row.interpreted.proposal)),
    nonTargetPatchDifferences:diff(noTargetPatch(expectedCompilation.patch),noTargetPatch(row.compilation.patch)),
    fullDraftDifferences:diff(row.gold,row.actualDraft),nonGoalRequestValueDifferences:row.evaluation.nonGoalDifferences};
});
writeFileSync(`${out}/strict-comparison.json`,JSON.stringify({schema:"phase3a-boundary-strict-comparison@1",sourceCommit:run.sourceCommit,scorerVersion:"4 unchanged",strictPass:0,strictFail:9,interpretation:"All raw Proposal/Patch/Draft diagnostics retained. Extra unannotated target/selectionScope, explicit party source, and relative date/raw time/materialization metadata differ; frozen request values and separately evaluated goal match. No old score is rewritten.",rows},null,2)+"\n");
console.log(JSON.stringify(rows.slice(0,3).map(r=>({turn:r.turnId,proposal:r.nonTargetProposalRepresentationDifferences,patch:r.nonTargetPatchDifferences})),null,2));
