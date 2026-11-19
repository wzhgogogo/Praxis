import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { chromium, type Page, type Route } from "playwright-core";
import type { RestaurantCaseView } from "../../application/agent-workspace.js";
import { startWorkspaceFixture } from "../workspace-fixture-server.js";

type Options = NonNullable<Parameters<typeof startWorkspaceFixture>[0]>;
type Host = Awaited<ReturnType<typeof startWorkspaceFixture>>;
const userId = "workspace-user";

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
  await page.locator("#message").fill(text);
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

for (const retainsSlot of [false, true]) {
  test(`Round10 UI: Handoff refresh ${retainsSlot ? "retains a verified 19:30" : "asks for a new choice when 19:30 is gone"}`, { timeout: 30_000 }, async () => {
    const options = { multiSlot: true, sourceValidityMs: 60_000 };
    await fixture(options, async (page, host) => {
      await signin(page);
      const { view: created } = await createPlan(page, "Dinner with an explicit time choice");
      const before = await host.application.getCase(userId, created.case.caseId);
      const candidateId = before.restaurant.presentedCandidateIds![0]!;
      const refreshes = trackRequests(page, "POST", pathFor(before) + "/refresh");
      const departures = trackRequests(page, "POST", pathFor(before) + "/booking-departures");
      await page.getByRole("button", { name: "Time 19:30 on Mon, Nov 2", exact: true }).click();
      await page.locator("#choose").click();
      const departure = page.locator("#departure");
      assert.match(await departure.getAttribute("href") ?? "", /start_time=19%3A30/);
      await expire(page, host, before, candidateId);
      assert.equal(await page.locator("#departure-title").innerText(), "Check availability again");
      options.multiSlot = retainsSlot;
      const refreshed = page.waitForResponse(r => r.request().method() === "POST" && r.url().endsWith("/refresh"));
      await departure.click();
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
        await screenshot(page, "round10-handoff-reselect");
        const time = page.getByRole("button", { name: "Time 19:00 on Mon, Nov 2", exact: true });
        await time.click();
        assert.equal(await time.getAttribute("aria-pressed"), "true");
        await page.locator("#choose").click();
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
        assert.ok(!readA.conversation.messages.some(message => message.content === newText));
        assert.ok((await host.application.getCase(userId, b.case.caseId)).conversation.messages.some(message => message.content === newText));
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
  test(`Round10 UI: actual 409 recovers ${bufferSse ? "the deferred SSE snapshot" : "the latest Case when SSE is unavailable"}`, { timeout: 30_000 }, async () => {
    await fixture({ staged: true }, async (page, host) => {
      if (!bufferSse) await page.addInitScript(() => {
        const subscribe = EventTarget.prototype.addEventListener;
        Object.defineProperty(EventSource.prototype, "addEventListener", {
          value(this: EventSource, type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
            if (type !== "case" || typeof listener !== "function") return subscribe.call(this, type, listener, options);
            return subscribe.call(this, type, event => {
              if (document.documentElement.dataset.suppressCaseEvent !== "true") listener.call(this, event);
            }, options);
          },
        });
      });
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
      const terminal = new Promise<RestaurantCaseView>(resolve => {
        cdp.on("Network.eventSourceMessageReceived", event => {
          if (event.eventName !== "case") return;
          const projection: RestaurantCaseView = JSON.parse(event.data);
          if (projection.case.caseId === view.case.caseId && projection.case.phase === "PRESENT_RESULTS") resolve(projection);
        });
      });
      try {
        const draft = "Make it three people";
        await page.locator("#message").fill(draft);
        const rejected = page.waitForResponse(r => r.request().method() === "POST" && r.url().endsWith("/messages"));
        await page.locator("#send").click();
        await entered.ready;
        if (!bufferSse) await page.evaluate(() => { document.documentElement.dataset.suppressCaseEvent = "true"; });
        const active = await host.application.getCase(userId, view.case.caseId);
        await host.application.setShortlist({
          userId, caseId: active.case.caseId, requestId: "concurrent-shortlist", expectedVersion: active.case.taskVersion,
          candidateId: active.restaurant.readyCandidateIds[0]!, shortlisted: true,
        });
        host.release();
        await terminal;
        if (bufferSse) await page.waitForFunction(() => document.querySelector(".case-link.active small")?.textContent === "Ready");
        assert.equal(await page.locator("#progress.has-card").isVisible(), true, "the pending edit keeps the main projection frozen");
        deliver.release();
        const response = await rejected;
        assert.equal(response.status(), 409);
        const conflict = (await response.json()).error;
        await page.getByText(conflict, { exact: true }).waitFor();
        await ready(page);
        assert.equal(await page.locator("#message").inputValue(), draft);
        assert.equal(gets.length, bufferSse ? 0 : 1);
        const persisted = await host.application.getCase(userId, view.case.caseId);
        assert.ok(!persisted.conversation.messages.some(message => message.content === draft));
        if (bufferSse) await screenshot(page, "round10-conflict-recovered");
        else {
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
        deliver.release();
      }
    });
  });
}
