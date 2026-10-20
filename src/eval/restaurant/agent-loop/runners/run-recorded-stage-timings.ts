import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { restaurantRunStageTimings } from "../run-stage-timings.js";

interface FrozenFile { path: string; sha256: string; }
interface TimingInput { id: string; group: string; artifact: FrozenFile; trace?: FrozenFile; decisions?: FrozenFile; }
const sha = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
async function frozen(file: FrozenFile) {
  const bytes = await readFile(file.path);
  if (sha(bytes) !== file.sha256) throw Error(`TIMING_INPUT_CHANGED:${file.path}`);
  return (file.path.endsWith(".gz") ? gunzipSync(bytes) : bytes).toString();
}
export async function runRecordedStageTimings(manifestPath: string, output: string) {
  const manifestBytes = await readFile(manifestPath), manifest = JSON.parse(manifestBytes.toString()) as { inputs: TimingInput[] };
  await mkdir(output); // Never overwrite a historical artifact or previous computation.
  const results = [];
  const groups = new Map<string, { elapsedMs: number; measured: number; unassessed: number; stages: Map<string,number> }>();
  for (const input of manifest.inputs) {
    const artifact = JSON.parse(await frozen(input.artifact)) as Record<string,unknown>;
    if (input.trace) artifact.browserTrace = (await frozen(input.trace)).split(/\n/).filter(Boolean).map(line => JSON.parse(line));
    const decisions = input.decisions ? (await frozen(input.decisions)).split(/\n/).filter(Boolean).map(line => JSON.parse(line) as unknown) : [];
    const timing = restaurantRunStageTimings(artifact, decisions);
    const path = `${output}/${input.id}.timings.json`;
    await writeFile(path, JSON.stringify({ id: input.id, group: input.group, input, timing }, null, 2), { flag: "wx" });
    results.push({ id: input.id, group: input.group, path, sha256: sha(await readFile(path)), status: timing.status, elapsedMs: timing.elapsedMs });
    const group = groups.get(input.group) ?? { elapsedMs: 0, measured: 0, unassessed: 0, stages: new Map<string,number>() };
    if (timing.elapsedMs === null) group.unassessed += 1;
    else {
      group.measured += 1; group.elapsedMs += timing.elapsedMs;
      for (const row of timing.criticalPath) {
        const parts = row.stage.split(":");
        const stage = parts[0] === "AVAILABILITY" ? `AVAILABILITY:${parts.at(-1)}` : row.stage;
        group.stages.set(stage,(group.stages.get(stage) ?? 0)+row.elapsedMs);
      }
    }
    groups.set(input.group,group);
  }
  const summary = { schema: "recorded-stage-timings@1", manifest: { path: manifestPath, sha256: sha(manifestBytes) }, models: 0, network: 0,
    note: "Wall-time attribution only; timing is a metric, never a pass threshold. P20 h001 is one of the22 calibration rows, not counted twice.",
    groups: [...groups].map(([name,group]) => ({ name, elapsedMs: group.elapsedMs, measured: group.measured, unassessed: group.unassessed,
      stages: [...group.stages].map(([stage,ms]) => ({ stage,elapsedMs:ms,percent:group.elapsedMs ? ms/group.elapsedMs*100:0 })).sort((a,b) => b.elapsedMs-a.elapsedMs) })), results };
  await writeFile(`${output}/summary.json`,JSON.stringify(summary,null,2),{flag:"wx"});
  return summary;
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const [manifest, output] = process.argv.slice(2);
  if (!manifest || !output) throw Error("Provide frozen input manifest and fresh output directory");
  const result = await runRecordedStageTimings(manifest,output);
  console.log(JSON.stringify({ rows: result.results.length, groups: result.groups.map(group => ({ name:group.name,measured:group.measured,unassessed:group.unassessed,top3:group.stages.slice(0,3) })) },null,2));
}
