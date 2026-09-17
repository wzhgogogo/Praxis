/**
 * A frozen evaluation coordinate may supplement only a `NEAR_USER` request.
 * Named areas are authoritative user conditions and must never be silently
 * replaced by the diagnostic coordinate.
 */
export function requiresEvaluationLocation(caseValue: unknown): boolean {
  if (!caseValue || typeof caseValue !== "object") return false;
  const semantic = (caseValue as { semantic?: unknown }).semantic;
  if (!semantic || typeof semantic !== "object") return false;
  const location = (semantic as { location?: unknown }).location;
  return Boolean(location && typeof location === "object" && (location as { relation?: unknown }).relation === "NEAR_USER");
}
