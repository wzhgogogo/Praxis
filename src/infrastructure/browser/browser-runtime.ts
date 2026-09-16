export type BrowserRuntimeProvider = "CLOUDFLARE_BROWSER_RUN" | "LOCAL_PLAYWRIGHT_CHROMIUM";
export type BrowserEngine = "KITESURF" | "CHROMIUM";
export type BrowserEngineMode = "AUTO" | "KITESURF_ONLY" | "CHROMIUM_ONLY";

export interface BrowserResponseRule { origin: string; pathname: string; }
export interface BrowserCapturedResponse {
  url: string;
  status: number;
  observedAt: string;
  sequence: number;
  body: unknown;
}

export interface BrowserSnapshot {
  url: string;
  html: string;
  text: string;
  title: string;
  /** Opaque, session-local page identity. It changes only when an observed link opens a new page. */
  pageId?: string;
  /** Source-allowlisted passive GET responses; never model-supplied evidence. */
  responses?: BrowserCapturedResponse[];
}

/** Code-owned descriptions of nonstandard source controls. Never accepted from a model. */
export interface BrowserControlHint {
  selector: string;
  labelPrefix: string;
  value: "TEXT" | "DATE_PARTS";
  selectedClass: string;
  /** Source has observed a navigation/write boundary; keep as evidence only. */
  observationOnly?: boolean;
}

/**
 * A browser-produced, short-lived reference to a currently visible control.
 * `id` is opaque to the model and is resolved only by the session that observed it.
 */
export interface BrowserPageControl {
  id: string;
  stableKey: string;
  kind: "LINK" | "BUTTON" | "INPUT" | "SELECT" | "CHECKBOX" | "RANGE" | "REGION";
  role: string;
  label: string;
  value?: string;
  href?: string;
  /** Browser-observed structural facts, never a page assertion of safety. */
  formMethod?: "GET" | "POST" | "UNKNOWN";
  /** Observed structure for source-owned control contracts; never a permission itself. */
  structure?: { tag: string; name: string; classes: string[]; dialogLabel: string; formClass: string; sliderCount: number };
  type?: string;
  disabled: boolean;
  visible: boolean;
  selected?: boolean;
  expanded?: boolean;
  /** A checkbox's current state is distinct from whether it is an available option. */
  checked?: boolean;
  /** Bounded slider facts are observed state, never model-provided values. */
  min?: string;
  max?: string;
  /** Accessibility-facing display text (for example a currency), distinct from slider positions. */
  valueText?: string;
  scrollable?: boolean;
  scrollTop?: number;
  /** An active modal may leave background controls visible but not safely operable. */
  blockedByActiveLayer?: boolean;
  observationOnly?: boolean;
  /** Select options remain distinct from the control's current value. */
  options?: Array<{ value: string; label: string; selected: boolean; disabled: boolean }>;
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
  captureResponses?(rules: readonly BrowserResponseRule[]): Promise<void>;
  /** Inspect visible DOM controls and their accessibility-facing names without executing page-provided code. */
  observeControls?(hints?: readonly BrowserControlHint[]): Promise<BrowserPageControl[]>;
  click(target: string): Promise<void>;
  /** Opens one already-observed public link. A target=_blank link remains in this session but becomes the active page. */
  openLink?(target: string): Promise<void>;
  fill(target: string, value: string): Promise<void>;
  /** Returns the values the remote browser reports as selected. */
  select(target: string, value: string): Promise<string[]>;
  /** Optional read-only query controls. Unsupported runtimes fail closed in the Executor. */
  setChecked?(target: string, checked: boolean): Promise<void>;
  press?(target: string, key: "ArrowLeft" | "ArrowRight"): Promise<void>;
  scroll?(target: string, deltaY: number): Promise<void>;
  waitFor(target: string, timeoutMs?: number): Promise<void>;
  /** Wait only until the user-visible page state changes; returns false on the bounded timeout. */
  waitForChange?(previous: Pick<BrowserSnapshot, "url" | "title" | "text">, timeoutMs?: number): Promise<boolean>;
  screenshot(): Promise<Uint8Array>;
  close(): Promise<void>;
}

export interface BrowserRuntime {
  openSession(input: { signal: AbortSignal; engineMode?: BrowserEngineMode }): Promise<BrowserSession>;
}
