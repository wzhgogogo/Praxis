/** Local test transport configuration only; never grants Guard admission. */
export interface LocalBrowserProxySettings {
  proxyServer?: string;
  /** DNS suffixes (apex and descendants), supplied by local configuration. */
  directHosts?: readonly string[];
}

export function localBrowserProxyFromEnvironment(environment: NodeJS.ProcessEnv = process.env): LocalBrowserProxySettings {
  const proxyServer = environment.PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER?.trim();
  const directHosts = [...new Set((environment.PRAXIS_LOCAL_CHROMIUM_DIRECT_HOSTS ?? "").split(",").map(host => host.trim().toLowerCase()).filter(Boolean))];
  for (const host of directHosts) {
    const parsed = new URL(`http://${host}`);
    if (!/^[a-z0-9.-]+$/.test(host) || host.split(".").some(part => !part) || parsed.hostname !== host || parsed.port || parsed.pathname !== "/") {
      throw new Error("PRAXIS_LOCAL_CHROMIUM_DIRECT_HOSTS requires comma-separated hostnames, without URLs, ports or wildcards");
    }
  }
  return { ...(proxyServer ? { proxyServer } : {}), ...(directHosts.length ? { directHosts } : {}) };
}

export function browserProxyForUrl(value: string, settings: LocalBrowserProxySettings): string | undefined {
  const hostname = new URL(value).hostname.toLowerCase();
  return settings.directHosts?.some(host => hostname === host || hostname.endsWith("." + host)) ? undefined : settings.proxyServer;
}

export function playwrightProxy(settings: LocalBrowserProxySettings): { server: string; bypass?: string } | undefined {
  if (!settings.proxyServer) return undefined;
  // Chromium needs both the apex and suffix; Playwright's Node request client
  // treats either spelling as a suffix. Both therefore use the same host set.
  const bypass = settings.directHosts?.flatMap(host => [host, "." + host]).join(",");
  return { server: settings.proxyServer, ...(bypass ? { bypass } : {}) };
}
