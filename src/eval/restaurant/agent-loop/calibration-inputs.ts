import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve, relative, isAbsolute } from "node:path";
import { gunzipSync } from "node:zlib";
import { isDeepStrictEqual } from "node:util";
import { parseAllDocuments } from "yaml";
import { loadFrozenLiveCases } from "./live-case-materializer.js";
import { parseReviewedReads } from "./diagnostic-evaluator-network.js";
import type { DiagnosticEvaluationOptions } from "./diagnostic-evaluator.js";
import { loadPostDeliveryTabelogObservation } from "./diagnostic-evaluator-grounding.js";

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

/** User-approved oracle replacement, never a repaired execution artifact.
 * The old malformed YAML is read only to verify provenance, not as new Gold. */
export async function loadApprovedGoldCorrection(correctionPath: string, runId: string, artifact: unknown, artifactSha256: string): Promise<DiagnosticEvaluationOptions["goldCorrection"]> {
  const path = resolve(correctionPath), bytes = await readFile(path);
  const root = object(JSON.parse(bytes.toString()), ["schema", "status", "authorization", "reason", "rev1", "rev2", "entries"], ["schema", "status", "authorization", "reason", "rev1", "rev2", "entries"], "goldCorrections");
  if (root.schema !== "restaurant-eval-gold-corrections@1" || root.status !== "USER_APPROVED" || !Array.isArray(root.entries)) throw Error("Unapproved Gold correction");
  string(root.authorization); string(root.reason);
  const readSource = async (value: unknown) => {
    const reference = object(value, ["path", "sha256"], ["path", "sha256"], "Gold source");
    if (isAbsolute(string(reference.path))) throw Error("Gold source must be manifest-relative");
    const file = resolve(dirname(path), string(reference.path)), raw = await readFile(file);
    if (sha(raw) !== digest(reference.sha256)) throw Error("Gold source SHA mismatch");
    return { path: file, raw, sha256: sha(raw) };
  };
  const rev1 = await readSource(root.rev1), rev2 = await readSource(root.rev2);
  const entries = root.entries.map(value => object(value, ["runId", "kind", "caseId", "artifactSha256"], ["runId", "kind", "caseId", "artifactSha256"], "Gold correction entry"));
  for (const entry of entries) {
    string(entry.runId); string(entry.caseId); digest(entry.artifactSha256);
    if (entry.kind !== "RESULT" && entry.kind !== "STARTED") throw Error("Unknown corrected artifact kind");
  }
  if (new Set(entries.map(entry => entry.runId)).size !== entries.length) throw Error("Duplicate Gold correction binding");
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) throw Error("Gold correction requires the original result");
  const original = artifact as Record<string, any>;
  const entry = entries.find(entry => entry.runId === runId);
  if (!entry) {
    if (original.runtimeContext?.dataset?.sha256 === rev1.sha256) throw Error("Missing binding for a rev1 run; cannot selectively repair Gold");
    return undefined;
  }
  if (entry.kind !== "RESULT" || entry.artifactSha256 !== artifactSha256 || original.runtimeContext?.dataset?.sha256 !== rev1.sha256
    || original.caseId !== entry.caseId || original.materializedCase?.id !== entry.caseId) throw Error("Gold correction bound to a different original artifact/revision/case");
  const documents = parseAllDocuments(rev1.raw.toString(), { uniqueKeys: true });
  if (documents.some(document => document.errors.length)) throw Error("Invalid original Gold YAML");
  const oldCase = documents.map(document => document.toJS({ maxAliasCount: 0 })).find(value => value?.id === entry.caseId);
  const newCase = (await loadFrozenLiveCases(rev2.path)).find(value => value.id === entry.caseId);
  if (!oldCase || !newCase || !isDeepStrictEqual(oldCase.semantic, original.materializedCase.semantic)
    || !isDeepStrictEqual(oldCase.acceptance, original.materializedCase.acceptance)) throw Error("Original frozen Gold does not match the approved rev1 entry");
  // The approved correction changes the oracle representation, never the
  // original request, execution reference instant, intent or source evidence.
  for (const field of ["id", "dataset", "parent", "reference_time", "content"]) {
    const normalized = (value: unknown) => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : value;
    if (!isDeepStrictEqual(normalized(oldCase[field]), normalized(newCase[field]))) throw Error(`Gold correction changes original ${field}`);
  }
  const refs = [path, rev1.path, rev2.path].map((file, index) => `${relative(process.cwd(), file)}#sha256=${[sha(bytes), rev1.sha256, rev2.sha256][index]}`);
  return { artifactSha256, rev1Sha256: rev1.sha256, rev2Sha256: rev2.sha256, refs,
    materializedCase: { ...structuredClone(original.materializedCase), semantic: structuredClone(newCase.semantic), acceptance: structuredClone(newCase.acceptance) } };
}
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
    return { ...common, artifact: JSON.parse(file.raw.toString()), sourceArtifact: { path: file.path, sha256: file.sha256 }, options: { frozenRun: { runId, artifactSha256: file.sha256 } } };
  }
  const finish = files.get("OUTER_FINISH")!, interruption = files.get("OUTER_INTERRUPTION")!, trace = files.get("TRACE")!;
  // Validate started/decisions JSON too; neither is repackaged as a result.
  JSON.parse(files.get("STARTED")!.raw.toString());
  files.get("DECISIONS")!.raw.toString().split("\n").filter(Boolean).forEach(line => JSON.parse(line));
  return { ...common, artifact: undefined, sourceArtifact: { path: dirname(finish.path), sha256: createHash("sha256").update(JSON.stringify([...files.values()].map(file => file.sha256))).digest("hex") },
    options: { orchestration: { finish: JSON.parse(finish.raw.toString()), interruption: JSON.parse(interruption.raw.toString()), refs: common.fileRefs },
      trace: trace.raw.toString().split("\n").filter(Boolean).map(line => JSON.parse(line)) } };
}

/** Explicit local raw-observation context. These references contain no scores
 * or human labels, and cannot attach to another original result's SHA. */
export async function loadCalibrationObservations(contextPath: string, runId: string, artifactSha256: string): Promise<{ options: DiagnosticEvaluationOptions; refs: string[]; contextSha256: string }> {
  const path = resolve(contextPath), bytes = await readFile(path);
  const root = object(JSON.parse(bytes.toString()), ["schemaVersion", "entries"], ["schemaVersion", "entries"], "observations");
  if (root.schemaVersion !== "1" || !Array.isArray(root.entries)) throw Error("Unsupported calibration observation context");
  const rows = root.entries.map(row => object(row, ["runId", "artifactSha256", "finish", "priorAttempts", "postDeliveryTabelog", "reviewedReads"], ["runId", "artifactSha256"], "observation entry"));
  const ids = rows.map(row => string(row.runId));
  if (new Set(ids).size !== ids.length) throw Error("Duplicate calibration observation run ID");
  const refs = [`${path}#sha256=${sha(bytes)}`];
  const row = rows.find(row => row.runId === runId);
  if (!row) return { options: {}, refs, contextSha256: sha(bytes) };
  if (digest(row.artifactSha256) !== artifactSha256) throw Error("Calibration observation is bound to a different original result");
  const read = async (value: unknown) => {
    const reference = object(value, ["path", "sha256"], ["path", "sha256"], "observation reference");
    const file = resolve(dirname(path), string(reference.path));
    const raw = await readFile(file);
    if (sha(raw) !== digest(reference.sha256)) throw Error(`Calibration observation SHA mismatch: ${file}`);
    refs.push(`${file}#sha256=${sha(raw)}`);
    return { raw, path: file };
  };
  const options: DiagnosticEvaluationOptions = {};
  if (row.reviewedReads !== undefined) {
    const reviewed = await read(row.reviewedReads);
    options.reviewedReads = parseReviewedReads(reviewed.raw, relative(process.cwd(), reviewed.path));
  }
  if (row.finish !== undefined || row.priorAttempts !== undefined) {
    if (!row.finish || row.priorAttempts !== undefined && !Array.isArray(row.priorAttempts)) throw Error("Raw finish and valid priorAttempts required");
    const finish = JSON.parse((await read(row.finish)).raw.toString());
    const priorAttempts = [];
    for (const prior of row.priorAttempts as unknown[] ?? []) {
      const record = JSON.parse((await read(prior)).raw.toString());
      if (!finish.id || record.id !== finish.id || record.sourceSha256 !== finish.sourceSha256) throw Error("Prior preflight belongs to a different outer task/configuration");
      priorAttempts.push(record);
    }
    options.orchestration = { finish, priorAttempts, refs };
  }
  if (row.postDeliveryTabelog !== undefined) {
    if (!Array.isArray(row.postDeliveryTabelog)) throw Error("Expected post-delivery raw references");
    options.postDeliveryTabelog = [];
    for (const pair of row.postDeliveryTabelog) {
      const item = object(pair, ["metadata", "body"], ["metadata", "body"], "post-delivery pair");
      const metadata = await read(item.metadata), body = await read(item.body);
      options.postDeliveryTabelog.push(loadPostDeliveryTabelogObservation(metadata.path, body.path));
    }
  }
  return { options, refs, contextSha256: sha(bytes) };
}
