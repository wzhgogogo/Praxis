export type DomChangeVerdict = "PASS" | "DEGRADED_HONEST" | "FAIL" | "INVALID_MUTATION";
export interface DomChangeClassification { verdict: DomChangeVerdict; lost: string[]; contradictions: string[]; newlyKnown: string[] }
/** Null/missing is unknown; readiness/completion flags alone never create a fact. */
export function classifyDomChange(before: Record<string, unknown>, after: Record<string, unknown>, validMutation: boolean): DomChangeClassification {
  const result: DomChangeClassification = { verdict: "PASS", lost: [], contradictions: [], newlyKnown: [] };
  if (!validMutation) return { ...result, verdict: "INVALID_MUTATION" };
  for (const key of [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()) {
    const old = before[key], value = after[key], oldKnown = old !== undefined && old !== null, known = value !== undefined && value !== null;
    if (oldKnown && !known) result.lost.push(key);
    else if (!oldKnown && known) result.newlyKnown.push(key);
    else if (oldKnown && known && JSON.stringify(old) !== JSON.stringify(value)) result.contradictions.push(key);
  }
  result.verdict = result.contradictions.length || result.newlyKnown.length ? "FAIL" : result.lost.length ? "DEGRADED_HONEST" : "PASS";
  return result;
}
