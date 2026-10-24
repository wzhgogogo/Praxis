import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createEvalPacingCoordinator } from "../../eval/restaurant/agent-loop/runners/eval-pacing.js";
import { withPacedEval } from "../../eval/restaurant/agent-loop/runners/run-paced-hybrid-read-child.js";
import { LocalPlaywrightChromium } from "../../infrastructure/browser/local-playwright-chromium.js";
import { GooglePlacesClient } from "../../integrations/google/google-places-client.js";
import { GOOGLE_PLACES_TEXT_SEARCH_URL } from "../../integrations/google/google-places-contracts.js";

// Synthetic localhost pages and API transport, 2026-10-24. No real Google request.
test("formal pacing bootstrap covers Chromium Guard routes, native redirects and Google transport", { timeout: 20_000 }, async t => {
  const hits: string[] = [], source = createServer((request, response) => {
    hits.push(request.url!);
    if (request.url === "/redirect") { response.writeHead(302, { location: "/final" });response.end(); }
    else { response.setHeader("content-type", "text/html");response.end("<h1>Public fixture</h1>"); }
  });
  await new Promise<void>(resolve => source.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${(source.address() as {port:number}).port}`, googleOrigin = new URL(GOOGLE_PLACES_TEXT_SEARCH_URL).origin, geocodeOrigin = "https://geocode.googleapis.com";
  const root = await mkdtemp(join(tmpdir(), "praxis-paced-transports-")), coordinator = await createEvalPacingCoordinator();
  const originalFetch = globalThis.fetch;let googleFixtureCalls = 0;
  globalThis.fetch = async (url,init) => { if ([googleOrigin,geocodeOrigin].some(origin=>String(url).startsWith(origin))) { googleFixtureCalls++;return new Response('{"places":[],"results":[]}', {status:200}); }return originalFetch(url,init); };
  try {
    await withPacedEval(coordinator.endpoint, "transport", join(root,"usage.json"), async () => {
      const controller=new AbortController();const session=await new LocalPlaywrightChromium().openSession({signal:controller.signal,networkPolicy:{documentOrigins:[origin],genericPublicRead:true,staticResources:[],dynamicReads:[]}});
      try {
        assert.equal(session.metadata.readNetworkBoundary,"INSTALLED");
        for(const path of ["/public","/redirect"]){await session.prepareNavigation?.(origin+path);await session.navigate(origin+path);}
        assert.equal((await session.snapshot()).url,origin+"/final");
        assert.deepEqual(await new GooglePlacesClient({apiKey:"fixture-only"}).textSearch({textQuery:"fixture",pageSize:1},controller.signal),[]);
        assert.deepEqual(await new GooglePlacesClient({apiKey:"fixture-only"}).reverseAddress({latitude:35,longitude:139},controller.signal),{addressComponents:[]});
      }finally{controller.abort();await session.close();}
    },[origin,googleOrigin,geocodeOrigin]);
    assert.deepEqual(hits,["/public","/redirect","/final"]);assert.equal(googleFixtureCalls,2);
    const usage=JSON.parse(await readFile(join(root,"usage.json"),"utf8"));
    assert.deepEqual(usage.byOrigin,{[origin]:{requests:3,waitMs:0},[googleOrigin]:{requests:1,waitMs:0},[geocodeOrigin]:{requests:1,waitMs:0}});
    assert.equal(coordinator.snapshot().heldLeases,0);t.diagnostic(JSON.stringify({hits,usage,realGoogleCalls:0}));
  }finally{globalThis.fetch=originalFetch;await coordinator.close();source.closeAllConnections();await new Promise<void>(resolve=>source.close(()=>resolve()));await rm(root,{recursive:true,force:true});}
});
