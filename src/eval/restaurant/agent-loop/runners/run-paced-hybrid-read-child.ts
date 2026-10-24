import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { connectEvalPacing, type EvalPacingEndpoint } from "./eval-pacing.js";
import { installEvalPacingTransports } from "./eval-paced-transports.js";

/** Enters before preflight/formal deadlines; process disconnect releases all leases. */
export async function withPacedEval<T>(endpoint: EvalPacingEndpoint, runId: string, statsPath: string, execute: () => Promise<T>, sourceOrigins?: readonly string[]) {
  const client = await connectEvalPacing(endpoint, runId);
  const restore = installEvalPacingTransports(client, sourceOrigins);
  try { return await execute(); }
  finally {
    try { await mkdir(dirname(statsPath), { recursive: true });await writeFile(statsPath, JSON.stringify({ mode: "EVAL_PACING", runId, byOrigin: await client.usage() }, null, 2)+"\n", { flag: "wx" }); }
    finally { restore();client.close(); }
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.env.PRAXIS_BROWSER_ENGINE !== "LOCAL_CHROMIUM") throw new Error("Paced eval requires existing LOCAL_CHROMIUM boundary");
  const endpoint = JSON.parse(process.env.PRAXIS_EVAL_PACING_ENDPOINT ?? "null");
  await withPacedEval(endpoint, process.env.PRAXIS_EVAL_PACING_RUN_ID!, process.env.PRAXIS_EVAL_PACING_STATS_PATH!, async () => {
    const { runHybridLiveRead } = await import("./run-hybrid-live-read.js");await runHybridLiveRead();
  });
  process.exit(process.exitCode ?? 0);
}
