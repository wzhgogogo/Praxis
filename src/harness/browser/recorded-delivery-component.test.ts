import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {inspectTabelogVacancyResponse} from '../../integrations/tabelog/tabelog-vacancy-response.js';
import {parseTabelogOutletIdentityWithEvidence} from '../../integrations/tabelog/tabelog-page-parser.js';
import {prepareBookingHandoff,presentBookingHandoff} from '../../domains/restaurant/booking-handoff.js';
import {completeRestaurantIntent} from '../../domains/restaurant/intent-state.js';

// Actual D4 retained DOM + actual JSON, with original recorded domain context.
// Component replay, not full assembly/Guard/identity acceptance: snapshot7 was
// unqualified because other dynamic responses were not captured. The response
// envelope is a projection for this parser, never a fabricated HTTP response.
test('D4 actual delivered source JSON and DOM still produce the identical admitted B1 link',async()=>{
 const base='.eval-artifacts/phase3b/d4-d8-live-20261106/snapshot-fix-D4-runtime/runs/D4/D4/',dir=base+'recordings/g6-D4-1793957094537-0/';
 const manifest=JSON.parse(await readFile(new URL('./fixtures/recorded-closeout/manifest.json',import.meta.url),'utf8'));
 for(const [file,hash]of Object.entries(manifest.components.D4.files))assert.equal(createHash('sha256').update(await readFile(base+file)).digest('hex'),hash);
 const recording=JSON.parse(await readFile(dir+'recording.json','utf8')),original=JSON.parse(await readFile(base+'execution.result.json','utf8'));
 const recordedPage=recording.pages.find((p:any)=>p.snapshot===7);assert.equal(recordedPage.reason,'UNCAPTURED_DYNAMIC_RESPONSE');
 const html=await readFile(dir+recordedPage.diagnostic.file,'utf8'),har=JSON.parse(await readFile(dir+'replay.har','utf8'));
 const response=har.log.entries.find((e:any)=>e.request.url.includes('/find_vacancy?'));assert.equal(response.response.status,200);
 const view=original.view,state=original.execution.finalSnapshot.domainState,handoff=view.restaurant.bookingHandoffs[0],candidate=state.candidates.find((c:any)=>c.restaurant.id===handoff.candidateId);
 const evidence=state.readEvidence.find((e:any)=>e.kind==='AVAILABILITY'&&e.candidateId===handoff.candidateId&&e.provider==='TABELOG');
 const request=completeRestaurantIntent(state.intentDraft)!;
 const page={url:recordedPage.url,html,text:html.replace(/<[^>]*>/g,' '),title:handoff.candidateId,
  responses:[{url:response.request.url,status:200,observedAt:evidence.observedAt,sequence:1,body:JSON.parse(response.response.content.text)}]};
 const parsed=parseTabelogOutletIdentityWithEvidence(page,{sourceEntityId:evidence.sourceEntityId,sourceUrl:page.url,outletName:''});
 assert.ok(parsed.outlet.outletName);assert.ok(html.includes('Dengana'));
 const vacancy=inspectTabelogVacancyResponse(page,request.date,request.partySize);assert.equal(vacancy.status,'OBSERVED');if(vacancy.status!=='OBSERVED')return;
 const link=vacancy.formCourseLinks.find(l=>l.time==='19:00')!;assert.ok(link);
 const url=link.url.startsWith('/')?'https://tabelog.com'+link.url:link.url;assert.equal(url,handoff.url);
 const offer=state.availability[handoff.candidateId].find((o:any)=>o.id===handoff.offerId),context={candidate,offer,check:state.availabilityChecks[handoff.candidateId],request,evidence:state.readEvidence,now:evidence.observedAt};
 const source={provider:'TABELOG' as const,linkBasis:'SOURCE_RESPONSE' as const,candidateId:handoff.candidateId,offerId:offer.id,sourceEntityId:evidence.sourceEntityId,availabilityEvidenceId:evidence.evidenceId,observedAt:evidence.observedAt,url};
 const prepared=prepareBookingHandoff(source,context);assert.ok(prepared);assert.equal(presentBookingHandoff(prepared,context)?.url,handoff.url);
 assert.equal(prepareBookingHandoff({...source,url:url.replace('1900','2000')},context),undefined,'Different clock cannot inherit D4 inventory');
 assert.equal(prepareBookingHandoff({...source,url:url.replace('13108466','13999999')},context),undefined,'Other shop cannot inherit D4 inventory');
});
