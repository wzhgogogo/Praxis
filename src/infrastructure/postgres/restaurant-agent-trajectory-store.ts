import type { RestaurantAgentAction } from "../../domains/restaurant/agent-action.js";
import type { RestaurantAgentContext } from "../../domains/restaurant/agent-context.js";
import type { RestaurantAgentModelAttempt } from "../../domains/restaurant/agent-decision.js";
import type { RestaurantAgentCapability } from "../../domains/restaurant/restaurant-capabilities.js";
import type { RestaurantActionValidation } from "../../domains/restaurant/action-validator.js";
import type { RestaurantExecutionRoute } from "../../domains/restaurant/contracts.js";
import type { SqlDatabase } from "./sql-database.js";

export interface RestaurantAgentTrajectoryCausalRefs {
  eventIds: string[];
  commandIds: string[];
  attemptIds: string[];
  evidenceIds: string[];
}

export interface RestaurantAgentTrajectoryStep {
  id: string;
  taskId: string;
  stepNumber: number;
  occurredAt: string;
  stateVersionBefore: number;
  stateHashBefore: string;
  causalRefs: RestaurantAgentTrajectoryCausalRefs;
  capabilities: readonly RestaurantAgentCapability[];
  contextSchemaVersion?: RestaurantAgentContext["schemaVersion"];
  decisionContext?: RestaurantAgentContext;
  agentAction?: RestaurantAgentAction;
  decisionSummary?: string;
  modelAttempt?: RestaurantAgentModelAttempt;
  actionValidation?: RestaurantActionValidation;
  executionRoute?: RestaurantExecutionRoute;
  observation?: { type: string; detail: string };
  proposalId?: string;
  stateVersionAfter?: number;
  stateHashAfter?: string;
  stepOutcome:
    | "EXECUTED"
    | "REJECTED"
    | "WAITING_USER"
    | "TERMINAL"
    | "MODEL_FAILURE"
    | "EXECUTION_FAILURE"
    | "TIMEOUT"
    | "STEP_LIMIT"
    | "REJECTION_LIMIT";
}

export interface RestaurantAgentTrajectoryStore {
  append(step: RestaurantAgentTrajectoryStep): Promise<void>;
  list(taskId: string): Promise<RestaurantAgentTrajectoryStep[]>;
}

interface TrajectoryRow {
  id: string;
  task_id: string;
  step_number: number;
  occurred_at: unknown;
  state_version_before: number;
  state_hash_before: string;
  causal_refs: unknown;
  capabilities: unknown;
  context_schema_version: RestaurantAgentContext["schemaVersion"] | null;
  decision_context: unknown | null;
  agent_action: unknown | null;
  decision_summary: string | null;
  model_attempt: unknown | null;
  action_validation: unknown | null;
  execution_route: RestaurantAgentTrajectoryStep["executionRoute"] | null;
  observation: unknown | null;
  proposal_id: string | null;
  state_version_after: number | null;
  state_hash_after: string | null;
  step_outcome: RestaurantAgentTrajectoryStep["stepOutcome"];
}

function parseJson<Value>(value: unknown): Value {
  return (typeof value === "string" ? JSON.parse(value) : structuredClone(value)) as Value;
}

function toIsoString(value: unknown): string {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

export class PostgresRestaurantAgentTrajectoryStore implements RestaurantAgentTrajectoryStore {
  constructor(private readonly database: SqlDatabase) {}

  async append(step: RestaurantAgentTrajectoryStep): Promise<void> {
    await this.database.query(
      `INSERT INTO restaurant_agent_trajectory_steps (
        id, task_id, step_number, occurred_at, state_version_before, state_hash_before,
        causal_refs, capabilities, context_schema_version, decision_context, agent_action, decision_summary, model_attempt,
        action_validation, execution_route, observation, proposal_id, state_version_after, state_hash_after, step_outcome
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10::jsonb, $11::jsonb, $12, $13::jsonb,
        $14::jsonb, $15, $16::jsonb, $17, $18, $19, $20
      )`,
      [
        step.id, step.taskId, step.stepNumber, step.occurredAt, step.stateVersionBefore, step.stateHashBefore,
        JSON.stringify(step.causalRefs), JSON.stringify(step.capabilities), step.contextSchemaVersion ?? null,
        step.decisionContext ? JSON.stringify(step.decisionContext) : null, step.agentAction ? JSON.stringify(step.agentAction) : null,
        step.decisionSummary ?? null, step.modelAttempt ? JSON.stringify(step.modelAttempt) : null,
        step.actionValidation ? JSON.stringify(step.actionValidation) : null, step.executionRoute ?? null,
        step.observation ? JSON.stringify(step.observation) : null, step.proposalId ?? null,
        step.stateVersionAfter ?? null, step.stateHashAfter ?? null, step.stepOutcome,
      ],
    );
  }

  async list(taskId: string): Promise<RestaurantAgentTrajectoryStep[]> {
    const result = await this.database.query<TrajectoryRow>(
      `SELECT id, task_id, step_number, occurred_at, state_version_before, state_hash_before,
              causal_refs, capabilities, context_schema_version, decision_context, agent_action, decision_summary, model_attempt,
              action_validation, execution_route, observation, proposal_id, state_version_after, state_hash_after, step_outcome
         FROM restaurant_agent_trajectory_steps
        WHERE task_id = $1
        ORDER BY step_number ASC`,
      [taskId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      taskId: row.task_id,
      stepNumber: row.step_number,
      occurredAt: toIsoString(row.occurred_at),
      stateVersionBefore: row.state_version_before,
      stateHashBefore: row.state_hash_before,
      causalRefs: parseJson<RestaurantAgentTrajectoryCausalRefs>(row.causal_refs),
      capabilities: parseJson<RestaurantAgentCapability[]>(row.capabilities),
      ...(row.context_schema_version ? { contextSchemaVersion: row.context_schema_version } : {}),
      ...(row.decision_context ? { decisionContext: parseJson<RestaurantAgentContext>(row.decision_context) } : {}),
      ...(row.agent_action ? { agentAction: parseJson<RestaurantAgentAction>(row.agent_action) } : {}),
      ...(row.decision_summary ? { decisionSummary: row.decision_summary } : {}),
      ...(row.model_attempt ? { modelAttempt: parseJson<RestaurantAgentModelAttempt>(row.model_attempt) } : {}),
      ...(row.action_validation ? { actionValidation: parseJson<RestaurantActionValidation>(row.action_validation) } : {}),
      ...(row.execution_route ? { executionRoute: row.execution_route } : {}),
      ...(row.observation ? { observation: parseJson<{ type: string; detail: string }>(row.observation) } : {}),
      ...(row.proposal_id ? { proposalId: row.proposal_id } : {}),
      ...(row.state_version_after !== null ? { stateVersionAfter: row.state_version_after } : {}),
      ...(row.state_hash_after ? { stateHashAfter: row.state_hash_after } : {}),
      stepOutcome: row.step_outcome,
    }));
  }
}

export class InMemoryRestaurantAgentTrajectoryStore implements RestaurantAgentTrajectoryStore {
  readonly steps: RestaurantAgentTrajectoryStep[] = [];

  async append(step: RestaurantAgentTrajectoryStep): Promise<void> {
    if (this.steps.some((existing) => existing.id === step.id)) return;
    this.steps.push(structuredClone(step));
  }

  async list(taskId: string): Promise<RestaurantAgentTrajectoryStep[]> {
    return this.steps.filter((step) => step.taskId === taskId).map((step) => structuredClone(step));
  }
}
