import assert from 'node:assert/strict';
const modulePath=process.argv[2]??'../../../src/eval/restaurant/agent-loop/name-resolution-method-a.ts';
const {runNameResolutionMethodA}=await import(modulePath);
const actions=[];let current;
const detail='https://tabelog.com/en/tokyo/A1111/A111111/12345/';
const runtime={openSession:async()=>({metadata:{runtimeProvider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',startedAt:'2026-10-20T00:00:00Z'},
 navigate:async url=>{const search=/rstLst/.test(url);const html=search?`<a class="list-rst__rst-name-target" href="${detail}">Fixture Restaurant</a>`:`<h1>Fixture Restaurant</h1><script type="application/ld+json">${JSON.stringify({'@type':'Restaurant',name:'Fixture Restaurant',address:'1-1 Tokyo Fixture Street',telephone:'03-1111-2222'})}</script><select name="party_size"><option value="1">1</option></select><select name="date"><option value="1970-01-01">1970-01-01</option></select><p>Availability</p>`;current={url,title:'Fixture Restaurant',text:html.replace(/<[^>]+>/g,' '),html};},
 snapshot:async()=>{actions.push('snapshot');return current;},select:async()=>{actions.push('AVAILABILITY_SELECT');return['1'];},click:async()=>{actions.push('CLICK');},fill:async()=>{actions.push('FILL');},waitFor:async()=>{},waitForSettled:async()=>true,screenshot:async()=>new Uint8Array(),close:async()=>{},
})};
const artifact=await runNameResolutionMethodA('offline-boundary','TABELOG',{name:'Fixture Restaurant',address:'1-1 Tokyo Fixture Street',phone:'03-1111-2222',coordinates:{lat:35,lng:139}},{mode:'OFFLINE_FIXTURE',runtime,signal:new AbortController().signal});
console.log(JSON.stringify({accepted:artifact.observation.accepted,boundary:artifact.boundary,actions,availabilityTrace:artifact.trace.filter(d=>d.stage==='AVAILABILITY').map(d=>({event:d.event,detail:d.detail}))},null,2));
assert.equal(actions.includes('AVAILABILITY_SELECT'),false,'Identity-only benchmark must stop before underlying availability select');
assert.equal(artifact.observation.accepted,true,'Name identity must remain recorded');
