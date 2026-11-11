// Offline red evidence only. No browser, network, credentials or model ports.
import assert from "node:assert/strict";
import {readFile,writeFile} from "node:fs/promises";
import {PlaywrightReadNetworkGuard} from "../../../src/infrastructure/browser/playwright-read-network-guard.js";
import {tabelogPublicReadNetworkPolicy} from "../../../src/integrations/tabelog/tabelog-public-query.js";
import {namedOutletContainment} from "../../../src/domains/restaurant/named-outlet-resolution.js";
const directory=new URL("./",import.meta.url);
const har=JSON.parse(await readFile(new URL("../d4-d8-real-pages-20261105/stop3/recordings/D4-CAPTURE-APPROVED/source/replay.har",import.meta.url),"utf8"));
const observed=har.log.entries.find((entry:any)=>entry.request.method==="GET"&&new URL(entry.request.url).pathname==="/en/rstLst/").request.url;
const values={FICTIONAL_PERSON_NAME:"Alice Williams",FICTIONAL_PHONE:"+1-202-555-0100",FICTIONAL_EMAIL:"alice@example.invalid",UNOBSERVED_VALUE:"not-present-in-the-observed-form"};
const rows=[];
for(const [kind,value]of Object.entries(values)){
 const url=new URL(observed);url.searchParams.set("pal",value);
 const guard=new PlaywrightReadNetworkGuard({...tabelogPublicReadNetworkPolicy,genericPublicRead:true});
 let dispatched=false;
 const request={url:()=>url.toString(),method:()=>"GET",resourceType:()=>"document",headerValue:async()=>null,postData:()=>null};
 await (guard as any).handle({request:()=>request,abort:async()=>{},fulfill:async()=>{},fetch:async()=>{
  dispatched=true;return {status:()=>200,headers:()=>({}),body:async()=>Buffer.from("LOCAL_TEST_NO_NETWORK")};
 }},false);
 rows.push({case:kind,expected:"REJECTED",actual:dispatched?"TRANSPORT_CALLED":"REJECTED",queryShapeChanged:false,realRequests:0});
}
const unsupported=namedOutletContainment("Kushi Katsu Dengana Akabane ten","Dengana Akabane","Tokyo Kita City Akabane 1-15-1",["Akabane"]);
await writeFile(new URL("current-red-evidence.json",directory),JSON.stringify({baseline:"ebfc619c",mode:"OFFLINE_CONTRACT_COUNTEREXAMPLES_NOT_LIVE",input:"Actual D4 ten-key URL; fictional/adversarial value mutations, no personal data collected",requests:rows,unsupportedNameExtras:{expected:false,actual:unsupported,sourceWordsSupplied:false},paidCalls:{model:0,google:0,website:0,live:0}},null,2)+"\n");
assert.ok(rows.every(row=>row.actual==="REJECTED")&&!unsupported,"Current source-key exception and fixed name-word exemption violate the newly approved contract");
