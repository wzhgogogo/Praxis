import assert from "node:assert/strict";
import test from "node:test";
import { discoveryProbeMetrics, type DiscoveryProbeInput } from "./discovery-probe.js";
import { evaluatorImportViolation } from "../../shared/evaluator-import-rule.js";
import type { RestaurantSearchRead } from "../../../domains/restaurant/contracts.js";

const input: DiscoveryProbeInput={caseId:"fixture",role:"TARGET",referenceTime:"2026-10-16T12:00:00Z",
 intent:{timezone:"Asia/Tokyo",area:{query:"fixture"},criteria:[]},
 locationContext:{latitude:35,longitude:139,radiusMeters:1000,label:"fixture",areaMatchBasis:"NAMED_PLACE_RADIUS"}};

test("P21 production cannot import witness/probe evaluation modules through any import form",()=>{
 for(const owner of ["application/read.ts","integrations/search/port.ts","infrastructure/browser/test.ts","domains/restaurant/intent.ts","server/read.ts","web/read.ts"])
 for(const statement of ['import { metric } from "x"','import type { Witness } from "x"','import("x")'])
 assert.match(evaluatorImportViolation(owner,"eval/restaurant/agent-loop/discovery-probe.ts",statement)!,/production.*eval/i);
 assert.match(evaluatorImportViolation("application/read.ts","../../../.eval-artifacts/batch/witnesses.json",'import input from "x"')!,/production.*eval/i);
 assert.equal(evaluatorImportViolation("server/local-web-server.ts","eval/restaurant/agent-loop/web-read-artifact.ts",'import { artifact } from "x"'),undefined);
 assert.equal(evaluatorImportViolation("eval/restaurant/agent-loop/discovery-probe.ts","integrations/restaurant-search/live-read-assembly.ts",'import { factory } from "x"'),undefined);
});

test("P21 listing witness, first-batch witness and radius are independent observations",()=>{
 const witness={sourceId:"source",sourceEntityId:"witness",outletName:"Observed witness"};
 const listing={sourceId:"source",url:"https://example.org/region/list",snapshot:1,htmlSha256:"x",outlets:[{sourceEntityId:"witness",sourceUrl:"https://example.org/witness",outletName:"Observed witness"}]};
 const read={candidates:[{restaurant:{id:"unknown-coordinate",outletName:"Unknown",sourceIds:{},address:"",provenance:{}},rank:1,verifiedCriteria:[]}],evidence:[],metadata:{nativeDiscoveryFunnel:{pagesRead:1,listingObservations:[{sourceUrl:listing.url,parsedOutlets:1}]}}} as unknown as RestaurantSearchRead;
 const metric=discoveryProbeMetrics(input,[witness],[listing],[],[{sourceId:"source",read}],[]);
 const failed=discoveryProbeMetrics(input,[witness],[listing],[],[{sourceId:"source",failureCode:"MODEL_CALL_BUDGET_EXHAUSTED",failedFunnel:read.metadata.nativeDiscoveryFunnel!}],[]);
 assert.equal(failed.witnessInListing,true,"later budget failure must not erase an already bound listing observation");
 assert.equal(failed.inRadiusParsedIsLowerBound,true);
 assert.equal(metric.witnessInListing,true);assert.equal(metric.witnessInFirstBatch,false);assert.equal(metric.inRadiusParsed,0);
 const detail=discoveryProbeMetrics(input,[witness],[listing],[{sourceId:"source",sourceEntityId:"witness",url:"https://example.org/witness"}],[{sourceId:"source",read}],[]);
 assert.equal(detail.witnessInFirstBatch,true);
 const bootstrap=discoveryProbeMetrics(input,[witness],[{...listing,url:"https://example.org/nationwide"}],[],[{sourceId:"source",read}],[]);
 assert.equal(bootstrap.witnessInListing,false,"nationwide/bootstrap links cannot be credited to a bound regional list");
 const otherSource=discoveryProbeMetrics(input,[{...witness,sourceId:"different"}],[listing],[],[{sourceId:"source",read}],[]);
 assert.equal(otherSource.witnessInListing,false,"same opaque ID on another source is not witness identity");
});


test("P21 probe preflight forwards provider environment and keeps the journal in the probe directory",async()=>{
 const {mkdtemp,readdir,readFile,rm}=await import('node:fs/promises');
 const {resolve}=await import('node:path');const {tmpdir}=await import('node:os');
 const {runDiscoveryProbePreflight}=await import('./discovery-probe.js');
 const temp=await mkdtemp(resolve(tmpdir(),'p21-preflight-'));let requests=0;
 try{
  await assert.rejects(runDiscoveryProbePreflight({environment:{DEEPSEEK_API_KEY:'fixture-offline-key'},network:{proxyMode:'DISABLED_BY_CLI'},artifactDirectory:temp},{fetchImplementation:async(_url,init)=>{
   requests++;assert.equal(requests>1||new Headers(init?.headers).get('authorization')==='Bearer fixture-offline-key',true,'provider environment reaches the real preflight transport');
   if(requests===4)throw Error('OFFLINE_STOP_BEFORE_BROWSER');return new Response('{}',{status:200});
  }}));
  const file=(await readdir(temp)).find(f=>f.endsWith('.result.json'));assert.ok(file,'journal must be inside the requested probe directory');
  const saved=JSON.parse(await readFile(resolve(temp,file),'utf8'));
  assert.deepEqual(saved.attempts.map((a:{target:string;outcome:string})=>[a.target,a.outcome]),[['DEEPSEEK','REACHABLE'],['GOOGLE','REACHABLE'],['TABELOG','REACHABLE'],['TABLECHECK','FAILED']]);
  assert.equal(requests,4);assert.equal(saved.generationModelCalls,0);
 }finally{await rm(temp,{recursive:true,force:true});}
});
