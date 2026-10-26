/** Minimal synthetic distinctions; no source transport, model or generated qualification. */
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {tabelogRequestedDateState,hasTabelogSelectedQuery} from '../../../src/integrations/tabelog/tabelog-query-controls.js';
import {parseTabelogAvailabilitySlots} from '../../../src/integrations/tabelog/tabelog-page-parser.js';
import {hasTableCheckSelectedRequest,parseTableCheckAvailabilitySlots,parseTableCheckScopedMenuExcerpts} from '../../../src/integrations/tablecheck/tablecheck-page-parser.js';
import type {BrowserSnapshot,BrowserPageControl} from '../../../src/infrastructure/browser/browser-runtime.js';
const date='2026-11-03',partySize=2,tabelog='https://tabelog.com/en/tokyo/A1301/A130101/123/',tc='https://www.tablecheck.com/en/fixture';
const snapshot=(html:string,url=tabelog,text?:string):BrowserSnapshot=>({url,html,text:text??html.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(),title:'Synthetic source',interactiveState:''});
const classes=(html:string)=>html.replace(/\sclass=(?:"[^"]*"|'[^']*')/g,'');
const rows:unknown[]=[];
function distinguish(id:string,a:BrowserSnapshot,b:BrowserSnapshot,erase:(html:string)=>string,observe:(snapshot:BrowserSnapshot)=>unknown,expectedA:unknown,expectedB:unknown){
 assert.equal(a.url,b.url);assert.equal(a.text,b.text);assert.equal(a.interactiveState,b.interactiveState);assert.equal(erase(a.html),erase(b.html));
 const actualA=observe(a),actualB=observe(b);assert.deepEqual(actualA,expectedA);assert.deepEqual(actualB,expectedB);assert.notDeepEqual(actualA,actualB);
 rows.push({id,mode:'SYNTHETIC_CONTRACT_DISTINCTION',inputs:{a,b},actualA,actualB,sameRemainingObservationAfterRetirement:true,realCalls:0});
}
const calendar=(state:string)=>snapshot(`<div class="p-booking-calendar"><table class="p-booking-calendar__calendar"><caption><em>Nov 2026</em></caption><tr><td><span class="p-booking-calendar__day-num p-booking-calendar__day-num--${state}">3</span></td></tr></table></div>`);
distinguish('L1',calendar('closed'),calendar('full'),classes,s=>tabelogRequestedDateState(s,date),'CLOSED','FULL');
const selected=(first:string,second:string)=>snapshot(`<div class="p-booking-calendar"><button class="is-selected" data-year="2026" data-month="11" data-day="3">3</button><div class="${first}"><button class="is-selected" data-value="2">2</button></div><div class="${second}"><button class="is-selected" data-value="4">4</button></div></div>`);
distinguish('L2/L3',selected('p-booking-calendar__people-button-box','other'),selected('other','p-booking-calendar__people-button-box'),classes,s=>hasTabelogSelectedQuery(s,date,partySize),true,false);
const slot=(state:string,url=tabelog)=>snapshot(`<section data-selected-date="${date}" data-pax="2" data-query-state="complete"><button class="time-slot ${state}" data-time="19:00">19:00</button></section>`,url);
distinguish('L4',slot('is-available'),slot('unavailable'),classes,s=>parseTabelogAvailabilitySlots(s).availableSlots,['19:00'],[]);
const widget=(d:string,p:number)=>`<form><button data-testid="day" data-date="${d}" aria-selected="true">3</button><div data-testid="Venue Pax Select" id="pax-${p}"></div><div data-testid="Venue Time Select" id="time-19:00"></div></form>`;
distinguish('L5',snapshot(`<div data-testid="Venue Availability">${widget(date,2)}</div><div>${widget('2026-11-04',4)}</div>`,tc),snapshot(`<div>${widget(date,2)}</div><div data-testid="Venue Availability">${widget('2026-11-04',4)}</div>`,tc),html=>html.replace(/\sdata-testid="Venue Availability"/g,''),s=>hasTableCheckSelectedRequest(s,date,partySize),true,false);
const link=(d:string)=>`<a href="/en/shops/fixture/reserve?start_date=${d}&amp;num_people=2&amp;start_time=19:00">19:00</a>`;
distinguish('L6',snapshot(`<div hidden>${link(date)}</div><div>${link('2026-11-04')}</div>`,tc,'19:00'),snapshot(`<div>${link(date)}</div><div hidden>${link('2026-11-04')}</div>`,tc,'19:00'),html=>html.replace(/\shidden(?=\s|>)/g,''),s=>parseTableCheckAvailabilitySlots(s,{date,partySize,timeWindow:{earliest:'19:00',latest:'19:00'}}).availableSlots,[],['19:00']);
distinguish('L8',slot('is-available',tc),slot('unavailable',tc),classes,s=>parseTableCheckAvailabilitySlots(s,{date,partySize}).availableSlots,['19:00'],[]);
const scope:BrowserPageControl={id:'sushi',stableKey:'sushi',kind:'RADIO',role:'radio',label:'Sushi',value:'sushi',visible:true,disabled:false,structure:{tag:'INPUT',name:'reservation[service_category]',classes:[],dialogLabel:'',formClass:'menu',sliderCount:0,radioGroupKey:'form:menu'}};
const menu=(name:string)=>snapshot(`<article class="${name}"><h3>Sushi Omakase</h3><div data-service-categories='["sushi"]'></div><p>JPY12,000 Dinner course</p></article>`,tc);
distinguish('L10-retained-container-boundary',menu('menu-item'),menu('menu-item-title'),classes,s=>parseTableCheckScopedMenuExcerpts(s,[scope]).length,1,0);
await writeFile(resolve(process.argv[2]!),JSON.stringify({status:'PASS',sourceCapabilities:'Current parsers must distinguish these source states; deleting the distinguishing input without an existing equivalent observation cannot preserve the positive/negative contracts.',rows,newRealCalls:0},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'PASS',distinctions:rows.length,realCalls:0}));
