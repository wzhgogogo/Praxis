/** Narrow P2-2 action oracle. These source URL grammars implement the reviewed
 * annotation definition, independently of the production hint classifier. */
type Row = Record<string, unknown>;
const row = (v: unknown): Row => v && typeof v === "object" && !Array.isArray(v) ? v as Row : {};
const list = (v: unknown): Row[] => Array.isArray(v) ? v.map(row) : [];
const strings = (v: unknown): string[] => Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
const normalized = (v: string) => v.normalize("NFKC").toLowerCase().trim();

export interface SelectionRule {
  type: string;
  /** Exact original reviewer condition; an uncompiled condition is unassessed. */
  when: string;
  requireInRadius: boolean;
  path: "SUPPORTED" | "DIRECT" | "DIRECT_WHEN_THREE" | "MANUAL";
  requireMissingHard: boolean;
}
export interface SelectionAnnotation { seedId: string; acceptableActions: Array<{ type: string; when: string }>; }

function direct(sourceIds: Row): boolean {
  return [sourceIds.tabelogNativeDetailUri,sourceIds.tablecheckNativeGuideUri,sourceIds.googleWebsiteUri,sourceIds.googleListedTableCheckUri].some(value => {
    if (typeof value !== "string") return false;
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
      return url.hostname === "tabelog.com" && /^\/(?:[a-z]{2}\/)?[a-z-]+\/A\d+\/A\d+\/\d+(?:\/|$)/.test(url.pathname)
        || url.hostname === "www.tablecheck.com" && /^\/(?:[a-z]{2}\/)?(?:shops\/)?(?!japan(?:\/|$)|search(?:\/|$)|login(?:\/|$))[a-z0-9][a-z0-9-]+(?:\/reserve(?:\/.*)?)?\/?$/.test(url.pathname);
    } catch { return false; }
  });
}

export function assessSelectionReplay(actionValue: unknown, contextValue: unknown, observedOutlets: readonly unknown[], annotation: SelectionAnnotation, rules: readonly SelectionRule[], radiusMeters: number) {
  const action = row(actionValue), context = row(contextValue), candidates = list(context.candidates), legal = row(context.legalActions);
  const sourceById = new Map(observedOutlets.map(value => { const source = row(value); return [source.id,row(source.sourceIds)] as const; }));
  const inRadius = (candidate: Row) => typeof row(candidate.distanceObservation).meters === "number" && (row(candidate.distanceObservation).meters as number) <= radiusMeters && (row(candidate.distanceObservation).meters as number) >= 0;
  const isDirect = (candidate: Row) => direct(sourceById.get(candidate.id) ?? {});
  const checkable = strings(context.checkableCandidateIds ?? legal.checkAvailability);
  const directCheckable = candidates.filter(candidate => inRadius(candidate) && isDirect(candidate) && checkable.includes(String(candidate.id)));
  const ids = strings(action.candidateIds), selected = ids.flatMap(id => candidates.filter(candidate => candidate.id === id));
  const metrics = { selected: ids.length, directSelected: selected.filter(isDirect).length, directInRadiusCheckable: directCheckable.length,
    directSelectionRatio: ids.length ? selected.filter(isDirect).length/ids.length : null };
  const alternatives = annotation.acceptableActions.filter(option => option.type === action.type);
  if (!alternatives.length) return { verdict: "NOT_ACCEPTABLE", reasons: ["Action type is not among the independently annotated alternatives."], metrics };
  const rule = rules.find(rule => rule.type === action.type && alternatives.some(option => option.when === rule.when));
  if (!rule || rule.path === "MANUAL") return { verdict: "NOT_EVALUATED", reasons: ["The complete reviewer condition has no automatic evidence check; action type alone is insufficient."], metrics };
  if (!ids.length || ids.length > 3 || new Set(ids).size !== ids.length || selected.length !== ids.length) return { verdict: "NOT_ACCEPTABLE", reasons: ["Selection must contain one to three distinct observed candidates."], metrics };
  if (selected.some(candidate => !sourceById.has(candidate.id))) return { verdict: "NOT_EVALUATED", reasons: ["Pre-decision source IDs are missing."], metrics };
  const legalIds = action.type === "CHECK_AVAILABILITY" ? checkable : strings(context.factInvestigableCandidateIds ?? legal.investigateCandidateFacts);
  if (selected.some(candidate => !legalIds.includes(String(candidate.id)))) return { verdict: "NOT_ACCEPTABLE", reasons: ["A selected ID is outside the captured legal action scope."], metrics };
  if (rule.requireInRadius && selected.some(candidate => row(candidate.distanceObservation).meters === undefined)) return { verdict: "NOT_EVALUATED", reasons: ["Required captured distance is missing."], metrics };
  if (rule.requireInRadius && !selected.every(inRadius)) return { verdict: "NOT_ACCEPTABLE", reasons: ["Every selected candidate must be in radius."], metrics };
  const mustDirect = rule.path === "DIRECT" || rule.path === "DIRECT_WHEN_THREE" && directCheckable.length >= 3;
  if (mustDirect && !selected.every(isDirect)) return { verdict: "NOT_ACCEPTABLE", reasons: ["Every selected candidate must be DIRECT when the annotated direct alternatives are available."], metrics };
  if (selected.some(candidate => !isDirect(candidate) && !["googlePlaces","tabelog","tablecheck"].some(key => typeof sourceById.get(candidate.id)?.[key] === "string"))) return { verdict: "NOT_EVALUATED", reasons: ["No observed supported source ID establishes a name-resolution path."], metrics };
  // For this registered replay, two supported availability Packs provide name
  // resolution for ordinary observed Google candidates. No source-specific
  // URL, identity, HARD or inventory success is inferred from that possibility.
  if (rule.requireMissingHard) {
    const intent = row(context.intent ?? context.intentDraft), hard = list(intent.criteria).filter(item => item.strength === "HARD" && item.polarity === "POSITIVE");
    if (!hard.length) return { verdict: "NOT_EVALUATED", reasons: ["Missing identity/area facts cannot be independently reconstructed from this context."], metrics };
    if (!selected.every(candidate => hard.some(criterion => !strings(row(candidate.observedFacts).verifiedHardCriteria).some(text => normalized(text) === normalized(String(criterion.text)))))) return { verdict: "NOT_ACCEPTABLE", reasons: ["Fact investigation does not target a missing recorded HARD fact."], metrics };
  }
  return { verdict: "ACCEPTABLE", reasons: ["All compiled reviewer conditions were checked against captured candidates, distance, source IDs, legal scope and missing facts."], metrics };
}
