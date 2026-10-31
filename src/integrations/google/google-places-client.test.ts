import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { GooglePlacesClient } from "./google-places-client.js";
import { GOOGLE_PLACES_DETAILS_FIELD_MASK, GOOGLE_PLACES_RESTAURANT_FIELD_MASK } from "./google-places-contracts.js";

const japaneseNames = JSON.parse(readFileSync(new URL("./fixtures/japanese-place-names.json", import.meta.url), "utf8")) as Array<{
  id: string; displayName: { text: string; languageCode: string };
}>;

test("same-ID Japanese source names request only id and displayName with explicit ja", async () => {
  const requests: Array<{ url: URL; mask: string | undefined }> = [];
  const client = new GooglePlacesClient({ apiKey: "fixture", fetchImplementation: async (url, init) => {
    const u = new URL(String(url));
    requests.push({ url: u, mask: (init?.headers as Record<string, string>)["X-Goog-FieldMask"] });
    const raw = japaneseNames.find(row => u.pathname.endsWith(`/${row.id}`));
    assert.ok(raw);
    return new Response(JSON.stringify(raw));
  } });
  const readName = client.japaneseNamesForRun(new AbortController().signal);
  const names = [];
  for (const row of japaneseNames) {
    names.push(await readName(row.id));
  }
  assert.equal(requests.length, 3);
  for (const r of requests) {
    assert.equal(r.url.searchParams.get("languageCode"), "ja");
    assert.equal(r.mask, "id,displayName");
  }
  assert.deepEqual(names.map(row => [row.text, row.languageCode]), [["割烹 三長 渋谷", "ja"], ["T 中目黒", "ja"], ["渋谷 鮨墨", "ja"]]);
});

test("Japanese source name reader shares one request across sources in a run and isolates the next run", async () => {
  let calls = 0;
  const first = japaneseNames[0]!;
  const client = new GooglePlacesClient({ apiKey: "fixture", fetchImplementation: async () => {
    calls++;
    return new Response(JSON.stringify(first));
  } });
  const run = client.japaneseNamesForRun(new AbortController().signal);
  const [tabelog, tablecheck] = await Promise.all([run(first.id), run(`places/${first.id}`)]);
  assert.equal(calls, 1);
  assert.equal(tabelog, tablecheck);
  assert.ok(Object.isFrozen(tabelog));
  await client.japaneseNamesForRun(new AbortController().signal)(first.id);
  assert.equal(calls, 2);
});

test("Japanese source names fail closed on ID or text errors and preserve actual language without a retry", async () => {
  for (const raw of [{ id: "different", displayName: { text: "source text", languageCode: "ja" } },
    { id: "expected", displayName: { text: "  ", languageCode: "ja" } },
    { id: "expected", displayName: { text: "source text", languageCode: 9 } }, null]) {
    let calls = 0;
    const client = new GooglePlacesClient({ apiKey: "fixture", fetchImplementation: async () => { calls++; return new Response(JSON.stringify(raw)); } });
    const read = client.japaneseNamesForRun(new AbortController().signal);
    await assert.rejects(read("expected"), { code: "GOOGLE_MALFORMED_RESPONSE" });
    await assert.rejects(read("expected"), { code: "GOOGLE_MALFORMED_RESPONSE" });
    assert.equal(calls, 1);
  }
  for (const languageCode of ["en", undefined]) {
    const client = new GooglePlacesClient({ apiKey: "fixture", fetchImplementation: async () => new Response(JSON.stringify({ id: "expected", displayName: { text: "  Actual source text  ", languageCode } })) });
    const result = await client.japaneseNamesForRun(new AbortController().signal)("expected");
    assert.equal(result.text, "  Actual source text  ");
    assert.equal(result.languageCode, languageCode ?? null);
  }
  let calls = 0;
  const controller = new AbortController(); controller.abort();
  const client = new GooglePlacesClient({ apiKey: "fixture", fetchImplementation: async () => { calls++; throw new Error("must not fetch"); } });
  await assert.rejects(client.japaneseNamesForRun(controller.signal)("expected"), { code: "GOOGLE_NETWORK_FAILED" });
  assert.equal(calls, 0);
});

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

test("reverse address observation is one minimal public GET with credentials only in headers", async () => {
  const client = new GooglePlacesClient({ apiKey: "fixture", fetchImplementation: async (url, init) => {
    assert.equal(String(url), "https://geocode.googleapis.com/v4/geocode/location?location.latitude=1&location.longitude=2");
    assert.equal(init?.method, "GET");
    assert.equal((init?.headers as Record<string, string>)["X-Goog-FieldMask"], "results.addressComponents");
    return new Response(JSON.stringify({ results: [{ addressComponents: [{ longText: "Observed district", types: ["sublocality"] }], location: { latitude: 4, longitude: 5 } }] }), { status: 200 });
  } });
  assert.deepEqual(await client.reverseAddress({ latitude: 1, longitude: 2 }, new AbortController().signal), { addressComponents: [{ longText: "Observed district", types: ["sublocality"] }] });
});
