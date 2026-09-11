import {
  GOOGLE_PLACES_RESTAURANT_FIELD_MASK,
  GOOGLE_PLACES_DETAILS_FIELD_MASK,
  GOOGLE_PLACES_DETAILS_URL,
  GOOGLE_PLACES_TEXT_SEARCH_URL,
  GooglePlacesError,
  type GooglePlacesRawPlace,
  type GooglePlacesTextSearchRequest,
  type GooglePlacesTextSearchResponse,
} from "./google-places-contracts.js";

export interface GooglePlacesClientOptions {
  apiKey: string;
  fetchImplementation?: typeof fetch;
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
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 8_000;
  }

  static fromEnvironment(environment: NodeJS.ProcessEnv = process.env): GooglePlacesClient {
    return new GooglePlacesClient({ apiKey: environment.GOOGLE_MAPS_API_KEY ?? "" });
  }

  async textSearch(request: GooglePlacesTextSearchRequest, signal: AbortSignal): Promise<GooglePlacesRawPlace[]> {
    return this.requestJson(
      GOOGLE_PLACES_TEXT_SEARCH_URL,
      {
        method: "POST",
        body: JSON.stringify({
          textQuery: request.textQuery,
          pageSize: request.pageSize,
          ...(request.locationBias ? {
            locationBias: {
              circle: {
                center: { latitude: request.locationBias.latitude, longitude: request.locationBias.longitude },
                radius: request.locationBias.radiusMeters ?? 3_000,
              },
            },
          } : {}),
        }),
      },
      GOOGLE_PLACES_RESTAURANT_FIELD_MASK,
      signal,
      (payload) => {
        const response = payload as GooglePlacesTextSearchResponse;
        if (response.places !== undefined && !Array.isArray(response.places)) {
          throw new GooglePlacesError("GOOGLE_MALFORMED_RESPONSE", "Google Places response has invalid places");
        }
        return response.places ?? [];
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
        if (!response.ok) throw new GooglePlacesError("GOOGLE_SEARCH_FAILED", `Google Places returned HTTP ${response.status}`);
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
          signal.aborted ? "GOOGLE_SEARCH_FAILED" : "GOOGLE_TIMEOUT",
          signal.aborted ? "Google Places request aborted" : "Google Places request timed out",
        );
      }
      throw new GooglePlacesError("GOOGLE_SEARCH_FAILED", "Google Places request failed");
    } finally {
      clearTimeout(timeout);
      signal.removeEventListener("abort", relayAbort);
    }
  }
}
