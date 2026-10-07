import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  environmentWithEffectiveLiveNetwork,
  LivePreflightError,
  resolveEffectiveLiveNetworkConfiguration,
  runLivePreflight,
} from "./live-preflight.js";

async function artifactDirectory(): Promise<string> {
  return mkdtemp(join(tmpdir(), "praxis-live-preflight-"));
}

const environment = { DEEPSEEK_API_KEY: "test-only-key" } as NodeJS.ProcessEnv;
const execFileAsync = promisify(execFile);

async function withArtifacts(run: (directory: string) => Promise<void>): Promise<void> {
  const directory = await artifactDirectory();
  try {
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("live preflight records only public endpoint shape and permits the actual hybrid dependencies", async () => {
  await withArtifacts(async (directory) => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const result = await runLivePreflight({
      runner: "HYBRID_LIVE_READ", targets: ["DEEPSEEK", "GOOGLE", "TABELOG", "TABLECHECK"],
      network: { proxyMode: "ENVIRONMENT" }, timeoutMs: 1_000,
    }, environment, {
      artifactDirectory: directory,
      fetchImplementation: async (url, init) => {
        requests.push({ url: String(url), ...(init ? { init } : {}) });
        return new Response("", { status: 200 });
      },
      now: (() => { let tick = 0; return () => ++tick; })(),
    });

    assert.equal(result.attempts.length, 4);
    assert.deepEqual(requests.map(request => request.url), [
      "https://api.deepseek.com/models", "https://places.googleapis.com/", "https://tabelog.com/", "https://www.tablecheck.com/en/",
    ]);
    assert.equal(new Headers(requests[0]?.init?.headers).has("authorization"), true);
    assert.equal(new Headers(requests[2]?.init?.headers).get("range"), "bytes=0-0");
    assert.equal(new Headers(requests[3]?.init?.headers).get("range"), "bytes=0-0");
    const artifact = JSON.parse(await readFile(result.artifactPath, "utf8")) as Record<string, unknown>;
    assert.equal(artifact.generationModelCalls, 0);
    assert.equal(artifact.restaurantDiscoveryRequests, 0);
    assert.equal(JSON.stringify(artifact).includes("test-only-key"), false);
  });
});

test("configured proxy refusal finishes a preflight artifact before any endpoint request", async () => {
  await withArtifacts(async (directory) => {
    let fetchCalls = 0;
    await assert.rejects(
      runLivePreflight({
        runner: "HYBRID_LIVE_READ", targets: ["GOOGLE", "DEEPSEEK"],
        network: { proxyMode: "ENVIRONMENT", googleProxyServer: "http://user:secret@127.0.0.1:10808" }, timeoutMs: 1_000,
      }, environment, {
        artifactDirectory: directory,
        fetchImplementation: async () => { fetchCalls += 1; return new Response("", { status: 200 }); },
        connectProxy: async () => { throw Object.assign(new Error("refused"), { code: "ECONNREFUSED" }); },
      }),
      (error: unknown) => error instanceof LivePreflightError && error.code === "PREFLIGHT_PROXY_CONNECTION_REFUSED",
    );
    assert.equal(fetchCalls, 0);
    const results = await readdir(directory);
    const resultPath = join(directory, results.find(path => path.endsWith(".result.json"))!);
    const artifact = await readFile(resultPath, "utf8");
    assert.equal(artifact.includes("secret"), false);
    const parsed = JSON.parse(artifact) as { attempts: Array<{ request: { method: string }; tls: string }> };
    assert.equal(parsed.attempts[0]?.request.method, "TCP_CONNECT");
    assert.equal(parsed.attempts[0]?.tls, "NOT_CHECKED");
  });
});

test("no-proxy resolves a copied environment and never probes an inherited 10808 proxy", async () => {
  await withArtifacts(async (directory) => {
    const configuration = resolveEffectiveLiveNetworkConfiguration({
      ...environment,
      PRAXIS_GOOGLE_API_PROXY_SERVER: "http://127.0.0.1:10808",
      PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER: "http://127.0.0.1:10808",
    }, ["node", "runner", "--no-proxy"]);
    assert.deepEqual(configuration, { proxyMode: "DISABLED_BY_CLI" });
    const effective = environmentWithEffectiveLiveNetwork(environment, configuration);
    assert.equal(effective.PRAXIS_GOOGLE_API_PROXY_SERVER, "");
    assert.equal(effective.PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER, "");
    let proxyConnections = 0;
    await runLivePreflight({ runner: "BROWSER_READ_PROBE", targets: ["TABELOG"], network: configuration, timeoutMs: 1_000 }, effective, {
      artifactDirectory: directory,
      fetchImplementation: async () => new Response("", { status: 200 }),
      connectProxy: async () => { proxyConnections += 1; },
    });
    assert.equal(proxyConnections, 0);
  });
});

test("a fixed-source model run ignores browser and Google proxies it does not use", async () => {
  await withArtifacts(async (directory) => {
    let proxyConnections = 0;
    await runLivePreflight({
      runner: "FIXED_SOURCE_MODEL", targets: ["DEEPSEEK"],
      network: { proxyMode: "ENVIRONMENT", googleProxyServer: "http://127.0.0.1:10808", browserProxyServer: "http://127.0.0.1:10809" }, timeoutMs: 1_000,
    }, environment, {
      artifactDirectory: directory,
      fetchImplementation: async () => new Response("", { status: 200 }),
      connectProxy: async () => { proxyConnections += 1; },
    });
    assert.equal(proxyConnections, 0);
  });
});

test("a failed preflight keeps downstream startup at zero", async () => {
  await withArtifacts(async (directory) => {
    let downstreamStarts = 0;
    const startAfterPreflight = async () => {
      await runLivePreflight({ runner: "FIXED_SOURCE_MODEL", targets: ["DEEPSEEK"], network: { proxyMode: "ENVIRONMENT" }, timeoutMs: 1_000 }, environment, {
        artifactDirectory: directory,
        fetchImplementation: async () => { throw Object.assign(new Error("dns"), { code: "ENOTFOUND" }); },
      });
      downstreamStarts += 1;
    };
    await assert.rejects(startAfterPreflight, (error: unknown) => error instanceof LivePreflightError && error.code === "PREFLIGHT_DNS_UNREACHABLE");
    assert.equal(downstreamStarts, 0);
  });
});

test("a nested transport cause is classified without recording its provider error", async () => {
  await withArtifacts(async (directory) => {
    const cause = Object.assign(new Error("dns transport failure"), { code: "ENOTFOUND" });
    await assert.rejects(
      runLivePreflight({ runner: "FIXED_SOURCE_MODEL", targets: ["DEEPSEEK"], network: { proxyMode: "ENVIRONMENT" }, timeoutMs: 1_000 }, environment, {
        artifactDirectory: directory,
        fetchImplementation: async () => { throw new TypeError("fetch failed", { cause }); },
      }),
      (error: unknown) => error instanceof LivePreflightError && error.code === "PREFLIGHT_DNS_UNREACHABLE",
    );
  });
});

test("an aborted endpoint probe is a timeout even when fetch reports DOM AbortError", async () => {
  await withArtifacts(async (directory) => {
    await assert.rejects(
      runLivePreflight({ runner: "FIXED_SOURCE_MODEL", targets: ["DEEPSEEK"], network: { proxyMode: "ENVIRONMENT" }, timeoutMs: 100 }, environment, {
        artifactDirectory: directory,
        fetchImplementation: async (_url, init) => new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal as AbortSignal;
          signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
        }),
      }),
      (error: unknown) => error instanceof LivePreflightError && error.code === "PREFLIGHT_TIMEOUT",
    );
  });
});

test("a missing DeepSeek key is a configuration error before any fetch", async () => {
  await withArtifacts(async (directory) => {
    let fetchCalls = 0;
    await assert.rejects(
      runLivePreflight({ runner: "FIXED_SOURCE_MODEL", targets: ["DEEPSEEK"], network: { proxyMode: "ENVIRONMENT" }, timeoutMs: 1_000 }, {}, {
        artifactDirectory: directory,
        fetchImplementation: async () => { fetchCalls += 1; return new Response("", { status: 200 }); },
      }),
      (error: unknown) => error instanceof LivePreflightError && error.code === "PREFLIGHT_DEEPSEEK_CONFIGURATION",
    );
    assert.equal(fetchCalls, 0);
  });
});

test("public source endpoints require a readable HTTP success response", async () => {
  for (const [target, status] of [["TABELOG", 503], ["TABLECHECK", 403]] as const) {
    await withArtifacts(async (directory) => {
      await assert.rejects(
        runLivePreflight({ runner: "BROWSER_READ_PROBE", targets: [target], network: { proxyMode: "ENVIRONMENT" }, timeoutMs: 1_000 }, environment, {
          artifactDirectory: directory,
          fetchImplementation: async () => new Response("unavailable", { status }),
        }),
        (error: unknown) => error instanceof LivePreflightError && error.code === "PREFLIGHT_PUBLIC_ENDPOINT_REJECTED",
      );
    });
  }
});

test("Google's unauthenticated root response proves only TLS transport while DeepSeek access still requires HTTP success", async () => {
  await withArtifacts(async (directory) => {
    const google = await runLivePreflight({ runner: "HYBRID_LIVE_READ", targets: ["GOOGLE"], network: { proxyMode: "ENVIRONMENT" }, timeoutMs: 1_000 }, environment, {
      artifactDirectory: directory,
      fetchImplementation: async () => new Response("missing key", { status: 404 }),
    });
    assert.deepEqual(google.attempts[0] && { outcome: google.attempts[0].outcome, status: google.attempts[0].status, tls: google.attempts[0].tls }, {
      outcome: "REACHABLE", status: 404, tls: "ESTABLISHED",
    });
    await assert.rejects(
      runLivePreflight({ runner: "FIXED_SOURCE_MODEL", targets: ["DEEPSEEK"], network: { proxyMode: "ENVIRONMENT" }, timeoutMs: 1_000 }, environment, {
        artifactDirectory: directory,
        fetchImplementation: async () => new Response("denied", { status: 403 }),
      }),
      (error: unknown) => error instanceof LivePreflightError && error.code === "PREFLIGHT_DEEPSEEK_ACCESS_FAILED",
    );
  });
});

test("preflight cancels an unread response body after observing headers", async () => {
  await withArtifacts(async (directory) => {
    let cancelled = false;
    const body = new ReadableStream({ cancel: () => { cancelled = true; } });
    await runLivePreflight({ runner: "BROWSER_READ_PROBE", targets: ["TABELOG"], network: { proxyMode: "ENVIRONMENT" }, timeoutMs: 1_000 }, environment, {
      artifactDirectory: directory,
      fetchImplementation: async () => new Response(body, { status: 200 }),
    });
    assert.equal(cancelled, true);
  });
});


test("the actual hybrid runner stops at its preflight gate before it creates a Live task", async () => {
  const directory = await artifactDirectory();
  try {
    const runner = resolve("src/eval/restaurant/agent-loop/runners/run-hybrid-live-read.ts");
    const loader = resolve("node_modules/tsx/dist/loader.mjs");
    await assert.rejects(
      execFileAsync(process.execPath, ["--import", loader, runner], {
        cwd: directory,
        env: {
          PATH: process.env.PATH,
          PRAXIS_ALLOW_LIVE_RESTAURANT_READ: "1",
          PRAXIS_ALLOW_BROWSER_RUN: "1",
          PRAXIS_ALLOW_LIVE_MODEL_EVAL: "1",
          PRAXIS_BROWSER_ENGINE: "LOCAL_CHROMIUM",
          DEEPSEEK_API_KEY: "test-only-key",
          GOOGLE_MAPS_API_KEY: "test-only-key",
          PRAXIS_GOOGLE_API_PROXY_SERVER: "http://127.0.0.1:0",
        },
      }),
      (error: unknown) => {
        const output = error as { stderr?: unknown };
        return typeof output.stderr === "string" && output.stderr.includes("PREFLIGHT_PROXY_CONFIGURATION");
      },
    );
    const preflightDirectory = join(directory, ".eval-artifacts", "live-preflight");
    const preflightRecords = await readdir(preflightDirectory);
    assert.equal(preflightRecords.some(path => path.endsWith(".result.json")), true);
    await assert.rejects(readdir(join(directory, ".eval-artifacts", "restaurant-hybrid-live-read")));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
