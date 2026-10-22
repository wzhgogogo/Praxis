import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const base='.eval-artifacts/checkpoint-c-live-20261020',dir=`${base}/c18-offline-reassessment-20261022`;
const sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p));
const files={},add=async p=>{p=path.relative(process.cwd(),path.resolve(p));files[p]=sha(await fs.readFile(p));};
const paths=execFileSync('git',['ls-files','src','scripts','package.json','package-lock.json','tsconfig.json','tsconfig.build.json'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);for(const p of paths)await add(p);
const oldRaw=await read(`${base}/checkpoint-c-continuation-20261021/raw-results-manifest.json`);for(const[p,v]of Object.entries(oldRaw.files)){await add(p);assert.equal(files[p],v.sha256);}
for(const p of ['plan.json','reviewed-reads.json','tablecheck-post-review.mjs','checkpoint-c-rerun-20261021/registry.certified.json','checkpoint-c-continuation-20261021/ledger-after.json','checkpoint-c-continuation-20261021/independent-review.md'])await add(`${base}/${p}`);
await add((await read(`${base}/plan.json`)).source);
await add('docs/skills/eval/SKILL.md');await add('docs/AGENT-WEB-OPERATION-PHASE-2-PLAYBOOK.md');
const registry=await read(`${base}/checkpoint-c-rerun-20261021/registry.certified.json`);for(const v of registry.variants)for(const w of v.witnesses)for(const r of w.observationRefs??[])await add(r.path);
const hard=await read(`${dir}/hard-evidence.json`);for(const r of hard.runs){for(const s of r.snapshots)for(const k of ['path','recordingPath'])await add(path.resolve(dir,s[k]));for(const w of r.witnesses)for(const k of ['path','reviewPath','certificationPath'])await add(path.resolve(dir,w[k]));}
for(const n of await fs.readdir(dir))if(/\.(?:mjs|json|md|log)$/.test(n))await add(`${dir}/${n}`);
const input=await read(`${dir}/c18-inputs.json`);for(const r of input.runs){await add(r.artifactPath);assert.equal(files[r.artifactPath],r.artifactSha256);await add(r.originalEvaluationPath);assert.equal(files[r.originalEvaluationPath],r.originalEvaluationSha256);}
const codeCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const manifest={status:'frozen regression; exposed C18 offline reassessment, not Clean',schema:'c18-offline-reassessment-freeze@1',codeCommit,evaluator31Commit:'3aeb708b548eb97b8347a2d7d716cd936b5deed3',versions:{baseline:'restaurant-hybrid-read-diagnostic-evaluator@31 / rubric@27',current:'restaurant-hybrid-read-diagnostic-evaluator@32 / rubric@28'},activity:{newModels:0,newWebsites:0,newGoogle:0,newLiveRuns:0},rules:'Original18 inputs, original@31 evaluations and raw observations immutable. New artifact-scoped correspondence and current certified literal HARD input only; no cross-artifact/condition inference.',files:Object.fromEntries(Object.entries(files).sort(([a],[b])=>a.localeCompare(b)))};
await fs.writeFile(`${dir}/reassessment-freeze.json`,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'FROZEN_PENDING_INPUT_COMMIT',codeCommit,files:Object.keys(files).length,sha256:sha(await fs.readFile(`${dir}/reassessment-freeze.json`))}));
