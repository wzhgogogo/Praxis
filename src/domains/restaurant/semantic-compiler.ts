import type {
  RestaurantIntentPatch,
  RestaurantSemanticConflict,
} from "./contracts.js";
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
  return JSON.stringify(value);
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
    const values = new Set(
      setValueFacts(proposal, field).map((fact) => semanticValueKey(fact.value!)),
    );
    if (values.size > 1) {
      return {
        code: "CONTRADICTORY_PROPOSAL",
        affectedFields: [field],
        message: `The proposal supplies conflicting ${field} values in one user turn`,
      };
    }
  }

  const collectionFields: RestaurantSemanticField[] = [
    "CUISINE",
    "HARD_CONSTRAINT",
    "SOFT_PREFERENCE",
  ];
  for (const field of collectionFields) {
    const asserted = new Set(
      proposal.facts
        .filter(
          (fact) =>
            fact.field === field &&
            (fact.operation === "ASSERT" || fact.operation === "CORRECT") &&
            fact.value !== undefined,
        )
        .map((fact) => semanticValueKey(fact.value!)),
    );
    const negated = new Set(
      proposal.facts
        .filter((fact) => fact.field === field && fact.operation === "NEGATE" && fact.value)
        .map((fact) => semanticValueKey(fact.value!)),
    );
    if ([...asserted].some((value) => negated.has(value))) {
      return {
        code: "CONTRADICTORY_PROPOSAL",
        affectedFields: [field],
        message: `The proposal both adds and negates the same ${field} value`,
      };
    }
  }
  return null;
}

function add(patch: RestaurantIntentPatch, key: keyof RestaurantIntentPatch, value: string): void {
  const existing = patch[key];
  if (existing === undefined) {
    Object.assign(patch, { [key]: [value] });
    return;
  }
  if (Array.isArray(existing) && !existing.includes(value)) existing.push(value);
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
      case "CUISINE": {
        const value = valueFor(fact, "CUISINE");
        add(patch, "removeCuisines", value.value);
        return;
      }
      case "HARD_CONSTRAINT": {
        const value = valueFor(fact, "HARD_CONSTRAINT");
        add(patch, "removeHardConstraints", value.value);
        return;
      }
      case "SOFT_PREFERENCE": {
        const value = valueFor(fact, "SOFT_PREFERENCE");
        add(patch, "removeSoftPreferences", value.value);
        return;
      }
    }
  }

  switch (fact.field) {
    case "TARGET": {
      const value = valueFor(fact, "TARGET");
      patch.target = { query: value.query };
      return;
    }
    case "DATE": {
      const value = valueFor(fact, "DATE");
      patch.date = value.value;
      return;
    }
    case "TIME_WINDOW": {
      const value = valueFor(fact, "TIME_WINDOW");
      patch.timeWindow = { earliest: value.earliest, latest: value.latest };
      return;
    }
    case "PARTY_SIZE": {
      const value = valueFor(fact, "PARTY_SIZE");
      patch.partySize = value.value;
      return;
    }
    case "AREA": {
      const value = valueFor(fact, "AREA");
      patch.area = { query: value.query };
      return;
    }
    case "CUISINE": {
      const value = valueFor(fact, "CUISINE");
      add(patch, fact.operation === "CORRECT" ? "replaceCuisines" : "addCuisines", value.value);
      return;
    }
    case "BUDGET_PER_PERSON": {
      const value = valueFor(fact, "BUDGET_PER_PERSON");
      patch.budgetPerPerson = { max: value.max, currency: "JPY" };
      return;
    }
    case "HARD_CONSTRAINT": {
      const value = valueFor(fact, "HARD_CONSTRAINT");
      add(
        patch,
        fact.operation === "CORRECT" ? "replaceHardConstraints" : "addHardConstraints",
        value.value,
      );
      return;
    }
    case "SOFT_PREFERENCE": {
      const value = valueFor(fact, "SOFT_PREFERENCE");
      add(
        patch,
        fact.operation === "CORRECT" ? "replaceSoftPreferences" : "addSoftPreferences",
        value.value,
      );
      return;
    }
  }
}

/** Pure Restaurant Domain translation from a valid semantic proposal to a state patch. */
export function compileRestaurantSemanticProposal(
  proposal: RestaurantSemanticProposal,
): RestaurantSemanticCompilation {
  const conflict = findConflict(proposal);
  if (conflict) return { status: "CONFLICT", conflict };

  const patch: RestaurantIntentPatch = { schemaVersion: "1" };
  proposal.facts.forEach((fact) => compileFact(patch, fact));
  return { status: "COMPILED", patch };
}

export function restaurantIntentPatchHasChanges(patch: RestaurantIntentPatch): boolean {
  return Object.keys(patch).some((key) => key !== "schemaVersion");
}
