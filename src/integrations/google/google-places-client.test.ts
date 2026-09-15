import assert from "node:assert/strict";
import { test } from "node:test";

import { GooglePlacesClient } from "./google-places-client.js";

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
