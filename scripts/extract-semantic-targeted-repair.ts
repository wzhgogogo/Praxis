/**
 * Read-only extractor for the 2026-09-18 exposed semantic-repair diagnostic.
 *
 * It intentionally writes only stdout.  It neither calls a provider nor
 * reinterprets a model response.  The `finalDraft` field is null because the
 * original semantic-only runner never dispatched its Proposals to a Compiler
 * or Reducer; a later reconstruction must not be represented as an original
 * execution record.
 *
 * Usage:
 *   node --import tsx scripts/extract-semantic-targeted-repair.ts > details.json
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

type JsonRecord = Record<string, unknown>;

const artifactPath = resolve(
  ".eval-artifacts/restaurant-semantic-targeted-repair/semantic-targeted-repair-2026-09-18T05-51-04-450Z.result.json",
);

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown, label: string): JsonRecord {
  if (!isRecord(value)) throw new Error(`Expected ${label} to be an object`);
  return value;
}

function asArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`Expected ${label} to be an array`);
  return value;
}

function taskParts(taskId: string): { versionLabel: string; sampleId: string; repeat: number } {
  const match = taskId.match(/:(A_V17|B_V19):(.+):(\d+)$/);
  if (!match) throw new Error(`Unexpected captured task id: ${taskId}`);
  return { versionLabel: match[1]!, sampleId: match[2]!, repeat: Number(match[3]) };
}

function userMessage(messages: unknown): { message: string; context: string | null } {
  const list = asArray(messages, "request.messages").map((value) => asRecord(value, "message"));
  const system = list.find((message) => message.role === "system")?.content;
  const user = list.find((message) => message.role === "user")?.content;
  if (typeof user !== "string") throw new Error("Missing captured user message");
  const prefix = "User restaurant message as JSON string: ";
  const message = user.startsWith(prefix) ? JSON.parse(user.slice(prefix.length)) : user;
  if (typeof message !== "string") throw new Error("Captured user payload is not a string");
  const contextMatch = typeof system === "string"
    ? system.match(/Current authoritative context[\s\S]*?:\n([\s\S]*?)\n\nUse YYYY-MM-DD/)
    : null;
  return { message, context: contextMatch?.[1] ?? null };
}

function mainRecord(semantic: JsonRecord, versionLabel: string, sampleId: string, repeat: number): JsonRecord {
  const group = asRecord(semantic[versionLabel === "A_V17" ? "A" : "B"], `semantic.${versionLabel}`);
  const record = asArray(group.records, "semantic records")
    .map((value) => asRecord(value, "semantic record"))
    .find((value) => value.sampleId === sampleId && value.repeat === repeat);
  if (!record) throw new Error(`Missing saved result for ${versionLabel}/${sampleId}/${repeat}`);
  return record;
}

async function main(): Promise<void> {
  const artifact = asRecord(JSON.parse(await readFile(artifactPath, "utf8")), "artifact");
  const semantic = asRecord(artifact.semantic, "semantic");
  const calls = asArray(artifact.capturedCalls, "capturedCalls")
    .map((value) => asRecord(value, "captured call"))
    .filter((call) => call.label === "SEMANTIC");
  if (calls.length !== 48) throw new Error(`Expected 48 captured semantic calls, got ${calls.length}`);

  const details = calls.map((call, index) => {
    const request = asRecord(call.request, "request");
    const response = asRecord(call.response, "response");
    const taskId = String(request.taskId);
    const parts = taskParts(taskId);
    const saved = mainRecord(semantic, parts.versionLabel, parts.sampleId, parts.repeat);
    const savedResult = asRecord(saved.result, "saved result");
    const rawOutput = String(response.outputText);
    const decodedRawProposal = JSON.parse(rawOutput);
    const proposal = asRecord(savedResult.proposal, "saved proposal");
    if (JSON.stringify(decodedRawProposal) !== JSON.stringify(proposal)) {
      throw new Error(`Raw output differs from stored Proposal for ${taskId}`);
    }
    const message = userMessage(request.messages);
    return {
      captureIndex: index,
      taskId,
      ...parts,
      userInput: message.message,
      savedAuthoritativeContext: message.context,
      request: {
        promptVersion: request.promptVersion,
        purpose: request.purpose,
        responseFormat: request.responseFormat,
        timeoutMs: request.timeoutMs,
        maxOutputTokens: request.maxOutputTokens,
        temperature: request.temperature,
        thinking: request.thinking,
      },
      response: {
        invocationId: response.invocationId,
        provider: response.provider,
        model: response.model,
        finishReason: response.finishReason,
        latencyMs: response.latencyMs,
        usage: response.usage,
        rawOutput,
      },
      proposal,
      finalDraft: null,
      finalDraftStatus: "NOT_CAPTURED: semantic-only runner did not invoke Compiler or Reducer",
      originalRunnerAssessment: saved.assessment,
    };
  });

  process.stdout.write(`${JSON.stringify({
    sourceArtifact: artifactPath,
    sourceRunId: artifact.runId,
    preservedLimit: "After JSON parsing, raw provider output and the saved Interpreter Proposal are structurally identical for each call; no Compiler/Reducer final Draft exists in this artifact.",
    scorerLimit: "The original criterion scorer compares normalized phrase containment and strength only. Expected polarity, condition order, extra criteria, and final Draft are not scored.",
    details,
  }, null, 2)}\n`);
}

void main();
