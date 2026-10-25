import { link, readFile, unlink, writeFile } from "node:fs/promises";
import { ProxyAgent } from "undici";
import { GooglePlacesClient, type GooglePlacesClientOptions } from "../../../../integrations/google/google-places-client.js";
import { GooglePlacesError } from "../../../../integrations/google/google-places-contracts.js";

type Rejection = { reason: string; stage: "RESPONSE" | "BEFORE_WRITE" | "AFTER_WRITE"; origin?: string; pathname?: string };
const keyPattern = /(?:\bAIza[0-9A-Za-z_-]{30,}|\bsk-[A-Za-z0-9_-]{16,}|\bAKIA[A-Z0-9]{16}|\bBearer\s+[A-Za-z0-9._~-]{8,}|-----BEGIN (?:RSA )?PRIVATE KEY-----)/;
const keyField = /^(?:key|api[_-]?key|x-goog-api-key|access[_-]?token|token|authorization|cookie|session[_-]?id|secret|password|private[_-]?key)$/i;
function googleEndpoint(url: URL) {
  return url.protocol === "https:" && !url.username && !url.password &&
    (url.origin === "https://places.googleapis.com" && /^\/v1\/places(?::searchText|:searchNearby|\/[^/]+)?$/.test(url.pathname)
      || url.origin === "https://geocode.googleapis.com" && url.pathname === "/v4/geocode/location");
}

/** Eval-owned raw Google JSON capture. Secrets never enter recorded headers or diagnostics. */
export class GooglePlacesHarCapture {
  private readonly captured: unknown[] = [];
  private readonly credentials = new Set<string>();
  private ownedCredentialLeak = false;
  private open = true;
  constructor(private readonly reject: (reason: Rejection) => void) {}
  get entries(): readonly unknown[] { return this.captured; }
  get rejectsRecording(): boolean { return this.ownedCredentialLeak; }
  registerCredentials(values: readonly string[]): void { for (const value of values) if (value) this.credentials.add(value); }
  close(): void { this.open = false; }
  private scan(value: unknown): "OWN_CREDENTIAL" | "KEY_PATTERN" | undefined {
    const queue: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }];
    let pattern = false;
    while (queue.length) {
      const { value, depth } = queue.pop()!;
      if (depth > 64) { pattern = true;continue; }
      if (typeof value === "string") {
        const decoded = value.replace(/&#(?:x([0-9a-f]+)|(\d+));?/gi, (_all, hex, decimal) => {
          const code = parseInt(hex ?? decimal, hex ? 16 : 10);return code <= 0x10ffff ? String.fromCodePoint(code) : "";
        }).replace(/&amp;/gi,"&");
        const uri = decoded.replace(/(?:%[0-9a-f]{2})+/gi, encoded => {try { return decodeURIComponent(encoded); } catch { return encoded; }});
        for (const text of [value, decoded, uri]) {
          if ([...this.credentials].some(key => text.includes(key))) return "OWN_CREDENTIAL";
          if (keyPattern.test(text)) pattern = true;
        }
        if (/^\s*[\[{]/.test(value)) { try { queue.push({ value: JSON.parse(value), depth: depth + 1 }); } catch { /* ordinary text */ } }
      } else if (value && typeof value === "object") {
        for (const [key, item] of Object.entries(value)) { if (keyField.test(key)) pattern = true;queue.push({ value: item, depth: depth + 1 }); }
      }
    }
    return pattern ? "KEY_PATTERN" : undefined;
  }
  /** Check raw inputs before redaction, so masking can never hide our own leak. */
  observeOwnCredentials(value: unknown): void {
    if (this.scan(value) !== "OWN_CREDENTIAL") return;
    if (!this.ownedCredentialLeak) this.reject({ reason: "OWN_CREDENTIAL", stage: "BEFORE_WRITE" });
    this.ownedCredentialLeak = true;
  }
  accept(value: unknown, stage: Rejection["stage"] = "BEFORE_WRITE", ref: Partial<Rejection> = {}): boolean {
    const reason = this.scan(value);
    if (!reason) return true;
    if (reason === "OWN_CREDENTIAL") this.ownedCredentialLeak = true;
    this.reject({ ...ref, reason: reason === "OWN_CREDENTIAL" ? reason : `KEY_PATTERN_${stage}`, stage });
    return false;
  }
  wrap(transport: typeof fetch): typeof fetch {
    return async (input, init) => {
      const started = Date.now();
      const response = await transport(input, init);
      if (!this.open) return response;
      let url: URL;
      try { url = new URL(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url); }
      catch { this.reject({ reason: "INVALID_REQUEST_URL", stage: "RESPONSE" });return response; }
      const ref = { origin: url.origin, pathname: url.pathname };
      try {
        if (!googleEndpoint(url)) { this.reject({ ...ref, reason: "UNSUPPORTED_GOOGLE_ENDPOINT", stage: "RESPONSE" });return response; }
        const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
        for (const [name, value] of headers) if (/(?:key|authorization|cookie)/i.test(name) && value) this.credentials.add(value.replace(/^Bearer\s+/i, ""));
        for (const name of [...url.searchParams.keys()]) if (/(?:key|token|secret|authorization)/i.test(name)) {
          for (const value of url.searchParams.getAll(name)) if (value) this.credentials.add(value);url.searchParams.delete(name);
        }
        url.hash = "";
        const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
        const body = init?.body;
        if (body !== undefined && body !== null && typeof body !== "string") { this.reject({ ...ref, reason: "UNSUPPORTED_REQUEST_BODY", stage: "RESPONSE" });return response; }
        const raw = await response.clone().text();
        if (!this.open) return response;
        if (!this.accept(raw,"RESPONSE",ref) || body && !this.accept(body,"RESPONSE",ref)) return response;
        try { JSON.parse(raw);if (body) JSON.parse(body); } catch { this.reject({ ...ref, reason: "INVALID_JSON", stage: "RESPONSE" });return response; }
        const mimeType = response.headers.get("content-type")?.split(";", 1)[0] ?? "application/json";
        const entry = { startedDateTime: new Date(started).toISOString(), time: Date.now() - started,
          request: { method, url: url.toString(), httpVersion: "HTTP/1.1", headers: [], queryString: [], cookies: [], headersSize: -1, bodySize: body ? Buffer.byteLength(body) : 0,
            ...(typeof body === "string" ? { postData: { mimeType: "application/json", text: body } } : {}) },
          response: { status: response.status, statusText: response.statusText, httpVersion: "HTTP/1.1", headers: [{ name: "content-type", value: mimeType }], cookies: [],
            content: { mimeType, text: raw, size: Buffer.byteLength(raw) }, redirectURL: "", headersSize: -1, bodySize: Buffer.byteLength(raw) },
          cache: {}, timings: { send: 0, wait: Date.now() - started, receive: 0 } };
        if (this.accept(entry,"RESPONSE",ref)) this.captured.push(entry);
      } catch { if (this.open) this.reject({ ...ref, reason: "CAPTURE_FAILED", stage: "RESPONSE" }); }
      return response;
    };
  }
  /** Scan the exact serialized candidate before publication, then reread disk. */
  async writeHar(path: string, har: unknown): Promise<boolean> {
    const candidate = this.safeHar(har,"BEFORE_WRITE");
    if (!candidate) return false;
    const text = JSON.stringify(candidate, null, 2);
    if (!this.accept(text,"BEFORE_WRITE")) return false;
    const pending = path + ".pending";
    await writeFile(pending, text, { flag: "wx" });
    try {
      if (!await this.verifyWrittenHar(pending)) return false;
      // Publish precisely the scanned bytes, without overwriting an artifact.
      await link(pending, path);await unlink(pending);return true;
    } catch (error) { await unlink(pending).catch(() => {});throw error; }
  }
  async verifyWrittenHar(path: string): Promise<boolean> {
    const text = await readFile(path, "utf8");
    if (!this.scan(text)) return true;
    // Ordinary hits remain entry-local on the disk verification too. Never
    // publish unscanned replacement bytes or retain an owned credential.
    let candidate: unknown;
    try { candidate = this.safeHar(JSON.parse(text),"AFTER_WRITE"); } catch { /* malformed pending file */ }
    if (candidate) {
      await writeFile(path,JSON.stringify(candidate,null,2));
      if (this.accept(await readFile(path,"utf8"),"AFTER_WRITE")) return true;
    }
    await unlink(path);return false;
  }
  private safeHar(har: unknown, stage: Rejection["stage"]): unknown | undefined {
    this.observeOwnCredentials(har);
    if (this.ownedCredentialLeak) { this.reject({ reason:"OWN_CREDENTIAL",stage });return undefined; }
    const value = har as {log:{entries:unknown[]}};
    if (!Array.isArray(value?.log?.entries)) return undefined;
    const entries = value.log.entries.filter(entry => this.accept(entry,stage));
    if (this.ownedCredentialLeak) return undefined;
    const candidate = {...value,log:{...value.log,entries}};
    return this.accept(candidate,stage) ? candidate : undefined;
  }
}

/** Preserve the existing client's proxy, timeout and optional fixture transport. */
export function createEvalGooglePlacesClient(options: GooglePlacesClientOptions, decorate?: (transport: typeof fetch) => typeof fetch): GooglePlacesClient {
  if (!decorate) return new GooglePlacesClient(options);
  const { proxyServer, fetchImplementation, ...clientOptions } = options;
  let transport = fetchImplementation ?? fetch;
  if (proxyServer?.trim()) {
    let proxy: URL;
    try { proxy = new URL(proxyServer);if (!["http:", "https:"].includes(proxy.protocol)) throw new Error(); }
    catch { throw new GooglePlacesError("GOOGLE_CONFIGURATION_ERROR", "Google Places proxy must be a valid HTTP(S) URL"); }
    if (!fetchImplementation) { const agent = new ProxyAgent(proxy.toString());transport = (url, init) => fetch(url, { ...init, dispatcher: agent } as RequestInit); }
  }
  return new GooglePlacesClient({ ...clientOptions, fetchImplementation: decorate(transport) });
}
