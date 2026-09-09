export type BrowserRuntimeProvider = "CLOUDFLARE_BROWSER_RUN" | "LOCAL_PLAYWRIGHT_CHROMIUM";
export type BrowserEngine = "KITESURF" | "CHROMIUM";
export type BrowserEngineMode = "AUTO" | "KITESURF_ONLY" | "CHROMIUM_ONLY";

export interface BrowserSnapshot {
  url: string;
  html: string;
  text: string;
  title: string;
}

/**
 * A browser-produced, short-lived reference to a currently visible control.
 * `id` is opaque to the model and is resolved only by the session that observed it.
 */
export interface BrowserPageControl {
  id: string;
  stableKey: string;
  kind: "LINK" | "BUTTON" | "INPUT" | "SELECT";
  role: string;
  label: string;
  value?: string;
  href?: string;
  /** Browser-observed structural facts, never a page assertion of safety. */
  formMethod?: "GET" | "POST" | "UNKNOWN";
  type?: string;
  disabled: boolean;
  visible: boolean;
  selected?: boolean;
}

export interface BrowserSessionMetadata {
  runtimeProvider: BrowserRuntimeProvider;
  engine: BrowserEngine;
  /** Opaque local/remote browser-session identifier; never a cookie or credential. */
  sessionId?: string;
  startedAt: string;
}

export interface BrowserSession {
  readonly metadata: BrowserSessionMetadata;
  navigate(url: string, options?: { waitUntil?: "domcontentloaded" | "load"; timeoutMs?: number }): Promise<void>;
  snapshot(): Promise<BrowserSnapshot>;
  /** Inspect visible DOM controls and their accessibility-facing names without executing page-provided code. */
  observeControls?(): Promise<BrowserPageControl[]>;
  click(target: string): Promise<void>;
  fill(target: string, value: string): Promise<void>;
  /** Returns the values the remote browser reports as selected. */
  select(target: string, value: string): Promise<string[]>;
  waitFor(target: string, timeoutMs?: number): Promise<void>;
  /** Wait only until the user-visible page state changes; returns false on the bounded timeout. */
  waitForChange?(previous: Pick<BrowserSnapshot, "url" | "title" | "text">, timeoutMs?: number): Promise<boolean>;
  screenshot(): Promise<Uint8Array>;
  close(): Promise<void>;
}

export interface BrowserRuntime {
  openSession(input: { signal: AbortSignal; engineMode?: BrowserEngineMode }): Promise<BrowserSession>;
}
