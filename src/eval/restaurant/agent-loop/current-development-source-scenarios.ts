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
  { scenarioId: "h001", provenance: "SYNTHETIC_CONTROL", observations: [observation(
    "offline-h001", "Source Omakase Shibuya", ["omakase"],
    "2-8 Dogenzaka, Shibuya City, Tokyo", 35.6581, 139.6955, "+81 3-6000-1001", "https://offline.example/h001", "/en/source-omakase-shibuya",
    { landmark: { displayName: "Shibuya", coordinates: { latitude: 35.6595, longitude: 139.7005 } }, availability: availability("AVAILABLE", "2026-08-19", 2, ["19:00"], "Omakase course") },
  )] },
  { scenarioId: "h002", provenance: "SYNTHETIC_CONTROL", observations: [observation(
    "offline-h002", "Source Higashi-Ginza", ["first", "date"],
    "4-12 Ginza, Chuo City, Tokyo", 35.6694, 139.7694, "+81 3-6000-1002", "https://offline.example/h002", "/en/source-higashi-ginza",
    { landmark: { displayName: "Higashi-Ginza", coordinates: { latitude: 35.6697, longitude: 139.7676 } }, websiteFacts: facts(["French restaurant"], ["Saturday: 11:00 AM – 11:00 PM"]), availability: availability("AVAILABLE", "2026-08-22", 2, ["18:30"], "French dinner course") },
  )] },
  { scenarioId: "h003", provenance: "SYNTHETIC_CONTROL", observations: [observation(
    "offline-h003", "Source Team Dinner", ["team", "dinner", "nearby"],
    "1-4 Yurakucho, Chiyoda City, Tokyo", 35.6741, 139.7637, "+81 3-6000-1003", "https://offline.example/h003", "/en/source-team-dinner",
    { availability: availability("AVAILABLE", "2026-08-21", 10, ["19:00"], "After work team dinner course, good for drinks with our shared beverage selection.") },
  )] },
  { scenarioId: "h004", provenance: "SYNTHETIC_CONTROL", observations: [observation(
    "offline-h004", "Source Afternoon Cafe", ["cafe", "nearby"],
    "3-5 Nihonbashi, Chuo City, Tokyo", 35.6810, 139.7740, "+81 3-6000-1004", "https://offline.example/h004", "/en/source-afternoon-cafe",
    { websiteFacts: facts(["cafe"], ["Wednesday: 10:00 AM – 6:00 PM"]) },
  )] },
  { scenarioId: "h005", provenance: "SYNTHETIC_CONTROL", observations: [observation(
    "offline-h005", "Source Local Food", ["open", "tables", "nearby"],
    "5-3 Tsukiji, Chuo City, Tokyo", 35.6652, 139.7708, "+81 3-6000-1005", "https://offline.example/h005", "/en/source-local-food",
    { websiteFacts: facts(["Edomae sushi restaurant", "Tokyo regional cuisine"], ["Wednesday: 11:00 AM – 11:00 PM"]), availability: availability("AVAILABLE", "2026-08-19", 4, ["17:00"], "Edomae sushi tasting menu") },
  )] },
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
