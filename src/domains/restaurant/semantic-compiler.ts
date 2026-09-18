import type {
  RestaurantCriterion,
  RestaurantIntentPatch,
  RestaurantSemanticConflict,
} from "./contracts.js";
import { restaurantCriterionKey } from "./intent-state.js";
import type {
  RestaurantSemanticFact,
  RestaurantSemanticField,
  RestaurantSemanticProposal,
  RestaurantSemanticValue,
} from "./semantic-proposal.js";
import { materializeRestaurantTemporalFacts } from "./temporal-materialization.js";

export type RestaurantSemanticCompilation =
  | { status: "COMPILED"; patch: RestaurantIntentPatch }
  | { status: "CONFLICT"; conflict: RestaurantSemanticConflict };

function semanticValueKey(value: RestaurantSemanticValue): string {
  switch (value.kind) {
    case "TARGET":
    case "AREA":
      return `${value.kind}:${value.query}`;
    case "DATE":
      return `${value.kind}:${"value" in value ? value.value : "relativeDay" in value ? value.relativeDay : value.weekday}`;
    case "PARTY_SIZE":
      return `${value.kind}:${value.value}`;
    case "TIME_WINDOW":
      return `${value.kind}:${"earliest" in value ? `${value.earliest}:${value.latest}` : "daypart" in value ? value.daypart : value.relativeOffsetMinutes}`;
    case "BUDGET_PER_PERSON":
      return `${value.kind}:${value.max}:${value.currency}`;
    case "CRITERION":
      return `${value.kind}:${restaurantCriterionKey(value)}`;
  }
}

function setValueFacts(proposal: RestaurantSemanticProposal, field: RestaurantSemanticField) {
  return proposal.facts.filter(
    (fact) =>
      fact.field === field &&
      (fact.operation === "ASSERT" || fact.operation === "CORRECT") &&
      fact.value !== undefined,
  );
}

function findConflict(proposal: RestaurantSemanticProposal): RestaurantSemanticConflict | null {
  const singletonFields: RestaurantSemanticField[] = [
    "TARGET",
    "DATE",
    "TIME_WINDOW",
    "PARTY_SIZE",
    "AREA",
    "BUDGET_PER_PERSON",
  ];
  for (const field of singletonFields) {
    const values = new Set(setValueFacts(proposal, field).map((fact) => semanticValueKey(fact.value!)));
    if (values.size > 1) {
      return {
        code: "CONTRADICTORY_PROPOSAL",
        affectedFields: [field],
        message: `The proposal supplies conflicting ${field} values in one user turn`,
      };
    }
    const negatesSingleton = proposal.facts.some(
      (fact) => fact.field === field && fact.operation === "NEGATE",
    );
    if (negatesSingleton && values.size > 0) {
      return {
        code: "CONTRADICTORY_PROPOSAL",
        affectedFields: [field],
        message: `The proposal both clears and sets ${field} in one user turn`,
      };
    }
  }

  const asserted = new Set(
    proposal.facts
      .filter(
        (fact) =>
          fact.field === "CRITERION" &&
          (fact.operation === "ASSERT" || fact.operation === "CORRECT") &&
          fact.value !== undefined,
      )
      .map((fact) => semanticValueKey(fact.value!)),
  );
  const negated = new Set(
    proposal.facts
      .filter(
        (fact) => fact.field === "CRITERION" && fact.operation === "NEGATE" && fact.value,
      )
      .map((fact) => semanticValueKey(fact.value!)),
  );
  if ([...asserted].some((value) => negated.has(value))) {
    return {
      code: "CONTRADICTORY_PROPOSAL",
      affectedFields: ["CRITERION"],
      message: "The proposal both adds and negates the same CRITERION value",
    };
  }
  return null;
}

function addCriterion(
  patch: RestaurantIntentPatch,
  key: "addCriteria" | "replaceCriteria" | "removeCriteria",
  value: RestaurantCriterion,
): void {
  const existing = patch[key];
  if (existing === undefined) {
    patch[key] = [value];
    return;
  }
  if (!existing.some((criterion) => restaurantCriterionKey(criterion) === restaurantCriterionKey(value))) {
    existing.push(value);
  }
}

function valueFor<Kind extends RestaurantSemanticValue["kind"]>(
  fact: RestaurantSemanticFact,
  kind: Kind,
): Extract<RestaurantSemanticValue, { kind: Kind }> {
  if (!fact.value || fact.value.kind !== kind) {
    throw new Error(`Validated ${fact.field} fact did not contain a ${kind} value`);
  }
  return fact.value as Extract<RestaurantSemanticValue, { kind: Kind }>;
}

function criterionFor(fact: RestaurantSemanticFact): RestaurantCriterion {
  const { kind: _kind, ...criterion } = valueFor(fact, "CRITERION");
  return criterion;
}

function compileFact(patch: RestaurantIntentPatch, fact: RestaurantSemanticFact): void {
  if (fact.operation === "CONFIRM") return;
  if (fact.operation === "NEGATE") {
    switch (fact.field) {
      case "TARGET":
        patch.target = null;
        return;
      case "DATE":
        patch.date = null;
        patch.temporalResolution = null;
        return;
      case "TIME_WINDOW":
        patch.timeWindow = null;
        patch.permittedAlternativeTimeWindow = null;
        patch.temporalResolution = null;
        return;
      case "PARTY_SIZE":
        patch.partySize = null;
        return;
      case "AREA":
        patch.area = null;
        return;
      case "BUDGET_PER_PERSON":
        patch.budgetPerPerson = null;
        return;
      case "CRITERION":
        addCriterion(patch, "removeCriteria", criterionFor(fact));
        return;
    }
  }

  switch (fact.field) {
    case "TARGET": {
      const value = valueFor(fact, "TARGET");
      patch.target = {
        goal: value.goal,
        query: value.query,
        ...(value.selectionScope ? { selectionScope: value.selectionScope } : {}),
        ...(value.requestedResultCount !== undefined ? { requestedResultCount: value.requestedResultCount } : {}),
      };
      return;
    }
    case "DATE":
    case "TIME_WINDOW":
      // Materialized after all facts are collected, so a relative offset may
      // legitimately set both the local date and exact local clock time.
      return;
    case "PARTY_SIZE": {
      patch.partySize = valueFor(fact, "PARTY_SIZE").value;
      return;
    }
    case "AREA": {
      patch.area = { query: valueFor(fact, "AREA").query };
      return;
    }
    case "BUDGET_PER_PERSON": {
      const value = valueFor(fact, "BUDGET_PER_PERSON");
      patch.budgetPerPerson = { max: value.max, currency: "JPY" };
      return;
    }
    case "CRITERION":
      addCriterion(
        patch,
        fact.operation === "CORRECT" ? "replaceCriteria" : "addCriteria",
        criterionFor(fact),
      );
      return;
  }
}

/** Pure Restaurant Domain translation from a valid semantic proposal to a state patch. */
export function compileRestaurantSemanticProposal(
  proposal: RestaurantSemanticProposal,
  temporalContext?: { referenceTime: string; timezone: "Asia/Tokyo" },
): RestaurantSemanticCompilation {
  const conflict = findConflict(proposal);
  if (conflict) return { status: "CONFLICT", conflict };

  const patch: RestaurantIntentPatch = { schemaVersion: "3" };
  proposal.facts.forEach((fact) => compileFact(patch, fact));
  const dateFact = setValueFacts(proposal, "DATE")[0];
  const timeFact = setValueFacts(proposal, "TIME_WINDOW")[0];
  if (dateFact || timeFact) {
    const date = dateFact ? valueFor(dateFact, "DATE") : undefined;
    const timeWindow = timeFact ? valueFor(timeFact, "TIME_WINDOW") : undefined;
    const requiresReference = (date && !("value" in date)) || (timeWindow && !("earliest" in timeWindow));
    if (requiresReference && !temporalContext) {
      return { status: "CONFLICT", conflict: { code: "UNSUPPORTED_SEMANTIC_EXPRESSION", affectedFields: [dateFact ? "DATE" : "TIME_WINDOW"], message: "Relative temporal semantics require the trusted application reference time" } };
    }
    const materialized = materializeRestaurantTemporalFacts({
      ...(date ? { date } : {}),
      ...(timeWindow ? { timeWindow } : {}),
      referenceTime: temporalContext?.referenceTime ?? "1970-01-01T00:00:00+09:00",
      timezone: temporalContext?.timezone ?? "Asia/Tokyo",
    });
    if (materialized.date) patch.date = materialized.date;
    if (materialized.timeWindow) patch.timeWindow = materialized.timeWindow;
    if (timeWindow && "alternativeEarliest" in timeWindow && timeWindow.alternativeEarliest && timeWindow.alternativeLatest) {
      patch.permittedAlternativeTimeWindow = { earliest: timeWindow.alternativeEarliest, latest: timeWindow.alternativeLatest };
    }
    // Direct compiler callers in historical semantic scorer tests have no
    // trusted clock. Actual Web/Hybrid message entrypoints always supply it
    // and therefore retain the full auditable resolution record.
    if (temporalContext && materialized.temporalResolution) patch.temporalResolution = materialized.temporalResolution;
  }
  return { status: "COMPILED", patch };
}

export function restaurantIntentPatchHasChanges(patch: RestaurantIntentPatch): boolean {
  return Object.keys(patch).some((key) => key !== "schemaVersion");
}
