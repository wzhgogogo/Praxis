import{appendFileSync,mkdirSync,writeFileSync}from"node:fs";
import{resolve}from"node:path";
const nativeFetch=globalThis.fetch;
const output=process.env.PRAXIS_SEMANTIC_RUN_DIR;
if(!output)throw Error("Missing frozen semantic run directory");
let calls=0;mkdirSync(output,{recursive:true});
globalThis.fetch=async(input,init)=>{
  const url=new URL(typeof input==="string"?input:input instanceof URL?input.href:input.url);
  if(url.origin!=="https://api.deepseek.com"||!["/chat/completions","/beta/chat/completions"].includes(url.pathname)||init?.method!=="POST")throw Error("Semantic run permits only DeepSeek completions");
  const body=JSON.parse(String(init.body));
  const system=body.messages?.find(m=>m.role==="system")?.content??"";
  // Existing production Schema retries stay unchanged. This run refuses the second transport.
  if(system.includes("The prior completion was invalid.")||calls>=15){
    appendFileSync(resolve(output,"transport.jsonl"),JSON.stringify({type:"BLOCKED",reason:calls>=15?"CALL_LIMIT":"NO_RETRY",at:new Date().toISOString()})+"\n");
    throw Error("Frozen semantic run: no retries and at most fifteen API requests");
  }
  const id=++calls,prefix=resolve(output,"call-"+String(id).padStart(2,"0"));
  writeFileSync(prefix+".request.json",JSON.stringify({url:url.href,body},null,2)+"\n",{flag:"wx"});
  const started=Date.now();
  appendFileSync(resolve(output,"transport.jsonl"),JSON.stringify({type:"STARTED",id,at:new Date().toISOString()})+"\n");
  try{
    const response=await nativeFetch(input,init);
    if(response.ok)writeFileSync(prefix+".response.json",await response.clone().text(),{flag:"wx"});
    appendFileSync(resolve(output,"transport.jsonl"),JSON.stringify({type:"FINISHED",id,status:response.status,elapsedMs:Date.now()-started})+"\n");
    return response;
  }catch(error){
    appendFileSync(resolve(output,"transport.jsonl"),JSON.stringify({type:"FAILED",id,name:error?.name,code:error?.cause?.code,elapsedMs:Date.now()-started})+"\n");
    throw error;
  }
};
