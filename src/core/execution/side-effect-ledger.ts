import type { SideEffectRecord } from "./contracts.js";

export class SideEffectLedger {
  readonly records: SideEffectRecord[] = [];
  private readonly executions = new Map<string, Promise<unknown>>();

  async executeOnce<Result>(
    record: SideEffectRecord,
    perform: () => Promise<Result>,
  ): Promise<{ result: Result; replayed: boolean }> {
    const existing = this.executions.get(record.idempotencyKey);
    if (existing) {
      return {
        result: (await existing) as Result,
        replayed: true,
      };
    }

    this.records.push(record);
    const execution = perform();
    this.executions.set(record.idempotencyKey, execution);
    const result = await execution;
    return { result, replayed: false };
  }
}
