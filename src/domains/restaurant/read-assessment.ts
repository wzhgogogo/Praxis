import { restaurantAvailabilityRequestFingerprint, type RestaurantTaskState } from "./contracts.js";
import { completeRestaurantIntent, completeRestaurantSearchIntent } from "./intent-state.js";
import { isDisplayFresh } from "./availability-freshness.js";

/**
 * A pure, Domain-owned view of what the current read evidence proves and
 * which bounded reads are still eligible.  It deliberately does not choose an
 * Agent action, call a source, or mutate State.
 */
export interface RestaurantPresentationReadiness {
  candidateId: string;
  eligible: boolean;
  missingReason?: string;
  recheckReason?: "DISPLAY_EVIDENCE_EXPIRED" | "USER_REQUESTED_REFRESH";
}

export interface RestaurantReadAssessment {
  presentation: RestaurantPresentationReadiness[];
  factInvestigableCandidateIds: string[];
  checkableCandidateIds: string[];
  investigationRecorded: boolean;
  canEndRead: boolean;
  endReadBlockReason?: string;
  unresolvedCandidateIds: string[];
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

function stringClaim(evidence: RestaurantTaskState["readEvidence"][number], key: string): string | undefined {
  const value = evidence.claims[key];
  return typeof value === "string" ? value : undefined;
}

function stringListClaim(evidence: RestaurantTaskState["readEvidence"][number], key: string): string[] {
  const value = evidence.claims[key];
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : [];
}

export function restaurantGoalRequiresAvailability(intent: NonNullable<ReturnType<typeof completeRestaurantSearchIntent>>): boolean {
  return intent.target?.goal === "AVAILABILITY";
}

/** Shared current-source view for presentation and the bounded Agent summary. */
export function restaurantCurrentFactEvidence(state: Readonly<RestaurantTaskState>, candidateId: string): RestaurantTaskState["readEvidence"] {
  const candidateEvidence = state.readEvidence.filter(evidence => evidence.candidateId === candidateId);
  const check = state.factChecks?.[candidateId];
  const superseded = new Set(check?.supersededEvidenceIds ?? []);
  const sources = new Set(check?.sourceAttempts?.map(attempt => attempt.source)
    ?? (check?.sourceProvider ? [check.sourceProvider] : (check?.evidenceIds ?? []).flatMap(id => {
      const evidence = candidateEvidence.find(item => item.evidenceId === id);
      return evidence?.kind === "RESTAURANT_FACT" && evidence.provider !== "MODEL_JUDGMENT" ? [evidence.provider] : [];
    })));
  const facts = candidateEvidence.filter(evidence => evidence.kind === "RESTAURANT_FACT" && !superseded.has(evidence.evidenceId)
    && (!check || (evidence.provider !== "MODEL_JUDGMENT" && sources.size > 0 && !sources.has(evidence.provider)) || check.evidenceIds.includes(evidence.evidenceId)));
  const hasIdentity = (fact: RestaurantTaskState["readEvidence"][number]) => candidateEvidence.some(entity => entity.kind === "ENTITY_MATCH"
    && entity.entityMatch?.confidence === "HIGH" && entity.provider === fact.provider && entity.sourceEntityId === fact.sourceEntityId);
  const rawFacts = facts.filter(fact => fact.provider !== "MODEL_JUDGMENT" && hasIdentity(fact));
  return facts.filter(fact => {
    if (fact.provider !== "MODEL_JUDGMENT") return rawFacts.includes(fact);
    const citations = stringListClaim(fact, "supportingEvidenceIds");
    return citations.length > 0 && citations.every(id => rawFacts.some(source => source.evidenceId === id));
  });
}

function presentationEvidenceIds(
  state: Readonly<RestaurantTaskState>,
  candidateId: string,
  intent: NonNullable<ReturnType<typeof completeRestaurantSearchIntent>>,
  now: string,
): { valid: true; evidenceIds: string[] } | { valid: false; reason: string } {
  const candidateEvidence = state.readEvidence.filter((evidence) => evidence.candidateId === candidateId);
  const immediate = state.intentDraft?.temporalResolution?.immediateAvailability;
  if (immediate && new Date(now).valueOf() > new Date(immediate.validUntil).valueOf()) {
    return { valid: false, reason: "The immediate availability observation has expired and cannot be presented" };
  }
  const entities = candidateEvidence.filter((evidence) => evidence.kind === "ENTITY_MATCH" && evidence.entityMatch?.confidence === "HIGH");
  const groundedCurrentFacts = restaurantCurrentFactEvidence(state, candidateId);
  const identityFor = (evidence: RestaurantTaskState["readEvidence"][number]) =>
    entities.find((entity) => entity.provider === evidence.provider && entity.sourceEntityId === evidence.sourceEntityId);
  const sourceFactsFor = (evidence: RestaurantTaskState["readEvidence"][number]) => evidence.provider === "MODEL_JUDGMENT"
    ? stringListClaim(evidence, "supportingEvidenceIds").map(id => groundedCurrentFacts.find(item => item.evidenceId === id)!)
    : [evidence];
  const area = candidateEvidence.find((evidence) =>
    evidence.kind === "DISCOVERY" && evidence.claims.areaMatch === true && normalized(stringClaim(evidence, "areaQuery") ?? "") === normalized(intent.area.query),
  );
  if (!area) return { valid: false, reason: `Candidate ${candidateId} has no evidence that it satisfies ${intent.area.query}` };
  const currentBookingIntent = completeRestaurantIntent(state.intentDraft);
  const currentNoSlot = !restaurantGoalRequiresAvailability(intent) && currentBookingIntent && state.availabilityChecks[candidateId]?.status === "UNAVAILABLE" &&
    state.availabilityChecks[candidateId]?.requestFingerprint === restaurantAvailabilityRequestFingerprint(currentBookingIntent);
  if (currentNoSlot) return { valid: false, reason: `Candidate ${candidateId} has an explicit no-matching-slot observation for the current request` };
  for (const criterion of intent.criteria.filter((item) => item.polarity === "POSITIVE" && item.strength === "HARD")) {
    const supported = groundedCurrentFacts.some((evidence) =>
      stringListClaim(evidence, "verifiedHardCriteria").some((value) => normalized(value) === normalized(criterion.text)),
    );
    if (!supported) return { valid: false, reason: `Candidate ${candidateId} has no evidence for HARD criterion ${criterion.text}` };
  }
  for (const criterion of intent.criteria.filter((item) => item.polarity === "NEGATIVE" && item.strength === "HARD")) {
    const violated = groundedCurrentFacts.some((evidence) =>
      stringListClaim(evidence, "violatedNegativeCriteria").some((value) => normalized(value) === normalized(criterion.text)),
    );
    if (violated) return { valid: false, reason: `Candidate ${candidateId} violates negative criterion ${criterion.text}` };
    const supported = groundedCurrentFacts.some((evidence) =>
      stringListClaim(evidence, "verifiedNegativeCriteria").some((value) => normalized(value) === normalized(criterion.text)),
    );
    if (!supported) return { valid: false, reason: `Candidate ${candidateId} has no source fact supporting negative criterion ${criterion.text}` };
  }
  if (!restaurantGoalRequiresAvailability(intent)) {
    const openingHours = intent.date && intent.timeWindow
      ? groundedCurrentFacts.find((evidence) => evidence.claims.openingHoursMatch === true)
      : undefined;
    if (intent.date && intent.timeWindow && !openingHours) return { valid: false, reason: `Candidate ${candidateId} has no opening-hours evidence for the requested visit window` };
    const relevantFacts = [...new Set([...groundedCurrentFacts, ...(openingHours ? [openingHours] : [])])];
    const identityEvidenceIds = relevantFacts.flatMap((fact) => sourceFactsFor(fact)
      .map((source) => identityFor(source)?.evidenceId)
      .filter((evidenceId): evidenceId is string => Boolean(evidenceId)));
    if (!identityEvidenceIds.length) return { valid: false, reason: `Candidate ${candidateId} has no HIGH outlet identity evidence associated with its current facts` };
    return { valid: true, evidenceIds: [...new Set([area.evidenceId, ...identityEvidenceIds, ...relevantFacts.map((evidence) => evidence.evidenceId), ...relevantFacts.flatMap((fact) => sourceFactsFor(fact).map((source) => source.evidenceId))])] };
  }
  const bookingIntent = completeRestaurantIntent(state.intentDraft);
  if (!bookingIntent) return { valid: false, reason: "Availability requested but party size is missing" };
  const permittedWindow = bookingIntent.permittedAlternativeTimeWindow ?? bookingIntent.timeWindow;
  const offer = state.availability[candidateId]?.find((item) =>
    isDisplayFresh(item.displayExpiresAt, now) && item.partySize === bookingIntent.partySize && item.dateTime.slice(0, 10) === bookingIntent.date &&
    item.dateTime.slice(11, 16) >= permittedWindow.earliest && item.dateTime.slice(11, 16) <= permittedWindow.latest,
  );
  const availability = candidateEvidence.find((evidence) => evidence.kind === "AVAILABILITY" && isDisplayFresh(evidence.displayExpiresAt, now) &&
    stringClaim(evidence, "date") === bookingIntent.date && evidence.claims.partySize === bookingIntent.partySize && offer !== undefined &&
    stringListClaim(evidence, "visibleSlots").includes(offer.dateTime.slice(11, 16)));
  const entity = availability ? entities.find((item) => item.provider === availability.provider && item.sourceEntityId === availability.sourceEntityId) : undefined;
  if (!entity) return { valid: false, reason: `Candidate ${candidateId} has no HIGH outlet identity evidence associated with its availability source` };
  if (!offer || state.availabilityChecks[candidateId]?.status !== "AVAILABLE" || !availability) return { valid: false, reason: `Candidate ${candidateId} lacks fresh evidenced availability for the authoritative request` };
  const factIdentityIds = groundedCurrentFacts.flatMap(fact => sourceFactsFor(fact).map(source => identityFor(source)!.evidenceId));
  return { valid: true, evidenceIds: [...new Set([entity.evidenceId, area.evidenceId, availability.evidenceId, ...factIdentityIds, ...groundedCurrentFacts.map((evidence) => evidence.evidenceId)])] };
}

export function restaurantPresentationEvidenceIds(state: Readonly<RestaurantTaskState>, candidateId: string, now: string): string[] | undefined {
  const intent = completeRestaurantSearchIntent(state.intentDraft);
  if (!intent) return undefined;
  const result = presentationEvidenceIds(state, candidateId, intent, now);
  return result.valid ? result.evidenceIds : undefined;
}

export function assessRestaurantRead(state: Readonly<RestaurantTaskState>, now: string): RestaurantReadAssessment {
  const intent = completeRestaurantSearchIntent(state.intentDraft);
  if (!intent) return { presentation: [], factInvestigableCandidateIds: [], checkableCandidateIds: [], investigationRecorded: false, canEndRead: false, endReadBlockReason: "The current request is incomplete", unresolvedCandidateIds: [] };
  const presentation = state.candidates.map((candidate) => {
    const candidateId = candidate.restaurant.id;
    const userRequestedRefresh = state.refreshRequestedCandidateIds?.includes(candidateId) ?? false;
    if (userRequestedRefresh) return { candidateId, eligible: false, missingReason: "A user-requested read-only refresh is pending", recheckReason: "USER_REQUESTED_REFRESH" as const };
    const evidence = presentationEvidenceIds(state, candidateId, intent, now);
    if (evidence.valid) return { candidateId, eligible: true };
    const check = state.availabilityChecks[candidateId];
    const hasExpiredDisplayEvidence = check?.status === "AVAILABLE" && !isDisplayFresh(check.displayExpiresAt, now);
    return { candidateId, eligible: false, missingReason: evidence.reason, ...(hasExpiredDisplayEvidence ? { recheckReason: "DISPLAY_EVIDENCE_EXPIRED" as const } : {}) };
  });
  const factRefreshTargets = state.factRefreshRequestedCandidateIds ?? [];
  const factInvestigableCandidateIds = presentation.filter((item) => {
    const refreshing = factRefreshTargets.includes(item.candidateId);
    if (factRefreshTargets.length && !refreshing) return false;
    if (!refreshing && state.factChecks?.[item.candidateId] !== undefined) return false;
    const candidate = state.candidates.find((value) => value.restaurant.id === item.candidateId);
    return state.sourceReadState?.googlePlacesSearchBudget !== "EXHAUSTED" || Boolean(candidate?.restaurant.sourceIds.googleWebsiteUri);
  }).map((item) => item.candidateId);
  const completeBookingIntent = completeRestaurantIntent(state.intentDraft);
  const checkableCandidateIds = completeBookingIntent ? presentation.filter((item) =>
    state.availabilityChecks[item.candidateId] === undefined || item.recheckReason !== undefined,
  ).map((item) => item.candidateId) : [];
  const investigationRecorded = state.searchRevision > 0 || Object.keys(state.factChecks ?? {}).length > 0 || Object.keys(state.availabilityChecks).length > 0;
  const unresolvedCandidateIds = presentation.filter((item) => !item.eligible).map((item) => item.candidateId);
  const refreshPending = (state.refreshRequestedCandidateIds?.length ?? 0) > 0 || (state.factRefreshRequestedCandidateIds?.length ?? 0) > 0;
  const internalFailure = state.failure && /^(AGENT_|SEMANTIC_|BROWSER_RUNTIME|BROWSER_TIMEOUT)/.test(state.failure.code);
  const canEndRead = investigationRecorded && !refreshPending && !internalFailure && !presentation.some((item) => item.eligible);
  return { presentation, factInvestigableCandidateIds, checkableCandidateIds, investigationRecorded, canEndRead, ...(canEndRead ? {} : { endReadBlockReason: !investigationRecorded ? "No actual source investigation is recorded" : refreshPending ? "A user-requested refresh remains pending" : internalFailure ? "An internal execution failure is recorded" : "A grounded result is available and must not be ignored" }), unresolvedCandidateIds };
}
