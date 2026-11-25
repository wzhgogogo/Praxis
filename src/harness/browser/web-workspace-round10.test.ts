import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { chromium, type Page, type Route } from "playwright-core";
import type { RestaurantCaseView } from "../../application/agent-workspace.js";
import { datedWorkspaceRequest, startWorkspaceFixture } from "../workspace-fixture-server.js";

type Options = NonNullable<Parameters<typeof startWorkspaceFixture>[0]>;
type Host = Awaited<ReturnType<typeof startWorkspaceFixture>>;
const userId = "workspace-user";
// The browser client owns this state. Locate and close the actual stream after it buffers an event.
declare const state: { stream: EventSource; deferredView?: { view: RestaurantCaseView } };

async function fixture(options: Options, run: (page: Page, host: Host) => Promise<void>, mobile = false) {
  const host = await startWorkspaceFixture(options);
  const browser = await chromium.launch({ headless: true, args: ["--disable-background-networking"] });
  const context = await browser.newContext({
    baseURL: host.baseUrl, viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    serviceWorkers: "block",
  });
  await context.route("**/*", route => new URL(route.request().url()).origin === host.baseUrl ? route.continue() : route.abort());
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  try {
    await page.clock.install({ time: host.clock.now() });
    await run(page, host);
  } finally {
    host.release();
    await context.close();
    await browser.close();
    await host.close();
  }
}

async function signin(page: Page) {
  await page.goto("/");
  await page.getByLabel("Access token", { exact: true }).fill("workspace-fixture");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

function byCase(page: Page, caseId: string) {
  return page.locator(`#case-list .case-link[data-case-id="${caseId}"]`);
}

function pathFor(view: RestaurantCaseView) {
  return "/api/cases/" + encodeURIComponent(view.case.caseId);
}

async function ready(page: Page) {
  await page.waitForFunction(() => document.querySelector("#card-counter")?.textContent === "1 of 3");
  assert.equal(await page.locator("#progress").isVisible(), false);
}

async function createPlan(page: Page, text: string, settled = true) {
  await page.locator("#message").fill(datedWorkspaceRequest(text));
  const creating = page.waitForResponse(r => r.request().method() === "POST" && new URL(r.url()).pathname === "/api/cases");
  await page.locator("#send").click();
  const response = await creating;
  assert.equal(response.status(), 201);
  const body: { view: RestaurantCaseView } = await response.json();
  await page.waitForFunction(id => document.querySelector<HTMLElement>(".case-link.active")?.dataset.caseId === id, body.view.case.caseId);
  if (settled) await ready(page);
  return { view: body.view, requestId: response.request().postDataJSON().requestId };
}

async function updateRequirement(page: Page, text: string) {
  const response = page.waitForResponse(r => r.request().method() === "POST" && r.url().endsWith("/messages"));
  await page.locator("#message").fill(text);
  await page.locator("#send").click();
  assert.equal((await response).status(), 200);
}

function latch() {
  let release!: () => void;
  const ready = new Promise<void>(resolve => { release = resolve; });
  return { ready, release };
}

async function frames(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

async function alertAboveComposer(page: Page) {
  await page.waitForFunction(() => {
    const alert = document.getElementById("error")!;
    const scroll = document.getElementById("case-workspace")!.getBoundingClientRect();
    const composer = document.getElementById("workspace-composer")!.getBoundingClientRect();
    const bounds = alert.getBoundingClientRect();
    return !alert.hidden && bounds.height > 0 && bounds.top >= scroll.top
      && bounds.bottom <= Math.min(composer.top, scroll.bottom);
  });
}

async function screenshot(page: Page, name: string) {
  const output = process.env.PRAXIS_ROUND8_VISUAL_OUTPUT;
  if (!output) return;
  await mkdir(output, { recursive: true });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.screenshot({ path: join(output, name + ".png"), animations: "disabled" });
}

async function expire(page: Page, host: Host, view: RestaurantCaseView, candidateId: string) {
  const expiresAt = view.restaurant.availabilityChecks[candidateId]?.displayExpiresAt;
  assert.ok(expiresAt);
  const duration = Date.parse(expiresAt) - host.clock.now().valueOf() + 100;
  host.clock.advance(duration);
  await page.clock.fastForward(duration);
}

function trackRequests(page: Page, method: string, path: string) {
  const requests: string[] = [];
  page.on("request", r => {
    const requested = new URL(r.url()).pathname;
    if (r.method() === method && requested === path) requests.push(requested);
  });
  return requests;
}

for (const entry of ["handoff", "card", "renewed"] as const) {
  const retainsSlot = entry === "renewed";
  test(`Round10 UI: ${entry} refresh ${retainsSlot ? "retains a verified 19:30" : "requires a new choice when 19:30 is gone"}`, { timeout: 30_000 }, async () => {
    const options = { multiSlot: true, sourceValidityMs: 60_000 };
    await fixture(options, async (page, host) => {
      await signin(page);
      const { view: created } = await createPlan(page, "Dinner with an explicit time choice");
      const before = await host.application.getCase(userId, created.case.caseId);
      const candidateId = before.restaurant.presentedCandidateIds![0]!;
      const refreshes = trackRequests(page, "POST", pathFor(before) + "/refresh");
      const departures = trackRequests(page, "POST", pathFor(before) + "/booking-departures");
      const choose = page.locator("#choose");
      const time = page.getByRole("button", { name: "Time 19:00 on Mon, Nov 2", exact: true });
      assert.equal(await time.getAttribute("aria-pressed"), "true");
      assert.equal(await choose.isEnabled(), true);
      await page.getByRole("button", { name: "Time 19:30 on Mon, Nov 2", exact: true }).click();
      const departure = page.locator("#departure");
      if (entry !== "card") {
        await choose.click();
        assert.match(await departure.getAttribute("href") ?? "", /start_time=19%3A30/);
      }
      await expire(page, host, before, candidateId);
      if (entry !== "card") assert.equal(await page.locator("#departure-title").innerText(), "Check availability again");
      options.multiSlot = retainsSlot;
      const refreshed = page.waitForResponse(r => r.request().method() === "POST" && r.url().endsWith("/refresh"));
      await (entry === "card" ? choose : departure).click();
      assert.equal((await refreshed).status(), 200);
      if (retainsSlot) {
        await page.waitForFunction(() => document.getElementById("departure")?.getAttribute("href")?.includes("start_time=19%3A30"));
        assert.equal(await page.locator("#handoff").isVisible(), true);
        const selectedId = await page.locator("#handoff-slot").inputValue();
        const after = await host.application.getCase(userId, before.case.caseId);
        assert.equal(after.restaurant.availability[candidateId]?.find(offer => offer.id === selectedId)?.dateTime.slice(11, 16), "19:30");
        assert.ok(Date.parse(after.restaurant.availabilityChecks[candidateId]!.displayExpiresAt!) > host.clock.now().valueOf());
        assert.notEqual(after.restaurant.availabilityChecks[candidateId]?.displayExpiresAt, before.restaurant.availabilityChecks[candidateId]?.displayExpiresAt);
        assert.equal(await page.locator("#error").isVisible(), false);
        await screenshot(page, "round10-handoff-renewed");
      } else {
        await page.getByText("Availability couldn't be confirmed. Try again.", { exact: true }).waitFor();
        assert.equal(await page.locator("#handoff").isVisible(), false);
        assert.doesNotMatch(await departure.getAttribute("href") ?? "", /start_time=19%3A00/);
        assert.equal(await page.locator("#availability-status").innerText(), "Mon, Nov 2");
        assert.equal(await time.getAttribute("aria-pressed"), "false");
        assert.equal(await choose.isDisabled(), true);
        await choose.dispatchEvent("click");
        assert.equal(await page.locator("#handoff").isVisible(), false);
        await alertAboveComposer(page);
        await screenshot(page, entry === "card" ? "round11-card-reselect" : "round10-handoff-reselect");
        await time.click();
        assert.equal(await time.getAttribute("aria-pressed"), "true");
        assert.equal(await page.locator("#error").isVisible(), false);
        assert.equal(await choose.isEnabled(), true);
        await choose.click();
        assert.match(await departure.getAttribute("href") ?? "", /start_time=19%3A00/);
      }
      assert.equal(refreshes.length, 1);
      assert.equal(departures.length, 0);
    }, true);
  });
}

for (const action of ["shortlist", "questions"] as const) {
  test(`Round10 UI: a delayed ${action} response stays with the earlier plan`, { timeout: 30_000 }, async () => {
    await fixture({ questions: true }, async (page, host) => {
      await signin(page);
      const { view: a } = await createPlan(page, "First dinner");
      const captured = latch(), deliver = latch();
      let upstreamStatus = 0;
      await page.route("**" + pathFor(a) + "/" + action, async (route: Route) => {
        if (action === "questions") {
          captured.release();
          await deliver.ready;
          await route.continue();
          return;
        }
        const upstream = await route.fetch({ maxRedirects: 0 });
        upstreamStatus = upstream.status();
        captured.release();
        await deliver.ready;
        await route.fulfill({ response: upstream });
      });
      try {
        if (action === "questions") {
          await page.locator("#details-button").click();
          await page.locator("#message").fill("Does this place require a card?");
          await page.locator("#send").click();
        } else await page.locator("#bookmark").click();
        await captured.ready;
        if (action === "shortlist") assert.equal(upstreamStatus, 200);
        else assert.equal(await page.locator("#send").getAttribute("aria-busy"), "true");
        await page.locator("#new-case").click();
        assert.equal(await page.locator("#send").getAttribute("aria-busy"), "false");
        assert.equal(await page.locator("#send").isEnabled(), true);
        const newText = "A separate dinner after the first plan";
        await page.locator("#message").fill(newText);
        const delayed = page.waitForResponse(r => r.url().endsWith("/" + action));
        deliver.release();
        assert.equal((await delayed).status(), 200);
        await frames(page);
        assert.equal(await page.locator("#home").isVisible(), true);
        assert.equal(await page.locator("#message").inputValue(), newText);
        assert.equal(await page.locator("#send").isEnabled(), true);
        assert.equal(await page.locator("#send").getAttribute("aria-busy"), "false");
        assert.equal(await page.locator("#answer-sheet").isVisible(), false);
        assert.equal(await page.locator("#error").isVisible(), false);
        const { view: b } = await createPlan(page, newText);
        assert.notEqual(b.case.caseId, a.case.caseId);
        const readA = await host.application.getCase(userId, a.case.caseId);
        assert.ok(!readA.conversation.messages.some(message => message.content === datedWorkspaceRequest(newText)));
        if (action === "questions") {
          const questionId = (await delayed).request().postDataJSON().requestId;
          await page.waitForFunction(async ({path,questionId}) => {
            const response = await fetch(path);
            return response.ok && (await response.json()).view.restaurant.questionHistory.some((q: {requestId:string}) => q.requestId === questionId);
          },{path:pathFor(a),questionId});
          assert.equal(await page.locator("#answer-sheet").isVisible(),false,"the original answer stays in its plan history");
        }
        assert.ok((await host.application.getCase(userId, b.case.caseId)).conversation.messages.some(message => message.content === datedWorkspaceRequest(newText)));
      } finally {
        deliver.release();
      }
    });
  });
}

test("Round10 UI: plan creation uses an RFC 4122 request ID without crypto.randomUUID", { timeout: 25_000 }, async () => {
  await fixture({}, async page => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(() => Object.defineProperty(Crypto.prototype, "randomUUID", { configurable: true, value: undefined }));
    await signin(page);
    assert.equal(await page.evaluate(() => typeof crypto.randomUUID), "undefined");
    assert.equal(await page.evaluate(() => typeof crypto.getRandomValues), "function");
    const { requestId } = await createPlan(page, "Dinner from an ordinary browser context");
    assert.match(requestId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.deepEqual(errors, []);
  });
});

for (const permitted of [true, false]) {
  test(`Round10 UI: nearby ${permitted ? "accepts device coordinates" : "recovers from denied location with a typed area"}`, { timeout: 30_000 }, async () => {
    await fixture({}, async (page, host) => {
      await page.addInitScript(permitted => {
        Object.defineProperty(navigator.geolocation, "getCurrentPosition", {
          value(success: PositionCallback, error?: PositionErrorCallback) {
            queueMicrotask(() => permitted
              ? success({ coords: { latitude: 35.668, longitude: 139.767, accuracy: 18 } } as GeolocationPosition)
              : error?.({ code: 1, message: "Fixture permission denied" } as GeolocationPositionError));
          },
        });
      }, permitted);
      await signin(page);
      assert.match(await page.evaluate(() => navigator.geolocation.getCurrentPosition.toString()), /Fixture permission denied/);
      const { view } = await createPlan(page, "Dinner in Tokyo");
      const locations = trackRequests(page, "POST", pathFor(view) + "/location");
      await updateRequirement(page, "Change Tokyo to nearby");
      const useLocation = page.getByRole("button", { name: "Use my location", exact: true });
      await useLocation.waitFor();
      const waiting = await host.application.getCase(userId, view.case.caseId);
      assert.equal(waiting.restaurant.intentDraft?.area?.query, "nearby");
      assert.equal(waiting.restaurant.intentDraft?.area?.coordinates, undefined);
      assert.ok(!(waiting.restaurant.missingRequiredFields as readonly string[]).includes("location"));
      if (permitted) await screenshot(page, "round10-nearby-location");
      if (permitted) {
        const stored = page.waitForResponse(r => r.request().method() === "POST" && r.url().endsWith("/location"));
        await useLocation.click();
        const response = await stored;
        assert.equal(response.status(), 200);
        assert.equal(response.request().postDataJSON().taskVersion, waiting.case.taskVersion);
        await useLocation.waitFor({ state: "hidden" });
        const coordinates = (await host.application.getCase(userId, view.case.caseId)).restaurant.intentDraft?.area?.coordinates;
        assert.ok(coordinates);
        assert.deepEqual([coordinates.latitude, coordinates.longitude, coordinates.accuracyMeters, coordinates.source], [35.668, 139.767, 18, "DEVICE"]);
        assert.equal(locations.length, 1);
      } else {
        await useLocation.click();
        await page.getByText("Type a nearby station, address, or district instead.", { exact: true }).waitFor();
        assert.equal(await useLocation.isEnabled(), true);
        await screenshot(page, "round10-nearby-denied");
        await updateRequirement(page, "Higashi-Ginza");
        await ready(page);
        assert.equal((await host.application.getCase(userId, view.case.caseId)).restaurant.intentDraft?.area?.query, "Higashi-Ginza");
        assert.equal(await useLocation.isVisible(), false);
        assert.equal(locations.length, 0);
      }
    }, true);
  });
}

test("Round10 UI: unsent drafts stay with their plans and a sent draft clears only its own field", { timeout: 30_000 }, async () => {
  await fixture({}, async page => {
    await signin(page);
    const { view: a } = await createPlan(page, "First dinner");
    await page.locator("#new-case").click();
    const { view: b } = await createPlan(page, "Second dinner");
    const switchTo = async (view: RestaurantCaseView) => {
      await byCase(page, view.case.caseId).click();
      await page.waitForFunction(id => document.querySelector<HTMLElement>(".case-link.active")?.dataset.caseId === id, view.case.caseId);
    };
    const message = page.locator("#message");
    await switchTo(a);
    await message.fill("A's unsent draft");
    await switchTo(b);
    assert.equal(await message.inputValue(), "");
    await message.fill("Make it three people");
    await switchTo(a);
    assert.equal(await message.inputValue(), "A's unsent draft");
    await switchTo(b);
    assert.equal(await message.inputValue(), "Make it three people");
    await updateRequirement(page, "Make it three people");
    await page.waitForFunction(() => document.querySelector<HTMLTextAreaElement>("#message")?.value === "");
    await switchTo(a);
    assert.equal(await message.inputValue(), "A's unsent draft");
    await switchTo(b);
    assert.equal(await message.inputValue(), "");
  });
});

async function nextBatch(page: Page) {
  for (let i = 0; i < 3; i++) await page.locator("#next").click();
  const response = page.waitForResponse(r => r.request().method() === "POST" && r.url().endsWith("/another-batch"));
  await page.locator("#find-more").click();
  assert.equal((await response).status(), 200);
  await ready(page);
}

test("Round10 UI: a saved later-batch outlet still qualified under the new party size has no mismatch label", { timeout: 30_000 }, async () => {
  await fixture({ extraCandidates: true, checkWholePool: true }, async (page, host) => {
    await signin(page);
    const { view } = await createPlan(page, "Dinner in Tokyo");
    await nextBatch(page);
    const before = await host.application.getCase(userId, view.case.caseId);
    const savedId = before.restaurant.presentedCandidateIds![0]!;
    await page.locator("#bookmark").click();
    await page.getByRole("button", { name: "Saved 1", exact: true }).waitFor();
    await updateRequirement(page, "Make it three people");
    await ready(page);
    const revised = await host.application.getCase(userId, view.case.caseId);
    assert.equal(revised.restaurant.intentDraft?.partySize, 3);
    assert.ok(revised.restaurant.readyCandidateIds.includes(savedId));
    assert.ok(!revised.restaurant.presentedCandidateIds?.includes(savedId));
    assert.ok(revised.restaurant.availability[savedId]?.some(offer => offer.partySize === 3));
    await page.locator("#saved").click();
    const row = page.locator(`#saved-list .saved-row[data-candidate-id="${savedId}"]`);
    const name = revised.restaurant.candidates.find(c => c.restaurant.id === savedId)!.restaurant.outletName;
    assert.equal(await row.innerText(), name);
    assert.equal(await row.isDisabled(), true);
    assert.equal(revised.restaurant.savedCandidates.find(c => c.candidateId === savedId)?.reasonCode, undefined);
    await screenshot(page, "round10-saved-upcoming");
    await page.locator("#saved-back").click();
    await nextBatch(page);
    assert.equal(await page.locator("#candidate-card").getAttribute("data-candidate-id"), savedId);
  });
});

test("Round10 UI: a background case updates My plans at Home and polling stops when it is ready", { timeout: 30_000 }, async () => {
  await fixture({ staged: true }, async (page, host) => {
    await signin(page);
    const { view } = await createPlan(page, "Dinner in Tokyo", false);
    const summary = byCase(page, view.case.caseId).locator("small");
    await host.waitForCheck();
    assert.equal(await summary.innerText(), "In progress");
    const lists = trackRequests(page, "GET", "/api/cases");
    await page.locator("#new-case").click();
    await page.locator("#message").fill("Keep this home draft");
    host.release();
    await page.waitForFunction(id => document.querySelector(`#case-list [data-case-id="${id}"] small`)?.textContent === "Ready", view.case.caseId);
    assert.equal(await page.locator("#home").isVisible(), true);
    assert.equal(await page.locator("#message").inputValue(), "Keep this home draft");
    assert.ok(lists.length > 0);
    const completed = lists.length;
    await page.clock.fastForward(10_000);
    await frames(page);
    assert.equal(lists.length, completed);
    assert.equal(await page.locator("#case-list .active").count(), 0);
    await screenshot(page, "round10-background-ready");
  });
});

for (const bufferSse of [true, false]) {
  test(`Round10 UI: actual 409 recovers ${bufferSse ? "the deferred SSE snapshot" : "the latest Case after an intermediate SSE and disconnect"}`, { timeout: 30_000 }, async () => {
    await fixture({ staged: true }, async (page, host) => {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Network.enable");
      await signin(page);
      const { view } = await createPlan(page, "Dinner in Tokyo", false);
      await host.waitForCheck();
      await page.locator("#progress.has-card").waitFor();
      assert.equal(await page.locator("#stop").innerText(), "Stop searching");

      const entered = latch(), deliver = latch();
      const gets = trackRequests(page, "GET", pathFor(view));
      await page.route("**/api/conversations/*/messages", async route => {
        entered.release();
        await deliver.ready;
        await route.continue();
      });
      const deliveredVersions: number[] = [];
      cdp.on("Network.eventSourceMessageReceived", event => {
        if (event.eventName !== "case") return;
        const projection: RestaurantCaseView = JSON.parse(event.data);
        if (projection.case.caseId === view.case.caseId) deliveredVersions.push(projection.case.taskVersion);
      });
      let unsubscribe = () => {};
      const terminal = new Promise<RestaurantCaseView>(resolve => {
        unsubscribe = host.application.subscribeCaseUpdates(projection => {
          if (projection.case.caseId === view.case.caseId && projection.case.phase === "PRESENT_RESULTS") resolve(projection);
        });
      });
      try {
        const draft = "Make it three people";
        await page.locator("#message").fill(draft);
        const rejected = page.waitForResponse(r => r.request().method() === "POST" && r.url().endsWith("/messages"));
        await page.locator("#send").click();
        await entered.ready;
        const pendingVersion=await page.evaluate(async()=>(await import(String("/assets/workspace/runtime.js"))).state.view.case.taskVersion);
        const active = await host.application.getCase(userId, view.case.caseId);
        const intermediate = await host.application.setShortlist({
          userId, caseId: active.case.caseId, requestId: "concurrent-shortlist", expectedVersion: active.case.taskVersion,
          candidateId: active.restaurant.readyCandidateIds[0]!, shortlisted: true,
        });
        assert.equal(intermediate.case.phase, "SEARCHING");
        await page.waitForFunction(async version => (await import(String("/assets/workspace/runtime.js"))).state.deferredView?.view.case.taskVersion === version, intermediate.case.taskVersion);
        if (!bufferSse) await page.evaluate(async () => (await import(String("/assets/workspace/runtime.js"))).state.stream.close());
        host.release();
        const latest = await terminal;
        assert.ok(latest.case.taskVersion > intermediate.case.taskVersion);
        if (bufferSse) await page.waitForFunction(() => document.querySelector(".case-link.active small")?.textContent === "Ready");
        else assert.ok(!deliveredVersions.includes(latest.case.taskVersion));
        assert.equal(await page.evaluate(async()=>(await import(String("/assets/workspace/runtime.js"))).state.view.case.taskVersion),pendingVersion,"the pending edit keeps the main Case projection frozen");
        assert.equal(await page.locator("#progress.has-card").isVisible(),!bufferSse,"progress reflects the authoritative deferred SSE while the Case stays frozen");
        deliver.release();
        const response = await rejected;
        assert.equal(response.status(), 409);
        const conflict = await response.json();
        assert.equal(conflict.actualVersion, latest.case.taskVersion);
        await page.getByText(conflict.error, { exact: true }).waitFor();
        await ready(page);
        assert.equal(await page.locator("#message").inputValue(), draft);
        assert.equal(gets.length, bufferSse ? 0 : 1);
        const persisted = await host.application.getCase(userId, view.case.caseId);
        assert.ok(!persisted.conversation.messages.some(message => message.content === draft));
        await alertAboveComposer(page);
        if (bufferSse) await screenshot(page, "round10-conflict-recovered");
        else {
          await screenshot(page, "round11-conflict-intermediate");
          await page.unroute("**/api/conversations/*/messages");
          await page.route("**/api/conversations/*/messages", route => route.fulfill({
            status: 503, json: { error: "Fixture unavailable" },
          }));
          await page.locator("#send").click();
          await page.getByText("Fixture unavailable", { exact: true }).waitFor();
          assert.equal(gets.length, 1, "a non-conflict failure does not fetch another Case snapshot");
          assert.equal(await page.locator("#message").inputValue(), draft);
        }
      } finally {
        unsubscribe();
        deliver.release();
      }
    });
  });
}

test("Round11 UI: prior-batch outlets still qualified for three guests appear in Find more without a removal label", { timeout: 30_000 }, async () => {
  await fixture({ extraCandidates: true, checkWholePool: true, laterBatchFirstOnRevision: true }, async (page, host) => {
    await signin(page);
    const { view } = await createPlan(page, "Dinner in Tokyo");
    const before = await host.application.getCase(userId, view.case.caseId);
    const prior = before.restaurant.presentedCandidateIds!;
    assert.equal(prior.length, 3);
    await updateRequirement(page, "Make it three people");
    await page.getByRole("button", { name: "3 guests", exact: true }).waitFor();
    await ready(page);
    const revised = await host.application.getCase(userId, view.case.caseId);
    assert.ok(prior.every(id => revised.restaurant.readyCandidateIds.includes(id)));
    assert.ok(prior.every(id => !revised.restaurant.presentedCandidateIds?.includes(id)));
    assert.deepEqual(revised.restaurant.revisionDiff?.removed, []);
    assert.equal(await page.locator("#removed-count").isVisible(), false);
    assert.doesNotMatch(await page.locator("#case-workspace").innerText(), /places? no longer match/);
    await screenshot(page, "round11-revision-no-removals");
    await nextBatch(page);
    const next = await host.application.getCase(userId, view.case.caseId);
    assert.deepEqual(next.restaurant.presentedCandidateIds, prior);
  });
});

for (const futureDraft of ["", "Keep a separate unsent follow-up"]) {
  test(`Round11 UI: a late submission ${futureDraft ? "preserves a replacement draft" : "clears the sent draft from its original plan"}`, { timeout: 30_000 }, async () => {
    await fixture({}, async (page, host) => {
      await signin(page);
      const { view } = await createPlan(page, "Dinner in Tokyo");
      const sent = "Make it three people";
      const composer = page.locator("#message");
      const captured = latch(), deliver = latch();
      await page.route("**/api/conversations/*/messages", async route => {
        const response = await route.fetch({ maxRedirects: 0 });
        captured.release();
        await deliver.ready;
        await route.fulfill({ response });
      });
      const returnToPlan = async () => {
        await byCase(page, view.case.caseId).click();
        await page.waitForFunction(id => document.querySelector<HTMLElement>(".case-link.active")?.dataset.caseId === id && (document.getElementById("send") as HTMLButtonElement).disabled === false, view.case.caseId);
      };
      try {
        await composer.fill(sent);
        const response = page.waitForResponse(r => r.request().method() === "POST" && r.url().endsWith("/messages"));
        await page.locator("#send").click();
        await captured.ready;
        await page.locator("#new-case").click();
        if (futureDraft) {
          await returnToPlan();
          assert.equal(await composer.inputValue(), sent);
          await composer.fill(futureDraft);
        }
        deliver.release();
        assert.equal((await response).status(), 200);
        await frames(page);
        if (!futureDraft) await returnToPlan();
        assert.equal(await composer.inputValue(), futureDraft);
        await page.locator("#new-case").click();
        await returnToPlan();
        assert.equal(await composer.inputValue(), futureDraft);
        const persisted = await host.application.getCase(userId, view.case.caseId);
        assert.equal(persisted.conversation.messages.filter(message => message.content === sent).length, 1);
      } finally {
        deliver.release();
      }
    });
  });
}

test("Round11 UI: a persisted departure opens its own source tab after the main tab changes plans", { timeout: 30_000 }, async () => {
  await fixture({ multiSlot: true }, async (page, host) => {
    await signin(page);
    const { view: a } = await createPlan(page, "First dinner");
    await page.locator("#new-case").click();
    const { view: b } = await createPlan(page, "Second dinner");
    await byCase(page, a.case.caseId).click();
    await ready(page);
    await page.getByRole("button", { name: "Time 19:30 on Mon, Nov 2", exact: true }).click();
    await page.locator("#choose").click();

    const captured = latch(), deliver = latch();
    const href = await page.locator("#departure").getAttribute("href");
    assert.match(href ?? "", /^https:\/\/www\.tablecheck\.com\/.+start_time=19%3A30/);
    const intercepted: string[] = [];
    await page.context().route(href!, async route => {
      intercepted.push(route.request().url());
      assert.equal(route.request().isNavigationRequest(), true);
      await route.fulfill({ status: 200, contentType: "text/html", body: "<title>Offline source tab</title><p>Fixture only</p>" });
    });
    let result: { url: string } | undefined;
    await page.route("**" + pathFor(a) + "/booking-departures", async route => {
      const upstream = await route.fetch({ maxRedirects: 0 });
      assert.equal(upstream.status(), 201);
      result = await upstream.json();
      captured.release();
      await deliver.ready;
      await route.fulfill({ response: upstream });
    });

    try {
      const popup = page.context().waitForEvent("page");
      await page.locator("#departure").click();
      const source = await popup;
      await captured.ready;
      assert.equal(source.url(), "about:blank");
      assert.equal(result?.url, href);
      const rows = await host.database.query<{ conversation_id: string; offer_id: string }>(
        "select conversation_id, offer_id from restaurant_booking_departures",
      );
      assert.equal(rows.rows.length, 1);
      assert.equal(rows.rows[0]?.conversation_id, a.case.conversationId);
      assert.match(rows.rows[0]?.offer_id ?? "", /19:30/);

      await byCase(page, b.case.caseId).click();
      await page.waitForFunction(id => document.querySelector<HTMLElement>(".case-link.active")?.dataset.caseId === id, b.case.caseId);
      const sourceReady = source.waitForURL(href!);
      deliver.release();
      await sourceReady;
      assert.equal(await source.title(), "Offline source tab");
      assert.equal(source.isClosed(), false);
      assert.deepEqual(intercepted, [href]);
      assert.equal(await byCase(page, b.case.caseId).evaluate(row => row.classList.contains("active")), true);
      assert.equal(await page.locator("#feedback").isVisible(), false);
      const returnKey = "praxis:workspace:" + userId + ":" + a.case.caseId + ":return";
      assert.match((await page.evaluate(key => localStorage.getItem(key), returnKey))!, /^departure:/);
      await byCase(page, a.case.caseId).click();
      await page.getByText("Did you get the booking?", { exact: true }).waitFor();
      assert.equal(await page.evaluate(key => localStorage.getItem(key), returnKey), null);
      assert.equal(source.isClosed(), false);
    } finally {
      deliver.release();
    }
  });
});

test("Round12 UI: an exhausted next batch stays empty after reload and keeps the old Saved row read-only", { timeout: 30_000 }, async () => {
  await fixture({ cachedCrossSourceDuplicate: { newCandidates: 3 } }, async page => {
    await signin(page);
    const { view } = await createPlan(page, "Dinner in Tokyo");
    const read = async (): Promise<RestaurantCaseView> => {
      const response = await page.request.get(pathFor(view));
      assert.equal(response.status(), 200);
      return (await response.json()).view;
    };
    const first = await read();
    const savedId = first.restaurant.presentedCandidateIds![0]!;
    assert.ok(first.restaurant.bookingHandoffs?.some(handoff => handoff.candidateId === savedId));
    await page.locator("#bookmark").click();
    await page.getByRole("button", { name: "Saved 1", exact: true }).waitFor();
    await nextBatch(page);
    const second = await read();
    assert.deepEqual(second.restaurant.presentedCandidateIds, ["fixture-cache-0", "fixture-cache-1", "fixture-cache-2"]);
    for (let i = 0; i < 3; i++) await page.locator("#next").click();
    const requested = page.waitForResponse(r => r.request().method() === "POST" && r.url().endsWith("/another-batch"));
    await page.locator("#find-more").click();
    assert.equal((await requested).status(), 200);
    await page.waitForFunction(() => document.querySelector(".case-link.active small")?.textContent === "No verified results");
    const assertEmpty = async () => {
      const latest = await read();
      assert.equal(latest.case.phase, "NO_VERIFIED_RESULT");
      assert.equal(latest.restaurant.readStatus.kind, "NO_QUALIFIED_RESULTS");
      assert.deepEqual(latest.restaurant.readyCandidateIds, []);
      assert.equal(latest.restaurant.presentedCandidateIds, undefined);
      assert.equal(latest.restaurant.conditionStates, undefined);
      assert.deepEqual(latest.restaurant.bookingHandoffs, []);
      await page.locator("#empty-state").waitFor();
      assert.equal(await page.locator("#candidate-panel").isVisible(), false);
      assert.equal(await page.locator("#choose").isVisible(), false);
    };
    await assertEmpty();
    await page.reload();
    await assertEmpty();
    await screenshot(page, "round12-exhausted-batch-reload");
    await page.locator("#saved").click();
    const saved = page.locator(`#saved-list .saved-row[data-candidate-id="${savedId}"]`);
    assert.equal(await saved.isDisabled(), true);
    assert.equal(await saved.innerText(), "Fixture Sushi");
  }, true);
});

test("Round13 UI: optional condition chips can be removed without touching the draft", { timeout: 30_000 }, async () => {
  await fixture({ revisionScenario: "structured", revisionCuisine: true }, async (page, host) => {
    await signin(page);
    const { view } = await createPlan(page, "Dinner in Tokyo");
    await updateRequirement(page, "For three people at 20:00 show two options under 10000 JPY");
    const chips = page.locator("#request-conditions");
    const chip = (name: string) => chips.getByRole("button", { name, exact: true });
    for (const label of ["Tokyo", "Mon, Nov 2", "20:00–20:30", "3 guests"]) {
      await chip(label).click();
      assert.equal(await chips.getByRole("button", { name: /^Remove / }).count(), 0, label);
      await chips.getByRole("button", { name: "Cancel condition change" }).click();
    }

    const before = await host.application.getCase(userId, view.case.caseId);
    assert.ok(before.restaurant.intentDraft);
    assert.ok(before.restaurant.intentDraft.criteria.some(item => item.text === "tempura"));
    assert.equal(before.restaurant.intentDraft.budgetPerPerson?.max, 10_000);
    await page.locator("#message").fill("Keep this unsent note");
    for (const label of ["tempura", "¥10,000 per guest"]) {
      await chip(label).click();
      const remove = chips.getByRole("button", { name: "Remove " + label, exact: true });
      if (label === "tempura") await screenshot(page, "round13-optional-chip-remove");
      const posted = page.waitForResponse(r => r.request().method() === "POST" && r.url().endsWith("/messages"));
      await remove.click();
      const response = await posted;
      assert.equal(response.status(), 200);
      assert.equal(response.request().postDataJSON().message, "Remove " + label);
      await remove.waitFor({ state: "detached" });
      assert.equal(await chip(label).count(), 0);
      assert.equal(await page.locator("#message").inputValue(), "Keep this unsent note");
      const stored = await host.application.getCase(userId, view.case.caseId);
      assert.ok(stored.restaurant.intentDraft);
      assert.equal(stored.restaurant.intentDraft.criteria.some(item => item.text === "tempura"), false);
      assert.equal(stored.restaurant.intentDraft.budgetPerPerson?.max, label === "tempura" ? 10_000 : undefined);
    }
  });
});

test("Round13 UI: the card keeps short source labels while About omits category excerpts", { timeout: 30_000 }, async () => {
  const sourceText = "Chinese, ＣＨＩＮＥＳＥ, Casual\nlunch, Book a table!, Private dining rooms for your next company celebration, Dumpling, Izakaya, Bistro";
  const matchReasons = [
    "Address explicitly matches requested area: Tokyo",
    "Source coordinates within 1000 m of Tokyo",
    "Fixture match for the requested area",
  ];
  await fixture({ provider: "TABELOG", cuisineDisagreement: sourceText, matchReasons }, async (page, host) => {
    await signin(page);
    const { view } = await createPlan(page, "Dinner in Tokyo");
    const persisted = await host.application.getCase(userId, view.case.caseId);
    const id = persisted.restaurant.presentedCandidateIds![0];
    assert.deepEqual(persisted.restaurant.candidates.find(c => c.restaurant.id === id)?.matchReasons, matchReasons);
    assert.equal(await page.locator("#recommendation").innerText(), matchReasons[2]);
    const labels = page.locator("#source-categories p");
    assert.deepEqual(await labels.allTextContents(), [
      "Google Maps ↗ cantonese restaurant, dim sum restaurant",
      "Tabelog ↗ Chinese, Dumpling, Izakaya",
    ]);
    await labels.last().scrollIntoViewIfNeeded();
    await screenshot(page, "round13-compact-source-categories");

    await page.locator("#details-button").click();
    const about=page.locator("#details-content");
    assert.equal(await about.locator(".about-categories, details, .citation-footer").count(),0);
    assert.ok(!(await about.textContent())?.includes(sourceText));
    assert.ok(persisted.restaurant.currentFactEvidence.some(fact=>fact.sourceFieldQuotes?.some(quote=>quote.quote===sourceText)));
  });
});

test("Round13 UI: selected slot keeps its place in the two-row mobile grid", { timeout: 30_000 }, async () => {
  const slots = ["19:00", "19:05", "19:10", "19:15", "19:20", "19:30"];
  await fixture({ multiSlot: slots }, async (page) => {
    await signin(page);
    await createPlan(page, "Dinner in Tokyo");
    const options = page.locator(".slot-options .slot-time");
    assert.deepEqual(await options.allTextContents(), slots);
    const measure = () => options.evaluateAll(nodes => nodes.map(node => {
      const { x, y, width } = node.getBoundingClientRect();
      return { x, y, width, weight: getComputedStyle(node).fontWeight, align: getComputedStyle(node).textAlign };
    }));
    await options.last().scrollIntoViewIfNeeded();
    const before = await measure();
    assert.equal(new Set(before.map(slot => slot.y)).size, 2);
    assert.ok(before.every(slot => slot.width === 60 && slot.weight === "500" && slot.align === "center"), JSON.stringify(before));
    const secondRow = before.findIndex(slot => slot.y !== before[0]?.y);
    assert.ok(secondRow > 0);
    for (const [column, slot] of before.slice(secondRow).entries()) assert.equal(slot.x, before[column]?.x);
    await options.last().click();
    assert.equal(await options.last().getAttribute("aria-pressed"), "true");
    assert.equal(await page.locator('.slot-time[aria-pressed="true"]').count(), 1);
    assert.deepEqual(await measure(), before);
    await screenshot(page, "round13-two-row-slot-grid");
  }, true);
});

test("Round13 UI: the revision summary expands above the result card", { timeout: 30_000 }, async () => {
  await fixture({ revisionScenario: "structured" }, async (page) => {
    await signin(page);
    await createPlan(page, "Dinner in Tokyo");
    await updateRequirement(page, "For three people at 20:00 show two options under 10000 JPY");
    const changes = page.locator("#revision-changes");
    await changes.waitFor();
    await changes.locator("summary").click();
    await page.locator("#removed-list").waitFor();
    assert.equal(await changes.evaluate(node => {
      const progress = document.getElementById("progress")!;
      const card = document.getElementById("candidate-panel")!;
      return !!(progress.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING)
        && node.getBoundingClientRect().bottom < card.getBoundingClientRect().top;
    }), true);
    await screenshot(page, "round13-revision-above-card");
  });
});

test("Round13 UI: About shows pending and newest-first answers and keeps rejected questions", { timeout: 30_000 }, async () => {
  const first = "Does this place require a card?";
  const followUp = "What does the page say about card acceptance?";
  const captured = latch(), answer = latch();
  await fixture({
    questions: { async beforeAnswer(input) { if (input.question === followUp) { captured.release(); await answer.ready; } } },
    questionCitations: true,
    cuisineDisagreement: true,
  }, async (page, host) => {
    try {
      await signin(page);
      const { view } = await createPlan(page, "Dinner in Tokyo");
      const current = await host.application.getCase(userId, view.case.caseId);
      await expire(page, host, current, current.restaurant.presentedCandidateIds![0]!);
      await page.locator("#details-button").click();
      const composer = page.locator("#message");
      const send = page.locator("#send");
      const refresh = page.locator("#refresh");
      const submit = async (question: string) => {
        const response = page.waitForResponse(r => r.request().method() === "POST" && r.url().endsWith("/questions"));
        await composer.fill(question);
        await send.click();
        assert.equal((await response).status(), 200);
      };
      await submit(first);
      await page.locator("#answer-sheet").waitFor();
      await page.locator("#answer-dismiss").click();
      assert.equal(await composer.inputValue(), "");

      await submit(followUp);
      await captured.ready;
      const pending = page.locator("#asked-pending");
      await pending.waitFor();
      await page.waitForFunction(() => (document.querySelector("#message") as HTMLTextAreaElement).value === "");
      assert.equal(await pending.locator("p").first().innerText(), followUp);
      assert.equal(await pending.getByRole("status").innerText(), "Checking the page…");
      assert.equal(await send.getAttribute("aria-busy"), "true");
      assert.equal(await send.isDisabled(), true);
      assert.equal(await refresh.isDisabled(), true);
      assert.equal(await refresh.getAttribute("aria-busy"), null);
      assert.equal(await refresh.innerText(), "Refresh availability");
      assert.equal(await page.locator("#asked-question").innerText(), first);
      assert.equal(await page.locator("#asked-history .asked-item:visible").first().getAttribute("id"), "asked-pending");
      await pending.scrollIntoViewIfNeeded();
      await screenshot(page, "round13-question-pending");

      await composer.fill("Keep this unsent follow-up");
      await composer.press("Enter");
      assert.equal(host.questionRequests.length, 2);
      answer.release();
      await page.locator("#answer-sheet").waitFor();
      await page.locator("#answer-dismiss").click();
      await pending.waitFor({ state: "hidden" });
      assert.equal(await composer.inputValue(), "Keep this unsent follow-up");
      assert.equal(await send.isEnabled(), true);
      assert.equal(await refresh.isEnabled(), true);
      const history = page.locator("#asked-history .asked-item:visible");
      assert.deepEqual(await history.locator(":scope > p:first-child").allTextContents(), [followUp, first]);
      assert.equal(await history.locator("details").count(), 2);
      assert.equal(await history.locator("details[open]").count(), 0);
      assert.deepEqual(await history.evaluateAll(items => items.map(item => [
        getComputedStyle(item).backgroundColor,
        getComputedStyle(item).borderRadius,
        getComputedStyle(item.firstElementChild!).fontWeight,
      ])), [["rgb(245, 246, 249)", "14px", "600"], ["rgb(245, 246, 249)", "14px", "600"]]);
      await history.last().scrollIntoViewIfNeeded();
      await screenshot(page, "round13-question-history");
      await history.first().locator("summary").click();
      assert.match(await history.first().innerText(), /Checked Oct 29/);
      const about = page.locator("#details-content");
      assert.equal(await about.locator(".about-categories").count(),0);
      assert.equal(await about.locator("details").count(),0);
      assert.equal(await about.locator(".citation-footer").count(),0,"category-only evidence should not leave an orphan footer");

      await page.route("**" + pathFor(view) + "/questions", route => route.fulfill({
        status: 503, json: { error: "Fixture question unavailable" },
      }));
      await send.click();
      await page.getByText("Fixture question unavailable", { exact: true }).waitFor();
      assert.equal(await composer.inputValue(), "Keep this unsent follow-up");
      assert.equal(await send.isEnabled(), true);
      assert.equal(host.questionRequests.length, 2);
    } finally {
      answer.release();
    }
  });
});

for (const entry of ["About", "Handoff Back", "other tab", "renewal"] as const) {
  const mobile = entry === "Handoff Back" || entry === "About";
  const retains = entry === "renewal";
  test(`Round14 UI: ${entry} refresh ${retains ? "rebinds the same time" : "requires explicit slot reselection"}`, { timeout: 30_000 }, async () => {
    const options: Options = { multiSlot: true, sourceValidityMs: 60_000 };
    await fixture(options, async (page, host) => {
      await signin(page);
      const { view } = await createPlan(page, "Dinner in Tokyo");
      const before = await host.application.getCase(userId, view.case.caseId);
      const id = before.restaurant.presentedCandidateIds![0]!;
      const former = before.restaurant.availability[id]!.find(slot => slot.dateTime.includes("19:30"))!;
      const title = (time: string) => `Time ${time} on Mon, Nov 2`;
      await page.getByRole("button", { name: title("19:30") }).click();

      const tab = entry === "other tab" || retains ? await page.context().newPage() : page;
      if (tab !== page) {
        await tab.clock.install({ time: host.clock.now() });
        await tab.goto("/");
        await ready(tab);
      }
      if (entry === "Handoff Back") {
        await page.locator("#choose").click();
        await expire(page, host, before, id);
        assert.equal(await page.locator("#departure-title").innerText(), "Check availability again");
        host.hold();
      } else { await expire(tab, host, before, id); await tab.locator("#details-button").click(); }
      options.multiSlot = retains;
      options.offerRevision = "reissued";
      const response = tab.waitForResponse(r => r.request().method() === "POST" && r.url().endsWith("/refresh"));
      await tab.locator(entry === "Handoff Back" ? "#departure" : "#refresh").click();
      assert.equal((await response).status(), 200);
      if (entry === "Handoff Back") {
        await host.waitForCheck();
        await page.locator("#handoff-back").click();
        host.release();
      } else if (tab === page) await tab.locator("#details-back").click();
      const activeTime = page.getByRole("button", { name: title(retains ? "19:30" : "19:00") });
      await page.waitForFunction(offerId =>
        document.querySelector(`[data-offer-id="${CSS.escape(offerId)}"]`) !== null
        && document.querySelector("#card-counter")?.textContent === "1 of 3",
      (retains ? former.id : before.restaurant.availability[id]![0]!.id) + ":reissued");
      const summary = await host.application.getCase(userId, view.case.caseId);
      assert.equal(summary.restaurant.requirementRevision, before.restaurant.requirementRevision);
      assert.equal(summary.restaurant.presentedCandidateIds?.[0], id);
      assert.equal(await activeTime.getAttribute("aria-pressed"), String(retains));
      assert.equal(await page.locator("#choose").isEnabled(), retains);
      if (!retains) {
        assert.equal(await page.locator('.slot-time[aria-pressed="true"]').count(), 0);
        await page.getByText("Choose a new time to continue.", { exact: true }).waitFor();
        if (tab !== page) await tab.close();
        await page.reload();
        await page.getByText("Choose a new time to continue.", { exact: true }).waitFor();
        assert.equal(await page.locator("#choose").isDisabled(), true);
        if (entry === "About") await screenshot(page, "round14-about-slot-reselect");
        await activeTime.click();
      }
      await page.locator("#choose").click();
      assert.match(await page.locator("#departure").getAttribute("href") ?? "", retains ? /19%3A30/ : /19%3A00/);
      assert.match(await page.locator("#handoff-slot").inputValue(), /:reissued$/);
    }, mobile);
  });
}

for (const replacement of [false, true]) {
  test(`Round14 UI: delayed Stop ${replacement ? "does not stop the replacement read" : "is harmless after delivery"}`, { timeout: 30_000 }, async () => {
    await fixture({ staged: true }, async (page, host) => {
      await signin(page);
      const { view } = await createPlan(page, "Dinner in Tokyo", false);
      await host.waitForCheck();
      const started = await host.application.getCase(userId, view.case.caseId);
      const captured = latch(), releaseStop = latch();
      await page.route("**" + pathFor(view) + "/run", async route => {
        captured.release();
        await releaseStop.ready;
        await route.continue();
      });
      const response = page.waitForResponse(r => r.request().method() === "DELETE" && r.url().endsWith("/run"));
      try {
        await page.locator("#stop").click();
        await captured.ready;
        const finished = latch();
        const unsubscribe = host.application.subscribeCaseUpdates(current => {
          if (current.case.caseId === view.case.caseId && !current.restaurant.progress.active && current.case.phase === "PRESENT_RESULTS") finished.release();
        });
        host.release();
        await finished.ready;
        unsubscribe();
        const delivered = await host.application.getCase(userId, view.case.caseId);
        if (replacement) {
          host.hold();
          const refresh = await page.request.post(pathFor(view) + "/refresh", {
            data: { taskVersion: delivered.case.taskVersion, requestId: "round14-replacement" },
          });
          assert.equal(refresh.status(), 200);
          await host.waitForCheck();
          const active = await host.application.getCase(userId, view.case.caseId);
          assert.equal(active.restaurant.sourceReadContext?.runId, started.restaurant.sourceReadContext?.runId, "refresh reuses the investigation scope");
          assert.equal(active.restaurant.progress.active, true);
          releaseStop.release();
          const stopped = await response;
          assert.equal(stopped.status(), 409);
          const payload = await stopped.json();
          assert.equal(payload.actualVersion, active.case.taskVersion);
          assert.equal(host.providerCalls.at(-1)?.aborted, false);
          host.release();
          await ready(page);
          assert.ok(host.providerCalls.at(-1)?.completed);
        } else {
          releaseStop.release();
          const stopped = await response;
          assert.equal(stopped.status(), 200);
          assert.equal((await stopped.json()).view.case.phase, "PRESENT_RESULTS");
          await ready(page);
          assert.equal(await page.locator("#error").isVisible(), false);
        }
        assert.equal((await response).request().postDataJSON().readRunId, started.restaurant.sourceReadContext?.runId);
      } finally { releaseStop.release();host.release(); }
    });
  });
}

for (const replacement of ["", "A different unsent question"]) {
  test(`Round14 UI: late About acceptance ${replacement ? "preserves a replacement draft" : "clears only the sent draft"}`, { timeout: 30_000 }, async () => {
    await fixture({ questions: true }, async page => {
      await signin(page);
      const { view: a } = await createPlan(page, "First dinner");
      await page.locator("#new-case").click();
      const { view: b } = await createPlan(page, "Second dinner");
      await byCase(page, a.case.caseId).click();
      await byCase(page, a.case.caseId).and(page.locator(".active")).waitFor();await ready(page);
      await page.locator("#details-button").click();
      const question = "Does this place require a card?";
      const captured = latch(), deliver = latch();
      await page.route("**" + pathFor(a) + "/questions", async route => {
        captured.release();
        await deliver.ready;
        await route.continue();
      });
      const message = page.locator("#message");
      try {
        await message.fill(question);await page.locator("#send").click();await captured.ready;
        if (replacement) await message.fill(replacement);
        await byCase(page, b.case.caseId).click();
        await byCase(page, b.case.caseId).and(page.locator(".active")).waitFor();await ready(page);
        await message.fill("Keep Plan B's independent draft");
        const posted = page.waitForResponse(r => r.request().method() === "POST" && r.url().endsWith("/questions"));
        deliver.release();assert.equal((await posted).status(), 200);await frames(page);
        assert.equal(await message.inputValue(), "Keep Plan B's independent draft");
        await byCase(page, a.case.caseId).click();await page.locator("#details").waitFor();
        assert.equal(await message.inputValue(), replacement);
        await page.getByText(question, { exact: true }).and(page.locator("#asked-question")).waitFor();
        assert.equal(await page.locator("#answer-sheet").isVisible(), false);
      } finally { deliver.release(); }
    });
  });
}

test("Round14 UI: an exhausted revised batch hides stale additions after reload", { timeout: 30_000 }, async () => {
  await fixture({ extraCandidates: true, checkWholePool: true, laterBatchFirstOnRevision: true }, async (page, host) => {
    await signin(page);
    const { view } = await createPlan(page, "Dinner in Tokyo");
    await updateRequirement(page, "Make it three people");
    await ready(page);
    await page.getByText("3 new places", { exact: true }).waitFor();
    await nextBatch(page);
    for (let i = 0; i < 3; i++) await page.locator("#next").click();
    const requested = page.waitForResponse(r => r.request().method() === "POST" && r.url().endsWith("/another-batch"));
    await page.locator("#find-more").click();
    assert.equal((await requested).status(), 200);
    await page.locator("#empty-state").waitFor();
    const exhausted = await host.application.getCase(userId, view.case.caseId);
    assert.equal(exhausted.restaurant.readStatus.kind, "NO_QUALIFIED_RESULTS");
    assert.equal(exhausted.restaurant.revisionDiff?.added.length, 3, "the archived revision difference remains authoritative");
    assert.equal(await page.locator("#added-count").isVisible(), false);
    await page.reload();
    await page.locator("#empty-state").waitFor();
    assert.equal(await page.locator("#revision-changes").isVisible(), false);
    await screenshot(page, "round14-exhausted-revision");
  });
});

test("Round14 UI: a claimed return prompt survives switching plans and is answered once", { timeout: 30_000 }, async () => {
  await fixture({}, async (page, host) => {
    await signin(page);
    const { view: a } = await createPlan(page, "First dinner");
    await page.locator("#new-case").click();
    const { view: b } = await createPlan(page, "Second dinner");
    await byCase(page, a.case.caseId).click();
    await byCase(page, a.case.caseId).and(page.locator(".active")).waitFor();await ready(page);
    await page.locator("#choose").click();
    const href = await page.locator("#departure").getAttribute("href");
    assert.ok(href);
    await page.context().route(href, route => route.fulfill({ status: 200, body: "Fixture source tab" }));
    const captured = latch(), deliver = latch();
    let claims = 0;
    await page.route("**" + pathFor(a) + "/booking-feedback/claim", async route => {
      claims++;
      const upstream = await route.fetch({ maxRedirects: 0 });
      assert.equal(upstream.status(), 200);
      assert.ok((await upstream.json()).prompt);
      captured.release();await deliver.ready;
      await route.fulfill({ response: upstream });
    });
    try {
      const popup = page.waitForEvent("popup");
      await page.locator("#departure").click();
      const source = await popup;
      await source.waitForURL(href);
      await source.close();
      await page.evaluate(() => window.dispatchEvent(new Event("focus")));
      await captured.ready;
      await byCase(page, b.case.caseId).click();
      await byCase(page, b.case.caseId).and(page.locator(".active")).waitFor();await ready(page);
      const claim = page.waitForResponse(r => r.url().endsWith("/booking-feedback/claim"));
      deliver.release();assert.equal((await claim).status(), 200);await frames(page);
      assert.equal(await page.locator("#feedback").isVisible(), false);
      const returnKey = "praxis:workspace:" + userId + ":" + a.case.caseId + ":return";
      assert.equal(await page.evaluate(key => localStorage.getItem(key), returnKey), null);
      await byCase(page, a.case.caseId).click();await page.locator("#feedback").waitFor();
      await screenshot(page, "round14-feedback-after-return");
      const answered = page.waitForResponse(r => r.request().method() === "POST" && r.url().endsWith("/booking-feedback"));
      await page.getByRole("button", { name: "Not yet", exact: true }).click();
      assert.equal((await answered).status(), 200);
      await page.locator("#feedback").waitFor({ state: "hidden" });
      await page.reload();await page.locator("#handoff").waitFor();
      await page.evaluate(() => window.dispatchEvent(new Event("focus")));await frames(page);
      assert.equal(claims, 1);
      assert.equal(await page.locator("#feedback").isVisible(), false);
      assert.equal((await host.application.getCase(userId, a.case.caseId)).restaurant.bookingFeedbackAvailable, false);
    } finally { deliver.release(); }
  });
});

for(const scenario of ["failed refresh","other tab Back"] as const)test("Round15 UI: explicit 19:30 survives "+scenario,{timeout:30000},async()=>{
 const options:Options={multiSlot:true,sourceValidityMs:60000};
 await fixture(options,async(page,host)=>{
  await signin(page);const {view}=await createPlan(page,"Dinner in Tokyo");
  await page.getByRole("button",{name:"Time 19:30 on Mon, Nov 2",exact:true}).click();
  if(scenario==="other tab Back"){
   const other=await page.context().newPage();await other.clock.install({time:host.clock.now()});await other.goto("/");await ready(other);
   await other.locator("#choose").click();await other.locator("#handoff-back").click();await other.close();
  }else{
   options.outcome="all-sources-failed";
   const current=await host.application.getCase(userId,view.case.caseId);
   await expire(page, host, current, current.restaurant.presentedCandidateIds![0]!);
   await page.locator("#details-button").click();await page.locator("#refresh").click();await page.locator("#empty-state").waitFor();
   host.recoverSources();options.multiSlot=false;
   await page.locator("#empty-retry").click();
   await page.waitForFunction(()=>document.querySelector("#card-counter")?.textContent==="1 of 3");
  }
  await page.reload();await page.locator("#candidate-panel").waitFor();
  if(scenario==="other tab Back"){
   assert.equal(await page.getByRole("button",{name:"Time 19:30 on Mon, Nov 2",exact:true}).getAttribute("aria-pressed"),"true");
   const other=await page.context().newPage();await other.clock.install({time:host.clock.now()});await other.goto("/");await ready(other);
   await page.locator("#choose").click();
   await other.getByRole("button",{name:"Time 19:00 on Mon, Nov 2",exact:true}).click();
   await frames(page);
   assert.equal(await page.locator("#handoff").isVisible(),true,"other tab's explicit choice is isolated");
   assert.match(await page.locator("#departure").getAttribute("href")??"",/start_time=19%3A30/);
   await other.close();
  }else{
   assert.equal(await page.locator('.slot-time[aria-pressed="true"]').count(),0);
   assert.equal(await page.locator("#choose").isDisabled(),true);
  }
  assert.equal((await host.application.getCase(userId,view.case.caseId)).case.phase,"PRESENT_RESULTS");
 });
});


for(const action of ["next","Back","Saved","Find more"] as const)test("Round16 UI: other tab "+action+" preserves this tab's missing 19:30 choice",{timeout:30_000},async()=>{
 const options:Options={multiSlot:true,sourceValidityMs:60000};
 await fixture(options,async(page,host)=>{
  const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
  await signin(page);const {view}=await createPlan(page,"Dinner in Tokyo");
  const current=await host.application.getCase(userId,view.case.caseId);
  const id=current.restaurant.presentedCandidateIds![0]!;
  await page.getByRole("button",{name:"Time 19:30 on Mon, Nov 2",exact:true}).click();
  const other=await page.context().newPage();await other.clock.install({time:host.clock.now()});await other.goto("/");await ready(other);
  options.multiSlot=false;await expire(other, host, current, id);await other.locator("#details-button").click();
  await other.locator("#refresh").click();
  await page.waitForFunction(()=>document.querySelectorAll('.slot-time').length===1&&document.querySelector<HTMLButtonElement>("#choose")?.disabled===true);
  const scope=JSON.stringify([userId,view.case.caseId,current.restaurant.requirementRevision,id]),selectionKey="praxis:slot:"+scope;
  await other.locator("#details-back").click();
  if(action==="next")await other.locator("#next").click();
  if(action==="Back"){await other.locator("#choose").click();await other.locator("#handoff-back").click();}
  if(action==="Saved"){await other.locator("#saved").click();await other.locator("#saved-back").click();}
  if(action==="Find more"){
   await other.locator("#next").click();await other.locator("#next").click();await other.locator("#next").click();
   await other.locator("#find-more").click();await other.locator("#empty-state").waitFor();
  }
  await page.reload();
  if(action==="Find more"){
   await page.locator("#empty-state").waitFor();assert.equal(await page.locator("#handoff").isVisible(),false);assert.equal(await page.locator("#choose").isVisible(),false);
  }else{
   await page.locator("#candidate-panel").waitFor();assert.equal(await page.locator("#choose").isDisabled(),true);
   assert.equal(await page.locator('.slot-time[aria-pressed="true"]').count(),0);
   await page.locator("#choose").dispatchEvent("click");assert.equal(await page.locator("#handoff").isVisible(),false);
  }
  assert.match(await page.evaluate(key=>sessionStorage.getItem(key),selectionKey)??"",/19:30/);
  if(action==="next")await screenshot(page,"round16-tab-next-reselect");
  assert.deepEqual(errors,[]);await other.close();
 });
});


for(const mobile of [false,true])for(const boundary of ["SSE","reload","same-revision choice"] as const)test(`Round17 UI: ${mobile?"mobile":"desktop"} Handoff ${boundary} distinguishes changed conditions from another tab's slot`,{timeout:30_000},async()=>{
 await fixture({multiSlot:true,sourceValidityMs:60_000},async(page,host)=>{
  await signin(page);const {view}=await createPlan(page,"Dinner in Tokyo");
  const initial=await host.application.getCase(userId,view.case.caseId),candidateId=initial.restaurant.presentedCandidateIds![0]!;
  const chosen=initial.restaurant.availability[candidateId]!.find(o=>o.dateTime.includes("19:30"))!;
  await page.getByRole("button",{name:"Time 19:30 on Mon, Nov 2",exact:true}).click();await page.locator("#choose").click();
  await page.locator("#handoff").waitFor();assert.match(await page.locator("#departure").getAttribute("href")??"",/start_time=19%3A30/);
  const departures=trackRequests(page,"POST",pathFor(initial)+"/booking-departures");
  const other=await page.context().newPage();await other.clock.install({time:host.clock.now()});await other.goto("/");await ready(other);
  try{
   if(boundary==="same-revision choice"){
    await other.getByRole("button",{name:"Time 19:00 on Mon, Nov 2",exact:true}).click();await frames(page);
    assert.equal(await page.locator("#handoff").isVisible(),true);
    assert.equal(await page.locator("#handoff-slot").inputValue(),chosen.id);
    assert.match(await page.locator("#departure").getAttribute("href")??"",/start_time=19%3A30/);
    await page.reload();await page.locator("#handoff").waitFor();assert.equal(await page.locator("#handoff-slot").inputValue(),chosen.id);
    assert.equal(departures.length,0);return;
   }
   if(boundary==="reload")await page.evaluate(async()=>{const {state}=await import(String("/assets/workspace/runtime.js"));state.stream?.close();});
   host.hold();
   await other.getByRole("button",{name:"2 guests",exact:true}).click();
   await other.getByRole("spinbutton",{name:"Edit 2 guests",exact:true}).fill("3");
   const editing=other.waitForResponse(r=>r.request().method()==="POST"&&r.url().endsWith("/messages"));
   await other.getByRole("button",{name:"Save",exact:true}).click();assert.equal((await editing).status(),200);
   await host.waitForCheck();
   if(boundary==="SSE"){
    await page.locator("#handoff").waitFor({state:"hidden"});
    assert.equal(await page.locator("#progress").isVisible(),true,"exit is immediate, before the replacement source read completes");
   }else assert.equal(await page.locator("#handoff").isVisible(),true,"the closed stream leaves the old tab unchanged until reload");
   host.release();await ready(other);
   const latest=await host.application.getCase(userId,view.case.caseId);
   assert.ok(latest.restaurant.requirementRevision>initial.restaurant.requirementRevision);
   assert.equal(latest.restaurant.intentDraft?.partySize,3);
   assert.ok(latest.restaurant.availability[candidateId]!.some(o=>o.partySize===3&&o.dateTime.includes("19:30")));
   assert.ok(latest.restaurant.availability[candidateId]!.some(o=>o.partySize===3&&o.dateTime.includes("19:00")));
   if(boundary==="reload")await page.reload();
   await page.locator("#candidate-panel").waitFor();
   assert.equal(await page.locator("#handoff").isVisible(),false);assert.equal(await page.locator("#departure").isVisible(),false);
   assert.equal(await page.locator("#error").isVisible(),false);
   await assertReconfirmation(page);
   assert.equal(departures.length,0);
   const before=await host.database.query<{count:number}>("SELECT count(*)::int AS count FROM restaurant_booking_departures WHERE conversation_id = $1",[view.case.conversationId]);
   assert.equal(before.rows[0]!.count,0);
   await screenshot(page,`round17-${mobile?"mobile":"desktop"}-${boundary.toLowerCase()}-revision-exit`);
   await screenshot(page,`round18-${mobile?"mobile":"desktop"}-${boundary.toLowerCase()}-reconfirm`);
   if(boundary==="SSE"){
    await page.reload();await page.locator("#candidate-panel").waitFor();await assertReconfirmation(page);
    await screenshot(page,`round18-${mobile?"mobile":"desktop"}-reconfirm-after-f5`);
   }
   await page.getByRole("button",{name:"Time 19:30 on Mon, Nov 2",exact:true}).click();await page.locator("#choose").click();
   const selected=await page.locator("#handoff-slot").inputValue();
   assert.equal(latest.restaurant.availability[candidateId]!.find(o=>o.id===selected)?.partySize,3);
   assert.match(await page.locator("#departure").getAttribute("href")??"",/start_time=19%3A30/);
   const departing=page.waitForResponse(r=>r.request().method()==="POST"&&r.url().endsWith("/booking-departures"));
   await page.locator("#departure").click();assert.equal((await departing).status(),201);
   const after=await host.database.query<{candidate_id:string;offer_id:string}>("SELECT candidate_id,offer_id FROM restaurant_booking_departures WHERE conversation_id = $1",[view.case.conversationId]);
   assert.deepEqual(after.rows,[{candidate_id:candidateId,offer_id:selected}]);
  }finally{host.release();await other.close();}
 },mobile);
});

for(const mobile of [false,true])test(`Round17 UI: ${mobile?"mobile":"desktop"} superseded semantic edit returns 409 and keeps its draft`,{timeout:30_000},async()=>{
 const entered=latch(),release=latch();
 await fixture({beforeSemantic:async message=>{if(message==="Change 2 guests to 3"){entered.release();await release.ready;}}},async(page,host)=>{
  try{
   await signin(page);const {view}=await createPlan(page,"Dinner in Tokyo");
   const other=await page.context().newPage();await other.clock.install({time:host.clock.now()});await other.goto("/");await ready(other);
   const expected=(await host.application.getCase(userId,view.case.caseId)).case.taskVersion;
   const rejected=page.waitForResponse(r=>r.request().method()==="POST"&&r.url().endsWith("/messages"));
   await page.locator("#message").fill("Change 2 guests to 3");await page.locator("#send").click();await entered.ready;
   const accepted=other.waitForResponse(r=>r.request().method()==="POST"&&r.url().endsWith("/messages"));
   await other.locator("#message").fill("Change 2 guests to 4");await other.locator("#send").click();
   const winner=await accepted;assert.equal(winner.status(),200);assert.equal(winner.request().postDataJSON().taskVersion,expected);
   await ready(other);const latest=await host.application.getCase(userId,view.case.caseId);
   assert.equal(latest.restaurant.intentDraft?.partySize,4);
   release.release();const loser=await rejected;
   assert.equal(loser.request().postDataJSON().taskVersion,expected);
   const conflict=await loser.json();assert.equal(loser.status(),409,JSON.stringify(conflict));assert.equal(conflict.actualVersion,latest.case.taskVersion);
   await page.getByText(conflict.error,{exact:true}).waitFor();await page.getByRole("button",{name:"4 guests",exact:true}).waitFor();
   assert.equal(await page.locator("#message").inputValue(),"Change 2 guests to 3");assert.equal(await page.locator("#send").isEnabled(),true);
   const persisted=await host.application.getCase(userId,view.case.caseId);
   assert.ok(persisted.conversation.messages.some(m=>m.role==="USER"&&m.content==="Change 2 guests to 4"));
   assert.ok(!persisted.conversation.messages.some(m=>m.role==="USER"&&m.content==="Change 2 guests to 3"));
   await alertAboveComposer(page);await screenshot(page,`round17-${mobile?"mobile":"desktop"}-concurrent-edit-conflict`);
   await other.close();
  }finally{release.release();}
 },mobile);
});


async function assertReconfirmation(page:Page){
 await page.locator("#delivery-slots").getByText("Plan conditions changed. Confirm the time again.",{exact:true}).waitFor();
 assert.notEqual(await page.locator("#error").textContent(),"Plan conditions changed. Confirm the time again.","the card is the only copy of the notice");
 assert.equal(await page.locator('.slot-time[aria-pressed="true"]').count(),0);
 assert.equal(await page.locator("#choose").isDisabled(),true);
 await page.locator("#choose").dispatchEvent("click");assert.equal(await page.locator("#handoff").isVisible(),false);
}

for(const mobile of [false,true])for(const navigation of ["next","Saved","own edit"] as const)test(`Round18 UI: ${mobile?"mobile":"desktop"} explicit ${navigation} restaurant change clears reconfirmation and own card edit stays ordinary`,{timeout:30_000},async()=>{
 await fixture({multiSlot:true},async(page,host)=>{
  await signin(page);const {view}=await createPlan(page,"Dinner in Tokyo");
  if(navigation==="Saved"){
   await page.locator("#next").click();await page.locator("#bookmark").click();await page.locator("#previous").click();
  }
  await page.getByRole("button",{name:"Time 19:30 on Mon, Nov 2",exact:true}).click();await page.locator("#choose").click();
  const other=await page.context().newPage();await other.clock.install({time:host.clock.now()});await other.goto("/");await ready(other);
  try{
   await updateRequirement(other,"Change 2 guests to 3");await ready(other);
   await page.locator("#candidate-panel").waitFor();await assertReconfirmation(page);
   if(navigation!=="own edit"){
    if(navigation==="next")await page.locator("#next").click();else{await page.locator("#saved").click();await page.locator("#saved-list .saved-row").click();}
    assert.equal(await page.locator("#choose").isEnabled(),true);assert.equal(await page.locator('.slot-time[aria-pressed="true"]').count(),1);
   }
   await updateRequirement(page,"Change 3 guests to 4");await ready(page);
   assert.equal(await page.locator("#choose").isEnabled(),true);assert.equal(await page.locator('.slot-time[aria-pressed="true"]').count(),1);
   assert.equal(await page.locator("#delivery-slots").getByText("Plan conditions changed. Confirm the time again.",{exact:true}).isVisible(),false);
   assert.equal((await host.application.getCase(userId,view.case.caseId)).restaurant.intentDraft?.partySize,4);
  }finally{await other.close();}
 },mobile);
});

for(const mobile of [false,true])test(`Round18 UI: ${mobile?"mobile":"desktop"} delayed version0 Stop cannot cancel a replacement version0 preparation`,{timeout:30_000},async()=>{
 const first=latch(),firstRelease=latch(),replacement=latch(),replacementRelease=latch(),stop=latch(),stopRelease=latch();
 await fixture({beforeSemantic:async text=>{if(text===datedWorkspaceRequest("Dinner in Tokyo")){first.release();await firstRelease.ready;}if(text===datedWorkspaceRequest("Replacement dinner in Tokyo")){replacement.release();await replacementRelease.ready;}}},async(page,host)=>{
  let b:Page|undefined,c:Page|undefined;
  try{
   await signin(page);const initialResponse=page.waitForResponse(r=>r.request().method()==="POST"&&new URL(r.url()).pathname==="/api/cases",{timeout:25000});void initialResponse.catch(()=>{});
   await page.locator("#message").fill(datedWorkspaceRequest("Dinner in Tokyo"));await page.locator("#send").click();await first.ready;
   const initial=(await host.application.listCases(userId))[0]!;
   b=await page.context().newPage();await b.clock.install({time:host.clock.now()});await b.goto("/");if(mobile)await b.locator("#menu").click();await byCase(b,initial.caseId).click();await b.locator("#stop").waitFor();
   const before=await host.application.getCase(userId,initial.caseId);assert.equal(before.case.taskVersion,0);
   let body:{readRunId:string;taskVersion:number;handleId?:string}|undefined;
   await b.route("**/api/cases/*/run",async route=>{body=route.request().postDataJSON();stop.release();await stopRelease.ready;await route.continue();});
   const cancelled=b.waitForResponse(r=>r.request().method()==="DELETE"&&r.url().endsWith("/run"));await b.locator("#stop").click();await stop.ready;
   c=await page.context().newPage();await c.clock.install({time:host.clock.now()});await c.goto("/");await c.locator("#stop").waitFor();
   const accepted=c.waitForResponse(r=>r.request().method()==="POST"&&r.url().endsWith("/messages"),{timeout:25000});void accepted.catch(()=>{});
   await c.locator("#message").fill(datedWorkspaceRequest("Replacement dinner in Tokyo"));await c.locator("#send").click();await replacement.ready;
   const pending=await host.application.getCase(userId,initial.caseId);assert.equal(pending.case.taskVersion,0);assert.equal(pending.restaurant.sourceReadContext!.runId,before.restaurant.sourceReadContext!.runId);
   stopRelease.release();const rejected=await cancelled;assert.equal(rejected.status(),409,JSON.stringify(await rejected.json()));
   const oldHandle=(before.restaurant.sourceReadContext as {handleId?:string}).handleId,newHandle=(pending.restaurant.sourceReadContext as {handleId?:string}).handleId;
   assert.equal(typeof oldHandle,"string");assert.equal(body?.handleId,oldHandle);assert.notEqual(oldHandle,newHandle);
   host.hold();replacementRelease.release();assert.equal((await accepted).status(),200);await host.waitForCheck();
   const running=await host.application.getCase(userId,initial.caseId);
   assert.equal((running.restaurant.sourceReadContext as {handleId?:string}).handleId,newHandle);
   assert.notEqual(running.restaurant.sourceReadContext!.runId,before.restaurant.sourceReadContext!.runId);
   host.release();await ready(c);
   firstRelease.release();assert.equal((await initialResponse).status(),409);
   const final=await host.application.getCase(userId,initial.caseId);assert.equal(final.case.phase,"PRESENT_RESULTS");assert.equal(final.case.stopped,undefined);assert.ok(host.providerCalls.length>0);assert.ok(host.providerCalls.every(call=>!call.aborted));
  }finally{firstRelease.release();replacementRelease.release();stopRelease.release();await b?.close();await c?.close();}
 },mobile);
});

// A Case lock outlives passive navigation and missed revision events; explicit consumption is final.
async function openPlan(page:Page,caseId:string,mobile:boolean){
 if(mobile&&await page.locator("#menu").getAttribute("aria-expanded")!=="true")await page.locator("#menu").click();
 await byCase(page,caseId).click();await byCase(page,caseId).and(page.locator(".active")).waitFor({state:"attached"});await ready(page);
}
async function confirmDeparture(page:Page,host:Host,view:RestaurantCaseView,partySize:number,explicit:boolean){
 if(explicit)await page.getByRole("button",{name:"Time 19:30 on Mon, Nov 2",exact:true}).click();
 await page.locator("#choose").click();await page.locator("#handoff").waitFor();
 const candidateId=view.restaurant.presentedCandidateIds![0]!,offerId=await page.locator("#handoff-slot").inputValue();
 const offer=view.restaurant.availability[candidateId]!.find(o=>o.id===offerId)!;
 assert.equal(offer.partySize,partySize);assert.ok(offer.dateTime.includes(explicit?"19:30":"19:00"));
 const response=page.waitForResponse(r=>r.request().method()==="POST"&&r.url().endsWith("/booking-departures"));
 await page.locator("#departure").click();assert.equal((await response).status(),201);
 const rows=await host.database.query<{candidate_id:string;offer_id:string}>("SELECT candidate_id,offer_id FROM restaurant_booking_departures WHERE conversation_id = $1",[view.case.conversationId]);
 assert.deepEqual(rows.rows,[{candidate_id:candidateId,offer_id:offerId}]);
}
for(const mobile of [false,true])for(const entry of ["candidates","About","Saved","other-plan","resolved-old-lock-after-away-revision"] as const)test(`Round19 UI: ${mobile?"mobile":"desktop"} ${entry} restores only unresolved Case reconfirmation`,{timeout:40_000},async()=>{
 await fixture({multiSlot:true,sourceValidityMs:60_000},async(page,host)=>{
  await signin(page);const {view}=await createPlan(page,"Dinner in Tokyo");
  const initial=await host.application.getCase(userId,view.case.caseId);
  await page.locator("#bookmark").click();await page.getByRole("button",{name:"Time 19:30 on Mon, Nov 2",exact:true}).click();await page.locator("#choose").click();
  const other=await page.context().newPage();await other.clock.install({time:host.clock.now()});await other.goto("/");await ready(other);
  try{
   await updateRequirement(other,"Change 2 guests to 3");await ready(other);await page.locator("#candidate-panel").waitFor();await assertReconfirmation(page);
   if(entry==="About"){await page.locator("#details-button").click();await page.locator("#details").waitFor();}
   if(entry==="Saved"){await page.locator("#saved").click();await page.locator("#saved-panel").waitFor();}
   if(entry==="other-plan"){
    await page.locator("#new-case").click();await createPlan(page,"Another dinner in Tokyo");
   }else if(entry!=="resolved-old-lock-after-away-revision")await page.evaluate(async()=>{const {state}=await import(String("/assets/workspace/runtime.js"));state.stream?.close();});
   await updateRequirement(other,"Change 3 guests to 4");await ready(other);
   if(entry==="other-plan")await openPlan(page,view.case.caseId,mobile);
   else if(entry==="resolved-old-lock-after-away-revision")await page.getByRole("button",{name:"4 guests",exact:true}).waitFor();
   else{
    await page.reload();
    if(entry==="About"){await page.locator("#details").waitFor();await page.locator("#details-back").click();}
    if(entry==="Saved"){await page.locator("#saved-panel").waitFor();await page.locator("#saved-back").click();}
    await page.locator("#candidate-panel").waitFor();
   }
   if(entry==="resolved-old-lock-after-away-revision"){
    // Consume under revision4; no older key may survive to resurrect the resolved lock.
    await page.getByRole("button",{name:"Time 19:30 on Mon, Nov 2",exact:true}).click();await page.locator("#choose").click();await page.locator("#handoff").waitFor();await page.locator("#handoff-back").click();
    const keys=await page.evaluate(()=>Object.keys(sessionStorage).filter(key=>key.startsWith('praxis:slot-reconfirm:')));assert.deepEqual(keys,[],"consumption must leave no revision orphan");
    await page.locator("#new-case").click();await createPlan(page,"Another dinner in Tokyo");
    await updateRequirement(other,"Change 4 guests to 5");await ready(other);await openPlan(page,view.case.caseId,mobile);
    assert.equal(await page.locator("#choose").isEnabled(),true);
    assert.equal(await page.locator("#delivery-slots").getByText("Plan conditions changed. Confirm the time again.",{exact:true}).count(),0);
    assert.equal(await page.locator('.slot-time[aria-pressed="true"]').count(),1);
    await screenshot(page,`round19-${mobile?"mobile":"desktop"}-${entry}`);
    await confirmDeparture(page,host,await host.application.getCase(userId,view.case.caseId),5,false);return;
   }
   await assertReconfirmation(page);
   if(entry==="Saved"){
    await page.locator("#saved").click();await page.locator(`#saved-list .saved-row[data-candidate-id="${initial.restaurant.presentedCandidateIds![0]}"]`).click();await assertReconfirmation(page);
   }
   const latest=await host.application.getCase(userId,view.case.caseId);assert.equal(latest.restaurant.intentDraft?.partySize,4);
   const before=await host.database.query<{count:number}>("SELECT count(*)::int AS count FROM restaurant_booking_departures WHERE conversation_id = $1",[view.case.conversationId]);assert.equal(before.rows[0]!.count,0);
   await screenshot(page,`round19-${mobile?"mobile":"desktop"}-${entry}`);
   await confirmDeparture(page,host,latest,4,true);
  }finally{await other.close();}
 },mobile);
});

async function round20Barrier(promise:Promise<void>,label:string){
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{await Promise.race([promise,new Promise<never>((_resolve,reject)=>{timer=setTimeout(()=>reject(new Error('Round20 barrier not reached: '+label)),8000);})]);}finally{clearTimeout(timer);}
}
for(const mobile of [false,true])test(`Round20 UI: ${mobile?'mobile':'desktop'} stopped About supports preparation Stop, execution Stop, answer and reload`,{timeout:40_000},async()=>{
 const executing=latch();let holdQuestion=true;
 await fixture({staged:true,questions:{beforeAnswer:async(_input,signal)=>{if(holdQuestion){executing.release();await new Promise<void>((_resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}));}}}},async(page,host)=>{
  await signin(page);const {view}=await createPlan(page,'Dinner in Tokyo',false);await host.waitForCheck();await page.locator('#progress.has-card').waitFor();
  const beforeStop=await host.application.getCase(userId,view.case.caseId);assert.equal(beforeStop.restaurant.progress.active,true);
  const stopped=page.waitForResponse(r=>r.request().method()==='DELETE'&&r.url().endsWith('/run'));await page.locator('#stop').click();const stoppedResponse=await stopped;assert.equal(stoppedResponse.status(),200);const stoppedView=(await stoppedResponse.json()).view as RestaurantCaseView;assert.equal(stoppedView.case.stopped,true);assert.equal(stoppedResponse.request().postDataJSON().handleId,beforeStop.restaurant.sourceReadContext!.handleId);await page.locator('#progress').waitFor({state:'hidden'});
  assert.equal(await page.locator('#bookmark').isDisabled(),true);await page.locator('#details-button').click();assert.equal(await page.locator('#refresh').isVisible(),false);assert.equal(await page.locator('#send').isEnabled(),true);
  const append=host.application.store.appendMessage.bind(host.application.store),prepared=latch(),release=latch();
  host.application.store.appendMessage=async input=>{if(input.content==='Question during preparation?'){prepared.release();await release.ready;}return append(input);};
  const prepResponse=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/questions'));
  await page.locator('#message').fill('Question during preparation?');await page.locator('#send').click();await round20Barrier(prepared.ready,'prepared');
  try{
   await page.locator('#question-stop').waitFor();assert.equal(await page.locator('#send').isDisabled(),true);assert.equal(await page.locator('#send').getAttribute('aria-busy'),'true');
   const preparing=await host.application.getCase(userId,view.case.caseId);assert.equal(preparing.restaurant.progress.active,true);assert.equal(preparing.restaurant.progress.stage,'CHECKING');assert.equal(preparing.case.status,'ACTIVE');
   const handleId=preparing.restaurant.sourceReadContext!.handleId;
   await screenshot(page,`round20-${mobile?'mobile':'desktop'}-stopped-question-preparing`);
   const stop=page.waitForResponse(r=>r.request().method()==='DELETE'&&r.url().endsWith('/run'));await page.locator('#question-stop').click();const receipt=await stop;assert.equal(receipt.status(),200);assert.equal(receipt.request().postDataJSON().handleId,handleId);
   assert.equal(host.questionRequests.length,0);
  }finally{release.release();host.application.store.appendMessage=append;}
  assert.equal((await prepResponse).status(),200);await page.waitForFunction(()=>!document.querySelector('#send')?.hasAttribute('disabled'));await page.locator('#answer-sheet').waitFor();await page.locator('#answer-dismiss').click();
  const execResponse=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/questions'));
  await page.locator('#message').fill('Question during execution?');await page.locator('#send').click();assert.equal((await execResponse).status(),200);await round20Barrier(executing.ready,'executing');await page.locator('#question-stop').waitFor();
  await screenshot(page,`round20-${mobile?'mobile':'desktop'}-stopped-question-executing`);
  const cancel=page.waitForResponse(r=>r.request().method()==='DELETE'&&r.url().endsWith('/run'));await page.locator('#question-stop').click();assert.equal((await cancel).status(),200);
  await page.waitForFunction(()=>!document.querySelector('#send')?.hasAttribute('disabled'));await page.locator('#answer-sheet').waitFor();await page.locator('#answer-dismiss').click();holdQuestion=false;
  const answer=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/questions'));await page.locator('#message').fill('Does the page require a card?');await page.locator('#send').click();assert.equal((await answer).status(),200);
  await page.locator('#answer-sheet').waitFor();assert.match(await page.locator('#question-result').innerText(),/card/i);await page.locator('#answer-dismiss').click();
  const answered=await host.application.getCase(userId,view.case.caseId);assert.equal(answered.case.stopped,true);assert.equal(answered.restaurant.progress.active,false);assert.equal(answered.restaurant.questionHistory.length,3);assert.equal(answered.restaurant.questionHistory[0]!.result!.status,'ANSWERED');
  assert.ok(answered.restaurant.questionHistory.slice(1).every(q=>q.result?.status==='UNVERIFIED'&&q.result.reason==='CANCELLED'));
  await page.reload();await page.locator('#details').waitFor();assert.equal(await page.locator('#asked-question').innerText(),'Does the page require a card?');assert.equal(await page.locator('#send').isEnabled(),true);assert.equal(await page.locator('#refresh').isVisible(),false);
  await screenshot(page,`round20-${mobile?'mobile':'desktop'}-stopped-question-reloaded`);
 },mobile);
});
for(const mobile of [false,true])test(`Round20 UI: ${mobile?'mobile':'desktop'} semantic and discovery barriers project real progress through reconnect and Stop`,{timeout:35_000},async()=>{
 const semantic=latch(),semRelease=latch(),search=latch();let holdSearch=false;
 await fixture({beforeSemantic:async text=>{if(text==='Change 2 guests to 3'){semantic.release();await semRelease.ready;}},beforeSearch:async signal=>{if(holdSearch){search.release();await new Promise<void>((_resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}));}},semanticFailureMessage:'Fail progress'},async(page,host)=>{
  try{
   await signin(page);const {view}=await createPlan(page,'Dinner in Tokyo');holdSearch=true;
   const updating=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/messages'),{timeout:25000});void updating.catch(()=>{});await page.locator('#message').fill('Change 2 guests to 3');await page.locator('#send').click();await round20Barrier(semantic.ready,'semantic');
   await page.locator('#stages').getByText('Understanding your request',{exact:true}).waitFor();assert.equal((await host.application.getCase(userId,view.case.caseId)).restaurant.progress.stage,'UNDERSTANDING');
   await screenshot(page,`round20-${mobile?'mobile':'desktop'}-semantic-progress`);semRelease.release();assert.equal((await updating).status(),200);await round20Barrier(search.ready,'search');
   await page.locator('#stages').getByText('Finding places',{exact:true}).waitFor();await page.locator('#stages .done').getByText('Request understood',{exact:true}).waitFor();
   assert.equal((await host.application.getCase(userId,view.case.caseId)).restaurant.progress.stage,'FINDING');
   await page.reload();await page.locator('#stages').getByText('Finding places',{exact:true}).waitFor();await screenshot(page,`round20-${mobile?'mobile':'desktop'}-finding-reconnected`);
   const stop=page.waitForResponse(r=>r.request().method()==='DELETE'&&r.url().endsWith('/run'));await page.locator('#stop').click();assert.equal((await stop).status(),200);await page.locator('#progress').waitFor({state:'hidden'});holdSearch=false;
   await updateRequirement(page,'Change Tokyo to nearby');await page.locator('#use-location').waitFor();assert.equal(await page.locator('#progress').isVisible(),false);
   await updateRequirement(page,'Fail progress');await page.locator('#understanding-error').waitFor();assert.equal(await page.locator('#progress').isVisible(),false);
  }finally{semRelease.release();}
 },mobile);
});

for (const outcome of ["answer","preparation-stop","execution-stop","interrupted"] as const) {
  test(`Round21 UI: expired stopped inventory preserves accepted question ${outcome}`, {timeout:40_000}, async () => {
    const executing = latch();
    await fixture({staged:true, sourceValidityMs:60_000, questions:{beforeAnswer:async (_input, signal) => {
      if (outcome !== "execution-stop") return;
      executing.release();
      if (!signal.aborted) await new Promise<void>(resolve => signal.addEventListener("abort", () => resolve(), {once:true}));
    }}}, async (page, host) => {
      await signin(page);
      const {view} = await createPlan(page,"Dinner in Tokyo",false);
      await host.waitForCheck();
      await page.locator("#progress.has-card").waitFor();
      const stopSearch = page.waitForResponse(r => r.request().method() === "DELETE" && r.url().endsWith("/run"));
      await page.locator("#stop").click();
      assert.equal((await stopSearch).status(),200);
      await page.locator("#progress").waitFor({state:"hidden"});
      const path = pathFor(view);
      const read = async () => {
        const response = await page.request.get(path);
        assert.equal(response.status(),200);
        const payload: {view:RestaurantCaseView} = await response.json();
        return payload.view;
      };
      const stopped = await read();
      const candidateId = stopped.restaurant.readyCandidateIds[0]!;
      const expiresAt = Date.parse(stopped.restaurant.availability[candidateId]![0]!.displayExpiresAt!);
      const nearExpiry = expiresAt - host.clock.now().valueOf() - 1000;
      assert.ok(nearExpiry > 0,"the stopped card initially has fresh inventory");
      host.clock.advance(nearExpiry);
      await page.locator("#details-button").click();
      const append = host.application.store.appendMessage.bind(host.application.store);
      const prepared = latch(), release = latch();
      const question = "Does this place require a card?";
      let requestId = "interrupted-round21";
      try {
        if (outcome === "interrupted") {
          // Persist the exact post-admission snapshot a stopped process leaves behind.
          type Runtime = Host["application"]["runtime"];
          const runtime = (host.application as unknown as {runtime:Runtime}).runtime;
          const snapshot = await runtime.snapshot(view.case.caseId);
          const now = host.clock.now();
          await runtime.dispatch({
            id: requestId, taskId: snapshot.id, occurredAt: now.toISOString(),
            trace: {schemaVersion:"1",runId:snapshot.runId,correlationId:requestId,actor:"USER"},
            event: {type:"PAGE_QUESTION_REQUESTED",question:{requestId,question,candidateId,
              readRunId:stopped.restaurant.sourceReadContext!.runId,readStartedAt:snapshot.createdAt,
              deadlineAt:new Date(now.valueOf()+30_000).toISOString(),requestedAt:now.toISOString()}},
          },snapshot.version);
          host.clock.advance(2000);
        } else {
          if (outcome !== "execution-stop") {
            host.application.store.appendMessage = async input => {
              if (input.content === question) { prepared.release(); await release.ready; }
              return append(input);
            };
          }
          const submitted = page.waitForResponse(r => r.request().method() === "POST" && r.url().endsWith("/questions"));
          void submitted.catch(() => {});
          await page.locator("#message").fill(question);
          await page.locator("#send").click();
          await round20Barrier(outcome === "execution-stop" ? executing.ready : prepared.ready,outcome);
          await page.locator("#asked-pending").waitFor();
          const accepted = await read();
          requestId = accepted.restaurant.pageQuestion!.requestId;
          assert.equal(accepted.restaurant.pageQuestion!.result,undefined);
          if (outcome !== "execution-stop") assert.equal(host.questionRequests.length,0);
          host.clock.advance(2000);
          if (outcome !== "answer") {
            const stopping = page.waitForResponse(r => r.request().method() === "DELETE" && r.url().endsWith("/run"));
            await page.locator("#question-stop").click();
            assert.equal((await stopping).status(),200);
          }
          release.release();
          assert.equal((await submitted).status(),200);
          await page.locator("#answer-sheet").waitFor();
          assert.equal(await page.locator("#details").isVisible(),true);
          if (outcome === "answer") assert.match(await page.locator("#question-result").innerText(),/card/i);
          else assert.match(await page.locator("#question-result").innerText(),/could not be verified/i);
          await page.locator("#answer-close").click();
        }
        const verify = async () => {
          const final = await read();
          assert.equal(final.case.stopped,true);
          assert.equal(final.restaurant.readyCandidateIds.length,0);
          assert.equal(final.restaurant.bookingHandoffs?.length ?? 0,0);
          const questionHistory = final.restaurant.questionHistory.filter(q => q.requestId === requestId);
          assert.equal(questionHistory.length,1);
          const result = questionHistory[0]!.result!;
          if (outcome === "answer") assert.equal(result.status,"ANSWERED");
          else {
            assert.equal(result.status,"UNVERIFIED");
            assert.equal(result.reason,"CANCELLED");
          }
        };
        await verify();
        assert.equal(host.questionRequests.length,outcome === "answer" || outcome === "execution-stop" ? 1 : 0);
        await page.reload();
        await page.locator("#details").waitFor();
        assert.equal(await page.locator("#asked-question").innerText(),question);
        assert.equal(await page.locator("#send").isDisabled(),true,"expired inventory cannot admit a new stopped question");
        assert.equal(await page.locator("#refresh").isVisible(),false);
        assert.equal(await page.locator("#choose").isVisible(),false);
        await verify();
      } finally {
        release.release();
        host.application.store.appendMessage = append;
      }
    });
  });
}

for (const mobile of [true,false]) {
  test(`Round21 UI: ${mobile ? "390" : "1440"} removing beer only changes its phrase in actual search requests`, {timeout:40_000}, async () => {
    for (const [query,area,preserved] of [
      ["Find me a restaurant that serves beer","Shibuya","Find me a restaurant"],
      ["sushi bar for lunch with beer in Ginza","Ginza","sushi bar for lunch"],
      ["café with outdoor seating and serving beer in Ginza","Ginza","café with outdoor seating"],
    ]) {
      await fixture({beerDiscoveryQuery:query!},async (page,host) => {
        await signin(page);
        await createPlan(page,"Find me a restaurant that serves beer",false);
        await page.locator("#messages").waitFor();
        assert.equal(host.searches.length,0);
        await updateRequirement(page,area!);
        await ready(page);
        assert.match(host.searches.at(-1)!.intent.target!.query,/beer/i);
        const before = host.searches.length;
        await page.locator("#request-conditions").getByRole("button",{name:"serves beer",exact:true}).click();
        const response = page.waitForResponse(r => r.request().method() === "POST" && r.url().endsWith("/messages"));
        await page.getByRole("button",{name:"Remove serves beer",exact:true}).click();
        assert.equal((await response).status(),200);
        await ready(page);
        assert.ok(host.searches.length > before,"the edited case issued another discovery request");
        assert.equal(host.searches[before]!.intent.target!.query,`${preserved} in ${area}`);
        assert.doesNotMatch(host.searches[before]!.intent.target!.query,/beer/i);
      },mobile);
    }
  });
}

for(const mobile of [true,false])test(`Round22 UI: ${mobile?'390':'1440'} local phrase and Japanese query edits reach search transport`,{timeout:60_000},async()=>{
 const cases=[
  {query:"Restaurants with beer",criterion:"serves beer",area:"Ginza",remove:true,kept:["Restaurants","Ginza"],removed:"beer"},
  {query:"restaurant that has beer",criterion:"serves beer",area:"Ginza",remove:true,kept:["restaurant","Ginza"],removed:"beer"},
  {query:"café with outdoor seating and beer in Ginza",criterion:"serves beer",area:"Ginza",remove:true,kept:["café","outdoor seating","Ginza"],removed:"beer"},
  {query:"café with beer and outdoor seating in Ginza",criterion:"serves beer",area:"Ginza",remove:true,kept:["café","outdoor seating","Ginza"],removed:"beer"},
  {query:"sushi bar for lunch with beer in Ginza",criterion:"serves beer",area:"Ginza",remove:true,kept:["sushi bar","for lunch","Ginza"],removed:"beer"},
  {query:"銀座の寿司店",criterion:"寿司",area:"銀座",remove:false,kept:["渋谷","寿司店"],removed:"銀座"},
  {query:"銀座の寿司店",criterion:"寿司",area:"銀座",remove:true,kept:["銀座"],removed:"寿司"},
  {query:"銀座の寿司店 東銀座駅近く",criterion:"寿司",area:"銀座",remove:false,kept:["東銀座駅","寿司店","渋谷"],removed:"銀座の"},
 ];
 for(const row of cases)await fixture({beerDiscoveryQuery:row.query,discoveryCriterion:row.criterion},async(page,host)=>{
  await signin(page);await createPlan(page,row.query,false);
  await page.locator("#messages").waitFor();await updateRequirement(page,row.area);await ready(page);
  const prior=host.searches.length;
  await page.locator("#request-conditions").getByRole("button",{name:row.remove?row.criterion:row.area,exact:true}).click();
  if(row.remove){
   const receipt=page.waitForResponse(r=>r.request().method()==="POST"&&r.url().endsWith("/messages"));
   await page.getByRole("button",{name:"Remove "+row.criterion,exact:true}).click();assert.equal((await receipt).status(),200);
  }else{
   await page.getByRole("textbox",{name:"Edit "+row.area,exact:true}).fill("渋谷");
   const receipt=page.waitForResponse(r=>r.request().method()==="POST"&&r.url().endsWith("/messages"));
   await page.getByRole("button",{name:"Save",exact:true}).click();assert.equal((await receipt).status(),200);
  }
  await ready(page);
  assert.ok(host.searches.length>prior,"new search was actually dispatched");
  const request=host.searches[prior]!,query=request.intent.target!.query;
  for(const kept of row.kept)assert.ok(query.includes(kept),JSON.stringify({query,kept}));
  assert.ok(!query.includes(row.removed),JSON.stringify({query,removed:row.removed}));
  if(!row.remove){
   const {GooglePlacesClient}=await import("../../integrations/google/google-places-client.js");
   const {GooglePlacesRestaurantSearch}=await import("../../integrations/google/google-places-restaurant-search.js");
   const transported:string[]=[];
   const adapter=new GooglePlacesRestaurantSearch(new GooglePlacesClient({apiKey:"fixture",fetchImplementation:async(_url,init)=>{
    if(init?.method==="POST")transported.push(JSON.parse(String(init.body)).textQuery);
    const text=init?.method==="POST"?JSON.parse(String(init.body)).textQuery:"";
    return new Response(JSON.stringify({places:text==="渋谷"?[{id:"fixture-shibuya",displayName:{text:"渋谷"},formattedAddress:"渋谷",types:["locality"],location:{latitude:35.66,longitude:139.7}}]:[]}));
   }}),()=>host.clock.now().toISOString());
   await adapter.search(request,new AbortController().signal);
   assert.ok(transported.length>0);
   const query=transported.find(q=>q.includes("寿司店"));
   assert.ok(query?.includes("渋谷"));assert.ok(!query!.includes("銀座の"));
  }
 },mobile);
});
