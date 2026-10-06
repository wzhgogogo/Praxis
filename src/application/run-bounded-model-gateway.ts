import { AsyncLocalStorage } from "node:async_hooks";

import type { ModelGateway, ModelRequest, ModelResponse } from "../core/model/contracts.js";

interface ModelRunScope {
  taskId: string;
  calls: number;
  startedAt: number;
  deadlineAt: number;
  controller: AbortController;
  holds: number;
  timer: ReturnType<typeof setTimeout>;
  finished: boolean;
}
export interface ModelRunUsage { calls: number; startedAt: number; deadlineAt: number; elapsedMs: number; }

/** Applies the H001 whole-read deadline and model ceiling from before semantic work through the Agent loop. */
export class RunBoundedModelGateway implements ModelGateway {
  private readonly scopes = new AsyncLocalStorage<ModelRunScope>();
  private readonly active = new Map<string, ModelRunScope>();
  private readonly completed = new Map<string, ModelRunUsage>();

  constructor(private readonly delegate: ModelGateway, private readonly maxCalls: number, private readonly timeoutMs: number) {}

  async run<T>(taskId: string, work: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const startedAt = Date.now();
    const controller = new AbortController();
    const scope: ModelRunScope = {
      taskId, calls: 0, startedAt, deadlineAt: startedAt + this.timeoutMs, controller,
      holds: 0, finished: false,
      timer: setTimeout(() => controller.abort(Object.assign(new Error("Read-run deadline reached"), { code: "RUN_DEADLINE_EXCEEDED" })), this.timeoutMs),
    };
    this.active.set(taskId, scope);
    try {
      return await this.scopes.run(scope, () => work(controller.signal));
    } finally {
      if (scope.holds === 0) this.finish(scope);
    }
  }

  /** Keeps this run's deadline active for work launched by the persistent read lifecycle. */
  hold(): () => void {
    const scope = this.scopes.getStore();
    if (!scope || scope.finished) return () => undefined;
    scope.holds += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      scope.holds -= 1;
      if (scope.holds === 0) this.finish(scope);
    };
  }

  usage(taskId: string): ModelRunUsage | undefined {
    const scope = this.active.get(taskId);
    return scope ? { calls: scope.calls, startedAt: scope.startedAt, deadlineAt: scope.deadlineAt, elapsedMs: Math.max(0, Date.now() - scope.startedAt) } : this.completed.get(taskId);
  }

  async complete(request: ModelRequest): Promise<ModelResponse> {
    const scope = this.scopes.getStore();
    if (!scope) return this.delegate.complete(request);
    if (scope.controller.signal.aborted || Date.now() >= scope.deadlineAt) throw Object.assign(new Error("Read-run deadline reached before model call"), { code: "RUN_DEADLINE_EXCEEDED" });
    if (scope.calls >= this.maxCalls) throw Object.assign(new Error("Read-run model-call ceiling reached"), { code: "MODEL_CALL_BUDGET_EXHAUSTED" });
    scope.calls += 1; // Failed provider attempts consume the same authorized budget.
    return this.delegate.complete({ ...request, timeoutMs: Math.min(request.timeoutMs, scope.deadlineAt - Date.now()) });
  }

  private finish(scope: ModelRunScope): void {
    if (scope.finished) return;
    scope.finished = true;
    clearTimeout(scope.timer);
    if (this.active.get(scope.taskId) === scope) this.active.delete(scope.taskId);
    this.completed.set(scope.taskId, { calls: scope.calls, startedAt: scope.startedAt, deadlineAt: scope.deadlineAt, elapsedMs: Math.max(0, Date.now() - scope.startedAt) });
  }
}
