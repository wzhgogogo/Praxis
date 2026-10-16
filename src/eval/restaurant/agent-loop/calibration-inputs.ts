import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve, relative, isAbsolute } from "node:path";
import { gunzipSync } from "node:zlib";
import type { DiagnosticEvaluationOptions } from "./diagnostic-evaluator.js";

const sha = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
function object(value: unknown, allowed: string[], required: string[], path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Error(`${path}: expected non-null object`);
  const record = value as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) if (!allowed.includes(key) || value === null) throw Error(`${path}.${key}: unknown key/null forbidden`);
  for (const key of required) if (record[key] === undefined) throw Error(`${path}.${key}: missing`);
  return record;
}
const string = (value: unknown): string => { if (typeof value !== "string" || !value) throw Error("Expected nonempty manifest string"); return value; };
const integer = (value: unknown): number => { if (typeof value !== "number" || !Number.isInteger(value) || value < 0) throw Error("Expected manifest byte count"); return value; };
const digest = (value: unknown): string => { const result = string(value); if (!/^[a-f0-9]{64}$/.test(result)) throw Error("Expected SHA-256"); return result; };
export interface FrozenCalibrationInput {
  runId: string;
  artifact: unknown;
  sourceArtifact: { path: string; sha256: string };
  options: DiagnosticEvaluationOptions;
  manifestSha256: string;
  fileRefs: string[];
}
/** Private frozen package reader. Every compressed and uncompressed byte is
 * verified; original absolute paths are provenance, never filesystem inputs.
 * Does not accept or read labels.yaml.
 */
export async function loadFrozenCalibrationInput(manifestPath: string, runId: string): Promise<FrozenCalibrationInput> {
  const path = resolve(manifestPath), bytes = await readFile(path);
  const root = object(JSON.parse(bytes.toString()), ["schemaVersion", "datasetId", "evidenceStatus", "baseCommit", "plannedRuns", "resultCount", "interruptedBundles", "gzipBytes", "sizeLimitBytes", "interruptedBundleAuthorization", "entries"], ["schemaVersion", "datasetId", "entries", "plannedRuns"], "manifest");
  if (root.schemaVersion !== "1" || root.datasetId !== "restaurant-evaluator-calibration-phase1@1" || !Array.isArray(root.entries)) throw Error("Unsupported calibration manifest");
  if (integer(root.plannedRuns) !== root.entries.length) throw Error("Calibration denominator mismatch");
  const entries = root.entries.map((entry, index) => object(entry, ["runId", "status", "reason", "excludedFromCapabilityDenominator", "files"], ["runId", "status", "files"], `entries[${index}]`));
  const ids = entries.map(entry => string(entry.runId));
  if (new Set(ids).size !== ids.length) throw Error("Duplicate calibration run ID");
  const entry = entries.find(entry => entry.runId === runId);
  if (!entry || !Array.isArray(entry.files)) throw Error(`Unknown run ID or invalid files: ${runId}`);
  if (entry.status !== "RESULT_GENERATED" && entry.status !== "RESULT_NOT_GENERATED") throw Error("Unsupported run input status");
  if (entry.status === "RESULT_NOT_GENERATED" && (entry.reason !== "OUTER_SIGKILL_INTERRUPTION" || entry.excludedFromCapabilityDenominator !== true)) throw Error("Interrupted input must retain its reason and denominator exclusion");
  const files = new Map<string, { raw: Buffer; path: string; sha256: string }>();
  for (const value of entry.files) {
    const file = object(value, ["kind", "path", "originalPath", "originalSha256", "gzipSha256", "originalBytes", "gzipBytes"], ["kind", "path", "originalPath", "originalSha256", "gzipSha256", "originalBytes", "gzipBytes"], "file");
    const kind = string(file.kind), localPath = resolve(dirname(path), string(file.path));
    if (!['RESULT','STARTED','DECISIONS','OUTER_INTERRUPTION','OUTER_FINISH','TRACE'].includes(kind) || files.has(kind)) throw Error("Unknown/duplicate package member kind");
    const fromRoot = relative(dirname(path), localPath);
    if (isAbsolute(string(file.path)) || fromRoot.startsWith("..")) throw Error("Package path escapes inputs directory");
    string(file.originalPath);
    const compressed = await readFile(localPath);
    if (compressed.length !== integer(file.gzipBytes) || sha(compressed) !== digest(file.gzipSha256)) throw Error(`Compressed integrity failure: ${localPath}`);
    const raw = gunzipSync(compressed);
    if (raw.length !== integer(file.originalBytes) || sha(raw) !== digest(file.originalSha256)) throw Error(`Original integrity failure: ${localPath}`);
    files.set(kind, { raw, path: localPath, sha256: sha(raw) });
  }
  const required = entry.status === "RESULT_GENERATED" ? ["RESULT"] : ["STARTED", "DECISIONS", "OUTER_INTERRUPTION", "OUTER_FINISH", "TRACE"];
  if (files.size !== required.length || required.some(kind => !files.has(kind))) throw Error("Incomplete or misclassified calibration bundle");
  const common = { runId, manifestSha256: sha(bytes), fileRefs: [...files.values()].map(file => `${file.path}#sha256=${file.sha256}`) };
  if (entry.status === "RESULT_GENERATED") {
    const file = files.get("RESULT")!;
    return { ...common, artifact: JSON.parse(file.raw.toString()), sourceArtifact: { path: file.path, sha256: file.sha256 }, options: {} };
  }
  const finish = files.get("OUTER_FINISH")!, interruption = files.get("OUTER_INTERRUPTION")!, trace = files.get("TRACE")!;
  // Validate started/decisions JSON too; neither is repackaged as a result.
  JSON.parse(files.get("STARTED")!.raw.toString());
  files.get("DECISIONS")!.raw.toString().split("\n").filter(Boolean).forEach(line => JSON.parse(line));
  return { ...common, artifact: undefined, sourceArtifact: { path: dirname(finish.path), sha256: createHash("sha256").update(JSON.stringify([...files.values()].map(file => file.sha256))).digest("hex") },
    options: { orchestration: { finish: JSON.parse(finish.raw.toString()), interruption: JSON.parse(interruption.raw.toString()), refs: common.fileRefs },
      trace: trace.raw.toString().split("\n").filter(Boolean).map(line => JSON.parse(line)) } };
}
