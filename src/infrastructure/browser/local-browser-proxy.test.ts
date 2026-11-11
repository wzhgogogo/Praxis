import assert from "node:assert/strict";
import { test } from "node:test";
import { localBrowserProxyFromEnvironment, browserProxyForUrl, playwrightProxy } from "./local-browser-proxy.js";

test("local proxy configuration covers exact hosts and descendants without suffix lookalikes", () => {
  const environment = { PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER: " http://127.0.0.1:10808 ", PRAXIS_LOCAL_CHROMIUM_DIRECT_HOSTS: "TableCheck.com,tablecheck.net,tabelog.com,tblg.k-img.com,tablecheck.com" };
  const settings = localBrowserProxyFromEnvironment(environment);
  assert.deepEqual(settings, { proxyServer: "http://127.0.0.1:10808", directHosts: ["tablecheck.com", "tablecheck.net", "tabelog.com", "tblg.k-img.com"] });
  for (const host of ["www.tablecheck.com", "cdn0.tablecheck.com", "production.tablecheck.com", "search-v4.production.ap-northeast-1.aws.tablecheck.net", "tablecheck.com", "tabelog.com", "tblg.k-img.com"]) assert.equal(browserProxyForUrl(`https://${host}/`, settings), undefined, host);
  for (const host of ["places.googleapis.com", "fonts.googleapis.com", "unrelated.test", "nottabelog.com", "tablecheck.com.unrelated.test"]) assert.equal(browserProxyForUrl(`https://${host}/`, settings), settings.proxyServer, host);
  assert.equal(playwrightProxy(settings)?.bypass, "tablecheck.com,.tablecheck.com,tablecheck.net,.tablecheck.net,tabelog.com,.tabelog.com,tblg.k-img.com,.tblg.k-img.com");
  assert.deepEqual(localBrowserProxyFromEnvironment({}), {}); assert.equal(playwrightProxy({directHosts:["example.test"]}), undefined);
  for (const host of ["https://example.test", "example.test:443", "*.example.test", "example.test/path", "example..test"]) assert.throws(() => localBrowserProxyFromEnvironment({PRAXIS_LOCAL_CHROMIUM_DIRECT_HOSTS:host}));
  assert.equal(environment.PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER, " http://127.0.0.1:10808 ");
});
