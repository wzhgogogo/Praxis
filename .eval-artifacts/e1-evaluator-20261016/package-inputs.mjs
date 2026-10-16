// One-off offline packaging of the explicitly authorized, exposed calibration inputs.
// Original bytes remain untouched. Never overwrite an already frozen package.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, join } from "node:path";
import { gzipSync } from "node:zlib";

const root = resolve(import.meta.dirname, "../..");
const output = join(root, ".eval-artifacts/calibration-phase1-20261015/inputs");
const preflight = JSON.parse(readFileSync(join(import.meta.dirname, "input-preflight.json"), "utf8"));
if (existsSync(output)) throw new Error("Refusing to overwrite an input package");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const writes = [];
const entries = preflight.entries.map(entry => {
  const sources = entry.status === "ORIGINAL_RESULT_FOUND"
    ? [["RESULT", entry.originalPath, `${entry.runId}.result.json.gz`]]
    : [
      ["STARTED", entry.startedPath, `${entry.runId}/started.json.gz`],
      ["DECISIONS", entry.decisionsPath, `${entry.runId}/decisions.jsonl.gz`],
      ["OUTER_INTERRUPTION", entry.interruptionPath, `${entry.runId}/attempt-1.interruption.json.gz`],
      ["OUTER_FINISH", entry.finishPath, `${entry.runId}/attempt-1.finish.json.gz`],
      ["TRACE", join(resolve(root, entry.finishPath), "../attempt-1.trace.jsonl"), `${entry.runId}/attempt-1.trace.jsonl.gz`],
    ];
  const files = sources.map(([kind, source, path]) => {
    const originalPath = resolve(root, source);
    const raw = readFileSync(originalPath);
    if (kind === "RESULT" && sha(raw) !== entry.originalSha256) throw new Error(`Original changed: ${entry.runId}`);
    const compressed = gzipSync(raw, { level: 9 });
    writes.push({ path, bytes: compressed });
    return { kind, path, originalPath, originalSha256: sha(raw), gzipSha256: sha(compressed), originalBytes: raw.length, gzipBytes: compressed.length };
  });
  return { runId: entry.runId, status: entry.status === "ORIGINAL_RESULT_FOUND" ? "RESULT_GENERATED" : "RESULT_NOT_GENERATED",
    ...(entry.status === "ORIGINAL_RESULT_FOUND" ? {} : { reason: "OUTER_SIGKILL_INTERRUPTION", excludedFromCapabilityDenominator: true }), files };
});
const gzipBytes = writes.reduce((total, item) => total + item.bytes.length, 0);
if (gzipBytes > 60_000_000) throw new Error(`STOP: ${gzipBytes} compressed bytes exceeds 60 MB; nothing written`);
mkdirSync(output);
for (const item of writes) {
  const target = join(output, item.path);
  mkdirSync(resolve(target, ".."), { recursive: true });
  writeFileSync(target, item.bytes, { flag: "wx" });
}
const manifest = { schemaVersion: "1", datasetId: "restaurant-evaluator-calibration-phase1@1", evidenceStatus: "EXPOSED_DEVELOPMENT_REGRESSION",
  baseCommit: preflight.baseCommit, plannedRuns: 22, resultCount: 20, interruptedBundles: 2, gzipBytes, sizeLimitBytes: 60_000_000,
  interruptedBundleAuthorization: "User instruction 2026-10-16: include started, decisions, outer interruption/finish and trace; no fabricated result; exclude capability denominator; S0 trace only.", entries };
writeFileSync(join(output, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ plannedRuns: 22, resultCount: 20, interruptedBundles: 2, files: writes.length, gzipBytes, manifestSha256: sha(readFileSync(join(output, "manifest.json"))) }));
