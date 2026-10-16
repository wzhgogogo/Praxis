import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';import{gunzipSync}from'node:zlib';
import{parseAllDocuments}from'yaml';import{resolve,relative}from'node:path';
const base=resolve('.eval-artifacts/p2-1-discovery-20261016');
const packageRoot=resolve('.eval-artifacts/calibration-phase1-20261015/inputs');
const sha=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await readFile(resolve(packageRoot,'manifest.json')));
const variantsBytes=await readFile(resolve(base,'variants.yaml'));
const variants=parseAllDocuments(variantsBytes.toString()).map(d=>d.toJS());
const oldRegistryPath='.eval-artifacts/p1-f-20261011/witnesses.p1f-20261011.json';
const registryBytes=await readFile(oldRegistryPath),oldRegistry=JSON.parse(registryBytes);
// Explicit latest matching Live family, no Gold criterion substitution.
const map=[['p2-kf-h001-20261027','p20-h001-a1'],['p2-kagurazaka-kaiseki-20261029','p1fA-kagurazaka-a1'],['p2-kf-h005-20261029','p1fA-kf-h005-a1r'],['p2-kichijoji-tempura-20261027','p1g-kichijoji-a2'],['p2-kf-h002-20261031','p20-h002-a1'],['p2-nakameguro-yakiniku-20261030','p1fA-nakameguro-a1']];
const entries=[],registryPlans=[];await mkdir(resolve(base,'inputs'),{recursive:true});
for(const [id,runId] of map){
 const variant=variants.find(v=>v.id===id);if(!variant)throw Error('DRAFT_CASE_MISSING');
 const record=manifest.entries.find(e=>e.runId===runId).files.find(f=>f.kind==='RESULT');
 const compressed=await readFile(resolve(packageRoot,record.path));if(sha(compressed)!==record.gzipSha256)throw Error('COMPRESSED_SHA_CHANGED');
 const raw=gunzipSync(compressed);if(sha(raw)!==record.originalSha256)throw Error('RAW_SHA_CHANGED');
 const artifact=JSON.parse(raw);const domain=artifact.finalSnapshot.domainState;
 const intent=structuredClone(domain.intent);if(!intent||!domain.searchContinuation?.locationContext)throw Error('MISSING_ACTUAL_INPUT');
 const originalDate=intent.date;intent.date=variant.semantic.date.value;
 const locationContext=structuredClone(domain.searchContinuation.locationContext);
 const input={caseId:id,role:variant.role,intent,locationContext,referenceTime:variant.reference_time,
  provenance:{runId,sourcePath:relative(process.cwd(),resolve(packageRoot,record.path)),originalSha256:record.originalSha256,gzipSha256:record.gzipSha256,
   semanticProposal:artifact.semantic.proposal,originalIntent:domain.intent,allowedChange:{field:'date',before:originalDate,after:intent.date},
   statement:'All non-date actual intent fields retained verbatim, including raw criterion text and target query. Variant dates approved by user 2026-10-16 22:44; this phase executes discovery probes only.',variantsApprovedSha256:sha(variantsBytes)}};
 const path=resolve(base,'inputs',id+'.json');const bytes=Buffer.from(JSON.stringify(input,null,2)+'\n');await writeFile(path,bytes,{flag:'wx'});
 entries.push({caseId:id,role:variant.role,path:relative(process.cwd(),path),sha256:sha(bytes),runId,repetitions:variant.role==='TARGET'?2:1});
 const old=oldRegistry.variants.find(v=>v.variantId===variant.derived_from.id);if(!old)throw Error('NO_PRIOR_WITNESS_REGISTRATION');
 registryPlans.push({caseId:id,role:variant.role,date:variant.semantic.date.value,time:variant.semantic.time.value,partySize:variant.semantic.party_size,
  center:locationContext,hardCriteria:intent.criteria.filter(c=>c.strength==='HARD'),priorRegistry:{path:oldRegistryPath,sha256:sha(registryBytes),variantId:old.variantId},
  witnesses:old.witnesses.map(w=>({...w,oldDistanceMeters:w.distanceMeters,oldSlot:w.slot,distanceMeters:undefined,slot:undefined}))});
}
await writeFile(resolve(base,'inputs/index.json'),JSON.stringify({status:'FROZEN_ACTUAL_LIVE_SEMANTICS_DATE_SHIFTED_TO_APPROVED_VARIANTS',approvedVariantsSha256:sha(variantsBytes),entries},null,2)+'\n',{flag:'wx'});
await writeFile(resolve(base,'witness-certification-plan.json'),JSON.stringify({method:'Public detail GET plus exactly-four-parameter vacancy GET. No model, form, or slot clicks.',variants:registryPlans},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({inputs:entries.length,plannedProbes:entries.reduce((n,e)=>n+e.repetitions,0),models:0,network:0}));
