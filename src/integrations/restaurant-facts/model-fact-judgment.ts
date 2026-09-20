import type { ModelGateway, ModelUsage } from "../../core/model/contracts.js";
import type { RestaurantCandidate, RestaurantReadEvidence, RestaurantSearchIntent } from "../../domains/restaurant/contracts.js";

export interface RestaurantFactJudgmentPort {
  judge(input: { candidate: RestaurantCandidate; intent: RestaurantSearchIntent; evidence: RestaurantReadEvidence[] }): Promise<RestaurantFactJudgmentResult>;
}

export interface RestaurantFactJudgmentResult {
  evidence: RestaurantReadEvidence[];
  /** A successful provider invocation is recorded even when its output is unusable. */
  modelUsage?: { calls: 1; usage?: ModelUsage };
}

type JudgmentOutcome = "SUPPORTED" | "CONFLICT" | "UNKNOWN";

export const RESTAURANT_FACT_JUDGMENT_PROMPT_VERSION = "6";

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}
function strings(value: unknown): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value as string[] : [];
}
function normalized(value: string): string { return value.trim().toLocaleLowerCase("en-US"); }

/** These labels identify a venue class too broadly to discharge a cuisine/type exclusion. */
function concreteTypeFacts(values: string[]): string[] {
  const broad = new Set(["restaurant", "food", "dining", "cuisine", "chinese restaurant", "asian restaurant"]);
  return values.filter((value) => !broad.has(normalized(value)));
}

/**
 * The model interprets bounded, cited source observations.  It cannot return
 * State, a candidate ID, a URL, or an uncited condition conclusion.  This is
 * deliberately a type-fact interpretation boundary, not a subjective venue
 * ranking or a replacement for missing page evidence.
 */
export class ModelRestaurantFactJudgment implements RestaurantFactJudgmentPort {
  constructor(private readonly model: ModelGateway, private readonly now: () => string = () => new Date().toISOString()) {}

  async judge(input: { candidate: RestaurantCandidate; intent: RestaurantSearchIntent; evidence: RestaurantReadEvidence[] }): Promise<RestaurantFactJudgmentResult> {
    const criteria = input.intent.criteria.filter((item) => item.strength === "HARD");
    if (!criteria.length) return { evidence: [] };
    const observations = input.evidence
      .filter((item) => item.candidateId === input.candidate.restaurant.id && item.kind === "RESTAURANT_FACT")
      .flatMap((item) => {
        const typeFacts = concreteTypeFacts(strings(item.claims.restaurantTypeFacts));
        return typeFacts.length ? [{ evidenceId: item.evidenceId, provider: item.provider, sourceUrl: item.sourceUrl, observedAt: item.observedAt, restaurantTypeFacts: typeFacts }] : [];
      });
    if (!observations.length) return { evidence: [] };
    let output: unknown;
    let modelUsage: RestaurantFactJudgmentResult["modelUsage"];
    try {
      const response = await this.model.complete({
        taskId: "fact-judgment:" + input.candidate.restaurant.id,
        purpose: "restaurant_fact_judgment",
        promptVersion: RESTAURANT_FACT_JUDGMENT_PROMPT_VERSION,
        messages: [
          { role: "system", content: "Interpret cited source-stated concrete restaurant type facts for HARD restaurant criteria. For a POSITIVE criterion, SUPPORTED requires direct textual entailment from the cited type fact; a thematic association is not enough. CONFLICT and UNKNOWN do not establish it. For a NEGATIVE criterion, SUPPORTED requires a concrete stated type that supports excluding the prohibited type; CONFLICT means the prohibited type is stated. UNKNOWN means the facts are broad or insufficient. Never infer from a missing keyword, a venue name, opening hours, or an uncited general impression. For a locality-relative cuisine criterion, determine whether the cited source-stated cuisine or food type belongs to the destination's native culinary context using requestContext.area and/or the grounded candidate.address. Unless the criterion explicitly requests a narrower city-, region-, or specialty-level cuisine, do not require city-specific regional cuisine: a broader native cuisine of the destination can satisfy it. When the criterion explicitly names a narrower locality or specialty scope, a broader national or destination-compatible cuisine does not establish that narrower condition; return UNKNOWN unless a cited fact clearly associates the cuisine or dishes with the same named narrower scope. A cited cuisine explicitly associated with a different narrower locality must not be marked SUPPORTED. You may use stable general culinary knowledge to interpret a source-stated cuisine or food category, but may not invent what the restaurant serves or derive a narrow cuisine specialty from the candidate address. The restaurant address alone does not establish local food. Locally sourced ingredients, local produce, or farm-to-table sourcing do not by themselves establish local cuisine. A cuisine clearly foreign to the destination must not be marked SUPPORTED. Generic or geographically uninformative restaurant labels remain UNKNOWN. Candidate name is identity context, never locality-cuisine evidence. Never decide that a restaurant has no spicy dishes." },
          { role: "user", content: JSON.stringify({ candidate: { name: input.candidate.restaurant.outletName, address: input.candidate.restaurant.address }, requestContext: { area: input.intent.area.query }, criteria: criteria.map((item) => ({ text: item.text, polarity: item.polarity })), observations }) },
        ],
        responseFormat: "JSON_SCHEMA",
        outputSchema: { name: "restaurant_fact_judgment", version: "1", jsonSchema: {
          type: "object", additionalProperties: false, required: ["judgments"], properties: {
            judgments: { type: "array", items: { type: "object", additionalProperties: false, required: ["criterion", "outcome", "evidenceIds"], properties: {
              criterion: { type: "string" }, outcome: { type: "string", enum: ["SUPPORTED", "CONFLICT", "UNKNOWN"] }, evidenceIds: { type: "array", items: { type: "string" } },
            } } },
          },
        } },
        timeoutMs: 8_000, fallback: "FAIL_CLOSED", maxOutputTokens: 320, temperature: 0, thinking: "disabled",
      });
      modelUsage = { calls: 1, ...(response.usage ? { usage: response.usage } : {}) };
      if (response.finishReason !== "TOOL_CALLS") return { evidence: [], modelUsage };
      output = JSON.parse(response.outputText);
    } catch { return { evidence: [], ...(modelUsage ? { modelUsage } : {}) }; }
    const sourceById = new Map(observations.map((item) => [item.evidenceId, item]));
    const seen = new Set<string>(); const verifiedPositive: string[] = []; const verifiedNegative: string[] = []; const violatedNegative: string[] = []; const citations: string[] = []; const negativeCitations: string[] = [];
    const rawJudgments = record(output)?.judgments;
    for (const item of Array.isArray(rawJudgments) ? rawJudgments : []) {
      const judgment = record(item);
      const criterion = typeof judgment?.criterion === "string" ? judgment.criterion.trim() : "";
      const outcome = judgment?.outcome as JudgmentOutcome | undefined;
      const evidenceIds = strings(judgment?.evidenceIds);
      const requestedCriterion = criteria.find((value) => normalized(value.text) === normalized(criterion));
      if (!criterion || seen.has(normalized(criterion)) || !requestedCriterion) continue;
      if (outcome !== "SUPPORTED" && outcome !== "CONFLICT" && outcome !== "UNKNOWN") continue;
      if (!evidenceIds.length || !evidenceIds.every((id) => sourceById.has(id))) continue;
      seen.add(normalized(criterion));
      if (outcome === "SUPPORTED" && requestedCriterion.polarity === "POSITIVE") {
        verifiedPositive.push(criterion);
        citations.push(...evidenceIds);
      }
      if (outcome === "SUPPORTED" && requestedCriterion.polarity === "NEGATIVE") {
        verifiedNegative.push(criterion);
        citations.push(...evidenceIds); negativeCitations.push(...evidenceIds);
      }
      if (outcome === "CONFLICT" && requestedCriterion.polarity === "NEGATIVE") {
        violatedNegative.push(criterion);
        citations.push(...evidenceIds); negativeCitations.push(...evidenceIds);
      }
    }
    if (!verifiedPositive.length && !verifiedNegative.length && !violatedNegative.length) return { evidence: [], ...(modelUsage ? { modelUsage } : {}) };
    const observedAt = this.now(); const cited = [...new Set(citations)];
    return { evidence: [{
      evidenceId: "fact-judgment:" + input.candidate.restaurant.id + ":" + observedAt + ":" + cited.join(","),
      // This is deliberately not attributed to the first cited provider or
      // source entity.  Its support chain is explicit below and every cited
      // raw observation remains independently auditable.
      kind: "RESTAURANT_FACT", provider: "MODEL_JUDGMENT", candidateId: input.candidate.restaurant.id, observedAt,
      requestFingerprint: JSON.stringify({ candidateId: input.candidate.restaurant.id, criteria: criteria.map((item) => item.text), cited }),
      claims: {
        ...(verifiedPositive.length ? { verifiedHardCriteria: verifiedPositive } : {}),
        ...(verifiedNegative.length ? { verifiedNegativeCriteria: verifiedNegative } : {}),
        ...(violatedNegative.length ? { violatedNegativeCriteria: violatedNegative } : {}),
        ...(negativeCitations.length ? { negativeCriterionJudgments: [...new Set(negativeCitations)].map((id) => "MODEL_CITED_TYPE_FACT:" + id) } : {}),
        supportingEvidenceIds: cited,
      },
    }], ...(modelUsage ? { modelUsage } : {}) };
  }
}
