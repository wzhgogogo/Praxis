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

function hasCurrentHardConflict(state: Readonly<RestaurantTaskState>, candidateId: string, intent: NonNullable<ReturnType<typeof completeRestaurantSearchIntent>>): boolean {
  const excluded = intent.criteria.filter((item) => item.polarity === "NEGATIVE" && item.strength === "HARD");
  if (excluded.length === 0) return false;
  return restaurantCurrentFactEvidence(state, candidateId).some((evidence) =>
    stringListClaim(evidence, "violatedNegativeCriteria").some((value) => excluded.some((criterion) => normalized(value) === normalized(criterion.text))));
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
  const scopeFor = (evidence: RestaurantTaskState["readEvidence"][number]) => {
    const field = stringClaim(evidence, "serviceScopeField");
    const group = stringClaim(evidence, "serviceScopeGroup");
    const value = stringClaim(evidence, "serviceScopeValue");
    return field && group && value ? { field, group, value } : undefined;
  };
  const scopeMatchesOffer = (evidence: RestaurantTaskState["readEvidence"][number], offer: NonNullable<RestaurantTaskState["availability"][string]>[number]) => {
    const scope = scopeFor(evidence);
    // Inventory for a selected public service category is narrower than an
    // outlet-wide claim.  A menu fact without source evidence tying it to the
    // selected category cannot qualify that category's offer.  Venue-wide
    // negative conflicts are checked separately below and remain applicable.
    if (!offer.serviceScope) return scope === undefined;
    return scope !== undefined
      && offer.serviceScope.field === scope.field && offer.serviceScope.group === scope.group && offer.serviceScope.value === scope.value;
  };
  const area = candidateEvidence.find((evidence) =>
    evidence.kind === "DISCOVERY" && evidence.claims.areaMatch === true && normalized(stringClaim(evidence, "areaQuery") ?? "") === normalized(intent.area.query),
  );
  if (!area) return { valid: false, reason: `Candidate ${candidateId} has no evidence that it satisfies ${intent.area.query}` };
  const currentBookingIntent = completeRestaurantIntent(state.intentDraft);
  const currentNoSlot = !restaurantGoalRequiresAvailability(intent) && currentBookingIntent && state.availabilityChecks[candidateId]?.status === "UNAVAILABLE" &&
    state.availabilityChecks[candidateId]?.requestFingerprint === restaurantAvailabilityRequestFingerprint(currentBookingIntent);
  if (currentNoSlot) return { valid: false, reason: `Candidate ${candidateId} has an explicit no-matching-slot observation for the current request` };
  const verifyHardCriteria = (facts: RestaurantTaskState["readEvidence"]) => {
    for (const criterion of intent.criteria.filter((item) => item.polarity === "POSITIVE" && item.strength === "HARD")) {
      const supported = facts.some((evidence) =>
        stringListClaim(evidence, "verifiedHardCriteria").some((value) => normalized(value) === normalized(criterion.text)),
      );
      if (!supported) return `Candidate ${candidateId} has no evidence for HARD criterion ${criterion.text}`;
    }
    for (const criterion of intent.criteria.filter((item) => item.polarity === "NEGATIVE" && item.strength === "HARD")) {
    // A confirmed negative HARD conflict describes the outlet itself. A
    // service-category selection can scope menu/slot support, but cannot
    // erase that already evidenced restaurant-level exclusion.
    const violated = groundedCurrentFacts.some((evidence) =>
      stringListClaim(evidence, "violatedNegativeCriteria").some((value) => normalized(value) === normalized(criterion.text)),
    );
    if (violated) return `Candidate ${candidateId} violates negative criterion ${criterion.text}`;
    const supported = facts.some((evidence) =>
      stringListClaim(evidence, "verifiedNegativeCriteria").some((value) => normalized(value) === normalized(criterion.text)),
    );
    if (supported) continue;
    // A cited category/type judgment may establish only that no violation is
    // known. It is deliberately not a verified-negative claim, and every
    // other negative HARD condition retains the original fail-closed gate.
    const categoryUnknown = facts.some((evidence) =>
      evidence.provider === "MODEL_JUDGMENT"
      && stringListClaim(evidence, "supportingEvidenceIds").length > 0
      && stringListClaim(evidence, "supportingEvidenceIds").every((id) => facts.some((source) => source.provider !== "MODEL_JUDGMENT" && source.evidenceId === id && stringListClaim(source, "restaurantTypeFacts").some((value) => value.trim().length > 0)))
      && stringListClaim(evidence, "categoryUnknownNegativeCriteria").some((value) => normalized(value) === normalized(criterion.text)),
    );
    if (!categoryUnknown) return `Candidate ${candidateId} has no source fact supporting negative criterion ${criterion.text}`;
    }
    return undefined;
  };
  if (!restaurantGoalRequiresAvailability(intent)) {
    const hardFailure = verifyHardCriteria(groundedCurrentFacts);
    if (hardFailure) return { valid: false, reason: hardFailure };
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
    stringListClaim(evidence, "visibleSlots").includes(offer.dateTime.slice(11, 16)) && scopeMatchesOffer(evidence, offer));
  if (!offer || state.availabilityChecks[candidateId]?.status !== "AVAILABLE" || !availability) return { valid: false, reason: `Candidate ${candidateId} lacks fresh evidenced availability for the authoritative request` };
  const applicableFacts = groundedCurrentFacts.filter((fact) => scopeMatchesOffer(fact, offer)
    && (fact.provider !== "MODEL_JUDGMENT" || sourceFactsFor(fact).every((source) => scopeMatchesOffer(source, offer))));
  const hardFailure = verifyHardCriteria(applicableFacts);
  if (hardFailure) return { valid: false, reason: hardFailure };
  const entity = entities.find((item) => item.provider === availability.provider && item.sourceEntityId === availability.sourceEntityId);
  if (!entity) return { valid: false, reason: `Candidate ${candidateId} has no HIGH outlet identity evidence associated with its availability source` };
  const factIdentityIds = applicableFacts.flatMap(fact => sourceFactsFor(fact).map(source => identityFor(source)!.evidenceId));
  // An availability read can include its own contemporaneous fact evidence.
  // If a later fact read from the same source supersedes one of those facts,
  // the presentation must retain the availability/identity evidence but not
  // revive the obsolete fact merely because it was named by the earlier
  // availability check.
  const currentFactIds = new Set(applicableFacts.map((evidence) => evidence.evidenceId));
  const checkEvidenceIds = state.availabilityChecks[candidateId].evidenceIds.filter((id) => {
    const evidence = candidateEvidence.find((item) => item.evidenceId === id);
    return evidence !== undefined && (evidence.kind !== "RESTAURANT_FACT" || currentFactIds.has(id));
  });
  return { valid: true, evidenceIds: [...new Set([entity.evidenceId, area.evidenceId, availability.evidenceId, ...checkEvidenceIds, ...factIdentityIds, ...applicableFacts.map((evidence) => evidence.evidenceId)])] };
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
  // A pending next batch is a continuation of the same request, not a reason
  // to reopen or count an already delivered restaurant again.
  const excludedFromPendingBatch = new Set(state.pendingResultBatchTarget === undefined
    ? []
    : state.selectionSession?.deliveredCandidateIds ?? []);
  const hardConflictedCandidates = new Set(state.candidates.filter((candidate) =>
    hasCurrentHardConflict(state, candidate.restaurant.id, intent)).map((candidate) => candidate.restaurant.id));
  const factInvestigableCandidateIds = presentation.filter((item) => {
    if (excludedFromPendingBatch.has(item.candidateId)) return false;
    const refreshing = factRefreshTargets.includes(item.candidateId);
    if (hardConflictedCandidates.has(item.candidateId) && !refreshing) return false;
    if (factRefreshTargets.length && !refreshing) return false;
    if (!refreshing && state.factChecks?.[item.candidateId] !== undefined) return false;
    const candidate = state.candidates.find((value) => value.restaurant.id === item.candidateId);
    return state.sourceReadState?.googlePlacesSearchBudget !== "EXHAUSTED"
      || Boolean(candidate?.restaurant.sourceIds.googleWebsiteUri)
      || Boolean(candidate?.restaurant.sourceIds.tabelogNativeDetailUri)
      || Boolean(candidate?.restaurant.sourceIds.tablecheckNativeGuideUri);
  }).map((item) => item.candidateId);
  const completeBookingIntent = completeRestaurantIntent(state.intentDraft);
  const checkableCandidateIds = completeBookingIntent ? presentation.filter((item) =>
    !excludedFromPendingBatch.has(item.candidateId) && !hardConflictedCandidates.has(item.candidateId)
      && (state.availabilityChecks[item.candidateId] === undefined || item.recheckReason !== undefined),
  ).map((item) => item.candidateId) : [];
  const investigationRecorded = state.searchRevision > 0 || Object.keys(state.factChecks ?? {}).length > 0 || Object.keys(state.availabilityChecks).length > 0;
  const relevantPresentation = presentation.filter((item) => !excludedFromPendingBatch.has(item.candidateId));
  const unresolvedCandidateIds = relevantPresentation.filter((item) => !item.eligible).map((item) => item.candidateId);
  const refreshPending = (state.refreshRequestedCandidateIds?.length ?? 0) > 0 || (state.factRefreshRequestedCandidateIds?.length ?? 0) > 0;
  const internalFailure = state.failure && /^(AGENT_|SEMANTIC_|BROWSER_RUNTIME|BROWSER_TIMEOUT)/.test(state.failure.code);
  const nativeSecondBatchPending = state.searchContinuation?.nativeStage === "TABELOG_DONE" && !state.searchContinuation.exhausted;
  const nativeCurrentBatchPending = state.searchContinuation?.nativeCurrentBatch
    ? nativeCurrentBatchInvestigationBlockReason(state) : undefined;
  const canEndRead = investigationRecorded && !refreshPending && !internalFailure && !nativeSecondBatchPending
    && !nativeCurrentBatchPending && !relevantPresentation.some((item) => item.eligible);
  return { presentation, factInvestigableCandidateIds, checkableCandidateIds, investigationRecorded, canEndRead, ...(canEndRead ? {} : { endReadBlockReason: !investigationRecorded ? "No actual source investigation is recorded" : refreshPending ? "A user-requested refresh remains pending" : internalFailure ? "An internal execution failure is recorded" : nativeSecondBatchPending ? "The bounded TableCheck native batch has not been read" : nativeCurrentBatchPending ?? "A grounded result is available and must not be ignored" }), unresolvedCandidateIds };
}

function nativeBatchInvestigationBlockReason(state: Readonly<RestaurantTaskState>, source: "TABELOG" | "TABLECHECK"): string | undefined {
  const intent = completeRestaurantSearchIntent(state.intentDraft);
  const batch = state.candidates.filter((candidate) => source === "TABELOG"
    ? Boolean(candidate.restaurant.sourceIds.tabelogNativeDetailUri) : Boolean(candidate.restaurant.sourceIds.tablecheckNativeGuideUri));
  for (const candidate of batch) {
    const candidateId = candidate.restaurant.id;
    const facts = state.factChecks?.[candidateId];
    if (!facts) return `${source} candidate ${candidateId} still needs its fact read before batch completion`;
    if (facts.status !== "COMPLETED" || !intent || !restaurantGoalRequiresAvailability(intent)) continue;
    const currentFacts = restaurantCurrentFactEvidence(state, candidateId);
    const positiveSupported = intent.criteria.filter((criterion) => criterion.polarity === "POSITIVE" && criterion.strength === "HARD")
      .every((criterion) => currentFacts.some((evidence) => stringListClaim(evidence, "verifiedHardCriteria")
        .some((value) => normalized(value) === normalized(criterion.text))));
    if (positiveSupported && !hasCurrentHardConflict(state, candidateId, intent) && !state.availabilityChecks[candidateId]) {
      return `${source} candidate ${candidateId} still needs its availability read before batch completion`;
    }
  }
  return undefined;
}

/** The second native batch can start only after the observed first batch has been investigated. */
export function nativeSecondBatchSearchBlockReason(state: Readonly<RestaurantTaskState>, now: string): string | undefined {
  // SEARCH, Context, END and short-batch delivery all consult this shared
  // assessment. A populated current batch is never bypassed merely because it
  // is the TableCheck batch or because nativeStage is no longer TABELOG_DONE.
  const currentBlock = nativeCurrentBatchInvestigationBlockReason(state);
  if (currentBlock) return currentBlock;
  if (nativeShortBatchDeliveryReady(state, now)) return "The investigated native batch has a grounded result to deliver";
  if (state.searchContinuation?.nativeStage !== "TABELOG_DONE") return undefined;
  const pending = nativeBatchInvestigationBlockReason(state, "TABELOG");
  if (pending) return pending;
  const firstBatch = state.candidates.filter((candidate) => Boolean(candidate.restaurant.sourceIds.tabelogNativeDetailUri));
  const assessment = assessRestaurantRead(state, now);
  const delivered = new Set(state.selectionSession?.deliveredCandidateIds ?? []);
  const firstBatchEligible = assessment.presentation.filter((item) => firstBatch.some((candidate) => candidate.restaurant.id === item.candidateId)
    && item.eligible && !delivered.has(item.candidateId));
  if (firstBatchEligible.length > 0 && state.intentDraft?.target?.requestedResultCount === undefined) {
    return "The investigated Tabelog native batch has a grounded result to deliver";
  }
  return undefined;
}

function nativeCurrentBatchInvestigationBlockReason(state: Readonly<RestaurantTaskState>): string | undefined {
  const currentBatch = state.searchContinuation?.nativeCurrentBatch;
  // An exhausted source records an empty current batch. There is no admitted
  // candidate left to investigate, so it must not prevent source handoff or
  // an evidence-backed empty conclusion.
  if (!currentBatch || currentBatch.candidateIds.length === 0) return undefined;
  const expectedSource = currentBatch.source === "TABELOG"
    ? (candidate: RestaurantTaskState["candidates"][number]) => Boolean(candidate.restaurant.sourceIds.tabelogNativeDetailUri)
    : (candidate: RestaurantTaskState["candidates"][number]) => Boolean(candidate.restaurant.sourceIds.tablecheckNativeGuideUri);
  const batchIds = new Set(currentBatch.candidateIds);
  const candidates = state.candidates.filter((candidate) => batchIds.has(candidate.restaurant.id) && expectedSource(candidate));
  if (candidates.length !== currentBatch.candidateIds.length) return "The current native batch no longer has a complete candidate record";
  const intent = completeRestaurantSearchIntent(state.intentDraft);
  for (const candidate of candidates) {
    const candidateId = candidate.restaurant.id;
    const facts = state.factChecks?.[candidateId];
    if (!facts) return `${currentBatch.source} candidate ${candidateId} still needs its fact read before current-batch delivery`;
    if (facts.status !== "COMPLETED" || !intent || !restaurantGoalRequiresAvailability(intent)) continue;
    const currentFacts = restaurantCurrentFactEvidence(state, candidateId);
    const positiveSupported = intent.criteria.filter((criterion) => criterion.polarity === "POSITIVE" && criterion.strength === "HARD")
      .every((criterion) => currentFacts.some((evidence) => stringListClaim(evidence, "verifiedHardCriteria")
        .some((value) => normalized(value) === normalized(criterion.text))));
    if (positiveSupported && !hasCurrentHardConflict(state, candidateId, intent) && !state.availabilityChecks[candidateId]) {
      return `${currentBatch.source} candidate ${candidateId} still needs its availability read before current-batch delivery`;
    }
  }
  return undefined;
}

/** For open-ended native reads, a completed current batch may deliver a grounded short batch. */
export function nativeShortBatchDeliveryReady(state: Readonly<RestaurantTaskState>, now: string): boolean {
  if (state.intentDraft?.target?.requestedResultCount !== undefined || state.intentDraft?.target?.selectionScope !== "OPEN_ENDED") return false;
  if (nativeCurrentBatchInvestigationBlockReason(state) !== undefined) return false;
  const batchIds = new Set(state.searchContinuation?.nativeCurrentBatch?.candidateIds ?? []);
  const delivered = new Set(state.selectionSession?.deliveredCandidateIds ?? []);
  return assessRestaurantRead(state, now).presentation.some((item) => batchIds.has(item.candidateId) && item.eligible && !delivered.has(item.candidateId));
}

/** Keep independently evidenced source records separate while refusing to count an unresolved same outlet twice. */
export function distinctNativeResultCandidateIds(state: Readonly<RestaurantTaskState>, candidateIds: readonly string[]): string[] {
  const compact = (value: string) => value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]+/gu, "");
  const selected: string[] = [];
  for (const id of candidateIds) {
    const candidate = state.candidates.find((item) => item.restaurant.id === id)?.restaurant;
    if (!candidate) { selected.push(id); continue; }
    const source = candidate.sourceIds.tabelogNativeDetailUri ? "TABELOG" : candidate.sourceIds.tablecheckNativeGuideUri ? "TABLECHECK" : undefined;
    const unresolvedSameOutlet = selected.some((priorId) => {
      const prior = state.candidates.find((item) => item.restaurant.id === priorId)?.restaurant;
      if (!prior) return false;
      const priorSource = prior.sourceIds.tabelogNativeDetailUri ? "TABELOG" : prior.sourceIds.tablecheckNativeGuideUri ? "TABLECHECK" : undefined;
      if (!source || !priorSource || source === priorSource) return false;
      const name = compact(candidate.outletName); const priorName = compact(prior.outletName);
      const address = compact(candidate.address); const priorAddress = compact(prior.address);
      return (name.length > 0 && name === priorName) || (address.length > 0 && address === priorAddress);
    });
    if (!unresolvedSameOutlet) selected.push(id);
  }
  return selected;
}
