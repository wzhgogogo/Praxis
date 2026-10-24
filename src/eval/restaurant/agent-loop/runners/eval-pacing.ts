import { randomUUID } from "node:crypto";
import { createServer, connect, type Socket } from "node:net";

/** Courtesy spacing for concurrent evals, not a claim about site rate limits. */
export const DEFAULT_EVAL_ORIGIN_INTERVAL_MS = 1_000;
export const MAX_PARALLEL_EVAL_RUNS = 2;
export interface EvalPacingEndpoint { port: number; token: string; }
export interface EvalSourceUsage { requests: number; waitMs: number; }
type Usage = Record<string, EvalSourceUsage>;
type Peer = { socket: Socket; runId: string; active: boolean; origins: Set<string>; usage: Usage };
type Pending = { peer: Peer; id: number; queuedAt: number; waited: boolean };
type Origin = { members: Set<Peer>; held: Map<string, Peer>; queue: Pending[]; finishedAt: number; timer?: ReturnType<typeof setTimeout> };
function frames(socket: Socket, receive: (message: any) => void) {
  let buffer = "";
  socket.setEncoding("utf8");
  socket.on("data", chunk => {
    buffer += chunk;
    if (buffer.length > 65_536) { socket.destroy(); return; }
    let end: number;
    while ((end = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, end); buffer = buffer.slice(end + 1);
      try { receive(JSON.parse(line)); } catch { socket.destroy(); return; }
    }
  });
}
const send = (socket: Socket, message: unknown) => { if (!socket.destroyed) socket.write(JSON.stringify(message) + "\n"); };
export async function createEvalPacingCoordinator(config: { minimumIntervalMs?: number; originIntervalsMs?: Record<string, number> } = {}) {
  const minimum = config.minimumIntervalMs ?? DEFAULT_EVAL_ORIGIN_INTERVAL_MS;
  for (const value of [minimum, ...Object.values(config.originIntervalsMs ?? {})]) if (!Number.isFinite(value) || value < 0) throw new Error("Invalid eval pacing interval");
  const token = randomUUID(), peers = new Set<Peer>(), queued: Array<{ peer: Peer; id: number }> = [], origins = new Map<string, Origin>();
  const history: Record<string, Usage> = {};
  let closing = false;
  const interval = (origin: string) => config.originIntervalsMs?.[origin] ?? minimum;
  function pump(origin: string, state: Origin) {
    clearTimeout(state.timer); delete state.timer;
    while (state.queue.length && !closing) {
      const pending = state.queue[0]!;
      const contended = state.members.size > 1;
      if (contended && state.held.size) { pending.waited = true; return; }
      const due = contended ? state.finishedAt + interval(origin) : Date.now();
      if (contended && due > Date.now()) {
        pending.waited = true;
        state.timer = setTimeout(() => pump(origin, state), due - Date.now()); return;
      }
      state.queue.shift();
      const lease = randomUUID();state.held.set(lease, pending.peer);
      const usage = pending.peer.usage[origin] ??= { requests: 0, waitMs: 0 };
      const waitMs = pending.waited ? Date.now() - pending.queuedAt : 0;
      usage.requests++;usage.waitMs += waitMs;
      send(pending.peer.socket, { id: pending.id, lease, waitMs });
      if (contended) return;
    }
  }
  function admit() {
    while (queued.length && [...peers].filter(peer => peer.active).length < MAX_PARALLEL_EVAL_RUNS) {
      const next = queued.shift()!;next.peer.active = true;send(next.peer.socket, { id: next.id, entered: true });
    }
  }
  function remove(peer: Peer) {
    peers.delete(peer);history[peer.runId] = structuredClone(peer.usage);
    for (let i = queued.length - 1; i >= 0; i--) if (queued[i]!.peer === peer) queued.splice(i, 1);
    for (const [origin, state] of origins) {
      state.members.delete(peer);state.queue = state.queue.filter(row => row.peer !== peer);
      for (const [lease, owner] of state.held) if (owner === peer) { state.held.delete(lease);state.finishedAt = Date.now(); }
      pump(origin, state);
    }
    admit();
  }
  const server = createServer(socket => {
    let peer: Peer | undefined;
    socket.on("error", () => {});
    socket.on("close", () => { if (peer) remove(peer); });
    frames(socket, message => {
      if (!Number.isSafeInteger(message.id)) throw new Error("Invalid request id");
      if (!peer) {
        if (message.type !== "enter" || message.token !== token || typeof message.runId !== "string" || !/^[\w.-]{1,120}$/.test(message.runId) || [...peers].some(p => p.runId === message.runId)) throw new Error("Invalid pacing registration");
        peer = { socket, runId: message.runId, active: false, origins: new Set(), usage: {} };peers.add(peer);queued.push({ peer, id: message.id });admit();return;
      }
      if (!peer.active) throw new Error("Run has not entered");
      if (message.type === "stats") { send(socket, { id: message.id, usage: peer.usage });return; }
      if (message.type === "acquire" || message.type === "count") {
        const parsed = new URL(message.origin);if (parsed.origin !== message.origin || !["http:", "https:"].includes(parsed.protocol)) throw new Error("Expected origin only");
        // Static assets are counted without joining source arbitration or
        // extending another run's spacing window.
        if (message.type === "count") {
          (peer.usage[parsed.origin] ??= { requests: 0, waitMs: 0 }).requests++;
          send(socket, { id: message.id, counted: true });return;
        }
        const state = origins.get(parsed.origin) ?? { members: new Set<Peer>(), held: new Map<string, Peer>(), queue: [], finishedAt: 0 };
        origins.set(parsed.origin, state);state.members.add(peer);peer.origins.add(parsed.origin);
        state.queue.push({ peer, id: message.id, queuedAt: Date.now(), waited: false });pump(parsed.origin, state);return;
      }
      if (message.type === "release") {
        for (const [origin, state] of origins) if (state.held.get(message.lease) === peer) { state.held.delete(message.lease);state.finishedAt = Date.now();pump(origin, state);send(socket, { id: message.id, released: true });return; }
      }
      throw new Error("Invalid pacing operation");
    });
  });
  await new Promise<void>((resolve, reject) => { server.once("error", reject);server.listen(0, "127.0.0.1", () => { server.off("error", reject);resolve(); }); });
  return {
    endpoint: { port: (server.address() as { port: number }).port, token },
    snapshot: () => ({ activeRuns: [...peers].filter(p => p.active).map(p => p.runId), queuedRuns: queued.map(p => p.peer.runId), usage: { ...history, ...Object.fromEntries([...peers].map(p => [p.runId, structuredClone(p.usage)])) }, heldLeases: [...origins.values()].reduce((n, s) => n + s.held.size, 0) }),
    async close() { closing = true;for (const state of origins.values()) clearTimeout(state.timer);for (const peer of peers) peer.socket.destroy();await new Promise<void>(resolve => server.close(() => resolve())); },
  };
}

export async function connectEvalPacing(endpoint: EvalPacingEndpoint, runId: string, signal?: AbortSignal) {
  const socket = connect({ host: "127.0.0.1", port: endpoint.port });
  let sequence = 0;
  const pending = new Map<number, { resolve(value: any): void; reject(error: Error): void }>();
  const fail = () => { for (const call of pending.values()) call.reject(new Error("EVAL_PACING_DISCONNECTED"));pending.clear(); };
  socket.on("error", fail);socket.on("close", fail);
  frames(socket, message => { const call = pending.get(message.id);pending.delete(message.id);call?.resolve(message); });
  const rpc = (type: string, fields: Record<string, unknown> = {}) => new Promise<any>((resolve, reject) => {
    if (socket.destroyed || signal?.aborted) { reject(new Error("EVAL_PACING_DISCONNECTED"));return; }
    const id = ++sequence;pending.set(id, { resolve, reject });send(socket, { type, id, ...fields });
  });
  const close = () => socket.destroy();signal?.addEventListener("abort", close, { once: true });
  try { await rpc("enter", { token: endpoint.token, runId }); } catch (error) { close();throw error; }
  return {
    async count(url: string) { await rpc("count", { origin: new URL(url).origin }); },
    async acquire(url: string) {
      const { lease } = await rpc("acquire", { origin: new URL(url).origin });let released = false;
      return async () => { if (!released && !socket.destroyed) { released = true;await rpc("release", { lease }); } };
    },
    async request<T>(url: string, transport: () => Promise<T>): Promise<T> { const release = await this.acquire(url);try { return await transport(); } finally { await release(); } },
    async usage(): Promise<Usage> { return (await rpc("stats")).usage; },
    close() { signal?.removeEventListener("abort", close);close(); },
  };
}
export type EvalPacingClient = Awaited<ReturnType<typeof connectEvalPacing>>;
