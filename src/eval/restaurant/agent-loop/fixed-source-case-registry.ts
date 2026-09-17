import { loadFrozenLiveCases, type FrozenLiveCase, RESTAURANT_READ_DEVELOPMENT_CASE_PATH } from "./live-case-materializer.js";
import type { CurrentDevelopmentScenarioId } from "./current-development-source-scenarios.js";

export type FixedSourceExpectation = {
  /** A predeclared acceptance rule, never inferred from the run's output. */
  kind: "QUALIFIED_RESULT" | "NO_QUALIFIED_RESULT";
  userGoalComplete: boolean;
  requiredDimensions: readonly ["AUTHORITATIVE_CONDITIONS", "REQUIRED_EVIDENCE", "FINAL_CLAIM", "COMPLETION_OUTCOME"];
};

export type FixedSourceCaseRegistration = {
  id: string;
  sourceScenarioId: CurrentDevelopmentScenarioId;
  input: "FROZEN_DEVELOPMENT" | "CONTROL";
  expectation: FixedSourceExpectation;
  /** Present only for explicitly registered, deterministic control inputs. */
  controlInput?: Pick<FrozenLiveCase, "id" | "content" | "reference_time" | "dataset">;
};

const positiveExpectation: FixedSourceExpectation = {
  kind: "QUALIFIED_RESULT",
  userGoalComplete: true,
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
    },
  },
] as const;

export function fixedSourceCaseRegistration(id: string): FixedSourceCaseRegistration {
  const registration = FIXED_SOURCE_CASE_REGISTRATIONS.find((item) => item.id === id);
  if (!registration) throw Object.assign(new Error(`Unregistered fixed-source case: ${id}`), { code: "FIXED_SOURCE_CASE_UNREGISTERED" });
  if (!registration.sourceScenarioId || !registration.expectation?.requiredDimensions?.length) {
    throw Object.assign(new Error(`Fixed-source registration ${id} has no source binding or acceptance expectation`), { code: "FIXED_SOURCE_CASE_INVALID" });
  }
  return registration;
}

export async function loadRegisteredFixedSourceCase(id: string): Promise<{ registration: FixedSourceCaseRegistration; materializedCase: FrozenLiveCase }> {
  const registration = fixedSourceCaseRegistration(id);
  if (registration.input === "CONTROL") {
    if (!registration.controlInput) throw Object.assign(new Error(`Fixed-source control ${id} has no input`), { code: "FIXED_SOURCE_CASE_INVALID" });
    return { registration, materializedCase: registration.controlInput as FrozenLiveCase };
  }
  const frozen = (await loadFrozenLiveCases(RESTAURANT_READ_DEVELOPMENT_CASE_PATH)).find((item) => item.id === id);
  if (!frozen) throw Object.assign(new Error(`Frozen development case ${id} is missing`), { code: "FIXED_SOURCE_CASE_INPUT_MISSING" });
  return { registration, materializedCase: frozen };
}
