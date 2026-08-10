import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

import {
  PersistentRestaurantAgentApplication,
  PilotSessionService,
  StaleTaskVersionError,
  WorkspaceAuthenticationError,
  WorkspaceCaseNotFoundError,
  type PilotAccessEntry,
} from "../application/persistent-restaurant-agent.js";
import type { RestaurantCaseView, WorkspaceUser } from "../application/agent-workspace.js";
import { applyPostgresMigrations } from "../infrastructure/postgres/migrations.js";
import { NodePostgresDatabase } from "../infrastructure/postgres/node-postgres-database.js";

const MAX_BODY_BYTES = 16 * 1024;
const SESSION_COOKIE = "praxis_session";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const PORT = Number.parseInt(process.env.PORT ?? "3000", 10);

export const DEFAULT_FIXTURE_PILOT_ACCESS: PilotAccessEntry[] = [
  { accessToken: "praxis-fixture-a", id: "pilot-a", displayName: "Pilot A" },
];

const PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Praxis — Agent Workspace</title>
    <style>
      :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: #17221c; background: #f2efe7; }
      * { box-sizing: border-box; } body { margin: 0; } button, textarea, input { font: inherit; }
      button { border: 0; border-radius: 999px; padding: 10px 16px; background: #174d35; color: white; font-weight: 700; white-space: nowrap; cursor: pointer; }
      button:disabled { opacity: .5; cursor: wait; } .secondary { background: #e1ebe4; color: #174d35; }
      .eyebrow { color: #397259; font-weight: 800; letter-spacing: .09em; font-size: 11px; text-transform: uppercase; }
      .notice { padding: 13px 15px; border: 1px solid #ddc568; border-radius: 12px; background: #fff2c9; line-height: 1.45; }
      .hidden { display: none !important; } #login { max-width: 520px; margin: 10vh auto; padding: 28px; }
      #login h1 { font-size: clamp(34px, 7vw, 54px); margin: 8px 0 14px; } #login form { display: grid; gap: 12px; margin-top: 24px; }
      input, textarea { width: 100%; border: 1px solid #aeb8b0; background: white; border-radius: 11px; padding: 12px; }
      textarea { min-height: 92px; resize: vertical; }
      #workspace { min-height: 100vh; display: grid; grid-template-columns: 290px minmax(0, 1fr); }
      aside { border-right: 1px solid #d4d8d1; padding: 24px 18px; background: #e9ede6; }
      .brand { font-size: 25px; font-weight: 850; margin: 4px 0 22px; } .side-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
      #case-list { display: grid; gap: 8px; margin-top: 16px; } .case-link { text-align: left; width: 100%; border-radius: 12px; color: #25352c; background: transparent; padding: 12px; }
      .case-link.active { background: white; box-shadow: 0 1px 0 #cad1ca; } .case-link small { display: block; color: #68756d; margin-top: 5px; }
      main { padding: 28px clamp(18px, 5vw, 64px) 70px; max-width: 1120px; width: 100%; }
      header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; } h1 { margin: 5px 0; font-size: clamp(30px, 5vw, 48px); }
      .status { display: inline-block; margin-top: 8px; background: #dbeadf; color: #184c35; border-radius: 99px; padding: 5px 9px; font-size: 12px; font-weight: 800; }
      #composer { display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 10px; margin: 28px 0; }
      .columns { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(260px, .65fr); gap: 18px; }
      section { min-width: 0; } .panel { background: rgba(255,255,255,.8); border: 1px solid #d8ddd6; border-radius: 15px; padding: 18px; margin-bottom: 14px; }
      .panel h2 { font-size: 16px; margin: 0 0 14px; } .message { padding: 11px 13px; border-radius: 12px; margin: 8px 0; line-height: 1.48; white-space: pre-wrap; }
      .message.USER { margin-left: 12%; background: #dce9df; } .message.ASSISTANT { margin-right: 12%; background: white; border: 1px solid #e0e4df; }
      .candidate { border-top: 1px solid #e0e4df; padding: 14px 0; } .candidate:first-of-type { border-top: 0; padding-top: 0; }
      .candidate h3 { margin: 0 0 5px; font-size: 16px; } .muted { color: #66736b; font-size: 13px; line-height: 1.45; }
      .activity { border-left: 2px solid #b7cbbd; padding: 0 0 16px 12px; } .activity strong { display: block; font-size: 14px; } .activity small { color: #78837c; }
      @media (max-width: 760px) {
        #workspace { display: block; } aside { position: sticky; top: 0; z-index: 3; border-right: 0; border-bottom: 1px solid #d4d8d1; padding: 12px 14px; }
        .brand { margin: 0; font-size: 20px; } .side-head { align-items: center; } #case-list { display: flex; overflow-x: auto; margin-top: 10px; }
        .case-link { min-width: 210px; background: rgba(255,255,255,.55); } main { padding: 22px 15px 60px; }
        header { display: block; } .columns { grid-template-columns: 1fr; } #composer { grid-template-columns: 1fr; } #composer button { width: 100%; }
      }
    </style>
  </head>
  <body>
    <section id="login">
      <div class="eyebrow">Praxis · Stage 2B fixture</div><h1>Your agent workspace</h1>
      <p>Resume a restaurant case from desktop or mobile web with a server-side pilot identity.</p>
      <div class="notice"><strong>Fixture only.</strong> No real model, live availability, notification, authorization, or booking. Local access token: <code>praxis-fixture-a</code>.</div>
      <form id="login-form"><label for="access-token">Pilot access token</label><input id="access-token" autocomplete="off" required /><button>Enter workspace</button></form>
      <p id="login-error" class="notice hidden"></p>
    </section>
    <div id="workspace" class="hidden">
      <aside><div class="side-head"><div class="brand">Praxis</div><button id="new-case" class="secondary">New case</button></div><div id="case-list"></div></aside>
      <main>
        <header><div><div class="eyebrow">Persistent restaurant agent · fixture</div><h1 id="case-title">Start a case</h1><span id="case-status" class="status hidden"></span></div><button id="logout" class="secondary">Sign out</button></header>
        <div class="notice">This workspace can persist and reconnect, but Stage 2B stops before authorization or any external write.</div>
        <form id="composer"><textarea id="message" required placeholder="Tonight at 7pm near Shinjuku for two, yakiniku, around 5000 yen each."></textarea><button id="send">Start case</button></form>
        <p id="error" class="notice hidden"></p>
        <div class="columns"><section><div class="panel"><h2>Conversation</h2><div id="messages" class="muted">No case selected.</div></div><div class="panel"><h2>Restaurant artifact</h2><div id="artifact" class="muted">Candidates will appear here.</div></div></section><section><div class="panel"><h2>Activity</h2><div id="activity" class="muted">Authoritative task events will appear here.</div></div></section></div>
      </main>
    </div>
    <script>
      const $ = (selector) => document.querySelector(selector);
      const state = { cases: [], view: null, stream: null };
      const login = $('#login'), workspace = $('#workspace'), list = $('#case-list'), title = $('#case-title'), status = $('#case-status');
      const messages = $('#messages'), artifact = $('#artifact'), activity = $('#activity'), composer = $('#composer'), message = $('#message'), send = $('#send'), error = $('#error');
      const node = (tag, text, className) => { const item = document.createElement(tag); if (text !== undefined) item.textContent = text; if (className) item.className = className; return item; };
      const requestId = () => crypto.randomUUID();
      async function api(path, options) { const response = await fetch(path, { credentials: 'same-origin', ...options, headers: { 'content-type': 'application/json', ...(options && options.headers || {}) } }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error || 'Request failed'); return payload; }
      function showError(value, target = error) { target.textContent = value.message || String(value); target.classList.remove('hidden'); }
      function clearError() { error.classList.add('hidden'); }
      function openStream(caseId) { if (state.stream) state.stream.close(); state.stream = new EventSource('/api/cases/' + encodeURIComponent(caseId) + '/events'); state.stream.addEventListener('case', (event) => renderView(JSON.parse(event.data))); }
      function renderList() { list.replaceChildren(); state.cases.forEach((item) => { const button = node('button', item.title, 'case-link' + (state.view && state.view.case.caseId === item.caseId ? ' active' : '')); button.append(node('small', item.status + ' · ' + item.phase)); button.onclick = () => loadCase(item.caseId); list.append(button); }); }
      function renderView(view) {
        state.view = view; title.textContent = view.case.title; status.textContent = view.case.status + (view.case.pendingUserAction ? ' · ' + view.case.pendingUserAction : ''); status.classList.remove('hidden'); send.textContent = 'Send';
        messages.replaceChildren(); view.conversation.messages.forEach((item) => messages.append(node('div', item.content, 'message ' + item.role)));
        artifact.replaceChildren(); if (!view.restaurant.candidates.length) artifact.append(node('p', view.restaurant.missingRequiredFields.length ? 'Needed: ' + view.restaurant.missingRequiredFields.join(', ') : 'No candidates yet.', 'muted'));
        view.restaurant.candidates.forEach((candidate) => { const card = node('div', undefined, 'candidate'); card.append(node('h3', candidate.restaurant.outletName)); card.append(node('div', candidate.restaurant.address + ' · ' + candidate.offer.dateTime, 'muted')); const choose = node('button', view.restaurant.selectedCandidateId === candidate.restaurant.id ? 'Selected' : 'Choose', 'secondary'); choose.disabled = Boolean(view.restaurant.selectedCandidateId); choose.onclick = () => selectCandidate(candidate.restaurant.id); card.append(choose); artifact.append(card); });
        activity.replaceChildren(); view.activities.slice().reverse().forEach((item) => { const row = node('div', undefined, 'activity'); row.append(node('strong', item.display.title)); row.append(node('div', item.display.detail || '', 'muted')); row.append(node('small', new Date(item.occurredAt).toLocaleString())); activity.append(row); });
        const found = state.cases.findIndex((item) => item.caseId === view.case.caseId); if (found >= 0) state.cases[found] = view.case; else state.cases.unshift(view.case); renderList();
      }
      async function loadCases() { const payload = await api('/api/cases'); state.cases = payload.cases; renderList(); if (state.cases[0]) await loadCase(state.cases[0].caseId); }
      async function loadCase(caseId) { try { clearError(); const payload = await api('/api/cases/' + encodeURIComponent(caseId)); renderView(payload.view); openStream(caseId); } catch (reason) { showError(reason); } }
      async function selectCandidate(candidateId) { try { clearError(); const payload = await api('/api/cases/' + encodeURIComponent(state.view.case.caseId) + '/select', { method: 'POST', body: JSON.stringify({ candidateId, taskVersion: state.view.case.taskVersion, requestId: requestId() }) }); renderView(payload.view); } catch (reason) { showError(reason); } }
      function resetCase() { if (state.stream) state.stream.close(); state.stream = null; state.view = null; title.textContent = 'Start a case'; status.classList.add('hidden'); send.textContent = 'Start case'; messages.textContent = 'Describe the result you want to begin.'; artifact.textContent = 'Candidates will appear here.'; activity.textContent = 'Authoritative task events will appear here.'; renderList(); message.focus(); }
      composer.addEventListener('submit', async (event) => { event.preventDefault(); send.disabled = true; try { clearError(); const path = state.view ? '/api/conversations/' + encodeURIComponent(state.view.conversation.id) + '/messages' : '/api/cases'; const body = state.view ? { message: message.value, taskVersion: state.view.case.taskVersion, requestId: requestId() } : { message: message.value, requestId: requestId() }; const payload = await api(path, { method: 'POST', body: JSON.stringify(body) }); message.value = ''; renderView(payload.view); openStream(payload.view.case.caseId); } catch (reason) { showError(reason); } finally { send.disabled = false; } });
      $('#new-case').onclick = resetCase;
      $('#login-form').addEventListener('submit', async (event) => { event.preventDefault(); try { await api('/api/session', { method: 'POST', body: JSON.stringify({ accessToken: $('#access-token').value }) }); login.classList.add('hidden'); workspace.classList.remove('hidden'); await loadCases(); } catch (reason) { showError(reason, $('#login-error')); } });
      $('#logout').onclick = async () => { await api('/api/session', { method: 'DELETE' }); location.reload(); };
      api('/api/session').then(() => { login.classList.add('hidden'); workspace.classList.remove('hidden'); return loadCases(); }).catch(() => {});
    </script>
  </body>
</html>`;

class CaseEventHub {
  private readonly subscribers = new Map<string, Set<(view: RestaurantCaseView) => void>>();

  subscribe(caseId: string, subscriber: (view: RestaurantCaseView) => void): () => void {
    const group = this.subscribers.get(caseId) ?? new Set();
    group.add(subscriber);
    this.subscribers.set(caseId, group);
    return () => {
      group.delete(subscriber);
      if (group.size === 0) this.subscribers.delete(caseId);
    };
  }

  publish(view: RestaurantCaseView): void {
    this.subscribers.get(view.case.caseId)?.forEach((subscriber) => subscriber(view));
  }
}

function json(response: ServerResponse, statusCode: number, payload: unknown, headers = {}): void {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8", ...headers });
  response.end(JSON.stringify(payload));
}

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) throw new Error("Request body is too large");
    chunks.push(buffer);
  }
  const value: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Request body must be a JSON object");
  }
  return value as Record<string, unknown>;
}

function requireString(input: Record<string, unknown>, key: string): string {
  const value = input[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} must be a non-empty string`);
  }
  return value.trim();
}

function requireVersion(input: Record<string, unknown>): number {
  const value = input.taskVersion;
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error("taskVersion must be a non-negative integer");
  }
  return value as number;
}

function cookies(request: IncomingMessage): Map<string, string> {
  const result = new Map<string, string>();
  for (const part of (request.headers.cookie ?? "").split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    result.set(part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim()));
  }
  return result;
}

function sessionCookie(token: string, maxAge = SESSION_MAX_AGE_SECONDS): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

function writeCaseEvent(response: ServerResponse, view: RestaurantCaseView): void {
  response.write(`id: ${view.case.taskVersion}\nevent: case\ndata: ${JSON.stringify(view)}\n\n`);
}

function errorStatus(error: unknown): number {
  if (error instanceof WorkspaceAuthenticationError) return 401;
  if (error instanceof WorkspaceCaseNotFoundError) return 404;
  if (error instanceof StaleTaskVersionError) return 409;
  return 400;
}

export interface LocalWebServerOptions {
  application: PersistentRestaurantAgentApplication;
  sessions: PilotSessionService;
}

export function createLocalWebServer(options: LocalWebServerOptions): Server {
  const hub = new CaseEventHub();
  return createServer(async (request, response) => {
    try {
      const method = request.method ?? "GET";
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      if (method === "GET" && url.pathname === "/") {
        response.writeHead(200, {
          "content-type": "text/html; charset=utf-8",
          "content-security-policy": "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'",
          "x-content-type-options": "nosniff",
        });
        response.end(PAGE);
        return;
      }
      if (method === "POST" && url.pathname === "/api/session") {
        const body = await readJson(request);
        const login = await options.sessions.login(requireString(body, "accessToken"));
        json(response, 201, { user: login.user }, { "set-cookie": sessionCookie(login.sessionToken) });
        return;
      }
      if (method === "DELETE" && url.pathname === "/api/session") {
        json(response, 200, { ok: true }, { "set-cookie": sessionCookie("", 0) });
        return;
      }

      const user = await options.sessions.authenticate(cookies(request).get(SESSION_COOKIE));
      if (!user) throw new WorkspaceAuthenticationError();

      if (method === "GET" && url.pathname === "/api/session") {
        json(response, 200, { user });
        return;
      }
      if (method === "GET" && url.pathname === "/api/cases") {
        json(response, 200, { cases: await options.application.listCases(user.id) });
        return;
      }
      if (method === "POST" && url.pathname === "/api/cases") {
        const body = await readJson(request);
        const view = await options.application.createCase(
          user.id,
          requireString(body, "message"),
          requireString(body, "requestId"),
        );
        hub.publish(view);
        json(response, 201, { view });
        return;
      }
      const caseMatch = /^\/api\/cases\/([^/]+)$/.exec(url.pathname);
      if (method === "GET" && caseMatch) {
        json(response, 200, {
          view: await options.application.getCase(user.id, decodeURIComponent(caseMatch[1]!)),
        });
        return;
      }
      const messageMatch = /^\/api\/conversations\/([^/]+)\/messages$/.exec(url.pathname);
      if (method === "POST" && messageMatch) {
        const body = await readJson(request);
        const view = await options.application.submitMessage({
          userId: user.id,
          conversationId: decodeURIComponent(messageMatch[1]!),
          message: requireString(body, "message"),
          requestId: requireString(body, "requestId"),
          expectedVersion: requireVersion(body),
        });
        hub.publish(view);
        json(response, 200, { view });
        return;
      }
      const selectMatch = /^\/api\/cases\/([^/]+)\/select$/.exec(url.pathname);
      if (method === "POST" && selectMatch) {
        const body = await readJson(request);
        const view = await options.application.selectCandidate({
          userId: user.id,
          caseId: decodeURIComponent(selectMatch[1]!),
          candidateId: requireString(body, "candidateId"),
          requestId: requireString(body, "requestId"),
          expectedVersion: requireVersion(body),
        });
        hub.publish(view);
        json(response, 200, { view });
        return;
      }
      const eventMatch = /^\/api\/cases\/([^/]+)\/events$/.exec(url.pathname);
      if (method === "GET" && eventMatch) {
        const caseId = decodeURIComponent(eventMatch[1]!);
        const view = await options.application.getCase(user.id, caseId);
        response.writeHead(200, {
          "content-type": "text/event-stream; charset=utf-8",
          "cache-control": "no-cache, no-transform",
          connection: "keep-alive",
        });
        writeCaseEvent(response, view);
        const unsubscribe = hub.subscribe(caseId, (updated) => writeCaseEvent(response, updated));
        const heartbeat = setInterval(() => response.write(": keep-alive\n\n"), 15_000);
        request.on("close", () => {
          clearInterval(heartbeat);
          unsubscribe();
        });
        return;
      }
      json(response, 404, { error: "Not found" });
    } catch (error) {
      if (!response.headersSent) {
        json(response, errorStatus(error), {
          error: error instanceof Error ? error.message : "Request failed",
        });
      } else {
        response.end();
      }
    }
  });
}

function pilotEntriesFromEnvironment(): PilotAccessEntry[] {
  const encoded = process.env.PRAXIS_PILOT_ACCESS_JSON;
  if (!encoded) return DEFAULT_FIXTURE_PILOT_ACCESS;
  const value: unknown = JSON.parse(encoded);
  if (!Array.isArray(value)) throw new Error("PRAXIS_PILOT_ACCESS_JSON must be an array");
  return value.map((entry, index) => {
    if (typeof entry !== "object" || entry === null) {
      throw new Error(`Pilot access entry ${index} must be an object`);
    }
    const record = entry as Record<string, unknown>;
    return {
      accessToken: requireString(record, "accessToken"),
      id: requireString(record, "id"),
      displayName: requireString(record, "displayName"),
    };
  });
}

async function start(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for the Stage 2B persistent workspace");
  const database = new NodePostgresDatabase({ connectionString });
  await applyPostgresMigrations(database);
  const application = new PersistentRestaurantAgentApplication({ database });
  const sessions = new PilotSessionService(application.store, pilotEntriesFromEnvironment(), {
    now: () => new Date(),
  });
  const server = createLocalWebServer({ application, sessions });
  server.listen(PORT, "127.0.0.1", () => {
    console.log(`Praxis Stage 2B fixture workspace is running at http://127.0.0.1:${PORT}`);
  });
  const shutdown = () => server.close(() => void database.close());
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  void start().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
