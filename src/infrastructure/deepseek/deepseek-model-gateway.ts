import {
  type ModelFinishReason,
  type ModelGateway,
  type ModelInvocationObserver,
  type ModelInvocationRecord,
  type ModelRequest,
  type ModelResponse,
  type ModelUsage,
  validateModelRequest,
} from "../../core/model/contracts.js";
import { ModelGatewayError, type ModelProviderErrorDiagnostic } from "../../core/model/errors.js";

const DEEPSEEK_CHAT_COMPLETIONS_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_BETA_CHAT_COMPLETIONS_URL = "https://api.deepseek.com/beta/chat/completions";

export interface DeepSeekGatewayConfig {
  apiKey: string;
  model: string;
  fetchImplementation?: typeof fetch;
  observer?: ModelInvocationObserver;
  now?: () => number;
}

interface DeepSeekResponseChoice {
  finish_reason?: unknown;
  message?: {
    content?: unknown;
    tool_calls?: unknown;
  };
}

interface DeepSeekResponseBody {
  id?: unknown;
  model?: unknown;
  choices?: unknown;
  usage?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonBlankEnvironmentValue(
  environment: NodeJS.ProcessEnv,
  key: "DEEPSEEK_API_KEY" | "DEEPSEEK_MODEL",
): string {
  const value = environment[key];
  if (value === undefined || value.trim().length === 0) {
    throw new ModelGatewayError(
      `${key} must be configured on the server before DeepSeek can be used`,
      "CONFIGURATION",
      false,
    );
  }
  return value;
}

function requireNonBlank(value: string, name: string): void {
  if (value.trim().length === 0) {
    throw new ModelGatewayError(`${name} must be non-empty`, "CONFIGURATION", false);
  }
}

function mapFinishReason(value: unknown): ModelFinishReason {
  switch (value) {
    case "stop":
      return "STOP";
    case "length":
      return "LENGTH";
    case "content_filter":
      return "CONTENT_FILTER";
    case "tool_calls":
      return "TOOL_CALLS";
    case "insufficient_system_resource":
      return "INSUFFICIENT_SYSTEM_RESOURCE";
    default:
      return "UNKNOWN";
  }
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parseUsage(value: unknown): ModelUsage | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const completionDetails = isRecord(value.completion_tokens_details)
    ? value.completion_tokens_details
    : undefined;
  const inputTokens = numberOrUndefined(value.prompt_tokens);
  const outputTokens = numberOrUndefined(value.completion_tokens);
  const totalTokens = numberOrUndefined(value.total_tokens);
  const reasoningTokens =
    completionDetails === undefined
      ? undefined
      : numberOrUndefined(completionDetails.reasoning_tokens);
  const usage: ModelUsage = {};
  if (inputTokens !== undefined) {
    usage.inputTokens = inputTokens;
  }
  if (outputTokens !== undefined) {
    usage.outputTokens = outputTokens;
  }
  if (totalTokens !== undefined) {
    usage.totalTokens = totalTokens;
  }
  if (reasoningTokens !== undefined) {
    usage.reasoningTokens = reasoningTokens;
  }
  return Object.keys(usage).length === 0 ? undefined : usage;
}

function parseStructuredArguments(
  choice: DeepSeekResponseChoice,
  request: ModelRequest,
): string {
  if (choice.finish_reason !== "tool_calls" || !Array.isArray(choice.message?.tool_calls)) {
    throw new ModelGatewayError(
      "Model provider did not return the required structured output call",
      "MALFORMED_RESPONSE",
      false,
    );
  }
  if (choice.message.tool_calls.length !== 1) {
    throw new ModelGatewayError(
      "Model provider returned an unexpected number of structured output calls",
      "MALFORMED_RESPONSE",
      false,
    );
  }
  const call = choice.message.tool_calls[0];
  if (
    !isRecord(call) ||
    call.type !== "function" ||
    !isRecord(call.function) ||
    call.function.name !== request.outputSchema.name ||
    typeof call.function.arguments !== "string"
  ) {
    throw new ModelGatewayError(
      "Model provider returned the wrong structured output function",
      "MALFORMED_RESPONSE",
      false,
    );
  }
  return call.function.arguments;
}

function parseCompletion(body: unknown, request: ModelRequest): {
  providerRequestId?: string;
  model: string;
  outputText: string;
  finishReason: ModelFinishReason;
  usage?: ModelUsage;
} {
  if (!isRecord(body)) {
    throw new ModelGatewayError("Model provider returned a non-object response", "MALFORMED_RESPONSE", false);
  }
  const response = body as DeepSeekResponseBody;
  if (typeof response.model !== "string" || response.model.trim().length === 0) {
    throw new ModelGatewayError("Model provider response is missing model", "MALFORMED_RESPONSE", false);
  }
  if (!Array.isArray(response.choices) || response.choices.length === 0) {
    throw new ModelGatewayError("Model provider response is missing choices", "MALFORMED_RESPONSE", false);
  }
  const choice = response.choices[0] as DeepSeekResponseChoice | undefined;
  if (!choice) {
    throw new ModelGatewayError("Model provider response is missing a choice", "MALFORMED_RESPONSE", false);
  }
  const outputText =
    request.responseFormat === "JSON_SCHEMA"
      ? parseStructuredArguments(choice, request)
      : typeof choice.message?.content === "string"
        ? choice.message.content
        : undefined;
  if (outputText === undefined) {
    throw new ModelGatewayError(
      "Model provider response does not contain text completion content",
      "MALFORMED_RESPONSE",
      false,
    );
  }
  const usage = parseUsage(response.usage);
  return {
    ...(typeof response.id === "string" && response.id.trim().length > 0
      ? { providerRequestId: response.id }
      : {}),
    model: response.model,
    outputText,
    finishReason: mapFinishReason(choice.finish_reason),
    ...(usage !== undefined ? { usage } : {}),
  };
}

function nonBlankString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function sanitizedProviderMessage(value: unknown): string | undefined {
  const message = nonBlankString(value);
  if (!message) return undefined;
  return message
    .replace(/\b(?:bearer\s+)?(?:sk|key|token)_[a-z0-9_-]+\b/gi, "[redacted]")
    .replace(/\s+/g, " ")
    .slice(0, 240);
}

function providerRequestId(response: Response): string | undefined {
  return response.headers.get("x-request-id")?.trim()
    || response.headers.get("request-id")?.trim()
    || response.headers.get("x-ratelimit-request-id")?.trim()
    || undefined;
}

async function providerErrorForResponse(response: Response): Promise<ModelGatewayError> {
  let diagnostic: ModelProviderErrorDiagnostic | undefined;
  try {
    const body: unknown = await response.json();
    const root = isRecord(body) && isRecord(body.error) ? body.error : isRecord(body) ? body : undefined;
    if (root) {
      const code = nonBlankString(root.code);
      const type = nonBlankString(root.type);
      const message = sanitizedProviderMessage(root.message);
      if (code || type || message) diagnostic = { ...(code ? { code } : {}), ...(type ? { type } : {}), ...(message ? { message } : {}) };
    }
  } catch { /* A failed provider response may not be JSON; status remains diagnostic. */ }
  const rateLimited = response.status === 429;
  return new ModelGatewayError(
    `DeepSeek rejected the completion request with HTTP ${response.status}`,
    rateLimited ? "PROVIDER_RATE_LIMITED" : "PROVIDER_REJECTED",
    rateLimited || response.status >= 500,
    response.status,
    providerRequestId(response),
    diagnostic,
  );
}

export class DeepSeekModelGateway implements ModelGateway {
  private readonly fetchImplementation: typeof fetch;
  private readonly now: () => number;

  constructor(private readonly config: DeepSeekGatewayConfig) {
    requireNonBlank(config.apiKey, "DeepSeek API key");
    requireNonBlank(config.model, "DeepSeek model");
    this.fetchImplementation = config.fetchImplementation ?? fetch;
    this.now = config.now ?? Date.now;
  }

  static fromEnvironment(
    environment: NodeJS.ProcessEnv = process.env,
    dependencies: Omit<DeepSeekGatewayConfig, "apiKey" | "model"> = {},
  ): DeepSeekModelGateway {
    return new DeepSeekModelGateway({
      apiKey: nonBlankEnvironmentValue(environment, "DEEPSEEK_API_KEY"),
      model: nonBlankEnvironmentValue(environment, "DEEPSEEK_MODEL"),
      ...dependencies,
    });
  }

  async complete(request: ModelRequest): Promise<ModelResponse> {
    const invocationId = crypto.randomUUID();
    const startedAt = this.now();
    const validationErrors = validateModelRequest(request);
    if (validationErrors.length > 0) {
      const error = new ModelGatewayError(
        `Invalid model request: ${validationErrors.join("; ")}`,
        "INVALID_REQUEST",
        false,
      );
      await this.recordFailure(invocationId, request, startedAt, error);
      throw error;
    }

    let timedOut = false;
    const abortController = new AbortController();
    const timeout = setTimeout(() => {
      timedOut = true;
      abortController.abort();
    }, request.timeoutMs);

    try {
      const structuredOutput = request.responseFormat === "JSON_SCHEMA";
      const response = await this.fetchImplementation(
        structuredOutput ? DEEPSEEK_BETA_CHAT_COMPLETIONS_URL : DEEPSEEK_CHAT_COMPLETIONS_URL,
        {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: request.messages,
          ...(structuredOutput
            ? {
                tools: [
                  {
                    type: "function",
                    function: {
                      name: request.outputSchema.name,
                      description: `Return ${request.outputSchema.name} schema ${request.outputSchema.version}`,
                      strict: true,
                      parameters: request.outputSchema.jsonSchema,
                    },
                  },
                ],
                tool_choice: {
                  type: "function",
                  function: { name: request.outputSchema.name },
                },
              }
            : {
                response_format: {
                  type: request.responseFormat === "JSON_OBJECT" ? "json_object" : "text",
                },
              }),
          stream: false,
          ...(request.maxOutputTokens !== undefined
            ? { max_tokens: request.maxOutputTokens }
            : {}),
          ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
          ...(request.thinking !== undefined ? { thinking: { type: request.thinking } } : {}),
        }),
          signal: abortController.signal,
        },
      );
      if (!response.ok) {
        throw await providerErrorForResponse(response);
      }

      let body: unknown;
      try {
        body = await response.json();
      } catch {
        throw new ModelGatewayError(
          "Model provider returned a non-JSON response",
          "MALFORMED_RESPONSE",
          false,
          response.status,
        );
      }
      const completion = parseCompletion(body, request);
      const result: ModelResponse = {
        invocationId,
        provider: "DEEPSEEK",
        model: completion.model,
        outputText: completion.outputText,
        finishReason: completion.finishReason,
        latencyMs: Math.max(0, this.now() - startedAt),
        ...(completion.providerRequestId !== undefined
          ? { providerRequestId: completion.providerRequestId }
          : {}),
        ...(completion.usage !== undefined ? { usage: completion.usage } : {}),
      };
      await this.record({
        invocationId,
        taskId: request.taskId,
        purpose: request.purpose,
        promptVersion: request.promptVersion,
        fallback: request.fallback,
        provider: "DEEPSEEK",
        model: result.model,
        responseFormat: request.responseFormat,
        outputSchema: {
          name: request.outputSchema.name,
          version: request.outputSchema.version,
        },
        outcome: "SUCCEEDED",
        latencyMs: result.latencyMs,
        providerStatus: response.status,
        ...(result.usage !== undefined ? { usage: result.usage } : {}),
        ...(result.providerRequestId !== undefined
          ? { providerRequestId: result.providerRequestId }
          : {}),
      });
      return result;
    } catch (caught) {
      const error = this.normalizeError(caught, timedOut);
      await this.recordFailure(invocationId, request, startedAt, error);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private normalizeError(caught: unknown, timedOut: boolean): ModelGatewayError {
    if (caught instanceof ModelGatewayError) {
      return caught;
    }
    if (timedOut) {
      return new ModelGatewayError(
        "DeepSeek completion request timed out",
        "TIMEOUT",
        true,
      );
    }
    return new ModelGatewayError("DeepSeek completion request failed at the network layer", "NETWORK", true);
  }

  private async recordFailure(
    invocationId: string,
    request: ModelRequest,
    startedAt: number,
    error: ModelGatewayError,
  ): Promise<void> {
    await this.record({
      invocationId,
      taskId: request.taskId,
      purpose: request.purpose,
      promptVersion: request.promptVersion,
      fallback: request.fallback,
      provider: "DEEPSEEK",
      model: this.config.model,
      responseFormat: request.responseFormat,
      outputSchema: {
        name: request.outputSchema.name,
        version: request.outputSchema.version,
      },
      outcome: "FAILED",
      latencyMs: Math.max(0, this.now() - startedAt),
      errorCode: error.code,
      ...(error.providerStatus !== undefined ? { providerStatus: error.providerStatus } : {}),
      ...(error.providerRequestId ? { providerRequestId: error.providerRequestId } : {}),
      ...(error.providerError ? { providerError: error.providerError } : {}),
    });
  }

  private async record(record: ModelInvocationRecord): Promise<void> {
    try {
      await this.config.observer?.observe(record);
    } catch {
      // Observability failures must not silently turn a provider success into an application failure.
    }
  }
}
