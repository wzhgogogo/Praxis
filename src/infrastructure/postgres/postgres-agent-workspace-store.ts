import { randomUUID } from "node:crypto";
import { StaleTaskVersionError } from "../../core/task-runtime/errors.js";
import type { BookingDepartureReceipt, BookingFeedbackAnswer } from "../../domains/restaurant/booking-feedback.js";
import type { SqlExecutor } from "./sql-database.js";
import type { ConversationMessage, WorkspaceUser } from "../../application/agent-workspace.js";
import type { SqlDatabase } from "./sql-database.js";

interface UserRow {
  id: string;
  display_name: string;
}

interface ConversationRow {
  id: string;
  user_id: string;
  root_task_id: string;
  create_request_id: string;
  title: string;
  created_at: unknown;
  updated_at: unknown;
}

interface MessageRow {
  id: string;
  role: ConversationMessage["role"];
  content: string;
  created_at: unknown;
}

export interface ConversationRecord {
  id: string;
  userId: string;
  rootTaskId: string;
  createRequestId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

function toIsoString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return new Date(value).toISOString();
  throw new Error(`Unsupported PostgreSQL timestamp value: ${String(value)}`);
}

function conversation(row: ConversationRow): ConversationRecord {
  return {
    id: row.id,
    userId: row.user_id,
    rootTaskId: row.root_task_id,
    createRequestId: row.create_request_id,
    title: row.title,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

interface DepartureRow {
  id:string; candidate_id:string; offer_id:string; provider:"TABELOG"|"TABLECHECK";
  departed_at:unknown; prompted_at:unknown|null; answer:BookingFeedbackAnswer|null; answered_at:unknown|null;
}
function departure(row:DepartureRow,caseId:string):BookingDepartureReceipt {
  return {id:row.id,caseId,candidateId:row.candidate_id,offerId:row.offer_id,provider:row.provider,
    departedAt:toIsoString(row.departed_at),provenance:"USER_REPORTED",
    ...(row.prompted_at ? {promptedAt:toIsoString(row.prompted_at)} : {}),
    ...(row.answer ? {answer:row.answer} : {}),...(row.answered_at ? {answeredAt:toIsoString(row.answered_at)} : {})};
}
async function lockBookingCase(transaction:SqlExecutor,userId:string,caseId:string) {
  const result=await transaction.query<{id:string;version:number}>(
    `SELECT c.id, t.version FROM conversations c JOIN tasks t ON t.id=c.root_task_id
     WHERE c.root_task_id=$1 AND c.user_id=$2 FOR UPDATE OF c, t`,[caseId,userId]);
  if(!result.rows[0])throw new Error("Booking Case is not available");
  return result.rows[0];
}

export class PostgresAgentWorkspaceStore {
  constructor(private readonly database: SqlDatabase) {}

  async upsertUser(user: WorkspaceUser, now: string): Promise<void> {
    await this.database.query(
      `INSERT INTO workspace_users (id, display_name, created_at, updated_at)
       VALUES ($1, $2, $3, $3)
       ON CONFLICT (id) DO UPDATE
       SET display_name = EXCLUDED.display_name, updated_at = EXCLUDED.updated_at`,
      [user.id, user.displayName, now],
    );
  }

  async createSession(input: {
    tokenHash: string;
    userId: string;
    expiresAt: string;
    createdAt: string;
  }): Promise<void> {
    await this.database.query(
      `INSERT INTO workspace_sessions (token_hash, user_id, expires_at, created_at)
       VALUES ($1, $2, $3, $4)`,
      [input.tokenHash, input.userId, input.expiresAt, input.createdAt],
    );
  }

  async findSessionUser(tokenHash: string, now: string): Promise<WorkspaceUser | null> {
    const result = await this.database.query<UserRow>(
      `SELECT user_record.id, user_record.display_name
       FROM workspace_sessions AS session
       JOIN workspace_users AS user_record ON user_record.id = session.user_id
       WHERE session.token_hash = $1 AND session.expires_at > $2`,
      [tokenHash, now],
    );
    const row = result.rows[0];
    return row ? { id: row.id, displayName: row.display_name } : null;
  }

  async createConversation(input: {
    id: string;
    userId: string;
    rootTaskId: string;
    createRequestId: string;
    title: string;
    now: string;
  }): Promise<ConversationRecord> {
    const result = await this.database.query<ConversationRow>(
      `INSERT INTO conversations (
         id, user_id, root_task_id, create_request_id, title, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $6)
       RETURNING id, user_id, root_task_id, create_request_id, title, created_at, updated_at`,
      [input.id, input.userId, input.rootTaskId, input.createRequestId, input.title, input.now],
    );
    return conversation(result.rows[0]!);
  }

  async findConversationByCreateRequest(
    userId: string,
    requestId: string,
  ): Promise<ConversationRecord | null> {
    const result = await this.database.query<ConversationRow>(
      `SELECT id, user_id, root_task_id, create_request_id, title, created_at, updated_at
       FROM conversations
       WHERE user_id = $1 AND create_request_id = $2`,
      [userId, requestId],
    );
    return result.rows[0] ? conversation(result.rows[0]) : null;
  }

  async findConversationForUser(
    userId: string,
    conversationId: string,
  ): Promise<ConversationRecord | null> {
    const result = await this.database.query<ConversationRow>(
      `SELECT id, user_id, root_task_id, create_request_id, title, created_at, updated_at
       FROM conversations
       WHERE id = $1 AND user_id = $2`,
      [conversationId, userId],
    );
    return result.rows[0] ? conversation(result.rows[0]) : null;
  }

  async findConversationByTaskForUser(
    userId: string,
    taskId: string,
  ): Promise<ConversationRecord | null> {
    const result = await this.database.query<ConversationRow>(
      `SELECT id, user_id, root_task_id, create_request_id, title, created_at, updated_at
       FROM conversations
       WHERE root_task_id = $1 AND user_id = $2`,
      [taskId, userId],
    );
    return result.rows[0] ? conversation(result.rows[0]) : null;
  }

  async listConversationsForUser(userId: string): Promise<ConversationRecord[]> {
    const result = await this.database.query<ConversationRow>(
      `SELECT id, user_id, root_task_id, create_request_id, title, created_at, updated_at
       FROM conversations
       WHERE user_id = $1
       ORDER BY updated_at DESC, id ASC`,
      [userId],
    );
    return result.rows.map(conversation);
  }

  async appendMessage(input: {
    id: string;
    conversationId: string;
    role: ConversationMessage["role"];
    content: string;
    requestId: string;
    createdAt: string;
  }): Promise<void> {
    await this.database.transaction(async (transaction) => {
      await transaction.query(
        `INSERT INTO conversation_messages (
           id, conversation_id, role, content, request_id, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (conversation_id, request_id) DO NOTHING`,
        [
          input.id,
          input.conversationId,
          input.role,
          input.content,
          input.requestId,
          input.createdAt,
        ],
      );
      await transaction.query(
        `UPDATE conversations
         SET updated_at = GREATEST(updated_at, $2)
         WHERE id = $1`,
        [input.conversationId, input.createdAt],
      );
    });
  }

  async listMessages(conversationId: string): Promise<ConversationMessage[]> {
    const result = await this.database.query<MessageRow>(
      `SELECT id, role, content, created_at
       FROM conversation_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC, id ASC`,
      [conversationId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      createdAt: toIsoString(row.created_at),
    }));
  }
  async recordBookingDeparture(input:{userId:string;caseId:string;expectedVersion:number;requestId:string;candidateId:string;offerId:string;provider:"TABELOG"|"TABLECHECK";now:string}):Promise<BookingDepartureReceipt> {
    return this.database.transaction(async transaction=>{
      const record=await lockBookingCase(transaction,input.userId,input.caseId);
      if(record.version!==input.expectedVersion)throw new StaleTaskVersionError(input.expectedVersion,record.version);
      const prior=await transaction.query<DepartureRow>(`SELECT * FROM restaurant_booking_departures WHERE conversation_id=$1 AND request_id=$2`,[record.id,input.requestId]);
      if(prior.rows[0]){
        const row=prior.rows[0];if(row.candidate_id!==input.candidateId||row.offer_id!==input.offerId||row.provider!==input.provider)throw new Error("Departure request ID belongs to another handoff");
        return departure(row,input.caseId);
      }
      const result=await transaction.query<DepartureRow>(`INSERT INTO restaurant_booking_departures
        (id,conversation_id,request_id,candidate_id,offer_id,provider,departed_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,["departure:"+randomUUID(),record.id,input.requestId,input.candidateId,input.offerId,input.provider,input.now]);
      return departure(result.rows[0]!,input.caseId);
    });
  }
  async claimBookingFeedback(userId:string,caseId:string,now:string):Promise<BookingDepartureReceipt|undefined> {
    return this.database.transaction(async transaction=>{
      const record=await lockBookingCase(transaction,userId,caseId);
      const asked=await transaction.query(`SELECT id FROM restaurant_booking_departures WHERE conversation_id=$1 AND prompted_at IS NOT NULL`,[record.id]);
      if(asked.rows.length)return undefined;
      const latest=await transaction.query<DepartureRow>(`SELECT * FROM restaurant_booking_departures WHERE conversation_id=$1 ORDER BY departed_at DESC,id DESC LIMIT 1`,[record.id]);
      if(!latest.rows[0])return undefined;
      const claimed=await transaction.query<DepartureRow>(`UPDATE restaurant_booking_departures SET prompted_at=$2 WHERE id=$1 AND prompted_at IS NULL RETURNING *`,[latest.rows[0].id,now]);
      return claimed.rows[0] ? departure(claimed.rows[0],caseId) : undefined;
    });
  }
  async answerBookingFeedback(input:{userId:string;caseId:string;departureId:string;answer:BookingFeedbackAnswer;now:string}):Promise<BookingDepartureReceipt> {
    return this.database.transaction(async transaction=>{
      const record=await lockBookingCase(transaction,input.userId,input.caseId);
      const result=await transaction.query<DepartureRow>(`SELECT * FROM restaurant_booking_departures WHERE id=$1 AND conversation_id=$2`,[input.departureId,record.id]);
      const row=result.rows[0];if(!row?.prompted_at)throw new Error("Feedback requires this Case's claimed departure prompt");
      if(row.answer){if(row.answer!==input.answer)throw new Error("Feedback has already been recorded");return departure(row,input.caseId);}
      const saved=await transaction.query<DepartureRow>(`UPDATE restaurant_booking_departures SET answer=$2,answered_at=$3 WHERE id=$1 RETURNING *`,[input.departureId,input.answer,input.now]);
      return departure(saved.rows[0]!,input.caseId);
    });
  }

}
