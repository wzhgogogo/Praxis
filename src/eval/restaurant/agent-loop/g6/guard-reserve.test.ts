import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { mkdir,writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright-core";
import { LocalPlaywrightChromium } from "../../../../infrastructure/browser/local-playwright-chromium.js";
import { bookingTermsComposition } from "../../../../application/fixtures/booking-terms-composition.js";
import { createG6Session } from "./session.js";
import { g6Fixture } from "./fixtures.js";

async function capture(name:string,value:unknown){if(process.env.PRAXIS_G6_CAPTURE_DIR){await mkdir(process.env.PRAXIS_G6_CAPTURE_DIR,{recursive:true});await writeFile(join(process.env.PRAXIS_G6_CAPTURE_DIR,name+".json"),JSON.stringify(value,null,2)+"\n",{flag:"wx"});}}

test("G6 capability Guard: actual production assembly admits current public data and blocks workflow before source transport",async()=>{
  const f=await g6Fixture(),arrivals:Array<{url:string;method:string}>=[],pages:unknown[]=[];
  const html=f.html.replace("</body>",`<script>fetch(${JSON.stringify(f.source.vacancy.url)}).catch(()=>{});fetch('/yoyaku/tabelog_booking/confirm',{method:'POST',body:'{}'}).catch(()=>{})</script></body>`);
  const server=createServer((req,res)=>{
    const url=new URL(req.url!,"http://localhost").searchParams.get("source")!;arrivals.push({url,method:req.method!});
    if(url===f.source.pageUrl){res.setHeader("content-type","text/html");res.end(html);}
    else if(url===f.source.vacancy.url){res.setHeader("content-type","application/json");res.end(JSON.stringify(f.source.vacancy.body));}
    else{res.statusCode=404;res.setHeader("content-type","text/html");res.end("No constructed response for this entrance");}
  });server.listen(0,"127.0.0.1");await once(server,"listening");const base=`http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  // Keep the actual Runtime/Guard/Route. Only its HTTP transport is redirected
  // to our loopback responder after Guard admission. No admission result stub.
  const raw=new LocalPlaywrightChromium({browserType:{async launch(options){
    const browser=await chromium.launch(options),newContext=browser.newContext.bind(browser);
    browser.newContext=async opts=>{const context=await newContext(opts),route=context.route.bind(context);
      context.route=async(pattern,handler,options)=>route(pattern,async(original,request)=>{
        const proxy=new Proxy(original,{get(target,key){if(key==="fetch")return (opts:Parameters<typeof target.fetch>[0])=>target.fetch({...opts,url:base+"/?source="+encodeURIComponent(target.request().url())});
          const value=Reflect.get(target,key,target);return typeof value==="function"?value.bind(target):value;}});
        await handler(proxy,request);
      },options);return context;};return browser;
  }}});
  const browser={readNetworkBoundaryCapability:raw.readNetworkBoundaryCapability,async openSession(input:Parameters<typeof raw.openSession>[0]){
    const session=await raw.openSession(input);return new Proxy(session,{get(target,key){if(key==="snapshot")return async()=>{const page=await target.snapshot();pages.push(structuredClone(page));return page;};const value=Reflect.get(target,key,target);return typeof value==="function"?value.bind(target):value;}});
  }};
  const session=await createG6Session({...f,browser});let error:unknown,view;
  try{
    view=await session.create(f.request);assert.equal(view.case.phase,"PRESENT_RESULTS");
    assert.equal(arrivals.some(r=>new URL(r.url).pathname.includes("/yoyaku/tabelog_booking/")),false,"Prohibited workflow must never reach even the fixed source receiver");
    assert.ok(arrivals.some(r=>r.url===f.source.vacancy.url),"A legal current vacancy read must still reach source I/O");
    const requests=pages.flatMap(p=>(p as {networkRequests?:Array<{outcome:string;pathname:string}>}).networkRequests??[]);
    assert.ok(requests.some(r=>r.outcome==="BLOCKED"&&r.pathname.includes("/yoyaku/tabelog_booking/")),"Actual production Guard rejection must be observed");
  }catch(e){error=e;throw e;}finally{
    await capture("GUARD",{status:error?"FAIL":"PASS",error:error instanceof Error?error.message:null,view,arrivals,pages,calls:session.calls});
    await session.close();const closed=once(server,"close");server.close();server.closeAllConnections();await closed;
  }
});

test("G6 capability F6: source time crossing leaves only bounded honest ending in the actual root composition",async()=>{
  const f=await g6Fixture(),origin=f.clock.now().valueOf();let crossed=false;
  const model={async complete(request:Parameters<typeof f.model.complete>[0]){
    if(request.purpose==="restaurant_agent_decide"){
      const c=JSON.parse(request.messages.find(m=>m.role==="user")!.content).context;
      if(c.candidates.length&&!crossed){crossed=true;f.clock.advance(480_000);}
    }return f.model.complete(request);
  }};
  const session=await createG6Session({...f,model});let error:unknown,view;
  try{
    view=await session.create(f.request);assert.ok(crossed);
    assert.equal(f.events.some(e=>Date.parse(e.at)>=origin+480_000),false,"No new source/Google read may start inside the root reserve");
    assert.equal(view.case.phase,"NO_VERIFIED_RESULT","Reserve must conclude honestly rather than ask again or mark internal failure");
  }catch(e){error=e;throw e;}finally{await capture("F6_ROOT",{status:error?"FAIL":"PASS",error:error instanceof Error?error.message:null,view,crossed,sources:f.events,calls:session.calls});await session.close();}
});

test("G6 capability F6 selected-outlet terms: C production assembly preserves B1 at the strict twenty-second boundary",async()=>{
  // Reuse C's reviewed source/model I/O fixture, which itself creates the real
  // factory/application. The clock hook observes a deadline; never returns a
  // business result or injects evidence. Do not duplicate C's terms reader.
  for(const remaining of [20_001,20_000]){
    let f!:Awaited<ReturnType<typeof bookingTermsComposition>>;
    f=await bookingTermsComposition({beforeTerms:deadline=>f.clock.advance(Date.parse(deadline)-f.clock.now().valueOf()-remaining)});
    try{
      await f.initial();const view=await f.select();assert.ok(view.restaurant.bookingHandoffs?.length);
      const starts=f.timeline.filter(x=>x.turn==="SELECTED");
      if(remaining===20_001)assert.ok(starts.some(x=>x.event==="FACTS_PAGE_BEGIN"));
      else{
        assert.equal(starts.some(x=>x.event==="FACTS_SESSION_BEGIN"),false);
        assert.equal(starts.some(x=>x.event==="MODEL_BEGIN"&&x.detail.purpose==="restaurant_page_question"),false);
        assert.deepEqual(view.restaurant.bookingHandoffs[0]!.terms,[]);
      }
      await capture("F6_TERMS_"+remaining,await f.artifact());
    }finally{await f.close();}
  }
});
