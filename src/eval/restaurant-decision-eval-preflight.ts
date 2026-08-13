import {
  DECISION_ACTION_TYPES,
  DECISION_CORE_TOPICS,
  DECISION_DIVERSITY_AXES,
  DECISION_READINESS,
  DECISION_RELAXATION_TYPES,
  DECISION_TARGET_KINDS,
  PENDING_HUMAN_LABEL,
  type DecisionActionType,
  type DecisionEvalDataset,
} from "./restaurant-decision-eval-contract.js";
import {
  validateDecisionStateContract,
  validateDecisionStatePatchContract,
} from "./restaurant-decision-patch-contract.js";

export type DecisionEvalPreflightMode = "ANNOTATION_DRAFT" | "REQUIRE_COMPLETE";
export type DecisionEvalPreflightStatus =
  | "READY_FOR_ANNOTATION"
  | "READY_FOR_EVALUATOR"
  | "BLOCKED_PENDING_HUMAN_LABELS"
  | "INVALID";

export interface DecisionEvalPreflightIssue {
  code: "DATASET_INVALID" | "ANNOTATION_INCOMPLETE";
  rule: string;
  path: string;
  message: string;
}

export interface DecisionEvalPreflightReport {
  preflightVersion: "1";
  scope: "DATASET_ANNOTATION";
  mode: DecisionEvalPreflightMode;
  status: DecisionEvalPreflightStatus;
  datasetId?: string;
  datasetVersion?: string;
  stats: {
    candidatePools: number;
    candidates: number;
    candidateFacts: number;
    episodes: number;
    turns: number;
    labeledTurns: number;
    pendingTurns: number;
    byInitialClarity: Record<"E1" | "E2" | "E3", number>;
    byTargetKind: Record<"OPEN" | "CATEGORY" | "BRAND" | "RESTAURANT", number>;
  };
  issues: DecisionEvalPreflightIssue[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

function isUnique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

function isIdentifier(value: unknown): value is string {
  return isNonEmptyString(value) && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value);
}

function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isIsoDateTime(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

function pushInvalid(
  issues: DecisionEvalPreflightIssue[],
  path: string,
  rule: string,
  message: string,
): void {
  issues.push({ code: "DATASET_INVALID", path, rule, message });
}

function validateStringSet(
  value: unknown,
  path: string,
  issues: DecisionEvalPreflightIssue[],
): value is string[] {
  if (!isStringArray(value)) {
    pushInvalid(issues, path, "STRING_ARRAY", "must be an array of non-empty strings");
    return false;
  }
  if (!isUnique(value)) {
    pushInvalid(issues, path, "UNIQUE_VALUES", "must not contain duplicate values");
    return false;
  }
  return true;
}

function validateParty(value: unknown, path: string, issues: DecisionEvalPreflightIssue[]): void {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["min", "max", "precision"]) ||
    typeof value.min !== "number" ||
    !Number.isInteger(value.min) ||
    value.min < 1 ||
    typeof value.max !== "number" ||
    !Number.isInteger(value.max) ||
    value.max < value.min ||
    (value.precision !== "EXACT" && value.precision !== "RANGE")
  ) {
    pushInvalid(issues, path, "PARTY", "must contain a valid positive min/max and precision");
    return;
  }
  if (value.precision === "EXACT" && value.min !== value.max) {
    pushInvalid(issues, path, "EXACT_PARTY", "EXACT party requires equal min and max");
  }
  if (value.precision === "RANGE" && value.min === value.max) {
    pushInvalid(issues, path, "RANGE_PARTY", "RANGE party requires different min and max");
  }
}

function validateTarget(value: unknown, path: string, issues: DecisionEvalPreflightIssue[]): void {
  if (!isRecord(value) || !isOneOf(value.kind, DECISION_TARGET_KINDS)) {
    pushInvalid(issues, path, "TARGET", "must contain a supported target kind");
    return;
  }
  const allowed = value.kind === "OPEN" ? ["kind"] : value.kind === "RESTAURANT" ? ["kind", "query", "outletQuery"] : ["kind", "query"];
  if (!hasOnlyKeys(value, allowed)) {
    pushInvalid(issues, path, "SUPPORTED_FIELDS", "contains unsupported target fields");
  }
  if (value.kind !== "OPEN" && !isNonEmptyString(value.query)) {
    pushInvalid(issues, `${path}.query`, "TARGET_QUERY", "must be a non-empty string");
  }
  if (value.outletQuery !== undefined && !isNonEmptyString(value.outletQuery)) {
    pushInvalid(issues, `${path}.outletQuery`, "OUTLET_QUERY", "must be a non-empty string");
  }
}

function validateNamedTargetResolution(
  value: unknown,
  path: string,
  issues: DecisionEvalPreflightIssue[],
): void {
  if (!isRecord(value)) {
    pushInvalid(issues, path, "NAMED_TARGET_RESOLUTION", "must be a read-only Discovery result");
    return;
  }
  if (!hasOnlyKeys(value, ["query", "target", "source"])) {
    pushInvalid(issues, path, "SUPPORTED_FIELDS", "contains unsupported resolution fields");
  }
  if (!isNonEmptyString(value.query)) {
    pushInvalid(issues, `${path}.query`, "TARGET_QUERY", "must be a non-empty string");
  }
  validateTarget(value.target, `${path}.target`, issues);
  if (
    isRecord(value.target) &&
    (value.target.kind !== "BRAND" && value.target.kind !== "RESTAURANT")
  ) {
    pushInvalid(issues, `${path}.target.kind`, "NAMED_TARGET_KIND", "must resolve to BRAND or RESTAURANT");
  }
  if (
    isRecord(value.target) &&
    isNonEmptyString(value.query) &&
    value.target.query !== value.query
  ) {
    pushInvalid(issues, path, "NAMED_TARGET_QUERY_MATCH", "resolution query must match the resolved target query");
  }
  if (
    !isRecord(value.source) ||
    !hasOnlyKeys(value.source, ["mode", "observedAt"]) ||
    value.source.mode !== "FIXTURE_DISCOVERY" ||
    !isIsoDateTime(value.source.observedAt)
  ) {
    pushInvalid(issues, `${path}.source`, "FIXTURE_DISCOVERY_SOURCE", "must be a timestamped fixture Discovery source");
  }
}

function validateDecisionState(
  value: unknown,
  path: string,
  issues: DecisionEvalPreflightIssue[],
): void {
  for (const contractIssue of validateDecisionStateContract(value, path)) {
    pushInvalid(issues, contractIssue.path, contractIssue.rule ?? "DECISION_STATE", contractIssue.message);
  }
}

function validateStatePatch(value: unknown, path: string, issues: DecisionEvalPreflightIssue[]): void {
  const validation = validateDecisionStatePatchContract(value);
  if (!validation.valid) {
    for (const contractIssue of validation.issues) {
      const suffix = contractIssue.path === "statePatch"
        ? ""
        : contractIssue.path.slice("statePatch".length);
      pushInvalid(issues, `${path}${suffix}`, contractIssue.rule ?? "STATE_PATCH", contractIssue.message);
    }
  }
}

function validateCandidate(
  value: unknown,
  path: string,
  issues: DecisionEvalPreflightIssue[],
  candidateIds: Set<string>,
  factIds: Set<string>,
): void {
  if (!isRecord(value)) {
    pushInvalid(issues, path, "CANDIDATE", "must be an object");
    return;
  }
  if (
    !hasOnlyKeys(value, [
      "id",
      "outletName",
      "brandName",
      "area",
      "cuisines",
      "priceBand",
      "vibes",
      "chainType",
      "capacity",
      "attributes",
      "unsupportedConstraints",
      "availability",
      "source",
      "facts",
    ])
  ) {
    pushInvalid(issues, path, "SUPPORTED_FIELDS", "contains unsupported candidate fields");
  }
  if (!isIdentifier(value.id)) {
    pushInvalid(issues, `${path}.id`, "IDENTIFIER", "must be a stable identifier");
  } else if (candidateIds.has(value.id)) {
    pushInvalid(issues, `${path}.id`, "UNIQUE_ID", `duplicate candidate id ${value.id}`);
  } else {
    candidateIds.add(value.id);
  }
  for (const field of ["outletName", "area"] as const) {
    if (!isNonEmptyString(value[field])) {
      pushInvalid(issues, `${path}.${field}`, "NON_EMPTY_STRING", "must be a non-empty string");
    }
  }
  if (value.brandName !== undefined && !isNonEmptyString(value.brandName)) {
    pushInvalid(issues, `${path}.brandName`, "NON_EMPTY_STRING", "must be a non-empty string");
  }
  validateStringSet(value.cuisines, `${path}.cuisines`, issues);
  validateStringSet(value.vibes, `${path}.vibes`, issues);
  validateStringSet(value.attributes, `${path}.attributes`, issues);
  validateStringSet(value.unsupportedConstraints, `${path}.unsupportedConstraints`, issues);
  if (!isOneOf(value.priceBand, ["BUDGET", "MID_RANGE", "PREMIUM"] as const)) {
    pushInvalid(issues, `${path}.priceBand`, "PRICE_BAND", "must be supported");
  }
  if (!isOneOf(value.chainType, ["INDEPENDENT", "CHAIN"] as const)) {
    pushInvalid(issues, `${path}.chainType`, "CHAIN_TYPE", "must be supported");
  }
  validateParty(
    isRecord(value.capacity)
      ? { ...value.capacity, precision: value.capacity.min === value.capacity.max ? "EXACT" : "RANGE" }
      : value.capacity,
    `${path}.capacity`,
    issues,
  );
  if (value.availability !== undefined) {
    if (!isRecord(value.availability)) {
      pushInvalid(issues, `${path}.availability`, "AVAILABILITY", "must be an object");
    } else {
      const availability = value.availability;
      if (!hasOnlyKeys(availability, ["status", "date", "earliest", "latest", "partyMin", "partyMax", "checkedAt", "expiresAt"])) {
        pushInvalid(issues, `${path}.availability`, "SUPPORTED_FIELDS", "contains unsupported availability fields");
      }
      if (!isOneOf(availability.status, ["AVAILABLE", "UNAVAILABLE", "UNKNOWN"] as const)) {
        pushInvalid(issues, `${path}.availability.status`, "AVAILABILITY_STATUS", "must be supported");
      }
      if (!isDate(availability.date)) {
        pushInvalid(issues, `${path}.availability.date`, "CALENDAR_DATE", "must be valid YYYY-MM-DD");
      }
      if (!isTime(availability.earliest) || !isTime(availability.latest) || availability.earliest > availability.latest) {
        pushInvalid(issues, `${path}.availability`, "AVAILABILITY_WINDOW", "must contain an ordered HH:mm window");
      }
      if (
        typeof availability.partyMin !== "number" ||
        !Number.isInteger(availability.partyMin) ||
        availability.partyMin < 1 ||
        typeof availability.partyMax !== "number" ||
        !Number.isInteger(availability.partyMax) ||
        availability.partyMax < availability.partyMin
      ) {
        pushInvalid(issues, `${path}.availability`, "AVAILABILITY_PARTY", "must contain a valid party range");
      }
      if (!isIsoDateTime(availability.checkedAt) || !isIsoDateTime(availability.expiresAt)) {
        pushInvalid(issues, `${path}.availability`, "AVAILABILITY_TIME", "checkedAt and expiresAt must be ISO timestamps");
      } else if (Date.parse(availability.expiresAt) <= Date.parse(availability.checkedAt)) {
        pushInvalid(issues, `${path}.availability.expiresAt`, "AVAILABILITY_EXPIRY", "must be later than checkedAt");
      }
    }
  }
  if (!isRecord(value.source) || !hasOnlyKeys(value.source, ["mode", "observedAt"]) || value.source.mode !== "FIXTURE" || !isIsoDateTime(value.source.observedAt)) {
    pushInvalid(issues, `${path}.source`, "FIXTURE_SOURCE", "must be a timestamped FIXTURE source");
  }
  if (!Array.isArray(value.facts) || value.facts.length === 0) {
    pushInvalid(issues, `${path}.facts`, "FACTS", "must contain at least one grounding fact");
  } else {
    for (const [index, fact] of value.facts.entries()) {
      const factPath = `${path}.facts[${index}]`;
      if (!isRecord(fact) || !isIdentifier(fact.id) || !isNonEmptyString(fact.field)) {
        pushInvalid(issues, factPath, "FACT", "must contain stable id, field and value");
        continue;
      }
      if (!hasOnlyKeys(fact, ["id", "field", "value"])) {
        pushInvalid(issues, factPath, "SUPPORTED_FIELDS", "contains unsupported fact fields");
      }
      if (factIds.has(fact.id)) {
        pushInvalid(issues, `${factPath}.id`, "UNIQUE_ID", `duplicate fact id ${fact.id}`);
      } else {
        factIds.add(fact.id);
      }
      if (
        typeof fact.value !== "string" &&
        typeof fact.value !== "number" &&
        typeof fact.value !== "boolean" &&
        !isStringArray(fact.value)
      ) {
        pushInvalid(issues, `${factPath}.value`, "FACT_VALUE", "must be scalar or string array");
      }
    }
  }
}

function validateAction(value: unknown, path: string, issues: DecisionEvalPreflightIssue[]): DecisionActionType | undefined {
  if (!isRecord(value) || !isOneOf(value.type, DECISION_ACTION_TYPES)) {
    pushInvalid(issues, path, "ACTION", "must contain a supported action type");
    return undefined;
  }
  if (value.type === "ASK_CORE_FIELD") {
    if (!hasOnlyKeys(value, ["type", "topics"]) || !Array.isArray(value.topics) || value.topics.length < 1 || value.topics.length > 2 || !value.topics.every((topic) => isOneOf(topic, DECISION_CORE_TOPICS)) || !isUnique(value.topics)) {
      pushInvalid(issues, path, "ASK_ACTION", "ASK_CORE_FIELD requires one or two unique core topics");
    }
  } else if (!hasOnlyKeys(value, ["type"])) {
    pushInvalid(issues, path, "ACTION_FIELDS", `${value.type} cannot contain action parameters`);
  }
  return value.type;
}

function validateLabeledExpectation(
  value: Record<string, unknown>,
  path: string,
  issues: DecisionEvalPreflightIssue[],
  candidateIds: Set<string>,
  factIds: Set<string>,
): void {
  if (
    !hasOnlyKeys(value, [
      "annotationStatus",
      "statePatch",
      "accumulatedState",
      "readiness",
      "acceptableNextActions",
      "forbiddenActionTypes",
      "clarification",
      "retrieval",
      "recommendation",
      "outletDiscovery",
      "constraintRelaxation",
      "grounding",
    ])
  ) {
    pushInvalid(issues, path, "SUPPORTED_FIELDS", "contains unsupported labeled expectation fields");
  }
  validateStatePatch(value.statePatch, `${path}.statePatch`, issues);
  validateDecisionState(value.accumulatedState, `${path}.accumulatedState`, issues);
  if (!isOneOf(value.readiness, DECISION_READINESS)) {
    pushInvalid(issues, `${path}.readiness`, "READINESS", "must be supported");
  }
  const acceptableTypes: DecisionActionType[] = [];
  if (!Array.isArray(value.acceptableNextActions) || value.acceptableNextActions.length === 0) {
    pushInvalid(issues, `${path}.acceptableNextActions`, "ACTIONS_REQUIRED", "must contain at least one action");
  } else {
    for (const [index, action] of value.acceptableNextActions.entries()) {
      const actionType = validateAction(action, `${path}.acceptableNextActions[${index}]`, issues);
      if (actionType !== undefined) acceptableTypes.push(actionType);
    }
  }
  const forbiddenActionTypes = value.forbiddenActionTypes;
  if (!Array.isArray(forbiddenActionTypes) || !forbiddenActionTypes.every((item) => isOneOf(item, DECISION_ACTION_TYPES)) || !isUnique(forbiddenActionTypes)) {
    pushInvalid(issues, `${path}.forbiddenActionTypes`, "FORBIDDEN_ACTIONS", "must contain unique supported action types");
  } else if (acceptableTypes.some((item) => forbiddenActionTypes.includes(item))) {
    pushInvalid(issues, path, "ACTION_CONFLICT", "an action type cannot be both acceptable and forbidden");
  }
  if (value.clarification !== undefined) {
    if (!isRecord(value.clarification)) {
      pushInvalid(issues, `${path}.clarification`, "CLARIFICATION", "must be an object");
    } else {
      const clarification = value.clarification;
      if (!hasOnlyKeys(clarification, ["allowedTopics", "maxTopics", "mustNotAsk"])) {
        pushInvalid(issues, `${path}.clarification`, "SUPPORTED_FIELDS", "contains unsupported clarification fields");
      }
      if (!Array.isArray(clarification.allowedTopics) || !clarification.allowedTopics.every((item) => isOneOf(item, DECISION_CORE_TOPICS)) || !isUnique(clarification.allowedTopics)) {
        pushInvalid(issues, `${path}.clarification.allowedTopics`, "CLARIFICATION_TOPICS", "must contain unique core topics");
      }
      if (clarification.maxTopics !== 1 && clarification.maxTopics !== 2) {
        pushInvalid(issues, `${path}.clarification.maxTopics`, "CLARIFICATION_MAX", "must be 1 or 2");
      }
      if (!Array.isArray(clarification.mustNotAsk) || !clarification.mustNotAsk.every((item) => isOneOf(item, DECISION_CORE_TOPICS)) || !isUnique(clarification.mustNotAsk)) {
        pushInvalid(issues, `${path}.clarification.mustNotAsk`, "CLARIFICATION_FORBIDDEN", "must contain unique core topics");
      }
    }
  }
  let eligibleIds: string[] | undefined;
  if (value.retrieval !== undefined) {
    if (!isRecord(value.retrieval)) {
      pushInvalid(issues, `${path}.retrieval`, "RETRIEVAL", "must be an object");
    } else {
      const retrieval = value.retrieval;
      if (!hasOnlyKeys(retrieval, ["eligibleCandidateIds", "allowEmpty", "minimumExpected"])) {
        pushInvalid(issues, `${path}.retrieval`, "SUPPORTED_FIELDS", "contains unsupported retrieval fields");
      }
      if (!isStringArray(retrieval.eligibleCandidateIds) || !isUnique(retrieval.eligibleCandidateIds) || !retrieval.eligibleCandidateIds.every((id) => candidateIds.has(id))) {
        pushInvalid(issues, `${path}.retrieval.eligibleCandidateIds`, "ELIGIBLE_CANDIDATES", "must contain unique candidate ids from the referenced pool");
      } else {
        eligibleIds = retrieval.eligibleCandidateIds;
      }
      if (typeof retrieval.allowEmpty !== "boolean") {
        pushInvalid(issues, `${path}.retrieval.allowEmpty`, "ALLOW_EMPTY", "must be boolean");
      }
      if (typeof retrieval.minimumExpected !== "number" || !Number.isInteger(retrieval.minimumExpected) || retrieval.minimumExpected < 0) {
        pushInvalid(issues, `${path}.retrieval.minimumExpected`, "MINIMUM_EXPECTED", "must be a non-negative integer");
      } else if (eligibleIds !== undefined && retrieval.minimumExpected > eligibleIds.length) {
        pushInvalid(issues, `${path}.retrieval.minimumExpected`, "ORACLE_SATISFIABLE", "cannot exceed eligible candidate count");
      }
      if (retrieval.allowEmpty === false && eligibleIds?.length === 0) {
        pushInvalid(issues, `${path}.retrieval`, "EMPTY_NOT_ALLOWED", "must contain an eligible candidate when allowEmpty is false");
      }
    }
  }
  if (value.recommendation !== undefined) {
    if (!isRecord(value.recommendation)) {
      pushInvalid(issues, `${path}.recommendation`, "RECOMMENDATION", "must be an object");
    } else {
      const recommendation = value.recommendation;
      if (!hasOnlyKeys(recommendation, ["minCandidates", "maxCandidates", "allowedCandidateIds", "forbiddenCandidateIds", "requiredDiversityAxes", "mustExplainInsufficientCandidates"])) {
        pushInvalid(issues, `${path}.recommendation`, "SUPPORTED_FIELDS", "contains unsupported recommendation fields");
      }
      if (typeof recommendation.minCandidates !== "number" || !Number.isInteger(recommendation.minCandidates) || recommendation.minCandidates < 0 || typeof recommendation.maxCandidates !== "number" || !Number.isInteger(recommendation.maxCandidates) || recommendation.maxCandidates < recommendation.minCandidates) {
        pushInvalid(issues, `${path}.recommendation`, "RECOMMENDATION_COUNT", "must contain a valid min/max candidate count");
      }
      for (const field of ["allowedCandidateIds", "forbiddenCandidateIds"] as const) {
        const ids = recommendation[field];
        if (!isStringArray(ids) || !isUnique(ids) || !ids.every((id) => candidateIds.has(id))) {
          pushInvalid(issues, `${path}.recommendation.${field}`, "RECOMMENDATION_CANDIDATES", "must contain unique candidate ids from the referenced pool");
        }
      }
      const allowedCandidateIds = recommendation.allowedCandidateIds;
      const forbiddenCandidateIds = recommendation.forbiddenCandidateIds;
      if (isStringArray(allowedCandidateIds) && isStringArray(forbiddenCandidateIds) && allowedCandidateIds.some((id) => forbiddenCandidateIds.includes(id))) {
        pushInvalid(issues, `${path}.recommendation`, "RECOMMENDATION_CONFLICT", "a candidate cannot be both allowed and forbidden");
      }
      if (eligibleIds !== undefined && isStringArray(recommendation.allowedCandidateIds) && recommendation.allowedCandidateIds.some((id) => !eligibleIds.includes(id))) {
        pushInvalid(issues, `${path}.recommendation.allowedCandidateIds`, "RETRIEVAL_SELECTION_BOUNDARY", "allowed recommendations must be eligible retrieval results");
      }
      if (!Array.isArray(recommendation.requiredDiversityAxes) || !recommendation.requiredDiversityAxes.every((item) => isOneOf(item, DECISION_DIVERSITY_AXES)) || !isUnique(recommendation.requiredDiversityAxes)) {
        pushInvalid(issues, `${path}.recommendation.requiredDiversityAxes`, "DIVERSITY_AXES", "must contain unique supported axes");
      }
      if (typeof recommendation.mustExplainInsufficientCandidates !== "boolean") {
        pushInvalid(issues, `${path}.recommendation.mustExplainInsufficientCandidates`, "EXPLAIN_INSUFFICIENT", "must be boolean");
      }
    }
  }
  if (value.outletDiscovery !== undefined) {
    if (!isRecord(value.outletDiscovery)) {
      pushInvalid(issues, `${path}.outletDiscovery`, "OUTLET_DISCOVERY", "must be an object");
    } else {
      const outletDiscovery = value.outletDiscovery;
      if (!hasOnlyKeys(outletDiscovery, ["candidateIds"])) {
        pushInvalid(issues, `${path}.outletDiscovery`, "SUPPORTED_FIELDS", "contains unsupported outlet discovery fields");
      }
      if (!isStringArray(outletDiscovery.candidateIds) || outletDiscovery.candidateIds.length === 0 || !isUnique(outletDiscovery.candidateIds) || !outletDiscovery.candidateIds.every((id) => candidateIds.has(id))) {
        pushInvalid(issues, `${path}.outletDiscovery.candidateIds`, "OUTLET_DISCOVERY_CANDIDATES", "must contain unique candidate ids from the referenced pool");
      }
      if (!acceptableTypes.some((type) => type === "RESOLVE_BRAND_OUTLET" || type === "CHECK_TARGET_RESTAURANT")) {
        pushInvalid(issues, `${path}.acceptableNextActions`, "OUTLET_DISCOVERY_ACTION_REQUIRED", "outlet discovery requires a brand or target restaurant resolution action");
      }
    }
  }
  if (value.constraintRelaxation !== undefined) {
    if (!isRecord(value.constraintRelaxation)) {
      pushInvalid(issues, `${path}.constraintRelaxation`, "CONSTRAINT_RELAXATION", "must be an object");
    } else {
      const relaxation = value.constraintRelaxation;
      if (!hasOnlyKeys(relaxation, ["options", "requiresUserChoice"])) {
        pushInvalid(issues, `${path}.constraintRelaxation`, "SUPPORTED_FIELDS", "contains unsupported constraint relaxation fields");
      }
      if (relaxation.requiresUserChoice !== true) {
        pushInvalid(issues, `${path}.constraintRelaxation.requiresUserChoice`, "RELAXATION_CONSENT", "must require an explicit user choice");
      }
      const optionTypes: string[] = [];
      const optionCandidateIds: string[] = [];
      if (!Array.isArray(relaxation.options) || relaxation.options.length < 1 || relaxation.options.length > 2) {
        pushInvalid(issues, `${path}.constraintRelaxation.options`, "RELAXATION_OPTIONS", "must contain one or two fallback options");
      } else {
        for (const [index, option] of relaxation.options.entries()) {
          const optionPath = `${path}.constraintRelaxation.options[${index}]`;
          if (!isRecord(option) || !hasOnlyKeys(option, ["type", "candidateIds"])) {
            pushInvalid(issues, optionPath, "RELAXATION_OPTION", "must contain only type and candidateIds");
            continue;
          }
          if (!isOneOf(option.type, DECISION_RELAXATION_TYPES)) {
            pushInvalid(issues, `${optionPath}.type`, "RELAXATION_TYPE", "must relax exactly one supported constraint");
          } else {
            optionTypes.push(option.type);
          }
          if (!isStringArray(option.candidateIds) || option.candidateIds.length === 0 || !isUnique(option.candidateIds) || !option.candidateIds.every((id) => candidateIds.has(id))) {
            pushInvalid(issues, `${optionPath}.candidateIds`, "RELAXATION_CANDIDATES", "must contain unique candidate ids from the referenced pool");
          } else {
            optionCandidateIds.push(...option.candidateIds);
          }
        }
      }
      if (!isUnique(optionTypes)) {
        pushInvalid(issues, `${path}.constraintRelaxation.options`, "RELAXATION_TYPE_UNIQUE", "must not repeat a relaxation type");
      }
      if (!isUnique(optionCandidateIds)) {
        pushInvalid(issues, `${path}.constraintRelaxation.options`, "RELAXATION_CANDIDATE_OVERLAP", "a fallback candidate must belong to only one relaxation option");
      }
      if (!acceptableTypes.includes("PROPOSE_CONSTRAINT_RELAXATION")) {
        pushInvalid(issues, `${path}.acceptableNextActions`, "RELAXATION_ACTION_REQUIRED", "must allow PROPOSE_CONSTRAINT_RELAXATION");
      }
      if (eligibleIds === undefined || eligibleIds.length !== 0) {
        pushInvalid(issues, `${path}.retrieval`, "STRICT_EMPTY_REQUIRED", "constraint relaxation is allowed only when the strict eligible set is empty");
      }
      if (value.recommendation !== undefined) {
        pushInvalid(issues, `${path}.recommendation`, "RELAXATION_NOT_STRICT_RECOMMENDATION", "fallback candidates cannot be promoted into the strict recommendation oracle before user choice");
      }
      if (eligibleIds !== undefined && optionCandidateIds.some((id) => eligibleIds.includes(id))) {
        pushInvalid(issues, `${path}.constraintRelaxation.options`, "STRICT_RELAXATION_CONFLICT", "strict candidates cannot also be fallback candidates");
      }
    }
  } else if (acceptableTypes.includes("PROPOSE_CONSTRAINT_RELAXATION")) {
    pushInvalid(issues, `${path}.constraintRelaxation`, "RELAXATION_ORACLE_REQUIRED", "PROPOSE_CONSTRAINT_RELAXATION requires a fallback oracle");
  }
  if (value.grounding !== undefined) {
    if (!isRecord(value.grounding)) {
      pushInvalid(issues, `${path}.grounding`, "GROUNDING", "must be an object");
    } else {
      const grounding = value.grounding;
      if (!hasOnlyKeys(grounding, ["allowedStateFactRefs", "allowedCandidateFactRefs", "forbiddenClaims", "requiredCandidateDisclosures"])) {
        pushInvalid(issues, `${path}.grounding`, "SUPPORTED_FIELDS", "contains unsupported grounding fields");
      }
      if (!isStringArray(grounding.allowedStateFactRefs) || !isUnique(grounding.allowedStateFactRefs) || !grounding.allowedStateFactRefs.every((ref) => ref.startsWith("state."))) {
        pushInvalid(issues, `${path}.grounding.allowedStateFactRefs`, "STATE_FACT_REFS", "must contain unique state.* references");
      }
      if (!isStringArray(grounding.allowedCandidateFactRefs) || !isUnique(grounding.allowedCandidateFactRefs) || !grounding.allowedCandidateFactRefs.every((ref) => factIds.has(ref))) {
        pushInvalid(issues, `${path}.grounding.allowedCandidateFactRefs`, "CANDIDATE_FACT_REFS", "must contain unique fact ids from candidate fixtures");
      }
      validateStringSet(grounding.forbiddenClaims, `${path}.grounding.forbiddenClaims`, issues);
      if (grounding.requiredCandidateDisclosures !== undefined) {
        if (!Array.isArray(grounding.requiredCandidateDisclosures) || grounding.requiredCandidateDisclosures.length === 0) {
          pushInvalid(
            issues,
            `${path}.grounding.requiredCandidateDisclosures`,
            "REQUIRED_DISCLOSURES",
            "must contain one or more candidate disclosures when present",
          );
        } else {
          const disclosureKeys = new Set<string>();
          for (const [index, disclosure] of grounding.requiredCandidateDisclosures.entries()) {
            const disclosurePath = `${path}.grounding.requiredCandidateDisclosures[${index}]`;
            if (!isRecord(disclosure) || !hasOnlyKeys(disclosure, ["candidateId", "type", "factRef"])) {
              pushInvalid(issues, disclosurePath, "CANDIDATE_DISCLOSURE", "must contain only candidateId, type and factRef");
              continue;
            }
            if (!isIdentifier(disclosure.candidateId) || !candidateIds.has(disclosure.candidateId)) {
              pushInvalid(issues, `${disclosurePath}.candidateId`, "DISCLOSURE_CANDIDATE", "must reference a candidate in the episode pool");
            }
            if (disclosure.type !== "ALLERGY_CONFIRMATION_REQUIRED") {
              pushInvalid(issues, `${disclosurePath}.type`, "DISCLOSURE_TYPE", "must use a supported disclosure type");
            }
            if (!isNonEmptyString(disclosure.factRef) || !factIds.has(disclosure.factRef)) {
              pushInvalid(issues, `${disclosurePath}.factRef`, "DISCLOSURE_FACT", "must reference a candidate fixture fact");
            } else if (
              isIdentifier(disclosure.candidateId) &&
              !disclosure.factRef.startsWith(`${disclosure.candidateId}.`)
            ) {
              pushInvalid(issues, `${disclosurePath}.factRef`, "DISCLOSURE_CANDIDATE_FACT", "must belong to the disclosed candidate");
            } else if (
              disclosure.type === "ALLERGY_CONFIRMATION_REQUIRED" &&
              !disclosure.factRef.endsWith(".attributes")
            ) {
              pushInvalid(issues, `${disclosurePath}.factRef`, "ALLERGY_DISCLOSURE_EVIDENCE", "must cite the candidate attributes fact that requires restaurant confirmation");
            }
            if (
              isNonEmptyString(disclosure.candidateId) &&
              isNonEmptyString(disclosure.factRef)
            ) {
              const key = `${disclosure.candidateId}:${disclosure.type}:${disclosure.factRef}`;
              if (disclosureKeys.has(key)) {
                pushInvalid(issues, disclosurePath, "UNIQUE_DISCLOSURES", "must not repeat a candidate disclosure");
              }
              disclosureKeys.add(key);
            }
            if (
              isStringArray(grounding.allowedCandidateFactRefs) &&
              isNonEmptyString(disclosure.factRef) &&
              !grounding.allowedCandidateFactRefs.includes(disclosure.factRef)
            ) {
              pushInvalid(issues, `${disclosurePath}.factRef`, "DISCLOSURE_GROUNDING", "must be available for candidate grounding");
            }
          }
        }
      }
    }
  }
}

export function runRestaurantDecisionEvalPreflight(
  input: unknown,
  mode: DecisionEvalPreflightMode,
): DecisionEvalPreflightReport {
  const issues: DecisionEvalPreflightIssue[] = [];
  const stats: DecisionEvalPreflightReport["stats"] = {
    candidatePools: 0,
    candidates: 0,
    candidateFacts: 0,
    episodes: 0,
    turns: 0,
    labeledTurns: 0,
    pendingTurns: 0,
    byInitialClarity: { E1: 0, E2: 0, E3: 0 },
    byTargetKind: { OPEN: 0, CATEGORY: 0, BRAND: 0, RESTAURANT: 0 },
  };

  if (!isRecord(input)) {
    pushInvalid(issues, "$", "DATASET_OBJECT", "dataset must be an object");
    return {
      preflightVersion: "1",
      scope: "DATASET_ANNOTATION",
      mode,
      status: "INVALID",
      stats,
      issues,
    };
  }

  if (!hasOnlyKeys(input, ["schemaVersion", "datasetId", "datasetVersion", "evaluatorTargetVersion", "mode", "candidatePools", "episodes"])) {
    pushInvalid(issues, "$", "SUPPORTED_FIELDS", "dataset contains unsupported fields");
  }
  if (input.schemaVersion !== "3") {
    pushInvalid(issues, "$.schemaVersion", "SCHEMA_VERSION", "must be 3");
  }
  if (!isIdentifier(input.datasetId)) {
    pushInvalid(issues, "$.datasetId", "IDENTIFIER", "must be a stable identifier");
  }
  if (!isNonEmptyString(input.datasetVersion)) {
    pushInvalid(issues, "$.datasetVersion", "DATASET_VERSION", "must be a non-empty version");
  }
  if (input.evaluatorTargetVersion !== "2") {
    pushInvalid(issues, "$.evaluatorTargetVersion", "EVALUATOR_VERSION", "must target evaluator version 2");
  }
  if (input.mode !== "GOLDEN_SEED" && input.mode !== "FROZEN_BASELINE") {
    pushInvalid(issues, "$.mode", "DATASET_MODE", "must be GOLDEN_SEED or FROZEN_BASELINE");
  }

  const poolIds = new Set<string>();
  const candidateIdsByPool = new Map<string, Set<string>>();
  const factIdsByPool = new Map<string, Set<string>>();
  if (!Array.isArray(input.candidatePools) || input.candidatePools.length === 0) {
    pushInvalid(issues, "$.candidatePools", "CANDIDATE_POOLS", "must contain at least one pool");
  } else {
    stats.candidatePools = input.candidatePools.length;
    for (const [poolIndex, pool] of input.candidatePools.entries()) {
      const poolPath = `$.candidatePools[${poolIndex}]`;
      if (!isRecord(pool)) {
        pushInvalid(issues, poolPath, "CANDIDATE_POOL", "must be an object");
        continue;
      }
      if (!hasOnlyKeys(pool, ["schemaVersion", "id", "candidates"])) {
        pushInvalid(issues, poolPath, "SUPPORTED_FIELDS", "contains unsupported candidate pool fields");
      }
      if (pool.schemaVersion !== "1") {
        pushInvalid(issues, `${poolPath}.schemaVersion`, "POOL_SCHEMA", "must be 1");
      }
      if (!isIdentifier(pool.id)) {
        pushInvalid(issues, `${poolPath}.id`, "IDENTIFIER", "must be a stable identifier");
        continue;
      }
      if (poolIds.has(pool.id)) {
        pushInvalid(issues, `${poolPath}.id`, "UNIQUE_ID", `duplicate pool id ${pool.id}`);
        continue;
      }
      poolIds.add(pool.id);
      const candidateIds = new Set<string>();
      const factIds = new Set<string>();
      candidateIdsByPool.set(pool.id, candidateIds);
      factIdsByPool.set(pool.id, factIds);
      if (!Array.isArray(pool.candidates) || pool.candidates.length === 0) {
        pushInvalid(issues, `${poolPath}.candidates`, "CANDIDATES", "must contain at least one candidate");
        continue;
      }
      stats.candidates += pool.candidates.length;
      for (const [candidateIndex, candidate] of pool.candidates.entries()) {
        validateCandidate(candidate, `${poolPath}.candidates[${candidateIndex}]`, issues, candidateIds, factIds);
      }
      stats.candidateFacts += factIds.size;
    }
  }

  const episodeIds = new Set<string>();
  const turnIds = new Set<string>();
  if (!Array.isArray(input.episodes) || input.episodes.length === 0) {
    pushInvalid(issues, "$.episodes", "EPISODES", "must contain at least one episode");
  } else {
    stats.episodes = input.episodes.length;
    for (const [episodeIndex, episode] of input.episodes.entries()) {
      const episodePath = `$.episodes[${episodeIndex}]`;
      if (!isRecord(episode)) {
        pushInvalid(issues, episodePath, "EPISODE", "must be an object");
        continue;
      }
      if (!hasOnlyKeys(episode, ["schemaVersion", "datasetVersion", "id", "split", "initialClarity", "targetKind", "referenceTime", "timezone", "tags", "candidatePoolRef", "namedTargetResolution", "initialState", "turns"])) {
        pushInvalid(issues, episodePath, "SUPPORTED_FIELDS", "contains unsupported episode fields");
      }
      if (episode.schemaVersion !== "3") {
        pushInvalid(issues, `${episodePath}.schemaVersion`, "EPISODE_SCHEMA", "must be 3");
      }
      if (episode.datasetVersion !== input.datasetVersion) {
        pushInvalid(issues, `${episodePath}.datasetVersion`, "DATASET_VERSION_MATCH", "must match dataset version");
      }
      if (!isIdentifier(episode.id)) {
        pushInvalid(issues, `${episodePath}.id`, "IDENTIFIER", "must be a stable identifier");
      } else if (episodeIds.has(episode.id)) {
        pushInvalid(issues, `${episodePath}.id`, "UNIQUE_ID", `duplicate episode id ${episode.id}`);
      } else {
        episodeIds.add(episode.id);
      }
      if (episode.split !== "REGRESSION" && episode.split !== "HOLDOUT") {
        pushInvalid(issues, `${episodePath}.split`, "SPLIT", "must be REGRESSION or HOLDOUT");
      }
      if (episode.initialClarity !== "E1" && episode.initialClarity !== "E2" && episode.initialClarity !== "E3") {
        pushInvalid(issues, `${episodePath}.initialClarity`, "INITIAL_CLARITY", "must be E1, E2 or E3");
      } else {
        stats.byInitialClarity[episode.initialClarity] += 1;
      }
      if (!isOneOf(episode.targetKind, DECISION_TARGET_KINDS)) {
        pushInvalid(issues, `${episodePath}.targetKind`, "TARGET_KIND", "must be supported");
      } else {
        stats.byTargetKind[episode.targetKind] += 1;
      }
      if (episode.targetKind === "BRAND" || episode.targetKind === "RESTAURANT") {
        validateNamedTargetResolution(
          episode.namedTargetResolution,
          `${episodePath}.namedTargetResolution`,
          issues,
        );
        if (
          isRecord(episode.namedTargetResolution) &&
          isRecord(episode.namedTargetResolution.target) &&
          episode.namedTargetResolution.target.kind !== episode.targetKind
        ) {
          pushInvalid(
            issues,
            `${episodePath}.namedTargetResolution.target.kind`,
            "EPISODE_TARGET_KIND_MATCH",
            "resolution target kind must match the episode target kind",
          );
        }
      } else if (episode.namedTargetResolution !== undefined) {
        pushInvalid(
          issues,
          `${episodePath}.namedTargetResolution`,
          "UNEXPECTED_NAMED_TARGET_RESOLUTION",
          "only BRAND or RESTAURANT episodes may include named target resolution",
        );
      }
      if (!isIsoDateTime(episode.referenceTime)) {
        pushInvalid(issues, `${episodePath}.referenceTime`, "REFERENCE_TIME", "must be an ISO timestamp");
      }
      if (episode.timezone !== "Asia/Tokyo") {
        pushInvalid(issues, `${episodePath}.timezone`, "TIMEZONE", "must be Asia/Tokyo");
      }
      validateStringSet(episode.tags, `${episodePath}.tags`, issues);
      validateDecisionState(episode.initialState, `${episodePath}.initialState`, issues);

      let poolCandidateIds = new Set<string>();
      let poolFactIds = new Set<string>();
      if (episode.candidatePoolRef !== undefined) {
        if (!isIdentifier(episode.candidatePoolRef) || !poolIds.has(episode.candidatePoolRef)) {
          pushInvalid(issues, `${episodePath}.candidatePoolRef`, "POOL_REFERENCE", "must reference an existing candidate pool");
        } else {
          poolCandidateIds = candidateIdsByPool.get(episode.candidatePoolRef) ?? new Set<string>();
          poolFactIds = factIdsByPool.get(episode.candidatePoolRef) ?? new Set<string>();
        }
      }

      if (!Array.isArray(episode.turns) || episode.turns.length === 0) {
        pushInvalid(issues, `${episodePath}.turns`, "TURNS", "must contain at least one turn");
        continue;
      }
      stats.turns += episode.turns.length;
      for (const [turnIndex, turn] of episode.turns.entries()) {
        const turnPath = `${episodePath}.turns[${turnIndex}]`;
        if (!isRecord(turn)) {
          pushInvalid(issues, turnPath, "TURN", "must be an object");
          continue;
        }
        if (!hasOnlyKeys(turn, ["id", "userMessage", "visibleOptionIds", "expected"])) {
          pushInvalid(issues, turnPath, "SUPPORTED_FIELDS", "contains unsupported turn fields");
        }
        if (!isIdentifier(turn.id)) {
          pushInvalid(issues, `${turnPath}.id`, "IDENTIFIER", "must be a stable identifier");
        } else if (turnIds.has(turn.id)) {
          pushInvalid(issues, `${turnPath}.id`, "UNIQUE_ID", `duplicate turn id ${turn.id}`);
        } else {
          turnIds.add(turn.id);
        }
        if (!isNonEmptyString(turn.userMessage)) {
          pushInvalid(issues, `${turnPath}.userMessage`, "USER_MESSAGE", "must be non-empty");
        }
        if (turn.visibleOptionIds !== undefined) {
          if (!isStringArray(turn.visibleOptionIds) || !isUnique(turn.visibleOptionIds) || !turn.visibleOptionIds.every((id) => poolCandidateIds.has(id))) {
            pushInvalid(issues, `${turnPath}.visibleOptionIds`, "VISIBLE_OPTIONS", "must contain unique candidate ids from the referenced pool");
          }
        }
        if (!isRecord(turn.expected)) {
          pushInvalid(issues, `${turnPath}.expected`, "EXPECTATION", "must be a pending or labeled expectation");
          continue;
        }
        if (turn.expected.annotationStatus === PENDING_HUMAN_LABEL) {
          stats.pendingTurns += 1;
          if (!hasOnlyKeys(turn.expected, ["annotationStatus", "annotationFocus"])) {
            pushInvalid(issues, `${turnPath}.expected`, "SUPPORTED_FIELDS", "contains unsupported pending expectation fields");
          }
          validateStringSet(turn.expected.annotationFocus, `${turnPath}.expected.annotationFocus`, issues);
          if (mode === "REQUIRE_COMPLETE") {
            issues.push({
              code: "ANNOTATION_INCOMPLETE",
              rule: "HUMAN_LABEL_REQUIRED",
              path: `${turnPath}.expected`,
              message: `turn ${String(turn.id)} still requires a human Gold label`,
            });
          }
        } else if (turn.expected.annotationStatus === "LABELED") {
          stats.labeledTurns += 1;
          validateLabeledExpectation(turn.expected, `${turnPath}.expected`, issues, poolCandidateIds, poolFactIds);
        } else {
          pushInvalid(issues, `${turnPath}.expected.annotationStatus`, "ANNOTATION_STATUS", "must be PENDING_HUMAN_LABEL or LABELED");
        }
      }
    }
  }

  const structuralErrors = issues.filter((issue) => issue.code === "DATASET_INVALID");
  const annotationErrors = issues.filter((issue) => issue.code === "ANNOTATION_INCOMPLETE");
  let status: DecisionEvalPreflightStatus;
  if (structuralErrors.length > 0) {
    status = "INVALID";
  } else if (annotationErrors.length > 0) {
    status = "BLOCKED_PENDING_HUMAN_LABELS";
  } else if (stats.pendingTurns > 0) {
    status = "READY_FOR_ANNOTATION";
  } else {
    status = "READY_FOR_EVALUATOR";
  }

  const report: DecisionEvalPreflightReport = {
    preflightVersion: "1",
    scope: "DATASET_ANNOTATION",
    mode,
    status,
    stats,
    issues,
  };
  if (isNonEmptyString(input.datasetId)) report.datasetId = input.datasetId;
  if (isNonEmptyString(input.datasetVersion)) report.datasetVersion = input.datasetVersion;
  return report;
}

export function assertRestaurantDecisionDataset(
  input: unknown,
): asserts input is DecisionEvalDataset {
  const report = runRestaurantDecisionEvalPreflight(input, "REQUIRE_COMPLETE");
  if (report.status !== "READY_FOR_EVALUATOR") {
    throw new Error(
      `Restaurant decision dataset preflight failed: ${report.issues
        .map((issue) => `${issue.path} ${issue.message}`)
        .join("; ")}`,
    );
  }
}
