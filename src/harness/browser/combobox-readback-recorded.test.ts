import assert from 'node:assert/strict';
import {test} from 'node:test';
import {BrowserTaskExecutor} from '../../infrastructure/browser/browser-task-executor.js';
import {tableCheckPublicReadNetworkPolicy} from '../../integrations/tablecheck/tablecheck-public-query.js';
import {recordedHtml,recordedRuntime,recordedUrl} from './fixtures/recorded-g1-query.js';

// Recorded empty native input and compact display container are unchanged.
// Only the menu/selection/log interactions are constructed; input.value is
// never assigned. This tests readback, not real four-person inventory.
for(const mode of ['closed','missing-expanded-closed','log-conflict','missing-expanded-open','label-conflict','field-label-only','replaced-owner']as const)test(`recorded readonly combobox ${mode} checks the same public control`,{timeout:30000},async()=>{
 const script=`const owner=[...document.querySelectorAll('input[role="combobox"]')].find(n=>n.getAttribute('aria-label')==='Any party size');
 const displayed=owner.previousElementSibling;const log=document.createElement('div');log.setAttribute('role','log');log.setAttribute('aria-live','polite');document.body.append(log);
 owner.onkeydown=event=>{if(event.key!=='ArrowDown')return;owner.setAttribute('aria-expanded','true');owner.setAttribute('aria-controls','constructed-options');const list=document.createElement('div');list.id='constructed-options';list.setAttribute('role','listbox');list.style.cssText='position:fixed;left:20px;top:20px;width:200px;background:white;z-index:10000';const option=document.createElement('div');option.setAttribute('role','option');option.textContent='4 guests';list.append(option);document.body.append(list);
 option.onclick=()=>{list.hidden=${JSON.stringify(mode!=='missing-expanded-open')};${mode.startsWith('missing-expanded')?"owner.removeAttribute('aria-expanded');":"owner.setAttribute('aria-expanded','false');"}
 displayed.textContent=${JSON.stringify(mode==='log-conflict'||mode==='field-label-only'?'2 guests':'4 guests')};log.textContent='4 guests';
 ${mode==='label-conflict'?"const conflict=document.createElement('span');conflict.textContent=owner.getAttribute('aria-label');owner.parentElement.append(conflict);":''}
 ${mode==='field-label-only'?"owner.setAttribute('aria-label','4 guests');":''}
 ${mode==='replaced-owner'?"owner.replaceWith(owner.cloneNode(true));":''}
 const result=document.createElement('p');result.textContent='Constructed selection applied';document.body.append(result);};};`;
 const fixture=await recordedRuntime(await recordedHtml(script));let calls=0;
 const executor=new BrowserTaskExecutor(fixture.runtime,{maxAutomaticElapsedMs:45000,maxModelCallsPerCandidate:4,maxModelCallsTotal:4,maxOperationsPerCandidate:50,modelDecision:{async decide(input){calls++;const field=input.observation.targets.find(t=>t.role==='combobox'&&t.label==='Any party size');
  if(calls===1)return {type:'CLICK',targetRef:field!.ref,reason:'Open the recorded public party input'};
  if(calls===2)return {type:'CHOOSE_OPTION',field:'PARTY_SIZE',targetRef:input.observation.targets.find(t=>t.label==='4 guests'&&t.availableActions?.includes('CHOOSE_OPTION:PARTY_SIZE'))!.ref,reason:'Select the requested party from its observed owner'};
  return {type:'REQUEST_HUMAN_HELP',reason:'The chosen value did not pass its readback'};
 }}});
 const signal=new AbortController().signal;
 try{const session=await executor.acquire(signal,'TABLECHECK','AVAILABILITY',tableCheckPublicReadNetworkPolicy);
 await executor.navigate({source:'TABLECHECK',stage:'AVAILABILITY',session,signal,url:recordedUrl,allowedOrigins:[new URL(recordedUrl).origin],observed:true});
 const result=await executor.runSkill({taskId:'readonly:'+mode,source:'TABLECHECK',stage:'AVAILABILITY',session,signal,allowedOrigins:[new URL(recordedUrl).origin],goal:{outlet:{name:'Recorded merchant'},partySize:4,hardCriteria:[]},objective:'Select the authoritative party on the observed control.',completion:page=>({complete:page.text.includes('Constructed selection applied'),reason:'Await verified selection',resultKey:page.text,resultBusy:false})});
 assert.equal(result.status==='COMPLETED',mode==='closed'||mode==='missing-expanded-closed',JSON.stringify({mode,status:result.status,calls,controls:result.controls.filter(c=>c.role==='combobox')}));
 assert.deepEqual(fixture.scriptErrors,[]);
 const nativeReadings=fixture.snapshots.flatMap(s=>(s.interactiveState??'').split('\n').filter(Boolean).map(row=>JSON.parse(row))).filter(row=>row.tag==='INPUT'&&row.role==='combobox');
 assert.ok(nativeReadings.length&&nativeReadings.every(row=>row.value===''),'Native input value stays empty throughout');
 assert.ok(result.controls.filter(c=>c.role==='combobox'&&c.structure?.tag==='INPUT').every(c=>c.value===''));
 }finally{await executor.closeAll();await fixture.close();}
});
