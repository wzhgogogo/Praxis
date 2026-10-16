import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseAllDocuments } from "yaml";
import type { RunRecord, EvidenceRecord } from "./diagnostic-evaluator-record.js";
import { normalizeCriterion } from "./criterion-equivalences.js";
import type { CriterionEquivalenceTable } from "./criterion-equivalences.js";

export interface SoftPreferenceObservation {
  runIds: string[]; restaurant: string; criterion: string; status: "MET" | "NOT_MET"; evidence: string;
}
export interface SoftPreferenceObservations {
  path: string; sha256: string; observedBy: string; observedOn: string; observations: SoftPreferenceObservation[];
}
export interface UserConditionState {
  text: string; polarity: string; strength: string; status: "MET" | "NOT_MET" | "NOT_CHECKED";
  basis: string[]; evidenceRefs: string[];
}
export interface CandidateConditionStates { candidateId: string; criteria: UserConditionState[]; }

function object(value: unknown, keys: string[], context: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Error(`${context}: expected non-null object`);
  const row = value as Record<string, unknown>;
  for (const key of Object.keys(row)) if (!keys.includes(key)) throw Error(`${context}: unknown key ${key}`);
  for (const key of keys) if (row[key] === null || row[key] === undefined) throw Error(`${context}.${key}: missing/null forbidden`);
  return row;
}
function text(value: unknown): string { if (typeof value !== "string" || !value.trim()) throw Error("Expected nonempty preference observation string"); return value; }
export function parseSoftPreferenceObservations(bytes: string, path: string): SoftPreferenceObservations {
  const docs = parseAllDocuments(bytes, { uniqueKeys: true });
  if (docs.length !== 1 || docs[0]!.errors.length) throw Error("Invalid preference observation YAML");
  const root = object(docs[0]!.toJS({ maxAliasCount: 0 }), ["schema", "status", "observedBy", "observedOn", "use", "observations"], path);
  if (root.schema !== "soft-preference-observations@1" || !Array.isArray(root.observations)) throw Error("Unsupported preference observation schema");
  text(root.status); text(root.use);
  const observedBy = text(root.observedBy), observedOn = text(root.observedOn);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(observedOn) || !Number.isFinite(Date.parse(observedOn))) throw Error("Invalid preference observation date");
  const seen = new Set<string>();
  const observations = root.observations.map((value, index): SoftPreferenceObservation => {
    const row = object(value, ["runIds", "restaurant", "criterion", "status", "evidence"], `observations[${index}]`);
    if (!Array.isArray(row.runIds) || !row.runIds.length || !["MET", "NOT_MET"].includes(String(row.status))) throw Error("Invalid preference observation runIds/status");
    const runIds = row.runIds.map(text), restaurant = text(row.restaurant), criterion = text(row.criterion), evidence = text(row.evidence);
    for (const runId of runIds) {
      const key = JSON.stringify([runId, restaurant, normalizeCriterion(criterion)]);
      if (seen.has(key)) throw Error("Duplicate preference observation"); seen.add(key);
    }
    return { runIds, restaurant, criterion, status: row.status as "MET" | "NOT_MET", evidence };
  });
  return { path, sha256: createHash("sha256").update(bytes).digest("hex"), observedBy, observedOn, observations };
}
export function loadSoftPreferenceObservations(path = fileURLToPath(new URL("../../../../.eval-artifacts/calibration-phase1-20261015/soft-preference-observations.yaml", import.meta.url))): SoftPreferenceObservations {
  return parseSoftPreferenceObservations(readFileSync(path, "utf8"), path);
}

function matchesRestaurant(restaurant: { outletName?: string; sourceIds?: Record<string,string> }, gold: string): boolean {
  const identified = gold.match(/^(.*?)\s+\((tabelog|tablecheck) ([a-z0-9-]+)\)$/i);
  if (identified) {
    const [, name, provider, id] = identified;
    const actual = restaurant.sourceIds?.[provider!.toLowerCase()];
    return normalizeCriterion(restaurant.outletName ?? "") === normalizeCriterion(name!) && Boolean(actual)
      && (provider!.toLowerCase() === "tabelog" ? actual!.split("/").at(-1) === id : actual === id);
  }
  // Reviewer explicitly grouped named outlets with a semicolon. Do not fuzzily
  // match another branch, category or a partial name.
  return gold.split(";").some(name => normalizeCriterion(name) === normalizeCriterion(restaurant.outletName ?? ""));
}
function sameCriterion(gold: string, actual: string, polarity: string, table: CriterionEquivalenceTable): boolean {
  return normalizeCriterion(gold) === normalizeCriterion(actual) || table.entries.some(entry => entry.conclusion === "SAME"
    && entry.polarity === polarity && normalizeCriterion(entry.goldText) === normalizeCriterion(gold) && normalizeCriterion(entry.systemText) === normalizeCriterion(actual));
}

/** Every user criterion remains visible. Subjective semantics and unspecified
 * price tolerances are NOT_CHECKED, not inferred from eligibility or category.
 * External run-scoped observations are bound to verified original bytes.
 */
export function assessUserConditions(root: RunRecord, table: CriterionEquivalenceTable, gold: SoftPreferenceObservations | undefined,
  frozenRun: { runId: string; artifactSha256: string } | undefined, artifactSha256: string,
  applicableEvidence: (candidateId: string) => EvidenceRecord[]): CandidateConditionStates[] {
  const domain = root.finalSnapshot?.domainState;
  return (domain?.presentedResults?.candidateIds ?? []).map(candidateId => {
    const restaurant = domain?.candidates?.find(candidate => candidate.restaurant?.id === candidateId)?.restaurant;
    const sourceFacts = applicableEvidence(candidateId).filter(item => item.kind === "RESTAURANT_FACT" && item.provider !== "MODEL_JUDGMENT");
    return { candidateId, criteria: (root.materializedCase?.semantic?.criteria ?? []).map((criterion, index): UserConditionState => {
      const criterionText = criterion.value ?? criterion.text ?? "MISSING_CRITERION_TEXT", polarity = criterion.polarity ?? "MISSING", strength = criterion.strength ?? "MISSING";
      const base = { text: criterionText, polarity, strength, evidenceRefs: [`materializedCase.semantic.criteria[${index}]`] };
      if (!["POSITIVE", "NEGATIVE"].includes(polarity) || !["HARD", "SOFT", "UNSPECIFIED"].includes(strength) || criterionText === "MISSING_CRITERION_TEXT")
        return { ...base, status: "NOT_CHECKED", basis: ["The original criterion record lacks a valid text, polarity or strength."] };
      const applicableGold = gold && strength === "SOFT" && polarity === "POSITIVE" && restaurant && frozenRun?.artifactSha256 === artifactSha256
        ? gold.observations.flatMap((row, observationIndex) => row.runIds.includes(frozenRun.runId) && matchesRestaurant(restaurant, row.restaurant)
          && sameCriterion(row.criterion, criterionText, polarity, table) ? [{ row, observationIndex }] : []) : [];
      if (applicableGold.length && gold) {
        const statuses = new Set(applicableGold.map(item => item.row.status));
        return { ...base, status: statuses.size === 1 ? applicableGold[0]!.row.status : "NOT_CHECKED",
          basis: statuses.size === 1 ? applicableGold.map(item => `External observation by ${gold.observedBy} on ${gold.observedOn}: ${item.row.evidence}`) : ["Conflicting external observations; no status selected."],
          evidenceRefs: [...base.evidenceRefs, ...applicableGold.map(item => `${gold.path}#sha256=${gold.sha256}:observations[${item.observationIndex}]`)] };
      }
      if (/(?:yen|jpy|budget|price|cost|¥|円)/i.test(criterionText)) return { ...base, status: "NOT_CHECKED",
        basis: ["No applicable independently recorded budget Gold; numeric 'around' tolerance is not defined (R3). Do not infer price from names, menus or categories."] };
      // Only an explicit source type statement equal to the condition can be
      // read literally here. A model-derived verified* label is not this oracle.
      const explicit = sourceFacts.filter(item => item.claims?.restaurantTypeFacts?.some(value => sameCriterion(criterionText, value, polarity, table)));
      if (explicit.length) return { ...base, status: polarity === "POSITIVE" ? "MET" : "NOT_MET",
        basis: explicit.flatMap(item => item.claims!.restaurantTypeFacts!.map(value => `Recorded source statement: ${value}`)),
        evidenceRefs: [...base.evidenceRefs, ...explicit.map(item => `finalSnapshot.domainState.readEvidence[evidenceId=${item.evidenceId}]`)] };
      return { ...base, status: "NOT_CHECKED", basis: ["No applicable independent explicit source statement or external observation establishes this condition; linked model judgments alone do not establish its free-text semantics."] };
    }) };
  });
}
