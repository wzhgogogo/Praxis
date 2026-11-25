import assert from'node:assert/strict';import test from'node:test';import{readFile}from'node:fs/promises';import{createHash}from'node:crypto';
import{sourceListingCompletion}from'../integrations/restaurant-search/native-restaurant-search.js';import{tabelogDiscoveryPack}from'../integrations/restaurant-search/source-packs.js';import{independentVisibleText}from'../eval/restaurant/agent-loop/g6/source-document.js';
const base=new URL('./browser/fixtures/r2-scope/',import.meta.url),manifest=JSON.parse(await readFile(new URL('manifest.json',base),'utf8'));
for(const meta of manifest)test(`actual recorded list scope: ${meta.name}`,async()=>{
 const html=await readFile(new URL(meta.file,base),'utf8');assert.equal(createHash('sha256').update(html).digest('hex'),meta.sha256);const page={url:meta.url,title:meta.title,html,text:independentVisibleText(html)};
 assert.equal(sourceListingCompletion(tabelogDiscoveryPack,page,[],'robatayaki',{label:'Nakano City',queryLabel:'Nakano'}).complete,meta.name==='exact','only exact scope, not location, a parent category, menu item or card classification');
 assert.equal(sourceListingCompletion(tabelogDiscoveryPack,page,[],'',{label:'Nakano City',queryLabel:'Nakano'}).complete,true,'location-only browsing is unchanged');
 if(meta.name==='exact'){const outlets=tabelogDiscoveryPack.parseListing(page).outlets;assert.equal(outlets.length,1);assert.equal(outlets[0]!.sourceEntityId,'en/tokyo/A1319/A131902/13309182');assert.equal(outlets[0]!.sourceUrl,'https://tabelog.com/en/tokyo/A1319/A131902/13309182/');}
});
test('whole-list title cannot be replaced by one matching card or a filled input',()=>{
 const page={url:'https://fixture.test/list',title:'Restaurants in District',text:'District '+ 'Requested cuisine on one merchant',html:'',visibleHtml:'<h3>Requested cuisine</h3>'};const pack={...tabelogDiscoveryPack,parseListing:()=>({outlets:[{sourceEntityId:'one',sourceUrl:'https://fixture.test/one',outletName:'One'}]})};
 assert.equal(sourceListingCompletion(pack,page,[],'Requested cuisine',{label:'District'}).complete,false);
 assert.equal(sourceListingCompletion(pack,{...page,visibleHtml:'<h1>Requested cuisine in District</h1>'},[],'Requested cuisine',{label:'District'}).complete,true,'public primary heading is whole-list scope');
});
