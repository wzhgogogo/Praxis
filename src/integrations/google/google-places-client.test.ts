import assert from "node:assert/strict";
import { test } from "node:test";

import { GooglePlacesClient } from "./google-places-client.js";

test("Google Places hard deadline rejects even when fetch ignores AbortSignal", async () => {
  const client = new GooglePlacesClient({
    apiKey: "test-key",
    timeoutMs: 5,
    fetchImplementation: (async () => new Promise<Response>(() => {})) as typeof fetch,
  });
  const startedAt = Date.now();
  await assert.rejects(
    client.textSearch({ textQuery: "restaurant", pageSize: 1 }, new AbortController().signal),
    (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === "GOOGLE_TIMEOUT",
  );
  assert.ok(Date.now() - startedAt < 250, "the deadline must not wait for a non-cooperative fetch implementation");
});

test("Google Places deadline also bounds a response body that never resolves", async () => {
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
