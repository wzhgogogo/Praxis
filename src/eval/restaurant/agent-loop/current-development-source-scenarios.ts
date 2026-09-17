/**
 * Offline source observations used by the development cohort. They are
 * synthetic controls, never replayed Live evidence. Each candidate keeps its
 * own identity, location, source pages and inventory scope so a successful
 * answer cannot leak to another outlet or request.
 */
export type CurrentDevelopmentScenarioId =
  | "h001" | "h002" | "h003" | "h004" | "h005"
  | "new-vegetarian-lunch" | "multi-candidate-control";

export type FixedSourceAvailability = {
  status: "AVAILABLE" | "UNAVAILABLE";
  date: string;
  partySize: number;
  visibleSlots: string[];
  menuText: string;
};

export type FixedSourceObservation = {
  placeId: string;
  displayName: string;
  /** Terms that make this candidate discoverable; matching is token based. */
  searchTerms: readonly string[];
  venue: {
    address: string;
    coordinates: { latitude: number; longitude: number };
    phone: string;
    websiteUri: string;
    tableCheckPath: string;
  };
  landmark?: { displayName: string; coordinates: { latitude: number; longitude: number } };
  websiteFacts?: { types: string[]; hours: string[] };
  availability?: FixedSourceAvailability;
};

export type CurrentDevelopmentSourceScenario = {
  scenarioId: CurrentDevelopmentScenarioId;
  provenance: "SYNTHETIC_CONTROL";
  observations: readonly FixedSourceObservation[];
};

const venue = (address: string, latitude: number, longitude: number, phone: string, websiteUri: string, tableCheckPath: string) => ({
  address, coordinates: { latitude, longitude }, phone, websiteUri, tableCheckPath,
});

export const CURRENT_DEVELOPMENT_SOURCE_SCENARIOS: readonly CurrentDevelopmentSourceScenario[] = [
  { scenarioId: "h001", provenance: "SYNTHETIC_CONTROL", observations: [{
    placeId: "offline-h001", displayName: "Source Omakase Shibuya", searchTerms: ["omakase"],
    venue: venue("2-8 Dogenzaka, Shibuya City, Tokyo", 35.6581, 139.6955, "+81 3-6000-1001", "https://offline.example/h001", "/en/source-omakase-shibuya"),
    landmark: { displayName: "Shibuya", coordinates: { latitude: 35.6595, longitude: 139.7005 } },
    availability: { status: "AVAILABLE", date: "2026-08-19", partySize: 2, visibleSlots: ["19:00"], menuText: "Omakase course" },
  }] },
  { scenarioId: "h002", provenance: "SYNTHETIC_CONTROL", observations: [{
    placeId: "offline-h002", displayName: "Source Higashi-Ginza", searchTerms: ["first", "date"],
    venue: venue("4-12 Ginza, Chuo City, Tokyo", 35.6694, 139.7694, "+81 3-6000-1002", "https://offline.example/h002", "/en/source-higashi-ginza"),
    landmark: { displayName: "Higashi-Ginza", coordinates: { latitude: 35.6697, longitude: 139.7676 } },
    websiteFacts: { types: ["French restaurant"], hours: ["Saturday: 11:00 AM – 11:00 PM"] },
    availability: { status: "AVAILABLE", date: "2026-08-22", partySize: 2, visibleSlots: ["18:30"], menuText: "French dinner course" },
  }] },
  { scenarioId: "h003", provenance: "SYNTHETIC_CONTROL", observations: [{
    placeId: "offline-h003", displayName: "Source Team Dinner", searchTerms: ["team", "dinner", "nearby"],
    venue: venue("1-4 Yurakucho, Chiyoda City, Tokyo", 35.6741, 139.7637, "+81 3-6000-1003", "https://offline.example/h003", "/en/source-team-dinner"),
    availability: { status: "AVAILABLE", date: "2026-08-21", partySize: 10, visibleSlots: ["19:00"], menuText: "After work team dinner course, good for drinks with our shared beverage selection." },
  }] },
  { scenarioId: "h004", provenance: "SYNTHETIC_CONTROL", observations: [{
    placeId: "offline-h004", displayName: "Source Afternoon Cafe", searchTerms: ["cafe", "nearby"],
    venue: venue("3-5 Nihonbashi, Chuo City, Tokyo", 35.6810, 139.7740, "+81 3-6000-1004", "https://offline.example/h004", "/en/source-afternoon-cafe"),
    websiteFacts: { types: ["cafe"], hours: ["Wednesday: 10:00 AM – 6:00 PM"] },
  }] },
  { scenarioId: "h005", provenance: "SYNTHETIC_CONTROL", observations: [{
    placeId: "offline-h005", displayName: "Source Local Food", searchTerms: ["open", "tables", "nearby"],
    venue: venue("5-3 Tsukiji, Chuo City, Tokyo", 35.6652, 139.7708, "+81 3-6000-1005", "https://offline.example/h005", "/en/source-local-food"),
    websiteFacts: { types: ["Edomae sushi restaurant", "Tokyo regional cuisine"], hours: ["Wednesday: 11:00 AM – 11:00 PM"] },
    availability: { status: "AVAILABLE", date: "2026-08-19", partySize: 4, visibleSlots: ["17:00"], menuText: "Edomae sushi tasting menu" },
  }] },
  { scenarioId: "new-vegetarian-lunch", provenance: "SYNTHETIC_CONTROL", observations: [{
    placeId: "offline-new-vegetarian", displayName: "Source Vegetarian Kitchen", searchTerms: ["vegetarian", "lunch"],
    venue: venue("1-18 Jinnan, Shibuya City, Tokyo", 35.6621, 139.6991, "+81 3-6000-1006", "https://offline.example/vegetarian", "/en/source-vegetarian-kitchen"),
    landmark: { displayName: "Shibuya", coordinates: { latitude: 35.6595, longitude: 139.7005 } },
    websiteFacts: { types: ["Vegetarian restaurant", "Japanese restaurant"], hours: ["Thursday: 11:30 AM – 3:00 PM"] },
    availability: { status: "AVAILABLE", date: "2026-08-20", partySize: 3, visibleSlots: ["12:30"], menuText: "Seasonal vegetarian lunch set" },
  }] },
  { scenarioId: "multi-candidate-control", provenance: "SYNTHETIC_CONTROL", observations: [
    {
      placeId: "offline-multi-unavailable", displayName: "Source First Full", searchTerms: ["vegetarian", "lunch"],
      venue: venue("1-2 Udagawacho, Shibuya City, Tokyo", 35.6613, 139.6977, "+81 3-6000-1101", "https://offline.example/multi-first", "/en/source-first-full"),
      landmark: { displayName: "Shibuya", coordinates: { latitude: 35.6595, longitude: 139.7005 } },
      availability: { status: "UNAVAILABLE", date: "2026-08-20", partySize: 3, visibleSlots: [], menuText: "Vegetarian lunch set" },
    },
    {
      placeId: "offline-multi-available", displayName: "Source Second Open", searchTerms: ["vegetarian", "lunch"],
      venue: venue("2-20 Jingumae, Shibuya City, Tokyo", 35.6690, 139.7050, "+81 3-6000-1102", "https://offline.example/multi-second", "/en/source-second-open"),
      availability: { status: "AVAILABLE", date: "2026-08-20", partySize: 3, visibleSlots: ["12:30"], menuText: "Vegetarian lunch set" },
    },
  ] },
] as const;

export function currentDevelopmentSourceScenario(scenarioId: string): CurrentDevelopmentSourceScenario {
  const scenario = CURRENT_DEVELOPMENT_SOURCE_SCENARIOS.find((item) => item.scenarioId === scenarioId);
  if (!scenario) throw Object.assign(new Error(`No fixed source scenario for ${scenarioId}`), { code: "FIXTURE_COVERAGE_GAP" });
  return scenario;
}
