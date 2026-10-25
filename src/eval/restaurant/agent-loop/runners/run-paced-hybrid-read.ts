import { fork, type ChildProcess, type ForkOptions } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createEvalPacingCoordinator } from "./eval-pacing.js";
import {superviseEvalChild,postExitFailed} from './eval-post-exit.js';

export interface PacedEvalBatch { minimumIntervalMs?: number; originIntervalsMs?: Record<string, number>; runs: Array<{ id: string; args: string[] }> }
/** Frozen manifest + unchanged per-run CLI gates; this function never grants Live authorization. */
export async function runPacedHybridBatch(manifest: PacedEvalBatch, output: string, dependencies: {forkChild?:(path:string,args:string[],options:ForkOptions)=>ChildProcess} = {}) {
  if (!manifest.runs.length || manifest.runs.some(r => !/^[\w.-]{1,120}$/.test(r.id) || r.args.some(a => typeof a !== "string")) || new Set(manifest.runs.map(r => r.id)).size !== manifest.runs.length) throw new Error("Invalid paced eval manifest");
  await mkdir(output, { recursive: true });const coordinator = await createEvalPacingCoordinator(manifest);
  const children = manifest.runs.map(run => ({ run, child: (dependencies.forkChild??fork)(fileURLToPath(new URL("./run-paced-hybrid-read-child.ts", import.meta.url)), run.args, {
    execArgv: ["--import", "tsx"], env: { ...process.env, PRAXIS_EVAL_PACING_ENDPOINT: JSON.stringify(coordinator.endpoint), PRAXIS_EVAL_PACING_RUN_ID: run.id, PRAXIS_EVAL_PACING_STATS_PATH: resolve(output, `${run.id}.pacing.json`) },
  }) }));
  let grace: ReturnType<typeof setTimeout> | undefined;
  const stop = () => { for (const {child} of children) child.kill("SIGTERM");grace ??= setTimeout(() => { for (const {child} of children) child.kill("SIGKILL"); }, 10_000); };
  process.once("SIGTERM", stop);process.once("SIGINT", stop);
  try {
    const exits = await Promise.all(children.map(async({run,child})=>{
      const independentEvaluation=await superviseEvalChild(child,run.id,resolve(output,`${run.id}.post-exit.json`));
      return {id:run.id,...independentEvaluation.exit,independentEvaluation};
    }));
    const summary = { mode: "PACED_EVAL_BATCH", parallelLimit: 2, minimumIntervalMs: manifest.minimumIntervalMs ?? 1000, exits, ...coordinator.snapshot() };
    await writeFile(resolve(output,"batch.json"),JSON.stringify(summary,null,2)+"\n",{flag:"wx"});return summary;
  } finally { clearTimeout(grace);process.removeListener("SIGTERM",stop);process.removeListener("SIGINT",stop);await coordinator.close(); }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [manifest, output] = process.argv.slice(2);if (!manifest || !output) throw new Error("Usage: run-paced-hybrid-read.ts manifest.json output-directory");
  const result=await runPacedHybridBatch(JSON.parse(await readFile(manifest,"utf8")),resolve(output));if(result.exits.some(r=>postExitFailed(r.independentEvaluation)))process.exitCode=1;
}
