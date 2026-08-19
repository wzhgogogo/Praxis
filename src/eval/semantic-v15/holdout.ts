import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  RESTAURANT_BLOCKING_FIELDS,
  type RestaurantSemanticExpectedDecision,
  type RestaurantIntentDraft,
} from "../../domains/restaurant/contracts.js";
import { validateRestaurantIntentDraft } from "../../domains/restaurant/intent-draft.js";
import { missingBlockingFields } from "../../domains/restaurant/intent-state.js";
import {
  RESTAURANT_SEMANTIC_PROPOSAL_PROMPT_VERSION,
  RESTAURANT_SEMANTIC_PROPOSAL_JSON_SCHEMA,
  RESTAURANT_SEMANTIC_PROPOSAL_SCHEMA,
} from "../../domains/restaurant/semantic-proposal.js";
import { buildRestaurantSemanticInterpreterSystemPrompt } from "../../domains/restaurant/semantic-interpreter.js";
import { RESTAURANT_SEMANTIC_SCORER_VERSION } from "./scorer.js";

export const RESTAURANT_SEMANTIC_HOLDOUT_DATASET_ID = "restaurant-semantic-holdout-v2";
export const RESTAURANT_SEMANTIC_HOLDOUT_DATASET_VERSION = "2";
export const RESTAURANT_SEMANTIC_HOLDOUT_REFERENCE_TIME = "2026-08-20T09:00:00+09:00";
export const RESTAURANT_SEMANTIC_HOLDOUT_DEFAULT_PATH =
  ".eval-private/restaurant-semantic-holdout-v2.json";

export const RESTAURANT_SEMANTIC_HOLDOUT_MANIFEST = {
  protocolVersion: "3",
  evaluatorVersion: "3",
  datasetSchemaVersion: "3",
  datasetId: RESTAURANT_SEMANTIC_HOLDOUT_DATASET_ID,
  datasetVersion: RESTAURANT_SEMANTIC_HOLDOUT_DATASET_VERSION,
  referenceTime: RESTAURANT_SEMANTIC_HOLDOUT_REFERENCE_TIME,
  timezone: "Asia/Tokyo",
  provider: "DEEPSEEK",
  model: "deepseek-v4-flash",
  promptVersion: RESTAURANT_SEMANTIC_PROPOSAL_PROMPT_VERSION,
  proposalSchema: RESTAURANT_SEMANTIC_PROPOSAL_SCHEMA,
  responseFormat: "JSON_SCHEMA",
  structuredTransport: "DEEPSEEK_STRICT_FUNCTION_BETA",
  temperature: 0,
  thinking: "disabled",
  maxOutputTokens: 500,
  timeoutMs: 10_000,
  schemaAttempts: 2,
  providerRetries: 0,
  caseOrder: "DATASET_ORDER",
  runtime: "IN_MEMORY",
  search: "FIXTURE",
  executionOrder: [
    "SEMANTIC_INTERPRETER",
    "SEMANTIC_PROPOSAL_CONTRACT",
    "RESTAURANT_SEMANTIC_COMPILER",
    "TASK_RUNTIME_REDUCER",
  ],
} as const;

export type RestaurantSemanticHoldoutDecision = Extract<
  RestaurantSemanticExpectedDecision,
  { type: "ASK_USER" | "SEARCH" }
>;

export interface RestaurantSemanticHoldoutTurn {
  id: string;
  message: string;
  expectedDraft: RestaurantIntentDraft;
  expectedDecision: RestaurantSemanticHoldoutDecision;
}

export interface RestaurantSemanticHoldoutSession {
  id: string;
  turns: readonly RestaurantSemanticHoldoutTurn[];
}

export interface RestaurantSemanticHoldoutDataset {
  schemaVersion: "3";
  id: typeof RESTAURANT_SEMANTIC_HOLDOUT_DATASET_ID;
  version: typeof RESTAURANT_SEMANTIC_HOLDOUT_DATASET_VERSION;
  cohort: "HOLDOUT";
  contaminationStatus: "CLEAN_HOLDOUT";
  referenceTime: typeof RESTAURANT_SEMANTIC_HOLDOUT_REFERENCE_TIME;
  timezone: "Asia/Tokyo";
  sessions: readonly RestaurantSemanticHoldoutSession[];
}

export interface RestaurantSemanticHoldoutFrozenAudit {
  scorerVersion: typeof RESTAURANT_SEMANTIC_SCORER_VERSION;
  proposalSchemaSha256: string;
  promptTemplateSha256: string;
}

export type RestaurantSemanticHoldoutPreflightIssueCode =
  | "DATASET_NOT_FOUND"
  | "INVALID_JSON"
  | "INVALID_DATASET_SHAPE"
  | "FROZEN_MANIFEST_MISMATCH"
  | "EMPTY_HOLDOUT"
  | "EMPTY_SESSION"
  | "DUPLICATE_ID"
  | "INVALID_TURN"
  | "INVALID_EXPECTED_DRAFT"
  | "INVALID_EXPECTED_DECISION";

export interface RestaurantSemanticHoldoutPreflightIssue {
  code: RestaurantSemanticHoldoutPreflightIssueCode;
  path: string;
  message: string;
}

export interface RestaurantSemanticHoldoutPreflightReport {
  preflightVersion: "3";
  mode: "DRAFT" | "REQUIRE_COMPLETE";
  status: "READY_FOR_ANNOTATION" | "READY_FOR_BASELINE" | "NOT_READY";
  datasetPath: string;
  stats: { sessions: number; turns: number };
  issues: RestaurantSemanticHoldoutPreflightIssue[];
  dataset?: RestaurantSemanticHoldoutDataset;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function skipWhitespace(source: string, index: number): number {
  while (index < source.length && /\s/.test(source[index]!)) index += 1;
  return index;
}

function parseJsonObjectDocuments(source: string): unknown[] {
  const documents: unknown[] = [];
  let start: number | undefined;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]!;
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') {
      inString = true;
      continue;
    }
    if (character === "{") {
      if (depth === 0) start = index;
      depth += 1;
      continue;
    }
    if (character === "}") {
      depth -= 1;
      if (depth < 0) throw new Error("Holdout source has unbalanced JSON object delimiters");
      if (depth === 0 && start !== undefined) {
        documents.push(JSON.parse(source.slice(start, index + 1)));
        start = undefined;
      }
    }
  }
  if (depth !== 0 || inString) throw new Error("Holdout source ended before a JSON object closed");
  if (documents.length === 0) throw new Error("Holdout source did not contain a JSON object document");
  return documents;
}

/** Parses a JSON stream of complete object/array documents without inspecting their semantics. */
export function parseRestaurantSemanticHoldoutSource(source: string): unknown {
  try {
    return JSON.parse(source);
  } catch {
    let documents: unknown[] = [];
    try {
      let index = skipWhitespace(source, 0);
      while (index < source.length) {
        const start = index;
        const first = source[index];
        if (first !== "{" && first !== "[") throw new Error("Holdout source is not a JSON document stream");
        const stack: string[] = [];
        let inString = false;
        let escaped = false;
        for (; index < source.length; index += 1) {
          const character = source[index]!;
          if (inString) {
            if (escaped) escaped = false;
            else if (character === "\\") escaped = true;
            else if (character === '"') inString = false;
            continue;
          }
          if (character === '"') {
            inString = true;
            continue;
          }
          if (character === "{" || character === "[") {
            stack.push(character);
            continue;
          }
          if (character === "}" || character === "]") {
            const opened = stack.pop();
            if (
              opened === undefined ||
              (opened === "{" && character !== "}") ||
              (opened === "[" && character !== "]")
            ) {
              throw new Error("Holdout source has unbalanced JSON delimiters");
            }
            if (stack.length === 0) {
              documents.push(JSON.parse(source.slice(start, index + 1)));
              index = skipWhitespace(source, index + 1);
              break;
            }
          }
        }
        if (stack.length > 0 || inString) throw new Error("Holdout source ended before a JSON document closed");
      }
    } catch {
      documents = parseJsonObjectDocuments(source);
    }
    if (documents.length === 0) throw new Error("Holdout source did not contain a JSON document");
    if (documents.length === 1) return documents[0];

    const metadata = documents.find(
      (document) =>
        isRecord(document) &&
        ("referenceTime" in document || "timezone" in document) &&
        !("content" in document) &&
        !("turns" in document),
    );
    const cases = documents.filter((document) => document !== metadata);
    const sourceMetadata = isRecord(metadata) ? metadata : {};
    return {
      schemaVersion: sourceMetadata.schemaVersion ?? "3",
      id: sourceMetadata.id ?? RESTAURANT_SEMANTIC_HOLDOUT_DATASET_ID,
      version: sourceMetadata.version ?? RESTAURANT_SEMANTIC_HOLDOUT_DATASET_VERSION,
      cohort: sourceMetadata.cohort ?? "HOLDOUT",
      contaminationStatus: sourceMetadata.contaminationStatus ?? "CLEAN_HOLDOUT",
      referenceTime: sourceMetadata.referenceTime ?? RESTAURANT_SEMANTIC_HOLDOUT_REFERENCE_TIME,
      timezone: sourceMetadata.timezone ?? "Asia/Tokyo",
      cases,
    };
  }
}

/** Versioned, content-addressed audit fields for the frozen clean-baseline configuration. */
export function restaurantSemanticHoldoutFrozenAudit(): RestaurantSemanticHoldoutFrozenAudit {
  return {
    scorerVersion: RESTAURANT_SEMANTIC_SCORER_VERSION,
    proposalSchemaSha256: sha256(JSON.stringify(RESTAURANT_SEMANTIC_PROPOSAL_JSON_SCHEMA)),
    promptTemplateSha256: sha256(
      buildRestaurantSemanticInterpreterSystemPrompt({
        referenceTime: RESTAURANT_SEMANTIC_HOLDOUT_REFERENCE_TIME,
        timezone: "Asia/Tokyo",
        retryAttempt: 1,
      }),
    ),
  };
}

function issue(
  code: RestaurantSemanticHoldoutPreflightIssueCode,
  path: string,
  message: string,
): RestaurantSemanticHoldoutPreflightIssue {
  return { code, path, message };
}

function validateExpectedDraft(
  value: unknown,
  path: string,
): { draft?: RestaurantIntentDraft; issues: RestaurantSemanticHoldoutPreflightIssue[] } {
  if (!isRecord(value)) {
    return { issues: [issue("INVALID_EXPECTED_DRAFT", path, "expectedDraft must be an object")] };
  }
  if (
    !hasOnlyKeys(value, [
      "schemaVersion",
      "timezone",
      "target",
      "date",
      "timeWindow",
      "partySize",
      "area",
      "criteria",
      "budgetPerPerson",
    ])
  ) {
    return {
      issues: [issue("INVALID_EXPECTED_DRAFT", path, "expectedDraft contains unsupported fields")],
    };
  }
  const validation = validateRestaurantIntentDraft(value);
  if (!validation.valid) {
    return {
      issues: validation.errors.map((message) =>
        issue("INVALID_EXPECTED_DRAFT", path, message),
      ),
    };
  }
  return { draft: validation.value, issues: [] };
}

function validateExpectedDecision(
  value: unknown,
  expectedDraft: RestaurantIntentDraft | undefined,
  path: string,
): { decision?: RestaurantSemanticHoldoutDecision; issues: RestaurantSemanticHoldoutPreflightIssue[] } {
  if (!isRecord(value) || !isNonBlankString(value.type)) {
    return {
      issues: [issue("INVALID_EXPECTED_DECISION", path, "expectedDecision must be an object with a type")],
    };
  }
  if (value.type === "SEARCH") {
    if (!hasOnlyKeys(value, ["type"])) {
      return {
        issues: [issue("INVALID_EXPECTED_DECISION", path, "SEARCH cannot contain other fields")],
      };
    }
    if (expectedDraft && missingBlockingFields(expectedDraft).length > 0) {
      return {
        issues: [issue("INVALID_EXPECTED_DECISION", path, "SEARCH requires a complete expectedDraft")],
      };
    }
    return { decision: { type: "SEARCH" }, issues: [] };
  }
  if (value.type !== "ASK_USER" || !hasOnlyKeys(value, ["type", "missingRequiredFields"])) {
    return {
      issues: [
        issue(
          "INVALID_EXPECTED_DECISION",
          path,
          "expectedDecision must be SEARCH or ASK_USER with missingRequiredFields",
        ),
      ],
    };
  }
  if (
    !Array.isArray(value.missingRequiredFields) ||
    !value.missingRequiredFields.every(
      (field) =>
        typeof field === "string" &&
        (RESTAURANT_BLOCKING_FIELDS as readonly string[]).includes(field),
    )
  ) {
    return {
      issues: [issue("INVALID_EXPECTED_DECISION", path, "missingRequiredFields is invalid")],
    };
  }
  const missingRequiredFields = value.missingRequiredFields as (typeof RESTAURANT_BLOCKING_FIELDS)[number][];
  if (
    expectedDraft &&
    JSON.stringify(missingRequiredFields) !== JSON.stringify(missingBlockingFields(expectedDraft))
  ) {
    return {
      issues: [
        issue(
          "INVALID_EXPECTED_DECISION",
          path,
          "ASK_USER missingRequiredFields must exactly match expectedDraft in canonical order",
        ),
      ],
    };
  }
  return { decision: { type: "ASK_USER", missingRequiredFields: [...missingRequiredFields] }, issues: [] };
}

function normalizeSimpleTimeWindow(value: unknown): unknown {
  if (typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return { earliest: value, latest: value };
  }
  return value;
}

function normalizeSimpleArea(value: unknown): unknown {
  return typeof value === "string" ? { query: value } : value;
}

function normalizeSimpleDecision(value: unknown, missingRequiredFields: unknown): unknown {
  if (value === "ASK") return { type: "ASK_USER", missingRequiredFields };
  if (value === "SEARCH") return { type: "SEARCH" };
  if (isRecord(value) && value.type === "ASK") {
    return { type: "ASK_USER", missingRequiredFields: value.missingRequiredFields };
  }
  return value;
}

function adaptSimpleTurn(value: unknown, sessionIndex: number, turnIndex: number): unknown {
  if (!isRecord(value) || "expectedDraft" in value || "expectedDecision" in value) return value;
  return {
    id: value.id ?? `session-${sessionIndex + 1}-turn-${turnIndex + 1}`,
    message: value.content,
    expectedDraft: {
      schemaVersion: "3",
      timezone: "Asia/Tokyo",
      ...(value.date !== undefined ? { date: value.date } : {}),
      ...(value.timeWindow !== undefined
        ? { timeWindow: normalizeSimpleTimeWindow(value.timeWindow) }
        : {}),
      ...(value.partySize !== undefined ? { partySize: value.partySize } : {}),
      ...(value.area !== undefined ? { area: normalizeSimpleArea(value.area) } : {}),
      criteria: value.criteria,
    },
    expectedDecision: normalizeSimpleDecision(value.decision, value.missingRequiredFields),
  };
}

/**
 * Structural-only adapter for the user annotation format. It maps names and exact
 * shapes but intentionally neither infers Gold meaning nor modifies annotated values.
 */
function adaptRestaurantSemanticHoldout(input: unknown): unknown {
  if (!isRecord(input)) return input;
  const rawSessions = Array.isArray(input.sessions)
    ? input.sessions
    : Array.isArray(input.cases)
      ? input.cases
      : undefined;
  if (!rawSessions) return input;
  const isSimple = rawSessions.some(
    (session) =>
      isRecord(session) &&
      (("content" in session && !("turns" in session)) ||
        (Array.isArray(session.turns) &&
          session.turns.some((turn) => isRecord(turn) && "content" in turn))),
  );
  if (!isSimple) return input;

  return {
    schemaVersion: input.schemaVersion,
    id: input.id,
    version: input.version,
    cohort: input.cohort,
    contaminationStatus: input.contaminationStatus,
    referenceTime: input.referenceTime,
    timezone: input.timezone,
    sessions: rawSessions.map((session, sessionIndex) => {
      if (!isRecord(session)) return session;
      const sourceTurns = session.turns;
      const hasSourceTurns = Array.isArray(sourceTurns);
      const turns: unknown[] = Array.isArray(sourceTurns) ? sourceTurns : [session];
      return {
        // A one-turn source case supplies one case/turn id, not a separate session id.
        // Keep that id on the turn and introduce a deterministic structural wrapper id.
        id: hasSourceTurns ? (session.id ?? `session-${sessionIndex + 1}`) : `source-session-${sessionIndex + 1}`,
        turns: turns.map((turn, turnIndex) => adaptSimpleTurn(turn, sessionIndex, turnIndex)),
      };
    }),
  };
}

export function preflightRestaurantSemanticHoldout(
  input: unknown,
  options: { mode: RestaurantSemanticHoldoutPreflightReport["mode"]; datasetPath: string },
): RestaurantSemanticHoldoutPreflightReport {
  input = adaptRestaurantSemanticHoldout(input);
  const issues: RestaurantSemanticHoldoutPreflightIssue[] = [];
  if (!isRecord(input)) {
    return {
      preflightVersion: "3",
      mode: options.mode,
      status: "NOT_READY",
      datasetPath: options.datasetPath,
      stats: { sessions: 0, turns: 0 },
      issues: [issue("INVALID_DATASET_SHAPE", "$", "Holdout dataset must be an object")],
    };
  }
  if (
    !hasOnlyKeys(input, [
      "schemaVersion",
      "id",
      "version",
      "cohort",
      "contaminationStatus",
      "referenceTime",
      "timezone",
      "sessions",
    ])
  ) {
    issues.push(issue("INVALID_DATASET_SHAPE", "$", "Holdout dataset contains unsupported fields"));
  }
  const frozenFields = [
    ["schemaVersion", "3"],
    ["id", RESTAURANT_SEMANTIC_HOLDOUT_DATASET_ID],
    ["version", RESTAURANT_SEMANTIC_HOLDOUT_DATASET_VERSION],
    ["cohort", "HOLDOUT"],
    ["contaminationStatus", "CLEAN_HOLDOUT"],
    ["referenceTime", RESTAURANT_SEMANTIC_HOLDOUT_REFERENCE_TIME],
    ["timezone", "Asia/Tokyo"],
  ] as const;
  for (const [field, expected] of frozenFields) {
    if (input[field] !== expected) {
      issues.push(
        issue(
          "FROZEN_MANIFEST_MISMATCH",
          `$.${field}`,
          `${field} must remain ${JSON.stringify(expected)}`,
        ),
      );
    }
  }
  if (!Array.isArray(input.sessions)) {
    issues.push(issue("INVALID_DATASET_SHAPE", "$.sessions", "sessions must be an array"));
  }

  const sessions: RestaurantSemanticHoldoutSession[] = [];
  const seenIds = new Set<string>();
  let turnCount = 0;
  if (Array.isArray(input.sessions)) {
    if (options.mode === "REQUIRE_COMPLETE" && input.sessions.length === 0) {
      issues.push(issue("EMPTY_HOLDOUT", "$.sessions", "Add at least one fully labelled session"));
    }
    input.sessions.forEach((sessionValue, sessionIndex) => {
      const sessionPath = `$.sessions[${sessionIndex}]`;
      if (
        !isRecord(sessionValue) ||
        !hasOnlyKeys(sessionValue, ["id", "turns"]) ||
        !isNonBlankString(sessionValue.id) ||
        !Array.isArray(sessionValue.turns)
      ) {
        issues.push(issue("INVALID_DATASET_SHAPE", sessionPath, "session must contain id and turns only"));
        return;
      }
      if (seenIds.has(sessionValue.id)) {
        issues.push(issue("DUPLICATE_ID", `${sessionPath}.id`, `duplicate id ${sessionValue.id}`));
      }
      seenIds.add(sessionValue.id);
      if (options.mode === "REQUIRE_COMPLETE" && sessionValue.turns.length === 0) {
        issues.push(issue("EMPTY_SESSION", `${sessionPath}.turns`, "session must contain at least one turn"));
      }
      const turns: RestaurantSemanticHoldoutTurn[] = [];
      sessionValue.turns.forEach((turnValue, turnIndex) => {
        turnCount += 1;
        const turnPath = `${sessionPath}.turns[${turnIndex}]`;
        if (
          !isRecord(turnValue) ||
          !hasOnlyKeys(turnValue, ["id", "message", "expectedDraft", "expectedDecision"]) ||
          !isNonBlankString(turnValue.id) ||
          !isNonBlankString(turnValue.message) ||
          turnValue.message.length > 2_000
        ) {
          issues.push(
            issue(
              "INVALID_TURN",
              turnPath,
              "turn must contain a non-empty id, message, expectedDraft and expectedDecision only",
            ),
          );
          return;
        }
        if (seenIds.has(turnValue.id)) {
          issues.push(issue("DUPLICATE_ID", `${turnPath}.id`, `duplicate id ${turnValue.id}`));
        }
        seenIds.add(turnValue.id);
        const draftValidation = validateExpectedDraft(turnValue.expectedDraft, `${turnPath}.expectedDraft`);
        issues.push(...draftValidation.issues);
        const decisionValidation = validateExpectedDecision(
          turnValue.expectedDecision,
          draftValidation.draft,
          `${turnPath}.expectedDecision`,
        );
        issues.push(...decisionValidation.issues);
        if (draftValidation.draft && decisionValidation.decision) {
          turns.push({
            id: turnValue.id,
            message: turnValue.message,
            expectedDraft: draftValidation.draft,
            expectedDecision: decisionValidation.decision,
          });
        }
      });
      sessions.push({ id: sessionValue.id, turns });
    });
  }

  const report: RestaurantSemanticHoldoutPreflightReport = {
    preflightVersion: "3",
    mode: options.mode,
    status:
      issues.length === 0
        ? options.mode === "DRAFT"
          ? "READY_FOR_ANNOTATION"
          : "READY_FOR_BASELINE"
        : "NOT_READY",
    datasetPath: options.datasetPath,
    stats: { sessions: Array.isArray(input.sessions) ? input.sessions.length : 0, turns: turnCount },
    issues,
  };
  if (issues.length === 0) {
    report.dataset = {
      schemaVersion: "3",
      id: RESTAURANT_SEMANTIC_HOLDOUT_DATASET_ID,
      version: RESTAURANT_SEMANTIC_HOLDOUT_DATASET_VERSION,
      cohort: "HOLDOUT",
      contaminationStatus: "CLEAN_HOLDOUT",
      referenceTime: RESTAURANT_SEMANTIC_HOLDOUT_REFERENCE_TIME,
      timezone: "Asia/Tokyo",
      sessions,
    };
  }
  return report;
}

export async function loadRestaurantSemanticHoldout(
  inputPath = process.env.PRAXIS_SEMANTIC_HOLDOUT_PATH ?? RESTAURANT_SEMANTIC_HOLDOUT_DEFAULT_PATH,
  mode: RestaurantSemanticHoldoutPreflightReport["mode"] = "REQUIRE_COMPLETE",
): Promise<RestaurantSemanticHoldoutPreflightReport> {
  const datasetPath = resolve(inputPath);
  let source: string;
  try {
    source = await readFile(datasetPath, "utf8");
  } catch (error) {
    const code = isRecord(error) ? error.code : undefined;
    return {
      preflightVersion: "3",
      mode,
      status: "NOT_READY",
      datasetPath,
      stats: { sessions: 0, turns: 0 },
      issues: [
        issue(
          "DATASET_NOT_FOUND",
          "$",
          code === "ENOENT" ? `Holdout dataset not found at ${datasetPath}` : String(error),
        ),
      ],
    };
  }
  let parsed: unknown;
  try {
    parsed = parseRestaurantSemanticHoldoutSource(source);
  } catch {
    return {
      preflightVersion: "3",
      mode,
      status: "NOT_READY",
      datasetPath,
      stats: { sessions: 0, turns: 0 },
      issues: [issue("INVALID_JSON", "$", "Holdout dataset must contain valid JSON")],
    };
  }
  return preflightRestaurantSemanticHoldout(parsed, { mode, datasetPath });
}

export function restaurantSemanticHoldoutTurnCount(dataset: RestaurantSemanticHoldoutDataset): number {
  return dataset.sessions.reduce((count, session) => count + session.turns.length, 0);
}
