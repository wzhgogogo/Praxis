import assert from "node:assert/strict";
import { fork } from "node:child_process";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { createEvalPacingCoordinator, type EvalPacingEndpoint } from "../../eval/restaurant/agent-loop/runners/eval-pacing.js";

function child(endpoint: EvalPacingEndpoint, id: string, url: string) {
  const process = fork(fileURLToPath(new URL("./fixtures/pacing-child.ts", import.meta.url)), [JSON.stringify(endpoint), id, url], { execArgv: ["--import", "tsx"], silent: true, env: { PATH: globalThis.process.env.PATH, HOME: globalThis.process.env.HOME } });
  const messages: any[] = [];const errors: Buffer[] = [];
  process.on("message", message => messages.push(message));process.stderr!.on("data", data => errors.push(data));
  const closed = new Promise<void>(resolve => process.once("close", () => resolve()));
  return { process, messages, closed, errors };
}
async function until(check: () => boolean, detail: string) {
  const deadline = Date.now() + 10_000;
  while (!check() && Date.now() < deadline) await delay(5);
  assert.ok(check(), detail);
}
async function setup() {
  const hits: number[] = [];
  const server = createServer((_request, response) => { hits.push(Date.now());setTimeout(() => response.end("public fixture"), 150); });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${(server.address() as { port: number }).port}/public`;
  const coordinator = await createEvalPacingCoordinator({ minimumIntervalMs: 120 });
  const children: ReturnType<typeof child>[] = [];
  return { hits, url, coordinator,
    spawn(id: string) { const run = child(coordinator.endpoint, id, url);children.push(run);return run; },
    async close() { for (const run of children) run.process.kill("SIGKILL");await Promise.all(children.map(run => run.closed));await coordinator.close();server.closeAllConnections();await new Promise<void>(resolve => server.close(() => resolve())); },
  };
}

test("shared origin pacing spans two real subprocesses", { timeout: 20_000 }, async t => {
  const fixture = await setup();
  try {
    const a = fixture.spawn("a"), b = fixture.spawn("b");
    await until(() => [a,b].every(run => run.messages.some(m => m.stage === "ENTERED")), "both processes enter");
    a.process.send("start");b.process.send("start");
    await until(() => [a,b].every(run => run.messages.some(m => m.stage === "DONE")), "both processes finish requests");
    assert.equal(fixture.hits.length, 4);
    const differences = fixture.hits.slice(1).map((time, index) => time - fixture.hits[index]!);
    assert.ok(differences.every(ms => ms >= 120), `source intervals ${differences}`);
    assert.ok([a,b].some(run => Object.values(run.messages.find(m => m.stage === "DONE").usage).some((row: any) => row.waitMs > 0)));
    t.diagnostic(JSON.stringify({ timestamps: fixture.hits, intervals: differences, configuredMs: 120, usage: fixture.coordinator.snapshot().usage }));
  } finally { await fixture.close(); }
});

test("one run has exactly zero pacing wait", { timeout: 15_000 }, async t => {
  const fixture = await setup();
  try {
    const a = fixture.spawn("single");await until(() => a.messages.some(m => m.stage === "ENTERED"), "single enters");a.process.send("start");
    await until(() => a.messages.some(m => m.stage === "DONE"), "single completes");
    const usage = a.messages.find(m => m.stage === "DONE").usage;
    assert.deepEqual(Object.values(usage), [{ requests: 2, waitMs: 0 }]);t.diagnostic(JSON.stringify(usage));
  } finally { await fixture.close(); }
});

for (const stop of ["SIGTERM", "timeout", "stop"] as const) test(`third queues and ${stop} releases in-flight ownership`, { timeout: 20_000 }, async t => {
  const fixture = await setup();
  try {
    const a = fixture.spawn("interrupted"), b = fixture.spawn("survivor");
    await until(() => [a,b].every(run => run.messages.some(m => m.stage === "ENTERED")), "first pair enters");
    const c = fixture.spawn("third");await until(() => fixture.coordinator.snapshot().queuedRuns.includes("third"), "third queues");
    assert.ok(!c.messages.some(m => m.stage === "ENTERED"));
    a.process.send("start");await until(() => fixture.hits.length === 1, "first request is in flight");b.process.send("start");
    if (stop === "SIGTERM") a.process.kill("SIGTERM");else a.process.send(stop);
    await a.closed;await until(() => c.messages.some(m => m.stage === "ENTERED"), "third admitted after interruption");
    c.process.send("start");await until(() => [b,c].every(run => run.messages.some(m => m.stage === "DONE")), "remaining runs complete");
    assert.equal(fixture.coordinator.snapshot().heldLeases, 0);assert.ok(!fixture.coordinator.snapshot().activeRuns.includes("interrupted"));
    t.diagnostic(JSON.stringify({ stop, ...fixture.coordinator.snapshot() }));
  } finally { await fixture.close(); }
});
