import assert from "node:assert/strict";
import { createServer } from "node:http";
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

test("Google Nearby Search sends only the pack-selected type and exact planner circle", async () => {
  let request: { url: string; body: Record<string, unknown>; mask?: string } | undefined;
  const client = new GooglePlacesClient({ apiKey: "test-key", fetchImplementation: async (url, init) => {
    const mask = (init?.headers as Record<string, string>)["X-Goog-FieldMask"];
    request = { url: String(url), body: JSON.parse(String(init?.body)) as Record<string, unknown>, ...(mask ? { mask } : {}) };
    return new Response(JSON.stringify({ places: [{ id: "place-1" }] }), { status: 200 });
  } });
  const places = await client.nearbySearch({ includedTypes: ["restaurant"], location: { latitude: 35.6697, longitude: 139.767, radiusMeters: 3_000 }, maxResultCount: 20 }, new AbortController().signal);
  assert.equal(request?.url, "https://places.googleapis.com/v1/places:searchNearby");
  assert.deepEqual(request?.body, { includedTypes: ["restaurant"], maxResultCount: 20, locationRestriction: { circle: { center: { latitude: 35.6697, longitude: 139.767 }, radius: 3_000 } } });
  assert.doesNotMatch(request?.mask ?? "", /nextPageToken/);
  assert.equal(places.length, 1);
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

test("Google Places sends its API request through its own configured proxy", { timeout: 5_000 }, async () => {
  const targets: string[] = [];
  const proxy = createServer();
  proxy.on("connect", (request, socket) => {
    targets.push(request.url ?? "");
    socket.end("HTTP/1.1 502 Bad Gateway\r\nContent-Length: 0\r\n\r\n");
  });
  await new Promise<void>((resolve) => proxy.listen(0, "127.0.0.1", resolve));
  try {
    const address = proxy.address();
    assert.ok(address && typeof address !== "string");
    const client = new GooglePlacesClient({
      apiKey: "test-key",
      proxyServer: `http://127.0.0.1:${address.port}`,
      timeoutMs: 1_000,
    });
    await assert.rejects(
      client.textSearch({ textQuery: "Shibuya", pageSize: 1 }, new AbortController().signal),
      (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === "GOOGLE_NETWORK_FAILED",
    );
    assert.deepEqual(targets, ["places.googleapis.com:443"]);
  } finally {
    proxy.closeAllConnections();
    await new Promise<void>((resolve) => proxy.close(() => resolve()));
  }
});
