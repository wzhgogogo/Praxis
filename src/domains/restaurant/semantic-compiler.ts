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

export type RestaurantSemanticCompilation =
  | { status: "COMPILED"; patch: RestaurantIntentPatch }
  | { status: "CONFLICT"; conflict: RestaurantSemanticConflict };

function semanticValueKey(value: RestaurantSemanticValue): string {
  switch (value.kind) {
    case "TARGET":
    case "AREA":
      return `${value.kind}:${value.query}`;
    case "DATE":
    case "PARTY_SIZE":
      return `${value.kind}:${value.value}`;
    case "TIME_WINDOW":
      return `${value.kind}:${value.earliest}:${value.latest}`;
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
        return;
      case "TIME_WINDOW":
        patch.timeWindow = null;
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
      patch.target = { goal: value.goal, query: value.query };
      return;
    }
    case "DATE": {
      patch.date = valueFor(fact, "DATE").value;
      return;
    }
    case "TIME_WINDOW": {
      const value = valueFor(fact, "TIME_WINDOW");
      patch.timeWindow = { earliest: value.earliest, latest: value.latest };
      return;
    }
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
): RestaurantSemanticCompilation {
  const conflict = findConflict(proposal);
  if (conflict) return { status: "CONFLICT", conflict };

  const patch: RestaurantIntentPatch = { schemaVersion: "3" };
  proposal.facts.forEach((fact) => compileFact(patch, fact));
  return { status: "COMPILED", patch };
}

export function restaurantIntentPatchHasChanges(patch: RestaurantIntentPatch): boolean {
  return Object.keys(patch).some((key) => key !== "schemaVersion");
}
