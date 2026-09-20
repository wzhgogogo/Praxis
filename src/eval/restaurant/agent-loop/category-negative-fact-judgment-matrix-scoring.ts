import { canonicalizeLocalityMatrixResponse, type LocalityMatrixCanonical } from "./locality-fact-judgment-matrix-scoring.js";
import type { CategoryNegativeExpected } from "./category-negative-fact-judgment-matrix.js";
import type { ModelResponse } from "../../../core/model/contracts.js";

export function scoreCategoryNegativeMatrixRun(input: {
  expected: CategoryNegativeExpected; response?: Pick<ModelResponse, "finishReason" | "outputText">; criterion: string; sourceEvidenceIds: readonly string[];
  verifiedNegativeCriteria: readonly string[]; violatedNegativeCriteria: readonly string[]; categoryUnknownNegativeCriteria: readonly string[]; supportingEvidenceIds: readonly string[];
}): { passed: boolean; canonical: LocalityMatrixCanonical; accepted: Record<string, readonly string[]> } {
  const canonical = canonicalizeLocalityMatrixResponse({ ...(input.response ? { response: input.response } : {}), targetCriterion: input.criterion, sourceEvidenceIds: input.sourceEvidenceIds, acceptedVerifiedHardCriteria: [], supportingEvidenceIds: input.supportingEvidenceIds });
  const outcome = canonical.rawJudgment?.outcome;
  const cited = canonical.citationStatus === "GROUNDED";
  let scope: unknown; try { scope = JSON.parse(input.response?.outputText ?? "{}").judgments?.find((item: any) => item?.criterion?.trim?.().toLowerCase() === input.criterion.trim().toLowerCase())?.scope; } catch { /* canonical reports malformed JSON */ }
  const accepted = { verifiedNegativeCriteria: input.verifiedNegativeCriteria, violatedNegativeCriteria: input.violatedNegativeCriteria, categoryUnknownNegativeCriteria: input.categoryUnknownNegativeCriteria };
  const has = (values: readonly string[]) => values.some((value) => value.trim().toLowerCase() === input.criterion.trim().toLowerCase());
  const supportMatchesCitation = input.supportingEvidenceIds.length > 0 && input.supportingEvidenceIds.every((id) => canonical.citedEvidenceIds.includes(id)) && canonical.citedEvidenceIds.every((id) => input.supportingEvidenceIds.includes(id));
  const passed = input.expected === "BLOCKED"
    ? canonical.responseStatus === "VALID" && cited && scope === "RESTAURANT_CATEGORY_TYPE" && outcome === "CONFLICT" && supportMatchesCitation && has(input.violatedNegativeCriteria) && !has(input.verifiedNegativeCriteria)
    : canonical.responseStatus === "VALID" && cited && scope === "RESTAURANT_CATEGORY_TYPE" && outcome === "UNKNOWN" && supportMatchesCitation && has(input.categoryUnknownNegativeCriteria) && !has(input.verifiedNegativeCriteria) && !has(input.violatedNegativeCriteria);
  return { passed, canonical, accepted };
}
