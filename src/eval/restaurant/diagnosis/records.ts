/** JSON observations shared by the report builder and its read-only file boundary. */
export type RecordValue = Record<string, unknown>;
export const record = (value: unknown): RecordValue => value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
export const rows = (value: unknown): RecordValue[] => Array.isArray(value) ? value.map(record) : [];
export const texts = (value: unknown): string[] => Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
export const text = (value: unknown): string | undefined => typeof value === "string" ? value : undefined;
export const number = (value: unknown): number | undefined => typeof value === "number" && Number.isFinite(value) ? value : undefined;
export const epoch = (value: unknown): number | undefined => typeof value === "string" && Number.isFinite(Date.parse(value)) ? Date.parse(value) : undefined;
export const token = (value: string) => value.replace(/~/g, "~0").replace(/\//g, "~1");
export function pointer(value: unknown, path: string): unknown {
  if (path === "") return value;
  if (!path.startsWith("/")) return undefined;
  return path.slice(1).split("/").reduce<unknown>((v, key) => record(v)[key.replace(/~1/g, "/").replace(/~0/g, "~")]
    ?? (Array.isArray(v) ? v[Number(key)] : undefined), value);
}
export interface SourceRef { path: string; sha256: string; }
export interface EvidenceRef extends SourceRef { pointer: string; }
export interface Metric {
  status: "MEASURED" | "MEASURED_WITH_GAPS" | "NOT_EVALUATED" | "NOT_APPLICABLE";
  value: number | null; basis: string; refs: EvidenceRef[]; missing: string[];
}
export const missingMetric = (basis: string, missing: string): Metric => ({ status: "NOT_EVALUATED", value: null, basis, refs: [], missing: [missing] });
export function intervalUnion(intervals: Array<[number, number]>): number {
  const ordered = intervals.filter(([a,b]) => b >= a).sort((a,b) => a[0]-b[0]);
  let end = -Infinity, total = 0;
  for (const [a,b] of ordered) { total += Math.max(0,b-Math.max(a,end)); end = Math.max(end,b); }
  return total;
}
