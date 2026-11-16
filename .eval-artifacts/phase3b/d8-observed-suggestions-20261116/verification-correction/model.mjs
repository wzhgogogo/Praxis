import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const here = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(await readFile(join(here, 'frames.json'), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (cwd, ...args) => execFileSync('git', ['--no-optional-locks', ...args], {cwd, maxBuffer: 80*1024*1024});
const code = manifest.sourceRoot;
const load = path => import(pathToFileURL(join(code, path)).href);
const see = row => JSON.parse(row.messages.find(m => m.role === 'user').content);
const save = (file, value) => writeFile(join(here, file), JSON.stringify(value, null, 2)+'\n', {flag: 'wx'});
const file = path => readFile(resolve(path));
const clean = () => { assert.equal(git(code,'rev-parse','HEAD').toString().trim(), manifest.sourceSHA); assert.equal(git(code,'status','--porcelain').length,0); };
clean();
const { ModelBrowserReadActionDecision, BROWSER_ACTION_DECISION_STRICT_WIRE_JSON_SCHEMA: schema } = await load('src/infrastructure/browser/browser-action-decision.ts');
const { BrowserTaskExecutor } = await load('src/infrastructure/browser/browser-task-executor.ts');
const { PlaywrightControlRegistry } = await load('src/infrastructure/browser/playwright-browser-controls.ts');
const { tableCheckDiscoveryPack, discoveryPackNetworkPolicy } = await load('src/integrations/restaurant-search/source-packs.ts');
const { loadBrowserReadSkills } = await load('src/infrastructure/browser/browser-read-skills.ts');
const { tableCheckNameSearchCompletion } = await load('src/integrations/tablecheck/tablecheck-browser-availability.ts');
const rows = (await file(manifest.decisions)).toString().trim().split('\n').map(s => JSON.parse(s));
const archive = JSON.parse(await file(join(manifest.recording,'recording.json')));
for (const [p, expected] of Object.entries(manifest.files)) {
  assert.equal(hash(await file(p)), expected, p);
  assert.equal(git(process.cwd(),'rev-parse',manifest.evidenceBase+':'+p).toString().trim(), git(process.cwd(),'hash-object',p).toString().trim(),p);
}
const dated = manifest.dateInput;
const dateBytes = git(process.cwd(),'show',dated.ref+':'+dated.path);
assert.equal(hash(dateBytes),dated.sha256);
const date = JSON.parse(dateBytes);
const positives = rows.filter(r=>r.sequence>=4&&r.sequence<=6);
const final = see(positives[2]);
const shot = n => join(manifest.recording,'diagnostic/snapshot-'+String(n).padStart(4,'0')+'.html');
const frames = await Promise.all(positives.map(async (r,n)=>({
  row:r, ctx:see(r), html:(await file(shot(r.browser.recordingSnapshot))).toString(),
  controls:archive.entries.find(e=>e.kind==='CONTROLS'&&e.sequence===manifest.controlSequences[n]).detail.controls,
})));
const recordedOptions = frames[2].controls.filter(t=>t.role==='option').map(t=>t.label);
assert.equal(recordedOptions.length,8);
assert.equal(final.observation.targets.filter(t=>t.role==='option'&&t.availableActions?.includes('CLICK')).length,0);

async function chromiumFrame() {
  const browser = await chromium.launch({headless:true});
  const registry = new PlaywrightControlRegistry();
  try {
    const context = await browser.newContext({viewport:manifest.viewport,serviceWorkers:'block', javaScriptEnabled:false,offline:true});
    const local = new Map([[final.observation.url,{body:frames[2].html, contentType:'text/html; charset=utf-8'}]]);
    for(const s of archive.stylesheets.slice(0,2)) {
      const body=await file(join(manifest.recording,s.file)); assert.equal(hash(body),s.sha256);
      local.set(s.url, {body, contentType:'text/css; charset=utf-8'});
    }
    let served=0,aborted=0;
    await context.route('**/*',async route=>{
      const response=local.get(route.request().url());
      if(response){served++;await route.fulfill(response);}else{aborted++;await route.abort();}
    });
    const page=await context.newPage();
    await page.goto(final.observation.url,{waitUntil:'load'});
    const dom=await page.locator('[role=option]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-label')));
    const controls=await registry.observe(page);
    const observed=controls.filter(c=>c.kind==='BUTTON'&&c.role==='option'&&c.visible&&!c.disabled&&!c.blockedByActiveLayer&&!c.optionOwnerId);
    assert.equal(dom.length,13);
    assert.deepEqual(observed.map(c=>c.label),recordedOptions);
    assert.ok(controls.some(c=>c.role==='button'&&c.label==='Search'&&c.visible&&!c.disabled&&!c.blockedByActiveLayer));
    return {domCount:dom.length,dom,observed:observed.map(c=>c.label),servedFromDisk:served,aborted,websiteGET:0};
  } finally {await registry.dispose();await browser.close();}
}

// The first two proposals are the recorded clicks/fill. Rebuild the target map
// in the production executor from exactly the controls it received on each frame.
async function project(sequence, source, sourceSkillPath, Executor = BrowserTaskExecutor) {
  let n=0, captured;const diagnostics=[];
  const session={
    metadata:{provider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',requestedEngineMode:'CHROMIUM_ONLY',engineFallbackOccurred:false,readNetworkBoundary:'INSTALLED'},
    async navigate(){},async prepareNavigation(){},beginReadScope(){},async waitForSettled(){return true;},
    async snapshot(){const f=sequence[n];return {url:f.ctx.observation.url,title:f.ctx.observation.title,text:f.ctx.observation.visibleText,html:f.html,pageId:'recorded-page',settlement:'SETTLED'};},
    async observeControls(){return sequence[n].controls;},async click(){n++;},async fill(){n++;},async pressEscape(){},async close(){},
  };
  const policy=discoveryPackNetworkPolicy();
  const executor=new Executor({async openSession(){return session;}},{
    maxAutomaticElapsedMs:30000,maxModelCallsPerCandidate:4,maxModelCallsTotal:4,maxOperationsPerCandidate:80,
    onDiagnostic:d=>{if(['REJECTED','METHOD_INCOMPLETE','MODEL_DECISION_FAILED'].includes(d.event))diagnostics.push([d.event,d.detail]);},
    modelDecision:{async decide(input){
      if(n===sequence.length-1){captured=input;return {type:'REQUEST_HUMAN_HELP',reason:'End offline input capture'};}
      const wire=JSON.parse(sequence[n].row.outputText);
      const old=sequence[n].ctx.observation.targets.find(t=>t.ref===wire.targetRef);
      const matches=input.observation.targets.filter(t=>t.kind===old.kind&&t.role===old.role&&t.label===old.label&&t.controlGroupLabel===old.controlGroupLabel);
      assert.equal(matches.length,1);
      return {type:wire.action,targetRef:matches[0].ref,...(wire.authoritativeField==='NONE'?{}:{field:wire.authoritativeField}),reason:wire.reason};
    }},
  });
  const f=sequence.at(-1).ctx,query=f.goal.retrievalExpression;
  const signal=new AbortController().signal;
  try {
    await executor.acquire(signal,source,'DISCOVERY',policy);
    const result=await executor.search({source,session,signal,url:f.observation.url,allowedOrigins:[new URL(f.observation.url).origin],
      query,querySource:f.goal.retrievalSource,sourceSkillPath,completion:page=>tableCheckNameSearchCompletion(page,query)});
    assert.ok(captured,JSON.stringify({n,status:result.status,diagnostics}));return captured;
  } finally {await executor.closeAll();}
}

async function serialize(input) {
  let request;
  const decision=new ModelBrowserReadActionDecision({async complete(r){request=r;return {outputText:JSON.stringify({action:'REQUEST_HUMAN_HELP',targetRef:'',valueGroupRef:'',authoritativeField:'NONE',requestedState:'NONE',reason:'offline serialization'}),finishReason:'TOOL_CALLS'};}});
  await decision.decide(input);return request;
}

async function prepare() {
  const rendered=await chromiumFrame();
  const primary=await project(frames,'TABLECHECK',tableCheckDiscoveryPack.skillPath);
  assert.deepEqual(primary.history,final.history); assert.equal(primary.progress,final.progress);
  assert.deepEqual(primary.goal,final.goal);assert.equal(primary.observation.revision,final.observation.revision);
  const options=input=>input.observation.targets.filter(t=>t.role==='option'&&t.kind==='BUTTON'&&t.availableActions.includes('CLICK'));
  assert.deepEqual(options(primary).map(t=>t.label),rendered.observed);
  assert.ok(primary.observation.targets.some(t=>t.label==='Search'&&t.availableActions.includes('CLICK')));
  assert.ok(primary.skills.source.includes('# TableCheck Public Read'));
  const originalOthers=final.observation.targets.filter(t=>t.role!=='option');
  const semantic=t=>[t.kind,t.role,t.label,t.availableActions];
  assert.deepEqual(primary.observation.targets.filter(t=>t.role!=='option').map(semantic),originalOthers.map(semantic));
  const inputs={'nov16-6':primary,'date-28':{...date,skills:loadBrowserReadSkills(date.source,tableCheckDiscoveryPack.skillPath)}};
  // LOCAL_CONSTRUCTION: counterfactuals are raw recorded controls, projected
  // by the real executor. No target, reference or availableAction is edited.
  const {transform} = await import('esbuild');
  const oldPath='src/infrastructure/browser/browser-task-executor.ts';
  const rawOld=git(code,'show',manifest.comparisonBase+':'+oldPath).toString();
  const oldJS=(await transform(rawOld,{loader:'ts',format:'esm',target:'node24'})).code
    .replace(/(from\s+['"])(\.[^'"]+)(['"])/g,(_,start,path,end)=>start+pathToFileURL(resolve(code,dirname(oldPath),path.replace(/\.js$/,'.ts'))).href+end);
  const OldExecutor=(await import('data:text/javascript;base64,'+Buffer.from(oldJS).toString('base64'))).BrowserTaskExecutor;
  const projection={};
  for(const mode of ['suffix-only','duplicate']){
    const sequence=structuredClone(frames), list=sequence.at(-1).controls;
    const offered=list.find(t=>t.label===manifest.gold&&t.role==='option');assert.ok(offered);
    const region=list.find(t=>t.role==='listbox');if(region)region.label='Destination suggestions';
    if(mode==='suffix-only')sequence.at(-1).controls=list.filter(t=>t.id!==offered.id);
    else list.push({...offered,id:'constructed-duplicate',stableKey:'constructed-duplicate'});
    const before=await project(sequence,'TABLECHECK',tableCheckDiscoveryPack.skillPath,OldExecutor);
    const input=await project(sequence,'TABLECHECK',tableCheckDiscoveryPack.skillPath);
    const count=x=>options(x).filter(t=>t.label===manifest.gold).length;
    assert.equal(count(before),mode==='duplicate'?2:0);assert.equal(count(input),0);
    assert.ok(options(input).some(t=>t.label.includes(' Kiwami')));assert.ok(options(input).some(t=>t.label.includes(' Hanare')));
    assert.ok(input.observation.targets.some(t=>t.label==='Search'&&t.availableActions.includes('CLICK')));
    assert.deepEqual((await serialize(before)).messages,mode==='suffix-only'?(await serialize(input)).messages:(await serialize(before)).messages);
    projection[mode]={beforeCount:count(before),afterCount:count(input),rawControlsSHA256:hash(JSON.stringify(sequence.at(-1).controls))};
    inputs[mode]=input;
    await save(mode+'.raw-controls.json',sequence.at(-1).controls);
  }
  inputs['date-28'].taskId='recorded-date-28';
  const priorDir=join(here,'../verification');const comparisons={};
  for(const id of ['nov16-6','date-28','suffix-only']){
    const oldMessages=JSON.parse(await readFile(join(priorDir,id==='nov16-6'?'model-checked':'model-final',id+'.messages.json'),'utf8'));
    const newMessages=(await serialize(inputs[id])).messages;
    const same=JSON.stringify(oldMessages)===JSON.stringify(newMessages);
    if(id!=='suffix-only')assert.deepEqual(newMessages,oldMessages);
    else {
      const semantic=messages=>messages.map(m=>({...m,content:m.role==='user'?JSON.stringify((()=>{
        const user=JSON.parse(m.content);for(const t of user.observation.targets)delete t.ref;return user;
      })()):m.content}));
      assert.deepEqual(semantic(newMessages),semantic(oldMessages),'Only opaque observation references may change');
    }
    comparisons[id]={byteIdentical:same,oldSHA256:hash(JSON.stringify(oldMessages)),newSHA256:hash(JSON.stringify(newMessages)),reusedResult:true,...(!same?{difference:'Opaque targetRef renumbering after raw control removal; all other fields identical'}:{})};
  }
  const files={};
  for(const p of ['src/infrastructure/browser/browser-action-decision.ts','web-skills/browser-read/SKILL.md','web-skills/tabelog/SKILL.md','src/integrations/restaurant-search/native-restaurant-search.ts','src/integrations/tabelog/tabelog-browser-availability.ts']){
    files[p]=hash(await readFile(join(code,p)));assert.equal(files[p],hash(git(code,'show',manifest.sourceBase+':'+p)));
  }
  const tableRows=rows.filter(r=>r.purpose==='browser_read_decide'&&see(r).source==='TABELOG');
  const tableControls=archive.entries.filter(e=>e.kind==='CONTROLS'&&new URL(e.detail.url).hostname==='tabelog.com');
  assert.ok(tableRows.length&&tableControls.length);
  for(const e of tableControls)assert.ok(!e.detail.controls.some(c=>c.role==='option'&&c.kind==='BUTTON'&&!c.optionOwnerId&&c.visible&&!c.disabled&&!c.blockedByActiveLayer&&['DIV','LI','SPAN'].includes(c.structure?.tag)));
  const tb=see(tableRows[0]);const projected=await project([{ctx:tb,html:'',controls:tableControls[0].detail.controls}],'TABELOG');
  const tableHashes=[];
  for(const r of tableRows){const old=see(r);const fresh=await serialize({...old,taskId:'observed-source-query',objective:projected.objective,skills:projected.skills});
    assert.deepEqual(fresh.messages,r.messages);tableHashes.push({sequence:r.sequence,sha256:hash(JSON.stringify(fresh.messages))});}
  await mkdir(join(here,'inputs'),{recursive:false});
  const hashes={};
  for(const id of manifest.goldCases){const input=inputs[id];await save('inputs/'+id+'.json',input);hashes[id]=hash(await readFile(join(here,'inputs',id+'.json')));}
  await save('preflight.json',{sourceSHA:manifest.sourceSHA,originalDOM:manifest.files[shot(4)],rendered,oldActionable:0,newActionable:options(primary).length,
    projection,messageComparisons:comparisons,search:primary.observation.targets.find(t=>t.label==='Search'&&t.availableActions.includes('CLICK')).ref,primaryTarget:options(primary).find(t=>t.label===manifest.gold).ref,
    tabelogCodeAndSkillHashes:files,identicalTabelogMessages:tableHashes,hashes,modelCalls:0,websiteGET:0,Live:0});
}

async function evaluate(){
  const {DeepSeekModelGateway}=await load('src/infrastructure/deepseek/deepseek-model-gateway.ts');
  const {chargeG6}=await load('src/eval/restaurant/agent-loop/g6/budget.ts');
  const pre=JSON.parse(await readFile(join(here,'preflight.json')));assert.equal(pre.sourceSHA,manifest.sourceSHA);
  const evidenceSHA=git(process.cwd(),'rev-parse','HEAD').toString().trim();
  for(const p of ['frames.json','model.mjs','preflight.json','inputs/duplicate.json']){
    const rel=join(here.slice(process.cwd().length+1),p);assert.equal(hash(await readFile(join(here,p))),hash(git(process.cwd(),'show',evidenceSHA+':'+rel)),p);
  }
  const ledger=resolve(here,'../verification/model-budget.json');
  const budget=JSON.parse(await readFile(ledger));assert.equal(budget.cumulative.realModelCalls,4);assert.equal(budget.limits.realModelCalls,5);
  await mkdir(join(here,'model-fifth'),{recursive:false});
  const id='duplicate';const bytes=await readFile(join(here,'inputs',id+'.json'));assert.equal(hash(bytes),pre.hashes[id]);const input=JSON.parse(bytes);
  let sent=0,wire,usage,requestSHA256;
  const gateway=DeepSeekModelGateway.fromEnvironment(process.env,{fetchImplementation:async(url,init)=>{
    assert.equal(new URL(String(url)).origin,'https://api.deepseek.com');assert.equal(init.method,'POST');assert.equal(sent,0);
    await chargeG6(ledger,'recorded:duplicate-production-projection','realModelCalls','User2026-11-16: fifth and final recorded-model attempt; duplicate constructed before production projection.');sent++;
    return fetch(url,{...init,redirect:'error'});
  }});
  const model=new ModelBrowserReadActionDecision({async complete(r){
    assert.equal(r.outputSchema.version,'16');requestSHA256=hash(JSON.stringify(r.messages));await save('model-fifth/duplicate.messages.json',r.messages);
    const result=await gateway.complete(r);wire=JSON.parse(result.outputText);usage=result.usage;return result;
  }});
  const answer=await model.decide(input);assert.ok(wire,'No decoded model wire');
  assert.deepEqual(Object.keys(wire).sort(),[...schema.required].sort());
  for(const [k,v]of Object.entries(wire)){assert.equal(typeof v,'string');if(schema.properties[k].enum)assert.ok(schema.properties[k].enum.includes(v));}
  const target=input.observation.targets.find(t=>t.ref===answer.targetRef);
  const passed=answer.type==='REQUEST_HUMAN_HELP'||answer.type==='CLICK'&&target?.label==='Search';
  await save('model-fifth/result.json',{passed,sourceSHA:manifest.sourceSHA,evidenceSHA,strictSchema:'16',wire,selectedLabel:target?.label??null,usage,requestSHA256,sent,websiteGET:0,Live:0});
  console.log(JSON.stringify({passed,action:answer.type,label:target?.label??null,sent}));assert.ok(passed);
}
if(process.argv[2]==='prepare')await prepare();else if(process.argv[2]==='model')await evaluate();else throw Error('Choose prepare or model');

