// Synthetic localhost transport, 2026-10-24. Real child, never a production API.
import { connectEvalPacing } from "../../../eval/restaurant/agent-loop/runners/eval-pacing.js";
const abort = new AbortController();
const client = await connectEvalPacing(JSON.parse(process.argv[2]!), process.argv[3]!, abort.signal);
process.send?.({ stage: "ENTERED" });
process.on("message", async message => {
  if (message === "stop") { abort.abort();setTimeout(() => process.exit(0), 5);return; }
  if (message === "timeout") { setTimeout(() => abort.abort(), 10);setTimeout(() => process.exit(0), 20);return; }
  if (message !== "start") return;
  try {
    for (let i = 0; i < 2; i++) await client.request(process.argv[4]!, async () => { const response = await fetch(process.argv[4]!, { signal: abort.signal });await response.text(); });
    process.send?.({ stage: "DONE", usage: await client.usage() });
  } catch (error) { process.send?.({ stage: "STOPPED", error: error instanceof Error ? error.message : String(error) }); }
});
