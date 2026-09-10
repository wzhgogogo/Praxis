/**
 * Public, fixed test context for frozen NEAR_USER diagnostics.  It is not a
 * product default and is never used unless a runner explicitly selects it.
 */
export const HIGASHI_GINZA_EVALUATION_LOCATION = {
  label: "Higashi-Ginza public evaluation point",
  latitude: 35.6697,
  longitude: 139.7670,
  radiusMeters: 3_000,
  source: "Tokyo Metro Higashi-ginza Station public location",
} as const;
