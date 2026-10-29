import type { GroundedAvailability } from "../../domains/restaurant/read-grounding.js";
import type { RestaurantReadEvidence } from "../../domains/restaurant/contracts.js";

/** Keep earlier same-read source facts at their own URL/read time; never copy them into stock. */
export function mergeQuotedSourceFacts<Result extends GroundedAvailability>(result: Result, facts: readonly RestaurantReadEvidence[]): Result {
  const added = facts.filter(item => (item.kind === "RESTAURANT_FACT" || item.kind === "ENTITY_MATCH" && item.entityMatch?.confidence === "HIGH") && !result.evidence.some(existing => existing.evidenceId === item.evidenceId));
  if (!added.length) return result;
  result.evidence.push(...added); result.check.evidenceIds.push(...added.map(item=>item.evidenceId));
  result.candidateFactUpdate = { candidateId: added[0]!.candidateId,
    matchReasons: result.candidateFactUpdate?.matchReasons ?? [],
    evidenceIds: [...new Set([...(result.candidateFactUpdate?.evidenceIds ?? []),...added.filter(item=>item.kind === "RESTAURANT_FACT").map(item=>item.evidenceId)])] };
  return result;
}
