/** Evaluation-only measurements. No scoring threshold or production decision. */
type RecordValue = Record<string, unknown>;
const object = (value: unknown): RecordValue => value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
const rows = (value: unknown): RecordValue[] => Array.isArray(value) ? value.map(object) : [];
const time = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value)) ? Date.parse(value) : undefined;
interface Span { start: number; end: number; stage: string; priority: number; ref: string; }

export function restaurantRunStageTimings(value: unknown, capturedDecisions: readonly unknown[] = []) {
  const root = object(value), result = object(root.result), diagnostics = object(root.diagnostics);
  const start = time(root.startedAt), end = time(root.finishedAt)
    ?? (start !== undefined && typeof root.elapsedMs === "number" ? start + root.elapsedMs : undefined);
  const gaps: string[] = [], spans: Span[] = [];
  const modelSteps: Array<{ purpose: string; sequence: unknown; latencyMs: number | null; placed: boolean }> = [];
  const add = (from: number | undefined, to: number | undefined, stage: string, priority: number, ref: string) => {
    if (from === undefined || to === undefined || to < from) { gaps.push(`Unplaced interval:${ref}`); return; }
    spans.push({ start: from, end: to, stage, priority, ref });
  };
  const traces = [...rows(diagnostics.browserTrace), ...rows(object(root.sourceTrace).browserTrace), ...rows(root.browserTrace), ...rows(result.browserTrace)];
  const unique = new Map(traces.map((entry, index) => [`${entry.at}:${entry.sequence ?? index}:${entry.kind}`, entry]));
  const points = [...unique.values()].filter(entry => time(entry.at) !== undefined).sort((a,b) => time(a.at)! - time(b.at)!);
  if (traces.length && !points.length) gaps.push("Browser trace has no timestamps; no stage duration is invented.");
  let scope: { source: string; stage: string; candidate: string; url: string } | undefined;
  let controls: RecordValue[] = [];
  const calls: Array<{ at: number; stage: string; ref: string }> = [];
  for (const [index, point] of points.entries()) {
    const detail = object(point.detail);
    if (point.kind === "SOURCE_FIRST_BATCH") {
      const latency = object(object(detail.read).metadata).latencyMs;
      if (typeof latency === "number" && latency >= 0) add(time(point.at)! - latency, time(point.at), `DISCOVERY:${String(detail.sourceId ?? "UNRECORDED")}:SOURCE_TOTAL`, 1, `sourceFirstBatch[${point.sequence ?? index}]`);
    }
    if (typeof detail.source === "string" && typeof detail.stage === "string") {
      scope = { source: detail.source, stage: detail.stage, candidate: String(detail.candidateId ?? scope?.candidate ?? "UNRECORDED"),
        url: typeof detail.url === "string" ? detail.url : detail.source === scope?.source ? scope.url : "" };
    }
    if (point.kind === "CONTROLS") controls = rows(point.detail);
    if (point.kind === "SESSION_RETURN") {
      const pending = calls.pop();
      if (pending) add(pending.at, time(point.at), pending.stage, 2.5, pending.ref);
    }
    if (!scope) continue;
    if (point.kind === "SESSION_CALL" && scope.stage === "AVAILABILITY") {
      const target = Array.isArray(detail.args) ? detail.args[0] : undefined;
      const control = controls.find(item => item.id === target || item.stableKey === target);
      const label = `${typeof target === "string" ? target : ""} ${control?.label ?? ""} ${object(control?.structure).name ?? ""}`;
      calls.push({ at: time(point.at)!, stage: `AVAILABILITY:${scope.source}:${scope.candidate}:${/date|calendar|日付|カレンダー/i.test(label) ? "CALENDAR_CONTROL" : "REQUEST_AND_RESULT"}`, ref: `sessionCall[${point.sequence ?? index}]` });
    }
    if (point.kind === "SESSION_CALL" && detail.method === "navigate" && Array.isArray(detail.args) && typeof detail.args[0] === "string") scope.url = detail.args[0];
    if (detail.event === "PROVIDER_FINISHED" || detail.event === "CANDIDATE_FINISHED") { scope = undefined; continue; }
    const next = points[index + 1]; if (!next) continue;
    let part = scope.stage;
    if (part === "DISCOVERY" && !scope.candidate.startsWith("native-discovery:") && scope.candidate !== "UNRECORDED") {
      // Availability Adapters also use a DISCOVERY stage for name lookup.
      // Its candidate scope separates it from finding new restaurants.
      part = `AVAILABILITY:${scope.source}:${scope.candidate}:RESOLUTION`;
    } else if (part === "DISCOVERY") {
      let path = ""; try { path = new URL(scope.url).pathname; } catch { /* Missing observed URL stays unclassified. */ }
      const venueSearch = /VENUE_SEARCH|TABLECHECK/.test(scope.source);
      part = /rstLst|\/search/.test(path) ? "SEARCH" : venueSearch && path ? "DETAIL" : /\/\d+\/(?:[^/]*)?$/.test(path) ? "DETAIL" : path ? "REGION_OR_HOME" : "UNCLASSIFIED";
      part = `DISCOVERY:${scope.source}:${part}`;
    } else if (part === "IDENTITY") part = `AVAILABILITY:${scope.source}:${scope.candidate}:RESOLUTION`;
    else if (part === "AVAILABILITY") part = `AVAILABILITY:${scope.source}:${scope.candidate}:REQUEST_AND_RESULT`;
    else part = `${part}:${scope.source}:${scope.candidate}`;
    add(time(point.at), time(next.at), part, 2, `trace[${point.sequence ?? index}]`);
  }
  const trajectories = rows(root.trajectories);
  for (const [index, step] of trajectories.entries()) {
    const action = object(step.agentAction), kind = String(action.type ?? "UNRECORDED");
    const from = time(step.occurredAt), next = time(trajectories[index + 1]?.occurredAt);
    const eventTypes: Record<string,string> = { SEARCH_RESTAURANTS: "SEARCH_COMPLETED", CHECK_AVAILABILITY: "AVAILABILITY_CHECKED", INVESTIGATE_CANDIDATE_FACTS: "CANDIDATE_FACTS_INVESTIGATED", PRESENT_RESULTS: "RESULTS_PRESENTED" };
    const finished = rows(root.events).find(event => object(event.event).type === eventTypes[kind] && from !== undefined && (time(event.occurredAt) ?? -1) >= from);
    const to = time(finished?.occurredAt) ?? next;
    if (from !== undefined && to !== undefined) add(from, to, kind === "PRESENT_RESULTS" ? "PRESENTATION" : kind === "INVESTIGATE_CANDIDATE_FACTS" ? "FACTS" : kind, 1, `trajectory[${step.stepNumber ?? index}]`);
  }
  const models = capturedDecisions.length ? capturedDecisions.map(object) : rows(root.modelInvocations);
  for (const [index, model] of models.entries()) {
    const latency = typeof model.latencyMs === "number" && model.latencyMs >= 0 ? model.latencyMs : undefined;
    const settled = time(model.settledAt), from = time(model.startedAt) ?? (settled !== undefined && latency !== undefined ? settled - latency : undefined);
    const to = from !== undefined && latency !== undefined ? from + latency : undefined;
    const purpose = String(model.purpose ?? "UNRECORDED");
    modelSteps.push({ purpose, sequence: model.sequence ?? index + 1, latencyMs: latency ?? null, placed: from !== undefined && to !== undefined });
    if (from !== undefined && to !== undefined) add(from, to, purpose.includes("semantic") ? "SEMANTIC" : `MODEL_DECISION:${purpose}`, 3, `model[${model.sequence ?? index + 1}]`);
  }
  if (modelSteps.some(step => !step.placed)) gaps.push("Some model latency counters lack start/settlement timestamps; reported separately, not assigned wall time.");
  gaps.push("CALENDAR_CONTROL measures only timestamped date/calendar operations with observed target metadata; missing target metadata remains REQUEST_AND_RESULT. Timing never establishes control or inventory success.");
  if (start === undefined || end === undefined || end < start) return { schemaVersion: "restaurant-stage-timings@1", status: "NOT_EVALUATED", elapsedMs: null, criticalPath: [], modelSteps, gaps: ["Missing valid run start/end timestamps.", ...gaps] };
  const clipped = spans.filter(span => span.end > start && span.start < end).map(span => ({ ...span, start: Math.max(start, span.start), end: Math.min(end, span.end) }));
  const boundaries = [...new Set([start, end, ...clipped.flatMap(span => [span.start,span.end])])].sort((a,b) => a-b);
  const totals = new Map<string,number>();
  for (const [index, from] of boundaries.entries()) {
    const to = boundaries[index + 1]; if (to === undefined) continue;
    const active = clipped.filter(span => span.start <= from && span.end >= to).sort((a,b) => b.priority-a.priority || b.start-a.start)[0];
    const label = active?.stage ?? "UNATTRIBUTED";
    totals.set(label,(totals.get(label) ?? 0) + to-from);
  }
  const elapsedMs = end-start;
  return { schemaVersion: "restaurant-stage-timings@1", status: "MEASURED_WITH_EXPLICIT_GAPS", elapsedMs,
    method: "Observed wall-time partition; model intervals override nested action/trace intervals. This is not a dependency-DAG critical-path proof.",
    criticalPath: [...totals].map(([stage,ms]) => ({ stage, elapsedMs: ms, percent: elapsedMs ? ms/elapsedMs*100 : 0 })).sort((a,b) => b.elapsedMs-a.elapsedMs),
    modelSteps, gaps: [...new Set(gaps)] };
}
