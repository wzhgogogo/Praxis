/** Offline sidecar only. Original D4 evaluation and raw files are never written. */
import assert from "node:assert/strict";
import { readFile,writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve,join } from "node:path";
import { evaluateG6 } from "../../../../src/eval/restaurant/agent-loop/g6/evaluator.js";
import { observedGoogleIdentities,observedQualificationEvidence } from "../../../../src/eval/restaurant/agent-loop/g6/qualification-evidence.js";
const out=resolve(".eval-artifacts/phase3b/g6-development-live/d6-turn-budgets"),root=resolve(".eval-artifacts/phase3b/g6-development-live/d4-d6-safety-only");
const hash=(b:Buffer|string)=>createHash("sha256").update(b).digest("hex");
for(const f of JSON.parse(await readFile(join(out,"historical-inputs-sha256.json"),"utf8")).files)assert.equal(hash(await readFile(f.path)),f.sha256);
const load=async(p:string)=>JSON.parse(await readFile(p,"utf8"));
const input=await load(join(root,"runs/D4/evaluation.input.json")),run=await load(join(root,"runs/D4/execution.result.json"));
const review=await load(join(root,"qualification-review-input.json")),observation=review.merchantQuoteObservations[0],html=await readFile(observation.path,"utf8");
assert.equal(hash(html),observation.sha256);assert.ok(html.includes(observation.quote));
const har=await load(review.HAR),google=har.log.entries[85];assert.equal(hash(await readFile(review.HAR)),review.HARSHA256);
// The prior saved visible-excerpt audit was independently confirmed by the
// reviewer/user. This is an exposed read-only reconstruction, not web replay.
const proof=observedQualificationEvidence(run.view,input.runId,[{ref:observation.path,page:{url:"https://www.1bangai.org/daioh",title:review.name,text:observation.quote,html},at:"2026-11-02T16:27:22.319Z"}],observedGoogleIdentities(google.response.content.text,review.HAR+"#entry85"));
input.pages=proof.pages;input.qualificationClaims=proof.claims;
const score=evaluateG6(input);
assert.equal(score.checks.find(c=>c.rule==="B1_SOURCE_URL")?.status,"PASS");
assert.equal(score.checks.find(c=>c.rule==="COMPLETE_REQUEST_QUALIFICATION")?.status,"QUOTE_VERIFIED_MEANING_PENDING_REVIEW");
assert.equal(score.verdict.s0Status,"PASS");assert.equal(score.verdict.stopBatch,false);assert.equal(score.verdict.qualified,null);
await writeFile(join(out,"D4-recheck.input.json"),JSON.stringify(input,null,2)+"\n",{flag:"wx"});
await writeFile(join(out,"D4-recheck.evaluation.json"),JSON.stringify(score,null,2)+"\n",{flag:"wx"});
console.log(JSON.stringify({mode:"OFFLINE_SAVED_EVIDENCE_RECHECK_NOT_LIVE",originalInputUnchanged:true,originalEvaluationUnchanged:true,verdict:score.verdict,qualification:"QUOTE_VERIFIED_MEANING_PENDING_REVIEW"}));
