import { mkdir,readFile,writeFile } from "node:fs/promises";
import { join,resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { ModelGateway } from "../../../../core/model/contracts.js";
import type { RestaurantSemanticProposal } from "../../../../domains/restaurant/semantic-proposal.js";
import { GooglePlacesClient } from "../../../../integrations/google/google-places-client.js";
import { strictAction } from "../../../../harness/restaurant-read-test-fixtures.js";
import { localFixture,exactGuideAvailabilityUrl } from "../../../../harness/browser/browser-read-test-fixtures.js";
import { g6Fixture } from "./fixtures.js";
import { runG6Batch,loadG6Pack,type G6Pack } from "./runner.js";
import { developmentRequestSHA } from "./development-pack.js";

/** Wiring-only LOCAL_CONSTRUCTION. Public request bytes are unchanged; no
 * statement about either real restaurant or its current inventory is made. */
export async function dryRunDevelopment(pack:G6Pack,out:string,s0At?:string){
  await mkdir(out,{recursive:false});let now=Date.parse("2026-11-03T06:00:00Z"),slot="";
  const events:Array<{slot:string;kind:string;url?:string}>=[],getRecords:Array<{slot:string;url:string;at:number}>=[];
  const seed=await g6Fixture(),s=seed.source,id="praxis:restaurant:bd287442c716ac7439273cc9";
  const tc="https://www.tablecheck.com/en/shops/g6-development-sushi/reserve",tcQuery=exactGuideAvailabilityUrl(tc,s.date,2,s.time),tcLink=tc+"?start_date="+s.date+"&start_time=19%3A00&num_people=2";
  const local:G6Pack={...pack,mode:"FIXTURE",cases:pack.cases.map(c=>({...c,oracle:{request:{dates:[s.date],partySize:2,time:s.time},
    pages:(c.id==="D2"||c.id==="D8"?[tc,tcQuery]:[s.pageUrl]).map(url=>({ref:"local-"+url,candidateId:id,url,name:s.outlet.name,address:s.outlet.address,merchantText:s.merchantQuote,observedLinks:[tcLink]})),
    ...(c.id==="D4"?{questions:[{candidateId:id,expected:"ANSWERED" as const,approvedAnswers:[s.merchantQuote],sensitiveCategory:"NONE"}]}:{})}}))};
  if(developmentRequestSHA(local)!==developmentRequestSHA(pack))throw Error("Dry run must not alter any configured user turn");
  const budgetPath=join(out,"fixture-budget.json");await writeFile(budgetPath,JSON.stringify({entries:[],limits:{evaluationPublicGET:20,fullLive:26,realModelCalls:1600},cumulative:{evaluationPublicGET:0,restaurantWebsiteRequests:0,googleRequests:0,fullLive:0,realModelCalls:0}},null,2));
  const batch=await runG6Batch(local,{budgetPath,now:()=>now,wait:async ms=>{now+=ms;},async witnessFetch(url,init){
    const u=new URL(String(url));if(init?.credentials!=="omit"||init.redirect!=="manual")throw Error("Unsafe fixture witness request configuration");
    getRecords.push({slot,url:String(url),at:now});events.push({slot,kind:"WITNESS_IO",url:String(url)});
    if(!u.pathname.includes("find_vacancy")){
      const w=pack.cases.find(c=>c.witness?.detailUrl===String(url))?.witness;if(!w)throw Error("Unconfigured fixture detail URL");
      return new Response("LOCAL_CONSTRUCTION_NOT_PUBLIC_CERTIFICATION\n"+w.identityText.join("\n"));
    }
    const sourceId=u.searchParams.get("rst_id")!,date=u.searchParams.get("svd")!,members=Number(u.searchParams.get("svps"));
    const body={base_date:{year:Number(date.slice(0,4)),month:Number(date.slice(4,6)),day:Number(date.slice(6,8))},members,selection:slot===s0At&&sourceId==="13123456"?[]:[{time:"19:00",url:`https://tabelog.com/en/booking/form_course/new?rcd=${sourceId}&visit_date=${date}&visit_time=1900&member=${members}`} ]};
    return new Response(JSON.stringify(body));
  },async transports(spec,_recording,hooks){
    slot=spec.id;events.push({slot,kind:"SLOT_TRANSPORTS_CREATED"});const f=await g6Fixture();f.clock.advance(now-f.clock.now().valueOf());let semanticRound=0;const factAttempts=new Set<string>();
    const tablecheck=spec.id==="D2"||spec.id==="D8";
    const model:ModelGateway={async complete(request){events.push({slot:spec.id,kind:"MODEL:"+request.purpose});let body:unknown;
      if(request.purpose==="restaurant_semantic_interpret"){
        semanticRound++;const message=JSON.parse(request.messages.find(m=>m.role==="user")!.content.slice("User restaurant message as JSON string: ".length));
        const recommendation=spec.id==="D6"&&semanticRound===1;
        const target={field:"TARGET" as const,operation:semanticRound===1?"ASSERT" as const:"CORRECT" as const,value:{kind:"TARGET" as const,goal:recommendation?"RECOMMENDATION" as const:"AVAILABILITY" as const,query:semanticRound===1?"restaurant in Shibuya":s.outlet.name,selectionScope:semanticRound===1?"OPEN_ENDED" as const:"SPECIFIC_OUTLET" as const,...(semanticRound===1?{requestedResultCount:1}:{}),goalBasis:{type:recommendation?"JUDGMENT" as const:"BOOKING_WORDING" as const,reason:"LOCAL wiring fixture mapping only; not real request quality",quotes:[message]}}};
        const date={field:"DATE" as const,operation:"ASSERT" as const,value:{kind:"DATE" as const,value:s.date,raw:"November 11, 2026"}},party={field:"PARTY_SIZE" as const,operation:"ASSERT" as const,value:{kind:"PARTY_SIZE" as const,value:2,source:"EXPLICIT" as const}},time={field:"TIME_WINDOW" as const,operation:"ASSERT" as const,value:{kind:"TIME_WINDOW" as const,earliest:s.time,latest:s.time,raw:"7 PM"}},area={field:"AREA" as const,operation:"ASSERT" as const,value:{kind:"AREA" as const,query:"Shibuya"}};
        const facts=spec.id==="D5"&&semanticRound===2?[date]:spec.id==="D6"&&semanticRound===3?[party]:semanticRound>1?spec.id==="D6"?[target,date,time]:[target]:recommendation?[target,area]:spec.id==="D5"?[target,time,party,area]:[target,date,time,party,area];
        body={schemaVersion:"4",facts} satisfies RestaurantSemanticProposal;
      }else if(request.purpose==="restaurant_agent_decide"){
        const c=JSON.parse(request.messages.find(m=>m.role==="user")!.content).context,ids=c.candidates.map((v:{id:string})=>v.id),first=ids[0],eligible=c.presentation.filter((p:{eligible:boolean})=>p.eligible).map((p:{candidateId:string})=>p.candidateId);
        if(c.missingBlockingFields.length&&c.intentDraft?.target?.goal==="AVAILABILITY")body={...strictAction("ASK_USER"),question:c.missingBlockingFields.includes("date")?"Which date would you like?":"How many people?",relatedFields:c.missingBlockingFields};
        else if(!ids.length&&c.searchAvailability.available)body=strictAction("SEARCH_RESTAURANTS");
        else if(c.intentDraft?.target?.goal==="RECOMMENDATION")body=eligible.length?strictAction("PRESENT_RESULTS",eligible):strictAction("INVESTIGATE_CANDIDATE_FACTS",ids.slice(0,1));
        else if(c.checkableCandidateIds?.length)body=strictAction("CHECK_AVAILABILITY",c.checkableCandidateIds.slice(0,1));
        else if(semanticRound>1&&first&&c.availability[first]?.length&&c.selectedCandidateId!==first)body={...strictAction("SELECT_CANDIDATE"),candidateId:first};
        else if(eligible.length)body=strictAction("PRESENT_RESULTS",eligible);
        else if(c.factInvestigableCandidateIds?.some((id:string)=>!factAttempts.has(id))){const id=c.factInvestigableCandidateIds.find((id:string)=>!factAttempts.has(id));factAttempts.add(id);body=strictAction("INVESTIGATE_CANDIDATE_FACTS",[id]);}
        else if(c.readCompletion.allowed)body=strictAction("END_READ");else if(c.searchAvailability.available)body=strictAction("SEARCH_RESTAURANTS");else body={...strictAction("ASK_USER"),question:"I could not verify a result within this bounded search."};
      }else return f.model.complete(request);
      return {invocationId:"development-dry:"+spec.id,provider:"FIXTURE",model:"LOCAL_WIRING_ONLY",outputText:JSON.stringify(body),latencyMs:0,finishReason:"TOOL_CALLS"};
    }};
    const google=new GooglePlacesClient({apiKey:"local-development-fixture-key",fetchImplementation:hooks.googleFetch(async(url,init)=>{
      events.push({slot:spec.id,kind:"GOOGLE_IO",url:String(url)});const response=await f.googleFetch(url,init);const data=await response.json() as {places?:Array<Record<string,unknown>>;id?:string;websiteUri?:string};
      if(tablecheck){for(const p of data.places??[])if(p.id===s.outlet.id)p.websiteUri=tc;if(data.id===s.outlet.id)data.websiteUri=tc;}return new Response(JSON.stringify(data));
    })});
    const raw=tablecheck?localFixture({[tc]:await readFile(new URL("../cases/g6-development/tablecheck.html",import.meta.url),"utf8"),[tcQuery]:await readFile(new URL("../cases/g6-development/tablecheck.html",import.meta.url),"utf8")}):undefined;
    const browser=raw?{async openSession(input:Parameters<typeof raw.openSession>[0]){events.push({slot:spec.id,kind:"BROWSER_IO"});return raw.openSession(input);}}:f.browser;
    return {model,google,browser,clock:f.clock};
  }},join(out,"runs"));
  const monotonic=events.every((e,i)=>i===0||pack.cases.findIndex(c=>c.id===e.slot)>=pack.cases.findIndex(c=>c.id===events[i-1]!.slot));
  const result={schemaVersion:"g6-development-dry-run@1",mode:"LOCAL_CONSTRUCTION_WIRING_ONLY",originalRequestSHA256:developmentRequestSHA(pack),dryRequestSHA256:developmentRequestSHA(local),samePublicTurns:true,productionEntry:"createLiveReadAssembly",substitutions:["model transport","source I/O","fixture-only independent oracle","FIXTURE mode marker"],notProven:["real restaurant semantics or evidence","C code-owned selection repair","current witness existence"],serialEventBlocks:monotonic,simulatedWitnessGETs:getRecords.length,actualLive:0,actualPublicGET:0,actualRealModel:0,batch,events,getRecords};
  await writeFile(join(out,"dry-run.json"),JSON.stringify(result,null,2)+"\n",{flag:"wx"});return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const [input,sha,out,s0]=process.argv.slice(2);if(!input||!sha||!out)throw Error("Usage: development-dry-run.ts <pack> <SHA> <new-out> [S0 slot]");loadG6Pack(resolve(input),sha).then(pack=>dryRunDevelopment(pack,resolve(out),s0)).then(r=>{console.log(JSON.stringify({serial:r.serialEventBlocks,slots:r.batch.slots,stop:r.batch.stopReason}));}).catch(e=>{console.error(e instanceof Error?e.message:"Dry run failed");process.exitCode=1;});}
