/**
 * Offline source observations used by the development cohort. They are
 * synthetic controls, never replayed Live evidence. A Google listing and a
 * TableCheck listing deliberately have separate identity fields: fixture
 * defaults are only authoring convenience, never a transport shortcut.
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
  /** When the synthetic page was captured, not when this run observed it. */
  sampleCapturedAt: string;
};

export type FixedGoogleObservation = {
  placeId: string;
  displayName: string;
  address: string;
  coordinates: { latitude: number; longitude: number };
  phone: string;
  websiteUri: string;
  /** Google Maps deep link; it is never a provider website URL. */
  googleMapsUri: string;
  /** A configured provider 404 is an observed source result, not a gap. */
  detailStatus?: "PRESENT" | "NOT_FOUND";
};

export type FixedTableCheckObservation = {
  displayName: string;
  address: string;
  phone: string;
  reservationEntryPath: string;
  /** Allows a test to prove that another observed entrance, not a fresh search, was reused. */
  discoveryListed?: boolean;
};

export type FixedSourceObservation = {
  /** Fixture retrieval vocabulary, not a user request or a resolver hint. */
  searchTerms: readonly string[];
  google: FixedGoogleObservation;
  tableCheck?: FixedTableCheckObservation;
  landmark?: { displayName: string; coordinates: { latitude: number; longitude: number } };
  websiteFacts?: { types: string[]; hours: string[]; sampleCapturedAt: string };
  availability?: FixedSourceAvailability;
};

export type CurrentDevelopmentSourceScenario = {
  scenarioId: CurrentDevelopmentScenarioId;
  provenance: "SYNTHETIC_CONTROL";
  observations: readonly FixedSourceObservation[];
};

const CAPTURED_AT = "2026-08-01T00:00:00.000Z";
const availability = (status: "AVAILABLE" | "UNAVAILABLE", date: string, partySize: number, visibleSlots: string[], menuText: string): FixedSourceAvailability =>
  ({ status, date, partySize, visibleSlots, menuText, sampleCapturedAt: CAPTURED_AT });
const facts = (types: string[], hours: string[]) => ({ types, hours, sampleCapturedAt: CAPTURED_AT });

function observation(
  placeId: string, displayName: string, searchTerms: string[],
  address: string, latitude: number, longitude: number, phone: string, websiteUri: string, reservationEntryPath: string,
  extra: Omit<Partial<FixedSourceObservation>, "google" | "tableCheck" | "searchTerms"> & {
    google?: Partial<FixedGoogleObservation>;
    tableCheck?: Partial<FixedTableCheckObservation> | null;
  } = {},
): FixedSourceObservation {
  const { google: googleOverride, tableCheck: tableCheckOverride, ...rest } = extra;
  return {
    searchTerms,
    // Do not share this object with TableCheck. Tests may (and do) make these
    // observations disagree without changing the other provider.
    google: {
      placeId, displayName, address, coordinates: { latitude, longitude }, phone, websiteUri,
      // This is the actual Google Maps field, not a provider URL.  A Google
      // websiteUri may independently happen to be a TableCheck public page.
      googleMapsUri: `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(placeId)}`,
      ...googleOverride,
    },
    ...(tableCheckOverride === null ? {} : { tableCheck: {
      displayName, address, phone, reservationEntryPath, ...tableCheckOverride,
    } }),
    ...rest,
  };
}

export const CURRENT_DEVELOPMENT_SOURCE_SCENARIOS: readonly CurrentDevelopmentSourceScenario[] = [
  { scenarioId: "h001", provenance: "SYNTHETIC_CONTROL", observations: [
    observation("offline-h001-a", "Source Omakase Shibuya", ["omakase"], "2-8 Dogenzaka, Shibuya City, Tokyo", 35.6581, 139.6955, "+81 3-6000-1001", "https://offline.example/h001-a", "/en/source-omakase-shibuya", {
      landmark: { displayName: "Shibuya", coordinates: { latitude: 35.6595, longitude: 139.7005 } }, availability: availability("AVAILABLE", "2026-08-19", 2, ["19:00"], "Omakase course"),
    }),
    observation("offline-h001-b", "Source Omakase Jinnan", ["omakase"], "1-18 Jinnan, Shibuya City, Tokyo", 35.6621, 139.6991, "+81 3-6000-1011", "https://offline.example/h001-b", "/en/source-omakase-jinnan", {
      availability: availability("AVAILABLE", "2026-08-19", 2, ["19:00"], "Seasonal omakase course"),
    }),
    observation("offline-h001-c", "Source Omakase Sakuragaoka", ["omakase"], "3-4 Sakuragaokacho, Shibuya City, Tokyo", 35.6569, 139.7021, "+81 3-6000-1012", "https://offline.example/h001-c", "/en/source-omakase-sakuragaoka", {
      availability: availability("AVAILABLE", "2026-08-19", 2, ["19:00"], "Chef's omakase dinner"),
    }),
  ] },
  { scenarioId: "h002", provenance: "SYNTHETIC_CONTROL", observations: [
    observation("offline-h002-a", "Source Higashi-Ginza", ["first", "date"], "4-12 Ginza, Chuo City, Tokyo", 35.6694, 139.7694, "+81 3-6000-1002", "https://offline.example/h002-a", "/en/source-higashi-ginza", {
      landmark: { displayName: "Higashi-Ginza", coordinates: { latitude: 35.6697, longitude: 139.7676 } }, websiteFacts: facts(["French restaurant"], ["Saturday: 11:00 AM – 11:00 PM"]), availability: availability("AVAILABLE", "2026-08-22", 2, ["18:30"], "French dinner course"),
    }),
    observation("offline-h002-b", "Source Ginza Italian", ["first", "date"], "6-4 Ginza, Chuo City, Tokyo", 35.6711, 139.7679, "+81 3-6000-1021", "https://offline.example/h002-b", "/en/source-ginza-italian", {
      websiteFacts: facts(["Italian restaurant"], ["Saturday: 11:00 AM – 11:00 PM"]), availability: availability("AVAILABLE", "2026-08-22", 2, ["18:30"], "Italian dinner course"),
    }),
    observation("offline-h002-c", "Source Ginza Kaiseki", ["first", "date"], "2-10 Tsukiji, Chuo City, Tokyo", 35.6683, 139.7702, "+81 3-6000-1022", "https://offline.example/h002-c", "/en/source-ginza-kaiseki", {
      websiteFacts: facts(["Japanese kaiseki restaurant"], ["Saturday: 11:00 AM – 11:00 PM"]), availability: availability("AVAILABLE", "2026-08-22", 2, ["18:30"], "Kaiseki dinner course"),
    }),
  ] },
  { scenarioId: "h003", provenance: "SYNTHETIC_CONTROL", observations: [
    observation("offline-h003-a", "Source Team Dinner", ["team", "dinner", "nearby"], "1-4 Yurakucho, Chiyoda City, Tokyo", 35.6741, 139.7637, "+81 3-6000-1003", "https://offline.example/h003-a", "/en/source-team-dinner", {
      availability: availability("AVAILABLE", "2026-08-21", 10, ["19:00"], "After work team dinner course, good for drinks with our shared beverage selection."),
    }),
    observation("offline-h003-b", "Source Team Izakaya", ["team", "dinner", "nearby"], "2-6 Yurakucho, Chiyoda City, Tokyo", 35.6731, 139.7622, "+81 3-6000-1031", "https://offline.example/h003-b", "/en/source-team-izakaya", {
      availability: availability("AVAILABLE", "2026-08-21", 10, ["19:30"], "Team dinner and good for drinks course."),
    }),
    observation("offline-h003-c", "Source Team Dining Marunouchi", ["team", "dinner", "nearby"], "1-1 Marunouchi, Chiyoda City, Tokyo", 35.6812, 139.7648, "+81 3-6000-1032", "https://offline.example/h003-c", "/en/source-team-marunouchi", {
      availability: availability("AVAILABLE", "2026-08-21", 10, ["20:00"], "Team dinner, good for drinks."),
    }),
  ] },
  { scenarioId: "h004", provenance: "SYNTHETIC_CONTROL", observations: [
    observation("offline-h004-a", "Source Afternoon Cafe", ["cafe", "nearby"], "3-5 Nihonbashi, Chuo City, Tokyo", 35.6810, 139.7740, "+81 3-6000-1004", "https://offline.example/h004-a", "/en/source-afternoon-cafe", {
      websiteFacts: facts(["cafe"], ["Wednesday: 10:00 AM – 6:00 PM"]),
    }),
    observation("offline-h004-b", "Source Meeting Cafe", ["cafe", "nearby"], "2-3 Nihonbashi, Chuo City, Tokyo", 35.6821, 139.7751, "+81 3-6000-1041", "https://offline.example/h004-b", "/en/source-meeting-cafe", {
      websiteFacts: facts(["cafe"], ["Wednesday: 9:00 AM – 7:00 PM"]),
    }),
    observation("offline-h004-c", "Source Riverside Cafe", ["cafe", "nearby"], "1-12 Nihonbashi, Chuo City, Tokyo", 35.6803, 139.7728, "+81 3-6000-1042", "https://offline.example/h004-c", "/en/source-riverside-cafe", {
      websiteFacts: facts(["cafe"], ["Wednesday: 10:30 AM – 6:30 PM"]),
    }),
  ] },
  { scenarioId: "h005", provenance: "SYNTHETIC_CONTROL", observations: [
    observation("offline-h005-a", "Source Local Food", ["open", "tables", "nearby"], "5-3 Tsukiji, Chuo City, Tokyo", 35.6652, 139.7708, "+81 3-6000-1005", "https://offline.example/h005-a", "/en/source-local-food", {
      websiteFacts: facts(["Local food Edomae sushi restaurant", "Tokyo regional cuisine"], ["Wednesday: 11:00 AM – 11:00 PM"]), availability: availability("AVAILABLE", "2026-08-19", 4, ["17:00"], "Local food Edomae sushi tasting menu"),
    }),
    observation("offline-h005-b", "Source Tsukiji Local Kitchen", ["open", "tables", "nearby"], "4-8 Tsukiji, Chuo City, Tokyo", 35.6661, 139.7719, "+81 3-6000-1051", "https://offline.example/h005-b", "/en/source-tsukiji-local-kitchen", {
      websiteFacts: facts(["Local food restaurant serving Tokyo regional cuisine"], ["Wednesday: 11:00 AM – 11:00 PM"]), availability: availability("AVAILABLE", "2026-08-19", 4, ["17:00"], "Tokyo local food dinner set"),
    }),
    observation("offline-h005-c", "Source Nihonbashi Local Grill", ["open", "tables", "nearby"], "1-6 Nihonbashi, Chuo City, Tokyo", 35.6825, 139.7765, "+81 3-6000-1052", "https://offline.example/h005-c", "/en/source-nihonbashi-local-grill", {
      websiteFacts: facts(["Local food restaurant serving Tokyo regional cuisine"], ["Wednesday: 11:00 AM – 11:00 PM"]), availability: availability("AVAILABLE", "2026-08-19", 4, ["17:00"], "Local food grill dinner"),
    }),
  ] },
  { scenarioId: "new-vegetarian-lunch", provenance: "SYNTHETIC_CONTROL", observations: [observation(
    "offline-new-vegetarian", "Source Vegetarian Kitchen", ["vegetarian", "lunch"],
    "1-18 Jinnan, Shibuya City, Tokyo", 35.6621, 139.6991, "+81 3-6000-1006", "https://offline.example/vegetarian", "/en/source-vegetarian-kitchen",
    // "Plant-forward bistro" is intentionally not a verbatim copy of the
    // HARD request. The scripted model boundary below is marked code-contract
    // only; its cited judgment is what the production state reducer receives.
    { landmark: { displayName: "Shibuya", coordinates: { latitude: 35.6595, longitude: 139.7005 } }, websiteFacts: facts(["Plant-forward bistro", "Japanese restaurant"], ["Thursday: 11:30 AM – 3:00 PM"]), availability: availability("AVAILABLE", "2026-08-20", 3, ["12:30"], "Seasonal vegetarian lunch set") },
  )] },
  { scenarioId: "multi-candidate-control", provenance: "SYNTHETIC_CONTROL", observations: [
    observation("offline-multi-unavailable", "Source First Full", ["vegetarian", "lunch"], "1-2 Udagawacho, Shibuya City, Tokyo", 35.6613, 139.6977, "+81 3-6000-1101", "https://offline.example/multi-first", "/en/source-first-full", {
      landmark: { displayName: "Shibuya", coordinates: { latitude: 35.6595, longitude: 139.7005 } }, availability: availability("UNAVAILABLE", "2026-08-20", 3, [], "Vegetarian lunch set"),
    }),
    observation("offline-multi-available", "Source Second Open", ["vegetarian", "lunch"], "2-20 Jingumae, Shibuya City, Tokyo", 35.6690, 139.7050, "+81 3-6000-1102", "https://offline.example/multi-second", "/en/source-second-open", {
      availability: availability("AVAILABLE", "2026-08-20", 3, ["12:30"], "Vegetarian lunch set"),
    }),
  ] },
] as const;

export function currentDevelopmentSourceScenario(scenarioId: string): CurrentDevelopmentSourceScenario {
  const scenario = CURRENT_DEVELOPMENT_SOURCE_SCENARIOS.find((item) => item.scenarioId === scenarioId);
  if (!scenario) throw Object.assign(new Error(`No fixed source scenario for ${scenarioId}`), { code: "FIXTURE_COVERAGE_GAP" });
  return scenario;
}
