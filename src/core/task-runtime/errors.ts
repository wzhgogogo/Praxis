export class StaleTaskVersionError extends Error {
  constructor(
    readonly expectedVersion: number,
    readonly actualVersion: number,
  ) {
    super(`Stale task version: expected ${expectedVersion}, actual ${actualVersion}`);
    this.name = "StaleTaskVersionError";
  }
}

export class TaskDefinitionVersionMismatchError extends Error {
  constructor(
    readonly storedVersion: string,
    readonly currentVersion: string,
  ) {
    super(
      `Task definition version mismatch: stored ${storedVersion}, current ${currentVersion}`,
    );
    this.name = "TaskDefinitionVersionMismatchError";
  }
}
