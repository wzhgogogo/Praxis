export type ModelProvider = "DEEPSEEK" | "FIXTURE";

export type ModelMessageRole = "system" | "user" | "assistant";

export interface ModelMessage {
  role: ModelMessageRole;
  content: string;
}

export type ModelResponseFormat = "TEXT" | "JSON_OBJECT" | "JSON_SCHEMA";

export type ModelFallback = "STRUCTURED_FORM" | "FAIL_CLOSED";

/** The versioned Domain schema that will validate the untrusted model response. */
export interface ModelOutputSchemaRef {
  name: string;
  version: string;
}

/** Generic JSON Schema owned by the calling Domain and transported without Infrastructure imports. */
export interface ModelOutputSchema extends ModelOutputSchemaRef {
  jsonSchema?: Readonly<Record<string, unknown>>;
}

export interface ModelRequest {
  /** Internal Task identifier. It is retained in Praxis telemetry and never sent to the provider. */
  taskId: string;
  /** Stable feature name, for example `restaurant_semantic_interpret`. */
  purpose: string;
  /** Immutable prompt revision, for example `v1`. */
  promptVersion: string;
  messages: readonly ModelMessage[];
  responseFormat: ModelResponseFormat;
  outputSchema: ModelOutputSchema;
  timeoutMs: number;
  fallback: ModelFallback;
  maxOutputTokens?: number;
  temperature?: number;
  thinking?: "enabled" | "disabled";
}

export interface ModelUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  reasoningTokens?: number;
}

export type ModelFinishReason =
  | "STOP"
  | "LENGTH"
  | "CONTENT_FILTER"
  | "TOOL_CALLS"
  | "INSUFFICIENT_SYSTEM_RESOURCE"
  | "UNKNOWN";

export interface ModelResponse {
  invocationId: string;
  provider: ModelProvider;
  providerRequestId?: string;
  model: string;
  outputText: string;
  finishReason: ModelFinishReason;
  usage?: ModelUsage;
  latencyMs: number;
}

export type ModelInvocationOutcome = "SUCCEEDED" | "FAILED";

/** Safe, bounded provider diagnostics. Never contains headers, prompts, or credentials. */
export interface ModelProviderErrorDiagnostic {
  code?: string;
  type?: string;
  message?: string;
}

/**
 * Deliberately excludes prompt and completion content. Those can contain user data and
 * must not be copied into ordinary application logs.
 */
export interface ModelInvocationRecord {
  invocationId: string;
  taskId: string;
  purpose: string;
  promptVersion: string;
  fallback: ModelFallback;
  provider: ModelProvider;
  model: string;
  responseFormat: ModelResponseFormat;
  outputSchema: ModelOutputSchemaRef;
  outcome: ModelInvocationOutcome;
  latencyMs: number;
  usage?: ModelUsage;
  providerRequestId?: string;
  providerStatus?: number;
  errorCode?: string;
  providerError?: ModelProviderErrorDiagnostic;
}

export interface ModelInvocationObserver {
  observe(record: ModelInvocationRecord): Promise<void> | void;
}

export interface ModelGateway {
  complete(request: ModelRequest): Promise<ModelResponse>;
}

function isNonBlankString(value: string): boolean {
  return value.trim().length > 0;
}

export function validateModelRequest(request: ModelRequest): string[] {
  const errors: string[] = [];
  if (!isNonBlankString(request.taskId)) {
    errors.push("taskId must be non-empty");
  }
  if (!isNonBlankString(request.purpose)) {
    errors.push("purpose must be non-empty");
  }
  if (!isNonBlankString(request.promptVersion)) {
    errors.push("promptVersion must be non-empty");
  }
  if (request.messages.length === 0) {
    errors.push("messages must not be empty");
  }
  if (request.messages.some((message) => !isNonBlankString(message.content))) {
    errors.push("message content must be non-empty");
  }
  if (!isNonBlankString(request.outputSchema.name)) {
    errors.push("outputSchema.name must be non-empty");
  }
  if (!isNonBlankString(request.outputSchema.version)) {
    errors.push("outputSchema.version must be non-empty");
  }
  if (
    request.responseFormat === "JSON_SCHEMA" &&
    (request.outputSchema.jsonSchema === undefined ||
      typeof request.outputSchema.jsonSchema !== "object" ||
      request.outputSchema.jsonSchema === null ||
      Array.isArray(request.outputSchema.jsonSchema))
  ) {
    errors.push("outputSchema.jsonSchema must be an object for JSON_SCHEMA responses");
  }
  if (!Number.isInteger(request.timeoutMs) || request.timeoutMs <= 0) {
    errors.push("timeoutMs must be a positive integer");
  }
  if (
    request.maxOutputTokens !== undefined &&
    (!Number.isInteger(request.maxOutputTokens) || request.maxOutputTokens <= 0)
  ) {
    errors.push("maxOutputTokens must be a positive integer when provided");
  }
  if (
    request.temperature !== undefined &&
    (!Number.isFinite(request.temperature) || request.temperature < 0 || request.temperature > 2)
  ) {
    errors.push("temperature must be between 0 and 2 when provided");
  }
  return errors;
}
