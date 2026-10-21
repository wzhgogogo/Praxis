import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Formatting only. Never stemming, translation, aliases, or synonyms. */
export const normalizeCriterion = (value: string): string => value.normalize("NFKC").toLocaleLowerCase("en-US")
  .replace(/[\p{P}\p{Z}\s]+/gu, " ").trim();
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
export interface PendingCriterionWording { goldText: string; systemText: string; goldPolarity: string; systemPolarity: string; }
export interface CriterionIdentity { text?: string; value?: string; polarity?: string; strength?: string; criterionRef?: string; semanticId?: string; }
export interface CriterionIndexPair {
  goldIndex: number; actualIndex: number; semanticId: string; goldTextSha256: string; actualTextSha256: string; refs: string[];
}
export interface CriterionCorrespondences {
  path: string; sha256: string; schema: "artifact-criterion-correspondence@1";
  entries: Array<{ runId: string; artifactSha256: string; pairs: CriterionIndexPair[] }>;
}
export interface CriterionMatch { goldIndex: number; actualIndex: number; method: "CRITERION_REF" | "REVIEWED_SEMANTIC_INDEX" | "NORMALIZED_TEXT"; refs: string[]; }
function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Error("Invalid criterion correspondence object");
  const row = value as Record<string, unknown>;
  if (Object.keys(row).some(key => !keys.includes(key)) || keys.some(key => row[key] === undefined || row[key] === null)) throw Error("Invalid criterion correspondence fields");
  return row;
}
function text(value: unknown): string { if (typeof value !== "string" || !value.trim()) throw Error("Invalid criterion correspondence text"); return value; }
function hash(value: unknown): string { const result = text(value); if (!/^[a-f0-9]{64}$/.test(result)) throw Error("Invalid criterion correspondence SHA"); return result; }
export function parseCriterionCorrespondences(bytes: string, path: string): CriterionCorrespondences {
  const root = object(JSON.parse(bytes), ["schema", "status", "rule", "entries"]);
  if (root.schema !== "artifact-criterion-correspondence@1" || !Array.isArray(root.entries)) throw Error("Unsupported criterion correspondence schema");
  text(root.status); text(root.rule);
  const artifacts = new Set<string>();
  const entries = root.entries.map(value => {
    const row = object(value, ["runId", "artifactSha256", "pairs"]);
    const runId = text(row.runId), artifactSha256 = hash(row.artifactSha256);
    if (artifacts.has(artifactSha256) || !Array.isArray(row.pairs)) throw Error("Duplicate artifact or invalid criterion pairs");
    artifacts.add(artifactSha256);
    const gold = new Set<number>(), actual = new Set<number>(), ids = new Set<string>();
    const pairs = row.pairs.map(value => {
      const pair = object(value, ["goldIndex", "actualIndex", "semanticId", "goldTextSha256", "actualTextSha256", "refs"]);
      const goldIndex = pair.goldIndex as number, actualIndex = pair.actualIndex as number, semanticId = text(pair.semanticId);
      if (![goldIndex, actualIndex].every(n => Number.isSafeInteger(n) && n >= 0) || gold.has(goldIndex) || actual.has(actualIndex) || ids.has(semanticId)) throw Error("Duplicate or invalid criterion index identity");
      if (!Array.isArray(pair.refs) || !pair.refs.length) throw Error("Missing independent criterion review refs");
      gold.add(goldIndex); actual.add(actualIndex); ids.add(semanticId);
      return { goldIndex, actualIndex, semanticId, goldTextSha256: hash(pair.goldTextSha256), actualTextSha256: hash(pair.actualTextSha256), refs: pair.refs.map(text) };
    });
    return { runId, artifactSha256, pairs };
  });
  return { path, sha256: sha(bytes), schema: root.schema, entries };
}
export function loadCriterionCorrespondences(path = fileURLToPath(new URL("./cases/criterion-correspondences.json", import.meta.url))): CriterionCorrespondences {
  return parseCriterionCorrespondences(readFileSync(path, "utf8"), path);
}
const wording = (row: CriterionIdentity) => row.text ?? row.value ?? "";
const identity = (row: CriterionIdentity) => row.semanticId ?? row.criterionRef;
/** Bind only an explicit identifier, a reviewed exact-artifact index, or a
 * unique normalized literal. Array order or polarity alone never implies identity.
 */
export function matchCriteria(gold: CriterionIdentity[], actual: CriterionIdentity[], reviewed: CriterionIndexPair[] = []): CriterionMatch[] {
  const matches: CriterionMatch[] = [];
  const add = (goldIndex: number, actualIndex: number, method: CriterionMatch["method"], refs: string[]) => {
    if (matches.some(row => row.goldIndex === goldIndex || row.actualIndex === actualIndex)) throw Error("Ambiguous criterion correspondence");
    matches.push({ goldIndex, actualIndex, method, refs });
  };
  for (const pair of reviewed) {
    if (!gold[pair.goldIndex] || !actual[pair.actualIndex] || sha(wording(gold[pair.goldIndex]!)) !== pair.goldTextSha256 || sha(wording(actual[pair.actualIndex]!)) !== pair.actualTextSha256) continue;
    add(pair.goldIndex, pair.actualIndex, "REVIEWED_SEMANTIC_INDEX", pair.refs);
  }
  gold.forEach((row, goldIndex) => {
    if (matches.some(row => row.goldIndex === goldIndex)) return;
    const id = identity(row);
    const eligible = actual.flatMap((other, actualIndex) => {
      if (matches.some(row => row.actualIndex === actualIndex)) return [];
      const otherId = identity(other);
      return (id || otherId ? Boolean(id && id === otherId) : normalizeCriterion(wording(row)) === normalizeCriterion(wording(other))) ? [actualIndex] : [];
    });
    // Duplicate explicit references are unassessed, not arbitrarily chosen.
    if (eligible.length !== 1 || id && gold.filter(other => identity(other) === id).length !== 1) return;
    const actualIndex = eligible[0]!;
    if (!id && gold.filter(other => !identity(other) && normalizeCriterion(wording(other)) === normalizeCriterion(wording(row))).length !== 1) return;
    add(goldIndex, actualIndex, id ? "CRITERION_REF" : "NORMALIZED_TEXT", []);
  });
  return matches;
}
