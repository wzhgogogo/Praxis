import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runOuterNetworkPreflight,networkTargets} from './outer-preflight.mjs';
import {busyQuote,sourceResponse,installOuterBrowserObservation} from './observe-browser.mjs';
import {runDiscoveryProbePreflight} from 'file:///Users/wangzhour/.codex/worktrees/p21-checkpoint-b-corrected/Praxis-Zhixing/src/eval/restaurant/agent-loop/discovery-probe.ts';
import {runSourceDataPreflight,SourceDataPreflightError} from 'file:///Users/wangzhour/.codex/worktrees/p21-checkpoint-b-corrected/Praxis-Zhixing/src/eval/restaurant/agent-loop/source-data-preflight.ts';
import {LocalPlaywrightChromium} from 'file:///Users/wangzhour/.codex/worktrees/p21-checkpoint-b-corrected/Praxis-Zhixing/src/infrastructure/browser/local-playwright-chromium.ts';

const config=dirname(fileURLToPath(import.meta.url)),checks=[],contrasts=[];
const mark=name=>checks.push({name,status:'PASS'});
const temp=await mkdtemp(join(tmpdir(),'p21-outer-controls-'));
let sequence=0;
try {
  const network={proxyMode:'DISABLED_BY_CLI'},environment={DEEPSEEK_API_KEY:'offline-fixture-only'};
  const transport=(blockedHost,status,calls)=>async(url,init)=>{
    const u=new URL(url);calls.push({host:u.hostname,method:init.method??'GET'});
    return new Response('{}',{status:u.hostname===blockedHost?status:200});
  };
  for(const status of [403,503]) {
    const oldCalls=[],newCalls=[];
    await assert.rejects(runDiscoveryProbePreflight({environment,network,artifactDirectory:join(temp,String(sequence++))},{fetchImplementation:transport('www.tablecheck.com',status,oldCalls)}));
    const result=await runOuterNetworkPreflight({environment,network,artifactDirectory:join(temp,String(sequence++))},{fetchImplementation:transport('www.tablecheck.com',status,newCalls)});
    assert.equal(oldCalls.length,4);assert.equal(newCalls.length,3);
    assert.deepEqual(result.attempts.map(a=>a.target),['DEEPSEEK','GOOGLE','TABELOG']);
    assert(!newCalls.some(c=>c.host.endsWith('tablecheck.com')));
    contrasts.push({tablecheckHomepageStatus:status,old:'FAILED',oldCalls,new:'SUCCEEDED',newCalls});
    mark(`old-homepage-${status}-blocks-new-omits-only-tablecheck`);
  }
  assert.deepEqual(networkTargets,['DEEPSEEK','GOOGLE','TABELOG']);mark('network-targets-exact');
  for(const [target,host] of [['DEEPSEEK','api.deepseek.com'],['GOOGLE','places.googleapis.com'],['TABELOG','tabelog.com']]) {
    const calls=[],read=transport(host,503,calls);
    await assert.rejects(runOuterNetworkPreflight({environment,network,artifactDirectory:join(temp,String(sequence++))},{fetchImplementation:async(url,init)=>{
      if(target==='GOOGLE' && new URL(url).hostname===host){calls.push({host,method:init.method??'GET'});throw Error('offline transport unreachable');}
      return read(url,init);
    }}));
    assert(calls.some(c=>c.host===host));mark(`retain-${target}-failure`);
  }
  for(const [name,observed,pass] of [
    ['nonempty',{count:122,responseStatus:200,reason:null},true],
    ['empty',{count:0,responseStatus:200,reason:'EMPTY_RESULT'},false],
    ['timeout',{count:null,responseStatus:null,reason:'NO_RESPONSE',detail:'TIMEOUT'},false],
  ]) {
    const seen=[],input={sourceIds:['tabelog','tablecheck','google-places'],environment:{},artifactDirectory:join(temp,'source-'+name)};
    const {mkdir}=await import('node:fs/promises');await mkdir(input.artifactDirectory);
    const run=()=>runSourceDataPreflight(input,{read:async check=>{seen.push(check.sourceId);return check.sourceId==='tablecheck'?observed:{count:1,responseStatus:200,reason:null};}});
    if(pass)await run();else await assert.rejects(run(),e=>e instanceof SourceDataPreflightError&&e.sourceIds.includes('tablecheck'));
    assert(seen.includes('tablecheck'));mark(`real-source-data-preflight-${name}`);
  }
  assert(busyQuote('アクセスが集中しており、つながりにくくなっています。'));mark('observed-tabelog-busy');
  assert(busyQuote('Search is unavailable right now. Please try again.'));mark('observed-tablecheck-busy');
  assert.equal(busyQuote('No restaurants found'),null);mark('empty-is-not-busy');
  assert(sourceResponse({url:'https://www.tablecheck.com/en/japan/search',status:403,resourceType:'document'}));mark('403-source-document');
  assert(sourceResponse({url:'https://search-api.ai.ingress.production.tablecheck.com/search/',status:503,resourceType:'xhr'}));mark('503-source-json');
  assert(!sourceResponse({url:'https://example.com/image',status:503,resourceType:'image'}));mark('ignore-unrelated-image');
  assert(!sourceResponse({url:'https://www.tablecheck.com/en/japan/search',status:200,resourceType:'document'}));mark('normal-response-not-retry');
  const actualOpen=LocalPlaywrightChromium.prototype.openSession;
  let received;const page={url:'https://tabelog.com/',text:'normal public page'},guardPolicy={genericPublicRead:true};
  LocalPlaywrightChromium.prototype.openSession=async function(options){received=options;return {snapshot:async()=>page};};
  installOuterBrowserObservation(temp);
  const runtime=new LocalPlaywrightChromium({}),signal=new AbortController().signal;
  const session=await runtime.openSession({signal,networkPolicy:guardPolicy});
  assert.equal(received.networkPolicy,guardPolicy);assert.equal(received.signal,signal);assert(!received.recordResponse);
  assert.equal(await session.snapshot(),page);mark('passive-observer-preserves-policy-snapshot-and-no-new-body-read');
  let delivered=0;await runtime.openSession({signal,networkPolicy:guardPolicy,recordResponse:()=>{delivered++;}});
  received.recordResponse({url:'https://www.tablecheck.com/en/',status:503,resourceType:'document',method:'GET'});
  assert.equal(delivered,1);mark('passive-observer-preserves-existing-response-callback');
  LocalPlaywrightChromium.prototype.openSession=actualOpen;
  await writeFile(join(config,'offline-network-contrasts.json'),JSON.stringify({status:'PASS',mode:'MOCK_HTTP_TRANSPORT_NO_NETWORK',contrasts,checks,count:checks.length,network:0,models:0},null,2)+'\n');
  console.log(JSON.stringify({status:'PASS',count:checks.length,network:0,models:0}));
} finally {await rm(temp,{recursive:true,force:true});}
