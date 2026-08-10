import { Pool, type PoolClient, type PoolConfig, type QueryResult } from "pg";

import type { SqlDatabase, SqlExecutor, SqlQueryResult } from "./sql-database.js";

class NodePostgresExecutor implements SqlExecutor {
  constructor(private readonly client: Pick<Pool | PoolClient, "query">) {}

  async query<Row>(
    sql: string,
    parameters: readonly unknown[] = [],
  ): Promise<SqlQueryResult<Row>> {
    const result = (await this.client.query(sql, [...parameters])) as QueryResult;
    return {
      rows: result.rows as Row[],
      affectedRows: result.rowCount ?? 0,
    };
  }
}

export class NodePostgresDatabase extends NodePostgresExecutor implements SqlDatabase {
  readonly pool: Pool;

  constructor(config: PoolConfig | Pool) {
    const pool = config instanceof Pool ? config : new Pool(config);
    super(pool);
    this.pool = pool;
  }

  async transaction<Result>(
    callback: (transaction: SqlExecutor) => Promise<Result>,
  ): Promise<Result> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await callback(new NodePostgresExecutor(client));
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  close(): Promise<void> {
    return this.pool.end();
  }
}
