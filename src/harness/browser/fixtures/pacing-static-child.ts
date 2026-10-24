// Minimal synthetic page with20 same-origin CSS/JS, source/date: local fixture 2026-10-25.
import { connectEvalPacing } from "../../../eval/restaurant/agent-loop/runners/eval-pacing.js";
import { installEvalPacingTransports } from "../../../eval/restaurant/agent-loop/runners/eval-paced-transports.js";
import { LocalPlaywrightChromium } from "../../../infrastructure/browser/local-playwright-chromium.js";
const [endpoint,id,origin]=process.argv.slice(2);
const client=await connectEvalPacing(JSON.parse(endpoint!),id!);
let leases=0;const acquire=client.acquire.bind(client);client.acquire=async url=>{leases++;return acquire(url);};
process.send?.({stage:"ENTERED"});
process.on("message",async message=>{
 if(message!=="start")return;
 const restore=installEvalPacingTransports(client,[origin!]),controller=new AbortController();
 let session:Awaited<ReturnType<LocalPlaywrightChromium["openSession"]>>|undefined;
 try{
  session=await new LocalPlaywrightChromium().openSession({signal:controller.signal,networkPolicy:{documentOrigins:[origin!],genericPublicRead:true,staticResources:[],dynamicReads:[]}});
  const url=`${origin}/${id}/doc`;await session.prepareNavigation?.(url);await session.navigate(url,{waitUntil:"load",timeoutMs:10_000});
  process.send?.({stage:"DONE",usage:await client.usage(),leases,text:(await session.snapshot()).text});
 }catch(error){process.send?.({stage:"ERROR",error:String(error)});}
 finally{controller.abort();await session?.close();restore();}
});
