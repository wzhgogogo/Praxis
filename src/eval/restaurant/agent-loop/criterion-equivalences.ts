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
  tableVersion: string;
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
  const root = strictObject(docs[0]!.toJS({ maxAliasCount: 0 }), ["schema", "revision", "status", "rule", "entries"], path);
  if (root.schema !== "criterion-equivalences@1" || !Number.isSafeInteger(root.revision) || (root.revision as number) < 1 || !Array.isArray(root.entries)) throw Error("Unsupported equivalence schema/revision or entries");
  requiredText(root.status, `${path}.status`); requiredText(root.rule, `${path}.rule`);
  const seen = new Set<string>();
  const ids = new Set<string>();
  const entries = root.entries.map((item, index): CriterionEquivalence => {
    const context = `entries[${index}]`;
    const entry = strictObject(item, ["id", "gold", "system", "polarity", "verdict", "decidedBy", "decidedOn", "sourceRuns"], context);
    const id = requiredText(entry.id, `${context}.id`);
    if (ids.has(id)) throw Error(`${context}: duplicate id`); ids.add(id);
    const goldText = requiredText(entry.gold, `${context}.gold`), systemText = requiredText(entry.system, `${context}.system`);
    const decidedBy = requiredText(entry.decidedBy, `${context}.decidedBy`), decidedAt = requiredText(entry.decidedOn, `${context}.decidedOn`);
    if (entry.polarity !== "POSITIVE" && entry.polarity !== "NEGATIVE" || entry.verdict !== "SAME" && entry.verdict !== "DIFFERENT") throw Error(`${context}: invalid polarity/verdict`);
    if (!Number.isFinite(Date.parse(decidedAt)) || !Array.isArray(entry.sourceRuns) || !entry.sourceRuns.length) throw Error(`${context}: invalid decision time/source runs`);
    const sourceRuns = entry.sourceRuns.map((value, i) => requiredText(value, `${context}.sourceRuns[${i}]`));
    const key = JSON.stringify([normalizeCriterion(goldText), normalizeCriterion(systemText), entry.polarity]);
    if (seen.has(key)) throw Error(`${context}: duplicate equivalence pair`);
    seen.add(key);
    return { goldText, systemText, polarity: entry.polarity, conclusion: entry.verdict, decidedBy, decidedAt, sourceRuns };
  });
  return { tableVersion: `${root.schema}/revision-${root.revision}`, entries, path, sha256: createHash("sha256").update(bytes).digest("hex") };
}
export function loadCriterionEquivalences(path = fileURLToPath(new URL("./cases/criterion-equivalences.yaml", import.meta.url))): CriterionEquivalenceTable {
  return parseCriterionEquivalences(readFileSync(path, "utf8"), path);
}
