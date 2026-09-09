/** Product display policy, not a provider inventory guarantee or booking TTL. */
export const RESTAURANT_AVAILABILITY_DISPLAY_FRESHNESS = {
  version: "restaurant-availability-display-freshness@1",
  durationMs: 10 * 60_000,
} as const;

export interface AvailabilityFreshnessWindow {
  displayExpiresAt: string;
  sourceExpiresAt?: string;
  policyVersion: typeof RESTAURANT_AVAILABILITY_DISPLAY_FRESHNESS.version;
}

function validTimestamp(value: string | undefined): value is string {
  return value !== undefined && !Number.isNaN(Date.parse(value));
}

/** A source-declared deadline can shorten, but never extend, the local display window. */
export function availabilityFreshnessWindow(
  observedAt: string,
  sourceExpiresAt?: string,
): AvailabilityFreshnessWindow {
  const observedAtMs = Date.parse(observedAt);
  if (Number.isNaN(observedAtMs)) throw new Error("Availability observation timestamp is invalid");
  const localExpiresAt = new Date(observedAtMs + RESTAURANT_AVAILABILITY_DISPLAY_FRESHNESS.durationMs).toISOString();
  const boundedSourceExpiry = validTimestamp(sourceExpiresAt) && Date.parse(sourceExpiresAt) < Date.parse(localExpiresAt)
    ? sourceExpiresAt
    : undefined;
  return {
    displayExpiresAt: boundedSourceExpiry ?? localExpiresAt,
    ...(validTimestamp(sourceExpiresAt) ? { sourceExpiresAt } : {}),
    policyVersion: RESTAURANT_AVAILABILITY_DISPLAY_FRESHNESS.version,
  };
}

export function isDisplayFresh(displayExpiresAt: string | undefined, now: string): boolean {
  return displayExpiresAt !== undefined &&
    !Number.isNaN(Date.parse(displayExpiresAt)) &&
    !Number.isNaN(Date.parse(now)) &&
    Date.parse(displayExpiresAt) > Date.parse(now);
}
