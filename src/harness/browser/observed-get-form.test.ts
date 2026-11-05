import {withRequestTimeline} from '../../eval/restaurant/agent-loop/runners/browser-request-timeline.js';
import {readDiagnosticTrace} from '../../eval/restaurant/agent-loop/diagnostic-evaluator-record.js';
import {auditNativeGetForm} from '../../eval/restaurant/agent-loop/diagnostic-evaluator-forms.js';
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { chromium } from "playwright-core";
import { LocalPlaywrightChromium } from "../../infrastructure/browser/local-playwright-chromium.js";
import { PlaywrightReadNetworkGuard } from "../../infrastructure/browser/playwright-read-network-guard.js";

// Real browser/CDP and HTTP receiver oracle. No external requests, model or
// fixture-granted source rule. Native submit and script form.submit share the
// same value-provenance boundary; ordinary links do not borrow its permission.
for (const transport of ["NODE_FETCH", "BROWSER_GET_HEAD"] as const) {
  test(`${transport}: observed native GET forms bind page defaults and authoritative input to the same document`, async () => {
    const arrivals: string[] = [];
    const server = createServer((request, response) => {
      arrivals.push(request.url!);
      response.setHeader("content-type", "text/html");
      response.end(request.url === "/" ? `<form method="get" action="/results">
        <input name="genre_name" aria-label="Search"><input type="hidden" name="kind" value="RailroadStation">
        <input type="hidden" name="default_person" value="Website Supplied Name">
        <button type="button" onclick="this.form.elements.kind.value='Page Script Value';this.form.submit()">Search</button>
      </form>` : "<h1>Public result</h1>");
    });
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address(); assert.ok(address && typeof address !== "string");
    const origin = `http://127.0.0.1:${address.port}`;
    const runtime = new LocalPlaywrightChromium({ admittedGetTransport: transport });
    const trace:Array<{sequence:number;kind:string;detail:unknown}>=[];
    const signal=new AbortController().signal;
    const session = await withRequestTimeline({signal,record:(kind,detail)=>trace.push({sequence:trace.length+1,kind,detail})},()=>runtime.openSession({ signal,
      networkPolicy: { documentOrigins: [origin], genericPublicRead: true, staticResources: [], dynamicReads: [] } }));
    try {
      await session.prepareNavigation!(origin + "/"); await session.navigate(origin + "/");
      const input = (await session.observeControls!()).find(control => control.kind === "INPUT")!;
      await assert.rejects(session.fill(input.id, "Contact Person"), /operation failed/);
      for (const value of ["shop@example.test", "+81 03-1234-5678", "token=private"]) {
        await assert.rejects(session.fill(input.id, value, { inputSource: "SPECIFIC_OUTLET" }), /operation failed/);
      }
      assert.equal((await session.snapshot()).html.includes("Contact Person"), false, "contact never entered the page");
      await session.fill(input.id, "Akabane", { inputSource: "AREA" });
      const button = (await session.observeControls!()).find(control => control.kind === "BUTTON")!;
      await session.click(button.id);
      const snapshot = await session.snapshot();
      assert.match(snapshot.text, /Public result/);
      const result = arrivals.find(url => url.startsWith("/results?")); assert.ok(result, JSON.stringify(arrivals));
      const actual = new URL(result, origin);
      assert.equal(actual.searchParams.get("genre_name"), "Akabane");
      assert.equal(actual.searchParams.get("kind"), "Page Script Value");
      assert.equal(actual.searchParams.get("default_person"), "Website Supplied Name");
      const receipt = snapshot.networkRequests?.find(row => row.pathname === "/results" && row.formSubmission)?.formSubmission;
      assert.ok(receipt);
      assert.equal(receipt.fields.find(field => field.key === "genre_name")?.source, "AREA");
      assert.equal(receipt.fields.find(field => field.key === "default_person")?.source, "PAGE");
      assert.equal(JSON.stringify(receipt).includes("Website Supplied Name"), false);
      const independent=readDiagnosticTrace(trace).entries;
      const request=snapshot.networkRequests!.find(row=>row.formSubmission)!;
      assert.equal(auditNativeGetForm(independent,request,{intentDraft:{area:{query:"near Akabane"}}}).status,"SUPPORTED",JSON.stringify(independent.filter(row=>row.kind==='NATIVE_GET_FORM')));
      assert.equal(auditNativeGetForm([],request,{intentDraft:{area:{query:"near Akabane"}}}).status,"MISSING");
      assert.equal(auditNativeGetForm(independent,request,{intentDraft:{area:{query:"elsewhere"}}}).status,"MISSING","a Guard receipt cannot authorize an unrelated typed value");
      assert.equal(JSON.stringify(independent.filter(row=>row.kind==='NATIVE_GET_FORM')).includes('Website Supplied Name'),false);

    } finally { await session.close(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
  });

  test(`${transport}: unknown input, cross-origin, POST, prohibited path and nonform name never get form permission`, async () => {
    const arrivals: Array<{ path: string; method: string }> = [];
    const server = createServer((request, response) => {
      const url = new URL(request.url!, `http://${request.headers.host}`);
      arrivals.push({ path: url.pathname, method: request.method! });
      response.setHeader("content-type", "text/html");
      response.end(url.pathname === "/result" ? "<h1>Public result</h1>"
        : `<form method="get" action="/result"><input name="name" value="Page default"><button>Go</button></form>`);
    });
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address(); assert.ok(address && typeof address !== "string");
    const origin = `http://127.0.0.1:${address.port}`;
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ serviceWorkers: "block" });
      const guard = new PlaywrightReadNetworkGuard({ documentOrigins: [origin], genericPublicRead: true,
        staticResources: [], dynamicReads: [], prohibitedPaths: [{ hostname: "127.0.0.1", pathSegment: "forbidden" }] }, 5_000, undefined, transport);
      await guard.install(context);
      for (const mode of ["UNKNOWN_INPUT", "UNKNOWN_TRANSFORM", "UNOBSERVED", "CROSS_ORIGIN", "POST", "FORBIDDEN", "NONFORM", "EXTRA_FIELD", "POPUP_UNKNOWN", "IFRAME_UNKNOWN"]) {
        const page = await context.newPage(); await guard.preparePage(context, page);
        guard.prepareNavigation(origin + "/"); await page.goto(origin + "/");
        if (mode !== "UNOBSERVED") await guard.forms.observe(page);
        if (mode === "UNKNOWN_INPUT" || mode === "UNKNOWN_TRANSFORM") await page.locator("input").fill("Customer Contact");
        if (mode === "UNKNOWN_TRANSFORM") await page.locator("input").evaluate(node => (node as HTMLInputElement).value = "Script replaced contact");
        if (mode === "POPUP_UNKNOWN" || mode === "IFRAME_UNKNOWN") {
          await page.locator("input").evaluate(node => (node as HTMLInputElement).name = "q");
          await page.locator("input").fill("Customer Contact");
          await page.locator("form").evaluate((form, target) => {
            if (target === "frame") { const frame = document.createElement("iframe"); frame.name = target; document.body.append(frame); }
            (form as HTMLFormElement).target = target;
          }, mode === "POPUP_UNKNOWN" ? "_blank" : "frame");
        }
        if (mode === "CROSS_ORIGIN") await page.locator("form").evaluate(form => (form as HTMLFormElement).action = "http://localhost:1/result");
        if (mode === "POST") await page.locator("form").evaluate(form => (form as HTMLFormElement).method = "post");
        if (mode === "FORBIDDEN") await page.locator("form").evaluate(form => (form as HTMLFormElement).action = "/forbidden");
        const start = arrivals.length;
        const boundaryStart = guard.snapshotRequests().length;
        const terminal = mode === "POPUP_UNKNOWN" || mode === "IFRAME_UNKNOWN" ? Promise.race([
          context.waitForEvent("requestfailed", { predicate: request => new URL(request.url()).pathname === "/result", timeout: 3_000 }),
          context.waitForEvent("requestfinished", { predicate: request => new URL(request.url()).pathname === "/result", timeout: 3_000 }),
        ]) : undefined;
        if (mode === "NONFORM" || mode === "EXTRA_FIELD") await page.goto(origin + `/result?name=Page+default${mode === "EXTRA_FIELD" ? "&extra=unknown" : ""}`, { timeout: 3_000 }).catch(() => {});
        else await page.locator("button").click({ timeout: 3_000 }).catch(() => {});
        if (terminal) await terminal;
        if (terminal) assert.ok(guard.snapshotRequests().slice(boundaryStart).some(row => row.outcome === "BLOCKED"
          && row.pathname === "/result" && row.queryKeys.includes("q")), `${mode}: target must reach a blocked terminal, not just a local bootstrap`);
        assert.deepEqual(arrivals.slice(start), [], `${mode}: unexpected source request`);
        await page.close();
      }
      const opener = await context.newPage(); await guard.preparePage(context, opener);
      guard.prepareNavigation(origin + "/"); await opener.goto(origin + "/");
      await guard.forms.observe(opener);
      await opener.locator("form").evaluate(form => (form as HTMLFormElement).target = "_blank");
      const opening = opener.waitForEvent("popup");
      await opener.locator("button").click();
      const popup = await opening;
      await popup.locator("h1").waitFor({ timeout: 3_000 });
      assert.equal(await popup.locator("h1").innerText(), "Public result");
      assert.equal(arrivals.filter(row => row.path === "/result").length, 1, "only the proven page-default form reached the receiver");
      const admitted = guard.snapshotRequests().find(row => row.pathname === "/result" && row.outcome === "ADMITTED");
      assert.equal(admitted?.formSubmission?.fields[0]?.source, "PAGE");
      guard.prepareNavigation(origin + "/"); await popup.goto(origin + "/");
      await popup.goto(origin + "/result?name=Page+default", { timeout: 3_000 }).catch(() => {});
      assert.equal(arrivals.filter(row => row.path === "/result").length, 1, "consumed popup permission cannot authorize a later nonform GET");
      assert.ok(guard.snapshotRequests().some(row => row.outcome === "BLOCKED"));
    } finally { await browser.close(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
  });
}
