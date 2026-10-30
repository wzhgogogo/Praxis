import { DEFAULT_NEARBY_RADIUS_METERS } from "../../core/location/nearby.js";
import { ProxyAgent } from "undici";

import {
  GOOGLE_PLACES_RESTAURANT_FIELD_MASK,
  GOOGLE_PLACES_DETAILS_FIELD_MASK,
  GOOGLE_PLACES_DETAILS_URL,
  GOOGLE_PLACES_NEARBY_SEARCH_URL,
  GOOGLE_PLACES_TEXT_SEARCH_URL,
  GooglePlacesError,
  type GooglePlacesRawPlace,
  type GooglePlacesTextSearchRequest,
  type GooglePlacesTextSearchPage,
  type GooglePlacesTextSearchResponse,
  type GooglePlacesNearbySearchRequest,
  type GooglePlacesSourceName,
} from "./google-places-contracts.js";

export interface GooglePlacesClientOptions {
  apiKey: string;
  fetchImplementation?: typeof fetch;
  proxyServer?: string | undefined;
  timeoutMs?: number;
}

function nonBlank(value: string, name: string): string {
  if (!value.trim()) throw new GooglePlacesError("GOOGLE_CONFIGURATION_ERROR", `${name} must be configured`);
  return value;
}

export class GooglePlacesClient {
  private readonly fetchImplementation: typeof fetch;
  private readonly timeoutMs: number;

  constructor(private readonly options: GooglePlacesClientOptions) {
    nonBlank(options.apiKey, "Google Places API key");
    let googleFetch = fetch;
    if (options.proxyServer?.trim()) {
      let agent: ProxyAgent;
      try {
        const proxy = new URL(options.proxyServer);
        if (proxy.protocol !== "http:" && proxy.protocol !== "https:") throw new Error("Unsupported proxy protocol");
        agent = new ProxyAgent(proxy.toString());
      } catch {
        throw new GooglePlacesError("GOOGLE_CONFIGURATION_ERROR", "Google Places proxy must be a valid HTTP(S) URL");
      }
      googleFetch = (url, init) => fetch(url, { ...init, dispatcher: agent } as RequestInit);
    }
    this.fetchImplementation = options.fetchImplementation ?? googleFetch;
    this.timeoutMs = options.timeoutMs ?? 8_000;
  }

  static fromEnvironment(environment: NodeJS.ProcessEnv = process.env): GooglePlacesClient {
    return new GooglePlacesClient({
      apiKey: environment.GOOGLE_MAPS_API_KEY ?? "",
      proxyServer: environment.PRAXIS_GOOGLE_API_PROXY_SERVER,
    });
  }

  /** Compatibility helper for callers that intentionally need one unpaged result list. */
  async textSearch(request: GooglePlacesTextSearchRequest, signal: AbortSignal): Promise<GooglePlacesRawPlace[]> {
    return (await this.textSearchPage(request, signal)).places;
  }

  /**
   * Reads exactly one Google Text Search page.  Pagination policy belongs to
   * the Restaurant adapter, which can persist the opaque cursor with the
   * authoritative query and enforce its own bounded read budget.
   */
  async textSearchPage(request: GooglePlacesTextSearchRequest, signal: AbortSignal): Promise<GooglePlacesTextSearchPage> {
    return this.requestJson(
      GOOGLE_PLACES_TEXT_SEARCH_URL,
      {
        method: "POST",
        body: JSON.stringify({
          textQuery: request.textQuery,
          pageSize: request.pageSize,
          ...(request.pageToken ? { pageToken: request.pageToken } : {}),
          ...(request.locationBias ? {
            locationBias: {
              circle: {
                center: { latitude: request.locationBias.latitude, longitude: request.locationBias.longitude },
                radius: request.locationBias.radiusMeters ?? DEFAULT_NEARBY_RADIUS_METERS,
              },
            },
          } : {}),
          ...(request.locationRestriction ? { locationRestriction: { rectangle: request.locationRestriction } } : {}),
        }),
      },
      GOOGLE_PLACES_RESTAURANT_FIELD_MASK,
      signal,
      (payload) => {
        const response = payload as GooglePlacesTextSearchResponse;
        if (response.places !== undefined && !Array.isArray(response.places)) {
          throw new GooglePlacesError("GOOGLE_MALFORMED_RESPONSE", "Google Places response has invalid places");
        }
        if (response.nextPageToken !== undefined && (typeof response.nextPageToken !== "string" || !response.nextPageToken.trim())) {
          throw new GooglePlacesError("GOOGLE_MALFORMED_RESPONSE", "Google Places response has invalid nextPageToken");
        }
        return {
          places: response.places ?? [],
          ...(typeof response.nextPageToken === "string" ? { nextPageToken: response.nextPageToken } : {}),
        };
      },
    );
  }

  /** One documented type-and-circle Nearby Search request; it has no cursor. */
  async nearbySearch(request: GooglePlacesNearbySearchRequest, signal: AbortSignal): Promise<GooglePlacesRawPlace[]> {
    return this.requestJson(
      GOOGLE_PLACES_NEARBY_SEARCH_URL,
      { method: "POST", body: JSON.stringify({
        includedTypes: request.includedTypes,
        maxResultCount: request.maxResultCount,
        locationRestriction: { circle: { center: { latitude: request.location.latitude, longitude: request.location.longitude }, radius: request.location.radiusMeters } },
      }) },
      GOOGLE_PLACES_RESTAURANT_FIELD_MASK.split(",").filter((field) => field !== "nextPageToken").join(","),
      signal,
      (payload) => {
        const response = payload as GooglePlacesTextSearchResponse;
        if (response.places !== undefined && !Array.isArray(response.places)) throw new GooglePlacesError("GOOGLE_MALFORMED_RESPONSE", "Google Places Nearby response has invalid places");
        return response.places ?? [];
      },
    );
  }

  /** Public reverse geocoding: coordinates stay the authoritative center;
   * only the source address components are returned, never a replacement point. */
  async reverseAddress(location: { latitude: number; longitude: number }, signal: AbortSignal): Promise<GooglePlacesRawPlace> {
    return this.requestJson(
      `https://geocode.googleapis.com/v4/geocode/location?location.latitude=${location.latitude}&location.longitude=${location.longitude}`,
      { method: "GET" }, "results.addressComponents", signal,
      payload => {
        const results = (payload as { results?: GooglePlacesRawPlace[] }).results;
        if (!Array.isArray(results)) throw new GooglePlacesError("GOOGLE_MALFORMED_RESPONSE", "Google reverse geocoding returned invalid results");
        return { addressComponents: results[0]?.addressComponents ?? [] };
      },
    );
  }

  /** Reads one Google Place by its stable place ID; it never re-discovers by name. */
  async placeDetails(placeId: string, signal: AbortSignal): Promise<GooglePlacesRawPlace> {
    const id = placeId.replace(/^places\//, "").trim();
    if (!id) throw new GooglePlacesError("GOOGLE_MALFORMED_RESPONSE", "Google Place details requires a place ID");
    return this.requestJson(
      `${GOOGLE_PLACES_DETAILS_URL}/${encodeURIComponent(id)}`,
      { method: "GET" },
      GOOGLE_PLACES_DETAILS_FIELD_MASK,
      signal,
      (payload) => payload as GooglePlacesRawPlace,
    );
  }

  /** Create once per run and share with both source consumers. Rejections are
   * cached too: a second consumer must not silently retry a failed request. */
  japaneseNamesForRun(signal: AbortSignal): (placeId: string) => Promise<GooglePlacesSourceName> {
    const names = new Map<string, Promise<GooglePlacesSourceName>>();
    return (placeId) => {
      if (signal.aborted) return Promise.reject(new GooglePlacesError("GOOGLE_NETWORK_FAILED", "Google name run aborted"));
      const id = placeId.replace(/^places\//, "").trim();
      if (!id) return Promise.reject(new GooglePlacesError("GOOGLE_MALFORMED_RESPONSE", "Google source name requires a place ID"));
      let name = names.get(id);
      if (!name) {
        name = this.requestJson(
          `${GOOGLE_PLACES_DETAILS_URL}/${encodeURIComponent(id)}?languageCode=ja`,
          { method: "GET" }, "id,displayName", signal,
          (payload) => {
            const place = payload as GooglePlacesRawPlace;
            if (!place || place.id !== id || typeof place.displayName?.text !== "string" || !place.displayName.text.trim()
              || (place.displayName.languageCode !== undefined && (typeof place.displayName.languageCode !== "string" || !place.displayName.languageCode.trim()))) {
              throw new GooglePlacesError("GOOGLE_MALFORMED_RESPONSE", "Google source name has mismatched ID, missing text or invalid language");
            }
            return Object.freeze({ placeId: id, text: place.displayName.text,
              languageCode: typeof place.displayName.languageCode === "string" ? place.displayName.languageCode : null });
          },
        );
        names.set(id, name);
      }
      return name;
    };
  }

  private async requestJson<T>(
    url: string,
    init: { method: "GET" | "POST"; body?: BodyInit },
    fieldMask: string,
    signal: AbortSignal,
    parse: (payload: GooglePlacesTextSearchResponse | GooglePlacesRawPlace) => T,
  ): Promise<T> {
    const controller = new AbortController();
    const relayAbort = () => controller.abort(signal.reason);
    signal.addEventListener("abort", relayAbort, { once: true });
    let rejectDeadline: ((error: GooglePlacesError) => void) | undefined;
    const deadline = new Promise<never>((_resolve, reject) => {
      rejectDeadline = reject;
    });
    const timeout = setTimeout(() => {
      controller.abort(new Error("Google Places request timed out"));
      rejectDeadline?.(new GooglePlacesError("GOOGLE_TIMEOUT", "Google Places request timed out"));
    }, this.timeoutMs);
    try {
      return await Promise.race([Promise.resolve().then(async () => {
        const response = await this.fetchImplementation(url, {
        method: init.method,
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.options.apiKey,
          "X-Goog-FieldMask": fieldMask,
        },
        ...(init.body ? { body: init.body } : {}),
        signal: controller.signal,
        });
        if (!response.ok) {
          const code = response.status === 429
            ? "GOOGLE_RATE_LIMITED"
            : response.status === 403
              ? "GOOGLE_SERVICE_QUOTA_OR_PERMISSION"
              : "GOOGLE_SERVICE_REJECTED";
          throw new GooglePlacesError(code, `Google Places returned HTTP ${response.status}`);
        }
        let payload: GooglePlacesTextSearchResponse | GooglePlacesRawPlace;
        try {
          payload = await response.json() as GooglePlacesTextSearchResponse;
        } catch {
          throw new GooglePlacesError("GOOGLE_MALFORMED_RESPONSE", "Google Places returned invalid JSON");
        }
        return parse(payload);
      }), deadline]);
    } catch (error) {
      if (error instanceof GooglePlacesError) throw error;
      if (controller.signal.aborted) {
        throw new GooglePlacesError(
          signal.aborted ? "GOOGLE_NETWORK_FAILED" : "GOOGLE_TIMEOUT",
          signal.aborted ? "Google Places request aborted" : "Google Places request timed out",
        );
      }
      throw new GooglePlacesError("GOOGLE_NETWORK_FAILED", "Google Places request failed");
    } finally {
      clearTimeout(timeout);
      signal.removeEventListener("abort", relayAbort);
    }
  }
}
