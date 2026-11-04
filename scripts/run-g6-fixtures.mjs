import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { runBrowserFixturePhase } from "./run-browser-fixtures.mjs";

// Same lifecycle diagnostics and unchanged 600s outer bound as browser fixtures.
// Run serially after the ordinary corpus so real Chromium cases do not add contention.
const directory=fileURLToPath(new URL("../src/eval/restaurant/agent-loop/g6/",import.meta.url));
const files=readdirSync(directory).filter(name=>name.endsWith(".test.ts")).sort().map(name=>join(directory,name));
if(!files.length)throw Error("G6 fixture corpus is empty");
const result=await runBrowserFixturePhase({name:"G6 capability and evaluator fixtures (exclusive)",concurrency:1,files});
if(result.error)console.error(result.error.message);
const summary=[...result.stdout.matchAll(/^ℹ tests (\d+)$/gm)].at(-1);
if(result.error||result.timedOut||result.status!==0||!summary||Number(summary[1])===0)process.exitCode=1;
