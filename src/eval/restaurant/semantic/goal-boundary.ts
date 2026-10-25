import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { RestaurantGoalBoundaryExpectation } from "./scorer.js";

export const RESTAURANT_GOAL_BOUNDARY_ANNOTATIONS = "restaurant-goal-boundary-annotations@1";
const sourcePath = "src/eval/restaurant/semantic/fixtures.ts";
const annotationPath = "src/eval/restaurant/semantic/cases/goal-boundary-annotations.json";
const hash = (text: string | Buffer) => createHash("sha256").update(text).digest("hex");

function record(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).length !== keys.length || !keys.every(key => Object.hasOwn(value, key))) {
    throw new Error("Invalid goal-boundary annotation keys");
  }
  return value as Record<string, unknown>;
}

const source = JSON.parse(readFileSync(resolve(annotationPath), "utf8")) as unknown;
const manifest = record(source, ["schema", "approval", "source", "turns"]);
const binding = record(manifest.source, ["path", "sha256"]);
if (manifest.schema !== RESTAURANT_GOAL_BOUNDARY_ANNOTATIONS || typeof manifest.approval !== "string"
  || binding.path !== sourcePath || binding.sha256 !== hash(readFileSync(resolve(sourcePath)))
  || !Array.isArray(manifest.turns) || manifest.turns.length !== 15) {
  throw new Error("Goal-boundary source SHA or annotation manifest mismatch");
}

interface Annotation {
  sessionId: string;
  turnId: string;
  messageSha256: string;
  category: "A" | "B" | "NO_TIME" | "GRAY";
  contextCarry: boolean;
}

const annotations: Annotation[] = manifest.turns.map(value => {
  const row = record(value, ["sessionId", "turnId", "messageSha256", "category", "contextCarry"]);
  if (![row.sessionId, row.turnId, row.messageSha256].every(value => typeof value === "string" && value.length > 0)
    || !["A", "B", "NO_TIME", "GRAY"].includes(String(row.category)) || typeof row.contextCarry !== "boolean") {
    throw new Error("Invalid goal-boundary annotation value");
  }
  return row as unknown as Annotation;
});
if (new Set(annotations.map(row => `${row.sessionId}/${row.turnId}`)).size !== annotations.length) {
  throw new Error("Duplicate goal-boundary turn binding");
}

export function restaurantSemanticGoalAnnotation(message: string, turnId?: string, sessionId?: string): Omit<RestaurantGoalBoundaryExpectation, "previousGoal"> {
  const annotation = annotations.find(row => row.messageSha256 === hash(message)
    && (turnId === undefined || row.turnId === turnId) && (sessionId === undefined || row.sessionId === sessionId));
  if (!annotation) throw new Error("No exact frozen goal-boundary annotation for this user turn");
  return { category: annotation.contextCarry ? "CONTEXT_CARRY" : annotation.category, message };
}
