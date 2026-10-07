import { connect as connectSocket } from "node:net";
import { resolve } from "node:path";

import { ProxyAgent } from "undici";

import { diagnosticFailureCode, diagnosticUrl, startDiagnosticRun } from "../../shared/diagnostic-run.js";

export const LIVE_PREFLIGHT_VERSION = "live-network-preflight@1";

export type LivePreflightTarget = "DEEPSEEK" | "GOOGLE" | "TABELOG" | "TABLECHECK";
export type LivePreflightRunner =
  | "HYBRID_LIVE_READ"
  | "BROWSER_CASE_SLICE"
  | "BROWSER_READ_PROBE"
  | "NATIVE_FIXED_SOURCE_MODEL"
  | "FIXED_SOURCE_MODEL"
  | "SOURCE_STAGE_PROBE";

export type EffectiveLiveNetworkConfiguration = Readonly<{
  proxyMode: "ENVIRONMENT" | "DISABLED_BY_CLI";
  googleProxyServer?: string;
  browserProxyServer?: string;
}>;

export type LivePreflightPlan = Readonly<{
  runner: LivePreflightRunner;
  targets: readonly LivePreflightTarget[];
  network: EffectiveLiveNetworkConfiguration;
  timeoutMs?: number;
}>;

export type LivePreflightAttempt = Readonly<{
  target: LivePreflightTarget | "GOOGLE_PROXY" | "BROWSER_PROXY";
  request: Readonly<{ method: "GET" | "TCP_CONNECT"; url: string; range: "BYTES_0_0" | "NONE"; authorization: "PRESENT" | "ABSENT" }>;
  elapsedMs: number;
  outcome: "REACHABLE" | "FAILED";
  status?: number;
  tls: "ESTABLISHED" | "NOT_ESTABLISHED" | "NOT_CHECKED";
  failureCode?: string;
}>;

export type LivePreflightNetworkRecord = Readonly<{
  proxyMode: "ENVIRONMENT" | "DISABLED_BY_CLI";
  googleProxyConfigured: boolean;
  browserProxyConfigured: boolean;
}>;

export type LivePreflightResult = Readonly<{
  artifactPath: string;
  attempts: readonly LivePreflightAttempt[];
  elapsedMs: number;
  configuration: LivePreflightNetworkRecord;
}>;

export class LivePreflightError extends Error {
  readonly code: string;
  readonly artifactPath: string;

  constructor(code: string, artifactPath: string) {
    super(code);
    this.name = "LivePreflightError";
    this.code = code;
    this.artifactPath = artifactPath;
  }
}

export type LivePreflightDependencies = Readonly<{
  fetchImplementation?: typeof fetch;
  connectProxy?: (origin: string, timeoutMs: number) => Promise<void>;
  now?: () => number;
  artifactDirectory?: string;
}>;

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Resolves CLI proxy opt-out once, so the runner and preflight use identical transport settings. */
export function resolveEffectiveLiveNetworkConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
  argv: readonly string[] = process.argv,
): EffectiveLiveNetworkConfiguration {
  const noProxy = argv.includes("--no-proxy");
  const googleProxyServer = noProxy ? undefined : nonEmpty(environment.PRAXIS_GOOGLE_API_PROXY_SERVER);
  const browserProxyServer = noProxy ? undefined : nonEmpty(environment.PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER);
  return {
    proxyMode: noProxy ? "DISABLED_BY_CLI" : "ENVIRONMENT",
    ...(googleProxyServer ? { googleProxyServer } : {}),
    ...(browserProxyServer ? { browserProxyServer } : {}),
  };
}

/** Never mutates process.env or .env; this is the exact environment passed to the actual runner factories. */
export function environmentWithEffectiveLiveNetwork(
  environment: NodeJS.ProcessEnv,
  configuration: EffectiveLiveNetworkConfiguration,
): NodeJS.ProcessEnv {
  return {
    ...environment,
    PRAXIS_GOOGLE_API_PROXY_SERVER: configuration.googleProxyServer ?? "",
    PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER: configuration.browserProxyServer ?? "",
  };
}

function safeProxyOrigin(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw Object.assign(new Error("Unsupported proxy protocol"), { code: "PREFLIGHT_PROXY_CONFIGURATION" });
  const port = Number(url.port || (url.protocol === "https:" ? 443 : 80));
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) throw Object.assign(new Error("Invalid proxy port"), { code: "PREFLIGHT_PROXY_CONFIGURATION" });
  url.username = "";
  url.password = "";
  url.pathname = "";
  url.search = "";
  url.hash = "";
  return url.toString();
}

function stableCauseCode(error: unknown): string | undefined {
  let current = error;
  for (let depth = 0; depth < 4 && typeof current === "object" && current !== null; depth += 1) {
    const record = current as Record<string, unknown>;
    if (typeof record.code === "string" && /^[A-Z][A-Z0-9_]{0,63}$/.test(record.code)) return record.code;
    current = record.cause;
  }
  return undefined;
}

function proxyFailureCode(error: unknown): string {
  const code = stableCauseCode(error) ?? diagnosticFailureCode(error);
  if (code === "PREFLIGHT_PROXY_CONFIGURATION") return code;
  if (code === "ECONNREFUSED") return "PREFLIGHT_PROXY_CONNECTION_REFUSED";
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") return "PREFLIGHT_PROXY_DNS_UNREACHABLE";
  if (code.startsWith("CERT_") || code.startsWith("ERR_TLS") || code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") return "PREFLIGHT_PROXY_TLS_FAILED";
  if (code === "ETIMEDOUT" || code === "UND_ERR_CONNECT_TIMEOUT") return "PREFLIGHT_PROXY_TIMEOUT";
  if (code === "EPERM") return "PREFLIGHT_PROXY_CONNECT_BLOCKED";
  return "PREFLIGHT_PROXY_UNREACHABLE";
}

function endpointFailureCode(error: unknown, timedOut: boolean): string {
  if (timedOut) return "PREFLIGHT_TIMEOUT";
  const code = stableCauseCode(error) ?? diagnosticFailureCode(error);
  if (code === "PREFLIGHT_DEEPSEEK_CONFIGURATION") return code;
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") return "PREFLIGHT_DNS_UNREACHABLE";
  if (code === "ECONNREFUSED") return "PREFLIGHT_CONNECTION_REFUSED";
  if (code.startsWith("CERT_") || code.startsWith("ERR_TLS") || code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") return "PREFLIGHT_TLS_FAILED";
  if (code === "ETIMEDOUT" || code === "UND_ERR_CONNECT_TIMEOUT" || code === "ABORT_ERR") return "PREFLIGHT_TIMEOUT";
  return "PREFLIGHT_NETWORK_FAILED";
}

async function defaultConnectProxy(origin: string, timeoutMs: number): Promise<void> {
  const url = new URL(origin);
  const port = Number(url.port || (url.protocol === "https:" ? 443 : 80));
  await new Promise<void>((resolveConnection, rejectConnection) => {
    const socket = connectSocket({ host: url.hostname, port });
    const timeout = setTimeout(() => socket.destroy(Object.assign(new Error("Proxy connection timed out"), { code: "ETIMEDOUT" })), timeoutMs);
    socket.once("connect", () => {
      clearTimeout(timeout);
      socket.end();
      resolveConnection();
    });
    socket.once("error", (error) => {
      clearTimeout(timeout);
      rejectConnection(error);
    });
  });
}

function endpoint(target: LivePreflightTarget): Readonly<{ url: string; range: "BYTES_0_0" | "NONE"; authorization: "PRESENT" | "ABSENT" }> {
  switch (target) {
    case "DEEPSEEK": return { url: "https://api.deepseek.com/models", range: "NONE", authorization: "PRESENT" };
    // Deliberately does not call a Places endpoint or attach an API key: this only checks HTTPS reachability.
    case "GOOGLE": return { url: "https://places.googleapis.com/", range: "NONE", authorization: "ABSENT" };
    case "TABELOG": return { url: "https://tabelog.com/", range: "BYTES_0_0", authorization: "ABSENT" };
    case "TABLECHECK": return { url: "https://www.tablecheck.com/en/", range: "BYTES_0_0", authorization: "ABSENT" };
  }
}

function uniqueTargets(targets: readonly LivePreflightTarget[]): readonly LivePreflightTarget[] {
  const unique = [...new Set(targets)];
  if (unique.length === 0) throw new Error("Live preflight requires at least one target");
  return unique;
}

function boundedTimeout(timeoutMs: number | undefined): number {
  const value = timeoutMs ?? 10_000;
  if (!Number.isSafeInteger(value) || value < 100 || value > 60_000) throw new Error("Live preflight timeout must be 100..60000ms");
  return value;
}

function proxyForTarget(target: LivePreflightTarget, network: EffectiveLiveNetworkConfiguration): string | undefined {
  return target === "GOOGLE" ? network.googleProxyServer : target === "TABELOG" || target === "TABLECHECK" ? network.browserProxyServer : undefined;
}

function safeNetworkRecord(network: EffectiveLiveNetworkConfiguration): LivePreflightNetworkRecord {
  return {
    proxyMode: network.proxyMode,
    googleProxyConfigured: network.googleProxyServer !== undefined,
    browserProxyConfigured: network.browserProxyServer !== undefined,
  };
}

function safeProxyOriginForRecord(value: string): string {
  try { return safeProxyOrigin(value); } catch { return "INVALID_PROXY_CONFIGURATION"; }
}

function requestHeaders(target: LivePreflightTarget, environment: NodeJS.ProcessEnv): HeadersInit {
  const headers: Record<string, string> = {};
  if (target === "TABELOG" || target === "TABLECHECK") headers.Range = "bytes=0-0";
  if (target === "DEEPSEEK") {
    const key = nonEmpty(environment.DEEPSEEK_API_KEY);
    if (!key) throw Object.assign(new Error("DEEPSEEK_API_KEY is required for preflight"), { code: "PREFLIGHT_DEEPSEEK_CONFIGURATION" });
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}

function statusIsReachable(target: LivePreflightTarget, status: number): boolean {
  // Google has no API key in this probe, so an HTTP response only proves HTTPS reachability.
  if (target === "GOOGLE") return status >= 100 && status <= 599;
  return status >= 200 && status < 300;
}

function requestInit(target: LivePreflightTarget, environment: NodeJS.ProcessEnv, signal: AbortSignal): RequestInit {
  return { method: "GET", headers: requestHeaders(target, environment), signal };
}

async function closeDispatcher(dispatcher: ProxyAgent | undefined): Promise<void> {
  try { await dispatcher?.close(); } catch { /* diagnostics must retain the observed endpoint result */ }
}

async function cancelBody(response: Response): Promise<void> {
  try { await response.body?.cancel(); } catch { /* TTFB was already observed; body cancellation is cleanup only. */ }
}

/**
 * Writes an immutable network-only diagnostic before any model gateway, Task, Google search, or browser session starts.
 * It records endpoint shape and stable failure codes only; no keys, cookies, request values, or provider error text leave this boundary.
 */
export async function runLivePreflight(
  plan: LivePreflightPlan,
  environment: NodeJS.ProcessEnv = process.env,
  dependencies: LivePreflightDependencies = {},
): Promise<LivePreflightResult> {
  const targets = uniqueTargets(plan.targets);
  const timeoutMs = boundedTimeout(plan.timeoutMs);
  const now = dependencies.now ?? Date.now;
  const fetchImplementation = dependencies.fetchImplementation ?? fetch;
  const connectProxy = dependencies.connectProxy ?? defaultConnectProxy;
  const journal = await startDiagnosticRun(dependencies.artifactDirectory ?? resolve(".eval-artifacts", "live-preflight"), {
    mode: "LIVE_NETWORK_PREFLIGHT",
    preflightVersion: LIVE_PREFLIGHT_VERSION,
    runner: plan.runner,
    plannedTargets: targets,
    timeoutMs,
    generationModelCalls: 0,
    restaurantDiscoveryRequests: 0,
    evaluator: { applicability: "NOT_APPLICABLE", reason: "NETWORK_ONLY_DIAGNOSTIC_HAS_NO_RESTAURANT_CLAIM" },
    network: {
      proxyMode: plan.network.proxyMode,
      ...(plan.network.googleProxyServer ? { googleProxy: safeProxyOriginForRecord(plan.network.googleProxyServer) } : {}),
      ...(plan.network.browserProxyServer ? { browserProxy: safeProxyOriginForRecord(plan.network.browserProxyServer) } : {}),
    },
  });
  const startedAt = now();
  const attempts: LivePreflightAttempt[] = [];
  const checkedProxies = new Set<string>();
  try {
    const configuredProxies: ReadonlyArray<readonly ["GOOGLE_PROXY" | "BROWSER_PROXY", string | undefined]> = [
      ...(targets.includes("GOOGLE") ? [["GOOGLE_PROXY", plan.network.googleProxyServer] as const] : []),
      ...(targets.some(target => target === "TABELOG" || target === "TABLECHECK") ? [["BROWSER_PROXY", plan.network.browserProxyServer] as const] : []),
    ];
    for (const [label, proxy] of configuredProxies) {
      if (!proxy || checkedProxies.has(proxy)) continue;
      checkedProxies.add(proxy);
      const origin = safeProxyOrigin(proxy);
      const attemptStartedAt = now();
      try {
        await connectProxy(origin, timeoutMs);
        attempts.push({ target: label, request: { method: "TCP_CONNECT", url: origin, range: "NONE", authorization: "ABSENT" }, elapsedMs: now() - attemptStartedAt, outcome: "REACHABLE", tls: "NOT_CHECKED" });
      } catch (error) {
        const failureCode = proxyFailureCode(error);
        attempts.push({ target: label, request: { method: "TCP_CONNECT", url: origin, range: "NONE", authorization: "ABSENT" }, elapsedMs: now() - attemptStartedAt, outcome: "FAILED", tls: "NOT_CHECKED", failureCode });
        throw Object.assign(new Error(failureCode), { code: failureCode });
      }
    }
    for (const target of targets) {
      const entry = endpoint(target);
      const attemptStartedAt = now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const proxy = proxyForTarget(target, plan.network);
      const dispatcher = proxy ? new ProxyAgent(proxy) : undefined;
      try {
        const response = await fetchImplementation(entry.url, {
          ...requestInit(target, environment, controller.signal),
          ...(dispatcher ? { dispatcher } : {}),
        } as RequestInit);
        const elapsedMs = now() - attemptStartedAt;
        await cancelBody(response);
        if (!statusIsReachable(target, response.status)) {
          const failureCode = target === "DEEPSEEK" ? "PREFLIGHT_DEEPSEEK_ACCESS_FAILED" : target === "GOOGLE" ? "PREFLIGHT_GOOGLE_TRANSPORT_REJECTED" : "PREFLIGHT_PUBLIC_ENDPOINT_REJECTED";
          attempts.push({ target, request: { method: "GET", url: diagnosticUrl(entry.url), range: entry.range, authorization: entry.authorization }, elapsedMs, outcome: "FAILED", status: response.status, tls: "ESTABLISHED", failureCode });
          throw Object.assign(new Error(failureCode), { code: failureCode });
        }
        attempts.push({ target, request: { method: "GET", url: diagnosticUrl(entry.url), range: entry.range, authorization: entry.authorization }, elapsedMs, outcome: "REACHABLE", status: response.status, tls: "ESTABLISHED" });
      } catch (error) {
        if (attempts.at(-1)?.target === target && attempts.at(-1)?.outcome === "FAILED") throw error;
        const failureCode = endpointFailureCode(error, controller.signal.aborted);
        attempts.push({ target, request: { method: "GET", url: diagnosticUrl(entry.url), range: entry.range, authorization: entry.authorization }, elapsedMs: now() - attemptStartedAt, outcome: "FAILED", tls: "NOT_ESTABLISHED", failureCode });
        throw Object.assign(new Error(failureCode), { code: failureCode });
      } finally {
        clearTimeout(timer);
        await closeDispatcher(dispatcher);
      }
    }
    const result = { artifactPath: journal.resultPath, attempts, elapsedMs: now() - startedAt, configuration: safeNetworkRecord(plan.network) } as const;
    await journal.finish({ status: "SUCCEEDED", stage: "NETWORK_READINESS", ...result });
    return result;
  } catch (error) {
    const code = diagnosticFailureCode(error);
    await journal.finish({ status: "FAILED", stage: "NETWORK_READINESS", failureCode: code, attempts, elapsedMs: now() - startedAt,
      configuration: safeNetworkRecord(plan.network), generationModelCalls: 0, restaurantDiscoveryRequests: 0 });
    throw new LivePreflightError(code, journal.resultPath);
  }
}
