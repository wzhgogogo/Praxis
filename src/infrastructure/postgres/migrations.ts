import type { SqlDatabase } from "./sql-database.js";
import type { SqlExecutor } from "./sql-database.js";

interface PostgresMigration {
  id: string;
  statements?: string[];
  apply?: (transaction: SqlExecutor) => Promise<void>;
}

async function tableHasColumn(
  transaction: SqlExecutor,
  tableName: string,
  columnName: string,
): Promise<boolean> {
  const result = await transaction.query<{ column_name: string }>(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = $1
        AND column_name = $2`,
    [tableName, columnName],
  );
  return result.rows.length > 0;
}

export const POSTGRES_MIGRATIONS: PostgresMigration[] = [
  {
    id: "0001-task-runtime",
    statements: [
      `CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        task_type TEXT NOT NULL,
        definition_version TEXT NOT NULL,
        lifecycle_state TEXT NOT NULL,
        domain_state_schema_version TEXT NOT NULL,
        domain_state JSONB NOT NULL,
        outcome JSONB,
        version INTEGER NOT NULL CHECK (version >= 0),
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS task_events (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        task_version INTEGER NOT NULL CHECK (task_version > 0),
        event_type TEXT NOT NULL,
        payload JSONB NOT NULL,
        occurred_at TIMESTAMPTZ NOT NULL,
        trace JSONB NOT NULL,
        UNIQUE (task_id, task_version)
      )`,
      `CREATE INDEX IF NOT EXISTS task_events_task_time_idx
        ON task_events (task_id, occurred_at, id)`,
      `CREATE TABLE IF NOT EXISTS task_commands (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        task_version INTEGER NOT NULL CHECK (task_version > 0),
        command_type TEXT NOT NULL,
        category TEXT NOT NULL CHECK (
          category IN ('READ', 'PREPARE', 'POLICY', 'EXTERNAL_WRITE', 'VERIFY', 'WAIT')
        ),
        idempotency_key TEXT NOT NULL,
        payload JSONB NOT NULL,
        issued_at TIMESTAMPTZ NOT NULL,
        trace JSONB NOT NULL,
        status TEXT NOT NULL CHECK (
          status IN ('PENDING', 'LEASED', 'SUCCEEDED', 'RECOVERY_REQUIRED')
        ),
        available_at TIMESTAMPTZ NOT NULL,
        lease_owner TEXT,
        lease_expires_at TIMESTAMPTZ,
        delivery_attempts INTEGER NOT NULL DEFAULT 0 CHECK (delivery_attempts >= 0),
        last_error TEXT,
        completed_at TIMESTAMPTZ,
        UNIQUE (task_id, idempotency_key)
      )`,
      `CREATE INDEX IF NOT EXISTS task_commands_pending_idx
        ON task_commands (status, available_at, issued_at, id)`,
      `CREATE INDEX IF NOT EXISTS task_commands_lease_idx
        ON task_commands (status, lease_expires_at)`,
    ],
  },
  {
    id: "0002-recovery-coordinator",
    statements: [
      `ALTER TABLE task_commands
        DROP CONSTRAINT IF EXISTS task_commands_status_check`,
      `ALTER TABLE task_commands
        ADD CONSTRAINT task_commands_status_check CHECK (
          status IN (
            'PENDING', 'LEASED', 'SUCCEEDED',
            'RECOVERY_REQUIRED', 'RECOVERY_DISPATCHED'
          )
        )`,
    ],
  },
  {
    id: "0003-goal-task-graph",
    statements: [
      `CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL CHECK (
          status IN ('ACTIVE', 'ACHIEVED', 'FAILED', 'CANCELLED')
        ),
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS goal_task_memberships (
        goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
        task_id TEXT NOT NULL UNIQUE REFERENCES tasks(id) ON DELETE CASCADE,
        parent_task_id TEXT REFERENCES tasks(id) ON DELETE RESTRICT,
        critical BOOLEAN NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (goal_id, task_id),
        CHECK (parent_task_id IS NULL OR parent_task_id <> task_id)
      )`,
      `CREATE INDEX IF NOT EXISTS goal_task_memberships_parent_idx
        ON goal_task_memberships (goal_id, parent_task_id)`,
      `CREATE TABLE IF NOT EXISTS task_dependencies (
        goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
        upstream_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        downstream_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        condition TEXT NOT NULL CHECK (
          condition IN (
            'UPSTREAM_SUCCEEDED', 'UPSTREAM_TERMINAL',
            'ANY_UPSTREAM_SUCCEEDED', 'ALL_UPSTREAM_SUCCEEDED'
          )
        ),
        created_at TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (goal_id, upstream_task_id, downstream_task_id),
        CHECK (upstream_task_id <> downstream_task_id)
      )`,
      `CREATE INDEX IF NOT EXISTS task_dependencies_downstream_idx
        ON task_dependencies (goal_id, downstream_task_id)`,
    ],
  },
  {
    id: "0004-task-triggers",
    statements: [
      `CREATE TABLE IF NOT EXISTS task_triggers (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        expected_task_version INTEGER CHECK (expected_task_version >= 0),
        idempotency_key TEXT NOT NULL,
        trigger_at TIMESTAMPTZ NOT NULL,
        payload JSONB NOT NULL,
        trace JSONB NOT NULL,
        status TEXT NOT NULL CHECK (
          status IN ('PENDING', 'LEASED', 'DISPATCHED', 'OBSOLETE', 'FAILED')
        ),
        available_at TIMESTAMPTZ NOT NULL,
        lease_owner TEXT,
        lease_expires_at TIMESTAMPTZ,
        delivery_attempts INTEGER NOT NULL DEFAULT 0 CHECK (delivery_attempts >= 0),
        last_error TEXT,
        dispatched_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL,
        UNIQUE (task_id, idempotency_key)
      )`,
      `CREATE INDEX IF NOT EXISTS task_triggers_due_idx
        ON task_triggers (status, trigger_at, available_at, created_at, id)`,
      `CREATE INDEX IF NOT EXISTS task_triggers_lease_idx
        ON task_triggers (status, lease_expires_at)`,
    ],
  },
  {
    id: "0005-agent-workspace",
    statements: [
      `CREATE TABLE IF NOT EXISTS workspace_users (
        id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS workspace_sessions (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES workspace_users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS workspace_sessions_user_idx
        ON workspace_sessions (user_id, expires_at)`,
      `CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES workspace_users(id) ON DELETE CASCADE,
        root_task_id TEXT NOT NULL UNIQUE REFERENCES tasks(id) ON DELETE CASCADE,
        create_request_id TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        UNIQUE (user_id, create_request_id)
      )`,
      `CREATE INDEX IF NOT EXISTS conversations_user_updated_idx
        ON conversations (user_id, updated_at DESC, id)`,
      `CREATE TABLE IF NOT EXISTS conversation_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('USER', 'ASSISTANT')),
        content TEXT NOT NULL,
        request_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        UNIQUE (conversation_id, request_id)
      )`,
      `CREATE INDEX IF NOT EXISTS conversation_messages_time_idx
        ON conversation_messages (conversation_id, created_at, id)`,
    ],
  },
  {
    id: "0006-restaurant-agent-trajectory",
    statements: [
      `CREATE TABLE IF NOT EXISTS restaurant_agent_trajectory_steps (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        step_number INTEGER NOT NULL CHECK (step_number > 0),
        occurred_at TIMESTAMPTZ NOT NULL,
        state_version_before INTEGER NOT NULL CHECK (state_version_before >= 0),
        state_hash_before TEXT NOT NULL,
        evidence_refs JSONB NOT NULL,
        capabilities JSONB NOT NULL,
        agent_action JSONB,
        decision_summary TEXT,
        model_attempt JSONB,
        action_validation JSONB,
        execution_route TEXT,
        observation JSONB,
        state_version_after INTEGER,
        state_hash_after TEXT,
        step_outcome TEXT NOT NULL,
        UNIQUE (task_id, step_number)
      )`,
      `CREATE INDEX IF NOT EXISTS restaurant_agent_trajectory_task_idx
        ON restaurant_agent_trajectory_steps (task_id, step_number)`,
    ],
  },
  {
    id: "0007-restaurant-agent-trajectory-causal-refs",
    async apply(transaction) {
      const tableName = "restaurant_agent_trajectory_steps";
      const hasCausalRefs = await tableHasColumn(transaction, tableName, "causal_refs");
      const hasEvidenceRefs = await tableHasColumn(transaction, tableName, "evidence_refs");

      if (!hasCausalRefs) {
        await transaction.query(`ALTER TABLE ${tableName} ADD COLUMN causal_refs JSONB`);
      }
      if (hasEvidenceRefs) {
        await transaction.query(
          `UPDATE ${tableName}
              SET causal_refs = jsonb_build_object(
                'eventIds', '[]'::jsonb,
                'commandIds', '[]'::jsonb,
                'attemptIds', '[]'::jsonb,
                'evidenceIds', COALESCE(evidence_refs, '[]'::jsonb)
              )
            WHERE causal_refs IS NULL`,
        );
        await transaction.query(`ALTER TABLE ${tableName} DROP COLUMN evidence_refs`);
      }
      await transaction.query(`ALTER TABLE ${tableName} ALTER COLUMN causal_refs SET NOT NULL`);
      await transaction.query(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS proposal_id TEXT`);
    },
  },
];

export async function applyPostgresMigrations(database: SqlDatabase): Promise<void> {
  await database.transaction(async (transaction) => {
    await transaction.query(
      `CREATE TABLE IF NOT EXISTS praxis_schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    );

    for (const migration of POSTGRES_MIGRATIONS) {
      const existing = await transaction.query<{ id: string }>(
        "SELECT id FROM praxis_schema_migrations WHERE id = $1",
        [migration.id],
      );
      if (existing.rows.length > 0) {
        continue;
      }
      for (const statement of migration.statements ?? []) {
        await transaction.query(statement);
      }
      await migration.apply?.(transaction);
      await transaction.query(
        "INSERT INTO praxis_schema_migrations (id) VALUES ($1)",
        [migration.id],
      );
    }
  });
}
