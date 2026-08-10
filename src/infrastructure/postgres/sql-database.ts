export interface SqlQueryResult<Row> {
  rows: Row[];
  affectedRows: number;
}

export interface SqlExecutor {
  query<Row>(
    sql: string,
    parameters?: readonly unknown[],
  ): Promise<SqlQueryResult<Row>>;
}

export interface SqlDatabase extends SqlExecutor {
  transaction<Result>(
    callback: (transaction: SqlExecutor) => Promise<Result>,
  ): Promise<Result>;
}
