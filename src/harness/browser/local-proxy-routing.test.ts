import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer, request as httpRequest } from "node:http";
import { connect } from "node:net";
import { once } from "node:events";
import { LocalPlaywrightChromium } from "../../infrastructure/browser/local-playwright-chromium.js";

// Real receivers distinguish proxy traffic; no DNS, external source or model.
test("local browser proxy splits native, Node data and redirects by the target host", { timeout: 25000 }, async () => {
  const seen: Array<{ host: string; path: string }> = [], proxied: string[] = [];
  let origin = "", other = "", peer = "";
  const receiver = createServer((request, response) => {
    const url = new URL(request.url!, origin);
    seen.push({ host: request.headers.host!, path: url.pathname });
    response.setHeader("access-control-allow-origin", "*");
    if (url.pathname === "/redirect-out") { response.writeHead(302, { location: other + "/arrived-proxy" }); response.end(); return; }
    if (url.pathname === "/redirect-in") { response.writeHead(302, { location: peer + "/arrived-direct" }); response.end(); return; }
    if (url.pathname === "/assets/app.js") { response.setHeader("content-type", "application/javascript"); response.end("window.assets=(window.assets||0)+1"); return; }
    if (url.pathname !== "/") { response.setHeader("content-type", "application/json"); response.end("{}"); return; }
    response.setHeader("content-type", "text/html");
    response.end(`<body>Local split<output>Pending</output><button onclick="Promise.all(['${origin}/data','${peer}/data','${other}/data','${origin}/redirect-out','${other}/redirect-in'].map(u=>fetch(u).then(r=>r.json()))).then(()=>document.querySelector('output').textContent='Done')">Read</button><script src="/assets/app.js"></script><script src="${peer}/assets/app.js"></script><script src="${other}/assets/app.js"></script></body>`);
  });
  receiver.listen(0, "127.0.0.1"); await once(receiver, "listening");
  const port = (receiver.address() as import("node:net").AddressInfo).port;
  origin = `http://127.0.0.1:${port}`; peer = `http://localhost:${port}`; other = `http://proxied.fixture.invalid:${port}`;
  const proxy = createServer((request, response) => {
    const target = new URL(request.url!); proxied.push(target.hostname);
    const upstream = httpRequest({ hostname: "127.0.0.1", port, path: target.pathname + target.search, method: request.method!, headers: { host: target.host } }, incoming => {
      response.writeHead(incoming.statusCode!, incoming.headers); incoming.pipe(response);
    });
    upstream.on("error", () => response.destroy()); request.pipe(upstream);
  });
  const sockets = new Set<import("node:stream").Duplex>();
  proxy.on("connect", (request, socket, head) => {
    proxied.push(request.url!.split(":")[0]!);
    const upstream = connect(port, "127.0.0.1", () => { socket.write("HTTP/1.1 200 Connection Established\r\n\r\n"); if (head.length) upstream.write(head); socket.pipe(upstream); upstream.pipe(socket); });
    sockets.add(upstream); sockets.add(socket); upstream.on("close", () => sockets.delete(upstream)); socket.on("close", () => sockets.delete(socket));
    upstream.on("error", () => socket.destroy()); socket.on("error", () => upstream.destroy());
  });
  proxy.listen(0, "127.0.0.1"); await once(proxy, "listening");
  const proxyServer = `http://127.0.0.1:${(proxy.address() as import("node:net").AddressInfo).port}`;
  const statics = [origin, peer, other].map(origin => ({ origin, pathname: "/assets/app.js", methods: ["GET"] as const, resourceTypes: ["script"] as const, queryKeys: [] }));
  const session = await new LocalPlaywrightChromium({ browserType: { async launch(options) {
    const browser = await chromium.launch(options), create = browser.newContext.bind(browser);
    browser.newContext = async options => {
      const context = await create(options);
      // Same loopback-only fixture permission as read-network-redirect.test.ts.
      // Production browser permissions and Guard remain unchanged.
      await context.grantPermissions(["local-network-access"], { origin }); return context;
    }; return browser;
  } }, proxyServer, directHosts: ["127.0.0.1", "localhost"] }).openSession({ signal: new AbortController().signal, networkPolicy: {
    documentOrigins: [origin], staticResources: statics, dynamicReads: [origin, peer, other].flatMap(origin => ["/data", "/redirect-out", "/redirect-in", "/arrived-proxy", "/arrived-direct"].map(pathname => ({ origin, pathname, methods: ["GET"] as const, resourceTypes: ["fetch", "xhr"] as const, queryKeys: [] }))),
  } });
  try {
    await session.prepareNavigation!(origin + "/", { timeoutMs: 5000 }); await session.navigate(origin + "/", { timeoutMs: 5000 });
    const controls = await session.observeControls!(); await session.click(controls.find(c => c.label === "Read")!.id);
    await session.waitForSettled?.({ url: origin + "/", title: "", text: "Pending" }, 5000);
    const snapshot = await session.snapshot(); assert.match(snapshot.text, /Done/);
    for (const host of ["127.0.0.1", "localhost", "proxied.fixture.invalid"]) {
      assert.ok(seen.some(r => r.host === `${host}:${port}` && r.path === "/assets/app.js"), host);
      assert.ok(seen.some(r => r.host === `${host}:${port}` && r.path === "/data"), host);
    }
    assert.ok(seen.some(r => r.host === `proxied.fixture.invalid:${port}` && r.path === "/arrived-proxy"));
    assert.ok(seen.some(r => r.host === `localhost:${port}` && r.path === "/arrived-direct"));
    assert.ok(proxied.includes("proxied.fixture.invalid"));
    assert.ok(!proxied.includes("127.0.0.1") && !proxied.includes("localhost"), JSON.stringify(proxied));
    for (const request of snapshot.networkRequests?.filter(r => r.outcome === "ADMITTED" && ["/", "/assets/app.js", "/data"].includes(r.pathname)) ?? []) {
      assert.equal(request.transport, request.resourceType === "script" ? "BROWSER_GET_HEAD" : "NODE_FETCH");
    }
    console.log("LOCAL_PROXY_SPLIT " + JSON.stringify({ proxyHosts: [...new Set(proxied)], receiver: seen }));
  } finally {
    await session.close(); for (const socket of sockets) socket.destroy(); proxy.closeAllConnections(); receiver.closeAllConnections();
    await Promise.all([new Promise<void>(resolve => proxy.close(() => resolve())), new Promise<void>(resolve => receiver.close(() => resolve()))]);
  }
});
