import type { BrowserReadNetworkObservation } from "./browser-runtime.js";

/** Bounded diagnostic projection: no stack, headers, body, or request query values. */
export interface BrowserTransportError {
  name: string;
  message: string;
  code?: string;
  cause?: BrowserTransportError;
}

export function browserTransportError(value: unknown, depth = 0, seen = new Set<unknown>()): BrowserTransportError {
  const item = value && typeof value === "object" ? value as { name?: unknown; message?: unknown; code?: unknown; cause?: unknown } : {};
  const firstLine = typeof item.message === "string" ? item.message.split(/[\r\n]/, 1)[0]! : "Unknown transport failure";
  const message = firstLine
    .replace(/https?:\/\/[^\s"'<>]+/gi, "[URL]")
    .replace(/(?:\?|&)[^\s"'<>]*/g, "[QUERY]")
    .replace(/\b(?:authorization|proxy-authorization|cookie|set-cookie|headers?|body|postData|payload|password|secret|token|api[_-]?key)\b\s*[:=].*/gi, "[REDACTED]")
    .replace(/\bBearer\s+\S+|\bsk-[A-Za-z0-9_-]{8,}/gi, "[REDACTED]")
    .slice(0, 360);
  seen.add(value);
  const cause = depth < 3 && item.cause !== undefined && !seen.has(item.cause) ? browserTransportError(item.cause, depth + 1, seen) : undefined;
  return { name: typeof item.name === "string" && /^[A-Za-z][A-Za-z0-9_.]{0,63}$/.test(item.name) ? item.name : "Error", message,
    ...(typeof item.code === "string" && /^(?:E[A-Z0-9_]{1,50}|ERR_[A-Z0-9_]{1,50})$/.test(item.code) ? { code: item.code } : {}),
    ...(cause ? { cause } : {}) };
}

export type BrowserRuntimeFailureCode =
  | "BROWSER_TIMEOUT"
  /** No navigation dispatched because its remaining browser window is too small. */
  | "BROWSER_BUDGET_EXHAUSTED"
  /** Operations reached their bounded count before an elapsed deadline. */
  | "BROWSER_OPERATION_BUDGET_EXCEEDED"
  | "BROWSER_RUNTIME_FAILED"
  | "BROWSER_STALE_TARGET"
  /** The runtime could not start; this is distinct from a provider-local page operation failure. */
  | "BROWSER_RUNTIME_UNAVAILABLE"
  | "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED"
  | "BROWSER_CANDIDATE_MODEL_BUDGET_EXCEEDED"
  | "BOT_CHALLENGE"
  | "UNEXPECTED_PAGE"
  | "EXTRACTION_FAILED"
  | "BROWSER_ABORTED";

/** The smallest deadline attribution that an artifact may rely on. */
export type BrowserDeadlineScope = "RUN" | "CANDIDATE" | "PROVIDER";

export class BrowserRuntimeError extends Error {
  constructor(
    readonly code: BrowserRuntimeFailureCode,
    message: string,
    readonly cause?: unknown,
    /** Present for executor-owned deadline exhaustion; never inferred from another provider's error. */
    readonly scope?: BrowserDeadlineScope,
    /** Installed Guard failures, diagnostics only; never admission authority. */
    readonly networkFailures?: BrowserReadNetworkObservation[],
  ) {
    super(message);
    this.name = "BrowserRuntimeError";
  }
}
