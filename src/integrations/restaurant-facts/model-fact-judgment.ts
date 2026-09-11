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
 * State, a candidate ID, a URL, or an uncited condition conclusion.
 */
export class ModelRestaurantFactJudgment implements RestaurantFactJudgmentPort {
  constructor(private readonly model: ModelGateway, private readonly now: () => string = () => new Date().toISOString()) {}

  async judge(input: { candidate: RestaurantCandidate; intent: RestaurantSearchIntent; evidence: RestaurantReadEvidence[] }): Promise<RestaurantFactJudgmentResult> {
    const criteria = input.intent.criteria.filter((item) => item.polarity === "NEGATIVE" && item.strength === "HARD");
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
        promptVersion: "1",
        messages: [
          { role: "system", content: "Interpret cited source-stated restaurant type facts for explicitly scoped negative restaurant-type criteria. SUPPORTED requires a concrete stated type that supports excluding the prohibited type; CONFLICT means it is prohibited; UNKNOWN means facts are broad or insufficient. Never infer from a missing keyword. Never decide that a restaurant has no spicy dishes." },
          { role: "user", content: JSON.stringify({ candidate: { name: input.candidate.restaurant.outletName, address: input.candidate.restaurant.address }, criteria: criteria.map((item) => item.text), observations }) },
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
    } catch { return { evidence: [] }; }
    const sourceById = new Map(observations.map((item) => [item.evidenceId, item]));
    const seen = new Set<string>(); const verified: string[] = []; const violated: string[] = []; const citations: string[] = [];
    const rawJudgments = record(output)?.judgments;
    for (const item of Array.isArray(rawJudgments) ? rawJudgments : []) {
      const judgment = record(item);
      const criterion = typeof judgment?.criterion === "string" ? judgment.criterion.trim() : "";
      const outcome = judgment?.outcome as JudgmentOutcome | undefined;
      const evidenceIds = strings(judgment?.evidenceIds);
      if (!criterion || seen.has(normalized(criterion)) || !criteria.some((value) => normalized(value.text) === normalized(criterion))) continue;
      if (outcome !== "SUPPORTED" && outcome !== "CONFLICT" && outcome !== "UNKNOWN") continue;
      if (!evidenceIds.length || !evidenceIds.every((id) => sourceById.has(id))) continue;
      seen.add(normalized(criterion));
      if (outcome === "SUPPORTED") verified.push(criterion);
      if (outcome === "CONFLICT") violated.push(criterion);
      citations.push(...evidenceIds);
    }
    if (!verified.length && !violated.length) return { evidence: [], ...(modelUsage ? { modelUsage } : {}) };
    const observedAt = this.now(); const cited = [...new Set(citations)]; const provider = sourceById.get(cited[0]!)!.provider;
    return { evidence: [{
      evidenceId: "fact-judgment:" + input.candidate.restaurant.id + ":" + observedAt + ":" + cited.join(","),
      kind: "RESTAURANT_FACT", provider, candidateId: input.candidate.restaurant.id, observedAt,
      requestFingerprint: JSON.stringify({ candidateId: input.candidate.restaurant.id, criteria: criteria.map((item) => item.text), cited }),
      claims: {
        ...(verified.length ? { verifiedNegativeCriteria: verified } : {}),
        ...(violated.length ? { violatedNegativeCriteria: violated } : {}),
        negativeCriterionJudgments: cited.map((id) => "MODEL_CITED_TYPE_FACT:" + id),
        supportingEvidenceIds: cited,
      },
    }], ...(modelUsage ? { modelUsage } : {}) };
  }
}
