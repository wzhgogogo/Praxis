import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseAllDocuments } from "yaml";

export interface CriterionEquivalence {
  goldText: string;
  systemText: string;
  polarity: "POSITIVE" | "NEGATIVE";
  conclusion: "SAME" | "DIFFERENT";
  decidedBy: string;
  decidedAt: string;
  sourceRuns: string[];
}
export interface CriterionEquivalenceTable {
  tableVersion: "restaurant-criterion-equivalences@1";
  entries: CriterionEquivalence[];
  path: string;
  sha256: string;
}
export interface PendingCriterionWording {
  goldText: string; systemText: string; goldPolarity: string; systemPolarity: string;
}
export const normalizeCriterion = (text: string): string => text.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
function strictObject(value: unknown, keys: string[], context: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Error(`${context}: expected object (null is forbidden)`);
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) if (!keys.includes(key)) throw Error(`${context}: unknown key ${key}`);
  for (const key of keys) if (record[key] === undefined || record[key] === null) throw Error(`${context}.${key}: required, null is forbidden`);
  return record;
}
function requiredText(value: unknown, context: string): string {
  if (typeof value !== "string" || !value.trim()) throw Error(`${context}: expected nonempty string`);
  return value;
}
/** Pure strict loader; no labels, model, or semantic inference. */
export function parseCriterionEquivalences(bytes: string, path: string): CriterionEquivalenceTable {
  const docs = parseAllDocuments(bytes, { uniqueKeys: true });
  if (docs.length !== 1 || docs[0]!.errors.length) throw Error(`Invalid equivalence YAML: ${docs.flatMap(doc => doc.errors).join("; ")}`);
  const root = strictObject(docs[0]!.toJS({ maxAliasCount: 0 }), ["schemaVersion", "tableVersion", "entries"], path);
  if (root.schemaVersion !== "1" || root.tableVersion !== "restaurant-criterion-equivalences@1" || !Array.isArray(root.entries)) throw Error("Unsupported equivalence schema/version or entries");
  const seen = new Set<string>();
  const entries = root.entries.map((item, index): CriterionEquivalence => {
    const context = `entries[${index}]`;
    const entry = strictObject(item, ["goldText", "systemText", "polarity", "conclusion", "decidedBy", "decidedAt", "sourceRuns"], context);
    const goldText = requiredText(entry.goldText, `${context}.goldText`), systemText = requiredText(entry.systemText, `${context}.systemText`);
    const decidedBy = requiredText(entry.decidedBy, `${context}.decidedBy`), decidedAt = requiredText(entry.decidedAt, `${context}.decidedAt`);
    if (entry.polarity !== "POSITIVE" && entry.polarity !== "NEGATIVE" || entry.conclusion !== "SAME" && entry.conclusion !== "DIFFERENT") throw Error(`${context}: invalid polarity/conclusion`);
    if (!Number.isFinite(Date.parse(decidedAt)) || !Array.isArray(entry.sourceRuns) || !entry.sourceRuns.length) throw Error(`${context}: invalid decision time/source runs`);
    const sourceRuns = entry.sourceRuns.map((value, i) => requiredText(value, `${context}.sourceRuns[${i}]`));
    const key = JSON.stringify([normalizeCriterion(goldText), normalizeCriterion(systemText), entry.polarity]);
    if (seen.has(key)) throw Error(`${context}: duplicate equivalence pair`);
    seen.add(key);
    return { goldText, systemText, polarity: entry.polarity, conclusion: entry.conclusion, decidedBy, decidedAt, sourceRuns };
  });
  return { tableVersion: root.tableVersion, entries, path, sha256: createHash("sha256").update(bytes).digest("hex") };
}
export function loadCriterionEquivalences(path = fileURLToPath(new URL("./cases/criterion-equivalences.yaml", import.meta.url))): CriterionEquivalenceTable {
  return parseCriterionEquivalences(readFileSync(path, "utf8"), path);
}
