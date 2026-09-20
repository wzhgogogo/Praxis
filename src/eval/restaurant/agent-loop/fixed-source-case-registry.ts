import { loadFrozenLiveCases, type FrozenLiveCase, RESTAURANT_READ_DEVELOPMENT_CASE_PATH } from "./live-case-materializer.js";
import type { CurrentDevelopmentScenarioId } from "./current-development-source-scenarios.js";

export type FixedSourceExpectation = {
  /** A predeclared acceptance rule, never inferred from the run's output. */
  kind: "QUALIFIED_RESULT" | "VERIFIED_NO_RESULT" | "NEEDS_USER_INPUT" | "USER_CANCELLED" | "BUDGET_OR_DEADLINE_STOP";
  /** The expected lifecycle record, not an inferred synonym for no result. */
  execution: {
    status: "SUCCEEDED" | "FAILED" | "CANCELLED";
    loopStatus?: "TERMINAL" | "WAITING_USER" | "CANCELLED" | "MODEL_FAILURE";
    phase?: "UNDERSTANDING" | "PRESENT_RESULTS" | "NO_VERIFIED_RESULT" | "NEEDS_INPUT" | "SEARCHING" | "FAILED";
    failureCodes?: readonly string[];
  };
  /** Necessary fixture gaps block; explicitly optional gaps remain reportable. */
  coverage: { necessary: boolean; optionalSources?: readonly string[] };
  requiredDimensions: readonly ("AUTHORITATIVE_CONDITIONS" | "REQUIRED_EVIDENCE" | "FINAL_CLAIM" | "COMPLETION_OUTCOME")[];
  /**
   * Only a count stated by the user is a completion requirement. Product
   * defaults remain an auditable delivery objective, not an eval gate.
   */
  requiredResultBatch?: { source: "USER_EXPLICIT"; candidateCount: number };
};

export type FixedSourceCaseRegistration = {
  id: string;
  sourceScenarioId: CurrentDevelopmentScenarioId;
  input: "FROZEN_DEVELOPMENT" | "CONTROL";
  expectation: FixedSourceExpectation;
  /** Present only for explicitly registered, deterministic control inputs. */
  controlInput?: { id: string; content: unknown; reference_time: string; dataset?: unknown; semantic?: unknown };
};

const positiveExpectation: FixedSourceExpectation = {
  kind: "QUALIFIED_RESULT",
  execution: { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "PRESENT_RESULTS" },
  coverage: { necessary: true },
  requiredDimensions: ["AUTHORITATIVE_CONDITIONS", "REQUIRED_EVIDENCE", "FINAL_CLAIM", "COMPLETION_OUTCOME"],
};

/**
 * This is registration data, rather than a Runner whitelist.  Adding an
 * offline case requires only a row and a matching source scenario; the shared
 * loader below performs the same binding checks for frozen and control input.
 */
export const FIXED_SOURCE_CASE_REGISTRATIONS: readonly FixedSourceCaseRegistration[] = [
  ...(["h001", "h002", "h003", "h004", "h005"] as const).map((id) => ({ id, sourceScenarioId: id, input: "FROZEN_DEVELOPMENT" as const, expectation: positiveExpectation })),
  {
    id: "new-vegetarian-lunch",
    sourceScenarioId: "new-vegetarian-lunch",
    input: "CONTROL",
    expectation: positiveExpectation,
    controlInput: {
      id: "new-vegetarian-lunch",
      content: "Find a vegetarian restaurant near Shibuya tomorrow at 12:30 PM for three. No ramen.",
      reference_time: "2026-08-19T16:00:00+08:00",
      dataset: "restaurant-read-development@1",
      semantic: {
        target: { goal: "AVAILABILITY" },
        location: { value: "Shibuya", relation: "NEAR" },
        date: { expression: "tomorrow", value: "2026-08-20" },
        time: { value: "12:30" },
        party_size: 3,
        criteria: [
          { value: "vegetarian restaurant", polarity: "POSITIVE", strength: "HARD" },
          { value: "ramen", polarity: "NEGATIVE", strength: "HARD" },
        ],
      },
    },
  },
  {
    id: "explicit-two-omakase",
    sourceScenarioId: "h001",
    input: "CONTROL",
    expectation: { ...positiveExpectation, requiredResultBatch: { source: "USER_EXPLICIT", candidateCount: 2 } },
    controlInput: {
      id: "explicit-two-omakase",
      content: "Give me 2 omakase restaurants near Shibuya tonight at 7 PM for two people.",
      reference_time: "2026-08-19T16:20:00+08:00",
      dataset: "restaurant-read-development@6",
      semantic: {
        target: { goal: "AVAILABILITY", requestedResultCount: 2 },
        location: { value: "Shibuya", relation: "NEAR" },
        date: { expression: "tonight", value: "2026-08-19" },
        time: { value: "19:00" },
        party_size: 2,
        criteria: [{ value: "omakase", polarity: "POSITIVE", strength: "HARD" }],
      },
    },
  },
] as const;

export function validateFixedSourceCaseRegistration(registration: FixedSourceCaseRegistration): FixedSourceCaseRegistration {
  if (!registration.id || !registration.sourceScenarioId || !registration.expectation?.requiredDimensions?.length) {
    throw Object.assign(new Error(`Fixed-source registration ${registration.id || "<missing-id>"} has no source binding or acceptance expectation`), { code: "FIXED_SOURCE_CASE_INVALID" });
  }
  if (registration.input === "CONTROL" && !registration.controlInput) {
    throw Object.assign(new Error(`Fixed-source control ${registration.id} has no input`), { code: "FIXED_SOURCE_CASE_INVALID" });
  }
  return registration;
}

export function fixedSourceCaseRegistration(id: string): FixedSourceCaseRegistration {
  const registration = FIXED_SOURCE_CASE_REGISTRATIONS.find((item) => item.id === id);
  if (!registration) throw Object.assign(new Error(`Unregistered fixed-source case: ${id}`), { code: "FIXED_SOURCE_CASE_UNREGISTERED" });
  return validateFixedSourceCaseRegistration(registration);
}

export async function loadRegisteredFixedSourceCase(id: string): Promise<{ registration: FixedSourceCaseRegistration; materializedCase: FrozenLiveCase }> {
  const registration = fixedSourceCaseRegistration(id);
  if (registration.input === "CONTROL") {
    return { registration, materializedCase: registration.controlInput as FrozenLiveCase };
  }
  const frozen = (await loadFrozenLiveCases(RESTAURANT_READ_DEVELOPMENT_CASE_PATH)).find((item) => item.id === id);
  if (!frozen) throw Object.assign(new Error(`Frozen development case ${id} is missing`), { code: "FIXED_SOURCE_CASE_INPUT_MISSING" });
  return { registration, materializedCase: frozen };
}
