import{readFileSync,writeFileSync,mkdirSync,readdirSync,copyFileSync}from"node:fs";
import{resolve}from"node:path";
import{fileURLToPath}from"node:url";
import{createHash}from"node:crypto";
import{execFileSync,spawnSync}from"node:child_process";
const root=process.cwd(),folder=fileURLToPath(new URL(".",import.meta.url)),output=resolve(folder,"execution");
const manifest=JSON.parse(readFileSync(resolve(folder,"freeze.json"),"utf8"));
function verify(){for(const row of manifest.files)if(createHash("sha256").update(readFileSync(resolve(root,row.path))).digest("hex")!==row.sha256)throw Error("Frozen input changed: "+row.path);}
if(!process.argv.includes("--execute"))throw Error("Explicit --execute required");
verify();mkdirSync(output,{recursive:true});
const sha=execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim();
if(execFileSync("git",["status","--porcelain"],{encoding:"utf8"}))throw Error("Run must begin with a clean worktree");
writeFileSync(resolve(output,"started.json"),JSON.stringify({sourceCommit:sha,at:new Date().toISOString(),plannedTurns:15,maximumAPICalls:15,additionalRetries:0,model:process.env.DEEPSEEK_MODEL,manifestSHA256:createHash("sha256").update(readFileSync(resolve(folder,"freeze.json"))).digest("hex")},null,2)+"\n",{flag:"wx"});
const fixture=spawnSync("npm",["run","eval:restaurant:semantic:fixture"],{cwd:root,encoding:"utf8",timeout:60000});
writeFileSync(resolve(output,"fixture.log"),(fixture.stdout??"")+(fixture.stderr??""));
if(fixture.status!==0){writeFileSync(resolve(output,"stopped.json"),JSON.stringify({reason:"FIXTURE_FAILED",exitCode:fixture.status})+"\n");process.exit(1);}
verify();
const artifactDirectory=resolve(root,".eval-artifacts/restaurant-semantic");
mkdirSync(artifactDirectory,{recursive:true});
const previous=new Set(readdirSync(artifactDirectory));
const env={...process.env,PRAXIS_ALLOW_LIVE_MODEL_EVAL:"1",PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT:"15",PRAXIS_SEMANTIC_RUN_DIR:output,NODE_OPTIONS:"--import="+resolve(folder,"semantic-transport-guard.mjs")};
const started=Date.now();
const real=spawnSync("npm",["run","eval:restaurant:semantic:deepseek"],{cwd:root,env,encoding:"utf8",timeout:600000,maxBuffer:8*1024*1024});
writeFileSync(resolve(output,"deepseek.log"),(real.stdout??"")+(real.stderr??""));
for(const name of readdirSync(artifactDirectory))if(!previous.has(name)&&name.endsWith(".json"))copyFileSync(resolve(artifactDirectory,name),resolve(output,"result.json"));
verify();
const transportPath=resolve(output,"transport.jsonl");
let transport=[];try{transport=readFileSync(transportPath,"utf8").trim().split("\n").filter(Boolean).map(JSON.parse);}catch(error){if(error.code!=="ENOENT")throw error;}
writeFileSync(resolve(output,"finished.json"),JSON.stringify({sourceCommit:sha,exitCode:real.status,elapsedMs:Date.now()-started,APIRequests:transport.filter(x=>x.type==="STARTED").length,blockedRetries:transport.filter(x=>x.reason==="NO_RETRY").length,sourceGET:0,Google:0,Live:0,error:real.error?.code??null},null,2)+"\n");
console.log(JSON.stringify({sourceCommit:sha,exitCode:real.status,APIRequests:transport.filter(x=>x.type==="STARTED").length,output}));
process.exitCode=real.status??1;
