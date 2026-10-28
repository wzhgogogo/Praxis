// Execution only: original Google fields, saved HTTP responses, saved fragment text.
// Gold is loaded by evaluate.py after this file has completed, never by this runner.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {parseTabelogSearchOutlets} from '../../../src/integrations/tabelog/tabelog-page-parser.ts';
import {TabelogBrowserAvailability} from '../../../src/integrations/tabelog/tabelog-browser-availability.ts';
import {locateNamedSourceFragment,ModelNamedSourceQuery} from '../../../src/integrations/restaurant-search/named-source-query.ts';

const prior='.eval-artifacts/phase3b/c-batch2',root='.eval-artifacts/phase3b/c-batch3';
const argument=(name,fallback)=>process.argv.includes(name)?process.argv[process.argv.indexOf(name)+1]:fallback;
const freezeFile=argument('--freeze','replay-freeze.json'),output=argument('--output','search-replay.json');
const load=p=>JSON.parse(readFileSync(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),'');
for(const f of load(`${root}/${freezeFile}`).files)assert.equal(sha(readFileSync(f.path)),f.sha256,f.path);
const subjects=load(`${prior}/subjects.json`).subjects;
const rawModel=load(`${prior}/retrieval-inputs/fragment.response.json`);
const fragments=JSON.parse(rawModel.outputText).samples;
const candidate=s=>({restaurant:{id:`saved:${s.id}`,outletName:s.subject.name,address:s.subject.address,sourceIds:{googlePlaces:s.googlePlaceId,phone:s.subject.phone},coordinates:s.subject.coordinates,provenance:{}},matchReasons:[],warnings:[],executionConfidence:'LOW'});
const sources=[];
for(const file of readdirSync(`${prior}/search`).filter(p=>p.endsWith('.result.json')).sort()){
  const row=load(`${prior}/search/${file}`);if(row.status!=='FETCHED'||row.failure||row.httpStatus!==200)continue;
  const bytes=readFileSync(row.bodyPath);assert.equal(sha(bytes),row.sha256);
  const started=load(`${prior}/search/${file.replace('.result.json','.started.json')}`),html=bytes.toString('utf8');
  const page={url:started.url,title:html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]??'Saved search',html,
    text:html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ')};
  assert.equal(new URL(page.url).searchParams.get('sw'),row.query);
  sources.push({id:row.subjectId,variant:row.variant,query:row.query,bodyPath:row.bodyPath,sha256:row.sha256,page,outlets:parseTabelogSearchOutlets(page)});
}
const locations=fragments.map(proposal=>{
  const subject=subjects.find(s=>s.id===proposal.id);assert(subject);
  const located=locateNamedSourceFragment(candidate(subject),{field:proposal.field,fragment:proposal.fragment});
  return {id:proposal.id,oldModelOffsets:{start:proposal.start,end:proposal.end},oldOffsetsCorrect:subject.subject[proposal.field].slice(proposal.start,proposal.end)===proposal.fragment,located};
});
const controls=[];
for(const subject of subjects.filter(s=>s.cohort==='NEW_PRIMARY'&&s.variant==='MODEL_FRAGMENT')){
  const proposal=fragments.find(p=>p.id===subject.id);assert(proposal);
  const rows=sources.filter(s=>s.id===subject.id),observed=new Set();let current,modelCalls=0;
  const navigations=[];
  const session={metadata:{runtimeProvider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',startedAt:'2026-10-27T15:00:00Z'},
    async navigate(url){navigations.push(url);const u=new URL(url);
      if(u.pathname.includes('/rstLst/')){const saved=rows.find(r=>r.query===u.searchParams.get('sw'));assert(saved,'No unfrozen query allowed');current={...saved.page,url};for(const o of saved.outlets)observed.add(o.sourceUrl);}
      else {assert(observed.has(url),'No unobserved detail URL allowed');current={url,title:'DETAIL_NOT_FROZEN',text:'No source detail response in this saved search cohort.',html:''};}},
    async snapshot(){return current;},async click(){throw Error('No unfrozen UI action');},async fill(){throw Error('No unfrozen UI action');},async select(){throw Error('No unfrozen UI action');},async waitFor(){},async close(){},async screenshot(){return new Uint8Array();}};
  const budget={totalModelCalls:0,maxModelCalls:1};
  const planner=new ModelNamedSourceQuery({async complete(){modelCalls++;return {...rawModel,outputText:JSON.stringify({field:proposal.field,fragment:proposal.fragment})};}},budget);
  const subjectCandidate=candidate(subject);
  const result=await new TabelogBrowserAvailability({openSession:async()=>session},()=> '2026-10-27T15:00:00Z',5,{alternativeSearch:planner.alternative}).check({candidateIds:[subjectCandidate.restaurant.id],candidates:[subjectCandidate],date:'2026-11-04',timeWindow:{earliest:'19:00',latest:'19:30'},partySize:2,hardCriteria:[]},new AbortController().signal);
  controls.push({id:subject.id,navigations,searches:navigations.filter(u=>new URL(u).pathname.includes('/rstLst/')).map(u=>new URL(u).searchParams.get('sw')),
    detailInspections:navigations.filter(u=>!new URL(u).pathname.includes('/rstLst/')).length,fixtureModelCalls:modelCalls,offers:result.offers.length,
    highIdentityClaims:result.evidence.filter(e=>e.entityMatch?.confidence==='HIGH').length,reasonCode:result.availabilityChecks[subjectCandidate.restaurant.id]?.reasonCode,
    limits:'No saved details supplied: only retrieval wiring and honest UNKNOWN are evaluated, not outlet identity or inventory.'});
}
const result={schema:'phase3b-c-search-replay@1',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),mode:'OFFLINE_SAVED_HTTP_HTML_AND_CONTROLLED_MISSING_DETAILS',newRealCalls:0,
  textDerivative:'HTML with script/style/tags removed only for explicit-empty checks; not a captured live browser snapshot. Original HTML unchanged.',
  fragmentFixture:'Prior fragment field/text projected to new wire; no Gold IDs; preserves prior normalized TOOL_CALLS finishReason. This is not a real Prompt2 run.',
  locations,listings:sources.map(({page,...row})=>row),controls};
mkdirSync(dirname(`${root}/${output}`),{recursive:true});
writeFileSync(`${root}/${output}`,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({listings:result.listings.length,located:locations.filter(p=>p.located).length,controls}));
