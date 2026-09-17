/**
 * Fixed, offline source environments for the exposed H001--H005 development
 * cohort.  They are deliberately independent of the frozen user messages,
 * semantic Gold, and any model action plan: a source row states only what a
 * simulated provider observed for a named outlet and request scope.
 *
 * `provenance` is part of the fixture contract.  These rows are synthetic
 * controls, not replayed Live evidence and must not be reported as such.
 */
export type CurrentDevelopmentScenarioId =
  | "h001" | "h002" | "h003" | "h004" | "h005"
  | "new-vegetarian-lunch";

export type FixedSourceObservation = {
  placeId: string;
  displayName: string;
  addressComponent?: string;
  websiteFacts?: { types: string[]; hours: string[] };
  availability?: {
    status: "AVAILABLE" | "UNAVAILABLE";
    date: string;
    partySize: number;
    visibleSlots: string[];
    menuText: string;
  };
};

export type CurrentDevelopmentSourceScenario = {
  /** Registration/report link only; it is never sent to production or a model. */
  scenarioId: CurrentDevelopmentScenarioId;
  provenance: "SYNTHETIC_CONTROL";
  observation: FixedSourceObservation;
};

export const CURRENT_DEVELOPMENT_SOURCE_SCENARIOS: readonly CurrentDevelopmentSourceScenario[] = [
  {
    scenarioId: "h001", provenance: "SYNTHETIC_CONTROL",
    observation: { placeId: "offline-h001", displayName: "Source Omakase Shibuya", addressComponent: "Shibuya", availability: { status: "AVAILABLE", date: "2026-08-19", partySize: 2, visibleSlots: ["19:00"], menuText: "Omakase course" } },
  },
  {
    scenarioId: "h002", provenance: "SYNTHETIC_CONTROL",
    observation: { placeId: "offline-h002", displayName: "Source Higashi-Ginza", addressComponent: "Higashi-Ginza", websiteFacts: { types: ["French restaurant"], hours: ["Saturday: 11:00 AM – 11:00 PM"] }, availability: { status: "AVAILABLE", date: "2026-08-22", partySize: 2, visibleSlots: ["18:30"], menuText: "French dinner course" } },
  },
  {
    scenarioId: "h003", provenance: "SYNTHETIC_CONTROL",
    observation: { placeId: "offline-h003", displayName: "Source Team Dinner", availability: { status: "AVAILABLE", date: "2026-08-21", partySize: 10, visibleSlots: ["19:00"], menuText: "After work team dinner course, good for drinks with our shared beverage selection." } },
  },
  {
    scenarioId: "h004", provenance: "SYNTHETIC_CONTROL",
    observation: { placeId: "offline-h004", displayName: "Source Afternoon Cafe", websiteFacts: { types: ["cafe"], hours: ["Wednesday: 10:00 AM – 6:00 PM"] } },
  },
  {
    scenarioId: "h005", provenance: "SYNTHETIC_CONTROL",
    observation: { placeId: "offline-h005", displayName: "Source Local Food", websiteFacts: { types: ["Edomae sushi restaurant", "Tokyo regional cuisine"], hours: ["Wednesday: 11:00 AM – 11:00 PM"] }, availability: { status: "AVAILABLE", date: "2026-08-19", partySize: 4, visibleSlots: ["17:00"], menuText: "Edomae sushi tasting menu" } },
  },
  {
    // This is intentionally not an H001--H005 variant: it changes cuisine,
    // negative condition, meal period, party size and named area together.
    // It is a controlled migration sample, not a private holdout.
    scenarioId: "new-vegetarian-lunch", provenance: "SYNTHETIC_CONTROL",
    observation: { placeId: "offline-new-vegetarian", displayName: "Source Vegetarian Kitchen", addressComponent: "Shibuya", websiteFacts: { types: ["Vegetarian restaurant", "Japanese restaurant"], hours: ["Thursday: 11:30 AM – 3:00 PM"] }, availability: { status: "AVAILABLE", date: "2026-08-20", partySize: 3, visibleSlots: ["12:30"], menuText: "Seasonal vegetarian lunch set" } },
  },
] as const;

export function currentDevelopmentSourceScenario(scenarioId: string): CurrentDevelopmentSourceScenario {
  const scenario = CURRENT_DEVELOPMENT_SOURCE_SCENARIOS.find((item) => item.scenarioId === scenarioId);
  if (!scenario) throw new Error(`No fixed source scenario for ${scenarioId}`);
  return scenario;
}
