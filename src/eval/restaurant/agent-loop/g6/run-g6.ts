import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { loadG6Pack,runG6Batch } from "./runner.js";
import { liveG6Dependencies } from "./live-transports.js";

/** Prepared only in this batch. A future authorized invocation must provide every recording flag. */
export async function main(args:string[]){
  const flag=(name:string)=>{const at=args.indexOf(name);if(at<0||!args[at+1])throw Error("Missing "+name);return args[at+1]!;};
  if(!args.includes("--record-browser")||!args.includes("--record-decisions"))throw Error("G6 requires --record-browser --record-decisions and always records Google structured responses");
  const pack=await loadG6Pack(resolve(flag("--pack")),flag("--sha256"));if(pack.mode!=="LIVE_READ")throw Error("CLI only accepts a frozen LIVE_READ pack; fixture callers inject transports explicitly");
  const dependencies=liveG6Dependencies(process.env,resolve(".eval-artifacts/phase3b/budget.json"));
  const result=await runG6Batch(pack,dependencies,resolve(flag("--output")));console.log(JSON.stringify(result));if(result.stopReason)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main(process.argv.slice(2)).catch(()=>{console.error("G6 Runner stopped; inspect saved per-slot evidence. Credentials are never logged.");process.exitCode=1;});
