import type { ModelInvocationRecord, ModelUsage } from "../core/model/contracts.js";
import {
  RestaurantIntentParser as DomainRestaurantIntentParser,
  type RestaurantIntentParseResult,
} from "../domains/restaurant/intent-parser.js";
import type { RestaurantIntentParser } from "./restaurant-intent-eval.js";

export const LIVE_MODEL_EVAL_ENABLE_ENV = "PRAXIS_ALLOW_LIVE_MODEL_EVAL";

export interface RealModelEvalPricing {
  inputUsdPerMillionTokens: number;
  outputUsdPerMillionTokens: number;
}

export interface RealModelEvalConfiguration {
  caseLimit: number;
  pricing?: RealModelEvalPricing;
}

export type RealModelEvalCost =
  | { status: "NOT_CONFIGURED" }
  | { status: "NOT_COMPUTABLE"; reason: string }
  | {
      status: "ESTIMATED_FROM_ENV";
      currency: "USD";
      amount: number;
      inputUsdPerMillionTokens: number;
      outputUsdPerMillionTokens: number;
    };

export interface RealModelEvalMetrics {
  modelCalls: number;
  successfulCalls: number;
  failedCalls: number;
  retryCalls: number;
  totalLatencyMs: number;
  providerModels: string[];
  usage: {
    reportedByCalls: number;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    reasoningTokens?: number;
  };
  cost: RealModelEvalCost;
}

function parsePositiveInteger(value: string | undefined, name: string, max: number): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} must be a positive integer`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) {
    throw new Error(`${name} must be between 1 and ${max}`);
  }
  return parsed;
}

function parseNonNegativeNumber(value: string | undefined, name: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative number`);
  }
  return parsed;
}

export function requireRealModelEvalConfiguration(
  environment: NodeJS.ProcessEnv,
  maxCases: number,
): RealModelEvalConfiguration {
  if (environment[LIVE_MODEL_EVAL_ENABLE_ENV] !== "1") {
    throw new Error(
      `${LIVE_MODEL_EVAL_ENABLE_ENV}=1 is required before a real model Eval can make paid network calls`,
    );
  }
  const caseLimit =
    parsePositiveInteger(environment.PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT, "PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT", maxCases) ??
    maxCases;
  const inputUsdPerMillionTokens = parseNonNegativeNumber(
    environment.PRAXIS_DEEPSEEK_INPUT_USD_PER_MILLION_TOKENS,
    "PRAXIS_DEEPSEEK_INPUT_USD_PER_MILLION_TOKENS",
  );
  const outputUsdPerMillionTokens = parseNonNegativeNumber(
    environment.PRAXIS_DEEPSEEK_OUTPUT_USD_PER_MILLION_TOKENS,
    "PRAXIS_DEEPSEEK_OUTPUT_USD_PER_MILLION_TOKENS",
  );
  if ((inputUsdPerMillionTokens === undefined) !== (outputUsdPerMillionTokens === undefined)) {
    throw new Error(
      "Set both PRAXIS_DEEPSEEK_INPUT_USD_PER_MILLION_TOKENS and PRAXIS_DEEPSEEK_OUTPUT_USD_PER_MILLION_TOKENS, or neither",
    );
  }
  return {
    caseLimit,
    ...(inputUsdPerMillionTokens !== undefined && outputUsdPerMillionTokens !== undefined
      ? {
          pricing: {
            inputUsdPerMillionTokens,
            outputUsdPerMillionTokens,
          },
        }
      : {}),
  };
}

function sumUsage(
  records: readonly ModelInvocationRecord[],
  field: keyof ModelUsage,
): number | undefined {
  const values = records
    .map((record) => record.usage?.[field])
    .filter((value): value is number => value !== undefined);
  return values.length === 0 ? undefined : values.reduce((sum, value) => sum + value, 0);
}

function costFor(
  inputTokens: number | undefined,
  outputTokens: number | undefined,
  pricing: RealModelEvalPricing | undefined,
  allUsageReported: boolean,
): RealModelEvalCost {
  if (pricing === undefined) {
    return { status: "NOT_CONFIGURED" };
  }
  if (!allUsageReported || inputTokens === undefined || outputTokens === undefined) {
    return {
      status: "NOT_COMPUTABLE",
      reason: "Provider usage did not include both inputTokens and outputTokens for every required total",
    };
  }
  return {
    status: "ESTIMATED_FROM_ENV",
    currency: "USD",
    amount: Number(
      (
        (inputTokens * pricing.inputUsdPerMillionTokens +
          outputTokens * pricing.outputUsdPerMillionTokens) /
        1_000_000
      ).toFixed(8),
    ),
    inputUsdPerMillionTokens: pricing.inputUsdPerMillionTokens,
    outputUsdPerMillionTokens: pricing.outputUsdPerMillionTokens,
  };
}

export function summarizeRealModelEval(
  records: readonly ModelInvocationRecord[],
  evaluatedCases: number,
  pricing: RealModelEvalPricing | undefined,
): RealModelEvalMetrics {
  const inputTokens = sumUsage(records, "inputTokens");
  const outputTokens = sumUsage(records, "outputTokens");
  const totalTokens = sumUsage(records, "totalTokens");
  const reasoningTokens = sumUsage(records, "reasoningTokens");
  const usage: RealModelEvalMetrics["usage"] = {
    reportedByCalls: records.filter((record) => record.usage !== undefined).length,
    ...(inputTokens !== undefined ? { inputTokens } : {}),
    ...(outputTokens !== undefined ? { outputTokens } : {}),
    ...(totalTokens !== undefined ? { totalTokens } : {}),
    ...(reasoningTokens !== undefined ? { reasoningTokens } : {}),
  };
  const allUsageReported = records.every(
    (record) =>
      record.usage?.inputTokens !== undefined && record.usage.outputTokens !== undefined,
  );
  return {
    modelCalls: records.length,
    successfulCalls: records.filter((record) => record.outcome === "SUCCEEDED").length,
    failedCalls: records.filter((record) => record.outcome === "FAILED").length,
    retryCalls: Math.max(0, records.length - evaluatedCases),
    totalLatencyMs: records.reduce((sum, record) => sum + record.latencyMs, 0),
    providerModels: [...new Set(records.map((record) => `${record.provider}:${record.model}`))].sort(),
    usage,
    cost: costFor(inputTokens, outputTokens, pricing, allUsageReported),
  };
}

function draftOrUndefined(result: RestaurantIntentParseResult): unknown {
  return result.status === "PARSED" ? result.draft : undefined;
}

export function createRealModelRestaurantIntentEvalParser(
  parser: DomainRestaurantIntentParser,
): RestaurantIntentParser {
  return {
    id: "restaurant-intent-parser-v1",
    mode: "REAL_MODEL",
    async parse(input) {
      return draftOrUndefined(
        await parser.parse({
          taskId: `eval:intent:${input.caseId}`,
          message: input.message,
          referenceTime: input.referenceTime,
          timezone: input.timezone,
        }),
      );
    },
  };
}
