import type {BrowserEngine,BrowserEngineMode,BrowserRuntime,BrowserSession,BrowserReadNetworkPolicy} from './browser-runtime.js';
import {BrowserRuntimeError} from './browser-runtime-errors.js';
import {IsolatedCloudflareSession} from './cloudflare-session-proxy.js';
export interface CloudflareBrowserRunConfig {
 accountId:string;apiToken:string;engineMode?:BrowserEngineMode;connectTimeoutMs?:number;
 /** Test-host transport override; only a loopback endpoint is accepted. Never read from env/model. */
 cdpEndpoint?:string;
}
function required(value:string|undefined,variable:string):string{if(!value?.trim())throw new BrowserRuntimeError('BROWSER_RUNTIME_FAILED',variable+' is required for Browser Run');return value;}
function endpoint(accountId:string,engine:BrowserEngine){const base='wss://api.cloudflare.com/client/v4/accounts/'+encodeURIComponent(accountId)+'/browser-run/devtools/browser';return engine==='KITESURF'?base+'?browser=kitesurf':base;}
function candidateEngines(mode:BrowserEngineMode):BrowserEngine[]{return mode==='AUTO'?['KITESURF','CHROMIUM']:[mode==='KITESURF_ONLY'?'KITESURF':'CHROMIUM'];}
function fallbackEligible(error:unknown){return !(error instanceof BrowserRuntimeError&&error.code==='BROWSER_ABORTED');}
export class CloudflareBrowserRun implements BrowserRuntime {
  readonly readNetworkBoundaryCapability = "ISOLATED_CONTEXT" as const;
  private readonly mode: BrowserEngineMode;
  private readonly connectTimeoutMs: number;

  constructor(private readonly config: CloudflareBrowserRunConfig) {
    if(config.cdpEndpoint){const url=new URL(config.cdpEndpoint);if(!["ws:","http:"].includes(url.protocol)||url.hostname!=="127.0.0.1"||url.username||url.password)throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED","CDP fixture endpoint must be loopback");}
    required(config.accountId, "CLOUDFLARE_ACCOUNT_ID");
    required(config.apiToken, "CLOUDFLARE_API_TOKEN");
    this.mode = config.engineMode ?? "AUTO";
    this.connectTimeoutMs = config.connectTimeoutMs ?? 12_000;
  }

  static fromEnvironment(environment: NodeJS.ProcessEnv = process.env): CloudflareBrowserRun {
    const configured = environment.PRAXIS_BROWSER_ENGINE;
    const engineMode: BrowserEngineMode = configured === "KITESURF" ? "KITESURF_ONLY"
      : configured === "CHROMIUM" ? "CHROMIUM_ONLY" : "AUTO";
    return new CloudflareBrowserRun({
      accountId: environment.CLOUDFLARE_ACCOUNT_ID ?? "",
      apiToken: environment.CLOUDFLARE_API_TOKEN ?? "",
      engineMode,
    });
  }

  protected connectionEndpoint(engine: BrowserEngine): string {
    return this.config.cdpEndpoint ?? endpoint(this.config.accountId,engine);
  }

  protected openEngine(engine: BrowserEngine, input: Parameters<BrowserRuntime['openSession']>[0]): Promise<BrowserSession> {
    return IsolatedCloudflareSession.open({endpoint:this.connectionEndpoint(engine),apiToken:this.config.apiToken,engine,
      timeoutMs:this.connectTimeoutMs,...(input.networkPolicy?{networkPolicy:input.networkPolicy}:{})},input.signal,input.recordResponse);
  }

  async openSession(input: { signal: AbortSignal; engineMode?: BrowserEngineMode; networkPolicy?: BrowserReadNetworkPolicy; recordResponse?: (response: { url: string; method: string; resourceType: string; status: number; contentType: string; body: Uint8Array; redirectLocation?: string }) => Promise<void> | void; replayHarPath?: string }): Promise<BrowserSession> {
    if (input.signal.aborted) throw new BrowserRuntimeError("BROWSER_ABORTED", "Browser session creation was aborted");
    // routeFromHAR is a local Playwright capability.  A remote CDP session
    // cannot promise that a missing replay entry stays off the remote network,
    // so reject instead of silently opening a live Cloudflare page.
    if (input.replayHarPath) {
      throw new BrowserRuntimeError("BROWSER_RUNTIME_UNAVAILABLE", "Cloudflare Browser Run does not support isolated HAR replay");
    }
    const mode = input.engineMode ?? this.mode;
    let lastError: unknown;
    for (const engine of candidateEngines(mode)) {
      try {
        const session = await this.openEngine(engine,input);
        return session;
      } catch (error) {
        lastError = error;
        if (!fallbackEligible(error) || engine === "CHROMIUM" || mode !== "AUTO") break;
      }
    }
    throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED", "Cloudflare Browser Run could not open a browser session", lastError);
  }
}
