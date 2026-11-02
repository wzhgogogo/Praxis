import assert from "node:assert/strict";
import test from "node:test";
import {bookingTermsComposition} from "./fixtures/booking-terms-composition.js";

type Fixture=Awaited<ReturnType<typeof bookingTermsComposition>>;
function atRemaining(f:Fixture,deadline:string,remaining:number){
  const advance=Date.parse(deadline)-f.clock.now().valueOf()-remaining;assert.ok(advance>=0);f.clock.advance(advance);
}
async function capture(f:Fixture,label:string){
  const value={label,...await f.artifact()};
  if(process.env.PRAXIS_B1_RESERVE_CAPTURE==="1")console.log("B1_RESERVE_RAW "+Buffer.from(JSON.stringify(value)).toString("base64"));
  return value;
}
const starts=(f:Fixture,event:string)=>f.timeline.filter(x=>x.turn==="SELECTED"&&x.event===event);
const models=(f:Fixture)=>starts(f,"MODEL_BEGIN").filter(x=>x.detail.purpose==="restaurant_page_question");

for(const remaining of [20_001,20_000])test(`B1 reserve boundary ${remaining}ms uses the actual assembly and preserves its link`,async()=>{
  let f!:Fixture;f=await bookingTermsComposition({beforeTerms:deadline=>atRemaining(f,deadline,remaining)});
  try{await f.initial();const view=await f.select();assert.ok(view.restaurant.bookingHandoffs?.length);
    const record=await capture(f,"boundary-"+remaining);
    assert.equal(starts(f,"TERMS_BEGIN")[0]!.detail.remainingMs,remaining);
    if(remaining===20_001)assert.ok(starts(f,"FACTS_PAGE_BEGIN").length>0,"More than the reserve permits a source-page start");
    else{assert.equal(starts(f,"FACTS_SESSION_BEGIN").length,0,"At 20000ms no source acquisition may begin");assert.equal(models(f).length,0,"At 20000ms no question model may begin");assert.deepEqual(record.view.restaurant.bookingHandoffs![0]!.terms,[]);}
  }finally{await f.close();}
});

test("B1 rechecks reserve after cancellation answer and before the card model",async()=>{
  let f!:Fixture,deadline="",questions=0;
  f=await bookingTermsComposition({beforeTerms:value=>{deadline=value;atRemaining(f,value,30_000);},onQuestion:()=>{if(++questions===1)atRemaining(f,deadline,20_000);}});
  try{await f.initial();const view=await f.select();await capture(f,"between-models");
    assert.equal(models(f).length,1,"No card model starts after crossing into the reserve");assert.ok(view.restaurant.bookingHandoffs?.length);assert.deepEqual(view.restaurant.bookingHandoffs![0]!.terms,[]);
  }finally{await f.close();}
});

test("B1 rechecks reserve before an observed language navigation inside G1 capture",async()=>{
  let f!:Fixture,deadline="",crossed=false;
  f=await bookingTermsComposition({conflict:true,beforeTerms:value=>{deadline=value;atRemaining(f,value,30_000);},afterFactControls:()=>{if(!crossed){crossed=true;atRemaining(f,deadline,20_000);}}});
  try{await f.initial();const view=await f.select();await capture(f,"before-language-navigation");
    assert.ok(crossed);assert.equal(starts(f,"FACTS_PAGE_BEGIN").length,1,"Observed translation navigation cannot start in the reserve");assert.equal(models(f).length,0);assert.ok(view.restaurant.bookingHandoffs?.length);assert.deepEqual(view.restaurant.bookingHandoffs![0]!.terms,[]);
  }finally{await f.close();}
});

test("B1 in-flight read inherits deadline minus reserve, not the whole deadline",async()=>{
  let f!:Fixture,release!:()=>void,seen!:()=>void;
  const gate=new Promise<void>(r=>release=r),started=new Promise<void>(r=>seen=r);
  f=await bookingTermsComposition({beforeTerms:deadline=>atRemaining(f,deadline,20_001),onFactNavigate:async()=>{seen();await gate;}});
  let work:Promise<unknown>|undefined;
  try{await f.initial();work=f.select();let timer:ReturnType<typeof setTimeout>|undefined;
    try{await Promise.race([started,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error("Source read did not start")),5000);})]);}finally{if(timer)clearTimeout(timer);}
    const signal=f.termsSignal;assert.ok(signal);
    await new Promise<void>((resolve,reject)=>{if(signal.aborted){resolve();return;}const timeout=setTimeout(()=>reject(new Error("Source read must abort at deadline minus the 20 second reserve")),1000);signal.addEventListener("abort",()=>{clearTimeout(timeout);resolve();},{once:true});});
    f.clock.advance(1);release();await work;const view=await f.project();await capture(f,"early-abort");
    assert.ok(view.restaurant.bookingHandoffs?.length);assert.deepEqual(view.restaurant.bookingHandoffs![0]!.terms,[]);assert.equal(models(f).length,0);
  }finally{release();if(work)await work;await f.close();}
});

test("B1 measures durable assistant append after optional terms or omission",async()=>{
  for(const delay of [0,40]){
    const f=await bookingTermsComposition({onQuestion:async()=>{if(delay)await new Promise(resolve=>setTimeout(resolve,delay));}});
    try{await f.initial();await f.select();const begin=starts(f,"TERMS_BEGIN")[0]!,end=starts(f,"TERMS_END")[0]!,append=starts(f,"ASSISTANT_APPENDED")[0]!,finish=starts(f,"READ_FINISHED")[0]!;
      const ready=starts(f,"RESULTS_VISIBLE").find(x=>x.detail.selected===true&&x.detail.active===true)!;
      assert.ok(ready);assert.ok(ready.elapsedMs<=begin.elapsedMs);assert.ok(end.elapsedMs<=finish.elapsedMs&&finish.elapsedMs<=append.elapsedMs);
      assert.equal(models(f).length,2);
      const value=await capture(f,"assistant-wait-"+delay);
      if(process.env.PRAXIS_B1_RESERVE_CAPTURE==="1")console.log("B1_ASSISTANT_WAIT "+JSON.stringify({label:value.label,configuredModelDelayMs:delay*2,termsMs:end.elapsedMs-begin.elapsedMs,assistantAfterReadyMs:append.elapsedMs-ready.elapsedMs,appendAfterTermsMs:append.elapsedMs-end.elapsedMs}));
    }finally{await f.close();}
  }
});
