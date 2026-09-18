import assert from "node:assert/strict";
import { test } from "node:test";

import { GooglePlacesClient } from "./google-places-client.js";
import { GOOGLE_PLACES_DETAILS_FIELD_MASK, GOOGLE_PLACES_RESTAURANT_FIELD_MASK } from "./google-places-contracts.js";

test("Google Text Search carries an opaque page token and keeps its response field separate from Place Details", async () => {
  const requests: Array<{ body?: Record<string, unknown>; fieldMask?: string }> = [];
  const client = new GooglePlacesClient({
    apiKey: "test-key",
    fetchImplementation: async (_url, init) => {
      requests.push({
        ...(init?.body ? { body: JSON.parse(String(init.body)) as Record<string, unknown> } : {}),
        ...((init?.headers as Record<string, string> | undefined)?.["X-Goog-FieldMask"]
          ? { fieldMask: (init?.headers as Record<string, string>)["X-Goog-FieldMask"] }
          : {}),
      });
      return new Response(JSON.stringify(init?.method === "GET" ? { id: "place-1" } : { places: [], nextPageToken: "page-2" }), { status: 200 });
    },
  });
  const page = await client.textSearchPage({ textQuery: "restaurant", pageSize: 20, pageToken: "page-1" }, new AbortController().signal);
  await client.placeDetails("place-1", new AbortController().signal);
  assert.equal(page.nextPageToken, "page-2");
  assert.deepEqual(requests[0]?.body, { textQuery: "restaurant", pageSize: 20, pageToken: "page-1" });
  assert.equal(requests[0]?.fieldMask, GOOGLE_PLACES_RESTAURANT_FIELD_MASK);
  assert.match(GOOGLE_PLACES_RESTAURANT_FIELD_MASK, /(^|,)nextPageToken(,|$)/);
  assert.equal(requests[1]?.fieldMask, GOOGLE_PLACES_DETAILS_FIELD_MASK);
  assert.doesNotMatch(GOOGLE_PLACES_DETAILS_FIELD_MASK, /nextPageToken/);
});

test("Google Places hard deadline rejects even when fetch ignores AbortSignal", { timeout: 2_000 }, async () => {
  const client = new GooglePlacesClient({
    apiKey: "test-key",
    timeoutMs: 5,
    fetchImplementation: (async () => new Promise<Response>(() => {})) as typeof fetch,
  });
  await assert.rejects(
    client.textSearch({ textQuery: "restaurant", pageSize: 1 }, new AbortController().signal),
    (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === "GOOGLE_TIMEOUT",
  );
});

test("Google Places deadline also bounds a response body that never resolves", { timeout: 2_000 }, async () => {
  const client = new GooglePlacesClient({
    apiKey: "test-key",
    timeoutMs: 5,
    fetchImplementation: (async () => ({ ok: true, json: async () => new Promise(() => {}) })) as unknown as typeof fetch,
  });
  await assert.rejects(
    client.textSearch({ textQuery: "restaurant", pageSize: 1 }, new AbortController().signal),
    (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === "GOOGLE_TIMEOUT",
  );
});

test("Google Places distinguishes service rate/permission responses from local request budgets", async () => {
  const rateLimited = new GooglePlacesClient({
    apiKey: "test-key",
    fetchImplementation: async () => new Response("", { status: 429 }),
  });
  await assert.rejects(
    rateLimited.textSearch({ textQuery: "restaurant", pageSize: 1 }, new AbortController().signal),
    (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === "GOOGLE_RATE_LIMITED",
  );
  const quotaOrPermission = new GooglePlacesClient({
    apiKey: "test-key",
    fetchImplementation: async () => new Response("", { status: 403 }),
  });
  await assert.rejects(
    quotaOrPermission.textSearch({ textQuery: "restaurant", pageSize: 1 }, new AbortController().signal),
    (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === "GOOGLE_SERVICE_QUOTA_OR_PERMISSION",
  );
});
